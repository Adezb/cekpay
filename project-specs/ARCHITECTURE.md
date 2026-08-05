# Architectural Design Specification
**Product:** CEKPay (Parent: CEK TOP VENTURES LTD)
**Target Supabase Project:** `eexiftsuuouucvjytuhz`

---

## 1. System Architecture Overview

CEKPay is built on a two-tier decoupled architecture:
- **Frontend Layer:** Progressive Web Application (PWA) built with React 19 + Vite 8 + TypeScript. Styled using Tailwind CSS v4. State managed via Zustand with persistent App Lock shielding.
- **Backend & Database Layer:** Supabase PostgreSQL 15, Row-Level Security (22 policies), Database Triggers, Supabase Auth, and Deno Edge Functions runtime.
- **OTP & Communication Gateways:** 
  - **SMS:** BulkSMSNigeria API (Alphanumeric Sender ID `CEKPay`).
  - **Email:** Resend API via verified domain `mail.cekpay.com.ng` (Outbound) and ImprovMX forwarding via `support@cekpay.com.ng` (Inbound).
- **Payment & Banking Engine:** Paystack (Dedicated Virtual Accounts via Wema Bank & Payouts via Paystack Transfer API).
- **VTU Utility Aggregators:** Toppa Hub Digital (Primary, <8s timeout) & CheapDataHub (Fallback). Automatic background circuit breaker with instant atomic reversals. (VTpass is permanently purged).
- **Push Notifications:** OneSignal Web Push SDK (v16+) with server-side REST API notification dispatch.

---

## 2. Authentication & Session Architecture

### 2.1 Option A Deterministic Password Session Strategy
To insulate CEKPay from traditional password friction while using Supabase Auth:
- **Signup:** `apiSignup()` creates a Supabase Auth user record using a temporary token, storing sanitized MSISDN phone metadata (`23480XXXXXXXX`). PostgreSQL trigger `handle_new_user` automatically provisions matching `profiles` and `wallets` rows.
- **PIN Setup:** `apiCreatePin()` calls the `set-user-pin` Edge Function for server-side `bcrypt` hashing, and sets the Supabase Auth password to a deterministic hash: `sha256(msisdn + pin)`.
- **Session Login:** `apiLogin()` verifies the PIN via the `verify-pin` Edge Function and authenticates the session via `supabase.auth.signInWithPassword({ email, password: sha256(msisdn + pin) })`. User never sees or manages passwords.
- **Session Rehydration:** `supabase.auth.onAuthStateChange` listener in `authStore.ts` restores active sessions and profile data on app startup/refresh.

### 2.2 App Lock Security Shield
- Upon session rehydration, `authStore` forces `isLocked: true`.
- Intercepts routing to display the PIN Lock Screen. Unlocking requires entering the 4-digit PIN, verified server-side against the `verify-pin` Edge Function.

---

## 3. Backend Manifest: Deployed Supabase Edge Functions (7 Active Functions)

| # | Edge Function | Endpoint | Auth | Description |
|:---:|:---|:---|:---:|:---|
| 1 | `auth-otp-delivery` | `/functions/v1/auth-otp-delivery` | None | Dispatches 6-char pass via BulkSMSNigeria SMS & Resend Email (`mail.cekpay.com.ng`). |
| 2 | `set-user-pin` | `/functions/v1/set-user-pin` | JWT | Accepts `{ pin }`, derives user identity exclusively from validated JWT subject (`auth.uid()`), hashes PIN server-side via `bcrypt`, updates `profiles.pin_hash`. |
| 3 | `verify-pin` | `/functions/v1/verify-pin` | JWT / None | Accepts `{ pin }` (or `{ phone, pin }` for unauthenticated login), derives user identity exclusively from validated JWT subject (`auth.uid()`) or phone number, performs `bcrypt.compare` against `profiles.pin_hash`, rejects client-supplied user IDs, verifies account status. |
| 4 | `verify-kyc-and-create-dva` | `/functions/v1/verify-kyc-and-create-dva` | JWT | Proxies BVN to Paystack in memory for validation and provisions Wema Bank DVA. **Zero-Liability Guard: BVN is NEVER written to DB.** |
| 5 | `paystack-webhook` | `/functions/v1/paystack-webhook` | HMAC | Validates `x-paystack-signature` HMAC-SHA512 digest, checks reference idempotency on `transactions`, performs atomic wallet credit (`balance += amount`), dispatches OneSignal push notification. |
| 6 | `process-withdrawal` | `/functions/v1/process-withdrawal` | JWT | Verifies `bcrypt` PIN, checks reference idempotency, resolves Paystack transfer recipient, atomically pre-debits wallet via `deduct_wallet_balance`, executes Paystack Transfer API. On provider failure, executes atomic refund via `refund_wallet_balance` and logs `Reversed` transaction; on success, logs `Success` `Debit` transaction. |
| 7 | `vtu-transaction-engine` | `/functions/v1/vtu-transaction-engine` | JWT | Verifies `bcrypt` PIN, checks promo code & balance, executes Circuit Breaker: **Toppa Primary (<8s timeout) → CheapDataHub Fallback**. If both fail, executes instant atomic 502 reversal (`status: Reversed`) with zero balance deduction. Dispatches OneSignal push alert on success. |

