/**
 * CEKPay UI Store — Phase 4.8
 *
 * Global UI state managed via Zustand. Centralizes:
 *   - Toast notifications (message, type, auto-dismiss)
 *   - Modal open/close state (generic key-based)
 *   - Announcement dismiss tracking (per-session)
 *   - Online/offline network status
 *
 * Not persisted — all UI state resets on page refresh.
 *
 * @see Phase 4.8 in implementation_plan.md
 */

import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info'

export interface ToastData {
  id: string
  message: string
  type: ToastType
}

// ─── State Shape ──────────────────────────────────────────

interface UIState {
  // ── Toast ──
  toasts: ToastData[]
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
  clearToasts: () => void

  // ── Modal ──
  openModals: Set<string>
  openModal: (key: string) => void
  closeModal: (key: string) => void
  isModalOpen: (key: string) => boolean
  reversalAmount: number
  setReversalAmount: (amount: number) => void
  receiptTransaction: import('../types').Transaction | null
  setReceiptTransaction: (txn: import('../types').Transaction | null) => void
  activeSmartContact: import('../types').SmartContact | null
  setActiveSmartContact: (contact: import('../types').SmartContact | null) => void

  // ── Announcements ──
  dismissedAnnouncements: Set<string>
  dismissAnnouncement: (announcementId: string) => void
  isAnnouncementDismissed: (announcementId: string) => boolean

  // ── Network Status ──
  isOnline: boolean
  setOnline: (status: boolean) => void

  // ── Reset ──
  reset: () => void
}

// ─── Helpers ──────────────────────────────────────────────

let toastCounter = 0
function nextToastId(): string {
  return `toast_${++toastCounter}_${Date.now()}`
}

/** Auto-dismiss delay for toasts (ms). */
const TOAST_AUTO_DISMISS = 4000

// ─── Store ────────────────────────────────────────────────

export const useUIStore = create<UIState>()((set, get) => ({
  // ══════════════════════════════════════════════
  //  TOAST
  // ══════════════════════════════════════════════

  toasts: [],

  /**
   * Show a toast notification.
   * Auto-dismisses after TOAST_AUTO_DISMISS ms.
   */
  showToast: (message: string, type: ToastType = 'info') => {
    const id = nextToastId()
    const toast: ToastData = { id, message, type }

    set((state) => ({
      toasts: [...state.toasts, toast],
    }))

    // Auto-dismiss
    setTimeout(() => {
      get().dismissToast(id)
    }, TOAST_AUTO_DISMISS)
  },

  /**
   * Dismiss a specific toast by ID.
   */
  dismissToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  /**
   * Clear all active toasts.
   */
  clearToasts: () => {
    set({ toasts: [] })
  },

  // ══════════════════════════════════════════════
  //  MODAL
  // ══════════════════════════════════════════════

  openModals: new Set<string>(),
  reversalAmount: 0,
  receiptTransaction: null,

  /**
   * Set the amount for the reversal modal to display.
   */
  setReversalAmount: (amount: number) => {
    set({ reversalAmount: amount })
  },

  /**
   * Set the transaction for the receipt modal.
   */
  setReceiptTransaction: (txn: import('../types').Transaction | null) => {
    set({ receiptTransaction: txn })
  },

  activeSmartContact: null,
  setActiveSmartContact: (contact: import('../types').SmartContact | null) => {
    set({ activeSmartContact: contact })
  },

  /**
   * Open a modal by key (e.g., 'confirm-purchase', 'add-contact').
   */
  openModal: (key: string) => {
    set((state) => {
      const next = new Set(state.openModals)
      next.add(key)
      return { openModals: next }
    })
  },

  /**
   * Close a modal by key.
   */
  closeModal: (key: string) => {
    set((state) => {
      const next = new Set(state.openModals)
      next.delete(key)
      return { openModals: next }
    })
  },

  /**
   * Check whether a modal is currently open.
   */
  isModalOpen: (key: string) => {
    return get().openModals.has(key)
  },

  // ══════════════════════════════════════════════
  //  ANNOUNCEMENTS
  // ══════════════════════════════════════════════

  dismissedAnnouncements: new Set<string>(),

  /**
   * Mark an announcement as dismissed for this session.
   * The user won't see it again until the page is refreshed.
   */
  dismissAnnouncement: (announcementId: string) => {
    set((state) => {
      const next = new Set(state.dismissedAnnouncements)
      next.add(announcementId)
      return { dismissedAnnouncements: next }
    })
  },

  /**
   * Check whether an announcement has been dismissed.
   */
  isAnnouncementDismissed: (announcementId: string) => {
    return get().dismissedAnnouncements.has(announcementId)
  },

  // ══════════════════════════════════════════════
  //  NETWORK STATUS
  // ══════════════════════════════════════════════

  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  /**
   * Update the online/offline status.
   * Called by the event listeners set up in the App component.
   */
  setOnline: (status: boolean) => {
    set({ isOnline: status })
  },

  // ══════════════════════════════════════════════
  //  RESET
  // ══════════════════════════════════════════════

  /**
   * Reset all UI state (called on logout).
   */
  reset: () => {
    set({
      toasts: [],
      openModals: new Set<string>(),
      dismissedAnnouncements: new Set<string>(),
    })
  },
}))

// ─── Network Status Listeners ─────────────────────────────

/**
 * Auto-register browser online/offline listeners.
 * Runs once on module load (safe for SSR — guarded by `typeof window`).
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useUIStore.getState().setOnline(true)
    useUIStore.getState().showToast('You are back online', 'success')
  })

  window.addEventListener('offline', () => {
    useUIStore.getState().setOnline(false)
    useUIStore.getState().showToast('You are offline. Some features may be unavailable.', 'error')
  })
}
