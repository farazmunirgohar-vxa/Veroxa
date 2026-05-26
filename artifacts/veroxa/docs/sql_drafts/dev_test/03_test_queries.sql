-- =============================================================================
-- M001 TEST QUERIES — RUN AFTER 01_apply_m001.sql + 02_seed_dev_users.sql
--
-- HOW TO USE THIS FILE:
--   Run each numbered block separately in the Supabase SQL editor.
--   Every block wraps in a transaction and ends with ROLLBACK so no test
--   mutation persists. The Supabase SQL editor runs as postgres (superuser)
--   by default; the `set local role authenticated` + `set local
--   "request.jwt.claims"` lines simulate per-user contexts.
--
--   REPLACE the placeholder UUIDs below with your actual auth.users IDs
--   from the seed step. The test descriptions reference these labels:
--     OWNER_UUID    = 'owner-uuid-0001-0001-0001-000000000001'
--     OPERATOR_UUID = 'operator-uuid-002-0002-0002-000000000002'
--     TEAM_UUID     = 'team-uuid-0003-0003-0003-000000000003'
--     CLIENT_UUID   = 'client-uuid-004-0004-0004-000000000004'
--     INACTIVE_UUID = 'inactive-uuid-05-0005-0005-000000000005'
--
--   EXPECTED RESULTS: each block states what you should see.
--   RECORD pass/fail in 04_test_results.md.
-- =============================================================================

-- Replace UUIDs here to avoid repeating them throughout the file.
-- Run this block once before running any test block.
set session "app.owner_uuid"    = 'owner-uuid-0001-0001-0001-000000000001';
set session "app.operator_uuid" = 'operator-uuid-002-0002-0002-000000000002';
set session "app.team_uuid"     = 'team-uuid-0003-0003-0003-000000000003';
set session "app.client_uuid"   = 'client-uuid-004-0004-0004-000000000004';
set session "app.inactive_uuid" = 'inactive-uuid-05-0005-0005-000000000005';


-- =============================================================================
-- TEST 1 — Anonymous access is fully blocked
-- =============================================================================
-- As anon (no JWT). In the Supabase SQL editor anon context, RLS is applied
-- but the postgres role bypasses it by default. Use the BEGIN/SET LOCAL block.
-- Expected: 0 rows returned (RLS denies) or "permission denied" error.
-- =============================================================================

-- 1a. Anon SELECT user_profiles → 0 rows
begin;
set local role anon;
select count(*) as anon_user_profiles_count from public.user_profiles;
-- EXPECTED: 0
rollback;

-- 1b. Anon SELECT team_members → 0 rows
begin;
set local role anon;
select count(*) as anon_team_members_count from public.team_members;
-- EXPECTED: 0
rollback;

-- 1c. Anon INSERT user_profiles → denied
begin;
set local role anon;
insert into public.user_profiles (id, display_name, email, role)
  values (gen_random_uuid(), 'Anon Hacker', 'anon@hack.test', 'owner');
-- EXPECTED: ERROR (new row violates RLS policy)
rollback;


-- =============================================================================
-- TEST 2 — Client sees only own profile
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';

-- 2a. SELECT all profiles → expect exactly 1 row (own)
select count(*) as client_sees_profiles
from public.user_profiles;
-- EXPECTED: 1

-- 2b. SELECT other profiles → 0 rows
select count(*) as client_sees_others
from public.user_profiles
where id <> auth.uid();
-- EXPECTED: 0

-- 2c. SELECT team_members → 0 rows
select count(*) as client_sees_team_members
from public.team_members;
-- EXPECTED: 0

rollback;


-- =============================================================================
-- TEST 3 — Team sees only own profile and own team_member row
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"team-uuid-0003-0003-0003-000000000003","role":"authenticated"}';

-- 3a. SELECT all profiles → expect exactly 1 row (own)
select count(*) as team_sees_profiles
from public.user_profiles;
-- EXPECTED: 1

-- 3b. SELECT team_members → expect exactly 1 row (own)
select count(*) as team_sees_own_team_member
from public.team_members;
-- EXPECTED: 1

