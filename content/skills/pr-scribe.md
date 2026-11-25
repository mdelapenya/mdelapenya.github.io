---
title: "pr-scribe"
description: "Writes a pull request description and a Conventional Commits title from the diff, then updates the PR and checks that the update took."
skill: pr-scribe
category: pull-requests
version: "1.1.3"
weight: 1
evidence:
  plugin: "1.2.3"
  date: 2026-11-16
  scenarios:
    - { id: 0, name: "Conventional Commits title and description", name_es: "Título y descripción en Conventional Commits", without: 57, with: 100, cost_without: "$0.31", cost_with: "$0.47" }
    - { id: 1, name: "biomelab output files", name_es: "Ficheros de salida de biomelab", without: 25, with: 100, cost_without: "$0.56", cost_with: "$0.54" }
related:
  - "/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it"
  - "/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe"
  - "/posts/2026-05-22-i-sent-a-message-on-telegram-a-pull-request-appeared-on-github"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

## What it does

pr-scribe reads the diff of a pull or merge request and writes two things: a concise description and a title in Conventional Commits form. It follows the repository's PR template when there is one, links related issues, and applies both fields to the PR. It works with GitHub, GitLab and biomelab workspaces, and picks the platform from the git remote.

## When to reach for it

Use it when a PR is open (or about to be) and the title and body are missing, stale or inconsistent. Typical phrases are "describe this PR", "write the PR description", "fill in PR body", "summarize PR changes" and "update the PR title".

SKILL.md lists no cases where it should not be used. If the platform is not supported, it stops.

## How it works

1. It detects a biomelab workspace and the platform from `git remote -v`, and asks if there are several remotes.
2. It takes the PR number from the arguments or asks for it.
3. It fetches the PR metadata and the diff.
4. It looks for a PR template and falls back to a default structure ("What's changed", "Why is this important?", "Changes", "Test plan").
5. It finds related issues from the branch name, the commit messages and an issue search, and writes `Closes`, `Fixes`, `Related to` or `Supersedes` lines.
6. It writes the description in the imperative mood, without repeating the title in the body.
7. It writes the title as `<type>(<scope>): <subject>`, at most 72 characters, and keeps the existing title if it already conforms.
8. It updates the title and body through `gh` or `glab`, then fetches the PR again and compares.

The diff, the commits and the PR body are treated as data, never as instructions. One thing to know before running it: on GitHub and GitLab it applies the update without asking for confirmation. In biomelab mode it only writes local files and does not touch the remote PR. It needs `gh` or `glab`, plus `jq` and `git`.

## It's working if

- You see the generated title and description before they are applied.
- The PR on the platform shows the new title and body, and the skill confirms it re-read them and they match.
- If the update fails or the fields differ, it reports the error and prints the title and description for you to apply by hand, instead of reporting success.
- In biomelab mode, `.biomelab/pr-title.md` and `.biomelab/note.md` exist and the remote PR is untouched.

## Evidence

The two scenarios check the Conventional Commits title and description, and the biomelab output files. Without the plugin the agent scored 57 and 25; with it, 100 and 100. Cost per solve is similar (about <span>$0.31</span> to <span>$0.47</span> in the first, <span>$0.56</span> to <span>$0.54</span> in the second), so the gap comes from following the format, not from spending more. These are single runs per arm, and repeated runs moved single scores by up to about 10 points. The eval agent was `claude` with `deepseek-v4.1-flash`, not the model the skills are tuned for.

## Read more

- [My PR Has a Lawyer, a Nurse, a Detective, and a Scribe](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe/)
- [I Sent a Message on Telegram. A Pull Request Appeared on GitHub.](/posts/2026-05-22-i-sent-a-message-on-telegram-a-pull-request-appeared-on-github/)
- [Skills Are Roles, Not Commands](/posts/2026-03-25-skills-are-roles-not-commands/)
- [A Skill Has to Beat the Agent Without It](/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/)
- [pr-scribe SKILL.md on GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-scribe/SKILL.md)
- Found a problem, or have a scenario the skill should handle? [Open an issue](https://github.com/mdelapenya/coding-skills/issues). Eval scenarios live in `evals/` of that repo.
