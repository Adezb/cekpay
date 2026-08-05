-- Migration 13: Atomic Paystack Webhook Credit RPC (Idempotency & Race Condition Prevention)

-- Ensure UNIQUE constraint on transactions reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.transactions'::regclass
      AND conname = 'transactions_reference_key'
  ) THEN
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_reference_key UNIQUE (reference);
  END IF;
END $$;

-- Create Atomic Paystack Credit RPC Function
CREATE OR REPLACE FUNCTION public.process_paystack_credit(
  p_user_id UUID,
  p_reference TEXT,
  p_amount NUMERIC,
  p_channel TEXT DEFAULT 'Paystack',
  p_plan_name TEXT DEFAULT 'Wallet Deposit'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_balance NUMERIC;
  v_existing_tx UUID;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'UNAUTHORIZED_CALLER';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_USER_ID';
  END IF;

  IF p_reference IS NULL OR TRIM(p_reference) = '' THEN
    RAISE EXCEPTION 'INVALID_REFERENCE';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  -- 1. Idempotency Check: Check if reference already processed
  SELECT id INTO v_existing_tx
  FROM public.transactions
  WHERE reference = p_reference;

  IF v_existing_tx IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'ALREADY_PROCESSED', 'message', 'Webhook reference already credited.');
  END IF;

  -- 2. Atomic Transaction Insert
  BEGIN
    INSERT INTO public.transactions (
      user_id,
      reference,
      type,
      service,
      amount,
      status,
      payment_processor,
      plan_name,
      created_at
    ) VALUES (
      p_user_id,
      p_reference,
      'Credit',
      'Funding',
      p_amount,
      'Success',
      p_channel,
      p_plan_name,
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    -- Handles concurrent duplicate HTTP webhook deliveries
    RETURN jsonb_build_object('status', 'ALREADY_PROCESSED', 'message', 'Concurrent webhook reference already credited.');
  END;

  -- 3. Atomic Wallet Balance Increment
  UPDATE public.wallets
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  RETURN jsonb_build_object('status', 'SUCCESS', 'new_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.process_paystack_credit(UUID, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_paystack_credit(UUID, TEXT, NUMERIC, TEXT, TEXT) TO service_role;
