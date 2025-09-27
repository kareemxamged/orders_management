import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database table names
export const TABLES = {
  CATEGORIES: 'categories',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  PRODUCT_CATEGORIES: 'product_categories',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  DISCOUNTS: 'discounts',
  INVOICES: 'invoices',
  SHIPPING_STICKERS: 'shipping_stickers'
} as const

