---
title: "coordinating-agents"
description: "Lets two or more coding agents on one machine work on a task through a shared folder, so you stop copying messages between their windows."
skill: coordinating-agents
category: orchestration
version: "1.0.2"
weight: 2
evidence:
  plugin: "1.2.3"
  date: 2026-11-16
  scenarios:
    - { id: 6, name: "Set up a channel with another agent", name_es: "Montar un canal con otro agente", without: 25, with: 100, cost_without: "$1.23", cost_with: "$0.81" }
related:
  - "/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it"
  - "/posts/2026-10-12-i-was-the-message-bus"
---

## What it does

coordinating-agents replaces you as the go-between when two or more coding agents (for example Claude Code and Codex) work on the same task on the same machine. The agents exchange numbered message files in a channel folder under the repository's git directory. Each one writes only its own files, watches for new ones, and hands the turn over, while you decide things instead of relaying them.

## When to reach for it

Use it when you would otherwise paste one agent's answer into another's window: "coordinate the task with" another agent, "talk to the other agent", "hand this off to Codex", "work this out with" a named agent, "join the channel", or when you paste a channel path from another agent.

It does not give either agent new authority, and it does not apply to subagents that a session starts itself: use the runtime's own dispatch for those.

## How it works

1. The initiator creates the channel at `<git-common-dir>/coordination/<topic>/` and writes its `README.md`: the task, the members, the authority, and the limits (by default 6 messages per member, a 30 second poll and a 30 minute idle limit).
2. It prints one paragraph for you to paste into the other agent's session. That paste is the only relay you do.
3. Each member runs a watcher script in the background that wakes it when another member writes.
4. It reads the new messages, does the work its authority allows, posts a reply and marks what it has read.
5. When several members edit one file, each takes a lock first and edits only its own sections.
6. A member accepts a specific version of an artifact, by name. Silence is not acceptance.
7. The loop stops when every member is done, when one is blocked on you, when the round cap is reached, or when the channel has been idle too long.

The helper scripts run in a small `busybox:1.37-uclibc` Docker container on every host, so Docker is required: without it, the agent reports a blocker and does not fall back to the host shell unless you say so. The channel is scratch space and is never committed.

## It's working if

- You get one paragraph to paste into the other agent, and after that only one-line updates about what arrived and what was answered.
- The initiator does not say the other agent has joined until that agent's first message file exists.
- A channel folder appears with a `README.md`, and message files named per sender and number.
- At the end you get a report, once every member has a done marker.

## Evidence

The scenario asks the agent to set up a channel for a peer code review, and scores the Docker command shape and the message format. Without the plugin the score was 25; with it, 100, and the solve cost less (<span>$0.81</span> instead of <span>$1.23</span>). It is one scenario with one run per arm, and repeated runs moved scores by up to about 10 points. It tests the setup of a channel, not a long session between two live agents. The eval agent was `claude` with `deepseek-v4.1-flash`, not the model the skills are tuned for.

## Read more

- [I Was the Message Bus](/posts/2026-10-12-i-was-the-message-bus/)
- [A Skill Has to Beat the Agent Without It](/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/)
- [coordinating-agents SKILL.md on GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/coordinating-agents/SKILL.md)
- Found a problem, or have a scenario the skill should handle? [Open an issue](https://github.com/mdelapenya/coding-skills/issues). Eval scenarios live in `evals/` of that repo.
