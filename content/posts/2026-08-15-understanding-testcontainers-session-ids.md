---
title: "Understanding Testcontainers: Session IDs"
date: 2026-08-15 09:00:00 +0200
description: "Where the identifier that ties a test session together comes from: derived from the parent process, hashed, stamped on every resource as a label, and used to name the reaper. Plus how to override it, and why build systems like Bazel need you to."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "bazel", "docker"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-08-15-understanding-testcontainers-session-ids/cover.png"
related:
  - "/posts/2026-07-27-understanding-testcontainers-testing-network-resilience-with-toxiproxy"
  - "/posts/2026-07-15-understanding-testcontainers-testing-lambdas-with-localstack"
  - "/posts/2026-07-07-understanding-testcontainers-networks"
  - "/posts/2026-06-25-understanding-testcontainers-the-module-layer"
---

![Understanding Testcontainers: Session IDs](/images/posts/2026-08-15-understanding-testcontainers-session-ids/cover.png)

I am a core maintainer of [testcontainers-go](https://github.com/testcontainers/testcontainers-go). This is the eighth post in a series on the library. The previous seven covered the API shape, wait strategies, lifecycle hooks, the module system, networks, and two applied module posts that used LocalStack to test a Lambda and Toxiproxy to test network resilience. This one goes back to internals.

It also pays off a pointer I left earlier. In the [LocalStack post](/posts/2026-07-15-understanding-testcontainers-testing-lambdas-with-localstack), the test set `LAMBDA_DOCKER_FLAGS` to copy the library's generic labels onto the child containers LocalStack spawns to run each Lambda, so they would be cleaned up along with everything else. Buried in those labels is a session ID. Every container, network and volume the library creates carries it, and cleanup uses it to decide what belongs to your run. This post is about where that identifier comes from, and what happens when the environment cannot produce one.

## A session is not a process

Go runs one test binary per package. So `go test ./...` in a repository with a dozen packages is a dozen processes, started and torn down independently, each with its own view of the world.

The library wants all of them to count as a single test session, so that the resources they create are cleaned up together rather than a dozen separate times. Its own definition of a test session is:

- a single `go test` invocation, including flags;
- a single `go test ./...` invocation, for all subpackages from that location;
- the execution of a single test or a set of tests from the IDE.

That is the constraint the identifier has to satisfy. It must be stable across processes that were started independently, and different for unrelated runs. Nothing inside a single process provides that: the PID is different for every package, and a random value would be different too.

## Derived from the parent

What those processes do share is a parent. The per-package test binaries are all children of the same `go test` process, so the library looks up, not in.

It takes the parent process ID and that parent's creation time, and hashes the pair, producing a 64 character hex string. The parent PID is what makes the value shared. The creation time is what stops a recycled PID from colliding with a run that finished earlier.

I ran this on my machine to watch it happen. Two packages, each logging its parent PID and the session ID the library resolved:

| Run | Package | Parent PID | Session ID |
|---|---|---|---|
| One `go test ./...` | pkga | 29614 | `810b4567…` |
| One `go test ./...` | pkgb | 29614 | `810b4567…` |
| Separate `go test ./pkga` | pkga | 29850 | `de3eb687…` |
| Separate `go test ./pkgb` | pkgb | 29861 | `ee3ac646…` |

That is the whole contract in four rows. Same parent, same session. Different parent, different session. The two packages in the first run were separate processes that never spoke to each other, and they still agreed on the identifier, because they were both looking at the same thing above them.

## When it cannot be derived

The lookup can fail. The library may not be able to enumerate processes, or read the parent's creation time, or complete the hash. Every one of those paths falls back to the same thing: a random UUID.

That fallback is worth pausing on, because it is a choice. A random UUID per process means no aggregation at all: each package becomes its own session, with its own reaper. What it also means is no collision. Faced with an environment it cannot read, the library prefers isolation over aggregation.

The asymmetry justifies it. Under-aggregating costs you some extra reaper containers for the duration of the run. Colliding would mean one test run reaping another run's containers while they are still in use. One of those is an inefficiency, the other is a bug you would spend an afternoon failing to reproduce.

## What hangs off it

Once resolved, the session ID shows up in four places that matter.

**Labels.** Each of those resources gets the standard set of labels, one of which is `org.testcontainers.sessionId` set to this value. When Ryuk is enabled there is also a `reap` label marking the resource as something to clean up. This is exactly what the LocalStack post was copying: those labels are the contract, so stamping them onto containers the library never created itself is enough to get them cleaned up with the session.

**Every call to the daemon.** The library routes all its Docker API traffic through a single client constructor, and that constructor sets a fixed set of HTTP headers on every request:

```go
opts = append(opts, client.WithHTTPHeaders(
    map[string]string{
        "x-tc-pp":    bootstrap.ProjectPath(),
        "x-tc-sid":   tcConfig.SessionID,
        "User-Agent": "tc-go/" + internal.Version,
    }),
)
```

So the session ID is not only stamped on the resources, it travels with `x-tc-sid` on the wire for every call, alongside the project path and the `User-Agent` that makes the traffic attributable to the library. That last header is the one I pulled on in [the post about a year of testcontainers-go on Docker Hub](/posts/2026-06-26-a-year-of-testcontainers-go-on-docker-hub); it comes from this same block.

**The reaper's name.** The reaper container is named after the identifier, as `reaper_<sessionID>`.

**Reaper reuse.** Before starting a reaper, the library looks for an existing one, filtering by that label and that name. This is where the aggregation pays off: the first process that needs a reaper creates it, and every other process in the same session finds it and reuses it. A dozen packages, one reaper.

The reaper is also the one resource that carries the reaper and ryuk labels but has the reap label removed. It is not on its own list.

## Overriding it

The derived value is the default, not the only option. The session ID is resolved from the first of these that is set:

1. the session ID label on the container request itself;
2. the `TESTCONTAINERS_SESSION_ID` environment variable;
3. the `session.id` property in `~/.testcontainers.properties`;
4. the derived hash.

A configured value is used verbatim, not hashed. Since it ends up in the reaper container name, it is validated when the configuration is read: it has to produce a name the container runtime accepts, which means non-empty, made only of alphanumerics, dots, hyphens and underscores, and short enough that `reaper_<sessionID>` stays within the 128 character limit. A value that does not qualify is rejected right there, before any container is created.

Setting it does what you would expect. The same two separate invocations that landed in different sessions above both report `ci-pipeline-42` when `TESTCONTAINERS_SESSION_ID` is set to that value. Different parents, same session, because the inference is no longer being used.

One consequence is worth stating plainly, and it is documented: setting the value means the run will not create more than one reaper. Changes to Ryuk settings after that reaper exists are ignored, because there is no second reaper to apply them to.

## When the build system does not give you a parent

Deriving the session ID from the parent process is an inference about how the processes were started. A build system is free not to guarantee any of it, and Bazel is the concrete case.

Bazel runs each test target in isolation, and its [Test Encyclopedia](https://bazel.build/reference/test-encyclopedia) states:

> The current process id, process group id, session id, and parent process id are unspecified.

That is precisely the foundation the derivation stands on, declared unavailable. Sharding makes it more visible, since the test runner is launched once per shard.

Two more details of Bazel's test environment matter here:

- `HOME` is set to the value of `$TEST_TMPDIR`, a private directory for the test, so `~/.testcontainers.properties` is not picked up.
- The environment is sanitised. Tests, in Bazel's words, *"should not depend on the presence, absence, or value of any environment variable not listed above"*, so `TESTCONTAINERS_SESSION_ID` does not reach the test unless it is declared.

Line those up against the four levels of precedence and two of them are gone. The derived hash cannot be relied on, the properties file is not read, and the environment variable has to be plumbed through explicitly:

```shell
bazel test //... --test_env=TESTCONTAINERS_SESSION_ID
```

That form takes the value from the invocation environment. To set it independently of the shell you are in:

```shell
bazel test //... --test_env=TESTCONTAINERS_SESSION_ID=my-session
```

None of this is Bazel doing something wrong. It is being hermetic on purpose, and process lineage is one of the things hermeticity gives up. The override is what lets the library work where the inference cannot.

## Closing

The session ID is the library's answer to a question it has to get right before it can clean up after you: which of these containers are mine? It infers the answer from process lineage when it can, and takes it from configuration when it cannot.

Knowing which of those two situations you are in is the whole point. Under `go test`, you will never think about it. Under a build system that hands you a sandbox and no promises about your parent, it is the first thing to set.

---

## Resources

- *[Test session semantics](https://golang.testcontainers.org/features/test_session_semantics/)*
- *[Bazel Test Encyclopedia](https://bazel.build/reference/test-encyclopedia)*
- *[Bazel: --test_env](https://bazel.build/docs/user-manual)*
