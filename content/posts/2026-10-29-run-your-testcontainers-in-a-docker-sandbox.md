---
title: "Run Your Testcontainers in a Docker Sandbox"
date: 2026-10-29 08:00:00 +0100
description: "testcontainers-go has a new runtime provider: import one module, select it with an environment variable or a properties file, and every container your tests start runs on a Docker Sandbox's own Engine instead of your host's. Your test functions stay as they are. Here is how to turn it on, what changes underneath, and what fails on purpose."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "testcontainers-go", "docker-sandboxes", "sbx", "golang", "integration-testing"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-10-29-run-your-testcontainers-in-a-docker-sandbox/cover.png"
related:
  - "/posts/2026-09-09-understanding-testcontainers-the-ryuk-reaper"
  - "/posts/2026-09-29-isolate-the-agent-keep-your-tools"
  - "/posts/2026-09-23-yolo-mode-can-be-safe"
  - "/posts/2026-09-25-kits-make-authority-portable"
---

![Run Your Testcontainers in a Docker Sandbox](/images/posts/2026-10-29-run-your-testcontainers-in-a-docker-sandbox/cover.png)

The [last Docker Sandboxes post](/posts/2026-09-29-isolate-the-agent-keep-your-tools) named the sandbox's own Docker Engine as what comes next. This post is about that Engine from the testcontainers-go side: your tests stay where they are, and the containers they start run inside the sandbox.

