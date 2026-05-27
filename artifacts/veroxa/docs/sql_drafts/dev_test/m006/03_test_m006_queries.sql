-- =============================================================================
-- M006 Dev Test — Step 3: Test Queries
--
-- ⚠ REPLACE PLACEHOLDERS BEFORE RUNNING
--   <<CLIENT_A_UUID>>  — auth.uid() of client@veroxa.test  (linked to Restaurant A)
--   <<TEAM_A_UUID>>    — auth.uid() of team@veroxa.test    (assigned A, executor)
--   <<TEAM_B_UUID>>    — auth.uid() of team2@veroxa.test   (assigned B, reporter)
--   <<OPERATOR_UUID>>  — auth.uid() of operator@veroxa.test
--   <<OWNER_UUID>>     — auth.uid() of owner@veroxa.test
--
-- Run each numbered block separately. Per-user blocks use BEGIN/ROLLBACK
-- so mutations don't persist.
-- =============================================================================


-- =============================================================================
-- Test 1 — Client read-blocked on content_concepts
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as visible_concepts from public.content_concepts;
  -- EXPECTED: 0  (no client policy)
rollback;

-- 1b. client INSERT → denied.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  insert into public.content_concepts (client_id, content_angle)
  values ('a0000000-0000-4000-a000-00000000000a', 'should fail');
  -- EXPECTED: ERROR new row violates row-level security policy
rollback;

-- 1c. client UPDATE → 0 rows.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  update public.content_concepts set status='archived'
   where client_id='a0000000-0000-4000-a000-00000000000a';
  -- EXPECTED: UPDATE 0
rollback;

-- 1d. client DELETE → 0 rows.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  delete from public.content_concepts
   where client_id='a0000000-0000-4000-a000-00000000000a';
  -- EXPECTED: DELETE 0
rollback;


-- =============================================================================
-- Test 2 — Client read-blocked on draft_sets
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as visible_sets from public.draft_sets;
  -- EXPECTED: 0

  insert into public.draft_sets (concept_id)
  values ('a6000001-0000-4000-a000-000000000001');
  -- EXPECTED: ERROR row-level security
rollback;


