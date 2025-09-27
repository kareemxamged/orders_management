import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, AlertCircle, Tag, Percent } from 'lucide-react'
import { Discount, CreateDiscountForm } from '@/types'

const discountSchema = z.object({
  code: z.string().min(1, 'كود الكوبون مطلوب').max(50, 'كود الكوبون يجب أن يكون أقل من 50 حرف'),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0.01, 'قيمة الخصم يجب أن تكون أكبر من صفر'),
  description: z.string().optional(),
  is_active: z.boolean()
}).refine((data) => {
  if (data.type === 'percentage' && data.value > 100) {
    return false
  }
  return true
}, {
  message: 'النسبة المئوية يجب أن تكون أقل من أو تساوي 100%',
  path: ['value']
})

type DiscountFormData = z.infer<typeof discountSchema>

interface DiscountModalProps {
  discount: Discount | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateDiscountForm) => void
  isLoading?: boolean
}

const DiscountModal: React.FC<DiscountModalProps> = ({
  discount,
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
    watch,
    // setValue
  } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      code: '',
      type: 'percentage',
      value: 0,
      description: '',
      is_active: true
    }
  })

  const watchedType = watch('type')
  const watchedValue = watch('value')

  React.useEffect(() => {
    if (discount) {
      reset({
        code: discount.code || '',
        type: discount.type,
        value: discount.value,
        description: discount.description || '',
        is_active: discount.is_active
      })
    } else {
      reset({
        code: '',
        type: 'percentage',
        value: 0,
        description: '',
        is_active: true
      })
    }
  }, [discount, reset])

  const onSubmit = (data: DiscountFormData) => {
    onSave(data as CreateDiscountForm)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {discount ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {discount ? 'تعديل بيانات الكوبون' : 'أضف كوبون خصم جديد'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كود الكوبون *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('code')}
                type="text"
                className="input pr-10"
                placeholder="أدخل كود الكوبون"
                dir="ltr"
              />
            </div>
            {errors.code && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 ml-1" />
                {errors.code.message}
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الخصم *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('type')}
                  type="radio"
                  value="percentage"
                  className="ml-2"
                />
                <div>
                  <div className="font-medium text-gray-900">نسبة مئوية</div>
                  <div className="text-sm text-gray-500">%</div>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('type')}
                  type="radio"
                  value="fixed"
                  className="ml-2"
                />
                <div>
                  <div className="font-medium text-gray-900">مبلغ ثابت</div>
                  <div className="text-sm text-gray-500">ر.س</div>
                </div>
              </label>
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 ml-1" />
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              قيمة الخصم *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Percent className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('value', { valueAsNumber: true })}
                type="number"
                min="0"
                max={watchedType === 'percentage' ? 100 : undefined}
                step={watchedType === 'percentage' ? 0.01 : 0.01}
                className="input pr-10"
                placeholder={watchedType === 'percentage' ? '0.00' : '0.00'}
              />
            </div>
            {errors.value && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 ml-1" />
                {errors.value.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {watchedType === 'percentage' 
                ? 'النسبة المئوية (0-100%)' 
                : 'المبلغ بالريال السعودي'
              }
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوصف
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="input"
              placeholder="أضف وصف للكوبون (اختياري)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 ml-1" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                {...register('is_active')}
                type="checkbox"
                className="ml-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">كوبون نشط</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              الكوبونات غير النشطة لن تكون متاحة للاستخدام
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">معاينة الكوبون</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">الكود:</span>
                <span className="text-sm font-medium text-gray-900">
                  {watch('code') || 'غير محدد'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">النوع:</span>
                <span className="text-sm font-medium text-gray-900">
                  {watchedType === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">القيمة:</span>
                <span className="text-sm font-medium text-gray-900">
                  {watchedValue > 0 
                    ? (watchedType === 'percentage' ? `${watchedValue}%` : `${watchedValue} ر.س`)
                    : 'غير محدد'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">الحالة:</span>
                <span className={`text-sm font-medium ${
                  watch('is_active') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {watch('is_active') ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
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
                {discount ? 'تحديث الكوبون' : 'إضافة الكوبون'}
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

export default DiscountModal
