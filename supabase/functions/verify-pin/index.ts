// @ts-nocheck
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function sanitizeMSISDN(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+234')) {
    cleaned = '234' + cleaned.slice(4);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.slice(1);
  }
  return cleaned;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, phone, pin } = await req.json();

    if ((!userId && !phone) || !pin) {
      return new Response(
        JSON.stringify({ error: 'User ID or Phone number and 4-digit PIN are required.', valid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || serviceRoleKey || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing Supabase environment variables.', valid: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // JWT Auth & Subject Extraction for Authenticated Requests
    const authHeader = req.headers.get('Authorization');
    let authenticatedUser: any = null;

    if (authHeader) {
      const supabaseClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseClient.auth.getUser();
      authenticatedUser = user;
    }

    // Require authentication if requesting PIN verification by userId without phone
    if (!phone && userId && !authenticatedUser) {
      return new Response(
        JSON.stringify({ error: 'Authentication required to verify PIN by user ID.', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IDOR Protection: Prevent verifying PIN for another user's account
    if (authenticatedUser && userId && userId !== authenticatedUser.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Cannot verify PIN for another user account.', valid: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query profile by userId or sanitized phone
    let query = supabaseAdmin.from('profiles').select('id, email, phone, first_name, last_name, pin_hash, role, is_banned');

    if (phone) {
      query = query.eq('phone', sanitizeMSISDN(phone));
    } else {
      query = query.eq('id', authenticatedUser ? authenticatedUser.id : userId);
    }

    const { data: profile, error: profileError } = await query.maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User account not found.', valid: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce JWT subject match if authenticated caller is testing phone
    if (authenticatedUser && profile.id !== authenticatedUser.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Cannot verify PIN for another user account.', valid: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.is_banned) {
      return new Response(
        JSON.stringify({ error: 'Account suspended. Please contact support.', valid: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.pin_hash) {
      return new Response(
        JSON.stringify({ error: 'PIN has not been created yet.', valid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Rate Limiting / Lockout Guard (Max 5 Failed Attempts / 15-Min Lockout) ──
    const lockKey = `PIN_LOCK_${profile.id}`;
    const { data: lockRecord } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', lockKey)
      .maybeSingle();

    if (lockRecord) {
      const isExpired = new Date(lockRecord.expires_at).getTime() < Date.now();
      if (isExpired) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', lockKey);
      } else if ((lockRecord.attempts || 0) >= 5) {
        const remainingMins = Math.ceil((new Date(lockRecord.expires_at).getTime() - Date.now()) / 60000);
        return new Response(
          JSON.stringify({
            error: `Too many incorrect PIN attempts. Account temporarily locked for ${remainingMins} minute(s).`,
            valid: false,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify PIN using server-side bcrypt
    const isValid = await compare(pin, profile.pin_hash);

    if (!isValid) {
      const currentAttempts = (lockRecord && new Date(lockRecord.expires_at).getTime() >= Date.now())
        ? (lockRecord.attempts || 0)
        : 0;
      const nextAttempts = currentAttempts + 1;
      const lockExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await supabaseAdmin.from('otp_codes').upsert({
        phone: lockKey,
        code: 'LOCK',
        attempts: nextAttempts,
        expires_at: lockExpiresAt,
        created_at: new Date().toISOString(),
      });

      const remaining = Math.max(0, 5 - nextAttempts);
      const errMsg = nextAttempts >= 5
        ? 'Too many incorrect PIN attempts. Account temporarily locked for 15 minutes.'
        : `Incorrect 4-digit PIN. (${remaining} attempt(s) remaining before lockout)`;

      return new Response(
        JSON.stringify({ error: errMsg, valid: false }),
        { status: nextAttempts >= 5 ? 429 : 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Valid PIN: Clear any active lock record
    if (lockRecord) {
      await supabaseAdmin.from('otp_codes').delete().eq('phone', lockKey);
    }

    // Server-Side Session Minting via Admin API & OTP Verification
    let session = null;
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: profile.email,
      });

      if (linkError || !linkData?.properties?.email_otp) {
        console.error('Failed to generate session link:', linkError);
        return new Response(
          JSON.stringify({ error: linkError?.message || 'Failed to generate authentication session link.', valid: false }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: otpData, error: otpError } = await anonClient.auth.verifyOtp({
        email: profile.email,
        token: linkData.properties.email_otp,
        type: 'email',
      });

      if (otpError || !otpData?.session) {
        console.error('Failed to verify OTP session:', otpError);
        return new Response(
          JSON.stringify({ error: otpError?.message || 'Failed to establish active Supabase authentication session.', valid: false }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      session = otpData.session;
    } catch (mintErr: any) {
      console.error('Session minting error:', mintErr);
      return new Response(
        JSON.stringify({ error: mintErr?.message || 'Authentication session generation failed.', valid: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        session,
        user: {
          id: profile.id,
          email: profile.email,
          phone: profile.phone,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role,
          isBanned: profile.is_banned,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error', valid: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
