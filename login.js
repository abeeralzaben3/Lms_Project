import { loginUser, saveLoggedInUser } from './fetchStudents.js';

const form = document.getElementById('loginForm');
const formError = document.getElementById('formError');

function showError(message) {
  if (formError) {
    formError.textContent = message;
  } else if (message !== '') {
    alert(message);
  }
}

form.addEventListener('submit', async function (event) {
  event.preventDefault();
  showError('');

  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;

  if (email === '') {
    showError('Please enter your email');
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    showError('Please enter a valid email');
    return;
  }
  if (password === '') {
    showError('Please enter your password');
    return;
  }

  // Compare with registered users (localStorage) and instructors (db.json)
  const foundUser = await loginUser(email, password);

  if (!foundUser) {
    showError('Incorrect email or password');
    return;
  }

  // Save in cookie (email) + localStorage (user data without password)
  const days = form.remember && form.remember.checked ? 7 : null;
  saveLoggedInUser(foundUser, days);

  window.location.href = 'dashboard.html';
});

const eye = document.querySelector('.toggle-pass');

if (eye) {
  eye.addEventListener('click', function () {
    const input = document.getElementById('password');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  });
}