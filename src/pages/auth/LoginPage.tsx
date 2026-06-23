import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const showToast = useUIStore((state) => state.showToast)
  
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation
  const isFormValid = phone.trim().length >= 10 && pin.trim().length === 4

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)

    try {
      await login(phone.trim(), pin.trim())
      showToast('Welcome back!', 'success')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="mt-2 text-slate-500 text-sm">
          Log in to your CEKPay account to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Phone Number"
          placeholder="0803 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
        />

        <Input
          label="4-Digit PIN"
          placeholder="••••"
          value={pin}
          onChange={(e) => {
            // Only allow numbers, max 4 digits
            const val = e.target.value.replace(/\D/g, '')
            if (val.length <= 4) {
              setPin(val)
            }
          }}
          disabled={isSubmitting}
          required
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
        />

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid || isSubmitting}
            isLoading={isSubmitting}
          >
            Log In
          </Button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
      
      {/* Quick Mock Login Helper (Optional for Demo) */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-semibold">Demo Accounts</p>
        <div className="flex justify-center gap-3">
          <button 
            type="button" 
            onClick={() => { setPhone('08012345678'); setPin('1234') }}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 px-3 rounded-full transition-colors font-medium"
          >
            Load User Demo
          </button>
          <button 
            type="button" 
            onClick={() => { setPhone('08099999999'); setPin('0000') }}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 px-3 rounded-full transition-colors font-medium"
          >
            Load Admin Demo
          </button>
        </div>
      </div>
    </div>
  )
}
