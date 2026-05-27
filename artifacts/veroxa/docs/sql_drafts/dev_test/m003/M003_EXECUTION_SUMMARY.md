# M003 Execution Summary

## What this package does

Lets a human operator manually apply and verify Migration 003 (Media
Foundation) plus the notifications column-write guard correction in a
dev Supabase project, without running the migration runner, without
touching the React app, and without exposing any real credentials.

Migration 003 adds:

- `public.media_assets` — client/team-uploaded media with an 11-state
  review lifecycle, internal staff-only columns
  (`internal_note`, raw `rejection_reason`, `quality_score`,
  `quality_ai_flag`) and a placeholder `linked_post_id` (FK lands in M004)
- `public.notifications` — per-tenant notifications scoped by
  `target_role`
- `public.client_health_snapshots` — append-only health snapshots
- `public.activity_logs` — append-only audit log
- RLS policies on all four tables (no new helpers — reuses M002 helpers)

The notifications guard correction adds:

- `private.notifications_client_update_guard()` BEFORE UPDATE trigger
  function
- Trigger `notifications_client_update_guard` on `public.notifications`

The guard restricts client-role UPDATEs to `status → seen|dismissed`
only. Staff (owner/operator/team) bypass; service-role bypasses RLS
entirely and therefore never fires the trigger.

## What this package does NOT do

- Apply M004, M005, M006, portal-connect views, or the post-slot reset
  guard.
- Create real `public.client_portal_media_view`,
  `client_portal_notifications_view`, or `client_portal_health_view`.
  Those views are scoped to the portal-connect pass; the M003 draft
  keeps them as commented stubs.
- Revoke base-table access from the `authenticated` role. That revoke
  ships with the portal-connect pass.
- Modify the React app, AUTH_MODE, portal navigation, demo gate, demo
  access code (`veroxa-preview`), or locked pricing.
- Connect the React portal to the dev Supabase project.
- Issue real client credentials.

## Required preconditions

- M001 + M002 already applied and tested green on this same dev
  Supabase project.
- M001 fixture users + M002 demo clients exist (Restaurant A + B,
  team@→A, team2@→B, client@→A).
- DEV project (not production).
- No real client data in the project.
- `AUTH_MODE = "placeholder"` in the React app.
- The React portal is NOT connected to this database.

## Files in this package

1. `README.md` — execution guide, ordering rules, stop conditions
2. `01_apply_m003.sql` — clean apply of the M003 media foundation
3. `01b_apply_notifications_status_guard.sql` — clean apply of the
   notifications column-write guard correction
4. `02_seed_m003_dev_data.sql` — dev-only fixtures: 5 media rows
   (3 for A, 2 for B), 4 notifications, 2 health snapshots, 3
   activity logs
5. `03_test_m003_queries.sql` — 21 test sections / ~68 checks
6. `04_m003_test_results.md` — empty pass/fail sheet to fill in
7. `M003_EXECUTION_SUMMARY.md` — this file

## Stop conditions

Any of the following halts the run:

- Apply step 1 (M003) errors.
- Apply step 2 (notifications guard) errors.
- Seed step 3 fails after UUID placeholders are replaced.
- Any required test fails.
- Any mutation persists outside a rolled-back transaction.

When stopping: fill `04_m003_test_results.md` with the failure details.
Do not proceed to M004.

## Predicted source-draft defects surfaced by this package

Cross-checking `003_media_foundation_draft.sql` against the M002 helper
definitions reveals two policies whose runtime behavior diverges from
the test plan. Both will surface as expected failures in Tests 7 and 13.

- `notifications_select_assigned_team` and
  `activity_logs_select_assigned_team` both use
  `private.can_view_client(client_id)`. That helper returns TRUE when
  the caller is the client of `p_client`, so a client-role caller
  matches these "staff" policies on their own tenant whenever the
  secondary predicate is satisfied.
- Effect on tests with this package's seed:
  - Test 7 expects client@A to see 1 notification; predicted actual = 3.
  - Test 13 expects client@A to see 0 activity_logs; predicted actual = 1.

**Recommended correction (deferred to a follow-up draft, not in this
package).** Edit `003_media_foundation_draft.sql` to replace
`can_view_client` with `is_assigned_to_client` in both
`*_select_assigned_team` policies, or add an explicit
`private.current_user_role() <> 'client'` AND-clause. This is a real
schema correction; M003 must not be promoted beyond dev until the fix
is drafted, applied to the dev project, and re-tested.

## Known design choice flagged for decision

**D4 (owner-trusted append-only):** Tests 12d and 16d expect owner
UPDATEs on `client_health_snapshots` and `activity_logs` to succeed
because their `owner_all` policy is `for all`. This means the
append-only guarantee holds against client/team/operator only — owner
is trusted. Confirm your stance in the results sheet:

- Keep as-is (owner-trusted) — current draft behavior
- Tighten in a follow-up pass — replace `owner_all` with explicit
  `for select` + `for insert` owner policies

Neither choice blocks M003 promotion; the decision just needs to be
recorded.

## What to do after green

1. Complete `04_m003_test_results.md` with all passes recorded and the
   D4 decision noted.
2. Confirm AUTH_MODE is still `"placeholder"` and the portal is still
   disconnected.
3. Report back so the M004 (posts + post_slots + post-slot reset guard)
   dev test package can be prepared next, per the builder roadmap.
