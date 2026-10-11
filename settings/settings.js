"use strict";

import { Cookie } from "../cookies/cookies.js";

// ======================================================
// 1. HELPERS
// ======================================================

const $ = (id) => document.getElementById(id);

// ======================================================
// READ LOCAL STORAGE
// ======================================================

function readList(key) {


try {

    return JSON.parse(
        localStorage.getItem(key)
    ) || [];

} catch (error) {

    return [];

}


}

// ======================================================
// SAVE LOCAL STORAGE
// ======================================================

function saveList(key, data) {


localStorage.setItem(
    key,
    JSON.stringify(data)
);


}

// ======================================================
// GET COOKIE DIRECTLY
// ======================================================

function getCookie(name) {


const cookies = document.cookie.split(";");

for (const cookie of cookies) {

    const [key, value] =
        cookie.trim().split("=");

    if (key === name) {

        return decodeURIComponent(
            value || ""
        );

    }

}

return null;


}

// ======================================================
// GET INITIALS
// ======================================================

function getInitials(name) {


if (!name) {

    return "IN";

}

return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word =>
        word.charAt(0).toUpperCase()
    )
    .join("");


}

// ======================================================
// EMAIL VALIDATION
// ======================================================

function isValidEmail(email) {


return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


}

// ======================================================
// PASSWORD VALIDATION
// ======================================================

