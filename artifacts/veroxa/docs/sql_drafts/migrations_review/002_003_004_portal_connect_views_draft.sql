-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- Review and audit before converting into a real migration.
-- AUTH_MODE remains "placeholder".
-- =============================================================================
--
-- Portal-Connect Pass — Client-Safe Views for M002 / M003 / M004 (DRAFT)
--
-- Purpose:
--   Materialize the eight client_portal_* views that were left as
--   commented stubs in M002 (clients/platforms/onboarding/requests),
--   M003 (media/notifications/health) and M004 (calendar). Until these
--   views exist, base-table client SELECT policies expose sensitive
--   columns (monthly_fee_cents, internal_note, rejection_reason,
--   risk_status, approved_by_user_id, etc.) to any caller using the raw
--   Supabase JS client. The views are the column-hiding layer.
--
-- Applies AFTER (all of, in order):
--   * 001_identity_foundation_draft.sql
--   * 002_client_foundation_draft.sql
--   * 003_media_foundation_draft.sql
--   * 004_posting_foundation_draft.sql
--
-- Does NOT apply on top of any other state.
--
-- Required pre-existing objects:
--   * public.clients, public.client_platforms, public.onboarding_items,
--     public.client_requests                                          (M002)
--   * public.media_assets, public.notifications,
--     public.client_health_snapshots                                  (M003)
--   * public.posts                                                    (M004)
--   * private.current_user_client_id()                                (M002)
--
-- All views use `with (security_invoker = true)` so the caller's RLS on
-- the underlying base table is what gates row visibility. The view's
-- job is column-hiding (narrow projection) + status / target_role
-- filters (defense-in-depth). The base-table client RLS policies remain
-- the authoritative row gate.
--
-- Naming contract — the eight views in this file PLUS the two views
-- created in M005 are the ONLY surface the client portal is permitted
-- to query once Supabase is connected. See
-- docs/PORTAL_QUERY_SAFETY_PLAN.md for the allowed-vs-forbidden list.
--
-- Pricing reference (must remain unchanged from the locked pricing table):
--   GPS                     -> service_package='google_presence_starter'  -> 49700
--   COP 12-month            -> service_package='complete_online_presence' -> 99700
--   COP 6-month             -> service_package='complete_online_presence' -> 109700
--   COP 3-month             -> service_package='complete_online_presence' -> 119700
--   COP no-contract         -> service_package='complete_online_presence' -> 149700
--
-- This draft does NOT change pricing, does NOT change AUTH_MODE, does
-- NOT touch supabase/migrations, does NOT activate auth, does NOT
-- expose monthly_fee_cents, risk scoring, internal notes, AI/quality
-- reasoning, or staff-only workflow state to clients.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- VIEW 1 — client_portal_clients_view
-- -----------------------------------------------------------------------------
--
-- Client-safe account view. The base-table policy already scopes rows to
-- private.current_user_client_id(); this view exists to hide sensitive
-- columns (monthly_fee_cents, assigned_operator_id, assigned_team_label,
-- contract_months, content_health_status, risk_status).
--
-- Note: plan_type and service_package ARE exposed — clients know what
-- they signed up for. monthly_fee_cents is NEVER exposed; the client
-- already has that figure from their signed agreement and the portal
-- never needs to render it.

create view public.client_portal_clients_view
  with (security_invoker = true) as
select
  c.id                        as client_id,
  c.business_name,
  c.primary_contact_name,
  c.primary_contact_email,
  c.primary_contact_phone,
  c.cuisine_type,
  c.website_url,
  c.address,
  c.hours_text,
  c.plan_type,
  c.service_package,
  c.posting_frequency_weekly,
  c.timezone,
  c.account_status            as safe_account_status,
  c.onboarding_complete,
  c.created_at
from public.clients c;

comment on view public.client_portal_clients_view is
  'Client-safe account view. security_invoker=true so base-table RLS applies. Hides: monthly_fee_cents, contract_months, start_date, assigned_operator_id, assigned_team_label, content_health_status, risk_status, legal_name, secondary_contact_*. Exposes only fields the client already knows about themselves.';

grant select on public.client_portal_clients_view to authenticated;


-- -----------------------------------------------------------------------------
-- VIEW 2 — client_portal_platforms_view
-- -----------------------------------------------------------------------------
--
-- Client-safe platform/account connection visibility. Hides `notes`
-- (internal staff troubleshooting commentary).

create view public.client_portal_platforms_view
  with (security_invoker = true) as
select
  cp.id,
  cp.client_id,
  cp.platform_name,
  cp.access_status,
  cp.username_or_handle,
  cp.last_verified_at,
  cp.updated_at
from public.client_platforms cp;

