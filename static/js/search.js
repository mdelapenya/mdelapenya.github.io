(function () {
  "use strict";

  var fuse = null;
  var indexLoaded = false;
  var modal = document.getElementById("search-modal");
  var input = document.getElementById("search-input");
  var resultsContainer = document.getElementById("search-results");
  var debounceTimer = null;

  function loadIndex() {
    if (indexLoaded) return Promise.resolve();
    return fetch("/index.json")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        fuse = new Fuse(data, {
          keys: [
            { name: "title", weight: 0.4 },
            { name: "description", weight: 0.3 },
            { name: "tags", weight: 0.2 },
            { name: "content", weight: 0.1 },
          ],
          includeScore: true,
          threshold: 0.4,
          ignoreLocation: true,
          minMatchCharLength: 2,
        });
        indexLoaded = true;
      });
  }

  function syncTheme() {
    var darkCss = document.getElementById("dark-theme");
    if (darkCss && !darkCss.disabled) {
      modal.classList.add("search-dark");
    } else {
      modal.classList.remove("search-dark");
    }
  }

  function openSearch() {
    syncTheme();
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    input.value = "";
    resultsContainer.innerHTML =
      '<div class="search-hint">Type to search posts...</div>';
    input.focus();
    loadIndex();
  }

  function closeSearch() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    input.value = "";
    resultsContainer.innerHTML = "";
  }

  function renderResults(query) {
    if (!fuse || !query || query.length < 2) {
      resultsContainer.innerHTML =
        '<div class="search-hint">Type to search posts...</div>';
      return;
    }

    var results = fuse.search(query, { limit: 10 });

    if (results.length === 0) {
      resultsContainer.innerHTML =
        '<div class="search-no-results">No results found for "' +
        escapeHtml(query) +
        '"</div>';
      return;
    }

    var html = results
      .map(function (r) {
        var item = r.item;
        var tags = (item.tags || [])
          .slice(0, 3)
          .map(function (t) {
            return '<span class="search-result-tag">' + escapeHtml(t) + "</span>";
          })
          .join(" ");

        return (
          '<a class="search-result-item" href="' +
          escapeHtml(item.url) +
          '">' +
          '<div class="search-result-title">' +
          escapeHtml(item.title) +
          "</div>" +
          (item.description
            ? '<div class="search-result-description">' +
              escapeHtml(item.description) +
              "</div>"
            : "") +
          '<div class="search-result-meta">' +
          "<span>" +
          escapeHtml(item.date) +
          "</span>" +
          (tags ? " " + tags : "") +
          "</div>" +
          "</a>"
        );
      })
      .join("");

    resultsContainer.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Event: search toggle buttons
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest("#search-toggle, .search-toggle-mobile");
    if (toggle) {
      e.preventDefault();
      openSearch();
    }
  });

  // Event: close on overlay click
  modal.querySelector(".search-modal-overlay").addEventListener("click", closeSearch);

  // Event: keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Cmd+K / Ctrl+K to open
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (modal.classList.contains("active")) {
        closeSearch();
      } else {
        openSearch();
      }
    }
    // Escape to close
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeSearch();
    }
  });

  // Event: debounced search input
  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      renderResults(input.value.trim());
    }, 300);
  });
})();
