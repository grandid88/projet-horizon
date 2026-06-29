/* ==========================================================
   PROJET HORIZON — dashboard.js
   Dashboard TV — Temps réel
   Version 1.0
========================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue }
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

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

/* ==========================================================
   DONNÉES LOCALES
========================================================== */

var badgesData   = [];
var flashInterval = null;

/* Charger badges.json */
async function loadBadges() {
  var res  = await fetch("data/badges.json");
  var data = await res.json();
  badgesData = data.badges;
}

/* ==========================================================
   ÉCOUTES FIREBASE
========================================================== */

function listenPassengers() {
  onValue(ref(db, "passagers"), function(snapshot) {
    var data = snapshot.val();
    if (!data) {
      updateStats([], 0, 0, 0);
      renderRanking([]);
      renderTables([]);
      updatePlane(0);
      return;
    }

    var passengers = Object.values(data);
    var totalKm    = passengers.reduce(function(a, p) { return a + (p.km||0); }, 0);
    var totalMiss  = passengers.reduce(function(a, p) { return a + (p.missions||0); }, 0);
    var totalBadges = passengers.reduce(function(a, p) { return a + (p.badges||0); }, 0);

    var sorted = passengers.slice().sort(function(a, b) { return b.km - a.km; });

    updateStats(passengers, totalKm, totalMiss, totalBadges);
    renderRanking(sorted);
    renderTables(passengers);
    updatePlane(totalKm);
    renderBadges(passengers);
  });
}

function listenFlash() {
  onValue(ref(db, "flash_mission"), function(snapshot) {
    var flash = snapshot.val();
    handleFlash(flash);
  });
}

/* ==========================================================
   STATS
========================================================== */

function updateStats(passengers, totalKm, totalMiss, totalBadges) {
  animateStat("tv-stat-voyageurs", passengers.length);
  animateStat("tv-stat-missions",  totalMiss);
  animateStat("tv-stat-km",        totalKm.toLocaleString());
  animateStat("tv-stat-badges",    totalBadges);
}

function animateStat(id, value) {
  var el = document.getElementById(id);
  if (!el) return;
  if (el.textContent !== String(value)) {
    el.textContent = value;
    el.classList.remove("updated");
    void el.offsetWidth;
    el.classList.add("updated");
  }
}

/* ==========================================================
   AVION
========================================================== */

var KM_MAX = 2000; /* km total pour atteindre 100% */

function updatePlane(totalKm) {
  /* On utilise la moyenne des voyageurs pour la progression */
  var pct = Math.min(100, Math.round((totalKm / KM_MAX) * 100));
  var progress = document.getElementById("tv-plane-progress");
  var icon     = document.getElementById("tv-plane-icon");
  var pctEl    = document.getElementById("tv-plane-pct");

  if (progress) progress.style.width = pct + "%";
  if (icon)     icon.style.left = Math.max(0, pct - 4) + "%";
  if (pctEl)    pctEl.textContent = pct + "% du voyage accompli · " + totalKm.toLocaleString() + " km cumulés";
}

/* ==========================================================
   CLASSEMENT JOUEURS
========================================================== */

function renderRanking(sorted) {
  var list = document.getElementById("tv-ranking-list");
  if (!list) return;

  if (sorted.length === 0) {
    list.innerHTML = '<div class="tv-loading">En attente des voyageurs...</div>';
    return;
  }

  list.innerHTML = sorted.slice(0, 10).map(function(p, i) {
    var pos = i===0?"🏆":i===1?"🥈":i===2?"🥉":(i+1)+".";
    return '<div class="tv-rank-row">' +
      '<span class="tv-rank-pos">' + pos + '</span>' +
      '<div class="tv-rank-info">' +
        '<div class="tv-rank-name">' + p.prenom + '</div>' +
        '<div class="tv-rank-table">Table ' + p.table + '</div>' +
      '</div>' +
      '<span class="tv-rank-km">' + (p.km||0).toLocaleString() + ' km</span>' +
    '</div>';
  }).join("");
}

/* ==========================================================
   CLASSEMENT TABLES
========================================================== */

var TABLE_EMOJIS = {
  "Maurice": "🌴", "Tahiti": "🌺", "Martinique": "🦜",
  "Guadeloupe": "🌊", "Seychelles": "🐠", "La Réunion": "🌋",
  "Nouvelle-Calédonie": "🪸", "Sainte-Lucie": "🍹", "Mayotte": "🐢"
};

