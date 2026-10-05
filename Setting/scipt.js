'use strict';

// =========================================
// HELPERS
// =========================================

const $ = (id) => document.getElementById(id);

function getCookie(name) {
    const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function readList(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

function saveList(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// "Dr. Ahmad Ali" -> "AA"
function getInitials(name) {
    const words = name
        .split(/\s+/)
        .filter(w => w && !/^(dr|prof|mr|mrs|ms|eng)\.?$/i.test(w));

    return words.slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// same rules as the register page
function passwordProblem(password) {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (/\s/.test(password)) return 'Password must not contain spaces.';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain a number.';
    if (!/[!@#$%^&*()_+\-=?.,]/.test(password)) return 'Password must contain a special character (!@#$...).';
    return '';
}

// message that hides itself after 5 seconds
function showMessage(element, text, type) {
    element.textContent = text;
    element.style.color = type === 'success'
        ? 'var(--success, #10b981)'
        : 'var(--error, #f43f5e)';

    if (element.dataset.timerId) {
        clearTimeout(Number(element.dataset.timerId));
    }

    element.dataset.timerId = setTimeout(() => {
        element.textContent = '';
        delete element.dataset.timerId;
    }, 5000);
}


// =========================================
// LOGIN CHECK: only a logged-in instructor can open this page
// =========================================

let currentEmail = (getCookie('currentUser') || '').toLowerCase();
const loggedIn = JSON.parse(localStorage.getItem('loggedInUser') || 'null');

if (!currentEmail || !loggedIn || loggedIn.role !== 'instructor') {
    window.location.href = '../auth/login.html';
}


// =========================================
// ACCOUNT DATA (the real instructor saved by login/register)
// =========================================

function findMe() {
    const instructors = readList('instructors');
    let me = instructors.find(i => i.email && i.email.toLowerCase() === currentEmail);

    // accounts registered before the fix are in "users": move them into "instructors"
    if (!me) {
        const old = readList('users').find(u => u.email && u.email.toLowerCase() === currentEmail);
        if (old) {
            me = { ...old, role: 'instructor' };
            instructors.push(me);
            saveList('instructors', instructors);
        }
    }

    return me || null;
}

// is this email used by anyone else (users, instructors, students)?
function emailTaken(newEmail) {
    const wanted = newEmail.toLowerCase();

    if (wanted === currentEmail) return false;

    return ['users', 'instructors', 'students'].some(key =>
        readList(key).some(p => p.email && p.email.toLowerCase() === wanted)
    );
}

// saves changes to the account everywhere it exists
// (login checks "users" first, so an old account must be updated there too)
function applyChanges(changes) {
    ['instructors', 'users'].forEach(key => {
        const list = readList(key);
        let touched = false;

        list.forEach(person => {
            if (person.email && person.email.toLowerCase() === currentEmail) {
                Object.assign(person, changes);
                touched = true;
            }
        });

        if (touched) saveList(key, list);
    });

    // copy used by the dashboards (never contains the password)
    const safe = { ...changes };
    delete safe.password;
    Object.assign(loggedIn, safe);
    localStorage.setItem('loggedInUser', JSON.stringify(loggedIn));

    // a new email must also change the login cookie
    if (changes.email) {
        currentEmail = changes.email.toLowerCase();
        document.cookie = 'currentUser=' + encodeURIComponent(changes.email) + '; path=/';
    }
}


// =========================================
// SELECT ELEMENTS
// =========================================

const teacherName = $('teacherName');
const teacherEmail = $('teacherEmail');
const profileMessage = $('profileMessage');
const saveProfileBtn = $('saveProfileBtn');

const emailNotifications = $('emailNotifications');
const assignmentNotifications = $('assignmentNotifications');

const changePasswordBtn = $('changePasswordBtn');
const passwordForm = $('passwordForm');
const currentPassword = $('currentPassword');
const newPassword = $('newPassword');
const confirmPassword = $('confirmPassword');
const savePasswordBtn = $('savePasswordBtn');
const passwordMessage = $('passwordMessage');

const darkModeToggle = $('darkModeToggle');

const account = $('account');
const accountMinu = $('accountMinu');
const burgerMinu = $('burgerMinu');
const sideBar = $('sideBar');


// =========================================
// LOAD THE ACCOUNT INTO THE PAGE
// =========================================

function updateTeacherUI(name) {
    const fullName = (name || '').trim();

    $('name').textContent = fullName;
    $('logo').textContent = fullName ? getInitials(fullName) : '';
    $('sidebarName').textContent = fullName;
}

const me = findMe() || loggedIn;

const myName = ((me && (me.fullName || me.name)) || '').trim();

teacherName.value = myName;
teacherEmail.value = (me && me.email) || '';
emailNotifications.checked = Boolean(me && me.emailNotifications);
assignmentNotifications.checked = Boolean(me && me.assignmentNotifications);

updateTeacherUI(myName || (me && me.email) || '');


// =========================================
// SAVE PROFILE
// =========================================

saveProfileBtn.addEventListener('click', function () {
    const name = teacherName.value.trim();
    const email = teacherEmail.value.trim().toLowerCase();

    if (name === '' || email === '') {
        showMessage(profileMessage, 'Please enter your name and email.', 'error');
        return;
    }

    if (name.split(/\s+/).length < 2) {
        showMessage(profileMessage, 'Please enter your first and last name.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage(profileMessage, 'Please enter a valid email address.', 'error');
        return;
    }

    if (emailTaken(email)) {
        showMessage(profileMessage, 'This email address is already registered.', 'error');
        return;
    }

    const mine = findMe();

    if (!mine) {
        showMessage(profileMessage, 'Account not found, please log in again.', 'error');
        return;
    }

    const changes = { fullName: name, email: email };
    if ('name' in mine) changes.name = name; // instructors from db.json use "name"

    applyChanges(changes);
    updateTeacherUI(name);

    showMessage(profileMessage, 'Profile updated successfully!', 'success');
});


// =========================================
// NOTIFICATIONS
// =========================================

function updateNotifications() {
    if (!findMe()) return;

    applyChanges({
        emailNotifications: emailNotifications.checked,
        assignmentNotifications: assignmentNotifications.checked
    });
}

emailNotifications.addEventListener('change', updateNotifications);
assignmentNotifications.addEventListener('change', updateNotifications);


// =========================================
// CHANGE PASSWORD
// =========================================

changePasswordBtn.addEventListener('click', function () {
    passwordForm.style.display =
        passwordForm.style.display === 'block' ? 'none' : 'block';
});

savePasswordBtn.addEventListener('click', function () {
    const current = currentPassword.value;
    const password = newPassword.value;
    const confirmValue = confirmPassword.value;

    if (current === '' || password === '' || confirmValue === '') {
        showMessage(passwordMessage, 'Please fill in all the password fields.', 'error');
        return;
    }

    const mine = findMe();

    if (!mine) {
        showMessage(passwordMessage, 'Account not found, please log in again.', 'error');
        return;
    }

    if (mine.password !== current) {
        showMessage(passwordMessage, 'Current password is incorrect.', 'error');
        return;
    }

    const problem = passwordProblem(password);

    if (problem) {
        showMessage(passwordMessage, problem, 'error');
        return;
    }

    if (password === current) {
        showMessage(passwordMessage, 'The new password must be different.', 'error');
        return;
    }

    if (password !== confirmValue) {
        showMessage(passwordMessage, 'Passwords do not match.', 'error');
        return;
    }

    applyChanges({ password: password });

    showMessage(passwordMessage, 'Password changed successfully!', 'success');

    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
});


// =========================================
// DARK MODE
// =========================================

if (localStorage.getItem('darkMode') === 'true') {
    darkModeToggle.checked = true;
    document.body.classList.add('dark-mode');
}

darkModeToggle.addEventListener('change', function () {
    document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    localStorage.setItem('darkMode', darkModeToggle.checked ? 'true' : 'false');
});


// =========================================
// MENUS
// =========================================

account.addEventListener('click', function (e) {
    e.stopPropagation();
    accountMinu.classList.toggle('activeAccount');
});

burgerMinu.addEventListener('click', function (e) {
    e.stopPropagation();
    sideBar.classList.toggle('activeSide');
});

sideBar.addEventListener('click', e => e.stopPropagation());

function closeMenus() {
    accountMinu.classList.remove('activeAccount');
    sideBar.classList.remove('activeSide');
}

document.addEventListener('click', closeMenus);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenus();
});


// =========================================
// LOGOUT
// =========================================

$('logout').addEventListener('click', function () {
    document.cookie = 'currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    localStorage.removeItem('loggedInUser');
    window.location.href = '../auth/login.html';
});