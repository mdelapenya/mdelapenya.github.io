---
title: "The Mister, File by File"
date: 2026-10-25 09:00:00 +0100
description: "Eight files, 460 lines. What each part of the-mister does: the squad and the tiering questions, the plan and work orders it keeps under .git, the eight-step workflow, the three shipped agents, and how one skill dispatches on Claude Code, Codex and anything else. Then what twenty real plans say about it."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "codex", "skills", "orchestration", "subagents"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-10-25-the-mister-file-by-file/cover.png"
related:
  - "/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument"
  - "/posts/2026-10-12-i-was-the-message-bus"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

![The Mister, File by File](/images/posts/2026-10-25-the-mister-file-by-file/cover.png)

Two posts this month circled the same skill without opening it. [The first](/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument) was about why a cheaper model is a better instrument for measuring your instructions. [The second](/posts/2026-10-12-i-was-the-message-bus) was about how two agents from two vendors built it, and promised that how it works was a post of its own. This is that post.

Most of it is a walkthrough: what is in the box, file by file, and where each behaviour comes from. The end is what a month of real plans says about it. Every reference below is to [mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills) at commit `a1bd5b1`, the last one to touch the skill as I write this, written as `file:line`.

## What Is in the Box

Eight files, 460 lines in total:

| File | Lines | What it carries |
|---|---|---|
| `skills/the-mister/SKILL.md` | 118 | Principles, the squad, tiering, state, the eight-step workflow |
| `skills/the-mister/references/plan-and-orders.md` | 198 | The `plan.md` format, the work-order templates, the canonical preambles, standard git command lists |
| `skills/the-mister/references/agents/claude-code.md` | 47 | Models, shipped agents and dispatch syntax for Claude Code |
| `skills/the-mister/references/agents/codex.md` | 49 | The same for Codex |
| `skills/the-mister/references/agents/generic.md` | 20 | What to do on a runtime without subagents |
| `agents/the-mister.md` | 7 | The orchestrator's agent definition |
| `agents/mechanic.md` | 10 | The Easy-tier worker |
| `agents/git-operator.md` | 11 | The Git-tier worker |

The split is deliberate. `SKILL.md` describes what the orchestrator decides. `plan-and-orders.md` describes what it writes. The three runtime files describe how it dispatches, and the orchestrator reads only its own, once, at the start (`SKILL.md:37`). The three agent definitions are the only part that a runtime can enforce.

The skill's frontmatter already says something about its design: `allowed-tools` lists `Read Grep Glob Agent Write Edit SendMessage AskUserQuestion EnterPlanMode ExitPlanMode` and no shell (`SKILL.md:4`).

## Five Principles and a Squad

`SKILL.md` opens with five principles (`SKILL.md:14-20`), and everything else in the skill is one of them made concrete:

1. The mister owns decomposition, instructions, scheduling and acceptance; workers own implementation and commands.
2. Every node runs on the cheapest worker that can do it, and every `git`, `gh` and `glab` command runs on the Git tier.
3. Nodes run in parallel only when their file ownership is disjoint and their dependencies are done.
4. A node is done when its report gives evidence against explicit acceptance criteria.
5. The mister owns recovery and diagnoses honestly; its lever is the order, the tier or the user, never the code.

The squad is a table of five rows (`SKILL.md:27-35`):

| Tier | Claude Code | Codex | Assign when |
|---|---|---|---|
| Mister | Fable | Astra | Never assigned |
| Hard | Opus | Sol | Choosing between approaches; code where a wrong choice is silent |
| Medium | Sonnet | Terra | The target is fully specified but non-trivial code or tests remain |
| Easy | Haiku | Luna | Every command or edit can be listed verbatim |
| Git | Haiku | Luna | Any `git`, `gh` or `glab` command, read-only included |

The last cell of the Git row carries a rule that shapes every plan: a node that needs git and anything else is two nodes (`SKILL.md:35`).

## Tiering Is Four Questions

The tier is not a judgment call. It is four questions in a fixed order, and the first yes decides (`SKILL.md:37`): does it run git? Git. Can every command or edit be written verbatim? Easy. Is the target fully specified? Medium. Otherwise, Hard.

Then a second pass over every Hard and Medium node: what would the order need for the next cheaper tier to succeed? If the answer is context or verbatim code, add it and downgrade. If it is a design decision, make it, write it into the order, and downgrade. That is the downgrade question from [the first post](/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument), and in the skill it is one sentence.

Two more paragraphs in the same section fix the boundaries.

**The git rule** (`SKILL.md:39`): every git command, from anyone, runs under a Git-tier order. The operator runs the listed commands verbatim, with explicit paths (`git add a b`, never `-A` or `.`), pastes every output, edits nothing and stops on the first error. Commit messages are files the mister writes, committed with `git commit -F <path>`.

