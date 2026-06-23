import React from 'react'
import { useUIStore } from '../../stores/uiStore'

export const QuickActionGrid: React.FC = () => {
  const { openModal, isOnline } = useUIStore()

  const actions = [
    {
      id: 'airtime',
      label: 'Airtime',
      icon: (
        <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      ),
    },
    {
      id: 'data-bundle',
      label: 'Data',
      icon: (
        <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
        </svg>
      ),
    },
    {
      id: 'electricity',
      label: 'Electricity',
      icon: (
        <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      id: 'cable-tv',
      label: 'Cable TV',
      icon: (
        <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => openModal(action.id)}
          disabled={!isOnline}
          className={`
            flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px] 
            bg-surface rounded-2xl shadow-sm border border-slate-100 
            transition-all duration-200
            ${isOnline 
              ? 'hover:border-blue-200 hover:shadow-md active:scale-95' 
              : 'opacity-60 cursor-not-allowed grayscale'
            }
          `}
        >
          <div className={`mb-2 sm:mb-3 p-2.5 sm:p-3 rounded-full ${isOnline ? 'bg-blue-50' : 'bg-slate-100'}`}>
            {action.icon}
          </div>
          <span className="font-bold text-sm text-text-primary tracking-tight">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}
