import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:1313",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        // Third-party CDNs (KaTeX, Turnstile) gate DOMContentLoaded and so the icons and search;
        // fail them fast so a slow CDN never makes the suite flaky. No test needs them.
        launchOptions: {
          args: ["--host-resolver-rules=MAP cdn.jsdelivr.net ~NOTFOUND, MAP challenges.cloudflare.com ~NOTFOUND"],
        },
      },
    },
  ],
});
