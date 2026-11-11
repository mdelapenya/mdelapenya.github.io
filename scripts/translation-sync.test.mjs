import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkAll, fixAll } from "./translation-sync.mjs";

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

function fixture(translation) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "translation-sync-"));
  fs.writeFileSync(path.join(dir, "2026-01-01-hello.md"), ORIGINAL);
  fs.writeFileSync(path.join(dir, "2026-01-01-hola.es.md"), translation);
  return dir;
}

test("formatting differences are not drift", () => {
  assert.deepEqual(checkAll(fixture(TRANSLATION)).errors, []);
});

test("drift in a synced field is reported", () => {
  const dir = fixture(TRANSLATION.replace("tags: [a, b]", "tags: [a]").replace("weight: 30\n", ""));
  const { errors } = checkAll(dir);
  assert.equal(errors.length, 2);
  assert.match(errors.join("\n"), /"tags" differs/);
  assert.match(errors.join("\n"), /"weight" differs/);
});

test("fix restores the fields and leaves translated ones alone", () => {
  const dir = fixture(TRANSLATION.replace("date: 2026-01-01", "date: 2026-02-02").replace("tags: [a, b]", "tags: [a]"));
  assert.equal(fixAll(dir).length, 1);
  assert.deepEqual(checkAll(dir).errors, []);
  const fixed = fs.readFileSync(path.join(dir, "2026-01-01-hola.es.md"), "utf8");
  assert.match(fixed, /title: "Hola"/);
  assert.match(fixed, /translatedFrom: abc1234/);
  assert.match(fixed, /date: 2026-01-01 09:00:00 \+0100/);
  assert.equal(fixAll(dir).length, 0);
});

test("an unpaired translationKey is reported", () => {
  const dir = fixture(TRANSLATION);
  fs.rmSync(path.join(dir, "2026-01-01-hola.es.md"));
  assert.match(checkAll(dir).errors.join("\n"), /has no counterpart/);
});
