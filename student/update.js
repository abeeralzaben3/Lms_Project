
"use strict";

// ================= GET FORM ELEMENTS =================

const studentName = document.getElementById("studentName");
const studentId = document.getElementById("studentId");
const course = document.getElementById("course");
const studentStatus = document.getElementById("attendanceStatus");
const archivedInput = document.getElementById("archived");
const addStudentForm = document.getElementById("addStudentForm");

// ================= GET EDITING STUDENT ID =================

const editingStudentId = localStorage.getItem("editingStudentId");

// ================= GET STUDENTS =================

function getStudents() {
    try {
        const data = localStorage.getItem("myStudents");
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Could not read students:", error);
        return [];
    }
}

let students = getStudents();

// ================= FIND STUDENT =================

function getStudentIdentifier(student) {
    return student.id ?? student.studentId;
}

let student = students.find(
    (item) =>
        String(getStudentIdentifier(item)) === String(editingStudentId)
);

// ================= NORMALIZE ATTENDANCE =================
// Keep attendance as an array of records.
// Do not convert a text value into a fake attendance record.

function getAttendanceRecords(attendance) {
    if (Array.isArray(attendance)) {
        return attendance;
    }

    return [];
}

// ================= FILL FORM =================

if (!student) {
    console.error("Student not found.");

    if (addStudentForm) {
        addStudentForm.querySelectorAll("input, select, textarea, button")
            .forEach((element) => {
                element.disabled = true;
            });
    }
} else {
    studentName.value = student.name ?? "";
    studentId.value = getStudentIdentifier(student) ?? "";
    course.value = student.course ?? "";

    // Display the current attendance status only if it is a text value.
    // The original attendance records remain untouched.
    if (studentStatus) {
        studentStatus.value = Array.isArray(student.attendance)
            ? ""
            : (student.attendance ?? "");
    }

    if (archivedInput) {
        archivedInput.value = String(student.archived ?? false);
    }
}

// ================= SAVE CHANGES =================

if (addStudentForm) {
    addStudentForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!student) {
            alert("Student not found.");
            return;
        }

        // Read the latest saved data
        let latestStudents;

        try {
            latestStudents = JSON.parse(
                localStorage.getItem("myStudents") || "[]"
            );
        } catch (error) {
            console.error("Could not read student data:", error);
            alert("Could not read student data.");
            return;
        }

        // Find the student again
        const index = latestStudents.findIndex(
            (item) =>
                String(getStudentIdentifier(item)) ===
                String(editingStudentId)
        );

        if (index === -1) {
            alert("Student not found.");
            return;
        }

        const oldStudent = latestStudents[index];

        // Keep the original attendance records.
        // If old data contains a string instead of an array,
        // use an empty array rather than preserving invalid data.
        const attendanceRecords = getAttendanceRecords(
            oldStudent.attendance
        );

        // Update only the intended fields
        const updatedStudent = {
            ...oldStudent,
            name: studentName.value.trim(),
            course: course.value.trim(),
            attendance: attendanceRecords
        };

        // Update ID only if the project allows editing it.
        // Remove this assignment if IDs should never change.
        const newId = studentId.value.trim();

        if (newId !== "") {
            const duplicateId = latestStudents.some(
                (item, i) =>
                    i !== index &&
                    String(getStudentIdentifier(item)) === newId
            );

            if (duplicateId) {
                alert("This student ID is already in use.");
                return;
            }

            if ("studentId" in oldStudent && !("id" in oldStudent)) {
                updatedStudent.studentId = newId;
            } else {
                updatedStudent.id = newId;
            }
        }

        // Update archived status only if the field exists
        if (archivedInput) {
            updatedStudent.archived = archivedInput.value === "true";
        }

        latestStudents[index] = updatedStudent;

        // Save the full student list
        try {
            localStorage.setItem(
                "myStudents",
                JSON.stringify(latestStudents)
            );
        } catch (error) {
            console.error("Could not save student data:", error);
            alert("Could not save student changes.");
            return;
        }

        localStorage.removeItem("editingStudentId");

        window.location.href = "students.html";
    });
}
