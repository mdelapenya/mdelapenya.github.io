---
title: "Four Agents, Four Machines, One Developer"
date: 2026-08-28 06:11:10 +0200
description: "T3 Code is a control surface for the coding agents already installed on your machines. I put a server on four of them, kept the phone as a client, and my work cycle stopped happening in a terminal."
categories: [Technology, AI, Software Development]
tags: ["t3code", "coding-agents", "claude-code", "developer-experience", "terminal", "docker-sandboxes"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-08-28-four-agents-four-machines-one-developer/cover.png"
related:
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
  - "/posts/2026-03-13-choosing-a-terminal-for-agentic-development"
  - "/posts/2026-04-24-my-daily-workflow-with-biomelab"
  - "/posts/2026-03-21-gwaim-the-tool-that-level-5-needed"
  - "/posts/2026-03-11-coding-agents-as-exploratory-testers"
  - "/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows"
---

![Four Agents, Four Machines, One Developer](/images/posts/2026-08-28-four-agents-four-machines-one-developer/cover.png)

[T3 Code](https://github.com/pingdotgg/t3code) came through my timeline. I installed it on one machine to see what it was, and then I installed it on the rest of them.

That second part is the post. Not the tool review, the shape it pushed me into. I now run a T3 Code server on four machines and carry a client in my pocket, and two things I had written down as settled turned out not to be: which machine an agent runs on, and whether I work in a terminal.

## A Control Surface, Not Another Agent

T3 Code is a GUI for coding agents, MIT licensed, built by Theo and Julius. The important thing about it is what it refuses to be. It ships no models and no agents. From the install docs:

> T3 Code drives provider CLIs; it does not ship them.

Codex, Claude Code, Cursor, Grok Build and OpenCode. If the CLI is installed and authenticated on the machine, T3 Code can drive it, with the subscription you are already paying for. What it adds is a server on that machine and a set of clients that talk to it: an Electron desktop app, a hosted web app at `app.t3.codes`, and native iOS and Android apps.

So it sits exactly where I had a gap. I had already moved my agents [into the terminal and then into parallel](/posts/2026-03-18-the-six-levels-of-ai-assisted-development). What I did not have was a way to reach them that was not a terminal on the machine they were running on.

## Remoteness Lives in the Connection, Not the Runtime

The design decision that makes a fleet possible is stated plainly in the maintainer docs:

> T3 has one runtime boundary: a client talks to a T3 server over HTTP and WebSocket, and the server owns orchestration, providers, terminals, git, and filesystem operations. Remoteness is expressed at the connection layer, never by splitting the runtime.

That sentence is worth more than any feature list. There is no "local mode" and "remote mode" with different capabilities. There is one server, and four ways a client might reach it: the platform-managed local backend, a manually paired endpoint, a managed T3 Connect relay tunnel, and desktop-managed SSH.

My devices are meshed through **T3 Connect**, the managed relay. The reachability problem gets solved once, at the connection layer, and everything above it stays identical no matter which of my machines I am talking to.

The elegance shows in what did *not* become a concept. Tailscale is supported, and it is not a fifth kind of connection. The docs are explicit that it is an endpoint provider and a transport, paired through the ordinary bearer path. Endpoints themselves are advertised as hints rather than promises:

> Clients treat advertised endpoints as hints, not proof that a route works from the current device. The connection attempt decides.

## The Fleet

Four servers, and a client in my pocket:

- **The M4 Mac** I work on at Docker.
- **A Windows machine** and **a Linux machine**, also work machines.
- **My personal x86 Mac.**
- **My Android phone**, which runs no server at all. Phones are clients. That asymmetry is the design working as intended.

Each machine running a server is one *execution environment* in T3's vocabulary, with a stable `environmentId` the server generates on first start and persists on disk. From any client I pick the environment I want and I am there.

## Four Logins Is Not Duplication

The install docs contain a line that reads like a chore:

> Run the login command on the machine running the T3 Code server, not on the device you browse from.

Four servers means authenticating Claude Code and Codex four times. That reads like a setup tax. It is not duplication, it is the shape of the thing.

Four servers with their own authenticated CLIs are four workers. Each one has its own filesystem, its own checkouts, its own installed toolchain, its own Docker daemon, its own operating system. The alternative design, one server that everything else reaches into, would be one worker with four screens attached. That is a different product, and a worse one for what I want.

## From Worktrees to Machines

Back in March, [Level 5](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer) looked like this: four Warp panels, four git worktrees, four Claude Code sessions, one developer supervising a grid on one screen.

The count did not change. The isolation boundary moved up a layer. A worktree isolates a directory; a machine isolates an operating system, a toolchain, a Docker daemon, and a set of platform behaviours you cannot fake from somewhere else.

The worktrees did not go anywhere, though. They stopped being mine to create.

## I Do Not Work in a Terminal Anymore

The bigger change is not where the agents run. It is what I keep them in.

In March the unit of supervision was a terminal pane. One pane, one agent, one worktree, and my attention allocated by looking at a different rectangle. T3 Code's unit is a **thread**, and threads are grouped into **projects**, where a project groups the checkouts that belong together.

The worktrees became a setting. In T3's model a worktree is "an isolated workspace for a thread", and the workspace mode for new threads is configured per project: `worktree` or `local`. Projects can also flag setup scripts to run whenever a worktree gets created, which I only found while reading the docs for this post. It went straight onto the must-have list: a worktree that gets created fresh every time is only worth having if it comes up ready to work in. On top of that, each of my projects carries a system prompt spelling out the discipline: start from a fresh `main`, in a new worktree, every time.

The sentence that does the real work here is in the keybindings docs:

> Branch, worktree, and environment mode always come from your configured defaults, not from the thread you were looking at.

"Never work on `main`" used to be a rule I wrote into an agent's instructions, and the failure mode of a rule like that is an agent assuming the branch instead of checking it. Here a new thread cannot inherit a stale branch by accident, because it does not inherit one at all. It reads the default. The rule stopped being something to remember mid-task and became structural.

Which is why the pain that made me build [biomelab](/posts/2026-04-24-my-daily-workflow-with-biomelab), formerly [gwaim](/posts/2026-03-21-gwaim-the-tool-that-level-5-needed), a TUI whose entire reason for existing was that creating worktrees by hand and tracking which agent ran where hurt enough to automate, is now handled by a dropdown and a project prompt. I am thinking about retiring it.

Threads have a lifecycle I no longer manage either. They settle when they go inactive, and they settle when the pull request linked to them merges. Pinned threads sit above the active list and show up independently of their project, including across environments, so one sidebar covers all four machines.

That last detail is what retired the grid. I do not switch machines anymore. I look at a list of threads, and the machine a thread runs on is a property of it rather than a place I have to go to.

My skills came along too. The composer lists them by source, including project-level ones, so the [roles I wrote as skills](/posts/2026-03-25-skills-are-roles-not-commands) are a keystroke away in any environment.

Which leaves me in an awkward position with two of my own posts. I wrote [a whole post about choosing a terminal for agentic development](/posts/2026-03-13-choosing-a-terminal-for-agentic-development), and in [my stack post](/posts/2026-03-20-my-agentic-coding-stack) I said the terminal is the new IDE and the center of the work.

I would not call it a reversal so much as the argument finishing. That terminal post concluded that the one that wins for agentic development is the one that stays invisible, where your attention never shifts from the agent's output to the terminal's behaviour. Invisible has an endpoint, and this is what the endpoint looks like.

## Where the Work Runs Stops Being Where I Sit

The first thing that changed in practice is continuity. I start something at the desk and the thread does not live in my terminal anymore, so it does not end when I stand up. I pick it up from the phone, read what the agent has done, and steer it. In the Level 5 post I wrote that *I* was the continuity, holding context across sessions and lunch breaks. Less of that is true now.

The second is supervision without presence. Long-running agent work no longer requires me to be in front of the machine running it. That was the promise of Level 6, agents that do not need my laptop, and I had been reading it as "runs in CI". This is the other half: it still runs on my own hardware, and my presence is what got decoupled.

## The Platform Is the Point

The Windows and Linux boxes earn their place on one job in particular, and it is the reason a fleet beats a faster laptop.

They run unattended, agent-guided testing natively on each platform, and I watch it and correct it from the phone. I already wrote about turning [a coding agent into an exploratory tester](/posts/2026-03-11-coding-agents-as-exploratory-testers): a skill that exercises software and investigates what it finds, rather than a script that asserts a line and stops. That work ran across three platforms, and the missing piece was that I had to be at each machine to drive and triage it. That piece is gone.

A real Windows box testing Windows behaviour is not something you emulate your way around. Neither is Linux. What T3 Code changes is that the machine still has to exist, but I do not have to be at it.

## The Use Case I Went Looking For

I work at Docker on the [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) team, and once I understood T3's connection model I went looking for how the two fit together. Sandboxes run coding agents in isolated microVMs: the agent gets full control inside the VM, including sudo, while the VM boundary keeps it away from anything on the host that was not explicitly shared.

That is a good complement to a control surface that makes it easy to run agents with their permissions turned up.

The connecting piece already worked, and it worked because of a design decision rather than an integration. `sbx setup ssh` writes a managed SSH config, so every sandbox is reachable as an ordinary SSH host at `<name>.sbx`, and T3 Code's desktop-managed SSH launch takes it from there. No changes to T3 Code at all. The maintainer docs treat SSH as an access helper rather than an environment type, and that is precisely why something nobody planned for slotted in.

The friction is everything around that moment: knowing to run `sbx setup ssh`, knowing the username, and one genuinely sharp edge where the remote install fails silently because `node-pty` has no Linux prebuilds and a fresh sandbox ships no compiler.

So I [opened a discussion](https://github.com/pingdotgg/t3code/discussions/7841) proposing a Docker Sandbox card in the Add Environment dialog that does that machinery in one action, disclosed upfront that I am on the team that builds `sbx`, and named the awkward part myself: the `sbx` CLI is free but it is not open source. Then I built [a working prototype](https://github.com/mdelapenya/t3code/pull/1) so the conversation could happen over something real, wiring T3 Connect relay activation into sandbox registration as a non-fatal side effect, so a relay failure never takes the SSH connection down with it.

Whether it lands in T3 Code is theirs to decide. What I wanted was for people using Docker Sandboxes to have a short path from a phone to an agent running in a microVM.

## Closing

Four agents, four worktrees, one developer was a description of a desk. Four agents, four machines, one developer is not, and the difference is that the developer can leave.

---

_Resources:_
- _[T3 Code on GitHub](https://github.com/pingdotgg/t3code)_
- _[T3 Code: remote access](https://github.com/pingdotgg/t3code/blob/main/docs/user/remote-access.md)_
- _[T3 Code: remote architecture (internals)](https://github.com/pingdotgg/t3code/blob/main/docs/internals/remote.md)_
- _[T3 Code: keyboard shortcuts](https://github.com/pingdotgg/t3code/blob/main/docs/user/keybindings.md)_
- _[T3 Code: organizing threads](https://github.com/pingdotgg/t3code/blob/main/docs/user/thread-sidebar.md)_
- _[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/)_
- _[Discussion #7841: one-click Docker Sandbox environments](https://github.com/pingdotgg/t3code/discussions/7841)_
