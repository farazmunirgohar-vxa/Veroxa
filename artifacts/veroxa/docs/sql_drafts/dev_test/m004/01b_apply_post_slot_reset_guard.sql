-- =============================================================================
-- M004 Dev Test — Step 1b: Apply Post-Slot Reset Guard
--
-- Source:
--   docs/sql_drafts/migrations_review/004_post_slot_reset_guard_draft.sql
--
-- Run AFTER 01_apply_m004.sql, BEFORE seed.
--
-- Purpose: closes audit issue F4 — when a post is deleted while a slot
-- holds a `status='reserved'` reservation against it, the slot would
-- otherwise remain "reserved" with a NULL reserved_post_id (orphan
-- reserved slot). This BEFORE DELETE trigger flips such slots back to
-- 'open' atomically. Slots already in 'scheduled', 'completed', or
-- 'skipped' are intentionally NOT reset (they represent publishing
-- history).
--
-- Expected result: "Success. No rows returned."
-- AUTH_MODE stays "placeholder". Dev project only.
-- =============================================================================

begin;

-- Trigger function
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

  -- Slots already 'scheduled', 'completed', or 'skipped' are intentionally
  -- NOT reset — those represent scheduler / publishing history.

  return old;
end;
$$;

comment on function private.posts_before_delete_reset_slot() is
  'BEFORE DELETE on public.posts. For every post_slots row holding a reservation against the post being deleted, flip status back to ''open'' and clear reserved_post_id. Only status=''reserved'' slots are reset; ''scheduled''/''completed''/''skipped'' slots are left for audit history.';

revoke execute on function private.posts_before_delete_reset_slot() from public;

-- Trigger
create trigger posts_before_delete_reset_slot
  before delete on public.posts
  for each row execute function private.posts_before_delete_reset_slot();

comment on trigger posts_before_delete_reset_slot on public.posts is
  'Operational hygiene: prevents orphan reserved slots when a post is deleted. Companion to media_assets.linked_post_id ON DELETE SET NULL (handled by the FK itself).';

commit;

-- Quick verification:
select trigger_name, event_manipulation, action_timing
from information_schema.triggers
where trigger_name = 'posts_before_delete_reset_slot'
  and event_object_table = 'posts';
-- EXPECTED: 1 row, event_manipulation=DELETE, action_timing=BEFORE.

-- Rollback reference (dev only — never production):
-- begin;
--   drop trigger if exists posts_before_delete_reset_slot on public.posts;
--   drop function if exists private.posts_before_delete_reset_slot();
-- commit;
