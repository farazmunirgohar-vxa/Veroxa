# Veroxa Quality Guardrails

> **Purpose.** The hard rules that keep Veroxa trustworthy. AI agents and
> automations make work faster, but they never cross these lines. The current
> build runs on the real workflow foundation (backend pending); all AI output
> is rule-based and every client-facing step requires human approval. See
> `REAL_WORKFLOW_FOUNDATION.md`.

> **Update (2026-05-29).** The **Restaurant Content Intelligence Pipeline**
> (`RESTAURANT_CONTENT_INTELLIGENCE_PIPELINE.md`) enforces these guardrails per
> upload: captions are drafted **only after** a media/context quality gate
> passes (otherwise "Needs client context before caption drafting." + a
> clarification question), no menu/offer/health/halal/"best"/guarantee claims
> are invented, and clients see only simple statuses while the team sees full
> reasoning.

---

## 1. Human approval is always required

Nothing client-facing ships without a human. Every AI output carries
`humanApprovalRequired: true` and an approval gate:

- Content approved before scheduling.
- Report verified before the client sees it.
- Message approved before sending to a client.
- Media approved before use.
- Lead summary reviewed before outreach.
- Claims confirmed before public use.

## 2. No automatic external action

- No auto-publishing to Google, Meta, or any social platform.
- No auto-messaging clients (email / SMS / WhatsApp / in-app).
- No Supabase writes, storage uploads, payments, or notifications.
- No new public routes. Owner and Operator portals stay parked and hidden.
- The Free Audit (search, scoring, report), Google Places, the web presence
  scanner, and login/auth are **not** modified.

## 3. No invented facts

- AI never invents metrics. If real performance data is not connected, the
  output says so (and reports are labelled accordingly).
- AI never invents specials, discounts, menu items, prices, or offers.
- Claim-risk language (halal, authentic, family-owned, best, guaranteed,
  discount, % off, free) is flagged for the client to confirm before public use.
- AI never guarantees outcomes (reach, engagement, sales).

## 4. Honest labels

Every AI/automation surface is labelled so no one mistakes a draft for final:

- **AI-assisted draft** — produced by AI, not yet reviewed.
- **AI-prepared suggestion** — a recommendation for a human to act on.
- **Automation-ready** — prepared and ready to flow once approved.
- **Team review required** — a human must check before anything moves.

## 5. Confidence is not a promise

Confidence (high / medium / low) describes how complete the inputs were, not
how the post will perform. Low confidence means "get more context," never
"this will fail."

## 6. Client calm, team detail

- The **client portal** stays calm and non-technical: simple statuses, no raw
  scores, no internal AI mechanics, no risk jargon.
- The **team portal** may show full detail: confidence, risk flags, automation
  readiness, next actions, and internal notes.

See also `AI_FIRST_SOP_MODEL.md`, `AI_AGENT_AUTOMATION_BLUEPRINT.md`, and
`FUTURE_BACKEND_CONTRACT.md`.

## 7. Lead intelligence + outreach

The Lead Intelligence + Outreach Engine follows the same honesty and
human-in-the-loop rules, plus outreach-specific limits:

- Human review is required before any outreach; nothing auto-sends, auto-calls,
  or auto-texts. "Mark ready for outreach" only flags for human review.
- Only public or audit/lead-provided data is used — no private scraping.
- Never claim confirmed agency or marketing spend. Strongest allowed phrasing:
  "possible paid-service signal" / "likely digital investment", always with
  "needs manual verification".
- Never insult a lead's current vendor. Never guarantee results.
- The conversion-opportunity score is a human prioritization aid, not a promise.

## 8. Self-improving lead engine

The learning layer (logged outcomes → cautious signals) follows the same rules:

- Outcomes are logged by a human after a manual outreach; logging only saves a
  result locally and never contacts anyone.
- Learned patterns are **signals, not rules**. Score adjustments are small and
  capped (±10), only applied past a minimum sample, and damped while emerging.
- Every learned pattern carries a confidence label; below the established sample
  size the surface is flagged "Still learning — early signals".
- Weaker segments are "weaker so far", never "bad"; nothing is a guarantee.

See `SELF_IMPROVING_LEAD_ENGINE.md`, `OUTREACH_COMPLIANCE_GUARDRAILS.md`, and
`LEAD_INTELLIGENCE_OUTREACH_ENGINE.md`.
