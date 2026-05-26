# M001 Dev Test Execution Package

**Purpose:** Paste-and-run files for testing Migration 001 in the
Supabase dev project SQL editor. Authoritative source files:

- `docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql`
- `docs/MIGRATION_001_TEST_PLAN.md`

**Requirements:**
- DEV Supabase project only — NOT production.
- No real restaurant or client data.
- AUTH_MODE stays "placeholder" in the app throughout.
- Portal NOT connected to this dev project.

**Execution order:**

| Step | File | Where to run |
|---|---|---|
| 1 | `01_apply_m001.sql` | Supabase SQL editor (service-role context) |
| 2 | `02_seed_dev_users.sql` | Supabase SQL editor (service-role context) |
| 3 | `03_test_queries.sql` | Supabase SQL editor — each block separately; read comments |
| 4 | Record results in `04_test_results.md` | Fill in manually as you run |

**Supabase SQL editor context:** The SQL editor runs as the `postgres`
(superuser) role, which bypasses RLS. To simulate per-user contexts,
each test block wraps queries in a transaction with
`set local role authenticated` and `set local "request.jwt.claims"`.
Always `rollback` (not `commit`) so test mutations don't persist.

**Do NOT:**
- Run step 1 on a project that already has `public.user_profiles`
  (will fail with "relation already exists").
- Commit any of the per-user test transactions (tests are read-write
  probes; rollback is the safe path).
- Apply M002–M006 at any point during M001 testing.
