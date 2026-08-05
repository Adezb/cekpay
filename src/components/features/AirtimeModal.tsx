import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { PinInput } from '../ui/PinInput'
import { useUIStore } from '../../stores/uiStore'
import { useTransaction } from '../../hooks/useTransaction'
import { buyAirtime as mockBuyAirtime } from '../../services'
import { detectNetwork } from '../../utils/networkDetect'
import type { AirtimeRequest } from '../../types'
import { formatNaira } from '../../utils/formatCurrency'

const AMOUNTS = [100, 200, 500, 1000]

export const AirtimeModal: React.FC = () => {
  const { isModalOpen, closeModal, showToast } = useUIStore()
  const { execute, isProcessing } = useTransaction<AirtimeRequest>()

  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')

  const network = detectNetwork(phone)
  const numAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isModalOpen('airtime')) {
      const { activeSmartContact, setActiveSmartContact } = useUIStore.getState()
      setStep(1)
      if (activeSmartContact) {
        setPhone(activeSmartContact.identifier)
        // Optionally consume it so it doesn't prefill next time
        setActiveSmartContact(null)
      } else {
        setPhone('')
      }
      setAmount('')
      setPin('')
    } else {
      // Clean up after closing
      setTimeout(() => {
        setStep(1)
        setPhone('')
        setAmount('')
        setPin('')
      }, 300)
    }
  }, [isModalOpen('airtime')])

  const handleNext = () => {
    if (phone.length < 11) {
      showToast('Please enter a valid phone number', 'error')
      return
    }
    if (numAmount < 50) {
      showToast('Minimum amount is ₦50', 'error')
      return
    }
    setStep(2)
  }

  const handleConfirm = async () => {
    if (pin.length !== 4) {
      showToast('Please enter your 4-digit PIN', 'error')
      return
    }

    const payload: AirtimeRequest = {
      phone,
      network: network === 'Unknown' ? 'MTN' : network, // fallback to MTN if unknown
      amount: numAmount,
    }

    const result = await execute(pin, numAmount, mockBuyAirtime, payload)
    
    if (result) {
      showToast('Airtime purchase successful!', 'success')
      closeModal('airtime')
    }
  }

  return (
    <Modal
      isOpen={isModalOpen('airtime')}
      onClose={() => !isProcessing && closeModal('airtime')}
      title="Buy Airtime"
    >
      <div className="space-y-4">
        {step === 1 ? (
          // ─── STEP 1: INPUT ───
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="0803 000 0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3.5 text-base sm:text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow"
                />
                {/* Network Badge */}
                {phone.length >= 4 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide
                      ${network === 'MTN' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${network === 'Airtel' ? 'bg-red-100 text-red-800' : ''}
                      ${network === 'Glo' ? 'bg-green-100 text-green-800' : ''}
                      ${network === '9mobile' ? 'bg-emerald-100 text-emerald-800' : ''}
                      ${network === 'Unknown' ? 'bg-slate-200 text-slate-600' : ''}
                    `}>
                      {network}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-text-primary">
                Amount
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={amount ? `₦${numAmount.toLocaleString()}` : ''}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₦0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3.5 text-base sm:text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow"
              />
              
              {/* Quick Select Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold border transition-colors
                      ${numAmount === amt 
                        ? 'bg-brand text-white border-brand' 
                        : 'bg-white text-text-secondary border-slate-200 hover:border-brand/50 hover:bg-slate-50'
                      }
                    `}
                  >
                    ₦{amt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={phone.length < 10 || numAmount < 50}
              className="w-full bg-brand text-white font-bold rounded-xl py-3 sm:py-4 mt-3 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              Continue
            </button>
          </div>
        ) : (
          // ─── STEP 2: CONFIRMATION ───
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium">Service</span>
                <span className="font-bold text-text-primary text-right">Airtime Top-up</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium">Phone Number</span>
                <span className="font-bold text-text-primary text-right">{phone}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium">Network</span>
                <span className="font-bold text-text-primary text-right">{network === 'Unknown' ? 'MTN' : network}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-text-muted font-medium">Amount to Pay</span>
                <span className="text-xl font-black text-brand text-right">
                  {formatNaira(numAmount)}
                </span>
              </div>
            </div>

            {/* PIN Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-text-primary text-center">
                Enter 4-Digit PIN
              </label>
              <PinInput
                value={pin}
                onChange={setPin}
                disabled={isProcessing}
                autoFocus={false}
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setStep(1)}
                disabled={isProcessing}
                className="w-1/3 bg-slate-100 text-text-secondary font-bold rounded-xl py-3 sm:py-4 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={pin.length !== 4 || isProcessing}
                className="w-2/3 bg-brand text-white font-bold rounded-xl py-3 sm:py-4 flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:active:scale-100"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Pay {formatNaira(numAmount)}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
