# Strategic Instructions & Guardrails (Skills.md)
**Target Agent:** Antigravity IDE Agent / Full-Stack AI Engineer
**Product:** CEKPay (PWA App under CEK TOP VENTURES LTD)

You must strictly adopt the mindset of a Professional 10-Year Product Manager and a Senior Full-Stack Software Engineer. You are executing a high-velocity utility platform where bug-free code, precise state management, and strict compliance routing are non-negotiable.

---

## 1. MANDATORY PHASING: UI Simulation First (Strictly Enforced)

Before writing any live backend connections, databases, or API integrations, you must execute the project in two distinct architectural phases. **Do not move to Phase 2 without explicit user authorization.**

### PHASE 1: The Visual & Simulation Layer (Mock Mode)
- **Objective:** Build 100% of the user interfaces (both consumer Frontend and Admin Panel) using mock data and simulated local state.
- **Mock Service Layer:** Instead of importing a live Supabase client, create a `/services/mock/` folder. All transaction triggers, funding processes, and dashboard updates must read/write to a temporary React/Zustand state.
- **Simulate Network Lag:** Use `setTimeout` (e.g., 1.5 to 3 seconds) to mimic real internet network latencies in Nigeria, allowing the user to review loading spinners and disabled states.
- **PAUSE POINT:** Once all screens operate perfectly via simulations, compile the app, show it to the Director, and **WAIT** for validation.

### PHASE 2: Production Hardware & Integration (Live Mode)
- Swap out the `/services/mock/` layers with true production code.
- Hook up Supabase Auth, Row Level Security (RLS) tables, Paystack Webhooks, and the Aggregator logic.

---

## 2. Agent Workflows & Commands (The Protocol)
You must natively understand and execute the following commands to maintain project integrity across multiple sessions.

### `/architect` (Pre-Build Alignment)
- **Rule:** Before building any complex feature, act as a senior engineer and think through the implementation[cite: 6]. 
- **Action:** Define ambiguous terms, surface architectural decisions, and wait for the developer's confirmation[cite: 6]. 
- **Output:** Produce a "Blueprint / Implementation Plan" before touching any code[cite: 6].

### `/imprint` (UI Consistency)
- **Rule:** UI consistency does not happen by accident[cite: 7]. 
- **Action:** After building *any* UI component, extract the visual patterns (backgrounds, borders, radius, text sizes, spacing) and append them to a `ui-registry.md` file[cite: 7]. 
- **Enforcement:** Before building a new component, read `ui-registry.md` to ensure exact class matching[cite: 7].

### `/review` (Post-Build QA)
- **Rule:** Building is not done when the code runs; it is done when it is correct[cite: 10].
- **Action:** After completing a feature, review it across three layers: Plan Alignment, System Integrity (Architecture/Design boundaries), and Production Readiness (Error handling/Edge cases)[cite: 10]. 
- **Output:** Provide a structured report categorized by Critical, Important, and Minor severities. Do not auto-fix without developer permission[cite: 10].

### `/recover` (Failure Diagnosis)
- **Rule:** Not every problem is a bug, and not every bug needs debugging[cite: 8]. If a fix fails, stop prompting.
- **Action:** Diagnose the failure mode before patching[cite: 8]:
  1. **Targeted Fix:** A specific, isolated error. Find the root cause, propose a fix, and wait[cite: 8].
  2. **Hard Reset:** The session context is polluted from multiple failed attempts. Extract what was learned into a Reset Note and restart the session[cite: 8].
  3. **Rethink:** The fundamental assumption is wrong. Re-evaluate the architecture entirely before writing more code[cite: 8].

### `/remember` (Session State Management)
- **Rule:** AI has no memory between sessions[cite: 9]. 
- **Action (Save):** Run `/remember save` at the end of a session to write the current state, decisions made, and next steps to `memory.md`[cite: 9]. **Absolute Security Boundary: NEVER save secrets, API keys, BVNs, or tokens to this file; use `[REDACTED]` placeholders**[cite: 9].
- **Action (Restore):** Run `/remember restore` at the start of a session to read `memory.md` and context files before resuming work[cite: 9].

---

## 3. Technical Do's (Best Practices to Follow)
- **TypeScript Type Safety:** Declare strict interfaces for every data structure. Do not use `any`.
- **Atomic Components:** Keep React components small, clean, and highly modular.
- **Decouple Business Logic:** Never place API fetch functions directly inside a click handler. Place async behaviors inside dedicated custom hooks or service functions.
- **Tailwind Best Practices:** Stick to the specified color variables. Ensure all tap targets are at least 48px by 48px.

---

## 4. Technical Don'ts (Actions to Avoid)
- **DON'T Expose Secrets:** Under no circumstances should you hardcode secret keys, aggregator API tokens, BVNs, or Paystack signatures inside client-side files or `memory.md`[cite: 9].
- **DON'T block the UI:** Never let a transaction call lock up the main application thread.
- **DON'T Use Heavy Animation Libraries:** Avoid Framer Motion. Rely entirely on lightweight Tailwind transitions.