
function initEventsView(model, controller) {
  initNavigation();

  // Zustand: Daten + UI
  const state = {
    data: { events: [], tags: [], participants: [] },
    filters: { status: "", participant: "", tag: "", search: "" },
    selectedId: null,
    isCreateMode: false
  };

  // DOM: Hauptbereiche
  const list = document.querySelector("[data-list]");
  const detailForm = document.querySelector("[data-form=event]");
  const detailEmpty = document.querySelector("[data-detail-empty]");
  const detailTitle = document.querySelector("[data-detail-title]");
  const saveLabel = document.querySelector("[data-save-label]");
  const deleteButton = document.querySelector("[data-action=delete-event]");
  const tagChips = document.querySelector("[data-tag-chips]");
  const participantChips = document.querySelector("[data-participant-chips]");
  const tagList = document.querySelector("[data-tag-list]");
  const tagForm = document.querySelector("[data-form=tag]");

  // Filter: Eingaben
  const filterStatus = document.querySelector("[name=filter-status]");
  const filterParticipant = document.querySelector("[name=filter-participant]");
  const filterTag = document.querySelector("[name=filter-tag]");
  const filterSearch = document.querySelector("[name=filter-search]");
  const setFilter = (key, value) => {
    state.filters[key] = value;
    renderList();
  };

  // Observer: Model -> View
  model.addEventListener("model:loaded", onUpdate);
  model.addEventListener("events:changed", onUpdate);
  model.addEventListener("tags:changed", onUpdate);
  model.addEventListener("participants:changed", onUpdate);

  // UI-Aktionen: Buttons/Chips
  document.addEventListener("click", (event) => {
    const actionEl = event.target.closest("[data-action]");
    const action = actionEl ? actionEl.dataset.action : "";
    if (!action) {
      return;
    }

    if (action === "create-mode") {
      state.isCreateMode = true;
      state.selectedId = null;
      renderDetail();
      return;
    }

    if (action === "select-event") {
      state.isCreateMode = false;
      state.selectedId = actionEl.dataset.id || null;
      renderDetail();
      return;
    }

    if (action === "delete-event") {
      const id = state.selectedId;
      if (!id) {
        return;
      }
      if (confirm("Event wirklich loeschen?")) {
        controller.deleteEvent(id);
        state.selectedId = null;
        state.isCreateMode = false;
        renderDetail();
      }
      return;
    }

    if (action === "delete-tag") {
      const id = actionEl.dataset.id;
      if (!id) {
        return;
      }
      if (!confirm("Tag wirklich loeschen?")) {
        return;
      }
      try {
        controller.deleteTag(id);
      } catch (error) {
        alert(error.message);
      }
      return;
    }

    if (action === "edit-tag") {
      const id = actionEl.dataset.id;
      const current = state.data.tags.find((tag) => tag.id === id);
      const next = prompt("Tag bearbeiten", current?.label ?? "");
      if (next === null) {
        return;
      }
      try {
        controller.updateTag(id, next);
      } catch (error) {
        alert(error.message);
      }
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target === filterSearch) {
      setFilter("search", filterSearch.value);
    }
  });

  // Filter: Selects
  document.addEventListener("change", (event) => {
    if (event.target === filterStatus) {
      setFilter("status", filterStatus.value);
    }
    if (event.target === filterParticipant) {
      setFilter("participant", filterParticipant.value);
    }
    if (event.target === filterTag) {
      setFilter("tag", filterTag.value);
    }
  });

  if (detailForm) {
    // Formular: Event speichern
    detailForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const payload = readEventForm();
      try {
        if (state.isCreateMode || !state.selectedId) {
          controller.createEvent(payload);
          state.isCreateMode = false;
        } else {
          controller.updateEvent(state.selectedId, payload);
          state.isCreateMode = false;
        }
        renderDetail();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  if (tagForm) {
    // Formular: Tag anlegen
    tagForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = tagForm.querySelector("[name=tag-name]");
      if (!input) {
        return;
      }
      try {
        controller.createTag(input.value);
        input.value = "";
      } catch (error) {
        alert(error.message);
      }
    });
  }

  onUpdate({ detail: controller.getState() });

  // Observer: Model-Update
  function onUpdate(event) {
    state.data = event.detail;
    render();
  }

  // Render: Gesamtansicht
  function render() {
    renderFilters();
    renderList();
    renderDetail();
    renderTags();
  }

  // Render: Filter-Selects
  function renderFilters() {
    const fillSelect = (select, items, labelKey) => {
      clearNode(select);
      const all = document.createElement("option");
      all.value = "";
      all.textContent = "alle";
      select.appendChild(all);
      items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item[labelKey];
        select.appendChild(option);
      });
    };

    fillSelect(filterParticipant, state.data.participants, "name");
    filterParticipant.value = state.filters.participant;

    fillSelect(filterTag, state.data.tags, "label");
    filterTag.value = state.filters.tag;

    filterStatus.value = state.filters.status;
  }

  // Render: Event-Liste
  function renderList() {
    if (!list) {
      return;
    }
    clearNode(list);
    const events = filteredEvents();
    if (!events.length) {
      const empty = document.createElement("div");
      empty.className = "eb__empty";
      empty.textContent = "Keine Events gefunden.";
      list.appendChild(empty);
      return;
    }

    events.forEach((event) => {
      const card = cloneTemplate("event-card-template");
      if (!card) {
        return;
      }
      card.dataset.id = event.id;
      card.querySelector("[data-field=title]").textContent = event.title;
      card.querySelector("[data-field=date]").textContent = formatDate(event.dateTime);
      card.querySelector("[data-field=location]").textContent = event.location;
      const status = card.querySelector("[data-field=status]");
      status.textContent = event.status;
      if (event.status === "abgeschlossen") {
        status.classList.add("eb__status--done");
      }
      // Tags: IDs -> Labels -> Chips
      const tagWrap = card.querySelector("[data-tags]");
      event.tagIds
        .map((id) => state.data.tags.find((tag) => tag.id === id))
        .filter(Boolean)
        .forEach((tag) => {
          const tagEl = document.createElement("span");
          tagEl.className = "eb__tag";
          tagEl.textContent = tag.label;
          tagWrap.appendChild(tagEl);
        });
      list.appendChild(card);
    });
  }

  // Render: Detail-Form
  function renderDetail() {
    if (!detailForm || !detailEmpty) {
      return;
    }
    const selected = state.data.events.find((event) => event.id === state.selectedId);
    if (!selected && !state.isCreateMode) {
      detailForm.hidden = true;
      detailEmpty.hidden = false;
      return;
    }

    detailForm.hidden = false;
    detailEmpty.hidden = true;
    // Formular: Defaultwerte bei "Neu"
    const eventData = selected || {
      title: "",
      dateTime: "",
      location: "",
      description: "",
      status: "geplant",
      tagIds: [],
      participantIds: []
    };

    detailTitle.textContent = selected ? "Event bearbeiten" : "Neues Event";
    saveLabel.textContent = selected ? "Speichern" : "Event anlegen";
    deleteButton.hidden = !selected;

    detailForm.querySelector("[name=title]").value = eventData.title;
    detailForm.querySelector("[name=dateTime]").value = eventData.dateTime;
    detailForm.querySelector("[name=location]").value = eventData.location;
    detailForm.querySelector("[name=description]").value = eventData.description;
    detailForm.querySelector("[name=status]").value = eventData.status;

    clearNode(tagChips);
    state.data.tags.forEach((tag) => {
      const chip = cloneTemplate("tag-chip-template");
      if (!chip) {
        return;
      }
      const checkbox = chip.querySelector("[data-tag-checkbox]");
      checkbox.value = tag.id;
      checkbox.checked = eventData.tagIds.includes(tag.id);
      chip.querySelector("[data-field=label]").textContent = tag.label;
      tagChips.appendChild(chip);
    });

    clearNode(participantChips);
    state.data.participants.forEach((participant) => {
      const chip = cloneTemplate("participant-chip-template");
      if (!chip) {
        return;
      }
      const checkbox = chip.querySelector("[data-participant-checkbox]");
      checkbox.value = participant.id;
      checkbox.checked = eventData.participantIds.includes(participant.id);
      chip.querySelector("[data-field=name]").textContent = participant.name;
      participantChips.appendChild(chip);
    });
  }

  // Render: Tag-Übersicht
  function renderTags() {
    if (!tagList) {
      return;
    }
    clearNode(tagList);
    if (!state.data.tags.length) {
      const empty = document.createElement("div");
      empty.className = "eb__empty";
      empty.textContent = "Noch keine Tags.";
      tagList.appendChild(empty);
      return;
    }

    state.data.tags.forEach((tag) => {
      const item = cloneTemplate("tag-item-template");
      if (!item) {
        return;
      }
      item.querySelector("[data-field=label]").textContent = tag.label;
      const usage = state.data.events.filter((event) => event.tagIds.includes(tag.id)).length;
      item.querySelector("[data-field=usage]").textContent = `verwendet in ${usage} Event(s)`;
      item.querySelector("[data-action=edit-tag]").dataset.id = tag.id;
      item.querySelector("[data-action=delete-tag]").dataset.id = tag.id;
      tagList.appendChild(item);
    });
  }

  // Formular: Daten auslesen
  function readEventForm() {
    const formData = new FormData(detailForm);
    const tagIds = [];
    const participantIds = [];
    // Auswahl: Tag- & Teilnehmer-IDs sammeln
    detailForm.querySelectorAll("[data-tag-checkbox]").forEach((box) => {
      if (box.checked) {
        tagIds.push(box.value);
      }
    });
    detailForm.querySelectorAll("[data-participant-checkbox]").forEach((box) => {
      if (box.checked) {
        participantIds.push(box.value);
      }
    });

    return {
      title: formData.get("title").trim(),
      dateTime: formData.get("dateTime"),
      location: formData.get("location").trim(),
      description: formData.get("description").trim(),
      status: formData.get("status"),
      tagIds,
      participantIds
    };
  }

  // Filter: Events einschränken
  function filteredEvents() {
    const search = state.filters.search.toLowerCase();

    // Filter: Status/Teilnehmer/Tag/Suche anwenden
    return state.data.events.filter((event) => {
      if (state.filters.status && event.status !== state.filters.status) {
        return false;
      }
      if (state.filters.participant && !event.participantIds.includes(state.filters.participant)) {
        return false;
      }
      if (state.filters.tag && !event.tagIds.includes(state.filters.tag)) {
        return false;
      }
      if (search) {
        const hay = `${event.title} ${event.location}`.toLowerCase();
        if (!hay.includes(search)) {
          return false;
        }
      }
      return true;
    });
  }
}

