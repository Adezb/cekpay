import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { mockAdminGetDashboard } from '../../services/mock/mockServices'
import { formatNaira } from '../../utils/formatCurrency'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    mockAdminGetDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-text-muted font-medium">Loading dashboard...</p>
      </div>
    )
  }

  if (!data) return null

  const stats = [
    { label: 'Total Users', value: data.usersCount.toLocaleString() },
    { label: 'Total Transactions', value: data.transactionsCount.toLocaleString() },
    { label: 'Revenue Today', value: formatNaira(data.revenueToday) },
    { label: 'Active Announcements', value: data.activeAnnouncementsCount.toString() },
  ]

  const quickLinks = [
    { to: '/admin/users', label: 'Manage Users', icon: '👥' },
    { to: '/admin/pricing', label: 'Update Pricing', icon: '💰' },
    { to: '/admin/announcements', label: 'Announcements', icon: '📢' },
    { to: '/admin/settings', label: 'System Settings', icon: '⚙️' },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-text-primary">Admin Dashboard</h2>
        <p className="text-sm text-text-muted mt-1">Overview of CEKPay system performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-text-muted">{stat.label}</h3>
            <p className="text-2xl font-black text-text-primary mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-xl shrink-0">
              {link.icon}
            </div>
            <span className="font-bold text-sm text-brand">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-text-primary">Recent Transactions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-text-muted font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentTransactions.map((txn: any) => (
                <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-text-secondary">{txn.reference}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-text-primary">{txn.service}</div>
                    <div className="text-xs text-text-muted mt-0.5">{txn.planName || '-'}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-text-primary">
                    {formatNaira(txn.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={txn.status} />
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(txn.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted font-medium">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
