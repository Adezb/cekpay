import React, { useRef, useEffect } from 'react'

export interface PassInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  error?: string
  disabled?: boolean
  autoFocus?: boolean
}

export const PassInput: React.FC<PassInputProps> = ({
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  autoFocus = true,
}) => {
  const length = 6
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Parse the current value string into an array of characters
  const characters = value.split('').concat(Array(length).fill('')).slice(0, length)

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

  // Auto-focus the first empty slot on mount if requested
  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = setTimeout(() => {
        focusInput(0)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [autoFocus, disabled])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value
    const lastChar = val.substring(val.length - 1).toUpperCase()

    // Validate alphanumeric
    if (lastChar && !/^[A-Z0-9]$/.test(lastChar)) {
      return
    }

    const newCharacters = [...characters]
    newCharacters[index] = lastChar
    const newValue = newCharacters.join('')
    onChange(newValue)

    // Auto-advance to next input if we typed a valid character
    if (lastChar && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newCharacters = [...characters]
      
      if (characters[index]) {
        // If current slot has value, clear it
        newCharacters[index] = ''
        onChange(newCharacters.join(''))
      } else if (index > 0) {
        // If current slot is empty, clear the previous slot and focus it
        newCharacters[index - 1] = ''
        onChange(newCharacters.join(''))
        focusInput(index - 1)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const cleaned = pastedData
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .substring(0, length)
    
    if (cleaned) {
      onChange(cleaned)
      const nextFocus = Math.min(cleaned.length, length - 1)
      focusInput(nextFocus)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div 
        className="flex gap-2 sm:gap-3 justify-center items-center" 
        onPaste={handlePaste}
      >
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="text"
            maxLength={1}
            value={characters[index]}
            disabled={disabled}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all uppercase ${
              error
                ? 'border-error focus:ring-error focus:border-error text-error'
                : 'border-slate-200 focus:ring-brand focus:border-brand text-text-primary'
            } bg-surface`}
            aria-label={`Verification character ${index + 1}`}
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
