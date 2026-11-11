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
- Drift check: `make i18n-check` (also a Playwright spec, `tests/i18n/translation-sync.spec.ts`, so CI fails on it). `make i18n-sync` copies the five synced fields from each original into its translations.- Pages without a translation in the reader's language show a notice (`[params.untranslated]` in `hugo.toml`); UI strings live in `i18n/*.toml`.
- Language is chosen client-side: `localStorage.lang` (set by the EN/ES selector) beats the browser language. See `layouts/partials/language-detect.html`.
- `/langmap.json` lets `layouts/404.html` redirect a request for a slug in the other language.
- Tests: `tests/i18n/`.

### Talks (`content/talks/_index.md`)

Single `_index.md` file with all talks listed by year. Each entry includes conference name, title, URL, video link, and slides link. Slides PDFs live in `static/slides/`.

### Projects (`content/projects/`)

Individual markdown files per project with: title, type, tags, description.

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
