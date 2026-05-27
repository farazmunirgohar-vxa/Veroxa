-- =============================================================================
-- M004 Dev Test — Step 2: Seed Dev Data
--
-- ⚠ REPLACE PLACEHOLDERS BEFORE RUNNING
--   Search for << and >> and replace each placeholder with a real UUID
--   from the dev project's auth.users table:
--
--   <<OWNER_UUID>>    — the owner user's auth.uid()
--   <<OPERATOR_UUID>> — the operator user's auth.uid()
--   <<TEAM_UUID>>     — team@veroxa.test user's auth.uid()
--   <<TEAM2_UUID>>    — team2@veroxa.test user's auth.uid()
--   <<CLIENT_UUID>>   — client@veroxa.test user's auth.uid()
--   <<CLIENT_B_UUID>> — clientb@veroxa.test user's auth.uid()
--
-- All other UUIDs are fixed. Do not change them.
--
-- Run as postgres (superuser) in the Supabase SQL editor.
-- Expected result: "Success. No rows returned." after each block.
--
-- This seed builds on M001–M003 fixtures:
--   * CLIENT_A_ID  = a0000000-0000-4000-a000-00000000000a (from M002)
--   * CLIENT_B_ID  = b0000000-0000-4000-b000-00000000000b (from M002)
--   * TEAM2_ID     = 12222222-2222-4222-a222-222222222222 (from M002 team_members row)
--   * MEDIA_A3     = a000000a-0003-4000-a000-00000000000a (approved media asset for A, from M003)
-- =============================================================================

-- =============================================================================
-- Fixed UUIDs (do not randomise)
-- =============================================================================
-- POST_A1  a4000001-0000-4000-a000-000000000001  Weekend brunch promo (scheduled)
-- POST_A2  a4000001-0000-4000-a000-000000000002  Anniversary reel (published)
-- POST_A3  a4000001-0000-4000-a000-000000000003  Winter menu draft (planning)
-- POST_A4  a4000001-0000-4000-a000-000000000004  Review needed — taco shot (ready_for_review)
-- POST_A5  a4000001-0000-4000-a000-000000000005  Promo that broke (failed)
-- POST_B1  b4000001-0000-4000-b000-000000000001  B's Tuesday special (scheduled)
-- POST_B2  b4000001-0000-4000-b000-000000000002  B's draft idea (planning)
-- SLOT_A1  a4000002-0000-4000-a000-000000000001  A instagram tomorrow 10:00 reserved→POST_A1
-- SLOT_A2  a4000002-0000-4000-a000-000000000002  A instagram tomorrow 14:00 open
-- SLOT_A3  a4000002-0000-4000-a000-000000000003  A facebook  tomorrow 09:00 open
-- SLOT_B1  b4000002-0000-4000-b000-000000000001  B instagram tomorrow 11:00 open

-- =============================================================================
-- 1. posts — Restaurant A (5 rows)
-- =============================================================================

insert into public.posts
  (id, client_id, platform_name, content_type, title, post_status,
   scheduled_for, created_by_user_id)
values
  -- 1a. Weekend brunch promo — scheduled, has a slot
  ('a4000001-0000-4000-a000-000000000001',
   'a0000000-0000-4000-a000-00000000000a',
   'instagram', 'photo', 'Weekend brunch promo', 'scheduled',
   (current_date + 1)::timestamptz + interval '10 hours',
   '<<TEAM_UUID>>'),

  -- 1b. Anniversary reel — published yesterday (linked media_asset set below)
  ('a4000001-0000-4000-a000-000000000002',
   'a0000000-0000-4000-a000-00000000000a',
   'instagram', 'reel', 'Anniversary reel', 'published',
   null,
   '<<TEAM_UUID>>'),

  -- 1c. Winter menu draft — internal planning state (clients must NOT see)
  ('a4000001-0000-4000-a000-000000000003',
   'a0000000-0000-4000-a000-00000000000a',
   'facebook', 'photo', 'Winter menu draft', 'planning',
   null,
   '<<TEAM_UUID>>'),

  -- 1d. Review needed — taco shot — internal state (clients must NOT see)
  ('a4000001-0000-4000-a000-000000000004',
   'a0000000-0000-4000-a000-00000000000a',
   'instagram', 'photo', 'Review needed — taco shot', 'ready_for_review',
   null,
   '<<TEAM_UUID>>'),

  -- 1e. Promo that broke — failed (clients must NOT see; internal reason stored)
  ('a4000001-0000-4000-a000-000000000005',
   'a0000000-0000-4000-a000-00000000000a',
   'tiktok', 'reel', 'Promo that broke', 'failed',
   null,
   '<<OPERATOR_UUID>>')
