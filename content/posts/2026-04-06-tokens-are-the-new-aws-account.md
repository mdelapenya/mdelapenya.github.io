---
title: "Tokens Are the New AWS Account"
date: 2026-04-06 09:00:00 +0100
description: "Ten years ago, companies that didn't give you an AWS account were outdated. Today, it's AI tokens. A thank-you to Docker for getting this right, and a warning about measuring productivity by consumption."
categories: [Technology, AI, Software Development]
tags: ["ai", "tokens", "developer-experience", "docker", "productivity"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-04-06-tokens-are-the-new-aws-account/cover.png"
related:
  - "/posts/2026-02-24-coding-with-agents-like-tesla-autopilot"
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
  - "/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day"
  - "/posts/2026-03-18-the-six-levels-of-ai-assisted-development"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

![Tokens Are the New AWS Account](/images/posts/2026-04-06-tokens-are-the-new-aws-account/cover.png)

Ten years ago, if your company didn't give you an AWS account, you were stuck spinning up servers under your desk. The companies that got it understood that giving engineers cloud access wasn't a cost. It was a multiplier. The rest fell behind.

Today the same thing is happening with AI tokens. And most companies haven't noticed yet.

## The AWS Account Test

Around 2014, cloud access became a litmus test for engineering culture. If your company made you file a three-week ticket to spin up a VM, you knew where things were headed. If provisioning a test environment required approval from two managers and a budget review, you were not working at a company that trusted its engineers.

The good companies gave you an AWS account on day one. Not because cloud compute was cheap, but because the alternative was worse: engineers blocked, experiments never run, prototypes that never left someone's laptop. Yes, forgotten EC2 instances have a well-earned reputation for silently draining budgets (the memes write themselves). But the cost of an engineer blocked for a week because they couldn't spin up a test environment was worse, and harder to spot on a dashboard.

It wasn't about reckless spending. It was about removing the barrier between "I have an idea" and "let me test it." The companies that removed that barrier shipped faster, learned faster, and attracted better engineers. The ones that didn't found themselves explaining to candidates why they still needed to SSH into a shared staging server.

## Enter the Token Economy

AI tokens are that same litmus test, updated for 2026.

An engineer with access to an LLM can prototype an API client in minutes instead of hours. Not because the LLM writes perfect code, but because it compresses the iteration cycle. You describe what you want, get a first draft, refine it, and learn along the way. The feedback loop that used to take a morning now takes fifteen minutes.

This isn't about replacing thinking with tokens. It's about amplifying it. When I explore a new project, I don't read the full documentation front to back anymore. I ask the model to explain the core concepts, try a few examples, and dive deeper only where I need to. Then I write two-three [skills representing the different developer roles](/posts/2026-03-25-skills-are-roles-not-commands) for the project (like a backend Go engineer, a NextJS frontend engineer). The tokens don't do the learning for me. They accelerate it.

The companies that give their engineers token budgets today are making the same bet the AWS-account companies made a decade ago: that an unblocked engineer is worth more than the cost of the resources they consume. And just like cloud access, token access is becoming table stakes. If your company doesn't provide it, your engineers are either paying out of pocket or not using AI at all. Neither is a good look.

## How I Use My Tokens

Let me make this concrete with my daily workflow.

**Learning.** When I need to understand a new API, a library, or a design pattern, I start a conversation with the model. Not to get the answer, but to accelerate the process of finding it. I still read the source code. I still run the tests. But the model helps me build a mental map faster, so I know where to look.

**Prototyping.** I use [Claude Code as my primary coding agent](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot). When I want to try a new approach, I describe it, get a draft, and iterate. Most prototypes don't survive. That's the point. Tokens let me fail faster and cheaper.

**Agentic workflows.** I run [four agents in parallel on separate git worktrees](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer), each handling a self-contained task. Each agent consumes tokens. Each one saves me hours. The token cost per worktree is a fraction of the engineering time it replaces.

**Content pipeline.** I [removed all friction from my blog pipeline](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day) by building dedicated skills for planning, writing, editing, and promoting posts. Each skill uses tokens. The result: I went from publishing once a month to every other day.

None of this is about generating output. It's about accelerating feedback. The tokens are fuel for the learning loop, not a substitute for it.

## Thank You, Docker

I want to take a moment to publicly thank my employer, [Docker](https://www.docker.com/), for getting this right.

Docker provides token budgets to its engineers. Not as an experiment. Not as a pilot program for a select few. As a standard part of how we work. The message is clear: we trust you to use these tools, and we're investing in your ability to learn and ship.

This matters more than most perks. Every prototype I build, like the [git worktree manager (gwaim)](/posts/2026-03-21-gwaim-the-tool-that-level-5-needed), every library I explore, every workflow I optimize with AI tokens makes me more effective at my actual job.

That's what "investing in your engineers" looks like in 2026. Not ping-pong tables. Not beer fridges. Compute.

Docker understood this early. And I'm grateful.

## But Don't Measure the Receipt

Here's where the story gets a cautionary note.

Jensen Huang recently said he would be ["deeply alarmed"](https://www.businessinsider.com/jensen-huang-500k-engineers-250k-ai-tokens-nvidia-compute-2026-3) if a 500,000-dollar engineer didn't consume at least 250,000 dollars in tokens per year. NVIDIA is reportedly [trying to spend 2 billion dollars annually](https://www.cnbc.com/2026/03/20/nvidia-ai-agents-tokens-human-workers-engineer-jobs-unemployment-jensen-huang.html) on tokens for its engineering team.

The vision is compelling. The metric is dangerous.

The moment you measure an engineer's productivity by how many tokens they consume, you've reinvented the lines-of-code fallacy. We spent decades learning that more lines of code doesn't mean more value. An engineer who deletes 500 lines and replaces them with 50 could have done more than one who adds 1,000. The same applies to tokens.

An engineer who uses 10,000 tokens to deeply understand a problem and writes a clean, minimal solution could be more productive than one who burns through 500,000 tokens generating boilerplate they barely review. Token consumption measures activity, not impact.

I've written about the [six levels of AI-assisted development](/posts/2026-03-18-the-six-levels-of-ai-assisted-development). At every level, the value comes from the engineer's judgment: knowing what to ask, what to keep, what to throw away. Tokens amplify judgment. They don't replace it. And you can't measure judgment by counting tokens.

Give your engineers tokens. Trust them to use them well. But please, don't turn the receipt into a KPI.

---

*[Jensen Huang on tokens as a perk (CNBC)](https://www.cnbc.com/2026/03/20/nvidia-ai-agents-tokens-human-workers-engineer-jobs-unemployment-jensen-huang.html)*
*[The full story on Huang's 250K token target (Business Insider)](https://www.businessinsider.com/jensen-huang-500k-engineers-250k-ai-tokens-nvidia-compute-2026-3)*
