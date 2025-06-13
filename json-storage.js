const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

class JSONStorage {
  constructor() {
    this.dataFile = path.join(__dirname, 'data.json');
    this.cleanDataFile = path.join(__dirname, 'data-clean.json');
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const fileContent = fs.readFileSync(this.dataFile, 'utf8');
        this.data = JSON.parse(fileContent);
        console.log('تم تحميل البيانات من ملف data.json');
      } else if (fs.existsSync(this.cleanDataFile)) {
        const fileContent = fs.readFileSync(this.cleanDataFile, 'utf8');
        this.data = JSON.parse(fileContent);
        console.log('تم تحميل البيانات من ملف data-clean.json');
        this.saveData();
      } else {
        console.log('ملف البيانات غير موجود، سيتم إنشاء ملف جديد مع بيانات تجريبية');
        this.data = this.createDefaultData();
        this.saveData();
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      console.log('إنشاء بيانات افتراضية...');
      this.data = this.createDefaultData();
      this.saveData();
    }
  }

  createDefaultData() {
    return {
      users: [
        {
          id: 1,
          email: "teacher@example.com",
          username: "معلم_تجريبي",
          firstName: "أحمد",
          lastName: "محمد",
          userType: "teacher",
          passwordHash: "$2a$10$8K1p/a0dC2VWtAoOeexIp.5XlZbK4zqNTTRJKN2n6qJtVQq1rE8GO",
          specialization: "الرياضيات",
          experience: "5 سنوات",
          bio: "معلم رياضيات متخصص في التعليم الإلكتروني",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
          id: 2,
          email: "student@example.com",
          username: "طالب_تجريبي",
          firstName: "فاطمة",
          lastName: "علي",
          userType: "student",
          passwordHash: "$2a$10$8K1p/a0dC2VWtAoOeexIp.5XlZbK4zqNTTRJKN2n6qJtVQq1rE8GO",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ],
      lessons: [
        {
          id: 1,
          title: "مقدمة في الجبر",
          description: "درس تمهيدي في أساسيات الجبر للمبتدئين",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          subject: "الرياضيات",
          grade: "الصف التاسع",
          pdfUrls: [],
          teacherId: 1,
          views: 0,
          likes: 0,
          likedBy: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
          id: 2,
          title: "المعادلات الخطية",
          description: "شرح مفصل للمعادلات الخطية وطرق حلها",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          subject: "الرياضيات",
          grade: "الصف العاشر",
          pdfUrls: [],
          teacherId: 1,
          views: 0,
          likes: 0,
          likedBy: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ],
      nextUserId: 3,
      nextLessonId: 3
    };
  }

  saveData() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
    }
  }

  async getUser(id) {
    return this.data.users.find(user => user.id === parseInt(id)) || null;
  }

  async getUserByEmail(email) {
    return this.data.users.find(user => user.email === email) || null;
  }

  async getUserByUsername(username) {
    return this.data.users.find(user => user.username === username) || null;
  }

  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = {
      id: this.data.nextUserId++,
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: userData.userType,
      passwordHash: hashedPassword,
      specialization: userData.specialization || null,
      experience: userData.experience || null,
      bio: userData.bio || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  async getAllTeachers() {
    const teachers = this.data.users.filter(user => user.userType === 'teacher');
    return teachers.map(teacher => {
      const teacherLessons = this.data.lessons.filter(lesson => lesson.teacherId === teacher.id);
      return {
        ...teacher,
        lessonsCount: teacherLessons.length
      };
    });
  }

  async getAllLessons() {
    return this.data.lessons.map(lesson => {
      const teacher = this.data.users.find(user => user.id === lesson.teacherId);
      return {
        ...lesson,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'غير معروف'
      };
    });
  }

  async getLesson(id) {
    const lesson = this.data.lessons.find(lesson => lesson.id === parseInt(id));
    if (lesson) {
      const teacher = this.data.users.find(user => user.id === lesson.teacherId);
      return {
        ...lesson,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'غير معروف'
      };
    }
    return null;
  }

  async getLessonsByTeacher(teacherId) {
    return this.data.lessons.filter(lesson => lesson.teacherId === parseInt(teacherId));
  }

  async createLesson(lessonData) {
    const newLesson = {
      id: this.data.nextLessonId++,
      title: lessonData.title,
      description: lessonData.description,
      videoUrl: lessonData.videoUrl,
      subject: lessonData.subject,
      grade: lessonData.grade,
      pdfUrls: lessonData.pdfUrls || [],
      teacherId: lessonData.teacherId,
      views: 0,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.lessons.push(newLesson);
    this.saveData();
    return newLesson;
  }

  async updateLesson(id, teacherId, updates) {
    const lessonIndex = this.data.lessons.findIndex(lesson => 
      lesson.id === parseInt(id) && lesson.teacherId === parseInt(teacherId)
    );
    
    if (lessonIndex !== -1) {
      this.data.lessons[lessonIndex] = {
        ...this.data.lessons[lessonIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveData();
      return this.data.lessons[lessonIndex];
    }
    return null;
  }

  async deleteLesson(id, teacherId) {
    const lessonIndex = this.data.lessons.findIndex(lesson => 
      lesson.id === parseInt(id) && lesson.teacherId === parseInt(teacherId)
    );
    
    if (lessonIndex !== -1) {
      this.data.lessons.splice(lessonIndex, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  async incrementViews(lessonId) {
    const lesson = this.data.lessons.find(lesson => lesson.id === parseInt(lessonId));
    if (lesson) {
      lesson.views += 1;
      lesson.updatedAt = new Date().toISOString();
      this.saveData();
    }
  }

  async toggleLike(lessonId, userId) {
    const lesson = this.data.lessons.find(lesson => lesson.id === parseInt(lessonId));
    if (!lesson) {
      throw new Error('الدرس غير موجود');
    }

    const userIdStr = String(userId);
    const likedByIndex = lesson.likedBy.indexOf(userIdStr);
    
    let hasLiked;
    if (likedByIndex > -1) {
      lesson.likedBy.splice(likedByIndex, 1);
      lesson.likes -= 1;
      hasLiked = false;
    } else {
      lesson.likedBy.push(userIdStr);
      lesson.likes += 1;
      hasLiked = true;
    }
    
    lesson.updatedAt = new Date().toISOString();
    this.saveData();
    return { hasLiked, likes: lesson.likes };
  }

  async hasUserLiked(lessonId, userId) {
    const lesson = this.data.lessons.find(lesson => lesson.id === parseInt(lessonId));
    if (!lesson) {
      return false;
    }
    return lesson.likedBy.includes(String(userId));
  }

  async updateProfile(userId, updates) {
    const userIndex = this.data.users.findIndex(user => user.id === parseInt(userId));
    if (userIndex !== -1) {
      this.data.users[userIndex] = {
        ...this.data.users[userIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveData();
      return this.data.users[userIndex];
    }
    return null;
  }

  async deleteUser(userId) {
    const userIndex = this.data.users.findIndex(user => user.id === parseInt(userId));
    if (userIndex !== -1) {
      this.data.lessons = this.data.lessons.filter(lesson => lesson.teacherId !== parseInt(userId));
      this.data.users.splice(userIndex, 1);
      this.saveData();
      return true;
    }
    return false;
  }
}

module.exports = JSONStorage;