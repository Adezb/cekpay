import React, { useState } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const { user, isAdmin } = useAuthStore()

  const pathnames = location.pathname.split('/').filter((x) => x)
  const breadcrumbs = pathnames.map((value, index) => {
    const to = `/${pathnames.slice(0, index + 1).join('/')}`
    const isLast = index === pathnames.length - 1
    const label = value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')

    return {
      to,
      label,
      isLast,
    }
  })

  // Defensive admin guard check
  if (!isAdmin || !user) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 select-none">
        <div className="max-w-md w-full bg-surface shadow-md rounded-2xl p-6 text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-100 text-error rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m0-6v2m0-8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Access Denied</h2>
          <p className="text-sm text-text-muted mb-6">
            You do not have administrative privileges to view this area.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center w-full bg-brand text-white rounded-xl py-3 font-semibold hover:bg-blue-800 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const menuItems = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      to: '/admin/users',
      label: 'Users',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      to: '/admin/pricing',
      label: 'Products & Pricing',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/admin/announcements',
      label: 'Announcements',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      to: '/admin/promos',
      label: 'Promos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    },
    {
      to: '/admin/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-slate-200">
      {/* Header / Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 select-none shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-text-primary">
            CEK<span className="text-brand">Pay</span> <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand border border-blue-100 ml-1">Admin</span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive
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

      {/* Back to Consumer Dashboard Link */}
      <div className="p-4 border-t border-slate-100">
        <Link
          to="/dashboard"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-text-primary rounded-xl py-2.5 text-xs font-bold transition-colors"
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
          </svg>
          Consumer Dashboard
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Slide-out Drawer */}
      <div
        className={`fixed inset-0 z-50 flex lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? '' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer content panel */}
        <div
          className={`relative flex flex-col w-full max-w-xs h-full bg-surface shadow-2xl transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="absolute top-4 right-4 z-10">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-full flex-1">
            {sidebarContent}
          </div>
        </div>
      </div>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header Bar */}
        <header className="h-16 bg-surface border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 select-none shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 hover:bg-slate-50 text-text-muted hover:text-text-primary rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
              aria-label="Open sidebar menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="flex text-sm text-text-muted font-semibold items-center gap-1.5">
              <span>Admin</span>
              {breadcrumbs.map((breadcrumb, idx) => (
                <React.Fragment key={breadcrumb.to}>
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  {!breadcrumb.isLast && idx > 0 ? (
                    <Link to={breadcrumb.to} className="hover:text-text-primary transition-colors">
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <span className={breadcrumb.isLast ? 'text-text-primary font-bold' : ''}>
                      {breadcrumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-text-muted hidden sm:inline">
              Welcome, {user?.firstName}
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-brand font-bold flex items-center justify-center">
              {user?.firstName?.charAt(0) || 'A'}
            </div>
          </div>
        </header>
        {/* Administrator Mode Warning Banner */}
        {import.meta.env.VITE_USE_MOCK !== 'true' && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 sm:px-6 lg:px-8 text-amber-700 text-xs font-semibold flex items-center justify-between gap-2 select-none">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-base">⚠️</span>
              <span>
                <strong>Production Guardrail Active:</strong> Live Administrator mutation endpoints are protected. Unverified manual wallet debit/credit and pricing overrides are disabled in production API mode.
              </span>
            </div>
            <span className="bg-amber-200 text-amber-900 text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0">
              Live Mode Active
            </span>
          </div>
        )}

        {/* Admin Pages Workspace */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
