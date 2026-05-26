# Migration 005 — Reporting Foundation: Test Plan

**Status:** Planning. Tests not yet executed. `AUTH_MODE` remains
`"placeholder"`. This is the materialized version of
`MIGRATION_005_TEST_PLAN_OUTLINE.md` with fixtures, the four locked
deviations from the originating prompt, and per-test pass/fail cells.

## Prerequisites

- [ ] Migration 001 applied and green.
- [ ] Migration 002 applied and green.
- [ ] Migration 003 applied and green.
- [ ] Migration 004 applied and green.
- [ ] M001+M002+M003+M004 fixture set present, including at least one `posts.id` per seeded client so `weekly_reports.top_post_id` can resolve.
- [ ] One demo user per role: `client@veroxa.test` (Client A), `team@veroxa.test` (assigned A, executor), `team2@veroxa.test` (assigned B, reporter), `operator@veroxa.test`, `owner@veroxa.test`.
- [ ] Demo client A and demo client B both exist for cross-tenant probing.
- [ ] Pre-cutover snapshot taken.

## Scope under test

Tables: `weekly_reports`, `monthly_reports`. Views:
`client_portal_weekly_reports_view`,
`client_portal_monthly_reports_view`. No FK additions to prior
migrations. No new helpers — reuses M002 helpers
(`current_user_client_id`, `can_view_client`,
`can_manage_client_operations`, `is_operator`, `is_owner`).

### Locked deviations vs. the originating prompt
1. **Unique constraint on weekly_reports is `(client_id, week_start)`**, not `(client_id, week_start, week_end)`. ISO week is uniquely identified by its start date; week_end is derived.
2. **Column names on weekly_reports are `draft_owner_id` and `validation_owner_id`**, not `drafted_by_user_id` / `validated_by_user_id`.
3. **`monthly_reports.internal_operator_note` is not created.** Staff-only commentary lives in `summary_json` outside the `client_safe` subpath, which the view does not expose.
4. **The summary_json client-safe contract is `summary_json->'client_safe'`** (closes E2 from the outline).

## Additional fixtures

**weekly_reports for Restaurant A (4 rows):**
| Status | week_start | week_end | top_post_id | internal_validation_note |
|---|---|---|---|---|
| `drafted` | 2026-05-04 | 2026-05-10 | A's "Anniversary reel" | "Need brand check on the closing line" |
| `validated` | 2026-04-27 | 2026-05-03 | A's "Weekend brunch promo" | "Looks good — operator can publish" |
| `published` (`published_at`=2026-04-27) | 2026-04-20 | 2026-04-26 | A's "Anniversary reel" | (set during validation; never client-facing) |
| `published` (`published_at`=2026-04-20) | 2026-04-13 | 2026-04-19 | NULL | (set during validation) |

**weekly_reports for Restaurant B (2 rows):**
- `drafted`, week_start=2026-05-04
- `published` (`published_at`=2026-04-27), week_start=2026-04-20

**monthly_reports for Restaurant A (4 rows):**
| Status | month_key | approved_by_user_id |
|---|---|---|
| `drafting` | 2026-05 | NULL |
| `operator_review` | 2026-04 | NULL |
| `approved` | 2026-03 | operator@veroxa.test |
| `published` (`published_at`=2026-03-01) | 2026-02 | operator@veroxa.test |

**monthly_reports for Restaurant B (2 rows):**
- `drafting`, month_key=2026-05
- `published`, month_key=2026-03, approved_by_user_id=operator

**summary_json shape** (used in every fixture):
```json
{
  "client_safe": {
    "headline": "Strong week for reach",
    "highlights": ["Reel hit 12k views", "Saturday brunch sold out"]
  },
  "internal": {
    "validation_notes_draft": "...",
    "operator_review_notes": "..."
  }
}
```

Only the `client_safe` subtree may ever surface in the views.

---

## Required tests

### 1. Client sees only own published weekly reports
- [ ] As `client@veroxa.test` (Restaurant A): `select * from public.client_portal_weekly_reports_view` returns exactly 2 rows — A's two `published` weeklies.
- [ ] Cannot see A's `drafted` or `validated` rows through the view.
- [ ] Cannot see any of B's weekly reports through the view.
- [ ] `select * from public.weekly_reports` (base table) returns exactly the same 2 rows — the base-table RLS policy `weekly_reports_select_own_client` filters to `client_id = current_user_client_id() AND status = 'published'`.

