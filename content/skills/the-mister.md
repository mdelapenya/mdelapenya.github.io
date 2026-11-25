---
title: "the-mister"
description: "Plans a multi-step change as a graph of tasks, hands each one to a cheaper subagent, and accepts the result only on evidence."
skill: the-mister
category: orchestration
version: "2.7.2"
weight: 1
evidence:
  plugin: "1.2.3"
  date: 2026-11-16
  scenarios:
    - { id: 8, name: "Write an approved plan", name_es: "Escribir un plan aprobado", without: 37, with: 99, cost_without: "$2.25", cost_with: "$2.26" }
    - { id: 9, name: "Write work orders", name_es: "Escribir órdenes de trabajo", without: 62, with: 98, cost_without: "$0.93", cost_with: "$2.32" }
    - { id: 12, name: "Accept and recover nodes", name_es: "Aceptar y recuperar nodos", without: 53, with: 73, cost_without: "$1.35", cost_with: "$3.01" }
    - { id: 13, name: "Commit gate", name_es: "Puerta del commit", without: 58, with: 100, cost_without: "$1.75", cost_with: "$4.17" }
related:
  - "/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it"
  - "/posts/2026-10-25-the-mister-file-by-file"
  - "/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument"
  - "/posts/2026-10-12-i-was-the-message-bus"
---

## What it does

the-mister is a manager for a multi-step implementation. It plans the work as a graph of nodes, writes a work order for each one, and dispatches it to a subagent picked by difficulty: the most capable model for hard nodes, mid-range for medium, the cheapest for easy or mechanical ones. It does not edit code or run commands itself. It accepts each result only on evidence against explicit acceptance criteria.

## When to reach for it

Use it for a change big enough to split: "orchestrate this", "plan and delegate", "build a DAG for this feature", "use the squad", "ask the mister" or "delegate to cheaper models". While a plan is active, follow-ups such as "now add" or "next step" continue it.

It does not apply to single-file fixes or to tasks that fit in one subagent call. If the whole task fits one node, it says so.

## How it works

1. It plans the graph, shows it in plan mode, and on approval writes `plan.md` and prints the slug. "Plan only" stops there.
2. It writes one order per ready node, with the outcome, the invariants, the files the node owns and the checks to run.
3. It dispatches independent nodes in parallel, only when their files do not overlap.
4. It accepts a node only on evidence in its report. A failed node is retried by cause, with a budget of three dispatches.
5. A reviewer who did not plan the work reviews the whole change before anything is committed.
6. Three git steps follow: a read-only preflight, staging, and the commit.
7. It prints a final report with the slug, commits, evidence, review, recoveries and open items.

Every `git`, `gh` and `glab` command runs on the cheapest tier. State lives in `<git-dir>/the-mister/<slug>/`, so you can resume with `--slug`.

Installing it with `npx skills` or Tessl does not install its six Claude Code agents. Without them, workers fall back to general-purpose subagents and the role fences become instructions only, unless you link the agents as described in Option 3 of the coding-skills README.

## It's working if

- You see the graph, with tiers and dependencies, before any work starts, and a slug is printed after approval.
- Each node report comes with evidence against its acceptance criteria.
- Nothing is staged or committed until the independent review and the preflight pass.
- The final report names the slug, branch, commits and outcome, with sections for evidence, review, recoveries and open items.

## Evidence

The four scenarios test writing an approved plan, writing work orders, accepting and recovering nodes, and the commit gate. With the plugin the agent scored 99, 98 and 100 on the plan, orders and commit gate, against 37, 62 and 58 without, at a higher cost, except for the plan, where cost is about the same. Scenario 12 (acceptance and recovery) is the weakest at 73 with the plugin. Scenario 13 exposed a gap in the skill, which version 2.7.2 addresses. Each arm is one run, and repeated runs moved scores by up to about 10 points. The eval agent was `claude` with `deepseek-v4.1-flash`, not the model the skills are tuned for.

## Read more

- [The Mister, File by File](/posts/2026-10-25-the-mister-file-by-file/)
- [A Cheaper Model Can Be a Better Instrument](/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument/)
- [I Was the Message Bus](/posts/2026-10-12-i-was-the-message-bus/)
- [A Skill Has to Beat the Agent Without It](/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/)
- [the-mister SKILL.md on GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/the-mister/SKILL.md)
- Found a problem, or have a scenario the skill should handle? [Open an issue](https://github.com/mdelapenya/coding-skills/issues). Eval scenarios live in `evals/` of that repo.
