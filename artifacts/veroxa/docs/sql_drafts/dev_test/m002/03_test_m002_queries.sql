-- =============================================================================
-- M002 TEST QUERIES — DEV ONLY
--
-- Run AFTER 01_apply_m002.sql + 02_seed_m002_dev_data.sql.
--
-- USAGE: paste each numbered block separately in the Supabase SQL editor.
-- Every per-user block wraps in a transaction and ends with `rollback;`
-- so no mutation persists. Confirm "ROLLBACK" in the result before
-- moving on.
--
-- REPLACE PLACEHOLDERS at the top of each block:
--   <<OWNER_UUID>>     — owner@veroxa.test
--   <<OPERATOR_UUID>>  — operator@veroxa.test
--   <<TEAM_UUID>>      — team@veroxa.test
--   <<CLIENT_UUID>>    — client@veroxa.test
--
-- Fixed (do NOT replace):
--   TEAM2_UUID  = '12222222-2222-4222-a222-222222222222'
--   CLIENT_A_ID = 'a0000000-0000-4000-a000-00000000000a'
--   CLIENT_B_ID = 'b0000000-0000-4000-b000-00000000000b'
--
-- RECORD pass/fail in 04_m002_test_results.md.
-- =============================================================================


-- =============================================================================
-- TEST 1 — FK enforcement on user_profiles.client_id
-- =============================================================================

-- 1a. Owner sets a non-existent client_id → FK violation
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
update public.user_profiles
set client_id = '99999999-9999-4999-a999-999999999999'
where email = 'client@veroxa.test';
-- EXPECTED: ERROR — insert or update on table "user_profiles" violates foreign key constraint "user_profiles_client_id_fkey"
rollback;

-- 1b. Owner sets to a real clients.id → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
update public.user_profiles
set client_id = 'b0000000-0000-4000-b000-00000000000b'
where email = 'client@veroxa.test';
-- EXPECTED: 1 row updated
rollback;

-- 1c. on delete set null behavior (do NOT commit — would wipe seed)
begin;
delete from public.clients where id = 'b0000000-0000-4000-b000-00000000000b';
select email, client_id from public.user_profiles where email = 'client@veroxa.test';
-- EXPECTED: client_id stays = 'a000...' for client@ (not pointing at B)
-- To prove the cascade-to-null: temporarily wire client@ to B then delete B:
rollback;


-- =============================================================================
-- TEST 2 — Pricing-as-cents and locked pricing values
-- =============================================================================
-- Owner inserts a throwaway client at each locked price. Rolls back after.
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';

insert into public.clients (business_name, primary_contact_name, primary_contact_email, plan_type, service_package, monthly_fee_cents, timezone)
values
  ('Tmp GPS',          'X', 'x1@test', 'month_to_month', 'google_presence_starter',  49700,  'America/Chicago'),
  ('Tmp COP 12',       'X', 'x2@test', 'twelve_month',   'complete_online_presence', 99700,  'America/Chicago'),
  ('Tmp COP 6',        'X', 'x3@test', 'six_month',      'complete_online_presence', 109700, 'America/Chicago'),
  ('Tmp COP 3',        'X', 'x4@test', 'three_month',    'complete_online_presence', 119700, 'America/Chicago'),
  ('Tmp COP nocontract','X', 'x5@test', 'no_contract',    'complete_online_presence', 149700, 'America/Chicago');
-- EXPECTED: 5 rows inserted
rollback;


-- =============================================================================
-- TEST 3 — service_package vs plan_type check constraints
-- =============================================================================

-- 3a. GPS as plan_type → check violation
begin;
insert into public.clients (business_name, primary_contact_name, primary_contact_email, plan_type, service_package, monthly_fee_cents, timezone)
values ('Bad', 'X', 'bad1@test', 'google_presence_starter', 'google_presence_starter', 49700, 'America/Chicago');
-- EXPECTED: ERROR — new row violates check constraint on plan_type
rollback;

