import React from 'react'
import { X, Tag, Percent, FileText, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { Discount, DiscountType } from '@/types'
import { formatDate } from '@/utils'

interface DiscountDetailsModalProps {
  discount: Discount | null
  isOpen: boolean
  onClose: () => void
}

const DiscountDetailsModal: React.FC<DiscountDetailsModalProps> = ({
  discount,
  isOpen,
  onClose
}) => {
  if (!isOpen || !discount) return null

  const getDiscountTypeText = (type: DiscountType) => {
    return type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'
  }

  const getDiscountTypeColor = (type: DiscountType) => {
    return type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">تفاصيل الكوبون</h2>
            <p className="text-sm text-gray-500 mt-1">معلومات الكوبون</p>
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
          {/* Code and Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Tag className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">كود الكوبون</span>
              </div>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                discount.is_active 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {discount.is_active ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 font-mono">
                {discount.code}
              </h3>
            </div>
          </div>

          {/* Type and Value */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <Percent className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">نوع وقيمة الخصم</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">النوع</p>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getDiscountTypeColor(discount.type)}`}>
                  {getDiscountTypeText(discount.type)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">القيمة</p>
                <p className="text-lg font-bold text-gray-900">
                  {discount.type === 'percentage' 
                    ? `${discount.value}%` 
                    : `${discount.value} ر.س`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {discount.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">الوصف</span>
              </div>
              <p className="text-sm text-gray-900">{discount.description}</p>
            </div>
          )}

          {/* Status Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              {discount.is_active ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm font-medium text-gray-700">حالة الكوبون</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">الحالة:</span>
                <span className={`text-sm font-medium ${
                  discount.is_active ? 'text-green-600' : 'text-red-600'
                }`}>
                  {discount.is_active ? 'نشط ومتاح للاستخدام' : 'غير نشط وغير متاح'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">يمكن استخدامه:</span>
                <span className={`text-sm font-medium ${
                  discount.is_active ? 'text-green-600' : 'text-red-600'
                }`}>
                  {discount.is_active ? 'نعم' : 'لا'}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">معلومات التاريخ</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">تاريخ الإنشاء:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(discount.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">آخر تحديث:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(discount.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Example */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">مثال على الاستخدام</h4>
            <div className="text-sm text-blue-800">
              {discount.type === 'percentage' ? (
                <p>
                  عند تطبيق هذا الكوبون على طلب بقيمة 100 ر.س، 
                  سيتم خصم {discount.value}% = {discount.value} ر.س، 
                  والمبلغ النهائي سيكون {100 - discount.value} ر.س.
                </p>
              ) : (
                <p>
                  عند تطبيق هذا الكوبون على طلب بقيمة 100 ر.س، 
                  سيتم خصم {discount.value} ر.س، 
                  والمبلغ النهائي سيكون {100 - discount.value} ر.س.
                </p>
              )}
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

export default DiscountDetailsModal
