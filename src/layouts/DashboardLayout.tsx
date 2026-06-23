import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { SmartContactsManager } from '../components/features/SmartContactsManager'
import { useAuthStore } from '../stores/authStore'

export interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const user = useAuthStore(state => state.user)

  if (!user) return null

  // Shared nav items for both desktop header and mobile bottom bar
  const navItems = [
    {
      to: '/dashboard',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/transactions',
      label: 'History',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  // Admin nav item (conditionally included)
  const adminNavItem = user.role === 'admin' ? {
    to: '/admin',
    label: 'Admin',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  } : null

  const allNavItems = adminNavItem ? [...navItems, adminNavItem] : navItems

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-canvas text-text-primary overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════════
          DESKTOP / TABLET TOP HEADER NAV (hidden on mobile < md)
          ═══════════════════════════════════════════════════════════ */}
      <header className="hidden md:block sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-slate-100 shadow-sm select-none">
        <div className="max-w-5xl mx-auto w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="192" height="192">
                  <defs>
                    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#1E40AF" />
                      <stop offset="100%" stop-color="#1E3A8A" />
                    </linearGradient>
                    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#38BDF8" />
                      <stop offset="100%" stop-color="#0284C7" />
                    </linearGradient>
                  </defs>

                  <rect width="512" height="512" rx="115" fill="url(#bgGrad)" />

                  <path d="M 360 160 A 130 130 0 1 0 360 352" fill="none" stroke="#FFFFFF" stroke-width="52" stroke-linecap="round" />

                  <path d="M 285 130 L 210 270 L 295 270 L 240 400 L 390 230 L 310 230 Z" fill="url(#boltGrad)" />
                </svg>

              </div>
              <span className="text-xl font-black tracking-tight text-text-primary">
                CEK<span className="text-brand">Pay</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="flex items-center gap-1">
              {allNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                      ? 'bg-blue-50 text-brand'
                      : 'text-text-muted hover:text-text-primary hover:bg-slate-50'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User Avatar / Greeting */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-medium text-text-muted hidden lg:inline">
                {user.firstName}
              </span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>      {/* Main Content Area */}
      {/* pb-24 on mobile for bottom nav clearance, pb-8 on desktop where there's no bottom bar */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR (hidden on md+ screens)
          ═══════════════════════════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-slate-100 shadow-lg pb-safe select-none md:hidden"
      >
        <div className="flex justify-around items-center h-16 px-2">
          {allNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold transition-colors ${isActive ? 'text-brand' : 'text-text-muted hover:text-text-primary'
                }`
              }
            >
              <span className="mb-1">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Global Modals */}
      <SmartContactsManager />
    </div>
  )
}

