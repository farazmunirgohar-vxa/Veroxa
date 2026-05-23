-- =============================================================================
-- 007_wire_post_draft_variants.sql
-- Veroxa — Draft seed: wire posts.draft_variant_id and
--          draft_variants.used_in_post_id for all approved/used variants
-- DRAFT ONLY — do not apply to a live database without review
-- Depends on: 004_seed_posts_and_slots.sql, 006_seed_concepts_and_drafts.sql
--
-- Context:
--   004_seed_posts_and_slots.sql inserted all posts with draft_variant_id = NULL.
--   006_seed_concepts_and_drafts.sql inserted draft variants with used_in_post_id = NULL.
--   This file resolves both sides of the relationship.
--
-- Post 003 is intentionally excluded — its draft set is still under_review
-- and no variant has been approved yet. Wire it in a future step once the
-- kitchen BTS concept is approved and a variant is selected.
-- =============================================================================


-- =============================================================================
-- Step 1: Set posts.draft_variant_id
-- =============================================================================

-- post-001 (lamb shoulder, scheduled) → variant-001-A (safe, approved)
UPDATE posts
SET    draft_variant_id = '00000000-0000-0000-000a-000000000001'
WHERE  id               = '00000000-0000-0000-0005-000000000001';

-- post-002 (family feast, scheduled) → variant-002-B (engagement, approved)
UPDATE posts
SET    draft_variant_id = '00000000-0000-0000-000a-000000000005'
WHERE  id               = '00000000-0000-0000-0005-000000000002';

-- post-004 (mixed grill, published+locked) → variant-004-A (safe, used)
UPDATE posts
SET    draft_variant_id = '00000000-0000-0000-000a-000000000010'
WHERE  id               = '00000000-0000-0000-0005-000000000004';

-- post-005 (google review, published+locked) → variant-005-A (safe, used)
UPDATE posts
SET    draft_variant_id = '00000000-0000-0000-000a-000000000013'
WHERE  id               = '00000000-0000-0000-0005-000000000005';

-- post-006 (opening hours, published+locked) → variant-006-A (safe, used)
UPDATE posts
SET    draft_variant_id = '00000000-0000-0000-000a-000000000016'
WHERE  id               = '00000000-0000-0000-0005-000000000006';

-- post-007 (prep day BTS, published+locked) → variant-007-A (safe, used)
UPDATE posts
SET    draft_variant_id = '00000000-0000-0000-000a-000000000019'
WHERE  id               = '00000000-0000-0000-0005-000000000007';


-- =============================================================================
-- Step 2: Set draft_variants.used_in_post_id (reverse side of relationship)
-- Only variants with status = 'used' need this; approved-but-not-yet-published
-- variants (001-A and 002-B) are also set here for forward consistency.
-- =============================================================================

-- variant-001-A → post-001
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000001'
WHERE  id              = '00000000-0000-0000-000a-000000000001';

-- variant-002-B → post-002
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000002'
WHERE  id              = '00000000-0000-0000-000a-000000000005';

-- variant-004-A → post-004
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000004'
WHERE  id              = '00000000-0000-0000-000a-000000000010';

-- variant-005-A → post-005
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000005'
WHERE  id              = '00000000-0000-0000-000a-000000000013';

-- variant-006-A → post-006
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000006'
WHERE  id              = '00000000-0000-0000-000a-000000000016';

-- variant-007-A → post-007
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000007'
WHERE  id              = '00000000-0000-0000-000a-000000000019';
