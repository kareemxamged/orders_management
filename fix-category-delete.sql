-- إصلاح مشكلة حذف التصنيفات
-- هذا الملف لإصلاح قيود المفاتيح الخارجية

-- إزالة القيد الحالي
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- إضافة القيد الجديد مع SET NULL
ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- إضافة قيد مشابه للتصنيفات الفرعية (إذا لم يكن موجوداً)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE categories ADD CONSTRAINT categories_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;

-- عرض النتائج
SELECT 'تم إصلاح قيود المفاتيح الخارجية بنجاح!' as message;
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'products' OR tc.table_name = 'categories')
    AND (kcu.column_name = 'category_id' OR kcu.column_name = 'parent_id');
