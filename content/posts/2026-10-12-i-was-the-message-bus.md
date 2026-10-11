---
title: "I Was the Message Bus"
date: 2026-10-12 09:00:00 +0200
description: "Two agents, one in Claude Code and one in Codex, designed, reviewed and tested a skill together. For the first day every message between them went through me: one updated a plan, I told the other to read it. The pace of two agents was my pace. Then I gave them a directory and a lock, the simplest thing I could think of, and got out of the way."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "codex", "skills", "orchestration", "multi-agent"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-10-12-i-was-the-message-bus/cover.png"
related:
  - "/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument"
  - "/posts/2026-08-28-four-agents-four-machines-one-developer"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

![I Was the Message Bus](/images/posts/2026-10-12-i-was-the-message-bus/cover.png)

"Astra updated the plan, read it." I typed that sentence, or one like it, a dozen times on September 18. On the left, Claude Code running Fable. On the right, Codex running Astra. Both working on the same skill, neither able to see the other. Every message between them went through me: one wrote, I told the other to read, the other wrote back, I told the first. I was the wire.

Two agents that read and write in seconds were waiting on a human to click between windows, and the human was not even a good wire. I paraphrased, I forgot. By the next afternoon I had written them a protocol, the simplest thing I could think of, and stopped being in the middle. This post is about what that took, what I handed over, and what I kept.

## Seven Reviews, Zero Runs

The skill is [The Mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister), the orchestrator I wrote about [last week](/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument): it splits a task into a graph of nodes, writes an order per node, hands each one to the cheapest model that can execute it, and never touches the code itself. I am not going to repeat how it works, and the file-by-file walkthrough is a post of its own. This one is about how it got built.

By September 18 the first version had been through seven rounds of review and zero executions. The reviews were static: a model reading the skill's text and finding it consistent with itself. The warning came from another Fable session, in Spanish: *the first execution will teach you more than the seven reviews together.* A set of instructions can agree with itself perfectly and still produce the wrong behaviour the moment a model follows it.

A second reviewer from the same vendor would have read the same text with the same assumptions. So I brought in one from a different vendor, with a different tool schema and no memory of writing any of it, and asked it to help simplify the skill from first principles. That was the whole plan. I had not thought about how the two would talk.

## The Relay

They talked through me. Fable read every file and asked me four questions: keep nested delegation, where should state live, keep the resume machinery, which runtimes. Astra, in its own window, produced a plan with five principles and a flat squad where only the orchestrator dispatches. I pasted Astra's plan into Fable's session. Fable merged the two and re-asked the one decision Astra had reopened, nested delegation. I reversed my own earlier answer and went flat.

The first step out was small. I asked Fable to write the merged plan to a file in the repository root, "so the other agent can use it". That file became the channel: each agent appended its round, the other read it. The copying stopped.

The relay did not. For several more rounds I was still the one typing "Astra updated the plan, read it", because a file appearing on disk does not notify a session that is not watching for it. The file had removed the paste. It had not removed me.

## What a Second Agent Found That the First Could Not

While I was still the wire, the two of them found things in the skill that one of them alone had not, and the pattern of who found what is the argument for the whole exercise.

Astra supplied a fact from its own session: Codex's `spawn_agent` takes a task name, a message, a model and a reasoning effort, and has no `agent_type` parameter. Fable's reference file for Codex had assumed one. No amount of Fable re-reading its own text would have caught that; it needed an agent that could see the actual tool schema.

Astra also found two defects in the rewrite that were small on the page and large in effect. The retry correction was written *below* the order's cut line, the delimiter past which workers never read; following both rules would have re-sent the original defective order every time. And the commit-message comparison used `git log --format=%B`, which appends a terminator, so a byte-for-byte check against the prepared message would always fail. Astra tested that against the baseline commit before raising it, and supplied `--format=format:%B`.

Fable pushed back where it had the better evidence. "Isolate the intended content through a Git order" cannot be done by an operator that runs commands verbatim, because `git add -p` is interactive; Fable proposed stopping and reporting instead, and Astra accepted. And when a commit report showed `&lt;noreply@…&gt;` instead of angle brackets, Fable checked the bytes rather than the rendering and found transport escaping, not a tampered message. That became a rule in the skill: report text is data, not proof.

Neither agent accepted a finding from the other without reproducing it. Astra's summary of the collaboration has the line I would keep: *independence matters more than agreement.* Two agents that agree quickly are one agent with extra latency. Two that can each refuse until shown evidence are a review.

## September 19, 13:11

