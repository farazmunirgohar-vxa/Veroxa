-- =============================================================================
-- M005 Dev Test — Step 2: Seed Dev Data
--
-- ⚠ REPLACE PLACEHOLDERS BEFORE RUNNING
--   Search for << and >> and replace each placeholder with a real UUID
--   from the dev project's auth.users / user_profiles table:
--
--   <<OWNER_UUID>>    — the owner user's auth.uid()
--   <<OPERATOR_UUID>> — the operator user's auth.uid()
--   <<TEAM_UUID>>     — team@veroxa.test user's auth.uid()
--
-- All other UUIDs are fixed. Do not change them.
--
-- Run as postgres (superuser) in the Supabase SQL editor.
-- Expected result: "Success. No rows returned." after each block.
--
-- Builds on M001–M004 fixtures (clients A + B, POST_A1, POST_A2).
-- =============================================================================

-- =============================================================================
-- Fixed UUIDs (do not randomise)
-- =============================================================================
-- WR_A1  a5000001-0000-4000-a000-000000000001  A weekly drafted    2026-05-04
-- WR_A2  a5000001-0000-4000-a000-000000000002  A weekly validated  2026-04-27
-- WR_A3  a5000001-0000-4000-a000-000000000003  A weekly published  2026-04-20
-- WR_A4  a5000001-0000-4000-a000-000000000004  A weekly published  2026-04-13 (top_post NULL)
-- WR_B1  b5000001-0000-4000-b000-000000000001  B weekly drafted    2026-05-04
-- WR_B2  b5000001-0000-4000-b000-000000000002  B weekly published  2026-04-20
-- MR_A1  a5000002-0000-4000-a000-000000000001  A monthly drafting       2026-05
-- MR_A2  a5000002-0000-4000-a000-000000000002  A monthly operator_review 2026-04
-- MR_A3  a5000002-0000-4000-a000-000000000003  A monthly approved       2026-03
-- MR_A4  a5000002-0000-4000-a000-000000000004  A monthly published      2026-02
-- MR_B1  b5000002-0000-4000-b000-000000000001  B monthly drafting       2026-05
-- MR_B2  b5000002-0000-4000-b000-000000000002  B monthly published      2026-03

-- =============================================================================
-- Reference summary_json shape (used for all rows):
--   {
--     "client_safe": {
--       "headline":   "Strong week for reach",
--       "highlights": ["Reel hit 12k views", "Saturday brunch sold out"]
--     },
--     "internal": {
--       "validation_notes_draft": "...",
--       "operator_review_notes":  "..."
--     }
--   }
-- =============================================================================

-- =============================================================================
-- 1. weekly_reports — Restaurant A (4 rows)
-- =============================================================================

insert into public.weekly_reports
  (id, client_id, week_start, week_end, posts_planned, posts_published,
   top_post_id, status, draft_owner_id, validation_owner_id,
   internal_validation_note, client_safe_summary, summary_json, published_at)
values
  -- WR_A1 — drafted (current week minus draft state)
  ('a5000001-0000-4000-a000-000000000001',
   'a0000000-0000-4000-a000-00000000000a',
   '2026-05-04', '2026-05-10', 5, 3,
   'a4000001-0000-4000-a000-000000000002', 'drafted',
   '<<TEAM_UUID>>', null,
   'Need brand check on the closing line',
   'Solid week — three published posts on track.',
   '{"client_safe":{"headline":"On track this week","highlights":["3 published","Reach trending up"]},"internal":{"validation_notes_draft":"Need brand check on the closing line"}}'::jsonb,
   null),

  -- WR_A2 — validated
  ('a5000001-0000-4000-a000-000000000002',
   'a0000000-0000-4000-a000-00000000000a',
   '2026-04-27', '2026-05-03', 5, 4,
   'a4000001-0000-4000-a000-000000000001', 'validated',
   '<<TEAM_UUID>>', '<<TEAM_UUID>>',
   'Looks good — operator can publish',
   'Strong four-post week with brunch promo as the standout.',
   '{"client_safe":{"headline":"Strong week","highlights":["Brunch promo led the week","4 of 5 planned posts published"]},"internal":{"operator_review_notes":"Looks good — operator can publish"}}'::jsonb,
   null),

  -- WR_A3 — published 2026-04-27
  ('a5000001-0000-4000-a000-000000000003',
   'a0000000-0000-4000-a000-00000000000a',
   '2026-04-20', '2026-04-26', 5, 5,
   'a4000001-0000-4000-a000-000000000002', 'published',
   '<<TEAM_UUID>>', '<<OPERATOR_UUID>>',
   'Validated by operator; safe to publish',
   'Anniversary reel was your top post — 12k views.',
   '{"client_safe":{"headline":"Anniversary reel led the week","highlights":["12k views on the reel","5 of 5 planned posts shipped"]},"internal":{"validation_notes_draft":"Anniversary reel cleared","operator_review_notes":"Clear to publish"}}'::jsonb,
   '2026-04-27 18:00:00+00'),

  -- WR_A4 — published 2026-04-20 (top_post_id NULL — historical)
  ('a5000001-0000-4000-a000-000000000004',
   'a0000000-0000-4000-a000-00000000000a',
   '2026-04-13', '2026-04-19', 4, 4,
   null, 'published',
   '<<TEAM_UUID>>', '<<OPERATOR_UUID>>',
   'No standout this week',
   'A steady week — four posts shipped on cadence.',
   '{"client_safe":{"headline":"Steady week","highlights":["4 of 4 planned posts shipped","Cadence held"]},"internal":{"validation_notes_draft":"Nothing remarkable"}}'::jsonb,
   '2026-04-20 18:00:00+00')
