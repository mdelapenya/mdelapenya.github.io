---
title: "Choosing the Smallest LLM That Won't Completely Fail You (Part II): Benchmarking with Go"
date: 2026-03-04 09:00:00 +0100
description: "MMLU scores don't test your prompts. Here's how I built a benchmarking framework with Go's testing package and Docker Model Runner to find the smallest model that actually works for my use cases."
categories: [Technology, AI, Go]
tags: ["small-language-models", "go-benchmarks", "go", "golang", "docker-model-runner", "testcontainers"]
type: post
weight: 30
showTableOfContents: true
image: "/images/posts/2026-03-04-slms-benchmarking-with-go/cover.png"
---

![Benchmarking SLMs with Go](/images/posts/2026-03-04-slms-benchmarking-with-go/cover.png)

In [Part 1](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner) I showed how to run Small Language Models locally with Docker Model Runner. You can pull a 727 MB model and chat with it on your laptop. Great. But which model should you actually pick for your project?

MMLU scores and Hugging Face leaderboards give you a general sense of model quality, but they don't test *your* prompts, with *your* tasks, at *your* temperature settings. The only way to know which model works for your use case is to benchmark it yourself.

In this second part, I'll walk you through the benchmarking framework I built to answer that question systematically using Go's built-in testing tools.

## Why Generic Benchmarks Fail You

Every model release comes with benchmark scores: MMLU, HumanEval, GSM8K. These tell you how well a model performs on standardized academic tasks. They're useful for ranking models in general, but they have a fundamental problem: they don't test what you care about.

A model that scores 85% on MMLU might fail miserably at explaining your Go code. A model that aces HumanEval might generate bloated, unusable functions when given your specific prompts. The only way to find out is to test with your actual tasks.

## Full Factorial Design: Testing Everything Against Everything

The core idea is a **full factorial experiment**. Instead of testing one model on one task, you test every combination of three dimensions:

- **Models**: 4 local SLMs (Llama 3.2 1B, Llama 3.2 3B, Qwen3 0.6B, Llama 3.2 1B Instruct) plus an optional hosted model (GPT-5.1) as a baseline
- **Tasks**: 8 prompts covering different capabilities
- **Temperatures**: 5 values (0.1, 0.3, 0.5, 0.7, 0.9)

That gives you **4 models x 8 tasks x 5 temperatures = 160 scenarios**. With GPT-5.1 included, it's 200. Each scenario runs multiple iterations for statistical significance.

Why test temperatures? Because the same model can behave very differently at temperature 0.1 (deterministic, focused) versus 0.9 (creative, unpredictable). A model that's reliable at low temperature might hallucinate at high temperature. You want to know where the breaking points are.

### The eight tasks

The benchmark includes two categories of tasks:

**5 standard prompts** that test core capabilities:
- **Code explanation**: Can the model read and explain a Go function?
- **Mathematical operations**: Can it compute the sum of 1 to 100?
- **Creative writing**: Can it write a joke about the Fibonacci sequence?
- **Factual question**: Does it know about medieval Toledo's translation movement?
- **Code generation**: Can it write a recursive Fibonacci function in Go?

**3 tool-assisted prompts** that test agentic behavior:
- **Calculator reasoning**: Break down `(125 * 47) + (980 / 20) - 156` into steps using a calculator tool
- **Code validation**: Generate Python code, then execute it to verify correctness
- **API data retrieval**: Fetch data from the GitHub API and summarize it

I'll cover tool calling in detail in Part 3, but the key point here is that these tasks test a fundamentally different capability: decomposing a problem into tool calls rather than just generating text.

## Go Benchmarks as the Backbone

Here's where it gets practical. Go's testing package has built-in benchmarking support via `go test -bench`. I used it as the backbone for the entire framework because it gives you iteration control, timing, and custom metrics out of the box.

The benchmark function follows a triple-nested loop: for each model, for each test case, for each temperature, run N iterations:

```go
func BenchmarkLLMs(b *testing.B) {
    for _, model := range models {
        for _, tc := range testCases {
            for _, temp := range temperatures {
                benchName := fmt.Sprintf("%s/%s/temp%.1f", model.Name, tc.Name, temp)
                b.Run(benchName, func(b *testing.B) {
                    for i := 0; i < b.N; i++ {
                        result := runSingleBenchmark(ctx, client, model, tc, temp)
                        // record metrics...
                    }
                })
            }
        }
    }
}
```

