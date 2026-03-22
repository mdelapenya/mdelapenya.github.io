---
title: "Level 5 in Practice: Four Agents, Four Worktrees, One Developer"
date: 2026-03-23 09:00:00 +0100
description: "Four Claude Code instances, four git worktrees, one /loop command per agent. Here's what Level 5 actually looks like, from the manual workflow to the gwaim dashboard that replaced it."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "developer-experience", "claude-code", "terminal", "git-worktrees"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer/cover.png"
related:
  - "/posts/2026-03-21-gwaim-the-tool-that-level-5-needed"
  - "/posts/2026-03-18-the-six-levels-of-ai-assisted-development"
  - "/posts/2026-03-20-my-agentic-coding-stack"
  - "/posts/2026-03-13-choosing-a-terminal-for-agentic-development"
  - "/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows"
  - "/posts/2026-02-24-coding-with-agents-like-tesla-autopilot"
---

![Level 5 in Practice: Four Agents, Four Worktrees, One Developer](/images/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer/cover.png)

I described [Level 5](/posts/2026-03-18-the-six-levels-of-ai-assisted-development) in the six levels post: multiple agents in parallel, each on its own worktree, the IDE for reviews only. That was the theory. Here's what a Wednesday morning actually looks like.

Four Warp panels. Four git worktrees. Four Claude Code sessions. Each one working on a different task. And each one running its own `/loop` command, autonomously monitoring CI, merging from main, fixing failures, and pushing. Four agents, four feedback loops, one developer supervising.

## The Setup

**Update:** Since writing this post, I built [gwaim](/posts/2026-03-21-gwaim-the-tool-that-level-5-needed), a TUI dashboard that replaces the manual workflow below. One keypress to create a worktree, one glance to see which agents are running. The pain described here is what led to the tool. I'm keeping the original setup description because it explains *why* gwaim exists.

The physical layout is a Warp window with four panels in a grid. Each panel is a Claude Code session pointed at its own git worktree. Before gwaim, I created the worktrees manually:

```bash
git worktree add ../sandbox-fix-auth fix/auth-bypass
git worktree add ../sandbox-feat-templates feat/template-registry
git worktree add ../sandbox-refactor-daemon refactor/daemon-startup
git worktree add ../sandbox-test-windows test/windows-e2e
```

Each worktree gets its own branch. Then I open a Claude Code session in each one. Four terminals, four independent repos, four agents that can't step on each other's files.

Claude Code also has a built-in `-w` flag that creates worktrees for you (`claude -w feature-auth`), and [gwaim](/posts/2026-03-21-gwaim-the-tool-that-level-5-needed) handles all of this with a single `c` keypress. But understanding the manual workflow matters because it shows what you're actually automating.

## One Task Per Agent

The key constraint: each agent gets a **self-contained task**. A task that doesn't depend on what any other agent is doing. If two tasks touch the same files, they can't run in parallel. If task B needs task A's output, task B waits.

Good parallel tasks:
- A bug fix on an isolated subsystem
- A new feature in a new package
- A refactor of a single module
- Platform-specific test fixes

Bad parallel tasks:
- Two features that modify the same config file
- A refactor and a feature that both touch the same API layer
- Anything where "merge main" might create conflicts with another agent's in-flight work

I spend about five minutes at the start of a session deciding which tasks can run in parallel. That upfront planning saves hours of merge conflict resolution later.

## The /loop That Changed Everything

Each agent gets a task and a `/loop`. The `/loop` is a [bundled skill](https://code.claude.com/docs/en/scheduled-tasks) in Claude Code that runs a prompt on a recurring interval. Mine looks like this:

```
/loop 5m read the CI builds for this PR, and determine why they fail.
If you think the fix is in main, cd to the main repo, run git pull,
come back to your worktree, and run git merge main --commit, resolving
conflicts if needed. And push the changes. If not, try to resolve the
CI errors here, committing when resolved, and pushing to the branch.
```

Every five minutes, the agent checks CI. If builds fail, it diagnoses the cause. If the fix is a merge from main (someone else landed a change that fixes the dependency), it merges and pushes. If the fix is in its own code, it fixes, commits, and pushes. Then it waits for the next cycle.

This is the multiplier. Without `/loop`, I'd be the one checking CI for each of four branches, diagnosing failures, deciding whether to merge or fix, and pushing. With `/loop`, each agent handles its own CI feedback loop. I only get involved when an agent is stuck on something it can't resolve.

That inline prompt eventually evolved into a proper [Claude Code skill](https://github.com/mdelapenya/coding-skills/blob/main/skills/babysit-pr/SKILL.md): `babysit-pr`. The skill adds what the raw prompt lacks: it checks mergeable status via `gh pr view`, has conflict resolution guidelines (preserve intent, ask when ambiguous), enforces a "never force push" safety rule, and provides a summary after each cycle. If skills are roles, not commands, `babysit-pr` is the formalized role for the job the inline prompt was doing ad hoc. I'm building a collection of these practical skills at [coding-skills](https://github.com/mdelapenya/coding-skills), similar to how the [blog skills](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day) handle the content pipeline. More on those in a future post.

The `/loop` is session-scoped: it dies when you exit Claude Code. Tasks auto-expire after three days. The default interval is 10 minutes if you don't specify one. For CI iteration, 5 minutes feels right. Fast enough to catch failures quickly, slow enough to not burn tokens checking builds that haven't started yet.

## What Supervision Looks Like at Scale

With four agents running, my job changes completely. I'm not writing code. I'm:

**Reviewing PRs.** When an agent pushes a passing build, I review the diff in VS Code. This is where the IDE earns its place: reading diffs, checking test coverage, verifying the approach. I approve or request changes. The agent sees the review comments and iterates.

**Answering agent questions.** Sometimes an agent hits an ambiguity: "Should I use the existing auth middleware or create a new one?" I answer in the terminal, it continues. These interruptions are brief.

**Unblocking stuck agents.** An agent that's been looping on the same CI failure for three cycles needs help. Maybe the test is flaky and needs a retry annotation. Maybe the agent misidentified the root cause. I diagnose, give it a nudge, and move on.

**Deciding merge order.** When multiple agents have passing PRs, I decide which merges first. Order matters because merging one PR might create conflicts in another agent's branch. I merge the smallest, most isolated PR first, then tell the other agents to merge main. With [gwaim](/posts/2026-03-21-gwaim-the-tool-that-level-5-needed), the PR status and CI results are visible on each worktree card, so this decision takes seconds instead of a round of `gh pr view` commands.

This is [supervision, not coding](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot). The same Level 3-to-4 shift from the [stack post](/posts/2026-03-20-my-agentic-coding-stack), but multiplied.

## When It Breaks Down

This workflow isn't magic. It breaks in predictable ways:

**Merge conflicts between worktrees.** Agent A merges to main. Agent B tries to merge main and hits conflicts. If the conflicts are in the same files Agent B is working on, the agent usually resolves them. If the conflicts are in files Agent B hasn't touched, it sometimes makes bad choices. I watch for this and intervene early.

**Agents that go in circles.** An agent that fixes a CI failure, pushes, and then introduces a new failure that it fixes by reverting the original change. Three cycles of this and you've burned tokens for nothing. When I see an agent push more than twice without CI going green, I stop the `/loop`, read the history, and give it explicit direction.

**Tasks that are too interdependent.** If Agent A's feature needs Agent B's refactored API, running them in parallel was a mistake. I should have sequenced them. The cost of discovering this mid-session is significant: you've burned tokens and time on parallel work that now needs to be serialized.

## The Math

I don't claim a 4x speedup. The overhead is real: planning which tasks parallelize, supervising four streams, resolving merge conflicts, deciding merge order, and the token cost of four agents running `/loop` every five minutes. But the throughput increase is substantial.

A typical solo morning: I pick one task, work on it, iterate on CI, get it merged. Maybe start a second task.

A typical Level 5 morning: four tasks in flight, two or three merged by lunch, the fourth needing one more CI cycle. The wall-clock time for each task is about the same (the agent still needs to write code, run tests, iterate on failures). But the tasks overlap instead of sequencing.

The real gain isn't speed per task. It's **throughput per morning**. Three merged PRs instead of one. That compounds across a week.

## Where This Is Heading

Claude Code already has features that automate parts of this workflow. The [`/batch` skill](https://code.claude.com/docs/en/skills#bundled-skills) decomposes a large change into 5-30 independent units, spawns one agent per unit (each in its own worktree), and opens a PR per unit. [Agent teams](https://code.claude.com/docs/en/agent-teams) (experimental) let multiple Claude Code instances coordinate with a shared task list and inter-agent messaging.

My manual four-panel workflow is a bridge. It works today, with stable features, no experimental flags. Agent teams and `/batch` are where the automation goes next. When agent teams stabilize, the "four Warp panels" setup becomes "one command that spawns a coordinated team." That's Level 6: agents that don't need my laptop at all.

But today, four panels and four `/loop` commands get the job done. And the manual overhead of managing those panels is now handled by [gwaim](/posts/2026-03-21-gwaim-the-tool-that-level-5-needed), a TUI dashboard I built specifically because this workflow demanded it. One keypress to create a worktree, one glance to see which agents are running and which PRs are passing. The manual pain from this post is what led to the tool.

## The Part Nobody Talks About

[Julien Barbier put it well](https://x.com/jbarbier/status/2030453407300116725): "Using Claude Code has a weird side effect: You don't just get more productive, you actually want to work more. There's something addictive about watching a product being born in real time in front of your eyes. 'One last feature' after 'one last feature' and it's already past 3am."

That's the dangerous part.

Four agents in parallel means four streams of dopamine. Features landing, tests going green, PRs merging. The feedback loop is intoxicating. You feel like you're accomplishing a week's work in a morning. So you keep going. One more task. One more agent. One more `/loop`. It's 11pm and you've been supervising since 8am.

The productivity tools don't have an off switch. You have to be that switch. The same discipline that makes Level 5 work (planning tasks upfront, deciding merge order, knowing when an agent is stuck) also means knowing when *you're* stuck in a loop. Three merged PRs by lunch is a great morning. Six merged PRs by midnight is a burnout trajectory.

I'm still figuring out the boundaries. But I know the pattern: the days when I feel most productive are often the days when I should have stopped two hours earlier.

---

_Resources:_
- _[Claude Code /loop and scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks)_
- _[Claude Code agent teams](https://code.claude.com/docs/en/agent-teams)_
- _[Git worktrees documentation](https://git-scm.com/docs/git-worktree)_
- _[Warp terminal](https://www.warp.dev/)_
