// ---------- elements ----------

const addCourse = document.getElementById('addCourse');
const courseModal = document.getElementById('courseModal');
const courseForm = document.getElementById('courseForm');
const closeCourseModal = document.getElementById('closeCourseModal');

const addAssessment = document.getElementById('addAssessment');
const assessmentModal = document.getElementById('assessmentModal');
const assessmentForm = document.getElementById('assessmentForm');
const closeModal = document.getElementById('closeModal');

// NEW: edit modals (same style as the add modals)
const editCourseModal = document.getElementById('editCourseModal');
const editCourseForm = document.getElementById('editCourseForm');
const closeEditCourseModal = document.getElementById('closeEditCourseModal');

const editAssessmentModal = document.getElementById('editAssessmentModal');
const editAssessmentForm = document.getElementById('editAssessmentForm');
const closeEditAssessmentModal = document.getElementById('closeEditAssessmentModal');

const coursesBox = document.getElementById('courses');
const assessmentsBox = document.getElementById('assessments');
const studentsBox = document.getElementById('students');
const studentsSection = document.getElementById('studentsSection');
const saveMarks = document.getElementById('saveMarks');

let selectedCourse = null;
let selectedAssessmentId = null;
let editingCourse = null;        // course name being edited
let editingAssessmentId = null;  // assessment id being edited


// ---------- first-time seed (only if nothing is saved yet) ----------

if (!localStorage.getItem('instructors')) {
    localStorage.setItem('instructors', JSON.stringify([
        {
            id: 'ins_001',
            username: 'ali',
            name: 'Dr. Ahmad',
            email: 'ahmad@school.com',
            createdAt: '2026-10-01',
            courses: ['JS101'],
            assessments: [
                { id: 'a1', course: 'JS101', type: 'task', title: 'Task 1', maxScore: 10 },
                { id: 'a2', course: 'JS101', type: 'task', title: 'Task 2', maxScore: 10 },
                { id: 'a3', course: 'JS101', type: 'project', title: 'Mini Project', maxScore: 40 },
                { id: 'a4', course: 'JS101', type: 'project', title: 'Final Project', maxScore: 50 }
            ]
        }
    ]));
}


// ---------- helpers ----------

