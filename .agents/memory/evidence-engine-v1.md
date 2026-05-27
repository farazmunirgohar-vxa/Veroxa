---
name: Evidence Engine V1 architecture
description: Demo-only deterministic rule engine pattern for Veroxa — data layout, component structure, and hard invariants.
---

## Rule
All recommendation outputs carry `demoOnly: true` as a non-optional field (enforced by TypeScript). The engine never calls any AI API, external API, or database.

**Why:** The project brief requires a "demo-only, no real AI" invariant. `demoOnly: true` is the structural sentinel that makes violations visible at compile time.

**How to apply:** Any new recommendation type added to `evidenceSelectionEngine.ts` must include `demoOnly: true` in its return interface.

## Data layout
- `src/data/demo/demoEvidenceMemory.ts` — three const arrays: `demoEvidencePastPosts`, `demoEvidenceMediaSignals`, `demoEvidenceClientContexts`
- `src/lib/evidence/evidenceSelectionEngine.ts` — 8 pure functions; no side effects
- `src/components/evidence/` — 4 components: EvidenceReasonStack, EvidenceScoreCard, EvidenceRecommendationCard (3 variants: client/team/operator), EvidenceMemoryTimeline

## EvidenceRecommendationCard variants
- `client` — shows 3 reasons max, no risk notes, has CTA href
- `team` — shows all reasons, no risk notes, has action buttons (demo-only)
- `operator` — shows all reasons + risk notes, no action buttons

## Confidence score cap
Always capped at 97 (never 100) — reflects demo state.

## Media composite score
`qualityScore × 0.5 + freshness + lighting + clarity − risk_penalty`, capped at 100.
