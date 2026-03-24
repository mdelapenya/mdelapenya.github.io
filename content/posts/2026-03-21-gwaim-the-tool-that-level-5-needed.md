---
title: "gwaim: The Tool That Level 5 Needed"
date: 2026-03-21 09:00:00 +0100
description: "I described Level 5 as four agents, four worktrees, one developer. Then I built the tool to manage it: a TUI dashboard for git worktrees and the coding agents running inside them."
categories: [Technology, Software Development]
tags: ["coding-agents", "go", "git-worktrees", "developer-experience", "terminal"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-21-gwaim-the-tool-that-level-5-needed/cover.png"
related:
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
  - "/posts/2026-03-18-the-six-levels-of-ai-assisted-development"
  - "/posts/2026-03-13-choosing-a-terminal-for-agentic-development"
---

![gwaim: The Tool That Level 5 Needed](/images/posts/2026-03-21-gwaim-the-tool-that-level-5-needed/cover.png)

## The Manual Pain

The [Level 5 workflow](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer) was a workflow that worked. Four git worktrees, four Warp panels, four Claude Code sessions. Each one on its own branch, its own task, its own `/loop`. The throughput was real. Three merged PRs by lunch instead of one.

But the setup was all manual. `git worktree add ../sandbox-fix-auth fix/auth-bypass`. Repeat four times. Open four terminals. Navigate to each directory. Start Claude Code in each one. Check which branches are ahead or behind. Switch between panels to see which agent finished. Open a browser to check PR status. Run `gh pr view` in each worktree to see CI results.

When you have four worktrees, this is manageable. Annoying, but manageable. When you go to six or eight, the overhead eats the productivity gains. You spend more time managing the worktrees than supervising the agents inside them. The bottleneck at [Level 5](/posts/2026-03-18-the-six-levels-of-ai-assisted-development) isn't the agents. It's managing them.

I kept running into the same friction every morning. Create worktrees. Check sync status. Open terminals. Figure out which agents are running where. Close stale worktrees. The workflow from the blog post was solid, but the tooling around it was bash commands and manual memory. That needed to change.

## One Keypress Operations

gwaim is a terminal dashboard for git worktrees. Everything that used to be a multi-step git command is now a single keypress.

`c` creates a worktree. It prompts for a branch name, creates the worktree, and adds it to the dashboard. No more typing `git worktree add` with the right path and branch name. `Enter` opens a terminal tab in that worktree's directory, ready for an agent. `e` opens the IDE pointed at the worktree. `d` deletes a worktree with confirmation (and prunes stale references automatically). `p` pulls the latest changes from the remote for the selected worktree's branch.

The dashboard shows all worktrees in a responsive grid. The main worktree sits at the top with a double border, visually distinct from the linked worktrees below it. Each card shows the branch name, the sync status (ahead, behind, diverged, or up to date), and which coding agents are active in that directory. The grid auto-refreshes every three seconds.

That refresh matters. You glance at the dashboard and you know the state of everything. Which worktrees have agents running. Which branches need a push. Which PRs are passing CI. No switching between panels, no running status commands, no keeping a mental model of eight branches in your head.

## Agent Detection

gwaim scans running processes to detect which coding agents are active in each worktree. It uses gopsutil to read the process list and matches against known agents: Claude Code, Kiro, Copilot, Codex, OpenCode, Gemini. If an agent process has a working directory inside a worktree, gwaim shows it on that worktree's card.

No configuration needed. You don't tell gwaim which agents you use or where they run. It discovers them by scanning system processes. If you start a Claude Code session in a worktree, gwaim picks it up on the next refresh. If the session ends, it disappears. The detection is process-based, not config-based, so it works with any agent that runs as a process in a terminal.

This is the supervisory view the Level 5 workflow was missing. In the four-panel setup, I knew which agents were running because I could see the terminals. With eight or ten worktrees, you can't keep all the panels visible. gwaim gives you the overview without needing to see every terminal.

## PR Integration

Each worktree card shows its pull request status. gwaim uses the GitHub CLI to fetch PR information: the PR number, title, state, and CI check results. Green checks, red failures, pending runs. All visible on the card without opening a browser or running `gh pr view`.

This closes the last gap in the supervisory loop. You see the worktree, the branch sync status, the active agent, and the PR state. All in one place. When a card shows a green check and no active agent, that PR is ready for review. When a card shows a red failure and an active agent, the agent is probably iterating on the fix. When a card shows a red failure and no agent, something needs your attention.

The dashboard tells you where to look. That's the job of a supervisory tool. Not to do the work, but to make the state visible so you can decide what needs you and what doesn't.

## The Technical Choices

**Go.** Fast compilation, single binary, no runtime dependencies. Consistent with the rest of my agentic stack. When I need a tool, I reach for Go. The binary compiles in seconds and runs anywhere without installing a language runtime.

**Bubbletea.** The Charmbracelet TUI framework for Go. It follows the Elm architecture: a model, an update function, and a view function. The model holds the state (worktrees, agents, PR status), the update function handles keypresses and timer ticks, the view function renders the grid. It's the standard choice for Go TUIs and it handles terminal resizing, mouse events, and async messages cleanly.

**go-git v6.** Worktree operations without shelling out to git. List worktrees, create them, remove them, check sync status. All through a Go API. Worth noting: v6 is not yet released. gwaim is running on pre-release code. That was a conscious choice. The v5 worktree support was limited, and v6 has the APIs I needed. The tradeoff is that the dependency might have breaking changes before it stabilizes. I accepted that bet because the alternative was shelling out to `git` and parsing text output, which is fragile in a different way.

**gopsutil.** Cross-platform process scanning. It reads the process list on macOS and Linux without platform-specific code. gwaim uses it to find agent processes and match them to worktree directories. One library, both platforms.

**Multi-terminal support.** gwaim opens new tabs, not new windows. On macOS it supports Warp, iTerm, and Terminal.app. On Linux it supports gnome-terminal, konsole, and xfce4-terminal. The [terminal comparison post](/posts/2026-03-13-choosing-a-terminal-for-agentic-development) covered why Warp is my default, but gwaim doesn't force a choice. It detects your terminal and opens tabs accordingly.

**Mouse support off by default.** TUI frameworks capture mouse events, which breaks text selection in the terminal. gwaim keeps mouse support off so you can select and copy text normally. Press `m` to toggle it on if you want click-to-select on worktree cards.

## From Blog Post to Tool

The Level 5 post described the workflow. Then I lived with the workflow for two weeks. The friction accumulated. Every morning, the same manual setup. Every session, the same status checks. Every time I wanted to know which agents were running, the same panel-switching dance.

So I built the tool the post was missing.

This isn't the first time the pattern has played out. I needed to test Resend email delivery in a Go project. No testcontainers module existed. I built testcontainers-go-resend. I described a manual worktree workflow in a blog post. No management tool existed. I built gwaim. The pattern is the same: write about the pain, feel the friction, build the solution.

gwaim exists because the Level 5 post demanded it. The post made the workflow concrete enough to see what was missing. And what was missing was a single screen that answers three questions at a glance: what worktrees exist, what's running in them, and what's the state of their PRs. That's gwaim. Nothing more, nothing less.

One direction I'm exploring: an MCP server that exposes gwaim's data to coding agents directly. Right now, agents running in a worktree have no visibility into the other worktrees. They don't know which branches exist, which agents are active elsewhere, or whether a related PR is passing CI. An MCP server could let agents query the dashboard instead of shelling out to `git`, `gh`, and `ps` separately. Fewer tool calls, better context, and the same supervisory data that gwaim shows me becomes available to the agents themselves.

---

_Resources:_
- _[gwaim on GitHub](https://github.com/mdelapenya/gwaim)_
- _[Bubbletea](https://github.com/charmbracelet/bubbletea)_
- _[go-git](https://github.com/go-git/go-git)_
