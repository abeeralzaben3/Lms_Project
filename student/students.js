"use strict";
import { fetchApi } from "../Api/fetch.js";
import { Cookie } from "../cookies/cookies.js";
// ======================================================
// HELPER
// ======================================================

const $ = function (id) {
    return document.getElementById(id);
};


// ======================================================
// LOGIN CHECK
// ======================================================

const loggedInUser = localStorage.getItem("loggedInUser");

console.log("loggedInUser:", loggedInUser);


// إذا لم يوجد مستخدم مسجل دخول
if (!loggedInUser) {

    alert("No logged in user found");

    window.location.href = "../login/login.html";

}


// تحويل النص إلى Object
let currentUser = null;

try {

    currentUser = JSON.parse(loggedInUser);

} catch (error) {

    console.error("Invalid loggedInUser:", error);

    localStorage.removeItem("loggedInUser");

    window.location.href = "../login/login.html";

}


// ======================================================
// ELEMENTS
// ======================================================

const account = $("account");
const accountMinu = $("accountMinu");

const burgerMinu = $("burgerMinu");
const sideBar = $("sideBar");

const headerName = $("headerName");
const techName = $("techName");
const logo = $("logo");

const searchInput = $("searchInput");
const searchBtn = $("searchBtn");

const settings = $("settings");
const logout = $("logout");

const dashboard = $("dashboard");
const studentsNav = $("students");
const assessments = $("assessments");
const reports = $("reports");

const studentsContainer = $("StudentData");


// ======================================================
// SHOW USER
// ======================================================

if (currentUser) {

    const instructorName =
        currentUser.fullName ||
        currentUser.name ||
        currentUser.username ||
        currentUser.email ||
        "Instructor";


    if (headerName) {

        headerName.textContent =
            instructorName;

    }


    if (techName) {

        techName.textContent =
            instructorName;

    }


    if (logo) {

        logo.textContent =
            instructorName
                .substring(0, 2)
                .toUpperCase();

    }

}


// ======================================================
// READ LOCAL STORAGE
// ======================================================

function readList(key) {

    try {

        const data =
            localStorage.getItem(key);


        if (!data) {

            return [];

        }


        const parsed =
            JSON.parse(data);


        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            `Error reading ${key}:`,
            error
        );

        return [];

    }

}


// ======================================================
// STUDENTS
// ======================================================

async function getStudentData() {

    let students =
        readList("students");


    if (students.length > 0) {

        return students;

    }


    try {

        const response =
            await fetch(
                "http://localhost:3000/students"
            );


        if (!response.ok) {

            throw new Error(
                `HTTP Error: ${response.status}`
            );

        }


        students =
            await response.json();


        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );


        return students;

    } catch (error) {

        console.error(
            "Error fetching students:",
            error
        );

        return [];

    }

}


// ======================================================
// COURSE NAMES
// ======================================================

const courseNames = {

    c1: "JS101",

    c2: "Databases"

};


// ======================================================
// COURSE TEXT
// ======================================================

function courseText(student) {

    if (
        Array.isArray(student.courses) &&
        student.courses.length
    ) {

        return student.courses
            .map(function (id) {

                return courseNames[id] || id;

            })
            .join(", ");

    }


    return student.course || "-";

}


// ======================================================
// ATTENDANCE TEXT
// ======================================================

function attendanceText(student) {

    const attendance =
        student.attendance;


    if (Array.isArray(attendance)) {

        if (!attendance.length) {

            return "No records";

        }


        const lastAttendance =
            attendance[
                attendance.length - 1
            ];


        return lastAttendance.status ||
            "No records";

    }


    return attendance ||
        "No records";

}


// ======================================================
// ALL STUDENTS
// ======================================================

let allStudents = [];


// ======================================================
// VISIBLE STUDENTS
// ======================================================

function visibleStudents() {

    return allStudents.filter(
        function (student) {

            return student.archived !== true;

        }
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/[&<>"']/g, function (character) {

            return {

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#39;"

            }[character];

        });

}


// ======================================================
// RENDER STUDENTS
// ======================================================

