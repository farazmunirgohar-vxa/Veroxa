# AI Draft Endpoint Contract

> **Purpose.** Defines the safe, server-side AI draft endpoint used by the
> Veroxa Team portal. The endpoint is optional: it produces an AI-assisted
> draft when `OPENAI_API_KEY` is configured server-side, and a deterministic
> rule-based draft otherwise. No AI output is ever treated as final — a human
> always reviews before anything reaches a client.

---

## 1. Route

`POST /api/ai/draft` (api-server)

- The `OPENAI_API_KEY` is read **only** on the server, from environment
  variables / local env. It is never sent to the browser and never
  appears in any response.
- The endpoint never throws raw provider errors to the client. Failures are
  converted into a structured response with `mode: "error"` and a safe
  fallback draft when possible.

## 2. Request shape

```jsonc
{
  "draftType": "lead_summary" | "report_summary" | "content_caption" | "general",
  "context": { /* draft-type-specific, non-sensitive fields */ }
}
```

- `context` carries only the rule-based signals already visible in the portal
  (restaurant name, location, opportunity label, found-status flags, cadence,
  etc.). No secrets, no PII beyond what the team already sees.

## 3. Response shape

```jsonc
{
  "mode": "ai" | "rule_based_fallback" | "not_configured" | "error",
  "draft": {
    "text": "string",
    "items": ["string", ...]
  } | null,
  "message": "string?"
}
```

### Mode meanings

| Mode | Meaning |
|------|---------|
| `ai` | `OPENAI_API_KEY` configured; draft produced by the model. |
| `rule_based_fallback` | AI call attempted or skipped; deterministic rule-based draft returned. |
| `not_configured` | No key set. Rule-based draft (or guidance) returned; UI shows the fallback gracefully. |
| `error` | Provider/network failure. Raw error never forwarded; safe fallback returned where possible. |

## 4. Frontend helper

`src/lib/ai/aiDraftClient.ts`

- `generateAiDraftClient(payload)` — always resolves to the structured
  response above; never throws into the UI.
- `aiDraftModeLabel(mode)` — maps a mode to a calm, human-readable label.

## 5. Safety rules

- Use **only** the provided signals. Never invent metrics, rankings, reviews,
  revenue, ad spend, guarantees, menu items, or verification.
- Preserve uncertainty; separate found / not found / needs review.
- Every surface that renders a draft must show an AI label
  ("AI-assisted draft," "AI-prepared suggestion," "Team review required").
- Drafts are not auto-saved, not auto-sent, not published.

## 6. Current build boundaries

- No Supabase writes, no storage, no publishing, no auto-messaging, no
  payments, no notifications, no new public routes.
- The endpoint is read-and-draft only.
