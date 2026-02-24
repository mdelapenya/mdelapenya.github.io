---
title: "Coding with AI Agents: Like Driving a Tesla on Autopilot"
date: 2026-02-24 09:00:00 +0100
description: "What driving a Tesla with Autopilot taught me about working with AI coding agents. Both are powerful assistants that require active supervision, not passive passengers."
categories: [Technology, AI, Software Development]
tags: ["artificial-intelligence", "coding-agents", "developer-experience", "automation", "claude-code", "github-copilot"]
type: post
weight: 30
showTableOfContents: true
---

I've been coding with AI agents for the past year, and recently something clicked: the experience is remarkably similar to driving my Tesla with Autopilot engaged. Not Full Self-Driving (Supervised), just the basic Autopilot, the Level 2 driver-assistance system that handles steering and adaptive cruise control while you remain fully responsible for the vehicle.

The analogy isn't perfect, but it's surprisingly accurate in ways that help explain what it's actually like to work with AI coding agents in 2026.

## The Promise: Hands On, Eyes Forward

Tesla's Autopilot is explicitly a driver-assistance system: hands on the wheel, eyes on the road, brain fully engaged. AI coding agents like Claude Code and GitHub Copilot make the same promise: they can generate boilerplate, debug issues, and refactor entire modules, but you're always the developer. You review the changes, validate the logic, and ensure the code actually solves the problem.

## The Highway Experience: When Everything Works

Driving on a clear highway with Autopilot is genuinely impressive. The car maintains lane position, adjusts speed for traffic, and handles gentle curves. You're monitoring rather than micromanaging. Your cognitive load drops.

Working with AI agents on straightforward tasks feels the same. Write integration tests following an established pattern? Migrate modules to a new API? The agent handles it quickly and correctly, especially when you've established the pattern yourself first.

I experienced this firsthand while [refactoring 60 Go modules in Testcontainers](/posts/2025-10-10-coding-agents). After manually migrating 19 modules to learn the pattern, I used Claude Code to migrate the remaining 41 in just 3 days, a **5x speedup**. Once I confirmed the pattern worked, the agent applied it across all remaining modules without variance, copy-paste errors, or forgotten steps.

## The City Driving Challenge: When Judgment Matters

City driving with Autopilot is a different story. Construction zones, merging traffic, unclear lane markings. The system slows for obstacles but doesn't understand context. That double-parked truck isn't going to move; you need to change lanes proactively. You're not monitoring anymore; you're actively co-piloting.

Coding agents face the same challenge with complex, context-rich tasks. The agent will try, and sometimes succeeds, but other times misses crucial context or makes reasonable-but-wrong assumptions.

Here's a real example: I asked an agent to add a wait strategy for a database container:

```go
testcontainers.WithWaitStrategy(
    wait.ForLog("database system is ready to accept connections"),
)
```

The code compiled. The tests passed. But the actual log message varies between database versions: sometimes "ready to accept connections", other times "accepting connections". A more robust approach would be waiting for the port to be listening, or using a health check that doesn't depend on log formatting. I had to actively review and reject technically correct code because it violated architectural decisions not visible to the agent.

## The Paradox of Supervision

Here's where both experiences converge on something counterintuitive: **effective use requires you to stay just as engaged as if you were doing it manually, but in a different way.**

When I drive with Autopilot, I'm not more relaxed. I'm differently focused. I'm watching the road *and* the system's behavior. I need to predict not just what other drivers will do, but what the Autopilot will interpret their actions to mean.

Working with coding agents is the same shift. I'm not coding less; I'm coding differently. The agent writes the code, but I'm responsible for whether it's the *right* code.

## When to Disengage: Knowing Your Limits

Sometimes the agent doesn't know it's out of its depth. It generates code confidently that's subtly wrong. This is the equivalent of Autopilot staying engaged when road conditions are too complex, but the system hasn't recognized it yet.

**You** need to recognize when to take manual control:

- Critical security boundaries
- Subtle performance optimizations
- Complex state management with race conditions
- Integration with poorly-documented third-party systems
- Novel algorithms or approaches

Disengage the agent and code it yourself. You can always use the agent afterward to review your work.

## The Net Productivity Question

There's a growing debate about whether AI coding tools actually make developers more productive. What matters isn't isolated code generation. It's the entire workflow from requirements to shipped, tested code.

**They make me faster at:**
- Boilerplate and repetitive code
- Writing tests for straightforward functions
- Generating documentation
- Exploring unfamiliar codebases
- Prototyping ideas

**They don't replace me at, but they do make me faster:**
- Understanding complex requirements (I still decide, but the agent co-pilots the exploration)
- Architecting systems (I own the decisions, but the agent helps me think through trade-offs)
- Debugging subtle issues (I paste the stacktrace, the agent narrows the search space)

**They genuinely don't help with:**
- Learning new technologies deeply (shortcuts in learning create gaps later)

The net effect? I'm more productive across the board. The agent handles the mechanical work *and* co-pilots the hard stuff. I still make the decisions, but I get there faster.

## The Learning Curve: Trust, But Verify

New Autopilot users either over-trust or under-trust the system. Over-trust leads to complacency and dangerous near-misses. Under-trust leads to white-knuckling the wheel, negating any benefit.

The same applies to coding agents. Junior developers accept suggestions too readily, introducing bugs. Senior developers dismiss agents as "unhelpful" because the first few suggestions weren't quite right. The sweet spot is calibrated trust, learned through experience, not shortcuts.

## The Future: Better Assistance, Not Replacement

AI coding agents are getting better (better context awareness, fewer hallucinations, more accurate implementations), but the fundamental dynamic remains: **these are assistance systems, not replacement systems.**

There's one twist to this analogy, though. Imagine if Tesla had a "proving ground mode": a closed track, no pedestrians, no traffic, no consequences. You could let FSD drive at full autonomy, push it to its limits, let it make mistakes and learn from them. You wouldn't need your hands on the wheel because *there's nothing to hit*. The car could take risks that would be reckless on a real road, and you'd just review the telemetry afterward.

That's exactly what [Docker Sandboxes](https://www.docker.com/blog/docker-sandboxes-run-claude-code-and-other-coding-agents-unsupervised-but-safely/) provide for coding agents. An isolated microVM where the agent operates at full autonomy (installing packages, running tests, modifying files) with zero ability to affect your host system. You stop supervising and start delegating: "refactor these modules, run all tests, fix any failures." You review the results when it's done, not while it's driving.

And it goes further. Imagine having *multiple* proving grounds running in parallel, each car testing a different route, a different strategy. That's what git worktrees add to the picture: isolated branches where multiple agents work on separate tasks simultaneously, without stepping on each other. More on that soon.

The right paradigm is supervised assistance for production work, with sandboxed autonomy for safe tasks. Hands on the wheel when it counts, proving grounds when it doesn't.

## Conclusion: Hands On, Mind Engaged

The technology is genuinely useful. It makes me more productive on real projects. But it's not magic, and it's not ready to drive on its own. The agent excels at the highway stretches; you're still the one navigating the city.

Keep your hands on the keyboard, your eyes on the code, and your brain fully engaged. And that's exactly how it should be.

---

_Related: [Refactoring 60 Go Modules with an AI Coding Agent](/posts/2025-10-10-coding-agents) - My detailed experience using Claude Code to migrate Testcontainers modules, including patterns, pitfalls, and metrics._

_Resources:_
- _[Testcontainers Claude Skills](https://github.com/testcontainers/claude-skills) - Official Claude Code skills for working with container-based testing infrastructure_
- _[Docker Sandboxes for AI Agents](https://docs.docker.com/ai/sandboxes/) - Run coding agents unsupervised but safely in isolated microVM environments_
