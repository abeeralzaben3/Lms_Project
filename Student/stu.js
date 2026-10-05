'use strict';

const $ = (id) => document.getElementById(id);

// course id -> display name (unknown ids are shown as they are)
const courseNames = { c1: 'JS101', c2: 'Databases' };

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

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function getInitials(name) {
    const words = name
        .split(/\s+/)
        .filter(w => w && !/^(dr|prof|mr|mrs|ms|eng)\.?$/i.test(w));

    return words.slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}


// ==================================================
// login check: only a logged-in instructor can open this page
// ==================================================

const loggedIn = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
const allowed = getCookie('currentUser') && loggedIn && loggedIn.role === 'instructor';

if (!allowed) {
    window.location.href = '../auth/login.html';
}


// ==================================================
// data (saved list first; json-server only when nothing is saved)
// ==================================================

async function getStudentData() {
    let students = readList('students');

    if (!students.length) {
        try {
            const response = await fetch('http://localhost:3000/students');
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

            students = await response.json();
            localStorage.setItem('students', JSON.stringify(students));
        } catch (error) {
            console.error('Error fetching student data:', error);
            return [];
        }
    }

    return students;
}

// the student's course names (new shape: courses array, old shape: course text)
function courseText(student) {
    if (Array.isArray(student.courses) && student.courses.length) {
        return student.courses.map(id => courseNames[id] || id).join(', ');
    }
    return student.course || '-';
}

// the latest attendance status (new shape: records array, old shape: text)
function attendanceText(student) {
    const a = student.attendance;

    if (Array.isArray(a)) {
        return a.length ? a[a.length - 1].status : 'No records';
    }
    return a || 'No records';
}


// ==================================================
// show students
// ==================================================

let allStudents = [];

function renderStudents(list) {
    const container = $('StudentData');

    if (!list.length) {
        container.innerHTML = '<p class="noResults">No students found</p>';
        return;
    }

    container.innerHTML = list.map(student => {
        const status = attendanceText(student);
        const absent = String(status).toLowerCase() === 'absent';

        return `
        <div class="carddiv ${absent ? 'absent-card' : ''}">
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="">

            <p>${esc(student.studentId ?? student.id)}</p>
            <p>${esc(student.name)}</p>
            <p>${esc(courseText(student))}</p>
            <p>${esc(status)}</p>

            <button type="button" class="btn btn-outline-danger"
                data-action="delete" data-id="${esc(student.id)}">Delete</button>

            <button type="button" class="btn btn-outline-primary"
                data-action="update" data-id="${esc(student.id)}">Update</button>
        </div>`;
    }).join('');
}

function visibleStudents() {
    return allStudents.filter(student => !student.archived);
}

// filter by id, student id, name or course (case-insensitive)
function searchStudents() {
    const query = $('searchInput').value.trim().toLowerCase();
    const list = visibleStudents();

    if (!query) {
        renderStudents(list);
        return;
    }

    renderStudents(list.filter(student =>
        [student.id, student.studentId, student.name, courseText(student)]
            .some(value => String(value ?? '').toLowerCase().includes(query))
    ));
}


// ==================================================
// delete / update
// ==================================================

function deleteStudent(id) {
    const student = allStudents.find(s => String(s.id) === String(id));
    if (!student) return;

    if (!confirm(`Delete ${student.name || 'this student'}?`)) return;

    allStudents = allStudents.filter(s => String(s.id) !== String(id));
    localStorage.setItem('students', JSON.stringify(allStudents));

    searchStudents();
}

function updateStudent(id) {
    localStorage.setItem('editingStudentId', id);
    window.location.href = 'update.html';
}

// one listener for every Delete / Update button
$('StudentData').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    if (button.dataset.action === 'delete') deleteStudent(button.dataset.id);
    if (button.dataset.action === 'update') updateStudent(button.dataset.id);
});


// ==================================================
// header, menus, logout
// ==================================================

if (allowed) {
    const instructorName = ((loggedIn.fullName || loggedIn.name) || '').trim() || loggedIn.email || '';

    $('name').textContent = instructorName;
    $('logo').textContent = instructorName ? getInitials(instructorName) : '';

    const techName = document.querySelector('.techName');
    if (techName) techName.textContent = instructorName;
}

const accountMinu = $('accountMinu');
const sideBar = $('sideBar');

$('account').addEventListener('click', e => {
    e.stopPropagation();
    accountMinu.classList.toggle('activeAccount');
});

$('burgerMinu').addEventListener('click', e => {
    e.stopPropagation();
    sideBar.classList.toggle('open');
});

sideBar.addEventListener('click', e => e.stopPropagation());

document.addEventListener('click', () => {
    accountMinu.classList.remove('activeAccount');
    sideBar.classList.remove('open');
});

const logoutBtn = $('logout');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        document.cookie = 'currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        localStorage.removeItem('loggedInUser');
        window.location.href = '../auth/login.html';
    });
}


// ==================================================
// start
// ==================================================

window.addEventListener('load', async () => {
    if (!allowed) return;

    allStudents = await getStudentData();
    renderStudents(visibleStudents());

    const input = $('searchInput');

    input.addEventListener('input', searchStudents);
    $('searchBtn').addEventListener('click', searchStudents);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') searchStudents();
    });
});