---
title: "A Personal AI That Reads My Bills"
date: 2026-04-27 09:00:00 +0200
description: "I built a personal AI assistant on my Synology NAS that parses my electricity bills, grocery receipts, bank statements, and parking tickets. It runs on Telegram, answers in natural language, and crashed on week 8 because I forgot to watch the disk."
categories: [AI, Self-Hosting, Automation]
tags: ["nanoclaw", "synology", "telegram", "home-assistant", "gmail", "personal-finance", "docker"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-04-27-a-personal-ai-that-reads-my-bills/cover.png"
related:
  - "/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows"
  - "/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox"
---

![A Personal AI That Reads My Bills](/images/posts/2026-04-27-a-personal-ai-that-reads-my-bills/cover.png)

There is a Synology NAS in my home office that already runs Plex, holds photo backups, and hosts a handful of Docker containers. Adding "personal AI assistant" to the workload was, in cost terms, free. The real question was: what would I use it for? The answer turned out to be my bills. Mercadona grocery receipts, Iberdrola electricity invoices, BBVA bank statements, Amazon orders. All arriving as emails with PDFs, all going straight to the trash. None of it queryable. I wanted to ask "how much did I spend on groceries last winter" and get an answer from my phone. Four weeks later, the system runs, answers, and has already crashed once. This is the story.

## Why This Exists

Several pieces of my daily life were sitting in unstructured form, dead to automation. Mercadona shopping receipts arrived as PDFs and went straight to the Gmail trash. Iberdrola electricity bills, same story. BBVA monthly statements came as password-protected PDFs that I opened maybe twice a year. Amazon order history existed but only through the website's own UI.

None of this data was hidden. It was just unstructured and unjoined. There was no easy way to ask "how much did I spend on groceries last winter compared to this winter," or "what was my electricity self-consumption ratio in 2024," or "what merchant am I paying the most to on my bank card." The information existed in eight separate inboxes, vendors, and PDF formats. The only thing missing was a system that knew where every piece lived, imported it on a schedule, stored it in a queryable shape, and let me ask questions in natural language from a phone.

[NanoClaw](https://github.com/qwibitai/nanoclaw) plus Claude is that system. NanoClaw is an open-source AI orchestrator (a Node.js process, a few thousand lines of TypeScript) that manages conversations across channels, spawns agent containers per topic, and runs scheduled tasks. The Synology was the host. The work was wiring it up.

Fun coincidence: the same week I publish this, Vivian Balakrishnan, Singapore's Minister of Foreign Affairs, published [his own NanoClaw setup](https://gist.github.com/VivianBalakrishnan/a7d4eec3833baee4971a0ee54b08f322) running on a Raspberry Pi, focused on knowledge graphs and diplomatic context. Same open-source project, very different use case. He builds compounding memory for statecraft. I parse grocery receipts.

There is a second motivation worth being honest about: keeping all data local. Gmail OAuth tokens stay in the agent container. The SQLite databases never leave the NAS. I have a Home Assistant instance running at home, and it queries the metrics API on a private LAN address. Anthropic's API is the only network egress, and it sees only what the prompts contain. Never raw bills.

## The Architecture: A VM, Not a Shortcut

The full stack, top to bottom:

```
┌──────────────────────────────────────────────────────────────────────┐
│  HARDWARE   Synology DS923+ NAS                                      │
└──────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────┐
│  HOST OS    Synology DSM 7.x  (bare metal)                           │
│                                                                      │
│   ┌──────────────────────────┐   ┌─────────────────────────────┐    │
│   │ Container Manager        │   │ Virtual Machine Manager     │    │
│   │ (DSM Docker)             │   │                             │    │
│   │  • Home Assistant ───────┼───┼──→ <NAS-IP>:8765            │    │
│   │  • Plex                  │   │                             │    │
│   │  • Photos / Time Machine │   │    ┌─────────────────────┐  │    │
│   │  • (other workloads)     │   │    │ Ubuntu Server 24.04 │  │    │
│   │                          │   │    │ 4 GB · 2 vCPU · 57G │  │    │
│   └──────────────────────────┘   │    └─────────────────────┘  │    │
│                                  └─────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────┐
│  GUEST VM   Ubuntu 24.04 LTS  (the only place NanoClaw runs)         │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │ User: nanoclaw  (in docker group, no sudo)                    │  │
│   │                                                               │  │
│   │  ── Interactive layer ─────────────────────────────────────   │  │
│   │     Claude Code session  ("the foreman")                      │  │
│   │      • SSH'd in, full host shell as nanoclaw                  │  │
│   │      • source edits, recovery, audits                         │  │
│   │                                                               │  │
│   │  ── NanoClaw orchestrator ─────────────────────────────────   │  │
│   │     node dist/index.js  (PID-tracked by start-nanoclaw.sh)    │  │
│   │      • Telegram long-poll                                     │  │
│   │      • IPC watcher polls data/ipc/<group>/messages/*.json     │  │
│   │      • Task scheduler reads store/messages.db                 │  │
│   │      • Spawns agent containers on demand ─────────┐           │  │
│   │                                                   │           │  │
│   │  ── Docker engine (inside the VM) ────────────────┼────────   │  │
│   │                                                   ▼           │  │
│   │     Long-lived service containers:                            │  │
│   │     ┌────────────────────┐  ┌──────────────────────────┐     │  │
│   │     │ onecli-app-1       │  │ andy-metrics-api :8765    │     │  │
│   │     │ credential gateway │  │ Python HTTP, no deps      │     │  │
│   │     │  → onecli-postgres │  │ ro mounts: 7 *.db  ◄─ HA │     │  │
│   │     └────────────────────┘  └──────────────────────────┘     │  │
│   │                                                               │  │
│   │     Ephemeral per-topic agent containers:                     │  │
│   │     ┌──────────────────────────────────────────────────────┐ │  │
│   │     │  nanoclaw-telegram-main          ← DM (is_main=1)    │ │  │
│   │     │  nanoclaw-telegram-pa-*          ← forum topics       │ │  │
│   │     └──────────────────────────────────────────────────────┘ │  │
│   │     Each agent container mounts:                              │  │
│   │       /workspace/group              (rw, this group's folder) │  │
│   │       /workspace/extra/main-shared  (ro, non-main only)       │  │
│   │       /workspace/ipc                (rw, dropbox to orch)     │  │
│   │       /workspace/project            (ro, main channel only)   │  │
│   │       OneCLI-injected creds at spawn time                     │  │
│   └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────┐
│  EXTERNAL   (the only network egress)                                │
│    • Telegram Bot API      — orchestrator long-polls; sends replies   │
│    • Anthropic API         — agent containers send prompts           │
│    • Gmail / Calendar API  — scheduled imports from agent containers │
└──────────────────────────────────────────────────────────────────────┘
```

The Synology already runs Docker via its built-in Container Manager, and the obvious shortcut would be to install NanoClaw straight onto that. I considered it for about ten minutes and rejected it.

NanoClaw spawns one Docker container per active conversation. Every Telegram topic that receives a message gets a fresh container booted by the orchestrator with its own mounts and credential injections. To do that, the orchestrator needs read/write access to a Docker socket. On Synology's Container Manager, that means bind-mounting `/var/run/docker.sock` from the DSM host into NanoClaw's container. Anyone who has worked with Docker for more than a week knows what that means: the inside of NanoClaw's container has the exact same authority over the host as Docker itself. An injected prompt that talks the agent into running `docker run --privileged`, an exploit in one of NanoClaw's npm dependencies, a bug in the Telegram message parser: any of those would have unfettered access to Plex, the family photo library, the Time Machine targets, and every other workload on the NAS. The blast radius would be the entire NAS.

Inside Virtual Machine Manager I provisioned a single Ubuntu Server 24.04 LTS VM: 4 GB of RAM, 2 vCPU, 30 GB of disk to start. Ubuntu rather than Debian or Alpine because the apt repositories carry up-to-date Node 20 and a recent Docker Engine without hunting for backports, and because the LTS guarantee means five years of security updates. The VM has its own MAC address, its own DHCP lease, its own routing table. If the assistant's container fleet starts misbehaving (runaway memory, a fork bomb, a PDF parser that loops on a malformed input), the kernel pressure stays inside the VM, and the worst case is power-cycling it from VMM's web UI without touching anything else. Free snapshotting too: VMM can take a frozen-disk snapshot of the running VM, which becomes the practical backup strategy.

Inside the VM, a second decision that costs nothing and earns a lot: NanoClaw never runs as root.

```bash
sudo adduser nanoclaw
sudo usermod -aG docker nanoclaw
su - nanoclaw
```

The `nanoclaw` user owns everything the assistant touches. It can talk to the Docker daemon (via the `docker` group) without sudo. The bootstrap script confirms the choice at startup: `Root: false` in the logs is NanoClaw acknowledging it runs unprivileged and is happy about it. Running as root would have worked, but four properties of the non-root setup pay for themselves:

- **Least privilege**: a process running as `nanoclaw` is bounded to its own home, not the entire VM.
- **File-ownership hygiene**: every file the assistant writes is owned by `nanoclaw:nanoclaw`, so my normal SSH user can inspect them without sudo but cannot modify them by accident.
- **Clean uninstall**: `sudo userdel -r nanoclaw` deletes everything in one command.
- **Process accounting**: `ps -u nanoclaw` instantly enumerates every assistant-related process, which made the post-incident cleanup trivial (I knew exactly which processes were the assistant's and which belonged to the OS).

Two layers of containment: the VM keeps NanoClaw away from the NAS, and the unprivileged user keeps NanoClaw's mistakes scoped to itself. Both are essentially free in steady-state operation.

## First Boot: 21 Minutes to a Working Bot

I SSH'd into the VM as the `nanoclaw` user. Empty home directory. The first thing was getting the source onto the box:

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/qwibitai/nanoclaw.git
cd nanoclaw
```

That clone landed at 12:36 UTC. Four minutes later, the bootstrap script ran. The full log is short enough to quote:

```
[2026-03-26 12:40:44] [bootstrap] === Bootstrap started ===
[2026-03-26 12:40:44] [bootstrap] Platform: linux, WSL: false, Root: false
[2026-03-26 12:40:44] [bootstrap] Node 20.20.2 at /usr/bin/node
[2026-03-26 12:40:44] [bootstrap] Running npm ci
[2026-03-26 12:40:49] [bootstrap] npm install succeeded
[2026-03-26 12:40:49] [bootstrap] Verifying native modules
[2026-03-26 12:40:49] [bootstrap] better-sqlite3 loads OK
[2026-03-26 12:40:49] [bootstrap] Build tools: false
[2026-03-26 12:40:49] [bootstrap] === Bootstrap completed: success ===
```

Five seconds. The bootstrap is paranoid in the right ways: it checks you are not running as root, confirms the Node major version, runs `npm ci` (not `npm install`) so the lockfile is honored exactly, and verifies that `better-sqlite3` (the one native module NanoClaw depends on) loaded without needing a rebuild. "Build tools: false" means we did not need `gcc`, `make`, or `python3-dev`. The prebuilt binary for Node 20 on glibc Linux just worked. On a fresh Ubuntu 24.04 VM, that is the difference between a five-second bootstrap and a fifteen-minute rebuild.

After bootstrap, the setup wizard took over. It walked me through channel selection, I picked Telegram, and it ran the `/add-telegram` skill. I had already created a bot with `@BotFather` and pasted in the token when prompted. By 12:52 the TypeScript was compiled. By 12:53 the `.env` was written with three keys: `ONECLI_URL`, `TZ`, and `TELEGRAM_BOT_TOKEN`. The Anthropic API key lives in OneCLI's vault, injected into agent containers at request time, never on disk in plain text.

At 12:57 UTC the bot was live. Twenty-one minutes from `git clone` to a working AI assistant replying on Telegram.

That number is honest but not the whole story. This was vanilla NanoClaw 1.2.34 with a single DM channel. Adding Gmail integration and forum topics took another 43 hours of work, mostly in bursts: on March 28, I merged the Gmail and Telegram skill repositories as remotes, ran `npm install` to absorb their dependencies, and committed the forum-topics patch. "21 minutes to bot live" is the time to first message. The system I describe in this post took weeks of iterating from there.

## Talking to the Claw: Telegram as the Interface

I needed a way to talk to the assistant from my phone. WhatsApp was the default for NanoClaw, but the unofficial Web-API libraries are constantly cat-and-mouse with WhatsApp's anti-automation team (accounts get rate-limited, banned, or forced into reauthentication cycles), and WhatsApp has no native concept of topics. Email lost on latency: the round-trip of compose, send, wait for IMAP poll is nothing like a chat experience.

Telegram won by elimination, then kept winning. The Bot API is official, well-documented, generously rate-limited, and free. Forum groups support arbitrary topic threads. The mobile clients handle long messages, code blocks, and file attachments natively.

Upstream NanoClaw did not support Telegram's forum topics. I found [an open issue](https://github.com/qwibitai/nanoclaw-telegram/issues/115) in the Telegram channel repo, commented with a UX improvement for the `/chatid` command, and the author addressed it. The fix extended the JID encoding from `tg:<chatId>` to `tg:<chatId>:<threadId>`, threading the topic ID through the outbound `sendMessage` call so replies hit the right topic.

There are two layers to the communication. A direct-message channel with the bot is the **admin channel**: privileged commands, system notifications, and the place where I shaped everything else. I formed the entire topic structure by dialoguing with the bot in this admin channel: asking it to register topics, configure mounts, set up scheduled tasks. The bot is the builder of its own home.

The forum group, "Personal Assistance," holds six topics, each a discrete domain:

| Topic | Purpose | Scheduled tasks |
|---|---|---|
| General | Catch-all questions | None |
| Emails | Daily briefings | Calendar agenda (06:00), 2x email summaries (21:00) |
| Economics | Money questions | ORA parking summary (21:15), Mercadona summary (21:30) |
| Health | Medical context | None (reserved) |
| Coding | Software questions | None |
| SystemLog | One-way operations log | Receives import notifications (trigger-protected) |

The Economics topic is the only one with a fully customized CLAUDE.md. It knows the API endpoints, the database schemas, and the Telegram formatting rules. Every other topic shares a single `shared/CLAUDE.md`, mounted read-only into every container. One file, one place to update, every topic sees it on its next container spawn. No duplication, no drift.

## Lifecycle of a Message

Here is what happens when I type "how much did I spend on parking this week?" in the Economics topic:

```
User types in Economics topic
        │
        ▼  [1] Telegram Bot API delivers via long-poll
┌── NanoClaw orchestrator ───────────────────────────────────┐
│  [2] Derive JID: tg:-<group-id>:<economics-thread-id>      │
│  [3] Persist message to store/messages.db                   │
│  [4] Look up registered_groups: folder = pa-economics       │
│  [5] Live container within idle timeout?                    │
│        yes → reuse (warm: ~5-10s)                           │
│        no  → spawn fresh container (cold: ~30-60s)          │
└─────────────────────────┬──────────────────────────────────┘
                          ▼
        docker run nanoclaw-agent:latest
          -v groups/telegram_pa-economics:/workspace/group:rw
          -v groups/telegram_main/shared:/workspace/extra/main-shared:ro
          -v data/ipc/telegram_pa-economics:/workspace/ipc:rw
          --env-file <OneCLI-injected ANTHROPIC_API_KEY>
                          │
                          ▼
┌── Agent container ─────────────────────────────────────────┐
│  [6] System prompt assembled from:                          │
│        /workspace/group/CLAUDE.md (Economics personality)    │
│        /workspace/extra/main-shared/CLAUDE.md (DB, API URL) │
│                                                             │
│  [7] Agent calls metrics API:                               │
│        GET <NAS-IP>:8765/ora/tickets?from=2026-04-21        │
│                                                             │
│  [8] Formats reply in Telegram markdown                     │
│                                                             │
│  [9] Writes JSON to /workspace/ipc/messages/<ts>.json       │
│        { "chatJid": "tg:-<group-id>:<thread-id>",          │
│          "text": "*Esta semana en ORA* ..." }               │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼  [10] Orchestrator IPC watcher (polls every 1s)
┌── NanoClaw orchestrator ───────────────────────────────────┐
│  [11] Authorization: source folder matches target JID       │
│  [12] sendMessage to Telegram with thread_id preserved      │
│  [13] Delete consumed JSON file                             │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
        User sees reply in Economics topic (~30-60s)
```

The same pipeline handles scheduled tasks without any change: the task scheduler synthesizes a "user message" from the stored prompt and the lifecycle from step 5 onward is identical. This is how the daily Mercadona and ORA imports run, and how the email summaries land in their topics.

## Why Parse Emails at All?

The data I wanted to query does not live in any API. Mercadona has no order-history endpoint. Iberdrola has no billing API. BBVA offers no programmatic access to your own statements. The only persistent form of all this data is the email in your inbox, usually with a PDF attached.

So the system parses emails. Each parser follows the same loop: query Gmail with a vendor-specific filter, dedupe against the email ID already in the local database, fetch new messages, run a vendor-specific parser, insert into SQLite, archive the email.

I did not write these parsers by hand. I drove the agent from Telegram, via the admin channel, telling NanoClaw what I needed: "import all Mercadona receipts from Gmail, store order date, total, and line items in SQLite." The agent chose Python, chose the format, wrote the parser, and I asked for full test coverage of everything it wrote. Everything evolved together through conversation with the bot: databases, API endpoints, Home Assistant sensors, all iterating in parallel, reshaping each other as the system grew.

Two Gmail accounts feed the pipeline: a personal account for official concerns (utilities, bank, domestic paperwork) and an account I use for registering on websites (Amazon, grocery delivery). I should probably merge them. I have not.

| Source | Rows | Since | Until | Hard part |
|---|---|---|---|---|
| Mercadona | 82 receipts, ~1,250 items | Sep 2023 | Apr 2026 | Custom PDF parser (UTF-16BE, +0x1D font shift) |
| Amazon | 402 orders, 526 items, 35 returns | Dec 2013 | Mar 2026 | 3 email formats, 38% blank-orders trap |
| Iberdrola | 72 invoices | Jun 2021 | Mar 2026 | Solar self-consumption across 4 regex passes |
| BBVA | 146 statements, 2,806 card transactions | Jul 2013 | Feb 2026 | Password-protected PDFs, 2 parsers, DD/MM year inference |
| Tagus water | 12 bills | Apr 2025 | Mar 2026 | Straightforward |
| Movistar | 18 invoices | Aug 2023 | Jun 2024 | Provider migration mid-stream |
| O2 | 21 invoices | Jun 2024 | Mar 2026 | Discriminator column shared with Movistar |

Two stories worth telling from the table.

**Mercadona: the PDF that does not want to be read.** The first attempt was naive: download the PDF, run `pdftotext`, regex the output. Garbage. Mercadona's PDFs are tables drawn with absolute-positioned text fragments. `pdftotext` flattens them left-to-right, top-to-bottom, ignoring column boundaries. Product names get cut off, unit prices migrate to the next row, totals merge with the page footer. The agent wrote a custom PDF parser in pure Python. It reads the raw bytes, decompresses every `stream`/`endstream` block with `zlib`, walks the PDF text-positioning operators (`Tm`, `Td`, `Tj`), captures each text fragment with its `(x, y)` coordinates, then decodes them accounting for Mercadona's quirk of using UTF-16BE encoding with a `+0x1D` font-shift offset (discovered empirically by the agent staring at hex dumps). The most exotic code in the codebase, and I did not write a line of it.

**BBVA: the password-protected statement.** BBVA sends password-protected PDFs. The password is your DNI (Spanish national ID) in lowercase. The PDF contains two completely different transaction sections with different layouts: card transactions (merchant, city, country, amount) and account movements (transfers, direct debits, payroll, fees). Two separate state-machine parsers handle each section. The card parser maintains a noise filter for the headers that `pdftotext` interleaves across page breaks. The account-movements parser has to infer the year from `DD/MM` dates that never include it, using a `year_hint` extracted from the statement header. The dataset spans twelve years. This is the only way to programmatically query a Spanish personal bank account's history without paying for a third-party aggregator (which would mean handing them your bank credentials).

**ORA: the quick win that came last.** Once all the other parsers were working, I realized there was another source of data hiding in my inbox: ORA parking tickets. Toledo's paid-parking system lets you pay via the Telpark app, and I chose PayPal as the payment method. PayPal sends a receipt email for every payment, and that receipt is the only persistent record. No Telpark API, no ORA API, no history export. After building seven parsers, adding an eighth was a quick win. The pattern was established, the Gmail OAuth was wired up, the SQLite schema was familiar. The only challenge was format drift: the same merchant has used four distinct email body formats since 2017. The euro symbol moved from after the number to before it. The verb changed from "ha autorizado" to "ha pagado" to "ha enviado." The parser tries each format in turn, falling back through them. 1,429 payments going back nine years, and it took an afternoon to add.

Format drift is the quiet enemy of every email parser. You build something that works today, and two years from now the sender changes one word and your regex stops matching. But when the pattern is established, adding a new source is cheap.

## The Metrics API: 1,142 Lines, Zero Dependencies

Once I had seven SQLite databases on disk, the question was: how do the topic agents query them?

The naive answer is "mount them into every container and let the agent run `sqlite3` directly." That works as a fallback (the Economics topic can do it), but it has three problems. First, the agent needs to know every schema, and schemas drift when I add columns. Second, enforcing read-only at the SQLite level requires a specific URI incantation that every topic agent must remember. Third, Home Assistant needs HTTP, not filesystem mounts.

The agent built a metrics API. A single Python file, 1,142 lines, using only the standard library: `http.server`, `sqlite3`, `json`, `datetime`. No Flask, no FastAPI, no `requirements.txt`. The Docker image is about 70 MB and starts in under 500 milliseconds. Twenty-four routes across four groups: meta (`/health`, `/endpoints`), combined views (`/metrics`, `/history`), per-vendor summaries, and drill-downs.

The pattern I like most is the `/endpoints` discovery route. When the agent in Economics is asked something it has not seen before ("what was my biggest card transaction last month"), it does not need to know the route surface in advance. Its CLAUDE.md says: call `/endpoints` first. The endpoint returns a self-describing list of routes with `path`, `method`, `params`, and `description` fields. The agent picks the one whose description matches the question and calls it. I can grow the API surface without updating any CLAUDE.md.

The agent also created a `docker-compose.yml` to run the API as a persistent container. Each SQLite database is mounted as a read-only bind, and the container paths mirror what the agent containers see (`/workspace/group/...`), so the same `server.py` works in both contexts. The compose file includes `restart: always`, which turned out to be important: it is what brought the API container back automatically after the VM reboot during the disk-resize incident.

One operational lesson: every time the API changed (and it changed constantly, as new databases and endpoints appeared), I had to SSH into the VM to restart the compose stack. The bot on Telegram would tell me "I updated `server.py`," and I would have to context-switch to a terminal to run `docker compose restart`. After the third time, I added a `develop.watch` block to the compose file so that changes to `server.py` auto-sync into the container and restart the process. No more SSH round-trips for API iterations.

## Home Assistant: Not Just IoT Anymore

I already had Home Assistant running for the usual things: temperature sensors, smart plugs, automations. The interesting shift is that HA is no longer just an IoT dashboard. It now aggregates financial data alongside the physical sensors.

Home Assistant pulls from the metrics API using its built-in `rest:` sensor platform. Glance cards on a kitchen tablet show this month's grocery spend, Amazon orders, electricity cost. An ApexCharts card plots 24 months of spend history per vendor as columns. The API as a unifying layer turned what could have been a custom HA component (substantial Python work) into a YAML configuration exercise.

The point is visibility. I wanted to see what was happening with my personal finances at a glance, the same way I see the house temperature. NanoClaw made the data queryable. Home Assistant made it visible. And the same API endpoint serves both the topic agents and the dashboard.

## The Day It Broke

On April 24, 2026, at 21:30 UTC, the orchestrator died. I did not notice until the next morning.

The VM had been provisioned with 30 GB, but Ubuntu's LVM installer had only allocated 14 GB to the root logical volume. The remaining 16 GB sat unused in the volume group. So the actual usable space was 14 GB, and it was at 100% utilization. The daily ORA import container reported a transient error, writing a small JSON file to the IPC directory. The write created a 0-byte file (the inode table had space, but the data blocks were exhausted). The orchestrator's IPC watcher read the file, encountered `JSON.parse('')`, and threw `SyntaxError: Unexpected end of JSON input`.

NanoClaw's quarantine path tried to move the broken file from `messages/` to `errors/`. To do that, it needed to `mkdirSync('errors/')`. That also hit ENOSPC. Now the orchestrator could neither parse the file nor move it out of the way. It re-encountered the same broken file on the next polling tick and failed again. Tight loop. The error log filled with the same trace, contributing more disk pressure.

Sixteen hours of silent outage. No Telegram alert (the alerting mechanism requires a running orchestrator). Five scheduled tasks piled up unfired.

Recovery took two steps. First, I used Claude Code on my laptop to diagnose the issue. It spotted the classic Ubuntu LVM problem immediately: `lvextend -l +100%FREE` followed by `resize2fs` gave me the full 28 GB. Then I resized the VM disk to 60 GB from the Synology VMM console, rescanned the disk inside the VM (`echo 1 | sudo tee /sys/block/sda/device/rescan`), grew the partition with `growpart`, extended the physical volume with `pvresize`, and ran `lvextend` + `resize2fs` again. Result: 57 GB root, 42 GB free. Stop the two orphaned containers. Restart NanoClaw. First reply: 84 seconds after restart.

The lesson is not "don't fill the disk." That is obvious. The real lesson has two parts. First, NanoClaw's error-handling path itself does disk writes. Under ENOSPC, the recovery mechanism is the failure mechanism. The system did not crash cleanly; it spun on its own broken quarantine. Second, Ubuntu's default LVM partitioning only uses half the disk. If you provision a 30 GB VM and assume you have 30 GB, you are wrong.

## The Agents and the Foreman

The crash exposed a boundary in the architecture that does not show up on the stack diagram but matters for understanding how the system gets maintained.

The agents NanoClaw spawns when a Telegram message arrives operate *inside* the system. Each topic's agent sees its own workspace (read-write), the shared mount (read-only), and the OneCLI-injected credentials. It cannot see the orchestrator process, cannot list other topics' files, cannot restart NanoClaw, cannot rebuild the agent image, cannot edit the source code. Those bounds are exactly why I trust them with daily operations:

| Mount or property | Admin DM (is_main=1) | Forum topics |
|---|---|---|
| `/workspace/project` (ro) | Entire repo, including src/, dist/, store/ | Not mounted |
| `/workspace/group` (rw) | Import scripts, 7 DBs, all PDFs | Topic folder (CLAUDE.md only) |
| `/workspace/extra/main-shared` (ro) | Not mounted (it is the source) | Shared CLAUDE.md |
| `/workspace/ipc` (rw) | data/ipc/telegram_main/ | data/ipc/\<topic\>/ |
| Gmail OAuth credentials | Both accounts | Not mounted |
| `requires_trigger` | 0 (every message processed) | 0 (except SystemLog: 1) |
| IPC dispatch authorization | Can target any registered chat | Can only target its own JID |

A prompt-injection attack against the Economics topic agent cannot, by construction, escalate to "delete all the SQLite databases" or "exfiltrate the Gmail credentials." The credentials are not in the container. The databases are not mounted. The IPC dispatcher enforces source-folder matching. The cost of those bounds is that the agents are architecturally incapable of meta-work. They cannot fix the system they live inside.

When the orchestrator died on April 24, none of the in-container agents could have recovered it. They ran in containers spawned by the dead orchestrator, depending on its IPC watcher to deliver their replies. The recovery path was inherently outside-in: SSH to the VM, `su - nanoclaw`, attach a Claude Code session to the shell, investigate, clean up, restart. Without that outer layer, the system would have been frozen until manual intervention from a human alone.

That outer Claude Code session sits at a different point on the trust gradient. It runs with full host privileges, can rewrite source files, can call external APIs, can run Docker commands against the host socket. Work at that privilege level should not be initiated by anyone in any Telegram chat. It should be a deliberate, synchronous, human-in-the-loop developer activity. That is exactly what a Claude Code session in a terminal is: a second AI surface, but one where the model proposes, the human reviews, and the tools run with the developer-machine authority the human already had.

The agents are the resident workforce. The Claude Code session is the foreman who comes in to extend the system, debug it, document it, or rescue it. Both are powered by the same model family. The difference is what they are allowed to touch and who initiates the conversation.

## Scheduling as Design

Fourteen scheduled tasks are active. Their cadence reflects how often each data source actually changes.

**Monthly imports** (1st of every month, 09:00): Amazon, O2, BBVA, Tagus, Iberdrola. Those providers bill monthly. Running them more often would wake the agent with no work to do.

**Daily imports** (every day, 21:00): Mercadona and ORA. Grocery orders happen weekly, parking payments happen on most weekdays. 21:00 is after the day's activity has settled, so the next morning's questions have fresh data.

**Daily summaries**: calendar agenda at 06:00 (the morning briefing), two email summaries at 21:00 (end-of-day inbox digest), ORA summary at 21:15 and Mercadona summary at 21:30 (after the imports finish, before sleep).

One scheduling pattern I like: the **daylight saving time one-shot reminders**. Spain switches between UTC+1 (winter) and UTC+2 (summer) on the last Sundays of October and March. The naive approach is to trust the tz database, which is fine for the scheduler's clock but produces no visible signal about what just changed. If a cron task suddenly runs an hour earlier or later, I will not notice for days.

So I scheduled two one-time tasks for the next two transitions. Each fires a maintenance reminder: "summer-to-winter switch happened, verify that scheduled tasks are firing at the expected wall-clock times." Explicit reminders for invisible system events. You do not trust yourself to remember; you let future-you receive a Telegram from past-you.

## What's Next

The forum-topics support is now [in progress upstream](https://github.com/qwibitai/nanoclaw-telegram/issues/115). NanoClaw's `v2` branch is 113 commits ahead of `main` with a major refactor. Migration is realistic but non-trivial: the scheduling module is gone and replaced, the routing internals are rebuilt. The import scripts and metrics API are unaffected (they only read `.db` files). The plan is to wait for v2 to stabilize and land the forum-topics work first.

Gmail OAuth refresh tokens currently live as plain JSON inside each agent container. They should move to the credential vault. And the disk-full lesson from April 24 deserves a daily SystemLog task that runs `df -h` and alerts at 80%.

I started this project before [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) had Linux support. Now that they do, I want to regenerate the entire setup inside a sandbox. The VM-as-blast-radius argument is sound, but a sandbox would give me the same isolation with better tooling and no hypervisor overhead. That is the next evolution.

The system runs. It answers questions about groceries, electricity, bank transactions, and parking. It crashed once, taught me something specific about how IPC-driven systems fail under disk pressure, and kept running after a resize. For a NAS workload that costs nothing to host, that is a reasonable trade.

---

_Resources:_
- _[NanoClaw](https://github.com/qwibitai/nanoclaw)_
- _[Vivian Balakrishnan's NanoClaw setup](https://gist.github.com/VivianBalakrishnan/a7d4eec3833baee4971a0ee54b08f322)_
- _[Home Assistant REST sensor docs](https://www.home-assistant.io/integrations/rest/)_
- _[NanoClaw Telegram forum topics issue](https://github.com/qwibitai/nanoclaw-telegram/issues/115)_
- _[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/)_
