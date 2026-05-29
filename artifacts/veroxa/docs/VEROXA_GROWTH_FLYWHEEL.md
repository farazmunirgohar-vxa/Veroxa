# Veroxa Growth Flywheel

The flywheel connects Veroxa's two intelligence engines into one self-reinforcing
loop:

```
   Lead Intelligence  ──brings clients──►  Execution Intelligence
          ▲                                        │
          └──────── retention teaches ─────────────┘
                  who to pursue next
```

- **Lead Intelligence brings clients in** (scoring, segmenting, outreach drafts).
- **Execution Intelligence keeps them** (health, retention risk, success fit).
- **Each feeds the other.** Retention outcomes tell lead targeting which client
  types actually stay; lead patterns inform what a healthy onboarding looks like.

Everything here is **deterministic, local, and production-shaped**. There is no
network, no model call, no auto-send/call/text/publish, and no automatic
decision. The flywheel surfaces feedback and recommendations; a **human always
decides**. No guarantees (rankings, walk-ins, revenue, sales) are ever made.

## Where it lives

```
artifacts/veroxa/src/lib/growthFlywheel/
  growthFlywheelTypes.ts    # GrowthFlywheelSignal + feedback/recommendation types + labels
  growthFlywheelEngine.ts   # buildGrowthFlywheel() — joins lead + execution signals
```

Inputs come from the two engines:

- Lead side: `src/lib/leadIntelligence/` (scoring + self-improving learning).
- Execution side: `src/lib/executionIntelligence/` (health, retention, fit,
  learning signals).

## Data flow

1. Execution Intelligence produces per-client health, retention risk, success
   fit, and `ExecutionOutcomeRecord`-derived learning signals.
2. Lead Intelligence produces per-lead scores, segments, and its self-improving
   snapshot.
3. `buildGrowthFlywheel(...)` joins both sides into `GrowthFlywheelSignal`s:
   each is a feedback item (what retention is teaching lead-gen, or vice versa)
   plus a cautious recommendation for a human to weigh.
4. The lead engine's `buildSelfImprovementSnapshot()` can consume execution
   outcomes directly via its optional `executionOutcomes` parameter, exposing
   `retentionInformedTargeting` so prospecting leans toward client types that
   retain.

## Engine Competition (UI framing)

The team dashboard renders an **Engine Competition** panel
(`EngineCompetitionPanel` in `ExecutionIntelligencePanel.tsx`) that shows Lead
vs Execution side-by-side. It is a motivational, at-a-glance read of "are we
bringing clients in and keeping them?" — not a scoreboard with guarantees.

## Guardrails recap

- No auto-send / call / message / publish; no payments / notifications.
- No Owner/Operator edits; Free Audit V1 untouched.
- No guarantees; no fake performance claims.
- No real backend writes — local, production-shaped storage only.
- Execution feedback never blames the client; client-facing language stays calm.
- The flywheel recommends; a human decides.

See `EXECUTION_INTELLIGENCE_ENGINE.md`, `LEAD_INTELLIGENCE_OUTREACH_ENGINE.md`,
and `SELF_IMPROVING_LEAD_ENGINE.md` for the engines it joins.
