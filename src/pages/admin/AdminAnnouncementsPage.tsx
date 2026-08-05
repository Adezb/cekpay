import React, { useState, useEffect } from 'react'
import {
  adminGetAnnouncements as mockAdminGetAnnouncements,
  adminCreateAnnouncement as mockAdminCreateAnnouncement,
  adminToggleAnnouncement as mockAdminToggleAnnouncement
} from '../../services'
import type { Announcement, AnnouncementType } from '../../types'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'

export const AdminAnnouncementsPage: React.FC = () => {
  const { showToast } = useUIStore()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [message, setMessage] = useState('')
  const [type, setType] = useState<AnnouncementType>('Info')

  const fetchAnnouncements = () => {
    setIsLoading(true)
    mockAdminGetAnnouncements()
      .then((data) => {
        // Sort by id roughly gives chronological since our ids start with a prefix and timestamp
        setAnnouncements(data.sort((a, b) => b.id.localeCompare(a.id)))
      })
      .catch((err) => showToast(err.message || 'Failed to load announcements', 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleToggle = async (announcement: Announcement) => {
    try {
      await mockAdminToggleAnnouncement(announcement.id, !announcement.isActive)
      showToast('Announcement status updated', 'success')
      fetchAnnouncements()
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    try {
      await mockAdminCreateAnnouncement(message.trim(), type)
      showToast('Announcement created', 'success')
      setIsModalOpen(false)
      setMessage('')
      setType('Info')
      fetchAnnouncements()
    } catch (err: any) {
      showToast(err.message || 'Failed to create announcement', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeColor = (type: AnnouncementType) => {
    switch (type) {
      case 'Info': return 'bg-blue-100 text-blue-800'
      case 'Promo': return 'bg-purple-100 text-purple-800'
      case 'Warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-text-primary">System Announcements</h2>
          <p className="text-sm text-text-muted mt-1">Manage global marquee messages and alerts.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Spinner size="lg" />
            <span className="text-sm text-text-muted mt-4 font-medium">Loading announcements...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${getTypeColor(ann.type)}`}>
                      {ann.type}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      ann.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ann.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary font-medium">{ann.message}</p>
                </div>
                
                <div className="flex items-center shrink-0">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={ann.isActive} 
                        onChange={() => handleToggle(ann)} 
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${ann.isActive ? 'bg-brand' : 'bg-slate-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${ann.isActive ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-semibold text-text-muted">
                      {ann.isActive ? 'Turn Off' : 'Turn On'}
                    </div>
                  </label>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="p-8 text-center text-text-muted font-medium">
                No announcements found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Announcement">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-text-primary">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter announcement message..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-text-primary">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AnnouncementType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="Info">Info (Blue)</option>
              <option value="Promo">Promo (Purple)</option>
              <option value="Warning">Warning (Yellow)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isSubmitting}
            className="w-full bg-brand text-white font-bold rounded-xl py-3.5 flex items-center justify-center space-x-2 transition-colors hover:bg-blue-800 disabled:bg-blue-300"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Publish Announcement</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  )
}
