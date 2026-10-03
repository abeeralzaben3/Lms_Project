// ===== LocalStorage =====

export function getData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ===== Cookies =====

export function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + value + expires + '; path=/';
}

export function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) return value;
  }
  return null;
}

// ===== المستخدم الحالي =====

export function getCurrentUser() {
  const value = getCookie('currentUser');
  return value ? decodeURIComponent(value) : null;
}

// الإيميل بالكوكي، والبيانات بدون الباسورد بالـ localStorage
export function saveLoggedInUser(user, days) {
  setCookie('currentUser', encodeURIComponent(user.email), days);

  const safeUser = { ...user };
  delete safeUser.password;
  localStorage.setItem('loggedInUser', JSON.stringify(safeUser));
}

export function getLoggedInUser() {
  const raw = localStorage.getItem('loggedInUser');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  setCookie('currentUser', '', -1);
  localStorage.removeItem('loggedInUser');
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

export function getInstructors() {
  return loadFromServer('instructors');
}

export function getCourses() {
  return loadFromServer('courses');
}

export function getStudents() {
  return loadFromServer('students');
}

export default getStudents;

// ===== المستخدمين =====

export async function addUser(fullName, email, phone, password) {
  const users = getData('users');
  const instructors = await getInstructors();
  const students = await getStudents();

  const everyone = users.concat(instructors, students);
  for (const person of everyone) {
    if (person.email && person.email.toLowerCase() === email) {
      throw new Error('This email address is already registered');
    }
  }

  const newUser = { id: Date.now(), fullName, email, phone, password, role: 'instructor' };
  instructors.push(newUser);
  saveData('instructors', instructors);
  return newUser;
}

export async function loginUser(email, password) {
  const users = getData('users');
  const instructors = await getInstructors();
  const students = await getStudents();

  const groups = [
    { list: users, role: 'instructor' },
    { list: instructors, role: 'instructor' },
    { list: students, role: 'student' }
  ];

  for (const group of groups) {
    for (const person of group.list) {
      if (person.email && person.email.toLowerCase() === email && person.password === password) {
        return { ...person, role: group.role };
      }
    }
  }
  return null;
}