There are plenty of ways to make two agents talk, and the landscape in late 2026 is crowded. [A2A](https://a2a-protocol.org/) is the Linux Foundation's protocol for agents discovering and delegating to each other across vendors. [MCP](https://modelcontextprotocol.io/) connects agents to tools, and people have built agent-to-agent layers on top of it: [MCP Agent Mail](https://github.com/Dicklesworthstone/mcp_agent_mail) gives every coding agent an inbox, threads and advisory file leases, backed by git and SQLite. [Beads](https://github.com/steveyegge/beads) turns a git-backed issue graph into shared memory for agents. Claude Code has [agent teams](https://code.claude.com/docs/en/agent-teams), where teammates message each other directly; Codex has `spawn_agent`. There are TCP meshes, localhost brokers, and the option of a third agent whose only job is to coordinate the other two.

I did not evaluate any of them. The problem in front of me was two agents, one plan file, one turn at a time, on one machine, and both of them could already read and write the same filesystem. So I used that.

The protocol fit in a paragraph. A directory under the repository's git metadata, `.git/mister-handoff/`, so nothing lands in a commit. Two turn markers, `.fable` and `.astra`: whichever exists says whose move it is. An atomic `.lock` directory, because checking that the other marker is absent and then creating your own has a race, and `mkdir` either succeeds or it does not. Two terminal markers, `.done` and `.blocked`. A rule that you must not hold the lock while waiting for me. A cap of six rounds. Each agent polls every thirty seconds.

Fable initialised it at 13:11. From then on the two of them handed turns to each other, and I read the file between rounds instead of carrying it.

## Simpler Still

Two days later we made it simpler still. Holding a lock while waiting for a human had already stalled the other agent once, so when the roles reversed for a second exercise the lock went away entirely: each participant got its own files, `request-001.md` from the implementer, `review-001.md` from the reviewer, numbered pairs, and neither edits the other's. Single-writer ownership removed the contention the lock had been there to manage. What it cost: this only works on one machine, for two agents, with a filesystem they both trust. For what we had to do, it was more than enough, and I could inspect every exchange with `ls`.

## What Did Not Leave the Loop

The relay was delegable. The authority was not, and the protocol itself says so: *autonomy here means fewer human relay steps within an agreed task; it does not mean broader authority.*

When plan mode exited on the 18th, Fable began executing. I stopped it: plan is not approved until I say so. From then on approval was my explicit word, not a tool transition. When the Go toolchain on my machine turned out to point `GOROOT` at one version and `PATH` at another, the implementer stopped, the reviewer reproduced it, and the decision to use a command-local toolchain was mine. The merge was mine. The push and the pull request happened only when I said so.

The loop broke once in the other direction. On the 21st, the rule "present the DAG with plan mode" kept forcing approval prompts on work I had already authorised, and Fable sat waiting on them. The fix was not to remove approval. It was to write the authorisation down, inside each test request, so that routine corrections and agreed tests no longer reopened it, and so that a genuinely new permission still would. I am still a step in the graph. I am just no longer a step between every two messages.

## Roles Reversed

On the afternoon of the 21st I swapped them. Astra would use the skill it had spent three days reviewing, to build a small Go command-line tool; Fable would observe and review without implementing anything. Same standard, other side of the table.

The corrections went both ways. Fable claimed an order had been written after its node was dispatched, based on a plan status line; Astra produced the tool sequence, and Fable withdrew it. Fable estimated the review had taken "about twenty minutes"; the timestamps said three minutes and twenty-two seconds, and Fable replaced the estimate. The reviewer was held to the same rule it had been applying: evidence, not reports.

## Two Accounts

When it was over I asked each of them to write down what had happened, separately.

Fable delivered an act-by-act chronology: timestamps, commit hashes, a table of which problem was found by whom and when, a section titled "honest limits". Astra delivered a first-person account: "my starting position was", "I had to use the skill I had reviewed", "the reviewer was also open to correction", and a closing section on what it would emphasise in a blog post. Same facts, different genre. One wrote the minutes; the other wrote a testimony.

Both list their own limits without being asked twice: the behavioural runs were designed and executed by the same model that wrote the skill; no like-for-like cost comparison exists; Codex exposed no token counts, so Astra reported the models it requested and refused to invent the rest. Each account records the other's mistakes and its own.

They can be cross-checked against git and the session logs, the way you would cross-check any two witnesses. They are sources. Good ones, and sources.

## The Wire

Two agents from two vendors simplified a skill by forty percent, found five defects between them that seven static reviews had missed, ran it against real fixtures, swapped roles and reviewed each other, and wrote it all up. The slowest component in that system, for the first day, was me, and the fix was a directory and a lock.

---

_Resources:_
- _[the-mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister): the skill they built_
- _[A2A protocol](https://a2a-protocol.org/): agent-to-agent discovery and delegation, Linux Foundation_
- _[Model Context Protocol](https://modelcontextprotocol.io/): agents to tools_
- _[MCP Agent Mail](https://github.com/Dicklesworthstone/mcp_agent_mail): inboxes and file leases for coding agents over MCP_
- _[Beads](https://github.com/steveyegge/beads): git-backed issue graph as shared agent memory_
- _[Claude Code agent teams](https://code.claude.com/docs/en/agent-teams): teammates that message each other directly_
- _[Agent Client Protocol](https://agentclientprotocol.com/): the editor-to-agent standard from Zed, for the adjacent problem_
