-- إضافة حقول الخصم للمنتجات والطلبات
-- نظام إدارة الطلبات - متجر البخور والعطور

-- 1. إضافة حقول الخصم للمنتجات
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2);

-- إضافة تعليقات للحقول الجديدة
COMMENT ON COLUMN products.sale_price IS 'السعر المخفض للمنتج';
COMMENT ON COLUMN products.discount_percentage IS 'نسبة التخفيض كنسبة مئوية (0-100)';

-- إضافة فهارس للحقول الجديدة
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON products(sale_price);
CREATE INDEX IF NOT EXISTS idx_products_discount_percentage ON products(discount_percentage);

-- إضافة قيود التحقق من صحة البيانات
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_sale_price_positive;
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_discount_percentage_range;

ALTER TABLE products 
ADD CONSTRAINT check_sale_price_positive 
CHECK (sale_price IS NULL OR sale_price >= 0);

ALTER TABLE products 
ADD CONSTRAINT check_discount_percentage_range 
CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));

-- 2. إضافة حقول الخصم للطلبات
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);

-- إضافة تعليقات للحقول الجديدة
COMMENT ON COLUMN orders.discount_type IS 'نوع الخصم: none, coupon, fixed, percentage';
COMMENT ON COLUMN orders.discount_code IS 'كود الكوبون (إذا كان نوع الخصم كوبون)';
COMMENT ON COLUMN orders.discount_value IS 'قيمة الخصم (مبلغ ثابت أو نسبة مئوية)';

-- إضافة فهارس للحقول الجديدة
CREATE INDEX IF NOT EXISTS idx_orders_discount_type ON orders(discount_type);
CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON orders(discount_code);

-- إضافة قيود التحقق من صحة البيانات
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_discount_type_valid;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_discount_value_positive;

ALTER TABLE orders 
ADD CONSTRAINT check_discount_type_valid 
CHECK (discount_type IN ('none', 'coupon', 'fixed', 'percentage'));

ALTER TABLE orders 
ADD CONSTRAINT check_discount_value_positive 
CHECK (discount_value IS NULL OR discount_value >= 0);

-- 3. تحديث RLS policies لتشمل الحقول الجديدة
-- للمنتجات (السياسات موجودة بالفعل، لكن نتأكد من أنها تشمل الحقول الجديدة)
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;

CREATE POLICY "Enable read access for all users" ON products
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON products
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON products
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON products
FOR DELETE USING (true);

-- للطلبات (السياسات موجودة بالفعل، لكن نتأكد من أنها تشمل الحقول الجديدة)
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON orders;

CREATE POLICY "Enable read access for all users" ON orders
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON orders
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON orders
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON orders
FOR DELETE USING (true);

-- 4. إضافة بيانات تجريبية للاختبار (اختياري)
-- يمكن إزالة هذا الجزء إذا لم تكن تريد بيانات تجريبية

-- تحديث بعض المنتجات الموجودة لإضافة خصومات
UPDATE products 
SET sale_price = price * 0.8, discount_percentage = 20
WHERE name LIKE '%بخور%' AND sale_price IS NULL
AND id IN (
    SELECT id FROM products 
    WHERE name LIKE '%بخور%' AND sale_price IS NULL 
    LIMIT 3
);

UPDATE products 
SET sale_price = price * 0.9, discount_percentage = 10
WHERE name LIKE '%عود%' AND sale_price IS NULL
AND id IN (
    SELECT id FROM products 
    WHERE name LIKE '%عود%' AND sale_price IS NULL 
    LIMIT 2
);

-- 5. إضافة بيانات تجريبية لكوبونات الخصم
INSERT INTO discounts (code, type, value, description, is_active) VALUES
('WELCOME10', 'percentage'::discount_type, 10, 'خصم ترحيبي 10% للعملاء الجدد', true),
('SAVE20', 'percentage'::discount_type, 20, 'خصم 20% على جميع المنتجات', true),
('FIXED50', 'fixed'::discount_type, 50, 'خصم ثابت 50 ريال على الطلبات أكثر من 200 ريال', true),
('SUMMER15', 'percentage'::discount_type, 15, 'عرض صيفي - خصم 15%', true),
('VIP25', 'percentage'::discount_type, 25, 'خصم VIP للعملاء المميزين', false),
('NEWYEAR100', 'fixed'::discount_type, 100, 'عرض رأس السنة - خصم 100 ريال', true),
('WEEKEND30', 'percentage'::discount_type, 30, 'خصم نهاية الأسبوع 30%', false),
('BULK200', 'fixed'::discount_type, 200, 'خصم على الطلبات الكبيرة أكثر من 1000 ريال', true);

-- إضافة ملاحظة في النهاية
DO $$
BEGIN
    RAISE NOTICE 'تم إضافة حقول الخصم بنجاح للمنتجات والطلبات';
    RAISE NOTICE 'الحقول المضافة للمنتجات: sale_price, discount_percentage';
    RAISE NOTICE 'الحقول المضافة للطلبات: discount_type, discount_code, discount_value';
    RAISE NOTICE 'تم إضافة 8 كوبونات خصم تجريبية';
END $$;
