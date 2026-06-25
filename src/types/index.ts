export type UserRole = 'admin' | 'user'
export type TransactionStatus = 'Success' | 'Failed' | 'Reversed'
export type TransactionService = 'Airtime' | 'Data' | 'Electricity' | 'Cable' | 'Funding'
export type TransactionType = 'Credit' | 'Debit'
export type Aggregator = 'Toppa' | 'VTpass'
export type PaymentProcessor = 'Paystack'
export type AnnouncementType = 'Info' | 'Warning' | 'Promo'

export interface User {
  id: string              // UUID
  email: string
  phone: string
  firstName: string
  lastName: string
  pinHash: string         // Hashed 4-digit PIN
  role: UserRole          // 'admin' | 'user' — determines route access
  isBanned: boolean
}

export interface Wallet {
  id: string
  userId: string
  balance: number         // DECIMAL
  paystackCustomerCode?: string
  accountNumber?: string  // DVA Account Number
  bankName?: string       // e.g., Wema, Titan
  localWithdrawalBank?: string
  localWithdrawalAccount?: string
}

export interface Transaction {
  id: string
  userId: string
  reference: string       // Unique transaction ID
  type: TransactionType
  service: TransactionService
  amount: number
  status: TransactionStatus
  aggregatorUsed?: Aggregator     // Present for VTU purchases
  paymentProcessor?: PaymentProcessor // Present for Wallet funding
  createdAt: string       // ISO timestamp
  recipient?: string      // Phone/Meter/IUC number
  provider?: string       // MTN, IKEDC, DSTV, etc.
  planName?: string       // "1GB 30 Days", "GOtv Max", etc.
}

export interface Announcement {
  id: string
  message: string
  isActive: boolean
  type: AnnouncementType
}

export interface SmartContact {
  id: string
  userId: string
  alias: string           // "Mom's Phone"
  identifier: string      // Phone/Meter number
  providerType: string    // MTN, IKEDC, DSTV, etc.
}

export interface ProductPrice {
  id: string
  service: TransactionService
  planName: string
  network?: string        // For Data/Airtime: MTN, Airtel, Glo, 9mobile
  provider?: string       // For Electricity/Cable: IKEDC, DSTV, etc.
  aggregatorCostPrice: number
  retailPrice: number
  isActive: boolean
}

export interface AdminSettings {
  primaryDataApi: Aggregator
  secondaryDataApi: Aggregator
  primaryBillsApi: Aggregator
  maintenanceMode: boolean
}

export interface Promo {
  id: string
  title?: string
  description?: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minDeposit?: number
  isActive: boolean
}

// Service request types
export interface SignupRequest {
  firstName: string
  lastName: string
  phone: string
  email: string
}

export interface AirtimeRequest {
  phone: string
  amount: number
  network: string
}

export interface DataRequest {
  phone: string
  planId: string
  network: string
}

export interface ElectricityRequest {
  disco: string
  meterNumber: string
  amount: number
}

export interface CableRequest {
  provider: string
  iucNumber: string
  planId: string
}
