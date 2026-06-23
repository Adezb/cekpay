import React from 'react'
import { useUIStore } from '../../stores/uiStore'
import { Toast } from './Toast'

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts)
  const dismissToast = useUIStore((state) => state.dismissToast)

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => dismissToast(toast.id)}
        />
      ))}
    </>
  )
}

