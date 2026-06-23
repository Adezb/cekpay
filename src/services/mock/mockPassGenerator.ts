/**
 * CEKPay Mock Pass Generator — Phase 4.3
 *
 * Generates a 6-character ALPHANUMERIC pass code.
 * Characters: A-Z (uppercase) + 0-9
 * Example output: "A7X9TP", "K2M8BQ", "W5N3RJ"
 *
 * In production, BulkSMSNigeria will deliver:
 *   "Your CEKPay Pass is A7X9TP"
 *
 * CRITICAL: SMS copy must NEVER use words: "OTP", "Code", "PIN"
 * Always use the word "Pass" to avoid telco spam filters.
 *
 * @see Director Decision #2 in implementation_plan.md
 */

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const PASS_LENGTH = 6

/**
 * Generates a cryptographically-random 6-char alphanumeric pass.
 * Uses `crypto.getRandomValues` when available (browser/Node 19+),
 * falls back to `Math.random` for older environments.
 */
export function generateAlphanumericPass(): string {
  let pass = ''

  // Prefer crypto for better randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint8Array(PASS_LENGTH)
    crypto.getRandomValues(values)
    for (let i = 0; i < PASS_LENGTH; i++) {
      pass += CHARSET[values[i] % CHARSET.length]
    }
  } else {
    for (let i = 0; i < PASS_LENGTH; i++) {
      pass += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length))
    }
  }

  return pass
}