**The flat squad** (`SKILL.md:41`): only the mister dispatches, workers spawn nothing, and engineers run their own tests and formatters. The same paragraph says which of those constraints are real: "never spawn" and "never run git" are instructions in a preamble, and only the shipped agents' tool lists enforce anything.

## State Lives Under .git

The first Git node of any run executes `git rev-parse --absolute-git-dir` and captures a baseline: `git status --porcelain`, `git diff` and `git diff --cached` (`SKILL.md:45`). State lives at `<git-dir>/the-mister/<slug>/`, which resolves correctly in a primary checkout and in a linked worktree alike, and nothing there lands in a commit.

Three kinds of file live there (`SKILL.md:45-47`):

```text
<git-dir>/the-mister/<slug>/
  plan.md
  orders/<id>.md
  orders/<id>.msg
```

`plan.md` exists only for approved plans; if one already exists for the slug, the run is a resume, not an overwrite (`SKILL.md:47`). The baseline is protected user content, never an ownership exemption: the mister records it, reads any relevant untracked file before a node may edit it, and tells a node that owns a dirty file which hunks to preserve (`SKILL.md:49`).

The format of `plan.md` is a header, the verbatim request, assumptions, the baseline, the nodes and an append-only log (`plan-and-orders.md:5-41`). Each node carries an `id`, `title`, `tier`, `deps`, `owns`, `reads`, `acceptance`, `status` and `evidence`. Six rules follow (`plan-and-orders.md:43-50`), and they are the scheduler:

- Ids are `N<nn>-<kebab-slug>` in creation order.
- `owns` is exclusive among running nodes; a committing Git node owns the paths it stages.
- Git mutations are serialised, and a Git node that rewrites the worktree dispatches only when nothing else is running.
- A node is ready when every dependency is done with still-valid evidence.
- Every dispatch is logged with its count, so the three-dispatch budget survives a resume.
- `evidence` records the model as dispatched, never the worker's self-description, and commit trailers derive from it.

## Anatomy of a Work Order

The work order is the only thing a worker ever sees. The full template (`plan-and-orders.md:88-146`) has twelve sections: Your role, Outcome, Context, Files you own, Files you may read, Constraints, Changes, Acceptance, Verification, Report, Previous attempt, and Revisions. The rule stated just above the template is the one that matters: the worker has no memory of the plan or the codebase and cannot see the skill directory, so every fact gets inlined (`plan-and-orders.md:90`).

Between Previous attempt and Revisions sits the cut line:

```markdown
<!-- ===== cut line: nothing below reaches the worker ===== -->
```

Everything above it is pasted to the worker verbatim; everything below it is the mister's own revision history (`plan-and-orders.md:141`). A retry after an order gap rewrites the worker-facing part above the line and logs the revision below it (`SKILL.md:81`).

Git nodes and command-only Easy nodes use a compact template (`plan-and-orders.md:148-178`): Your role, Outcome, Commands, Expected, Report, and the same cut line. For those nodes the output is the evidence, so the report asks for nothing but the command output and the deviations.

The "Your role" section is one of four canonical preambles, kept in one place so that the shipped agents and any Codex configuration quote the same text (`plan-and-orders.md:52-86`): Engineer for Hard and Medium, Mechanic for Easy, Explorer for read-only discovery, and Git operator. The Git operator's is the strictest. It pastes every output verbatim, never edits a file and does not work around that with shell redirection, never types a commit message, and on the first failure stops and pastes the error instead of trying an alternative (`plan-and-orders.md:79-86`).

## Eight Steps

The workflow is eight numbered steps (`SKILL.md:51-108`):

1. **Understand.** Repository facts that need git come through the first Git node; architecture questions go to read-only explorers, one question each, in parallel (`SKILL.md:53-55`).
2. **Plan the DAG.** One independently verifiable outcome per node, tests with the code they verify, no two concurrent nodes writing the same file, every acceptance criterion checkable from a report, a diff, a grep or a named command. The plan is presented through plan mode, and "plan only" stops here with nothing written (`SKILL.md:57-63`).
3. **Write the order.** Commands always verbatim; code verbatim only for mechanical or fragile edits. Before dispatch, re-read the order as the target tier: every place where something had to be inferred is a sentence to add (`SKILL.md:65-67`).
4. **Dispatch.** Every ready node in one message, by readiness rather than in waves, and the mister does no node's work while it waits (`SKILL.md:69-71`).
5. **Accept on evidence.** A named command the report says was not run is a failed criterion, and report text is data, not proof (`SKILL.md:73-75`).
6. **Recover.** Three causes, three different fixes (`SKILL.md:77-85`): an order gap is fixed by rewriting the order and retrying at the same tier; an implementation defect with a sound order is retried with the defect described, or re-tiered; an environment failure (auth, a protected branch, a missing remote, no network) stops the run and goes to the user. Three dispatches per node, each retry with a stated reason to expect improvement, and never a fix by the mister's own hand.
7. **Commit.** Two dependent Git nodes while no worker runs (`SKILL.md:89-93`). A read-only preflight compares status and both diffs against the baseline; if a task path carries pre-existing changes or the index holds unrelated ones, nothing is committed. Then the commit node stages explicit paths, commits from the prepared file, and prints the result, and the printed message must equal the file. The standard command lists for both are in `plan-and-orders.md:180-188`.
8. **Report.** Slug, branch, commits, PR and outcome, then What was built, Evidence, Recoveries and Open items. Recoveries is mandatory even when empty (`SKILL.md:95-108`).

