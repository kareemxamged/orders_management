import { format, parseISO } from 'date-fns'
import { ar } from 'date-fns/locale'

// Date formatting utilities
export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: ar })
}

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'الآن'
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `منذ ${diffInDays} يوم`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `منذ ${diffInWeeks} أسبوع`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  return `منذ ${diffInMonths} شهر`
}

// Import/Export utilities
export const exportProductsToCSV = (products: any[]): void => {
  if (!products || products.length === 0) {
    throw new Error('لا توجد منتجات للتصدير')
  }

  // Prepare CSV headers
  const headers = [
    'اسم المنتج',
    'الوصف',
    'السعر',
    'التكلفة',
    'كمية المخزون',
    'التصنيف',
    'نشط',
    'السعر المخفض',
    'نسبة التخفيض'
  ]

  // Prepare CSV data
  const csvData = products.map(product => [
    product.name || '',
    product.description || '',
    product.price || 0,
    product.cost || 0,
    product.stock_quantity || 0,
    product.category?.name || '',
    product.is_active ? 'نعم' : 'لا',
    product.sale_price || '',
    product.discount_percentage || ''
  ])

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  // Create and download file
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          throw new Error('الملف يجب أن يحتوي على رؤوس وأقل من صف واحد')
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const row: any = {}
          
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          
          return row
        })

        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'))
    reader.readAsText(file, 'UTF-8')
  })
}

export const validateProductData = (data: any[]): { valid: any[], errors: string[] } => {
  const valid: any[] = []
  const errors: string[] = []

  data.forEach((row, index) => {
    const rowErrors: string[] = []
    const rowNumber = index + 2 // +2 because CSV starts from row 1 and we skip header

    // Required fields validation
    if (!row['اسم المنتج'] || row['اسم المنتج'].trim() === '') {
      rowErrors.push('اسم المنتج مطلوب')
    }

    if (!row['السعر'] || isNaN(parseFloat(row['السعر']))) {
      rowErrors.push('السعر يجب أن يكون رقماً صحيحاً')
    }

    if (!row['كمية المخزون'] || isNaN(parseInt(row['كمية المخزون']))) {
      rowErrors.push('كمية المخزون يجب أن تكون رقماً صحيحاً')
    }

    // Optional fields validation
    if (row['التكلفة'] && isNaN(parseFloat(row['التكلفة']))) {
      rowErrors.push('التكلفة يجب أن تكون رقماً صحيحاً')
    }

    if (row['السعر المخفض'] && row['السعر المخفض'] !== '' && isNaN(parseFloat(row['السعر المخفض']))) {
      rowErrors.push('السعر المخفض يجب أن يكون رقماً صحيحاً')
    }

    if (row['نسبة التخفيض'] && row['نسبة التخفيض'] !== '' && isNaN(parseFloat(row['نسبة التخفيض']))) {
      rowErrors.push('نسبة التخفيض يجب أن تكون رقماً صحيحاً')
    }

    if (rowErrors.length > 0) {
      errors.push(`الصف ${rowNumber}: ${rowErrors.join(', ')}`)
    } else {
      // Convert to proper format
      const product = {
        name: row['اسم المنتج'].trim(),
        description: row['الوصف']?.trim() || '',
        price: parseFloat(row['السعر']),
        cost: row['التكلفة'] ? parseFloat(row['التكلفة']) : 0,
        stock_quantity: parseInt(row['كمية المخزون']),
        category_name: row['التصنيف']?.trim() || '',
        is_active: row['نشط'] === 'نعم' || row['نشط'] === 'true' || row['نشط'] === '1',
        sale_price: row['السعر المخفض'] && row['السعر المخفض'] !== '' ? parseFloat(row['السعر المخفض']) : undefined,
        discount_percentage: row['نسبة التخفيض'] && row['نسبة التخفيض'] !== '' ? parseFloat(row['نسبة التخفيض']) : undefined
      }
      valid.push(product)
    }
  })

  return { valid, errors }
}

