-- =============================================================================
-- 003_seed_media_assets.sql
-- Veroxa — Draft seed: media_assets table
-- DRAFT ONLY — do not apply to a live database without review
-- Source: src/lib/demo-data/mediaAssets.ts
-- Depends on: 001_seed_clients.sql
--
-- IMPORTANT: used_in_post_id is intentionally NULL here to avoid circular
-- dependency with posts (which don't exist yet at this point in seeding).
-- After 004_seed_posts_and_slots.sql runs, UPDATE statements at the bottom
-- of 004 will set used_in_post_id on the relevant rows.
--
-- UUID range: 00000000-0000-0000-0003-000000000001 → 000000000010
-- =============================================================================

INSERT INTO media_assets (
  id,
  client_id,
  file_type,
  source_type,
  storage_url,
  thumbnail_url,
  ai_quality_flag,
  ai_quality_notes,
  review_status,
  reviewed_by_user_id,  -- auth.users FK not yet wired; stored as plain UUID text until Phase 6
  reviewed_at,
  used_in_post_id,      -- NULL here; set by UPDATE block in 004_seed_posts_and_slots.sql
  created_at,
  updated_at
) VALUES

-- media-mamadali-001 — Lamb shoulder hero shot (approved, used in post-001)
(
  '00000000-0000-0000-0003-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'image',
  'client_upload',
  'demo://media/mamadali/lamb-shoulder-hero.jpg',
  'demo://media/mamadali/thumbs/lamb-shoulder-hero.jpg',
  'likely_usable',
  'Good lighting, food well-centred, no blur detected.',
  'approved',
  NULL,  -- user-team-jordan; FK added after auth setup
  '2026-05-20T10:30:00Z',
  NULL,  -- will be updated to post-001 UUID after posts are inserted
  '2026-05-18T09:00:00Z',
  '2026-05-20T10:30:00Z'
),

-- media-mamadali-002 — Family feast promo (scheduled, used in post-002)
(
  '00000000-0000-0000-0003-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'image',
  'client_upload',
  'demo://media/mamadali/family-feast-promo.jpg',
  'demo://media/mamadali/thumbs/family-feast-promo.jpg',
  'likely_usable',
  'Bright, clean table setting. Strong for engagement.',
  'scheduled',
  NULL,  -- user-team-jordan
  '2026-05-21T11:00:00Z',
  NULL,  -- will be updated to post-002 UUID
  '2026-05-18T09:05:00Z',
  '2026-05-21T11:00:00Z'
),

-- media-mamadali-003 — Kitchen BTS reel (approved video, used in post-003)
(
  '00000000-0000-0000-0003-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'video',
  'team_upload',
  'demo://media/mamadali/kitchen-bts-reel.mp4',
  'demo://media/mamadali/thumbs/kitchen-bts-reel.jpg',
  'likely_usable',
  'Smooth motion, well-lit kitchen environment.',
  'approved',
  NULL,  -- user-team-sarah
  '2026-05-22T09:15:00Z',
  NULL,  -- will be updated to post-003 UUID
  '2026-05-19T14:00:00Z',
  '2026-05-22T09:15:00Z'
),

-- media-mamadali-004 — Mixed grill platter (used in published post-004)
(
  '00000000-0000-0000-0003-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'image',
  'client_upload',
  'demo://media/mamadali/mixed-grill-platter.jpg',
  'demo://media/mamadali/thumbs/mixed-grill-platter.jpg',
  'likely_usable',
  'Excellent platter composition. High reach potential.',
  'used',
  NULL,  -- user-team-jordan
  '2026-05-14T10:00:00Z',
  NULL,  -- will be updated to post-004 UUID
  '2026-05-12T08:30:00Z',
  '2026-05-17T12:00:00Z'
),

-- media-mamadali-005 — Google review highlight (used in published post-005)
(
  '00000000-0000-0000-0003-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'image',
  'legacy_reuse',
  'demo://media/mamadali/google-review-highlight.jpg',
  'demo://media/mamadali/thumbs/google-review-highlight.jpg',
  'likely_usable',
  'Review graphic. Clear text, brand-consistent.',
  'used',
  NULL,  -- user-team-alex
  '2026-05-15T09:00:00Z',
  NULL,  -- will be updated to post-005 UUID
  '2026-05-13T11:00:00Z',
  '2026-05-18T13:00:00Z'
),

-- media-mamadali-006 — Opening hours graphic (used in published post-006)
(
  '00000000-0000-0000-0003-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'image',
  'team_upload',
  'demo://media/mamadali/opening-hours-graphic.jpg',
  'demo://media/mamadali/thumbs/opening-hours-graphic.jpg',
  'likely_usable',
  'Informational graphic, clear and on-brand.',
  'used',
  NULL,  -- user-team-sarah
  '2026-05-16T10:30:00Z',
  NULL,  -- will be updated to post-006 UUID
  '2026-05-14T10:00:00Z',
  '2026-05-19T14:00:00Z'
),

-- media-mamadali-007 — Prep day BTS (used in published post-007)
(
  '00000000-0000-0000-0003-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'image',
  'client_upload',
  'demo://media/mamadali/prep-day-bts.jpg',
  'demo://media/mamadali/thumbs/prep-day-bts.jpg',
  'likely_usable',
  'Authentic behind-the-scenes content. Strong reach signal.',
  'used',
  NULL,  -- user-team-jordan
  '2026-05-17T09:00:00Z',
  NULL,  -- will be updated to post-007 UUID
  '2026-05-15T08:00:00Z',
  '2026-05-20T11:00:00Z'
),

-- media-mamadali-008 — Aubergine dip (borderline AI flag, pending team review)
(
  '00000000-0000-0000-0003-000000000008',
  '00000000-0000-0000-0000-000000000001',
  'image',
  'client_upload',
  'demo://media/mamadali/aubergine-dip-new-menu.jpg',
  'demo://media/mamadali/thumbs/aubergine-dip-new-menu.jpg',
  'borderline',
  'Slightly underexposed. Usable with brightness correction.',
  'team_review_pending',
  NULL,  -- not yet reviewed
  NULL,
  NULL,  -- not used in any post
  '2026-05-22T16:00:00Z',
  '2026-05-22T16:00:00Z'
),

-- media-mamadali-009 — Full table spread (usable, not yet drafted)
(
  '00000000-0000-0000-0003-000000000009',
  '00000000-0000-0000-0000-000000000001',
  'image',
  'client_upload',
  'demo://media/mamadali/full-table-spread.jpg',
  'demo://media/mamadali/thumbs/full-table-spread.jpg',
  'likely_usable',
  'Wide shot of full table. Good for reach posts.',
  'usable',
  NULL,  -- user-team-jordan
  '2026-05-23T08:00:00Z',
  NULL,  -- not used in any post
  '2026-05-22T17:00:00Z',
  '2026-05-23T08:00:00Z'
),

-- media-mamadali-010 — Chef grilling reel (shortlisted video)
(
  '00000000-0000-0000-0003-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'video',
  'client_upload',
  'demo://media/mamadali/chef-grilling-reel.mp4',
  'demo://media/mamadali/thumbs/chef-grilling-reel.jpg',
  'likely_usable',
  'Dynamic action shot on the grill. High engagement potential.',
  'shortlisted',
  NULL,  -- user-team-sarah
  '2026-05-23T09:00:00Z',
  NULL,  -- not used in any post
  '2026-05-23T07:00:00Z',
  '2026-05-23T09:00:00Z'
);
