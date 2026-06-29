/* ==========================================================
   PROJET HORIZON — app.js
   Version 3.0 — Phase 3 complète
========================================================== */

/* ==========================================================
   UTILITAIRES ÉCRANS
========================================================== */

function showScreen(id) {
  ["splash-screen","boarding-screen","register-screen","app-screen"].forEach(function(sid) {
    var el = document.getElementById(sid);
    if (el) { el.classList.add("hidden"); el.classList.remove("active"); }
  });
  var t = document.getElementById(id);
  if (t) { t.classList.remove("hidden"); t.classList.add("active"); }
}

/* ==========================================================
   BARCODE DÉCORATIF
========================================================== */

function generateBarcode() {
  var container = document.getElementById("barcode-deco");
  if (!container) return;
  [3,2,1,3,1,2,2,1,3,2,1,1,2,3,1,2,1,3,2,1,3,1,2,2,3,1,2,1,3,2,1,2,3,1,2].forEach(function(w) {
    var bar = document.createElement("span");
    bar.style.height = (w===3?"36px":w===2?"28px":"20px");
    container.appendChild(bar);
  });
}

/* ==========================================================
   ENREGISTREMENT
========================================================== */

function initRegister() {
  var prenomInput  = document.getElementById("input-prenom");
  var btnRegister  = document.getElementById("btn-register");
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
    btnRegister.addEventListener("click", function() {
      var prenom = prenomInput ? prenomInput.value.trim() : "";
      if (!prenom || !selectedTable) return;
      Storage.createPassenger(prenom, selectedTable);
      showApp();
    });
  }
}

/* ==========================================================
   ÉCRAN APP — RENDU
========================================================== */

async function showApp() {
  showScreen("app-screen");
  await Missions.load();
  renderApp();
}

function renderApp() {
  var passenger = Storage.load();
  if (!passenger) return;

  var container = document.getElementById("app-screen");
  container.innerHTML = buildAppHTML(passenger);

  /* Listeners missions */
  document.querySelectorAll(".btn-mission[data-mission]").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var missionId = btn.getAttribute("data-mission");
      var result = Missions.complete(missionId);
      if (result) showReward(result);
    });
  });
}

/* ==========================================================
   CONSTRUCTION DU HTML DE L'APP
========================================================== */

function buildAppHTML(passenger) {
  var available = Missions.getAvailable(passenger);
  var completed = Missions.getCompleted(passenger);
  var allBadges = Missions.badges;
  var myBadges  = allBadges.filter(function(b) { return passenger.badges.includes(b.id); });

  /* Progression vers 2000 km */
  var progressPct = Math.min(100, Math.round((passenger.km / 2000) * 100));

  /* Classement simulé (en attendant Firebase) */
  var fakeRanking = buildFakeRanking(passenger);

  return [
    /* --- Header --- */
    '<div class="app-header">',
      '<span class="airline-logo">✈ I&D Airlines</span>',
      '<span class="flight-info">Vol I&D 260627<br>Mission Paradis</span>',
    '</div>',

    /* --- Passeport widget --- */
    '<div class="passport-widget">',
      '<div class="passport-widget-header">',
        '<span>Passeport du Voyageur</span>',
        '<span>🛂 ' + (completed.length) + '/' + Missions.data.length + ' missions</span>',
      '</div>',
      '<div class="passport-widget-body">',
        '<div class="passport-avatar">' + passenger.prenom.charAt(0).toUpperCase() + '</div>',
        '<div class="passport-infos">',
          '<div class="passenger-name">' + passenger.prenom + '</div>',
          '<div class="passenger-table">✈ Table ' + passenger.table + '</div>',
        '</div>',
        '<div class="passport-km">',
          '<div class="km-value">' + passenger.km.toLocaleString() + '</div>',
          '<div class="km-label">km</div>',
        '</div>',
      '</div>',
      '<div class="passport-progress">',
        '<div class="progress-label">',
          '<span>Paris CDG</span>',
          '<span class="progress-dest">Île Maurice (' + progressPct + '%)</span>',
        '</div>',
        '<div class="progress-bar-bg">',
          '<div class="progress-bar-fill" style="width:' + progressPct + '%"></div>',
        '</div>',
      '</div>',
      '<div class="passport-badges">',
        myBadges.length === 0
          ? '<span class="no-badge">Aucun badge encore — accomplissez des missions !</span>'
          : myBadges.map(function(b) {
              return '<span class="badge-chip">' + b.emoji + ' ' + b.nom + '</span>';
            }).join(""),
      '</div>',
    '</div>',

    /* --- Classement mini --- */
    '<div class="ranking-widget">',
      '<div class="ranking-title">🏆 Classement des Voyageurs</div>',
      fakeRanking.map(function(r, i) {
        var posClass = i===0?"gold":i===1?"silver":i===2?"bronze":"";
        var isMe = r.prenom === passenger.prenom;
        return '<div class="ranking-row' + (isMe?" me":"") + '">' +
          '<span class="rank-pos ' + posClass + '">' + (i===0?"🏆":i===1?"🥈":i===2?"🥉":(i+1)) + '</span>' +
          '<span class="rank-name">' + r.prenom + (isMe?" <b style=\"color:var(--gold)\">(vous)</b>":"") + '</span>' +
          '<span class="rank-km">' + r.km.toLocaleString() + ' km</span>' +
          '</div>';
      }).join(""),
    '</div>',

    /* --- Missions disponibles --- */
    '<div class="missions-section">',
      '<div class="missions-title">🗺️ Missions disponibles</div>',
      available.length === 0
        ? '<p style="color:rgba(255,255,255,0.3);font-size:13px;font-style:italic;">Toutes les missions sont accomplies ! 🎉</p>'
        : available.map(function(m) { return buildMissionCard(m, "available"); }).join(""),

      completed.length > 0
        ? '<div class="missions-title" style="margin-top:20px;">✅ Missions accomplies</div>' +
          completed.map(function(m) { return buildMissionCard(m, "completed"); }).join("")
        : "",
    '</div>'

  ].join("");
}

