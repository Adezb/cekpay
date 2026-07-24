# Progressive Web App (PWA) Specification
**Product:** CEKPay
**Goal:** Transform the React + Vite SPA into an installable, standalone mobile experience with offline shell capabilities.

## 1. Technical Implementation (Vite Plugin PWA)
The project must utilize the `vite-plugin-pwa` package to handle the manifest generation and Service Worker registration automatically.

### 1.1 Vite Configuration (`vite.config.ts`)
- Set `registerType: 'autoUpdate'` so users receive app updates silently in the background.
- Include all static assets in the Workbox `globPatterns` (e.g., `**/*.{js,css,html,ico,png,svg}`) so the UI shell loads instantly, even on poor network connections.
- Configure Workbox runtime caching:
  - **Static Assets (Images, Fonts, CSS):** Use `CacheFirst` strategy.
  - **API Calls (Supabase, Paystack, Aggregators):** Use `NetworkOnly` or `NetworkFirst` strategy. VTU transactions MUST NOT be cached to prevent false balance readings.

### 1.2 Web App Manifest (`manifest.webmanifest`)
The manifest must be configured inside `vite-plugin-pwa` to trigger the "Add to Home Screen" prompt:
- `name`: "CEKPay"
- `short_name`: "CEKPay"
- `display`: "standalone" (Crucial: Removes the browser URL bar to make it look like a native app).
- `orientation`: "portrait"
- `theme_color`: "#1E3A8A" (Tailwind `blue-900`)
- `background_color`: "#F8FAFC" (Tailwind `slate-50`)
- `icons`: Must include generated sizes (192x192 and 512x512) for iOS and Android compatibility.

---

### 1.3 OneSignal Web SDK & Push Notification Setup
To enable cross-platform push delivery (Web, Android, iOS) without managing raw Web Push subscriptions:
- **SDK Initialization:** Initialize the OneSignal Web SDK (v16+) on app launch in `src/main.tsx` / `App.tsx` using `OneSignal.init({ appId: import.meta.env.VITE_ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true })`.
- **Service Worker Co-Existence:**
  - Place `OneSignalSDKWorker.js` in the `public/` directory so it is served at root level (`/OneSignalSDKWorker.js`).
  - Workbox (via `vite-plugin-pwa`) generates `sw.js` for app shell asset caching. Workbox runtime caching must exclude `OneSignalSDKWorker.js` to ensure the OneSignal worker operates independently without asset cache interference or scope conflicts.
- **User Identity Mapping (`external_id`):**
  - Upon successful Supabase authentication (login/signup), map the user by executing `OneSignal.login(user.id)`, linking their OneSignal registration to their Supabase `user_id` as the `external_id`.
  - Upon user sign out, call `OneSignal.logout()` to sever the session mapping.

---

## 2. PWA UI/UX Mobile Enhancements

To ensure CEKPay feels indistinguishable from a native downloaded app, the frontend must implement the following mobile-web optimizations:

### 2.1 CSS Native Behaviours
- **Disable Text Selection:** Apply `user-select: none;` globally to prevent users from accidentally highlighting text while tapping buttons. (Only allow selection on input fields and the receipt text).
- **Disable Pull-to-Refresh:** Use CSS `overscroll-behavior-y: none;` on the `body` tag to prevent the browser from reloading the page when a user swipes down on the dashboard.
- **Safe Area Insets:** Use `padding-top: env(safe-area-inset-top);` and `padding-bottom: env(safe-area-inset-bottom);` so the UI does not clash with the iPhone notch or Android navigation bars.

### 2.2 Custom Install Prompt
- Do not rely solely on the browser's default install prompt, as it is easily missed.
- The React app must listen for the `beforeinstallprompt` browser event.
- If the app is not installed, render a subtle, dismissible banner inside the UI (e.g., above the dashboard): *"Install CEKPay to your home screen for faster access."*

### 2.3 Offline Fallback UI
- If the user opens the app without an internet connection, the cached Service Worker will load the UI. 
- The app must detect `navigator.onLine === false`.
- Disable the transaction buttons (Airtime, Data, etc.) and display a floating red warning banner: *"You are currently offline. Please check your internet connection."*

### 2.4 Native Feature Hooks (Web Share API)
To ensure the "App-like" experience and drive organic user acquisition, the frontend must leverage the Web Share API to replace native functionality:

- **Goal:** Allow users to share the app directly to their WhatsApp contacts or social media (mimicking the native "Share App" feature).
- **Implementation:** When the user clicks a "Share CEKPay" button (located in the profile menu or on successful receipts), the app should trigger `navigator.share()`.
- **Logic Guard:** Wrap the function in an `if (navigator.share)` check, as it requires a secure context (HTTPS) and relies on the device's native sharing capabilities.
- **Message Payload:**
```javascript
  navigator.share({
    title: 'CEKPay - High Speed VTU',
    text: 'Download the CEKPay App for instant airtime, data, and bill payments!',
    url: window.location.origin // Shares the actual app URL, NOT the manifest file.
  })
```