const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const saveData = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function getCookie(name) {
    const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// only set a default user if nobody is logged in yet
if (!getCookie('cur_user')) {
    document.cookie = 'cur_user=ali; path=/';
}

// the saved instructor may have no username, so fall back to the first one
function getCurrentInstructor(instructors) {
    const username = getCookie('cur_user');
    return instructors.find(i => i.username === username) || instructors[0];
}

// courses = saved course list + any course already used by an assessment
function getCourses(instructor) {
    const fromList = instructor.courses || [];
    const fromAssessments = (instructor.assessments || []).map(a => a.course);
    return [...new Set([...fromList, ...fromAssessments])];
}

// case-insensitive duplicate check ("except" = the course being renamed)
function courseExists(instructor, name, except = null) {
    return getCourses(instructor).some(
        c => c.toLowerCase() === name.toLowerCase() && c !== except
    );
}

async function getStudents() {
    let students = getData('students');

    if (!students.length) {
        try {
            const response = await fetch('http://localhost:3000/students');

            if (!response.ok) {
                throw new Error('Failed to fetch students');
            }

            students = await response.json();
            saveData('students', students);
        } catch (err) {
            console.error(err);
            showMessage('Could not load students');
            return [];
        }
    }

    return students;
}

function showMessage(message) {
    const popup = document.getElementById('messagePopup');

    popup.innerText = message;
    popup.style.display = 'block';

    setTimeout(() => {
        popup.style.display = 'none';
    }, 2000);
}


// ==================================================
// ADD COURSE
// ==================================================

addCourse.addEventListener('click', () => {
    courseModal.style.display = 'flex';
});

closeCourseModal.addEventListener('click', () => {
    courseModal.style.display = 'none';
});

courseForm.addEventListener('submit', event => {
    event.preventDefault();

    const name = document.getElementById('courseName').value.trim();
    if (!name) return;

    const instructors = getData('instructors');
    const instructor = getCurrentInstructor(instructors);
    if (!instructor) return;

    if (courseExists(instructor, name)) {
        showMessage('This course already exists');
        return;
    }

    instructor.courses = getCourses(instructor);
    instructor.courses.push(name);
    saveData('instructors', instructors);

    courseForm.reset();
    courseModal.style.display = 'none';

    selectedCourse = name;
    selectedAssessmentId = null;

    showCourses();
    showAssessments();
    showStudents();
});


// ==================================================
// UPDATE COURSE (modal form instead of prompt)
// ==================================================

function updateCourse(courseName) {
    editingCourse = courseName;
    document.getElementById('editCourseName').value = courseName;
    editCourseModal.style.display = 'flex';
}

closeEditCourseModal.addEventListener('click', () => {
    editCourseModal.style.display = 'none';
    editingCourse = null;
});

editCourseForm.addEventListener('submit', event => {
    event.preventDefault();

    if (!editingCourse) return;

    const oldName = editingCourse;
    const name = document.getElementById('editCourseName').value.trim();
    if (!name) return;

    const instructors = getData('instructors');
    const instructor = getCurrentInstructor(instructors);
    if (!instructor) return;

    if (courseExists(instructor, name, oldName)) {
        showMessage('This course already exists');
        return;
    }

    // Update course name
    instructor.courses = getCourses(instructor).map(course =>
        course === oldName ? name : course
    );

    // Update the course name inside its assessments
    (instructor.assessments || []).forEach(assessment => {
        if (assessment.course === oldName) {
            assessment.course = name;
        }
    });

    saveData('instructors', instructors);

    // Keep selected course updated
    if (selectedCourse === oldName) {
        selectedCourse = name;
    }

    editCourseModal.style.display = 'none';
    editingCourse = null;

    showCourses();
    showAssessments();
    showStudents();
});


// ==================================================
// DELETE COURSE (also removes its assessments and their scores)
// ==================================================

async function deleteCourse(courseName) {

    if (!confirm(`Delete "${courseName}" and all its assessments?`)) return;

    const instructors = getData('instructors');
    const instructor = getCurrentInstructor(instructors);
    if (!instructor) return;

    const removedIds = (instructor.assessments || [])
        .filter(a => a.course === courseName)
        .map(a => a.id);

    instructor.courses = getCourses(instructor).filter(c => c !== courseName);
    instructor.assessments = (instructor.assessments || [])
        .filter(a => a.course !== courseName);

    saveData('instructors', instructors);

    const students = await getStudents();

    students.forEach(student => {
        student.scores = (student.scores || [])
            .filter(sc => !removedIds.includes(sc.assessmentId));
    });

    saveData('students', students);

    if (selectedCourse === courseName) {
        selectedCourse = null;
        selectedAssessmentId = null;
    }

    showCourses();
    showAssessments();
    showStudents();
}


// ==================================================
// ADD ASSESSMENT (belongs to the selected course)
// ==================================================

addAssessment.addEventListener('click', () => {
    if (!selectedCourse) {
        showMessage('Please select a course first');
        return;
    }

    assessmentModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    assessmentModal.style.display = 'none';
});

assessmentForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!selectedCourse) return;

    const title = document.getElementById('name').value.trim();
    const maxScore = Number(document.getElementById('maxScore').value);
    const type = document.getElementById('type').value;

    if (!title || !maxScore || maxScore <= 0) return;

    const instructors = getData('instructors');
    const instructor = getCurrentInstructor(instructors);
    if (!instructor) return;

    const students = await getStudents();

    // next id: check assessments AND scores already stored on students
    const allIds = [
        ...instructors.flatMap(i => (i.assessments || []).map(a => a.id)),
        ...students.flatMap(s => (s.scores || []).map(sc => sc.assessmentId))
    ];

    const numbers = allIds
        .map(id => Number(String(id).replace('a', '')))
        .filter(Number.isFinite);

    const newId = `a${numbers.length ? Math.max(...numbers) + 1 : 1}`;

    instructor.assessments = instructor.assessments || [];
    instructor.assessments.push({
        id: newId,
        course: selectedCourse,
        type: type,
        title: title,
        maxScore: maxScore
    });
    saveData('instructors', instructors);

    // null = not graded yet (0 is a real mark)
    students.forEach(student => {
        student.scores = student.scores || [];
        student.scores.push({ assessmentId: newId, score: null });
    });
    saveData('students', students);

    assessmentForm.reset();
    assessmentModal.style.display = 'none';

    showAssessments();
    showStudents();
});


// ==================================================
// UPDATE ASSESSMENT (modal form instead of prompt)
// ==================================================

function updateAssessment(id) {
    const instructor = getCurrentInstructor(getData('instructors'));
    if (!instructor) return;

    const assessment = (instructor.assessments || []).find(a => a.id === id);
    if (!assessment) return;

    editingAssessmentId = id;

    document.getElementById('editAssessmentName').value = assessment.title;
    document.getElementById('editAssessmentType').value = assessment.type;
    document.getElementById('editAssessmentMaxScore').value = assessment.maxScore;

    editAssessmentModal.style.display = 'flex';
}

closeEditAssessmentModal.addEventListener('click', () => {
    editAssessmentModal.style.display = 'none';
    editingAssessmentId = null;
});

editAssessmentForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!editingAssessmentId) return;

    const id = editingAssessmentId;
    const title = document.getElementById('editAssessmentName').value.trim();
    const type = document.getElementById('editAssessmentType').value;
    const maxScore = Number(document.getElementById('editAssessmentMaxScore').value);

    if (!title) return;

    if (!maxScore || maxScore <= 0) {
        showMessage('Maximum score must be greater than 0');
        return;
    }

    const instructors = getData('instructors');
    const instructor = getCurrentInstructor(instructors);
    if (!instructor) return;

    const assessment = (instructor.assessments || []).find(a => a.id === id);
    if (!assessment) return;

    // don't allow a max score lower than marks already given
    const students = await getStudents();
    const tooHigh = students.some(s =>
        (s.scores || []).some(sc => sc.assessmentId === id && sc.score > maxScore)
    );

    if (tooHigh) {
        showMessage('Some students already have marks above this maximum');
        return;
    }

    assessment.title = title;
    assessment.type = type;
    assessment.maxScore = maxScore;

    saveData('instructors', instructors);

    editAssessmentModal.style.display = 'none';
    editingAssessmentId = null;

    showAssessments();
    showStudents();
});


// ==================================================
// SHOW COURSES
// ==================================================

function showCourses() {
    coursesBox.innerHTML = '';

    const instructor = getCurrentInstructor(getData('instructors'));

    if (!instructor) return;

    getCourses(instructor).forEach(courseName => {

        const card = document.createElement('div');
        card.classList.add('card');

        // Card content
        const content = document.createElement('div');
        content.classList.add('card-content');

        const title = document.createElement('div');
        title.classList.add('card-title');
        title.innerText = courseName;

        const info = document.createElement('div');
        info.classList.add('card-info');
        info.innerText = 'Course';

        content.append(title, info);

        // Update button
        const updateBtn = document.createElement('button');
        updateBtn.innerText = 'Update';

        updateBtn.addEventListener('click', e => {
            e.stopPropagation();
            updateCourse(courseName);
        });

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Delete';

        deleteBtn.addEventListener('click', e => {
            e.stopPropagation();
            deleteCourse(courseName);
        });

        // Selected course
        if (courseName === selectedCourse) {
            card.classList.add('selected');
        }

        // Select course
        card.addEventListener('click', () => {
            selectedCourse = courseName;
            selectedAssessmentId = null;

            showCourses();
            showAssessments();
            showStudents();
        });

        card.append(content, updateBtn, deleteBtn);
        coursesBox.appendChild(card);
    });
}


// ==================================================
// SHOW ASSESSMENTS (only for the selected course)
// ==================================================

function showAssessments() {
    assessmentsBox.innerHTML = '';

    if (!selectedCourse) return;

    const instructor = getCurrentInstructor(getData('instructors'));

    if (!instructor) return;

    const list = (instructor.assessments || []).filter(
        assessment => assessment.course === selectedCourse
    );

    list.forEach(assessment => {

        const card = document.createElement('div');
        card.classList.add('card');

        // Selected assessment
        if (assessment.id === selectedAssessmentId) {
            card.classList.add('selected');
        }

        // Card content
        const content = document.createElement('div');
        content.classList.add('card-content');

        const title = document.createElement('div');
        title.classList.add('card-title');
        title.innerText = assessment.title;

        const type = document.createElement('div');
        type.classList.add('card-type');
        type.innerText = assessment.type;

        const maxScore = document.createElement('div');
        maxScore.classList.add('card-info');
        maxScore.innerText = `Maximum score: ${assessment.maxScore}`;

        content.append(title, type, maxScore);

        // Update button
        const updateBtn = document.createElement('button');
        updateBtn.innerText = 'Update';

        updateBtn.addEventListener('click', e => {
            e.stopPropagation();
            updateAssessment(assessment.id);
        });

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Delete';

        deleteBtn.addEventListener('click', e => {
            e.stopPropagation();
            deleteAssessment(assessment.id);
        });

        // Select assessment
        card.addEventListener('click', () => {
            selectedAssessmentId = assessment.id;

            showAssessments();
            showStudents();
        });

        card.append(content, updateBtn, deleteBtn);
        assessmentsBox.appendChild(card);
    });
}


// ==================================================
// DELETE ASSESSMENT
// ==================================================

async function deleteAssessment(id) {
    if (!confirm('Delete this assessment and all its marks?')) return;

    const instructors = getData('instructors');
    const instructor = getCurrentInstructor(instructors);
    if (!instructor) return;

    instructor.assessments = (instructor.assessments || []).filter(a => a.id !== id);
    saveData('instructors', instructors);

    const students = await getStudents();

    students.forEach(student => {
        student.scores = (student.scores || []).filter(sc => sc.assessmentId !== id);
    });
    saveData('students', students);

    if (selectedAssessmentId === id) selectedAssessmentId = null;

    showAssessments();
    showStudents();
}


// ==================================================
// SHOW STUDENTS + MARKS (edit here, then Save Marks)
// ==================================================

async function showStudents() {
    if (!selectedAssessmentId) {
        studentsBox.replaceChildren();
        studentsSection.style.display = 'none';
        return;
    }

    studentsSection.style.display = 'block';

    const instructor = getCurrentInstructor(getData('instructors'));

    const assessment = (instructor?.assessments || []).find(
        a => a.id === selectedAssessmentId
    );

    if (!assessment) return;

    const forAssessment = selectedAssessmentId; // remember what we render for
    const students = await getStudents();

    // selection changed while waiting, so drop this render
    if (forAssessment !== selectedAssessmentId) return;

    const rows = [];

    students.forEach((student, index) => {

        if (student.archived) return;

        const record = (student.scores || []).find(
            score => score.assessmentId === forAssessment
        );

        if (!record) return;

        const row = document.createElement('div');
        row.classList.add('student');

        // Student information
        const info = document.createElement('div');
        info.classList.add('student-info');

        const name = document.createElement('div');
        name.classList.add('student-name');
        name.innerText = student.name || `Student ${index + 1}`;

        const id = document.createElement('div');
        id.classList.add('student-id');
        id.innerText = student.id;

        info.append(name, id);

        // Mark
        const mark = document.createElement('div');
        mark.classList.add('student-mark');

        const input = document.createElement('input');

        input.type = 'number';
        input.min = 0;
        input.max = assessment.maxScore;
        input.placeholder = '0';
        input.value = record.score ?? '';
        input.dataset.studentId = student.id;

        const max = document.createElement('span');
        max.innerText = `/ ${assessment.maxScore}`;

        mark.append(input, max);
        row.append(info, mark);

        rows.push(row);
    });

    studentsBox.replaceChildren(...rows);
}


