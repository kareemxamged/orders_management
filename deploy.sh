#!/bin/bash

# سكريبت النشر التلقائي لنظام إدارة الطلبات
# استخدام: ./deploy.sh

echo "🚀 بدء عملية النشر..."

# التحقق من وجود ملف .env
if [ ! -f .env ]; then
    echo "❌ ملف .env غير موجود!"
    echo "📝 أنشئ ملف .env من env.example وأضف بيانات Supabase الصحيحة"
    echo "   cp env.example .env"
    echo "   nano .env"
    exit 1
fi

echo "✅ ملف .env موجود"

# تثبيت التبعيات
echo "📦 تثبيت التبعيات..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ فشل في تثبيت التبعيات"
    exit 1
fi

echo "✅ تم تثبيت التبعيات بنجاح"

# بناء المشروع
echo "🔨 بناء المشروع..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ فشل في بناء المشروع"
    exit 1
fi

echo "✅ تم بناء المشروع بنجاح"

# إنشاء مجلد السجلات إذا لم يكن موجوداً
mkdir -p logs

# إيقاف التطبيق الحالي إذا كان يعمل
echo "⏹️ إيقاف التطبيق الحالي..."
pm2 stop order-system 2>/dev/null || true
pm2 delete order-system 2>/dev/null || true

# بدء التطبيق باستخدام ecosystem.config.js
echo "▶️ بدء التطبيق..."
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    echo "✅ تم نشر التطبيق بنجاح!"
    echo "📊 حالة التطبيق:"
    pm2 status
    echo ""
    echo "🌐 يمكنك الوصول للتطبيق على:"
    echo "   http://your-server-ip:4173"
    echo ""
    echo "📝 لعرض السجلات:"
    echo "   pm2 logs order-system"
else
    echo "❌ فشل في بدء التطبيق"
    exit 1
fi
