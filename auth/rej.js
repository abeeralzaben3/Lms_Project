import { addUser } from './fetchStudents.js';

const form = document.getElementById('registerForm');
const formError = document.getElementById('formError');

function showError(message) {
  if (formError) {
    formError.textContent = message;
  } else if (message !== '') {
    alert(message);
  }
}

// دالة بتفحص إذا النص فيه أي حرف من الحروف المعطاة
function hasAny(text, chars) {
  for (let i = 0; i < text.length; i++) {
    if (chars.includes(text[i])) return true;
  }
  return false;
}

const digits = '0123456789';
const specials = '!@#$%^&*()_+-=?.,';

// الاسم: ممنوع الأرقام والرموز (بدون - عشان أسماء مثل Al-Bayt)
const nameBlocked = digits + '!@#$%^&*()_+=?.,<>/\\|{}[]';

// When the user clicks "Create account"
form.addEventListener('submit', async function (event) {
  event.preventDefault(); // stop the page from reloading
  showError('');

  // 1) Read the values
  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim().toLowerCase();
  const phone = form.phone.value.trim();
  const password = form.password.value;

  // 2) Validate them

  // الاسم: كلمتين على الأقل وبدون أرقام ولا رموز
  if (fullName.split(/\s+/).length < 2) {
    showError('Please enter your full name (first and last name)');
    return;
  }
  if (hasAny(fullName, nameBlocked)) {
    showError('Name must contain letters only');
    return;
  }

  // الإيميل
  if (email.includes(' ')) {
    showError('Email must not contain spaces');
    return;
  }
  if (email.indexOf('@') < 1 || email.indexOf('@') !== email.lastIndexOf('@')) {
    showError('Email must have one @ with a name before it');
    return;
  }
  if (email.lastIndexOf('.') < email.indexOf('@') + 2 || email.endsWith('.')) {
    showError('Email must look like name@gmail.com');
    return;
  }

  // الرقم: 10 خانات وأرقام فقط
  if (phone.length !== 10) {
    showError('Phone number must be exactly 10 digits');
    return;
  }
  for (let i = 0; i < phone.length; i++) {
    if (!digits.includes(phone[i])) {
      showError('Phone number must contain digits only');
      return;
    }
  }

  // كلمة السر القوية
  if (password.length < 8) {
    showError('Password must be at least 8 characters');
    return;
  }
  if (password.includes(' ')) {
    showError('Password must not contain spaces');
    return;
  }
  if (password === password.toLowerCase()) {
    showError('Password must contain an uppercase letter');
    return;
  }
  if (password === password.toUpperCase()) {
    showError('Password must contain a lowercase letter');
    return;
  }
  if (!hasAny(password, digits)) {
    showError('Password must contain a number');
    return;
  }
  if (!hasAny(password, specials)) {
    showError('Password must contain a special character (!@#$...)');
    return;
  }

  // الموافقة على الشروط
  if (!form.terms.checked) {
    showError('You must agree to the terms');
    return;
  }

  // 3) Add the instructor (addUser checks for a duplicate email and throws an error)
  try {
    await addUser(fullName, email, phone, password);
  } catch (err) {
    showError(err.message);
    return;
  }

  // 4) Go to the login page
  alert('Account created successfully');
  location.href = '../homepage/index.html';
});

// Eye icon: show / hide password
const eye = document.querySelector('.toggle-pass');

if (eye) {
  eye.addEventListener('click', function () {
    const input = document.getElementById('password');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  });
}