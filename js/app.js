/*
======================================================

PROJET HORIZON
I&D AIRLINES

Application principale

Version : 0.2.0

======================================================
*/

// ====================================================
// ELEMENTS HTML
// ====================================================

const splashScreen = document.getElementById("splash-screen");
const passportScreen = document.getElementById("passport-cover");

// ====================================================
// DEMARRAGE
// ====================================================

window.addEventListener("load", initializeApp);

function initializeApp() {
  console.log("✈ Projet HORIZON v0.2.0");

  launchSplashScreen();
}

// ====================================================
// SPLASH SCREEN
// ====================================================

function launchSplashScreen() {
  setTimeout(() => {
    // Masquer le Splash
    splashScreen.classList.remove("active");
    splashScreen.classList.add("hidden");

    // Afficher l'écran Passeport
    passportScreen.classList.remove("hidden");
    passportScreen.classList.add("active");

    // Initialiser le composant Passeport
    window.passport = new Passport("#passport");
  }, 2200);
}
