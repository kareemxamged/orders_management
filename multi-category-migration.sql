-- إضافة نظام التصنيفات المتعددة للمنتجات
-- هذا الملف لإضافة جدول ربط بين المنتجات والتصنيفات

-- إنشاء جدول ربط المنتجات والتصنيفات
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- للتصنيف الأساسي
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, category_id) -- منع تكرار نفس التصنيف للمنتج
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_is_primary ON product_categories(is_primary);

-- تفعيل RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسة
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_categories' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON product_categories
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- إنشاء التريغر لتحديث updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_product_categories_updated_at'
    ) THEN
        CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- نقل البيانات الموجودة من category_id إلى جدول product_categories
INSERT INTO product_categories (product_id, category_id, is_primary)
SELECT id, category_id, true
FROM products 
WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;

-- إضافة تعليق على الجدول
COMMENT ON TABLE product_categories IS 'جدول ربط المنتجات بالتصنيفات - يدعم تصنيفات متعددة لكل منتج';
COMMENT ON COLUMN product_categories.is_primary IS 'يميز التصنيف الأساسي للمنتج';
