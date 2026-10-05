"use strict";


// ==================================================
// HELPERS
// ==================================================

const $ = (id) => document.getElementById(id);

const same = (a, b) => {
    return String(a) === String(b);
};


function load(key) {

    try {

        return JSON.parse(
            localStorage.getItem(key)
        ) || [];

    } catch (error) {

        console.error(
            `Error loading ${key}:`,
            error
        );

        return [];
    }
}


// ==================================================
// LOGIN
// ==================================================

const loggedInUser = JSON.parse(
    localStorage.getItem("loggedInUser") || "null"
);


if (!loggedInUser) {

    window.location.href =
        "../auth/login.html";
}


// ==================================================
// LOAD DATA
// ==================================================

let instructors = load("instructors");

let courses = load("courses");

let students = load("students");

let assessments = load("lms_assessments");

let scores = load("lms_scores");


// ==================================================
// CURRENT INSTRUCTOR
// ==================================================

let currentInstructor = null;


if (loggedInUser) {

    currentInstructor =
        instructors.find(
            instructor =>
                same(
                    instructor.id,
                    loggedInUser.id
                )
        );


    if (!currentInstructor) {

        currentInstructor =
            instructors.find(
                instructor =>
                    instructor.email &&
                    loggedInUser.email &&
                    instructor.email.toLowerCase() ===
                    loggedInUser.email.toLowerCase()
            );
    }
}


// ==================================================
// ELEMENTS
// ==================================================

const courseSelect =
    $("courseSelect");

const reportMessage =
    $("reportMessage");

const reportContent =
    $("reportContent");

const sumStudents =
    $("sumStudents");

const sumAverage =
    $("sumAverage");

const sumHighest =
    $("sumHighest");

const sumLowest =
    $("sumLowest");

const sumPass =
    $("sumPass");

const reportRows =
    $("reportRows");


// ==================================================
// CHART VARIABLES
// ==================================================

let distributionChart = null;

let assessmentChart = null;


// ==================================================
// DEBUG
// ==================================================

console.log(
    "========== REPORTS =========="
);

console.log(
    "Logged user:",
    loggedInUser
);

console.log(
    "Current instructor:",
    currentInstructor
);

console.log(
    "Courses:",
    courses
);

console.log(
    "Students:",
    students
);

console.log(
    "Assessments:",
    assessments
);

console.log(
    "Scores:",
    scores
);

console.log(
    "============================="
);


// ==================================================
// CHECK INSTRUCTOR
// ==================================================

if (!currentInstructor) {

    reportMessage.textContent =
        "Instructor not found.";

} else {

    loadCourses();

}


// ==================================================
// LOAD COURSES
// ==================================================

function loadCourses() {

    courseSelect.innerHTML = `
        <option value="">
            Select a course
        </option>
    `;


    const myCourses =
        courses.filter(course =>
            same(
                course.instructorId,
                currentInstructor.id
            )
        );


    console.log(
        "My courses:",
        myCourses
    );


    if (!myCourses.length) {

        reportMessage.textContent =
            "No courses found for this instructor.";

        return;
    }


    myCourses.forEach(course => {

        const option =
            document.createElement("option");


        option.value =
            course.id;


        option.textContent =
            course.name;


        courseSelect.appendChild(
            option
        );

    });


    reportMessage.textContent = "";
}


// ==================================================
// COURSE SELECT
// ==================================================

courseSelect.addEventListener(
    "change",
    function () {

        const courseId =
            this.value;


        if (!courseId) {

            reportContent.style.display =
                "none";

            return;
        }


        generateReport(courseId);

    }
);


// ==================================================
// GENERATE REPORT
// ==================================================

