/**
 * CEKPay Smart Contacts Store — Phase 4.7
 *
 * Zustand store managing the user's saved smart contacts (max 10).
 * Provides CRUD operations and a `canAddMore()` check enforcing
 * the Director-mandated 10-contact limit (Decision #5).
 *
 * Not persisted — contacts are fetched from the mock dashboard
 * service on each session load.
 *
 * @see Phase 4.7 in implementation_plan.md
 * @see Director Decision #5 — max 10 contacts per user
 */

import { create } from 'zustand'
import type { SmartContact } from '../types'
import {
  mockAddSmartContact,
  mockDeleteSmartContact,
  mockUpdateSmartContact,
  mockGetDashboard,
} from '../services/mock/mockServices'
import { useAuthStore } from './authStore'

// ─── Constants ────────────────────────────────────────────

/** Maximum smart contacts per user (Director Decision #5). */
const MAX_CONTACTS = 10

// ─── State Shape ──────────────────────────────────────────

interface SmartContactsState {
  // ── Data ──
  contacts: SmartContact[]
  isLoading: boolean
  error: string | null

  // ── Actions ──
  fetchContacts: () => Promise<void>
  addContact: (contact: Omit<SmartContact, 'id'>) => Promise<void>
  deleteContact: (contactId: string) => Promise<void>
  updateContact: (contactId: string, updates: Partial<SmartContact>) => Promise<void>
  reset: () => void

  // ── Selectors ──
  canAddMore: () => boolean
}

// ─── Store ────────────────────────────────────────────────

export const useSmartContactsStore = create<SmartContactsState>()((set, get) => ({
  // ── Initial Data ──
  contacts: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all smart contacts for the current user.
   * Uses the dashboard endpoint which returns contacts alongside other data.
   */
  fetchContacts: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ error: 'Not authenticated', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const data = await mockGetDashboard(user.id)
      set({ contacts: data.smartContacts, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contacts'
      set({ error: message, isLoading: false })
    }
  },

  /**
   * Add a new smart contact.
   * Rejects if the user already has MAX_CONTACTS (enforced both here and in the service layer).
   */
  addContact: async (contact: Omit<SmartContact, 'id'>) => {
    const { contacts } = get()

    // Client-side guard (service layer also enforces this)
    if (contacts.length >= MAX_CONTACTS) {
      set({
        error: `You can save a maximum of ${MAX_CONTACTS} smart contacts. Please delete one to add a new one.`,
      })
      throw new Error(`Maximum of ${MAX_CONTACTS} smart contacts reached.`)
    }

    set({ isLoading: true, error: null })

    try {
      const newContact = await mockAddSmartContact(contact)
      set((state) => ({
        contacts: [...state.contacts, newContact],
        isLoading: false,
        error: null,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add contact'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  /**
   * Delete a smart contact by ID.
   */
  deleteContact: async (contactId: string) => {
    set({ isLoading: true, error: null })

    try {
      await mockDeleteSmartContact(contactId)
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== contactId),
        isLoading: false,
        error: null,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete contact'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  /**
   * Update fields on an existing smart contact.
   */
  updateContact: async (contactId: string, updates: Partial<SmartContact>) => {
    set({ isLoading: true, error: null })

    try {
      const updated = await mockUpdateSmartContact(contactId, updates)
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === contactId ? updated : c)),
        isLoading: false,
        error: null,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update contact'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  /**
   * Reset contacts state (called on logout).
   */
  reset: () => {
    set({ contacts: [], isLoading: false, error: null })
  },

  /**
   * Returns true if the user can add more contacts (< MAX_CONTACTS).
   * Used by UI to disable the "+" button at the limit.
   */
  canAddMore: () => {
    return get().contacts.length < MAX_CONTACTS
  },
}))
