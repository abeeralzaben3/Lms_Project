// import { fetchApi } from "../Api/fetch.js";
import { Cookie } from "../cookies/cookies.js";

const accountMinu = document.getElementById("accountMinu");
const account = document.getElementById("account");

const burgerMinu = document.getElementById("burgerMinu");
const sideBar = document.getElementById("sideBar");

const headerName = document.getElementById("headerName");
const techName = document.getElementById("techName");
const logo = document.getElementById("logo");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const settings = document.getElementById("settings");
const logout = document.getElementById("logout");

const dashboard = document.getElementById("dashboard");
const assessments = document.getElementById("assessments");
const studentsli = document.getElementById("students");
const reports = document.getElementById("reports");

// ==================get cookies=======================
const userCookie = new Cookie()
const currentUser = userCookie.getCookie("currentUser")
const userEmail = userCookie.getCookie("userEmail")
const userId = userCookie.getCookie("userId")

headerName.textContent = currentUser;
techName.textContent = currentUser;
logo.textContent = currentUser.slice(0, 2).toUpperCase();

// ================== ACCOUNT ==================

account.addEventListener("click", function () {

    accountMinu.classList.toggle("activeAccount");

});


// ================== BURGER ==================

burgerMinu.addEventListener("click", function () {

    sideBar.classList.toggle("activeSide");

});


// =================== LINKS ===================

dashboard.addEventListener("click", function () {

    window.location.href = "../dashboard/dashboard.html";

});


studentsli.addEventListener("click", function () {

    window.location.href = "../student/students.html";

});


assessments.addEventListener("click", function () {

    window.location.href = "../assessments/assessments.html";

});


reports.addEventListener("click", function () {

    window.location.href = "../reports/reports.html";

});


// =================== SETTINGS ===================

settings.addEventListener("click", function () {

    window.location.href = "../settings/settings.html";

});


// =================== LOGOUT ===================

logout.addEventListener("click", function () {

    window.location.href = "../login/login.html";

});