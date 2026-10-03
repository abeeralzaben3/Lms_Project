// ===== LocalStorage =====

// قراءة البيانات
export function getData(key) {
  const data = localStorage.getItem(key);
  return data = JSON.parse(data) || [];
}

// حفظ البيانات
export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ===== Cookies =====

// حفظ Cookie
export function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + value + expires + '; path=/';
}

// قراءة Cookie
export function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (let i = 0; i < cookies.length; i++) {
    const parts = cookies[i].split('=');
    if (parts[0] === name) return parts[1];
  }
  return null;
}

// المستخدم الحالي
export function getCurrentUser() {
  const value = getCookie('currentUser');
  return value ? decodeURIComponent(value) : null;
}

// حفظ المستخدم بعد تسجيل الدخول (الإيميل بالكوكي، والبيانات بدون الباسورد بالـ localStorage)
export function saveLoggedInUser(user, days) {
  setCookie('currentUser', encodeURIComponent(user.email), days);

  const safeUser = { ...user };
  delete safeUser.password;
  saveData('loggedInUser', safeUser);
}

// قراءة بيانات المستخدم المسجل (أو null إذا ما في أحد)
export function getLoggedInUser() {
  const raw = localStorage.getItem('loggedInUser');
  return raw ? JSON.parse(raw) : null;
}

// تسجيل الخروج
export function logout() {
  setCookie('currentUser', '', -1);
  localStorage.removeItem('loggedInUser');
}

// ===== المستخدمين =====

// إضافة مستخدم جديد
export async function addUser(fullName, email, phone, password) {
  const users = getData('users');
  const instructors = await getInstructors();
  const students = await getStudents();

  for (const person of users.concat(instructors, students)) {
    if (person.email && person.email.toLowerCase() === email) {
      throw new Error('This email address is already registered');
    }
  }

  const newUser = { id: Date.now(), fullName, email, phone, password, role: 'instructor' };
  instructors.push(newUser);
  saveData('instructors', instructors);
  return newUser;
}

// ===== جلب البيانات من db.json =====

async function loadFromServer(key) {
  let items = getData(key);

  if (items.length === 0) {
    try {
      const response = await fetch('http://localhost:3000/' + key);
      items = await response.json();
      saveData(key, items);
    } catch (error) {
      return [];
    }
  }

  return items;
}

export async function getInstructors() {
  return loadFromServer('instructors');
}

export async function getCourses() {
  return loadFromServer('courses');
}

export default async function getStudents() {
  return loadFromServer('students');
}

// ===== تسجيل الدخول =====
// بيفحص المستخدمين المسجلين + المدرسين + الطلاب، وبيرجع المستخدم مع role
export async function loginUser(email, password) {
  const users = getData('users');
  const instructors = await getInstructors();
  const students = await getStudents();

  const groups = [
    { list: users, role: 'instructor' },       // اللي سجلوا من صفحة التسجيل

    { list: instructors, role: 'instructor' }, // من db.json
    { list: students, role: 'student' }        // من db.json
  ];

  for (const group of groups) {
    for (const person of group.list) {
      if (
        person.email &&
        person.email.toLowerCase() === email &&
        person.password === password
      ) {
        return { ...person, role: group.role };
      }
    }
  }
  return null;
}