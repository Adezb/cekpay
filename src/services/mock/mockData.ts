/**
 * CEKPay Mock Data — Phase 4.1
 *
 * Seed data for the entire mock service layer. All data conforms to
 * the types defined in `src/types/index.ts`.
 *
 * Pricing is based on realistic Nigerian VTU market rates (mid-2026).
 * aggregatorCostPrice = what CEK TOP VENTURES pays the aggregator.
 * retailPrice          = what the consumer pays in-app.
 * Margin               = retailPrice − aggregatorCostPrice.
 */

import type {
  User,
  Wallet,
  Transaction,
  Announcement,
  SmartContact,
  ProductPrice,
  AdminSettings,
  Promo,
} from '../../types'

// ─── Helpers ──────────────────────────────────────────────

/** Deterministic ISO timestamps for seed data (June 2026, descending). */
const ts = (daysAgo: number, hour = 10, minute = 30) => {
  const d = new Date(2026, 5, 22, hour, minute, 0)   // June 22, 2026
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

// ─── Users ────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'usr_demo_001',
    email: 'demo@cekpay.com',
    phone: '2348012345678',
    firstName: 'Tunde',
    lastName: 'Adebayo',
    pinHash: '1234',            // plaintext for mock — hashed in production
    role: 'user',
    isBanned: false,
  },
  {
    id: 'usr_admin_001',
    email: 'admin@cekpay.com',
    phone: '2348099999999',
    firstName: 'Admin',
    lastName: 'CEKPay',
    pinHash: '0000',
    role: 'admin',
    isBanned: false,
  },
]

/** Shortcut: the primary demo user. */
export const DEMO_USER = MOCK_USERS[0]

// ─── Wallets ──────────────────────────────────────────────

export const MOCK_WALLETS: Wallet[] = [
  {
    id: 'wal_001',
    userId: 'usr_demo_001',
    balance: 5000,
    paystackCustomerCode: 'CUS_mock_abc123',
    accountNumber: '8012345678',  // DVA derived from MSISDN (last 10 digits)
    bankName: 'Wema Bank',
  },
  {
    id: 'wal_002',
    userId: 'usr_admin_001',
    balance: 250_000,
    paystackCustomerCode: 'CUS_mock_admin_001',
    accountNumber: '8099999999',  // DVA derived from MSISDN (last 10 digits)
    bankName: 'Wema Bank',
  },
]

// ─── Transactions ─────────────────────────────────────────

