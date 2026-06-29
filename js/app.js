/* ==========================================================
   PROJET HORIZON — app.js
   Version 4.1 — Fichier unique avec Firebase intégré
========================================================== */

/* ==========================================================
   FIREBASE
========================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

/* --- Sauvegarder un passager sur Firebase --- */
async function dbSavePassenger(passenger) {
  var key = (passenger.prenom + "_" + passenger.table)
    .toLowerCase().replace(/[^a-z0-9_]/g, "_");
  await set(ref(db, "passagers/" + key), {
    prenom:    passenger.prenom,
    table:     passenger.table,
    km:        passenger.km,
    missions:  passenger.missions.length,
    updatedAt: serverTimestamp()
  });
}

/* --- Écouter le classement en temps réel --- */
function dbOnRanking(callback) {
  onValue(ref(db, "passagers"), function(snapshot) {
    var data = snapshot.val();
    if (!data) { callback([]); return; }
    var ranking = Object.values(data)
      .sort(function(a, b) { return b.km - a.km; })
      .slice(0, 10);
    callback(ranking);
  });
}

/* --- Écouter les missions flash --- */
function dbOnFlash(callback) {
  onValue(ref(db, "flash_mission"), function(snapshot) {
    callback(snapshot.val());
  });
}

/* --- Déclencher une mission flash (admin) --- */
async function dbTriggerFlash(mission) {
  await set(ref(db, "flash_mission"), {
    id:          mission.id,
    titre:       mission.titre,
    description: mission.description,
    km:          mission.km,
    duree:       mission.duree,
    active:      true,
    startedAt:   Date.now()
  });
}

/* --- Clôturer une mission flash --- */
async function dbCloseFlash() {
  await set(ref(db, "flash_mission"), null);
}

/* ==========================================================
   STORAGE (localStorage)
========================================================== */

const Storage = {
  KEY: "horizon_passenger",
  save(data)   { localStorage.setItem(this.KEY, JSON.stringify(data)); },
  load()       { var r = localStorage.getItem(this.KEY); return r ? JSON.parse(r) : null; },
  clear()      { localStorage.removeItem(this.KEY); },
  createPassenger(prenom, table) {
    var p = { prenom, table, km: 0, badges: [], missions: [], createdAt: Date.now() };
    this.save(p); return p;
  },
  addKm(n)     { var p = this.load(); if (!p) return null; p.km += n; this.save(p); return p; },
  completeMission(id) {
    var p = this.load(); if (!p) return null;
    if (!p.missions.includes(id)) p.missions.push(id);
    this.save(p); return p;
  },
  addBadge(id) {
    var p = this.load(); if (!p) return null;
    if (!p.badges.includes(id)) p.badges.push(id);
    this.save(p); return p;
  }
};

/* ==========================================================
   MISSIONS
========================================================== */

const Missions = {
  data: [], badges: [],

  async load() {
    var [mRes, bRes] = await Promise.all([
      fetch("data/missions.json"), fetch("data/badges.json")
    ]);
    this.data   = (await mRes.json()).missions;
    this.badges = (await bRes.json()).badges;
  },

  getAvailable(p) {
    return this.data.filter(function(m) {
      if (p.missions.includes(m.id)) return false;
      if (m.prerequis.length === 0)  return true;
      return m.prerequis.every(function(pr) { return p.missions.includes(pr); });
    });
  },

  getCompleted(p) {
    return this.data.filter(function(m) { return p.missions.includes(m.id); });
  },

  complete(missionId) {
    var p = Storage.completeMission(missionId);
    var m = this.data.find(function(x) { return x.id === missionId; });
    if (!m) return null;
    Storage.addKm(m.km);
    var newBadges = this.checkBadges();
    return { passenger: Storage.load(), mission: m, newBadges };
  },

  completeFlash(flash) {
    var p = Storage.load();
    if (!p || p.missions.includes(flash.id)) return null;
    Storage.completeMission(flash.id);
    Storage.addKm(flash.km);
    var newBadges = this.checkBadges();
    return { passenger: Storage.load(), mission: flash, newBadges };
  },

  checkBadges() {
    var p = Storage.load();
    var newBadges = [];
    this.badges.forEach(function(badge) {
      if (p.badges.includes(badge.id)) return;
      var unlocked = false;
      if (badge.condition === "km"       && p.km               >= badge.valeur) unlocked = true;
      if (badge.condition === "missions" && p.missions.length   >= badge.valeur) unlocked = true;
      if (unlocked) { Storage.addBadge(badge.id); newBadges.push(badge); }
    });
    return newBadges;
  }
};

