import React, { useState, useRef, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, Trash2, User, Package, DollarSign, FileText, Percent, Search } from 'lucide-react'
import { CreateOrderForm, Customer } from '@/types'
import { productsApi, customersApi, discountsApi } from '@/services/api'
import { formatCurrency } from '@/utils'
// import toast from 'react-hot-toast'

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

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateOrderForm) => void
  isLoading?: boolean
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  // const [discountType, setDiscountType] = useState<'none' | 'coupon' | 'fixed' | 'percentage'>('none')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue
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
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')
  // const watchedCustomer = watch('customer')
  const watchedDiscountType = watch('discount_type')
  const watchedDiscountValue = watch('discount_value')

  // Fetch products and customers
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

  const onSubmit = (data: CreateOrderFormData) => {
    onSave(data)
  }

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

  const handleClose = () => {
    reset()
    setCustomerSearchTerm('')
    setShowCustomerSearch(false)
    // setDiscountType('none')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">إنشاء طلب جديد</h2>
            <p className="text-sm text-gray-500 mt-1">أضف طلب جديد للعميل</p>
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
          {/* Customer Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-4">
              <User className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">معلومات العميل</span>
            </div>

            {/* Customer Search */}
            <div className="relative mb-4" ref={customerSearchRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البحث عن عميل موجود
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  onFocus={() => setShowCustomerSearch(true)}
                  className="input pr-10"
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
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
                          className="cursor-pointer px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 space-x-reverse"
                        >
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">لا توجد نتائج</div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم العميل *
                  </label>
                  <input
                    {...register('customer.name')}
                    type="text"
                    className="input"
                    placeholder="أدخل اسم العميل"
                  />
                  {errors.customer?.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    {...register('customer.phone')}
                    type="tel"
                    className="input text-right"
                    placeholder="أدخل رقم الهاتف"
                  />
                  {errors.customer?.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    {...register('customer.email')}
                    type="email"
                    className="input text-right"
                    placeholder="أدخل البريد الإلكتروني"
                    dir="ltr"
                  />
                  {errors.customer?.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المدينة
                  </label>
                  <input
                    {...register('customer.city')}
                    type="text"
                    className="input"
                    placeholder="أدخل المدينة"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <textarea
                    {...register('customer.address')}
                    rows={2}
                    className="input"
                    placeholder="أدخل العنوان"
                  />
                </div>
              </div>
          </div>

          {/* Order Items Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Package className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">عناصر الطلب</span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-outline btn-sm flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة منتج
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-white p-4 rounded border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        المنتج *
                      </label>
                      <select
                        {...register(`items.${index}.product_id`)}
                        className="input"
                      >
                        <option value="">اختر منتج...</option>
                        {products?.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.price)}
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.product_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.items[index]?.product_id?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الكمية *
                      </label>
                      <input
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="input"
                        placeholder="1"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">{errors.items[index]?.quantity?.message}</p>
                      )}
                    </div>

                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          المجموع
                        </label>
                        <div className="input bg-gray-50 text-gray-900">
                          {formatCurrency(itemsWithDetails[index]?.total || 0)}
                        </div>
                      </div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="btn-ghost btn-sm text-red-600 hover:text-red-800 mr-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-4">
              <Percent className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">الخصم</span>
            </div>

            <div className="space-y-4">
              {/* Discount Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الخصم
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="none"
                      checked={watchedDiscountType === 'none'}
                      onChange={(e) => {
                        // setDiscountType(e.target.value as any)
                        setValue('discount_type', e.target.value as any)
                      }}
                      className="ml-2"
                    />
                    بدون خصم
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="coupon"
                      checked={watchedDiscountType === 'coupon'}
                      onChange={(e) => {
                        // setDiscountType(e.target.value as any)
                        setValue('discount_type', e.target.value as any)
                      }}
                      className="ml-2"
                    />
                    كوبون خصم
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="fixed"
                      checked={watchedDiscountType === 'fixed'}
                      onChange={(e) => {
                        // setDiscountType(e.target.value as any)
                        setValue('discount_type', e.target.value as any)
                      }}
                      className="ml-2"
                    />
                    خصم ثابت
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="percentage"
                      checked={watchedDiscountType === 'percentage'}
                      onChange={(e) => {
                        // setDiscountType(e.target.value as any)
                        setValue('discount_type', e.target.value as any)
                      }}
                      className="ml-2"
                    />
                    نسبة مئوية
                  </label>
                </div>
              </div>

              {/* Coupon Selection */}
              {watchedDiscountType === 'coupon' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اختر الكوبون
                  </label>
                  <select
                    {...register('discount_code')}
                    className="input"
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
                    <p className="mt-1 text-sm text-gray-500">
                      لا توجد كوبونات خصم نشطة متاحة
                    </p>
                  )}
                </div>
              )}

              {/* Fixed Amount Discount */}
              {watchedDiscountType === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    مبلغ الخصم (ر.س)
                  </label>
                  <input
                    {...register('discount_value', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max={subtotal}
                    className="input"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    الحد الأقصى: {formatCurrency(subtotal)}
                  </p>
                </div>
              )}

              {/* Percentage Discount */}
              {watchedDiscountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نسبة الخصم (%)
                  </label>
                  <input
                    {...register('discount_value', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    className="input"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    الحد الأقصى: 100%
                  </p>
                </div>
              )}

              {/* Discount Preview */}
              {watchedDiscountType !== 'none' && discountAmount > 0 && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="space-y-2">
                    {watchedDiscountType === 'coupon' && watch('discount_code') && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">الكوبون المحدد:</span>
                        <span className="text-sm font-medium text-green-700">
                          {watch('discount_code')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">مبلغ الخصم:</span>
                      <span className="text-sm font-medium text-green-700">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                    {watchedDiscountType === 'coupon' && watch('discount_code') && (
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-4">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">ملخص الطلب</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">المجموع الفرعي</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">الخصم</span>
                  <span className="text-sm font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">المجموع الإجمالي</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse mb-4">
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">ملاحظات إضافية</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ملاحظات الطلب
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input"
                placeholder="أضف أي ملاحظات حول الطلب..."
              />
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
                <Plus className="h-4 w-4" />
                إنشاء الطلب
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

export default CreateOrderModal