function renderTables(passengers) {
  var list = document.getElementById("tv-tables-list");
  if (!list) return;

  if (passengers.length === 0) {
    list.innerHTML = '<div class="tv-loading">En attente...</div>';
    return;
  }

  /* Agréger par table */
  var tables = {};
  passengers.forEach(function(p) {
    if (!tables[p.table]) tables[p.table] = { km: 0, count: 0 };
    tables[p.table].km    += (p.km||0);
    tables[p.table].count += 1;
  });

  var sorted = Object.entries(tables)
    .sort(function(a, b) { return b[1].km - a[1].km; });

  var maxKm = sorted.length > 0 ? sorted[0][1].km : 1;

  list.innerHTML = sorted.map(function(entry, i) {
    var name  = entry[0];
    var data  = entry[1];
    var emoji = TABLE_EMOJIS[name] || "🌍";
    var pos   = i===0?"🏆":i===1?"🥈":i===2?"🥉":(i+1)+".";
    var pct   = Math.round((data.km / maxKm) * 100);

    return '<div class="tv-table-row">' +
      '<span class="tv-table-pos">' + pos + '</span>' +
      '<div class="tv-table-info">' +
        '<div class="tv-table-name">' + emoji + ' ' + name + '</div>' +
        '<div class="tv-table-count">' + data.count + ' voyageur' + (data.count>1?"s":"") + '</div>' +
        '<div class="tv-table-bar-bg">' +
          '<div class="tv-table-bar-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
      '</div>' +
      '<span class="tv-table-km">' + data.km.toLocaleString() + ' km</span>' +
    '</div>';
  }).join("");
}

/* ==========================================================
   BADGES
========================================================== */

var badgesShown = [];

function renderBadges(passengers) {
  var list = document.getElementById("tv-badges-list");
  if (!list) return;

  /* Reconstituer les badges débloqués depuis les km et missions */
  var newBadges = [];
  passengers.forEach(function(p) {
    badgesData.forEach(function(badge) {
      var key = p.prenom + "_" + badge.id;
      if (badgesShown.includes(key)) return;

      var unlocked = false;
      if (badge.condition === "km"       && (p.km||0)       >= badge.valeur) unlocked = true;
      if (badge.condition === "missions" && (p.missions||0) >= badge.valeur) unlocked = true;

      if (unlocked) {
        badgesShown.push(key);
        newBadges.push({ badge, prenom: p.prenom });
      }
    });
  });

  newBadges.forEach(function(item) {
    var chip = document.createElement("div");
    chip.className = "tv-badge-chip";
    chip.innerHTML = item.badge.emoji + " " + item.badge.nom +
      ' <span class="badge-who">· ' + item.prenom + "</span>";
    list.insertBefore(chip, list.firstChild);
  });

  if (list.children.length === 0) {
    list.innerHTML = '<div class="tv-loading">En attente de badges...</div>';
  }
}

/* ==========================================================
   MISSION FLASH
========================================================== */

function handleFlash(flash) {
  var banner = document.getElementById("tv-flash-banner");
  if (flashInterval) { clearInterval(flashInterval); flashInterval = null; }

  if (!flash || !flash.active) {
    banner.classList.add("hidden");
    return;
  }

  document.getElementById("tv-flash-title").textContent = flash.titre;
  document.getElementById("tv-flash-desc").textContent  = flash.description || "";
  document.getElementById("tv-flash-km").textContent    = "+" + flash.km + " km";
  banner.classList.remove("hidden");

  var endMs = (flash.startedAt || Date.now()) + (flash.duree||5)*60*1000;

  function tick() {
    var rem = Math.max(0, endMs - Date.now());
    var m   = Math.floor(rem/60000);
    var s   = Math.floor((rem%60000)/1000);
    document.getElementById("tv-flash-timer").textContent =
      (m<10?"0":"")+m+":"+(s<10?"0":"")+s;
    if (rem <= 0) {
      clearInterval(flashInterval);
      banner.classList.add("hidden");
    }
  }

  tick();
  flashInterval = setInterval(tick, 1000);
}

/* ==========================================================
   DÉMARRAGE
========================================================== */

window.addEventListener("load", async function() {
  console.log("📺 Dashboard HORIZON v1.0");
  await loadBadges();
  listenPassengers();
  listenFlash();
});
