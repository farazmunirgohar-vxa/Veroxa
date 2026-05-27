# Veroxa — Fixture Coherence Audit

**Audit date:** 2026-05-27
**Scope:** planning only. **No fixture is edited by this audit.**

This document maps the major demo-fixture domains under
`artifacts/veroxa/src/data/demo/` to the portals and surfaces
that consume them, flags the most likely drift risks, and records
the safe future cleanup direction for each domain.

It is a **planning artifact** for a future, separately-gated
coherence pass. Nothing in this document authorizes code edits.

> **Hard invariants still apply.** See the current-state section
> at the top of [`BUILD_STATUS.md`](./BUILD_STATUS.md). `AUTH_MODE`
> remains `"placeholder"`, the portal stays disconnected from any
> real database, locked pricing is unchanged, the four-role and
> four-shell model is unchanged, no real AI / publishing / uploads
> / storage / Google integration is wired, and no real client or
> customer data is added.

---

## 1. How to use this document

For each fixture domain below:

- **Likely consumers** is a short list of portals / pages that
  read the fixture today. It is intentionally not exhaustive —
  treat it as a starting grep target, not a closed set.
- **Represents** describes what real-world data the fixture
  stands in for.
- **Drift risk** is the most likely way the fixture has become
  internally inconsistent or inconsistent with sibling fixtures.
- **Suggested future cleanup** is the safe action to plan, **not**
  to execute now.

A future, gated coherence pass should audit one domain at a time
and produce a per-domain diff plus a regression check.

---

## 2. Fixture domains

### 2.1 `demoClients`

- **Likely consumers:** owner shell (client roster / health
  surfaces), operator shell (client portfolio, priority board),
  the `ClientHealthEngine` (as input for health computation),
  onboarding surfaces, and the client shell's "which client am I
  viewing" wiring.
- **Represents:** the canonical list of demo restaurants /
  client accounts, their identifiers, plan tier, and basic
  metadata.
- **Drift risk:** **highest** — `demoClients` is the implicit
  primary key for several sibling fixtures (financials, health,
  reports, media). If a client id, slug, or display name shifts
  here without a coordinated update elsewhere, a sibling fixture
  silently dangles and the same client appears with different
  numbers across portals.
- **Suggested future cleanup:** freeze a canonical id + slug per
  client; add a tiny dev-only check that every sibling fixture's
  client reference resolves against `demoClients`.

### 2.2 `demoClientHealth`

- **Likely consumers:** `ClientHealthCenter` shared component,
  owner-client-health, operator-client-health, and the
  `ClientHealthEngine` as a per-client overlay.
- **Represents:** per-client health snapshot (level + drivers).
- **Drift risk:** vocabulary drift with `demoClientPriorities`
  and the engine output — already documented in
  [`CLIENT_HEALTH_ENGINE_CONTRACT.md`](./CLIENT_HEALTH_ENGINE_CONTRACT.md)
  §7 and
  [`CLIENT_HEALTH_SURFACE_MAP.md`](./CLIENT_HEALTH_SURFACE_MAP.md)
  §5. Secondary risk: client ids out of sync with §2.1.
- **Suggested future cleanup:** normalize the category field to
  the canonical `Healthy | Caution | Urgent | Broken` vocabulary
  as part of the health consolidation sequence; do not edit ahead
  of that gated pass.

### 2.3 `demoFinancials`

- **Likely consumers:** owner shell (executive dashboard,
  BI center, revenue / plan surfaces), operator shell where it
  reports plan / pricing summaries, and any "pricing context"
  banners.
- **Represents:** owner metrics, revenue trend, service plans,
  BI / media analytics.
- **Drift risk:** plan-tier prices drifting from the locked
  values in `pricing.tsx`. The locked pricing surface is a hard
  invariant; if any number in `demoServicePlans`, `demoBiMetrics`,
  or `demoMediaAnalytics` is derived from a plan price, it must
  match the locked values exactly.
- **Suggested future cleanup:** add a planning checklist that
  cross-references every plan-price-derived number in
  `demoFinancials` against the locked pricing in `pricing.tsx`.
  Read-only check; no edits.

### 2.4 `demoReports` (`demoWeeklyReports`, `demoMonthlyReports`)

- **Likely consumers:** client shell (reports page), operator
  shell (report approvals), owner shell (report rollups).
- **Represents:** weekly and monthly report rollups per client
  per period.
- **Drift risk:** report periods, client ids, or summary numbers
  that disagree across the weekly / monthly pair for the same
  client. Owner / operator rollups can over- or under-count if
  the pair is inconsistent.
- **Suggested future cleanup:** for each client, verify that the
  set of monthly reports is a complete cover of the set of weekly
  reports for the same period, and that summary numbers reconcile.
  Planning only.

### 2.5 `demoMedia` (`demoMediaAssets`, plus
`demoPosts`, `demoPostSlots`)

- **Likely consumers:** client shell (calendar, media gallery),
  team shell (media review, drafts, scheduling), operator shell
  (failed-posts surface), and the media runway widget.
