import React from 'react'
import type { TransactionStatus } from '../../types'

export interface StatusBadgeProps {
  status: TransactionStatus
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const badgeConfig = {
    Success: {
      classes: 'bg-emerald-50 text-success border-emerald-100/80',
      label: 'Success',
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    Failed: {
      classes: 'bg-red-50 text-error border-red-100/80',
      label: 'Failed',
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    Reversed: {
      classes: 'bg-amber-50 text-amber-700 border-amber-100/80',
      label: 'Reversed',
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
          />
        </svg>
      ),
    },
  }

  const config = badgeConfig[status] || badgeConfig.Success

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.classes} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  )
}
