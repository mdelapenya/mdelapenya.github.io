---
title: "Quality Assurance vs Quality Assistance"
date: 2026-04-01 09:00:00 +0100
description: "QA has always meant Quality Assurance — tests pass or fail, builds are green or red. AI agents add a second meaning: Quality Assistance. The shift from gatekeeper to guide doesn't replace tests. It adds judgment."
categories: [Technology, AI, Software Development]
tags: ["testing", "coding-agents", "quality", "developer-experience"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-04-01-quality-assurance-vs-quality-assistance/cover.png"
related:
  - "/posts/2026-03-11-coding-agents-as-exploratory-testers"
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
  - "/posts/2026-02-24-coding-with-agents-like-tesla-autopilot"
  - "/posts/2026-02-26-spec-driven-development-bdd-agents"
---

![Quality Assurance vs Quality Assistance](/images/posts/2026-04-01-quality-assurance-vs-quality-assistance/cover.png)

QA has always meant one thing. Now it means two.

I spent years building Testcontainers, a library whose entire purpose is deterministic integration tests. Set up a real database in a container, run your assertions, tear it down. Pass or fail. Green or red. That's Quality Assurance: the gate model. It works when you control the volume of code flowing through the gate.

Then I built an [exploratory tester skill](/posts/2026-03-11-coding-agents-as-exploratory-testers) that turns a coding agent into something different. It doesn't assert. It explores. It doesn't pass or fail. It surfaces findings, ranks them by severity, and lets me decide what matters. That's Quality Assistance. Same acronym, different job.

The shift from one to the other isn't a replacement. It's a stack.

## QA Has Always Meant One Thing

Quality Assurance is the gate. Tests assert expected behavior. CI enforces it. The pipeline stops if something fails. You write a test that says "this endpoint returns 200 with a valid token." If it doesn't, the build breaks. Nobody merges.

This model has served us well for decades. It's the foundation of every serious software team. And it rests on a principle I wrote into a [QA manifesto back in 2019](/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019), when I gave a talk called "Dream QA" at JCCM: a bug found in production is expensive. Catch it earlier and it costs less. Catch it at the gate and it costs almost nothing.

The gate works when humans write all the code and the volume is manageable. One developer, one PR, one review cycle. The gate has time to do its job.

## The Volume Problem

At [Level 5](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer), four agents push code in parallel. Each push needs review. Each review needs context. Each branch needs CI. The gate doesn't get slower, but the queue in front of it gets longer, fast.

Traditional assurance assumes a human can review every change with care. When four agents are pushing PRs before lunch, that assumption breaks. Not because the tests stop working, but because the tests only cover what someone thought to write. And when the code is flowing faster than humans can think of assertions, the gaps between the tests grow wider.

This is the pressure point. Not that assurance fails. That assurance can't scale its coverage to match the throughput. You test what you thought of. You miss what you didn't.

## Assistance: The Second Meaning of QA

Quality Assistance. The agent doesn't gate. It guides.

The exploratory tester skill I built surfaces issues, ranks severity, suggests root causes, and lets me decide. It doesn't stop the build. It doesn't block the merge. It tells me what it found and asks what I want to do about it.

This isn't a new idea. In that Dream QA talk, the [manifesto I presented](/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019) defined it explicitly: "This document defines Quality and 'Quality Assistance' (not Assurance) for a development organization." The core principle was: "We are here to assist any other team in a proactive manner in achieving two main objectives." The cross-functional QA process runs alongside the dev process, not at the end of it.

The terminology was prescient. In 2019, I was describing a human role: QA engineers embedded in teams, guiding rather than gatekeeping. The technology to scale that guidance beyond human bandwidth didn't exist yet. Now it does. An agent that reads your codebase, exercises your software, surfaces what it finds, and ranks it by how much it matters is doing exactly what that manifesto described. It just doesn't need a desk.

## From Testcontainers to the Exploratory Tester

The personal arc here is what makes this real for me.

Testcontainers is pure assurance. You spin up a real Postgres container, run your queries, assert the results, tear it down. Deterministic. Repeatable. Pass or fail. I helped build that because I believe tests should run against real dependencies, not mocks. That belief hasn't changed.

The [exploratory tester](/posts/2026-03-11-coding-agents-as-exploratory-testers) is pure assistance. It exercises the software, adapts when something unexpected happens, forms opinions about severity, and hands me a triage table. Adaptive. Judgment-based. Severity-ranked. No pass/fail binary.

I built both. And the bridge between them was always there, in [manifesto principle number five](/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019#5-exploratory-testing-over-automating-all-possible-scenarios): "Exploratory testing over automating all possible scenarios." I wrote that in 2019 because I believed you can't automate your way to complete coverage. Some bugs only surface when a tester goes off-script, tries the weird input, clicks the button twice, runs the command in an order nobody designed for.

I always believed in exploration. Now an agent does the exploring.

## The Stack, Not the Replacement

Assurance without assistance is blind spots. You test what you thought of. You miss what you didn't. Your test suite is comprehensive for the known scenarios and silent about the unknown ones.

Assistance without assurance is opinions without evidence. The agent found something suspicious, but can you reproduce it? Is it a real bug or an environmental quirk? Without a deterministic test to confirm the finding, you're trusting the agent's judgment without a safety net.

The right answer is both. Assurance as the foundation. Assistance as the layer on top.

Tests catch known regressions. Agents find unknown ones. The Testcontainers suite tells you that the database migration still works. The exploratory tester tells you that the CLI crashes when you pass a Unicode character in the project name, something nobody thought to write a test for.

When the agent finds something real, it becomes a test. The assistance finding graduates to an assurance assertion. The stack grows. The blind spots shrink. That's the cycle.

## What Changes for the QA Role

The [Dream QA manifesto](/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019) said: "Testers who code over traditional testers who write tests." That was principle number four. It meant QA professionals should be engineers, not manual script runners. The value was in judgment and code, not in clicking through test plans.

The AI era adds a layer: testers who supervise agents over testers who run scripts.

It's the same shift I described in the [Tesla autopilot post](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot), but applied to quality. The developer's job shifted from writing code to supervising agents that write code. The QA professional's job shifts from running tests to supervising agents that test.

QA professionals become the ones who define what the agent explores. They write the [skills](/posts/2026-03-25-skills-are-roles-not-commands), the test plans, the troubleshooting guides. They triage what the agent finds. They decide what becomes an automated test and what gets filed as an issue. The role is still judgment. The executor is now an agent.

[Manifesto principle three](/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019#3-developers-who-write-tests-over-traditional-testers-who-test) said: "Developers who write tests over traditional testers who test." The update: developers who define testing roles for agents, over developers who write individual test cases. The test case is still valuable. But the role definition scales further.

## The Two Meanings, Together

QA has always meant Quality Assurance. In the AI era, it also means Quality Assistance. The gate doesn't go away. The guide sits next to it.

Tests pass or fail. Agents explore and triage. The build is green or red. The findings are ranked by severity. One is deterministic. The other is judgment. You need both.

The shift isn't a replacement. It's an addition.

---

_Resources:_
- _[Dream QA slides, GDG Toledo](/slides/2019-02-28-gdg-toledo-dream-qa/Dream-QA-JCCM.pdf) (PDF)_
- _[Dream QA: The Manifesto I Wrote in 2019](/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019), the eight principles in full_
- _[Testcontainers](https://testcontainers.com/) — deterministic integration tests with real dependencies_
