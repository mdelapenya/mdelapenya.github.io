---
title: "Choosing the Smallest LLM That Won't Completely Fail You (Part III): Evaluator Agent and Tool Calling"
date: 2026-03-06 09:00:00 +0100
description: "Benchmarking 160 scenarios by hand is not an option. Here's how I used an LLM-as-judge pattern to automate quality scoring and added tool calling benchmarks to find out which SLMs can actually use external tools."
categories: [Technology, AI, Go]
tags: ["small-language-models", "evaluator-agent", "tool-calling", "llm-as-judge", "go", "docker-model-runner", "testcontainers"]
type: post
weight: 30
showTableOfContents: true
image: "/images/posts/2026-03-06-slms-evaluator-agent-tool-calling/cover.png"
---

![Evaluator Agent and Tool Calling](/images/posts/2026-03-06-slms-evaluator-agent-tool-calling/cover.png)

In [Part 1](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner) we covered what SLMs are and how to run them locally with Docker Model Runner. In [Part 2](/posts/2026-03-04-choosing-the-smallest-llm-part-2-benchmarking-with-go) we built a benchmarking framework with Go that runs 160 scenarios and reports latency, throughput, and success rates.

But there's a gap. Latency and token counts tell you *how fast* a model responds. They don't tell you *how good* the response is. If a model answers in 200ms but the answer is wrong, that speed is worthless.

This third post covers two things: the Evaluator Agent that automatically scores response quality, and tool calling benchmarks that test whether SLMs can decompose problems into external tool invocations.

## The Problem with Manual Evaluation

Imagine you've run all 160 benchmark scenarios. You now have 160 responses (or 800 if you ran 5 iterations each). Evaluating those by hand is not realistic. You'd need to read every response, compare it against a reference, and assign a quality score.

People have tried simpler approaches: string matching, keyword detection, regex patterns. These work for narrow cases like math (where the answer is a specific number), but they completely break down for open-ended tasks like code explanation or creative writing. "Explain this Go function" can have dozens of valid, high-quality answers that share no common keywords.

What you really need is a judge that understands natural language and can evaluate whether a response is good, regardless of how it's phrased.

## LLM-as-Judge: The Evaluator Agent Pattern

The solution is to use a *different*, more capable model to evaluate the responses of the models under test. This is the **LLM-as-judge** pattern, sometimes called an Evaluator Agent.

The idea is straightforward. You have:

1. **The model under test** (e.g., Llama 3.2 1B) that generates a response to a prompt
2. **The evaluator model** (e.g., GPT-4o-mini) that reads the original prompt, the response, and a set of evaluation criteria, then outputs a quality score

The evaluator never sees the benchmark infrastructure. It receives a structured evaluation request and returns a score between 0 and 10 along with a brief explanation.

Why use a separate model instead of evaluating with the same model? Because you need the evaluator to be significantly more capable than the models being tested. Using Llama 3.2 1B to evaluate Llama 3.2 1B would be like asking a student to grade their own exam. The evaluator needs to understand nuance, catch subtle errors, and recognize when a creative answer is still valid even if it differs from the reference.

## Choosing the Right Evaluator Model

The benchmark framework supports two evaluator configurations:

- **GPT-4o-mini** (recommended): If you set the `OPENAI_API_KEY` environment variable, the evaluator uses GPT-4o-mini via the OpenAI API. This is a small, fast, and inexpensive hosted model, but it's significantly more capable than the SLMs under test. It costs fractions of a cent per evaluation, and for 160 scenarios you're looking at pennies.
- **Local fallback**: If no API key is set, the evaluator falls back to using one of the local models. This gives you a fully offline experience, but the evaluation quality is lower. You're essentially asking a small model to judge other small models, which introduces noise.

My recommendation: use the OpenAI evaluator. The cost is negligible and the evaluation quality is dramatically better. Think of it as paying for a professional code reviewer instead of asking an intern to review another intern's work.

## Task-Specific Evaluation Criteria

Not all tasks should be evaluated the same way. A math problem has one correct answer; a creative writing prompt has many valid responses. The evaluator needs different criteria for each task type.

The benchmark framework uses Go's `embed` package to load evaluation criteria from text files at compile time:

```go
//go:embed evaluator/system_prompt.txt
var systemPrompt string

//go:embed evaluator/reference.txt
var referenceText string
```

The `system_prompt.txt` file tells the evaluator how to behave: evaluate responses on a 0-10 scale, considering accuracy, completeness, and relevance. The `reference.txt` file provides expected answers or patterns for each task type.

Each evaluation request includes three components:

1. **The system prompt**: general instructions on how to evaluate (scoring rubric, output format)
2. **The task description**: what the model was asked to do
3. **The reference answer**: what a good response should look like

The evaluator then compares the model's actual response against the reference and returns a structured score. For the math task "compute the sum of 1 to 100," the reference is simply "5050" and the evaluator checks whether the model arrived at the correct answer. For "explain this Go function," the reference contains key concepts that should appear in any good explanation, and the evaluator checks for those concepts while allowing for different phrasings.

This approach strikes a balance: you get automated evaluation that scales to hundreds of scenarios, with task-specific criteria that produce meaningful scores.

## Inside the Evaluator

The evaluator itself is a Go struct that wraps an OpenAI-compatible client. Here's the core evaluation flow:

```go
func (e *Agent) Evaluate(ctx context.Context, question, answer, reference string) (*EvaluationResult, error) {
    resp, err := e.chatModel.GenerateContent(ctx, msgContent,
        llms.WithTemperature(0.0),  // deterministic scoring
        llms.WithTopK(1),
        llms.WithSeed(42),
    )
    // parse structured JSON from response...
}
```