/* ==========================================================
   UTILITAIRES
========================================================== */

function showScreen(id) {
  ["splash-screen","boarding-screen","register-screen","app-screen"].forEach(function(sid) {
    var el = document.getElementById(sid);
    if (el) { el.classList.add("hidden"); el.classList.remove("active"); }
  });
  var t = document.getElementById(id);
  if (t) { t.classList.remove("hidden"); t.classList.add("active"); }
}

function generateBarcode() {
  var c = document.getElementById("barcode-deco");
  if (!c) return;
  [3,2,1,3,1,2,2,1,3,2,1,1,2,3,1,2,1,3,2,1,3,1,2,2,3,1,2,1,3,2,1,2,3,1,2].forEach(function(w) {
    var b = document.createElement("span");
    b.style.height = w===3?"36px":w===2?"28px":"20px";
    c.appendChild(b);
  });
}

function formatTime(ms) {
  var s = Math.ceil(ms/1000), m = Math.floor(s/60); s = s%60;
  return (m<10?"0":"")+m+":"+(s<10?"0":"")+s;
}

/* ==========================================================
   ENREGISTREMENT
========================================================== */

function initRegister() {
  var prenomInput   = document.getElementById("input-prenom");
  var btnRegister   = document.getElementById("btn-register");
  var selectedTable = null;

  function checkReady() {
    var ok = prenomInput && prenomInput.value.trim().length >= 2 && selectedTable;
    if (btnRegister) btnRegister.classList.toggle("ready", !!ok);
  }

  if (prenomInput) prenomInput.addEventListener("input", checkReady);

  document.querySelectorAll(".table-option input[type='radio']").forEach(function(radio) {
    radio.addEventListener("change", function() { selectedTable = radio.value; checkReady(); });
  });

  if (btnRegister) {
    btnRegister.addEventListener("click", async function() {
      var prenom = prenomInput ? prenomInput.value.trim() : "";
      if (!prenom || !selectedTable) return;
      var passenger = Storage.createPassenger(prenom, selectedTable);
      await dbSavePassenger(passenger);
      showApp();
    });
  }
}

/* ==========================================================
   ÉCRAN APP
========================================================== */

var flashInterval = null;

async function showApp() {
  showScreen("app-screen");
  await Missions.load();
  renderApp();

  /* Classement live */
  dbOnRanking(function(ranking) {
    renderRanking(ranking);
  });

  /* Missions flash */
  dbOnFlash(function(flash) {
    handleFlashMission(flash);
  });
}