-- 3c. SELECT other team_member rows → 0 rows
select count(*) as team_sees_others
from public.team_members
where user_profile_id <> auth.uid();
-- EXPECTED: 0

rollback;


-- =============================================================================
-- TEST 4 — Operator can view all profiles and all team_members
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"operator-uuid-002-0002-0002-000000000002","role":"authenticated"}';

-- 4a. SELECT count of all profiles → 5
select count(*) as operator_sees_profiles
from public.user_profiles;
-- EXPECTED: 5

-- 4b. SELECT team_members → at least 1
select count(*) as operator_sees_team_members
from public.team_members;
-- EXPECTED: >= 1

-- 4c. Operator UPDATE → denied (no operator UPDATE policy)
update public.user_profiles
set display_name = 'Hacked'
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 0 rows updated (UPDATE with no matching policy = silent no-op in Postgres RLS)
-- Note: Supabase PostgREST returns 404/0 rows, not an error, for this case.
-- If you want to see the RLS block as an error, use "check (false)" policy approach.
-- Document the actual result here.

rollback;


-- =============================================================================
-- TEST 5 — Owner can view and update profiles
-- =============================================================================
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';

-- 5a. SELECT all → 5 rows
select count(*) as owner_sees_profiles
from public.user_profiles;
-- EXPECTED: 5

-- 5b. UPDATE another user's display_name → succeeds
update public.user_profiles
set display_name = 'Updated by Owner'
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 1 row updated

-- 5c. INSERT into team_members → succeeds
insert into public.team_members (user_profile_id, role_label)
values ('operator-uuid-002-0002-0002-000000000002', 'Operator Staff');
-- EXPECTED: success, 1 row inserted

rollback;


-- =============================================================================
-- TEST 6 — Owner can change role; non-owner cannot
-- =============================================================================

-- 6a. Owner changes team user's role to 'operator' → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';

update public.user_profiles
set role = 'operator'
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 1 row updated

-- Confirm new role readable in same transaction:
select role from public.user_profiles
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 'operator'

rollback;

-- 6b. Operator tries to change a role → denied (trigger raises)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"operator-uuid-002-0002-0002-000000000002","role":"authenticated"}';

update public.user_profiles
set role = 'owner'
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: ERROR — "role changes are restricted to owner"

rollback;

-- 6c. Team tries to change a role → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"team-uuid-0003-0003-0003-000000000003","role":"authenticated"}';

update public.user_profiles
set role = 'owner'
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: ERROR — "role changes are restricted to owner"
-- (team has update_self policy; trigger fires and raises)

rollback;

-- 6d. Client tries to change own role → denied (trigger raises)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';

update public.user_profiles
set role = 'owner'
where id = auth.uid();
-- EXPECTED: ERROR — "role changes are restricted to owner"

rollback;

-- 6e. Owner tries to change OWN role → denied (anti-lockout)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';

update public.user_profiles
set role = 'client'
where id = auth.uid();
-- EXPECTED: ERROR — "users cannot change their own role"

rollback;


-- =============================================================================
-- TEST 6a — Email is owner-only
-- =============================================================================

-- Client tries to change own email → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';

update public.user_profiles
set email = 'hacked@evil.test'
where id = auth.uid();
-- EXPECTED: ERROR — "email changes are restricted to owner"

rollback;

-- Team tries to change own email → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"team-uuid-0003-0003-0003-000000000003","role":"authenticated"}';

update public.user_profiles
set email = 'hacked@evil.test'
where id = auth.uid();
-- EXPECTED: ERROR — "email changes are restricted to owner"

rollback;

-- Owner changes another user's email → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';

update public.user_profiles
set email = 'newemail@veroxa.test'
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 1 row updated

rollback;

-- Confirm display_name / avatar_url self-edit still works (guard is targeted)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';

update public.user_profiles
set display_name = 'My New Name', avatar_url = 'https://example.com/avatar.png'
where id = auth.uid();
-- EXPECTED: 1 row updated (no trigger raise; guard only blocks sensitive cols)

rollback;


-- =============================================================================
-- TEST 7 — is_active changes are owner-only
-- =============================================================================

-- Owner deactivates team user → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';

