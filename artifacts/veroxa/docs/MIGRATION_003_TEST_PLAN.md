# Migration 003 — Media Foundation: Test Plan

**Status:** Planning. Tests not yet executed. `AUTH_MODE` remains
`"placeholder"`.

## Prerequisites

- [ ] Migration 001 applied and green.
- [ ] Migration 002 applied and green.
- [ ] M001 + M002 fixture set present (5 users + 2 clients + assignments).
- [ ] Pre-cutover snapshot taken.

## Scope under test

Tables: `media_assets`, `notifications`, `client_health_snapshots`, `activity_logs`.

No new helpers in M003 — reuses M002 helpers.

## Additional fixtures

- 3 `media_assets` rows for Restaurant A: one `uploaded` from client, one `team_review_pending` from team, one `approved` from team (with `internal_note`, `rejection_reason='blurry — request retake'`, `quality_score=2`).
- 2 `media_assets` rows for Restaurant B.
- 4 `notifications`: 1 `target_role='client'` for A, 1 `target_role='team'` for A, 1 `target_role='operator'` for A, 1 `target_role='client'` for B.
- 2 `client_health_snapshots`: one for A (`level='attention'`, `priority_level='high'`), one for B (`level='healthy'`).
- 3 `activity_logs`: one `entity_type='media_assets'` for A, one `entity_type='clients'` `action_key='pricing_changed'` for A (staff-only entity_type), one for B.

---

## Required tests

### 1. media_assets — client own-write rules
- [ ] As `client@veroxa.test`: `insert into public.media_assets (client_id, file_url, file_type, mime_type) values (<A>, '...', 'image', 'image/png')` → succeeds; row lands with `source_type='client_upload'`, `review_status='uploaded'` (defaults).
- [ ] As `client@veroxa.test`: insert with `client_id=<B>` → **denied**.
- [ ] As `client@veroxa.test`: insert with `source_type='team_upload'` → **denied** (`with check` pins source_type).
- [ ] As `client@veroxa.test`: insert with `review_status='approved'` → **denied** (`with check` pins review_status).
- [ ] As `client@veroxa.test`: insert with `source_type='legacy_reuse'` → **denied**.

### 2. media_assets — client read scoping
- [ ] As `client@veroxa.test`: `select * from public.media_assets` returns only `client_id=<A>` rows.
- [ ] As `client@veroxa.test`: `select * from public.media_assets where client_id=<B>` returns 0 rows.

### 3. media_assets — client cannot edit staff fields
- [ ] As `client@veroxa.test`: `update public.media_assets set review_status='approved' where id=<own row>` → **denied** (no client UPDATE policy).
- [ ] Same for `internal_note`, `quality_score`, `quality_ai_flag`, `rejection_reason` — all denied because UPDATE itself is denied.

### 4. media_assets — internal fields hidden from client portal view (deferred to portal-connect pass)
- [ ] (Deferred) `select column_name from information_schema.columns where table_name='client_portal_media_view'` does NOT include `internal_note`, `rejection_reason`, `quality_score`, `quality_ai_flag`, `source_type`, `linked_post_id`.
- [ ] (Deferred) `review_status_label` translates the 11 internal statuses into the 8 client-safe labels per the view stub.

### 5. media_assets — team can review assigned, not unassigned
- [ ] As `team@veroxa.test` (assigned A): `update public.media_assets set review_status='approved', internal_note='looks good' where id=<A row>` → succeeds.
- [ ] As `team@veroxa.test`: same update on `id=<B row>` → **denied** (not assigned to B).
- [ ] As `team2@veroxa.test` (assigned B, `reporter` role): `update ... where id=<B row>` → **denied** (reporter excluded from `can_manage_client_operations`).

### 6. media_assets — operator / owner full operational access
- [ ] As operator: SELECT all media → succeeds.
- [ ] As operator: UPDATE `review_status` on any row → succeeds (operator is included in `can_manage_client_operations` via short-circuit).
- [ ] As owner: SELECT / UPDATE / DELETE any row → succeeds.

