-- =============================================================================
-- M001 SEED — DEV TEST USERS ONLY
--
-- Run AFTER 01_apply_m001.sql, as the postgres (service-role) user.
--
-- HOW TO GET THE UUIDs FOR auth.users:
--   Option A — Supabase dashboard "Authentication → Users → Add user":
--     Create each user there (email + password), then copy their UUID
--     from the table, and replace the placeholder UUIDs below.
--
--   Option B — Run the INSERT INTO auth.users block below directly in
--     the SQL editor. This works on dev projects where you have postgres
--     (superuser) access. The passwords below are dev-only placeholders
--     and must NEVER be used on any production or client-facing project.
--
-- Placeholder UUIDs in this file:
--   owner-uuid-0001-0001-0001-000000000001   → owner@veroxa.test
--   operator-uuid-002-0002-0002-000000000002 → operator@veroxa.test
--   team-uuid-0003-0003-0003-000000000003    → team@veroxa.test
--   client-uuid-004-0004-0004-000000000004   → client@veroxa.test
--   inactive-uuid-05-0005-0005-000000000005  → inactive@veroxa.test
--
-- REPLACE THESE UUIDs with the real ones from the Supabase Auth dashboard
-- before running the user_profiles INSERT below.
-- =============================================================================

-- =============================================================================
-- STEP A — Create auth.users rows (Option B: direct insert)
-- =============================================================================
-- WARNING: Only run this block if you chose Option B above.
-- The Supabase dashboard (Option A) is the safer path for dev projects.
-- These passwords are dev-only throwaways.
-- =============================================================================

/*
insert into auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  role, aud
) values
(
  'owner-uuid-0001-0001-0001-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'owner@veroxa.test',
  crypt('Dev-Owner-Pass-001!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated', 'authenticated'
),
(
  'operator-uuid-002-0002-0002-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'operator@veroxa.test',
  crypt('Dev-Operator-Pass-002!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated', 'authenticated'
),
(
  'team-uuid-0003-0003-0003-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'team@veroxa.test',
  crypt('Dev-Team-Pass-003!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated', 'authenticated'
),
(
  'client-uuid-004-0004-0004-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'client@veroxa.test',
  crypt('Dev-Client-Pass-004!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated', 'authenticated'
),
(
  'inactive-uuid-05-0005-0005-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'inactive@veroxa.test',
  crypt('Dev-Inactive-Pass-005!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated', 'authenticated'
);
*/

-- =============================================================================
-- STEP B — Create user_profiles rows
-- =============================================================================
-- Replace the placeholder UUIDs below with the actual auth.users.id
-- values from Step A or from the Supabase Auth dashboard.
-- =============================================================================

insert into public.user_profiles (id, display_name, email, role, is_active) values
  ('owner-uuid-0001-0001-0001-000000000001', 'Dev Owner',    'owner@veroxa.test',    'owner',    true),
  ('operator-uuid-002-0002-0002-000000000002', 'Dev Operator', 'operator@veroxa.test', 'operator', true),
  ('team-uuid-0003-0003-0003-000000000003', 'Dev Team',      'team@veroxa.test',      'team',     true),
  ('client-uuid-004-0004-0004-000000000004', 'Dev Client',   'client@veroxa.test',   'client',   true),
  ('inactive-uuid-05-0005-0005-000000000005', 'Dev Inactive', 'inactive@veroxa.test', 'team',     false);

-- =============================================================================
-- STEP C — Create team_members row for team user
-- =============================================================================
-- Only the team user gets a team_members row in M001 scope.
-- The operator and owner can be added in Step 5 / Test 22.
-- =============================================================================

insert into public.team_members (user_profile_id, role_label) values
  ('team-uuid-0003-0003-0003-000000000003', 'Content Lead');

-- =============================================================================
-- STEP D — Verify seed
-- =============================================================================
-- Paste and run this block separately to confirm the seed is correct.
-- Expected: 5 rows in user_profiles; 1 row in team_members.
-- =============================================================================

select id, display_name, email, role, is_active from public.user_profiles order by role;
select * from public.team_members;

-- =============================================================================
-- After running this file, keep the following UUIDs handy — you will need
-- them when setting up jwt.claims in 03_test_queries.sql:
--
--   OWNER_UUID    = 'owner-uuid-0001-0001-0001-000000000001'
--   OPERATOR_UUID = 'operator-uuid-002-0002-0002-000000000002'
--   TEAM_UUID     = 'team-uuid-0003-0003-0003-000000000003'
--   CLIENT_UUID   = 'client-uuid-004-0004-0004-000000000004'
--   INACTIVE_UUID = 'inactive-uuid-05-0005-0005-000000000005'
-- =============================================================================
