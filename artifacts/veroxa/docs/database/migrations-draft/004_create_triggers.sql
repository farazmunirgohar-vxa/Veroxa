-- =============================================================================
-- 004_create_triggers.sql
-- Veroxa — Draft trigger and function definitions
-- DRAFT ONLY — do not apply to a live database without review
-- Run 001, 002, and 003 first
-- =============================================================================


-- =============================================================================
-- 1. set_updated_at()
-- Generic trigger function that updates the updated_at column on any mutable
-- table before each row update.
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach set_updated_at to every mutable table.
-- (activity_logs is excluded — it is append-only and has no updated_at column.)

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_client_platforms_updated_at
  BEFORE UPDATE ON client_platforms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_onboarding_items_updated_at
  BEFORE UPDATE ON onboarding_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_content_concepts_updated_at
  BEFORE UPDATE ON content_concepts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_draft_sets_updated_at
  BEFORE UPDATE ON draft_sets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_draft_variants_updated_at
  BEFORE UPDATE ON draft_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_post_slots_updated_at
  BEFORE UPDATE ON post_slots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_weekly_reports_updated_at
  BEFORE UPDATE ON weekly_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_monthly_reports_updated_at
  BEFORE UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- 2. enforce_post_lock()
-- Once posts.locked_at is set (on publish), prevent any change to
-- media_asset_id or draft_variant_id on that row.
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_post_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only enforce the lock if locked_at was already set before this update.
  IF OLD.locked_at IS NOT NULL THEN
    IF NEW.media_asset_id   IS DISTINCT FROM OLD.media_asset_id   OR
       NEW.draft_variant_id IS DISTINCT FROM OLD.draft_variant_id
    THEN
      RAISE EXCEPTION
        'Cannot modify media_asset_id or draft_variant_id on a locked post (id: %)',
        OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_posts_lock_guard
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION enforce_post_lock();


-- =============================================================================
-- 3. enforce_weekly_report_snapshot()
-- Once a weekly_report reaches status = 'published', block any further updates
-- to that row (published reports are permanent snapshots).
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_weekly_report_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION
      'Cannot modify a published weekly report (id: %)',
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_weekly_reports_snapshot_guard
  BEFORE UPDATE ON weekly_reports
  FOR EACH ROW EXECUTE FUNCTION enforce_weekly_report_snapshot();


-- =============================================================================
-- 4. enforce_monthly_report_snapshot()
-- Once a monthly_report reaches status = 'published', block any further updates.
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_monthly_report_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION
      'Cannot modify a published monthly report (id: %)',
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_monthly_reports_snapshot_guard
  BEFORE UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION enforce_monthly_report_snapshot();


-- =============================================================================
-- 5. enforce_activity_logs_append_only()
-- activity_logs must never be updated or deleted.
-- Applied as both an UPDATE and DELETE trigger.
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_activity_logs_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'activity_logs is append-only. UPDATE and DELETE are not permitted (id: %)',
    OLD.id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_activity_logs_no_update
  BEFORE UPDATE ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_activity_logs_append_only();

CREATE TRIGGER trg_activity_logs_no_delete
  BEFORE DELETE ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION enforce_activity_logs_append_only();
