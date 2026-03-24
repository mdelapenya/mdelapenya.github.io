---
title: "Skills Are Roles, Not Commands"
date: 2026-03-25 09:00:00 +0100
description: "A command says 'run deploy.' A skill says 'you are the deployment engineer.' That distinction changes how you design them."
categories: [Technology, AI, Software Development]
tags: ["claude-code", "coding-agents", "skills", "developer-experience"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-25-skills-are-roles-not-commands/cover.png"
related:
  - "/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day"
  - "/posts/2026-03-11-coding-agents-as-exploratory-testers"
  - "/posts/2026-02-26-spec-driven-development-bdd-agents"
---

![Skills Are Roles, Not Commands](/images/posts/2026-03-25-skills-are-roles-not-commands/cover.png)

I kept calling them commands. `/blog-editor`, `/deploy`, `/fix-issue`. Imperative verbs. Do this thing. But the more I used them, the more I realized the mental model was wrong. A skill isn't a command. It's a role.

A command says "run deploy." A skill says "you are the deployment engineer. Here's your process, your constraints, and your tools." One executes a procedure. The other inhabits a persona.

That distinction changes how you write them, how the agent uses them, and how they compose with each other.

## Commands Are Verbs, Skills Are Personas

When you think of `/deploy` as a command, you write it like a script: step 1, step 2, step 3, done. The agent follows instructions. If something unexpected happens, the instructions don't cover it, and the agent improvises with no guidance.

When you think of `/deploy` as a role, you write it differently. You describe *who* the deployment engineer is: what they know, what they're allowed to do, how they handle failures, what they check before and after. The agent doesn't just follow steps. It makes decisions the way that role would.

The difference shows up when things go wrong. A command-style skill says "run the tests, then push." What if the tests fail? The instructions don't say. A role-style skill says "you are the deployment engineer. You run the tests. If they fail, you diagnose the failure, decide whether it's a flaky test or a real issue, and act accordingly." The role carries judgment. The command doesn't.

## The Mapping

Every feature in a [SKILL.md](https://code.claude.com/docs/en/skills) file maps to a property of a role:

**`description`**: when this role is needed. Claude reads descriptions to decide which role to step into. "Review and edit existing blog posts, enforcing front matter conventions, tone, structure, and conciseness" isn't a command description. It's a job description.

**`allowed-tools`**: what this role is authorized to do. The blog-keeper can read files and fetch URLs but can't edit anything. That's not a tool restriction. It's a scope of responsibility. An auditor doesn't make changes. They report findings.

**`disable-model-invocation: true`**: a role that only activates when explicitly called on. The deployment engineer doesn't walk into the room uninvited. You summon them when it's time to deploy.

**`user-invocable: false`**: background knowledge the role carries without being an action. API conventions, coding standards, domain context. These aren't things you "run." They're things the agent *knows* when it's in the right role.

**Supporting files**: the role's playbooks and reference material. The [blog-writer's front matter template](https://github.com/mdelapenya/blog-skills), the blog-planner's topic map, the blog-marketer's platform guide. A role doesn't memorize everything. It knows where to look.

## Three Roles I Use Daily

**The editor** (`blog-editor`) reviews my posts for tone, structure, and conciseness. It runs a [checklist](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day): front matter compliance, section density, redundancy, em dash usage, cross-references. When it's done, it calls the keeper for link validation. The editor doesn't just check boxes. It proposes fixes. It asks me when a restructure needs my judgment. It's a reviewer with opinions.

**The build specialist** (`build-engineer`) knows how to compile binaries, set up PATH, handle authentication bypasses, and cross-build for different platforms. The [exploratory tester](/posts/2026-03-11-coding-agents-as-exploratory-testers) doesn't contain build instructions. It delegates to the build specialist. "I need a binary with auth disabled for testing." The specialist handles the rest. That's not a command being called. That's a colleague being consulted.

**The project manager** (`project-manager`) triages test findings. It compiles a summary table, deduplicates against existing GitHub issues, assigns severity, and walks me through each issue one at a time. It doesn't fix anything. Fixing is someone else's role. The project manager coordinates.

Each one is a persona with a scope of responsibility, a set of tools, and a way of thinking. Not a script with steps.

## Why This Changes How You Write Skills

When you think "command," the skill reads like a recipe. When you think "role," the skill reads like an onboarding document for a new team member: what you know, what you're allowed to do, how you handle ambiguity, when you should ask for help.

The practical difference shows up at the edges. The [exploratory tester](/posts/2026-03-11-coding-agents-as-exploratory-testers) hits a socket path limit on macOS. A command-style skill would fail. The role-style skill reads its troubleshooting guide, understands the root cause, retries with a shorter path, and moves on. That's not following instructions. That's inhabiting a role.

Next time you write a skill, don't ask "what should this command do?" Ask "who is this person, and how do they work?"

---

_Resources:_
- _[Claude Code Skills documentation](https://code.claude.com/docs/en/skills)_
- _[blog-skills repo](https://github.com/mdelapenya/blog-skills)_
