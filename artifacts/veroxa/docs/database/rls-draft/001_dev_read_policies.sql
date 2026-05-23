-- =============================================================================
-- 001_dev_read_policies.sql
-- Veroxa — DEV ONLY: temporary anon read policies for Mamadali demo data
-- =============================================================================
--
-- PURPOSE:
--   Allow anon (unauthenticated) SELECT access to Mamadali demo rows while
--   there is no auth implementation yet. This lets the frontend read-only
--   Supabase data layer be tested against real dev database data.
--
-- WARNINGS:
--   - DEV ONLY. Never apply to a production Supabase project.
--   - These policies allow any unauthenticated request to read demo rows.
--   - Must be replaced with authenticated, role-based RLS policies before
--     any real client data is introduced or before moving to production.
--   - Only SELECT is allowed. No INSERT, UPDATE, DELETE policies are created.
--
-- APPLY:
--   Run manually in the Supabase SQL Editor on the dev project only.
--   Review before applying. Do not script or automate this against production.
-- =============================================================================


-- =============================================================================
-- clients
-- Allow anon SELECT for the Mamadali demo client only.
-- Uses id rather than client_id because clients is the root owner table.
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_client"
  ON clients
  FOR SELECT
  TO anon
  USING (id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- client_platforms
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_client_platforms"
  ON client_platforms
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- onboarding_items
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_onboarding_items"
  ON onboarding_items
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- media_assets
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_media_assets"
  ON media_assets
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- posts
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_posts"
  ON posts
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- post_slots
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_post_slots"
  ON post_slots
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- weekly_reports
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_weekly_reports"
  ON weekly_reports
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- monthly_reports
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_monthly_reports"
  ON monthly_reports
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- content_concepts
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_content_concepts"
  ON content_concepts
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- draft_sets
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_draft_sets"
  ON draft_sets
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');


-- =============================================================================
-- draft_variants
-- =============================================================================

CREATE POLICY "dev_anon_read_mamadali_draft_variants"
  ON draft_variants
  FOR SELECT
  TO anon
  USING (client_id = '00000000-0000-0000-0000-000000000001');
