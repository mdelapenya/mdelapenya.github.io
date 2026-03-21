---
title: "Parallel Coding Agents with Docker Sandboxes and Git Worktrees"
date: 2026-02-25 09:00:00 +0100
description: "A practical workflow for running multiple coding agents in parallel using Docker Sandboxes and git worktrees: full autonomy for agents, full safety for your host."
categories: [Technology, AI, Software Development]
tags: ["docker", "coding-agents", "developer-experience", "claude-code", "git"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows/cover.png"
related:
  - "/posts/2026-03-21-gwaim-the-tool-that-level-5-needed"
  - "/posts/2026-03-18-the-six-levels-of-ai-assisted-development"
---

![Parallel Coding Agents with Docker Sandboxes and Git Worktrees](/images/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows/cover.png)

Coding agents are powerful. They can refactor modules, write tests, fix bugs, and scaffold entire features. But running them directly on your host means giving them access to your system: your files, your packages, your running containers. Now imagine running *multiple* agents in parallel on the same repository checkout. That's a recipe for conflicts, corrupted state, and a bad afternoon.

There's a better way. Combine [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) with [git worktrees](https://git-scm.com/docs/git-worktree) and you get full agent autonomy with full isolation, and as many parallel tasks as you want.

## The Problem

Two things go wrong when you scale up agent usage:

**1. Agents can mess with your host.** An agent running natively on your machine can install packages, modify system config, delete files, or interfere with your running containers. Even well-behaved agents occasionally do unexpected things. Giving them unrestricted access is a calculated risk that doesn't always pay off.

**2. Parallel work on a single checkout causes conflicts.** If you're working on one task and want an agent to tackle a second task simultaneously, you can't both be modifying the same working directory. Files get overwritten, branches get tangled, and `git status` becomes a horror show.

Docker Sandboxes solve the first problem. Git worktrees solve the second. Together, they make parallel agent workflows practical.

## The Workflow

Here's the step-by-step process I use when I want multiple agents working on different tasks simultaneously.

### Step 1: Create Git Worktrees

A git worktree is a separate working directory linked to the same repository. Each worktree has its own branch and its own files, but they all share the same `.git` history.

```bash
# Create a worktree for each parallel task
git worktree add .git/sandbox-worktrees/feature-auth -b feature/auth
git worktree add .git/sandbox-worktrees/fix-tests -b fix/flaky-tests
```

Now you have two independent working directories, each on its own branch. Changes in one don't affect the other. By placing them inside `.git/sandbox-worktrees/`, they live within the repository directory, so when the sandbox mounts your project, the worktrees are included.

### Step 2: Create a Docker Sandbox

Create a sandbox for your project, pointing it at the repository root. This sets up an isolated microVM with its own private Docker daemon, completely separated from your host. The sandbox is a single environment: every `docker sandbox run` lands you in the same container inside that VM, but as a separate Claude process.

```bash
docker sandbox create --name my-sandbox claude .
```

Since the worktrees live inside `.git/sandbox-worktrees/`, they're included in the mounted directory and visible from within the sandbox.

### Step 3: Run an Agent Instance per Worktree

Open a separate terminal for each task and run the sandbox:

```bash
# Terminal 1
docker sandbox run my-sandbox

# Terminal 2
docker sandbox run my-sandbox
```

The agent doesn't know about the worktrees yet. You tell it. In each terminal, start the conversation by pointing the agent to its worktree:

> "I've created a git worktree at `.git/sandbox-worktrees/feature-auth` on branch `feature/auth`. Work from that directory. Your task is to..."

The agent picks it up from there. It `cd`s into the worktree and operates on that branch independently.

### Step 4: Let the Agents Work

Inside the sandbox, the agent operates in YOLO mode by default: no permission prompts, no hand-holding. It can:

- Install packages and dependencies
- Run tests, including spinning up containers via the sandbox's private Docker daemon
- Modify files freely within the workspace
- Execute arbitrary commands

None of this touches your host. The sandbox's microVM isolation means the agent literally *cannot* access your host Docker daemon, your other containers, or files outside the workspace.

Meanwhile, file synchronization keeps the worktree on your host in sync with the sandbox. The workspace directory is mounted at the same absolute path, so file paths in error messages match between environments. Changes the agent makes appear on your host in real time.

### Step 5: Review and Merge

When an agent finishes, you review its work on the host. The synced worktree has all the changes. Most IDEs (VS Code, Cursor, IntelliJ, etc.) let you open multiple worktrees as separate folders in the same window, so you can see the changes from each agent side by side and review them independently.

I use the IDE (Cursor and VSCode) to see the changes live, but you can use the command line too:

```bash
# Check what the agent did
cd .git/sandbox-worktrees/feature-auth
git diff
git log

# If it looks good, merge it
git checkout main
git merge feature/auth
```

### Step 6: Clean Up

Remove the worktrees when you're done:

```bash
git worktree remove .git/sandbox-worktrees/feature-auth
git worktree remove .git/sandbox-worktrees/fix-tests
git worktree prune
```

Sandboxes persist until you explicitly remove them, so installed packages and configuration stay available if you need to go back. But the worktrees are cheap to create and remove as needed.

## Why This Works

**Safety.** The sandbox provides real isolation from your host, not just a promise. All agents share a single microVM with its own Docker daemon. They can't escape to your host. You can let them run autonomously without worrying about collateral damage.

**Parallelism.** The agents share the same sandbox container, but git worktrees give each one its own branch and working directory. No file conflicts, no stepping on each other's toes. You can run as many parallel tasks as your machine can handle.

**Agent autonomy.** Because the sandbox is isolated, there's no need to babysit the agent or approve every action. It can install what it needs, run what it needs, break what it needs, all inside its own contained environment. This is where agents are most productive: when they can iterate freely without waiting for human approval at every step.

**Path consistency.** The workspace syncs at the same absolute path between host and sandbox. When the agent reports an error at `/Users/you/project/src/main.go:42`, that path works on your host too. No mental translation required.

## Wrapping Up

The combination is simple but effective: git worktrees for parallel branches, a Docker Sandbox for isolated execution. You get agents that can work autonomously and in parallel, without any risk to your host. The worktrees keep their file changes separate; the sandbox keeps everything off your machine.

It's the workflow I reach for whenever I have multiple independent tasks that an agent can handle. Set up the worktrees, launch the sandboxes, and let them work. Review when they're done.

That said, what if the sandbox already knew about the worktrees? What if `docker sandbox run` could target a worktree directly, spinning up an agent that's already in the right directory on the right branch? What if creating the worktrees, launching the agents, and cleaning up afterward were a single command? The pieces are all there. It's just a matter of connecting them.

---

_Resources:_
- _[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/) - Run coding agents unsupervised but safely in isolated microVM environments_
- _[Git Worktrees documentation](https://git-scm.com/docs/git-worktree) - Manage multiple working trees attached to the same repository_