export const MOCK_TRANSACTIONS: Transaction[] = [
  // ── Airtime ──
  {
    id: 'txn_001',
    userId: 'usr_demo_001',
    reference: 'CEK-AIR-20260622-001',
    type: 'Debit',
    service: 'Airtime',
    amount: 500,
    status: 'Success',
    aggregatorUsed: 'Toppa',
    createdAt: ts(0, 14, 12),
    recipient: '08012345678',
    provider: 'MTN',
  },
  {
    id: 'txn_002',
    userId: 'usr_demo_001',
    reference: 'CEK-AIR-20260621-002',
    type: 'Debit',
    service: 'Airtime',
    amount: 200,
    status: 'Failed',
    aggregatorUsed: 'CheapDataHub',
    createdAt: ts(1, 9, 45),
    recipient: '08098765432',
    provider: 'Airtel',
  },

  // ── Data ──
  {
    id: 'txn_003',
    userId: 'usr_demo_001',
    reference: 'CEK-DAT-20260620-003',
    type: 'Debit',
    service: 'Data',
    amount: 1200,
    status: 'Success',
    aggregatorUsed: 'Toppa',
    createdAt: ts(2, 11, 30),
    recipient: '08012345678',
    provider: 'MTN',
    planName: '1.5GB — 30 Days',
  },
  {
    id: 'txn_004',
    userId: 'usr_demo_001',
    reference: 'CEK-DAT-20260618-004',
    type: 'Debit',
    service: 'Data',
    amount: 300,
    status: 'Reversed',
    aggregatorUsed: 'CheapDataHub',
    createdAt: ts(4, 16, 0),
    recipient: '07033344455',
    provider: 'Glo',
    planName: '500MB — 14 Days',
  },

  // ── Electricity ──
  {
    id: 'txn_005',
    userId: 'usr_demo_001',
    reference: 'CEK-ELE-20260619-005',
    type: 'Debit',
    service: 'Electricity',
    amount: 5000,
    status: 'Success',
    aggregatorUsed: 'CheapDataHub',
    createdAt: ts(3, 8, 15),
    recipient: '45678901234',
    provider: 'IKEDC',
  },
  {
    id: 'txn_006',
    userId: 'usr_demo_001',
    reference: 'CEK-ELE-20260616-006',
    type: 'Debit',
    service: 'Electricity',
    amount: 3000,
    status: 'Failed',
    aggregatorUsed: 'Toppa',
    createdAt: ts(6, 19, 50),
    recipient: '98765432100',
    provider: 'EKEDC',
  },

  // ── Cable ──
  {
    id: 'txn_007',
    userId: 'usr_demo_001',
    reference: 'CEK-CAB-20260617-007',
    type: 'Debit',
    service: 'Cable',
    amount: 21000,
    status: 'Success',
    aggregatorUsed: 'CheapDataHub',
    createdAt: ts(5, 7, 0),
    recipient: '1234567890',
    provider: 'DSTV',
    planName: 'DStv Premium',
  },
  {
    id: 'txn_008',
    userId: 'usr_demo_001',
    reference: 'CEK-CAB-20260615-008',
    type: 'Debit',
    service: 'Cable',
    amount: 4850,
    status: 'Success',
    aggregatorUsed: 'Toppa',
    createdAt: ts(7, 12, 30),
    recipient: '0987654321',
    provider: 'GOtv',
    planName: 'GOtv Max',
  },

  // ── Funding (Wallet top-up) ──
  {
    id: 'txn_009',
    userId: 'usr_demo_001',
    reference: 'CEK-FND-20260622-009',
    type: 'Credit',
    service: 'Funding',
    amount: 10000,
    status: 'Success',
    paymentProcessor: 'Paystack',
    createdAt: ts(0, 8, 0),
  },
  {
    id: 'txn_010',
    userId: 'usr_demo_001',
    reference: 'CEK-FND-20260614-010',
    type: 'Credit',
    service: 'Funding',
    amount: 5000,
    status: 'Success',
    paymentProcessor: 'Paystack',
    createdAt: ts(8, 10, 45),
  },

  // ── Extra transactions for pagination / history feel ──
  {
    id: 'txn_011',
    userId: 'usr_demo_001',
    reference: 'CEK-AIR-20260613-011',
    type: 'Debit',
    service: 'Airtime',
    amount: 1000,
    status: 'Success',
    aggregatorUsed: 'Toppa',
    createdAt: ts(9, 15, 20),
    recipient: '09011122233',
    provider: '9mobile',
  },
  {
    id: 'txn_012',
    userId: 'usr_demo_001',
    reference: 'CEK-DAT-20260612-012',
    type: 'Debit',
    service: 'Data',
    amount: 5000,
    status: 'Success',
    aggregatorUsed: 'CheapDataHub',
    createdAt: ts(10, 13, 10),
    recipient: '08012345678',
    provider: 'MTN',
    planName: '6GB — 30 Days',
  },
]

// ─── Product Prices ───────────────────────────────────────

/**
 * Airtime plans — direct-value denomination.
 * Aggregator cost is typically 97% of face value (3% agent discount).
 * Retail price = face value.
 */
