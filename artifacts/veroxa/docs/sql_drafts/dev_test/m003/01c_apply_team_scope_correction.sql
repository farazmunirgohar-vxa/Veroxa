-- =============================================================================
-- M003 Dev Test — Step 1c: Apply Team-Scope Policy Correction
--
-- Source:
--   docs/sql_drafts/migrations_review/003_team_scope_correction_draft.sql
--
-- Purpose:
--   Fix the `can_view_client` over-broad-scope defect in two M003 policies
--   so that Tests 7 and 13 in 03_test_m003_queries.sql pass as intended.
--
-- WHEN TO RUN:
--   Run AFTER 01_apply_m003.sql and 01b_apply_notifications_status_guard.sql,
--   BEFORE (or just before re-running) Tests 7 and 13.
--   This step is OPTIONAL if you want to observe the defect first (Tests 7
--   and 13 will fail, confirming the original source-draft bug); apply this
--   file when you want to validate the corrected behavior.
--
-- Preconditions:
--   * M003 applied (01_apply_m003.sql ran without errors).
--   * Notifications guard applied (01b ran without errors).
--   * Dev project only — never production.
--   * AUTH_MODE stays "placeholder".
-- =============================================================================

begin;

-- Fix 1 of 2 — notifications_select_assigned_team
drop policy if exists notifications_select_assigned_team on public.notifications;

create policy notifications_select_assigned_team
  on public.notifications
  for select
  to authenticated
  using (
    private.is_assigned_to_client(client_id)
    and target_role in ('team','operator')
  );

-- Fix 2 of 2 — activity_logs_select_assigned_team
drop policy if exists activity_logs_select_assigned_team on public.activity_logs;

create policy activity_logs_select_assigned_team
  on public.activity_logs
  for select
  to authenticated
  using (
    private.is_assigned_to_client(client_id)
    and entity_type in ('media_assets','client_requests','onboarding_items','client_platforms')
  );

commit;

-- Quick verification (run immediately after commit):
select tablename, policyname, qual
from pg_policies
where (tablename = 'notifications'  and policyname = 'notifications_select_assigned_team')
   or (tablename = 'activity_logs'  and policyname = 'activity_logs_select_assigned_team');
-- EXPECTED: both rows; qual contains 'is_assigned_to_client', NOT 'can_view_client'.
