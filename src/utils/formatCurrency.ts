/**
 * CEKPay Currency Formatter — Phase 4.10
 *
 * Naira-focused formatting utilities for the CEKPay UI.
 * All monetary values in the app are stored as numbers (kobo-free —
 * whole Naira amounts) and formatted for display using these helpers.
 *
 * @see Phase 4.10 in implementation_plan.md
 */

// ─── Formatter Instance ───────────────────────────────────

/**
 * Intl.NumberFormat instance for Nigerian Naira.
 * Cached for performance — reused across all calls.
 */
const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Compact formatter for large amounts (e.g., ₦1.2M, ₦500K).
 */
const compactFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  compactDisplay: 'short',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

/**
 * Plain number formatter (no currency symbol).
 */
const numberFormatter = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// ─── Public Functions ─────────────────────────────────────

/**
 * Format a number as Nigerian Naira.
 *
 * @param amount - The amount in whole Naira
 * @returns Formatted string with ₦ symbol and commas
 *
 * @example
 * formatNaira(5000)     // → "₦5,000.00"
 * formatNaira(0)        // → "₦0.00"
 * formatNaira(-1500)    // → "-₦1,500.00"
 * formatNaira(1234567)  // → "₦1,234,567.00"
 */
export function formatNaira(amount: number): string {
  // Intl may produce "NGN" instead of "₦" in some environments
  // so we normalize the output to always use the ₦ symbol
  return nairaFormatter.format(amount).replace(/NGN\s?/, '₦')
}

/**
 * Format a number as Naira without decimal places.
 * Useful for airtime denominations and plan prices.
 *
 * @example
 * formatNairaWhole(5000)    // → "₦5,000"
 * formatNairaWhole(100)     // → "₦100"
 */
export function formatNairaWhole(amount: number): string {
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return `₦${formatted}`
}

/**
 * Format a large amount in compact notation.
 * Useful for admin dashboards and summary cards.
 *
 * @example
 * formatNairaCompact(1200000) // → "₦1.2M"
 * formatNairaCompact(500000)  // → "₦500K"
 * formatNairaCompact(5000)    // → "₦5K"
 * formatNairaCompact(150)     // → "₦150"
 */
export function formatNairaCompact(amount: number): string {
  return compactFormatter.format(amount).replace(/NGN\s?/, '₦')
}

/**
 * Format a number with commas but no currency symbol.
 * Useful for input fields where the ₦ symbol is shown separately.
 *
 * @example
 * formatNumber(5000)    // → "5,000.00"
 * formatNumber(0)       // → "0.00"
 */
export function formatNumber(amount: number): string {
  return numberFormatter.format(amount)
}

/**
 * Format a number as a percentage with 1 decimal place.
 * Useful for displaying margin percentages in admin pricing.
 *
 * @example
 * formatPercent(0.05)   // → "5.0%"
 * formatPercent(0.125)  // → "12.5%"
 */
export function formatPercent(decimal: number): string {
  return `${(decimal * 100).toFixed(1)}%`
}

/**
 * Calculate the margin percentage between cost and retail price.
 *
 * @example
 * calculateMargin(970, 1000)  // → 0.030927... (~3.1%)
 * calculateMargin(130, 150)   // → 0.133333... (~13.3%)
 */
export function calculateMargin(costPrice: number, retailPrice: number): number {
  if (retailPrice === 0) return 0
  return (retailPrice - costPrice) / retailPrice
}

/**
 * Format the margin as a readable string.
 *
 * @example
 * formatMargin(970, 1000)   // → "3.1%"
 * formatMargin(130, 150)    // → "13.3%"
 */
export function formatMargin(costPrice: number, retailPrice: number): string {
  return formatPercent(calculateMargin(costPrice, retailPrice))
}
