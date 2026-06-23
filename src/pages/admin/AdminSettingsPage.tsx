import React, { useState, useEffect } from 'react'
import {
  mockAdminGetSettings,
  mockAdminToggleMaintenance
} from '../../services/mock/mockServices'
import type { AdminSettings } from '../../types'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useUIStore()

  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Local state for UI toggles (since the mock only really fully supports maintenance mode)
  const [requirePin, setRequirePin] = useState(true)
  const [primaryDataProvider, setPrimaryDataProvider] = useState('provider_a')
  const [primaryAirtimeProvider, setPrimaryAirtimeProvider] = useState('provider_a')

  const fetchSettings = () => {
    setIsLoading(true)
    mockAdminGetSettings()
      .then(setSettings)
      .catch((err) => showToast(err.message || 'Failed to load settings', 'error'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleToggleMaintenance = async () => {
    if (!settings) return
    const nextState = !settings.maintenanceMode
    
    // Optimistic update
    setSettings({ ...settings, maintenanceMode: nextState })
    
    try {
      await mockAdminToggleMaintenance(nextState)
      showToast(nextState ? 'Maintenance mode enabled' : 'Maintenance mode disabled', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle maintenance mode', 'error')
      // Revert optimistic
      setSettings({ ...settings, maintenanceMode: !nextState })
    }
  }

  const handleSaveSimulated = (e: React.FormEvent) => {
    e.preventDefault()
    showToast('Settings saved successfully', 'success')
  }

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-text-muted font-medium">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-text-primary">System Settings</h2>
        <p className="text-sm text-text-muted mt-1">Configure global application behaviors and failovers.</p>
      </div>

      <div className="space-y-6">
        {/* Global Controls */}
        <section className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-lg text-text-primary">Global Controls</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-text-primary">Maintenance Mode</h4>
                <p className="text-sm text-text-muted mt-0.5">Locks out all users and displays a maintenance screen.</p>
              </div>
              <label className="flex items-center cursor-pointer shrink-0 ml-4">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={settings.maintenanceMode} 
                    onChange={handleToggleMaintenance} 
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-error' : 'bg-slate-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${settings.maintenanceMode ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </label>
            </div>

            <div className="h-px bg-slate-100"></div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-text-primary">Require PIN for Transactions</h4>
                <p className="text-sm text-text-muted mt-0.5">Prompt users to enter their transaction PIN before checkout.</p>
              </div>
              <label className="flex items-center cursor-pointer shrink-0 ml-4">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={requirePin} 
                    onChange={() => setRequirePin(!requirePin)} 
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${requirePin ? 'bg-brand' : 'bg-slate-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${requirePin ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* API Failover Switchboard */}
        <section className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-lg text-text-primary">API Failover Switchboard</h3>
          </div>
          <form onSubmit={handleSaveSimulated} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block font-bold text-text-primary">Primary Data Provider</label>
              <p className="text-sm text-text-muted">Select which aggregator processes data transactions.</p>
              <select
                value={primaryDataProvider}
                onChange={(e) => setPrimaryDataProvider(e.target.value)}
                className="w-full sm:max-w-md bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand mt-2"
              >
                <option value="provider_a">VTPass (Primary)</option>
                <option value="provider_b">Shago (Secondary)</option>
                <option value="provider_c">Clubkonnect (Backup)</option>
              </select>
            </div>

            <div className="h-px bg-slate-100"></div>

            <div className="space-y-2">
              <label className="block font-bold text-text-primary">Primary Airtime Provider</label>
              <p className="text-sm text-text-muted">Select which aggregator processes airtime transactions.</p>
              <select
                value={primaryAirtimeProvider}
                onChange={(e) => setPrimaryAirtimeProvider(e.target.value)}
                className="w-full sm:max-w-md bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand mt-2"
              >
                <option value="provider_a">VTPass (Primary)</option>
                <option value="provider_b">ReloadNG (Secondary)</option>
                <option value="provider_c">Shago (Backup)</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="bg-brand text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-800 transition-colors w-full sm:w-auto"
              >
                Save Switchboard Configurations
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