export const MOCK_AIRTIME_PRICES: ProductPrice[] = [
  // MTN
  { id: 'air_mtn_100', service: 'Airtime', planName: '₦100 Airtime', network: 'MTN', aggregatorCostPrice: 97, retailPrice: 100, isActive: true },
  { id: 'air_mtn_200', service: 'Airtime', planName: '₦200 Airtime', network: 'MTN', aggregatorCostPrice: 194, retailPrice: 200, isActive: true },
  { id: 'air_mtn_500', service: 'Airtime', planName: '₦500 Airtime', network: 'MTN', aggregatorCostPrice: 485, retailPrice: 500, isActive: true },
  { id: 'air_mtn_1000', service: 'Airtime', planName: '₦1,000 Airtime', network: 'MTN', aggregatorCostPrice: 970, retailPrice: 1000, isActive: true },
  { id: 'air_mtn_2000', service: 'Airtime', planName: '₦2,000 Airtime', network: 'MTN', aggregatorCostPrice: 1940, retailPrice: 2000, isActive: true },

  // Airtel
  { id: 'air_airtel_100', service: 'Airtime', planName: '₦100 Airtime', network: 'Airtel', aggregatorCostPrice: 97, retailPrice: 100, isActive: true },
  { id: 'air_airtel_200', service: 'Airtime', planName: '₦200 Airtime', network: 'Airtel', aggregatorCostPrice: 194, retailPrice: 200, isActive: true },
  { id: 'air_airtel_500', service: 'Airtime', planName: '₦500 Airtime', network: 'Airtel', aggregatorCostPrice: 485, retailPrice: 500, isActive: true },
  { id: 'air_airtel_1000', service: 'Airtime', planName: '₦1,000 Airtime', network: 'Airtel', aggregatorCostPrice: 970, retailPrice: 1000, isActive: true },

  // Glo
  { id: 'air_glo_100', service: 'Airtime', planName: '₦100 Airtime', network: 'Glo', aggregatorCostPrice: 97, retailPrice: 100, isActive: true },
  { id: 'air_glo_200', service: 'Airtime', planName: '₦200 Airtime', network: 'Glo', aggregatorCostPrice: 194, retailPrice: 200, isActive: true },
  { id: 'air_glo_500', service: 'Airtime', planName: '₦500 Airtime', network: 'Glo', aggregatorCostPrice: 485, retailPrice: 500, isActive: true },
  { id: 'air_glo_1000', service: 'Airtime', planName: '₦1,000 Airtime', network: 'Glo', aggregatorCostPrice: 970, retailPrice: 1000, isActive: true },

  // 9mobile
  { id: 'air_9mob_100', service: 'Airtime', planName: '₦100 Airtime', network: '9mobile', aggregatorCostPrice: 97, retailPrice: 100, isActive: true },
  { id: 'air_9mob_200', service: 'Airtime', planName: '₦200 Airtime', network: '9mobile', aggregatorCostPrice: 194, retailPrice: 200, isActive: true },
  { id: 'air_9mob_500', service: 'Airtime', planName: '₦500 Airtime', network: '9mobile', aggregatorCostPrice: 485, retailPrice: 500, isActive: true },
  { id: 'air_9mob_1000', service: 'Airtime', planName: '₦1,000 Airtime', network: '9mobile', aggregatorCostPrice: 970, retailPrice: 1000, isActive: true },
]

/**
 * Data plans — SME & Gifting bundles.
 * Aggregator cost reflects bulk-buy rates; retail is the consumer price.
 */
