# Self-Improving Lead Engine

A cautious, rule-based learning layer on top of the Lead Intelligence + Outreach
Engine. It turns logged outreach **outcomes** into small, bounded, clearly
labelled signals: which segments and angles seem to convert, how to prioritise
the queue, and where the score might be nudged — always for a human to weigh,
never as a rule or guarantee.

Everything here is **deterministic, local, and production-shaped**. There is no
network, no model call, no auto-send/call/text, and no automatic decision. The
engine suggests; a human always decides.

## Where it lives

```
artifacts/veroxa/src/lib/leadIntelligence/
  leadOutcomeTypes.ts          # LeadOutcomeRecord, stages, response statuses
  localLeadOutcomeStore.ts     # localStorage CRUD ("veroxa.lead_outcomes.v1")
  leadObjectionPatterns.ts     # objection types + cautious preparation guidance
  leadLearningSignals.ts       # computeLearningSignals() + confidence tiers
  leadPrioritizationEngine.ts  # prioritizeLead() / rankLeads() — band + why + confidence
  selfImprovingLeadEngine.ts   # bounded score adjustments + targeting/outreach recs
```

UI surfaces:

- `src/pages/team-audit-leads.tsx` — per-lead **prioritization** block and an
  **outcome tracking** control (log stage reached, response, objection, note).
  Logging only saves a result locally; it never contacts anyone.
- `src/components/LeadIntelligencePanel.tsx` — `LeadLearningPanel`
  (self-improving insights, targeting + outreach recommendations) and the
  prioritised `LeadGenTasksList`.
- `src/pages/team-dashboard.tsx` — shows the learning panel beside the lead
  intelligence summary.

## Data flow

1. A human reaches out manually (using a reviewed draft) and then **logs the
   outcome** on the lead: furthest stage reached, response status, any objection,
   and an optional internal note.
2. `recordLeadOutcome()` persists a `LeadOutcomeRecord` locally — including a
   snapshot of the segment, outreach angle id, and the predicted opportunity
   score at outreach time, so the engine can compare predicted vs. actual.
3. `computeLearningSignals(outcomes)` groups outcomes by segment, angle, and
   channel, computing conversion rates and a **confidence tier** for each group.
4. `prioritizeLead(profile, input, learning)` blends the score dimensions, the
   contact-path quality, and the (small) historical signal into a priority band,
   a "why this lead / why now", a best angle, a likely objection with calm prep,
   a confidence label, and a manual-verification checklist.
5. `buildSelfImprovementSnapshot(outcomes)` produces dashboard-level insights:
   bounded per-segment score adjustments, targeting recommendations (who to focus
   on / ease off), and outreach recommendations (which angle/channel is landing).

## Confidence tiers

Learning is grouped into tiers by sample size so early data cannot masquerade as
a proven pattern:

| Tier | Sample | Meaning |
| --- | --- | --- |
| Early / low confidence | below the emerging threshold | Reported, **not** applied to scores. |
| Emerging | mid range | Applied at a **damped** strength only. |
| Established | above the established threshold | Applied at full (still bounded) strength. |

Thresholds live in `leadLearningSignals.ts` (`LEARNING_THRESHOLDS`).

## Anti-overfit guardrails

- Score adjustments are **capped** (`MAX_SCORE_ADJUSTMENT`, ±10 points) and only
  applied once a segment passes the emerging threshold; emerging segments are
  damped further.
- The prioritisation historical nudge is small by design and shown explicitly
  in the UI ("Adjusted +N from logged outcomes — patterns are signals, not
  rules").
- Below the established sample size the whole panel is flagged "Still learning —
  early signals".

## Language rules

The learning layer follows the same cautious language as the rest of the engine
(see `OUTREACH_COMPLIANCE_GUARDRAILS.md`):

- Weaker segments are "weaker so far", never "bad".
- A marketing-investment signal is a "possible paid-service signal — needs manual
  verification", never "definitely a paying agency" or "wasting money".
- Nothing is a guarantee. Everything is a human prioritisation aid.

## Storage + future backend

Outcomes are stored locally in `localStorage` under `veroxa.lead_outcomes.v1`,
following the same pattern as `localAuditLeadStore`. The record shape is
production-shaped (stable id, timestamps, explicit segment/angle/channel) so a
future backend table can mirror it 1:1. See `FUTURE_BACKEND_CONTRACT.md` for the
planned tables.
