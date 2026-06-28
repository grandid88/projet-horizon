/*==================================================
  PASSPORT COMPONENT v2.1
==================================================*/

class Passport {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);

    if (!this.container) {
      console.error("Passport container not found :", containerSelector);
      return;
    }

    this.book = this.container.querySelector(".passport-book");
    this.button = this.container.querySelector("#btn-open-passport");

    if (!this.book || !this.button) {
      console.error("Passport elements missing.");
      return;
    }

    this.isOpen = false;

    this.button.addEventListener("click", () => this.toggle());
  }

  open() {
    this.book.classList.remove("closing");

    this.book.classList.add("open");

    this.isOpen = true;

    this.button.textContent = "Refermer";
  }

  close() {
    this.book.classList.remove("open");

    this.book.classList.add("closing");

    this.isOpen = false;

    this.button.textContent = "Embarquer";
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
