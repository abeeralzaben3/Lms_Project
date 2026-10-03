'use strict';

// ==================================================
// ELEMENTS
// ==================================================

const addCourse = document.getElementById('addCourse');
const courseModal = document.getElementById('courseModal');
const courseForm = document.getElementById('courseForm');
const closeCourseModal = document.getElementById('closeCourseModal');

const addAssessment = document.getElementById('addAssessment');
const assessmentModal = document.getElementById('assessmentModal');
const assessmentForm = document.getElementById('assessmentForm');
const closeModal = document.getElementById('closeModal');

const editCourseModal = document.getElementById('editCourseModal');
const editCourseForm = document.getElementById('editCourseForm');
const closeEditCourseModal =
    document.getElementById('closeEditCourseModal');

const editAssessmentModal =
    document.getElementById('editAssessmentModal');

const editAssessmentForm =
    document.getElementById('editAssessmentForm');

const closeEditAssessmentModal =
    document.getElementById('closeEditAssessmentModal');

const coursesBox = document.getElementById('courses');
const assessmentsBox = document.getElementById('assessments');
const studentsBox = document.getElementById('students');
const studentsSection = document.getElementById('studentsSection');
const saveMarks = document.getElementById('saveMarks');

let selectedCourseId = null;
let selectedAssessmentId = null;

let editingCourseId = null;
let editingAssessmentId = null;


// ==================================================
// LOCAL STORAGE HELPERS
// ==================================================

function getData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}


// ==================================================
// COOKIE
// ==================================================

function getCookie(name) {
    const match = document.cookie
        .split('; ')
        .find(row => row.startsWith(name + '='));

    return match
        ? decodeURIComponent(
            match.slice(name.length + 1)
        )
        : null;
}


// ==================================================
// MESSAGE POPUP
// ==================================================

function showMessage(message) {

    const popup = document.getElementById('messagePopup');

    if (!popup) {
        console.log(message);
        return;
    }

    popup.innerText = message;
    popup.style.display = 'block';

    setTimeout(() => {
        popup.style.display = 'none';
    }, 2000);
}


// ==================================================
// LOGIN CHECK
// ==================================================

const loggedInUser = JSON.parse(
    localStorage.getItem('loggedInUser') || 'null'
);

const currentUserEmail = (
    getCookie('currentUser') || ''
).toLowerCase();

if (
    !currentUserEmail ||
    !loggedInUser ||
    loggedInUser.role?.toLowerCase() !== 'instructor'
) {
    window.location.href = '../auth/login.html';
}


// ==================================================
// CURRENT INSTRUCTOR
// ==================================================

function getCurrentInstructor() {

    const instructors = getData('instructors');

    // First try the logged-in user ID.
    if (loggedInUser?.id) {

        const byId = instructors.find(
            instructor =>
                String(instructor.id) ===
                String(loggedInUser.id)
        );

        if (byId) {
            return byId;
        }
    }

    // Then try email.
    return instructors.find(
        instructor =>
            instructor.email &&
            instructor.email.toLowerCase() === currentUserEmail
    ) || null;
}

const currentInstructor = getCurrentInstructor();

if (!currentInstructor) {
    console.error('Current instructor was not found.');
}


// ==================================================
// CURRENT INSTRUCTOR ID
// ==================================================

function getCurrentInstructorId() {

    return currentInstructor
        ? String(currentInstructor.id)
        : null;
}


// ==================================================
// STUDENTS
// ==================================================

async function getStudents() {

    let students = getData('students');

    // Use saved localStorage data first.
    if (students.length) {
        return students;
    }

    // If localStorage is empty, try json-server.
    try {

        const response = await fetch(
            'http://localhost:3000/students'
        );

        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }

        students = await response.json();

        saveData('students', students);

        return students;

    } catch (error) {

        console.error(error);

        showMessage('Could not load students');

        return [];
    }
}


// ==================================================
// COURSES
// ==================================================
//
// Your data:
//
// {
//     "id": "COURSE001",
//     "name": "JavaScript",
//     "instructorId": "INS001",
//     "studentsCount": 10
// }
//
// ==================================================

function getMyCourses() {

    const courses = getData('courses');
    const instructorId = getCurrentInstructorId();

    if (!instructorId) {
        return [];
    }

    return courses.filter(
        course =>
            String(course.instructorId) === instructorId
    );
}


