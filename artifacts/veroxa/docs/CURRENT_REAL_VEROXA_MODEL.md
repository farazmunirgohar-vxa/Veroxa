# Current Real Veroxa Model (Two-Role)

This is the single, current description of how Veroxa Growth OS actually works in
this build. Where older docs describe Owner/Operator dashboards, AI agents exposed
to clients, or multi-role hierarchies, **this document supersedes them** for the
current model.

## The two roles

- **Restaurant Partner (Client)** — the restaurant. Submits media and direction,
  answers simple questions, and sees calm progress. Never sees AI, backend, or
  internal mechanics.
- **Veroxa Team (Faraz)** — runs everything: reviews uploads, prepares and posts
  content, reports, and asks clients for input. Uses calm, "suggested /
  recommended" language internally; rule-based helpers only.

There are no Owner or Operator dashboards in the live experience.

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

## Pricing (locked — do not change)

- Core: **$977/mo** (founding first year **$488/mo**).
- Ads add-on: **+$477/mo**.
- Standard combo: **$1,454/mo** (founding first year **$965/mo**).

Source of truth: `src/data/pricing/veroxaPricing.ts`.

## Guardrails (current build)

No OpenAI/AI runtime calls, no image edit/generation, no Supabase Storage, no
publishing, no payments, no production auth, no Owner/Operator dashboards, no
pricing changes, no full UI redesign, and **no AI exposed to clients**. Demo
Preview and Login stay separate from the live portals.

## Relationship to older docs

Many `docs/*` files describe planned or aspirational layers (AI agents, auth,
publishing, lead engines). They remain as plans. This document and the three
companion stage docs describe what is actually live in the two-role model today.