-- =============================================================================
-- Test 3 — Client read-blocked on draft_variants (even own published post's variant)
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as visible_variants from public.draft_variants;
  -- EXPECTED: 0

  -- DV_1 is used on client A's published POST_A2 — clients still cannot see it.
  select count(*) as own_post_variant
  from public.draft_variants
  where id='a6000003-0000-4000-a000-000000000001';
  -- EXPECTED: 0
rollback;


-- =============================================================================
-- Test 4 — Client read-blocked on ai_agents
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<CLIENT_A_UUID>>","role":"authenticated"}';

  select count(*) as visible_agents from public.ai_agents;
  -- EXPECTED: 0

  insert into public.ai_agents (agent_key, name, category, purpose)
  values ('client_injected', 'X', 'content', 'should fail');
  -- EXPECTED: ERROR row-level security
rollback;


-- =============================================================================
-- Test 5 — Team scope on content_concepts
-- =============================================================================
-- 5a. team@A concepts on A
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  select count(*) as a_concepts from public.content_concepts
  where client_id='a0000000-0000-4000-a000-00000000000a';
  -- EXPECTED: 3 (CA_1, CA_2, CA_3)

  select count(*) as b_concepts from public.content_concepts
  where client_id='b0000000-0000-4000-b000-00000000000b';
  -- EXPECTED: 0
rollback;

-- 5b. team@A INSERT for A succeeds.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  insert into public.content_concepts (client_id, content_angle)
  values ('a0000000-0000-4000-a000-00000000000a', 'weekend brunch crowd shot');
  -- EXPECTED: INSERT 0 1
rollback;

-- 5c. team@A INSERT for B → denied.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  insert into public.content_concepts (client_id, content_angle)
  values ('b0000000-0000-4000-b000-00000000000b', 'should fail');
  -- EXPECTED: ERROR row-level security
rollback;

-- 5d. team2@B (reporter) INSERT for B → denied.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_B_UUID>>","role":"authenticated"}';

  insert into public.content_concepts (client_id, content_angle)
  values ('b0000000-0000-4000-b000-00000000000b', 'should fail (reporter)');
  -- EXPECTED: ERROR row-level security
rollback;


-- =============================================================================
-- Test 6 — Team scope on draft_sets and draft_variants
-- =============================================================================
-- 6a. team@A sees only sets on A's concepts (DS_1, DS_2, DS_3).
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  select count(*) as a_sets from public.draft_sets;
  -- EXPECTED: 3
rollback;

-- 6b. team@A INSERT set on CA_1 succeeds.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  insert into public.draft_sets (concept_id)
  values ('a6000001-0000-4000-a000-000000000001');
  -- EXPECTED: INSERT 0 1
rollback;

-- 6c. team@A INSERT set on CB_1 → denied (concept belongs to B).
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  insert into public.draft_sets (concept_id)
  values ('b6000001-0000-4000-b000-000000000001');
  -- EXPECTED: ERROR row-level security
rollback;

-- 6d. team@A INSERT variant on DS_1 (A's set) succeeds.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  insert into public.draft_variants (draft_set_id, variant_type, caption_body)
  values ('a6000002-0000-4000-a000-000000000001', 'safe', 'team@A test variant');
  -- EXPECTED: INSERT 0 1
rollback;

-- 6e. team@A INSERT variant on DS_4 (B's set) → denied.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<TEAM_A_UUID>>","role":"authenticated"}';

  insert into public.draft_variants (draft_set_id, variant_type, caption_body)
  values ('b6000002-0000-4000-b000-000000000001', 'safe', 'should fail');
  -- EXPECTED: ERROR row-level security
rollback;


-- =============================================================================
-- Test 7 — Operator visibility + ai_agents read-only for operator
-- =============================================================================
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';

  select count(*) as op_concepts from public.content_concepts;
  -- EXPECTED: 4

  select count(*) as op_sets from public.draft_sets;
  -- EXPECTED: 4

  select count(*) as op_variants from public.draft_variants;
  -- EXPECTED: 5

  -- Operator can update concept status on any tenant.
  update public.content_concepts set status='approved'
   where id='a6000001-0000-4000-a000-000000000002'
  returning id, status;
  -- EXPECTED: 1 row, status='approved'

  select count(*) as op_agents from public.ai_agents;
  -- EXPECTED: 5 (operator SELECT policy)

  -- Operator UPDATE on ai_agents → denied (owner-only).
  update public.ai_agents set is_enabled=true where agent_key='caption';
  -- EXPECTED: UPDATE 0 (RLS hides row from UPDATE) OR ERROR row-level security
rollback;

-- 7b. Operator setting config_json → denied.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';

  update public.ai_agents
     set config_json='{"model":"demo","temperature":0.7,"prompt_template_id":"v1","max_tokens":400}'::jsonb
   where agent_key='caption';
  -- EXPECTED: UPDATE 0 or ERROR row-level security
rollback;


-- =============================================================================
-- Test 8 — Owner-only ai_agents writes
-- =============================================================================
-- 8a. Owner toggle is_enabled.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';

  update public.ai_agents set is_enabled=true
   where agent_key='caption'
  returning agent_key, is_enabled;
  -- EXPECTED: 1 row, is_enabled=true
rollback;

-- 8b. Owner set config_json with locked shape (NO secrets).
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';

  update public.ai_agents
     set config_json='{"model":"demo","temperature":0.7,"prompt_template_id":"v1","max_tokens":400}'::jsonb
   where agent_key='caption'
  returning agent_key, config_json;
  -- EXPECTED: 1 row, config_json as set
rollback;

-- 8c. Owner INSERT new agent.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OWNER_UUID>>","role":"authenticated"}';

  insert into public.ai_agents (agent_key, name, category, purpose)
  values ('voice_match','Voice Match','content','Style alignment')
  returning agent_key;
  -- EXPECTED: 1 row
rollback;

-- 8d. Confirm config_json contains no secret-shaped values across the catalog.
select count(*) as suspicious
from public.ai_agents
where config_json::text ~* '(api[_-]?key|bearer\s|sk-[a-z0-9]{8})';
-- EXPECTED: 0


-- =============================================================================
-- Test 9 — System (service_role) writes last_run_at; non-service denied
-- =============================================================================
-- 9a. Service role (default postgres context in SQL editor bypasses RLS).
begin;
  update public.ai_agents set last_run_at=now()
   where agent_key='caption'
  returning agent_key, last_run_at;
  -- EXPECTED: 1 row, last_run_at populated
rollback;

-- 9b. Operator authenticated UPDATE last_run_at → denied.
begin;
  set local role authenticated;
  set local "request.jwt.claims" to '{"sub":"<<OPERATOR_UUID>>","role":"authenticated"}';

  update public.ai_agents set last_run_at=now() where agent_key='caption';
  -- EXPECTED: UPDATE 0 or ERROR row-level security
rollback;


-- =============================================================================
-- Test 10 — Post FK addition safety
-- =============================================================================
-- 10a. Set posts.concept_id to non-existent uuid → fails.
begin;
  update public.posts
     set concept_id='ffffffff-ffff-4fff-ffff-ffffffffffff'
   where id='a4000001-0000-4000-a000-000000000002';
  -- EXPECTED: ERROR insert or update on table "posts" violates foreign key constraint
rollback;

-- 10b. Set posts.concept_id to CA_1 → succeeds.
begin;
  update public.posts
     set concept_id='a6000001-0000-4000-a000-000000000001'
   where id='a4000001-0000-4000-a000-000000000002'
  returning id, concept_id;
  -- EXPECTED: 1 row
rollback;

-- 10c. Set posts.draft_variant_id to non-existent uuid → fails.
begin;
  update public.posts
     set draft_variant_id='ffffffff-ffff-4fff-ffff-ffffffffffff'
   where id='a4000001-0000-4000-a000-000000000002';
  -- EXPECTED: ERROR foreign key constraint
rollback;

-- 10d. Set posts.draft_variant_id to DV_1 → succeeds.
begin;
  update public.posts
     set draft_variant_id='a6000003-0000-4000-a000-000000000001'
   where id='a4000001-0000-4000-a000-000000000002'
  returning id, draft_variant_id;
  -- EXPECTED: 1 row
rollback;

-- 10e. Delete CA_1 → any post.concept_id pointing at it becomes NULL; post survives.
begin;
  update public.posts
     set concept_id='a6000001-0000-4000-a000-000000000001'
   where id='a4000001-0000-4000-a000-000000000002';

  delete from public.content_concepts
   where id='a6000001-0000-4000-a000-000000000001';
  -- EXPECTED: DELETE 1

  select id, concept_id from public.posts
   where id='a4000001-0000-4000-a000-000000000002';
  -- EXPECTED: 1 row, concept_id=NULL (post still exists)
rollback;

-- 10f. Delete DV_1 → post.draft_variant_id NULL; post survives.
begin;
  update public.posts
     set draft_variant_id='a6000003-0000-4000-a000-000000000001'
   where id='a4000001-0000-4000-a000-000000000002';

  delete from public.draft_variants
   where id='a6000003-0000-4000-a000-000000000001';
  -- EXPECTED: DELETE 1

  select id, draft_variant_id from public.posts
   where id='a4000001-0000-4000-a000-000000000002';
  -- EXPECTED: 1 row, draft_variant_id=NULL
rollback;


-- =============================================================================
-- Test 11 — NO real AI activity (zero-credentials assertion)
-- =============================================================================
-- 11a. Inserting concepts / sets / variants triggers NO external call.
--      (No HTTP-extension calls in this codepath; the schema has no
--      trigger that reaches outside Postgres. Verified by grep of the
--      M006 SQL draft: no `extensions.http`, no `pg_net`, no `net.http_post`.)

-- Quick repo-side audit (run from your shell, NOT from SQL editor):
--   grep -rni 'pg_net\|net.http_post\|extensions.http' \
--     artifacts/veroxa/docs/sql_drafts/migrations_review/006_content_ai_layer_draft.sql
--   EXPECTED: no matches.

-- 11b. ai_agents.is_enabled=true is inert (no runtime reads it).
--      Toggle in this SQL and confirm no observable side effect; the
--      lack of a runtime IS the assertion. Documentary test.

-- 11c. Config_json hygiene — no secret-shaped substring across all rows.
select agent_key, config_json
from public.ai_agents
where config_json::text ~* '(api[_-]?key|bearer\s|sk-[a-z0-9]{8}|password|secret|token)';
-- EXPECTED: 0 rows.


-- =============================================================================
-- Test 12 — additional_media_ids hygiene (documented V1 limitation)
-- =============================================================================
-- 12a. Insert concept with two valid media UUIDs from client A → succeeds.
begin;
  insert into public.content_concepts
    (client_id, content_angle, additional_media_ids)
  values
    ('a0000000-0000-4000-a000-00000000000a',
     'multi-media concept',
     -- Reuse two MEDIA_A_* UUIDs from M003 seed (replace if your seed uses different ids):
     ARRAY['a000000a-0001-4000-a000-00000000000a',
           'a000000a-0002-4000-a000-00000000000a']::uuid[])
  returning id;
  -- EXPECTED: INSERT 0 1
rollback;

-- 12b. Insert with a random uuid that does NOT resolve to media_assets → still succeeds (no FK enforcement on array).
begin;
  insert into public.content_concepts
    (client_id, content_angle, additional_media_ids)
  values
    ('a0000000-0000-4000-a000-00000000000a',
     'limitation demo',
     ARRAY['ffffffff-ffff-4fff-ffff-ffffffffffff']::uuid[])
  returning id;
  -- EXPECTED: INSERT 0 1   (confirms documented V1 limitation E4)
rollback;

-- 12c. Insert on client A with a media UUID from client B → still succeeds at DB layer.
begin;
  insert into public.content_concepts
    (client_id, content_angle, additional_media_ids)
  values
    ('a0000000-0000-4000-a000-00000000000a',
     'cross-tenant array demo',
     ARRAY['b000000b-0001-4000-b000-00000000000b']::uuid[])
  returning id;
  -- EXPECTED: INSERT 0 1   (confirms future validation trigger is needed)
rollback;


-- =============================================================================
-- Test 13 — Rollback ordering: post FKs before draft / concept tables
-- =============================================================================
-- 13a. Drop content_concepts WITHOUT dropping the posts FK first → fails.
begin;
  drop table public.content_concepts;
  -- EXPECTED: ERROR cannot drop table content_concepts because other objects depend on it
rollback;

-- 13b. Drop FKs first, then tables → succeeds (within a rolled-back transaction).
begin;
  alter table public.posts drop constraint if exists posts_draft_variant_id_fkey;
  alter table public.posts drop constraint if exists posts_concept_id_fkey;
  drop table if exists public.draft_variants   cascade;
  drop table if exists public.draft_sets       cascade;
  drop table if exists public.content_concepts cascade;
  drop table if exists public.ai_agents        cascade;
  -- EXPECTED: all six statements succeed
rollback;
-- After rollback the schema returns to its pre-test state.


-- =============================================================================
-- Test 14 — Re-application / idempotency
-- =============================================================================
-- 14a. Apply 006 source SQL through Supabase runner a second time → "already applied".
-- 14b. Re-running 01_apply_m006.sql raw → fails cleanly with "relation already exists".
--      (Demonstration: re-run 01_apply_m006.sql from this directory — expect ERROR.)


-- =============================================================================
-- Test 15 — RLS predicate cost (optional — needs ~1000 rows)
-- =============================================================================
-- Only meaningful if a load-test seed has been written. With the basic
-- M006 fixture (4 concepts) the timing is uninformative. Skip unless a
-- ~1000-concept variant is seeded.
--
-- explain (analyze, buffers)
-- select count(*) from public.draft_sets;
-- as team@A — target < 50 ms.