function generateReport(courseId) {

    console.log(
        "Selected course:",
        courseId
    );


    // ------------------------------------------
    // COURSE
    // ------------------------------------------

    const course =
        courses.find(course =>
            same(
                course.id,
                courseId
            )
        );


    if (!course) {

        reportMessage.textContent =
            "Course not found.";

        reportContent.style.display =
            "none";

        return;
    }


    // ------------------------------------------
    // STUDENTS
    // ------------------------------------------

    const courseStudents =
        students.filter(student => {

            if (
                !Array.isArray(
                    student.courses
                )
            ) {

                return false;
            }


            return student.courses.some(
                studentCourseId =>
                    same(
                        studentCourseId,
                        courseId
                    )
            );

        });


    console.log(
        "Students in course:",
        courseStudents
    );


    // ------------------------------------------
    // ASSESSMENTS
    // ------------------------------------------

    const courseAssessments =
        assessments.filter(assessment => {

            return same(
                assessment.courseId,
                courseId
            );

        });


    console.log(
        "Assessments in course:",
        courseAssessments
    );


    // ------------------------------------------
    // NO STUDENTS
    // ------------------------------------------

    if (!courseStudents.length) {

        reportMessage.textContent =
            "No students found in this course.";

        reportContent.style.display =
            "none";

        return;
    }


    // ------------------------------------------
    // NO ASSESSMENTS
    // ------------------------------------------

    if (!courseAssessments.length) {

        reportMessage.textContent =
            "No assessments found for this course.";

        reportContent.style.display =
            "none";

        return;
    }


    reportMessage.textContent = "";

    reportContent.style.display =
        "block";


    // ------------------------------------------
    // CREATE REPORT DATA
    // ------------------------------------------

    const reportData =
        courseStudents.map(student => {

            let totalScore = 0;

            let totalPossible = 0;

            let graded = 0;


            courseAssessments.forEach(
                assessment => {

                    const score =
                        getStudentScore(
                            student,
                            assessment.id
                        );


                    if (score !== null) {

                        const maxScore =
                            Number(
                                assessment.maxScore
                            ) || 100;


                        totalScore +=
                            Number(score);


                        totalPossible +=
                            maxScore;


                        graded++;

                    }

                }
            );


            let percentage = 0;


            if (totalPossible > 0) {

                percentage =
                    (
                        totalScore /
                        totalPossible
                    ) * 100;

            }


            return {

                student,

                graded,

                totalScore,

                totalPossible,

                percentage,

                grade:
                    getGrade(
                        percentage
                    )

            };

        });


    console.log(
        "Final report:",
        reportData
    );


    // ------------------------------------------
    // UPDATE PAGE
    // ------------------------------------------

    updateSummary(
        reportData
    );


    updateTable(
        reportData
    );


    createDistributionChart(
        reportData
    );


    createAssessmentChart(
        courseStudents,
        courseAssessments
    );

}


// ==================================================
// GET STUDENT SCORE
// ==================================================

function getStudentScore(
    student,
    assessmentId
) {

    // ------------------------------------------
    // lms_scores
    // ------------------------------------------

    const savedScore =
        scores.find(score => {

            return (
                same(
                    score.studentId,
                    student.id
                ) &&
                same(
                    score.assessmentId,
                    assessmentId
                )
            );

        });


    if (
        savedScore &&
        savedScore.score !== null &&
        savedScore.score !== undefined &&
        savedScore.score !== ""
    ) {

        return Number(
            savedScore.score
        );
    }


    // ------------------------------------------
    // student.scores
    // ------------------------------------------

    if (
        Array.isArray(
            student.scores
        )
    ) {

        const studentScore =
            student.scores.find(score => {

                return same(
                    score.assessmentId,
                    assessmentId
                );

            });


        if (
            studentScore &&
            studentScore.score !== null &&
            studentScore.score !== undefined &&
            studentScore.score !== ""
        ) {

            return Number(
                studentScore.score
            );
        }

    }


    return null;
}


// ==================================================
// GRADE
// ==================================================

function getGrade(percentage) {

    if (percentage >= 90) {
        return "A";
    }


    if (percentage >= 80) {
        return "B";
    }


    if (percentage >= 70) {
        return "C";
    }


    if (percentage >= 60) {
        return "D";
    }


    return "F";
}


// ==================================================
// SUMMARY
// ==================================================

function updateSummary(
    reportData
) {

    const gradedStudents =
        reportData.filter(
            item =>
                item.graded > 0
        );


    sumStudents.textContent =
        reportData.length;


    if (!gradedStudents.length) {

        sumAverage.textContent =
            "0%";

        sumHighest.textContent =
            "0%";

        sumLowest.textContent =
            "0%";

        sumPass.textContent =
            "0%";

        return;
    }


    const percentages =
        gradedStudents.map(
            item =>
                item.percentage
        );


    const total =
        percentages.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    const average =
        total /
        percentages.length;


    const highest =
        Math.max(
            ...percentages
        );


    const lowest =
        Math.min(
            ...percentages
        );


    const passed =
        gradedStudents.filter(
            item =>
                item.percentage >= 60
        ).length;


    const passRate =
        (
            passed /
            gradedStudents.length
        ) * 100;


    sumAverage.textContent =
        `${average.toFixed(1)}%`;


    sumHighest.textContent =
        `${highest.toFixed(1)}%`;


    sumLowest.textContent =
        `${lowest.toFixed(1)}%`;


    sumPass.textContent =
        `${passRate.toFixed(1)}%`;
}


