# Strategic Instructions & Guardrails (Skills.md)
**Target Agent:** Antigravity IDE Agent / Full-Stack AI Engineer  
**Product:** CEKPay (PWA App under CEK TOP VENTURES LTD)  
**Target Supabase Project:** `eexiftsuuouucvjytuhz`

You must strictly adopt the mindset of a Professional 10-Year Product Manager and a Senior Full-Stack Software Engineer. You are executing a high-velocity utility platform where bug-free code, precise state management, and strict compliance routing are non-negotiable.

---

## 1. MANDATORY PHASING & CERTIFICATION STATUS

The project follows a strict phased execution protocol. **Phases 1, 2, and 3 are fully completed, audited, and certified for production launch.**

### PHASE 1: Visual & Simulation Layer (COMPLETED & CERTIFIED)
- Built 100% of consumer and admin user interfaces with mock data and simulated local state (`/services/mock/`).
- Network latencies and failure modes verified via mock state.

### PHASE 2: Core Hardware & Infrastructure (COMPLETED & CERTIFIED)
- Deployed 10 PostgreSQL database migrations (8 Public Tables, 22 RLS Policies, 5 Database Triggers).
- Standardized phone storage to international MSISDN (`23480XXXXXXXX`) with DB regex constraint `^234[789][01]\d{8}$`.
- Deployed 5 core Deno Edge Functions (`auth-otp-delivery`, `verify-kyc-and-create-dva`, `paystack-webhook`, `process-withdrawal`, `vtu-transaction-engine`).

### PHASE 3: Live Integration & Production Cutover (COMPLETED & CERTIFIED)
- Implemented Option A Session Strategy (`sha256(msisdn + pin)`).
- Deployed PIN security Edge Functions (`set-user-pin` and `verify-pin`) enforcing server-side `bcrypt` hashing/comparison.
- Wired live API service layer ([apiServices.ts](../src/services/api/apiServices.ts)) and service switchboard ([services/index.ts](../src/services/index.ts)) with `VITE_USE_MOCK=false`.
- Configured real-time PostgreSQL subscriptions for `wallets` and `transactions`.
- Configured PWA Workbox `navigateFallbackDenylist` and created `public/OneSignalSDKWorker.js`.

---

## 2. Architectural Guardrails (Non-Negotiable)

1. **Zero-Liability Identity Rule:** User BVNs are proxied in memory directly to Paystack's Customer Validation API and **NEVER written to PostgreSQL tables or persistent storage**.
2. **MSISDN Phone Standard:** All phone inputs must be sanitized via `toMSISDN()` to `23480XXXXXXXX` before saving to DB or passing to external APIs (BulkSMSNigeria, Paystack).
3. **Bcrypt PIN Security:** PIN hashing and comparison MUST occur server-side inside Deno Edge Functions (`set-user-pin` & `verify-pin`). Never perform raw PIN comparisons in client code.
4. **Smart Contacts Cap:** Capped at **10 contacts per user**, enforced by PostgreSQL trigger `enforce_smart_contacts_limit()`.
5. **Aggregator Circuit Breaker Standard:** Primary Toppa Hub Digital (<8s timeout) → Fallback CheapDataHub. If both fail, execute instant atomic 502 reversal (`status: Reversed`). (VTpass is permanently purged).
6. **No Secret Key Exposure:** Secrets (`PAYSTACK_SECRET_KEY`, `TOPPA_API_KEY`, `CHEAPDATAHUB_API_KEY`, `CEKPAY_PROD_EMAIL_KEY`, `CEKPAY_PROD_ONESIGNAL_KEY`, `BULKSMSNIGERIA_API_KEY`) are stored exclusively in Supabase Vault and accessed via `Deno.env.get()`.

---

## 3. Agent Workflows & Commands (The Protocol)

### `/architect` (Pre-Build Alignment & Blueprinting)
- Define architectural decisions, produce implementation blueprints, and obtain explicit developer confirmation before executing code changes.

### `/imprint` (UI Consistency)
- Maintain UI consistency across components by adhering to established design system patterns in `UI_UX_DESIGN.md`.

### `/review` (Post-Build QA)
- Perform 3-layer post-build reviews: Plan Alignment, System Boundaries, and Production Readiness.

### `/recover` (Failure Diagnosis)
- Diagnose failure modes before patching (Targeted Fix, Hard Reset, or Rethink).

### `/remember` (Session State Management)
- Save session state and key architectural decisions while preserving security boundaries (**NEVER save secrets, API keys, BVNs, or tokens to persistent logs**).