---
title: "Understanding Testcontainers: The Lifecycle Hook System"
date: 2026-06-19 09:00:00 +0200
description: "The library's whole feature set, from file copy to wait strategies to log consumers, is implemented as lifecycle hooks. Two hook function types, eleven stages, five default hooks, and the dispatch that ties them together. Read straight from lifecycle.go."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "lifecycle-hooks"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks/cover.png"
related:
  - "/posts/2026-06-15-understanding-testcontainers-wait-strategies"
  - "/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options"
  - "/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module"
---

![Understanding Testcontainers: The Lifecycle Hook System](/images/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks/cover.png)

I am a core maintainer of [testcontainers-go](https://github.com/testcontainers/testcontainers-go). The [second post in this series](/posts/2026-06-15-understanding-testcontainers-wait-strategies) closed on a teaser: the wait strategy is just a `PostStarts` lifecycle hook. So is the streamer that routes container logs to your consumers. So is the file copier that puts your test fixtures inside the container. So is the friendly emoji-decorated logger that announces "🐳 Creating container" and "✅ Container started" on every run. The library's feature set is, almost in its entirety, a set of lifecycle hooks installed at the right moment.

This post is the tour. Two hook function types, eleven stages, the dispatch that fires them, and the five default hooks that the library installs on every container. By the end you should be able to point at any default behaviour ("how does `Files` copy in?", "how does the log consumer start?") and know which hook implements it.

## Two hook function types

Both types are defined in `lifecycle.go`, alongside the struct that holds them. The first is `ContainerRequestHook`:

```go
type ContainerRequestHook func(ctx context.Context, req ContainerRequest) error
```

This one runs while there is still no container, only a request. It can mutate the request before the engine hands it to Docker.

The second is `ContainerHook`:

```go
type ContainerHook func(ctx context.Context, ctr Container) error
```

This one runs after `Docker.ContainerCreate` has returned a real container ID. The hook operates on the live `Container`: it can read state, exec inside the container, copy files to it, and so on.

The split exists because the input is different on each side of `Create`. Before create, you have a request you can change. After create, the request is frozen and you have a container handle.

## The ContainerLifecycleHooks struct

Eleven named slices on a single struct:

```go
type ContainerLifecycleHooks struct {
    PreBuilds      []ContainerRequestHook
    PostBuilds     []ContainerRequestHook
    PreCreates     []ContainerRequestHook
    PostCreates    []ContainerHook
    PreStarts      []ContainerHook
    PostStarts     []ContainerHook
    PostReadies    []ContainerHook
    PreStops       []ContainerHook
    PostStops      []ContainerHook
    PreTerminates  []ContainerHook
    PostTerminates []ContainerHook
}
```

Three of the slices hold `ContainerRequestHook`: `PreBuilds`, `PostBuilds`, `PreCreates`. The other eight hold `ContainerHook`. Note the asymmetry around `Create`: `PostCreates` is a `ContainerHook`, not a `ContainerRequestHook`, because by then the container exists.

Each slice can hold many hooks. Multiple registrations stack; the slice is the queue.

## The eleven stages, in order

Walking the timeline from Docker's perspective:

- **Building**: a request hook that fires before the engine builds an image from the request. Only relevant when the request actually triggers a build, for example a `FromDockerfile` request.
- **Built**: fires after the image build returns. Same conditional firing as Building.
- **PreCreates**: the last request hook. Runs immediately before `Docker.ContainerCreate`. This is where the library's own default hook mutates the `dockerInput`, `hostConfig`, and `networkingConfig` to bridge the user-friendly request fields to Docker's API.
- **PostCreates**: fires immediately after `Docker.ContainerCreate` returns. The container exists; nothing has been started yet.
- **PreStarts**: runs before `Docker.ContainerStart`.
- **PostStarts**: runs immediately after `ContainerStart` returns. The default readiness hook lives here; user hooks at this stage run before the readiness wait, which is the most-cited gotcha of the whole system (more on that below).
- **PostReadies**: runs after the readiness wait has succeeded. Anything in your hook here can assume the container is responding to its probe.
- **PreStops**: runs before a graceful stop.
- **PostStops**: runs after the container has stopped.
- **PreTerminates**: runs before terminate (remove).
- **PostTerminates**: runs after the container is gone. Cleanup that must always run, including after a failed test, goes here.

The library has a matching dispatch method on `*DockerContainer` for each container-side stage: `createdHook`, `startingHook`, `startedHook`, `readiedHook`, `stoppingHook`, `stoppedHook`, `terminatingHook`, `terminatedHook`. The corresponding sites in `docker.go` call them at the right moment during create, start, stop, and terminate.

## How a stage is dispatched

There are two `applyLifecycleHooks` methods. One is on `ContainerRequest`, used for the request-hook stages (Building, Built, PreCreates). The other is on `*DockerContainer`, for the container-hook stages (PostCreates and everything after).

Both iterate over the outer slice `req.LifecycleHooks` (or `c.lifecycleHooks`), which is itself a slice of `ContainerLifecycleHooks` structs. The library's defaults end up in that slice alongside whatever the user added. For each struct, the dispatch method extracts the right inner slice and runs the hooks through one of two helpers:

- `containerRequestHook(ctx, hooks)(req)` iterates request hooks top-to-bottom and returns on the first error.
- `containerHookFn(ctx, hooks)(c)` iterates container hooks top-to-bottom and collects errors with `errors.Join`, so every hook runs even if one fails.

The container variant takes a `logError` boolean. When the call site passes `logError = true` and a hook returns an error, the engine prints the container's logs to the configured logger before returning. This is useful for `PreStarts` mutations that break the container in a way you would otherwise have nothing to look at.

`ContainerLifecycleHooks` has one stage method per slice (`Building`, `Built`, `Creating`, ..., `Terminated`), each a thin pass-through that picks the matching inner slice and wraps it in the appropriate helper. They exist so the dispatch methods can call e.g. `lifecycleHooks.Started(ctx)` without knowing which inner slice to reach for.

## How user hooks compose with defaults

`req.LifecycleHooks` is, deliberately, a slice. User-supplied hooks go in via `WithLifecycleHooks` (replace the slice) or `WithAdditionalLifecycleHooks` (append). Both options follow the `Additional`-prefix convention covered in [post #1](/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options).

The engine's own default hooks (the five we are about to walk through) are not added directly to that slice. During `CreateContainer`, the engine assembles its defaults, then calls `combineContainerHooks(defaultHooks, userDefinedHooks)` to merge them into a single `ContainerLifecycleHooks` struct that becomes the container's `lifecycleHooks` list.

The merge uses reflection over the struct fields. The source comment is explicit about why:

> We use reflection here to ensure that any new hooks are handled.

So when a new lifecycle field is added to the struct, the merge logic does not need to change.

What does change is the order. The merge is asymmetric, and the source comment spells it out:

> Pre-hooks run the default hooks first then the user-defined hooks
> Post-hooks run the user-defined hooks first then the default hooks

In any `Pre*` stage (PreBuilds, PreCreates, PreStarts, PreStops, PreTerminates), the default hooks run first and user hooks run after. In any `Post*` stage (PostBuilds, PostCreates, PostStarts, PostReadies, PostStops, PostTerminates), the user hooks run first and the defaults run after.

This has one consequence worth tattooing on the inside of your eyelids. The readiness wait is implemented as a default `PostStarts` hook. The asymmetric merge means a user `PostStarts` hook runs *before* the readiness default. If you write a `PostStarts` hook expecting to do work against a "ready" container, it will run before the wait strategy has finished. The library has a stage specifically for this: `PostReadies`. Use it.

Within a single inner slice, hooks run in the order they were appended. `containerHookFn` and `containerRequestHook` both iterate the slice top-to-bottom. Registration order equals execution order. If you stack three hooks into `PostStarts` and one of them must run before the others, append it first.

## How modules inject their own hooks

Modules are not special. They use the same two options the public API exposes: `WithLifecycleHooks` and `WithAdditionalLifecycleHooks`. The choice between the two is positional, not philosophical. It depends on where in the option pipeline the call runs.

A concrete example. The Kafka module's `Run` builds a list of options first, then appends the user-supplied options last:

```go
moduleOpts := []testcontainers.RequestCustomizer{
    // ... a handful of base options ...
    testcontainers.WithLifecycleHooks(testcontainers.ContainerLifecycleHooks{
        PostStarts: []testcontainers.ContainerHook{
            func(ctx context.Context, c testcontainers.Container) error {
                if err := copyStarterScript(ctx, c); err != nil {
                    return fmt.Errorf("copy starter script: %w", err)
                }
                return wait.ForLog(".*Transitioning from RECOVERY to RUNNING.*").
                    AsRegexp().WaitUntilReady(ctx, c)
            },
        },
    }),
}
moduleOpts = append(moduleOpts, opts...)
```

At the moment Kafka calls `WithLifecycleHooks`, `req.LifecycleHooks` is still empty. `WithLifecycleHooks` (which sets `req.LifecycleHooks = hooks`) and `WithAdditionalLifecycleHooks` (which appends) are interchangeable here, because there is nothing to clobber. Kafka picked the terser form. Dex does the same in its own `Run`.

Now contrast that with the MongoDB module. The `initiateReplicaSet` function returns a customizer that the user opts into via the `WithReplicaSet` option:

```go
func initiateReplicaSet(cli mongoCli, replSetName string) testcontainers.CustomizeRequestOption {
    return func(req *testcontainers.GenericContainerRequest) error {
        req.WaitingFor = wait.ForAll(
            req.WaitingFor,
            wait.ForExec(cli.eval("rs.status().ok")),
        ).WithDeadline(60 * time.Second)

        if err := testcontainers.WithAdditionalLifecycleHooks(
            testcontainers.ContainerLifecycleHooks{
                PostStarts: []testcontainers.ContainerHook{
                    func(ctx context.Context, c testcontainers.Container) error {
                        ip, err := c.ContainerIP(ctx)
                        if err != nil {
                            return fmt.Errorf("container ip: %w", err)
                        }
                        cmd := cli.eval(
                            "rs.initiate({ _id: '%s', members: [ { _id: 0, host: '%s:27017' } ] })",
                            replSetName, ip,
                        )
                        return wait.ForExec(cmd).WaitUntilReady(ctx, c)
                    },
                },
            },
        )(req); err != nil {
            return fmt.Errorf("lifecycle hooks: %w", err)
        }
        return nil
    }
}
```

This option runs *later* in the pipeline, after the MongoDB module's base setup has already populated `req.LifecycleHooks`, and possibly after other user options. `WithLifecycleHooks` here would wipe everything that came before. `WithAdditional` is the only safe choice.

So the rule is positional:

- First in `moduleOpts`, before any other option has added hooks, either form is interchangeable.
- Inside a conditional helper option, or any time the call is not the first thing to touch `req.LifecycleHooks`, you must use `WithAdditional` or lose what came before.

The pattern is consistent across all the modules. Dex uses `WithLifecycleHooks` in base setup. Elasticsearch, MSSQL, OpenLDAP, etcd, and Forgejo all use `WithAdditionalLifecycleHooks` from conditional helpers. The split tracks the positional rule exactly.

One caveat for module authors. Kafka's base-setup `WithLifecycleHooks` has a subtle fragility: if a user passes `testcontainers.WithLifecycleHooks(...)` as an option to `kafka.Run`, the user's call (running after Kafka's base setup) overwrites the module's hook. Using `WithAdditional` in the module's base setup would prevent that. Modules that prefer to be defensive use `WithAdditional` everywhere. Modules that prefer terseness, like Kafka and Dex, treat user-side replacement as the user's explicit choice.

If you want to see a module-authoring walk-through end-to-end, the [Subscriptions module post](/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module) covers the pattern from idea to ship.

## Default hook 1: DefaultLoggingHook

`DefaultLoggingHook` is the easiest hook to read first because it touches every stage. It takes a logger and returns a fully-populated `ContainerLifecycleHooks` struct where every slice has exactly one entry: an emoji-decorated `logger.Printf`. Here is an excerpt:

```go
var DefaultLoggingHook = func(logger log.Logger) ContainerLifecycleHooks {
    shortContainerID := func(c Container) string {
        return c.GetContainerID()[:12]
    }
    return ContainerLifecycleHooks{
        PreBuilds: []ContainerRequestHook{
            func(_ context.Context, req ContainerRequest) error {
                logger.Printf("🐳 Building image %s:%s", req.GetRepo(), req.GetTag())
                return nil
            },
        },
        // ...
        PreStarts: []ContainerHook{
            func(_ context.Context, c Container) error {
                logger.Printf("🐳 Starting container: %s", shortContainerID(c))
                return nil
            },
        },
        // ...
    }
}
```

The full set of lines fires from `🐳 Building image foo:bar` and `✅ Built image foo:bar` through `🐳 Creating container`, `✅ Container created`, `🐳 Starting container`, `✅ Container started`, `🔔 Container is ready`, `🐳 Stopping container`, `✅ Container stopped`, `🐳 Terminating container`, and ends at `🚫 Container terminated`. Eleven lines, one per stage.

## Default hook 2: defaultPreCreateHook

A single `PreCreates` slot. The hook calls `p.preCreateContainerHook`, the engine method that reconciles a user's `ContainerRequest` with Docker's API before `Docker.ContainerCreate` runs.

What that reconciliation actually covers:

- Validates each `Mount` whose source implements the `Validator` interface; surfaces all validation errors via `errors.Join`.
- Maps `req.Mounts` to `hostConfig.Mounts`.
- Attaches the first network in `req.Networks` to the container at create time, with any aliases from `req.NetworkAliases`. Docker only allows one network at create; the rest are wired up after the container exists, elsewhere in `docker.go`.
- Applies `req.ConfigModifier` to `dockerInput`, falling back to `defaultConfigModifier(req)` if the caller did not set one.
- Applies `req.HostConfigModifier` to `hostConfig`, with the same default fallback.
- Applies `req.EndpointSettingsModifier` to the endpoint settings map, if set.
- If `req.ExposedPorts` is empty and the network mode is not "container", inspects the image and copies its declared `ExposedPorts`. So a container built from `nginx` with no explicit `ExposedPorts` still gets port 80 exposed without anyone writing it down.
- Parses the resulting exposed-port set and merges it with `hostConfig.PortBindings`.

This is the hook where almost every "user-friendly request field" gets translated to the shape Docker actually wants. None of the subsequent default hooks would have a container to work with if this one did not run first.

## Default hook 3: defaultCopyFileToContainerHook

A single `PostCreates` slot. The source comment is explicit about the timing:

> copy files to container after it's created but before it's started

For each `ContainerFile` in `req.Files`, the hook first calls `f.validate()` and returns a wrapped error on failure. Then it picks a copy method based on which field is set:

- If `f.Reader` is not nil, it reads all bytes from the reader and calls `c.CopyToContainer(ctx, bytes, f.ContainerFilePath, f.FileMode)`.
- Otherwise it calls `c.CopyFileToContainer(ctx, f.HostFilePath, f.ContainerFilePath, f.FileMode)`.

`Reader` takes precedence over `HostFilePath` when both are set. The source comment on the relevant branch literally says "Bytes takes precedence over HostFilePath".

This is why setting `req.Files` on a `ContainerRequest` "just works" without anyone writing a "copy step". The hook does the work, before the container is started, before any wait strategy sees it.

## Default hook 4: defaultLogConsumersHook

Two slots: `PostStarts` to begin streaming logs, `PostStops` to stop. Both early-out if `cfg == nil || len(cfg.Consumers) == 0`.

`PostStarts` calls `dockerContainer.resetConsumers(cfg.Consumers)` to install the consumer set, then `dockerContainer.startLogProduction(ctx, cfg.Opts...)` to begin streaming Docker logs into those consumers. `PostStops` calls `dockerContainer.stopLogProduction()`.

The source comment on each slot points the reader at the composition machinery:

> See combineContainerHooks for the order of execution.

That comment is mostly relevant when you stack your own `PostStarts` log-related hook alongside this one and wonder which fires first. The answer, per the asymmetric merge rule we covered earlier, is that your `PostStarts` hook runs before this default. If your hook depends on the consumers having been wired up already, register a `PostReadies` hook instead.

## Default hook 5: defaultReadinessHook

A single `PostStarts` slot. The hook calls `WaitingFor.WaitUntilReady` if a wait strategy is set on the container, and only flips `isRunning` to `true` once that call returns without error. [Post #2](/posts/2026-06-15-understanding-testcontainers-wait-strategies) walks through this hook in full, including every wait strategy the library ships.

The only thing worth restating here is the framing. The readiness layer is not a special code path. It is a `PostStarts` hook like any other, with the same dispatch rules, the same composition behaviour, and the same gotchas.

## Choosing a stage

A short opinionated guide for where to drop a user-defined hook:

- **Mutating the Docker config** (image platform, host config, etc.): `PreCreates`. The default `PreCreates` runs first, then your hook. Anything you set will not be touched by the engine afterwards.
- **Installing files**: do not write a `PostCreates` hook. Just use `req.Files`; the default `defaultCopyFileToContainerHook` handles it.
- **Warm-up work that requires the container to be ready**: `PostReadies`, not `PostStarts`. The asymmetric merge means a user `PostStarts` runs before the readiness default; `PostReadies` is the only stage that runs strictly after the wait strategy has succeeded.
- **Graceful shutdown**: `PreStops`.
- **Cleanup that must run on every termination, including after a failed test**: `PostTerminates`. Useful for forwarding logs to an external store or recording final state.
- **Avoid `PreBuilds` and `PostBuilds`** unless your request actually triggers a build. They will not fire for a plain `Run(ctx, "postgres:16-alpine")`.

## Closing

The lifecycle hook system is not an extension point you might one day reach for. It is the architecture the library is built on. File copy is a hook. Log streaming is a hook. The wait strategy is a hook. Even the friendly 🐳 / ✅ / 🚫 startup logger is a hook. The same machinery you would use to plug in your own warm-up step is the machinery that makes the library do what it already does.

The next post follows the same thread one layer outward: the module layer. `modules/postgres.Run`, `modules/redis.Run`, `modules/kafka.Run`, and the rest are not standalone constructions. They are thin wrappers around the same `Run` we have been looking at, with their own option types and base setups composing on top of exactly the hook system we just covered.

---

*Resources:*
- *[testcontainers-go on GitHub](https://github.com/testcontainers/testcontainers-go)*
- *[`lifecycle.go` source](https://github.com/testcontainers/testcontainers-go/blob/main/lifecycle.go)*
- *[Testcontainers lifecycle hooks docs](https://golang.testcontainers.org/features/creating_container/#lifecycle-hooks)*
