# Blog Subscribe Worker

Cloudflare Worker that handles email subscriptions for [mdelapenya.xyz](https://mdelapenya.xyz) via the [Resend](https://resend.com) API.

## What it does

Two endpoints, both behind CORS:

- **POST `/api/subscribe`** -- Creates a contact in Resend. Validates email format, rate-limits by IP (max 10/hour via KV), and invalidates the cached subscriber count on success.
- **GET `/api/subscribe/count`** -- Returns the number of active (non-unsubscribed) contacts. Cached in KV for 5 minutes to avoid hitting the Resend API on every page load.

## Architecture

```
Browser (subscribe.js)
  |
  |-- POST /api/subscribe   --> Cloudflare Worker --> Resend API (create contact)
  |-- GET  /api/subscribe/count --> Cloudflare Worker --> KV cache / Resend API
```

The frontend JS (`static/js/subscribe.js`) calls the Worker. In production, requests go through the route `mdelapenya.xyz/api/*`. In local dev, the JS has a dev mode that logs to console instead of making API calls.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A [Cloudflare](https://cloudflare.com) account with the `mdelapenya.xyz` zone
- A [Resend](https://resend.com) account and API key

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

Note: the frontend JS (`static/js/subscribe.js`) has a built-in dev mode. When running on `localhost` without a `SUBSCRIBE_API_BASE` override, it skips all API calls and logs to the console instead. To test the actual Worker locally, run `wrangler dev` and set `window.SUBSCRIBE_API_BASE = "http://localhost:8787/api/subscribe"` in the browser console.

## Configuration

All configuration is in `wrangler.jsonc`:

| Setting | Description |
|---|---|
| `vars.ALLOWED_ORIGIN` | Production origin for CORS (`https://mdelapenya.xyz`) |
| `kv_namespaces[0].id` | KV namespace ID for caching (rate limits + subscriber count) |
| `routes[0].pattern` | Route pattern that maps `mdelapenya.xyz/api/*` to this Worker |

Secrets (set via `wrangler secret put`, not in the file):

| Secret | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for creating contacts and fetching the contact list |

## API reference

### POST /api/subscribe

Subscribe an email address.

**Request:**
```json
{ "email": "reader@example.com" }
```

**Responses:**

| Status | Body | Condition |
|---|---|---|
| 200 | `{ "ok": true }` | Success |
| 400 | `{ "error": "Email is required" }` | Missing or empty email |
| 400 | `{ "error": "Invalid email format" }` | Fails regex validation |
| 403 | `{ "error": "Forbidden" }` | Unknown origin |
| 429 | `{ "error": "Too many requests. Try again later." }` | Rate limit exceeded (10/hour per IP) |
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

## Rate limiting

When the KV `CACHE` binding is available, the Worker rate-limits POST requests by IP address:

- Max 10 subscribe requests per IP per hour
- Rate counters expire automatically (KV TTL: 3600s)
- If KV is unavailable, rate limiting is skipped gracefully

## Caching

Subscriber count is cached in KV for 5 minutes (`CACHE_TTL = 300`). On a successful subscribe, the cached count is invalidated so the next count request fetches fresh data from Resend.

## Frontend integration

The subscribe form is rendered by `layouts/partials/subscribe.html` and powered by `static/js/subscribe.js`. The form appears at the bottom of every blog post.

The JS detects the environment:
- **Production** (`mdelapenya.xyz`): calls the Worker API
- **Local dev** (`localhost`): logs to console, shows fake count of 42, simulates success on submit
- **Tests**: `SUBSCRIBE_API_BASE` override points to a Microcks mock, bypassing dev mode

## Tests

E2E tests live in `tests/subscribe/` and use Playwright + [Microcks](https://microcks.io/) (via Testcontainers) to mock the API:

```bash
cd tests
npx playwright test subscribe/
```

The Microcks mock is defined in `tests/subscribe/subscribe-api.yaml` (OpenAPI spec).