// ==================================================
// ASSESSMENTS
// ==================================================
//
// Your data:
//
// {
//     "id": "AS001",
//     "courseId": "COURSE001",
//     "instructorId": "INS001",
//     "name": "JavaScript Basics",
//     "type": "assignment",
//     "maxScore": 100
// }
//
// ==================================================

function getMyAssessments() {

    const assessments = getData('lms_assessments');
    const instructorId = getCurrentInstructorId();

    if (!instructorId) {
        return [];
    }

    return assessments.filter(
        assessment =>
            String(assessment.instructorId) === instructorId
    );
}


// ==================================================
// SELECTED COURSE
// ==================================================

function getSelectedCourse() {

    const courses = getData('courses');

    return courses.find(
        course =>
            String(course.id) ===
            String(selectedCourseId)
    ) || null;
}


// ==================================================
// SELECTED ASSESSMENT
// ==================================================

function getSelectedAssessment() {

    const assessments = getData('lms_assessments');

    return assessments.find(
        assessment =>
            String(assessment.id) ===
            String(selectedAssessmentId)
    ) || null;
}


// ==================================================
// GENERATE COURSE ID
// ==================================================

function generateCourseId() {

    const courses = getData('courses');

    const numbers = courses
        .map(course => {
            const match = String(course.id)
                .match(/^COURSE(\d+)$/);

            return match
                ? Number(match[1])
                : null;
        })
        .filter(number => number !== null);

    const nextNumber = numbers.length
        ? Math.max(...numbers) + 1
        : 1;

    return `COURSE${String(nextNumber).padStart(3, '0')}`;
}


// ==================================================
// GENERATE ASSESSMENT ID
// ==================================================

function generateAssessmentId() {

    const assessments = getData('lms_assessments');

    const numbers = assessments
        .map(assessment => {

            const match = String(assessment.id)
                .match(/^AS(\d+)$/);

            return match
                ? Number(match[1])
                : null;
        })
        .filter(number => number !== null);

    const nextNumber = numbers.length
        ? Math.max(...numbers) + 1
        : 1;

    return `AS${String(nextNumber).padStart(3, '0')}`;
}


// ==================================================
// CHECK DUPLICATE COURSE
// ==================================================

function courseExists(name, exceptId = null) {

    const courses = getMyCourses();

    return courses.some(course => {

        const sameName =
            course.name.trim().toLowerCase() ===
            name.trim().toLowerCase();

        const differentCourse =
            String(course.id) !== String(exceptId);

        return sameName && differentCourse;
    });
}


// ==================================================
// CHECK DUPLICATE ASSESSMENT
// ==================================================

function assessmentExists(
    courseId,
    name,
    exceptId = null
) {

    const assessments = getMyAssessments();

    return assessments.some(assessment => {

        const sameCourse =
            String(assessment.courseId) ===
            String(courseId);

        const sameName =
            assessment.name.trim().toLowerCase() ===
            name.trim().toLowerCase();

        const differentAssessment =
            String(assessment.id) !==
            String(exceptId);

        return (
            sameCourse &&
            sameName &&
            differentAssessment
        );
    });
}


// ==================================================
// ADD COURSE
// ==================================================

if (addCourse) {

    addCourse.addEventListener('click', () => {

        courseForm?.reset();

        courseModal.style.display = 'flex';
    });
}


// ==================================================
// CLOSE ADD COURSE MODAL
// ==================================================

if (closeCourseModal) {

    closeCourseModal.addEventListener('click', () => {

        courseModal.style.display = 'none';
    });
}


// ==================================================
// ADD COURSE FORM
// ==================================================

if (courseForm) {

    courseForm.addEventListener('submit', event => {

        event.preventDefault();

        const nameInput =
            document.getElementById('courseName');

        const name =
            nameInput?.value.trim() || '';

        if (!name) {

            showMessage('Course name is required');

            return;
        }

        if (!currentInstructor) {

            showMessage('Instructor not found');

            return;
        }

        if (courseExists(name)) {

            showMessage(
                'This course already exists'
            );

            return;
        }

        const courses = getData('courses');

        const newCourse = {

            id: generateCourseId(),

            name: name,

            instructorId:
                currentInstructor.id,

            studentsCount: 0
        };

        courses.push(newCourse);

        saveData('courses', courses);

        selectedCourseId = newCourse.id;
        selectedAssessmentId = null;

        courseForm.reset();

        courseModal.style.display = 'none';

        showCourses();
        showAssessments();
        showStudents();

        showMessage('Course added');
    });
}


