
function initInvitationsView(model, controller) {
  initNavigation();

  // DOM: Liste
  const list = document.querySelector("[data-invite-list]");
  // Zustand: Daten + User
  const state = {
    events: [],
    participants: [],
    status: {},
    currentUserId: null
  };

  // Observer: Model -> View
  model.addEventListener("model:loaded", onUpdate);
  model.addEventListener("events:changed", onUpdate);
  model.addEventListener("invitations:changed", onUpdate);

  onUpdate({ detail: controller.getState() });

  // Observer: Model-Update
  function onUpdate(event) {
    state.events = event.detail.events || [];
    state.participants = event.detail.participants || [];
    state.status = event.detail.invitationStatus || {};
    if (!state.currentUserId && state.participants.length) {
      state.currentUserId = state.participants[0].id;
    }
    renderList();
  }

  // Render: Einladungen
  function renderList() {
    if (!list) {
      return;
    }
    clearNode(list);
    const items = state.events.filter((event) =>
      event.participantIds.includes(state.currentUserId)
    );

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "eb__empty";
      const name =
        state.participants.find((p) => p.id === state.currentUserId)?.name || "User";
      empty.textContent = `Keine Einladungen fuer ${name}.`;
      list.appendChild(empty);
      return;
    }

    items.forEach((eventItem, index) => {
      const invite = cloneTemplate("invite-item-template");
      if (!invite) {
        return;
      }
      invite.dataset.eventId = eventItem.id;
      invite.querySelector("[data-field=title]").textContent = eventItem.title;
      invite.querySelector("[data-field=date]").textContent = formatDate(eventItem.dateTime);
      invite.querySelector("[data-field=location]").textContent = `Ort: ${eventItem.location}`;
      // Demo: Fallback-Status wenn keiner gespeichert
      const status =
        state.status?.[eventItem.id]?.[state.currentUserId] ??
        (index % 2 === 0 ? "-" : "zugesagt");
      invite.querySelector("[data-field=status]").textContent = `Status: ${status}`;
      invite.querySelector("[data-action=invite-accept]").dataset.eventId = eventItem.id;
      invite.querySelector("[data-action=invite-decline]").dataset.eventId = eventItem.id;
      list.appendChild(invite);
    });
  }

  document.addEventListener("click", (event) => {
    // UI-Aktionen: Zusage/Absage
    const actionEl = event.target.closest("[data-action]");
    const action = actionEl ? actionEl.dataset.action : "";
    if (!action) {
      return;
    }
    const eventId = actionEl.dataset.eventId;
    if (!eventId || !state.currentUserId) {
      return;
    }
    if (action === "invite-accept") {
      controller.setInvitationStatus(eventId, state.currentUserId, "zugesagt");
    }
    if (action === "invite-decline") {
      controller.setInvitationStatus(eventId, state.currentUserId, "abgelehnt");
    }
  });
}

