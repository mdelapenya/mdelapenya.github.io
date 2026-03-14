(function () {
  var IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  var DEFAULT_API = IS_LOCAL
    ? "http://localhost:8787/api/subscribe"
    : "https://mdelapenya.xyz/api/subscribe";
  var API_BASE = window.SUBSCRIBE_API_BASE || DEFAULT_API;
  var STORAGE_KEY = "blog_subscribed";
  var DEV_MODE = IS_LOCAL && !window.SUBSCRIBE_API_BASE;

  var box = document.getElementById("subscribe-box");
  if (!box) return;

  var formState = document.getElementById("subscribe-form-state");
  var successState = document.getElementById("subscribe-success-state");
  var alreadyState = document.getElementById("subscribe-already-state");
  var errorState = document.getElementById("subscribe-error-state");
  var form = document.getElementById("subscribe-form");
  var emailInput = document.getElementById("subscribe-email");
  var button = document.getElementById("subscribe-button");
  var countText = document.getElementById("subscribe-count-text");
  var errorMessage = document.getElementById("subscribe-error-message");

  function showState(state) {
    [formState, successState, alreadyState, errorState].forEach(function (el) {
      el.classList.add("subscribe-hidden");
    });
    state.classList.remove("subscribe-hidden");
  }

  // Check if already subscribed
  if (localStorage.getItem(STORAGE_KEY)) {
    showState(alreadyState);
  }

  // Fetch subscriber count
  if (DEV_MODE) {
    console.log("[subscribe] dev mode: skipping count fetch");
    countText.textContent = "Join 42 other subscribers. (dev mode)";
  } else {
    fetch(API_BASE + "/count")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.count && data.count > 0) {
          countText.textContent = "Join " + data.count + " other subscriber" + (data.count !== 1 ? "s" : "") + ".";
        }
      })
      .catch(function () {
        // Silently fail, keep generic text
      });
  }

  // Handle form submission
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var email = emailInput.value.trim();
      if (!email) return;

      button.disabled = true;
      button.textContent = "Subscribing...";

      if (DEV_MODE) {
        console.log("[subscribe] dev mode: would subscribe", email, "from", window.location.pathname);
        localStorage.setItem(STORAGE_KEY, "true");
        showState(successState);
        button.disabled = false;
        button.textContent = "Subscribe";
        return;
      }

      fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, source: window.location.pathname }),
      })
        .then(function (r) {
          if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || "Failed"); });
          return r.json();
        })
        .then(function () {
          localStorage.setItem(STORAGE_KEY, "true");
          showState(successState);
        })
        .catch(function (err) {
          errorMessage.textContent = err.message || "Please try again later.";
          showState(errorState);
        })
        .finally(function () {
          button.disabled = false;
          button.textContent = "Subscribe";
        });
    });
  }
})();
