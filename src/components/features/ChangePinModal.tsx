import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { changePin } from '../../services'

export const ChangePinModal: React.FC = () => {
  const { isModalOpen, closeModal, showToast } = useUIStore()
  const { user } = useAuthStore()

  const isOpen = isModalOpen('change-pin')

  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleClose = () => {
    if (isSubmitting) return
    setOldPin('')
    setNewPin('')
    setConfirmPin('')
    setErrorMsg(null)
    closeModal('change-pin')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!user) {
      showToast('Authentication required.', 'error')
      return
    }

    if (!/^\d{4}$/.test(oldPin)) {
      setErrorMsg('Current PIN must be exactly 4 numeric digits.')
      return
    }

    if (!/^\d{4}$/.test(newPin)) {
      setErrorMsg('New PIN must be exactly 4 numeric digits.')
      return
    }

    if (oldPin === newPin) {
      setErrorMsg('New PIN must be different from your current PIN.')
      return
    }

    if (newPin !== confirmPin) {
      setErrorMsg('New PIN and Confirm PIN do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await changePin(user.id, oldPin, newPin)
      showToast('PIN changed successfully! 🔐', 'success')
      handleClose()
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Failed to change PIN.'
      setErrorMsg(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Security PIN"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex space-x-3">
          <span className="text-xl">🔐</span>
          <p className="text-xs text-brand font-medium leading-relaxed">
            Your 4-digit PIN is required to authorize all VTU transactions and withdrawals. Keep it strictly private.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
            {errorMsg}
          </div>
        )}

        <Input
          label="Current 4-Digit PIN"
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          value={oldPin}
          onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          required
        />

        <Input
          label="New 4-Digit PIN"
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          required
        />

        <Input
          label="Confirm New 4-Digit PIN"
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          required
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting || oldPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
          className="mt-6"
        >
          Update PIN
        </Button>
      </form>
    </Modal>
  )
}
