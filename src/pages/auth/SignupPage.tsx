import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { isValidNigerianPhone } from '../../utils/detectNetwork'

export function SignupPage() {
  const navigate = useNavigate()
  const signup = useAuthStore((state) => state.signup)
  const sendPass = useAuthStore((state) => state.sendPass)
  const showToast = useUIStore((state) => state.showToast)
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [hasConsented, setHasConsented] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation
  const isValidPhone = isValidNigerianPhone(phone)
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isFormValid = firstName.trim().length > 1 && lastName.trim().length > 1 && isValidPhone && isValidEmail && hasConsented

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)

    try {
      // 1. Create the user
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      })

      // 2. Dispatch pass via server-side Edge Function
      const res = await sendPass(phone.trim(), email.trim())
      
      showToast(res.message || 'Pass sent to your phone and email!', 'success')
      
      // 3. Navigate to verification screen
      navigate('/auth/verify-pass')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signup failed. Please try again.'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h1>
        <p className="mt-2 text-slate-500 text-sm">
          Join CEKPay to enjoy fast and reliable utility payments.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="e.g. John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isSubmitting}
            required
            autoComplete="given-name"
          />
          <Input
            label="Last Name"
            placeholder="e.g. Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isSubmitting}
            required
            autoComplete="family-name"
          />
        </div>

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
        <p className="text-xs text-slate-500 mt-1 pl-1">
          Enter 11 digits starting with 0
        </p>

        <Input
          label="Email Address"
          placeholder="e.g. name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
          type="email"
          autoComplete="email"
        />

        <div className="flex items-start space-x-3 pt-2">
          <input
            type="checkbox"
            id="consent"
            checked={hasConsented}
            onChange={(e) => setHasConsented(e.target.checked)}
            disabled={isSubmitting}
            className="mt-1 w-4 h-4 text-brand bg-slate-100 border-slate-300 rounded focus:ring-brand focus:ring-2"
          />
          <label htmlFor="consent" className="text-xs text-slate-600 leading-snug">
            I agree to the{' '}
            <Link to="/terms" className="font-semibold text-brand hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="font-semibold text-brand hover:underline">Privacy Policy</Link>.
          </label>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid || isSubmitting}
            isLoading={isSubmitting}
          >
            Send Pass
          </Button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