// Smart CSV Analysis and Data Extraction
export const analyzeCSVStructure = (headers: string[]): { 
  nameField: string | null,
  descriptionField: string | null,
  priceField: string | null,
  costField: string | null,
  stockField: string | null,
  categoryField: string | null,
  salePriceField: string | null,
  skuField: string | null
} => {
  const analysis = {
    nameField: null as string | null,
    descriptionField: null as string | null,
    priceField: null as string | null,
    costField: null as string | null,
    stockField: null as string | null,
    categoryField: null as string | null,
    salePriceField: null as string | null,
    skuField: null as string | null
  }

  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim()
    
    // Name field detection
    if (normalizedHeader.includes('اسم') || normalizedHeader.includes('name') || normalizedHeader.includes('title')) {
      analysis.nameField = header
    }
    
    // Description field detection
    if (normalizedHeader.includes('وصف') || normalizedHeader.includes('description') || 
        normalizedHeader.includes('وصف قصير') || normalizedHeader.includes('short description')) {
      analysis.descriptionField = header
    }
    
    // Price field detection
    if (normalizedHeader.includes('سعر') && !normalizedHeader.includes('تخفيض') && 
        !normalizedHeader.includes('تكلفة') && !normalizedHeader.includes('cost')) {
      analysis.priceField = header
    }
    
    // Cost field detection
    if (normalizedHeader.includes('تكلفة') || normalizedHeader.includes('cost') || 
        normalizedHeader.includes('سعر التكلفة')) {
      analysis.costField = header
    }
    
    // Stock field detection
    if (normalizedHeader.includes('مخزون') || normalizedHeader.includes('stock') || 
        normalizedHeader.includes('كمية') || normalizedHeader.includes('quantity')) {
      analysis.stockField = header
    }
    
    // Category field detection
    if (normalizedHeader.includes('تصنيف') || normalizedHeader.includes('category') || 
        normalizedHeader.includes('فئة') || normalizedHeader.includes('class')) {
      analysis.categoryField = header
    }
    
    // Sale price field detection
    if (normalizedHeader.includes('تخفيض') || normalizedHeader.includes('sale') || 
        normalizedHeader.includes('خصم') || normalizedHeader.includes('discount')) {
      analysis.salePriceField = header
    }
    
    // SKU field detection
    if (normalizedHeader.includes('sku') || normalizedHeader.includes('رمز') || 
        normalizedHeader.includes('كود') || normalizedHeader.includes('code')) {
      analysis.skuField = header
    }
  })

  return analysis
}

export const extractProductDataSmart = (row: any, analysis: any): any => {
  const product: any = {}
  
  // Extract name
  if (analysis.nameField && row[analysis.nameField]) {
    product.name = row[analysis.nameField].trim()
  }
  
  // Extract description (try multiple fields)
  if (analysis.descriptionField && row[analysis.descriptionField]) {
    product.description = cleanDescription(row[analysis.descriptionField])
  } else {
    // Try to find description in other fields
    const possibleDescFields = Object.keys(row).filter(key => 
      key.toLowerCase().includes('وصف') || 
      key.toLowerCase().includes('description') ||
      key.toLowerCase().includes('تفاصيل')
    )
    if (possibleDescFields.length > 0) {
      product.description = cleanDescription(row[possibleDescFields[0]])
    }
  }
  
  // Extract price
  if (analysis.priceField && row[analysis.priceField]) {
    product.price = parseFloat(row[analysis.priceField].toString().replace(/,/g, ''))
  }
  
  // Extract cost
  if (analysis.costField && row[analysis.costField]) {
    product.cost = parseFloat(row[analysis.costField].toString().replace(/,/g, ''))
  } else {
    product.cost = 0
  }
  
  // Extract stock
  if (analysis.stockField && row[analysis.stockField] && row[analysis.stockField].toString().trim() !== '') {
    const stockValue = parseInt(row[analysis.stockField].toString().replace(/,/g, ''))
    product.stock_quantity = isNaN(stockValue) ? 0 : stockValue
  } else {
    product.stock_quantity = 0
  }
  
  // Extract category
  if (analysis.categoryField && row[analysis.categoryField]) {
    product.category_name = extractPrimaryCategory(row[analysis.categoryField])
  }
  
  // Extract sale price
  if (analysis.salePriceField && row[analysis.salePriceField]) {
    const salePrice = parseFloat(row[analysis.salePriceField].toString().replace(/,/g, ''))
    if (salePrice > 0) {
      product.sale_price = salePrice
      // Calculate discount percentage if we have both prices
      if (product.price && product.price > salePrice) {
        product.discount_percentage = Math.round(((product.price - salePrice) / product.price) * 100)
      }
    }
  }
  
  // Extract SKU
  if (analysis.skuField && row[analysis.skuField]) {
    product.sku = row[analysis.skuField].trim()
  }
  
  // Set default values
  product.is_active = true
  
  return product
}

