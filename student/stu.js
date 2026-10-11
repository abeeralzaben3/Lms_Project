"use strict";

// ================= GET STUDENT DATA =================

async function getStudentData() {

return getStudentDataFromLocalStorage();

}

function getStudentDataFromLocalStorage() {

const data = localStorage.getItem("myStudents");

return data ? JSON.parse(data) : [];

}

// ================= TODAY'S DATE =================

function getToday() {

const d = new Date();

const m = String(d.getMonth() + 1).padStart(2, "0");

const day = String(d.getDate()).padStart(2, "0");

return `${d.getFullYear()}-${m}-${day}`;

}

// ================= MARK TODAY'S ATTENDANCE =================

function markAttendance(studentId, status) {

const today = getToday();

const students = getStudentDataFromLocalStorage();

const student = students.find(
s => String(s.id) === String(studentId)
);

if (!student) return;

// Make sure attendance is an array

if (!Array.isArray(student.attendance)) {

student.attendance = [];

}

// Find today's attendance record

const record = student.attendance.find(
a => a.date === today
);

// Update today's record

if (record) {

record.status = status;

}

// Create today's record

else {

student.attendance.push({

  date: today,

  status: status

});

}

// Save updated students

localStorage.setItem(
"myStudents",
JSON.stringify(students)
);

// Update current list

allStudents = students;

// Render again while keeping search

searchStudents();

}

// ================= DELETE STUDENT =================

function deletestudentFromLocalStorage(studentId) {

console.log(
"Deleting student with ID:",
studentId
);

const students =
getStudentDataFromLocalStorage();

const updatedStudents =
students.filter(
student =>
String(student.id) !== String(studentId)
);

localStorage.setItem(
"myStudents",
JSON.stringify(updatedStudents)
);

// Update current data without full page reload

allStudents = updatedStudents;

searchStudents();

}

// ================= UPDATE STUDENT =================

function updateStudent(id) {

console.log(
"Updating student:",
id
);

localStorage.setItem(
"editingStudentId",
id
);

window.location.href =
"update.html";

}

// ================= FORM ELEMENTS =================

const studentName =
document.getElementById("studentName");

const studentId =
document.getElementById("studentId");

const course =
document.getElementById("course");

const studentStatus =
document.getElementById("attendanceStatus");

const attendanceStatus =
document.getElementById("archived");

// ================= ALL STUDENTS =================

let allStudents = [];

// ================= RENDER STUDENTS =================

function renderStudents(list) {

const container =
document.getElementById("StudentData");

if (!container) {

console.error(
  "StudentData element was not found."
);

return;

}

// No students

if (list.length === 0) {

container.innerHTML =
  `<p class="noResults">No students found</p>`;

return;

}

const today = getToday();

container.innerHTML = list.map(student => {

// ================= STUDENT NAME =================

const name =
  String(student.name ?? "").trim() ||
  "Student";


// ================= AVATAR =================

const avatarUrl =
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}` +
  `&background=4338ca&color=fff&bold=true&size=128`;


// ================= ATTENDANCE =================

const attendance =
  Array.isArray(student.attendance)
    ? student.attendance
    : [];


// ================= TODAY STATUS =================

const todayRecord =
  attendance.find(
    a => a.date === today
  );


const todayStatus =
  todayRecord
    ? String(todayRecord.status).toLowerCase()
    : null;


// ================= ATTENDANCE RATE =================

const total =
  attendance.length;


const present =
  attendance.filter(
    a =>
      String(a.status).toLowerCase() ===
      "present"
  ).length;


const rate =
  total
    ? Math.round((present / total) * 100)
    : null;


// ================= RATE CLASS =================

const rateClass =
  rate === null
    ? "none"
    : rate >= 90
      ? "good"
      : rate >= 50
        ? "warn"
        : "bad";


// ================= CARD CLASS =================

const cardClass =
  todayStatus === "absent"
    ? "absent-card"
    : todayStatus === "present"
      ? "present-card"
      : "";


// ================= STUDENT CARD =================

return `

  <div class="carddiv ${cardClass}">

    <!-- Student Image -->

    <img
      class="student-avatar"
      src="${avatarUrl}"
      alt="${name.replace(/"/g, "&quot;")}"
      onerror="
        this.onerror=null;
        this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      "
    >


    <!-- Student ID -->

    <p>${student.id ?? ""}</p>


    <!-- Student Name -->

    <p>${student.name ?? ""}</p>


    <!-- Attendance Records -->

    <div class="attendanceRecords">

      ${
        rate !== null

          ? `

            <div class="rate-row">

              <strong
                class="rate-value ${rateClass}"
              >
                ${rate}%
              </strong>

              <span class="rate-count">
                ${present}/${total} days
              </span>

            </div>


            <div class="rate-bar">

              <div
                class="rate-fill ${rateClass}"
                style="width:${rate}%"
              ></div>

            </div>

          `

          : `

            <p class="attendance-empty">
              No attendance records
            </p>

          `
      }

    </div>


    <!-- Today's Attendance -->

    <div class="today-attendance">

      <span class="today-label">
        Today
      </span>


      <button
        class="att-btn present
          ${todayStatus === "present" ? "active" : ""}"
        onclick="
          markAttendance(
            '${student.id}',
            'present'
          )
        "
      >
        Present
      </button>


      <button
        class="att-btn absent
          ${todayStatus === "absent" ? "active" : ""}"
        onclick="
          markAttendance(
            '${student.id}',
            'absent'
          )
        "
      >
        Absent
      </button>

    </div>


    <!-- Delete -->

    <button
      class="btn btn-outline-danger"
      onclick="
        deletestudentFromLocalStorage(
          '${student.id}'
        )
      "
    >
      Delete
    </button>


    <!-- Update -->

    <a
      href="#"
      class="btn btn-outline-primary"
      onclick="
        updateStudent('${student.id}');
        return false;
      "
    >
      Update
    </a>

  </div>

`;

}).join("");

}

// ================= SEARCH STUDENTS =================

function searchStudents() {

const input =
document.getElementById("searchInput");

// If there is no search input

if (!input) {

renderStudents(allStudents);

return;

}

const query =
input.value.trim().toLowerCase();

// Empty search

if (!query) {

renderStudents(allStudents);

return;

}

// Filter students

const results =
allStudents.filter(student =>

  String(student.id ?? "")
    .toLowerCase()
    .includes(query)

  ||

  String(student.name ?? "")
    .toLowerCase()
    .includes(query)

  ||

  String(student.course ?? "")
    .toLowerCase()
    .includes(query)

);

renderStudents(results);

}

// ================= PAGE LOAD =================

window.addEventListener(
"load",
async function () {

// Get students

allStudents =
  await getStudentData();


// Make sure data is an array

if (!Array.isArray(allStudents)) {

  console.error(
    "students in localStorage is not an array:",
    allStudents
  );

  allStudents = [];

}


// ================= URL SEARCH =================

const params =
  new URLSearchParams(
    window.location.search
  );


const urlSearch =
  params.get("search");


const input =
  document.getElementById("searchInput");


// If search came from layout.js

if (urlSearch && input) {

  input.value = urlSearch;

}


// ================= INITIAL RENDER =================

searchStudents();


// ================= SEARCH INPUT =================

if (input) {


  input.addEventListener(
    "input",
    searchStudents
  );


  input.addEventListener(
    "keydown",
    function (e) {

      if (e.key === "Enter") {

        e.preventDefault();

        searchStudents();

      }

    }
  );

}

}
);