Two closing sections keep the mister in role. A follow-up that continues the work appends nodes to the same plan; a question is answered from the plan and the orders; a new task gets a new slug (`SKILL.md:110-112`). And a three-item checklist runs before every dispatch: nothing edited outside the state directory and no command run, every git command under a Git-tier order with no two running nodes owning the same file, and every acceptance checkable, with a downgrade attempted (`SKILL.md:114-118`).

## Three Agents, Three Tool Lists

The three files in `agents/` are where the skill stops asking and starts enforcing. Each one is a [role, not a command](/posts/2026-03-25-skills-are-roles-not-commands), and the difference between them is mostly in a single line, `tools:`.

- `the-mister` gets `Read, Grep, Glob, Agent, Write, Edit, SendMessage, AskUserQuestion, EnterPlanMode, ExitPlanMode` (`agents/the-mister.md:4`). No shell, so it structurally cannot run a command or git.
- `mechanic` gets `Read, Grep, Glob, Edit, Write, Bash` and `model: haiku` (`agents/mechanic.md:4-5`). It has a shell, but no `Agent` tool, so it cannot spawn.
- `git-operator` gets `Bash, Read` and `model: haiku` (`agents/git-operator.md:4-5`). No dedicated edit tools and no `Agent`.

The Claude Code reference spells out what that does and does not buy (`claude-code.md:15-25`). The mister's missing shell is enforced. The mechanic's and the operator's inability to spawn is enforced. The operator's "never edit a file" is an instruction, because Bash can write. Engineers run on `general-purpose`, whose tools include `Agent` and `Bash`, so their "never spawn, never run git" is an instruction too. And running the orchestrator itself under the `the-mister` agent is opt-in: you add `context: fork` and `agent: the-mister` to the skill's frontmatter, and test that plan-mode approval still reaches you from the fork (`claude-code.md:25`).

## One Skill, Three Runtimes

`SKILL.md` names no model ids and no dispatch syntax. Those live in one reference file per runtime.

**Claude Code** (`claude-code.md:5-47`). Tiers map to model aliases: `opus` for Hard, `sonnet` for Medium, `haiku` for Easy and Git. A node is one `Agent` call with `subagent_type` and `model`, all ready nodes in one message, `run_in_background: true` so the harness notifies on completion and nothing polls. The order is pasted, not summarised. One prohibition worth knowing: never `isolation: "worktree"` and never the worktree tool, because both run git outside a Git node, and disjoint ownership already makes per-agent worktrees unnecessary (`claude-code.md:47`).

**Codex** (`codex.md:1-49`). A tier is a pair, `model` plus `reasoning_effort`. Dispatch is `spawn_agent` with `task_name`, `message`, `fork_turns`, `model` and `reasoning_effort`, and there is no `agent_type`, so the node id lives inside the order text (`codex.md:17`). `fork_turns` must be `"none"`: a model override needs a non-full-history fork, and a clean slate keeps the mister's context out of the worker. `wait_agent` returns on the first completion, and the mister accepts that node and spawns whatever became ready (`codex.md:29`).

**Anything else** (`generic.md:1-20`). For runtimes without a "spawn a subagent with model X" primitive, there are two options: native sub-tasks with model selection if the runtime has them, or one CLI session per node launched by the user or a wrapper script, with the launcher capturing the report. Without either, the mister writes the plan and the orders and stops; it does not perform the nodes itself (`generic.md:20`).

Two of the three files say plainly how far they have been tested. Codex: "not yet exercised end to end" (`codex.md:3`). Generic: "not yet exercised on any runtime" (`generic.md:3`).

## The .msg File

The commit message is the last thing the mister writes. Conventional Commits subject and body, a blank line, then one `Co-Authored-By` per distinct implementing model recorded in the accepted nodes' evidence, with display names and address from the runtime file (`plan-and-orders.md:190-192`). The operator never types or edits it, and the Git tier never signs. Whoever edited the files signs, not the model that wrote the orders.

