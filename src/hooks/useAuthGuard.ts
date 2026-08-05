import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

export interface AuthGuardData {
  isAuthenticated: boolean
  isLocked: boolean
  isAdmin: boolean
  isPassVerified: boolean
  hasPin: boolean
  phone: string | null
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
  hasPin?: boolean
  isPassVerified?: boolean
}

const getMockAuth = (): RawMockAuth => {
  const defaultValue: RawMockAuth = {
    isAuthenticated: false,
    isLocked: false,
    role: 'admin',
    firstName: 'Demo',
    hasPin: false,
    isPassVerified: false,
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
 */
export const useAuthGuard = (): AuthGuardData => {
  const store = useAuthStore()
  const [mockAuth, setMockAuth] = useState<RawMockAuth>(getMockAuth())

  useEffect(() => {
    const handler = () => {
      setMockAuth(getMockAuth())
    }
    window.addEventListener('cekpay_auth_change', handler)
    return () => window.removeEventListener('cekpay_auth_change', handler)
  }, [])

  const isLive = import.meta.env.VITE_USE_MOCK !== 'true'

  if (isLive) {
    const isFullyAuth = store.isAuthenticated && store.hasPin
    return {
      isAuthenticated: isFullyAuth,
      isLocked: store.isLocked,
      isAdmin: store.isAdmin,
      isPassVerified: store.isPassVerified,
      hasPin: store.hasPin,
      phone: store.phone,
      user: isFullyAuth && store.user
        ? { firstName: store.user.firstName, role: store.user.role }
        : null,
    }
  }

  return {
    isAuthenticated: mockAuth.isAuthenticated && Boolean(mockAuth.hasPin),
    isLocked: mockAuth.isLocked,
    isAdmin: mockAuth.role === 'admin',
    isPassVerified: Boolean(mockAuth.isPassVerified),
    hasPin: Boolean(mockAuth.hasPin),
    phone: store.phone,
    user: mockAuth.isAuthenticated
      ? { firstName: mockAuth.firstName, role: mockAuth.role }
      : null,
  }
}
