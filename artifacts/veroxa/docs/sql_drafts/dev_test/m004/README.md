# M004 Dev Test Execution Package

**Purpose:** Paste-and-run files for testing Migration 004 (Posting
Foundation) in the Supabase dev project SQL editor. Authoritative
source files:

- `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql`
- `docs/sql_drafts/migrations_review/004_post_slot_reset_guard_draft.sql`
- `docs/MIGRATION_004_TEST_PLAN.md`

## Hard preconditions (all must be true)

- [ ] **M001 through M003 applied and green** on this same dev project,
      including the M003 team-scope correction
      (`01c_apply_team_scope_correction.sql`).
- [ ] The M001–M003 fixture set is present: 5 users, 2 clients (A=
      Restaurant A, B=Restaurant B), team assignments, 5 media_assets.
- [ ] This is the **DEV Supabase project** only — never production.
- [ ] No real client or restaurant data exists in this project.
- [ ] AUTH_MODE is `"placeholder"` in the app and stays that way.
- [ ] Portal is NOT connected to this database.
- [ ] No real client credentials are being issued.

If any precondition is false, STOP. Do not proceed.

## Do not (during this run)

- Apply M005, M006, or later migrations.
- Move M004 SQL into `supabase/migrations/`.
- Change `AUTH_MODE`.
- Connect the portal.
- Use real restaurant names, addresses, or social accounts in seed data.
- Change locked pricing values.

## Execution order

| Step | File | Where to run |
|---|---|---|
| 1 | `01_apply_m004.sql` | Supabase SQL editor (service-role / postgres context) |
| 2 | `01b_apply_post_slot_reset_guard.sql` | Supabase SQL editor |
| 3 | `02_seed_m004_dev_data.sql` | Supabase SQL editor (replace UUID placeholders first) |
| 4 | `03_test_m004_queries.sql` | Supabase SQL editor — run each numbered block separately |
| 5 | `04_m004_test_results.md` | Fill in pass/fail as you go |
| 6 | `M004_EXECUTION_SUMMARY.md` | Reference — describes what this package does, stop conditions |

## Predicted source-draft defect (Test 1a)

Reviewing `004_posting_foundation_draft.sql` against the M002 helper
definitions reveals the same `can_view_client` over-broad-scope pattern
as was fixed in M003 — this time on `posts_select_staff`.

**Root cause.** `posts_select_staff` uses
`private.can_view_client(client_id)` with no status restriction. Since
`can_view_client(p)` returns TRUE for a client whose client_id is `p`,
a client-role caller matches this "staff" policy for ALL of their own
posts, including internal-pipeline states the client is not meant to see.

**Effect on Test 1a.** client@A is expected to see 2 posts
(`scheduled` + `published`). Predicted actual: 5 (all of A's posts,
including `planning`, `ready_for_review`, and `failed`).

**Test 1c (post_slots) — not a count failure.** `post_slots_select_staff`
also uses `can_view_client`, but since there is no status filter on
slots, the count client@A sees (3) is the same via either the own-client
or staff policy. Record a note, not a FAIL, for 1c.

**Recommended correction (deferred, not in this package).** In
`004_posting_foundation_draft.sql`, replace `can_view_client` with
`is_assigned_to_client` in both `posts_select_staff` and
`post_slots_select_staff`. Or add an explicit `current_user_role() <>
'client'` AND-clause. This must be resolved before M004 is promoted
beyond dev.

**What to do during the run.** Record the actual result for Test 1a. If
5 rows, mark FAIL with a note linking to this section and the
recommended correction. All other tests should pass.

## Stop conditions (any one halts the run)

- M004 apply (step 1) errors.
- Reset guard apply (step 2) errors.
- Seed (step 3) fails after UUID replacement.
- Any required test in step 4 fails (see Test 1a exception above — that
  specific failure is diagnostic, not a full stop; continue the run but
  record the defect).

## What to do when all required tests pass

1. Complete `04_m004_test_results.md` with all passes recorded.
2. Confirm AUTH_MODE still `"placeholder"`, portal still disconnected,
   no M005+ applied.
3. Record the F7 decision (see M004_EXECUTION_SUMMARY.md).
4. Report back so the M004 source-draft `can_view_client` correction can
   be drafted and applied, then M005 dev test package prepared.

## Supabase SQL editor context note

The SQL editor runs as `postgres` (superuser), which bypasses RLS by
default. Per-user tests wrap their queries in a transaction that sets
`set local role authenticated` + `set local "request.jwt.claims"` to
simulate a signed-in user. Every per-user test ends with `rollback;` so
mutations don't persist — confirm `ROLLBACK` in the result before moving
to the next block.

## UUID reference (fixed — do not randomise)

| Alias | UUID | Description |
|---|---|---|
| CLIENT_A_ID | `a0000000-0000-4000-a000-00000000000a` | Restaurant A (from M002) |
| CLIENT_B_ID | `b0000000-0000-4000-b000-00000000000b` | Restaurant B (from M002) |
| MEDIA_A3 | `a000000a-0003-4000-a000-00000000000a` | Approved media_asset for A (from M003) — linked to POST_A2 |
| POST_A1 | `a4000001-0000-4000-a000-000000000001` | Weekend brunch promo (scheduled) |
| POST_A2 | `a4000001-0000-4000-a000-000000000002` | Anniversary reel (published) |
| POST_A3 | `a4000001-0000-4000-a000-000000000003` | Winter menu draft (planning) |
| POST_A4 | `a4000001-0000-4000-a000-000000000004` | Review needed — taco shot (ready_for_review) |
| POST_A5 | `a4000001-0000-4000-a000-000000000005` | Promo that broke (failed) |
| POST_B1 | `b4000001-0000-4000-b000-000000000001` | B's Tuesday special (scheduled) |
| POST_B2 | `b4000001-0000-4000-b000-000000000002` | B's draft idea (planning) |
| SLOT_A1 | `a4000002-0000-4000-a000-000000000001` | A instagram tomorrow 10:00 reserved→POST_A1 |
| SLOT_A2 | `a4000002-0000-4000-a000-000000000002` | A instagram tomorrow 14:00 open |
| SLOT_A3 | `a4000002-0000-4000-a000-000000000003` | A facebook tomorrow 09:00 open |
| SLOT_B1 | `b4000002-0000-4000-b000-000000000001` | B instagram tomorrow 11:00 open |
