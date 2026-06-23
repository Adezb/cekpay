/**
 * CEKPay Wallet Store — Phase 4.5
 *
 * Zustand store managing the user's wallet state. Provides:
 *   - `fetchWallet()` — loads wallet from the mock dashboard service
 *   - `debit(amount)` — locally decrements the balance (after a successful transaction)
 *   - `credit(amount)` — locally increments the balance (after a wallet funding)
 *
 * The wallet is NOT persisted to localStorage — it is fetched fresh on each
 * dashboard load via `mockGetDashboard`. This keeps the store lightweight
 * and avoids stale balance data after a page refresh.
 *
 * @see Phase 4.5 in implementation_plan.md
 */

import { create } from 'zustand'
import type { Wallet } from '../types'
import { mockGetDashboard } from '../services/mock/mockServices'
import { useAuthStore } from './authStore'

// ─── State Shape ──────────────────────────────────────────

interface WalletState {
  // ── Data ──
  wallet: Wallet | null
  isLoading: boolean
  error: string | null

  // ── Actions ──
  fetchWallet: () => Promise<void>
  debit: (amount: number) => void
  credit: (amount: number) => void
  reset: () => void
}

// ─── Store ────────────────────────────────────────────────

export const useWalletStore = create<WalletState>()((set, get) => ({
  // ── Initial Data ──
  wallet: null,
  isLoading: false,
  error: null,

  /**
   * Fetch the wallet from the mock dashboard service.
   * Reads the current userId from the auth store.
   */
  fetchWallet: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ error: 'Not authenticated', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const data = await mockGetDashboard(user.id)
      set({ wallet: data.wallet, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallet'
      set({ error: message, isLoading: false })
    }
  },

  /**
   * Locally debit the wallet balance after a successful transaction.
   * Does NOT call the mock service — the service already debited the
   * in-memory DB. This just keeps the Zustand state in sync.
   */
  debit: (amount: number) => {
    const { wallet } = get()
    if (!wallet) return

    set({
      wallet: {
        ...wallet,
        balance: Math.max(0, wallet.balance - amount),
      },
    })
  },

  /**
   * Locally credit the wallet balance after a successful funding.
   */
  credit: (amount: number) => {
    const { wallet } = get()
    if (!wallet) return

    set({
      wallet: {
        ...wallet,
        balance: wallet.balance + amount,
      },
    })
  },

  /**
   * Reset wallet state (called on logout).
   */
  reset: () => {
    set({ wallet: null, isLoading: false, error: null })
  },
}))