export const cleanDescription = (description: string): string => {
  if (!description) return ''
  
  // Remove HTML tags
  let cleaned = description.replace(/<[^>]*>/g, '')
  
  // Remove extra whitespace and newlines
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  // Limit length to 500 characters
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 500) + '...'
  }
  
  return cleaned
}

export const extractPrimaryCategory = (categories: string): string => {
  if (!categories) return ''
  
  // Split by common separators
  const categoryList = categories.split(/[,،>]/).map(cat => cat.trim()).filter(cat => cat)
  
  // Return the first category (primary category)
  return categoryList[0] || ''
}

export const parseCSVFileSmart = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          throw new Error('الملف يجب أن يحتوي على رؤوس وأقل من صف واحد')
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        
        // Analyze CSV structure
        const analysis = analyzeCSVStructure(headers)
        
        // Check if we found essential fields
        if (!analysis.nameField) {
          throw new Error('لم يتم العثور على حقل اسم المنتج في الملف')
        }
        
        if (!analysis.priceField) {
          throw new Error('لم يتم العثور على حقل السعر في الملف')
        }

        // If no stock field found, set default stock to 0 for all products
        if (!analysis.stockField) {
          console.warn('لم يتم العثور على حقل المخزون في الملف، سيتم تعيين المخزون إلى 0 لجميع المنتجات')
        }

        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const row: any = {}
          
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          
          return row
        })

        // Extract product data using smart analysis
        const products = data.map(row => extractProductDataSmart(row, analysis))
        
        // If stock field exists but all values are empty, set default stock
        if (analysis.stockField) {
          const hasAnyStockValue = products.some(p => p.stock_quantity > 0)
          if (!hasAnyStockValue) {
            console.warn('حقل المخزون موجود ولكن جميع القيم فارغة، سيتم تعيين المخزون إلى 0 لجميع المنتجات')
          }
        }
        
        resolve(products)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'))
    reader.readAsText(file, 'UTF-8')
  })
}

