-- =============================================================================
-- M003 TEST QUERIES — DEV ONLY
--
-- Run AFTER 01_apply_m003.sql + 01b_apply_notifications_status_guard.sql
-- + 02_seed_m003_dev_data.sql.
--
-- Paste each numbered block separately. Per-user blocks wrap in
-- transactions and end with `rollback;` so no mutation persists.
--
-- REPLACE PLACEHOLDERS:
--   <<OWNER_UUID>>     — owner@veroxa.test
--   <<OPERATOR_UUID>>  — operator@veroxa.test
--   <<TEAM_UUID>>      — team@veroxa.test
--   <<CLIENT_UUID>>    — client@veroxa.test
--
-- Fixed (do NOT replace):
--   TEAM2_UUID              = '12222222-2222-4222-a222-222222222222'
--   CLIENT_A_ID             = 'a0000000-0000-4000-a000-00000000000a'
--   CLIENT_B_ID             = 'b0000000-0000-4000-b000-00000000000b'
--   MEDIA_A_CLIENT_UPLOADED = 'a0000001-0000-4000-a000-00000000000a'
--   MEDIA_A_TEAM_PENDING    = 'a0000002-0000-4000-a000-00000000000a'
--   MEDIA_A_TEAM_APPROVED   = 'a0000003-0000-4000-a000-00000000000a'
--   MEDIA_B_1               = 'b0000001-0000-4000-b000-00000000000b'
--   NOTIF_A_CLIENT          = 'a000000a-0001-4000-a000-00000000000a'
--   NOTIF_A_TEAM            = 'a000000a-0002-4000-a000-00000000000a'
--   NOTIF_A_OPERATOR        = 'a000000a-0003-4000-a000-00000000000a'
--   NOTIF_B_CLIENT          = 'b000000b-0001-4000-b000-00000000000b'
-- =============================================================================


-- =============================================================================
-- TEST 1 — media_assets: client own-write rules
-- =============================================================================

-- 1a. client inserts for own client with defaults → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.media_assets (client_id, file_url, file_type, mime_type)
values ('a0000000-0000-4000-a000-00000000000a', 'https://example.test/a/new.jpg', 'image', 'image/jpeg')
returning client_id, source_type, review_status;
-- EXPECTED: 1 row, source_type='client_upload', review_status='uploaded'
rollback;

-- 1b. client inserts for OTHER client → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.media_assets (client_id, file_url, file_type, mime_type)
values ('b0000000-0000-4000-b000-00000000000b', 'https://example.test/cross.jpg', 'image', 'image/jpeg');
-- EXPECTED: ERROR — new row violates row-level security policy
rollback;

-- 1c. client tries source_type='team_upload' → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.media_assets (client_id, file_url, file_type, mime_type, source_type)
values ('a0000000-0000-4000-a000-00000000000a', 'https://example.test/a/bad.jpg', 'image', 'image/jpeg', 'team_upload');
-- EXPECTED: ERROR — RLS with check fails (source_type pinned)
rollback;

-- 1d. client tries review_status='approved' → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.media_assets (client_id, file_url, file_type, mime_type, review_status)
values ('a0000000-0000-4000-a000-00000000000a', 'https://example.test/a/bad.jpg', 'image', 'image/jpeg', 'approved');
-- EXPECTED: ERROR — RLS with check fails (review_status pinned)
rollback;

-- 1e. client tries source_type='legacy_reuse' → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.media_assets (client_id, file_url, file_type, mime_type, source_type)
values ('a0000000-0000-4000-a000-00000000000a', 'https://example.test/a/bad.jpg', 'image', 'image/jpeg', 'legacy_reuse');
-- EXPECTED: ERROR — RLS with check fails
rollback;


-- =============================================================================
-- TEST 2 — media_assets: client read scoping
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';

-- 2a. client sees only A's rows
select count(*) filter (where client_id = 'a0000000-0000-4000-a000-00000000000a') as for_a,
       count(*) filter (where client_id = 'b0000000-0000-4000-b000-00000000000b') as for_b
from public.media_assets;
-- EXPECTED: for_a=3, for_b=0

-- 2b. cross-tenant probe
select count(*) as sees_b from public.media_assets
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0

rollback;


-- =============================================================================
-- TEST 3 — media_assets: client cannot edit staff fields
-- =============================================================================

-- 3a. client tries to set review_status → 0 rows (no client UPDATE policy)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.media_assets set review_status = 'approved'
where id = 'a0000001-0000-4000-a000-00000000000a';
-- EXPECTED: 0 rows updated
rollback;

