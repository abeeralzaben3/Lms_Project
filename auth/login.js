import {
    loginUser,
    saveLoggedInUser
} from './fetchStudents.js';


// ==================================================
// Elements
// ==================================================

const form = document.getElementById('loginForm');

const formError = document.getElementById('formError');


// ==================================================
// Show Error
// ==================================================

function showError(message) {

    if (formError) {

        formError.textContent = message;

    } else if (message) {

        alert(message);
    }
}


// ==================================================
// LOGIN
// ==================================================

form.addEventListener('submit', async function (event) {

    event.preventDefault();

    showError('');


    // ------------------------------
    // Get values
    // ------------------------------

    const email =
        form.email.value.trim().toLowerCase();

    const password =
        form.password.value;


    // ------------------------------
    // Validate email
    // ------------------------------

    if (email === '') {

        showError('Please enter your email');

        return;
    }


    if (
        !email.includes('@') ||
        !email.includes('.')
    ) {

        showError('Please enter a valid email');

        return;
    }


    // ------------------------------
    // Validate password
    // ------------------------------

    if (password === '') {

        showError('Please enter your password');

        return;
    }


    // ------------------------------
    // Search user
    // ------------------------------

    try {

        const foundUser =
            await loginUser(
                email,
                password
            );


        // User not found
        if (!foundUser) {

            showError(
                'Incorrect email or password'
            );

            return;
        }


        // ------------------------------
        // Remember me
        // ------------------------------

        const days =
            form.remember &&
            form.remember.checked
                ? 7
                : null;


        // Save user
        saveLoggedInUser(
            foundUser,
            days
        );


        // ------------------------------
        // Redirect according to role
        // ------------------------------

        if (foundUser.role === 'student') {

            window.location.href =
                '../student_dashboard/index.html';

        } else {

            window.location.href =
                '../homePage/index.html';
        }

    } catch (error) {

        console.error(error);

        showError(
            'Something went wrong. Please try again.'
        );
    }

});


// ==================================================
// Show / Hide Password
// ==================================================

const eye =
    document.querySelector('.toggle-pass');


if (eye) {

    eye.addEventListener(
        'click',
        function () {

            const input =
                document.getElementById('password');


            if (!input) return;


            if (input.type === 'password') {

                input.type = 'text';

                this.innerHTML =
                    '<i class="fa-regular fa-eye-slash"></i>';

            } else {

                input.type = 'password';

                this.innerHTML =
                    '<i class="fa-regular fa-eye"></i>';
            }
        }
    );
}