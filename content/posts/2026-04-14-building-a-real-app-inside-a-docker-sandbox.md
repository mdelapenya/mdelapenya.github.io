---
title: "Building a Real App Inside a Docker Sandbox"
date: 2026-04-14 09:00:00 +0200
description: "A step-by-step guide to building a real app inside a Docker Sandbox: from sbx create to network policies, port forwarding, and shipping. Safe and practical."
categories: [Technology, AI, Software Development]
tags: ["docker", "coding-agents", "docker-sandboxes", "tutorial", "developer-experience"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox/cover.png"
related:
  - "/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows"
  - "/posts/2026-02-24-coding-with-agents-like-tesla-autopilot"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
---

![Building a Real App Inside a Docker Sandbox](/images/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox/cover.png)

I started [renfe-maps](https://renfe-maps.vercel.app) in January using GitHub Copilot's agent mode directly on GitHub. I opened issues, Copilot opened PRs, I merged them. The first PR scaffolded the entire app in one shot: GoFiber backend, React frontend, everything wired up. The second added documentation. A third tried to add GCP deployment with Terraform; I closed it without merging. It worked for bootstrapping, but the workflow was all or nothing: the agent generated a massive PR, I reviewed it on the web, merged or closed. No iteration, no watching it work, no course correction mid-task. Three months later I picked the project back up, this time with Claude running inside a Docker Sandbox. Thirty-eight commits later, the app is live at [renfe-maps.vercel.app](https://renfe-maps.vercel.app), and the agent did the work directly in the codebase without ever touching my host. Here's exactly how I did it, step by step.

## What You'll Build

[renfe-maps](https://renfe-maps.vercel.app) is a real-time train tracker for Spanish railways. It shows live train positions on Google Maps using GTFS Real-Time data from Renfe, with delay indicators, station markers, and SSE streaming. The final stack is Next.js, TypeScript, and the Google Maps API. The repo is private for now.

But this post isn't about how to build a train tracker. It's about how to build *any* app inside a Docker Sandbox. renfe-maps is the vehicle. The workflow is the point.

## Why a Sandbox

**Safety.** On my host, I don't want the agent to do what it wants. In a sandbox, I want the agent to do what it needs. That's the entire mental model. The sandbox is a microVM with its own Docker daemon, filesystem, and network. The agent can install packages, run servers, `rm -rf node_modules` and start over. Inside the sandbox, that's not reckless. That's the agent doing its job. My host never notices.

**Practicality.** You get a reproducible dev environment that survives restarts, with built-in network governance and port forwarding. No Dockerfile needed. No devcontainer config. Just `sbx create` and you're running. I've written about the [conceptual model behind sandboxes and parallel workflows](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows) before. This post is the hands-on companion.

## Step 1: Install and Log In

```bash
brew install docker/tap/sbx
sbx login
```

The first time you run `sbx login`, it prompts you to choose a default network policy. Pick **Balanced**. It allows common developer services (GitHub, npm registry, Docker Hub) while blocking everything else. You can fine-tune it later.

If you want a full tour of everything `sbx` can do, the [sbx-quickstart](https://github.com/dockersamples/sbx-quickstart) repo is a great reference. It walks through every feature with a sample app that has intentional bugs for the agent to fix.

## Step 2: Create the Sandbox

From your project root:

```bash
sbx create --name renfe-maps claude .
```

This spins up a microVM, bind-mounts your project directory into it, and configures Claude as the agent. Your files are shared between host and sandbox: changes the agent makes inside the sandbox appear on your host filesystem in real time.

To attach and start working:

```bash
sbx run renfe-maps
```

You're now inside the sandbox. Claude has full control of the environment, but nothing it does can reach your host beyond the mounted workspace.

## Step 3: Give the Agent a Role First

Before writing a single line of code in the sandbox, I wrote a skill. Specifically, a product-owner skill with acceptance criteria, the GTFS-RT data model, and the feature backlog.

Why first? Because [skills are roles, not commands](/posts/2026-03-25-skills-are-roles-not-commands). A skill that says "you are the product owner for renfe-maps, here's what the app should do and why" forces a product mindset from the start. The agent doesn't just write code. It understands what the app should do, what the acceptance criteria are, and what to prioritize. That framing shaped every task that followed.

## Step 3.5: The Skill Evolves

The skill didn't stay static. It evolved with every iteration. As I built features, the product-owner skill accumulated learnings: which APIs existed, which fields they returned, what the acceptance criteria were for each endpoint. By the end, it included a full scope comparison table, a priority backlog, and a feature opportunities document tracking gaps against the official Renfe app.

That feature opportunities file is where things got interesting. In March 2026, Renfe launched `tiempo-real.largorecorrido.renfe.com`, an official real-time viewer for long-distance trains. I discovered it exposed undocumented JSON endpoints with fleet positions and full route geometry. But it had limitations compared to what I had in mind: it only covers AV, LD, and MD services (no Cercanias), has no open API, no alerts, no train spec cards, and polls every 15 seconds instead of streaming. The skill tracked all of this, so the agent always knew where renfe-maps was ahead of the official app and where it still had gaps to close.

## Step 4: Open the Network

This is the key sandbox moment.

Remember the `tiempo-real.largorecorrido.renfe.com` endpoint from the previous step? When the agent tried to fetch it from inside the sandbox, this happened:

> Blocked by the sandbox firewall. Let me try via curl:
>
> `curl -s -o /dev/null -w "%{http_code}" "https://tiempo-real.largorecorrido.renfe.com/flotaLD.json?v=$(date +%s)"` → **403**
>
> The sandbox blocks that domain. You'd need to allow it:
> `sbx policy allow network tiempo-real.largorecorrido.renfe.com`

The agent diagnosed it, told me exactly what to run, and waited. That's the Balanced network policy doing its job: unknown domains are blocked by default. The agent can't reach arbitrary URLs, and Renfe's subdomains aren't in the default allowlist.

I added each one:

```bash
sbx policy allow network gtfsrt.renfe.com
sbx policy allow network data.renfe.com
sbx policy allow network ssl.renfe.com
sbx policy allow network tiempo-real.largorecorrido.renfe.com
```

Verify with:

```bash
sbx policy ls
```

This is the safety model in action. The agent can fetch train data. It can't reach anything else. You decide what's allowed, domain by domain. If the agent tries to hit a domain that's not on the list, the request fails. You see it in the policy log, add it if it's legitimate, and move on.

## Step 5: Forward the Port

I asked the agent to start the dev server. It did, and then told me what to do next:

> `npm run dev` → Dev server is running on http://localhost:3000 (200 OK). To access it from your browser, you'll need to publish the port from the sandbox. Run this in a separate terminal:
>
> `sbx ports <sandbox-name> --publish 3000:3000/tcp`
>
> Then open http://localhost:3000 in your browser.

Same pattern as the network policy: the agent hit a boundary, diagnosed it, and told me the exact command. I published on port 3001 instead to avoid conflicts with other services on my host:

```bash
sbx ports renfe-maps --publish 3001:3000
```

One thing to know: services inside the sandbox must bind to `0.0.0.0`, not `127.0.0.1`. If the app binds to localhost only, port forwarding won't work. Most frameworks default to `0.0.0.0` in development mode, but it's worth checking if you see a blank page.

Now open `http://localhost:3001` in your browser. You're looking at the app running inside the sandbox, rendered on your host. Every time the agent makes a change and the dev server reloads, you see it here. No need to enter the sandbox to check what's going on.

## Step 6: Iterate

Here's what a typical cycle looks like.

I give the agent a task: "add delay indicators to train markers, color-coded by severity." The agent works in the attached terminal. I watch it install dependencies, modify components, and restart the dev server. I check localhost:3001. The markers have colors. The red ones are late trains. Good. I move on to the next task.

If something looks off, I redirect immediately. "The delay threshold is wrong, anything under 2 minutes should be green, not yellow." The agent adjusts. I refresh. Fixed.

For larger features, `sbx` supports branch mode:

```bash
sbx run renfe-maps --branch feature-delays
```

This creates an isolated git worktree inside the sandbox. The agent works on its own branch without affecting main. Useful when you want to run multiple sandbox sessions in parallel on different features.

## Step 7: Ship

The workspace directory is bind-mounted. Every change the agent makes inside the sandbox is already on my host filesystem. I don't push from inside the sandbox. I push from my machine.

Why? Because [I'm the driver](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot). I monitor the work, review the diff, and decide when to commit and push. The agent proposes. I dispose.

```bash
git add -A
git commit -m "feat(trains): add delay indicators with color coding"
git push
```

CI runs on GitHub Actions. Vercel picks up the push and deploys. The sandbox's job is done for this task.

When I'm finished for the day:

```bash
sbx stop renfe-maps
```

The next morning, `sbx run renfe-maps` picks up where I left off. Installed packages, configuration, network policies, port mappings: everything survives the stop. The sandbox is my persistent dev environment. I just pause it and resume.

If I want to continue in the same Claude conversation (keeping the full context from yesterday), I pass `-c` through to Claude using a double dash:

```bash
sbx run renfe-maps -- -c
```

Everything after `--` is forwarded as arguments to the running Claude instance. `-c` resumes the last conversation, so the agent remembers what we were working on.

## January vs. April

In January, the workflow was: open the Agents UI on GitHub, create a prompt, let Copilot's agent generate a PR, review the diff on the web, merge or close. The first PR added the entire app in one shot. There was no way to say "wait, that API endpoint should return GeoJSON, not raw coordinates" while the agent was working. By the time I saw the code, it was a finished PR. My only options were merge or close.

In April, the workflow was: attach to the sandbox, give the agent a task, watch it work, and hit Escape the moment it went in the wrong direction. I'm not afraid of cancelling the agent mid-execution to steer it. That's the whole point of being in the same terminal: I see what it's doing, and if the approach is wrong, I stop it, give it better context, and let it try again. Check the result at localhost:3001, redirect if needed, repeat. Thirty-eight commits, each scoped to a specific feature or fix. Conventional commit messages. A product-owner skill that kept the agent focused on what mattered.

The difference isn't just the tool. It's the feedback loop. The sandbox made it safe to let the agent run autonomously (microVM isolation, network governance, no host access). The skill made it effective (product context, acceptance criteria, clear priorities). The port forwarding made it verifiable (real-time visual feedback without entering the sandbox).

Bootstrapping with Copilot on GitHub was fast. Iterating with Claude in a sandbox was precise.

## What I'd Do Differently

**Set up network policies before the first `sbx run`.** I hit blocked requests on my first attempt to fetch Renfe data and spent time debugging what turned out to be a missing `sbx policy allow`. Now I add all required domains before I even attach to the sandbox.

**Use branch mode from the start.** I committed directly to main for the first few features. Branch mode would have given me cleaner history and the ability to throw away experiments without reverting commits.

The sandbox workflow clicked faster than I expected. The learning curve is mostly in the network policies: figuring out which domains your app actually needs. Once that's set, the rest is just building.

*Full disclosure: I'm part of the team building Docker Sandboxes at [Docker](https://www.docker.com/). I didn't write this post because someone asked me to. I wrote it because I needed a train tracker and the sandbox was the best way to build it. If we couldn't dogfood our own product on a weekend side project, we'd have a problem.*

---

_Resources:_
- _[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/)_
- _[sbx-quickstart tutorial repo](https://github.com/dockersamples/sbx-quickstart)_