update public.user_profiles
set is_active = false
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 1 row updated

rollback;

-- Operator tries → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"operator-uuid-002-0002-0002-000000000002","role":"authenticated"}';

update public.user_profiles
set is_active = false
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: ERROR — "is_active changes are restricted to owner"
-- Note: operator has no UPDATE policy at all; this may be a 0-rows no-op
-- rather than an error. Document the actual result.

rollback;

-- User tries to deactivate themselves → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"team-uuid-0003-0003-0003-000000000003","role":"authenticated"}';

update public.user_profiles
set is_active = false
where id = auth.uid();
-- EXPECTED: ERROR — "is_active changes are restricted to owner"

rollback;


-- =============================================================================
-- TEST 8 — client_id changes are owner-only
-- =============================================================================
-- Note: no FK on client_id until M002; any UUID accepted at DB layer.

-- Owner sets client_id → succeeds
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';

update public.user_profiles
set client_id = gen_random_uuid()
where id = 'client-uuid-004-0004-0004-000000000004';
-- EXPECTED: 1 row updated

rollback;

-- Client tries to set own client_id → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';

update public.user_profiles
set client_id = gen_random_uuid()
where id = auth.uid();
-- EXPECTED: ERROR — "client_id changes are restricted to owner"

rollback;


-- =============================================================================
-- TEST 9 — current_user_role() returns expected values
-- =============================================================================

-- Owner
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';
select private.current_user_role() as role_result;
-- EXPECTED: 'owner'
rollback;

-- Operator
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"operator-uuid-002-0002-0002-000000000002","role":"authenticated"}';
select private.current_user_role() as role_result;
-- EXPECTED: 'operator'
rollback;

-- Team
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"team-uuid-0003-0003-0003-000000000003","role":"authenticated"}';
select private.current_user_role() as role_result;
-- EXPECTED: 'team'
rollback;

-- Client
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';
select private.current_user_role() as role_result;
-- EXPECTED: 'client'
rollback;

-- Inactive user → NULL (is_active=false filters them out)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"inactive-uuid-05-0005-0005-000000000005","role":"authenticated"}';
select private.current_user_role() as role_result;
-- EXPECTED: NULL (no exception)
rollback;

-- Anon → NULL
begin;
set local role anon;
select private.current_user_role() as role_result;
-- EXPECTED: NULL (no exception) OR "permission denied" if anon cannot EXECUTE
-- NOTE: anon was revoked EXECUTE. In Supabase the anon role does not have
-- execute on private.* by default — you may see a permission denied error.
-- Either NULL or permission denied is acceptable; document the actual result.
rollback;


-- =============================================================================
-- TEST 10 — is_owner / is_operator / is_team_member semantics
-- =============================================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';
select
  private.is_owner()       as is_owner,      -- EXPECTED: true
  private.is_operator()    as is_operator,   -- EXPECTED: true (owner inherits)
  private.is_team_member() as is_team_member; -- EXPECTED: true (owner inherits)
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"operator-uuid-002-0002-0002-000000000002","role":"authenticated"}';
select
  private.is_owner()       as is_owner,      -- EXPECTED: false
  private.is_operator()    as is_operator,   -- EXPECTED: true
  private.is_team_member() as is_team_member; -- EXPECTED: true
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"team-uuid-0003-0003-0003-000000000003","role":"authenticated"}';
select
  private.is_owner()       as is_owner,      -- EXPECTED: false
  private.is_operator()    as is_operator,   -- EXPECTED: false
  private.is_team_member() as is_team_member; -- EXPECTED: true
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';
select
  private.is_owner()       as is_owner,      -- EXPECTED: false
  private.is_operator()    as is_operator,   -- EXPECTED: false
  private.is_team_member() as is_team_member; -- EXPECTED: false
rollback;

begin;
set local role anon;
-- anon may error on execute; document actual result
select
  private.is_owner()       as is_owner,
  private.is_operator()    as is_operator,
  private.is_team_member() as is_team_member;
-- EXPECTED: false / false / false  OR  permission denied
rollback;


-- =============================================================================
-- TEST 11 — current_user_client_id() semantics
-- =============================================================================

