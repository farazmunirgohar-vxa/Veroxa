-- =============================================================================
-- 007_wire_post_draft_variants.sql
-- Veroxa — Draft seed: wire posts.draft_variant_id and
--          draft_variants.used_in_post_id for approved/published variants
-- DRAFT ONLY — do not apply to a live database without review
-- Depends on: 004_seed_posts_and_slots.sql, 006_seed_concepts_and_drafts.sql
--
-- Context:
--   004_seed_posts_and_slots.sql inserted all posts with draft_variant_id = NULL.
--   006_seed_concepts_and_drafts.sql inserted draft variants with used_in_post_id = NULL.
--   This file resolves both sides of the relationship in two steps.
--
-- Key distinction:
--   posts.draft_variant_id — set for any post that has an approved or used
--     variant assigned, including scheduled posts not yet published.
--   draft_variants.used_in_post_id — set ONLY after a post is published/locked.
--     Scheduled posts (001, 002) have an approved variant assigned to them, but
--     that variant has not yet been used/published, so used_in_post_id stays NULL.
--
-- Post 003 is intentionally excluded — its draft set is still under_review
-- and no variant has been approved yet. Wire it in a future step once the
-- kitchen BTS concept is approved and a variant is selected.
--
-- TRIGGER BYPASS NOTE:
--   trg_posts_lock_guard prevents any UPDATE on posts where locked_at IS NOT NULL.
--   Demo published posts (004–007) are already locked as seeded in 004.
--   This is a seed-only bypass — the trigger is disabled only to allow the
--   draft_variant_id wiring to proceed against already-locked demo posts.
--   The trigger must be re-enabled immediately after the UPDATE statements.
--   This bypass is only for dev seed setup and has no effect on runtime app
--   behavior — the trigger is active during normal application operation.
-- =============================================================================


-- =============================================================================
-- Seed-only bypass: disable lock guard before wiring draft_variant_id
-- Re-enabled at the bottom of this file immediately after all UPDATEs.
-- =============================================================================

ALTER TABLE posts DISABLE TRIGGER trg_posts_lock_guard;


-- =============================================================================
-- Step 1: Set posts.draft_variant_id
-- Applies to all 6 wired posts regardless of publish state.
-- =============================================================================

-- post-001 (lamb shoulder, scheduled) → variant-001-A (safe, approved, not yet published)
UPDATE posts
SET    draft_variant_id = '00000000-0000-0000-000a-000000000001'
WHERE  id               = '00000000-0000-0000-0005-000000000001';

-- post-002 (family feast, scheduled) → variant-002-B (engagement, approved, not yet published)
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
-- Step 2: Set draft_variants.used_in_post_id
-- Only applies to variants whose post has been published and locked.
-- Variants 001-A and 002-B are excluded — their posts are scheduled but not
-- yet published, so the variant is approved (assigned) but not yet used.
-- =============================================================================

-- variant-004-A → post-004 (published 2026-05-17)
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000004'
WHERE  id              = '00000000-0000-0000-000a-000000000010';

-- variant-005-A → post-005 (published 2026-05-18)
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000005'
WHERE  id              = '00000000-0000-0000-000a-000000000013';

-- variant-006-A → post-006 (published 2026-05-19)
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000006'
WHERE  id              = '00000000-0000-0000-000a-000000000016';

-- variant-007-A → post-007 (published 2026-05-20)
UPDATE draft_variants
SET    used_in_post_id = '00000000-0000-0000-0005-000000000007'
WHERE  id              = '00000000-0000-0000-000a-000000000019';

-- variant-001-A and variant-002-B: used_in_post_id intentionally left NULL.
-- Their posts (001, 002) are scheduled but not yet published. Set used_in_post_id
-- only after those posts are published and locked.


-- =============================================================================
-- Re-enable lock guard immediately after seed wiring is complete.
-- =============================================================================

ALTER TABLE posts ENABLE TRIGGER trg_posts_lock_guard;
