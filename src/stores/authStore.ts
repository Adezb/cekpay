/**
 * CEKPay Auth Store — Phase 2B-2
 *
 * Zustand store managing authentication state, persistent sessions,
 * Supabase Auth listener, and the App Lock screen.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, SignupRequest } from '../types'
import { supabase } from '../lib/supabase'
import {
  signup as serviceSignup,
  sendPass as serviceSendPass,
  verifyPass as serviceVerifyPass,
  createPin as serviceCreatePin,
  verifyPin as serviceVerifyPin,
  login as serviceLogin,
} from '../services'

// ─── State Shape ──────────────────────────────────────────

interface AuthState {
  // ── Data ──
  user: User | null
  phone: string | null         // Persisted across auth flow steps
  isAuthenticated: boolean
  isLocked: boolean            // App Lock state
  isAdmin: boolean             // Admin toggle / role check

  // ── Auth Flow Actions ──
  signup: (data: SignupRequest) => Promise<void>
  sendPass: (phone: string, email?: string) => Promise<{ success: boolean; message: string }>
  verifyPass: (pass: string) => Promise<boolean>
  createPin: (pin: string) => Promise<void>
  login: (phone: string, pin: string) => Promise<void>

  // ── App Lock Actions ──
  unlockWithPin: (pin: string) => Promise<boolean>
  lockApp: () => void

  // ── Session Actions ──
  logout: () => Promise<void>
  toggleAdminRole: () => void
  updateUser: (updates: Partial<User>) => void
}

// ─── Initial State ────────────────────────────────────────

const INITIAL_STATE = {
  user: null as User | null,
  phone: null as string | null,
  isAuthenticated: false,
  isLocked: false,
  isAdmin: false,
}

// ─── Store ────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ── Initial Data ──
      ...INITIAL_STATE,

      // ══════════════════════════════════════════════
      //  AUTH FLOW
      // ══════════════════════════════════════════════

      /**
       * Step 1: Register a new user.
       * Stores phone for subsequent pass/PIN steps.
       */
      signup: async (data: SignupRequest) => {
        const user = await serviceSignup(data)
        set({ user, phone: data.phone })
      },

      /**
       * Step 2: Generate and send a 6-char alphanumeric Pass.
       * Passes phone and email to delivery engine.
       */
      sendPass: async (phone: string, email?: string) => {
        const targetEmail = email || get().user?.email
        if (!targetEmail || targetEmail.trim() === '') {
          throw new Error('Email address is required for Pass delivery.')
        }
        set({ phone })
        return await serviceSendPass(phone, targetEmail)
      },

      /**
       * Step 3: Verify the alphanumeric pass.
       */
      verifyPass: async (pass: string) => {
        const { phone } = get()
        if (!phone) throw new Error('No phone number in auth state. Please start over.')
        return await serviceVerifyPass(phone, pass)
      },

      /**
       * Step 4: Create 4-digit PIN (bcrypt hashed server-side) and provision wallet.
       * Completes the signup flow — sets isAuthenticated=true, isLocked=false.
       */
      createPin: async (pin: string) => {
        const { user } = get()
        if (!user) throw new Error('No user in auth state. Please start over.')

        await serviceCreatePin(user.id, pin)

        const updatedUser: User = { ...user, pinHash: '' }

        set({
          user: updatedUser,
          isAuthenticated: true,
          isLocked: false,
          isAdmin: updatedUser.role === 'admin',
        })

        _dispatchAuthChange()
      },

      /**
       * Login an existing user with phone and 4-digit PIN.
       */
      login: async (phone: string, pin: string) => {
        const user = await serviceLogin(phone, pin)

        set({
          user,
          phone,
          isAuthenticated: true,
          isLocked: false,
          isAdmin: user.role === 'admin',
        })

        _dispatchAuthChange()
      },

      // ══════════════════════════════════════════════
      //  APP LOCK
      // ══════════════════════════════════════════════

      /**
       * Verify PIN on the lock screen via server-side bcrypt compare.
       */
      unlockWithPin: async (pin: string) => {
        const { user } = get()
        if (!user) return false

        const isValid = await serviceVerifyPin(user.id, pin)
        if (isValid) {
          set({ isLocked: false })
          _dispatchAuthChange()
        }
        return isValid
      },

      /**
       * Lock the app (called by inactivity timer).
       */
      lockApp: () => {
        const { isAuthenticated } = get()
        if (isAuthenticated) {
          set({ isLocked: true })
          _dispatchAuthChange()
        }
      },

      // ══════════════════════════════════════════════
      //  SESSION
      // ══════════════════════════════════════════════

      /**
       * Logout: clear Supabase session and local state.
       */
      logout: async () => {
        try {
          if (import.meta.env.VITE_USE_MOCK !== 'true') {
            await supabase.auth.signOut()
          }
        } catch (err) {
          console.error('Supabase signout error:', err)
        }
        set({ ...INITIAL_STATE })
        _dispatchAuthChange()
      },

      /**
       * Toggle admin role for testing.
       */
      toggleAdminRole: () => {
        const { isAdmin, user } = get()
        const newIsAdmin = !isAdmin

        if (user) {
          set({
            isAdmin: newIsAdmin,
            user: { ...user, role: newIsAdmin ? 'admin' : 'user' },
          })
        } else {
          set({ isAdmin: newIsAdmin })
        }

        _dispatchAuthChange()
      },

      /**
       * Update local user fields.
       */
      updateUser: (updates: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } })
          _dispatchAuthChange()
        }
      },
    }),
    {
      name: 'cekpay-auth',

      /**
       * On rehydration: if authenticated, force isLocked=true (App Lock shield).
       */
      onRehydrateStorage: () => {
        return (state) => {
          if (state && state.isAuthenticated) {
            state.isLocked = true
            _dispatchAuthChange()
          }
        }
      },

      partialize: (state) => ({
        user: state.user,
        phone: state.phone,
        isAuthenticated: state.isAuthenticated,
        isLocked: state.isLocked,
        isAdmin: state.isAdmin,
      }),
    },
  ),
)

// ─── Supabase Session Hydration Listener ───────────────────

if (import.meta.env.VITE_USE_MOCK !== 'true') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) {
        console.warn('Profiles query error during auth state change:', error.message)
        return
      }

      if (profile && profile.id === session.user.id) {
        const user: User = {
          id: profile.id,
          email: profile.email,
          phone: profile.phone,
          firstName: profile.first_name,
          lastName: profile.last_name,
          pinHash: '',
          role: profile.role as 'user' | 'admin',
          isBanned: profile.is_banned,
        }

        useAuthStore.setState({
          user,
          phone: profile.phone,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
        })
        _dispatchAuthChange()
      } else {
        useAuthStore.setState({ ...INITIAL_STATE })
        _dispatchAuthChange()
      }
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ ...INITIAL_STATE })
      _dispatchAuthChange()
    }
  })
}

// ─── Legacy Event Bridge ──────────────────────────────────

function _dispatchAuthChange() {
  const state = useAuthStore.getState()

  const legacyAuth = {
    isAuthenticated: state.isAuthenticated,
    isLocked: state.isLocked,
    role: state.user?.role ?? (state.isAdmin ? 'admin' : 'user'),
    firstName: state.user?.firstName ?? 'User',
  }
  localStorage.setItem('cekpay_mock_auth', JSON.stringify(legacyAuth))

  window.dispatchEvent(new Event('cekpay_auth_change'))
}
