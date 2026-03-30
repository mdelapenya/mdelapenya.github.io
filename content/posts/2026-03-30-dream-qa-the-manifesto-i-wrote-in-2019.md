---
title: "Dream QA: The Manifesto I Wrote in 2019"
date: 2026-03-30 09:00:00 +0100
description: "In 2019 I wrote a quality manifesto for my team. It redefined QA as Quality Assistance, not Assurance. Seven years later, the ideas hold up better than I expected."
categories: [Technology, Software Development]
tags: ["testing", "quality", "manifesto", "team-culture"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019/cover.png"
related:
  - "/posts/2026-04-01-quality-assurance-vs-quality-assistance"
  - "/posts/2026-02-26-spec-driven-development-bdd-agents"
  - "/posts/2026-03-11-coding-agents-as-exploratory-testers"
---

![Dream QA: The Manifesto I Wrote in 2019](/images/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019/cover.png)

In 2019 I was QA Team Lead at [Liferay Cloud](https://www.liferay.com/platform). I wrote a manifesto for my team that redefined what we meant by QA. I gave two talks about it under the title "Dream QA": the first at EURODOG (European DevOps Group) in Madrid, and the second at JCCM (Junta de Comunidades de Castilla-La Mancha, the government of the region where I live in Spain). It wasn't a process document. It was a philosophy for how a team should think about quality, who owns it, and what a QA team actually does when it's doing its job well.

I'm sharing it now because the ideas turned out to be more relevant than I expected. Not because I was prescient, but because the problems the manifesto addressed haven't gone away. If anything, they've gotten sharper. The next post will explore what happened when AI arrived. But first, the original manifesto, in its own voice.

## Quality Assistance, Not Assurance

The name matters. Quality Assurance implies a gate at the end of the process. Something gets built, then someone checks whether it's good enough. That model is broken. It makes quality someone else's problem.

We are here to assist any other team in a proactive manner in achieving two main objectives: a quality standard in the products we build, and a quality standard in the processes to build those products.

That's a different posture. We don't sit at the end of the pipeline waiting for something to land on our desk. The cross-functional QA process runs alongside the Dev process, not at the end of it. We participate from design through deployment. We pair with developers. We review specifications before the first line of code is written.

The ultimate goal is for the QA process and the Development process to become one and the same. No separate phase, no separate team working in isolation. One process, one team, shared responsibility. Everybody owns the quality of their own work, and creating the process that makes this possible is a shared responsibility too.

## Three Pillars: Products, Processes, Persons

The manifesto is built on three pillars. Everything we do falls under one of them.

**Products.** Define specific quality gates for any individual project. What does "good enough to ship" mean for this particular product? Not in abstract terms, but in concrete, measurable criteria. Every product has different risk profiles, different user expectations, different tolerance for defects. The quality gates reflect that.

**Processes.** Pay attention to all tasks needed to design, implement, verify, release, deploy and operate. Quality is not just about the code. It's about how that code gets from an idea to a running system. How do we branch? How do we review? How do we release? How do we monitor? Every step in that chain is an opportunity to introduce or prevent defects.

**Persons.** Look for the right skills, promoting responsibility and ownership. A quality culture doesn't emerge from tools or processes alone. It comes from people who care about their craft, who take ownership of what they ship, and who actively seek to improve how they work. Hire for that. Train for that. Reward that.

## The QA Manifesto

The [Agile Manifesto](https://agilemanifesto.org/) shaped how I think about trade-offs. Its format is brilliant: it doesn't reject one side, it declares a preference. "We value X over Y" doesn't mean Y is worthless. It means when you have to choose, lean toward X. I borrowed that structure for this QA manifesto.

The following statements summarise the goals and definitions above. The first part of each sentence is preferable over the second part. This does not mean that the second part is not desirable at all: we see value in it, but when possible, we would prefer having the first one.

### 1. Unit or integration tests over functional (UI) tests

UI tests are extremely slow and difficult to maintain. They're usually maintained by the QA team, which is an error. The addition of one UI test adds minutes to the build. It does not scale. Push testing as far down the pyramid as possible. Unit and integration tests run in seconds, provide fast feedback, and can be maintained by the developers who write the code.

### 2. BDD style for writing tests over internal documentation

Gherkin is a high-level language to describe how software should work. Given/When/Then. It bridges the gap between what the product manager expects and what the developer implements. Involve product managers in writing test scenarios using plain English. When the scenarios are executable, the documentation is always up to date. Internal documentation rots. [Executable specifications](/posts/2026-02-26-spec-driven-development-bdd-agents) don't.

### 3. Developers who write tests over traditional testers who test

In the past, traditional testers did manual testing in a repeated manner. That's a waste of skilled people doing repetitive work. Empower developers with the ability of writing and maintaining functional tests. Then they're responsible for having them green. When the person who writes the code also writes the tests, the feedback loop is as short as it can possibly be.

### 4. Testers who code over traditional testers who write tests

We want testers to participate in coding a feature, from design to implementation. Not just writing test scripts. A tester who understands the code can spot architectural risks, suggest testable designs, and contribute fixes. The line between developer and tester blurs on purpose.

### 5. Exploratory testing over automating all possible scenarios

How many scenarios are there in a feature? Infinite. In terms of possible paths and values, the combination is unbounded. Automate the critical paths and perform exploratory testing over the rest. Exploratory Testing is a learning process with the goal of becoming a domain expert. You explore the product, you learn its boundaries, you discover what the specification didn't cover. From that experience, we can decide to automate a specific new path discovered during exploration.

### 6. Local verification over online inspection

Code is sent via pull requests. Reviewing PRs online is cool, but not ideal. You see diffs. You read code. But you don't run it. Download the code, locally verify its behavior in a running instance, then continue or rollback. A running system tells you things that a diff never will.

### 7. Feature coverage over code coverage

Code coverage is a trap. Tests that execute 100% of the code but without any assertion give you 100% coverage but zero confidence. That number tells you how much code was exercised, not how much behavior was verified. Feature coverage is achieved in combination with BDD-style scenarios. We can decide whether to release based on thresholds around feature coverage: are the critical user journeys verified?

### 8. Confirming requirements aren't broken over confirming the happy path

Code without tests is broken by default. If it works, it works just for the happy path, or it works by chance. It's important to demonstrate that the feature is not broken, not just that it works when everything goes right. Test the boundaries. Test the error cases. Test what happens when the user does something unexpected. That's where the real bugs live.

## The QA Team's Role

So what does the team actually do under this model?

We develop deep product knowledge. We can discern between a bug or a feature. That sounds like a joke, but it's one of the most valuable things a QA team provides. We are the reference for how the product is expected to work, the living memory of every decision, every trade-off, every edge case.

We participate across all lifecycle phases: design, implementation, verification, release, deployment, operations. Not just the testing phase. We're in the room when features are designed because we know what's going to be hard to test, what's going to break, and what the user is actually going to do.

We are not responsible for having 100% of the test suite passing. That responsibility belongs to the team. Our job is finding uncovered features, increasing coverage, and raising confidence. When the test suite fails, we have the authority to raise a hand to stop machines. The build is red. Nobody merges until it's green.

We participate in the Definition of Done as first-class citizens. Done means tested. Done means documented through tests. Done means releasable.

We do root cause analysis. When something fails, we reproduce the failure, point to the culprit commit, and send fixes or detailed reports. Not just "it's broken." Here's why it's broken, here's when it broke, here's the commit that introduced it.

Tests are documentation. They represent the most valid, live documentation of the product. They are versioned alongside production code, creating live specifications that evolve with the system. When someone asks "how does this feature work?", the answer is in the test suite.

## Automation Is a Tool, Not a Goal

Quality does not mean automating test cases. Automation is not a goal, it's a tool. The scenarios are infinite in terms of possible paths and values. Automating everything is not possible, not economical, and not even desirable.

Let's cover the most critical features for the user with automation. Identify with Product Management the critical scenarios, the ones that, if broken, mean the product is unusable. Run those critical tests in pull requests to reduce build time and catch regressions early. Add manual and exploratory testing to cover the rest.

A bug found in production is super expensive in time and money. Let's try to break the feature the soonest. The earlier you find a defect, the cheaper it is to fix. This is not a new insight, but it's one that teams forget the moment they're under deadline pressure.

And quality does not simply mean writing tests either. It also means: dependencies management, versioning properly (for example using [SemVer](https://semver.org/)), branching strategy, release management, metrics, open collaboration with other teams, spreading knowledge. Quality is a property of the entire system, the code, the process, and the people.

## Best Practices

**Involve Product Managers in writing test scenarios.** Use BDD. Use Gherkin. Use Given/When/Then. When Product Managers write scenarios, they clarify their own requirements. When those scenarios are executable, the team has a shared, unambiguous definition of expected behavior.

**Pair review is mandatory.** Pull requests are required. No direct merges to master. Every change gets a second pair of eyes. Not as a bureaucratic overhead, but as a quality mechanism that catches mistakes, shares knowledge, and improves the codebase over time.

**Quality gate pipelines.** Every commit triggers: compile, unit tests, artifact generation, notifications. If any step fails, the pipeline stops. The team is notified. Quality is enforced automatically, not by willpower.

**Releasability thresholds.** Product Management defines the lower bound of acceptable quality. The product team defines the upper bound they aim for. The range between them is the tolerance. If quality drops below the lower bound, we don't ship. Clear, measurable, non-negotiable.

**Metrics.** Track what matters: Release Test Failures (RTF), escaped defects, defect categories, cycle time. Numbers don't lie. They show trends, highlight problem areas, and give the team data to improve with. Gut feeling is not a quality strategy.

**Release trains.** Before continuous delivery, be predictable about releases. Establish a cadence. Reduce unplanned work. A predictable release schedule forces the team to scope properly, test early, and make hard decisions about what goes in and what doesn't. Predictability is a prerequisite for reliability.

## Seven Years Later: These Practices Meet Agentic Development

I wrote this manifesto in 2019, before coding agents existed. Before AI could write tests, review pull requests, or explore a product looking for bugs. Now that agentic development is here, it's worth asking: do these best practices still hold? The answer surprised me. They don't just hold, they become more important.

**BDD with Product Managers.** When the manifesto called for PMs to write test scenarios in Gherkin, the bottleneck was translation: turning business requirements into executable specs. Agents collapse that gap. A PM can describe a scenario in plain English and an agent can generate the Given/When/Then. The practice scales in ways that weren't possible when every scenario required manual authoring.

**Pair review.** The manifesto required a second pair of eyes on every pull request. In agentic development, the pair evolves: agents review human code, humans review agent code. The principle is identical (no change goes unchecked), but the throughput increases dramatically. The human reviewer can focus on intent and design while the agent catches mechanical issues.

**Quality gate pipelines.** Agents accelerate development. Code gets written faster, PRs arrive more frequently, and the temptation to merge quickly grows. This makes automated quality gates more critical, not less. Every commit still triggers compile, test, artifact generation, and notification. The pipeline is the safety net that lets teams move fast without breaking things, and agents make the "moving fast" part much faster.

**Releasability thresholds.** Agents can assess feature coverage dynamically, reasoning about whether the critical user journeys are verified instead of relying on a static code coverage number. The threshold concept stays, but the measurement gets smarter. An agent that understands the product can tell you "this feature is 80% covered by BDD scenarios" in a way that a coverage tool never could.

**Metrics.** Agents excel at analyzing trends across releases, predicting defect-prone areas based on code churn and test coverage patterns, and surfacing the numbers that matter. The manifesto said "gut feeling is not a quality strategy." Agents make data-driven quality decisions practical at a scale that manual tracking never achieved.

**Release trains.** Predictable cadence still matters in agentic development. What changes is the pace: agents produce code so fast that an emerging fix-forward culture takes hold. Merges to main happen more frequently. Some teams are questioning whether pull requests even make sense anymore when agents can produce, test, and merge code in minutes. If PRs disappear, the quality gates become the only thing standing between a commit and production. The release train doesn't disappear, but the gates along the track become even more important when the train runs at higher speed.

---

_Resources:_
- _[Dream QA slides, GDG Toledo](/slides/2019-02-28-gdg-toledo-dream-qa/Dream-QA-JCCM.pdf)_
- _[Dream QA slides, EURODOG Madrid](/slides/2019-03-07-eurodog-madrid/Dream-QA-EURODOG.pdf)_