;

-- Set published_at for the anniversary reel (yesterday)
update public.posts
set published_at = (current_date - 1)::timestamptz + interval '18 hours'
where id = 'a4000001-0000-4000-a000-000000000002';

-- Set publish_failure_reason for the failed promo
update public.posts
set publish_failure_reason = 'Token expired'
where id = 'a4000001-0000-4000-a000-000000000005';

-- Confirm 5 A posts
select count(*) as a_post_count from public.posts
where client_id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 5


-- =============================================================================
-- 2. posts — Restaurant B (2 rows)
-- =============================================================================

insert into public.posts
  (id, client_id, platform_name, content_type, title, post_status,
   scheduled_for, created_by_user_id)
values
  ('b4000001-0000-4000-b000-000000000001',
   'b0000000-0000-4000-b000-00000000000b',
   'instagram', 'photo', "B's Tuesday special", 'scheduled',
   (current_date + 1)::timestamptz + interval '11 hours',
   '<<OPERATOR_UUID>>'),

  ('b4000001-0000-4000-b000-000000000002',
   'b0000000-0000-4000-b000-00000000000b',
   'facebook', 'photo', "B's draft idea", 'planning',
   null,
   '<<OPERATOR_UUID>>')
;

-- Confirm 2 B posts
select count(*) as b_post_count from public.posts
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 2


-- =============================================================================
-- 3. media_assets linkage — link MEDIA_A3 to POST_A2
-- =============================================================================
-- This tests the deferred FK from M004. MEDIA_A3 is the approved media_asset
-- for Restaurant A (seeded in M003).

update public.media_assets
set linked_post_id = 'a4000001-0000-4000-a000-000000000002'
where id = 'a000000a-0003-4000-a000-00000000000a';

-- Verify the link
select id, linked_post_id from public.media_assets
where id = 'a000000a-0003-4000-a000-00000000000a';
-- EXPECTED: 1 row; linked_post_id = a4000001-0000-4000-a000-000000000002


-- =============================================================================
-- 4. post_slots — Restaurant A (3 rows)
-- =============================================================================

insert into public.post_slots
  (id, client_id, platform_name, slot_date, slot_time, timezone, status, reserved_post_id)
values
  -- SLOT_A1 reserved against POST_A1
  ('a4000002-0000-4000-a000-000000000001',
   'a0000000-0000-4000-a000-00000000000a',
   'instagram', current_date + 1, '10:00', 'America/Chicago',
   'reserved', 'a4000001-0000-4000-a000-000000000001'),

  -- SLOT_A2 open
  ('a4000002-0000-4000-a000-000000000002',
   'a0000000-0000-4000-a000-00000000000a',
   'instagram', current_date + 1, '14:00', 'America/Chicago',
   'open', null),

  -- SLOT_A3 open
  ('a4000002-0000-4000-a000-000000000003',
   'a0000000-0000-4000-a000-00000000000a',
   'facebook', current_date + 1, '09:00', 'America/Chicago',
   'open', null)
;

-- Confirm 3 A slots
select count(*) as a_slot_count from public.post_slots
where client_id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 3


-- =============================================================================
-- 5. post_slots — Restaurant B (1 row)
-- =============================================================================

insert into public.post_slots
  (id, client_id, platform_name, slot_date, slot_time, timezone, status, reserved_post_id)
values
  ('b4000002-0000-4000-b000-000000000001',
   'b0000000-0000-4000-b000-00000000000b',
   'instagram', current_date + 1, '11:00', 'America/Chicago',
   'open', null)
;

-- Confirm 1 B slot
select count(*) as b_slot_count from public.post_slots
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 1


-- =============================================================================
-- 6. Overall fixture summary
-- =============================================================================

select 'posts' as tbl, count(*) from public.posts
union all
select 'post_slots', count(*) from public.post_slots;
-- EXPECTED: posts=7, post_slots=4
