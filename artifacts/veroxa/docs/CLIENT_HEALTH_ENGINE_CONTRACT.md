# Client Health Engine — Authoritative Contract

**Status:** documentation only. No runtime behavior changes.
**Source of truth:** `src/domain/clientHealth/engine.ts` (`ClientHealthEngine`).
**Companion doc:** `CLIENT_HEALTH_SURFACE_MAP.md` (per-page inventory).
**Hard invariants apply:** placeholder auth, fixtures only, no real DB, no AI.

This document declares which values are authoritative for client health
across the Veroxa portals. Any page rendering a health-derived value
should ultimately read from this engine. Where it doesn't yet, the page
carries a TODO marker pointing back to this contract.

---

## 1. Engine surface

### 1.1 Category vocabulary

```text
type CHCHealthCategory = "Healthy" | "Caution" | "Urgent" | "Broken";
```

| Category | Rule | Meaning |
| --- | --- | --- |
| `Healthy` | `daysRemaining >= 14` and `totalUnused > 0` | 2+ weeks of content runway |
| `Caution` | `7 <= daysRemaining < 14` and `totalUnused > 0` | 1–2 weeks runway |
| `Urgent` | `1 <= daysRemaining < 7` and `totalUnused > 0` | <1 week runway |
| `Broken` | `totalUnused === 0` | No usable media items |

This is the **only** authoritative category set. The `Excellent / Healthy
/ Warning / Critical` set used by `demoClientPriorities` and the
`healthy / attention / critical` set used by `demoClientHealth.level`
are non-canonical demo vocabularies. They render today, but they do
not derive from the engine. See section 4.

### 1.2 Authoritative outputs

| Method | Returns | Authoritative? |
| --- | --- | --- |
| `profiles()` | `CHCClientProfile[]` sorted Broken → Urgent → Caution → Healthy | yes |
| `portfolioSummary()` | `CHCPortfolioSummary` (totals + at-risk + revenue at risk) | yes |
| `needingMedia()` | `CHCClientProfile[]` (Urgent ∪ Broken) | yes |
| `awaitingDrafts()` | `CHCClientProfile[]` (filtered by pipeline stage) | yes |
| `awaitingScheduling()` | `CHCClientProfile[]` (filtered by pipeline stage/status) | yes |
| `awaitingReports()` | `CHCClientProfile[]` (`reportStatus ∈ {Pending, Draft, Overdue}`) | yes |
| `ownerRisks()` | `demoOwnerCommandItems` filtered by severity Critical/High | yes (passthrough) |

### 1.3 `CHCClientProfile` — authoritative per-client shape

```text
clientId, name, cuisine,
planType, accountStatus,
weeklyPostingCommit,
unusedMediaCount, weeksOfContentLeft, daysOfContentLeft,
lastUploadDate, lastPublishedPost,
openAlertsCount, monthlyReportStatus,
healthCategory,  // CANONICAL
healthScore,     // numeric meter (0–100), reused from demoClientHealth.score
mainIssue, recommendedAction
```

Notes:

- `healthCategory` is computed by the engine and is canonical.
- `healthScore` is currently a passthrough from `demoClientHealth.score`
  used to drive the meter. It is **not** computed from the category and
  may not agree with it. Treat `healthCategory` as primary; `healthScore`
  as cosmetic until a future scoring rule lands.
- `mainIssue` and `recommendedAction` come from `demoClientHealth` and
  are not synthesized from runway facts. Treat them as curated text.
- `revenueAtRisk` uses an internal `demoPlanPrice` lookup that is
  authoritative for the engine only. It is **not** the locked public
  pricing surface — pricing for marketing/checkout lives in
  `pages/pricing.tsx` and the locked invariant values
  (49700 / 99700 / 109700 / 119700 / 149700). Do not unify these two
  numbers without first updating the locked-pricing invariant.

### 1.4 What the engine deliberately does not provide today

- Historical/time-series client health (no `clientHealthOverTime`).
  `demoBiMetrics.clientHealthOverTime` in the BI center is a separate
  fixture and is not derivable from the engine in this phase.