// ==================================================
// TABLE
// ==================================================

function updateTable(
    reportData
) {

    reportRows.innerHTML = "";


    reportData.forEach(item => {

        const row =
            document.createElement("tr");


        const studentName =
            item.student.name ||
            "-";


        const studentId =
            item.student.studentId ||
            item.student.id ||
            "-";


        row.innerHTML = `

            <td>
                ${studentName}
            </td>

            <td>
                ${studentId}
            </td>

            <td>
                ${item.graded}
            </td>

            <td>
                ${item.totalScore.toFixed(1)}
            </td>

            <td>
                ${item.percentage.toFixed(1)}%
            </td>

            <td>
                ${item.grade}
            </td>

        `;


        reportRows.appendChild(
            row
        );

    });
}


// ==================================================
// DISTRIBUTION CHART
// ==================================================

function createDistributionChart(
    reportData
) {

    const canvas =
        $("distributionChart");


    if (distributionChart) {

        distributionChart.destroy();

    }


    const grades = {

        A: 0,
        B: 0,
        C: 0,
        D: 0,
        F: 0

    };


    reportData.forEach(item => {

        if (item.graded > 0) {

            grades[
                item.grade
            ]++;

        }

    });


    distributionChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: [
                        "A",
                        "B",
                        "C",
                        "D",
                        "F"
                    ],

                    datasets: [{

                        label:
                            "Number of Students",

                        data: [

                            grades.A,
                            grades.B,
                            grades.C,
                            grades.D,
                            grades.F

                        ]

                    }]

                },

                options: {

                    responsive: true,

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
// ASSESSMENT CHART
// ==================================================

function createAssessmentChart(
    courseStudents,
    courseAssessments
) {

    const canvas =
        $("assessmentChart");


    if (assessmentChart) {

        assessmentChart.destroy();

    }


    const labels = [];

    const averages = [];


    courseAssessments.forEach(
        assessment => {

            let total = 0;

            let count = 0;


            courseStudents.forEach(
                student => {

                    const score =
                        getStudentScore(
                            student,
                            assessment.id
                        );


                    if (score !== null) {

                        const maxScore =
                            Number(
                                assessment.maxScore
                            ) || 100;


                        const percentage =
                            (
                                Number(score) /
                                maxScore
                            ) * 100;


                        total +=
                            percentage;


                        count++;

                    }

                }
            );


            labels.push(

                assessment.name ||
                assessment.title ||
                assessment.type ||
                assessment.id

            );


            averages.push(

                count > 0

                    ? Number(
                        (
                            total /
                            count
                        ).toFixed(1)
                    )

                    : 0

            );

        }
    );


    assessmentChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels,

                    datasets: [{

                        label:
                            "Average Percentage",

                        data: averages

                    }]

                },

                options: {

                    responsive: true,

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100

                        }

                    }

                }

            }
        );
}


// ==================================================
// ACCOUNT MENU
// ==================================================

const account =
    $("account");

const accountMenu =
    $("accountMinu");


if (account) {

    account.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            accountMenu?.classList.toggle(
                "activeAccount"
            );

        }
    );

}


document.addEventListener(
    "click",
    function () {

        accountMenu?.classList.remove(
            "activeAccount"
        );

    }
);


// ==================================================
// LOGOUT
// ==================================================

const logout =
    $("logout");


if (logout) {

    logout.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "loggedInUser"
            );


            document.cookie =
                "currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";


            window.location.href =
                "../auth/login.html";

        }
    );

}


// ==================================================
// BURGER MENU
// ==================================================

const burger =
    $("burgerMinu");

const sideBar =
    $("sideBar");


if (burger) {

    burger.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            sideBar?.classList.toggle(
                "activeSide"
            );

        }
    );

}


// ==================================================
// HEADER NAME
// ==================================================

if (currentInstructor) {

    const instructorName =
        currentInstructor.fullName ||
        currentInstructor.name ||
        currentInstructor.email ||
        "";


    if ($("name")) {

        $("name").textContent =
            instructorName;

    }


    if ($("logo")) {

        const words =
            instructorName
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        const initials =
            words
                .slice(0, 2)
                .map(
                    word =>
                        word[0]
                            .toUpperCase()
                )
                .join("");


        $("logo").textContent =
            initials || "?";

    }

}