function renderApp() {
  var passenger  = Storage.load();
  if (!passenger) return;
  var available  = Missions.getAvailable(passenger);
  var completed  = Missions.getCompleted(passenger);
  var myBadges   = Missions.badges.filter(function(b) { return passenger.badges.includes(b.id); });
  var pct        = Math.min(100, Math.round((passenger.km/2000)*100));

  var container  = document.getElementById("app-screen");
  container.innerHTML = [
    '<div class="app-header">',
      '<span class="airline-logo">✈ I&D Airlines</span>',
      '<span class="flight-info">Vol I&D 260627<br>Mission Paradis</span>',
    '</div>',
    '<div class="passport-widget">',
      '<div class="passport-widget-header">',
        '<span>Passeport du Voyageur</span>',
        '<span>🛂 '+completed.length+'/'+Missions.data.length+' missions</span>',
      '</div>',
      '<div class="passport-widget-body">',
        '<div class="passport-avatar">'+passenger.prenom.charAt(0).toUpperCase()+'</div>',
        '<div class="passport-infos">',
          '<div class="passenger-name">'+passenger.prenom+'</div>',
          '<div class="passenger-table">✈ Table '+passenger.table+'</div>',
        '</div>',
        '<div class="passport-km">',
          '<div class="km-value">'+passenger.km.toLocaleString()+'</div>',
          '<div class="km-label">km</div>',
        '</div>',
      '</div>',
      '<div class="passport-progress">',
        '<div class="progress-label">',
          '<span>Paris CDG</span>',
          '<span class="progress-dest">Île Maurice ('+pct+'%)</span>',
        '</div>',
        '<div class="progress-bar-bg"><div class="progress-bar-fill" style="width:'+pct+'%"></div></div>',
      '</div>',
      '<div class="passport-badges">',
        myBadges.length===0
          ? '<span class="no-badge">Aucun badge — accomplissez des missions !</span>'
          : myBadges.map(function(b){ return '<span class="badge-chip">'+b.emoji+' '+b.nom+'</span>'; }).join(""),
      '</div>',
    '</div>',
    '<div class="ranking-widget" id="ranking-live">',
      '<div class="ranking-title">🏆 Classement des Voyageurs</div>',
      '<p style="color:rgba(255,255,255,0.3);font-size:13px;">Connexion Firebase en cours...</p>',
    '</div>',
    '<div class="missions-section">',
      '<div class="missions-title">🗺️ Missions disponibles</div>',
      available.length===0
        ? '<p style="color:rgba(255,255,255,0.3);font-size:13px;font-style:italic;">Toutes les missions sont accomplies ! 🎉</p>'
        : available.map(function(m){ return missionCard(m,false); }).join(""),
      completed.length>0
        ? '<div class="missions-title" style="margin-top:20px;">✅ Missions accomplies</div>'+
          completed.map(function(m){ return missionCard(m,true); }).join("")
        : "",
    '</div>'
  ].join("");

  /* Listeners missions */
  document.querySelectorAll(".btn-mission[data-mission]").forEach(function(btn) {
    btn.addEventListener("click", async function() {
      var result = Missions.complete(btn.getAttribute("data-mission"));
      if (result) { await dbSavePassenger(Storage.load()); showReward(result); }
    });
  });
}

function missionCard(m, done) {
  return '<div class="mission-card'+(done?" completed":"")+'">'+
    '<div class="mission-dot" style="background:'+m.couleur+'"></div>'+
    '<div class="mission-content">'+
      '<div class="mission-title">'+m.titre+'</div>'+
      '<div class="mission-desc">'+m.description+'</div>'+
    '</div>'+
    '<div class="mission-right">'+
      '<span class="mission-km">+'+m.km+' km</span>'+
      (done ? '<span class="mission-check">✅</span>'
            : '<button class="btn-mission" data-mission="'+m.id+'" style="background:'+m.couleur+';color:white;">VALIDER</button>')+
    '</div>'+
  '</div>';
}

/* ==========================================================
   CLASSEMENT
========================================================== */

function renderRanking(ranking) {
  var widget = document.getElementById("ranking-live");
  if (!widget) return;
  var passenger = Storage.load();

  if (!ranking || ranking.length===0) {
    widget.innerHTML = '<div class="ranking-title">🏆 Classement des Voyageurs</div>'+
      '<p style="color:rgba(255,255,255,0.3);font-size:13px;">En attente des voyageurs...</p>';
    return;
  }

  widget.innerHTML = '<div class="ranking-title">🏆 Classement des Voyageurs</div>'+
    ranking.map(function(r,i) {
      var isMe = passenger && r.prenom===passenger.prenom && r.table===passenger.table;
      var pos  = i===0?"🏆":i===1?"🥈":i===2?"🥉":(i+1);
      var cls  = i===0?"gold":i===1?"silver":i===2?"bronze":"";
      return '<div class="ranking-row'+(isMe?" me":"")+'">'+
        '<span class="rank-pos '+cls+'">'+pos+'</span>'+
        '<span class="rank-name">'+r.prenom+(isMe?' <b style="color:var(--gold)">(vous)</b>':"")+
        (r.table ? ' <small style="opacity:.4">· '+r.table+'</small>' : "")+'</span>'+
        '<span class="rank-km">'+(r.km||0).toLocaleString()+' km</span>'+
      '</div>';
    }).join("");
}

