import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '@/services/api'
import { Product, ProductFilters } from '@/types'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Download,
  Upload,
  CheckSquare,
  Square,
  // X,
  AlertTriangle
} from 'lucide-react'
import { formatCurrency, searchIncludes, exportProductsToCSV, parseCSVFileSmart, validateProductData, extractProductsFromSpecificCSV, validateSpecificProductData } from '@/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProductModal from '@/components/ProductModal'
import ProductDetailsModal from '@/components/ProductDetailsModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import toast from 'react-hot-toast'

const ProductsPage: React.FC = () => {
  const [filters, setFilters] = useState<ProductFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false)
  const queryClient = useQueryClient()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  })

  const { data: allProducts, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  })

  // Get all category IDs for hierarchical filtering
  const getAllCategoryIds = (categoryId: string): string[] => {
    if (!categories) return [categoryId]
    
    const category = categories.find(c => c.id === categoryId)
    if (!category) return [categoryId]
    
    // Get all children categories recursively
    const getChildrenIds = (parentId: string): string[] => {
      const children = categories.filter(c => c.parent_id === parentId)
      let allIds = [parentId]
      
      children.forEach(child => {
        allIds = allIds.concat(getChildrenIds(child.id))
      })
      
      return allIds
    }
    
    return getChildrenIds(categoryId)
  }

  // Filter products locally based on filters and search
  const products = React.useMemo(() => {
    if (!allProducts) return []

    let filteredProducts = [...allProducts]

    // Apply category filter
    if (filters.category_id && categories) {
      const allCategoryIds = getAllCategoryIds(filters.category_id)
      filteredProducts = filteredProducts.filter(product => 
        product.category_id && allCategoryIds.includes(product.category_id)
      )
    }

    // Apply status filter
    if (filters.is_active !== undefined) {
      filteredProducts = filteredProducts.filter(product => 
        product.is_active === filters.is_active
      )
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filteredProducts = filteredProducts.filter(product => 
        searchIncludes(product.name, searchTerm) ||
        (product.description && searchIncludes(product.description, searchTerm))
      )
    }

    return filteredProducts
  }, [allProducts, filters, searchTerm, categories])

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' || value === null ? undefined : value
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('تم حذف المنتج بنجاح')
      setShowConfirmModal(false)
      setProductToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في حذف المنتج')
    },
  })

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setShowProductModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowDetailsModal(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product)
    setShowConfirmModal(true)
  }

  const confirmDelete = () => {
    if (selectedProducts.size > 0) {
      // Bulk delete
      bulkDeleteMutation.mutate(Array.from(selectedProducts))
    } else if (productToDelete) {
      // Single delete
      deleteMutation.mutate(productToDelete.id)
    }
    
    setShowConfirmModal(false)
    setProductToDelete(null)
  }

  const handleCloseModals = () => {
    setShowProductModal(false)
    setShowDetailsModal(false)
    setShowConfirmModal(false)
    setSelectedProduct(null)
    setProductToDelete(null)
    setImportFile(null)
  }

  // Bulk selection functions
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const selectAllProducts = () => {
    const allProductIds = new Set(products.map(product => product.id))
    setSelectedProducts(allProductIds)
  }

  const clearSelection = () => {
    setSelectedProducts(new Set())
  }

  const toggleBulkDeleteMode = () => {
    setIsBulkDeleteMode(!isBulkDeleteMode)
    if (isBulkDeleteMode) {
      clearSelection()
    }
  }

  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const promises = productIds.map(id => productsApi.delete(id))
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('تم حذف المنتجات المحددة بنجاح')
      setSelectedProducts(new Set())
      setIsBulkDeleteMode(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في حذف المنتجات')
    },
  })

  const bulkToggleActiveMutation = useMutation({
    mutationFn: async ({ productIds, isActive }: { productIds: string[], isActive: boolean }) => {
      const promises = productIds.map(id => productsApi.update(id, { is_active: isActive } as any))
      await Promise.all(promises)
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      const action = isActive ? 'تفعيل' : 'إلغاء تفعيل'
      toast.success(`تم ${action} المنتجات المحددة بنجاح`)
      setSelectedProducts(new Set())
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في تحديث حالة المنتجات')
    },
  })

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) {
      toast.error('يرجى تحديد منتجات للحذف')
      return
    }
    setProductToDelete(null) // Clear single delete
    setShowConfirmModal(true)
  }

  const handleBulkDeactivate = () => {
    if (selectedProducts.size === 0) {
      toast.error('يرجى تحديد منتجات لإلغاء التفعيل')
      return
    }
    bulkToggleActiveMutation.mutate({ 
      productIds: Array.from(selectedProducts), 
      isActive: false 
    })
  }

  const handleBulkActivate = () => {
    if (selectedProducts.size === 0) {
      toast.error('يرجى تحديد منتجات للتفعيل')
      return
    }
    bulkToggleActiveMutation.mutate({ 
      productIds: Array.from(selectedProducts), 
      isActive: true 
    })
  }

  const handleExportProducts = () => {
    try {
      if (!allProducts || allProducts.length === 0) {
        toast.error('لا توجد منتجات للتصدير')
        return
      }
      
      exportProductsToCSV(allProducts)
      toast.success('تم تصدير المنتجات بنجاح')
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في تصدير المنتجات')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('يرجى اختيار ملف CSV صحيح')
        return
      }
      setImportFile(file)
    }
  }

  const handleImportProducts = async () => {
    if (!importFile) {
      toast.error('يرجى اختيار ملف للاستيراد')
      return
    }

    setIsImporting(true)
    try {
      // Try specific CSV format first, then fall back to smart analysis
      let products = []
      let validationResult
      
      try {
        // Try specific CSV format first
        products = await extractProductsFromSpecificCSV(importFile)
        validationResult = validateSpecificProductData(products)
      } catch (error) {
        // Fall back to smart analysis
        products = await parseCSVFileSmart(importFile)
        validationResult = validateProductData(products)
      }
      
      const { valid, errors } = validationResult
      
      if (errors.length > 0) {
        toast.error(`أخطاء في البيانات: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`)
        return
      }

      if (valid.length === 0) {
        toast.error('لا توجد بيانات صحيحة للاستيراد')
        return
      }

      // Check if all products have zero stock
      const allZeroStock = valid.every((p: any) => p.stock_quantity === 0)
      if (allZeroStock) {
        toast('جميع المنتجات في الملف لا تحتوي على مخزون، سيتم تعيين المخزون إلى 0', {
          icon: 'ℹ️',
          duration: 4000,
        })
      }

      // Process categories
      const processedProducts = await Promise.all(
        valid.map(async (product: any) => {
          let categoryId = null
          if (product.category_name) {
            // Find existing category or create new one
            const existingCategory = categories?.find(cat => 
              cat.name.toLowerCase() === product.category_name.toLowerCase()
            )
            
            if (existingCategory) {
              categoryId = existingCategory.id
            } else {
              // Create new category
              try {
                const newCategory = await categoriesApi.create({
                  name: product.category_name,
                  description: '',
                  is_active: true
                })
                categoryId = newCategory.id
              } catch (error) {
                console.warn(`Failed to create category: ${product.category_name}`)
              }
            }
          }

          return {
            name: product.name,
            description: product.description || '',
            price: product.price,
            cost: product.cost || 0,
            stock_quantity: product.stock_quantity || 0,
            category_id: categoryId,
            is_active: product.is_active !== false,
            sale_price: product.sale_price,
            discount_percentage: product.discount_percentage
          }
        })
      )

      // Bulk create products
      await productsApi.bulkCreate(processedProducts)
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      
      toast.success(`تم استيراد ${processedProducts.length} منتج بنجاح`)
      setImportFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('import-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في استيراد المنتجات')
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل المنتجات..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">حدث خطأ في تحميل المنتجات</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="px-4 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">المنتجات</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة منتجات المتجر والمخزون
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 sm:space-x-reverse px-4 sm:px-0">
          <button
            onClick={toggleBulkDeleteMode}
            className={`btn-outline btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto ${
              isBulkDeleteMode ? 'bg-blue-50 text-blue-700 border-blue-300' : ''
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span className="text-xs sm:text-sm">{isBulkDeleteMode ? 'وضع التحديد نشط' : 'تحديد المنتجات'}</span>
          </button>
          
          <button 
            onClick={handleExportProducts}
            className="btn-outline btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">تصدير</span>
          </button>
          
          <div className="relative w-full sm:w-auto">
            <input
              id="import-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button 
              onClick={() => document.getElementById('import-file')?.click()}
              className="btn-outline btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
              title="النظام الذكي يقرأ البيانات تلقائياً من ملفات CSV مختلفة الهيكل"
            >
              <Upload className="h-4 w-4" />
              <span className="text-xs sm:text-sm">استيراد</span>
            </button>
          </div>
          
          {importFile && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 sm:space-x-reverse w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-600 truncate">{importFile.name}</span>
              <button
                onClick={handleImportProducts}
                disabled={isImporting}
                className="btn-primary btn-sm flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span className="text-xs sm:text-sm">جاري الاستيراد...</span>
                  </>
                ) : (
                  <span className="text-xs sm:text-sm">استيراد</span>
                )}
              </button>
            </div>
          )}
          
          <button 
            onClick={handleAddProduct}
            className="btn-primary btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs sm:text-sm">منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      {allProducts && allProducts.length > 0 && (
        <div className="card mx-4 sm:mx-0">
          <div className="card-content p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {allProducts.length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">إجمالي المنتجات</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {allProducts.filter(p => p.is_active).length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">منتجات نشطة</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                  {allProducts.filter(p => p.stock_quantity <= 10).length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">مخزون منخفض</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  {allProducts.reduce((sum, p) => sum + p.stock_quantity, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">إجمالي المخزون</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mx-4 sm:mx-0">
        <div className="card-content p-3 sm:p-4">
          <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:space-x-reverse">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pr-8 sm:pr-10 text-sm sm:text-base"
                  placeholder="البحث في اسم المنتج..."
                  autoComplete="off"
                  autoFocus={false}
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              <span className="text-xs sm:text-sm">فلترة</span>
            </button>

            {/* Clear Search Button */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="btn-outline btn-sm sm:btn-md w-full sm:w-auto"
              >
                <span className="text-xs sm:text-sm">مسح البحث</span>
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
                {/* Category Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    التصنيف
                  </label>
                  <select
                    value={filters.category_id || ''}
                    onChange={(e) => handleFilterChange('category_id', e.target.value)}
                    className="input text-sm sm:text-base"
                  >
                    <option value="">جميع التصنيفات</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.parent_id ? `  ${category.name}` : category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    الحالة
                  </label>
                  <select
                    value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                    onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="input text-sm sm:text-base"
                  >
                    <option value="">جميع الحالات</option>
                    <option value="true">نشط</option>
                    <option value="false">غير نشط</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-ghost btn-sm sm:btn-md w-full text-xs sm:text-sm"
                  >
                    مسح الفلاتر
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-3 sm:space-y-4 px-4 sm:px-0">
        {/* Bulk Actions Bar */}
        {isBulkDeleteMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-xs sm:text-sm font-medium text-blue-900">
                  {selectedProducts.size > 0 ? `${selectedProducts.size} منتج محدد` : 'وضع التحديد نشط'}
                </span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={selectAllProducts}
                  className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                  title="تحديد جميع المنتجات"
                >
                  <CheckSquare className="h-4 w-4" />
                </button>
                
                <button
                  onClick={clearSelection}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                  title="إلغاء تحديد جميع المنتجات"
                >
                  <Square className="h-4 w-4" />
                </button>
                
                {selectedProducts.size > 0 && (
                  <>
                    <button
                      onClick={handleBulkDelete}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                      disabled={bulkDeleteMutation.isPending}
                      title="حذف المنتجات المحددة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={handleBulkDeactivate}
                      className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                      disabled={bulkToggleActiveMutation.isPending}
                      title="إلغاء تفعيل المنتجات المحددة"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={handleBulkActivate}
                      className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                      disabled={bulkToggleActiveMutation.isPending}
                      title="تفعيل المنتجات المحددة"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products?.map((product) => (
          <div key={product.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-content p-3 sm:p-4">
              {/* Selection checkbox */}
              {isBulkDeleteMode && (
                <div className="flex items-center justify-end mb-3">
                  <button
                    onClick={() => toggleProductSelection(product.id)}
                    className={`p-1 rounded ${
                      selectedProducts.has(product.id)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {selectedProducts.has(product.id) ? (
                      <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Square className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              )}
              
              {/* Product Info */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                  <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.categories && product.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.categories.map((productCategory) => (
                          <span
                            key={productCategory.id}
                            className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {productCategory.category?.name}
                          </span>
                        ))}
                      </div>
                    ) : product.category ? (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {product.category.name}
                      </p>
                    ) : null}
                  </div>
                </div>
                
                {product.description && (
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0 flex-1">
                    {product.sale_price && product.sale_price > 0 ? (
                      <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
                        <span className="text-sm sm:text-base lg:text-lg font-bold text-green-600">
                          {formatCurrency(product.sale_price)}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 line-through">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    ) : product.discount_percentage && product.discount_percentage > 0 ? (
                      <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
                        <span className="text-sm sm:text-base lg:text-lg font-bold text-green-600">
                          {formatCurrency(product.price - (product.price * product.discount_percentage / 100))}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 line-through">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm sm:text-base lg:text-lg font-bold text-primary-600">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                    product.is_active 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  <span>المخزون: {product.stock_quantity}</span>
                  {product.cost && (
                    <span className="text-xs">التكلفة: {formatCurrency(product.cost)}</span>
                  )}
                </div>

                {/* Stock Warning */}
                {product.stock_quantity <= 10 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <p className="text-xs text-yellow-800">
                      ⚠️ مخزون منخفض
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 sm:mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleViewProduct(product)}
                    className="text-primary-600 hover:text-primary-900 p-1"
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="text-gray-600 hover:text-gray-900 p-1"
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Empty State */}
      {products?.length === 0 && (
        <div className="text-center py-8 sm:py-12 px-4 sm:px-0">
          <div className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400">
            <Package className="h-8 w-8 sm:h-12 sm:w-12" />
          </div>
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">لا توجد منتجات</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            لم يتم العثور على أي منتجات تطابق معايير البحث.
          </p>
          <div className="mt-4 sm:mt-6">
            <button 
              onClick={handleAddProduct}
              className="btn-primary btn-sm sm:btn-md flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs sm:text-sm">إضافة منتج جديد</span>
            </button>
          </div>
        </div>
      )}


      {/* Modals */}
      <ProductModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={handleCloseModals}
      />

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={showDetailsModal}
        onClose={handleCloseModals}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModals}
        onConfirm={confirmDelete}
        title={selectedProducts.size > 0 ? "حذف المنتجات المحددة" : "تأكيد الحذف"}
        message={
          selectedProducts.size > 0
            ? `هل أنت متأكد من حذف ${selectedProducts.size} منتج؟ لا يمكن التراجع عن هذا الإجراء.`
            : `هل أنت متأكد من حذف المنتج "${productToDelete?.name}"؟`
        }
        confirmText="حذف"
        cancelText="إلغاء"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export default ProductsPage

