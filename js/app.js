/* ==========================================================
   PROJET HORIZON — app.js
   Version 2.0 — Réécriture procédurale
========================================================== */

/* --- Génération du code-barres décoratif --- */
function generateBarcode() {
  const container = document.getElementById("barcode-deco");
  if (!container) return;
  const widths = [3,2,1,3,1,2,2,1,3,2,1,1,2,3,1,2,1,3,2,1,3,1,2,2,3,1,2,1,3,2,1,2,3,1,2];
  widths.forEach(w => {
    const bar = document.createElement("span");
    bar.style.height = (w === 3 ? "36px" : w === 2 ? "28px" : "20px");
    container.appendChild(bar);
  });
}

/* --- Afficher un écran, cacher les autres --- */
function showScreen(id) {
  var ids = ["splash-screen", "boarding-screen", "register-screen", "app-screen"];
  ids.forEach(function(screenId) {
    var el = document.getElementById(screenId);
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("active");
    }
  });
  var target = document.getElementById(id);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
  }
  console.log("Écran affiché :", id);
}

/* --- Écran d'enregistrement --- */
function showRegister() {
  showScreen("register-screen");
  initRegister();
}

/* --- Écran app --- */
function showApp() {
  var p = Storage.load();
  showScreen("app-screen");
  if (p) {
    var msg = document.getElementById("welcome-msg");
    if (msg) msg.textContent = "Bonjour " + p.prenom + " · Table " + p.table + " · " + p.km + " km";
  }
}

/* --- Enregistrement --- */
function initRegister() {
  var prenomInput = document.getElementById("input-prenom");
  var btnRegister = document.getElementById("btn-register");
  var selectedTable = null;

  function checkReady() {
    var prenomOk = prenomInput && prenomInput.value.trim().length >= 2;
    var tableOk  = selectedTable !== null;
    if (btnRegister) {
      if (prenomOk && tableOk) {
        btnRegister.classList.add("ready");
      } else {
        btnRegister.classList.remove("ready");
      }
    }
  }

  if (prenomInput) {
    prenomInput.addEventListener("input", checkReady);
  }

  var radios = document.querySelectorAll(".table-option input[type='radio']");
  radios.forEach(function(radio) {
    radio.addEventListener("change", function() {
      selectedTable = radio.value;
      checkReady();
    });
  });

  if (btnRegister) {
    btnRegister.addEventListener("click", function() {
      var prenom = prenomInput ? prenomInput.value.trim() : "";
      if (!prenom || !selectedTable) return;
      Storage.createPassenger(prenom, selectedTable);
      showApp();
    });
  }
}

/* --- Démarrage --- */
window.addEventListener("load", function() {
  console.log("✈ Projet HORIZON — Mission Paradis v2.0");

  generateBarcode();

  /* Passager déjà enregistré ? */
  var passenger = Storage.load();
  if (passenger) {
    showApp();
    return;
  }

  /* Splash → Boarding */
  showScreen("splash-screen");

  setTimeout(function() {
    showScreen("boarding-screen");

    /* Bouton Commencer l'aventure */
    var btn = document.getElementById("btn-start-adventure");
    console.log("Bouton trouvé :", btn);
    if (btn) {
      btn.addEventListener("click", function() {
        console.log("Clic sur Commencer l'aventure !");
        showRegister();
      });
    }

  }, 2400);

});
