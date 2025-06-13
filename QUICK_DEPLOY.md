# النشر السريع - 10 دقائق

## 1️⃣ رفع على GitHub (3 دقائق)

### في terminal/command prompt:
```bash
git init
git add .
git commit -m "منصة تعليمية عربية"
```

### على موقع GitHub:
1. اذهب إلى github.com
2. انقر "New repository"
3. اسم المشروع: `arabic-learning-platform`
4. انقر "Create repository"

### ربط المشروع:
```bash
# استبدل YOUR_USERNAME باسمك
git remote add origin https://github.com/YOUR_USERNAME/arabic-learning-platform.git
git branch -M main
git push -u origin main
```

## 2️⃣ النشر على Railway (5 دقائق)

### إنشاء الحساب:
1. اذهب إلى railway.app
2. "Start a New Project"
3. "Login with GitHub"
4. امنح الصلاحيات

### إنشاء المشروع:
1. "New Project"
2. "Deploy from GitHub repo"
3. اختر `arabic-learning-platform`
4. "Deploy Now"

### إضافة قاعدة البيانات:
1. "New" → "Database" → "Add PostgreSQL"
2. انتظر دقيقتين للإعداد

## 3️⃣ اختبار التطبيق (2 دقيقة)

1. افتح الرابط المعطى من Railway
2. سجل دخول:
   - معلم: `teacher@example.com` / `123456`
   - طالب: `student@example.com` / `123456`

---

## ✅ مكتمل!
تطبيقك الآن متاح على الإنترنت مع قاعدة بيانات PostgreSQL.

## 🔄 التحديثات المستقبلية:
```bash
git add .
git commit -m "تحديث جديد"
git push origin main
```
Railway سينشر التحديثات تلقائياً.