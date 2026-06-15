# Live Automation V1 Database Foundation

Status: PR #101 database foundation. This prepares schema, RLS, and TypeScript contracts only; it does not make Veroxa live.

## What PR #101 added

- Supabase migration: `supabase/migrations/20260615010100_live_automation_v1_database_foundation.sql`.
- Live Automation V1 tables, status enums, role enum, indexes, updated-at triggers, and conservative read-only RLS policies.
- TypeScript database/domain contracts under `artifacts/veroxa/src/domain/liveAutomation/`.
- Guardrails to keep the foundation safe and prevent accidental live runtime activation.

## Current locked runtime truth

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains the active safe pilot login path.
- No portal page is live DB-powered yet.
- No media upload is live yet.
- No messages are live yet.
- No profile corrections are live yet.
- No activity log runtime is live yet.
- No AI or reporting runtime is live yet.
- Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved.

## Tables

- `user_profiles`: Supabase Auth user metadata with only `client` and `team` roles.
- `restaurants`: restaurant workspaces/accounts.
- `restaurant_members`: active user-to-restaurant membership links.
- `restaurant_profile_fields`: internal business-truth/profile fields for future profile review.
- `media_assets`: future media metadata for PR #102; upload does not mean publish.
- `messages`: future portal messages only; not SMS, email, DMs, comments, or customer-service inbox handling.
- `profile_corrections`: future owner-requested profile correction requests; public platform changes still require future approval.
- `activity_log`: future backbone for reports and client-visible progress; runtime event writing is not active.
- `ai_drafts`: future prepared suggestions; drafts never approve or publish themselves.
- `approvals`: future Faraz/team approval decisions.
- `reports`: future weekly/monthly reports from real activity; no fake metrics.

## Statuses and enums

- Roles: `client`, `team` only.
- Account/workspace statuses: `active`, `pending`, `disabled`.
- Profile field statuses: `please_review`, `pre_filled`, `confirmed`, `optional`, `veroxa_review`.
- Media statuses: `uploaded`, `under_veroxa_review`, `ready_to_use`, `saved_for_later`, `better_version_helpful`, `used`.
- Message statuses: `unread`, `read`, `resolved`.
- Profile correction statuses: `requested`, `under_veroxa_review`, `approved`, `rejected`, `needs_owner_input`.
- AI draft statuses: `drafted`, `ready_for_faraz_review`, `approved`, `rejected`, `held`, `needs_owner_input`.
- Approval statuses: `pending`, `approved`, `rejected`, `held`, `needs_owner_confirmation`.
- Report statuses: `draft`, `ready_for_faraz_review`, `approved`, `published_to_client`.
- Activity visibility: `internal_only`, `client_visible`, plus `report_eligible boolean`.

## RLS/security model

Every Live Automation V1 table has RLS enabled. PR #101 creates authenticated read policies only, scoped through active profile, active membership, and active restaurant checks. Anonymous users have no policies. Writes are deny-by-default because this PR does not activate media uploads, messages, profile corrections, activity logging, AI drafts, approvals, or reports.

Client reads require an active `user_profiles` row, active `restaurant_members` row, and active `restaurants` row. Team reads require an active `user_profiles` row with role `team`. Client-visible activity and reports are additionally filtered by intentional visibility/status fields. No broad public policy, no service-role frontend behavior, and no `VITE_SUPABASE_SERVICE_ROLE_KEY` are part of this foundation.

## Later Momo / Team Faraz setup notes

Team Faraz later:

1. Create a Supabase Auth user only when real auth setup is explicitly approved.
2. Create one `user_profiles` row with role `team`.
3. Set status to `active` only when ready.
4. Do not create parked roles such as owner, operator, admin, super admin, execution, staff, or manager.

Momo House later:

1. Create the Momo auth user later; do not commit private passwords.
2. Create the Momo restaurant workspace later; avoid production secrets or sensitive private data in seed files.
3. Link the user to the restaurant through `restaurant_members`.
4. Client access requires active user profile, active membership, and active restaurant.
5. Initial profile fields can be added later after confirmation.

## What remains before PR #102

PR #102 may build Media Upload + Storage later. Before that, this foundation must remain schema-only: no storage buckets, upload UI, upload runtime, file writes, or publishing behavior are active.

## What remains before `AUTH_MODE = "real"`

Real auth still requires environment configuration, applied migrations in the target Supabase project, RLS verification with test users, active Team Faraz and Momo records, route/auth/data-boundary QA, rollback readiness, and explicit approval. `AUTH_MODE` must not flip in PR #101.

## Not live yet

No live portal DB reads, media upload, messages, profile correction persistence, activity log runtime writing, AI runtime calls, report generation, Google/Meta integrations, payments, publishing, cron jobs, webhooks, or background jobs are live. Momo owner walkthrough remains blocked.
