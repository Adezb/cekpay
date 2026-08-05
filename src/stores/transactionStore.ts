/**
 * CEKPay Transaction Store — Phase 2B-3
 *
 * Zustand store managing transaction history. Supports:
 *   - Fetching transactions via service switchboard
 *   - Prepending new transactions
 *   - Real-time PostgreSQL subscription to `public.transactions` table
 */

import { create } from 'zustand'
import type { Transaction, TransactionService, TransactionStatus } from '../types'
import { getTransactions } from '../services'
import { useAuthStore } from './authStore'
import { supabase } from '../lib/supabase'

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

  // ── Selectors ──
  getByService: (service: TransactionService) => Transaction[]
  getByStatus: (status: TransactionStatus) => Transaction[]
  getRecent: (count?: number) => Transaction[]
}

// ─── Deduplication & Merge Helper ─────────────────────────────

function mergeTransactions(existing: Transaction[], incoming: Transaction[]): Transaction[] {
  const map = new Map<string, Transaction>()

  for (const t of existing) {
    const key = t.id || t.reference
    if (key) map.set(key, t)
  }

  for (const t of incoming) {
    const key = t.id || t.reference
    if (key) map.set(key, t)
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

// ─── Store ────────────────────────────────────────────────

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  // ── Initial Data ──
  transactions: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all transactions for the current user.
   */
  fetchTransactions: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ error: 'Not authenticated', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const fetched = await getTransactions(user.id)
      set((state) => ({
        transactions: mergeTransactions(state.transactions, fetched),
        isLoading: false,
        error: null,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions'
      set({ error: message, isLoading: false })
    }
  },

  /**
   * Add / Merge a transaction in the store.
   */
  addTransaction: (txn: Transaction) => {
    set((state) => ({
      transactions: mergeTransactions(state.transactions, [txn]),
    }))
  },

  /**
   * Reset transaction state.
   */
  reset: () => {
    set({ transactions: [], isLoading: false, error: null })
  },

  // ── Selectors ──────────────────────────────────────────

  getByService: (service: TransactionService) => {
    return get().transactions.filter((t) => t.service === service)
  },

  getByStatus: (status: TransactionStatus) => {
    return get().transactions.filter((t) => t.status === status)
  },

  getRecent: (count = 5) => {
    return get().transactions.slice(0, count)
  },
}))

// ─── Real-Time PostgreSQL Transactions Subscription ────────

if (import.meta.env.VITE_USE_MOCK !== 'true') {
  supabase
    .channel('public:transactions')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'transactions' },
      (payload) => {
        const user = useAuthStore.getState().user
        if (user && payload.new && payload.new.user_id === user.id) {
          const newTxn: Transaction = {
            id: payload.new.id,
            userId: payload.new.user_id,
            reference: payload.new.reference,
            type: payload.new.type,
            service: payload.new.service,
            amount: Number(payload.new.amount),
            status: payload.new.status,
            aggregatorUsed: payload.new.aggregator_used || undefined,
            paymentProcessor: payload.new.payment_processor || undefined,
            recipient: payload.new.recipient || undefined,
            provider: payload.new.provider || undefined,
            planName: payload.new.plan_name || undefined,
            createdAt: payload.new.created_at,
          }

          useTransactionStore.setState((state) => ({
            transactions: mergeTransactions(state.transactions, [newTxn]),
          }))
        }
      }
    )
    .subscribe()
}
