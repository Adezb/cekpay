import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  isLoading?: boolean
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center rounded-xl py-3 px-6 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantStyles = {
    primary: 'bg-brand text-white hover:bg-blue-800 focus:ring-brand',
    secondary: 'bg-blue-50 text-brand hover:bg-blue-100 focus:ring-brand',
    danger: 'bg-error text-white hover:bg-red-700 focus:ring-error',
    ghost: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-slate-100 focus:ring-slate-200',
  }

  const stateStyles =
    disabled || isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
  const widthStyles = fullWidth ? 'w-full' : 'w-full md:w-auto' // Full width on mobile by default per specs

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${stateStyles} ${widthStyles} ${className}`}
      {...props}
    >
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>{children}</span>
      
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </span>
      )}
    </button>
  )
}
