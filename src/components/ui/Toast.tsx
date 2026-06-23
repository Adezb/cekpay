import React, { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  const [animateShow, setAnimateShow] = useState(false)

  useEffect(() => {
    // Small delay to trigger transition after mount
    const animTimer = setTimeout(() => {
      setAnimateShow(true)
    }, 10)

    // Trigger onClose after duration
    const dismissTimer = setTimeout(() => {
      setAnimateShow(false)
      // Allow transition to finish before calling onClose
      const unmountTimer = setTimeout(() => {
        onClose()
      }, 300)
      return () => clearTimeout(unmountTimer)
    }, duration)

    return () => {
      clearTimeout(animTimer)
      clearTimeout(dismissTimer)
    }
  }, [onClose, duration])

  const handleManualClose = () => {
    setAnimateShow(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const icons = {
    success: (
      <svg
        className="w-5 h-5 text-success shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    error: (
      <svg
        className="w-5 h-5 text-error shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg
        className="w-5 h-5 text-brand shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  }

  const typeClasses = {
    success: 'border-emerald-100 bg-surface text-text-primary',
    error: 'border-red-100 bg-surface text-text-primary',
    info: 'border-blue-100 bg-surface text-text-primary',
  }

  return (
    <div
      role="alert"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[90%] sm:max-w-sm px-4 pointer-events-none transition-all duration-300 ease-out ${
        animateShow ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 bg-surface/95 backdrop-blur-md shadow-lg border rounded-xl p-4 w-full pointer-events-auto ${typeClasses[type]}`}
      >
        {icons[type]}
        
        <p className="text-sm font-semibold flex-1 line-clamp-2">
          {message}
        </p>

        <button
          type="button"
          onClick={handleManualClose}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand shrink-0"
          aria-label="Dismiss toast"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
