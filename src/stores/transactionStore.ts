/**
 * CEKPay Transaction Store — Phase 4.6
 *
 * Zustand store managing transaction history. Provides:
 *   - `fetchTransactions()` — loads history from the mock service
 *   - `addTransaction(txn)` — prepends a new transaction (after a purchase)
 *   - Filtering helpers for service type and status
 *
 * Not persisted — transactions are fetched fresh from the mock in-memory DB.
 * In production, TanStack Query will handle caching and refetching.
 *
 * @see Phase 4.6 in implementation_plan.md
 */

import { create } from 'zustand'
import type { Transaction, TransactionService, TransactionStatus } from '../types'
import { mockGetTransactions } from '../services/mock/mockServices'
import { useAuthStore } from './authStore'

// ─── State Shape ──────────────────────────────────────────

interface TransactionState {
  // ── Data ──
  transactions: Transaction[]
  isLoading: boolean
  error: string | null

  // ── Actions ──
  fetchTransactions: () => Promise<void>
  addTransaction: (txn: Transaction) => void
  reset: () => void

  // ── Derived / Selectors ──
  getByService: (service: TransactionService) => Transaction[]
  getByStatus: (status: TransactionStatus) => Transaction[]
  getRecent: (count?: number) => Transaction[]
}

// ─── Store ────────────────────────────────────────────────

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  // ── Initial Data ──
  transactions: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all transactions for the current user from the mock service.
   * Transactions come back sorted newest-first from the service layer.
   */
  fetchTransactions: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ error: 'Not authenticated', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const transactions = await mockGetTransactions(user.id)
      set({ transactions, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions'
      set({ error: message, isLoading: false })
    }
  },

  /**
   * Prepend a new transaction to the store (called after a successful purchase).
   * The mock service already persists it in the in-memory DB — this just
   * keeps the Zustand state in sync without a full refetch.
   */
  addTransaction: (txn: Transaction) => {
    set((state) => ({
      transactions: [txn, ...state.transactions],
    }))
  },

  /**
   * Reset transaction state (called on logout).
   */
  reset: () => {
    set({ transactions: [], isLoading: false, error: null })
  },

  // ── Selectors ──────────────────────────────────────────

  /**
   * Filter transactions by service type (Airtime, Data, Electricity, Cable, Funding).
   */
  getByService: (service: TransactionService) => {
    return get().transactions.filter((t) => t.service === service)
  },

  /**
   * Filter transactions by status (Success, Failed, Reversed).
   */
  getByStatus: (status: TransactionStatus) => {
    return get().transactions.filter((t) => t.status === status)
  },

  /**
   * Get the N most recent transactions (default: 5).
   * Already sorted newest-first from the service layer.
   */
  getRecent: (count = 5) => {
    return get().transactions.slice(0, count)
  },
}))