---

## 4. Database Schema Maps (PostgreSQL 15)

The database consists of **8 public tables** protected by **22 Row-Level Security (RLS) policies**. Client-side direct balance mutations are strictly blocked.

### 4.1 Table: `profiles`
| Column | Type | Constraints / Description |
|:---|:---|:---|
| `id` | UUID | Primary Key (references `auth.users.id` ON DELETE CASCADE) |
| `email` | VARCHAR | Unique, Not Null |
| `phone` | VARCHAR | Unique, Not Null. Format: `23480XXXXXXXX` (13 digits). `CHECK (phone ~ '^234[789][01]\d{8}$')` |
| `first_name` | VARCHAR | Not Null |
| `last_name` | VARCHAR | Not Null |
| `pin_hash` | VARCHAR | Server-side `bcrypt` hash of 4-digit PIN |
| `role` | VARCHAR | Default `'user'` ('user' \| 'admin') |
| `is_banned` | BOOLEAN | Default `false` |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

> **Zero-Liability Security Rule:** The `profiles` table explicitly contains NO `bvn` or identity document column. BVNs are processed in memory only.

### 4.2 Table: `wallets`
| Column | Type | Constraints / Description |
|:---|:---|:---|
| `id` | UUID | Primary Key, Default `gen_random_uuid()` |
| `user_id` | UUID | Unique, Foreign Key (`profiles.id` ON DELETE CASCADE) |
| `balance` | DECIMAL(12,2) | Default `0.00`, `CHECK (balance >= 0)` |
| `paystack_customer_code` | VARCHAR | Paystack customer identifier (`CUS_...`) |
| `dva_account_number` | VARCHAR | Wema Bank DVA account number (10 digits) |
| `dva_bank_name` | VARCHAR | Default `'Wema Bank'` |
| `local_withdrawal_bank` | VARCHAR | Linked payout bank name |
| `local_withdrawal_account` | VARCHAR | Linked payout 10-digit NUBAN account number |

### 4.3 Table: `transactions`
| Column | Type | Constraints / Description |
|:---|:---|:---|
| `id` | UUID | Primary Key, Default `gen_random_uuid()` |
| `user_id` | UUID | Foreign Key (`profiles.id` ON DELETE CASCADE) |
| `reference` | VARCHAR | Unique (Format: `CEK-XXX-YYYYMMDD-XXXX`) |
| `type` | VARCHAR | `'Credit'` \| `'Debit'` |
| `service` | VARCHAR | `'Airtime'` \| `'Data'` \| `'Electricity'` \| `'Cable'` \| `'Funding'` \| `'Withdrawal'` |
| `amount` | DECIMAL(12,2) | Not Null, `CHECK (amount > 0)` |
| `status` | VARCHAR | `'Success'` \| `'Failed'` \| `'Reversed'` |
| `aggregator_used` | VARCHAR | `'Toppa'` \| `'CheapDataHub'` |
| `payment_processor` | VARCHAR | `'Paystack'` |
| `promo_applied` | VARCHAR | Applied promo code string |
| `recipient` | VARCHAR | Phone number, meter number, or IUC number |
| `provider` | VARCHAR | Network or disco (MTN, IKEDC, DSTV, etc.) |
| `plan_name` | VARCHAR | Plan description (e.g. "1GB 30 Days") |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

