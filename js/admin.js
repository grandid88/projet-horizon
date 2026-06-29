/* ==========================================================
   PROJET HORIZON — admin.js
   Interface organisateur
   Version 1.0
========================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/* --- Firebase --- */
const firebaseConfig = {
  apiKey:            "AIzaSyCINy6uUXI-mY9d4pKB9JIDQM-J9yEBG10",
  authDomain:        "projet-horizon-8746b.firebaseapp.com",
  databaseURL:       "https://projet-horizon-8746b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "projet-horizon-8746b",
  storageBucket:     "projet-horizon-8746b.firebasestorage.app",
  messagingSenderId: "864203948873",
  appId:             "1:864203948873:web:1fb41194ab8eff11239098"
};

const firebaseApp = initializeApp(firebaseConfig);
const db          = getDatabase(firebaseApp);

/* ==========================================================
   PIN
========================================================== */

const PIN_SECRET = "2627"; /* ← Code PIN : année du mariage ! */
var   pinValue   = "";

function initPin() {
  document.querySelectorAll(".pin-key").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var val = btn.getAttribute("data-val");
      if      (val === "clear") { pinValue = ""; }
      else if (val === "del")   { pinValue = pinValue.slice(0, -1); }
      else if (pinValue.length < 4) { pinValue += val; }
      updatePinDisplay();
      if (pinValue.length === 4) checkPin();
    });
  });
}

function updatePinDisplay() {
  for (var i = 0; i < 4; i++) {
    var dot = document.getElementById("dot-" + i);
    dot.classList.toggle("filled", i < pinValue.length);
    dot.classList.remove("error");
  }
  document.getElementById("pin-error").textContent = "";
}

function checkPin() {
  if (pinValue === PIN_SECRET) {
    showAdminScreen();
  } else {
    for (var i = 0; i < 4; i++) {
      document.getElementById("dot-" + i).classList.add("error");
    }
    document.getElementById("pin-error").textContent = "Code incorrect — réessayez";
    setTimeout(function() { pinValue = ""; updatePinDisplay(); }, 1000);
  }
}

/* ==========================================================
   ÉCRAN ADMIN
========================================================== */

function showAdminScreen() {
  document.getElementById("pin-screen").classList.add("hidden");
  document.getElementById("admin-screen").classList.remove("hidden");
  document.getElementById("admin-screen").classList.add("active");
  initAdmin();
}

async function initAdmin() {
  await loadMissions();
  initFlashForm();
  listenRanking();
  listenFlashStatus();

  document.getElementById("btn-logout").addEventListener("click", function() {
    document.getElementById("admin-screen").classList.add("hidden");
    document.getElementById("pin-screen").classList.remove("hidden");
    pinValue = "";
    updatePinDisplay();
  });
}

/* --- Charger les missions --- */
var missionsData = [];

async function loadMissions() {
  var res = await fetch("data/missions.json");
  var data = await res.json();
  missionsData = data.missions;
  renderMissionsList();
  renderPresets();
}

/* --- Liste missions permanentes --- */
function renderMissionsList() {
  var container = document.getElementById("admin-missions-list");
  container.innerHTML = missionsData.map(function(m) {
    return '<div class="admin-mission-row">' +
      '<div class="admin-mission-dot" style="background:' + m.couleur + '"></div>' +
      '<div class="admin-mission-info">' +
        '<div class="admin-mission-title">' + m.titre + '</div>' +
        '<div class="admin-mission-km">+' + m.km + ' km · ' +
          (m.type === "sequentiel" ? "🔒 Séquentielle" : "✅ Permanente") +
        '</div>' +
      '</div>' +
      '<div class="admin-mission-count" id="count-' + m.id + '">— validations</div>' +
    '</div>';
  }).join("");
}

/* --- Missions prédéfinies pour Flash --- */
var presets = [
  { titre: "Photographier la première danse !",  description: "Capturez ce moment magique !",           km: 200, duree: 5  },
  { titre: "Filmez les applaudissements !",       description: "Le gâteau arrive — immortalisez-le !",   km: 150, duree: 5  },
  { titre: "Selfie avec les mariés !",            description: "Profitez de ce moment unique !",         km: 250, duree: 10 },
  { titre: "La plus belle table !",               description: "Photographiez votre table décorée.",     km: 100, duree: 5  },
  { titre: "Trouvez les 4 témoins !",             description: "Rassemblez-les pour une photo de groupe !", km: 180, duree: 10 }
];

