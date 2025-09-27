import { supabase, TABLES } from './supabase'
import type {
  Category,
  Customer,
  Product,
  Order,
  Discount,
  CreateOrderForm,
  CreateProductForm,
  CreateCustomerForm,
  CreateCategoryForm,
  CreateDiscountForm,
  OrderFilters,
  ProductFilters,
  CategoryFilters,
  DiscountFilters,
  DashboardStats
} from '@/types'

// Categories API
export const categoriesApi = {
  async getAll(filters?: CategoryFilters): Promise<Category[]> {
    let query = supabase
      .from(TABLES.CATEGORIES)
      .select(`
        *,
        parent:categories!parent_id(*),
        children:categories!parent_id(*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', filters.parent_id)
      }
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Category | null> {
    // First get the category
    const { data: category, error: categoryError } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .eq('id', id)
      .single()

    if (categoryError) {
      console.error('Error fetching category:', categoryError)
      throw categoryError
    }

    // If category has a parent_id, fetch the parent
    let parent = null
    if (category.parent_id) {
      const { data: parentData, error: parentError } = await supabase
        .from(TABLES.CATEGORIES)
        .select('*')
        .eq('id', category.parent_id)
        .single()

      if (!parentError && parentData) {
        parent = parentData
      }
    }

    // Fetch children
    const { data: children } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .eq('parent_id', id)

    const result = {
      ...category,
      parent,
      children: children || []
    }
    
    console.log('Category API Debug:', { id, category, parent, children, result })
    return result
  },

  async getTree(): Promise<Category[]> {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select(`
        *,
        parent:categories!parent_id(*),
        children:categories!parent_id(*)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(category: CreateCategoryForm): Promise<Category> {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .insert(category)
      .select(`
        *,
        parent:categories!parent_id(*),
        children:categories!parent_id(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<CreateCategoryForm>): Promise<Category> {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        parent:categories!parent_id(*),
        children:categories!parent_id(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    // First, check if category has products
    const { data: products, error: productsError } = await supabase
      .from(TABLES.PRODUCTS)
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (productsError) throw productsError

    if (products && products.length > 0) {
      throw new Error('لا يمكن حذف التصنيف لأنه يحتوي على منتجات مرتبطة. يرجى نقل المنتجات إلى تصنيف آخر أولاً.')
    }

    // Check if category has children
    const { data: children } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id')
      .eq('parent_id', id)
      .limit(1)

    // if (childrenError) throw childrenError

    if (children && children.length > 0) {
      throw new Error('لا يمكن حذف التصنيف لأنه يحتوي على تصنيفات فرعية. يرجى حذف التصنيفات الفرعية أولاً.')
    }

    // Delete the category
    const { error } = await supabase
      .from(TABLES.CATEGORIES)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async bulkCreate(categories: any[]): Promise<Category[]> {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .insert(categories)
      .select(`
        *,
        parent:categories!parent_id(*),
        children:categories!parent_id(*)
      `)

    if (error) throw error
    return data || []
  },

  async bulkDelete(categoryIds: string[]): Promise<void> {
    // Check if any category has products
    const { data: products, error: productsError } = await supabase
      .from(TABLES.PRODUCTS)
      .select('id, category_id')
      .in('category_id', categoryIds)
      .limit(1)

    if (productsError) throw productsError

    if (products && products.length > 0) {
      // const categoryWithProducts = products[0].category_id
      throw new Error(`لا يمكن حذف التصنيف لأنه يحتوي على منتجات مرتبطة. يرجى نقل المنتجات إلى تصنيف آخر أولاً.`)
    }

    // Check if any category has children
    const { data: children } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id, parent_id')
      .in('parent_id', categoryIds)
      .limit(1)

    // if (childrenError) throw childrenError

    if (children && children.length > 0) {
      throw new Error('لا يمكن حذف التصنيف لأنه يحتوي على تصنيفات فرعية. يرجى حذف التصنيفات الفرعية أولاً.')
    }

    // Delete the categories
    const { error } = await supabase
      .from(TABLES.CATEGORIES)
      .delete()
      .in('id', categoryIds)

    if (error) throw error
  },

  async bulkToggleActive(categoryIds: string[], isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CATEGORIES)
      .update({ is_active: isActive })
      .in('id', categoryIds)

    if (error) throw error
  }
}

// Customers API
export const customersApi = {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(customer: CreateCustomerForm): Promise<Customer> {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .insert(customer)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<CreateCustomerForm>): Promise<Customer> {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CUSTOMERS)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async findByPhone(phone: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('*')
      .eq('phone', phone)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async upsert(customer: CreateCustomerForm): Promise<Customer> {
    // First try to find existing customer by phone
    const existingCustomer = await this.findByPhone(customer.phone)
    
    if (existingCustomer) {
      // Update existing customer
      return this.update(existingCustomer.id, customer)
    } else {
      // Create new customer
      return this.create(customer)
    }
  }
}

// Products API
export const productsApi = {
  async getAll(filters?: ProductFilters): Promise<Product[]> {
    let query = supabase
      .from(TABLES.PRODUCTS)
      .select(`
        *,
        category:categories(*),
        categories:product_categories(
          *,
          category:categories(*)
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by categories using the new product_categories table
    if (filters?.category_ids && filters.category_ids.length > 0) {
      // Get products that have any of the specified categories
      const { data: productIds } = await supabase
        .from(TABLES.PRODUCT_CATEGORIES)
        .select('product_id')
        .in('category_id', filters.category_ids)
      
      if (productIds && productIds.length > 0) {
        const ids = productIds.map(p => p.product_id)
        query = query.in('id', ids)
      } else {
        // No products found with these categories
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    } else if (filters?.category_id) {
      // Get products that have this specific category
      const { data: productIds } = await supabase
        .from(TABLES.PRODUCT_CATEGORIES)
        .select('product_id')
        .eq('category_id', filters.category_id)
      
      if (productIds && productIds.length > 0) {
        const ids = productIds.map(p => p.product_id)
        query = query.in('id', ids)
      } else {
        // No products found with this category
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select(`
        *,
        category:categories(*),
        categories:product_categories(
          *,
          category:categories(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(product: CreateProductForm): Promise<Product> {
    const { category_ids, ...productData } = product
    
    // Create the product first
    const { data: createdProduct, error: productError } = await supabase
      .from(TABLES.PRODUCTS)
      .insert(productData)
      .select(`
        *,
        category:categories(*),
        categories:product_categories(
          *,
          category:categories(*)
        )
      `)
      .single()

    if (productError) throw productError

    // Add categories if provided - first category becomes primary automatically
    if (category_ids && category_ids.length > 0) {
      const productCategories = category_ids.map((categoryId, index) => ({
        product_id: createdProduct.id,
        category_id: categoryId,
        is_primary: index === 0 // First category is primary
      }))

      const { error: categoriesError } = await supabase
        .from(TABLES.PRODUCT_CATEGORIES)
        .insert(productCategories)

      if (categoriesError) {
        console.error('Error adding categories:', categoriesError)
        // Don't throw error here, product was created successfully
      }
    }

    // Fetch the complete product with categories
    return this.getById(createdProduct.id) as Promise<Product>
  },

  async update(id: string, updates: Partial<CreateProductForm>): Promise<Product> {
    const { category_ids, ...productData } = updates
    
    // Update the product
    const { error: productError } = await supabase
      .from(TABLES.PRODUCTS)
      .update(productData)
      .eq('id', id)
      .select(`
        *,
        category:categories(*),
        categories:product_categories(
          *,
          category:categories(*)
        )
      `)
      .single()

    if (productError) throw productError

    // Update categories if provided - first category becomes primary automatically
    if (category_ids !== undefined) {
      // Delete existing categories
      await supabase
        .from(TABLES.PRODUCT_CATEGORIES)
        .delete()
        .eq('product_id', id)

      // Add new categories
      if (category_ids.length > 0) {
        const productCategories = category_ids.map((categoryId, index) => ({
          product_id: id,
          category_id: categoryId,
          is_primary: index === 0 // First category is primary
        }))

        const { error: categoriesError } = await supabase
          .from(TABLES.PRODUCT_CATEGORIES)
          .insert(productCategories)

        if (categoriesError) {
          console.error('Error updating categories:', categoriesError)
        }
      }
    }

    // Fetch the complete product with categories
    return this.getById(id) as Promise<Product>
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async bulkCreate(products: any[]): Promise<Product[]> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert(products)
      .select(`
        *,
        category:categories(*)
      `)

    if (error) throw error
    return data || []
  },

  async updateStock(id: string, quantity: number): Promise<Product> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update({ stock_quantity: quantity })
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Add product to category
  async addToCategory(productId: string, categoryId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PRODUCT_CATEGORIES)
      .insert({
        product_id: productId,
        category_id: categoryId,
        is_primary: false // Will be determined by order
      })

    if (error) throw error
  },

  // Remove product from category
  async removeFromCategory(productId: string, categoryId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PRODUCT_CATEGORIES)
      .delete()
      .eq('product_id', productId)
      .eq('category_id', categoryId)

    if (error) throw error
  },

  // Get products in category
  async getProductsInCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCT_CATEGORIES)
      .select(`
        product:products(
          *,
          category:categories(*),
          categories:product_categories(
            *,
            category:categories(*)
          )
        )
      `)
      .eq('category_id', categoryId)

    if (error) throw error
    return data?.map((item: any) => item.product).filter(Boolean) || []
  }
}

// Orders API
export const ordersApi = {
  async getAll(filters?: OrderFilters): Promise<Order[]> {
    let query = supabase
      .from(TABLES.ORDERS)
      .select(`
        *,
        customer:customers(*),
        order_items(
          *,
          product:products(*)
        ),
        discount:discounts(*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,customer:customers.name.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select(`
        *,
        customer:customers(*),
        order_items(
          *,
          product:products(*)
        ),
        discount:discounts(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(orderData: CreateOrderForm): Promise<Order> {
    // Upsert customer using the new upsert method
    const customer = await customersApi.upsert({
      name: orderData.customer.name,
      phone: orderData.customer.phone,
      email: orderData.customer.email,
      address: orderData.customer.address,
      city: orderData.customer.city
    })

    // Get products for calculation
    const productIds = orderData.items.map(item => item.product_id)
    const { data: products, error: productsError } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .in('id', productIds)

    if (productsError) throw productsError

    // Calculate totals
    let subtotal = 0
    const orderItems = orderData.items.map(item => {
      const product = products.find(p => p.id === item.product_id)
      if (!product) throw new Error(`Product not found: ${item.product_id}`)
      
      const unitPrice = product.price
      const totalPrice = unitPrice * item.quantity
      subtotal += totalPrice

      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      }
    })

    // Calculate discount based on new discount system
    let discountAmount = 0
    if (orderData.discount_type && orderData.discount_type !== 'none') {
      if (orderData.discount_type === 'fixed' && orderData.discount_value) {
        discountAmount = Math.min(orderData.discount_value, subtotal)
      } else if (orderData.discount_type === 'percentage' && orderData.discount_value) {
        discountAmount = (subtotal * orderData.discount_value) / 100
      } else if (orderData.discount_type === 'coupon' && orderData.discount_code) {
        // Handle coupon discount (existing logic)
        const { data: discountData, error: discountError } = await supabase
        .from(TABLES.DISCOUNTS)
        .select('*')
        .eq('code', orderData.discount_code)
        .eq('is_active', true)
        .single()

        if (!discountError && discountData) {
          if (discountData.type === 'percentage') {
            discountAmount = (subtotal * discountData.value) / 100
          } else {
            discountAmount = discountData.value
          }
        }
      }
    }

    const totalAmount = subtotal - discountAmount

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from(TABLES.ORDERS)
      .insert({
        customer_id: customer.id,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        notes: orderData.notes,
        discount_type: orderData.discount_type || 'none',
        discount_code: orderData.discount_code,
        discount_value: orderData.discount_value,
        discount_id: orderData.discount_type === 'coupon' ? (orderData as any).discount?.id : null
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const { error: itemsError } = await supabase
      .from(TABLES.ORDER_ITEMS)
      .insert(
        orderItems.map(item => ({
          ...item,
          order_id: order.id
        }))
      )

    if (itemsError) throw itemsError

    // Update product stock
    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.product_id)
      if (product) {
        await supabase
          .from(TABLES.PRODUCTS)
          .update({
            stock_quantity: product.stock_quantity - item.quantity
          })
          .eq('id', item.product_id)
      }
    }

    // Return complete order
    return this.getById(order.id) as Promise<Order>
  },

  async updateStatus(id: string, status: string): Promise<Order> {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.ORDERS)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async bulkCreate(orders: any[]): Promise<Order[]> {
    const createdOrders: Order[] = []

    for (const orderData of orders) {
      try {
        // Upsert customer
        const customer = await customersApi.upsert({
          name: orderData.customer.name,
          phone: orderData.customer.phone,
          email: orderData.customer.email,
          address: orderData.customer.address,
          city: orderData.customer.city
        })

        // Create order without items first
        const { data: order, error: orderError } = await supabase
          .from(TABLES.ORDERS)
          .insert({
            customer_id: customer.id,
            order_number: orderData.order_number,
            status: orderData.status,
            subtotal: orderData.subtotal,
            discount_amount: orderData.discount_amount,
            total_amount: orderData.total_amount,
            notes: orderData.notes,
            discount_type: orderData.discount_type,
            discount_code: orderData.discount_code,
            discount_value: orderData.discount_value
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Get the complete order
        const completeOrder = await this.getById(order.id)
        if (completeOrder) {
          createdOrders.push(completeOrder)
        }
      } catch (error) {
        console.error('Error creating order:', error)
        // Continue with next order
      }
    }

    return createdOrders
  }
}

// Discounts API
export const discountsApi = {
  async getAll(filters?: DiscountFilters): Promise<Discount[]> {
    let query = supabase
      .from(TABLES.DISCOUNTS)
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.search) {
      query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Discount | null> {
    const { data, error } = await supabase
      .from(TABLES.DISCOUNTS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getByCode(code: string): Promise<Discount | null> {
    const { data, error } = await supabase
      .from(TABLES.DISCOUNTS)
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data
  },

  async create(discount: CreateDiscountForm): Promise<Discount> {
    const { data, error } = await supabase
      .from(TABLES.DISCOUNTS)
      .insert(discount)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<CreateDiscountForm>): Promise<Discount> {
    const { data, error } = await supabase
      .from(TABLES.DISCOUNTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.DISCOUNTS)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async bulkDelete(discountIds: string[]): Promise<void> {
    const { error } = await supabase
      .from(TABLES.DISCOUNTS)
      .delete()
      .in('id', discountIds)

    if (error) throw error
  },

  async bulkToggleActive(discountIds: string[], isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from(TABLES.DISCOUNTS)
      .update({ is_active: isActive })
      .in('id', discountIds)

    if (error) throw error
  }
}

// Dashboard API
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const [
      { count: totalOrders },
      { count: totalCustomers },
      { count: totalProducts },
      { count: pendingOrders },
      { data: revenueData },
      { data: lowStockData }
    ] = await Promise.all([
      supabase.from(TABLES.ORDERS).select('*', { count: 'exact', head: true }),
      supabase.from(TABLES.CUSTOMERS).select('*', { count: 'exact', head: true }),
      supabase.from(TABLES.PRODUCTS).select('*', { count: 'exact', head: true }),
      supabase.from(TABLES.ORDERS).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from(TABLES.ORDERS).select('total_amount').eq('status', 'delivered'),
      supabase.from(TABLES.PRODUCTS).select('*').lt('stock_quantity', 10)
    ])

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    return {
      total_orders: totalOrders || 0,
      total_revenue: totalRevenue,
      total_customers: totalCustomers || 0,
      total_products: totalProducts || 0,
      pending_orders: pendingOrders || 0,
      low_stock_products: lowStockData?.length || 0
    }
  },

  async getRecentOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select(`
        *,
        customer:customers(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw error
    return data || []
  },

  async getLowStockProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select(`
        *,
        category:categories(*)
      `)
      .lt('stock_quantity', 10)
      .order('stock_quantity', { ascending: true })
      .limit(10)

    if (error) throw error
    return data || []
  }
}

