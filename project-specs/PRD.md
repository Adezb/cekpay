# Product Requirements Document (PRD)
**Product Name:** CEKPay  
**Parent Company:** CEK TOP VENTURES LTD (RC Registered)  
**Target Audience:** Everyday Consumers in Nigeria (B2C Focus)  
**Core Value Proposition:** "The Speedboat of VTU and Utility Bills Payment" — Unmatched speed, zero visual clutter, persistent app-lock security, masked data density, and guaranteed zero-liability identity processing.

---

## 1. Product Overview

CEKPay is a modern, high-speed Virtual Top-Up (VTU) and bill payment Progressive Web Application (PWA). It focuses on utility velocity: allowing users to buy Airtime, Data, Electricity tokens, and Cable TV subscriptions with minimal friction while maintaining strict compliance with Nigerian financial regulations through non-custodial, zero-storage KYC processing.

### 1.1 Technical Stack & Infrastructure
- **Frontend Framework:** React 19 + Vite 8 + TypeScript (PWA).
- **Styling:** Tailwind CSS v4 (Minimalist, glassmorphism UI/UX).
- **Backend & Database:** Supabase PostgreSQL 15 (8 Public Tables, 22 RLS Policies, 5 Database Triggers, Auth).
- **Edge Runtime:** 7 Active Deno Edge Functions (`auth-otp-delivery`, `set-user-pin`, `verify-pin`, `verify-kyc-and-create-dva`, `paystack-webhook`, `process-withdrawal`, `vtu-transaction-engine`).
- **Primary Payment/Wallet Processor:** Paystack (Dedicated Virtual Accounts via Wema Bank & Payouts via Paystack Transfer API).
- **VTU/Utility Aggregators:** Toppa Hub Digital (Primary, <8s timeout) & CheapDataHub (Fallback). Two-tier automatic circuit breaker with instant atomic 502 reversals. (VTpass is permanently purged).
- **SMS Gateway:** BulkSMSNigeria (Alphanumeric Sender ID `CEKPay`).
- **Email Gateway:** Resend API (Transactional secure email via `mail.cekpay.com.ng`).
- **Push Notifications:** OneSignal Web Push SDK (v16+) with server-side REST API dispatch.

---

## 2. Core Features (Frontend & Security)

### 2.1 Frictionless Onboarding, Compliance & App Lock
- **Sanitized MSISDN Phone Input:** First Name, Last Name, Phone Number, and Email Address. Phone numbers submitted in any local format (e.g. `08012345678` or `+2348012345678`) are strictly sanitized via `toMSISDN()` to international 13-digit MSISDN format (`23480XXXXXXXX`) before hitting Supabase Auth or database tables.
- **T&C Compliance Gate:** Signup requires mandatory consent via a checkbox linked to **Privacy Policy** and **Terms of Service** pages. The "Send Pass" button remains disabled until checked.
- **Dual-Channel OTP Delivery:** Generating a 6-character alphanumeric pass code delivered simultaneously via:
  1. SMS via BulkSMSNigeria (Alphanumeric Sender ID `CEKPay`, bypasses DND).
  2. Transactional email via Resend API (`mail.cekpay.com.ng`).
- **Option A Password Strategy & Bcrypt PIN Security:** 4-digit PIN creation calls the `set-user-pin` Edge Function for server-side `bcrypt` hashing, and sets the Supabase Auth password to `sha256(msisdn + pin)`. User never manages raw passwords.
- **Persistent App Lock Shield:** Rehydration & inactivity timeouts lock the app (`isLocked: true`). Unlocking requires PIN verification against the `verify-pin` Edge Function (`bcrypt.compare` in Deno).

### 2.2 Progressive KYC & Zero-Liability Virtual Account Flow
- **Initial State:** User lands on dashboard with ₦0.00 balance and NO Dedicated Virtual Account (DVA). Balance is masked (`****`), displaying a prominent **"Create Wallet"** button.
- **Step 1 (Local Bank Binding):** Clicking "Create Wallet" prompts linking a personal local bank account (Bank Name & 10-digit NUBAN Account Number). Verified via Paystack Resolve Account API and saved for payout withdrawals.
- **Step 2 (BVN Proxy & DVA Generation):** Second click displays read-only registration details alongside an on-the-spot BVN text input and consent checkbox.
- **Zero-Liability Security Rule:** **User BVN is NEVER written to PostgreSQL DB tables or persistent storage.** The BVN is proxied in memory directly to Paystack's Customer Validation API and discarded immediately.
- **Active State:** Once validated, the dashboard displays Wema Bank DVA account numbers, and the primary toggle switches permanently to **"Fund Wallet"**.

### 2.3 The "Speedboat" Dashboard View
- **Top Section:** Wallet Balance masked by default (`****`) with eye toggle to reveal true numbers.
- **Action Toggles:** Inline buttons for **Create Wallet / Fund Wallet** and **Withdraw**.
- **Quick Action Grid:** 4 massive buttons: Airtime, Data, Electricity, Cable TV.
- **Smart Contacts Directory:** Horizontal avatars showing saved numbers/meters. **Capped at 10 contacts per user** via PostgreSQL trigger `enforce_smart_contacts_limit()`.

### 2.4 Aggregator Circuit Breaker & Instant Reversals
- **Toppa Primary (<8s Timeout):** Backend routes VTU request to Toppa Hub Digital API first.
- **CheapDataHub Fallback:** If Toppa times out or fails, the request automatically falls back to CheapDataHub seamlessly.
- **Instant Reversal Guarantee:** If both aggregators fail, `vtu-transaction-engine` logs a `Reversed` status entry, leaves the wallet balance untouched, and returns a 502 error payload.

### 2.5 Communication Channels & Routing
- **Outbound Email:** Resend API via sending domain `mail.cekpay.com.ng`.
- **Inbound Support Email:** ImprovMX forwarding `support@cekpay.com.ng` → `temitopeceo@gmail.com` with Google SPF authorization (`include:_spf.google.com`).
- **Push Alerts:** OneSignal Web Push integration with custom in-app permission prompt.

---

## 3. Backend & Financial Operations

### 3.1 Webhook & Idempotency Engine
- **Paystack Webhook:** Listens to `charge.success` events. Validates `x-paystack-signature` HMAC-SHA512 digest, checks reference idempotency on `transactions` table to prevent duplicate credits, updates `wallets.balance` atomically, and fires a OneSignal push notification.

### 3.2 Withdrawal Payout Engine
- **`process-withdrawal` Edge Function:** Verifies `bcrypt` PIN, enforces reference idempotency, validates pre-linked settlement bank account, atomically pre-debits wallet balance via `deduct_wallet_balance` RPC before calling Paystack, submits payout with unique provider reference, and executes atomic refund via `refund_wallet_balance` RPC with `Reversed` transaction logging on confirmed Paystack failure while preserving `Success` `Debit` logging on successful transfer.

### 3.3 Dynamic Product Pricing & Admin Controls
- **Admin Ledger:** View user profiles, transaction histories, linked settlement bank parameters, and wallet balances.
- **Product Pricing Engine:** Configure retail prices and aggregator cost prices for frontend rendering.
- **Promo System:** Create percentage or fixed discount promo codes (e.g. CEKLAUNCH) evaluated during checkout.