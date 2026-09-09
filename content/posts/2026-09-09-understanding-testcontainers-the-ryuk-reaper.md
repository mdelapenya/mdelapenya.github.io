---
title: "Understanding Testcontainers: The Ryuk Reaper"
date: 2026-09-09 09:00:00 +0200
description: "The extra container in your docker ps: what Ryuk is, the labels it uses to know what is yours, the TCP protocol it speaks with your tests, the timers and race protections inside it, and why disabling it in CI is a false economy."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "ryuk", "docker"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-09-09-understanding-testcontainers-the-ryuk-reaper/cover.png"
related:
  - "/posts/2026-08-15-understanding-testcontainers-session-ids"
  - "/posts/2026-07-07-understanding-testcontainers-networks"
  - "/posts/2026-06-25-understanding-testcontainers-the-module-layer"
  - "/posts/2026-07-15-understanding-testcontainers-testing-lambdas-with-localstack"
---

![Understanding Testcontainers: The Ryuk Reaper](/images/posts/2026-09-09-understanding-testcontainers-the-ryuk-reaper/cover.png)

*This post was written as a guest post for [internals-for-interns.com](https://internals-for-interns.com/), Jesús Espino's long-form blog on software internals, and published there first. This is the same text, republished here.*

If you've used Testcontainers in any language (Go, Java, .NET, Python, Node, Rust), you've probably noticed an extra container hanging around in your `docker ps` output while your tests run. Its image is `testcontainers/ryuk`, and its name follows a pattern that varies by language library (the Go library names it `reaper_<sessionID>`, others use a similar shape with their own prefix). It sits there next to whatever Postgres, Redis, or Kafka containers your tests actually need. It arrives uninvited, lingers for the duration of the test run, and disappears at the end. If you've ever wondered what it does, this post is for you.

That container is Ryuk. It is a small sidecar process whose only job is cleaning up Docker resources when your tests die. By "sidecar" I mean a helper container that runs alongside the workload it serves, here, your test process. By "die" I mean any way a test process can stop existing: a clean exit, a `SIGKILL` from the OOM killer, a cancelled CI job, a CI timeout that kills the runner. Ryuk is the safety net that catches all of those.

This post is about how Ryuk works. Not the Go source code line by line, but the contract: what it does, why it exists, the protocol it speaks with your tests, the safety mechanisms inside it, and what happens when the various failure modes occur. By the end you should be able to look at `docker ps`, see Ryuk sitting there, and know exactly what is about to happen if you press `Ctrl+C` on your test run. You should also understand why disabling Ryuk in continuous integration is one of the worst false economies in the Testcontainers ecosystem.

## A sidecar with a single job

Ryuk is a Docker image. The current version on Docker Hub is `testcontainers/ryuk`, and the binary inside it (also called Ryuk) is a small Go program that does one thing: listen for instructions from your tests about what resources to clean up, and delete those resources when your tests stop checking in. The source lives at [github.com/testcontainers/moby-ryuk](https://github.com/testcontainers/moby-ryuk). It is small enough that you can read the whole thing in an afternoon.

The word "Ryuk" is borrowed from the manga *Death Note*, where Ryuk is a shinigami, a Japanese death god, who drops a notebook into the human world. Whoever writes a person's name in the notebook causes that person to die. The naming is appropriate: Ryuk's notebook is the set of Docker labels you give it, and the resources whose names are on those labels die when Ryuk decides their time is up. There is no ambiguity about who is allowed to be killed. If you did not tell Ryuk to track it, Ryuk does not touch it.

Ryuk does not start automatically with Docker. It is started by the Testcontainers library at the beginning of your test run, before any other container. Once Ryuk is running, the library opens a TCP connection to it (Ryuk listens on port 8080 by default, inside the container) and tells it what to clean up. The library then keeps that connection open for the lifetime of the test. When the connection closes, for any reason, Ryuk waits a short grace period, then deletes everything you told it about.

Three things matter about this design: it does not trust the calling process to clean up after itself, it uses Docker labels as the only mechanism for "what's mine", and it uses a single TCP connection as a deadman switch, which is to say, an absence of signal as the trigger for action. The more you push against this design the more sensible it gets, but to see why we first need to talk about why Ryuk exists in the first place.

## Why this exists: the orphan problem

Imagine you are writing an integration test that needs a real PostgreSQL database. Testcontainers makes this trivial: you call something like `postgres.Run(ctx, "postgres:latest")` and you get back a handle to a running Postgres container. You run your test against it. When the test finishes, the library calls `Terminate` on the container and Postgres goes away. Fine, that is the happy path.

Now consider the unhappy paths. The test process is killed with `SIGKILL` by the operating system because it is using too much memory. The continuous integration job is cancelled, and the runner kills the process. The test hangs and CI eventually kills it after the job timeout. `SIGKILL` bypasses signal handlers, so no cleanup code runs in any of these cases. There is also a simpler and more common cause of orphans: someone created a container in a test without registering a `Terminate` call, and the container stays running after the test that created it has finished.

In all of these scenarios, the test process never gets to run its cleanup code. The Postgres container keeps running. So do any Docker networks, volumes, or other resources the test created during its run. None of these resources are ever going to be useful again, they belong to a test run that is dead, but they will sit there consuming memory, disk, and port space on the host until somebody deletes them by hand.

At scale this adds up. Every orphan consumes memory, disk space, and possibly port mappings on the host until something removes it. On long-running CI runners or developer machines, the accumulation requires periodic manual intervention, usually `docker system prune` or equivalent.

This is the orphan problem. It is the reason every database management tool eventually grows a "kill abandoned sessions" feature, the reason every connection pool has an idle timeout, the reason every distributed system has heartbeats. The pattern is always the same: when a process owns external resources, and the process can die in ways that prevent cleanup, you need an external observer that can clean up on its behalf.

Ryuk is that external observer for Testcontainers.

You could argue this should be solved by the library itself, with `defer` statements or `finally` blocks or destructors. Library authors did try that for years. The fundamental problem is that the test process is exactly the wrong place to put the cleanup logic, because the test process is exactly what is dying. Any code you write inside the test process to clean up assumes the test process will live long enough to run that code, and that assumption is what is failing in the first place. The solution has to be outside the test process. It has to survive whatever killed the test.

## How Ryuk knows what's yours: labels

Ryuk's job is to delete Docker resources. Docker has many resources (containers, images, networks, volumes, services, secrets), and a single Docker daemon may be serving dozens of unrelated projects simultaneously. Your laptop alone might be running containers for your test suite, your development database, your local Docker Desktop dashboard, and three other Testcontainers runs from earlier today that you forgot to terminate. Ryuk has to know which subset of all of this is *yours*.

The answer is Docker labels: key-value pairs attached to a resource when it is created, which the daemon stores and lets you query but otherwise ignores. Pure metadata, no behavioral meaning.

Testcontainers uses labels as its "this is mine" marker. Every container, network, volume, and image that Testcontainers creates gets tagged with a set of labels. In the Go library, the canonical set looks like this:

```go
org.testcontainers              = "true"
org.testcontainers.lang         = "go"
org.testcontainers.version      = <library version>
org.testcontainers.sessionId    = <random session ID, one per test run>
org.testcontainers.reap         = "true"
```

The [`sessionId`](/posts/2026-08-15-understanding-testcontainers-session-ids) is the most distinguishing one. It is generated when your test suite starts, and every container, network, volume, and image created during that run gets the same `sessionId` value. The `reap` label is the explicit opt-in marker for cleanup: when the library is configured to use Ryuk, every resource gets `reap=true`; when the library is configured without Ryuk, that label is omitted. We will return to this in the section on disabling Ryuk.

If you ever want to see this yourself, run a Testcontainers test, and while it is running, in another terminal:

```shell
$ docker ps --filter label=org.testcontainers
```

You will see the test containers your tests are using, plus Ryuk itself, all sharing the same `sessionId`. Then:

```shell
$ docker inspect <container-id> | grep -A 10 Labels
```

and you will see the actual labels attached to that container. The keys vary slightly between language libraries (the Go library uses `org.testcontainers.lang=go`, the Java library uses `org.testcontainers.lang=java`), but the shape is the same everywhere.

When Ryuk starts, the Testcontainers library opens a TCP connection to it and sends a filter containing all of those default labels. Because the `sessionId` is random and unique to this run, the combined filter matches exactly the resources this test run created and nothing else on the machine: no risk of Ryuk reaching across project boundaries and killing somebody else's container. Ryuk writes the filter down and waits. Resources created after that point inherit the same labels and are caught automatically.

This is the whole reason the design works. Labels turn "find my resources" from a hard problem (track every resource I create, hold a list, garbage collect on exit) into a trivial database query (delete any container with this label). The label system is older than Ryuk, older than Testcontainers, and built into Docker itself. Ryuk's design uses what is already there.

## The protocol: connect, declare, ACK, heartbeat

Ryuk listens on TCP port 8080 inside its container. Testcontainers, running outside the container (or inside another container, depending on your setup), connects to that port. The connection is plain TCP, no TLS, no authentication. The listener binds to all interfaces inside the container, and the access control is provided by the surrounding Docker port mapping (which typically only exposes the port to localhost) and by the fact that Ryuk only runs for the duration of a test session. The protocol on the wire is human-readable text. You could implement a Testcontainers library in shell script.

Here is what the protocol looks like in practice. Once a client connects, it sends one or more lines, each terminated with a newline. Each line declares a filter, formatted as a URL query string. The most common filter type is `label`, and the format is `label=key=value`. Multiple filters can be sent on one line, separated by `&`. The whole line is parsed with Go's `url.ParseQuery`, which gives the format its precise semantics: `&` separates filter entries, `=` separates the type from the value, and the values are URL-decoded.

A real filter line sent by testcontainers-go, with all the default labels, looks like this (one long line, broken here only for readability):

```
label=org.testcontainers=true&label=org.testcontainers.lang=go
&label=org.testcontainers.version=<library version>
&label=org.testcontainers.sessionId=<sessionID>
&label=org.testcontainers.reap=true
```

This tells Ryuk: "match any Docker resource that has all of these labels set to these exact values". The five entries within the one line are AND-ed: Docker's filter implementation (the `MatchKVList` function in the `docker/docker/api/types/filters` package) iterates over every `label=key=value` pair and returns false on the first mismatch, so a resource is considered a match only if every label-value pair is present on it. Lines, on the other hand, are OR-ed: each line registers as an independent filter set, and Ryuk lists matching resources separately for each set then unions the result. A resource gets cleaned up if it matches *any* of the registered filter sets.

After Ryuk processes each line, it sends back four bytes: `ACK\n`. The Testcontainers library reads exactly four bytes with `io.ReadFull` and verifies they match `ACK\n`. Worth noting: Ryuk sends the ACK whether the line parsed cleanly or not (a malformed filter line gets logged as an error and still acknowledged), so the ACK is a "line received and processed" signal rather than a "filter accepted" signal. From the client's perspective the value is the same: the client knows Ryuk received and read its line before it considers the registration complete and proceeds with the rest of the test setup.

The connection itself is the contract. While the connection is open, Ryuk holds the filters in memory and waits. The Testcontainers library does not have to send any keepalive bytes. It does not have to ping. The TCP socket being open is enough, because TCP itself handles detecting that the other side has disappeared, through the operating system's socket layer.

To see this with your own eyes, the Ryuk repository documents how you can simulate a client using netcat:

```shell
$ nc -N localhost 8080 << EOF
label=testing=true&label=testing.sessionid=mysession
label=something
EOF
```

This session declares two filters. The first matches anything with both `testing=true` and `testing.sessionid=mysession`. The second matches anything with the label `something` (any value). When netcat disconnects, Ryuk waits for the reconnection timeout, then deletes any container, network, volume, or image matching either of the filter sets. You can watch this happen in Ryuk's own logs, which look something like:

```log
msg="adding filter" type=label values="[testing=true testing.sessionid=mysession]"
msg="adding filter" type=label values=[something]
msg="client disconnected" address=127.0.0.1:56432 clients=0
msg="prune check" clients=0
msg=removed containers=0 networks=0 volumes=0 images=0
msg=done
```

Multiple clients can connect simultaneously, each contributing its own filters. This matters in some setups: a single Ryuk instance could in principle serve multiple parallel test runs if they were all configured to point at the same Ryuk. Each test run's filters live on its own connection. When all connections drop and the grace period expires, Ryuk processes all the filters together and cleans up everything matching any of them. If even one connection stays open, Ryuk keeps waiting.

The simplicity here is the point. The protocol is small enough to implement from scratch in any language that has a TCP socket. The state Ryuk holds is a list of filter sets per connection. The trigger is the most universal failure-detection mechanism in computing: a closed socket.

## The grace period and the death timer

When the last TCP connection closes, Ryuk does not immediately delete anything. It starts a timer, `RYUK_RECONNECTION_TIMEOUT`, default 10 seconds. If a new connection arrives within that window the timer is cancelled and Ryuk keeps waiting, carrying the previous connection's filters forward and adding the new ones. Only if nobody reconnects does the prune actually fire. That grace period is what keeps a short-lived disconnect from being mistaken for a dead test.

The rest of Ryuk's timing is a handful of environment variables you will probably never touch:

| Variable | Default | What it controls |
| --- | --- | --- |
| `RYUK_RECONNECTION_TIMEOUT` | 10s | Grace period after the last client disconnects, before pruning. |
| `RYUK_CONNECTION_TIMEOUT` | 60s | How long Ryuk waits for a first client. If nobody connects, it shuts down. |
| `RYUK_SHUTDOWN_TIMEOUT` | 10m | On `SIGTERM`, how long connected clients get to leave before Ryuk prunes anyway. |
| `RYUK_REMOVE_RETRIES` | 10 | Retries per resource, one second apart. A "not found" error counts as already removed. |

When the prune completes, Ryuk logs what it took:

```
msg=removed containers=0 networks=0 volumes=0 images=0
```

All zeros means the test exited cleanly and Testcontainers had already removed everything itself. Non-zero means Ryuk had to step in, and tells you how much was orphaned. Either way, the container then exits.

The order is fixed: containers, then networks, then volumes, then images. The comment above the prune function says only "Containers must be removed first."

## The race condition Ryuk handles: "changes detected"

There is a subtlety in Ryuk that is easy to miss: it does not blindly delete every resource that matches the filters. It also checks when each resource was created, and refuses to delete anything that was created after the prune started.

Here is the scenario this protects against. Suppose your test suite finishes and disconnects from Ryuk. The grace period starts. Nine seconds in, *another* test suite from somebody else's CI run begins, and it happens to use the same label structure (the same `org.testcontainers.reap=true`, just a different `sessionId`). At second 10, Ryuk runs its prune. It asks Docker: "list all containers with label `org.testcontainers.reap=true`". The list comes back including the second test's containers, because they have that label too.

Without protection, Ryuk would happily delete them. The second test suite, which has just started, would lose its containers from under it.

What Ryuk actually does is more careful. When it gets the list of matching resources, it checks the creation timestamp of each one. If a resource was created after the prune-start time (with a small `RYUK_RETRY_OFFSET` adjustment, default `-1s`, the source comment says this exists "to ensure in use resources are not removed"), Ryuk does not delete it. Instead it logs "change detected, waiting again" and reschedules itself for another check after `RYUK_CHANGES_RETRY_INTERVAL` (default 1 second). On the next pass, the resource list may have changed: new resources may have been added, old ones may have been removed by their own owners. Ryuk keeps looping until either (a) the resource list is stable, with no resources younger than the cutoff, or (b) the shutdown timeout is reached and Ryuk does a force-prune of whatever is still there.

This is conservative. It trades cleanup speed for safety. In the common case, where no other tests are starting up at the same time, the first pass succeeds and the prune fires immediately. In the contested case, where multiple test runs are racing through the same Ryuk, the slower runs do not get their resources killed by the faster runs.

It is also one of those mechanisms that is invisible when it works, and only becomes legible when you look at the source. If you have ever seen Ryuk logs include "change detected, waiting again", you have seen this in action. It is the system telling you that it noticed the race and refused to play.

In practice, the Testcontainers library scopes a Ryuk container to the session ID and looks up an existing Ryuk container with that same session ID before creating a new one (see `reuseOrCreate` and `lookupContainer` in the Go library's `reaper.go`). So multiple test processes that share a session ID will share a single Ryuk, while different test processes with different session IDs each get their own. In the common single-process case the contention is rare, and the mechanism is there for the cases where it is not, plus the general defensiveness of "don't delete things you don't have to".

## The Docker socket question

Up to this point we have described what Ryuk does without saying much about how it actually deletes things. It has no special powers: it talks to the Docker daemon like any other client. The daemon listens on a Unix domain socket, typically `/var/run/docker.sock`, and anyone who can write to that socket can do anything the `docker` CLI can do.

When you run Ryuk's container, the host's Docker socket is mounted in:

```shell
docker run -v /var/run/docker.sock:/var/run/docker.sock testcontainers/ryuk:latest
```

This is the line that makes Ryuk able to delete your containers. It is also the line that, in security circles, would make a senior engineer cough. Anything inside a container with a mounted Docker socket has effectively root access to the host, because it can launch new containers with arbitrary privileges, including ones that mount the host's filesystem. Ryuk is no exception. If you trust Ryuk to run, you are trusting it with the keys to your machine.

There are two things to say about this. First, every Testcontainers library mounts the Docker socket somewhere, because your tests themselves use it to create containers. The library you trust to spin up Postgres for your tests already needs that access. Ryuk inherits the same level of trust, and adds nothing new to your threat surface. You are not introducing a new privilege; you are sharing the one that is already there.

Second, in the specific case of Ryuk, what is running inside the container is a small Go binary that does one thing: listen on a TCP socket, accept filter declarations, and call Docker delete APIs when a timer fires. The image is built reproducibly, tagged immutably, and maintained as part of the Testcontainers ecosystem. The trust here is not "trust some random container" but "trust the Testcontainers project to maintain a small, focused, audited image". You can read the source, rebuild it from the public repository, and pin a specific image hash if you want to be extra careful.

There is one more wrinkle worth mentioning. In Docker-in-Docker setups, where your tests are running inside a container and that container is itself trying to launch other containers, there are two possible Docker daemons in play: the outer host daemon and a nested inner daemon. Testcontainers has to decide which one Ryuk should talk to, and so do you. The convention is that Ryuk and the test containers should all share the same daemon, usually the host's. The library handles the socket discovery for you. You mostly do not need to think about it, except when something is misconfigured and Ryuk is talking to a different Docker than the one your tests are using. The symptom is that your tests work fine, Ryuk runs fine, and orphans still accumulate on the wrong daemon. The fix is to make sure Ryuk and Testcontainers see the same socket. The Testcontainers documentation calls out the right environment variables for each scenario.

One last detail: the Ryuk container does not delete itself, and the protection is two-layered. When the Testcontainers library creates the Ryuk container, it sets the label `org.testcontainers.ryuk=true` on it and explicitly removes the `org.testcontainers.reap=true` label from it (see `newReaper` in the Go library's `reaper.go`). So the Ryuk container already would not match the standard filter, because it lacks the `reap=true` label. As a second line of defense, the cleanup pass in Ryuk itself explicitly skips any container carrying the `org.testcontainers.ryuk=true` label, regardless of which filter brought it into the candidate list. Either guard alone would be enough; both together close the loophole entirely. The kind of self-deletion failure mode this prevents is funny only in retrospect.

## Why the Ryuk image is small

There is a design choice in Ryuk that does not show up in the protocol or the labels, but matters for everyone running Testcontainers in practice: the image is deliberately tiny. The `Dockerfile` is a multi-stage build that compiles Ryuk inside `golang:1.23-alpine3.22` and then ships the resulting binary on top of `scratch`, the empty base image. There is no shell in the final image, no package manager, no init system. There is only the `ca-certificates.crt` bundle (so Ryuk can verify TLS connections if it ever needs to reach a Docker daemon over TLS), the Ryuk binary itself, and the line `CMD ["/bin/ryuk"]`. That is the entire image filesystem.

The Go build itself goes on a diet. The `Dockerfile` sets `CGO_ENABLED=0`, which produces a statically linked binary with no glibc dependency. The link step uses `-ldflags="-w -s"`, which the `Dockerfile` comment explains as "omits the DWARF symbol table, symbol table and debug information". The build also uses `-trimpath`, again documented in the `Dockerfile` as "remove all file system paths from the compiled executable". These are standard Go binary-shrinking techniques.

Then comes UPX. After the Go build, the `Dockerfile` installs `upx` and runs `upx --best --lzma /bin/ryuk`, which compresses the binary with the best available LZMA setting. UPX is a self-extracting compression for executables: the compressed binary, when run, decompresses itself in memory before executing the real code. The `Dockerfile` comment on this step calls out the trade-off as "smaller size vs startup time" without specifying magnitudes. One exception lives in a conditional in the `Dockerfile`: UPX is skipped on the s390x architecture, which UPX does not support; other architectures (amd64, arm64) get the compression.

Looking at the actual registry manifest of `testcontainers/ryuk:latest` for a single architecture, the total compressed pull size sits at low single-digit megabytes (around 5 MB across three layers).

Why this matters. The Ryuk image gets pulled into every CI runner on every fresh job, every developer laptop, every Docker-in-Docker setup, every parallel test process that does not already have it cached. A smaller image means a smaller pull, less storage on each runner's local image cache, and less load on whichever registry hosts it. At a per-test scale these savings are imperceptible; at the scale of a CI fleet they accumulate.

One small detail worth pointing out: the image declares its own identity. The `Dockerfile` ends with `LABEL org.testcontainers.ryuk=true`, which means every container started from this image inherits that label by default. The Testcontainers library also sets the same label explicitly when it creates the Ryuk container, so the protection from self-deletion (covered in the previous section) is doubly redundant: the label is on the image itself, and the spawner sets it again at container creation. If the spawner ever forgets to set it, Ryuk is still labeled correctly.

## When you'd turn Ryuk off (and when you absolutely shouldn't)

The Testcontainers libraries expose an escape hatch: an environment variable that disables Ryuk entirely. Set `TESTCONTAINERS_RYUK_DISABLED=true` and the library will not start Ryuk, will not connect to it, and will not put the `org.testcontainers.reap=true` label on any resource. Your test containers will be created normally, but nothing external will reap them if your test process dies.

There is one detail to notice here. When Ryuk is enabled, every resource gets `reap=true`. When Ryuk is disabled, that label is omitted. This is not just bookkeeping. Even if a Ryuk somewhere on the system tried to do cleanup, resources from a "Ryuk-disabled" run would not match any reap-based filter, so they would be safe. The opt-in is explicit, by virtue of the label being present. This is a clean design: Ryuk only ever touches things that explicitly declared themselves reapable.

There is exactly one legitimate use case for disabling Ryuk. It is local development with hot reload. If you are writing application code with a tool like `air` (Go) or `nodemon` (Node) that restarts your process every time you save a file, and your dev process happens to also start Testcontainers (because the same code path runs locally and in tests), Ryuk will dutifully delete your dev database every time you save. Every save, a new Postgres container, no carryover state, no fast iteration. It is miserable, and turning Ryuk off solves it. You give the dev database a stable name, you let it run across reloads, and you clean it up by hand when you are done. The price you pay is remembering to clean up. The price you do not pay is starting from scratch every save.

That is it. That is the legitimate use case. Everything else is a foot-gun.

The most common bad reason to disable Ryuk is "to make CI faster". The argument goes: Ryuk takes some time to start and sits there for the test run, so if my tests always clean up properly, why bother. The answer is that the day a test does not clean up properly is exactly the day you need Ryuk; disabling it removes the only thing that catches the failure mode it exists for.

The rule I tell people: never disable Ryuk in CI. In local dev with hot reload, fine. Be specific about which env var you are setting, and set it only for the dev workflow, not for your test command.

## The lesson: deadman switches as a cleanup pattern

Ryuk's design is worth thinking about as a general pattern, beyond Testcontainers specifically.

The shape is: a process owns external resources; the process can die in ways that prevent it from cleaning up; an external observer is the only thing that can be trusted to clean up. The observer does not need to know what work the process was doing. It only needs to know what resources were claimed and how to release them. The contract between the process and the observer is a heartbeat, usually a held connection or a periodic ping, and the absence of the heartbeat is the trigger for cleanup.

You will find this shape everywhere once you start looking. Browser sessions expire when the heartbeat from the client stops, freeing seat licenses and freeing database connections. Kubernetes nodes are declared unhealthy when their kubelet stops phoning home, and the pods on them get rescheduled. SSH agents auto-clear forwarded credentials when the connection drops. Database session timeouts release locks and roll back uncommitted transactions when a client disappears. Apartment buildings have automatic door-lockers that engage when the keyholder has not badged in for a while. The deadman switch is one of the oldest patterns in safety engineering, predating computing by a century.

What Ryuk shows is that this pattern works at the granularity of test runs. Test runs are short-lived and crash-prone, and they create real infrastructure that needs to be torn down whether or not the runs finish gracefully. Anyone building tooling for ephemeral environments (preview environments, dev environments, CI pipelines, sandbox infrastructures) eventually rediscovers this. The lifeguard is always more reliable than the swimmer.

What is nice about Ryuk specifically is how small it is. Under a thousand lines of production Go, a single TCP socket, one tiny protocol, one set of labels. The features it has accumulated (the ACK handshake, the changes-detected race protection, the retry loop on individual deletes) are all defensive: they make the same single job more robust, not broader.

The next time you see the `testcontainers/ryuk` image in your `docker ps`, you will know what it is. The reaper, sitting at the side, waiting for the line to go dead.

---

*Resources:*
- *[Ryuk source code (moby-ryuk)](https://github.com/testcontainers/moby-ryuk)*
- *[Testcontainers Ryuk documentation](https://golang.testcontainers.org/features/garbage_collector/)*
- *[testcontainers-go repository](https://github.com/testcontainers/testcontainers-go)*
- *[Death Note (the manga, where Ryuk's name comes from)](https://en.wikipedia.org/wiki/Ryuk_(Death_Note))*