-- 3b. client tries internal_note → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.media_assets set internal_note = 'hacked'
where id = 'a0000001-0000-4000-a000-00000000000a';
-- EXPECTED: 0 rows updated
rollback;

-- 3c. client tries quality_score → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.media_assets set quality_score = 99
where id = 'a0000001-0000-4000-a000-00000000000a';
-- EXPECTED: 0 rows updated
rollback;


-- =============================================================================
-- TEST 4 — Client portal media view (DEFERRED to portal-connect pass)
-- =============================================================================
select * from public.client_portal_media_view limit 1;
-- EXPECTED: ERROR — relation "public.client_portal_media_view" does not exist
-- Action: record as "deferred to portal-connect pass" pass.


-- =============================================================================
-- TEST 5 — media_assets: team can review assigned, not unassigned
-- =============================================================================

-- 5a. team@ (assigned A executor) updates A's row → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.media_assets
set review_status = 'approved', internal_note = 'looks good'
where id = 'a0000001-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated
rollback;

-- 5b. team@ updates B's row → 0 rows (not assigned to B)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.media_assets set review_status = 'approved'
where id = 'b0000001-0000-4000-b000-00000000000b';
-- EXPECTED: 0 rows updated
rollback;

-- 5c. team2@ (assigned B reporter) updates B's row → 0 rows (reporter excluded)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"12222222-2222-4222-a222-222222222222","role":"authenticated"}';
update public.media_assets set review_status = 'approved'
where id = 'b0000001-0000-4000-b000-00000000000b';
-- EXPECTED: 0 rows updated
rollback;


-- =============================================================================
-- TEST 6 — media_assets: operator / owner full operational access
-- =============================================================================

-- 6a. operator SELECT all
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select count(*) as operator_sees from public.media_assets;
-- EXPECTED: 5
rollback;

-- 6b. operator UPDATE any row → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.media_assets set review_status = 'usable'
where id = 'b0000001-0000-4000-b000-00000000000b';
-- EXPECTED: 1 row updated
rollback;

-- 6c. owner SELECT/UPDATE/DELETE → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
select count(*) as owner_sees from public.media_assets;
-- EXPECTED: 5
update public.media_assets set review_status = 'rejected'
where id = 'b0000002-0000-4000-b000-00000000000b';
-- EXPECTED: 1 row updated
delete from public.media_assets where id = 'b0000002-0000-4000-b000-00000000000b';
-- EXPECTED: 1 row deleted
rollback;


