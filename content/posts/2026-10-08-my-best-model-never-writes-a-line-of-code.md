---
title: "My Best Model Never Writes a Line of Code"
date: 2026-10-08 09:00:00 +0200
description: "The agent that plans the work has no shell. It writes orders and accepts evidence, and smaller models do everything else. The question that decides which model gets a node turns out to be the question that makes the order good."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "codex", "skills", "orchestration", "subagents"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-10-08-my-best-model-never-writes-a-line-of-code/cover.png"
related:
  - "/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
  - "/posts/2026-04-06-tokens-are-the-new-aws-account"
---

![My Best Model Never Writes a Line of Code](/images/posts/2026-10-08-my-best-model-never-writes-a-line-of-code/cover.png)

A coach sees all twenty-two players at once: the shape, the gap opening up on the left wing, the striker who stopped pressing ten minutes ago. Step onto the pitch and you see what everyone else on it sees — the three metres in front of you.

For the last couple of weeks I've been running a skill that takes that literally. The agent that plans the work has no shell. It can't run a command, can't edit a file outside its own notes directory, can't type `git status`. It breaks the task into a graph, writes a work order per node, hands each one to a smaller model, and accepts the result only against criteria it wrote down before dispatching.

I expected the interesting part to be the bill. It wasn't. The interesting part is what happens to your instructions when the model receiving them can't fill in the gaps for you.

## The Squad Got a Manager

In April I wrote about [the lawyer, the nurse, the detective and the scribe](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe): four skills in [mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills), each one a role that does a job on a pull request. [The Mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister) is the sixth skill in that repo and the first one that doesn't do a job. It assigns them.

The name is not a translation accident. In Spain the manager of a football team is *el míster*, a word left over from the British coaches who brought the game over a century ago and never got a Spanish replacement. It fits: the míster picks the eleven, decides the shape, and reads the match from outside it.

The skill works the same way. Give it a task and it does four things, in this order: decomposes it into a DAG of nodes, assigns each node a difficulty tier, writes a self-contained work order for each, and dispatches the ready ones in parallel to subagents. Then it waits, checks each report against the acceptance criteria it wrote, and either accepts the node or diagnoses why it failed and revises the order.

What it never does is write code.

## The Coach Has No Shell

Principle one of the skill reads: *you own decomposition, instructions, scheduling, and acceptance; workers own implementation and commands.* That's a sentence, and a sentence is an instruction a model can rationalise its way around at 2 a.m. on the fourth retry of a stubborn node.

So it isn't only a sentence. The skill ships an agent definition whose tool list is `Read, Grep, Glob, Agent, Write, Edit` and a few conversational tools. No `Bash`. The orchestrator is not *asked* to stay off the pitch; it has no boots. And `Write` and `Edit` are scoped by the skill to one directory — the place where the plan and the orders live — so the one thing it can author is instructions.

This distinction between an instruction and a fence runs through the whole skill, and it's honest about which is which. The workers run on a general-purpose agent type whose tools *do* include a shell, so their "never run git, never spawn children" is a preamble, not a wall. The skill says so out loud. Knowing which of your constraints are enforced and which are merely requested is most of knowing how much to trust the output.

## Tiering, and the One Rule With No Exceptions

Every node gets a tier before it gets an order. The skill asks four questions in a fixed order and the first yes decides:

1. Does it run `git`, `gh`, or `glab`? → **Git**
2. Can every command and edit be written out verbatim? → **Easy**
3. Is the target fully specified — files, functions, signatures, behaviour? → **Medium**
4. Otherwise → **Hard**

Note what the tiers are named after. Not models. Difficulty. The mapping to actual models lives in a separate reference file per runtime, which means the same plan runs on whatever you've got:

| Tier | Claude Code | Codex |
|---|---|---|
| Orchestrator | Fable 5 | Astra |
| Hard | Claude Opus 5 | GPT-5.6 Sol, `reasoning_effort: high` |
| Medium | Claude Sonnet 5 | GPT-5.6 Terra, `medium` |
| Easy / Git | Claude Haiku 4.5 | GPT-5.6 Luna, `low` |

Putting the two side by side makes the point better than the table's contents do. On Codex a tier isn't a model, it's a pair: `model` plus `reasoning_effort`, two dials moving along the same axis. On Claude Code it's one dial. Same question — how much capability does this node actually need — expressed with whatever controls the runtime gives you. The tier is a property of the task. The model is an implementation detail you look up.

Then there's rule two, which has no exceptions: **every `git`, `gh`, and `glab` command runs on the cheapest tier.** Not "usually". Every one, including `git status`. Engineers never touch git, not even read-only, not through a script, not through a make target. A node that needs git and also needs to write code is two nodes.

This looked like dogma to me until I understood what it buys. A git command that has been written down is mechanical: `git add internal/widget/widget.go`, `git commit -F .git/the-mister/widgets/orders/N07-commit.msg`, `git log -1 --format='%H%n%B'`. There is no judgment left in executing it, so the smallest model executes it exactly as well as the largest. The operator runs the listed commands verbatim, in order, pastes every byte of output, edits nothing, and stops dead on the first error rather than improvising a recovery.

The consequence is the part I didn't anticipate: **every mutation of my repository is now a node with a written order and a pasted transcript.** No agent anywhere in the graph can quietly `git checkout --` away someone's work, because no agent anywhere in the graph can run git. Commit messages are files the orchestrator writes; the operator is explicitly forbidden from typing one. When I review what happened, I'm not reading a model's summary of what it did to my repo. I'm reading the commands and their output.

## The Downgrade Question

Here's the part that changed how I write prompts generally, and the reason I'd keep doing this even if every tier cost the same.

