---
title: "A Cheaper Model Can Be a Better Instrument"
date: 2026-10-09 09:00:00 +0200
description: "I wanted to stop sending simple tasks to my most expensive model and to run more of them in parallel. The cheaper models hold up, on one condition: the order has to leave nothing to guess. The question that decides which model gets a task turns out to be the question that fixes the order."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "codex", "skills", "orchestration", "subagents", "prompting"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument/cover.png"
related:
  - "/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner"
  - "/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

![A Cheaper Model Can Be a Better Instrument](/images/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument/cover.png)

You have a forest to clear. What do you reach for, an axe or a knife? The axe, obviously: felling a tree with a knife is not a job, it is a punishment. So you take the axe, and then you keep it in your hand for everything else the day brings: trimming branches, cutting rope, marking trunks, sharpening the stake you need to pitch the tent. The axe does all of that too, badly or not, and it is already in your hand.

Maslow put it as a warning: if the only tool you have is a hammer, everything looks like a nail. Kaplan called it the law of the instrument. My case was the version neither of them bothered to write down, because it sounds too silly: I had the whole toolbox, and I still reached for the hammer every time, because the hammer was the one tool that never failed me.

That was my coding agents. The most capable model got the task that designed the API, and it also got the task that renamed a function and the one that ran `git status`. It did all of them well, which is the problem: a tool that handles the wrong job without complaint never tells you it was the wrong tool. You see it in two places only. The bill, where every stroke costs the same whether it fells a tree or sharpens a stake. And the queue, because one axe swings at one tree at a time.

So I wanted two things. Stop handing knife work to the axe. And have more than one blade moving at once, instead of watching one agent work through a list.

Both wants have the same shape: one agent that reads the whole forest and never swings, and a squad of cheaper ones that do the cutting. For the last couple of weeks that is how I have worked, and the cheaper models hold up. On one condition: the order has to be precise enough that there is nothing left to guess. Writing orders like that turned out to be the part of the workflow I kept.

## Why the Hammer Never Complains

The obvious fix is to send the knife work to a knife. The obvious way to do it is to take the prompt that worked on the capable model and send it, unchanged, to a cheaper one. That is where the cheaper model fails, on tasks you would have sworn were simple, and the conclusion writes itself: the cheap model is not good enough. Back to the axe.

The conclusion is wrong, and the reason is in the first half of the experiment, not the second. A capable model is very good at papering over a bad prompt. It infers what you probably meant, picks a sensible default where you left a hole, and hands you something that works. You never learn that your instruction had a hole in it, because the output looks like the output of a good instruction. Every prompt I had been writing for months was a prompt with holes in it that a very capable model had been quietly filling.

A less capable model is a much better instrument. It fails where your order was ambiguous instead of guessing, and it fails there every time, so the failure points at the sentence that is missing. The cheap model was not telling me it could not do the job. It was telling me where my instruction stopped.

It is the same instinct I was chasing in the [choosing the smallest LLM series](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner), one level up. There the question was how small a model can serve a request, and the answer was a property of the request. Here the question is how small a model can execute an instruction, and the answer is a property of the instruction, which means you get to change it by writing a better one.

## The Downgrade Question

So the question to ask before handing a job to a cheaper model is not *can it do this*. It is *what would it need to do this*. That reframing is the whole workflow; everything below is the routine that makes me ask it every time instead of when I remember.

A task comes in and gets split into pieces that can run on their own: the nodes. Before any node goes out, I decide how capable a model it needs. Four questions, in a fixed order; the first yes decides:

1. Does it run `git`, `gh`, or `glab`? → **Git**
2. Can every command and edit be written out verbatim? → **Easy**
3. Is the target fully specified: files, functions, signatures, behaviour? → **Medium**
4. Otherwise → **Hard**

That alone does not save much: my instincts put most nodes in Hard or Medium. The saving comes from a second pass over every one of those nodes, with the question from above made concrete: *what would this order need for the next cheaper tier to succeed?*

