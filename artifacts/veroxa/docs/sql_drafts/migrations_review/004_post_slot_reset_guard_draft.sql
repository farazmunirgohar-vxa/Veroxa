-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- Review and audit before converting into a real migration.
-- AUTH_MODE remains "placeholder".
-- =============================================================================
--
-- M004 Correction Draft — Post Deletion Slot Reset Trigger (DRAFT)
--
-- Purpose:
--   Close audit issue F4 from MIGRATION_004_TEST_PLAN.md.
--
--   `post_slots.reserved_post_id` has `on delete set null`. When a post
--   is deleted, the slot's reserved_post_id becomes NULL but the slot's
--   `status` column stays 'reserved' — leaving an orphan slot that the
--   scheduler treats as occupied. This trigger flips such slots back to
--   'open' atomically with the post deletion.
--
-- Applies AFTER:
--   * 001_identity_foundation_draft.sql
--   * 002_client_foundation_draft.sql
--   * 003_media_foundation_draft.sql
--   * 004_posting_foundation_draft.sql
--
-- BEFORE DELETE (not AFTER DELETE) so the slot mutation completes in
-- the same transaction as the post deletion, and so the FK
-- `set null` action happens AFTER this trigger sees OLD.id — meaning
-- the WHERE clause matches the soon-to-be-NULLed reservation correctly.
--
-- Operational cleanup only. NO real publishing is involved. NO change
-- to AUTH_MODE, pricing, navigation, portal UI, or any other migration
-- scope.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Trigger function
-- -----------------------------------------------------------------------------

create or replace function private.posts_before_delete_reset_slot()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.post_slots
  set
    reserved_post_id = null,
    status           = 'open',
    updated_at       = now()
  where reserved_post_id = old.id
    and status           = 'reserved';

  -- Slots that are already 'scheduled', 'completed', or 'skipped' are
  -- intentionally NOT reset — those represent actual scheduler /
  -- publishing history and must remain auditable even after the
  -- underlying post is deleted.

  return old;
end;
$$;

comment on function private.posts_before_delete_reset_slot() is
  'BEFORE DELETE on public.posts. For every post_slots row that holds a reservation against the post being deleted, flip status back to ''open'' and clear reserved_post_id. Only reservations in status=''reserved'' are reset; ''scheduled''/''completed''/''skipped'' slots are left alone to preserve scheduler/publishing history.';

revoke execute on function private.posts_before_delete_reset_slot() from public;
-- Trigger functions are invoked by the trigger owner; no explicit
-- grant to authenticated / service_role is required.


-- -----------------------------------------------------------------------------
-- Trigger
-- -----------------------------------------------------------------------------

create trigger posts_before_delete_reset_slot
  before delete on public.posts
  for each row execute function private.posts_before_delete_reset_slot();

comment on trigger posts_before_delete_reset_slot
  on public.posts is
  'Operational hygiene: prevents orphan reserved slots when a post is deleted. Companion to media_assets.linked_post_id ON DELETE SET NULL (which is handled by the FK itself, not this trigger).';


commit;

-- =============================================================================
-- ROLLBACK (dev reference only — forward-only in production)
-- =============================================================================
--
-- IMPORTANT: drop this trigger BEFORE dropping public.posts during any
-- M004 rollback, otherwise the trigger drop fails with "cannot drop
-- trigger ... on relation that does not exist".
--
-- begin;
--   drop trigger if exists posts_before_delete_reset_slot
--     on public.posts;
--   drop function if exists private.posts_before_delete_reset_slot();
-- commit;

-- =============================================================================
-- NOTES
--
-- 1. The trigger is intentionally tolerant of repeated execution: the
--    WHERE clause filters on `status='reserved'`, so re-deleting a
--    phantom row is a no-op.
--
-- 2. If a future migration adds new post_slots.status values (e.g.
--    'locked'), decide whether they should also be reset on post
--    deletion and update the WHERE clause accordingly.
--
-- 3. The corresponding test cases are appended to
--    docs/MIGRATION_004_TEST_PLAN.md under section
--    "Post deletion slot reset trigger".
--
-- DO NOT RUN — REVIEW BEFORE PROMOTION
-- AUTH_MODE remains "placeholder".
-- =============================================================================
