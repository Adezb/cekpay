# Product Design (UI/UX) Specification
**Product:** CEKPay
**Design Philosophy:** "Speed, Clarity, Privacy, and Trust." 

In fintech, trust is answered in the first three seconds by layout density, color precision, typography weight, and data privacy. CEKPay is designed to be highly legible in bright outdoor sunlight and incredibly lightweight for fast rendering on mobile browsers.

## 1. Design System & Variables

### 1.1 Color Palette
Color in fintech is not just decoration; it is a signal. We avoid pure black text and rely on a strict contrast system.
- **Primary Brand (Trust):** `#1E3A8A` (Tailwind `blue-900`) - Used for the main header, Primary CTA buttons, and active states.
- **Background (Canvas):** `#F8FAFC` (Tailwind `slate-50`) - A very soft, breathable off-white to reduce eye strain.
- **Surface/Card:** `#FFFFFF` (Pure White) - For wallet cards and transaction panels.
- **Success (Signal):** `#059669` (Tailwind `emerald-600`) - Used exclusively for successful transaction amounts and the "Receipt Share" button.
- **Error/Reversal (Signal):** `#DC2626` (Tailwind `red-600`) - Reserved strictly for failed transactions or error states.
- **Text Primary:** `#0F172A` (Tailwind `slate-900`) - For high legibility.
- **Text Secondary/Muted:** `#64748B` (Tailwind `slate-500`) - For timestamps, labels, and minor details.

### 1.2 Typography
- **Font Family:** `Inter` or `Plus Jakarta Sans` (Sans-serif, highly legible numbers).
- **Rule:** Numbers must be instantly readable. Balances use heavy font weights (e.g., `font-bold`), while descriptive text uses regular weights.

### 1.3 Border Radius & Shadows (Glassmorphism Light)
- **Cards/Buttons:** Use `rounded-xl` or `rounded-2xl` for a modern, approachable feel.
- **Shadows:** Use subtle depth (`shadow-sm` and `shadow-md`) to elevate the Wallet Card and Floating Action Button (FAB) above the canvas.

---

## 2. Global Components

### 2.1 Buttons
- **Primary CTA:** Full width on mobile, `bg-blue-900 text-white rounded-xl py-3 font-semibold`. 
- **Disabled State:** Opacity 50%, unclickable (Used explicitly on the Sign-up page before T&C consent). 
- **Loading State:** Text is replaced with a clean CSS spinner (no heavy JS animations).

### 2.2 Form Inputs (The 2-Tap Rule)
- Floating labels or deeply contrasted placeholder text.
- Large tap targets (minimum 48px height) to prevent fat-finger errors on mobile.
- Native number keyboards (`inputMode="numeric"`) automatically triggered for Phone, Amount, BVN, and PIN fields.

---

## 3. The Consumer Journey UI (B2C)

### 3.1 Authentication & Onboarding
- **Layout:** Minimalist centered card featuring the CEKPay logo and a bold greeting.
- **Input Fields:** First Name, Last Name, Phone Number, and Email Address.
- **Compliance Checkbox:** A prominent checkbox stating *"I agree to the Terms of Service and Privacy Policy"* (with clickable links).
- **Action Gate:** The main **Send Pass** CTA button must remain in a visually disabled state until the compliance checkbox is ticked.

### 3.2 The "Speedboat" Dashboard (Main View)
- **Top Information Banner:** A slim, full-width strip at the top for admin announcements. Can be dismissed.
- **The Wallet Card:** 
  - Placed at the top of the viewport with a deep blue gradient background.
  - **Privacy Mode Default:** Balance displays as `****` initially[cite: 5]. Features a clickable 'eye' toggle icon next to it to reveal/hide the true balance.
  - **Account Details:** Shows Virtual Account details below the balance (e.g., *Wema Bank - 0123456789*) with a tiny "Copied!" tooltip upon clicking[cite: 5].
  - **Action Row:** Two inline, highly visible buttons integrated directly into the card: **Create Wallet** (dynamically changes to **Fund Wallet** upon DVA activation) and **Withdraw**.
- **Quick Action Grid:**
  - 2x2 grid of massive, square buttons: **Airtime**, **Data**, **Electricity**, **Cable**[cite: 5].
  - Each button features a minimalist SVG icon and bold text[cite: 5]. 
- **Smart Contacts Section:**
  - Horizontal scrolling list of circular avatars with initials right below the Action Grid[cite: 5].
- **Floating Action Button (FAB):**
  - Fixed to the bottom right. Opens a support route directly to WhatsApp or Live Chat[cite: 5].

### 3.3 The KYC & DVA Creation Flow (Modals)
- **Step 1 Modal (Bank Binding):** Triggered when clicking "Create Wallet" for the first time. Displays a clean form to input "Bank Name" (dropdown) and "Account Number". 
- **Step 2 Modal (Vetting & BVN):** Triggered on subsequent clicks of "Create Wallet" if Step 1 is done.
  - **Read-Only Vetting Display:** Shows user's fetched First Name, Last Name, Email, and Linked Local Bank Account details.
  - **Actionable Inputs:** A clean text field to enter the BVN on-the-spot.
  - **Consent Checkbox:** A mandatory tick-box for *"Consent to DVA Creation"*. Button unlocks only when checked.

### 3.4 Transaction Flow (Slide-up Modal)
- When a user clicks "Data", do not navigate to a whole new page[cite: 5]. Slide up a bottom-sheet modal (on mobile) or a centered modal (on desktop)[cite: 5].
- **UI Sequence:**
  1. Input Phone Number (Auto-detects network, shows MTN/Airtel logo)[cite: 5].
  2. Select Plan (Grid of selectable pills: "1GB - ₦350", "2GB - ₦700")[cite: 5].
  3. Enter 4-digit PIN to confirm[cite: 5].

### 3.5 The Receipt Screen (The Magic Moment)
- Replaces the modal upon success[cite: 5].
- **Layout:** Designed to look like a physical paper receipt overlaid on the screen[cite: 5].
- **Contents:** CEKPay Logo, "Transaction Successful" in Green, Amount, Date, Reference ID[cite: 5].
- **CTA:** A prominent "Share Receipt" button that utilizes the native Web Share API to export a clean image[cite: 5].

---

## 4. Admin Panel UI

### 4.1 Layout Structure
- **Sidebar Navigation:** Fixed on the left (Desktop) or hidden behind a hamburger menu (Mobile)[cite: 5]. Contains: Dashboard, Users, Products & Pricing, Announcements, Settings[cite: 5].
- **Main Content Area:** Grey background with white data cards[cite: 5].

### 4.2 Key Admin Interfaces
- **The Failover Switchboard:** A distinct card in the settings showing active aggregators[cite: 5]. Uses large UI toggle switches to easily swap aggregators[cite: 5].
- **Data Density Tables:** User lists and transaction histories must resemble high-density financial data layouts[cite: 5]. Tight padding, alternating row colors, and explicit status badges (`pill-green` for Success, `pill-red` for Reversed)[cite: 5].
- **Pricing Configuration:** A table where the Admin can see "Cost Price" (from aggregator) and an editable input field for "Retail Price"[cite: 5].

---

## 5. Tailwind CSS Guidelines for the AI Agent
- Utilize utility classes for **all** styling[cite: 5]. Do not create custom CSS files unless absolute necessary for complex glassmorphism[cite: 5].
- Use `backdrop-blur-md bg-white/70` for sticky headers or modals to achieve a modern iOS-like depth[cite: 5].
- Implement responsive design strictly using Tailwind's `md:` and `lg:` prefixes, defaulting to mobile-first layouts[cite: 5].