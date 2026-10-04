'use strict';


// ==================================================
// IMPORT
// ==================================================

import {
    getInstructors,
    getCourses,
    default as getStudents,
    getCookie,
    getLoggedInUser,
    logout
} from '../auth/fetchStudents.js';


// ==================================================
// HELPERS
// ==================================================

const $ = (id) =>
    document.getElementById(id);


// ==================================================
// INITIALS
// ==================================================

function getInitials(fullName) {

    if (!fullName) {
        return '?';
    }


    const words =
        fullName
            .split(/\s+/)
            .filter(Boolean);


    return (
        words
            .slice(0, 2)
            .map(
                word =>
                    word[0].toUpperCase()
            )
            .join('')
            || '?'
    );
}


// ==================================================
// LOGIN CHECK
// ==================================================

const email =
    (getCookie('currentUser') || '')
        .toLowerCase();


const loggedIn =
    getLoggedInUser();


if (
    !email ||
    !loggedIn ||
    loggedIn.role !== 'instructor'
) {

    window.location.href =
        '../auth/login.html';
}


// ==================================================
// ACCOUNT MENU
// ==================================================

const account =
    $('account');

const accountMinu =
    $('accountMinu');


// فتح / إغلاق Account Menu

account.addEventListener(
    'click',
    function (event) {

        event.stopPropagation();

        accountMinu.classList.toggle(
            'activeAccount'
        );
    }
);


// ==================================================
// BURGER MENU
// ==================================================

const burgerMinu =
    $('burgerMinu');

const sideBar =
    $('sideBar');


burgerMinu.addEventListener(
    'click',
    function (event) {

        event.stopPropagation();

        sideBar.classList.toggle(
            'activeSide'
        );
    }
);


// منع إغلاق Sidebar عند الضغط داخله

sideBar.addEventListener(
    'click',
    function (event) {

        event.stopPropagation();
    }
);


// الضغط خارج القوائم

document.addEventListener(
    'click',
    function () {

        accountMinu.classList.remove(
            'activeAccount'
        );

        sideBar.classList.remove(
            'activeSide'
        );
    }
);


// ==================================================
// LOGOUT
// ==================================================

$('logout').addEventListener(
    'click',
    function (event) {

        event.stopPropagation();

        logout();

        window.location.href =
            '../auth/login.html';
    }
);


// ==================================================
// ATTENDANCE BUTTON
// ==================================================

$('attendanceBtn').addEventListener(
    'click',
    function () {

        window.location.href =
            '../Student/update.html';
    }
);


// ==================================================
// SEARCH
// ==================================================

const searchInput =
    $('searchInput');


searchInput.addEventListener(
    'input',
    async function () {

        const search =
            this.value
                .trim()
                .toLowerCase();


        if (!search) {
            return;
        }


        const students =
            await getStudents();


        const results =
            students.filter(
                student => {

                    const name =
                        (
                            student.name ||
                            student.fullName ||
                            ''
                        ).toLowerCase();


                    const studentId =
                        String(
                            student.studentId ||
                            student.id ||
                            ''
                        ).toLowerCase();


                    return (
                        name.includes(search) ||
                        studentId.includes(search)
                    );
                }
            );


        console.log(
            'Search results:',
            results
        );
    }
);


// ==================================================
// DASHBOARD
// ==================================================

