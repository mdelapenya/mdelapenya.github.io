---
title: "Understanding Docker Sandboxes: Isolate the Agent, Keep Your Tools"
date: 2026-09-29 09:00:00 +0200
description: "Putting the agent in a microVM usually costs you the editor and harness you work in. It does not have to. Every tool that speaks SSH attaches to a sandbox unchanged, and the reason that is free is also the reason it is safe: there is no key, no port and no SSH server in the box."
categories: [Technology, AI, Software Development]
tags: ["docker-sandboxes", "sbx", "t3code", "coding-agents", "ssh", "developer-experience"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-09-29-isolate-the-agent-keep-your-tools/cover.png"
related:
  - "/posts/2026-09-23-yolo-mode-can-be-safe"
  - "/posts/2026-09-25-kits-make-authority-portable"
  - "/posts/2026-08-28-four-agents-four-machines-one-developer"
  - "/posts/2026-03-13-choosing-a-terminal-for-agentic-development"
  - "/posts/2026-09-02-three-repos-one-sandbox-two-files"
---

![Understanding Docker Sandboxes: Isolate the Agent, Keep Your Tools](/images/posts/2026-09-29-isolate-the-agent-keep-your-tools/cover.png)

The [first post](/posts/2026-09-23-yolo-mode-can-be-safe) in this series was about the box. The [second](/posts/2026-09-25-kits-make-authority-portable) was about declaring what goes in it. This one is about the trade that usually comes with a box: you isolate the agent, and you lose the tools you work in.

That trade is real for most boxes. Put an agent in a container or a VM and your editor cannot see inside it without extra plumbing, your terminal needs an exec wrapper, and your harness has to be taught about the box. Or you open port 22 and hand out a key, and now the box has a door. The usual outcome is the one from the first post: the isolation gets switched off the first time it gets in the way.

`sbx run claude` drops you into Claude Code in your terminal, and `sbx run <agent>` does the same for whichever one you prefer. That is the right default for almost everything. But [a month ago I moved my agents off the terminal entirely](/posts/2026-08-28-four-agents-four-machines-one-developer), onto a control surface I reach from a phone. Having done that, going back to "the agent lives in whichever terminal tab I started it in" is not something I am willing to do just because the agent is now in a VM.

So the requirement is blunt: the sandbox is the runtime, and the harness is mine. Here's how those two connect, and why it costs nothing.

## Create the Sandbox on Purpose

`sbx run` creates a sandbox and attaches you to the agent in the current terminal. That attach step is exactly the one to skip here. `sbx create` builds the sandbox without attaching, and naming it matters because everything downstream addresses the sandbox *by name*.

```console
$ sbx create --name demo claude .
```

The `.` is the workspace, mounted at the same absolute path inside the sandbox as on my host. That last detail matters more than it sounds: when the agent reports a failing test at `/Users/mdelapenya/sourcecode/.../foo_test.go`, that path is real on both sides, and I can open it in a local editor without translating anything.

The name is the address. Once SSH is on, `demo` becomes `demo.sbx`, and that hostname is the whole integration surface.

## Connect the Tools You Already Have

Everything that attaches to a sandbox from outside does it the same way, and it is a way every developer tool already understands: the sandbox shows up as an SSH host. Turn that on once per machine:

```console
$ sbx setup ssh
```

That starts the daemon if it is not running and configures your SSH client. From then on every sandbox is reachable as `<name>.sbx`:

```console
$ ssh demo.sbx
```

VS Code, Cursor, Claude Desktop, ChatGPT, T3 Code: anything with a "connect over SSH" option points at `<name>.sbx` and connects ([the docs walk through each one](https://docs.docker.com/ai/sandboxes/integrations/)), because none of them know or need to know what a sandbox is. There is no sandbox plugin to install and nothing sandbox-specific to configure in the tool. Your editor thinks it is talking to a machine, and that is exactly what it should think. The app-specific agents still need their own CLI in the box: ChatGPT drives Codex, so it wants a `codex` sandbox rather than the `claude` one above.

One exception worth knowing before you pick a tool: Claude Desktop sends your Anthropic credentials into the sandbox's Claude Code process, which is a real dent in the isolation, and the docs say so plainly.

Confirm `ssh demo.sbx` works from a plain terminal before you point any editor or harness at the sandbox. Those tools sit on top of SSH, so if the plain connection fails, theirs fails too. The difference is what you get to read: the terminal shows you the SSH error that says why, while a tool wraps it inside its own connection failure.

## My Harness: T3 Code

[T3 Code](https://github.com/pingdotgg/t3code) is the harness I use. It sees an SSH host, connects, and starts a T3 server on the far side that tunnels back to the app. The [docs page for it](https://docs.docker.com/ai/sandboxes/integrations/t3-code/) has the step by step; what follows is the one wrinkle in it.

There's one real wrinkle, and it is worth knowing before you hit it rather than after. T3 depends on `node-pty`, which ships prebuilt binaries for macOS and Windows only. On a Linux sandbox it compiles from source, and the build needs `make`, `python3` and a compiler. A stock agent sandbox does not have those. So the first connection fails with an error that concatenates T3's "did not become ready" failure with npm's install output, which is not a fun thing to debug.

The fix is a kit, which is exactly the problem kits exist for. Declare the toolchain once, at create time. A kit passed with `--kit` only takes effect when the sandbox is created, so this replaces the `sbx create` from earlier rather than adding to it (disconnect, then `sbx rm demo` first if it already exists):

```console
$ sbx create --name demo claude --kit docker.io/sbx/t3code-kit:latest .
```

The [`t3code` kit](https://github.com/docker/sbx-kits-contrib/tree/main/t3code) installs the build toolchain and the `t3` npm package when the sandbox is created, so the first connection attaches to a server that is already there instead of building one. Pair it with any agent whose base image ships Node.js 18 or later, which all the standard templates do.

You can do it by hand on a sandbox that already exists:

```console
$ sbx exec demo -- sudo apt-get update
$ sbx exec demo -- sudo DEBIAN_FRONTEND=noninteractive apt-get install -y g++ make python3
```

But a manual install lasts exactly until you recreate the sandbox, and the first connection still compiles `node-pty` from source. This is the [three repos, one sandbox](/posts/2026-09-02-three-repos-one-sandbox-two-files) lesson again in miniature: the hand-built environment is not slow to build, it is *different every time you build it*.

## Pick the Folder Explicitly

The step that is easy to miss.

Connecting an app selects the remote environment. It doesn't necessarily open the right directory. A remote folder picker tends to open at `/home/agent`, while an interactive `ssh` shell tends to start in `/home/agent/workspace`, and those are not the same place.

So choose the path explicitly. For a sandbox with a mounted workspace, it is the same absolute path as on your host: if you created it from `/Users/mdelapenya/src/my-project`, that is the string you type into the picker. For a mountless sandbox on a Docker-provided template, it is `/home/agent/workspace`.

## Why It Costs Nothing: No Key, No Port, No Server

"It's just SSH" usually means someone opened port 22 on a machine and handed you a key. That is not free. It is a server to patch, a key to rotate and a port on the network, and it would be a strange thing to add to a box whose whole point is a smaller attack surface. Here is the block `sbx setup ssh` writes into `~/.ssh/config` (yours may differ in small details), and it shows that none of that exists:

```text
# >>> docker sandboxes (managed) >>>
Host *.sbx
    User _default_user_
    ProxyCommand "sbx" ssh proxy %n
    IdentityAgent none
    IdentityFile /dev/null
    IdentitiesOnly yes
    ControlMaster no
    ControlPath none
    UserKnownHostsFile "~/.ssh/sbx_known_hosts"
    KnownHostsCommand "sbx" ssh known-hosts %H
    StrictHostKeyChecking yes
# <<< docker sandboxes (managed) <<<
```

There are two absences in it, and a third that follows from them. All three are deliberate.

**`IdentityAgent none`, `IdentityFile /dev/null`, `IdentitiesOnly yes`.** There is no key. Your SSH agent socket is explicitly detached, and the only identity file is `/dev/null`. Nothing authenticates you with a keypair.

**`ProxyCommand "sbx" ssh proxy %n`.** There's no port. The SSH stream is relayed to the daemon over a local socket, a Unix domain socket on macOS and Linux, a named pipe on Windows. Nothing is listening on the network.

**And, following from both:** there is no `sshd` inside the sandbox. SSH terminates at the daemon on your host. The box you're "SSHing into" is not running an SSH server at all.

So what authorises the connection? Your Docker login. The daemon accepts it only while you have an active session. I work on Docker Sandboxes, so take this as the builder's view: that's a different trust model from a key on disk, and a better one for this. Revoking access is a logout rather than hunting down an `authorized_keys` entry, and there is no SSH key on disk to leak in the first place.

`KnownHostsCommand` closes the last loop. The host key is verified on every connection against what the daemon currently holds, so rotating the daemon key does not produce the "REMOTE HOST IDENTIFICATION HAS CHANGED" wall of asterisks that trains people to delete their `known_hosts` and stop reading warnings.

The practical upshot: `*.sbx` behaves like an ordinary SSH host to anything that speaks SSH, while having none of the parts of an SSH host you would normally have to secure. SSH here is the language your tools already speak, not a new door into the box.

## What This Composes Into

Stack the three posts and the shape is this.

The microVM is the boundary, and nothing inside it can talk me out of it. A kit declares what the environment contains and what authority it asks for, in a file I can diff. And your tools attach to the box the way they attach to any other machine, so isolating the agent costs you none of them: not your editor, not your harness, not even the terminal if you want one.

Those are three separate decisions, and I think the separation is the good part. I can change my harness without changing my isolation model. I can change what is in the box without changing how I reach it. Nothing here is a bundle you have to adopt whole.

The agent runs somewhere it cannot hurt me, holding exactly the authority I wrote down, and I drive it from whatever harness I choose.

## Next

The sandbox's own Docker engine, and what happens when you let the agent run your integration tests for real.

---

_Resources:_
- _[Editor and app integrations](https://docs.docker.com/ai/sandboxes/integrations/)_
- _[Connect T3 Code to a sandbox](https://docs.docker.com/ai/sandboxes/integrations/t3-code/)_
- _[The `t3code` kit](https://github.com/docker/sbx-kits-contrib/tree/main/t3code)_
- _[T3 Code](https://github.com/pingdotgg/t3code)_
- _[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/)_
