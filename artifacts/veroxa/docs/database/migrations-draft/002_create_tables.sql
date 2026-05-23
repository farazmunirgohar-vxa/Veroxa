-- =============================================================================
-- 002_create_tables.sql
-- Veroxa — Draft PostgreSQL table definitions
-- DRAFT ONLY — do not apply to a live database without review
-- Run 001_create_enums.sql first
-- =============================================================================

-- ── clients ───────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name           TEXT        NOT NULL,
  legal_name              TEXT,
  primary_contact_name    TEXT        NOT NULL,
  primary_contact_phone   TEXT        NOT NULL,
  primary_contact_email   TEXT        NOT NULL,
  plan_type               plan_type   NOT NULL,
  service_package         service_package NOT NULL,
  posting_frequency_weekly SMALLINT   NOT NULL DEFAULT 4
                          CHECK (posting_frequency_weekly >= 0),
  preferred_post_days     JSONB,
  preferred_post_times    JSONB,
  timezone                TEXT        NOT NULL DEFAULT 'UTC',
  reuse_permission        BOOLEAN     NOT NULL DEFAULT FALSE,
  content_health_status   content_health_status NOT NULL DEFAULT 'healthy',
  risk_status             risk_status NOT NULL DEFAULT 'good',
  account_status          client_status NOT NULL DEFAULT 'lead',
  onboarding_complete     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── client_platforms ──────────────────────────────────────────────────────────
CREATE TABLE client_platforms (
  id                UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID                   NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  platform_name     platform_name          NOT NULL,
  handle            TEXT,
  access_status     platform_access_status NOT NULL DEFAULT 'pending',
  access_granted_at TIMESTAMPTZ,
  verified_at       TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ            NOT NULL DEFAULT now()
);

-- ── onboarding_items ──────────────────────────────────────────────────────────
CREATE TABLE onboarding_items (
  id               UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID                    NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  label            TEXT                    NOT NULL,
  status           onboarding_item_status  NOT NULL DEFAULT 'not_started',
  completed_at     TIMESTAMPTZ,
  blocked_reason   TEXT,
  created_at       TIMESTAMPTZ             NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ             NOT NULL DEFAULT now()
);

