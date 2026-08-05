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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

async function verifyPaystackSignature(body: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(body);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const calculatedHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return timingSafeEqual(calculatedHex, signature.toLowerCase());
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing Supabase environment variables.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const rawBody = await req.text();
    const paystackSignature = req.headers.get('x-paystack-signature');

    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY is missing from environment.');
      return new Response(JSON.stringify({ error: 'Paystack Webhook gateway is unconfigured on server.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isValidSig = await verifyPaystackSignature(rawBody, paystackSignature, paystackSecretKey);
    if (!isValidSig) {
      console.warn('Invalid Paystack webhook signature detected.');
      return new Response(JSON.stringify({ error: 'Invalid Paystack HMAC signature digest.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data || {};

    if (event === 'charge.success') {
      const reference = data.reference;
      const amountInKobo = data.amount || 0;
      const amountInNaira = amountInKobo / 100;
      const customerCode = data.customer?.customer_code;

      if (!reference || amountInNaira <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid event payload data.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      let { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('paystack_customer_code', customerCode)
        .maybeSingle();

      if (!wallet) {
        const email = data.customer?.email;
        if (email) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (profile) {
            const { data: w } = await supabaseAdmin
              .from('wallets')
              .select('*')
              .eq('user_id', profile.id)
              .maybeSingle();
            wallet = w;
          }
        }
      }

      if (!wallet) {
        return new Response(
          JSON.stringify({ error: 'Target wallet not found for Paystack customer.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ── Atomic Paystack Credit RPC (Idempotency + Transaction Insert + Balance Increment) ──
      const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('process_paystack_credit', {
        p_user_id: wallet.user_id,
        p_reference: reference,
        p_amount: amountInNaira,
        p_channel: 'Paystack',
        p_plan_name: 'Wallet Deposit',
      });

      if (rpcErr) {
        console.error('RPC process_paystack_credit error:', rpcErr);
        return new Response(
          JSON.stringify({ error: 'Failed to process wallet credit RPC.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (rpcResult?.status === 'ALREADY_PROCESSED') {
        return new Response(
          JSON.stringify({ status: true, message: rpcResult.message || 'Webhook reference already credited.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newBalance = rpcResult?.new_balance;

      // OneSignal Push Notification Dispatch
      const oneSignalKey = Deno.env.get('CEKPAY_PROD_ONESIGNAL_KEY');
      const oneSignalAppId = Deno.env.get('VITE_ONESIGNAL_APP_ID');
      if (oneSignalKey && oneSignalAppId) {
        try {
          await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${oneSignalKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              app_id: oneSignalAppId,
              include_aliases: { external_id: [wallet.user_id] },
              target_channel: 'push',
              headings: { en: 'Wallet Funded! 💳' },
              contents: { en: `Your CEKPay wallet has been credited with ₦${amountInNaira.toLocaleString()}. New Balance: ₦${newBalance?.toLocaleString() || ''}` },
            }),
          });
        } catch (pushErr) {
          console.error('OneSignal push notification error:', pushErr);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Wallet credited successfully.', newBalance }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ status: 'ignored', message: 'Non-charge event received.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
