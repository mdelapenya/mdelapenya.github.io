---
title: "The Seventh Tip: Testing Is What Makes Swarming Safe"
date: 2026-04-03 09:00:00 +0100
description: "Steve Yegge published six tips for coding with agents. They're all right. But he missed one: testing. Without it, swarming is just fast chaos."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "testing", "testcontainers", "quality", "developer-experience"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-04-03-the-seventh-tip-testing-is-what-makes-swarming-safe/cover.png"
related:
  - "/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module"
  - "/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer"
  - "/posts/2026-04-01-quality-assurance-vs-quality-assistance"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

![The Seventh Tip: Testing Is What Makes Swarming Safe](/images/posts/2026-04-03-the-seventh-tip-testing-is-what-makes-swarming-safe/cover.png)

Steve Yegge and Gene Kim published [six tips for coding with agents](https://steve-yegge.medium.com/six-new-tips-for-better-coding-with-agents-d4e9c86e42a9) while in Sydney for Vibe Coding workshops. The tips are excellent. Every one of them maps to something I have experienced building this blog, its infrastructure, and the tools around it. I agree with all six.

But there is a seventh tip missing. Yegge describes how to review agent work (the Rule of Five) and how to manage parallel agent work (the Merge Wall). Neither addresses the question that comes after: how do you know the merged result actually works?

The answer is testing. Without it, swarming is just fast chaos.

## Steve's Six Tips

Here is the short version. Yegge argues that 2026 is the Year of the Super-Engineer. Engineers running 50 to 100 agents at once. Solo developers building entire company software. His six tips are the operating manual for that world:

1. Software is throwaway.
2. Agent UX matters as much as human UX.
3. Spend 40% on code health.
4. Some projects are ahead of their time.
5. The Rule of Five: have the agent review its work five times.
6. Swarm where you can, but beware the Merge Wall.

Each one is right. Here is how each maps to work I have done on this blog, followed by the tip he did not include.

## Tip 1: Software Is Throwaway

Yegge's point: software has a shelf life of less than a year. Rewriting beats fixing. The cost of starting over dropped to near zero when agents learned to write code, so the calculus changed. Hold software loosely.

I have lived this. When I built the [subscribe feature](/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module), I merged three separate posts about the journey into one without hesitation. I rewrote the Cloudflare Worker, the Hugo template, and the Playwright tests from scratch. I built [testcontainers-go-resend](https://github.com/mdelapenya/testcontainers-go-resend/) in a single session. Everything is disposable. The value is in the design decisions and the tests that encode them, not in the lines of code.

## Tip 2: Agent UX Matters

Yegge's point: it is hard to get agents to use your tools correctly. Watch how they fail, add aliases, iterate on the interface. Agent UX is a design discipline now.

I wrote an [entire post about this](/posts/2026-03-25-skills-are-roles-not-commands). Skills are personas with context, not scripts with steps. Ralph's worker/reviewer split works because each role has clear responsibilities, clear constraints, and clear judgment criteria. Blog-keeper, blog-editor, blog-planner compose without extra prompting because each one knows who it is and what it is allowed to do. That is UX for agents. Not buttons and menus. Roles and boundaries.

## Tip 3: 40% on Code Health

Yegge's point: spend 30 to 40 percent of your time on agent-driven code reviews. Find code smells. File issues. Refactor weekly. Code health is not a nice-to-have when agents are writing most of the code. It is the only thing keeping the codebase navigable.

I did a full security audit of the subscribe Worker mid-session. Added Turnstile verification, input validation, rate limiting, and security headers. Blog-keeper audits all cross-references on every edit pass. Tests run on every push. The 40% number feels about right. If anything, I spend more. When agents write code fast, the review surface grows proportionally.

## Tip 4: Some Projects Are Too Early

Yegge's point: AI cognition degrades at boundaries. Some projects need smarter models than what exists today. Keep a "too hard" backlog and wait a few releases.

In the [agentic coding stack post](/posts/2026-03-20-my-agentic-coding-stack), I described Level 6 as "not here yet." Then I [built Ralph](/posts/2026-03-27-from-loop-to-ci-ralph-and-the-level-6-pattern), which is Level 6. The models got smarter between when I wrote the stack post and when I built Ralph. The backlog item graduated. Yegge is right that timing matters. The trick is to plan for the graduation, not just accept the delay.

## Tip 5: The Rule of Five

Yegge's point: have the agent review its own work five times, alternating between detailed line-by-line reviews and architectural reviews, until the output converges. Five passes is usually enough to reach stability.

Ralph's core loop is literally this. The worker writes, the reviewer evaluates, the verdict is REVISE or SHIP, and the cycle repeats up to five times. Blog-planner interviews for two or three rounds before handing off a skeleton. Blog-editor runs a checklist that covers front matter, structure, tone, redundancy, and cross-references. Blog-keeper validates links and dates. Convergence is built into every skill I use. Five is the right number. More than that and the agent is going in circles. Fewer and you are shipping first drafts.

## Tip 6: Swarm + Merge Wall

Yegge's point: swarming is powerful but merging is a nightmare. Workers collide. Two features that modify the same config file cannot run in parallel. Serialization is needed, and the reduce step in the MapReduce analogy is arbitrarily complex.

The [Level 5 post](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer) is a field report on this exact problem. Four agents, four worktrees, merge ordering decisions. The same failure modes Yegge describes: interdependent tasks that should have been sequenced, agents that go in circles when merges create unexpected conflicts, the overhead of deciding which PR lands first. "Two features that modify the same config file can't run in parallel." I wrote that sentence weeks before reading Yegge's post. The problem is universal.

## The Missing Tip: Testing

Yegge describes review (the Rule of Five) and merge (the Merge Wall). Neither addresses verification against reality.

Reviews catch design issues. A reviewer can spot a bad abstraction, a missing edge case, a naming inconsistency. Five review passes will converge on a clean design. But reviews happen in the abstract. The reviewer reads code. It does not run code.

Tests catch runtime issues. A test can tell you that the API returns a 500 when the payload is missing a required field. That the database migration fails on Postgres 15 but passes on 16. That the Worker rejects emails with plus signs even though RFC 5322 allows them. Tests run code against real dependencies and report what actually happens.

Without testing, you are trusting agents to be right after convergence, with no verification against the real world. The Rule of Five gives you confidence that the design is sound. Tests give you confidence that the implementation works. These are different kinds of confidence, and you need both.

## Contract Testing, Not Mock Testing

Hand-rolled mocks drift from the real API. You write a stub that returns the response you expect. Six months later, the API adds a required field to the request payload. Your stub does not know about it. Your tests pass. Production breaks.

The Rule of Five will not help you here. An agent can review the mock five times and conclude it looks correct, because the mock is internally consistent. The problem is that the mock no longer matches reality. You need a different source of truth.

Contract testing against real API specs solves this. [Microcks](https://microcks.io/) reads an OpenAPI spec and serves a mock API that returns the spec's example responses. When the spec changes, the mock changes. When the mock changes, your tests catch the delta.

I built [testcontainers-go-resend](https://github.com/mdelapenya/testcontainers-go-resend/) because I wanted to test real Resend integration, not my assumptions about it. The module downloads the latest Resend OpenAPI spec, enriches it with Microcks-compatible examples, and loads it into a [Testcontainers](https://golang.testcontainers.org/) container. Two lines to start. One line to get the base URL. Every endpoint in the Resend API gets a mock that stays in sync with the spec. The [subscriptions post](/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module) tells the full story.

The pattern generalizes. Any API with a public OpenAPI spec can be tested this way. Stripe, SendGrid, Twilio. The spec is the contract. The mock enforces the contract. Your tests verify your code against the contract. No drift. No surprises on Sunday evening when the broadcast cron job fails because Resend changed a response shape.

## Exploratory Testing by Agents

Contract tests cover known interfaces. But what about the behaviors nobody thought to specify?

The [exploratory tester](/posts/2026-03-11-coding-agents-as-exploratory-testers) skill turns an agent into something that does not just run scripts but adapts, investigates, and triages. It exercises the software, hits an unexpected error, reads the error message, tries a workaround, forms an opinion about severity, and keeps going. When it finishes, a project manager skill compiles the findings into a triage table sorted by severity.

This is principle number five from the [Dream QA manifesto I wrote in 2019](/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019): "Exploratory testing over automating all possible scenarios." The scenarios are infinite. Automate the critical paths and explore the rest. I wrote that because I believed you cannot automate your way to complete coverage. Some bugs only surface when a tester goes off-script.

In 2019, that principle required human testers. Skilled people who understood the product deeply enough to know where the interesting boundaries were. Agents are the first technology that delivers on that vision at scale. An agent with a test plan, a troubleshooting guide, and platform-specific topic files can explore a CLI tool across three operating systems in a single CI run. It does not just find bugs. It triages them, deduplicates against existing issues, and presents findings sorted by how much they matter.

The [Quality Assistance post](/posts/2026-04-01-quality-assurance-vs-quality-assistance) draws the line between the two meanings of QA. Quality Assurance is the gate: tests pass or fail. Quality Assistance is the guide: the agent explores, surfaces findings, and lets you decide. The tester does not gate. It guides. It surfaces issues, ranks severity, and hands you the decision. That is the second layer of testing that Yegge's framework needs.

## Testing Makes Swarming Safe

Here is the synthesis.

Yegge's Merge Wall is a code-level problem. Two branches touch the same file. Conflicts arise. Serialization is needed. That is real, and the Level 5 post documents exactly how painful it gets.

But there is a behavior-level problem too. After eight workers merge their changes, does the system still do what it is supposed to? The code compiles. The branches merged cleanly. No conflicts. But Worker A changed an API response format and Worker B wrote a client that depends on the old format. The merge succeeds. The system is broken. No merge conflict told you this would happen.

Tests are the answer. CI as the final reviewer. The test suite runs after every merge to main. If Worker A's format change breaks Worker B's client, the integration test catches it. Not the merge tool. Not the code reviewer. The test.

The Rule of Five converges the design. Tests verify the implementation. Together, they close the loop.

Without both, you have either unverified designs or untested code. Reviews that say "this looks right" without evidence that it works. Or tests that pass against stale mocks without evidence that the design is sound. You need the full stack: design convergence through review, behavior verification through testing, and contract alignment through specs.

With both, swarming goes from dangerous to productive. The agents write fast. The Rule of Five ensures the design is coherent. The tests ensure the implementation is correct. The contract tests ensure the mocks are honest. The exploratory tests find what nobody thought to check. Each layer catches what the others miss.

That is the seventh tip. Test everything. Not because agents are unreliable. Because speed without verification is just fast chaos.

And Yegge knows it. His own multi-agent orchestrator, [Gas Town](https://github.com/steveyegge/gastown), uses [Testcontainers for deterministic test results](https://github.com/steveyegge/gastown/blob/853cc8e3194e8bca472a948c57ed3801b02e373b/docs/design/dog-execution-model.md?plain=1#L17-L20). The testing infrastructure is already in the design docs. The tip just wasn't in the article.

---

_Resources:_
- _[Steve Yegge: Six New Tips for Better Coding With Agents](https://steve-yegge.medium.com/six-new-tips-for-better-coding-with-agents-d4e9c86e42a9)_
- _[testcontainers-go-resend](https://github.com/mdelapenya/testcontainers-go-resend/)_
- _[Microcks](https://microcks.io/)_
- _[Testcontainers for Go](https://golang.testcontainers.org/)_