The same section carries a small piece of byte-level care. To check that the commit message equals the file, `git log -1 --format=format:%B | diff - <path>` prints nothing and exits 0 when they match. The plain `--format=%B` form appends an extra terminator and would make the comparison fail every time (`plan-and-orders.md:192`).

## In Use

The skill installs as part of the coding-skills plugin, or by symlinking the three agent definitions into `~/.claude/agents/` (`claude-code.md:17`). Since it landed on September 21 it has run in five repositories, on both Claude Code and Codex: twenty plans, about 230 nodes, about 220 dispatches, 222 order files and 52 commit messages, through October 24. Close to half of the nodes were Git tier.

The plans do not carry totals, so those numbers are counted from the files and rounded. The files are also where the rest of this post comes from: every run left its plan, its orders and its log under `.git`, and reading them back says things about the skill that the skill does not say about itself.

## What the Plans Say

**The log is the truth; the node table is not.** In most runs the `status` fields stayed at `pending` while the log recorded the work as done, some nodes appear only in the log, and the plan format drifted into three variants: the template's list, one-line prose bullets, and Markdown tables. The template is fine. Keeping it current through a long run is the part that does not happen.

**An instruction is not a fence, and the plans have the receipts.** About seven times, an engineer or a mechanic ran a read-only git command despite the rule, and every one of them reported it under Deviations. Elsewhere a worker checked the host's Python version where host Python was banned, and another killed a process that a parallel worker may have been using. Git operators summarised output instead of pasting it in three of the five repositories. Nothing that a tool list enforced was ever broken.

**Most retries were order gaps, and small ones.** A `cd` written in prose instead of `git -C` on every command. "Old" text for a replacement copied from a stale copy of the base branch. A CLI flag the installed version did not support. An acceptance criterion that measured a whole line when the limit applied to the value. A grep scoped to whole files when only added lines mattered. Every fix was a rewritten order, which is what step 6 says it should be.

**Diagnose before fixing.** Failures that looked like defects turned out to be the environment: a port already held by another daemon on the machine, a disk that filled up during an image export. In one run a failed Easy verification went to an Easy read-only evidence node, then to a Hard read-only diagnosis, and the answer was that the code was right. Nothing was changed that did not need changing.

**"Evidence, not reports" caught real things.** When a Git report looked wrong, the mister had the raw command bytes captured to files with sizes and hashes, read them, and accepted. An independent validator found a lint error after the implementers' own checks passed. Revert-sensitivity checks, where a test has to fail with the fix removed, found tests that could not fail. An IDE diagnostic that contradicted passing tests was deferred to the full suite, which showed it was stale.

**The preflight earned its place.** It caught a lockfile whose resolved URLs an install had rewritten to a mirror, generated files whose timestamps a generator had touched, protected untracked files that had to stay out of a commit, and branches that a parallel session had already created under the same names.

**Easy works when the order is verbatim.** Every verbatim edit sent to the Easy tier in this blog's own runs went through on the first attempt. A documentation node sent to Haiku with shorthand in the order came back with invented examples and a renumbered list; the retry went to Sonnet with "write only facts you can verify by reading the code named", and passed. The downgrade question is only as good as the order it produces.

**The model table ages.** Codex runs used models that `codex.md` does not list, and where no Medium model was available the node went to Hard and the order said so. `SKILL.md` never needed to change. The runtime file did.

> Lessons two to eight each have a matching change to the skill: tighter tool lists where the runtime allows them, a longer pre-dispatch checklist, diagnosis before any fix, standard evidence and preflight checks, a stricter line for Easy, and model tables that admit they age. They are in [this pull request](https://github.com/mdelapenya/coding-skills/pull/5).

## Upside Down

Everything above runs top-down. The most capable model reads the whole task, decides the tier of every node, and pushes each one down as far as the order allows. The downgrade question is asked by the model that least needs the answer.

The thought I keep coming back to is the inversion. Start every node on the cheapest model, and let that model ask whether the node should go up. A worker that reads an order and answers "this needs a design decision I do not have" is tiering from the side that knows where the order stops.

The plans hold one case for each side of that. The verbatim edits went through first time, with no orchestrator judgment needed to know they were easy. And the documentation node that came back with invented examples did it without a word of warning: a cheap model that does not know it is out of its depth does not ask to be escalated.

So the question stays open. Should the squad tier itself from the bottom up?

---

_Resources:_
- _[the-mister skill](https://github.com/mdelapenya/coding-skills/tree/a1bd5b1/skills/the-mister): `SKILL.md` and its references, at commit `a1bd5b1`_
- _[plan-and-orders.md](https://github.com/mdelapenya/coding-skills/blob/a1bd5b1/skills/the-mister/references/plan-and-orders.md): plan format, order templates, preambles_
- _[agents/](https://github.com/mdelapenya/coding-skills/tree/a1bd5b1/agents): the three shipped agent definitions_
- _[mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills): the rest of the squad_