- Per-team-member contribution score. `team-performance.tsx` renders
  a per-member "health score" that is a personnel metric, not a
  per-client engine output. The label collision is intentional in the
  fixture but should not be read as engine output.
- Numeric portfolio "health average" percentage. The engine exposes
  category counts, not a single rolled-up percentage. Pages that
  render a `clientHealthAverage` % today read it from
  `demoOwnerMetrics`, not from the engine.

---

## 2. Direct engine consumers (today)

- `pages/client-health-command.tsx` — the only direct consumer.
- `components/clientHealth/CommandCard.tsx` — imports engine types only.

All other health-rendering pages bypass the engine. See
`CLIENT_HEALTH_SURFACE_MAP.md` §2 for the full list.

---

## 3. Contract for non-engine surfaces (interim)

While we cannot refactor any UI in this pass (hard invariants 9–10
and "no behavior changes" acceptance criterion for T03/T04), the
following rules apply going forward:

1. Any new page that renders per-client health categories MUST read
   `ClientHealthEngine.profiles()` and use the canonical vocabulary
   (§1.1). It MUST NOT introduce a fourth vocabulary.
2. Any new page that renders portfolio-level health counts MUST read
   `ClientHealthEngine.portfolioSummary()`. It MUST NOT add a new
   "average %" without first defining how it derives from the engine.
3. Any change that adds a numeric `healthScore` derivation MUST update
   §1.3 of this document in the same change.
4. Direct reads of `demoClientHealth` from page-level code are
   discouraged. Reads remain allowed only from the shared widget
   (`ClientHealthCenter`) and the internal/dev surface until a future
   refactor task migrates them. Existing reads are tagged with TODO
   markers (see §5).

---

## 4. Vocabulary mapping (advisory, non-binding)

The engine vocabulary is the only authoritative set. The two
non-canonical vocabularies currently rendered are listed here for
reference so future work can converge them. **Do not implement these
mappings in code in this pass** — that is a behavior change.

| Engine (canonical) | `demoClientPriorities.healthStatus` | `demoClientHealth.level` |
| --- | --- | --- |
| `Broken` | `Critical` | `critical` |
| `Urgent` | `Warning` | `attention` |
| `Caution` | `Healthy` (low end) | `healthy` (low end) |
| `Healthy` | `Healthy` / `Excellent` | `healthy` |

The cross-vocabulary boundaries are fuzzy because the non-canonical
fixtures were authored independently of the engine's runway rule. A
proper convergence requires either (a) deriving the non-canonical
fixtures from the engine, or (b) replacing the relevant page reads
with engine reads. Both are out of scope for this pass.

---

## 5. Latest audit — health-source inconsistencies

**Audit date:** 2026-05-27.
**Scope:** pages named in T03 and T04 of the current pass plus the
shared `ClientHealthCenter` widget. Every item below is also flagged
as a TODO comment in the referenced source file. None of the audit
items represents a fix in this pass — they are documented drift only.

### 5.1 Owner shell

#### `pages/owner-client-health.tsx`
- **Drift:** renders the portfolio health center via
  `ClientHealthCenter`, which reads `demoClientHealth` directly with
  the `healthy / attention / critical` vocabulary.
- **Engine output ignored:** `ClientHealthEngine.profiles()` and
  `portfolioSummary()`.
- **Numeric mismatch:** `demoClientHealth` has four entries
  (mamadali, urban, crescent, alnoor) with levels
  `healthy / attention / healthy / critical`. The engine would emit
  categories based on `demoMediaRunway.daysRemaining`, which can
  differ from those levels for the same client.

#### `pages/owner-executive-dashboard.tsx`
- **Drift:** `clientHealthAverage` tile and "Client health"
  distribution bars read from `demoOwnerMetrics.clientHealthAverage`
  (single hard-coded percentage) and `demoClientHealthDistribution`
  (Excellent/Healthy/Warning/Critical counts).
- **Engine output ignored:** `portfolioSummary()` provides
  `healthy / caution / urgent / broken` counts that could drive
  this card; the page does not consume it.
- **Vocabulary mismatch:** distribution uses
  `Excellent / Healthy / Warning / Critical` (4 buckets) vs engine's
  `Healthy / Caution / Urgent / Broken` (4 buckets, different names).
