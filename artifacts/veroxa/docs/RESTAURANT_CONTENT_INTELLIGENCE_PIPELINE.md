# Restaurant Content Intelligence Pipeline

> **Purpose.** Describes how Veroxa turns a single restaurant upload into
> strategic, claim-safe content drafts. The pipeline is **rule-based** with a
> safe fallback — no live model calls, no network, no cloud writes, no
> publishing, no social APIs, no auto-messaging, no notifications. Every output
> is a DRAFT that requires Veroxa team approval. See
> `REAL_WORKFLOW_FOUNDATION.md` and `VEROXA_QUALITY_GUARDRAILS.md`.

> **Status (2026-05-29).** Implemented as a deterministic engine. If a real AI
> provider is wired later it must run **server-side only** (e.g.
> `OPENAI_API_KEY` never reaches the client) behind this same interface; this
> module is the safe fallback that always returns structured, claim-safe output.

---

## 1. What it does

For each upload, the pipeline reasons in layers before drafting captions:

1. **Restaurant knowledge** — confirmed facts only (name, any client-confirmed
   claims, tone). Unknowns become "missing knowledge" the team fills in.
2. **Media understanding** — media type, a usability rating, and a quality
   label. This layer holds the **caption gate**.
3. **Customer moment** — the real-life decision moment the post should catch
   (e.g. lunch decision, dinner craving, halal food search).
4. **Content angle** — the editorial approach (craving, trust/story, menu
   education, visit/action, etc.). Team-facing reasoning, not client hype.
5. **Caption drafts** — three strategic drafts, **only when the gate passes**.
6. **Platform adaptation + scheduling** — per-platform notes (Instagram,
   Facebook, TikTok, Google Business Profile) and a recommended posting window
   tied to the customer moment. Scheduling is **prep only**.
7. **Claim/risk review + team recommendation** — flags invented-fact risk and
   recommends the next human action.

Source: `src/lib/content/restaurantContentIntelligence.ts` and
`src/lib/content/customerMomentTypes.ts`. Entry point:
`analyzeRestaurantContent(submission)`.

---

## 2. The caption quality gate

Captions are the only layer that can put words in the restaurant's mouth, so
they are gated. The pipeline drafts captions **only** when media usability is
`usable_now` or `save_for_later`.

When usability is `needs_context` or `not_recommended`, the pipeline does **not**
produce three captions. Instead it returns:

- `draftingAllowed: false`
- `teamNote: "Needs client context before caption drafting."`
- a short, plain `clarificationQuestion` to send the client.

This keeps the team from drafting on top of unusable media or thin context.

---

## 3. The three strategic drafts

When the gate passes, the pipeline prepares three drafts with distinct jobs:

| Slot | Purpose | Default best platform |
| ---- | ------- | --------------------- |
| A | Reach / craving | Instagram |
| B | Trust / story | Facebook |
| C | Action / visit | Google Business Profile |

The team recommendation highlights a **recommended best** draft (default: the
action/visit draft) and a next action (`approve`, `edit`, `ask_client`,
`hold`, `reject`). Low context downgrades the recommendation to `edit`; detected
claims downgrade it to `ask_client`.

---

## 4. Claim safety (no invented facts)

Drafts never invent menu items, prices, specials, discounts, or
halal/authentic/family-owned/health/"best in town"/guarantee claims. If such
language appears in the client's own text, the pipeline:

- flags it under `claimRiskReview.inventedFactRisk`,
- sets `needsClientConfirmation: true` on the drafts, and
- recommends `ask_client` so the team confirms before any public use.

A claim only counts as "confirmed" (and safe to use) when the client has stated
it themselves.

---

## 5. Where it surfaces

**Team (full reasoning):**

- **Upload Inbox** — media understanding, customer moment, content angle,
  caption gate, and next action (`ContentIntelligenceInboxList`).
- **Work Queue** — three strategic drafts (or the gated clarification), the
  recommended best, schedule window, claim/risk, and next action
  (`ContentIntelligenceDraftsList`).
- **Dashboard** — a compact pipeline summary (`ContentIntelligenceSummaryStrip`).

**Client (simple, safe):**

- **Media** — one of four plain statuses (`Submitted`, `Being reviewed`,
  `Needs your input`, `Prepared by Veroxa`) plus a short context request when
  needed. No scores, agents, angles, or risk flags are ever shown to clients.
- **Updates** — calm, plain-language prep messages only.

---

## 6. Boundaries

- Rule-based, deterministic, with a safe fallback. No guarantees of results.
- No publishing, social APIs, auto-messaging, payments, or notifications.
- No fake/generated imagery.
- Human approval is always required; every output carries
  `humanApprovalRequired: true`.
- `learningSignal` is a placeholder — outcome learning is **not active**; no
  performance data is tracked or fed back yet.
- Free Audit V1, Google Places, auth, and the Owner/Operator portals are out of
  scope for this pipeline.
