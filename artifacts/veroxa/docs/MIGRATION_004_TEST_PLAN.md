# Migration 004 — Posting Foundation: Test Plan

**Status:** Planning. Tests not yet executed. `AUTH_MODE` remains
`"placeholder"`. This replaces the earlier
`MIGRATION_004_TEST_PLAN_OUTLINE.md` with concrete fixtures and per-test
pass/fail cells.

## Prerequisites

- [ ] Migration 001 applied and green.
- [ ] Migration 002 applied and green.
- [ ] Migration 003 applied and green.
- [ ] M001 + M002 + M003 fixture set present (5 users, 2 clients,
      team assignments, media_assets).
- [ ] Pre-cutover snapshot taken.

## Scope under test

Tables: `posts`, `post_slots`. FK addition:
`media_assets.linked_post_id → posts(id) on delete set null`. View
stub: `client_portal_calendar_view`.

No new helpers in M004 — reuses M002 helpers (`current_user_client_id`,
`can_view_client`, `can_manage_client_operations`, `is_owner`,
`is_operator`).

## Additional fixtures

**Posts for Restaurant A:**
| Title (internal) | platform_name | content_type | post_status | scheduled_for |
|---|---|---|---|---|
| "Weekend brunch promo" | instagram | photo | `scheduled` | tomorrow 10:00 |
| "Anniversary reel" | instagram | reel | `published` (`published_at`=yesterday) | n/a |
| "Winter menu draft" | facebook | photo | `planning` | n/a |
| "Review needed — taco shot" | instagram | photo | `ready_for_review` | n/a |
| "Promo that broke" | tiktok | reel | `failed` (`publish_failure_reason`="Token expired") | n/a |

**Posts for Restaurant B:**
| Title (internal) | platform_name | content_type | post_status |
|---|---|---|---|
| "B's Tuesday special" | instagram | photo | `scheduled` |
| "B's draft idea" | facebook | photo | `planning` |

**Post slots for Restaurant A:**
- (instagram, tomorrow, 10:00, America/Chicago, `reserved`, reserved_post_id="Weekend brunch promo")
- (instagram, tomorrow, 14:00, America/Chicago, `open`)
- (facebook,  tomorrow, 09:00, America/Chicago, `open`)

**Post slots for Restaurant B:**
- (instagram, tomorrow, 11:00, America/Chicago, `open`)

**Media linkage**: one `media_assets` row for A has its
`linked_post_id` pointed at the "Anniversary reel" post id.

---

## Required tests

### 1. Client calendar visibility — row scoping
- [ ] As `client@veroxa.test` (Restaurant A): `select * from public.posts` returns exactly 2 rows — "Weekend brunch promo" (`scheduled`) and "Anniversary reel" (`published`). Does NOT return the `planning`, `ready_for_review`, or `failed` posts.
- [ ] As `client@veroxa.test`: cannot see any of Restaurant B's posts.
- [ ] As `client@veroxa.test`: `select * from public.post_slots` returns A's 3 slots only.

### 2. Client cannot see draft / concept IDs (view layer)
- [ ] (Deferred to portal-connect pass — view exists) `select column_name from information_schema.columns where table_name='client_portal_calendar_view'` does NOT include `concept_id`, `draft_variant_id`, `approved_by_user_id`, `created_by_user_id`, `publish_failure_reason`, raw `post_status`.
- [ ] (Deferred) `status_label` returns translated values: `scheduled`→"Scheduled", `published`→"Posted", `failed`/`reschedule_required`→"Needs another shot", all in-progress states→"In progress".

### 3. Client cannot see raw publish failure reason
- [ ] As `client@veroxa.test`: cannot see the "Promo that broke" post at base table because of the scheduled/published row filter.
- [ ] (Deferred — view) Even if the view's filter is widened in the future, `publish_failure_reason` is not exposed as a column; only the translated `status_label` "Needs another shot" surfaces.

### 4. Client cannot directly update posts
- [ ] As `client@veroxa.test`: `update public.posts set caption_text='changed' where id=<own post>` → **denied** (no client UPDATE policy).
- [ ] As `client@veroxa.test`: `update public.posts set post_status='approved' where id=<own post>` → **denied**.
- [ ] As `client@veroxa.test`: `delete from public.posts where id=<own post>` → **denied**.
- [ ] As `client@veroxa.test`: `insert into public.posts (client_id, platform_name, content_type) values (<A>, 'instagram', 'photo')` → **denied**.
- [ ] Confirmed expected client path for changes: `insert into public.client_requests (...)` — this still works from M002.

