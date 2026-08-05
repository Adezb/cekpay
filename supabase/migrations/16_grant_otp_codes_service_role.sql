-- Grant explicit table permissions on public.otp_codes to service_role and postgres
GRANT ALL ON TABLE public.otp_codes TO service_role;
GRANT ALL ON TABLE public.otp_codes TO postgres;
GRANT ALL ON TABLE public.otp_codes TO authenticated;

-- Ensure RLS allows service_role full access
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on otp_codes" ON public.otp_codes;
CREATE POLICY "Service role full access on otp_codes" 
  ON public.otp_codes 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);
