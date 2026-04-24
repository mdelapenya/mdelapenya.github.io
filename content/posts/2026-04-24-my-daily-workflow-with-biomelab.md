---
title: "My Daily Workflow with biomelab"
date: 2026-04-24 09:00:00 +0200
description: "How I use biomelab as my daily command center: kanban board, keyboard-driven worktrees, sandboxes, and never touching main. The workflow that makes me feel unreasonably productive."
categories: [Technology, AI, Software Development]
tags: ["biomelab", "git-worktrees", "docker-sandboxes", "coding-agents", "developer-experience"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-04-24-my-daily-workflow-with-biomelab/cover.png"
related:
  - "/posts/2026-03-21-gwaim-the-tool-that-level-5-needed"
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
  - "/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox"
  - "/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows"
---

![My Daily Workflow with biomelab](/images/posts/2026-04-24-my-daily-workflow-with-biomelab/cover.png)

I have biomelab open all day. It's the first thing I launch in the morning and the last thing I close. Every repo I work on, every worktree, every agent session, every PR: all visible in one terminal dashboard. I never touch main. I never work without a worktree. And I never start Claude without knowing exactly which branch it's on. This is what my daily workflow looks like.

## The Left Panel: All My Repos

biomelab shows all registered repositories in the left panel as a tree. Each repo can have multiple modes: host mode (regular git) or sandbox mode (one per agent, with a 🐳 icon). I navigate with `↑`/`k` and `↓`/`j`, select the repo I'm working on, and `Tab` to the right panel. That's it. No cd-ing around, no remembering which directory is which.

Adding a new repo is `a`. Adding a sandbox mode to an existing repo is `n`. Removing a mode is `x`. The config persists across sessions in `~/.config/biomelab/repos.json`, so the list is always there when I launch.

If I start biomelab inside a git repository, it auto-adds it. Most of the time I don't even use `a`. I just open biomelab from the repo I'm about to work on.

## Kanban, Always

I always use the kanban board view. `g` toggles between the card grid and the kanban board. I hit `g` once on launch and never go back.

In kanban mode, worktrees are organized into columns by state: in progress, ready for review, PR sent. Each card shows the branch name, dirty/clean status, sync status (ahead, behind, diverged), active agents, open IDEs, and PR info with CI check icons. When I look at biomelab, I see the shape of my day. Not files, not branches: cards.

Navigation follows the column layout. `←`/`h` and `→`/`l` move between columns. `↑`/`k` and `↓`/`j` move within a column. From the main card at the top, `↓` enters the first non-empty column. It feels like navigating a spreadsheet, except every cell is a task.

## Never Main

I never work on main. Not for features, not for investigations, not for triaging a repo. `c` on the main card creates a new worktree. Every task starts on its own branch, isolated from everything else.

If I just need to check something, I still create a worktree. The cost is zero (biomelab handles creation and cleanup) and the safety is absolute. No accidental commits to main. No dirty state from an investigation polluting a feature branch. One worktree, one task, always.

Because each card shows whether it's up to date with the upstream branch, I know at a glance if I need to refresh main. I press `p` to pull, and because I never touch main, I know there won't be conflicts. Ever.

This habit started with [gwaim](/posts/2026-03-21-gwaim-the-tool-that-level-5-needed), the TUI predecessor to biomelab. The [Level 5 workflow](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer) (four agents, four worktrees, one developer) is what made worktree-per-task non-negotiable. biomelab just made it frictionless.

Other worktree operations I use daily: `d` deletes a worktree (with a confirmation dialog, so no accidents). `f` fetches a PR into a new worktree, which is how I start code reviews: I type the PR number, biomelab creates the worktree, and I'm reading the code in context instead of on a web diff. `p` pulls from remote on any card. `r` forces a refresh if I want immediate status.

## Enter to Code

Hit `Enter` on a worktree card. A new terminal window opens in the worktree directory. From there I type `claude` to start the agent.

If I'm in sandbox mode, it's even better. `Enter` runs `sbx run <sandbox> --branch <branch>`, which automatically enters the worktree inside the sandbox. No manual cd, no figuring out which sandbox maps to which worktree. biomelab knows the mapping and handles it. The full [sandbox workflow](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox) is in a separate post if you want the details.

biomelab doesn't know my preferred agent yet. It opens the terminal in the right place, but I still type `claude` myself. That's a feature I want to add: a preferred agent setting in the config so that `Enter` launches it directly. For now, the extra keystroke is a minor friction I can live with.

I always open the editor for every task because I still like to do the commits myself. `e` opens the worktree in my editor (configurable via `$BIOME_EDITOR`, defaults to VS Code).

Other shortcuts: `n` on the main card creates or enrolls a sandbox for the repo. `s` starts a stopped sandbox, `Shift+S` stops a running one. Sandbox lifecycle without leaving the dashboard.

## Shift+P to Ship

When I'm done with a task, `Shift+P` submits the PR. biomelab handles the full flow: it checks for dirty state (warns if uncommitted changes exist), lets me pick a remote if there are multiple, shows a confirmation, pushes the branch, and creates the PR. If a PR already exists for the branch, it skips creation and just pushes. No duplicate PRs, no switching to the browser, no running `gh pr create` manually.

The card moves to the "PR Sent" column in the kanban. One keystroke and the work is out for review. Then I move on.

## The Cycle

The full loop: `c` (create worktree) → `Enter` (open terminal) → `claude` → work → `Shift+P` (submit PR) → move on.

I don't even wait for the PR to finish. While Claude is still working on one task, I'm already opening another worktree for the next one. Two agents running, two branches, two cards in the kanban. Sometimes three. It looks chaotic from the outside. From the inside, each card is its own world.

That chaos is intentional. Context switching between worktrees is cheap because biomelab holds the state for me. And I need the variety. Staring at one agent grinding through a single task for an hour is how you burn out. Jumping between two or three tasks, checking progress, redirecting when needed, keeps the energy up. The kanban shows me which cards are moving and which are stuck. When a review comes back, the card is still there, including icons for the CI checks, in the right column. I pick it up, address comments, push, done.

On a good morning I have three or four cards moving through the columns. Features in progress on the left, PRs waiting for review on the right. The board is the backlog, the work in progress, and the done pile, all at once.

## Why This Feels Different

The productivity isn't from speed. It's from never losing context. biomelab is always there, showing me where everything is. It's much more difficult to forget a PR waiting for review when the card is staring at you. It's much more difficult to accidentally commit to main when every task starts with `c`. The dashboard is the workflow.

---

_Resources:_
- _[biomelab](https://biomelab.dev)_
- _[biomelab on GitHub](https://github.com/mdelapenya/biomelab)_
