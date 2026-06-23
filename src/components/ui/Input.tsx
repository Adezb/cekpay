import React, { forwardRef, useId } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
      <div className={`w-full flex flex-col ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 text-sm font-semibold text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full min-h-[48px] px-4 py-3 bg-surface border rounded-xl text-base text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? 'border-error focus:ring-error focus:border-error'
                : 'border-slate-200 focus:ring-brand focus:border-brand'
            }`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm font-medium text-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