-- =============================================================================
-- TEST 7 — notifications: client scoping
--
-- ⚠ PREDICTED FAILURE — M003 SOURCE-DRAFT DEFECT (see README "Predicted
-- source-draft defects"). The policy `notifications_select_assigned_team`
-- uses `can_view_client(client_id) AND target_role IN ('team','operator')`,
-- but `can_view_client` returns TRUE when the caller is the client of
-- p_client (M002 helper definition). So a client-role caller ALSO matches
-- this "staff" policy whenever target_role is team/operator on their own
-- client.
--
-- Plan-intended result:   client_sees=1, as_client_role=1 (NOTIF_A_CLIENT only)
-- Predicted actual result: client_sees=3 (NOTIF_A_CLIENT + NOTIF_A_TEAM +
--                                         NOTIF_A_OPERATOR)
--
-- Record the actual count. If client_sees=3, mark this as FAIL and link to
-- the README defect note — the M003 source draft needs a correction (replace
-- `can_view_client` with `is_assigned_to_client`, or add an explicit role
-- check) before promotion.
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select count(*) as client_sees, count(*) filter (where target_role='client') as as_client_role
from public.notifications;
-- PLAN-INTENDED: client_sees=1, as_client_role=1
-- PREDICTED ACTUAL: client_sees=3, as_client_role=1

select id, target_role, client_id from public.notifications;
-- PLAN-INTENDED: NOTIF_A_CLIENT row only
-- PREDICTED ACTUAL: NOTIF_A_CLIENT + NOTIF_A_TEAM + NOTIF_A_OPERATOR

rollback;


-- =============================================================================
-- TEST 8 — notifications: client status flip (baseline RLS, pre-guard logic)
-- Note: guard tests come in Test 21 below.
-- =============================================================================

-- 8a. client sets status='seen' on own notification → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set status = 'seen'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: 1 row updated
rollback;

-- 8b. client sets status='dismissed' on own → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set status = 'dismissed'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: 1 row updated
rollback;

-- 8c. client sets status on B's notification → 0 rows (RLS hides the row)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set status = 'seen'
where id = 'b000000b-0001-4000-b000-00000000000b';
-- EXPECTED: 0 rows updated
rollback;


-- =============================================================================
-- TEST 9 — notifications: team scoping
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';

select target_role, client_id from public.notifications order by target_role;
-- EXPECTED: rows with target_role in ('team','operator') for client A only.
-- Does NOT include client/A or any B row.

select count(*) filter (where target_role='team')     as team_a,
       count(*) filter (where target_role='operator') as op_a,
       count(*) filter (where target_role='client')   as client_a,
       count(*) filter (where client_id = 'b0000000-0000-4000-b000-00000000000b') as any_b
from public.notifications;
-- EXPECTED: team_a=1, op_a=1, client_a=0, any_b=0

rollback;


-- =============================================================================
-- TEST 10 — notifications: operator / owner SELECT all
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select count(*) from public.notifications;
-- EXPECTED: 4
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
select count(*) from public.notifications;
-- EXPECTED: 4
rollback;


-- =============================================================================
-- TEST 11 — client_health_snapshots: system insert + client visibility
-- =============================================================================

-- 11a. service-role insert succeeds (run as postgres / superuser)
insert into public.client_health_snapshots (client_id, level, summary, created_by_role)
values ('a0000000-0000-4000-a000-00000000000a', 'critical', 'Test insert from service role', 'system')
returning id, level;
-- EXPECTED: 1 row
-- CLEANUP:
delete from public.client_health_snapshots where summary = 'Test insert from service role';

-- 11b. client SELECT own → returns rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select level, summary from public.client_health_snapshots
where client_id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: ≥ 1 row (the seeded attention snapshot)
rollback;


-- =============================================================================
-- TEST 12 — client_health_snapshots: append-only
-- =============================================================================

-- 12a. client UPDATE → 0 rows (no UPDATE policy for client)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.client_health_snapshots set level = 'healthy'
where id = 'a000000a-1000-4000-a000-00000000000a';
-- EXPECTED: 0 rows updated
rollback;

-- 12b. team UPDATE → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.client_health_snapshots set level = 'healthy'
where id = 'a000000a-1000-4000-a000-00000000000a';
-- EXPECTED: 0 rows updated
rollback;

-- 12c. operator UPDATE → 0 rows (operator policies are SELECT + INSERT only)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.client_health_snapshots set level = 'healthy'
where id = 'a000000a-1000-4000-a000-00000000000a';
-- EXPECTED: 0 rows updated
rollback;

-- 12d. owner UPDATE → 1 row updated (owner_all is `for all`)
-- This is the documented "owner-trusted" weakness (D4). Record actual.
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
update public.client_health_snapshots set level = 'healthy'
where id = 'a000000a-1000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated (owner is trusted; not true append-only against owner)
rollback;


-- =============================================================================
-- TEST 13 — activity_logs: client has no access
--
-- ⚠ PREDICTED FAILURE — M003 SOURCE-DRAFT DEFECT (same root cause as Test 7).
-- The policy `activity_logs_select_assigned_team` uses
-- `can_view_client(client_id) AND entity_type IN (allowlist)`. Since
-- `can_view_client` returns TRUE for a client viewing their own client_id,
-- a client-role caller matches this "staff" policy whenever entity_type is
-- on the allowlist. The seed includes 1 allowlisted row for A
-- (entity_type='media_assets'), so the client will see it.
--
-- Plan-intended result:   0 rows
-- Predicted actual result: 1 row (LOG_A_MEDIA)
--
-- Record actual. If non-zero, mark as FAIL and link to the README defect
-- note. Recommended correction: replace `can_view_client` with
-- `is_assigned_to_client` (which short-circuits operator but NOT client) or
-- add an explicit role check excluding 'client'.
-- =============================================================================

-- 13a. client SELECT
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select count(*) from public.activity_logs;
-- PLAN-INTENDED: 0
-- PREDICTED ACTUAL: 1
rollback;

-- 13b. client INSERT → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.activity_logs (client_id, entity_type, action_key, performed_by_role)
values ('a0000000-0000-4000-a000-00000000000a', 'media_assets', 'client_attempt', 'client');
-- EXPECTED: ERROR — RLS denial (no client INSERT policy)
rollback;


-- =============================================================================
-- TEST 14 — activity_logs: team allowlisted entity_types only
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';

-- 14a. team sees only the media_assets row for A
select entity_type, action_key, client_id from public.activity_logs
order by created_at;
-- EXPECTED: 1 row, entity_type='media_assets', client_id=A
-- Does NOT include the entity_type='clients' pricing-change row.
-- Does NOT include any B row.

select count(*) filter (where entity_type='media_assets') as media_rows,
       count(*) filter (where entity_type='clients')      as client_entity_rows,
       count(*) filter (where client_id = 'b0000000-0000-4000-b000-00000000000b') as any_b
from public.activity_logs;
-- EXPECTED: media_rows=1, client_entity_rows=0, any_b=0

rollback;


-- =============================================================================
-- TEST 15 — activity_logs: operator / owner SELECT all
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select count(*) from public.activity_logs;
-- EXPECTED: 3 (including the pricing-change row)
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
select count(*) from public.activity_logs;
-- EXPECTED: 3
rollback;


-- =============================================================================
-- TEST 16 — activity_logs: immutability (current draft behavior)
-- =============================================================================

-- 16a. client UPDATE → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.activity_logs set description = 'edited'
where id = 'a000000a-2001-4000-a000-00000000000a';
-- EXPECTED: 0 rows updated
rollback;

-- 16b. team UPDATE → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.activity_logs set description = 'edited'
where id = 'a000000a-2001-4000-a000-00000000000a';
-- EXPECTED: 0 rows updated
rollback;

-- 16c. operator UPDATE → 0 rows (operator has SELECT + INSERT only)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.activity_logs set description = 'edited'
where id = 'a000000a-2001-4000-a000-00000000000a';
-- EXPECTED: 0 rows updated
rollback;

-- 16d. owner UPDATE → 1 row updated (owner_all is `for all` — design choice D4)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
update public.activity_logs set description = 'owner edit'
where id = 'a000000a-2001-4000-a000-00000000000a';
-- EXPECTED: 1 row updated (owner-trusted; record this as the observed state)
rollback;


-- =============================================================================
-- TEST 17 — activity_logs: operator/owner manual insert
-- =============================================================================

-- 17a. operator manual INSERT → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
insert into public.activity_logs (entity_type, action_key, performed_by_role)
values ('clients', 'note_added', 'operator');
-- EXPECTED: 1 row inserted
rollback;

-- 17b. client manual INSERT → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.activity_logs (entity_type, action_key, performed_by_role)
values ('clients', 'note_added', 'client');
-- EXPECTED: ERROR — RLS denial
rollback;

-- 17c. team manual INSERT → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
insert into public.activity_logs (entity_type, action_key, performed_by_role)
values ('clients', 'note_added', 'team');
-- EXPECTED: ERROR — RLS denial
rollback;


-- =============================================================================
-- TEST 18 — Cascade behavior
-- =============================================================================

-- 18a. Delete a clients row → cascades on all 4 M003 tables
begin;
delete from public.clients where id = 'b0000000-0000-4000-b000-00000000000b';
select 'media_b'         as t, count(*) from public.media_assets             where client_id='b0000000-0000-4000-b000-00000000000b'
union all select 'notif_b',     count(*) from public.notifications            where client_id='b0000000-0000-4000-b000-00000000000b'
union all select 'snap_b',      count(*) from public.client_health_snapshots  where client_id='b0000000-0000-4000-b000-00000000000b'
union all select 'logs_b',      count(*) from public.activity_logs            where client_id='b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: all counts = 0
rollback;

-- 18b. Delete a user_profiles row → null-out on uploaded_by_user_id,
-- target_user_id, performed_by_user_id. (Skipped: deleting user_profiles
-- would cascade to auth.users via M001 PK FK and break seed. Documented
-- from schema.)


-- =============================================================================
-- TEST 19 — Cross-tenant probe
-- =============================================================================

-- 19a. client@ — every M003 table with B → denied or 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select 'media'    as t, count(*) from public.media_assets             where client_id='b0000000-0000-4000-b000-00000000000b'
union all select 'notif',  count(*) from public.notifications           where client_id='b0000000-0000-4000-b000-00000000000b'
union all select 'snap',   count(*) from public.client_health_snapshots where client_id='b0000000-0000-4000-b000-00000000000b'
union all select 'logs',   count(*) from public.activity_logs           where client_id='b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: all 0
rollback;

-- 19b. team@ (assigned A only) — same probe for B → 0
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
select 'media'    as t, count(*) from public.media_assets             where client_id='b0000000-0000-4000-b000-00000000000b'
union all select 'notif',  count(*) from public.notifications           where client_id='b0000000-0000-4000-b000-00000000000b'
union all select 'snap',   count(*) from public.client_health_snapshots where client_id='b0000000-0000-4000-b000-00000000000b'
union all select 'logs',   count(*) from public.activity_logs           where client_id='b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: all 0
rollback;


-- =============================================================================
-- TEST 20 — Anon access blocked
-- =============================================================================
begin;
set local role anon;
select count(*) as anon_media from public.media_assets;
-- EXPECTED: 0
rollback;

begin;
set local role anon;
select count(*) as anon_notif from public.notifications;
-- EXPECTED: 0
rollback;

begin;
set local role anon;
select count(*) as anon_snap from public.client_health_snapshots;
-- EXPECTED: 0
rollback;

begin;
set local role anon;
select count(*) as anon_logs from public.activity_logs;
-- EXPECTED: 0
rollback;

begin;
set local role anon;
insert into public.media_assets (client_id, file_url, file_type, mime_type)
values ('a0000000-0000-4000-a000-00000000000a', 'https://example.test/anon.jpg', 'image', 'image/jpeg');
-- EXPECTED: ERROR — RLS denial
rollback;


-- =============================================================================
-- TEST 21 — Notifications client-update column guard
-- (Requires 01b_apply_notifications_status_guard.sql to be applied first.)
-- =============================================================================

-- 21a. client status='seen' → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set status='seen'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: 1 row updated; updated_at advanced
select id, status, updated_at > created_at as advanced
from public.notifications where id = 'a000000a-0001-4000-a000-00000000000a';
rollback;

-- 21b. client status='dismissed' → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set status='dismissed'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: 1 row updated
rollback;

-- 21c. client status='escalated' → ERROR (only seen/dismissed allowed)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set status='escalated'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR — notifications_client_update_guard: ... only set status to seen or dismissed
rollback;

-- 21d. client status='created' → ERROR
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set status='created'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR — guard
rollback;

-- 21e. client title change → ERROR (protected column)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set title='hacked'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR — guard (protected column)
rollback;

-- 21f. message_body change → ERROR
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set message_body='hacked'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR
rollback;

-- 21g. priority change → ERROR
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set priority='p1'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR
rollback;

-- 21h. notification_type change → ERROR
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set notification_type='critical'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR
rollback;

-- 21i. trigger_source change → ERROR
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set trigger_source='operator'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR
rollback;

-- 21j. target_role change → ERROR
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set target_role='operator'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR — guard (and likely RLS too once target_role changes)
rollback;

-- 21k. target_user_id change → ERROR
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set target_user_id='<<OWNER_UUID>>'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR — guard
rollback;

-- 21l. client_id change → ERROR
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set client_id='b0000000-0000-4000-b000-00000000000b'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: ERROR — guard (and RLS with check would also reject)
rollback;

-- 21m. no backward dismissed → seen
-- Single transaction: postgres sets dismissed at savepoint, then we swap to
-- the client role and attempt seen, expecting the guard to raise. The whole
-- transaction rolls back so no state persists.
begin;

  -- as superuser (postgres) set the row to dismissed
  update public.notifications set status='dismissed'
  where id = 'a000000a-0001-4000-a000-00000000000a';

  -- now simulate the client and attempt the forbidden backward transition
  savepoint client_attempt;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
  update public.notifications set status='seen'
  where id = 'a000000a-0001-4000-a000-00000000000a';
  -- EXPECTED: ERROR — cannot move status from dismissed back to seen.
  -- If the ERROR aborts the transaction, that's fine — rollback below
  -- still discards everything. If it merely aborts to the savepoint, the
  -- ROLLBACK TO + RESET below safely returns to superuser.
  rollback to savepoint client_attempt;
  reset role;

rollback;

-- 21n. target B's notification → 0 rows (RLS hides it, guard never fires)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.notifications set status='seen'
where id = 'b000000b-0001-4000-b000-00000000000b';
-- EXPECTED: 0 rows updated
rollback;

-- 21o. team@ title change → succeeds (staff bypass)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.notifications set title='ops edit'
where id = 'a000000a-0002-4000-a000-00000000000a';
-- EXPECTED: 1 row updated (team is assigned to A; staff bypass guard)
rollback;

-- 21p. operator@ priority change → succeeds (staff bypass)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.notifications set priority='p1'
where id = 'a000000a-0003-4000-a000-00000000000a';
-- EXPECTED: 1 row updated (operator bypass)
rollback;

-- 21q. owner@ full row UPDATE → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
update public.notifications
set title='owner edit', message_body='owner body', priority='p1', notification_type='critical'
where id = 'a000000a-0001-4000-a000-00000000000a';
-- EXPECTED: 1 row updated (owner bypass)
rollback;


-- =============================================================================
-- END OF TEST QUERIES
--
-- Record results in 04_m003_test_results.md.
-- If ANY required test fails: STOP. Do not proceed to M004.
-- =============================================================================
