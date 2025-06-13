const { Pool } = require('pg');

class PostgreSQLStorage {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // إنشاء جدول المستخدمين
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(255) NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('teacher', 'student')),
          password_hash TEXT NOT NULL,
          specialization VARCHAR(255),
          experience VARCHAR(255),
          bio TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // إنشاء جدول الدروس
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS lessons (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          video_url TEXT,
          subject VARCHAR(255),
          grade VARCHAR(255),
          pdf_urls TEXT[],
          teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          liked_by TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // إنشاء فهارس
      await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id)`);
      
      console.log('تم إنشاء قاعدة البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في إنشاء قاعدة البيانات:', error);
    }
  }

  async getUser(id) {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('خطأ في الحصول على المستخدم:', error);
      return null;
    }
  }

  async getUserByEmail(email) {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('خطأ في البحث بالبريد الإلكتروني:', error);
      return null;
    }
  }

  async getUserByUsername(username) {
    try {
      const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('خطأ في البحث باسم المستخدم:', error);
      return null;
    }
  }

  async createUser(userData) {
    try {
      // تشفير كلمة المرور قبل الحفظ
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const result = await this.pool.query(`
        INSERT INTO users (email, username, first_name, last_name, user_type, password_hash, specialization, experience, bio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        userData.email,
        userData.username,
        userData.firstName,
        userData.lastName,
        userData.userType,
        hashedPassword,
        userData.specialization || null,
        userData.experience || null,
        userData.bio || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      throw error;
    }
  }

  async getAllTeachers() {
    try {
      const result = await this.pool.query(`
        SELECT u.*, COUNT(l.id) as lessons_count
        FROM users u
        LEFT JOIN lessons l ON u.id = l.teacher_id
        WHERE u.user_type = 'teacher'
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `);
      
      return result.rows.map(teacher => ({
        ...teacher,
        lessonsCount: parseInt(teacher.lessons_count)
      }));
    } catch (error) {
      console.error('خطأ في الحصول على المعلمين:', error);
      return [];
    }
  }

  async getAllLessons() {
    try {
      const result = await this.pool.query(`
        SELECT l.*, u.first_name, u.last_name,
               CONCAT(u.first_name, ' ', u.last_name) as teacher_name
        FROM lessons l
        JOIN users u ON l.teacher_id = u.id
        ORDER BY l.created_at DESC
      `);
      
      return result.rows.map(lesson => ({
        ...lesson,
        teacherName: lesson.teacher_name
      }));
    } catch (error) {
      console.error('خطأ في الحصول على الدروس:', error);
      return [];
    }
  }

  async getLesson(id) {
    try {
      const result = await this.pool.query(`
        SELECT l.*, u.first_name, u.last_name,
               CONCAT(u.first_name, ' ', u.last_name) as teacher_name
        FROM lessons l
        JOIN users u ON l.teacher_id = u.id
        WHERE l.id = $1
      `, [id]);
      
      if (result.rows[0]) {
        return {
          ...result.rows[0],
          teacherName: result.rows[0].teacher_name
        };
      }
      return null;
    } catch (error) {
      console.error('خطأ في الحصول على الدرس:', error);
      return null;
    }
  }

  async getLessonsByTeacher(teacherId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM lessons WHERE teacher_id = $1 ORDER BY created_at DESC',
        [teacherId]
      );
      return result.rows;
    } catch (error) {
      console.error('خطأ في الحصول على دروس المعلم:', error);
      return [];
    }
  }

  async createLesson(lessonData) {
    try {
      const result = await this.pool.query(`
        INSERT INTO lessons (title, description, video_url, subject, grade, pdf_urls, teacher_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        lessonData.title,
        lessonData.description,
        lessonData.videoUrl,
        lessonData.subject,
        lessonData.grade,
        lessonData.pdfUrls || [],
        lessonData.teacherId
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('خطأ في إنشاء الدرس:', error);
      throw error;
    }
  }

  async updateLesson(id, teacherId, updates) {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (key !== 'id' && key !== 'teacher_id' && key !== 'created_at') {
          setClause.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      if (setClause.length === 0) return null;

      values.push(id, teacherId);
      
      const result = await this.pool.query(`
        UPDATE lessons 
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount} AND teacher_id = $${paramCount + 1}
        RETURNING *
      `, values);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('خطأ في تحديث الدرس:', error);
      return null;
    }
  }

  async deleteLesson(id, teacherId) {
    try {
      const result = await this.pool.query(
        'DELETE FROM lessons WHERE id = $1 AND teacher_id = $2 RETURNING id',
        [id, teacherId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('خطأ في حذف الدرس:', error);
      return false;
    }
  }

  async incrementViews(lessonId) {
    try {
      await this.pool.query(
        'UPDATE lessons SET views = views + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [lessonId]
      );
    } catch (error) {
      console.error('خطأ في تحديث المشاهدات:', error);
    }
  }

  async toggleLike(lessonId, userId) {
    try {
      const lesson = await this.pool.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
      if (!lesson.rows[0]) {
        throw new Error('الدرس غير موجود');
      }

      const currentLesson = lesson.rows[0];
      const userIdStr = String(userId);
      const likedBy = currentLesson.liked_by || [];
      const userIndex = likedBy.indexOf(userIdStr);
      
      let newLikedBy, newLikes, hasLiked;
      
      if (userIndex > -1) {
        // إزالة الإعجاب
        newLikedBy = likedBy.filter(id => id !== userIdStr);
        newLikes = Math.max(0, currentLesson.likes - 1);
        hasLiked = false;
      } else {
        // إضافة الإعجاب
        newLikedBy = [...likedBy, userIdStr];
        newLikes = currentLesson.likes + 1;
        hasLiked = true;
      }

      await this.pool.query(
        'UPDATE lessons SET likes = $1, liked_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [newLikes, newLikedBy, lessonId]
      );

      return { hasLiked, likes: newLikes };
    } catch (error) {
      console.error('خطأ في تبديل الإعجاب:', error);
      throw error;
    }
  }

  async hasUserLiked(lessonId, userId) {
    try {
      const result = await this.pool.query('SELECT liked_by FROM lessons WHERE id = $1', [lessonId]);
      if (!result.rows[0]) return false;
      
      const likedBy = result.rows[0].liked_by || [];
      return likedBy.includes(String(userId));
    } catch (error) {
      console.error('خطأ في التحقق من الإعجاب:', error);
      return false;
    }
  }

  async updateProfile(userId, updates) {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (key !== 'id' && key !== 'created_at') {
          setClause.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      if (setClause.length === 0) return null;

      values.push(userId);
      
      const result = await this.pool.query(`
        UPDATE users 
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      return null;
    }
  }

  async deleteUser(userId) {
    try {
      const result = await this.pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      return false;
    }
  }

  // دالة لنقل البيانات من JSON إلى PostgreSQL
  async migrateFromJSON(jsonData) {
    try {
      console.log('بدء نقل البيانات من JSON إلى PostgreSQL...');
      
      // نقل المستخدمين
      for (const user of jsonData.users) {
        try {
          await this.pool.query(`
            INSERT INTO users (id, email, username, first_name, last_name, user_type, password_hash, specialization, experience, bio, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (email) DO NOTHING
          `, [
            user.id,
            user.email,
            user.username,
            user.firstName,
            user.lastName,
            user.userType,
            user.passwordHash,
            user.specialization,
            user.experience,
            user.bio,
            user.createdAt,
            user.updatedAt
          ]);
        } catch (err) {
          console.log(`تخطي المستخدم ${user.email} - موجود مسبقاً أو خطأ في البيانات`);
        }
      }

      // نقل الدروس
      for (const lesson of jsonData.lessons) {
        try {
          await this.pool.query(`
            INSERT INTO lessons (id, title, description, video_url, subject, grade, pdf_urls, teacher_id, views, likes, liked_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO NOTHING
          `, [
            lesson.id,
            lesson.title,
            lesson.description,
            lesson.videoUrl,
            lesson.subject,
            lesson.grade,
            lesson.pdfUrls || [],
            lesson.teacherId,
            lesson.views,
            lesson.likes,
            lesson.likedBy || [],
            lesson.createdAt,
            lesson.updatedAt
          ]);
        } catch (err) {
          console.log(`تخطي الدرس ${lesson.title} - موجود مسبقاً أو خطأ في البيانات`);
        }
      }

      // تحديث sequences
      await this.pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
      await this.pool.query(`SELECT setval('lessons_id_seq', (SELECT MAX(id) FROM lessons))`);

      console.log('تم نقل البيانات بنجاح من JSON إلى PostgreSQL');
    } catch (error) {
      console.error('خطأ في نقل البيانات:', error);
    }
  }
}

module.exports = PostgreSQLStorage;