// ==================================================
// UPDATE COURSE
// ==================================================

function updateCourse(courseId) {

    const course = getData('courses').find(
        course =>
            String(course.id) ===
            String(courseId)
    );

    if (!course) {
        return;
    }

    editingCourseId = courseId;

    const input =
        document.getElementById('editCourseName');

    if (input) {
        input.value = course.name;
    }

    editCourseModal.style.display = 'flex';
}


// ==================================================
// CLOSE UPDATE COURSE
// ==================================================

if (closeEditCourseModal) {

    closeEditCourseModal.addEventListener(
        'click',
        () => {

            editCourseModal.style.display = 'none';

            editingCourseId = null;
        }
    );
}


// ==================================================
// UPDATE COURSE FORM
// ==================================================

if (editCourseForm) {

    editCourseForm.addEventListener(
        'submit',
        event => {

            event.preventDefault();

            if (!editingCourseId) {
                return;
            }

            const input =
                document.getElementById(
                    'editCourseName'
                );

            const newName =
                input?.value.trim() || '';

            if (!newName) {

                showMessage(
                    'Course name is required'
                );

                return;
            }

            if (
                courseExists(
                    newName,
                    editingCourseId
                )
            ) {

                showMessage(
                    'This course already exists'
                );

                return;
            }

            const courses = getData('courses');

            const course = courses.find(
                course =>
                    String(course.id) ===
                    String(editingCourseId)
            );

            if (!course) {
                return;
            }

            course.name = newName;

            saveData('courses', courses);

            selectedCourseId = editingCourseId;

            editCourseModal.style.display = 'none';

            editingCourseId = null;

            showCourses();
            showAssessments();
            showStudents();

            showMessage('Course updated');
        }
    );
}


// ==================================================
// DELETE COURSE
// ==================================================

async function deleteCourse(courseId) {

    const course = getData('courses').find(
        course =>
            String(course.id) ===
            String(courseId)
    );

    if (!course) {
        return;
    }

    const confirmed = confirm(
        `Delete "${course.name}" and all its assessments?`
    );

    if (!confirmed) {
        return;
    }

    // ----------------------------------------------
    // Remove course
    // ----------------------------------------------

    let courses = getData('courses');

    courses = courses.filter(
        item =>
            String(item.id) !==
            String(courseId)
    );

    saveData('courses', courses);


    // ----------------------------------------------
    // Find assessments belonging to course
    // ----------------------------------------------

    let assessments =
        getData('lms_assessments');

    const removedAssessmentIds =
        assessments
            .filter(
                assessment =>
                    String(assessment.courseId) ===
                    String(courseId)
            )
            .map(
                assessment => assessment.id
            );


    // ----------------------------------------------
    // Remove assessments
    // ----------------------------------------------

    assessments = assessments.filter(
        assessment =>
            String(assessment.courseId) !==
            String(courseId)
    );

    saveData(
        'lms_assessments',
        assessments
    );


    // ----------------------------------------------
    // Remove scores belonging to those assessments
    // ----------------------------------------------

    let scores = getData('lms_scores');

    scores = scores.filter(
        score =>
            !removedAssessmentIds.some(
                id =>
                    String(id) ===
                    String(score.assessmentId)
            )
    );

    saveData('lms_scores', scores);


    // ----------------------------------------------
    // Remove matching scores from students too
    // ----------------------------------------------
    //
    // We keep the students data structure.
    // Only remove scores belonging to deleted assessments.
    //

    const students = await getStudents();

    students.forEach(student => {

        if (!Array.isArray(student.scores)) {
            return;
        }

        student.scores =
            student.scores.filter(
                score =>
                    !removedAssessmentIds.some(
                        id =>
                            String(id) ===
                            String(score.assessmentId)
                    )
            );
    });

    saveData('students', students);


    // ----------------------------------------------
    // Reset selection
    // ----------------------------------------------

    if (
        String(selectedCourseId) ===
        String(courseId)
    ) {

        selectedCourseId = null;
        selectedAssessmentId = null;
    }


    showCourses();
    showAssessments();
    showStudents();

    showMessage('Course deleted');
}


// ==================================================
// ADD ASSESSMENT
// ==================================================

