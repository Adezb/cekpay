import React, { useState, useCallback } from 'react'
import { useWalletStore } from '../../stores/walletStore'
import { useUIStore } from '../../stores/uiStore'
import { formatNaira } from '../../utils/formatCurrency'

export const WalletCard: React.FC = () => {
  const { wallet } = useWalletStore()
  const { showToast, openModal } = useUIStore()
  const [isBalanceHidden, setIsBalanceHidden] = useState(true)
  const [isFundExpanded, setIsFundExpanded] = useState(false)

  const handleCopy = useCallback(() => {
    if (wallet?.accountNumber) {
      navigator.clipboard.writeText(wallet.accountNumber).then(() => {
        showToast('Copied!', 'success')
      }).catch(() => {
        showToast('Failed to copy', 'error')
      })
    }
  }, [wallet?.accountNumber, showToast])

  const toggleBalance = () => setIsBalanceHidden(!isBalanceHidden)

  const hasDva = !!wallet?.accountNumber

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-brand to-blue-700 text-white rounded-2xl p-5 sm:p-6 shadow-md">
      {/* Subtle glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none" />
      
      <div className="relative z-10 flex flex-col space-y-4">
        {/* Balance Section */}
        <div>
          <p className="text-sm opacity-80 font-medium">Wallet Balance</p>
          <div className="flex items-center space-x-3 mt-1">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isBalanceHidden ? '****' : (wallet ? formatNaira(wallet.balance) : '₦0.00')}
            </h3>
            <button
              onClick={toggleBalance}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label={isBalanceHidden ? "Reveal balance" : "Hide balance"}
              title={isBalanceHidden ? "Reveal balance" : "Hide balance"}
            >
              {isBalanceHidden ? (
                // Eye Icon (Closed/Hidden is default but let's show an eye to reveal)
                <svg className="w-5 h-5 text-white opacity-80 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                // Eye Slash Icon (Open but slash to hide)
                <svg className="w-5 h-5 text-white opacity-80 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Account Details (Hidden by default, shown via toggle) */}
        <div className="flex flex-col space-y-1 min-h-[10px]">
          {/* We keep this wrapper for spacing, but move the details into the expanded container below */}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={() => hasDva ? setIsFundExpanded(true) : openModal('create-wallet')}
            className="flex-1 bg-white text-brand font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            {hasDva ? 'Fund Wallet' : 'Create Wallet'}
          </button>
          <button
            onClick={() => openModal('withdraw')}
            className="flex-1 bg-white/20 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:bg-white/30 transition-colors"
          >
            Withdraw
          </button>
        </div>

        {/* Expanded Fund Section */}
        {isFundExpanded && hasDva && (
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 relative animate-in slide-in-from-top-2">
            <button
              onClick={() => setIsFundExpanded(false)}
              className="absolute top-2 right-2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close funding details"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-xs opacity-90 uppercase tracking-wider font-bold mb-2">
              Virtual Account
            </p>
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">{wallet?.bankName}</p>
                <p className="text-lg font-bold font-mono tracking-wide mt-0.5">{wallet?.accountNumber}</p>
                {wallet?.accountName && (
                  <p className="text-xs opacity-80 mt-0.5 font-medium">{wallet.accountName}</p>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="p-2 bg-white text-brand rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                title="Copy account number"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
