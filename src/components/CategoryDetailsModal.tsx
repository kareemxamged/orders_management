import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/services/api'
import { supabase } from '@/services/supabase'
import { Category } from '@/types'
import { X, Folder, FolderOpen, Hash, Tag, Package } from 'lucide-react'
import { formatDate } from '@/utils'

interface CategoryDetailsModalProps {
  category: Category | null
  isOpen: boolean
  onClose: () => void
}

const CategoryDetailsModal: React.FC<CategoryDetailsModalProps> = ({ category, isOpen, onClose }) => {
  // Fetch category with parent details
  const { data: categoryWithParent } = useQuery({
    queryKey: ['category', category?.id],
    queryFn: () => category ? categoriesApi.getById(category.id) : null,
    enabled: !!(isOpen && category)
  })

  // Fetch products count for this category
  const { data: productsCount } = useQuery({
    queryKey: ['products-count', category?.id, categoryWithParent?.id],
    queryFn: async () => {
      if (!category) {
        console.log('❌ No category provided')
        return 0
      }
      
      console.log('🔍 Category Details Debug - Starting:', {
        categoryId: category.id,
        categoryName: category.name,
        isParent: !category.parent_id,
        parentId: category.parent_id,
        categoryWithParentReady: !!categoryWithParent
      })
      
      // If it's a parent category (no parent_id), get products from all subcategories
      if (!category.parent_id) {
        console.log('📁 Processing parent category:', category.name)
        
        // Get all categories first
        const { data: allCategories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
        
        if (categoriesError) {
          console.error('❌ Error fetching categories:', categoriesError)
          return 0
        }
        
        if (!allCategories) {
          console.log('⚠️ No categories found')
          return 0
        }
        
        console.log('📋 All categories:', allCategories.map(c => ({ 
          id: c.id, 
          name: c.name, 
          parent_id: c.parent_id 
        })))
        
        // Get all subcategories recursively
        const getAllSubcategoryIds = (parentId: string): string[] => {
          const allIds = new Set<string>() // Use Set to avoid duplicates
          allIds.add(parentId) // Include the parent category itself
          
          const getChildrenIds = (parentId: string): void => {
            const children = allCategories.filter(c => c.parent_id === parentId)
            console.log(`👶 Children of ${parentId}:`, children.map(c => ({ id: c.id, name: c.name })))
            children.forEach(child => {
              allIds.add(child.id)
              getChildrenIds(child.id) // Recursively get children of children
            })
          }
          
          getChildrenIds(parentId)
          return Array.from(allIds) // Convert Set back to Array
        }
        
        const allCategoryIds = getAllSubcategoryIds(category.id)
        console.log('🎯 All category IDs for parent:', allCategoryIds)
        
        // First, let's check if there are any products at all
        const { data: allProducts, error: allProductsError } = await supabase
          .from('products')
          .select('id, name, category_id')
        
        if (allProductsError) {
          console.error('❌ Error fetching all products:', allProductsError)
          return 0
        }
        
        console.log('📦 All products in database:', allProducts?.map(p => ({ 
          id: p.id, 
          name: p.name, 
          category_id: p.category_id 
        })))
        console.log('🔢 Total products in database:', allProducts?.length || 0)
        
        // Now get products for our categories
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, category_id')
          .in('category_id', allCategoryIds)
        
        if (productsError) {
          console.error('❌ Error fetching products:', productsError)
          return 0
        }
        
        console.log('📦 Products found for categories:', products?.map(p => ({ 
          id: p.id, 
          name: p.name, 
          category_id: p.category_id 
        })))
        console.log('🔢 Total products count:', products?.length || 0)
        
        return products?.length || 0
      } else {
        console.log('📂 Processing subcategory:', category.name)
        
        // If it's a subcategory, get products only from this category
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, category_id')
          .eq('category_id', category.id)
        
        if (productsError) {
          console.error('❌ Error fetching products for subcategory:', productsError)
          return 0
        }
        
        console.log('📦 Subcategory products:', products?.map(p => ({ 
          id: p.id, 
          name: p.name, 
          category_id: p.category_id 
        })))
        console.log('🔢 Subcategory products count:', products?.length || 0)
        
        return products?.length || 0
      }
    },
    enabled: !!(isOpen && category)
  })

  if (!isOpen || !category) return null

  const displayCategory = categoryWithParent || category

  // Debug logging
  console.log('Category Details Modal Debug:', {
    originalCategory: category,
    categoryWithParent,
    displayCategory,
    hasParent: !!displayCategory.parent,
    parentId: displayCategory.parent_id,
    parentName: displayCategory.parent?.name
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-primary-100 rounded-lg">
                {displayCategory.children && displayCategory.children.length > 0 ? (
                  <FolderOpen className="h-6 w-6 text-primary-600" />
                ) : (
                  <Folder className="h-6 w-6 text-primary-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">تفاصيل التصنيف</h2>
                <p className="text-sm text-gray-500">معلومات التصنيف الكاملة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Category Name */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{displayCategory.name}</h3>
                {displayCategory.description && (
                  <p className="text-gray-600">{displayCategory.description}</p>
                )}
              </div>

              {/* Category Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Type */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">نوع التصنيف</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">
                    {displayCategory.parent_id ? 'تصنيف فرعي' : 'تصنيف أساسي'}
                  </p>
                </div>

                {/* Products Count */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Package className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">عدد المنتجات</span>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">
                    {productsCount || 0} منتج
                  </p>
                </div>

                {/* Parent Category - Only show for subcategories */}
                {displayCategory.parent_id && displayCategory.parent && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <Folder className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">التصنيف الأساسي</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600">
                      {displayCategory.parent.name}
                    </p>
                  </div>
                )}

                {/* Children Count */}
                {displayCategory.children && displayCategory.children.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <Hash className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">التصنيفات الفرعية</span>
                    </div>
                    <p className="text-lg font-bold text-purple-600">
                      {displayCategory.children.length} تصنيف
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Tag className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">الحالة</span>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    displayCategory.is_active 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {displayCategory.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>

              {/* Children List */}
              {displayCategory.children && displayCategory.children.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">التصنيفات الفرعية</h3>
                  <div className="space-y-2">
                    {displayCategory.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Folder className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{child.name}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          child.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {child.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">تاريخ الإنشاء</span>
                  <p className="text-sm text-gray-600">{formatDate(displayCategory.created_at)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">آخر تحديث</span>
                  <p className="text-sm text-gray-600">{formatDate(displayCategory.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-outline btn-md"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryDetailsModal
