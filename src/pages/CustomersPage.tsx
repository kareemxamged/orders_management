import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/services/api'
import { Customer } from '@/types'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { formatDate, searchIncludes } from '@/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import CustomerModal from '@/components/CustomerModal'
import CustomerDetailsModal from '@/components/CustomerDetailsModal'
import ConfirmationModal from '@/components/ConfirmationModal'

const CustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const queryClient = useQueryClient()

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('تم حذف العميل بنجاح')
      setShowConfirmModal(false)
      setCustomerToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في حذف العميل')
    }
  })

  const filteredCustomers = customers?.filter(customer =>
    searchIncludes(customer.name, searchTerm) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && searchIncludes(customer.email, searchTerm))
  )

  const handleAddCustomer = () => {
    setSelectedCustomer(null)
    setShowCustomerModal(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerModal(true)
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailsModal(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer)
    setShowConfirmModal(true)
  }

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id)
    }
  }

  const handleCloseModals = () => {
    setShowCustomerModal(false)
    setShowDetailsModal(false)
    setShowConfirmModal(false)
    setSelectedCustomer(null)
    setCustomerToDelete(null)
  }

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل العملاء..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">حدث خطأ في تحميل العملاء</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العملاء</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة قاعدة بيانات العملاء
          </p>
        </div>
        <button 
          onClick={handleAddCustomer}
          className="btn-primary btn-md flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          عميل جديد
        </button>
      </div>

      {/* Summary */}
      {customers && customers.length > 0 && (
        <div className="card">
          <div className="card-content">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {customers.length}
                </p>
                <p className="text-sm text-gray-500">إجمالي العملاء</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {customers.filter(c => c.email).length}
                </p>
                <p className="text-sm text-gray-500">عملاء لديهم بريد إلكتروني</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.address).length}
                </p>
                <p className="text-sm text-gray-500">عملاء لديهم عنوان</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <div className="card-content">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pr-10"
              placeholder="البحث في اسم العميل، رقم الهاتف، أو البريد الإلكتروني..."
            />
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers?.map((customer) => (
          <div key={customer.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-content">
              {/* Customer Avatar */}
              <div className="flex items-center space-x-3 space-x-reverse mb-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {customer.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    عميل منذ {formatDate(customer.created_at)}
                  </p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{customer.phone}</span>
                </div>

                {customer.email && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 truncate">{customer.email}</span>
                  </div>
                )}

                {customer.city && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{customer.city}</span>
                  </div>
                )}

                {customer.address && (
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {customer.address}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleViewCustomer(customer)}
                    className="text-primary-600 hover:text-primary-900"
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="text-gray-600 hover:text-gray-900"
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer)}
                    className="text-red-600 hover:text-red-900"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers?.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <User className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد عملاء</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'لم يتم العثور على أي عملاء تطابق معايير البحث.'
              : 'لم يتم إضافة أي عملاء بعد.'
            }
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button 
                onClick={handleAddCustomer}
                className="btn-primary btn-md flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                إضافة عميل جديد
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        customer={selectedCustomer}
        isOpen={showCustomerModal}
        onClose={handleCloseModals}
      />

      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={showDetailsModal}
        onClose={handleCloseModals}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModals}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف العميل "${customerToDelete?.name}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        isLoading={deleteMutation.isPending}
      />

    </div>
  )
}

export default CustomersPage

