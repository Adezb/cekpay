import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { useUIStore } from '../../stores/uiStore'
import { useSmartContactsStore } from '../../stores/smartContactsStore'
import { useAuthStore } from '../../stores/authStore'

const PROVIDER_TYPES = [
  'MTN', 'Airtel', 'GLO', '9mobile', 
  'IKEDC', 'EKEDC', 'IBEDC', 'AEDC',
  'DSTV', 'GOTV', 'Startimes', 'Showmax'
]

export const SmartContactsManager: React.FC = () => {
  const { isModalOpen, closeModal, showToast } = useUIStore()
  const { contacts, addContact, deleteContact, canAddMore } = useSmartContactsStore()
  const user = useAuthStore(state => state.user)

  // 'list' or 'add'
  const [view, setView] = useState<'list' | 'add'>('list')
  
  const [alias, setAlias] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [providerType, setProviderType] = useState(PROVIDER_TYPES[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isModalOpen('smart-contacts-manager')) {
      // If opened from "+" button directly, we might want to go to 'add' view, 
      // but 'list' is safer. Let's stick to list.
      setView('list')
      setAlias('')
      setIdentifier('')
      setProviderType(PROVIDER_TYPES[0])
    }
  }, [isModalOpen('smart-contacts-manager')])

  const handleClose = () => {
    closeModal('smart-contacts-manager')
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContact(id)
      showToast('Contact deleted', 'success')
    } catch (err) {
      // handled by store
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!canAddMore()) {
      showToast('Maximum contacts reached (10/10)', 'error')
      return
    }

    if (!alias.trim() || !identifier.trim()) {
      showToast('Please fill all fields', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await addContact({
        userId: user.id,
        alias: alias.trim(),
        identifier: identifier.trim(),
        providerType
      })
      showToast('Contact added successfully!', 'success')
      setView('list')
      setAlias('')
      setIdentifier('')
    } catch (err: any) {
      // Error toast is handled by the store
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isModalOpen('smart-contacts-manager')}
      onClose={handleClose}
      title={view === 'list' ? 'Smart Contacts' : 'Add Smart Contact'}
    >
      <div className="space-y-6">
        {view === 'list' ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex justify-between items-center text-sm font-semibold text-text-muted">
              <span>Saved Contacts</span>
              <span>{contacts.length}/10</span>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                You haven't saved any contacts yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {contacts.map(contact => (
                  <div key={contact.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-brand border border-blue-100 flex items-center justify-center font-bold text-lg">
                        {contact.alias.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-text-primary">{contact.alias}</p>
                        <p className="text-xs text-text-muted">{contact.providerType} • {contact.identifier}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Contact"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setView('add')}
              disabled={!canAddMore()}
              className="w-full bg-slate-100 text-brand font-bold rounded-xl py-4 mt-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add New Contact
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                Alias (e.g. Mom's Phone)
              </label>
              <input
                type="text"
                maxLength={20}
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Enter a short name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                Provider / Network
              </label>
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow appearance-none"
              >
                {PROVIDER_TYPES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">
                Phone / Meter / IUC Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter the number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setView('list')}
                disabled={isSubmitting}
                className="w-1/3 bg-slate-100 text-text-secondary font-bold rounded-xl py-4 active:scale-95 transition-transform"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!alias.trim() || !identifier.trim() || isSubmitting}
                className="w-2/3 bg-brand text-white font-bold rounded-xl py-4 flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span>Save Contact</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
