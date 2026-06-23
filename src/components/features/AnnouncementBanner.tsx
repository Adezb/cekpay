import React, { useState, useEffect } from 'react'
import type { Announcement } from '../../types'
import { useUIStore } from '../../stores/uiStore'

interface AnnouncementBannerProps {
  announcements: Announcement[]
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ announcements }) => {
  const { isAnnouncementDismissed, dismissAnnouncement } = useUIStore()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filter out inactive and dismissed announcements
  const visibleAnnouncements = announcements.filter(
    (a) => a.isActive && !isAnnouncementDismissed(a.id)
  )

  // Cycle through announcements every 5 seconds if there are multiple
  useEffect(() => {
    if (visibleAnnouncements.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [visibleAnnouncements.length])

  // Reset index if it goes out of bounds after a dismissal
  useEffect(() => {
    if (currentIndex >= visibleAnnouncements.length && visibleAnnouncements.length > 0) {
      setCurrentIndex(0)
    }
  }, [visibleAnnouncements.length, currentIndex])

  if (visibleAnnouncements.length === 0) return null

  const current = visibleAnnouncements[currentIndex]

  // Determine styling based on type
  let colorClasses = 'bg-blue-50 text-blue-800 border-blue-100'
  let icon = (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  if (current.type === 'Warning') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-100'
    icon = (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  } else if (current.type === 'Promo') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-100'
    icon = (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    )
  }

  const handleDismiss = () => {
    dismissAnnouncement(current.id)
  }

  return (
    <div className={`border text-sm py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors duration-300 ${colorClasses}`}>
      <div className="flex items-center space-x-2 overflow-hidden mr-2">
        {icon}
        <span className="font-medium truncate">{current.message}</span>
      </div>
      <button 
        onClick={handleDismiss}
        className="p-1 hover:bg-black/5 rounded-full transition-colors flex-shrink-0"
        aria-label="Dismiss announcement"
      >
        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
