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
const PASS_MARK = 60;

const GRADES = [
    { letter: 'A', min: 90, label: 'A (90-100)', color: '#10b981' },
    { letter: 'B', min: 80, label: 'B (80-89)', color: '#6366f1' },
    { letter: 'C', min: 70, label: 'C (70-79)', color: '#8b5cf6' },
    { letter: 'D', min: 60, label: 'D (60-69)', color: '#f59e0b' },
    { letter: 'F', min: 0, label: 'F (below 60)', color: '#f43f5e' }
];

// ---------- helpers ----------
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

function getCookie(name) {
    const match = document.cookie.split('; ')
        .find(row => row.startsWith(name + '='));

    return match
        ? decodeURIComponent(match.slice(name.length + 1))
        : null;
}

// ---------- login ----------
const loggedIn = JSON.parse(
    localStorage.getItem('loggedInUser') || 'null'
);

const allowed =
    getCookie('currentUser') &&
    loggedIn &&
    loggedIn.role === 'instructor';

if (!allowed) {
    location.href = '../auth/login.html';
}

function getCurrentInstructor(instructors) {
    const email = (getCookie('currentUser') || '').toLowerCase();

    return instructors.find(
        instructor =>
            instructor.email &&
            instructor.email.toLowerCase() === email
    );
}

// ---------- courses ----------
function getCourses(instructor) {
    return getData('courses').filter(
        course => course.instructorId === instructor.id
    );
}

