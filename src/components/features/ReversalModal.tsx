import React from 'react'
import { Modal } from '../ui/Modal'
import { useUIStore } from '../../stores/uiStore'
import { formatNaira } from '../../utils/formatCurrency'

export const ReversalModal: React.FC = () => {
  const { isModalOpen, closeModal, reversalAmount } = useUIStore()

  return (
    <Modal 
      isOpen={isModalOpen('reversal')} 
      onClose={() => closeModal('reversal')} 
      showCloseButton={false}
    >
      <div className="flex flex-col items-center justify-center py-4 text-center">
        {/* Red icon */}
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-error tracking-tight mb-2">
          Transaction Failed
        </h3>
        
        <p className="text-sm text-text-muted leading-relaxed max-w-xs mx-auto mb-8">
          Your <span className="font-bold text-text-primary">{formatNaira(reversalAmount)}</span> has been instantly reversed to your wallet.
        </p>

        <div className="w-full">
          <button 
            onClick={() => closeModal('reversal')} 
            className="w-full bg-error text-white font-semibold rounded-xl py-3.5 hover:bg-red-700 active:scale-95 transition-all shadow-sm"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  )
}
