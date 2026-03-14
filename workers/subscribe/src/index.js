const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CACHE_TTL = 300; // 5 minutes

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = [env.ALLOWED_ORIGIN || "https://mdelapenya.xyz"];
    // In local dev (wrangler dev), allow localhost origins.
    // Detect via .dev.vars: set DEV_ORIGINS=http://localhost:1313
    if (env.DEV_ORIGINS) {
      allowedOrigins.push(...env.DEV_ORIGINS.split(","));
    }
    const matchedOrigin = allowedOrigins.find(o => o === origin) || allowedOrigins[0];

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(matchedOrigin),
      });
    }

    // Only allow requests from known origins
    if (origin && !allowedOrigins.includes(origin)) {
      return jsonResponse({ error: "Forbidden" }, 403, matchedOrigin);
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/subscribe" && request.method === "POST") {
        return await handleSubscribe(request, env, matchedOrigin);
      }

      if (url.pathname === "/api/subscribe/count" && request.method === "GET") {
        return await handleCount(env, matchedOrigin);
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return jsonResponse({ error: "Internal error" }, 500, matchedOrigin);
    }
  },
};

async function handleSubscribe(request, env, matchedOrigin) {
  const body = await request.json().catch(() => null);
  if (!body || !body.email) {
    return jsonResponse({ error: "Email is required" }, 400, matchedOrigin);
  }

  const email = body.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return jsonResponse({ error: "Invalid email format" }, 400, matchedOrigin);
  }

  // Rate limit: max 10 subscribes per IP per hour (requires KV)
  if (env.CACHE) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rateKey = `rate:${ip}`;
    const rateCount = parseInt((await env.CACHE.get(rateKey)) || "0");
    if (rateCount >= 10) {
      return jsonResponse({ error: "Too many requests. Try again later." }, 429, matchedOrigin);
    }
    await env.CACHE.put(rateKey, String(rateCount + 1), { expirationTtl: 3600 });
  }

  // Create contact in Resend
  const resendResponse = await fetch("https://api.resend.com/contacts", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      unsubscribed: false,
      properties: {
        source: body.source || "",
      },
    }),
  });

  if (!resendResponse.ok) {
    const err = await resendResponse.text();
    console.error("Resend error:", err);
    return jsonResponse({ error: "Failed to subscribe. Please try again." }, 502, matchedOrigin);
  }

  // Invalidate cached count
  if (env.CACHE) {
    await env.CACHE.delete("subscriber_count");
  }

  return jsonResponse({ ok: true }, 200, matchedOrigin);
}

async function handleCount(env, matchedOrigin) {
  // Check cache first (if KV is available)
  if (env.CACHE) {
    const cached = await env.CACHE.get("subscriber_count");
    if (cached) {
      return jsonResponse({ count: parseInt(cached) }, 200, matchedOrigin);
    }
  }

  // Fetch from Resend
  const resendResponse = await fetch("https://api.resend.com/contacts", {
    headers: {
      "Authorization": "Bearer " + env.RESEND_API_KEY,
    },
  });

  if (!resendResponse.ok) {
    return jsonResponse({ count: 0 }, 200, matchedOrigin);
  }

  const data = await resendResponse.json();
  const count = Array.isArray(data.data) ? data.data.filter(c => !c.unsubscribed).length : 0;

  // Cache for 5 minutes (if KV is available)
  if (env.CACHE) {
    await env.CACHE.put("subscriber_count", String(count), { expirationTtl: CACHE_TTL });
  }

  return jsonResponse({ count }, 200, matchedOrigin);
}

function jsonResponse(body, status = 200, matchedOrigin = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(matchedOrigin),
    },
  });
}

function corsHeaders(matchedOrigin) {
  return {
    "Access-Control-Allow-Origin": matchedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
