import React from 'react'
import { Modal } from '../ui/Modal'
import { useUIStore } from '../../stores/uiStore'
import { formatNaira } from '../../utils/formatCurrency'

export const ReceiptModal: React.FC = () => {
  const { isModalOpen, closeModal, receiptTransaction, showToast } = useUIStore()

  if (!receiptTransaction) return null

  const handleShare = async () => {
    const text = `✅ CEKPay Transaction Successful!\n\nService: ${receiptTransaction.service}\nAmount: ${formatNaira(receiptTransaction.amount)}\nRecipient: ${receiptTransaction.recipient || receiptTransaction.provider || 'N/A'}\nRef: ${receiptTransaction.reference}\nDate: ${new Date(receiptTransaction.createdAt).toLocaleString()}\n\nDownload CEKPay for instant VTU at cekpay.vercel.app`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CEKPay Receipt',
          text
        })
      } catch (err) {
        // User probably cancelled share
      }
    } else {
      navigator.clipboard.writeText(text)
      showToast('Receipt copied to clipboard!', 'success')
    }
  }

  return (
    <Modal
      isOpen={isModalOpen('receipt')}
      onClose={() => closeModal('receipt')}
      title="Transaction Receipt"
    >
      <div className="space-y-6 animate-in fade-in zoom-in duration-300">
        {/* Receipt Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative overflow-hidden">
          {/* Logo / Header */}
          <div className="text-center space-y-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-16 h-16 mx-auto drop-shadow-sm">
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

            <h2 className="text-success font-bold text-lg">Transaction Successful</h2>
            <p className="text-3xl font-black text-text-primary">
              {formatNaira(receiptTransaction.amount)}
            </p>
          </div>

          <div className="border-t-2 border-dashed border-slate-200 my-4" />

          {/* Details */}
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Service</span>
              <span className="font-semibold text-text-primary text-right">{receiptTransaction.service}</span>
            </div>

            {(receiptTransaction.recipient || receiptTransaction.provider) && (
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Recipient / Provider</span>
                <span className="font-semibold text-text-primary text-right">
                  {receiptTransaction.recipient || receiptTransaction.provider}
                </span>
              </div>
            )}

            {receiptTransaction.planName && (
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Plan</span>
                <span className="font-semibold text-text-primary text-right">{receiptTransaction.planName}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-text-muted">Reference</span>
              <span className="font-mono text-xs font-semibold text-text-primary text-right break-all ml-4">
                {receiptTransaction.reference}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-muted">Date</span>
              <span className="font-semibold text-text-primary text-right">
                {new Date(receiptTransaction.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-text-muted">Status</span>
              <span className="bg-success/10 text-success font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                {receiptTransaction.status}
              </span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-slate-200 my-4" />

          <div className="text-center text-xs font-medium text-text-muted">
            Thank you for using CEKPay!
          </div>

          {/* Decorative receipt cuts */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-slate-50" />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full bg-brand text-white font-bold rounded-xl py-4 flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform"
          >
            <span>Share Receipt</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            onClick={() => closeModal('receipt')}
            className="w-full bg-slate-100 text-text-secondary font-bold rounded-xl py-4 active:scale-95 transition-transform"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </Modal>
  )
}