testcontainers-go now has a runtime provider for Docker Sandboxes. It is merged on `main` in [testcontainers/testcontainers-go#3987](https://github.com/testcontainers/testcontainers-go/pull/3987) and ships with the next testcontainers-go release. I work on Docker Sandboxes and I wrote the provider, so read this as the builder's view.

If you already use testcontainers-go, this gives you a way to run the containers your tests start inside a Docker Sandbox: one import per test package and a provider setting, while the test functions stay as they are. If you already use Docker Sandboxes, this gives you real integration tests (databases, brokers, Compose stacks) on the sandbox's own Engine, through a library that knows how to start and clean them up.

## Why Move Your Test Dependencies into a Sandbox

Integration tests start things. A Postgres here, a Kafka there, a Compose stack with five services, plus Ryuk to clean up after them. By default, all of that runs on whatever Docker Engine your host points at.

With the provider selected, it runs on a sandbox instead. The first operation that needs a Docker client starts one sandbox for the test process, before Docker client discovery and before Ryuk. Every container in that process, Ryuk included, and every native Compose stack runs on that sandbox's Docker Engine.

## Turn It On

Three steps: log in, import, select. A fourth, cleanup, is strongly recommended.

**Log in first.** Install the `sbx` CLI on a host that can run sandboxes with local IPv4 TCP and UDP port publishing. The PR states the provider needs sbx v0.48.0 or newer. Then authenticate before running tests:

```console
$ sbx login
$ sbx version
```

The provider uses your existing authentication. It never logs in for you.

**Import the module.** The provider lives in its own optional Go module, `github.com/testcontainers/testcontainers-go/modules/sbx`. Importing it registers a runtime provider named `sbx`:

```go
import _ "github.com/testcontainers/testcontainers-go/modules/sbx"
```

Adding the dependency alone does not register it, and registering does not start a sandbox or select the provider. Keep in mind that `go test ./...` builds one test binary per package, so every package that should use sbx needs the import, directly or through a shared test helper.

**Select the provider.**

```shell
TESTCONTAINERS_PROVIDER=sbx go test ./...
```

You can also set `provider=sbx` in `~/.testcontainers.properties`. The environment variable wins over the properties file. Selection is per process, happens before any Testcontainers operation, and cannot change after initialization.

**Clean up in `TestMain`.** This is the example from the module docs, as is:

```go
package mypackage_test

import (
    "context"
    "fmt"
    "os"
    "testing"
    "time"

    sbx "github.com/testcontainers/testcontainers-go/modules/sbx"
)

func TestMain(m *testing.M) {
    code := m.Run()

    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
    if err := sbx.Cleanup(ctx); err != nil {
        fmt.Fprintf(os.Stderr, "sbx cleanup: %v\n", err)
        if code == 0 {
            code = 1
        }
    }
    cancel()
    os.Exit(code)
}
```

The named import for `Cleanup` also registers the provider, so you don't need the blank import in the same test binary.

`sbx.Cleanup` removes the sandbox this process owns. It is safe to call when the sandbox never started. If removal fails it returns an error, and you should report it so the run does not look green when it left something behind.

Ryuk still cleans up the containers inside the sandbox. Removing the sandbox itself is what `Cleanup` is for. And if the process is killed before `TestMain` reaches cleanup, a sandbox can be left behind.

## Your Test Functions Don't Change

Here is an ordinary test with the current API:

```go
func TestNginx(t *testing.T) {
    ctx := context.Background()

    ctr, err := testcontainers.Run(ctx, "nginx:alpine",
        testcontainers.WithExposedPorts("80/tcp"),
    )
    testcontainers.CleanupContainer(t, ctr)
    require.NoError(t, err)

    host, err := ctr.Host(ctx)
    require.NoError(t, err)

    port, err := ctr.MappedPort(ctx, "80/tcp")
    require.NoError(t, err)

    t.Logf("nginx at %s:%s", host, port)
}
```

Nothing in it is sbx-specific. The changes live around it: the import in the test package, the provider selection in an environment variable or in `~/.testcontainers.properties`, and the recommended `TestMain` cleanup.

The evidence that this holds beyond a toy example is the repository's own CI. It runs the complete root-module `./...` suite of testcontainers-go against sbx, with retries disabled. The only sbx-specific skips are host-network options, host networking and `container:<id>` networking. Everything else in core runs on the sandbox Engine.

## What Changes Underneath

A few things behave differently underneath, and they are worth knowing before the first failure.

### How the sandbox starts

The module runs `sbx create` with the published `sbx/docker-tcp:latest` kit and base image `docker.io/docker/sbx-kit-shell:1.0.0`, publishing the sandbox's Docker API on a host loopback port. Then it runs `sbx run --detach --name <name>`, so the sandbox keeps running until cleanup instead of auto-stopping when the CLI session ends. The repository has a regression test that idles for 35 seconds to get past sbx's 30-second auto-stop grace period. Sandboxes are named `tc-go-<uuid>`.

### Ports

`Host()` returns `127.0.0.1`, and `MappedPort()` returns the local endpoint. The provider picks the host port first and uses the same number inside the sandbox, so host and guest ports match.

If you request a fixed host port, it stays the same while the container runs. Stopping the container releases it. Restarting tries to reclaim it, and returns an error if another process took it in the meantime. A fixed port that is already in use fails when the container is created.

Ports are local IPv4 TCP and UDP only. A port requested on `0.0.0.0` is exposed on loopback only.

### Bind mounts

The workspace is allowed automatically. By default that is the current directory, and `TESTCONTAINERS_SBX_WORKSPACE` changes it. Anything outside it, including temporary directories and Compose service bind sources, needs an allowed root, set before the provider initializes with `sbx.WithBindRoots(...)` or `TESTCONTAINERS_SBX_BIND_ROOTS`:

```shell
export TESTCONTAINERS_SBX_BIND_ROOTS="/opt/test-fixtures:/srv/shared-fixtures"
TESTCONTAINERS_PROVIDER=sbx go test ./...
```

Only the requested source is mounted into the sandbox, and a read-only bind stays read-only. Some sources are rejected: paths with `..` components, absolute symlinks, links that escape their root, host sockets other than the Docker socket, and Windows drive-letter paths.

Two special cases. A bind of `/var/run/docker.sock` maps to the sandbox's own Docker socket. Named volumes live in the sandbox's Docker daemon.

### Compose

Use the native `NewDockerCompose` or `NewDockerComposeWith`. Their Docker client uses the sbx endpoint. The legacy shell-based `NewLocalDockerCompose` rejects sbx with a clear message:

```text
local Docker Compose does not support the sbx runtime; use NewDockerCompose or NewDockerComposeWith
```

### Configuration

You can configure the sandbox in two ways: with environment variables, or with Go options passed to `sbx.Configure` in `TestMain`, before `m.Run()`. The Go options came in a follow-up, [testcontainers/testcontainers-go#4057](https://github.com/testcontainers/testcontainers-go/pull/4057). An explicit option overrides its environment variable. `Configure` does not start a sandbox or select the provider, and once initialization begins, further calls return `sbx.ErrProviderStarted`.

| Go option | Environment variable | Purpose | Default |
| --- | --- | --- | --- |
| `WithBinary` | `TESTCONTAINERS_SBX_BINARY` | Path or name of the `sbx` executable | `sbx` on `PATH` |
| `WithWorkspace` | `TESTCONTAINERS_SBX_WORKSPACE` | Workspace passed to the sandbox; paths inside it are visible to the sandbox | Current working directory |
| `WithBindRoots` | `TESTCONTAINERS_SBX_BIND_ROOTS` | Additional allowed host bind directories | No additional roots; workspace allowed automatically |
| `WithStartupTimeout` | `TESTCONTAINERS_SBX_TIMEOUT` | Sandbox initialization limit, including kit installation | `5m` |
| `WithAppName` | `TESTCONTAINERS_SBX_APP_NAME` | `sbx --app-name` value for every CLI call | CLI default |

### Extra kits

Two options have no environment variable: `WithKits` adds kits to the sandbox when it is created, and `WithKitArgs` passes arguments to them. The required `sbx/docker-tcp:latest` kit is always included. This is the example from the module docs, which uses a local example kit saved in `testdata/test-tools`:

```go
if err := sbx.Configure(
    sbx.WithStartupTimeout(8*time.Minute),
    sbx.WithKits("./testdata/test-tools"),
    sbx.WithKitArgs(map[string]string{
        "test-tools.mode": "integration",
    }),
); err != nil {
    log.Fatal(err)
}
```

Kits customize the sandbox, not the containers: the tools a kit installs do not appear inside the containers your tests start. Kits are chosen when the sandbox is created and cannot be added afterwards, so a different combination of kits needs a separate test process.

## What Fails on Purpose

The provider manages port forwarding between your host and the sandbox. A few Docker features bypass that forwarding, and the provider rejects them up front instead of letting them half-work.

**Network modes `host` and `container:<id>`.**

```text
sbx does not support Docker network mode "<mode>" because it bypasses managed published ports
```

**Automatic restart policies.** Anything other than none (`no`) fails:

```text
sbx does not support Docker restart policy "<name>" because automatic restarts bypass managed published ports
```

Use explicit container start and restart instead.

**IPv6 and non-loopback host bindings.** An IPv6 host binding is reported as unsupported, and any other address that is not local loopback is rejected.

### One thing to know about trust

The `docker-tcp` kit exposes the sandbox's Docker API without authentication on a host loopback port. Other local users and processes on the same machine can reach it directly. Run it only where all local users and processes are trusted.

## Same Tests, Different Box

One import, one setting, one cleanup call. The containers your tests start now run on the sandbox's own Engine, one sandbox per test process. Import the module, set `TESTCONTAINERS_PROVIDER=sbx`, and see what your suite does.

---

_Resources:_
- _[testcontainers/testcontainers-go#3987: feat: add Docker Sandboxes runtime provider](https://github.com/testcontainers/testcontainers-go/pull/3987)_
- _[testcontainers/testcontainers-go#4057: feat(sbx): configure sandbox startup with Go options](https://github.com/testcontainers/testcontainers-go/pull/4057)_
- _[Docker Sandboxes documentation](https://docs.docker.com/ai/sandboxes/)_
- _[Testcontainers for Go documentation](https://golang.testcontainers.org/)_
