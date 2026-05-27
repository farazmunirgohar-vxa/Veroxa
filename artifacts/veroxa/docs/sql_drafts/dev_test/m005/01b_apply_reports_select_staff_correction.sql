-- =============================================================================
-- M005 Dev Test — Step 1b: Apply Reports Staff-Policy Correction
--
-- Source:
--   docs/sql_drafts/migrations_review/005_reports_select_staff_correction_draft.sql
--
-- Purpose:
--   Close the same `can_view_client` over-broad-scope defect that was
--   corrected on M003 (notifications/media) and M004 (posts/post_slots),
--   but for M005's two staff SELECT policies on the report tables:
--     * weekly_reports_select_staff
--     * monthly_reports_select_staff
--
--   Without this correction, any authenticated staff user can SELECT
--   every weekly_reports / monthly_reports row regardless of their
--   team_client_assignments — the same defect class that 01c closed on
--   M003 and M004. After this correction, staff SELECT is restricted to
--   reports for clients they are explicitly assigned to via
--   `private.is_assigned_to_client(client_id)`.
--
-- WHEN TO RUN:
--   Run AFTER `01_apply_m005.sql` and BEFORE `02_seed_m005_dev_data.sql`
--   (the seed and tests assume the corrected behavior). May also be run
--   after the seed if you want to first observe the defect.
--
-- Preconditions:
--   * M001 through M004 applied and green (including m003/01c team-scope
--     correction and m004/01c posts/post_slots staff-policy correction).
--   * M005 apply (01_apply_m005.sql) already run on this dev project.
--   * `private.is_assigned_to_client(uuid)` exists (created in M002 / M003).
--   * Dev project only — never production.
--   * AUTH_MODE stays "placeholder".
--
-- Hard invariants — unchanged by this file:
--   * AUTH_MODE remains the literal string "placeholder".
--   * No file is added to supabase/migrations/. This SQL stays under
--     docs/sql_drafts/.
--   * The portal stays disconnected from any real database in this phase.
--   * Locked pricing unchanged. Roles unchanged. Fixtures only.
-- =============================================================================

begin;

-- Fix 1 of 2 — weekly_reports_select_staff
drop policy if exists weekly_reports_select_staff on public.weekly_reports;

create policy weekly_reports_select_staff
  on public.weekly_reports
  for select
  to authenticated
  using (private.is_assigned_to_client(client_id));

-- Fix 2 of 2 — monthly_reports_select_staff
drop policy if exists monthly_reports_select_staff on public.monthly_reports;

create policy monthly_reports_select_staff
  on public.monthly_reports
  for select
  to authenticated
  using (private.is_assigned_to_client(client_id));

commit;

-- Quick verification:
select tablename, policyname, qual
from pg_policies
where (tablename = 'weekly_reports'  and policyname = 'weekly_reports_select_staff')
   or (tablename = 'monthly_reports' and policyname = 'monthly_reports_select_staff');
-- EXPECTED: both rows; qual contains 'is_assigned_to_client', NOT 'can_view_client'.

-- Then proceed to 02_seed_m005_dev_data.sql (or re-run 03 tests if you
-- applied this correction after the seed/test pass).
