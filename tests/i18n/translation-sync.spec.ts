import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Content and scripts are mounted next to /tests in the Docker run (see Makefile).
const SCRIPT = "../../scripts/translation-sync.mjs";
const POSTS = path.resolve(__dirname, "../../content/posts");

const ORIGINAL = `---
title: "Hello"
date: 2026-01-01 09:00:00 +0100
categories: [Technology, AI]
tags: ["a", "b"]
type: post
weight: 30
translationKey: hello
---

Body.
`;

const TRANSLATION = `---
title: "Hola"
date: 2026-01-01 09:00:00 +0100
categories:
  - Technology
  - AI
tags: [a, b]
type: post
weight: 30
translationKey: hello
translatedFrom: abc1234
---

Cuerpo.
`;

function fixture(translation: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "translation-sync-"));
  fs.writeFileSync(path.join(dir, "2026-01-01-hello.md"), ORIGINAL);
  fs.writeFileSync(path.join(dir, "2026-01-01-hola.es.md"), translation);
  return dir;
}

test.describe("Translation front matter", () => {
  test("every translation matches its original", async () => {
    const lib = await import(SCRIPT);
    const { errors } = lib.checkAll(POSTS);
    expect(
      errors,
      `Translation front matter problems:\n\n${errors.map((e: string) => "  - " + e).join("\n")}\n\nFix the drift with: make i18n-sync`
    ).toEqual([]);
  });

  test("formatting differences are not drift", async () => {
    const lib = await import(SCRIPT);
    expect(lib.checkAll(fixture(TRANSLATION)).errors).toEqual([]);
  });

  test("drift in a synced field is reported", async () => {
    const lib = await import(SCRIPT);
    const dir = fixture(TRANSLATION.replace("tags: [a, b]", "tags: [a]").replace("weight: 30\n", ""));
    const { errors } = lib.checkAll(dir);
    expect(errors).toHaveLength(2);
    expect(errors.join("\n")).toContain('"tags" differs');
    expect(errors.join("\n")).toContain('"weight" differs');
  });

  test("fix restores the fields and leaves translated ones alone", async () => {
    const lib = await import(SCRIPT);
    const dir = fixture(TRANSLATION.replace("date: 2026-01-01", "date: 2026-02-02").replace("tags: [a, b]", "tags: [a]"));
    expect(lib.fixAll(dir)).toHaveLength(1);
    expect(lib.checkAll(dir).errors).toEqual([]);
    const fixed = fs.readFileSync(path.join(dir, "2026-01-01-hola.es.md"), "utf8");
    expect(fixed).toContain("title: \"Hola\"");
    expect(fixed).toContain("translatedFrom: abc1234");
    expect(fixed).toContain("date: 2026-01-01 09:00:00 +0100");
    expect(lib.fixAll(dir)).toHaveLength(0);
  });

  test("an unpaired translationKey is reported", async () => {
    const lib = await import(SCRIPT);
    const dir = fixture(TRANSLATION);
    fs.rmSync(path.join(dir, "2026-01-01-hola.es.md"));
    expect(lib.checkAll(dir).errors.join("\n")).toContain("has no counterpart");
  });
});
