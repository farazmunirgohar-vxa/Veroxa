# Portal Query Safety Plan

**Status:** Plan + partial enforcement. No CI / lint is implemented yet.
`AUTH_MODE` remains `"placeholder"`. This document defines the contract
the client portal MUST follow once Supabase is connected.

## Current status (portal source)

- `src/lib/supabase/clientPortalQueries.ts` reads from `client_portal_*`
  views only. Every prior `.from("clients" | "client_platforms" |
  "media_assets" | "posts" | "post_slots" | "weekly_reports" |
  "monthly_reports" | "draft_variants")` call has been removed.
- **Auth scaffolding is intentionally excluded from this contract.**
  `src/lib/auth/useRealAuth.ts` and `src/pages/login.tsx` read
  `public.user_profiles` to resolve the caller's own row during the
  future `AUTH_MODE='real'` sign-in flow. That path is governed by the
  M001 `user_profiles` self-row RLS policy, not by the client-portal
  view contract. The grep sweeps in `PORTAL_QUERY_SAFETY_CHECKLIST.md`
  pre-exclude those two files. Both files are inert while
  `AUTH_MODE='placeholder'`.
- `draft_variants` is now forbidden in the client portal data path.
  `getClientDraftVariants` and `getClientPostSlots` have been removed
  from the supabase library; the calendar view replaces both posts and
  post_slots reads on the client side.
- `src/hooks/useClientPortalData.ts` no longer loads draft variants.
  Calendar captions are derived from `client_safe_title` on
  `client_portal_calendar_view`, falling back to a demo-safe
  placeholder when the field is empty.
- Direct base-table client reads are blocked by code review (the
  forbidden-table list below) until the future CI / grep check ships.
- See the companion manual checklist:
  `docs/PORTAL_QUERY_SAFETY_CHECKLIST.md`.

## Why this matters

For M001–M005, client-role row visibility is enforced by RLS, but
**column-hiding is enforced only by the `client_portal_*` views**. The
base-table RLS policies for `clients`, `client_platforms`,
`onboarding_items`, `client_requests`, `media_assets`, `notifications`,
`client_health_snapshots`, `posts`, `post_slots`, `weekly_reports`,
and `monthly_reports` give the client SELECT access to the rows that
belong to them — including every column on those rows.

If the client portal queries the base tables directly (e.g.
`supabase.from('clients').select('*')`), the client receives
**sensitive internal columns**:

- `clients.monthly_fee_cents` — pricing
- `clients.assigned_operator_id`, `assigned_team_label` — staffing
- `clients.risk_status`, `content_health_status` — internal scoring
- `client_platforms.notes` — internal staff commentary
- `media_assets.internal_note`, `rejection_reason`, `quality_score`, `quality_ai_flag` — AI/staff reasoning
- `notifications.trigger_source`, `target_user_id` — internal routing
- `client_health_snapshots.priority_level`, `unresolved_alerts_count` — internal scoring
- `posts.approved_by_user_id`, `concept_id`, `draft_variant_id`, `publish_failure_reason` — pipeline internals
- `post_slots.reserved_post_id` — internal linkage
- `weekly_reports.internal_validation_note`, `draft_owner_id`, `validation_owner_id`, raw `summary_json` — staff commentary + full payload
- `monthly_reports.approved_by_user_id`, raw `summary_json` — approval audit + full payload

The portal MUST therefore route every client-role query through a
`client_portal_*` view.

## Forbidden direct client portal queries

Client portal code (any file under `artifacts/veroxa/src/` rendered to
a `client` role user) MUST NOT directly query any of these base
tables:

| Table | Why forbidden |
|---|---|
| `public.clients` | exposes `monthly_fee_cents`, `assigned_operator_id`, `risk_status` |
| `public.client_platforms` | exposes internal `notes` |
| `public.onboarding_items` | use the view for consistency, even though no staff-only fields exist today |
| `public.client_requests` | exposes `assigned_to_role`, `requested_by_user_id` |
| `public.media_assets` | exposes `internal_note`, `rejection_reason`, `quality_score`, `quality_ai_flag`, raw `file_url` |
| `public.notifications` | exposes `trigger_source`, `target_user_id` and other roles' rows |
| `public.client_health_snapshots` | exposes raw `priority_level`, `unresolved_alerts_count` |
| `public.posts` | exposes `approved_by_user_id`, `concept_id`, `draft_variant_id`, `publish_failure_reason`, raw `post_status` |
| `public.post_slots` | exposes `reserved_post_id` |
| `public.weekly_reports` | exposes `internal_validation_note`, `draft_owner_id`, `validation_owner_id`, raw `summary_json` |
| `public.monthly_reports` | exposes `approved_by_user_id`, raw `summary_json` |
| `public.content_concepts` | M006 — internal-only |
| `public.draft_sets` | M006 — internal-only |
| `public.draft_variants` | M006 — internal-only |
| `public.ai_agents` | M006 — owner/operator only |
| `public.activity_logs` | M003 — staff-only |
| `public.team_members` | M001 — staff-only |
| `public.team_client_assignments` | M002 — staff-only |
| `public.user_profiles` | M001 — staff-only beyond the caller's own row |

## Allowed client portal views

These are the ONLY tables/views the client portal is permitted to
query on behalf of a client-role user. The first eight ship in
`docs/sql_drafts/migrations_review/002_003_004_portal_connect_views_draft.sql`;
the last two ship in `005_reporting_foundation_draft.sql`.

