import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ordersApi } from '@/services/api'
import { Order, OrderStatus, OrderFilters, CreateOrderForm } from '@/types'
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Plus,
  Upload
} from 'lucide-react'
import { formatDate, formatCurrency, getOrderStatusColor, getOrderStatusText, searchIncludes, exportOrdersToCSV, parseOrdersFromCSV, validateOrderData } from '@/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import OrderDetailsModal from '@/components/OrderDetailsModal'
import OrderEditModal from '@/components/OrderEditModal'
import CreateOrderModal from '@/components/CreateOrderModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import toast from 'react-hot-toast'

const OrdersPage: React.FC = () => {
  const [filters, setFilters] = useState<OrderFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: allOrders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll(),
  })

  // Filter orders locally based on filters and search
  const orders = React.useMemo(() => {
    if (!allOrders) return []

    let filteredOrders = [...allOrders]

    // Apply status filter
    if (filters.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status)
    }

    // Apply date filters
    if (filters.date_from) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_at) >= new Date(filters.date_from!)
      )
    }

    if (filters.date_to) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_at) <= new Date(filters.date_to!)
      )
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filteredOrders = filteredOrders.filter(order => 
        searchIncludes(order.order_number, searchTerm) ||
        (order.customer?.name && searchIncludes(order.customer.name, searchTerm))
      )
    }

    return filteredOrders
  }, [allOrders, filters, searchTerm])

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
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
    mutationFn: ordersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('تم حذف الطلب بنجاح')
      setShowConfirmModal(false)
      setOrderToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في حذف الطلب')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('تم تحديث حالة الطلب بنجاح')
      setShowEditModal(false)
      setSelectedOrder(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في تحديث الطلب')
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderForm) => ordersApi.create(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] }) // Refresh customers list
      toast.success('تم إنشاء الطلب بنجاح')
      setShowCreateModal(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في إنشاء الطلب')
    },
  })

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order)
    setShowConfirmModal(true)
  }

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.id)
    }
  }

  const handleUpdateOrderStatus = (data: { status: string; notes?: string }) => {
    if (selectedOrder) {
      updateStatusMutation.mutate({
        id: selectedOrder.id,
        status: data.status
      })
    }
  }

  const handleDownloadInvoice = (order: Order) => {
    navigate(`/invoice/${order.id}`)
  }

  const handleCreateOrder = () => {
    setShowCreateModal(true)
  }

  const handleSaveNewOrder = (data: CreateOrderForm) => {
    createOrderMutation.mutate(data)
  }

  const handleExportOrders = () => {
    try {
      exportOrdersToCSV(orders)
      toast.success('تم تصدير الطلبات بنجاح')
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في تصدير الطلبات')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  const handleImportOrders = async () => {
    if (!importFile) {
      toast.error('يرجى اختيار ملف للاستيراد')
      return
    }

    setIsImporting(true)
    try {
      const ordersData = await parseOrdersFromCSV(importFile)
      const { valid, errors } = validateOrderData(ordersData)

      if (errors.length > 0) {
        toast.error(`أخطاء في البيانات: ${errors.join(', ')}`)
        return
      }

      if (valid.length === 0) {
        toast.error('لا توجد طلبات صحيحة للاستيراد')
        return
      }

      const createdOrders = await ordersApi.bulkCreate(valid)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      
      toast.success(`تم استيراد ${createdOrders.length} طلب بنجاح`)
      setImportFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('import-file') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في استيراد الطلبات')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCloseModals = () => {
    setShowDetailsModal(false)
    setShowEditModal(false)
    setShowCreateModal(false)
    setShowConfirmModal(false)
    setSelectedOrder(null)
    setOrderToDelete(null)
  }

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل الطلبات..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">حدث خطأ في تحميل الطلبات</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="px-4 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">الطلبات</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة ومتابعة جميع طلبات المتجر
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 sm:space-x-reverse px-4 sm:px-0">
          {/* Export Button */}
          <button 
            onClick={handleExportOrders}
            className="btn-outline btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
            disabled={orders.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">تصدير CSV</span>
          </button>

          {/* Import Button */}
          <div className="relative w-full sm:w-auto">
            <input
              id="import-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button 
              onClick={() => document.getElementById('import-file')?.click()}
              className="btn-outline btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              <span className="text-xs sm:text-sm">استيراد CSV</span>
            </button>
          </div>

          {/* Import Process Button */}
          {importFile && (
            <button 
              onClick={handleImportOrders}
              disabled={isImporting}
              className="btn-primary btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-xs sm:text-sm">جاري الاستيراد...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">استيراد الملف</span>
                </>
              )}
            </button>
          )}

          {/* Create Order Button */}
          <button 
            onClick={handleCreateOrder}
            className="btn-primary btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs sm:text-sm">طلب جديد</span>
          </button>
        </div>
      </div>

      {/* Import File Info */}
      {importFile && (
        <div className="card bg-blue-50 border-blue-200 mx-4 sm:mx-0">
          <div className="card-content p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse min-w-0 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-900 truncate">ملف جاهز للاستيراد</h3>
                  <p className="text-xs sm:text-sm text-blue-700 truncate">{importFile.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setImportFile(null)
                  const fileInput = document.getElementById('import-file') as HTMLInputElement
                  if (fileInput) {
                    fileInput.value = ''
                  }
                }}
                className="text-blue-600 hover:text-blue-800 flex-shrink-0 mr-2 sm:mr-0"
              >
                <span className="text-xs sm:text-sm">إلغاء</span>
              </button>
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
                  placeholder="البحث في رقم الطلب أو اسم العميل..."
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
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    حالة الطلب
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input text-sm sm:text-base"
                  >
                    <option value="">جميع الحالات</option>
                    <option value="pending">في الانتظار</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="processing">قيد المعالجة</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="delivered">تم التسليم</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    من تاريخ
                  </label>
                  <input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="input text-sm sm:text-base"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    إلى تاريخ
                  </label>
                  <input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="input text-sm sm:text-base"
                  />
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

      {/* Orders Table */}
      <div className="card mx-4 sm:mx-0">
        <div className="card-content p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الطلب
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ الإجمالي
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الطلب
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.customer?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer?.phone}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="text-sm text-green-600">
                          خصم: {formatCurrency(order.discount_amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-primary-600 hover:text-primary-900"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-gray-600 hover:text-gray-900"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          className="text-green-600 hover:text-green-900"
                          title="تحميل الفاتورة"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          className="text-red-600 hover:text-red-900"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            <div className="space-y-3 p-3 sm:p-4">
              {orders?.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                        طلب #{order.order_number}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {order.customer?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.customer?.phone}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">المبلغ الإجمالي</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                      {order.discount_amount > 0 && (
                        <p className="text-xs text-green-600">
                          خصم: {formatCurrency(order.discount_amount)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">تاريخ الطلب</p>
                      <p className="text-sm text-gray-900">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-primary-600 hover:text-primary-900 p-1"
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="تحميل الفاتورة"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {orders?.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400">
                <Search className="h-8 w-8 sm:h-12 sm:w-12" />
              </div>
              <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">لا توجد طلبات</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                لم يتم العثور على أي طلبات تطابق معايير البحث.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {allOrders && allOrders.length > 0 && (
        <div className="card mx-4 sm:mx-0">
          <div className="card-content p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {allOrders.length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">إجمالي الطلبات</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(allOrders.reduce((sum, order) => sum + order.total_amount, 0))}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">إجمالي المبيعات</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {allOrders.filter(order => order.status === 'pending').length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">طلبات في الانتظار</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        onSave={handleSaveNewOrder}
        isLoading={createOrderMutation.isPending}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={handleCloseModals}
      />

      <OrderEditModal
        order={selectedOrder}
        isOpen={showEditModal}
        onClose={handleCloseModals}
        onSave={handleUpdateOrderStatus}
        isLoading={updateStatusMutation.isPending}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModals}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف الطلب "${orderToDelete?.order_number}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export default OrdersPage