-- 3b. twelve_month as service_package → check violation
begin;
insert into public.clients (business_name, primary_contact_name, primary_contact_email, plan_type, service_package, monthly_fee_cents, timezone)
values ('Bad', 'X', 'bad2@test', 'twelve_month', 'twelve_month', 49700, 'America/Chicago');
-- EXPECTED: ERROR — new row violates check constraint on service_package
rollback;


-- =============================================================================
-- TEST 4 — Client sees only own client
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';

-- 4a. Total clients visible → 1
select count(*) as client_sees_clients from public.clients;
-- EXPECTED: 1

-- 4b. The visible client is Restaurant A
select id, business_name from public.clients;
-- EXPECTED: 'a0000000-0000-4000-a000-00000000000a' | 'Demo Restaurant A'

-- 4c. Restaurant B not visible
select count(*) as sees_b from public.clients
where id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0

rollback;


-- =============================================================================
-- TEST 5 — Client portal view column-hiding (DEFERRED to M003 — informational)
-- =============================================================================
-- Currently the client_portal_clients_view is a commented stub. The
-- following query is expected to FAIL with "relation does not exist".
-- That confirms M002 correctly defers view creation to M003.

select * from public.client_portal_clients_view limit 1;
-- EXPECTED: ERROR — relation "public.client_portal_clients_view" does not exist
-- Action: record this as "deferred to M003" pass; do NOT create the view here.


-- =============================================================================
-- TEST 6 — Team sees only assigned clients
-- =============================================================================

-- 6a. team@ (assigned to A only) sees A only
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
select id, business_name from public.clients order by business_name;
-- EXPECTED: 1 row → Demo Restaurant A
rollback;

-- 6b. team2@ (assigned to B only) sees B only
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"12222222-2222-4222-a222-222222222222","role":"authenticated"}';
select id, business_name from public.clients order by business_name;
-- EXPECTED: 1 row → Demo Restaurant B
rollback;


-- =============================================================================
-- TEST 7 — Inactive assignment blocks access on next statement
-- =============================================================================

-- Owner deactivates team@'s assignment to A
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
update public.team_client_assignments
set is_active = false
where client_id = 'a0000000-0000-4000-a000-00000000000a'
  and team_member_id = (
    select tm.id from public.team_members tm
    join public.user_profiles up on up.id = tm.user_profile_id
    where up.email = 'team@veroxa.test'
  );
-- EXPECTED: 1 row updated

-- Within the SAME transaction (before rollback), check team@ visibility.
-- Note: switching role mid-transaction requires SET LOCAL again; we
-- approximate by doing the team visibility check in a sub-block. The
-- cleaner pattern is to rollback this txn, run the deactivation outside
-- a txn (so it commits), then check team@ visibility, then re-activate.
-- For this draft, we just verify the update succeeded and trust the
-- helper logic (is_assigned_to_client requires is_active = true).
rollback;

-- Same pattern: if you want to PROVE the live cutoff, swap rollback→commit
-- on the block above, then run this team@ block, then re-activate:
/*
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
select count(*) as team_sees_after_deactivate from public.clients;
-- EXPECTED: 0
rollback;

-- Re-activate (run as owner outside a txn):
update public.team_client_assignments
set is_active = true
where client_id = 'a0000000-0000-4000-a000-00000000000a'
  and team_member_id = (
    select tm.id from public.team_members tm
    join public.user_profiles up on up.id = tm.user_profile_id
    where up.email = 'team@veroxa.test'
  );
*/

-- Also: deactivate team_members.is_active=false (assignment still active)
-- and confirm helper requires BOTH active — same pattern.


-- =============================================================================
-- TEST 8 — Operator/Owner see all clients
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select count(*) as operator_sees from public.clients;
-- EXPECTED: 2
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
select count(*) as owner_sees from public.clients;
-- EXPECTED: 2
rollback;


-- =============================================================================
-- TEST 9 — Pricing-write guard: operator denied
-- =============================================================================

-- 9a. operator changes monthly_fee_cents → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.clients set monthly_fee_cents = 99800
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: ERROR — monthly_fee_cents changes are restricted to owner
rollback;

