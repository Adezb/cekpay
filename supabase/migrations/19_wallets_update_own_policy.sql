-- Migration 19: Allow authenticated users to update their own wallet (e.g. linked bank details)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'wallets_update_own'
  ) THEN
    CREATE POLICY "wallets_update_own" ON public.wallets
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
