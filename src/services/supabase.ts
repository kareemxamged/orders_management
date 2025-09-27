import { createClient } from '@supabase/supabase-js'

// استخدام القيم مباشرة لتجنب مشاكل متغيرات البيئة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tcmohnvzuguerxgcppus.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbW9obnZ6dWd1ZXJ4Z2NwcHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTA0NzMsImV4cCI6MjA3NDQ2NjQ3M30.VXBapGKtHFgteoTOA4P5OnNFHNVAM2Vb_DD2pbeTgH0'

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

