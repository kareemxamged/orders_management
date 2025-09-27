-- إضافة كوبونات خصم جديدة فقط (بدون تكرار)
-- هذا الملف يضيف كوبونات خصم جديدة فقط إذا لم تكن موجودة

-- إضافة كوبونات خصم جديدة
INSERT INTO discounts (code, type, value, description, is_active) 
SELECT * FROM (VALUES
('HOLIDAY25', 'percentage'::discount_type, 25, 'عرض العطلات - خصم 25%', true),
('BIRTHDAY15', 'percentage'::discount_type, 15, 'خصم عيد الميلاد 15%', true),
('FREESHIP50', 'fixed'::discount_type, 50, 'شحن مجاني بقيمة 50 ريال', true),
('MEMBER20', 'percentage'::discount_type, 20, 'خصم الأعضاء 20%', true),
('CASHBACK10', 'percentage'::discount_type, 10, 'استرداد نقدي 10%', false),
('EARLY30', 'percentage'::discount_type, 30, 'خصم الطلبات المبكرة 30%', true),
('REFERRAL100', 'fixed'::discount_type, 100, 'مكافأة الإحالة 100 ريال', true),
('SEASONAL40', 'percentage'::discount_type, 40, 'خصم موسمي 40%', false),
('PREMIUM50', 'fixed'::discount_type, 50, 'خصم العضوية المميزة 50 ريال', true),
('WEEKDAY20', 'percentage'::discount_type, 20, 'خصم أيام الأسبوع 20%', true)
) AS new_discounts(code, type, value, description, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM discounts WHERE discounts.code = new_discounts.code
);

-- عرض الكوبونات المضافة حديثاً
SELECT 
    code,
    type,
    value,
    description,
    is_active,
    created_at
FROM discounts 
WHERE created_at >= NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;

-- إحصائيات نهائية
DO $$
DECLARE
    total_count INTEGER;
    active_count INTEGER;
    inactive_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM discounts;
    SELECT COUNT(*) INTO active_count FROM discounts WHERE is_active = true;
    SELECT COUNT(*) INTO inactive_count FROM discounts WHERE is_active = false;
    SELECT COUNT(*) INTO new_count FROM discounts WHERE created_at >= NOW() - INTERVAL '1 minute';
    
    RAISE NOTICE '=== إحصائيات كوبونات الخصم ===';
    RAISE NOTICE 'إجمالي كوبونات الخصم: %', total_count;
    RAISE NOTICE 'الكوبونات النشطة: %', active_count;
    RAISE NOTICE 'الكوبونات غير النشطة: %', inactive_count;
    RAISE NOTICE 'الكوبونات المضافة حديثاً: %', new_count;
    RAISE NOTICE 'تم إضافة كوبونات الخصم الجديدة بنجاح';
END $$;
