> **Pre-build stability checklist:** see [`docs/PRE_BUILD_STABILITY_CHECKLIST.md`](./PRE_BUILD_STABILITY_CHECKLIST.md) before large builds to protect deploy config, temp login, audit search, pricing, metadata, and SaaS safety.
>
> **2026-05-30 — Portal separation and first-5-client readiness lock**
>
> Current active routing is now: public demo only at `/demo/client/dashboard`, real Client Portal review routes under `/client/*`, and real Team/Internal Admin review routes under `/team/*`. Team Demo / `/demo/team/*` is deprecated/not active and must not be promoted by public pages or used as a login destination. Client-side readiness remains first; heavy Team/Internal Admin AI automation comes later. The first 5 real clients are the pre-launch readiness benchmark.
>
> **2026-05-30 — Current locked pricing correction**
>
> Current public pricing is now the Starter / Growth / Premium model:
>
> - Starter: **$295/mo**
> - Growth: **$495/mo**
> - Premium: **$995/mo**
> - No contract; cancel anytime
> - Google Optimization and Facebook + Instagram are included in all plans
> - Current locked pricing correction: Starter max 3 posts/week; Growth has no public daily-posting cap and is differentiated by reels, TikTok, better support/stronger communication, stronger consistency, weekly updates, monthly report, and stronger workflow; Premium max 1 post/day with ad management, readiness/client approval, agreed ad budget, and separate ad spend
> - Posting depends on usable client-provided media and may slow when usable media is unavailable
> - Premium requires readiness assessment, client approval, and agreed ad budget
> - Ad spend is always separate and paid directly by the restaurant
>
> Previous Complete Online Presence / founding-client pricing entries in this
> document are historical/deprecated only and are not current public pricing.

> **2026-05-29 — Historical/deprecated founding-client pricing model (not current)**
>
> Historical note only. This reflected a previous founding-client pricing pass and is now deprecated. It is NOT current public pricing. The historical values were:
>
> - Complete Online Presence: **$977/mo** standard, **$488/mo** founding first year (50% off)
> - Ads Management add-on: **+$477/mo** flat — no founding discount on ads
> - Combined standard total: **$1,454/mo** (COP + Ads, before ad spend)
> - Combined founding first-year total: **$965/mo** (founding COP + Ads)
> - Ad spend is always separate
>
> Changes made:
>
> - `veroxaPricing.ts` updated: COP at $977/$488, ads_addon at $477/$477,
>   term-based exports removed, combined totals corrected.
> - `pricing.tsx` rebuilt: founding model with 2-card standard/founding
>   layout, combined totals 2-row table, updated FAQ.
> - `services.tsx` Ads section corrected to +$477/mo.
> - `PRICING_SOURCE_OF_TRUTH.md` and `PUBLIC_PRICING_AND_SERVICES.md`
>   rewritten to reflect the founding model.
> - Internal plans `google_optimization` (retired, $477) and `ads_standalone`
>   (hidden, $2,000) kept in `veroxaPricing.ts` for Free Audit /
>   lead-scoring backward compat. Not shown publicly.
> - Typecheck passes: `pnpm --filter @workspace/veroxa run typecheck`.
> - Files **not** changed in that historical pass: Free Audit engines, Supabase auth/schema, demo
>   fixtures, backend enums, AI/lead engines, App.tsx routing, nav files.

> **2026-05-30 — Current active-role model.** Veroxa now has only two active roles: `client` and `team`. Operator and owner references below are historical / legacy-demo notes only and are not active product surfaces unless explicitly requested.

> **Historical reference (pre-2026-05-27).** Pricing and fixture-ID values in this document are out of date. Current source of truth: `docs/PRICING_SOURCE_OF_TRUTH.md` and `src/data/pricing/veroxaPricing.ts`. Fixture IDs are now `demo-a` / `demo-b` / `demo-c` / `demo-d`.

## Latest update — M038–M042 First-Client Operating Flow Hardening (2026-05-30)

- Shared workflow helpers now drive client-visible progress, client input requests, team priority work, team queue groups, and workflow-derived alerts.
- Client Dashboard and Client Requests render from `WorkflowItem` helpers with client-safe labels and no internal system language.
- Team Dashboard, Team Work Queue, and Team Alert Center use the same workflow helper layer for summary counts, review-ready work, client follow-up, queue/hold items, and alert reasons.
- Team review buttons remain local React state only; no writes, storage, publishing, external APIs, auth changes, data-mode changes, migrations, or pricing changes.
- Full details: `docs/M038_M042_FIRST_CLIENT_OPS_HARDENING.md`.

---

## Latest update — M033–M037 Adaptive Lead Source Engine (2026-05-28)

- Lead source taxonomy expanded from 5 values to 45+ across 6 categories
  (direct outreach, website/self-selling, relationship, proof-based,
  campaign/event, other). Labels and category maps added; backward-safe
  fallback for legacy values.
- Internal Lead Source Quality Score (100 pts, 8 categories) added in
  `leadSourceScoring.ts`. Scores are internal only — never shown to
  restaurants.
- Team Lead Source Lab at `/demo/team/lead-source-lab` behind
  `InternalDemoGuard role="team"`. Sections: Source Health Summary,
  Performance Table, Recommendations, Experiment Planner, Learning Notes.
- Source experiment local store (`localLeadSourceExperimentStore.ts`) —
  create, update, delete experiments tracking source hypothesis/targets.
- Yield-aligned language added to docs. Lead Engine and Execution Engine
  are now explicitly defined as competing to improve each other.
- Pricing, AUTH_MODE, DATA_MODE, InternalDemoGuard, legacy Owner/Operator demo surfaces,
  and public audit page all unchanged. No AI / scraping / DB writes / APIs.
- Full details: `docs/M033_M037_ADAPTIVE_LEAD_SOURCE_ENGINE.md`.

---

## Latest update — M028–M032 Self-Selling Lead Engine (2026-05-28)

- `/free-audit` now captures opt-in walkthrough requests (local/session
  storage only — no DB writes, no APIs).
- Internal-only Veroxa Lead Success Score (100 pts, 8 categories) added
  in `src/lib/leads/internalLeadScoring.ts`. Never shown publicly.
- New Team Audit Leads queue at `/demo/team/audit-leads` with summary
  tiles, priority filter, detail panel, stage updates, internal notes,
  and a Veroxa Financial Health card.
- New Manual Prospect Scanner at `/demo/team/prospect-scanner` —
  generates public audit + internal lead audit side-by-side.
- Pricing still read from `VEROXA_PLANS`. `AUTH_MODE=placeholder` /
  `DATA_MODE=fixture` unchanged. `InternalDemoGuard role="team"` intact.
- Full details: `docs/M028_M032_SELF_SELLING_LEAD_ENGINE.md`.

---

## Latest update — M012–M014 Restaurant Upload Key + Team Upload Inbox (2026-05-27)

- M012–M014 restaurant upload key foundation added.
- App-style upload flow added at `/upload` — local/demo only.
- Team Upload Inbox added at `/demo/team/upload-inbox` — local/demo
  only, behind `InternalDemoGuard role="team"`.
- No real uploads / writes / storage / notifications added.
- Client + Team remain the priority surfaces.
- Operator / owner remain legacy-demo only and deferred.
- Pricing untouched. `AUTH_MODE=placeholder`,
  `DATA_MODE=fixture` defaults unchanged.
- Full details: `docs/M012_M014_RESTAURANT_UPLOAD_KEY_AND_TEAM_INBOX.md`.

---

---

# Veroxa — Build Status

> ⚠️ **READ THIS FIRST — current truth overrides everything below.**
> The two sections immediately following ("Current state" and
> "Current next-step ladder") are the **authoritative** statement
> of where the project is right now. Every other section in this
> file — including any "next phase" or "real auth flip" language —
> is a **dated historical changelog entry** that was true at the
> time of writing and may be superseded by the current-state
> summary. Do not follow older sections as current instructions.
> In particular, **do not act on any historical "AUTH_MODE flip"
> notes** until the human dev-test gate (M001–M006) is cleared.
>
> For the active five-phase pre-live roadmap, see [`VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md`](./VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md).

---

## Latest update — Real Portal Boundary V2 + CI Recovery (2026-05-31)

- `RealPortalDataBoundary` now protects real `/client/*` and `/team/*` routes with a data-mode context instead of hiding the full portal shell.
- Real Client Portal pages can show safe empty/review states while live account data is prepared. They must not show sample restaurant names as active accounts.
- Real Team/Internal Admin pages stay available as Faraz's solo founder command center for the first 1–10 clients. Demo-driven operational queues stay empty on real routes until live data is connected.
- First-5 fixtures are launch-readiness benchmarks only. If visible internally, they must be labeled as not active client data and used to validate first 5 client scenarios.
- Public demo remains `/demo/client/dashboard` only. No real AI, storage uploads, posting APIs, payments, migrations, webhooks, background jobs, or auth-provider changes were added in this stabilization pass.

---

## Current state (M009 + M010 + M011 First-Client Operating Flow: 2026-05-27)

**M009 + M010 + M011 — First-client operating flow landed.** A
shared client-team workflow model now lives at
`src/data/workflows/clientTeamWorkflow.ts` with pure label / tone /
sort / group utilities in `src/lib/workflows/workflowStatus.ts` and
three reusable components in `src/components/workflows/`
(`WorkflowStatusBadge`, `WorkflowItemCard`, `WorkflowColumn`). The
Client Dashboard gains a "What Veroxa is working on" strip; Client
Requests gains an "Action needed from you" card; the Team Dashboard
gains a "Today's Client Work" snapshot; and the Team Work Queue is
rebuilt around five workflow groups (Media Review, Draft Needed,
Review Ready, Scheduling, Client Action Needed). Team Media Review
and Team Content Review now wire their existing demo buttons to
local `useState` decision maps with live summary tiles —
**decisions never leave the component**. Client Media adds a
disabled "Submit to Veroxa Team — Demo" callout that appears once
files are picked. The deprecated demo client ID alias was removed;
`DEFAULT_DEMO_CLIENT_ID` is used across the Supabase + adapter
graph. Hard invariants from M007/M008 preserved: no writes, no
uploads, no AI, no publishing, no payments, no migrations,
`AUTH_MODE=placeholder`, `DATA_MODE` defaults to fixture, fixture
fallback active, pricing unchanged at $477 / $977 / $977 / $1,497,
`InternalDemoGuard` not bypassed, no service-role in the frontend,
no `Pasted-*.txt` committed. Full notes:
`docs/M009_M011_FIRST_CLIENT_OPERATING_FLOW.md`. Operator / owner remain legacy-demo only and untouched. Typecheck clean.

