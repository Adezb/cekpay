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

    const { amount, pin, reference: clientRef, idempotencyKey, bankCode, bank_code } = await req.json();
    const reference = idempotencyKey || clientRef || `CEK-WTH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    if (!pin) {
      return new Response(
        JSON.stringify({ error: '4-digit PIN is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidAmount(amount)) {
      return new Response(
        JSON.stringify({ error: 'Invalid withdrawal amount. Amount must be a positive number (max ₦1,000,000).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedAmount = Math.round(amount * 100) / 100;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Idempotency Check: Prevent duplicate payouts for retried requests
    const { data: existingTxn } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingTxn) {
      if (existingTxn.status === 'Success') {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Withdrawal payout processed successfully.',
            reference: existingTxn.reference,
            replayed: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            error: `Transaction with reference ${reference} has already been processed with status ${existingTxn.status}.`,
            status: existingTxn.status,
            replayed: true,
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, pin_hash, is_banned')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.is_banned) {
      return new Response(JSON.stringify({ error: 'Account suspended. Payouts disabled.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify 4-digit PIN using bcrypt compare
    const isPinValid = profile.pin_hash ? await compare(pin, profile.pin_hash) : false;
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

    if (!wallet.local_withdrawal_account || !wallet.local_withdrawal_bank) {
      return new Response(
        JSON.stringify({ error: 'No pre-linked settlement bank account found on profile.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const enableMock = Deno.env.get('ENABLE_WITHDRAWAL_MOCK') === 'true';

    if (!paystackSecretKey && !enableMock) {
      return new Response(
        JSON.stringify({
          error: 'Withdrawal payout gateway is currently unconfigured on server.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let recipientCode = (wallet.paystack_transfer_recipient_code && wallet.paystack_transfer_recipient_code.startsWith('RCP_'))
      ? wallet.paystack_transfer_recipient_code
      : (wallet.paystack_customer_code && wallet.paystack_customer_code.startsWith('RCP_') ? wallet.paystack_customer_code : null);

    const targetBankCode = wallet.local_withdrawal_code || bankCode || bank_code || wallet.local_withdrawal_bank;

    if (!recipientCode && paystackSecretKey) {
      try {
        const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'nuban',
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Settlement Account',
            account_number: wallet.local_withdrawal_account,
            bank_code: targetBankCode,
            currency: 'NGN',
          }),
        });
        const recipientData = await recipientRes.json();
        if (recipientRes.ok && recipientData.status && recipientData.data?.recipient_code) {
          recipientCode = recipientData.data.recipient_code;
          await supabaseAdmin
            .from('wallets')
            .update({ paystack_transfer_recipient_code: recipientCode })
            .eq('user_id', userId);
        }
      } catch (err) {
        console.error('Paystack Transfer Recipient creation error:', err);
      }
    }

    if (paystackSecretKey && !recipientCode && !enableMock) {
      return new Response(
        JSON.stringify({ error: 'Failed to resolve Paystack transfer recipient for settlement account.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Atomic Pre-Deduction (Race Condition Prevention) ──────────
    const { data: deductResult, error: deductErr } = await supabaseAdmin
      .rpc('deduct_wallet_balance', { p_user_id: userId, p_amount: sanitizedAmount });

    if (deductErr) {
      const isInsufficient = deductErr.message?.includes('INSUFFICIENT_FUNDS');
      return new Response(
        JSON.stringify({
          error: isInsufficient
            ? `Insufficient balance for payout. Required: ₦${sanitizedAmount.toLocaleString()}`
            : 'Failed to reserve funds. Please try again.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newBalance: number = deductResult;

    // ── Durable Processing State Insertion (BEFORE calling Paystack) ──
    const { error: insertProcessingErr } = await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      reference: reference,
      type: 'Debit',
      service: 'Withdrawal',
      amount: sanitizedAmount,
      status: 'Pending',
      payment_processor: 'Paystack',
      recipient: wallet.local_withdrawal_account,
      provider: wallet.local_withdrawal_bank,
      plan_name: 'Wallet Payout',
    });

    if (insertProcessingErr) {
      console.error('Failed to insert Pending transaction state:', insertProcessingErr);
      await supabaseAdmin.rpc('refund_wallet_balance', { p_user_id: userId, p_amount: sanitizedAmount });
      return new Response(
        JSON.stringify({ error: 'Failed to persist transaction state. Funds refunded.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let payoutSuccess = false;
    if (paystackSecretKey && recipientCode) {
      try {
        const transferRes = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'balance',
            amount: Math.round(sanitizedAmount * 100), // Paystack amount in kobo (integer)
            recipient: recipientCode,
            reason: `CEKPay Withdrawal - ${reference}`,
            reference: reference,
          }),
        });
        const transferData = await transferRes.json();
        payoutSuccess = transferRes.ok && transferData.status === true;
      } catch (err) {
        console.error('Paystack Transfer API error:', err);
        payoutSuccess = false;
      }
    } else if (enableMock) {
      payoutSuccess = true;
    }

    // ── Settlement & Terminal State Updates ─────────────────────
    if (payoutSuccess) {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'Success' })
        .eq('reference', reference)
        .eq('user_id', userId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Withdrawal payout processed successfully.',
          reference: reference,
          newBalance: newBalance,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // ── Atomic Refund: Reverse the pre-deduction ──────────────
      const { data: refundedBalance, error: refundErr } = await supabaseAdmin
        .rpc('refund_wallet_balance', { p_user_id: userId, p_amount: sanitizedAmount });

      if (refundErr) {
        console.error('Failed to refund wallet balance:', { userId, reference, finalAmount: sanitizedAmount, error: refundErr });
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'Failed' })
          .eq('reference', reference)
          .eq('user_id', userId);

        return new Response(
          JSON.stringify({
            error: 'Withdrawal transfer failed and automated wallet refund failed. Please contact support.',
            status: 'Failed',
            reference: reference,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabaseAdmin
        .from('transactions')
        .update({ status: 'Reversed' })
        .eq('reference', reference)
        .eq('user_id', userId);

      return new Response(
        JSON.stringify({
          error: 'Withdrawal transfer failed at Paystack gateway. Instant Reversal applied — funds have been restored to your wallet.',
          status: 'Reversed',
          newBalance: refundedBalance,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
