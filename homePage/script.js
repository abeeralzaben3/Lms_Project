'use strict';

// ==================================================
// helpers
// ==================================================

const $ = (id) => document.getElementById(id);

function getCookie(cookieName) {
    const match = document.cookie.split('; ').find(row => row.startsWith(cookieName + '='));
    return match ? decodeURIComponent(match.slice(cookieName.length + 1)) : null;
}

function readList(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

// uses saved data first; only asks json-server when nothing is saved (never overwrites)
async function loadList(key) {
    let list = readList(key);

    if (!list.length) {
        try {
            const response = await fetch(`http://localhost:3000/${key}`);
            if (response.ok) {
                list = await response.json();
                localStorage.setItem(key, JSON.stringify(list));
            }
        } catch (err) {
            console.error(`Could not load ${key}`, err);
        }
    }

    return list;
}

// "Dr. Ahmad Ali" -> "AA"
function getInitials(fullName) {
    const words = fullName
        .split(/\s+/)
        .filter(w => w && !/^(dr|prof|mr|mrs|ms|eng)\.?$/i.test(w));

    return words.slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}


// ==================================================
// login check: only a logged-in instructor can open this page
// ==================================================

const email = (getCookie('currentUser') || '').toLowerCase();
const loggedIn = JSON.parse(localStorage.getItem('loggedInUser') || 'null');

if (!email || !loggedIn || loggedIn.role !== 'instructor') {
    window.location.href = '/auth/login.html';
}


// ==================================================
// header, sidebar and menus
// ==================================================

const accountMinu = $('accountMinu');
const sideBar = $('sideBar');

function currentInstructor() {
    return readList('instructors').find(i => i.email && i.email.toLowerCase() === email) || loggedIn;
}

const instructor = currentInstructor();
const instructorName = ((instructor && (instructor.fullName || instructor.name)) || '').trim()
    || (instructor && instructor.email) || '';

$('headerName').textContent = instructorName;
$('techName').textContent = instructorName;
$('logo').textContent = instructorName ? getInitials(instructorName) : '';

$('account').addEventListener('click', e => {
    e.stopPropagation();
    accountMinu.classList.toggle('activeAccount');
});

$('burgerMinu').addEventListener('click', e => {
    e.stopPropagation();
    sideBar.classList.toggle('activeSide');
});

sideBar.addEventListener('click', e => e.stopPropagation());

document.addEventListener('click', () => {
    accountMinu.classList.remove('activeAccount');
    sideBar.classList.remove('activeSide');
});

function go(id, url) {
    $(id).addEventListener('click', () => { window.location.href = url; });
}

go('settings', '/Setting/index.html');
go('dashboard', 'index.html');
go('students', '/fuad/students.html');
go('assessments', '/Assessments/index.html');
go('reports', '/Reports/reports.html');
go('attendanceBtn', '/fuad/update.html');

$('logout').addEventListener('click', () => {
    document.cookie = 'currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    localStorage.removeItem('loggedInUser');
    window.location.href = '/auth/login.html';
});


// ==================================================
// dashboard numbers and charts
// ==================================================

async function setStudentInfo() {

    const students = await loadList('students');
    const courses = await loadList('courses');

    // the instructor's courses (by id); a new instructor with none sees every student
    const myCourseIds = courses
        .filter(course => instructor && course.instructorId === instructor.id)
        .map(course => course.id);

    const myStudents = students.filter(student =>
        !student.archived &&
        (!myCourseIds.length || (student.courses || []).some(id => myCourseIds.includes(id)))
    );

    const records = myStudents.flatMap(student => student.attendance || []);
    const dates = [...new Set(records.map(record => record.date))].sort();

    // "today" = today's date if it has records, otherwise the latest recorded day
    const todayText = new Date().toISOString().slice(0, 10);
    const day = dates.includes(todayText) ? todayText : dates[dates.length - 1];

    const hasStatus = (student, status) =>
        (student.attendance || []).some(r => r.date === day && r.status === status);

    const present = day ? myStudents.filter(s => hasStatus(s, 'present')).length : 0;
    const absent = day ? myStudents.filter(s => hasStatus(s, 'absent')).length : 0;

    $('studentsTotal').textContent = myStudents.length;
    $('presentToday').textContent = present;
    $('absentToday').textContent = absent;
    $('attendanceRate').textContent = (present + absent)
        ? ((present / (present + absent)) * 100).toFixed(1) + '%'
        : '-';

    if (typeof Chart === 'undefined') return;


    // ---------- attendance during the week (last 7 recorded days) ----------

    const last7 = dates.slice(-7);

    const labels = last7.map(date =>
        new Date(date).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
    );

    const presentPerDay = last7.map(date =>
        myStudents.filter(student =>
            (student.attendance || []).some(r => r.date === date && r.status === 'present')
        ).length
    );

    new Chart($('attendanceChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Present Students',
                data: presentPerDay,
                borderWidth: 2,
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });


    // ---------- commitment rate (present records / all records) ----------

    if (!records.length) return;

    const presentRecords = records.filter(r => r.status === 'present').length;
    const committed = Number(((presentRecords / records.length) * 100).toFixed(2));
    const notCommitted = Number((100 - committed).toFixed(2));

    new Chart($('commitmentChart'), {
        type: 'doughnut',
        data: {
            labels: [`${committed}% Committed`, `${notCommitted}% Not Committed`],
            datasets: [{ data: [committed, notCommitted], borderWidth: 1 }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

setStudentInfo();