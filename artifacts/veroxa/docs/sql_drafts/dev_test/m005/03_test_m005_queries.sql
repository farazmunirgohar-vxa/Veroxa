-- =============================================================================
-- M005 Dev Test — Step 3: Test Queries
--
-- ⚠ REPLACE PLACEHOLDERS BEFORE RUNNING
--   <<CLIENT_A_UUID>>  — auth.uid() of client@veroxa.test  (linked to Restaurant A)
--   <<TEAM_A_UUID>>    — auth.uid() of team@veroxa.test    (assigned A, executor)
--   <<TEAM_B_UUID>>    — auth.uid() of team2@veroxa.test   (assigned B, reporter)
--   <<OPERATOR_UUID>>  — auth.uid() of operator@veroxa.test
--   <<OWNER_UUID>>     — auth.uid() of owner@veroxa.test
--
-- Run each numbered block separately. Per-user blocks wrap queries in
-- a transaction with `set local role authenticated` + `set local
-- "request.jwt.claims"` so RLS evaluates as if that user is signed in.
-- Every per-user block ends with `rollback;` so seed data is preserved.
--
-- Record PASS / FAIL in 04_m005_test_results.md as you go.
--
-- ACCEPTANCE COVERAGE — M005 staff-policy correction
--   * "Client cannot read draft weekly_reports → 0"
--     is covered by Test 2 (drafted_count and validated_count both
--     expected 0 for client@A against WR_A1/WR_A2) AND by Test 2c
--     below (explicit named acceptance check).
--   * "Client cannot read operator_review monthly_reports → 0"
--     is covered by Test 5 (op_review_visible expected 0) AND by
--     Test 5d below (explicit named acceptance check on MR_A2 by id).
--   Both rely on weekly_reports_select_staff / monthly_reports_select_staff
--   using `is_assigned_to_client` instead of `can_view_client`. With the
--   previous broken policies, the client would have been able to read
--   own-tenant rows in any status via the staff SELECT short-circuit.
-- =============================================================================


-- =============================================================================
-- Test 1 — Client sees only own published weekly reports
-- =============================================================================
-- Expected:
--   client_portal_weekly_reports_view  → 2 rows (WR_A3, WR_A4)
--   weekly_reports (base table)        → 2 rows (same)
--   No B rows; no drafted/validated.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as view_count from public.client_portal_weekly_reports_view;
  -- EXPECTED: 2

  select id, status, client_id from public.weekly_reports order by week_start desc;
  -- EXPECTED: 2 rows, both client_id=A, both status='published'

  select count(*) as draft_or_validated_visible
  from public.weekly_reports
  where status in ('drafted','validated');
  -- EXPECTED: 0
rollback;


-- =============================================================================
-- Test 2 — Client cannot see draft / validated weekly reports
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as drafted_count
  from public.weekly_reports
  where id = 'a5000001-0000-4000-a000-000000000001';
  -- EXPECTED: 0  (WR_A1 is drafted, invisible to client)

  select count(*) as validated_count
  from public.weekly_reports
  where id = 'a5000001-0000-4000-a000-000000000002';
  -- EXPECTED: 0  (WR_A2 is validated, invisible to client)

  select count(*) as via_view
  from public.client_portal_weekly_reports_view
  where id in (
    'a5000001-0000-4000-a000-000000000001',
    'a5000001-0000-4000-a000-000000000002'
  );
  -- EXPECTED: 0
rollback;

-- 2c. ACCEPTANCE — client attempting to read draft weekly reports.
--     Confirms weekly_reports_select_staff uses is_assigned_to_client
--     (NOT can_view_client). If this returns > 0, the staff policy is
--     still broken and the correction in 01_apply_m005.sql has not
--     been applied.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as client_reads_drafted_weekly
  from public.weekly_reports
  where status = 'drafted';
  -- EXPECTED: 0
rollback;


