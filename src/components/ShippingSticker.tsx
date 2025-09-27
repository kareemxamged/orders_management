import React from 'react'
import { Order } from '@/types'
import { formatDate, formatCurrency } from '@/utils'
import { 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  Calendar,
  User,
  Building2
} from 'lucide-react'

interface ShippingStickerProps {
  order: Order
}

const ShippingSticker: React.FC<ShippingStickerProps> = ({ order }) => {
  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      {/* Header */}
      <div className="text-center mb-8 print:mb-6">
        <div className="flex items-center justify-center space-x-4 space-x-reverse mb-4">
          <img 
            src="/logo.png" 
            alt="شعار المتجر" 
            className="h-16 w-16 object-contain print:h-12 print:w-12"
          />
          <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">
            بوليصة الشحن
          </h1>
        </div>
        <p className="text-lg text-gray-600 print:text-base">
          رقم الطلب: {order.order_number}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-4 mb-8 print:mb-6">
        {/* From Address */}
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 print:bg-white print:border-gray-300">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <Building2 className="h-6 w-6 text-gray-600" />
            <h3 className="text-xl font-bold text-gray-900 print:text-lg">
              من
            </h3>
          </div>
          <div className="text-base text-gray-700 print:text-sm space-y-2">
            <p className="font-bold text-gray-900">متجر SH</p>
            <p>المملكة العربية السعودية</p>
            <p>الرياض - المملكة العربية السعودية</p>
            <p className="font-medium">هاتف: 0582352555</p>
            <p>البريد الإلكتروني: contact@shbakhur.com</p>
          </div>
        </div>

        {/* To Address */}
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 print:bg-white print:border-gray-300">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <MapPin className="h-6 w-6 text-gray-600" />
            <h3 className="text-xl font-bold text-gray-900 print:text-lg">
              إلى
            </h3>
          </div>
          <div className="text-base text-gray-700 print:text-sm space-y-2">
            <p className="font-bold text-gray-900">{order.customer?.name}</p>
            {order.customer?.phone && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Phone className="h-5 w-5 text-gray-500" />
                <span className="font-medium">{order.customer.phone}</span>
              </div>
            )}
            {order.customer?.address && (
              <p>{order.customer.address}</p>
            )}
            {order.customer?.city && (
              <p>{order.customer.city}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-8 print:mb-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <Package className="h-6 w-6 text-gray-600" />
          <h3 className="text-xl font-bold text-gray-900 print:text-lg">
            محتويات الطرد
          </h3>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 print:bg-white print:border-gray-300">
          <div className="space-y-3">
            {order.order_items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded border border-gray-200 print:bg-gray-100 print:border-gray-300">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.product?.name}</p>
                  <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(item.total_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="mb-8 print:mb-6">
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 print:bg-white print:border-gray-300">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4 print:text-lg">
              إجمالي الطلب
            </h3>
            <p className="text-3xl font-bold text-gray-900 print:text-2xl">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-4 border-gray-300 pt-8 print:pt-6">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-700 mb-4 print:text-base">
            شكراً لاختياركم متجر SH
          </p>
          <div className="text-sm text-gray-500 print:text-xs">
            <p>للاستفسارات: 0582352555 | contact@shbakhur.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShippingSticker