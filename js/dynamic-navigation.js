(function () {
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

  function playPageFadeIn(element) {
    const cleanup = () => {
      element.classList.remove("page-fade-in");
    };

    element.classList.add("page-fade-in");
    element.addEventListener("animationend", cleanup, { once: true });
    window.setTimeout(cleanup, 600);
  }

  async function loadPage(path) {
    const html = await fetchHtml(path);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nextMain = doc.querySelector("main");
    const currentMain = document.querySelector("main");

    if (!nextMain || !currentMain) {
      throw new Error("mainタグが見つかりません");
    }

    currentMain.replaceWith(nextMain);
    playPageFadeIn(nextMain);
    document.title = doc.title || document.title;

    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showNavigationError() {
    const currentMain = document.querySelector("main");
    if (!currentMain) return;

    currentMain.innerHTML = `
      <div class="container">
        <section class="card">
          <h1>ページの読み込みに失敗しました</h1>
          <p>時間をおいて、もう一度リンクをクリックしてください。</p>
        </section>
      </div>
    `;
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
      showNavigationError();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllMenus();
    }
  });
})();
