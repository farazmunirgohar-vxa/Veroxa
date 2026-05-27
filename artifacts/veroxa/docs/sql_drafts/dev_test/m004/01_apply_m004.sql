-- =============================================================================
-- M004 Dev Test — Step 1: Apply Migration 004 (Posting Foundation)
--
-- Source:
--   docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql
--
-- Run this file FIRST in the Supabase SQL editor (postgres context).
-- Apply AFTER M001, M002, M003, and the M003 team-scope correction.
--
-- Expected result: "Success. No rows returned."
-- If errors appear, STOP and do not proceed to seed or tests.
--
-- AUTH_MODE stays "placeholder". No real publishing. Dev project only.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. posts
-- -----------------------------------------------------------------------------

create table public.posts (
  id                          uuid        primary key default gen_random_uuid(),
  client_id                   uuid        not null
    references public.clients(id) on delete cascade,
  media_asset_id              uuid        null
    references public.media_assets(id) on delete set null,
  concept_id                  uuid        null,
  draft_variant_id            uuid        null,
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
  'Internal-only raw reason. Client-facing views translate this into safe wording or omit it.';
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

create trigger post_slots_set_updated_at
  before update on public.post_slots
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 3. Add deferred FK: media_assets.linked_post_id -> posts(id)
-- -----------------------------------------------------------------------------

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

-- Client SELECT — own client, scheduled/published only.
create policy posts_select_own_client
  on public.posts
  for select
  to authenticated
  using (
    client_id = private.current_user_client_id()
    and post_status in ('scheduled','published')
  );

-- Team / operator / owner read (uses can_view_client — see README for
-- known defect: also matches client role).
create policy posts_select_staff
  on public.posts
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team manage assigned (create, update, schedule).
create policy posts_manage_assigned
  on public.posts
  for all
  to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

-- Owner full access.
create policy posts_owner_all
  on public.posts
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- post_slots ------------------------------------------------------------------

-- Client SELECT — own client only.
create policy post_slots_select_own_client
  on public.post_slots
  for select
  to authenticated
  using (client_id = private.current_user_client_id());

-- Team / operator / owner read (same can_view_client note as posts).
create policy post_slots_select_staff
  on public.post_slots
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team manage assigned slots.
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
-- Uncomment when the portal-connect pass begins. Do NOT uncomment and run now.
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

commit;

-- Quick verification:
select table_name, row_security
from information_schema.tables
where table_name in ('posts','post_slots')
  and table_schema = 'public';
-- EXPECTED: 2 rows, row_security=YES for both.

select conname from pg_constraint
where conname = 'media_assets_linked_post_id_fkey';
-- EXPECTED: 1 row.
