import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { PinInput } from '../ui/PinInput'
import { useUIStore } from '../../stores/uiStore'
import { useTransaction } from '../../hooks/useTransaction'
import { mockPayElectricity } from '../../services/mock/mockServices'
import type { ElectricityRequest } from '../../types'
import { formatNaira } from '../../utils/formatCurrency'

const DISCOS = ['IKEDC', 'EKEDC', 'IBEDC', 'AEDC', 'KEDCO', 'PHED']

export const ElectricityModal: React.FC = () => {
  const { isModalOpen, closeModal, showToast } = useUIStore()
  const { execute, isProcessing } = useTransaction<ElectricityRequest>()

  const [step, setStep] = useState<1 | 2>(1)
  const [disco, setDisco] = useState(DISCOS[0])
  const [meterNumber, setMeterNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')

  const numAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isModalOpen('electricity')) {
      const { activeSmartContact, setActiveSmartContact } = useUIStore.getState()
      setStep(1)
      if (activeSmartContact) {
        setMeterNumber(activeSmartContact.identifier)
        setDisco(activeSmartContact.providerType)
        setActiveSmartContact(null)
      } else {
        setMeterNumber('')
        setDisco(DISCOS[0])
      }
      setAmount('')
      setPin('')
    } else {
      setTimeout(() => {
        setStep(1)
        setMeterNumber('')
        setAmount('')
        setDisco(DISCOS[0])
        setPin('')
      }, 300)
    }
  }, [isModalOpen('electricity')])

  const handleNext = () => {
    if (meterNumber.length < 10) {
      showToast('Please enter a valid meter number', 'error')
      return
    }
    if (numAmount < 500) {
      showToast('Minimum amount is ₦500', 'error')
      return
    }
    setStep(2)
  }

  const handleConfirm = async () => {
    if (pin.length !== 4) {
      showToast('Please enter your 4-digit PIN', 'error')
      return
    }

    const payload: ElectricityRequest = {
      disco,
      meterNumber,
      amount: numAmount,
    }

    const result = await execute(pin, numAmount, mockPayElectricity, payload)
    
    if (result) {
      showToast('Electricity payment successful!', 'success')
      closeModal('electricity')
    }
  }

  return (
    <Modal
      isOpen={isModalOpen('electricity')}
      onClose={() => !isProcessing && closeModal('electricity')}
      title="Pay Electricity"
    >
      <div className="space-y-4">
        {step === 1 ? (
          // ─── STEP 1: INPUT ───
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            
            {/* Disco Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                Select Provider
              </label>
              <select
                value={disco}
                onChange={(e) => setDisco(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3.5 text-base sm:text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow appearance-none"
              >
                {DISCOS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Meter Number */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                Meter Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={14}
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-14 digit meter no."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3.5 text-base sm:text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
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
            </div>

            <button
              onClick={handleNext}
              disabled={meterNumber.length < 10 || numAmount < 500}
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
                <span className="font-bold text-text-primary text-right">Electricity Token</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium">Provider</span>
                <span className="font-bold text-text-primary text-right">{disco}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium">Meter Number</span>
                <span className="font-bold text-text-primary text-right">{meterNumber}</span>
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