### 2. Client cannot see draft / validated weekly reports
- [ ] As client A: row count where `status='drafted'` in either the view or base table = **0**.
- [ ] Row count where `status='validated'` in either = **0**.
- [ ] After staff flips a `drafted` row to `validated`, client view still shows 0 rows for that report. Only flipping to `published` causes it to appear.

### 3. Client cannot see `internal_validation_note`
- [ ] `select column_name from information_schema.columns where table_schema='public' and table_name='client_portal_weekly_reports_view'` does NOT include `internal_validation_note`.
- [ ] `select internal_validation_note from public.client_portal_weekly_reports_view` → fails with "column does not exist".
- [ ] As client A: `select internal_validation_note from public.weekly_reports where id=<own published row>` returns 0 rows (RLS filter does not include published-but-the-column-is-there path… actually the column IS on the base table and the row IS visible to client; the protection is that the *view* hides the column, not that the base table does). Documented expectation: client portal queries the view, never the base table.
- [ ] Therefore: confirm portal data layer queries `client_portal_weekly_reports_view`, NOT `weekly_reports`. Add a lint / grep check on the portal source as a follow-up.

### 4. Client sees only own published monthly reports
- [ ] As client A: `select * from public.client_portal_monthly_reports_view` returns exactly 1 row — A's `2026-02` published monthly.
- [ ] Cannot see A's `drafting`, `operator_review`, or `approved` rows through the view.
- [ ] Cannot see any of B's monthly reports through the view.
- [ ] `select * from public.monthly_reports` (base table) returns the same 1 row — the RLS policy filters identically.

### 5. Client cannot see `operator_review` / `drafting` / `approved` monthly reports
- [ ] Row count for each non-published status in either the view or base table (as client) = **0**.
- [ ] In particular, the `approved` row for A (2026-03) is invisible to client A even though it has passed operator approval — visibility requires `status='published'`.

### 6. Team can draft assigned client weekly reports
- [ ] As `team@veroxa.test` (assigned A, executor): `insert into public.weekly_reports (client_id, week_start, week_end) values (<A>, '2026-05-11', '2026-05-17')` → succeeds with `status='drafted'` default.
- [ ] As team: `update public.weekly_reports set status='validated', validation_owner_id=auth.uid() where id=<own drafted row>` → succeeds.
- [ ] As team: insert with `client_id=<B>` → **denied** (`can_manage_client_operations(B)` is false).
- [ ] As team: `update ... set status='published' where id=<own validated row>` → **denied** (WITH CHECK fails: 'published' not in ('drafted','validated')).
- [ ] As team: `update ... set published_at=now() where id=<own validated row>` → **denied** (still constrained by team policy USING/WITH CHECK to non-published statuses).
- [ ] As `team2@veroxa.test` (assigned B, reporter role): `insert ... <B>` → **denied** (reporter excluded from `can_manage_client_operations`).
- [ ] As team2 (reporter): can SELECT B's reports → succeeds (reporter can VIEW via `can_view_client`).

