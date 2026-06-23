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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation
  const isValidPhone = isValidNigerianPhone(phone)
  const isFormValid = firstName.trim().length > 1 && lastName.trim().length > 1 && isValidPhone

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
      })

      // 2. Generate and "send" the pass
      const pass = await sendPass(phone.trim())
      
      // DEV HELPER: Log the pass for testing
      console.log(`[DEV] Your pass is: ${pass}`)
      
      showToast('Pass sent to your phone!', 'success')
      
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
    <div className="space-y-6">
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
