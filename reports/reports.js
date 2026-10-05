'use strict';
import { fetchApi } from "../Api/fetch.js";
import { Cookie } from "../cookies/cookies.js";
// ---------- helpers ----------
const $ = id => document.getElementById(id);
const load = key => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const same = (a, b) => String(a) === String(b);
const lower = text => String(text).trim().toLowerCase();
const round1 = n => Math.round(n * 10) / 10;
const percentText = n => (n === null ? '-' : n.toFixed(1) + '%');

function getInitials(name) {
    const words = String(name).split(/\s+/).filter(w => w && !/^(dr|prof|mr|mrs|ms|eng)\.?$/i.test(w));
    return words.slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

function showMessage(text) {
    $('reportMessage').textContent = text;
    $('reportMessage').style.display = text ? 'block' : 'none';
}

function hideReport(text) {
    $('reportContent').style.display = 'none';
    showMessage(text);
}

// ---------- settings ----------
const PASS_MARK = 60;

const GRADES = [
    { letter: 'A', min: 90, label: 'A (90-100)',   color: '#10b981' },
    { letter: 'B', min: 80, label: 'B (80-89)',    color: '#6366f1' },
    { letter: 'C', min: 70, label: 'C (70-79)',    color: '#8b5cf6' },
    { letter: 'D', min: 60, label: 'D (60-69)',    color: '#f59e0b' },
    { letter: 'F', min: 0,  label: 'F (below 60)', color: '#f43f5e' }
];

const gradeIndex = percent => GRADES.findIndex(g => percent >= g.min);

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
const allowed = !!(currentUser && userId && me);

if (!allowed) location.href = '../auth/login.html';

// ---------- data ----------
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
    }
    return students;
}

// returns a function: (student, assessmentId) -> mark or null
// looks in lms_scores first (ids like stu_001, ST001 or 20260001), then in student.scores
function makeScorer() {
    const scores = load('lms_scores');

    return (student, assessmentId) => {
        const ids = [student.id, student.studentId, String(student.id).replace('stu_', 'ST')];

        const record = scores.find(s =>
            same(s.assessmentId, assessmentId) && ids.some(id => same(id, s.studentId)));

        if (record) return record.score;

        const own = (student.scores || []).find(s => same(s.assessmentId, assessmentId));
        return own ? own.score : null;
    };
}

const isGraded = score => score !== null && score !== undefined;

// one row per student: total earned / total possible over the graded assessments
function buildRows(assessments, students, getScore) {
    return students.map(student => {
        let earned = 0, possible = 0, graded = 0;

        assessments.forEach(assessment => {
            const score = getScore(student, assessment.id);
            if (!isGraded(score)) return;

            earned += Number(score);
            possible += Number(assessment.maxScore);
            graded++;
        });

        return {
            student, earned, possible, graded,
            total: assessments.length,
            percent: possible ? round1((earned / possible) * 100) : null
        };
    });
}

// class average of each assessment, as a % of its maximum
function assessmentAverages(assessments, students, getScore) {
    return assessments.map(assessment => {
        const marks = students
            .map(student => getScore(student, assessment.id))
            .filter(isGraded)
            .map(score => (Number(score) / Number(assessment.maxScore)) * 100);

        return marks.length ? round1(marks.reduce((a, b) => a + b, 0) / marks.length) : null;
    });
}

// ---------- show ----------
const charts = {};

function drawChart(key, canvasId, labels, data, colors, options = {}) {
    if (charts[key]) charts[key].destroy();

    charts[key] = new Chart($(canvasId), {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 6 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ...options } }
        }
    });
}

function showSummary(rows) {
    const percents = rows.filter(r => r.percent !== null).map(r => r.percent);
    const set = (id, text) => ($(id).textContent = text);

    set('sumStudents', rows.length);

    if (!percents.length) {
        ['sumAverage', 'sumHighest', 'sumLowest', 'sumPass'].forEach(id => set(id, '-'));
        return;
    }

    const average = percents.reduce((a, b) => a + b, 0) / percents.length;
    const passed = percents.filter(p => p >= PASS_MARK).length;

    set('sumAverage', percentText(average));
    set('sumHighest', percentText(Math.max(...percents)));
    set('sumLowest', percentText(Math.min(...percents)));
    set('sumPass', Math.round((passed / percents.length) * 100) + '%');
}

function showCharts(rows, assessments, students, getScore) {
    const counts = GRADES.map(() => 0);
    rows.forEach(row => { if (row.percent !== null) counts[gradeIndex(row.percent)]++; });

    drawChart('distribution', 'distributionChart',
        GRADES.map(g => g.label), counts, GRADES.map(g => g.color), { ticks: { precision: 0 } });

    drawChart('assessment', 'assessmentChart',
        assessments.map(a => a.name), assessmentAverages(assessments, students, getScore), '#6366f1', { max: 100 });
}

function cell(text, className) {
    const td = document.createElement('td');
    td.textContent = text;
    if (className) td.className = className;
    return td;
}

function showTable(rows) {
    // best first, students with no grades at the end
    const sorted = [...rows].sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));

    $('reportRows').replaceChildren(...sorted.map(row => {
        const tr = document.createElement('tr');

        tr.append(
            cell(row.student.name || 'Student'),
            cell(row.student.studentId ?? row.student.id, 'muted'),
            cell(`${row.graded} / ${row.total}`, 'muted')
        );

        if (row.percent === null) {
            tr.append(cell('No grades yet', 'muted'), cell('-', 'muted'), cell('-', 'muted'));
            return tr;
        }

        const letter = GRADES[gradeIndex(row.percent)].letter;
        const pill = document.createElement('span');
        pill.className = `grade-pill grade-${letter}`;
        pill.textContent = letter;

        const gradeCell = document.createElement('td');
        gradeCell.append(pill);

        tr.append(cell(`${row.earned} / ${row.possible}`), cell(percentText(row.percent)), gradeCell);
        return tr;
    }));
}

async function showReport() {
    const course = load('courses').find(c => me && same(c.instructorId, me.id) && c.name === $('courseSelect').value);
    if (!course) return;

    const assessments = load('lms_assessments').filter(a => same(a.courseId, course.id) && same(a.instructorId, me.id));

    if (!assessments.length) return hideReport('This course has no assessments yet.');

    // only students enrolled in this course (archived students are skipped)
    const students = (await getStudents()).filter(s =>
        !s.archived && (s.courses || []).some(id => same(id, course.id)));

    if (!students.length) return hideReport('No students found in this course.');

    showMessage('');
    $('reportContent').style.display = 'block';

    const getScore = makeScorer();
    const rows = buildRows(assessments, students, getScore);

    showSummary(rows);
    showCharts(rows, assessments, students, getScore);
    showTable(rows);
}

// ---------- start ----------
function start() {
    if (!me) return hideReport('Account not found, please log in again');
    if (typeof Chart === 'undefined') return hideReport('Chart.js is not loaded.');

    const courses = load('courses').filter(c => same(c.instructorId, me.id));

    if (!courses.length) return hideReport('No courses found.');

    $('courseSelect').replaceChildren(...courses.map(course => new Option(course.name, course.name)));
    $('courseSelect').addEventListener('change', showReport);

    showReport();
}

if (allowed) start();
