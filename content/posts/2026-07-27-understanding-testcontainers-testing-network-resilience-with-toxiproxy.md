---
title: "Understanding Testcontainers: Testing Network Resilience with Toxiproxy"
date: 2026-07-27 09:00:00 +0200
description: "Using the Toxiproxy module in testcontainers-go to write resilience tests that prove your app handles latency, connection cuts, and dependency outages without mocking a single thing."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "toxiproxy", "resilience", "chaos-engineering"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-07-27-understanding-testcontainers-testing-network-resilience-with-toxiproxy/cover.jpg"
related:
  - "/posts/2026-07-15-understanding-testcontainers-testing-lambdas-with-localstack"
  - "/posts/2026-07-07-understanding-testcontainers-networks"
  - "/posts/2026-06-25-understanding-testcontainers-the-module-layer"
  - "/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks"
---

![Understanding Testcontainers: Testing Network Resilience with Toxiproxy](/images/posts/2026-07-27-understanding-testcontainers-testing-network-resilience-with-toxiproxy/cover.jpg)

I am a core maintainer of [testcontainers-go](https://github.com/testcontainers/testcontainers-go). This is the seventh post in a series on the library. The previous six covered the core from the inside: the API shape, wait strategies, lifecycle hooks, the module system, networks, and then an applied module post that used LocalStack to test a Lambda. This one goes somewhere different. Instead of testing that a feature works, we test that the application holds together when a backing service fails.

The problem with happy-path tests is that they are designed not to fail. You write a test that calls your Redis-backed endpoint, Redis answers in under a millisecond, and the test passes. Every single time. Your test suite is green, your CI is green, and your application is quietly untested for the conditions that actually cause production incidents: a Redis node responding slowly, a network partition dropping connections, a dependency restarting mid-request.

[Toxiproxy](https://github.com/Shopify/toxiproxy) changes that.

## What Toxiproxy is

Toxiproxy was built at Shopify to solve a specific problem: they needed to prove, with tests, that their applications did not have single points of failure. Existing chaos tools either required root access, were not cross-platform, or lacked the dynamic API needed for integration testing, where you inject a failure, run an assertion, and then remove it, all programmatically from within a test.

The model is simple: each proxy has a name, a listen address, and an upstream address. Traffic to the listen address is forwarded to the upstream. Between them you add "toxics", named objects that modify the traffic stream. The proxy and its toxics are managed through an HTTP API. Toxiproxy ships toxics for latency, bandwidth throttling, slow close, connection resets, data slicing, timeouts, and complete outages.

The testcontainers-go module wraps that into the same `Run` / options pattern the rest of the library uses. The container image is `ghcr.io/shopify/toxiproxy`.

## The thing we are testing

The test scenario is a Redis-backed application. It stores and retrieves a value from Redis. The test will prove two things in sequence:

1. With Toxiproxy disabling the connection, a `Get` returns an error and not a hang.
2. After re-enabling the connection, the same `Get` succeeds and returns the stored value.

That is the contract. Not "Redis works" (that is Redis's job) but "my code handles Redis's absence gracefully."

## Step 1: The shared network

Redis and Toxiproxy need to be on the same Docker network with known aliases. Toxiproxy proxies traffic to Redis by container name, which it resolves inside the Docker network. Without the shared network, Toxiproxy cannot reach Redis at all. This is the same pattern covered in [Part 5 on networks](/posts/2026-07-07-understanding-testcontainers-networks).

```go
nw, err := network.New(ctx)
require.NoError(t, err)
t.Cleanup(func() {
    require.NoError(t, nw.Remove(ctx))
})
```

Redis gets the alias `"redis"`, which is the hostname Toxiproxy will use to reach it:

```go
redisContainer, err := tcredis.Run(
    ctx,
    "redis:6-alpine",
    network.WithNetwork([]string{"redis"}, nw),
)
testcontainers.CleanupContainer(t, redisContainer)
require.NoError(t, err)
```

## Step 2: Start Toxiproxy with a declared proxy

The module has two wiring patterns. The first is declarative: you pass `WithProxy` when creating the container, and the module configures the proxy before startup. It serializes the proxy definition to a JSON config file and passes it to the container via the `-config` flag:

```go
toxiproxyContainer, err := tctoxiproxy.Run(
    ctx,
    "ghcr.io/shopify/toxiproxy:2.12.0",
    tctoxiproxy.WithProxy("redis", "redis:6379"),
    network.WithNetwork([]string{"toxiproxy"}, nw),
)
testcontainers.CleanupContainer(t, toxiproxyContainer)
require.NoError(t, err)
```

`WithProxy("redis", "redis:6379")` declares a proxy named `"redis"` whose upstream is `redis:6379`, the alias and port of the Redis container on the shared network. The module allocates a listen port starting at `8666`, exposes it, and stores the mapping internally.

The second pattern is programmatic: start the container without `WithProxy`, obtain a Toxiproxy client via `toxiproxyContainer.URI(ctx)`, and call `toxiproxyClient.CreateProxy(...)` in the test body. Use that pattern when you need to create or modify proxies dynamically, for example when the upstream address is not known until the test starts. For this example the upstream is fixed, so the declarative approach is the right fit.

## Step 3: Get the proxied endpoint

With a declared proxy, the module knows which host-side port maps to the listen port inside the container. `ProxiedEndpoint` does that lookup:

```go
proxiedRedisHost, proxiedRedisPort, err := toxiproxyContainer.ProxiedEndpoint(8666)
require.NoError(t, err)
```

The argument is the internal listen port (`8666` for the first proxy declared, `8667` for the second, and so on). The return values are the host and port the test can actually connect to. That endpoint is Toxiproxy, not Redis. Toxiproxy forwards to Redis, and you can interfere with that forwarding.

Build the Redis client from the proxied endpoint:

```go
redisURI := fmt.Sprintf("redis://%s:%s?read_timeout=2s", proxiedRedisHost, proxiedRedisPort)

options, err := redis.ParseURL(redisURI)
require.NoError(t, err)

redisCli := redis.NewClient(options)
defer redisCli.FlushAll(ctx)
```

The `read_timeout=2s` matters. When the connection is cut, you want the client to surface an error after two seconds, not hang until the OS-level TCP timeout fires minutes later.

## Step 4: Write through the proxy

With the client connected to Toxiproxy, a normal write is transparent:

```go
err = redisCli.Set(ctx, "favorite:food", "Cabbage Biscuits", 2*time.Hour).Err()
require.NoError(t, err)
```

No toxics are active yet. The proxy forwards everything to Redis unchanged. The value lands in Redis just as if the client connected directly.

## Step 5: Cut the connection and prove the failure

Get a handle on the proxy via the Toxiproxy control API. Even though the proxy was declared with `WithProxy`, you still need the client to manipulate it at runtime:

```go
toxiURI, err := toxiproxyContainer.URI(ctx)
require.NoError(t, err)

toxiproxyClient := toxiproxy.NewClient(toxiURI)
proxies, err := toxiproxyClient.Proxies()
require.NoError(t, err)

proxy := proxies["redis"]
```

`URI` returns the control API endpoint (port `8474`). Disable the proxy:

```go
err = proxy.Disable()
require.NoError(t, err)
```

Now read:

```go
savedValue, err := redisCli.Get(ctx, "favorite:food").Result()
require.Error(t, err)
require.Empty(t, savedValue)
```

This is the key assertion. The test does not hope the error path works. It proves it: with the proxy disabled, `Get` returns an error. If the client was hanging instead of timing out, or returning stale data while pretending Redis was fine, this assertion would fail.

Re-enable and verify recovery:

```go
err = proxy.Enable()
require.NoError(t, err)

savedValue, err = redisCli.Get(ctx, "favorite:food").Result()
require.NoError(t, err)
require.Equal(t, "Cabbage Biscuits", savedValue)
```

The connection comes back and the data is still in Redis. The full cycle, normal then failed then recovered, is proven in a single test.

## Adding latency instead of cutting the connection

The connection-cut test above proves your error path. Latency proves your timeout and retry logic. The setup is the same, but instead of disabling the proxy you add a latency toxic:

```go
const (
    latency = 1_000 // ms
    jitter  = 200   // ms
)

_, err = proxy.AddToxic("latency_down", "latency", "downstream", 1.0, toxiproxy.Attributes{
    "latency": latency,
    "jitter":  jitter,
})
require.NoError(t, err)
```

`"downstream"` means the latency applies from Redis back to the client. `1.0` is the toxicity (100% of connections affected). With this toxic active, every Redis response arrives 1,000 ms (plus or minus 200 ms) late.

A client with a 500ms `read_timeout` will surface a timeout error. A client with a 2s timeout will see slow reads but no failure. The test tells you which bucket you are in, before you find out in production.

## What broke, and how fast I saw it

A common mistake is to omit `read_timeout` from the Redis URI. When the proxy is disabled, `Get` does not return an error quickly. It hangs. The test sits there for the OS-level TCP timeout (30 seconds or more) and eventually fails with a timeout from the test runner, not from the client.

That is not a test failure. That is an architecture finding: your Redis client has no timeout configured. Add `?read_timeout=2s` to the URI, re-run the test, and the error surfaces in two seconds. The test is now a specification for your timeout behavior.

The latency toxic surfaces the same class of finding for retry logic. Set the latency higher than your `read_timeout` and the client should retry. If your retry logic is not there, or is behind the wrong error type check, the test fails immediately and points exactly at the gap.

## Closing

A mock of Redis does not test your timeout. A mock that returns an error does not test your reconnection logic. Toxiproxy does both, against a real Redis in a real container, on a real network, with real latency. What changes is the network between them.

The pattern fits naturally alongside the module layer from [Part 4](/posts/2026-06-25-understanding-testcontainers-the-module-layer): `WithProxy` declares the proxy the same way `WithEnv` declares an environment variable. The container handles the wiring; the test focuses on the behavior you are claiming to guarantee.

---

## Resources

- *[testcontainers-go Toxiproxy module](https://github.com/testcontainers/testcontainers-go/tree/main/modules/toxiproxy)*
- *[Toxiproxy by Shopify](https://github.com/Shopify/toxiproxy)*
- *[Developing Resilient Applications with Toxiproxy and Testcontainers (Java)](https://www.docker.com/blog/developing-resilient-applications-with-toxiproxy-and-testcontainers/)*
