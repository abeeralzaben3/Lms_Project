
export function getData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// حفظ البيانات في LocalStorage
export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// إنشاء Cookie (حفظ المستخدم المسجل)
export function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

// جلب الـ Cookie المطلوبة
export function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// معرفة البريد الإلكتروني للمستخدم الحالي
export function getCurrentUser() {
  return getCookie('currentUser');
}

// إضافة حساب جديد مع التحقق من عدم تكرار البريد (تستخدمها rej.js)
export function addUser(fullName, email, phone, password) {
  const users = getData('users');

  // التأكد من عدم وجود بريد مستخدم مسجل سابقاً
  const exists = users.some((user) => user.email === email);
  if (exists) {
    throw new Error('This email address is already registered');
  }

  const newUser = {
    id: Date.now(),
    fullName,
    email,
    phone,
    password,
  };

  users.push(newUser);
  saveData('users', users);
  return newUser;
}

// جلب قائمة الطلاب من LocalStorage أو من سيرفر فرعي (تلقائي)
export default async function getStudents() {
  let students = getData('students');

  if (!students.length) {
    try {
      const response = await fetch('http://localhost:3000/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      students = await response.json();
      saveData('students', students);
    } catch (error) {
      console.warn('Could not fetch from server, returning empty array:', error);
      return [];
    }
  }

  return students;
}