// ==================================================
// SAVE MARKS
// ==================================================

saveMarks.addEventListener('click', async () => {
    if (!selectedAssessmentId) return;

    const instructor = getCurrentInstructor(getData('instructors'));

    const assessment = (instructor?.assessments || []).find(
        a => a.id === selectedAssessmentId
    );

    if (!assessment) return;

    const students = await getStudents();
    const inputs = studentsBox.querySelectorAll('input');

    // validate first
    for (const input of inputs) {
        if (input.value === '') continue;

        const score = Number(input.value);

        if (score < 0 || score > assessment.maxScore) {
            showMessage(`Score must be between 0 and ${assessment.maxScore}`);
            input.focus();
            return;
        }
    }

    // then save
    inputs.forEach(input => {
        const student = students.find(s => s.id === input.dataset.studentId);
        if (!student) return;

        student.scores = student.scores || [];

        let record = student.scores.find(
            sc => sc.assessmentId === selectedAssessmentId
        );

        if (!record) {
            record = { assessmentId: selectedAssessmentId, score: null };
            student.scores.push(record);
        }

        record.score = input.value === '' ? null : Number(input.value);
    });

    saveData('students', students);
    showMessage('Marks saved');
});


// ==================================================
// START
// ==================================================

studentsSection.style.display = 'none';
showCourses();
showAssessments();

// Header + sidebar behavior. Safe to include on every page.
// Wrapped in a function so its variables never clash with index.js.

(function () {

    const account = document.getElementById("account");
    const accountMenu = document.getElementById("accountMinu");
    const burgerMenu = document.getElementById("burgerMinu");
    const sideBar = document.getElementById("sideBar");


    // ---------- instructor name (from saved data, not hardcoded) ----------

    function readJSON(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    }

    function readCookie(name) {
        const match = document.cookie.split("; ").find(row => row.startsWith(name + "="));
        return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
    }

    function currentInstructor() {
        const list = readJSON("instructors");
        const username = readCookie("cur_user");
        return list.find(i => i.username === username) || list[0] || null;
    }

    // "Dr. Ahmad Ali" -> "AA", "Dr. Ahmad" -> "A"
    function getInitials(name) {
        const words = name
            .split(/\s+/)
            .filter(w => w && !/^(dr|prof|mr|mrs|ms|eng)\.?$/i.test(w));

        return words.slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
    }

    // the name shows once, in the header (falls back to the username, never a generic word)
    const instructor = currentInstructor();
    const fullName = (instructor && instructor.name ? instructor.name.trim() : "")
        || (instructor && instructor.username) || "";

    const nameEl = document.getElementById("name");
    const logoEl = document.getElementById("logo");

    if (nameEl) nameEl.textContent = fullName;
    if (logoEl) logoEl.textContent = fullName ? getInitials(fullName) : "";


    // ---------- account menu ----------

    if (account && accountMenu) {
        account.addEventListener("click", e => {
            e.stopPropagation();
            accountMenu.classList.toggle("activeAccount");
        });
    }


    // ---------- burger menu / sidebar (small screens) ----------

    if (burgerMenu && sideBar) {
        burgerMenu.addEventListener("click", e => {
            e.stopPropagation();
            sideBar.classList.toggle("activeSide");
        });

        // clicks inside the sidebar should not close it
        sideBar.addEventListener("click", e => e.stopPropagation());
    }


    // ---------- close things when clicking outside or pressing Escape ----------

    function closeMenus() {
        if (accountMenu) accountMenu.classList.remove("activeAccount");
        if (sideBar) sideBar.classList.remove("activeSide");
    }

    document.addEventListener("click", closeMenus);

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeMenus();
    });


    // ---------- highlight the current page in the sidebar ----------

    const currentPage = location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".liLinks a").forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.parentElement.classList.add("active");
        }
    });

})();