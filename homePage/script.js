const accountMinu = document.getElementById("accountMinu");
const account = document.getElementById("account");
const burgerMinu=document.getElementById("burgerMinu");
const sideBar=document.getElementById("sideBar");
// Account Minu
account.addEventListener("click",function(e){
accountMinu.classList.toggle("activeAccount");
})

burgerMinu.addEventListener('click', function(e){
    sideBar.classList.toggle("activeSide");
    
    
});