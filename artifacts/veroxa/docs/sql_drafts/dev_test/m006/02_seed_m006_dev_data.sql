-- =============================================================================
-- M006 Dev Test — Step 2: Seed Dev Data
--
-- ⚠ REPLACE PLACEHOLDERS BEFORE RUNNING
--   <<TEAM_UUID>>      — auth.uid() of team@veroxa.test (assigned A)
--   <<OPERATOR_UUID>>  — auth.uid() of operator@veroxa.test
--
-- All other UUIDs are fixed. Do not change them.
--
-- Run as postgres in the Supabase SQL editor.
-- Builds on M001–M004 fixtures (clients A + B, POST_A2, MEDIA_A1).
--
-- IMPORTANT: NO API KEYS, SECRETS, OR BEARER STRINGS ARE TO APPEAR IN
-- ANY ai_agents.config_json VALUE — IN THIS FILE OR ANYWHERE ELSE.
-- =============================================================================

-- =============================================================================
-- Fixed UUIDs (do not randomise)
-- =============================================================================
-- CA_1  a6000001-0000-4000-a000-000000000001  Concept on A — generated
-- CA_2  a6000001-0000-4000-a000-000000000002  Concept on A — under_review
-- CA_3  a6000001-0000-4000-a000-000000000003  Concept on A — rejected (staff)
-- CB_1  b6000001-0000-4000-b000-000000000001  Concept on B — generated
-- DS_1  a6000002-0000-4000-a000-000000000001  Set on CA_1, v1, generated
-- DS_2  a6000002-0000-4000-a000-000000000002  Set on CA_1, v2, needs_regeneration
-- DS_3  a6000002-0000-4000-a000-000000000003  Set on CA_2, v1, under_review
-- DS_4  b6000002-0000-4000-b000-000000000001  Set on CB_1, v1, generated
-- DV_1  a6000003-0000-4000-a000-000000000001  Variant safe approved used_in=POST_A2
-- DV_2  a6000003-0000-4000-a000-000000000002  Variant engagement archived
-- DV_3  a6000003-0000-4000-a000-000000000003  Variant sales generated
-- DV_4  a6000003-0000-4000-a000-000000000004  Variant safe under_review (on CA_2 / DS_3)
-- DV_5  b6000003-0000-4000-b000-000000000001  Variant safe generated (on CB_1 / DS_4)

-- =============================================================================
-- 1. content_concepts — Restaurant A (3) + Restaurant B (1)
-- =============================================================================

insert into public.content_concepts
  (id, client_id, content_angle, content_goal, hook_style, cta_direction,
   status, generated_at, generated_by_agent, reviewed_by_user_id)
values
  ('a6000001-0000-4000-a000-000000000001',
   'a0000000-0000-4000-a000-00000000000a',
   'Sunday brunch crowd-shot', 'awareness', 'story', 'visit',
   'generated', '2026-05-20 09:00:00+00', 'content_strategist', null),

  ('a6000001-0000-4000-a000-000000000002',
   'a0000000-0000-4000-a000-00000000000a',
   'Anniversary owner story', 'branding', 'story', 'share',
   'under_review', '2026-05-19 09:00:00+00', 'content_strategist', '<<TEAM_UUID>>'),

  ('a6000001-0000-4000-a000-000000000003',
   'a0000000-0000-4000-a000-00000000000a',
   'Promo recovery', 'recovery', 'bold_statement', 'order',
   'rejected', null, null, '<<OPERATOR_UUID>>'),

  ('b6000001-0000-4000-b000-000000000001',
   'b0000000-0000-4000-b000-00000000000b',
   'Weekend special intro', 'awareness', 'question', 'visit',
   'generated', '2026-05-20 09:00:00+00', 'content_strategist', null)
;

select count(*) as concept_count from public.content_concepts;
-- EXPECTED: 4

-- =============================================================================
-- 2. draft_sets — 4 rows
-- =============================================================================

insert into public.draft_sets
  (id, concept_id, generation_version, status, team_note,
   generated_at, generated_by_agent)
values
  ('a6000002-0000-4000-a000-000000000001',
   'a6000001-0000-4000-a000-000000000001',
   1, 'generated', null,
   '2026-05-20 09:30:00+00', 'caption'),

  ('a6000002-0000-4000-a000-000000000002',
   'a6000001-0000-4000-a000-000000000001',
   2, 'needs_regeneration', 'First pass too generic; regenerating with stronger hook',
   '2026-05-21 09:30:00+00', 'caption'),

  ('a6000002-0000-4000-a000-000000000003',
   'a6000001-0000-4000-a000-000000000002',
   1, 'under_review', null,
   '2026-05-19 09:30:00+00', 'caption'),

  ('b6000002-0000-4000-b000-000000000001',
   'b6000001-0000-4000-b000-000000000001',
   1, 'generated', null,
   '2026-05-20 09:30:00+00', 'caption')
;

select count(*) as set_count from public.draft_sets;
-- EXPECTED: 4

-- =============================================================================
-- 3. draft_variants — 5 rows
-- =============================================================================

insert into public.draft_variants
  (id, draft_set_id, variant_type, caption_body, hook_text, cta_text,
   hashtag_block, brand_voice_score, status, used_in_post_id)
values
  ('a6000003-0000-4000-a000-000000000001',
   'a6000002-0000-4000-a000-000000000001',
   'safe',
   'Sunday brunch energy is everything. Come share the table with us.',
   'Sunday brunch energy is everything.',
   'See you Sunday.',
   '#sundaybrunch #weekendvibes',
   82, 'approved',
   'a4000001-0000-4000-a000-000000000002'),

  ('a6000003-0000-4000-a000-000000000002',
   'a6000002-0000-4000-a000-000000000001',
   'engagement',
   'Quick poll: pancakes or eggs benedict for your Sunday brunch?',
   'Quick poll —',
   'Drop your pick in the comments.',
   '#brunchdebate',
   76, 'archived', null),

  ('a6000003-0000-4000-a000-000000000003',
   'a6000002-0000-4000-a000-000000000001',
   'sales',
   'Book your Sunday brunch table before noon and your first round is on us.',
   'Sunday brunch booked? Round on us if you''re in before noon.',
   'Book your table now.',
   '#sundaybrunch #ontheoldhouse',
   71, 'generated', null),

  ('a6000003-0000-4000-a000-000000000004',
   'a6000002-0000-4000-a000-000000000003',
   'safe',
   'Twelve years of regulars who feel like family. Thank you for the chairs you''ve filled.',
   'Twelve years of regulars who feel like family.',
   'Tag a friend who''s shared a table here.',
   '#twelveyears #thankyou',
   88, 'under_review', null),

  ('b6000003-0000-4000-b000-000000000001',
   'b6000002-0000-4000-b000-000000000001',
   'safe',
   'New weekend menu is live. Come see what landed on the board.',
   'Weekend menu —',
   'See it on the board this Saturday.',
   '#weekendmenu',
   79, 'generated', null)
;

select count(*) as variant_count from public.draft_variants;
-- EXPECTED: 5

-- =============================================================================
-- 4. ai_agents — 5 catalog rows (all is_enabled=false, config_json=NULL)
-- =============================================================================
--
-- NO secrets. NO api keys. NO bearer tokens. config_json stays NULL at
-- seed; later tests may set the locked shape {model, temperature,
-- prompt_template_id, max_tokens} with placeholder values only.

insert into public.ai_agents
  (agent_key, name, category, purpose, is_enabled, mode, config_json)
values
  ('content_strategist', 'Content Strategist', 'content',
   'Generates concept-level ideas tied to brand voice and goals', false, 'demo', null),

  ('caption', 'Caption Writer', 'content',
   'Generates caption / hook / CTA / hashtag variants from a concept', false, 'demo', null),

  ('ops_router', 'Ops Router', 'operations',
   'Routes incoming requests to the assigned team member', false, 'demo', null),

  ('intel_analyst', 'Intelligence Analyst', 'intelligence',
   'Summarizes weekly metrics into a narrative draft', false, 'demo', null),

  ('exec_brief', 'Executive Brief', 'executive',
   'Produces operator-level monthly executive briefs', false, 'demo', null)
;

select count(*) as agent_count from public.ai_agents;
-- EXPECTED: 5

-- Confirm NO secret-shaped values in config_json:
select count(*) as suspicious_config
from public.ai_agents
where config_json::text ~* '(api[_-]?key|bearer|sk-[a-z0-9])';
-- EXPECTED: 0 — and must stay 0 throughout the run.

-- =============================================================================
-- 5. Overall fixture summary
-- =============================================================================

select 'content_concepts' as tbl, count(*) from public.content_concepts
union all
select 'draft_sets',             count(*) from public.draft_sets
union all
select 'draft_variants',         count(*) from public.draft_variants
union all
select 'ai_agents',              count(*) from public.ai_agents;
-- EXPECTED: 4, 4, 5, 5
