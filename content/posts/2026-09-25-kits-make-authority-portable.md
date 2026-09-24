---
title: "Containers Made Software Portable. Kits Make Authority Portable."
date: 2026-09-25 09:00:00 +0200
description: "A Dockerfile answers everything about the inside of an image and nothing about what it is allowed to reach. For an application that was fine. For an agent it is the interesting half, and it is the half kits are for."
categories: [Technology, AI, Software Development]
tags: ["docker-sandboxes", "sbx", "kits", "coding-agents", "docker", "oci"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-09-25-kits-make-authority-portable/cover.png"
related:
  - "/posts/2026-09-23-yolo-mode-can-be-safe"
  - "/posts/2026-09-02-three-repos-one-sandbox-two-files"
  - "/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows"
---

![Containers Made Software Portable. Kits Make Authority Portable.](/images/posts/2026-09-25-kits-make-authority-portable/cover.png)

[In the first post of this series](/posts/2026-09-23-yolo-mode-can-be-safe) I argued that the only boundary an agent cannot argue with is one it cannot reach, and that a microVM is that boundary. That post ends where this one starts, because an empty box is not an environment.

Something still has to say which agent runs in it, which tools it gets, which MCP servers it can talk to, what guidance shapes it, and exactly what it is allowed to touch. That is the thing kits describe. I work on the team building the spec for them, and [Christian Dupuis](https://www.linkedin.com/in/christiandupuis/), the team's tech lead, leads the v3 design. The v3 spec is a genuinely different answer from v2, so this is a good moment to write down why.

## The Half a Dockerfile Never Answered

A Dockerfile answers everything about the software itself. How it's built, what gets packaged, how it starts: entrypoint, command, user, environment. That answer was worth a decade of tooling, because the same bits build, pull and run the same way on every machine that has ever heard of an OCI image.

Then we started shipping agents, and an agent is not an application workload.

A container isolates an application: a thing that runs, does its job, and touches only what it was handed. An agent is an actor. It decides what to do next and then does it, to your filesystem, your network, your databases, your cloud account, with authority you granted on purpose.

That authority is not a flaw to be closed off. It is the point. An agent that cannot install a dependency, reach an API or hold a credential cannot do the job. But every grant trades away a piece of the isolation you were counting on, which is how the capabilities that make an agent useful end up dissolving the walls around it.

A Dockerfile specifies the inside of the image completely and the outside not at all. So the other half has always lived somewhere else: in `docker run` flags, a Compose file, a CI config, an onboarding doc, and whatever the person who set it up still remembers. Outside the artifact, unversioned, unreviewable.

That is the gap. Not "how do I install the agent", which images solved. **What is this thing allowed to do**, and where is that written down.

## Authority You Can Diff

Here's the payoff, and it matters more than any particular YAML field.

When the next version of an agent asks for another credential, or another network destination, that is not a software update. It's a change in authority. Today that change is invisible: you bump a tag, the agent starts reaching somewhere new, and nothing in your review process had an opinion about it.

Put the declaration in the artifact and it shows up in the diff. It can stop for approval. It travels with the thing it describes, wherever that thing runs.

Which is also why this is a specification rather than a product feature. A kit that stops being useful because you ran it somewhere else is not a trust boundary, it is lock-in.

## A Kit Is Just an Image

The v2 shape was a `spec.yaml` plus an optional `files/` directory, pushed as its own OCI artifact type. It worked. It also meant every registry, scanner, signer and mirror in the world had to learn a new noun before it could handle one properly.

v3 makes a different bet, and it's the design decision that most of the rest follows from:

**A kit is one OCI image.** The manifest annotation `vnd.docker.sandbox.kit.descriptor` carries the declarations. The layers carry the content.

So a kit pulls with `docker pull`. It inspects with `regctl`. You can `FROM` it. A registry that has never heard of kits stores one correctly, and an engine that ignores the annotation still runs it as an ordinary image. The declarations ride in the same artifact as the content, under the same digest, so there is no second place to look and nothing to keep in sync.

The tenet behind it: the cost of a new artifact format is not writing it, it's the decade of tooling that doesn't know about it.

## Workloads and Mixins

A kit is one of two kinds, and you compose a set from them. (A third `kind`, `set`, exists only at build time. More on that below.)

| Kind | Its layers are | Per composition |
| --- | --- | --- |
| `workload` | A root filesystem. The image config supplies entrypoint, cmd, env, user, workdir. | Exactly one |
| `mixin` | An overlay that lands on the workload's filesystem. May carry no content at all and only declare. | Zero or more |

The workload is the thing that runs. Mixins add to it: a CLI, a credential binding, a network rule, a piece of context for the agent. The network rule is the clearest case of a mixin with no files in it at all: "this environment may reach `api.github.com`" is a declaration, not content.

Here's a real one. A mixin that adds the GitHub CLI:

```yaml
# gh.yaml
# syntax=docker/sandbox-kit:3
schemaVersion: "3"
displayName: GitHub CLI
description: gh from nixpkgs, pinned by commit, as a self-contained overlay
sourceUrl: https://github.com/cli/cli
licenses: [MIT]

kind: mixin

provides: ["gh@2.72.0"]

capabilities:
  - type: com.docker.sandbox/network-policy@1
    config:
      runtime:
        allow: [github.com, api.github.com, uploads.github.com]

  - type: com.docker.sandbox/credential@1
    optional: true
    description: GitHub API access for gh
    config:
      service: github
      phase: runtime
      apiKey:
        name: GH_TOKEN
        proxyManaged: true
        inject:
          - {domain: api.github.com, header: Authorization, format: "Bearer %s"}

  - type: com.docker.sandbox/agent-context@1
    config:
      contentFile: ./gh-context.md
```

Read that as a permission request and it is completely legible: this thing wants to reach three GitHub hosts, wants a GitHub token it will never actually see (`proxyManaged`, injected at the proxy, exactly the mechanism from the first post), and wants to add a page of guidance to the agent's context.

Now notice what is **absent**. There is no name, no image reference, no entrypoint, no environment. Those live where images already keep them. Every OCI image carries a config alongside its layers, and that config is where `ENTRYPOINT`, `CMD`, `ENV`, `USER` and `WORKDIR` from a Dockerfile end up. A kit is an image, so its runtime contract is that config, untouched. Its identity is the reference you pull it by, the same as any other image. The descriptor only adds what the image cannot already say.

`provides: ["gh@2.72.0"]` looks like a name, but it answers a different question: what this kit supplies, so that another kit's `requires` can match it. What the file is called is not something the descriptor decides.

Restating the name or the runtime contract in the descriptor would create two answers to one question, and one of them would go stale.

Decoding is strict: an unrecognized field is an error, not a warning. A misspelled key would otherwise be a policy silently absent, and a permission silently dropped is indistinguishable from one never requested.

## One List for Everything

The field I would point at if I could only point at one is `capabilities`.

Resource grants (volumes, ports, devices) and engine-executed behaviours (lifecycle hooks, agent context) go through the same list. One typed, versioned entry per ask. Which means a host reviews exactly one list to decide what a kit may do, and a kit has exactly one way to ask.

The alternative, which is what most systems grow into, is a patchwork: a `volumes:` block, a `network:` block, a `hooks:` block, each with its own rules about what happens when the host doesn't support it. With one list, support is a question with a single answer. A required request the host cannot meet fails resolution closed. An optional one is skipped and recorded.

The `@1` in `com.docker.sandbox/network-policy@1` is the version of *that type's config schema*, not of the spec. So a capability type can change shape on its own clock without a grammar bump, and a host can support types the grammar has never heard of. Unknown types are carried opaquely rather than rejected, which is how anyone can define their own under their own namespace.

## Composition Is a Function, Not a Sequence

You launch a set: one workload plus any number of mixins. A conforming runtime treats that set as **closed**. Every `requires` must be satisfied from inside the set or resolution fails. Nothing is fetched implicitly.

It fails on `conflicts`, it insists on exactly one workload, and it orders composition by the dependency graph rather than by the order you happened to type the flags in.

That last one sounds like a detail and is the whole thing. Because the result is a pure function of the resolved set, the same set always composes to the same image, which is what makes a composition lockable, reproducible and worth caching. Order-dependent composition is the reason "it works on my machine" survived containers in the first place.

## And Sets, So You Do Not Retype It

A set you have to retype isn't really shareable. So a kit can take its content from other kits instead of from a Dockerfile:

```yaml
# team-claude.yaml
# syntax=docker/sandbox-kit:3
schemaVersion: "3"
kind: set
displayName: Team Claude environment
version: "1.0.0"

kits:
  - ref: docker.io/dockerdev/sbx-kit-shell:1.0.0
  - ref: docker.io/dockerdev/sbx-kit-claude-mixin:2.1.6
    args:
      version: "2.1.6"
  - ref: docker.io/dockerdev/sbx-kit-gh:2.72.0
```

Building that resolves each one, checks the set is coherent, and merges their layers and declarations into **one ordinary kit**. Network rules union. Hooks concatenate in dependency order. Guidance becomes one document. Two of them asking for incompatible things fails the build instead of picking a winner. Members that declare args can be given them here, which is what the `version` under the claude mixin is.

`kind: set` never reaches a consumer: publishing derives `workload` or `mixin` from what it lists, because a merged set really is one or the other. What survives is the `kits:` list, pinned by digest, as the record of how the content was produced.

The trade is worth knowing before you reach for it. A merged set is a pinned artifact: one reference, one digest, one pull, and bumping any one of its kits means republishing the set. It is also not a way to hide what is inside. The permission surface is the union of everything the members ask for, gated exactly as usual.

## Four Ways to Write One

The descriptor is YAML and the content recipe is ordinary Dockerfile text. How you connect them is your call:

1. **Companion pair.** `gh.yaml` next to `gh.dockerfile`, matched by filename stem. Your Dockerfile tooling keeps working, because it is still just a Dockerfile.
2. **Inline `build:` block.** The Dockerfile text embedded in the descriptor, so the kit is a single file.
3. **Comment descriptor.** A Dockerfile carrying its declarations in a `# kit:` comment block, so the file is both.
4. **Kit set.** The `kits:` list above.

All four produce ordinary kit images. A BuildKit frontend, dispatched by the `# syntax=docker/sandbox-kit:3` line (the first line of the real file; the filename comments above are labels), validates the descriptor, builds the content and publishes both as one image.

## Where This Actually Is

The v3 spec went public on 24th September 2026: announced at WeAreDevelopers, licensed Apache 2.0, and [on its way to the CNCF](https://www.docker.com/blog/docker-sandbox-kit-spec-cncf/) the same day. That last part is the lock-in argument from earlier made structural. Ten years ago Docker handed the image format and runc to the Linux Foundation, the OCI formed around them, and that is why an image built anywhere runs anywhere. Doing the same for what an agent may do means Docker Sandboxes is the first runtime that enforces the spec, not the only one that can.

The text lives at [docker/sandbox-kit-spec](https://github.com/docker/sandbox-kit-spec/): the normative spec, the JSON Schema, the BuildKit frontend and the conformance suites, with a getting-started walkthrough that takes you from an empty directory to a kit you can run.

It is **experimental**, and that word is doing real work: the spec is published to be used and argued with, and a final version is targeted for Q4 2026. Changes until then are meant to stay additive, which is what the per-type `@1` is for. A contract that has to change ships as `@2` next to the `@1` it joins, both stay published, and a descriptor names the one it was written against. A descriptor-wide `schemaVersion` bump is the last resort. If a kit you want to write cannot be expressed, that is exactly the feedback the repo's issue tracker is for.

Kits that exist and run today are the v2 ones in [docker/sbx-kits-contrib](https://github.com/docker/sbx-kits-contrib), published to [Docker Hub](https://hub.docker.com/u/sbx) and usable right now:

```console
$ sbx run --kit "docker.io/sbx/code-server-kit:latest" claude
```

The published spec for the format those use is [`SPEC-v2.md`](https://github.com/docker/sbx-kits-contrib/blob/main/spec/SPEC-v2.md), and the OCI packaging rules are [`OCI-v2.md`](https://github.com/docker/sbx-kits-contrib/blob/main/spec/OCI-v2.md), both in the same repo.

## The Sentence

The thing I keep coming back to, and the reason I think this is worth a spec rather than a feature, is the line Docker used in [the announcement](https://www.docker.com/blog/docker-sandbox-kit-spec-cncf/):

Containers made software portable. Kits make authority portable.

The second one is harder, because authority is the part everybody currently keeps in their head.

## Next

Creating a sandbox by hand, turning on SSH, and driving the agent inside it from my own harness.

---

_Resources:_
- _[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/)_
- _[Kits overview](https://docs.docker.com/ai/sandboxes/customize/kits/)_
- _[The v3 kit specification, docker/sandbox-kit-spec](https://github.com/docker/sandbox-kit-spec/)_
- _[Docker Brings Sandbox Kit Spec to the CNCF, on the Docker blog](https://www.docker.com/blog/docker-sandbox-kit-spec-cncf/)_
- _[Community kits on GitHub](https://github.com/docker/sbx-kits-contrib/)_
- _[Published kits on Docker Hub](https://hub.docker.com/u/sbx)_
- _[`SPEC-v2.md`, the published kit format](https://github.com/docker/sbx-kits-contrib/blob/main/spec/SPEC-v2.md)_
- _[Report a bug or request a feature](https://github.com/docker/sbx-releases/issues)_