// Categories Import/Export Functions
export const exportCategoriesToCSV = (categories: any[]): void => {
  const headers = ['اسم التصنيف', 'الوصف', 'التصنيف الأب', 'نشط', 'تاريخ الإنشاء']
  
  const csvContent = [
    headers.join(','),
    ...categories.map(category => [
      `"${category.name || ''}"`,
      `"${category.description || ''}"`,
      `"${category.parent?.name || ''}"`,
      category.is_active ? 'نعم' : 'لا',
      formatDate(category.created_at, 'dd/MM/yyyy')
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `categories_export_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const parseCategoriesFromCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          throw new Error('الملف يجب أن يحتوي على رؤوس وأقل من صف واحد')
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        
        // Expected headers: اسم التصنيف, الوصف, التصنيف الأب, نشط, تاريخ الإنشاء
        const expectedHeaders = ['اسم التصنيف', 'الوصف', 'التصنيف الأب', 'نشط', 'تاريخ الإنشاء']
        
        // Check if headers match expected format
        const headersMatch = expectedHeaders.every(expected => 
          headers.some(header => header.includes(expected))
        )
        
        if (!headersMatch) {
          throw new Error('تنسيق الملف غير صحيح. يجب أن يحتوي على الأعمدة: اسم التصنيف، الوصف، التصنيف الأب، نشط، تاريخ الإنشاء')
        }

        const categories = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const category: any = {}
          
          headers.forEach((header, index) => {
            const value = values[index] || ''
            
            if (header.includes('اسم التصنيف')) {
              category.name = value
            } else if (header.includes('الوصف')) {
              category.description = value
            } else if (header.includes('التصنيف الأب')) {
              category.parent_name = value
            } else if (header.includes('نشط')) {
              category.is_active = value === 'نعم' || value === 'yes' || value === 'true'
            } else if (header.includes('تاريخ الإنشاء')) {
              category.created_at = value
            }
          })
          
          return category
        })

        resolve(categories)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'))
    reader.readAsText(file, 'UTF-8')
  })
}

export const validateCategoryData = (data: any[]): { valid: any[], errors: string[] } => {
  const valid: any[] = []
  const errors: string[] = []

  data.forEach((category, index) => {
    const rowErrors: string[] = []
    const rowNumber = index + 2

    // Required fields validation
    if (!category.name || category.name.trim() === '') {
      rowErrors.push('اسم التصنيف مطلوب')
    }

    if (rowErrors.length > 0) {
      errors.push(`الصف ${rowNumber}: ${rowErrors.join(', ')}`)
    } else {
      valid.push(category)
    }
  })

  return { valid, errors }
}

// Smart Categories Extraction from Products CSV
// Enhanced Product Extraction for Specific CSV Format
export const extractProductsFromSpecificCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          throw new Error('الملف يجب أن يحتوي على رؤوس وأقل من صف واحد')
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        
        // Expected headers for this specific format:
        // الاسم, وصف قصير, المخزون, سعر التخفيض, السعر الافتراضي, التصنيفات
        const expectedHeaders = ['الاسم', 'وصف قصير', 'المخزون', 'سعر التخفيض', 'السعر الافتراضي', 'التصنيفات']
        
        // Check if headers match expected format
        const headersMatch = expectedHeaders.every(expected => 
          headers.some(header => header.includes(expected))
        )
        
        if (!headersMatch) {
          throw new Error('تنسيق الملف غير متطابق مع التنسيق المتوقع')
        }

        const products = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const product: any = {}
          
          headers.forEach((header, headerIndex) => {
            const value = values[headerIndex] || ''
            
            if (header.includes('الاسم')) {
              product.name = value
            } else if (header.includes('وصف قصير')) {
              product.description = cleanDescription(value)
            } else if (header.includes('المخزون')) {
              // Handle empty stock values
              if (value && value.trim() !== '') {
                const stockValue = parseInt(value.replace(/,/g, ''))
                product.stock_quantity = isNaN(stockValue) ? 0 : stockValue
              } else {
                product.stock_quantity = 0
              }
            } else if (header.includes('سعر التخفيض')) {
              if (value && value.trim() !== '') {
                const salePrice = parseFloat(value.replace(/,/g, ''))
                product.sale_price = isNaN(salePrice) ? null : salePrice
              } else {
                product.sale_price = null
              }
            } else if (header.includes('السعر الافتراضي')) {
              if (value && value.trim() !== '') {
                const price = parseFloat(value.replace(/,/g, ''))
                product.price = isNaN(price) ? 0 : price
              } else {
                product.price = 0
              }
            } else if (header.includes('التصنيفات')) {
              product.category_name = extractPrimaryCategory(value)
            }
          })
          
          // Calculate discount percentage if both prices exist
          if (product.price && product.sale_price && product.price > product.sale_price) {
            product.discount_percentage = Math.round(((product.price - product.sale_price) / product.price) * 100)
          } else {
            product.discount_percentage = 0
          }
          
          // Set default values
          product.cost = 0
          product.is_active = true
          product.sku = `SKU-${String(index + 1).padStart(4, '0')}`
          
          return product
        })

        resolve(products)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'))
    reader.readAsText(file, 'UTF-8')
  })
}

// Enhanced validation for specific CSV format
export const validateSpecificProductData = (data: any[]): { valid: any[], errors: string[] } => {
  const valid: any[] = []
  const errors: string[] = []

  data.forEach((product, index) => {
    const rowErrors: string[] = []
    const rowNumber = index + 2

    // Required fields validation
    if (!product.name || product.name.trim() === '') {
      rowErrors.push('اسم المنتج مطلوب')
    }

    if (!product.price || isNaN(product.price) || product.price <= 0) {
      rowErrors.push('السعر الافتراضي يجب أن يكون رقماً صحيحاً أكبر من صفر')
    }

    // Stock validation - allow 0 or empty values
    if (product.stock_quantity !== undefined && product.stock_quantity !== null && 
        (isNaN(product.stock_quantity) || product.stock_quantity < 0)) {
      rowErrors.push('كمية المخزون يجب أن تكون رقماً صحيحاً أكبر من أو يساوي صفر')
    }

    // Sale price validation
    if (product.sale_price && (isNaN(product.sale_price) || product.sale_price < 0)) {
      rowErrors.push('السعر المخفض يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر')
    }

    // Discount percentage validation
    if (product.discount_percentage && (isNaN(product.discount_percentage) || product.discount_percentage < 0 || product.discount_percentage > 100)) {
      rowErrors.push('نسبة التخفيض يجب أن تكون بين 0 و 100')
    }

    if (rowErrors.length > 0) {
      errors.push(`الصف ${rowNumber}: ${rowErrors.join(', ')}`)
    } else {
      valid.push(product)
    }
  })

  return { valid, errors }
}

// Smart Categories Extraction from Products CSV
export const extractCategoriesFromProductsCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          throw new Error('الملف يجب أن يحتوي على رؤوس وأقل من صف واحد')
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        
        // Find categories column
        const categoriesIndex = headers.findIndex(h => 
          h.includes('تصنيف') || h.includes('category') || h.includes('التصنيفات')
        )
        
        if (categoriesIndex === -1) {
          throw new Error('لم يتم العثور على عمود التصنيفات في الملف')
        }

        const allCategories = new Set<string>()
        
        // Extract categories from all rows
        lines.slice(1).forEach(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const categoriesString = values[categoriesIndex] || ''
          
          if (categoriesString) {
            // Split by comma and handle hierarchical categories
            const categories = categoriesString.split(',').map(cat => cat.trim()).filter(cat => cat)
            
            categories.forEach(category => {
              // Handle hierarchical categories (Parent > Child)
              if (category.includes('>')) {
                const parts = category.split('>').map(part => part.trim())
                parts.forEach(part => {
                  if (part) allCategories.add(part)
                })
              } else {
                allCategories.add(category)
              }
            })
          }
        })

        // Convert to category objects with hierarchy
        const categories: any[] = []
        const processedCategories = new Set<string>()
        
        allCategories.forEach(categoryName => {
          if (!processedCategories.has(categoryName)) {
            processedCategories.add(categoryName)
            
            // Check if this is a subcategory
            let parentName = ''
            let isSubcategory = false
            
            // Look for parent category in the original data
            lines.slice(1).forEach(line => {
              const values = line.split(',').map(v => v.replace(/"/g, '').trim())
              const categoriesString = values[categoriesIndex] || ''
              
              if (categoriesString.includes('>') && categoriesString.includes(categoryName)) {
                const parts = categoriesString.split(',')
                parts.forEach(part => {
                  if (part.includes('>') && part.includes(categoryName)) {
                    const hierarchy = part.split('>').map(p => p.trim())
                    const categoryIndex = hierarchy.indexOf(categoryName)
                    if (categoryIndex > 0) {
                      parentName = hierarchy[categoryIndex - 1]
                      isSubcategory = true
                    }
                  }
                })
              }
            })
            
            categories.push({
              name: categoryName,
              description: `تصنيف ${categoryName}`,
              parent_name: isSubcategory ? parentName : '',
              is_active: true,
              is_subcategory: isSubcategory
            })
          }
        })

        resolve(categories)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'))
    reader.readAsText(file, 'UTF-8')
  })
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2
  }).format(amount)
}

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const truncate = (str: string, length: number): string => {
  return str.length > length ? str.substring(0, length) + '...' : str
}

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+966|0)?[5-9][0-9]{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Order utilities
export const generateOrderNumber = (): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `ORD-${timestamp}-${random}`
}

export const generateInvoiceNumber = (): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `INV-${timestamp}-${random}`
}

export const generateStickerNumber = (): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `STK-${timestamp}-${random}`
}

// Status utilities
export const getOrderStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export const getOrderStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    pending: 'في الانتظار',
    confirmed: 'مؤكد',
    processing: 'قيد المعالجة',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي'
  }
  return statusTexts[status] || status
}

// File utilities
export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Local storage utilities
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Handle storage error silently
  }
}

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Array utilities
export const groupBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const group = key(item)
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

export const sortBy = <T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// Error handling
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'حدث خطأ غير متوقع'
}

// Form utilities
export const formatFormData = (formData: FormData): Record<string, any> => {
  const data: Record<string, any> = {}
  for (const [key, value] of formData.entries()) {
    data[key] = value
  }
  return data
}

// Number utilities
export const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

export const calculateDiscount = (
  amount: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): number => {
  if (discountType === 'percentage') {
    return roundToTwo((amount * discountValue) / 100)
  }
  return Math.min(discountValue, amount)
}

// Arabic text utilities
export const normalizeArabicText = (text: string): string => {
  return text
    .replace(/أ/g, 'ا') // أ -> ا
    .replace(/إ/g, 'ا') // إ -> ا
    .replace(/آ/g, 'ا') // آ -> ا
    .replace(/ة/g, 'ه') // ة -> ه
    .replace(/ى/g, 'ي') // ى -> ي
    .replace(/ؤ/g, 'و') // ؤ -> و
    .replace(/ئ/g, 'ي') // ئ -> ي
    .toLowerCase()
    .trim()
}

export const searchIncludes = (text: string, searchTerm: string): boolean => {
  const normalizedText = normalizeArabicText(text)
  const normalizedSearchTerm = normalizeArabicText(searchTerm)
  return normalizedText.includes(normalizedSearchTerm)
}

// Orders Import/Export utilities
export const exportOrdersToCSV = (orders: any[]): void => {
  if (!orders || orders.length === 0) {
    throw new Error('لا توجد طلبات للتصدير')
  }

  const headers = [
    'رقم الطلب',
    'اسم العميل',
    'هاتف العميل',
    'ايميل العميل',
    'عنوان العميل',
    'مدينة العميل',
    'حالة الطلب',
    'المجموع الفرعي',
    'مبلغ التخفيض',
    'المجموع الإجمالي',
    'نوع التخفيض',
    'كود التخفيض',
    'قيمة التخفيض',
    'ملاحظات',
    'تاريخ الإنشاء',
    'تاريخ التحديث'
  ]

  const csvContent = [
    headers.join(','),
    ...orders.map(order => [
      order.order_number || '',
      order.customer?.name || '',
      order.customer?.phone || '',
      order.customer?.email || '',
      order.customer?.address || '',
      order.customer?.city || '',
      getOrderStatusText(order.status) || '',
      order.subtotal || 0,
      order.discount_amount || 0,
      order.total_amount || 0,
      order.discount_type || '',
      order.discount_code || '',
      order.discount_value || '',
      order.notes || '',
      formatDate(order.created_at, 'dd/MM/yyyy HH:mm') || '',
      formatDate(order.updated_at, 'dd/MM/yyyy HH:mm') || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `orders-export-${formatDate(new Date(), 'dd-MM-yyyy')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const parseOrdersFromCSV = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          reject(new Error('الملف فارغ أو لا يحتوي على بيانات صحيحة'))
          return
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        const orders = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
          
          if (values.length !== headers.length) {
            continue // Skip invalid rows
          }

          const orderData: any = {}
          headers.forEach((header, index) => {
            orderData[header] = values[index]
          })

          // Map CSV headers to our data structure
          const order = {
            order_number: orderData['رقم الطلب'] || generateOrderNumber(),
            customer: {
              name: orderData['اسم العميل'] || '',
              phone: orderData['هاتف العميل'] || '',
              email: orderData['ايميل العميل'] || '',
              address: orderData['عنوان العميل'] || '',
              city: orderData['مدينة العميل'] || ''
            },
            status: mapStatusTextToValue(orderData['حالة الطلب'] || 'pending'),
            subtotal: parseFloat(orderData['المجموع الفرعي'] || '0'),
            discount_amount: parseFloat(orderData['مبلغ التخفيض'] || '0'),
            total_amount: parseFloat(orderData['المجموع الإجمالي'] || '0'),
            discount_type: orderData['نوع التخفيض'] || 'none',
            discount_code: orderData['كود التخفيض'] || '',
            discount_value: parseFloat(orderData['قيمة التخفيض'] || '0'),
            notes: orderData['ملاحظات'] || '',
            order_items: [] // Will be handled separately
          }

          orders.push(order)
        }

        resolve(orders)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('خطأ في قراءة الملف'))
    }

    reader.readAsText(file, 'utf-8')
  })
}

