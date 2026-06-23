import React from 'react'
import { useSmartContactsStore } from '../../stores/smartContactsStore'
import { useUIStore } from '../../stores/uiStore'

export const SmartContacts: React.FC = () => {
  const { contacts, canAddMore } = useSmartContactsStore()
  const { openModal } = useUIStore()

  const handleAddClick = () => {
    // Open manager in all cases to allow deletion if full
    openModal('smart-contacts-manager')
  }

  const handleContactClick = (contact: import('../../types').SmartContact) => {
    useUIStore.getState().setActiveSmartContact(contact)
    // Determine which modal to open based on provider type
    const telcos = ['MTN', 'Airtel', 'GLO', '9mobile']
    const discos = ['IKEDC', 'EKEDC', 'IBEDC', 'AEDC']
    const cables = ['DSTV', 'GOTV', 'Startimes', 'Showmax']
    
    if (telcos.includes(contact.providerType)) {
      openModal('airtime')
    } else if (discos.includes(contact.providerType)) {
      openModal('electricity')
    } else if (cables.includes(contact.providerType)) {
      openModal('cable-tv')
    } else {
      openModal('airtime')
    }
  }

  return (
    <div className="space-y-3 overflow-hidden">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-text-primary tracking-tight">Smart Contacts</h3>
        <span className="text-xs font-medium text-text-muted">{contacts.length}/10</span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {/* Contact List */}
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => handleContactClick(contact)}
            className="flex flex-col items-center space-y-1.5 min-w-[70px] active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 text-brand border border-blue-100 flex items-center justify-center font-bold text-xl shadow-sm">
              {contact.alias.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-text-primary font-medium truncate w-[70px] text-center">
              {contact.alias}
            </span>
          </button>
        ))}

        {/* Add New Button */}
        <button
          onClick={handleAddClick}
          className={`flex flex-col items-center space-y-1.5 min-w-[70px] transition-all
            ${canAddMore() 
              ? 'active:scale-95 hover:opacity-80' 
              : 'opacity-50 cursor-not-allowed'
            }
          `}
          title={!canAddMore() ? "Maximum 10 contacts reached" : "Add new contact"}
          aria-disabled={!canAddMore()}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border border-dashed
            ${canAddMore() 
              ? 'bg-slate-50 text-slate-500 border-slate-300' 
              : 'bg-slate-100 text-slate-400 border-slate-200'
            }
          `}>
            +
          </div>
          <span className="text-xs text-text-muted font-medium">Add New</span>
        </button>
      </div>
    </div>
  )
}
