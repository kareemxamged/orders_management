import React from 'react'
import { Product } from '@/types'
import { X, Package, DollarSign, Hash, Tag, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils'

interface ProductDetailsModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">تفاصيل المنتج</h2>
                <p className="text-sm text-gray-500">معلومات المنتج الكاملة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                {product.description && (
                  <p className="text-gray-600">{product.description}</p>
                )}
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Price */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">السعر</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(product.price)}
                  </p>
                </div>

                {/* Cost */}
                {product.cost && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">التكلفة</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(product.cost)}
                    </p>
                  </div>
                )}

                {/* Stock */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Hash className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">المخزون</span>
                  </div>
                  <p className="text-xl font-bold text-purple-600">
                    {product.stock_quantity} قطعة
                  </p>
                </div>

                {/* Categories */}
                {(product.categories && product.categories.length > 0) || product.category ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <Tag className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">التصنيفات</span>
                    </div>
                    {product.categories && product.categories.length > 0 ? (
                      <div className="space-y-2">
                        {product.categories.map((productCategory) => (
                          <div key={productCategory.id} className="flex items-center space-x-2 space-x-reverse">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                              {productCategory.category?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : product.category ? (
                      <p className="text-lg font-semibold text-orange-600">
                        {product.category.name}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">الحالة</span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  product.is_active 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.is_active ? 'نشط' : 'غير نشط'}
                </span>
              </div>

              {/* Stock Warning */}
              {product.stock_quantity <= 10 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      تحذير: مخزون منخفض
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-yellow-700">
                    كمية المخزون ({product.stock_quantity}) أقل من 10 قطع. يُنصح بإعادة التموين.
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">تاريخ الإنشاء</span>
                  <p className="text-sm text-gray-600">{formatDate(product.created_at)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">آخر تحديث</span>
                  <p className="text-sm text-gray-600">{formatDate(product.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-outline btn-md"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailsModal
