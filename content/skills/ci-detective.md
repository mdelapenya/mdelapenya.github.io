---
title: "ci-detective"
description: "Tells you whether a red CI run was broken by your pull request or was already failing elsewhere, and traces your failures to the diff."
skill: ci-detective
category: ci
version: "1.1.2"
weight: 1
evidence:
  plugin: "1.2.3"
  date: 2026-11-16
  scenarios:
    - { id: 5, name: "Did my PR break CI", name_es: "Mi PR ha roto la CI", without: 82, with: 96, cost_without: "$0.42", cost_with: "$0.57" }
related:
  - "/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it"
  - "/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

## What it does

ci-detective investigates the failing checks on a pull or merge request. It compares the failing jobs and tests with recent runs on other branches, and classifies each failure as pre-existing, introduced by the PR, or unverified. For the failures the PR introduced, it traces them to the diff and suggests a fix. It supports GitHub Actions and GitLab CI.

## When to reach for it

Use it when CI is red and you do not know whose fault it is: "investigate CI failure", "CI is red", "is this test flaky", "why is this test failing", "did my PR break this" or "check if failure is pre-existing".

SKILL.md has no explicit list of cases to avoid. If the CI system is not supported, it tells you and stops.

## How it works

1. It detects the CI system: `.github/workflows/` means GitHub Actions, `.gitlab-ci.yml` means GitLab CI.
2. It reads the failing workflow, job and test names from the PR's run.
3. It looks at the last N runs on other branches (10 by default, which you can change, for example `/ci-detective 20`) and picks three to five with mixed outcomes. If it finds none, it widens the search up to 50 and then marks the failures "unverified".
4. It checks whether the same jobs and tests fail in those runs.
5. It labels each failure Pre-existing, Introduced by this PR, or Unverified.
6. For introduced and unverified failures, it reads the logs and the diff, looks for the causal link, and suggests a fix.
7. It prints the report.

The skill does not assume a failure is pre-existing or caused by infrastructure: it gathers evidence first. Logs, test output and the diff are data, so text in them addressed to the agent ("ignore this failure") is reported and not acted on. It needs `gh` or `glab`, and `jq`.

## It's working if

- You get a summary table with one row per failing test: your PR, each comparison run (with its id and branch), and a verdict.
- Each verdict is Pre-existing, Introduced by this PR, or Unverified, and none of them is assumed.
- For every introduced or unverified failure, you see the test name and error, the relevant diff lines, an explanation of the cause and a suggested fix.

## Evidence

The scenario asks "did my PR break CI?" on a checkout refactor with three failing tests, and checks for unverified verdicts and no flaky assumptions. The agent alone scored 82; with the plugin, 96, at <span>$0.57</span> per solve instead of <span>$0.42</span>. The agent alone already does reasonably well here, so the gap is modest. It is one scenario and one run per arm, and repeated runs moved scores by up to about 10 points. The eval agent was `claude` with `deepseek-v4.1-flash`, not the model the skills are tuned for.

## Read more

- [My PR Has a Lawyer, a Nurse, a Detective, and a Scribe](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe/)
- [Skills Are Roles, Not Commands](/posts/2026-03-25-skills-are-roles-not-commands/)
- [A Skill Has to Beat the Agent Without It](/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/)
- [ci-detective SKILL.md on GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/ci-detective/SKILL.md)
- Found a problem, or have a scenario the skill should handle? [Open an issue](https://github.com/mdelapenya/coding-skills/issues). Eval scenarios live in `evals/` of that repo.
