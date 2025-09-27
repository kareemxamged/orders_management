import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '@/services/api'
import { Product, CreateProductForm } from '@/types'
import { X, Save, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const productSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  description: z.string().optional(),
  price: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي صفر'),
  cost: z.number().min(0, 'التكلفة يجب أن تكون أكبر من أو تساوي صفر').optional(),
  stock_quantity: z.number().min(0, 'الكمية يجب أن تكون أكبر من أو يساوي صفر'),
  category_id: z.string().optional(), // للتوافق مع النظام القديم
  category_ids: z.array(z.string()).optional(), // التصنيفات المتعددة الجديدة
  sale_price: z.union([
    z.number().min(0, 'السعر المخفض يجب أن يكون أكبر من أو يساوي صفر'),
    z.literal(''),
    z.undefined(),
    z.null()
  ]).optional(),
  discount_percentage: z.union([
    z.number().min(0, 'نسبة التخفيض يجب أن تكون أكبر من أو تساوي صفر').max(100, 'نسبة التخفيض يجب أن تكون أقل من أو تساوي 100%'),
    z.literal(''),
    z.undefined(),
    z.null()
  ]).optional(),
  is_active: z.boolean().default(true),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductModalProps {
  product?: Product | null
  isOpen: boolean
  onClose: () => void
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      cost: product?.cost || 0,
      stock_quantity: product?.stock_quantity || 0,
      category_id: product?.category_id || '',
      category_ids: product?.categories?.map(pc => pc.category_id) || [],
      sale_price: product?.sale_price || undefined,
      discount_percentage: product?.discount_percentage || undefined,
      is_active: product?.is_active ?? true,
    },
  })

  const watchedPrice = watch('price')
  const watchedDiscountPercentage = watch('discount_percentage')
  const watchedSalePrice = watch('sale_price')

  // Reset form when product changes
  React.useEffect(() => {
    if (product) {
      const productCategories = product.categories?.map(pc => pc.category_id) || []
      
      reset({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        cost: product.cost || 0,
        stock_quantity: product.stock_quantity || 0,
        category_id: product.category_id || '',
        category_ids: productCategories,
        sale_price: product.sale_price || undefined,
        discount_percentage: product.discount_percentage || undefined,
        is_active: product.is_active ?? true,
      })
      
      setSelectedCategories(productCategories)
      
      // Set discount type based on existing data
      if (product.sale_price && product.sale_price > 0) {
        setDiscountType('fixed')
      } else if (product.discount_percentage && product.discount_percentage > 0) {
        setDiscountType('percentage')
      } else {
        setDiscountType('fixed')
      }
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        cost: 0,
        stock_quantity: 0,
        category_id: '',
        category_ids: [],
        sale_price: undefined,
        discount_percentage: undefined,
        is_active: true,
      })
      setSelectedCategories([])
      setDiscountType('fixed')
    }
  }, [product, reset])

  // Calculate sale price based on discount percentage
  const calculateSalePrice = (price: number, percentage: number) => {
    return price - (price * percentage / 100)
  }

  // Calculate discount percentage based on sale price
  const calculateDiscountPercentage = (price: number, salePrice: number) => {
    return ((price - salePrice) / price) * 100
  }

  // Handle discount type change
  const handleDiscountTypeChange = (type: 'fixed' | 'percentage') => {
    setDiscountType(type)
    if (type === 'percentage' && watchedPrice && watchedSalePrice) {
      const percentage = calculateDiscountPercentage(watchedPrice, watchedSalePrice)
      setValue('discount_percentage', Math.round(percentage * 100) / 100)
      setValue('sale_price', undefined)
    } else if (type === 'fixed' && watchedPrice && watchedDiscountPercentage) {
      const salePrice = calculateSalePrice(watchedPrice, watchedDiscountPercentage)
      setValue('sale_price', Math.round(salePrice * 100) / 100)
      setValue('discount_percentage', undefined)
    }
  }

  // Auto-calculate when price or discount percentage changes
  React.useEffect(() => {
    if (discountType === 'percentage' && watchedPrice && watchedDiscountPercentage !== undefined && watchedDiscountPercentage !== null) {
      const percentage = Number(watchedDiscountPercentage)
      if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
        const salePrice = calculateSalePrice(watchedPrice, percentage)
        const roundedSalePrice = Math.round(salePrice * 100) / 100
        // فقط حدث إذا كان السعر مختلف بشكل كبير
        if (Math.abs((watchedSalePrice || 0) - roundedSalePrice) > 0.01) {
          setValue('sale_price', roundedSalePrice)
        }
      }
    }
  }, [watchedPrice, watchedDiscountPercentage, discountType, setValue])

  // Auto-calculate when price or sale price changes
  React.useEffect(() => {
    if (discountType === 'fixed' && watchedPrice && watchedSalePrice !== undefined && watchedSalePrice !== null) {
      const salePrice = Number(watchedSalePrice)
      if (!isNaN(salePrice) && salePrice >= 0) {
        const percentage = calculateDiscountPercentage(watchedPrice, salePrice)
        const roundedPercentage = Math.round(percentage * 100) / 100
        // فقط حدث إذا كانت النسبة مختلفة بشكل كبير
        if (Math.abs((watchedDiscountPercentage || 0) - roundedPercentage) > 0.01) {
          setValue('discount_percentage', roundedPercentage)
        }
      }
    }
  }, [watchedPrice, watchedSalePrice, discountType, setValue])

  // Calculate final price for display
  const getFinalPrice = () => {
    if (!watchedPrice) return 0
    
    if (discountType === 'fixed' && watchedSalePrice !== undefined && watchedSalePrice !== null) {
      const salePrice = Number(watchedSalePrice)
      return !isNaN(salePrice) && salePrice >= 0 ? salePrice : watchedPrice
    } else if (discountType === 'percentage' && watchedDiscountPercentage !== undefined && watchedDiscountPercentage !== null) {
      const percentage = Number(watchedDiscountPercentage)
      if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
        return calculateSalePrice(watchedPrice, percentage)
      }
    }
    
    return watchedPrice
  }

  // Handle category selection
  const handleCategoryToggle = (categoryId: string) => {
    const newSelectedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]
    
    setSelectedCategories(newSelectedCategories)
    setValue('category_ids', newSelectedCategories)
  }

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('تم إنشاء المنتج بنجاح')
      onClose()
      reset()
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في إنشاء المنتج')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductForm> }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('تم تحديث المنتج بنجاح')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في تحديث المنتج')
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      // Clean up the data before submission
      const cleanedData = {
        ...data,
        sale_price: data.sale_price === '' || data.sale_price === null ? undefined : data.sale_price,
        discount_percentage: data.discount_percentage === '' || data.discount_percentage === null ? undefined : data.discount_percentage,
        cost: data.cost === 0 ? undefined : data.cost,
        category_ids: selectedCategories,
      }

      if (product) {
        await updateMutation.mutateAsync({ id: product.id, data: cleanedData })
      } else {
        await createMutation.mutateAsync(cleanedData)
      }
    } finally {
      setIsSubmitting(false)
    }
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
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                </h2>
                <p className="text-sm text-gray-500">
                  {product ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمتجر'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المنتج *
                </label>
                <input
                  {...register('name')}
                  className="input"
                  placeholder="أدخل اسم المنتج"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input"
                  placeholder="أدخل وصف المنتج"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Price and Cost */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    السعر (ر.س) *
                  </label>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التكلفة (ر.س)
                  </label>
                  <input
                    {...register('cost', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    placeholder="0.00"
                  />
                  {errors.cost && (
                    <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
                  )}
                </div>
              </div>

              {/* Sale Price Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <label className="text-sm font-medium text-gray-700">نوع التخفيض:</label>
                  <div className="flex space-x-4 space-x-reverse">
                    <label className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="radio"
                        value="fixed"
                        checked={discountType === 'fixed'}
                        onChange={() => handleDiscountTypeChange('fixed')}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">سعر ثابت</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="radio"
                        value="percentage"
                        checked={discountType === 'percentage'}
                        onChange={() => handleDiscountTypeChange('percentage')}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">نسبة مئوية</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {discountType === 'fixed' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        السعر المخفض (ر.س)
                      </label>
                      <input
                        {...register('sale_price', {
                          setValueAs: (value) => {
                            if (value === '' || value === null || value === undefined) {
                              return undefined
                            }
                            const num = parseFloat(value)
                            return isNaN(num) ? undefined : num
                          }
                        })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        placeholder="مثال: 85.50"
                      />
                      {errors.sale_price && (
                        <p className="mt-1 text-sm text-red-600">{errors.sale_price.message}</p>
                      )}
                      {watchedPrice && (
                        <p className="mt-1 text-xs text-gray-500">
                          نسبة التخفيض: {watchedSalePrice !== undefined && watchedSalePrice !== null && Number(watchedSalePrice) > 0 
                            ? Math.round(((watchedPrice - Number(watchedSalePrice)) / watchedPrice) * 100 * 100) / 100
                            : 0}%
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        نسبة التخفيض (%)
                      </label>
                      <input
                        {...register('discount_percentage', {
                          setValueAs: (value) => {
                            if (value === '' || value === null || value === undefined) {
                              return undefined
                            }
                            const num = parseFloat(value)
                            return isNaN(num) ? undefined : num
                          }
                        })}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="input"
                        placeholder="مثال: 15.5"
                      />
                      {errors.discount_percentage && (
                        <p className="mt-1 text-sm text-red-600">{errors.discount_percentage.message}</p>
                      )}
                      {watchedPrice && (
                        <p className="mt-1 text-xs text-gray-500">
                          السعر المخفض: {watchedDiscountPercentage !== undefined && watchedDiscountPercentage !== null && Number(watchedDiscountPercentage) > 0
                            ? Math.round((watchedPrice - (watchedPrice * Number(watchedDiscountPercentage) / 100)) * 100) / 100
                            : watchedPrice} ر.س
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر النهائي
                    </label>
                    <div className="input bg-gray-50 text-gray-600">
                      {watchedPrice ? (
                        getFinalPrice() !== watchedPrice ? (
                          `${Math.round(getFinalPrice() * 100) / 100} ر.س`
                        ) : (
                          `${watchedPrice} ر.س (بدون تخفيض)`
                        )
                      ) : (
                        '0.00 ر.س'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock and Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    كمية المخزون *
                  </label>
                  <input
                    {...register('stock_quantity', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="input"
                    placeholder="0"
                  />
                  {errors.stock_quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.stock_quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التصنيفات
                  </label>
                  <div className="space-y-3">
                    {/* Category Selection */}
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {categories?.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2 space-x-reverse mb-2">
                          <input
                            type="checkbox"
                            id={`category-${category.id}`}
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <label 
                            htmlFor={`category-${category.id}`}
                            className="text-sm text-gray-700 cursor-pointer flex-1"
                          >
                            {category.parent_id ? `  ${category.name}` : category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {errors.category_ids && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_ids.message}</p>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    {...register('is_active')}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">منتج نشط</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  المنتجات غير النشطة لن تظهر في قائمة المنتجات المتاحة
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 space-x-reverse mt-8">
              <button
                type="button"
                onClick={handleClose}
                className="btn-outline btn-md"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary btn-md flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {product ? 'تحديث المنتج' : 'إضافة المنتج'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProductModal
