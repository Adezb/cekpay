/**
 * CEKPay Auth Store — Phase 4.4
 *
 * Zustand store managing authentication state, persistent sessions,
 * and the App Lock screen. Persisted to localStorage so auth survives
 * page refreshes and app restarts.
 *
 * Persistence behavior:
 *   - First signup completion (after PIN creation): isAuthenticated=true, isLocked=false
 *   - App close/refresh (session exists in persist): isAuthenticated=true, isLocked=true
 *   - Inactivity timeout (5 min): isLocked=true
 *   - Successful PIN on lock screen: isLocked=false
 *   - Logout: clear all, isAuthenticated=false, isLocked=false
 *
 * @see Phase 4.4 in implementation_plan.md
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, SignupRequest } from '../types'
import {
  mockSignup,
  mockSendPass,
  mockVerifyPass,
  mockCreatePin,
  mockVerifyPin,
  mockLogin,
} from '../services/mock/mockServices'

// ─── State Shape ──────────────────────────────────────────

interface AuthState {
  // ── Data ──
  user: User | null
  phone: string | null         // Persisted across auth flow steps
  isAuthenticated: boolean
  isLocked: boolean            // App Lock state
  isAdmin: boolean             // Hardcoded toggle for Phase 1 testing

  // ── Auth Flow Actions ──
  signup: (data: SignupRequest) => Promise<void>
  sendPass: (phone: string) => Promise<string>
  verifyPass: (pass: string) => Promise<boolean>
  createPin: (pin: string) => Promise<void>
  login: (phone: string, pin: string) => Promise<void>

  // ── App Lock Actions ──
  unlockWithPin: (pin: string) => Promise<boolean>
  lockApp: () => void

  // ── Session Actions ──
  logout: () => void
  toggleAdminRole: () => void  // DEV ONLY: flip isAdmin for testing
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
        const user = await mockSignup(data)
        set({ user, phone: data.phone })
      },

      /**
       * Step 2: Generate and "send" a 6-char alphanumeric Pass.
       * Returns the pass for dev visibility (logged to console by mockSendPass).
       */
      sendPass: async (phone: string) => {
        set({ phone })
        const { pass } = await mockSendPass(phone)
        return pass
      },

      /**
       * Step 3: Verify the alphanumeric pass.
       */
      verifyPass: async (pass: string) => {
        const { phone } = get()
        if (!phone) throw new Error('No phone number in auth state. Please start over.')
        return await mockVerifyPass(phone, pass)
      },

      /**
       * Step 4: Create 4-digit PIN and provision wallet.
       * Completes the signup flow — sets isAuthenticated=true, isLocked=false.
       */
      createPin: async (pin: string) => {
        const { user } = get()
        if (!user) throw new Error('No user in auth state. Please start over.')

        await mockCreatePin(user.id, pin)

        // Update user with PIN hash set
        const updatedUser: User = { ...user, pinHash: pin }

        set({
          user: updatedUser,
          isAuthenticated: true,
          isLocked: false,
          isAdmin: updatedUser.role === 'admin',
        })

        // Dispatch event for legacy hooks still listening
        _dispatchAuthChange()
      },

      /**
       * Login an existing user with phone and PIN.
       */
      login: async (phone: string, pin: string) => {
        const user = await mockLogin(phone, pin)
        
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
       * Verify PIN on the lock screen.
       * Returns true if unlock succeeded, false otherwise.
       */
      unlockWithPin: async (pin: string) => {
        const { user } = get()
        if (!user) return false

        const isValid = await mockVerifyPin(user.id, pin)
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
       * Logout: clear all state and redirect to signup.
       */
      logout: () => {
        set({ ...INITIAL_STATE })
        _dispatchAuthChange()
      },

      /**
       * DEV ONLY: Toggle admin role for testing.
       */
      toggleAdminRole: () => {
        const { isAdmin, user } = get()
        const newIsAdmin = !isAdmin

        // Also update the user's role field for consistency
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
    }),
    {
      name: 'cekpay-auth',   // localStorage key

      /**
       * On rehydration: if the user was authenticated, force isLocked=true.
       * This ensures returning users always see the PIN lock screen.
       */
      onRehydrateStorage: () => {
        return (state) => {
          if (state && state.isAuthenticated) {
            state.isLocked = true
            _dispatchAuthChange()
          }
        }
      },

      /**
       * Only persist data fields — actions are re-created by Zustand.
       */
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

// ─── Legacy Event Bridge ──────────────────────────────────

/**
 * Dispatches a custom event so that legacy hooks (useAuthGuard, useInactivityTimer)
 * that still listen on `cekpay_auth_change` can react to state changes.
 *
 * This also syncs the old `cekpay_mock_auth` localStorage key used by the
 * Dev Toolbar and legacy hooks, ensuring backward compatibility until
 * those consumers are fully migrated to the Zustand store.
 */
function _dispatchAuthChange() {
  const state = useAuthStore.getState()

  // Sync legacy localStorage format
  const legacyAuth = {
    isAuthenticated: state.isAuthenticated,
    isLocked: state.isLocked,
    role: state.user?.role ?? (state.isAdmin ? 'admin' : 'user'),
    firstName: state.user?.firstName ?? 'Demo',
  }
  localStorage.setItem('cekpay_mock_auth', JSON.stringify(legacyAuth))

  // Fire the custom event
  window.dispatchEvent(new Event('cekpay_auth_change'))
}
