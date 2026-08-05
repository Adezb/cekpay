-- Revoke anon execution privilege to prevent account enumeration attacks
REVOKE EXECUTE ON FUNCTION public.check_profile_exists(TEXT, TEXT) FROM anon;

-- Drop the unneeded RPC function
DROP FUNCTION IF EXISTS public.check_profile_exists(TEXT, TEXT);