export const MOCK_DATA_PRICES: ProductPrice[] = [
  // MTN
  { id: 'dat_mtn_500m', service: 'Data', planName: '500MB — 30 Days', network: 'MTN', aggregatorCostPrice: 130, retailPrice: 150, isActive: true },
  { id: 'dat_mtn_1g', service: 'Data', planName: '1GB — 30 Days', network: 'MTN', aggregatorCostPrice: 250, retailPrice: 300, isActive: true },
  { id: 'dat_mtn_1_5g', service: 'Data', planName: '1.5GB — 30 Days', network: 'MTN', aggregatorCostPrice: 380, retailPrice: 450, isActive: true },
  { id: 'dat_mtn_2g', service: 'Data', planName: '2GB — 30 Days', network: 'MTN', aggregatorCostPrice: 500, retailPrice: 600, isActive: true },
  { id: 'dat_mtn_3g', service: 'Data', planName: '3GB — 30 Days', network: 'MTN', aggregatorCostPrice: 740, retailPrice: 900, isActive: true },
  { id: 'dat_mtn_5g', service: 'Data', planName: '5GB — 30 Days', network: 'MTN', aggregatorCostPrice: 1200, retailPrice: 1500, isActive: true },
  { id: 'dat_mtn_10g', service: 'Data', planName: '10GB — 30 Days', network: 'MTN', aggregatorCostPrice: 2400, retailPrice: 3000, isActive: true },

  // Airtel
  { id: 'dat_airtel_500m', service: 'Data', planName: '500MB — 30 Days', network: 'Airtel', aggregatorCostPrice: 130, retailPrice: 150, isActive: true },
  { id: 'dat_airtel_1g', service: 'Data', planName: '1GB — 30 Days', network: 'Airtel', aggregatorCostPrice: 250, retailPrice: 300, isActive: true },
  { id: 'dat_airtel_2g', service: 'Data', planName: '2GB — 30 Days', network: 'Airtel', aggregatorCostPrice: 500, retailPrice: 600, isActive: true },
  { id: 'dat_airtel_5g', service: 'Data', planName: '5GB — 30 Days', network: 'Airtel', aggregatorCostPrice: 1200, retailPrice: 1500, isActive: true },
  { id: 'dat_airtel_10g', service: 'Data', planName: '10GB — 30 Days', network: 'Airtel', aggregatorCostPrice: 2400, retailPrice: 3000, isActive: true },

  // Glo
  { id: 'dat_glo_500m', service: 'Data', planName: '500MB — 14 Days', network: 'Glo', aggregatorCostPrice: 120, retailPrice: 150, isActive: true },
  { id: 'dat_glo_1g', service: 'Data', planName: '1GB — 30 Days', network: 'Glo', aggregatorCostPrice: 230, retailPrice: 300, isActive: true },
  { id: 'dat_glo_2g', service: 'Data', planName: '2GB — 30 Days', network: 'Glo', aggregatorCostPrice: 480, retailPrice: 600, isActive: true },
  { id: 'dat_glo_5g', service: 'Data', planName: '5GB — 30 Days', network: 'Glo', aggregatorCostPrice: 1150, retailPrice: 1500, isActive: true },

  // 9mobile
  { id: 'dat_9mob_500m', service: 'Data', planName: '500MB — 30 Days', network: '9mobile', aggregatorCostPrice: 120, retailPrice: 150, isActive: true },
  { id: 'dat_9mob_1g', service: 'Data', planName: '1GB — 30 Days', network: '9mobile', aggregatorCostPrice: 230, retailPrice: 300, isActive: true },
  { id: 'dat_9mob_2g', service: 'Data', planName: '2GB — 30 Days', network: '9mobile', aggregatorCostPrice: 480, retailPrice: 600, isActive: true },
  { id: 'dat_9mob_5g', service: 'Data', planName: '5GB — 30 Days', network: '9mobile', aggregatorCostPrice: 1100, retailPrice: 1500, isActive: true },
]

/**
 * Electricity discos — prepaid token purchase.
 * These are "pass-through" products: the amount the user pays is the
 * exact value loaded onto the meter. CEKPay charges a flat ₦100 fee.
 *
 * For mock purposes, we store denomination tiers. In production,
 * the user enters any custom amount.
 */
export const MOCK_ELECTRICITY_DISCOS = [
  'IKEDC',    // Ikeja Electric
  'EKEDC',    // Eko Electric
  'AEDC',     // Abuja Electric
  'PHEDC',    // Port Harcourt Electric
  'KEDCO',    // Kano Electric
  'BEDC',     // Benin Electric
  'IBEDC',    // Ibadan Electric
  'JEDC',     // Jos Electric
  'KAEDCO',   // Kaduna Electric
] as const

