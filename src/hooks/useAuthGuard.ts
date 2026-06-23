import { useState, useEffect } from 'react'

export interface AuthGuardData {
  isAuthenticated: boolean
  isLocked: boolean
  isAdmin: boolean
  user: {
    firstName: string
    role: 'admin' | 'user'
  } | null
}

interface RawMockAuth {
  isAuthenticated: boolean
  isLocked: boolean
  role: 'admin' | 'user'
  firstName: string
}

const getMockAuth = (): RawMockAuth => {
  const defaultValue: RawMockAuth = {
    isAuthenticated: false,
    isLocked: false,
    role: 'admin',
    firstName: 'Demo',
  }
  try {
    const val = localStorage.getItem('cekpay_mock_auth')
    return val ? JSON.parse(val) : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Custom hook to manage auth guard state checks across protected, public, and locked route gates.
 * In Phase 4, this hook will be re-wired to consume the Zustand auth store directly.
 */
export const useAuthGuard = (): AuthGuardData => {
  const [auth, setAuth] = useState<RawMockAuth>(getMockAuth())

  useEffect(() => {
    const handler = () => {
      setAuth(getMockAuth())
    }
    window.addEventListener('cekpay_auth_change', handler)
    return () => window.removeEventListener('cekpay_auth_change', handler)
  }, [])

  return {
    isAuthenticated: auth.isAuthenticated,
    isLocked: auth.isLocked,
    isAdmin: auth.role === 'admin',
    user: auth.isAuthenticated
      ? { firstName: auth.firstName, role: auth.role }
      : null,
  }
}
