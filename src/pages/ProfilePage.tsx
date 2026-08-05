import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useWalletStore } from '../stores/walletStore'
import { useUIStore } from '../stores/uiStore'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { updateUserEmail as mockUpdateUserEmail } from '../services'

export const ProfilePage: React.FC = () => {
  const { user, logout, toggleAdminRole, updateUser } = useAuthStore()
  const { wallet } = useWalletStore()
  const { showToast } = useUIStore()

  const [isCopied, setIsCopied] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editEmail, setEditEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!user || !wallet) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-b-3xl -mt-6 -mx-6" />
        <div className="h-24 bg-slate-200 rounded-2xl" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-200 rounded-2xl" />
          <div className="h-16 bg-slate-200 rounded-2xl" />
          <div className="h-16 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(wallet.accountNumber || '')
    setIsCopied(true)
    showToast('Account number copied!', 'info')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CEKPay - VTU Speedboat',
          text: 'Get instant Airtime, Data, and Pay Bills easily on CEKPay! 🚀',
          url: window.location.origin,
        })
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}`)
      showToast('App link copied to clipboard!', 'info')
    }
  }

  const handleLogout = () => {
    // In a real app we might want a confirmation modal
    logout()
  }

  const openEditModal = () => {
    setEditEmail(user.email || '')
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!editEmail.trim()) {
      showToast('Email cannot be empty', 'error')
      return
    }

    setIsSaving(true)
    try {
      const updatedUser = await mockUpdateUserEmail(user.id, editEmail)
      updateUser({ email: updatedUser.email })
      showToast('Profile updated successfully', 'success')
      setIsEditModalOpen(false)
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="bg-brand text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Profile</h1>
        
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/30">
            {user.firstName.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="opacity-90">{user.phone}</p>
            <p className="opacity-75 text-sm">{user.email}</p>
          </div>
          <button
            onClick={openEditModal}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            title="Edit Profile"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Wallet / Bank Info */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-text-muted mb-4 uppercase tracking-wider">
            Funding Details
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">{wallet.bankName}</p>
              <p className="text-lg font-bold text-text-primary tracking-wide">
                {wallet.accountNumber}
              </p>
              <p className="text-xs text-text-muted mt-1">Dedicated Virtual Account</p>
            </div>
            <button
              onClick={handleCopyAccount}
              className="p-3 bg-slate-50 text-brand rounded-xl hover:bg-brand hover:text-white transition-colors"
              title="Copy Account Number"
            >
              {isCopied ? (
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-3">
          <button 
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-transform"
            onClick={() => useUIStore.getState().openModal('smart-contacts-manager')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                👥
              </div>
              <span className="font-semibold text-text-primary">Manage Smart Contacts</span>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-transform"
            onClick={() => showToast('Change PIN coming soon in Phase 9.x', 'info')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 text-brand rounded-full flex items-center justify-center">
                🔐
              </div>
              <span className="font-semibold text-text-primary">Change PIN</span>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-transform"
            onClick={handleShareApp}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-50 text-success rounded-full flex items-center justify-center">
                🚀
              </div>
              <span className="font-semibold text-text-primary">Share CEKPay</span>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-2xl shadow-md border border-red-700 flex items-center justify-between active:scale-95 transition-transform font-bold"
            onClick={handleLogout}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-700/50 text-white rounded-full flex items-center justify-center text-lg">
                🚪
              </div>
              <span className="font-bold text-white text-base">Log Out</span>
            </div>
            <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5" />
            </svg>
          </button>
        </section>

        {/* App Info & Dev Tools */}
        <section className="pt-6 border-t border-slate-200">
          <div className="flex flex-col items-center justify-center text-sm text-text-muted mb-6">
            <p className="font-bold text-text-primary">CEKPay App</p>
            <p>Version 1.0.0 (Phase 9)</p>
          </div>

          {/* Dev-only Admin Toggle (hidden in production) */}
          {import.meta.env.DEV && (
            <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 shadow-sm text-sm">
              <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                <span className="font-bold text-white uppercase text-xs tracking-wider">Dev Menu</span>
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium">Enable Admin Panel (Mock)</span>
                <input
                  type="checkbox"
                  checked={user.role === 'admin'}
                  onChange={toggleAdminRole}
                  className="w-5 h-5 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
                />
              </label>
              <p className="text-xs mt-2 text-slate-400">
                Toggling this switch modifies your local role to allow access to the Admin Panel routes.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSaving && setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex space-x-3">
            <svg className="w-5 h-5 text-brand shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-brand font-medium">
              To update your name or registered phone number, please contact administrative support for strict security verification.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">First Name</label>
              <input
                type="text"
                value={user.firstName}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Last Name</label>
              <input
                type="text"
                value={user.lastName}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                value={user.phone}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSaving || editEmail === user.email}
            className="w-full bg-brand text-white font-bold rounded-xl py-3.5 flex items-center justify-center space-x-2 transition-colors hover:bg-blue-800 disabled:bg-blue-300 mt-6"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}
