# Current Replit Build Status

> **2026-05-28 — Free Audit refinement: fixture-backed find-then-select +
> opportunity language + Veroxa service alignment**
>
> - `/free-audit` now opens with a "Find your restaurant" step backed by a
>   pure in-memory fixture (`src/data/demo/demoRestaurantSearch.ts`,
>   exported via `src/data/demoData.ts`). No network, no Google Places API,
>   no scraping. The UI labels itself "Demo search only — live Google/Maps
>   lookup is not connected yet." All candidate IDs use the
>   `sample-prospect-*` prefix to keep them visibly fake and out of the
>   demo-client namespace.
> - Cuisine no longer gates the search; selecting a candidate populates
>   identity + links, and editing the identity fields after a selection
>   clears the selection and prior report so the user can re-search.
> - Audit copy softened across the public surface: grade labels are now
>   Strong Foundation / Needs Consistency / High Opportunity / Needs
>   Structure / Needs Immediate Structure; category names are Visibility
>   Consistency, Customer Reminder Rhythm, Google Walk-In Readiness,
>   Craving Power, Customer Action Path, Trust Signals, and Weekly Visit
>   Triggers. "Top 3 weak spots" is now "Top 3 daily customer
>   opportunities" with Opportunity / Why for walk-ins / What Veroxa can
>   do. Numeric score is demoted to an internal-reference line; the grade
>   label is the primary headline.
> - `AuditPackageRecommendation` gained `expectedDirection`, populated by
>   `getExpectedDirectionForPackage` per pricing tier. Public copy never
>   promises walk-ins, revenue, rankings, reviews, viral posts, or sales —
>   each statement ends with "Results vary by location, offer, food
>   quality, competition, and execution."
> - New "Where Veroxa fits" panel renders below the opportunities section,
>   mapping each opportunity area to a Veroxa service (weekly content
>   rhythm, Google Business Profile support, media review + food-first
>   captions, etc.).
> - Lead capture preserves the selected restaurant snapshot:
>   `AuditLeadSelectedRestaurant` (id/name/city/state/address/cuisine/match
>   confidence) on `AuditLeadRecord.selectedRestaurant`, wired through
>   `createAuditLeadFromReport`. Team-facing pages still read
>   `report.weakSpots` (internal-only field name kept intact).
> - Dev login lock unchanged for this batch: `faraz` / `faraz` is the
>   temporary placeholder credential pair. Auth files were not touched —
>   this entry documents only.
> - Guardrails unchanged: AUTH=placeholder, DATA=fixture, demo IDs only,
>   no writes/auth/AI/scraping/publishing/payments/storage.

> **2026-05-28 — Client/team adaptive recs + team dashboard fully on submission repo**
>
> - `/demo/client`, `/demo/team`, and `/demo/team/direction-queue` no longer
>   feed `demoClientTeamWorkflow` into `buildAdaptiveRecommendations`. The
>   adaptive rule engine still accepts a `workflow` array, but these surfaces
>   now pass `[]` because the canonical client/team work pipeline lives in
>   `clientTeamWorkRepository`.
> - `/demo/team` "Today's Client Work" tile is now submission-derived from
>   `getTeamReadyWorkItems` + `getTeamInProgressWorkItems` (top 6). The old
>   `sortWorkflowItems(demoClientTeamWorkflow)` + `WorkflowItemCard` render
>   path is retired on this page; cards now show `teamStatusLabel`,
>   `clientVisibleNote`, and `nextTeamAction` from the repo work-item shape.
> - All four client surfaces (`/demo/client`, `/demo/client/requests`,
>   `/demo/client/media`, `/demo/client/updates`) and all four team surfaces
>   (`/demo/team`, `/demo/team/work-queue`, `/demo/team/upload-inbox`,
>   `/demo/team/direction-queue`) now read client↔team work exclusively
>   through `clientTeamWorkRepository`. `demoClientTeamWorkflow` /
>   `WorkflowItemCard` remain in the codebase only for non-target pages
>   (client-account, internal-client-detail, client-direction-center,
>   team-adaptive-intelligence) and the legacy `workflowRepository`.
> - Disabled messaging input copy unchanged: "Live messaging will connect
>   after backend activation." Guardrails unchanged: AUTH=placeholder,
>   DATA=fixture, demo IDs only, no writes/auth/AI/publishing/payments.

