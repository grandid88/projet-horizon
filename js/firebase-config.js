/* ==========================================================
   PROJET HORIZON — firebase-config.js
   Configuration Firebase & Realtime Database
   Version 1.0
========================================================== */

/* --- SDK Firebase via CDN (pas de npm nécessaire) --- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, serverTimestamp }
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

/* ==========================================================
   API FIREBASE — Horizon Database
========================================================== */

const DB = {

  /* --- Sauvegarder / mettre à jour un passager --- */
  async savePassenger(passenger) {
    const key = this.makeKey(passenger.prenom, passenger.table);
    await set(ref(db, "passagers/" + key), {
      prenom:   passenger.prenom,
      table:    passenger.table,
      km:       passenger.km,
      badges:   passenger.badges.length,
      missions: passenger.missions.length,
      updatedAt: serverTimestamp()
    });
  },

  /* --- Écouter le classement en temps réel --- */
  onRankingUpdate(callback) {
    onValue(ref(db, "passagers"), function(snapshot) {
      var data = snapshot.val();
      if (!data) { callback([]); return; }
      var ranking = Object.values(data)
        .sort(function(a, b) { return b.km - a.km; })
        .slice(0, 10);
      callback(ranking);
    });
  },

  /* --- Écouter les missions flash --- */
  onFlashMission(callback) {
    onValue(ref(db, "flash_mission"), function(snapshot) {
      callback(snapshot.val());
    });
  },

  /* --- Déclencher une mission flash (organisateur) --- */
  async triggerFlashMission(mission) {
    await set(ref(db, "flash_mission"), {
      ...mission,
      active:    true,
      startedAt: serverTimestamp()
    });
  },

  /* --- Clôturer une mission flash --- */
  async closeFlashMission() {
    await set(ref(db, "flash_mission"), null);
  },

  /* --- Clé unique par passager --- */
  makeKey(prenom, table) {
    return (prenom + "_" + table)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
  }

};

export { DB };
