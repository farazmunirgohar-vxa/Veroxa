# Current Real Veroxa Model (Two-Role)

This is the single, current description of how Veroxa Growth OS actually works in
this build. Where older docs describe Owner/Operator dashboards, AI agents exposed
to clients, multi-role hierarchies, or retired pricing, **this document supersedes
them** for the current model.

## Builder model

- **Codex** is the primary engineering/build/hardening partner for source-of-truth
  updates, architecture review, type safety, tests, backend/domain logic, and PRs.
- **Replit** is secondary/preview-only unless Faraz explicitly says otherwise; use
  it mainly for visible previews and product iteration, not as the active source
  of engineering truth.
- GitHub main remains the source of truth.

## The two active human roles

- **Restaurant Partner (Client)** — the restaurant. Submits media and direction,
  answers simple questions, and sees calm progress. Never sees AI, backend,
  automation internals, risk scoring, internal workflow mechanics, OpenAI,
  Supabase, APIs, connectors, or execution mechanics.
- **Veroxa Team / Internal Admin (Faraz)** — runs everything: reviews uploads,
  prepares and posts content, reports, and asks clients for input. Uses calm,
  "suggested / recommended" language internally; rule-based helpers only.

There are no active Owner or Operator dashboards in the live experience. Owner and
Operator language in older docs is historical/planned only and must not be treated
as an active runtime role model. Do not use Super Admin language.

## Surfaces

- **Demo Preview** — `/demo/client/dashboard` (sample data, clearly labelled).
  Kept separate from the live client portal.
- **Login** — `/login` (kept separate; no production auth wired in this build).
- **Client portal** — exactly five active client experiences: Dashboard, Media,
  Updates, Requests, and Reports. The current route set is `/client/dashboard`,
  `/client/media`, `/client/updates`, `/client/requests`, and
  `/client/reports`. Keep one main Reports tab; weekly and monthly reports live
  inside Reports rather than becoming separate primary navigation items.
- **Team portal** — `/team/dashboard`, `/team/upload-inbox`, `/team/work-queue`,
  and related review/report queues. The Team portal may have powerful internal
  logic, but the driver controls should stay simple: what needs review, what is
  ready, what is blocked, what needs client input, what needs approval, and what
  to do next.

## Client portal operating model

The Client Portal is a simple, premium drop-off / status tracking / pickup lane,
not a view into the Veroxa factory. The client drops off raw media and optional
direction; Veroxa reviews, prepares, schedules, and posts after the appropriate
team review. Client-facing pages should emphasize upload, progress, requests,
reports, and simple status.

Active client navigation is locked to:

1. Dashboard
2. Media
3. Updates
4. Requests
5. Reports

The client media lifecycle is:

**Uploaded → Reviewed → Ready → Scheduled → Posted**

Client-facing media pages should group work as Uploaded Media, Ready Media, and
Posted Media when that structure is implemented. Each media item may show a
simple pizza-order-style tracker for the lifecycle above. The selected media
detail view should prioritize media name, current status, tracker, client note,
client direction, schedule/use context, and one short next step.

Exception statuses are:

- Needs better media
- Saved for later
- Waiting for direction
- Not usable
- Already used

Requests are optional client direction, not a complicated ticketing system. A
client can ask Veroxa to use certain media, save something for later, push a
special/event, avoid an item, or send general direction. Client-visible request
statuses should stay simple, such as Received, In Review, Handled, or Waiting
for you.

Updates should show simple progress details, especially media progress: recent
reviewed, ready, scheduled, or posted items and anything Veroxa needs from the
client. Updates should link toward Media or Requests when helpful, but should
not become a duplicate analytics/report page.

Reports stay under one Reports navigation item. Inside Reports, show Weekly
Reports and Monthly Reports when available. Weekly reports summarize completed
work, media used, next steps, client needs, and visibility notes. Monthly reports
summarize posts completed, top content, local visibility progress, improvements,
next-month focus, and honest limitations. Do not create separate main tabs for
weekly and monthly reporting, and do not invent metrics.

