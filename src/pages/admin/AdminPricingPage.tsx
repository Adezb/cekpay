import React, { useState, useEffect, useMemo } from 'react'
import { mockAdminGetProductPrices, mockAdminUpdatePricing } from '../../services/mock/mockServices'
import type { ProductPrice } from '../../types'
import { formatNaira } from '../../utils/formatCurrency'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'

export const AdminPricingPage: React.FC = () => {
  const { showToast } = useUIStore()

  const [prices, setPrices] = useState<ProductPrice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Track edited prices separately to enable "Save All"
  const [edits, setEdits] = useState<Record<string, number>>({})
  
  const [activeTab, setActiveTab] = useState<'Data' | 'Airtime' | 'Electricity' | 'Cable'>('Data')

  const fetchPrices = () => {
    setIsLoading(true)
    mockAdminGetProductPrices()
      .then(setPrices)
      .catch((err) => showToast(err.message || 'Failed to load prices', 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchPrices()
  }, [])

  // Filter products by currently active tab
  const activeProducts = useMemo(() => {
    return prices.filter(p => p.service === activeTab)
  }, [prices, activeTab])

  // Count how many products have been edited
  const hasUnsavedChanges = Object.keys(edits).length > 0

  const handlePriceChange = (id: string, newRetailPrice: string) => {
    const numericValue = parseInt(newRetailPrice.replace(/\D/g, ''), 10) || 0
    
    // Check if it's the same as original
    const originalPrice = prices.find(p => p.id === id)?.retailPrice
    
    setEdits(prev => {
      const next = { ...prev }
      if (originalPrice === numericValue) {
        delete next[id] // remove from edits if reverted to original
      } else {
        next[id] = numericValue
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!hasUnsavedChanges) return
    
    setIsSaving(true)
    const updates = Object.entries(edits).map(([id, retailPrice]) => ({ id, retailPrice }))
    
    try {
      await mockAdminUpdatePricing(updates)
      showToast('Pricing updated successfully.', 'success')
      setEdits({}) // clear edits
      fetchPrices() // refresh list
    } catch (err: any) {
      showToast(err.message || 'Failed to update pricing', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const getMargin = (cost: number, retail: number) => {
    if (cost === 0) return 0
    return ((retail - cost) / cost) * 100
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-text-primary">Product Pricing Engine</h2>
          <p className="text-sm text-text-muted mt-1">Configure margins and retail prices for VTU services.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="bg-brand text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[120px]"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span>Saving...</span>
            </div>
          ) : (
            `Save Changes ${hasUnsavedChanges ? `(${Object.keys(edits).length})` : ''}`
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-slate-200">
        {(['Data', 'Airtime', 'Electricity', 'Cable'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-brand text-brand bg-blue-50' 
                : 'border-transparent text-text-muted hover:text-text-primary hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Spinner size="lg" />
            <span className="text-sm text-text-muted mt-4 font-medium">Loading pricing config...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-text-muted font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Plan Name</th>
                  <th className="px-6 py-4">Network/Provider</th>
                  <th className="px-6 py-4">Cost Price</th>
                  <th className="px-6 py-4 w-48">Retail Price</th>
                  <th className="px-6 py-4">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeProducts.map((p) => {
                  // If it's edited, use the edit value, otherwise use actual retailPrice
                  const currentRetail = edits[p.id] !== undefined ? edits[p.id] : p.retailPrice
                  const margin = getMargin(p.aggregatorCostPrice, currentRetail)
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-text-primary">{p.planName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                          {p.network || p.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-text-secondary">
                        {formatNaira(p.aggregatorCostPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={currentRetail ? currentRetail.toLocaleString() : ''}
                            onChange={(e) => handlePriceChange(p.id, e.target.value)}
                            className={`w-full pl-8 pr-3 py-2 bg-white border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand transition-colors ${
                              edits[p.id] !== undefined 
                                ? 'border-brand bg-blue-50/50' 
                                : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${
                          margin < 0 ? 'text-error' : margin > 0 ? 'text-success' : 'text-text-muted'
                        }`}>
                          {margin > 0 ? '+' : ''}{margin.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {activeProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted font-medium">
                      No products found for this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
