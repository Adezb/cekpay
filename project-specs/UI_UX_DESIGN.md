# Product Design (UI/UX) Specification
**Product:** CEKPay
**Design Philosophy:** "Speed, Clarity, and Trust." 

In fintech, trust is answered in the first three seconds by layout density, color precision, and typography weight. CEKPay is designed to be highly legible in bright outdoor sunlight (common in Nigeria) and incredibly lightweight for fast rendering on mobile browsers.

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
- **Disabled State:** Opacity 50%, unclickable. 
- **Loading State:** Text is replaced with a clean CSS spinner (no heavy JS animations).

### 2.2 Form Inputs (The 2-Tap Rule)
- Floating labels or deeply contrasted placeholder text.
- Large tap targets (minimum 48px height) to prevent fat-finger errors on mobile.
- Native number keyboards (`inputMode="numeric"`) automatically triggered for Phone, Amount, and PIN fields.

---

## 3. The Consumer Journey UI (B2C)

### 3.1 Authentication & Onboarding
- **Layout:** Minimalist centered card. 
- **Visuals:** Only the CEKPay logo, a bold greeting, and the 4 essential input fields.
- **Feedback:** Real-time green checkmark when the OTP is valid.

### 3.2 The "Speedboat" Dashboard (Main View)
- **Top Information Banner:** A slim, full-width strip at the very top (e.g., `bg-blue-50 text-blue-800 text-sm`) for admin announcements. Can be dismissed.
- **The Wallet Card:** 
  - Placed at the top of the viewport.
  - Deep blue gradient background.
  - Displays actual balance (Big, bold text).
  - Shows Virtual Account details below the balance (e.g., *Wema Bank - 0123456789*).
  - Includes a "Copy" icon next to the account number. Clicking it triggers a tiny "Copied!" tooltip.
- **Quick Action Grid:**
  - 2x2 grid of massive, square buttons: **Airtime**, **Data**, **Electricity**, **Cable**.
  - Each button features a minimalist SVG icon and bold text. 
- **Smart Contacts Section:**
  - Horizontal scrolling list of circular avatars with initials (e.g., "M" for Mom) right below the Action Grid.
- **Floating Action Button (FAB):**
  - Fixed to the bottom right (`fixed bottom-6 right-6`).
  - Circular, WhatsApp-green or CEKPay-blue, containing a headset/chat icon.
  - Opens support route directly.

### 3.3 Transaction Flow (Slide-up Modal)
- When a user clicks "Data", do not navigate to a whole new page. Slide up a bottom-sheet modal (on mobile) or a centered modal (on desktop).
- **UI Sequence:**
  1. Input Phone Number (Auto-detects network, shows MTN/Airtel logo).
  2. Select Plan (Grid of selectable pills: "1GB - ₦350", "2GB - ₦700").
  3. Enter 4-digit PIN to confirm.
- **Friction as a Feature:** The PIN entry screen acts as a deliberate trust mechanism, summarizing the exact amount to be deducted before final confirmation.

### 3.4 The Receipt Screen (The Magic Moment)
- Replaces the modal upon success.
- **Layout:** Designed to look like a physical paper receipt overlaid on the screen.
- **Contents:** CEKPay Logo, "Transaction Successful" in Green, Amount, Date, Reference ID.
- **CTA:** A prominent "Share Receipt" button that utilizes the native Web Share API to export a clean image to WhatsApp.

---

## 4. Admin Panel UI

### 4.1 Layout Structure
- **Sidebar Navigation:** Fixed on the left (Desktop) or hidden behind a hamburger menu (Mobile). Contains: Dashboard, Users, Products & Pricing, Announcements, Settings.
- **Main Content Area:** Grey background with white data cards.

### 4.2 Key Admin Interfaces
- **The Failover Switchboard:** A distinct card in the settings showing active aggregators. Uses large UI toggle switches to easily swap Toppa Hub Digital with VTpass.
- **Data Density Tables:** User lists and transaction histories must resemble high-density financial data layouts (like a Bloomberg terminal principle). Tight padding, clear alignment, alternating row colors (`bg-white` and `bg-slate-50`), and explicit status badges (`pill-green` for Success, `pill-red` for Reversed).
- **Pricing Configuration:** A table where the Admin can see "Cost Price" (from aggregator) and an editable input field for "Retail Price" (what CEKPay users pay).

---

## 5. Tailwind CSS Guidelines for the AI Agent
- Utilize utility classes for **all** styling. Do not create custom CSS files unless absolute necessary for complex glassmorphism.
- Use `backdrop-blur-md bg-white/70` for sticky headers or modals to achieve a modern iOS-like depth.
- Implement responsive design strictly using Tailwind's `md:` and `lg:` prefixes, defaulting to mobile-first layouts.
