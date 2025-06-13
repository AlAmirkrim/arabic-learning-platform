# دليل النشر - المنصة التعليمية العربية

## الجزء الأول: رفع المشروع على GitHub

### الخطوة 1: إعداد Git محلياً
```bash
# في terminal أو command prompt
git init
git add .
git commit -m "Initial commit: منصة تعليمية عربية"
```

### الخطوة 2: إنشاء مستودع على GitHub
1. اذهب إلى [github.com](https://github.com)
2. انقر على زر "New" أو "+"
3. اختر "New repository"
4. املأ البيانات:
   - **Repository name**: `arabic-learning-platform`
   - **Description**: `منصة تعليمية باللغة العربية`
   - **Public** أو **Private** (حسب اختيارك)
   - لا تختر "Add README" (لأن لديك ملف جاهز)
5. انقر "Create repository"

### الخطوة 3: ربط المشروع المحلي بـ GitHub
```bash
# استبدل USERNAME باسم المستخدم الخاص بك
git remote add origin https://github.com/USERNAME/arabic-learning-platform.git
git branch -M main
git push -u origin main
```

## الجزء الثاني: النشر على Railway

### الخطوة 1: إنشاء حساب Railway
1. اذهب إلى [railway.app](https://railway.app)
2. انقر "Start a New Project"
3. اختر "Login with GitHub"
4. امنح Railway الصلاحيات المطلوبة

### الخطوة 2: إنشاء مشروع جديد
1. انقر "New Project"
2. اختر "Deploy from GitHub repo"
3. اختر مستودع `arabic-learning-platform`
4. انقر "Deploy Now"

### الخطوة 3: إضافة قاعدة البيانات PostgreSQL
1. في لوحة تحكم المشروع، انقر "New"
2. اختر "Database"
3. اختر "Add PostgreSQL"
4. انتظر حتى يتم إنشاء قاعدة البيانات

### الخطوة 4: إعداد متغيرات البيئة
1. اذهب إلى تبويب "Variables"
2. ستجد `DATABASE_URL` مضافة تلقائياً
3. أضف متغيرات إضافية إذا احتجتها:
   ```
   NODE_ENV=production
   SESSION_SECRET=your-secret-key-here
   ```

### الخطوة 5: النشر الأولي
1. Railway سيبدأ النشر تلقائياً
2. انتظر حتى يكتمل (عادة 2-5 دقائق)
3. ستحصل على رابط للتطبيق مثل: `https://your-app.railway.app`

## الجزء الثالث: اختبار التطبيق

### 1. فتح التطبيق
- انقر على الرابط المعطى من Railway
- تأكد من تحميل الصفحة الرئيسية

### 2. اختبار قاعدة البيانات
- سجل دخول بالبيانات التجريبية:
  - معلم: `teacher@example.com` / `123456`
  - طالب: `student@example.com` / `123456`

### 3. اختبار الوظائف
- إنشاء درس جديد (للمعلم)
- تصفح الدروس (للطالب)
- تحديث الملف الشخصي

## الجزء الرابع: التحديثات المستقبلية

### النشر التلقائي
عند تحديث الكود على GitHub:
```bash
git add .
git commit -m "وصف التحديث"
git push origin main
```
Railway سيقوم بنشر التحديثات تلقائياً.

### مراقبة الأداء
- استخدم تبويب "Metrics" في Railway
- راقب استخدام الذاكرة وقاعدة البيانات
- تحقق من السجلات في تبويب "Logs"

## نصائح مهمة

### الأمان
- لا تشارك متغيرات البيئة أو كلمات المرور
- استخدم كلمات مرور قوية للحسابات الحقيقية
- فعّل المصادقة الثنائية على GitHub

### الأداء
- راقب استخدام قاعدة البيانات (1GB حد أقصى مجاني)
- راقب ساعات التشغيل (500 ساعة شهرياً مجاني)
- نظف البيانات التجريبية عند الإنتاج

### النسخ الاحتياطية
- استخدم ميزة النسخ الاحتياطي في Railway
- احتفظ بنسخة من قاعدة البيانات محلياً
- ارفع التحديثات على GitHub بانتظام

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. فشل في الاتصال بقاعدة البيانات
```
الحل: تحقق من متغير DATABASE_URL في Railway
```

#### 2. خطأ في تحميل الصفحة
```
الحل: تحقق من السجلات في Railway > Logs
```

#### 3. البيانات لا تحفظ
```
الحل: تأكد من أن قاعدة البيانات تعمل والجداول موجودة
```

## الدعم
- [توثيق Railway](https://docs.railway.app)
- [مجتمع Railway Discord](https://discord.gg/railway)
- [مساعدة GitHub](https://docs.github.com)