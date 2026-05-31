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
  answers simple questions, and sees calm progress. Never sees AI, backend, or
  internal mechanics.
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
- **Client portal** — `/client/dashboard`, `/client/media`, `/client/requests`,
  `/client/updates`, `/client/reports`.
- **Team portal** — `/team/dashboard`, `/team/upload-inbox`, `/team/work-queue`,
  and related review/report queues.

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
`MOBILE_TEAM_REVIEW_MODEL.md`.

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
