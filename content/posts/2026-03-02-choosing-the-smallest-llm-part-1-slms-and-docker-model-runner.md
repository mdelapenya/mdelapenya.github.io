---
title: "Choosing the Smallest LLM That Won't Completely Fail You (Part I): SLMs and Docker Model Runner"
date: 2026-03-02 09:00:00 +0100
description: "Not every task needs a trillion-parameter model. Small Language Models running locally with Docker Model Runner can save you money, time, and API rate limits. Here's how to get started."
categories: [Technology, AI, Docker]
image: "/images/posts/2026-03-02-slms-docker-model-runner/cover.png"
tags: ["small-language-models", "docker-model-runner", "quantization", "llms", "open-source"]
type: post
weight: 30
showTableOfContents: true
ai: true
---

![SLMs and Docker Model Runner](/images/posts/2026-03-02-slms-docker-model-runner/cover.png)

I recently gave a talk at [ContainerDays London 2026](https://www.containerdays.io/containerdays-london-2026/agenda/) called "Choosing the Smallest LLM That Won't Completely Fail You." The title was a bit funny, but the question behind it is dead serious: when you're building AI-powered software, do you really need a model with hundreds of billions of parameters for every single task?

The short answer is no. And in this four-part series, I'll walk you through how I approach model selection using only open-source tools. This first post covers what Small Language Models (SLMs) are, why they matter, and how to run them locally with Docker Model Runner. Part 2 builds the benchmarking framework with Go, Part 3 adds automated quality evaluation and tool calling, and Part 4 wires everything into a Grafana dashboard so you can actually see the results.

## The Cost of "Just Use GPT"

When building AI software, you typically need to define several moving pieces: system prompts, model parameters (temperature, top_p, top_k), the model itself, and response formats. During development, you're iterating on all of these constantly.

Here's the problem: if you're using a large hosted model for every iteration cycle (local development, CI pipelines, exploratory testing), you're burning tokens like Mario collecting coins. And tokens cost real money.

![Super Mario collecting coins](/images/posts/2026-03-02-slms-docker-model-runner/mario-coins.gif)

Would you use your production database to test every code change? Probably not. You could use a local database, something lighter and faster like [Testcontainers](https://www.testcontainers.org) that gives you confidence without the cost and risk. The same logic applies to language models.

## What Are Small Language Models?

SLMs are, in essence, open-source models that fit in your host's GPUs. We're talking 2-8 GB of disk (and GPU memory), maybe more, but not the hundreds of gigabytes that the big players' models require. They won't produce responses as rich as GPT-5 or Claude Opus, but they're ideal for experimentation and specialized tasks.

The key difference comes down to **parameters**. While the large models from OpenAI, Anthropic, and Google operate with hundreds of billions to potentially trillions of parameters, SLMs typically range from 0.6 to 8 billions of parameters. Fewer parameters means smaller size, faster inference, and the ability to run entirely on your local hardware.

Some popular SLMs you'll encounter:

- **Llama 3.2** (Meta): Available in 1B and 3B variants
- **Qwen 3** (Alibaba): Available in 0.6B variant
- **SmolLM2** (Hugging Face): A 360M parameter model

## Quantization: Shrinking Models Without (Completely) Breaking Them

Even a 3B parameter model can be large depending on how the weights are stored. That's where **quantization** comes in: reducing the precision of how weights are stored as floating point numbers.

Think of it like image compression. A RAW photo is huge but perfect. A JPEG is smaller with barely noticeable quality loss. Compress too aggressively and you start seeing artifacts. Quantization works the same way:

- **FP32** (full precision): 100% of the original size
- **FP16** (half precision): ~50% of the size
- **Q8** (8-bit quantization): ~25% of the size
- **Q4** (4-bit quantization): ~12.5% of the size

The trade-offs are real. Quantization can cause:

- **Slightly worse reasoning** across all tasks
- **More hallucinations** at higher temperatures
- **Faster degradation** on sensitive tasks like math and code generation

The sweet spot for most local and edge use cases is **Q4_K_M**. I'll break down what that name means in the next section.

## Running Models Locally with Docker Model Runner

There are several ways to run SLMs locally: llama.cpp directly, the [ardanlabs/kronk](https://github.com/ardanlabs/kronk) Go library, Ollama, and others. But the approach I want to highlight is **Docker Model Runner**, available on Linux, macOS, and Windows through Docker Desktop (and since late 2025, also as a standalone component for Docker Engine).

Why Docker Model Runner? Because it treats models as first-class citizens in the Docker ecosystem. Models are distributed as **OCI artifacts** on Docker Hub, which means you pull them the same way you pull container images.

### Pulling models

```bash
docker model pull ai/llama3.2:3B-Q4_0
```

That's it. Docker Hub hosts AI models alongside container images, and the CLI experience is familiar.

Docker also provides an alias that automatically selects a recommended model for you:

```bash
docker model pull gpt-oss
```

This pulls OpenAI's open-weight GPT-OSS model, which Docker treats as the default recommendation. You don't need to remember a specific tag; Docker picks the right variant.

### Understanding model names

The naming convention encodes everything you need to know about a model variant. Let's decode `ai/llama3.2:3B-Q4_K_M`:

- **3B**: 3 billion parameters
- **Q4**: 4-bit quantization (using 4 bits instead of the original 32)
- **K**: K-quantization from llama.cpp, which uses grouped quantization for better accuracy
- **M**: Medium variant of K, a balanced choice between speed, memory, and accuracy

Once you understand this naming scheme, you can make informed decisions just by reading the tag.

### Running a model

```bash
docker model run ai/llama3.2:3B-Q4_0
```

This drops you into an interactive chat session. Ask it anything:

```
> do you like testcontainers-go?
Testcontainers-go is a fantastic tool for testing Kubernetes applications
in Go. It simplifies the process of setting up ephemeral containers for
testing, allowing you to write cleaner and more efficient tests.
```

Not bad for a 1.78 GB model running entirely on your laptop.

### Accessing models from containers

For programmatic access, Docker Model Runner exposes an OpenAI-compatible API. From any container in your Docker network, you can reach it through:

```
http://model-runner.docker.internal:80
```

This is particularly useful when your application runs in containers and needs to talk to a local model. In fact, this is exactly how the [Testcontainers Go Docker Model Runner module](https://golang.testcontainers.org/modules/dockermodelrunner/) works: it uses a socat container to bridge the connection between your test containers and Docker Model Runner's inference engine.

## The Model Variants at a Glance

Here's a quick reference for Llama 3.2 variants available on Docker Hub:

| Model variant | Parameters | Quantization | VRAM | Size |
|---|---|---|---|---|
| `ai/llama3.2:latest` | 3B | IQ2_XXS/Q4_K_M | 2.77 GiB | 1.87 GB |
| `ai/llama3.2:1B-Q4_0` | 1B | Q4_0 | 1.35 GiB | 727 MB |
| `ai/llama3.2:1B-Q8_0` | 1B | Q8_0 | 1.87 GiB | 1.22 GB |
| `ai/llama3.2:1B-F16` | 1B | F16 | 2.95 GiB | 2.30 GB |
| `ai/llama3.2:3B-Q4_0` | 3B | Q4_0 | 2.68 GiB | 1.78 GB |
| `ai/llama3.2:3B-Q4_K_M` | 3B | IQ2_XXS/Q4_K_M | 2.77 GiB | 1.87 GB |
| `ai/llama3.2:3B-F16` | 3B | F16 | 6.89 GiB | 5.98 GB |

Notice the range: from 727 MB (1B Q4_0) to 5.98 GB (3B F16), the same model family spans an order of magnitude in size depending on parameters and quantization.

## When to Use SLMs (and When Not To)

Use SLMs for:

- **Local development**: iterate on prompts, system messages, and response formats without burning API credits
- **CI pipelines**: validate that your AI integration code works without depending on external APIs
- **Specialized tasks**: classification, entity extraction, simple Q&A where a smaller model is "good enough"
- **Experimentation**: try different model/temperature/prompt combinations quickly

Keep using large hosted models for:

- **Production workloads** where response quality directly impacts users
- **Complex reasoning tasks** that require deep understanding
- **Tasks where accuracy is critical** (medical, legal, financial)

The key insight is that these aren't mutually exclusive. Use SLMs during development and testing, then switch to larger models in production. Same code, different model endpoint.

## What's Next

Knowing that SLMs exist and how to run them is just the beginning. The real question is: **how do you know which model, at which quantization, with which parameters, is the best choice for your specific use case?**

MMLU benchmarks and third-party leaderboards give you a starting point, but they don't test *your* prompts with *your* tasks at *your* temperature settings. In Part 2, I'll show you how to answer that question systematically with Go's built-in benchmark tooling. The full code is [open source on GitHub](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks).

---

_This post is based on my talk "[Choosing the Smallest LLM That Won't Completely Fail You](/slides/2026-02-containerdays-london/ContainerDays-London-Choosing-the-smallest-LLM.pdf)" at ContainerDays London 2026._

_Part of a 4-post series:_
- _Part 1: SLMs and Docker Model Runner (this post)_
- _[Part 2: Benchmarking with Go](/posts/2026-03-04-choosing-the-smallest-llm-part-2-benchmarking-with-go)_
- _[Part 3: Evaluator Agent and Tool Calling](/posts/2026-03-06-choosing-the-smallest-llm-part-3-evaluator-agent-and-tool-calling)_
- _Part 4: Observability with OpenTelemetry and Grafana (coming soon)_

_Related posts:_
- _[Coding with AI Agents: Like Driving a Tesla on Autopilot](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot)_

_Resources:_
- _[Docker Model Runner documentation](https://docs.docker.com/ai/model-runner/)_
- _[Docker Hub AI Models](https://hub.docker.com/u/ai)_
- _[Hugging Face Model Hub](https://huggingface.co/models)_