export const MOCK_ELECTRICITY_PRICES: ProductPrice[] = [
  { id: 'ele_1000', service: 'Electricity', planName: '₦1,000 Prepaid Token', provider: 'IKEDC', aggregatorCostPrice: 1000, retailPrice: 1100, isActive: true },
  { id: 'ele_2000', service: 'Electricity', planName: '₦2,000 Prepaid Token', provider: 'IKEDC', aggregatorCostPrice: 2000, retailPrice: 2100, isActive: true },
  { id: 'ele_3000', service: 'Electricity', planName: '₦3,000 Prepaid Token', provider: 'IKEDC', aggregatorCostPrice: 3000, retailPrice: 3100, isActive: true },
  { id: 'ele_5000', service: 'Electricity', planName: '₦5,000 Prepaid Token', provider: 'IKEDC', aggregatorCostPrice: 5000, retailPrice: 5100, isActive: true },
  { id: 'ele_10000', service: 'Electricity', planName: '₦10,000 Prepaid Token', provider: 'IKEDC', aggregatorCostPrice: 10000, retailPrice: 10100, isActive: true },
  { id: 'ele_20000', service: 'Electricity', planName: '₦20,000 Prepaid Token', provider: 'IKEDC', aggregatorCostPrice: 20000, retailPrice: 20100, isActive: true },
]

/**
 * Cable TV packages — DSTV, GOtv, Startimes.
 * Priced as fixed monthly subscription tiers.
 */
export const MOCK_CABLE_PRICES: ProductPrice[] = [
  // DStv
  { id: 'cab_dstv_padi', service: 'Cable', planName: 'DStv Padi', provider: 'DSTV', aggregatorCostPrice: 2100, retailPrice: 2500, isActive: true },
  { id: 'cab_dstv_yanga', service: 'Cable', planName: 'DStv Yanga', provider: 'DSTV', aggregatorCostPrice: 3400, retailPrice: 3900, isActive: true },
  { id: 'cab_dstv_confam', service: 'Cable', planName: 'DStv Confam', provider: 'DSTV', aggregatorCostPrice: 6100, retailPrice: 6800, isActive: true },
  { id: 'cab_dstv_compact', service: 'Cable', planName: 'DStv Compact', provider: 'DSTV', aggregatorCostPrice: 9900, retailPrice: 10500, isActive: true },
  { id: 'cab_dstv_comp_plus', service: 'Cable', planName: 'DStv Compact Plus', provider: 'DSTV', aggregatorCostPrice: 14900, retailPrice: 16000, isActive: true },
  { id: 'cab_dstv_premium', service: 'Cable', planName: 'DStv Premium', provider: 'DSTV', aggregatorCostPrice: 19800, retailPrice: 21000, isActive: true },

  // GOtv
  { id: 'cab_gotv_supa', service: 'Cable', planName: 'GOtv Supa', provider: 'GOtv', aggregatorCostPrice: 5900, retailPrice: 6400, isActive: true },
  { id: 'cab_gotv_max', service: 'Cable', planName: 'GOtv Max', provider: 'GOtv', aggregatorCostPrice: 4400, retailPrice: 4850, isActive: true },
  { id: 'cab_gotv_jolli', service: 'Cable', planName: 'GOtv Jolli', provider: 'GOtv', aggregatorCostPrice: 3200, retailPrice: 3600, isActive: true },
  { id: 'cab_gotv_jinja', service: 'Cable', planName: 'GOtv Jinja', provider: 'GOtv', aggregatorCostPrice: 1900, retailPrice: 2250, isActive: true },
  { id: 'cab_gotv_smallie', service: 'Cable', planName: 'GOtv Smallie', provider: 'GOtv', aggregatorCostPrice: 900, retailPrice: 1100, isActive: true },

  // Startimes
  { id: 'cab_star_nova', service: 'Cable', planName: 'Startimes Nova', provider: 'Startimes', aggregatorCostPrice: 900, retailPrice: 1200, isActive: true },
  { id: 'cab_star_basic', service: 'Cable', planName: 'Startimes Basic', provider: 'Startimes', aggregatorCostPrice: 1700, retailPrice: 2100, isActive: true },
  { id: 'cab_star_smart', service: 'Cable', planName: 'Startimes Smart', provider: 'Startimes', aggregatorCostPrice: 2500, retailPrice: 3000, isActive: true },
  { id: 'cab_star_classic', service: 'Cable', planName: 'Startimes Classic', provider: 'Startimes', aggregatorCostPrice: 2700, retailPrice: 3200, isActive: true },
  { id: 'cab_star_super', service: 'Cable', planName: 'Startimes Super', provider: 'Startimes', aggregatorCostPrice: 4800, retailPrice: 5500, isActive: true },
]

