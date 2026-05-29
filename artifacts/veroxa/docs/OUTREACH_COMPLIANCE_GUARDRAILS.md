# Outreach Compliance Guardrails

Hard rules for the Lead Intelligence + Outreach Engine. These are
non-negotiable and apply to every surface, draft, and future extension.

## Human-in-the-loop

- A human reviews every outreach draft before any contact is made.
- "Mark ready for outreach" only flags a lead for human review. It sends nothing.
- Drafts are editable starting points, never final approved messages.

## No automation of contact

- No auto-send of email.
- No auto-call or auto-dial.
- No auto-text / SMS.
- No scheduled or queued automatic sending of any kind.

## Data sourcing

- Only public or audit-provided / lead-provided data is used.
- No private scraping, no bypassing logins, paywalls, or access controls.
- Contact-path steps reference only public contact methods (public site contact
  page, public phone, public listing, public social profiles, physical walk-in).

## Claims and language

- Never claim confirmed agency or marketing spend. The strongest allowed phrasing
  is "possible paid-service signal" / "likely digital investment", always paired
  with "needs manual verification".
- Never insult, disparage, or attack a lead's current vendor or agency.
- Never promise or guarantee results, rankings, revenue, or outcomes.
- Prefer cautious, evidence-based language tied to the lead's own audit findings:
  "execution appears inconsistent", "possible", "likely", "needs manual review".

## Scope boundaries

- Free Audit V1 is untouched and must keep working unchanged.
- Owner/Operator editing flows are parked — no edits to those surfaces.
- No payments, billing, or notification systems are introduced here.
- `OPENAI_API_KEY` is server-side only and never exposed to the client. The AI
  layer only rewrites copy; rule-based output is the safe fallback.

## Determinism + safety

- Scoring and decisions are rule-based and deterministic.
- If the AI layer is unconfigured or errors, the deterministic draft is used.
- The conversion-opportunity score is a human prioritization aid, not a promise.

## Self-improving learning layer

- Outcome logging is a human action that only saves a result locally. It never
  sends, calls, texts, or contacts anyone.
- Learned patterns are signals, not rules. Score adjustments are capped (±10),
  only applied past a minimum sample, and damped while a segment is "emerging".
- Every learned pattern is labelled by confidence; the surface is flagged "Still
  learning — early signals" below the established sample size.
- Cautious language carries through: weaker segments are "weaker so far", never
  "bad"; marketing signals stay "possible — needs manual verification".
- See `SELF_IMPROVING_LEAD_ENGINE.md`.
