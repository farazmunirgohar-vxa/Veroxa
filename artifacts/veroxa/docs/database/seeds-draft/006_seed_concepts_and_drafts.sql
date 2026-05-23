-- =============================================================================
-- 006_seed_concepts_and_drafts.sql
-- Veroxa — Draft seed: content_concepts, draft_sets, draft_variants
-- DRAFT ONLY — do not apply to a live database without review
-- Depends on: 001_seed_clients.sql, 003_seed_media_assets.sql
--
-- IMPORTANT: posts.draft_variant_id is still NULL in 004_seed_posts_and_slots.sql.
-- After this file is reviewed and applied, a future cleanup step will add UPDATE
-- statements that wire posts.draft_variant_id to the correct variant UUIDs from
-- this file. That step is not part of this draft.
--
-- UUID ranges:
--   content_concepts: 00000000-0000-0000-0008-000000000001 → …005
--   draft_sets:       00000000-0000-0000-0009-000000000001 → …005
--   draft_variants:   00000000-0000-0000-000a-000000000001 → …015
--
-- Coverage:
--   Concepts 1–5 cover the 5 requested media assets. Draft variants for
--   post-001 (variant-001-A), post-002 (variant-002-B), post-004 (variant-004-A),
--   and post-005 (variant-005-A) are included here.
--
--   variant-006-A (opening hours graphic) and variant-007-A (prep day BTS)
--   are not included yet — those concepts will be added when concepts for
--   media-mamadali-006 and media-mamadali-007 are drafted.
-- =============================================================================


-- =============================================================================
-- 1. content_concepts
-- =============================================================================

INSERT INTO content_concepts (
  id,
  client_id,
  media_asset_id,
  goal,
  concept_title,
  concept_body,
  status,
  generated_by_ai,
  reviewed_by_user_id,
  reviewed_at,
  created_at,
  updated_at
) VALUES

-- Concept 1: Lamb shoulder hero shot
(
  '00000000-0000-0000-0008-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0003-000000000001',  -- media-mamadali-001
  'awareness',
  'Slow-cooked lamb shoulder — limited weekly run',
  'Hero post spotlighting the signature lamb shoulder. Emphasise the 24-hour marinade and limited availability to drive urgency and table bookings. Pair with the lamb shoulder hero shot.',
  'approved',
  FALSE,
  NULL,  -- reviewed_by_user_id: FK to auth.users added in Phase 6
  '2026-05-19T10:00:00Z',
  '2026-05-18T09:00:00Z',
  '2026-05-19T10:00:00Z'
),

-- Concept 2: Family feast promo
(
  '00000000-0000-0000-0008-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0003-000000000002',  -- media-mamadali-002
  'conversion',
  'Family feast deal — feed 4 for under $60',
  'Value-led post promoting the family feast bundle. Lead with the price anchor and group-dining angle. Designed to convert followers into bookings. Pair with the family feast promo image.',
  'approved',
  FALSE,
  NULL,
  '2026-05-20T11:00:00Z',
  '2026-05-19T09:00:00Z',
  '2026-05-20T11:00:00Z'
),

-- Concept 3: Kitchen BTS reel
(
  '00000000-0000-0000-0008-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0003-000000000003',  -- media-mamadali-003
  'engagement',
  'Behind the scenes: how the kebab sauce is made',
  'Authentic kitchen reel showing the sauce preparation process. Short-form video, 15–30 seconds. Narration or on-screen text preferred. High engagement potential from local foodie audience.',
  'under_review',
  FALSE,
  NULL,
  NULL,
  '2026-05-21T14:00:00Z',
  '2026-05-21T14:00:00Z'
),

-- Concept 4: Mixed grill platter
(
  '00000000-0000-0000-0008-000000000004',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0003-000000000004',  -- media-mamadali-004
  'awareness',
  'Weekend special: mixed grill platter for 2',
  'Showcase the mixed grill platter as a weekend sharing dish. Strong visual-first post — let the food do the work. Add a soft CTA for weekend reservations.',
  'approved',
  FALSE,
  NULL,
  '2026-05-13T10:00:00Z',
  '2026-05-12T09:00:00Z',
  '2026-05-13T10:00:00Z'
),

