(function () {
  const DEFAULT_PATH = "index.html";
  const HEADER_PATH = "header/site-header.html";
  const BASE_URL = new URL("./", window.location.href);

  function toAppUrl(path) {
    return new URL(path, BASE_URL);
  }

  async function fetchHtml(path) {
    const response = await fetch(toAppUrl(path));
    if (!response.ok) {
      throw new Error(`${path} の読み込みに失敗しました`);
    }
    return response.text();
  }

  async function loadHeader() {
    const headerSlot = document.getElementById("header-slot");
    if (!headerSlot) return;

    const html = await fetchHtml(HEADER_PATH);
    headerSlot.innerHTML = html;
  }

  async function loadPage(path, push = true) {
    const html = await fetchHtml(path);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nextMain = doc.querySelector("main");
    const currentMain = document.querySelector("main");

    if (!nextMain || !currentMain) {
      throw new Error("mainタグが見つかりません");
    }

    currentMain.replaceWith(nextMain);
    document.title = doc.title || document.title;

    if (push) {
      history.pushState({ path }, "", toAppUrl(path));
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }


  function closeMenu(button) {
    const menuId = button.getAttribute("aria-controls");
    const menu = menuId ? document.getElementById(menuId) : null;

    button.setAttribute("aria-expanded", "false");
    menu?.classList.remove("is-open");
  }

  function closeAllMenus(exceptButton = null) {
    document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
      if (button !== exceptButton) {
        closeMenu(button);
      }
    });
  }

  function toggleMenu(button) {
    const menuId = button.getAttribute("aria-controls");
    const menu = menuId ? document.getElementById(menuId) : null;

    if (!menu) return;

    const willOpen = button.getAttribute("aria-expanded") !== "true";
    closeAllMenus(button);
    button.setAttribute("aria-expanded", String(willOpen));
    menu.classList.toggle("is-open", willOpen);
  }

  function getPathFromLink(link) {
    return link.dataset.link;
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadHeader().catch(() => {
      const headerSlot = document.getElementById("header-slot");
      if (headerSlot) {
        headerSlot.innerHTML = '<p class="header-error">ヘッダーの読み込みに失敗しました</p>';
      }
    });
  });

  document.addEventListener("click", async (event) => {
    const menuButton = event.target.closest("[data-menu-toggle]");
    if (menuButton) {
      toggleMenu(menuButton);
      return;
    }

    const link = event.target.closest("a[data-link]");
    if (!link) {
      if (!event.target.closest(".banner-menu")) {
        closeAllMenus();
      }
      return;
    }

    const path = getPathFromLink(link);
    if (!path) return;

    event.preventDefault();
    closeAllMenus();

    try {
      await loadPage(path);
    } catch (error) {
      window.location.href = path;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllMenus();
    }
  });

  window.addEventListener("popstate", async (event) => {
    const path = event.state?.path || window.location.pathname.split("/").pop() || DEFAULT_PATH;

    try {
      await loadPage(path, false);
    } catch (error) {
      window.location.href = path;
    }
  });
})();
