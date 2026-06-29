/* ==========================================================
   PROJET HORIZON — storage.js
   Gestion de la persistance locale (localStorage)
   Version 1.0
========================================================== */

const Storage = {

  KEY: "horizon_passenger",

  /* --- Sauvegarder le passager --- */
  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  /* --- Charger le passager --- */
  load() {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /* --- Effacer (debug / reset) --- */
  clear() {
    localStorage.removeItem(this.KEY);
  },

  /* --- Créer un nouveau passager --- */
  createPassenger(prenom, table) {
    const passenger = {
      prenom:    prenom,
      table:     table,
      km:        0,
      badges:    [],
      missions:  [],
      createdAt: Date.now()
    };
    this.save(passenger);
    return passenger;
  },

  /* --- Mettre à jour les km --- */
  addKm(montant) {
    const p = this.load();
    if (!p) return null;
    p.km += montant;
    this.save(p);
    return p;
  },

  /* --- Marquer une mission comme complétée --- */
  completeMission(missionId) {
    const p = this.load();
    if (!p) return null;
    if (!p.missions.includes(missionId)) {
      p.missions.push(missionId);
    }
    this.save(p);
    return p;
  },

  /* --- Ajouter un badge --- */
  addBadge(badgeId) {
    const p = this.load();
    if (!p) return null;
    if (!p.badges.includes(badgeId)) {
      p.badges.push(badgeId);
    }
    this.save(p);
    return p;
  }

};
