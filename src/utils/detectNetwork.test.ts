import { describe, it, expect } from 'vitest'
import {
  isValidNigerianPhone,
  toMSISDN,
  toLocalPhone,
  detectCarrier,
  detectNetwork,
  getAllCarriers,
} from './detectNetwork'

describe('detectNetwork & Phone Utilities', () => {
  describe('isValidNigerianPhone', () => {
    it('validates 11-digit local numbers starting with 07, 08, 09', () => {
      expect(isValidNigerianPhone('08031234567')).toBe(true)
      expect(isValidNigerianPhone('07011234567')).toBe(true)
      expect(isValidNigerianPhone('09051234567')).toBe(true)
      expect(isValidNigerianPhone('08171234567')).toBe(true)
    })

    it('validates MSISDN format (234XXXXXXXXXX) and international format (+234XXXXXXXXXX)', () => {
      expect(isValidNigerianPhone('2348031234567')).toBe(true)
      expect(isValidNigerianPhone('+2348031234567')).toBe(true)
    })

    it('rejects invalid, incomplete, or non-Nigerian phone numbers', () => {
      expect(isValidNigerianPhone('06031234567')).toBe(false)
      expect(isValidNigerianPhone('0803123456')).toBe(false) // 10 digits
      expect(isValidNigerianPhone('080312345678')).toBe(false) // 12 digits
      expect(isValidNigerianPhone('abc12345678')).toBe(false)
      expect(isValidNigerianPhone('')).toBe(false)
    })
  })

  describe('toMSISDN', () => {
    it('converts local, MSISDN, and international formats to 13-digit MSISDN', () => {
      expect(toMSISDN('08031234567')).toBe('2348031234567')
      expect(toMSISDN('+2348031234567')).toBe('2348031234567')
      expect(toMSISDN('2348031234567')).toBe('2348031234567')
    })

    it('throws error for invalid phone numbers', () => {
      expect(() => toMSISDN('01234567890')).toThrow('Invalid Nigerian phone number format.')
    })
  })

  describe('toLocalPhone', () => {
    it('converts MSISDN / international formats to 0-prefixed local format', () => {
      expect(toLocalPhone('+2348031234567')).toBe('08031234567')
      expect(toLocalPhone('2348031234567')).toBe('08031234567')
      expect(toLocalPhone('08031234567')).toBe('08031234567')
    })
  })

  describe('detectCarrier & detectNetwork', () => {
    it('detects MTN carrier correctly', () => {
      expect(detectNetwork('08030000000')).toBe('MTN')
      expect(detectCarrier('08140000000').code).toBe('mtn')
    })

    it('detects Airtel carrier correctly', () => {
      expect(detectNetwork('08020000000')).toBe('Airtel')
      expect(detectCarrier('09020000000').code).toBe('airtel')
    })

    it('detects Glo carrier correctly', () => {
      expect(detectNetwork('08050000000')).toBe('Glo')
      expect(detectCarrier('08150000000').code).toBe('glo')
    })

    it('detects 9mobile carrier correctly', () => {
      expect(detectNetwork('08090000000')).toBe('9mobile')
      expect(detectCarrier('09080000000').code).toBe('9mob')
    })

    it('returns Unknown for unrecognized prefixes', () => {
      expect(detectNetwork('08000000000')).toBe('Unknown')
    })
  })

  describe('getAllCarriers', () => {
    it('returns array of 4 major Nigerian carriers', () => {
      const carriers = getAllCarriers()
      expect(carriers).toHaveLength(4)
      expect(carriers.map((c) => c.name)).toEqual(['MTN', 'Airtel', 'Glo', '9mobile'])
    })
  })
})
