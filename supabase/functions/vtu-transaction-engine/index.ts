// @ts-nocheck
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildTxnReference(service: string): string {
  const code = service.slice(0, 3).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CEK-${code}-${dateStr}-${rand}`;
}

function isValidAmount(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val) && val > 0 && val <= 1_000_000;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing Supabase environment variables.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strict JWT Auth & Subject Extraction (IDOR Prevention)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized session or invalid authentication token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id; // Derived exclusively from verified JWT

    const { service, amount, recipient, provider, planName, pin, promoCode } = await req.json();

    if (!service || !recipient || !pin) {
      return new Response(
        JSON.stringify({ error: 'Service, recipient, and 4-digit PIN are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidAmount(amount)) {
      return new Response(
        JSON.stringify({ error: 'Invalid purchase amount. Amount must be a positive number (max ₦1,000,000).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedAmount = Math.round(amount * 100) / 100;

    // Pre-Flight Credential & Mock Flag Check
    const toppaKey = Deno.env.get('TOPPA_API_KEY');
    const cheapDataKey = Deno.env.get('CHEAPDATAHUB_API_KEY');
    const enableMock = Deno.env.get('ENABLE_VTU_MOCK') === 'true';

    if (!toppaKey && !cheapDataKey && !enableMock) {
      return new Response(
        JSON.stringify({ error: 'VTU Aggregator gateways are currently unconfigured on server. No funds were debited.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: settings } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .limit(1)
      .single();

    if (settings?.maintenance_mode) {
      return new Response(
        JSON.stringify({ error: 'System is currently undergoing scheduled maintenance. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('pin_hash, is_banned')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.is_banned) {
      return new Response(JSON.stringify({ error: 'Account suspended. Transactions disabled.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify 4-digit PIN using bcryptjs compare
    const isPinValid = profile.pin_hash ? await bcrypt.compare(pin, profile.pin_hash) : false;
    if (!isPinValid) {
      return new Response(JSON.stringify({ error: 'Incorrect 4-digit PIN.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletErr || !wallet) {
      return new Response(JSON.stringify({ error: 'Wallet not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let finalAmount = sanitizedAmount;
    let appliedPromoCode: string | null = null;
    if (promoCode) {
      const { data: promo } = await supabaseAdmin
        .from('promos')
        .select('*')
        .eq('code', promoCode)
        .eq('is_active', true)
        .single();

      if (promo) {
        appliedPromoCode = promo.code;
        if (promo.type === 'percentage') {
          finalAmount = Math.max(0, sanitizedAmount - (sanitizedAmount * (promo.value / 100)));
        } else if (promo.type === 'fixed') {
          finalAmount = Math.max(0, sanitizedAmount - promo.value);
        }
      }
    }

    // ── Atomic Pre-Deduction (Race Condition Prevention) ──────────
    // Uses PostgreSQL row-level UPDATE lock: only one concurrent request can
    // deduct from the same wallet row. If balance < finalAmount the RPC raises
    // INSUFFICIENT_FUNDS and no debit occurs.
    const { data: deductResult, error: deductErr } = await supabaseAdmin
      .rpc('deduct_wallet_balance', { p_user_id: userId, p_amount: finalAmount });

    if (deductErr) {
      const isInsufficient = deductErr.message?.includes('INSUFFICIENT_FUNDS');
      return new Response(
        JSON.stringify({
          error: isInsufficient
            ? `Insufficient balance. Required: ₦${finalAmount.toLocaleString()}`
            : 'Failed to reserve funds. Please try again.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Funds are now reserved (balance already decremented).
    // newBalance after deduction is returned by the RPC.
    const newBalance: number = deductResult;

    const primaryApi = settings?.primary_data_api || 'Toppa';
    const secondaryApi = settings?.secondary_data_api || 'CheapDataHub';
    const reference = buildTxnReference(service);

    let aggregatorUsed: 'Toppa' | 'CheapDataHub' = primaryApi;
    let purchaseSuccess = false;

    let isToppaTimeout = false;
    let isToppaExplicitFailure = false;

    // Primary Execution Path (Toppa Hub Digital with <8s timeout)
    if (primaryApi === 'Toppa' && toppaKey) {
      try {
        const toppaRes = await fetch('https://api.toppahub.com/v1/topup', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${toppaKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, recipient, amount: finalAmount, service, provider, plan_name: planName }),
          signal: AbortSignal.timeout(8000), // Strict 8-second timeout
        });
        if (toppaRes.ok) {
          purchaseSuccess = true;
          aggregatorUsed = 'Toppa';
        } else {
          isToppaExplicitFailure = true;
        }
      } catch (toppaErr: any) {
        if (toppaErr?.name === 'AbortError' || toppaErr?.name === 'TimeoutError' || toppaErr?.message?.toLowerCase().includes('timeout')) {
          isToppaTimeout = true;
          console.warn('Primary Toppa API timed out (<8s):', toppaErr);
        } else {
          isToppaExplicitFailure = true;
          console.warn('Primary Toppa API failed with non-timeout error:', toppaErr);
        }
      }
    }

    // Fallback Execution Path (CheapDataHub API with <8s timeout)
    // CRITICAL: ONLY execute if primary explicitly failed without timing out
    if (!purchaseSuccess && isToppaExplicitFailure && !isToppaTimeout && secondaryApi === 'CheapDataHub' && cheapDataKey) {
      try {
        const cdhRes = await fetch('https://cheapdatahub.com.ng/api/data', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${cheapDataKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, phone: recipient, amount: finalAmount, network: provider, plan_name: planName }),
          signal: AbortSignal.timeout(8000), // Strict 8-second timeout
        });
        if (cdhRes.ok) {
          purchaseSuccess = true;
          aggregatorUsed = 'CheapDataHub';
        }
      } catch (cdhErr) {
        console.error('Fallback CheapDataHub API failed:', cdhErr);
      }
    }

    // Explicit Mock Execution ONLY if ENABLE_VTU_MOCK=true is explicitly set
    if (!purchaseSuccess && !toppaKey && !cheapDataKey && enableMock) {
      purchaseSuccess = true;
      aggregatorUsed = 'Toppa';
    }

    // ── Settlement: Log transaction based on supplier result ─────
    if (purchaseSuccess) {
      const { data: txnRecord } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          reference: reference,
          type: 'Debit',
          service: service,
          amount: finalAmount,
          status: 'Success',
          aggregator_used: aggregatorUsed,
          promo_applied: appliedPromoCode,
          recipient: recipient,
          provider: provider,
          plan_name: planName || `${service} Purchase`,
        })
        .select()
        .single();

      // OneSignal Push Notification Dispatch
      const oneSignalKey = Deno.env.get('CEKPAY_PROD_ONESIGNAL_KEY');
      const oneSignalAppId = Deno.env.get('VITE_ONESIGNAL_APP_ID');
      if (oneSignalKey && oneSignalAppId) {
        try {
          await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${oneSignalKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              app_id: oneSignalAppId,
              include_aliases: { external_id: [userId] },
              target_channel: 'push',
              headings: { en: `${service} Successful! ⚡` },
              contents: { en: `Your ${service} purchase of ₦${finalAmount.toLocaleString()} was successful.` },
            }),
          });
        } catch (pushErr) {
          console.error('OneSignal push notification error:', pushErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transaction completed successfully.',
          transaction: txnRecord,
          newBalance: newBalance,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // ── Atomic Refund: Reverse the pre-deduction ──────────────
      const { data: refundedBalance, error: refundErr } = await supabaseAdmin
        .rpc('refund_wallet_balance', { p_user_id: userId, p_amount: finalAmount });

      if (refundErr) {
        console.error('Failed to refund wallet balance:', { userId, reference, finalAmount, error: refundErr });
        return new Response(
          JSON.stringify({
            error: 'Transaction failed at provider gateways and automated wallet refund failed. Please contact support.',
            status: 'Failed',
            reference: reference,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        reference: reference,
        type: 'Debit',
        service: service,
        amount: finalAmount,
        status: 'Reversed',
        aggregator_used: primaryApi as any,
        recipient: recipient,
        provider: provider,
        plan_name: planName || `${service} Purchase`,
      });

      const failureMessage = isToppaTimeout
        ? 'Primary gateway timed out. Order outcome unconfirmed. Wallet balance refunded.'
        : 'Transaction failed at provider gateways. Instant Reversal applied — funds have been restored to your wallet.';

      return new Response(
        JSON.stringify({
          error: failureMessage,
          status: 'Reversed',
          reference: reference,
          newBalance: refundedBalance,
        }),
        { status: isToppaTimeout ? 504 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
