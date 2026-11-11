import { test, expect } from "@playwright/test";

const EN_POST = "/posts/2026-03-25-skills-are-roles-not-commands/";
const ES_POST = "/es/posts/2026-03-25-las-skills-son-roles-no-comandos/";
const ES_SLUG_AT_ROOT = "/posts/2026-03-25-las-skills-son-roles-no-comandos/";
const EN_ONLY_POST = "/posts/2026-03-11-coding-agents-as-exploratory-testers/";

test.describe("English browser", () => {
  test.use({ locale: "en-US" });

  test("home renders in English at the root", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("an English post stays put", async ({ page }) => {
    await page.goto(EN_POST);
    await expect(page).toHaveURL(new RegExp(`${EN_POST}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("a Spanish post redirects to its English counterpart", async ({ page }) => {
    await page.goto(ES_POST);
    await expect(page).toHaveURL(new RegExp(`${EN_POST}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("the notice for Spanish readers stays hidden", async ({ page }) => {
    await page.goto(EN_ONLY_POST);
    await expect(page.locator(".post-not-translated")).toBeHidden();
  });

  test("the post list no longer shows flags", async ({ page }) => {
    await page.goto("/posts/");
    const html = await page.content();
    expect(html).not.toMatch(/\p{Regional_Indicator}/u);
  });

  test("the switcher can force Spanish and it sticks", async ({ page }) => {
    await page.goto(EN_POST);
    await page.locator(".nav-link.language-switcher a[data-lang=es]").click();
    await expect(page).toHaveURL(new RegExp(`${ES_POST}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    // The stored choice beats the English browser: going back to the English URL bounces to Spanish.
    await page.goto(EN_POST);
    await expect(page).toHaveURL(new RegExp(`${ES_POST}$`));
  });

  test("the switcher marks the current language", async ({ page }) => {
    await page.goto(EN_POST);
    const current = page.locator(".nav-link.language-switcher a.is-current");
    await expect(current).toHaveAttribute("data-lang", "en");
    await expect(current).toHaveAttribute("aria-current", "true");
  });
});

test.describe("Spanish browser", () => {
  test.use({ locale: "es-ES" });

  test("an English post with a translation redirects to Spanish", async ({ page }) => {
    await page.goto(EN_POST);
    await expect(page).toHaveURL(new RegExp(`${ES_POST}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator("h1, .title").first()).toContainText("Las skills son roles");
  });

  test("redirect keeps query and hash", async ({ page }) => {
    await page.goto(`${EN_POST}?utm_source=test#la-equivalencia`);
    await expect(page).toHaveURL(new RegExp(`${ES_POST}\\?utm_source=test#la-equivalencia$`));
  });

  test("the redirect does not trap the Back button", async ({ page }) => {
    await page.goto("/");
    await page.goto(EN_POST);
    await expect(page).toHaveURL(new RegExp(`${ES_POST}$`));
    await page.goBack();
    await expect(page).not.toHaveURL(new RegExp(`${EN_POST}$`));
  });

  test("an untranslated post is not redirected and shows the notice", async ({ page }) => {
    await page.goto(EN_ONLY_POST);
    await expect(page).toHaveURL(new RegExp(`${EN_ONLY_POST}$`));
    const notice = page.locator(".post-not-translated[data-notice-for=es]");
    await expect(notice).toBeVisible();
    await expect(notice).toHaveText("Este post solo está disponible en inglés.");
  });

  test("the selector beats auto-detection", async ({ page }) => {
    await page.goto(EN_POST);
    await expect(page).toHaveURL(new RegExp(`${ES_POST}$`));

    await page.locator(".nav-link.language-switcher a[data-lang=en]").click();
    await expect(page).toHaveURL(new RegExp(`${EN_POST}$`));

    // Still English after a reload and after navigating again: the click was remembered.
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`${EN_POST}$`));
    await page.goto(ES_POST);
    await expect(page).toHaveURL(new RegExp(`${EN_POST}$`));
  });

  test("the notice is hidden once English is chosen", async ({ page }) => {
    await page.goto(EN_ONLY_POST);
    await page.locator(".nav-link.language-switcher a[data-lang=en]").click();
    await page.goto(EN_ONLY_POST);
    await expect(page.locator(".post-not-translated")).toBeHidden();
  });

  test("the Spanish home uses Spanish labels", async ({ page }) => {
    await page.goto("/es/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator(".nav-link", { hasText: "Inicio" }).first()).toBeVisible();
  });

  test("the Spanish post list shows the translated post", async ({ page }) => {
    await page.goto("/es/posts/");
    await expect(page.locator(`a[href$="${ES_POST}"]`)).toBeVisible();
  });
});

test.describe("404 fallback", () => {
  test("a Spanish slug at the English root reaches the post in the preferred language (es)", async ({ browser }) => {
    const context = await browser.newContext({ locale: "es-ES" });
    const page = await context.newPage();
    await page.goto(ES_SLUG_AT_ROOT);
    await expect(page).toHaveURL(new RegExp(`${ES_POST}$`));
    await context.close();
  });

  test("a Spanish slug at the English root reaches the post in the preferred language (en)", async ({ browser }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();
    await page.goto(ES_SLUG_AT_ROOT);
    await expect(page).toHaveURL(new RegExp(`${EN_POST}$`));
    await context.close();
  });

  test("an unknown URL stays on the 404 page", async ({ page }) => {
    const response = await page.goto("/posts/this-does-not-exist/");
    expect(response?.status()).toBe(404);
    await expect(page.locator(".text-404")).toBeVisible();
    await expect(page).toHaveURL(/this-does-not-exist/);
  });
});

test.describe("language map", () => {
  test("langmap.json pairs the translations by key", async ({ request }) => {
    const res = await request.get("/langmap.json");
    expect(res.ok()).toBeTruthy();
    const map = await res.json();
    expect(map["skills-are-roles-not-commands"]).toEqual({
      en: EN_POST,
      es: ES_POST,
    });
  });
});