-- =============================================================================
-- Test 3 — Client cannot see internal_validation_note through the view
-- =============================================================================
-- Column-hiding test on the view.
select column_name from information_schema.columns
where table_schema='public'
  and table_name='client_portal_weekly_reports_view'
  and column_name='internal_validation_note';
-- EXPECTED: 0 rows (column not on the view)

-- And the view does not even resolve the column name:
select string_agg(column_name, ',' order by ordinal_position) as view_columns
from information_schema.columns
where table_schema='public' and table_name='client_portal_weekly_reports_view';
-- EXPECTED contains: id,client_id,week_start,week_end,posts_planned,posts_published,
--                    top_post_id,client_safe_summary,published_at,client_safe_summary_json

-- Doc check (portal must query the view, not the base table):
-- grep portal source for direct 'from weekly_reports' / '.from("weekly_reports")' — done in app review, NOT in SQL.


-- =============================================================================
-- Test 4 — Client sees only own published monthly reports
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as view_count from public.client_portal_monthly_reports_view;
  -- EXPECTED: 1  (MR_A4, month 2026-02)

  select month_key, status
  from public.monthly_reports
  order by month_key desc;
  -- EXPECTED: 1 row, month_key='2026-02', status='published'
rollback;


-- =============================================================================
-- Test 5 — Client cannot see drafting / operator_review / approved monthlies
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as drafting_visible
  from public.monthly_reports
  where status='drafting';
  -- EXPECTED: 0

  select count(*) as approved_visible
  from public.monthly_reports
  where id='a5000002-0000-4000-a000-000000000003';
  -- EXPECTED: 0  (MR_A3 is approved-but-not-published; client cannot see)

  select count(*) as op_review_visible
  from public.monthly_reports
  where status='operator_review';
  -- EXPECTED: 0
rollback;

-- 5d. ACCEPTANCE — client attempting to read operator_review monthly
--     reports by id. Confirms monthly_reports_select_staff uses
--     is_assigned_to_client (NOT can_view_client). If this returns
--     > 0, the correction in 01_apply_m005.sql has not been applied.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as client_reads_op_review_monthly
  from public.monthly_reports
  where id = 'a5000002-0000-4000-a000-000000000002';
  -- EXPECTED: 0  (MR_A2 is operator_review; client of A must not see it)
rollback;


-- =============================================================================
-- Test 6 — Team can draft assigned client weekly reports
-- =============================================================================
-- 6a. team@A can INSERT for A; default status='drafted'.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  insert into public.weekly_reports
    (client_id, week_start, week_end, draft_owner_id)
  values
    ('a0000000-0000-4000-a000-00000000000a', '2026-05-11', '2026-05-17', '<<TEAM_A_UUID>>')
  returning id, status;
  -- EXPECTED: status='drafted'
rollback;

-- 6b. team@A can flip drafted -> validated on own draft.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  update public.weekly_reports
     set status='validated', validation_owner_id='<<TEAM_A_UUID>>'
   where id='a5000001-0000-4000-a000-000000000001'
   returning id, status;
  -- EXPECTED: 1 row, status='validated'
rollback;

-- 6c. team@A INSERT for client B → denied (0 rows or RLS error).
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  insert into public.weekly_reports
    (client_id, week_start, week_end)
  values
    ('b0000000-0000-4000-b000-00000000000b', '2026-05-11', '2026-05-17')
  returning id;
  -- EXPECTED: ERROR  "new row violates row-level security policy"
rollback;

-- 6d. team@A cannot publish (WITH CHECK forbids status='published').
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  update public.weekly_reports
     set status='published', published_at=now()
   where id='a5000001-0000-4000-a000-000000000002'
   returning id, status;
  -- EXPECTED: ERROR "new row violates row-level security policy"
rollback;

-- 6e. team2 (B, reporter role) INSERT for B → denied (reporter excluded from can_manage_client_operations).
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_B_UUID>>","role":"authenticated"}';

  insert into public.weekly_reports
    (client_id, week_start, week_end)
  values
    ('b0000000-0000-4000-b000-00000000000b', '2026-05-11', '2026-05-17')
  returning id;
  -- EXPECTED: ERROR  "new row violates row-level security policy"