### 5. Team can create posts for assigned clients
- [ ] As `team@veroxa.test` (assigned A, role `executor`): `insert into public.posts (client_id, platform_name, content_type) values (<A>, 'instagram', 'photo')` → succeeds with `post_status='planning'` default.
- [ ] As `team@veroxa.test`: `update public.posts set post_status='approved', approved_by_user_id=auth.uid() where id=<A's planning post>` → succeeds.
- [ ] As `team@veroxa.test`: `update public.posts set caption_text='Try this' where id=<A's planning post>` → succeeds.

### 6. Team cannot create posts for unassigned clients
- [ ] As `team@veroxa.test` (assigned A only): `insert into public.posts (client_id, platform_name, content_type) values (<B>, 'instagram', 'photo')` → **denied** (`with check` fails on `can_manage_client_operations`).
- [ ] As `team@veroxa.test`: `update public.posts set caption_text='...' where id=<B's post>` → 0 rows affected (no SELECT match) OR denied (depending on path).
- [ ] As `team2@veroxa.test` (assigned B with role `reporter`): `insert ... <B>` → **denied** (reporter excluded from `can_manage_client_operations`).
- [ ] As `team2@veroxa.test`: SELECT B's posts → succeeds (reporter can VIEW via `can_view_client`).

### 7. Operator can view / update all posts
- [ ] As `operator@veroxa.test`: `select count(*) from public.posts` returns total (7 in fixtures).
- [ ] As operator: `update public.posts set post_status='approved' where id=<any post>` → succeeds.
- [ ] As operator: `update public.posts set scheduled_for=<...> where id=<any post>` → succeeds.

### 8. Owner full access
- [ ] As `owner@veroxa.test`: SELECT / UPDATE / DELETE on any post → succeeds.
- [ ] As owner: same on any slot → succeeds.

### 9. post_slots unique constraint
- [ ] `insert into public.post_slots (client_id, platform_name, slot_date, slot_time, timezone) values (<A>, 'instagram', '2026-06-01', '10:00', 'America/Chicago')` → succeeds.
- [ ] Same insert repeated → **fails with unique violation**.
- [ ] Same datetime on `'facebook'` → succeeds (different platform).
- [ ] Same datetime for `<B>` → succeeds (different client).
- [ ] Same client/platform/date but different time → succeeds.

### 10. media_assets.linked_post_id FK works only after posts exist
- [ ] Setting `media_assets.linked_post_id` to a non-existent `posts.id` → **fails with FK violation** (`media_assets_linked_post_id_fkey`).
- [ ] Setting to a real `posts.id` → succeeds.
- [ ] Deleting the referenced `posts` row → `media_assets.linked_post_id` becomes NULL.
- [ ] Confirm with `select conname from pg_constraint where conname='media_assets_linked_post_id_fkey'` — exists after M004; did NOT exist after M003 alone.
- [ ] Attempt the same `alter table ... add constraint ...` in a hypothetical M003-only state (without posts) — would fail with "relation posts does not exist". This is why the FK is deferred to M004.

### 11. Scheduled posts do not publish automatically
- [ ] Insert a post with `post_status='scheduled'` and `scheduled_for=<5 minutes ago>` → row lands.
- [ ] Wait any reasonable polling interval (no background worker exists). Confirm: `published_at` remains NULL; `post_status` remains `scheduled`; no Meta/Google/TikTok API endpoints have been contacted (verify via outbound network log on the dev environment — should be empty).
- [ ] Confirm the M004 SQL contains no `pg_cron`, no `pg_net`, no `http` extension call, no Supabase edge function trigger.

### 12. Failed status does not trigger real API
- [ ] Insert a post with `post_status='failed'` and `publish_failure_reason='Token expired'` → row lands.
- [ ] No retry attempt. No notification fan-out (notifications table writes are M005 worker territory). No external API contact.
- [ ] Confirm `update ... set post_status='failed'` on any other post likewise inert.

### 13. Cross-tenant isolation
- [ ] As `client@veroxa.test`: every attempted read/write against any row with `client_id=<B>` → denied or 0 rows.
- [ ] As `team@veroxa.test` (assigned A only): same against `client_id=<B>` for posts and post_slots — denied or 0 rows.

