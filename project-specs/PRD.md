# Product Requirements Document (PRD)
**Product Name:** CEKPay
**Parent Company:** CEK TOP VENTURES LTD (RC Registered)
**Target Audience:** Everyday Consumers in Nigeria (B2C Focus)
**Core Value Proposition:** "The Speedboat of VTU" — Unmatched speed, zero visual clutter, 2-tap transactions, and guaranteed instant reversals for failed transactions.

## 1. Product Overview
CEKPay is a modern, high-speed Virtual Top-Up (VTU) and bill payment web application designed specifically for the Nigerian consumer market. Unlike bulky "super apps," CEKPay focuses entirely on utility velocity: allowing users to buy Airtime, Data, Electricity tokens, and Cable TV subscriptions with zero friction.

### 1.1 Technical Stack (Strict Enforcement)
- **Frontend Framework:** React + Vite + TypeScript.
- **Styling:** Tailwind CSS (Minimalist, glassmorphism UI/UX).
- **Backend & Database:** Supabase (PostgreSQL, Edge Functions, Row Level Security, Auth).
- **Primary Payment/Wallet Processor:** Paystack (Dedicated Virtual Accounts).
- **VTU/Utility Aggregators:** Toppa Hub Digital API (Primary Data/Airtime) & VTpass API (Primary Bills / Fallback Data).

---

## 2. Core Features (Frontend)

### 2.1 Frictionless Onboarding & Auth
- Users sign up with exactly 4 fields: Phone Number (with OTP verification), First Name, Last Name, and a 4-digit Transaction PIN.
- BVN/NIN is **not** required for Tier 1 limits (to maximize instant conversions).
- **Background Action:** Upon PIN creation, the system triggers the Paystack API to instantly generate a Dedicated Virtual Account (DVA) linked to the user's wallet.

### 2.2 The "Speedboat" Dashboard
- A clean, uncluttered interface. No ads, no loan offers.
- **Top Section:** Displays Wallet Balance and the static Paystack Virtual Account Details (e.g., *Wema Bank - 0123456789*).
- **Core Actions:** Four massive buttons: Airtime, Data, Electricity, Cable TV.
- **Smart Contacts:** A directory showing previously saved numbers/meters (e.g., "Mom's Phone", "Home Meter").

### 2.3 The "Two-Tap" Transaction Flow
- The app automatically detects the user's network carrier from their phone number.
- Users select a plan, input their 4-digit PIN, and purchase. 
- Target transaction completion time: Under 5 seconds.

### 2.4 Information & Announcement Banner
- A prominent but clean notification area at the top of the dashboard.
- Dynamically displays real-time updates broadcasted from the admin panel (e.g., *"MTN Data prices adjusted due to network updates,"* or *"Weekend Promo: Get 5% bonus points on all electricity payments!"*).

### 2.5 Customer Support Floating Action Button (FAB)
- A persistent, floating support button in the bottom right corner of the screen (matching the ROT8 user experience).
- Clicking the button opens a clean micro-modal or direct link routing the user seamlessly to **CEKPay WhatsApp Business Support** or an integrated live-chat widget for instant human assistance.

### 2.6 The "Magic Moment" Receipt Generation
- Upon success, the app generates a highly stylized, branded image receipt (not a plain text block).
- Includes a native "Share to WhatsApp" button for easy forwarding.

---

## 3. Core Features (Backend & Admin Panel)

### 3.1 Financial Infrastructure (Paystack Compliance)
- **Business Configuration:** Set up under Paystack as "Registered Business" mapped to CEK TOP VENTURES LTD.
- **Category:** `Utilities -> Bill-payments` (Crucial for DVA compliance and high-velocity processing).
- **Projected Volume:** ₦100,000,000+ (To prevent automated risk flags during scaling).
- **Webhook Processing:** A dedicated Supabase Edge Function to securely listen to Paystack `charge.success` events and instantly credit the user's database wallet.

### 3.2 The "Circuit Breaker" Auto-Failover System
- To guarantee 99.9% uptime, CEKPay uses a multi-aggregator strategy.
- **Logic:** Backend pings the Primary API first. If it times out (> 10 seconds) or returns an error, the system automatically aborts and re-routes the request to the Secondary API without alerting the user.

### 3.3 The "Instant Reversal" Guarantee
- **Logic:** If an aggregator returns a definitive failure response (e.g., invalid meter number or downstream telco failure), the transaction must NOT be stuck in "Pending."
- The backend must instantly reverse the deducted amount back to the user's wallet, triggering an immediate UI modal notification.

### 3.4 Extended Admin Panel Capabilities (Business Operations)
- **User Management Center:** 
  - Search, view, and filter all registered CEKPay users.
  - View individual user profiles, transaction histories, and active wallet balances.
  - Administrative override controls: Ability to manually fund/debit a wallet (for correction scenarios), or Ban/Unban users instantly.
- **Dynamic Product Pricing Engine:**
  - View raw cost prices fetched from your active aggregators (Toppa, VTpass).
  - Globally set, update, and manage retail prices/markups for every individual data plan, airtime tier, electricity disco, and cable TV package sold on the frontend.
- **Promo & Bonus Management System:**
  - Configure entry-level welcome bonuses, point-multiplier events, or transaction cashbacks.
  - Set custom validity windows and rule triggers for promotional campaigns.
- **Information & Announcement Control Room:**
  - Create, publish, edit, and archive site-wide announcements.
  - Target these messages to appear dynamically in the frontend information center to instantly communicate critical operational shifts, price drops, or promotional events.

---

## 4. Database High-Level Requirements (Supabase)
- **`users` table:** Links to Supabase Auth. Stores Name, Phone, PIN hash, status (Active/Banned).
- **`wallets` table:** Stores Paystack customer ID, Virtual Account Details, and current balance.
- **`transactions` table:** Stores reference ID, type, category, amount, status, and the aggregator used.
- **`product_prices` table:** Stores product identifiers, aggregator cost price, and the admin-configured retail price for frontend rendering.
- **`announcements` table:** Stores text content, active status flag, and priority levels for frontend display.
- **`promos` table:** Stores campaign metadata, discount/bonus percentages, and conditional triggers.
- **`smart_contacts` table:** Stores user_id, alias, identifier, and provider type. 
- **Security:** Strict Row Level Security (RLS) policies. Users can only read/write their own personal data. Admin mutations require specialized system-role or service-key privileges.
