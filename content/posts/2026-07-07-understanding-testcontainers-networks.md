---
title: "Understanding Testcontainers: Networks"
date: 2026-07-07 09:00:00 +0200
description: "How testcontainers-go models container networks: the default bridge, the network/ package, the four request-side helpers for attaching containers, aliases that only work on user-defined networks, and the multi-network workaround the library hides behind a single field."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "networks", "docker"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-07-07-understanding-testcontainers-networks/cover.png"
related:
  - "/posts/2026-06-25-understanding-testcontainers-the-module-layer"
  - "/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks"
  - "/posts/2026-06-15-understanding-testcontainers-wait-strategies"
  - "/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options"
---

![Understanding Testcontainers: Networks](/images/posts/2026-07-07-understanding-testcontainers-networks/cover.png)

I am a core maintainer of [testcontainers-go](https://github.com/testcontainers/testcontainers-go). This is the fifth post in a series on the library's internals: how the API is shaped, how containers wait until they are ready, how the module system layers on top of the core, how cleanup works. Each part stands on its own. Each part is written by reading the source directly, so every claim in the post traces back to a file and a line.

Today the topic is networks. The `network/` package is the smallest in the library's public surface, a single file you can read in one sitting, but the API it exposes hides a few decisions worth pulling apart. Containers in different tests need to talk to each other. Sometimes they need to find each other by a stable name instead of an IP. Sometimes a single container needs to live in more than one network at once. Docker has primitives for all of this, but the primitives have constraints, and the `network/` package is mostly the shape those constraints take in Go. The thesis of this post: every option in the package is either a shortcut for a common test pattern, or the way the library hides a Docker API constraint.

## The default network: bridge

If a test calls `Run(ctx, "redis:alpine")` and asks for no networks, the container still ends up reachable. It is attached to the daemon's default bridge, and from there it gets an IP and a route to the host. The library does not have to do anything special for this case, the daemon handles it.

The two constants that name the possible defaults live in `docker.go`:

```go
Bridge        = "bridge" // Bridge network name (as well as driver)
ReaperDefault = "reaper_default" // Default network name when bridge is not available
```

The `ensureDefaultNetwork` function in `docker.go` is where the choice is made at runtime. It lists existing networks on the daemon, and if it finds one called `bridge` it uses that. If it does not, it falls back to a network called `reaper_default` that the library creates itself with `GenericLabels()` so Ryuk can later remove it.

The piece that ties this back to container creation is in `docker.go`, right before the container gets created:

```go
if defaultNetwork != p.defaultBridgeNetworkName {
    isAttached := slices.Contains(req.Networks, defaultNetwork)
    if !isAttached {
        req.Networks = append(req.Networks, defaultNetwork)
    }
}
```

The logic says: when the resolved default network is not the daemon's native bridge, the library has to append it to the request manually, because the daemon will not auto-attach. That is the `reaper_default` path. The vanilla Docker case (`defaultBridgeNetworkName == "bridge"`) does not go through this branch.

This is the first place where the library is hiding something. From a test's point of view, you just get a container that can talk to the network. From the library's point of view, the resolved default may be the native bridge or a fallback that has to be attached by hand, and the code has to know which one applies before the container is created.

## `network.New`: creating a custom network

When a test needs more than the default, it asks for one. The modern entry point lives in `network/network.go`:

```go
func New(ctx context.Context, opts ...NetworkCustomizer) (*testcontainers.DockerNetwork, error) {
    nc := client.NetworkCreateOptions{
        Driver: "bridge",
        Labels: testcontainers.GenericLabels(),
    }
    // apply opts...
    netReq := testcontainers.NetworkRequest{
        Driver:     nc.Driver,
        Internal:   nc.Internal,
        EnableIPv6: nc.EnableIPv6,
        Name:       uuid.NewString(),
        Labels:     nc.Labels,
        Attachable: nc.Attachable,
        IPAM:       nc.IPAM,
    }
    n, err := testcontainers.GenericNetwork(ctx, testcontainers.GenericNetworkRequest{
        NetworkRequest: netReq,
    })
    if err != nil {
        return nil, err
    }
    return n.(*testcontainers.DockerNetwork), nil
}
```

Three defaults stand out:

- **Driver: bridge.** The most common case, and the only one where Docker's embedded DNS works (we will come back to this in the aliases section).
- **Labels: `GenericLabels()`.** This is the same labelling that container creation uses. The labels include the session ID for the running test process, so Ryuk can match the network to that session and delete it when the session ends.
- **Name: a random UUID.** No collisions across parallel tests on the same daemon. The trade-off is that the network's name is opaque, so if you need to attach a sibling container to it later you have to keep the `*DockerNetwork` handle around.

The return type is a pointer to a concrete struct, not the `Network` interface. The "accept interface, return struct" Go idiom shows up here just like it did with `Run` returning `*DockerContainer` in [Part 1](/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options).

## The customizer interface

The options for `network.New` follow the same functional-options dialect introduced in Part 1, this time wrapping a different request type. From `network/network.go`:

```go
type NetworkCustomizer interface {
    Customize(req *client.NetworkCreateOptions) error
}

type CustomizeNetworkOption func(req *client.NetworkCreateOptions) error

func (opt CustomizeNetworkOption) Customize(req *client.NetworkCreateOptions) error {
    return opt(req)
}
```

The shipped customizers cover the seven knobs the Docker network API exposes:

- `WithAttachable()`: mark the network so standalone containers (not just services) can attach to it.
- `WithCheckDuplicate()`: no-op kept for backwards compatibility. The docstring is honest about it: `CheckDuplicate` was deprecated in the Docker API v1.44, and the client defaults the field to `true` against older daemons anyway.
- `WithDriver(driver string)`: override the default `"bridge"`. Useful for `overlay`, `macvlan`, or third-party drivers.
- `WithEnableIPv6()`: turn on IPv6 on the network. The docstring warns that the daemon also needs IPv6 enabled.
- `WithInternal()`: mark the network as internal, no external connectivity.
- `WithLabels(labels map[string]string)`: add user-defined labels alongside the generic Testcontainers labels.
- `WithIPAM(ipam *network.IPAM)`: replace the IPAM (IP Address Management) configuration. The escape hatch for fixed subnets or custom gateways.

None of these are particularly surprising. The reason the surface is small is that creating a network is a small operation. Most of the interesting code lives on the other side: when a container says "attach me to this network".

## Attaching a container: four request-side helpers

A network exists. Now a container needs to join it. The `network/` package ships four `CustomizeRequestOption` helpers for this, each for a different scenario:

| Helper | When to use it |
|---|---|
| `WithNetwork(aliases, nw)` | You created the network in the test with `network.New` and you have the `*DockerNetwork` handle. |
| `WithNetworkName(aliases, name)` | The network already exists. You only have its name (created by docker-compose, by a previous run, by another tool). |
| `WithBridgeNetwork()` | You want the container on the default bridge explicitly. No aliases. |
| `WithNewNetwork(ctx, aliases, opts...)` | You want a fresh network and a container on it in one call. The library creates the network for you. |

`WithNetwork` is the thinnest of the four: it just delegates to `WithNetworkName` using `nw.Name`. The actual work happens in `WithNetworkName`:

```go
func WithNetworkName(aliases []string, networkName string) testcontainers.CustomizeRequestOption {
    return func(req *testcontainers.GenericContainerRequest) error {
        if networkName == "bridge" {
            return errors.New("network-scoped aliases are supported only for containers in user defined networks")
        }
        req.Networks = append(req.Networks, networkName)
        if req.NetworkAliases == nil {
            req.NetworkAliases = make(map[string][]string)
        }
        req.NetworkAliases[networkName] = aliases
        return nil
    }
}
```

Two fields get touched: `req.Networks` (the list of networks to attach to) and `req.NetworkAliases` (a map from network name to list of aliases). That separation matters later when the library has to decide which network the container is created on and which networks it has to connect to after the fact.

`WithBridgeNetwork()` is the exception that proves the rule. It appends `"bridge"` to `req.Networks` and does nothing else. No aliases are passed because, as we are about to see, bridge does not accept them.

`WithNewNetwork(ctx, aliases, opts...)` is the "I just want a fresh network" shortcut. It calls `network.New` internally, then applies the same logic as `WithNetworkName` on the result.

## Aliases only work on user-defined networks

The three lines that explain the whole design constraint:

```go
if networkName == "bridge" {
    return errors.New("network-scoped aliases are supported only for containers in user defined networks")
}
```

This is not the library being opinionated. This is Docker. The default `bridge` network does not run embedded DNS, so a container's hostname-based lookup for another container on bridge will not resolve. User-defined bridge networks do run an embedded DNS resolver, which is what makes a Postgres container reachable from a Redis container at the hostname `postgres` instead of at `172.17.0.4`.

`WithBridgeNetwork()` exists precisely because the alias path is closed on bridge. It is the only attach helper that does not accept aliases, by design. If your test does not need name-based discovery, joining bridge is the lowest-overhead choice. If it does, the user-defined network is mandatory.

This explains why every multi-container example in the Testcontainers documentation creates a fresh network instead of using bridge. Service discovery between containers in the same test is the most common case, and the only network that supports it is a user-defined one.

## The multi-network workaround (issue #248)

Now the request has been customized: the container is attached to network A with alias `postgres`, and also to network B with alias `db`. What does the library do with that?

Docker's container-create API only accepts one network at create time. You can list more in the `NetworkingConfig.EndpointsConfig` map, but in practice the Docker engine ignores everything except the first entry. The workaround is documented in two places in the code.

The first network is wired inside the default pre-create hook in `lifecycle.go`:

```go
attachContainerTo := req.Networks[0]

nw, err := p.GetNetwork(ctx, NetworkRequest{Name: attachContainerTo})
if err == nil {
    aliases := []string{}
    if _, ok := req.NetworkAliases[attachContainerTo]; ok {
        aliases = req.NetworkAliases[attachContainerTo]
    }
    endpointSetting := network.EndpointSettings{
        Aliases:   aliases,
        NetworkID: nw.ID,
    }
    endpointSettings[attachContainerTo] = &endpointSetting
}
```

The remaining networks are attached after the container is created, back in `docker.go`:

```go
// #248: If there is more than one network specified in the request attach newly created container to them one by one
if len(req.Networks) > 1 {
    for _, n := range req.Networks[1:] {
        nw, err := p.GetNetwork(ctx, NetworkRequest{Name: n})
        if err == nil {
            endpointSetting := network.EndpointSettings{
                Aliases: req.NetworkAliases[n],
            }
            _, err = p.client.NetworkConnect(ctx, nw.ID, client.NetworkConnectOptions{
                Container:      resp.ID,
                EndpointConfig: &endpointSetting,
            })
            if err != nil {
                return nil, fmt.Errorf("network connect: %w", err)
            }
        }
    }
}
```

That `#248` in the comment is the GitHub issue this fix originally addressed. From a user's perspective the multi-network case looks like a single field: pass several `WithNetwork` options and the container joins all of them. From the library's perspective there are two distinct code paths: the first network goes through container-create, the rest go through container-create-plus-network-connect. The split is invisible until something fails on one of the later networks, and then the error message names `NetworkConnect`, not the original `Run` call.

## How Ryuk owns the network

In [Part 3](/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks) we saw how lifecycle hooks compose around container creation. Networks have an equivalent story for cleanup. The chain starts at `network.New` and ends at the deprecated `DockerProvider.CreateNetwork` in `docker.go`. The Ryuk wiring inside it looks like this:

```go
if !p.config.RyukDisabled {
    r, err := spawner.reaper(context.WithValue(ctx, core.DockerHostContextKey, p.host), sessionID, p)
    if err != nil {
        return nil, fmt.Errorf("reaper: %w", err)
    }

    termSignal, err = r.Connect()
    if err != nil {
        return nil, fmt.Errorf("reaper connect: %w", err)
    }
    // ...
}
```

`CreateNetwork` spawns or reuses the Ryuk container, opens a termination channel, then immediately after calls `core.AddDefaultLabels(sessionID, req.Labels)` to stamp the network with the session ID Ryuk filters on.

When the test process exits (cleanly or otherwise), Ryuk reads its label filter and deletes every container, network, and volume that matches. The network is one of those resources. The user did not have to register a `defer` to clean it up, and they did not have to call `Remove` from a `t.Cleanup` block. The label is the contract.

If `RyukDisabled` is set, none of this runs. Networks created in that mode will outlive the test process and have to be removed manually. This is the same trade-off Ryuk imposes on containers, applied to networks.

## `network.New` wraps a deprecated API

The honest bit. The modern entry point looks clean from the outside, but the implementation still threads through code that the library has marked for removal. The docstring on `New` says so directly:

```go
// New creates a new network with a random UUID name, calling the already existing GenericNetwork APIs.
// Those existing APIs are deprecated and will be removed in the future, so this function will
// implement the new network APIs when they will be available.
// By default, the network is created with the following options:
// - Driver: bridge
// - Labels: the Testcontainers for Go generic labels, to be managed by Ryuk. Please see the GenericLabels() function
// And those options can be modified by the user, using the CreateModifier function field.
```

`GenericNetwork` in `generic.go` carries its own deprecation notice:

```go
// Deprecated: use network.New instead
// GenericNetwork creates a generic network with parameters
func GenericNetwork(ctx context.Context, req GenericNetworkRequest) (Network, error) {
    provider, err := req.ProviderType.GetProvider()
    if err != nil {
        return nil, err
    }
    network, err := provider.CreateNetwork(ctx, req.NetworkRequest)
    if err != nil {
        return nil, fmt.Errorf("%w: failed to create network", err)
    }
    return network, nil
}
```

And `DockerProvider.CreateNetwork` in `docker.go`:

```go
// Deprecated: use network.New instead
// CreateNetwork returns the object representing a new network identified by its name
```

So we have `network.New` (modern) calling `GenericNetwork` (deprecated) calling `CreateNetwork` (deprecated). The two `//nolint:staticcheck` comments inside `network.New` are the visible markers that the maintainers know this is awkward. The plan stated in the docstring is to "implement the new network APIs when they will be available", which is work we still have on our plate. Until that work lands, `network.New` is the right thing for users to call, even though its body uses the old machinery.

This is a recurring shape in the library: a clean modern surface, a quieter older substrate that still does the work, and a documented intention to converge. We saw the same pattern in [Part 1](/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options) with `GenericContainer` and `Run`.

## Closing

The `network/` package is small because Docker did most of the work. What the library adds is the defaults (bridge driver, UUID name, generic labels), the Ryuk wiring (so cleanup happens without a `defer`), the request-side helpers (so attaching to an existing network is a one-liner), and the multi-network workaround (so the one-network-at-create constraint disappears from the user-facing API).

Two constraints you should now be able to spot in any test that uses networks: aliases only work on user-defined networks, and the first network in a multi-network attach is special. If you ever see a container that joined two networks and got aliases on one but not the other, the post-create `NetworkConnect` loop in `docker.go` is where to look.

The series has been reading the core library from the inside up to this point. The next post flips the direction: pick one module off the shelf and use it to write a test that would be painful to write without Testcontainers.

---

## Resources

- *[network/network.go](https://github.com/testcontainers/testcontainers-go/blob/main/network/network.go)*
- *[docker.go](https://github.com/testcontainers/testcontainers-go/blob/main/docker.go)* (CreateNetwork, ensureDefaultNetwork, multi-network attach)
- *[generic.go](https://github.com/testcontainers/testcontainers-go/blob/main/generic.go)* (GenericLabels, GenericNetwork)
- *[GitHub issue #248](https://github.com/testcontainers/testcontainers-go/issues/248)* (multi-network handling)
- *[Docker docs: Use bridge networks](https://docs.docker.com/engine/network/drivers/bridge/)*
