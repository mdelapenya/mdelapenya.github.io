---
title: "License Matters: A Hands-On Guide to Merging MIT Code into an Apache 2.0 Codebase with Full OSS Respect"
date: 2025-06-09 10:00:00 +0530
image: "/images/posts/2025-06-09-license-matters/cover.png"
description: "How to Merge MIT Code into an Apache 2.0 Codebase with Full OSS Respect"
categories: [Open Source, License, OSS]
tags: ["open-source", "license", "oss", "mit", "apache", "codebase", "merge", "respect"]
type: post
weight: 25
showTableOfContents: true
translationKey: license-matters
---

![Illustration representing OSS license merging](/images/posts/2025-06-09-license-matters/cover.png)

Open source isn’t just about code — it’s about trust, stewardship, and honoring the people and principles that built the foundations we stand on. When working on a recent SDK project, I faced a common but delicate challenge: merging an existing MIT-licensed repository into a new Apache 2.0 codebase. Rather than rush through it, I took the opportunity to do it right — preserving history, respecting license terms, and ensuring proper attribution. This post walks you through that process, step by step, with a strong focus on open source license compatibility, Git integrity, and community transparency.

## Context & Motivation

In the open source world, reuse is powerful — but it comes with responsibility. I am currently working on a new SDK under the Apache 2.0 license and needed a reliable, battle-tested implementation for a specific subsystem. I found exactly what I needed in an existing MIT-licensed repository: small, focused, and already proven in production by other tools in the ecosystem.

The natural impulse might be to copy and paste, tweak, and move on. But when you're building something meant to live and grow in the open — especially under a different license — it’s critical to pause and think about attribution, license obligations, and what it means to be a good OSS citizen.

Rather than absorb the code silently or strip it of its origin, I committed to integrating it in a way that preserved its full Git history, honored its authors, and complied with both the letter and spirit of the MIT and Apache 2.0 licenses.

## Legal and Licensing Considerations

Merging open source code across different licenses isn’t just a matter of technical compatibility — it’s a matter of legal clarity and community trust. Fortunately, the MIT License and the Apache License 2.0 are both permissive and broadly compatible, which makes integration feasible — as long as it’s done thoughtfully.

Before writing a single Git command, I outlined four non-negotiables to ensure the merge was clean and OSS-respectful:

1. **Preserve the original license**
    The MIT license requires that the original license text and copyright notices remain.

    ✅ I committed to keeping the license file verbatim in the new project.

2. **Preserve attribution**
    It’s not just about legal obligations — it’s about giving credit where it’s due.

    ✅ The plan included Git history preservation and a NOTICE file to clearly name the original authors.

3. **Disclose modifications**
    Transparency matters. If you're going to change the code, say so.

    ✅ I would document any restructuring or changes, both in the code and the NOTICE.

4. **Respect license boundaries**
    Apache 2.0 introduces some additional conditions, like NOTICE file inclusion and patent grants.

    ✅ I ensured nothing in the MIT code clashed, and I kept license separation explicit.

The key insight here is that OSS compatibility isn’t just "can I use this?" — it’s "can I use this **while preserving community norms and legal clarity?**" That answer, when handled right, is yes.

## The Merge Process

With the legal and ethical groundwork in place, it was time to do the actual integration — not by copy-pasting, but by merging in a way that preserved authorship, commit history, and intent.

Here’s the step-by-step process I followed:

### 🔁 1. Add the MIT repository as a remote

```bash
git remote add upstream-mit https://github.com/example-user/example-mit-repo.git
git fetch upstream-mit main --no-tags
```

The `--no-tags` flag is important: it prevents the upstream project’s tags from polluting your own tag history.

### 🌿 2. Create a dedicated import branch

```bash
git checkout -b import-mit
git merge --allow-unrelated-histories upstream-mit/main
```

Using `--allow-unrelated-histories` tells Git that this is an intentional history merge between two separate projects, and it's particularly important because:

- It maintains the attribution of the original MIT-licensed code, commits and authors
- It preserves the complete development history of both projects
- It allows for proper tracking of where the code came from
- It helps maintain transparency about the code's origins

### ⚔️ 3. Resolve merge conflicts

I encountered a conflict in the LICENSE file — both projects had one. Here’s how I resolved it:

- 🟢 Kept the existing Apache 2.0 LICENSE at the root.
- 🟦 Moved the MIT license to third_party/example-mit-repo/LICENSE, preserving it verbatim.
- 📁 Created the directory if it didn’t exist:

```bash
mkdir -p third_party/example-mit-repo
```

This ensured both licenses coexisted clearly, without blending or overriding one another.

### ✅ 4. Complete the merge with a transparent commit message

```text
Merge history of [example-mit-repo] (MIT licensed) into Apache 2.0 codebase  
Original project: https://github.com/example-user/example-mit-repo

The original code was licensed under the MIT License, and that license is preserved.  
The imported history helps preserve proper attribution to the original authors.
```

