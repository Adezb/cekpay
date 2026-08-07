import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { initOneSignal } from './services/notifications'

// Early Global PWA Event Listener Capture to prevent race conditions
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  ;(window as any).deferredInstallPrompt = e
  window.dispatchEvent(new Event('pwa-install-available'))
})

// Initialize OneSignal Push Notifications
initOneSignal()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
