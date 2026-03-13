import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";

let server: http.Server;
let serverPort: number;

const carouselCss = fs.readFileSync(
  path.resolve(__dirname, "../../static/css/related-posts.css"),
  "utf-8"
);

const carouselJs = fs.readFileSync(
  path.resolve(__dirname, "../../static/js/related-posts.js"),
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
<title>Related Posts Carousel Test</title>
<style>${carouselCss}</style>
</head>
<body>
<div style="max-width: 800px;">
  <div class="related-posts">
    <h3>Related posts</h3>
    <div class="related-posts-carousel">
      <button class="related-posts-arrow related-posts-arrow-left" aria-label="Scroll left">&#8249;</button>
      <div class="related-posts-list">
        ${cards}
      </div>
      <button class="related-posts-arrow related-posts-arrow-right" aria-label="Scroll right">&#8250;</button>
    </div>
  </div>
</div>
<script>${carouselJs}</script>
</body>
</html>`;
}

test.describe("Related posts carousel", () => {
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

  test("left arrow is disabled at initial position", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=6`);

    await expect(page.locator(".related-posts-arrow-left")).toBeDisabled();
  });

  test("right arrow is enabled when cards overflow", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=6`);

    await expect(page.locator(".related-posts-arrow-right")).toBeEnabled();
  });

  test("right arrow is disabled when all cards fit", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=2`);

    await expect(page.locator(".related-posts-arrow-right")).toBeDisabled();
  });

  test("clicking right arrow scrolls the list", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=6`);

    const scrollBefore = await page.evaluate(() =>
      document.querySelector(".related-posts-list")!.scrollLeft
    );

    await page.click(".related-posts-arrow-right");
    await page.waitForTimeout(500); // wait for smooth scroll

    const scrollAfter = await page.evaluate(() =>
      document.querySelector(".related-posts-list")!.scrollLeft
    );

    expect(scrollAfter).toBeGreaterThan(scrollBefore);
  });

  test("clicking left arrow scrolls back", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=6`);

    // First scroll right
    await page.click(".related-posts-arrow-right");
    await page.waitForTimeout(500);

    const scrollMid = await page.evaluate(() =>
      document.querySelector(".related-posts-list")!.scrollLeft
    );
    expect(scrollMid).toBeGreaterThan(0);

    // Then scroll left
    await page.click(".related-posts-arrow-left");
    await page.waitForTimeout(500);

    const scrollAfter = await page.evaluate(() =>
      document.querySelector(".related-posts-list")!.scrollLeft
    );

    expect(scrollAfter).toBeLessThan(scrollMid);
  });

  test("left arrow enables after scrolling right", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=6`);

    await expect(page.locator(".related-posts-arrow-left")).toBeDisabled();

    await page.click(".related-posts-arrow-right");
    await page.waitForTimeout(500);

    await expect(page.locator(".related-posts-arrow-left")).toBeEnabled();
  });

  test("right arrow disables at the end", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=4`);

    // Click right enough times to reach the end
    for (let i = 0; i < 3; i++) {
      if (await page.locator(".related-posts-arrow-right").isEnabled()) {
        await page.click(".related-posts-arrow-right");
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator(".related-posts-arrow-right")).toBeDisabled();
  });

  test("cards are links with correct hrefs", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=3`);

    const cards = page.locator(".related-post-card");
    await expect(cards).toHaveCount(3);

    const href = await cards.first().getAttribute("href");
    expect(href).toBe("/posts/post-1");
  });

  test("each card displays a title", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=3`);

    const titles = page.locator(".related-post-title");
    await expect(titles).toHaveCount(3);
    await expect(titles.first()).toHaveText("Related Post 1");
  });

  test("no carousel renders when no cards exist", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=0`);

    // The carousel structure exists but with no cards
    const cards = page.locator(".related-post-card");
    await expect(cards).toHaveCount(0);
  });

  test("both arrows disabled with single card that fits", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?cards=1`);

    await expect(page.locator(".related-posts-arrow-left")).toBeDisabled();
    await expect(page.locator(".related-posts-arrow-right")).toBeDisabled();
  });
});
