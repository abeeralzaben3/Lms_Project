// ====================Set & Get Cookie ====================
export class Cookie {

    constructor(name, value, days) {

        this.name = name;
        this.value = value;
        this.days = days;
    }

    setCookie() {

        document.cookie =
            `${this.name}=${encodeURIComponent(this.value)}; max-age=${this.days * 24 * 60 * 60}; path=/`;
    }

    getCookie(name) {

        const cookies =
            document.cookie.split("; ");


        for (let cookie of cookies) {

            const [
                key,
                value
            ] = cookie.split("=");


            if (key === name) {

                return decodeURIComponent(value);
            }
        }


        return null;
    }
}
