-- Migration 11: Create Server-Side OTP Codes Table for Edge Function Verification
CREATE TABLE IF NOT EXISTS public.otp_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (Service-Role Edge Functions Only - No Public Policies)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
