import { test, expect, Page } from "@playwright/test";

/** Open the search modal and wait for it to be active. */
async function openSearch(page: Page) {
  await page.click("#search-toggle");
  await expect(page.locator("#search-modal")).toHaveClass(/active/);
}

/** Type a query and wait for debounce + index to produce results. */
async function searchFor(page: Page, query: string) {
  await openSearch(page);
  await page.locator("#search-input").fill(query);
  // wait past the 300ms debounce + index load
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Modal open / close
// ---------------------------------------------------------------------------
test.describe("Modal open / close", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens via search icon click", async ({ page }) => {
    await page.click("#search-toggle");

    const modal = page.locator("#search-modal");
    await expect(modal).toHaveClass(/active/);
    await expect(modal).toHaveAttribute("aria-hidden", "false");
  });

  test("opens via Cmd+K shortcut", async ({ page }) => {
    await page.keyboard.press("Meta+k");

    const modal = page.locator("#search-modal");
    await expect(modal).toHaveClass(/active/);
    await expect(modal).toHaveAttribute("aria-hidden", "false");
  });

  test("Cmd+K toggles the modal closed again", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.locator("#search-modal")).toHaveClass(/active/);

    await page.keyboard.press("Meta+k");
    await expect(page.locator("#search-modal")).not.toHaveClass(/active/);
    await expect(page.locator("#search-modal")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("closes via Escape key", async ({ page }) => {
    await openSearch(page);

    await page.keyboard.press("Escape");
    const modal = page.locator("#search-modal");
    await expect(modal).not.toHaveClass(/active/);
    await expect(modal).toHaveAttribute("aria-hidden", "true");
  });

  test("closes via overlay click", async ({ page }) => {
    await openSearch(page);

    await page.locator(".search-modal-overlay").click({ force: true });
    const modal = page.locator("#search-modal");
    await expect(modal).not.toHaveClass(/active/);
    await expect(modal).toHaveAttribute("aria-hidden", "true");
  });

  test("clicking inside the modal content does not close it", async ({
    page,
  }) => {
    await openSearch(page);

    await page.locator(".search-modal-content").click();
    await expect(page.locator("#search-modal")).toHaveClass(/active/);
  });
});

// ---------------------------------------------------------------------------
// Modal UI state
// ---------------------------------------------------------------------------
test.describe("Modal UI state", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("input is focused when modal opens", async ({ page }) => {
    await openSearch(page);
    await expect(page.locator("#search-input")).toBeFocused();
  });

  test("input is cleared when modal opens", async ({ page }) => {
    await openSearch(page);
    await page.locator("#search-input").fill("test");
    await page.keyboard.press("Escape");

    // Reopen — input should be empty
    await openSearch(page);
    await expect(page.locator("#search-input")).toHaveValue("");
  });

  test("shows hint text on open", async ({ page }) => {
    await openSearch(page);
    await expect(page.locator(".search-hint")).toBeVisible();
    await expect(page.locator(".search-hint")).toHaveText(
      "Type to search posts...",
    );
  });

  test("body scroll is locked while modal is open", async ({ page }) => {
    await openSearch(page);
    const overflow = await page.evaluate(
      () => document.body.style.overflow,
    );
    expect(overflow).toBe("hidden");
  });

  test("body scroll is restored after modal closes", async ({ page }) => {
    await openSearch(page);
    await page.keyboard.press("Escape");
    const overflow = await page.evaluate(
      () => document.body.style.overflow,
    );
    expect(overflow).toBe("");
  });

  test("ESC kbd hint is visible in header", async ({ page }) => {
    await openSearch(page);
    await expect(page.locator(".search-kbd")).toBeVisible();
    await expect(page.locator(".search-kbd")).toHaveText("ESC");
  });
});