-- 9b. operator changes plan_type → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.clients set plan_type = 'six_month'
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: ERROR — plan_type changes are restricted to owner
rollback;

-- 9c. operator changes service_package → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.clients set service_package = 'complete_online_presence'
where id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: ERROR — service_package changes are restricted to owner
rollback;

-- 9d. operator changes contract_months → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.clients set contract_months = 12
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: ERROR — contract_months changes are restricted to owner
rollback;

-- 9e. operator changes start_date → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.clients set start_date = '2025-01-01'
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: ERROR — start_date changes are restricted to owner
rollback;

-- 9f. operator changes assigned_operator_id → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
update public.clients set assigned_operator_id = '<<OWNER_UUID>>'
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: ERROR — assigned_operator_id changes are restricted to owner
rollback;


-- =============================================================================
-- TEST 10 — Operator can change operational fields
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';

update public.clients set account_status = 'active'
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated

update public.clients set content_health_status = 'at_risk'
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated

update public.clients set risk_status = 'watch'
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated

update public.clients set posting_frequency_weekly = 4
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated

update public.clients set assigned_team_label = 'Team Blue'
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated

rollback;


-- =============================================================================
-- TEST 11 — Owner can change pricing
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';

update public.clients set monthly_fee_cents = 99800
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated

update public.clients set plan_type = 'six_month'
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated

update public.clients set service_package = 'complete_online_presence'
where id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 1 row updated

update public.clients set assigned_operator_id = '<<OPERATOR_UUID>>'
where id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 1 row updated

rollback;


-- =============================================================================
-- TEST 12 — team_client_assignments unique constraint
-- =============================================================================

-- Setup: find team_member ids
-- (Run as superuser first to grab the IDs you'll reuse below)
select tm.id as team_member_id, up.email
from public.team_members tm
join public.user_profiles up on up.id = tm.user_profile_id
order by up.email;

-- 12a. duplicate (team1, A) → unique violation
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
insert into public.team_client_assignments (team_member_id, client_id, assignment_role)
select tm.id, 'a0000000-0000-4000-a000-00000000000a'::uuid, 'reviewer'
from public.team_members tm
join public.user_profiles up on up.id = tm.user_profile_id
where up.email = 'team@veroxa.test';
-- EXPECTED: ERROR — duplicate key value violates unique constraint "team_client_assignments_team_member_id_client_id_key"
rollback;

-- 12b. (team1, B) → succeeds (different client)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
insert into public.team_client_assignments (team_member_id, client_id, assignment_role)
select tm.id, 'b0000000-0000-4000-b000-00000000000b'::uuid, 'reporter'
from public.team_members tm
join public.user_profiles up on up.id = tm.user_profile_id
where up.email = 'team@veroxa.test';
-- EXPECTED: 1 row inserted
rollback;

-- 12c. (team2, A) → succeeds (different member, same client)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
insert into public.team_client_assignments (team_member_id, client_id, assignment_role)
select tm.id, 'a0000000-0000-4000-a000-00000000000a'::uuid, 'reporter'
from public.team_members tm
join public.user_profiles up on up.id = tm.user_profile_id
where up.email = 'team2@veroxa.test';
-- EXPECTED: 1 row inserted
rollback;


-- =============================================================================
-- TEST 13 — Client request creation: own client only
-- =============================================================================

-- 13a. client@ inserts request for OWN client (A) → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.client_requests (client_id, request_type, title)
values ('a0000000-0000-4000-a000-00000000000a', 'content_change', 'Update menu');
-- EXPECTED: 1 row inserted
rollback;

-- 13b. client@ inserts request for OTHER client (B) → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
insert into public.client_requests (client_id, request_type, title)
values ('b0000000-0000-4000-b000-00000000000b', 'content_change', 'Cross-tenant attempt');
-- EXPECTED: ERROR — new row violates row-level security policy for table "client_requests"
rollback;


-- =============================================================================
-- TEST 14 — Client request select scoping
-- =============================================================================

-- 14a. client@ sees only A's requests
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select count(*) as client_sees, count(*) filter (where client_id = 'a0000000-0000-4000-a000-00000000000a') as for_a,
       count(*) filter (where client_id = 'b0000000-0000-4000-b000-00000000000b') as for_b
from public.client_requests;
-- EXPECTED: client_sees=2, for_a=2, for_b=0
rollback;

-- 14b. team@ (assigned to A) → sees A's requests only
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
select count(*) filter (where client_id = 'a0000000-0000-4000-a000-00000000000a') as for_a,
       count(*) filter (where client_id = 'b0000000-0000-4000-b000-00000000000b') as for_b
from public.client_requests;
-- EXPECTED: for_a=2, for_b=0
rollback;

-- 14c. team2@ (assigned to B) → sees B's requests only
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"12222222-2222-4222-a222-222222222222","role":"authenticated"}';
select count(*) filter (where client_id = 'a0000000-0000-4000-a000-00000000000a') as for_a,
       count(*) filter (where client_id = 'b0000000-0000-4000-b000-00000000000b') as for_b
