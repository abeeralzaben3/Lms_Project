# LMS Project

A simple Learning Management System (LMS) that helps instructors manage their students, courses, and marks in one place, and lets students follow their own progress.

## The Problem

Instructors often struggle to keep track of every student, course, and mark across different files and tools. This project puts everything in one system:

- The instructor manages courses, assessments, and marks.
- Each student has an account and can see their own results and attendance.

## Features

**Instructor**
- Create student accounts and edit all student data
- Add, update, and delete courses
- Add, update, and delete assessments (tasks and projects) for each course
- Enter and save marks for every student
- Dashboard with a chart

**Student**
- Log in with their own account
- See their average score and attendance rate
- See their scores for every course
- Dashboard with an attendance chart

## Pages

| Page | Description |
|---|---|
| Login | Sign in as an instructor or a student |
| Register | Create a new account |
| Instructor dashboard | Overview of the instructor's classes, with a chart |
| Student dashboard | Average score, attendance, scores by course, with a chart |
| Assessments | Manage courses and assessments, and enter marks |
| Students | Create, read, update, and delete students (CRUD) |
| Settings | Account settings |

## How It Works

- **Current user:** the logged-in user is stored in a cookie (`cur_user`), so every page knows who is logged in.
- **Instructor data:** stored in `localStorage` (courses, assessments).
- **Student data:** loaded from the API the first time, then saved in `localStorage` so the pages can read and update it.
- **Charts:** one chart on each dashboard, built with [Chart.js](https://www.chartjs.org/).

## Data Structure

**Instructor**
```json
{
  "id": "ins_001",
  "username": "ali",
  "name": "Dr. Ahmad",
  "courses": ["JS101"],
  "assessments": [
    { "id": "a1", "course": "JS101", "type": "task", "title": "Task 1", "maxScore": 10 }
  ]
}
```

**Student**
```json
{
  "id": "stu_001",
  "studentId": "20260045",
  "name": "Lina Omar",
  "courses": ["c1"],
  "scores": [{ "assessmentId": "a1", "score": 9 }],
  "attendance": [{ "date": "2026-09-20", "courseId": "c1", "status": "present" }],
  "archived": false
}
```

A score of `null` means the assessment is not graded yet (`0` is a real mark).

## Getting Started

1. Clone the repository.
2. Start the API that serves the students (it must run at `http://localhost:3000/students`).
3. Open the project with a local server (for example the VS Code Live Server extension). Opening the files directly does not work, because the pages use JavaScript modules.
4. Open the login page and sign in.

## Design

The mockups and wireframes are in the `design` folder, including the phone version of every page.

## Built With

- HTML, CSS, JavaScript
- Chart.js
- `localStorage` and cookies
- A local JSON API for student data

## Design

The UI mockups and wireframes were designed in Figma, including the phone version of every page.

[Figma Design](https://www.figma.com/design/s051MSjxQmFSF7Im7G4AyN/Untitled?node-id=0-1&t=B0QJkjrPn0uQPc19-0)