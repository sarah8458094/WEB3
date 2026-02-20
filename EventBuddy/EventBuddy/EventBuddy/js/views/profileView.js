
function initProfileView(model, controller) {
  initNavigation();

  // DOM: Formfelder + Buttons
  const nameInput = document.getElementById("profile-name");
  const emailInput = document.getElementById("profile-email");
  const initialsInput = document.getElementById("profile-initials");
  const saveButton = document.querySelector("[data-action=save-profile]");
  const resetButton = document.querySelector("[data-action=reset-profile]");
  const passwordButton = document.querySelector("[data-action=change-password]");
  const fields = {
    name: nameInput,
    email: emailInput,
    initials: initialsInput
  };
  // Zustand: aktueller User
  let currentUser = null;

  // Observer: Model -> View
  model.addEventListener("model:loaded", onUpdate);
  model.addEventListener("participants:changed", onUpdate);
  onUpdate({ detail: controller.getState() });

  // Observer: Model-Update
  function onUpdate(event) {
    const participants = event.detail.participants || [];
    if (!participants.length) {
      return;
    }
    currentUser = participants[0];
    fillForm(currentUser);
  }

  if (saveButton) {
    // Aktion: speichern
    saveButton.addEventListener("click", () => {
      if (!currentUser) {
        return;
      }
      try {
        controller.updateParticipant(currentUser.id, {
          name: fields.name?.value ?? "",
          email: fields.email?.value ?? "",
          initials: fields.initials?.value ?? ""
        });
      } catch (error) {
        alert(error.message);
      }
    });
  }

  if (resetButton) {
    // Aktion: reset
    resetButton.addEventListener("click", () => {
      if (currentUser) {
        fillForm(currentUser);
      }
    });
  }

  if (passwordButton) {
    // Aktion: Dummy
    passwordButton.addEventListener("click", () => {
      alert("Passwort aendern ist in der Demo nicht implementiert.");
    });
  }

  // Formular: Werte setzen
  function fillForm(user) {
    if (!user) {
      return;
    }
    Object.entries(fields).forEach(([key, input]) => {
      if (input) {
        input.value = user[key];
      }
    });
  }
}