-- Concept 5: Google review highlight
(
  '00000000-0000-0000-0008-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0003-000000000005',  -- media-mamadali-005
  'credibility',
  'Google review spotlight — 5 stars from Ahmed K.',
  'Social proof post using a genuine 5-star Google review. Builds credibility and encourages more reviews. Keep the design clean — review text large and readable.',
  'approved',
  FALSE,
  NULL,
  '2026-05-14T09:00:00Z',
  '2026-05-13T11:00:00Z',
  '2026-05-14T09:00:00Z'
);


-- =============================================================================
-- 2. draft_sets
-- One draft set per concept.
-- =============================================================================

INSERT INTO draft_sets (
  id,
  client_id,
  concept_id,
  status,
  generated_at,
  approved_at,
  created_at,
  updated_at
) VALUES

-- Draft set 1: Lamb shoulder
(
  '00000000-0000-0000-0009-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0008-000000000001',
  'approved',
  '2026-05-19T10:30:00Z',
  '2026-05-19T11:00:00Z',
  '2026-05-19T10:30:00Z',
  '2026-05-19T11:00:00Z'
),

-- Draft set 2: Family feast
(
  '00000000-0000-0000-0009-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0008-000000000002',
  'approved',
  '2026-05-20T11:30:00Z',
  '2026-05-20T12:00:00Z',
  '2026-05-20T11:30:00Z',
  '2026-05-20T12:00:00Z'
),

-- Draft set 3: Kitchen BTS reel (still under review — concept not yet approved)
(
  '00000000-0000-0000-0009-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0008-000000000003',
  'under_review',
  '2026-05-22T09:00:00Z',
  NULL,
  '2026-05-22T09:00:00Z',
  '2026-05-22T09:00:00Z'
),

-- Draft set 4: Mixed grill platter
(
  '00000000-0000-0000-0009-000000000004',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0008-000000000004',
  'approved',
  '2026-05-13T10:30:00Z',
  '2026-05-13T11:00:00Z',
  '2026-05-13T10:30:00Z',
  '2026-05-13T11:00:00Z'
),

-- Draft set 5: Google review highlight
(
  '00000000-0000-0000-0009-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0008-000000000005',
  'approved',
  '2026-05-14T09:30:00Z',
  '2026-05-14T10:00:00Z',
  '2026-05-14T09:30:00Z',
  '2026-05-14T10:00:00Z'
);


-- =============================================================================
-- 3. draft_variants
-- Three variants per draft set (safe / engagement / sales).
-- Statuses reflect whether the variant was used in a published post.
--
-- Key variant → post mapping (for future UPDATE step):
--   00000000-0000-0000-000a-000000000001  (variant-001-A, safe)   → post-001
--   00000000-0000-0000-000a-000000000005  (variant-002-B, engagement) → post-002
--   00000000-0000-0000-000a-000000000010  (variant-004-A, safe)   → post-004
--   00000000-0000-0000-000a-000000000013  (variant-005-A, safe)   → post-005
-- =============================================================================

INSERT INTO draft_variants (
  id,
  client_id,
  draft_set_id,
  variant_type,
  caption_text,
  hashtags,
  status,
  used_in_post_id,      -- NULL throughout; wired in a future UPDATE step
  approved_by_user_id,  -- FK to auth.users added in Phase 6
  approved_at,
  created_at,
  updated_at
) VALUES

-- ── Draft set 1: Lamb shoulder ────────────────────────────────────────────────

-- variant-001-A (safe) — used in post-001 (scheduled); status = approved
-- Future step: UPDATE posts SET draft_variant_id = '00000000-0000-0000-000a-000000000001'
--              WHERE id = '00000000-0000-0000-0005-000000000001'
(
  '00000000-0000-0000-000a-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000001',
  'safe',
  '24 hours marinated. Cooked low and slow. Worth the wait. Reserve your table tonight.',
  ARRAY['#MamadaliKebab', '#LambShoulder', '#SlowCooked', '#LondonFood', '#KebabHouse'],
  'approved',
  NULL,
  NULL,
  '2026-05-19T11:00:00Z',
  '2026-05-19T10:30:00Z',
  '2026-05-19T11:00:00Z'
),

