---
title: "Choosing the Smallest LLM That Won't Completely Fail You (Part IV): Observability with OpenTelemetry and Grafana"
date: 2026-03-09 09:00:00 +0100
description: "160 benchmark scenarios produce too much data for terminal output. Here's how I wired OpenTelemetry traces, metrics, and logs into a Grafana dashboard to visualize model performance and make informed decisions."
categories: [Technology, AI, Observability]
tags: ["small-language-models", "opentelemetry", "grafana", "observability", "testcontainers", "docker-model-runner", "go"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-09-slms-observability-otel-grafana/cover.png"
related:
  - "/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner"
  - "/posts/2026-03-04-choosing-the-smallest-llm-part-2-benchmarking-with-go"
  - "/posts/2026-03-06-choosing-the-smallest-llm-part-3-evaluator-agent-and-tool-calling"
---

![Observability with OpenTelemetry and Grafana](/images/posts/2026-03-09-slms-observability-otel-grafana/cover.png)

In [Part 1](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner) we set up SLMs with Docker Model Runner. In [Part 2](/posts/2026-03-04-choosing-the-smallest-llm-part-2-benchmarking-with-go) we built the benchmarking framework with Go. In [Part 3](/posts/2026-03-06-choosing-the-smallest-llm-part-3-evaluator-agent-and-tool-calling) we added automated quality evaluation and tool calling benchmarks.

The framework now produces all the data you need. But 160 scenarios with 10+ metrics each means 1,600+ data points in console output. Patterns that are obvious in a chart are invisible in a wall of text.

Which model is fastest at low temperature? Which task shows the biggest quality gap between 1B and 3B? At what temperature does Qwen3 start hallucinating? You can't answer these by scrolling through terminal output. You need to filter, group, and compare. That's what dashboards are for.

## OpenTelemetry Instrumentation

I used [OpenTelemetry](https://opentelemetry.io/) (OTel) for all the instrumentation. It gives you a vendor-neutral API for traces, metrics, and logs, and ships them via OTLP to any compatible backend.

The benchmark instruments every scenario with all three signals:

### Traces

Each benchmark scenario creates a **span** that captures the full model invocation: model name, task, temperature, and duration. Spans are nested, so the top-level benchmark span contains child spans for the model call, the evaluator call, and any tool calls. When a scenario is slow, I can see exactly where the time went: the model, the evaluator, or a tool.

### Metrics

I emit **histograms** (latency distribution, TTFT, tokens per second), **counters** (total requests, successes, failures, tool calls), and **gauges** (GPU memory, GPU utilization). Every metric is tagged with model, task, and temperature, which is what lets the dashboard filter and group by any dimension.

### Logs

**Structured logs** capture the raw prompt and response for each scenario, plus the evaluator's score and explanation. These are correlated with traces via trace IDs. When I see a low eval_score on the dashboard, I click through to the actual response that failed. No guessing.

### The instrumentation code

Setting up OTel in the benchmark requires a `TestMain` function that initializes the exporter before any benchmarks run:

```go
func TestMain(m *testing.M) {
    ctx := context.Background()

    lgtmContainer, _ := grafanalgtm.Run(ctx, "grafana/otel-lgtm:0.11.18")
    otelEndpoint, _ := lgtmContainer.OtlpHttpEndpoint(ctx)

    otelSetup, _ := InitOTel(ctx, otelEndpoint) // traces, metrics, logs
    dmrContainer, _ := dmr.Run(ctx)              // Docker Model Runner

    exitCode := m.Run()
    otelSetup.Shutdown(ctx)
    os.Exit(exitCode)
}
```

`TestMain` runs before all benchmarks. It starts the LGTM container, initializes OTel exporters pointing at it, starts Docker Model Runner, runs everything, then flushes and shuts down. Swapping the backend (from Grafana to Jaeger, or local to cloud) is just a matter of changing the endpoint.

## Grafana LGTM Stack via Testcontainers

You need a backend to receive, store, and query the OTel data. The benchmark framework uses the **Grafana LGTM stack**: Loki (logs), Grafana (visualization), Tempo (traces), and Mimir (metrics). That's four services, each with its own configuration, that need to work together.

Setting this up manually is tedious. Doing it in CI is worse. So the benchmark uses [Testcontainers](https://golang.testcontainers.org/) to spin up the entire stack in a single container:

```go
grafanaContainer, err := grafanalgtm.Run(ctx, "grafana/otel-lgtm:0.8.1")
if err != nil {
    log.Fatal(err)
}
```

That one line starts a container that bundles Loki, Grafana, Tempo, Mimir, and an OpenTelemetry Collector. It exposes an OTLP endpoint for receiving data and a Grafana UI for querying it. No Docker Compose files, no Helm charts, no YAML manifests. Just a Go function call.

The Testcontainers module also provides helper methods to get the connection details:

```go
otelEndpoint, _ := grafanaContainer.OtlpHttpEndpoint(ctx)
grafanaURL, _ := grafanaContainer.HttpEndpoint(ctx)
```

After the benchmarks run, the Grafana UI is available on `localhost:3000` (by default). Open it in your browser and you have the full observability stack ready to query.

## The Dashboard

The benchmark framework includes a pre-built Grafana dashboard with 22 panels organized into logical sections. You don't have to build the dashboard from scratch. It's provisioned automatically when the LGTM container starts.

The panels are organized into four sections:

**Latency and Throughput** (9 panels): Latency percentiles and distribution histograms, TTFT (Time To First Token) percentiles and distribution, prompt evaluation time percentiles and distribution, tokens per operation, success rate, and tokens-per-second throughput. The latency histogram is where I spend most of my time. It immediately shows which models cluster at the low end and which have long tails. Each histogram supports exemplars, so outlier data points link directly to their trace.

**Quality and Evaluation** (2 panels): Evaluator score and evaluator pass rate, both as time series. These show trends across benchmark runs, so you can see whether a model's quality is stable or noisy across iterations.

**Tool Calling** (7 panels): Tool call latency, tool calls per operation, LLM-tool iterations, tool success rate, tool parameter accuracy, tool selection accuracy, and tool convergence (path efficiency). These panels only light up for the tool-assisted tasks from Part 3. The convergence panel is particularly useful: it shows whether the model arrives at the right answer efficiently or wastes iterations on wrong tool calls.

**GPU and System** (2 panels): GPU utilization and GPU memory usage. Useful for deployment planning: does this model fit on my GPU?

A standalone **ns/op** panel at the bottom shows raw Go benchmark timing for comparison with the OTel-instrumented metrics.

See the [benchmark README](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks) for the full panel reference.

## Dashboard Template Variables

The dashboard uses Grafana template variables that appear as dropdowns at the top of the page. You can filter the entire dashboard by:

- **Model**: Select one or more models to compare. Selecting just two models gives you a clean side-by-side comparison.
- **Task**: Filter to a specific task type. Useful when you care about one capability (e.g., "show me only code generation results").
- **Temperature**: Focus on a specific temperature. If you know your application uses temperature 0.3, filter everything to that value.

These variables propagate to every panel on the dashboard, so changing a filter updates all panels simultaneously. This is how you go from "show me everything" to "show me Llama 3.2 3B vs. Qwen3 0.6B on code tasks at temperature 0.3."

## How to Read the Dashboard

Having a dashboard is one thing. Knowing what to look for is another. Here's the workflow I use:

### Start with latency and success rate

Open the dashboard and look at the latency percentiles and success rate panels first. These give you the high-level picture: which models are fast and which actually complete their tasks. You'll usually eliminate one or two candidates immediately. A model with a low success rate isn't worth investigating further, no matter how fast it is.

### Check quality scores

Next, look at the evaluator score and pass rate panels. Use the template variables to filter by model and task. You might discover that Model A scores well on code tasks but poorly on creative writing, while Model B is the opposite. If your application only needs code tasks, Model A is the obvious choice even if its overall pass rate is lower.

### Compare tool calling capability

The tool calling section has seven panels that reveal whether a model can participate in agentic workflows. Tool selection accuracy tells you if the model picks the right tool. Parameter accuracy tells you if it sends valid inputs. Convergence tells you if it gets to the answer efficiently. A model that selects the right tool but sends malformed parameters is a different problem than one that ignores tools entirely.

### Use exemplars for deep dives

Grafana supports **exemplars**: individual data points on a chart that link to the underlying trace. When you see an outlier (a scenario that took 10x longer than average, or scored 0 when others scored 8), click the exemplar to jump to its trace.

The trace shows the full span tree, so you can pinpoint the slow step. It also links to the log entry, which contains the raw prompt and response. You can read the actual response that got a score of 0 and understand why it failed.

## Investigating Failures with LogQL

When the dashboard surfaces a pattern (a model that scores 0 on a specific task), you'll want to dig into the raw data. Grafana's Loki data source supports **LogQL** queries for this:

```text
{service_name="llm-benchmarks"} | json | eval_score < 3
```

This finds all benchmark runs where the eval score was below 3. You can narrow it further:

```text
{service_name="llm-benchmarks", model="llama3.2-1B"} | json | task="tool-calculator" | eval_score = 0
```

This finds every failed calculator tool call for Llama 3.2 1B. The log entries tell you exactly what went wrong: did the model fail to call the tool, call it with wrong parameters, or misinterpret the result?

## The Model Selection Process

The whole process takes about 30 minutes of compute time and 15 minutes of dashboard analysis. Define your tasks, pick candidate models, run the benchmarks, and open the dashboard. Compare that to manually testing models one by one, which could take days and still leave you guessing.

The smallest model that won't completely fail you is probably smaller than you think. With 160 scenarios, three OTel signals, and 22 dashboard panels, you now have the evidence to prove it.
## Did you find a bug in the dashboards?

The dashboard and the benchmarking framework are open source. If you spot a panel that could be improved, a metric that's missing, or a query that's wrong, [open an issue or submit a PR](https://github.com/mdelapenya/generative-ai-with-testcontainers/issues/new). The dashboard is generated from Go code, so fixes are just function calls.

---

_This post is based on my talk "[Choosing the Smallest LLM That Won't Completely Fail You](/slides/2026-02-containerdays-london/ContainerDays-London-Choosing-the-smallest-LLM.pdf)" at ContainerDays London 2026._

_Part of a 4-post series:_
- _[Part 1: SLMs and Docker Model Runner](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner)_
- _[Part 2: Benchmarking with Go](/posts/2026-03-04-choosing-the-smallest-llm-part-2-benchmarking-with-go)_
- _[Part 3: Evaluator Agent and Tool Calling](/posts/2026-03-06-choosing-the-smallest-llm-part-3-evaluator-agent-and-tool-calling)_
- _Part 4: Observability with OpenTelemetry and Grafana (this post)_

_Resources:_
- _[Benchmark source code](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks)_
- _[OpenTelemetry documentation](https://opentelemetry.io/docs/)_
- _[Grafana LGTM stack](https://grafana.com/blog/2024/03/13/an-opentelemetry-backend-in-a-docker-image-introducing-grafana/otel-lgtm/)_
- _[Testcontainers Grafana LGTM module](https://golang.testcontainers.org/modules/grafana-lgtm/)_
- _[Testcontainers for Go](https://golang.testcontainers.org/)_