Client-facing pages must not expose AI, backend, Supabase, OpenAI, APIs,
automation internals, risk scoring, internal workflow mechanics, internal IDs,
connectors, or execution details. Use client-safe language such as Veroxa team
review, in review, needs your input, visibility update, more content needed, and
nothing goes live without Veroxa team review.

## Team portal operating model

The Team Portal should feel like a good car: powerful engine, simple steering
wheel. Internally, Veroxa can use assistance, routing, alerts, content scoring,
scheduling recommendations, report assistance, and workflow logic. On the
surface, Faraz should mainly steer by seeing what needs review, what is ready,
what is blocked, what needs client input, what needs approval, and what to do
next.

Team pages may expose operational detail, but they should remain calm and
action-focused rather than feeling like an AI lab, backend console, or strategy
overload screen.

## How the day flows

1. Client submits media / direction.
2. Team triages in the **Upload Inbox** (clean triage surface; heavier internal
   preview tools are collapsed under "Internal preview tools").
3. The **Daily Opportunity Engine** suggests 1–3 customer-growth pushes per client
   (team-only, rule-based) — see `DAILY_CUSTOMER_OPPORTUNITY_ENGINE.md`.
4. Team prepares + posts content via the **Work Queue**, asking clients for input
   through the calm communication loop — see `CLIENT_TEAM_COMMUNICATION_LOOP.md`.
5. Team reports honest progress; no invented performance numbers.

Team review is built on a mobile-friendly foundation — see
`MOBILE_TEAM_REVIEW_MODEL.md`. Queue field consistency is documented in
`TEAM_QUEUE_MODEL.md`.

## Pricing (locked current public pricing — do not change)

- **Essential: $497/month**
- **Growth: $697/month**
- **Premium: $997/month**

Current pricing rules:

- No contract.
- Cancel anytime.
- All active plans are capped at max 1 post/day.
- Posting depends on usable client-provided media.
- Growth adds TikTok + Reels posting support using provided photos/videos.
- Premium adds ads management readiness/support after assessment, but does not
  increase the public posting cap.
- Premium requires 1+ month on Essential or Growth, a Veroxa readiness assessment,
  client approval, and an agreed ad budget.
- Ad spend is always separate and paid directly by the restaurant.
- Veroxa does not handle comments, DMs, inboxes, complaints, refunds, order
  questions, or customer-service conversations at launch.

Source of truth: `src/data/pricing/veroxaPricing.ts`.

## Deprecated historical pricing (not current; do not use)

The retired Core / Ads add-on / combo model and any founding-client pricing from
that model are historical only. They are not current public pricing and must not
appear as active/client-facing pricing.

## Guardrails (current build)

No OpenAI/AI runtime calls, no image edit/generation, no Supabase Storage, no
publishing, no payments, no production auth, no Owner/Operator dashboards, no
pricing changes, no full UI redesign, and **no AI exposed to clients**. Demo
Preview and Login stay separate from the live portals.

## Relationship to older docs

Many `docs/*` files describe planned or aspirational layers (AI agents, auth,
publishing, lead engines). They remain as plans. This document and the three
companion stage docs describe what is actually live in the two-role model today.

## 2026-06 integrity pass notes

- Public Client Demo remains the only public demo route and may use sample `demo-a` data.
- Real `/client/*` routes should use active client context and show safe review/empty states when live account data is not connected; they should not silently present `demo-a` as the active client.
- Real `/team/*` routes require a successful placeholder login marker or future real auth session before rendering.
- First-client readiness is a benchmark/checklist surface, not proof that production auth, storage uploads, live account data, or publishing connectors are complete.

## First-client pilot mode

Current pilot positioning is documented in `FIRST_CLIENT_PILOT_MODE.md`. It keeps sample/demo behavior, pending production auth, pending storage upload, pending publishing integration, and manual team review clear for future builders.
