// ===== LocalStorage =====

// قراءة البيانات
export function getData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
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
  return getCookie('currentUser');
}

// تسجيل الخروج (بنمسح الكوكي)
export function logout() {
  setCookie('currentUser', '', -1);
}

// ===== المستخدمين =====

// إضافة مستخدم جديد
export function addUser(fullName, email, phone, password) {
  const users = getData('users');

  for (let i = 0; i < users.length; i++) {
    if (users[i].email === email) {
      throw new Error('This email address is already registered');
    }
  }

  const newUser = { id: Date.now(), fullName, email, phone, password };
  users.push(newUser);
  saveData('users', users);
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
// بيقارن المدخلات مع المستخدمين المسجلين ومع المدرسين
export async function loginUser(email, password) {
  const users = getData('users');
  const instructors = await getInstructors();
  const all = users.concat(instructors);

  for (let i = 0; i < all.length; i++) {
    if (all[i].email === email && all[i].password === password) {
      return all[i];
    }
  }
  return null;
}