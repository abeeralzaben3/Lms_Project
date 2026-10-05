import { fetchApi } from "../Api/fetch.js";
import { Cookie } from "../cookies/cookies.js";
const password = document.getElementById("password");
const email = document.getElementById("email");
const remember = document.getElementById("remember");
const loginForm = document.getElementById("loginForm");
const toggle_pass = document.getElementById("toggle-pass");
const formError = document.getElementById("formError");


let localData = JSON.parse(localStorage.getItem("instructors")) || []
//==================submet=========================

loginForm.addEventListener("submit",async function (e) {
    e.preventDefault();
        
    if (!localData) {
        localData = await fetchApi("instructors");
    }
    for (const data of localData) {
        if (email.value === data.email && password.value === data.password) {
            const userCookie = new Cookie("currentUser", data.name, 7);
            userCookie.setCookie();
            const emailCookie = new Cookie("userEmail", data.email, 7);
            emailCookie.setCookie();
            const idCookie = new Cookie("userId", data.id, 7);
            idCookie.setCookie();
            window.location.href = "../dashboard/dashboard.html";
            return 0;
        }
    }

    formError.textContent = "email or password is wrong";
})

//==================password=========================


toggle_pass.addEventListener("click", function () {

    const icon = toggle_pass.querySelector("i");


    if (password.type === "password") {

        password.type = "text";

        icon.classList.remove(
            "fa-eye-slash"
        );

        icon.classList.add(
            "fa-eye"
        );

    } else {
        password.type = "password";
        icon.classList.remove(
            "fa-eye"
        );

        icon.classList.add(
            "fa-eye-slash"
        );
    }
})


