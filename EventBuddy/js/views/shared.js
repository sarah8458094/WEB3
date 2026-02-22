function initNavigation() {
  const pills = Array.from(document.querySelectorAll(".eb__nav-pill[data-page]"));
  if (!pills.length) {
    return;
  }

  const pages = Array.from(document.querySelectorAll(".eb__page[data-page]"));
  const navigationMode = (document.body?.dataset?.navigation || "").trim().toLowerCase();
  const isOneSider = pages.length > 1 && navigationMode === "scroll";

  if (isOneSider) {
    if (!window.__ebMarkActiveNav) {
      window.__ebMarkActiveNav = function markActiveNav(page) {
        const nextPage = String(page || "").trim();
        if (!nextPage) {
          return;
        }
        document.querySelectorAll(".eb__nav-pill[data-page]").forEach((pill) => {
          pill.classList.toggle("eb__nav-pill--active", pill.dataset.page === nextPage);
        });
        document.body.dataset.page = nextPage;
      };
    }

    const hashPage = window.location.hash.replace("#", "");
    const startPage =
      hashPage && pills.some((pill) => pill.dataset.page === hashPage) ? hashPage : pills[0].dataset.page;
    window.__ebMarkActiveNav(startPage);

    if (!window.__ebNavigationBound) {
      window.__ebNavigationBound = true;
      document.addEventListener("click", (event) => {
        const pill = event.target.closest(".eb__nav-pill[data-page]");
        if (!pill) {
          return;
        }
        const page = pill.dataset.page;
        const target = document.getElementById(page);
        if (!target) {
          return;
        }
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${page}`);
        window.__ebMarkActiveNav(page);
      });
    }

    if (!window.__ebSectionObserverBound) {
      window.__ebSectionObserverBound = true;
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (!visible.length) {
            return;
          }
          const topSection = visible[0].target;
          const page = topSection.dataset.page;
          if (page) {
            window.__ebMarkActiveNav(page);
          }
        },
        { threshold: [0.25, 0.5, 0.75] }
      );
      pages.forEach((section) => observer.observe(section));
    }
    return;
  }

  if (!window.__ebSetActivePage) {
    window.__ebSetActivePage = function setActivePage(page) {
      const nextPage = String(page || "").trim();
      if (!nextPage) {
        return;
      }

      const navPills = document.querySelectorAll(".eb__nav-pill[data-page]");
      navPills.forEach((pill) => {
        const isActive = pill.dataset.page === nextPage;
        pill.classList.toggle("eb__nav-pill--active", isActive);
      });

      document.querySelectorAll(".eb__page[data-page]").forEach((section) => {
        section.classList.toggle("eb__page--active", section.dataset.page === nextPage);
      });

      document.body.dataset.page = nextPage;
    };
  }

  const requestedPage = document.body.dataset.page;
  const fallbackPage = pills[0].dataset.page;
  const startPage =
    requestedPage && pills.some((pill) => pill.dataset.page === requestedPage)
      ? requestedPage
      : fallbackPage;

  if (startPage) {
    window.__ebSetActivePage(startPage);
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
      if (!target) {
        return;
      }
      event.preventDefault();
      window.__ebSetActivePage(page);
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

