# Quarantined and Future Files Review

_Last updated: 2026-06-06 — final deletion/quarantine review._

This review reduces mental clutter around files that exist in the repo but are not part of the active routed Veroxa launch surface. These files are **not deleted, not promoted, and not routed** by this cleanup.

Rule: **No quarantined, future, parked, debug, or legacy shell page may be routed without owner approval, `ROUTE_PAGE_INVENTORY.md` update, `VEROXA_ROUTE_SURFACE_MAP.md` update, guardrail update, and RR.**

## Deletion decision

- Delete now: none confirmed.
- Deletion requires a separate owner-approved PR unless a file is already marked `delete_review_only` and confirmed unused.
- This review is quarantine/clarity work only; active public, client, team, demo, and QA routes remain unchanged.

## Hard quarantine now

These files must remain unrouted and must not appear in client/team navigation without owner-approved RR, route inventory update, route surface map update, and guardrail update:

- `client-ai-agents.tsx`
- `client-ai-draft-preview.tsx`
- `team-ai-review.tsx`
- `team-adaptive-intelligence.tsx`
- `team-drafts.tsx`
- `team-prospect-scanner.tsx`
- `internal-*` pages
- `supabase-test.tsx`
- `real-client-placeholder.tsx`
- `real-route-placeholder.tsx`
- `real-team-placeholder.tsx`

## Keep future planned

These may be useful later, but are not active launch routes unless separately approved:

- `client-account.tsx`
- `client-activity-log.tsx`
- `client-calendar.tsx`
- `client-content-pipeline.tsx`
- `client-direction-center.tsx`
- `client-google.tsx`
- `client-health-command.tsx`
- `client-monthly-report.tsx`
- `client-onboarding-center.tsx`
- `client-portal.tsx`
- `client-weekly-report.tsx`
- `client-workspace.tsx`
- `team-activity-feed.tsx`
- `team-alert-center.tsx`
- `team-content-review.tsx`
- `team-lead-source-lab.tsx`
- `team-media-review.tsx`
- `team-performance.tsx`
- `team-portal.tsx`
- `team-scheduling.tsx`

## Routing and exposure rules

- No quarantined/future/debug page may be routed without owner approval, route inventory update, route surface map update, guardrail update, and RR.
- Internal debug pages must never become public/client routes.
- AI/future draft pages must not expose AI internals, live AI, automatic publishing, or review bypass.
- Deletion requires separate owner-approved PR unless a file is already marked `delete_review_only` and confirmed unused.
- `/owner`, `/operator`, `/super-admin`, generic `/admin`, and `/execution` route families remain blocked.
- Demo/QA pages may stay active only when labeled sample/demo/QA and only when they do not imply real client data, live uploads, live publishing, live AI, payments, connectors, webhooks, cron, or automated customer-visible execution.

## 1. Future client portal candidates

These may be useful later, but are not active launch routes unless separately approved:

- `client-account.tsx`
- `client-activity-log.tsx`
- `client-calendar.tsx`
- `client-content-pipeline.tsx`
- `client-direction-center.tsx`
- `client-google.tsx`
- `client-health-command.tsx`
- `client-monthly-report.tsx`
- `client-onboarding-center.tsx`
- `client-portal.tsx`
- `client-weekly-report.tsx`
- `client-workspace.tsx`

## 2. Future Team/manual candidates

These are parked candidates for later Team/manual work. Do not route them during first-client cleanup unless RR explicitly approves the scope:

- `team-activity-feed.tsx`
- `team-alert-center.tsx`
- `team-content-review.tsx`
- `team-lead-source-lab.tsx`
- `team-media-review.tsx`
- `team-performance.tsx`
- `team-portal.tsx`
- `team-scheduling.tsx`

## 3. Internal debug/quarantined pages

These must remain unrouted from public/client/Team launch paths:

- `auth-status.tsx`
- `internal-architecture.tsx`
- `internal-db-explorer.tsx`
- `internal-demo-controls.tsx`
- `internal-integrations.tsx`
- `internal-permissions.tsx`
- `internal-supabase-readiness.tsx`
- `internal-system-status.tsx`
- `supabase-test.tsx`

## 4. Legacy shell candidates

These are compatibility or historical shells and should not become active product surfaces without review:

- `client-ai-agents.tsx`
- `client-ai-draft-preview.tsx`
- `team-adaptive-intelligence.tsx`
- `team-ai-review.tsx`
- `team-drafts.tsx`
- `team-prospect-scanner.tsx`
- `real-client-placeholder.tsx`
- `real-route-placeholder.tsx`
- `real-team-placeholder.tsx`

## 5. AI/future draft candidates

These remain future draft/review concepts only. They must not enable live AI, automatic publishing, customer messaging, platform changes, or Veroxa/Faraz review bypass:

- `client-ai-agents.tsx`
- `client-ai-draft-preview.tsx`
- `team-ai-review.tsx`
- `team-drafts.tsx`
- `team-adaptive-intelligence.tsx`

## 6. Delete-review candidates

No deletion is made in this PR. If a future route inventory run classifies an unknown page as `delete_review_only`, review it in a separate owner-approved cleanup PR before deleting or routing it.
