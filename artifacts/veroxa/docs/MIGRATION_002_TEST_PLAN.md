> **Historical reference (pre-2026-05-27).** Pricing and fixture-ID values in this document are out of date. Current source of truth: `docs/PRICING_SOURCE_OF_TRUTH.md` and `src/data/pricing/veroxaPricing.ts`. Fixture IDs are now `demo-a` / `demo-b` / `demo-c` / `demo-d`.

---

# Migration 002 — Client Foundation: Test Plan

**Status:** Planning document. Migration 002 itself is a draft at
`docs/sql_drafts/migrations_review/002_client_foundation_draft.sql` and
has **not** been applied to any database. This plan lists the manual /
future-automated checks that must pass before the draft is promoted to
`supabase/migrations/` and run.

`AUTH_MODE` remains `"placeholder"`. None of these tests need to be
executed yet.

---

## Prerequisites

- [ ] **Migration 001 must already be applied successfully** to the
      target database. The M001 test plan must be fully green.
- [ ] The dev project has the M001 fixture users from
      `docs/MIGRATION_001_TEST_PLAN.md` (owner, operator, team,
      client, inactive) created.
- [ ] A pre-cutover snapshot has been taken.

## Scope under test

Tables: `clients`, `team_client_assignments`, `client_platforms`,
`onboarding_items`, `client_requests`.

FK addition: `user_profiles.client_id → clients(id) on delete set null`.

Helpers (`private` schema): `is_assigned_to_client`, `can_view_client`,
`can_manage_client_operations`, `can_manage_pricing`.

Trigger: `private.clients_pricing_write_guard` (owner-only writes to
`monthly_fee_cents`, `plan_type`, `service_package`, `contract_months`,
`start_date`, `assigned_operator_id`).

## Test fixtures (extending the M001 set)

Two clients:

| `business_name` | `service_package` | `plan_type` | `monthly_fee_cents` |
|---|---|---|---|
| Demo Restaurant A | `complete_online_presence` | `twelve_month` | `99700` |
| Demo Restaurant B | `google_presence_starter` | `month_to_month` | `49700` |

User wiring:
- `client@veroxa.test` → `user_profiles.client_id = Demo Restaurant A`
- `team@veroxa.test` → `team_members` row → `team_client_assignments(client=A, assignment_role='executor', is_active=true)`
- A second team user `team2@veroxa.test` → assigned to **B only**, `assignment_role='reporter'`
- `operator@veroxa.test` → no assignment row needed
- `owner@veroxa.test` → no assignment row needed

A handful of `client_platforms`, `onboarding_items`, and
`client_requests` rows for both clients, including:
- A `client_platforms` row for A with `notes='internal handoff'` (used by view-hiding test).
- An `onboarding_items` row for A with `owner_role='client'` (client-editable) and another with `owner_role='operator'` (not client-editable).

---

## Required tests

### 1. FK enforcement on `user_profiles.client_id`
- [ ] As owner, set `user_profiles.client_id = <non-existent uuid>` for a user → fails with FK violation.
- [ ] Set to a real `clients.id` → succeeds.
- [ ] Delete the referenced `clients` row → `user_profiles.client_id` for that user becomes NULL (`on delete set null`).

### 2. Pricing-as-cents and locked pricing values
- [ ] Inserting a client with `monthly_fee_cents=49700` and `service_package='google_presence_starter'` succeeds.
- [ ] Same for COP at 99700 / 109700 / 119700 / 149700.
- [ ] Demo seed values match the locked pricing table; spot-check one row per package/plan combination.

### 3. service_package vs plan_type
- [ ] Inserting `service_package='google_presence_starter'` with any `plan_type` value from the check list → succeeds.
- [ ] Inserting `plan_type='google_presence_starter'` → fails the `plan_type` check constraint (GPS is a package, not a plan_type).
- [ ] Inserting `service_package='twelve_month'` → fails the `service_package` check constraint.