This message lives on in the Git log as a signal of intent — and respect.

## The NOTICE File

Under the Apache 2.0 license, if your project includes third-party code that comes with its own license or attribution requirements, you must include a `NOTICE` file. While the MIT license doesn’t require one, Apache 2.0’s section 4(d) does.

So I created a `NOTICE` file at the root of the project to:

- 🧾 Acknowledge the origin of the imported MIT code
- 🔍 Point to the preserved MIT license
- ✍️ Disclose that the code had been modified
- 🤝 Fulfill Apache 2.0’s notice requirements

Here’s the exact format I used:

```text
This NOTICE file is provided in compliance with section 4(d) of the Apache License, Version 2.0.

A useful SDK
Copyright (c) 2025-present Company Name

Based on the following third party software:

## example-mit-repo-1 (MIT License)
Source: https://github.com/example-user-a/example-mit-repo-1  
Author: Original contributors  
License: MIT (see third_party/example-mit-repo-1/LICENSE)

This code has been modified.

## example-mit-repo-2 (MIT License)
Source: https://github.com/example-user-b/example-mit-repo-2  
Author: Original contributors  
License: MIT (see third_party/example-mit-repo-2/LICENSE)

This code has been modified.
```

That last line for each third party software — _“This code has been modified”_ — is important. It shows that the imported code is not being redistributed as-is, and signals transparency about what you’ve changed.

The `NOTICE` file is also a useful reference point for future maintainers and contributors. It communicates clearly: this code didn’t appear from nowhere, and here’s how it was responsibly integrated.

## Clean Up and Integrate

Once the merge was complete and the licenses were properly documented, I moved on to the final phase: reshaping the imported code to fit the architecture and conventions of the main project.

Here’s how I handled that, while keeping attribution and legal clarity intact:

### 🧹 Remove what you don’t need

If the original MIT-licensed project includes tooling, CI configs, or example files you don’t plan to maintain, it’s fine to delete them — as long as you keep the license.

In my case, I:

- **Removed all code** from the original import that wasn’t relevant to the SDK’s structure.
- **Kept the license file** in third_party/example-mit-repo/LICENSE.

### 🧰 Restructure the code

Rather than keeping the MIT code in a third_party/ subdirectory (which is optional and often only used for vendored or external code), I moved the useful parts into my project’s layout.

This made the code maintainable and idiomatic for the SDK — while still:

- Preserving the commit history (thanks to Git)
- Honoring the license (thanks to LICENSE, NOTICE, and README)

**Important**: MIT’s permissiveness means you don’t need to keep the code “as is” or in its original structure — you just need to keep the license, attribution, and acknowledge modifications.

### 🧾 License location matters

Even though the code was refactored, I continued to:

- Store the original MIT license under `third_party/example-mit-repo/LICENSE`
- Reference that location from the `NOTICE` file
- Disclose modifications both in the code and documentation

This small effort pays off by keeping your repository OSS-respectful and future-proof — especially if you bring in more third-party code down the line.

## Updating the README

The main `README.md` is often the first place developers look to understand how to use — and trust — a project. That’s why it’s important to include a clear and transparent licensing section, especially when your project incorporates third-party code under a different license.

While all the legal details live in your `LICENSE` and `NOTICE` files, the `README` should communicate:

- 🔍 The primary license for your project
- 🧩 That third-party code is included under other permissive licenses
- ✍️ That modifications have been made
- 📂 Where to find those licenses

Here’s the licensing section I added:

```md
## Licensing

This project is licensed under the [Apache License 2.0](./LICENSE).

It includes portions of code derived from other open source projects which are licensed under the MIT License. Their original licenses are preserved [here](./third_party), and attribution is provided in the [NOTICE](./NOTICE) file.

Modifications have been made to this code as part of its integration into this project.
```

### ✅ Why this works

- It’s brief and clear
- It respects the original authors
- It helps downstream users (and companies) understand the licensing landscape at a glance

Even if users don’t open the `NOTICE` or `LICENSE` files, they’ll see this — and understand that your project takes licensing seriously.

## The Result

With this process, I didn’t just copy code — I preserved a piece of open source history.

By taking the time to merge responsibly, I ensured that:

- ✅ **The original authors** are still credited via Git history
- ✅ **The MIT license** is preserved and referenced in the right place
- ✅ **Modifications** are disclosed transparently
- ✅ **The Apache 2.0 codebase** remains compliant, clear, and maintainable
- ✅ **Future contributors** will understand where things came from — and how to continue building with care

This wasn’t just about legal checkboxes. It was about respect: for the people who wrote the code, the licenses that made it reusable, and the community that keeps open source moving forward.

Whether you're a solo maintainer or part of a company-backed OSS effort, it pays to be deliberate when integrating third-party code. The process may be slower — but the result is something you can build on with confidence and pride.
