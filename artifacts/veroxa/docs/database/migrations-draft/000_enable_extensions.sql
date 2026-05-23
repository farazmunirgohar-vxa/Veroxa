-- =============================================================================
-- 000_enable_extensions.sql
-- Veroxa — Enable required PostgreSQL extensions
-- DRAFT ONLY — do not apply to a live database without review
-- Run this first, before any other migration file
-- =============================================================================

-- pgcrypto provides gen_random_uuid(), which is used as the default value for
-- all UUID primary key columns defined in 002_create_tables.sql.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
