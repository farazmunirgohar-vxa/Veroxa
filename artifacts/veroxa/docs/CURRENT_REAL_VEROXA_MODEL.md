# Current Real Veroxa Model (Two-Role)

This is the single, current description of how Veroxa Growth OS actually works in
this build. Where older docs describe Owner/Operator dashboards, AI agents exposed
to clients, multi-role hierarchies, or retired pricing, **this document supersedes
them** for the current model.

## Builder model

The active Veroxa build stack is **GitHub + Codex + Vercel**.

- **GitHub main** remains the source of truth.
- **Codex** is the primary engineering/build agent for source-of-truth updates, architecture review, type safety, tests, backend/domain logic, and PRs.
- **Vercel** is the deployment target.
- **Browser/manual QA** is used for visual checks.

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

- **Client Demo** — five public sample-data routes: `/demo/client/dashboard`,
  `/demo/client/media`, `/demo/client/updates`, `/demo/client/requests`, and
  `/demo/client/reports`. These routes are open, clearly labelled as sample
  data, and must stay separate from the login-gated client portal.
- **Login** — `/login` (kept separate; placeholder preview login only; no
  production auth wired in this build).
- **Client portal** — exactly five active guarded client experiences:
  Dashboard, Media, Updates, Requests, and Reports. The current route set is
  `/client/dashboard`, `/client/media`, `/client/updates`, `/client/requests`,
  and `/client/reports`. These routes are wrapped by `ClientPortalGuard` and
  `RealPortalDataBoundary`; because `AUTH_MODE` remains `"placeholder"`, this is
  a preview/account guard rather than production auth. Keep one main Reports tab;
  weekly and monthly reports
  live inside Reports rather than becoming separate primary navigation items.
- **Team portal** — `/team/dashboard`, `/team/upload-inbox`, `/team/work-queue`,
  and related review/report queues. `/team/*` is wrapped by
  `InternalDemoGuard role="team"` and `RealPortalDataBoundary`; placeholder team
  login is not production auth. The Team
  portal may have powerful internal logic, but the driver controls should stay
  simple: what needs review, what is ready, what is blocked, what needs client
  input, what needs approval, and what to do next.

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

The left sidebar is the primary portal navigation. Do not duplicate these same
sidebar destinations as large dashboard shortcut cards. Legitimate action cards
are fine when they start work or highlight a needed response (for example,
Upload Media or Needs your input), but generic Media / Updates / Requests /
Reports shortcut grids should not return.

Any page shared by `/client/*` and `/demo/client/*` must use demo-aware in-page
links. A visitor already inside `/demo/client/*` should only be sent to
`/demo/client/dashboard`, `/demo/client/media`, `/demo/client/updates`,
`/demo/client/requests`, or `/demo/client/reports`; real client sessions should
continue to use the matching `/client/*` routes.

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

- **Starter: $295/month**
- **Growth: $495/month**
- **Premium: $995/month**

Current pricing rules:

- No contract.
- Cancel anytime.
- Starter is capped at up to 3 posts/week; Premium is capped at up to 1 post/day.
- Posting depends on usable client-provided media.
- Growth is the main recommended package for reels, TikTok support, better support/stronger communication, stronger Google/local consistency, stronger content rhythm, weekly updates, monthly report, and stronger workflow.
- Premium adds ad management and the public up to 1 post/day cap after assessment; ad spend remains separate.
- Premium requires a Veroxa readiness assessment,
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

## 2026-06-03 pricing/profit-fit alignment

- Active public pricing is Starter $295/month, Growth $495/month, and Premium $995/month.
- Growth is the main recommended package for strong-fit restaurants; Starter is the low-friction entry plan; Premium is selective and readiness-gated.
- Premium requires readiness assessment, client approval, and an agreed ad budget; ad spend is separate.
- Profit Fit Layer is internal/team-only and uses `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30` with conservative defaults of $15 average ticket and 5% net margin.
- Online-influenced orders/actions include online orders, phone/order clicks, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions, social content-driven visits, and repeat-customer attention.
- Public/client surfaces must not promise orders, profit, ROI, customers, revenue, rankings, or exact order targets.
- This update does not mark production auth, migrations, storage, live AI, connectors, payments, or runtime SaaS wiring as built.

## 2026-06-04 — Current OS alignment

The current real Veroxa model is pre-live/manual and preview-first. Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated. Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.

- Active stack: GitHub + Codex + Vercel; Replit is historical only.
- Active roles: Client and Team. Owner/Operator are inactive and parked.
- Current pricing: Starter $295, Growth $495, Premium $995.
- Preview credentials: [faraz@client.com](mailto:faraz@client.com) / farazclient and [faraz@team.com](mailto:faraz@team.com) / farazteam.
- `AUTH_MODE` remains `placeholder`.
- AI-ready but not connected means deterministic draft systems and approval gates can be built before live AI.
- Integration-ready but not connected means adapter contracts and UI flows can be planned before paid/live providers.
- Restaurant Onboarding is a known gap and should first be built in preview/manual mode.
