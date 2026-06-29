/* ==========================================================
   PROJET HORIZON — register.js
   Gestion de l'enregistrement des invités
   Version 1.0
========================================================== */

const Register = {

  prenomInput: null,
  btnValider:  null,
  selectedTable: null,

  init() {
    this.prenomInput   = document.getElementById("input-prenom");
    this.btnValider    = document.getElementById("btn-register");
    const tableOptions = document.querySelectorAll(".table-option input[type='radio']");

    /* --- Écoute du prénom --- */
    this.prenomInput.addEventListener("input", () => this.checkReady());

    /* --- Écoute des tables --- */
    tableOptions.forEach(radio => {
      radio.addEventListener("change", () => {
        this.selectedTable = radio.value;
        this.checkReady();
      });
    });

    /* --- Bouton valider --- */
    this.btnValider.addEventListener("click", () => this.submit());
  },

  checkReady() {
    const prenomOk = this.prenomInput.value.trim().length >= 2;
    const tableOk  = this.selectedTable !== null;

    if (prenomOk && tableOk) {
      this.btnValider.classList.add("ready");
    } else {
      this.btnValider.classList.remove("ready");
    }
  },

  submit() {
    const prenom = this.prenomInput.value.trim();
    const table  = this.selectedTable;

    if (!prenom || !table) return;

    /* Créer le passager dans le localStorage */
    const passenger = Storage.createPassenger(prenom, table);

    console.log("✅ Passager enregistré :", passenger);

    /* Transition vers l'app principale */
    Horizon.showApp();
  }

};
