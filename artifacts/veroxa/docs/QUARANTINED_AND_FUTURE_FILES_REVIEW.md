# Quarantined and Future Files Review

_Last updated: 2026-06-06 — A–Z cleanup alignment._

This review reduces mental clutter around files that exist in the repo but are not part of the active routed Veroxa launch surface. These files are **not deleted, not promoted, and not routed** by this cleanup.

Rule: **No parked or quarantined page may be routed without updating `ROUTE_PAGE_INVENTORY.md`, `VEROXA_ROUTE_SURFACE_MAP.md`, and passing RR.**

## 1. Future client portal candidates

These may be useful later, but are not active launch routes unless separately approved:

- `client-account.tsx`
- `client-activity-log.tsx`
- `client-ai-draft-preview.tsx`
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
- `team-adaptive-intelligence.tsx`
- `team-alert-center.tsx`
- `team-ai-review.tsx`
- `team-content-review.tsx`
- `team-drafts.tsx`
- `team-lead-source-lab.tsx`
- `team-media-review.tsx`
- `team-performance.tsx`
- `team-portal.tsx`
- `team-prospect-scanner.tsx`
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
- `real-client-placeholder.tsx`
- `real-route-placeholder.tsx`
- `real-team-placeholder.tsx`

## 5. AI/future draft candidates

These remain future draft/review concepts only. They must not enable live AI, automatic publishing, customer messaging, platform changes, or Veroxa/Faraz review bypass:

- `client-ai-draft-preview.tsx`
- `team-ai-review.tsx`
- `team-drafts.tsx`
- `team-adaptive-intelligence.tsx`

## 6. Delete-review candidates

No deletion is made in this PR. If a future route inventory run classifies an unknown page as `delete_candidate`, review it in a separate cleanup PR before deleting or routing it.