// ---------------------------------------------------------------------------
// Search results
// ---------------------------------------------------------------------------
test.describe("Search results", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("typing a known term returns matching results", async ({ page }) => {
    await searchFor(page, "docker");

    const results = page.locator(".search-result-item");
    await expect(results.first()).toBeVisible({ timeout: 5000 });
    expect(await results.count()).toBeGreaterThan(0);
  });

  test("results are capped at 10", async ({ page }) => {
    // Use a very broad single-word query likely to match many posts
    await searchFor(page, "the");

    await expect(
      page.locator(".search-result-item").first(),
    ).toBeVisible({ timeout: 5000 });

    const count = await page.locator(".search-result-item").count();
    expect(count).toBeLessThanOrEqual(10);
  });

  test("each result shows a title", async ({ page }) => {
    await searchFor(page, "docker");

    await expect(
      page.locator(".search-result-item").first(),
    ).toBeVisible({ timeout: 5000 });

    const titles = page.locator(".search-result-title");
    expect(await titles.count()).toBeGreaterThan(0);

    const firstTitle = await titles.first().textContent();
    expect(firstTitle?.trim().length).toBeGreaterThan(0);
  });

  test("each result shows a date", async ({ page }) => {
    await searchFor(page, "docker");

    await expect(
      page.locator(".search-result-item").first(),
    ).toBeVisible({ timeout: 5000 });

    const meta = page.locator(".search-result-meta span").first();
    const dateText = await meta.textContent();
    // Dates are formatted YYYY-MM-DD
    expect(dateText).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("results display tags when present", async ({ page }) => {
    await searchFor(page, "docker");

    await expect(
      page.locator(".search-result-item").first(),
    ).toBeVisible({ timeout: 5000 });

    const tags = page.locator(".search-result-tag");
    expect(await tags.count()).toBeGreaterThan(0);
  });

  test("tags are limited to 3 per result", async ({ page }) => {
    await searchFor(page, "docker");

    await expect(
      page.locator(".search-result-item").first(),
    ).toBeVisible({ timeout: 5000 });

    const items = page.locator(".search-result-item");
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const tagCount = await items.nth(i).locator(".search-result-tag").count();
      expect(tagCount).toBeLessThanOrEqual(3);
    }
  });

  test("result items are links with href to a post", async ({ page }) => {
    await searchFor(page, "docker");

    const firstResult = page.locator(".search-result-item").first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });

    const href = await firstResult.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toContain("/posts/");
  });

  test("clicking a result navigates to the post", async ({ page }) => {
    await searchFor(page, "docker");

    const firstResult = page.locator(".search-result-item").first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });

    await firstResult.click();
    await expect(page).not.toHaveURL("/");
  });
});

// ---------------------------------------------------------------------------
// No results / empty states
// ---------------------------------------------------------------------------
test.describe("No results / empty states", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows no-results message for gibberish query", async ({ page }) => {
    await searchFor(page, "xyzzy99nonsense");

    const noResults = page.locator(".search-no-results");
    await expect(noResults).toBeVisible({ timeout: 5000 });
    await expect(noResults).toContainText("xyzzy99nonsense");
  });

  test("shows hint when query is a single character (below minMatchCharLength)", async ({
    page,
  }) => {
    await searchFor(page, "a");

    // Should still show the hint, not results or no-results
    await expect(page.locator(".search-hint")).toBeVisible();
    await expect(page.locator(".search-result-item")).toHaveCount(0);
    await expect(page.locator(".search-no-results")).toHaveCount(0);
  });

  test("clearing the input restores the hint", async ({ page }) => {
    await searchFor(page, "docker");
    await expect(
      page.locator(".search-result-item").first(),
    ).toBeVisible({ timeout: 5000 });

    // Clear input
    await page.locator("#search-input").fill("");
    await page.waitForTimeout(500);

    await expect(page.locator(".search-hint")).toBeVisible();
    await expect(page.locator(".search-result-item")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Debounce behavior
// ---------------------------------------------------------------------------
test.describe("Debounce", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("results do not appear immediately (debounce delay)", async ({
    page,
  }) => {
    await openSearch(page);
    await page.locator("#search-input").fill("docker");

    // Check immediately — should NOT have results yet (300ms debounce)
    const count = await page.locator(".search-result-item").count();
    expect(count).toBe(0);

    // After waiting, results should appear
    await expect(
      page.locator(".search-result-item").first(),
    ).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Dark mode
// ---------------------------------------------------------------------------
test.describe("Dark mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("modal gets search-dark class when dark theme is active", async ({
    page,
  }) => {
    // Toggle dark theme
    await page.locator(".dark-theme-toggle a").first().click();

    await openSearch(page);
    await expect(page.locator("#search-modal")).toHaveClass(/search-dark/);
  });

  test("modal does not have search-dark class in light mode", async ({
    page,
  }) => {
    await openSearch(page);
    await expect(page.locator("#search-modal")).not.toHaveClass(
      /search-dark/,
    );
  });
});

// ---------------------------------------------------------------------------
// Index loading
// ---------------------------------------------------------------------------
test.describe("Index loading", () => {
  test("fetches /index.json on first modal open", async ({ page }) => {
    // Listen for the index.json request before navigating
    const indexRequest = page.waitForRequest((req) =>
      req.url().includes("/index.json"),
    );

    await page.goto("/");
    await openSearch(page);

    const req = await indexRequest;
    expect(req.url()).toContain("/index.json");
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("search input has aria-label", async ({ page }) => {
    await expect(page.locator("#search-input")).toHaveAttribute(
      "aria-label",
      "Search posts",
    );
  });

  test("modal starts with aria-hidden true", async ({ page }) => {
    await expect(page.locator("#search-modal")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("search toggle has aria-label", async ({ page }) => {
    await expect(page.locator("#search-toggle")).toHaveAttribute(
      "aria-label",
      "search",
    );
  });
});
