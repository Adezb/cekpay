-- Migration 21: Add dva_account_name column to public.wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS dva_account_name TEXT;

-- Backfill existing DVA records with profile first_name and last_name
UPDATE public.wallets w
SET dva_account_name = NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), '')
FROM public.profiles p
WHERE w.user_id = p.id
  AND w.dva_account_number IS NOT NULL
  AND w.dva_account_name IS NULL;
