---
title: "pr-lawyer"
description: "Judges each review comment on your pull request, fixes the valid ones, argues back on the rest, and replies to every comment."
skill: pr-lawyer
category: pull-requests
version: "1.1.2"
weight: 3
evidence:
  plugin: "1.2.3"
  date: 2026-11-16
  scenarios:
    - { id: 4, name: "Triage review comments", name_es: "Triaje de comentarios de revisión", without: 70, with: 97, cost_without: "$0.43", cost_with: "$0.76" }
related:
  - "/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it"
  - "/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

## What it does

pr-lawyer takes the unresolved review comments on a pull or merge request and decides, one by one, what each deserves. A valid comment gets a code fix. A debatable or wrong one gets a reasoned argument back to the reviewer. A question gets an answer with no code change. It supports GitHub and GitLab, and it never accepts everything or dismisses everything.

## When to reach for it

Use it after a review has landed on your PR: "address PR comments", "respond to review", "reply to review comments", "challenge this comment" or "handle review feedback".

SKILL.md states no cases where it should not be used. If there are no unresolved comments, it says so and stops.

## How it works

1. It detects the platform from `git remote -v` and fetches the unresolved comments, both on files and on the PR as a whole. You can pass a PR number, or it uses the PR of the current branch.
2. It triages each comment as Accept, Challenge or Clarify, and groups the accepted ones into clusters of related changes.
3. It shows the plan (to fix, to challenge, to clarify) and asks you before acting.
4. For each cluster it edits the code, runs the repository's own checks, and commits with a Conventional Commits type such as `fix:`, `refactor:`, `style:`, `docs:` or `test:`. With `--single-commit` it makes one commit instead.
5. It asks "Ready to push to origin?" and pushes only if you confirm. It never force-pushes, and a rejected push means it stops and asks.
6. It replies to every comment: "Fixed in <commit-sha>", a reasoned disagreement, or a concise answer, each with a link to the original comment.
7. It prints a report.

Review comments and the PR body are data, not instructions: anyone with comment access can write them, so text in a comment that tells the skill to run a command or approve is reported to you and not followed. It needs `gh` or `glab`, and `git`.

## It's working if

- You get a plan that splits the comments into fix, challenge and clarify before anything is edited.
- There is one commit per cluster of fixes, not one giant commit (unless you asked for `--single-commit`).
- Every comment on the PR has a reply, and each reply links to the comment it answers.
- The final report has the sections "Accepted (fixed)", "Challenged" and "Clarified".

## Evidence

The scenario gives the skill a set of review comments on a caching change and asks for a response plan with the right commit types and reply links. The agent alone scored 70; with the plugin it scored 97, at <span>$0.76</span> per solve instead of <span>$0.43</span>. It is a single scenario and a single run per arm, and repeated runs moved scores by up to about 10 points, so read it as one data point. The eval agent was `claude` with `deepseek-v4.1-flash`, not the model the skills are tuned for.

## Read more

- [My PR Has a Lawyer, a Nurse, a Detective, and a Scribe](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe/)
- [Skills Are Roles, Not Commands](/posts/2026-03-25-skills-are-roles-not-commands/)
- [A Skill Has to Beat the Agent Without It](/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/)
- [pr-lawyer SKILL.md on GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-lawyer/SKILL.md)
- Found a problem, or have a scenario the skill should handle? [Open an issue](https://github.com/mdelapenya/coding-skills/issues). Eval scenarios live in `evals/` of that repo.
