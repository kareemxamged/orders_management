import React from 'react'
import { X, User, Calendar, Package, DollarSign, FileText } from 'lucide-react'
import { Order } from '@/types'
import { formatDate, formatCurrency, getOrderStatusColor, getOrderStatusText } from '@/utils'

interface OrderDetailsModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">تفاصيل الطلب</h2>
            <p className="text-sm text-gray-500 mt-1">رقم الطلب: {order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileText className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">حالة الطلب</span>
              </div>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                {getOrderStatusText(order.status)}
              </span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <User className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">معلومات العميل</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">الاسم</p>
                <p className="text-sm font-medium text-gray-900">{order.customer?.name}</p>
              </div>
              {order.customer?.phone && (
                <div>
                  <p className="text-sm text-gray-500">رقم الهاتف</p>
                  <p className="text-sm font-medium text-gray-900">{order.customer.phone}</p>
                </div>
              )}
              {order.customer?.email && (
                <div>
                  <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p className="text-sm font-medium text-gray-900">{order.customer.email}</p>
                </div>
              )}
              {order.customer?.city && (
                <div>
                  <p className="text-sm text-gray-500">المدينة</p>
                  <p className="text-sm font-medium text-gray-900">{order.customer.city}</p>
                </div>
              )}
              {order.customer?.address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">العنوان</p>
                  <p className="text-sm font-medium text-gray-900">{order.customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">عناصر الطلب</span>
            </div>
            <div className="space-y-3">
              {order.order_items?.map((item, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.product?.name}</h4>
                      {item.product?.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.product.description}</p>
                      )}
                    </div>
                    <div className="text-left ml-4">
                      <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                      <p className="text-sm text-gray-600">السعر: {formatCurrency(item.unit_price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">ملخص الطلب</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">المجموع الفرعي</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">الخصم</span>
                  <span className="text-sm font-medium text-green-600">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">المجموع الإجمالي</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">ملاحظات</span>
              </div>
              <p className="text-sm text-gray-900">{order.notes}</p>
            </div>
          )}

          {/* Order Date */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">معلومات التاريخ</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">تاريخ الطلب</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">آخر تحديث</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(order.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
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

export default OrderDetailsModal