if (addAssessment) {

    addAssessment.addEventListener(
        'click',
        () => {

            if (!selectedCourseId) {

                showMessage(
                    'Please select a course first'
                );

                return;
            }

            assessmentForm?.reset();

            assessmentModal.style.display = 'flex';
        }
    );
}


// ==================================================
// CLOSE ADD ASSESSMENT MODAL
// ==================================================

if (closeModal) {

    closeModal.addEventListener(
        'click',
        () => {

            assessmentModal.style.display = 'none';
        }
    );
}


// ==================================================
// ADD ASSESSMENT FORM
// ==================================================

if (assessmentForm) {

    assessmentForm.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            if (!selectedCourseId) {

                showMessage(
                    'Please select a course first'
                );

                return;
            }

            const name =
                document.getElementById(
                    'assessmentName'
                )?.value.trim() || '';

            const type =
                document.getElementById(
                    'type'
                )?.value || 'assignment';

            const maxScore = Number(
                document.getElementById(
                    'maxScore'
                )?.value
            );


            // ------------------------------------------
            // Validation
            // ------------------------------------------

            if (!name) {

                showMessage(
                    'Assessment name is required'
                );

                return;
            }

            if (!maxScore || maxScore <= 0) {

                showMessage(
                    'Maximum score must be greater than 0'
                );

                return;
            }


            if (
                assessmentExists(
                    selectedCourseId,
                    name
                )
            ) {

                showMessage(
                    'This assessment already exists'
                );

                return;
            }


            // ------------------------------------------
            // Create assessment
            // ------------------------------------------

            const assessments =
                getData('lms_assessments');

            const newAssessment = {

                id: generateAssessmentId(),

                courseId: selectedCourseId,

                instructorId:
                    currentInstructor.id,

                name: name,

                type: type,

                maxScore: maxScore
            };

            assessments.push(newAssessment);

            saveData(
                'lms_assessments',
                assessments
            );


            // ------------------------------------------
            // Add empty score for each student
            // ------------------------------------------

            const students = await getStudents();

            let scores = getData('lms_scores');

            students.forEach(student => {

                // Only students registered in this course
                if (
                    !(student.courses || []).some(
                        id =>
                            String(id) ===
                            String(selectedCourseId)
                    )
                ) {
                    return;
                }

                scores.push({

                    studentId: student.id,

                    assessmentId:
                        newAssessment.id,

                    score: null
                });

            });

            saveData('lms_scores', scores);


            // ------------------------------------------
            // Close and refresh
            // ------------------------------------------

            assessmentForm.reset();

            assessmentModal.style.display = 'none';

            selectedAssessmentId =
                newAssessment.id;

            showAssessments();
            showStudents();

            showMessage('Assessment added');
        }
    );
}


// ==================================================
// UPDATE ASSESSMENT
// ==================================================

function updateAssessment(assessmentId) {

    const assessment =
        getData('lms_assessments').find(
            assessment =>
                String(assessment.id) ===
                String(assessmentId)
        );

    if (!assessment) {
        return;
    }

    editingAssessmentId = assessmentId;


    const nameInput =
        document.getElementById(
            'editAssessmentName'
        );

    const typeInput =
        document.getElementById(
            'editAssessmentType'
        );

    const maxScoreInput =
        document.getElementById(
            'editAssessmentMaxScore'
        );


    if (nameInput) {
        nameInput.value =
            assessment.name;
    }

    if (typeInput) {
        typeInput.value =
            assessment.type;
    }

    if (maxScoreInput) {
        maxScoreInput.value =
            assessment.maxScore;
    }


    editAssessmentModal.style.display =
        'flex';
}


// ==================================================
// CLOSE UPDATE ASSESSMENT
// ==================================================

if (closeEditAssessmentModal) {

    closeEditAssessmentModal.addEventListener(
        'click',
        () => {

            editAssessmentModal.style.display =
                'none';

            editingAssessmentId = null;
        }
    );
}


// ==================================================
// UPDATE ASSESSMENT FORM
// ==================================================

