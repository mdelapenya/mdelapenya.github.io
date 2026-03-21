---
title: "The Six Levels of AI-Assisted Development"
date: 2026-03-18 09:00:00 +0100
description: "From no AI to fully autonomous agents. A maturity model for how developers adopt AI tools, and why your stack should match your level."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "developer-experience", "ai"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-18-the-six-levels-of-ai-assisted-development/cover.png"
related:
  - "/posts/2026-03-21-gwaim-the-tool-that-level-5-needed"
  - "/posts/2026-03-20-my-agentic-coding-stack"
---

![The Six Levels of AI-Assisted Development](/images/posts/2026-03-18-the-six-levels-of-ai-assisted-development/cover.png)

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

## What Changes at Each Level

The interesting thing about this model is not the levels themselves. It's what becomes irrelevant at each transition.

At Level 2, you start caring about completion quality and less about typing speed. At Level 3, you start caring about chat context and less about keybindings. At Level 4, the IDE's AI features become redundant because the agent has the whole repo from the terminal. At Level 5, you stop writing code entirely and start supervising. At Level 6, you stop supervising in real time and start reviewing asynchronously.

Each jump makes the previous tool less central. Not useless, just less central. The IDE doesn't disappear at Level 4. It becomes a diff viewer. The terminal doesn't disappear at Level 6. It becomes the place you check logs.

## Where Are You?

Most developers I talk to are somewhere between Level 2 and Level 3. They use completions daily. Some have tried chat agents. Few have moved to terminal-based agents. Almost nobody is at Level 5 consistently.

If you're choosing tools, start by figuring out your level. A Level 3 IDE (Cursor) is excellent at Level 3 but redundant at Level 4. An agent orchestrator is essential at Level 5 but overwhelming at Level 3. Don't buy tools for the level you aspire to. Buy tools for the level you're at, and upgrade when you get there.

The next post covers [what my stack actually looks like](/posts/2026-03-20-my-agentic-coding-stack) at Level 4: why I left Cursor's chat behind, why Go fits agentic workflows, and why the terminal is the new IDE.

---

_Resources:_
- _[Claude Code](https://docs.anthropic.com/en/docs/claude-code)_
- _[Cursor](https://cursor.com/)_
- _[GitHub Copilot](https://github.com/features/copilot)_
