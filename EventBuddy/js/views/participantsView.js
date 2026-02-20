
function initParticipantsView(model, controller) {
  initNavigation();

  // DOM: Liste + Modal
  const list = document.querySelector("[data-participant-list]");
  const searchInput = document.getElementById("participant-search");
  const modal = document.querySelector("[data-participant-modal]");
  const modalForm = document.querySelector("[data-participant-form]");
  const modalTitle = document.querySelector("[data-modal-title]");
  const modalSubmit = document.querySelector("[data-modal-submit]");
  const modalName = document.getElementById("participant-name");
  const modalEmail = document.getElementById("participant-email");
  const modalInitials = document.getElementById("participant-initials");
  // Zustand: Teilnehmer + Auswahl
  let participants = [];
  let activeParticipantId = null;

  // Observer: Model -> View
  model.addEventListener("model:loaded", onUpdate);
  model.addEventListener("participants:changed", onUpdate);
  onUpdate({ detail: controller.getState() });

  if (searchInput) {
    // Filter: Suche
    searchInput.addEventListener("input", () => {
      renderList();
    });
  }

  document.addEventListener("click", (event) => {
    // UI-Aktionen: CRUD + Export
    const actionEl = event.target.closest("[data-action]");
    const action = actionEl ? actionEl.dataset.action : "";
    if (!action) {
      return;
    }

    if (action === "add-participant") {
      openModal();
      return;
    }

    if (action === "edit-participant") {
      const id = actionEl.dataset.id;
      const current = participants.find((p) => p.id === id);
      openModal(current);
      return;
    }

    if (action === "delete-participant") {
      const id = actionEl.dataset.id;
      if (!confirm("Teilnehmer wirklich loeschen?")) {
        return;
      }
      controller.deleteParticipant(id);
      return;
    }

    if (action === "export-participants") {
      exportParticipants();
    }

    if (action === "close-participant-modal") {
      closeModal();
    }
  });

  // Observer: Model-Update
  function onUpdate(event) {
    participants = event.detail.participants || [];
    renderList();
  }

  // Filter: Teilnehmer
  function filteredParticipants() {
    const term = searchInput ? searchInput.value.toLowerCase() : "";
    return participants.filter((p) => {
      if (!term) {
        return true;
      }
      return `${p.name} ${p.email}`.toLowerCase().includes(term);
    });
  }

  // Render: Tabelle
  function renderList() {
    if (!list) {
      return;
    }
    clearNode(list);

    const head = document.createElement("div");
    head.className = "eb__table-head";
    ["Kuerzel", "Name", "E-Mail", "Aktion"].forEach((label) => {
      const span = document.createElement("span");
      span.textContent = label;
      head.appendChild(span);
    });
    list.appendChild(head);

    const items = filteredParticipants();

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "eb__empty";
      empty.textContent = "Keine Teilnehmer gefunden.";
      list.appendChild(empty);
      return;
    }

    items.forEach((participant) => {
      const row = cloneTemplate("participant-row-template");
      if (!row) {
        return;
      }
      row.querySelector("[data-action=edit-participant]").dataset.id = participant.id;
      row.querySelector("[data-action=delete-participant]").dataset.id = participant.id;
      row.querySelector("[data-field=initials]").textContent = participant.initials;
      row.querySelector("[data-field=name]").textContent = participant.name;
      row.querySelector("[data-field=email]").textContent = participant.email;
      list.appendChild(row);
    });
  }

  // Export: HTML-Datei
  function exportParticipants() {
    const items = filteredParticipants();

    if (!items.length) {
      alert("Keine Teilnehmer zum Exportieren.");
      return;
    }

    // Export: HTML-Tabelle bauen + Download
    const header = ["Kuerzel", "Name", "E-Mail"];
    const rows = items
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "de"))
      .map((p) => [p.initials, p.name, p.email]);

    const tableRows = [header, ...rows]
      .map(
        (row, index) =>
          `<tr>${row
            .map(
              (cell) =>
                `<${index === 0 ? "th" : "td"}>${escapeHtml(cell)}</${
                  index === 0 ? "th" : "td"
                }>`
            )
            .join("")}</tr>`
      )
      .join("");

    const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Teilnehmer Export</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; margin: 24px; }
    table { border-collapse: collapse; min-width: 600px; }
    th, td { border: 1px solid #cfcfcf; padding: 8px 10px; text-align: left; }
    th { background: #f2f2f2; }
    td { white-space: normal; word-break: break-word; }
  </style>
</head>
<body>
  <table>
    <thead>${tableRows.split("</tr>")[0]}</thead>
    <tbody>${tableRows.split("</tr>").slice(1).join("</tr>")}</tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    link.download = "teilnehmer_export_" + stamp + ".html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Sicherheit: HTML escapen
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Modal: öffnen + vorfüllen
  function openModal(current = null) {
    if (!modal || !modalForm) {
      return;
    }
    activeParticipantId = current ? current.id : null;
    if (modalTitle) {
      modalTitle.textContent = current ? "Teilnehmer bearbeiten" : "Teilnehmer anlegen";
    }
    if (modalSubmit) {
      modalSubmit.textContent = current ? "Speichern" : "Anlegen";
    }
    if (modalName) {
      modalName.value = current?.name ?? "";
    }
    if (modalEmail) {
      modalEmail.value = current?.email ?? "";
    }
    if (modalInitials) {
      modalInitials.value = current?.initials ?? "";
    }
    modal.hidden = false;
    modal.classList.add("is-open");
    if (modalName) {
      modalName.focus();
    }
  }

  // Modal: schließen + reset
  function closeModal() {
    if (!modal || !modalForm) {
      return;
    }
    modal.classList.remove("is-open");
    modal.hidden = true;
    activeParticipantId = null;
    modalForm.reset();
  }

  if (modalForm) {
    // Formular: speichern
    modalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const payload = {
        name: modalName ? modalName.value : "",
        email: modalEmail ? modalEmail.value : "",
        initials: modalInitials ? modalInitials.value : ""
      };
      try {
        if (activeParticipantId) {
          controller.updateParticipant(activeParticipantId, payload);
        } else {
          controller.createParticipant(payload);
        }
        closeModal();
      } catch (error) {
        alert(error.message);
      }
    });
  }
}

