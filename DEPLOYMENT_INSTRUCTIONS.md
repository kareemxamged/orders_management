# تعليمات النشر على VPS

## المشكلة الحالية
```
Uncaught Error: Missing Supabase environment variables
```

## الحلول المتاحة

### الحل الأول: إنشاء ملف .env على الخادم

1. **اتصل بالخادم عبر SSH:**
```bash
ssh root@your-server-ip
```

2. **انتقل إلى مجلد المشروع:**
```bash
cd /var/www/orders_management
```

3. **أنشئ ملف .env:**
```bash
nano .env
```

4. **أضف المحتوى التالي (استبدل بالقيم الصحيحة):**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# App Configuration
VITE_APP_NAME=نظام إدارة الطلبات
VITE_APP_VERSION=1.0.0
```

5. **احفظ الملف (Ctrl+X, ثم Y, ثم Enter)**

6. **أعد بناء المشروع:**
```bash
npm run build
```

7. **أعد تشغيل PM2:**
```bash
pm2 restart order-system
```

### الحل الثاني: استخدام متغيرات البيئة في PM2

1. **أوقف التطبيق الحالي:**
```bash
pm2 stop order-system
pm2 delete order-system
```

2. **أنشئ ملف ecosystem.config.js:**
```bash
nano ecosystem.config.js
```

3. **أضف المحتوى التالي:**
```javascript
module.exports = {
  apps: [{
    name: 'order-system',
    script: 'npm',
    args: 'run preview -- --host 0.0.0.0 --port 4173',
    env: {
      VITE_SUPABASE_URL: 'https://your-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'your_anon_key_here',
      VITE_APP_NAME: 'نظام إدارة الطلبات',
      VITE_APP_VERSION: '1.0.0'
    }
  }]
}
```

4. **احفظ الملف وابدأ التطبيق:**
```bash
pm2 start ecosystem.config.js
```

### الحل الثالث: استخدام متغيرات البيئة النظام

1. **أضف المتغيرات إلى ملف bashrc:**
```bash
echo 'export VITE_SUPABASE_URL="https://your-project.supabase.co"' >> ~/.bashrc
echo 'export VITE_SUPABASE_ANON_KEY="your_anon_key_here"' >> ~/.bashrc
echo 'export VITE_APP_NAME="نظام إدارة الطلبات"' >> ~/.bashrc
echo 'export VITE_APP_VERSION="1.0.0"' >> ~/.bashrc
```

2. **أعد تحميل المتغيرات:**
```bash
source ~/.bashrc
```

3. **أعد تشغيل PM2:**
```bash
pm2 restart order-system
```

## الحصول على بيانات Supabase

1. **اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)**
2. **اختر مشروعك**
3. **انتقل إلى Settings > API**
4. **انسخ:**
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

## التحقق من الإعداد

1. **تحقق من المتغيرات:**
```bash
pm2 env order-system
```

2. **تحقق من السجلات:**
```bash
pm2 logs order-system
```

3. **تحقق من حالة التطبيق:**
```bash
pm2 status
```

## استكشاف الأخطاء

### إذا ظهر خطأ "Missing Supabase environment variables":

1. **تأكد من وجود ملف .env:**
```bash
ls -la .env
```

2. **تحقق من محتوى الملف:**
```bash
cat .env
```

3. **تأكد من أن المتغيرات صحيحة:**
```bash
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

### إذا لم تعمل المتغيرات:

1. **أعد بناء المشروع:**
```bash
npm run build
```

2. **أعد تشغيل PM2:**
```bash
pm2 restart order-system
```

## ملاحظات مهمة

- ⚠️ **لا ترفع ملف .env إلى Git**
- 🔒 **احتفظ ببيانات Supabase آمنة**
- 🔄 **أعد بناء المشروع بعد تغيير المتغيرات**
- 📝 **تحقق من السجلات عند حدوث مشاكل**

## الدعم

إذا واجهت مشاكل:
1. تحقق من سجلات PM2: `pm2 logs order-system`
2. تأكد من صحة بيانات Supabase
3. تحقق من اتصال الإنترنت
4. أعد تشغيل الخادم إذا لزم الأمر