rollback;

-- 6f. team2 (B, reporter) can SELECT B's reports via select_staff.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_B_UUID>>","role":"authenticated"}';

  select count(*) as b_visible from public.weekly_reports
  where client_id='b0000000-0000-4000-b000-00000000000b';
  -- EXPECTED: 2
rollback;


-- =============================================================================
-- Test 7 — Team cannot approve / publish monthly reports
-- =============================================================================
-- 7a. team@A flip operator_review → approved → denied (WITH CHECK).
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  update public.monthly_reports
     set status='approved', approved_by_user_id='<<TEAM_A_UUID>>'
   where id='a5000002-0000-4000-a000-000000000002'
   returning id, status;
  -- EXPECTED: ERROR "new row violates row-level security policy"
rollback;

-- 7b. team@A drafting → operator_review on MR_A1 succeeds.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  update public.monthly_reports
     set status='operator_review'
   where id='a5000002-0000-4000-a000-000000000001'
   returning id, status;
  -- EXPECTED: 1 row, status='operator_review'
rollback;

-- 7c. team@A flip anything → published → denied.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  update public.monthly_reports
     set status='published', approved_by_user_id='<<TEAM_A_UUID>>', published_at=now()
   where id='a5000002-0000-4000-a000-000000000002'
   returning id, status;
  -- EXPECTED: ERROR "new row violates row-level security policy"
rollback;


-- =============================================================================
-- Test 8 — Operator approval gate (CORE M005 PROTECTION)
-- =============================================================================
-- 8a. operator approve MR_A2 (operator_review → approved) succeeds.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';

  update public.monthly_reports
     set status='approved', approved_by_user_id='<<OPERATOR_UUID>>'
   where id='a5000002-0000-4000-a000-000000000002'
   returning id, status, approved_by_user_id;
  -- EXPECTED: 1 row, status='approved', approved_by_user_id matches
rollback;

-- 8b. operator publish MR_A3 (approved, approved_by_user_id IS NOT NULL) succeeds.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';

  update public.monthly_reports
     set status='published', published_at=now()
   where id='a5000002-0000-4000-a000-000000000003'
   returning id, status, approved_by_user_id, published_at;
  -- EXPECTED: 1 row, status='published', approved_by_user_id NOT NULL, published_at set
rollback;

-- 8c. operator publish MR_A2 (operator_review) without setting approved_by → denied by WITH CHECK.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';

  update public.monthly_reports
     set status='published', published_at=now()
   where id='a5000002-0000-4000-a000-000000000002'
   returning id, status;
  -- EXPECTED: ERROR "new row violates row-level security policy"
  --           (approval gate: status='published' but approved_by_user_id IS NULL)
rollback;

-- 8d. operator publish MR_A2 with approved_by set in the same UPDATE → succeeds.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';

  update public.monthly_reports
     set status='published',
         approved_by_user_id='<<OPERATOR_UUID>>',
         published_at=now()
   where id='a5000002-0000-4000-a000-000000000002'
   returning id, status, approved_by_user_id;
  -- EXPECTED: 1 row, status='published', approved_by_user_id NOT NULL
rollback;


-- =============================================================================
-- Test 9 — Owner can view all reports + approval gate still applies
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';

  select count(*) as weekly_all from public.weekly_reports;
  -- EXPECTED: 6  (4 A + 2 B)

  select count(*) as monthly_all from public.monthly_reports;
  -- EXPECTED: 6

  -- Owner can read internal_validation_note + raw summary_json.
  select internal_validation_note, summary_json
  from public.weekly_reports
  where id='a5000001-0000-4000-a000-000000000003';
  -- EXPECTED: 1 row, both columns populated
rollback;

-- 9b. owner publish operator_review row without approved_by → denied (owner does not bypass gate).
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';

  update public.monthly_reports
     set status='published', published_at=now()
   where id='a5000002-0000-4000-a000-000000000002'
   returning id;
  -- EXPECTED: ERROR "new row violates row-level security policy"
