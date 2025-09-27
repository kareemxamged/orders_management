-- إضافة نظام التصنيفات فقط
-- هذا الملف لإضافة التصنيفات إلى قاعدة البيانات الموجودة

-- إنشاء جدول التصنيفات (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس (إذا لم تكن موجودة)
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- تفعيل RLS (إذا لم يكن مفعلاً)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسة (إذا لم تكن موجودة)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON categories
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- إنشاء التريغر (إذا لم يكن موجوداً)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_categories_updated_at'
    ) THEN
        CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- إضافة عمود category_id إلى جدول المنتجات (إذا لم يكن موجوداً)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- إنشاء فهرس لعمود category_id (إذا لم يكن موجوداً)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- إدراج التصنيفات الأساسية (إذا لم تكن موجودة)
INSERT INTO categories (name, description, is_active) 
SELECT 'البخور', 'جميع أنواع البخور والعود', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'البخور');

INSERT INTO categories (name, description, is_active) 
SELECT 'العطور', 'العطور الطبيعية والمصنعة', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'العطور');

INSERT INTO categories (name, description, is_active) 
SELECT 'أخرى', 'منتجات أخرى متنوعة', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'أخرى');

-- إدراج التصنيفات الفرعية (إذا لم تكن موجودة)
INSERT INTO categories (name, description, parent_id, is_active) 
SELECT 'عود طبيعي', 'عود طبيعي أصلي من الهند', 
       (SELECT id FROM categories WHERE name = 'البخور'), true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'عود طبيعي');

INSERT INTO categories (name, description, parent_id, is_active) 
SELECT 'عود محسن', 'عود محسن بجودة عالية', 
       (SELECT id FROM categories WHERE name = 'البخور'), true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'عود محسن');

INSERT INTO categories (name, description, parent_id, is_active) 
SELECT 'صندل أحمر', 'صندل أحمر من سريلانكا', 
       (SELECT id FROM categories WHERE name = 'البخور'), true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'صندل أحمر');

INSERT INTO categories (name, description, parent_id, is_active) 
SELECT 'ورد دمشقي', 'عطر ورد دمشقي طبيعي', 
       (SELECT id FROM categories WHERE name = 'العطور'), true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'ورد دمشقي');

INSERT INTO categories (name, description, parent_id, is_active) 
SELECT 'مسك أبيض', 'عطر مسك أبيض طبيعي', 
       (SELECT id FROM categories WHERE name = 'العطور'), true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'مسك أبيض');

-- تحديث المنتجات الموجودة لربطها بالتصنيفات الجديدة
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'عود طبيعي')
WHERE name = 'بخور العود الأصلي' AND category_id IS NULL;

UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'ورد دمشقي')
WHERE name = 'عطر الورد الدمشقي' AND category_id IS NULL;

UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'صندل أحمر')
WHERE name = 'بخور الصندل الأحمر' AND category_id IS NULL;

UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'مسك أبيض')
WHERE name = 'عطر المسك الأبيض' AND category_id IS NULL;

UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'عود محسن')
WHERE name = 'بخور اللبان الحوجري' AND category_id IS NULL;

-- عرض النتائج
SELECT 'تم إنشاء نظام التصنيفات بنجاح!' as message;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as categories_with_products FROM products WHERE category_id IS NOT NULL;
