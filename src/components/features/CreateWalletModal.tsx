import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useWalletStore } from '../../stores/walletStore'
import { resolveBankAccount as mockResolveBankAccount, createDVA as mockCreateDVA } from '../../services'

const TOP_BANKS = [
  'Access Bank',
  'GTBank',
  'Zenith Bank',
  'First Bank',
  'UBA',
  'OPay',
  'Moniepoint',
  'PalmPay',
  'Kuda'
]

export const CreateWalletModal: React.FC = () => {
  const { isModalOpen, closeModal, showToast } = useUIStore()
  const { user } = useAuthStore()
  const { fetchWallet } = useWalletStore()
  
  const isOpen = isModalOpen('create-wallet')
  const handleClose = () => closeModal('create-wallet')

  const [step, setStep] = useState<1 | 2>(1)
  
  // Step 1 State
  const [bankName, setBankName] = useState(TOP_BANKS[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [resolvedName, setResolvedName] = useState('')

  // Step 2 State
  const [bvn, setBvn] = useState('')
  const [hasConsented, setHasConsented] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleResolveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (accountNumber.length !== 10) {
      showToast('Account number must be 10 digits', 'error')
      return
    }
    
    setIsResolving(true)
    try {
      const res = await mockResolveBankAccount(bankName, accountNumber)
      setResolvedName(res.accountName)
      setStep(2)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to resolve account', 'error')
    } finally {
      setIsResolving(false)
    }
  }

  const handleCreateDVA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (bvn.length !== 11) {
      showToast('BVN must be 11 digits', 'error')
      return
    }
    if (!hasConsented) {
      showToast('You must consent to DVA creation', 'error')
      return
    }

    setIsCreating(true)
    try {
      await mockCreateDVA(user.id, bvn, bankName, accountNumber)
      await fetchWallet()
      showToast('Wallet created successfully!', 'success')
      handleClose()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create wallet', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setAccountNumber('')
      setBvn('')
      setHasConsented(false)
      setResolvedName('')
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Wallet">
      {step === 1 ? (
        <form onSubmit={handleResolveAccount} className="space-y-4">
          <p className="text-sm text-slate-600">
            Step 1: Link your local bank account for withdrawals.
          </p>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Select Bank</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              disabled={isResolving}
            >
              {TOP_BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <Input
            label="Account Number"
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            disabled={isResolving}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            required
          />

          <Button type="submit" className="w-full mt-2" isLoading={isResolving} disabled={accountNumber.length !== 10}>
            Next
          </Button>
        </form>
      ) : (
        <form onSubmit={handleCreateDVA} className="space-y-4">
          <p className="text-sm text-slate-600">
            Step 2: Verify your identity to generate your Dedicated Virtual Account.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-semibold text-slate-900">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-slate-900">{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Linked Bank:</span>
              <span className="font-semibold text-slate-900 text-right">
                {bankName}<br/>
                {accountNumber}<br/>
                <span className="text-xs text-brand font-medium">{resolvedName}</span>
              </span>
            </div>
          </div>

          <Input
            label="Bank Verification Number (BVN)"
            placeholder="Enter 11-digit BVN"
            value={bvn}
            onChange={(e) => setBvn(e.target.value)}
            disabled={isCreating}
            type="tel"
            inputMode="numeric"
            maxLength={11}
            required
          />

          <div className="flex items-start space-x-3 pt-2">
            <input
              type="checkbox"
              id="dva-consent"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
              disabled={isCreating}
              className="mt-1 w-4 h-4 text-brand bg-slate-100 border-slate-300 rounded focus:ring-brand focus:ring-2"
            />
            <label htmlFor="dva-consent" className="text-xs text-slate-600 leading-snug">
              I consent to the collection and processing of my BVN for identity verification and DVA creation.
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full mt-2" 
            isLoading={isCreating} 
            disabled={bvn.length !== 11 || !hasConsented}
          >
            Create Wallet
          </Button>
          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={isCreating}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700 pt-2"
          >
            Back
          </button>
        </form>
      )}
    </Modal>
  )
}
