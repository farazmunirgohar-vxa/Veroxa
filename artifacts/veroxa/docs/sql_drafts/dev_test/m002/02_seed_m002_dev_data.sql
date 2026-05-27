-- =============================================================================
-- M002 SEED — DEV DATA ONLY — NOT PRODUCTION
--
-- Run AFTER 01_apply_m002.sql, as the postgres (service-role) user.
--
-- PRECONDITION: the five M001 dev users already exist:
--   owner@veroxa.test, operator@veroxa.test, team@veroxa.test,
--   client@veroxa.test, inactive@veroxa.test
-- and team@veroxa.test has a public.team_members row.
--
-- This script also creates ONE NEW dev auth user, team2@veroxa.test,
-- which the M002 test plan requires for cross-tenant tests.
-- =============================================================================

-- =============================================================================
-- UUID CONFIG SECTION — REPLACE BEFORE RUNNING
--
-- Look up these UUIDs from the Supabase dashboard (Authentication → Users
-- → click each user → copy ID) OR from the user_profiles table:
--   select id, email, role from public.user_profiles order by role;
--
-- Then replace EVERY occurrence below.
--
-- Required UUIDs (already exist from M001):
--   <<OWNER_UUID>>     — owner@veroxa.test
--   <<OPERATOR_UUID>>  — operator@veroxa.test
--   <<TEAM_UUID>>      — team@veroxa.test         (must have team_members row)
--   <<CLIENT_UUID>>    — client@veroxa.test
--
-- Required UUIDs (created by this script — KEEP THESE FIXED VALUES so the
-- test queries don't need lookup):
--   CLIENT_A_ID = 'a0000000-0000-4000-a000-00000000000a'
--   CLIENT_B_ID = 'b0000000-0000-4000-b000-00000000000b'
--   TEAM2_UUID  = '12222222-2222-4222-a222-222222222222'
-- =============================================================================

-- =============================================================================
-- STEP A — Create team2@veroxa.test auth user (NEW for M002)
--
-- Option A (recommended): Use the Supabase dashboard → Authentication →
-- Add user. Use email "team2@veroxa.test", any throwaway dev password,
-- email confirmed = true. Then copy the UUID and replace TEAM2_UUID
-- below.
--
-- Option B (dev SQL editor with postgres superuser): uncomment the block
-- below. Replace TEAM2_UUID first if you want a different fixed value.
-- =============================================================================

/*
insert into auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, role, aud
) values (
  '12222222-2222-4222-a222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'team2@veroxa.test',
  crypt('Dev-Team2-Pass-006!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated', 'authenticated'
);
*/

-- =============================================================================
-- STEP B — Create team2 profile + team_members row
-- =============================================================================

insert into public.user_profiles (id, display_name, email, role, is_active) values
  ('12222222-2222-4222-a222-222222222222', 'Dev Team 2', 'team2@veroxa.test', 'team', true);

insert into public.team_members (user_profile_id, role_label) values
  ('12222222-2222-4222-a222-222222222222', 'Reporter');

-- =============================================================================
-- STEP C — Create two dev clients (fixed UUIDs so test queries are simple)
--
-- Pricing values MATCH the locked pricing table (no dollar math — cents only):
--   Demo Restaurant A: COP 12-month   → 99700  cents = $997/mo
--   Demo Restaurant B: GPS month-to-month → 49700 cents = $497/mo
-- =============================================================================

insert into public.clients (
  id, business_name, legal_name,
  primary_contact_name, primary_contact_email, primary_contact_phone,
  cuisine_type, address, website_url, hours_text,
  plan_type, service_package, monthly_fee_cents,
  contract_months, start_date, posting_frequency_weekly,
  timezone, assigned_operator_id, assigned_team_label,
  account_status, content_health_status, risk_status, onboarding_complete
) values
(
  'a0000000-0000-4000-a000-00000000000a',
  'Demo Restaurant A', 'Dev A LLC',
  'Alex Owner', 'contact-a@veroxa.test', '+1-555-0100',
  'demo', '100 Dev St, Demo City', 'https://example.test/a', 'Mon-Sun 11-22',
  'twelve_month', 'complete_online_presence', 99700,
  12, current_date - interval '30 days', 3,
  'America/Chicago', NULL, 'Team Blue',
  'active', 'healthy', 'good', true
),
(
  'b0000000-0000-4000-b000-00000000000b',
  'Demo Restaurant B', 'Dev B LLC',
  'Blake Owner', 'contact-b@veroxa.test', '+1-555-0200',
  'demo', '200 Dev St, Demo City', 'https://example.test/b', 'Mon-Sat 12-21',
  'month_to_month', 'google_presence_starter', 49700,
  NULL, current_date - interval '7 days', 0,
  'America/Chicago', NULL, NULL,
  'onboarding', 'healthy', 'good', false
);

-- =============================================================================
-- STEP D — Wire client@veroxa.test to Restaurant A
-- =============================================================================
-- This update matches by email, so no UUID replacement is needed here.
-- (The CLIENT_UUID placeholder is only used in 03_test_m002_queries.sql.)

update public.user_profiles
set client_id = 'a0000000-0000-4000-a000-00000000000a'
where email = 'client@veroxa.test';

-- =============================================================================
-- STEP E — team_client_assignments
--   team@veroxa.test  → Restaurant A, executor, active
--   team2@veroxa.test → Restaurant B, reporter, active
-- =============================================================================

insert into public.team_client_assignments (team_member_id, client_id, assignment_role, is_active)
select tm.id, 'a0000000-0000-4000-a000-00000000000a'::uuid, 'executor', true
from public.team_members tm
join public.user_profiles up on up.id = tm.user_profile_id
where up.email = 'team@veroxa.test';

insert into public.team_client_assignments (team_member_id, client_id, assignment_role, is_active)
select tm.id, 'b0000000-0000-4000-b000-00000000000b'::uuid, 'reporter', true
from public.team_members tm
join public.user_profiles up on up.id = tm.user_profile_id
where up.email = 'team2@veroxa.test';

-- =============================================================================
-- STEP F — client_platforms (with internal notes for view-hiding test)
-- =============================================================================

insert into public.client_platforms (client_id, platform_name, access_status, username_or_handle, notes) values
  ('a0000000-0000-4000-a000-00000000000a', 'instagram',       'verified', '@demo_a',         'internal handoff'),
  ('a0000000-0000-4000-a000-00000000000a', 'google_business', 'granted',  'Demo A on Google', 'manager added 2026-05'),
  ('b0000000-0000-4000-b000-00000000000b', 'instagram',       'pending',  '@demo_b',         'awaiting client password'),
  ('b0000000-0000-4000-b000-00000000000b', 'google_business', 'pending',  NULL,              NULL);

-- =============================================================================
-- STEP G — onboarding_items (mix of client-owned and operator-owned)
-- =============================================================================

insert into public.onboarding_items (client_id, item_key, item_label, status, owner_role, priority) values
  ('a0000000-0000-4000-a000-00000000000a', 'menu_uploaded',        'Upload current menu',         'pending',     'client',   'high'),
  ('a0000000-0000-4000-a000-00000000000a', 'gbp_access_granted',   'Grant Google Business access','complete',    'client',   'high'),
  ('a0000000-0000-4000-a000-00000000000a', 'brand_voice_review',   'Brand voice review',          'not_started', 'operator', 'medium'),
  ('a0000000-0000-4000-a000-00000000000a', 'first_post_scheduled', 'Schedule first post',         'not_started', 'team',     'medium'),
  ('b0000000-0000-4000-b000-00000000000b', 'menu_uploaded',        'Upload current menu',         'not_started', 'client',   'high'),
  ('b0000000-0000-4000-b000-00000000000b', 'brand_voice_review',   'Brand voice review',          'not_started', 'operator', 'medium');

-- =============================================================================
-- STEP H — client_requests
-- =============================================================================

insert into public.client_requests (client_id, request_type, title, description, status, priority, assigned_to_role) values
  ('a0000000-0000-4000-a000-00000000000a', 'content_change',    'Add summer special',  'Please add the new summer special to next week''s posts.', 'pending', 'normal', 'team'),
  ('a0000000-0000-4000-a000-00000000000a', 'platform_question', 'Why is GBP slow?',    'Asking about Google Business slowness.',                    'pending', 'low',    'operator'),
  ('b0000000-0000-4000-b000-00000000000b', 'content_change',    'Logo update needed',  'New logo file attached separately.',                        'pending', 'normal', 'team');

-- =============================================================================
-- STEP I — VERIFY SEED (paste this block separately)
-- =============================================================================

select 'clients' as table_name, count(*) from public.clients
union all select 'team_client_assignments', count(*) from public.team_client_assignments
union all select 'client_platforms',        count(*) from public.client_platforms
union all select 'onboarding_items',        count(*) from public.onboarding_items
union all select 'client_requests',         count(*) from public.client_requests;
-- EXPECTED row counts:
--   clients = 2
--   team_client_assignments = 2
--   client_platforms = 4
--   onboarding_items = 6
--   client_requests = 3

select id, business_name, service_package, plan_type, monthly_fee_cents
from public.clients order by business_name;
-- EXPECTED:
--   Demo Restaurant A | complete_online_presence | twelve_month     | 99700
--   Demo Restaurant B | google_presence_starter  | month_to_month   | 49700

select up.email, up.client_id
from public.user_profiles up
where up.email = 'client@veroxa.test';
-- EXPECTED: client_id = 'a0000000-0000-4000-a000-00000000000a'

-- =============================================================================
-- Keep these handy for 03_test_m002_queries.sql:
--   OWNER_UUID    = (the M001 owner@veroxa.test UUID)
--   OPERATOR_UUID = (the M001 operator@veroxa.test UUID)
--   TEAM_UUID     = (the M001 team@veroxa.test UUID)
--   TEAM2_UUID    = '12222222-2222-4222-a222-222222222222'
--   CLIENT_UUID   = (the M001 client@veroxa.test UUID)
--   CLIENT_A_ID   = 'a0000000-0000-4000-a000-00000000000a'
--   CLIENT_B_ID   = 'b0000000-0000-4000-b000-00000000000b'
-- =============================================================================
