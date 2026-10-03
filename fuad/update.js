const studentName = document.getElementById("studentName");
const studentId = document.getElementById("studentId");
const course = document.getElementById("course");
const studentStatus = document.getElementById("attendanceStatus");
const attendanceStatus = document.getElementById("archived");


// Get the student we're editing
const editingStudentId = localStorage.getItem("editingStudentId");


// Get all students
const students = JSON.parse(
  localStorage.getItem("students")
) || [];


// Find the student
const student = students.find(
  student => String(student.id) === String(editingStudentId)
);


if (!student) {

  console.error("Student not found");

} else {

  // Fill the form
  studentName.value = student.name;
  studentId.value = student.id;
  course.value = student.course;
  studentStatus.value = student.attendance;
  attendanceStatus.value = String(student.archived);
}


// SAVE CHANGES
document
  .getElementById("addStudentForm")
  .addEventListener("submit", function (event) {

    event.preventDefault();

    const index = students.findIndex(
      student => String(student.id) === String(editingStudentId)
    );

    if (index === -1) {
      console.error("Student not found");
      return;
    }


    // Update student
    students[index] = {
      ...students[index],

      id: studentId.value,
      name: studentName.value,
      course: course.value,
      attendance: studentStatus.value,
      archived: attendanceStatus.value === "true"
    };


    // Save updated students
    localStorage.setItem(
      "students",
      JSON.stringify(students)
    );


    // Remove editing ID
    localStorage.removeItem("editingStudentId");


    // Go back to students page
    window.location.href = "students.html";

});