---
title: "YOLO Mode Can Be Safe"
date: 2026-09-23 18:00:00 +0200
description: "The argument I gave at ContainerDays Hamburg: the thing that makes a coding agent productive is the same thing that makes it dangerous, and you do not fix that by asking it to be careful."
categories: [Technology, AI, Software Development]
tags: ["docker-sandboxes", "sbx", "coding-agents", "developer-experience", "docker", "security"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-09-23-yolo-mode-can-be-safe/cover.png"
related:
  - "/posts/2026-09-02-three-repos-one-sandbox-two-files"
  - "/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows"
  - "/posts/2026-03-18-the-six-levels-of-ai-assisted-development"
  - "/posts/2026-02-24-coding-with-agents-like-tesla-autopilot"
---

![YOLO Mode Can Be Safe](/images/posts/2026-09-23-yolo-mode-can-be-safe/cover.png)

This is the first in a series on Docker Sandboxes, which is what I spend my days building. That's the disclosure up front: I'm not reviewing this product, I'm making the case for something I help make.

It's the talk I gave at [ContainerDays Hamburg](https://www.containerdays.io/containerdays-hamburg-2026/agenda/) on 2nd September, turned into prose, so the argument has somewhere to live.

The argument is short. The thing that makes a coding agent useful is autonomy. Autonomy is also the entire risk. You cannot manage that risk by asking the agent to be careful, and the reason is structural rather than a matter of tuning.

## A New Week, A New Coding Horror Story

You have seen these. They arrive roughly weekly.

The one I used in the talk is from [Son Luong](https://x.com/sluongng), on 30th May. He asked Codex to do something that needed root on a machine where he had deliberately not given it sudo. Codex could not use `sudo`, and `run0` did not work non-interactively. So it noticed his user was in the `docker` group, started a container as root, bind-mounted `/etc` from the host into it read-write, and copied a config file over the live one from inside.

That is not a jailbreak. Nobody tricked the model. It was asked to accomplish a task, it enumerated the capabilities actually available to it, and it found the one that worked. Membership of the `docker` group **is** root, transitively, and it always has been. The agent just read the situation more literally than we usually do.

This is the part I want to hold on to, because it reframes everything that follows. The agent didn't misbehave. It behaved correctly with respect to a boundary that was never really there.

## More Autonomy Buys More Productivity

Here's the spectrum I used in the talk, and it is the reason nobody is going to solve this by using agents less.

| Level | What it is | Where it runs |
| --- | --- | --- |
| Search assistant | ChatGPT in a browser tab | Web app |
| Code assistant | IDE autocomplete | In the editor |
| Pair programmer | Chat inside the IDE | In the editor |
| Task executor | You hand it a task and walk away | Terminal, out of flow |
| Autonomous teammate | It picks work up and runs | CI/CD, out of flow |

Read down it and one thing increases monotonically: how much the agent can do without you in the loop. Productivity tracks that. I cut the same territory a different way in [the six levels of AI-assisted development](/posts/2026-03-18-the-six-levels-of-ai-assisted-development).

Now read it again and something else increases in step: the blast radius. A search assistant cannot delete your `~/.aws`. An autonomous teammate absolutely can, and the whole point of it is that you are not watching when it does.

So the honest question isn't "how do we make agents safer by giving them less". It is: what can the agents reach in your org, right now, today?

For most people the answer is "whatever I can reach", because the agent runs as me, on my machine, with my keys.

## The Asymmetry

I split this across two slides, and I still think it's the crux:

> You have to be right every time. Agents only need to be right once.

Defence has to hold on every prompt, every session, every tool call, forever. The failure only has to happen once, and it doesn't even have to be adversarial. Nobody has to attack you. Non-determinism plus a wide enough capability surface gets there on its own, eventually, on a Tuesday.

And the industry's answer to this has largely been vibes. I collected the genre on a slide: "don't fail to me bro", "careful please 🙏", "make no mistakes". These are not controls. They are prompts, they live inside the thing you are trying to constrain, and a model that is optimising for task completion will route around them exactly as cheerfully as Codex routed around the missing sudo.

You cannot ask the thing inside the boundary to enforce the boundary. The boundary has to be somewhere the agent cannot reach.

## So Put It in a Box

If the boundary cannot live inside the agent, it has to live around it. That means giving up on governing what the agent decides to do, and governing what its decisions can reach instead.

![A robot walking into a shipping container labelled SANDBOX](/images/posts/2026-09-23-yolo-mode-can-be-safe/into-the-box.png)

The mechanism is less clever than it sounds: the agent gets a whole machine, and the machine is not yours.

So: `sbx`.

```console
$ brew install docker/tap/sbx
$ cd ~/my-project
$ sbx run claude
```

That is it. That is the interface. You are now in Claude Code, or your preferred coding agent, in a microVM, and the agent inside has `sudo`, its own Docker engine, and permission to do whatever it likes to its own filesystem.

## What the Box Actually Is

![Docker Sandboxes architecture: control plane on the host, agent container inside an isolated microVM](/images/posts/2026-09-23-yolo-mode-can-be-safe/sandbox-architecture.png)

That is the plumbing: a control plane on your host, and one microVM per sandbox with the agent and its own Docker engine inside it. The part that carries the argument is not in the boxes, though. It is that the isolation is five separate boundaries rather than one big one.

**Hypervisor.** Each sandbox is a microVM with its own Linux kernel. Not a container sharing yours. Processes inside are invisible to your host and to every other sandbox, and symlinks pointing out of the workspace are not followed. This is the layer that makes the Codex story impossible rather than merely discouraged: there is no host `/etc` to bind-mount, because there is no host.

**Network.** Every sandbox gets its own network, and all outbound TCP is blocked unless a rule allows the destination. Not "logged", not "warned". Blocked, by default, including SSH. UDP and ICMP do not leave at all, and DNS goes through an internal resolver that enforces the same policy. `sbx policy ls` shows you what your machine currently allows.

**Docker engine.** The agent gets a real, private Docker daemon inside the VM. It can build images, run containers, mount volumes, and it is nowhere near the daemon running your actual work. This layer gets its own post later in the series, because "the agent can run your integration tests for real" turns out to be a bigger deal than it sounds.

**Workspace.** You choose what the agent can see. `sbx run` mounts the current directory and nothing else. `sbx create` with no path gives it no host filesystem at all. Clone mode mounts your repo read-only and lets the agent work in a private clone.

**Credential proxy.** This is the least obvious layer, so plainly: the agent can push to GitHub without ever holding your token. Credentials are injected into outbound requests by the proxy on the host, outside the boundary. The agent makes the request; the header appears on the way out. Nothing inside the VM can read the value.

None of these is novel on its own. The useful part is that they compose, and that the composition has a default posture rather than a configuration exercise.

## The Equivalence That Has to Hold

Here's the part that makes or breaks the whole thing, and it is a product claim rather than a security one.

```
sbx run claude  ===  claude
```

If using the sandbox costs you anything, in startup time, in fidelity, in "hang on, this works on my machine but not in there", you will not use it. You will disable it exactly once, on the afternoon you are in a hurry, and never turn it back on. That is the usual fate of a security control that charges rent.

So the target is not "safe". The target is **safe and indistinguishable**. Same agent, same CLI, same auth you already have, same repo at the same absolute path, so your stack traces and config files still point at paths you recognise. If it is a different experience, it is a failed one.

That is also why the escape hatches are real. Kits extend a sandbox declaratively when the default box is not enough, and that is a follow-up post. The environment itself can be a file you commit, which I [wrote about a few weeks ago](/posts/2026-09-02-three-repos-one-sandbox-two-files) while building my own three-repo setup.

## But

Everything so far is about what the agent cannot reach. None of it is about what you hand it on purpose.

![A steel toe cap takes the impact, but only for the foot it covers](/images/posts/2026-09-23-yolo-mode-can-be-safe/steel-toe.png)

A steel toe cap protects the foot. It does not protect anything the boot does not cover, and it has no opinion about where you choose to stand.

So: a sandbox stops the agent touching your host. It does not stop the agent misusing what you legitimately gave it. If it can reach the network, and you handed it a real credential and real data, nothing inside the box prevents those two facts being put together and sent somewhere. That is not a hole in the isolation. It is the isolation doing exactly what you configured, because you granted the reach and you granted the secret.

The layers narrow this. The credentials proxy means the agent never holds the raw token. Default-deny means it only reaches hosts you allowed. Neither of them answers "should this agent have production data at all", and that question does not have a technical answer. It stays with the person handing over the keys.

## Speed and Safety Are Not a Trade

The framing I want to leave you with, because I think the usual one is wrong.

Speed without safety is chaos, and everybody agrees on that one. The half people skip is that safety without speed is paralysis, and paralysis is what you actually get from permission prompts, from approval queues, from running the agent in read-only mode and copy-pasting its suggestions by hand. Those are not safe. They are just slow, and slow tools get bypassed, which makes them unsafe on a delay.

So the two were never really in tension. Prompt-and-approve buys safety by spending your speed, which is why it runs out. A boundary buys it by spending nothing, which is why it does not.

YOLO mode can be safe. Not because the agent became trustworthy, but because you stopped needing it to be.

Run agents. Freely, safely.

## Thank You, Oleg

[Oleg Šelajev](https://www.linkedin.com/in/shelajev/) inspired this talk, and he shared his slides and illustrations so I could build it. The drawings in this post are his (or his agents').

## Next

Kits: what they declare, and what is changing in the spec.

---

_Resources:_
- _[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/)_
- _[Install `sbx`](https://docs.docker.com/ai/sandboxes/install/)_
- _[Community kits on GitHub](https://github.com/docker/sbx-kits-contrib/)_
- _[Published kits on Docker Hub](https://hub.docker.com/u/sbx)_
- _[The workshop repo from ContainerDays](https://github.com/mdelapenya/sbx-workshop)_
- _[Slides: YOLO Developer Workflows with a Coding Agent in a Box](/slides/2026-09-containerdays-hamburg/ContainerDays-Hamburg-YOLO-Developer-Workflows.pdf)_
- _[Video: the same talk at WeAreDevelopers World Congress, July 2026](https://youtu.be/NBgqwL-1qnU)_
- _[Report a bug or request a feature](https://github.com/docker/sbx-releases/issues)_
