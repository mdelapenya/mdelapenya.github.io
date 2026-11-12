import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkContent, checkPageLinks, headingId } from "./translation-content.mjs";

const FM = (extra = "") => `---
title: "T"
date: 2026-01-01 09:00:00 +0100
categories: [Technology]
tags: ["a"]
type: post
weight: 30
translationKey: hello
${extra}---
`;

const ORIGINAL = `${FM()}
Run \`command X\` and read https://example.com/docs.

\`\`\`bash
echo "hi"
\`\`\`

## First step
`;

const TRANSLATION = `${FM("translatedFrom: abc1234\n")}
Ejecuta \`command X\` y lee https://example.com/docs.

\`\`\`bash
echo "hi"
\`\`\`

## Primer paso

Mira [el otro post](/es/posts/2026-01-02-otro/#primer-paso).
`;

const OTHER = `${FM().replace("hello", "other")}
## Primer paso
`;

function fixture(translation, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "translation-content-"));
  fs.writeFileSync(path.join(dir, "2026-01-01-hello.md"), ORIGINAL);
  fs.writeFileSync(path.join(dir, "2026-01-01-hola.es.md"), translation);
  fs.writeFileSync(path.join(dir, "2026-01-02-otro.es.md"), OTHER);
  for (const [name, text] of Object.entries(extra)) fs.writeFileSync(path.join(dir, name), text);
  return dir;
}

const errorsOf = (translation, extra) => checkContent(fixture(translation, extra)).errors.join("\n");

test("a faithful translation passes", () => {
  assert.deepEqual(checkContent(fixture(TRANSLATION)).errors, []);
});

test("changed code blocks are reported", () => {
  assert.match(errorsOf(TRANSLATION.replace('echo "hi"', 'echo "hola"')), /code blocks differ/);
});

test("changed external URLs are reported", () => {
  assert.match(errorsOf(TRANSLATION.replace("example.com/docs", "example.com/es/docs")), /external URLs differ/);
});

test("inherited keys are reported", () => {
  assert.match(errorsOf(TRANSLATION.replace("translatedFrom: abc1234\n", 'translatedFrom: abc1234\nimage: "/a.png"\n')), /"image" is inherited/);
});

test("typography is checked in prose but not in code", () => {
  assert.match(errorsOf(TRANSLATION.replace("Ejecuta", "Ejecuta, y—")), /em dash/);
  assert.match(errorsOf(TRANSLATION.replace("Ejecuta", "Ejecuta “esto”")), /curly quote/);
  assert.deepEqual(checkContent(fixture(TRANSLATION.replace('echo "hi"', 'echo "hi" # a — b'), {})).errors.filter((e) => /em dash/.test(e)), []);
});

test("translated placeholders inside code spans are reported", () => {
  assert.match(errorsOf(TRANSLATION.replace("`command X`", "`el comando X`")), /translated code/);
});

test("relative links are reported", () => {
  assert.match(errorsOf(TRANSLATION.replace("/es/posts/2026-01-02-otro/#primer-paso", "../2026-01-02-otro")), /relative link/);
});

test("links to a missing Spanish post or anchor are reported", () => {
  assert.match(errorsOf(TRANSLATION.replace("2026-01-02-otro", "2026-01-09-nada")), /does not exist/);
  assert.match(errorsOf(TRANSLATION.replace("#primer-paso", "#first-step")), /not a heading/);
});

test("English URLs of posts that have a Spanish version are reported", () => {
  assert.match(errorsOf(TRANSLATION.replace("/es/posts/2026-01-02-otro/#primer-paso", "/posts/2026-01-01-hello/")), /use \/es\/posts/);
});

test("heading ids follow the rendered text", () => {
  assert.equal(headingId("5. Testing exploratorio: ¿qué `hace`?"), "5-testing-exploratorio-qué-hace");
});

test("links to English projects, talks or subscribe in a Spanish post are reported", () => {
  assert.match(errorsOf(TRANSLATION.replace("/es/posts/2026-01-02-otro/#primer-paso", "/projects/ultraligera/")), /use \/es\/projects\/ultraligera\//);
  assert.match(errorsOf(TRANSLATION.replace("/es/posts/2026-01-02-otro/#primer-paso", "/subscribe/")), /use \/es\/subscribe\//);
  assert.equal(errorsOf(TRANSLATION.replace("/es/posts/2026-01-02-otro/#primer-paso", "/es/talks/")), "");
});

function pagesFixture(name, text, section = "projects") {
  const content = fs.mkdtempSync(path.join(os.tmpdir(), "translation-pages-"));
  fs.mkdirSync(path.join(content, "posts"));
  fs.copyFileSync(path.join(fixture(TRANSLATION), "2026-01-01-hello.md"), path.join(content, "posts", "2026-01-01-hello.md"));
  fs.writeFileSync(path.join(content, "posts", "2026-01-01-hola.es.md"), TRANSLATION);
  fs.writeFileSync(path.join(content, "posts", "2026-01-02-otro.es.md"), OTHER);
  fs.mkdirSync(path.join(content, section));
  fs.writeFileSync(path.join(content, section, name), text);
  return content;
}

const PAGE = (body, extra = "") => `---\ntitle: "P"\ntype: page\n${extra}---\n\n${body}\n`;

test("Spanish pages of projects, talks and subscribe are checked for links", () => {
  const ok = pagesFixture("x.es.md", PAGE("Mira [el post](/es/posts/2026-01-02-otro/) y [charlas](/es/talks/)."));
  assert.deepEqual(checkPageLinks(ok).errors, []);

  const english = pagesFixture("x.es.md", PAGE("Mira [las charlas](/talks/)."), "subscribe");
  assert.match(checkPageLinks(english).errors.join("\n"), /use \/es\/talks\//);

  const post = pagesFixture("x.es.md", PAGE("Mira [el post](/posts/2026-01-01-hello/)."));
  assert.match(checkPageLinks(post).errors.join("\n"), /use \/es\/posts/);

  const image = pagesFixture("x.es.md", PAGE("Hola.", "image: /images/x.png\n"));
  assert.match(checkPageLinks(image).errors.join("\n"), /repeats "image"/);
});
