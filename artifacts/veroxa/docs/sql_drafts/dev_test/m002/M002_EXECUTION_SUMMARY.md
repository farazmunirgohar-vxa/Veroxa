# M002 Execution Summary

## What this package does

Lets a human operator manually apply and verify Migration 002 (Client
Foundation) in a dev Supabase project, without ever invoking the
Supabase migration runner, without touching the React app, and without
exposing any real credentials.

Migration 002 adds:

- `public.clients` — the per-account row with locked pricing columns
- `public.team_client_assignments` — staff-to-client join (replaces the
  deprecated `team_members.assigned_client_ids` array idea)
- `public.client_platforms` — per-client platform access tracking,
  including internal `notes`
- `public.onboarding_items` — onboarding checklist items per client
- `public.client_requests` — client-submitted requests
- FK: `public.user_profiles.client_id → public.clients(id)`
  (`on delete set null`)
- Four `private.*` helpers: `is_assigned_to_client`, `can_view_client`,
  `can_manage_client_operations`, `can_manage_pricing`
- Trigger `private.clients_pricing_write_guard` that blocks non-owner
  writes to `monthly_fee_cents`, `plan_type`, `service_package`,
  `contract_months`, `start_date`, `assigned_operator_id`
- RLS policies on all five new tables

## What this package does NOT do

- Apply M003, M004, M005, M006, portal-connect views, the notifications
  status guard, or the post-slot reset guard.
- Create real `public.client_portal_*_view` views. Those are scoped to
  the M003 portal-connect package; the M002 draft keeps view stubs
  commented.
- Revoke base-table access from the `authenticated` role. That revoke
  happens with the M003 portal-connect package, after the staff app has
  been migrated to the safe views.
- Modify the React app, AUTH_MODE, portal navigation, demo gate, demo
  access code (`veroxa-preview`), or the locked pricing table.
- Connect the React portal to the dev Supabase project.
- Issue real client credentials.

## Required preconditions

- M001 already applied and tested green on this same dev Supabase
  project.
- M001 dev fixture users exist (`owner@`, `operator@`, `team@`,
  `client@`, `inactive@`) with their `user_profiles` rows.
- `team@veroxa.test` has a `public.team_members` row.
- DEV project (not production).
- No real client data in the project.
- `AUTH_MODE = "placeholder"` in the React app.
- The React portal is NOT connected to this database.

## Files in this package

1. `README.md` — execution guide, ordering rules, stop conditions
2. `01_apply_m002.sql` — clean apply script (paste into SQL editor)
3. `02_seed_m002_dev_data.sql` — dev-only fixtures: 2 fake clients, the
   new `team2@veroxa.test` user, platform/onboarding/request rows
4. `03_test_m002_queries.sql` — ~81 test checks across 22 sections
5. `04_m002_test_results.md` — empty pass/fail sheet to fill in
6. `M002_EXECUTION_SUMMARY.md` — this file

## Stop conditions

Any of the following halts the run:

- Apply step 1 errors (M001 missing, FK addition fails, helpers fail to
  create).
- Seed step 2 fails after UUID placeholders are replaced.
- Any required test fails.
- Any mutation persists outside a rolled-back transaction.

When stopping: fill `04_m002_test_results.md` with the failure details
in the "Failed tests" / "Root cause" section. Do not proceed to M003.

## What to do after green

1. Confirm every checklist box in `04_m002_test_results.md` (including
   the bottom "Final confirmations" block).
2. Confirm AUTH_MODE is still `"placeholder"` and the portal is still
   disconnected.
3. Report the green result back to the architect so the M003 (Media
   Foundation + notifications + activity + health) dev test package can
   be prepared next, per the builder package's
   `BUILD_ROADMAP_LARGE_BLOCKS.md` (Block C).

## Pricing safety reminder

The seed uses pricing values that match the locked pricing table:

| Service / Plan | `service_package` | `plan_type` | `monthly_fee_cents` |
|---|---|---|---|
| GPS | `google_presence_starter` | any | 49700 |
| COP 12-month | `complete_online_presence` | `twelve_month` | 99700 |
| COP 6-month | `complete_online_presence` | `six_month` | 109700 |
| COP 3-month | `complete_online_presence` | `three_month` | 119700 |
| COP no-contract | `complete_online_presence` | `no_contract` | 149700 |

Test 2 spot-checks each row. If any of these values are wrong, STOP
and report — pricing is locked and must not drift.
