# Product Design (UI/UX) Specification
**Product:** CEKPay  
**Design Philosophy:** "Speed, Clarity, Privacy, and Trust."

In fintech, trust is answered in the first three seconds by layout density, color precision, typography weight, and data privacy. CEKPay is designed to be highly legible in bright outdoor sunlight and incredibly lightweight for fast rendering on mobile browsers.

---

## 1. Design System & Variables

### 1.1 Color Palette
Color in fintech is not just decoration; it is a signal. We avoid pure black text and rely on a strict contrast system:
- **Primary Brand (Trust):** `#1E3A8A` (Tailwind `blue-900`) — Header, Primary CTA buttons, active tab states.
- **Background (Canvas):** `#F8FAFC` (Tailwind `slate-50`) — Breathable off-white canvas reducing eye strain.
- **Surface/Card:** `#FFFFFF` (Pure White) — Wallet cards and transaction panels.
- **Success (Signal):** `#059669` (Tailwind `emerald-600`) — Credit amounts, successful status pills (`Success`), receipt share buttons.
- **Error/Reversal (Signal):** `#DC2626` (Tailwind `red-600`) — Failed/Reversed transaction badges, input error text.
- **Text Primary:** `#0F172A` (Tailwind `slate-900`) — High legibility body text.
- **Text Secondary/Muted:** `#64748B` (Tailwind `slate-500`) — Timestamps, captions, labels.

### 1.2 Typography & Spacing
- **Font Family:** `Inter` or `Plus Jakarta Sans`.
- **Formatting:** Currency balances use heavy font weights (`font-bold`), while labels use regular weights.
- **Mobile Spacing:** Containers include `pb-12` (48px) bottom padding to prevent mobile virtual keyboards from obscuring primary action buttons.

### 1.3 Border Radius & Shadows (Glassmorphic Accent)
- **Cards & Modals:** `rounded-xl` or `rounded-2xl` for approachable modern aesthetics.
- **Shadows:** Subtle depth (`shadow-sm` and `shadow-md`) elevating the Wallet Card and Floating Action Button (FAB) above the canvas.

---

## 2. Global Components & Design Rules

### 2.1 Buttons & Loading States
- **Primary CTA:** Full width on mobile, `bg-blue-900 text-white rounded-xl py-3 font-semibold`.
- **Disabled State:** Opacity 50%, unclickable (e.g. Sign-up page before mandatory T&C consent).
- **Loading State:** Content replaced with a CSS spinner (no heavy JS animation libraries).

### 2.2 Form Inputs & Phone Normalization
- Minimum 48px tap targets to eliminate fat-finger errors on mobile devices.
- Native numeric keyboards (`inputMode="numeric"`) triggered for Phone, Amount, BVN, and PIN inputs.
- Phone fields accept raw local inputs (`08012345678`), which are sanitized in real time via `toMSISDN()` to `23480XXXXXXXX` before form submission.

---

## 3. Consumer Journey UI (B2C)

### 3.1 Authentication, Pass Verification & App Lock Shield
- **Sign-Up Screen:** Minimalist card with First Name, Last Name, Phone Number, Email, and mandatory Privacy Policy / T&C Consent Checkbox.
- **Pass Verification Screen:** Accepts 6-character alphanumeric pass delivered via BulkSMSNigeria SMS & Resend Email.
- **Create PIN Screen:** Two-step 4-digit PIN confirmation. Invokes `set-user-pin` Edge Function for server-side `bcrypt` hashing.
- **App Lock Screen:** Intercepts routing on page refresh or 5-minute inactivity (`isLocked: true`). Prompts for 4-digit PIN, verified server-side against `verify-pin` Edge Function.

### 3.2 "Speedboat" Dashboard
- **Announcement Strip:** Top banner for admin messages, capped at `max-h-10` on mobile viewports with marquee scroll for overflow text.
- **Wallet Card:** Deep blue gradient background:
  - **Privacy Toggle:** Default masked balance (`****`) with eye toggle to reveal true currency figures.
  - **DVA Display:** Displays Wema Bank virtual account details (`0123456789`) with "Copied!" tooltip upon tap.
  - **Action Row:** **Create Wallet / Fund Wallet** (dynamic rendering) and **Withdraw**.
- **Quick Action Grid:** 4 massive 2x2 grid buttons: **Airtime**, **Data**, **Electricity**, **Cable TV**.
- **Smart Contacts Directory:** Horizontal scrolling avatars. Display capped at **10 saved contacts**, enforced by database trigger `enforce_smart_contacts_limit()`.

### 3.3 Progressive KYC & DVA Modal Flow
- **Step 1 (Bank Binding):** Form to select Bank Name and enter 10-digit NUBAN. Verified via Paystack Resolve API.
- **Step 2 (Vetting & BVN Proxy):** Displays read-only user details, on-the-spot BVN text input, and mandatory DVA Consent Checkbox. Explains zero-storage identity guarantee.

### 3.4 Purchase & Receipt Flows
- **Bottom-Sheet Purchase Modals:** Carrier auto-detection (MTN, Airtel, Glo, 9mobile badges), plan grid, promo code field, and 4-digit PIN input.
- **Receipt Overlay:** Paper receipt design upon success showing CEKPay logo, emerald status badge, date, reference, and native Web Share API "Share Receipt" button.

---

## 4. Admin Panel UI

- **High-Density Data Tables:** Compact financial view for users, ledgers, and transactions (`pill-green` for Success, `pill-red` for Reversed).
- **Product Pricing Engine:** Configure retail prices and aggregator cost prices.
- **Internal Aggregator Metrics:** Aggregator failover (Toppa → CheapDataHub) is handled automatically by the `vtu-transaction-engine` Edge Function circuit breaker. `admin_settings` stores routing defaults as internal metrics.