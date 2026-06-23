import React, { useCallback } from 'react'
import { useWalletStore } from '../../stores/walletStore'
import { useUIStore } from '../../stores/uiStore'
import { formatNaira } from '../../utils/formatCurrency'

export const WalletCard: React.FC = () => {
  const { wallet } = useWalletStore()
  const { showToast } = useUIStore()

  const handleCopy = useCallback(() => {
    if (wallet?.accountNumber) {
      navigator.clipboard.writeText(wallet.accountNumber).then(() => {
        showToast('Copied!', 'success')
      }).catch(() => {
        showToast('Failed to copy', 'error')
      })
    }
  }, [wallet?.accountNumber, showToast])

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-brand to-blue-700 text-white rounded-2xl p-5 sm:p-6 shadow-md">
      {/* Subtle glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none" />
      
      <div className="relative z-10 flex flex-col space-y-4">
        <div>
          <p className="text-sm opacity-80 font-medium">Wallet Balance</p>
          <h3 className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight">
            {wallet ? formatNaira(wallet.balance) : '₦0.00'}
          </h3>
        </div>

        <div className="flex flex-col space-y-1">
          <p className="text-xs opacity-80 uppercase tracking-wider font-semibold">
            Virtual Account
          </p>
          <div className="flex items-center space-x-2 min-w-0">
            <p className="text-sm font-medium truncate min-w-0">
              {wallet ? `${wallet.bankName} - ${wallet.accountNumber}` : 'Loading Virtual Account...'}
            </p>
            {wallet && (
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Copy account number"
                title="Copy account number"
              >
                <svg 
                  className="w-4 h-4 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
