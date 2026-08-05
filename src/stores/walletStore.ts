/**
 * CEKPay Wallet Store — Phase 2B-3
 *
 * Zustand store managing the user's wallet state. Supports:
 *   - Fetching wallet via service switchboard
 *   - Local debit/credit balance sync
 *   - Real-time PostgreSQL subscription to `public.wallets` table
 */

import { create } from 'zustand'
import type { Wallet } from '../types'
import { getDashboard } from '../services'
import { useAuthStore } from './authStore'
import { supabase } from '../lib/supabase'

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
  setBalance: (newBalance: number) => void
  reset: () => void
}

// ─── Store ────────────────────────────────────────────────

export const useWalletStore = create<WalletState>()((set, get) => ({
  // ── Initial Data ──
  wallet: null,
  isLoading: false,
  error: null,

  /**
   * Fetch the wallet from the service layer.
   */
  fetchWallet: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ error: 'Not authenticated', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const data = await getDashboard(user.id)
      set({ wallet: data.wallet, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallet'
      set({ error: message, isLoading: false })
    }
  },

  /**
   * Locally debit the wallet balance after a successful transaction.
   * Skipped in live mode as PostgreSQL Realtime payload is authoritative.
   */
  debit: (amount: number) => {
    if (import.meta.env.VITE_USE_MOCK !== 'true') return
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
   * Locally credit the wallet balance.
   * Skipped in live mode as PostgreSQL Realtime payload is authoritative.
   */
  credit: (amount: number) => {
    if (import.meta.env.VITE_USE_MOCK !== 'true') return
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
   * Authoritatively set the wallet balance.
   */
  setBalance: (newBalance: number) => {
    const { wallet } = get()
    if (!wallet) return

    set({
      wallet: {
        ...wallet,
        balance: newBalance,
      },
    })
  },

  /**
   * Reset wallet state.
   */
  reset: () => {
    set({ wallet: null, isLoading: false, error: null })
  },
}))

// ─── Real-Time PostgreSQL Wallet Subscription ──────────────

if (import.meta.env.VITE_USE_MOCK !== 'true') {
  supabase
    .channel('public:wallets')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'wallets' },
      (payload) => {
        const currentWallet = useWalletStore.getState().wallet
        if (currentWallet && payload.new && payload.new.user_id === currentWallet.userId) {
          useWalletStore.setState({
            wallet: {
              ...currentWallet,
              balance: Number(payload.new.balance),
              accountNumber: payload.new.dva_account_number || currentWallet.accountNumber,
              bankName: payload.new.dva_bank_name || currentWallet.bankName,
              paystackCustomerCode: payload.new.paystack_customer_code || currentWallet.paystackCustomerCode,
            },
          })
        }
      }
    )
    .subscribe()
}
