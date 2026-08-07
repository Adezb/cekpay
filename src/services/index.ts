/**
 * CEKPay Service Abstraction Layer
 *
 * Central barrel file for all service functions. All components, hooks,
 * and stores import from this file.
 *
 * The `VITE_USE_MOCK` environment variable controls which implementation
 * is used:
 *   - `true`  → Mock in-memory services (default, for development/offline)
 *   - `false` → Live API services (Supabase Auth, PostgreSQL RLS & Deno Edge Functions)
 */

import * as mock from './mock/mockServices'
import * as api from './api/apiServices'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

// ── Auth Services ──
export const signup = useMock ? mock.mockSignup : api.apiSignup
export const sendPass = useMock ? mock.mockSendPass : api.apiSendPass
export const verifyPass = useMock ? mock.mockVerifyPass : api.apiVerifyPass
export const createPin = useMock ? mock.mockCreatePin : api.apiCreatePin
export const verifyPin = useMock ? mock.mockVerifyPin : api.apiVerifyPin
export const changePin = useMock ? mock.mockChangePin : api.apiChangePin
export const login = useMock ? mock.mockLogin : api.apiLogin
export const updateUserEmail = useMock ? mock.mockUpdateUserEmail : api.apiUpdateUserEmail

// ── Wallet / DVA Services ──
export const resolveBankAccount = useMock ? mock.mockResolveBankAccount : api.resolveBankAccount
export const createDVA = useMock ? mock.mockCreateDVA : api.apiCreateDVA
export const processWithdrawal = useMock ? mock.mockProcessWithdrawal : api.apiProcessWithdrawal

// ── Dashboard & Transactions Services ──
export const getDashboard = useMock ? mock.mockGetDashboard : api.apiGetDashboard
export const buyAirtime = useMock ? mock.mockBuyAirtime : api.apiBuyAirtime
export const buyData = useMock ? mock.mockBuyData : api.apiBuyData
export const payElectricity = useMock ? mock.mockPayElectricity : api.apiPayElectricity
export const payCable = useMock ? mock.mockPayCable : api.apiPayCable
export const getTransactions = useMock ? mock.mockGetTransactions : api.apiGetTransactions
export const getProductPrices = useMock ? mock.mockGetProductPrices : api.apiGetProductPrices

// ── Smart Contacts Services ──
export const addSmartContact = useMock ? mock.mockAddSmartContact : api.apiAddSmartContact
export const deleteSmartContact = useMock ? mock.mockDeleteSmartContact : api.apiDeleteSmartContact
export const updateSmartContact = useMock ? mock.mockUpdateSmartContact : api.apiUpdateSmartContact

// ── Admin Services ──
export const adminToggleAggregator = useMock ? mock.mockAdminToggleAggregator : api.adminToggleAggregator
export const adminCreateAnnouncement = useMock ? mock.mockAdminCreateAnnouncement : api.adminCreateAnnouncement
export const adminFundWallet = useMock ? mock.mockAdminFundWallet : api.adminFundWallet
export const adminDebitWallet = useMock ? mock.mockAdminDebitWallet : api.adminDebitWallet
export const adminBanUser = useMock ? mock.mockAdminBanUser : api.adminBanUser
export const adminUnbanUser = useMock ? mock.mockAdminUnbanUser : api.adminUnbanUser
export const adminGetDashboard = useMock ? mock.mockAdminGetDashboard : api.adminGetDashboard
export const adminGetUsers = useMock ? mock.mockAdminGetUsers : api.adminGetUsers
export const adminResetPin = useMock ? mock.mockAdminResetPin : api.adminResetPin
export const adminGetUserLedger = useMock ? mock.mockAdminGetUserLedger : api.adminGetUserLedger
export const adminGetSettings = useMock ? mock.mockAdminGetSettings : api.adminGetSettings
export const adminToggleMaintenance = useMock ? mock.mockAdminToggleMaintenance : api.adminToggleMaintenance
export const adminGetAnnouncements = useMock ? mock.mockAdminGetAnnouncements : api.adminGetAnnouncements
export const adminToggleAnnouncement = useMock ? mock.mockAdminToggleAnnouncement : api.adminToggleAnnouncement
export const adminGetPromos = useMock ? mock.mockAdminGetPromos : api.adminGetPromos
export const adminTogglePromo = useMock ? mock.mockAdminTogglePromo : api.adminTogglePromo
export const adminCreatePromo = useMock ? mock.mockAdminCreatePromo : api.adminCreatePromo
export const adminGetProductPrices = useMock ? mock.mockAdminGetProductPrices : api.adminGetProductPrices
export const adminToggleProduct = useMock ? mock.mockAdminToggleProduct : api.adminToggleProduct
export const adminUpdatePricing = useMock ? mock.mockAdminUpdatePricing : api.adminUpdatePricing

export const getMockDb = mock.getMockDb

export type { AdminUserView } from './mock/mockServices'
