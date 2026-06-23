import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PinInput } from '../../components/ui/PinInput'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'

export function CreatePinPage() {
  const navigate = useNavigate()
  const createPin = useAuthStore((state) => state.createPin)
  const showToast = useUIStore((state) => state.showToast)

  const [step, setStep] = useState<1 | 2>(1)
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleComplete1 = (val: string) => {
    setPin1(val)
    setStep(2)
    setError(undefined)
  }

  const handleComplete2 = async (val: string) => {
    if (val !== pin1) {
      setError("PINs don't match. Please try again.")
      setPin1('')
      setPin2('')
      setStep(1)
      return
    }

    setIsSubmitting(true)
    setError(undefined)

    try {
      await createPin(val)
      showToast('Your wallet is ready!', 'success')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create PIN'
      showToast(msg, 'error')
      setError(msg)
      
      // Reset flow on backend failure
      setPin1('')
      setPin2('')
      setStep(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 pt-4">
      {step === 1 ? (
        <PinInput
          title="Create your 4-digit Transaction PIN"
          description="This PIN will be used to authorize transactions and unlock the app"
          value={pin1}
          onChange={(v) => {
            setPin1(v)
            setError(undefined)
          }}
          onComplete={handleComplete1}
          error={error}
          disabled={isSubmitting}
        />
      ) : (
        <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <PinInput
            title="Confirm your PIN"
            description="Re-enter to match"
            value={pin2}
            onChange={(v) => {
              setPin2(v)
              setError(undefined)
            }}
            onComplete={handleComplete2}
            error={error}
            disabled={isSubmitting}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
