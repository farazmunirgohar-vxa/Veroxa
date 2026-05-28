# Current Replit Build Status

> **2026-05-28 — Live Audit Lookup V1 added (Free Audit acquisition milestone)**
>
> - The `/free-audit` flow now connects to a real Google Places lookup when
>   `GOOGLE_PLACES_API_KEY` is configured server-side, with a graceful
>   preview fallback when it is not. Server-only routes:
>   `POST /api/audit/search-restaurants` and
>   `POST /api/audit/restaurant-details` in
>   `artifacts/api-server/src/routes/auditLive.ts`.
> - New server libs (`artifacts/api-server/src/lib/`):
>   - `googlePlaces.ts` — Places API v1 Text Search + Place Details with
>     explicit field masks, safe error handling, and a structured
>     `{ mode: "live" | "not_configured" | "error", ... }` response shape.
>   - `webPresenceScanner.ts` — opt-in scan of the restaurant's own website
>     only (no third-party domains), 350 KB / 10 s limits, extracts menu,
>     ordering, reservation, contact path, and Instagram/Facebook/TikTok
>     link signals.
> - Client helper `artifacts/veroxa/src/lib/audit/liveAuditClient.ts`
>   exports `searchLiveRestaurantCandidates` and
>   `getLiveRestaurantDetails` — both always return a structured
>   `{ mode, ... }` value and never throw into the UI.
> - Free Audit page (`pages/free-audit.tsx`):
>   - Cuisine is no longer required to find or generate an audit; if left
>     blank, it is recorded as "Restaurant / Food — category not verified."
>   - The "Load a demo example" strip is removed. Live results are clearly
>     labeled "Live Google result"; fallback results are labeled "Preview
>     fallback result" with an explanatory note when live is unavailable
>     or not configured.
>   - Selecting a live candidate fetches details and runs the own-website
>     scan; the selected card shows phone, rating, website, Google Maps
>     link, and found-status badges for menu / order / contact / Instagram
>     / Facebook links.
> - Lead snapshot (`leadTypes.ts` `AuditLeadSelectedRestaurant`) now
>   carries optional live fields: placeId, source (`google_places` /
>   `fixture` / `manual`), phone, rating, website, Google Maps URL,
>   business status, discovered menu/social links, found-status flags,
>   scan confidence, and AI-draft availability. `localAuditLeadStore`
>   already passes the snapshot through unchanged.
> - Team Audit Leads (`pages/team-audit-leads.tsx`) selected lead detail
>   panel adds an "Audit lead context" block with Source (Live / Preview /
>   Manual) badge, AI draft Yes/No badge, address, phone, rating, and
>   found-status badges (Website / Menu link / Order link / Contact path /
>   Social links).
> - Lenient public-facing language: `auditScoring.ts` and
>   `auditPackageRecommendation.ts` swap "weak / poor / fix the weak
>   foundation" for "can be strengthened / underused / strengthen the
>   foundation first" in the publicly rendered strings. Internal scoring
>   thresholds and grade IDs are unchanged.
> - Auth remains placeholder, data mode remains `fixture` / `demo`. No
>   backend writes were added; live lookups read from Google only.

