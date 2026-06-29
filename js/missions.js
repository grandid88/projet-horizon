/* ==========================================================
   PROJET HORIZON — missions.js
   Moteur de missions & badges
   Version 1.0
========================================================== */

const Missions = {

  data: [],
  badges: [],

  /* --- Charger les données JSON --- */
  async load() {
    const [mRes, bRes] = await Promise.all([
      fetch("data/missions.json"),
      fetch("data/badges.json")
    ]);
    const mData = await mRes.json();
    const bData = await bRes.json();
    this.data   = mData.missions;
    this.badges = bData.badges;
  },

  /* --- Missions disponibles pour ce passager --- */
  getAvailable(passenger) {
    return this.data.filter(m => {
      if (passenger.missions.includes(m.id)) return false; // déjà faite
      if (m.prerequis.length === 0) return true;           // permanente
      return m.prerequis.every(p => passenger.missions.includes(p)); // séquentielle
    });
  },

  /* --- Missions complétées --- */
  getCompleted(passenger) {
    return this.data.filter(m => passenger.missions.includes(m.id));
  },

  /* --- Valider une mission --- */
  complete(missionId) {
    const passenger = Storage.completeMission(missionId);
    const mission   = this.data.find(m => m.id === missionId);
    if (!mission) return;

    Storage.addKm(mission.km);
    const newBadges = this.checkBadges();
    return { passenger: Storage.load(), mission, newBadges };
  },

  /* --- Vérifier les badges débloqués --- */
  checkBadges() {
    const passenger  = Storage.load();
    const newBadges  = [];

    this.badges.forEach(badge => {
      if (passenger.badges.includes(badge.id)) return;

      let unlocked = false;
      if (badge.condition === "km" && passenger.km >= badge.valeur) {
        unlocked = true;
      }
      if (badge.condition === "missions" && passenger.missions.length >= badge.valeur) {
        unlocked = true;
      }

      if (unlocked) {
        Storage.addBadge(badge.id);
        newBadges.push(badge);
      }
    });

    return newBadges;
  }
};

  /* --- Valider une mission flash --- */
  completeFlash(flash) {
    var passenger = Storage.load();
    if (!passenger || passenger.missions.includes(flash.id)) return null;
    Storage.completeMission(flash.id);
    Storage.addKm(flash.km);
    var newBadges = this.checkBadges();
    return { passenger: Storage.load(), mission: flash, newBadges };
  }