from public.client_requests;
-- EXPECTED: for_a=0, for_b=1
rollback;

-- 14d. operator/owner → see all
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select count(*) as operator_sees from public.client_requests;
-- EXPECTED: 3
rollback;


-- =============================================================================
-- TEST 15 — Onboarding item ownership rules
-- =============================================================================

-- 15a. client@ updates own client + client-owned item → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.onboarding_items set status = 'complete'
where client_id = 'a0000000-0000-4000-a000-00000000000a'
  and item_key = 'menu_uploaded';
-- EXPECTED: 1 row updated
rollback;

-- 15b. client@ updates own client + operator-owned item → 0 rows (policy excludes)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.onboarding_items set status = 'complete'
where client_id = 'a0000000-0000-4000-a000-00000000000a'
  and item_key = 'brand_voice_review';
-- EXPECTED: 0 rows updated (no matching UPDATE policy — owner_role != 'client')
rollback;

-- 15c. client@ updates other client's item → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.onboarding_items set status = 'complete'
where client_id = 'b0000000-0000-4000-b000-00000000000b'
  and item_key = 'menu_uploaded';
-- EXPECTED: 0 rows updated
rollback;

-- 15d. team@ (assigned to A as executor) updates A's items, including operator-owned
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.onboarding_items set status = 'pending'
where client_id = 'a0000000-0000-4000-a000-00000000000a'
  and item_key in ('menu_uploaded','brand_voice_review');
-- EXPECTED: 2 rows updated (executor can manage all items on assigned client)
rollback;


-- =============================================================================
-- TEST 16 — client_platforms internal notes (view hiding deferred to M003)
-- =============================================================================

-- 16a. M003 view does not exist yet — record as deferred
select * from public.client_portal_platforms_view limit 1;
-- EXPECTED: ERROR — relation "public.client_portal_platforms_view" does not exist

-- 16b. client@ CAN read the base-table row (notes included — column-hiding is the view's job)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select platform_name, notes from public.client_platforms
where client_id = 'a0000000-0000-4000-a000-00000000000a'
order by platform_name;
-- EXPECTED: rows returned with notes visible. Document this is acceptable
-- because: (1) AUTH_MODE='placeholder' so no real client can sign in;
-- (2) base-table revoke from authenticated lands with M003 views.
rollback;


-- =============================================================================
-- TEST 17 — Helper semantics
-- =============================================================================

-- 17a. is_assigned_to_client(A) as team@ → true
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
select private.is_assigned_to_client('a0000000-0000-4000-a000-00000000000a') as r;
-- EXPECTED: true
rollback;

-- 17b. is_assigned_to_client(A) as team2@ → false
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"12222222-2222-4222-a222-222222222222","role":"authenticated"}';
select private.is_assigned_to_client('a0000000-0000-4000-a000-00000000000a') as r;
-- EXPECTED: false
rollback;

