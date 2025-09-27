-- إضافة بيانات تجريبية لكوبونات الخصم
-- تأكد من تشغيل database-schema.sql أولاً لإنشاء الجداول

-- إضافة كوبونات خصم تجريبية (مع تجنب التكرار)
INSERT INTO discounts (code, type, value, description, is_active) 
SELECT * FROM (VALUES
('WELCOME10', 'percentage'::discount_type, 10, 'خصم ترحيبي 10% للعملاء الجدد', true),
('SAVE20', 'percentage'::discount_type, 20, 'خصم 20% على جميع المنتجات', true),
('FIXED50', 'fixed'::discount_type, 50, 'خصم ثابت 50 ريال على الطلبات أكثر من 200 ريال', true),
('SUMMER15', 'percentage'::discount_type, 15, 'عرض صيفي - خصم 15%', true),
('VIP25', 'percentage'::discount_type, 25, 'خصم VIP للعملاء المميزين', false),
('NEWYEAR100', 'fixed'::discount_type, 100, 'عرض رأس السنة - خصم 100 ريال', true),
('WEEKEND30', 'percentage'::discount_type, 30, 'خصم نهاية الأسبوع 30%', false),
('BULK200', 'fixed'::discount_type, 200, 'خصم على الطلبات الكبيرة أكثر من 1000 ريال', true),
('STUDENT15', 'percentage'::discount_type, 15, 'خصم خاص للطلاب 15%', true),
('FIRSTORDER20', 'percentage'::discount_type, 20, 'خصم 20% على أول طلب', true),
('LOYALTY10', 'percentage'::discount_type, 10, 'خصم الولاء للعملاء الدائمين', true),
('FLASH30', 'percentage'::discount_type, 30, 'عرض فلاش - خصم 30% لمدة محدودة', false)
) AS new_discounts(code, type, value, description, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM discounts WHERE discounts.code = new_discounts.code
);

-- التحقق من إضافة البيانات
SELECT 
    code,
    type,
    value,
    description,
    is_active,
    created_at
FROM discounts 
ORDER BY created_at DESC;

-- إضافة ملاحظة
DO $$
DECLARE
    total_count INTEGER;
    active_count INTEGER;
    inactive_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM discounts;
    SELECT COUNT(*) INTO active_count FROM discounts WHERE is_active = true;
    SELECT COUNT(*) INTO inactive_count FROM discounts WHERE is_active = false;
    
    RAISE NOTICE 'إجمالي كوبونات الخصم: %', total_count;
    RAISE NOTICE 'الكوبونات النشطة: %', active_count;
    RAISE NOTICE 'الكوبونات غير النشطة: %', inactive_count;
    RAISE NOTICE 'تم إضافة كوبونات الخصم بنجاح (تم تجنب التكرار)';
END $$;
