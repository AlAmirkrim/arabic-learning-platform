const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const PostgreSQLStorage = require('./database');

const app = express();
const PORT = 5000;

// إعداد الجلسات
app.use(session({
  secret: 'educational-platform-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 2 * 60 * 60 * 1000  // 2 ساعة كقيمة افتراضية
  }
}));

// إعداد الخادم
app.use(express.json());
app.use(express.static('.'));

// إعداد قاعدة البيانات مع نظام احتياطي
let storage;
let migrationCompleted = false;

const initializeDatabase = async () => {
  try {
    // محاولة الاتصال بـ PostgreSQL
    storage = new PostgreSQLStorage();
    
    // اختبار الاتصال
    await storage.pool.query('SELECT NOW()');
    console.log('تم الاتصال بقاعدة البيانات PostgreSQL');
    
    // نقل البيانات من JSON إلى PostgreSQL (مرة واحدة فقط)
    if (!migrationCompleted && fs.existsSync(path.join(__dirname, 'data.json'))) {
      const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
      await storage.migrateFromJSON(jsonData);
      migrationCompleted = true;
      
      // إحصائيات البيانات المنقولة
      const users = await storage.pool.query('SELECT COUNT(*) FROM users');
      const lessons = await storage.pool.query('SELECT COUNT(*) FROM lessons');
      console.log(`تم نقل ${users.rows[0].count} مستخدمين و ${lessons.rows[0].count} درساً`);
    }
    
    console.log('تم تفعيل قاعدة البيانات PostgreSQL');
  } catch (error) {
    console.warn('فشل الاتصال بـ PostgreSQL، سيتم استخدام التخزين المحلي:', error.message);
    
    // العودة للتخزين المحلي
    const JSONStorage = require('./json-storage');
    storage = new JSONStorage();
    console.log('تم تفعيل التخزين المحلي JSON');
  }
};



// تهيئة قاعدة البيانات عند بدء التطبيق
(async () => {
  await initializeDatabase();
  
  // بدء الخادم بعد تهيئة قاعدة البيانات
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
    
    if (storage) {
      try {
        if (storage.pool) {
          // PostgreSQL
          const users = await storage.pool.query('SELECT COUNT(*) FROM users');
          const lessons = await storage.pool.query('SELECT COUNT(*) FROM lessons');
          console.log(`عدد المستخدمين: ${users.rows[0].count}`);
          console.log(`عدد الدروس: ${lessons.rows[0].count}`);
        } else {
          // JSON Storage
          console.log(`عدد المستخدمين: ${storage.data.users.length}`);
          console.log(`عدد الدروس: ${storage.data.lessons.length}`);
        }
      } catch (error) {
        console.log('عدد المستخدمين: غير متاح');
        console.log('عدد الدروس: غير متاح');
      }
    }
    
    console.log('بيانات تجريبية:');
    console.log('- معلم: teacher@example.com / 123456');
    console.log('- طالب: student@example.com / 123456');
    console.log('تم تفعيل قاعدة البيانات PostgreSQL');
  });
})();

// Routes
// تسجيل الدخول
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // تحديد مدة الجلسة حسب خيار "تذكرني"
    const sessionDuration = remember ? 
      30 * 24 * 60 * 60 * 1000 : // 30 يوم للتذكر
      2 * 60 * 60 * 1000;        // 2 ساعة بدون تذكر

    // تحديث إعدادات الجلسة
    req.session.cookie.maxAge = sessionDuration;
    req.session.userId = user.id;
    req.session.userType = user.userType;
    req.session.rememberMe = remember || false;

    console.log(`تسجيل دخول: ${user.email} - تذكرني: ${remember ? 'نعم' : 'لا'} - مدة الجلسة: ${remember ? '30 يوم' : '2 ساعة'}`);

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      user: userWithoutPassword,
      sessionDuration: sessionDuration
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// إنشاء حساب جديد
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, firstName, lastName, userType, password, specialization, experience, bio } = req.body;
    
    // التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // التحقق من عدم وجود مستخدم بنفس اسم المستخدم
    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'اسم المستخدم مستخدم بالفعل' });
    }

    const userData = {
      email,
      username,
      firstName,
      lastName,
      userType,
      password,
      specialization: userType === 'teacher' ? specialization : null,
      experience: userType === 'teacher' ? experience : null,
      bio: userType === 'teacher' ? bio : null
    };

    const newUser = await storage.createUser(userData);
    req.session.userId = newUser.id;
    req.session.userType = newUser.userType;

    const { passwordHash, ...userWithoutPassword } = newUser;
    res.json({
      message: 'تم إنشاء الحساب بنجاح',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('خطأ في إنشاء الحساب:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// تسجيل الخروج
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'خطأ في تسجيل الخروج' });
    }
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  });
});

