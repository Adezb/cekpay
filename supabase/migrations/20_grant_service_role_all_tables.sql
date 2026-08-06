-- Proactively grant full CRUD privileges to the service_role for all application tables
GRANT ALL ON TABLE public.wallets TO service_role;
GRANT ALL ON TABLE public.transactions TO service_role;
GRANT ALL ON TABLE public.smart_contacts TO service_role;
GRANT ALL ON TABLE public.announcements TO service_role;
GRANT ALL ON TABLE public.product_prices TO service_role;
GRANT ALL ON TABLE public.promos TO service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.otp_codes TO service_role;
