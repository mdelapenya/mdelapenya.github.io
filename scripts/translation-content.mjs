#!/usr/bin/env node
// Checks the body of translations against their original, and the internal links of Spanish pages.
// Complements translation-sync.mjs (front matter drift); both run in `make i18n-check`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGroups, langOf, POSTS_DIR } from "./translation-sync.mjs";

// Layouts inherit these from the original, so a translation must not repeat them.
export const INHERITED_KEYS = ["image", "related", "ai", "showTableOfContents", "language"];

const FENCE = /^\s*(```+|~~~+)/;

function bodyOf(post) {
  return post.fm ? post.fm.lines.slice(post.fm.end + 1).join("\n") : post.text;
}

// Splits the body into prose (code removed) and the code blocks, in order.
export function splitBody(body) {
  const prose = [];
  const blocks = [];
  let fence = null;
  let current = [];
  for (const line of body.split("\n")) {
    if (fence) {
      if (FENCE.test(line) && line.trim().startsWith(fence)) {
        blocks.push(current.join("\n"));
        fence = null;
        current = [];
      } else current.push(line);
      continue;
    }
    const m = FENCE.exec(line);
    if (m) {
      fence = m[1];
      continue;
    }
    prose.push(line);
  }
  let text = prose.join("\n");
  text = text.replace(/\{\{<\s*highlight\b[^>]*>\}\}([\s\S]*?)\{\{<\s*\/highlight\s*>\}\}/g, (_, code) => {
    blocks.push(code);
    return "";
  });
  return { prose: text, blocks };
}

export function externalUrls(body) {
  return (body.match(/https?:\/\/[^\s)<>"'\]]+/g) || []).map((u) => u.replace(/[.,;:]+$/, "")).sort();
}

export function headingId(text) {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*]/g, "")
    .trim()
    .replace(/\s+#+$/, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\s-]/gu, "")
    .replace(/\s/g, "-");
}

export function headingIds(prose) {
  const ids = new Set();
  for (const line of prose.split("\n")) {
    const m = /^#{1,6}\s+(.+)$/.exec(line);
    if (m) ids.add(headingId(m[1]));
  }
  return ids;
}

const TYPOGRAPHY = [
  [/—/, "em dash"],
  [/[“”‘’]/, "curly quote"],
  [/[«»]/, "guillemet"],
];

// A code span that starts with a Spanish article, or has a Spanish preposition inside, is prose someone translated inside backticks.
const SPANISH_PLACEHOLDER = /^`(el|la|los|las|un|una)\s|\s(de|del|con|que)\s/i;

export function codeSpans(prose) {
  return (prose.match(/`[^`\n]+`/g) || []).sort();
}

function proseWithoutCodeSpans(prose) {
  return prose.replace(/`[^`\n]*`/g, "");
}

export function checkContent(dir = POSTS_DIR) {
  const errors = [];
  const rel = (p) => path.relative(process.cwd(), p.file);
  const groups = loadGroups(dir);

  for (const [key, posts] of groups) {
    const original = posts.find((p) => p.value("translatedFrom") === undefined);
    if (!original) continue;
    const oBody = splitBody(bodyOf(original));
    for (const t of posts.filter((p) => p !== original)) {
      for (const k of INHERITED_KEYS) {
        if (t.block(k)) errors.push(`${rel(t)}: "${k}" is inherited from the original, remove it`);
      }
      const tBody = splitBody(bodyOf(t));
      if (JSON.stringify(oBody.blocks) !== JSON.stringify(tBody.blocks)) {
        errors.push(`${rel(t)}: code blocks differ from ${rel(original)} (${tBody.blocks.length} vs ${oBody.blocks.length}); code must stay identical`);
      }
      if (JSON.stringify(externalUrls(bodyOf(original))) !== JSON.stringify(externalUrls(bodyOf(t)))) {
        errors.push(`${rel(t)}: external URLs differ from ${rel(original)}`);
      }
      const known = new Set(codeSpans(oBody.prose));
      const invented = [...new Set(codeSpans(tBody.prose))].filter((c) => !known.has(c) && SPANISH_PLACEHOLDER.test(c));
      if (invented.length) errors.push(`${rel(t)}: inline code not found in ${rel(original)} (translated code?): ${invented.slice(0, 5).join(" ")}`);
      const clean = proseWithoutCodeSpans(tBody.prose);
      for (const [re, name] of TYPOGRAPHY) {
        if (re.test(clean)) errors.push(`${rel(t)}: contains a ${name} in prose`);
      }
    }
  }

  const files = fs.readdirSync(dir).filter((n) => n.endsWith(".md") && !n.startsWith("_index"));
  const spanish = new Map();
  const english = new Set();
  for (const n of files) {
    if (langOf(n) === "es") spanish.set(n.replace(/\.es\.md$/, ""), n);
    else english.add(n.replace(/\.md$/, ""));
  }
  const spanishKeys = new Set();
  for (const posts of groups.values()) {
    if (posts.some((p) => langOf(p.file) === "es")) {
      for (const p of posts) if (langOf(p.file) !== "es") spanishKeys.add(path.basename(p.file, ".md"));
    }
  }

  const idsCache = new Map();
  const idsOf = (slug) => {
    if (!idsCache.has(slug)) {
      const text = fs.readFileSync(path.join(dir, spanish.get(slug)), "utf8");
      idsCache.set(slug, headingIds(splitBody(text).prose));
    }
    return idsCache.get(slug);
  };

  for (const [slug, name] of spanish) {
    const file = path.join(dir, name);
    const text = fs.readFileSync(file, "utf8");
    const relFile = path.relative(process.cwd(), file);
    const { prose } = splitBody(text);
    const stripped = proseWithoutCodeSpans(prose);
    for (const m of stripped.matchAll(/\]\(([^)\s]+)\)/g)) {
      const href = m[1];
      if (/^\.{1,2}\//.test(href)) {
        errors.push(`${relFile}: relative link "${href}" breaks under /es/; use an absolute path`);
        continue;
      }
      const es = /^\/es\/posts\/([^/#?]+)\/?(#.*)?$/.exec(href);
      if (es) {
        if (!spanish.has(es[1])) errors.push(`${relFile}: link "${href}" points to a Spanish post that does not exist`);
        else if (es[2] && !idsOf(es[1]).has(es[2].slice(1))) errors.push(`${relFile}: link "${href}" points to an anchor that is not a heading of the target`);
        continue;
      }
      const en = /^\/posts\/([^/#?]+)\/?(#.*)?$/.exec(href);
      if (en && (spanishKeys.has(en[1]) || spanish.has(en[1]))) {
        errors.push(`${relFile}: link "${href}" points to the English URL of a post that has a Spanish version; use /es/posts/...`);
      }
    }
  }

  return { errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv.find((a) => a.startsWith("--dir="))?.slice(6) || POSTS_DIR;
  const { errors } = checkContent(dir);
  if (errors.length) {
    console.error(`Translation content problems (${errors.length}):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("Translation content OK.");
}
