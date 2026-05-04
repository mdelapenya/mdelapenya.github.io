---
title: "A Virtual Agent Team at Docker: How the Coding Agent Sandboxes Team Uses a Fleet of Agents to Ship Faster"
date: 2026-05-04 09:00:00 +0200
description: "Twenty Claude skills, seven Fleet roles, GitHub workflows, and one ralph-loop. How we built a virtual team of agents at Docker in a couple of weeks, running the same skills locally and on CI."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "skills", "docker", "docker-sandboxes", "github-actions", "ci-cd"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-05-04-a-virtual-agent-team-at-docker/cover.png"
related:
  - "/posts/2026-03-27-from-loop-to-ci-ralph-and-the-level-6-pattern"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
  - "/posts/2026-03-11-coding-agents-as-exploratory-testers"
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
---

![A Virtual Agent Team at Docker](/images/posts/2026-05-04-a-virtual-agent-team-at-docker/cover.png)

*This post was originally published on the [Docker Blog](https://www.docker.com/blog/a-virtual-agent-team-at-docker-how-the-coding-agent-sandboxes-team-uses-a-fleet-of-agents-to-ship-faster/) on May 1, 2026.*

I work on Coding Agent Sandboxes, aka "sbx" at Docker. The project provides secure, [microVM-based isolation](https://docs.docker.com/ai/sandboxes/) for running AI coding agents like Claude Code, Gemini, Codex, Docker Agent and Kiro. Agents get full autonomy inside a sandbox (their own Docker daemon, network, filesystem) without touching your host system. Over the past couple of weeks, we built something on top of it: a virtual team of seven AI agent roles that test the product, triage issues, post release notes, and even fix bugs, all running autonomously in CI. We call it the Fleet.

The Fleet is built on [Claude Code skills](https://code.claude.com/docs/en/skills): markdown files that give an agent a persona, a set of responsibilities, and the tools it's allowed to use. Think of a skill not as a script that says "run these steps," but as a role description that says "you are the build engineer, here's what you know and how you make decisions." That distinction matters because agents need judgment, not just instructions. When a test fails unexpectedly, a script stops. A role investigates.

The same skill file, the same behavior, whether it runs on a developer's laptop or in CI.

## Local First, CI Second

Coding Agent Sandboxes is a CLI tool (`sbx`) that manages sandbox lifecycles: create, start, stop, remove, configure networking, mount workspaces, and more. It runs on MacOS, Linux and Windows. Every release needs testing across both platforms, across upgrade paths between versions, and under sustained load to catch resource leaks. The team also needs daily visibility into what shipped, and a way to triage the growing issue backlog without it becoming a full-time job.

We could have written traditional test scripts and reporting tools. Instead, we built agent roles that handle these tasks autonomously, both on our laptops and in CI.

The design principle behind the Fleet is simple: every skill runs on your machine first.

When we built the `/cli-tester` skill (the Fleet's exploratory tester, more on that below), we didn't start by writing a GitHub workflow. We started by invoking it locally. We watched it build the binaries, exercise the CLI commands, find issues, and report them. We tweaked the skill until it did the right thing in our terminal. Only then did we wire it into a workflow.

This matters because the alternative is painful. If you build CI-only agents, you debug them through commit-push-wait-read-logs cycles. Every iteration takes minutes. When the skill runs locally first, the iteration takes seconds. You see the agent think. You see where it gets confused. You fix the skill file, re-invoke, and try again.

CI is just another runtime for the same skill. The `/cli-tester` that runs nightly on MacOS, Linux and Windows runners is the exact same skill we invoke from our terminals. The workflow sets up the environment, checks out the code, and calls the skill. That's it. No separate "CI version." No translation layer. One skill, two runtimes.

This is what makes the Fleet practical. You're not maintaining two systems. You're maintaining one set of skills and a set of workflows that invoke them.

## The Roster

![The Fleet: 7 Autonomous CI/CD AI Roles](/images/posts/2026-05-04-a-virtual-agent-team-at-docker/fleet-diagram.png)

The skills directory has 20 skills in total. Most are foundational knowledge (architecture, code style, Go conventions, security, testing patterns). Seven of them are the Fleet: the roles that run autonomously on CI. Each one is a [SKILL.md](https://code.claude.com/docs/en/skills) file that describes a persona, not a procedure.

**`/build-engineer`** is the foundation that other skills stand on. It references topic files for building binaries, container templates, and local installs. It knows the `Taskfile.yml`, the `docker-bake.hcl`, and the platform-specific build flags. It doesn't run on CI by itself. Other skills load it when they need to compile anything.

**`/project-manager`** is the team's memory. It deduplicates findings against existing issues and PRs before creating new ones, manages the GitHub Projects board (setting status, priority, and labels), and handles interactive triage when running locally. On CI, it switches to fully automatic mode: no questions asked, just deduplicate and create. It uses GraphQL pagination to scan the entire project board, not just the first page. Every other skill that discovers something calls the project-manager before opening an issue.

**`/product-owner`** translates commit-speak into human language. It collects merged PRs from a date range, categorizes them (New Features, Bug Fixes, Improvements, Documentation, Maintenance), and rewrites each one in plain English. "feat(cli): add TZ env passthrough" becomes "Docker Sandboxes now automatically use your local timezone." On CI, it outputs Slack Block Kit JSON. Locally, it renders a markdown table. It filters out noise from bots (Dependabot bumps, workflow-only changes) and skips posting when there's nothing meaningful to report.

**`/cli-tester`** is the exploratory tester of the Fleet, and it's the largest skill by far. Unlike traditional test scripts that assert expected output and fail on any deviation, the cli-tester investigates what it finds. When output doesn't match expectations, it asks *why* before filing a bug.

It defines 52+ test scenarios organized into 14 tiers: Core Lifecycle, Agent Smoke, Workspace, Network Policy, Sandbox Features, Blueprint, CLI UX, Environment, Code Tasks, Agent Network, Reliability, Collaboration, Error Recovery, and Human-Only (skipped in CI). It builds the binaries through the build-engineer, triages findings through the project-manager, and loads product scenarios defined by the actual Product Manager on the team. It monitors disk space during testing, posts an executive summary to Slack when it finishes, and runs nightly on CI across MacOS, Linux and Windows.

It also powers a slash command on GitHub. When someone comments `/cli-tester-review` on a pull request, CI spins up three runners (MacOS, Linux and Windows), each loading the skill to exercise the PR's changes on that platform. The agents explore the code, run the scenarios, and post their findings as comments directly on the pull request.

**`/performance-tester`** runs in two modes. Lifecycle Endurance repeatedly cycles create/stop/rm to detect reliability issues and resource leaks, producing xUnit JSON output. Code Exploration Benchmark clones a real Git repository and compares host-vs-sandbox I/O performance and Claude Code session behavior. Both modes measure disk usage over time and flag regressions. The goal is catching the slow degradation that no single test run would notice.

**`/upgrade-tester`** runs a four-phase test plan. Phase A creates pre-upgrade state (sandboxes, configurations). Phase B installs the new version. Phase C verifies everything still works after the upgrade. Phase D optionally downgrades and verifies again. It takes two version tags as input, builds the binaries for each, creates VMs, and produces an executive summary with pass/fail per phase. Upgrade regressions are the kind of bug that's invisible in a single-version test suite.

**`/software-engineer`** operates in two modes. Reactive: when someone adds the `agent-fix` label to a GitHub issue, a MacOS runner picks it up and runs a ralph-loop to work the issue, contributing a PR with minimal, focused changes. Proactive: weekly, it runs in architect mode, scanning the codebase for quality issues, producing up to five findings, triaging them through the project-manager, then spawning three MacOS runners in parallel to fix three of them. Each runner delivers a PR targeting a specific simplification or tech-debt reduction.

## Skills That Compose

Individual skills are useful. Skills that load other skills are a team.

The seven Fleet roles sit on top of thirteen foundational skills: architecture, code style, Go conventions, software design, security, testing patterns, development workflow, git worktrees, and others. The foundational skills encode project knowledge. The Fleet roles encode behavior. A Fleet role loads the foundational skills it needs, the same way a new team member reads the project's contributing guide before writing code.

The `/cli-tester` doesn't know how to build binaries. It loads the `/build-engineer` for that. It doesn't know whether the bug it found is a duplicate. It loads the `/project-manager` to check. The tester focuses on testing. The builder focuses on building. The manager focuses on triaging. Each role stays in its lane, and the composition creates something none of them could do alone.

The `/software-engineer` follows the same pattern. It loads the `/build-engineer` so it can compile the project, and it loads coding best practices and software design conventions so its output meets the team's standards. The skill doesn't try to encode everything. It delegates to the foundational skills.

The `/performance-tester` loads the `/cli-tester`, extending it with duration and metrics. Instead of duplicating the testing logic, it reuses it and adds a measurement layer on top.

This is the skills-as-roles principle in practice. When you design skills as personas with clear responsibilities (instead of step-by-step commands), they compose naturally. A tester that loads a builder and a manager is doing the same thing a human tester does: asking a colleague to compile the project and checking with the PM before filing a bug. The difference is that the "asking" happens through skill composition instead of a Slack message.

## The Ralph-Loop Is the Engine

The [Ralph Wiggum loop](https://ghuntley.com/ralph/) is a pattern popularized by Geoffrey Huntley in 2025: a Bash loop that keeps feeding an AI coding agent the same task until the work is done. At its simplest, it's `while :; do cat PROMPT.md | claude-code ; done`. Each iteration spawns a fresh agent with a clean context window. The agent reads the task, implements one piece, runs the tests, commits if they pass, and exits. The loop restarts, and the next iteration picks up where the previous one left off. Instead of hoping for first-try perfection, you design for iteration.

Our implementation of this pattern is called a Ralph-loop. The Fleet skills define *what* each agent role knows. The Ralph-loop defines *how* the iteration runs.

Our Ralph-loop is a composite GitHub Action backed by a shell script that adds a layer on top of the basic pattern: a separate worker and reviewer. It fetches the issue context, creates a working branch, and iterates: the worker implements changes and writes a summary, the reviewer evaluates the diff and decides SHIP or REVISE. If REVISE, the feedback goes back to the worker for another pass. Up to five iterations by default. If the reviewer says SHIP, the loop pushes the branch, creates a PR, and comments on the original issue.

The worker and reviewer run as separate Claude invocations with different models. The worker uses Opus for implementation. The reviewer uses Opus with 1M context to evaluate the full diff against the task requirements. Each one loads the `/software-engineer` skill (which in turn loads the build-engineer and coding best practices), so they share the same project knowledge but apply it from different perspectives.

Separating generation from evaluation is deliberate. The same agent that wrote the code shouldn't evaluate whether the code is good. It's the oldest principle in quality assurance: the person who built the thing shouldn't be the only person who tests it. The worker's job is to solve the problem. The reviewer's job is to decide whether the problem is actually solved.

The Ralph-loop works locally too. The same `ralph-loop.sh` script that CI calls can be invoked from your terminal with `--issue-number 42`. Locally, it parses CLI arguments instead of reading environment variables, and outputs plain text instead of streaming JSON. Same loop, same prompts, same iteration pattern. We debugged the worker and reviewer prompts on our laptops before they ever ran in CI.

The workflows handle scheduling and triggering: nightly cron for the testers, label events for the software-engineer, weekly cron for the architect mode. The Ralph-loop handles the iteration pattern. The skills handle the domain knowledge. Three layers, each with a clear job.

This separation is what made the Fleet possible to build in a couple of weeks. We didn't have to reinvent the automation loop for every role. The Ralph-loop already knew how to iterate. We just needed to give each role its own skill file and wire the triggers.

## What the Fleet Ships

The Fleet has been running for a couple of weeks. Here's what it delivers.

**Automated issue resolution.** A team member labels an issue with `agent-fix`. The CI grabs a MacOS runner, reads the issue, and starts working. The result is a pull request that addresses the issue. Not every PR lands without changes, but the first draft is there for review, often within the hour.

**Daily release notes.** The product-owner traverses the git log every day and posts a Slack summary for stakeholders. No one has to manually compile "what shipped this week." The stakeholders see progress in real time, at the speed the team actually moves.

**Nightly exploratory testing.** The cli-tester runs every night on MacOS and Windows. It loads the product scenarios that the Product Manager has defined, exercises the CLI, and opens issues for anything it finds. Before opening an issue, it checks for duplicates through the project-manager. When it finishes, it posts a Slack message with the results.

**Performance and upgrade testing.** The performance-tester and upgrade-tester run on CI across both platforms. Disk usage regressions, behavioral differences between sandbox and non-sandbox modes, and version compatibility issues get caught before they reach a human reporter.

**Weekly tech-debt reduction.** Every week, the software-engineer runs in architect mode. It reviews the codebase, identifies three spots where code can be simplified or legacy patterns can be cleaned up, spawns three parallel runners, and delivers three PRs. Each one is a small, focused improvement. Over time, they compound.

## What We Don't Automate

The Fleet creates pull requests. It does not merge them.

That's the trust boundary, and it's deliberate. Merge decisions stay with humans. So do architectural choices, scope decisions, and prioritization. The agents do the work. The team decides what work matters and whether the output meets the bar.

The supervision model scales the same way it works on a developer's laptop. When we run multiple agents locally in parallel worktrees, we review their output before merging. With the Fleet, the team supervises seven agent roles running on CI. The shape of the oversight is the same: review the output, approve or adjust, move on. The difference is that the agents don't need anyone's laptop to start working.

The Fleet is not replacing the team. It's extending it. Seven roles that handle repetitive, well-defined work so humans can focus on work that requires judgment, context, and taste. The Fleet has many arms, but the team still steers the ship.

## What We Learnt Building the Fleet

**Start with the foundation, not the flashiest skill.** We started with the `/cli-tester` because testing the CLI felt like the highest-value target. But it needed to build binaries, triage issues, and load product scenarios, all things that depended on other skills we hadn't written yet. We should have started with the `/build-engineer`, the skill everything else stands on. The second skill was better because of what we learned from the first. Don't design the full fleet upfront.

**Build locally first, deploy to CI second.** The commit-push-wait-read-logs cycle is where velocity goes to die. If you can't debug a skill in your terminal, it's not ready for a workflow. Some behaviors only surface on CI runners (different OS, permissions, network constraints), and those iterations cost hours of wall-clock time. Minimize what can only be tested in CI.

**Write skills as roles, not scripts.** Ask yourself: "If a new team member joined tomorrow with this exact role, what would I tell them?" What do they need to know? What tools can they use? How should they handle ambiguity? That conversation is your SKILL.md. "You are the build engineer, here's what you know" produces better judgment than "run these five steps." When something unexpected happens, a role investigates. A script stops.

**Compose skills like you compose teams.** The `/cli-tester` doesn't know how to build binaries or triage bugs. It loads the `/build-engineer` and `/project-manager` for that. Each role stays in its lane. The composition creates what none of them could do alone.

**Separate generation from evaluation.** The agent that wrote the code shouldn't be the only one that reviews it. Our Ralph-loop uses a worker and a reviewer for a reason: the oldest principle in quality assurance applies to agents too.

**Triage matters more than detection.** The `/cli-tester` initially filed issues for every unexpected output. Transient failures, timing-dependent behavior, environment quirks: everything became an issue. The signal-to-noise ratio got bad enough that the team started ignoring findings. Getting the triage right (deduplication, confirming before filing) took longer than building the tester itself.

And one more thing. All Fleet agents, even on ephemeral CI runners, run inside [Coding Agent Sandboxes](https://docs.docker.com/ai/sandboxes/). We test with what our users use.

---

_Resources:_
- _[Original post on the Docker Blog](https://www.docker.com/blog/a-virtual-agent-team-at-docker-how-the-coding-agent-sandboxes-team-uses-a-fleet-of-agents-to-ship-faster/)_
- _[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/)_
- _[Claude Code skills documentation](https://code.claude.com/docs/en/skills)_
- _[The Ralph Wiggum loop (Geoffrey Huntley)](https://ghuntley.com/ralph/)_
