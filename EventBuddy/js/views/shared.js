function initNavigation() {
  // Navigation: aktive Seite markieren
  const page = document.body.dataset.page;
  const pills = document.querySelectorAll(".eb__nav-pill");
  pills.forEach((pill) => {
    const target = pill.dataset.page;
    if (target && target === page) {
      pill.classList.add("eb__nav-pill--active");
    }
  });
}

function formatDate(value) {
  // Datum: Anzeigeformat
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function clearNode(node) {
  // DOM: Knoten leeren
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function cloneTemplate(id) {
  // DOM: Template klonen
  const template = document.getElementById(id);
  if (!template) {
    return null;
  }
  return template.content.firstElementChild.cloneNode(true);
}

