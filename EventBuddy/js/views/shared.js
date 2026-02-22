function initNavigation() {
  const pills = Array.from(document.querySelectorAll(".eb__nav-pill[data-page]"));
  if (!pills.length) {
    return;
  }

  const pages = Array.from(document.querySelectorAll(".eb__page[data-page]"));
  const setActivePage = (page) => {
    const nextPage = String(page || "").trim();
    if (!nextPage) {
      return;
    }

    document.querySelectorAll(".eb__nav-pill[data-page]").forEach((pill) => {
      pill.classList.toggle("eb__nav-pill--active", pill.dataset.page === nextPage);
    });

    document.querySelectorAll(".eb__page[data-page]").forEach((section) => {
      section.classList.toggle("eb__page--active", section.dataset.page === nextPage);
    });

    document.body.dataset.page = nextPage;
  };

  const hashPage = window.location.hash.replace("#", "");
  const requestedPage = document.body.dataset.page;
  const fallbackPage = pills[0].dataset.page;
  const startPage =
      hashPage && pills.some((pill) => pill.dataset.page === hashPage)
          ? hashPage
          : requestedPage && pills.some((pill) => pill.dataset.page === requestedPage)
              ? requestedPage
              : fallbackPage;

  if (startPage) {
    setActivePage(startPage);
  }

  if (!window.__ebNavigationBound) {
    window.__ebNavigationBound = true;
    document.addEventListener("click", (event) => {
      const pill = event.target.closest(".eb__nav-pill[data-page]");
      if (!pill) {
        return;
      }

      const page = pill.dataset.page;
      const target = document.querySelector(`.eb__page[data-page="${page}"]`);
      if (!target || pages.length <= 1) {
        return;
      }

      event.preventDefault();
      setActivePage(page);
      history.replaceState(null, "", `#${page}`);
    });
  }
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