> **2026-05-28 — AI Audit Report Assistant V1 added**
>
> - New optional AI panel on `/free-audit`: button "Generate AI-assisted
>   summary" turns the existing rule-based Veroxa Restaurant Growth Report
>   into an owner-friendly DRAFT. The rule-based report remains the source
>   of truth and is always rendered.
> - Server-side only: `OPENAI_API_KEY` is read from environment variables /
>   Replit Secrets inside `artifacts/api-server/src/lib/aiAuditAssistant.ts`
>   and is never exposed to the browser. Route: `POST /api/audit/ai-draft`
>   (`artifacts/api-server/src/routes/auditAi.ts`).
> - Response shape: `{ mode: "ai" | "not_configured" | "error", aiDraft: {
>   executiveSummary, topOpportunities[], veroxaFixPlan,
>   manualReviewNeeded[], ownerFriendlyClosing } | null, message? }`.
>   Missing key → `not_configured` with copy: "AI summary is not
>   configured yet. The rule-based report is still available." Raw OpenAI
>   errors are never forwarded to the client.
> - Prompt rules (system prompt): use ONLY the provided audit signals,
>   never invent metrics / rankings / ad spend / revenue / reviews /
>   verification, never guarantee outcomes, preserve uncertainty,
>   separate found / not found / manual review needed, consultative
>   lenient tone, draft for human review, no access to ChatGPT history.
> - Client helper: `src/lib/audit/aiAuditClient.ts` exports
>   `buildAiAuditDraftPayload(report)` and
>   `generateAiAuditDraftClient(payload)`. Handles missing / error
>   states gracefully — never throws into the UI.
> - UI panel is clearly labeled "AI-assisted draft — review before
>   sharing" with the safety line: "This draft is generated from the
>   audit signals shown above. It may need human review before being
>   shared with a restaurant owner." Draft is not auto-saved, not
>   auto-sent, not published.
> - Guardrails unchanged: AUTH_MODE=placeholder, DATA_MODE=fixture,
>   VEROXA_DATA_SOURCE_MODE=demo. No publishing, no client messaging,
>   no payments, no Supabase writes, no storage uploads, no DB
>   migrations, no notifications. Owner/Operator/Client/Team portal
>   pages untouched.

> **2026-05-28 — Client ↔ Team Workflow backend-readiness batch finalized**
>
> - `clientTeamWorkRepository` (`src/lib/repositories/clientTeamWorkRepository.ts`)
>   is now the single normalized source of truth for client↔team work on
>   both portals. Exposes `ClientWorkItem` / `TeamWorkItem` types plus 12
>   helpers: client-side `getClient{ActionRequired,InProgress,Completed,
>   WorkTimeline}Items`, team-side `getTeam{Ready,WaitingOnClient,
>   InProgress,Completed,Blocked}WorkItems`, and shared
>   `getSubmissionWorkSummary`, `getSubmissionWorkItemFor{Team,Client}`.
>   Client helpers strip `internalTeamNote` and team-only messages.
> - `demoClientTeamWork.ts` carries the optional work-state fields
>   (`sourceChannel`, `workType`, `teamWorkStatus`, `clientStatusLabel`,
>   `teamStatusLabel`, `nextTeamAction`, `nextClientAction`) as derivation
>   helpers (`getSubmissionWorkType`, `getSubmissionTeamWorkStatus`,
>   `getSubmissionClientStatusLabel`, `getSubmissionTeamStatusLabel`,
>   `getSubmissionNextTeamAction`, `getSubmissionNextClientAction`) plus
>   query helpers (`getActiveSubmissionsForClient`,
>   `getClientActionableSubmissions`, `getTeamReadySubmissions`,
>   `getTeamWaitingOnClientSubmissions`, `getCompletedSubmissionsForClient`,
>   `getSubmissionById`). Derivation is preferred over fixture bloat.
> - Client pages (`client-dashboard`, `client-requests`, `client-updates`,
>   `client-media`) consume only repository helpers for action / status /
>   communication sections. Legacy `demoClientRequests`,
>   `demoClientTeamWorkflow`, and `WorkflowItemCard` are no longer used on
>   any of those four pages. Disabled message input on `client-requests`
>   stays exactly: "Live messaging will connect after backend activation."
> - Team pages all read from `clientTeamWorkRepository` as the single
>   source of truth: `team-dashboard` and `team-work-queue` consume the
>   normalized team work-item helpers (`getTeam{Ready,InProgress,
>   WaitingOnClient,Blocked,Completed}WorkItems`,
>   `getTeamWorkCommunicationSummary`, `getTeamInbox`,
>   `getTeamNeedsClientClarification`, `getTeamBlockedItems`).
>   `team-upload-inbox` uses `getClientSubmissions` (filtered to media)
>   for the cross-link card, and `team-direction-queue` uses
>   `getTeamNeedsClientClarification` + `getTeamSubmissionStatusEvents`
>   for its clarification cross-link — both pages keep their own
>   non-workflow domains (upload submissions, direction requests) but
>   pull the client-submission overlay from the repository. The team
>   work queue has no "Audit Leads once a prospect converts" distraction
>   line (remaining "Audit Leads" mentions are the legitimate
>   `/demo/team/audit-leads` nav target).
> - `docs/CLIENT_TEAM_WORKFLOW_CONTRACT.md` is the canonical future
>   Supabase contract: purpose, fixture/repository baseline, four future
>   tables (`client_team_submissions`, `client_team_messages`,
>   `client_action_items`, `client_team_status_events`), draft fields,
>   visibility rules, out-of-scope list, and first future write path. No
>   separate `SUPABASE_TABLE_CONTRACT.md` exists — this doc is the single
>   place.
> - `docs/DEMO_DATA_MAP.md` already lists every helper in the
>   `demoClientTeamWork.ts` row; no map update was needed.
> - Guardrails unchanged: AUTH=placeholder, DATA=fixture,
>   VEROXA_DATA_SOURCE_MODE=demo. No backend writes, no Supabase, no
>   network, no AI, no publishing, no notifications, no storage. Demo
>   IDs only.

