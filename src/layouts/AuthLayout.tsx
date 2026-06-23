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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="192" height="192">
              <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#1E40AF" />
                  <stop offset="100%" stop-color="#1E3A8A" />
                </linearGradient>
                <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#38BDF8" />
                  <stop offset="100%" stop-color="#0284C7" />
                </linearGradient>
              </defs>

              <rect width="512" height="512" rx="115" fill="url(#bgGrad)" />

              <path d="M 360 160 A 130 130 0 1 0 360 352" fill="none" stroke="#FFFFFF" stroke-width="52" stroke-linecap="round" />

              <path d="M 285 130 L 210 270 L 295 270 L 240 400 L 390 230 L 310 230 Z" fill="url(#boltGrad)" />
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
