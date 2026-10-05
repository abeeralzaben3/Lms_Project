import {
    addUser
} from './fetchStudents.js';


// ==================================================
// Elements
// ==================================================

const form =
    document.getElementById('registerForm');

const formError =
    document.getElementById('formError');


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
// Check if text contains any character
// ==================================================

function hasAny(text, chars) {

    for (let i = 0; i < text.length; i++) {

        if (chars.includes(text[i])) {
            return true;
        }
    }

    return false;
}


// ==================================================
// Validation Characters
// ==================================================

const digits =
    '0123456789';


const specials =
    '!@#$%^&*()_+-=?.,';


const nameBlocked =
    digits +
    '!@#$%^&*()+=?.,<>/\\|{}[]';


// ==================================================
// REGISTER
// ==================================================

form.addEventListener(
    'submit',
    async function (event) {

        event.preventDefault();

        showError('');


        // ==================================================
        // Get values
        // ==================================================

        const fullName =
            form.fullName.value.trim();


        const email =
            form.email.value
                .trim()
                .toLowerCase();


        const phone =
            form.phone.value.trim();


        const password =
            form.password.value;


        // ==================================================
        // Full Name
        // ==================================================

        if (!fullName) {

            showError(
                'Please enter your full name'
            );

            return;
        }


        // First + Last name
        if (
            fullName.split(/\s+/).length < 2
        ) {

            showError(
                'Please enter your full name (first and last name)'
            );

            return;
        }


        // No numbers / symbols
        if (
            hasAny(
                fullName,
                nameBlocked
            )
        ) {

            showError(
                'Name must contain letters only'
            );

            return;
        }


        // ==================================================
        // Email
        // ==================================================

        if (!email) {

            showError(
                'Please enter your email'
            );

            return;
        }


        if (email.includes(' ')) {

            showError(
                'Email must not contain spaces'
            );

            return;
        }


        const atPosition =
            email.indexOf('@');


        if (
            atPosition < 1 ||
            atPosition !== email.lastIndexOf('@')
        ) {

            showError(
                'Email must have one @ with a name before it'
            );

            return;
        }


        const dotPosition =
            email.lastIndexOf('.');


        if (
            dotPosition < atPosition + 2 ||
            email.endsWith('.')
        ) {

            showError(
                'Email must look like name@gmail.com'
            );

            return;
        }


        // ==================================================
        // Phone
        // ==================================================

        if (!phone) {

            showError(
                'Please enter your phone number'
            );

            return;
        }


        if (phone.length !== 10) {

            showError(
                'Phone number must be exactly 10 digits'
            );

            return;
        }


        for (let i = 0; i < phone.length; i++) {

            if (!digits.includes(phone[i])) {

                showError(
                    'Phone number must contain digits only'
                );

                return;
            }
        }


        // ==================================================
        // Password
        // ==================================================

        if (password.length < 8) {

            showError(
                'Password must be at least 8 characters'
            );

            return;
        }


        if (password.includes(' ')) {

            showError(
                'Password must not contain spaces'
            );

            return;
        }


        // Uppercase
        if (
            password === password.toLowerCase()
        ) {

            showError(
                'Password must contain an uppercase letter'
            );

            return;
        }


        // Lowercase
        if (
            password === password.toUpperCase()
        ) {

            showError(
                'Password must contain a lowercase letter'
            );

            return;
        }


        // Number
        if (
            !hasAny(password, digits)
        ) {

            showError(
                'Password must contain a number'
            );

            return;
        }


        // Special character
        if (
            !hasAny(password, specials)
        ) {

            showError(
                'Password must contain a special character (!@#$...)'
            );

            return;
        }


        // ==================================================
        // Terms
        // ==================================================

        if (!form.terms.checked) {

            showError(
                'You must agree to the terms'
            );

            return;
        }


        // ==================================================
        // Add User
        // ==================================================

        try {

            await addUser(
                fullName,
                email,
                phone,
                password
            );

        } catch (error) {

            console.error(error);

            showError(
                error.message ||
                'Could not create account'
            );

            return;
        }


        // ==================================================
        // Clear old login
        // ==================================================

        document.cookie =
            'currentUser=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

        localStorage.removeItem(
            'loggedInUser'
        );


        // ==================================================
        // Success
        // ==================================================

        alert(
            'Account created successfully'
        );


        // Go to login
        window.location.href =
            './login.html';
    }
);


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