- **Numeric mismatch:** the % shown is not derivable from any engine
  output today — the engine does not expose a portfolio %.

#### `pages/owner-daily-briefing.tsx`
- **Drift:** "Health" pill uses `demoOwnerMetrics.clientHealthAverage`;
  "Risks 2 / 1" pill is a hard-coded literal string.
- **Engine output ignored:** `portfolioSummary().atRisk`,
  `portfolioSummary().broken`, and `ownerRisks()` could supply both
  pills.
- **Numeric mismatch:** the "2 / 1" string is not bound to any
  fixture — it could drift from any other page silently.

### 5.2 Operator / team shell

#### `pages/operator-client-health.tsx`
- **Drift:** identical to `owner-client-health.tsx` — renders
  `ClientHealthCenter` which reads `demoClientHealth` directly.
- **Engine output ignored:** all engine outputs.

#### `pages/operator-priority-board.tsx`
- **Drift:** consumes `demoClientPriorities`, a fixture authored
  independently of the engine, using vocabulary
  `Critical / High / Normal / Low` for priority and
  `Excellent / Healthy / Warning / Critical` for health status.
- **Engine output ignored:** `needingMedia()` plus a derived
  priority order would naturally produce the same board.
- **Vocabulary mismatch:** uses the priority/distribution vocabulary
  rather than the engine's category vocabulary.

#### `pages/team-dashboard.tsx`
- **Drift:** no per-client health rendered, but the
  "Clients Needing Attention" tile reads
  `demoTeamMetrics.clientsNeedingAttention`, a literal count that is
  not bound to `portfolioSummary().atRisk`.
- **Engine output ignored:** `portfolioSummary().atRisk`.
- **Numeric mismatch:** the tile could silently disagree with the
  engine count.

#### `pages/team-performance.tsx`
- **Drift:** renders a per-team-member `clientHealthScore` and a
  "Portfolio health avg" rolled up across team members.
- **Engine output ignored:** none directly applicable — the engine
  does not produce per-member metrics today. The drift is a **label
  collision**: the page uses the phrase "Client health contribution"
  and "Portfolio health avg" for what is in fact a personnel-side
  metric, which is easily confused with the canonical client health
  vocabulary.
- **Numeric mismatch:** the team page's "Portfolio health avg" is
  the average of per-member contribution scores; the executive
  dashboard's "Client health avg" is a hard-coded portfolio %; the
  engine emits neither. All three numbers can disagree.

### 5.3 Shared component

#### `components/ClientHealthCenter.tsx`
- **Drift:** reads `demoClientHealth` directly and renders sorted
  cards using `level: healthy / attention / critical`.
- **Engine output ignored:** `profiles()` already exposes both the
  curated `mainIssue / recommendedAction / healthScore` fields
  (passthrough) and the canonical `healthCategory`. The widget could
  drive the same UI from `profiles()` without losing information.
- **Impact:** this single widget is the root cause of the
  owner-client-health and operator-client-health drift listed above.
  Migrating the widget alone would remediate two of the seven audited
  pages.

### 5.4 Out-of-scope this pass (tracked for future work)

- `pages/owner-client-analytics.tsx` — uses
  `priority?.healthStatus` plus a hard-coded
  `95 / 82 / 60 / 32` score mapping. Not part of T03/T04 file list.
- `pages/owner-bi-center.tsx` — renders
  `demoBiMetrics.clientHealthOverTime`; engine has no historical
  output to align against today.
- `pages/internal-client-detail.tsx` — dev tool, reads
  `demoClientHealth` directly.

---

## 6. Acceptance for any future remediation

A future task that migrates a non-engine surface to the engine MUST:

1. Read from `ClientHealthEngine` (not `demoClientHealth` directly).
2. Render the canonical category vocabulary (§1.1) or document why a
   mapping is required and update §4 of this document.
3. Leave the locked pricing surface (`pages/pricing.tsx`) untouched.
4. Not flip `AUTH_MODE`, not connect to Supabase, not promote any SQL
   to `supabase/migrations/`.
5. Update §5 of this document to reflect the resolved drift.

---

