import React, { useRef, useEffect } from 'react'

export interface PinInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  error?: string
  title?: string
  description?: string
  disabled?: boolean
  autoFocus?: boolean
}

export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  onComplete,
  error,
  title,
  description,
  disabled = false,
  autoFocus = true,
}) => {
  const length = 4
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Parse the current value string into an array of characters
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value)
    }
  }, [value, onComplete])

  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.focus()
    }
  }

  // Auto-focus the first input on mount if requested
  useEffect(() => {
    if (autoFocus && !disabled) {
      // Small timeout to ensure DOM is fully ready and transition is starting
      const timer = setTimeout(() => {
        focusInput(0)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [autoFocus, disabled])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value
    // We only accept digits
    const lastChar = val.substring(val.length - 1)
    if (lastChar && !/^\d$/.test(lastChar)) {
      return
    }

    const newDigits = [...digits]
    newDigits[index] = lastChar
    const newValue = newDigits.join('')
    onChange(newValue)

    // Auto-advance to next input if we typed a digit
    if (lastChar && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newDigits = [...digits]
      
      if (digits[index]) {
        // If current digit has value, clear it
        newDigits[index] = ''
        onChange(newDigits.join(''))
      } else if (index > 0) {
        // If current digit is empty, clear the previous digit and focus it
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
        focusInput(index - 1)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const cleaned = pastedData.replace(/\D/g, '').substring(0, length)
    
    if (cleaned) {
      onChange(cleaned)
      // Focus the appropriate input after paste
      const nextFocus = Math.min(cleaned.length, length - 1)
      focusInput(nextFocus)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {(title || description) && (
        <div className="text-center mb-6 max-w-xs selectable">
          {title && (
            <h4 className="text-base font-bold text-text-primary mb-1">
              {title}
            </h4>
          )}
          {description && (
            <p className="text-sm text-text-muted">
              {description}
            </p>
          )}
        </div>
      )}

      <div 
        className="flex gap-4 justify-center items-center" 
        onPaste={handlePaste}
      >
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index]}
            disabled={disabled}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
              error
                ? 'bg-red-50 border-error focus:ring-error focus:border-error text-error'
                : 'bg-slate-50 border-slate-300 focus:bg-white focus:ring-brand focus:border-brand text-text-primary'
            }`}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-error text-center">
          {error}
        </p>
      )}
    </div>
  )
}
