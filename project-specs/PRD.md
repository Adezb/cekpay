# Product Requirements Document (PRD)
**Product Name:** CEKPay
**Parent Company:** CEK TOP VENTURES LTD (RC Registered)
**Target Audience:** Everyday Consumers in Nigeria (B2C Focus)
**Core Value Proposition:** "The Speedboat of VTU" — Unmatched speed, zero visual clutter, persistent app-lock security, masked data density, and guaranteed zero-liability identity processing.

## 1. Product Overview
CEKPay is a modern, high-speed Virtual Top-Up (VTU) and bill payment web application. It focuses on utility velocity: allowing users to buy Airtime, Data, Electricity tokens, and Cable TV subscriptions with minimal friction while maintaining strict compliance with Nigerian financial regulations through non-custodial, zero-storage KYC processing.

### 1.1 Technical Stack
- **Frontend Framework:** React + Vite + TypeScript (PWA).
- **Styling:** Tailwind CSS (Minimalist, glassmorphism UI/UX).
- **Backend & Database:** Supabase (PostgreSQL, Edge Functions, Row Level Security, Auth).
- **Primary Payment/Wallet Processor:** Paystack (Dedicated Virtual Accounts & Inbound Settlements).
- **VTU/Utility Aggregators:** Toppa Hub Digital (Primary) & VTpass (Fallback). *(Architecture supports easy integration of SMEPlug or CheapDataHub later).*
- **SMS Gateway:** BulkSMSNigeria (Custom alphanumeric delivery).
- **Email Gateway:** Resend API (Transactional secure authentication email).

---

## 2. Core Features (Frontend)

### 2.1 Frictionless Onboarding, Compliance & App Lock
- **Signup Inputs:** First Name, Last Name, Phone Number, and Email Address.
- **T&C Compliance:** The signup form includes a mandatory consent checkbox linked explicitly to the **Privacy Policy** and **Terms of Service** pages. The "Send Pass" submission button is **strictly disabled** until this box is checked.
- **Dual-Channel OTP Validation:** Once "Send Pass" is fired, the backend generates an **alphanumeric code** (e.g., A7X9TP) to bypass telco DND filters. It delivers this code simultaneously through two channels:
  1. An SMS copy via BulkSMSNigeria avoiding words like "OTP" or "Code" and using "Pass" (e.g., "Your CEKPay Pass is A7X9TP").
  2. A clean transactional email via the Resend API containing the exact matching Pass code.
- **Persistent App Lock (Cost Saving):** To minimize ongoing SMS/Email verification overheads, users remain persistently logged in. If the application is closed or stays inactive, a secure pin-lock shield intercepts the routing, requiring the user to supply their 4-digit PIN to unlock their dashboard canvas.

### 2.2 The Progressive KYC Wallet Flow (Strict Paystack Compliance)
- **Initial State:** Upon signup, the user lands on the dashboard with a local balance of ₦0.00 but **NO** Dedicated Virtual Account (DVA). The card renders a masked balance (`****`) and displays a prominent **"Create Wallet"** button.
- **Step 1 (Local Bank Binding):** Clicking "Create Wallet" for the first time redirects the user to link a personal local bank account (Bank Name and Account Number). The backend runs this through Paystack's Resolve Account API to verify their identity. This account is permanently saved for processing user payouts/withdrawals.
- **Step 2 (Vetting, Consent & DVA Request):** When the user clicks "Create Wallet" a second time, a modal overlay displays their fetched registration details for final confirmation: Full Name, Email, and Linked Local Bank Account details. Below this vetting display is an empty, on-the-spot **BVN text input field** and a mandatory **DVA Generation Consent Checkbox**.
- **The Zero-Liability Security Rule:** To legally and completely insulate CEKPay from identity data theft liability, **the user's BVN is never stored in the Supabase PostgreSQL database**. The frontend passes the field directly to a secure Supabase Edge Function proxy, which submits it live to Paystack for Customer Validation and discards the token immediately from active memory.
- **Active State:** Once Paystack validates the profile and deploys the DVA, the dashboard updates to display the account numbers (Wema/Titan), and the primary toggle permanently alters from "Create Wallet" to **"Fund Wallet"**.

### 2.3 The "Speedboat" Dashboard
- A clean, uncluttered interface. No ads, no loan offers.
- **Top Section:** Displays Wallet Balance masked by default as `****` with an eyeball utility toggle to reveal the true currency numbers. 
- **Action Buttons:** The main card houses two clear functional toggles:
  - **Create Wallet / Fund Wallet** (Dynamically rendering based on DVA assignment state).
  - **Withdraw** (Opens a secure PIN-authorized modal allowing instant payout of excess wallet funds straight back to their pre-linked local bank account).
- **Core Actions:** Four massive buttons: Airtime, Data, Electricity, Cable TV.
- **Smart Contacts:** A directory showing up to 10 previously saved numbers/meters.

### 2.4 The "Two-Tap" Transaction Flow
- The app automatically detects the user's network carrier from their phone number.
- Users select a plan, input their 4-digit PIN, and purchase. 
- If a promo code is available, it is calculated and applied at the PIN-entry stage before deduction.

---

## 3. Core Features (Backend & Admin Panel)

### 3.1 Financial Infrastructure & Withdrawals
- **Webhook Processing:** A dedicated Supabase Edge Function listens to Paystack `charge.success` events to instantly credit the user's database wallet.
- **Withdrawals:** Users can only withdraw to the specific local bank account they linked during the KYC phase, preventing fraud and money laundering.

### 3.2 The "Circuit Breaker" Auto-Failover System
- To guarantee 99.9% uptime, CEKPay uses a multi-aggregator strategy.
- **Logic:** Backend pings the Primary API first. If it times out (> 10 seconds) or returns an error, the system automatically aborts and re-routes the request to the Secondary API without alerting the user.

### 3.3 The "Instant Reversal" Guarantee
- **Logic:** If an aggregator returns a definitive failure response, the transaction must NOT be stuck in "Pending." The backend instantly reverses the deducted amount back to the user's wallet.

### 3.4 Extended Admin Panel Capabilities (Business Operations)
- **User Management Ledger:** View individual user profiles, transaction histories, linked settlement bank parameters, and active wallet balances.
  - Administrative actions include: View Ledger, Adjust Balance (requires mandatory 'Reason' input for refunds/reversals), Reset User PIN, and Suspend/Ban User.
- **Dynamic Product Pricing Engine:** Globally set retail prices for frontend rendering.
- **Promo & Bonus Management System:** Create codes (e.g., CEKLAUNCH) that calculate discounts dynamically during the user's checkout flow.