import { test, expect, type Page } from "@playwright/test";
import { MicrocksContainer } from "@microcks/microcks-testcontainers";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";

let microcksContainer: InstanceType<typeof MicrocksContainer>;
let apiBase: string;
let server: http.Server;
let serverPort: number;

const subscribeJs = fs.readFileSync(
  path.resolve(__dirname, "../../static/js/subscribe.js"),
  "utf-8"
);

function buildHtml(overrideApiBase: string, presetLocalStorage?: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
<title>Subscribe Test</title>
<style>.subscribe-hidden { display: none !important; }</style>
</head>
<body>
<div class="subscribe-box" id="subscribe-box">
    <div class="subscribe-content" id="subscribe-form-state">
        <p class="subscribe-heading">Enjoyed this content?</p>
        <p class="subscribe-text">
            <span id="subscribe-count-text">Join other subscribers.</span>
            I'll email you when I publish something new.
        </p>
        <form class="subscribe-form" id="subscribe-form">
            <input type="email" id="subscribe-email" placeholder="you@example.com" required autocomplete="email" />
            <button type="submit" id="subscribe-button">Subscribe</button>
        </form>
    </div>
    <div class="subscribe-content subscribe-hidden" id="subscribe-success-state">
        <p class="subscribe-heading">You're in. Welcome.</p>
    </div>
    <div class="subscribe-content subscribe-hidden" id="subscribe-already-state">
        <p class="subscribe-heading">You're already subscribed.</p>
    </div>
    <div class="subscribe-content subscribe-hidden" id="subscribe-error-state">
        <p class="subscribe-heading">Something went wrong.</p>
        <p class="subscribe-text" id="subscribe-error-message">Please try again later.</p>
    </div>
</div>
<script>
  ${presetLocalStorage ? 'localStorage.setItem("blog_subscribed", String(Date.now()));' : 'localStorage.removeItem("blog_subscribed");'}
  window.SUBSCRIBE_API_BASE = "${overrideApiBase}";
</script>
<script>${subscribeJs}</script>
</body>
</html>`;
}

test.describe("Subscribe form", () => {
  test.beforeAll(async () => {
    // Start Microcks
    const artifactPath = path.resolve(__dirname, "subscribe-api.yaml");
    microcksContainer = await new MicrocksContainer()
      .withMainArtifacts([artifactPath])
      .start();

    const mockBase = microcksContainer
      .getRestMockEndpoint("Blog Subscribe API", "1.0.0")
      .replace(/\/$/, "");
    apiBase = mockBase + "/api/subscribe";

    // Start a local HTTP server to serve test pages
    // (browsers restrict fetch from about:blank pages)
    server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost`);
      const preset = url.searchParams.get("preset") === "true";
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(buildHtml(apiBase, preset));
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
    if (microcksContainer) await microcksContainer.stop();
  });

  test("displays subscriber count from API", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/`);
    await page.waitForTimeout(2000);

    const countText = await page.textContent("#subscribe-count-text");
    expect(countText).toContain("42");
    expect(countText).toContain("subscribers");
  });

  test("shows form state by default", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/`);
    await page.waitForTimeout(500);

    await expect(page.locator("#subscribe-form-state")).toBeVisible();
    await expect(page.locator("#subscribe-success-state")).toBeHidden();
    await expect(page.locator("#subscribe-already-state")).toBeHidden();
    await expect(page.locator("#subscribe-error-state")).toBeHidden();
  });

  test("successfully subscribes with valid email", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/`);
    await page.waitForTimeout(500);

    await page.fill("#subscribe-email", "reader@example.com");
    await page.click("#subscribe-button");

    await expect(page.locator("#subscribe-success-state")).toBeVisible({
      timeout: 10000,
    });

    const subscribed = await page.evaluate(() =>
      localStorage.getItem("blog_subscribed")
    );
    expect(Number(subscribed)).toBeGreaterThan(0);
  });

  test("shows already subscribed state on revisit", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/?preset=true`);
    await page.waitForTimeout(500);

    await expect(page.locator("#subscribe-already-state")).toBeVisible();
    await expect(page.locator("#subscribe-form-state")).toBeHidden();
  });

  test("sends source page path in subscribe request", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/some/post/path`);
    await page.waitForTimeout(500);

    const requestPromise = page.waitForRequest((req) =>
      req.url().includes("/api/subscribe") && req.method() === "POST"
    );

    await page.fill("#subscribe-email", "reader@example.com");
    await page.click("#subscribe-button");

    const request = await requestPromise;
    const body = request.postDataJSON();
    expect(body.source).toBe("/some/post/path");
    expect(body.email).toBe("reader@example.com");
  });

  test("button re-enables after submission", async ({ page }) => {
    await page.goto(`http://localhost:${serverPort}/`);
    await page.waitForTimeout(500);

    await page.fill("#subscribe-email", "reader@example.com");
    await page.click("#subscribe-button");

    await expect(page.locator("#subscribe-success-state")).toBeVisible({
      timeout: 10000,
    });

    const disabled = await page.getAttribute("#subscribe-button", "disabled");
    expect(disabled).toBeNull();
  });
});
