/**
 * CEKPay Network Carrier Detection — Phase 4.9
 *
 * Parses Nigerian mobile phone number prefixes to detect the carrier.
 * Returns the carrier name, brand color, and an inline SVG icon path
 * for use in the airtime/data purchase screens.
 *
 * Supported carriers: MTN, Airtel, Glo, 9mobile
 *
 * @see Phase 4.9 in implementation_plan.md
 */

// ─── Types ────────────────────────────────────────────────

export interface CarrierInfo {
  /** Carrier display name. */
  name: string
  /** Brand hex color for UI accents. */
  color: string
  /** Background hex color (lighter tint). */
  bgColor: string
  /** Short code used in product IDs (e.g., 'mtn', 'airtel'). */
  code: string
}

// ─── Carrier Metadata ─────────────────────────────────────

const CARRIERS: Record<string, CarrierInfo> = {
  MTN: {
    name: 'MTN',
    color: '#FFCC00',
    bgColor: '#FFF9E0',
    code: 'mtn',
  },
  Airtel: {
    name: 'Airtel',
    color: '#ED1C24',
    bgColor: '#FDE8E8',
    code: 'airtel',
  },
  Glo: {
    name: 'Glo',
    color: '#50B651',
    bgColor: '#E8F5E9',
    code: 'glo',
  },
  '9mobile': {
    name: '9mobile',
    color: '#006C3E',
    bgColor: '#E0F2E9',
    code: '9mob',
  },
}

const UNKNOWN_CARRIER: CarrierInfo = {
  name: 'Unknown',
  color: '#94A3B8',
  bgColor: '#F1F5F9',
  code: 'unknown',
}

// ─── Prefix Map ───────────────────────────────────────────

/**
 * Nigerian mobile number prefixes mapped to carrier names.
 * Source: NCC (Nigerian Communications Commission) number allocations.
 */
const PREFIX_TO_CARRIER: Record<string, string> = {
  // MTN
  '0803': 'MTN', '0806': 'MTN', '0810': 'MTN', '0813': 'MTN',
  '0814': 'MTN', '0816': 'MTN', '0903': 'MTN', '0906': 'MTN',
  '0913': 'MTN', '0916': 'MTN', '0703': 'MTN', '0706': 'MTN',

  // Airtel
  '0802': 'Airtel', '0808': 'Airtel', '0812': 'Airtel', '0701': 'Airtel',
  '0708': 'Airtel', '0902': 'Airtel', '0907': 'Airtel', '0912': 'Airtel',
  '0901': 'Airtel',

  // Glo
  '0805': 'Glo', '0807': 'Glo', '0811': 'Glo', '0815': 'Glo',
  '0705': 'Glo', '0905': 'Glo', '0915': 'Glo',

  // 9mobile
  '0809': '9mobile', '0817': '9mobile', '0818': '9mobile',
  '0908': '9mobile', '0909': '9mobile',
}

// ─── Normalization & MSISDN Functions ─────────────────────

/**
 * Normalize a Nigerian phone number to the local `0XXX...` format.
 * Handles:
 *   - International: +234XXXXXXXXXX → 0XXXXXXXXXX
 *   - MSISDN:         234XXXXXXXXXX → 0XXXXXXXXXX
 *   - Local:          0XXXXXXXXXX   → 0XXXXXXXXXX
 *   - Spaces/dashes:  080-1234-5678 → 08012345678
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '')

  if (cleaned.startsWith('+234')) {
    cleaned = '0' + cleaned.slice(4)
  } else if (cleaned.startsWith('234') && cleaned.length === 13) {
    cleaned = '0' + cleaned.slice(3)
  }

  return cleaned
}

/**
 * Convert any Nigerian phone number format to MSISDN (23480XXXXXXXX).
 * This is the canonical storage format for the `profiles.phone` column
 * and the format required by BulkSMSNigeria & Paystack APIs.
 *
 * @param phone - Any format: 08012345678, +2348012345678, 234XXXXXXXXXX
 * @returns 13-digit MSISDN string (e.g., '2348012345678')
 * @throws Error if the input is not a valid Nigerian mobile number
 *
 * @example
 * toMSISDN('08012345678')     // → '2348012345678'
 * toMSISDN('+2348012345678')  // → '2348012345678'
 * toMSISDN('2348012345678')   // → '2348012345678'
 */
export function toMSISDN(phone: string): string {
  const local = normalizePhone(phone)
  if (!/^0[7-9][0-1]\d{8}$/.test(local)) {
    throw new Error('Invalid Nigerian phone number format.')
  }
  return '234' + local.slice(1)
}

/**
 * Convert any Nigerian phone number format to local display format (0XXXXXXXXXX).
 * Useful for rendering phone numbers in the UI.
 *
 * @param phone - Any format: 2348012345678, +2348012345678, 08012345678
 * @returns 11-digit local string (e.g., '08012345678')
 */
export function toLocalPhone(phone: string): string {
  return normalizePhone(phone)
}

/**
 * Detect the mobile carrier from a Nigerian phone number.
 *
 * @param phone - Any format: 08012345678, +2348012345678, 080-1234-5678
 * @returns CarrierInfo with name, color, bgColor, and code
 *
 * @example
 * detectCarrier('08031234567')    // → { name: 'MTN', color: '#FFCC00', ... }
 * detectCarrier('+2348021234567') // → { name: 'Airtel', color: '#ED1C24', ... }
 * detectCarrier('09999999999')    // → { name: 'Unknown', color: '#94A3B8', ... }
 */
export function detectCarrier(phone: string): CarrierInfo {
  const normalized = normalizePhone(phone)
  const prefix = normalized.substring(0, 4)
  const carrierName = PREFIX_TO_CARRIER[prefix]

  if (carrierName && CARRIERS[carrierName]) {
    return CARRIERS[carrierName]
  }

  return UNKNOWN_CARRIER
}

/**
 * Shorthand: detect just the carrier name string.
 * Backward-compatible with the `detectNetwork` in mockData.ts.
 */
export function detectNetwork(phone: string): string {
  return detectCarrier(phone).name
}

/**
 * Check if a phone number looks like a valid Nigerian mobile number.
 * Accepts any format: local (0XXXXXXXXXX), MSISDN (234XXXXXXXXXX), or +234.
 * Validates against the NCC prefix ranges (07X, 08X, 09X).
 */
export function isValidNigerianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone)
  return /^0[7-9][0-1]\d{8}$/.test(normalized)
}

/**
 * Get all supported carrier infos (for rendering a carrier picker).
 */
export function getAllCarriers(): CarrierInfo[] {
  return Object.values(CARRIERS)
}
