-- =============================================================================
-- 002_audit_log_draft.sql
-- Veroxa — DRAFT ONLY: audit_logs table
-- =============================================================================
--
-- STATUS: DRAFT ONLY — DO NOT RUN YET.
--
-- PURPOSE:
--   Define the append-only audit log that every future write surface must
--   write to. The audit_logs table is the trust foundation of the first
--   write phase: without it, no Priority 1–3 write should ship.
--
-- DO NOT:
--   - Apply this file to any Supabase project.
--   - Insert audit rows from the frontend in production — a server-side
--     function (Postgres function, Edge Function, or backend API) inserts
--     them in the same transaction as the business write.
--   - Allow UPDATE or DELETE on audit_logs from any role. Append-only.
--
-- REQUIRES (when applied later):
--   - Supabase Auth enabled.
--   - 001_auth_user_profiles.sql applied (user_profiles + veroxa_user_role).
--
-- READ FIRST:
--   - docs/FIRST_WRITE_SURFACE_PLAN.md
--   - docs/database/write-draft/001_first_write_surface_draft.sql
-- =============================================================================


-- =============================================================================
-- 1. audit_logs
--
-- One row per state-changing action across the system. Designed to be cheap
-- to write and easy to query by (actor, client, resource, time).
--
-- Column rationale:
--   - actor_user_id: who did it. Nullable because some future server-side
--     jobs (cron, system actions) may have no user — those should record a
--     dedicated system actor at the application level rather than NULL,
--     but the column allows NULL to avoid breaking inserts in edge cases.
--   - actor_role: snapshot of the role at the time of the action. We do
--     NOT join user_profiles to render history — roles can change.
--   - client_id: tenant context, nullable because some actions are not
--     client-scoped (e.g. owner-level config).
--   - action: short verb-style identifier
--     (e.g. 'notification.mark_read', 'draft_variant.approve').
--   - resource_type / resource_id: what was acted on
--     (e.g. 'draft_variant' / <uuid>). resource_id nullable for bulk or
--     non-row actions.
--   - metadata: structured details (before/after, reason, etc). Frontend
--     and server should agree on a small per-action vocabulary; do NOT
--     stuff PII or large blobs in here.
-- =============================================================================

CREATE TABLE audit_logs (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   uuid              REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  actor_role      veroxa_user_role,
  client_id       uuid              REFERENCES clients(id)            ON DELETE SET NULL,
  action          text              NOT NULL,
  resource_type   text              NOT NULL,
  resource_id     uuid,
  metadata        jsonb             NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz       NOT NULL DEFAULT now()
);


-- =============================================================================
-- 2. Indexes
--
-- Optimised for the three most common audit queries:
--   - "what did this user do recently?"     → (actor_user_id, created_at DESC)
--   - "show all activity for this client"   → (client_id, created_at DESC)
--   - "show history for this specific row"  → (resource_type, resource_id, created_at DESC)
-- =============================================================================

CREATE INDEX audit_logs_actor_user_id_created_at_idx
  ON audit_logs (actor_user_id, created_at DESC);

CREATE INDEX audit_logs_client_id_created_at_idx
  ON audit_logs (client_id, created_at DESC);

CREATE INDEX audit_logs_resource_idx
  ON audit_logs (resource_type, resource_id, created_at DESC);

CREATE INDEX audit_logs_action_idx
  ON audit_logs (action);


-- =============================================================================
-- 3. Append-only guarantee (DRAFT)
--
-- The simplest enforcement: RLS denies UPDATE and DELETE for all roles.
-- A defence-in-depth option is a trigger that raises on UPDATE/DELETE so
-- even service-role connections can't quietly mutate history.
-- =============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- DRAFT — do not run:
--
-- -- Belt-and-braces: refuse UPDATE and DELETE regardless of caller.
-- CREATE OR REPLACE FUNCTION audit_logs_no_mutation()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RAISE EXCEPTION 'audit_logs is append-only';
-- END;
-- $$;
--
-- CREATE TRIGGER audit_logs_no_update
--   BEFORE UPDATE ON audit_logs
--   FOR EACH ROW EXECUTE FUNCTION audit_logs_no_mutation();
--
-- CREATE TRIGGER audit_logs_no_delete
--   BEFORE DELETE ON audit_logs
--   FOR EACH ROW EXECUTE FUNCTION audit_logs_no_mutation();


-- =============================================================================
-- 4. Read policies (DRAFT)
--
-- - Owner / operator can read all audit rows.
-- - Client can read only rows where client_id matches their tenant AND the
--   action is in a curated allow-list of client-safe actions. Internal team
--   / operator actions must NOT be exposed to the client.
-- - Team users do NOT get audit log read access in V1.
-- =============================================================================

-- DRAFT — do not run:
--
-- CREATE POLICY "operator_owner_read_all_audit"
--   ON audit_logs FOR SELECT TO authenticated
--   USING (current_user_role() IN ('operator', 'owner'));
--
-- CREATE POLICY "client_read_own_safe_audit"
--   ON audit_logs FOR SELECT TO authenticated
--   USING (
--     current_user_role() = 'client'
--     AND client_id = current_user_client_id()
--     AND action IN (
--       'notification.mark_read',
--       'onboarding_item.update_answer',
--       'onboarding_item.mark_complete',
--       'content_note.create'
--       -- Curate this list as new client-safe actions ship.
--     )
--   );


-- =============================================================================
-- 5. Write policies — DELIBERATELY NONE
--
-- audit_logs has NO INSERT policy for any role in this draft. Inserts happen
-- only via a server-side function (Postgres SECURITY DEFINER function, Edge
-- Function, or backend API) that performs the business write and the audit
-- write in the same transaction. The frontend MUST NOT insert here directly.
--
-- If, later, a narrowly-scoped client-side insert path is justified, it
-- must come with: (a) a strict allow-list of actions, (b) tenant scoping,
-- (c) rate limiting, (d) explicit design review.
-- =============================================================================
