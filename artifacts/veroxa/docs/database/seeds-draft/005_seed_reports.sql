-- =============================================================================
-- 005_seed_reports.sql
-- Veroxa — Draft seed: weekly_reports and monthly_reports tables
-- DRAFT ONLY — do not apply to a live database without review
-- Source: src/lib/demo-data/reports.ts
-- Depends on: 001_seed_clients.sql
--
-- UUID ranges:
--   weekly_reports:  00000000-0000-0000-0006-000000000001 → 000000000002
--   monthly_reports: 00000000-0000-0000-0007-000000000001
-- =============================================================================

-- ── weekly_reports ────────────────────────────────────────────────────────────

INSERT INTO weekly_reports (
  id,
  client_id,
  week_start_date,
  week_end_date,
  status,
  posts_published,
  posts_planned,
  completion_rate,
  summary_text,
  generated_at,
  published_at,
  created_at,
  updated_at
) VALUES

-- Week 20 (19–25 May 2026) — published snapshot; must not be mutated
(
  '00000000-0000-0000-0006-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2026-05-19',
  '2026-05-25',
  'published',
  4,
  4,
  100.00,
  '4 posts published across Instagram and Facebook. Google impressions up 18%. Kebab platter post drove highest reach. 2 new 5-star reviews. Next shoot booked Thursday 29 May at 11am.',
  '2026-05-23T07:00:00Z',
  '2026-05-23T08:00:00Z',
  '2026-05-23T07:00:00Z',
  '2026-05-23T08:00:00Z'
),

-- Week 19 (12–18 May 2026) — published snapshot
(
  '00000000-0000-0000-0006-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '2026-05-12',
  '2026-05-18',
  'published',
  4,
  4,
  100.00,
  'Strong week — all 4 slots filled. Mixed grill platter drove 4,820 reach on Instagram.',
  '2026-05-18T18:30:00Z',
  '2026-05-18T19:00:00Z',
  '2026-05-18T18:30:00Z',
  '2026-05-18T19:00:00Z'
);

-- ── monthly_reports ───────────────────────────────────────────────────────────

INSERT INTO monthly_reports (
  id,
  client_id,
  month,
  year,
  status,
  posts_published,
  posts_planned,
  completion_rate,
  summary_text,
  operator_reviewed_at,
  approved_at,
  published_at,
  created_at,
  updated_at
) VALUES

-- April 2026 — approved and published snapshot
(
  '00000000-0000-0000-0007-000000000001',
  '00000000-0000-0000-0000-000000000001',
  4,     -- month: April
  2026,
  'approved',  -- status: approved (published_at is set; effectively a snapshot)
  18,
  20,
  90.00,
  'April 2026 — 18 posts published. Total reach 41,200. Google impressions 12,580. 6 new reviews.',
  '2026-05-03T10:00:00Z',
  '2026-05-03T11:00:00Z',
  '2026-05-03T11:30:00Z',
  '2026-05-01T09:00:00Z',
  '2026-05-03T11:30:00Z'
);
