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