function renderPresets() {
  var grid = document.getElementById("presets-grid");
  grid.innerHTML = presets.map(function(p, i) {
    return '<button class="preset-btn" data-preset="' + i + '">' +
      '<span>' + p.titre + '</span>' +
      '<span class="preset-km">+' + p.km + ' km</span>' +
    '</button>';
  }).join("");

  grid.querySelectorAll(".preset-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var p = presets[parseInt(btn.getAttribute("data-preset"))];
      document.getElementById("flash-titre").value  = p.titre;
      document.getElementById("flash-desc").value   = p.description;
      document.getElementById("flash-km").value     = p.km;
      document.getElementById("flash-duree").value  = p.duree;
    });
  });
}

/* ==========================================================
   FORMULAIRE FLASH
========================================================== */

var flashCounter = 0;

function initFlashForm() {
  document.getElementById("btn-trigger-flash").addEventListener("click", async function() {
    var titre = document.getElementById("flash-titre").value.trim();
    var desc  = document.getElementById("flash-desc").value.trim();
    var km    = parseInt(document.getElementById("flash-km").value) || 150;
    var duree = parseInt(document.getElementById("flash-duree").value) || 5;

    if (!titre) {
      alert("Saisissez un titre pour la mission flash !");
      return;
    }

    flashCounter++;
    var mission = {
      id:          "flash_" + Date.now(),
      titre:       titre,
      description: desc || "Accomplissez cette mission rapidement !",
      km:          km,
      duree:       duree,
      active:      true,
      startedAt:   Date.now()
    };

    await set(ref(db, "flash_mission"), mission);

    showFlashStatus("⚡ Mission Flash active — " + duree + " min · +" + km + " km", "active");
  });

  document.getElementById("btn-close-flash").addEventListener("click", async function() {
    await set(ref(db, "flash_mission"), null);
    showFlashStatus("✅ Mission Flash clôturée", "closed");
    setTimeout(function() {
      var s = document.getElementById("flash-status");
      s.style.display = "none";
      s.className = "flash-status";
    }, 3000);
  });
}

function showFlashStatus(msg, type) {
  var s = document.getElementById("flash-status");
  s.textContent  = msg;
  s.className    = "flash-status " + type;
  s.style.display = "block";
}

/* ==========================================================
   ÉCOUTES FIREBASE
========================================================== */

function listenRanking() {
  onValue(ref(db, "passagers"), function(snapshot) {
    var data = snapshot.val();
    if (!data) {
      document.getElementById("admin-ranking").innerHTML =
        '<div class="ranking-title">🏆 Classement en direct</div>' +
        '<p style="color:rgba(255,255,255,0.3);font-size:13px;">Aucun voyageur inscrit pour l\'instant.</p>';
      updateStats([], 0, 0);
      return;
    }

    var passengers = Object.values(data).sort(function(a, b) { return b.km - a.km; });
    var totalKm    = passengers.reduce(function(acc, p) { return acc + (p.km||0); }, 0);
    var totalMiss  = passengers.reduce(function(acc, p) { return acc + (p.missions||0); }, 0);

    updateStats(passengers, totalKm, totalMiss);
    renderAdminRanking(passengers);
  });
}

function updateStats(passengers, totalKm, totalMissions) {
  document.getElementById("stat-voyageurs").textContent = passengers.length;
  document.getElementById("stat-missions").textContent  = totalMissions;
  document.getElementById("stat-km").textContent        = totalKm.toLocaleString();
}

function renderAdminRanking(passengers) {
  var widget = document.getElementById("admin-ranking");
  widget.innerHTML = '<div class="ranking-title">🏆 Classement en direct</div>' +
    passengers.slice(0, 10).map(function(r, i) {
      var pos = i===0?"🏆":i===1?"🥈":i===2?"🥉":(i+1);
      var cls = i===0?"gold":i===1?"silver":i===2?"bronze":"";
      return '<div class="ranking-row">' +
        '<span class="rank-pos ' + cls + '">' + pos + '</span>' +
        '<span class="rank-name">' + r.prenom +
          ' <small style="opacity:.4">· ' + r.table + '</small></span>' +
        '<span class="rank-km">' + (r.km||0).toLocaleString() + ' km</span>' +
      '</div>';
    }).join("");
}

function listenFlashStatus() {
  onValue(ref(db, "flash_mission"), function(snapshot) {
    var flash = snapshot.val();
    if (flash && flash.active) {
      showFlashStatus("⚡ Mission Flash active : " + flash.titre, "active");
    }
  });
}

/* ==========================================================
   DÉMARRAGE
========================================================== */

window.addEventListener("load", function() {
  console.log("⚙️ Admin HORIZON v1.0");
  initPin();
});