if (editAssessmentForm) {

    editAssessmentForm.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            if (!editingAssessmentId) {
                return;
            }


            const name =
                document.getElementById(
                    'editAssessmentName'
                )?.value.trim() || '';

            const type =
                document.getElementById(
                    'editAssessmentType'
                )?.value || 'assignment';

            const maxScore = Number(
                document.getElementById(
                    'editAssessmentMaxScore'
                )?.value
            );


            // ------------------------------------------
            // Validation
            // ------------------------------------------

            if (!name) {

                showMessage(
                    'Assessment name is required'
                );

                return;
            }

            if (!maxScore || maxScore <= 0) {

                showMessage(
                    'Maximum score must be greater than 0'
                );

                return;
            }


            if (
                assessmentExists(
                    selectedCourseId,
                    name,
                    editingAssessmentId
                )
            ) {

                showMessage(
                    'This assessment already exists'
                );

                return;
            }


            // ------------------------------------------
            // Get assessment
            // ------------------------------------------

            const assessments =
                getData('lms_assessments');

            const assessment =
                assessments.find(
                    assessment =>
                        String(assessment.id) ===
                        String(editingAssessmentId)
                );

            if (!assessment) {
                return;
            }


            // ------------------------------------------
            // Check existing scores
            // ------------------------------------------

            const scores =
                getData('lms_scores');

            const tooHigh =
                scores.some(score => {

                    return (
                        String(score.assessmentId) ===
                        String(editingAssessmentId) &&
                        score.score !== null &&
                        Number(score.score) >
                        maxScore
                    );

                });


            if (tooHigh) {

                showMessage(
                    'Some students already have marks above this maximum'
                );

                return;
            }


            // ------------------------------------------
            // Update
            // ------------------------------------------

            assessment.name = name;
            assessment.type = type;
            assessment.maxScore = maxScore;

            saveData(
                'lms_assessments',
                assessments
            );


            editAssessmentModal.style.display =
                'none';

            editingAssessmentId = null;


            showAssessments();
            showStudents();

            showMessage('Assessment updated');
        }
    );
}


// ==================================================
// DELETE ASSESSMENT
// ==================================================

async function deleteAssessment(assessmentId) {

    const assessment =
        getData('lms_assessments').find(
            assessment =>
                String(assessment.id) ===
                String(assessmentId)
        );

    if (!assessment) {
        return;
    }


    const confirmed = confirm(
        `Delete "${assessment.name}" and all its marks?`
    );

    if (!confirmed) {
        return;
    }


    // ----------------------------------------------
    // Remove assessment
    // ----------------------------------------------

    let assessments =
        getData('lms_assessments');

    assessments = assessments.filter(
        item =>
            String(item.id) !==
            String(assessmentId)
    );

    saveData(
        'lms_assessments',
        assessments
    );


    // ----------------------------------------------
    // Remove from lms_scores
    // ----------------------------------------------

    let scores = getData('lms_scores');

    scores = scores.filter(
        score =>
            String(score.assessmentId) !==
            String(assessmentId)
    );

    saveData('lms_scores', scores);


    // ----------------------------------------------
    // Remove from student scores
    // ----------------------------------------------

    const students = await getStudents();

    students.forEach(student => {

        if (!Array.isArray(student.scores)) {
            return;
        }

        student.scores =
            student.scores.filter(
                score =>
                    String(score.assessmentId) !==
                    String(assessmentId)
            );
    });

    saveData('students', students);


    // ----------------------------------------------
    // Reset selection
    // ----------------------------------------------

    if (
        String(selectedAssessmentId) ===
        String(assessmentId)
    ) {
        selectedAssessmentId = null;
    }


    showAssessments();
    showStudents();

    showMessage('Assessment deleted');
}


// ==================================================
// SHOW COURSES
// ==================================================

function showCourses() {

    if (!coursesBox) {
        return;
    }

    coursesBox.innerHTML = '';

    const courses = getMyCourses();


    // ----------------------------------------------
    // No courses
    // ----------------------------------------------

    if (!courses.length) {

        coursesBox.innerHTML =
            '<p>No courses found.</p>';

        return;
    }


    // ----------------------------------------------
    // Create cards
    // ----------------------------------------------

    courses.forEach(course => {

        const card =
            document.createElement('div');

        card.classList.add('card');


        // Selected
        if (
            String(course.id) ===
            String(selectedCourseId)
        ) {
            card.classList.add('selected');
        }


        // ------------------------------------------
        // Content
        // ------------------------------------------

        const content =
            document.createElement('div');

        content.classList.add(
            'card-content'
        );


        const title =
            document.createElement('div');

        title.classList.add(
            'card-title'
        );

        title.innerText =
            course.name;


        const info =
            document.createElement('div');

        info.classList.add(
            'card-info'
        );

        info.innerText =
            `${course.studentsCount ?? 0} students`;


        content.append(
            title,
            info
        );


        // ------------------------------------------
        // Update button
        // ------------------------------------------

        const updateBtn =
            document.createElement('button');

        updateBtn.innerText =
            'Update';

        updateBtn.addEventListener(
            'click',
            event => {

                event.stopPropagation();

                updateCourse(course.id);
            }
        );


        // ------------------------------------------
        // Delete button
        // ------------------------------------------

        const deleteBtn =
            document.createElement('button');

        deleteBtn.innerText =
            'Delete';

        deleteBtn.addEventListener(
            'click',
            event => {

                event.stopPropagation();

                deleteCourse(course.id);
            }
        );


        // ------------------------------------------
        // Select course
        // ------------------------------------------

        card.addEventListener(
            'click',
            () => {

                selectedCourseId =
                    course.id;

                selectedAssessmentId =
                    null;

                showCourses();
                showAssessments();
                showStudents();
            }
        );


        card.append(
            content,
            updateBtn,
            deleteBtn
        );

        coursesBox.appendChild(card);
    });
}


// ==================================================
// SHOW ASSESSMENTS
// ==================================================

function showAssessments() {

    if (!assessmentsBox) {
        return;
    }

    assessmentsBox.innerHTML = '';


    if (!selectedCourseId) {

        assessmentsBox.innerHTML =
            '<p>Select a course to see assessments.</p>';

        return;
    }


    const assessments =
        getMyAssessments().filter(
            assessment =>
                String(assessment.courseId) ===
                String(selectedCourseId)
        );


    // ----------------------------------------------
    // No assessments
    // ----------------------------------------------

    if (!assessments.length) {

        assessmentsBox.innerHTML =
            '<p>No assessments for this course.</p>';

        return;
    }


    // ----------------------------------------------
    // Create cards
    // ----------------------------------------------

    assessments.forEach(assessment => {

        const card =
            document.createElement('div');

        card.classList.add('card');


        if (
            String(assessment.id) ===
            String(selectedAssessmentId)
        ) {
            card.classList.add('selected');
        }


        // ------------------------------------------
        // Content
        // ------------------------------------------

        const content =
            document.createElement('div');

        content.classList.add(
            'card-content'
        );


        const title =
            document.createElement('div');

        title.classList.add(
            'card-title'
        );

        title.innerText =
            assessment.name;


        const type =
            document.createElement('div');

        type.classList.add(
            'card-type'
        );

        type.innerText =
            assessment.type;


        const maxScore =
            document.createElement('div');

        maxScore.classList.add(
            'card-info'
        );

        maxScore.innerText =
            `Maximum score: ${assessment.maxScore}`;


        content.append(
            title,
            type,
            maxScore
        );


        // ------------------------------------------
        // Update
        // ------------------------------------------

        const updateBtn =
            document.createElement('button');

        updateBtn.innerText =
            'Update';

        updateBtn.addEventListener(
            'click',
            event => {

                event.stopPropagation();

                updateAssessment(
                    assessment.id
                );
            }
        );


        // ------------------------------------------
        // Delete
        // ------------------------------------------

        const deleteBtn =
            document.createElement('button');

        deleteBtn.innerText =
            'Delete';

        deleteBtn.addEventListener(
            'click',
            event => {

                event.stopPropagation();

                deleteAssessment(
                    assessment.id
                );
            }
        );


        // ------------------------------------------
        // Select
        // ------------------------------------------

        card.addEventListener(
            'click',
            () => {

                selectedAssessmentId =
                    assessment.id;

                showAssessments();
                showStudents();
            }
        );


        card.append(
            content,
            updateBtn,
            deleteBtn
        );

        assessmentsBox.appendChild(card);
    });
}


// ==================================================
// GET SCORE
// ==================================================

function getStudentScore(
    studentId,
    assessmentId
) {

    const scores = getData('lms_scores');

    const score = scores.find(
        item =>
            String(item.studentId) ===
            String(studentId) &&
            String(item.assessmentId) ===
            String(assessmentId)
    );

    return score || null;
}


// ==================================================
// SHOW STUDENTS + MARKS
// ==================================================

async function showStudents() {

    if (!studentsBox || !studentsSection) {
        return;
    }


    if (!selectedAssessmentId) {

        studentsBox.replaceChildren();

        studentsSection.style.display =
            'none';

        return;
    }


    studentsSection.style.display =
        'block';


    const assessment =
        getSelectedAssessment();

    if (!assessment) {
        return;
    }


    const students =
        await getStudents();


    // ----------------------------------------------
    // Only students in selected course
    // ----------------------------------------------

    const courseStudents =
        students.filter(student => {

            if (student.archived) {
                return false;
            }

            return (
                student.courses || []
            ).some(
                courseId =>
                    String(courseId) ===
                    String(assessment.courseId)
            );
        });


    // ----------------------------------------------
    // No students
    // ----------------------------------------------

    if (!courseStudents.length) {

        studentsBox.innerHTML =
            '<p>No students found.</p>';

        return;
    }


    const rows = [];


    // ----------------------------------------------
    // Create students
    // ----------------------------------------------

    courseStudents.forEach(
        (student, index) => {

            const row =
                document.createElement('div');

            row.classList.add(
                'student'
            );


            // --------------------------------------
            // Student information
            // --------------------------------------

            const info =
                document.createElement('div');

            info.classList.add(
                'student-info'
            );


            const name =
                document.createElement('div');

            name.classList.add(
                'student-name'
            );

            name.innerText =
                student.name ||
                `Student ${index + 1}`;


            const id =
                document.createElement('div');

            id.classList.add(
                'student-id'
            );

            id.innerText =
                student.studentId ||
                student.id;


            info.append(
                name,
                id
            );


            // --------------------------------------
            // Mark
            // --------------------------------------

            const mark =
                document.createElement('div');

            mark.classList.add(
                'student-mark'
            );


            const input =
                document.createElement('input');

            input.type =
                'number';

            input.min =
                '0';

            input.max =
                assessment.maxScore;

            input.placeholder =
                '0';

            input.dataset.studentId =
                student.id;


            const scoreRecord =
                getStudentScore(
                    student.id,
                    assessment.id
                );


            if (
                scoreRecord &&
                scoreRecord.score !== null &&
                scoreRecord.score !== undefined
            ) {

                input.value =
                    scoreRecord.score;

            } else {

                input.value = '';
            }


            const max =
                document.createElement('span');

            max.innerText =
                `/ ${assessment.maxScore}`;


            mark.append(
                input,
                max
            );


            row.append(
                info,
                mark
            );


            rows.push(row);
        }
    );


    studentsBox.replaceChildren(
        ...rows
    );
}


// ==================================================
// SAVE MARKS
// ==================================================

if (saveMarks) {

    saveMarks.addEventListener(
        'click',
        async () => {

            if (!selectedAssessmentId) {

                showMessage(
                    'Please select an assessment'
                );

                return;
            }


            const assessment =
                getSelectedAssessment();

            if (!assessment) {
                return;
            }


            const inputs =
                studentsBox.querySelectorAll(
                    'input'
                );


            // ------------------------------------------
            // Validate
            // ------------------------------------------

            for (const input of inputs) {

                if (input.value === '') {
                    continue;
                }

                const score =
                    Number(input.value);


                if (
                    score < 0 ||
                    score > assessment.maxScore
                ) {

                    showMessage(
                        `Score must be between 0 and ${assessment.maxScore}`
                    );

                    input.focus();

                    return;
                }
            }


            // ------------------------------------------
            // Get current scores
            // ------------------------------------------

            const scores =
                getData('lms_scores');


            // ------------------------------------------
            // Save each mark
            // ------------------------------------------

            inputs.forEach(input => {

                const studentId =
                    input.dataset.studentId;


                let record =
                    scores.find(
                        score =>
                            String(
                                score.studentId
                            ) ===
                            String(studentId) &&

                            String(
                                score.assessmentId
                            ) ===
                            String(selectedAssessmentId)
                    );


                // --------------------------------------
                // Create if missing
                // --------------------------------------

                if (!record) {

                    record = {

                        studentId:
                            studentId,

                        assessmentId:
                            selectedAssessmentId,

                        score: null
                    };

                    scores.push(record);
                }


                // --------------------------------------
                // Save score
                // --------------------------------------

                record.score =
                    input.value === ''
                        ? null
                        : Number(input.value);
            });


            saveData(
                'lms_scores',
                scores
            );


            // ------------------------------------------
            // Also update student.scores
            // ------------------------------------------
            //
            // Your existing data already contains
            // student.scores, so we keep it synchronized.
            //
            // Existing IDs such as a1/a2 are NOT changed.
            // Only records matching this assessment ID
            // are updated.
            //

            const students =
                await getStudents();


            inputs.forEach(input => {

                const student =
                    students.find(
                        item =>
                            String(item.id) ===
                            String(
                                input.dataset.studentId
                            )
                    );

                if (!student) {
                    return;
                }


                if (!Array.isArray(student.scores)) {
                    student.scores = [];
                }


                let studentScore =
                    student.scores.find(
                        score =>
                            String(
                                score.assessmentId
                            ) ===
                            String(
                                selectedAssessmentId
                            )
                    );


                if (!studentScore) {

                    studentScore = {

                        assessmentId:
                            selectedAssessmentId,

                        score: null
                    };

                    student.scores.push(
                        studentScore
                    );
                }


                studentScore.score =
                    input.value === ''
                        ? null
                        : Number(input.value);
            });


            saveData(
                'students',
                students
            );


            showMessage(
                'Marks saved'
            );
        }
    );
}