> **2026-05-28 — Temporary role-based dev login preview added**
>
> - Login page (`src/pages/login.tsx`) now accepts four temporary
>   development credentials while `AUTH_MODE === "placeholder"`:
>   - Client:   `faraz@client.com` / `farazclient` → `/demo/client/dashboard`
>   - Team:     `faraz@team.com` / `farazteam` → `/demo/team/dashboard`
>   - Operator: `faraz@operator.com` / `farazoperator` → `/demo/operator/operator-os`
>   - Owner:    `faraz@owner.com` / `farazowner` → `/demo/owner/executive-dashboard`
> - Routing reuses the existing `DEMO_ROLE_HOME_PATH` map in
>   `src/lib/auth/authContract.ts`; no new routes were invented and
>   `App.tsx` was not touched.
> - New helper `src/lib/auth/devCredentials.ts` exports
>   `DEV_ROLE_CREDENTIALS`, `validateDevCredentials`, and
>   `getDevRouteForRole`. No Supabase, no network, no hashing, no
>   secrets, no production users, no service-role key.
> - Login form shows a persistent dev-access notice: "Development access
>   only — production authentication is not connected yet." Bad
>   credentials show "Invalid development credentials." Role separation
>   is enforced — each credential routes only to its own portal; the
>   previously documented shared `faraz / faraz` credential is not
>   accepted (no code accepted it previously, so nothing was removed).
> - Real-auth Supabase branch in `handleSignInSubmit` is untouched and
>   inactive — flips on automatically when `AUTH_MODE === "real"`.
> - Guardrails: AUTH=placeholder, DATA=fixture, VEROXA_DATA_SOURCE_MODE=demo.
>   No real Supabase auth, no production users, no backend writes,
>   no AI, no publishing, no payments, no notifications, no storage.
> - This is development-only. To remove later: delete
>   `src/lib/auth/devCredentials.ts` and the placeholder branch in
>   `login.tsx` that uses it.

> **2026-05-28 — Free Audit result copy refined: consultative tone, less scorecard-heavy**
>
> - Free Audit result copy refined to be more consultative and less scorecard-heavy.
> - Primary result headline stays on grade label (Strong Foundation / Needs Consistency /
>   High Opportunity / Needs Structure / Needs Immediate Structure). Numeric score is now
>   labeled "Internal readiness reference" — clearly secondary and for internal use only.
> - Main result explanation updated to: "This does not judge the food or quality of the
>   restaurant. It shows how consistently the restaurant appears online when nearby customers
>   are deciding where to eat. More consistent visibility can create more customer reminder
>   moments, but results vary by location, offer, food quality, competition, and execution."
> - "Top 3 daily customer opportunities" cards cleaned up: removed redundant title repetition.
>   Each card now shows Opportunity (numbered label + title) / Why this matters for walk-ins /
>   What Veroxa can do. No harsh language (weak, bad, poor, failing, problem, low score,
>   foundational problem, underbuilt) on any public card.
> - "Where Veroxa fits" panel is now more action-oriented. Intro: "If this restaurant became
>   a Veroxa client, the first focus would likely be:" followed by 6 concrete Veroxa actions
>   (Google profile/photo freshness, weekly food-content rhythm, lunch/dinner/weekend posting
>   windows, media review + food-first captions, menu/order/contact path clarity, weekly
>   update + monthly strategy report). No guaranteed outcomes claimed.
> - Restaurant search disclaimer tightened: "Search preview only — live Google/Maps lookup
>   is not connected yet." (was "Demo search only…").
> - `formatThirtyDayPlan` week 1 bullet updated: "Identify the biggest daily customer
>   opportunity and frame the first 30-day plan around it." (previously referenced "weakest
>   customer-flow stage").
> - `growth_leverage_opportunity` howVeroxaHelps updated: "Veroxa identifies the biggest
>   daily opportunity and focuses early work where the most consistent improvement can happen."
> - No live lookup, backend, AI, scraping, publishing, payments, notifications, or storage
>   added. AUTH=placeholder, DATA=fixture, demo IDs only. Auth files not touched.

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