### 4. Client sees only own client-safe data
- [ ] As `client@veroxa.test`: `select * from public.clients` returns exactly 1 row (Restaurant A).
- [ ] Same: `select * from public.clients where id = <Restaurant B id>` returns 0 rows.
- [ ] After the M003 views ship: `select monthly_fee_cents from public.client_portal_clients_view` returns 0 rows or fails with "column does not exist" — `monthly_fee_cents` is hidden.

### 5. Client cannot see `monthly_fee_cents` through the client portal view
- [ ] (Deferred to M003 — once views are created.) `select column_name from information_schema.columns where table_name='client_portal_clients_view'` does NOT include `monthly_fee_cents`, `plan_type`, `service_package`, `contract_months`, `start_date`, `assigned_operator_id`, `assigned_team_label`, `content_health_status`, `risk_status`.

### 6. Team sees only assigned clients
- [ ] As `team@veroxa.test`: `select * from public.clients` returns exactly 1 row (Restaurant A).
- [ ] As `team2@veroxa.test`: `select * from public.clients` returns exactly 1 row (Restaurant B).
- [ ] As either: `select * from public.clients where id = <the other restaurant>` returns 0 rows.

### 7. Inactive team assignment blocks access on next statement
- [ ] As owner: `update public.team_client_assignments set is_active=false where team_member_id=<team@veroxa.test> and client_id=<A>` → succeeds.
- [ ] Immediately as `team@veroxa.test`: `select * from public.clients` returns 0 rows (no caching).
- [ ] As owner, flip `is_active=true` back; team user sees Restaurant A again on next statement.
- [ ] As owner: deactivate the underlying `team_members.is_active=false` (with assignment still active) → team user also loses visibility (helper requires BOTH active).

### 8. Operator sees all clients
- [ ] As `operator@veroxa.test`: `select count(*) from public.clients` returns 2.
- [ ] As `owner@veroxa.test`: same.

### 9. Pricing-write guard — operator denied
- [ ] As operator: `update public.clients set monthly_fee_cents=99800 where id=<A>` → **denied** (`monthly_fee_cents changes are restricted to owner`).
- [ ] As operator: `update public.clients set plan_type='six_month' where id=<A>` → denied.
- [ ] As operator: `update public.clients set service_package='complete_online_presence' where id=<B>` → denied.
- [ ] As operator: `update public.clients set contract_months=12 where id=<A>` → denied.
- [ ] As operator: `update public.clients set start_date='2025-01-01' where id=<A>` → denied.
- [ ] As operator: `update public.clients set assigned_operator_id=<another_user> where id=<A>` → denied.

### 10. Operator can change operational fields
- [ ] As operator: `update public.clients set account_status='active' where id=<A>` → succeeds.
- [ ] As operator: `update public.clients set content_health_status='at_risk' where id=<A>` → succeeds.
- [ ] As operator: `update public.clients set risk_status='watch' where id=<A>` → succeeds.
- [ ] As operator: `update public.clients set posting_frequency_weekly=4 where id=<A>` → succeeds.
- [ ] As operator: `update public.clients set assigned_team_label='Team Blue' where id=<A>` → succeeds.

### 11. Owner can change pricing
- [ ] As owner: `update public.clients set monthly_fee_cents=99800 where id=<A>` → succeeds.
- [ ] As owner: `update public.clients set plan_type='six_month' where id=<A>` → succeeds.
- [ ] As owner: `update public.clients set service_package='complete_online_presence' where id=<B>` (re-package change) → succeeds.
- [ ] As owner: `update public.clients set assigned_operator_id=<another_user> where id=<A>` → succeeds.

### 12. `team_client_assignments` unique constraint
- [ ] Insert (`team_member_id=X`, `client_id=A`) → succeeds.
- [ ] Insert (`team_member_id=X`, `client_id=A`) again → fails with unique violation.
- [ ] Insert (`team_member_id=X`, `client_id=B`) → succeeds (same member, different client OK).
- [ ] Insert (`team_member_id=Y`, `client_id=A`) → succeeds (different member, same client OK).

### 13. Client request creation — own client only
- [ ] As `client@veroxa.test`: `insert into public.client_requests (client_id, request_type, title) values (<A>, 'content_change', 'Update menu')` → succeeds.
- [ ] As `client@veroxa.test`: same insert but `client_id=<B>` → **denied** (RLS `with check` fails).