-- Client with client_id set → returns that uuid
-- First, set a known client_id as postgres (superuser):
update public.user_profiles
set client_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
where id = 'client-uuid-004-0004-0004-000000000004';

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';
select private.current_user_client_id() as client_id_result;
-- EXPECTED: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
rollback;

-- Reset client_id
update public.user_profiles set client_id = null where id = 'client-uuid-004-0004-0004-000000000004';

-- Non-client roles → NULL even if client_id is set
update public.user_profiles
set client_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
where id = 'owner-uuid-0001-0001-0001-000000000001';

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';
select private.current_user_client_id() as client_id_result;
-- EXPECTED: NULL (owner role → function returns null regardless)
rollback;

update public.user_profiles set client_id = null where id = 'owner-uuid-0001-0001-0001-000000000001';

-- Inactive client → NULL
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"inactive-uuid-05-0005-0005-000000000005","role":"authenticated"}';
select private.current_user_client_id() as client_id_result;
-- EXPECTED: NULL (is_active=false → function returns null)
rollback;


-- =============================================================================
-- TEST 12 — is_system_actor()
-- =============================================================================

-- End-user context → false
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';
select private.is_system_actor() as is_system;
-- EXPECTED: false
rollback;

-- Postgres (superuser) context — auth.role() returns 'postgres', not 'service_role'
-- This simulates the SQL editor default context.
select private.is_system_actor() as is_system;
-- EXPECTED: false (the SQL editor is postgres, not the service_role JWT)
-- The true service_role result must be tested via the Supabase service key SDK.
-- Document: is_system_actor() returns true ONLY for the Supabase service-role JWT.


-- =============================================================================
-- TEST 13 — updated_at trigger
-- =============================================================================

-- Record current updated_at, then update, then confirm it advanced.
-- Run as postgres (superuser) to avoid RLS complications.
select updated_at as before_update from public.user_profiles
where id = 'team-uuid-0003-0003-0003-000000000003';

-- Wait 1 second in your head (or pg_sleep) then:
update public.user_profiles
set display_name = 'Trigger Test'
where id = 'team-uuid-0003-0003-0003-000000000003';

select updated_at as after_update from public.user_profiles
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: after_update > before_update

-- Same for team_members:
select updated_at as before_update from public.team_members
where user_profile_id = 'team-uuid-0003-0003-0003-000000000003';

update public.team_members set role_label = 'Trigger Test'
where user_profile_id = 'team-uuid-0003-0003-0003-000000000003';

select updated_at as after_update from public.team_members
where user_profile_id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: after_update > before_update

-- Restore:
update public.user_profiles set display_name = 'Dev Team'
where id = 'team-uuid-0003-0003-0003-000000000003';
update public.team_members set role_label = 'Content Lead'
where user_profile_id = 'team-uuid-0003-0003-0003-000000000003';


-- =============================================================================
-- TEST 14 — RLS bypass for service role
-- =============================================================================
-- Run these as the postgres (superuser) role in the SQL editor, which
-- effectively bypasses RLS the same way the service role does.
select count(*) as superuser_sees_all from public.user_profiles;
-- EXPECTED: 5

-- To test with the actual service_role key, use the Supabase JS client:
--   const supabase = createClient(url, SERVICE_ROLE_KEY)
--   const { count } = await supabase.from('user_profiles').select('*', { count: 'exact' })
--   // expected: 5


-- =============================================================================
-- TEST 15 — Search-path hijack defense
-- =============================================================================
-- Create a fake user_profiles in pg_temp with role='owner' for a non-owner UUID.
-- The helper must still read from public.user_profiles.

create temp table user_profiles (
  id   uuid,
  role text,
  is_active boolean
);
insert into user_profiles values
  ('client-uuid-004-0004-0004-000000000004', 'owner', true);

-- Now simulate client user with a manipulated search_path:
begin;
set local search_path = pg_temp, public;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';
select private.current_user_role() as role_result;
-- EXPECTED: 'client' (helper uses set search_path = pg_catalog, public
--   internally, ignoring the session search_path)
select private.is_owner() as is_owner_result;
-- EXPECTED: false
rollback;

