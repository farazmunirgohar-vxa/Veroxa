# Route and Page Inventory

Status: final deletion/quarantine review completed after A–Z cleanup. No pages were deleted and no delete-now page files are confirmed.

## Classification rules

- `active_routed`: routed in `src/App.tsx` as part of the current product surface.
- `public_demo`: intentionally public demo/QA preview route only.
- `active_routed + demo_alias`: canonical guarded `/client/*` page that is also mounted under `/demo/client/*` with sample/demo context.
- `future_planned`: useful future work, not currently active.
- `legacy_quarantined`: old, AI-draft, or placeholder shell kept hard-quarantined and unrouted until a later owner-approved cleanup or activation decision.
- `internal_debug`: diagnostic/internal page that must stay unrouted and must never become a public/client route.
- `delete_review_only`: no confirmed current purpose; deletion still requires owner approval and a separate cleanup PR unless confirmed unused.

## Active route rules

- No `/owner/*` routes.
- No `/operator/*` routes.
- No `/super-admin/*` routes.
- No generic `/admin/*` routes.
- No `/execution/*` routes.
- No deprecated `/demo/team/*` routes.
- Parked, future, quarantined, internal-debug, and legacy shell pages require owner approval, route inventory update, route surface map update, guardrail update, and RR before routing.
- Debug/internal pages remain unrouted and must never become public/client routes.
- Client nav remains: Dashboard, Onboarding, Media, Updates, Requests, Reports.
- Team nav remains the intentional `/team/*` review cockpit documented in `src/lib/teamPortalNav.ts`.

## 2026-06-06 final deletion/quarantine review route hygiene

- Active public flow: `/`, `/free-audit`, `/login`.
- Hidden compatibility routes: `/services`, `/pricing`; they keep older links safe without reviving a public Services/Pricing funnel.
- Demo/QA-only routes: `/demo`, `/guided-demo`, `/demo/client/*`, and `/upload`; they must be labeled sample/QA/demo-only and must not be promoted by public navigation or homepage CTAs. `/upload` remains demo-only and does not add live storage/upload.
- Guarded client routes: `/client/dashboard`, `/client/onboarding`, `/client/media`, `/client/updates`, `/client/requests`, `/client/reports`; guarded and client-safe.
- Dual-use client pages mounted under `/demo/client/*` are classified as `active_routed + demo_alias` because they are guarded client route pages with public sample/demo aliases.
- Guarded Team/manual routes: `/team/*`; guarded supporting/manual internal routes for Faraz review only. Team complexity remains deferred: no Owner/Operator/Super Admin/generic Admin/Execution dashboards and no AI command-center automation.
- See [`QUARANTINED_AND_FUTURE_FILES_REVIEW.md`](./QUARANTINED_AND_FUTURE_FILES_REVIEW.md) before routing, deleting, or reviving any parked page.

## Inventory

