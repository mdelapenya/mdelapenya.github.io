---
title: "A Year of testcontainers-go on Docker Hub"
date: 2026-06-26 09:00:00 +0200
description: "A short look at the trail testcontainers-go leaves on Docker Hub: the two images it pulls in normal operation, the User-Agent header that makes the pulls attributable, and the growth visible in a year of Ryuk pull metrics."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "docker", "docker-hub"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-06-26-a-year-of-testcontainers-go-on-docker-hub/cover.png"
related:
  - "/posts/2026-06-25-understanding-testcontainers-the-module-layer"
  - "/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks"
  - "/posts/2026-06-15-understanding-testcontainers-wait-strategies"
  - "/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options"
---

![A Year of testcontainers-go on Docker Hub](/images/posts/2026-06-26-a-year-of-testcontainers-go-on-docker-hub/cover.png)

I am a core maintainer of [testcontainers-go](https://github.com/testcontainers/testcontainers-go) and a Docker employee. That overlap is what makes this post possible. As the maintainer I know exactly how the library identifies itself when it talks to a Docker daemon. As a Docker employee I can look at the Docker Hub pull metrics filtered by that identifier. Together they produce a measurable trail.

This post is short. It covers the two images testcontainers-go pulls during normal operation, the small piece of code that signs every Docker API call with a `tc-go/<version>` User-Agent, the numbers that header reveals for the last year, and what those numbers say about the library's adoption.

## The two images tc-go pulls

The `testcontainers` namespace on Docker Hub holds four images today: `testcontainers/ryuk`, `testcontainers/sshd`, `testcontainers/helloworld`, and `testcontainers/vnc-recorder`. Of those four, testcontainers-go itself only pulls two during normal operation.

`testcontainers/ryuk` is the cleanup sidecar. Every session that does not explicitly opt out runs a Ryuk container alongside the user's test containers. It watches a TCP socket and deletes any container, network, volume, or image labeled with the session's identifier once the test process disconnects. Ryuk will get its own dedicated post later this year, so I will not go deeper here.

`testcontainers/sshd` is the port forwarder. When a test asks for host ports to be reachable from the container (via `HostAccessPorts`), the library spins up an `sshd` container that tunnels traffic between the container network and the host. It is pulled only when needed, so its volume is a small fraction of Ryuk's.

The other two images in the namespace are not pulled by testcontainers-go in normal operation. `helloworld` is a documentation image used in tutorials and quick-start examples. `vnc-recorder` is used for visual session recording and is referenced by the Selenium module setup, pulled by users on demand rather than by the library's core path.

## How tc-go signs every Docker API call

The library uses `github.com/moby/moby/client`, the upstream Docker API client, and routes every connection through a single constructor in `internal/core/client.go`. The relevant lines:

```go
opts = append(opts, client.WithHTTPHeaders(
    map[string]string{
        "x-tc-pp":    ProjectPath(),
        "x-tc-sid":   SessionID(),
        "User-Agent": "tc-go/" + internal.Version,
    }),
)
```

Three headers are added to every request the library makes to the Docker daemon. `x-tc-pp` carries the project path and `x-tc-sid` carries the session ID. Those two are for internal correlation across operations of the same test run. They are also part of the story of how Ryuk knows which containers belong to which session, which is a topic for the Ryuk post.

The `User-Agent` is the one Docker Hub sees during image pulls, and the one that lets pull metrics be attributed back to testcontainers-go specifically rather than to "some Docker client somewhere". A library version is appended, so the same data can also be sliced by version. The header is small and cheap. The rest of this post is a window into what it reveals.

## A year of tc-go on Docker Hub

For the 365-day window ending mid-June 2026, Docker Hub recorded approximately:

| Metric                              |     Value |
|-------------------------------------|----------:|
| Total pulls attributed to tc-go     |   ~169.3M |
| Daily average                       |     ~464K |
| Peak day                            |    ~1.09M |
| Distinct images touched             |         2 |

The vast majority of these pulls are for `testcontainers/ryuk`, which makes sense: every session starts a Ryuk container by default, while `sshd` only enters the picture when port forwarding is requested. Treating Ryuk pulls as a proxy for "testcontainers-go sessions started worldwide" is reasonable.

The interesting movement is not in the year total. It is in the trend across quarters. Approximate daily average Ryuk pulls attributed to tc-go, by quarter:

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="tc-go average daily pulls of testcontainers/ryuk by quarter">
  <title>tc-go average daily pulls of testcontainers/ryuk by quarter</title>
  <rect x="0" y="0" width="640" height="360" fill="#ffffff"/>
  <text x="320" y="28" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#222">tc-go: average daily pulls of testcontainers/ryuk, by quarter</text>
  <line x1="80" y1="40" x2="80" y2="300" stroke="#bbb" stroke-width="1"/>
  <line x1="80" y1="300" x2="620" y2="300" stroke="#bbb" stroke-width="1"/>
  <line x1="80" y1="235" x2="620" y2="235" stroke="#eee" stroke-width="1"/>
  <text x="72" y="239" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">200K</text>
  <line x1="80" y1="170" x2="620" y2="170" stroke="#eee" stroke-width="1"/>
  <text x="72" y="174" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">400K</text>
  <line x1="80" y1="105" x2="620" y2="105" stroke="#eee" stroke-width="1"/>
  <text x="72" y="109" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">600K</text>
  <line x1="80" y1="40" x2="620" y2="40" stroke="#eee" stroke-width="1"/>
  <text x="72" y="44" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">800K</text>
  <text x="72" y="304" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">0</text>
  <rect x="115" y="202.5" width="80" height="97.5" fill="#4f6172"/>
  <text x="155" y="195" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#222">~300K</text>
  <text x="155" y="320" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#444">Q3 2025</text>
  <rect x="235" y="186.25" width="80" height="113.75" fill="#4f6172"/>
  <text x="275" y="179" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#222">~350K</text>
  <text x="275" y="320" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#444">Q4 2025</text>
  <rect x="355" y="105" width="80" height="195" fill="#4f6172"/>
  <text x="395" y="98" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#222">~600K</text>
  <text x="395" y="320" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#444">Q1 2026</text>
  <rect x="475" y="56.25" width="80" height="243.75" fill="#4f6172"/>
  <text x="515" y="49" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#222">~750K</text>
  <text x="515" y="320" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#444">Q2 2026</text>
  <text x="30" y="170" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666" transform="rotate(-90 30 170)">Avg daily pulls</text>
  <text x="320" y="350" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-style="italic" fill="#888">Approximate quarterly averages, derived from Docker Hub metrics filtered by the tc-go User-Agent</text>
</svg>

The line moves up across the year. Q3 2025 to Q4 2025 is roughly flat. Q4 2025 to Q1 2026 is a step change. Q1 2026 to Q2 2026 is a continued climb. By Q2 2026 the daily average is roughly 2.5 times what it was in Q3 2025.

## tc-go inside the testcontainers family

For context, the same 365-day window aggregated across the entire `testcontainers` namespace, every library combined (tc-elixir, tc-go, tc-java, tc-node, tc-python, tc-rust, tc-swift), totals approximately 1.08 billion pulls. Daily average around 2.95M, peak day around 6.5M. tc-go accounts for roughly 1 of every 6 pulls in the namespace by daily average, around 16%.

The biggest library by margin is tc-java, which is older and has the deepest enterprise penetration. tc-go is comfortably the second-largest line on the family chart. The same upward trend visible in tc-go alone is visible in the family aggregate, and the same proxy (Ryuk pulls) drives most of it.

The split is only possible because every implementation carries its own User-Agent on every Docker API call: `tc-java/<version>`, `tc-dotnet/<version>`, `tc-python/<version>`, and so on. Without those headers, the family total would be a single undifferentiated number.

## Another lens: GitHub import metrics

Docker Hub pulls answer "how many testcontainers-go sessions are running", across public and private codebases alike, attributed via the User-Agent. They do not say whether a given session is testing Postgres, Kafka, or Redis, and they do not say how many distinct projects depend on tc-go in the first place.

The project publishes a complementary lens, collected monthly from GitHub Code Search:

- [Library usage metrics](https://golang.testcontainers.org/usage-metrics/) searches `go.mod` files for `"testcontainers/testcontainers-go"` and shows total adoption over time, the usage trend, the latest usage by library version, and a GitHub Stars chart. Forks and the testcontainers organization itself are excluded.
- [Per-module usage metrics](https://golang.testcontainers.org/usage-metrics/modules/) does the same for `"testcontainers/testcontainers-go/modules"` and breaks down the result by module: total imports over time, top-10 trend lines, the latest imports per module, and a comparative chart across every module the library ships.

The two surfaces answer different questions about different populations. Docker Hub counts runtime traffic across the whole world, public projects and private ones, attributed only by the library's User-Agent. The GitHub-search metrics count static `go.mod` imports across public repositories only, broken down by library version and by module, with a caveat the page itself surfaces: GitHub Code Search produces non-deterministic results across queries, so the numbers move slightly between captures even when nothing changed in the repos.

Together they give a fuller picture. Who is depending on which parts of the library, taken from the GitHub view. How much that dependency translates into actual container traffic, taken from the Docker Hub view. Two different populations, two different signals.

## Closing

The technical lesson is small and reusable. If you build a library that talks to a registry, instrument every outbound call with a clear User-Agent. The cost is a few lines in a constructor. The payoff is years of operational visibility, including the ability to answer "how much is this library actually used" with data instead of guesses. The pulls that already happened without a User-Agent are not retroactively attributable. The only choice that gives you the data is the choice made before the pulls started.

For testcontainers-go specifically, that choice was made early. What we see today is roughly a year of test runs around the world reaching for `testcontainers/ryuk`, from CI pipelines and developer laptops alike, growing across the year, observable because the library labeled itself when it asked.

---

*Resources:*
- *[testcontainers-go on GitHub](https://github.com/testcontainers/testcontainers-go)*
- *[testcontainers namespace on Docker Hub](https://hub.docker.com/u/testcontainers)*
- *[testcontainers-go usage metrics (library)](https://golang.testcontainers.org/usage-metrics/)*
- *[testcontainers-go usage metrics (modules)](https://golang.testcontainers.org/usage-metrics/modules/)*
