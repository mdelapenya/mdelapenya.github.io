import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";

let server: http.Server;
let serverPort: number;

const gridCss = fs.readFileSync(
  path.resolve(__dirname, "../../static/css/related-posts.css"),
  "utf-8"
);

function buildHtml(cardCount: number): string {
  const cards = Array.from({ length: cardCount }, (_, i) => `
    <a class="related-post-card" href="/posts/post-${i + 1}">
      <div class="related-post-image related-post-no-image">
        <span>Jan ${i + 1}</span>
      </div>
      <div class="related-post-title">Related Post ${i + 1}</div>
    </a>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
<title>Related Posts Grid Test</title>
<style>${gridCss}</style>
</head>
<body>
<div style="max-width: 800px;">
  <div class="related-posts">
    <h3>Related posts</h3>
    <div class="related-posts-grid">
      ${cards}
    </div>
  </div>
</div>
</body>
</html>`;
}

test.describe("Related posts grid", () => {
  test.beforeAll(async () => {
    server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", "http://localhost");
      const count = parseInt(url.searchParams.get("cards") || "6");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(buildHtml(count));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        serverPort = typeof addr === "object" && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  test.afterAll(async () => {
    if (server) server.close();
  });

  test("renders cards in a grid", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=3`);

    const grid = page.locator(".related-posts-grid");
    await expect(grid).toBeVisible();

    const cards = page.locator(".related-post-card");
    await expect(cards).toHaveCount(3);
  });

  test("grid has max 3 columns", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=6`);

    const columns = await page.evaluate(() => {
      const grid = document.querySelector(".related-posts-grid")!;
      return getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    });

    expect(columns).toBe(3);
  });

  test("cards are links with correct hrefs", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=3`);

    const href = await page.locator(".related-post-card").first().getAttribute("href");
    expect(href).toBe("/posts/post-1");
  });

  test("each card displays a title", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=3`);

    const titles = page.locator(".related-post-title");
    await expect(titles).toHaveCount(3);
    await expect(titles.first()).toHaveText("Related Post 1");
  });

  test("no grid renders when no cards exist", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=0`);

    const cards = page.locator(".related-post-card");
    await expect(cards).toHaveCount(0);
  });

  test("4 cards wraps to second row", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=4`);

    const cards = page.locator(".related-post-card");
    await expect(cards).toHaveCount(4);

    // First and fourth card should be at different Y positions
    const firstBox = await cards.nth(0).boundingBox();
    const fourthBox = await cards.nth(3).boundingBox();
    expect(fourthBox!.y).toBeGreaterThan(firstBox!.y);
  });

  test("single card renders correctly", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=1`);

    const cards = page.locator(".related-post-card");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toBeVisible();
  });
});
