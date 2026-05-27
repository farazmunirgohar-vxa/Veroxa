# M002 Dev Test Execution Package

**Purpose:** Paste-and-run files for testing Migration 002 (Client
Foundation) in the Supabase dev project SQL editor. Authoritative
source files:

- `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- `docs/MIGRATION_002_TEST_PLAN.md`
- `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- `docs/SUPABASE_RLS_PLAN_V1.md`
- `docs/PORTAL_QUERY_SAFETY_PLAN.md`

## Hard preconditions (all must be true)

- [ ] **M001 was applied and tested green** on this same dev project.
      The five M001 fixture users exist in `auth.users` +
      `public.user_profiles`, and the team user has a
      `public.team_members` row.
- [ ] This is the **DEV Supabase project** only — never production.
- [ ] No real client or restaurant data exists in this project.
- [ ] AUTH_MODE is `"placeholder"` in the app and stays that way.
- [ ] Portal is NOT connected to this database.
- [ ] No real client credentials are being issued.

If any precondition is false, STOP. Do not proceed.

## Do not (during this run)

- Apply M003, M004, M005, M006, portal-connect views, notifications
  guard, or post-slot reset guard.
- Move M002 SQL into `supabase/migrations/`.
- Change `AUTH_MODE`.
- Connect the portal.
- Use real restaurant names or addresses in seed data.
- Change locked pricing values (GPS $497, COP 12/6/3/no-contract =
  $997/$1,097/$1,197/$1,497 → cents: 49700 / 99700 / 109700 / 119700 / 149700).

## Execution order

| Step | File | Where to run |
|---|---|---|
| 1 | `01_apply_m002.sql` | Supabase SQL editor (service-role / postgres context) |
| 2 | `02_seed_m002_dev_data.sql` | Supabase SQL editor (replace UUID placeholders first) |
| 3 | `03_test_m002_queries.sql` | Supabase SQL editor — run each numbered block separately |
| 4 | `04_m002_test_results.md` | Fill in pass/fail as you go |
| 5 | `M002_EXECUTION_SUMMARY.md` | Reference — describes what this package does, stop conditions, and what to do after green |

## Stop conditions (any one halts the run)

- M002 apply (step 1) errors.
- Seed (step 2) fails after UUID replacement.
- Any required test in step 3 fails.
- Any unexpected mutation persists outside a rolled-back transaction.

If any of the above happens: STOP, fill in the results sheet with the
failure details, do NOT proceed to M003.

## What to do when everything is green

1. Complete `04_m002_test_results.md` with all passes recorded.
2. Confirm at the bottom of that file: AUTH_MODE still `"placeholder"`,
   portal still disconnected, no M003+ applied.
3. Report back so the M003 dev test package can be prepared next.

## Supabase SQL editor context note

The SQL editor runs as the `postgres` (superuser) role, which bypasses
RLS by default. Per-user tests in `03_test_m002_queries.sql` wrap their
queries in a transaction that sets
`set local role authenticated` + `set local "request.jwt.claims" = '{...}'`
to simulate a signed-in user. Every per-user test ends with `rollback;`
so mutations don't persist — confirm `ROLLBACK` in the result before
moving to the next block.
