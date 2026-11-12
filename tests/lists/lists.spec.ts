import { test, expect } from "@playwright/test";

test("projects page lists every project", async ({ page }) => {
  await page.goto("/projects/");
  await expect(page.locator(".post-content ol li a").first()).toBeVisible();
  expect(await page.locator(".post-content ol li a").count()).toBeGreaterThan(5);
});

test("talks page lists the entries", async ({ page }) => {
  await page.goto("/talks/");
  await expect(page.locator(".talks-legend")).toBeVisible();
  expect(await page.locator(".talks-log").count()).toBeGreaterThan(0);
  expect(await page.locator(".talks-year-label").count()).toBeGreaterThan(0);
});

test("English talks status text stays in English", async ({ page }) => {
  await page.goto("/talks/");
  await page.locator('.legend-chip[data-filter-type="talk"]').click();
  await expect(page.locator("#talks-legend-status")).toContainText("showing");
});

test("a tag used only in projects lists the project", async ({ page }) => {
  await page.goto("/tags/3d/");
  await expect(page.locator(".project-link").first()).toBeVisible();
});

// A browser that prefers English is redirected away from /es/ pages, so these use a Spanish one.
test.describe("Spanish pages", () => {
  test.use({ locale: "es-ES" });

  test("projects page lists every project", async ({ page }) => {
    await page.goto("/es/projects/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator(".post-content ol li a").first()).toBeVisible();
    expect(await page.locator(".post-content ol li a").count()).toBeGreaterThan(5);
  });

  test("talks page lists the entries with Spanish labels", async ({ page }) => {
    await page.goto("/es/talks/");
    await expect(page.locator(".talks-legend")).toBeVisible();
    await expect(page.locator(".talks-legend-label")).toContainText("leyenda");
    expect(await page.locator(".talks-log").count()).toBeGreaterThan(0);

    await page.locator('.legend-chip[data-filter-type="talk"]').click();
    await expect(page.locator("#talks-legend-status")).toContainText("mostrando");
  });

  test("a tag used only in projects lists the project and links to the Spanish posts", async ({ page }) => {
    await page.goto("/es/tags/3d/");
    await expect(page.locator(".project-link").first()).toBeVisible();
    await expect(page.locator(".tag-info a").first()).toHaveAttribute("href", /\/es\/posts\/$/);
  });

  test("every internal link of the header stays in Spanish", async ({ page }) => {
    await page.goto("/es/");
    const paths = await page.locator(".header-nav .nav-link:not(.language-switcher) a").evaluateAll((els) => {
      const origin = new URL((document.querySelector(".nav-brand") as HTMLAnchorElement).href).origin;
      return els
        .map((el) => el.getAttribute("href"))
        .filter((h): h is string => !!h)
        .map((h) => new URL(h, location.href))
        .filter((u) => u.origin === origin)
        .map((u) => u.pathname);
    });
    expect(paths.length).toBeGreaterThan(5);
    for (const p of paths) {
      expect(p, p).toMatch(/^\/es(\/|$)/);
    }
  });
});
