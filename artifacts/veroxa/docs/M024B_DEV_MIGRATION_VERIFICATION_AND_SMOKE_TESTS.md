# M024B — Dev migration verification + safe write smoke test harness

## Purpose

Provide an internal-only system to:

1. Verify whether the M024A metadata tables are readable (schema
   verification — reads only, no writes).
2. Run explicit metadata-only smoke tests against the dev write adapter
   once a dev Supabase project has the M024A schema applied.

This build does NOT connect any client-facing page to real writes.
No storage upload. No seed data. No real restaurant names. No real
client data.

## Schema verification

`src/lib/data/schemaVerification.ts`

For each expected M024A table, issues a zero-row `SELECT id LIMIT 1`
via the anon/browser Supabase client.

- Empty table + no error → **passed**
- `42P01` (undefined_table) → **failed** with "Apply the M024A migration."
- RLS block → **failed** with "Check dev-stage policies."
- No Supabase client → **not_configured**

Raw Supabase errors never reach the UI. Safe messages only.

### Expected tables

- `clients`
- `restaurant_upload_keys`
- `upload_submissions`
- `direction_requests`
- `team_review_decisions`

### Why verification is read-only

Verification is structural — we only need to confirm tables exist and
are readable. Writes require a real client UUID and the dev write flag,
which is a separate explicit step (smoke test).

## Smoke tests

`src/lib/data/devWriteSmokeTests.ts`

### Why explicit button click

Smoke tests perform real Supabase writes when the dev flag is set.
Running them automatically would create noise in the dev project on
every page load. They exist to be triggered deliberately by the Veroxa
team.

### Why dev client UUID is required

The M024A migration does not seed any client rows. A `clients` row
with a known UUID must be created manually in the dev Supabase project
before submission metadata can be associated with it (FK constraint).
Hardcoding a fake UUID would produce FK violation failures on every run
and mislead the team about write health.

### Why no seed data was added

Adding seed data with real restaurant names or real upload keys would
violate the hard invariant ("no real client data, no real upload keys").
Fictional smoke-test data is generated in `devWriteSmokeTestData.ts`.

### Why no storage upload was added

Storage upload requires a separate bucket, signed-URL infrastructure,
and RLS for storage objects. It is a later milestone, scoped
separately.

### Smoke test steps (when writes enabled + client UUID provided)

1. Write mode check — must be `dev_supabase_writes`.
2. Supabase client check — must be configured.
3. Dev client UUID check — must be a valid UUID.
4. `createUploadSubmission` — fictional upload submission.
5. `createDirectionRequest` — fictional direction request.
6. `createTeamReviewDecision` — fictional review decision linked to
   upload.
7. `updateUploadReviewStatus` — update upload to `in_review`.
8. `updateDirectionStatus` — update direction to `interpreted`.

### Dry run

Pass `dryRun: true` in options — no writes performed; all steps
reported as `dry_run`.

## How to use safely

1. Apply the M024A migration:
   `supabase/migrations/20260601000000_m024a_first_client_metadata_schema.sql`
   against a **dev** Supabase project only. Never apply to production.

2. Manually create a fictional dev client row in the `clients` table:
   ```sql
   INSERT INTO public.clients (display_name, status, service_plan)
   VALUES ('Veroxa Smoke Test Restaurant', 'active', 'complete_online_presence')
   RETURNING id;
   ```

3. Copy the returned UUID.

4. Set `VITE_VEROXA_ENABLE_DEV_WRITES="true"` and `VITE_VEROXA_DEV_WRITE_ENV="dev"` in `.env.local` (dev
   only — never in production or committed env files).

5. Open `/internal/supabase-readiness`.

6. Run schema verification. Confirm all 5 tables pass.

7. Paste the dev client UUID into the smoke test input.

8. Run the dry run. Confirm all steps show `dry_run`.

9. Run the full metadata smoke test. Confirm all steps show `passed`.

## What not to do

- Do not use real restaurant names in the dev client row.
- Do not run against a production Supabase project.
- Do not expose a service role key in frontend code.
- Do not add storage upload — it is a separate later milestone.
- Do not commit `VITE_VEROXA_ENABLE_DEV_WRITES=true` or `VITE_VEROXA_DEV_WRITE_ENV=dev` to production-like `.env` files.
- Do not leave fictional smoke-test rows in a shared dev project
  without cleanup.

## M025A progression

After M024B verification, M025A connects the Client Direction Center to the dev write adapter safely. The local/session store is always written first; the Supabase write is a best-effort supplementary layer that never breaks the user flow on failure.
