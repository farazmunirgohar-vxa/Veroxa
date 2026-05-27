-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW CORRECTION DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- AUTH_MODE remains "placeholder".
-- =============================================================================
--
-- Migration 005 — Staff SELECT policy correction (DRAFT)
--
-- Purpose:
--   Mirror the M003 and M004 staff-policy corrections (see
--   003_team_scope_correction_draft.sql and
--   004_posts_select_staff_correction_draft.sql) for the two staff
--   SELECT policies introduced in M005:
--
--     * weekly_reports_select_staff
--     * monthly_reports_select_staff
--
--   Both currently use private.can_view_client(client_id). That helper
--   returns TRUE for client-role users who own the client_id (it
--   short-circuits via private.current_user_client_id()), so the staff
--   SELECT policy is technically also matched by the client role. The
--   client-role rows are already gated by the dedicated
--   weekly_reports_select_own_client / monthly_reports_select_own_client
--   policies (which also enforce status='published'), so this is not an
--   active leak — but it is a defense-in-depth defect: any future change
--   to the staff policy (e.g. relaxing the published-only filter, or
--   widening the projection) would silently apply to the client role too.
--
--   The corrected staff policies use private.is_assigned_to_client
--   instead. That helper is staff-scoped — it returns TRUE only for
--   team members assigned to the client, and short-circuits TRUE for
--   operator / owner. It returns FALSE for the client role. This makes
--   the staff vs. client policy split strict and self-documenting.
--
-- Why this is shipped as a correction draft rather than an in-place
-- edit to 005_reporting_foundation_draft.sql:
--   * M005 has not been applied yet. Once the user runs the m005 dev
--     test package, this correction must be applied alongside it so the
--     03_tests file's "EXPECTED: staff policy does NOT match for client
--     role" assertions actually pass. Keeping the correction separate
--     mirrors the m003 / m004 review pattern and preserves a clean diff
--     for the audit log.
--
-- Required pre-existing objects (all from M001 / M005):
--   * private.is_assigned_to_client(uuid)     (M001 — staff-scoped helper)
--   * public.weekly_reports                    (M005)
--   * public.monthly_reports                   (M005)
--   * policy weekly_reports_select_staff       (M005)
--   * policy monthly_reports_select_staff      (M005)
--
-- Apply ORDER:
--   * After 005_reporting_foundation_draft.sql.
--   * The 03_tests file in the m005 dev test package will fail without
--     this correction applied (the client-role-cannot-match-staff-policy
--     assertions).
--
-- This draft does NOT change:
--   * any base-table column, index, trigger, or RLS enable flag
--   * any other M005 policy (own_client SELECT, team manage, operator
--     manage, owner all are untouched)
--   * any client-portal view (client_portal_weekly_reports_view and
--     client_portal_monthly_reports_view are unchanged)
--   * AUTH_MODE
--   * supabase/migrations
--   * pricing
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. weekly_reports — replace staff SELECT policy
-- -----------------------------------------------------------------------------
--
-- Previous (from 005_reporting_foundation_draft.sql, lines 205-209):
--   create policy weekly_reports_select_staff
--     on public.weekly_reports
--     for select
--     to authenticated
--     using (private.can_view_client(client_id));
--
-- Defect: can_view_client is TRUE for the client role on rows where
-- client_id = private.current_user_client_id(), so a client-role user
-- matches BOTH this staff policy AND the own_client policy. The
-- own_client policy still narrows to status='published', but a
-- defense-in-depth audit should not rely on that ordering.

drop policy if exists weekly_reports_select_staff
  on public.weekly_reports;

create policy weekly_reports_select_staff
  on public.weekly_reports
  for select
  to authenticated
  using (private.is_assigned_to_client(client_id));

comment on policy weekly_reports_select_staff on public.weekly_reports is
  'Staff SELECT — team sees assigned-client reports in all statuses; operator/owner short-circuit via is_assigned_to_client. Uses is_assigned_to_client (NOT can_view_client) so the client role never matches this policy. Corrected from the original M005 draft as part of the M005 review pass — mirrors the M003 / M004 staff-policy corrections.';


-- -----------------------------------------------------------------------------
-- 2. monthly_reports — replace staff SELECT policy
-- -----------------------------------------------------------------------------
--
-- Previous (from 005_reporting_foundation_draft.sql, lines 267-271):
--   create policy monthly_reports_select_staff
--     on public.monthly_reports
--     for select
--     to authenticated
--     using (private.can_view_client(client_id));
--
-- Same defect, same fix.

drop policy if exists monthly_reports_select_staff
  on public.monthly_reports;

create policy monthly_reports_select_staff
  on public.monthly_reports
  for select
  to authenticated
  using (private.is_assigned_to_client(client_id));

comment on policy monthly_reports_select_staff on public.monthly_reports is
  'Staff SELECT — team sees assigned-client reports in all statuses; operator/owner short-circuit via is_assigned_to_client. Uses is_assigned_to_client (NOT can_view_client) so the client role never matches this policy. Corrected from the original M005 draft as part of the M005 review pass — mirrors the M003 / M004 staff-policy corrections.';


commit;

-- =============================================================================
-- REMINDER: this file is in docs/sql_drafts/migrations_review/, NOT in
-- supabase/migrations/. It has not been applied to any database. It must
-- be applied AFTER 005_reporting_foundation_draft.sql and BEFORE the
-- m005 dev test package's 03_tests file is run.
-- =============================================================================
