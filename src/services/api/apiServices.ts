/**
 * CEKPay Live API Service Layer — Phase 2B & 3 Security Audit
 *
 * Interacts with Supabase Auth, PostgreSQL tables, and Supabase Edge Functions.
 * Active when `VITE_USE_MOCK=false`.
 */

import { supabase } from '../../lib/supabase'
import type {
  User,
  Wallet,
  Transaction,
  SmartContact,
  ProductPrice,
  SignupRequest,
  AirtimeRequest,
  DataRequest,
  ElectricityRequest,
  CableRequest,
  Promo,
  Announcement,
  AdminSettings,
} from '../../types'

import { toMSISDN } from '../../utils/detectNetwork'

// ═══════════════════════════════════════════════════════════
//  AUTHENTICATION SERVICES (LIVE)
// ═══════════════════════════════════════════════════════════

export async function apiSignup(data: SignupRequest): Promise<User> {
  const msisdn = toMSISDN(data.phone)

  const { data: existingPhone } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', msisdn)
    .maybeSingle()

  if (existingPhone) {
    throw new Error('An account with this phone number already exists.')
  }

  const { data: existingEmail } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', data.email)
    .maybeSingle()

  if (existingEmail) {
    throw new Error('An account with this email address already exists.')
  }

  const secureRandomPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}`
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: secureRandomPassword,
    options: {
      data: {
        phone: msisdn,
        first_name: data.firstName,
        last_name: data.lastName,
      },
    },
  })

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create account. Please try again.')
  }

  return {
    id: authData.user.id,
    email: data.email,
    phone: msisdn,
    firstName: data.firstName,
    lastName: data.lastName,
    pinHash: '',
    role: 'user',
    isBanned: false,
  }
}

/**
 * Dispatches 6-char alphanumeric Pass via BulkSMSNigeria SMS & Resend Email.
 * Stores OTP in server-side `otp_codes` table.
 */
export async function apiSendPass(phone: string, email: string): Promise<{ success: boolean; message: string }> {
  const msisdn = toMSISDN(phone)

  const { data, error } = await supabase.functions.invoke('auth-otp-delivery', {
    body: { action: 'send', phone: msisdn, email },
  })

  if (error || !data?.success) {
    console.error('Edge Function auth-otp-delivery error:', error)
    throw new Error(error?.message || data?.error || 'Failed to deliver security Pass via SMS/Email. Please try again.')
  }

  return { success: true, message: data.message || 'Pass dispatched successfully.' }
}

/**
 * Verifies 6-char alphanumeric Pass via server-side Edge Function against `otp_codes` table.
 * Enforces 10-minute expiration, max 5 attempts counter, and server-side consumption.
 */
export async function apiVerifyPass(phone: string, pass: string): Promise<boolean> {
  const msisdn = toMSISDN(phone)

  const { data, error } = await supabase.functions.invoke('auth-otp-delivery', {
    body: { action: 'verify', phone: msisdn, pass: pass.trim().toUpperCase() },
  })

  if (error || !data) {
    throw new Error('Verification failed. Please try again.')
  }

  if (!data.valid && data.error) {
    throw new Error(data.error)
  }

  return Boolean(data.valid)
}

export async function apiCreatePin(userId: string, pin: string): Promise<Wallet> {
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileErr || !profile) {
    throw new Error('User profile not found.')
  }

  const { error: pinError } = await supabase.functions.invoke('set-user-pin', {
    body: { pin },
  })

  if (pinError) {
    throw new Error(pinError.message || 'Failed to create 4-digit PIN.')
  }

  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!wallet) {
    return { id: `wal_${userId.slice(0, 8)}`, userId, balance: 0.00 }
  }

  return {
    id: wallet.id,
    userId: wallet.user_id,
    balance: Number(wallet.balance),
    paystackCustomerCode: wallet.paystack_customer_code || undefined,
    accountNumber: wallet.dva_account_number || undefined,
    bankName: wallet.dva_bank_name || undefined,
    localWithdrawalBank: wallet.local_withdrawal_bank || undefined,
    localWithdrawalAccount: wallet.local_withdrawal_account || undefined,
  }
}

/**
 * Server-Side Session Minting Login:
 * Invokes `verify-pin` Edge Function which verifies the bcrypt PIN hash and returns a minted Supabase session.
 * The client then establishes the session using `supabase.auth.setSession()`.
 */
export async function apiLogin(phone: string, pin: string): Promise<User> {
  const msisdn = toMSISDN(phone)

  const { data: resData, error: pinErr } = await supabase.functions.invoke('verify-pin', {
    body: { phone: msisdn, pin },
  })

  if (pinErr || !resData?.valid || !resData?.session) {
    throw new Error(resData?.error || 'Incorrect 4-digit PIN or failed session creation.')
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: resData.session.access_token,
    refresh_token: resData.session.refresh_token,
  })

  if (sessionError) {
    console.warn('Set session warning:', sessionError.message)
    throw new Error(sessionError.message || 'Failed to set active authentication session.')
  }

  const u = resData.user || {}
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    firstName: u.firstName || u.first_name || '',
    lastName: u.lastName || u.last_name || '',
    pinHash: '',
    role: (u.role || 'user') as 'user' | 'admin',
    isBanned: Boolean(u.isBanned || u.is_banned),
  }
}

export async function apiVerifyPin(userId: string, pin: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('verify-pin', {
    body: { userId, pin },
  })
  return !error && Boolean(data?.valid)
}

export async function apiUpdateUserEmail(userId: string, newEmail: string): Promise<User> {
  const { error: authErr } = await supabase.auth.updateUser({ email: newEmail })
  if (authErr) throw new Error(authErr.message)

  const { data: profile, error: dbErr } = await supabase
    .from('profiles')
    .update({ email: newEmail })
    .eq('id', userId)
    .select()
    .single()

  if (dbErr || !profile) throw new Error(dbErr?.message || 'Failed to update profile email')

  return {
    id: profile.id,
    email: profile.email,
    phone: profile.phone,
    firstName: profile.first_name,
    lastName: profile.last_name,
    pinHash: '',
    role: profile.role as 'user' | 'admin',
    isBanned: profile.is_banned,
  }
}

// ═══════════════════════════════════════════════════════════
//  FINANCIAL SERVICES (LIVE EDGE FUNCTIONS & POSTGRES)
// ═══════════════════════════════════════════════════════════

export async function apiCreateDVA(
  _userId: string,
  bvn: string,
  localBankName: string,
  localAccountNumber: string
): Promise<Wallet> {
  const { data, error } = await supabase.functions.invoke('verify-kyc-and-create-dva', {
    body: { bvn, localBankName, localAccountNumber },
  })

  if (error || !data?.wallet) {
    throw new Error(error?.message || data?.error || 'KYC verification / DVA creation failed.')
  }

  return {
    id: data.wallet.id,
    userId: data.wallet.user_id,
    balance: Number(data.wallet.balance),
    paystackCustomerCode: data.wallet.paystack_customer_code || undefined,
    accountNumber: data.wallet.dva_account_number || undefined,
    bankName: data.wallet.dva_bank_name || undefined,
    localWithdrawalBank: data.wallet.local_withdrawal_bank || undefined,
    localWithdrawalAccount: data.wallet.local_withdrawal_account || undefined,
  }
}

export async function apiProcessWithdrawal(
  _userId: string,
  amount: number,
  pin: string,
  idempotencyKey?: string
): Promise<Transaction> {
  if (!pin || pin.trim() === '') {
    throw new Error('4-digit PIN is required.')
  }

  const { data, error } = await supabase.functions.invoke('process-withdrawal', {
    body: { amount, pin, idempotencyKey },
  })

  if (error || !data?.success) {
    throw new Error(error?.message || data?.error || 'Withdrawal processing failed.')
  }

  return {
    id: data.reference,
    userId: _userId,
    reference: data.reference,
    type: 'Debit',
    service: 'Withdrawal',
    amount,
    status: 'Success',
    paymentProcessor: 'Paystack',
    createdAt: new Date().toISOString(),
    planName: 'Wallet Payout',
  }
}

export async function apiBuyAirtime(req: AirtimeRequest, userId?: string, pin?: string): Promise<Transaction> {
  const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id || ''
  if (!targetUserId || targetUserId.trim() === '') {
    throw new Error('User authentication required.')
  }
  if (!pin || pin.trim() === '') {
    throw new Error('4-digit PIN is required to authorize Airtime purchase.')
  }

  const { data, error } = await supabase.functions.invoke('vtu-transaction-engine', {
    body: {
      userId: targetUserId,
      service: 'Airtime',
      amount: req.amount,
      recipient: req.phone,
      provider: req.network,
      pin: pin,
    },
  })

  if (error || !data?.success) {
    throw new Error(error?.message || data?.error || 'Airtime purchase failed.')
  }

  const txn = data.transaction
  return {
    id: txn.id || txn.reference,
    userId: txn.user_id,
    reference: txn.reference,
    type: txn.type,
    service: txn.service,
    amount: Number(txn.amount),
    status: txn.status,
    aggregatorUsed: txn.aggregator_used,
    recipient: txn.recipient,
    provider: txn.provider,
    planName: txn.plan_name,
    createdAt: txn.created_at || new Date().toISOString(),
  }
}

export async function apiBuyData(req: DataRequest & { amount?: number }, userId?: string, pin?: string): Promise<Transaction> {
  const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id || ''
  if (!targetUserId || targetUserId.trim() === '') {
    throw new Error('User authentication required.')
  }
  if (!pin || pin.trim() === '') {
    throw new Error('4-digit PIN is required to authorize Data purchase.')
  }

  const { data: priceRecord, error: priceErr } = await supabase
    .from('product_prices')
    .select('plan_name, retail_price')
    .eq('service', 'Data')
    .or(`id.eq.${req.planId},plan_name.eq.${req.planId}`)
    .maybeSingle()

  if (priceErr || !priceRecord || priceRecord.retail_price === undefined || priceRecord.retail_price === null) {
    throw new Error(priceErr?.message || 'Selected Data plan pricing unavailable.')
  }

  const finalAmount = Number(priceRecord.retail_price)
  const canonicalPlanName = priceRecord.plan_name

  const { data, error } = await supabase.functions.invoke('vtu-transaction-engine', {
    body: {
      userId: targetUserId,
      service: 'Data',
      amount: finalAmount,
      recipient: req.phone,
      provider: req.network,
      planName: canonicalPlanName,
      pin: pin,
    },
  })

  if (error || !data?.success) {
    throw new Error(error?.message || data?.error || 'Data purchase failed.')
  }

  const txn = data.transaction
  return {
    id: txn.id || txn.reference,
    userId: txn.user_id,
    reference: txn.reference,
    type: txn.type,
    service: txn.service,
    amount: Number(txn.amount),
    status: txn.status,
    aggregatorUsed: txn.aggregator_used,
    recipient: txn.recipient,
    provider: txn.provider,
    planName: txn.plan_name,
    createdAt: txn.created_at || new Date().toISOString(),
  }
}

export async function apiPayElectricity(req: ElectricityRequest, userId?: string, pin?: string): Promise<Transaction> {
  const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id || ''
  if (!targetUserId || targetUserId.trim() === '') {
    throw new Error('User authentication required.')
  }
  if (!pin || pin.trim() === '') {
    throw new Error('4-digit PIN is required to authorize Electricity payment.')
  }

  const { data, error } = await supabase.functions.invoke('vtu-transaction-engine', {
    body: {
      userId: targetUserId,
      service: 'Electricity',
      amount: req.amount,
      recipient: req.meterNumber,
      provider: req.disco,
      pin: pin,
    },
  })

  if (error || !data?.success) {
    throw new Error(error?.message || data?.error || 'Electricity payment failed.')
  }

  const txn = data.transaction
  return {
    id: txn.id || txn.reference,
    userId: txn.user_id,
    reference: txn.reference,
    type: txn.type,
    service: txn.service,
    amount: Number(txn.amount),
    status: txn.status,
    aggregatorUsed: txn.aggregator_used,
    recipient: txn.recipient,
    provider: txn.provider,
    planName: txn.plan_name,
    createdAt: txn.created_at || new Date().toISOString(),
  }
}

export async function apiPayCable(req: CableRequest & { amount?: number }, userId?: string, pin?: string): Promise<Transaction> {
  const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id || ''
  if (!targetUserId || targetUserId.trim() === '') {
    throw new Error('User authentication required.')
  }
  if (!pin || pin.trim() === '') {
    throw new Error('4-digit PIN is required to authorize Cable TV payment.')
  }

  const { data: priceRecord, error: priceErr } = await supabase
    .from('product_prices')
    .select('plan_name, retail_price')
    .eq('service', 'Cable')
    .or(`id.eq.${req.planId},plan_name.eq.${req.planId}`)
    .maybeSingle()

  if (priceErr || !priceRecord || priceRecord.retail_price === undefined || priceRecord.retail_price === null) {
    throw new Error(priceErr?.message || 'Selected Cable plan pricing unavailable.')
  }

  const finalAmount = Number(priceRecord.retail_price)
  const canonicalPlanName = priceRecord.plan_name

  const { data, error } = await supabase.functions.invoke('vtu-transaction-engine', {
    body: {
      userId: targetUserId,
      service: 'Cable',
      amount: finalAmount,
      recipient: req.iucNumber,
      provider: req.provider,
      planName: canonicalPlanName,
      pin: pin,
    },
  })

  if (error || !data?.success) {
    throw new Error(error?.message || data?.error || 'Cable TV payment failed.')
  }

  const txn = data.transaction
  return {
    id: txn.id || txn.reference,
    userId: txn.user_id,
    reference: txn.reference,
    type: txn.type,
    service: txn.service,
    amount: Number(txn.amount),
    status: txn.status,
    aggregatorUsed: txn.aggregator_used,
    recipient: txn.recipient,
    provider: txn.provider,
    planName: txn.plan_name,
    createdAt: txn.created_at || new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════
//  DASHBOARD & TRANSACTIONS SERVICES (LIVE)
// ═══════════════════════════════════════════════════════════

export async function apiGetDashboard(userId: string) {
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).single()
  const { data: txns } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
  const { data: contacts } = await supabase.from('smart_contacts').select('*').eq('user_id', userId)
  const { data: ann } = await supabase.from('announcements').select('*').eq('is_active', true)

  return {
    wallet: wallet ? {
      id: wallet.id,
      userId: wallet.user_id,
      balance: Number(wallet.balance),
      paystackCustomerCode: wallet.paystack_customer_code || undefined,
      accountNumber: wallet.dva_account_number || undefined,
      bankName: wallet.dva_bank_name || undefined,
      localWithdrawalBank: wallet.local_withdrawal_bank || undefined,
      localWithdrawalAccount: wallet.local_withdrawal_account || undefined,
    } : { id: '', userId, balance: 0 },
    transactions: (txns || []).map(t => ({
      id: t.id,
      userId: t.user_id,
      reference: t.reference,
      type: t.type as any,
      service: t.service as any,
      amount: Number(t.amount),
      status: t.status as any,
      aggregatorUsed: t.aggregator_used as any,
      paymentProcessor: t.payment_processor as any,
      recipient: t.recipient || undefined,
      provider: t.provider || undefined,
      planName: t.plan_name || undefined,
      createdAt: t.created_at,
    })),
    smartContacts: (contacts || []).map(c => ({
      id: c.id,
      userId: c.user_id,
      alias: c.alias,
      identifier: c.identifier,
      providerType: c.provider_type,
    })),
    announcements: (ann || []).map(a => ({
      id: a.id,
      message: a.message,
      isActive: a.is_active,
      type: a.type as any,
    })),
  }
}

export async function apiGetTransactions(userId: string): Promise<Transaction[]> {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (data || []).map(t => ({
    id: t.id,
    userId: t.user_id,
    reference: t.reference,
    type: t.type as any,
    service: t.service as any,
    amount: Number(t.amount),
    status: t.status as any,
    aggregatorUsed: t.aggregator_used as any,
    paymentProcessor: t.payment_processor as any,
    recipient: t.recipient || undefined,
    provider: t.provider || undefined,
    planName: t.plan_name || undefined,
    createdAt: t.created_at,
  }))
}

export async function apiGetProductPrices(): Promise<ProductPrice[]> {
  const { data } = await supabase.from('product_prices').select('*').eq('is_active', true)
  return (data || []).map(p => ({
    id: p.id,
    service: p.service as any,
    planName: p.plan_name,
    network: p.network || undefined,
    provider: p.provider || undefined,
    aggregatorCostPrice: Number(p.aggregator_cost_price),
    retailPrice: Number(p.retail_price),
    isActive: p.is_active,
  }))
}

// ═══════════════════════════════════════════════════════════
//  SMART CONTACTS SERVICES (LIVE - MAX 10 TRIGGER ENFORCED)
// ═══════════════════════════════════════════════════════════

export async function apiAddSmartContact(contact: Omit<SmartContact, 'id'>): Promise<SmartContact> {
  const { data, error } = await supabase
    .from('smart_contacts')
    .insert({
      user_id: contact.userId,
      alias: contact.alias,
      identifier: contact.identifier,
      provider_type: contact.providerType,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to add smart contact.')
  }

  return {
    id: data.id,
    userId: data.user_id,
    alias: data.alias,
    identifier: data.identifier,
    providerType: data.provider_type,
  }
}

export async function apiDeleteSmartContact(contactId: string): Promise<void> {
  const { error } = await supabase.from('smart_contacts').delete().eq('id', contactId)
  if (error) throw new Error(error.message)
}

export async function apiUpdateSmartContact(contactId: string, updates: Partial<SmartContact>): Promise<SmartContact> {
  const { data, error } = await supabase
    .from('smart_contacts')
    .update({
      alias: updates.alias,
      identifier: updates.identifier,
      provider_type: updates.providerType,
    })
    .eq('id', contactId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update smart contact.')
  }

  return {
    id: data.id,
    userId: data.user_id,
    alias: data.alias,
    identifier: data.identifier,
    providerType: data.provider_type,
  }
}

// ═══════════════════════════════════════════════════════════
//  ADMIN SERVICES (LIVE - STRICT GUARDRAIL ENFORCEMENT)
// ═══════════════════════════════════════════════════════════


export async function adminBanUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', userId)
  if (error) throw new Error(error.message || 'Failed to ban user.')
}

export async function adminUnbanUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_banned: false }).eq('id', userId)
  if (error) throw new Error(error.message || 'Failed to unban user.')
}

export async function adminToggleMaintenance(enabled: boolean): Promise<boolean> {
  const { error } = await supabase.from('admin_settings').update({ maintenance_mode: enabled }).eq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw new Error(error.message || 'Failed to update maintenance mode.')
  return enabled
}

export async function adminToggleAggregator(primary: 'Toppa' | 'CheapDataHub', secondary: 'Toppa' | 'CheapDataHub'): Promise<void> {
  const { error } = await supabase.from('admin_settings').update({ primary_data_api: primary, secondary_data_api: secondary }).eq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw new Error(error.message || 'Failed to update aggregator configuration.')
}

// Live guardrails for mutating admin operations and mock endpoints without dedicated edge functions
const LIVE_ADMIN_UNAVAILABLE_MSG = 'Live Administrator mutation endpoint is locked in production mode to prevent unauthorized database overrides.'

export async function resolveBankAccount(_bankName: string, _accountNumber: string): Promise<{ accountName: string }> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminFundWallet(_userId: string, _amount: number, _reason: string): Promise<void> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminDebitWallet(_userId: string, _amount: number, _reason: string): Promise<void> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminResetPin(_userId: string): Promise<void> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminUpdatePricing(_updates: { id: string; retailPrice: number }[]): Promise<void> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminCreateAnnouncement(_message: string, _type: 'Info' | 'Warning' | 'Promo'): Promise<void> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminToggleAnnouncement(_announcementId: string, _isActive: boolean): Promise<void> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminCreatePromo(_data: Omit<Promo, 'id' | 'isActive'>): Promise<Promo> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminTogglePromo(_promoId: string, _isActive: boolean): Promise<void> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminToggleProduct(_priceId: string, _isActive: boolean): Promise<void> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminGetDashboard(): Promise<{
  usersCount: number
  transactionsCount: number
  revenueToday: number
  activeAnnouncementsCount: number
  recentTransactions: Transaction[]
}> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminGetUsers(): Promise<(User & { balance: number; joinedDate: string })[]> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminGetUserLedger(_userId: string): Promise<{
  user: User
  wallet: Wallet | null
  transactions: Transaction[]
}> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminGetSettings(): Promise<AdminSettings> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminGetAnnouncements(): Promise<Announcement[]> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminGetPromos(): Promise<Promo[]> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}

export async function adminGetProductPrices(): Promise<ProductPrice[]> {
  throw new Error(LIVE_ADMIN_UNAVAILABLE_MSG)
}
