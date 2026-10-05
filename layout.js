import { Cookie } from "../cookies/cookies.js";

// ==================================================
// layout.js  -  header + account menu + search + burger + sidebar + nav
// Everything (HTML + CSS + JS) is inside this one file.
//
// USE: put this file in a folder next to your other page folders
//      (example: /layout/layout.js), then in any page:
//
//   <div class="mainCountainer">
//       <main class="content"> ...page content... </main>
//   </div>
//   <script type="module">
//       import { userId } from "../layout/layout.js";
//   </script>
//
// The header, search, burger and sidebar appear automatically.
// ==================================================

// ---------- page links ----------
// resolved from THIS file's location, so they work from any folder.
// change the folder names here if yours are different.
export const LINKS = {
    dashboard:   new URL("../dashboard/dashboard.html",     import.meta.url).href,
    students:    new URL("../student/students.html",        import.meta.url).href,
    assessments: new URL("../assessments/assessments.html", import.meta.url).href,
    reports:     new URL("../reports/reports.html",         import.meta.url).href,
    settings:    new URL("../settings/settings.html",       import.meta.url).href,
    login:       new URL("../login/login.html",             import.meta.url).href
};

// ---------- cookies ----------
const userCookie = new Cookie();
export const currentUser = userCookie.getCookie("currentUser");
export const userEmail = userCookie.getCookie("userEmail");
export const userId = userCookie.getCookie("userId");

// ---------- search handler (optional) ----------
// default: go to the students page with ?search=...
let searchHandler = query => {
    if (query) window.location.href = `${LINKS.students}?search=${encodeURIComponent(query)}`;
};
export const setSearchHandler = fn => { searchHandler = fn; };

// ---------- CSS ----------
const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; text-decoration: none; }

body {
    font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
    line-height: 1.7;
    background-color: #F5F6FF;
    color: #20204D;
}

.btn { border: none; }

.mainCountainer {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 4fr;
    grid-template-rows: auto 1fr;
    grid-template-areas: "side header" "side main";
}

.mainCountainer > main { grid-area: main; min-width: 0; }

/* ---------- header ---------- */
.header {
    grid-area: header;
    display: flex;
    background-color: #FFFFFF;
    height: 70px;
    position: sticky;
    top: 0;
    justify-content: end;
    border-bottom: 1px solid #E1E3F0;
    box-shadow: 0 4px 15px rgba(101, 88, 245, 0.08);
    z-index: 20;
}

.headerCountent {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 10px;
    width: 100%;
    min-width: 0;
    flex-direction: row-reverse;
    gap: 20px;
}

/* ---------- burger ---------- */
.burgerMinu {
    flex-direction: column;
    max-width: 50px;
    width: 40px;
    height: 25px;
    justify-content: space-between;
    cursor: pointer;
    display: none;
}

.borderMinu { border-bottom: 2px solid #c7cbe4; }

/* ---------- account ---------- */
.account {
    height: 50px;
    min-width: 100px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 10px;
    position: relative;
    background-color: #FFFFFF;
    border: 1px solid #E1E3F0;
    border-radius: 20px;
    box-shadow: 0 4px 15px rgba(101, 88, 245, 0.10);
    transition: 0.3s;
    cursor: pointer;
}

.account:hover {
    background: linear-gradient(90deg, rgba(101, 88, 245, 0.12), rgba(155, 61, 240, 0.06));
    color: #6558F5;
    box-shadow: 0 5px 15px rgba(101, 88, 245, 0.08);
}

.accountMinu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 200px;
    padding: 10px;
    background-color: #FFFFFF;
    border: 1px solid #E1E3F0;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(101, 88, 245, 0.15);
    z-index: 100;
    display: none;
}

.activeAccount { display: block; }

