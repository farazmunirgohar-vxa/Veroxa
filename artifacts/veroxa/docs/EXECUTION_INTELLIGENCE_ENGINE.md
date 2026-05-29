# Execution Intelligence Engine

Rule-based foundation that turns a live client's execution state into a
structured retention picture: an execution-health score across dimensions, a
retention-risk read, a client-success-fit classification, the single best next
action, and a calm, client-safe to-do list.

Where **Lead Intelligence brings clients in**, **Execution Intelligence keeps
them**. The two engines feed each other: retention outcomes teach lead targeting
which clients to pursue, and lead patterns inform what good execution looks like.

Everything here is **deterministic, local, and production-shaped**. There is no
network, no model call, no auto-send/call/text/publish, and no automatic
decision. The engine classifies, scores, and recommends; a **human always
decides** retention actions.

> **Safety stance — execution never blames the client.** Risk is always framed
> as **fixable inputs** (e.g. "fresh photos help us keep posting"), never as
> client fault. Full risk detail (levels, reasons, team-only notes) is
> **team-only**. Client-facing surfaces show calm, respectful language with no
> risk levels, scores, or blame, and **no guarantees** (rankings, walk-ins,
> revenue, sales).

## Where it lives

```
artifacts/veroxa/src/lib/executionIntelligence/
  executionIntelligenceTypes.ts   # types + label maps (categories, dimensions, risk reasons, fit)
  executionScoringEngine.ts       # analyzeExecutionIntelligence(input) + executionInputFromClientId(id) + allClientExecutionProfiles()
  retentionRiskEngine.ts          # buildRetentionRisk() / detectRetentionRisks() — level, reason, client-safe + team-only wording, human-approval flag
  clientSuccessFitEngine.ts       # classifyClientSuccessFit() / explainClientSuccessFit() — why retain / why churn / next action / lead-gen lesson
  executionLearningSignals.ts     # computeExecutionLearningSignals() / retentionRateBySegment() + ExecutionOutcomeRecord
```

The growth flywheel and the lead engine's learning layer build on top of this:

- `src/lib/growthFlywheel/` — connects lead + execution signals (see
  `VEROXA_GROWTH_FLYWHEEL.md`).
- `src/lib/leadIntelligence/selfImprovingLeadEngine.ts` — optionally consumes
  execution/retention outcomes to bias targeting toward clients who retain (see
  `SELF_IMPROVING_LEAD_ENGINE.md`).

UI surfaces:

- `src/components/ExecutionIntelligencePanel.tsx` — team surfaces:
  `ExecutionIntelligenceSummaryStrip` (counts), `ExecutionHealthList`
  (per-client health + single next action + team-only risk badges), and
  `EngineCompetitionPanel` (Lead vs Execution side-by-side).
- `src/pages/team-dashboard.tsx` — Engine Competition panel + execution
  summary/health.
- `src/pages/team-work-queue.tsx` — per-client execution health + next action.
- `src/components/ClientExecutionReinforcement.tsx` — **client-safe** calm
  surfaces (`ClientKeepMovingCard`, `ClientMediaReinforcement`,
  `ClientRequestsClarity`, `ClientReportsProgress`), wired into the client
  dashboard, media, requests, and reports pages.

## Data flow

1. A demo client's live state is read from the existing fixtures and the real
   workflow foundation — `demoClientHealth` / `demoMediaRunway` and
   `clientTeamWorkRepository` submissions.
2. `executionInputFromClientId(clientId)` maps that state into a
   storage-decoupled `ExecutionSignalInput` (media supply, posting consistency,
   visibility, review activity, onboarding completeness, report status, and work
   queue completion).
3. `analyzeExecutionIntelligence(input)` scores each execution dimension, rolls
   up an overall health score + category, attaches the retention-risk read and
   client-success-fit classification, derives the single best next action, and
   produces the calm `clientNeedsToProvide` list.
4. `allClientExecutionProfiles()` runs step 2–3 across every demo client for the
   team summary/health surfaces.

## Dimensions

Execution health is a roll-up of independently scored inputs, each framed as a
**fixable input** rather than a fault:

- Media supply (is there fresh material to post?)
- Posting consistency
- Google / local visibility signal
- Review activity
- Onboarding completeness
- Report status
- Work-queue completion

## Retention risk (team-only)

`retentionRiskEngine.ts` reads the dimensions and emits zero or more risks, each
with: a risk **level**, a **reason** (always a fixable input), a **recommended
action**, **client-safe wording** (calm, blame-free — safe to paraphrase to the
client), a **team-only note** (full internal detail), and
`humanApprovalRequired: true`. Nothing here is shown to clients directly.

## Client success fit

`clientSuccessFitEngine.ts` classifies the client into a fit category and
explains **why they are likely to retain**, **what could cause churn** (as
fixable inputs), the **next action**, and a **lead-gen lesson** — the feedback
that execution sends back to lead targeting.

## Learning signals → lead engine

`executionLearningSignals.ts` turns logged `ExecutionOutcomeRecord`s into
cautious, bounded signals (e.g. retention rate by segment, retained-client
patterns). `selfImprovingLeadEngine.buildSelfImprovementSnapshot()` optionally
accepts these outcomes and exposes `retentionInformedTargeting` so lead
prospecting can lean toward client types that actually stay — always as a
human-weighed suggestion, never a rule or guarantee.

## Guardrails recap

- No auto-send / call / message / publish; no payments / notifications.
- No Owner/Operator edits; Free Audit V1 untouched.
- No guarantees (rankings, walk-ins, revenue, sales); no fake performance claims.
- No real backend writes — local, production-shaped storage only.
- Execution **never** blames the client; risk detail is team-only; client
  language stays calm and respectful.
- AI classifies/scores/recommends; a human decides retention.
