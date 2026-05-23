-- =============================================================================
-- 004_seed_posts_and_slots.sql
-- Veroxa — Draft seed: post_slots and posts tables
-- DRAFT ONLY — do not apply to a live database without review
-- Source: src/lib/demo-data/posts.ts
-- Depends on: 001, 002, 003 seed files
--
-- Order of operations:
--   1. INSERT post_slots (post_id = NULL — forward ref to posts)
--   2. INSERT posts      (referencing media_asset_id and post_slot_id)
--   3. UPDATE post_slots SET post_id = ... (resolve forward ref)
--   4. UPDATE media_assets SET used_in_post_id = ... (resolve circular ref from 003)
--
-- draft_variant_id is NULL for all posts in this draft.
-- Draft variants will be seeded in a future file (005_seed_draft_variants.sql).
-- The FK column is nullable in the posts table by design.
--
-- UUID ranges:
--   post_slots: 00000000-0000-0000-0004-000000000001 → 000000000008
--   posts:      00000000-0000-0000-0005-000000000001 → 000000000007
-- =============================================================================

-- ── Step 1: Insert post_slots (post_id deferred) ──────────────────────────────

INSERT INTO post_slots (
  id,
  client_id,
  platform_name,
  slot_date,
  slot_time,
  status,
  post_id,    -- NULL for now; resolved in Step 3 below
  created_at,
  updated_at
) VALUES
('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000001', 'instagram',      '2026-05-26', '17:00', 'scheduled', NULL, '2026-05-01T08:00:00Z', '2026-05-22T11:00:00Z'),
('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000001', 'facebook',       '2026-05-28', '18:00', 'scheduled', NULL, '2026-05-01T08:00:00Z', '2026-05-22T11:00:00Z'),
('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0000-000000000001', 'instagram',      '2026-05-30', '17:00', 'reserved',  NULL, '2026-05-01T08:00:00Z', '2026-05-22T09:15:00Z'),
('00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0000-000000000001', 'instagram',      '2026-05-17', '17:00', 'completed', NULL, '2026-05-01T08:00:00Z', '2026-05-17T17:01:22Z'),
('00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0000-000000000001', 'facebook',       '2026-05-18', '18:00', 'completed', NULL, '2026-05-01T08:00:00Z', '2026-05-18T18:01:05Z'),
('00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0000-000000000001', 'instagram',      '2026-05-19', '17:00', 'completed', NULL, '2026-05-01T08:00:00Z', '2026-05-19T17:00:58Z'),
('00000000-0000-0000-0004-000000000007', '00000000-0000-0000-0000-000000000001', 'instagram',      '2026-05-20', '17:00', 'completed', NULL, '2026-05-01T08:00:00Z', '2026-05-20T17:01:11Z'),
('00000000-0000-0000-0004-000000000008', '00000000-0000-0000-0000-000000000001', 'instagram',      '2026-06-01', '17:00', 'open',      NULL, '2026-05-01T08:00:00Z', '2026-05-01T08:00:00Z');

-- ── Step 2: Insert posts ───────────────────────────────────────────────────────
-- draft_variant_id is NULL for all rows.
-- Draft variants (draft-variant-001-A etc.) will be added in a future seed file
-- once content_concepts and draft_sets are seeded. The FK is nullable.

INSERT INTO posts (
  id,
  client_id,
  platform_name,
  media_asset_id,
  draft_variant_id,  -- NULL: draft variants not yet seeded (see note above)
  post_slot_id,
  status,
  scheduled_at,
  published_at,
  failed_at,
  failure_reason,
  locked_at,
  created_at,
  updated_at
) VALUES

-- post-mamadali-001 — Lamb shoulder, Instagram, scheduled
(
  '00000000-0000-0000-0005-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'instagram',
  '00000000-0000-0000-0003-000000000001',  -- media-mamadali-001
  NULL,  -- draft-variant-001-A; seeded in future draft variant file
  '00000000-0000-0000-0004-000000000001',  -- slot-mamadali-001
  'scheduled',
  '2026-05-26T17:00:00Z',
  NULL, NULL, NULL, NULL,
  '2026-05-20T10:30:00Z',
  '2026-05-22T11:00:00Z'
),

-- post-mamadali-002 — Family feast promo, Facebook, scheduled
(
  '00000000-0000-0000-0005-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'facebook',
  '00000000-0000-0000-0003-000000000002',  -- media-mamadali-002
  NULL,  -- draft-variant-002-B; seeded in future draft variant file
  '00000000-0000-0000-0004-000000000002',  -- slot-mamadali-002
  'scheduled',
  '2026-05-28T18:00:00Z',
  NULL, NULL, NULL, NULL,
  '2026-05-21T11:00:00Z',
  '2026-05-22T11:00:00Z'
),

-- post-mamadali-003 — Kitchen BTS reel, Instagram, ready_for_review
(
  '00000000-0000-0000-0005-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'instagram',
  '00000000-0000-0000-0003-000000000003',  -- media-mamadali-003
  NULL,  -- no draft variant assigned yet in source data
  '00000000-0000-0000-0004-000000000003',  -- slot-mamadali-003
  'ready_for_review',
  '2026-05-30T17:00:00Z',
  NULL, NULL, NULL, NULL,
  '2026-05-22T09:15:00Z',
  '2026-05-22T09:15:00Z'
),