> **2026-05-28 — Client ↔ Team status timeline + work-item parity pass**
>
> - `src/data/demo/demoClientTeamWork.ts` now exposes a fourth fixture array,
>   `demoClientTeamStatusEvents`, modelling the future
>   `client_team_status_events` table. Each event carries a hard
>   `clientVisible` switch so internal triage / fallback notes never leak.
>   New helpers: `getStatusEventsForSubmission`, `getClientVisibleStatusEvents`,
>   `getTeamStatusEvents`, `getLatestStatusEventForSubmission`.
> - `clientTeamWorkRepository` gained `getClientLatestStatusUpdates`
>   (visibility-safe; maps status into Received / In progress / Waiting on
>   your input / Completed), `getTeamStatusTimeline`, and
>   `getTeamSubmissionStatusEvents`. `ClientWorkItem`/`TeamWorkItem` now also
>   expose `description`, `statusLabel`, `nextAction`, and `sourceSubmissionId`
>   aliases for the Step 7 work-item contract.
> - `/demo/client/requests` adds a "Recent status updates" card and
>   `/demo/client/updates` adds a "Recent Veroxa progress" strip — both
>   read from `getClientLatestStatusUpdates` and only render client-friendly
>   labels. `/demo/client/media` renamed "Open media items" →
>   "Media items with Veroxa Team" and now shows the per-item status label
>   plus next client action.
> - `/demo/team` Client Submissions summary tiles add **Ready for team** and
>   **Urgent / high** counters derived from the repo.
> - `/demo/team/work-queue` is now fully submission-derived — the old
>   `demoClientTeamWorkflow` / `groupWorkflowItemsForTeam` /
>   `WorkflowItemCard` path is retired here. Sections: Ready for team /
>   In progress / Waiting on client / Blocked by client / Recently completed,
>   each showing status label, client-visible note, internal team note, and
>   next team action.
> - `/demo/team/upload-inbox` clarifies the upload → triage → work-item →
>   client-action loop in the flow note.
> - `/demo/team/direction-queue` clarification cross-link now embeds the
>   latest status event for each waiting submission (internal events flagged
>   as `internal only`).
> - `docs/CLIENT_TEAM_WORKFLOW_CONTRACT.md` adds the fourth table
>   (`client_team_status_events`), documents `client_visible` enforcement,
>   and extends the visibility rules section.
> - Guardrails unchanged: AUTH_MODE=placeholder, DATA_MODE=fixture,
>   VEROXA_DATA_SOURCE_MODE=demo. Demo IDs only. No writes /
>   auth / AI / publishing / payments / uploads / notifications.

> **2026-05-28 — Client ↔ Team workflow is the locked near-term direction**
>
> - Client-Team workflow is now the locked near-term build direction. Demo
>   polish and Owner/Operator polish are intentionally parked.
> - `clientTeamWorkRepository` is now the **preferred source** for client/team
>   submissions, messages, and action items. New normalized helpers expose
>   visibility-safe `ClientWorkItem` and team-only `TeamWorkItem` shapes:
>   `getClient{ActionRequired,InProgress,Completed,WorkTimeline}Items`,
>   `getTeam{Ready,WaitingOnClient,InProgress,Completed,Blocked}WorkItems`,
>   plus `getSubmissionWorkItemFor{Team,Client}`.
> - Client action/status surfaces are consolidated around the repository:
>   `/demo/client`, `/demo/client/requests`, and `/demo/client/updates` now
>   derive "Action needed", "Questions from Veroxa Team", "Veroxa is working
>   on", and "Recently completed" from the same submission pipeline. The
>   parallel `demoClientRequests` and `demoClientTeamWorkflow` displays on
>   `/demo/client/requests` and the workflow strip on `/demo/client` have
>   been retired in favor of submission-derived cards.
> - Team work intake and queues are connected to client-team submissions.
>   `/demo/team/work-queue` no longer points at Audit Leads as the origin of
>   signed-client work; the focus is on submissions + direction interpretation.
> - `docs/CLIENT_TEAM_WORKFLOW_CONTRACT.md` defines the future Supabase
>   table slice (`client_team_submissions`, `client_team_messages`,
>   `client_action_items`) with draft fields and the first future write paths.
> - `src/data/demo/demoClientTeamWork.ts` now exposes optional workflow-typing
>   fields (`sourceChannel`, `workType`, `teamWorkStatus`, `clientStatusLabel`,
>   `teamStatusLabel`, `nextTeamAction`, `nextClientAction`) with pure
>   derivation helpers, so fixtures stay small.
> - Guardrails unchanged: AUTH_MODE=placeholder, DATA_MODE=fixture,
>   VEROXA_DATA_SOURCE_MODE=demo. No real auth/backend/AI/publishing/payment/
>   notification/storage activated. No writes. Demo IDs only.