## 7. Health Vocabulary Drift (planning only — 2026-05-27)

This section documents the current vocabulary drift across the
codebase and records a **future** consolidation plan. **No runtime
behavior is changed by this section.** It exists so a future, gated
remediation task can proceed against a written plan instead of
inferring intent from grep results.

### 7.1 Current competing vocabularies

Three independent health vocabularies are in use today. They do
not have an authoritative mapping in code.

| Source | Vocabulary | Used by |
|---|---|---|
| `ClientHealthEngine` (`lib/client-health/engine.ts`) | `Healthy` / `Caution` / `Urgent` / `Broken` | Owner and operator surfaces that consume the engine directly (see §2). Canonical for engine consumers. |
| `demoClientPriorities` (fixture) | `Excellent` / `Healthy` / `Warning` / `Critical` | Owner overview / priority surfaces that read the fixture directly without the engine. |
| `demoClientHealth` (fixture) | `healthy` / `attention` / `critical` | `ClientHealthCenter` shared component and any page that renders it (owner-client-health, operator-client-health). |

The advisory mapping in §4 is **non-binding** — it exists so
reviewers can reason about equivalence at audit time, not so code
can do automatic translation.

### 7.2 Recommended future canonical vocabulary

**Recommendation (not yet implemented):** adopt the
`ClientHealthEngine` four-state vocabulary
(`Healthy | Caution | Urgent | Broken`) as the single canonical
output for every consumer.

**Why this vocabulary:**

- It is the only vocabulary already produced by the
  `ClientHealthEngine`, the documented source of truth (§1).
- It has four states, which preserves the actionable granularity
  of `demoClientPriorities` (`Excellent/Healthy/Warning/Critical`)
  without losing the "Broken" state that signals data is missing
  or invalid (which the three-state `demoClientHealth`
  vocabulary cannot express).
- It already drives §1.2 acceptance criteria — adopting it as
  canonical does not require widening the engine contract.

This recommendation is advisory only. A future consolidation task
must re-confirm it before code edits.

### 7.3 Future consolidation sequence (do not run yet)

A future, separately-gated remediation pass should execute these
steps **in this order**, and must be split into per-step PRs so
each step ships with its own acceptance test:

1. **Map all labels.** Produce a complete, authoritative mapping
   table from every legacy label to the canonical
   `Healthy | Caution | Urgent | Broken` vocabulary. Land the
   table here in §4 and freeze it.
2. **Normalize fixtures.** Update `demoClientPriorities` and
   `demoClientHealth` so their stored category fields use the
   canonical vocabulary; keep any human-readable labels as
   separate display strings. Verify every fixture row's category
   matches its underlying numeric / risk signals.
3. **Update owner surfaces.** Migrate every page listed in §5.1
   (`owner-client-health`, `owner-executive-dashboard`,
   `owner-daily-briefing`) to render the canonical vocabulary,
   either by consuming `ClientHealthEngine` directly or by
   reading the normalized fixture fields from step 2.
4. **Update operator surfaces.** Migrate every page listed in
   §5.2 (`operator-client-health`, `operator-priority-board`,
   `team-dashboard`, `team-performance`).
5. **Update team surfaces.** Migrate any team-shell consumer of
   `ClientHealthCenter` or `demoClientHealth` and remove the
   shared component's internal `healthy/attention/critical`
   mapping in favor of the canonical vocabulary.
6. **Verify client-facing labels.** Re-render every client-shell
   page to confirm no client-visible copy has regressed (the
   client shell intentionally surfaces fewer health categories;
   the consolidation must preserve that reduction).

Each step's acceptance gate is the corresponding §5 sub-section
of this document being updated to "resolved".

### 7.4 Explicit no-change note for this pass

**No runtime behavior changes in this pass.** This planning
section is documentation only. Specifically:

- No fixture values were edited.
- No page component was edited.
- The `ClientHealthEngine` outputs are unchanged.
- The advisory mapping in §4 remains non-binding.
- The hard invariants in the top-of-file BUILD_STATUS current-
  state section still apply: `AUTH_MODE` stays `"placeholder"`,
  no Supabase connection, no SQL promotion, no real provider
  wiring, no routing or shell changes.