Temperature 0.0 and a fixed seed keep scores reproducible. If the evaluator itself were creative, your evaluation metrics would be noisy. The evaluator also uses its own client, which can point to a different endpoint (OpenAI API) than the models under test (Docker Model Runner).

The benchmark framework then rolls these scores into two reported metrics:

- **eval_score**: The average quality score across all iterations (0.0 to 10.0)
- **eval_pass_rate**: The percentage of responses that scored above a passing threshold (0.0 to 1.0)

These metrics appear in the Go benchmark output alongside latency and throughput, giving you a single line that tells you both "how fast" and "how good" for each scenario.

## Tool Calling Benchmarks

Standard prompt-response benchmarks test whether a model can generate good text. But modern LLM applications increasingly rely on **tool calling** (also known as function calling): the model's ability to recognize when it needs an external tool, select the right one, and provide correct parameters.

This is fundamentally different from text generation. The model isn't just producing words; it's making decisions about *which actions to take* and *how to parameterize them*.

### The three tools

The benchmark defines three tools that the model can call:

1. **Calculator**: Performs arithmetic operations. The model provides an expression (e.g., `125 * 47`) and gets back a numeric result.
2. **Python code executor**: Runs Python code and returns the output. The model generates a Python snippet, sends it for execution, and receives stdout/stderr.
3. **HTTP client**: Makes HTTP requests to external APIs. The model provides a URL and gets back the response body.

Each tool tests a different integration pattern: pure computation, sandboxed code execution, and external API access.

### The tool calling prompts

The three tool-assisted tasks from [Part 2](/posts/2026-03-04-choosing-the-smallest-llm-part-2-benchmarking-with-go) (calculator reasoning, code validation, API data retrieval) each exercise a different tool. What matters here isn't just whether the model gets the right answer, but *how* it gets there: does it call the right tool, with the right parameters, in the right order?

### Measuring tool calling quality

For tool calling tasks, the evaluator measures additional dimensions beyond just the final answer:

- **Tool selection accuracy**: Did the model choose the right tool for the task? If asked to do math, did it call the calculator instead of trying to compute in its head?
- **Parameter accuracy**: Did the model provide correct parameters? For the calculator, did it send `125 * 47` as an expression, or did it send something malformed?
- **Convergence**: Did the model arrive at the correct final answer after using the tools? A model might call the right tool with the right parameters but then misinterpret the result.

These are critical distinctions. A model that tries to do mental arithmetic instead of calling the calculator is exhibiting a tool selection failure. A model that calls the calculator but passes `125 x 47` (letter x instead of asterisk) is exhibiting a parameter failure. Both produce wrong answers, but for different reasons.

### The compatibility problem

Here's something that surprised me during benchmarking: **not all SLMs support tool calling**. Function calling requires specific training, and many smaller models simply weren't trained on it. When you send a tool-calling request to a model that doesn't support it, you get one of several failure modes:

- The model ignores the tool definitions entirely and just answers the question directly
- The model hallucinates a tool call in a format that doesn't match the schema
- The model returns an error or empty response

In the benchmark framework, when a model doesn't support tool calling, those tasks are simply marked as failures with a zero eval_score. This is actually valuable data: it tells you which models in your candidate set can even be considered for agentic workflows.

Among the SLMs I tested, Llama 3.2 3B and Qwen3 0.6B handled basic tool calling reasonably well. The 1B models struggled significantly. This aligns with [external benchmarks](https://github.com/MikeVeerman/tool-calling-benchmark) where Qwen3 0.6B actually ties for first place among small models for tool calling, with perfect restraint (never calling a tool when it shouldn't). Tool calling at this scale is real, but model size alone doesn't determine success: Qwen3 0.6B outperforms models twice its size.

## What's Next

The LLM-as-judge pattern gives you automated quality scoring that scales to hundreds of scenarios, and the tool calling benchmarks revealed a clear capability gap: only the larger SLMs could reliably decompose problems into external tool calls. The benchmark now measures both speed (Part 2) and quality (this post). But 160 scenarios, each with 5+ metrics, produces a lot of data. Scrolling through console output to compare models doesn't scale.

How do you spot that Llama 3.2 3B scores well on code tasks but drops off on creative writing at high temperatures? How do you drill from a low eval_score into the actual response that failed? In Part 4, I'll wire everything into Grafana with OpenTelemetry so you can explore the results through dashboards instead of terminal output.

---

_This post is based on my talk "[Choosing the Smallest LLM That Won't Completely Fail You](/slides/2026-02-containerdays-london/ContainerDays-London-Choosing-the-smallest-LLM.pdf)" at ContainerDays London 2026._

_Part of a 4-post series:_
- _[Part 1: SLMs and Docker Model Runner](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner)_
- _[Part 2: Benchmarking with Go](/posts/2026-03-04-choosing-the-smallest-llm-part-2-benchmarking-with-go)_
- _Part 3: Evaluator Agent and Tool Calling (this post)_
- _Part 4: Observability with OpenTelemetry and Grafana (coming soon)_

_Resources:_
- _[Benchmark source code](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks)_
- _[LLM-as-Judge pattern (Hugging Face)](https://huggingface.co/learn/cookbook/en/llm_judge)_
- _[OpenAI Function Calling documentation](https://platform.openai.com/docs/guides/function-calling)_
- _[Testcontainers for Go](https://golang.testcontainers.org/)_