drop table if exists pg_temp.user_profiles;


-- =============================================================================
-- TEST 16 — Cascade on auth.users delete
-- =============================================================================
-- Create a throwaway auth.users + user_profiles pair.
-- Delete from auth.users → expect cascade to user_profiles (and team_members
-- if one exists).
-- Run as postgres (superuser).

-- Step 1: Create throwaway auth.users row
insert into auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, role, aud
) values (
  'cascade-test-0000-0000-0000-000000000099'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'cascade-test@veroxa.test',
  crypt('dev-only-throwaway', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated', 'authenticated'
);

insert into public.user_profiles (id, display_name, email, role)
values ('cascade-test-0000-0000-0000-000000000099', 'Cascade Test', 'cascade-test@veroxa.test', 'team');

insert into public.team_members (user_profile_id, role_label)
values ('cascade-test-0000-0000-0000-000000000099', 'Cascade Test');

-- Step 2: Verify the rows exist
select count(*) from public.user_profiles where id = 'cascade-test-0000-0000-0000-000000000099';
-- EXPECTED: 1
select count(*) from public.team_members where user_profile_id = 'cascade-test-0000-0000-0000-000000000099';
-- EXPECTED: 1

-- Step 3: Delete from auth.users → cascade fires
delete from auth.users where id = 'cascade-test-0000-0000-0000-000000000099';

-- Step 4: Confirm cascade worked
select count(*) as user_profiles_after_cascade from public.user_profiles
where id = 'cascade-test-0000-0000-0000-000000000099';
-- EXPECTED: 0

select count(*) as team_members_after_cascade from public.team_members
where user_profile_id = 'cascade-test-0000-0000-0000-000000000099';
-- EXPECTED: 0


-- =============================================================================
-- TEST 17 — Helper EXECUTE grants
-- =============================================================================
-- Verify that anon CANNOT execute helpers; authenticated CAN.

begin;
set local role anon;
select private.current_user_role();
-- EXPECTED: permission denied for role "anon"
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"team-uuid-0003-0003-0003-000000000003","role":"authenticated"}';
select private.current_user_role();
-- EXPECTED: 'team' (no permission denied)
rollback;


-- =============================================================================
-- TEST 18 — INSERT denial for non-owner authenticated users
-- =============================================================================

-- Client cannot INSERT into user_profiles
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';
insert into public.user_profiles (id, display_name, email, role)
values (gen_random_uuid(), 'Fake', 'fake@hack.test', 'owner');
-- EXPECTED: 0 rows inserted (RLS denies; no INSERT policy for client)
rollback;

-- Operator cannot INSERT into user_profiles
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"operator-uuid-002-0002-0002-000000000002","role":"authenticated"}';
insert into public.user_profiles (id, display_name, email, role)
values (gen_random_uuid(), 'Fake', 'fake2@hack.test', 'team');
-- EXPECTED: 0 rows inserted
rollback;

-- Owner CAN INSERT
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';
insert into public.user_profiles (id, display_name, email, role)
values (gen_random_uuid(), 'New User', 'newuser@veroxa.test', 'team');
-- NOTE: This will fail because id must reference auth.users (FK).
-- Use an existing auth.users UUID if you want to test this fully.
-- EXPECTED: FK violation (no auth.users row) — which is also acceptable.
rollback;


-- =============================================================================
-- TEST 19 — DELETE denial for operator and below
-- =============================================================================

-- Operator DELETE → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"operator-uuid-002-0002-0002-000000000002","role":"authenticated"}';
delete from public.user_profiles where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 0 rows deleted (RLS denies; no DELETE policy for operator)
rollback;

-- Team DELETE → denied
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"team-uuid-0003-0003-0003-000000000003","role":"authenticated"}';
delete from public.user_profiles where id = auth.uid();
-- EXPECTED: 0 rows deleted
rollback;

-- Owner DELETE → succeeds (but we rollback to preserve seed)
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';
delete from public.user_profiles where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 1 row deleted
rollback;
-- Rollback preserved seed ↑


