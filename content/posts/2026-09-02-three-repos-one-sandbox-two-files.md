---
title: "Three Repos, One Sandbox, Two Files"
date: 2026-09-02 09:00:00 +0200
description: "A feature spans the engine, a kit and the docs. So my environment stopped being something I rebuilt from memory and became two files I can throw away: one declaring the machine, one declaring the behaviour."
categories: [Technology, AI, Software Development]
tags: ["docker-sandboxes", "coding-agents", "claude-code", "developer-experience", "docker"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-09-02-three-repos-one-sandbox-two-files/cover.png"
related:
  - "/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox"
  - "/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows"
---

![Three Repos, One Sandbox, Two Files](/images/posts/2026-09-02-three-repos-one-sandbox-two-files/cover.png)

Most of the work I do on Docker Sandboxes does not fit in one repository.

A single change lands in three of them. The kit spec, which is public and lives in [docker/sbx-kits-contrib](https://github.com/docker/sbx-kits-contrib). The engine that consumes that spec, which is not. And the docs page on [docs.docker.com](https://docs.docker.com/ai/sandboxes/) that tells people the thing exists. Three checkouts, three branches, three pull requests, one idea. Git has no opinion about the fact that they are the same idea, and neither does my shell.

For a while I dealt with that the way I think most people do: one agent session per repository. It does not work, and the reason it does not work is structural rather than a matter of tuning the prompt. Each session sees a third of the change. None of them can tell you whether the three parts agree. So the integration happens in the one place that holds all three, which is my head, and I spend the afternoon pasting context between terminals.

## One Feature, Three Repos

Here is the shape of the problem. The kit spec gains a field. The engine has to read that field and do something with it. The docs have to describe what the field does. Those are not three tasks, they are one task with three artifacts, and the interesting failures live exactly in the seams: the engine reads a field name the spec spells differently, or the docs describe behaviour the engine never shipped.

An agent scoped to one repo cannot see a seam. It can only see one side of it.

I wrote before about [running several agents in parallel with sandboxes and git worktrees](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows), and about [building a real app inside a single sandbox](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox). Both of those assume the same unit: one agent, one repository, one branch. That assumption is fine when the work fits in a repo. This work does not.

So the unit had to change. Not one sandbox per repo, but one sandbox holding all three, with the agent free to move between them.

That much is easy to say and was annoying to actually run.

## The Environment Is Part Of The Change

The first version of this setup was a sandbox I built by hand. Create it on one repo, then mount the second, then mount the third, then set a secret so `git push` works, then open a port so the docs preview is reachable. Six or seven commands, in an order I half-remembered.

Which was fine until the day I had to do it again. And that is the actual problem with a hand-built environment: it is not that assembling it is slow, it is that **you assemble a slightly different one every time**. The drift does not live in the environment. It lives in the rebuild.

The fix is not specific to sandboxes, or to Docker, or to my job. Any environment an agent works in wants two properties:

- **Declarable.** The definition lives in a file, in version control, next to the code it serves. Not in your shell history and not in your memory.
- **Rebuildable.** Changing it means changing the file and letting the tooling rebuild from the declaration, not reaching into a running environment and adjusting it by hand. If the rebuild is scary, you will patch the live one instead, and a patched environment is a bespoke one again.

Those two together are what "as code" has always meant. We accepted the argument for servers years ago. The part I had not internalised is that an agent's environment is not just a filesystem, and declaring the filesystem only gets you half of it.

The half I was missing is the interesting one, so let me do the easy half first.

## Half One: The Machine Side

`sbx env` reads a file. Mine is called `.sbxenv.yaml` and it sits in the parent directory of the three checkouts, which are siblings. That layout is not incidental, it is the contract: every path in the file is relative, so the file only makes sense from where the repos actually are.

Stripped to what it declares:

```yaml
schemaVersion: "1"
name: sandboxes-env
agent: claude

workspace: ./sbx-kits-contrib

additionalWorkspaces:
  - path: ./sandboxes
  - path: ./docs

kits:
  - docker.io/sbx/git-ssh-sign-kit:latest
  - docker.io/sbx/t3code-kit:latest

secrets:
  github:
    command: gh auth token

bindings:
  github:
    apiKey:
      domains:
        - api.github.com
        - github.com
        - raw.githubusercontent.com

ports:
  - sandbox: 1313
    host: 1313
```

Field by field, what each one buys:

**`workspace`** is the repo the sandbox is created on. **`additionalWorkspaces`** are the others. The distinction matters less than the fact that all three arrive at create time, declared.

**`kits`** are capabilities added to the sandbox. One of these gives me SSH commit signing inside the sandbox, the other installs the agent control surface I [wrote about last week](/posts/2026-08-28-four-agents-four-machines-one-developer). They are OCI artifacts, so they version like anything else you pull from a registry, and if you are consuming a kit rather than developing it you want a digest instead of a tag:

```bash
docker buildx imagetools inspect docker.io/sbx/git-ssh-sign-kit:latest
```

Either way a kit reference is a snapshot taken when the sandbox is created. Editing a kit does not change a sandbox that is already running: the change lands on the next rebuild.

**`secrets`** runs a command on the host and provisions the result into the sandbox. `gh auth token` means `git push` and `gh pr create` work from inside without me setting anything by hand.

**`bindings`** is an allowlist of domains that credential may be injected into. A token that works everywhere is a token you have to think about; three named GitHub hosts is one you do not.

**`ports`** forwards 1313, because one of the three repos is the docs and `hugo server` is how you know whether your page renders.

And then the part that made all of this worth doing. Because the file is the environment, changing the environment is an edit to the file rather than a command aimed at a live sandbox. Adding a kit is the case I hit most often: the new reference goes in the YAML, and the sandbox is rebuilt from the declaration instead of patched in place.

What makes that tolerable in the middle of a task is that a rebuild is not a reset. The agent's own directory rides on a volume that is carried across, so gaining a capability does not cost me the session I am in the middle of. The environment gets rebuilt. The work continues.

## Half Two: The Behaviour Side

Now the half the YAML does not cover.

Once three repos share one filesystem, you need rules that did not exist when the agent could only see one repo. Not style preferences. Rules that exist because of specific things that went wrong.

Those live in a `CLAUDE.md` in the same parent directory as the environment file, one level **above** all three checkouts. That position is the entire trick: it loads no matter which of the three repos the agent is currently working in. A per-repo `CLAUDE.md` can only ever describe its own repo, which is the same blindness as a per-repo agent session.

Three of the rules in mine only make sense in a multi-repo sandbox.

### Public And Private In One Filesystem

Two of my three repos are public and one is not. That combination creates a failure mode single-repo work does not have: the agent can **read** the private repo and **write** to the public one. Nothing about that is malicious, and nothing about it trips a permission check. It is just two capabilities that are individually fine and jointly a leak.

So the rule is about direction rather than access. Reading engine source to satisfy yourself about how something behaves: fine. Putting what you read into the public repo: not fine. And "putting it in" includes the places people forget, because they do not feel like publishing: commit messages, PR titles, branch names, a reply to a reviewer.

That last one is where it actually gets dangerous. When a reviewer on the public repo asks why something behaves the way it does, the honest answer is sitting in the private repo, and you are one helpful paragraph away from publishing it. The way out is to describe behaviour in terms of what the CLI observably does, which is both safe and, it turns out, more useful to the person asking.

There is a corollary I got wrong before I wrote it down: a follow-up issue goes in the private repo even when the fix will land in the public one. A public issue describing private behaviour is the same leak as a public comment describing it. The issue tracker felt like metadata rather than publishing. It is publishing.

### Never Work On `main`, In Any Of Them

This rule is not multi-repo in principle. It is multi-repo in practice, because three checkouts give you three chances to be on the wrong branch and no additional warning.

The wording that made it stick is: **re-check the branch, do not remember it.** A branch you verified an hour ago is not a branch you have verified now. A pull happened, a PR merged, an agent switched something. So `git rev-parse --abbrev-ref HEAD` before the first commit of any new piece of work, every time.

When this went wrong for me it was never because the rule was unknown. It was because the branch was assumed.

### The Tool Cannot Run Inside Itself

I am developing `sbx` from inside a sandbox that `sbx` created, and `sbx` needs nested virtualisation that the sandbox does not have. So the tool under development cannot run in the place I am developing it.

This has a sharp consequence for tests. The test suite that drives Docker directly runs happily inside, against the sandbox's own daemon. The end-to-end suite that drives a real `sbx` cannot run inside at all, and has to be run on the host.

The rule that matters is not "remember which is which", it is **never present results from the suite you did not run**. An agent that says "tests pass" while meaning "the half of the tests that can run in here pass" is not lying, and is still telling you something false.

The same trap applies to images. An image built inside the sandbox lands in the sandbox's daemon, which is not where the host tool looks. "I built the image" and "the host can pull the image" are different claims.

## How The Behaviour Half Travels

None of this would be worth much if the rules only existed on my laptop, so both halves ship.

The rules themselves, plus a [role skill](/posts/2026-03-25-skills-are-roles-not-commands) for issue triage, come from a kit. It is an internal one, so it is not something you can pull, but the mechanism is the ordinary one: a kit adds capability to a sandbox, and "the way we work here" turns out to be a capability like any other.

The [skills I keep on the host](/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe) get in a different way:

```bash
sbx skills import --dry-run
sbx skills import
```

That copies the host's skills directories into a store every sandbox mounts at the agent's skills path. Top-level symlinks are followed, so a skill symlinked into the host directory comes along too. The store outlives any individual sandbox, which is the point. Only a full `sbx reset` clears it.

That persistence has an edge worth knowing about. Because the store is mounted read-write and shared, a skill written there **from inside** a sandbox is executable content that will run in every other sandbox mounting the same store, and it persists on the host after the sandbox is gone.

So when a skill is missing, the move is to ask for the import to be run on the host, not to install it from inside. A missing tool is an annoyance. A tool that quietly installed itself into every future environment is a different category of thing.

It is the same instinct as the visibility rule, pointed at a different surface: notice when a write reaches further than the thing you were working on.

## Why It Takes Both

The two files fail in opposite directions when you only have one.

The environment file alone gives you three repos in a shared filesystem and no rules of engagement. Everything is reachable, nothing says which reachable things are a bad idea, and the leak from private to public is available to a well-meaning agent on its first commit.

The rules alone give you rules with nowhere to apply them. Every session starts by reconstructing the environment they assume, and describing a setup precisely is not the same as being able to reproduce it.

Together they make the environment reproducible in both senses that matter: the same files, and the same behaviour on top of them. That is what I actually want from "as code" and what declaring only the machine never gave me. It is also the same lesson we hit on the team scale, where [the way a fleet of agents works](/posts/2026-05-04-a-virtual-agent-team-at-docker) had to be written down before it could be shared.

I will not pretend the rules file was designed. It grew, and the honest way to read it is as a list of things that went wrong once, each written down at the point where writing it down became cheaper than being careful. The two rules at the top of the file are the two that have been broken.

## Next

The kit that ships the rules half is the piece I have not explained: how you build one, what goes in it, and how "the way this team works" gets packaged so it arrives with the environment instead of after it. That is the next post.

## Closing

An agent environment is not just the files it can see. It is the files plus what the agent is allowed to conclude from them, and only one of those two things is normally written down.

So the question I would ask of any agent setup, including yours: if you had to stand it up again tomorrow on a different machine, what would you get back? If the answer is the filesystem but not the judgement, you have declared half an environment.

---

## Resources

- *[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/)*
- *[docker/sbx-kits-contrib](https://github.com/docker/sbx-kits-contrib)*
- *[docker/docs](https://github.com/docker/docs)*
- *[mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills)*
