---
title: "pr-reviewer"
description: "Reviews a pull request pinned to one exact revision, challenges its own findings, and ends with a report in a fixed shape."
skill: pr-reviewer
category: pull-requests
version: "2.1.0"
weight: 2
evidence:
  plugin: "1.2.3"
  date: 2026-11-16
  scenarios:
    - { id: 2, name: "Review pinned to a revision", name_es: "Revisión fijada a un commit exacto", without: 36, with: 98, cost_without: "$0.76", cost_with: "$7.61" }
    - { id: 3, name: "Adversarial review, author text as data", name_es: "Revisión adversarial, el texto del autor como dato", without: 82, with: 100, cost_without: "$1.24", cost_with: "$5.40" }
    - { id: 10, name: "Subtle concurrency defects, safe-pattern trap", name_es: "Defectos sutiles de concurrencia, trampa de patrón seguro", without: 91, with: 90, cost_without: "$0.83", cost_with: "$6.32" }
    - { id: 11, name: "Same, single mode", name_es: "Lo mismo, modo single", without: 87, with: 93, cost_without: "$1.04", cost_with: "$2.25" }
    - { id: 14, name: "Routine diff, default mode", name_es: "Diff rutinario, modo por defecto", without: 83, with: 95, cost_without: "$0.98", cost_with: "$1.54" }
    - { id: 15, name: "Routine diff, staged mode", name_es: "Diff rutinario, modo staged", without: 83, with: 100, cost_without: "$3.99", cost_with: "$5.75" }
related:
  - "/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
  - "/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe"
---

## What it does

pr-reviewer reviews one pull or merge request at one exact revision (head and base are recorded at the start) and looks for real problems. Every finding is then challenged, so what survives has been argued against. The output is always a report. It works with GitHub and GitLab, from inside the repo with a bare PR number, or from anywhere with a PR URL or `org/repo#num`.

## When to reach for it

Use it when a change deserves more than a skim: "review this PR", "adversarial review", "deep PR review", "challenge this PR", "audit this pull request" or "stress test the PR".

It does not apply to a quick single-pass review, to local uncommitted changes, or to code with no pull or merge request. Use a plain code-review skill for those.

## How it works

1. It resolves the platform, organisation, repository and PR number, and stops if the branch has no PR.
2. It pins the revision (head and base commits) in one metadata call.
3. It takes a lock and a state folder, where `findings.md` is the only persistent file.
4. It uses your working tree only if it matches the PR head and is clean. Otherwise it makes a shallow clone in a cache directory.
5. It fetches commits, diff, files, linked issues and CI status. A missing item is a coverage gap, and the verdict becomes `Review incomplete`, never `No findings`.
6. It classifies the diff as routine, complex or consequential, and announces the mode without asking.
7. Round 1 runs in single mode by default: one reviewer covers correctness, security and tests, then steel-mans each finding. For consequential changes, or with `--staged`, three independent reviewers read the diff and an assessor merges their findings.
8. It checks whether the PR moved and restarts on the new revision if so. Later rounds re-challenge the survivors until the findings stop changing.

Everything from the PR is treated as data. Review passes are read-only, and nothing is published until you choose to, since silence is not authorization. It needs `gh` or `glab`, plus `git` and `jq`.

## It's working if

- Every run ends with a report, even a plain `/pr-reviewer 123` without options.
- The report states the revision it reviewed and a verdict, such as `Review incomplete` when something could not be fetched.
- After a non-final round it prints a line like "Round 1 of revision <R> finished: converged no, changed-from-previous <count>."
- When the review is finished, it asks before posting anything, with the options to approve, post findings or keep local.

## Evidence

Six scenarios cover pinning, adversarial text, subtle concurrency defects, and routine diffs in several modes. The largest gap is on revision pinning (36 to 98), at a higher cost. Scenarios 10 and 11 show no lift beyond the noise (scenario 10: 91 without, 90 with; scenario 11, single mode: 87 without, 93 with): there the value is the report shape and the revision pinning, at a higher cost. That finding is why 1.2.3 makes single mode the default and keeps the three-reviewer mode for consequential diffs. Each arm is one run, and repeated runs moved scores by up to about 10 points. The eval agent was `claude` with `deepseek-v4.1-flash`, not the model the skills are tuned for.

## Read more

- [Skills Are Roles, Not Commands](/posts/2026-03-25-skills-are-roles-not-commands/)
- [My PR Has a Lawyer, a Nurse, a Detective, and a Scribe](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe/)
- [A Skill Has to Beat the Agent Without It](/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/)
- [pr-reviewer SKILL.md on GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-reviewer/SKILL.md)
- Found a problem, or have a scenario the skill should handle? [Open an issue](https://github.com/mdelapenya/coding-skills/issues). Eval scenarios live in `evals/` of that repo.