async function setStudentInfo() {

    try {

        // ==================================================
        // LOAD DATA
        // ==================================================

        const students =
            await getStudents();


        const courses =
            await getCourses();


        const instructors =
            await getInstructors();


        // ==================================================
        // CURRENT INSTRUCTOR
        // ==================================================

        const instructor =
            instructors.find(
                item =>
                    item.email &&
                    item.email.toLowerCase() === email
            ) || loggedIn;


        // ==================================================
        // INSTRUCTOR NAME
        // ==================================================

        const instructorName =
            (
                instructor.fullName ||
                instructor.name ||
                instructor.email ||
                ''
            ).trim();


        // Header name

        $('headerName').textContent =
            instructorName || 'Instructor';


        // Sidebar name

        $('techName').textContent =
            instructorName || 'Instructor';


        // Initials

        $('logo').textContent =
            getInitials(instructorName);


        // ==================================================
        // INSTRUCTOR COURSES
        // ==================================================

        const myCourseIds =
            courses
                .filter(
                    course =>
                        instructor &&
                        String(course.instructorId) ===
                        String(instructor.id)
                )
                .map(
                    course =>
                        course.id
                );


        // ==================================================
        // INSTRUCTOR STUDENTS
        // ==================================================

        const myStudents =
            students.filter(
                student => {

                    if (student.archived) {
                        return false;
                    }


                    // إذا المدرس عنده courses
                    // نعرض فقط طلاب courses الخاصة به

                    if (myCourseIds.length > 0) {

                        return (
                            Array.isArray(
                                student.courses
                            ) &&
                            student.courses.some(
                                courseId =>
                                    myCourseIds.includes(
                                        courseId
                                    )
                            )
                        );
                    }


                    // مدرس جديد بدون courses
                    // يشوف كل الطلاب

                    return true;
                }
            );


        // ==================================================
        // ATTENDANCE RECORDS
        // ==================================================

        const records =
            myStudents.flatMap(
                student =>
                    Array.isArray(
                        student.attendance
                    )
                        ? student.attendance
                        : []
            );


        // ==================================================
        // DATES
        // ==================================================

        const dates = [
            ...new Set(
                records
                    .map(
                        record =>
                            record.date
                    )
                    .filter(Boolean)
            )
        ].sort();


        // ==================================================
        // TODAY
        // ==================================================

        const todayText =
            new Date()
                .toISOString()
                .slice(0, 10);


        // إذا في Attendance اليوم
        // نستخدم اليوم
        //
        // وإذا ما في
        // نستخدم آخر يوم مسجل

        const day =
            dates.includes(todayText)
                ? todayText
                : dates[dates.length - 1];


        // ==================================================
        // STATUS FUNCTION
        // ==================================================

        function hasStatus(
            student,
            status
        ) {

            const attendance =
                Array.isArray(
                    student.attendance
                )
                    ? student.attendance
                    : [];


            return attendance.some(
                record =>
                    record.date === day &&
                    record.status === status
            );
        }


        // ==================================================
        // PRESENT
        // ==================================================

        const present =
            day
                ? myStudents.filter(
                    student =>
                        hasStatus(
                            student,
                            'present'
                        )
                ).length
                : 0;


        // ==================================================
        // ABSENT
        // ==================================================

        const absent =
            day
                ? myStudents.filter(
                    student =>
                        hasStatus(
                            student,
                            'absent'
                        )
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


        const attendanceRate =
            present + absent > 0
                ? (
                    present /
                    (present + absent)
                ) * 100
                : null;


        $('attendanceRate').textContent =
            attendanceRate !== null
                ? attendanceRate.toFixed(1) + '%'
                : '-';


        // ==================================================
        // CHART.JS CHECK
        // ==================================================

        if (typeof Chart === 'undefined') {

            console.error(
                'Chart.js is not loaded'
            );

            return;
        }


        // ==================================================
        // LAST 7 DAYS
        // ==================================================

        const last7 =
            dates.slice(-7);


        const labels =
            last7.map(
                date =>
                    new Date(date)
                        .toLocaleDateString(
                            'en-US',
                            {
                                weekday: 'short',
                                timeZone: 'UTC'
                            }
                        )
            );


        // ==================================================
        // PRESENT PER DAY
        // ==================================================

        const presentPerDay =
            last7.map(
                date => {

                    return myStudents.filter(
                        student => {

                            const attendance =
                                Array.isArray(
                                    student.attendance
                                )
                                    ? student.attendance
                                    : [];


                            return attendance.some(
                                record =>
                                    record.date === date &&
                                    record.status === 'present'
                            );
                        }
                    ).length;
                }
            );


        // ==================================================
        // ATTENDANCE LINE CHART
        // ==================================================

        const attendanceCanvas =
            $('attendanceChart');


        if (attendanceCanvas) {

            new Chart(
                attendanceCanvas,
                {
                    type: 'line',

                    data: {

                        labels: labels,

                        datasets: [

                            {
                                label:
                                    'Present Students',

                                data:
                                    presentPerDay,

                                borderWidth: 2,

                                tension: 0.4,

                                fill: false
                            }
                        ]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

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
                }
            );
        }


        // ==================================================
        // COMMITMENT RATE
        // ==================================================

        const commitmentCanvas =
            $('commitmentChart');


        if (!commitmentCanvas) {
            return;
        }


        // لا يوجد attendance
        if (!records.length) {

            return;
        }


        // جميع سجلات الحضور
        const presentRecords =
            records.filter(
                record =>
                    record.status === 'present'
            ).length;


        const committed =
            Number(
                (
                    presentRecords /
                    records.length *
                    100
                ).toFixed(2)
            );


        const notCommitted =
            Number(
                (
                    100 -
                    committed
                ).toFixed(2)
            );


        // ==================================================
        // DOUGHNUT CHART
        // ==================================================

        new Chart(
            commitmentCanvas,
            {

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

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position: 'bottom'
                        }
                    }
                }
            }
        );


    } catch (error) {

        console.error(
            'Dashboard loading error:',
            error
        );
    }
}


// ==================================================
// START DASHBOARD
// ==================================================

setStudentInfo();