// التحقق من حالة تسجيل الدخول
app.get('/api/auth-status', async (req, res) => {
  try {
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        const { passwordHash, ...userWithoutPassword } = user;
        
        // إضافة معلومات الجلسة للرد
        const sessionInfo = {
          rememberMe: req.session.rememberMe || false,
          maxAge: req.session.cookie.maxAge,
          expiresAt: new Date(Date.now() + req.session.cookie.maxAge).toISOString()
        };
        
        return res.json({ 
          authenticated: true, 
          user: userWithoutPassword,
          session: sessionInfo
        });
      }
    }
    res.json({ authenticated: false });
  } catch (error) {
    console.error('خطأ في التحقق من حالة المصادقة:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// الحصول على جميع المعلمين
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await storage.getAllTeachers();
    res.json(teachers);
  } catch (error) {
    console.error('خطأ في الحصول على المعلمين:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// الحصول على جميع الدروس
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = await storage.getAllLessons();
    res.json(lessons);
  } catch (error) {
    console.error('خطأ في الحصول على الدروس:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// الحصول على درس محدد
app.get('/api/lessons/:id', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const lesson = await storage.getLesson(lessonId);
    
    if (!lesson) {
      return res.status(404).json({ message: 'الدرس غير موجود' });
    }
    
    res.json(lesson);
  } catch (error) {
    console.error('خطأ في الحصول على الدرس:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// زيادة عدد المشاهدات
app.post('/api/lessons/:id/view', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    await storage.incrementViews(lessonId);
    res.json({ message: 'تم تحديث عدد المشاهدات' });
  } catch (error) {
    console.error('خطأ في تحديث المشاهدات:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// إضافة/إزالة إعجاب
app.post('/api/lessons/:id/like', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const userId = req.session.userId || `guest_${req.ip}`;
    
    const result = await storage.toggleLike(lessonId, userId);
    res.json(result);
  } catch (error) {
    console.error('خطأ في تبديل الإعجاب:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// التحقق من حالة الإعجاب
app.get('/api/lessons/:id/like-status', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const userId = req.session.userId || `guest_${req.ip}`;
    
    const hasLiked = await storage.hasUserLiked(lessonId, userId);
    res.json({ hasLiked });
  } catch (error) {
    console.error('خطأ في التحقق من حالة الإعجاب:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// إنشاء درس جديد (للمعلمين فقط)
app.post('/api/lessons', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'teacher') {
      return res.status(401).json({ message: 'يجب أن تكون معلماً لإنشاء درس' });
    }

    const { title, description, videoUrl, subject, grade, pdfUrls } = req.body;
    
    // تنظيف وفلترة ملفات PDF
    let cleanPdfUrls = [];
    if (pdfUrls && Array.isArray(pdfUrls)) {
      cleanPdfUrls = pdfUrls
        .filter(url => url && url.trim() !== '')
        .map(url => url.trim())
        .slice(0, 3); // حد أقصى 3 ملفات
    }
    
    const lessonData = {
      title,
      description,
      videoUrl,
      subject,
      grade,
      pdfUrls: cleanPdfUrls,
      teacherId: req.session.userId
    };

    const newLesson = await storage.createLesson(lessonData);
    res.json(newLesson);
  } catch (error) {
    console.error('خطأ في إنشاء الدرس:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// الحصول على دروس المعلم
app.get('/api/teacher-lessons', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'teacher') {
      return res.status(401).json({ message: 'غير مصرح لك بالوصول' });
    }

    const lessons = await storage.getLessonsByTeacher(req.session.userId);
    res.json(lessons);
  } catch (error) {
    console.error('خطأ في الحصول على دروس المعلم:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// تحديث درس
app.put('/api/lessons/:id', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'teacher') {
      return res.status(401).json({ message: 'غير مصرح لك بالوصول' });
    }

    const lessonId = parseInt(req.params.id);
    const updates = { ...req.body };

    // تنظيف وفلترة ملفات PDF
    if (updates.pdfUrls && Array.isArray(updates.pdfUrls)) {
      updates.pdfUrls = updates.pdfUrls
        .filter(url => url && url.trim() !== '')
        .map(url => url.trim())
        .slice(0, 3); // حد أقصى 3 ملفات
    }

    const updatedLesson = await storage.updateLesson(lessonId, req.session.userId, updates);
    
    if (!updatedLesson) {
      return res.status(404).json({ message: 'الدرس غير موجود أو غير مصرح لك بتعديله' });
    }

    res.json(updatedLesson);
  } catch (error) {
    console.error('خطأ في تحديث الدرس:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// حذف درس
app.delete('/api/lessons/:id', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'teacher') {
      return res.status(401).json({ message: 'غير مصرح لك بالوصول' });
    }

    const lessonId = parseInt(req.params.id);
    const deleted = await storage.deleteLesson(lessonId, req.session.userId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'الدرس غير موجود أو غير مصرح لك بحذفه' });
    }

    res.json({ message: 'تم حذف الدرس بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف الدرس:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// تحديث الملف الشخصي
app.put('/api/update-profile', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً' });
    }

    const { username, firstName, lastName, specialization, experience, bio } = req.body;
    
    // التحقق من عدم وجود مستخدم آخر بنفس اسم المستخدم
    if (username) {
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== req.session.userId) {
        return res.status(400).json({ message: 'اسم المستخدم مستخدم بالفعل' });
      }
    }

    const updates = {};
    if (username) updates.username = username;
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (specialization !== undefined) updates.specialization = specialization;
    if (experience !== undefined) updates.experience = experience;
    if (bio !== undefined) updates.bio = bio;

    const updatedUser = await storage.updateProfile(req.session.userId, updates);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    res.json({
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// حذف الحساب
app.delete('/api/delete-account', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً' });
    }

    const deleted = await storage.deleteUser(req.session.userId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('خطأ في تدمير الجلسة:', err);
      }
    });

    res.json({ message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف الحساب:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// إحصائيات المعلم
app.get('/api/teacher-stats', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'teacher') {
      return res.status(401).json({ message: 'غير مصرح لك بالوصول' });
    }

    const teacherLessons = await storage.getLessonsByTeacher(req.session.userId);
    const totalViews = teacherLessons.reduce((sum, lesson) => sum + lesson.views, 0);
    const totalLikes = teacherLessons.reduce((sum, lesson) => sum + lesson.likes, 0);

    res.json({
      totalLessons: teacherLessons.length,
      totalViews: totalViews,
      totalLikes: totalLikes
    });
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات المعلم:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

