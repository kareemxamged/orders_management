import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/services/api'
import { Customer, CreateCustomerForm } from '@/types'
import { X, User, Phone, Mail, MapPin, Building } from 'lucide-react'
import toast from 'react-hot-toast'

const customerSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب'),
  phone: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  city: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => {
  // يجب ملء إما رقم الهاتف أو البريد الإلكتروني
  return (data.phone && data.phone.trim() !== '') || (data.email && data.email.trim() !== '')
}, {
  message: 'يجب ملء إما رقم الهاتف أو البريد الإلكتروني',
  path: ['phone']
}).refine((data) => {
  // فحص صحة رقم الهاتف إذا كان مملوء
  if (data.phone && data.phone.trim() !== '') {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/
    return phoneRegex.test(data.phone)
  }
  return true
}, {
  message: 'رقم الهاتف غير صحيح',
  path: ['phone']
})

interface CustomerModalProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer, isOpen, onClose }) => {
  const queryClient = useQueryClient()
  const isEditing = !!customer

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateCustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      city: '',
      address: '',
    }
  })

  // Reset form when customer changes
  React.useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        city: customer.city || '',
        address: customer.address || '',
      })
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        city: '',
        address: '',
      })
    }
  }, [customer, reset])

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('تم إضافة العميل بنجاح')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في إضافة العميل')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerForm> }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('تم تحديث العميل بنجاح')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في تحديث العميل')
    }
  })

  const onSubmit = (data: CreateCustomerForm) => {
    if (isEditing && customer) {
      updateMutation.mutate({ id: customer.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

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
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'تعديل العميل' : 'إضافة عميل جديد'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEditing ? 'تحديث معلومات العميل' : 'إضافة عميل جديد إلى النظام'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم العميل *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('name')}
                    type="text"
                    className="input pr-10"
                    placeholder="أدخل اسم العميل"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="input pr-10 text-right"
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className="input pr-10 text-right"
                    placeholder="أدخل البريد الإلكتروني"
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدينة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('city')}
                    type="text"
                    className="input pr-10"
                    placeholder="أدخل المدينة"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان
                </label>
                <div className="relative">
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="input pr-10"
                    placeholder="أدخل العنوان التفصيلي"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 space-x-reverse mt-6 pt-6 border-t border-gray-200">
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
                className="btn-primary btn-md"
                disabled={isLoading}
              >
                {isLoading ? 'جاري الحفظ...' : (isEditing ? 'تحديث' : 'إضافة')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CustomerModal
