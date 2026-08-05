-- SECURITY DEFINER RPC allowing anonymous pre-signup existence checks safely
CREATE OR REPLACE FUNCTION public.check_profile_exists(
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone_exists BOOLEAN := FALSE;
  v_email_exists BOOLEAN := FALSE;
BEGIN
  IF p_phone IS NOT NULL AND p_phone <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE phone = p_phone
    ) INTO v_phone_exists;
  END IF;

  IF p_email IS NOT NULL AND p_email <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE email = p_email
    ) INTO v_email_exists;
  END IF;

  RETURN jsonb_build_object(
    'phone_exists', v_phone_exists,
    'email_exists', v_email_exists
  );
END;
$$;

-- Grant execution privilege to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_profile_exists(TEXT, TEXT) TO anon, authenticated;