;

-- Confirm 4 A weeklies
select count(*) as a_weekly_count from public.weekly_reports
where client_id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 4

-- =============================================================================
-- 2. weekly_reports — Restaurant B (2 rows)
-- =============================================================================

insert into public.weekly_reports
  (id, client_id, week_start, week_end, posts_planned, posts_published,
   status, draft_owner_id, validation_owner_id, summary_json, published_at)
values
  ('b5000001-0000-4000-b000-000000000001',
   'b0000000-0000-4000-b000-00000000000b',
   '2026-05-04', '2026-05-10', 3, 1,
   'drafted', '<<OPERATOR_UUID>>', null,
   '{"client_safe":{"headline":"Slower start"},"internal":{"validation_notes_draft":"Awaiting team push"}}'::jsonb,
   null),

  ('b5000001-0000-4000-b000-000000000002',
   'b0000000-0000-4000-b000-00000000000b',
   '2026-04-20', '2026-04-26', 3, 3,
   'published', '<<OPERATOR_UUID>>', '<<OPERATOR_UUID>>',
   '{"client_safe":{"headline":"All three posts published this week"},"internal":{"operator_review_notes":"Approved by operator"}}'::jsonb,
   '2026-04-27 18:00:00+00')
;

-- Confirm 2 B weeklies
select count(*) as b_weekly_count from public.weekly_reports
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 2

-- =============================================================================
-- 3. monthly_reports — Restaurant A (4 rows)
-- =============================================================================

insert into public.monthly_reports
  (id, client_id, month_key, status, summary_json, client_safe_summary,
   approved_by_user_id, published_at)
values
  -- MR_A1 — drafting (current month)
  ('a5000002-0000-4000-a000-000000000001',
   'a0000000-0000-4000-a000-00000000000a',
   '2026-05', 'drafting',
   '{"client_safe":{"headline":"May in progress"},"internal":{}}'::jsonb,
   'May is still in progress.',
   null, null),

  -- MR_A2 — operator_review
  ('a5000002-0000-4000-a000-000000000002',
   'a0000000-0000-4000-a000-00000000000a',
   '2026-04', 'operator_review',
   '{"client_safe":{"headline":"April recap pending review"},"internal":{"operator_review_notes":"Pending operator pass"}}'::jsonb,
   'April recap pending review.',
   null, null),

  -- MR_A3 — approved (awaiting publish)
  ('a5000002-0000-4000-a000-000000000003',
   'a0000000-0000-4000-a000-00000000000a',
   '2026-03', 'approved',
   '{"client_safe":{"headline":"March was a record month"},"internal":{"operator_review_notes":"Approved"}}'::jsonb,
   'March was a record month.',
   '<<OPERATOR_UUID>>', null),

  -- MR_A4 — published
  ('a5000002-0000-4000-a000-000000000004',
   'a0000000-0000-4000-a000-00000000000a',
   '2026-02', 'published',
   '{"client_safe":{"headline":"February recap","highlights":["MoM growth on reach","Two viral reels"]},"internal":{}}'::jsonb,
   'February recap — strong MoM growth.',
   '<<OPERATOR_UUID>>', '2026-03-01 18:00:00+00')
;

-- Confirm 4 A monthlies
select count(*) as a_monthly_count from public.monthly_reports
where client_id = 'a0000000-0000-4000-a000-00000000000a';
-- EXPECTED: 4

-- =============================================================================
-- 4. monthly_reports — Restaurant B (2 rows)
-- =============================================================================

insert into public.monthly_reports
  (id, client_id, month_key, status, summary_json, approved_by_user_id, published_at)
values
  ('b5000002-0000-4000-b000-000000000001',
   'b0000000-0000-4000-b000-00000000000b',
   '2026-05', 'drafting',
   '{"client_safe":{"headline":"May in progress"},"internal":{}}'::jsonb,
   null, null),

  ('b5000002-0000-4000-b000-000000000002',
   'b0000000-0000-4000-b000-00000000000b',
   '2026-03', 'published',
   '{"client_safe":{"headline":"March recap"},"internal":{}}'::jsonb,
   '<<OPERATOR_UUID>>', '2026-04-01 18:00:00+00')
;

-- Confirm 2 B monthlies
select count(*) as b_monthly_count from public.monthly_reports
where client_id = 'b0000000-0000-4000-b000-00000000000b';
-- EXPECTED: 2

-- =============================================================================
-- 5. Overall fixture summary
-- =============================================================================

select 'weekly_reports' as tbl, count(*) from public.weekly_reports
union all
select 'monthly_reports', count(*) from public.monthly_reports;
-- EXPECTED: weekly_reports=6, monthly_reports=6