/**
 * Aggregate of all product prices for service lookups.
 */
export const ALL_PRODUCT_PRICES: ProductPrice[] = [
  ...MOCK_AIRTIME_PRICES,
  ...MOCK_DATA_PRICES,
  ...MOCK_ELECTRICITY_PRICES,
  ...MOCK_CABLE_PRICES,
]

// ─── Smart Contacts ───────────────────────────────────────

export const MOCK_SMART_CONTACTS: SmartContact[] = [
  {
    id: 'sc_001',
    userId: 'usr_demo_001',
    alias: "Mom's Phone",
    identifier: '08098765432',
    providerType: 'Airtel',
  },
  {
    id: 'sc_002',
    userId: 'usr_demo_001',
    alias: 'Home Meter',
    identifier: '45678901234',
    providerType: 'IKEDC',
  },
  {
    id: 'sc_003',
    userId: 'usr_demo_001',
    alias: "Dad's DSTV",
    identifier: '1234567890',
    providerType: 'DSTV',
  },
]

// ─── Announcements ────────────────────────────────────────

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_001',
    message: '🔧 Scheduled maintenance on June 25 from 1:00 AM — 3:00 AM WAT. All services will be briefly unavailable.',
    isActive: true,
    type: 'Info',
  },
  {
    id: 'ann_002',
    message: '🎉 Use code CEKLAUNCH for 5% cashback on your first data purchase! Valid until June 30.',
    isActive: true,
    type: 'Promo',
  },
]

// ─── Admin Settings ───────────────────────────────────────

export const MOCK_ADMIN_SETTINGS: AdminSettings = {
  primaryDataApi: 'Toppa',
  secondaryDataApi: 'CheapDataHub',
  primaryBillsApi: 'CheapDataHub',
  maintenanceMode: false,
}

// ─── Promos ───────────────────────────────────────────────

export const MOCK_PROMOS: Promo[] = [
  {
    id: 'promo_001',
    title: 'Launch Week Cashback',
    description: 'Get 5% cashback on your first data bundle purchase. Maximum cashback ₦500.',
    code: 'CEKLAUNCH',
    type: 'percentage',
    value: 5,
    isActive: true,
  },
  {
    id: 'promo_002',
    title: 'Refer-a-Friend',
    description: 'Both you and your friend get ₦200 bonus when they sign up and fund their wallet.',
    code: 'CEKFRIEND',
    type: 'fixed',
    value: 200,
    isActive: false,
  },
]

// ─── Network Metadata ─────────────────────────────────────

/**
 * Network provider metadata for UI display (icons, colors, prefix detection).
 * Used by the airtime/data purchase screens to auto-detect network from phone number.
 */
export const NETWORK_PREFIXES: Record<string, string[]> = {
  MTN:     ['0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916', '0703', '0706'],
  Airtel:  ['0802', '0808', '0812', '0701', '0708', '0902', '0907', '0912', '0901'],
  Glo:     ['0805', '0807', '0811', '0815', '0705', '0905', '0915'],
  '9mobile': ['0809', '0817', '0818', '0908', '0909'],
}

/**
 * Detect the mobile network from a Nigerian phone number.
 * Returns the network name or 'Unknown' if the prefix is unrecognized.
 */
export function detectNetwork(phone: string): string {
  const normalized = phone.replace(/\s|-/g, '')
  const prefix = normalized.substring(0, 4)

  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) return network
  }
  return 'Unknown'
}

// ─── Cable Provider Metadata ──────────────────────────────

export const CABLE_PROVIDERS = ['DSTV', 'GOtv', 'Startimes'] as const
