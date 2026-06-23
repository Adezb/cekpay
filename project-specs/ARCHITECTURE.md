# Architectural Design Specification
**Product:** CEKPay
**Tech Stack:** React + Vite + TypeScript (Frontend), Supabase (PostgreSQL, Edge Functions, Auth), Tailwind CSS (UI), Paystack & VTU Aggregators (External APIs).

## 1. System Overview
CEKPay utilizes a **Serverless Monorepo Architecture**. 
- The **Frontend** acts as a lightweight, lightning-fast Single Page Application (SPA).
- The **Backend** relies entirely on Supabase. Direct database operations use the Supabase JS Client with Row Level Security (RLS) enabled.
- **Heavy computations and secure external requests** (e.g., Paystack Webhooks, Aggregator API calls) are processed securely inside **Supabase Edge Functions** (Deno) to prevent exposing secret API keys on the client.

---

## 2. Frontend Architecture (React + Vite + TS)

### 2.1 State Management
- **Zustand** or **React Context API** should be used for global state (User Profile, Wallet Balance, Auth State).
- **React Query (TanStack Query)** should be used for asynchronous data fetching (Transaction History, Pricing Lists) to handle caching and loading states automatically.

### 2.2 Component Structure (Atomic Design)
- `/components/ui/`: Reusable, dumb components (Buttons, Inputs, Modals, Spinners) built strictly with Tailwind utility classes.
- `/components/features/`: Smart components (AirtimeForm, DataGrid, WalletCard) that interact with the global state.
- `/layouts/`: `AuthLayout` (for login/signup) and `DashboardLayout` (containing the sidebar/bottom nav and notification banner).
- `/pages/`: The primary views routed via `react-router-dom` (e.g., Home, Admin Dashboard, Transactions).

---

## 3. Backend Architecture (Supabase Edge Functions)

Because we cannot store Paystack or VTpass Secret Keys in the React frontend, all payment logic must route through Supabase Edge Functions.

### 3.1 Function 1: `create-virtual-account`
- **Trigger:** Called by the frontend immediately after a user sets their 4-digit PIN during onboarding.
- **Action:** 
  1. Validates the user in Supabase Auth.
  2. Sends a POST request to Paystack's `https://api.paystack.co/dedicated_account` endpoint.
  3. Receives the Virtual Account Number and Bank Name (e.g., Paystack-Titan).
  4. Inserts these details into the CEKPay `wallets` table.

### 3.2 Function 2: `paystack-webhook`
- **Trigger:** Automatically invoked by Paystack servers.
- **Action:**
  1. Verifies the `x-paystack-signature` header using the CEKPay Secret Key to prevent fraudulent webhook injections.
  2. Listens specifically for the `charge.success` event.
  3. Extracts the customer code and the amount.
  4. securely updates the user's balance in the `wallets` table.
  5. Inserts a record into the `transactions` table (Type: 'Funding').
  6. **Requirement:** Must return a `200 OK` response within milliseconds so Paystack does not retry the webhook.

### 3.3 Function 3: `vtu-transaction-engine`
- **Trigger:** Called by the frontend when a user confirms a purchase with their PIN.
- **Action:** 
  1. Verifies the user's PIN and checks if `wallet.balance >= product.price`.
  2. Executes the **Circuit Breaker Logic** (See Section 4).
  3. If successful: Debits the user's wallet in PostgreSQL, logs the transaction, and returns success to the UI.
  4. If failed: Aborts the deduction, logs a failed transaction, and returns an error to the UI (Instant Reversal guarantee).

---

## 4. The Integration Layer: Circuit Breaker Logic
This logic guarantees 99.9% uptime by automatically switching between Toppa Hub Digital and VTpass.

**Execution Flow inside `vtu-transaction-engine`:**
1. Fetch the active API routing configurations from the `admin_settings` table.
2. Example scenario: User buys MTN Data. The Primary API is set to *Toppa Hub*.
3. The Edge Function makes an HTTP request to Toppa Hub.
4. **Timeout / Error Catching:**
   - If Toppa Hub returns a `200 OK`, complete the transaction.
   - If Toppa Hub request exceeds `10000ms` (10 seconds) OR returns a `503 Service Unavailable`, **catch the error**.
5. **Fallback Execution:** Immediately initiate a fallback HTTP request to *VTpass* (e.g., `https://vtpass.com/api/pay`).
6. If VTpass succeeds, complete the transaction.
7. If BOTH APIs fail, trigger the **Instant Reversal Logic** (do not debit the user, inform frontend of provider downtime).

---

## 5. Database Schema Maps (PostgreSQL via Supabase)

### 5.1 Table: `profiles`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, references `auth.users` |
| `phone` | VARCHAR | Unique, user's login ID |
| `first_name` | VARCHAR | |
| `last_name` | VARCHAR | |
| `pin_hash` | VARCHAR | securely hashed 4-digit PIN |
| `is_banned` | BOOLEAN | Default: FALSE |

### 5.2 Table: `wallets`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key -> `profiles.id` |
| `balance` | DECIMAL | Default: 0.00 |
| `paystack_customer_code` | VARCHAR | Used for Paystack mapping |
| `account_number` | VARCHAR | DVA Account Number |
| `bank_name` | VARCHAR | e.g., Wema, Titan |

### 5.3 Table: `transactions`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key -> `profiles.id` |
| `reference` | VARCHAR | Unique transaction ID |
| `type` | VARCHAR | 'Credit' or 'Debit' |
| `service` | VARCHAR | 'Airtime', 'Data', 'Electricity', 'Cable', 'Funding' |
| `amount` | DECIMAL | Transaction cost |
| `status` | VARCHAR | 'Success', 'Failed', 'Reversed' |
| `aggregator_used`| VARCHAR | 'Toppa' or 'VTpass' (Null for Funding) |
| `payment_processor` | VARCHAR | 'Paystack' (For Funding transactions) |
| `created_at` | TIMESTAMP | |

### 5.4 Table: `admin_settings`
*(Contains single row for global app configuration)*
| Column | Type | Notes |
| :--- | :--- | :--- |
| `primary_data_api` | VARCHAR | 'Toppa' |
| `secondary_data_api`| VARCHAR | 'VTpass' |
| `primary_bills_api` | VARCHAR | 'VTpass' |
| `maintenance_mode` | BOOLEAN | Default: FALSE |

### 5.5 Table: `announcements`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `message` | TEXT | The content of the announcement |
| `is_active` | BOOLEAN | Determines if it shows on the frontend |
| `type` | VARCHAR | 'Info', 'Warning', 'Promo' |
