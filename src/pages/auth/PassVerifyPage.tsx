import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { PassInput } from '../../components/ui/PassInput'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'

export function PassVerifyPage() {
  const navigate = useNavigate()
  const phone = useAuthStore((state) => state.phone)
  const verifyPass = useAuthStore((state) => state.verifyPass)
  const sendPass = useAuthStore((state) => state.sendPass)
  const showToast = useUIStore((state) => state.showToast)

  const [pass, setPass] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [countdown, setCountdown] = useState(60)

  // Redirect back to signup if there is no phone in the store (e.g., direct visit or reload)
  if (!phone) {
    return <Navigate to="/auth/signup" replace />
  }

  // Handle countdown timer for "Resend Pass"
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  // Partially mask the phone number (e.g., 0803 123 4567 -> +234 803 XXX 4567)
  const maskedPhone = (() => {
    const p = phone.replace(/^0/, '') // Remove leading 0 if any
    if (p.length < 10) return phone // Fallback if format is weird
    // Standard format: +234 followed by the rest
    const prefix = p.substring(0, 3)
    const suffix = p.substring(p.length - 4)
    return `+234 ${prefix} XXX ${suffix}`
  })()

  const handleVerify = useCallback(async (val: string) => {
    if (val.length !== 6 || isSubmitting || isSuccess) return

    setIsSubmitting(true)

    try {
      const isValid = await verifyPass(val)
      if (isValid) {
        setIsSuccess(true)
        showToast('Pass verified successfully!', 'success')
        
        // Wait a beat to show the success state before navigating
        setTimeout(() => {
          navigate('/auth/create-pin')
        }, 1000)
      } else {
        showToast('Invalid Pass. Please try again.', 'error')
        setPass('') // Clear input on failure
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, isSuccess, verifyPass, showToast, navigate])

  const handleResend = async () => {
    if (countdown > 0 || isSubmitting) return

    try {
      setIsSubmitting(true)
      const res = await sendPass(phone)
      
      showToast(res.message || 'A new Pass has been sent', 'success')
      setCountdown(60) // Reset timer
      setPass('') // Clear input
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend Pass'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {isSuccess ? (
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4 animate-bounce">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        ) : null}
        
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Enter your verification Pass
        </h1>
        <p className="mt-2 text-slate-500 text-sm">
          We sent a Pass to <span className="font-semibold text-slate-700">{maskedPhone}</span>
        </p>
      </div>

      <div className="py-2">
        <PassInput
          value={pass}
          onChange={setPass}
          onComplete={handleVerify}
          disabled={isSubmitting || isSuccess}
        />
      </div>

      <div className="pt-2">
        <Button
          type="button"
          className="w-full"
          disabled={pass.length !== 6 || isSubmitting || isSuccess}
          isLoading={isSubmitting && !isSuccess}
          onClick={() => handleVerify(pass)}
        >
          {isSuccess ? 'Verified' : 'Verify Pass'}
        </Button>
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-slate-600">
          Didn't receive the Pass?{' '}
          {countdown > 0 ? (
            <span className="font-semibold text-slate-400">
              Resend in {countdown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting}
              className="font-semibold text-brand hover:text-brand/80 transition-colors focus:outline-none"
            >
              Resend Pass
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
