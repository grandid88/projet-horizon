/*
======================================================

PROJET HORIZON
I&D AIRLINES

Application principale

Version : 0.3.0

======================================================
*/

// ====================================================
// APPLICATION
// ====================================================

const Horizon = {
  splashScreen: null,

  passportScreen: null,

  init() {
    console.log("✈ Projet HORIZON v0.3.0");

    this.cacheDom();

    this.launchSplashScreen();
  },

  cacheDom() {
    this.splashScreen = document.getElementById("splash-screen");

    this.passportScreen = document.getElementById("passport-cover");
  },

  launchSplashScreen() {
    setTimeout(() => {
      // Masquer le Splash

      this.splashScreen.classList.remove("active");

      this.splashScreen.classList.add("hidden");

      // Afficher le Passeport

      this.passportScreen.classList.remove("hidden");

      this.passportScreen.classList.add("active");

      // Initialiser le composant Passeport

      window.passport = new Passport("#passport");
    }, 2200);
  },
};

// ====================================================
// DEMARRAGE
// ====================================================

window.addEventListener("load", () => {
  Horizon.init();
});
