/**
 * CEKPay Database Schema Definitions
 * Supabase PostgreSQL Project: eexiftsuuouucvjytuhz
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          phone: string
          first_name: string
          last_name: string
          pin_hash: string
          role: 'user' | 'admin'
          is_banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          phone: string
          first_name: string
          last_name: string
          pin_hash?: string
          role?: 'user' | 'admin'
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string
          first_name?: string
          last_name?: string
          pin_hash?: string
          role?: 'user' | 'admin'
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          paystack_customer_code: string | null
          paystack_transfer_recipient_code: string | null
          dva_account_number: string | null
          dva_bank_name: string | null
          local_withdrawal_bank: string | null
          local_withdrawal_account: string | null
          local_withdrawal_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          paystack_customer_code?: string | null
          paystack_transfer_recipient_code?: string | null
          dva_account_number?: string | null
          dva_bank_name?: string | null
          local_withdrawal_bank?: string | null
          local_withdrawal_account?: string | null
          local_withdrawal_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          paystack_customer_code?: string | null
          paystack_transfer_recipient_code?: string | null
          dva_account_number?: string | null
          dva_bank_name?: string | null
          local_withdrawal_bank?: string | null
          local_withdrawal_account?: string | null
          local_withdrawal_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          reference: string
          type: 'Credit' | 'Debit'
          service: 'Airtime' | 'Data' | 'Electricity' | 'Cable' | 'Funding' | 'Withdrawal'
          amount: number
          status: 'Success' | 'Failed' | 'Reversed'
          aggregator_used: 'Toppa' | 'CheapDataHub' | null
          payment_processor: 'Paystack' | null
          promo_applied: string | null
          recipient: string | null
          provider: string | null
          plan_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reference: string
          type: 'Credit' | 'Debit'
          service: 'Airtime' | 'Data' | 'Electricity' | 'Cable' | 'Funding' | 'Withdrawal'
          amount: number
          status: 'Success' | 'Failed' | 'Reversed'
          aggregator_used?: 'Toppa' | 'CheapDataHub' | null
          payment_processor?: 'Paystack' | null
          promo_applied?: string | null
          recipient?: string | null
          provider?: string | null
          plan_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reference?: string
          type?: 'Credit' | 'Debit'
          service?: 'Airtime' | 'Data' | 'Electricity' | 'Cable' | 'Funding' | 'Withdrawal'
          amount?: number
          status?: 'Success' | 'Failed' | 'Reversed'
          aggregator_used?: 'Toppa' | 'CheapDataHub' | null
          payment_processor?: 'Paystack' | null
          promo_applied?: string | null
          recipient?: string | null
          provider?: string | null
          plan_name?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      promos: {
        Row: {
          id: string
          title: string | null
          description: string | null
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_deposit: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          description?: string | null
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_deposit?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          description?: string | null
          code?: string
          type?: 'percentage' | 'fixed'
          value?: number
          min_deposit?: number | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          message: string
          type: 'Info' | 'Warning' | 'Promo'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          message: string
          type: 'Info' | 'Warning' | 'Promo'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          message?: string
          type?: 'Info' | 'Warning' | 'Promo'
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      smart_contacts: {
        Row: {
          id: string
          user_id: string
          alias: string
          identifier: string
          provider_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          alias: string
          identifier: string
          provider_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          alias?: string
          identifier?: string
          provider_type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      product_prices: {
        Row: {
          id: string
          service: 'Airtime' | 'Data' | 'Electricity' | 'Cable'
          plan_name: string
          network: string | null
          provider: string | null
          aggregator_cost_price: number
          retail_price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service: 'Airtime' | 'Data' | 'Electricity' | 'Cable'
          plan_name: string
          network?: string | null
          provider?: string | null
          aggregator_cost_price: number
          retail_price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service?: 'Airtime' | 'Data' | 'Electricity' | 'Cable'
          plan_name?: string
          network?: string | null
          provider?: string | null
          aggregator_cost_price?: number
          retail_price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          primary_data_api: 'Toppa' | 'CheapDataHub'
          secondary_data_api: 'Toppa' | 'CheapDataHub'
          primary_bills_api: 'Toppa' | 'CheapDataHub'
          maintenance_mode: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          primary_data_api?: 'Toppa' | 'CheapDataHub'
          secondary_data_api?: 'Toppa' | 'CheapDataHub'
          primary_bills_api?: 'Toppa' | 'CheapDataHub'
          maintenance_mode?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          primary_data_api?: 'Toppa' | 'CheapDataHub'
          secondary_data_api?: 'Toppa' | 'CheapDataHub'
          primary_bills_api?: 'Toppa' | 'CheapDataHub'
          maintenance_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
