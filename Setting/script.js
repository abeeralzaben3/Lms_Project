// =========================================
// SELECT ELEMENTS
// =========================================

const teacherName =
    document.getElementById("teacherName");

const teacherEmail =
    document.getElementById("teacherEmail");

const teacherHeaderName =
    document.getElementById("name");

const headerLogo =
    document.getElementById("logo");

const sidebarName =
    document.getElementById("sidebarName");

const sidebarRole =
    document.getElementById("sidebarRole");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const profileMessage =
    document.getElementById("profileMessage");

const emailNotifications =
    document.getElementById("emailNotifications");

const assignmentNotifications =
    document.getElementById("assignmentNotifications");

const changePasswordBtn =
    document.getElementById("changePasswordBtn");

const passwordForm =
    document.getElementById("passwordForm");

const newPassword =
    document.getElementById("newPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const savePasswordBtn =
    document.getElementById("savePasswordBtn");

const passwordMessage =
    document.getElementById("passwordMessage");

const darkModeToggle =
    document.getElementById("darkModeToggle");

const account =
    document.getElementById("account");

const accountMinu =
    document.getElementById("accountMinu");

const burgerMinu =
    document.getElementById("burgerMinu");

const sideBar =
    document.getElementById("sideBar");

const settings =
    document.getElementById("settings");

const logout =
    document.getElementById("logout");


// =========================================
// HELPERS
// =========================================

// the message hide after 5 seconds
function showMessage(element, text, type) {

    element.textContent = text;

    element.style.color =
        type === "success"
            ? "var(--success)"
            : "var(--error)";


    // disable any old timer
    if (element.dataset.timerId) {

        clearTimeout(
            Number(element.dataset.timerId)
        );

    }


    // إخفاء الرسالة بعد 5 ثواني
    const timerId = setTimeout(function () {

        element.textContent = "";

        delete element.dataset.timerId;

    }, 5000);


    element.dataset.timerId = timerId;
}


// دالة موحدة لحفظ بيانات المدرس
function saveTeacherData(updates) {

    const savedData =
        localStorage.getItem("teacherSettings");


    let teacher = {};


    if (savedData) {

        try {

            teacher = JSON.parse(savedData) || {};

        } catch (error) {

            teacher = {};

        }

    }


    // دمج التحديثات مع البيانات القديمة
    Object.assign(teacher, updates);


    localStorage.setItem(
        "teacherSettings",
        JSON.stringify(teacher)
    );


    return teacher;
}


// تحقق من صيغة الإيميل
function isValidEmail(email) {

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);

}


// تحديث واجهة المدرس (الهيدر + السايدبار)
function updateTeacherUI(name) {

    if (!name) return;

    const fullName =
        name.trim();

    const firstTwo =
        fullName.substring(0, 2).toUpperCase();


    // Header
    teacherHeaderName.textContent = fullName;
    headerLogo.textContent = firstTwo;


    // Sidebar
    sidebarName.textContent = fullName;

}


// =========================================
// LOAD TEACHER DATA
// =========================================

const savedTeacher =
    localStorage.getItem("teacherSettings");


if (savedTeacher) {

    try {

        const teacher =
            JSON.parse(savedTeacher);


        // Name

        teacherName.value =
            teacher.name || "";


        // Email

        teacherEmail.value =
            teacher.email || "";


        // Notifications

        emailNotifications.checked =
            teacher.emailNotifications || false;

        assignmentNotifications.checked =
            teacher.assignmentNotifications || false;


        // تحديث الهيدر + السايدبار
        if (teacher.name) {

            updateTeacherUI(teacher.name);

        }

    } catch (error) {

        console.warn(
            "Invalid teacherSettings in localStorage"
        );

    }

}


// =========================================
// SAVE PROFILE
// =========================================