- **Represents:** media asset inventory + scheduled / draft /
  published posts + runway availability.
- **Drift risk:** scheduled post slots that reference media asset
  ids that no longer exist, or post statuses that disagree with
  the assigned slot's state.
- **Suggested future cleanup:** verify every `demoPostSlots`
  reference resolves into `demoMediaAssets` and every
  `demoPosts` status is consistent with its slot. Read-only.

### 2.6 `demoAgents` (AI agent fixtures)

- **Likely consumers:** owner shell (AI control / AI review
  surfaces), team shell (AI review queue), operator surfaces
  that show AI suggestion volume.
- **Represents:** the demo's "AI agents" inventory, AI agent
  summary, suggestions feed, and the per-agent v2 detail. **All
  fixtures only — no real AI provider is wired.**
- **Drift risk:** `is_enabled=true` rows could be misread as
  "actually running" by a reader who skims the fixture without
  reading the current-state section of `BUILD_STATUS.md`. Also
  risk of agent counts / suggestion counts disagreeing across
  the summary, the v2 detail, and the suggestions feed.
- **Suggested future cleanup:** keep a fixed comment at the top
  of `demoAgents.ts` reaffirming "no AI provider wired; all
  `is_enabled` values are inert"; reconcile counts across
  `demoAiAgentSummary`, `demoAiAgentsV2`, and
  `demoAiSuggestions`. **Critically: never put real API keys,
  bearer tokens, signed URLs, or any other secret into any AI
  fixture, including `ai_agents.config_json`.**

### 2.7 `demoOperations` (work queue + review queue + metrics)

- **Likely consumers:** operator shell (work queue, content
  review queue, operator metrics, pipeline stages), and team
  shell where it surfaces queue-derived KPIs.
- **Represents:** the operator-facing work-in-flight pipeline:
  queue items, content review items, operator metrics,
  pipeline stages.
- **Drift risk:** queue items, review items, and pipeline stage
  counts that do not reconcile with each other or with the
  metrics aggregate; orphaned queue items referencing client
  ids that are not in `demoClients`.
- **Suggested future cleanup:** reconcile `demoWorkQueue` +
  `demoContentReviewQueue` against `demoOperatorMetrics` and
  `demoPipelineStage[]` so the operator dashboard "sum" view
  matches the underlying list views. Planning only.

### 2.8 `demoSystemStatus`

- **Likely consumers:** internal / dev pages
  (`internal-system-status`, `internal-architecture`), and the
  operator-facing `operator-system-status` page.
- **Represents:** the demo's representation of subsystem states
  (`Active` / `Not Connected` / `Placeholder`) plus the demo
  control presets.
- **Drift risk:** the status fixture saying "Active" for a
  subsystem that the current-state section of `BUILD_STATUS.md`
  explicitly documents as not wired (real AI, publishing,
  uploads, storage, Google integration). A reader could be
  misled.
- **Suggested future cleanup:** reconcile every `Active` row
  against the current-state section of `BUILD_STATUS.md` and
  flip to `Placeholder` or `Not Connected` where the underlying
  capability is not actually wired. Planning only — must be done
  alongside the docs/status owners.

---

## 3. Do Not Do Yet

The following actions are **out of scope** for this audit and
must not be executed as part of any "fixture coherence" pass
until the relevant gates are cleared:

- **Do not replace fixtures with Supabase reads.** All portals
  stay fixture / demo-first until the human dev-test gate for
  M001–M006 is cleared and the AUTH_MODE switch plan is
  re-evaluated.
- **Do not connect a real backend.** No new Supabase project
  wiring, no new env-var requirements, no real RLS-bound reads.
- **Do not change routing or navigation.** No new routes, no
  rename, no removal, no four-shell restructuring.
- **Do not add real client / restaurant / customer data.** Every
  fixture row must remain obviously fictional. No real business
  names, addresses, phone numbers, emails, or financial figures.
- **Do not add secrets, API keys, bearer tokens, or signed URLs**
  to any fixture, including AI agent configuration. The hard
  invariant on `ai_agents.config_json` applies to all fixtures.
- **Do not promote any SQL** from `docs/sql_drafts/` to
  `supabase/migrations/` as part of a fixture pass.
- **Do not edit `pricing.tsx`** or any locked pricing surface.
  The locked values (GPS 49700, COP 99700 / 109700 / 119700 /
  149700) are unchanged.

---

## 4. Acceptance for a future coherence pass

A future, separately-gated fixture coherence pass should:

1. Pick exactly one domain from §2 and scope itself to that
   domain.
2. Produce a per-domain reconciliation diff that does not change
   row counts, ids, or shapes unless the diff explicitly accounts
   for every consumer.
3. Add or update a regression check (dev-only, no runtime cost
   in production builds) that re-runs the reconciliation on every
   build.
4. Leave every "Do Not Do Yet" item in §3 untouched.
5. Update the relevant §2 entry in this document to "resolved".
