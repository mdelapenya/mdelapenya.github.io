---
title: "A Skill Has to Beat the Agent Without It"
date: 2026-11-26 00:00:00 +0100
description: "Reading what an agent produced with a skill does not tell you whether the skill helped. Tessl measures it: the same task with and without the skill, scored per version. Here is what that measuring changed in two of my seven skills."
categories: [Technology, Software Development]
tags: ["coding-agents", "claude-code", "skills", "tessl", "evals", "open-source"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/cover.png"
related:
  - "/posts/2026-10-25-the-mister-file-by-file"
  - "/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
  - "/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument"
translationKey: a-skill-has-to-beat-the-agent-without-it
---

![A Skill Has to Beat the Agent Without It](/images/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/cover.png)

How do you know a skill helps? You write it, you load it, the agent does the job, and the output looks right. But the agent might have done the same job without the skill. If it would have, the skill is only tokens: it costs context on every load and buys nothing.

Reading the output cannot settle that. A good review, a clean PR description or a sensible plan says nothing about what the agent would have produced on its own. The only way to know is to run the same task twice, once with the skill and once without, and score both against the same rubric.

While publishing my seven coding skills, I set myself a rule: if the agent does the job just as well without the skill, the skill is redundant. Later, the first item on my list of improvements was "we do nothing without measuring." This post is about the tool that made that rule practical, and about two skills it changed.

## Why Measure at All

I am not selling anything with these skills: what I do with them is advocacy. I want people to use them, and advocating for a skill needs evidence that it helps. "It works for me" is not evidence. A number per skill, measured the same way for everyone and published next to the skill, is.

That number also has to be honest in both directions. It has to show where a skill adds a lot, where it adds nothing, and what each costs. A skill that adds ten points at five times the price is a decision, not a win.

## What Tessl Measures

[Tessl](https://tessl.io) is a registry for agent skills, packaged as versioned plugins. The skill format is the Agent Skills standard: a `SKILL.md` with front matter, plus optional `references/`, `scripts/` and `assets/`. My seven skills went out as one plugin, `mdelapenya/coding-skills`. Four of them started as [the PR roles I wrote about in April](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe).

What makes it more than a place to download skills is that every version gets measured:

- **Review (quality).** Deterministic validation checks, plus an LLM-judged score of the description (completeness, triggers, specificity, distinctiveness) and the content (conciseness, actionability, workflow clarity, progressive disclosure).
- **Evals (impact).** An eval scenario is a small job for the agent. It has a prompt that describes the work (`task.md`), the files to work on, and a rubric of weighted criteria (`criteria.json`), all under `evals/<scenario>/` in the repository. `tessl eval run` gives each scenario to the agent twice, with and without the plugin, and a judge scores both answers against the rubric. The gap between the two scores, the lift, is the skill's impact.
- **Security.** A scan that passes or fails each skill and lists findings.

The registry page shows all three per version, and combines quality and impact into an overall score. That combination matters. I first published 1.2.3 without running its evals (`--skip-evals`), and its overall score dropped to 77, against 97 for 1.2.2. Its quality had gone up. A version without evals has no measured impact, and the registry does not pretend otherwise. Running the evals against the published 1.2.3 filled it in.

Publishing is free, and reviews cost no credits for public plugins. That made one more thing possible: a CI gate in the skills repository. Every PR that touches `skills/` runs `tessl review run --threshold 90` on the changed skills, and fails if one drops below 90.

## Measuring Well Takes Care

The first eval run looked fine on average: the plugin raised the score by about 27 points. The per-scenario table told a different story. In three scenarios, the agent without the plugin already scored 100%: two for pr-reviewer and one for ci-detective.

The problem was in the prompts. The `task.md` of each scenario is the text the agent receives as its job, and those prompts dictated what the skill was supposed to contribute, such as the exact headings of the review report or the shape of the comparison table. An agent told all of that does not need the skill.

I rewrote the prompts the way a user would ask ("review PR #847 before merging", "did my PR break CI?"), and moved the skill's distinctive behaviour into the rubric. The agent without the skill stopped getting full marks, and the lift appeared:

| Scenario | Skill | Agent alone, original prompt | Agent alone, rewritten prompt | Agent with skill, rewritten prompt |
|---|---|---|---|---|
| 2 · review pinned to a revision | pr-reviewer | 100% | 35% | 94% |
| 3 · adversarial review | pr-reviewer | 100% | 75% | 100% |
| 5 · did my PR break CI? | ci-detective | 100% | 65% | 100% |

The judges are also noisy. The same scenario without the skill scored 49 in one run and 35 in another, with identical inputs. After that, differences under about 10 points counted as noise, and every measurement that drove a decision ran three times.

Neither lesson is about Tessl being wrong. They are about what any measurement needs: prompts that leave room for the skill to matter, and enough runs to tell a change from noise. Tessl generates and runs the scenarios; deciding whether they measure the right thing stays with the author.

## the-mister: A Low Score Found a Deadlock

The plan-writing scenario for [the-mister](/posts/2026-10-25-the-mister-file-by-file) scored 65% with the skill. Some of the criteria where it lost points contradicted the skill, so the tempting move was to fix the rubric. But changing a rubric after seeing the results looks a lot like fitting the exam to the answer. Instead, I proposed challenging all three parts: "the skill can be wrong, the criteria are wrong, the answer is wrong."

An independent reviewer went through every criterion against the skill, the prompt and the plan. All three had problems. Four of the twelve criteria were wrong. The answer had defects no criterion caught. And the skill had a real deadlock:

- "A node is ready when every dependency is `done`."
- "Append a `done` line only after the required inspection passes."

In the-mister, an inspector checks a worker's result before the node counts as done. So the inspector depends on its build node, and the build node waits for the inspector. Under those two rules, the inspector could never run.

The fixes went into the-mister 2.6.0 and into the rubric, and the rerun went from 65% to 86% with the skill. The points it still lost were real faults in the answer.

It took a low eval score to surface the deadlock, and checking only the rubric would have hidden it.

## pr-reviewer: The Lift Had a Price

pr-reviewer had one of the largest lifts and the highest cost by far: four to nine times what the agent alone cost. The per-scenario analysis showed where the lift came from. Without the skill, the agent found the bugs on its own, including a SQL injection and a path traversal. Most of what the skill added was the shape of the report. Nothing in the scores showed that three reviewers plus an assessor found more than one reviewer.

So I added a scenario to test exactly that: a subtle bug plus a false-positive trap, run in each mode, three runs each.

| Mode | Score | Cost per run |
|---|---|---|
| Three reviewers (staged) | 91–94 | about $7.50 |
| One reviewer (`--single`) | 90–92 | $1.80 |
| No skill | 90–91 | $1.40 |

With that table in front of me, I made `--single` the default. Three reviewers and the assessor now run only when the skill classifies the diff as consequential, or when you ask for them with `--staged`. A routine-diff scenario priced the change: the default mode cost less than half (<span>$2.34</span> against <span>$4.97</span>, three runs each) for about 4 points less (91 against 95).

The report format, where most of the lift came from, exists in single mode too. The fan-out stays where the risk justifies it.

## Where It Stands

Version 1.2.3 is the one on the registry now:

| Version | Overall | Quality | Impact | Security |
|---|---|---|---|---|
| 1.2.2 | 97 | 95% | 98% (10 scenarios) | Low |
| 1.2.3 | 96 | 97% | 96% (16 scenarios, 1.52x the agent alone) | Low |

The evaluated agent is `claude` running the model `deepseek-v4.1-flash`, not a model the skills are tuned for. Treat these numbers as evidence of what each skill adds, not as a benchmark of any model. The 1.2.3 run scored each scenario once with the skill and once without, and repeated runs moved single scores by up to about 10 points.

Two results are worth reading with care. In the subtle-bug scenarios, pr-reviewer stays within the noise of the agent alone, which is the finding behind single mode. And the-mister's acceptance-and-recovery scenario is the weakest one, at 73 with the skill. The registry shows that too, next to the good numbers.

## The Skills Section

Measuring left me with more than a score per version: what each skill adds, where it adds nothing, and what it costs. That evidence now has a home on this site, next to the posts that explain why each skill exists. The [Skills section](/skills/) has one page per skill with its evidence, for example [pr-reviewer](/skills/pr-reviewer/) and [the-mister](/skills/the-mister/).

To install all seven, use either channel:

```bash
# skills.sh (Claude Code, Codex, Cursor, Copilot, Gemini CLI and more)
npx skills add mdelapenya/coding-skills

# Tessl registry
tessl install mdelapenya/coding-skills
```

Neither installs the-mister's subagent definitions; the [README](https://github.com/mdelapenya/coding-skills) explains how to link them.

Five asks:

1. **Use them** on your own PRs and plans, and tell me where they get in the way.
2. **Open an [issue](https://github.com/mdelapenya/coding-skills/issues)** when a skill misbehaves, with the task you gave it.
3. **Contribute an eval scenario.** The scenarios live in [`evals/`](https://github.com/mdelapenya/coding-skills/tree/main/evals), each one a `task.md`, its inputs and a weighted `criteria.json`. Write the prompt the way you would ask for the work, and put what the skill should add in the rubric.
4. **Star the [repository](https://github.com/mdelapenya/coding-skills)** if the skills are useful to you.
5. **[Subscribe](/subscribe/)** to the blog if you want the next post.

---

_Resources:_
- _[mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills): the seven skills and their eval scenarios_
- _[mdelapenya/coding-skills on the Tessl registry](https://tessl.io/registry/mdelapenya/coding-skills): quality, impact and security per version_
- _[mdelapenya/coding-skills on skills.sh](https://skills.sh/mdelapenya/coding-skills)_
- _[Skills on this site](/skills/): one page per skill, with its evidence_