Each sub-benchmark gets its own name like `llama3.2/code-explanation/temp0.1`, so the output is structured and filterable. Go's benchmark framework handles timing, iteration count, and the `b.N` loop that determines how many times to run each scenario.

To run it:

```bash
go test -bench=. -benchtime=5x -timeout=30m
```

The `-benchtime=5x` flag tells Go to run each scenario exactly 5 times (instead of the default time-based iteration). The `-timeout=30m` gives enough room for model downloads on the first run.

### Plugging in custom metrics

By default, Go benchmarks report `ns/op` (nanoseconds per operation). That's useful for raw timing, but for LLM benchmarking you need domain-specific metrics: latency percentiles, token throughput, success rates, quality scores.

Go's `testing.B` type has a method called `ReportMetric(value float64, unit string)` that lets you attach any custom metric to a benchmark result. The pattern is straightforward: collect raw results during the `b.N` loop, compute aggregates after the loop, then report them.

```go
b.Run(benchName, func(b *testing.B) {
    results := make([]BenchmarkResult, 0, b.N)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        result := runSingleBenchmark(ctx, client, modelName, tc, temp)
        results = append(results, result)
    }
    b.StopTimer()
```

The `b.ResetTimer()` and `b.StopTimer()` calls are key: `ResetTimer` excludes setup from the timing, `StopTimer` excludes the aggregate computation. Everything between them is the actual benchmark.

After the loop, compute aggregates and report them:

```go
    b.ReportMetric(percentile(latencies, 50), "latency_p50_ms")
    b.ReportMetric(float64(successCount)/float64(len(results)), "success_rate")
    b.ReportMetric(tokensPerSec, "tokens_per_sec")
})
```

The framework reports these custom metrics for every scenario:

- **latency_p50_ms / latency_p95_ms**: Median and 95th percentile response time
- **ttft_p50_ms / ttft_p95_ms**: Time To First Token (how long until the first token arrives)
- **tokens_per_op**: Average tokens per request
- **tokens_per_sec / output_tokens_per_sec**: Total and output-only throughput
- **success_rate**: Percentage of successful requests (0.0 to 1.0)
- **eval_score / eval_pass_rate**: Quality score and pass rate from the Evaluator Agent (more on this in Part 3)

The console output looks like this:

```
BenchmarkLLMs/llama3.2/code-explanation/temp0.1-8    5    ...
    eval_score:0.85 latency_p50_ms:250.00 success_rate:1.00
    tokens_per_sec:180.00 ttft_p50_ms:45.00
```

Every custom metric appears alongside Go's native `ns/op`, giving you a complete picture of each scenario in a single line.

## Running Your Own Benchmarks

The full code is [open source on GitHub](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks). Run it with the same `go test -bench` command shown above. If you set the `OPENAI_API_KEY` environment variable, the evaluator uses GPT-4o-mini for more accurate quality scores; without it, the evaluator falls back to a local model.

On Apple Silicon, prefix with `sudo` if you want GPU utilization metrics (memory metrics work without it).

The benchmark pulls models automatically on the first run, starts Docker Model Runner via Testcontainers, and runs all 160 (or 200) scenarios. Expect 15-25 minutes depending on your hardware.

## What's Next

At this point you have a benchmarking framework that produces raw numbers: latency, token throughput, success rates. But two big questions remain: how do you evaluate the *quality* of 160 responses automatically, and how do you test whether a model can use external tools?

In Part 3, I'll introduce the Evaluator Agent pattern (LLM-as-judge for automated quality scoring) and tool calling benchmarks that test whether SLMs can decompose problems into calculator, code execution, and API calls. That's where the benchmark goes from "how fast" to "how good."

---

_This post is based on my talk "[Choosing the Smallest LLM That Won't Completely Fail You](/slides/2026-02-containerdays-london/ContainerDays-London-Choosing-the-smallest-LLM.pdf)" at ContainerDays London 2026._

_Part of a 4-post series:_
- _[Part 1: SLMs and Docker Model Runner](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner)_
- _Part 2: Benchmarking with Go (this post)_
- _Part 3: Evaluator Agent and Tool Calling (coming soon)_
- _Part 4: Observability with OpenTelemetry and Grafana (coming soon)_

_Resources:_
- _[Benchmark source code](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks)_
- _[Go benchmark documentation](https://pkg.go.dev/testing#hdr-Benchmarks)_
- _[Testcontainers for Go](https://golang.testcontainers.org/)_
- _[Docker Model Runner documentation](https://docs.docker.com/ai/model-runner/)_
