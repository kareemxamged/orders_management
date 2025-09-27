-- إضافة منتجات تجريبية للتصنيفات الفرعية
-- هذا الملف يضيف منتجات تجريبية للتصنيفات الفرعية لاختبار عدد المنتجات

-- أولاً، نحتاج إلى معرفات التصنيفات الفرعية
-- يمكنك الحصول عليها من قاعدة البيانات أو استخدام هذه الاستعلامات

-- إضافة منتجات للتصنيف "صندل أحمر"
INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'صندل أحمر عالي الجودة',
    'صندل أحمر طبيعي عالي الجودة من أفضل الأنواع',
    150.00,
    100.00,
    50,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'صندل أحمر' AND parent_id IS NOT NULL;

INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'صندل أحمر مميز',
    'صندل أحمر مميز بجودة عالية',
    200.00,
    120.00,
    30,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'صندل أحمر' AND parent_id IS NOT NULL;

INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'صندل أحمر فاخر',
    'صندل أحمر فاخر من أجود الأنواع',
    300.00,
    200.00,
    20,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'صندل أحمر' AND parent_id IS NOT NULL;

-- إضافة منتجات للتصنيف "عود طبيعي"
INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'عود طبيعي أصلي',
    'عود طبيعي أصلي من أفضل المصادر',
    250.00,
    150.00,
    40,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'عود طبيعي' AND parent_id IS NOT NULL;

INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'عود طبيعي مميز',
    'عود طبيعي مميز بجودة عالية',
    350.00,
    220.00,
    25,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'عود طبيعي' AND parent_id IS NOT NULL;

INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'عود طبيعي فاخر',
    'عود طبيعي فاخر من أجود الأنواع',
    500.00,
    300.00,
    15,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'عود طبيعي' AND parent_id IS NOT NULL;

-- إضافة منتجات للتصنيف "عود محسن"
INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'عود محسن عالي الجودة',
    'عود محسن عالي الجودة مع خلطات مميزة',
    180.00,
    110.00,
    35,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'عود محسن' AND parent_id IS NOT NULL;

INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'عود محسن مميز',
    'عود محسن مميز بخلطات فاخرة',
    280.00,
    180.00,
    20,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'عود محسن' AND parent_id IS NOT NULL;

-- إضافة منتجات للتصنيف الأساسي "البخور" (إذا كان هناك منتجات مباشرة)
INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'بخور مختلط',
    'بخور مختلط من أفضل الأنواع',
    120.00,
    80.00,
    60,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'البخور' AND parent_id IS NULL;

INSERT INTO products (name, description, price, cost, stock_quantity, category_id, is_active, created_at, updated_at)
SELECT 
    'بخور عالي الجودة',
    'بخور عالي الجودة من أجود الأنواع',
    160.00,
    100.00,
    45,
    id,
    true,
    NOW(),
    NOW()
FROM categories 
WHERE name = 'البخور' AND parent_id IS NULL;

-- عرض النتائج
SELECT 
    c.name as category_name,
    c.parent_id,
    COUNT(p.id) as products_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
WHERE c.name = 'البخور' OR c.parent_id = (SELECT id FROM categories WHERE name = 'البخور' AND parent_id IS NULL)
GROUP BY c.id, c.name, c.parent_id
ORDER BY c.parent_id, c.name;

