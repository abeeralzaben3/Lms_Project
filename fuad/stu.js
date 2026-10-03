async function getStudentData() {
  try {
    const response = await fetch('http://localhost:3000/students');

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching student data:', error);
    return getStudentDataFromLocalStorage();
  }
}


function getStudentDataFromLocalStorage() {
  const data = localStorage.getItem('students');
  return data ? JSON.parse(data) : [];
}


// DELETE STUDENT
function deletestudentFromLocalStorage(studentId) {
  console.log('Deleting student with ID:', studentId);

  const students = getStudentDataFromLocalStorage();

  const updatedStudents = students.filter(
    student => student.id !== studentId
  );

  localStorage.setItem(
    'students',
    JSON.stringify(updatedStudents)
  );

  location.reload();
}


// FORM ELEMENTS
const studentName = document.getElementById("studentName");
const studentId = document.getElementById("studentId");
const course = document.getElementById("course");
const studentStatus = document.getElementById("attendanceStatus");
const attendanceStatus = document.getElementById("archived");


// UPDATE STUDENT FORM
function updateStudent(id) {
  console.log("Updating student:", id);

  // Save the ID of the student we're editing
  localStorage.setItem("editingStudentId", id);

  // Go to the update page
  window.location.href = "update.html";
}



let allStudents = [];

function renderStudents(list) {
  const container = document.getElementById('StudentData');

  if (list.length === 0) {
    container.innerHTML = `<p class="noResults">No students found</p>`;
    return;
  }

  container.innerHTML = list.map(student => `
    <div class="carddiv ${String(student.attendance).toLowerCase() === 'absent' ? 'absent-card' : ''}">
      <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="">
      
      <p>${student.id}</p>
      <p>${student.name}</p>
      <p>${student.course}</p>
      <p>${student.attendance}</p>

      <button class="btn btn-outline-danger"
        onclick="deletestudentFromLocalStorage('${student.id}')">
        Delete
      </button>

      <a class="btn btn-outline-primary"
        onclick="updateStudent('${student.id}')">
        Update
      </a>
    </div>
  `).join('');
}
// Filter by id, name or course (case-insensitive)
function searchStudents() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();

  if (!query) {
    renderStudents(allStudents);
    return;
  }

  const results = allStudents.filter(student =>
    String(student.id).toLowerCase().includes(query) ||
    String(student.name).toLowerCase().includes(query) ||
    String(student.course).toLowerCase().includes(query)
  );

  renderStudents(results);
}

window.addEventListener('load', async function () {
  allStudents = await getStudentData();
  renderStudents(allStudents);

  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn1');

  input.addEventListener('input', searchStudents);   // live search while typing
  btn.addEventListener('click', searchStudents);     // search button
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchStudents();
  });
});


account.addEventListener("click", function (e) {
    accountMinu.classList.toggle("activeAccount");
})

burgerMinu.addEventListener('click', function (e) {
    sideBar.classList.toggle("activeSide");


});
settings.addEventListener("click",function(e){
    window.location.href="/asd.html"
})
logout.addEventListener("click",function(e){
    document.cookie= "name=; max-age=0;"
    window.location.href="/asd.html"
})