import React, { useState, useEffect, useMemo } from 'react'
import {
  mockAdminGetUsers,
  mockAdminFundWallet,
  mockAdminDebitWallet,
  mockAdminBanUser,
  mockAdminUnbanUser,
  type AdminUserView
} from '../../services/mock/mockServices'
import { formatNaira } from '../../utils/formatCurrency'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useUIStore()

  const [users, setUsers] = useState<AdminUserView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all')

  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null)
  const [activeModal, setActiveModal] = useState<'fund' | 'debit' | 'ban' | 'profile' | null>(null)
  
  // Modal Inputs
  const [amountInput, setAmountInput] = useState('')
  const [reasonInput, setReasonInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchUsers = () => {
    setIsLoading(true)
    mockAdminGetUsers()
      .then(setUsers)
      .catch((err) => showToast(err.message || 'Failed to load users', 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery)
      
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && !u.isBanned) ||
        (filterStatus === 'banned' && u.isBanned)

      return matchesSearch && matchesStatus
    })
  }, [users, searchQuery, filterStatus])

  // Actions
  const handleAction = (user: AdminUserView, action: 'fund' | 'debit' | 'ban' | 'profile') => {
    setSelectedUser(user)
    setAmountInput('')
    setReasonInput('')
    setActiveModal(action)
  }

  const closeModal = () => {
    if (!isProcessing) {
      setActiveModal(null)
      setSelectedUser(null)
    }
  }

  const executeAction = async () => {
    if (!selectedUser) return
    setIsProcessing(true)
    const numAmount = parseInt(amountInput.replace(/\D/g, ''), 10) || 0

    try {
      if (activeModal === 'fund') {
        if (numAmount <= 0) throw new Error('Amount must be greater than zero')
        await mockAdminFundWallet(selectedUser.id, numAmount)
        showToast(`Successfully funded ₦${numAmount.toLocaleString()}`, 'success')
      } else if (activeModal === 'debit') {
        if (numAmount <= 0) throw new Error('Amount must be greater than zero')
        if (!reasonInput) throw new Error('Reason is required for debit')
        await mockAdminDebitWallet(selectedUser.id, numAmount, reasonInput)
        showToast(`Successfully debited ₦${numAmount.toLocaleString()}`, 'success')
      } else if (activeModal === 'ban') {
        if (selectedUser.isBanned) {
          await mockAdminUnbanUser(selectedUser.id)
          showToast('User has been unbanned.', 'success')
        } else {
          await mockAdminBanUser(selectedUser.id)
          showToast('User has been banned.', 'success')
        }
      }
      
      closeModal()
      fetchUsers() // Refresh list
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-text-primary">Manage Users</h2>
          <p className="text-sm text-text-muted mt-1">View and manage CEKPay customers.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-surface p-4 rounded-2xl border border-slate-200">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="banned">Banned Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Spinner size="lg" />
            <span className="text-sm text-text-muted mt-4 font-medium">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-text-muted font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-text-muted">Joined {new Date(u.joinedDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-text-secondary">{u.phone}</td>
                    <td className="px-6 py-4 font-bold text-text-primary">{formatNaira(u.balance)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        u.isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleAction(u, 'fund')} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Fund</button>
                      <button onClick={() => handleAction(u, 'debit')} className="text-xs font-bold text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors">Debit</button>
                      <button onClick={() => handleAction(u, 'ban')} className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-text-muted font-medium">
                      No users found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={activeModal !== null}
        onClose={closeModal}
        title={
          activeModal === 'fund' ? 'Fund Wallet' :
          activeModal === 'debit' ? 'Debit Wallet' :
          activeModal === 'ban' ? (selectedUser?.isBanned ? 'Unban User' : 'Ban User') : ''
        }
      >
        {selectedUser && (
          <div className="space-y-5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-sm font-semibold text-text-primary">{selectedUser.firstName} {selectedUser.lastName}</p>
              <p className="text-xs text-text-muted font-mono">{selectedUser.phone} • {formatNaira(selectedUser.balance)}</p>
            </div>

            {(activeModal === 'fund' || activeModal === 'debit') && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-text-primary">Amount (₦)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountInput ? `₦${parseInt(amountInput.replace(/\D/g, '') || '0', 10).toLocaleString()}` : ''}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="₦0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                {activeModal === 'debit' && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-text-primary">Reason for Debit</label>
                    <input
                      type="text"
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      placeholder="e.g. Reversal adjustment"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                )}
              </div>
            )}

            {activeModal === 'ban' && (
              <p className="text-sm text-text-secondary">
                Are you sure you want to {selectedUser.isBanned ? 'unban' : 'ban'} this user? 
                {selectedUser.isBanned 
                  ? ' They will regain access to their account and wallet.' 
                  : ' They will be immediately locked out of their account.'}
              </p>
            )}

            <button
              onClick={executeAction}
              disabled={
                isProcessing ||
                ((activeModal === 'fund' || activeModal === 'debit') && parseInt(amountInput.replace(/\D/g, '') || '0', 10) <= 0) ||
                (activeModal === 'debit' && !reasonInput.trim())
              }
              className={`w-full font-bold rounded-xl py-3.5 flex items-center justify-center space-x-2 transition-colors
                ${activeModal === 'ban' && !selectedUser.isBanned 
                  ? 'bg-error text-white hover:bg-red-700 disabled:bg-red-300' 
                  : 'bg-brand text-white hover:bg-blue-800 disabled:bg-blue-300'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <Spinner size="sm" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm Action</span>
              )}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
