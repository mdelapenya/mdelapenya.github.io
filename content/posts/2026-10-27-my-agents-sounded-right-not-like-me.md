---
title: "My Agents Sounded Right. Not Like Me."
date: 2026-10-27 09:00:00 +0100
description: "Coding agents already post on GitHub with my account. The text was correct, and it sounded like any agent: too long, too polite, formatted like a report. I wanted a skill that makes them write like me, everywhere. A voice is not something you describe in a prompt; it is something you measure in your own history, and building that skill left a toolkit behind for anyone to build theirs."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "skills", "github", "open-source", "maintainers"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-10-27-my-agents-sounded-right-not-like-me/cover.png"
related:
  - "/posts/2026-03-25-skills-are-roles-not-commands"
  - "/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe"
---

![My Agents Sounded Right. Not Like Me.](/images/posts/2026-10-27-my-agents-sounded-right-not-like-me/cover.png)

My coding agents write on GitHub with my account. They answer review comments, describe pull requests, ask reporters for a reproducer. The content was usually fine. The voice was not mine.

You all know how agents sound: too long, too polite, headers and bullet lists everywhere, as if a review comment were a quarterly report. Clankers. I call mine Bender (yes, the one from Futurama), and I did not want Bender answering my contributors under my name. I wanted a skill that makes any agent, in any harness, write like me.

## Correct is not the same as mine

On a project like [testcontainers-go](https://github.com/testcontainers/testcontainers-go), contributors read a lot of my text. When the register suddenly changes to "Great question! Here is a comprehensive overview of the key changes:", they notice. It reads like someone else is answering, and in a way someone else is.

The first fix everybody tries is the prompt: "be concise", "be friendly but direct", "don't use bullet points". Adjectives like *concise* and *friendly* mean something different to every model, and they say nothing about the things that actually make a reply mine: how long it is, how it opens, how it closes, and what position it takes.

## A voice is measured, not described

So I stopped describing my voice and counted it instead. I pulled every issue, PR description, comment, review summary and inline review comment I wrote on GitHub between May 2019 and August 2025: about 14,500 texts. That window is not random. Those were years of a lot of open source work, and every one of those texts was written by me, by hand: coding agents basically did not exist yet, and I only started using them in the last year. After that, part of what appears under my name is agent-assisted, so this window is the clean record of my voice.

> **Note:** it is a bit scary to write this and recall [Be Right Back](https://www.imdb.com/title/tt2290780/), the Black Mirror episode where, after Ash dies, Martha signs up for a service that rebuilds him from everything he wrote online: first as a chat, then as a voice on the phone. I am only feeding my GitHub comments to my agents, and I am still around to review what they write. Still.

Then I measured them, anchored on the last era (2023 onwards, about 5,800 texts).

Some of the numbers that came out:

- A **review summary** on someone else's PR: median **10 words**.
- A **comment** in someone else's thread: median **26 words**, p90 at 79.
- **Markdown headers** in those comments: **0%**. Bullet lists: 2%.
- Of 720 reviews on other people's PRs, **3%** request changes. 64% approve.
- Most used closer: `LGTM, thanks!` (187 times). Most used emoji: 🙏 (251).
- "I think" appears in 524 texts. "Perhaps" appears in 2.

None of that fits in an adjective. All of it fits in a file an agent can read, and in a lint that can reject a draft that is three times longer than anything I would write.

Length is the obvious tell, but it is not the whole voice. The other half is **stance**: what I approve, what I push back on, and what I never let anyone else decide.

## What the voice is made of

The generated skill separates the voice into layers, and each layer answers a different question.

- **Measured style** (`style.md`, `norms.json`): lengths per genre, rituals, punctuation, emoji, drift over the years. Regenerated from the corpus, never hand-edited.
- **Playbooks per speech act**: approve, decline, ask-info, request-change, close, own-mistake, and so on. Each one states the stance and the moves, with URLs to real texts.
- **Principles**: the technical positions I actually hold, with links to where I said so.
- **Anti-patterns**: the things agents do and I don't. "Great question", "I hope this helps", restating what the other person just said, several closers in a row.
- **Boundaries**: decisions the agent must hand back to me. Public API surface, breaking changes, release timing, closing someone's issue as won't-fix. When a draft would need one of those, the agent writes `DECISION NEEDED: …` and stops.
- **Disclosure**: every agent-written text ends with `🤖 Written assisted by my <Harness>`. The lint fails without it.

The boundaries matter as much as the length. An agent that sounds exactly like me and declines a contributor's module on its own is worse than one that sounds like a bot.

## How agents-voice builds it

[agents-voice](https://github.com/mdelapenya/agents-voice) is the toolkit that came out of building that skill. It takes a GitHub login and a time window and produces a skill directory any harness can load (Claude Code, Codex, Cursor). The pipeline has eight steps:

1. **Harvest** everything the subject wrote in the window, across all repositories, through `gh` (GraphQL search sharded by month, REST for inline review comments).
2. **Normalize** into one JSONL corpus, with role (own thread vs. someone else's), genre and thread context.
3. **Label** each text's speech act, audience and tone with a cheap model, in batches.
4. **Measure** lengths, rituals, punctuation, review verdicts and drift per genre into `style.md` and `norms.json`.
5. **Index** the corpus in SQLite FTS5, so the skill can pull 3 to 5 real exemplars while drafting.
6. **Distill**: a strong agent reads the corpus and writes the playbooks, principles, boundaries and anti-patterns. Every claim carries the URL of a real text.
7. **Assemble** the skill: `SKILL.md`, the references, and `scripts/voice` for search and lint.
8. **Evaluate** on a hold-out of real threads: drafts with the skill vs. a baseline, judged against the reply I actually wrote, which stays hidden.

Two details keep it honest. First, retrieval is there for register, not for copying: the lint rejects any 5-gram that appears in fewer than three texts of the corpus, because that is a copy of one exemplar, while a phrase that appears in many texts is a ritual and is allowed. Second, the eval excludes every hold-out thread from the retrieval database, so the skill cannot look up the answer it is being judged against.

Why a skill, and not a fine-tune or a RAG service? Because the voice should be a document the maintainer owns. I can open `boundaries.md`, read it, and fix a line I disagree with. I cannot do that with model weights.

## Build your own voice

You need Node 20+, Python 3.10+ with the stdlib `sqlite3` module, and an authenticated `gh`. Docker is optional: when it is running, the skill's Python tools run in `python:3.12-slim` with no network.

```bash
git clone https://github.com/mdelapenya/agents-voice
cd agents-voice

node setup.mjs <github-login> --from 2019-05 --to 2025-08 --era 2023
npm run harvest          # resumable; a 15k-text history takes a few hours of API time
npm run normalize
npm run label:prepare    # then follow label/LABEL.md with a cheap model
npm run label:merge
npm run style
npm run index
# distill: point a strong agent at distill/DISTILL.md
npm run assemble
```

The result lands in `out/<login>/skill/`. For Claude Code, link it into the skills directory and put the database next to it:

```bash
ln -s "$PWD/out/<login>/skill" ~/.claude/skills/<login>-voice
cp out/<login>/voice.sqlite ~/.claude/skills/
```

Everything under `out/` is gitignored. It is your history, and it stays yours.

## What happens when the skill loads

From then on, when an agent is about to post in your name, `SKILL.md` gives it a workflow: classify the situation (role, genre, act, audience), read the playbook for that act, pull a few exemplars, draft at your length, lint the draft, and append the disclosure. Or stop and ask you, if the decision is in `boundaries.md`.

Two of those steps run code: `search` and `lint`. The agent never calls the Python files directly. It calls one wrapper, `scripts/voice`:

```bash
scripts/voice search "flaky test" --act ask-info --role other --since 2023
scripts/voice lint draft.md --genre comment
```

The wrapper decides where the Python runs:

- **Docker first.** If `docker` is installed and `docker info` answers, it runs the script in `python:3.12-slim` with `--network none`, as your uid and gid. The skill directory and `voice.sqlite` are mounted read-only at the same paths they have on the host, so every path the agent sees is valid inside the container. A draft outside the working directory gets its own read-only mount.
- **Host Python as fallback.** No Docker, or the daemon is down: it runs `python3 -I` on the host. If neither is available, it fails with a clear message.

Here is the core of it:

```bash
if [ "${VOICE_RUNTIME:-docker}" = "docker" ] && command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  image="${VOICE_PY_IMAGE:-python:3.12-slim}"
  run=(docker run --rm --network none --user "$(id -u):$(id -g)" -w "$PWD"
       -v "$SKILL:$SKILL:ro" -v "$PWD:$PWD")
  [ -n "$db" ] && run+=(-v "$db:$db:ro" -e "VOICE_DB=$db")
  exec "${run[@]}" "$image" python3 -I "$script" "$@"
fi

exec python3 -I "$script" "$@"
```

Both scripts use only the standard library (`sqlite3` with FTS5 included), so the two paths behave the same. Three environment variables override the defaults: `VOICE_RUNTIME=host` skips Docker on purpose, `VOICE_PY_IMAGE` pins another image, and `VOICE_DB` points at a specific database.

## Closing

I did not need my agents to write better. I needed them to write less, closer to how I write, and to know when to leave the decision to me.

`LGTM, thanks!`

## Bonus: the song

Cloning my own voice so my agents can use it deserved some humour. So I made two songs about agents-voice with [Suno](https://suno.com), the AI music generator: one in English and one in Spanish.

The English version:

{{< suno "bdcbc7db-f986-486b-82a6-af11f763b6d6" "agents-voice, the song (English)" >}}

And the Spanish one:

{{< suno "2241dbb9-65fb-4cf2-b1d8-2591145ccaed" "agents-voice, la canción (español)" >}}

---

*[agents-voice on GitHub](https://github.com/mdelapenya/agents-voice)*

*[DESIGN.md: the decisions behind it](https://github.com/mdelapenya/agents-voice/blob/main/DESIGN.md)*
