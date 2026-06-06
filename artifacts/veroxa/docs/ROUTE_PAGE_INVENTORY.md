# Route and Page Inventory

Status: containment inventory created after P0/P1 hardening. No pages were deleted.

## Classification rules

- `active_routed`: routed in `src/App.tsx` as part of the current product surface.
- `public_demo`: intentionally public demo/preview route.
- `future_planned`: useful future work, not currently active.
- `legacy_quarantined`: old/placeholder work kept unrouted until a later cleanup decision.
- `internal_debug`: diagnostic/internal page that must stay unrouted unless explicitly protected later.
- `delete_candidate`: no known purpose; review manually before deleting.

## Active route rules

- No `/owner/*` routes.
- No `/operator/*` routes.
- No deprecated `/demo/team/*` routes.
- Debug/internal pages remain unrouted.
- Client nav remains: Dashboard, Media, Updates, Requests, Reports.
- Team nav remains the intentional `/team/*` review cockpit documented in `src/lib/teamPortalNav.ts`.


## 2026-06-05 final trim route hygiene

- Active public flow: `/`, `/free-audit`, `/login`.
- Hidden compatibility routes: `/services`, `/pricing`; they keep older links safe without reviving a public Services/Pricing funnel.
- Hidden internal/demo QA routes: `/demo`, `/guided-demo`, `/demo/client/*`, and `/upload`; they must be labeled sample/QA/demo-only and must not be promoted by public navigation or homepage CTAs. `/upload` remains demo-only and does not add live storage/upload.
- Real client portal routes: `/client/dashboard`, `/client/onboarding`, `/client/media`, `/client/updates`, `/client/requests`, `/client/reports`; guarded and client-safe.
- Real team portal routes: `/team/*`; guarded supporting/manual internal routes for Faraz review only. Team complexity remains deferred: no Owner/Operator/Super Admin/generic Admin/Execution dashboards and no AI command-center automation.

## Inventory

