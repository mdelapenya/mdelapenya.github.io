---
title: "Subscriptions: From Idea to Testcontainers Module"
date: 2026-03-16 09:00:00 +0100
description: "I needed subscribers, built a Cloudflare Worker to handle them, and ended up creating a Testcontainers module for Resend. Here's the full story: the why, the how, and the testing."
categories: [Technology, Software Development]
tags: ["testcontainers", "testing", "go", "resend", "cloudflare-workers", "blogging"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module/cover.png"
related:
  - "/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day"
  - "/posts/2025-05-27-gofiber-services-testcontainers"
---

![Subscriptions: From Idea to Testcontainers Module](/images/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module/cover.png)

I went from one post a month to publishing every other day. The [friction post](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day) explains how. The writing problem was solved. But a new problem appeared. I had no idea if anyone was reading.

This post is the full arc: why I added subscriptions, how I built them on a static site with no backend, and how the testing journey led me to create an open-source Testcontainers module for Resend.

## Act I: The Why

### The Void

No comments section. No analytics. No way to tell the difference between a post that helped someone and one that disappeared into the timeline. RSS exists, and I love that it exists, but it is invisible to the writer. You publish into the feed and the feed says nothing back.

I could have added analytics. A few lines of JavaScript, a dashboard to check every morning. But analytics measure pageviews, not readers. A bot crawling the site counts the same as a person who read every word. And analytics come with baggage: cookie banners, GDPR compliance, the temptation to optimize for clicks instead of clarity.

I did not want metrics. I wanted a signal. A simple, honest signal that someone cared enough to say "tell me when you write something new."

That signal is a subscription.

### Transparency, Not Tricks

Every newsletter signup I have seen on the internet follows the same pattern. "Join 10,000 others!" as if subscriber count is social proof you should trust. Exit-intent popups that ambush you when your mouse drifts toward the close button. Open tracking pixels that tell the sender whether you read the email, when you read it, and on what device. Click tracking on every link so the sender knows exactly what caught your eye. Every newsletter CTA feels like the top of a funnel. Subscribe here, get nurtured, get pitched.

I wanted the opposite. No popups. No gates. No tracking. No pitch. Just a way for a reader to say "I want to know when you publish" and for me to say "OK, I will tell you."

So I made every decision visible. The subscriber count is public. Right there on the page. Not hidden, not inflated, not rounded up to the nearest thousand. The real number.

The privacy commitment is not a link in the footer. It is the [subscribe page](/subscribe/) itself. What you get, what I do with your email, where your data lives, how to unsubscribe, who I am. All of it, in plain sentences, before you type a single character into the email field.

No open tracking. Resend offers it. I do not use it. I do not know if you opened the email. I do not know if you clicked the link. I know that I sent it and that you subscribed. That is enough.

### Why Resend

I chose [Resend](https://resend.com) for three reasons. The API is clean, the documentation is good, and it handles the hard parts of email delivery (SPF, DKIM, bounce handling) without requiring me to become an email infrastructure expert. It handles unsubscribe flows automatically: every email gets an unsubscribe link, one click and you are out, no guilt trips. And its founder [Zeno Rocha](https://zenorocha.com/) is a friend. I [translated his book to Spanish](https://www.goodreads.com/book/show/57215070-14-h-bitos-de-desarrolladores-altamente-productivos). When you are trusting someone with your readers' email addresses, the personal connection matters.

## Act II: The Build

### The Cloudflare Worker

Hugo generates static HTML. There is no server, no database, no runtime. When a reader fills in their email and clicks Subscribe, that form needs to call something.

Cloudflare Workers fit the constraint. They run at the edge, they cost nothing at this traffic level, and they deploy from the same GitHub Actions workflow that deploys the blog. The Worker sits behind a route pattern on my domain (`mdelapenya.xyz/api/*`), so the subscribe form calls the same origin. No CORS gymnastics from the browser's perspective.

The Worker exposes two endpoints. **POST `/api/subscribe`** validates the email, rate-limits by IP, and creates a contact in Resend. **GET `/api/subscribe/count`** returns the number of active subscribers, cached in KV.

Rate limiting uses Cloudflare KV. The key is `rate:{ip}`, the value is a counter, and the TTL is one hour. If the counter reaches 10, the Worker returns a 429:

```javascript
const ip = request.headers.get("CF-Connecting-IP") || "unknown";
const rateKey = `rate:${ip}`;
const rateCount = parseInt((await env.CACHE.get(rateKey)) || "0");
if (rateCount >= 10) {
  return jsonResponse({ error: "Too many requests. Try again later." }, 429, matchedOrigin);
}
await env.CACHE.put(rateKey, String(rateCount + 1), { expirationTtl: 3600 });
```

The count endpoint fetches all contacts from Resend, filters out unsubscribed ones, and caches the result in KV for one hour. When a new subscriber signs up, the cached count is invalidated so the next request gets a fresh number.

Both rate limiting and caching are guarded by `if (env.CACHE)`. If KV is not available, the Worker still works. Rate limiting is skipped. Caching is skipped. The core flow of validating the email and creating the contact in Resend still runs. Graceful degradation.

### The Frontend and Dev Mode

The frontend is a single IIFE in vanilla JavaScript. No framework, no build step, no dependencies. The state machine has four states: **form** (default), **success** ("You're in. Welcome."), **already subscribed** (via `localStorage`), and **error**. Each state is a `div` in the HTML. The JS shows one and hides the others.

When you run `hugo server` locally, the hostname is `localhost`. The JS detects this:

```javascript
var IS_LOCAL = window.location.hostname === "localhost"
  || window.location.hostname === "127.0.0.1";
var DEV_MODE = IS_LOCAL && !window.SUBSCRIBE_API_BASE;
```

In dev mode, no fetch calls happen. The count display shows "Join 42 other subscribers. (dev mode)". Clicking Subscribe logs the email to the console and shows the success state. This prevents accidentally subscribing real emails, and it means you can develop the subscribe feature with no API keys, no Worker running, and no internet connection.

The escape hatch is `window.SUBSCRIBE_API_BASE`. If you set this global before the script loads, dev mode is bypassed and the JS calls whatever URL you provide. The tests use this to point at the Microcks mock.

### Testing the Subscribe Form

The subscribe API is defined as an OpenAPI spec. [Microcks](https://microcks.io/) reads this spec and serves a mock API that returns the example responses. In the tests, Microcks runs as a container started by [Testcontainers](https://testcontainers.com/):

```typescript
const microcksContainer = await new MicrocksContainer()
  .withMainArtifacts([artifactPath])
  .start();

const mockBase = microcksContainer
  .getRestMockEndpoint("Blog Subscribe API", "1.0.0")
  .replace(/\/$/, "");
```

The test suite spins up a local HTTP server that serves a test fixture page with `window.SUBSCRIBE_API_BASE` set to the Microcks mock URL. Because that variable is set, dev mode is bypassed, and the JS makes real HTTP calls, but to Microcks instead of Resend.

The Playwright tests cover five scenarios: count display, default form state, submitting a valid email, the already-subscribed state via `localStorage`, and button re-enabling after submission. No real API calls. No Resend account needed. The same tests run locally and in CI.

## Act III: Testing the Broadcast

### The Broadcast Tool

Once I had subscribers, I needed a way to notify them about new posts. The broadcast tool is a Go CLI that runs on a Sunday cron in GitHub Actions. It fetches the Hugo `index.json` from the live site, filters for posts published in the past week, renders an email template with the post titles and links, and sends the digest via Resend's broadcasts API. If there are no new posts that week, no email goes out.

The flow is straightforward: fetch the index, filter by date, build the HTML, create a broadcast draft in Resend, and send it. Four API calls. One cron job. No server to maintain.

### Why Not Just Mock It?

The obvious testing approach is to write a hand-rolled mock for the Resend API. Stub the endpoints, return canned JSON, assert the right calls were made. It works until it does not.

Hand-rolled mocks drift from the real API. If Resend adds a required field to the broadcast creation payload, your mock does not know about it. If they change a response shape, your mock keeps returning the old one. Your tests pass. Production breaks. You find out on Sunday evening when the cron job fails and your subscribers get nothing.

Contract testing against the real OpenAPI spec catches this. The mock is generated from the same spec that Resend uses to document their API. When Resend updates the spec, your mock updates too. The contract is the source of truth, not your test fixtures.

### Building testcontainers-go-resend

I built [testcontainers-go-resend](https://github.com/mdelapenya/testcontainers-go-resend/) as a Testcontainers for Go module that wraps Microcks with the official Resend OpenAPI spec. The idea is simple: start a container that speaks the Resend API without needing an API key, without rate limits, and without cost.

The module downloads the latest [Resend OpenAPI spec](https://github.com/resend/resend-openapi) from GitHub, enriches it with Microcks-compatible response examples, and loads it into a Microcks container. If the download fails, it falls back to an embedded copy of the spec so tests never break because of a network issue.

Starting the mock is two lines:

```go
ctr, err := resend.Run(ctx, resend.DefaultImage)
```

Getting the base URL for your HTTP client is one more:

```go
baseURL, err := ctr.BaseURL(ctx)
```

That URL is a fully functional Resend API mock. You can create contacts, send emails, manage broadcasts, work with templates. Every endpoint in the Resend spec gets a mock. The enrichment layer in the module walks all paths and operations in the OpenAPI spec and injects named examples into parameters and response bodies so Microcks can create proper request/response pairs.

### The Integration Tests

The test suite starts one Microcks container and runs all subtests against it. Here is the structure for the broadcasts API, which is the part the broadcast tool actually uses:

```go
ctr, err := resend.Run(ctx, resend.DefaultImage)
testcontainers.CleanupContainer(t, ctr)
baseURL, err := ctr.BaseURL(ctx)

t.Run("create broadcast", func(t *testing.T) {
    body := `{"name":"Weekly Digest","from":"hello@mdelapenya.xyz","subject":"New posts"}`
    result := doJSONRequest(t, http.MethodPost, baseURL+"/broadcasts", body, http.StatusCreated)
    require.Contains(t, result, "id")
})

t.Run("send broadcast", func(t *testing.T) {
    result := doJSONRequest(t, http.MethodPost, baseURL+"/broadcasts/"+id+"/send", "", http.StatusOK)
    require.NotNil(t, result)
})
```

One container. All subtests. No API key needed. No rate limits. No cost. The tests run in CI on every push to the repository.

The module does not just cover broadcasts. It covers the full Resend API surface: emails, contacts, domains, API keys, templates, audiences, webhooks, segments, topics, and contact properties. If you use any part of the Resend API, the mock handles it.

### The Recipe

The pattern generalizes to any API that publishes an OpenAPI spec. The steps are always the same:

1. Find the OpenAPI spec. Most modern APIs publish one. Resend publishes theirs at [github.com/resend/resend-openapi](https://github.com/resend/resend-openapi).
2. Enrich the spec with Microcks-compatible examples if it does not already have them. This is the part that takes the most work. You need named examples on parameters and response bodies so Microcks can create mock pairs.
3. Wrap it in a Testcontainers module. The module downloads (or embeds) the spec, starts Microcks, and exposes a `BaseURL` method that gives you the mock endpoint.
4. Write your integration tests against the mock. They run locally, they run in CI, they need no credentials, and they stay in sync with the real API because the spec is the source of truth.

This works for Stripe, SendGrid, Twilio, or any other service with a public OpenAPI spec. The module is the bridge between the spec and your test suite. Once it exists, testing against that API becomes as simple as starting a container.

---

_Resources:_
- _[Subscriber commitment page](/subscribe/)_
- _[Resend](https://resend.com)_
- _[testcontainers-go-resend on GitHub](https://github.com/mdelapenya/testcontainers-go-resend/)_
- _[Resend OpenAPI spec](https://github.com/resend/resend-openapi)_
- _[Microcks](https://microcks.io/)_
- _[Testcontainers for Go](https://golang.testcontainers.org/)_
- _[Cloudflare Workers docs](https://developers.cloudflare.com/workers/)_