// ---------- students ----------
async function getStudents() {
    let students = getData('students');

    if (!students.length) {
        try {
            const response = await fetch(
                'http://localhost:3000/students'
            );

            if (!response.ok) {
                throw new Error('Failed to fetch students');
            }

            students = await response.json();
            saveData('students', students);
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    const scores = getData('lms_scores');

    return students.map(student => ({
        ...student,

        scores: scores
            .filter(score => {
                const studentId =
                    student.id?.replace('stu_', 'ST');

                return score.studentId === studentId;
            })
            .map(score => ({
                assessmentId: score.assessmentId,
                score: score.score
            }))
    }));
}

// ---------- calculation ----------
function isGraded(score) {
    return score !== null && score !== undefined;
}

function round1(number) {
    return Math.round(number * 10) / 10;
}

function formatPercent(number) {
    return number === null ? '-' : number.toFixed(1) + '%';
}

function letterFor(percent) {
    return GRADES.find(
        grade => percent >= grade.min
    ).letter;
}

function showMessage(text) {
    reportMessage.textContent = text;
    reportMessage.style.display = text ? 'block' : 'none';
}

function buildRows(assessments, students) {
    const rows = [];

    students.forEach(student => {
        if (student.archived) return;

        let earned = 0;
        let possible = 0;
        let graded = 0;

        assessments.forEach(assessment => {
            const record = (student.scores || []).find(
                score =>
                    score.assessmentId === assessment.id
            );

            if (record && isGraded(record.score)) {
                earned += Number(record.score);
                possible += Number(assessment.maxScore);
                graded++;
            }
        });

        rows.push({
            student,
            earned,
            possible,
            graded,
            total: assessments.length,
            percent: possible
                ? round1((earned / possible) * 100)
                : null
        });
    });

    return rows;
}

function assessmentAverages(assessments, students) {
    return assessments.map(assessment => {
        const marks = [];

        students.forEach(student => {
            const record = (student.scores || []).find(
                score =>
                    score.assessmentId === assessment.id
            );

            if (record && isGraded(record.score)) {
                marks.push(
                    (Number(record.score) /
                        Number(assessment.maxScore)) * 100
                );
            }
        });

        return {
            title: assessment.title,
            average: marks.length
                ? round1(
                    marks.reduce((a, b) => a + b, 0) /
                    marks.length
                )
                : 0
        };
    });
}

// ---------- charts ----------
let distributionChart = null;
let assessmentChart = null;

function drawChart(oldChart, canvasId, config) {
    if (oldChart) {
        oldChart.destroy();
    }

    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        console.error(`Canvas not found: ${canvasId}`);
        return null;
    }

    return new Chart(canvas, config);
}

function showSummary(rows) {
    const percents = rows
        .filter(row => row.percent !== null)
        .map(row => row.percent);

    sumStudents.textContent = rows.length;

    if (!percents.length) {
        sumAverage.textContent = '-';
        sumHighest.textContent = '-';
        sumLowest.textContent = '-';
        sumPass.textContent = '-';
        return;
    }

    const average =
        percents.reduce((a, b) => a + b, 0) /
        percents.length;

    const passed =
        percents.filter(p => p >= PASS_MARK).length;

    sumAverage.textContent = formatPercent(average);
    sumHighest.textContent =
        formatPercent(Math.max(...percents));
    sumLowest.textContent =
        formatPercent(Math.min(...percents));

    sumPass.textContent =
        Math.round(
            (passed / percents.length) * 100
        ) + '%';
}

function showDistributionChart(rows) {
    const counts = GRADES.map(() => 0);

    rows.forEach(row => {
        if (row.percent === null) return;

        const index = GRADES.findIndex(
            grade => row.percent >= grade.min
        );

        if (index !== -1) {
            counts[index]++;
        }
    });

    distributionChart = drawChart(
        distributionChart,
        'distributionChart',
        {
            type: 'bar',

            data: {
                labels: GRADES.map(
                    grade => grade.label
                ),

                datasets: [{
                    label: 'Students',
                    data: counts,
                    backgroundColor: GRADES.map(
                        grade => grade.color
                    ),
                    borderRadius: 6
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

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

function showAssessmentChart(assessments, students) {
    const data = assessmentAverages(
        assessments,
        students
    );

    assessmentChart = drawChart(
        assessmentChart,
        'assessmentChart',
        {
            type: 'bar',

            data: {
                labels: data.map(
                    item => item.title
                ),

                datasets: [{
                    label: 'Average %',

                    data: data.map(
                        item => item.average
                    ),

                    backgroundColor: '#6366f1',
                    borderRadius: 6
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

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

// ---------- table ----------
function cell(text, className) {
    const td = document.createElement('td');

    td.textContent = text;

    if (className) {
        td.className = className;
    }

    return td;
}

function showTable(rows) {
    const sorted = [...rows].sort((a, b) => {
        if (
            a.percent === null &&
            b.percent === null
        ) return 0;

        if (a.percent === null) return 1;
        if (b.percent === null) return -1;

        return b.percent - a.percent;
    });

    const trs = sorted.map(row => {
        const tr = document.createElement('tr');

        tr.append(
            cell(
                row.student.name || 'Student'
            ),

            cell(
                row.student.studentId ??
                row.student.id,
                'muted'
            ),

            cell(
                `${row.graded} / ${row.total}`,
                'muted'
            )
        );

        if (row.percent === null) {
            tr.append(
                cell('No grades yet', 'muted'),
                cell('-', 'muted'),
                cell('-', 'muted')
            );

            return tr;
        }

        tr.append(
            cell(
                `${row.earned} / ${row.possible}`
            ),

            cell(
                formatPercent(row.percent)
            )
        );

        const letter = letterFor(row.percent);

        const pill = document.createElement('span');

        pill.className =
            `grade-pill grade-${letter}`;

        pill.textContent = letter;

        const gradeCell =
            document.createElement('td');

        gradeCell.append(pill);
        tr.append(gradeCell);

        return tr;
    });

    reportRows.replaceChildren(...trs);
}

// ---------- report ----------
async function showReport() {
    const instructor =
        getCurrentInstructor(
            getData('instructors')
        );

    if (!instructor) return;

    const course =
        getCourses(instructor).find(
            course =>
                course.name === courseSelect.value
        );

    if (!course) return;

    const assessments =
        getData('lms_assessments')
            .filter(
                assessment =>
                    assessment.courseId === course.id &&
                    assessment.instructorId ===
                    instructor.id
            )
            .map(assessment => ({
                id: assessment.id,
                title: assessment.name,
                maxScore: assessment.maxScore
            }));

    if (!assessments.length) {
        reportContent.style.display = 'none';

        showMessage(
            'This course has no assessments yet.'
        );

        return;
    }

    const students = await getStudents();

    if (!students.length) {
        reportContent.style.display = 'none';

        showMessage(
            'Could not load students.'
        );

        return;
    }

    showMessage('');
    reportContent.style.display = 'block';

    const rows =
        buildRows(
            assessments,
            students
        );

    showSummary(rows);
    showDistributionChart(rows);
    showAssessmentChart(
        assessments,
        students
    );
    showTable(rows);
}

// ---------- start ----------
function start() {
    const instructor =
        getCurrentInstructor(
            getData('instructors')
        );

    if (!instructor) {
        reportContent.style.display = 'none';

        showMessage(
            'Account not found, please log in again'
        );

        return;
    }

    if (typeof Chart === 'undefined') {
        reportContent.style.display = 'none';

        showMessage(
            'Chart.js is not loaded.'
        );

        console.error(
            'Chart.js is missing. Load Chart.js before this file.'
        );

        return;
    }

    const courses =
        getCourses(instructor);

    if (!courses.length) {
        reportContent.style.display = 'none';

        showMessage(
            'No courses found.'
        );

        return;
    }

    courseSelect.innerHTML = '';

    courses.forEach(course => {
        const option =
            document.createElement('option');

        option.value = course.name;
        option.textContent = course.name;

        courseSelect.append(option);
    });

    courseSelect.addEventListener(
        'change',
        showReport
    );

    showReport();
}

if (allowed) {
    start();
}

// ---------- header + sidebar ----------
(function () {
    const account =
        document.getElementById('account');

    const accountMenu =
        document.getElementById('accountMinu');

    const burgerMenu =
        document.getElementById('burgerMinu');

    const sideBar =
        document.getElementById('sideBar');

    const logoutBtn =
        document.getElementById('logoutBtn');

    function getInitials(name) {
        const words = name
            .split(/\s+/)
            .filter(
                word =>
                    word &&
                    !/^(dr|prof|mr|mrs|ms|eng)\.?$/i.test(word)
            );

        return words
            .slice(0, 2)
            .map(
                word =>
                    word[0].toUpperCase()
            )
            .join('') || '?';
    }

    const email =
        (getCookie('currentUser') || '')
            .toLowerCase();

    const instructor =
        getData('instructors').find(
            item =>
                item.email &&
                item.email.toLowerCase() === email
        ) || loggedIn;

    const fullName = (
        instructor &&
        (instructor.fullName ||
            instructor.name)
    ) || instructor?.email || '';

    const nameEl =
        document.getElementById('name');

    const logoEl =
        document.getElementById('logo');

    if (nameEl) {
        nameEl.textContent = fullName;
    }

    if (logoEl) {
        logoEl.textContent =
            fullName
                ? getInitials(fullName)
                : '';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            'click',
            () => {
                document.cookie =
                    'currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

                localStorage.removeItem(
                    'loggedInUser'
                );

                location.href =
                    '../auth/login.html';
            }
        );
    }

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
            event =>
                event.stopPropagation()
        );
    }

    function closeMenus() {
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

    document.addEventListener(
        'click',
        closeMenus
    );

    document.addEventListener(
        'keydown',
        event => {
            if (event.key === 'Escape') {
                closeMenus();
            }
        }
    );

    document
        .querySelectorAll('.liLinks a')
        .forEach(link => {
            if (
                link.pathname ===
                location.pathname
            ) {
                link.parentElement.classList.add(
                    'active'
                );
            }
        });
})();