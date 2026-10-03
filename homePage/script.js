'use strict';

// ==================================================
// HELPERS
// ==================================================

const $ = (id) => document.getElementById(id);

function getCookie(cookieName) {
    const match = document.cookie
        .split('; ')
        .find(row => row.startsWith(cookieName + '='));

    return match
        ? decodeURIComponent(match.slice(cookieName.length + 1))
        : null;
}

function readList(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

// Uses saved data first.
// Only asks json-server when nothing is saved.
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
        .filter(
            w => w && !/^(dr|prof|mr|mrs|ms|eng)\.?$/i.test(w)
        );

    return (
        words
            .slice(0, 2)
            .map(w => w[0].toUpperCase())
            .join('') || '?'
    );
}


// ==================================================
// LOGIN CHECK
// Only a logged-in instructor can open this page
// ==================================================

const email = (getCookie('currentUser') || '').toLowerCase();

const loggedIn = JSON.parse(
    localStorage.getItem('loggedInUser') || 'null'
);

if (
    !email ||
    !loggedIn ||
    loggedIn.role !== 'instructor'
) {
    window.location.href = '../auth/login.html';
}


// ==================================================
// HEADER, SIDEBAR AND MENUS
// ==================================================

const accountMinu = $('accountMinu');
const sideBar = $('sideBar');

function currentInstructor() {
    return (
        readList('instructors').find(
            i =>
                i.email &&
                i.email.toLowerCase() === email
        ) || loggedIn
    );
}

const instructor = currentInstructor();

const instructorName =
    (
        (instructor &&
            (instructor.fullName || instructor.name)) ||
        ''
    ).trim() ||
    (instructor && instructor.email) ||
    '';

$('headerName').textContent = instructorName;
$('techName').textContent = instructorName;
$('logo').textContent = instructorName
    ? getInitials(instructorName)
    : '';


// ==================================================
// ACCOUNT MENU
// ==================================================

$('account').addEventListener('click', e => {
    e.stopPropagation();

    accountMinu.classList.toggle('activeAccount');
});


// ==================================================
// BURGER MENU
// ==================================================

$('burgerMinu').addEventListener('click', e => {
    e.stopPropagation();

    sideBar.classList.toggle('activeSide');
});


// Prevent sidebar clicks from closing it
sideBar.addEventListener('click', e => {
    e.stopPropagation();
});


// Click outside -> close menus
document.addEventListener('click', () => {
    accountMinu.classList.remove('activeAccount');
    sideBar.classList.remove('activeSide');
});


// ==================================================
// NAVIGATION
// ==================================================
//
// Dashboard, Students, Assessments, Reports and
// Settings are handled by the HTML <a href="">.
//
// Example:
//
// <a href="../Reports/index.html">Reports</a>
//
// Therefore we DO NOT use JavaScript go() here.
//


// ==================================================
// LOGOUT
// ==================================================

$('logout').addEventListener('click', () => {

    // Remove current user cookie
    document.cookie =
        'currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

    // Remove logged-in user
    localStorage.removeItem('loggedInUser');

    // Go back to login page
    window.location.href = '../auth/login.html';
});


// ==================================================
// ATTENDANCE BUTTON
// ==================================================

$('attendanceBtn').addEventListener('click', () => {
    window.location.href = '../fuad/update.html';
});


// ==================================================
// DASHBOARD NUMBERS AND CHARTS
// ==================================================

