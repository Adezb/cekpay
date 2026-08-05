import React, { useState, useEffect } from 'react'
import {
  adminGetPromos as mockAdminGetPromos,
  adminCreatePromo as mockAdminCreatePromo,
  adminTogglePromo as mockAdminTogglePromo
} from '../../services'
import type { Promo } from '../../types'
import { formatNaira } from '../../utils/formatCurrency'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'

export const AdminPromosPage: React.FC = () => {
  const { showToast } = useUIStore()

  const [promos, setPromos] = useState<Promo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('fixed')
  const [valueStr, setValueStr] = useState('')
  const [minDepositStr, setMinDepositStr] = useState('')

  const fetchPromos = () => {
    setIsLoading(true)
    mockAdminGetPromos()
      .then(setPromos)
      .catch((err) => showToast(err.message || 'Failed to load promos', 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchPromos()
  }, [])

  const handleToggle = async (promo: Promo) => {
    try {
      await mockAdminTogglePromo(promo.id, !promo.isActive)
      showToast('Promo status updated', 'success')
      fetchPromos()
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !valueStr) return

    const value = parseInt(valueStr.replace(/\D/g, ''), 10) || 0
    const minDeposit = minDepositStr ? parseInt(minDepositStr.replace(/\D/g, ''), 10) : undefined

    if (value <= 0) {
      showToast('Value must be greater than zero', 'error')
      return
    }

    if (type === 'percentage' && value > 100) {
      showToast('Percentage cannot exceed 100', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await mockAdminCreatePromo({
        code: code.trim().toUpperCase(),
        type,
        value,
        minDeposit
      })
      showToast('Promo created', 'success')
      setIsModalOpen(false)
      setCode('')
      setType('fixed')
      setValueStr('')
      setMinDepositStr('')
      fetchPromos()
    } catch (err: any) {
      showToast(err.message || 'Failed to create promo', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-text-primary">Promos Manager</h2>
          <p className="text-sm text-text-muted mt-1">Create deposit bonuses and discount coupons.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Promo
        </button>
      </div>

      {/* Promos List */}
      <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Spinner size="lg" />
            <span className="text-sm text-text-muted mt-4 font-medium">Loading promos...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-text-muted font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Bonus Value</th>
                  <th className="px-6 py-4">Min Deposit</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold font-mono text-brand bg-blue-50 px-3 py-1 rounded-lg">
                        {promo.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">
                      {promo.type === 'percentage' ? `${promo.value}%` : formatNaira(promo.value)}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {promo.minDeposit ? formatNaira(promo.minDeposit) : 'None'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={promo.isActive} 
                              onChange={() => handleToggle(promo)} 
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${promo.isActive ? 'bg-brand' : 'bg-slate-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${promo.isActive ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                          <div className="ml-3 text-xs font-bold text-text-muted uppercase w-16 text-right">
                            {promo.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-text-muted font-medium">
                      No promos found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Promo">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-text-primary">Promo Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. WELCOME50"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand uppercase"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-text-primary">Reward Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`border rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                type === 'fixed' ? 'border-brand bg-blue-50 text-brand' : 'border-slate-200 bg-white text-text-muted hover:bg-slate-50'
              }`}>
                <input type="radio" name="type" value="fixed" checked={type === 'fixed'} onChange={() => setType('fixed')} className="sr-only" />
                <span className="font-bold text-sm">Fixed Amount</span>
              </label>
              <label className={`border rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                type === 'percentage' ? 'border-brand bg-blue-50 text-brand' : 'border-slate-200 bg-white text-text-muted hover:bg-slate-50'
              }`}>
                <input type="radio" name="type" value="percentage" checked={type === 'percentage'} onChange={() => setType('percentage')} className="sr-only" />
                <span className="font-bold text-sm">Percentage</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-text-primary">
              {type === 'fixed' ? 'Amount (₦)' : 'Percentage (%)'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={valueStr ? `${type === 'fixed' ? '₦' : ''}${parseInt(valueStr.replace(/\D/g, '') || '0', 10).toLocaleString()}${type === 'percentage' ? '%' : ''}` : ''}
              onChange={(e) => setValueStr(e.target.value)}
              placeholder={type === 'fixed' ? '₦0' : '0%'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-text-primary">Minimum Deposit (Optional)</label>
            <input
              type="text"
              inputMode="numeric"
              value={minDepositStr ? `₦${parseInt(minDepositStr.replace(/\D/g, '') || '0', 10).toLocaleString()}` : ''}
              onChange={(e) => setMinDepositStr(e.target.value)}
              placeholder="₦0"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <p className="text-xs text-text-muted mt-1">Leave empty if no minimum deposit is required.</p>
          </div>

          <button
            type="submit"
            disabled={!code.trim() || !valueStr || isSubmitting}
            className="w-full bg-brand text-white font-bold rounded-xl py-3.5 flex items-center justify-center space-x-2 transition-colors hover:bg-blue-800 disabled:bg-blue-300"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Promo</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  )
}