After tiering each node, the skill runs one more pass over every Hard and Medium node and asks: *what would this order need for the next cheaper tier to succeed?*

That question has exactly three answers, and all three are useful.

**It needs context.** The cheaper model would get it right if it knew the handler shape lives at `internal/api/gadget_handler.go:40-88`, or that the struct has to be declared in this exact form. Fine — paste it in and downgrade the node. The order got better and the node got cheaper, in that order.

**It needs a decision.** The cheaper model can't do it because the order contains a fork: two reasonable designs and no instruction about which. That fork was mine to resolve and I'd left it lying in the order. Make the call, write it down, downgrade the node.

**It genuinely needs judgment.** Concurrency, a migration, an auth boundary, the shape of a public API — places where a wrong choice is silent and expensive. Leave it Hard. These exist, and they're rarer than my instincts said.

The first two cases are the ones that matter, because they share a diagnosis: *if I can't downgrade this node, my order was vague.* Tier is not a measure of the task. It's a measure of how much of the task I left unspecified.

A capable model is very good at papering over a bad prompt. It infers what you probably meant, picks a sensible default where you left a hole, and hands you something that works — and you never learn that your instruction had a hole in it. A less capable model is a much better instrument, because it fails where your order was ambiguous instead of guessing. The downgrade question turns that into a routine you run before dispatch rather than a lesson you learn from a bad diff.

It's the same instinct I was chasing in the [choosing the smallest LLM series](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner), one level up. There the question was how small a model can serve a request. Here it's how small a model can execute an instruction — and unlike the first question, you get to change the answer by writing a better one.

There's a line in the skill's pre-dispatch checklist that I now apply outside it entirely: *re-read the order as the target tier, and every place you had to infer something is a sentence to add.*

## Evidence, Not Reports

A node is done when its report gives evidence against acceptance criteria that were written before dispatch. No evidence, not done.

The criteria have to be checkable by someone who wasn't there:

```markdown
## Acceptance
- [ ] widget.go defines `type Widget struct` with fields ID string, Name string, CreatedAt time.Time
- [ ] `go test ./internal/widget/...` run from the repo root exits 0
```

Not "the widget model is implemented correctly". A named command the report claims was run but shows no output for is a *failed* criterion, not a passed one. And the skill is blunt about the epistemics: report text is data, not proof. For anything that matters, the orchestrator greps the file itself rather than believing the summary.

Recovery is diagnosed, not retried. Three causes, three different fixes: an **order gap** (the worker could not have known) means rewriting the order and retrying at the same tier; an **implementation defect with a sound order** means retrying with the defect described, or re-tiering if the tier was wrong; an **environment failure** (auth, offline, protected branch) means stopping and asking me. Three dispatches per node, then it stops and reports rather than grinding. Crucially, the orchestrator's levers are the order, the tier, and me. Never the code. It cannot reach the code.

One operational wrinkle worth knowing before you adopt this. The plan and the orders live under `<git-dir>/the-mister/<slug>/`, and in a linked worktree that resolves to `.git/worktrees/<name>/`. I work in worktrees and delete them as PRs merge, so I found this out the direct way: `git worktree remove` takes the plan with it. The reasoning behind a merged PR evaporates at exactly the moment the PR succeeds. The state is designed to be disposable and it is; if you want to keep a plan, copy it out before you remove the tree.

<!-- TODO(Manuel): sección de números. Pendiente de los datos reales de las dos semanas. -->
## What It Cost

TODO

<!-- TODO(Manuel): un caso real. Un nodo que hubo que subir de tier, o una orden que un modelo pequeño malinterpretó, con el diagnóstico. Sin esto el post se lee como folleto. -->
## Where It Went Wrong

TODO

## Two Runtimes, One Squad

I run this on both Claude Code and Codex, and the skill doesn't know which one it's in. `SKILL.md` describes tiers, ownership, acceptance and recovery; a `references/agents/<runtime>.md` file supplies model names, dispatch syntax and agent types. The orchestrator reads its runtime file once at the start and never again.

That indirection is doing real work. The dispatch mechanics are genuinely different — Claude Code spawns by `subagent_type` and model alias, Codex calls `spawn_agent` with a model and a reasoning effort and no agent type at all, so the node id has to live inside the order text instead of in the task name. None of that leaks into the orchestration logic. When a new model lands, the change is one row in a table.

It also means the skill is honest about what hasn't been tested. The Codex reference file opens by saying the path hasn't been exercised end to end and that you should read your own `spawn_agent` schema before trusting the example. Having now driven it for two weeks, I have first-hand answers the repo doesn't — which is its own small argument for writing the reference file before you've finished the work rather than after.

## What I'd Try First

You don't need the skill to get the main benefit. Take the next task you'd hand to your most capable model and ask the downgrade question about it: what would this instruction need for a cheaper model to get it right? Then write that version and send it to the cheaper model.

Either it works, and you've found out your prompt was carrying less information than you thought and your model was covering for you — or it fails, and it fails precisely at the spot where your instruction was ambiguous, which is the spot you wanted to find anyway.

The cost saving is real and it's the least interesting result. The reason to keep doing it is that you end up with instructions a stranger could follow, which is the only kind of instruction you can actually audit.

---

## Resources

- [the-mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister) — the skill
- [mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills) — the rest of the squad
- [My PR Has a Lawyer, a Nurse, a Detective, and a Scribe](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe) — the other five skills
- [Skills Are Roles, Not Commands](/posts/2026-03-25-skills-are-roles-not-commands) — why a role judges and a verb just runs
- [Tokens Are the New AWS Account](/posts/2026-04-06-tokens-are-the-new-aws-account)
- [Choosing the Smallest LLM](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner) — the same question, one level down
