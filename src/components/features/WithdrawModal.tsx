import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PinInput } from '../ui/PinInput'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useWalletStore } from '../../stores/walletStore'
import { processWithdrawal as mockProcessWithdrawal } from '../../services'

export const WithdrawModal: React.FC = () => {
  const { isModalOpen, closeModal, showToast } = useUIStore()
  const { user } = useAuthStore()
  const { wallet, fetchWallet } = useWalletStore()
  
  const isOpen = isModalOpen('withdraw')
  const handleClose = () => closeModal('withdraw')

  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!wallet?.localWithdrawalBank || !wallet?.localWithdrawalAccount) {
      showToast('You must create a wallet first.', 'error')
      return
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Invalid amount', 'error')
      return
    }

    if (pin.length !== 4) {
      showToast('PIN must be 4 digits', 'error')
      return
    }

    setIsProcessing(true)
    try {
      await mockProcessWithdrawal(user.id, numAmount, pin)
      await fetchWallet()
      showToast('Withdrawal successful!', 'success')
      handleClose()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Withdrawal failed', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  React.useEffect(() => {
    if (!isOpen) {
      setAmount('')
      setPin('')
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Withdraw Funds">
      <form onSubmit={handleWithdraw} className="space-y-4">
        {wallet?.localWithdrawalBank ? (
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
            <p className="text-sm text-slate-500">Withdrawing to linked account:</p>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-slate-900">{wallet.localWithdrawalBank}</span>
              <span className="font-semibold text-slate-900">{wallet.localWithdrawalAccount}</span>
            </div>
          </div>
        ) : (
           <p className="text-sm text-red-500">No linked bank account found.</p>
        )}

        <Input
          label="Amount (₦)"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isProcessing}
          type="tel"
          inputMode="numeric"
          required
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Enter 4-Digit PIN</label>
          <PinInput
            value={pin}
            onChange={setPin}
            disabled={isProcessing}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full mt-2" 
          isLoading={isProcessing} 
          disabled={!wallet?.localWithdrawalBank || amount === '' || pin.length !== 4}
        >
          Confirm Withdrawal
        </Button>
      </form>
    </Modal>
  )
}
