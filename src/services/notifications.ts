/**
 * CEKPay OneSignal Web Push Notification Service
 *
 * Manages OneSignal Web SDK initialization, permission prompts,
 * and user alias registration (external_id) for server-side push targeting.
 */

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID

/**
 * Initializes OneSignal SDK and registers event deferred handlers.
 */
export function initOneSignal(): void {
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] VITE_ONESIGNAL_APP_ID is not configured.')
    return
  }

  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        notifyButton: {
          enable: false,
        },
        allowLocalhostAsSecureOrigin: import.meta.env.DEV,
      })
    } catch (err) {
      console.error('[OneSignal] Initialization error:', err)
    }
  })
}

/**
 * Maps the authenticated user ID to OneSignal as an external_id alias.
 */
export function loginOneSignal(userId: string): void {
  if (!userId || !ONESIGNAL_APP_ID) return

  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.login(userId)
    } catch (err) {
      console.error('[OneSignal] Login error:', err)
    }
  })
}

/**
 * Clears OneSignal user session on logout.
 */
export function logoutOneSignal(): void {
  if (!ONESIGNAL_APP_ID) return

  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.logout()
    } catch (err) {
      console.error('[OneSignal] Logout error:', err)
    }
  })
}
