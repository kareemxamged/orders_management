import React from 'react'
import { Customer } from '@/types'
import { X, User, Phone, Mail, MapPin, Building } from 'lucide-react'
import { formatDate } from '@/utils'

interface CustomerDetailsModalProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ customer, isOpen, onClose }) => {
  if (!isOpen || !customer) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-primary-100 rounded-lg">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">تفاصيل العميل</h2>
                <p className="text-sm text-gray-500">معلومات العميل الكاملة</p>
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
              {/* Customer Name */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{customer.name}</h3>
                <p className="text-gray-600">معلومات العميل الشخصية</p>
              </div>

              {/* Customer Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Phone */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">رقم الهاتف</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">{customer.phone}</p>
                </div>

                {/* Email */}
                {customer.email && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <Mail className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">البريد الإلكتروني</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600">{customer.email}</p>
                  </div>
                )}

                {/* City */}
                {customer.city && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <Building className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">المدينة</span>
                    </div>
                    <p className="text-lg font-semibold text-purple-600">{customer.city}</p>
                  </div>
                )}

                {/* Address */}
                {customer.address && (
                  <div className="bg-gray-50 p-4 rounded-lg sm:col-span-2">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">العنوان</span>
                    </div>
                    <p className="text-lg font-semibold text-orange-600">{customer.address}</p>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">تاريخ الإنشاء</span>
                  <p className="text-sm text-gray-600">{formatDate(customer.created_at)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">آخر تحديث</span>
                  <p className="text-sm text-gray-600">{formatDate(customer.updated_at)}</p>
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

export default CustomerDetailsModal

