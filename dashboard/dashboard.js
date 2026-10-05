import { fetchApi } from "../Api/fetch.js";
import { Cookie } from "../cookies/cookies.js";

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
const studentsli = document.getElementById("students");
const reports = document.getElementById("reports");

let instructors = JSON.parse(localStorage.getItem("instructors")) || []
let students = JSON.parse(localStorage.getItem("students")) || []
let courses = JSON.parse(localStorage.getItem("courses")) || []
// ==================get cookies=======================

const userCookie = new Cookie()
const currentUser = userCookie.getCookie("currentUser")
const userEmail = userCookie.getCookie("userEmail")
const userId = userCookie.getCookie("userId")


headerName.textContent = currentUser;
techName.textContent = currentUser;
logo.textContent = currentUser.slice(0, 2).toUpperCase();

// ==================minu and side=======================

account.addEventListener("click", function (e) {
    accountMinu.classList.toggle("activeAccount");
})

burgerMinu.addEventListener('click', function (e) {
    sideBar.classList.toggle("activeSide");


});
// =================== LINKS ===================

dashboard.addEventListener("click", function () {
    window.location.href = "./dashboard.html";
});


studentsli.addEventListener("click", function () {
    window.location.href = "../student/students.html";
});


assessments.addEventListener("click", function () {
    window.location.href = "../assessments/assessments.html";
});


reports.addEventListener("click", function () {
    window.location.href = "../reports/reports.html";
});

logout.addEventListener("click", function () {
    window.location.href = "../login/login.html";
});

settings.addEventListener("click", function () {
    window.location.href = "../settings/settings.html";
});
// =================== Get My Courses ===================

async function myCourses(userId) {

    if (!courses.length) {
        courses = await fetchApi("courses");
    }

    const myCourses = courses.filter(function (course) {

        return course.instructorId === userId;

    });

    return myCourses;
}


// =================== Get My Students ===================

async function myStudents(courseData) {

    if (!students.length) {
        students = await fetchApi("students");
    }

    const myStudents = students.filter(function (student) {

        return student.courses.includes(courseData.id);

    });

    return myStudents;
}

// =================== Calculate Attendance ===================

function updateAttendance(studentsData) {

    
    const totalStudents = studentsData.length;

    const today ="2026-10-03" //new Date().toISOString().split("T")[0];

    const presentStudents = studentsData.filter(function (student) {

        return student.attendance.some(function (attendance) {

            return attendance.date === today &&
                   attendance.status === "present" &&
                   student.archived===false; 


        });

    });

    const absentStudents = studentsData.filter(function (student) {

        return student.attendance.some(function (attendance) {

            return attendance.date === today &&
                   attendance.status === "absent";

        });

    });

    let rate = 0;

    if (totalStudents > 0) {
        rate = (presentStudents.length / totalStudents) * 100;
    }

    studentsTotal.textContent = totalStudents;

    presentToday.textContent = presentStudents.length;

    absentToday.textContent = absentStudents.length;

    attendanceRate.textContent = `${rate.toFixed(1)}%`;
}
// =================== Run ===================

myCourses(userId).then(function (data) {

    console.log("My Courses:", data);

    const courseData = data[0];

    console.log("Current Course:", courseData);

   myStudents(courseData).then(function (studentsData) {

    localStorage.setItem(
        "myStudents",
        JSON.stringify(studentsData)
    );

    updateAttendance(studentsData);

    createAttendanceChart(studentsData);

    createCommitmentChart(studentsData);

});

});


function createAttendanceChart(studentsData) {

    const attendanceCtx = document
        .getElementById("attendanceChart")
        .getContext("2d");

    const attendanceByDate = {};

    studentsData.forEach(function (student) {

        student.attendance.forEach(function (record) {

            if (!attendanceByDate[record.date]) {
                attendanceByDate[record.date] = {
                    present: 0,
                    absent: 0
                };
            }

            if (record.status === "present") {
                attendanceByDate[record.date].present++;
            }

            if (record.status === "absent") {
                attendanceByDate[record.date].absent++;
            }

        });

    });

    const dates = Object.keys(attendanceByDate).sort();

    const presentData = dates.map(function (date) {
        return attendanceByDate[date].present;
    });

    const absentData = dates.map(function (date) {
        return attendanceByDate[date].absent;
    });

    new Chart(attendanceCtx, {

        type: "line",

        data: {

            labels: dates,

            datasets: [

                {
                    label: "Present",
                    data: presentData,
                    borderWidth: 3,
                    tension: 0.4
                },

                {
                    label: "Absent",
                    data: absentData,
                    borderWidth: 3,
                    tension: 0.4
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "top"
                }
            },

            scales: {

                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }

            }

        }

    });

}

function createCommitmentChart(studentsData) {

    const commitmentCtx = document
        .getElementById("commitmentChart")
        .getContext("2d");

    let present = 0;
    let absent = 0;

    studentsData.forEach(function (student) {

        student.attendance.forEach(function (record) {

            if (record.status === "present") {
                present++;
            }

            if (record.status === "absent") {
                absent++;
            }

        });

    });

    const total = present + absent;

    let commitmentRate = 0;

    if (total > 0) {
        commitmentRate = (present / total) * 100;
    }

    new Chart(commitmentCtx, {

        type: "doughnut",

        data: {

            labels: [
               commitmentRate.toFixed(1)+ "% Committed",
               100-commitmentRate.toFixed(1)+ "%Not Committed"
            ],

            datasets: [

                {
                    data: [
                        commitmentRate,
                        100 - commitmentRate
                    ],

                    borderWidth: 0
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "70%",

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}