-- variant-001-B (engagement) — not assigned to a post
(
  '00000000-0000-0000-000a-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000001',
  'engagement',
  'The lamb shoulder that keeps regulars coming back. On the menu this week only.',
  ARRAY['#MamadaliKebab', '#WeeklySpecial', '#LambLovers', '#LondonEats'],
  'generated',
  NULL,
  NULL,
  NULL,
  '2026-05-19T10:30:00Z',
  '2026-05-19T10:30:00Z'
),

-- variant-001-C (sales) — not assigned to a post
(
  '00000000-0000-0000-000a-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000001',
  'sales',
  'Slow food, fast service. Our lamb shoulder — available Tue–Sun from 5pm.',
  ARRAY['#MamadaliKebab', '#BookNow', '#LambShoulder', '#FoodieNight'],
  'generated',
  NULL,
  NULL,
  NULL,
  '2026-05-19T10:30:00Z',
  '2026-05-19T10:30:00Z'
),

-- ── Draft set 2: Family feast ──────────────────────────────────────────────────

-- variant-002-A (safe) — not assigned to a post
(
  '00000000-0000-0000-000a-000000000004',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000002',
  'safe',
  'Feed your whole family for under $60. Our family feast deal is back this week.',
  ARRAY['#MamadaliKebab', '#FamilyFeast', '#FamilyDinner', '#AffordableEats'],
  'generated',
  NULL,
  NULL,
  NULL,
  '2026-05-20T11:30:00Z',
  '2026-05-20T11:30:00Z'
),

-- variant-002-B (engagement) — used in post-002 (scheduled); status = approved
-- Future step: UPDATE posts SET draft_variant_id = '00000000-0000-0000-000a-000000000005'
--              WHERE id = '00000000-0000-0000-0005-000000000002'
(
  '00000000-0000-0000-000a-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000002',
  'engagement',
  'Family feast deal — feed 4 for under $60. Book your table now.',
  ARRAY['#MamadaliKebab', '#FamilyFeast', '#BookNow', '#GroupDining', '#LondonFood'],
  'approved',
  NULL,
  NULL,
  '2026-05-20T12:00:00Z',
  '2026-05-20T11:30:00Z',
  '2026-05-20T12:00:00Z'
),

-- variant-002-C (sales) — not assigned to a post
(
  '00000000-0000-0000-000a-000000000006',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000002',
  'sales',
  'Bring the family. Feed 4 for $60. Only available while tables last.',
  ARRAY['#MamadaliKebab', '#FamilyMeal', '#FoodDeal', '#LimitedOffer'],
  'generated',
  NULL,
  NULL,
  NULL,
  '2026-05-20T11:30:00Z',
  '2026-05-20T11:30:00Z'
),

-- ── Draft set 3: Kitchen BTS reel (under_review — no variants approved yet) ───

-- variant-003-A (safe)
(
  '00000000-0000-0000-000a-000000000007',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000003',
  'safe',
  'Behind the scenes: how we make our signature kebab sauce from scratch.',
  ARRAY['#MamadaliKebab', '#BehindTheScenes', '#KebabSauce', '#KitchenLife'],
  'under_review',
  NULL,
  NULL,
  NULL,
  '2026-05-22T09:00:00Z',
  '2026-05-22T09:00:00Z'
),

-- variant-003-B (engagement)
(
  '00000000-0000-0000-000a-000000000008',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000003',
  'engagement',
  'The secret is in the sauce. Watch how we make it — every single day.',
  ARRAY['#MamadaliKebab', '#FoodSecrets', '#BTS', '#AuthenticFood'],
  'under_review',
  NULL,
  NULL,
  NULL,
  '2026-05-22T09:00:00Z',
  '2026-05-22T09:00:00Z'
),