| Filename | Routed? | Classification | Recommended action |
| --- | --- | --- | --- |
| `auth-status.tsx` | no | internal_debug | Keep unrouted; use only for internal diagnostics if explicitly protected later. |
| `client-account.tsx` | no | future_planned | Keep as future client account surface; do not route until owner approval, docs updates, guardrail update, and RR. |
| `client-activity-log.tsx` | no | future_planned | Keep as future activity/history surface; do not route until owner approval, docs updates, guardrail update, and RR. |
| `client-ai-agents.tsx` | no | legacy_quarantined | Hard quarantine; do not expose client AI internals or route without owner-approved RR. |
| `client-ai-draft-preview.tsx` | no | legacy_quarantined | Hard quarantine; avoid exposing AI draft internals, live AI, automatic publishing, or review bypass. |
| `client-calendar.tsx` | no | future_planned | Keep as future calendar/planning work; do not route until owner approval, docs updates, guardrail update, and RR. |
| `client-content-pipeline.tsx` | no | future_planned | Keep as future content progress work; simplify before routing and require owner-approved RR. |
| `client-dashboard.tsx` | yes | active_routed + demo_alias | Guarded client route `/client/dashboard` plus public sample alias `/demo/client/dashboard`; keep guarded/demo context behavior. |
| `client-direction-center.tsx` | no | future_planned | Keep for optional media/account direction after security review; do not route now. |
| `client-google.tsx` | no | future_planned | Keep for future Google visibility; do not route until client-safe and owner-approved. |
| `client-health-command.tsx` | no | future_planned | Keep as future readiness surface; simplify before routing and require owner-approved RR. |
| `client-media.tsx` | yes | active_routed + demo_alias | Guarded client route `/client/media` plus public sample alias `/demo/client/media`; keep client-safe media review behavior. |
| `client-monthly-report.tsx` | no | future_planned | Keep for future report detail routing; do not route now. |
| `client-onboarding-center.tsx` | no | future_planned | Keep for later onboarding; not active now. |
| `client-onboarding.tsx` | yes | active_routed + demo_alias | Guarded client route `/client/onboarding` plus public sample alias `/demo/client/onboarding`; keep setup/demo context safe. |
| `client-portal.tsx` | no | legacy_quarantined | Parked legacy portal shell; do not route without owner-approved RR and route-doc updates. |
| `client-reports.tsx` | yes | active_routed + demo_alias | Guarded client route `/client/reports` plus public sample alias `/demo/client/reports`; keep proof/report copy client-safe. |
| `client-requests.tsx` | yes | active_routed + demo_alias | Guarded client route `/client/requests` plus public sample alias `/demo/client/requests`; keep request boundaries intact. |
| `client-updates.tsx` | yes | active_routed + demo_alias | Guarded client route `/client/updates` plus public sample alias `/demo/client/updates`; keep weekly-update copy safe. |
| `client-weekly-report.tsx` | no | future_planned | Keep for future report detail routing; do not route now. |
| `client-workspace.tsx` | no | future_planned | Keep unrouted until simplified and owner-approved. |
| `demo-hub.tsx` | yes | public_demo | Active demo/QA entry only; must only promote `/demo/client/dashboard` as sample preview. |
| `free-audit.tsx` | yes | active_routed | Active public audit request page. |
| `guided-demo.tsx` | yes | public_demo | Active guided demo/QA page only; keep sample labels and no live execution implication. |
| `internal-architecture.tsx` | no | internal_debug | Keep quarantined and unrouted; never public/client route. |
| `internal-db-explorer.tsx` | no | internal_debug | Keep quarantined and unrouted; never public/client route. |
| `internal-demo-controls.tsx` | no | internal_debug | Keep quarantined and unrouted; never public/client route. |
| `internal-integrations.tsx` | no | internal_debug | Keep quarantined and unrouted; never public/client route. |
| `internal-permissions.tsx` | no | internal_debug | Keep quarantined and unrouted; never public/client route. |
| `internal-supabase-readiness.tsx` | no | internal_debug | Keep quarantined and unrouted; internal diagnostics only. |
| `internal-system-status.tsx` | no | internal_debug | Keep quarantined and unrouted; never public/client route. |
| `landing.tsx` | yes | active_routed | Active public homepage. |
| `login.tsx` | yes | active_routed | Active portal login page. |
| `not-found.tsx` | yes | active_routed | Active fallback route. |
| `pricing.tsx` | yes | active_routed | Hidden compatibility pricing page; keep locked $495 offer aligned. |
| `real-client-placeholder.tsx` | no | legacy_quarantined | Hard quarantine; no active route. |
| `real-route-placeholder.tsx` | no | legacy_quarantined | Hard quarantine; no active route. |
| `real-team-placeholder.tsx` | no | legacy_quarantined | Hard quarantine; no active route. |
| `restaurant-upload-access.tsx` | yes | public_demo | Active demo/QA upload-key entry only; no storage upload added. |
| `services.tsx` | yes | active_routed | Hidden compatibility services page; do not revive Services/Pricing as main funnel. |
| `supabase-test.tsx` | no | internal_debug | Keep quarantined and unrouted; never public/client route. |
| `team-activity-feed.tsx` | no | future_planned | Keep parked; do not route without owner-approved RR. |
| `team-adaptive-intelligence.tsx` | no | legacy_quarantined | Hard quarantine; do not expose AI/internal intelligence surface or route without owner-approved RR. |
| `team-ai-review.tsx` | no | legacy_quarantined | Hard quarantine; do not enable AI review routes, live AI, automation, or review bypass. |
| `team-alert-center.tsx` | no | future_planned | Keep parked for future Team/manual alert surface; do not route now. |
| `team-approval-queue.tsx` | yes | active_routed | Active guarded Team/manual approval queue. |
| `team-audit-leads.tsx` | yes | active_routed | Active guarded Team/manual audit leads route. |
| `team-content-review.tsx` | no | future_planned | Keep parked for future Team/manual content review; do not route now. |
| `team-dashboard.tsx` | yes | active_routed | Active guarded Team dashboard. |
| `team-direction-queue.tsx` | yes | active_routed | Active guarded Team/manual direction queue. |
| `team-drafts.tsx` | no | legacy_quarantined | Hard quarantine; do not expose draft internals, automatic publishing, or review bypass. |
| `team-first-client-ops.tsx` | yes | active_routed | Active guarded Team/manual first-client operations route. |
| `team-first-client-readiness.tsx` | yes | active_routed | Active guarded Team/manual first-client readiness route. |
| `team-lead-source-lab.tsx` | no | future_planned | Keep parked; do not route without owner-approved RR. |
| `team-manual-execution.tsx` | yes | active_routed | Active guarded Team/manual execution-prep route; no automated execution. |
| `team-media-review.tsx` | no | future_planned | Keep parked for future Team/manual media review; do not route now. |
| `team-onboarding.tsx` | yes | active_routed | Active guarded Team/manual onboarding review route. |
| `team-performance.tsx` | no | future_planned | Keep parked for future Team/manual performance review; do not route now. |
| `team-portal.tsx` | no | legacy_quarantined | Parked legacy Team shell; do not route without owner-approved RR and route-doc updates. |
| `team-prospect-scanner.tsx` | no | legacy_quarantined | Hard quarantine; do not route scanner/prospect internals without owner-approved RR. |
| `team-report-queue.tsx` | yes | active_routed | Active guarded Team/manual report queue. |
| `team-scheduling.tsx` | no | future_planned | Keep parked for future Team/manual scheduling surface; do not route now. |
| `team-upload-inbox.tsx` | yes | active_routed | Active guarded Team/manual upload inbox route; no storage upload added. |
| `team-visibility-audit.tsx` | yes | active_routed | Active guarded Team/manual visibility audit route. |
| `team-work-queue.tsx` | yes | active_routed | Active guarded Team/manual work queue route. |

## Delete review status

No page files are marked delete-now. Future deletion requires a separate owner-approved cleanup PR unless a file is already marked `delete_review_only` and confirmed unused.
