-- =============================================================================
-- 002_seed_platforms_and_onboarding.sql
-- Veroxa — Draft seed: client_platforms and onboarding_items
-- DRAFT ONLY — do not apply to a live database without review
-- Depends on: 001_seed_clients.sql (client_id must exist)
-- =============================================================================

-- ── client_platforms ──────────────────────────────────────────────────────────
-- UUID range: 00000000-0000-0000-0001-000000000001 → 000000000004

INSERT INTO client_platforms (
  id,
  client_id,
  platform_name,
  handle,
  access_status,
  access_granted_at,
  verified_at,
  notes,
  created_at,
  updated_at
) VALUES
(
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000001',  -- Mamadali Kebab House
  'instagram',
  '@mamadali_kebab',
  'verified',
  '2026-01-16T10:00:00Z',
  '2026-01-17T09:00:00Z',
  'Instagram Business account connected and verified.',
  '2026-01-16T10:00:00Z',
  '2026-01-17T09:00:00Z'
),
(
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'facebook',
  'Mamadali Kebab House',
  'verified',
  '2026-01-16T10:30:00Z',
  '2026-01-17T09:15:00Z',
  'Facebook Page access granted via Business Manager.',
  '2026-01-16T10:30:00Z',
  '2026-01-17T09:15:00Z'
),
(
  '00000000-0000-0000-0001-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'google_business',
  NULL,   -- Google Business Profile does not use an @handle
  'granted',
  '2026-01-18T11:00:00Z',
  NULL,   -- not yet separately verified in demo state
  'Google Business Profile access granted. Verification step pending.',
  '2026-01-18T11:00:00Z',
  '2026-01-18T11:00:00Z'
),
(
  '00000000-0000-0000-0001-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'tiktok',
  '@mamadali.kebab',
  'pending',
  NULL,   -- access not yet granted in demo state
  NULL,
  'TikTok access requested. Awaiting client approval.',
  '2026-02-01T09:00:00Z',
  '2026-02-01T09:00:00Z'
);

-- ── onboarding_items ──────────────────────────────────────────────────────────
-- UUID range: 00000000-0000-0000-0002-000000000001 → 000000000006

INSERT INTO onboarding_items (
  id,
  client_id,
  label,
  status,
  completed_at,
  blocked_reason,
  created_at,
  updated_at
) VALUES
(
  '00000000-0000-0000-0002-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Signed client agreement received',
  'complete',
  '2026-01-15T10:00:00Z',
  NULL,
  '2026-01-15T09:00:00Z',
  '2026-01-15T10:00:00Z'
),
(
  '00000000-0000-0000-0002-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Social media access granted (Instagram + Facebook)',
  'complete',
  '2026-01-17T09:15:00Z',
  NULL,
  '2026-01-15T09:00:00Z',
  '2026-01-17T09:15:00Z'
),
(
  '00000000-0000-0000-0002-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Google Business Profile access granted',
  'complete',
  '2026-01-18T11:00:00Z',
  NULL,
  '2026-01-15T09:00:00Z',
  '2026-01-18T11:00:00Z'
),
(
  '00000000-0000-0000-0002-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Brand questionnaire completed',
  'complete',
  '2026-01-20T14:00:00Z',
  NULL,
  '2026-01-15T09:00:00Z',
  '2026-01-20T14:00:00Z'
),
(
  '00000000-0000-0000-0002-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'First media batch received from client',
  'complete',
  '2026-01-25T10:00:00Z',
  NULL,
  '2026-01-15T09:00:00Z',
  '2026-01-25T10:00:00Z'
),
(
  '00000000-0000-0000-0002-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'TikTok access granted',
  'pending',
  NULL,
  'Client has not yet approved TikTok Business access.',
  '2026-02-01T09:00:00Z',
  '2026-02-01T09:00:00Z'
);
