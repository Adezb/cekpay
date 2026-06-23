import { useEffect } from 'react'
import { getMockAuth, setMockAuth } from '../App'
import { useAuthGuard } from './useAuthGuard'

const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Custom hook to monitor user interactions and automatically lock the app after a period of inactivity.
 * Resets on clicks, keypresses, touches, scrolling, and cursor movements.
 */
export const useInactivityTimer = (timeoutMs: number = INACTIVITY_TIMEOUT) => {
  const { isAuthenticated, isLocked } = useAuthGuard()

  useEffect(() => {
    // Only track inactivity if user is logged in and screen is currently unlocked
    if (!isAuthenticated || isLocked) {
      return
    }

    let timerId: ReturnType<typeof setTimeout>

    const handleInactivity = () => {
      const auth = getMockAuth()
      if (auth.isAuthenticated && !auth.isLocked) {
        setMockAuth({
          ...auth,
          isLocked: true,
        })
        console.log(`[useInactivityTimer] ${timeoutMs / 1000}s of inactivity reached. App locked.`)
      }
    }

    const resetTimer = () => {
      clearTimeout(timerId)
      timerId = setTimeout(handleInactivity, timeoutMs)
    }

    // Initialize the timer on mount or state change
    resetTimer()

    // Interactive events to monitor for resetting the timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

    events.forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    return () => {
      clearTimeout(timerId)
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [isAuthenticated, isLocked, timeoutMs])
}
