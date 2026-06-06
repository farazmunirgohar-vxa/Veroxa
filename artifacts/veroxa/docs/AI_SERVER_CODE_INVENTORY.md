# AI Server Code Inventory — Protected and Dormant Unless Explicitly Enabled

Status: inventory only for the AI + automation readiness blueprint. This document does not enable AI routes, add live AI calls, or connect AI output to any Veroxa UI.

> Warning: Do not connect this to public/client UI or Team automation until a future approved activation build.

## Existing protected AI-capable server files

### `artifacts/api-server/src/routes/aiDrafts.ts`

- Server-side Express route for `POST /ai/draft`.
- Accepts a bounded draft type and bounded context fields.
- Calls the existing `generateAiDraft` helper only after the route is reached.
- Must remain server-side only and must not be wired into public/client UI or Team automation in this PR.

### `artifacts/api-server/src/lib/openAiDrafts.ts`

- Server-side draft helper.
- Reads `OPENAI_API_KEY` from the environment only.
- Can call OpenAI only when `OPENAI_API_KEY` is configured and the protected AI route is enabled.
- If `OPENAI_API_KEY` is missing, it returns `mode: "not_configured"` with a rule-based fallback draft.
- If the model call fails, it returns `mode: "error"` with the same rule-based fallback approach.
- Drafts remain review-required and must not publish, message clients, invent metrics, or guarantee outcomes.

### `artifacts/api-server/src/routes/index.ts`

- Mounts API routes behind shared protection.
- Applies `protectedApiRateLimit` and `requireProtectedApiAccess` before AI draft routes.
- Applies `requireAiRoutesEnabled` before `auditAiRouter` and `aiDraftsRouter`.
- AI routes must remain disabled unless `VEROXA_ENABLE_AI_ROUTES=true` is explicitly configured in a future approved build.

### `artifacts/api-server/src/middlewares/apiSecurity.ts`

- Contains the protected API access guard.
- Contains the AI route enablement guard.
- `requireProtectedApiAccess` blocks protected routes unless the request carries the expected internal API key.
- `requireAiRoutesEnabled` blocks AI routes unless `VEROXA_ENABLE_AI_ROUTES` is exactly enabled.

## Current containment summary

- Existing AI-capable code is server-side only.
- AI routes are protected by internal API key through `requireProtectedApiAccess`.
- AI routes are disabled unless `VEROXA_ENABLE_AI_ROUTES=true`.
- OpenAI draft generation only occurs if `OPENAI_API_KEY` is present.
- If no OpenAI key is present, rule-based fallback is used.
- This PR does not enable the AI routes.
- This PR does not add new live AI calls.
- This PR does not import a new AI provider SDK.
- This PR does not add new AI provider network calls.
- Future activation requires RR approval.

## Future activation requirements

Before any future activation, Veroxa needs production auth, data/storage architecture, logs, QA rules, rollback plan, output review workflow, client-safe validators, and explicit RR approval. The existing server code should stay dormant until those prerequisites are approved and implemented.
