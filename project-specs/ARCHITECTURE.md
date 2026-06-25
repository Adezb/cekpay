# Architectural Design Specification
**Product:** CEKPay

## 1. System Overview
- **Frontend:** React + Vite + TypeScript (PWA)[cite: 1].
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth)[cite: 1].
- **OTP Gateways:** BulkSMSNigeria (Alphanumeric SMS)[cite: 1] & Resend API (Transactional Email).
- **Payment Processor:** Paystack (Collections via DVA & Payouts via Transfers).

---

## 2. Frontend Architecture (React + Vite + TS)

### 2.1 State Management & Security
- **Zustand:** Manages global state, specifically the `isLocked` boolean[cite: 1]. If `isAuthenticated` is true but `isLocked` is true, the router intercepts and displays the PIN App Lock screen[cite: 1].
- **React Query:** Used for caching asynchronous data (Transaction History, Pricing Lists)[cite: 1].

---

## 3. Backend Architecture (Supabase Edge Functions)

### 3.1 Function 1: `auth-otp-delivery`
- **Trigger:** Frontend signup or PIN reset request.
- **Action:** Generates a 6-character alphanumeric string[cite: 1]. Calls BulkSMSNigeria API to deliver the SMS payload[cite: 1], and simultaneously calls the Resend API to deliver the identical code via email. Bypasses standard Supabase numeric OTPs to ensure delivery via DND routes[cite: 1].

### 3.2 Function 2: `verify-kyc-and-create-dva`
- **Trigger:** Called when user submits BVN and local bank details via the "Create Wallet" flow[cite: 1].
- **Action:** 
  1. Validates local bank details via Paystack Resolve API[cite: 1].
  2. Submits BVN for Paystack Customer Validation as a direct proxy payload[cite: 1]. **Strict Guardrail: The BVN is immediately discarded from Edge Function memory and NEVER written to the PostgreSQL database.**
  3. Requests Dedicated Virtual Account creation[cite: 1].
  4. Inserts the resulting DVA and withdrawal bank details into the `wallets` table[cite: 1].

### 3.3 Function 3: `paystack-webhook`
- **Action:** Verifies signature, extracts customer code, updates wallet balance, and logs 'Funding' transaction[cite: 1]. Must return `200 OK` instantly[cite: 1].

### 3.4 Function 4: `process-withdrawal`
- **Trigger:** User initiates a payout to their linked local bank.
- **Action:**
  1. Verifies the user's 4-digit PIN hash.
  2. Confirms `wallet.balance` is sufficient.
  3. Calls Paystack Transfer API to push funds to the `local_withdrawal_account` saved in the database.
  4. Debits the user's Supabase wallet and logs a 'Debit' transaction.

### 3.5 Function 5: `vtu-transaction-engine`
- **Action:** Verifies user PIN, checks balance, calculates active Promo Codes, executes Circuit Breaker Logic (Primary API -> Fallback API), debits wallet on success, or executes Instant Reversal on failure[cite: 1].

---

## 4. Database Schema Maps (PostgreSQL)

### 4.1 Table: `profiles`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key[cite: 1] |
| `email` | VARCHAR | Unique, user's email ID |
| `phone` | VARCHAR | Unique[cite: 1] |
| `first_name` | VARCHAR |[cite: 1] |
| `last_name` | VARCHAR |[cite: 1] |
| `pin_hash` | VARCHAR | hashed 4-digit PIN[cite: 1] |
| `role` | VARCHAR | 'user' or 'admin'[cite: 1] |
| `is_banned` | BOOLEAN |[cite: 1] |

*(Note: There is intentionally no BVN column in this schema).*

### 4.2 Table: `wallets`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key[cite: 1] |
| `user_id` | UUID | Foreign Key[cite: 1] |
| `balance` | DECIMAL |[cite: 1] |
| `paystack_customer_code` | VARCHAR |[cite: 1] |
| `dva_account_number` | VARCHAR |[cite: 1] |
| `dva_bank_name` | VARCHAR |[cite: 1] |
| `local_withdrawal_bank` | VARCHAR | Pre-approved bank for user[cite: 1] |
| `local_withdrawal_account`| VARCHAR | Pre-approved account number[cite: 1] |

### 4.3 Table: `transactions`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key[cite: 1] |
| `user_id` | UUID | Foreign Key[cite: 1] |
| `type` | VARCHAR | 'Credit' or 'Debit'[cite: 1] |
| `service` | VARCHAR | 'Airtime', 'Data', 'Electricity', 'Cable', 'Funding', 'Withdrawal' |
| `amount` | DECIMAL |[cite: 1] |
| `promo_applied` | VARCHAR | Logs promo code used (if any)[cite: 1] |
| `status` | VARCHAR | 'Success', 'Failed', 'Reversed'[cite: 1] |

### 4.4 Table: `promos`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `code` | VARCHAR | Unique (e.g., CEKLAUNCH)[cite: 1] |
| `type` | VARCHAR | 'percentage' or 'fixed'[cite: 1] |
| `value` | DECIMAL | e.g., 5.00 (5%) or 200.00[cite: 1] |
| `is_active` | BOOLEAN |[cite: 1] |