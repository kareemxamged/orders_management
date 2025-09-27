import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/services/api'
import { Category } from '@/types'
import { X, Package, Plus, Trash2, CheckSquare, Square } from 'lucide-react'
import { formatCurrency } from '@/utils'
import toast from 'react-hot-toast'

interface CategoryProductsModalProps {
  category: Category | null
  isOpen: boolean
  onClose: () => void
}

const CategoryProductsModal: React.FC<CategoryProductsModalProps> = ({ category, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  // Get products in this category
  const { data: categoryProducts, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['products', 'category', category?.id],
    queryFn: () => productsApi.getProductsInCategory(category?.id || ''),
    enabled: !!category && activeTab === 'current'
  })

  // Get all products for adding to category
  const { data: allProducts, isLoading: isLoadingAll } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
    enabled: !!category && activeTab === 'add'
  })

  // Remove product from category mutation
  const removeFromCategoryMutation = useMutation({
    mutationFn: async (productId: string) => {
      return productsApi.removeFromCategory(productId, category?.id || '')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'category', category?.id] })
      toast.success('تم إزالة المنتج من التصنيف بنجاح')
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في إزالة المنتج من التصنيف')
    }
  })

  // Add products to category mutation
  const addToCategoryMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const promises = productIds.map(productId => 
        productsApi.addToCategory(productId, category?.id || '')
      )
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'category', category?.id] })
      toast.success('تم إضافة المنتجات للتصنيف بنجاح')
      setSelectedProducts(new Set())
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في إضافة المنتجات للتصنيف')
    }
  })

  const handleRemoveFromCategory = (productId: string) => {
    removeFromCategoryMutation.mutate(productId)
  }

  const handleAddToCategory = () => {
    if (selectedProducts.size === 0) {
      toast.error('يرجى اختيار منتج واحد على الأقل')
      return
    }
    addToCategoryMutation.mutate(Array.from(selectedProducts))
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const selectAllProducts = () => {
    if (!allProducts) return
    setSelectedProducts(new Set(allProducts.map(p => p.id)))
  }

  const clearSelection = () => {
    setSelectedProducts(new Set())
  }

  if (!isOpen || !category) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">إدارة منتجات التصنيف</h2>
                <p className="text-sm text-gray-500">{category.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 flex-shrink-0">
            <nav className="flex space-x-8 space-x-reverse px-6">
              <button
                onClick={() => setActiveTab('current')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'current'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                المنتجات الحالية ({categoryProducts?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'add'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                إضافة منتجات جديدة
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'current' ? (
              <div className="space-y-4">
                {isLoadingCurrent ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">جاري تحميل المنتجات...</p>
                  </div>
                ) : categoryProducts && categoryProducts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(product.price)}
                              </p>
                              <p className="text-xs text-gray-500">
                                المخزون: {product.stock_quantity}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCategory(product.id)}
                            disabled={removeFromCategoryMutation.isPending}
                            className="text-red-600 hover:text-red-900 p-1 ml-2"
                            title="إزالة من التصنيف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد منتجات</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      لا توجد منتجات في هذا التصنيف حالياً
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selection Controls */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={selectAllProducts}
                      className="btn-outline btn-sm flex items-center gap-2"
                    >
                      <CheckSquare className="h-4 w-4" />
                      تحديد الكل
                    </button>
                    <button
                      onClick={clearSelection}
                      className="btn-outline btn-sm flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      إلغاء التحديد
                    </button>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {selectedProducts.size} منتج محدد
                  </div>
                </div>

                {isLoadingAll ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">جاري تحميل المنتجات...</p>
                  </div>
                ) : allProducts && allProducts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {allProducts.map((product) => (
                      <div 
                        key={product.id} 
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                          selectedProducts.has(product.id) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => handleProductSelect(product.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 space-x-reverse flex-1">
                            <div className="mt-1">
                              {selectedProducts.has(product.id) ? (
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                {product.name}
                              </h3>
                              {product.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                              <div className="mt-2">
                                <p className="text-sm font-semibold text-green-600">
                                  {formatCurrency(product.price)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  المخزون: {product.stock_quantity}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد منتجات</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      لا توجد منتجات متاحة للإضافة
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {activeTab === 'add' && (
            <div className="flex justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <button
                onClick={onClose}
                className="btn-outline btn-md"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddToCategory}
                disabled={addToCategoryMutation.isPending || selectedProducts.size === 0}
                className="btn-primary btn-md flex items-center gap-2"
              >
                {addToCategoryMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    إضافة المنتجات المحددة
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryProductsModal
