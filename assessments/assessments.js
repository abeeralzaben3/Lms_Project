'use strict';

import { Cookie } from "../cookies/cookies.js";

// ---------- helpers ----------
const $ = id => document.getElementById(id);
const load = key => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const same = (a, b) => String(a) === String(b);
const lower = text => String(text).trim().toLowerCase();

function showMessage(text) {
    const popup = $('messagePopup');
    if (!popup) return console.log(text);
    popup.innerText = text;
    popup.style.display = 'block';
    setTimeout(() => (popup.style.display = 'none'), 2000);
}

// next id like COURSE004 / AS003
function nextId(prefix, list) {
    const numbers = list.map(item => String(item.id).match(new RegExp(`^${prefix}(\\d+)$`))).filter(Boolean).map(m => +m[1]);
    return prefix + String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(3, '0');
}

async function getStudents() {
    let students = load('students');
    if (students.length) return students;

    try {
        const response = await fetch('http://localhost:3000/students');
        if (!response.ok) throw new Error('Failed to fetch students');
        students = await response.json();
        save('students', students);
    } catch (error) {
        console.error(error);
        showMessage('Could not load students');
    }
    return students;
}

const showModal = modal => (modal.style.display = 'flex');
const hideModal = modal => (modal.style.display = 'none');


// ---------- login check + current instructor (cookies only) ----------
const userCookie = new Cookie();
const currentUser = userCookie.getCookie("currentUser");
const userEmail = userCookie.getCookie("userEmail");
const userId = userCookie.getCookie("userId");

const instructors = load('instructors');
const me = instructors.find(i => same(i.id, userId))
    || instructors.find(i => i.email && lower(i.email) === lower(userEmail || ''))
    || null;

// not logged in, or the cookie user isn't an instructor
// (use the same login path as LINKS.login in layout.js)
if (!currentUser || !userId || !me) {
    window.location.href = '../login/login.html';
}

// ---------- state + data getters ----------
let selectedCourseId = null;
let selectedAssessmentId = null;
let editingCourseId = null;
let editingAssessmentId = null;

const myCourses = () => load('courses').filter(c => me && same(c.instructorId, me.id));
const myAssessments = () => load('lms_assessments').filter(a => me && same(a.instructorId, me.id));
const findAssessment = id => load('lms_assessments').find(a => same(a.id, id));
const courseExists = (name, exceptId) => myCourses().some(c => lower(c.name) === lower(name) && !same(c.id, exceptId));
const assessmentExists = (courseId, name, exceptId) =>
    myAssessments().some(a => same(a.courseId, courseId) && lower(a.name) === lower(name) && !same(a.id, exceptId));

function refresh() {
    showCourses();
    showAssessments();
    showStudents();
}


// ==================================================
// COURSES
// ==================================================
$('addCourse').addEventListener('click', () => { $('courseForm').reset(); showModal($('courseModal')); });
$('closeCourseModal').addEventListener('click', () => hideModal($('courseModal')));

$('courseForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('courseName').value.trim();

    if (!name) return showMessage('Course name is required');
    if (!me) return showMessage('Instructor not found');
    if (courseExists(name)) return showMessage('This course already exists');

    const courses = load('courses');
    const course = { id: nextId('COURSE', courses), name, instructorId: me.id, studentsCount: 0 };
    courses.push(course);
    save('courses', courses);

    selectedCourseId = course.id;
    selectedAssessmentId = null;
    hideModal($('courseModal'));
    refresh();
    showMessage('Course added');
});

function updateCourse(id) {
    const course = load('courses').find(c => same(c.id, id));
    if (!course) return;
    editingCourseId = id;
    $('editCourseName').value = course.name;
    showModal($('editCourseModal'));
}

$('closeEditCourseModal').addEventListener('click', () => hideModal($('editCourseModal')));

$('editCourseForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('editCourseName').value.trim();

    if (!editingCourseId) return;
    if (!name) return showMessage('Course name is required');
    if (courseExists(name, editingCourseId)) return showMessage('This course already exists');

    const courses = load('courses');
    const course = courses.find(c => same(c.id, editingCourseId));
    if (!course) return;

    course.name = name;
    save('courses', courses);
    hideModal($('editCourseModal'));
    refresh();
    showMessage('Course updated');
});

async function deleteCourse(id) {
    const course = load('courses').find(c => same(c.id, id));
    if (!course || !confirm(`Delete "${course.name}" and all its assessments?`)) return;

    const removed = load('lms_assessments').filter(a => same(a.courseId, id)).map(a => a.id);

    save('courses', load('courses').filter(c => !same(c.id, id)));
    save('lms_assessments', load('lms_assessments').filter(a => !same(a.courseId, id)));
    await removeScores(removed);

    if (same(selectedCourseId, id)) selectedCourseId = selectedAssessmentId = null;
    refresh();
    showMessage('Course deleted');
}

// removes marks of the given assessment ids (lms_scores and student.scores)
async function removeScores(ids) {
    const isRemoved = score => ids.some(id => same(id, score.assessmentId));

    save('lms_scores', load('lms_scores').filter(s => !isRemoved(s)));

    const students = await getStudents();
    students.forEach(s => { s.scores = (s.scores || []).filter(score => !isRemoved(score)); });
    save('students', students);
}


// ==================================================
// ASSESSMENTS
// ==================================================
$('addAssessment').addEventListener('click', () => {
    if (!selectedCourseId) return showMessage('Please select a course first');
    $('assessmentForm').reset();
    showModal($('assessmentModal'));
});

$('closeModal').addEventListener('click', () => hideModal($('assessmentModal')));

$('assessmentForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!selectedCourseId) return showMessage('Please select a course first');

    const name = $('assessmentName').value.trim();
    const type = $('type').value || 'assignment';
    const maxScore = Number($('maxScore').value);

    if (!name) return showMessage('Assessment name is required');
    if (!maxScore || maxScore <= 0) return showMessage('Maximum score must be greater than 0');
    if (assessmentExists(selectedCourseId, name)) return showMessage('This assessment already exists');

    const assessments = load('lms_assessments');
    const assessment = { id: nextId('AS', assessments), courseId: selectedCourseId, instructorId: me.id, name, type, maxScore };
    assessments.push(assessment);
    save('lms_assessments', assessments);

    // an empty mark for every student in this course
    const students = await getStudents();
    const scores = load('lms_scores');
    students
        .filter(s => (s.courses || []).some(id => same(id, selectedCourseId)))
        .forEach(s => scores.push({ studentId: s.id, assessmentId: assessment.id, score: null }));
    save('lms_scores', scores);

    selectedAssessmentId = assessment.id;
    hideModal($('assessmentModal'));
    showAssessments();
    showStudents();
    showMessage('Assessment added');
});

function updateAssessment(id) {
    const assessment = findAssessment(id);
    if (!assessment) return;

    editingAssessmentId = id;
    $('editAssessmentName').value = assessment.name;
    $('editAssessmentType').value = assessment.type;
    $('editAssessmentMaxScore').value = assessment.maxScore;
    showModal($('editAssessmentModal'));
}

$('closeEditAssessmentModal').addEventListener('click', () => hideModal($('editAssessmentModal')));

$('editAssessmentForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!editingAssessmentId) return;

    const name = $('editAssessmentName').value.trim();
    const type = $('editAssessmentType').value || 'assignment';
    const maxScore = Number($('editAssessmentMaxScore').value);

    if (!name) return showMessage('Assessment name is required');
    if (!maxScore || maxScore <= 0) return showMessage('Maximum score must be greater than 0');
    if (assessmentExists(selectedCourseId, name, editingAssessmentId)) return showMessage('This assessment already exists');

    const tooHigh = load('lms_scores').some(s =>
        same(s.assessmentId, editingAssessmentId) && s.score !== null && Number(s.score) > maxScore);
    if (tooHigh) return showMessage('Some students already have marks above this maximum');

    const assessments = load('lms_assessments');
    const assessment = assessments.find(a => same(a.id, editingAssessmentId));
    if (!assessment) return;

    Object.assign(assessment, { name, type, maxScore });
    save('lms_assessments', assessments);

    hideModal($('editAssessmentModal'));
    showAssessments();
    showStudents();
    showMessage('Assessment updated');
});

async function deleteAssessment(id) {
    const assessment = findAssessment(id);
    if (!assessment || !confirm(`Delete "${assessment.name}" and all its marks?`)) return;

    save('lms_assessments', load('lms_assessments').filter(a => !same(a.id, id)));
    await removeScores([id]);

    if (same(selectedAssessmentId, id)) selectedAssessmentId = null;
    showAssessments();
    showStudents();
    showMessage('Assessment deleted');
}


// ==================================================
// SHOW COURSES / ASSESSMENTS
// ==================================================
// one card with a title, optional type badge, info line, Update and Delete
function makeCard({ title, type, info, selected, onSelect, onUpdate, onDelete }) {
    const card = document.createElement('div');
    card.className = 'card' + (selected ? ' selected' : '');

    const content = document.createElement('div');
    content.className = 'card-content';

    [['card-title', title], ['card-type', type], ['card-info', info]].forEach(([className, text]) => {
        if (!text) return;
        const line = document.createElement('div');
        line.className = className;
        line.innerText = text;
        content.append(line);
    });

    const button = (label, action) => {
        const b = document.createElement('button');
        b.innerText = label;
        b.addEventListener('click', event => { event.stopPropagation(); action(); });
        return b;
    };

    card.addEventListener('click', onSelect);
    card.append(content, button('Update', onUpdate), button('Delete', onDelete));
    return card;
}

