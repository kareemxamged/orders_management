// Category Types
export interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string
  parent?: Category
  children?: Category[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCategoryForm {
  name: string
  description?: string
  parent_id?: string
  is_active?: boolean
}

export interface CategoryFilters {
  parent_id?: string
  is_active?: boolean
  search?: string
}

// Category Tree for display
export interface CategoryTreeNode {
  id: string
  name: string
  description?: string
  is_active: boolean
  level: number
  children: CategoryTreeNode[]
  parent_id?: string
}
