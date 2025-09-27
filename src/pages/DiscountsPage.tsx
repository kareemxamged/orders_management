import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { discountsApi } from '@/services/api'
import { Discount, DiscountFilters, DiscountType, CreateDiscountForm } from '@/types'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Percent,
  Tag,
  CheckSquare,
  Square,
  X,
  AlertTriangle
} from 'lucide-react'
import { formatDate, searchIncludes } from '@/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import DiscountModal from '@/components/DiscountModal'
import DiscountDetailsModal from '@/components/DiscountDetailsModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import toast from 'react-hot-toast'

const DiscountsPage: React.FC = () => {
  const [filters, setFilters] = useState<DiscountFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)
  const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(null)
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([])
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false)
  const [bulkAction, setBulkAction] = useState<'delete' | 'activate' | 'deactivate' | null>(null)
  const queryClient = useQueryClient()

  const { data: allDiscounts, isLoading, error } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountsApi.getAll(),
  })

  // Filter discounts locally based on filters and search
  const discounts = React.useMemo(() => {
    if (!allDiscounts) return []

    let filteredDiscounts = [...allDiscounts]

    // Apply type filter
    if (filters.type) {
      filteredDiscounts = filteredDiscounts.filter(discount => discount.type === filters.type)
    }

    // Apply status filter
    if (filters.is_active !== undefined) {
      filteredDiscounts = filteredDiscounts.filter(discount => discount.is_active === filters.is_active)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filteredDiscounts = filteredDiscounts.filter(discount => 
        searchIncludes(discount.code || '', searchTerm) ||
        (discount.description && searchIncludes(discount.description, searchTerm))
      )
    }

    return filteredDiscounts
  }, [allDiscounts, filters, searchTerm])

  const handleFilterChange = (key: keyof DiscountFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' || value === null ? undefined : value
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const deleteMutation = useMutation({
    mutationFn: discountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success('تم حذف الكوبون بنجاح')
      setShowConfirmModal(false)
      setDiscountToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في حذف الكوبون')
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: CreateDiscountForm) => {
      if (selectedDiscount) {
        return discountsApi.update(selectedDiscount.id, data)
      } else {
        return discountsApi.create(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success(selectedDiscount ? 'تم تحديث الكوبون بنجاح' : 'تم إضافة الكوبون بنجاح')
      setShowDiscountModal(false)
      setSelectedDiscount(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في حفظ الكوبون')
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (discountIds: string[]) => discountsApi.bulkDelete(discountIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success('تم حذف الكوبونات المحددة بنجاح')
      setSelectedDiscounts([])
      setIsBulkDeleteMode(false)
      setShowBulkConfirmModal(false)
      setBulkAction(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في حذف الكوبونات')
    },
  })

  const bulkToggleActiveMutation = useMutation({
    mutationFn: ({ discountIds, isActive }: { discountIds: string[], isActive: boolean }) => 
      discountsApi.bulkToggleActive(discountIds, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success(`تم ${variables.isActive ? 'تفعيل' : 'إلغاء تفعيل'} الكوبونات المحددة بنجاح`)
      setSelectedDiscounts([])
      setIsBulkDeleteMode(false)
      setShowBulkConfirmModal(false)
      setBulkAction(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في تحديث حالة الكوبونات')
    },
  })

  const handleAddDiscount = () => {
    setSelectedDiscount(null)
    setShowDiscountModal(true)
  }

  const handleEditDiscount = (discount: Discount) => {
    setSelectedDiscount(discount)
    setShowDiscountModal(true)
  }

  const handleViewDiscount = (discount: Discount) => {
    setSelectedDiscount(discount)
    setShowDetailsModal(true)
  }

  const handleDeleteDiscount = (discount: Discount) => {
    setDiscountToDelete(discount)
    setShowConfirmModal(true)
  }

  const confirmDelete = () => {
    if (discountToDelete) {
      deleteMutation.mutate(discountToDelete.id)
    }
  }

  const handleSaveDiscount = (data: CreateDiscountForm) => {
    saveMutation.mutate(data)
  }

  const handleCloseModals = () => {
    setShowDiscountModal(false)
    setShowDetailsModal(false)
    setShowConfirmModal(false)
    setShowBulkConfirmModal(false)
    setSelectedDiscount(null)
    setDiscountToDelete(null)
    setBulkAction(null)
  }

  // Bulk selection functions
  const toggleDiscountSelection = (discountId: string) => {
    setSelectedDiscounts(prev => 
      prev.includes(discountId) 
        ? prev.filter(id => id !== discountId)
        : [...prev, discountId]
    )
  }

  const selectAllDiscounts = () => {
    setSelectedDiscounts(discounts.map(discount => discount.id))
  }

  const clearSelection = () => {
    setSelectedDiscounts([])
  }

  const toggleBulkDeleteMode = () => {
    setIsBulkDeleteMode(!isBulkDeleteMode)
    if (isBulkDeleteMode) {
      setSelectedDiscounts([])
    }
  }

  const handleBulkDelete = () => {
    setBulkAction('delete')
    setShowBulkConfirmModal(true)
  }

  const handleBulkActivate = () => {
    setBulkAction('activate')
    setShowBulkConfirmModal(true)
  }

  const handleBulkDeactivate = () => {
    setBulkAction('deactivate')
    setShowBulkConfirmModal(true)
  }

  const confirmBulkAction = () => {
    if (bulkAction === 'delete') {
      bulkDeleteMutation.mutate(selectedDiscounts)
    } else if (bulkAction === 'activate') {
      bulkToggleActiveMutation.mutate({ discountIds: selectedDiscounts, isActive: true })
    } else if (bulkAction === 'deactivate') {
      bulkToggleActiveMutation.mutate({ discountIds: selectedDiscounts, isActive: false })
    }
  }

  const getDiscountTypeText = (type: DiscountType) => {
    return type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'
  }

  const getDiscountTypeColor = (type: DiscountType) => {
    return type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل كوبونات الخصم..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">حدث خطأ في تحميل كوبونات الخصم</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="px-4 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">كوبونات الخصم</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة كوبونات الخصم والعروض الخاصة
          </p>
        </div>
        <div className="px-4 sm:px-0 flex flex-col sm:flex-row gap-2">
          <button 
            onClick={toggleBulkDeleteMode}
            className={`btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto ${
              isBulkDeleteMode ? 'btn-outline' : 'btn-primary'
            }`}
          >
            {isBulkDeleteMode ? (
              <>
                <X className="h-4 w-4" />
                <span className="text-xs sm:text-sm">إلغاء التحديد</span>
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                <span className="text-xs sm:text-sm">تحديد الكوبونات</span>
              </>
            )}
          </button>
          <button 
            onClick={handleAddDiscount}
            className="btn-primary btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs sm:text-sm">كوبون جديد</span>
          </button>
        </div>
      </div>

      {/* Selected Discounts Info */}
      {selectedDiscounts.length > 0 && (
        <div className="card mx-4 sm:mx-0">
          <div className="card-content p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">
                  تم تحديد {selectedDiscounts.length} كوبون
                </span>
              </div>
              <button
                onClick={clearSelection}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {isBulkDeleteMode && (
        <div className="card mx-4 sm:mx-0">
          <div className="card-content p-3 sm:p-4">
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
              <button
                onClick={selectAllDiscounts}
                className="btn-outline btn-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                disabled={selectedDiscounts.length === discounts.length}
              >
                <CheckSquare className="h-4 w-4" />
                <span className="text-xs sm:text-sm">تحديد الكل</span>
              </button>
              
              <button
                onClick={clearSelection}
                className="btn-outline btn-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                disabled={selectedDiscounts.length === 0}
              >
                <Square className="h-4 w-4" />
                <span className="text-xs sm:text-sm">إلغاء التحديد</span>
              </button>
              
              <button
                onClick={handleBulkDelete}
                className="btn-outline btn-sm flex items-center justify-center gap-2 w-full sm:w-auto text-red-600 hover:text-red-700 hover:border-red-300"
                disabled={selectedDiscounts.length === 0}
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-xs sm:text-sm">حذف المحدد</span>
              </button>
              
              <button
                onClick={handleBulkDeactivate}
                className="btn-outline btn-sm flex items-center justify-center gap-2 w-full sm:w-auto text-orange-600 hover:text-orange-700 hover:border-orange-300"
                disabled={selectedDiscounts.length === 0}
              >
                <X className="h-4 w-4" />
                <span className="text-xs sm:text-sm">إلغاء تفعيل المحدد</span>
              </button>
              
              <button
                onClick={handleBulkActivate}
                className="btn-outline btn-sm flex items-center justify-center gap-2 w-full sm:w-auto text-green-600 hover:text-green-700 hover:border-green-300"
                disabled={selectedDiscounts.length === 0}
              >
                <CheckSquare className="h-4 w-4" />
                <span className="text-xs sm:text-sm">تفعيل المحدد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {allDiscounts && allDiscounts.length > 0 && (
        <div className="card mx-4 sm:mx-0">
          <div className="card-content p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {allDiscounts.length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">إجمالي الكوبونات</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {allDiscounts.filter(d => d.is_active).length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">كوبونات نشطة</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  {allDiscounts.filter(d => d.type === 'percentage').length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">خصومات نسبية</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mx-4 sm:mx-0">
        <div className="card-content p-3 sm:p-4">
          <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:space-x-reverse">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pr-8 sm:pr-10 text-sm sm:text-base"
                  placeholder="البحث في كود الكوبون أو الوصف..."
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              <span className="text-xs sm:text-sm">فلترة</span>
            </button>

            {/* Clear Search Button */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="btn-outline btn-sm sm:btn-md w-full sm:w-auto"
              >
                <span className="text-xs sm:text-sm">مسح البحث</span>
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Type Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    نوع الخصم
                  </label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="input text-sm sm:text-base"
                  >
                    <option value="">جميع الأنواع</option>
                    <option value="percentage">نسبة مئوية</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    الحالة
                  </label>
                  <select
                    value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                    onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="input text-sm sm:text-base"
                  >
                    <option value="">جميع الحالات</option>
                    <option value="true">نشط</option>
                    <option value="false">غير نشط</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-ghost btn-sm sm:btn-md w-full text-xs sm:text-sm"
                  >
                    مسح الفلاتر
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discounts Grid */}
      <div className="px-4 sm:px-0">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {discounts?.map((discount) => (
            <div key={discount.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-content p-3 sm:p-4">
                {/* Selection Checkbox */}
                {isBulkDeleteMode && (
                  <div className="flex items-center justify-end mb-3">
                    <button
                      onClick={() => toggleDiscountSelection(discount.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {selectedDiscounts.includes(discount.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 space-x-reverse min-w-0 flex-1">
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                        {discount.code}
                      </h3>
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getDiscountTypeColor(discount.type)}`}>
                        {getDiscountTypeText(discount.type)}
                      </span>
                    </div>
                  </div>
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                    discount.is_active 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {discount.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                {/* Description */}
                {discount.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                    {discount.description}
                  </p>
                )}

                {/* Value */}
                <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse mb-3 sm:mb-4">
                  <Percent className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
                    {discount.type === 'percentage' 
                      ? `${discount.value}%` 
                      : `${discount.value} ر.س`
                    }
                  </span>
                </div>

                {/* Created Date */}
                <p className="text-xs text-gray-500 mb-3 sm:mb-4">
                  تم الإنشاء: {formatDate(discount.created_at)}
                </p>

                {/* Actions */}
                {!isBulkDeleteMode && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleViewDiscount(discount)}
                      className="text-primary-600 hover:text-primary-900 p-1"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => handleEditDiscount(discount)}
                      className="text-gray-600 hover:text-gray-900 p-1"
                      title="تعديل"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="حذف"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {discounts?.length === 0 && (
        <div className="text-center py-8 sm:py-12 px-4 sm:px-0">
          <div className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400">
            <Tag className="h-8 w-8 sm:h-12 sm:w-12" />
          </div>
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">لا توجد كوبونات</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            لم يتم العثور على أي كوبونات تطابق معايير البحث.
          </p>
          <div className="mt-4 sm:mt-6">
            <button 
              onClick={handleAddDiscount}
              className="btn-primary btn-sm sm:btn-md flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs sm:text-sm">إضافة كوبون جديد</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <DiscountModal
        discount={selectedDiscount}
        isOpen={showDiscountModal}
        onClose={handleCloseModals}
        onSave={handleSaveDiscount}
        isLoading={saveMutation.isPending}
      />

      <DiscountDetailsModal
        discount={selectedDiscount}
        isOpen={showDetailsModal}
        onClose={handleCloseModals}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModals}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف الكوبون "${discountToDelete?.code}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmationModal
        isOpen={showBulkConfirmModal}
        onClose={handleCloseModals}
        onConfirm={confirmBulkAction}
        title={`تأكيد ${bulkAction === 'delete' ? 'الحذف' : bulkAction === 'activate' ? 'التفعيل' : 'إلغاء التفعيل'}`}
        message={`هل أنت متأكد من ${bulkAction === 'delete' ? 'حذف' : bulkAction === 'activate' ? 'تفعيل' : 'إلغاء تفعيل'} ${selectedDiscounts.length} كوبون؟`}
        confirmText={bulkAction === 'delete' ? 'حذف' : bulkAction === 'activate' ? 'تفعيل' : 'إلغاء التفعيل'}
        cancelText="إلغاء"
        isLoading={bulkDeleteMutation.isPending || bulkToggleActiveMutation.isPending}
      />
    </div>
  )
}

export default DiscountsPage
