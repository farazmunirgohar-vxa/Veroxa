-- =============================================================================
-- 001_seed_clients.sql
-- Veroxa — Draft seed: clients table
-- DRAFT ONLY — do not apply to a live database without review
-- Source: src/lib/demo-data/clients.ts (Mamadali Kebab House)
-- =============================================================================

-- Fixed UUID placeholder for Mamadali Kebab House.
-- Replace with gen_random_uuid() output in a real migration if desired,
-- but fixed UUIDs make cross-file FK references predictable during seeding.

INSERT INTO clients (
  id,
  business_name,
  legal_name,
  primary_contact_name,
  primary_contact_phone,
  primary_contact_email,
  plan_type,
  service_package,
  posting_frequency_weekly,
  preferred_post_days,
  preferred_post_times,
  timezone,
  reuse_permission,
  content_health_status,
  risk_status,
  account_status,
  onboarding_complete,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',  -- Mamadali Kebab House
  'Mamadali Kebab House',
  NULL,                          -- legalName: null in TypeScript source
  'Demo Owner',
  '+1-555-0100',
  'demo@mamadali.example.com',
  'six_month',
  'presence',
  4,
  NULL,                          -- preferredPostDays: null in TypeScript source
  NULL,                          -- preferredPostTimes: null in TypeScript source
  'America/Chicago',
  TRUE,         -- reuse_permission: true in TypeScript source
  'caution',    -- content_health_status
  'risk',       -- risk_status
  'active',     -- account_status
  TRUE,         -- onboarding_complete
  '2026-01-15T09:00:00Z',
  '2026-05-23T08:00:00Z'
);
