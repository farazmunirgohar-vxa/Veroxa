-- =============================================================================
-- M004 Dev Test — Step 3: Test Queries (Posting Foundation)
--
-- Run AFTER: 01_apply_m004.sql, 01b_apply_post_slot_reset_guard.sql,
--            02_seed_m004_dev_data.sql (with UUIDs replaced).
--
-- Run each numbered block SEPARATELY in the Supabase SQL editor.
-- Every per-user block wraps in a transaction ending in ROLLBACK.
-- Confirm "ROLLBACK" in the result banner before proceeding.
--
-- Placeholders to replace with real auth.uid() values:
--   <<OWNER_UUID>>     <<OPERATOR_UUID>>
--   <<TEAM_UUID>>      <<TEAM2_UUID>>
--   <<CLIENT_UUID>>    <<CLIENT_B_UUID>>
--
-- Fixed UUIDs (do not change):
--   POST_A1  a4000001-0000-4000-a000-000000000001   (scheduled)
--   POST_A2  a4000001-0000-4000-a000-000000000002   (published)
--   POST_A3  a4000001-0000-4000-a000-000000000003   (planning)
--   POST_A4  a4000001-0000-4000-a000-000000000004   (ready_for_review)
--   POST_A5  a4000001-0000-4000-a000-000000000005   (failed)
--   POST_B1  b4000001-0000-4000-b000-000000000001   (scheduled)
--   POST_B2  b4000001-0000-4000-b000-000000000002   (planning)
--   SLOT_A1  a4000002-0000-4000-a000-000000000001   (reserved→POST_A1)
--   SLOT_A2  a4000002-0000-4000-a000-000000000002   (open)
--   SLOT_A3  a4000002-0000-4000-a000-000000000003   (open)
--   SLOT_B1  b4000002-0000-4000-b000-000000000001   (open)
--   CLIENT_A a0000000-0000-4000-a000-00000000000a
--   CLIENT_B b0000000-0000-4000-b000-00000000000b
-- =============================================================================


-- =============================================================================
-- TEST 1 — Client calendar visibility (row scoping)
--
-- ⚠ PREDICTED FAILURE on Test 1a — M004 SOURCE-DRAFT DEFECT (see README).
-- `posts_select_staff` uses `can_view_client(client_id)` without a status
-- filter. Since client@A matches can_view_client for their own client,
-- they see ALL 5 posts, not just 2 (scheduled+published).
-- Plan-intended: 2. Predicted actual: 5.
-- Record actual and mark FAIL if ≠ 2; continue the run.
-- =============================================================================

-- 1a. client@A sees only scheduled + published posts (plan intent = 2)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select id, title, post_status from public.posts
where client_id = 'a0000000-0000-4000-a000-00000000000a'
order by post_status;
-- PLAN-INTENDED: 2 rows — POST_A1 (scheduled) + POST_A2 (published)
-- PREDICTED ACTUAL: 5 rows — all A posts via posts_select_staff

select count(*) as client_post_count from public.posts;
-- PLAN-INTENDED: 2
-- PREDICTED ACTUAL: 5
rollback;

-- 1b. client@A cannot see any B posts
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select count(*) as client_b_count from public.posts
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0
rollback;