-- variant-003-C (sales)
(
  '00000000-0000-0000-000a-000000000009',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000003',
  'sales',
  'This is why our kebabs taste different. Sauce made fresh daily. Try it tonight.',
  ARRAY['#MamadaliKebab', '#FreshDaily', '#BookATable', '#LondonEats'],
  'under_review',
  NULL,
  NULL,
  NULL,
  '2026-05-22T09:00:00Z',
  '2026-05-22T09:00:00Z'
),

-- ── Draft set 4: Mixed grill platter ──────────────────────────────────────────

-- variant-004-A (safe) — used in published post-004 (locked); status = used
-- Future step: UPDATE posts SET draft_variant_id = '00000000-0000-0000-000a-000000000010'
--              WHERE id = '00000000-0000-0000-0005-000000000004'
(
  '00000000-0000-0000-000a-000000000010',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000004',
  'safe',
  'Weekend special: mixed grill platter for 2. Available Friday to Sunday.',
  ARRAY['#MamadaliKebab', '#MixedGrill', '#WeekendSpecial', '#LondonFood', '#GrillLovers'],
  'used',
  NULL,  -- used_in_post_id wired in future UPDATE step
  NULL,
  '2026-05-13T11:00:00Z',
  '2026-05-13T10:30:00Z',
  '2026-05-17T17:01:22Z'
),

-- variant-004-B (engagement) — not used
(
  '00000000-0000-0000-000a-000000000011',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000004',
  'engagement',
  'Two people. One platter. Zero leftovers. Our mixed grill is back this weekend.',
  ARRAY['#MamadaliKebab', '#MixedGrillPlatter', '#WeekendEats', '#FoodieCouples'],
  'archived',
  NULL,
  NULL,
  NULL,
  '2026-05-13T10:30:00Z',
  '2026-05-13T11:00:00Z'
),

-- variant-004-C (sales) — not used
(
  '00000000-0000-0000-000a-000000000012',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000004',
  'sales',
  'Book for the weekend. Mixed grill for 2 — limited tables available.',
  ARRAY['#MamadaliKebab', '#BookNow', '#WeekendGrill', '#LimitedAvailability'],
  'archived',
  NULL,
  NULL,
  NULL,
  '2026-05-13T10:30:00Z',
  '2026-05-13T11:00:00Z'
),

-- ── Draft set 5: Google review highlight ──────────────────────────────────────

-- variant-005-A (safe) — used in published post-005 (locked); status = used
-- Future step: UPDATE posts SET draft_variant_id = '00000000-0000-0000-000a-000000000013'
--              WHERE id = '00000000-0000-0000-0005-000000000005'
(
  '00000000-0000-0000-000a-000000000013',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000005',
  'safe',
  '"Best kebab in the area, hands down." — Ahmed K. ⭐⭐⭐⭐⭐ Thank you for the kind words!',
  ARRAY['#MamadaliKebab', '#CustomerLove', '#5Stars', '#GoogleReview', '#LondonFood'],
  'used',
  NULL,  -- used_in_post_id wired in future UPDATE step
  NULL,
  '2026-05-14T10:00:00Z',
  '2026-05-14T09:30:00Z',
  '2026-05-18T18:01:05Z'
),

-- variant-005-B (engagement) — not used
(
  '00000000-0000-0000-000a-000000000014',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000005',
  'engagement',
  'Our regulars say it best. 5 stars from Ahmed K. — and we can''t stop smiling.',
  ARRAY['#MamadaliKebab', '#CustomerReview', '#5StarFood', '#ThankYou'],
  'archived',
  NULL,
  NULL,
  NULL,
  '2026-05-14T09:30:00Z',
  '2026-05-14T10:00:00Z'
),

-- variant-005-C (sales) — not used
(
  '00000000-0000-0000-000a-000000000015',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0009-000000000005',
  'sales',
  'Join the regulars who give us 5 stars. Book your table at Mamadali tonight.',
  ARRAY['#MamadaliKebab', '#BookNow', '#5StarExperience', '#LondonDining'],
  'archived',
  NULL,
  NULL,
  NULL,
  '2026-05-14T09:30:00Z',
  '2026-05-14T10:00:00Z'
);
