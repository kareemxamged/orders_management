import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/services/api'
import { Category } from '@/types'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Move,
  Check,
  X,
  Download,
  Upload,
  Package,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react'
import { formatDate, searchIncludes, exportCategoriesToCSV, parseCategoriesFromCSV, validateCategoryData, extractCategoriesFromProductsCSV } from '@/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import CategoryModal from '@/components/CategoryModal'
import CategoryDetailsModal from '@/components/CategoryDetailsModal'
import CategoryProductsModal from '@/components/CategoryProductsModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import toast from 'react-hot-toast'

const CategoriesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)
  const [isDragMode, setIsDragMode] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showCategoryProductsModal, setShowCategoryProductsModal] = useState(false)
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'delete' | 'deactivate' | 'activate' | null>(null)
  const queryClient = useQueryClient()

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  })

  const handleSearch = () => {
    // Simple search functionality without filters
    if (searchTerm.trim()) {
      // Filter categories locally based on search term
      const filteredCategories = categories?.filter(category => 
        searchIncludes(category.name, searchTerm) ||
        (category.description && searchIncludes(category.description, searchTerm))
      )
      return filteredCategories || []
    }
    return categories || []
  }

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('تم حذف التصنيف بنجاح')
      setShowConfirmModal(false)
      setCategoryToDelete(null)
    },
    onError: (error: any) => {
      // Show specific error message for constraint violations
      if (error.message && error.message.includes('منتجات مرتبطة')) {
        toast.error('لا يمكن حذف التصنيف لأنه يحتوي على منتجات مرتبطة. يرجى نقل المنتجات إلى تصنيف آخر أولاً.')
      } else if (error.message && error.message.includes('تصنيفات فرعية')) {
        toast.error('لا يمكن حذف التصنيف لأنه يحتوي على تصنيفات فرعية. يرجى حذف التصنيفات الفرعية أولاً.')
      } else {
        toast.error(error.message || 'حدث خطأ في حذف التصنيف')
      }
      setShowConfirmModal(false)
      setCategoryToDelete(null)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: categoriesApi.bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('تم حذف التصنيفات المحددة بنجاح')
      setShowBulkConfirmModal(false)
      setSelectedCategories(new Set())
      setBulkAction(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في حذف التصنيفات')
    },
  })

  const bulkToggleActiveMutation = useMutation({
    mutationFn: ({ categoryIds, isActive }: { categoryIds: string[], isActive: boolean }) => 
      categoriesApi.bulkToggleActive(categoryIds, isActive),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      const action = isActive ? 'تفعيل' : 'إلغاء تفعيل'
      toast.success(`تم ${action} التصنيفات المحددة بنجاح`)
      setShowBulkConfirmModal(false)
      setSelectedCategories(new Set())
      setBulkAction(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في تحديث حالة التصنيفات')
    },
  })

  const handleAddCategory = () => {
    setSelectedCategory(null)
    setShowCategoryModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setShowCategoryModal(true)
  }

  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category)
    setShowDetailsModal(true)
  }

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category)
    setShowConfirmModal(true)
  }

  const handleManageCategoryProducts = (category: Category) => {
    setSelectedCategory(category)
    setShowCategoryProductsModal(true)
  }

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id)
    }
  }

  // Multi-select functionality
  const handleCategorySelect = (category: Category, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      setSelectedCategories(prev => {
        const newSet = new Set(prev)
        
        // Check if we're trying to mix parent and child categories
        const isCurrentCategoryParent = !category.parent_id
        const hasParentCategories = Array.from(newSet).some(id => {
          const cat = categories?.find(c => c.id === id)
          return cat && !cat.parent_id
        })
        const hasChildCategories = Array.from(newSet).some(id => {
          const cat = categories?.find(c => c.id === id)
          return cat && cat.parent_id
        })
        
        // If trying to select a parent category while child categories are selected
        if (isCurrentCategoryParent && hasChildCategories) {
          toast.error('لا يمكن تحديد تصنيف أساسي مع تصنيفات فرعية')
          return prev
        }

        // If trying to select a child category while parent categories are selected
        if (!isCurrentCategoryParent && hasParentCategories) {
          toast.error('لا يمكن تحديد تصنيف فرعي مع تصنيفات أساسية')
          return prev
        }

        if (newSet.has(category.id)) {
          newSet.delete(category.id)
        } else {
          newSet.add(category.id)
        }
        return newSet
      })
    } else {
      setSelectedCategories(new Set([category.id]))
    }
  }

  // Drag and drop functionality
  const handleDragStart = (category: Category, event: React.DragEvent) => {
    if (selectedCategories.has(category.id)) {
      // Dragging multiple selected categories
      setDraggedCategory(category)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', JSON.stringify({
        categoryIds: Array.from(selectedCategories),
        sourceCategory: category
      }))
    } else {
      // Dragging single category
      setDraggedCategory(category)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', JSON.stringify({
        categoryIds: [category.id],
        sourceCategory: category
      }))
    }
  }

  const handleDragOver = (category: Category, event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    
    // Only allow dropping on root categories (parent categories)
    if (!category.parent_id) {
      setDragOverCategory(category.id)
    }
  }

  const handleDragLeave = () => {
    setDragOverCategory(null)
  }

  const handleDrop = async (targetCategory: Category, event: React.DragEvent) => {
    event.preventDefault()
    setDragOverCategory(null)
    
    try {
      const data = JSON.parse(event.dataTransfer.getData('text/plain'))
      const { categoryIds, sourceCategory } = data
      
      // Don't allow dropping on the same category or its children
      if (categoryIds.includes(targetCategory.id)) {
        toast.error('لا يمكن نقل التصنيف إلى نفسه')
        return
      }

      // Check if trying to drop a parent category on its own child
      const sourceCategories = categoryIds.map(id => categories?.find(c => c.id === id)).filter(Boolean)
      const hasParentCategory = sourceCategories.some(cat => !cat?.parent_id)
      
      if (hasParentCategory) {
        // Check if any of the source parent categories is the target's parent
        const targetCategoryData = categories?.find(c => c.id === targetCategory.id)
        if (targetCategoryData?.parent_id && sourceCategories.some(cat => cat?.id === targetCategoryData.parent_id)) {
          toast.error('لا يمكن نقل التصنيف الأساسي إلى تصنيف فرعي منه')
          return
        }
      }

      // Move categories to the new parent
      const movePromises = categoryIds.map((categoryId: string) => 
        categoriesApi.update(categoryId, { parent_id: targetCategory.id })
      )

      await Promise.all(movePromises)
      
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setSelectedCategories(new Set())
      
      const count = categoryIds.length
      const targetName = targetCategory.name
      
      // Different messages based on what was moved
      if (hasParentCategory) {
        toast.success(`تم نقل ${count} تصنيف أساسي بنجاح إلى "${targetName}" وتحويله إلى تصنيف فرعي`)
      } else {
        toast.success(`تم نقل ${count} تصنيف بنجاح إلى "${targetName}"`)
      }
      
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في نقل التصنيفات')
    }
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedCategories(new Set())
  }

  const selectAllCategories = () => {
    if (categories) {
      setSelectedCategories(new Set(categories.map(cat => cat.id)))
    }
  }

  const handleBulkDelete = () => {
    if (selectedCategories.size === 0) {
      toast.error('يرجى تحديد تصنيفات للحذف')
      return
    }
    setBulkAction('delete')
    setShowBulkConfirmModal(true)
  }

  const handleBulkDeactivate = () => {
    if (selectedCategories.size === 0) {
      toast.error('يرجى تحديد تصنيفات لإلغاء التفعيل')
      return
    }
    setBulkAction('deactivate')
    setShowBulkConfirmModal(true)
  }

  const handleBulkActivate = () => {
    if (selectedCategories.size === 0) {
      toast.error('يرجى تحديد تصنيفات للتفعيل')
      return
    }
    setBulkAction('activate')
    setShowBulkConfirmModal(true)
  }

  const confirmBulkAction = () => {
    const categoryIds = Array.from(selectedCategories)
    
    if (bulkAction === 'delete') {
      bulkDeleteMutation.mutate(categoryIds)
    } else if (bulkAction === 'deactivate') {
      bulkToggleActiveMutation.mutate({ categoryIds, isActive: false })
    } else if (bulkAction === 'activate') {
      bulkToggleActiveMutation.mutate({ categoryIds, isActive: true })
    }
  }

  const handleCloseModals = () => {
    setShowCategoryModal(false)
    setShowDetailsModal(false)
    setShowConfirmModal(false)
    setShowCategoryProductsModal(false)
    setShowBulkConfirmModal(false)
    setSelectedCategory(null)
    setCategoryToDelete(null)
    setBulkAction(null)
  }

  const handleExportCategories = () => {
    if (!categories || categories.length === 0) {
      toast.error('لا توجد تصنيفات للتصدير')
      return
    }
    
    try {
      exportCategoriesToCSV(categories)
      toast.success('تم تصدير التصنيفات بنجاح')
    } catch (error) {
      toast.error('حدث خطأ في تصدير التصنيفات')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  const handleImportCategories = async () => {
    if (!importFile) {
      toast.error('يرجى اختيار ملف للاستيراد')
      return
    }

    setIsImporting(true)
    try {
      // Try to parse as regular categories CSV first
      let categories = []
      try {
        categories = await parseCategoriesFromCSV(importFile)
      } catch (error) {
        // If regular parsing fails, try extracting from products CSV
        categories = await extractCategoriesFromProductsCSV(importFile)
      }
      
      // Validate data
      const { valid, errors } = validateCategoryData(categories)
      
      if (errors.length > 0) {
        toast.error(`أخطاء في البيانات: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`)
        return
      }

      if (valid.length === 0) {
        toast.error('لا توجد بيانات صحيحة للاستيراد')
        return
      }

      // Process categories with parent relationships
      const processedCategories = await Promise.all(
        valid.map(async (category) => {
          let parentId = null
          if (category.parent_name) {
            // Find existing parent category
            const parentCategory = categories?.find(cat => 
              cat.name.toLowerCase() === category.parent_name.toLowerCase()
            )
            if (parentCategory) {
              parentId = parentCategory.id
            }
          }

          return {
            name: category.name,
            description: category.description || '',
            parent_id: parentId,
            is_active: category.is_active !== false
          }
        })
      )

      // Bulk create categories
      await categoriesApi.bulkCreate(processedCategories)
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      
      toast.success(`تم استيراد ${processedCategories.length} تصنيف بنجاح`)
      setImportFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('import-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في استيراد التصنيفات')
    } finally {
      setIsImporting(false)
    }
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []

    // Create a map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // Build the tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id)
        if (parent) {
          parent.children!.push(categoryWithChildren)
        }
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })

    return rootCategories
  }

  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    return categories.map((category) => (
      <div key={category.id}>
        <div 
          className={`flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-all ${
            level > 0 ? 'mr-2 sm:mr-4' : ''
          } ${
            selectedCategories.has(category.id) 
              ? category.parent_id 
                ? 'bg-orange-50 border-2 border-orange-300' 
                : 'bg-green-50 border-2 border-green-300'
              : ''
          } ${
            dragOverCategory === category.id ? 'bg-green-100 border-2 border-green-400' : ''
          } ${
            !category.parent_id ? 'cursor-move' : 'cursor-move'
          }`}
          style={{ marginRight: `${level * (window.innerWidth < 640 ? 10 : 20)}px` }}
          draggable={true} // All categories are draggable now
          onDragStart={(e) => handleDragStart(category, e)}
          onDragOver={(e) => handleDragOver(category, e)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(category, e)}
          onClick={(e) => {
            // Handle selection for both parent and child categories
            handleCategorySelect(category, e)
          }}
        >
          <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse flex-1 min-w-0">
            {category.children && category.children.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation() // Prevent triggering the parent onClick
                  toggleExpanded(category.id)
                }}
                className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
              >
                {expandedCategories.has(category.id) ? (
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>
            )}
            
            <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse min-w-0 flex-1">
              {/* Selection indicator */}
              {selectedCategories.has(category.id) && (
                <div className={`p-0.5 sm:p-1 rounded-full flex-shrink-0 ${
                  category.parent_id 
                    ? 'bg-orange-100' 
                    : 'bg-green-100'
                }`}>
                  <Check className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                    category.parent_id 
                      ? 'text-orange-600' 
                      : 'text-green-600'
                  }`} />
                </div>
              )}
              
              {/* Drag indicator for parent categories */}
              {!category.parent_id && (
                <div className="p-0.5 sm:p-1 rounded-full bg-gray-100 flex-shrink-0" title="يمكن سحب هذا التصنيف">
                  <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
              )}
              
              {category.children && category.children.length > 0 ? (
                expandedCategories.has(category.id) ? (
                  <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                )
              ) : (
                <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
              )}
              
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs text-gray-500 truncate">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse flex-shrink-0">
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${
              category.is_active 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {category.is_active ? 'نشط' : 'غير نشط'}
            </span>

            <div className="flex items-center space-x-0.5 sm:space-x-1 space-x-reverse">
              <button
                onClick={() => handleViewCategory(category)}
                className="text-primary-600 hover:text-primary-900 p-0.5 sm:p-1"
                title="عرض التفاصيل"
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => handleManageCategoryProducts(category)}
                className="text-blue-600 hover:text-blue-900 p-0.5 sm:p-1"
                title="إدارة المنتجات"
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => handleEditCategory(category)}
                className="text-gray-600 hover:text-gray-900 p-0.5 sm:p-1"
                title="تعديل"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(category)}
                className="text-red-600 hover:text-red-900 p-0.5 sm:p-1"
                title="حذف"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>

        {category.children && category.children.length > 0 && expandedCategories.has(category.id) && (
          <div className="mr-2 sm:mr-4">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل التصنيفات..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">حدث خطأ في تحميل التصنيفات</p>
      </div>
    )
  }

  const filteredCategories = handleSearch()
  const categoryTree = buildCategoryTree(filteredCategories)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="px-4 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">التصنيفات</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة تصنيفات المنتجات الأساسية والفرعية
          </p>
          {selectedCategories.size > 0 && (
            <div className="mt-1 text-xs sm:text-sm text-blue-600">
              <p>{selectedCategories.size} تصنيف محدد - اسحبهم إلى تصنيف أساسي لنقلهم</p>
              {(() => {
                const selectedCats = Array.from(selectedCategories).map(id => 
                  categories?.find(c => c.id === id)
                ).filter(Boolean)
                const hasParents = selectedCats.some(cat => !cat?.parent_id)
                const hasChildren = selectedCats.some(cat => cat?.parent_id)
                
                if (hasParents && !hasChildren) {
                  return <p className="text-xs text-green-600">• تصنيفات أساسية فقط</p>
                } else if (hasChildren && !hasParents) {
                  return <p className="text-xs text-orange-600">• تصنيفات فرعية فقط</p>
                }
                return null
              })()}
            </div>
          )}
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 sm:space-x-reverse px-4 sm:px-0">
          <button 
            onClick={handleExportCategories}
            className="btn-outline btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">تصدير</span>
          </button>
          
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
              title="يمكن استيراد ملفات CSV للتصنيفات أو استخراج التصنيفات من ملفات المنتجات"
            >
              <Upload className="h-4 w-4" />
              <span className="text-xs sm:text-sm">استيراد</span>
            </button>
          </div>
          
          {importFile && (
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 sm:space-x-reverse w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-600 truncate">{importFile.name}</span>
              <button
                onClick={handleImportCategories}
                disabled={isImporting}
                className="btn-primary btn-sm flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span className="text-xs sm:text-sm">جاري الاستيراد...</span>
                  </>
                ) : (
                  <span className="text-xs sm:text-sm">استيراد</span>
                )}
              </button>
            </div>
          )}
          
          <button 
            onClick={handleAddCategory}
            className="btn-primary btn-sm sm:btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs sm:text-sm">تصنيف جديد</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      {categories && categories.length > 0 && (
        <div className="card mx-4 sm:mx-0">
          <div className="card-content p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {categories.length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">إجمالي التصنيفات</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {categories.filter(c => c.is_active).length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">تصنيفات نشطة</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  {categories.filter(c => !c.parent_id).length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">تصنيفات أساسية</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card mx-4 sm:mx-0">
        <div className="card-content p-3 sm:p-4">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pr-8 sm:pr-10 text-sm sm:text-base w-full"
              placeholder="البحث في اسم التصنيف..."
            />
          </div>
        </div>
      </div>

      {/* Categories Tree */}
      <div className="card mx-4 sm:mx-0">
        <div className="card-content p-0">
          {/* Bulk Actions Bar */}
          {selectedCategories.size > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 p-3 sm:p-4">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-xs sm:text-sm font-medium text-blue-900">
                    {selectedCategories.size} تصنيف محدد
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button 
                    onClick={handleBulkDelete}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    disabled={bulkDeleteMutation.isPending}
                    title="حذف التصنيفات المحددة"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={handleBulkDeactivate}
                    className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                    disabled={bulkToggleActiveMutation.isPending}
                    title="إلغاء تفعيل التصنيفات المحددة"
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={handleBulkActivate}
                    className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                    disabled={bulkToggleActiveMutation.isPending}
                    title="تفعيل التصنيفات المحددة"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={clearSelection}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                    title="إلغاء التحديد"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {categoryTree.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {renderCategoryTree(categoryTree)}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 px-4 sm:px-0">
              <div className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400">
                <Folder className="h-8 w-8 sm:h-12 sm:w-12" />
              </div>
              <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">لا توجد تصنيفات</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                {searchTerm 
                  ? 'لم يتم العثور على أي تصنيفات تطابق معايير البحث.'
                  : 'لم يتم إضافة أي تصنيفات بعد.'
                }
              </p>
              {!searchTerm && (
                <div className="mt-4 sm:mt-6">
                  <button 
                    onClick={handleAddCategory}
                    className="btn-primary btn-sm sm:btn-md flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">إضافة تصنيف جديد</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Modals */}
      <CategoryModal
        category={selectedCategory}
        isOpen={showCategoryModal}
        onClose={handleCloseModals}
      />

      <CategoryDetailsModal
        category={selectedCategory}
        isOpen={showDetailsModal}
        onClose={handleCloseModals}
      />

      <CategoryProductsModal
        category={selectedCategory}
        isOpen={showCategoryProductsModal}
        onClose={handleCloseModals}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModals}
        onConfirm={confirmDelete}
        title="تأكيد حذف التصنيف"
        message={`هل أنت متأكد من حذف التصنيف "${categoryToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk Confirmation Modal */}
      {showBulkConfirmModal && (
        <ConfirmationModal
          isOpen={showBulkConfirmModal}
          onClose={() => setShowBulkConfirmModal(false)}
          onConfirm={confirmBulkAction}
          title={
            bulkAction === 'delete' 
              ? 'تأكيد حذف التصنيفات المحددة'
              : bulkAction === 'deactivate'
              ? 'تأكيد إلغاء تفعيل التصنيفات المحددة'
              : 'تأكيد تفعيل التصنيفات المحددة'
          }
          message={
            bulkAction === 'delete'
              ? `هل أنت متأكد من حذف ${selectedCategories.size} تصنيف محدد؟ هذا الإجراء لا يمكن التراجع عنه.`
              : bulkAction === 'deactivate'
              ? `هل أنت متأكد من إلغاء تفعيل ${selectedCategories.size} تصنيف محدد؟`
              : `هل أنت متأكد من تفعيل ${selectedCategories.size} تصنيف محدد؟`
          }
          confirmText={
            bulkAction === 'delete' 
              ? 'حذف'
              : bulkAction === 'deactivate'
              ? 'إلغاء التفعيل'
              : 'تفعيل'
          }
          cancelText="إلغاء"
          type={bulkAction === 'delete' ? 'danger' : 'warning'}
          isLoading={bulkDeleteMutation.isPending || bulkToggleActiveMutation.isPending}
        />
      )}
    </div>
  )
}

export default CategoriesPage
