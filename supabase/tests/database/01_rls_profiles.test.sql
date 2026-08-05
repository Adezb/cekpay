-- pgTAP Database Integration Test: RLS Isolation & RPC Security
BEGIN;

SELECT plan(6);

-- Test 1: Verify tables exist in public schema
SELECT has_table('public', 'profiles', 'public.profiles table must exist');
SELECT has_table('public', 'otp_codes', 'public.otp_codes table must exist');

-- Test 2: RLS Isolation for anon role on profiles table
SET LOCAL ROLE anon;
SELECT is_empty(
  'SELECT * FROM public.profiles',
  'Anon role must not be able to read any profiles records'
);

-- Test 3: RLS Isolation for anon role on otp_codes table
SELECT is_empty(
  'SELECT * FROM public.otp_codes',
  'Anon role must not be able to read any otp_codes records'
);

-- Test 4: Verify anon cannot insert into profiles table
SELECT throws_ok(
  $$ INSERT INTO public.profiles (id, email, first_name, last_name, phone) VALUES ('00000000-0000-0000-0000-000000000000', 'test@test.com', 'Test', 'User', '2348000000000') $$,
  'permission denied for table profiles',
  'Anon role must be denied insert on profiles table'
);

-- Test 5: Verify check_profile_exists RPC execution is denied for anon
SELECT throws_ok(
  $$ SELECT public.check_profile_exists('2348030000000', 'test@example.com') $$,
  'permission denied for function check_profile_exists',
  'Anon role must not be able to execute check_profile_exists RPC'
);

SELECT * FROM finish();
ROLLBACK;
