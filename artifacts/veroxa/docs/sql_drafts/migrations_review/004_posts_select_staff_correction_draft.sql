-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- Review and audit before applying.
-- AUTH_MODE remains "placeholder".
-- =============================================================================
--
-- M004 Correction Draft — posts / post_slots staff-policy fix (DRAFT)
--
-- Purpose:
--   Close the same `can_view_client` over-broad-scope defect on M004 that
--   was closed for M003 in `003_team_scope_correction_draft.sql`.
--
-- Root cause:
--   Two policies in 004_posting_foundation_draft.sql use
--   `private.can_view_client(client_id)` as their sole role gate. But
--   `can_view_client(p)` returns TRUE when the caller is a client whose
--   own client_id equals p (M002 definition:
--     current_user_client_id() = p  OR  is_assigned_to_client(p)
--   ).
--
--   Effect on `posts_select_staff`: a client-role caller sees ALL of
--   their own client's posts via the staff policy, bypassing the
--   `post_status in ('scheduled','published')` filter on
--   `posts_select_own_client`. Internal-pipeline states (planning,
--   ready_for_review, failed) and the raw `publish_failure_reason`
--   become visible to clients. This is the M004 Test 1a / Test 3a
--   predicted failure.
--
--   Effect on `post_slots_select_staff`: same defect; same client-role
--   over-broad scope. Slot counts happen to match (`post_slots_select_own_client`
--   has no status filter) so it does not show as a test-count failure
--   in M004, but the policy intent is still violated.
--
-- Fix:
--   Swap `can_view_client` → `is_assigned_to_client` in both policies.
--   `is_assigned_to_client` short-circuits TRUE for operators/owners
--   (via `is_operator()`) and for team members with an active
--   assignment, but NEVER for clients (`current_user_client_id()` is
--   not consulted).
--
-- Affected policies:
--   1. posts_select_staff       (on public.posts)
--   2. post_slots_select_staff  (on public.post_slots)
--
-- Applies AFTER:
--   * 001_identity_foundation_draft.sql
--   * 002_client_foundation_draft.sql
--   * 003_media_foundation_draft.sql
--   * 003_team_scope_correction_draft.sql       (the M003 sibling fix)
--   * 004_posting_foundation_draft.sql
--   * 004_post_slot_reset_guard_draft.sql
--
-- Operational scope: RLS policy replacement only. No schema changes,
-- no trigger changes, no index changes, no pricing/nav/portal changes,
-- no AUTH_MODE change.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Fix: posts_select_staff
-- -----------------------------------------------------------------------------
--
-- Intent (per policy name + test plan): team/operator/owner read for
-- clients they can manage or report on. Clients have their own
-- `posts_select_own_client` policy that already filters to
-- scheduled/published. The "staff" policy must NEVER match a client
-- role.

drop policy if exists posts_select_staff on public.posts;

create policy posts_select_staff
  on public.posts
  for select
  to authenticated
  using (private.is_assigned_to_client(client_id));

comment on policy posts_select_staff on public.posts is
  'CORRECTED (004_posts_select_staff_correction_draft): was can_view_client (leaked internal-pipeline posts and publish_failure_reason to client role). Now uses is_assigned_to_client so only assigned team/operator/owner can read posts in non-client-facing statuses.';


-- -----------------------------------------------------------------------------
-- 2. Fix: post_slots_select_staff
-- -----------------------------------------------------------------------------
--
-- Same root cause. The defect did not change the row count clients see
-- (slots have no status filter on the own-client policy), but the
-- policy-design intent is the same: staff policies must not match the
-- client role.

drop policy if exists post_slots_select_staff on public.post_slots;

create policy post_slots_select_staff
  on public.post_slots
  for select
  to authenticated
  using (private.is_assigned_to_client(client_id));

comment on policy post_slots_select_staff on public.post_slots is
  'CORRECTED (004_posts_select_staff_correction_draft): was can_view_client (matched client role for own tenant). Now uses is_assigned_to_client so only assigned team/operator/owner match the staff policy. Client read for own slots continues via post_slots_select_own_client.';


commit;


-- =============================================================================
-- VERIFICATION QUERIES
-- (Run after applying this correction; results should match M004 test plan)
-- =============================================================================
--
-- After applying this correction to the dev project, re-run M004 dev test
-- queries Tests 1a and 3a (from dev_test/m004/03_test_m004_queries.sql).
--
-- Test 1a expected (post-correction):
--   As client@veroxa.test: posts count for client A = 2
--   (POST_A1 scheduled + POST_A2 published).
--   If the result is still 5, the correction was not applied correctly.
--
-- Test 3a expected (post-correction):
--   As client@veroxa.test: select POST_A5 (failed) → 0 rows.
--   If 1 row, correction not applied correctly.
--
-- Quick policy audit (run as postgres/service_role):
-- select tablename, policyname, qual
-- from pg_policies
-- where (tablename = 'posts'       and policyname = 'posts_select_staff')
--    or (tablename = 'post_slots'  and policyname = 'post_slots_select_staff');
-- Both quals should contain 'is_assigned_to_client', NOT 'can_view_client'.
--
-- =============================================================================
-- REMINDER: this file is in docs/sql_drafts/migrations_review/, NOT in
-- supabase/migrations/. It has not been applied to any database.
-- Apply to the dev project ONLY, then re-run M004 Tests 1a + 3a.
-- =============================================================================
