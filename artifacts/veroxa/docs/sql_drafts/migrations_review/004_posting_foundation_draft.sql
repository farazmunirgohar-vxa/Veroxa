-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- Review and audit before converting into a real migration.
-- AUTH_MODE remains "placeholder".
-- No publishing integrations are active.
-- =============================================================================
--
-- Migration 004 — Posting Foundation (DRAFT)
--
-- Depends on Migration 001 (identity), Migration 002 (client
-- foundation), AND Migration 003 (media foundation). Required
-- pre-existing objects:
--   * public.user_profiles, public.team_members             (M001)
--   * public.set_updated_at()                               (M001)
--   * private.is_owner/is_operator/...                      (M001)
--   * public.clients                                        (M002)
--   * private.can_view_client(uuid),
--     private.can_manage_client_operations(uuid)            (M002)
--   * public.media_assets (with bare linked_post_id column) (M003)
--
-- Scope (this file):
--   * public.posts
--   * public.post_slots
--   * Adds FK: media_assets.linked_post_id -> posts(id) on delete set null
--     (deferred from M003 because posts did not exist yet)
--   * updated_at triggers on both new tables
--   * RLS + per-role policies
--   * Indexes
--   * Commented client_portal_calendar_view stub
--
-- Intentionally NOT in scope (deferred):
--   * reports                                               -> M005
--   * content_concepts, draft_sets, draft_variants,
--     ai_agents                                             -> M006
--   * posts.concept_id / posts.draft_variant_id FK
--     constraints (columns exist as bare uuid placeholders) -> M006
--   * storage buckets                                       -> M007
--   * real publishing integrations / platform APIs          -> M008+
--   * background workers / cron                             -> separate orchestration track
--   * payment processing                                    -> separate track
--   * real CREATE VIEW for client_portal_calendar_view      -> portal-connect pass
--
-- Source-of-truth references:
--   * docs/MIGRATION_004_POSTING_FOUNDATION_PLAN.md (this file's blueprint)
--   * docs/MIGRATION_004_TEST_PLAN.md
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. posts
-- -----------------------------------------------------------------------------
--
-- Internal lifecycle column is post_status (10 states). Client-safe
-- views collapse the internal pipeline states into a smaller set of
-- client-friendly labels.
--
-- concept_id and draft_variant_id are bare uuid placeholders; their
-- FK constraints are added in Migration 006 when content_concepts /
-- draft_variants exist.
--
-- publish_failure_reason is internal-only. Client-safe views must
-- either omit it entirely or rewrite it into safe wording (e.g.
-- "Needs another shot").

create table public.posts (
  id                          uuid        primary key default gen_random_uuid(),
  client_id                   uuid        not null
    references public.clients(id) on delete cascade,
  media_asset_id              uuid        null
    references public.media_assets(id) on delete set null,
  concept_id                  uuid        null,
  -- ^ Bare uuid; FK to content_concepts(id) added in Migration 006.
  draft_variant_id            uuid        null,
  -- ^ Bare uuid; FK to draft_variants(id) added in Migration 006.
  platform_name               text        not null
    check (platform_name in ('instagram','facebook','google_business','tiktok','other')),
  content_type                text        not null
    check (content_type in ('photo','reel','carousel','story')),
  title                       text        null,
  caption_text                text        null,
  post_status                 text        not null default 'planning'
    check (post_status in (
      'planning',
      'awaiting_content',
      'ready_for_review',
      'approved',
      'ready_to_schedule',
      'scheduled',
      'published',
      'failed',
      'reschedule_required',
      'archived'
    )),
  scheduled_for               timestamptz null,
  published_at                timestamptz null,
  publish_failure_reason      text        null,
  is_reuse_based              boolean     not null default false,
  created_by_user_id          uuid        null
    references public.user_profiles(id) on delete set null,
  approved_by_user_id         uuid        null
    references public.user_profiles(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table  public.posts is
  'Scheduling/publishing pipeline rows. NO real publishing API in M004; published_at and post_status=published are set manually or by a future worker. Internal pipeline states are hidden from clients via client_portal_calendar_view.';
comment on column public.posts.concept_id is
  'Placeholder column; FK to content_concepts(id) is added in Migration 006.';
comment on column public.posts.draft_variant_id is
  'Placeholder column; FK to draft_variants(id) is added in Migration 006.';
comment on column public.posts.publish_failure_reason is
  'Internal-only raw reason. Client-facing views translate this into safe wording (e.g. "Needs another shot") or omit it.';
comment on column public.posts.published_at is
  'Manual/system controlled; no real platform API contact in M004.';

create index posts_client_id_idx       on public.posts (client_id);
create index posts_media_asset_id_idx  on public.posts (media_asset_id);
create index posts_platform_name_idx   on public.posts (platform_name);
create index posts_post_status_idx     on public.posts (post_status);
create index posts_scheduled_for_idx   on public.posts (scheduled_for);
create index posts_published_at_idx    on public.posts (published_at);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 2. post_slots
-- -----------------------------------------------------------------------------
--
-- One open slot per (client, platform, date, time). Reuse the slot
-- (status flips + reserved_post_id set/cleared) rather than inserting
-- duplicates.
--
-- timezone is REQUIRED — no default. The natural source on insert is
-- clients.timezone, but the slot stores its own copy so timezone
-- changes on the client do not retroactively re-interpret historical
-- slots.

create table public.post_slots (
  id                  uuid        primary key default gen_random_uuid(),
  client_id           uuid        not null
    references public.clients(id) on delete cascade,
  platform_name       text        not null
    check (platform_name in ('instagram','facebook','google_business','tiktok','other')),
  slot_date           date        not null,
  slot_time           time        not null,
  timezone            text        not null,
  status              text        not null default 'open'
    check (status in ('open','reserved','scheduled','completed','skipped')),
  reserved_post_id    uuid        null
    references public.posts(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (client_id, platform_name, slot_date, slot_time)
);

comment on table public.post_slots is
  'Calendar slots. One per (client, platform, date, time). Reuse via status flip; do NOT insert duplicates. No background scheduler in M004 — slot fill is manual or future-worker.';
comment on column public.post_slots.timezone is
  'IANA timezone; required. Snapshotted from clients.timezone at insert time so later client.timezone changes do not re-interpret historical slots.';

create index post_slots_client_id_idx          on public.post_slots (client_id);
create index post_slots_platform_name_idx      on public.post_slots (platform_name);
create index post_slots_slot_date_idx          on public.post_slots (slot_date);
create index post_slots_status_idx             on public.post_slots (status);
create index post_slots_reserved_post_id_idx   on public.post_slots (reserved_post_id);
-- The unique(client_id, platform_name, slot_date, slot_time)
-- constraint creates its own composite index automatically.

create trigger post_slots_set_updated_at
  before update on public.post_slots
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 3. Add deferred FK: media_assets.linked_post_id -> posts(id)
-- -----------------------------------------------------------------------------
--
-- This FK is added in Migration 004 because the posts table does not
-- exist in Migration 003.
--
-- Pre-flight: every existing media_assets.linked_post_id is NULL or
-- points to a real posts.id. On a greenfield install nothing has been
-- written yet, so this is safe. Otherwise null out orphans first:
--   update public.media_assets
--      set linked_post_id = null
--    where linked_post_id is not null
--      and linked_post_id not in (select id from public.posts);
--
-- on delete set null: removing a post unlinks the media but does not
-- delete the asset.

alter table public.media_assets
  add constraint media_assets_linked_post_id_fkey
  foreign key (linked_post_id) references public.posts(id)
  on delete set null;

comment on constraint media_assets_linked_post_id_fkey on public.media_assets is
  'Deferred from Migration 003; posts table did not exist there. Added in Migration 004.';


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.posts       enable row level security;
alter table public.post_slots  enable row level security;

-- posts -----------------------------------------------------------------------

-- Client SELECT — own client only, AND only the externally-visible
-- pipeline states (scheduled / published). Internal pipeline states
-- are hidden at the row level so even a base-table client read does
-- not leak in-progress drafts. Column-hiding (concept_id, draft_variant_id,
-- approved_by_user_id, publish_failure_reason) is enforced by
-- client_portal_calendar_view.
create policy posts_select_own_client
  on public.posts
  for select
  to authenticated
  using (
    client_id = private.current_user_client_id()
    and post_status in ('scheduled','published')
  );

-- (NO client INSERT / UPDATE / DELETE policy. Clients cannot directly
--  write to posts. Post-change requests go through client_requests
--  (M002).)

-- Team / operator / owner read for clients they can view.
create policy posts_select_staff
  on public.posts
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team manage assigned client posts (create, update, schedule).
-- can_manage_client_operations short-circuits true for operator/owner.
create policy posts_manage_assigned
  on public.posts
  for all
  to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

-- Owner full access (explicit for audit clarity).
create policy posts_owner_all
  on public.posts
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- System updates published/failed status via service role (RLS bypass).
-- No explicit policy needed.

-- post_slots ------------------------------------------------------------------

-- Client SELECT — own client only. The full row is permitted at base
-- level; client_portal_calendar_view is the layer that joins slots to
-- posts for display.
create policy post_slots_select_own_client
  on public.post_slots
  for select
  to authenticated
  using (client_id = private.current_user_client_id());

-- (NO client INSERT / UPDATE / DELETE policy. Slot management is staff-only.)

-- Team / operator / owner read.
create policy post_slots_select_staff
  on public.post_slots
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team manage assigned client slots.
create policy post_slots_manage_assigned
  on public.post_slots
  for all
  to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

-- Owner full access.
create policy post_slots_owner_all
  on public.post_slots
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());


-- =============================================================================
-- CLIENT-SAFE CALENDAR VIEW STUB (commented — materialized in portal-connect pass)
-- =============================================================================
--
-- Pattern: with (security_invoker = true) so the caller's RLS is
-- applied at the base table; the view's job is column-hiding and
-- label translation.
--
-- post_status -> status_label translation (proposed):
--   planning           -> 'In progress'
--   awaiting_content   -> 'In progress'
--   ready_for_review   -> 'In progress'
--   approved           -> 'In progress'
--   ready_to_schedule  -> 'In progress'
--   scheduled          -> 'Scheduled'
--   published          -> 'Posted'
--   failed             -> 'Needs another shot'
--   reschedule_required-> 'Needs another shot'
--   archived           -> (not surfaced; filtered out)
--
-- Note: the M004 client SELECT policy on posts already filters to
-- scheduled/published only, so the in-progress branches above are
-- not reachable through this view in normal operation. They are kept
-- in the case statement so a future widening of the policy does not
-- silently leak the raw enum value as a label.
--
-- create view public.client_portal_calendar_view
--   with (security_invoker = true) as
-- select
--   p.client_id,
--   p.id                       as post_id,
--   p.platform_name,
--   p.content_type,
--   coalesce(p.title, 'Post for ' || p.platform_name) as client_safe_title,
--   p.scheduled_for,
--   p.published_at,
--   case p.post_status
--     when 'planning'            then 'In progress'
--     when 'awaiting_content'    then 'In progress'
--     when 'ready_for_review'    then 'In progress'
--     when 'approved'            then 'In progress'
--     when 'ready_to_schedule'   then 'In progress'
--     when 'scheduled'           then 'Scheduled'
--     when 'published'           then 'Posted'
--     when 'failed'              then 'Needs another shot'
--     when 'reschedule_required' then 'Needs another shot'
--   end                          as status_label,
--   m.thumbnail_url
-- from public.posts p
-- left join public.media_assets m on m.id = p.media_asset_id
-- where p.client_id   = private.current_user_client_id()
--   and p.post_status in ('scheduled','published');
-- -- Hidden: concept_id, draft_variant_id, approved_by_user_id,
-- -- created_by_user_id, publish_failure_reason, caption_text (unless
-- -- intentionally exposed), raw post_status.
--
-- After creating the view in the portal-connect pass:
--   revoke select on public.posts, public.post_slots from authenticated;
--   grant  select on public.client_portal_calendar_view to authenticated;
-- Do NOT issue these revokes in M004.

-- -----------------------------------------------------------------------------
-- End of Migration 004 draft.
-- -----------------------------------------------------------------------------
commit;

-- =============================================================================
-- REMINDER: this file is in docs/sql_drafts/migrations_review/, NOT in
-- supabase/migrations/. It has not been applied to any database.
-- Migration 004 must be applied AFTER Migration 003 succeeds.
-- =============================================================================
