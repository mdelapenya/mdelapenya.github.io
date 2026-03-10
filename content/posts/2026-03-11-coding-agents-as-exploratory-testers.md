---
title: "Coding Agents as Exploratory Testers"
date: 2026-03-11 09:00:00 +0100
description: "How three composing Claude Code skills turn a coding agent into a reusable exploratory tester that builds, tests, triages, and runs across platforms."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "testing", "exploratory-testing", "claude-code", "developer-experience"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-11-coding-agents-as-exploratory-testers/cover.png"
---

![Coding Agents as Exploratory Testers](/images/posts/2026-03-11-coding-agents-as-exploratory-testers/cover.png)

I needed to test a CLI tool across three platforms. I've been down this road before. I've used [Aruba](https://github.com/cucumber/aruba) in Ruby to wrap CLI interactions in Cucumber scenarios, [termtest](https://github.com/ActiveState/termtest) in Go to drive pseudo-terminals programmatically, and [Tcl/Expect](https://core.tcl-lang.org/expect/index) to automate interactive prompts. Each one works, but they all share the same limitation: they're scripts. They check that `command X` produces `output Y`. When the output changes, even slightly (a new field in the JSON, a reworded error message, a different exit code on a different OS), the script fails and stops. You get a failing line number, not a diagnosis.

So I tried something different. I wrote a [Claude Code skill](https://docs.anthropic.com/en/docs/claude-code/skills) that turns the agent into an exploratory tester. Not a test runner that verifies expected behavior, but a tester that exercises the software and investigates what it finds. The difference matters more than it sounds.

## Test Scripts Are Brittle, Testers Aren't

The tools I mentioned (Aruba, termtest, Expect) are good at what they do. But they're all built on the same model: define expected behavior upfront, assert against it, fail if it doesn't match. That model breaks down when the software under test behaves differently across platforms, or when the interesting bugs are the ones nobody thought to assert against.

An exploratory tester works differently. When output doesn't match expectations, a tester asks *why*. Is this a bug? A platform difference? A change in behavior since the last release? The tester adjusts, tries a different approach, and keeps going.

Coding agents have that same adaptability. When a command fails, the agent reads the error message, checks documentation, tries a workaround, and forms an opinion about whether the failure is a real bug or an environmental quirk. That's not something you can script.

Here's a concrete example. The [Docker Sandbox CLI](https://docs.docker.com/ai/sandboxes/) creates lightweight microVMs for running coding agents in isolation. On macOS, deep temporary directory paths (like those from `mktemp -d` under `/var/folders/...`) exceed the Unix socket path length limit of 104 bytes. A bash script testing `docker sandbox create --name test-sbox claude $(mktemp -d)` would just fail with a cryptic `krun_start_enter failed: -1` error and halt.

The agent? It hit the same error, read the troubleshooting section of its skill, understood the root cause (socket path too long), retried with a shorter path, and flagged it as a known platform-specific behavior. Then it moved on to the next test. That's the difference between a script that stops and a tester that [adapts](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot).

## A Skill Is a Test Plan With Judgment

A Claude Code skill is a markdown file that lives in your repository. It gives the agent context and instructions for a specific task. For exploratory testing, that skill becomes the test plan, but a test plan the agent *interprets* rather than executes literally.

The tester skill has four sections:

**Documentation sources.** Pointers to the CLI's reference docs, public documentation, and README files. The agent reads these first to understand what the software is supposed to do. This is the equivalent of a tester reading the product spec before starting a session.

**Environment setup.** The skill doesn't contain build instructions itself. It references a separate `build-engineer` skill that knows how to compile binaries, set up PATH, handle authentication bypasses, and cross-build for different platforms. The agent reads that skill first, builds what it needs, then comes back to the test plan. Skills compose: the tester delegates the build knowledge to a specialist.

**Test plan.** A numbered list of scenarios to exercise: version check, help output, daemon health, create/list/exec/stop/remove lifecycle, detached mode, error handling. But the agent doesn't treat these as rigid assertions. If sandbox creation takes longer than expected, it waits. If `exec` behaves differently than documented, it notes the discrepancy and continues.

**Troubleshooting guide.** Known issues with root causes and solutions. This is institutional knowledge baked into the skill. When the agent hits a known problem (authentication errors, missing runtime binaries, socket path limits), it can resolve it without human intervention and without filing a duplicate bug.

The key insight: this isn't a script the agent runs line by line. It's context the agent uses to make decisions. The test plan says "create a sandbox with the `claude` agent and a temporary workspace." The agent decides *how* to do that, handles failures, and exercises edge cases it discovers along the way. Sometimes it tries invalid agent names or runs commands against a stopped sandbox just to see what happens. That's exploratory testing.

## The Agent Doesn't Just Find Bugs, It Triages Them

The most valuable part isn't the test plan. It's what happens after.

When the exploratory tester finishes, it hands off its findings to a separate `project-manager` skill that handles triage. The project manager compiles a summary table of everything found: unexpected behaviors, error messages that could be clearer, missing validations, platform-specific quirks. For each issue, it assigns a severity (critical, high, medium, low) and a root cause when it can identify one.

Then it presents each issue to you, one at a time, and asks: do you want to create a GitHub issue or skip it? Before creating anything, it deduplicates: it searches open issues and PRs for matches, reuses existing issues when possible, and only creates new ones for genuinely new findings. In CI, it skips the interactive step and processes everything automatically.

Another example of skills composing: the tester discovers, the project manager triages.

That workflow turns a testing session into a structured conversation about quality. You're not reading through a log file trying to figure out which failures matter. The project manager has already sorted them by severity, checked for duplicates, and given you enough context to make a decision. You just pick what to do.

## What a Triage Session Looks Like

In practice, a single test run might surface something like this:

| Issue | Severity | Root cause |
|---|---|---|
| `exec` fails silently when sandbox is in "created" state | high | CLI doesn't validate sandbox state before exec |
| `rm` succeeds on already-removed sandbox without warning | low | Idempotent delete, arguably correct behavior |
| Error message for invalid agent name doesn't list valid options | medium | CLI validation only says "invalid", doesn't offer help |
| `ls --json` output inconsistent between platforms | medium | Needs investigation |

From there, you decide what's worth a GitHub issue, what's worth a fix, and what's just noise. The agent does the legwork. You make the calls.

## Three Skills, Three Platforms, Growing Knowledge

The same set of skills (build-engineer, exploratory tester, project manager) runs on Linux (amd64), macOS (arm64), and Windows (amd64) in CI. No platform-specific test scripts, no conditional logic. The agent reads the skills, adapts to whatever platform it's running on, and exercises the CLI accordingly.

But here's where it gets interesting. The tester skill references platform-specific **topic files**: `topics/linux-amd64.md`, `topics/darwin-arm64.md`, `topics/windows-amd64.md`. These files accumulate test knowledge from previous runs. When the agent discovers that a particular behavior only happens on macOS, or that Windows requires a different binary extension, that knowledge gets recorded in the topic file. The next CI run on that platform starts with all the context from previous runs.

This is knowledge that bash scripts can't accumulate. A script is static. It does the same thing every time. The skill's topic files are a growing knowledge base, updated by the agent itself, that makes each subsequent test run smarter than the last.

Over time, the topic files capture things like:
- Platform-specific default behaviors
- Known flaky scenarios and their workarounds
- Differences in error messages across operating systems
- Timing characteristics (how long operations take on each platform)

The core tester skill stays the same. The platform knowledge grows organically.

## What This Isn't

This approach is explicitly not about generating unit tests or integration tests. That's a different use case where the agent [writes test code](/posts/2026-02-26-spec-driven-development-bdd-agents) that becomes part of your codebase and runs in your CI pipeline.

Here, the agent *is* the tester. There are no test artifacts to maintain, no assertion libraries, no test frameworks. The value is in the exploration process itself: the agent exercises the software, finds problems, and helps you decide what to do about them. When the session is over, you have GitHub issues, fixes, or informed decisions to skip. Not test files.

The distinction matters because it changes what you optimize for. With generated tests, you optimize for coverage and determinism. With exploratory testing, you optimize for discovery and adaptability. Both are valuable. They serve different purposes.

## What's Next

The pattern generalizes beyond CLI tools. Any software with a command-line interface, an API, or even a UI (through browser automation) can be explored this way. The ingredients are the same: a build skill for setup, a tester skill for exploration, a project manager for triage, and topic files for growing platform knowledge.

The best testers I've worked with don't follow scripts. They learn the system, exercise it creatively, and bring you problems sorted by how much they matter. Now that behavior fits in a few markdown files that compose.

---

_Related:_
- _[I Removed the Friction. Now I Write Every Other Day.](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day): The composable skill pipeline that this testing skill is part of_
- _[Spec-Driven Development: Is This the New BDD?](/posts/2026-02-26-spec-driven-development-bdd-agents): The context layer for agents, from specs to skills_
- _[Coding with AI Agents: Like Driving a Tesla on Autopilot](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot): The supervision model, when to watch and when to delegate_
- _[Parallel Coding Agents with Docker Sandboxes](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows): The isolation piece, running agents safely and in parallel_

_Resources:_
- _[Claude Code Skills documentation](https://docs.anthropic.com/en/docs/claude-code/skills): How to create reusable skills for Claude Code_
