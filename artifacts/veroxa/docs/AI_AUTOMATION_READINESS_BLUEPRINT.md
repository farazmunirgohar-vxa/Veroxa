# AI + Automation Readiness Blueprint

Status: dormant readiness blueprint for preview/manual/pre-live Veroxa. This blueprint prepares contracts, review gates, QA rules, and guardrails only. It does not activate live AI, live automation, platform connectors, paid systems, background jobs, webhooks, cron jobs, production auth, database writes, storage uploads, payments, or customer-visible automated execution.

Related docs:

- [`AI_AUTOMATION_READINESS_BOUNDARY.md`](./AI_AUTOMATION_READINESS_BOUNDARY.md)
- [`AI_SERVER_CODE_INVENTORY.md`](./AI_SERVER_CODE_INVENTORY.md)

## Purpose

Veroxa may later use AI as an assistant for drafting, sorting, summarizing, and internal QA. The purpose of this readiness step is to define the shape of that future work before any live system is connected.

AI is not the operator. Veroxa team review remains the operating gate. Faraz must be able to review, edit, skip, or ask the client before anything becomes client-visible or public-facing.

## What this PR prepares

- Existing protected AI-capable server code is inventoried and documented.
- Dormant prompt contracts are defined for future assistant areas.
- Human review requirements are made explicit.
- Business-truth confirmation rules are made explicit.
- Client-safe output validation rules are prepared.
- Guardrails check that the dormant readiness domain does not contain live AI calls, AI SDK imports, network calls, publishing functions, cron/webhook/background behavior, or customer-visible automated execution language.

## What this PR does not activate

- No live AI is activated.
- No existing AI route is enabled.
- No new OpenAI call is added.
- No production auth, database, storage, payment, connector, webhook, cron, background job, or live automation is added.
- No Team Portal complexity is expanded.
- No public/client AI marketing is added.

## Existing protected server AI draft code

The repo already contains server-side AI-capable draft code in `artifacts/api-server/src/routes/aiDrafts.ts` and `artifacts/api-server/src/lib/openAiDrafts.ts`. Those routes remain protected by `requireProtectedApiAccess`, gated by `requireAiRoutesEnabled`, and disabled unless `VEROXA_ENABLE_AI_ROUTES=true`. OpenAI draft generation only occurs if `OPENAI_API_KEY` is present; otherwise the helper uses a rule-based fallback.

This blueprint does not connect that server code to public/client UI or Team automation. Future use requires RR approval plus logs, rollback, QA, production auth, and data/storage architecture.

## Mandatory review principles

### Veroxa team review remains mandatory

AI can later prepare a draft or suggestion, but it must not approve, publish, message customers, update platforms, or alter public/client copy automatically. Faraz review remains required before anything becomes public-facing or client-visible.

### Business-truth confirmation remains mandatory

Hours, holiday hours, menu items, prices, existing offers, ordering links, dietary claims, health claims, serious complaint responses, and other restaurant facts require confirmation before approval or sharing. If uncertain, the assistant must ask for confirmation instead of guessing.

### Client-safe output matters

Client-visible output must not mention AI internals, OpenAI, backend details, connectors, raw scoring, internal proof math, or unreviewed risk logic. It must avoid guaranteed outcomes and must clearly say when data is limited.

## Support for the future factory model

This readiness layer supports future repeatable work by defining inputs, outputs, review gates, validators, logs, and rollback expectations before activation. It keeps Veroxa preview/manual/pre-live while making future AI easier to plug into prepared boundaries after explicit approval.


## Assistant type markers

The dormant TypeScript contracts use these assistant type identifiers:

- `media_review`
- `caption_draft`
- `weekly_update_draft`
- `monthly_report_draft`
- `request_classification`
- `internal_qa`

## Future assistance areas

### 1. Media Review Assistant

- Future trigger: reviewed media needs an internal usefulness suggestion.
- Input fields: media type, category, quality notes, best use, warnings, client-safe summary.
- Output fields: media usefulness suggestion, what to ask the client for next, possible content direction, confidence, blocked reasons.
- Human review gate: Veroxa team review and Faraz review before any client-visible message.
- Blocked behavior: no automatic posting, no invented menu claims, no guaranteed performance, no customer-visible output without review.
- Failure mode: if media context is incomplete, mark low confidence and request better media or confirmation.
- Required logs later: source media id, suggestion id, reviewer, reviewer decision, edit history, rollback marker.
- Rollback requirement later: remove or replace the suggestion without changing source media records.
- Mapping to `openAiDrafts.ts`: no direct mapping; existing `content_angle` drafts are related but not equivalent.