| View | Source migration |
|---|---|
| `public.client_portal_clients_view` | M002 portal-connect pass |
| `public.client_portal_platforms_view` | M002 portal-connect pass |
| `public.client_portal_onboarding_view` | M002 portal-connect pass |
| `public.client_portal_requests_view` | M002 portal-connect pass |
| `public.client_portal_media_view` | M003 portal-connect pass |
| `public.client_portal_notifications_view` | M003 portal-connect pass |
| `public.client_portal_health_view` | M003 portal-connect pass |
| `public.client_portal_calendar_view` | M004 portal-connect pass |
| `public.client_portal_weekly_reports_view` | M005 |
| `public.client_portal_monthly_reports_view` | M005 |

### Allowed client-role writes

| Target | Allowed mutations |
|---|---|
| `public.media_assets` | INSERT only, scoped to own `client_id`, with `source_type='client_upload'` and `review_status='uploaded'` (RLS WITH CHECK). |
| `public.notifications` | UPDATE `status` only, only to `'seen'` or `'dismissed'`, on own rows (enforced by the M003 RLS policy AND the BEFORE UPDATE guard in `003_notifications_status_guard_draft.sql`). |
| `public.client_requests` | (Future) — currently no client write policy. |

No other client-role writes are permitted anywhere in the schema.

## Future CI / grep check (NOT implemented yet)

When the portal is wired to a real Supabase project, add a CI check
that:

1. Walks every file under `artifacts/veroxa/src/` that is reachable
   from a client-role route (the route map lives in
   `docs/ROUTE_VISIBILITY_STRATEGY.md`).
2. Rejects any string literal matching the forbidden-table list above
   when used as the first argument to `supabase.from(...)`.
3. Allows the ten `client_portal_*` view names.

Suggested implementation when the time comes:

```bash
# Pseudocode — do NOT implement this yet.
rg -n "supabase\.from\(['\"](clients|client_platforms|onboarding_items|client_requests|media_assets|notifications|client_health_snapshots|posts|post_slots|weekly_reports|monthly_reports|content_concepts|draft_sets|draft_variants|ai_agents|activity_logs|team_members|team_client_assignments|user_profiles)['\"]" \
  artifacts/veroxa/src/client \
  && exit 1 || exit 0
```

The check should be a lint-style block, not a test that requires a
running Supabase project.

## When this contract activates

This contract is **inert** while `AUTH_MODE='placeholder'`. The portal
currently runs on demo fixtures and never touches Supabase. The
contract activates the moment the portal flips to a real Supabase
client; both events (view materialization and portal flip) must happen
in the same release.

## Latest audit pass

This section records the most recent full audit pass against the hard
invariants. Update it (do not append) when a new pass completes.

**Date:** 2026-05-27
**Scope:** Narrow safety / drift cleanup pass — `clientPortalQueries.ts`
views-only refactor, draft-variants removal from `useClientPortalData`,
M005 staff-policy correction added under `dev_test/m005/01b_*`, M006 AI
config safety checklist consolidated, RLS plan view-name drift fixed,
master dev-test execution order published.

**Invariant confirmations (all verified at end of pass):**

- ✅ `AUTH_MODE` is the literal string `"placeholder"` in
  `src/lib/auth/authMode.ts`.
- ✅ No file exists under `supabase/migrations/`. All SQL stays under
  `docs/sql_drafts/`.
- ✅ The portal is NOT wired to any real database. The hook + page that
  call into `@/lib/supabase` are inert without env vars and are gated
  by demo-data fallbacks.
- ✅ No real AI provider is wired. `ai_agents.is_enabled=true` remains
  inert because no runtime reads it.
- ✅ `ai_agents.config_json` contains no secrets, API keys, bearer
  tokens, or signed URLs — enforced by the consolidated checklist in
  `MIGRATION_006_TEST_PLAN.md` §11x and `dev_test/m006/README.md`.
- ✅ Demo gate `veroxa-preview` unchanged.
- ✅ Locked pricing unchanged: GPS 49700, COP 12mo 99700, COP 6mo
  109700, COP 3mo 119700, COP no-contract 149700.
- ✅ Roles are exactly Client / Team / Operator / Owner.
- ✅ Fixtures only. No real client / restaurant / customer data.
- ✅ No navigation routing or four-shell changes.

**Sweeps run (both must return zero):**

- Forbidden base-table grep from `PORTAL_QUERY_SAFETY_CHECKLIST.md` §1
  → 0 matches.
- Removed library exports grep from `PORTAL_QUERY_SAFETY_CHECKLIST.md`
  §2 → 0 matches.

**Open items (not blocking this pass):**

- `useClientPortalData` will still attempt Supabase reads on mount
  whenever the `VITE_SUPABASE_*` env vars are present, regardless of
  `AUTH_MODE`. The reads are scoped to client-safe views and fail
  closed to demo fixtures, so the invariants hold; gating the hook on
  `AUTH_MODE === "real"` is a future enhancement, deliberately out of
  scope for this safety pass per the hard invariants.

## Cross-references

- Portal-connect views draft: `docs/sql_drafts/migrations_review/002_003_004_portal_connect_views_draft.sql`
- M003 notifications status guard: `docs/sql_drafts/migrations_review/003_notifications_status_guard_draft.sql`
- M004 post-slot reset trigger: `docs/sql_drafts/migrations_review/004_post_slot_reset_guard_draft.sql`
- M005 (report views shipped): `docs/sql_drafts/migrations_review/005_reporting_foundation_draft.sql`
- M005 staff-policy correction (dev-test): `docs/sql_drafts/dev_test/m005/01b_apply_reports_select_staff_correction.sql`
- M006 draft (internal-only tables): `docs/sql_drafts/migrations_review/006_content_ai_layer_draft.sql`
- Master dev-test execution order: `docs/sql_drafts/dev_test/README.md`
- Route map: `docs/ROUTE_VISIBILITY_STRATEGY.md`
- RLS reference: `docs/SUPABASE_RLS_PLAN_V1.md`