### 7. notifications — client scoping
- [ ] As `client@veroxa.test`: `select * from public.notifications` returns the 1 `client/A` row only.
- [ ] As `client@veroxa.test`: cannot see the `team/A`, `operator/A`, or `client/B` rows.

### 8. notifications — client status flip
- [ ] As `client@veroxa.test`: `update public.notifications set status='seen' where id=<own client notification>` → succeeds.
- [ ] Same with `status='dismissed'` → succeeds.
- [ ] As `client@veroxa.test`: same UPDATE on a `client/B` notification → 0 rows affected (RLS hides the row).
- [ ] Column-level restriction ("client can only flip status, not title/message_body") is a portal-mutation-layer concern; document this as a follow-up trigger if defense-in-depth is wanted.

### 9. notifications — team scoping
- [ ] As `team@veroxa.test` (assigned A): SELECT returns the `team/A` and `operator/A` rows (assigned + role in team/operator). Does NOT return the `client/A` row.
- [ ] As `team@veroxa.test`: cannot see B's rows.

### 10. notifications — operator / owner SELECT all
- [ ] As operator: count of `notifications` = total (4 in fixtures).
- [ ] As owner: same.

### 11. client_health_snapshots — system insert + client visibility
- [ ] As service role: `insert into public.client_health_snapshots (client_id, level) values (<A>, 'attention')` → succeeds.
- [ ] As `client@veroxa.test`: `select level, summary from public.client_health_snapshots where client_id=<A>` → returns rows.
- [ ] (Deferred — portal pass) `client_portal_health_view` shows only `level, content_runway_days, summary` and hides `priority_level`, the internal counts, and `created_by_role`.

### 12. client_health_snapshots — append-only
- [ ] As any role: `update public.client_health_snapshots set level='healthy' where id=<row>` → **denied** (no UPDATE policy).
- [ ] As owner: same → also denied (owner_all is `for all`, but the `with check` would pass; the actual block is that no UPDATE was permitted by the absence of a relevant policy — verify behavior).
  - Note: `for all` includes UPDATE. If owner_all permits owner updates, the append-only guarantee is owner-trusted only. Document this: append-only is enforced against non-owners by RLS; owner is trusted to know not to update.

### 13. activity_logs — client has no access
- [ ] As `client@veroxa.test`: `select * from public.activity_logs` returns 0 rows.
- [ ] As `client@veroxa.test`: `insert into public.activity_logs ...` → **denied** (no client INSERT policy).

### 14. activity_logs — team allowlisted entity_types only
- [ ] As `team@veroxa.test` (assigned A): SELECT returns the `entity_type='media_assets'` row for A only.
- [ ] As `team@veroxa.test`: does NOT return the `entity_type='clients' action_key='pricing_changed'` row (entity_type not in team allowlist).
- [ ] As `team@veroxa.test`: does NOT return any rows for B.

### 15. activity_logs — operator / owner SELECT all
- [ ] As operator: SELECT returns all rows including the pricing-change row.
- [ ] As owner: same.

### 16. activity_logs — immutability
- [ ] As any role including owner via the `for all` policy: `update public.activity_logs set description='edited' where id=<row>` → fails (`for all` permits the action but the table is intended append-only). Document the current state: owner CAN update via owner_all. If true immutability is wanted, replace `owner_all` with explicit `for select` + `for insert` owner policies.
  - Decision deferred to audit: this is a design choice between "owner trusted" and "owner restricted". The plan reflects "append-only by absence of non-owner UPDATE/DELETE policies".

### 17. activity_logs — operator/owner manual insert
- [ ] As operator: `insert into public.activity_logs (entity_type, action_key, performed_by_role) values ('clients', 'note_added', 'operator')` → succeeds.
- [ ] As client / team: same → **denied**.

