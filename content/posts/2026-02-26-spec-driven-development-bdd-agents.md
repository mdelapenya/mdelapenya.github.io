---
title: "Spec-Driven Development: Is This the New BDD?"
date: 2026-02-26 09:00:00 +0100
description: "Exploring the parallels between 30-year-old modeling techniques, BDD, and the new wave of spec-driven development tools for AI agents."
categories: [Technology, AI, Software Development]
tags: ["artificial-intelligence", "bdd", "spec-driven-development", "agents", "software-engineering"]
type: post
weight: 30
showTableOfContents: true
---

Write specifications first, let something else handle the implementation. We've been chasing this dream for thirty years, UML, CASE tools, Model-Driven Architecture. Now AI agents are making us chase it again.

I got that déjà vu reading Birgitta Böckeler's ["Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl"](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html), shared with me by [Kevin Wittek](https://www.linkedin.com/in/kevin-wittek/). She explores three tools representing different approaches to "spec-driven development" (SDD): from simple markdown workflows (Kiro) to the ambitious "code as generated artifact" approach (Tessl).

## Thirty Years of Drawing Boxes

Böckeler raises an important concern: spec-as-source approaches risk combining "inflexibility and non-determinism." That's a polite way of saying you might get the worst of both worlds, the rigidity of model-driven development with the unpredictability of LLMs.

But maybe this time is different. Not because AI is magic, but because we've learned something from those thirty years of failure.

## The BDD Connection

As a BDD aficionado, I couldn't help but see the parallels. Behavior-Driven Development has always been about bridging the gap between business requirements and executable code. You write scenarios in plain language. Those scenarios become tests. The tests drive the implementation.

The promise of BDD was never fully realized, though. Writing good scenarios is hard. Maintaining them is harder. And the gap between the business language and the actual code remained significant enough that most teams either abandoned the approach or treated it as fancy documentation.

But now? With AI agents that can read natural language specifications and generate code? The equation changes. An `AGENTS.md` describing system behavior, a `plan.md` outlining expected outcomes, these are BDD scenarios in markdown. We're not writing Gherkin anymore, but the principle is the same: specify behavior first, let something else handle the implementation.

## The Human in the Loop

Here's where I part ways with the most optimistic takes on spec-driven development.

The reality is that agents own more and more of the code we ship. I'm fine with that, in principle. But "DO NOT EDIT" assumes something most teams don't have yet: a development environment that lets you **verify what the agent did with confidence**.

At the time of Böckeler's article, the [Tessl](https://tessl.io) framework marked generated code with "GENERATED FROM SPEC - DO NOT EDIT." That was bold. But Tessl has since evolved into something more interesting: a **package manager for agent skills and context**. Think npm, but for agent knowledge: versioned, evaluated, and distributable context bundles that teach agents how to interact with specific technologies, APIs, and codebases.

That's a meaningful shift. Instead of just generating code from specs, Tessl is now tackling the *context problem*: how do you give agents a reliable understanding of your environment so they generate the right code in the first place? Skills in their registry come with evaluation scores, quality checks, and regression detection, treating agent guidance as maintainable software, not disposable prompts.

It's the right direction. But "DO NOT EDIT" still assumes something most teams don't have: the infrastructure to verify what the agent did. Where's the isolated sandbox where the agent runs freely without touching your host? (We're [getting there](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows).) Where's the test suite that validates the output automatically? Tessl solves the context piece, but isolation and automated validation are the other two legs of the stool.

## A Dream Come True for Some

I have to admit, though: this new wave of spec-driven tools is a dream come true for certain organizations. You know the ones. The companies that always wanted to design software by drawing diagrams, connecting boxes and arrows on a canvas, and having that "spec source" magically become working code.

Yes, I'm looking at you, [BankSphere](https://es.wikipedia.org/wiki/BankSphere).

For decades, these organizations struggled with the gap between their visual models and actual implementations. They hired armies of developers to translate diagrams into code. They built elaborate processes to keep specs and code in sync. They mostly failed.

Now? An AI agent that can read a specification and generate code might finally deliver on that three-decade-old promise. The irony is delicious: the most old-school approach to software development might be vindicated by the newest technology.

## What We Actually Need

Böckeler identifies a real problem with current SDD tools: workflow inflexibility. Oversized for small problems, undersized for complex ones. Despite detailed specs, agents still ignore instructions or misinterpret existing code.

The answer isn't a better spec format. It's better infrastructure:

1. Write clear specifications when they add value
2. Let AI agents generate first drafts, **in isolation**
3. Validate automatically with tests and agent-driven exploration
4. Keep the specs alive if they help, discard them if they don't

That's not spec-first, spec-anchored, or spec-as-source. That's pragmatic software development: specs plus a safety net.

## The Real Question

Is spec-driven development the new BDD? Maybe. But that's the wrong question. The right one is: can we finally deliver on promises these approaches have been making for thirty years?

The generation side is closer than ever. But generation without verification is just hope. When the infrastructure catches up (sandboxes, test suites, persistent agent context), we'll get there.

Until then, we're still the human-in-the-loop. We verify behavior. We take "good enough" and push it to excellent. We catch the edge cases the spec didn't capture.

Our job is safe. Still. Not because agents can't write code, but because the tooling to *trust* that code isn't there yet for most teams.

---

*Thanks to Kevin Wittek for sharing the article that sparked this reflection.*

_Related:_
- _[Docker Sandboxes & Parallel Workflows](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows), The isolation piece: how sandboxes and git worktrees let agents run unsupervised_
- _[Coding with AI Agents: Like Driving a Tesla on Autopilot](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot), The supervision model for working with agents day-to-day_

_Coming soon:_
- _Testcontainers as the automated validation layer: the missing leg of the stool_
- _Agent skills in practice: from Tessl's registry to Claude Code skills, building the context layer_
