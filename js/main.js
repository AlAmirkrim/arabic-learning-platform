// متغيرات عامة
let currentUser = null;

// إدارة الوضع المضيء والداكن
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton();
}

function updateThemeButton() {
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (themeIcon && themeText) {
        if (currentTheme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'الوضع المضيء';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'الوضع الداكن';
        }
    }
}

// التحقق من حالة المصادقة عند تحميل الصفحة
async function checkAuthStatus() {
    // تهيئة المظهر
    initTheme();
    
    try {
        const response = await fetch('/api/auth-status');
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                currentUser = data.user;
            } else {
                currentUser = null;
            }
            updateNavbar();
        } else {
            currentUser = null;
            updateNavbar();
        }
    } catch (error) {
        console.error('خطأ في التحقق من المصادقة:', error);
        currentUser = null;
        updateNavbar();
    }
}

// تحديث شريط التنقل حسب حالة المستخدم
function updateNavbar() {
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    const userName = document.getElementById('userName');
    const dashboardLink = document.getElementById('dashboardLink');

    // التحقق من وجود العناصر قبل محاولة الوصول إليها
    if (!navAuth || !navUser) {
        return; // إذا لم توجد العناصر الأساسية، لا تفعل شيئاً
    }

    if (currentUser) {
        navAuth.classList.add('hidden');
        navUser.classList.remove('hidden');
        if (userName) {
            userName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        }
        
        // تحديث البريد الإلكتروني في القائمة المنسدلة
        const userEmail = document.getElementById('userEmail');
        if (userEmail) {
            userEmail.textContent = currentUser.email;
        }
        
        // إظهار رابط لوحة التحكم للمعلمين فقط
        if (dashboardLink) {
            if (currentUser.userType === 'teacher') {
                dashboardLink.classList.remove('hidden');
            } else {
                dashboardLink.classList.add('hidden');
            }
        }
    } else {
        navAuth.classList.remove('hidden');
        navUser.classList.add('hidden');
    }
}

// تسجيل الخروج
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        updateNavbar();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        alert('حدث خطأ في تسجيل الخروج');
    }
}