saveProfileBtn.addEventListener(
    "click",
    function () {

        const name =
            teacherName.value.trim();

        const email =
            teacherEmail.value.trim();


        // Check empty fields

        if (name === "" || email === "") {

            showMessage(
                profileMessage,
                "Please enter your name and email.",
                "error"
            );

            return;
        }


        // Validate email format

        if (!isValidEmail(email)) {

            showMessage(
                profileMessage,
                "Please enter a valid email address.",
                "error"
            );

            return;
        }


        // Save profile

        saveTeacherData({
            name: name,
            email: email
        });


        // تحديث الواجهة
        updateTeacherUI(name);


        // Show success message

        showMessage(
            profileMessage,
            "Profile updated successfully!",
            "success"
        );

    }
);


// =========================================
// EMAIL NOTIFICATIONS
// =========================================

emailNotifications.addEventListener(
    "change",
    function () {

        updateNotifications();

    }
);


// =========================================
// ASSIGNMENT NOTIFICATIONS
// =========================================

assignmentNotifications.addEventListener(
    "change",
    function () {

        updateNotifications();

    }
);


// =========================================
// UPDATE NOTIFICATIONS
// =========================================

function updateNotifications() {

    saveTeacherData({

        emailNotifications:
            emailNotifications.checked,

        assignmentNotifications:
            assignmentNotifications.checked

    });

}


// =========================================
// CHANGE PASSWORD
// =========================================

changePasswordBtn.addEventListener(
    "click",
    function () {

        if (passwordForm.style.display === "block") {

            passwordForm.style.display =
                "none";

        } else {

            passwordForm.style.display =
                "block";

        }

    }
);


// =========================================
// SAVE PASSWORD
// =========================================

savePasswordBtn.addEventListener(
    "click",
    function () {

        const password =
            newPassword.value;

        const confirmPasswordValue =
            confirmPassword.value;


        // Check empty fields

        if (
            password === "" ||
            confirmPasswordValue === ""
        ) {

            showMessage(
                passwordMessage,
                "Please enter the new password.",
                "error"
            );

            return;
        }


        // Check password length

        if (password.length < 6) {

            showMessage(
                passwordMessage,
                "Password must be at least 6 characters.",
                "error"
            );

            return;
        }


        // Check passwords match

        if (
            password !==
            confirmPasswordValue
        ) {

            showMessage(
                passwordMessage,
                "Passwords do not match.",
                "error"
            );

            return;
        }


        // Save password

        saveTeacherData({
            password: password
        });


        // Show success message

        showMessage(
            passwordMessage,
            "Password changed successfully!",
            "success"
        );


        // Clear inputs

        newPassword.value = "";

        confirmPassword.value = "";

    }
);


// =========================================
// DARK MODE
// =========================================

darkModeToggle.addEventListener(
    "change",
    function () {

        if (darkModeToggle.checked) {

            document.body.classList.add(
                "dark-mode"
            );

            localStorage.setItem(
                "darkMode",
                "true"
            );

        } else {

            document.body.classList.remove(
                "dark-mode"
            );

            localStorage.setItem(
                "darkMode",
                "false"
            );

        }

    }
);


// =========================================
// LOAD DARK MODE
// =========================================

const savedDarkMode =
    localStorage.getItem("darkMode");


if (savedDarkMode === "true") {

    darkModeToggle.checked = true;

    document.body.classList.add(
        "dark-mode"
    );

}


// =========================================
// ACCOUNT MENU
// =========================================

account.addEventListener("click", function () {

    accountMinu.classList.toggle("activeAccount");

});


// =========================================
// BURGER MENU
// =========================================

burgerMinu.addEventListener("click", function () {

    sideBar.classList.toggle("activeSide");

});


// =========================================
// SETTINGS LINK
// =========================================

settings.addEventListener("click", function () {

    window.location.href = "settings.html";

});


// =========================================
// LOGOUT
// =========================================

logout.addEventListener("click", function () {

    localStorage.removeItem("isLoggedIn");

    window.location.href = "login.html";

});