import React from 'react'
import { Card } from '../components/ui/Card'

export interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col justify-center items-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md flex flex-col">
        {/* CEKPay Logo Header */}
        <div className="flex flex-col items-center justify-center mb-8 select-none">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand text-white shadow-lg shadow-brand/25 mb-3 transition-transform duration-300 hover:scale-105">
            {/* Speedboat/Lightning fast icon */}
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-3xl font-black tracking-tight text-text-primary">
            CEK<span className="text-brand">Pay</span>
          </span>
          <span className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">
            The Speedboat of VTU
          </span>
        </div>

        {/* Auth Content Card */}
        <Card variant="default" className="p-6 sm:p-8 shadow-md">
          {children}
        </Card>

        {/* Footer info */}
        <footer className="text-center mt-8 text-xs font-semibold text-text-muted select-none">
          &copy; {new Date().getFullYear()} CEK TOP VENTURES LTD. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
