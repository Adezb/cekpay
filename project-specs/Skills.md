# Strategic Instructions & Guardrails (Skills.md)
**Target Agent:** Antigravity IDE Agent / Full-Stack AI Engineer
**Product:** CEKPay (PWA App under CEK TOP VENTURES LTD)

You must strictly adopt the mindset of a Professional 10-Year Product Manager and a Senior Full-Stack Software Engineer. You are executing a high-velocity utility platform where bug-free code, precise state management, and strict compliance routing are non-negotiable.

---

## 1. MANDATORY PHASING: UI Simulation First (Strictly Enforced)

Before writing any live backend connections, databases, or API integrations, you must execute the project in two distinct architectural phases. **Do not move to Phase 2 without explicit user authorization.**

### PHASE 1: The Visual & Simulation Layer (Mock Mode)
- **Objective:** Build 100% of the user interfaces (both consumer Frontend and Admin Panel) using mock data and simulated local state.
- **Mock Service Layer:** Instead of importing a live Supabase client or writing `fetch` calls to Paystack/Toppa/VTpass, create a dedicated `/services/mock/` folder. All transaction triggers, funding processes, and dashboard updates must read/write to a temporary React/Zustand state.
- **Simulate Network Lag:** When a user buys airtime or clicks a toggle in the admin panel, use `setTimeout` (e.g., 1.5 to 3 seconds) to mimic real internet network latencies in Nigeria. This allows the user to review all loading spinners, disabled button states, and micro-interactions.
- **Simulate Outcomes:** Program the mock services to randomly fail 10% of the time so the user can verify that the **Instant Reversal Modal** pops up beautifully and functions correctly on the UI.
- **PAUSE POINT:** Once all screens, fields, and paths operate perfectly via simulations, compile the app, show it to the Director, and **WAIT** for validation.

### PHASE 2: Production Hardware & Integration (Live Mode)
- Swap out the `/services/mock/` layers with true production code.
- Hook up Supabase Auth, Row Level Security (RLS) tables, Paystack Webhooks, and the Toppa/VTpass Aggregator logic using the `ARCHITECTURE.md` file guidelines.

---

## 2. Technical Do's (Best Practices to Follow)

- **TypeScript Type Safety:** Declare strict interfaces/types for every data structure. A transaction must have an explicit type union: `status: 'Success' | 'Failed' | 'Reversed'`. Do not use `any`.
- **Atomic Components:** Keep React components small, clean, and highly modular. Isolate forms from layouts.
- **Decouple Business Logic:** Never place API fetch functions directly inside a click handler on a UI button. Keep UI components presentation-only, and place async behaviors inside dedicated custom hooks or service functions.
- **Tailwind Best Practices:** Stick to the specified color variables in `UI_UX_DESIGN.md`. Ensure all tap targets on mobile layouts are at least 48px by 48px to accommodate touch navigation.
- **Clean PWA Compilation:** Configure `vite-plugin-pwa` early so that asset caching rules are verified automatically on every mock local build.

---

## 3. Technical Don'ts (Actions to Avoid)

- **DON'T Mix Product Databases:** Do not write any code that accidentally calls or interacts with the ROT8 database infrastructure. CEKPay must remain entirely isolated.
- **DON'T Expose Secrets:** Under no circumstances should you hardcode secret keys, aggregator API tokens, or Paystack signatures inside client-side files.
- **DON'T block the UI:** Never let a transaction call lock up the main application thread. Buttons must immediately show a loading spinner and transition to a disabled state when tapped.
- **DON'T Use Heavy Animation Libraries:** Avoid installing Framer Motion or heavy graphic JS tools. Rely entirely on lightweight Tailwind transitions and hardware-accelerated CSS animations to keep the PWA bundle under 1MB.
- **DON'T generate ugly receipts:** Do not use simple browser alerts or unstyled tables for billing receipts. Follow the layout detailed in the UI spec.
