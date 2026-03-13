---
title: "My Agentic Coding Stack: Why the IDE Matters Less Than You Think"
date: 2026-03-16 09:00:00 +0100
description: "VS Code, Cursor, Warp, Go, Claude Code. At some point the agent moved to the terminal and the IDE became a review tool. Here's what my stack looks like at Level 4."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "developer-experience", "claude-code", "go", "terminal"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-16-my-agentic-coding-stack/cover.png"
---

![My Agentic Coding Stack](/images/posts/2026-03-16-my-agentic-coding-stack/cover.png)

I moved from VS Code to Cursor for the AI chat. Then I moved the AI chat to the terminal. Now I'm not sure I need Cursor at all.

That shift wasn't random. It followed a pattern I've been thinking about: a maturity model for how developers adopt AI tools. Each level changes which tools matter in your stack, and which ones become irrelevant. Understanding where you are on the curve saves you from optimizing for the wrong things.

## The Six Levels

Here's how I think about the stages of AI-assisted development:

**Level 1: No AI.** You write everything by hand. The IDE is your primary tool: navigation, refactoring, debugging, running tests. This is where most of us were two years ago.

**Level 2: Code completions.** GitHub Copilot, Codeium, or similar. The AI suggests the next line or block. You accept or reject. The IDE matters a lot here because the completions are inline, tightly integrated with the editor. A better IDE means better completions.

**Level 3: Chat agents in the IDE.** Cursor's inline chat, Copilot Chat, or similar. You describe what you want in natural language, the agent generates code, you review and accept. The AI has more context (the open file, the project structure) and can make multi-line changes. The IDE is the AI's interface.

**Level 4: One coding agent in the terminal.** [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Codex CLI, or similar. The agent runs in a terminal session with full repo access. It reads files, writes code, runs tests, iterates. The IDE becomes a review surface: you read diffs, check the output, approve or reject. The AI's interface is the terminal, not the editor.

**Level 5: Multiple agents in parallel.** Multiple terminal sessions, each on its own [git worktree](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows), each working on a different task. The IDE has multiple windows open for reviewing each agent's work. You're supervising, not coding.

**Level 6: Agents run autonomously.** The agents don't need your laptop at all. They run in CI, in the cloud, on a schedule. You review pull requests. The IDE is a PR review tool. We're not here yet for most workflows, but the trajectory is clear.

Your stack should match the level you're at, not the level the marketing tells you to aspire to.

## Why I Left Cursor's Chat Behind

I moved to Cursor specifically for Level 3. The inline chat was genuinely useful: describe a change, see it applied in context, accept or tweak. It felt like pair programming inside the editor.

Then I started using Claude Code in the terminal. Level 4. The agent had full repo context without me having to select files or open tabs. It could read any file, run tests, check build output, and iterate on failures. The scope of what it could do in one interaction was dramatically larger than what the IDE chat could handle.

At that point, Cursor's chat became something I rarely opened. I still used Cursor as an editor, but only for the same things I'd use VS Code for: reading code, reviewing diffs, navigating the project. The AI features that justified the switch were no longer part of my workflow.

This isn't a knock on Cursor. At Level 3, it's excellent. But Level 4 makes the IDE's AI features redundant. The agent doesn't need to be embedded in the editor when it has the whole repo from the terminal.

## The Terminal Is the New IDE

At Level 4+, the terminal is where the work happens. The agent reads, writes, tests, and iterates there. What matters in a terminal for this workflow is different from what matters for traditional shell usage.

Rendering speed matters because the agent produces a lot of output. Scrollback matters because you need to review what the agent did three steps ago. Session persistence matters because agent sessions can run for an hour. I covered this in detail in my [terminal post](/posts/2026-03-13-choosing-a-terminal-for-agentic-development), where I compared Terminal.app, iTerm2, Warp, and Ghostty specifically for agentic workloads.

I landed on [Warp](https://www.warp.dev/). It handles the rendering load well, the block-based output makes it easy to review agent actions, and it's fast enough that long Claude Code sessions don't stutter. But the specific terminal matters less than the realization that the terminal *is* where you'll spend your time at Level 4.

## Why Go Fits Agentic Workflows

Go isn't the only language that works well with coding agents, but it has properties that make it particularly good:

**Fast compilation.** The agent writes code, runs `go build`, gets feedback in seconds. In languages with slow build times, the agent waits, and you wait with it. Fast feedback loops compound across dozens of iterations in a single session.

**Strong typing with clear errors.** When the agent makes a type error, the compiler tells it exactly what's wrong and where. The agent reads the error, fixes the code, recompiles. No guessing, no runtime surprises. The type system acts as guardrails for the agent.

**Built-in test tooling.** `go test` is part of the language, not a third-party framework. The agent can run tests, read failures, and fix them without needing to know your test framework, test runner, or CI configuration. It just works.

**Minimal IDE dependency.** Go doesn't need an IDE to be productive. `gofmt` handles formatting. `go vet` catches issues. The language server provides completions and navigation. All of this works equally well from the terminal or the IDE. At Level 4, where the IDE is just a reviewer, this matters.

## VS Code or Cursor? It Depends on Your Level

If you're at Level 2-3, Cursor wins. Its inline completions and chat are better integrated than VS Code's Copilot extensions. The AI features are the product, and they're polished.

If you're at Level 4+, VS Code and Cursor are interchangeable. The AI is in the terminal. Both editors handle diffs, navigation, and syntax highlighting equally well. Pick whichever your muscle memory prefers.

I'm currently between VS Code and Cursor for this reason. I switched *to* Cursor for the chat. Now that I don't use the chat, there's no strong reason to stay or to leave. They're both fine as review surfaces. The tool that matters is the one in the terminal.

## What Level 5 Looks Like

On good days, I run two or three Claude Code sessions in separate Warp tabs. Each session works on its own [git worktree](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows) so the agents don't step on each other's files. The IDE has multiple windows open, one per worktree, for reviewing each agent's changes.

The workflow looks like this: I start Agent A on a feature branch, switch to Agent B for a bug fix, check on Agent A's progress, review and merge Agent B's work, give Agent A feedback. It's [supervision, not coding](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot).

Level 5 is where the IDE's role becomes purely passive. You're not editing in it. You're not chatting in it. You're reading diffs and clicking "approve." At this level, the best IDE is the one with the best diff viewer and the fastest file switching.

## The Stack Is the Level

My stack today: VS Code or Cursor (interchangeable), Warp, Go, Claude Code. But the specific tools matter less than the level I'm operating at. At Level 4, the terminal is the center. The IDE is the periphery. The language needs to give the agent fast feedback.

If you're choosing a stack for agentic development, start by figuring out your level. Then pick tools that match it. Don't buy a Level 3 IDE for a Level 4 workflow.

---

_Related posts:_
- _[Choosing a Terminal for Agentic Development](/posts/2026-03-13-choosing-a-terminal-for-agentic-development): Terminal comparison for agentic workloads_
- _[Docker Sandboxes & Parallel Workflows](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows): Worktrees and isolation for parallel agents_
- _[Coding with AI Agents: Like Driving a Tesla on Autopilot](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot): The supervision model_

_Resources:_
- _[Claude Code](https://docs.anthropic.com/en/docs/claude-code)_
- _[Warp terminal](https://www.warp.dev/)_
- _[Cursor](https://cursor.com/)_