function renderStudents(list) {

    if (!studentsContainer) {

        return;

    }


    if (!list.length) {

        studentsContainer.innerHTML = `

            <p class="noResults">
                No students found
            </p>

        `;

        return;

    }


    studentsContainer.innerHTML =
        list.map(function (student) {

            const status =
                attendanceText(student);


            const absent =
                String(status)
                    .toLowerCase() === "absent";


            return `

                <div
                    class="carddiv ${absent ? "absent-card" : ""}"
                >

                    <img
                        src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                        alt="Student"
                    >

                    <p>
                        ${escapeHTML(
                            student.studentId ??
                            student.id
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            student.name
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            courseText(student)
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            status
                        )}
                    </p>

                    <button
                        type="button"
                        class="btn btn-outline-danger"
                        data-action="delete"
                        data-id="${escapeHTML(student.id)}"
                    >
                        Delete
                    </button>

                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        data-action="update"
                        data-id="${escapeHTML(student.id)}"
                    >
                        Update
                    </button>

                </div>

            `;

        }).join("");

}


// ======================================================
// SEARCH
// ======================================================

function searchStudents() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    const students =
        visibleStudents();


    if (!query) {

        renderStudents(students);

        return;

    }


    const results =
        students.filter(function (student) {

            return [

                student.id,

                student.studentId,

                student.name,

                courseText(student)

            ].some(function (value) {

                return String(value ?? "")
                    .toLowerCase()
                    .includes(query);

            });

        });


    renderStudents(results);

}


// ======================================================
// DELETE
// ======================================================

function deleteStudent(id) {

    const student =
        allStudents.find(
            function (student) {

                return String(student.id) ===
                    String(id);

            }
        );


    if (!student) {

        return;

    }


    const confirmed =
        confirm(
            `Delete ${student.name || "this student"}?`
        );


    if (!confirmed) {

        return;

    }


    allStudents =
        allStudents.filter(
            function (student) {

                return String(student.id) !==
                    String(id);

            }
        );


    localStorage.setItem(
        "students",
        JSON.stringify(allStudents)
    );


    renderStudents(
        visibleStudents()
    );

}


// ======================================================
// UPDATE
// ======================================================

function updateStudent(id) {

    localStorage.setItem(
        "editingStudentId",
        id
    );


    window.location.href =
        "./update.html";

}


// ======================================================
// STUDENT BUTTONS
// ======================================================

studentsContainer.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "button[data-action]"
            );


        if (!button) {

            return;

        }


        const id =
            button.dataset.id;


        if (
            button.dataset.action ===
            "delete"
        ) {

            deleteStudent(id);

        }


        if (
            button.dataset.action ===
            "update"
        ) {

            updateStudent(id);

        }

    }
);


// ======================================================
// ACCOUNT MENU
// ======================================================

if (account) {

    account.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            accountMinu.classList.toggle(
                "activeAccount"
            );

        }
    );

}


// ======================================================
// BURGER
// ======================================================

if (burgerMinu) {

    burgerMinu.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            sideBar.classList.toggle(
                "activeSide"
            );

        }
    );

}


// ======================================================
// CLOSE MENUS
// ======================================================

document.addEventListener(
    "click",
    function () {

        if (accountMinu) {

            accountMinu.classList.remove(
                "activeAccount"
            );

        }


        if (sideBar) {

            sideBar.classList.remove(
                "activeSide"
            );

        }

    }
);


// ======================================================
// SIDEBAR
// ======================================================

if (sideBar) {

    sideBar.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );

}


// ======================================================
// NAVIGATION
// ======================================================

if (dashboard) {

    dashboard.addEventListener(
        "click",
        function () {

            window.location.href =
                "../dashboard/dashboard.html";

        }
    );

}


if (studentsNav) {

    studentsNav.addEventListener(
        "click",
        function () {

            window.location.href =
                "./students.html";

        }
    );

}


if (assessments) {

    assessments.addEventListener(
        "click",
        function () {

            window.location.href =
                "../assessments/assessments.html";

        }
    );

}


if (reports) {

    reports.addEventListener(
        "click",
        function () {

            window.location.href =
                "../reports/reports.html";

        }
    );

}


// ======================================================
// SETTINGS
// ======================================================

if (settings) {

    settings.addEventListener(
        "click",
        function () {

            window.location.href =
                "../settings/settings.html";

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (logout) {

    logout.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "loggedInUser"
            );


            document.cookie =
                "currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";


            document.cookie =
                "userEmail=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";


            document.cookie =
                "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";


            window.location.href =
                "../login/login.html";

        }
    );

}


// ======================================================
// INIT
// ======================================================

async function init() {

    if (!currentUser) {

        return;

    }


    allStudents =
        await getStudentData();


    renderStudents(
        visibleStudents()
    );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            searchStudents
        );


        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    searchStudents();

                }

            }
        );

    }


    if (searchBtn) {

        searchBtn.addEventListener(
            "click",
            searchStudents
        );

    }

}


init();