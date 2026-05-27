-- =============================================================================
-- M004 Dev Test — Step 1c: Apply Posts / Post-Slots Staff-Policy Correction
--
-- Source:
--   docs/sql_drafts/migrations_review/004_posts_select_staff_correction_draft.sql
--
-- Purpose:
--   Close the `can_view_client` over-broad-scope defect in M004's
--   posts_select_staff and post_slots_select_staff policies so that
--   Test 1a and Test 3a in 03_test_m004_queries.sql pass as intended.
--
-- WHEN TO RUN:
--   Run AFTER 01_apply_m004.sql, 01b_apply_post_slot_reset_guard.sql, AND
--   02_seed_m004_dev_data.sql.
--   Optional if you want to observe the defect first (Test 1a will fail
--   showing 5 instead of 2; Test 3a will leak the failed post). Apply
--   this file when you want to validate the corrected behavior.
--
-- Preconditions:
--   * M001 through M003 applied and green (including 01c team-scope correction).
--   * M004 apply (01) + reset guard (01b) + seed (02) applied.
--   * Dev project only — never production.
--   * AUTH_MODE stays "placeholder".
-- =============================================================================

begin;

-- Fix 1 of 2 — posts_select_staff
drop policy if exists posts_select_staff on public.posts;

create policy posts_select_staff
  on public.posts
  for select
  to authenticated
  using (private.is_assigned_to_client(client_id));

-- Fix 2 of 2 — post_slots_select_staff
drop policy if exists post_slots_select_staff on public.post_slots;

create policy post_slots_select_staff
  on public.post_slots
  for select
  to authenticated
  using (private.is_assigned_to_client(client_id));

commit;

-- Quick verification:
select tablename, policyname, qual
from pg_policies
where (tablename = 'posts'      and policyname = 'posts_select_staff')
   or (tablename = 'post_slots' and policyname = 'post_slots_select_staff');
-- EXPECTED: both rows; qual contains 'is_assigned_to_client', NOT 'can_view_client'.

-- Then re-run from 03_test_m004_queries.sql:
--   * Test 1a — client@A posts count should now be 2 (was 5).
--   * Test 3a — client@A SELECT failed post should now return 0 rows.
