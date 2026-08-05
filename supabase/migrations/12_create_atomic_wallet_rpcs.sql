-- Migration 12: Atomic Wallet Balance RPC Functions (Race Condition Prevention)

-- Atomic Balance Deduction: Uses WHERE balance >= p_amount for row-level locking
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'UNAUTHORIZED_CALLER';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_USER_ID';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND balance >= p_amount
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
  END IF;

  RETURN v_new_balance;
END;
$$;

-- Atomic Balance Refund: Reverses a prior deduction on supplier failure
CREATE OR REPLACE FUNCTION public.refund_wallet_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'UNAUTHORIZED_CALLER';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_USER_ID';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  UPDATE public.wallets
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  RETURN v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_wallet_balance(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_wallet_balance(UUID, NUMERIC) TO service_role;

REVOKE ALL ON FUNCTION public.refund_wallet_balance(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_wallet_balance(UUID, NUMERIC) TO service_role;