// تبديل القائمة المحمولة
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (!mobileMenu) {
        createMobileMenu();
        return;
    }
    
    mobileMenu.classList.toggle('show');
    mobileOverlay.classList.toggle('show');
    
    // منع التمرير في الخلفية عند فتح القائمة
    if (mobileMenu.classList.contains('show')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// إنشاء القائمة المحمولة ديناميكياً
function createMobileMenu() {
    // إنشاء الخلفية المظلمة
    const overlay = document.createElement('div');
    overlay.id = 'mobileOverlay';
    overlay.className = 'mobile-overlay';
    overlay.onclick = closeMobileMenu;
    
    // إنشاء القائمة
    const menu = document.createElement('div');
    menu.id = 'mobileMenu';
    menu.className = 'mobile-menu';
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    menu.innerHTML = `
        <div class="mobile-menu-header">
            <h3>🎓 منصة التعليم</h3>
            <button class="mobile-menu-close" onclick="closeMobileMenu()">×</button>
        </div>
        <div class="mobile-menu-content">
            <a href="index.html" class="mobile-menu-item ${currentPage === 'index.html' ? 'active' : ''}">🏠 الرئيسية</a>
            <a href="teachers.html" class="mobile-menu-item ${currentPage === 'teachers.html' ? 'active' : ''}">👨‍🏫 المعلمون</a>
            <a href="lessons.html" class="mobile-menu-item ${currentPage === 'lessons.html' ? 'active' : ''}">📚 الدروس</a>
            
            <div class="mobile-menu-divider"></div>
            
            <div id="mobileAuthSection">
                ${currentUser ? `
                    <div style="padding: 12px 16px; background: #F3F4F6; border-radius: 8px; margin-bottom: 12px;">
                        <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">${currentUser.first_name} ${currentUser.last_name}</div>
                        <div style="font-size: 0.875rem; color: #6B7280;">${currentUser.email}</div>
                    </div>
                    ${currentUser.user_type === 'teacher' ? '<a href="teacher-dashboard.html" class="mobile-menu-item">📊 لوحة التحكم</a>' : ''}
                    <button onclick="openSettings()" class="mobile-menu-item" style="width: 100%; text-align: right; border: none; background: none;">🔧 الإعدادات</button>
                    <button onclick="logout()" class="mobile-menu-item" style="width: 100%; text-align: right; border: none; background: none; color: #EF4444;">🚪 تسجيل الخروج</button>
                ` : `
                    <a href="login.html" class="mobile-menu-item">🔑 تسجيل الدخول</a>
                    <a href="register.html" class="mobile-menu-item">📝 إنشاء حساب</a>
                `}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(menu);
    
    // إظهار القائمة
    setTimeout(() => {
        menu.classList.add('show');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }, 10);
}

// إغلاق القائمة المحمولة
function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (mobileMenu) {
        mobileMenu.classList.remove('show');
    }
    if (mobileOverlay) {
        mobileOverlay.classList.remove('show');
    }
    
    document.body.style.overflow = '';
    
    // إزالة العناصر بعد انتهاء الانتقال
    setTimeout(() => {
        if (mobileMenu) mobileMenu.remove();
        if (mobileOverlay) mobileOverlay.remove();
    }, 300);
}

// دوال مساعدة للنماذج
function showError(element, message) {
    const errorDiv = element.parentNode.querySelector('.form-error');
    if (errorDiv) {
        errorDiv.textContent = message;
    } else {
        const newErrorDiv = document.createElement('div');
        newErrorDiv.className = 'form-error';
        newErrorDiv.textContent = message;
        element.parentNode.appendChild(newErrorDiv);
    }
}

function clearError(element) {
    const errorDiv = element.parentNode.querySelector('.form-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function showSuccess(element, message) {
    const successDiv = element.parentNode.querySelector('.form-success');
    if (successDiv) {
        successDiv.textContent = message;
    } else {
        const newSuccessDiv = document.createElement('div');
        newSuccessDiv.className = 'form-success';
        newSuccessDiv.textContent = message;
        element.parentNode.appendChild(newSuccessDiv);
    }
}

// تشفير كلمة المرور (للعرض فقط - التشفير الحقيقي يحدث في الخادم)
function validatePassword(password) {
    return password.length >= 6;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// دالة لاستخراج معرف الفيديو من رابط اليوتيوب
function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function processPDFUrl(url) {
    if (!url || url.trim() === '') return null;
    
    // معالجة Google Drive (مثل استخراج YouTube ID)
    if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }
    }
    
    // معالجة OneDrive بسيطة
    if (url.includes('1drv.ms') && !url.includes('embed=1')) {
        return url.replace('1drv.ms/b/', '1drv.ms/s/') + '?embed=1';
    }
    
    // باقي الروابط كما هي
    return url;
}

// دالة لتنسيق التاريخ بالعربية
function formatArabicDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString('ar-SA', options);
}

// دالة لتنسيق الأرقام بالعربية
function formatArabicNumber(number) {
    return number.toLocaleString('ar-SA');
}

// إعداد مستمعات الأحداث للنماذج
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من حالة المصادقة
    checkAuthStatus();
    
    // إضافة مستمعات للنماذج في الصفحات المختلفة
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // تم نقل معالج lessonForm إلى teacher-dashboard.html لتجنب التكرار
});

// معالج تسجيل الدخول
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember') === 'on'; // التحقق من خيار "تذكرني"
    
    // تنظيف الأخطاء السابقة
    form.querySelectorAll('.form-error').forEach(error => error.remove());
    
    // التحقق من البيانات
    if (!email || !password) {
        alert('جميع الحقول مطلوبة');
        return;
    }
    
    if (!validateEmail(email)) {
        showError(form.querySelector('[name="email"]'), 'البريد الإلكتروني غير صحيح');
        return;
    }
    
    console.log(`محاولة تسجيل دخول: ${email} - تذكرني: ${remember ? 'نعم' : 'لا'}`);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, remember })
        });
        
        if (!response.ok) {
            let errorMessage = 'حدث خطأ في تسجيل الدخول';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // إذا فشل في قراءة JSON، استخدم الرسالة الافتراضية
            }
            alert(errorMessage);
            return;
        }
        
        const data = await response.json();
        currentUser = data.user;
        updateNavbar();
        
        // عرض رسالة توضح مدة الجلسة
        const sessionDurationText = remember ? '30 يوماً' : '2 ساعة';
        console.log(`تم تسجيل الدخول بنجاح. مدة الجلسة: ${sessionDurationText}`);
        
        // إعادة توجيه حسب نوع المستخدم
        if (currentUser.userType === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// معالج التسجيل
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        userType: formData.get('userType'),
        specialization: formData.get('specialization') || null,
        experience: parseInt(formData.get('experience')) || 0,
        bio: formData.get('bio') || null
    };
    
    // تنظيف الأخطاء السابقة
    form.querySelectorAll('.form-error').forEach(error => error.remove());
    
    // التحقق من البيانات
    if (!userData.firstName || !userData.lastName || !userData.username || !userData.email || !userData.password || !userData.userType) {
        alert('جميع الحقول المطلوبة يجب ملؤها');
        return;
    }
    
    if (!validateEmail(userData.email)) {
        showError(form.querySelector('[name="email"]'), 'البريد الإلكتروني غير صحيح');
        return;
    }
    
    if (!validatePassword(userData.password)) {
        showError(form.querySelector('[name="password"]'), 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    if (userData.password !== userData.confirmPassword) {
        showError(form.querySelector('[name="confirmPassword"]'), 'كلمات المرور غير متطابقة');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            let errorMessage = 'حدث خطأ في إنشاء الحساب';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // إذا فشل في قراءة JSON، استخدم الرسالة الافتراضية
            }
            alert(errorMessage);
            return;
        }
        
        const data = await response.json();
        currentUser = data.user;
        updateNavbar();
        alert('تم إنشاء الحساب بنجاح!');
        
        // إعادة توجيه حسب نوع المستخدم
        if (currentUser.userType === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// معالج إنشاء درس جديد
async function handleCreateLesson(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const lessonData = {
        title: formData.get('title'),
        description: formData.get('description'),
        videoUrl: formData.get('videoUrl'),
        subject: formData.get('subject'),
        grade: formData.get('grade'),
        pdfUrl: formData.get('pdfUrl') || null
    };
    
    // تنظيف الأخطاء السابقة
    form.querySelectorAll('.form-error').forEach(error => error.remove());
    
    // التحقق من البيانات
    if (!lessonData.title || !lessonData.description || !lessonData.subject || !lessonData.grade) {
    alert('العنوان والوصف والمادة والصف مطلوبة');
    return;
}

if (!lessonData.videoUrl && !lessonData.pdfUrl) {
    alert('يجب إضافة رابط فيديو أو ملف PDF على الأقل');
    return;
}
    
    try {
        const response = await fetch('/api/lessons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(lessonData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('تم إنشاء الدرس بنجاح!');
            form.reset();
            
            // إعادة تحميل قائمة الدروس إذا كانت موجودة
            if (typeof loadMyLessons === 'function') {
                loadMyLessons();
            }
        } else {
            alert(data.message || 'حدث خطأ في إنشاء الدرس');
        }
    } catch (error) {
        console.error('خطأ في إنشاء الدرس:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// دالة لحذف درس
async function deleteLesson(lessonId) {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/lessons/${lessonId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('تم حذف الدرس بنجاح');
            
            // إعادة تحميل قائمة الدروس
            if (typeof loadMyLessons === 'function') {
                loadMyLessons();
            }
        } else {
            alert(data.message || 'حدث خطأ في حذف الدرس');
        }
    } catch (error) {
        console.error('خطأ في حذف الدرس:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// إدارة القائمة المنسدلة للمستخدم
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('show');
    }
}

// إغلاق القائمة عند النقر خارجها
document.addEventListener('click', function(event) {
    const userDropdown = document.querySelector('.user-dropdown');
    const userMenu = document.getElementById('userMenu');
    
    if (userDropdown && userMenu && !userDropdown.contains(event.target)) {
        userMenu.classList.remove('show');
    }
});

// فتح نافذة الإعدادات
function openSettings() {
    // إغلاق القائمة المنسدلة
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.remove('show');
    }
    
    // إنشاء نافذة الإعدادات
    const settingsModal = document.createElement('div');
    settingsModal.id = 'settingsModal';
    settingsModal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: var(--card-bg); border-radius: 16px; padding: 2rem; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; color: var(--text-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-color);">⚙️ إعدادات الحساب</h2>
                    <button onclick="closeSettings()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">×</button>
                </div>
                
                <form id="settingsForm">
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-color);">اسم المستخدم</label>
                        <input type="text" id="newUsername" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 16px; background: var(--input-bg); color: var(--text-color);" value="${currentUser ? currentUser.username : ''}" required>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-color);">المظهر</label>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <button type="button" onclick="toggleTheme()" id="themeToggleBtn" class="btn btn-outline" style="display: flex; align-items: center; gap: 0.5rem;">
                                <span id="themeIcon">🌙</span>
                                <span id="themeText">الوضع الداكن</span>
                            </button>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">💾 حفظ التغييرات</button>
                    </div>
                    
                    <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                        <div style="display: flex; gap: 1rem;">
                            <button type="button" onclick="logout()" class="btn btn-outline" style="flex: 1;">🚪 تسجيل الخروج</button>
                            <button type="button" onclick="deleteAccount()" class="btn btn-danger" style="flex: 1;">🗑️ حذف الحساب</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(settingsModal);
    
    // تحديث زر المظهر
    updateThemeButton();
    
    // معالج النموذج
    document.getElementById('settingsForm').addEventListener('submit', handleSettingsUpdate);
}

// إغلاق نافذة الإعدادات
function closeSettings() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.remove();
    }
}

// معالج تحديث الإعدادات
async function handleSettingsUpdate(event) {
    event.preventDefault();
    
    const newUsername = document.getElementById('newUsername').value.trim();
    
    if (!newUsername) {
        alert('يرجى إدخال اسم المستخدم');
        return;
    }
    
    try {
        const response = await fetch('/api/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: newUsername })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateNavbar();
            closeSettings();
            alert('تم تحديث البيانات بنجاح');
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'حدث خطأ في تحديث البيانات');
        }
    } catch (error) {
        console.error('خطأ في تحديث البيانات:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// حذف الحساب
async function deleteAccount() {
    if (!confirm('هل أنت متأكد من حذف حسابك؟ سيتم حذف جميع بياناتك نهائياً ولا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    if (!confirm('تأكيد أخير: هذا الإجراء لا يمكن التراجع عنه. هل تريد المتابعة؟')) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete-account', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('تم حذف الحساب بنجاح');
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'حدث خطأ في حذف الحساب');
        }
    } catch (error) {
        console.error('خطأ في حذف الحساب:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// إعادة تعيين الإعدادات
function resetSettings() {
    if (confirm('هل تريد إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟')) {
        // إعادة تعيين المظهر
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateThemeButton();
        
        // إعادة تعيين اسم المستخدم
        if (currentUser) {
            document.getElementById('newUsername').value = currentUser.username;
        }
        
        alert('تم إعادة تعيين الإعدادات بنجاح');
    }
}

// تحميل إحصائيات المعلم
async function loadTeacherStats() {
    try {
        const response = await fetch('/api/teacher-stats');
        if (response.ok) {
            const stats = await response.json();
            
            const totalLessonsEl = document.getElementById('totalLessons');
            const totalViewsEl = document.getElementById('totalViews');
            const totalLikesEl = document.getElementById('totalLikes');
            
            if (totalLessonsEl) totalLessonsEl.textContent = formatArabicNumber(stats.totalLessons);
            if (totalViewsEl) totalViewsEl.textContent = formatArabicNumber(stats.totalViews);
            if (totalLikesEl) totalLikesEl.textContent = formatArabicNumber(stats.totalLikes);
        }
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

// تحسين دالة تنسيق التاريخ العربي لتستخدم التقويم الميلادي
function formatArabicDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    // استخدام التقويم الميلادي بدلاً من الهجري
    return date.toLocaleDateString('ar-EG', options);
}