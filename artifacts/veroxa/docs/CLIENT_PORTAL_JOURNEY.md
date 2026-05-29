# Client Portal Journey

How the restaurant-partner `/client/*` portal presents a single, calm, client-safe
journey across all five pages. This was an **additive** completion pass — it layers
a shared vocabulary and a few missing surfaces on top of the existing portal without
rewriting it.

## The journey model (keystone)

`src/domain/clientPortalJourney/` is a **pure** domain module (no React, no network,
no `@lib` imports). It defines the one client-safe vocabulary every page speaks:

- **Status** (`ClientPortalJourneyStatus`): `Submitted`, `In review`,
  `Prepared by Veroxa`, `Needs your input`, `In progress`, `Completed`,
  `Included in report`, `More content needed`.
- **Type** (`ClientPortalJourneyType`): media submission, client request,
  client input needed, content preparation, monthly report, local visibility.
- **Tone** (`ClientPortalStatusTone`): maps each status to a calm visual tone.
- Helpers: `getClientPortalStatusTone`, `describeClientPortalStatus`,
  `statusNeedsClientInput`, `statusIsComplete`, `statusIsInProgress`,
  `getClientPortalTypeLabel`, `buildClientPortalProgressSummary`.

### Bridge, not coupling

The pure domain never imports app data. The translation from the existing workflow
records (`WorkflowItem` / `ClientVisibleStatus`) into the journey vocabulary lives in
`src/lib/clientPortalJourney/index.ts` (`workflowItemsToJourneyItems`, etc.). This is
the single place those two vocabularies meet, so they can never silently drift.

## Where each page sits in the journey

- **Dashboard** (`client-dashboard.tsx`) — the home/overview. Welcome + status,
  quick actions (upload media, send request, view updates/reports), what Veroxa is
  working on, what Veroxa needs from you, **recent progress** (derived via the journey
  model), local visibility progress, and the latest update/report.
- **Media** (`client-media.tsx`) — submission → status path
  (`Submitted → In review → Prepared by Veroxa → Included in report`, with a
  `More content needed` branch). Honest that real file storage is not yet connected.
- **Requests** (`client-requests.tsx`) — both directions: Veroxa's questions/asks to
  the client, **and** a client-initiated "Send Veroxa a business update" composer
  (hours, menu, closures, promos) that flows in as a `client_request` workflow item.
- **Updates** (`client-updates.tsx`) — clean weekly progress, what's being prepared,
  what we need, next focus, plus the local visibility surface.
- **Reports** (`client-reports.tsx`) — monthly report foundation: overview, the
  local visibility surface, and "ready for your report" items pulled from real
  workflow activity. Illustrative figures are clearly labelled; no invented metrics.

## Local visibility

`src/components/ClientVisibilityProgressCard.tsx` is the reusable, client-safe local
visibility surface shown on the dashboard, updates, and reports. It draws its focus
areas from the rule-based visibility audit's **client-safe** summary when available,
and falls back to a calm default checklist otherwise.

## Client-safe guardrails

Clients **never** see AI/internal/backend/connector/API/risk/audit-score/internal-ID
language. Google/Maps work is described in plain terms only:
"visibility update", "Google profile freshness", "local visibility", "review response",
"photo freshness". Business facts (hours, menu, closures) are always confirmed by
Veroxa before anything goes live — the portal never auto-publishes.

Out of scope and untouched by this pass: pricing, Owner/Operator dashboards, the
guarded `/team/*` area, the separate Demo Preview (`/demo/client/dashboard`) and
Login (`/login`) entry points, and any production auth / external connectors.
