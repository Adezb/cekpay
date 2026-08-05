/**
 * CEKPay Smart Contacts Store — Phase 2B-3
 *
 * Zustand store managing saved smart contacts (max 10).
 * Connects via service switchboard to PostgreSQL `smart_contacts` table.
 */

import { create } from 'zustand'
import type { SmartContact } from '../types'
import {
  addSmartContact,
  deleteSmartContact,
  updateSmartContact,
  getDashboard,
} from '../services'
import { useAuthStore } from './authStore'

const MAX_CONTACTS = 10

interface SmartContactsState {
  // ── Data ──
  contacts: SmartContact[]
  isLoading: boolean
  error: string | null

  // ── Actions ──
  fetchContacts: () => Promise<void>
  addContact: (contact: Omit<SmartContact, 'id'> | Omit<SmartContact, 'id' | 'userId'>) => Promise<void>
  deleteContact: (contactId: string) => Promise<void>
  updateContact: (contactId: string, updates: Partial<SmartContact>) => Promise<void>
  reset: () => void

  // ── Selectors ──
  canAddMore: () => boolean
}

export const useSmartContactsStore = create<SmartContactsState>()((set, get) => ({
  contacts: [],
  isLoading: false,
  error: null,

  fetchContacts: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ error: 'Not authenticated', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const data = await getDashboard(user.id)
      set({ contacts: data.smartContacts, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contacts'
      set({ error: message, isLoading: false })
    }
  },

  addContact: async (contactData: any) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')

    if (!get().canAddMore()) {
      throw new Error(`Maximum limit of ${MAX_CONTACTS} smart contacts reached. Delete a contact to add a new one.`)
    }

    set({ isLoading: true, error: null })

    try {
      const created = await addSmartContact({
        ...contactData,
        userId: user.id,
      })
      set((state) => ({
        contacts: [...state.contacts, created],
        isLoading: false,
        error: null,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add contact'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  deleteContact: async (contactId: string) => {
    set({ isLoading: true, error: null })

    try {
      await deleteSmartContact(contactId)
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

  updateContact: async (contactId: string, updates: Partial<SmartContact>) => {
    set({ isLoading: true, error: null })

    try {
      const updated = await updateSmartContact(contactId, updates)
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

  reset: () => {
    set({ contacts: [], isLoading: false, error: null })
  },

  canAddMore: () => {
    return get().contacts.length < MAX_CONTACTS
  },
}))