> **2026-05-28 — Client ↔ Team workflow & communication layer**
>
> - New demo fixtures: `src/data/demo/demoClientTeamWork.ts` models
>   real-life client/team submissions, messages, and action items
>   (future tables: `client_team_submissions`, `client_team_messages`,
>   `client_action_items`). Read-only, demo-a..demo-d only. Visibility
>   split (`client_and_team` vs `team_only`, plus internal team notes).
> - New repository: `src/lib/repositories/clientTeamWorkRepository.ts`
>   enforces visibility — `getClientVisibleMessages` drops `team_only`,
>   `getSubmissionThread` returns both visibilities for team surfaces.
> - Client surfaces (`/demo/client`, `/demo/client/requests`,
>   `/demo/client/media`, `/demo/client/updates`): added
>   "Action needed from you" callout, "Questions from Veroxa Team",
>   "Veroxa is working on", "Conversation with Veroxa Team" (You /
>   Veroxa Team labels, disabled "Live messaging will connect after
>   backend activation." input), "Open media items" tile, and
>   "What Veroxa is working on for you" recap. Internal notes never
>   rendered on client pages.
> - Team surfaces (`/demo/team`, `/demo/team/work-queue`,
>   `/demo/team/upload-inbox`, `/demo/team/direction-queue`): added
>   "Client Submissions" summary tiles, "Client submissions snapshot"
>   with Internal Team Note spotlight on blocked items, "Related
>   media items from client/team workflow", and a
>   "Client submissions awaiting clarification" cross-link.
> - `/upload` access page: extended "What happens after upload" copy
>   to describe the team triage / re-shoot loop. No upload behavior
>   changed.
> - Guardrails unchanged: AUTH_MODE=placeholder, DATA_MODE=fixture,
>   VEROXA_DATA_SOURCE_MODE=demo, only demo-a..demo-d, no
>   writes/auth/AI/publishing/payments/uploads.

> **2026-05-28 — Client acquisition & execution clarity pass**
>
> - Public audit CTAs in `PublicNav` and `landing` now route to
>   `/free-audit` (Link) instead of `mailto:`. CTA label standardized
>   to "Get Free (Restaurant) Audit".
> - `/free-audit` gained a trust strip (What Veroxa reviews / What
>   you receive / What this is not) and a clearer walkthrough success
>   message. Audit + walkthrough save logic unchanged (still
>   `localAuditLeadStore`, demo-only).
> - `/guided-demo` adds quick-start CTAs ("Start with a Free Audit",
>   "Preview Client Portal") and a short owner-facing flow blurb.
> - `/demo/client` (dashboard) and `/demo/client/media` and `/upload`
>   gained "What Veroxa needs from you" + "What happens after upload"
>   copy. No upload behavior changed — still no real network or
>   storage writes.
> - `/demo/team/audit-leads` now shows a visible lead pipeline strip
>   (New Audit → Ready to Contact → Walkthrough Booked → Proposal
>   Sent → Won/Lost) with counts and a "Convert to Client Preview"
>   callout when Won > 0.
> - `/demo/team/work-queue` cross-links to Audit Leads.
>   `/demo/team/upload-inbox` adds a one-line note that uploads feed
>   the execution flow.
> - Guardrails unchanged: AUTH_MODE=placeholder,
>   DATA_MODE=fixture, VEROXA_DATA_SOURCE_MODE=demo, only
>   demo-a..demo-d, no writes/auth/AI/payments/uploads.



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
