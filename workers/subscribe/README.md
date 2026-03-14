# Blog Subscribe Worker

Cloudflare Worker that handles email subscriptions for [mdelapenya.xyz](https://mdelapenya.xyz) via the [Resend](https://resend.com) API, protected by [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/).

## What it does

Two endpoints, both behind CORS:

- **POST `/api/subscribe`** -- Verifies the Turnstile CAPTCHA token, validates and length-checks the email, sanitizes the source page path, rate-limits by IP (10/hour) and globally (100/hour), then creates a contact in Resend with the source page as a custom property. Invalidates the cached subscriber count on success.
- **GET `/api/subscribe/count`** -- Returns the number of active (non-unsubscribed) contacts. Cached in KV for 5 minutes to avoid hitting the Resend API on every page load.

## Architecture

```
Browser (subscribe.js)
  |
  |-- [Turnstile widget generates token]
  |
  |-- POST /api/subscribe   --> Cloudflare Worker --> Turnstile verify --> Rate limit (KV) --> Resend API
  |-- GET  /api/subscribe/count --> Cloudflare Worker --> KV cache / Resend API
```

The frontend JS (`static/js/subscribe.js`) calls the Worker. In production, requests go through the route `mdelapenya.xyz/api/*`. In local dev, the JS has a dev mode that logs to console instead of making API calls.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- A [Cloudflare](https://cloudflare.com) account with the `mdelapenya.xyz` zone
- A [Resend](https://resend.com) account and API key
- A [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) site key and secret key

### Install dependencies

```bash
cd workers/subscribe
npm install
```

### Create the KV namespace

```bash
npx wrangler kv namespace create CACHE
```

The namespace ID is already configured in `wrangler.jsonc`. If you need to recreate it, update the `id` field in the `kv_namespaces` array.

### Create a Turnstile widget

1. Go to the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Create a widget for `mdelapenya.xyz`
3. Copy the **site key** into `hugo.toml` under `params.turnstileSiteKey`
4. Set the **secret key** as a Worker secret:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

### Set the Resend API key

```bash
npx wrangler secret put RESEND_API_KEY
```

Paste your Resend API key when prompted. This is stored securely by Cloudflare and never committed to the repo.

### Deploy

```bash
npx wrangler deploy
```

Or push to `main` -- the GitHub Actions workflow (`deploy-worker` job) deploys automatically. It requires the `CLOUDFLARE_API_TOKEN` repository secret.

## Local development

```bash
npx wrangler dev
```

Create a `.dev.vars` file (gitignored) for local secrets:

```
RESEND_API_KEY=re_your_key_here
DEV_ORIGINS=http://localhost:1313
```

`DEV_ORIGINS` adds localhost to the CORS allow list so the Hugo dev server can reach the Worker.

Note: `TURNSTILE_SECRET_KEY` is intentionally omitted from `.dev.vars`. When not set, the Worker skips Turnstile verification, so local development works without CAPTCHA.

The frontend JS (`static/js/subscribe.js`) has a built-in dev mode. When running on `localhost` without a `SUBSCRIBE_API_BASE` override, it skips all API calls and logs to the console instead. To test the actual Worker locally, run `wrangler dev` and set `window.SUBSCRIBE_API_BASE = "http://localhost:8787/api/subscribe"` in the browser console.

## Configuration

All configuration is in `wrangler.jsonc`:

| Setting | Description |
|---|---|
| `vars.ALLOWED_ORIGIN` | Production origin for CORS (`https://mdelapenya.xyz`) |
| `kv_namespaces[0].id` | KV namespace ID for caching (rate limits + subscriber count) |
| `routes[0].pattern` | Route pattern that maps `mdelapenya.xyz/api/*` to this Worker |

Hugo configuration in `hugo.toml`:

| Setting | Description |
|---|---|
| `params.turnstileSiteKey` | Cloudflare Turnstile site key (public, safe to commit) |

Secrets (set via `wrangler secret put`, not in the file):

| Secret | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for creating contacts and fetching the contact list |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key for verifying CAPTCHA tokens |

## API reference

### POST /api/subscribe

Subscribe an email address.

**Request:**
```json
{
  "email": "reader@example.com",
  "source": "/posts/2026-03-23-why-i-added-subscriptions",
  "token": "turnstile-token-from-widget"
}
```

| Field | Required | Description |
|---|---|---|
| `email` | Yes | Email address (max 254 characters) |
| `source` | No | Page path where the form was submitted (max 200 characters, URL path pattern only) |
| `token` | Yes* | Turnstile verification token (*skipped when `TURNSTILE_SECRET_KEY` is not set) |

**Responses:**

| Status | Body | Condition |
|---|---|---|
| 200 | `{ "ok": true }` | Success |
| 400 | `{ "error": "Email is required" }` | Missing or empty email |
| 400 | `{ "error": "Invalid email format" }` | Fails regex or exceeds 254 chars |
| 400 | `{ "error": "Verification required" }` | Missing Turnstile token |
| 403 | `{ "error": "Forbidden" }` | Unknown origin |
| 403 | `{ "error": "Verification failed" }` | Invalid Turnstile token |
| 413 | `{ "error": "Request too large" }` | Body exceeds 1KB |
| 429 | `{ "error": "Too many requests. Try again later." }` | Rate limit exceeded |
| 502 | `{ "error": "Failed to subscribe. Please try again." }` | Resend API error |

### GET /api/subscribe/count

Get the active subscriber count.

**Response:**
```json
{ "count": 42 }
```

Returns `{ "count": 0 }` if the Resend API is unreachable or returns unexpected data.

### OPTIONS (any path)

CORS preflight. Returns `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers`.

## Security

### Turnstile CAPTCHA

Every subscribe request requires a valid [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) token, verified server-side against the Turnstile API. This prevents automated subscription bombing, bot submissions, and API abuse. The widget is embedded in the subscribe form HTML and uses compact mode with auto theme detection.

When `TURNSTILE_SECRET_KEY` is not set (local dev, tests), Turnstile verification is skipped.

### Rate limiting

Two layers of rate limiting via KV:

- **Per-IP**: max 10 subscribe requests per IP per hour
- **Global**: max 100 subscribe requests per hour across all IPs

Rate counters expire automatically (KV TTL: 3600s).

### Input validation

- **Email**: max 254 characters (RFC 5321), regex validated
- **Source**: max 200 characters, restricted to URL path pattern (`/[a-zA-Z0-9\-\/_.]`), sanitized server-side regardless of client input
- **Request body**: max 1KB, rejected before JSON parsing

### Response headers

All responses include:
- `X-Content-Type-Options: nosniff` -- prevents MIME-sniffing
- `Cache-Control: no-store` -- prevents caching of API responses
- CORS headers restricted to `ALLOWED_ORIGIN`

### Source tracking

The `source` field records which page the subscriber was on when they subscribed. It is stored as a Resend contact custom property. The field is sanitized to only allow URL path characters, preventing injection of arbitrary data.

## Caching

Subscriber count is cached in KV for 5 minutes (`CACHE_TTL = 300`). On a successful subscribe, the cached count is invalidated so the next count request fetches fresh data from Resend.

## Frontend integration

The subscribe form is rendered by `layouts/partials/subscribe.html` and powered by `static/js/subscribe.js`. The form appears at the bottom of every blog post and on the `/subscribe/` page.

The Turnstile widget is loaded via `https://challenges.cloudflare.com/turnstile/v0/api.js` (added in `hugo.toml` custom head). The site key is configured in `hugo.toml` under `params.turnstileSiteKey`.

The JS detects the environment:
- **Production** (`mdelapenya.xyz`): calls the Worker API with Turnstile token
- **Local dev** (`localhost`): logs to console, shows fake count of 42, simulates success on submit
- **Tests**: `SUBSCRIBE_API_BASE` override points to a Microcks mock, bypassing dev mode

## Tests

E2E tests live in `tests/subscribe/` and use Playwright + [Microcks](https://microcks.io/) (via Testcontainers) to mock the API:

```bash
cd tests
npx playwright test subscribe/
```

The Microcks mock is defined in `tests/subscribe/subscribe-api.yaml` (OpenAPI spec).

Tests cover:
- Subscriber count display from API
- Default form state visibility
- Successful subscription flow (email + localStorage)
- Already-subscribed state on revisit
- Source page path included in POST body
- Button re-enables after submission

Tests run without Turnstile (the mock doesn't require it, and the Worker skips verification when the secret is not set).
