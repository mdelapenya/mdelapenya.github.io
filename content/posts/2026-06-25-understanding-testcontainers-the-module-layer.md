---
title: "Understanding Testcontainers: The Module Layer"
date: 2026-06-25 09:00:00 +0200
description: "65 modules in testcontainers-go, all built on the same Run we have been tracing for three posts. The standard module skeleton, the Container wrapper type, the options dialects, and where individual modules diverge from the shape. Read straight from the modules/ tree."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "modules"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-06-25-understanding-testcontainers-the-module-layer/cover.png"
related:
  - "/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks"
  - "/posts/2026-06-15-understanding-testcontainers-wait-strategies"
  - "/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options"
  - "/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module"
  - "/posts/2025-10-10-coding-agents"
---

![Understanding Testcontainers: The Module Layer](/images/posts/2026-06-25-understanding-testcontainers-the-module-layer/cover.png)

I am a core maintainer of [testcontainers-go](https://github.com/testcontainers/testcontainers-go). The [third post in this series](/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks) closed pointing at the module layer. `modules/postgres.Run`, `modules/redis.Run`, `modules/kafka.Run`, and the rest of them are not standalone constructions. They are thin wrappers around the same `Run` we have been tracing for three posts. Today there are 65 of them in the repository, and I went looking to see how consistent the shape actually is.

This post is the map. The standard skeleton, the Container wrapper type, the two options dialects that coexist inside the same module, the per-call options pattern that some modules layer on top, the deprecated `RunContainer` alias still hanging around, and the handful of places individual modules diverge from the convention. By the end you should be able to open any module in the repository and recognise which pieces are the canonical pattern and which are module-specific decoration.

## The standard module skeleton

Most modules ship with the same set of files. Open `modules/postgres/` and you see:

- `postgres.go`, the public surface (the `Run` function, the `Container` wrapper type, the helper methods).
- `options.go`, the functional options.
- `postgres_test.go`, the tests.
- `examples_test.go`, runnable Go examples that double as documentation.
- `go.mod` and `go.sum`, the module's own dependency manifest.
- `Makefile`, the per-module build targets used by CI.
- `resources/`, an optional folder for embedded fixtures (Postgres ships a custom entrypoint script in there).

The same shape repeats across Redis, Kafka, Mongo, Elasticsearch, and almost every other module I opened. The one detail worth pausing on is `go.mod`. Each module is its own Go module with its own dependency manifest. A user who imports `modules/postgres` does not transitively pull in `modules/kafka`'s dependencies; they get only what Postgres declares. With 65 modules, many of which bring in heavyweight clients (Elasticsearch, Kafka, Cassandra, Mongo), this matters. Pulling them all into one Go module would force every consumer to compile every transitive dependency.

There is a second layer to this. Within a single module, the heavyweight client library is imported only in the `_test.go` files (the runnable examples and integration tests), not in the production code. The MongoDB module's `mongodb.go` imports stdlib, `testcontainers-go`, and `wait`. The `go.mongodb.org/mongo-driver` client only shows up in `examples_test.go`. Kafka does the same: `kafka.go` imports stdlib, `testcontainers-go`, `wait`, and a semver helper. The `github.com/IBM/sarama` client only shows up in `kafka_test.go`. The Go toolchain treats imports reachable only from `_test.go` files as test-only: they enter the module graph for `go test`, but a consumer building a production binary that imports `mongodb.Run` does not pull `mongo-driver` into the compiled output, because nothing reachable from `main` imports it. The heavy client is the test's concern, not the consumer's binary's.

## The Container wrapper type

Every module exposes a struct that wraps the core container handle. From `modules/postgres/postgres.go`:

```go
type PostgresContainer struct {
    testcontainers.Container
    dbName        string
    user          string
    password      string
    snapshotName  string
    sqlDriverName string
}
```

The first field is `testcontainers.Container`, the core container interface, embedded by name. The other fields are per-instance state: the database, user, password, snapshot name, and the SQL driver string used by `Snapshot` and `Restore`.

All the captured fields are lowercase, which means unexported in Go. This is deliberate. The fields are written exactly once, inside `Run`, after `testcontainers.Run` has booted the container and the module has inspected the resulting env to pick up any values the user overrode. After that point, the running container is configured against those values: Postgres is up with that database name, that user, that password. If the fields were exported, a caller could do `c.dbName = "something-else"` an hour later and the wrapper's `ConnectionString` would happily produce a URL that does not match the live container. Keeping the fields private forces all access through the wrapper's methods, which keeps the wrapper's reported state consistent with the container's actual state.

The embedding is the rest of the design. Callers get the full testcontainers method set on the same handle (`Inspect`, `Logs`, `MappedPort`, `Terminate`, everything) while the module's wrapper adds its own helpers. From a caller's perspective there is one type to hold; from the module's perspective there is one place to add methods.

`MySQLContainer`, `RedisContainer`, `KafkaContainer`, and the others all follow the same shape: an embedded `testcontainers.Container` interface, plus lowercase fields for per-instance state. Different captured state, same embedding, same access discipline.

## The Run function

The entry point. Every module exports a `Run` function with the same signature:

```go
func Run(ctx context.Context, img string, opts ...testcontainers.ContainerCustomizer) (*PostgresContainer, error)
```

Three things go in: a context, the image, a variadic list of customizers. One thing comes out: the module's wrapper type (or an error). This matches the signature of the core `testcontainers.Run` that [post #1](/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options) covered, with the return type swapped for the module-specific wrapper.

The body shape is also consistent. From Postgres, slightly trimmed:

```go
func Run(ctx context.Context, img string, opts ...testcontainers.ContainerCustomizer) (*PostgresContainer, error) {
    settings := defaultOptions()
    for _, opt := range opts {
        if apply, ok := opt.(Option); ok {
            apply(&settings)
        }
    }

    moduleOpts := make([]testcontainers.ContainerCustomizer, 0, 3+len(opts))
    moduleOpts = append(moduleOpts,
        testcontainers.WithEnv(map[string]string{
            "POSTGRES_USER":     defaultUser,
            "POSTGRES_PASSWORD": defaultPassword,
            "POSTGRES_DB":       defaultUser,
        }),
        testcontainers.WithExposedPorts("5432/tcp"),
        testcontainers.WithCmd("postgres", "-c", "fsync=off"),
    )

    moduleOpts = append(moduleOpts, opts...)

    ctr, err := testcontainers.Run(ctx, img, moduleOpts...)
    // ...wrap ctr into *PostgresContainer, return.
}
```

Three steps. First, gather the module's local settings from any options that satisfy the module's own `Option` interface (more on this in the next section). Second, build a `moduleOpts` slice that starts with the base options (env vars, exposed ports, command) and ends with the user-supplied `opts` appended last. Third, hand the combined list to `testcontainers.Run` and wrap the result.

The "base options first, user options last" ordering is deliberate. It lets the user override anything the module sets by default: if you pass `testcontainers.WithEnv(map[string]string{"POSTGRES_USER": "alice"})`, your env entry runs after the module's default and wins.

The consistency of this shape across the 65 modules is the result of a deliberate migration. The older `RunContainer` form (covered later in this post) did not take an image as an argument, and the module bodies were less uniform. I migrated the first nineteen modules to the current `Run(ctx, img, opts...)` shape by hand to lock in the pattern, then used an AI coding agent to do the remaining forty-one. The before-and-after, and what I learned about pairing with the agent on a repetitive refactor at scale, is in [Refactoring 60 Go Modules with an AI Coding Agent](/posts/2025-10-10-coding-agents).

## Base options every module applies

The exact list varies, but most modules set at least three things:

- **Exposed ports.** Whatever the image listens on. Postgres exposes `5432/tcp`; MySQL exposes `3306/tcp` and `33060/tcp`; Redis exposes `6379/tcp`.
- **Required env vars.** The minimum the image needs to boot. Postgres sets `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` to its defaults. MySQL sets `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`. Redis sets nothing here; it does not need any.
- **A wait strategy.** MySQL waits for the log line `port: 3306  MySQL Community Server`. Postgres relies on the default port check via its exposed ports.

Some modules also install a lifecycle hook at base setup. Kafka is the clearest example: its base setup uses `testcontainers.WithLifecycleHooks` to register a `PostStarts` hook that copies a starter script into the container and then runs a log wait for the readiness line. The [lifecycle hooks post](/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks) walked that case in detail, including why Kafka's choice of `WithLifecycleHooks` (rather than `WithAdditional`) is fine at base setup but would not be safe later in the option pipeline.

## Module-specific options: the two dialects

There are two functional-options dialects in the modules.

**Request-mutating customizers.** Most module options are functions that return either `testcontainers.CustomizeRequestOption` or `testcontainers.ContainerCustomizer` and write straight into the `GenericContainerRequest`. Postgres example:

```go
func WithDatabase(dbName string) testcontainers.ContainerCustomizer {
    return testcontainers.WithEnv(map[string]string{"POSTGRES_DB": dbName})
}

func WithInitScripts(scripts ...string) testcontainers.CustomizeRequestOption {
    containerFiles := make([]testcontainers.ContainerFile, 0, len(scripts))
    for _, script := range scripts {
        containerFiles = append(containerFiles, testcontainers.ContainerFile{
            HostFilePath:      script,
            ContainerFilePath: "/docker-entrypoint-initdb.d/" + filepath.Base(script),
            FileMode:          0o755,
        })
    }
    return testcontainers.WithFiles(containerFiles...)
}
```

`WithDatabase` is a thin wrapper around the core `WithEnv`. `WithInitScripts` builds a slice of `ContainerFile` values and delegates to the core `WithFiles`. Both are functions that, at the moment `testcontainers.Run` walks the option list, mutate the request.

**Module-local options.** Some modules need state that does not belong in the Docker request: a SQL driver name to pick when opening connections, a TLS flag that the wrapper reads later, a snapshot name. Postgres handles this with a private `options` struct and an exported `Option` type defined in `options.go`:

```go
type options struct {
    SQLDriverName string
    Snapshot      string
}

func defaultOptions() options {
    return options{
        SQLDriverName: "postgres",
        Snapshot:      defaultSnapshotName,
    }
}

var _ testcontainers.ContainerCustomizer = (Option)(nil)

type Option func(*options)

// Customize is a NOOP. It's defined to satisfy the testcontainers.ContainerCustomizer interface.
func (o Option) Customize(*testcontainers.GenericContainerRequest) error {
    return nil
}

func WithSQLDriver(driver string) Option {
    return func(o *options) {
        o.SQLDriverName = driver
    }
}
```

`Option` satisfies `testcontainers.ContainerCustomizer` with a NOOP `Customize`. That lets the user pass it through the same variadic `opts ...testcontainers.ContainerCustomizer` slot as anything else; the testcontainers pipeline calls `Customize` on it, the call does nothing, the request is untouched. The interesting work happens earlier in the module's `Run`, where the loop at the top filters `opts` for values that match the module's `Option` type and applies them to the local `settings` struct.

Redis uses the same pattern. MySQL does not; it gets by with only request-mutating customizers because none of its state needs to live outside the request. A module can have one dialect, the other, or both. Postgres has both; the two coexist in the same file and the same `Run`.

## Conditional helpers and lifecycle composition

Some options are conditional: they only do something when the user has opted in (`WithReplicaSet`, `WithDataDir`, `WithSSLCert`). These options often need to register a lifecycle hook to run setup work after the container starts.

The MongoDB `WithReplicaSet` option was the textbook example in the [lifecycle hooks post](/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks): it returns a customizer that uses `testcontainers.WithAdditionalLifecycleHooks` to append a `PostStarts` hook that calls `rs.initiate(...)` against the live container. The positional rule from that post holds: a conditional helper runs later in the option pipeline, where the module's base setup has already populated `req.LifecycleHooks`. `WithAdditional` is the only safe form. `WithLifecycleHooks` would clobber the prior hooks.

If you are writing a module-specific option that needs post-start work, that is the pattern.

## Helper methods on the wrapper type

Two flavours of helper live on the wrapper.

**The address pair.** Every networked module ships a `ConnectionString(ctx, args...)` method that returns the connection URL with the dynamically-allocated host port resolved, plus a `MustConnectionString(ctx, args...)` that panics on error. This is the classic Go must-pair idiom. From Postgres:

```go
func (c *PostgresContainer) MustConnectionString(ctx context.Context, args ...string) string {
    addr, err := c.ConnectionString(ctx, args...)
    if err != nil {
        panic(err)
    }
    return addr
}

func (c *PostgresContainer) ConnectionString(ctx context.Context, args ...string) (string, error) {
    endpoint, err := c.PortEndpoint(ctx, "5432/tcp", "")
    if err != nil {
        return "", err
    }
    extraArgs := strings.Join(args, "&")
    return fmt.Sprintf("postgres://%s:%s@%s/%s?%s", c.user, c.password, endpoint, c.dbName, extraArgs), nil
}
```

`PortEndpoint` is a method the wrapper inherits from the embedded `testcontainers.Container`. The user, password, and database name come from the captured fields on the wrapper struct. Both methods are simple, and the symmetry across modules makes them easy to reach for.

**Operational helpers.** When a module has work to expose beyond "hand me the address", it also lives on the wrapper. Database modules typically add save-and-rollback helpers; queue modules might add producer or consumer conveniences; web-service modules might expose health-check shortcuts. The catalogue varies by module; the place these methods live does not. They are the methods that make a module worth importing for more than just the container handle.

## Per-call options: a parallel options surface

A module can layer a second functional-options pattern on top of the request customizers: options that configure a single method call on the container instead of the request itself. Postgres does this for some of its operational helpers, which accept their own option type distinct from `testcontainers.ContainerCustomizer`.

The two patterns share the "functional options" shape and nothing else. `ContainerCustomizer` mutates the container before it exists. The per-call option type mutates a method call after it does. They are not interchangeable. A future post in this series will dedicate itself to the Postgres module: the snapshot machinery, the SQL driver tracking, the per-call options, and how they compose.

## The deprecated RunContainer alias

When you read most modules, you will see two exported entry points next to each other:

```go
// Deprecated: use Run instead
// RunContainer creates an instance of the Postgres container type
func RunContainer(ctx context.Context, opts ...testcontainers.ContainerCustomizer) (*PostgresContainer, error) {
    return Run(ctx, "postgres:16-alpine", opts...)
}

// Run creates an instance of the Postgres container type
func Run(ctx context.Context, img string, opts ...testcontainers.ContainerCustomizer) (*PostgresContainer, error) {
    // ...
}
```

`RunContainer` is the legacy spelling, kept for backwards compatibility. It hard-codes a default image and delegates to `Run`. The doc comment marks it deprecated. New code uses `Run`, which takes the image as the second argument and matches the core `testcontainers.Run` signature. Most modules still carry the alias.

This is why posts #1, #2, and #3 have consistently said "use `Run`": the API has moved on, but the old name is still in the source. If you read the modules and wonder which to call, the deprecation marker is the answer.

## Where modules diverge from the shape

The standard skeleton is a strong default, not enforced. The places I noticed it bending:

**File layout.** MySQL keeps all of its options inline in `mysql.go` rather than splitting into a separate `options.go`. The dialect is the same as Postgres's request-mutating one; the file is just not split. Smaller modules tend to follow this.

**Sub-packages.** Mongo grows two: `modules/mongodb/atlaslocal/` (its own module with its own `Run` for the MongoDB Atlas Local image) and `modules/mongodb/mount/` (carries a shell entrypoint script used by the parent module). The first is a sibling module that lives under the Mongo umbrella; the second is a resource directory presented as a sub-package because Go's `//go:embed` works on package-relative paths.

**Extra files.** Mongo also has a `cli.go` that wraps the Mongo CLI for use by the module's lifecycle hooks. Postgres has the `resources/` folder with an embedded entrypoint. Modules expand the layout when the surface area justifies it.

None of these break the canonical pattern. They extend it for specific reasons that hold up on inspection.

## Choosing a shape when authoring a module

A short opinionated guide if you are writing a new module:

- Start from the canonical layout: `<name>.go` for the public surface (`Run` + wrapper + helpers), `options.go` for options, plus tests, examples, and your own `go.mod`.
- Use request-mutating customizers (functions returning `testcontainers.CustomizeRequestOption` or `testcontainers.ContainerCustomizer`) for anything that goes into the request: env vars, ports, files, lifecycle hooks. This is the dominant dialect.
- Reach for the module-local `options` struct + `Option` type only when you need typed state that the wrapper will read later (a driver name, a flag) and that does not belong in the Docker request.
- Embed `testcontainers.Container` in your wrapper. Callers get the core API for free, and you get one place to add module-specific methods.
- Put the address-resolution helpers (`ConnectionString` and its `Must*` cousin) on the wrapper. Put any operational helpers there too.
- Use `WithAdditionalLifecycleHooks` whenever a conditional option needs post-start setup. Avoid `WithLifecycleHooks` outside of base setup; the positional rule from the [lifecycle hooks post](/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks) explains why.

If you want a walk-through end-to-end from "idea" to "shipped module", the [Subscriptions module post](/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module) covers the authoring lens that this post deliberately does not.

## Closing

Sixty-five modules, one shape with documented variants. A standard skeleton, a wrapper type that embeds the core container, two options dialects that coexist inside the same file, helper methods that justify the import, and a separate `go.mod` per module for dependency hygiene. Each module is a thin layer that composes everything the rest of the series has covered: the functional options from post #1, the wait strategies from post #2, the lifecycle hooks from post #3. The pattern is consistent enough that "another module" rarely means "more code to learn", and divergent enough that reading a new one still teaches you something.

The next post follows the thread one more layer outward, into container reuse and session IDs. Every container the library creates is stamped with a small set of labels. The engine uses those labels to find existing containers before it creates new ones, to scope cleanup to the right test run, and to make a session "yours". That is the next piece to pull apart.

---

*Resources:*
- *[testcontainers-go on GitHub](https://github.com/testcontainers/testcontainers-go)*
- *[`modules/` directory](https://github.com/testcontainers/testcontainers-go/tree/main/modules)*
- *[Postgres module source](https://github.com/testcontainers/testcontainers-go/tree/main/modules/postgres)*
- *[Testcontainers modules docs](https://golang.testcontainers.org/modules/)*
