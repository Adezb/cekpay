// @ts-nocheck
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cryptographically Secure PRNG Pass Generation using Web Crypto API
export function generateAlphanumericPass(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(array[i] % chars.length);
  }
  return pass;
}

// Server-Side Pass Code Hashing via SHA-256
export async function hashPass(code: string): Promise<string> {
  const normalized = code.trim().toUpperCase();
  const buffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function normalizePhone(phone: any): string {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[\s\-()]/g, '');
  if (!cleaned || !/^\+?\d{7,15}$/.test(cleaned)) return '';
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('+') && !cleaned.startsWith('234')) {
    cleaned = '234' + cleaned;
  }
  return cleaned.replace('+', '');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const action = payload.action || 'send';
    const { phone, email, pass } = payload;

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const msisdn = normalizePhone(phone);
    if (!msisdn) {
      return new Response(
        JSON.stringify({ error: 'Valid phone number is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing Supabase environment variables.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    });

    // ── Action 1: Verify Server-Side OTP ─────────────────────────
    if (action === 'verify') {
      if (!pass) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Verification Pass code is required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const attemptKey = `ATTEMPTS_${msisdn}`;
      const { data: attemptRecord } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('phone', attemptKey)
        .maybeSingle();

      if (attemptRecord) {
        const isExpired = new Date(attemptRecord.expires_at).getTime() < Date.now();
        if (isExpired) {
          await supabaseAdmin.from('otp_codes').delete().eq('phone', attemptKey);
        } else if ((attemptRecord.attempts || 0) >= 5) {
          const remainingMins = Math.ceil((new Date(attemptRecord.expires_at).getTime() - Date.now()) / 60000);
          return new Response(
            JSON.stringify({ valid: false, error: `Too many failed verification attempts. Account temporarily locked for ${remainingMins} minute(s).` }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { data: otpRecord, error: fetchErr } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('phone', msisdn)
        .maybeSingle();

      if (fetchErr || !otpRecord) {
        return new Response(
          JSON.stringify({ valid: false, error: 'OTP not requested or expired. Please request a new pass.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check Expiration (10 mins)
      if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', msisdn);
        return new Response(
          JSON.stringify({ valid: false, error: 'Pass expired. Please request a new pass.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const incomingHash = await hashPass(pass);
      const isMatch = otpRecord.code === incomingHash;

      if (!isMatch) {
        const currentAttempts = (attemptRecord && new Date(attemptRecord.expires_at).getTime() >= Date.now())
          ? (attemptRecord.attempts || 0)
          : 0;
        const nextAttempts = currentAttempts + 1;
        const windowExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        await supabaseAdmin.from('otp_codes').upsert({
          phone: attemptKey,
          code: 'ATTEMPT_TRACKER',
          attempts: nextAttempts,
          expires_at: windowExpiresAt,
          created_at: new Date().toISOString(),
        });

        const remaining = Math.max(0, 5 - nextAttempts);
        return new Response(
          JSON.stringify({ valid: false, error: `Invalid verification code. (${remaining} attempt(s) remaining)` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Valid OTP: Consume & Delete Record (including attempt tracker)
      await supabaseAdmin.from('otp_codes').delete().in('phone', [msisdn, attemptKey]);

      return new Response(
        JSON.stringify({ valid: true, message: 'Pass verified successfully.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Action 2: Dispatch Server-Side OTP ───────────────────────

    // ── Rate Limiting / Cooldown Guard (60s Cooldown per Phone) ───
    const { data: existingOtp } = await supabaseAdmin
      .from('otp_codes')
      .select('created_at')
      .eq('phone', msisdn)
      .maybeSingle();

    if (existingOtp?.created_at) {
      const elapsedSeconds = (Date.now() - new Date(existingOtp.created_at).getTime()) / 1000;
      if (elapsedSeconds < 60) {
        const waitTime = Math.ceil(60 - elapsedSeconds);
        return new Response(
          JSON.stringify({ error: `Rate limit exceeded. Please wait ${waitTime} seconds before requesting a new Pass.` }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const passCode = generateAlphanumericPass(6);
    const passHash = await hashPass(passCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store Hashed OTP in database
    const { error: dbErr } = await supabaseAdmin
      .from('otp_codes')
      .upsert({
        phone: msisdn,
        code: passHash,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

    if (dbErr) {
      console.error('Failed to save OTP to database:', dbErr);
      return new Response(
        JSON.stringify({ success: false, error: dbErr.message || 'Failed to generate verification Pass. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strictly Dispatch SMS via BulkSMSNigeria
    const bulkSmsKey = Deno.env.get('BULKSMSNIGERIA_API_KEY');
    let smsStatus = 'skipped';
    if (bulkSmsKey) {
      try {
        const smsRes = await fetch('https://www.bulksmsnigeria.com/api/v2/sms', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${bulkSmsKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            from: 'CEKPay',
            to: msisdn,
            body: `Your CEKPay Pass is ${passCode}`,
            dnd: 2,
          }),
        });

        const smsDataText = await smsRes.text();
        let smsDataJson: any = {};
        try {
          smsDataJson = JSON.parse(smsDataText);
        } catch (_) {}

        if (!smsRes.ok || (smsDataJson.data && smsDataJson.data.status !== 'success') || smsDataText.toLowerCase().includes('error')) {
          console.error('BulkSMSNigeria Delivery Failed:', smsDataText);
          smsStatus = 'failed';
        } else {
          console.log('BulkSMSNigeria Success:', smsDataText);
          smsStatus = 'delivered';
        }
      } catch (smsErr) {
        console.error('BulkSMSNigeria dispatch error:', smsErr);
        smsStatus = 'failed';
      }
    } else {
      console.warn('BULKSMSNIGERIA_API_KEY is missing in environment variables.');
    }

    // Dispatch Email via Resend
    const resendKey = Deno.env.get('CEKPAY_PROD_EMAIL_KEY');
    let emailStatus = 'skipped';
    if (resendKey && email) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'CEKPay Authentication <security@mail.cekpay.com.ng>',
            to: [email],
            subject: 'Your CEKPay Security Pass',
            html: `
              <div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; color: #0f172a;">
                <h2 style="color: #1e3a8a;">CEKPay Security Verification</h2>
                <p>Use the single-use Pass code below to complete your authentication:</p>
                <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 16px; background-color: #1e3a8a; color: #ffffff; text-align: center; border-radius: 8px; margin: 20px 0;">
                  ${passCode}
                </div>
                <p style="font-size: 12px; color: #64748b;">If you did not request this pass, please ignore this email.</p>
              </div>
            `,
          }),
        });
        emailStatus = emailRes.ok ? 'delivered' : 'failed';
      } catch (emailErr) {
        console.error('Resend dispatch error:', emailErr);
        emailStatus = 'failed';
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pass dispatched successfully.',
        delivery: { sms: smsStatus, email: emailStatus },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('auth-otp-delivery unhandled error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
