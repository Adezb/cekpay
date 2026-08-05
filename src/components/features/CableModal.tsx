import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '../ui/Modal'
import { PinInput } from '../ui/PinInput'
import { useUIStore } from '../../stores/uiStore'
import { useTransaction } from '../../hooks/useTransaction'
import { payCable as mockPayCable, getProductPrices as mockGetProductPrices } from '../../services'
import type { CableRequest, ProductPrice } from '../../types'
import { formatNaira } from '../../utils/formatCurrency'

const PROVIDERS = ['DSTV', 'GOtv', 'Startimes']

export const CableModal: React.FC = () => {
  const { isModalOpen, closeModal, showToast } = useUIStore()
  const { execute, isProcessing } = useTransaction<CableRequest>()

  const [step, setStep] = useState<1 | 2>(1)
  const [provider, setProvider] = useState(PROVIDERS[0])
  const [iucNumber, setIucNumber] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [pin, setPin] = useState('')

  const [plans, setPlans] = useState<ProductPrice[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isModalOpen('cable-tv')) {
      const { activeSmartContact, setActiveSmartContact } = useUIStore.getState()
      setIsLoadingPlans(true)
      mockGetProductPrices('Cable')
        .then(setPlans)
        .catch(() => showToast('Failed to load cable plans', 'error'))
        .finally(() => setIsLoadingPlans(false))
      
      setStep(1)
      if (activeSmartContact) {
        setIucNumber(activeSmartContact.identifier)
        setProvider(activeSmartContact.providerType)
        setActiveSmartContact(null)
      } else {
        setIucNumber('')
        setProvider(PROVIDERS[0])
      }
      setSelectedPlanId('')
      setPin('')
    } else {
      setTimeout(() => {
        setStep(1)
        setProvider(PROVIDERS[0])
        setIucNumber('')
        setSelectedPlanId('')
        setPin('')
      }, 300)
    }
  }, [isModalOpen('cable-tv')])

  // Filter plans by selected provider
  const availablePlans = useMemo(() => {
    return plans.filter((p) => p.provider === provider)
  }, [plans, provider])

  // Clear selected plan if provider changes
  useEffect(() => {
    if (selectedPlanId) {
      const plan = availablePlans.find((p) => p.id === selectedPlanId)
      if (!plan) setSelectedPlanId('')
    }
  }, [availablePlans])

  const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId)

  const handleNext = () => {
    if (iucNumber.length < 10) {
      showToast('Please enter a valid IUC/Smartcard number', 'error')
      return
    }
    if (!selectedPlanId) {
      showToast('Please select a package', 'error')
      return
    }
    setStep(2)
  }

  const handleConfirm = async () => {
    if (pin.length !== 4) {
      showToast('Please enter your 4-digit PIN', 'error')
      return
    }
    if (!selectedPlan) return

    const payload: CableRequest = {
      provider,
      iucNumber,
      planId: selectedPlanId,
    }

    const result = await execute(pin, selectedPlan.retailPrice, mockPayCable, payload)
    
    if (result) {
      showToast('Cable TV payment successful!', 'success')
      closeModal('cable-tv')
    }
  }

  return (
    <Modal
      isOpen={isModalOpen('cable-tv')}
      onClose={() => !isProcessing && closeModal('cable-tv')}
      title="Cable TV"
    >
      <div className="space-y-4">
        {step === 1 ? (
          // ─── STEP 1: INPUT ───
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            
            {/* Provider Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                Select Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3.5 text-base sm:text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow appearance-none"
              >
                {PROVIDERS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* IUC Number */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                IUC / Smartcard Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={iucNumber}
                onChange={(e) => setIucNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-11 digit IUC"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 sm:py-3.5 text-base sm:text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow"
              />
            </div>

            {/* Plan Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-text-primary">
                Select Package
              </label>
              
              {isLoadingPlans ? (
                <div className="flex items-center justify-center p-6">
                  <svg className="w-6 h-6 animate-spin text-brand" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1 select-none">
                  {availablePlans.length === 0 ? (
                    <div className="text-center text-sm text-text-muted py-2">
                      No packages available for {provider}.
                    </div>
                  ) : (
                    availablePlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors
                          ${selectedPlanId === plan.id 
                            ? 'bg-blue-50 border-brand' 
                            : 'bg-white border-slate-200 hover:border-brand/50 hover:bg-slate-50'
                          }
                        `}
                      >
                        <span className="font-medium text-sm text-text-primary">{plan.planName}</span>
                        <span className="font-bold text-brand">{formatNaira(plan.retailPrice)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={iucNumber.length < 10 || !selectedPlanId}
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
                <span className="text-text-muted font-medium">Provider</span>
                <span className="font-bold text-text-primary text-right">{provider}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium">IUC Number</span>
                <span className="font-bold text-text-primary text-right">{iucNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium">Package</span>
                <span className="font-bold text-text-primary text-right">{selectedPlan?.planName}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-text-muted font-medium">Amount to Pay</span>
                <span className="text-xl font-black text-brand text-right">
                  {formatNaira(selectedPlan?.retailPrice || 0)}
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
                  <span>Pay {formatNaira(selectedPlan?.retailPrice || 0)}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