rollback;

-- 9c. owner publish + set approved_by in same UPDATE → succeeds.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';

  update public.monthly_reports
     set status='published',
         approved_by_user_id='<<OWNER_UUID>>',
         published_at=now()
   where id='a5000002-0000-4000-a000-000000000002'
   returning id, status, approved_by_user_id;
  -- EXPECTED: 1 row, all fields set
rollback;


-- =============================================================================
-- Test 10 — Unique constraints + month_key regex
-- =============================================================================
-- 10a. Duplicate (client_id, week_start) → fails.
begin;
  insert into public.weekly_reports
    (client_id, week_start, week_end)
  values
    ('a0000000-0000-4000-a000-00000000000a', '2026-05-04', '2026-05-10');
  -- EXPECTED: ERROR duplicate key value violates unique constraint
rollback;

-- 10b. Same week_start, different client → succeeds.
begin;
  insert into public.weekly_reports
    (client_id, week_start, week_end)
  values
    ('b0000000-0000-4000-b000-00000000000b', '2026-04-13', '2026-04-19');
  -- EXPECTED: INSERT 0 1
rollback;

-- 10c. Duplicate (client_id, month_key) → fails.
begin;
  insert into public.monthly_reports
    (client_id, month_key) values
    ('a0000000-0000-4000-a000-00000000000a', '2026-05');
  -- EXPECTED: ERROR duplicate key
rollback;

-- 10d. month_key='2026-13' → check violation.
begin;
  insert into public.monthly_reports
    (client_id, month_key) values
    ('a0000000-0000-4000-a000-00000000000a', '2026-13');
  -- EXPECTED: ERROR new row for relation "monthly_reports" violates check constraint
rollback;

-- 10e. month_key='26-05' → check violation (4-digit year required).
begin;
  insert into public.monthly_reports
    (client_id, month_key) values
    ('a0000000-0000-4000-a000-00000000000a', '26-05');
  -- EXPECTED: ERROR violates check constraint
rollback;


-- =============================================================================
-- Test 11 — Cross-tenant isolation
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as b_visible_to_a
  from public.weekly_reports
  where client_id='b0000000-0000-4000-b000-00000000000b';
  -- EXPECTED: 0

  select count(*) as b_visible_via_view
  from public.client_portal_weekly_reports_view
  where client_id='b0000000-0000-4000-b000-00000000000b';
  -- EXPECTED: 0
rollback;

-- 11b. team@A SELECT B's reports → 0 (assigned to A only).
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  select count(*) as b_visible_to_team_a from public.weekly_reports
  where client_id='b0000000-0000-4000-b000-00000000000b';
  -- EXPECTED: 0

  select count(*) as b_monthly_visible_to_team_a from public.monthly_reports
  where client_id='b0000000-0000-4000-b000-00000000000b';
  -- EXPECTED: 0
rollback;

-- 11c. team@A UPDATE on B's report → 0 rows affected.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  update public.weekly_reports
     set client_safe_summary='gotcha'
   where client_id='b0000000-0000-4000-b000-00000000000b';
  -- EXPECTED: UPDATE 0
rollback;


-- =============================================================================
-- Test 12 — Cascade behavior
-- =============================================================================
-- 12a. Delete posts → top_post_id becomes NULL.
begin;
  -- Inspect first: which weekly_reports point at POST_A2?
  select id from public.weekly_reports
   where top_post_id = 'a4000001-0000-4000-a000-000000000002';
  -- EXPECTED: 2 rows (WR_A1, WR_A3)

  delete from public.posts where id = 'a4000001-0000-4000-a000-000000000002';
  -- EXPECTED: DELETE 1

  select id, top_post_id from public.weekly_reports
   where id in ('a5000001-0000-4000-a000-000000000001',
                'a5000001-0000-4000-a000-000000000003');
  -- EXPECTED: 2 rows, both top_post_id = NULL (set null on delete)