---

## Current state (M008 Client Portal read-only connection pass: 2026-05-27)

**M008 — Client Portal read-only Supabase connection wired into every
page.** Built directly on M007's `DATA_MODE` switch. New normalized
types (`clientPortalReadOnlyTypes.ts`) + defensive transforms
(`clientPortalTransforms.ts`) feed an expanded adapter with per-section
`getClientPortal*ReadOnly` functions returning a `ReadOnlyEnvelope<T>`
status (live / fallback / skipped). Hook now exposes `isReadOnlyLive`
and `fallbackReason`. Every client portal page renders a small
`<DataSourceBadge />` that appears only in non-fixture modes.
Internal readiness page (`/demo/internal/supabase-readiness`) now
shows a Client Portal Read-Only Coverage table summarizing per-section
availability. Fixture fallback remains the default and the always-on
safety net.

No writes, no uploads, no AI, no publishing, no payments. No new SQL
files. No service-role key in frontend. RLS unchanged. `AUTH_MODE`
unchanged. Pricing unchanged ($477 / $977 / $977 / $1,497).
InternalDemoGuard not bypassed. Portal still not production-live.
See `docs/M008_CLIENT_PORTAL_READONLY_CONNECTION.md`.

---

## Current state (M007 read-only connection pass: 2026-05-27)

**M007 — Supabase read-only connection layer added (dev only).** Introduces a
new `DATA_MODE` switch (`fixture` | `supabase_readonly`) separate from
`AUTH_MODE`. Default remains `fixture`. When `VITE_VEROXA_DATA_MODE=supabase_readonly`,
the client portal hook attempts reads through the existing `client_portal_*`
views and falls back to fixtures on any RLS/env/error condition. New
adapter `src/lib/data/supabaseReadOnlyData.ts` wraps every read with
`{ ok, source, data, error }`. New diagnostic page at
`/demo/internal/supabase-readiness` (Owner-guarded) shows env/mode/read
test status without ever exposing keys. Small internal "data source"
line added on client dashboard (visible only in non-fixture modes).

No writes, no uploads, no AI, no publishing, no payments. No new
`supabase/migrations/` files. No service-role key in frontend. RLS
unchanged. `AUTH_MODE` unchanged. Pricing unchanged. `InternalDemoGuard`
not bypassed. See `docs/M007_SUPABASE_READONLY_CONNECTION.md`.

---

## Current state (guided demo pass: 2026-05-27)

**Guided Sales Demo added.** Route `/guided-demo` added as a public page.
`demoWalkthrough.ts` defines 8 structured steps from client upload through
evidence-based recommendations. Demo hub (`/demo`) now links to the guided
demo. Client dashboard has a small "New to Veroxa?" CTA. Portal remains
placeholder/demo. No backend, payment, AI, or storage connection added.
`InternalDemoGuard` not bypassed — internal steps (3, 4, 7, 8) still require
demo access code. `AUTH_MODE` unchanged. Pricing unchanged.

---

## Current state (stabilization pass: 2026-05-27)

**Status:** demo / placeholder phase. Portal polish and hard stabilization complete.
Pricing corrected to locked values, demo fixture data sanitized (no real restaurant
names, addresses, emails, or domains remain), route/nav audit documented.
Portal remains in placeholder/demo mode. No active backend behavior runs in placeholder mode: no real auth session is required for demo, no real publishing runs, no real uploads run, and no production database writes occur. Supabase/auth scaffolding exists in the codebase but is inactive while AUTH_MODE is "placeholder". Dev Supabase M001–M006 were applied manually in dev only. The app is not production-connected. Portal Connect Planning is still planning, not implementation.

Next milestone: Portal Connect Planning (requires M001–M006 dev-test gate).

- **AUTH_MODE is `"placeholder"`.** Verified in
  `src/lib/auth/authMode.ts`. Real Supabase Auth code exists in the
  codebase (`getSession`, `onAuthStateChange`, `user_profiles`
  lookup, gated `signInWithPassword`) but is **inactive** while
  `AUTH_MODE !== "real"`. Do not flip it.
- **SQL is draft / dev-test only.** All SQL lives under
  `artifacts/veroxa/docs/sql_drafts/`. **No file** under
  `supabase/migrations/`. Nothing has been promoted to a real
  migration set.
- **M001–M006 applied and seeded on the dev Supabase project.**
  Human operator has executed every dev-test package against the
  dev project, applied the M003 notifications status guard + team-
  scope correction, the M004 post-slot reset guard + posts/post_slots
  staff-scope correction, the M005 reports staff-scope correction
  (baked into apply), and manually seeded fixture data across all
  17 tables. Full database count check passed. See
  [`docs/DEV_SUPABASE_EXECUTION_CHECKPOINT.md`](./DEV_SUPABASE_EXECUTION_CHECKPOINT.md)
  for the per-migration status table, seed counts, corrections, and
  guards. **This is dev-only.** No SQL has been promoted to
  `supabase/migrations/` and the app is still not connected
  to Supabase.
- **The portal remains fixture / demo-first.** The Client Portal
  has read-only Supabase queries scaffolded behind
  `useClientPortalData`, but the demo path uses fixtures and
  falls back to fixtures automatically when env vars are missing
  or a query fails. The Team, Operator, and Owner portals use
  fixtures exclusively. The portal is **not** connected to a real
  production database.
- **No real backend behavior is active.** No real AI provider is
  wired (`ai_agents.is_enabled=true` is inert), no publishing
  integration is wired, no real uploads or Supabase Storage buckets
  are wired, no Google Business Profile integration is wired, no
  real database writes happen anywhere in the app. Anything that
  looks like activation in older sections is documentation /
  scaffolding, not runtime behavior.
- **Demo gate `veroxa-preview` remains in place.** Locked pricing,
  the four-role model (Client / Team / Operator / Owner), the
  four-shell portal model, and the nav routing all remain unchanged.

### Current safety / status references

Read these before proposing any auth, SQL, or backend work:

- [`PORTAL_QUERY_SAFETY_PLAN.md`](./PORTAL_QUERY_SAFETY_PLAN.md) —
  what the portal is allowed to read, scoped grep sweeps, latest
  audit pass.
- [`PORTAL_QUERY_SAFETY_CHECKLIST.md`](./PORTAL_QUERY_SAFETY_CHECKLIST.md)
  — exact grep commands that must pass before any portal query
  change.
- [`CLIENT_HEALTH_ENGINE_CONTRACT.md`](./CLIENT_HEALTH_ENGINE_CONTRACT.md)
  — authoritative outputs of `ClientHealthEngine` and the latest
  drift audit per page.
- [`CLIENT_HEALTH_SURFACE_MAP.md`](./CLIENT_HEALTH_SURFACE_MAP.md)
  — per-page inventory of every surface that renders health-derived
  content.
- [`sql_drafts/dev_test/README.md`](./sql_drafts/dev_test/README.md)
  — master M001–M006 dev-test execution order with all correction
  subfiles inserted in the correct position.

---

## Current next-step ladder

Follow this order. Do not skip steps.

1. **Stay in demo / placeholder mode.** `AUTH_MODE` remains
   `"placeholder"`. No SQL promotion, no real Supabase connection,
   no real provider wiring.
2. **M001–M006 dev execution: DONE.** The dev Supabase project has
   M001–M006 applied, all corrections + guards in place, and
   fixture data seeded. See
   [`docs/DEV_SUPABASE_EXECUTION_CHECKPOINT.md`](./DEV_SUPABASE_EXECUTION_CHECKPOINT.md).
3. **Next phase: Portal Connect Planning** — design a read-only
   repository layer that hides Supabase behind typed query
   functions and routes all client portal reads through
   `client_portal_*` views (which must be added in the portal-
   connect pass; they do not yet exist in the dev DB). **This is
   planning, not implementation.** The placeholder guard in
   `useClientPortalData` stays active throughout.
4. **Do NOT** start production-auth work, do NOT flip `AUTH_MODE`,
   do NOT create files under `supabase/migrations/`, and do NOT
   connect the portal to Supabase until a real-auth readiness
   checklist is written and signed off.
5. **Separately and in parallel**, safe demo-only work may
   continue: fixture coherence, health-engine consolidation,
   docs/status cleanup, route registry audits, and demo-only UI
   polish that does not alter routing / nav / the four-shell
   model. See "Allowed next prompt themes" below.

---

## Allowed next prompt themes

These themes are safe to work on **before** the human dev-test
gate clears. They do not touch runtime backend behavior, auth,
SQL promotion, routing, or pricing.

- **Docs / status cleanup** — index updates, drift audits,
  changelog stabilization, contract documents.
- **Fixture coherence** — aligning demo fixtures so the same
  client / period reads identically across all four shells.
- **Health-engine consolidation** — migrating non-engine
  consumers onto `ClientHealthEngine` while preserving the
  canonical vocabulary (`Healthy | Caution | Urgent | Broken`).
- **Demo-only UI polish** — typography, spacing, micro-interactions,
  empty-state copy. **Must not alter** routing, navigation, the
  four-shell model, the demo gate, or pricing.
- **Route registry audits** — read-only inventory of registered
  routes and their portal mapping. No route additions, renames,
  or removals.

## Forbidden next prompt themes

Do **not** propose, plan, or implement any of these in the
current phase. Stop and ask before any deviation.

- **`AUTH_MODE` flip** to `"real"`.
- **Supabase connection** — wiring the portal (or anything else)
  to a real Supabase project, real env vars, or real RLS reads.
- **SQL promotion** — moving any file from
  `docs/sql_drafts/` to `supabase/migrations/`.
- **Real writes / uploads / storage** — Supabase Storage buckets,
  signed-URL uploads, real INSERT / UPDATE / DELETE from the app.
- **Real AI provider** — OpenAI, Anthropic, Gemini, OpenRouter,
  or any other provider; including via external AI integrations.
- **Publishing or Google integrations** — Instagram, Facebook,
  TikTok, Google Business Profile, YouTube, scheduling APIs.
