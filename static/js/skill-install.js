// Copy buttons of the install box (layouts/partials/skill-install.html).
// The commands are plain <code> text, so without JS or a clipboard they stay readable
// and selectable; the buttons are rendered hidden and only shown when copying can work.
(function () {
  "use strict";

  var boxes = document.querySelectorAll(".skill-install");
  if (!boxes.length) return;

  var canCopy = !!(navigator.clipboard && navigator.clipboard.writeText);

  function select(node) {
    var range = document.createRange();
    range.selectNodeContents(node);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  boxes.forEach(function (box) {
    var copied = box.getAttribute("data-copied");
    var status = box.querySelector(".skill-install-status");

    box.querySelectorAll(".skill-install-row").forEach(function (row) {
      var button = row.querySelector(".skill-install-copy");
      var code = row.querySelector(".skill-install-cmd");
      if (!button || !code) return;

      if (!canCopy) return; // buttons stay hidden; the text can still be selected by hand
      button.hidden = false;

      var label = button.textContent;
      var timer = null;

      button.addEventListener("click", function () {
        navigator.clipboard.writeText(code.textContent.trim()).then(
          function () {
            button.textContent = copied;
            button.classList.add("is-copied");
            if (status) status.textContent = copied;
            clearTimeout(timer);
            timer = setTimeout(function () {
              button.textContent = label;
              button.classList.remove("is-copied");
              if (status) status.textContent = "";
            }, 1800);
          },
          function () {
            // Permission denied or not a secure context: leave the command selected for Ctrl+C.
            select(code);
          }
        );
      });
    });
  });
})();
