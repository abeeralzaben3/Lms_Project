"use strict";

// ================= ELEMENTS =================

const registerForm = document.getElementById("registerForm");

const fullName = document.getElementById("fullName");

const email = document.getElementById("email");

const phone = document.getElementById("phone");

const password = document.getElementById("password");

const terms = document.getElementById("terms");

const formError = document.getElementById("formError");

const togglePass = document.getElementById("toggle-pass");

const submitBtn = document.getElementById("submitBtn");


// ================= GET INSTRUCTORS =================

function getInstructors() {

    try {

        return JSON.parse(
            localStorage.getItem("instructors")
        ) || [];

    } catch (error) {

        console.error(
            "Error reading instructors:",
            error
        );

        return [];
    }
}


// ================= SAVE INSTRUCTORS =================

function saveInstructors(instructors) {

    localStorage.setItem(
        "instructors",
        JSON.stringify(instructors)
    );
}


// ================= SHOW ERROR =================

function showError(message) {

    formError.textContent = message;

    formError.classList.add("show");
}


// ================= CLEAR ERROR =================

function clearError() {

    formError.textContent = "";

    formError.classList.remove("show");
}


// ================= TOGGLE PASSWORD =================

togglePass.addEventListener("click", function () {

    if (password.type === "password") {

        password.type = "text";

        togglePass.innerHTML =
            '<i class="fa-regular fa-eye-slash"></i>';

    } else {

        password.type = "password";

        togglePass.innerHTML =
            '<i class="fa-regular fa-eye"></i>';
    }

});


// ================= VALIDATION =================

function validateForm() {

    const nameValue =
        fullName.value.trim();

    const emailValue =
        email.value.trim().toLowerCase();

    const phoneValue =
        phone.value.trim();

    const passwordValue =
        password.value;


    // FULL NAME

    if (nameValue === "") {

        showError(
            "Please enter your full name."
        );

        fullName.focus();

        return false;
    }


    if (nameValue.length < 3) {

        showError(
            "Full name must be at least 3 characters."
        );

        fullName.focus();

        return false;
    }


    // EMAIL

    if (emailValue === "") {

        showError(
            "Please enter your email."
        );

        email.focus();

        return false;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(emailValue)) {

        showError(
            "Please enter a valid email address."
        );

        email.focus();

        return false;
    }


    // PHONE

    if (phoneValue === "") {

        showError(
            "Please enter your phone number."
        );

        phone.focus();

        return false;
    }


    const phonePattern =
        /^[0-9]{9,15}$/;


    if (!phonePattern.test(phoneValue)) {

        showError(
            "Please enter a valid phone number."
        );

        phone.focus();

        return false;
    }


    // PASSWORD

    if (passwordValue === "") {

        showError(
            "Please enter a password."
        );

        password.focus();

        return false;
    }


    if (passwordValue.length < 8) {

        showError(
            "Password must be at least 8 characters."
        );

        password.focus();

        return false;
    }


    // TERMS

    if (!terms.checked) {

        showError(
            "You must agree to the terms and privacy policy."
        );

        terms.focus();

        return false;
    }


    return true;
}


// ================= REGISTER =================

registerForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        clearError();


        // VALIDATE

        if (!validateForm()) {

            return;
        }


        // VALUES

        const nameValue =
            fullName.value.trim();

        const emailValue =
            email.value.trim().toLowerCase();

        const phoneValue =
            phone.value.trim();

        const passwordValue =
            password.value;


        // GET EXISTING INSTRUCTORS

        const instructors =
            getInstructors();


        // CHECK EMAIL

        const emailExists =
            instructors.some(
                function (instructor) {

                    return String(
                        instructor.email
                    ).toLowerCase() === emailValue;

                }
            );


        if (emailExists) {

            showError(
                "This email is already registered."
            );

            email.focus();

            return;
        }


        // CREATE ID

        const newId =
            "INS" +
            String(
                instructors.length + 1
            ).padStart(3, "0");


        // CREATE INSTRUCTOR

        const newInstructor = {

            id: newId,

            name: nameValue,

            email: emailValue,

            phone: phoneValue,

            password: passwordValue,

            role: "Instructor"
        };


        // ADD

        instructors.push(
            newInstructor
        );


        // SAVE

        saveInstructors(
            instructors
        );


        // SUCCESS

        formError.textContent =
            "Account created successfully. Redirecting to login...";

        formError.classList.add("success");


        // DISABLE BUTTON

        submitBtn.disabled = true;


        // RESET

        registerForm.reset();


        // REDIRECT

        setTimeout(
            function () {

                window.location.href =
                    "../login/login.html";

            },
            1500
        );

    }
);