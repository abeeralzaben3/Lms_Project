export function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

export function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export default async function getStudents() {
    let students = getData('students');

    if (!students.length) {
        const response = await fetch('http://localhost:3000/students');

        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }

        students = await response.json();

        saveData('students', students);
    }

    return students;
}