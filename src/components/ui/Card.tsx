import React from 'react'

export type CardVariant = 'default' | 'elevated' | 'flat'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'rounded-2xl p-4 bg-surface transition-shadow duration-200'

  const variantStyles = {
    default: 'shadow-sm border border-slate-100/60',
    elevated: 'shadow-md border border-slate-100/20',
    flat: 'border border-slate-200/60 shadow-none',
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
