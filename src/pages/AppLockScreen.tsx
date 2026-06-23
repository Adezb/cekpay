import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PinInput } from '../components/ui/PinInput'
import { Toast } from '../components/ui/Toast'
import { Logo } from '../components/ui/Logo'
import { useAuthStore } from '../stores/authStore'

export const AppLockScreen: React.FC = () => {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Lockout security states
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0)

  const { user, unlockWithPin } = useAuthStore()

  // Mock User info fallback
  const mockUser = user || {
    firstName: 'Demo',
  }

  // Handle countdown lockout timer
  useEffect(() => {
    if (!isLockedOut) return

    if (lockoutTimeLeft <= 0) {
      setIsLockedOut(false)
      setFailedAttempts(0)
      setError('')
      return
    }

    const timer = setTimeout(() => {
      setLockoutTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isLockedOut, lockoutTimeLeft])

  const handleUnlock = async (enteredPin: string) => {
    if (isLockedOut) return

    // In Phase 4: we'll call mockVerifyPin or authStore's unlockWithPin
    let isCorrect = false

    if (user && user.pinHash === enteredPin) {
      isCorrect = await unlockWithPin(enteredPin)
    } else if (enteredPin === '1234') {
      isCorrect = true
      
      // Force unlock the global auth store when using demo override PIN
      useAuthStore.setState({ isLocked: false })
      
      // Force update legacy localStorage (used by useAuthGuard)
      const legacyAuthString = localStorage.getItem('cekpay_mock_auth')
      if (legacyAuthString) {
        try {
          const legacyAuth = JSON.parse(legacyAuthString)
          legacyAuth.isLocked = false
          localStorage.setItem('cekpay_mock_auth', JSON.stringify(legacyAuth))
        } catch (e) {
          // ignore parsing error
        }
      }
      
      // Manually dispatch the event so useAuthGuard updates immediately
      window.dispatchEvent(new Event('cekpay_auth_change'))
    }

    if (isCorrect) {
      setError('')
      setFailedAttempts(0)
      setToastMessage('Access Granted!')

      // Delay navigation slightly so the user sees the success feedback
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } else {
      setPin('')
      setIsShaking(true)
      const nextFailed = failedAttempts + 1
      setFailedAttempts(nextFailed)

      // Trigger shake reset
      setTimeout(() => {
        setIsShaking(false)
      }, 500)

      if (nextFailed >= 5) {
        setIsLockedOut(true)
        setLockoutTimeLeft(30)
        setError('Too many failed attempts')
        setToastMessage('Too many failed attempts. Locked out for 30s.')
      } else {
        setError('Incorrect PIN')
        setToastMessage(`Incorrect PIN. ${5 - nextFailed} attempts remaining.`)
      }
    }
  }

  const handleLogout = () => {
    // In Phase 4: clear auth store session
    setToastMessage('Session cleared')
    setTimeout(() => {
      navigate('/auth/signup')
    }, 500)
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col justify-center items-center bg-canvas px-4 select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={failedAttempts >= 5 && isLockedOut ? 'error' : (toastMessage.includes('Granted') ? 'success' : 'error')}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="w-full max-w-sm flex flex-col items-center">
        {/* CEKPay Logo */}
        <div className="flex flex-col items-center justify-center mb-10 select-none">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand text-white shadow-lg shadow-brand/25 mb-3">
            <Logo width="192" height="192" />
          </div>
          <span className="text-3xl font-black tracking-tight text-text-primary">
            CEK<span className="text-brand">Pay</span>
          </span>
          <span className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">
            The Speedboat of VTU
          </span>
        </div>

        {/* User Greeting Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-extrabold text-text-primary font-sans">
            Welcome back, {mockUser.firstName}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Enter your 4-digit PIN to unlock CEKPay
          </p>
        </div>

        {/* PIN Entry Area */}
        <div className={`w-full ${isShaking ? 'animate-shake' : ''}`}>
          <PinInput
            value={pin}
            onChange={setPin}
            onComplete={handleUnlock}
            error={error}
            disabled={isLockedOut}
            autoFocus={!isLockedOut}
          />
        </div>

        {/* Lockout Countdown Timer UI overlay */}
        {isLockedOut && (
          <div className="text-center mt-6 p-3 bg-red-50 border border-red-100 rounded-xl w-full">
            <p className="text-sm font-semibold text-error">
              Locked out. Please try again in {lockoutTimeLeft}s.
            </p>
          </div>
        )}

        {/* Bottom switcher action link */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-brand hover:text-blue-800 transition-colors uppercase tracking-wider focus:outline-none focus:underline"
          >
            Not {mockUser.firstName}? Log out
          </button>
        </div>
      </div>
    </div>
  )
}
