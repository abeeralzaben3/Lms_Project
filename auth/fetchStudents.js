'use strict';


// ======================================================
// LOCAL STORAGE
// ======================================================

export function getData(key) {

    try {

        const data =
            localStorage.getItem(key);

        if (!data) {
            return [];
        }

        return JSON.parse(data);

    } catch (error) {

        console.error(
            `Error reading ${key}:`,
            error
        );

        return [];
    }
}


export function saveData(
    key,
    value
) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}


// ======================================================
// COOKIE
// ======================================================

export function setCookie(
    name,
    value,
    days = null
) {

    let cookie =
        `${name}=${encodeURIComponent(value)}; path=/`;


    if (days !== null) {

        const date =
            new Date();

        date.setTime(
            date.getTime() +
            days * 24 * 60 * 60 * 1000
        );

        cookie +=
            `; expires=${date.toUTCString()}`;
    }


    document.cookie =
        cookie;
}


export function getCookie(name) {

    const cookies =
        document.cookie.split('; ');


    const cookie =
        cookies.find(
            row =>
                row.startsWith(
                    name + '='
                )
        );


    if (!cookie) {
        return null;
    }


    return decodeURIComponent(
        cookie.substring(
            name.length + 1
        )
    );
}


export function deleteCookie(name) {

    document.cookie =
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}


// ======================================================
// LOGIN USER
// ======================================================

export function saveLoggedInUser(
    user,
    days = null
) {

    const safeUser = {
        ...user
    };


    delete safeUser.password;


    setCookie(
        'currentUser',
        safeUser.email,
        days
    );


    localStorage.setItem(
        'loggedInUser',
        JSON.stringify(safeUser)
    );
}


export function getLoggedInUser() {

    try {

        const user =
            localStorage.getItem(
                'loggedInUser'
            );


        return user
            ? JSON.parse(user)
            : null;

    } catch {

        return null;
    }
}


export function getCurrentUser() {

    return getCookie(
        'currentUser'
    );
}


export function logout() {

    deleteCookie(
        'currentUser'
    );

    localStorage.removeItem(
        'loggedInUser'
    );
}


// ======================================================
// SERVER DATA
// ======================================================

export async function loadFromServer(
    key
) {

    const localData =
        getData(key);


    if (localData.length) {

        return localData;
    }


    try {

        const response =
            await fetch(
                `http://localhost:3000/${key}`
            );


        if (!response.ok) {

            throw new Error(
                `Failed to fetch ${key}`
            );

        }


        const data =
            await response.json();


        saveData(
            key,
            data
        );


        return data;

    } catch (error) {

        console.error(
            `Error loading ${key}:`,
            error
        );

        return [];
    }
}


// ======================================================
// INSTRUCTORS
// ======================================================

export async function getInstructors() {

    return await loadFromServer(
        'instructors'
    );
}


// ======================================================
// COURSES
// ======================================================

export async function getCourses() {

    return await loadFromServer(
        'courses'
    );
}


// ======================================================
// STUDENTS
// ======================================================

export async function getStudents() {

    return await loadFromServer(
        'students'
    );
}


// ======================================================
// LOGIN
// ======================================================

export async function loginUser(
    email,
    password
) {

    const cleanEmail =
        email
            .trim()
            .toLowerCase();


    // ------------------------------------------
    // Local registered users
    // ------------------------------------------

    const users =
        getData('users');


    const localUser =
        users.find(
            user =>
                user.email &&
                user.email
                    .toLowerCase() ===
                    cleanEmail &&
                String(user.password) ===
                    String(password)
        );


    if (localUser) {

        return {
            ...localUser,
            role: 'instructor'
        };
    }


    // ------------------------------------------
    // Instructors
    // ------------------------------------------

    const instructors =
        await getInstructors();


    const instructor =
        instructors.find(
            user =>
                user.email &&
                user.email
                    .toLowerCase() ===
                    cleanEmail &&
                String(user.password) ===
                    String(password)
        );


    if (instructor) {

        return {
            ...instructor,
            role: 'instructor'
        };
    }


    // ------------------------------------------
    // Students
    // ------------------------------------------

    const students =
        await getStudents();


    const student =
        students.find(
            user =>
                user.email &&
                user.email
                    .toLowerCase() ===
                    cleanEmail &&
                String(user.password) ===
                    String(password)
        );


    if (student) {

        return {
            ...student,
            role: 'student'
        };
    }


    return null;
}


// ======================================================
// ADD USER / REGISTER INSTRUCTOR
// ======================================================

export async function addUser(user) {

    const cleanEmail =
        user.email
            .trim()
            .toLowerCase();


    // ------------------------------------------
    // Check users
    // ------------------------------------------

    const users =
        getData('users');


    const existingUser =
        users.find(
            item =>
                item.email &&
                item.email
                    .toLowerCase() ===
                    cleanEmail
        );


    if (existingUser) {

        throw new Error(
            'Email already exists'
        );
    }


    // ------------------------------------------
    // Check instructors
    // ------------------------------------------

    const instructors =
        await getInstructors();


    const existingInstructor =
        instructors.find(
            item =>
                item.email &&
                item.email
                    .toLowerCase() ===
                    cleanEmail
        );


    if (existingInstructor) {

        throw new Error(
            'Email already exists'
        );
    }


    // ------------------------------------------
    // Check students
    // ------------------------------------------

    const students =
        await getStudents();


    const existingStudent =
        students.find(
            item =>
                item.email &&
                item.email
                    .toLowerCase() ===
                    cleanEmail
        );


    if (existingStudent) {

        throw new Error(
            'Email already exists'
        );
    }


    // ------------------------------------------
    // New instructor
    // ------------------------------------------

    const newInstructor = {

        id:
            `INS${Date.now()}`,

        name:
            user.fullName,

        fullName:
            user.fullName,

        email:
            cleanEmail,

        phone:
            user.phone,

        password:
            user.password,

        role:
            'Instructor'

    };


    instructors.push(
        newInstructor
    );


    saveData(
        'instructors',
        instructors
    );


    return newInstructor;
}


// Default export

export default getStudents;