-- =============================================================================
-- TEST 20 — auth.users orphan (signup before bootstrap trigger)
-- =============================================================================
-- Create an auth.users row with NO matching user_profiles row.

insert into auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, role, aud
) values (
  'orphan-test-0000-0000-0000-000000000088'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'orphan@veroxa.test',
  crypt('dev-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated', 'authenticated'
);
-- No user_profiles row inserted — simulates signup race.

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"orphan-test-0000-0000-0000-000000000088","role":"authenticated"}';

select private.current_user_role() as role_result;
-- EXPECTED: NULL (no user_profiles row; no exception)

select count(*) as own_profile_count from public.user_profiles where id = auth.uid();
-- EXPECTED: 0

select private.is_owner()       as is_owner;
select private.is_operator()    as is_operator;
select private.is_team_member() as is_team_member;
-- ALL EXPECTED: false (not NULL — coalesce(null, false))

rollback;

-- Cleanup orphan
delete from auth.users where id = 'orphan-test-0000-0000-0000-000000000088';


-- =============================================================================
-- TEST 21 — Email uniqueness conflict
-- =============================================================================

-- Attempt to INSERT a duplicate email → unique constraint violation
begin;
insert into public.user_profiles (id, display_name, email, role)
values (gen_random_uuid(), 'Dup', 'owner@veroxa.test', 'team');
-- EXPECTED: ERROR — duplicate key value violates unique constraint "user_profiles_email_key"
rollback;


-- =============================================================================
-- TEST 22 — Operator without team_members row
-- =============================================================================
-- The operator user has no team_members row in our seed (only team user does).

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"operator-uuid-002-0002-0002-000000000002","role":"authenticated"}';

-- Operator still sees ALL team_members via team_members_select_staff policy
select count(*) as operator_sees_all_team_members from public.team_members;
-- EXPECTED: >= 1 (the team user's row)

-- Helpers work via user_profiles.role, not team_members presence
select
  private.is_operator()    as is_operator,   -- EXPECTED: true
  private.is_team_member() as is_team_member; -- EXPECTED: true

rollback;


-- =============================================================================
-- TEST 23 — JWT-expiry / stale session
-- =============================================================================
-- Simulate by using an empty sub (no matching profile):
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}';

select private.current_user_role() as role_result;
-- EXPECTED: NULL (no profile for this UUID; no exception)

select private.is_owner()       as is_owner;   -- EXPECTED: false
select private.is_operator()    as is_operator; -- EXPECTED: false

select count(*) as profile_count from public.user_profiles;
-- EXPECTED: 0 (no SELECT policy matches this unknown uid)

rollback;


-- =============================================================================
-- TEST 24 — Self-edit allowed/denied matrix (comprehensive)
-- =============================================================================
-- Already tested per-column above. This block runs the full matrix in one shot.

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"client-uuid-004-0004-0004-000000000004","role":"authenticated"}';

-- ALLOWED: display_name
update public.user_profiles set display_name = 'OK Name' where id = auth.uid();
-- EXPECTED: success

-- ALLOWED: avatar_url
update public.user_profiles set avatar_url = 'https://ok.test/img.png' where id = auth.uid();
-- EXPECTED: success

-- DENIED: role
update public.user_profiles set role = 'owner' where id = auth.uid();
-- EXPECTED: ERROR — "role changes are restricted to owner"

rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';

-- Owner self: display_name → success
update public.user_profiles set display_name = 'Owner Name' where id = auth.uid();

-- Owner self: role → DENIED (anti-lockout)
update public.user_profiles set role = 'team' where id = auth.uid();
-- EXPECTED: ERROR — "users cannot change their own role"

rollback;

-- Owner on another user: role → success
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"owner-uuid-0001-0001-0001-000000000001","role":"authenticated"}';

update public.user_profiles set role = 'operator'
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 1 row updated

update public.user_profiles set is_active = false
where id = 'team-uuid-0003-0003-0003-000000000003';
-- EXPECTED: 1 row updated — kill-switch

rollback;

-- =============================================================================
-- END OF TEST QUERIES
--
-- Record all results in 04_test_results.md.
-- If ANY test fails, STOP and do not proceed to M002.
-- =============================================================================
