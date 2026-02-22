function initInvitationsView(model, controller) {
  initNavigation();

  const ORGANIZER_NAME = "Max Mustermann";

  // DOM: Liste + Popup
  const list = document.querySelector("[data-invite-list]");
  const modal = document.querySelector("[data-invite-modal]");
  const modalTitle =
    document.querySelector("[data-invite-modal-title]") ||
    document.querySelector("[data-invite-modal] [data-modal-title]");
  const modalDetails =
    document.querySelector("[data-invite-modal-details]") ||
    document.querySelector("[data-invite-modal] [data-modal-details]");

  // Zustand: Daten + User
  const state = {
    events: [],
    tags: [],
    participants: [],
    status: {},
    currentUserId: null,
    organizerId: null
  };

  // Observer: Model -> View
  model.addEventListener("model:loaded", onUpdate);
  model.addEventListener("events:changed", onUpdate);
  model.addEventListener("tags:changed", onUpdate);
  model.addEventListener("participants:changed", onUpdate);
  model.addEventListener("invitations:changed", onUpdate);

  if (modal) {
    modal.hidden = true;
  }

  onUpdate({ detail: controller.getState() });

  // Observer: Model-Update
  function onUpdate(event) {
    state.events = event.detail.events || [];
    state.tags = event.detail.tags || [];
    state.participants = event.detail.participants || [];
    state.status = event.detail.invitationStatus || {};

    if (state.participants.length) {
      const organizer = state.participants.find((participant) => participant.name === ORGANIZER_NAME);
      state.organizerId = organizer ? organizer.id : null;
      if (!state.currentUserId) {
        state.currentUserId = state.organizerId || state.participants[0].id;
      }
    }

    renderList();
  }

  // Render: Einladungen
  function renderList() {
    if (!list) {
      return;
    }

    clearNode(list);

    const isOrganizer =
      Boolean(state.currentUserId) &&
      Boolean(state.organizerId) &&
      state.currentUserId === state.organizerId;

    const items = isOrganizer
      ? state.events
      : state.events.filter((eventItem) => eventItem.participantIds.includes(state.currentUserId));

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "eb__empty";
      const name =
        state.participants.find((participant) => participant.id === state.currentUserId)?.name || "User";
      empty.textContent = `Keine Einladungen fuer ${name}.`;
      list.appendChild(empty);
      return;
    }

    items.forEach((eventItem) => {
      const invite = cloneTemplate("invite-item-template");
      if (!invite) {
        return;
      }

      invite.dataset.eventId = eventItem.id;
      const titleEl = invite.querySelector("[data-field=title]");
      titleEl.textContent = eventItem.title;
      titleEl.dataset.eventId = eventItem.id;
      invite.querySelector("[data-field=date]").textContent = formatDate(eventItem.dateTime);
      invite.querySelector("[data-field=location]").textContent = `Ort: ${eventItem.location}`;

      const ownStatus = getStatus(eventItem.id, state.currentUserId);
      const isCurrentUserInvited = eventItem.participantIds.includes(state.currentUserId);

      const statusField = invite.querySelector("[data-field=status]");
      if (isOrganizer) {
        if (isCurrentUserInvited) {
          statusField.textContent = `Mein Status: ${ownStatus}`;
        } else {
          statusField.textContent = "Mein Status: nicht eingeladen";
        }
      } else {
        statusField.textContent = `Status: ${ownStatus}`;
      }

      const acceptedNames = eventItem.participantIds
        .filter((participantId) => getStatus(eventItem.id, participantId) === "zugesagt")
        .map((participantId) => participantNameById(participantId))
        .filter(Boolean);

      const acceptedField = invite.querySelector("[data-field=accepted]");
      acceptedField.textContent = `Zugesagt: ${acceptedNames.length ? acceptedNames.join(", ") : "niemand"}`;
      acceptedField.hidden = !isOrganizer;

      const actionWrap = invite.querySelector("[data-actions]");
      const canRespond = isCurrentUserInvited;
      actionWrap.hidden = !canRespond;

      invite.querySelector("[data-action=invite-accept]").dataset.eventId = eventItem.id;
      invite.querySelector("[data-action=invite-decline]").dataset.eventId = eventItem.id;
      invite.querySelector("[data-action=invite-undecided]").dataset.eventId = eventItem.id;

      list.appendChild(invite);
    });
  }

  if (list) {
    list.addEventListener("click", (event) => {
      const actionEl = event.target.closest("[data-action]");
      const action = actionEl ? actionEl.dataset.action : "";

      // UI-Aktionen: Zusage/Absage/Unentschieden
      if (
        action === "invite-accept" ||
        action === "invite-decline" ||
        action === "invite-undecided" ||
        action === "invite-open"
      ) {
        const eventId = actionEl.dataset.eventId;
        if (!eventId) {
          return;
        }

        if (action === "invite-open") {
          openInviteModal(eventId);
          return;
        }

        if (!state.currentUserId) {
          return;
        }

        const selectedEvent = state.events.find((eventItem) => eventItem.id === eventId);
        if (!selectedEvent || !selectedEvent.participantIds.includes(state.currentUserId)) {
          return;
        }

        if (action === "invite-accept") {
          controller.setInvitationStatus(eventId, state.currentUserId, "zugesagt");
        }
        if (action === "invite-decline") {
          controller.setInvitationStatus(eventId, state.currentUserId, "abgelehnt");
        }
        if (action === "invite-undecided") {
          controller.setInvitationStatus(eventId, state.currentUserId, "unentschieden");
        }
        return;
      }

      // Kein Popup bei anderen Klicks
      return;
    });

    list.addEventListener("keydown", (event) => {
      const target = event.target.closest("[data-action=invite-open]");
      if (!target || !list.contains(target)) {
        return;
      }
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      const eventId = target.dataset.eventId;
      if (!eventId) {
        return;
      }
      openInviteModal(eventId);
    });
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      const actionEl = event.target.closest("[data-action]");
      const action = actionEl ? actionEl.dataset.action : "";
      if (action === "close-invite-modal" || event.target === modal) {
        closeInviteModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeInviteModal();
    }
  });

  function getStatus(eventId, participantId) {
    if (!eventId || !participantId) {
      return "unentschieden";
    }
    return state.status?.[eventId]?.[participantId] || "unentschieden";
  }

  function participantNameById(participantId) {
    return state.participants.find((participant) => participant.id === participantId)?.name || participantId;
  }

  function tagLabelById(tagId) {
    return state.tags.find((tag) => tag.id === tagId)?.label || tagId;
  }

  function openInviteModal(eventId) {
    if (!modal || !modalTitle || !modalDetails) {
      return;
    }

    const eventItem = state.events.find((item) => item.id === eventId);
    if (!eventItem) {
      return;
    }

    const invitedNames = (eventItem.participantIds || []).map((participantId) => participantNameById(participantId));
    const tagLabels = (eventItem.tagIds || []).map((tagId) => tagLabelById(tagId));

    const accepted = (eventItem.participantIds || [])
      .filter((participantId) => getStatus(eventItem.id, participantId) === "zugesagt")
      .map((participantId) => participantNameById(participantId));

    const declined = (eventItem.participantIds || [])
      .filter((participantId) => getStatus(eventItem.id, participantId) === "abgelehnt")
      .map((participantId) => participantNameById(participantId));

    const undecided = (eventItem.participantIds || [])
      .filter((participantId) => getStatus(eventItem.id, participantId) === "unentschieden")
      .map((participantId) => participantNameById(participantId));

    modalTitle.textContent = eventItem.title || "Event";

    const details = [
      ["Datum", formatDate(eventItem.dateTime)],
      ["Ort", eventItem.location || "-"],
      ["Event-Status", eventItem.status || "-"],
      ["Beschreibung", eventItem.description || "Keine Beschreibung vorhanden."],
      ["Tags", tagLabels.length ? tagLabels.join(", ") : "-"],
      ["Teilnehmer", invitedNames.length ? invitedNames.join(", ") : "-"],
      ["Zugesagt", accepted.length ? accepted.join(", ") : "niemand"],
      ["Abgelehnt", declined.length ? declined.join(", ") : "niemand"],
      ["Unentschieden", undecided.length ? undecided.join(", ") : "niemand"]
    ];

    clearNode(modalDetails);
    details.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "eb__modal-row";

      const labelEl = document.createElement("div");
      labelEl.className = "eb__modal-label";
      labelEl.textContent = label;

      const valueEl = document.createElement("div");
      valueEl.className = "eb__modal-value";
      valueEl.textContent = value;

      row.appendChild(labelEl);
      row.appendChild(valueEl);
      modalDetails.appendChild(row);
    });

    modal.hidden = false;
    modal.classList.add("is-open");
  }

  function closeInviteModal() {
    if (!modal) {
      return;
    }
    modal.classList.remove("is-open");
    modal.hidden = true;
  }

}
