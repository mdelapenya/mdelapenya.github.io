---
name: translation-sync
description: Check and fix front matter drift between a blog post and its translations. Use when the user says "sync translations", "check translation drift", "fix the front matter of the translation", "translation-sync", after editing the date, tags, categories, type or weight of a post that has a translation, or when the translation-sync test or `make i18n-check` fails. Do NOT use to translate a post (use blog-translator) or to change translated text.
allowed-tools: Read Bash Grep Glob
---

# Translation Sync

A post and its translations are paired by `translationKey`. Hugo reads `date`, `categories`, `tags`, `type` and `weight` from each file (taxonomies, ordering, layout), so those five must be identical across a translation group. The original is the file without `translatedFrom`; the translations copy from it.

`image`, `related`, `ai` and `showTableOfContents` are inherited by the layouts: leave them out of a translation unless it needs its own value (for example a localised cover image).

## Procedure

1. Run `make i18n-check` (same as `node scripts/translation-sync.mjs`). Exit 0 means nothing to do; stop.
2. Read the report. Each problem names the file, the field, and both values. Problems that are not drift (a `translationKey` with no counterpart, used twice in one language, or with zero or several originals) are not fixable by the script: fix them by hand or ask the author.
3. Before fixing, confirm which side is right. The script assumes the original is correct. If the author edited the translation on purpose (for example to change the post's date), apply that edit to the original instead.
4. Run `make i18n-sync` (`--fix`). It rewrites only the five synced fields in the translation files and prints which files changed.
5. Run `make i18n-check` again and `git diff` to show the author exactly what changed.

## Rules

- Never edit `title`, `description`, `translatedFrom` or the body to resolve drift.
- Tags and categories are never translated.
- If the original's body changed after the translation was made, that is staleness, not drift: this skill does not handle it. Compare `translatedFrom` with the original's history and tell the author.
