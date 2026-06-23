import React, { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PinInput } from '../components/ui/PinInput'
import { PassInput } from '../components/ui/PassInput'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Toast } from '../components/ui/Toast'
import type { ToastType } from '../components/ui/Toast'
import { Card } from '../components/ui/Card'

export const DevPlayground: React.FC = () => {
  // Button interactive states
  const [btnLoading, setBtnLoading] = useState(false)

  // Input states
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // PinInput states
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  // PassInput states
  const [pass, setPass] = useState('')
  const [passError, setPassError] = useState('')

  // Toast states
  const [activeToasts, setActiveToasts] = useState<{ id: number; message: string; type: ToastType }[]>([])
  const [toastCounter, setToastCounter] = useState(0)

  const triggerToast = (message: string, type: ToastType) => {
    const id = toastCounter
    setToastCounter((prev) => prev + 1)
    setActiveToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-canvas text-text-primary px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Portal Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {activeToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            CEKPay Component Playground
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Showcase and interactive testing environment for Phase 2 UI Primitives.
          </p>
        </header>

        {/* 1. Button Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">1. Buttons</h2>
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase">States & Sizing</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    isLoading={btnLoading}
                    onClick={() => {
                      setBtnLoading(true)
                      setTimeout(() => setBtnLoading(false), 2000)
                    }}
                  >
                    Click to Load (2s)
                  </Button>
                  <Button variant="primary" disabled>
                    Disabled Button
                  </Button>
                </div>
                <Button variant="secondary" fullWidth>
                  Full Width Button
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 2. Input Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">2. Inputs</h2>
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase">Standard Input</h3>
              <Input
                label="First Name"
                placeholder="Enter your first name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <p className="text-xs text-text-muted mt-1">Current Value: {inputValue || 'None'}</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase">Validation States</h3>
              <Input
                label="Phone Number"
                placeholder="Enter phone number"
                error={inputError}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.length > 0 && !/^\d+$/.test(val)) {
                    setInputError('Only digits are allowed')
                  } else {
                    setInputError('')
                  }
                }}
              />
            </div>
          </Card>
        </section>

        {/* 3. PIN & Pass Input Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">3. PIN & Pass Inputs</h2>
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-text-muted uppercase self-start">
                4-Digit PIN Input
              </h3>
              <PinInput
                value={pin}
                onChange={setPin}
                error={pinError}
                title="Authorization PIN"
                description="Enter your 4-digit security PIN to confirm payment"
                onComplete={(val) => {
                  triggerToast(`PIN Completed: ${val}`, 'success')
                  if (val !== '1234') {
                    setPinError('Incorrect PIN (try 1234)')
                  } else {
                    setPinError('')
                  }
                }}
              />
              <div className="flex gap-2 justify-center w-full mt-4">
                <Button
                  variant="ghost"
                  className="py-1 px-3 text-xs w-auto"
                  onClick={() => {
                    setPin('')
                    setPinError('')
                  }}
                >
                  Reset PIN
                </Button>
                <Button
                  variant="ghost"
                  className="py-1 px-3 text-xs w-auto text-error"
                  onClick={() => setPinError('Simulated validation error')}
                >
                  Trigger Error
                </Button>
              </div>
            </div>

            <div className="space-y-4 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-text-muted uppercase self-start">
                6-Char Pass Input
              </h3>
              <div className="w-full text-center mb-2">
                <h4 className="text-base font-bold text-text-primary mb-1">
                  Verification Pass
                </h4>
                <p className="text-sm text-text-muted">
                  Enter the 6-character alphanumeric Pass sent to your device
                </p>
              </div>
              <PassInput
                value={pass}
                onChange={setPass}
                error={passError}
                onComplete={(val) => {
                  triggerToast(`Pass Completed: ${val}`, 'success')
                  if (val !== 'A7X9TP') {
                    setPassError('Incorrect Pass (try A7X9TP)')
                  } else {
                    setPassError('')
                  }
                }}
              />
              <div className="flex gap-2 justify-center w-full mt-4">
                <Button
                  variant="ghost"
                  className="py-1 px-3 text-xs w-auto"
                  onClick={() => {
                    setPass('')
                    setPassError('')
                  }}
                >
                  Reset Pass
                </Button>
                <Button
                  variant="ghost"
                  className="py-1 px-3 text-xs w-auto text-error"
                  onClick={() => setPassError('Simulated verification error')}
                >
                  Trigger Error
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 4. Modal Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">4. Modal / Bottom Sheet</h2>
          <Card className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-text-muted text-center max-w-sm">
              Triggers a glassmorphism backdrop sheet sliding up from bottom on mobile, and centered overlay on desktop.
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="w-auto">
              Open Modal Sheet
            </Button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Transaction Summary"
            >
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Service</span>
                    <span className="font-semibold text-text-primary font-sans">MTN Data Bundle</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Recipient</span>
                    <span className="font-semibold text-text-primary font-sans">+234 803 123 4567</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Amount</span>
                    <span className="font-bold text-success font-sans">₦350.00</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setIsModalOpen(false)
                    triggerToast('Transaction submitted', 'info')
                  }}>
                    Proceed
                  </Button>
                </div>
              </div>
            </Modal>
          </Card>
        </section>

        {/* 5. Spinner & Badge Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">5. Status Indicators</h2>
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase">Spinners</h3>
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex flex-col items-center gap-1">
                  <Spinner size="sm" />
                  <span className="text-xs text-text-muted">Small</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Spinner size="md" />
                  <span className="text-xs text-text-muted">Medium</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Spinner size="lg" />
                  <span className="text-xs text-text-muted">Large</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Spinner size="md" variant="muted" />
                  <span className="text-xs text-text-muted">Muted</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase">Transaction Status Badges</h3>
              <div className="flex flex-wrap gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <StatusBadge status="Success" />
                <StatusBadge status="Failed" />
                <StatusBadge status="Reversed" />
              </div>
            </div>
          </Card>
        </section>

        {/* 6. Toasts & Cards Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">6. Toasts & Cards</h2>
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase">Toast Triggers</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="w-auto py-2 px-4" onClick={() => triggerToast('DVA Account details copied successfully!', 'success')}>
                  Trigger Success
                </Button>
                <Button variant="secondary" className="w-auto py-2 px-4 text-error" onClick={() => triggerToast('Transaction failed: Insufficient balance.', 'error')}>
                  Trigger Error
                </Button>
                <Button variant="secondary" className="w-auto py-2 px-4 text-brand" onClick={() => triggerToast('Connecting to payment processor...', 'info')}>
                  Trigger Info
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase">Card Elevation Variations</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card variant="flat" className="p-3 text-center">
                  <span className="text-xs font-bold text-text-muted">FLAT CARD</span>
                </Card>
                <Card variant="elevated" className="p-3 text-center">
                  <span className="text-xs font-bold text-brand">ELEVATED CARD</span>
                </Card>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
