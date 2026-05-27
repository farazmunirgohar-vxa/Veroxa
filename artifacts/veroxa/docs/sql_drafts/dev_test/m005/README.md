# M005 Dev Test Execution Package

**Purpose:** Paste-and-run files for testing Migration 005 (Reporting
Foundation) in the Supabase dev project SQL editor. Authoritative
source files:

- `docs/sql_drafts/migrations_review/005_reporting_foundation_draft.sql`
- `docs/MIGRATION_005_TEST_PLAN.md`
- `docs/MIGRATION_005_REPORTING_FOUNDATION_PLAN.md`

## Hard preconditions (all must be true)

- [ ] **M001 through M004 applied and green** on this same dev project,
      including:
      - M003 team-scope correction (`m003/01c`)
      - M004 posts/post_slots staff-policy correction (`m004/01c`)
- [ ] The M001–M004 fixture set is present (5 users, 2 clients, team
      assignments, media_assets, posts, post_slots) — at least one
      `posts.id` per seeded client so `weekly_reports.top_post_id` can
      resolve.
- [ ] This is the **DEV Supabase project** only — never production.
- [ ] No real client or restaurant data exists in this project.
- [ ] AUTH_MODE is `"placeholder"` in the app and stays that way.
- [ ] Portal is NOT connected to this database.
- [ ] No real client credentials are being issued.

If any precondition is false, STOP. Do not proceed.

## Do not (during this run)

- Apply M006 or later migrations.
- Move M005 SQL into `supabase/migrations/`.
- Change `AUTH_MODE`.
- Connect the portal.
- Use real restaurant names, addresses, or social accounts in seed data.
- Change locked pricing values.

## Execution order

| Step | File | Where to run |
|---|---|---|
| 1 | `01_apply_m005.sql` | Supabase SQL editor (service-role / postgres context) |
| 2 | `02_seed_m005_dev_data.sql` | Supabase SQL editor (replace UUID placeholders first) |
| 3 | `03_test_m005_queries.sql` | Supabase SQL editor — run each numbered block separately |
| 4 | `04_m005_test_results.md` | Fill in pass/fail as you go |
| 5 | `M005_EXECUTION_SUMMARY.md` | Reference — describes what this package does, stop conditions |

> No `01b` guard file in M005 — the source draft has no separate guard
> migration (unlike M003 notifications-status and M004 post-slot-reset
> guards). Apply step 2 directly after step 1.

## Locked deviations from the originating prompt

These are intentional and documented in `MIGRATION_005_TEST_PLAN.md`:

1. `weekly_reports` unique constraint is `(client_id, week_start)`, not
   `(client_id, week_start, week_end)`. ISO week is uniquely identified
   by its start date.
2. Column names: `draft_owner_id` + `validation_owner_id` (not
   `drafted_by_user_id` / `validated_by_user_id`).
3. `monthly_reports.internal_operator_note` is NOT created. All
   staff-only commentary lives in `summary_json` outside the `client_safe`
   subpath.
4. The summary_json client-safe contract is `summary_json->'client_safe'`.
   Anything outside that JSON path is internal.

## What this package tests (high level)

| Test | What it confirms |
|---|---|
| 1–5 | Client visibility (own + published only) on both weekly + monthly views/tables |
| 6 | Team draft + validate flow on weekly_reports |
| 7 | Team blocked from approve/publish on monthly_reports |
| 8 | **Operator approval gate** — `status='published'` requires `approved_by_user_id IS NOT NULL` |
| 9 | Owner full access — including the approval gate (owner cannot bypass) |
| 10 | Unique constraints + `month_key` regex check |
| 11 | Cross-tenant isolation |
| 12 | Cascade behavior |
| 13 | Anon access fully blocked |
| 14 | View column conformance (no extra columns, exact projection) |
| 15 | `security_invoker=true` honored on both views |
| 16 | Helper short-circuits (`is_operator`, `is_active=false`) |

## Stop conditions (any one halts the run)

- M005 apply (step 1) errors.
- Seed (step 2) fails after UUID replacement.
- Any required test in step 3 fails — no predicted-fail tests in M005
  (no `can_view_client` defect in this draft).

## What to do when all required tests pass

1. Complete `04_m005_test_results.md` with all passes recorded.
2. Confirm AUTH_MODE still `"placeholder"`, portal still disconnected,
   no M006 applied.
3. Report back so M006 dev test package execution can begin (or, if
   M006 has already been prepared, the M006 run can proceed).

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
| POST_A1 | `a4000001-0000-4000-a000-000000000001` | Weekend brunch promo (scheduled, from M004) |
| POST_A2 | `a4000001-0000-4000-a000-000000000002` | Anniversary reel (published, from M004) |
| WR_A1 | `a5000001-0000-4000-a000-000000000001` | A weekly drafted, week_start 2026-05-04 |
| WR_A2 | `a5000001-0000-4000-a000-000000000002` | A weekly validated, week_start 2026-04-27 |
| WR_A3 | `a5000001-0000-4000-a000-000000000003` | A weekly published, week_start 2026-04-20 |
| WR_A4 | `a5000001-0000-4000-a000-000000000004` | A weekly published, week_start 2026-04-13 (top_post_id NULL) |
| WR_B1 | `b5000001-0000-4000-b000-000000000001` | B weekly drafted, week_start 2026-05-04 |
| WR_B2 | `b5000001-0000-4000-b000-000000000002` | B weekly published, week_start 2026-04-20 |
| MR_A1 | `a5000002-0000-4000-a000-000000000001` | A monthly drafting, 2026-05 |
| MR_A2 | `a5000002-0000-4000-a000-000000000002` | A monthly operator_review, 2026-04 |
| MR_A3 | `a5000002-0000-4000-a000-000000000003` | A monthly approved, 2026-03 |
| MR_A4 | `a5000002-0000-4000-a000-000000000004` | A monthly published, 2026-02 |
| MR_B1 | `b5000002-0000-4000-b000-000000000001` | B monthly drafting, 2026-05 |
| MR_B2 | `b5000002-0000-4000-b000-000000000002` | B monthly published, 2026-03 |
