# UI Registry (CEKPay)

This registry catalogs the UI patterns extracted from the Phase 1 components. All future components must strictly adhere to these patterns to maintain UI consistency.

## 1. Modals & Forms
- **Input Fields & Dropdowns:** `w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all`
- **Read-Only Data Box (e.g., KYC Vetting):** `bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100`
- **Form Labels:** `text-sm font-medium text-slate-700`
- **Consent Checkboxes:** `w-4 h-4 text-brand bg-slate-100 border-slate-300 rounded focus:ring-brand focus:ring-2`
- **Checkbox Labels:** `text-xs text-slate-600 leading-snug`

## 2. Wallet Card
- **Card Container:** `relative overflow-hidden bg-gradient-to-r from-brand to-blue-700 text-white rounded-2xl p-5 sm:p-6 shadow-md`
- **Glassmorphism Overlay:** `absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none`
- **Action Buttons (Primary/Create):** `bg-white text-brand font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors`
- **Action Buttons (Secondary/Withdraw):** `bg-white/20 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:bg-white/30 transition-colors`

## 3. General Typography
- **Primary Headers:** `text-2xl font-bold text-slate-900 tracking-tight`
- **Sub-headers / Body Text:** `text-sm text-slate-600`
- **Error Text:** `text-sm text-red-500`

## 4. Admin & Ledger Panels
- **Ledger/Transaction Row:** `flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm`
- **Status Badges (Success):** `text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-100 text-green-700`
- **Status Badges (Failed):** `text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700`

## 5. Security & Disclaimers
- **Security Disclaimer Box:** `bg-blue-50 border border-blue-100 rounded-xl p-3 flex space-x-3`
- **Disclaimer Text:** `text-xs text-brand font-medium`

## 6. Slide-Sheets & Expandable Sections
- **Expanded Glassmorphism Panel (e.g. Wallet DVA):** `mt-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 relative animate-in slide-in-from-top-2`

## 7. Form Inputs
- **Disabled/Read-Only Input:** `w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed`