-- post-mamadali-004 — Mixed grill platter, Instagram, published + locked
(
  '00000000-0000-0000-0005-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'instagram',
  '00000000-0000-0000-0003-000000000004',  -- media-mamadali-004
  NULL,  -- draft-variant-004-A; seeded in future draft variant file
  '00000000-0000-0000-0004-000000000004',  -- slot-mamadali-004
  'published',
  '2026-05-17T17:00:00Z',
  '2026-05-17T17:01:22Z',
  NULL, NULL,
  '2026-05-17T17:01:22Z',
  '2026-05-14T10:00:00Z',
  '2026-05-17T17:01:22Z'
),

-- post-mamadali-005 — Google review highlight, Facebook, published + locked
(
  '00000000-0000-0000-0005-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'facebook',
  '00000000-0000-0000-0003-000000000005',  -- media-mamadali-005
  NULL,  -- draft-variant-005-A; seeded in future draft variant file
  '00000000-0000-0000-0004-000000000005',  -- slot-mamadali-005
  'published',
  '2026-05-18T18:00:00Z',
  '2026-05-18T18:01:05Z',
  NULL, NULL,
  '2026-05-18T18:01:05Z',
  '2026-05-15T09:00:00Z',
  '2026-05-18T18:01:05Z'
),

-- post-mamadali-006 — Opening hours graphic, Instagram, published + locked
(
  '00000000-0000-0000-0005-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'instagram',
  '00000000-0000-0000-0003-000000000006',  -- media-mamadali-006
  NULL,  -- draft-variant-006-A; seeded in future draft variant file
  '00000000-0000-0000-0004-000000000006',  -- slot-mamadali-006
  'published',
  '2026-05-19T17:00:00Z',
  '2026-05-19T17:00:58Z',
  NULL, NULL,
  '2026-05-19T17:00:58Z',
  '2026-05-16T10:30:00Z',
  '2026-05-19T17:00:58Z'
),

-- post-mamadali-007 — Prep day BTS, Instagram, published + locked
(
  '00000000-0000-0000-0005-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'instagram',
  '00000000-0000-0000-0003-000000000007',  -- media-mamadali-007
  NULL,  -- draft-variant-007-A; seeded in future draft variant file
  '00000000-0000-0000-0004-000000000007',  -- slot-mamadali-007
  'published',
  '2026-05-20T17:00:00Z',
  '2026-05-20T17:01:11Z',
  NULL, NULL,
  '2026-05-20T17:01:11Z',
  '2026-05-17T09:00:00Z',
  '2026-05-20T17:01:11Z'
);

-- ── Step 3: Resolve post_slots → posts forward references ──────────────────────

UPDATE post_slots SET post_id = '00000000-0000-0000-0005-000000000001' WHERE id = '00000000-0000-0000-0004-000000000001';
UPDATE post_slots SET post_id = '00000000-0000-0000-0005-000000000002' WHERE id = '00000000-0000-0000-0004-000000000002';
UPDATE post_slots SET post_id = '00000000-0000-0000-0005-000000000003' WHERE id = '00000000-0000-0000-0004-000000000003';
UPDATE post_slots SET post_id = '00000000-0000-0000-0005-000000000004' WHERE id = '00000000-0000-0000-0004-000000000004';
UPDATE post_slots SET post_id = '00000000-0000-0000-0005-000000000005' WHERE id = '00000000-0000-0000-0004-000000000005';
UPDATE post_slots SET post_id = '00000000-0000-0000-0005-000000000006' WHERE id = '00000000-0000-0000-0004-000000000006';
UPDATE post_slots SET post_id = '00000000-0000-0000-0005-000000000007' WHERE id = '00000000-0000-0000-0004-000000000007';
-- slot-mamadali-008 (open, no post assigned) remains post_id = NULL

-- ── Step 4: Resolve media_assets → posts used_in_post_id references ───────────
-- These were left NULL in 003_seed_media_assets.sql to avoid the circular dep.

UPDATE media_assets SET used_in_post_id = '00000000-0000-0000-0005-000000000001' WHERE id = '00000000-0000-0000-0003-000000000001';
UPDATE media_assets SET used_in_post_id = '00000000-0000-0000-0005-000000000002' WHERE id = '00000000-0000-0000-0003-000000000002';
UPDATE media_assets SET used_in_post_id = '00000000-0000-0000-0005-000000000003' WHERE id = '00000000-0000-0000-0003-000000000003';
UPDATE media_assets SET used_in_post_id = '00000000-0000-0000-0005-000000000004' WHERE id = '00000000-0000-0000-0003-000000000004';
UPDATE media_assets SET used_in_post_id = '00000000-0000-0000-0005-000000000005' WHERE id = '00000000-0000-0000-0003-000000000005';
UPDATE media_assets SET used_in_post_id = '00000000-0000-0000-0005-000000000006' WHERE id = '00000000-0000-0000-0003-000000000006';
UPDATE media_assets SET used_in_post_id = '00000000-0000-0000-0005-000000000007' WHERE id = '00000000-0000-0000-0003-000000000007';
-- media 008, 009, 010 have no post assignment; used_in_post_id stays NULL