### 14. Cascade behavior
- [ ] Delete a `clients` row → cascades on `posts` AND `post_slots` for that client.
- [ ] Delete a `media_assets` row → `posts.media_asset_id` becomes NULL.
- [ ] Delete a `posts` row → `post_slots.reserved_post_id` for any slot pointing at it becomes NULL (slot reopens but `status` does NOT auto-flip; staff must update).
- [ ] Delete a `posts` row → `media_assets.linked_post_id` for any asset pointing at it becomes NULL.
- [ ] Delete a `user_profiles` row referenced by `posts.created_by_user_id` / `approved_by_user_id` → those columns become NULL.

### 15. Anon access fully blocked
- [ ] anon SELECT / INSERT / UPDATE / DELETE on `posts` → denied (all policies `to authenticated`).
- [ ] anon SELECT / INSERT / UPDATE / DELETE on `post_slots` → denied.

### 16. Helper short-circuits still apply
- [ ] As operator: `can_manage_client_operations(<any client>)` returns true → operator can manage A's and B's posts/slots via `posts_manage_assigned` / `post_slots_manage_assigned` without an explicit operator policy.
- [ ] As `team@veroxa.test` with `team_members.is_active=false` (kill switch): immediately loses post management on next statement.

### 17. Concept / variant placeholders behave as bare uuids
- [ ] Insert a post with `concept_id='<random uuid>'` → succeeds (no FK).
- [ ] Insert a post with `draft_variant_id='<random uuid>'` → succeeds (no FK).
- [ ] Confirm no constraint named `posts_concept_id_fkey` or `posts_draft_variant_id_fkey` exists yet — those land in M006.

### 18. View stub conformance (deferred to portal-connect pass)
- [ ] `client_portal_calendar_view` exists with `security_invoker=true`.
- [ ] View row scoping: as `client@veroxa.test`, `select count(*) from public.client_portal_calendar_view` matches the count of A's `scheduled`+`published` posts.
- [ ] View column list matches the spec exactly (8 columns + nullable `thumbnail_url`).
- [ ] `status_label` translation matches the case statement in the M004 SQL stub.

---

## Rollback expectation

**Strategy: forward-only + pre-cutover snapshot.** Same as M001–M003.

### Rollback drop order (manual reference if dev rollback is ever needed)

Order matters: the FK on `media_assets` references `posts`, so drop
the FK first; otherwise `drop table posts cascade` would silently drop
the `linked_post_id` column data on the media_assets side via cascade.

```text
-- 1. Drop the view if it has shipped (portal-connect pass).
drop view if exists public.client_portal_calendar_view;

-- 2. Drop the FK from media_assets BEFORE dropping posts.
alter table public.media_assets
  drop constraint if exists media_assets_linked_post_id_fkey;

-- 3. Drop the M004 tables. CASCADE drops the policies on each table.
--    post_slots first because it references posts.
drop table if exists public.post_slots cascade;
drop table if exists public.posts      cascade;
```

This is for **dev rollback reference only.** Do not execute against
production; restore from snapshot instead.

### Rollback tests
- [ ] Apply M004 to a clean dev project that has M001 + M002 + M003 → succeeds.
- [ ] Re-apply M004 through the Supabase runner → reports "already applied".
- [ ] Re-run the raw `.sql` file → fails cleanly with "relation already exists".
- [ ] Snapshot restore: snapshot → apply M004 → restore → schema is exactly the pre-M004 state.
- [ ] FK-drop-order test: try `drop table posts` BEFORE dropping the `media_assets_linked_post_id_fkey` constraint → fails with "cannot drop … because other objects depend on it" (without CASCADE) or silently removes the column dependency (with CASCADE). Document the recommended order above as the safe path.

---

### Post deletion slot reset trigger

Tests for the BEFORE DELETE trigger drafted in
`docs/sql_drafts/migrations_review/004_post_slot_reset_guard_draft.sql`.
Prerequisite: the trigger draft has been applied on top of M004 in
the dev project.

Fixture setup: create a post `<P>` on client A scheduled to a slot
`<S>` (status=`reserved`, reserved_post_id=`<P>`); also create an
unrelated slot `<S2>` on client A (status=`reserved`,
reserved_post_id=`<P2>`); and a slot `<S3>` already in status
`scheduled` with reserved_post_id=`<P3>` (publishing history).

