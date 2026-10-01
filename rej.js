

import { addUser } from './fetchStudents.js';



const form = document.getElementById('registerForm');
const formError = document.getElementById('formError');


  if (formError) {
    formError.textContent = message;
  } else if (message !== '') {
    alert(message);
  }


// When the user clicks "Create account"
form.addEventListener('submit', function (event) {
  event.preventDefault(); // stop the page from reloading
  showError('');

  // 1) Read the values
  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim().toLowerCase();
  const phone = form.phone.value.trim();
  const password = form.password.value;

  // 2) Validate them
  if (fullName.length < 3) {
    showError('Please enter your full name');
    return;
  }
if (!email.includes('@') || !email.includes('.')) {
  showError('Invalid email address');
  return;
}

if (isNaN(phone) || phone.length < 9 || phone.length > 15) {
  showError('Invalid phone number (digits only)');
  return;
}
  if (password.length < 8) {
    showError('Password must be at least 8 characters');
    return;
  }
  if (!form.terms.checked) {
    showError('You must agree to the terms');
    return;
  }

  // 3) Add the teacher (addUser checks for a duplicate email and throws an error)
  try {
    addUser(fullName, email, phone, password);
  } catch (err) {
    showError(err.message);
    return;
  }

  // 4) Go to the login page
  alert('Account created successfully');
  location.href = 'login.html';
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