### 4.4 Table: `smart_contacts`
| Column | Type | Constraints / Description |
|:---|:---|:---|
| `id` | UUID | Primary Key, Default `gen_random_uuid()` |
| `user_id` | UUID | Foreign Key (`profiles.id` ON DELETE CASCADE) |
| `alias` | VARCHAR | Not Null (e.g. "Mom's Phone") |
| `identifier` | VARCHAR | Not Null (Phone/Meter/IUC number) |
| `provider_type` | VARCHAR | Not Null (MTN, IKEDC, DSTV, etc.) |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

> **Smart Contacts Limit:** Database trigger `enforce_smart_contacts_limit()` caps saved contacts at **10 per user** (Director Decision #5). Attempting to insert an 11th contact raises a PostgreSQL exception.

### 4.5 Table: `product_prices`
| Column | Type | Constraints / Description |
|:---|:---|:---|
| `id` | UUID | Primary Key, Default `gen_random_uuid()` |
| `service` | VARCHAR | `'Airtime'` \| `'Data'` \| `'Electricity'` \| `'Cable'` |
| `plan_name` | VARCHAR | Not Null |
| `network` | VARCHAR | MTN, Airtel, Glo, 9mobile |
| `provider` | VARCHAR | IKEDC, EKEDC, DSTV, GOtv, Startimes |
| `aggregator_cost_price` | DECIMAL(10,2) | Wholesale cost from aggregator |
| `retail_price` | DECIMAL(10,2) | Customer purchase price |
| `is_active` | BOOLEAN | Default `true` |

### 4.6 Table: `admin_settings`
| Column | Type | Constraints / Description |
|:---|:---|:---|
| `id` | UUID | Primary Key |
| `primary_data_api` | VARCHAR | Default `'Toppa'` |
| `secondary_data_api` | VARCHAR | Default `'CheapDataHub'` |
| `primary_bills_api` | VARCHAR | Default `'Toppa'` |
| `maintenance_mode` | BOOLEAN | Default `false` |

### 4.7 Table: `promos`
| Column | Type | Constraints / Description |
|:---|:---|:---|
| `id` | UUID | Primary Key |
| `code` | VARCHAR | Unique (e.g. CEKLAUNCH) |
| `type` | VARCHAR | `'percentage'` \| `'fixed'` |
| `value` | DECIMAL(10,2) | Discount value |
| `is_active` | BOOLEAN | Default `true` |

### 4.8 Table: `announcements`
| Column | Type | Constraints / Description |
|:---|:---|:---|
| `id` | UUID | Primary Key |
| `message` | TEXT | Announcement text |
| `type` | VARCHAR | `'Info'` \| `'Warning'` \| `'Promo'` |
| `is_active` | BOOLEAN | Default `true` |

---

## 5. Environment Matrix

### 5.1 Target Supabase Project
- **Project Ref:** `eexiftsuuouucvjytuhz`
- **URL:** `https://eexiftsuuouucvjytuhz.supabase.co`

### 5.2 Client Environment Variables (`.env.local`)
| Variable | Value | Purpose |
|:---|:---|:---|
| `VITE_SUPABASE_URL` | `https://eexiftsuuouucvjytuhz.supabase.co` | Client SDK connection |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsIn...` | Client public key |
| `VITE_ONESIGNAL_APP_ID` | `154e77e8-0b6f-40b5-85a5-a8b47177afe5` | OneSignal SDK initialization |
| `VITE_USE_MOCK` | `false` | Set to `false` for live API mode |

### 5.3 Supabase Vault Secrets (Edge Functions Runtime)
| Secret Name | Purpose |
|:---|:---|
| `CEKPAY_PROD_EMAIL_KEY` | Resend API key for email delivery via `mail.cekpay.com.ng` |
| `CEKPAY_PROD_ONESIGNAL_KEY` | OneSignal REST API key for server-side push alerts |
| `PAYSTACK_SECRET_KEY` | Paystack HMAC verification, DVA creation & Transfer payouts |
| `TOPPA_API_KEY` | Toppa Hub Digital primary aggregator authorization |
| `CHEAPDATAHUB_API_KEY` | CheapDataHub fallback aggregator authorization |
| `BULKSMSNIGERIA_API_KEY` | BulkSMSNigeria SMS delivery authorization |