- **Pricing changes** — locked values (GPS 49700, COP 12mo 99700,
  COP 6mo 109700, COP 3mo 119700, COP no-contract 149700) are
  fixed.
- **Role model changes** — roles are exactly Client / Team /
  Operator / Owner.
- **Nav / routing changes** — no new routes, no rename, no
  removal, no shell restructuring.

---

> **How to read this file (legacy header).** The current state of
> real auth is defined by the **Current state** section at the top
> of this file (2026-05-27). The earlier-dated header below ("Date:
> May 24, 2026 — Latest milestone: Real Auth Manual Prep Pack") is
> retained as a historical changelog entry. Earlier sections that
> say "Still no real auth" were true at the time of that pass and
> are superseded by the current-state summary. Do not edit those
> lines retroactively, and do not act on their "next phase"
> language.

---

# Historical changelog — entries below are dated history

**Date:** May 24, 2026
**Latest milestone:** Real Auth Manual Prep Pack (docs only)

> **How to read this file.** The current state of real auth is
> defined by the **most recent** sections at the bottom: "Real Auth V1
> Session Layer" and "Real Auth Manual Prep Pack". The canonical
> phrasing is: **real auth is wired but inactive while
> `AUTH_MODE === "placeholder"`**.
>
> Earlier sections below are kept as a **dated changelog**. Where
> they say "Still no real auth", that statement was true at the time
> of that pass and is now historical — superseded by the V1 session
> layer. Do not edit those lines retroactively.

---

## Client Portal

- Status: **routed pages live**
- Routes:
  - `/demo/client` → Dashboard (alias)
  - `/demo/client/dashboard`
  - `/demo/client/calendar`
  - `/demo/client/google`
  - `/demo/client/reports`
  - `/demo/client/updates`
- Data: **read-only Supabase via `useClientPortalData`** (8 parallel queries: client, platforms, media assets, posts, post slots, weekly reports, monthly reports, draft variants)
- Fallback: **static demo data** kicks in automatically if Supabase env vars are missing or any query fails
- No auth, no uploads, no writes, no AI, no publishing, no automation

## Team Portal

- Status: **routed pages live**
- Routes:
  - `/demo/team` → My Tasks (alias)
  - `/demo/team/tasks`
  - `/demo/team/media-review`
  - `/demo/team/ai-review`
  - `/demo/team/drafts`
  - `/demo/team/scheduling`
- Data: **static demo data only** (from `lib/demo-data`)
- No Supabase wiring, no auth, no uploads, no writes, no AI, no publishing

## Operator Portal

- Status: **routed pages live**
- Routes:
  - `/demo/operator` → Overview (alias)
  - `/demo/operator/overview`
  - `/demo/operator/alerts`
  - `/demo/operator/client-health`
  - `/demo/operator/failed-posts`
  - `/demo/operator/report-approvals`
- Data: **static demo data only**
- No Supabase wiring, no auth, no writes, no AI

## Owner Portal

- Status: **routed pages live**
- Routes:
  - `/demo/owner` → Dashboard (alias)
  - `/demo/owner/dashboard`
  - `/demo/owner/revenue`
  - `/demo/owner/client-health`
  - `/demo/owner/alerts`
  - `/demo/owner/settings` (placeholder "coming soon" card)
- Data: **static demo data only**
- No Supabase wiring, no auth, no writes, no AI

---

## Supabase

- **Dev database:** created manually in the Supabase dev project
- **Migrations:** applied manually from `docs/database/migrations-draft/`
- **Seeds:** applied manually from `docs/database/seeds-draft/` (including 007 draft variant wiring with trigger bypass)
- **RLS:** dev read policies applied from `docs/database/rls-draft/001_dev_read_policies.sql`
- **Client Portal read layer:** working — all 8 queries succeed when env vars are present
- **Secrets:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` expected as Vercel environment variables / local env; missing → graceful fallback to static demo
- **Service role key:** never used; anon key only

---

## Not built yet

> **Note (updated):** the lines below describe state at the time of
> the original "Routed Portal Demo" milestone and have **not been
> rewritten retroactively** (see the "How to read this file" banner
> at the top). For canonical current status, see "Real Auth V1
> Session Layer" and "Real Auth Manual Prep Pack" below. In short:
> real authentication code is **wired but inactive** while
> `AUTH_MODE === "placeholder"`.

- Real authentication (login, sessions, user accounts) — _now wired but inactive; activation gated on the manual prep pack + `AUTH_MODE` flip_
- Real user/account model
- Media uploads
- Team actions (claim task, mark complete, approve draft, etc.)
- Approval workflows (caption review, media review, monthly report sign-off)
- Publishing integrations (Instagram, Facebook, TikTok, etc.)
- AI integrations (caption generation, media review, brand voice — all current AI sections are simulated previews)
- Google Business Profile integration
- Production RLS policies
- Write paths of any kind (insert / update / delete / upsert)
- Webhooks, queues, schedulers
- Email / notification delivery
- Multi-tenant routing

---

## Demo access shell

- **Login UI shell** added at `/login` — polished role-card layout (Access Veroxa).
- **Demo role routing only.** No accounts, no passwords, no sessions, no Supabase Auth.
- Role cards route to the corresponding demo portal:
  - Client Portal → `/demo/client/dashboard`
  - Team Portal → `/demo/team/tasks`
  - Operator Portal → `/demo/operator/overview`
  - Owner Portal → `/demo/owner/dashboard`
- A "Portal Login" link was added to the Demo Hub, and a subtle "Login" link to the landing page nav.
- Architecture documented in [`AUTH_ARCHITECTURE_PLAN.md`](./AUTH_ARCHITECTURE_PLAN.md).

## Demo Veroxa vs Real Veroxa

We are building **Demo Veroxa** and **Real Veroxa** side by side:

- `/demo/*` remains the **preview, sales, and testing layer** — public forever, no auth.
- Future real authenticated routes will live under `/client/*`, `/team/*`, `/operator/*`, `/owner/*`.
- No real auth, real sessions, real writes, or production RLS exist today.

## Auth data model draft

- **Auth data model draft created** — `docs/database/auth-draft/001_auth_user_profiles.sql` defines the `veroxa_user_role` enum and `user_profiles` table (role/`client_id` CHECK, indexes, `updated_at` trigger, RLS enabled).
- **Production RLS draft created** — `docs/database/auth-draft/002_production_rls_policy_draft.sql` sketches SELECT-only policy direction for `clients`, `client_platforms`, `onboarding_items`, `media_assets`, `posts`, `post_slots`, `weekly_reports`, `monthly_reports`, `content_concepts`, `draft_sets`, `draft_variants`, and `notifications`. Team policies are now sketched as **client-scoped via `team_client_assignments`** (see below).
- **Team assignment schema draft created** — `docs/database/auth-draft/003_team_assignment_schema_draft.sql` defines `team_client_assignments` (team_user_id, client_id, assignment_role with CHECK, is_active, indexes, unique pair, `updated_at` trigger, draft `current_team_client_ids()` SECURITY DEFINER helper, RLS enabled). **V1 team assignment decision:** client-scoped (a team user is assigned to one or more clients and reads that client's work rows). Resource-level assignment is V2.
- **Still not applied.** Nothing in `auth-draft/` has been run against any Supabase project.
- **Still no real auth.** No Supabase Auth wired in the app, no real user accounts, no sessions, no passwords.
- **Still no Team/Operator/Owner Supabase wiring.** Those portals remain static demo-only.
- Temporary dev anon read policies in `docs/database/rls-draft/001_dev_read_policies.sql` remain the only RLS in effect on dev.
- See `AUTH_ARCHITECTURE_PLAN.md` §8 for the data model summary.

## Login form + guard shell

- **Future sign-in UI shell added** on `/login` — Email + Password fields and a "Sign In — Coming Soon" button below the existing demo role cards. Submit calls `preventDefault()` and shows _"Real authentication is not connected yet."_ No Supabase Auth call, no network, no cookies, no localStorage.
- **Placeholder auth types added** — `src/lib/auth/types.ts` (`VeroxaRole`, `PlaceholderSession`, `AuthStatus`).
- **Placeholder auth hook added** — `src/lib/auth/usePlaceholderAuth.ts` always returns `{ status: "unauthenticated", session: null, isDemoOnly: true }`. No network, no storage.
- **`<RequireRole>` shell added** — `src/components/auth/RequireRole.tsx` renders a polished "Protected Route Preview" card with Back-to-Login and Open-Demo-Hub buttons. No redirects.
- **Future protected route placeholders added:**
  - `/client/dashboard` → `<RequireRole role="client">`
  - `/team/tasks` → `<RequireRole role="team">`
  - `/operator/overview` → `<RequireRole role="operator">`
  - `/owner/dashboard` → `<RequireRole role="owner">`
- **Still no real auth.** No Supabase Auth wired, no sessions, no cookies, no localStorage, no JWT, no writes, no real user accounts.
- See `AUTH_ARCHITECTURE_PLAN.md` §9 for details.

## First write surface plan

- **First write surface plan created** — `docs/FIRST_WRITE_SURFACE_PLAN.md` defines priorities, role × surface matrix, and hard exclusions (publishing, AI, uploads, Google integrations, billing are out of scope for the first write phase).
- **Write-draft SQL created** — `docs/database/write-draft/001_first_write_surface_draft.sql` covers per-table writable / immutable / scope commentary plus DRAFT-only policy sketches for `notifications`, `onboarding_items`, `content_concepts`, `draft_variants`, `posts`, `post_slots`, `weekly_reports`, `monthly_reports`.
- **Audit log draft created** — `docs/database/write-draft/002_audit_log_draft.sql` defines `audit_logs` (actor_user_id, actor_role, client_id, action, resource_type, resource_id, metadata jsonb, created_at), three indexes, append-only enforcement, draft SELECT policies (operator/owner read all, client reads own client_id + whitelisted actions only), and an explicit "no client-side INSERT" stance.
- **Still not applied.** Nothing in `write-draft/` has been run against any Supabase project.
- **Still no real writes.** The app today has zero `INSERT` / `UPDATE` / `DELETE` / `UPSERT` paths anywhere.
- **Still no real auth.** No Supabase Auth wired, no sessions, no cookies, no localStorage, no JWT.
- **Still no upload / publishing / AI / Google integrations.** All explicitly out of scope for the first write phase.
- See `AUTH_ARCHITECTURE_PLAN.md` §10 for details.

## Client Onboarding demo flow

- **Client Onboarding demo route added** at `/demo/client/onboarding` (`src/pages/client-onboarding.tsx`), registered in `App.tsx`.
- **Client Portal sidebar** now includes an **Onboarding** item (`ClipboardList` icon) in `src/lib/clientPortalNav.ts`. Existing items (Dashboard, Content Calendar, Google Visibility, Reports, Updates) are unchanged.
- **Six sections** rendered as cards: Restaurant Basics, Brand & Positioning, Menu & Offers, Content Preferences, Media Instructions, Google Visibility.
- **Demo form uses local component state only** (`useState`). No Supabase reads or writes, no API calls, no upload handling, no `localStorage`, no cookies. The Menu section has a visual "Upload menu (placeholder)" area that does not accept files.
- **Submit button** reads "Save Onboarding — Coming Soon"; `preventDefault()` on submit; displays "Demo only — onboarding is not saved yet."
- **Launch Readiness side card** computes Pending / In progress / Ready per section from local field state and shows an overall progress bar — entirely derived from local state.
- **No onboarding writes yet. No uploads yet. No Supabase mutation functions.** The Supabase read-only layer and `useClientPortalData` are untouched.

## Media Library demo flow

- **Media Library demo route added** at `/demo/client/media` (`src/pages/client-media.tsx`), registered in `App.tsx`.
- **Client Portal sidebar** now also includes a **Media Library** item (`Images` icon). All other nav items unchanged.
- **Sections:** Upload (drag-and-drop card with "Choose Files — Coming Soon" button), Upload Guidelines (food close-ups, kitchen/prep, staff/customer moments, menu/specials, avoid blurry/dark), Media Review Preview (static demo statuses: "Ready for editing", "Needs better lighting", "Good for Google post", "Use for weekend promo"), Content Supply Snapshot (available / used / needs review + library utilisation bar + low-content warning).
- **No real upload.** The hidden file input only reads file names / sizes / MIME types into local component state. **No `fetch`, no `FormData`, no Supabase Storage, no API call, no `localStorage`, no cookies.** Selected file list disappears on refresh.
- **Demo-only notice** rendered on the page: "Real media uploads will require authenticated client access, storage rules, production RLS, and upload validation."

## Onboarding data model + media storage drafts

- **Onboarding data model draft created** under `docs/database/onboarding-draft/` (`001_onboarding_answer_payload_draft.md`, `002_onboarding_items_extension_draft.sql`, `README.md`). Locks down the future `onboarding_items.answer_payload` shape against the six demo sections, with an example payload and validation notes. **No SQL applied.**
- **Media storage planning draft created** under `docs/database/media-draft/` (`001_media_storage_plan.md`, `002_media_assets_metadata_draft.sql`, `README.md`). Documents the future `veroxa-client-media` private bucket, path layout, allowed MIME types, size limits, upload flow, signed-URL strategy, and `media_assets` metadata extension. **No bucket created. No SQL applied.**
- **Onboarding / Media demo pages polished but still local-state-only.** Onboarding gained a "Reset demo form" button and a clearer pre-submit note. Media gained a "Future upload pipeline" preview card (Choose files → Validate → Upload to private storage → Create metadata → Notify team) and clearer picker copy ("Selected locally only — not uploaded"). Submit text and `preventDefault` behavior unchanged.
- **Future real route placeholders expanded** in `App.tsx`. The existing `RequireRole` shell now also serves: `/client/onboarding`, `/client/media`, `/client/calendar`, `/client/reports`, `/team/media-review`, `/team/drafts`, `/team/scheduling`, `/operator/alerts`, `/operator/report-approvals`, `/owner/revenue`, `/owner/client-health`. All render the "Protected Route Preview" card — **no real auth, no session check, no redirect, no real route content.**
- **Safety audit checklist created** at `docs/SAFETY_AUDIT_CHECKLIST.md` enumerating what is forbidden today and what must be true before real auth, real writes, and real uploads.
- **Still no real auth.** No Supabase Auth wired, no sessions, no cookies, no `localStorage` tokens, no JWT.
- **Still no writes.** No `INSERT` / `UPDATE` / `DELETE` / `UPSERT` functions anywhere.
- **Still no uploads / storage.** No `fetch`, no `FormData`, no Supabase Storage SDK calls, no bucket.
- **Still no AI / publishing / Google integrations.**

## Mega safe build — readiness docs + demo depth + launch plan

- **Team / Operator / Owner demo pages deepened.** Every Team, Operator, and Owner page now carries a shared `DemoOnlyBanner` card that calls out the page as static demo and describes which future workflow it illustrates. No real action is wired.
- **Owner Settings expanded.** Replaces the single "coming soon" card with four explicit sections (Brand settings, Team permissions, Billing settings, Integrations), each labelled "Coming soon". No settings are saved.
- **Client Portal demo polish.** Client pages were intentionally left untouched in this pass — Onboarding and Media already render their own page-specific "demo only" notices, and Dashboard / Calendar / Google / Reports / Updates already surface a live-vs-demo data badge via `useClientPortalData`. The read-only Supabase layer was not modified.
- **Workflow state machine plan added** — `docs/WORKFLOW_STATE_MACHINES.md` documents states, transitions, role gating, audit action names, and V1 / V2 / later targeting for Media Asset Review, Content Concept, Draft Variant, Post, Post Slot, Weekly Report, Monthly Report, and Onboarding Item.
- **AI agent architecture plan added** — `docs/AI_AGENT_ARCHITECTURE_PLAN.md` covers the V1 → V3 rollout, ten agent definitions with risk levels, and safety principles (no direct publishing, no direct GBP edits, human approval gates).
- **Google / SEO / GBP plan added** — `docs/GOOGLE_SEO_GBP_PLAN.md` covers future GBP tasks, local SEO scope, human-in-the-loop rules, what is **not** promised, and the manual-workflow-first integration sequence.
- **Social publishing plan added** — `docs/SOCIAL_PUBLISHING_PLAN.md` lays out the three publishing phases (manual → semi-automated → direct API), prerequisites, and the four hard rules (no auto-publish, no frontend tokens, failed posts visible to operator, all publishes auditable).
- **Production launch runbook added** — `docs/PRODUCTION_LAUNCH_RUNBOOK.md` is a Stage 0 → Stage 8 plan with rollback principles (keep demo separate, back up Supabase, test RLS per user, feature-flag real routes, never remove fallback until stable).
- **Real auth readiness checklist added** — `docs/REAL_AUTH_READINESS_CHECKLIST.md` with current state, before-implementing list, implementation sequence, and hard stop conditions.
- **Production RLS finalization checklist added** — `docs/PRODUCTION_RLS_FINALIZATION_CHECKLIST.md` with table list, pre-apply test matrix, and do-not-apply gating.
- **Client data mapping added** — `docs/CLIENT_DATA_MAPPING.md` maps every demo Onboarding / Media UI section to its future DB field and audit action.
- **Docs index added** — `docs/README.md` is now the entry point for all planning docs and draft database directories.
- **Still no real auth.** No Supabase Auth, no sessions, no cookies, no `localStorage` tokens, no JWT.
- **Still no writes / uploads / storage.** No `INSERT` / `UPDATE` / `DELETE` / `UPSERT`, no `fetch`, no `FormData`, no Supabase Storage SDK calls, no bucket.
- **Still no AI API.** Every "AI" surface is static / simulated.
- **Still no publishing or Google integration.**

## Restaurant Media Guidance Engine — demo

- **Static / rule-based guidance data added** in `src/lib/mediaGuidance.ts` covering 13 restaurant types (halal grill, bakery, donut shop, pizza, burger, coffee shop, fine dining, food truck, Mexican, Mediterranean, Asian, dessert shop, general restaurant). Each type carries `bestPhotoIdeas`, `avoid`, `weeklyCapturePlan`, `googleSpecificShots`, and `quickTips`.
- **`/demo/client/media` now recommends shots by restaurant type.** A new "Restaurant Media Guidance" card sits above the existing upload card with a restaurant-type selector (local state only) plus Recommended Shots, Google Business Profile Shots, What to Avoid, Weekly Capture Plan, and Quick Tips sections.
- **`/demo/client/onboarding` now explains that cuisine type will later power guidance** via a small helper note under the Cuisine field. No cross-page state is shared; nothing is saved.
- **`/demo/team/media-review` now shows a static Guidance Match preview** (Grill flame shot → matches halal grill, Family platter → good for weekend promo, Storefront → good for Google, blurry prep → needs better lighting).
- **New docs:** `docs/MEDIA_GUIDANCE_ENGINE_PLAN.md` and `docs/database/media-draft/003_media_guidance_profile_draft.md`.
- **Existing docs updated:** `docs/README.md`, `docs/AI_AGENT_ARCHITECTURE_PLAN.md`, `docs/CLIENT_DATA_MAPPING.md`, `docs/SAFETY_AUDIT_CHECKLIST.md`, `src/lib/supabase/README.md`.
- **Still no AI API.** All guidance is rule-based static data.
- **Still no uploads / writes / storage.** Upload card behavior is unchanged.

## Real MVP Readiness / Pre-Auth Architecture Pass

The project has shifted from demo expansion into real MVP readiness. This pass is **architecture + planning only** — no real auth, no writes, no uploads, no storage, no AI, no publishing, no Google integration.

- **Route visibility corrected.** `/demo/client/*` is documented as the public sales / client preview surface. `/demo/team/*`, `/demo/operator/*`, and `/demo/owner/*` are documented as **internal-protect-later** — public during development only. See [`docs/ROUTE_VISIBILITY_STRATEGY.md`](./ROUTE_VISIBILITY_STRATEGY.md).
- **Auth contract created.** `src/lib/auth/authContract.ts` is now the single source of truth for `VeroxaRole`, `AuthStatus`, `VeroxaSession`, `AuthState`, `ROLE_HOME_PATH`, `getRoleHomePath`, `isVeroxaRole`. `src/lib/auth/types.ts` re-exports these for backward compatibility.
- **Placeholder auth aligned with future real auth hook shape.** `usePlaceholderAuth` now returns the canonical `AuthState` from the contract, so the future `useRealAuth` is a drop-in swap.
- **`RequireRole` improved for future swap.** Optional `title` / `description` props, surfaces the role's `getRoleHomePath` value, adds `data-testid="protected-route-preview"`, `required-role`, `role-home-path`.
- **Generic real-route placeholder created.** `src/pages/real-route-placeholder.tsx` exports `RealRoutePlaceholder` and is now used by `real-client-placeholder.tsx`, `real-team-placeholder.tsx`, `real-operator-placeholder.tsx`, `real-owner-placeholder.tsx` — duplication removed.
- **Real route registry created.** `src/lib/realRoutes.ts` lists every future authenticated route with role, label, companion demo path, and description; exports `allRealRoutes`, `routesByRole`, `getDemoPathForRealRoute`.
- **Demo route registry created.** `src/lib/demoRoutes.ts` lists every demo route grouped by portal with explicit `visibility` (`public_sales_preview` vs `internal_demo_protect_later`).
- **Route architecture doc created** — [`docs/ROUTE_ARCHITECTURE.md`](./ROUTE_ARCHITECTURE.md).
- **Internal demo protection plan created** — [`docs/INTERNAL_DEMO_PROTECTION_PLAN.md`](./INTERNAL_DEMO_PROTECTION_PLAN.md).
- **Pre-auth technical checklist created** — [`docs/PRE_AUTH_TECHNICAL_CHECKLIST.md`](./PRE_AUTH_TECHNICAL_CHECKLIST.md).
- **Real MVP readiness plan created** — [`docs/REAL_MVP_READINESS_PLAN.md`](./REAL_MVP_READINESS_PLAN.md). Defines the 10-step MVP sequence and the MVP boundary.
- **Adaptive Improvement Engine plan created** — [`docs/ADAPTIVE_IMPROVEMENT_ENGINE_PLAN.md`](./ADAPTIVE_IMPROVEMENT_ENGINE_PLAN.md). Auto-recommend by default; human approval required for anything external, financial, or client-facing.
- **Customer Growth Priority doc created** — [`docs/CUSTOMER_GROWTH_PRIORITY.md`](./CUSTOMER_GROWTH_PRIORITY.md). Locks in that helping restaurants bring more customers is Veroxa's #1 priority and every feature must pass the customer-growth filter.
- **Real Auth V1 prompt draft created** — [`docs/NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md`](./NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md). Draft only — do not execute until manual approval.
- **Visibility correction:** `/demo/client/*` may remain public for sales preview. `/demo/team/*`, `/demo/operator/*`, and `/demo/owner/*` are public during development but should become internal-protected later.
- **Still no real auth.** Placeholder auth always returns unauthenticated.
- **Still no sessions / JWT / cookies / `localStorage` tokens.**
- **Still no writes / uploads / storage** — no `INSERT` / `UPDATE` / `DELETE` / `UPSERT`, no `fetch`, no `FormData`, no Supabase Storage.
- **Still no AI API, no publishing, no Google integration.**

## Real Auth V1 Session Layer — prepared but not active

The real Supabase session-reading layer is now wired into the codebase but **inactive** by default. `AUTH_MODE` is locked to `"placeholder"` and must be flipped manually after `user_profiles` and at least one test user are ready.

- **`src/lib/auth/useRealAuth.ts` created.** Reads `supabase.auth.getSession()`, subscribes to `onAuthStateChange`, joins `user_profiles` by `user_id`, returns the canonical `AuthState`. Gracefully falls back to `unauthenticated` if Supabase env vars are missing or the `user_profiles` table / row is absent — no crash, only `console.warn`.
- **`src/lib/auth/authMode.ts` created.** Exports `AUTH_MODE: "placeholder" | "real"`, locked to `"placeholder"`. Single switch.
- **`src/lib/auth/useAuth.ts` created.** Thin wrapper that selects `useRealAuth` when `AUTH_MODE === "real"`, otherwise `usePlaceholderAuth`. Branch is statically known per build.
- **`RequireRole` now reads `useAuth()`** instead of `usePlaceholderAuth()` directly. Behavior is **unchanged today** because `AUTH_MODE === "placeholder"`.
- **`/login` updated.** Demo role cards (Client / Team / Operator / Owner) routing to `/demo/*` is unchanged. The "Future Sign In" form is now gated by `AUTH_MODE`:
  - `"placeholder"` (today): `preventDefault`, shows "Real authentication is not connected yet." — **no network, no auth API call.**
  - `"real"` (later): calls `supabase.auth.signInWithPassword`, shows "Signed in. Redirect will be enabled after role routing is approved." on success — **no redirect, no user creation, no writes.**
- **`/auth-status` developer diagnostics page added** (`src/pages/auth-status.tsx`). Shows `AUTH_MODE`, `status`, `isDemoOnly`, `role`, `clientId`, `userId`, `email`, `displayName`. **Never** renders access tokens, refresh tokens, or the raw Supabase session.
- **No real users created.** No writes. No RLS changes. No SQL applied. **No demo routes protected.**
- **Existing read-only Client Portal Supabase layer untouched.** Demo behavior identical.

## Auth session persistence enabled (dev testing)

Supabase client (`src/lib/supabase/client.ts`) updated to
`{ persistSession: true, autoRefreshToken: true,
detectSessionInUrl: true }`. Sessions now survive page reloads
during dev testing. Tokens are managed internally by Supabase — no
manual token storage, no token display. No writes, no uploads, no
service role key, no route changes.

## AUTH_MODE switched to real (dev testing)

`AUTH_MODE` flipped to `"real"` in `src/lib/auth/authMode.ts`.
`useRealAuth` is now active. `/login` will attempt
`signInWithPassword` when credentials are submitted. `/auth-status`
shows `AUTH_MODE: real`. No redirects, no sign-out, no writes, no
demo route changes. Single-file change only.

## Real Auth Manual Prep Pack

Docs-only pass — **no code changes.** All five new files are
instructions for the project owner to follow manually in Supabase
before the dedicated `AUTH_MODE` flip prompt runs.

- [`MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md`](./MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md) — step-by-step manual Supabase setup.
- [`AUTH_TEST_USER_MATRIX.md`](./AUTH_TEST_USER_MATRIX.md) — what each test user should and should not see.
- [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) — pre-flip, post-flip, regression, and security checks.
- [`AUTH_ROLLBACK_PLAN.md`](./AUTH_ROLLBACK_PLAN.md) — safe rollback procedure if real auth misbehaves.
- [`AUTH_MODE_SWITCH_PLAN.md`](./AUTH_MODE_SWITCH_PLAN.md) — explicit scope contract for the future one-line flip prompt.

Still true:

- `AUTH_MODE` remains `"placeholder"`.
- Real auth is not active.
- **No users created by code.** **No SQL applied by the app.** **No writes.** **No demo route protection changes.**

## Next recommended phase

**Manual Supabase preparation, outside the app runtime.** Do not run more
auth/database implementation prompts until these are done by hand:

1. Review the draft SQL under `docs/database/auth-draft/`.
2. Apply `user_profiles` manually in the dev Supabase project — only if approved.
3. Create the four test users manually in Supabase Auth.
4. Insert four matching `user_profiles` rows manually.
5. Tick every box in [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) → "Before switching".
6. Then run the dedicated small `AUTH_MODE` switch prompt per [`AUTH_MODE_SWITCH_PLAN.md`](./AUTH_MODE_SWITCH_PLAN.md).

## Earlier next phase note (superseded)

**Manual review: Real Auth V1 decision.** If approved, the next prompt should be small and only wire Supabase Auth read-only session handling per [`docs/NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md`](./NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md). Before that prompt runs, every item in [`docs/PRE_AUTH_TECHNICAL_CHECKLIST.md`](./PRE_AUTH_TECHNICAL_CHECKLIST.md) must be ticked.

Specifically:

- Audit `usePlaceholderAuth` for the swap site once real auth lands (shape return value to match a future real session hook), without changing today's behavior
- Confirm the future-route `/client|/team|/operator|/owner` placeholders all read role from a single source so a single hook swap activates them
- Inventory any `data-testid` attributes on the future placeholder card to keep regression tests stable across the swap
- Keep `/login`, all `/demo/*` routes, all `RequireRole` placeholders, and all draft SQL / storage / write-draft docs untouched and unapplied
- Do **not** wire real Supabase Auth, real writes, real uploads, AI, or publishing in that phase

---

## Build commands

- `pnpm --filter @workspace/veroxa run typecheck` — typecheck (last run: passing)
- `pnpm --filter @workspace/veroxa run build` — production build (needs workflow-provided `PORT` / `BASE_PATH`; typecheck is the canonical local verification)
- App workflow: `artifacts/veroxa: web` — running

## Authenticated Demo Routing V1

**Status: COMPLETE**

- Successful login now routes to the matching demo portal by role
  (`getDemoRoleHomePath` in `authContract.ts`).
- `/demo/client/*` remains fully public for sales preview.
- `/demo/team/*`, `/demo/operator/*`, `/demo/owner/*` are now
  protected by `InternalDemoGuard` (loading / login-required /
  wrong-role states).
- Login page: section title is now "Sign In" (was "Future Sign In"),
  badge is now "Active" (was "Planned"), client card shows
  "Public Preview", team/operator/owner cards show "Login Required".
- Public Demo Hub no longer lists Team/Operator/Owner portal cards.
  It shows the Client Portal preview and a note directing internal
  users to sign in.
- `/auth-status` has a safe "Sign Out" button (authenticated state
  only); calls `supabase.auth.signOut()` then redirects to `/login`.
- No writes, uploads, storage, service role, or AI API added.
- Real production routes (`/client/*`, `/team/*`, etc.) remain
  placeholder shells.

## Public Services + Pricing Page

**Status: COMPLETE**

- Landing page rewritten with 8 sections in order: Hero, Stats,
  What Veroxa Does, Services Included, Pricing Preview, Ads
  Management, Bundle Pricing, Client Portal Preview, and CTA.
- Exact pricing added: Complete Online Presence ($997–$1,497/mo),
  Ads Management (+$1,500 add-on or $2,000 ads-only), Bundle
  ($1,797–$2,297/mo).
- Ad spend separate disclaimer shown in Ads Management section.
- No-guarantees disclaimer in pricing section and footer.
- Hero CTAs: "Request Restaurant Audit" + "View Client Portal Preview".
- Client Portal Preview section links only to `/demo/client/dashboard`.
- Public pages do not expose Team/Operator/Owner demo portal links.
- Navigation links to Services, Pricing, and Preview anchors.
- `docs/PUBLIC_PRICING_AND_SERVICES.md` created as locked pricing
  source of truth.
- No writes, uploads, storage, auth, or database changes.

## Public Website Truthfulness Cleanup

**Status: COMPLETE**

- Removed unproven stats from landing page (340+ restaurants, 18,000+ posts,
  96% retention, +41% Google visibility lift).
- Replaced Stats Strip with four honest system-based trust signals:
  Restaurant-Focused System, Role-Based Portal, Google + Social Focus,
  Reporting Built In.
- Added honest early-stage positioning phrase in "What Veroxa Does" section.
- Pricing, services, CTAs, and Client Portal Preview link unchanged.
- No auth, database, upload, or storage changes.
- `PUBLIC_PRICING_AND_SERVICES.md` updated with Truthful Public Claims Rule.
- `CUSTOMER_GROWTH_PRIORITY.md` updated with truthfulness principles.

## Public Website Structure V1

**Status: COMPLETE**

- Public website separated into four pages: Home (`/`), Services
  (`/services`), Pricing (`/pricing`), and Demo experience (`/demo`).
- Homepage simplified to introduction only — no full pricing tables or
  full services list.
- Demo page positioned as the public client experience with only the
  Client Portal preview card and an internal-portals-require-login note.
- `/services` page created with full services breakdown and
  Ads Management section.
- `/pricing` page created with exact pricing (Complete Online Presence,
  Ads Management, Bundle), ad-spend disclaimer, and no-guarantees note.
- `PublicNav` and `PublicFooter` shared components created.
- Pricing numbers unchanged from last approved version.
- Truthfulness rules (no fake stats, no fake claims) preserved.
- No auth, database, upload, or storage changes.
- Internal demo guards unchanged.

## Public Copy Polish Pass

**Status: COMPLETE**

- Demo page typo ("media guidance guidance") confirmed already correct
  in current build — was resolved during the website structure pass.
- Verified zero internal demo links (/demo/team, /demo/operator,
  /demo/owner) on any public page (landing, demo-hub, services,
  pricing, PublicNav, PublicFooter).
- All public nav links confirmed correct: Home → /, Services →
  /services, Pricing → /pricing, Demo → /demo, Login → /login,
  Request Audit → mailto.
- Pricing numbers unchanged.
- Typecheck passed clean — zero errors.
- No auth, database, upload, or storage changes.

## Public Website QA + Copy Polish Pass

**Status: COMPLETE**

- Home / Demo / Services / Pricing structure reviewed — all pages
  remain separated by purpose and contain no cross-contamination.
- Demo page "What you can explore" bullet list added to the Client
  Portal preview card (Dashboard, Content Calendar, Google Visibility,
  Reports, Updates, Onboarding, Media Guidance).
- Pricing page "Which plan fits?" mini guide added below Complete
  Online Presence pricing cards.
- Demo page typo confirmed fixed ("media guidance", not doubled).
- Public link safety scan: zero internal demo links (/demo/team,
  /demo/operator, /demo/owner) found on any public page.
- Truthfulness scan: zero fake stats (340+, 18,000+, 96%, +41%) or
  guaranteed-result claims found on any public page.
- PublicNav and PublicFooter links verified correct.
- Authenticated demo routing preserved — login redirects, role guards,
  wrong-role card, sign-out all unchanged.
- Pricing numbers unchanged.
- No auth, database, upload, or storage changes.
- Typecheck: zero errors.

## True Stabilization Build Pass V1.1

**Status: COMPLETE — May 25, 2026**

Stabilization-only pass. No new features, no design changes, no real
auth activation.

- **`AUTH_MODE` flipped back to `"placeholder"`** in
  `src/lib/auth/authMode.ts`. Real Supabase auth code remains wired
  but inactive; `InternalDemoGuard` short-circuits to render demo
  children directly when `AUTH_MODE === "placeholder"`. No Supabase
  network calls from the auth layer.
- **Canonical demo role home paths confirmed** in
  `src/lib/auth/authContract.ts` (`DEMO_ROLE_HOME_PATH`):
  client → `/demo/client/dashboard`,
  team → `/demo/team/dashboard`,
  operator → `/demo/operator/operator-os`,
  owner → `/demo/owner/executive-dashboard`.
  Login role cards in `src/pages/login.tsx` point to the same
  destinations.
- **Operator sidebar: Priority Board → System Status.**
  `src/lib/operatorPortalNav.ts` swaps the 7th nav item for "System
  Status" (`ShieldCheck` icon, `href: /demo/operator/system-status`).
  Priority Board remains routed at `/demo/operator/priority-board`
  but is hidden from nav.
- **New operator-wrapped System Status page** at
  `/demo/operator/system-status`
  (`src/pages/operator-system-status.tsx`). Renders the same
  `demoSystemStatus` fixture as `/demo/internal/system-status` but
  inside the operator `PortalLayout` so it carries the operator
  sidebar. The original `/demo/internal/system-status` diagnostics
  route is preserved as an internal-only surface.
- **Operator / owner shells confirmed wrapped in `PortalLayout`.**
  `operator-os.tsx`, `operator-media-library.tsx`, and `owner-os.tsx`
  already render their content inside `PortalLayout` with their
  respective nav items. No further wrapping needed.
- **`demoRoutes.ts` rewritten** with a richer five-value visibility
  taxonomy: `visible_nav | hidden_from_nav | legacy_demo |
internal_demo | future_protected`. The client, team, operator,
  owner, internal, and future-protected entries are tagged with
  their current visibility intent. A future light parity script can
  compare this registry against `App.tsx` to catch drift.
- **Pricing labels cleanup.** `docs/PUBLIC_PRICING_AND_SERVICES.md`
  corrected: the "Growth system" tier label was corrected for both
  Complete Online Presence plans and Bundle plans. Locked monthly
  prices unchanged ($997 / $1,097 / $1,197 / $1,497 plans; $1,797 /
  $1,897 / $1,997 / $2,297 bundles; ads add-on +$1,500, ads-only
  $2,000). `src/pages/pricing.tsx` corrected in stabilization pass.
- **Docs synced.** This entry + `ROUTE_ARCHITECTURE.md` updated to
  document the new operator System Status route, the sidebar swap,
  and the expanded `DemoVisibility` taxonomy.
- **Still no real auth, real writes, real uploads, real AI, real
  publishing, or real Google integration.** Supabase remains
  inactive at runtime via `AUTH_MODE === "placeholder"`.
- **Typecheck:** zero errors.

---

## Changelog entry — Dev Supabase M001–M006 execution checkpoint (2026-05-27)

- **Dev Supabase: M001–M006 applied and seeded.** Human operator
  executed each dev-test package against the dev Supabase project,
  in order. Applied M003 notification-status guard (`01b`) and
  team-scope correction (`01c`); M004 post-slot reset guard (`01b`)
  and posts/post_slots staff-scope correction (`01c`); M005 reports
  staff-scope correction (baked into `01_apply_m005`). Manually
  seeded fixture data across all 17 tables (clients 2,
  team_client_assignments 1, client_platforms 3, onboarding_items 3,
  client_requests 2, media_assets 3, notifications 4,
  client_health_snapshots 2, activity_logs 3, posts 4, post_slots 4,
  weekly_reports 3, monthly_reports 3, ai_agents 2,
  content_concepts 2, draft_sets 2, draft_variants 3). Full database
  count check passed.
- **Portal still placeholder / disconnected.** `AUTH_MODE` remains
  `"placeholder"`. `useClientPortalData` continues to short-circuit
  to fixtures. The app is **not** connected to the dev
  Supabase project; the dev DB work is purely a backend execution
  checkpoint, not a portal activation.
- **Next phase: Portal Connect Plan, not production auth.** Design
  a read-only repository layer behind typed query functions and
  plan the `client_portal_*` views (deferred to the portal-connect
  pass). Do not flip `AUTH_MODE`, do not connect the portal, do not
  promote SQL to `supabase/migrations/`, and do not wire any real
  AI / publishing / payment providers until a real-auth readiness
  checklist is written and signed off.
- **New doc:** [`docs/DEV_SUPABASE_EXECUTION_CHECKPOINT.md`](./DEV_SUPABASE_EXECUTION_CHECKPOINT.md)
  — per-migration status table, manual cleanup notes, seed counts,
  corrections + guards, and the explicit next-phase guidance.
- **No source code changed.** This pass is documentation-only.
  Invariants unchanged: AUTH_MODE=`"placeholder"`, no
  `supabase/migrations/`, portal disconnected, no real AI /
  publishing / payments, locked pricing
  (49700 / 99700 / 109700 / 119700 / 149700), four roles
  (Client / Team / Operator / Owner), no nav / four-shell changes.
- **Typecheck:** PASS.

## M015–M019 — Direction + Adaptive Intelligence + Local Upload Store

- M015 Client Direction Center: `/demo/client/direction` live with
  fixture + local submissions; nav entry added; dashboard CTA card.
- M016 Team Direction Queue: `/demo/team/direction-queue` live,
  team-guarded, grouped by urgent/content/google/ads/avoid/completed
  with local action buttons; work-queue cross-link added.
- M017 Rule-Based Adaptive Intelligence:
  `/demo/team/adaptive-intelligence` live, team-guarded; engine in
  `src/lib/intelligence/adaptiveRules.ts`; team dashboard shows
  top-3 "Adaptive Team Priorities". No external AI provider used.
- M018 Shared Local Upload Store: sessionStorage at
  `veroxa.demo.localUploads.v1`; metadata only; `/upload` writes,
  team upload inbox + client media read; "Clear session uploads"
  button on team inbox.
- M019 Weekly Strategy Snapshot: client dashboard + team
  intelligence page, audience-aware copy.
- **Invariants:** no Supabase writes, no real AI APIs, no
  publishing/ads/payments, no migrations, `AUTH_MODE=placeholder`,
  `DATA_MODE=fixture` default, `InternalDemoGuard` intact on team
  routes, Owner/Operator NOT expanded, pricing unchanged, no
  `Pasted-*.txt` committed.
- **Typecheck:** PASS.

## M020–M022 — Local Cohesion + Write Readiness

- **M020 Shared local direction store.** New
  `src/lib/direction/localDirectionStore.ts` (sessionStorage,
  metadata only, note sanitized). Client Direction Center submits
  through it; Team Direction Queue merges fixture + session items,
  routes status updates to the correct source, exposes a
  "Clear session direction" control + session-only note.
- **Adaptive Intelligence** now reads local/session direction and
  local/session uploads on Client Dashboard, Team Dashboard,
  Client Direction Center, Team Direction Queue, and Team Adaptive
  Intelligence — each surface subscribes to both local stores.
- **M021 First-client data path + contracts.**
  `docs/FIRST_CLIENT_DATA_PATH.md`,
  `src/lib/firstClient/firstClientContracts.ts`,
  `src/lib/firstClient/visibilityRules.ts`,
  `docs/FIRST_CLIENT_READINESS_CHECKLIST.md`.
- **M022 Supabase write readiness plan.**
  `src/lib/data/writeReadiness.ts` (`WRITES_ENABLED=false`),
  `docs/M023_SUPABASE_WRITES_PLAN_UPLOADS_DIRECTION_REVIEW.md`,
  small "Write Readiness" card added to the internal Supabase
  readiness page.
- **Invariants:** no Supabase writes, no migrations, no storage
  uploads, no real AI / publishing / ads / payments, no service
  role in the frontend, no `FormData` / fetch upload added, no
  raw file blobs in local/session storage, AUTH_MODE unchanged,
  DATA_MODE default unchanged, pricing unchanged, InternalDemoGuard
  intact, operator / owner not expanded beyond legacy-demo surfaces, no `Pasted-*.txt` committed.
- **Typecheck:** see verification below.

## M023A–M023B — Supabase Write Foundation (planning) + Disabled Adapter

- **M023A — SQL / RLS / write-function planning files.** Added
  `docs/sql-plan/` with `README.md`,
  `M023A_FIRST_CLIENT_SCHEMA_PLAN.sql.txt` (8 proposed tables),
  `M023A_RLS_POLICY_PLAN.md`, and `M023B_WRITE_FUNCTION_SPEC.md`.
  Planning only — no files under `supabase/migrations/`.
- **M023B — Disabled write adapter.** Extended
  `src/lib/data/writeReadiness.ts` with `WriteMode`,
  `CURRENT_WRITE_MODE = "disabled"`, `getWriteMode()`,
  `assertWritesDisabled()`, `getWriteSafetyBanner()`. Added
  `writeAdapterTypes.ts`, `disabledWriteAdapter.ts`,
  `writeAdapter.ts` (re-exports the disabled adapter as
  `veroxaWriteAdapter`).
- **Page messaging.** Subtle write-disabled banner via
  `getWriteSafetyBanner()` on Restaurant Upload Flow, Client
  Direction Center, Team Upload Inbox, and Team Direction Queue.
  Local/session behavior unchanged.
- **Internal readiness page.** Write Readiness card expanded
  (mode, adapter, storage, service role, migrations, next step).
- **Invariants:** writes remain disabled, no migrations created,
  no Supabase writes/uploads added, no AI / publishing / ads /
  payments added, no service role in frontend, AUTH_MODE unchanged
  (`placeholder`), DATA_MODE default unchanged (`fixture`), pricing
  unchanged, InternalDemoGuard intact, Owner/Operator NOT expanded.
- **Typecheck:** see verification below.

## M023C — Dev Supabase Write Adapter (disabled by default)

- **Real Supabase write adapter added**, dormant behind explicit env
  flag `VITE_VEROXA_ENABLE_DEV_WRITES` (only exact `"true"` enables).
- Default mode: `disabled`. `WRITES_ENABLED = false`.
- Real metadata writes only possible when the env flag is `"true"`.
- **New files:** `src/lib/data/devSupabaseWriteAdapter.ts`,
  `src/lib/data/writeMappers.ts`, `src/lib/data/writeErrors.ts`,
  `docs/M023C_DEV_SUPABASE_WRITE_ADAPTER.md`.
- **Updated:** `src/lib/data/writeReadiness.ts` (env flag, mode
  resolver, status object), `src/lib/data/writeAdapter.ts` (selects
  dev vs disabled adapter), `src/pages/internal-supabase-readiness.tsx`
  (Write Readiness card now dynamic, shows mode / env flag / current
  adapter / expected tables).
- **No** storage upload added.
- **No** active migrations added.
- **No** AI / publishing / ads / payments integration.
- **No** service role used in frontend.
- **No** page component writes to Supabase — writes live only inside
  `devSupabaseWriteAdapter.ts`.
- Owner/Operator portals **not** expanded.
- AUTH_MODE unchanged (`placeholder`). DATA_MODE default unchanged
  (`fixture`). Pricing unchanged. InternalDemoGuard intact.
- **Typecheck:** PASS.

## M024A — Supabase metadata schema migration + RLS foundation

- **One migration added:**
  `supabase/migrations/20260601000000_m024a_first_client_metadata_schema.sql`.
- Tables: `clients`, `restaurant_upload_keys`, `upload_submissions`,
  `direction_requests`, `team_review_decisions`.
- `set_updated_at()` trigger function + triggers for clients,
  upload_submissions, direction_requests.
- RLS enabled on all five tables.
- Conservative dev-stage policies (authenticated read where listed;
  insert/update for upload_submissions and direction_requests;
  append-only insert for team_review_decisions). No `anon` writes.
- **No** storage upload added.
- **No** page write connection added (pages still use local/session).
- **No** AI / publishing / ad / payment integration added.
- **No** seed real data; no real restaurant names; no real upload keys.
- `src/lib/data/schemaReadiness.ts` added (reports schema version
  and what is still not ready).
- Internal readiness page surfaces M024A schema status.
- Operator / owner remain legacy-demo only and deferred.
- AUTH_MODE unchanged (`placeholder`); DATA_MODE default unchanged
  (`fixture`); pricing unchanged; InternalDemoGuard intact.
- Contracts aligned: `FirstClientUploadPriority` value
  `reel_idea` → `reel_tiktok_idea` to match migration check
  constraint (callers updated).
- **Typecheck:** see verification below.

## M024B — Dev migration verification + write smoke test harness

- **Schema verification utilities added:**
  `src/lib/data/schemaVerificationTypes.ts`,
  `src/lib/data/schemaVerification.ts` — read-only `SELECT id LIMIT 1`
  per table; safe messages only; no writes.
- **Smoke test harness added:**
  `src/lib/data/devWriteSmokeTestData.ts`,
  `src/lib/data/devWriteSmokeTests.ts`,
  `src/lib/data/devClientIdValidation.ts`.
- Smoke tests require explicit button click (not auto-run), dev
  write flag enabled, and a manually-provided fictional dev client UUID.
- Dry-run mode available (no writes; reports what would be tested).
- **Internal Supabase readiness page** updated:
  - Schema Verification card with "Run schema verification" button
    and per-table pass/fail results.
  - Dev Write Smoke Test card with UUID input, dry-run and live-run
    buttons (real button disabled when writes off or no valid UUID),
    and step-by-step result display. Includes 5 warning messages.
- **No client-facing page connected to writes.**
- **No new migration added** (M024A migration unchanged).
- **No storage upload added.**
- **No AI / publishing / ads / payments added.**
- Operator / owner remain legacy-demo only and deferred.
- AUTH_MODE unchanged (`placeholder`). DATA_MODE default unchanged
  (`fixture`). Pricing unchanged. InternalDemoGuard intact.
- **Typecheck:** PASS.

## M025A — Client Direction Center dev write connection

- **Client Direction Center** submit flow connected to write adapter
  with local/session-first behavior:
  1. `localDirectionStore` written first (always).
  2. If `WRITES_ENABLED` false → stops; shows session-mode message.
  3. If `WRITES_ENABLED` true → reads `VITE_VEROXA_DEV_CLIENT_ID`.
  4. If env var missing/invalid → skips dev write; shows safe message.
  5. Calls `veroxaWriteAdapter.createDirectionRequest()`.
  6. Success → "saved locally and to dev database."
  7. Failure → safe warning; local/session success kept.
- Dev writes require `VITE_VEROXA_ENABLE_DEV_WRITES === "true"`.
- Dev writes require `VITE_VEROXA_DEV_CLIENT_ID` (valid UUID).
- `"demo-a"` is never sent to Supabase (not a valid UUID).
- Raw DB errors never reach the user.
- **New file:** `src/lib/data/devClientId.ts` —
  `getDevClientIdFromEnv()` / `isDevClientIdReady()`.
- Internal readiness page header wording fixed: "writes disabled unless
  explicit flag · no production data".
- Upload flow still not connected to writes.
- Team Direction Queue still not connected to writes.
- Team Upload Inbox still not connected to writes.
- **No** storage upload added.
- **No** new migration added.
- **No** AI / publishing / ads / payments added.
- Operator / owner remain legacy-demo only and deferred.
- AUTH_MODE unchanged (`placeholder`). DATA_MODE default unchanged
  (`fixture`). Pricing unchanged. InternalDemoGuard intact.
- **Typecheck:** PASS.

## M025B — Team Direction Queue dev write connection

- **Team Direction Queue** `updateStatus` converted to `async` with
  local/session-first + optional UUID-gated dev write:
  1. Local state / `localDirectionStore` updated first (always).
  2. If `WRITES_ENABLED` false → stops; shows disabled message.
  3. If direction item id is not a valid UUID → `dev_write_skipped`.
  4. Calls `veroxaWriteAdapter.updateDirectionStatus()`.
  5. Success → "updated locally and to dev database."
  6. Failure → safe warning; local update kept.
- Per-card `DirectionWriteStatus` state (`Record<string, …>`) with
  `[10px]` inline message; raw DB errors never shown.
- `DirectionStatus` → `FirstClientDirectionStatus` cast for type safety.
- `createTeamReviewDecision` deferred (no reliable UUIDs yet).
- Client Direction Center banner wording updated (M025B minor fix).
- Dev writes require `VITE_VEROXA_ENABLE_DEV_WRITES === "true"`.
- Only valid UUID direction ids are sent to Supabase.
- Non-UUID local/demo ids skip dev write safely.
- Upload flow still not connected to writes.
- Team Upload Inbox still not connected to writes.
- **No** storage upload added.
- **No** new migration added.
- **No** AI / publishing / ads / payments added.
- Operator / owner remain legacy-demo only and deferred.
- AUTH_MODE unchanged (`placeholder`). DATA_MODE default unchanged
  (`fixture`). Pricing unchanged. InternalDemoGuard intact.
- **Typecheck:** PASS.

## M026A–M026C — Free Customer-Flow Readiness Audit + Package Recommender + Positioning Polish

- Public `/free-audit` route added.
- Rule-based local audit engine — `src/lib/audit/{auditTypes,auditScoring,customerFlowImpact,auditPackageRecommendation,auditReportFormatter}.ts`.
- Fictional demo inputs only — `src/data/audit/demoAuditExamples.ts` (Demo Grill House, Demo Momo Kitchen, Demo Mediterranean Table).
- Audit total = 100 across 7 categories with weak-spot ranking.
- Customer-flow framework added: Visibility → Trust → Reminder → Action → Retention.
- Package recommendation engine added; weak spots decide the package, foundation comes before ads.
- Pricing read from `@/data/pricing/veroxaPricing` (locked source of truth).
- "Why not ads yet" surfaces when foundation is weak.
- 30-day plan, expected impact timeline, adaptive learning explanation, and preliminary disclaimer all rendered on the report page.
- M026C — Team Direction Queue banner wording fixed and content/google/ads action buttons remapped from `in_team_review` → `planned`.
- **No** AI integration, scraping, Google/social APIs, payments, ads APIs.
- **No** database writes, **no** storage upload, **no** new migration.
- Pricing unchanged. AUTH_MODE=placeholder. DATA_MODE=fixture default. Operator / owner not expanded beyond legacy-demo surfaces. InternalDemoGuard intact.
- **Typecheck:** PASS.

## M027A–M027C — Simplified Audit Inputs + Accuracy + Confidence

- Public Free Audit form simplified — only restaurantName, city, state, cuisineType are required.
- New optional link fields: `menuOrderingUrl`, `otherUrl`.
- `currentGoal`, `biggestProblem`, `notes` made fully optional (no longer asked publicly).
- `auditConfidence` ("basic" | "good" | "strong") + label + explanation added to `RestaurantAuditReport`.
- Scoring engine sharpened for minimal inputs:
  - menuOrderingUrl improves Action Path Clarity + Maps Conversion.
  - Missing Google + missing website/menu compound action-path weakness.
  - Strong cuisine terms + social visual links boost Content Persuasion.
- Weak-spot explanations reframe by missing-link shape:
  - "Google / Maps visibility may be underbuilt"
  - "Customer action path may be unclear"
  - "Social reminder system may be missing"
- Opportunities now work without a stated goal — derived from missing/provided links + cuisine.
- Package recommender:
  - `currentGoal` fully optional.
  - **Ads Management Only** stricter (total ≥ 85; goal must mention ads/paid/campaign).
  - **Complete + Ads Add-on** gated on solid foundation + link count ≥ 4 + ads-leaning text signal.
  - Default = Complete Online Presence.
- Demo examples updated to the simplified input structure (Demo Grill House, Demo Momo Kitchen, Demo Mediterranean Table).
- Page hero, helper copy, and CTA wording updated.
- **No** AI / scraping / Google or social APIs / payments / ads APIs.
- **No** database writes, **no** storage upload, **no** new migration.
- Pricing unchanged. AUTH_MODE=placeholder. DATA_MODE=fixture default. Operator / owner not expanded beyond legacy-demo surfaces.
- **Typecheck:** PASS.

---

## 2026-05-30 RR strategy sync note

- Current public packages remain Starter ($295/month), Growth ($495/month), and Premium ($995/month).
- Growth must not be labeled popular-badge until real client data supports that claim.
- Historical/deprecated: prior Growth wording incorrectly carried daily-posting language. Current Growth wording must not carry public daily-posting language.
- Service boundary: Veroxa does not handle comments, DMs, inboxes, complaints, order questions, refunds, or customer-service conversations at launch.
- Media dependency: posting depends on usable client-provided media and may slow when usable media is unavailable.
- Current posting limits: Starter allows up to 3 posts/week; Growth has no public daily-posting cap; Premium has up to 1 post/day with ad management, readiness/client approval, agreed ad budget, and separate ad spend.
- Premium requires a Veroxa readiness assessment, client approval, and an agreed ad budget.
- First-client discount: 20% off for 12 months, then loyalty discount only while continuously active; lost if the client leaves and later returns.
- Build order remains client side first. Team/Internal Admin heavy AI automation comes after client-side clarity and should later support media review assist, caption drafting, Google/SEO/Maps tasks, reporting generation, Premium readiness checklist, client risk flags, workload tracking, and Pakistan team handoff after 10 clients.

---

## Latest update — Client + Team Ready V1 Operational Spine (2026-05-31)

- Added pure TypeScript operations contracts for real portal review-mode records: client accounts, media status, content workflow, report workflow, client risk, Premium readiness, team overview, and team command summaries.
- Added a local review-mode operations repository for real `/client/*` and `/team/*` routes. These records are not public demo fixtures, not First-5 benchmark fixtures, and not future live production data.
- Real Client Portal pages now have structured review-mode account, package, media, content, report, risk, and Premium readiness surfaces while live account data remains disconnected.
- Real Team/Internal Admin now has a solo-founder command center shell for Faraz with review-mode accounts, action queue summaries, workload, risk flags, media needs, content readiness, reports needing review, and Premium readiness assessment candidates.
- Team subroutes remain reachable and show safe review-mode operational summaries rather than demo restaurants as active clients.
- Public demo remains separate at `/demo/client/dashboard`; demo navigation stays in demo context instead of accidentally entering real `/client/*` routes.
- No real AI calls, storage uploads, posting connectors, Google Business Profile APIs, payments, webhooks, background jobs, auth provider changes, or destructive migrations were added.
- Codex remains the main builder for this stage. Browser/manual QA is used for surface-level visual checks and explicit preview polish.

## Full SaaS Foundation design reference

For the next Full SaaS Foundation design and guardrail plan, see `CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md`. This status note does not mark production auth, migrations, storage uploads, live AI, connectors, or payments as built.

## 2026-06-03 pricing/profit-fit alignment

- Active public pricing is Starter $295/month, Growth $495/month, and Premium $995/month.
- Growth is the main recommended package for strong-fit restaurants; Starter is the low-friction entry plan; Premium is selective and readiness-gated.
- Premium requires readiness assessment, client approval, and an agreed ad budget; ad spend is separate.
- Profit Fit Layer is internal/team-only and uses `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30` with conservative defaults of $15 average ticket and 5% net margin.
- Online-influenced orders/actions include online orders, phone/order clicks, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions, social content-driven visits, and repeat-customer attention.
- Public/client surfaces must not promise orders, profit, ROI, customers, revenue, rankings, or exact order targets.
- This update does not mark production auth, migrations, storage, live AI, connectors, payments, or runtime SaaS wiring as built.
## Profit validation and online-influenced action layer (internal only)

Veroxa sells online presence publicly, but internally validates whether the work is becoming cost-justifiable through profitable online-influenced orders/actions. This is an internal operating model, not public/client-facing guarantee language.

- Starter internal 2-month proof standard: 20 online-influenced actions/day for right-fit restaurants.
- 2–3 months: service delivery plus cost justification through tracking setup, Google/Maps cleanup, best sellers, and order/contact paths.
- 6–9 months: profit progress should be visible through careful signal review, not service delivery volume alone.
- 12 months: online presence should be reviewed as a meaningful order channel when attribution confidence is strong enough.
- Tracking hierarchy: business outcome signals, conversion/action signals, attention signals, engagement signals, and execution signals.
- Attribution confidence must stay explicit: confirmed, strong signal, directional, owner reported, or unknown.
- Break-even progress and exact proof math are internal only and must not appear as public/client guarantees.

No runtime SaaS implementation is added by this layer: no production auth, database migrations, storage uploads, live AI, connectors, payments, or real client data writes.

## 2026-06-03 — Client Portal Full SaaS Foundation Phase 1 scaffold

- Phase 1 SaaS foundation scaffolding has been added as TypeScript contracts and guardrails only.
- `SaasDataMode`, future restaurant/account/user/media/request/action/report/activity domain models, repository interfaces, placeholder repository adapters, demo repository adapters, and a `RepositoryBundle` selector now exist.
- Activity log scaffolding exists through `ActivityLogRepository` contracts and preview helpers; no future write should ship without activity logging.
- Profit validation persistence hooks now include `ProfitValidationSnapshotRecord` for team/internal-only snapshot previews.
- Production DB/auth/storage is still not connected: no production auth, migrations, RLS policies, storage uploads, live AI, connectors, payments, or real client data writes are enabled.
- Demo fixture leakage is guarded with `assertNoDemoFixturesInAuthenticatedMode`; `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled.
- A future production adapter requires RR approval before implementation or wiring.

## 2026-06-03 — Client Portal Full SaaS Foundation Phase 2 account/data-flow buildout

- Built the deterministic account activation model for demo-only, prospect review, onboarding, client portal ready, team review ready, active manual service, paused, canceled, and archived states.
- Built normalized client portal page state and team portal repository state models so UI surfaces can read through repository/data-mode boundaries instead of mixing demo and real-route behavior.
- Expanded repository contracts and placeholder/demo adapters with client dashboard, media, request, update, report, team repository, activity preview, account activation summary, and profit validation snapshot methods.
- Updated client portal pages to show richer repository-driven demo states while keeping real guarded routes in premium, client-safe setup states.
- Updated team portal surfaces to show account/data-mode visibility, demo-vs-placeholder labels, activity log preview status, and internal profit validation snapshot previews.
- Integrated non-persisted activity log previews and internal-only profit validation snapshot previews without production writes.
- Production runtime is still not connected: no production auth enablement, database tables, migrations, RLS policies, storage uploads, payments, live AI, or publishing integrations were added.
- Next recommended phase: RR-approved production adapter design and test harness planning before any real auth/database/storage wiring.

## 2026-06-03 — Vercel Vite frontend deployment config

- Vercel must deploy Veroxa as a Vite frontend app, not as Vercel Services.
- Vercel project framework preset should be Vite or Other, not Services.
- Vercel root directory should remain the repository root.
- Install command: `pnpm install --frozen-lockfile`.
- Build command: `pnpm --filter @workspace/veroxa run build`.
- Output directory: `artifacts/veroxa/dist`.
- The root `vercel.json` config does not enable production auth, database, storage, AI, payments, backend/serverless functions, or integrations.
