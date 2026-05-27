-- =============================================================================
-- M003 APPLY — DEV SUPABASE ONLY — NOT PRODUCTION
--
-- Source: docs/sql_drafts/migrations_review/003_media_foundation_draft.sql
-- Target: dev Supabase project where M001 + M002 are applied and green.
--
-- HARD PRECONDITION:
--   * M001 applied and tested green
--   * M002 applied and tested green
--
-- HOW TO RUN:
--   1. Supabase dashboard → SQL Editor (DEV project only).
--   2. Paste this entire file and Run.
--   3. Expected: success on every statement.
--   4. If any statement errors: STOP. Restore from snapshot.
--
-- This file is the M003 draft with the "DO NOT RUN" header removed.
-- Schema/policies are otherwise unchanged.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. media_assets
-- -----------------------------------------------------------------------------
create table public.media_assets (
  id                  uuid        primary key default gen_random_uuid(),
  client_id           uuid        not null
    references public.clients(id) on delete cascade,
  uploaded_by_user_id uuid        null
    references public.user_profiles(id) on delete set null,
  file_url            text        not null,
  thumbnail_url       text        null,
  file_type           text        not null
    check (file_type in ('image','video')),
  mime_type           text        not null,
  width_px            integer     null,
  height_px           integer     null,
  duration_seconds    numeric     null,
  source_type         text        not null default 'client_upload'
    check (source_type in ('client_upload','legacy_reuse','team_upload')),
  title               text        null,
  caption_hint        text        null,
  client_safe_note    text        null,
  internal_note       text        null,
  quality_ai_flag     text        null
    check (quality_ai_flag in ('likely_usable','borderline','likely_reject')),
  quality_score       integer     null,
  review_status       text        not null default 'uploaded'
    check (review_status in (
      'uploaded','ai_reviewed','team_review_pending','rejected',
      'usable','shortlisted','drafted','approved','scheduled','used',
      'reusable_archive'
    )),
  rejection_reason    text        null,
  reuse_eligible      boolean     not null default false,
  linked_post_id      uuid        null,
  uploaded_at         timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table  public.media_assets is
  'Client-uploaded or team-sourced media. Lifecycle in review_status. internal_note / raw rejection_reason / quality_* are staff-only and MUST be hidden by client_portal_media_view.';
comment on column public.media_assets.linked_post_id is
  'Placeholder column; FK to posts(id) is added in Migration 004.';
comment on column public.media_assets.internal_note is
  'Internal staff notes. Never exposed through client-facing views.';
comment on column public.media_assets.rejection_reason is
  'Internal raw reason. Client-facing views show a translated label, not this column.';

create index media_assets_client_id_idx     on public.media_assets (client_id);
create index media_assets_review_status_idx on public.media_assets (review_status);
create index media_assets_uploaded_at_idx   on public.media_assets (uploaded_at);
create index media_assets_source_type_idx   on public.media_assets (source_type);

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. notifications
-- -----------------------------------------------------------------------------
create table public.notifications (
  id                  uuid        primary key default gen_random_uuid(),
  client_id           uuid        null
    references public.clients(id) on delete cascade,
  target_role         text        not null
    check (target_role in ('client','team','operator','owner')),
  target_user_id      uuid        null
    references public.user_profiles(id) on delete set null,
  notification_type   text        not null
    check (notification_type in ('success','info','warning','reminder','critical')),
  priority            text        not null default 'p2'
    check (priority in ('p1','p2','p3')),
  title               text        not null,
  message_body        text        not null,
  status              text        not null default 'created'
    check (status in ('created','sent','seen','dismissed','escalated')),
  trigger_source      text        not null default 'system'
    check (trigger_source in ('system','agent','operator','team','client_action')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.notifications is
  'Per-tenant notifications scoped by target_role. RLS scopes visibility; client sees only own + target_role=client.';

create index notifications_client_id_idx       on public.notifications (client_id);
create index notifications_target_role_idx     on public.notifications (target_role);
create index notifications_target_user_id_idx  on public.notifications (target_user_id);
create index notifications_status_idx          on public.notifications (status);
create index notifications_priority_idx        on public.notifications (priority);

create trigger notifications_set_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. client_health_snapshots (append-only)
-- -----------------------------------------------------------------------------
create table public.client_health_snapshots (
  id                          uuid        primary key default gen_random_uuid(),
  client_id                   uuid        not null
    references public.clients(id) on delete cascade,
  level                       text        not null
    check (level in ('healthy','attention','critical')),
  priority_level              text        not null default 'normal'
    check (priority_level in ('low','normal','high','critical')),
  content_runway_days         integer     null,
  approved_media_count        integer     null,
  scheduled_posts_count       integer     null,
  open_requests_count         integer     null,
  unresolved_alerts_count     integer     null,
  summary                     text        null,
  created_by_role             text        not null default 'system'
    check (created_by_role in ('system','operator','owner')),
  created_at                  timestamptz not null default now()
);

comment on table public.client_health_snapshots is
  'Append-only health snapshot per client. Correct a wrong snapshot by inserting a new one; never UPDATE. Client sees simplified subset through client_portal_health_view.';

create index client_health_snapshots_client_id_idx  on public.client_health_snapshots (client_id);
create index client_health_snapshots_created_at_idx on public.client_health_snapshots (created_at);

-- -----------------------------------------------------------------------------
-- 4. activity_logs (append-only)
-- -----------------------------------------------------------------------------
create table public.activity_logs (
  id                      uuid        primary key default gen_random_uuid(),
  client_id               uuid        null
    references public.clients(id) on delete cascade,
  entity_type             text        not null,
  entity_id               uuid        null,
  action_key              text        not null,
  description             text        null,
  performed_by_role       text        not null
    check (performed_by_role in ('system','client','team','operator','owner')),
  performed_by_user_id    uuid        null
    references public.user_profiles(id) on delete set null,
  old_value_json          jsonb       null,
  new_value_json          jsonb       null,
  created_at              timestamptz not null default now()
);

comment on table public.activity_logs is
  'Append-only audit log. No UPDATE/DELETE policies (except owner_all). entity_id is NOT a FK (entity_type discriminates target table).';

create index activity_logs_client_id_idx                  on public.activity_logs (client_id);
create index activity_logs_entity_type_entity_id_idx      on public.activity_logs (entity_type, entity_id);
create index activity_logs_created_at_idx                 on public.activity_logs (created_at);
create index activity_logs_performed_by_user_id_idx       on public.activity_logs (performed_by_user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.media_assets             enable row level security;
alter table public.notifications            enable row level security;
alter table public.client_health_snapshots  enable row level security;
alter table public.activity_logs            enable row level security;

-- media_assets
create policy media_assets_select_own_client
  on public.media_assets for select to authenticated
  using (client_id = private.current_user_client_id());

create policy media_assets_insert_own_client
  on public.media_assets for insert to authenticated
  with check (
    client_id      = private.current_user_client_id()
    and source_type   = 'client_upload'
    and review_status = 'uploaded'
  );

create policy media_assets_select_staff
  on public.media_assets for select to authenticated
  using (private.can_view_client(client_id));

create policy media_assets_manage_assigned
  on public.media_assets for all to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

create policy media_assets_owner_all
  on public.media_assets for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- notifications
create policy notifications_select_own_client
  on public.notifications for select to authenticated
  using (
    client_id   = private.current_user_client_id()
    and target_role = 'client'
  );

create policy notifications_update_status_own_client
  on public.notifications for update to authenticated
  using       (client_id = private.current_user_client_id() and target_role = 'client')
  with check  (client_id = private.current_user_client_id() and target_role = 'client');

create policy notifications_select_assigned_team
  on public.notifications for select to authenticated
  using (
    private.can_view_client(client_id)
    and target_role in ('team','operator')
  );

create policy notifications_select_staff_all
  on public.notifications for select to authenticated
  using (private.is_operator());

create policy notifications_owner_all
  on public.notifications for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- client_health_snapshots
create policy chs_select_own_client
  on public.client_health_snapshots for select to authenticated
  using (client_id = private.current_user_client_id());

create policy chs_select_assigned_team
  on public.client_health_snapshots for select to authenticated
  using (private.can_view_client(client_id));

create policy chs_select_operator
  on public.client_health_snapshots for select to authenticated
  using (private.is_operator());

create policy chs_insert_operator_owner
  on public.client_health_snapshots for insert to authenticated
  with check (private.is_operator() or private.is_owner());

create policy chs_owner_all
  on public.client_health_snapshots for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- activity_logs
create policy activity_logs_select_assigned_team
  on public.activity_logs for select to authenticated
  using (
    private.can_view_client(client_id)
    and entity_type in ('media_assets','client_requests','onboarding_items','client_platforms')
  );

create policy activity_logs_select_staff_all
  on public.activity_logs for select to authenticated
  using (private.is_operator());

create policy activity_logs_owner_all
  on public.activity_logs for all to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

create policy activity_logs_insert_staff
  on public.activity_logs for insert to authenticated
  with check (private.is_operator() or private.is_owner());

commit;

-- =============================================================================
-- DEFERRED to portal-connect pass (NOT this migration):
--   * create view public.client_portal_media_view
--   * create view public.client_portal_notifications_view
--   * create view public.client_portal_health_view
--   * revoke select on the base tables from authenticated
-- =============================================================================
