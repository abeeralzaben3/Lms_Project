// ---------- elements ----------

const courseSelect = document.getElementById('courseSelect');
const reportMessage = document.getElementById('reportMessage');
const reportContent = document.getElementById('reportContent');
const reportRows = document.getElementById('reportRows');

const sumStudents = document.getElementById('sumStudents');
const sumAverage = document.getElementById('sumAverage');
const sumHighest = document.getElementById('sumHighest');
const sumLowest = document.getElementById('sumLowest');
const sumPass = document.getElementById('sumPass');


// ---------- settings ----------

const PASS_MARK = 60; // percentage needed to pass

// highest grade first: a percentage gets the first letter it reaches
const GRADES = [
    { letter: 'A', min: 90, label: 'A (90-100)', color: '#10b981' },
    { letter: 'B', min: 80, label: 'B (80-89)',  color: '#6366f1' },
    { letter: 'C', min: 70, label: 'C (70-79)',  color: '#8b5cf6' },
    { letter: 'D', min: 60, label: 'D (60-69)',  color: '#f59e0b' },
    { letter: 'F', min: 0,  label: 'F (below 60)', color: '#f43f5e' }
];


// ---------- helpers ----------

const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const saveData = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function getCookie(name) {
    const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// only a logged-in instructor can open this page
const loggedIn = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
const allowed = getCookie('currentUser') && loggedIn && loggedIn.role === 'instructor';

if (!allowed) {
    location.href = '../auth/login.html';
}

function getCurrentInstructor(instructors) {
    const email = (getCookie('currentUser') || '').toLowerCase();

    let found = instructors.find(i => i.email && i.email.toLowerCase() === email);

    // accounts registered before the fix are in "users": move them into "instructors"
    if (!found) {
        const old = getData('users').find(u => u.email && u.email.toLowerCase() === email);
        if (old) {
            found = { ...old, role: 'instructor' };
            instructors.push(found);
            saveData('instructors', instructors);
        }
    }

    return found;
}

// courses = saved course list + any course already used by an assessment
function getCourses(instructor) {
    const fromList = instructor.courses || [];
    const fromAssessments = (instructor.assessments || []).map(a => a.course);
    return [...new Set([...fromList, ...fromAssessments])];
}

async function getStudents() {
    let students = getData('students');

    if (!students.length) {
        try {
            const response = await fetch('http://localhost:3000/students');
            if (!response.ok) throw new Error('Failed to fetch students');

            students = await response.json();
            saveData('students', students);
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    return students;
}

function isGraded(score) {
    return score !== null && score !== undefined;
}

function round1(n) {
    return Math.round(n * 10) / 10;
}

function formatPercent(n) {
    return n === null ? '-' : n.toFixed(1) + '%';
}

function letterFor(percent) {
    return GRADES.find(g => percent >= g.min).letter;
}

function showMessage(text) {
    reportMessage.textContent = text;
    reportMessage.style.display = text ? 'block' : 'none';
}


// ==================================================
// CALCULATE (totals are computed automatically from the saved marks)
// ==================================================

// one row per student: total earned / total possible over the GRADED assessments
function buildRows(assessments, students) {
    const rows = [];

    students.forEach(student => {
        if (student.archived) return;

        let earned = 0;
        let possible = 0;
        let graded = 0;

        assessments.forEach(assessment => {
            const record = (student.scores || []).find(
                s => s.assessmentId === assessment.id
            );

            if (record && isGraded(record.score)) {
                earned += record.score;
                possible += assessment.maxScore;
                graded++;
            }
        });

        rows.push({
            student,
            earned,
            possible,
            graded,
            total: assessments.length,
            percent: possible ? round1((earned / possible) * 100) : null
        });
    });

    return rows;
}

// average mark of the class for each assessment, as a % of its maximum
function assessmentAverages(assessments, students) {
    return assessments.map(assessment => {
        const marks = [];

        students.forEach(student => {
            if (student.archived) return;

            const record = (student.scores || []).find(
                s => s.assessmentId === assessment.id
            );

            if (record && isGraded(record.score)) {
                marks.push((record.score / assessment.maxScore) * 100);
            }
        });

        return {
            title: assessment.title,
            average: marks.length
                ? round1(marks.reduce((a, b) => a + b, 0) / marks.length)
                : null
        };
    });
}


// ==================================================
// SHOW
// ==================================================

let distributionChart = null;
let assessmentChart = null;

function drawChart(oldChart, canvasId, config) {
    if (oldChart) oldChart.destroy();
    return new Chart(document.getElementById(canvasId), config);
}

function showSummary(rows) {
    const graded = rows.filter(r => r.percent !== null);
    const percents = graded.map(r => r.percent);

    sumStudents.textContent = rows.length;

    if (!percents.length) {
        sumAverage.textContent = '-';
        sumHighest.textContent = '-';
        sumLowest.textContent = '-';
        sumPass.textContent = '-';
        return;
    }

    const average = percents.reduce((a, b) => a + b, 0) / percents.length;
    const passed = percents.filter(p => p >= PASS_MARK).length;

    sumAverage.textContent = formatPercent(average);
    sumHighest.textContent = formatPercent(Math.max(...percents));
    sumLowest.textContent = formatPercent(Math.min(...percents));
    sumPass.textContent = Math.round((passed / percents.length) * 100) + '%';
}

function showDistributionChart(rows) {
    const counts = GRADES.map(() => 0);

    rows.forEach(row => {
        if (row.percent === null) return;
        const index = GRADES.findIndex(g => row.percent >= g.min);
        counts[index]++;
    });

    distributionChart = drawChart(distributionChart, 'distributionChart', {
        type: 'bar',
        data: {
            labels: GRADES.map(g => g.label),
            datasets: [{
                label: 'Students',
                data: counts,
                backgroundColor: GRADES.map(g => g.color),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

function showAssessmentChart(assessments, students) {
    const data = assessmentAverages(assessments, students);

    assessmentChart = drawChart(assessmentChart, 'assessmentChart', {
        type: 'bar',
        data: {
            labels: data.map(d => d.title),
            datasets: [{
                label: 'Average %',
                data: data.map(d => d.average),
                backgroundColor: '#6366f1',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

function cell(text, className) {
    const td = document.createElement('td');
    td.textContent = text;
    if (className) td.className = className;
    return td;
}

function showTable(rows) {
    // best students first, students with no grades at the end
    const sorted = [...rows].sort((a, b) => {
        if (a.percent === null && b.percent === null) return 0;
        if (a.percent === null) return 1;
        if (b.percent === null) return -1;
        return b.percent - a.percent;
    });

    const trs = sorted.map(row => {
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

        tr.append(cell(`${row.earned} / ${row.possible}`), cell(formatPercent(row.percent)));

        const letter = letterFor(row.percent);
        const pill = document.createElement('span');
        pill.className = `grade-pill grade-${letter}`;
        pill.textContent = letter;

        const gradeCell = document.createElement('td');
        gradeCell.append(pill);
        tr.append(gradeCell);

        return tr;
    });

    reportRows.replaceChildren(...trs);
}

async function showReport() {
    const instructor = getCurrentInstructor(getData('instructors'));
    if (!instructor) return;

    const course = courseSelect.value;

    const assessments = (instructor.assessments || []).filter(a => a.course === course);

    if (!assessments.length) {
        reportContent.style.display = 'none';
        showMessage('This course has no assessments yet. Add some on the Assessments page.');
        return;
    }

    const students = await getStudents();

    if (!students.length) {
        reportContent.style.display = 'none';
        showMessage('Could not load students (is json-server running?)');
        return;
    }

    showMessage('');
    reportContent.style.display = 'block';

    const rows = buildRows(assessments, students);

    showSummary(rows);
    showDistributionChart(rows);
    showAssessmentChart(assessments, students);
    showTable(rows);
}


// ==================================================
// START
// ==================================================

function start() {
    const instructor = getCurrentInstructor(getData('instructors'));

    if (!instructor) {
        reportContent.style.display = 'none';
        showMessage('Account not found, please log in again');
        return;
    }

    if (typeof Chart === 'undefined') {
        reportContent.style.display = 'none';
        showMessage('Charts could not load. Check your internet connection.');
        return;
    }

    const courses = getCourses(instructor);

    if (!courses.length) {
        reportContent.style.display = 'none';
        showMessage('No courses yet. Add a course on the Assessments page first.');
        return;
    }

    courses.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        courseSelect.append(option);
    });

    courseSelect.addEventListener('change', showReport);

    showReport();
}

if (allowed) start();


// ==================================================
// HEADER + SIDEBAR
// ==================================================

(function () {
    const account = document.getElementById('account');
    const accountMenu = document.getElementById('accountMinu');
    const burgerMenu = document.getElementById('burgerMinu');
    const sideBar = document.getElementById('sideBar');
    const logoutBtn = document.getElementById('logoutBtn');

    // "Dr. Ahmad Ali" -> "AA"
    function getInitials(name) {
        const words = name
            .split(/\s+/)
            .filter(w => w && !/^(dr|prof|mr|mrs|ms|eng)\.?$/i.test(w));

        return words.slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
    }

    const email = (getCookie('currentUser') || '').toLowerCase();
    const instructor = getData('instructors').find(i => i.email && i.email.toLowerCase() === email) || loggedIn;

    const fullName = ((instructor && (instructor.fullName || instructor.name)) || '').trim()
        || (instructor && instructor.email) || '';

    const nameEl = document.getElementById('name');
    const logoEl = document.getElementById('logo');

    if (nameEl) nameEl.textContent = fullName;
    if (logoEl) logoEl.textContent = fullName ? getInitials(fullName) : '';

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            document.cookie = 'currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            localStorage.removeItem('loggedInUser');
            location.href = '../auth/login.html';
        });
    }

    if (account && accountMenu) {
        account.addEventListener('click', e => {
            e.stopPropagation();
            accountMenu.classList.toggle('activeAccount');
        });
    }

    if (burgerMenu && sideBar) {
        burgerMenu.addEventListener('click', e => {
            e.stopPropagation();
            sideBar.classList.toggle('activeSide');
        });

        sideBar.addEventListener('click', e => e.stopPropagation());
    }

    function closeMenus() {
        if (accountMenu) accountMenu.classList.remove('activeAccount');
        if (sideBar) sideBar.classList.remove('activeSide');
    }

    document.addEventListener('click', closeMenus);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMenus();
    });

    const currentPage = location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.liLinks a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.parentElement.classList.add('active');
        }
    });
})();