# Migration 005 — Reporting Foundation: Test Plan Outline

**Status:** Outline only. The full plan with fixtures and pass/fail
cells is authored alongside the M005 SQL draft. `AUTH_MODE` remains
`"placeholder"`.

## Prerequisites
- [ ] Migrations 001, 002, 003, and 004 all applied and green on the target project.
- [ ] M001+M002+M003+M004 fixture set present, including at least one `posts.id` per seeded client so `weekly_reports.top_post_id` can resolve.
- [ ] One demo user per role (`client@…`, `team@…`, `operator@…`, `owner@…`).
- [ ] Demo client A and demo client B exist so cross-tenant isolation can be probed.

## Scope under test
Tables: `weekly_reports`, `monthly_reports`. Views:
`client_portal_weekly_reports_view`,
`client_portal_monthly_reports_view`. No FK additions to prior
tables.

---

## Headline test cases

### 1. Client sees only own published weekly reports
- [ ] As client A: `select * from public.client_portal_weekly_reports_view` returns only rows where `client_id = A` AND the underlying row's `status='published'`.
- [ ] Client A cannot see any of client B's weekly reports through the view or the base table.

### 2. Client cannot see draft weekly reports
- [ ] As client A: a `weekly_reports` row for A with `status='drafted'` does NOT appear in `client_portal_weekly_reports_view`.
- [ ] Same for `status='validated'`.
- [ ] Direct base-table query (`select * from public.weekly_reports`) returns 0 rows for the client role (base-table SELECT grant revoked).

### 3. Client cannot see `internal_validation_note`
- [ ] `client_portal_weekly_reports_view` does NOT expose `internal_validation_note` as a column.
- [ ] Attempting to select the column from the view fails with "column does not exist".
- [ ] Base-table SELECT as client is denied (no grant), so the column is unreachable that way as well.

### 4. Client sees only own published monthly reports
- [ ] As client A: `select * from public.client_portal_monthly_reports_view` returns only rows where `client_id = A` AND `status='published'`.
- [ ] Client A cannot see client B's monthly reports through any path.

### 5. Client cannot see `operator_review` monthly reports
- [ ] As client A: a `monthly_reports` row for A with `status='operator_review'` is absent from `client_portal_monthly_reports_view`.
- [ ] Same for `status='drafting'` and `status='approved'` — only `published` is visible.

### 6. Team can draft assigned client weekly reports
- [ ] As team (assigned A, executor role): `insert into public.weekly_reports (client_id, week_start, week_end, status) values (<A>, <date>, <date>, 'drafted')` → succeeds.
- [ ] As team (assigned A): `update public.weekly_reports set status='validated', validation_owner_id=auth.uid() where id=<own draft>` → succeeds.
- [ ] As team (assigned A): same insert with `client_id=<B>` → **denied**.
- [ ] As team (assigned A): attempting `update ... set status='published'` → **denied** (publication is operator-only).

### 7. Team cannot approve monthly reports
- [ ] As team (assigned A): `update public.monthly_reports set status='approved', approved_by_user_id=auth.uid() where id=<own draft>` → **denied**.
- [ ] As team (assigned A): `update ... set status='operator_review' where status='drafting'` → succeeds (team owns this submit step).
- [ ] As team (assigned A): `update ... set status='published'` → **denied**.

### 8. Operator can approve monthly reports
- [ ] As operator: `update public.monthly_reports set status='approved', approved_by_user_id=auth.uid() where id=<any operator_review row>` → succeeds.
- [ ] As operator: `update ... set status='published', published_at=now() where status='approved' AND approved_by_user_id is not null` → succeeds.
- [ ] As operator: attempting to flip `operator_review → published` directly (skipping `approved`) → **denied** by the approval-required policy.

### 9. Owner can view all reports
- [ ] As owner: `select count(*) from public.weekly_reports` returns the total across all clients and all statuses.
- [ ] As owner: `select count(*) from public.monthly_reports` returns the total across all clients and all statuses.
- [ ] As owner: can SELECT `internal_validation_note` and full `summary_json` for any row.

### 10. Unique monthly report per client/month works
- [ ] Insert two `monthly_reports` rows with the same `(client_id, month_key)` → second fails with unique violation.
- [ ] Same `month_key` for a different `client_id` → succeeds.
- [ ] Same `client_id` for a different `month_key` → succeeds.
- [ ] Equivalent check on `weekly_reports`: two rows with the same `(client_id, week_start)` → second fails; different `week_start` succeeds.

### 11. Rollback drops report views before report tables
- [ ] Rollback script drops `client_portal_weekly_reports_view` and `client_portal_monthly_reports_view` **before** dropping `weekly_reports` and `monthly_reports`.
- [ ] Reversing the order (drop table before view) fails with "view depends on table".
- [ ] After rollback, `weekly_reports`, `monthly_reports`, and both views are absent from the schema.
- [ ] Pre-M005 snapshot → apply M005 → restore snapshot → state matches.

---

## Rollback expectation

**Forward-only + pre-cutover snapshot**, same as M001–M004.

### Rollback drop order (dev reference)

```text
-- Drop the views first so the base tables are no longer depended on.
drop view  if exists public.client_portal_weekly_reports_view;
drop view  if exists public.client_portal_monthly_reports_view;
drop table if exists public.weekly_reports  cascade;
drop table if exists public.monthly_reports cascade;
```

### Rollback tests
- [ ] Apply M005 to a clean dev project that has M001 + M002 + M003 + M004 → succeeds.
- [ ] Re-apply through the Supabase runner → "already applied".
- [ ] Re-run raw `.sql` → fails cleanly with "relation already exists".
- [ ] Snapshot restore: pre-M005 snapshot → apply → restore → state matches.
- [ ] View-drop ordering test: dropping the report tables before the views fails; dropping views first then tables succeeds.

---

## Blocking Issues Before Real Migration

| # | Issue | Severity | Resolution |
|---|---|---|---|
| E1 | M005 SQL draft does not yet exist | Blocker for M005 promotion | Author `docs/sql_drafts/migrations_review/005_reporting_foundation_draft.sql` once M004 has progressed through testing. |
| E2 | `summary_json` client-safe key shape not pinned | Blocker for the client-safe view definition | Lock the safe key path (e.g. `summary_json->'client_safe'` or an explicit top-level allow-list) when the SQL draft is authored. |
| E3 | No auto-draft worker for weekly / monthly rows | NOT a blocker for M005 schema | Out of scope; orchestration is a separate track. Seed covers the demo set; team manually inserts otherwise. |
| E4 | Test plan above is outline-only, no fixtures | Blocker for promotion | Materialize fixtures + per-test pass/fail cells when the SQL draft is authored. |
| E5 | Report status transitions not yet wired into `activity_logs` write path | NOT a blocker for M005 schema | Tracked alongside the implementation pass; relies on hybrid log strategy from `SUPABASE_RLS_PLAN_V1.md` Part 9. |
| E6 | No AI report generation, no PDF export, no payment reporting | NOT a blocker for M005 | All explicitly out of scope; tracked on separate tracks. |

**Promotion gate:** M004 promoted + green. E1, E2, and E4 closed (SQL drafted, safe-key shape locked, tests fleshed out and run).

---

## Cross-references

- M005 plan: `docs/MIGRATION_005_REPORTING_FOUNDATION_PLAN.md`
- M004 draft: `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql`
- M004 test outline: `docs/MIGRATION_004_TEST_PLAN_OUTLINE.md`
- Schema reference: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- RLS reference: `docs/SUPABASE_RLS_PLAN_V1.md`
- Demo data reference: `docs/DEMO_DATA_MAP.md`
