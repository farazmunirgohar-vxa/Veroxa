# Client Health Surface Map

**Status:** documentation only. No runtime behavior changes.
**Scope:** every page in `artifacts/veroxa/src/` that renders a client health
score, health category, risk state, or health-derived KPI.
**Hard invariants apply:** placeholder auth, fixtures only, no real DB.

This map is the input to `CLIENT_HEALTH_ENGINE_CONTRACT.md`. Use it to see
at a glance which pages share a source of truth and which currently drift.

---

## 1. Canonical source

The intended source of truth for per-client health is:

- **`src/domain/clientHealth/engine.ts`** — `ClientHealthEngine`
  - Inputs: `demoRestaurants`, `demoRestaurantProfiles`, `demoMediaRunway`,
    `demoMediaItems`, `demoContentPipelineItems`, `demoTeamAlerts`,
    `demoClientHealth`, `demoOwnerCommandItems`.
  - Outputs (see `CLIENT_HEALTH_ENGINE_CONTRACT.md`): `profiles()`,
    `portfolioSummary()`, `needingMedia()`, `awaitingDrafts()`,
    `awaitingScheduling()`, `awaitingReports()`, `ownerRisks()`.
  - Category vocabulary: `Healthy | Caution | Urgent | Broken`.

Surfaces in section 2 are graded against this engine.

---

## 2. Per-page health surface inventory

Columns:

- **Page** — file under `src/pages/` (or `src/components/` for shared widgets).
- **Shell** — owner / operator / team / client / internal.
- **Health element rendered** — what the user actually sees that is health-derived.
- **Source dataset used** — exactly what the page reads today.
- **Engine-aligned?** — yes / partial / no (full drift detail in
  `CLIENT_HEALTH_ENGINE_CONTRACT.md` §Latest audit).

### Owner shell

| Page | Health element rendered | Source dataset used | Engine-aligned? |
| --- | --- | --- | --- |
| `pages/owner-client-health.tsx` | Portfolio health center (per-client cards + summary) | `components/ClientHealthCenter.tsx` → `demoClientHealth` (level/score/signals) | no (uses fixture directly, not engine) |
| `pages/owner-executive-dashboard.tsx` | "Client health avg" tile, "Client health" distribution bars | `demoOwnerMetrics.clientHealthAverage`, `demoClientHealthDistribution` | no (hard-coded aggregates) |
| `pages/owner-daily-briefing.tsx` | "Health" pill, "Risks 2 / 1" pill | `demoOwnerMetrics.clientHealthAverage`, hard-coded `"2 / 1"` string | no |
| `pages/owner-client-analytics.tsx` | "Health status" stat, "Health score" card with progress bar (hard-coded 95/82/60/32 mapping by status) | `demoClientPriorities.healthStatus` | no (separate vocabulary + hard-coded score mapping) |
| `pages/owner-bi-center.tsx` | "Client health avg" time-series chart | `demoBiMetrics.clientHealthOverTime` | n/a (time series — engine has no historical output today) |
| `pages/owner-daily-briefing.tsx` | "Risk Summary", "Client Summary" briefing sections | `demoOwnerBriefing` (curated text) | n/a (narrative copy, not numeric health) |

### Operator shell

| Page | Health element rendered | Source dataset used | Engine-aligned? |
| --- | --- | --- | --- |
| `pages/operator-client-health.tsx` | Per-client health center (same widget as owner) | `components/ClientHealthCenter.tsx` → `demoClientHealth` | no (same drift as owner-client-health) |
| `pages/operator-priority-board.tsx` | Priority cards w/ health status icon + label per client; portfolio sort | `demoClientPriorities` (separate fixture; vocabulary `Excellent / Healthy / Warning / Critical`) | no (independent fixture, different vocabulary) |

### Team shell

| Page | Health element rendered | Source dataset used | Engine-aligned? |
| --- | --- | --- | --- |
| `pages/team-dashboard.tsx` | "Clients Needing Attention" tile, "Media Alerts" tile (health-adjacent), "Active Alerts" panel | `demoTeamMetrics`, `demoTeamAlerts` | n/a (no per-client health rendered) |
| `pages/team-performance.tsx` | "Health score" big number per team member, "Client health contribution %" progress per member, "Portfolio health avg" summary | `demoTeamMembers[].clientHealthScore` | no (per-member metric reusing the label "client health"; not a client-derived value) |

### Client shell

| Page | Health element rendered | Source dataset used | Engine-aligned? |
| --- | --- | --- | --- |
| `pages/client-health-command.tsx` | All four CHC blocks: portfolio summary, per-client profile cards, team work splits, owner risks | `ClientHealthEngine.{profiles, portfolioSummary, needingMedia, awaitingDrafts, awaitingScheduling, awaitingReports, ownerRisks}` | yes — only direct engine consumer in the app |
| `pages/client-dashboard.tsx` | No health-specific surface | — | n/a |

### Internal / dev

| Page | Health element rendered | Source dataset used | Engine-aligned? |
| --- | --- | --- | --- |
| `pages/internal-client-detail.tsx` | Per-client health detail panel (dev tool) | reads `demoClientHealth` | no (fixture-direct; internal only) |
| `pages/internal-demo-controls.tsx` | Demo control surface; may reference health for resets | `demoClientHealth` | n/a (control surface, not user-facing) |

### Shared components

| Component | Where it renders | Source dataset used | Engine-aligned? |
| --- | --- | --- | --- |
| `components/ClientHealthCenter.tsx` | owner-client-health, operator-client-health | `demoClientHealth` (`healthy / attention / critical`) | no — primary driver of cross-shell drift |
| `components/clientHealth/CommandCard.tsx` | client-health-command | engine types only (`CHCClientProfile`, `CHCHealthCategory`) | yes |

---

## 3. Vocabulary observed across surfaces

The app currently uses **three** distinct health vocabularies in parallel:

1. **Engine (canonical)** — `Healthy | Caution | Urgent | Broken`.
2. **Distribution / priority** — `Excellent | Healthy | Warning | Critical`.
   Used by `demoClientHealthDistribution`, `demoClientPriorities`,
   `owner-executive-dashboard`, `operator-priority-board`,
   `owner-client-analytics`.
3. **`demoClientHealth.level`** — `healthy | attention | critical`.
   Used by `ClientHealthCenter`, therefore by
   `owner-client-health` and `operator-client-health`.

These three vocabularies are not mapped to each other in code. This is the
primary structural drift and the reason a numeric "client health avg"
shown in one page is not derivable from any other page.

---

## 4. What this map intentionally excludes

- No code edits. Inventory only.
- Does not propose a remediation plan — that belongs in
  `CLIENT_HEALTH_ENGINE_CONTRACT.md` and any future refactor task.
- Does not propose a navigation, shell, or fixture change — those are
  hard-invariant violations under the current gate.
- Does not promote any SQL or backend work — the engine remains
  fixture-driven during the placeholder phase.
