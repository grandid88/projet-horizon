/* ==========================================================
   PROJET HORIZON — app.js
   Application principale — Chef d'orchestre des écrans
   Version 1.1
========================================================== */

const Horizon = {

  screens: {},

  init() {
    console.log("✈ Projet HORIZON — Mission Paradis v1.1");

    this.cacheDom();
    this.generateBarcode();

    /* Si un passager existe déjà → aller direct à l'app */
    const passenger = Storage.load();
    if (passenger) {
      this.showApp(passenger);
      return;
    }

    this.launchSplashScreen();
  },

  cacheDom() {
    this.screens = {
      splash:   document.getElementById("splash-screen"),
      boarding: document.getElementById("boarding-screen"),
      register: document.getElementById("register-screen"),
      app:      document.getElementById("app-screen")
    };

    /* ✅ FIX : listener attaché via délégation sur le document
       pour éviter le problème de timing avec les écrans cachés */
    document.addEventListener("click", (e) => {
      if (e.target.id === "btn-start-adventure") {
        this.showRegister();
      }
    });
  },

  generateBarcode() {
    const container = document.getElementById("barcode-deco");
    if (!container) return;
    const widths = [3,2,1,3,1,2,2,1,3,2,1,1,2,3,1,2,1,3,2,1,3,1,2,2,3,1,2,1,3,2,1,2,3,1,2];
    widths.forEach(w => {
      const bar = document.createElement("span");
      bar.style.height = (w === 3 ? "36px" : w === 2 ? "28px" : "20px");
      container.appendChild(bar);
    });
  },

  /* ====================================================
     TRANSITIONS ENTRE ÉCRANS
  ===================================================== */

  showScreen(name) {
    Object.values(this.screens).forEach(s => {
      s.classList.add("hidden");
      s.classList.remove("active");
    });
    this.screens[name].classList.remove("hidden");
    this.screens[name].classList.add("active");
  },

  launchSplashScreen() {
    this.showScreen("splash");
    setTimeout(() => this.showBoarding(), 2400);
  },

  showBoarding() {
    this.showScreen("boarding");
  },

  showRegister() {
    this.showScreen("register");
    Register.init();
  },

  showApp(passenger) {
    const p = passenger || Storage.load();
    this.showScreen("app");

    if (p) {
      const msg = document.getElementById("welcome-msg");
      if (msg) {
        msg.textContent = `Bonjour ${p.prenom} · Table ${p.table} · ${p.km} km`;
      }
    }
  }

};

window.addEventListener("load", () => Horizon.init());