### 2. Caption Draft Assistant

- Future trigger: confirmed media and restaurant facts need 2-3 caption options.
- Input fields: restaurant name, confirmed item, confirmed offer if any, brand tone, platform, media context.
- Output fields: 2-3 caption drafts, business-truth needs, confidence, blocked reasons.
- Human review gate: Veroxa team review, Faraz review, and business-truth confirmation when facts are uncertain.
- Blocked behavior: must not invent offers, prices, dietary claims, halal/organic/health claims, hours, or menu items.
- Failure mode: if any business fact is uncertain, block client visibility and request confirmation.
- Required logs later: context id, draft id, reviewer edits, approval state, confirmation source, rollback marker.
- Rollback requirement later: draft must stay removable or editable before any future connector can use it.
- Mapping to `openAiDrafts.ts`: related to existing `caption_drafts`, but this contract is dormant and stricter.

### 3. Weekly Update Draft Assistant

- Future trigger: a weekly update has reviewed completed work, prepared work, pending items, media needs, confirmations, and next focus.
- Input fields: completed work, prepared work, pending items, requests answered, media needed, confirmations needed, next week focus.
- Output fields: weekly update draft, missing inputs, confidence, blocked reasons.
- Human review gate: Veroxa team review and Faraz review before sharing.
- Blocked behavior: no fake metrics, no guaranteed outcomes, no invented work, no automatic client sharing.
- Failure mode: if work records are incomplete, state what is missing instead of inventing progress.
- Required logs later: weekly update id, draft id, source work ids, reviewer decision, client visibility decision, rollback marker.
- Rollback requirement later: draft can be replaced with a manual update before client sharing.
- Mapping to `openAiDrafts.ts`: related to existing `client_update`, but this blueprint adds weekly-update-specific fields.

### 4. Monthly Report Draft Assistant

- Future trigger: a monthly report has reviewed activity, local visibility work, website alignment, social progress, media learnings, signals, limitations, and next focus.
- Input fields: what Veroxa handled, Google/Maps/local search progress, website alignment, Facebook/Instagram progress, media used, media learnings, reach/action signals, limitations, next month focus.
- Output fields: monthly report draft, data limitations, confidence, blocked reasons.
- Human review gate: Veroxa team review and Faraz review before sharing.
- Blocked behavior: must not show $9,900, requiredDailyOrders, margin, profit math, or generated-sales claims.
- Failure mode: if there is not enough data, clearly say there is not enough data.
- Required logs later: monthly report id, source signal ids, draft id, reviewer decision, rollback marker.
- Rollback requirement later: draft can revert to deterministic/manual report sections before sharing.
- Mapping to `openAiDrafts.ts`: related to existing `report_summary`, but this contract blocks proof-math leakage and generated-sales claims.

### 5. Request Classification Assistant

- Future trigger: a portal request needs an internal classification suggestion.
- Input fields: request title, request message, current plan.
- Output fields: included/add-on/coming-soon/not-included/needs-confirmation/needs-review suggestion, packageBoundary rule, confidence, blocked reasons.
- Human review gate: Veroxa team review and Faraz review; client confirmation if facts are unclear.
- Blocked behavior: must defer to existing `packageBoundary` domain rules and must not create payment, checkout, billing, or upgrade flows.
- Failure mode: if boundary rules are ambiguous, classify as needs-review and do not mutate request state.
- Required logs later: request id, suggested classification, packageBoundary rule, reviewer decision, rollback marker.
- Rollback requirement later: suggestion can be discarded without changing request records.
- Mapping to `openAiDrafts.ts`: no direct mapping; existing draft helper does not enforce package boundaries.

### 6. Internal QA Assistant

- Future trigger: draft copy needs an internal policy/client-safety checklist.
- Input fields: draft copy, target surface, risk flags, policy boundaries.
- Output fields: checklist of issues to review, risk summary, confidence, blocked reasons.
- Human review gate: Veroxa team review and Faraz review.
- Blocked behavior: must not alter public/client output automatically and must not approve anything by itself.
- Failure mode: if policy boundaries are unclear, return a checklist and require human review.
- Required logs later: target surface, risk flags, checklist id, reviewer decision, rollback marker.
- Rollback requirement later: QA flags remain advisory and can be removed without changing the underlying copy automatically.
- Mapping to `openAiDrafts.ts`: no direct mapping; this is a future QA layer around drafts.
