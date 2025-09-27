import React from 'react'
import { useReactToPrint } from 'react-to-print'
import { Order } from '@/types'
import { formatDate, formatCurrency } from '@/utils'
import { Download, Printer } from 'lucide-react'

interface InvoiceGeneratorProps {
  order: Order
  onClose: () => void
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ order, onClose }) => {
  const componentRef = React.useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `فاتورة-${order.order_number}`,
  })

  const handleDownload = () => {
    // In a real app, you would generate a PDF and download it
    // For now, we'll just trigger the print dialog
    handlePrint()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">فاتورة الطلب</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleDownload}
                className="btn-outline btn-sm flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                تحميل
              </button>
              <button
                onClick={handlePrint}
                className="btn-primary btn-sm flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-6">
            <div ref={componentRef} className="bg-white">
              {/* Invoice Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  متجر البخور والعطور
                </h1>
                <p className="text-gray-600">فاتورة شراء</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-semibold">رقم الفاتورة: {order.order_number}</p>
                  <p className="text-sm text-gray-600">تاريخ الفاتورة: {formatDate(order.created_at)}</p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات العميل</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">الاسم:</span> {order.customer?.name}</p>
                    <p><span className="font-medium">رقم الهاتف:</span> {order.customer?.phone}</p>
                    {order.customer?.email && (
                      <p><span className="font-medium">البريد الإلكتروني:</span> {order.customer.email}</p>
                    )}
                    {order.customer?.address && (
                      <p><span className="font-medium">العنوان:</span> {order.customer.address}</p>
                    )}
                    {order.customer?.city && (
                      <p><span className="font-medium">المدينة:</span> {order.customer.city}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات المتجر</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">الاسم:</span> متجر البخور والعطور</p>
                    <p><span className="font-medium">العنوان:</span> المملكة العربية السعودية</p>
                    <p><span className="font-medium">الهاتف:</span> +966 50 123 4567</p>
                    <p><span className="font-medium">البريد الإلكتروني:</span> info@store.com</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الطلب</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          المنتج
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الكمية
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          سعر الوحدة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          المجموع
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.order_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name}
                            </div>
                            {item.product?.description && (
                              <div className="text-sm text-gray-500">
                                {item.product.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">المجموع الفرعي:</span>
                      <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">الخصم:</span>
                        <span className="text-sm font-medium text-green-600">
                          -{formatCurrency(order.discount_amount)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-gray-900">المجموع الإجمالي:</span>
                        <span className="text-base font-bold text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ملاحظات</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                    {order.notes}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-12 text-center text-sm text-gray-500">
                <p>شكراً لاختياركم متجر البخور والعطور</p>
                <p className="mt-2">هذه الفاتورة صالحة لمدة 30 يوم من تاريخ الإصدار</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceGenerator

