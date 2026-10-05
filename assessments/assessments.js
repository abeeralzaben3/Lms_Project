import { fetchApi } from "../Api/fetch.js";
import { Cookie } from "../cookies/cookies.js";


// ======================================================
// ELEMENTS
// ======================================================

const accountMinu = document.getElementById("accountMinu");
const account = document.getElementById("account");

const burgerMinu = document.getElementById("burgerMinu");
const sideBar = document.getElementById("sideBar");

const headerName = document.getElementById("headerName");
const techName = document.getElementById("techName");
const logo = document.getElementById("logo");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const settings = document.getElementById("settings");
const logout = document.getElementById("logout");

const dashboard = document.getElementById("dashboard");
const studentsli = document.getElementById("students");
const assessmentsli = document.getElementById("assessments");
const reports = document.getElementById("reports");


// ======================================================
// COURSES / ASSESSMENTS / STUDENTS ELEMENTS
// ======================================================

const coursesList = document.getElementById("coursesList");
const assessmentsList = document.getElementById("assessmentsList");
const studentsList = document.getElementById("studentsList");

const addCourse = document.getElementById("addCourse");
const addAssessment = document.getElementById("addAssessment");

const saveMarks = document.getElementById("saveMarks");

const messagePopup = document.getElementById("messagePopup");


// ======================================================
// COURSE MODAL
// ======================================================

const courseModal = document.getElementById("courseModal");
const closeCourseModal = document.getElementById("closeCourseModal");
const courseForm = document.getElementById("courseForm");
const courseName = document.getElementById("courseName");


// ======================================================
// ASSESSMENT MODAL
// ======================================================

const assessmentModal = document.getElementById("assessmentModal");
const closeModal = document.getElementById("closeModal");
const assessmentForm = document.getElementById("assessmentForm");

const assessmentName = document.getElementById("assessmentName");
const type = document.getElementById("type");
const maxScore = document.getElementById("maxScore");


// ======================================================
// EDIT COURSE MODAL
// ======================================================

const editCourseModal = document.getElementById("editCourseModal");
const closeEditCourseModal =
    document.getElementById("closeEditCourseModal");

const editCourseForm = document.getElementById("editCourseForm");
const editCourseName = document.getElementById("editCourseName");


// ======================================================
// EDIT ASSESSMENT MODAL
// ======================================================

const editAssessmentModal =
    document.getElementById("editAssessmentModal");

const closeEditAssessmentModal =
    document.getElementById("closeEditAssessmentModal");

const editAssessmentForm =
    document.getElementById("editAssessmentForm");

const editAssessmentName =
    document.getElementById("editAssessmentName");

const editAssessmentType =
    document.getElementById("editAssessmentType");

const editAssessmentMaxScore =
    document.getElementById("editAssessmentMaxScore");


// ======================================================
// COOKIE
// ======================================================

const userCookie = new Cookie();

const currentUser = userCookie.getCookie("currentUser");
const userEmail = userCookie.getCookie("userEmail");
const userId = userCookie.getCookie("userId");


// ======================================================
// SHOW CURRENT USER
// ======================================================

headerName.textContent = currentUser;
techName.textContent = currentUser;
logo.textContent = currentUser.slice(0, 2).toUpperCase();


// ======================================================
// DATA
// ======================================================

let instructors =
    JSON.parse(localStorage.getItem("instructors")) || [];

let students =
    JSON.parse(localStorage.getItem("students")) || [];

let courses =
    JSON.parse(localStorage.getItem("courses")) || [];

let assessments =
    JSON.parse(localStorage.getItem("assessments")) || [];


// ======================================================
// CURRENT DATA
// ======================================================

let selectedCourse = null;
let selectedAssessment = null;

let editingCourseId = null;
let editingAssessmentId = null;


// ======================================================
// ACCOUNT MENU
// ======================================================

account.addEventListener("click", function () {

    accountMinu.classList.toggle("activeAccount");

});


// ======================================================
// MOBILE MENU
// ======================================================

burgerMinu.addEventListener("click", function () {

    sideBar.classList.toggle("activeSide");

});


// ======================================================
// NAVIGATION
// ======================================================

dashboard.addEventListener("click", function () {

    window.location.href = "../dashboard/dashboard.html";

});


studentsli.addEventListener("click", function () {

    window.location.href = "../student/students.html";

});


assessmentsli.addEventListener("click", function () {

    window.location.href = "./assessments.html";

});


reports.addEventListener("click", function () {

    window.location.href = "../reports/reports.html";

});


settings.addEventListener("click", function () {

    window.location.href = "../settings/settings.html";

});


logout.addEventListener("click", function () {

    window.location.href = "../login/login.html";

});


// ======================================================
// LOAD COURSES
// ======================================================

async function loadCourses() {

    if (!courses.length) {

        courses = await fetchApi("courses");

    }

    return courses;

}


// ======================================================
// LOAD STUDENTS
// ======================================================

async function loadStudents() {

    if (!students.length) {

        students = await fetchApi("students");

    }

    return students;

}


// ======================================================
// LOAD ASSESSMENTS
// ======================================================

async function loadAssessments() {

    if (!assessments.length) {

        assessments =
            JSON.parse(localStorage.getItem("assessments")) || [];

    }

    return assessments;

}


// ======================================================
// GET MY COURSES
// ======================================================

async function myCourses() {

    await loadCourses();

    const myCourses = courses.filter(function (course) {

        return course.instructorId === userId;

    });

    return myCourses;

}


// ======================================================
// GET STUDENTS FOR COURSE
// ======================================================

async function myStudents(courseData) {

    await loadStudents();

    const myStudents = students.filter(function (student) {

        return student.courses.includes(courseData.id);

    });

    return myStudents;

}


// ======================================================
// SHOW MESSAGE
// ======================================================

function showMessage(message) {

    messagePopup.textContent = message;

    messagePopup.classList.add("show");

    setTimeout(function () {

        messagePopup.classList.remove("show");

    }, 2500);

}


// ======================================================
// SHOW COURSES
// ======================================================

async function showCourses() {

    const myCoursesData = await myCourses();

    coursesList.innerHTML = "";

    if (!myCoursesData.length) {

        coursesList.innerHTML = `
            <p class="empty">
                No courses found.
            </p>
        `;

        return;
    }


    myCoursesData.forEach(function (course) {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div>
                <h3>${course.name}</h3>
                <p>Course ID: ${course.id}</p>
            </div>

            <div class="cardButtons">

                <button 
                    class="selectCourse"
                    data-id="${course.id}">
                    Select
                </button>

                <button 
                    class="editCourse"
                    data-id="${course.id}">
                    Edit
                </button>

                <button 
                    class="deleteCourse"
                    data-id="${course.id}">
                    Delete
                </button>

            </div>
        `;

        coursesList.appendChild(card);

    });


    // SELECT COURSE

    const selectButtons =
        document.querySelectorAll(".selectCourse");

    selectButtons.forEach(function (button) {

        button.addEventListener("click", async function () {

            const courseId = button.dataset.id;

            selectedCourse =
                myCoursesData.find(function (course) {

                    return course.id === courseId;

                });


            showMessage(
                `Selected course: ${selectedCourse.name}`
            );


            await showAssessments();

            await showStudents();

        });

    });


    // EDIT COURSE

    const editButtons =
        document.querySelectorAll(".editCourse");

    editButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const courseId = button.dataset.id;

            const course =
                myCoursesData.find(function (course) {

                    return course.id === courseId;

                });

            editingCourseId = course.id;

            editCourseName.value = course.name;

            editCourseModal.style.display = "flex";

        });

    });


    // DELETE COURSE

    const deleteButtons =
        document.querySelectorAll(".deleteCourse");

    deleteButtons.forEach(function (button) {

        button.addEventListener("click", async function () {

            const courseId = button.dataset.id;

            const confirmDelete =
                confirm("Are you sure you want to delete this course?");

            if (!confirmDelete) {

                return;

            }


            courses = courses.filter(function (course) {

                return course.id !== courseId;

            });


            localStorage.setItem(
                "courses",
                JSON.stringify(courses)
            );


            showMessage("Course deleted successfully.");

            await showCourses();

        });

    });

}


// ======================================================
// SHOW ASSESSMENTS
// ======================================================

async function showAssessments() {

    await loadAssessments();

    assessmentsList.innerHTML = "";

    if (!selectedCourse) {

        assessmentsList.innerHTML = `
            <p class="empty">
                Select a course first.
            </p>
        `;

        return;

    }


    const courseAssessments =
        assessments.filter(function (assessment) {

            return assessment.courseId === selectedCourse.id;

        });


    if (!courseAssessments.length) {

        assessmentsList.innerHTML = `
            <p class="empty">
                No assessments found for this course.
            </p>
        `;

        return;

    }


    courseAssessments.forEach(function (assessment) {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div>

                <h3>${assessment.name}</h3>

                <p>
                    Type: ${assessment.type}
                </p>

                <p>
                    Maximum Score: ${assessment.maxScore}
                </p>

            </div>

            <div class="cardButtons">

                <button
                    class="selectAssessment"
                    data-id="${assessment.id}">
                    Select
                </button>

                <button
                    class="editAssessment"
                    data-id="${assessment.id}">
                    Edit
                </button>

                <button
                    class="deleteAssessment"
                    data-id="${assessment.id}">
                    Delete
                </button>

            </div>
        `;

        assessmentsList.appendChild(card);

    });


    // SELECT ASSESSMENT

    const selectButtons =
        document.querySelectorAll(".selectAssessment");

    selectButtons.forEach(function (button) {

        button.addEventListener("click", async function () {

            const assessmentId = button.dataset.id;

            selectedAssessment =
                courseAssessments.find(function (assessment) {

                    return assessment.id === assessmentId;

                });


            showMessage(
                `Selected assessment: ${selectedAssessment.name}`
            );

            await showStudents();

        });

    });


    // EDIT ASSESSMENT

    const editButtons =
        document.querySelectorAll(".editAssessment");

    editButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const assessmentId = button.dataset.id;

            const assessment =
                courseAssessments.find(function (assessment) {

                    return assessment.id === assessmentId;

                });


            editingAssessmentId = assessment.id;

            editAssessmentName.value =
                assessment.name;

            editAssessmentType.value =
                assessment.type;

            editAssessmentMaxScore.value =
                assessment.maxScore;


            editAssessmentModal.style.display = "flex";

        });

    });


    // DELETE ASSESSMENT

    const deleteButtons =
        document.querySelectorAll(".deleteAssessment");

    deleteButtons.forEach(function (button) {

        button.addEventListener("click", async function () {

            const assessmentId = button.dataset.id;

            const confirmDelete =
                confirm(
                    "Are you sure you want to delete this assessment?"
                );

            if (!confirmDelete) {

                return;

            }


            assessments =
                assessments.filter(function (assessment) {

                    return assessment.id !== assessmentId;

                });


            localStorage.setItem(
                "assessments",
                JSON.stringify(assessments)
            );


            showMessage(
                "Assessment deleted successfully."
            );


            await showAssessments();

        });

    });

}


// ======================================================
// SHOW STUDENTS
// ======================================================

async function showStudents() {

    studentsList.innerHTML = "";

    if (!selectedCourse) {

        studentsList.innerHTML = `
            <p class="empty">
                Select a course first.
            </p>
        `;

        return;

    }


    if (!selectedAssessment) {

        studentsList.innerHTML = `
            <p class="empty">
                Select an assessment first.
            </p>
        `;

        return;

    }


    const courseStudents =
        await myStudents(selectedCourse);


    if (!courseStudents.length) {

        studentsList.innerHTML = `
            <p class="empty">
                No students found for this course.
            </p>
        `;

        return;

    }


    courseStudents.forEach(function (student) {

        const scoreObject =
            student.scores?.find(function (score) {

                return score.assessmentId ===
                    selectedAssessment.id;

            });


        const currentScore =
            scoreObject ? scoreObject.score : "";


        const studentElement =
            document.createElement("div");

        studentElement.className = "student";


        studentElement.innerHTML = `

            <div class="studentInfo">

                <h3>${student.name}</h3>

                <p>
                    Student ID: ${student.studentId}
                </p>

            </div>


            <div class="studentMark">

                <input
                    type="number"
                    class="studentScore"
                    data-student-id="${student.id}"
                    value="${currentScore}"
                    min="0"
                    max="${selectedAssessment.maxScore}"
                    placeholder="Score"
                >

                <span>
                    / ${selectedAssessment.maxScore}
                </span>

            </div>

        `;


        studentsList.appendChild(studentElement);

    });

}


// ======================================================
// ADD COURSE BUTTON
// ======================================================

addCourse.addEventListener("click", function () {

    courseModal.style.display = "flex";

});


// ======================================================
// CLOSE COURSE MODAL
// ======================================================

closeCourseModal.addEventListener("click", function () {

    courseModal.style.display = "none";

    courseForm.reset();

});


// ======================================================
// ADD COURSE
// ======================================================

courseForm.addEventListener("submit", async function (e) {

    e.preventDefault();


    const name =
        courseName.value.trim();


    if (!name) {

        showMessage("Please enter course name.");

        return;

    }


    await loadCourses();


    const newCourse = {

        id:
            "COURSE" +
            String(courses.length + 1).padStart(3, "0"),

        name: name,

        instructorId: userId

    };


    courses.push(newCourse);


    localStorage.setItem(
        "courses",
        JSON.stringify(courses)
    );


    courseForm.reset();

    courseModal.style.display = "none";


    showMessage(
        "Course added successfully."
    );


    await showCourses();

});


// ======================================================
// UPDATE COURSE
// ======================================================

editCourseForm.addEventListener("submit", async function (e) {

    e.preventDefault();


    const newName =
        editCourseName.value.trim();


    if (!newName) {

        showMessage(
            "Please enter course name."
        );

        return;

    }


    const course =
        courses.find(function (course) {

            return course.id === editingCourseId;

        });


    if (course) {

        course.name = newName;

    }


    localStorage.setItem(
        "courses",
        JSON.stringify(courses)
    );


    editCourseModal.style.display = "none";

    editCourseForm.reset();


    showMessage(
        "Course updated successfully."
    );


    await showCourses();

});


// ======================================================
// CLOSE EDIT COURSE
// ======================================================

closeEditCourseModal.addEventListener(
    "click",
    function () {

        editCourseModal.style.display = "none";

    }
);


// ======================================================
// ADD ASSESSMENT BUTTON
// ======================================================

addAssessment.addEventListener("click", function () {

    if (!selectedCourse) {

        showMessage(
            "Please select a course first."
        );

        return;

    }


    assessmentModal.style.display = "flex";

});


// ======================================================
// CLOSE ASSESSMENT MODAL
// ======================================================

closeModal.addEventListener("click", function () {

    assessmentModal.style.display = "none";

    assessmentForm.reset();

});


// ======================================================
// ADD ASSESSMENT
// ======================================================

assessmentForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        if (!selectedCourse) {

            showMessage(
                "Please select a course first."
            );

            return;

        }


        const name =
            assessmentName.value.trim();

        const assessmentType =
            type.value;

        const score =
            Number(maxScore.value);


        if (!name) {

            showMessage(
                "Please enter assessment name."
            );

            return;

        }


        if (score <= 0) {

            showMessage(
                "Maximum score must be greater than 0."
            );

            return;

        }


        await loadAssessments();


        const newAssessment = {

            id:
                "a" +
                String(assessments.length + 1),

            courseId:
                selectedCourse.id,

            name: name,

            type:
                assessmentType,

            maxScore:
                score

        };


        assessments.push(newAssessment);


        localStorage.setItem(
            "assessments",
            JSON.stringify(assessments)
        );


        assessmentForm.reset();

        assessmentModal.style.display =
            "none";


        showMessage(
            "Assessment added successfully."
        );


        await showAssessments();

    }
);


// ======================================================
// UPDATE ASSESSMENT
// ======================================================

editAssessmentForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        const newName =
            editAssessmentName.value.trim();

        const newType =
            editAssessmentType.value;

        const newMaxScore =
            Number(editAssessmentMaxScore.value);


        if (!newName) {

            showMessage(
                "Please enter assessment name."
            );

            return;

        }


        if (newMaxScore <= 0) {

            showMessage(
                "Maximum score must be greater than 0."
            );

            return;

        }


        const assessment =
            assessments.find(function (assessment) {

                return assessment.id ===
                    editingAssessmentId;

            });


        if (assessment) {

            assessment.name =
                newName;

            assessment.type =
                newType;

            assessment.maxScore =
                newMaxScore;

        }


        localStorage.setItem(
            "assessments",
            JSON.stringify(assessments)
        );


        editAssessmentModal.style.display =
            "none";


        editAssessmentForm.reset();


        showMessage(
            "Assessment updated successfully."
        );


        await showAssessments();

    }
);


// ======================================================
// CLOSE EDIT ASSESSMENT
// ======================================================

closeEditAssessmentModal.addEventListener(
    "click",
    function () {

        editAssessmentModal.style.display =
            "none";

    }
);


// ======================================================
// SAVE MARKS
// ======================================================

saveMarks.addEventListener(
    "click",
    async function () {

        if (!selectedCourse) {

            showMessage(
                "Please select a course first."
            );

            return;

        }


        if (!selectedAssessment) {

            showMessage(
                "Please select an assessment first."
            );

            return;

        }


        const inputs =
            document.querySelectorAll(
                ".studentScore"
            );


        inputs.forEach(function (input) {

            const studentId =
                input.dataset.studentId;

            const score =
                Number(input.value);


            const student =
                students.find(function (student) {

                    return String(student.id) ===
                        String(studentId);

                });


            if (!student) {

                return;

            }


            if (!student.scores) {

                student.scores = [];

            }


            const existingScore =
                student.scores.find(function (scoreObject) {

                    return scoreObject.assessmentId ===
                        selectedAssessment.id;

                });


            if (existingScore) {

                existingScore.score =
                    score;

            } else {

                student.scores.push({

                    assessmentId:
                        selectedAssessment.id,

                    score:
                        score

                });

            }

        });


        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );


        showMessage(
            "Marks saved successfully."
        );

    }
);


// ======================================================
// SEARCH STUDENTS
// ======================================================

searchBtn.addEventListener(
    "click",
    async function () {

        const searchValue =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!searchValue) {

            await showStudents();

            return;

        }


        const allStudents =
            await loadStudents();


        const filteredStudents =
            allStudents.filter(function (student) {

                return (
                    student.name
                        .toLowerCase()
                        .includes(searchValue)
                    ||
                    student.studentId
                        .toLowerCase()
                        .includes(searchValue)
                );

            });


        studentsList.innerHTML = "";


        if (!filteredStudents.length) {

            studentsList.innerHTML = `
                <p class="empty">
                    No students found.
                </p>
            `;

            return;

        }


        filteredStudents.forEach(function (student) {

            const studentElement =
                document.createElement("div");

            studentElement.className =
                "student";


            studentElement.innerHTML = `

                <div class="studentInfo">

                    <h3>${student.name}</h3>

                    <p>
                        Student ID:
                        ${student.studentId}
                    </p>

                </div>

            `;


            studentsList.appendChild(
                studentElement
            );

        });

    }
);


// ======================================================
// SEARCH WHEN PRESS ENTER
// ======================================================

searchInput.addEventListener(
    "keydown",
    function (e) {

        if (e.key === "Enter") {

            searchBtn.click();

        }

    }
);


// ======================================================
// INITIAL LOAD
// ======================================================

async function init() {

    await loadCourses();

    await loadStudents();

    await loadAssessments();

    await showCourses();

    await showAssessments();

}


init();