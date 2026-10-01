import { getData, setCookie } from './fetchStudents.js';

const form = document.getElementById('loginForm');
const formError = document.getElementById('formError');

// عرض رسالة الخطأ فوق النموذج
function showError(message) {
  if (formError) {
    formError.textContent = message;
  } else if (message !== '') {
    alert(message);
  }
}

// عند الضغط على زر "Sign in"
form.addEventListener('submit', function (event) {
  event.preventDefault();
  showError('');

  // 1) قراءة البيانات
  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;

  if (email === '' || password === '') {
    showError('Please enter your email and password');
    return;
  }

  // 2) البحث عن المستخدم
  const users = getData('users') || [];
  const foundUser = Array.isArray(users)
    ? users.find(function (u) {
        return u.email === email && u.password === password;
      })
    : null;

  // 3) إذا لم يتم العثور على حساب
  if (!foundUser) {
    showError('Incorrect email or password');
    return;
  }

  // 4) حفظ البريد في الـ Cookie
  const days = form.remember && form.remember.checked ? 7 : null;
  setCookie('currentUser', foundUser.email, days);

  // تم إلغاء التحويل التلقائي لـ dashboard.html
});

// أيقونة إظهار / إخفاء كلمة المرور
const eye = document.querySelector('.toggle-pass');

if (eye) {
  eye.addEventListener('click', function () {
    const input = document.getElementById('password');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  });
}