// ==================================================
// ACCOUNT / HEADER
// ==================================================

function getInitials(name) {

    const words = String(name)
        .split(/\s+/)
        .filter(
            word =>
                word &&
                !/^(dr|prof|mr|mrs|ms|eng)\.?$/i.test(word)
        );

    return (
        words
            .slice(0, 2)
            .map(
                word =>
                    word[0].toUpperCase()
            )
            .join('') || '?'
    );
}


function setupHeader() {

    const account =
        document.getElementById('account');

    const accountMenu =
        document.getElementById('accountMinu');

    const burgerMenu =
        document.getElementById('burgerMinu');

    const sideBar =
        document.getElementById('sideBar');

    const logout =
        document.getElementById('logout');

    const headerName =
        document.getElementById('headerName');

    const techName =
        document.getElementById('techName');

    const logo =
        document.getElementById('logo');


    // ----------------------------------------------
    // Instructor name
    // ----------------------------------------------

    const instructor =
        getCurrentInstructor();

    const name =
        instructor
            ? (
                instructor.fullName ||
                instructor.name ||
                instructor.email ||
                ''
            )
            : '';


    if (headerName) {
        headerName.textContent = name;
    }

    if (techName) {
        techName.textContent = name;
    }

    if (logo) {
        logo.textContent =
            name
                ? getInitials(name)
                : '';
    }


    // ----------------------------------------------
    // Account menu
    // ----------------------------------------------

    if (account && accountMenu) {

        account.addEventListener(
            'click',
            event => {

                event.stopPropagation();

                accountMenu.classList.toggle(
                    'activeAccount'
                );
            }
        );
    }


    // ----------------------------------------------
    // Burger menu
    // ----------------------------------------------

    if (burgerMenu && sideBar) {

        burgerMenu.addEventListener(
            'click',
            event => {

                event.stopPropagation();

                sideBar.classList.toggle(
                    'activeSide'
                );
            }
        );


        sideBar.addEventListener(
            'click',
            event => {

                event.stopPropagation();
            }
        );
    }


    // ----------------------------------------------
    // Logout
    // ----------------------------------------------

    if (logout) {

        logout.addEventListener(
            'click',
            () => {

                document.cookie =
                    'currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

                localStorage.removeItem(
                    'loggedInUser'
                );

                window.location.href =
                    '../auth/login.html';
            }
        );
    }


    // ----------------------------------------------
    // Close menus
    // ----------------------------------------------

    document.addEventListener(
        'click',
        () => {

            if (accountMenu) {

                accountMenu.classList.remove(
                    'activeAccount'
                );
            }

            if (sideBar) {

                sideBar.classList.remove(
                    'activeSide'
                );
            }
        }
    );


    document.addEventListener(
        'keydown',
        event => {

            if (event.key === 'Escape') {

                if (accountMenu) {

                    accountMenu.classList.remove(
                        'activeAccount'
                    );
                }

                if (sideBar) {

                    sideBar.classList.remove(
                        'activeSide'
                    );
                }
            }
        }
    );
}


// ==================================================
// INITIAL LOAD
// ==================================================

setupHeader();

if (studentsSection) {
    studentsSection.style.display = 'none';
}

showCourses();

showAssessments();

showStudents();