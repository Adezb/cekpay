import React, { useEffect, useState, useRef } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  showCloseButton?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [animateShow, setAnimateShow] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Synchronize internal animation states with the isOpen prop
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Tiny delay to let browser register mount state before transitioning classes
      const timer = setTimeout(() => {
        setAnimateShow(true)
      }, 10)
      return () => clearTimeout(timer)
    } else {
      setAnimateShow(false)
      // Matches the duration-300 transition duration
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [shouldRender])

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop with backdrop-blur and fade transition */}
      <div
        className={`fixed inset-0 backdrop-blur-md bg-black/40 transition-opacity duration-300 ease-out ${
          animateShow ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal/Bottom-Sheet Panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative w-full bg-surface shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out z-50 rounded-t-3xl sm:rounded-2xl max-h-[80dvh] sm:max-h-[85vh] sm:max-w-md sm:w-full pb-safe ${
          animateShow
            ? 'translate-y-0 opacity-100 sm:scale-100 sm:opacity-100'
            : 'translate-y-full opacity-0 sm:scale-95 sm:opacity-0'
        }`}
      >
        {/* Mobile Drag Indicator / Top Pull-bar */}
        <div 
          className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 block sm:hidden cursor-pointer"
          onClick={onClose}
        />

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-slate-100">
            {title ? (
              <h3
                id="modal-title"
                className="text-lg font-bold text-text-primary truncate"
              >
                {title}
              </h3>
            ) : (
              <div />
            )}

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
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
            )}
          </div>
        )}

        {/* Content area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 selectable">
          {children}
        </div>
      </div>
    </div>
  )
}
