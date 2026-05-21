---
title: "I Sent a Message on Telegram. A Pull Request Appeared on GitHub."
date: 2026-05-22 09:00:00 +0200
description: "I described a blog post idea on Telegram. Twenty minutes later, a pull request existed on GitHub. I never opened a terminal, never touched git, never ran a single command."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "nanoclaw", "telegram", "hugo", "skills", "content-pipeline", "developer-experience"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-05-22-i-sent-a-message-on-telegram-a-pull-request-appeared-on-github/cover.png"
related:
  - "/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day"
  - "/posts/2026-04-27-a-personal-ai-that-reads-my-bills"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

I typed a message in Telegram. Something like: "I want to write a post about the setup we just built for writing blogs from Telegram." I sent it to TheBlog, one of the topics in my personal AI group. Twenty minutes later, the agent sent me a link. A pull request existed on GitHub with a draft of this post, a branch, a conventional commit, and a structured PR description. I had not opened a terminal. I had not run git. I had not touched my laptop.

That is not a demo. It is the same assistant that already reads my electricity bills, summarizes my emails, and answers questions about my bank account. The system I described in [A Personal AI That Reads My Bills](/posts/2026-04-27-a-personal-ai-that-reads-my-bills) just grew a new capability. The infrastructure was already there. I wired a new topic to it.

## Two systems, one workflow

Two pieces make this work.

The first is [NanoClaw](https://github.com/nanocoai/nanoclaw): an open-source AI orchestrator that runs on my home NAS, inside a VM. When a message arrives on Telegram, NanoClaw spins up a container for that topic, loads its configuration, and runs Claude Code inside it. Each topic is an isolated agent with its own workspace, its own personality, and its own tools. TheBlog is one of those topics. Its entire job is to manage the blog.

The second is [blog-skills](https://github.com/mdelapenya/blog-skills): five `SKILL.md` files, one per step of the pipeline. I already [wrote about how they removed the friction from writing](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day). What is different here is where they run. Every skill is invoked from Telegram. Every question the skill asks comes back to Telegram. I answer from my phone. The agent writes.

## What the TheBlog topic knows

When NanoClaw spins up the TheBlog container, it has everything it needs already in place.

The blog repository is pre-cloned in the VM. The container mounts it directly: no checkout, no clone, no waiting. The agent can read every existing post, run git commands, create branches, commit, and push.

The blog-skills repository is also pre-cloned and mounted. All five skills are installed as slash commands. When the agent runs `/blog-planner` or `/blog-writer`, it is loading a skill file that is already on disk.

Authentication is handled by a fine-grained GitHub token. The scope is minimal by design: Contents (read/write) and Pull Requests (read/write), limited to the blog repository only. It cannot touch any other repository. It cannot read organization data. Least-privilege access is the baseline, not an afterthought. The token lives in the container environment, injected at spawn time.

The result: the agent starts every conversation with the full toolchain ready. No setup, no installation, no environment configuration. The VM is the persistent infrastructure. The agent inherits everything it needs.

## The workflow, step by step

When I send "I want to write a post about X" to TheBlog, this is what happens.

**Repo state check.** The agent runs `git status` and confirms it is on `main` with a clean working tree. If there is unfinished work from a previous session, it stops and asks before continuing.

**`/blog-planner`.** The planner scans all existing posts, identifies gaps and cross-reference opportunities, then interviews me in two or three focused rounds. What is the angle? What personal experience anchors it? What should the reader take away? It produces a structured skeleton: front matter, a hook draft, section headings with one-sentence descriptions, and suggested cross-references. I review and approve before anything gets written.

**Branch creation.** Once I approve the skeleton, the agent creates a branch: `post/YYYY-MM-DD-slug`. It refreshes `main` first and verifies the branch does not already exist.

**`/blog-writer`.** The writer takes the skeleton and drafts section by section, asking one focused question per section to get my actual perspective rather than generic prose. I answer from Telegram. The agent writes.

**`/blog-editor`.** The editor runs a checklist: front matter completeness, section density, redundancy, em dashes, tone consistency, closing quality. It flags issues and applies fixes. When a fix requires my judgement, it asks.

**`/blog-keeper`.** The keeper audits every internal link and cross-reference: broken targets, premature links to unpublished posts, "coming soon" teasers that now have matching posts. Read-only. It reports; it does not edit.

**Commit, push, and `/pr-scribe`.** The agent commits the file, pushes the branch, and runs `/pr-scribe` to generate a Conventional Commits title and a structured PR description from the diff. The PR body includes what changed, why it matters, and a test plan.

**The link arrives in chat.** The agent sends me the PR URL. I open it on my phone, read the draft, and decide: approve, comment, or request changes.

The whole thing is a conversation with checkpoints. The agent asks, I answer, the work advances. I am not watching a script run. I am collaborating with something that holds all the context between steps so I do not have to.

## The phone as the writing surface

There is a line I used to draw between devices. The computer was where I produced things. The phone was where I consumed them. That line held because production required a toolchain: an editor, a terminal, git, Hugo, a browser for previewing. All of that lived on the computer.

That line is gone now.

The phone did not change. The agent absorbed the toolchain. Every step that required a terminal, a file system, or a git command happens inside a container the agent controls. I contribute the ideas and the decisions. The agent handles everything else.

What actually changes when that friction disappears: I no longer defer writing to "when I'm at my desk." A thought on the bus becomes a draft. A conversation becomes a skeleton. The blog post that would have waited until the weekend ships on Tuesday, started from a message I sent while making coffee.

The phone is not a degraded version of the computer for this workflow. It is the right tool. Text input, fast, always with me. The agent does the rest.

## The loop closes

This post started as a message on Telegram. The agent opened the PR. I approved the merge.

---

_Resources:_
- _[NanoClaw](https://github.com/nanocoai/nanoclaw)_
- _[blog-skills](https://github.com/mdelapenya/blog-skills)_
- _[coding-skills](https://github.com/mdelapenya/coding-skills)_
- _[Claude Code skills documentation](https://docs.anthropic.com/en/docs/claude-code/skills)_
