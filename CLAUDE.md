# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hugo static site for mdelapenya.xyz — a personal blog, project portfolio, and public speaking directory. Uses the **Gokarna** theme (git submodule in `themes/gokarna`).

- **Hugo version:** 0.169.0 (extended edition required)
- **Deployed to:** GitHub Pages via GitHub Actions on push to `main`
- **Configuration:** `hugo.toml`
- **Gokarna theme docs**: https://themes.gohugo.io/themes/gokarna/ 

## Common Commands

```bash
# Local development (requires Hugo installed)
hugo server --buildDrafts --buildFuture

# Build static site to public/
hugo --gc --minify

# Docker-based development (no local Hugo needed)
make serve    # builds Docker image then serves on localhost:1313
make clean    # removes Docker image
```

## Content Structure

### Blog Posts (`content/posts/`)

File naming: `YYYY-MM-DD-slug-title.md`

Front matter template:
```yaml
---
title: "Post Title"
date: YYYY-MM-DD HH:MM:SS +0100
description: "Short summary"
categories: [Category1, Category2]
tags: ["tag1", "tag2"]
type: post
weight: 30
showTableOfContents: true  # optional
image: "/images/posts/..."  # optional cover image
---
```

### Translations (i18n)

English is the default language and lives at the root; Spanish lives under `/es/`. A post and its translation are paired by a shared `translationKey` in the front matter. The translation is a sibling file `<slug-in-target-language>.es.md` in `content/posts/`, so its URL comes from its own filename.

```yaml
translationKey: skills-are-roles-not-commands   # same value in both files
translatedFrom: f4d2f0c                         # short SHA of the source at translation time (translation only)
```

- Front matter of a translation: translated `title` and `description`, `translationKey`, `translatedFrom`, plus `date`, `categories`, `tags`, `type` and `weight` **identical to the original** (Hugo reads them per file). `image`, `related`, `ai` and `showTableOfContents` are inherited from the original by the layouts; add them to a translation only to override (e.g. a localised cover).
- Tags and categories are never translated.
- Drift check: `make i18n-check` (exit 1 and a console report on drift; unit tests in `scripts/translation-sync.test.mjs`, run with `make i18n-test`). It also runs `scripts/translation-content.mjs`, which compares each translation's body with its original (code blocks, external URLs, inline code, inherited keys, em dashes and curly quotes) and validates the links in Spanish pages (no relative links, `/es/posts/...` targets and anchors must exist, no English URL for a post that has a Spanish version). `make i18n-sync` copies the five synced fields from each original into its translations. The `translation-sync` skill in `.claude/skills/` wraps both (committed with `git add -f`, since `.claude/` is gitignored).
- Pages without a translation in the reader's language show a notice (`[params.untranslated]` in `hugo.toml`); UI strings live in `i18n/*.toml`.
- Language is chosen client-side: `localStorage.lang` (set by the EN/ES selector) beats the browser language. See `layouts/partials/language-detect.html`.
- `/langmap.json` lets `layouts/404.html` redirect a request for a slug in the other language.
- Tests: `tests/i18n/`.
- Projects, talks and the subscribe page are translated too, but they are not posts: the Spanish file sits beside the English one (`content/projects/<name>.es.md`, `content/talks/_index.es.md`, `content/subscribe/_index.es.md`) and Hugo pairs them by file name, so **do not set `translationKey` on them** (an unpaired key breaks the pairing in one direction). They carry no `translatedFrom`. Inline links must be `/es/...`; `make i18n-check` fails on links to the English `/projects/`, `/talks/`, `/subscribe/`.
- The Spanish menu in `hugo.toml` must point at `/es/...` for every internal link. Layouts and partials must build internal links with `relLangURL` (never a bare `/path/`), and any user-visible string goes through `i18n` (`i18n/en.toml` and `i18n/es.toml`).

### Talks (`data/talks.yaml`, `content/talks/_index.md`)

`data/talks.yaml` holds every entry (conference, date, location, items) and `layouts/talks/list.html` renders it by year; the `_index.md` only has the intro. Slides PDFs live in `static/slides/`. Free text in the data (`note`, `description`) has an optional Spanish twin (`note_es`, `description_es`) that the `/es/` page prefers; the commit-type words (talk, workshop, booth...) stay in English on purpose. Other UI strings of the page are in `i18n/*.toml` (`talks*` keys).

### Projects (`content/projects/`)

Individual markdown files per project with: title, type, tags, description. `_index.md` must keep `type: projects` (and the talks one `type: talks`), otherwise Hugo >= 0.146 does not pick `layouts/projects/list.html` / `layouts/talks/list.html`. Likewise the tag page template is `layouts/tags/term.html` and the tag index `layouts/tags/terms.html`.

## Custom Shortcodes

- **`image-gallery`** — Responsive gallery with modal. Images loaded from `assets/album/[gallery-name]/`. Generates thumbnails (300x300) and full-size (1600x1600).
- **`flex-gallery`** — Flexible gallery layout variant.

## Layout Customizations

Custom layouts override the Gokarna theme in `layouts/`:
- `partials/` — page, list, pagination, footer overrides
- `shortcodes/` — image gallery components
- `tags/` and `talks/` — taxonomy and section templates

Custom CSS in `static/css/`: images, image-gallery, pagination, breadcrumb, tag-cloud, taxonomy.

## Git Conventions

Follow conventional commits for commit messages format:

```
feat(scope): description      # new features
fix(scope): description       # bug fixes
chore(scope): description     # maintenance
deps: bump <package>          # dependency updates
```


## Key Details

- Goldmark renderer has `unsafe = true` enabled (allows raw HTML in markdown)
- KaTeX is loaded for math rendering (`$...$` inline, `$$...$$` display)
- The Gokarna theme is a git submodule — clone with `--recursive` or run `git submodule update --init`
- Image processing: Lanczos filter, 75% quality, smart anchor (`hugo.toml` `[imaging]`)
- Minification is enabled in production builds
