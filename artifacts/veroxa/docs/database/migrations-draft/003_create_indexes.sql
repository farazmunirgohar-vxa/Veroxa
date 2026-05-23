-- =============================================================================
-- 003_create_indexes.sql
-- Veroxa — Draft index definitions
-- DRAFT ONLY — do not apply to a live database without review
-- Run 001 and 002 first
-- =============================================================================

-- ── client_id indexes (universal scope column) ────────────────────────────────
CREATE INDEX idx_client_platforms_client_id    ON client_platforms    (client_id);
CREATE INDEX idx_onboarding_items_client_id    ON onboarding_items    (client_id);
CREATE INDEX idx_media_assets_client_id        ON media_assets        (client_id);
CREATE INDEX idx_content_concepts_client_id    ON content_concepts    (client_id);
CREATE INDEX idx_draft_sets_client_id          ON draft_sets          (client_id);
CREATE INDEX idx_draft_variants_client_id      ON draft_variants      (client_id);
CREATE INDEX idx_posts_client_id               ON posts               (client_id);
CREATE INDEX idx_post_slots_client_id          ON post_slots          (client_id);
CREATE INDEX idx_notifications_client_id       ON notifications       (client_id);
CREATE INDEX idx_weekly_reports_client_id      ON weekly_reports      (client_id);
CREATE INDEX idx_monthly_reports_client_id     ON monthly_reports     (client_id);
CREATE INDEX idx_activity_logs_client_id       ON activity_logs       (client_id);

-- ── posts ─────────────────────────────────────────────────────────────────────
-- Operator/system queries filter by status frequently (e.g. 'failed', 'scheduled').
CREATE INDEX idx_posts_status                  ON posts               (status);
-- Calendar and scheduling queries filter and sort by scheduled_at.
CREATE INDEX idx_posts_scheduled_at            ON posts               (scheduled_at)
  WHERE scheduled_at IS NOT NULL;

-- ── media_assets ──────────────────────────────────────────────────────────────
-- Team review queue filters by review_status frequently.
CREATE INDEX idx_media_assets_review_status    ON media_assets        (review_status);
-- Reuse lock checks query used_in_post_id frequently.
CREATE INDEX idx_media_assets_used_in_post_id  ON media_assets        (used_in_post_id)
  WHERE used_in_post_id IS NOT NULL;

-- ── draft_variants ────────────────────────────────────────────────────────────
-- Team approval queue and reuse lock checks filter by status.
CREATE INDEX idx_draft_variants_status         ON draft_variants      (status);
-- Variant reuse lock checks query used_in_post_id.
CREATE INDEX idx_draft_variants_used_in_post   ON draft_variants      (used_in_post_id)
  WHERE used_in_post_id IS NOT NULL;

-- ── notifications ─────────────────────────────────────────────────────────────
-- Notification feed queries filter by both target_role and status together.
CREATE INDEX idx_notifications_role_status     ON notifications       (target_role, status);

-- ── weekly_reports ────────────────────────────────────────────────────────────
-- Client report history queries filter by client_id and order by week_start_date.
CREATE INDEX idx_weekly_reports_client_week    ON weekly_reports      (client_id, week_start_date DESC);

-- ── monthly_reports ───────────────────────────────────────────────────────────
-- Operator approval queue and client history filter by client_id, year, month.
CREATE INDEX idx_monthly_reports_client_period ON monthly_reports     (client_id, year DESC, month DESC);

-- ── activity_logs ─────────────────────────────────────────────────────────────
-- Activity feed queries filter by client_id and order by created_at descending.
CREATE INDEX idx_activity_logs_client_created  ON activity_logs       (client_id, created_at DESC);