comment on view public.client_portal_platforms_view is
  'Client-safe platform connection view. security_invoker=true. Hides: notes (internal staff commentary).';

grant select on public.client_portal_platforms_view to authenticated;


-- -----------------------------------------------------------------------------
-- VIEW 3 — client_portal_onboarding_view
-- -----------------------------------------------------------------------------
--
-- Onboarding checklist visible to the client. owner_role is exposed so
-- the client can see who is responsible for each item (themselves, the
-- team, the operator, or Veroxa).

create view public.client_portal_onboarding_view
  with (security_invoker = true) as
select
  oi.id,
  oi.client_id,
  oi.item_key,
  oi.item_label,
  oi.description,
  oi.status,
  oi.owner_role,
  oi.priority,
  oi.completed_by_role,
  oi.completed_at,
  oi.updated_at
from public.onboarding_items oi;

comment on view public.client_portal_onboarding_view is
  'Client-safe onboarding checklist. security_invoker=true. Currently exposes all columns since onboarding_items has no staff-only fields by design. If a future internal_blocked_reason column is added, exclude it here.';

grant select on public.client_portal_onboarding_view to authenticated;


-- -----------------------------------------------------------------------------
-- VIEW 4 — client_portal_requests_view
-- -----------------------------------------------------------------------------
--
-- Client-safe request tracking. Hides assigned_to_role (internal
-- routing) and requested_by_user_id (avoid leaking staff user ids to
-- the client when a staff member opens a request on the client's
-- behalf).

create view public.client_portal_requests_view
  with (security_invoker = true) as
select
  cr.id,
  cr.client_id,
  cr.request_type,
  cr.title,
  cr.description,
  cr.status,
  cr.priority,
  cr.due_date,
  cr.created_at,
  cr.updated_at
from public.client_requests cr;

comment on view public.client_portal_requests_view is
  'Client-safe request view. security_invoker=true. Hides: assigned_to_role (internal routing), requested_by_user_id (avoid leaking staff user ids when staff opens a request for the client).';

grant select on public.client_portal_requests_view to authenticated;


-- -----------------------------------------------------------------------------
-- VIEW 5 — client_portal_media_view
-- -----------------------------------------------------------------------------
--
-- Client-safe media library. Translates the 11-value review_status into
-- a 6-value client-safe label and hides AI / quality / internal-note
-- columns. uploaded_by_user_id is hidden so a staff upload does not leak
-- a staff user id to the client.
--
-- Label mapping (per prompt):
--   uploaded                                      -> Received
--   ai_reviewed, team_review_pending              -> Under Review
--   usable, shortlisted, drafted, approved        -> Ready for Content
--   scheduled                                     -> Scheduled
--   used                                          -> Used
--   reusable_archive                              -> Saved for Future Use
--   rejected                                      -> Needs Replacement

create view public.client_portal_media_view
  with (security_invoker = true) as
select
  m.id,
  m.client_id,
  m.file_type,
  m.thumbnail_url,
  m.title,
  m.caption_hint,
  m.client_safe_note,
  m.uploaded_at,
  case m.review_status
    when 'uploaded'             then 'Received'
    when 'ai_reviewed'          then 'Under Review'
    when 'team_review_pending'  then 'Under Review'
    when 'usable'               then 'Ready for Content'
    when 'shortlisted'          then 'Ready for Content'
    when 'drafted'              then 'Ready for Content'
    when 'approved'             then 'Ready for Content'
    when 'scheduled'            then 'Scheduled'
    when 'used'                 then 'Used'
    when 'reusable_archive'     then 'Saved for Future Use'
    when 'rejected'             then 'Needs Replacement'
  end                           as review_status_label
from public.media_assets m;

comment on view public.client_portal_media_view is
  'Client-safe media library view. security_invoker=true. Hides: internal_note, rejection_reason (raw), quality_score, quality_ai_flag, source_type, reuse_eligible, linked_post_id, uploaded_by_user_id, file_url (raw URL — clients receive thumbnail_url only). Translates 11-value review_status into 6-value client-safe label.';

grant select on public.client_portal_media_view to authenticated;


-- -----------------------------------------------------------------------------
-- VIEW 6 — client_portal_notifications_view
-- -----------------------------------------------------------------------------
--
-- Client-safe notifications. Filters to target_role='client' so a
-- client never sees a team/operator/owner notification even if the
-- base-table client_id column happens to point at their tenant.
--
-- Hides: trigger_source (internal routing reasoning), target_user_id
-- (which specific staff user the system tried to page).

create view public.client_portal_notifications_view
  with (security_invoker = true) as
select
  n.id,
  n.client_id,
  n.title,
  n.message_body,
  n.notification_type,
  n.priority,
  n.status,
  n.created_at,
  n.updated_at
