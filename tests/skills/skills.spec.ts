import { test, expect } from "@playwright/test";

const SKILLS = ["ci-detective", "coordinating-agents", "pr-lawyer", "pr-nurse", "pr-reviewer", "pr-scribe", "the-mister"];
const SKILL_MD = "https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-reviewer/SKILL.md";
const TESSL = "https://tessl.io/registry/mdelapenya/coding-skills";
const SKILLS_SH = "https://skills.sh/mdelapenya/coding-skills";

test.describe("English", () => {
  test("index shows the install box, three categories and the seven skills", async ({ page }) => {
    await page.goto("/skills/");

    const box = page.locator(".skill-install");
    await expect(box).toBeVisible();
    await expect(box.locator(".skill-install-cmd")).toHaveText([
      "npx skills add mdelapenya/coding-skills",
      "tessl install mdelapenya/coding-skills",
    ]);

    await expect(page.locator(".skills-category-title")).toHaveText(["Orchestration", "Pull requests", "CI"]);

    const links = page.locator(".skills-item-title");
    await expect(links).toHaveCount(SKILLS.length);
    const hrefs = await links.evaluateAll((els) => els.map((el) => new URL((el as HTMLAnchorElement).href).pathname));
    expect(hrefs.sort()).toEqual(SKILLS.map((s) => `/skills/${s}/`).sort());
    await expect(page.locator('.skills-item-title[href$="/skills/pr-reviewer/"]')).toBeVisible();
  });

  test("index groups every skill under its category", async ({ page }) => {
    await page.goto("/skills/");
    const grouped = async (id: string) =>
      page.locator(`#skills-category-${id}`).locator("xpath=..").locator(".skills-item-title").allTextContents();

    expect((await grouped("pull-requests")).sort()).toEqual(["pr-lawyer", "pr-nurse", "pr-reviewer", "pr-scribe"]);
    expect(await grouped("ci")).toEqual(["ci-detective"]);
    expect((await grouped("orchestration")).sort()).toEqual(["coordinating-agents", "the-mister"]);
  });

  test("a skill page has per-skill commands, panel links, evidence and the six sections", async ({ page }) => {
    await page.goto("/skills/pr-reviewer/");

    await expect(page.locator("h1")).toHaveText("pr-reviewer");
    await expect(page.locator(".skill-install-cmd")).toHaveText([
      "npx skills add mdelapenya/coding-skills --skill pr-reviewer",
      "tessl install github:mdelapenya/coding-skills --skill pr-reviewer",
    ]);

    const panel = page.locator(".skill-panel");
    await expect(panel.locator(`a[href="${SKILL_MD}"]`)).toBeVisible();
    await expect(panel.locator(`a[href="${TESSL}"]`)).toBeVisible();
    await expect(panel.locator(`a[href="${SKILLS_SH}"]`)).toBeVisible();
    // Versions live only in the caption, as the release the evidence was measured on.
    await expect(panel.locator(".skill-meta")).toHaveCount(0);

    await expect(panel.locator(".skill-evidence tbody tr")).toHaveCount(6);
    await expect(panel.locator(".skill-evidence caption")).toContainText("Measured on plugin 1.2.3 (skill 2.1.0)");
    await expect(panel.locator(".skill-evidence thead th").first()).toHaveText("Scenario");

    // Each row starts with its scenario number, so "scenario 10" in the prose matches a row.
    const rows = panel.locator(".skill-evidence tbody tr th");
    await expect(rows).toHaveText([
      "2 · Review pinned to a revision",
      "3 · Adversarial review, author text as data",
      "10 · Subtle concurrency defects, safe-pattern trap",
      "11 · Same, single mode",
      "14 · Routine diff, default mode",
      "15 · Routine diff, staged mode",
    ]);
    await expect(panel.locator(".skill-evidence tbody tr").nth(2).locator("td")).toHaveText(["91%", "90%", "$0.83 → $6.32"]);

    await expect(page.locator(".skill-body h2")).toHaveText([
      "What it does",
      "When to reach for it",
      "How it works",
      /^It.s working if$/, // the site renders a typographic apostrophe
      "Evidence",
      "Read more",
    ]);

    const related = page.locator(".related-post-card");
    await expect(related).toHaveCount(3);
    for (const href of await related.evaluateAll((els) => els.map((el) => el.getAttribute("href")))) {
      expect(href).toMatch(/^\/posts\/[^/]+\/$/);
    }
  });

  test("every skill page has an install box with its own name", async ({ page }) => {
    for (const skill of SKILLS) {
      await page.goto(`/skills/${skill}/`);
      await expect(page.locator(".skill-install-cmd").first(), skill).toHaveText(
        `npx skills add mdelapenya/coding-skills --skill ${skill}`,
      );
      await expect(page.locator(".skill-evidence tbody tr").first(), skill).toBeVisible();
    }
  });

  test("scenario number 0 is shown too", async ({ page }) => {
    await page.goto("/skills/pr-scribe/");
    await expect(page.locator(".skill-evidence tbody tr th").first()).toHaveText("0 · Conventional Commits title and description");
  });

  test("the index hero asks to star the repo and to subscribe", async ({ page }) => {
    await page.goto("/skills/");
    const hero = page.locator(".skills-hero");
    await expect(hero.locator('a[href="https://github.com/mdelapenya/coding-skills"]')).toHaveCount(2);
    await expect(hero.getByRole("link", { name: "star the repository" })).toHaveAttribute(
      "href",
      "https://github.com/mdelapenya/coding-skills",
    );
    await expect(hero.getByRole("link", { name: "subscribe to the blog" })).toHaveAttribute("href", "/subscribe/");
  });

  test("the evidence table fits its panel at desktop width and the page does not scroll at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/skills/pr-reviewer/");
    const fits = await page.locator(".skill-evidence-wrap").evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    expect(fits.scroll, JSON.stringify(fits)).toBeLessThanOrEqual(fits.client);

    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/skills/pr-reviewer/");
    const doc = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(doc.scroll, JSON.stringify(doc)).toBeLessThanOrEqual(doc.client);
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`secondary text has at least 4.5:1 contrast in the ${scheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      const selectors = [
        ".skill-install-title",
        ".skill-install-label",
        ".skill-panel-heading",
        ".skill-evidence caption",
        ".skill-evidence thead th",
        ".skill-evidence-note",
      ];
      const expectDark = scheme === "dark";
      // The theme's dark stylesheet (<link id="dark-theme">) is switched on or off by main.js from the
      // preferred colour scheme. A dark case measured with it disabled would silently measure the light theme.
      const assertThemeSheet = async () => {
        await page.waitForFunction(
          (dark) => {
            const sheet = document.getElementById("dark-theme") as HTMLLinkElement | null;
            return !!sheet && sheet.disabled === !dark;
          },
          expectDark,
        );
        const sheet = await page.evaluate(() => {
          const el = document.getElementById("dark-theme") as HTMLLinkElement | null;
          return el ? { exists: true, disabled: el.disabled } : { exists: false, disabled: null };
        });
        expect(sheet.exists, `${scheme}: #dark-theme link exists`).toBe(true);
        expect(sheet.disabled, `${scheme}: #dark-theme disabled`).toBe(!expectDark);
      };
      const measure = (sels: string[]) =>
        page.evaluate(([sels, expectDark]: [string[], boolean]) => {
          // Text colour, opacity of the element and its ancestors, blended over the page background.
          const parse = (c: string) => (c.match(/[\d.]+/g) || []).map(Number);
          const blend = (fg: number[], bg: number[], a: number) => fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
          const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
          const lum = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
          // The background that really sits behind an element: its ancestors' background colours
          // composited from the outermost (html) in, over white. html can stay light while body is dark.
          const backdrop = (el: HTMLElement) => {
            const layers: number[][] = [];
            for (let n: HTMLElement | null = el; n; n = n.parentElement) layers.push(parse(getComputedStyle(n).backgroundColor));
            return layers.reverse().reduce((under, c) => blend(c, under, c[3] ?? 1), [255, 255, 255]);
          };
          const out: Record<string, number> = {};
          for (const sel of sels) {
            const el = document.querySelector(sel) as HTMLElement;
            const bg = backdrop(el);
            const bgLum = lum(bg);
            // Light case: the backdrop must be light. Dark case: it must be dark.
            if (expectDark ? bgLum >= 0.2 : bgLum <= 0.5) throw new Error(`${sel}: backdrop luminance ${bgLum} is not ${expectDark ? "dark" : "light"}`);
            let opacity = 1;
            for (let n: HTMLElement | null = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
            const fg = parse(getComputedStyle(el).color);
            const mixed = blend(fg, bg, (fg[3] ?? 1) * opacity);
            const [hi, lo] = [lum(mixed), lum(bg)].sort((a, b) => b - a);
            out[sel] = (hi + 0.05) / (lo + 0.05);
          }
          return out;
        }, [sels, expectDark] as [string[], boolean]);

      await page.goto("/skills/pr-reviewer/");
      await assertThemeSheet();
      for (const [sel, ratio] of Object.entries(await measure(selectors))) {
        expect(ratio, `${scheme} ${sel}`).toBeGreaterThanOrEqual(4.5);
      }
      await page.goto("/skills/");
      await assertThemeSheet();
      const index = await measure([".skills-item-description", ".skill-install-title", ".skill-install-label"]);
      for (const [sel, ratio] of Object.entries(index)) {
        expect(ratio, `${scheme} index ${sel}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test("the header has a Skills link between Projects and Public Speaking", async ({ page }) => {
    await page.goto("/");
    // Only the links with an href: the theme and menu toggles are <a> elements without one.
    const items = await page.locator(".header-nav .nav-links > .nav-link > a[href]").evaluateAll((els) =>
      els.map((el) => ({ text: (el.textContent || "").trim(), href: new URL((el as HTMLAnchorElement).href).pathname })),
    );

    const names = items.map((i) => i.text);
    const skills = names.indexOf("Skills");
    expect(skills).toBeGreaterThan(-1);
    expect(names[skills - 1]).toBe("Projects");
    expect(names[skills + 1]).toBe("Public Speaking");
    expect(items[skills].href).toBe("/skills/");
  });
});

// The clipboard API only exists on secure origins (https or localhost). When the suite runs in a
// container the site is reached over plain http through host.docker.internal, which is not one
// (--unsafely-treat-insecure-origin-as-secure is ignored by this headless Chromium). So the copy tests
// open the same server as http://localhost:<port> and a host resolver rule sends that name to the real
// host. A launchOptions override cannot sit in a describe group, so it applies to the whole file, and it
// replaces the config's launch args, so the CDN block is repeated.
const base = new URL(process.env.BASE_URL || "http://localhost:1313");
const secureContextHost = base.protocol === "https:" || ["localhost", "127.0.0.1"].includes(base.hostname);
const secureBase = secureContextHost ? base.origin : `http://localhost:${base.port || "80"}`;

test.use({
  launchOptions: {
    args: [
      "--host-resolver-rules=" +
        [
          "MAP cdn.jsdelivr.net ~NOTFOUND",
          "MAP challenges.cloudflare.com ~NOTFOUND",
          ...(secureContextHost ? [] : [`MAP localhost:${base.port || "80"} ${base.host}`]),
        ].join(", "),
    ],
  },
});

test.describe("copy button", () => {
  test.use({ baseURL: secureBase, permissions: ["clipboard-read", "clipboard-write"] });

  test("copies the command and shows the copied label", async ({ page }) => {
    await page.goto("/skills/");

    const button = page.locator(".skill-install-copy").first();
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Copy");
    await button.click();

    await expect(button).toHaveText("Copied");
    await expect(page.locator(".skill-install-status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("npx skills add mdelapenya/coding-skills");

    // The label goes back after a moment.
    await expect(button).toHaveText("Copy");
  });

  test("a skill page copies its own command", async ({ page }) => {
    await page.goto("/skills/pr-reviewer/");

    const buttons = page.locator(".skill-install-copy");
    await expect(buttons).toHaveCount(2);
    await buttons.nth(1).click();

    await expect(buttons.nth(1)).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "tessl install github:mdelapenya/coding-skills --skill pr-reviewer",
    );
  });

  test("without a clipboard the buttons stay hidden and the commands stay readable", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    });
    await page.goto("/skills/");

    await expect(page.locator(".skill-install-cmd").first()).toBeVisible();
    await expect(page.locator(".skill-install-copy")).toHaveCount(2);
    await expect(page.locator(".skill-install-copy").first()).toBeHidden();
    await expect(page.locator(".skill-install-copy").nth(1)).toBeHidden();
  });
});

// A browser that prefers English is redirected away from /es/ pages, so these use a Spanish one.
test.describe("Spanish", () => {
  test.use({ locale: "es-ES" });

  test("index is in Spanish and every skill link stays under /es/skills/", async ({ page }) => {
    await page.goto("/es/skills/");

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator(".skills-category-title")).toHaveText(["Orquestación", "Pull requests", "CI"]);
    await expect(page.locator(".skill-install-title")).toHaveText("Instala el plugin");
    await expect(page.locator(".skill-install-cmd")).toHaveText([
      "npx skills add mdelapenya/coding-skills",
      "tessl install mdelapenya/coding-skills",
    ]);

    const links = page.locator(".skills-item-title");
    await expect(links).toHaveCount(SKILLS.length);
    const hrefs = await links.evaluateAll((els) => els.map((el) => new URL((el as HTMLAnchorElement).href).pathname));
    expect(hrefs.sort()).toEqual(SKILLS.map((s) => `/es/skills/${s}/`).sort());
    for (const h of hrefs) {
      expect(h, h).toMatch(/^\/es\/skills\//);
    }
  });

  test("a skill page has Spanish labels, the evidence table and Spanish related posts", async ({ page }) => {
    await page.goto("/es/skills/pr-reviewer/");

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator(".skill-install-title")).toHaveText("Instala esta skill");
    await expect(page.locator(".skill-install-cmd")).toHaveText([
      "npx skills add mdelapenya/coding-skills --skill pr-reviewer",
      "tessl install github:mdelapenya/coding-skills --skill pr-reviewer",
    ]);

    const panel = page.locator(".skill-panel");
    await expect(panel).toHaveAttribute("aria-label", "Sobre esta skill");
    await expect(panel.locator(".skill-panel-heading")).toHaveText(["Enlaces", "Qué midieron las evals"]);
    await expect(panel.locator(`a[href="${SKILL_MD}"]`)).toHaveText("SKILL.md en GitHub");
    await expect(panel.locator(`a[href="${TESSL}"]`)).toHaveText("Registro de Tessl");
    await expect(panel.locator(`a[href="${SKILLS_SH}"]`)).toBeVisible();

    // The Spanish page has no evidence/version front matter of its own: it falls back to the English one.
    await expect(panel.locator(".skill-evidence caption")).toContainText("Medido con el plugin 1.2.3 (skill 2.1.0)");
    await expect(panel.locator(".skill-evidence tbody tr")).toHaveCount(6);
    await expect(panel.locator(".skill-evidence thead th").first()).toHaveText("Escenario");

    // The scenario names are in Spanish, with the same numbers as the English page.
    await expect(panel.locator(".skill-evidence tbody tr th")).toHaveText([
      "2 · Revisión fijada a un commit exacto",
      "3 · Revisión adversarial, el texto del autor como dato",
      "10 · Defectos sutiles de concurrencia, trampa de patrón seguro",
      "11 · Lo mismo, modo single",
      "14 · Diff rutinario, modo por defecto",
      "15 · Diff rutinario, modo staged",
    ]);
    await expect(panel.locator(".skill-evidence tbody tr").nth(2).locator("td")).toHaveText(["91%", "90%", "0,83 $ → 6,32 $"]);

    await expect(page.locator(".skill-body h2").first()).toHaveText("Qué hace");

    const related = page.locator(".related-post-card");
    await expect(related).toHaveCount(3);
    for (const href of await related.evaluateAll((els) => els.map((el) => el.getAttribute("href")))) {
      expect(href).toMatch(/^\/es\/posts\/[^/]+\/$/);
    }
  });

  test("the index hero asks to star the repo and to subscribe, with Spanish links", async ({ page }) => {
    await page.goto("/es/skills/");
    const hero = page.locator(".skills-hero");
    await expect(hero.getByRole("link", { name: "dar una estrella al repositorio" })).toHaveAttribute(
      "href",
      "https://github.com/mdelapenya/coding-skills",
    );
    await expect(hero.getByRole("link", { name: "suscribirte al blog" })).toHaveAttribute("href", "/es/subscribe/");
  });

  test("the header Skills link points at the Spanish index", async ({ page }) => {
    await page.goto("/es/");
    const link = page.locator(".header-nav .nav-links > .nav-link > a", { hasText: "Skills" });
    await expect(link).toHaveCount(1);
    expect(new URL((await link.getAttribute("href")) as string).pathname).toBe("/es/skills/");
  });
});
