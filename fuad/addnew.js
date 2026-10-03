

const form = document.getElementById("addStudentForm");

const studentName = document.getElementById("studentName");
const studentId = document.getElementById("studentId");
const course = document.getElementById("course");
const studentStatus = document.getElementById("attendanceStatus");
const attendanceStatus = document.getElementById("archived"); 






function getStudentDataFromLocalStorage() {
  const data = localStorage.getItem('students');
  return data ? JSON.parse(data) : [];
}

function addStudentToLocalStorage(student) {
  const students = getStudentDataFromLocalStorage();
  students.push(student);
  localStorage.setItem('students', JSON.stringify(students));
}


form.addEventListener("submit", function (event) {
  event.preventDefault();

  
    addStudentToLocalStorage({
      id: studentId.value,
      name: studentName.value || "Not specified",
      course: course.value || "Not specified",
      status: studentStatus.value,
      attendance: studentStatus.value
    });

    location.href = "students.html";

});

account.addEventListener("click", function (e) {
    accountMinu.classList.toggle("activeAccount");
})

burgerMinu.addEventListener('click', function (e) {
    sideBar.classList.toggle("activeSide");


});
settings.addEventListener("click",function(e){
  window.location.href = "/Setting/index.html"
})
logout.addEventListener("click",function(e){
    document.cookie= "name=; max-age=0;"
    window.location.href = "/auth/login.html";
})