from public.notifications n
where n.target_role = 'client';

comment on view public.client_portal_notifications_view is
  'Client-safe notifications view. security_invoker=true. Filters target_role=''client''. Hides: trigger_source (internal routing reasoning), target_user_id (specific staff user the system paged). Status writes flow through the M003 notifications BEFORE UPDATE guard (see 003_notifications_status_guard_draft.sql).';

grant select on public.client_portal_notifications_view to authenticated;


-- -----------------------------------------------------------------------------
-- VIEW 7 — client_portal_health_view
-- -----------------------------------------------------------------------------
--
-- Client-safe health snapshot. Maps the 3-value internal `level` to a
-- friendly client-safe label and hides raw priority / alert counts to
-- avoid creating client panic.
--
-- Label mapping:
--   healthy    -> On track
--   attention  -> Needs attention
--   critical   -> Action required
--
-- Hides: priority_level, unresolved_alerts_count, open_requests_count,
-- created_by_role.

create view public.client_portal_health_view
  with (security_invoker = true) as
select
  chs.id,
  chs.client_id,
  case chs.level
    when 'healthy'   then 'On track'
    when 'attention' then 'Needs attention'
    when 'critical'  then 'Action required'
  end                              as simplified_health_label,
  chs.content_runway_days,
  chs.approved_media_count,
  chs.scheduled_posts_count,
  chs.summary,
  chs.created_at
from public.client_health_snapshots chs;

comment on view public.client_portal_health_view is
  'Client-safe health view. security_invoker=true. Maps 3-value level to friendly client-safe label. Hides: priority_level, unresolved_alerts_count, open_requests_count, created_by_role. summary is exposed under the contract that the writer (team/operator/system) keeps it client-safe.';

grant select on public.client_portal_health_view to authenticated;


-- -----------------------------------------------------------------------------
-- VIEW 8 — client_portal_calendar_view
-- -----------------------------------------------------------------------------
--
-- Client-safe calendar. Joins to media_assets for thumbnail_url. The
-- base-table client SELECT policy already restricts to
-- post_status in ('scheduled','published'), so this view does not add
-- a redundant WHERE — it would only mask future policy expansions.
--
-- status_label maps the 2-state client-visible window into 3 plain
-- labels:
--   scheduled, scheduled_for IS NOT NULL, published_at IS NULL  -> Scheduled
--   published                                                   -> Published
--   anything else (defensive)                                   -> Scheduled
--
-- Hides: concept_id, draft_variant_id, approved_by_user_id,
-- created_by_user_id, publish_failure_reason, is_reuse_based, raw
-- post_status (only the client-safe label is exposed).

create view public.client_portal_calendar_view
  with (security_invoker = true) as
select
  p.id                          as post_id,
  p.client_id,
  p.platform_name,
  p.content_type,
  p.title                       as client_safe_title,
  p.scheduled_for,
  p.published_at,
  case p.post_status
    when 'scheduled'  then 'Scheduled'
    when 'published'  then 'Published'
    else                   'Scheduled'
  end                           as status_label,
  m.thumbnail_url
from public.posts p
left join public.media_assets m
  on m.id = p.media_asset_id
where p.post_status in ('scheduled','published');

comment on view public.client_portal_calendar_view is
  'Client-safe calendar view. security_invoker=true. Base-table policy already restricts rows to post_status in (scheduled, published). Hides: concept_id, draft_variant_id, approved_by_user_id, created_by_user_id, publish_failure_reason, is_reuse_based, raw post_status, caption_text. Joins media_assets only for thumbnail_url.';

grant select on public.client_portal_calendar_view to authenticated;


commit;

-- =============================================================================
-- ROLLBACK (dev reference only — forward-only in production)
-- =============================================================================
--
-- Drop in reverse creation order. All eight views are independent of
-- each other; ordering matters only for the calendar view's join (which
-- depends on media_assets) but DROP VIEW does not cascade-depend on
-- joined tables.
--
-- begin;
--   drop view if exists public.client_portal_calendar_view;
--   drop view if exists public.client_portal_health_view;
--   drop view if exists public.client_portal_notifications_view;
--   drop view if exists public.client_portal_media_view;
--   drop view if exists public.client_portal_requests_view;
--   drop view if exists public.client_portal_onboarding_view;
--   drop view if exists public.client_portal_platforms_view;
--   drop view if exists public.client_portal_clients_view;
-- commit;

-- =============================================================================
-- END OF PORTAL-CONNECT VIEWS DRAFT
--
-- DO NOT RUN — REVIEW BEFORE PROMOTION
-- AUTH_MODE remains "placeholder".
-- =============================================================================
