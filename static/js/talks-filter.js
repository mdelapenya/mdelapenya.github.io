// Talks page: legend chips toggle visibility of entries by type.
// Click a chip to filter out that type; click again to bring it back.
// Empty year labels (no visible entries underneath) auto-hide.

(function () {
    "use strict";

    const chips = document.querySelectorAll(".legend-chip");
    if (chips.length === 0) return;

    const entries = Array.from(document.querySelectorAll(".commit-entry"));
    const yearLabels = Array.from(document.querySelectorAll(".talks-year-label"));

    // Map each entry to its type, parsed once.
    const entryType = new WeakMap();
    entries.forEach((entry) => {
        const match = entry.className.match(/commit-entry-(\w+)/);
        if (match) entryType.set(entry, match[1]);
    });

    function applyFilter() {
        const hidden = new Set();
        chips.forEach((chip) => {
            if (!chip.classList.contains("is-active")) {
                hidden.add(chip.dataset.filterType);
            }
        });

        entries.forEach((entry) => {
            const type = entryType.get(entry);
            entry.hidden = type && hidden.has(type);
        });

        // Hide a year label if no entries remain visible in its log.
        yearLabels.forEach((label) => {
            const log = label.nextElementSibling;
            if (!log || !log.classList.contains("talks-log")) return;
            const visible = log.querySelectorAll(".commit-entry:not([hidden])");
            label.hidden = visible.length === 0;
        });
    }

    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            const active = chip.classList.toggle("is-active");
            chip.setAttribute("aria-pressed", String(active));
            applyFilter();
        });
    });
})();
