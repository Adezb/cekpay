/**
 * CEKPay Dashboard Page — Phase 6.1
 *
 * The main user dashboard acting as the central hub of CEKPay.
 * Responsibilities:
 *   1. Fetches wallet, contacts, and announcements on mount via mock services and stores.
 *   2. Displays a premium skeleton loading state while fetching.
 *   3. Composes the main features: WalletCard, QuickActionGrid, SmartContacts,
 *      AnnouncementBanner, OfflineBanner, and SupportFAB.
 *   4. Provides error boundary/retry capability.
 *
 * @see Phase 6.1 in implementation_plan.md
 */

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useWalletStore } from '../stores/walletStore'
import { useSmartContactsStore } from '../stores/smartContactsStore'
import { getDashboard as mockGetDashboard } from '../services'
import type { Announcement } from '../types'

// Composed dashboard components (stubbed for compile-safety, fully implemented in 6.2+)
import { AnnouncementBanner } from '../components/features/AnnouncementBanner'
import { OfflineBanner } from '../components/features/OfflineBanner'
import { WalletCard } from '../components/features/WalletCard'
import { QuickActionGrid } from '../components/features/QuickActionGrid'
import { SmartContacts } from '../components/features/SmartContacts'
import { SupportFAB } from '../components/features/SupportFAB'
import { ReversalModal } from '../components/features/ReversalModal'
import { AirtimeModal } from '../components/features/AirtimeModal'
import { DataModal } from '../components/features/DataModal'
import { ElectricityModal } from '../components/features/ElectricityModal'
import { CableModal } from '../components/features/CableModal'
import { ReceiptModal } from '../components/features/ReceiptModal'
import { CreateWalletModal } from '../components/features/CreateWalletModal'
import { WithdrawModal } from '../components/features/WithdrawModal'

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const fetchWallet = useWalletStore((state) => state.fetchWallet)
  const fetchContacts = useSmartContactsStore((state) => state.fetchContacts)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      // Load both stores and fetch announcements/dashboard specific mock details
      const [_, __, dashboardData] = await Promise.all([
        fetchWallet(),
        fetchContacts(),
        mockGetDashboard(user.id),
      ])
      setAnnouncements(dashboardData.announcements)
    } catch (err) {
      console.error('[Dashboard] Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [user])

  // ─── Loading / Skeleton Screen ─────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-1">
        {/* Announcement Banner Skeleton */}
        <div className="h-10 bg-slate-200 rounded-xl w-full" />

        {/* Welcome Text Skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded-md w-40" />
          <div className="h-4 bg-slate-200 rounded-md w-64" />
        </div>

        {/* Wallet Card Skeleton */}
        <div className="h-40 bg-slate-200 rounded-2xl w-full" />

        {/* Quick Action Grid Skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-slate-200 rounded-md w-32" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 bg-slate-200 rounded-2xl w-full" />
            <div className="h-28 bg-slate-200 rounded-2xl w-full" />
            <div className="h-28 bg-slate-200 rounded-2xl w-full" />
            <div className="h-28 bg-slate-200 rounded-2xl w-full" />
          </div>
        </div>

        {/* Smart Contacts Strip Skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-slate-200 rounded-md w-36" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-2 min-w-[64px]">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="h-3 bg-slate-200 rounded-md w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Error Screen ──────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
        <div className="text-4xl">⚠️</div>
        <h3 className="text-lg font-bold text-text-primary">Unable to Load Dashboard</h3>
        <p className="text-sm text-text-muted max-w-sm">{error}</p>
        <button
          onClick={loadDashboardData}
          className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow hover:bg-blue-800 active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    )
  }

  // ─── Main Content View ─────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 relative">
      {/* Announcement Banner */}
      <div className="max-h-14 overflow-hidden rounded-xl">
        <AnnouncementBanner announcements={announcements} />
      </div>

      {/* Offline Alert Strip */}
      <OfflineBanner />

      {/* Greeting Header */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
          Hello, {user?.firstName || 'User'} 👋
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Welcome to CEKPay — The Speedboat of VTU and Utility Bills Payment.
        </p>
      </div>

      {/* Wallet Card */}
      <WalletCard />

      {/* Quick Action Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-text-primary tracking-tight">
          Quick Services
        </h3>
        <QuickActionGrid />
      </div>

      {/* Smart Contacts Strip */}
      <SmartContacts />

      {/* WhatsApp Support FAB */}
      <SupportFAB />

      {/* Reversal Modal */}
      <ReversalModal />
      <AirtimeModal />
      <DataModal />
      <ElectricityModal />
      <CableModal />
      <ReceiptModal />
      <CreateWalletModal />
      <WithdrawModal />
    </div>
  )
}
