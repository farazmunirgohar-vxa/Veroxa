# Current Replit Build Status

> Status snapshot only. This document describes what exists in the
> repository today (Replit Phase — Read-Only Operations Foundation).
> It does NOT claim that real auth, real database writes, real AI
> integrations, real publishing, real payments, or real storage
> uploads are active. They are not.

## App structure

- Monorepo managed by pnpm. The Veroxa app lives at
  `artifacts/veroxa/`.
- Stack: Vite + React + TypeScript + Wouter. Not Next.js.
- Tailwind + shadcn-style UI components in `src/components/ui/`.
- App entry: `src/App.tsx`. Routes are declared with Wouter.
- Demo data lives under `src/data/demo/` (split files). The legacy
  `src/data/demoData.ts` is now a barrel export only.

## Role portals (existing)

| Role     | Portal pages (representative)                                                |
| -------- | ---------------------------------------------------------------------------- |
| Client   | `client-portal`, `client-dashboard`, `client-media`, `client-reports`, `client-weekly-report`, `client-monthly-report`, `client-google`, `client-calendar` |
| Team     | `team-portal`, `team-dashboard`, `team-work-queue`, `team-content-review`, `team-report-queue`, `team-alerts`, `team-lead-source-lab` |
| Operator | `operator-portal`, `operator-alerts`, `operator-client-health`, `operator-report-approvals`, `operator-priority-board`, `operator-system-status` |
| Owner    | `owner-portal`, `owner-revenue`, `owner-client-health`, `owner-alerts`      |

All `/demo/*` portal routes are wrapped by `InternalDemoGuard`. The
internal preview access code is `veroxa-preview`.

## Auth mode

- `src/lib/auth/authMode.ts` exports `AUTH_MODE = "placeholder"`.
- No real Supabase auth flow is wired up. There is no production
  session. The placeholder hook is what every page sees.
- Flipping AUTH_MODE to "real" is an explicit, separate task that
  also requires `user_profiles` schema, provisioned test users, and
  Supabase env vars in Replit Secrets. It is NOT done in this phase.

## Data mode

- `src/lib/data/dataMode.ts` exports `DATA_MODE = "fixture"` by
  default (M007 switch). It can resolve to `"supabase_readonly"`
  only via `VITE_VEROXA_DATA_MODE`. In Replit preview it stays
  `"fixture"`.
- `src/lib/data/veroxaDataSource.ts` (this phase) exports the
  forward-looking switch `VEROXA_DATA_SOURCE_MODE: "demo" |
  "supabase_readonly"`, hard-coded to `"demo"`. The new repository
  layer reads from this switch.

## Demo data structure

- Canonical demo files: `src/data/demo/*.ts` (clients, client health,
  media, weekly reports, monthly reports, activity logs, operations,
  team, owner, financials, system status, notifications, posts, post
  slots, requests, agents, onboarding, walkthrough, images,
  evidence memory, content matching).
- All fixture restaurant IDs use the safe `demo-a` / `demo-b` /
  `demo-c` / `demo-d` pattern. No real client / customer data.
- `docs/DEMO_DATA_MAP.md` is the inventory of demo files and exports.

## Operational workflow pages (existing)

- `team-work-queue` — shared client-team workflow grouped by stage.
- `team-content-review` — content review queue.
- `team-report-queue` — weekly report drafting + validation.
- `operator-client-health` — per-client health (rendered via
  `ClientHealthCenter`, now repository-backed).
- `operator-priority-board` — priority + risk view.
- `operator-report-approvals` — operator-side report approval.

## Reporting pages (existing)

- `client-weekly-report` / `client-monthly-report` — client views.
- `team-report-queue` — team validation queue.
- `operator-report-approvals` — operator approval queue.
- `owner-revenue` — business-level financial KPIs.

## Read-only operations foundation (this phase)

Files added in this phase:

- `src/lib/data/veroxaDataContracts.ts` — pure TypeScript data
  contracts (`ClientAccount`, `MediaAsset`, `WorkflowItem`,
  `ClientHealthSnapshot`, `WeeklyReportSummary`,
  `MonthlyReportSummary`, `ActivityEvent` plus enums for role,
  lifecycle, content health, risk, workflow stage, report status).
- `src/lib/data/veroxaDataSource.ts` — `DataSourceMode = "demo" |
  "supabase_readonly"`. The resolved value comes from
  `VITE_VEROXA_DATA_SOURCE_MODE`; missing or invalid values fall back
  to the safe default `"demo"`. The Replit preview leaves the env var
  unset and therefore resolves to `"demo"`. Real backend behavior
  (auth, writes, AI, publishing, payments) is **not** activated by
  flipping this switch — the supabase_readonly mode only permits safe
  SELECT paths through existing read-only adapters with fixture
  fallback.
- `src/lib/supabase/supabaseReadOnlyClient.ts` — safe wrapper around
  the existing Supabase client. Returns an `{ available: false }`
  state if env vars are missing. Never writes.
- `src/lib/repositories/` — six read-only adapters
  (`clientRepository`, `mediaRepository`, `workflowRepository`,
  `healthRepository`, `reportRepository`, `activityRepository`) plus
  a diagnostic module (`supabaseReadiness`) and a barrel `index.ts`.

The repository layer reads exclusively from demo fixtures right now.
None of the repositories call the network, Supabase, AI APIs, or any
write surface.

## What remains demo-only

- All restaurant data (fictional `demo-a` … `demo-d`).
- All weekly + monthly reports.
- All media items, runways, and quality flags.
- All operator / team / owner KPIs and dashboards.
- All audit + walkthrough flows.
- All publishing / scheduling visuals.
- All AI captioning / drafting visuals.
- All financial dashboards.

## What must NOT be activated yet

- Real Supabase auth (`AUTH_MODE` stays `"placeholder"`).
- Real Supabase writes (`insert` / `update` / `delete` / `upsert`).
- Real storage uploads (`storage.upload` / `storage.remove`).
- Real AI APIs (OpenAI / Anthropic / Gemini).
- Real publishing integrations (Instagram / Facebook / Google).
- Real payment integrations (Stripe etc.).
- Service-role keys (anywhere in the frontend).

## Recent updates (2026-05-28)

- `ClientHealthCenter` shared-widget drift resolved. The component now
  reads through `healthRepository` (canonical `healthy | caution |
  urgent | broken` vocabulary) instead of `demoClientHealth` directly.
  Both `owner-client-health` and `operator-client-health` are remediated
  via the shared widget; their `TODO(client-health-drift)` blocks are
  removed. See `docs/CLIENT_HEALTH_SURFACE_MAP.md` §6.
- `VEROXA_DATA_SOURCE_MODE` is now env-resolved from
  `VITE_VEROXA_DATA_SOURCE_MODE`. Default remains `"demo"`. No real
  backend behavior is enabled.

## Next backend-readiness direction

1. Keep `VEROXA_DATA_SOURCE_MODE = "demo"` until the M024A schema
   migration is actually applied and dev RLS is approved.
2. When ready, migrate additional internal pages onto the
   repository layer (priority board, alerts, report approvals) so a
   future Supabase-read-only adapter can be swapped in centrally.
3. Activate the read-only Supabase adapter only after:
   - dev Supabase env vars are set,
   - dev `client_portal_*` views return rows under RLS,
   - every repository function has a verified fixture fallback.
4. Auth, writes, AI, publishing, payments, and uploads remain out of
   scope for this Replit phase.
