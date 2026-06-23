import React from 'react'
import { useUIStore } from '../../stores/uiStore'

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useUIStore()
  
  if (isOnline) return null

  return (
    <div className="bg-error text-white py-3 px-4 rounded-xl shadow-sm flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <svg 
        className="w-5 h-5 flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L5.636 5.636m12.728 12.728L5.636 5.636m0 12.728a9 9 0 010-12.728m0 0l2.829 2.829M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" 
        />
      </svg>
      <div>
        <p className="text-sm font-bold tracking-tight">You are currently offline</p>
        <p className="text-xs opacity-90">Quick actions are disabled until connection is restored.</p>
      </div>
    </div>
  )
}
