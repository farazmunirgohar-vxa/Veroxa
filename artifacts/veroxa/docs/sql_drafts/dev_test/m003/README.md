# M003 Dev Test Execution Package

**Purpose:** Paste-and-run files for testing Migration 003 (Media
Foundation) plus the notifications status guard correction in the
Supabase dev project SQL editor.

Source files:

- `docs/sql_drafts/migrations_review/003_media_foundation_draft.sql`
- `docs/sql_drafts/migrations_review/003_notifications_status_guard_draft.sql`
- `docs/MIGRATION_003_TEST_PLAN.md`

## Hard preconditions (all must be true)

- [ ] **M001 + M002 were applied and tested green** on this same dev
      project. The five M001 fixture users exist, `team2@veroxa.test`
      exists from the M002 seed, and the two demo clients (Restaurant A
      and B) exist with their platforms/onboarding/requests.
- [ ] This is the **DEV Supabase project** only — never production.
- [ ] No real client or restaurant data exists in this project.
- [ ] `AUTH_MODE = "placeholder"` in the app and stays that way.
- [ ] Portal is NOT connected to this database.
- [ ] No real client credentials are being issued.

If any precondition is false, STOP. Do not proceed.

## Do not (during this run)

- Apply M004, M005, M006, portal-connect views, or the post-slot reset
  guard.
- Move M003 SQL into `supabase/migrations/`.
- Change `AUTH_MODE`.
- Connect the portal.
- Use real restaurant content (image URLs can be example.test).
- Change locked pricing, navigation, demo gate, or demo access code.

## Execution order

| Step | File | Where to run |
|---|---|---|
| 1 | `01_apply_m003.sql` | Supabase SQL editor — applies media foundation |
| 2 | `01b_apply_notifications_status_guard.sql` | Supabase SQL editor — applies the BEFORE UPDATE trigger guard |
| 3 | `02_seed_m003_dev_data.sql` | Supabase SQL editor (replace UUID placeholders first) |
| 4 | `03_test_m003_queries.sql` | Supabase SQL editor — run each numbered block separately |
| 5 | `04_m003_test_results.md` | Fill in pass/fail as you go |
| 6 | `M003_EXECUTION_SUMMARY.md` | Reference — describes what this package does, stop conditions, and what to do after green |

## Predicted source-draft defects (Tests 7 and 13)

Reviewing `003_media_foundation_draft.sql` against the M002 helper
definitions reveals two policies that almost certainly do not behave the
way the policy name + test plan suggest. These will surface as **expected
failures** when you run Tests 7 and 13.

**Root cause.** Both `notifications_select_assigned_team` and
`activity_logs_select_assigned_team` use `private.can_view_client(client_id)`.
But `can_view_client(p)` returns TRUE when the caller is the client of
`p` (M002 definition: `current_user_client_id() = p OR is_assigned_to_client(p)`).
So a client-role caller matches these "staff" policies for their own
client whenever the secondary predicate is satisfied:

- **Test 7 (notifications):** client@A is expected to see only NOTIF_A_CLIENT (1 row).
  Predicted actual: client@A sees NOTIF_A_CLIENT + NOTIF_A_TEAM + NOTIF_A_OPERATOR (3 rows),
  because `target_role IN ('team','operator')` matches and `can_view_client(A)` is true for them.
- **Test 13 (activity_logs):** client@A is expected to see 0 rows.
  Predicted actual: client@A sees LOG_A_MEDIA (1 row), because `entity_type='media_assets'`
  is on the allowlist and `can_view_client(A)` is true.

**Recommended correction (NOT included in this package — defer to a
follow-up draft).** In `003_media_foundation_draft.sql`, replace
`can_view_client` with `is_assigned_to_client` in both `*_select_assigned_team`
policies — that helper short-circuits to TRUE for operator/owner but
returns FALSE for clients. Or add an explicit `private.current_user_role()
<> 'client'` AND-clause. This is a real schema correction; do not apply
M003 to production until it lands.

**What to do during the test run.** Run Tests 7 and 13 as written, record
the actual result (predicted 3 and 1 respectively), and mark both as
FAIL in `04_m003_test_results.md` with a note linking to this section.
The failures are diagnostic — they prove the source draft needs the
correction described above. Do NOT proceed to M004 until either the
correction is drafted and applied, or the test plan is intentionally
revised.

## Stop conditions (any one halts the run)

- M003 apply (step 1) errors.
- Notifications guard apply (step 2) errors.
- Seed (step 3) fails after UUID replacement.
- Any required test in step 4 fails.
- Any unexpected mutation persists outside a rolled-back transaction.

If any of the above happens: STOP, fill in the results sheet with the
failure details, do NOT proceed to M004.

## What to do when everything is green

1. Complete `04_m003_test_results.md` with all passes recorded.
2. Confirm at the bottom: AUTH_MODE still `"placeholder"`, portal still
   disconnected, no M004+ applied.
3. Report back so the M004 (posts + post_slots + post-slot reset guard)
   dev test package can be prepared next.

## Supabase SQL editor context note

The SQL editor runs as `postgres` (superuser), bypassing RLS. Per-user
tests in `03_test_m003_queries.sql` wrap their queries in a transaction
that sets `set local role authenticated` + `set local "request.jwt.claims"`
to simulate a signed-in user. Each per-user block ends with `rollback;`
so mutations don't persist — confirm `ROLLBACK` in the result before
moving on.
