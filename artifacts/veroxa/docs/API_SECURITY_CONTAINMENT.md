# API Security Containment

Status: active containment guardrail for the Express API server.

## Public route

| Route | Access | Notes |
| --- | --- | --- |
| `GET /api/healthz` | Public | Health check only. It is mounted before protected API middleware and does not require `x-veroxa-api-key`. |

## Protected routes

All non-health API routes are protected by the server-side API access middleware and the protected-route rate limiter.

| Route | Protection | Feature flag |
| --- | --- | --- |
| `POST /api/ai/draft` | Requires `x-veroxa-api-key` and rate limit pass | `VEROXA_ENABLE_AI_ROUTES=true` |
| `POST /api/audit/ai-draft` | Requires `x-veroxa-api-key` and rate limit pass | `VEROXA_ENABLE_AI_ROUTES=true` |
| `POST /api/audit/search-restaurants` | Requires `x-veroxa-api-key` and rate limit pass | `VEROXA_ENABLE_GOOGLE_ROUTES=true` |
| `POST /api/audit/restaurant-details` | Requires `x-veroxa-api-key` and rate limit pass | `VEROXA_ENABLE_GOOGLE_ROUTES=true` |

## Required server env for protected access

Use one of these server-only secrets:

- `VEROXA_INTERNAL_API_KEY`
- `VEROXA_API_ACCESS_TOKEN`

Clients must send the value in this header:

- `x-veroxa-api-key: <server secret>`

Do not place either secret in Vite/frontend env. Do not print it in logs.

## Safe defaults

- If no server API secret is configured, protected routes return a disabled response by default.
- The only bypass is local development with both:
  - `NODE_ENV=development`
  - `VEROXA_ALLOW_UNAUTHENTICATED_DEV_API=true`
- AI routes are disabled unless `VEROXA_ENABLE_AI_ROUTES=true`.
- Google-powered audit routes are disabled unless `VEROXA_ENABLE_GOOGLE_ROUTES=true`.
- Protected routes use an in-memory rate limiter. Defaults are conservative and can be tuned with:
  - `VEROXA_API_RATE_LIMIT_WINDOW_MS`
  - `VEROXA_API_RATE_LIMIT_MAX`
- Request bodies are size-limited by Express middleware.
- CORS uses `VEROXA_ALLOWED_ORIGINS` in non-development environments and localhost-only allowances in development.

## Operational rule

Real users should not hit AI or Google-powered routes directly. Those routes are for protected internal review workflows only, with feature flags intentionally disabled unless the environment is explicitly prepared for safe use.
