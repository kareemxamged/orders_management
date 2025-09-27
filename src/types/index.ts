// Database Types
export interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string
  parent?: Category
  children?: Category[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost?: number
  stock_quantity: number
  category_id?: string // للتوافق مع النظام القديم
  category?: Category // للتوافق مع النظام القديم
  categories?: ProductCategory[] // التصنيفات المتعددة الجديدة
  image_url?: string
  sale_price?: number
  discount_percentage?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  product_id: string
  category_id: string
  category?: Category
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  customer?: Customer
  order_number: string
  status: OrderStatus
  subtotal: number
  discount_amount: number
  total_amount: number
  notes?: string
  discount_type?: 'none' | 'coupon' | 'fixed' | 'percentage'
  discount_code?: string
  discount_value?: number
  created_at: string
  updated_at: string
  order_items: OrderItem[]
  discount?: Discount
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Discount {
  id: string
  code?: string
  type: DiscountType
  value: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  order_id: string
  invoice_number: string
  file_url?: string
  created_at: string
}

export interface ShippingSticker {
  id: string
  order_id: string
  sticker_number: string
  file_url?: string
  created_at: string
}

// Enums
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

// Form Types
export interface CreateOrderForm {
  customer: {
    name: string
    phone: string
    email?: string
    address?: string
    city?: string
  }
  items: {
    product_id: string
    quantity: number
  }[]
  discount_type?: 'none' | 'coupon' | 'fixed' | 'percentage'
  discount_code?: string
  discount_value?: number
  notes?: string
}

export interface CreateProductForm {
  name: string
  description?: string
  price: number
  cost?: number
  stock_quantity: number
  category_id?: string // للتوافق مع النظام القديم
  category_ids?: string[] // التصنيفات المتعددة الجديدة
  image_url?: string
  sale_price?: number
  discount_percentage?: number
}

export interface CreateCategoryForm {
  name: string
  description?: string
  parent_id?: string
  is_active?: boolean
}

export interface CreateCustomerForm {
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
}

export interface CreateDiscountForm {
  code: string
  type: DiscountType
  value: number
  description?: string
  is_active: boolean
}

// Filter Types
export interface OrderFilters {
  status?: OrderStatus
  customer_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface ProductFilters {
  category_id?: string
  category_ids?: string[]
  is_active?: boolean
  search?: string
}

export interface CategoryFilters {
  parent_id?: string
  is_active?: boolean
  search?: string
}

export interface DiscountFilters {
  type?: DiscountType
  is_active?: boolean
  search?: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// Statistics Types
export interface DashboardStats {
  total_orders: number
  total_revenue: number
  total_customers: number
  total_products: number
  pending_orders: number
  low_stock_products: number
}

export interface OrderStats {
  orders_by_status: Record<OrderStatus, number>
  revenue_by_month: Array<{
    month: string
    revenue: number
  }>
  top_products: Array<{
    product_id: string
    product_name: string
    total_sold: number
    revenue: number
  }>
}