/* ==========================================================
   MISSION FLASH
========================================================== */

function handleFlashMission(flash) {
  var existing = document.getElementById("flash-banner");
  if (existing) existing.remove();
  if (flashInterval) { clearInterval(flashInterval); flashInterval = null; }
  if (!flash || !flash.active) return;

  var passenger = Storage.load();
  if (passenger && passenger.missions.includes(flash.id)) return;

  var endMs  = (flash.startedAt || Date.now()) + (flash.duree||5)*60*1000;
  var banner = document.createElement("div");
  banner.id  = "flash-banner";
  banner.className = "flash-banner";
  banner.innerHTML =
    '<div class="flash-label">⚡ MISSION FLASH</div>'+
    '<div class="flash-title">'+flash.titre+'</div>'+
    '<div class="flash-desc">'+flash.description+'</div>'+
    '<div class="flash-footer">'+
      '<span class="flash-km">+'+flash.km+' km</span>'+
      '<span class="flash-countdown">⏱ <span id="flash-timer">'+formatTime(endMs-Date.now())+'</span></span>'+
      '<button class="btn-mission" id="btn-flash-validate" style="background:var(--fuchsia);color:white;">VALIDER</button>'+
    '</div>';

  var appScreen = document.getElementById("app-screen");
  var header    = appScreen.querySelector(".app-header");
  if (header) header.after(banner); else appScreen.prepend(banner);

  if (navigator.vibrate) navigator.vibrate([200,100,200]);

  flashInterval = setInterval(function() {
    var rem = Math.max(0, endMs-Date.now());
    var el  = document.getElementById("flash-timer");
    if (el) el.textContent = formatTime(rem);
    if (rem<=0) { clearInterval(flashInterval); if (banner.parentNode) banner.remove(); }
  }, 1000);

  document.getElementById("btn-flash-validate").addEventListener("click", async function() {
    var result = Missions.completeFlash(flash);
    if (result) {
      await dbSavePassenger(Storage.load());
      banner.remove();
      clearInterval(flashInterval);
      showReward(result);
    }
  });
}

/* ==========================================================
   RÉCOMPENSE
========================================================== */

function showReward(result) {
  var overlay = document.createElement("div");
  overlay.className = "reward-overlay";
  overlay.innerHTML =
    '<div class="reward-card">'+
      '<div class="reward-emoji">🎉</div>'+
      '<div class="reward-km">+'+result.mission.km+'</div>'+
      '<div class="reward-label">kilomètres</div>'+
      '<div class="reward-text">Bravo '+result.passenger.prenom+' !<br>Vous progressez vers le Paradis !</div>'+
      result.newBadges.map(function(b){
        return '<div class="reward-badge">'+b.emoji+' Nouveau badge : '+b.nom+'</div>';
      }).join("")+
      '<button class="btn-reward-close" id="btn-close-reward">Continuer ✈</button>'+
    '</div>';
  document.body.appendChild(overlay);
  document.getElementById("btn-close-reward").addEventListener("click", function() {
    document.body.removeChild(overlay);
    renderApp();
  });
}

/* ==========================================================
   DÉMARRAGE
========================================================== */

window.addEventListener("load", function() {
  console.log("✈ Projet HORIZON — Mission Paradis v4.1");
  generateBarcode();

  var passenger = Storage.load();
  if (passenger) { showApp(); return; }

  showScreen("splash-screen");
  setTimeout(function() {
    showScreen("boarding-screen");
    var btn = document.getElementById("btn-start-adventure");
    if (btn) btn.addEventListener("click", function() {
      showScreen("register-screen");
      initRegister();
    });
  }, 2400);
});
