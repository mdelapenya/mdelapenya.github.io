---
title: "Code Is a Cache"
date: 2026-08-05 09:00:00 +0200
description: "When generating code is cheap, code stops being the artifact you curate and becomes a cache of your understanding: valuable while fresh, disposable when stale. The durable source is intent, spec, and tests."
categories: [Technology, AI, Software Development]
tags: ["ai", "coding-agents", "developer-experience", "software-development", "intent"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-08-05-code-is-a-cache/cover.png"
related:
  - "/posts/2026-03-18-the-six-levels-of-ai-assisted-development"
  - "/posts/2026-03-25-skills-are-roles-not-commands"
  - "/posts/2026-04-01-quality-assurance-vs-quality-assistance"
---

![Code Is a Cache](/images/posts/2026-08-05-code-is-a-cache/cover.png)

Every time we change a file in a repository, we are changing the worldview of every agent working in that repo.

That sentence sounds abstract until you sit with it. A file is not just code the machine runs. It is context the agents read to understand what the project is, what it values, how it behaves. When an agent opens your codebase, the files are what it knows. Change a file and you change what it knows. The repository is not a pile of instructions anymore. It is a shared understanding that both people and agents operate from.

That reframes what source code actually is. For most of my career, code was instructions for a machine, and the machine was the only reader that mattered. Now the code is also the shared understanding that a growing number of agents work from. And once you see it that way, code starts to look less like the thing you are building and more like a projection of something upstream. It is increasingly an implementation detail. I had been circling that idea for a while without a clean word for it, and then I read Charity Majors' [AI Demands More Engineering Discipline](https://charity.wtf/p/ai-demands-more-engineering-discipline), which gave me the sharper one: code is a cache.

## The economics flipped

For decades, code was expensive to produce. Every line cost human time, so the whole craft optimized for curation. We made careful edits. We kept diffs small. We treated the source as precious and we did not rewrite what already worked. All of that was rational, because typing the code was the bottleneck. When the expensive step is producing the artifact, you protect the artifact.

That bottleneck is gone. Generating code is now cheap and fast. And when the cost of producing something drops to near zero, the habits built around its scarcity stop making sense. Optimizing for careful in-place editing, when regenerating the whole thing is almost free, is optimizing the wrong step. The economics that made code precious flipped, and the practices that assumed those economics have not caught up yet.

## Code is a cache

Here is the metaphor, stated precisely. A cache is a materialized view of a more authoritative source. It is fast to read, cheap to rebuild, and wrong the moment the source moves without it. Nobody treats a cache as the truth. The truth lives somewhere else, and the cache is just a convenient, disposable projection of it.

Code is exactly that kind of view, materialized over your understanding: the intent, the spec, the behavioral contract you hold about what the system should do. Charity puts it as code being "a materialized view of understanding that is useful while current, disposable when stale." The value of a cache is never the bytes it holds. Its value is that it agrees with its source. A cache that has drifted from the truth is not an asset. It is a liability that happens to still compile.

## Editing the cache by hand

This is where the opening sentence pays off. When you hand-edit generated code, you are writing to the cache without updating the source. You are changing the worldview the agents and the people read from, without changing the authoritative record that worldview is supposed to derive from.

The artifact now says something the intent does not. And every manual edit widens that gap. The code drifts one way, the understanding stays where it was, and nothing reconciles them. Do this enough times and the repository stops being a faithful projection of anything. It becomes a pile of local patches whose reasoning lives only in the heads of whoever made them, until they forget too. Charity's phrasing for this is blunt and correct: "mutability is the sworn enemy of understanding." Every in-place mutation is a small bet that you will never need to regenerate from the source again. That bet keeps losing.

## So what is the source?

If code is the cache, the obvious question is what the source actually is. It is the intent, the specs, the tests, the task notes, the behavioral contract. Those are the artifacts that hold the truth the code is only a projection of.

And those are what you now curate by hand. That is where the care goes: written carefully, reviewed closely, kept small and clean, treated as precious. The discipline did not disappear when code got cheap. It moved up a layer, from the artifact to the thing the artifact derives from. A test suite that pins down behavior is more durable than the implementation that happens to satisfy it today, because the implementation can be regenerated from the behavior but the behavior cannot be recovered from a stale implementation. The source is what survives a rewrite. Everything downstream of it is, in the end, a cache.

## The culmination: the technology is a detail too

Follow this to its edge and you reach the strongest form of the idea. If the code is a cache of the spec, then so is the technology the code is written in. The language, the framework, the library: all of them are choices about *how* to realize the behavior, not the behavior itself.

Which means the fullest expression of "code is an implementation detail" is a prompt that does not name the stack at all. You describe what the system must do, and you leave the agent free to choose the language, the framework, and the libraries that best fit the job. At that point you are not specifying the realization anymore. You are only specifying the behavior, and letting the realization be derived.

But this is entirely load-bearing on the spec. Letting the agent pick the stack only works when the spec is good enough that the stack genuinely does not change the outcome. And I think a weak spec is exactly why teams over-specify the technology in the first place: pinning the language and the framework is a way of compensating for the intent they never wrote down. The tech stack becomes a proxy for a contract that does not exist. So this does not lower the bar. It raises it. The less you constrain the code, the better your understanding of the behavior has to be. More freedom downstream demands more discipline upstream, which is Charity's whole argument in one line: AI asks for more engineering discipline, not less.

## The limit: when code is the source

The metaphor is a lens, not a law, and it helps to name where it stops. Some code is not a cache of anything more authoritative than itself. A genuinely novel algorithm. An irreducible design decision. The one careful line where the code *is* the clearest statement of the intent, and no spec would capture it better than the code already does.

That code stays precious, and you edit it the way you would have in 2015: by hand, with attention, because there is no upstream source to regenerate it from. The point of the cache metaphor is not that all code is disposable. It is that most code is downstream of something, and the mistake is treating the downstream projection as if it were the source. Knowing which of your code is truly the source, and which is just a view of it, is most of the skill.

## The thread I keep pulling

And once you start pulling this thread, it does not obviously stop at code. If a good enough spec is the source of truth, why hand-write and version the tests at all, instead of having the agent regenerate them from the spec on demand? I do not have a clean answer yet (there are real reasons to want a check the generator did not write itself), and I think it deserves its own post. But the question refuses to go away, and that is usually a sign it is worth taking seriously.

## Closing

So come back to the file. If changing it changes what every agent in the repo knows, then the next time you reach in to tweak a generated function by hand, the honest question is: are you fixing the source, or just editing the cache? One of those survives the next regeneration. The other gets overwritten and takes its reasoning with it.

We protected code for decades because rebuilding it was expensive. It is not expensive anymore. So protect the spec like you used to protect the code, and let the code be cheap. The thing worth guarding was never in the files. It was the understanding they were only ever a copy of.

---

## Resources

- *[AI Demands More Engineering Discipline, Not Less (Charity Majors)](https://charity.wtf/p/ai-demands-more-engineering-discipline)*