rollback;

-- 12b. Delete client → cascades to all weekly + monthly reports.
begin;
  delete from public.clients where id = 'b0000000-0000-4000-b000-00000000000b';
  select count(*) as b_weekly_remaining from public.weekly_reports
   where client_id = 'b0000000-0000-4000-b000-00000000000b';
  -- EXPECTED: 0
  select count(*) as b_monthly_remaining from public.monthly_reports
   where client_id = 'b0000000-0000-4000-b000-00000000000b';
  -- EXPECTED: 0
rollback;


-- =============================================================================
-- Test 13 — Anon access fully blocked
-- =============================================================================
begin;
  set local role anon;

  select count(*) as weekly_anon from public.weekly_reports;
  -- EXPECTED: 0 (RLS denies; all policies `to authenticated`)

  select count(*) as monthly_anon from public.monthly_reports;
  -- EXPECTED: 0

  select count(*) as weekly_view_anon from public.client_portal_weekly_reports_view;
  -- EXPECTED: 0 OR ERROR permission denied (depends on GRANT to anon — view was granted to authenticated only)
rollback;

-- 13b. Anon INSERT → denied.
begin;
  set local role anon;
  insert into public.weekly_reports (client_id, week_start, week_end)
  values ('a0000000-0000-4000-a000-00000000000a', '2026-06-01', '2026-06-07');
  -- EXPECTED: ERROR (RLS or permission denied)
rollback;


-- =============================================================================
-- Test 14 — View column conformance
-- =============================================================================
select string_agg(column_name, ',' order by ordinal_position) as weekly_view_cols
from information_schema.columns
where table_schema='public'
  and table_name='client_portal_weekly_reports_view';
-- EXPECTED: id,client_id,week_start,week_end,posts_planned,posts_published,top_post_id,
--           client_safe_summary,published_at,client_safe_summary_json

select string_agg(column_name, ',' order by ordinal_position) as monthly_view_cols
from information_schema.columns
where table_schema='public'
  and table_name='client_portal_monthly_reports_view';
-- EXPECTED: id,client_id,month_key,client_safe_summary,published_at,client_safe_summary_json

-- 14b. client_safe_summary_json equals summary_json->'client_safe' (spot check).
select id,
       (select summary_json->'client_safe' from public.weekly_reports w where w.id = v.id) as expected,
       v.client_safe_summary_json as actual
from public.client_portal_weekly_reports_view v
limit 5;
-- EXPECTED: each row's expected = actual (JSON equality)


-- =============================================================================
-- Test 15 — security_invoker on views
-- =============================================================================
select c.relname, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public'
  and c.relname in ('client_portal_weekly_reports_view','client_portal_monthly_reports_view');
-- EXPECTED: 2 rows, each reloptions contains 'security_invoker=true'

-- 15b. Client querying view returns only own published rows even though
--      the view itself has no client_id WHERE clause.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select distinct client_id from public.client_portal_weekly_reports_view;
  -- EXPECTED: 1 row, client_id = A
rollback;


-- =============================================================================
-- Test 16 — Helper short-circuits still apply
-- =============================================================================
-- 16a. Operator sees all rows.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';

  select count(*) as op_weekly_count from public.weekly_reports;
  -- EXPECTED: 6
  select count(*) as op_monthly_count from public.monthly_reports;
  -- EXPECTED: 6
rollback;

-- 16b. team@A with is_active=false loses both SELECT and management.
--      (Flip is_active outside the per-user transaction so the change persists.)
update public.team_members
   set is_active = false
 where user_id = '<<TEAM_A_UUID>>';

begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  select count(*) as a_visible_after_deactivate from public.weekly_reports
   where client_id='a0000000-0000-4000-a000-00000000000a';
  -- EXPECTED: 0
rollback;

-- Restore team_members.is_active = true so subsequent runs work.
update public.team_members
   set is_active = true
 where user_id = '<<TEAM_A_UUID>>';