async function setStudentInfo() {

    const students = await loadList('students');
    const courses = await loadList('courses');


    // ==================================================
    // INSTRUCTOR COURSES
    // ==================================================

    const myCourseIds = courses
        .filter(
            course =>
                instructor &&
                course.instructorId === instructor.id
        )
        .map(course => course.id);


    // ==================================================
    // INSTRUCTOR STUDENTS
    // ==================================================

    // A new instructor with no courses sees every student.
    const myStudents = students.filter(student => {

        return (
            !student.archived &&
            (
                !myCourseIds.length ||
                (student.courses || []).some(
                    id => myCourseIds.includes(id)
                )
            )
        );

    });


    // ==================================================
    // ATTENDANCE RECORDS
    // ==================================================

    const records = myStudents.flatMap(
        student => student.attendance || []
    );


    // Get unique attendance dates
    const dates = [
        ...new Set(
            records.map(record => record.date)
        )
    ].sort();


    // ==================================================
    // TODAY
    // ==================================================

    // Today's date
    const todayText = new Date()
        .toISOString()
        .slice(0, 10);


    // If today has records, use today.
    // Otherwise use the latest recorded day.
    const day = dates.includes(todayText)
        ? todayText
        : dates[dates.length - 1];


    // ==================================================
    // ATTENDANCE STATUS
    // ==================================================

    const hasStatus = (student, status) => {

        return (student.attendance || []).some(
            record =>
                record.date === day &&
                record.status === status
        );

    };


    // ==================================================
    // PRESENT / ABSENT
    // ==================================================

    const present = day
        ? myStudents.filter(
            student => hasStatus(student, 'present')
        ).length
        : 0;


    const absent = day
        ? myStudents.filter(
            student => hasStatus(student, 'absent')
        ).length
        : 0;


    // ==================================================
    // DASHBOARD CARDS
    // ==================================================

    $('studentsTotal').textContent =
        myStudents.length;

    $('presentToday').textContent =
        present;

    $('absentToday').textContent =
        absent;


    $('attendanceRate').textContent =
        (present + absent)
            ? (
                (present / (present + absent)) * 100
            ).toFixed(1) + '%'
            : '-';


    // ==================================================
    // CHECK CHART.JS
    // ==================================================

    if (typeof Chart === 'undefined') {
        return;
    }


    // ==================================================
    // ATTENDANCE DURING THE WEEK
    // Last 7 recorded days
    // ==================================================

    const last7 = dates.slice(-7);


    const labels = last7.map(date =>
        new Date(date).toLocaleDateString(
            'en-US',
            {
                weekday: 'short',
                timeZone: 'UTC'
            }
        )
    );


    const presentPerDay = last7.map(date => {

        return myStudents.filter(student => {

            return (student.attendance || []).some(
                record =>
                    record.date === date &&
                    record.status === 'present'
            );

        }).length;

    });


    // ==================================================
    // ATTENDANCE LINE CHART
    // ==================================================

    new Chart($('attendanceChart'), {

        type: 'line',

        data: {

            labels,

            datasets: [
                {
                    label: 'Present Students',

                    data: presentPerDay,

                    borderWidth: 2,

                    tension: 0.4,

                    fill: false
                }
            ]

        },

        options: {

            responsive: true,

            plugins: {
                legend: {
                    display: true
                }
            },

            scales: {

                y: {
                    beginAtZero: true,

                    ticks: {
                        precision: 0
                    }
                }

            }

        }

    });


    // ==================================================
    // COMMITMENT RATE
    // ==================================================

    if (!records.length) {
        return;
    }


    const presentRecords = records.filter(
        record => record.status === 'present'
    ).length;


    const committed = Number(
        (
            (presentRecords / records.length) * 100
        ).toFixed(2)
    );


    const notCommitted = Number(
        (100 - committed).toFixed(2)
    );


    // ==================================================
    // COMMITMENT DOUGHNUT CHART
    // ==================================================

    new Chart($('commitmentChart'), {

        type: 'doughnut',

        data: {

            labels: [
                `${committed}% Committed`,
                `${notCommitted}% Not Committed`
            ],

            datasets: [
                {
                    data: [
                        committed,
                        notCommitted
                    ],

                    borderWidth: 1
                }
            ]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    position: 'bottom'
                }

            }

        }

    });

}


// ==================================================
// LOAD DASHBOARD
// ==================================================

setStudentInfo();