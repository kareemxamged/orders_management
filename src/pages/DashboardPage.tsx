import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/services/api'
import { formatCurrency, formatRelativeTime, getOrderStatusColor, getOrderStatusText } from '@/utils'
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  })

  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: dashboardApi.getRecentOrders,
  })

  const { data: lowStockProducts, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['dashboard-low-stock-products'],
    queryFn: dashboardApi.getLowStockProducts,
  })

  const isLoading = statsLoading || ordersLoading || productsLoading
  const error = statsError || ordersError || productsError

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل الإحصائيات..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">حدث خطأ في تحميل الإحصائيات</p>
      </div>
    )
  }

  const statCards = [
    {
      name: 'إجمالي الطلبات',
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      name: 'إجمالي الإيرادات',
      value: formatCurrency(stats?.total_revenue || 0),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'إجمالي العملاء',
      value: stats?.total_customers || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'إجمالي المنتجات',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'bg-orange-500',
    },
    {
      name: 'طلبات في الانتظار',
      value: stats?.pending_orders || 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
    {
      name: 'منتجات قليلة المخزون',
      value: stats?.low_stock_products || 0,
      icon: TrendingUp,
      color: 'bg-red-500',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="px-4 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-gray-500">
          نظرة عامة على أداء المتجر والإحصائيات المهمة
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="card-content p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-2 sm:p-3 rounded-lg ${stat.color}`}>
                      <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="mr-3 sm:mr-5 w-0 flex-1 min-w-0">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd>
                        <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">
                          {stat.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header p-3 sm:p-4">
            <h3 className="card-title text-sm sm:text-base">الطلبات الأخيرة</h3>
            <p className="card-description text-xs sm:text-sm">
              آخر 5 طلبات تم إنشاؤها
            </p>
          </div>
          <div className="card-content p-3 sm:p-4">
            <div className="space-y-2 sm:space-y-3">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        order.status === 'pending' ? 'bg-yellow-500' :
                        order.status === 'confirmed' ? 'bg-blue-500' :
                        order.status === 'processing' ? 'bg-purple-500' :
                        order.status === 'shipped' ? 'bg-indigo-500' :
                        order.status === 'delivered' ? 'bg-green-500' :
                        order.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          طلب #{order.order_number}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {order.customer?.name || 'عميل غير محدد'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0 mr-2 sm:mr-3">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(order.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm text-gray-500">لا توجد طلبات حديثة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="card">
          <div className="card-header p-3 sm:p-4">
            <h3 className="card-title text-sm sm:text-base">منتجات قليلة المخزون</h3>
            <p className="card-description text-xs sm:text-sm">
              المنتجات التي تحتاج لإعادة تموين
            </p>
          </div>
          <div className="card-content p-3 sm:p-4">
            <div className="space-y-2 sm:space-y-3">
              {lowStockProducts && lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        متبقي {product.stock_quantity} قطع
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      product.stock_quantity <= 3 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.stock_quantity <= 3 ? 'مخزون منخفض' : 'مخزون قليل'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm text-gray-500">جميع المنتجات لديها مخزون كافي</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card">
        <div className="card-header p-3 sm:p-4">
          <h3 className="card-title text-sm sm:text-base">أداء المبيعات</h3>
          <p className="card-description text-xs sm:text-sm">
            إحصائيات المبيعات خلال آخر 30 يوم
          </p>
        </div>
        <div className="card-content p-3 sm:p-4">
          <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm text-gray-500">سيتم إضافة الرسوم البيانية قريباً</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