-- 1c. client@A sees all 3 of A's post_slots
-- Note: count passes (3) via either own-client or staff policy, but client
-- access via posts_select_staff is a policy-design defect even if count matches.
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select count(*) as slot_count from public.post_slots;
-- EXPECTED: 3 (A's slots only)
rollback;


-- =============================================================================
-- TEST 2 — Client cannot see draft / concept IDs (view layer — deferred)
-- =============================================================================

-- 2a. Check client_portal_calendar_view is NOT yet materialized in this dev
-- project (view creation is deferred to the portal-connect pass).
select count(*) as view_exists
from information_schema.views
where table_name = 'client_portal_calendar_view'
  and table_schema = 'public';
-- EXPECTED: 0 (view not yet created — confirms M004 stub remains commented)


-- =============================================================================
-- TEST 3 — Client cannot see raw publish failure reason
-- =============================================================================

-- 3a. client@A cannot see POST_A5 (failed) from base table
-- NOTE: if Test 1a predicated failure is confirmed (client sees all A posts
-- via posts_select_staff), this check will ALSO fail (client WILL see POST_A5).
-- Record as additional evidence of the posts_select_staff defect.
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select id, post_status, publish_failure_reason from public.posts
where id = 'a4000001-0000-4000-a000-000000000005';
-- PLAN-INTENDED: 0 rows (RLS filters out failed post)
-- PREDICTED ACTUAL (if defect confirmed): 1 row with publish_failure_reason visible
rollback;


-- =============================================================================
-- TEST 4 — Client cannot directly update posts
-- =============================================================================

-- 4a. client UPDATE caption_text → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.posts set caption_text = 'client_changed'
where id = 'a4000001-0000-4000-a000-000000000001';
-- EXPECTED: 0 rows (no client UPDATE policy)
rollback;

-- 4b. client UPDATE post_status → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.posts set post_status = 'approved'
where id = 'a4000001-0000-4000-a000-000000000001';
-- EXPECTED: 0 rows
rollback;

-- 4c. client DELETE → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
delete from public.posts where id = 'a4000001-0000-4000-a000-000000000001';
-- EXPECTED: 0 rows
rollback;

-- 4d. client INSERT → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.posts (client_id, platform_name, content_type)
values ('a0000000-0000-4000-a000-00000000000a', 'instagram', 'photo');
-- EXPECTED: ERROR — RLS violation (no client INSERT policy)
rollback;


-- =============================================================================
-- TEST 5 — Team can create posts for assigned clients
-- =============================================================================

-- 5a. team@A INSERT → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
insert into public.posts (client_id, platform_name, content_type, title)
values ('a0000000-0000-4000-a000-00000000000a', 'instagram', 'photo', 'Team test insert');
-- EXPECTED: 1 row inserted, post_status='planning' (default)
rollback;

-- 5b. team UPDATE post_status → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.posts set post_status = 'approved'
where id = 'a4000001-0000-4000-a000-000000000003';
-- EXPECTED: 1 row updated
rollback;

-- 5c. team UPDATE caption_text → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.posts set caption_text = 'Team caption test'
where id = 'a4000001-0000-4000-a000-000000000003';
-- EXPECTED: 1 row updated
rollback;


-- =============================================================================
-- TEST 6 — Team cannot create posts for unassigned clients
-- =============================================================================

-- 6a. team@A INSERT for B → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
insert into public.posts (client_id, platform_name, content_type)
values ('b0000000-0000-4000-b000-00000000000b', 'instagram', 'photo');
-- EXPECTED: ERROR — with check fails (can_manage_client_operations returns false for B)
rollback;

-- 6b. team@A UPDATE B's post → 0 rows (no SELECT match)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.posts set caption_text = 'nope'
where id = 'b4000001-0000-4000-b000-000000000001';
-- EXPECTED: 0 rows affected
rollback;

-- 6c. team2 (reporter on B) INSERT → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM2_UUID>>","role":"authenticated"}';
insert into public.posts (client_id, platform_name, content_type)
values ('b0000000-0000-4000-b000-00000000000b', 'instagram', 'photo');
-- EXPECTED: ERROR — reporter excluded from can_manage_client_operations
rollback;

-- 6d. team2 SELECT B's posts → succeeds (reporter CAN view)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM2_UUID>>","role":"authenticated"}';
select count(*) as team2_b_count from public.posts
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 2 (both B posts visible via can_view_client — reporter can view)
rollback;


-- =============================================================================
-- TEST 7 — Operator can view / update all posts
-- =============================================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select count(*) as total_posts from public.posts;
-- EXPECTED: 7

update public.posts set post_status = 'approved'
where id = 'a4000001-0000-4000-a000-000000000003';
-- EXPECTED: 1 row updated

update public.posts set scheduled_for = (current_date + 2)::timestamptz
where id = 'a4000001-0000-4000-a000-000000000001';
-- EXPECTED: 1 row updated

rollback;


-- =============================================================================
-- TEST 8 — Owner full access
-- =============================================================================

-- 8a. owner SELECT/UPDATE posts
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
select count(*) from public.posts;
-- EXPECTED: 7

update public.posts set caption_text = 'owner override'
where id = 'b4000001-0000-4000-b000-000000000001';
-- EXPECTED: 1 row

delete from public.posts where id = 'b4000001-0000-4000-b000-000000000002';
-- EXPECTED: 1 row (B's planning draft deleted; slot reset trigger won't fire — no reserved slot against it)

rollback;

-- 8b. owner SELECT/UPDATE post_slots
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
select count(*) from public.post_slots;
-- EXPECTED: 4

update public.post_slots set timezone = 'America/Chicago'
where id = 'a4000002-0000-4000-a000-000000000001';
-- EXPECTED: 1 row

rollback;


-- =============================================================================
-- TEST 9 — post_slots unique constraint
-- =============================================================================

-- 9a. first insert on an unused slot → succeeds
begin;
insert into public.post_slots
  (client_id, platform_name, slot_date, slot_time, timezone)
values
  ('a0000000-0000-4000-a000-00000000000a',
   'instagram', current_date + 2, '10:00', 'America/Chicago');
-- EXPECTED: 1 row inserted
rollback;

-- 9b. exact duplicate → fails with unique violation
begin;
insert into public.post_slots
  (client_id, platform_name, slot_date, slot_time, timezone)
values
  ('a0000000-0000-4000-a000-00000000000a',
   'instagram', current_date + 1, '10:00', 'America/Chicago');
-- EXPECTED: ERROR — unique constraint (client_id, platform_name, slot_date, slot_time)
rollback;

-- 9c. same datetime different platform → succeeds
begin;
insert into public.post_slots
  (client_id, platform_name, slot_date, slot_time, timezone)
values
  ('a0000000-0000-4000-a000-00000000000a',
   'facebook', current_date + 1, '10:00', 'America/Chicago');
-- EXPECTED: 1 row inserted
rollback;

-- 9d. same datetime different client → succeeds
begin;
insert into public.post_slots
  (client_id, platform_name, slot_date, slot_time, timezone)
values
  ('b0000000-0000-4000-b000-00000000000b',
   'instagram', current_date + 1, '10:00', 'America/Chicago');
-- EXPECTED: 1 row inserted
rollback;

-- 9e. same client/platform/date, different time → succeeds
begin;
insert into public.post_slots
  (client_id, platform_name, slot_date, slot_time, timezone)
values
  ('a0000000-0000-4000-a000-00000000000a',
   'instagram', current_date + 1, '16:00', 'America/Chicago');
-- EXPECTED: 1 row inserted
rollback;


-- =============================================================================
-- TEST 10 — media_assets.linked_post_id FK
-- =============================================================================

-- 10a. FK to non-existent post → fails
begin;
update public.media_assets
set linked_post_id = gen_random_uuid()
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR — FK violation (media_assets_linked_post_id_fkey)
rollback;

-- 10b. FK to real post → succeeds
begin;
update public.media_assets
set linked_post_id = 'a4000001-0000-4000-a000-000000000001'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: 1 row updated
rollback;

-- 10c. FK constraint exists
select conname from pg_constraint
where conname = 'media_assets_linked_post_id_fkey';
-- EXPECTED: 1 row

-- 10d. Delete referenced post → linked_post_id becomes NULL (on delete set null)
begin;
-- Link MEDIA_A1 → POST_A3 (planning, safe to test delete)
update public.media_assets
set linked_post_id = 'a4000001-0000-4000-a000-000000000003'
where id = 'a000000a-0001-4000-a000-00000000000a';

delete from public.posts where id = 'a4000001-0000-4000-a000-000000000003';

select linked_post_id from public.media_assets
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: linked_post_id = NULL (set null cascade)
rollback;


-- =============================================================================
-- TEST 11 — Scheduled posts do not publish automatically
-- =============================================================================

begin;
insert into public.posts
  (client_id, platform_name, content_type, post_status, scheduled_for)
values
  ('a0000000-0000-4000-a000-00000000000a',
   'instagram', 'photo', 'scheduled',
   now() - interval '5 minutes');
-- EXPECTED: 1 row inserted

-- Immediately re-read — published_at should still be NULL
select post_status, published_at from public.posts
where post_status = 'scheduled'
  and scheduled_for < now()
  and published_at is null;
-- EXPECTED: at least 1 row (the just-inserted one); no auto-publishing happened

rollback;

-- No pg_cron / pg_net / http extension in M004 draft:
select extname from pg_extension where extname in ('pg_cron','pg_net','http');
-- EXPECTED: 0 rows


-- =============================================================================
-- TEST 12 — Failed status does not trigger real API
-- =============================================================================

begin;
insert into public.posts
  (client_id, platform_name, content_type, post_status, publish_failure_reason)
values
  ('a0000000-0000-4000-a000-00000000000a',
   'tiktok', 'reel', 'failed', 'Simulated failure token error');
-- EXPECTED: 1 row; no side effects, no notification writes, no external API contact

update public.posts set post_status = 'failed', publish_failure_reason = 'Another failure'
where id = 'a4000001-0000-4000-a000-000000000001';
-- EXPECTED: 1 row; still no side effects
rollback;


-- =============================================================================
-- TEST 13 — Cross-tenant isolation
-- =============================================================================

-- 13a. client@A cannot read B's posts or slots
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select count(*) from public.posts where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0

select count(*) from public.post_slots where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0
rollback;

-- 13b. team@A cannot read or write B's posts/slots
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
select count(*) from public.posts where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0 (team@A not assigned to B)

select count(*) from public.post_slots where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0
rollback;


-- =============================================================================
-- TEST 14 — Cascade behavior
-- =============================================================================

-- 14a. delete a clients row cascades to posts + post_slots (run inside rollback)
begin;
-- First confirm counts
select count(*) as a_posts from public.posts
where client_id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 5

select count(*) as a_slots from public.post_slots
where client_id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 3

delete from public.clients where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row deleted

select count(*) as a_posts_after from public.posts
where client_id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 0 (cascade)

select count(*) as a_slots_after from public.post_slots
where client_id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 0 (cascade)

rollback;

-- 14b. delete a media_assets row → posts.media_asset_id becomes NULL
begin;
-- Seed POST_A2 has media_asset_id pointing to MEDIA_A3 via the approved asset
-- Confirm the link exists
select id, media_asset_id from public.posts
where id = 'a4000001-0000-4000-a000-000000000002';

-- Delete the media asset
delete from public.media_assets where id = 'a000000a-0003-4000-a000-00000000000a';
-- EXPECTED: 1 row

-- Confirm media_asset_id became NULL
select id, media_asset_id from public.posts
where id = 'a4000001-0000-4000-a000-000000000002';
-- EXPECTED: media_asset_id = NULL

rollback;

-- 14c. delete a posts row → post_slots.reserved_post_id becomes NULL
-- (slot reset guard fires and also flips status='reserved' → 'open')
begin;
delete from public.posts where id = 'a4000001-0000-4000-a000-000000000001';
-- EXPECTED: 1 row deleted; trigger fires

select id, status, reserved_post_id from public.post_slots
where id = 'a4000002-0000-4000-a000-000000000001';
-- EXPECTED: status='open', reserved_post_id=NULL (trigger reset it)

rollback;

-- 14d. delete a posts row → media_assets.linked_post_id becomes NULL
begin;
delete from public.posts where id = 'a4000001-0000-4000-a000-000000000002';
-- EXPECTED: 1 row deleted

select linked_post_id from public.media_assets
where id = 'a000000a-0003-4000-a000-00000000000a';
-- EXPECTED: NULL (on delete set null from FK)

rollback;

-- 14e. delete user_profiles → created_by_user_id/approved_by_user_id become NULL
-- (tested conceptually — skipped here to avoid disrupting M001 fixtures)
-- Reference: posts table has `on delete set null` on both user ref columns.
select count(*) as nullsafe_user_fk from pg_constraint
where conname in ('posts_created_by_user_id_fkey','posts_approved_by_user_id_fkey');
-- EXPECTED: 2 (both constraints exist)


-- =============================================================================
-- TEST 15 — Anon access fully blocked
-- =============================================================================

begin;
set local role anon;
select count(*) from public.posts;
-- EXPECTED: 0 rows (all policies are `to authenticated` only)
rollback;

begin;
set local role anon;
select count(*) from public.post_slots;
-- EXPECTED: 0 rows
rollback;

begin;
set local role anon;
insert into public.posts (client_id, platform_name, content_type)
values ('a0000000-0000-4000-a000-00000000000a', 'instagram', 'photo');
-- EXPECTED: ERROR — permission denied
rollback;


-- =============================================================================
-- TEST 16 — Helper short-circuits still apply
-- =============================================================================

-- 16a. operator can manage both clients' posts via can_manage_client_operations
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.posts set post_status = 'approved'
where id = 'a4000001-0000-4000-a000-000000000003';
-- EXPECTED: 1 row (operator short-circuits via is_operator())

update public.posts set post_status = 'approved'
where id = 'b4000001-0000-4000-b000-000000000002';
-- EXPECTED: 1 row
rollback;

-- 16b. is_active=false kill switch (conceptual; skip to avoid fixture mutation)
-- Conceptual: set team_members.is_active=false for team@A's row → team loses
-- management on next statement because is_assigned_to_client() re-checks is_active.
-- Reference: same kill-switch tested in M002 Test 17c.


-- =============================================================================
-- TEST 17 — Concept / variant placeholders behave as bare UUIDs
-- =============================================================================

begin;
insert into public.posts
  (client_id, platform_name, content_type,
   concept_id, draft_variant_id)
values
  ('a0000000-0000-4000-a000-00000000000a',
   'instagram', 'photo',
   gen_random_uuid(), gen_random_uuid());
-- EXPECTED: 1 row inserted — no FK constraint on either column yet

rollback;

-- No FK named posts_concept_id_fkey or posts_draft_variant_id_fkey
select conname from pg_constraint
where conname in ('posts_concept_id_fkey','posts_draft_variant_id_fkey');
-- EXPECTED: 0 rows (FKs are added in M006)


-- =============================================================================
-- TEST 18 — View stub conformance (deferred to portal-connect pass)
-- =============================================================================

-- 18a. view does NOT exist yet (M004 draft keeps it commented out)
select count(*) as view_count
from information_schema.views
where table_schema = 'public'
  and table_name = 'client_portal_calendar_view';
-- EXPECTED: 0

-- 18b. posts table + indexes exist
select indexname from pg_indexes
where tablename = 'posts'
order by indexname;
-- EXPECTED: posts_client_id_idx, posts_media_asset_id_idx, posts_platform_name_idx,
--           posts_post_status_idx, posts_published_at_idx, posts_scheduled_for_idx
--           (+ pkey index)

select indexname from pg_indexes
where tablename = 'post_slots'
order by indexname;
-- EXPECTED: post_slots_client_id_idx, post_slots_platform_name_idx,
--           post_slots_reserved_post_id_idx, post_slots_slot_date_idx,
--           post_slots_status_idx
--           (+ pkey index + unique constraint index)


-- =============================================================================
-- POST DELETION SLOT RESET TRIGGER TESTS
-- =============================================================================

-- Guard-T1. delete reserved-status slot post → slot resets to open
begin;
delete from public.posts where id = 'a4000001-0000-4000-a000-000000000001';
-- EXPECTED: 1 row; trigger fires

select status, reserved_post_id from public.post_slots
where id = 'a4000002-0000-4000-a000-000000000001';
-- EXPECTED: status='open', reserved_post_id=NULL
rollback;

-- Guard-T2. unrelated slot is unchanged after sibling post delete
begin;
-- Set SLOT_A2 as reserved against a temp post (not POST_A1)
insert into public.posts (id, client_id, platform_name, content_type)
values ('aaaabbbb-0000-4000-a000-000000000099',
        'a0000000-0000-4000-a000-00000000000a', 'facebook', 'photo');

update public.post_slots set status='reserved',
  reserved_post_id='aaaabbbb-0000-4000-a000-000000000099'
where id = 'a4000002-0000-4000-a000-000000000002';

-- Now delete POST_A1 (not the temp post)
delete from public.posts where id = 'a4000001-0000-4000-a000-000000000001';

-- SLOT_A1 (reserved→POST_A1) should reset
select id, status, reserved_post_id from public.post_slots
where id = 'a4000002-0000-4000-a000-000000000001';
-- EXPECTED: status='open', reserved_post_id=NULL

-- SLOT_A2 (reserved→temp post) must remain unchanged
select id, status, reserved_post_id from public.post_slots
where id = 'a4000002-0000-4000-a000-000000000002';
-- EXPECTED: status='reserved', reserved_post_id='aaaabbbb-0000-4000-a000-000000000099'

rollback;

-- Guard-T3. slot in 'scheduled' status is NOT reset (publishing history preserved)
begin;
-- Promote SLOT_A1 to 'scheduled' first (simulating a scheduled booking)
update public.post_slots
set status = 'scheduled', reserved_post_id = 'a4000001-0000-4000-a000-000000000001'
where id = 'a4000002-0000-4000-a000-000000000001';

-- Delete POST_A1
delete from public.posts where id = 'a4000001-0000-4000-a000-000000000001';

-- Slot should remain 'scheduled'; reserved_post_id becomes NULL via FK set null
-- but status does NOT flip to 'open' (trigger only resets 'reserved' status)
select status, reserved_post_id from public.post_slots
where id = 'a4000002-0000-4000-a000-000000000001';
-- EXPECTED: status='scheduled', reserved_post_id=NULL

rollback;

-- Guard-T4. bulk delete — all reserved slots for deleted posts reset
begin;
-- Insert two planning posts and reserve slots against them
insert into public.posts (id, client_id, platform_name, content_type, post_status)
values
  ('aaaa0001-0000-4000-a000-000000000099', 'a0000000-0000-4000-a000-00000000000a', 'instagram', 'photo', 'planning'),
  ('aaaa0002-0000-4000-a000-000000000099', 'a0000000-0000-4000-a000-00000000000a', 'facebook',  'photo', 'planning');

update public.post_slots set status='reserved', reserved_post_id='aaaa0001-0000-4000-a000-000000000099'
where id = 'a4000002-0000-4000-a000-000000000002';

update public.post_slots set status='reserved', reserved_post_id='aaaa0002-0000-4000-a000-000000000099'
where id = 'a4000002-0000-4000-a000-000000000003';

-- Bulk delete all planning posts for A
delete from public.posts
where client_id = 'a0000000-0000-4000-a000-00000000000a'
  and post_status = 'planning';

select id, status, reserved_post_id from public.post_slots
where id in ('a4000002-0000-4000-a000-000000000002',
             'a4000002-0000-4000-a000-000000000003');
-- EXPECTED: both rows status='open', reserved_post_id=NULL

rollback;

-- Guard-T5. re-delete non-existent post → no-op, no error
delete from public.posts where id = 'a4000001-0000-4000-a000-000000000099';
-- EXPECTED: 0 rows affected, no error

-- Guard-T6. client cannot delete posts → trigger never fires
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
delete from public.posts where id = 'a4000001-0000-4000-a000-000000000001';
-- EXPECTED: 0 rows (RLS blocks delete; trigger does not fire)
rollback;

-- Verify SLOT_A1 still has its reservation after client's blocked delete
select status, reserved_post_id from public.post_slots
where id = 'a4000002-0000-4000-a000-000000000001';
-- EXPECTED: status='reserved', reserved_post_id='a4000001-0000-4000-a000-000000000001'

-- Guard-T7. trigger exists with correct configuration
select trigger_name, event_manipulation, action_timing, action_orientation
from information_schema.triggers
where trigger_name = 'posts_before_delete_reset_slot'
  and event_object_table = 'posts';
-- EXPECTED: 1 row, DELETE, BEFORE, ROW
