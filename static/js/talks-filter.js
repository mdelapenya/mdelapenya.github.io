// Talks page: legend chips toggle visibility of entries by type.
// Click a chip to filter out that type; click again to bring it back.
// Empty year labels (no visible entries underneath) auto-hide.
// Reset button and live "showing X of Y" status update on every filter change.

(function () {
    "use strict";

    const chips = document.querySelectorAll(".legend-chip");
    if (chips.length === 0) return;

    const entries = Array.from(document.querySelectorAll(".commit-entry"));
    const yearLabels = Array.from(document.querySelectorAll(".talks-year-label"));
    const resetBtn = document.getElementById("talks-legend-reset");
    const statusEl = document.getElementById("talks-legend-status");
    const total = entries.length;

    // Map each entry to its type, parsed once.
    const entryType = new WeakMap();
    entries.forEach((entry) => {
        const match = entry.className.match(/commit-entry-(\w+)/);
        if (match) entryType.set(entry, match[1]);
    });

    function applyFilter() {
        const hiddenTypes = new Set();
        let anyInactive = false;
        chips.forEach((chip) => {
            if (!chip.classList.contains("is-active")) {
                hiddenTypes.add(chip.dataset.filterType);
                anyInactive = true;
            }
        });

        let visible = 0;
        entries.forEach((entry) => {
            const type = entryType.get(entry);
            const isHidden = type && hiddenTypes.has(type);
            entry.hidden = isHidden;
            if (!isHidden) visible++;
        });

        // Hide a year label if no entries remain visible in its log.
        yearLabels.forEach((label) => {
            const log = label.nextElementSibling;
            if (!log || !log.classList.contains("talks-log")) return;
            const visibleInLog = log.querySelectorAll(".commit-entry:not([hidden])");
            label.hidden = visibleInLog.length === 0;
        });

        // Show/hide the reset button.
        if (resetBtn) resetBtn.hidden = !anyInactive;

        // Update live status text.
        if (statusEl) {
            statusEl.textContent = anyInactive
                ? `showing ${visible} of ${total} entries`
                : "";
        }
    }

    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            const active = chip.classList.toggle("is-active");
            chip.setAttribute("aria-pressed", String(active));
            applyFilter();
        });
    });

    // Reset all filters to active.
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            chips.forEach((chip) => {
                chip.classList.add("is-active");
                chip.setAttribute("aria-pressed", "true");
            });
            applyFilter();
        });
    }
})();