.logo {
    width: 35px;
    height: 35px;
    background: linear-gradient(135deg, #6558F5, #9B3DF0);
    border-radius: 50%;
    text-align: center;
    align-content: center;
    font-size: 20px;
    color: #FFFFFF;
    box-shadow: 0 4px 12px rgba(101, 88, 245, 0.30);
}

.options {
    display: flex;
    color: #20204D;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    transition: 0.3s;
    cursor: pointer;
}

.options:hover { background-color: #F1EFFF; color: #6558F5; }

.headerName { font-size: 13px; font-weight: bold; color: #20204D; }

/* ---------- search ---------- */
.search {
    display: flex;
    height: 40px;
    width: 400px;
    min-width: 0;
    background-color: #F8F8FF;
    border-radius: 20px;
    align-items: center;
    border: 1px solid #E1E3F0;
    transition: 0.3s;
}

.search:focus-within {
    border-color: #6558F5;
    box-shadow: 0 0 0 4px rgba(101, 88, 245, 0.10);
}

.searchInput {
    border: none;
    width: 90%;
    height: 100%;
    background-color: transparent;
    padding: 0 10px;
    color: #20204D;
}

.searchInput:focus { outline: none; }

.icons {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #EEEAFE, #E4DDFD);
    color: #6558F5;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(101, 88, 245, 0.12);
    cursor: pointer;
}

/* ---------- sidebar ---------- */
.sideBar {
    grid-area: side;
    height: 100vh;
    position: sticky;
    top: 0;
    background-color: #FFFFFF;
    border-right: 1px solid #E1E3F0;
    box-shadow: 4px 0 20px rgba(101, 88, 245, 0.07);
    z-index: 10;
}

.sideHeader {
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: 5px 10px;
    text-align: center;
    align-items: center;
    margin-top: 15px;
    margin-bottom: 20px;
}

.role {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6558F5, #9B3DF0);
    color: #FFFFFF;
    text-align: center;
    align-content: center;
    box-shadow: 0 4px 10px rgba(101, 88, 245, 0.25);
}

.nav { width: 100%; }

.linksCount {
    display: flex;
    flex-direction: column;
    gap: 10px;
    list-style: none;
    width: 100%;
}

.liLinks {
    padding: 12px;
    cursor: pointer;
    color: #20204D;
    border-radius: 12px;
    margin: 0 10px;
    transition: 0.3s;
    display: block;
}

.liLinks:hover, .liLinks.active {
    background: linear-gradient(90deg, rgba(101, 88, 245, 0.12), rgba(155, 61, 240, 0.06));
    box-shadow: 0 5px 15px rgba(101, 88, 245, 0.08);
    color: #6558F5;
}

.liLinks:hover { transform: translateX(-3px); }

/* ---------- mobile ---------- */
@media (max-width: 640px) {
    .mainCountainer {
        grid-template-columns: 1fr;
        grid-template-rows: 70px 1fr;
        grid-template-areas: "header" "main";
    }

    .mainCountainer > main { width: 100%; margin-top: 70px; }

    .header { position: fixed; top: 0; left: 0; right: 0; width: 100%; height: 70px; z-index: 20; }
    .headerCountent { gap: 10px; }

    .account { min-width: 50px; justify-content: center; gap: 2px; }
    .headerName { display: none; }

    .burgerMinu { display: flex; width: 40px; min-width: 40px; height: 25px; }

    .search { width: 100%; max-width: 195px; flex: 1; }
    .searchInput { min-width: 0; }

    .sideBar { display: none; }

    .activeSide {
        display: block;
        position: fixed;
        top: 70px;
        left: 0;
        bottom: 0;
        width: 250px;
        min-height: calc(100vh - 70px);
        background-color: #FFFFFF;
        z-index: 30;
        box-shadow: 5px 0 20px rgba(101, 88, 245, 0.15);
    }
}
`;

// ---------- HTML ----------
const HEADER_HTML = `
<div class="headerCountent">

    <div class="account" id="account">
        <div class="logo" id="logo"></div>
        <div class="headerName" id="headerName"></div>
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"></path>
            </svg>
        </div>

        <div class="accountMinu" id="accountMinu">
            <p class="options" id="settings">Settings</p>
            <p class="options" id="logout">Log out</p>
        </div>
    </div>

    <div class="search">
        <button class="icons btn" id="searchBtn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21 21-4.34-4.34"></path>
                <circle cx="11" cy="11" r="8"></circle>
            </svg>
        </button>
        <input type="text" class="searchInput" id="searchInput" placeholder="Students Search">
    </div>

    <div class="burgerMinu" id="burgerMinu">
        <span class="borderMinu"></span>
        <span class="borderMinu"></span>
        <span class="borderMinu"></span>
    </div>

</div>`;

const SIDEBAR_HTML = `
<div class="sideHeader">
    <div class="role">T</div>
    <p class="techName" id="techName"></p>
</div>

<nav class="nav">
    <ul class="linksCount">
        <li class="liLinks" id="nav-dashboard">Dashboard</li>
        <li class="liLinks" id="nav-students">Students</li>
        <li class="liLinks" id="nav-assessments">Assessments</li>
        <li class="liLinks" id="nav-reports">Reports</li>
    </ul>
</nav>`;

// ---------- build the layout ----------
function buildLayout() {
    const $ = id => document.getElementById(id);

    // css
    const style = document.createElement("style");
    style.id = "layoutStyle";
    style.textContent = CSS;
    document.head.append(style);

    // the page must have a <main>; wrap it in .mainCountainer if needed
    const main = document.querySelector("main");
    if (!main) return console.error("layout.js: add a <main> element with your page content.");

    let container = main.closest(".mainCountainer");
    if (!container) {
        container = document.createElement("div");
        container.className = "mainCountainer";
        main.replaceWith(container);
        container.append(main);
    }

    // remove an old header/sidebar if the page still has them
    container.querySelectorAll(":scope > header, :scope > aside").forEach(el => el.remove());

    const header = document.createElement("header");
    header.className = "header";
    header.innerHTML = HEADER_HTML;

    const sideBar = document.createElement("aside");
    sideBar.className = "sideBar";
    sideBar.id = "sideBar";
    sideBar.innerHTML = SIDEBAR_HTML;

    container.prepend(header, sideBar);

    // name + logo
    $("headerName").textContent = currentUser;
    $("techName").textContent = currentUser;
    $("logo").textContent = currentUser.slice(0, 2).toUpperCase();

    // account menu
    const accountMinu = $("accountMinu");
    $("account").addEventListener("click", e => { e.stopPropagation(); accountMinu.classList.toggle("activeAccount"); });
    $("settings").addEventListener("click", () => (window.location.href = LINKS.settings));
    $("logout").addEventListener("click", () => {
        ["currentUser", "userEmail", "userId"].forEach(name => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
        window.location.href = LINKS.login;
    });

    // burger + sidebar
    $("burgerMinu").addEventListener("click", e => { e.stopPropagation(); sideBar.classList.toggle("activeSide"); });
    sideBar.addEventListener("click", e => e.stopPropagation());

    const closeMenus = () => {
        accountMinu.classList.remove("activeAccount");
        sideBar.classList.remove("activeSide");
    };
    document.addEventListener("click", closeMenus);
    document.addEventListener("keydown", e => e.key === "Escape" && closeMenus());

    // nav links (+ highlight the current page)
    ["dashboard", "students", "assessments", "reports"].forEach(name => {
        const item = $("nav-" + name);
        item.addEventListener("click", () => (window.location.href = LINKS[name]));
        if (new URL(LINKS[name]).pathname === location.pathname) item.classList.add("active");
    });

    // search
    const searchInput = $("searchInput");
    const runSearch = () => searchHandler(searchInput.value.trim());
    $("searchBtn").addEventListener("click", runSearch);
    searchInput.addEventListener("keydown", e => e.key === "Enter" && runSearch());
}

// ---------- start ----------
if (!currentUser || !userId) {
    window.location.href = LINKS.login;      // not logged in
} else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildLayout);
} else {
    buildLayout();
}