-- 17c. is_assigned_to_client(A) as operator → true (short-circuit)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select private.is_assigned_to_client('a0000000-0000-4000-a000-00000000000a') as r;
-- EXPECTED: true
rollback;

-- 17d. is_assigned_to_client(A) as owner → true
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
select private.is_assigned_to_client('a0000000-0000-4000-a000-00000000000a') as r;
-- EXPECTED: true
rollback;

-- 17e. is_assigned_to_client(A) as client@ → false
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select private.is_assigned_to_client('a0000000-0000-4000-a000-00000000000a') as r;
-- EXPECTED: false
rollback;

-- 17f. is_assigned_to_client(A) as anon → false / permission denied
begin;
set local role anon;
select private.is_assigned_to_client('a0000000-0000-4000-a000-00000000000a') as r;
-- EXPECTED: permission denied for function is_assigned_to_client
rollback;

-- 17g. can_view_client(A) as client@ → true
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select private.can_view_client('a0000000-0000-4000-a000-00000000000a') as r;
-- EXPECTED: true
rollback;

-- 17h. can_view_client(B) as client@ → false
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select private.can_view_client('b0000000-0000-4000-b000-00000000000b') as r;
-- EXPECTED: false
rollback;

-- 17i. can_manage_client_operations(A) as team@ (executor) → true
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
select private.can_manage_client_operations('a0000000-0000-4000-a000-00000000000a') as r;
-- EXPECTED: true
rollback;

-- 17j. can_manage_client_operations(B) as team2@ (reporter) → false
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"12222222-2222-4222-a222-222222222222","role":"authenticated"}';
select private.can_manage_client_operations('b0000000-0000-4000-b000-00000000000b') as r;
-- EXPECTED: false (reporter is excluded from the manage set)
rollback;

-- 17k. can_manage_pricing() → true only for owner
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
select private.can_manage_pricing() as r;
-- EXPECTED: true
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select private.can_manage_pricing() as r;
-- EXPECTED: false
rollback;


-- =============================================================================
-- TEST 18 — Helper inactive-user behavior
-- =============================================================================
-- Deactivate operator user temporarily; powers should vanish on next statement.

-- Run as postgres (superuser) outside a txn so it commits, then test, then re-activate.
update public.user_profiles set is_active = false
where email = 'operator@veroxa.test';

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select
  private.is_operator()                                                                 as is_op,
  private.can_view_client('a0000000-0000-4000-a000-00000000000a'::uuid)                  as can_view_a,
  (select count(*) from public.clients)                                                 as sees;
-- EXPECTED: is_op=false, can_view_a=false, sees=0
rollback;

-- Re-activate
update public.user_profiles set is_active = true
where email = 'operator@veroxa.test';

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';
select private.is_operator() as is_op, (select count(*) from public.clients) as sees;
-- EXPECTED: is_op=true, sees=2
rollback;


-- =============================================================================
-- TEST 19 — Helper EXECUTE grants
-- =============================================================================

-- 19a. anon CANNOT execute the new helpers
begin;
set local role anon;
select private.is_assigned_to_client('a0000000-0000-4000-a000-00000000000a');
-- EXPECTED: ERROR — permission denied for function is_assigned_to_client
rollback;

begin;
set local role anon;
select private.can_manage_pricing();
-- EXPECTED: ERROR — permission denied for function can_manage_pricing
rollback;

-- 19b. authenticated CAN execute
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';
select
  private.is_assigned_to_client('a0000000-0000-4000-a000-00000000000a'::uuid),
  private.can_view_client('a0000000-0000-4000-a000-00000000000a'::uuid),
  private.can_manage_client_operations('a0000000-0000-4000-a000-00000000000a'::uuid),
  private.can_manage_pricing();
-- EXPECTED: all return without permission errors
rollback;


-- =============================================================================
-- TEST 20 — Anon access fully blocked on all five tables
-- =============================================================================

begin;
set local role anon;
select count(*) as anon_clients                from public.clients;
-- EXPECTED: 0
rollback;

begin;
set local role anon;
select count(*) as anon_assignments            from public.team_client_assignments;
-- EXPECTED: 0
rollback;

