#!/usr/bin/env node
// Checks (default) or fixes (--fix) front matter drift between a post and its translations.
// A translation group is every file in content/posts sharing a `translationKey`.
// The original is the file without `translatedFrom`; translations copy SYNCED fields from it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Hugo reads these from each file (taxonomies, ordering, layout selection), so they cannot be inherited.
export const SYNCED_FIELDS = ["date", "categories", "tags", "type", "weight"];

const KEY_LINE = /^([A-Za-z_][\w-]*):(.*)$/;

export function parseFrontMatter(text) {
  const lines = text.split("\n");
  if (lines[0].trim() !== "---") return null;
  const end = lines.indexOf("---", 1);
  if (end === -1) return null;
  const blocks = [];
  for (let i = 1; i < end; i++) {
    const m = KEY_LINE.exec(lines[i]);
    if (m) blocks.push({ key: m[1], start: i, end: i + 1 });
    else if (blocks.length) blocks[blocks.length - 1].end = i + 1;
  }
  for (const b of blocks) b.lines = lines.slice(b.start, b.end);
  return { lines, end, blocks };
}

function unquote(s) {
  s = s.trim();
  const q = s[0];
  return (q === '"' || q === "'") && s.endsWith(q) && s.length > 1 ? s.slice(1, -1) : s;
}

function splitFlow(s) {
  const out = [];
  let cur = "";
  let quote = null;
  for (const c of s) {
    if (quote) {
      if (c === quote) quote = null;
      cur += c;
    } else if (c === '"' || c === "'") {
      quote = c;
      cur += c;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out.map(unquote);
}

export function normalizedValue(block) {
  const first = KEY_LINE.exec(block.lines[0])[2].trim();
  const rest = block.lines.slice(1).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (first.startsWith("[")) {
    const joined = [first, ...rest].join(" ");
    return splitFlow(joined.slice(joined.indexOf("[") + 1, joined.lastIndexOf("]")));
  }
  if (first === "" && rest.length && rest.every((l) => l.startsWith("-"))) {
    return rest.map((l) => unquote(l.slice(1)));
  }
  return unquote(first.replace(/\s+#.*$/, ""));
}

export function readPost(file) {
  const text = fs.readFileSync(file, "utf8");
  const fm = parseFrontMatter(text);
  if (!fm) return { file, text, fm: null };
  const block = (key) => fm.blocks.find((b) => b.key === key);
  const value = (key) => (block(key) ? normalizedValue(block(key)) : undefined);
  return { file, text, fm, block, value };
}

export function loadGroups(dir) {
  const groups = new Map();
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith(".md") || name.startsWith("_index")) continue;
    const post = readPost(path.join(dir, name));
    const key = post.fm && post.value("translationKey");
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(post);
  }
  return groups;
}

export function langOf(file) {
  const m = /\.([a-z]{2})\.md$/.exec(file);
  return m ? m[1] : "en";
}

export function checkGroup(key, posts) {
  const errors = [];
  const rel = (p) => path.relative(process.cwd(), p.file);
  const originals = posts.filter((p) => p.value("translatedFrom") === undefined);
  const translations = posts.filter((p) => p.value("translatedFrom") !== undefined);
  const langs = new Map();
  for (const p of posts) {
    const l = langOf(p.file);
    langs.set(l, [...(langs.get(l) || []), rel(p)]);
  }
  for (const [l, files] of langs) {
    if (files.length > 1) errors.push(`translationKey "${key}" is used twice in language "${l}": ${files.join(", ")}`);
  }
  if (posts.length < 2) errors.push(`translationKey "${key}" has no counterpart: only ${rel(posts[0])}`);
  if (originals.length !== 1) {
    errors.push(`translationKey "${key}" needs exactly one original (no \`translatedFrom\`), found ${originals.length}: ${originals.map(rel).join(", ")}`);
    return { errors, fixable: [] };
  }
  const [original] = originals;
  const fixable = [];
  for (const t of translations) {
    for (const field of SYNCED_FIELDS) {
      const want = original.value(field);
      const got = t.value(field);
      if (JSON.stringify(want) === JSON.stringify(got)) continue;
      if (want === undefined && got === undefined) continue;
      fixable.push({ post: t, original, field });
      errors.push(
        `${rel(t)}: "${field}" differs from ${rel(original)}\n      original:    ${JSON.stringify(want)}\n      translation: ${JSON.stringify(got)}`
      );
    }
  }
  return { errors, fixable };
}

export function applyFix(post, original, field) {
  const src = original.block(field);
  const dst = post.block(field);
  const lines = post.fm.lines;
  if (src && dst) lines.splice(dst.start, dst.end - dst.start, ...src.lines);
  else if (src) {
    const anchor = post.block("translationKey");
    lines.splice(anchor ? anchor.start : post.fm.end, 0, ...src.lines);
  } else if (dst) lines.splice(dst.start, dst.end - dst.start);
  post.fm = parseFrontMatter(lines.join("\n"));
  post.block = (key) => post.fm.blocks.find((b) => b.key === key);
  post.value = (key) => (post.block(key) ? normalizedValue(post.block(key)) : undefined);
  post.text = post.fm.lines.join("\n");
}

export function checkAll(dir) {
  const errors = [];
  const fixable = [];
  for (const [key, posts] of loadGroups(dir)) {
    const r = checkGroup(key, posts);
    errors.push(...r.errors);
    fixable.push(...r.fixable);
  }
  return { errors, fixable };
}

export function fixAll(dir) {
  const changed = new Set();
  for (const [key, posts] of loadGroups(dir)) {
    const { fixable } = checkGroup(key, posts);
    for (const f of fixable) {
      applyFix(f.post, f.original, f.field);
      changed.add(f.post);
    }
  }
  for (const p of changed) fs.writeFileSync(p.file, p.text);
  return [...changed].map((p) => p.file);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const POSTS_DIR = path.resolve(HERE, "../content/posts");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv.find((a) => a.startsWith("--dir="))?.slice(6) || POSTS_DIR;
  if (process.argv.includes("--fix")) {
    const changed = fixAll(dir);
    console.log(changed.length ? `Synced ${changed.length} file(s):\n  ${changed.map((f) => path.relative(process.cwd(), f)).join("\n  ")}` : "Nothing to sync.");
  }
  const { errors, fixable } = checkAll(dir);
  if (errors.length) {
    console.error(`Translation front matter problems (${errors.length}):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    if (fixable.length) console.error("\nFix the drift with: make i18n-sync  (node scripts/translation-sync.mjs --fix)");
    process.exit(1);
  }
  console.log("Translations are in sync.");
}