### 7. Team cannot approve / publish monthly reports
- [ ] As team (assigned A): `update public.monthly_reports set status='approved', approved_by_user_id=auth.uid() where id=<A's operator_review row>` → **denied** (target status 'approved' not in team's allowed set; also team USING fails on current status 'operator_review' is allowed but WITH CHECK on new status fails).
- [ ] As team (assigned A): `update ... set status='operator_review' where id=<A's drafting row>` → succeeds (team owns the submit step).
- [ ] As team: `update ... set status='published' where id=<any>` → **denied**.
- [ ] As team: `update ... set status='approved'` on an `approved` row (no-op transition) → **denied** (USING fails — team policy does not see `approved` rows).

### 8. Operator can approve and publish monthly reports
- [ ] As `operator@veroxa.test`: `update public.monthly_reports set status='approved', approved_by_user_id=auth.uid() where id=<A's operator_review row>` → succeeds.
- [ ] As operator: `update ... set status='published', published_at=now() where id=<A's approved row>` (where `approved_by_user_id is not null`) → succeeds.
- [ ] As operator: attempt to flip `operator_review → published` directly (skipping `approved`) with `approved_by_user_id` still NULL → **denied** by WITH CHECK (`status='published' AND approved_by_user_id IS NULL` violates the gate).
- [ ] As operator: flip to `published` after first setting `approved_by_user_id` in the same UPDATE → succeeds. (Single statement is allowed; the gate checks the resulting row state, not the prior state.)
- [ ] Audit: confirm `activity_logs` row appears for each transition once the implementation pass wires the hybrid log strategy (deferred to implementation).

### 9. Owner can view all reports
- [ ] As `owner@veroxa.test`: `select count(*) from public.weekly_reports` returns 6 (4 A + 2 B).
- [ ] As owner: `select count(*) from public.monthly_reports` returns 6 (4 A + 2 B).
- [ ] As owner: can SELECT `internal_validation_note` and full raw `summary_json` for any row.
- [ ] As owner: `update public.monthly_reports set status='published', published_at=now(), approved_by_user_id=auth.uid()` on an `operator_review` row → succeeds (owner WITH CHECK includes the approval gate, but owner can simultaneously set their own approval).
- [ ] As owner: same update WITHOUT setting `approved_by_user_id` → **denied** by the owner-policy approval gate (owner cannot bypass the rule either — by design).

### 10. Unique constraint per (client, period)
- [ ] `insert into public.weekly_reports (client_id, week_start, week_end) values (<A>, '2026-05-04', '2026-05-10')` (already present in fixtures) → **fails with unique violation** on `(client_id, week_start)`.
- [ ] Same `week_start` for `<B>` → succeeds (different client).
- [ ] Different `week_start` for `<A>` → succeeds.
- [ ] `insert into public.monthly_reports (client_id, month_key) values (<A>, '2026-05')` (already present) → **fails with unique violation**.
- [ ] Same `month_key` for `<B>` → succeeds.
- [ ] Different `month_key` for `<A>` → succeeds.
- [ ] `month_key='2026-13'` → **fails with check constraint violation** (regex `^[0-9]{4}-(0[1-9]|1[0-2])$`).
- [ ] `month_key='26-05'` → **fails** (4-digit year required).

### 11. Cross-tenant isolation
- [ ] As client A: every attempted read of `client_id=<B>` rows in either table or either view → 0 rows.
- [ ] As team@A: SELECT on B's reports → 0 rows (team policy USING includes `can_manage_client_operations` short-circuit but SELECT also goes through `weekly_reports_select_staff` / `monthly_reports_select_staff` which use `can_view_client` — team is NOT assigned to B so both helpers return false).
- [ ] As team@A: any UPDATE on B's reports → 0 rows affected.

### 12. Cascade behavior
- [ ] Delete a `clients` row → cascades to all `weekly_reports` AND `monthly_reports` for that client.
- [ ] Delete a `posts` row referenced by `weekly_reports.top_post_id` → `top_post_id` becomes NULL on the affected report rows; historical reports remain.
- [ ] Delete a `user_profiles` row referenced by `draft_owner_id` / `validation_owner_id` / `approved_by_user_id` → those columns become NULL; the report remains.

### 13. Anon access fully blocked
- [ ] anon SELECT / INSERT / UPDATE / DELETE on `weekly_reports` → denied (all policies `to authenticated`).
- [ ] anon on `monthly_reports` → denied.
- [ ] anon on either view → denied (views inherit RLS via `security_invoker=true` and the underlying base-table policies are `to authenticated`).

### 14. View column conformance
- [ ] `client_portal_weekly_reports_view` columns are exactly: `id, client_id, week_start, week_end, posts_planned, posts_published, top_post_id, client_safe_summary, published_at, client_safe_summary_json`. No others.
- [ ] `client_portal_monthly_reports_view` columns are exactly: `id, client_id, month_key, client_safe_summary, published_at, client_safe_summary_json`. No others.
- [ ] `client_safe_summary_json` on both views equals `summary_json->'client_safe'`; the `internal` subtree of `summary_json` is not reachable through the view at any depth.

### 15. View security_invoker behavior
- [ ] `select relrowsecurity, reloptions from pg_class where relname in ('client_portal_weekly_reports_view','client_portal_monthly_reports_view')` shows `security_invoker=true` in `reloptions`.
- [ ] As client A querying the weekly view: returns only A's published rows even though the view itself has no WHERE clause on `client_id` (the base-table RLS provides the row scoping).
- [ ] As operator querying the weekly view: returns all `published` rows across clients (operator's RLS allows it; the view's `where status='published'` is what narrows down further).

### 16. Helper short-circuits still apply
- [ ] As operator: `can_view_client(<any>)` is true → operator SELECT on both tables sees all rows in all statuses.
- [ ] As team with `team_members.is_active=false`: immediately loses both SELECT and management on next statement.

---

## Rollback expectation

**Strategy: forward-only + pre-cutover snapshot.** Same as M001–M004.

### Rollback drop order (manual reference if dev rollback is ever needed)

Order matters: the views depend on the base tables, so drop the views
first. Otherwise `drop table weekly_reports cascade` would silently
take the view with it, which masks the dependency in any future
restoration attempt.

```text
-- 1. Drop the client-safe views first.
drop view if exists public.client_portal_weekly_reports_view;
drop view if exists public.client_portal_monthly_reports_view;

-- 2. Drop the M005 tables. CASCADE drops each table's policies + indexes.
drop table if exists public.weekly_reports  cascade;
drop table if exists public.monthly_reports cascade;
```

This is for **dev rollback reference only.** Do not execute against
production; restore from snapshot instead.

### Rollback tests
- [ ] Apply M005 to a clean dev project that has M001 + M002 + M003 + M004 → succeeds.
- [ ] Re-apply M005 through the Supabase runner → "already applied".
- [ ] Re-run the raw `.sql` file → fails cleanly with "relation already exists".
- [ ] Snapshot restore: pre-M005 snapshot → apply M005 → restore → schema matches pre-M005 exactly.
- [ ] View-drop ordering: `drop table public.weekly_reports` BEFORE dropping `client_portal_weekly_reports_view` (without CASCADE) → fails with "view ... depends on table ..."; with CASCADE → succeeds but silently drops the view (which is why the documented order drops the view first).

---

## Blocking Issues Before Real Migration

| # | Issue | Severity | Resolution |
|---|---|---|---|
| G1 | `summary_json->'client_safe'` is a contract, not an enforced shape | Low — content discipline | Either (a) leave as-is and rely on writer discipline (current), or (b) add a `before insert/update` trigger validating the presence of the `client_safe` key when `status='published'`. Recommend (a) for M005; revisit if leaks happen. |
| G2 | No auto-draft worker for weekly / monthly rows | NOT a blocker for M005 schema | Out of scope; orchestration is a separate track. Seed covers the demo set; team manually inserts otherwise. |
| G3 | Test plan above is not yet executed | Blocker for promotion | Run on dev project after M004 is green. |
| G4 | Report status transitions not yet wired into `activity_logs` write path | NOT a blocker for M005 schema | Hybrid log strategy (`SUPABASE_RLS_PLAN_V1.md` Part 9) is implemented at the app layer; the schema does not enforce the audit row. Add to the M005 implementation pass. |
| G5 | No AI report generation, no PDF export, no payment reporting | NOT a blocker | All explicitly out of scope; tracked on separate tracks. |
| G6 | `internal_validation_note` is column-on-base; protection relies on the portal always querying the view, never the base table | Low | The base-table RLS policy `weekly_reports_select_own_client` returns only published rows so the column for any returned row is still the staff-authored final note from when validation occurred. Acceptable but worth a portal-layer lint that flags direct `weekly_reports` access. |
| G7 | Approval gate uses WITH CHECK on the operator/owner policies; if a third role-policy is ever added without the gate, it could bypass it | Low | Convention: every policy that permits writes to `monthly_reports` MUST include the `(status <> 'published' OR approved_by_user_id IS NOT NULL)` clause. Add to the M005 implementation review checklist. |
| G8 | M005 draft re-application is not idempotent (no `if not exists` on policies / triggers / views) | NOT a blocker if applied via the runner | Same as M001–M004: apply through `supabase db push`, not by piping raw SQL. |

**Promotion gate:** M004 promoted + green. G3 closed (test plan run on dev). G7 added to implementation review checklist.

---

## Cross-references

- M005 plan: `docs/MIGRATION_005_REPORTING_FOUNDATION_PLAN.md`
- M005 draft (this plan's SQL): `docs/sql_drafts/migrations_review/005_reporting_foundation_draft.sql`
- M005 earlier outline (this file supersedes): `docs/MIGRATION_005_TEST_PLAN_OUTLINE.md`
- M004 draft: `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql`
- M004 test plan: `docs/MIGRATION_004_TEST_PLAN.md`
- M006 plan (next): `docs/MIGRATION_006_CONTENT_AI_LAYER_PLAN.md`
- M006 test outline (next): `docs/MIGRATION_006_TEST_PLAN_OUTLINE.md`
- Schema reference: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- RLS reference: `docs/SUPABASE_RLS_PLAN_V1.md`
- Demo data reference: `docs/DEMO_DATA_MAP.md`
