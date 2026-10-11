export async function fetchApi(object) {
    try {
        const response = await fetch(
            `http://localhost:3000/${object}`
        );

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        localStorage.setItem(
            object,
            JSON.stringify(data)
        );

        return data;

    } catch (error) {
        console.error("Fetch API Error:", error);
        return [];
    }
}