| Filename | Routed? | Classification | Recommended action |
| --- | --- | --- | --- |
| `auth-status.tsx` | no | internal_debug | Keep unrouted; use only for internal diagnostics if explicitly protected later. |
| `client-account.tsx` | no | future_planned | Keep as future client account surface; do not route until requested. |
| `client-activity-log.tsx` | no | future_planned | Keep as future activity/history surface. |
| `client-ai-agents.tsx` | no | legacy_quarantined | Keep quarantined; do not expose client AI internals. |
| `client-ai-draft-preview.tsx` | no | future_planned | Keep unrouted; avoid exposing AI draft internals to clients. |
| `client-calendar.tsx` | no | future_planned | Keep as future scheduling/calendar work. |
| `client-content-pipeline.tsx` | no | future_planned | Keep as future content progress work; simplify before routing. |
| `client-dashboard.tsx` | yes | public_demo | Active real client dashboard and public demo alias; keep guarded context behavior. |
| `client-direction-center.tsx` | no | future_planned | Keep for optional media/account direction after security review. |
| `client-google.tsx` | no | future_planned | Keep for future Google visibility; do not route until client-safe. |
| `client-health-command.tsx` | no | future_planned | Keep as future readiness surface; simplify before routing. |
| `client-media.tsx` | yes | active_routed | Active client media page. |
| `client-monthly-report.tsx` | no | future_planned | Keep for future report detail routing. |
| `client-onboarding-center.tsx` | no | future_planned | Keep for later onboarding; not active now. |
| `client-onboarding.tsx` | yes | active_routed | Active guarded client onboarding page plus public demo alias; keep setup/demo context safe. |
| `client-portal.tsx` | no | future_planned | Keep as parked/legacy portal shell candidate; do not route now. |
| `client-reports.tsx` | yes | active_routed | Active client reports page. |
| `client-requests.tsx` | yes | active_routed | Active client requests page. |
| `client-updates.tsx` | yes | active_routed | Active client updates page. |
| `client-weekly-report.tsx` | no | future_planned | Keep for future report detail routing. |
| `client-workspace.tsx` | no | future_planned | Keep unrouted until simplified. |
| `demo-hub.tsx` | yes | public_demo | Active demo entry; must only promote `/demo/client/dashboard`. |
| `free-audit.tsx` | yes | active_routed | Active public audit request page. |
| `guided-demo.tsx` | yes | public_demo | Active guided demo page. |
| `internal-architecture.tsx` | no | internal_debug | Keep quarantined and unrouted. |
| `internal-db-explorer.tsx` | no | internal_debug | Keep quarantined and unrouted. |
| `internal-demo-controls.tsx` | no | internal_debug | Keep quarantined and unrouted. |
| `internal-integrations.tsx` | no | internal_debug | Keep quarantined and unrouted. |
| `internal-permissions.tsx` | no | internal_debug | Keep quarantined and unrouted. |
| `internal-supabase-readiness.tsx` | no | internal_debug | Keep quarantined and unrouted; internal diagnostics only. |
| `internal-system-status.tsx` | no | internal_debug | Keep quarantined and unrouted. |
| `landing.tsx` | yes | active_routed | Active public homepage. |
| `login.tsx` | yes | active_routed | Active portal login page. |
| `not-found.tsx` | yes | active_routed | Active fallback route. |
| `pricing.tsx` | yes | active_routed | Active locked pricing page. |
| `real-client-placeholder.tsx` | no | legacy_quarantined | Keep quarantined; no active route. |
| `real-route-placeholder.tsx` | no | legacy_quarantined | Keep quarantined; no active route. |
| `real-team-placeholder.tsx` | no | legacy_quarantined | Keep quarantined; no active route. |
| `restaurant-upload-access.tsx` | yes | public_demo | Active public upload-key entry; no storage upload added. |
| `services.tsx` | yes | active_routed | Active public services page. |
| `supabase-test.tsx` | no | internal_debug | Keep quarantined and unrouted. |
| `team-activity-feed.tsx` | no | future_planned | Keep as future team history/feed surface. |
| `team-adaptive-intelligence.tsx` | no | future_planned | Keep unrouted; avoid AI-lab feel. |
| `team-ai-review.tsx` | no | future_planned | Keep unrouted; avoid exposing raw AI workflow. |
| `team-alert-center.tsx` | no | future_planned | Keep for future calm operational alerts. |
| `team-approval-queue.tsx` | yes | active_routed | Active team approval queue. |
| `team-audit-leads.tsx` | yes | active_routed | Active team audit leads page. |
| `team-content-review.tsx` | no | future_planned | Keep as possible future review surface. |
| `team-dashboard.tsx` | yes | active_routed | Active team dashboard. |
| `team-direction-queue.tsx` | yes | active_routed | Active team direction queue. |
| `team-drafts.tsx` | no | future_planned | Keep unrouted until draft workflow is reviewed. |
| `team-first-client-readiness.tsx` | yes | active_routed | Active team readiness page. |
| `team-lead-source-lab.tsx` | no | future_planned | Keep unrouted; review naming before any route. |
| `team-media-review.tsx` | no | future_planned | Keep as future media review surface. |
| `team-performance.tsx` | no | future_planned | Keep for future reporting/metrics. |
| `team-portal.tsx` | no | future_planned | Keep as parked/legacy portal shell candidate; do not route now. |
| `team-prospect-scanner.tsx` | no | future_planned | Keep unrouted; Google/API usage must stay protected. |
| `team-report-queue.tsx` | yes | active_routed | Active team report queue. |
| `team-scheduling.tsx` | no | future_planned | Keep for future queue/scheduling. |
| `team-upload-inbox.tsx` | yes | active_routed | Active team upload inbox. |
| `team-visibility-audit.tsx` | yes | active_routed | Active team visibility audit page. |
| `team-work-queue.tsx` | yes | active_routed | Active team work queue. |

## Deletion posture

No route/page files were deleted in this pass. Future deletion should happen only after owner review confirms a file is dead, not merely unrouted.

## 2026-06-06 — A–Z cleanup route policy

See the [Veroxa OS System Map](./VEROXA_OS_SYSTEM_MAP.md) for the high-level route map and [Quarantined and Future Files Review](./QUARANTINED_AND_FUTURE_FILES_REVIEW.md) for unrouted/parked page cleanup notes.

- Active public flow: `/`, `/free-audit`, `/login`.
- Hidden compatibility routes: `/services`, `/pricing`.
- Hidden demo/QA-only routes: `/demo`, `/guided-demo`, `/upload`, `/demo/client/dashboard`, `/demo/client/media`, `/demo/client/updates`, `/demo/client/requests`, `/demo/client/reports`, `/demo/client/onboarding`.
- Guarded client routes: `/client/dashboard`, `/client/onboarding`, `/client/media`, `/client/requests`, `/client/updates`, `/client/reports`.
- Guarded Team/manual routes: `/team/dashboard`, `/team/onboarding`, `/team/upload-inbox`, `/team/work-queue`, `/team/manual-execution`, `/team/direction-queue`, `/team/report-queue`, `/team/audit-leads`, `/team/approval-queue`, `/team/visibility-audit`, `/team/first-client-readiness`, `/team/first-client-ops`.
- No parked or quarantined page may be routed without updating `ROUTE_PAGE_INVENTORY.md`, `VEROXA_ROUTE_SURFACE_MAP.md`, and passing RR.

A–Z cleanup added the system map, strengthened demo/QA route policy, aligned backend execution docs, completed client premium copy polish, documented AI activation prerequisites, and added no live systems.
