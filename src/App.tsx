import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ToastContainer } from './components/ui/ToastContainer'
import { AuthLayout } from './layouts/AuthLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { AppLockScreen } from './pages/AppLockScreen'
import { DevPlayground } from './pages/DevPlayground'
import { SignupPage } from './pages/auth/SignupPage'
import { LoginPage } from './pages/auth/LoginPage'
import { PassVerifyPage } from './pages/auth/PassVerifyPage'
import { CreatePinPage } from './pages/auth/CreatePinPage'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { ProfilePage } from './pages/ProfilePage'
import { useAuthGuard } from './hooks/useAuthGuard'
import { useInactivityTimer } from './hooks/useInactivityTimer'
import { useAuthStore } from './stores/authStore'
import { DEMO_USER } from './services/mock/mockData'

// ==========================================
// Persistent Mock Auth Store for Routing
// ==========================================
export interface MockAuthData {
  isAuthenticated: boolean
  isLocked: boolean
  role: 'admin' | 'user'
  firstName: string
}

export const getMockAuth = (): MockAuthData => {
  const defaultValue: MockAuthData = {
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

export const setMockAuth = (auth: MockAuthData) => {
  localStorage.setItem('cekpay_mock_auth', JSON.stringify(auth))
  window.dispatchEvent(new Event('cekpay_auth_change'))
}

export const useMockAuth = () => {
  const [auth, setAuth] = useState<MockAuthData>(getMockAuth())
  useEffect(() => {
    const handler = () => setAuth(getMockAuth())
    window.addEventListener('cekpay_auth_change', handler)
    return () => window.removeEventListener('cekpay_auth_change', handler)
  }, [])
  return auth
}

// ==========================================
// Route Guards / Gates
// ==========================================

// Gate 1 & 2: Protected Routes (Must be Authenticated and Unlocked)
const ProtectedRoutes: React.FC = () => {
  const auth = useAuthGuard()

  if (!auth.isAuthenticated) {
    return <Navigate to="/auth/signup" replace />
  }

  if (auth.isLocked) {
    return <Navigate to="/lock" replace />
  }

  return <Outlet />
}

// Gate 3: Admin Role Guard (Must have role === 'admin')
const AdminRoutes: React.FC = () => {
  const user = useAuthStore((state) => state.user)

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

// Public-only Routes (Only accessible when Unauthenticated)
const PublicRoutes: React.FC = () => {
  const auth = useAuthGuard()

  if (auth.isAuthenticated) {
    if (auth.isLocked) {
      return <Navigate to="/lock" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

// Lock-only Route Gate
const LockRoute: React.FC = () => {
  const auth = useAuthGuard()

  if (!auth.isAuthenticated) {
    return <Navigate to="/auth/signup" replace />
  }

  if (!auth.isLocked) {
    return <Navigate to="/dashboard" replace />
  }

  return <AppLockScreen />
}

// ==========================================
// Page Skeleton Placeholders for Phase 1-9
// ==========================================
// Skeleton removed, using actual component

// Skeleton removed, using actual component

// Skeleton removed, using actual component

// DashboardPage is imported from ./pages/DashboardPage

// Imported ProfilePage above
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'

import { AdminUsersPage } from './pages/admin/AdminUsersPage'

import { AdminPricingPage } from './pages/admin/AdminPricingPage'

import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage'

import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'

import { AdminPromosPage } from './pages/admin/AdminPromosPage'

import { InstallPrompt } from './components/features/InstallPrompt'

// ==========================================
// Interactive Developer Simulation Toolbar
// ==========================================
const DevToolbar: React.FC = () => {
  const auth = useMockAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-4 left-4 z-50 bg-slate-900/90 text-white rounded-full p-2.5 shadow-lg border border-slate-700/50 hover:bg-slate-950 transition-all flex items-center justify-center pointer-events-auto"
        title="Open Dev Simulation Panel"
      >
        <span className="text-base select-none">🛠️</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-3 w-64 border border-slate-800 pointer-events-auto">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 select-none">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Dev Sim Control Panel
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white text-sm font-bold focus:outline-none"
        >
          ✕
        </button>
      </div>
      <div className="space-y-3 text-xs">
        <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
          <span className="font-semibold">Authenticated</span>
          <input
            type="checkbox"
            checked={auth.isAuthenticated}
            onChange={(e) => {
              setMockAuth({ ...auth, isAuthenticated: e.target.checked })
              if (e.target.checked && !useAuthStore.getState().user) {
                // Populate mock user if we are bypassing auth to avoid infinite skeleton loading
                useAuthStore.setState({ user: DEMO_USER, phone: DEMO_USER.phone })
              }
            }}
            className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
          />
        </label>
        <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
          <span className="font-semibold">App Locked</span>
          <input
            type="checkbox"
            checked={auth.isLocked}
            onChange={(e) => setMockAuth({ ...auth, isLocked: e.target.checked })}
            className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
          />
        </label>
        <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
          <span className="font-semibold">Admin Role</span>
          <input
            type="checkbox"
            checked={auth.role === 'admin'}
            onChange={(e) => setMockAuth({ ...auth, role: e.target.checked ? 'admin' : 'user' })}
            className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
          />
        </label>
      </div>
      <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 text-center select-none font-medium">
        Use controls to test route transitions and layout behaviors instantly.
      </div>
    </div>
  )
}

// ==========================================
// App Router Entrypoint
// ==========================================
function App() {
  useInactivityTimer()
  return (
    <BrowserRouter>
      <Routes>
        {/* DEV ONLY ROUTES (excluded from production builds) */}
        {import.meta.env.DEV && (
          <Route path="/dev" element={<DevPlayground />} />
        )}

        {/* PUBLIC AUTH ROUTES (Gate 1 Public Guard) */}
        <Route element={<PublicRoutes />}>
          <Route path="/auth" element={<AuthLayout><Outlet /></AuthLayout>}>
            <Route path="signup" element={<SignupPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="verify-pass" element={<PassVerifyPage />} />
            <Route path="create-pin" element={<CreatePinPage />} />
          </Route>
        </Route>

        {/* LOCK ROUTE GATE */}
        <Route path="/lock" element={<LockRoute />} />

        {/* PROTECTED ROUTES (Gate 1 & Gate 2 Auth/Lock Guard) */}
        <Route element={<ProtectedRoutes />}>
          {/* Base Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Consumer Protected Routes */}
          <Route element={<DashboardLayout><Outlet /></DashboardLayout>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Administrator Protected Routes (Gate 3: Admin Role Guard) */}
          <Route element={<AdminRoutes />}>
            <Route path="/admin" element={<AdminLayout><Outlet /></AdminLayout>}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="pricing" element={<AdminPricingPage />} />
              <Route path="announcements" element={<AdminAnnouncementsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="promos" element={<AdminPromosPage />} />
            </Route>
          </Route>
        </Route>

        {/* FALLBACK WILD ROUTE */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Embedded Simulation Toolbar (hidden in production) */}
      {import.meta.env.DEV && <DevToolbar />}

      {/* Global PWA Install Prompt */}
      <InstallPrompt />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App
