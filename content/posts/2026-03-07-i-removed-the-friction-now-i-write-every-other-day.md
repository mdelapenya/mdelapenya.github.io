---
title: "I Removed the Friction. Now I Write Every Other Day."
date: 2026-03-07 09:00:00 +0100
description: "Front matter, cross-references, link audits, social promotion. Five SKILL.md files removed every friction point that stopped me from writing, and now I publish every other day."
categories: [Technology, AI, Software Development]
tags: ["claude-code", "coding-agents", "skills", "content-pipeline", "hugo"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-07-i-removed-the-friction/cover.png"
related:
  - "/posts/2026-02-26-spec-driven-development-bdd-agents"
  - "/posts/2026-02-24-coding-with-agents-like-tesla-autopilot"
---

![I Removed the Friction](/images/posts/2026-03-07-i-removed-the-friction/cover.png)

I used to need a full afternoon to write a blog post. Not because the writing took that long, but because I needed a long, uninterrupted block of time. Find the right topic, set up the front matter, write the draft, check the links, fix the cross-references, write the social copy. If I got interrupted halfway through, I'd lose context and the post would sit half-finished for days. Sometimes weeks.

The friction was never one thing. It was the need to hold the entire pipeline in my head at once.

Now I write in 5-10 minute bursts. I switch to a blog task, move it forward one step, switch back to whatever else I'm working on. The pipeline doesn't live in my head anymore. It lives in five `SKILL.md` files that remember where I left off and what comes next.

If you browse the [posts list](/posts/), you'll notice two icons next to each post: 🤖 for AI-generated, 🧑 for human-written. Each post also has a banner at the top saying which it is. It's a front matter field (`ai: true`) that the skills set automatically when drafting. From now on, every post will be labeled. Transparency is the baseline, not an afterthought.

## The Five Friction Points

Every post on this site is a [Hugo](https://gohugo.io/) markdown file. No database, no admin panel. That simplicity is great until you realize that "just write a markdown file" actually means: pick a topic, nail the front matter format, write the draft, validate all cross-references, and promote it on social media. Each step has its own friction.

**Finding a topic** used to mean scrolling through old posts, trying to remember what I'd promised to write about, and hoping inspiration struck. Now `/blog-planner` scans the existing posts, finds unfulfilled teasers, orphan conference talks, singleton tags, and suggests 3-5 concrete topics. I pick one, answer two interview rounds, and get a structured skeleton in minutes.

**Getting the front matter right** was a copy-paste-and-pray ritual. Date format wrong? Hugo silently ignores the post. Wrong `type` field? The post renders but doesn't show in the list. Now `/blog-writer` generates front matter from the conventions in `blog-config.md`. Date format, timezone, categories, tags, weight: all handled. I focus on the content.

**Writing the draft** is where the actual thinking happens, and it's the one step I don't want to automate away. But the writer interviews me section by section, so I can do one section in a 10-minute window and come back later for the next. The skill holds the structure. I bring the ideas.

**Editing and reviewing** used to mean re-reading the whole post with fresh eyes, catching tone shifts, trimming paragraphs that rambled, and making sure the closing didn't just re-summarize the intro. Now `/blog-editor` runs the review checklist: front matter compliance, section density, redundancy, em dash usage, and tone consistency. It flags issues and proposes fixes. When it's done, it triggers the keeper automatically. I still make the final call, but the editor catches what tired eyes miss.

**Checking links and references** was the step I always skipped. It's tedious, it feels like busywork, and broken links don't show up until a reader clicks them. Now `/blog-keeper` runs automatically after every edit pass. It catches broken cross-references, "coming soon" teasers that should now be real links, and premature links to posts that aren't published yet.

**Social promotion** was another "I'll do it later" task. Writing a LinkedIn post and a tweet for every blog post felt like a second job. Now `/blog-marketer` reads the finished post, interviews me for the target audience, and generates platform-specific drafts I can copy-paste. Same voice, same front matter, zero drift.

## Why 5-10 Minutes Works

The old workflow required a two-hour block because every step depended on holding context from the previous step. If I forgot the exact tag format, I'd have to look it up. If I couldn't remember which posts linked to each other, I'd have to grep. If I lost track of the social handles to tag, I'd have to check.

The skills hold all of that context. Each one knows the conventions, the existing posts, the cross-reference graph, the social handles. When I come back after a break, I don't need to reload any of that into my brain. I just invoke the next skill.

This is what changed my publishing frequency. Not speed. Not automation. The ability to **pick up and put down** the work without losing anything. I can plan three posts in an afternoon, draft one on a Tuesday morning, edit it during a lunch break on Wednesday, and schedule it for Friday. Each step is a 5-10 minute interaction. The skills remember the rest.

Before the skills, I published when I found the time. Now I schedule posts because I can plan ahead. The [SLM series](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner) (four parts) was planned in one sitting and drafted across three days in small increments. That would have taken me a month before.

## Where Skills Compound

The interesting part isn't what each skill does alone. It's how they amplify each other.

The keeper catches "coming soon" teasers that the writer left behind. When I published Part 3 of the [SLM series](/posts/2026-03-06-choosing-the-smallest-llm-part-3-evaluator-agent-and-tool-calling), the keeper scanned older posts and flagged the ones that said "more on that soon" about tool calling. Those teasers become real links. The keeper turns a scattered set of posts into a connected knowledge base.

The planner scans cross-references (which the keeper has validated) to find topic gaps. If three posts reference a concept that has no dedicated post, the planner surfaces that as a candidate. The validated link graph becomes a content roadmap.

Each skill makes the others more valuable. The network effect is the point.

## The Feedback Loop

The skills themselves have improved through use. Not through upfront design, but through failures.

The keeper originally treated every file on disk as "published." That broke when I started scheduling posts with future dates. The keeper was telling me to link to posts that weren't live yet. That false positive led to adding **publication-date awareness**: the keeper now checks the `date` field and only treats a post as linkable if its date is in the past.

The writer's interview workflow got sharper after the planner started producing more structured skeletons. Early skeletons were loose: a thesis and some bullet points. Now the planner produces section headings, cross-references, and a target length. The writer spends less time deciding what to write and more time writing it.

## What a Skill Actually Is

A skill is a markdown file with YAML front matter (name, description, allowed tools, version) followed by numbered instructions, concrete examples, and troubleshooting notes. It's a **workflow contract**, not a prompt. It constrains what the agent can do, prescribes how it does it, and teaches it to recover. The difference between a skill and a prompt is the difference between a [spec and a wish](/posts/2026-02-26-spec-driven-development-bdd-agents).

I use [Claude Code](https://docs.anthropic.com/en/docs/claude-code) as my day-to-day agent, but the format isn't tied to it. I built the [blog-skills repo](https://github.com/mdelapenya/blog-skills) so the same `SKILL.md` files work across Claude Code, GitHub Copilot, OpenAI Codex, and Gemini CLI. The canonical files live in `skills/`. Four symlinks inside the repo point each agent to its expected discovery path:

```
.agents/skills -> ../skills      # Codex + Gemini CLI
.claude/skills -> ../skills      # Claude Code
.github/skills -> ../skills      # Copilot
.gemini/skills -> ../skills      # Gemini CLI
```

One set of files, four platforms. Edit a skill once, every agent picks it up. The repo also includes a `blog-config.md` template where you set your blog's domain, timezone, social handles, and front matter conventions. The skills read that file at runtime, so they adapt to your site without editing the skills themselves.

Each skill is documented with its own examples and troubleshooting section. They're designed for Hugo blogs, but the pattern (planner, writer, editor, keeper, marketer) applies to any static site generator.

## Five Files, Zero Excuses

Five markdown files. No database, no admin panel, no SaaS subscription. Just skills that talk to each other and get better every time I use them. The best content system is the one that [lives where your content lives](/posts/2026-02-26-spec-driven-development-bdd-agents) and [gets out of the way](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot).

I don't find time to write anymore. I make time in 5-minute increments, and the skills handle the rest.

---

_Resources:_
- _[Agent Skills Open Standard](https://agentskills.io)_
- _[Claude Code Skills documentation](https://docs.anthropic.com/en/docs/claude-code/skills)_
- _[blog-skills plugin](https://github.com/mdelapenya/blog-skills)_
