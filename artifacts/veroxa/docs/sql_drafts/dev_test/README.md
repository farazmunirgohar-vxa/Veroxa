// Dev Test Execution Index — M001 through M006

**Purpose:** Master execution order for the Supabase dev-project test
packages under `docs/sql_drafts/dev_test/`. Each migration ships its
own folder (`m001/` … `m006/`) with its own README, apply / seed /
test SQL, and pass/fail tracker. This index tells humans the order
those packages must be run in, and where the correction sub-files
(`01b` / `01c`) slot in.

> **DEV Supabase project only — never production.** All SQL listed
> below stays under `docs/sql_drafts/`. **Do NOT** copy any of it into
> `supabase/migrations/`. AUTH_MODE remains `"placeholder"` throughout.
> The portal is NOT connected to this dev project during these runs.

## Hard invariants (do not violate during any of these runs)

- AUTH_MODE stays the literal string `"placeholder"`.
- No file is added to `supabase/migrations/`.
- The portal stays disconnected from any real database in this phase.
- No real AI provider is wired; `ai_agents.is_enabled=true` is inert.
- `ai_agents.config_json` never contains secrets, API keys, bearer
  tokens, or signed URLs.
- Demo gate `veroxa-preview` unchanged. Locked pricing unchanged.
- Roles remain exactly Client / Team / Operator / Owner.
- No real client / restaurant / customer data. Fixtures only.

## Run order (humans run these manually on dev Supabase)

Run each migration's package in order. Within a migration, run files
in the listed order. Do NOT advance to the next migration until the
prior one's test tracker is fully green.

### M001 — Identity Foundation
1. `m001/01_apply_m001.sql` *(legacy filenames — at repo root:
   `dev_test/01_apply_m001.sql`, `dev_test/02_seed_dev_users.sql`,
   `dev_test/03_test_queries.sql`, `dev_test/04_test_results.md`)*
2. `02_seed_dev_users.sql`
3. `03_test_queries.sql`
4. Record pass/fail in `04_test_results.md`.

### M002 — Client Foundation
1. `m002/01_apply_m002.sql`
2. `m002/02_seed_m002_dev_data.sql`
3. `m002/03_test_m002_queries.sql`
4. Record pass/fail in `m002/04_m002_test_results.md`.

### M003 — Media Foundation
1. `m003/01_apply_m003.sql`
2. `m003/01b_apply_notifications_status_guard.sql`
3. `m003/01c_apply_team_scope_correction.sql`
4. `m003/02_seed_m003_dev_data.sql`
5. `m003/03_test_m003_queries.sql`
6. Record pass/fail in `m003/04_m003_test_results.md`.

### M004 — Posting Foundation
1. `m004/01_apply_m004.sql`
2. `m004/01b_apply_post_slot_reset_guard.sql`
3. `m004/01c_apply_posts_select_staff_correction.sql`
4. `m004/02_seed_m004_dev_data.sql`
5. `m004/03_test_m004_queries.sql`
6. Record pass/fail in `m004/04_m004_test_results.md`.

### M005 — Reporting Foundation
1. `m005/01_apply_m005.sql`
2. `m005/01b_apply_reports_select_staff_correction.sql`
   *(closes the same `can_view_client` defect class that 01c closed on
   M003 and M004, applied to `weekly_reports_select_staff` and
   `monthly_reports_select_staff`)*
3. `m005/02_seed_m005_dev_data.sql`
4. `m005/03_test_m005_queries.sql`
5. Record pass/fail in `m005/04_m005_test_results.md`.

### M006 — Content / AI Layer
1. `m006/01_apply_m006.sql`
2. `m006/02_seed_m006_dev_data.sql`
3. `m006/03_test_m006_queries.sql`
4. Record pass/fail in `m006/04_m006_test_results.md`.
   *(security-critical checks: 8d and 11c — `ai_agents.config_json`
   must contain no secret-shaped values.)*

## Stop conditions

Any one of these halts the whole run:

- An apply step errors.
- A seed step errors after placeholder replacement.
- Any required test in a migration's `03_*` file fails.
- Any `config_json` secret-substring scan in M006 returns ≥1 row.

## What this index is NOT

- It is NOT permission to promote any of these files to
  `supabase/migrations/`. Promotion is a separate decision tracked in
  each migration's own plan doc.
- It is NOT permission to flip AUTH_MODE or connect the portal.
- It does NOT replace each migration's own README — those READMEs are
  the source of truth for preconditions, UUIDs, and stop conditions.

## Cross-references

- Portal-query safety contract: `docs/PORTAL_QUERY_SAFETY_PLAN.md`
- Portal-query safety checklist: `docs/PORTAL_QUERY_SAFETY_CHECKLIST.md`
- RLS reference: `docs/SUPABASE_RLS_PLAN_V1.md`
- Schema reference: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