- Free Audit now outputs the **Veroxa Restaurant Growth Report V1**.
  The report is labeled "Veroxa Restaurant Growth Report" with subtitle
  "A preliminary look at how this restaurant appears across Google,
  Maps, website, social media, trust signals, and customer decision
  paths." Sections covered: Restaurant Identity, Google Search SEO,
  Google Maps / Local SEO, Google Business Profile Strength, Website +
  Menu / Order / Contact Path, Social Media Standing, Content
  Consistency, Reviews + Trust Signals, Ads Readiness, Daily Walk-In
  Opportunity, and What Veroxa Would Fix First. Each section shows
  Current signal, Why it matters, Veroxa recommendation, and a source
  label (found / not found / manual review needed). Ads section is
  honest — does not claim to verify active campaigns. Numeric score is
  secondary (labeled "Internal reference"). `googleRating` and
  `reviewCount` from candidate selection now flow into the report
  sections. `GrowthReportSection` and `GrowthReportSourceLabel` types
  added to `auditTypes.ts`. `generateGrowthReportSections` added to
  `auditScoring.ts` (pure function, no network). No live Google API,
  scraping, AI, Supabase writes, publishing, payments, notifications,
  or storage added.

- Client-Team Workflow Backend Readiness batch landed.
  `clientTeamWorkRepository` is now the single normalized source of
  truth for client↔team work on both portals. `demoClientTeamWork.ts`
  carries optional `sourceChannel`, `workType`, `teamWorkStatus`,
  `clientStatusLabel`, `teamStatusLabel`, `nextTeamAction`,
  `nextClientAction` (derived via helpers, not bloated fixtures) plus
  6 query helpers (`getActiveSubmissionsForClient`,
  `getClientActionableSubmissions`, `getTeamReadySubmissions`,
  `getTeamWaitingOnClientSubmissions`,
  `getCompletedSubmissionsForClient`, `getSubmissionById`). The
  repository exports 12 normalized helpers
  (`getClient{ActionRequired,InProgress,Completed,WorkTimeline}Items`,
  `getTeam{Ready,WaitingOnClient,InProgress,Completed,Blocked}WorkItems`,
  `getSubmissionWorkSummary`,
  `getSubmissionWorkItemFor{Team,Client}`) with a visibility-safe split
  so client surfaces never see team-only status text. Client pages
  (`client-dashboard`, `client-requests`, `client-updates`,
  `client-media`) and team pages (`team-dashboard`,
  `team-upload-inbox`, `team-work-queue`, `team-direction-queue`) all
  consume the new helpers. `demoClientRequests` /
  `demoClientTeamWorkflow` / `WorkflowItemCard` are no longer used by
  these pages. Disabled messaging copy on client portal stays
  exactly "Live messaging will connect after backend activation."
  Future Supabase contract published in
  `docs/CLIENT_TEAM_WORKFLOW_CONTRACT.md` (the earlier
  `SUPABASE_TABLE_CONTRACT.md` is folded into it). No Supabase writes,
  auth, or AI calls were activated.
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
