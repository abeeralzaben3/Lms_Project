import getStudents, {
    getInstructors,
    getCurrentUser,
    getLoggedInUser,
    logout
} from "../auth/fetchStudents.js";

const studentName = document.getElementById("studentName");
const studentId = document.getElementById("studentId");
const averageScore = document.getElementById("averageScore");
const attendanceRate = document.getElementById("attendanceRate");
const coursesBox = document.getElementById("courses");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");


// course id -> display name (unknown ids are shown as they are)
const courseNames = {
    c1: "JS101",
    c2: "Databases"
};


// ---------- logout ----------

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        logout();
        location.href = "./auth/login.html";
    });
}

// ==================================================
// helpers
// ==================================================

function findStudentByEmail(students, email) {
    return students.find(
        student => student.email && student.email.toLowerCase() === email.toLowerCase()
    ) || null;
}

function showError(text) {
    message.textContent = text;
    message.style.display = "block";
}

function courseLabel(courseId) {
    return courseNames[courseId] || courseId;
}

// assessment id -> assessment (title, type, course, maxScore)
function getAssessments(instructors) {
    const byId = {};

    instructors.forEach(instructor => {
        (instructor.assessments || []).forEach(assessment => {
            byId[assessment.id] = assessment;
        });
    });

    return byId;
}

function isGraded(score) {
    return score !== null && score !== undefined;
}

function percent(earned, possible) {
    return possible ? ((earned / possible) * 100).toFixed(1) + "%" : "No grades yet";
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}


// ==================================================
// scores grouped by course
// ==================================================

function renderCourses(student, assessmentsById) {
    coursesBox.replaceChildren();

    const groups = {};

    (student.scores || []).forEach(item => {
        const assessment = assessmentsById[item.assessmentId];
        if (!assessment) return;

        if (!groups[assessment.course]) groups[assessment.course] = [];
        groups[assessment.course].push({ assessment, score: item.score });
    });

    const courseIds = Object.keys(groups);

    if (!courseIds.length) {
        coursesBox.append(el("p", "empty", "No scores yet"));
        return;
    }

    courseIds.forEach(courseId => {
        const items = groups[courseId];

        let earned = 0;
        let possible = 0;

        items.forEach(({ assessment, score }) => {
            if (!isGraded(score)) return;
            earned += score;
            possible += assessment.maxScore;
        });

        const card = el("div", "course");

        const head = el("div", "course-head");
        head.append(
            el("h3", "", courseLabel(courseId)),
            el("span", "course-average", percent(earned, possible))
        );
        card.append(head);

        items.forEach(({ assessment, score }) => {
            const row = el("div", "score-row");

            const info = el("div", "score-info");
            info.append(
                el("div", "score-title", assessment.title),
                el("div", "score-type", assessment.type)
            );

            const value = isGraded(score)
                ? el("div", "score-value", `${score} / ${assessment.maxScore}`)
                : el("div", "score-value not-graded", "Not graded");

            row.append(info, value);
            card.append(row);
        });

        coursesBox.append(card);
    });
}


// ==================================================
// dashboard
// ==================================================

async function loadDashboard() {

    // only a logged-in student can open this page
    const email = getCurrentUser();
    const loggedIn = getLoggedInUser();

    if (!email || !loggedIn || loggedIn.role !== "student") {
        location.href = "./auth/login.html";
        return;
    }

    const students = await getStudents();
    const instructors = await getInstructors();

    if (!students.length) {
        showError("Could not load student data (is json-server running?)");
        return;
    }

    const student = findStudentByEmail(students, email);

    if (!student) {
        showError("Student not found");
        return;
    }

    studentName.textContent = student.name;
    studentId.textContent = student.studentId ?? student.id;


    // Overall average (graded marks only, as % of each assessment's max)
    const assessmentsById = getAssessments(instructors);

    let earned = 0;
    let possible = 0;

    (student.scores || []).forEach(item => {
        const assessment = assessmentsById[item.assessmentId];

        if (!assessment || !assessment.maxScore || !isGraded(item.score)) return;

        earned += item.score;
        possible += assessment.maxScore;
    });

    averageScore.textContent = percent(earned, possible);

    renderCourses(student, assessmentsById);


    // Attendance
    const records = student.attendance || [];

    const present = records.filter(item => item.status === "present").length;
    const absent = records.filter(item => item.status === "absent").length;

    attendanceRate.textContent = records.length
        ? Math.round((present / records.length) * 100) + "%"
        : "No records";

    if (!records.length || typeof Chart === "undefined") return;

    new Chart(document.getElementById("attendanceChart"), {
        type: "doughnut",
        data: {
            labels: ["Present", "Absent"],
            datasets: [{
                data: [present, absent],
                backgroundColor: ["#10b981", "#f43f5e"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: "bottom" } }
        }
    });
}

loadDashboard();