- [ ] As `operator@veroxa.test`: `delete from public.posts where id='<P>'` → succeeds; row count 1.
- [ ] After the delete: `select status, reserved_post_id from public.post_slots where id='<S>'` → `status='open'`, `reserved_post_id=NULL`, `updated_at` advanced.
- [ ] After the delete: slot `<S2>` is unchanged (`status='reserved'`, `reserved_post_id='<P2>'`).
- [ ] Delete the post backing slot `<S3>` (`<P3>`): `<S3>.status` stays `scheduled` (intentional — publishing history is preserved); `<S3>.reserved_post_id` becomes NULL via the FK's `on delete set null` action.
- [ ] Bulk delete: `delete from public.posts where client_id='<A>' and post_status='planning'` → every slot that referenced one of those posts and was in `status='reserved'` is now `'open'`.
- [ ] Re-delete an already-deleted post id (no-op) → 0 rows affected, no error.
- [ ] As `client@veroxa.test`: `delete from public.posts where id='<any A post>'` → **denied** by RLS (no client DELETE policy on posts); the trigger never fires.

### Rollback (post slot reset trigger)
- [ ] Drop trigger `posts_before_delete_reset_slot` on `public.posts` and function `private.posts_before_delete_reset_slot()` → succeeds; behavior reverts to the M004 baseline (orphan reserved slots after post deletion — audit issue F4).
- [ ] Re-apply the trigger draft → succeeds; F4 is closed again.
- [ ] During any M004 rollback: confirm the trigger is dropped BEFORE `drop table public.posts`.

---

## Blocking Issues Before Real Migration

| # | Issue | Severity | Resolution |
|---|---|---|---|
| F1 | `client_portal_calendar_view` is a commented stub only | **Closed in draft** | Materialized in `docs/sql_drafts/migrations_review/002_003_004_portal_connect_views_draft.sql` alongside the seven other portal-connect views. Must be applied before the client calendar lights up. |
| F2 | `posts.concept_id` and `posts.draft_variant_id` are bare uuid placeholders | NOT a blocker | FKs added in Migration 006 when `content_concepts` and `draft_variants` exist. |
| F3 | No automatic publishing — `post_status='published'` and `published_at` are manual/system-controlled | NOT a blocker for M004 | M004 is pure schema. Real publishing is M008+. The expectation is documented at both the column comment and the test plan. |
| F4 | Slot deletion cascade does not auto-reset `post_slots.status` when a post is deleted (slot becomes "reserved" status with NULL reserved_post_id) | **Closed in draft** | BEFORE DELETE trigger drafted in `docs/sql_drafts/migrations_review/004_post_slot_reset_guard_draft.sql`. Test cases above. |
| F5 | Test plan above is not yet executed | Blocker for promotion | Run on dev project after M003 is green. |
| F6 | M004 draft re-application is not idempotent (no `if not exists` on policies / triggers / constraints) | NOT a blocker if applied via the runner | Same as M001-M003: apply through `supabase db push`, not by piping raw SQL. |
| F7 | The append-only invariant on `posts` is not enforced — any role with manage permissions can DELETE | Design decision needed | Decide: allow staff to delete posts (current draft) OR replace `posts_manage_assigned` with separate `for select`/`for insert`/`for update` policies. Recommended: leave as-is — deletions are needed during the planning state; archival is the better long-term pattern (`post_status='archived'`). |
| F8 | Real-time worker decisions (who writes `published_at`? where does scheduling happen?) are not addressed by M004 | NOT a M004 schema concern | Tracked in `docs/SOCIAL_PUBLISHING_PLAN.md`. |

**Promotion gate:** M003 promoted + green. F5 closed (test plan run on dev). F7 decision recorded. F1 must resolve before the client calendar lights up but does NOT block M004 SQL promotion to staging.

---

## Cross-references

- M004 plan: `docs/MIGRATION_004_POSTING_FOUNDATION_PLAN.md`
- M004 draft (this plan's SQL): `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql`
- M004 earlier outline (this file supersedes): `docs/MIGRATION_004_TEST_PLAN_OUTLINE.md`
- M003 draft: `docs/sql_drafts/migrations_review/003_media_foundation_draft.sql`
- M003 test plan: `docs/MIGRATION_003_TEST_PLAN.md`
- M002 draft: `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- Publishing track: `docs/SOCIAL_PUBLISHING_PLAN.md`