-- ── media_assets ──────────────────────────────────────────────────────────────
-- used_in_post_id is a forward reference to posts; add FK after posts is created.
CREATE TABLE media_assets (
  id                    UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID                  NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  file_type             media_file_type       NOT NULL,
  source_type           media_source_type     NOT NULL,
  storage_url           TEXT                  NOT NULL,
  thumbnail_url         TEXT,
  ai_quality_flag       media_quality_ai_flag,
  ai_quality_notes      TEXT,
  review_status         media_review_status   NOT NULL DEFAULT 'uploaded',
  reviewed_by_user_id   UUID,                 -- FK → auth.users added after auth setup
  reviewed_at           TIMESTAMPTZ,
  used_in_post_id       UUID,                 -- FK → posts.id added below (forward ref)
  created_at            TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- ── content_concepts ──────────────────────────────────────────────────────────
CREATE TABLE content_concepts (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID            NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  media_asset_id      UUID            REFERENCES media_assets(id) ON DELETE SET NULL,
  goal                content_goal    NOT NULL,
  concept_title       TEXT            NOT NULL,
  concept_body        TEXT            NOT NULL,
  status              concept_status  NOT NULL DEFAULT 'generated',
  generated_by_ai     BOOLEAN         NOT NULL DEFAULT FALSE,
  reviewed_by_user_id UUID,           -- FK → auth.users added after auth setup
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- ── draft_sets ────────────────────────────────────────────────────────────────
CREATE TABLE draft_sets (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID             NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  concept_id    UUID             NOT NULL REFERENCES content_concepts(id) ON DELETE RESTRICT,
  status        draft_set_status NOT NULL DEFAULT 'generated',
  generated_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- ── draft_variants ────────────────────────────────────────────────────────────
-- used_in_post_id is a forward reference; FK added below.
CREATE TABLE draft_variants (
  id                    UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID                 NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  draft_set_id          UUID                 NOT NULL REFERENCES draft_sets(id) ON DELETE RESTRICT,
  variant_type          draft_variant_type   NOT NULL,
  caption_text          TEXT                 NOT NULL,
  hashtags              TEXT[]               NOT NULL DEFAULT '{}',
  status                draft_variant_status NOT NULL DEFAULT 'generated',
  used_in_post_id       UUID,                -- FK → posts.id added below (forward ref)
  approved_by_user_id   UUID,                -- FK → auth.users added after auth setup
  approved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ          NOT NULL DEFAULT now()
);

-- ── post_slots ────────────────────────────────────────────────────────────────
-- post_id is a forward reference; FK added below.
CREATE TABLE post_slots (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID             NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  platform_name platform_name    NOT NULL,
  slot_date     DATE             NOT NULL,
  slot_time     TIME,
  status        post_slot_status NOT NULL DEFAULT 'open',
  post_id       UUID,            -- FK → posts.id added below (forward ref)
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- ── posts ─────────────────────────────────────────────────────────────────────
CREATE TABLE posts (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID          NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  platform_name     platform_name NOT NULL,
  media_asset_id    UUID          REFERENCES media_assets(id) ON DELETE RESTRICT,
  draft_variant_id  UUID          REFERENCES draft_variants(id) ON DELETE RESTRICT,
  post_slot_id      UUID          REFERENCES post_slots(id) ON DELETE SET NULL,
  status            post_status   NOT NULL DEFAULT 'planning',
  scheduled_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  failed_at         TIMESTAMPTZ,
  failure_reason    TEXT,
  locked_at         TIMESTAMPTZ,  -- set on publish; media/draft refs become read-only
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── Forward-reference foreign keys ────────────────────────────────────────────
ALTER TABLE media_assets    ADD CONSTRAINT fk_media_used_in_post
  FOREIGN KEY (used_in_post_id)  REFERENCES posts(id) ON DELETE SET NULL;

ALTER TABLE draft_variants  ADD CONSTRAINT fk_variant_used_in_post
  FOREIGN KEY (used_in_post_id)  REFERENCES posts(id) ON DELETE SET NULL;

ALTER TABLE post_slots      ADD CONSTRAINT fk_slot_post
  FOREIGN KEY (post_id)          REFERENCES posts(id) ON DELETE SET NULL;

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id               UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID                     NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  target_role      notification_target_role NOT NULL,
  target_user_id   UUID,                    -- FK → auth.users added after auth setup
  subject          TEXT                     NOT NULL,
  body             TEXT                     NOT NULL,
  status           notification_status      NOT NULL DEFAULT 'created',
  sent_at          TIMESTAMPTZ,
  seen_at          TIMESTAMPTZ,
  escalated_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ              NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ              NOT NULL DEFAULT now()
);

-- ── weekly_reports ────────────────────────────────────────────────────────────
CREATE TABLE weekly_reports (
  id               UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID                 NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  week_start_date  DATE                 NOT NULL,
  week_end_date    DATE                 NOT NULL,
  status           weekly_report_status NOT NULL DEFAULT 'drafted',
  posts_published  SMALLINT             NOT NULL DEFAULT 0,
  posts_planned    SMALLINT             NOT NULL DEFAULT 0,
  completion_rate  NUMERIC(5,2)         NOT NULL DEFAULT 0,
  summary_text     TEXT,
  generated_at     TIMESTAMPTZ          NOT NULL DEFAULT now(),
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ          NOT NULL DEFAULT now()
);

-- ── monthly_reports ───────────────────────────────────────────────────────────
CREATE TABLE monthly_reports (
  id                    UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID                  NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  month                 SMALLINT              NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                  SMALLINT              NOT NULL,
  status                monthly_report_status NOT NULL DEFAULT 'drafting',
  posts_published       SMALLINT              NOT NULL DEFAULT 0,
  posts_planned         SMALLINT              NOT NULL DEFAULT 0,
  completion_rate       NUMERIC(5,2)          NOT NULL DEFAULT 0,
  summary_text          TEXT,
  operator_reviewed_at  TIMESTAMPTZ,
  approved_at           TIMESTAMPTZ,
  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ           NOT NULL DEFAULT now(),
  UNIQUE (client_id, month, year)
);

-- ── activity_logs ─────────────────────────────────────────────────────────────
-- No updated_at — this table is append-only.
CREATE TABLE activity_logs (
  id                   UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID                  NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  entity_type          activity_entity_type  NOT NULL,
  entity_id            UUID                  NOT NULL,
  action               TEXT                  NOT NULL,
  performed_by_role    performed_by_role     NOT NULL,
  performed_by_user_id UUID,                 -- FK → auth.users added after auth setup; null for system
  metadata             JSONB,
  created_at           TIMESTAMPTZ           NOT NULL DEFAULT now()
);