### 18. Cascade behavior
- [ ] Delete a `clients` row → cascades on all four M003 tables for that client (the `client_id` FK is `on delete cascade` everywhere).
- [ ] Delete a `user_profiles` row → `media_assets.uploaded_by_user_id`, `notifications.target_user_id`, `activity_logs.performed_by_user_id` all flip to NULL.

### 19. Cross-tenant probe
- [ ] As `client@veroxa.test`, every attempted read/insert/update against any of the 4 M003 tables with `client_id=<B>` → denied or 0 rows.
- [ ] As `team@veroxa.test` (assigned A only), same against `client_id=<B>` → denied or 0 rows.

### 20. Anon access
- [ ] anon SELECT / INSERT / UPDATE / DELETE against any M003 table → denied (all policies are `to authenticated`).

---

## Rollback expectation

**Strategy: forward-only + pre-cutover snapshot**, same pattern as M001 + M002.

### Rollback drop order (manual reference if dev rollback is ever needed)

```text
-- (Drop policies via DROP TABLE CASCADE below; explicit DROP POLICY
-- not needed because tables are dropped in full.)
drop table if exists public.activity_logs            cascade;
drop table if exists public.client_health_snapshots  cascade;
drop table if exists public.notifications            cascade;
drop table if exists public.media_assets             cascade;
```

If the portal-connect view pass has already shipped, also:
```text
drop view if exists public.client_portal_media_view;
drop view if exists public.client_portal_notifications_view;
drop view if exists public.client_portal_health_view;
```

### Rollback tests
- [ ] Apply M003 to a clean dev project that has M001 + M002 → succeeds.
- [ ] Re-apply M003 through the Supabase runner → "already applied".
- [ ] Re-run raw `.sql` → fails cleanly with "relation already exists".
- [ ] Snapshot restore: pre-M003 snapshot → apply → restore → state matches.

---

## Blocking Issues Before Real Migration

| # | Issue | Severity | Resolution |
|---|---|---|---|
| D1 | Client-safe views (`client_portal_media_view`, `client_portal_notifications_view`, `client_portal_health_view`) are commented stubs | Blocker for client portal connecting to Supabase; not for M003 promotion to staging | Materialize in the portal-connect pass. Until then, base-table client SELECT exposes all columns to client-role users — acceptable while `AUTH_MODE='placeholder'`. |
| D2 | `media_assets.linked_post_id` has no FK in M003 | NOT a blocker | FK added in M004 once `posts` exists. |
| D3 | `notifications` client UPDATE policy permits the row write; column-level restriction (only `status` to `seen`/`dismissed`) relies on the portal mutation layer | Low | Add a BEFORE UPDATE trigger in M005+ if defense-in-depth is wanted. |
| D4 | `activity_logs` and `client_health_snapshots` are append-only by convention only against non-owner; `owner_all` policy permits owner UPDATE/DELETE | Low — design choice | Decide: keep "owner trusted" (current draft) OR replace `owner_all` with explicit `for select` + `for insert` owner policies. Document the decision. |
| D5 | Team allowlist on `activity_logs` is permissive (4 entity_types) | NOT a blocker | Tighten in later migrations as the entity_type space grows. |
| D6 | Test plan not yet executed | Blocker for promotion | Run on dev project after M002 is green. |
| D7 | Tests 4, 11 (view tests) are marked "deferred to portal-connect pass" | NOT a blocker for M003 — they're tests for the portal-connect pass | Re-run when views ship. |

**Promotion gate:** M002 promoted + green, D6 green, D4 decision recorded. D1 must resolve before client portal connects to Supabase.

---

## Cross-references

- M003 draft: `docs/sql_drafts/migrations_review/003_media_foundation_draft.sql`
- M003 plan: `docs/MIGRATION_003_MEDIA_FOUNDATION_PLAN.md`
- M002 draft: `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- M002 test plan: `docs/MIGRATION_002_TEST_PLAN.md`
