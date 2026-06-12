---
title: "Testing Helm charts with sk8s and testcontainers-go"
date: 2026-06-12 09:00:00 +0200
description: "How DHI (Docker Hardened Images) uses testcontainers-go and sk8s to test Helm charts in ephemeral k3s clusters: scaffolding, image loading, and one-cluster testing strategies."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "kubernetes", "k3s", "helm", "sk8s", "dhi"]
type: post
weight: 30
ai: true
showTableOfContents: true
image: "/images/posts/2026-06-12-testing-helm-charts-with-sk8s-and-tc-go/cover.png"
---

![Testing Helm charts with sk8s and testcontainers-go](/images/posts/2026-06-12-testing-helm-charts-with-sk8s-and-tc-go/cover.png)

> Originally written by [Enin Kaduk](https://www.linkedin.com/in/eninkaduk/), also published his personal blog: https://www.blueprismo.com/posts/2026/sk8s_testcontainers/

## Intro

If you ship Kubernetes workloads, you eventually want tests that go beyond `helm template` and YAML linting.
You want to know that the chart actually installs, that the security context matches your intended least privilege, that probes succeed, that pods become `Ready`, and that the thing you exposed on port 8080 really answers.
At Docker Hardened Images (DHI) we do that thousands of times across container images and Helm charts. The stack underneath is simple and clean:

1. **[testcontainers-go](https://golang.testcontainers.org/)** spins up real containers during `go test` and tears them down when the test finishes.
2. **[sk8s](https://github.com/docker-hardened-images/sk8s)**, our open-source helper that sits on top of testcontainers' k3s module and gives you a typed Kubernetes client, Helm install helpers, wait utilities, and image loading into the cluster.

This post explains how those pieces fit together, what scaffolding looks like in practice, and the testing strategies we use to keep CI fast.

## Why not mock Kubernetes?

There are multiple ways you can test Kubernetes, and there are excellent libraries out there. For unit tests where you don't need a kubelet you can use [envtest](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/envtest); [KWOK](https://kwok.sigs.k8s.io/) for scaling tests where you need to mock real nodes, and so on.
You can mock a lot. Helm dry-run is excellent for static checks: rendered manifests, security contexts, image references, compliance scans against YAML.
But mocks will not tell you that:
- a webhook fails to register because the CA bundle is wrong,
- an init container loops forever on `arm64`,
- a chart dependency pulls an image the cluster cannot reach,
- your readiness probe hits the wrong port after a values change.
An ephemeral cluster gives you a real API server, real scheduling, real kubelet behaviour without maintaining a shared staging environment that everyone fights over.
testcontainers-go is the engine. sk8s is the ergonomics layer we built to ease up having to test an ever-increasing number of charts.

## The stack, bottom to top

```text
┌─────────────────────────────────────────────┐
│  your test (Helm install, HTTP checks, …)   │
├─────────────────────────────────────────────┤
│  sk8s.TestCluster                           │
│  - client-go clients                        │
│  - HelmInstall / HelmUninstall              │
│  - LoadImages, WaitFor*, GetRaw (API proxy) │
├─────────────────────────────────────────────┤
│  testcontainers-go/modules/k3s              │
│  - rancher/k3s container                    │
│  - kubeconfig extraction                    │
├─────────────────────────────────────────────┤
│  testcontainers-go + Docker                 │
└─────────────────────────────────────────────┘
```
Today sk8s uses the [k3s module](https://github.com/testcontainers/testcontainers-go/tree/main/modules/k3s). The project is deliberately structured so other backends (EKS, kind, whatever fits your CI) can be swapped in later, the `TestCluster` surface is the contract, not k3s itself.
We chose k3s because it is a fast, full-fledged Kubernetes distribution, cloud-provider agnostic, with its container runtime embedded.

## Bootstrapping a cluster

The entry point is `sk8s.GetCluster`. Under the hood it:
1. Builds a k3s config file (feature gates, disabled bundled components like metrics-server, etc.).
2. Runs the k3s container via testcontainers, with cleanup registered on `t`.
3. Parses kubeconfig from the container and constructs a `kubernetes.Clientset` ([ref](https://pkg.go.dev/k8s.io/client-go/kubernetes#Clientset)).
4. Creates a temp directory for Helm state (kubeconfig file, repo cache, registry config).

Minimal example:

```go
func TestMyChart(t *testing.T) {
    ctx, cancel := context.WithTimeout(t.Context(), 5*time.Minute)
    defer cancel()
    cluster, err := sk8s.GetCluster(t, ctx,
        // sk8s.WithLoggingOptions(true, true), // optional: stream Warning events and pod logs in CI
    )
    require.NoError(t, err)
    // cluster is ready, install something
}
```

## Helm chart tests: the happy path

Helm charts in CI usually need three things the cluster does not have by default:
1. **The chart itself** (local directory, tarball, or OCI artifact).
2. **All container images** referenced by the rendered manifests, pulled and loaded into k3s' containerd namespace.
3. **A target namespace** (created automatically by `HelmInstall` when you pass `WithNamespace`).
sk8s wraps the Helm v4 SDK. A typical install flow looks like this:

```go
const ns = "my-namespace"
// 1. Start cluster
cluster, err := sk8s.GetCluster(t, ctx)
require.NoError(t, err)
// 2. Pre-load images (see next section)
err = cluster.LoadImages(ctx,
    "registry.example.com/my-controller:1.2.3",
    "registry.example.com/my-sidecar:1.2.3",
)
require.NoError(t, err)
// 3. Install chart
err = cluster.HelmInstall(ctx, "test",
    sk8s.ChartSourceFromOCI("oci://registry.example.com/my-chart", "2.0.0"),
    sk8s.WithNamespace(ns),
    sk8s.WithInstallValues(map[string]interface{}{
        "replicaCount": 1,
        "image": map[string]interface{}{
            "tag": "1.2.3",
        },
    }),
)
require.NoError(t, err)
// 4. Wait for workloads
err = cluster.WaitForDeployment(ctx, ns, "my-controller")
require.NoError(t, err)
```

`HelmInstall` creates the namespace if needed, wires Helm's kubeconfig to the ephemeral cluster, and runs with a generous install timeout (Helm's default status watcher timeout is too short for some "big" charts).
Chart sources are pluggable: OCI refs, classic repo URL + version, or repo URL + appVersion resolution. There is no dedicated tarball helper as of today, but Helm's `LocateChart` can resolve local chart directories (and `.tgz` paths) when the ref points at the filesystem.

## Loading images: the part everyone gets wrong once

k3s runs inside Docker. Your test runner also talks to Docker. The k3s container is not your test runner. The cluster **cannot** magically pull from a registry your CI job can reach unless network policy, credentials, and DNS all align inside that container, and in chart tests they often do not, because you want hermetic, reproducible runs.
The pattern we use:
1. **Dry-run render** the chart with the same values you will install with.
2. Walk the rendered manifests and collect every `image:` field (including hook manifests).
3. **Pull on the host** with the testcontainers Docker provider.
4. **Import into k3s** via `cluster.LoadImages`.

Conceptually:

```go
images, err := extractImagesFromHelmRender(chartPath, values)
require.NoError(t, err)
for _, img := range images {
    require.NoError(t, dockerProvider.PullImage(ctx, img))
}
require.NoError(t, cluster.LoadImages(ctx, images...))
```

If you skip this step, the failure mode is maddening: `ImagePullBackOff` on an image you *know* exists, because pods pull through k3s, not through your laptop's Docker login.
Registry credentials on the host help the test runner pull images in step 3, but they do not automatically fix in-cluster pulls. You still want `LoadImages` (or explicit `imagePullSecrets` in the chart) so workloads start without relying on runtime registry access from inside k3s.
sk8s also supports digest-pinned images and platform-aware imports when you test multi-arch images.

## Two layers of testing

We split chart validation into **static** and **runtime** layers. Both matter, neither replaces the other.

### Static tests (no cluster)

Run fast, parallelise well, fail with precise diffs:
- Chart.yaml / values.yaml sanity (`helm show chart`, `helm show values`).
- Rendered manifest checks: security contexts, resource names, labels.
- Image reference policy (e.g. all workloads point at hardened images).
- Optional policy/compliance tooling against rendered YAML.
These use Helm dry-run and Go assertions on unstructured manifests. No Docker socket required.

### Runtime tests (sk8s cluster)

Answer the questions dry-run cannot, such as
- Do Deployments actually reach Readiness and provide healthy startup logs?
- Do CRDs get established before controllers start reconciling?
- Does the metrics endpoint return Prometheus text?
- Can you reach a service through the API server proxy?
Example: after install, probe a Service through the built-in API proxy (no Ingress required in k3s):

```go
t.Run("portal responds", func(t *testing.T) {
    path := fmt.Sprintf("/api/v1/namespaces/%s/services/my-portal:80/proxy/", ns)
    err := cluster.WaitFor(ctx, func(ctx context.Context) (bool, error) {
        body, err := cluster.GetRaw(ctx, path)
        if err != nil {
            return false, nil
        }
        return strings.Contains(body, "expected-marker"), nil
    })
    require.NoError(t, err)
})
```

And for Prometheus endpoints on a specific pod:

```go
pods, err := cluster.GetPodsForDeployment(ctx, ns, "my-controller")
require.NoError(t, err)
require.NotEmpty(t, pods)
metricsPath := fmt.Sprintf(
    "/api/v1/namespaces/%s/pods/%s:8080/proxy/metrics",
    ns, pods[0].Name,
)
// WaitFor + GetRaw until body contains "# HELP"
```

This pattern shows up repeatedly in our chart tests: one install, many focused subtests for metrics, CRDs, and HTTP behaviour.

## Strategy: one cluster, many subtests

Starting k3s is the expensive part. A cold boot can take some seconds; pulling and importing images adds more. If every `t.Run` calls `GetCluster` again, your suite scales linearly with the number of test cases and CI becomes a dojo of patience.
**Prefer one cluster per top-level test function, then fan out with subtests.**

```go
func TestInstall(t *testing.T) {
    ctx, cancel := context.WithDeadline(t.Context(), time.Now().Add(5*time.Minute))
    defer cancel()
    cluster, err := installChartOnce(t, ctx, namespace, values)
    require.NoError(t, err)
    // Multiple subtests in the same cluster.
    t.Run("CRDs installed", func(t *testing.T) { /* … */ })
    t.Run("controller metrics", func(t *testing.T) { /* … */ })
    t.Run("webhook ready", func(t *testing.T) { /* … */ })
}
```

An important consideration with this strategy is that some subtests might pollute subsequent ones: a test that creates a Job, for example, should clean up after itself, or call `HelmUninstall` before the next scenario.

### The `parent := t` trick

sk8s stores Helm state under `t.TempDir()` and registers container cleanup on the `*testing.T` you pass to `GetCluster`.
If you call `GetCluster` inside a subtest's `t`, that subtest's temp dir (and sometimes the cluster lifecycle) gets torn down when the subtest returns, while sibling subtests still need the cluster.
**Pass the parent test's `*testing.T` for cluster setup; use the subtest's `t` only for assertions and logging.**

```go
func TestMyStack(t *testing.T) {
    parent := t
    ctx, cancel := context.WithTimeout(parent.Context(), 5*time.Minute)
    defer cancel()
    var cluster *sk8s.TestCluster
    t.Run("01_start_k3s", func(t *testing.T) {
        var err error
        cluster, err = sk8s.GetCluster(parent, ctx) // parent, not t
        require.NoError(t, err)
    })
    t.Run("02_install_chart", func(t *testing.T) {
        require.NotNil(t, cluster)
        require.NoError(t, installChart(parent, cluster))
    })
    t.Run("03_verify_ready", func(t *testing.T) {
        require.NotNil(t, cluster)
        // assertions using cluster …
    })
}
```

This is one of those small details that is obvious in hindsight and costs an afternoon the first time you hit it.

### When to spin up a second cluster

One cluster is not always enough:
- Tests that mutate cluster-scoped resources aggressively (webhooks, CNI swaps).
- Cases that need a **clean etcd state** (e.g. install → uninstall → reinstall with different values).
- Parallel packages (`t.Parallel()` at package level): each parallel test still needs its own cluster; share within the test function, not across packages without coordination.
For chart repos with many charts, we still run **separate top-level tests per chart** (isolation by failure domain), but **within** a chart's install test we consolidate subtests.

## testcontainers patterns worth knowing

Even when sk8s hides most of it, these testcontainers-go ideas show up everywhere in our tests:
| Concept | Why it matters |
|--------|----------------|
| `tc.Run` / module `k3s.Run` | Declarative container start + automatic cleanup |
| `wait.ForListeningPort` / `wait.ForLog` | Ready conditions before assertions |
| `MappedPort` | Host-reachable ports for non-k8s sidecars |
| `network.New` | Multi-container scenarios (database + app under test) |
| Docker provider image pull/save | Bridge between host registry and cluster import |

## What sk8s gives you beyond raw k3s

Short list of APIs we reach for daily:
- **`WaitForDeployment` / `WaitForDaemonSet` / `WaitForStatefulSet`, etc.**: poll until Ready replicas match desired.
- **`WaitForCRD`**: gate tests that apply CRs immediately after install.
- **`GetRaw`**: HTTP through the API server proxy; great for metrics and simple HTTP checks without port-forward boilerplate.
- **`ExecPod` / `RunJob`**: run one-off commands when you need shell access.
- **`HelmUninstall`**: reset between scenarios in the same cluster (cheaper than a full reboot when it works).
- **`WithLoggingOptions`**: printf debugging when CI fails and you cannot attach a debugger.

If you feel something is missing, see the [contributing guide](https://github.com/docker-hardened-images/sk8s/blob/main/CONTRIBUTING.md).

## Roadmap: beyond k3s

k3s is ideal for CI: single container, fast boot, good enough Kubernetes for chart smoke tests. It is not identical to production EKS/GKE/AKS, CNI defaults differ, LoadBalancer Services behave differently, some admission APIs are simplified.
sk8s is structured so the **cluster backend can change** while tests keep calling `TestCluster`. An EKS-backed implementation would provision (or attach to) a real cluster, still expose the same Helm and wait helpers, and let you tag tests that need cloud-specific behaviour.
Until then, k3s plus disciplined image loading gets you surprisingly far which is why we open-sourced the library instead of keeping it in a private test harness.
In the near future, we are thinking about adding modules for cloud providers so sk8s can easily roll into your Helm testing 🛹

## Closing thoughts

Good Kubernetes tests are a layering problem:
- **Dry-run** for fast feedback on YAML and policy.
- **Ephemeral clusters** for install/readiness/integration behaviour.
- **Shared cluster per test function** to keep CI humane.
testcontainers-go makes the cluster disposable. sk8s makes it usable from Go tests without drowning in glue code.
The sk8s source and examples live at [github.com/docker-hardened-images/sk8s](https://github.com/docker-hardened-images/sk8s). Issues and PRs welcome 🌟

---

*Resources:*
- *[Docker Hardened Images](https://www.docker.com/products/hardened-images/)*
- *[sk8s on GitHub](https://github.com/docker-hardened-images/sk8s)*
- *[testcontainers-go on GitHub](https://github.com/testcontainers/testcontainers-go)*
