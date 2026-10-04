'use strict'
const accountMinu = document.getElementById("accountMinu");
const account = document.getElementById("account");
const burgerMinu = document.getElementById("burgerMinu");
const sideBar = document.getElementById("sideBar");
const attendanceChart = document.getElementById("attendanceChart");
const headerName = document.getElementById("headerName");
const techName = document.getElementById("techName");
const logo = document.getElementById("logo");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const studentsTotal = document.getElementById("studentsTotal");
const presentToday = document.getElementById("presentToday");
const absentToday = document.getElementById("absentToday");
const attendanceRate = document.getElementById("attendanceRate");
const settings = document.getElementById("settings");
const logout = document.getElementById("logout");
const attendanceBtn = document.getElementById("attendanceBtn");
const dashboard = document.getElementById("dashboard");
const assessments = document.getElementById("assessments");
const students = document.getElementById("students");
const reports = document.getElementById("reports");



// =====================cookies=====================
// ===================== Current User =====================

function getCookie(cookieName) {
    const match = document.cookie
        .split("; ")
        .find(row => row.startsWith(cookieName + "="));

    return match
        ? decodeURIComponent(match.slice(cookieName.length + 1))
        : null;
}

const email = (getCookie("currentUser") || "").toLowerCase();

const loggedIn = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
);

const instructors = JSON.parse(
    localStorage.getItem("instructors") || "[]"
);

const currentInstructor = instructors.find(
    instructor =>
        instructor.email &&
        instructor.email.toLowerCase() === email
);

const name =
    currentInstructor?.name ||
    currentInstructor?.fullName ||
    loggedIn?.name ||
    "";

headerName.textContent = name;
techName.textContent = name;
logo.textContent = name.slice(0, 2).toUpperCase();

// ======================Account Minu=======================

account.addEventListener("click", function (e) {
    accountMinu.classList.toggle("activeAccount");
})

burgerMinu.addEventListener('click', function (e) {
    sideBar.classList.toggle("activeSide");


});

//======================Sitting & Log out=============================
settings.addEventListener("click", function (e) {
    window.location.href = "../Setting/index.html"
})
logout.addEventListener("click", function (e) {
    document.cookie = "currentUser=; max-age=0; path=/"
    window.location.href = "../auth/login.html"
})


//=====================Side link=======================================

dashboard.addEventListener("click", function (e) {
    window.location.href = "index.html"
})

students.addEventListener("click", function (e) {
    window.location.href = "../Student/students.html"
})

assessments.addEventListener("click", function (e) {
    window.location.href = "../Assessments/index.html"
})

reports.addEventListener("click", function (e) {
    window.location.href = "../Reports/index.html"
})

// ===================attendanceBtn=====================

attendanceBtn.addEventListener("click", function (e) {
    window.location.href = "../Student/update.html"
})

// ===================INFORMATION SECTION===================


async function getData(info) {
    const savedData = localStorage.getItem(info);

    if (savedData) {
        return JSON.parse(savedData);
    }

    const response = await fetch(`http://localhost:3000/${info}`);
    const data = await response.json();

    localStorage.setItem(info, JSON.stringify(data));

    return data;
}


// ===================instOfStudent===================

async function getCourseID() {

    const instructors = await getData("instructors");
    const courses = await getData("courses");
    let instCourse;
    for (const instructor of instructors) {
        if (instructor.name === name) {

            const instId = instructor.id;

            for (const course of courses) {

                if (course.instructorId === instId) {
                    instCourse = course.id

                }
            }
        }

    }
    return instCourse;
}


// ===================setStudentInfo===================

async function setStudentInfo() {

    const students = await getData("students");
    const coursId = await getCourseID();

    let attendcount = 0;
    let absentcount = 0;
    let totalAttendance = 0;
    let totalpresentCount = 0;

    const myStudents = students.filter(student =>
        student.courses.includes(coursId)
    );


    for (const student of myStudents) {

        for (const attend of student.attendance) {

            totalAttendance++;

            if (attend.status === "present") {
                totalpresentCount++;
            }
        }

        if (student.attendance.length === 0 || student.archived === true) {
            continue;
        }

        const lastAttendance =
            student.attendance[student.attendance.length - 1];

        if (lastAttendance.status === "present") {
            attendcount++;
        } else {
            absentcount++;
        }
    }

    const totalStudents = attendcount + absentcount;
    studentsTotal.textContent = totalStudents;
    presentToday.textContent = attendcount;
    absentToday.textContent = absentcount;

    attendanceRate.textContent =
        (attendcount) == 0 ?0+"%": ((attendcount / (attendcount + absentcount)) * 100).toFixed(1) + "%";



    //========================= AttendanceChart Chart  =========================


    const dates = [...new Set(
        myStudents.flatMap(student =>
            student.attendance.map(record => record.date)
        )
    )].sort();

    const presentStudents = dates.map(date =>
        myStudents.filter(student =>
            student.attendance.some(record =>
                record.date === date &&
                record.status === "present" &&
                student.archived === false
            )
        ).length
    );
    const last7Days = dates.slice(-7);

    const labels = last7Days.map(date => {
        const d = new Date(date);

        return d.toLocaleDateString("en-US", {
            weekday: "short"
        });
    });

    new Chart(attendanceChart, {
        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Present Students",
                data: presentStudents,
                borderWidth: 2,
                tension: 0.4,
                fill: false
            }]
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
                    beginAtZero: true
                }
            }
        }
    });




    //==============================COMMITMENT CHART==============================

    const commitmentReat = (totalpresentCount / totalAttendance * 100).toFixed(2)
    console.log(commitmentReat)
    const commitmentChart = document.getElementById("commitmentChart");

    new Chart(commitmentChart, {

        type: "doughnut",

        data: {

            labels: [
                commitmentReat + "% Committed ",
                100 - commitmentReat + "% Not Committed"
            ],

            datasets: [{

                data: [
                    commitmentReat,
                    100 - commitmentReat
                ],

                borderWidth: 1

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    })
}
setStudentInfo();