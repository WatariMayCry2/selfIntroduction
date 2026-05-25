(function () {
  const DEFAULT_PATH = "index.html";

  async function fetchHtml(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`${path} の読み込みに失敗しました`);
    }
    return response.text();
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
      history.pushState({ path }, "", path);
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function getPathFromLink(link) {
    return link.dataset.link;
  }

  document.addEventListener("click", async (event) => {
    const link = event.target.closest("a[data-link]");
    if (!link) return;

    const path = getPathFromLink(link);
    if (!path) return;

    event.preventDefault();

    try {
      await loadPage(path);
    } catch (error) {
      window.location.href = path;
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
