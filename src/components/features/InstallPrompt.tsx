import React, { useState, useEffect, useRef } from 'react'

const DISMISS_KEY = 'cekpay_install_dismissed_at'
const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 Hours

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isDismissed, setIsDismissed] = useState<boolean>(false)
  const [isStandalone, setIsStandalone] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [copyFailed, setCopyFailed] = useState<boolean>(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Browser & Platform Detection
  const [detection, setDetection] = useState({
    isIOS: false,
    isIosSafari: false,
    isIosOther: false,
    isAndroid: false,
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const standalone = mediaQuery.matches || (window.navigator as any).standalone

    setIsStandalone(standalone)

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isIosSafari = isIOS && /safari/i.test(navigator.userAgent) && !/crios|fxios|opios/i.test(navigator.userAgent)
    const isIosOther = isIOS && !isIosSafari
    const isAndroid = /android/i.test(navigator.userAgent)

    setDetection({
      isIOS,
      isIosSafari,
      isIosOther,
      isAndroid,
    })

    // Check 24-hour dismissal cooldown
    const savedTimestamp = localStorage.getItem(DISMISS_KEY)
    if (savedTimestamp) {
      const dismissedAt = parseInt(savedTimestamp, 10)
      if (!isNaN(dismissedAt) && Date.now() - dismissedAt < COOLDOWN_MS) {
        setIsDismissed(true)
      }
    }

    setIsInitialized(true)

    // Check if global deferredInstallPrompt was captured before component mount
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt)
    }

    const handler = (e: any) => {
      e.preventDefault()
      ;(window as any).deferredInstallPrompt = e
      setDeferredPrompt(e)
    }

    const handlePwaAvailable = () => {
      if ((window as any).deferredInstallPrompt) {
        setDeferredPrompt((window as any).deferredInstallPrompt)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('pwa-install-available', handlePwaAvailable)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('pwa-install-available', handlePwaAvailable)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setIsDismissed(true)
  }

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt
    if (!promptEvent) return
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted PWA installation')
      handleDismiss()
    }
    ;(window as any).deferredInstallPrompt = null
    setDeferredPrompt(null)
  }

  const handleCopyLink = async () => {
    const link = window.location.origin || 'https://cekpay.com.ng'
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setCopyFailed(false)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyFailed(true)
      setCopied(false)
      setTimeout(() => setCopyFailed(false), 2000)
    }
  }

  // Focus trap and accessibility management
  useEffect(() => {
    if (!isInitialized || isStandalone || isDismissed) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const container = modalRef.current
    if (container) {
      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length > 0) {
        focusable[0].focus()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss()
        return
      }

      if (e.key === 'Tab' && container) {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [isInitialized, isStandalone, isDismissed])

  // Hide if not initialized yet, or running in standalone mode, or currently within 24-hour dismissal cooldown
  if (!isInitialized || isStandalone || isDismissed) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-prompt-heading"
        aria-describedby="install-prompt-subtitle"
        className="bg-surface rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95"
      >
        {/* Top Icon Badge */}
        <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md text-white">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>

        {/* Main Heading & Subtitle */}
        <h3 id="install-prompt-heading" className="text-xl font-bold text-text-primary mb-2">Install CEKPay App</h3>
        <p id="install-prompt-subtitle" className="text-sm text-text-muted mb-4 leading-relaxed">
          Install CEKPay on your device for instant access, offline reliability, and lightning-fast transactions.
        </p>

        {/* Value Proposition List */}
        <div className="bg-canvas rounded-xl p-3 mb-5 border border-slate-100 text-left text-xs font-medium text-text-primary space-y-2">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>Instant Airtime & Mobile Data Top-ups</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>Electricity Tokens & Utility Bills Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏦</span>
            <span>Direct Virtual Account (DVA) Instant Funding</span>
          </div>
        </div>

        {/* Dynamic Platform-Specific Actions & Instructions */}
        {deferredPrompt || (typeof window !== 'undefined' && (window as any).deferredInstallPrompt) ? (
          /* Case A: Android / Chromium / Desktop with deferredPrompt */
          <button
            onClick={handleInstallClick}
            className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all"
          >
            Install Now
          </button>
        ) : detection.isIosSafari ? (
          /* Case B: iOS Safari */
          <div className="space-y-3">
            <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl text-xs text-text-primary space-y-1.5 text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-brand">Step 1:</span>
                <span>Tap the <strong>Share</strong> icon (⎋) at the bottom of Safari.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-brand">Step 2:</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong> (➕).</span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full bg-brand text-white font-semibold py-2.5 px-4 rounded-xl shadow-md"
            >
              Got It
            </button>
          </div>
        ) : detection.isIosOther ? (
          /* Case C: iOS Non-Safari Browser (Chrome / Firefox on iOS) */
          <div className="space-y-3">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-left">
              Apple requires Safari to install web apps. Please open <strong>cekpay.com.ng</strong> in Safari.
            </p>
            <button
              onClick={handleCopyLink}
              className="w-full bg-brand text-white font-semibold py-2.5 px-4 rounded-xl shadow-md"
            >
              {copied ? 'Link Copied to Clipboard!' : copyFailed ? 'Failed to Copy Link' : 'Copy App Link'}
            </button>
          </div>
        ) : (
          /* Case D: Other Browsers Fallback */
          <div className="space-y-3">
            <p className="text-xs text-text-muted bg-slate-100 p-2.5 rounded-xl text-left">
              Open your browser menu (⋮) and select <strong>'Add to Home Screen'</strong> or <strong>'Install App'</strong>.
            </p>
            <button
              onClick={handleDismiss}
              className="w-full bg-brand text-white font-semibold py-2.5 px-4 rounded-xl shadow-md"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Secondary Action */}
        <button
          onClick={handleDismiss}
          className="block w-full text-center text-xs font-semibold text-text-muted hover:text-text-primary mt-3 py-1 transition-colors"
        >
          Continue in browser
        </button>

        {/* Footer Branding */}
        <p className="mt-4 text-[11px] font-medium text-text-muted">
          Powered by CEK TOP VENTURES LTD
        </p>
      </div>
    </div>
  )
}
