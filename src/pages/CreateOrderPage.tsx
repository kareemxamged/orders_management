import React, { useState, useRef, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { ordersApi, productsApi, customersApi, discountsApi } from '@/services/api'
import { useQueryClient } from '@tanstack/react-query'
import { CreateOrderForm, Customer } from '@/types'
import {
  Plus,
  Trash2,
  Search,
  User,
  Package,
  DollarSign,
  FileText,
  Percent,
  Save
} from 'lucide-react'
import { formatCurrency } from '@/utils'
// import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'اسم العميل مطلوب'),
    phone: z.string().min(1, 'رقم الهاتف مطلوب'),
    email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
  }),
  items: z.array(z.object({
    product_id: z.string().min(1, 'المنتج مطلوب'),
    quantity: z.number().min(1, 'الكمية يجب أن تكون أكبر من صفر'),
  })).min(1, 'يجب إضافة منتج واحد على الأقل'),
  discount_type: z.enum(['none', 'coupon', 'fixed', 'percentage']).default('none'),
  discount_code: z.string().optional(),
  discount_value: z.number().min(0).optional(),
  notes: z.string().optional(),
})

type CreateOrderFormData = z.infer<typeof createOrderSchema>

const CreateOrderPage: React.FC = () => {
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [discountType, setDiscountType] = useState<'none' | 'coupon' | 'fixed' | 'percentage'>('none')
  const queryClient = useQueryClient()
  const customerSearchRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close customer search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerSearch(false)
      }
    }

    if (showCustomerSearch) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCustomerSearch])

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  })

  const { data: discounts } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountsApi.getAll({ is_active: true }),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customer: {
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
      },
      items: [{ product_id: '', quantity: 1 }],
      discount_type: 'none',
      discount_code: '',
      discount_value: 0,
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items')
  // const watchedCustomer = watch('customer')
  const watchedDiscountType = watch('discount_type')
  const watchedDiscountValue = watch('discount_value')

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0
    const itemsWithDetails = watchedItems.map(item => {
      const product = products?.find(p => p.id === item.product_id)
      const itemTotal = product ? product.price * item.quantity : 0
      subtotal += itemTotal
      return {
        ...item,
        product,
        total: itemTotal
      }
    })

    // Calculate discount
    let discountAmount = 0
    const watchedDiscountCode = watch('discount_code')
    
    if (watchedDiscountType === 'fixed' && watchedDiscountValue) {
      discountAmount = Math.min(watchedDiscountValue, subtotal)
    } else if (watchedDiscountType === 'percentage' && watchedDiscountValue) {
      discountAmount = (subtotal * watchedDiscountValue) / 100
    } else if (watchedDiscountType === 'coupon' && watchedDiscountCode) {
      // Find the selected discount coupon
      const selectedDiscount = discounts?.find(d => d.code === watchedDiscountCode)
      if (selectedDiscount) {
        if (selectedDiscount.type === 'percentage') {
          discountAmount = (subtotal * selectedDiscount.value) / 100
        } else {
          discountAmount = Math.min(selectedDiscount.value, subtotal)
        }
      }
    }

    const total = subtotal - discountAmount

    return { itemsWithDetails, subtotal, discountAmount, total }
  }

  const { itemsWithDetails, subtotal, discountAmount, total } = calculateTotals()


  const handleSelectCustomer = (customer: Customer) => {
    setValue('customer', {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
    })
    setCustomerSearchTerm(customer.name)
    setShowCustomerSearch(false)
  }

  const handleAddItem = () => {
    append({ product_id: '', quantity: 1 })
  }

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  // const handleDiscountCodeChange = (code: string) => {
  //   // In a real app, you would validate the discount code with the API
  //   if (code === 'WELCOME10') {
  //     setDiscountAmount(calculateDiscount(subtotal, 'percentage', 10))
  //   } else if (code === 'SAVE50') {
  //     setDiscountAmount(calculateDiscount(subtotal, 'fixed', 50))
  //   } else {
  //     setDiscountAmount(0)
  //   }
  // }

  const onSubmit = async (data: CreateOrderFormData) => {
    try {
      const orderData: CreateOrderForm = {
        customer: data.customer,
        items: data.items,
        discount_type: data.discount_type,
        discount_code: data.discount_code || undefined,
        discount_value: data.discount_value || undefined,
        notes: data.notes || undefined,
      }

      await ordersApi.create(orderData)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] }) // Refresh customers list
      toast.success('تم إنشاء الطلب بنجاح')
      
      // Reset form
      setCustomerSearchTerm('')
      setShowCustomerSearch(false)
      setDiscountType('none')
      
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في إنشاء الطلب')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="px-4 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إنشاء طلب جديد</h1>
        <p className="mt-1 text-sm text-gray-500">
          إضافة طلب جديد للعميل مع المنتجات المطلوبة
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* Customer Information */}
        <div className="card mx-4 sm:mx-0">
          <div className="card-header p-3 sm:p-4">
            <h3 className="card-title text-sm sm:text-base">معلومات العميل</h3>
          </div>
          <div className="card-content p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Customer Search */}
            <div className="relative" ref={customerSearchRef}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                البحث عن عميل موجود
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  onFocus={() => setShowCustomerSearch(true)}
                  className="input pr-8 sm:pr-10 text-sm sm:text-base"
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
              </div>

              {/* Customer Search Results */}
              {showCustomerSearch && customers && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                  {customers.length > 0 ? (
                    customers
                      .filter(customer => 
                        customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                        customer.phone.includes(customerSearchTerm)
                      )
                      .map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleSelectCustomer(customer)}
                          className="cursor-pointer px-3 sm:px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 sm:space-x-3 space-x-reverse"
                        >
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500">{customer.phone}</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500">لا توجد نتائج</div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Form */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  اسم العميل *
                </label>
                <input
                  {...register('customer.name')}
                  className="input text-sm sm:text-base"
                  placeholder="أدخل اسم العميل"
                />
                {errors.customer?.name && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.customer.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف *
                </label>
                <input
                  {...register('customer.phone')}
                  className="input text-sm sm:text-base"
                  placeholder="أدخل رقم الهاتف"
                />
                {errors.customer?.phone && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.customer.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  {...register('customer.email')}
                  type="email"
                  className="input text-sm sm:text-base"
                  placeholder="أدخل البريد الإلكتروني"
                />
                {errors.customer?.email && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.customer.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  المدينة
                </label>
                <input
                  {...register('customer.city')}
                  className="input text-sm sm:text-base"
                  placeholder="أدخل المدينة"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  العنوان
                </label>
                <textarea
                  {...register('customer.address')}
                  rows={3}
                  className="input text-sm sm:text-base"
                  placeholder="أدخل العنوان التفصيلي"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mx-4 sm:mx-0">
          <div className="flex items-center space-x-2 space-x-reverse mb-3 sm:mb-4">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">المنتجات</span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-reverse p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    المنتج
                  </label>
                  <select
                    {...register(`items.${index}.product_id`)}
                    className="input text-sm sm:text-base"
                  >
                    <option value="">اختر منتج</option>
                    {products?.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.price)}
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.product_id && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.items[index]?.product_id?.message}</p>
                  )}
                </div>

                <div className="w-full sm:w-24">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    الكمية
                  </label>
                  <input
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="input text-sm sm:text-base"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.items[index]?.quantity?.message}</p>
                  )}
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    المجموع
                  </label>
                  <div className="text-xs sm:text-sm font-medium text-gray-900">
                    {formatCurrency(itemsWithDetails[index]?.total || 0)}
                  </div>
                </div>

                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg self-start sm:self-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center space-x-2 space-x-reverse text-indigo-600 hover:text-indigo-700 text-sm sm:text-base"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة منتج آخر</span>
            </button>
          </div>
        </div>

        {/* Discount Section */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mx-4 sm:mx-0">
          <div className="flex items-center space-x-2 space-x-reverse mb-3 sm:mb-4">
            <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">الخصم</span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Discount Type Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                نوع الخصم
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="radio"
                    value="none"
                    checked={discountType === 'none'}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="text-indigo-600"
                  />
                  <span className="text-xs sm:text-sm">بدون خصم</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="radio"
                    value="coupon"
                    checked={discountType === 'coupon'}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="text-indigo-600"
                  />
                  <span className="text-xs sm:text-sm">كوبون</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="radio"
                    value="fixed"
                    checked={discountType === 'fixed'}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="text-indigo-600"
                  />
                  <span className="text-xs sm:text-sm">مبلغ ثابت</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="radio"
                    value="percentage"
                    checked={discountType === 'percentage'}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="text-indigo-600"
                  />
                  <span className="text-xs sm:text-sm">نسبة مئوية</span>
                </label>
              </div>
            </div>

            {/* Conditional fields based on discount type */}
            {discountType === 'coupon' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  اختر الكوبون
                </label>
                <select
                  {...register('discount_code')}
                  className="input text-sm sm:text-base"
                >
                  <option value="">اختر كوبون الخصم</option>
                  {discounts?.map((discount) => (
                    <option key={discount.id} value={discount.code}>
                      {discount.code} - {discount.type === 'percentage' 
                        ? `${discount.value}%` 
                        : `${discount.value} ر.س`
                      } {discount.description && `(${discount.description})`}
                    </option>
                  ))}
                </select>
                {discounts?.length === 0 && (
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    لا توجد كوبونات خصم نشطة متاحة
                  </p>
                )}
              </div>
            )}

            {discountType === 'fixed' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  مبلغ الخصم (ر.س)
                </label>
                <input {...register('discount_value', { valueAsNumber: true })} type="number" min="0" max={subtotal} className="input text-sm sm:text-base" placeholder="0.00" />
                <p className="mt-1 text-xs text-gray-500">
                  الحد الأقصى: {formatCurrency(subtotal)}
                </p>
              </div>
            )}

            {discountType === 'percentage' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  نسبة الخصم (%)
                </label>
                <input {...register('discount_value', { valueAsNumber: true })} type="number" min="0" max="100" className="input text-sm sm:text-base" placeholder="0" />
                <p className="mt-1 text-xs text-gray-500">
                  الحد الأقصى: 100%
                </p>
              </div>
            )}

            {/* Discount Preview */}
            {discountType !== 'none' && discountAmount > 0 && (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="space-y-2">
                  {discountType === 'coupon' && watch('discount_code') && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-green-700">الكوبون المحدد:</span>
                      <span className="text-xs sm:text-sm font-medium text-green-700">
                        {watch('discount_code')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-green-700">مبلغ الخصم:</span>
                    <span className="text-xs sm:text-sm font-medium text-green-700">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                  {discountType === 'coupon' && watch('discount_code') && (
                    <div className="text-xs text-green-600">
                      {(() => {
                        const selectedDiscount = discounts?.find(d => d.code === watch('discount_code'))
                        return selectedDiscount ? (
                          selectedDiscount.type === 'percentage' 
                            ? `خصم ${selectedDiscount.value}% من المجموع الفرعي`
                            : `خصم ثابت ${selectedDiscount.value} ر.س`
                        ) : ''
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mx-4 sm:mx-0">
          <div className="flex items-center space-x-2 space-x-reverse mb-3 sm:mb-4">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">ملخص الطلب</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs sm:text-sm text-gray-600">المجموع الفرعي</span>
              <span className="text-xs sm:text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">الخصم</span>
                <span className="text-xs sm:text-sm font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between">
                <span className="text-sm sm:text-base font-medium text-gray-900">المجموع الإجمالي</span>
                <span className="text-sm sm:text-base font-bold text-gray-900">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mx-4 sm:mx-0">
          <div className="flex items-center space-x-2 space-x-reverse mb-3 sm:mb-4">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">ملاحظات</span>
          </div>

          <textarea
            {...register('notes')}
            rows={3}
            className="input text-sm sm:text-base"
            placeholder="أي ملاحظات إضافية حول الطلب..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3 space-x-reverse px-4 sm:px-0">
          <button
            type="submit"
            disabled={isSubmitting || fields.length === 0}
            className="btn-primary btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-xs sm:text-sm">جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span className="text-xs sm:text-sm">إنشاء الطلب</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateOrderPage

