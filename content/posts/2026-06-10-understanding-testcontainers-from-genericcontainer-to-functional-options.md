---
title: "Understanding Testcontainers: From GenericContainer to Functional Options"
date: 2026-06-10 09:00:00 +0200
description: "How testcontainers-go's API surface is shaped: the older `GenericContainer(ctx, req)` primitive that takes a request struct, the modern `Run(ctx, img, opts...)` convenience wrapper, and the functional options that mutate the request underneath. Both still coexist in the source; here's what each one does."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "functional-options"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options/cover.png"
related:
  - "/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module"
  - "/posts/2025-05-27-gofiber-services-testcontainers"
---

![Understanding Testcontainers: From GenericContainer to Functional Options](/images/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options/cover.png)

I am a core maintainer of [testcontainers-go](https://github.com/testcontainers/testcontainers-go). This post opens a series on the library's internals: how the API is shaped, how containers wait until they are ready, how the module system layers on top of the core, how cleanup works. Each part stands on its own. Each part is written by reading the source directly, so every claim in the post traces back to the code.

When you call `postgres.Run(ctx, "postgres:16-alpine")` in a test, there is a small layered mechanism behind that single line that most users of testcontainers-go never need to see. It is worth looking at anyway, because once you know what is down there, the rest of the library stops feeling like magic. That `Run` is not magic. It is a convenience wrapper that takes an image and a variadic list of options, builds a large struct holding every field of the container's configuration, and delegates to an older function called `GenericContainer` that is still exported and can be called directly.

We start at the most visible piece: the API you actually call when you create a container. We will look at the two ways the library exposes for constructing one, the request struct underneath, and how functional options like `WithEnv` or `WithExposedPorts` end up in that struct. Everything in here can be verified by reading `generic.go`, `options.go`, and `container.go` on the main branch of `testcontainers-go`. If you have seen `postgres.Run` in action in posts like [GoFiber Services with Testcontainers](/posts/2025-05-27-gofiber-services-testcontainers), you have used the surface. Here is what is under it.

## `GenericContainer`, the underlying primitive

Inside the `testcontainers` package there are two ways to create a container. The older one is `GenericContainer`. Its signature:

```go
func GenericContainer(ctx context.Context, req GenericContainerRequest) (Container, error)
```

It takes a context and a `GenericContainerRequest` value, returns a `Container` (an interface) and an error. It is not deprecated. It is still exported, still called from inside `Run`, and you can use it directly today.

The doc comment on `Run` itself, two function definitions below, makes the relationship explicit:

> Run is a convenience function that creates a new container and starts it. It calls the GenericContainer function and returns a concrete DockerContainer type.

That is the architectural story in one sentence. `GenericContainer` is the primitive. `Run` is built on top of it. The newer code does not replace the older code; it wraps it. For test code you write today, the answer is almost always `Run`; the rest of this post walks through why.

## The two requests, side by side

To create a container you fill out a request. There are two request types, and the difference matters.

`ContainerRequest` is the per-container configuration. It is a large struct, over forty fields, many of them marked `Deprecated`. A representative slice of the live fields:

```go
type ContainerRequest struct {
    Image          string
    Env            map[string]string
    Cmd            []string
    ExposedPorts   []string
    Mounts         ContainerMounts
    WaitingFor     wait.Strategy
    LifecycleHooks []ContainerLifecycleHooks
    Labels         map[string]string
    // ...
}
```

The deprecated fields point at modifier functions: `Hostname`, `WorkingDir`, `Privileged`, `Binds`, `CapAdd`, `CapDrop`, and others all say "Use `ConfigModifier`" or "Use `HostConfigModifier` instead". The library is moving toward function-shaped configuration even within the struct itself.

`GenericContainerRequest` is small. It embeds `ContainerRequest` and adds the metadata the library needs to decide how to call the provider:

```go
type GenericContainerRequest struct {
    ContainerRequest              // embedded request for provider
    Started          bool         // whether to auto-start the container
    ProviderType     ProviderType // which provider to use, Docker if empty
    Logger           log.Logger   // provide a container specific Logging
    Reuse            bool         // reuse an existing container if it exists
}
```

Two layers, two questions:

- `ContainerRequest` answers "what container do you want?".
- `GenericContainerRequest` answers "how should the library call the provider for it?".

Almost every field you change as a user lives on the inner struct. The outer one carries call-level flags you set once: do we auto-start, do we reuse by name, which provider do we use.

## `Run` and the functional options layer

The full body of `Run` is small enough to read at a glance:

```go
func Run(ctx context.Context, img string, opts ...ContainerCustomizer) (*DockerContainer, error) {
    req := ContainerRequest{
        Image: img,
    }

    genericContainerReq := GenericContainerRequest{
        ContainerRequest: req,
        Started:          true,
    }

    for _, opt := range opts {
        if err := opt.Customize(&genericContainerReq); err != nil {
            return nil, fmt.Errorf("customize: %w", err)
        }
    }

    ctr, err := GenericContainer(ctx, genericContainerReq)
    var c *DockerContainer
    if ctr != nil {
        c = ctr.(*DockerContainer)
    }
    // ...
}
```

Three things happen here. First, a starting `ContainerRequest` is built with only the image set, then wrapped into a `GenericContainerRequest` with `Started: true`. Second, the variadic options are applied in order via a loop: each `opt.Customize(&genericContainerReq)` is allowed to mutate the request and return an error. Third, the mutated request is handed to `GenericContainer`, and the resulting `Container` interface is type-asserted into a concrete `*DockerContainer`.

The options surface is built around one interface:

```go
type ContainerCustomizer interface {
    Customize(req *GenericContainerRequest) error
}
```

And a function-type adapter so you can write options as plain closures:

```go
type CustomizeRequestOption func(req *GenericContainerRequest) error

func (opt CustomizeRequestOption) Customize(req *GenericContainerRequest) error {
    return opt(req)
}
```

The pattern is intentionally simple. An option is a function that receives a pointer to the `GenericContainerRequest` and is free to read or mutate any of its fields. The library does not impose a schema on what options can do; it just walks the list and calls each one.

## What an option actually does

Knowing the contract is one thing. Seeing it applied to a concrete option makes the pattern click.

`WithEnv`:

```go
func WithEnv(envs map[string]string) CustomizeRequestOption {
    return func(req *GenericContainerRequest) error {
        if req.Env == nil {
            req.Env = map[string]string{}
        }

        maps.Copy(req.Env, envs)

        return nil
    }
}
```

It guarantees the map exists, then merges the new entries on top of any existing ones. Call `WithEnv` twice and the second call's keys override the first call's keys for the same key, but anything you set only in the first call survives.

`WithExposedPorts`:

```go
func WithExposedPorts(ports ...string) CustomizeRequestOption {
    return func(req *GenericContainerRequest) error {
        req.ExposedPorts = append(req.ExposedPorts, ports...)
        return nil
    }
}
```

Same pattern of "take a pointer, mutate the field", different shape. This one appends. Call it twice with different ports and you get both lists concatenated.

The interesting observation: each option decides for itself whether it replaces or accumulates. `WithEnv` merges. `WithExposedPorts` appends. The choice is per-option, and the library has settled on naming conventions to tell them apart.

The dominant one is the `Additional` prefix. When you see a pair, the base form replaces and the `WithAdditionalX` form appends. `WithLifecycleHooks` does `req.LifecycleHooks = hooks`; `WithAdditionalLifecycleHooks` does `req.LifecycleHooks = append(req.LifecycleHooks, hooks...)`. The doc comments call it out: "replaces the wait strategy" versus "appends the wait strategy". Once you know the prefix, the pair reads at a glance:

```go
func WithLifecycleHooks(hooks ...ContainerLifecycleHooks) CustomizeRequestOption {
    return func(req *GenericContainerRequest) error {
        req.LifecycleHooks = hooks
        return nil
    }
}

func WithAdditionalLifecycleHooks(hooks ...ContainerLifecycleHooks) CustomizeRequestOption {
    return func(req *GenericContainerRequest) error {
        req.LifecycleHooks = append(req.LifecycleHooks, hooks...)
        return nil
    }
}
```

The older convention is the `Args` suffix, kept for the `Cmd` and `Entrypoint` pairs. `WithCmd` replaces; `WithCmdArgs` appends. `WithEntrypoint` replaces; `WithEntrypointArgs` appends. Two pairs in the surface still use this shape; everything newer uses `Additional`.

For options without a pair, the choice follows the data structure. Maps merge (`WithEnv`, `WithLabels`, `WithTmpfs`). Most slice options append (`WithExposedPorts`, `WithMounts`, `WithFiles`). A few slice options replace, and they tend to do so because the slice represents a single coherent configuration rather than a list to grow: `WithImageSubstitutors` and `WithLogConsumers` overwrite. When the option does not have a pair and the data structure is ambiguous, the doc comment on the function answers it.

The surface is not yet fully consistent. The `Additional` prefix is where we want to land for all replace-or-append pairs; the older `Args` suffix and the slice-replace exceptions are work we still have on our plate.

For a worked example of how a custom module wires its own options on top of this same pattern, see [Subscriptions: From Idea to Testcontainers Module](/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module).

## Both paths, one example

The cleanest way to see the equivalence is to write the same container twice. Postgres with an env var, an exposed port, and a wait strategy works.

The `GenericContainer` path:

```go
req := testcontainers.GenericContainerRequest{
    ContainerRequest: testcontainers.ContainerRequest{
        Image:        "postgres:16-alpine",
        Env:          map[string]string{"POSTGRES_PASSWORD": "test"},
        ExposedPorts: []string{"5432/tcp"},
        WaitingFor:   wait.ForListeningPort("5432/tcp"),
    },
    Started: true,
}

ctr, err := testcontainers.GenericContainer(ctx, req)
```

The `Run` path:

```go
ctr, err := testcontainers.Run(ctx, "postgres:16-alpine",
    testcontainers.WithEnv(map[string]string{"POSTGRES_PASSWORD": "test"}),
    testcontainers.WithExposedPorts("5432/tcp"),
    testcontainers.WithWaitStrategy(wait.ForListeningPort("5432/tcp")),
)
```

Same container. Same wait strategy. Same auto-start (`Started: true` set explicitly on the left, set by `Run` automatically on the right). The reason they produce equivalent results is `Run`'s final line: it calls `GenericContainer(ctx, genericContainerReq)` after the options loop, so anything you can express via the request struct, you can also express via opts that mutate it.

They are not equal choices for the reader. The `Run` path is what every module in the library uses publicly: `postgres.Run`, `redis.Run`, `kafka.Run`, `localstack.Run`, and so on, all expose the same shape. Helpers like `WithEnv` are reusable across calls. Custom helpers built on `CustomizeRequestOption` plug straight in. The call site reads top-to-bottom. The `GenericContainer` path keeps its place for when you genuinely need to hand-build the request (loading from a config file, or returning the interface for a test double), but for everyday test code the `Run` side of the comparison above is the one to write.

## Two things `Run` does that `GenericContainer` doesn't

`Run` is not just a syntactic shortcut. Two behaviors differ from a hand-built `GenericContainer` call.

**It sets `Started: true` automatically.** The literal in the body of `Run`:

```go
genericContainerReq := GenericContainerRequest{
    ContainerRequest: req,
    Started:          true,
}
```

If you want a container that is created but not started, you have two choices with `Run`: pass `testcontainers.WithNoStart()` (which simply sets `req.Started = false`), or use `GenericContainer` and put `Started: false` on the request yourself. With `GenericContainer`, the default is whatever the zero value of `bool` happens to be, which is `false`, so the request you build is created-but-not-started unless you explicitly opt in. With `Run`, the default is reversed: started, unless you opt out.

**It returns the concrete type, not the interface.** `GenericContainer` returns `(Container, error)`: `Container` is an interface. `Run` returns `(*DockerContainer, error)`: `*DockerContainer` is the concrete type. This follows a well-known Go idiom: "accept interfaces, return concrete types". Returning the concrete type gives callers the full method set of `*DockerContainer` without forcing them to type-assert. The conversion happens with a type assertion at the tail of `Run`, visible in the full body shown earlier (`c = ctr.(*DockerContainer)`). The interface returned by `GenericContainer` is unwrapped to the concrete type so the caller does not have to.

These two together are why `Run` is the path the library is built around. It picks the defaults you want for test code (a started container, a concrete type), and the cost of opting out (`WithNoStart`, or dropping to `GenericContainer` for the interface) is paid only when you actually need to.

## Closing

To recap: `Run(ctx, img, opts...)` is the API to reach for. It wraps `GenericContainer(ctx, req)`, picks the defaults that match how test code actually runs (started, concrete type), and accepts functional options that mutate the underlying request. `GenericContainer` is still there, and worth knowing exists: every `Run` call ends up calling it, and the few cases that need a hand-built request or the interface return type can still drop down to it. For everything else, write `Run`.

Functional options are not magic. They are functions that take a pointer to the request and mutate it. Knowing this unlocks the rest of the series. Next time: how the library decides a container is "ready" after it has started, which turns out to be a surprisingly different question from "is it running".

---

*Resources:*
- *[testcontainers-go on GitHub](https://github.com/testcontainers/testcontainers-go)*
- *[`generic.go` source (Run and GenericContainer)](https://github.com/testcontainers/testcontainers-go/blob/main/generic.go)*
- *[`options.go` source (functional options)](https://github.com/testcontainers/testcontainers-go/blob/main/options.go)*
- *[`container.go` source (ContainerRequest struct)](https://github.com/testcontainers/testcontainers-go/blob/main/container.go)*