function showCourses() {
    const courses = myCourses();

    if (!courses.length) {
        $('courses').innerHTML = '<p>No courses found.</p>';
        return;
    }

    $('courses').replaceChildren(...courses.map(course => makeCard({
        title: course.name,
        info: `${course.studentsCount ?? 0} students`,
        selected: same(course.id, selectedCourseId),
        onSelect: () => { selectedCourseId = course.id; selectedAssessmentId = null; refresh(); },
        onUpdate: () => updateCourse(course.id),
        onDelete: () => deleteCourse(course.id)
    })));
}

function showAssessments() {
    if (!selectedCourseId) {
        $('assessments').innerHTML = '<p>Select a course to see assessments.</p>';
        return;
    }

    const list = myAssessments().filter(a => same(a.courseId, selectedCourseId));

    if (!list.length) {
        $('assessments').innerHTML = '<p>No assessments for this course.</p>';
        return;
    }

    $('assessments').replaceChildren(...list.map(assessment => makeCard({
        title: assessment.name,
        type: assessment.type,
        info: `Maximum score: ${assessment.maxScore}`,
        selected: same(assessment.id, selectedAssessmentId),
        onSelect: () => { selectedAssessmentId = assessment.id; showAssessments(); showStudents(); },
        onUpdate: () => updateAssessment(assessment.id),
        onDelete: () => deleteAssessment(assessment.id)
    })));
}


// ==================================================
// STUDENTS + MARKS
// ==================================================
async function showStudents() {
    const box = $('students');
    const section = $('studentsSection');

    const assessment = selectedAssessmentId && findAssessment(selectedAssessmentId);

    if (!assessment) {
        box.replaceChildren();
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    const students = (await getStudents()).filter(s =>
        !s.archived && (s.courses || []).some(id => same(id, assessment.courseId)));

    if (!students.length) {
        box.innerHTML = '<p>No students found.</p>';
        return;
    }

    const scores = load('lms_scores');

    box.replaceChildren(...students.map((student, index) => {
        const record = scores.find(s => same(s.studentId, student.id) && same(s.assessmentId, assessment.id));
        const row = document.createElement('div');
        row.className = 'student';

        row.innerHTML = `
            <div class="student-info">
                <div class="student-name"></div>
                <div class="student-id"></div>
            </div>
            <div class="student-mark">
                <input type="number" min="0" placeholder="0">
                <span>/ ${assessment.maxScore}</span>
            </div>`;

        row.querySelector('.student-name').innerText = student.name || `Student ${index + 1}`;
        row.querySelector('.student-id').innerText = student.studentId || student.id;

        const input = row.querySelector('input');
        input.max = assessment.maxScore;
        input.dataset.studentId = student.id;
        input.value = record && record.score != null ? record.score : '';

        return row;
    }));
}

$('saveMarks').addEventListener('click', async () => {
    const assessment = selectedAssessmentId && findAssessment(selectedAssessmentId);
    if (!assessment) return showMessage('Please select an assessment');

    const inputs = [...$('students').querySelectorAll('input')];

    for (const input of inputs) {
        const score = Number(input.value);
        if (input.value !== '' && (score < 0 || score > assessment.maxScore)) {
            showMessage(`Score must be between 0 and ${assessment.maxScore}`);
            input.focus();
            return;
        }
    }

    const students = await getStudents();
    const scores = load('lms_scores');

    // finds a mark record in a list, or creates it
    const getRecord = (list, match, create) => {
        let record = list.find(match);
        if (!record) list.push((record = create));
        return record;
    };

    inputs.forEach(input => {
        const id = input.dataset.studentId;
        const value = input.value === '' ? null : Number(input.value);

        getRecord(scores,
            s => same(s.studentId, id) && same(s.assessmentId, assessment.id),
            { studentId: id, assessmentId: assessment.id, score: null }
        ).score = value;

        const student = students.find(s => same(s.id, id));
        if (!student) return;

        student.scores = student.scores || [];
        getRecord(student.scores,
            s => same(s.assessmentId, assessment.id),
            { assessmentId: assessment.id, score: null }
        ).score = value;
    });

    save('lms_scores', scores);
    save('students', students);
    showMessage('Marks saved');
});


// ==================================================
// START
// ==================================================
$('studentsSection').style.display = 'none';
refresh();