### 14. Client request select scoping
- [ ] As `client@veroxa.test`: `select * from public.client_requests` returns only requests where `client_id=<A>`.
- [ ] As `team@veroxa.test` (assigned to A): same scoping.
- [ ] As `team2@veroxa.test` (assigned to B): sees only B's requests.
- [ ] As operator / owner: sees all.

### 15. Onboarding item ownership rules
- [ ] As `client@veroxa.test`: `update public.onboarding_items set status='complete' where id=<A's client-owned item>` → succeeds.
- [ ] As `client@veroxa.test`: same update but on `id=<A's operator-owned item>` → **denied** (`owner_role='client'` filter in policy).
- [ ] As `client@veroxa.test`: same update on `id=<B's client-owned item>` → **denied** (cross-tenant).
- [ ] As team (assigned to A): can update both client-owned and operator-owned items on A.

### 16. `client_platforms` internal notes hidden from client-safe view
- [ ] (Deferred to M003 — once view ships.) `select * from public.client_portal_platforms_view where client_id=<A>` returns the row but the `notes` column is absent.
- [ ] Direct base-table read by client (after the M003 revoke lands): `select notes from public.client_platforms` → permission denied.
- [ ] In M002 only: confirm the base-table policy `client_platforms_select_own_client` permits the row (column-hiding is the view's job, RLS handles row-scoping).

### 17. Helper semantics
- [ ] `private.is_assigned_to_client(<A>)` as `team@veroxa.test` → `true`.
- [ ] Same as `team2@veroxa.test` (not assigned to A) → `false`.
- [ ] Same as operator → `true` (short-circuit).
- [ ] Same as owner → `true` (short-circuit).
- [ ] Same as `client@veroxa.test` → `false` (clients are not "assigned").
- [ ] Same as anon → `false`, no exception.
- [ ] `private.can_view_client(<A>)` as `client@veroxa.test` (own client) → `true`.
- [ ] Same as `client@veroxa.test` but `<B>` → `false`.
- [ ] `private.can_manage_client_operations(<A>)` as team with `assignment_role='executor'` → `true`.
- [ ] Same but with `assignment_role='reporter'` → `false` (reporter excluded from manage).
- [ ] `private.can_manage_pricing()` returns `true` only for owner.

### 18. Helper inactive-user behavior
- [ ] Set `user_profiles.is_active=false` on the operator user; immediately `private.is_operator()` returns `false`, `private.can_view_client(<A>)` returns `false`, all operator visibility is gone on the next statement.
- [ ] Re-activate; powers restored on next statement.

### 19. Helper EXECUTE grants
- [ ] `anon` cannot execute any of the four new helpers.
- [ ] `authenticated` can execute all four.
- [ ] `service_role` can execute all four.

### 20. Anon access is fully blocked
- [ ] anon `select * from public.clients` → 0 rows / permission denied.
- [ ] anon `select * from public.team_client_assignments` → 0 rows / permission denied.
- [ ] anon `select * from public.client_platforms` → 0 rows / permission denied.
- [ ] anon `select * from public.onboarding_items` → 0 rows / permission denied.
- [ ] anon `select * from public.client_requests` → 0 rows / permission denied.
- [ ] anon insert into any of the five tables → denied.

### 21. Cross-tenant isolation matrix
For each of the four scoped tables (`client_platforms`, `onboarding_items`, `client_requests`, `clients`):
- [ ] As `client@veroxa.test`, all read/write attempts against rows belonging to Restaurant B fail with row-not-found or RLS denial.
- [ ] As `team@veroxa.test` (assigned A only), same — no read or write on Restaurant B rows.

### 22. Cascade behavior
- [ ] Delete a `clients` row → cascades delete on `team_client_assignments`, `client_platforms`, `onboarding_items`, `client_requests` for that client.
- [ ] Delete a `clients` row → nulls `user_profiles.client_id` for any user that referenced it.
- [ ] Delete a `team_members` row → cascades delete on `team_client_assignments` for that member.
- [ ] Delete a `user_profiles` row referenced by `client_requests.requested_by_user_id` → sets that column NULL (`on delete set null`).
- [ ] Delete a `user_profiles` row referenced by `clients.assigned_operator_id` → sets that column NULL.

---

## Rollback expectation

**Strategy: forward-only + pre-cutover snapshot**, same as M001.

If a rollback is required:
- Dev: drop policies → drop triggers → drop helpers → drop tables in reverse-dependency order (`client_requests`, `onboarding_items`, `client_platforms`, `team_client_assignments`, then drop the `user_profiles_client_id_fkey` constraint, then drop `clients`). Then restore from the pre-cutover snapshot.
- Production: do not improvise. Restore from snapshot / PITR via the Supabase dashboard.

### Rollback drop order (manual reference if dev rollback is ever needed)

```text
-- policies first (drop on each table) then triggers, then helpers, then tables:
drop trigger if exists clients_pricing_write_guard_trg on public.clients;
drop function if exists private.clients_pricing_write_guard();
drop function if exists private.can_manage_pricing();
drop function if exists private.can_manage_client_operations(uuid);
drop function if exists private.can_view_client(uuid);
drop function if exists private.is_assigned_to_client(uuid);
drop table   if exists public.client_requests;
drop table   if exists public.onboarding_items;
drop table   if exists public.client_platforms;
drop table   if exists public.team_client_assignments;
alter table  public.user_profiles drop constraint if exists user_profiles_client_id_fkey;
drop table   if exists public.clients;
```

This is for **dev rollback reference only.** Do not execute against
production; restore from snapshot instead.

### Rollback tests

- [ ] Apply M002 to a clean dev project that already has M001 → succeeds.
- [ ] Re-apply M002 through the Supabase runner → reports "already applied", does not re-execute.
- [ ] Re-run the raw `.sql` file → fails cleanly with "relation already exists"; does not leave partial state.
- [ ] Snapshot restore: snapshot → apply M002 → restore → schema is exactly the pre-M002 state.

---

## Blocking Issues Before Real Migration

| # | Issue | Severity | Resolution |
|---|---|---|---|
| C1 | Client-safe views are commented stubs only; real `CREATE VIEW` is deferred to M003 | NOT a blocker for M002 itself | Land Migration 003 (Client Portal Read Layer) before the client portal connects to Supabase. Until then, the client base-table SELECT policies expose all columns to client-role users — acceptable because no client user can sign in (`AUTH_MODE='placeholder'`). |
| C2 | Onboarding-item / client-request column-level write restrictions for clients are not enforced at the DB | Low | The RLS policies permit the row write; the portal mutation layer must restrict which columns/values the client can flip. Document this expectation; add a follow-up server-side trigger in M003+ if defense-in-depth is wanted. |
| C3 | M002 cannot apply before M001 | Hard prerequisite | Supabase migration runner enforces order via filename. Just confirm filenames sort correctly when promoted. |
| C4 | Test plan above is not yet executed | Blocker for promotion | Run against a clean dev project after M001 is green. |
| C5 | M002 draft re-application is not idempotent (no `if not exists` on policies / triggers / constraints) | NOT a blocker if applied via the runner | Same as M001 — apply through `supabase db push`, not by piping. |
| C6 | The eventual revoke-base-table-from-`authenticated` step (forcing the portal through views) is deferred to M003 | NOT a blocker | Documented as a commented note at the end of the M002 SQL. |

**Promotion gate:** C3 enforced by runner, C4 green, M001 already promoted, M001 Blocking Issue B2 (auth.users → user_profiles bootstrap) has a landing date. C1 must be resolved before the client portal connects to Supabase but does NOT block M002 promotion to staging.

---

## Cross-references

- M001 draft: `docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql`
- M001 test plan: `docs/MIGRATION_001_TEST_PLAN.md`
- M002 draft (this plan covers): `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- M002 blueprint plan: `docs/MIGRATION_002_CLIENT_FOUNDATION_PLAN.md`
- Schema source of truth: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- RLS source of truth: `docs/SUPABASE_RLS_PLAN_V1.md`
