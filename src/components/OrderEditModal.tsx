import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, AlertCircle } from 'lucide-react'
import { Order } from '@/types'
import { getOrderStatusColor, getOrderStatusText } from '@/utils'

const orderEditSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().optional()
})

type OrderEditForm = z.infer<typeof orderEditSchema>

interface OrderEditModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: OrderEditForm) => void
  isLoading?: boolean
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<OrderEditForm>({
    resolver: zodResolver(orderEditSchema),
    defaultValues: {
      status: 'pending',
      notes: ''
    }
  })

  const watchedStatus = watch('status')

  React.useEffect(() => {
    if (order) {
      reset({
        status: order.status,
        notes: order.notes || ''
      })
    }
  }, [order, reset])

  const onSubmit = (data: OrderEditForm) => {
    onSave(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">تعديل الطلب</h2>
            <p className="text-sm text-gray-500 mt-1">رقم الطلب: {order?.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حالة الطلب *
            </label>
            <select
              {...register('status')}
              className="input"
            >
              <option value="pending">في الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="processing">قيد المعالجة</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered">تم التسليم</option>
              <option value="cancelled">ملغي</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 ml-1" />
                {errors.status.message}
              </p>
            )}
            
            {/* Status Preview */}
            <div className="mt-2">
              <span className="text-xs text-gray-500">المعاينة:</span>
              <div className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(watchedStatus)}`}>
                  {getOrderStatusText(watchedStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              className="input"
              placeholder="أضف ملاحظات حول الطلب..."
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 ml-1" />
                {errors.notes.message}
              </p>
            )}
          </div>

          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">معلومات الطلب</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">العميل:</span>
                <span className="text-gray-900">{order?.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">المبلغ الإجمالي:</span>
                <span className="text-gray-900 font-medium">{order?.total_amount} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">تاريخ الطلب:</span>
                <span className="text-gray-900">{order?.created_at ? new Date(order.created_at).toLocaleDateString('en-GB') : ''}</span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline btn-md"
            disabled={isLoading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            className="btn-primary btn-md flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                حفظ التغييرات
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

export default OrderEditModal
