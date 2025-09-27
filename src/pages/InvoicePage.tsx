import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'
import { ArrowLeft, Download } from 'lucide-react'
import CustomerInvoice from '@/components/CustomerInvoice'
import LoadingSpinner from '@/components/LoadingSpinner'
import { exportInvoiceToPDF } from '@/utils/pdfExport'
import toast from 'react-hot-toast'

const InvoicePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: !!orderId,
  })

  const handleBack = () => {
    navigate('/orders')
  }

  const handleDownloadPDF = async () => {
    try {
      await exportInvoiceToPDF(order?.order_number || 'unknown')
      toast.success('تم تحميل الفاتورة بنجاح')
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('حدث خطأ في تحميل الملف')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">خطأ في تحميل الطلب</h2>
          <p className="text-gray-600 mb-4">لم يتم العثور على الطلب المطلوب</p>
          <button
            onClick={handleBack}
            className="btn-primary btn-md flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للطلبات
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  فاتورة الطلب #{order.order_number}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {order.customer?.name} - {order.created_at}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={handleDownloadPDF}
                className="btn-primary btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                <span className="text-xs sm:text-sm">تحميل PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div id="invoice-content">
            <CustomerInvoice order={order} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoicePage
