---
title: "My PR Has a Lawyer, a Nurse, a Detective, and a Scribe"
date: 2026-04-30 09:00:00 +0200
description: "Four Claude Code skills I use on every pull request: one writes the description, one handles review comments, one investigates CI failures, and one watches the build. All designed as roles, not commands."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "developer-experience", "pull-requests", "skills"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe/cover.png"
related:
  - "/posts/2026-03-25-skills-are-roles-not-commands"
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
  - "/posts/2026-04-24-my-daily-workflow-with-biomelab"
---

![My PR Has a Lawyer, a Nurse, a Detective, and a Scribe](/images/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe/cover.png)

Every PR I open goes through four people. The scribe writes the description. The lawyer handles the review. The detective investigates CI failures. The nurse watches the build until it merges. None of them are people. They are Claude Code skills, each designed as a role with judgment, not a command that executes. This is how they work and why the "role not command" distinction matters more than I expected.

## The Repo: coding-skills

The four skills live in [mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills), an open-source collection I maintain. Each one is a SKILL.md file that gives Claude Code a persona, a workflow, and constraints. Each one supports multiple platforms (GitHub and GitLab) via platform-specific reference files, so the same skill works regardless of where your code lives.

The four roles:

- **`pr-scribe`**: writes PR descriptions from diffs
- **`pr-lawyer`**: triages review comments into accept, challenge, or clarify
- **`ci-detective`**: investigates CI failures by cross-referencing across branches
- **`pr-nurse`**: monitors CI and mergeable status on a loop

Every skill is named as a person, not a verb. I wrote about why [skills should be roles, not commands](/posts/2026-03-25-skills-are-roles-not-commands): when the skill is a person, the agent makes decisions. The scribe decides what to emphasize in the diff. The nurse decides whether to merge main, fix the code, or escalate. A verb just runs. A role judges.

## PR Scribe: The Description You Never Want to Write

Writing PR descriptions is the most skipped step in my workflow. The code is already there. The diff tells the story. I want to move on.

The scribe does it for me. It reads the diff, detects the platform from `git remote -v`, finds the PR template if one exists in the repo, and fills it in. It scans branch names and commit messages for issue references (patterns like `fix/123`, `closes #456`, `resolves #789`) and appends a Related Issues section when it finds them. Then it updates the PR body directly.

The last step does not ask for confirmation. That is deliberate. The whole point is frictionless. If I don't like what it wrote, I edit it. But I am no longer staring at a blank description hoping willpower kicks in.

What a PR looks like before the scribe: an empty body, maybe a title that matches the branch name. What it looks like after: a structured description with what changed, why it matters, changes grouped by component, a test plan, and linked issues. The scribe is not a deep thinker. It documents accurately and gets out of the way.

## PR Lawyer: The Review Comments You Don't Want to Rubber-Stamp

Review comments arrive and the reflex is to fix everything the reviewer says. That reflex produces worse code. Not all feedback is equal. Some is correct: there is a real bug, a clarity issue, a better approach. Some is wrong: it is based on a misunderstanding, contradicts the PR's stated goals, or is purely subjective preference. Some is a question that does not require a code change at all.

The lawyer triages every comment. For each one, it reads the source file and the diff context, then classifies it:

- **Accept**: there is a legitimate issue. Fix the code.
- **Challenge**: the feedback is wrong, subjective, or based on a misunderstanding. Push back with a reasoned argument.
- **Clarify**: it is a question, not a request. Answer it.

After classifying, it clusters the accepted fixes into logical groups (same file, same type of issue, same reviewer concern) and presents the full triage for my approval:

> **To fix (2 clusters):**
> 1. `fix`: null-safety issues (auth.go, session.go)
> 2. `style`: naming conventions (multiple files)
>
> **To challenge:**
> - "Use a factory pattern here": intentional, will argue the current approach
>
> **To clarify:**
> - "Why is the timeout set to 30s?": will explain the rationale

I approve, adjust, or skip. Then it fixes each cluster as a separate commit with a conventional commit message, posts replies to every comment (with commit SHAs for fixes, reasoned arguments for challenges), and asks before pushing. It never rubber-stamps. It never dismisses everything either. It makes judgment calls. "I disagree because this approach is intentional. Happy to discuss if you see it differently" is a legitimate reply. So is "Fixed in abc123."

## CI Detective: Was It Me or Was It Already Broken?

CI fails on my PR. I look at the failing test and I don't recognize it. I didn't touch that code. The question every developer asks in that moment: is this my fault, or was it already broken?

The detective answers that question with evidence, not guessing. Its method:

1. Fetch the PR's failing checks and identify the specific test names
2. Pull the failure details from the logs: error messages, stack traces, exit codes
3. Cross-reference the same tests against recent runs on other branches and on main
4. Build a comparison table: same test, multiple branches, pass or fail on each

A real example, anonymized. Three platform-specific tests were failing on my PR. The detective checked main: one recent run passed all three, another run had a different subtest failing. It checked two other feature branches: the same tests were failing there too, with different error patterns. The verdict table looked like this:

| Test | My PR | main (run A) | main (run B) | Branch X | Branch Y |
|---|---|---|---|---|---|
| Test A | FAIL | PASS | FAIL (different subtest) | FAIL | FAIL |
| Test B | FAIL | PASS | N/A | N/A | N/A |
| Test C | FAIL | PASS (but partial fail) | N/A | N/A | N/A |

Every failure was pre-existing or flaky. None were related to my changes. Different tests failed on different branches. The same test passed and failed across runs on main itself.

That table saved me from chasing phantom failures for an afternoon. The detective does not guess. It gathers evidence, cross-references, and presents a verdict. The final call is mine, but the data is there.

## PR Nurse: Watching the Build So You Don't Have To

You submit a PR. CI runs. You context-switch to another task. Twenty minutes later, CI fails. You come back, diagnose, fix, push. CI runs again. You context-switch again. This cycle eats hours of wall-clock time, not because the fixes are hard, but because the round-trips are slow and the attention cost of each context-switch is real.

The nurse runs on `/loop`. It checks CI status and mergeable state every few minutes. When something breaks, it acts:

- CI fails because main diverged: the nurse merges main and pushes.
- CI fails because of a code issue: the nurse fixes it, commits, and pushes.
- Merge conflicts appear: the nurse resolves them (preserving intent, asking when the resolution is ambiguous), then pushes.
- CI passes and the PR is mergeable: the nurse reports back.

The nurse pushes after every fix. That is the point: it handles the full round-trip so I do not have to. The constraint is that it never force-pushes. If a push is rejected, it stops and asks. If there are uncommitted local changes, it stops and asks. It acts autonomously within clear boundaries.

The nurse is what makes "submit the PR and walk away" viable. I start the `/loop`, move on to the next [biomelab](/posts/2026-04-24-my-daily-workflow-with-biomelab) worktree, and come back to either a green build or a clear diagnosis of what is stuck and why.

## The Full PR Lifecycle

I use [biomelab](https://biomelab.dev) as my daily dashboard for managing git worktrees, coding agents, and pull requests across all my repositories (I wrote about [my workflow with it](/posts/2026-04-24-my-daily-workflow-with-biomelab)). Here is how the four skills chain in practice with my biomelab workflows:

`c` (create worktree) → work → `Shift+P` (submit PR) → `/pr-scribe` (write description) → review arrives → `/pr-lawyer` (triage: fix, challenge, clarify) → CI fails → `/ci-detective` (mine or pre-existing?) → `/pr-nurse` on `/loop` (watch, fix, push until green or stuck)

Four roles. Four judgment calls. One keyboard-driven workflow from open to merge.

Not every PR needs all four. A clean PR with no review comments and green CI only uses the scribe and the nurse. A PR with contentious feedback uses the lawyer heavily. A PR with mysterious CI failures needs the detective. The skills compose because each one is self-contained: it does its job and exits. No skill depends on another's output. They share a PR number and a git branch. That is the only coupling.

## Why Roles, Not Commands

Every skill in the repo is named as a person. The scribe decides what matters in the diff. The lawyer decides what to fight. The detective decides what to investigate. The nurse decides whether to merge main, fix the code, or ask for help.

The verbs execute. The roles judge. That distinction is the entire difference between a useful automation and a useful collaborator.

---

_Resources:_
- _[mdelapenya/coding-skills on GitHub](https://github.com/mdelapenya/coding-skills)_
- _[Claude Code skills documentation](https://docs.anthropic.com/en/docs/claude-code/skills)_
