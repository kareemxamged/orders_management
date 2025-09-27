import React from 'react'
import { Order } from '@/types'
import { formatDate, formatCurrency, getOrderStatusText } from '@/utils'
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Package, 
  DollarSign,
  FileText,
  User
} from 'lucide-react'
import QRCodeGenerator from './QRCodeGenerator'

interface CustomerInvoiceProps {
  order: Order
}

const CustomerInvoice: React.FC<CustomerInvoiceProps> = ({ order }) => {
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 print:p-4">
      {/* Header */}
      <div className="mb-8 sm:mb-10 lg:mb-12 print:mb-8">
        <div className="text-center">
          <div className="mb-4 sm:mb-6">
            <img 
              src="/logo.png" 
              alt="شعار المتجر" 
              className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 object-contain mx-auto print:h-12 print:w-12"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 print:text-3xl">
            فاتورة شراء
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 print:text-lg">
            رقم الفاتورة: {order.order_number}
          </p>
          <p className="text-base sm:text-lg text-gray-500 print:text-base">
            تاريخ الطلب: {formatDate(order.created_at, 'dd/MM/yyyy')}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-8 sm:mb-10 lg:mb-12 print:mb-8">
        <div className="text-right">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 print:text-2xl">
            {order.customer?.name}
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {order.customer?.address && (
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 print:text-base">
                {order.customer.address}
              </p>
            )}
            {order.customer?.city && (
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 print:text-base">
                {order.customer.city}
              </p>
            )}
            {order.customer?.email && (
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 print:text-base">
                {order.customer.email}
              </p>
            )}
            {order.customer?.phone && (
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 print:text-base">
                {order.customer.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8 sm:mb-10 lg:mb-12 print:mb-8">
        <div className="flex items-center space-x-3 space-x-reverse mb-4 sm:mb-6">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 print:text-lg">
            عناصر الطلب
          </h3>
        </div>
        <div className="overflow-x-auto border-2 border-gray-200 rounded-lg print:border-gray-300">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 print:bg-gray-200">
              <tr>
                <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-sm sm:text-base font-bold text-gray-900 border-l-2 border-gray-300 print:text-sm">
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'bold' }}>المنتج</span>
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-sm sm:text-base font-bold text-gray-900 border-l-2 border-gray-300 print:text-sm">
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'bold' }}>الكمية</span>
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-sm sm:text-base font-bold text-gray-900 border-l-2 border-gray-300 print:text-sm">
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'bold' }}>السعر</span>
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-sm sm:text-base font-bold text-gray-900 print:text-sm">
                  <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'bold' }}>المجموع</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y-2 divide-gray-200">
              {order.order_items?.map((item, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm sm:text-base text-gray-900 border-l-2 border-gray-200 print:text-sm">
                    <div>
                      <div className="font-bold text-gray-900">{item.product?.name}</div>
                      {item.product?.categories && item.product.categories.length > 0 && (
                        <div className="text-gray-600 text-xs sm:text-sm mt-1 print:text-xs">
                          {item.product.categories[0].category.name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900 border-l-2 border-gray-200 print:text-sm">
                    <span className="font-bold">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm sm:text-base font-bold text-gray-900 border-l-2 border-gray-200 print:text-sm">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm sm:text-base font-bold text-gray-900 print:text-sm">
                    {formatCurrency(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Summary */}
      <div className="flex justify-end mb-8 sm:mb-10 lg:mb-12 print:mb-8">
        <div className="w-full max-w-lg">
          <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg border-2 border-gray-200 print:bg-white print:border-gray-300">
            <div className="flex items-center space-x-3 space-x-reverse mb-4 sm:mb-6">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 print:text-lg">
                ملخص الطلب
              </h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-300">
                <span className="text-sm sm:text-base text-gray-700 print:text-sm">المجموع الفرعي:</span>
                <span className="text-sm sm:text-base font-bold text-gray-900 print:text-sm">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-300">
                  <span className="text-sm sm:text-base text-gray-700 print:text-sm">الخصم:</span>
                  <span className="text-sm sm:text-base font-bold text-red-600 print:text-sm">
                    -{formatCurrency(order.discount_amount)}
                  </span>
                </div>
              )}
              <div className="pt-3 sm:pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg sm:text-xl font-bold text-gray-900 print:text-lg">المجموع الإجمالي:</span>
                  <span className="text-xl sm:text-2xl font-bold text-gray-900 print:text-xl">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-8 sm:mb-10 lg:mb-12 print:mb-8">
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border-2 border-gray-200 print:bg-white print:border-gray-300">
            <div className="flex items-center space-x-3 space-x-reverse mb-3 sm:mb-4">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 print:text-lg">
                ملاحظات
              </h3>
            </div>
            <p className="text-sm sm:text-base text-gray-700 print:text-sm leading-relaxed">{order.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-4 border-gray-300 pt-6 sm:pt-8 print:pt-6">
        <div className="text-center">
          <p className="text-base sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4 print:text-base">
            شكراً لاختياركم متجر SH
          </p>
          <div className="text-xs sm:text-sm text-gray-500 print:text-xs mb-4 sm:mb-6">
            <p>للاستفسارات: 0582352555 | contact@shbakhur.com</p>
          </div>
          <QRCodeGenerator 
            orderNumber={order.order_number} 
            width={200}
            height={40}
            className="print:scale-90"
          />
        </div>
      </div>
    </div>
  )
}

export default CustomerInvoice