begin;
set local role anon;
select count(*) as anon_platforms              from public.client_platforms;
-- EXPECTED: 0
rollback;

begin;
set local role anon;
select count(*) as anon_onboarding             from public.onboarding_items;
-- EXPECTED: 0
rollback;

begin;
set local role anon;
select count(*) as anon_requests               from public.client_requests;
-- EXPECTED: 0
rollback;

-- Anon insert attempts
begin;
set local role anon;
insert into public.clients (business_name, primary_contact_name, primary_contact_email, plan_type, service_package, monthly_fee_cents, timezone)
values ('Anon', 'X', 'a@test', 'month_to_month', 'google_presence_starter', 49700, 'America/Chicago');
-- EXPECTED: ERROR — RLS denial
rollback;

begin;
set local role anon;
insert into public.client_requests (client_id, request_type, title)
values ('a0000000-0000-4000-a000-00000000000a', 'content_change', 'Anon');
-- EXPECTED: ERROR — RLS denial
rollback;


-- =============================================================================
-- TEST 21 — Cross-tenant isolation matrix
-- =============================================================================
-- client@ cannot read/write B; team@ (assigned A only) cannot read/write B.

-- 21a. client@ read B's platforms → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
select count(*) as client_sees_b_platforms from public.client_platforms
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0
rollback;

-- 21b. client@ update B's onboarding → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<CLIENT_UUID>>","role":"authenticated"}';
update public.onboarding_items set status = 'complete'
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0 rows updated
rollback;

-- 21c. team@ (assigned A only) read B's platforms → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
select count(*) as team_sees_b_platforms from public.client_platforms
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0
rollback;

-- 21d. team@ update B's requests → 0 rows
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<<TEAM_UUID>>","role":"authenticated"}';
update public.client_requests set status = 'cancelled'
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 0 rows updated
rollback;


-- =============================================================================
-- TEST 22 — Cascade behavior
-- =============================================================================
-- All cascade tests use the postgres role and rollback at the end so no
-- seed data is permanently destroyed.

-- 22a. Delete a clients row → cascades to all child tables
begin;
delete from public.clients where id = 'b0000000-0000-4000-b000-00000000000b';

select 'clients_b'                  as t, count(*) from public.clients                  where id = 'b0000000-0000-4000-b000-00000000000b'
union all select 'tca_b',                count(*) from public.team_client_assignments   where client_id = 'b0000000-0000-4000-b000-00000000000b'
union all select 'platforms_b',          count(*) from public.client_platforms          where client_id = 'b0000000-0000-4000-b000-00000000000b'
union all select 'onboarding_b',         count(*) from public.onboarding_items          where client_id = 'b0000000-0000-4000-b000-00000000000b'
union all select 'requests_b',           count(*) from public.client_requests           where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: all counts = 0
rollback;

-- 22b. Delete clients row → user_profiles.client_id nulls for any user
-- pointing at it. (Use Restaurant A which client@ points at.)
begin;
delete from public.clients where id = 'a0000000-0000-4000-a000-00000000000a';
select email, client_id from public.user_profiles where email = 'client@veroxa.test';
-- EXPECTED: client_id IS NULL
rollback;

-- 22c. Delete a team_members row → cascades to team_client_assignments
begin;
delete from public.team_members tm
using public.user_profiles up
where tm.user_profile_id = up.id and up.email = 'team@veroxa.test';

select count(*) as remaining_tca_for_team from public.team_client_assignments tca
where tca.team_member_id not in (select id from public.team_members);
-- EXPECTED: 0 (the cascade already removed the deleted team's TCAs)
rollback;

-- 22d. requested_by_user_id → set null on user_profiles delete
-- (skipped here: deleting a user_profiles row would cascade to auth.users
-- via M001 PK FK and break our seed. Document as understood from schema.)


-- =============================================================================
-- END OF TEST QUERIES
--
-- Record results in 04_m002_test_results.md.
-- If ANY required test fails: STOP. Do not proceed to M003.
-- =============================================================================
