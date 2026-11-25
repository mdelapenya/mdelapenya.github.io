---
title: "pr-nurse"
description: "Watches CI and mergeability on your branch's pull request, fixes what the branch broke, merges main when needed, and pushes."
skill: pr-nurse
category: pull-requests
version: "1.1.1"
weight: 4
evidence:
  plugin: "1.2.3"
  date: 2026-11-16
  scenarios:
    - { id: 7, name: "Red PR with conflicts", name_es: "PR en rojo con conflictos", without: 84, with: 97, cost_without: "$1.08", cost_with: "$1.30" }
related:
  - "/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it"
  - "/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe"
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
---

## What it does

pr-nurse looks after the pull or merge request of your current branch. It checks the CI status and whether the PR can be merged, diagnoses failing checks, fixes failures caused by the branch, merges main into the branch to pick up upstream fixes or resolve conflicts, and pushes. It supports GitHub and GitLab, and can repeat the cycle every five minutes.

## When to reach for it

Use it when a PR is red or conflicted and you want it brought back to green: "nurse this PR", "babysit this PR", "keep CI green", "why is CI failing on my PR", "merge main into this PR" or "resolve this PR's conflicts".

If no PR exists for the current branch, it stops. If checks are still pending, it reports that and stops without waiting. The skill is manual-only (it does not trigger on its own), and it is best run from a git worktree.

## How it works

1. It detects the platform and fetches the PR metadata.
2. It checks CI status. If everything is green and the PR is mergeable, it reports success and stops.
3. It diagnoses each failure. If the fix is likely already on main, it syncs with main and pushes.
4. If the failure comes from the branch, it edits the code, commits and pushes.
5. For merge conflicts, it resolves them keeping both intents, asks you when the right outcome is ambiguous, then commits and pushes.
6. It prints a report and offers to keep going on a five-minute loop, which starts only if you confirm.

When syncing main from a worktree, it checks that the root repository is clean and asks if it is not. It never force-pushes: a rejected push means it stops and asks. CI logs and PR metadata are treated as data, not instructions, so a log that asks for a command or a skipped check is reported, not followed. It needs `gh` or `glab`, plus `jq` and `git`.

## It's working if

- The report says which checks were failing and why.
- It states whether main was merged and which conflicts were resolved.
- It lists the code fixes it applied, and the current CI and mergeable status of the PR.
- The pushes it made are regular pushes, and a rejected push ends the run with a question for you.

## Evidence

The scenario is a red PR with a failure fixed on main, a failure caused by the branch, and a merge conflict. The agent alone scored 84; with the plugin, 97, at <span>$1.30</span> per solve instead of <span>$1.08</span>. The gap is 13 points, from a single run per arm, and repeated runs moved scores by up to about 10 points, so part of it may be noise. The eval agent was `claude` with `deepseek-v4.1-flash`, not the model the skills are tuned for.

## Read more

- [My PR Has a Lawyer, a Nurse, a Detective, and a Scribe](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe/)
- [Level 5 in Practice: Four Agents, Four Worktrees, One Developer](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer/)
- [A Skill Has to Beat the Agent Without It](/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/)
- [pr-nurse SKILL.md on GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-nurse/SKILL.md)
- Found a problem, or have a scenario the skill should handle? [Open an issue](https://github.com/mdelapenya/coding-skills/issues). Eval scenarios live in `evals/` of that repo.