export const validateOrderData = (orders: any[]): { valid: any[], errors: string[] } => {
  const valid: any[] = []
  const errors: string[] = []

  orders.forEach((order, index) => {
    const rowErrors: string[] = []

    // Validate required fields
    if (!order.customer?.name?.trim()) {
      rowErrors.push('اسم العميل مطلوب')
    }

    if (!order.customer?.phone?.trim()) {
      rowErrors.push('هاتف العميل مطلوب')
    }

    if (!order.order_number?.trim()) {
      rowErrors.push('رقم الطلب مطلوب')
    }

    // Validate numeric fields
    if (isNaN(order.subtotal) || order.subtotal < 0) {
      rowErrors.push('المجموع الفرعي يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر')
    }

    if (isNaN(order.total_amount) || order.total_amount < 0) {
      rowErrors.push('المجموع الإجمالي يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر')
    }

    if (isNaN(order.discount_amount) || order.discount_amount < 0) {
      rowErrors.push('مبلغ التخفيض يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر')
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(order.status)) {
      rowErrors.push('حالة الطلب غير صحيحة')
    }

    if (rowErrors.length > 0) {
      errors.push(`الصف ${index + 2}: ${rowErrors.join(', ')}`)
    } else {
      valid.push(order)
    }
  })

  return { valid, errors }
}

const mapStatusTextToValue = (statusText: string): string => {
  const statusMap: Record<string, string> = {
    'في الانتظار': 'pending',
    'مؤكد': 'confirmed',
    'قيد المعالجة': 'processing',
    'تم الشحن': 'shipped',
    'تم التسليم': 'delivered',
    'ملغي': 'cancelled',
    'pending': 'pending',
    'confirmed': 'confirmed',
    'processing': 'processing',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled'
  }
  return statusMap[statusText] || 'pending'
}

