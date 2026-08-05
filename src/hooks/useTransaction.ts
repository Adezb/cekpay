import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useWalletStore } from '../stores/walletStore'
import { useTransactionStore } from '../stores/transactionStore'
import { useUIStore } from '../stores/uiStore'
import { verifyPin as mockVerifyPin } from '../services'
import type { Transaction } from '../types'

interface UseTransactionReturn<TArgs> {
  execute: (
    pin: string,
    amount: number,
    serviceCall: (args: TArgs) => Promise<Transaction>,
    args: TArgs
  ) => Promise<Transaction | null>
  isProcessing: boolean
  error: string | null
}

export function useTransaction<TArgs>(): UseTransactionReturn<TArgs> {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const user = useAuthStore((state) => state.user)
  const { wallet, debit, credit } = useWalletStore()
  const { addTransaction } = useTransactionStore()
  const { openModal, showToast, setReversalAmount, setReceiptTransaction } = useUIStore()

  const execute = async (
    pin: string,
    amount: number,
    serviceCall: (args: TArgs) => Promise<Transaction>,
    args: TArgs
  ): Promise<Transaction | null> => {
    if (!user || !wallet) {
      const msg = 'User or wallet not found.'
      setError(msg)
      showToast(msg, 'error')
      return null
    }

    if (wallet.balance < amount) {
      const msg = `Insufficient balance. You need ₦${amount.toLocaleString()} but have ₦${wallet.balance.toLocaleString()}.`
      setError(msg)
      showToast(msg, 'error')
      return null
    }

    setIsProcessing(true)
    setError(null)

    let pinValid = false
    try {
      // 1. Verify PIN
      pinValid = await mockVerifyPin(user.id, pin)
      if (!pinValid) {
        throw new Error('Incorrect PIN. Try again.')
      }

      // 2. Optimistically debit the local store so UI feels instant
      debit(amount)

      // 3. Execute the transaction mock service
      const txn = await serviceCall(args)

      // 4. On success, sync to transaction store
      addTransaction(txn)
      setReceiptTransaction(txn)
      openModal('receipt')
      setIsProcessing(false)
      
      return txn

    } catch (err: any) {
      const message = err.message || 'Transaction failed.'
      setError(message)
      
      if (!pinValid) {
        // If it failed at PIN stage, no need to revert balance
        showToast(message, 'error')
      } else {
        // If it failed during the actual transaction, revert optimistic debit
        credit(amount)
        
        // Open reversal modal for the "10% random failure" feature
        setReversalAmount(amount)
        openModal('reversal')
      }

      setIsProcessing(false)
      return null
    }
  }

  return { execute, isProcessing, error }
}
