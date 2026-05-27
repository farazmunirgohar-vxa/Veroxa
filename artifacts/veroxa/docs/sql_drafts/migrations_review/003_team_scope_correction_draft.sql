-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- Review and audit before applying.
-- AUTH_MODE remains "placeholder".
-- =============================================================================
--
-- M003 Correction Draft — Team-Scope Policy Fix (DRAFT)
--
-- Purpose:
--   Close the `can_view_client` over-broad-scope defect surfaced by the
--   M003 dev test package (Tests 7 and 13 predicted failures).
--
-- Root cause:
--   Two policies in 003_media_foundation_draft.sql use
--   `private.can_view_client(client_id)` as their sole role gate. But
--   `can_view_client(p)` returns TRUE when the caller is a client whose
--   own client_id equals p (M002 definition:
--     current_user_client_id() = p  OR  is_assigned_to_client(p)
--   ). So a client-role caller matches these "staff-only" policies for
--   their own tenant — leaking team/operator notifications and internal
--   activity logs to client users.
--
-- Fix:
--   Replace `can_view_client` with `is_assigned_to_client` in the two
--   affected policies. `is_assigned_to_client` short-circuits to TRUE for
--   operators/owners (via is_operator()) and for team members with an
--   active assignment, but NEVER for clients (current_user_client_id()
--   is not checked).
--
-- Affected policies:
--   1. notifications_select_assigned_team  (on public.notifications)
--   2. activity_logs_select_assigned_team  (on public.activity_logs)
--
-- Applies AFTER:
--   * 001_identity_foundation_draft.sql
--   * 002_client_foundation_draft.sql
--   * 003_media_foundation_draft.sql
--
-- Operational scope: RLS policy replacement only. No table schema
-- changes, no trigger changes, no index changes, no pricing/nav/portal
-- changes, no AUTH_MODE change.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Fix: notifications_select_assigned_team
-- -----------------------------------------------------------------------------
--
-- Drop the defective policy and recreate with is_assigned_to_client.
-- The intent (per policy name + test plan) is: team members assigned to
-- the client can read team/operator notifications for that client.
-- Clients must NOT see team/operator notifications — they have their own
-- `notifications_select_own_client` policy for client-targeted rows.

drop policy if exists notifications_select_assigned_team on public.notifications;

create policy notifications_select_assigned_team
  on public.notifications
  for select
  to authenticated
  using (
    private.is_assigned_to_client(client_id)
    and target_role in ('team','operator')
  );

comment on policy notifications_select_assigned_team on public.notifications is
  'CORRECTED (003_team_scope_correction_draft): was can_view_client (leaked to client role). Now uses is_assigned_to_client so only assigned team/operator/owner can read team and operator-targeted notifications.';


-- -----------------------------------------------------------------------------
-- 2. Fix: activity_logs_select_assigned_team
-- -----------------------------------------------------------------------------
--
-- Same root cause. Drop and recreate with is_assigned_to_client. The
-- policy comment in 003_media_foundation_draft.sql already states
-- "(NO client SELECT — internal audit data)" — the corrected policy
-- enforces that intent.

drop policy if exists activity_logs_select_assigned_team on public.activity_logs;

create policy activity_logs_select_assigned_team
  on public.activity_logs
  for select
  to authenticated
  using (
    private.is_assigned_to_client(client_id)
    and entity_type in ('media_assets','client_requests','onboarding_items','client_platforms')
  );

comment on policy activity_logs_select_assigned_team on public.activity_logs is
  'CORRECTED (003_team_scope_correction_draft): was can_view_client (leaked internal audit data to client role). Now uses is_assigned_to_client so only assigned team/operator/owner can read activity logs within the allowlist.';


commit;


-- =============================================================================
-- VERIFICATION QUERIES
-- (Run after applying this correction; results should match test plan)
-- =============================================================================
--
-- After applying this correction to the dev project, re-run M003 dev test
-- queries Tests 7 and 13 (from 03_test_m003_queries.sql).
--
-- Test 7 expected (post-correction):
--   As client@veroxa.test: notifications count = 1 (NOTIF_A_CLIENT only).
--   If the result is still 3, the correction was not applied correctly.
--
-- Test 13 expected (post-correction):
--   As client@veroxa.test: activity_logs count = 0.
--   If the result is still 1, the correction was not applied correctly.
--
-- Quick policy audit (run as postgres/service_role):
-- select policyname, qual
-- from pg_policies
-- where tablename in ('notifications','activity_logs')
--   and policyname in (
--     'notifications_select_assigned_team',
--     'activity_logs_select_assigned_team'
--   );
-- Both quals should contain 'is_assigned_to_client', NOT 'can_view_client'.
--
-- =============================================================================
-- REMINDER: this file is in docs/sql_drafts/migrations_review/, NOT in
-- supabase/migrations/. It has not been applied to any database.
-- Apply to the dev project ONLY, then re-run Tests 7 + 13.
-- =============================================================================