That question has exactly three answers, and all three are useful.

**It needs context.** The cheaper model would get it right if it knew the handler shape lives at `internal/api/gadget_handler.go:40-88`, or that the struct has to be declared in this exact form. Fine: paste it in and downgrade the node. The order got better and the node got cheaper, in that order.

**It needs a decision.** The cheaper model can't do it because the order contains a fork: two reasonable designs and no instruction about which. That fork was mine to resolve and I had left it lying in the order. Make the call, write it down, downgrade the node.

**It genuinely needs judgment.** Concurrency, a migration, an auth boundary, the shape of a public API; places where a wrong choice is silent and expensive. Leave it Hard. These exist, and the bill says they are not rare: the Hard tier is still the largest line in it.

The first two cases are the ones that matter, because they share a diagnosis: *if I can't downgrade this node, my order was vague.* Tier is not a measure of the task. It is a measure of how much of the task I left unspecified.

The check I run before anything goes out, and now well outside this workflow too: *re-read the order as the model that will receive it, and every place you had to infer something is a sentence to add.*

## Reading the Failure

A cheap model's failure is only a measurement if you can tell what kind of failure it was. That needs two things written before dispatch: what the node has to produce, and how I will check it. Not "the widget model is implemented correctly" but "`widget.go` defines `type Widget struct` with these fields, and `go test ./internal/widget/...` exits 0". Without that, I cannot separate "it did not do what I asked" from "I did not ask for what I wanted", and the whole instrument reads zero.

With it, a failure has exactly three causes, and each one tells me something different. An **order gap**: the worker could not have known. The order was vague, the model found the gap, rewrite the order and retry at the same tier. That is the downgrade question coming back with its answer. An **implementation defect with a sound order**: the model knew and still got it wrong. That is the tier being wrong, not the order; retry with the defect named, or move the node up. An **environment failure**: auth, offline, a protected branch. No signal about the order or the model; stop and ask me.

Three dispatches per node, then it stops. And the levers are always the order, the tier, and me. Never the code: the orchestrator cannot reach it, which is the next section.

## Who Does What

The skill that runs all this is [The Mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister), the sixth one in [mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills). In April I wrote about [the lawyer, the nurse, the detective and the scribe](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe), four roles that each do a job on a pull request. This one doesn't do a job. It assigns them. The skill itself was built by two agents, one in Claude Code and one in Codex, reviewing each other's work with me holding the approvals; that is a story for another post.

A football coach sees all twenty-two players at once: the shape, the gap opening up on the left wing, the striker who stopped pressing ten minutes ago. Step onto the pitch and you see what everyone else on it sees, the three metres in front of you. In Spain the manager is *el míster*, and the name is the whole design: it picks the eleven and reads the match from outside it.

In practice, a task of mine now runs on four models, and the most expensive seat never types:

| Tier | Who | What it does |
|---|---|---|
| Orchestrator | Fable 5 / Astra | Decomposes, writes orders, judges evidence. No shell. |
| Hard | Opus 5 / Sol | The nodes that genuinely need judgment |
| Medium | Sonnet 5 / Terra | Fully specified targets: these files, these signatures |
| Easy / Git | Haiku 4.5 / Luna | Anything written out verbatim, and every `git` command |

Two rules make the table work.

**The orchestrator has no `Bash`.** Not as an instruction it could rationalise away on the fourth retry of a stubborn node; its tool list simply doesn't include a shell, and its `Write` and `Edit` are scoped to the directory where the plan and the orders live. If it could reach the code, that is exactly when it would fix the node by hand and leave the vague order uncorrected. Because it can't, the only lever it has is the order, which is the lever I want it pulling.

**Every `git`, `gh` and `glab` command runs on the cheapest tier.** Including `git status`. A node that needs git and also needs to write code is two nodes. A git command that has been written down (`git add internal/widget/widget.go`, `git commit -F .git/the-mister/widgets/orders/N07-commit.msg`) has no judgment left in it, so the smallest model runs it exactly as well as the largest: it is the downgrade question with the answer already known. The operator runs the listed commands verbatim, pastes every byte of output, and stops dead on the first error.

The side effect is that every mutation of my repository is now a node with a written order and a pasted transcript. When I review what happened, I am not reading a model's summary of what it did to my repo. I am reading the commands and their output.

The tiers are named after difficulty, not after models, and the models live in a per-runtime reference file. On Claude Code a tier is a model; on Codex it is a model plus a `reasoning_effort`. The questions that assign the tier don't move, and when a new model lands the change is one row.

## What It Cost

Six months of bills across both runtimes, read through current list prices. I am not going to share the amounts, so everything below is relative to July and August, the last stretch before any of this started. Four regimes:

| Period | How I worked | Tokens per day, vs summer | Cost per token, vs summer | Who typed (share of tokens) |
|---|---|---|---|---|
| April to June | Opus for everything | 14% fewer | 26% more | Opus 87%, Sonnet 9%, Haiku 3% |
| July to August | Opus and Sonnet, by hand | baseline | baseline | Opus 49%, Sonnet 43%, Haiku 4% |
| September 1 to 20 | The pattern, by hand | 52% more | 17% more | Opus 30%, Fable 19%, Sonnet 17%, Haiku 32% |
| September 21 to October 9 | The pattern, as a skill | 18% more | 12% more | Opus 42%, Fable 12%, Sonnet 11%, Haiku 31% |

Spring was the axe for everything. Opus wrote 87% of the tokens, and it was the most expensive period per token of the four.

Summer was the first correction, and it needed no skill: I moved close to half the work to Sonnet by hand, and the cost per token fell by a fifth. No orchestrator, no tiers, no orders. That is the baseline everything else has to beat.

September is when the pattern in this post started, before the skill existed. I ran it by copy-pasting orders between sessions, with Fable, which had just landed, as the model that planned. Three things show up in the bill at once. Haiku jumps from 4% of the tokens to 32%, so the Easy tier was real before the skill was. Fable types 19% of the tokens, because a model that plans by copy-paste also ends up fixing things. And the volume goes up by half, the highest of the six months.

The skill is the same pattern, codified. Against doing it by hand, it wins on every line: 4% cheaper per token, 22% fewer tokens per day, a quarter less spend per day. Fable drops from 19% of the tokens to 12%, none of it code. Haiku holds at 31%. That quarter is the one number in six months of bills that traces to something I built rather than to a model I switched.

Against summer, the pattern costs 12% more per token, and all of that premium is one seat: Fable in the orchestrator's chair, at twice the price of Opus. Repriced at Opus rates, the same tokens would come in 4% below summer. Whether an Opus orchestrator would write orders as good as Fable's is the question the bill cannot answer, and it is the seat where a worse order costs the most, because every node below inherits it.

Two things the bill does not know. Whether the 18% extra volume over summer is parallel work or retries. And whether the orders are better now than in September; that would show up in reverts and re-dispatches, not here.

## What I'd Try First

You don't need the skill to get the main benefit. Take the next task you would hand to your most capable model and ask the downgrade question about it: what would this instruction need for a cheaper model to get it right? Then write that version and send it to the cheaper model.

Either it works, and you have found out your prompt was carrying less information than you thought and your model was covering for you. Or it fails, and it fails precisely at the spot where your instruction was ambiguous, which is the spot you wanted to find anyway.

I started this to spend less and to run more work at once. The second happened; the first only against doing the same thing by hand, and the bill is honest about why. The third thing it buys is the one I did not plan for. Writing for the cheap model leaves you with orders anyone can read and check. With the expensive one, you would never have had to write them.

---

_Resources:_
- _[the-mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister): the skill_
- _[mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills): the rest of the squad_
- _[Law of the instrument](https://en.wikipedia.org/wiki/Law_of_the_instrument): Kaplan (1964) and Maslow (1966), the hammer and the nail_