function buildMissionCard(m, state) {
  var isCompleted = state === "completed";
  return [
    '<div class="mission-card ' + (isCompleted ? "completed" : "") + '">',
      '<div class="mission-dot" style="background:' + m.couleur + '"></div>',
      '<div class="mission-content">',
        '<div class="mission-title">' + m.titre + '</div>',
        '<div class="mission-desc">' + m.description + '</div>',
      '</div>',
      '<div class="mission-right">',
        '<span class="mission-km">+' + m.km + ' km</span>',
        isCompleted
          ? '<span class="mission-check">✅</span>'
          : '<button class="btn-mission" data-mission="' + m.id + '" style="background:' + m.couleur + ';color:white;">VALIDER</button>',
      '</div>',
    '</div>'
  ].join("");
}

/* ==========================================================
   CLASSEMENT SIMULÉ (avant Firebase)
========================================================== */

function buildFakeRanking(passenger) {
  var fakes = [
    { prenom: "Béatrice", km: 4250 },
    { prenom: "Rémi",     km: 4010 },
    { prenom: "Yves",     km: 3960 },
    { prenom: passenger.prenom, km: passenger.km }
  ];
  fakes.sort(function(a, b) { return b.km - a.km; });
  /* Dédupliquer si le passager est dans le top 3 fictif */
  var seen = {};
  return fakes.filter(function(f) {
    if (seen[f.prenom]) return false;
    seen[f.prenom] = true;
    return true;
  }).slice(0, 5);
}

/* ==========================================================
   ANIMATION RÉCOMPENSE
========================================================== */

function showReward(result) {
  var mission    = result.mission;
  var passenger  = result.passenger;
  var newBadges  = result.newBadges;

  var overlay = document.createElement("div");
  overlay.className = "reward-overlay";

  var badgeHTML = newBadges.length > 0
    ? newBadges.map(function(b) {
        return '<div class="reward-badge">' + b.emoji + ' Nouveau badge : ' + b.nom + '</div>';
      }).join("")
    : "";

  overlay.innerHTML = [
    '<div class="reward-card">',
      '<div class="reward-emoji">🎉</div>',
      '<div class="reward-km">+' + mission.km + '</div>',
      '<div class="reward-label">kilomètres</div>',
      '<div class="reward-text">Bravo ' + passenger.prenom + ' !<br>Vous progressez vers le Paradis !</div>',
      badgeHTML,
      '<button class="btn-reward-close" id="btn-close-reward">Continuer ✈</button>',
    '</div>'
  ].join("");

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
  console.log("✈ Projet HORIZON — Mission Paradis v3.0");

  generateBarcode();

  var passenger = Storage.load();
  if (passenger) {
    showApp();
    return;
  }

  showScreen("splash-screen");

  setTimeout(function() {
    showScreen("boarding-screen");
    var btn = document.getElementById("btn-start-adventure");
    if (btn) {
      btn.addEventListener("click", function() {
        showScreen("register-screen");
        initRegister();
      });
    }
  }, 2400);

});
