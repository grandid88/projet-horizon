/*
======================================================

PROJET HORIZON
I&D AIRLINES

Application principale

Version : 0.1

======================================================
*/


// ====================================================
// ELEMENTS HTML
// ====================================================

const splashScreen = document.querySelector("#splash-screen");

const passportCover = document.querySelector("#passport-cover");

const openPassportButton =
    document.querySelector("#btn-open-passport");


// ====================================================
// INITIALISATION
// ====================================================

window.addEventListener("load", initializeApp);


// ====================================================
// DEMARRAGE
// ====================================================

function initializeApp() {

    console.log("✈ Projet HORIZON V0.1");

    launchSplashScreen();

}


// ====================================================
// SPLASH SCREEN
// ====================================================

function launchSplashScreen() {

    setTimeout(() => {

        splashScreen.classList.remove("active");

        splashScreen.classList.add("hidden");

        passportCover.classList.remove("hidden");

        passportCover.classList.add("active");

    }, 2200);

}


// ====================================================
// EVENEMENTS
// ====================================================

openPassportButton.addEventListener("click", () => {

    alert("Bienvenue à bord !");

});