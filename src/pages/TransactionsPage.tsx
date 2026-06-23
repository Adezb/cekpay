import React, { useState, useMemo } from 'react'
import { useTransactionStore } from '../stores/transactionStore'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatNaira } from '../utils/formatCurrency'
import type { TransactionService } from '../types'

const FILTER_TABS: { label: string; value: TransactionService | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Airtime', value: 'Airtime' },
  { label: 'Data', value: 'Data' },
  { label: 'Electricity', value: 'Electricity' },
  { label: 'Cable TV', value: 'Cable' },
  { label: 'Funding', value: 'Funding' },
]

export const TransactionsPage: React.FC = () => {
  const { transactions, isLoading } = useTransactionStore()
  const [activeFilter, setActiveFilter] = useState<TransactionService | 'All'>('All')

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'All') return transactions
    return transactions.filter(t => t.service === activeFilter)
  }, [transactions, activeFilter])

  const getServiceIcon = (service: TransactionService) => {
    switch (service) {
      case 'Airtime': return '📱'
      case 'Data': return '📶'
      case 'Electricity': return '⚡'
      case 'Cable': return '📺'
      case 'Funding': return '💰'
      default: return '💸'
    }
  }

  const getDescription = (txn: import('../types').Transaction) => {
    const details = [txn.provider, txn.planName, txn.recipient].filter(Boolean).join(' - ')
    return details || `${txn.service} Transaction`
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="bg-white px-6 pt-12 pb-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Transaction History
        </h1>
        
        {/* Filter Scrollable Strip */}
        <div className="mt-6 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeFilter === tab.value
                  ? 'bg-brand text-white'
                  : 'bg-slate-100 text-text-muted hover:bg-slate-200 hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="w-8 h-8 animate-spin text-brand" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl">
              📭
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-lg">No transactions yet</h3>
              <p className="text-sm text-text-muted mt-1">
                When you make a transaction, it will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map(txn => (
              <div 
                key={txn.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between space-x-4 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="w-12 h-12 flex-shrink-0 bg-slate-50 rounded-full flex items-center justify-center text-2xl border border-slate-100">
                    {getServiceIcon(txn.service)}
                  </div>
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-semibold text-text-primary truncate">
                      {getDescription(txn)}
                    </span>
                    <span className="text-xs text-text-muted mt-0.5">
                      {new Date(txn.createdAt).toLocaleString([], {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
                  <span className={`font-bold ${txn.type === 'Credit' ? 'text-success' : 'text-text-primary'}`}>
                    {txn.type === 'Credit' ? '+' : '-'}{formatNaira(txn.amount)}
                  </span>
                  <StatusBadge status={txn.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