function passwordProblem(password) {


if (!password) {

    return "Please enter your password.";

}


if (password.length < 8) {

    return "Password must contain at least 8 characters.";

}


if (/\s/.test(password)) {

    return "Password must not contain spaces.";

}


if (!/[A-Z]/.test(password)) {

    return "Password must contain at least one uppercase letter.";

}


if (!/[a-z]/.test(password)) {

    return "Password must contain at least one lowercase letter.";

}


if (!/[0-9]/.test(password)) {

    return "Password must contain at least one number.";

}


if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`]/.test(password)) {

    return "Password must contain at least one special character.";

}


return "";


}

// ======================================================
// SHOW MESSAGE
// ======================================================

function showMessage(element, message, type = "error") {


if (!element) {

    return;

}

element.textContent = message;

element.classList.remove(
    "success",
    "error"
);

if (message) {

    element.classList.add(type);

}


}

// ======================================================
// 2. GET USER FROM COOKIES
// ======================================================

const currentUserName =
getCookie("currentUser");

const currentUserEmail =
getCookie("userEmail");

const currentUserId =
getCookie("userId");

// ======================================================
// CHECK LOGIN
// ======================================================

if (!currentUserEmail || !currentUserId) {


window.location.href =
    "../login/login.html";


} else {


// ==================================================
// 3. DOM ELEMENTS
// ==================================================

const teacherName =
    $("teacherName");

const teacherEmail =
    $("teacherEmail");

const profileMessage =
    $("profileMessage");

const saveProfileBtn =
    $("saveProfileBtn");


const emailNotifications =
    $("emailNotifications");

const assignmentNotifications =
    $("assignmentNotifications");


const changePasswordBtn =
    $("changePasswordBtn");

const passwordForm =
    $("passwordForm");

const currentPassword =
    $("currentPassword");

const newPassword =
    $("newPassword");

const confirmPassword =
    $("confirmPassword");

const savePasswordBtn =
    $("savePasswordBtn");

const passwordMessage =
    $("passwordMessage");


const darkModeToggle =
    $("darkModeToggle");


// ==================================================
// 4. FIND CURRENT INSTRUCTOR
// ==================================================

function findMe() {

    const instructors =
        readList("instructors");


    // Search by ID

    let instructor =
        instructors.find(user =>

            String(user.id) ===
            String(currentUserId)

        );


    // Search by email

    if (!instructor) {

        instructor =
            instructors.find(user =>

                String(user.email || "")
                    .trim()
                    .toLowerCase() ===

                String(currentUserEmail || "")
                    .trim()
                    .toLowerCase()

            );

    }


    // Fallback

    if (!instructor) {

        instructor = {

            id: currentUserId,

            name: currentUserName,

            email: currentUserEmail,

            role: "Instructor"

        };

    }


    return instructor;

}


let currentInstructor =
    findMe();


// ==================================================
// 5. UPDATE UI
// ==================================================

function updateTeacherUI(user) {
    if (!user) {
        return;
    }

    const fullName =
        user.name ||
        user.fullName ||
        "Instructor";

    const email =
        user.email || "";

    // Settings
    if (teacherName) {
        teacherName.value =
            fullName;
    }

    if (teacherEmail) {
        teacherEmail.value =
            email;
    }

    // Header
    const headerName =
        $("headerName");

    const headerLogo =
        $("logo");

    const sidebarName =
        $("techName");

    if (headerName) {
        headerName.textContent =
            fullName;
    }

    if (sidebarName) {
        sidebarName.textContent =
            fullName;
    }

    if (headerLogo) {
        headerLogo.textContent =
            getInitials(fullName);
    }
}


// Initial UI

updateTeacherUI(
    currentInstructor
);


// ==================================================
// 6. UPDATE COOKIES
// ==================================================

function updateUserCookies(user) {

    const userCookie =
        new Cookie(
            "currentUser",
            user.name,
            7
        );

    userCookie.setCookie();


    const emailCookie =
        new Cookie(
            "userEmail",
            user.email,
            7
        );

    emailCookie.setCookie();


    const idCookie =
        new Cookie(
            "userId",
            user.id,
            7
        );

    idCookie.setCookie();

}


// ==================================================
// 7. CHECK DUPLICATE EMAIL
// ==================================================

function emailTaken(email) {

    const normalizedEmail =
        email.trim().toLowerCase();


    const currentEmail =
        String(
            currentInstructor.email || ""
        )
            .trim()
            .toLowerCase();


    // Same email is allowed

    if (
        normalizedEmail ===
        currentEmail
    ) {

        return false;

    }


    const instructors =
        readList("instructors");


    const users =
        readList("users");


    const students =
        readList("students");


    return (

        instructors.some(user =>
            String(user.email || "")
                .trim()
                .toLowerCase() ===
            normalizedEmail
        )

        ||

        users.some(user =>
            String(user.email || "")
                .trim()
                .toLowerCase() ===
            normalizedEmail
        )

        ||

        students.some(user =>
            String(user.email || "")
                .trim()
                .toLowerCase() ===
            normalizedEmail
        )

    );

}


// ==================================================
// 8. SAVE PROFILE
// ==================================================

function applyChanges() {

    const newName =
        teacherName.value.trim();


    const newEmail =
        teacherEmail.value
            .trim()
            .toLowerCase();


    // Name

    if (!newName) {

        showMessage(
            profileMessage,
            "Please enter your full name.",
            "error"
        );

        return;

    }


    const nameParts =
        newName.split(/\s+/);


    if (nameParts.length < 2) {

        showMessage(
            profileMessage,
            "Please enter your first and last name.",
            "error"
        );

        return;

    }


    // Email

    if (!isValidEmail(newEmail)) {

        showMessage(
            profileMessage,
            "Please enter a valid email address.",
            "error"
        );

        return;

    }


    // Duplicate

    if (emailTaken(newEmail)) {

        showMessage(
            profileMessage,
            "This email is already in use.",
            "error"
        );

        return;

    }


    const currentEmail =
        String(
            currentInstructor.email || ""
        )
            .trim()
            .toLowerCase();


    // ==================================================
    // UPDATE INSTRUCTORS
    // ==================================================

    let instructors =
        readList("instructors");


    let instructorFound =
        false;


    instructors =
        instructors.map(user => {

            const userEmail =
                String(user.email || "")
                    .trim()
                    .toLowerCase();


            if (
                userEmail ===
                currentEmail
            ) {

                instructorFound = true;


                return {

                    ...user,

                    name: newName,

                    fullName: newName,

                    email: newEmail

                };

            }


            return user;

        });


    // If not found

    if (!instructorFound) {

        instructors.push({

            ...currentInstructor,

            id: currentUserId,

            name: newName,

            fullName: newName,

            email: newEmail,

            role: "Instructor"

        });

    }


    saveList(
        "instructors",
        instructors
    );


    // ==================================================
    // UPDATE USERS
    // ==================================================

    let users =
        readList("users");


    let userUpdated =
        false;


    users =
        users.map(user => {

            const userEmail =
                String(user.email || "")
                    .trim()
                    .toLowerCase();


            if (
                userEmail ===
                currentEmail
            ) {

                userUpdated = true;


                return {

                    ...user,

                    name: newName,

                    fullName: newName,

                    email: newEmail

                };

            }


            return user;

        });


    if (userUpdated) {

        saveList(
            "users",
            users
        );

    }


    // ==================================================
    // UPDATE CURRENT USER
    // ==================================================

    currentInstructor = {

        ...currentInstructor,

        id: currentUserId,

        name: newName,

        fullName: newName,

        email: newEmail

    };


    // ==================================================
    // UPDATE COOKIES
    // ==================================================

    updateUserCookies(
        currentInstructor
    );


    // ==================================================
    // UPDATE UI
    // ==================================================

    updateTeacherUI(
        currentInstructor
    );


    showMessage(
        profileMessage,
        "Profile updated successfully.",
        "success"
    );

}


// ==================================================
// 9. SAVE PROFILE
// ==================================================

if (saveProfileBtn) {
    saveProfileBtn.addEventListener(
        "click",
        applyChanges
    );

window.dispatchEvent(new Event("userUpdated"));
}


// ==================================================
// 10. NOTIFICATIONS
// ==================================================

function saveNotifications() {

    const settings = {

        emailNotifications:
            emailNotifications.checked,

        assignmentNotifications:
            assignmentNotifications.checked

    };


    localStorage.setItem(
        "notificationSettings",
        JSON.stringify(settings)
    );

}


function loadNotifications() {

    const settings =
        JSON.parse(
            localStorage.getItem(
                "notificationSettings"
            ) || "{}"
        );


    emailNotifications.checked =
        settings.emailNotifications ?? true;


    assignmentNotifications.checked =
        settings.assignmentNotifications ?? true;

}


loadNotifications();


emailNotifications.addEventListener(
    "change",
    saveNotifications
);


assignmentNotifications.addEventListener(
    "change",
    saveNotifications
);


// ==================================================
// 11. CHANGE PASSWORD
// ==================================================

if (
    changePasswordBtn &&
    passwordForm
) {

    changePasswordBtn.addEventListener(
        "click",
        () => {

            passwordForm.classList.toggle(
                "show"
            );

        }
    );

}


// ==================================================
// 12. SAVE PASSWORD
// ==================================================

if (savePasswordBtn) {

    savePasswordBtn.addEventListener(
        "click",
        () => {

            const oldPassword =
                currentPassword.value;


            const newPass =
                newPassword.value;


            const confirmPass =
                confirmPassword.value;


            // Current password

            if (!oldPassword) {

                showMessage(
                    passwordMessage,
                    "Please enter your current password.",
                    "error"
                );

                return;

            }


            // Check current password

            if (
                String(
                    currentInstructor.password || ""
                ) !==
                String(oldPassword)
            ) {

                showMessage(
                    passwordMessage,
                    "Current password is incorrect.",
                    "error"
                );

                return;

            }


            // Validate new password

            const passwordError =
                passwordProblem(newPass);


            if (passwordError) {

                showMessage(
                    passwordMessage,
                    passwordError,
                    "error"
                );

                return;

            }


            // Confirm

            if (
                newPass !==
                confirmPass
            ) {

                showMessage(
                    passwordMessage,
                    "Passwords do not match.",
                    "error"
                );

                return;

            }


            const currentEmail =
                String(
                    currentInstructor.email || ""
                )
                    .trim()
                    .toLowerCase();


            // ==================================================
            // UPDATE INSTRUCTORS
            // ==================================================

            let instructors =
                readList("instructors");


            instructors =
                instructors.map(user => {

                    const userEmail =
                        String(user.email || "")
                            .trim()
                            .toLowerCase();


                    if (
                        userEmail ===
                        currentEmail
                    ) {

                        return {

                            ...user,

                            password: newPass

                        };

                    }


                    return user;

                });


            saveList(
                "instructors",
                instructors
            );


            // ==================================================
            // UPDATE USERS
            // ==================================================

            let users =
                readList("users");


            users =
                users.map(user => {

                    const userEmail =
                        String(user.email || "")
                            .trim()
                            .toLowerCase();


                    if (
                        userEmail ===
                        currentEmail
                    ) {

                        return {

                            ...user,

                            password: newPass

                        };

                    }


                    return user;

                });


            saveList(
                "users",
                users
            );


            // Update current instructor

            currentInstructor.password =
                newPass;


            // Clear fields

            currentPassword.value =
                "";

            newPassword.value =
                "";

            confirmPassword.value =
                "";


            showMessage(
                passwordMessage,
                "Password changed successfully.",
                "success"
            );

        }
    );

}


// ==================================================
// 13. DARK MODE
// ==================================================

if (darkModeToggle) {

    const darkMode =
        localStorage.getItem(
            "darkMode"
        ) === "true";


    darkModeToggle.checked =
        darkMode;


    document.body.classList.toggle(
        "dark-mode",
        darkMode
    );


    darkModeToggle.addEventListener(
        "change",
        () => {

            const enabled =
                darkModeToggle.checked;


            document.body.classList.toggle(
                "dark-mode",
                enabled
            );


            localStorage.setItem(
                "darkMode",
                String(enabled)
            );

        }
    );

}


// ==================================================
// 14. LOGOUT
// ==================================================

const logout =
    $("logout");


if (logout) {

    logout.addEventListener(
        "click",
        (event) => {

            event.preventDefault();


            // Delete cookies

            document.cookie =
                "currentUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            document.cookie =
                "userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            document.cookie =
                "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";


            window.location.href =
                "../login/login.html";

        }
    );

}


}
