# Progressive Web App (PWA) Specification
**Product:** CEKPay (Parent: CEK TOP VENTURES LTD)  
**Target Supabase Project:** `eexiftsuuouucvjytuhz`  
**Goal:** Transform the React 19 + Vite 8 SPA into an installable, standalone mobile experience with offline shell capabilities and push alerts.

---

## 1. Technical Implementation (Vite Plugin PWA & Workbox)

The application utilizes `vite-plugin-pwa` (v1.3.0+) for web manifest generation, Workbox precaching, and Service Worker registration.

### 1.1 Vite Configuration (`vite.config.ts`)
- **Registration Type:** `registerType: 'autoUpdate'` ensures users receive app shell updates silently in the background.
- **Static Assets Precache:** `includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg']`.
- **Workbox Caching & Navigation Rules:**
  - `globPatterns`: `['**/*.{js,css,html,ico,png,svg}']` for instant UI shell loading offline.
  - `globIgnores`: `['**/OneSignalSDKWorker.js']` to explicitly exclude the local OneSignal push worker from Workbox precaching.
  - `navigateFallbackDenylist`: `[/^\/OneSignalSDKWorker\.js$/, /^\/functions\/v1\//, /^https:\/\/.*\.supabase\.co/]` — Crucial rule ensuring Workbox never intercepts OneSignal push workers or Supabase Edge Function API calls.
  - `runtimeCaching`:
    - **Supabase Edge Functions (`/^https:\/\/.*\.supabase\.co\/functions\/v1\//i`):** Protected by `NetworkOnly` strategy (VTU transactions, PIN verifications, and financial operations MUST NOT be cached).
    - **OneSignal Remote APIs (`onesignal.com`):** `NetworkOnly` strategy (no runtime-caching rule targets the local `OneSignalSDKWorker.js`).
    - **Static External Assets (`api.*`):** `NetworkFirst` strategy (5s timeout).

### 1.2 Web App Manifest Configuration
Configured inside `vite.config.ts` to trigger native "Add to Home Screen" prompts:
- `name`: "CEKPay"
- `short_name`: "CEKPay"
- `display`: "standalone" (Removes browser URL bar for native app feel).
- `orientation`: "portrait"
- `theme_color`: "#1E3A8A" (Tailwind `blue-900`)
- `background_color`: "#F8FAFC" (Tailwind `slate-50`)
- `icons`: Includes SVG manifest assets (`CEKPay-192x192.svg` and `CEKPay-512x512.svg`, maskable) for scalable cross-device compatibility.

---

## 2. OneSignal Web SDK & Push Notification Co-Existence

### 2.1 Worker Co-Existence Architecture
To enable cross-platform push delivery without Workbox scope conflicts:
- **OneSignal Worker Script:** Located at `public/OneSignalSDKWorker.js` containing:
  ```javascript
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
  ```
  Served at root level (`/OneSignalSDKWorker.js`).
- **Workbox Worker (`sw.js`):** Handles app shell asset caching.
- **Isolation Guarantee:** Workbox `navigateFallbackDenylist` and runtime rules explicitly bypass `/OneSignalSDKWorker.js`, allowing both workers to operate independently at root scope.

### 2.2 User Identity Mapping (`external_id`)
- Upon Supabase login/signup, `OneSignal.login(user.id)` links the user's Supabase `user_id` as the OneSignal `external_id`.
- Server-side Deno Edge Functions (`paystack-webhook`, `vtu-transaction-engine`) target push alerts directly via `include_aliases: { external_id: [userId] }`.
- Upon sign out, `OneSignal.logout()` severs the session mapping.

---

## 3. PWA Mobile UI/UX Optimizations

### 3.1 CSS Native Behaviors
- **Disable Text Selection:** `user-select: none;` applied globally (except input fields and transaction receipt text).
- **Disable Pull-to-Refresh:** `overscroll-behavior-y: none;` on `body` tag prevents page reloads during downward swipes.
- **Safe Area Insets:** `padding-top: env(safe-area-inset-top);` and `padding-bottom: env(safe-area-inset-bottom);` prevent UI clipping on iOS notches and Android gesture bars.

### 3.2 Offline Shell & Fallback UI
- If opened without internet, the cached Workbox Service Worker renders the full app UI shell.
- When `navigator.onLine === false`, transaction action buttons disable dynamically and display a top warning banner: *"You are currently offline. Please check your internet connection."*

### 3.3 Native Web Share API Integration
- On receipt screens and referral links, clicking "Share Receipt" triggers `navigator.share()` to export formatted receipt summaries directly to WhatsApp, Telegram, or native device apps.
