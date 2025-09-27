-- إضافة حقول السعر المخفض ونسبة التخفيض لجدول المنتجات
-- Add sale price and discount percentage fields to products table

-- إضافة الحقول الجديدة
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2);

-- إضافة تعليقات للحقول
COMMENT ON COLUMN products.sale_price IS 'السعر المخفض للمنتج';
COMMENT ON COLUMN products.discount_percentage IS 'نسبة التخفيض كنسبة مئوية (0-100)';

-- إضافة فهارس للحقول الجديدة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON products(sale_price);
CREATE INDEX IF NOT EXISTS idx_products_discount_percentage ON products(discount_percentage);

-- إضافة قيود للتحقق من صحة البيانات
-- Drop existing constraints if they exist
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_sale_price_positive;
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_discount_percentage_range;

-- Add new constraints
ALTER TABLE products 
ADD CONSTRAINT check_sale_price_positive 
CHECK (sale_price IS NULL OR sale_price >= 0);

ALTER TABLE products 
ADD CONSTRAINT check_discount_percentage_range 
CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));

-- تحديث سياسات RLS للحقول الجديدة
-- Update RLS policies for new fields

-- سياسة القراءة
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
CREATE POLICY "Enable read access for all users" ON products
FOR SELECT USING (true);

-- سياسة الإدراج
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
CREATE POLICY "Enable insert for authenticated users" ON products
FOR INSERT WITH CHECK (true);

-- سياسة التحديث
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
CREATE POLICY "Enable update for authenticated users" ON products
FOR UPDATE USING (true);

-- سياسة الحذف
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;
CREATE POLICY "Enable delete for authenticated users" ON products
FOR DELETE USING (true);

-- تمكين RLS على الجدول
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- إضافة بيانات تجريبية للحقول الجديدة (اختياري)
-- Add sample data for new fields (optional)
UPDATE products 
SET 
  sale_price = CASE 
    WHEN id = (SELECT id FROM products LIMIT 1) THEN price * 0.8  -- 20% discount
    WHEN id = (SELECT id FROM products OFFSET 1 LIMIT 1) THEN price * 0.9  -- 10% discount
    ELSE NULL
  END,
  discount_percentage = CASE 
    WHEN id = (SELECT id FROM products LIMIT 1) THEN 20.00
    WHEN id = (SELECT id FROM products OFFSET 1 LIMIT 1) THEN 10.00
    ELSE NULL
  END
WHERE id IN (
  SELECT id FROM products LIMIT 2
);

-- عرض معلومات الجدول المحدث
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('sale_price', 'discount_percentage')
ORDER BY ordinal_position;
