const accountMinu = document.getElementById("accountMinu");
const account = document.getElementById("account");
const burgerMinu=document.getElementById("burgerMinu");
const sideBar=document.getElementById("sideBar");
const attendanceChart = document.getElementById("attendanceChart");


// Account Minu
account.addEventListener("click",function(e){
accountMinu.classList.toggle("activeAccount");
})

burgerMinu.addEventListener('click', function(e){
    sideBar.classList.toggle("activeSide");
    
    
});
const data=[
                90,
                95,
                88,
                100,
                94
            ]
// chart

new Chart(attendanceChart, {

    type: "line",

    data: {

        labels: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday"
        ],

        datasets: [{

            label: "Present Students",

            data: [
                90,
                95,
                88,
                100,
                94
            ],

            borderWidth: 2,

            tension: 0.4,

            fill: false

        }]

    },

    options: {

        responsive: true,

        plugins: {

            legend: {
                display: true
            }

        },

        scales: {

            y: {

                beginAtZero: true

            }

        }

    }

});


// ==============================
// COMMITMENT CHART
// ==============================

const commitmentChart = document.getElementById("commitmentChart");

new Chart(commitmentChart, {

    type: "doughnut",

    data: {

        labels: [
            "Committed",
            "Not Committed"
        ],

        datasets: [{

            data: [
                94,
                6
            ],

            borderWidth: 0

        }]

    },

    options: {

        responsive: true,

        plugins: {

            legend: {

                position: "bottom"

            }

        }

    }

});