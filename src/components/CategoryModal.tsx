import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/services/api'
import { Category, CreateCategoryForm } from '@/types'
import { X, Save, Folder, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const categorySchema = z.object({
  name: z.string().min(1, 'اسم التصنيف مطلوب'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  is_active: z.boolean().default(true),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryModalProps {
  category?: Category | null
  isOpen: boolean
  onClose: () => void
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const { data: parentCategories } = useQuery({
    queryKey: ['categories', { parent_id: null }],
    queryFn: () => categoriesApi.getAll({ parent_id: undefined }),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      parent_id: '',
      is_active: true,
    },
  })

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name || '',
        description: category.description || '',
        parent_id: category.parent_id || '',
        is_active: category.is_active ?? true,
      })
    } else {
      reset({
        name: '',
        description: '',
        parent_id: '',
        is_active: true,
      })
    }
  }, [category, reset])

  const watchedParentId = watch('parent_id')

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('تم إنشاء التصنيف بنجاح')
      onClose()
      reset()
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في إنشاء التصنيف')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryForm> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('تم تحديث التصنيف بنجاح')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في تحديث التصنيف')
    },
  })

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true)
    try {
      const categoryData: CreateCategoryForm = {
        name: data.name,
        description: data.description || undefined,
        parent_id: data.parent_id || undefined,
        is_active: data.is_active,
      }

      if (category) {
        await updateMutation.mutateAsync({ id: category.id, data: categoryData })
      } else {
        await createMutation.mutateAsync(categoryData)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Filter out current category from parent options
  const availableParents = parentCategories?.filter(parent => 
    !category || parent.id !== category.id
  ) || []

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
                {watchedParentId ? (
                  <FolderOpen className="h-6 w-6 text-primary-600" />
                ) : (
                  <Folder className="h-6 w-6 text-primary-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {category ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
                </h2>
                <p className="text-sm text-gray-500">
                  {category ? 'تعديل بيانات التصنيف' : 'إضافة تصنيف جديد للمنتجات'}
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
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم التصنيف *
                </label>
                <input
                  {...register('name')}
                  className="input"
                  placeholder="أدخل اسم التصنيف"
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
                  placeholder="أدخل وصف التصنيف"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  التصنيف الأساسي
                </label>
                <select {...register('parent_id')} className="input">
                  <option value="">تصنيف أساسي (بدون تصنيف أب)</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  اختر تصنيف أساسي لإنشاء تصنيف فرعي، أو اتركه فارغاً لإنشاء تصنيف أساسي
                </p>
                {errors.parent_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.parent_id.message}</p>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    {...register('is_active')}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">تصنيف نشط</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  التصنيفات غير النشطة لن تظهر في قائمة التصنيفات المتاحة
                </p>
              </div>

              {/* Preview */}
              {watchedParentId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      تصنيف فرعي
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-blue-700">
                    سيتم إنشاء تصنيف فرعي تحت التصنيف الأساسي المحدد
                  </p>
                </div>
              )}

              {!watchedParentId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Folder className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      تصنيف أساسي
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-green-700">
                    سيتم إنشاء تصنيف أساسي يمكن إضافة تصنيفات فرعية إليه لاحقاً
                  </p>
                </div>
              )}
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
                    {category ? 'تحديث التصنيف' : 'إضافة التصنيف'}
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

export default CategoryModal
