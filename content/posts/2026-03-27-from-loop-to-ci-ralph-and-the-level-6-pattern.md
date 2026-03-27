---
title: "From /loop to CI: Ralph and the Level 6 Pattern"
date: 2026-03-27 09:00:00 +0100
description: "The /loop command ran on my laptop. Ralph runs the same work/review/iterate cycle in CI, on any issue, without my terminal open. That's Level 6."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "github-actions", "claude-code", "ci-cd", "developer-experience"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-27-from-loop-to-ci-ralph-and-the-level-6-pattern/cover.png"
related:
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
  - "/posts/2026-03-20-my-agentic-coding-stack"
  - "/posts/2026-02-24-coding-with-agents-like-tesla-autopilot"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
  - "/posts/2026-03-11-coding-agents-as-exploratory-testers"
---

![From /loop to CI: Ralph and the Level 6 Pattern](/images/posts/2026-03-27-from-loop-to-ci-ralph-and-the-level-6-pattern/cover.png)

The [Level 5 post](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer) ended with a promise: "Agent teams and `/batch` are where the automation goes next. When agent teams stabilize, the 'four Warp panels' setup becomes 'one command that spawns a coordinated team.' That's Level 6: agents that don't need my laptop at all."

Ralph is my answer to that. Not an agent team (those are still experimental). Not a cloud platform. A GitHub Action that runs the same loop I was running in my terminal -- work, review, iterate -- but triggered by a label on an issue instead of a `/loop` command in Warp.

## The Pattern Was Already There

Go back to the `/loop` from the Level 5 post:

```
/loop 5m read the CI builds for this PR, and determine why they fail.
If you think the fix is in main, cd to the main repo, run git pull,
come back to your worktree, and run git merge main --commit, resolving
conflicts if needed. And push the changes.
```

That's a cycle. Check state, diagnose, act, push, wait, repeat. The agent keeps going until the problem is solved or I stop it.

Ralph follows the same cycle. Read the issue. Write code. Review the code. If it's not ready, revise. If it's ready, ship. The verbs change but the structure doesn't: read state, act, evaluate, iterate or terminate.

The only difference is who starts the loop and where it runs. With `/loop`, I type a command in Warp and the agent runs on my laptop. With Ralph, I add a label to a GitHub issue and the agent runs in CI. Same pattern. Different runtime.

That's the thing about the [maturity model](/posts/2026-03-20-my-agentic-coding-stack). Each level isn't a different kind of work. It's the same work running in a less coupled environment. Level 4 decoupled the agent from the IDE. Level 5 decoupled the agent from a single task. Level 6 decouples the agent from your machine entirely.

## What Ralph Actually Does

The flow is simple enough to describe without code.

You have a GitHub issue. It describes a task: a bug to fix, a feature to add, a refactor to perform. You add the `ralph` label. That's the trigger.

A GitHub Action starts. It creates a branch from main, checks out the code, and runs a **worker agent**. The worker reads the issue body, understands the task, and writes code. It commits and pushes. Then a **reviewer agent** takes over. The reviewer reads the diff, evaluates the work against the issue requirements, and makes a call: SHIP or REVISE.

If SHIP, Ralph opens a pull request. If REVISE, the reviewer writes feedback, and the worker gets another pass. The loop continues until the reviewer says SHIP or the iteration count hits the maximum.

The worker and reviewer are separate Claude CLI invocations. That's a deliberate design choice. The same agent that wrote the code shouldn't evaluate whether the code is good. Separating generation from evaluation is the oldest trick in quality assurance: the person who built the thing shouldn't be the only person who tests it. The [skills post](/posts/2026-03-25-skills-are-roles-not-commands) made the case that skills are roles, not commands. Ralph's worker and reviewer are exactly that: two roles with different responsibilities, different context, and different judgment criteria. The worker's job is to solve the problem. The reviewer's job is to decide whether the problem is actually solved.

State passes between iterations through a `.ralph/` directory: `task.md`, `work-summary.txt`, `review-result.txt`, `review-feedback.txt`. Each file is a handoff artifact. The worker writes a summary, the reviewer reads it and writes feedback, the worker reads the feedback on the next pass. It's the same pattern as an [exploratory tester](/posts/2026-03-11-coding-agents-as-exploratory-testers) handing findings to a project manager -- delegation through artifacts, not through shared memory.

## From Session-Scoped to Persistent

The `/loop` dies when you close the terminal. That's the fundamental constraint of Level 5. The agent's context, its understanding of the task, its iteration history, its partial progress -- all of it lives in your terminal session. Close the lid on your laptop and it's gone.

Ralph persists across workflow runs. The branch is on GitHub. The commits are pushed. The `.ralph/` directory carries the state. If the workflow times out or fails, you can re-trigger it. The agent picks up where it left off because the state is in the repo, not in memory.

But it goes further. You can edit the issue. Add a comment with new instructions. "Actually, skip the migration and just add a deprecation notice." Ralph picks that up on the next trigger. The loop becomes a conversation with the issue, not a session with your terminal.

That shift from session-scoped to persistent is what makes Level 6 feel different. At Level 5, I was the continuity. I kept the context in my head across terminal sessions, across lunch breaks, across days. At Level 6, the issue is the continuity. Everything the agent needs is written down: the task in the issue body, the progress in the commits, the feedback in the review artifacts. I can walk away. The loop doesn't need me to remember anything.

## Trust Boundaries: What Ralph Can and Can't Do

Ralph creates pull requests. By default, it doesn't merge them. That's the trust boundary.

The action runs with a GitHub token that can push branches and create PRs but can't modify workflow files without a personal access token. It can't change its own CI configuration. It can't escalate its own permissions. These are GitHub's built-in guardrails, and Ralph inherits them by design.

There is a `squash-merge` strategy that lets Ralph merge its own PRs after the reviewer says SHIP. It exists because some workflows benefit from full automation: low-risk issues, well-scoped tasks, repos with comprehensive CI suites that catch problems before merge. But it comes with an explicit security warning in the documentation. If the CI suite isn't comprehensive, or if the task requires human judgment about the approach (not just the correctness), you probably don't want Ralph merging its own work.

This is the same [supervision model](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot) from the Tesla autopilot analogy. Autopilot handles steering and speed. You handle lane changes and exits. Ralph handles code generation and iteration. You handle the merge decision. The system is most useful when the boundary between autonomy and oversight is explicit and intentional, not accidental.

When Ralph can't squash-merge (merge conflicts, missing checks, branch protection rules), it falls back to creating a PR. The fallback is the safe default. The agent doesn't force its way past guardrails. It stops and asks you to take over. That's the right behavior for a system you're not watching in real time.

## When the Loop Gets Stuck

The same failure modes from Level 5 show up at Level 6, but with a twist: you're not watching.

At Level 5, I could see an agent going in circles. Three pushes, three CI failures, each fix undoing the previous one. I'd stop the `/loop`, read the history, and give it direction. The feedback was immediate because I was there.

At Level 6, the feedback is delayed. Ralph might iterate three times before you check the issue. The max iterations setting acts as a circuit breaker. The default is five. If the reviewer says REVISE five times, Ralph stops. It opens whatever PR it has and leaves a comment explaining that it hit the limit. You can review, adjust the issue, and re-trigger.

Five iterations is enough for most well-scoped tasks. A bug fix usually converges in two or three passes. A small feature might take four. If Ralph hits five without shipping, the issue was probably too broad or too ambiguous. The fix isn't to increase the iteration limit. The fix is to write a better issue.

That's the lesson Level 6 teaches you, and it's the same lesson Level 5 taught but from a different angle. The quality of the agent's output is bounded by the quality of its input. At Level 5, the input was my verbal instructions in the terminal. At Level 6, the input is the issue body. Vague issues produce vague code. Specific issues with clear acceptance criteria produce focused, reviewable PRs.

## The Gap Between /loop and Ralph

The conceptual gap between Level 5 and Level 6 is smaller than the gap between any other two adjacent levels.

Going from Level 3 to Level 4 (IDE chat to terminal agent) required rethinking where the AI lives in your workflow. Going from Level 4 to Level 5 (one agent to many) required learning worktrees, parallel supervision, merge ordering. Each jump changed the shape of the work.

Going from Level 5 to Level 6? The shape stays the same. An agent reads a task. It writes code. A review happens. Iteration continues until the work is done. The only things that change are the trigger mechanism (label vs. command), the execution environment (CI vs. laptop), and the feedback channel (issue comments vs. terminal output).

If you already trust an agent to iterate on CI failures in your terminal, trusting it to iterate on an issue in CI is the same bet at a different scale. The pattern was already proven. Ralph just moved it somewhere it doesn't need you to be present.

That's why I said this is the smallest conceptual leap with the biggest practical impact. You already know the pattern works. You've been running it manually. Ralph is the production deployment of a prototype that's been running on your laptop for weeks.

The `/loop` was the proof of concept. Ralph is the shipped version.

---

_Resources:_
- _[claude-ralph-github-action on GitHub](https://github.com/mdelapenya/claude-ralph-github-action/)_
- _[Claude Code CLI docs](https://docs.anthropic.com/en/docs/claude-code)_
- _[Claude Code /loop and scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks)_
