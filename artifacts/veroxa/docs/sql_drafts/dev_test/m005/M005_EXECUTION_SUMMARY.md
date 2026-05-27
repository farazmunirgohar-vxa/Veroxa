# M005 Execution Summary

**Status:** Ready to run on the Supabase dev project. Authored from
`docs/sql_drafts/migrations_review/005_reporting_foundation_draft.sql`
and `docs/MIGRATION_005_TEST_PLAN.md`. Not executed.

## What this package does

Applies M005 (weekly_reports + monthly_reports + two client-safe views)
to the dev project, seeds 12 report rows across the two demo clients,
and runs 41 row-level checks across 16 tests. Validates RLS scoping,
the monthly-approval gate, view column-hiding, and cross-tenant
isolation.

## Source-of-truth files

- SQL draft: `docs/sql_drafts/migrations_review/005_reporting_foundation_draft.sql`
- Plan: `docs/MIGRATION_005_REPORTING_FOUNDATION_PLAN.md`
- Test plan: `docs/MIGRATION_005_TEST_PLAN.md`
- Schema: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- RLS: `docs/SUPABASE_RLS_PLAN_V1.md`

## Hard invariants — not changed by this run

- `AUTH_MODE = "placeholder"` (literal in `src/lib/auth/authMode.ts`)
- Portal is NOT connected to the database
- No publishing integrations, no payment processing, no AI providers
- No real client / restaurant data
- Locked pricing is unchanged

## Files in this package

| File | Role |
|---|---|
| `README.md` | How to run + preconditions + locked deviations + UUID table |
| `01_apply_m005.sql` | Applies M005 schema, RLS, and the two views. **The `can_view_client` → `is_assigned_to_client` correction for the two staff SELECT policies is baked in here — included, not deferred.** |
| `01b_apply_reports_select_staff_correction.sql` | OPTIONAL / no-op for fresh runs. Retained only for dev projects that ran the pre-correction `01_apply_m005.sql` and need to re-apply the corrected policies idempotently. |
| `02_seed_m005_dev_data.sql` | Seeds 6 weekly + 6 monthly fixture rows (replace `<<...>>` placeholders) |
| `03_test_m005_queries.sql` | 16 tests, 41 numbered checks |
| `04_m005_test_results.md` | Pass/fail tracker (one row per check) |
| `M005_EXECUTION_SUMMARY.md` | This file |

> M005 has no `01b` trigger-based guard migration (unlike M003's
> notifications-status guard or M004's post-slot reset guard). The
> staff-policy correction — same defect class as `m003/01c` and
> `m004/01c`, applied to the two report staff SELECT policies — is
> now baked into `01_apply_m005.sql` and into the upstream draft
> `005_reporting_foundation_draft.sql`. The standalone `01b` file
> is retained only for re-apply scenarios on dev projects that
> already ran the pre-correction apply step.

## Fixture overview (after seed)

**Restaurant A — 4 weekly + 4 monthly:**
- Weekly: WR_A1 drafted, WR_A2 validated, WR_A3 published, WR_A4 published (no top post)
- Monthly: MR_A1 drafting, MR_A2 operator_review, MR_A3 approved, MR_A4 published

**Restaurant B — 2 weekly + 2 monthly:**
- Weekly: WR_B1 drafted, WR_B2 published
- Monthly: MR_B1 drafting, MR_B2 published

All `summary_json` rows follow the contract: client-safe content under
`summary_json->'client_safe'`, internal content under
`summary_json->'internal'`. The views expose only the former.

## Test coverage map

| Tests | What gets covered |
|---|---|
| 1–5 | Client visibility (only own + only published) on both tables and both views |
| 6 | Team draft + validate on weekly_reports; cross-tenant denial; reporter-role exclusion |
| 7 | Team blocked from approve and publish on monthly_reports |
| 8 | **Operator approval gate** — `status='published'` requires `approved_by_user_id IS NOT NULL` |
| 9 | Owner full access — including the approval gate (owner does NOT bypass) |
| 10 | Unique constraints + `month_key` regex check |
| 11 | Cross-tenant isolation |
| 12 | Cascade behavior (post delete → set null; client delete → cascade) |
| 13 | Anon fully blocked |
| 14 | View column conformance + JSON subpath contract |
| 15 | `security_invoker=true` honored on both views |
| 16 | Helper short-circuits — operator sees all, deactivated team sees nothing |

## Stop conditions (any one halts the run)

- `01_apply_m005.sql` errors.
- `02_seed_m005_dev_data.sql` errors after placeholder replacement.
- Any required test in `03_test_m005_queries.sql` fails — there are no
  predicted-fail tests in M005 (the source draft has no
  `can_view_client`-on-staff-policy defect).

## Out of scope

- Promoting any SQL to `supabase/migrations/`
- Connecting the portal to the database
- Changing AUTH_MODE
- AI report generation, PDF/image exports, payment reporting
- Activity-log writes for report transitions (hybrid log strategy is
  app-layer; deferred)
- M006 application — apply only after M005 completes green
