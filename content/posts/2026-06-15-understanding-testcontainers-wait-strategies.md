---
title: "Understanding Testcontainers: The Wait Strategy Taxonomy"
date: 2026-06-15 09:00:00 +0200
description: "Every wait strategy testcontainers-go ships, how the engine wires them in as a single PostStarts lifecycle hook, and the four functional options for plugging them into a request. Read straight from the source."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "wait-strategies"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-06-15-understanding-testcontainers-wait-strategies/cover.png"
related:
  - "/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options"
  - "/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module"
  - "/posts/2025-05-27-gofiber-services-testcontainers"
---

![Understanding Testcontainers: The Wait Strategy Taxonomy](/images/posts/2026-06-15-understanding-testcontainers-wait-strategies/cover.png)

I am a core maintainer of [testcontainers-go](https://github.com/testcontainers/testcontainers-go). The [first post in this series](/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options) ended on a teaser: how the library decides a container is "ready" after it has started, which turns out to be a surprisingly different question from "is it running". The first half of that distinction is easy. Running means Docker says the container is running, no more, no less. The second half is where every interesting integration test lives. Postgres can be a running container for several seconds before it accepts a connection. Kafka can be a running container for tens of seconds before it has elected a leader. An application can be a running container forever and never serve a single successful `/health` response.

The library answers all of this with a single interface and a folder of implementations. The folder is `wait/`. The interface is `Strategy`, one method, `WaitUntilReady(ctx, target) error`. This post is a tour of every strategy in that folder, how the engine plugs them in (one lifecycle hook, fifteen lines), and the four functional options the public API exposes for adding them to a request.

## The contract: one interface, two helpers

The whole package hangs off two interfaces. The first is `Strategy`:

```go
type Strategy interface {
    WaitUntilReady(context.Context, StrategyTarget) error
}
```

Every strategy in the package, and every custom strategy you write, implements that one method. The second interface is `StrategyTimeout`, optional, used by the composite strategies to project per-child timeouts:

```go
type StrategyTimeout interface {
    Timeout() *time.Duration
}
```

The argument every `WaitUntilReady` receives is a `StrategyTarget`, which is just the surface the strategy is allowed to use on the container it is probing. It exposes `Host`, `Inspect`, `MappedPort`, `Logs`, `Exec`, `State`, and `CopyFileFromContainer`, plus a `Ports` method whose source comment marks it as deprecated and redirects to `Inspect`. That is the API every strategy works against.

Inside the same file there is a tiny preflight helper, `checkTarget`, that every strategy can call before each poll:

```go
func checkState(state *container.State) error {
    switch {
    case state.Running:
        return nil
    case state.OOMKilled:
        return errors.New("container crashed with out-of-memory (OOMKilled)")
    case state.Status == container.StateExited:
        return fmt.Errorf("container exited with code %d", state.ExitCode)
    default:
        return fmt.Errorf("unexpected container status %q", state.Status)
    }
}
```

The function reads the container state and fails fast on `OOMKilled` or `Exited`. The point is that none of the strategies have to relitigate "is the container even alive" before each probe. They call `checkTarget` at the top of every loop iteration and trust it.

Two more helpers in the package define the universal defaults: `defaultStartupTimeout()` returns 60 seconds and `defaultPollInterval()` returns 100 milliseconds. Every strategy you will read about in this post inherits those values unless you override them with a `WithStartupTimeout` or `WithPollInterval` call. That uniformity is the reason the package feels so consistent: the timing model is the same everywhere, and the only thing that changes between strategies is what counts as a successful probe.

## Where the engine plugs the strategy in

The wiring on the engine side is much smaller than I expected the first time I read it. There is no special "wait engine". The strategy is just a `PostStarts` lifecycle hook. The hook is a `defaultReadinessHook`:

```go
var defaultReadinessHook = func() ContainerLifecycleHooks {
    return ContainerLifecycleHooks{
        PostStarts: []ContainerHook{
            func(ctx context.Context, c Container) error {
                dockerContainer := c.(*DockerContainer)

                if dockerContainer.WaitingFor != nil {
                    strategy := dockerContainer.WaitingFor
                    strategyDesc := "unknown strategy"
                    if s, ok := strategy.(fmt.Stringer); ok {
                        strategyDesc = s.String()
                    }
                    dockerContainer.logger.Printf(
                        "⏳ Waiting for container id %s image: %s. Waiting for: %+v",
                        dockerContainer.ID[:12], dockerContainer.Image, strategyDesc,
                    )
                    if err := strategy.WaitUntilReady(ctx, dockerContainer); err != nil {
                        return fmt.Errorf("wait until ready: %w", err)
                    }
                }

                dockerContainer.isRunning.Store(true)

                return nil
            },
        },
    }
}
```

Fifteen lines. The hook checks if `WaitingFor` is set on the container, logs the strategy's `String()` description, calls `WaitUntilReady`, and only on success sets `isRunning.Store(true)`. That single `Store` is where "Docker reports the container is running" and "the library says the container is ready" become two different things. Inside the engine, `isRunning` is true only after the strategy returns nil.

This is also why every strategy in `wait/` implements `fmt.Stringer`. The engine logs that string before waiting. It is not decorative.

The hook is registered automatically inside `CreateContainer`, alongside the other default lifecycle hooks:

```go
defaultHooks = append(defaultHooks,
    defaultPreCreateHook(p, dockerInput, hostConfig, networkingConfig),
    defaultCopyFileToContainerHook(req.Files),
    defaultLogConsumersHook(req.LogConsumerCfg),
    defaultReadinessHook(),
)
```

Nothing further is needed in user code. The readiness layer rides on the lifecycle-hook machinery that already exists.

There is one consequence of this design that surprises people, and it is worth calling out. If `WaitingFor` is nil, the entire hook is a no-op. There is no default port check. There is no default log probe. The container is returned to the test the moment Docker reports it started. For anything that exposes a network service, this is rarely what you want.

## The four ways to plug one in

The library exposes four functional options for attaching a wait strategy to a request:

```go
func WithWaitStrategy(strategies ...wait.Strategy) CustomizeRequestOption
func WithAdditionalWaitStrategy(strategies ...wait.Strategy) CustomizeRequestOption
func WithWaitStrategyAndDeadline(deadline time.Duration, strategies ...wait.Strategy) CustomizeRequestOption
func WithAdditionalWaitStrategyAndDeadline(deadline time.Duration, strategies ...wait.Strategy) CustomizeRequestOption
```

The pattern follows the `Additional` prefix convention covered in [post #1](/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options): the base form replaces, the `WithAdditional...` form appends to whatever `req.WaitingFor` was already set to. The deadline-suffixed variants let you override the default 60-second deadline; the non-suffixed ones default it to 60 seconds.

The detail worth knowing is what these options actually do internally. All four wrap the strategies in `wait.ForAll(strategies...).WithDeadline(deadline)`. So even when you pass a single strategy:

```go
testcontainers.WithWaitStrategy(wait.ForListeningPort("5432/tcp"))
```

what ends up on `req.WaitingFor` is a `*MultiStrategy` with one child, not the bare `*HostPortStrategy`. The wrapping is consistent across the entire surface, which makes the engine-side handling uniform: it always sees one root strategy, and that root knows how to flatten or fan out internally.

You can also set `WaitingFor` directly on `ContainerRequest` when you use `GenericContainer`. That path skips the wrapping. Same field, different reach.

## Log-based: `ForLog`

The cheapest strategy is `ForLog`. The default form does a substring count: it reads the container's full log stream every interval and looks for the literal string you passed in.

```go
wait.ForLog("database system is ready to accept connections")
```

Add `.AsRegexp()` and the match becomes a regex; `.WithOccurrence(n)` requires N matches before declaring readiness, useful for processes that print the same readiness line once per shard. The most surgical option is `.Submatch(cb)`, which calls a callback with the regex's submatches; that callback can also return a `*PermanentError` to abort the wait immediately rather than poll to the timeout. It is the strategy's only escape hatch out of "keep retrying until the deadline".

The polling loop reads the full log stream every tick. That is intentional but not free: long-running containers with a lot of output mean each poll re-reads everything since startup. To avoid an infinite loop on a dead container that has stopped producing logs, the strategy short-circuits when the read buffer length has not changed since the last poll and the preflight check is unhappy. If the log is frozen and the container is gone, the strategy returns the preflight error rather than waiting for the deadline.

`ForLog` is tempting because a single line of output is often the most explicit "I am ready" signal a container produces. The catch is that log strings change. A future minor release of Postgres could reword "database system is ready to accept connections" and every test that wait-for-log'd against it would silently start flaking. Listening ports rarely shift between minor versions of the same image; log lines often do. The library's recommendation, and mine, is to avoid `ForLog` on its own. Prefer `ForListeningPort` (or `ForExposedPort` / `ForMappedPort`) as the primary signal, and reach for `ForLog` either inside a `ForAll` composite alongside a port check (the port confirms the socket is open, the log adds belt-and-braces confidence), or as the last resort when the container has no port to probe at all.

## Port-based: `ForListeningPort`, `ForExposedPort`, `ForMappedPort`

For anything that exposes a network service, you reach for the host-port strategies. Three constructors:

```go
wait.ForListeningPort("5432/tcp") // wait for a specific port to be listening
wait.ForExposedPort()             // pick the lowest exposed port, wait for it
wait.ForMappedPort("5432/tcp")    // only wait for the port to be mapped, no probe
```

What makes the strategy interesting is that it does two checks. The first is the **external check**, where the test process dials the host-mapped port directly. The second is the **internal check**, which execs a small shell command inside the container to ask the kernel and the network whether something is actually listening. The shell command itself is worth a glance because it is a triple-fallback for portable Unixes:

```sh
cat /proc/net/tcp* | awk '{print $2}' | grep -i :%04x ||
nc -vz -w 1 localhost %d ||
/bin/sh -c '</dev/tcp/localhost/%d'
```

If `/proc/net/tcp` is unreadable, try `nc`. If `nc` is not present, try bash's `/dev/tcp` redirection. One of them will usually work.

The strategy reports success when both checks pass. `SkipInternalCheck` / `SkipExternalCheck` let you opt out of one. `ForMappedPort` is a shortcut that applies both skips, leaving only "Docker has finished binding the host port" as the success condition.

There is a gentle degradation worth knowing about: if the internal check returns exit code 126 (shell present but not executable) or 127 (shell not found at all), the strategy logs a warning and falls back to the external check alone. Distroless images and busybox-less images do not get treated as failures; they just lose the second layer of probing.

## Application-level health: `ForHTTP`, `ForHealthCheck`, `ForExec`, `ForSQL`

This is a group of four, each with a different probe.

**`ForHTTP`** is the widest-surfaced strategy in the package. It builds a real HTTP request and dispatches it on every tick. The defaults are GET, a 200 status code as the success condition, and auto-detection of the lowest exposed TCP port when you do not set one. The constructor doc comment in the source mentions port 80, but the code initialises the port to the zero value and always falls into the auto-detection branch unless `WithPort` has assigned one. Everything else is configurable: `WithStatusCodeMatcher(func(int) bool)` for a custom predicate, `WithResponseMatcher(func(io.Reader) bool)` for body inspection, `WithResponseHeadersMatcher(func(http.Header) bool)` for headers, `WithBasicAuth`, `WithMethod`, `WithBody`, `WithHeaders`, and `WithTLS(true, &tls.Config{...})` for HTTPS. There is also `WithAllowInsecure(true)` for self-signed certs and `WithForcedIPv4LocalHost()` for the moby/moby IPv6 issues that the source code links to: [moby/moby#42442](https://github.com/moby/moby/issues/42442) and [moby/moby#42375](https://github.com/moby/moby/issues/42375).

When no port is set, the strategy inspects the container and picks the lowest-numbered exposed TCP port. I have leaned on this default plenty of times. It is one less thing to keep in sync between the chart and the test.

**`ForHealthCheck`** is the laziest of the four, and that is a compliment. The image's `HEALTHCHECK` directive does all the probing; the strategy just polls `state.Health.Status` and waits for it to become `container.Healthy`. Zero work for the library. If the image author wrote a good healthcheck, you should use it. If they did not, this strategy will hang on `container.Starting` forever.

**`ForExec`** is the universal escape hatch. It executes an arbitrary command inside the container and waits for a chosen exit code, default 0:

```go
wait.ForExec([]string{"pg_isready", "-U", "postgres"})
```

The default exit-code matcher is exact-equals-zero; use `WithExitCode(n)` for a specific non-zero, `WithExitCodeMatcher(func(int) bool)` for a predicate, and `WithResponseMatcher(func(io.Reader) bool)` to also inspect stdout/stderr. When no other strategy fits the container's actual readiness condition, `ForExec` almost always does.

**`ForSQL`** is the SQL-specific cousin of `ForExec`. It opens a `database/sql` connection through a caller-supplied DSN builder, pings it, and runs a probe query (`SELECT 1` by default, override with `WithQuery`). The signature changed [a few days ago](https://github.com/testcontainers/testcontainers-go/pull/3650): the DSN builder now receives `network.Port` instead of `string`, which lets the caller pull whichever shape they actually want without re-parsing.

The canonical Postgres call site, lifted from the module's own tests:

```go
port := "5432/tcp"
dbURL := func(host string, p network.Port) string {
    return fmt.Sprintf("postgres://postgres:password@%s:%s/%s?sslmode=disable", host, p.Port(), dbname)
}

wait.ForSQL(port, "postgres", dbURL)
```

`p.Port()` returns the bare numeric string, `p.Proto()` the protocol, `p.String()` the canonical `"5432/tcp"` form. Whatever the driver's URL format wants.

The thread connecting these four: each lets the application itself answer "ready". No log scraping, no port poking. A real protocol round-trip.

## The unusual two: `ForFile` and `ForExit`

Two strategies in the package only make sense if you flip the usual mental model of "ready means alive and accepting traffic".

**`ForFile`** waits for a file to appear inside the container. The polling loop calls `target.CopyFileFromContainer` and treats any `errdefs.IsNotFound` as "keep waiting". Everything else is a failure. Add `.WithMatcher(func(io.Reader) error)` and you can also validate the contents: the matcher can return `errdefs.ErrNotFound` itself to keep polling, or any other error to fail. The use case is containers that signal readiness by writing a marker file, common in cluster bootstrapping scripts and some custom CI workloads.

**`ForExit`** is the inverse of every other strategy in this post. It waits for the container to **stop running**. The default constructor has no timeout at all; only `WithExitTimeout` adds one. It is built for one-shot containers, the migrations and fixture loaders that succeed by finishing. For those, "running" means "still working" and "ready" means "done".

Both of these are reminders that "ready" is a contract, not a fixed condition. Sometimes the contract is "a file is on disk". Sometimes it is "the process exited cleanly".

## The escape hatch: `ForNop`

The package exposes a tiny piece of infrastructure for the cases where none of the built-in strategies fit. `ForNop` wraps an arbitrary closure as a `Strategy`:

```go
wait.ForNop(func(ctx context.Context, target wait.StrategyTarget) error {
    // your custom readiness check here
    return nil
})
```

No timeout helpers, no fluent builders, no polling loop. Just your function, exactly as you wrote it.

The package also exports `NopStrategyTarget`, a stub implementation of `StrategyTarget` with zero-valued returns. Its only purpose is unit-testing custom strategies in isolation. If you write your own `Strategy` and want a test that does not require a real container, this is the seed.

I would not pick `ForNop` as a first choice. The built-ins cover almost everything, and they share the same timing model and preflight. But it is good to know the door exists.

## AND composition: `ForAll` and `MultiStrategy`

Most non-trivial readiness conditions are not single probes; they are combinations. `ForAll(s1, s2, ...)` returns a `*MultiStrategy`. Its `WaitUntilReady` runs every child sequentially. Success means every child returned nil. Failure on any child is propagated immediately.

Two timeout controls:

- `WithStartupTimeoutDefault(d)` sets a per-strategy default applied only to children that do not already declare their own `Timeout()`.
- `WithDeadline(d)` is a wall-clock cap that wraps the whole composite call in a `context.WithTimeout`. It replaces the older `WithStartupTimeout`, which is now deprecated but still routes to `WithDeadline`.

There is a small but important nil-guard: any nil child in the `Strategies` slice is silently skipped. This is what lets a module build a strategy in pieces, possibly leaving slots empty until later container-customizer options fill them in, without worrying about a `nil` panic in the prune loop.

The canonical use is "port open and log line appeared". The Postgres module is the textbook example: it composes `ForListeningPort` with `ForLog("database system is ready to accept connections")` and runs them in that order. You can find similar shapes throughout the modules directory; the same pattern shows up in the [GoFiber post](/posts/2025-05-27-gofiber-services-testcontainers) and in the worked module write-up in [Subscriptions: From Idea to Testcontainers Module](/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module).

## Racing strategies: `ForAny` and `AnyMultiStrategy`

This is the newest piece in the package. `ForAny` and `AnyMultiStrategy` were added [in PR #3719](https://github.com/testcontainers/testcontainers-go/pull/3719), merged a couple of days ago. `ForAny(s1, s2, ...)` returns an `*AnyMultiStrategy`, the OR-shaped sibling of `ForAll`. The mechanics are different from `ForAll` in two ways that matter.

First, the children run in parallel. Each strategy gets its own goroutine:

```go
go func() { resCh <- strategy.WaitUntilReady(strategyCtx, target) }()
```

Second, the composite cancels everything the moment the first result lands. The context is set up at the top of `WaitUntilReady` with `context.WithCancel` and a deferred cancel, so when one child wins, cancellation propagates through the rest. They observe `ctx.Done()` and return.

The success condition is "first child returns nil". The failure condition is also "first child returns an error". The source spells this out:

```go
// Failures are not permitted: any strategy which fails will have its error
// immediately returned.
```

That is not the semantics of `Promise.any` in JavaScript, which only fails when every alternative fails. `ForAny` is closer to a race-to-first-result, and the race counts both completions and errors. Worth understanding before you reach for it.

To set the two side by side:

| | `ForAll` | `ForAny` |
|---|----------|----------|
| Composition | AND | race-to-first-result |
| Order | sequential | parallel goroutines |
| Success | every child returned nil | first child returned nil |
| Failure | any child returned an error | any child returned an error |

A motivating use case is a container with multiple readiness signals where any one is enough: a process that prints either of two log lines depending on the image variant, for example, or a server that accepts both a TCP probe and an HTTP health endpoint and you do not care which one comes up first. `ForAny` lets you express that without writing a custom `ForNop` closure.

## Walking the tree: `wait.Walk`

The last piece is a meta-tool that most application authors will never use, but module authors should know about. The package exposes `Walk(root *Strategy, visit VisitFunc) error`, a traversal over a strategy tree:

```go
func Walk(root *Strategy, visit VisitFunc) error
```

The visit function returns either `nil` (continue), `ErrVisitStop` (halt the walk), or `ErrVisitRemove` (remove the current node and continue). The implementation recurses into composites with a type switch over `(*root).(type)` covering both `*MultiStrategy` and `*AnyMultiStrategy`, and the recursion itself lives in a shared `walkAndMutate` helper that handles `ErrVisitRemove` by dropping the node via `slices.Delete`. The traversal is uniform across both composites: whether you composed with `ForAll` or `ForAny`, `Walk` visits every node in the same way.

The reason this exists is for modules that need to surgically modify an inherited strategy. Imagine a Postgres module that defaults to `ForAll(ForListeningPort, ForLog)`, and a caller who wants to keep the port probe but swap the log line for their own. Walking the tree, finding the log strategy, and removing it (then appending a replacement) is the path the API encourages.

## Choosing one

Use a port strategy for anything network-facing. Use `ForHTTP` or `ForSQL` when the application speaks a protocol you can test directly. Use `ForHealthCheck` when the image author already wrote you a `HEALTHCHECK` directive. Use `ForExec` when none of the above fit and you can express readiness as a command exit code. Use `ForFile` for marker-file workflows and `ForExit` only for one-shot containers where finishing is the point. Use `ForLog` only inside a `ForAll` composite alongside a stronger signal, or as a last resort when nothing else is probeable. Reach for `ForNop` last; the built-ins cover almost everything.

For compound conditions where every signal must hold, compose with `ForAll`. For conditions where any of several signals is enough, compose with `ForAny`. The wrapping the engine does is the same either way: a single root strategy, walked by a single hook.

## Closing

Eleven strategy types (Log, HostPort, HTTP, Health, Exec, SQL, File, Exit, Nop, MultiStrategy / ForAll, AnyMultiStrategy / ForAny), one tiny interface, one shared preflight, one pair of universal defaults (60s, 100ms), four functional options, and one tree-walk utility. All of it wired into the engine by a single fifteen-line `PostStarts` hook that flips one atomic boolean when the strategy returns nil.

The whole readiness layer rides on the same lifecycle-hook machinery that user-defined `PreStarts`, `PostStarts`, `PreTerminates`, and `PostTerminates` hooks ride on. Which is the next post in the series.

---

*Resources:*
- *[testcontainers-go on GitHub](https://github.com/testcontainers/testcontainers-go)*
- *[`wait/` package source](https://github.com/testcontainers/testcontainers-go/tree/main/wait)*
- *[Testcontainers wait strategies docs](https://golang.testcontainers.org/features/wait/introduction/)*
- *[Wait, All strategies docs](https://golang.testcontainers.org/features/wait/all/)*
- *[Wait, Any strategies docs](https://golang.testcontainers.org/features/wait/any/)*
