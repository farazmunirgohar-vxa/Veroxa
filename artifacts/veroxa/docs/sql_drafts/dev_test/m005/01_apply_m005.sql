-- =============================================================================
-- M005 Dev Test — Step 1: Apply Migration 005 (Reporting Foundation)
--
-- Source:
--   docs/sql_drafts/migrations_review/005_reporting_foundation_draft.sql
--
-- Run this file FIRST in the Supabase SQL editor (postgres context).
-- Apply AFTER M001–M004 + M003 team-scope correction + M004 staff-policy
-- correction.
--
-- Expected result: "Success. No rows returned."
-- If errors appear, STOP and do not proceed to seed or tests.
--
-- AUTH_MODE stays "placeholder". No real publishing / billing / AI
-- integrations. Dev project only.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. weekly_reports
-- -----------------------------------------------------------------------------

create table public.weekly_reports (
  id                        uuid        primary key default gen_random_uuid(),
  client_id                 uuid        not null
    references public.clients(id) on delete cascade,
  week_start                date        not null,
  week_end                  date        not null,
  posts_planned             integer     not null default 0,
  posts_published           integer     not null default 0,
  top_post_id               uuid        null
    references public.posts(id) on delete set null,
  status                    text        not null default 'drafted'
    check (status in ('drafted','validated','published')),
  draft_owner_id            uuid        null
    references public.user_profiles(id) on delete set null,
  validation_owner_id       uuid        null
    references public.user_profiles(id) on delete set null,
  internal_validation_note  text        null,
  client_safe_summary       text        null,
  summary_json              jsonb       null,
  published_at              timestamptz null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (client_id, week_start)
);

comment on table  public.weekly_reports is
  'One row per (client, ISO week). Three-step pipeline: drafted -> validated -> published. Clients see published rows only via client_portal_weekly_reports_view. internal_validation_note is staff-only.';
comment on column public.weekly_reports.internal_validation_note is
  'Staff-only commentary; NEVER exposed to clients. Excluded from client_portal_weekly_reports_view.';
comment on column public.weekly_reports.client_safe_summary is
  'Sanitized narrative shown to clients.';
comment on column public.weekly_reports.summary_json is
  'Full payload. Client-safe view exposes only the summary_json->''client_safe'' subpath.';
comment on column public.weekly_reports.top_post_id is
  'on delete set null — deleting a post does not break historical reports; only the highlight reference is lost.';

create index weekly_reports_client_id_idx     on public.weekly_reports (client_id);
create index weekly_reports_week_start_idx    on public.weekly_reports (week_start);
create index weekly_reports_status_idx        on public.weekly_reports (status);
create index weekly_reports_top_post_id_idx   on public.weekly_reports (top_post_id);

create trigger weekly_reports_set_updated_at
  before update on public.weekly_reports
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 2. monthly_reports
-- -----------------------------------------------------------------------------

create table public.monthly_reports (
  id                       uuid        primary key default gen_random_uuid(),
  client_id                uuid        not null
    references public.clients(id) on delete cascade,
  month_key                text        not null,
  status                   text        not null default 'drafting'
    check (status in ('drafting','operator_review','approved','published')),
  summary_json             jsonb       null,
  client_safe_summary      text        null,
  approved_by_user_id      uuid        null
    references public.user_profiles(id) on delete set null,
  published_at             timestamptz null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (client_id, month_key),
  check (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

comment on table  public.monthly_reports is
  'One row per (client, calendar month). Four-step pipeline: drafting -> operator_review -> approved -> published. Approval is a hard gate.';
comment on column public.monthly_reports.month_key is
  'Calendar month in YYYY-MM form. Stored as text to avoid timezone ambiguity at month boundaries.';
comment on column public.monthly_reports.approved_by_user_id is
  'Operator who approved the report. Required (NOT NULL) for status=''published''; enforced by operator and owner manage policies WITH CHECK.';
comment on column public.monthly_reports.summary_json is
  'Full payload. Client-safe view exposes only the summary_json->''client_safe'' subpath.';

create index monthly_reports_client_id_idx          on public.monthly_reports (client_id);
create index monthly_reports_month_key_idx          on public.monthly_reports (month_key);
create index monthly_reports_status_idx             on public.monthly_reports (status);
create index monthly_reports_approved_by_user_id_idx
  on public.monthly_reports (approved_by_user_id);

create trigger monthly_reports_set_updated_at
  before update on public.monthly_reports
  for each row execute function public.set_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.weekly_reports  enable row level security;
alter table public.monthly_reports enable row level security;

-- weekly_reports policies ----------------------------------------------------

-- Client SELECT — own client AND published only.
create policy weekly_reports_select_own_client
  on public.weekly_reports
  for select
  to authenticated
  using (
    client_id = private.current_user_client_id()
    and status = 'published'
  );

-- Staff SELECT — team/operator/owner read for clients they can view.
create policy weekly_reports_select_staff
  on public.weekly_reports
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team manage assigned clients up to 'validated' only.
create policy weekly_reports_team_manage_pre_publish
  on public.weekly_reports
  for all
  to authenticated
  using (
    private.can_manage_client_operations(client_id)
    and status in ('drafted','validated')
  )
  with check (
    private.can_manage_client_operations(client_id)
    and status in ('drafted','validated')
  );

-- Operator manage — full lifecycle including validated->published.
create policy weekly_reports_operator_manage
  on public.weekly_reports
  for all
  to authenticated
  using       (private.is_operator())
  with check  (private.is_operator());

-- Owner full access (explicit for audit clarity).
create policy weekly_reports_owner_all
  on public.weekly_reports
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());


-- monthly_reports policies ---------------------------------------------------

-- Client SELECT — own client AND published only.
create policy monthly_reports_select_own_client
  on public.monthly_reports
  for select
  to authenticated
  using (
    client_id = private.current_user_client_id()
    and status = 'published'
  );

-- Staff SELECT.
create policy monthly_reports_select_staff
  on public.monthly_reports
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team manage in 'drafting' or 'operator_review' only.
create policy monthly_reports_team_manage_pre_approval
  on public.monthly_reports
  for all
  to authenticated
  using (
    private.can_manage_client_operations(client_id)
    and status in ('drafting','operator_review')
  )
  with check (
    private.can_manage_client_operations(client_id)
    and status in ('drafting','operator_review')
  );

-- Operator manage — full lifecycle WITH approval-gate WITH CHECK.
create policy monthly_reports_operator_manage
  on public.monthly_reports
  for all
  to authenticated
  using       (private.is_operator())
  with check  (
    private.is_operator()
    and (status <> 'published' or approved_by_user_id is not null)
  );

-- Owner full access — same approval-gate WITH CHECK.
create policy monthly_reports_owner_all
  on public.monthly_reports
  for all
  to authenticated
  using       (private.is_owner())
  with check  (
    private.is_owner()
    and (status <> 'published' or approved_by_user_id is not null)
  );


-- =============================================================================
-- CLIENT-SAFE REPORT VIEWS
-- =============================================================================

create view public.client_portal_weekly_reports_view
  with (security_invoker = true) as
select
  wr.id,
  wr.client_id,
  wr.week_start,
  wr.week_end,
  wr.posts_planned,
  wr.posts_published,
  wr.top_post_id,
  wr.client_safe_summary,
  wr.published_at,
  wr.summary_json -> 'client_safe' as client_safe_summary_json
from public.weekly_reports wr
where wr.status = 'published';

comment on view public.client_portal_weekly_reports_view is
  'Client-safe weekly report view. security_invoker = true. Filters to status=''published''. Exposes only summary_json->''client_safe''.';

grant select on public.client_portal_weekly_reports_view to authenticated;

create view public.client_portal_monthly_reports_view
  with (security_invoker = true) as
select
  mr.id,
  mr.client_id,
  mr.month_key,
  mr.client_safe_summary,
  mr.published_at,
  mr.summary_json -> 'client_safe' as client_safe_summary_json
from public.monthly_reports mr
where mr.status = 'published';

comment on view public.client_portal_monthly_reports_view is
  'Client-safe monthly report view. security_invoker = true. Filters to status=''published''. Exposes only summary_json->''client_safe''.';

grant select on public.client_portal_monthly_reports_view to authenticated;

commit;

-- Quick verification:
select table_name, row_security
from information_schema.tables
where table_name in ('weekly_reports','monthly_reports')
  and table_schema = 'public';
-- EXPECTED: 2 rows, row_security=YES for both.

select table_name from information_schema.views
where table_schema = 'public'
  and table_name in (
    'client_portal_weekly_reports_view',
    'client_portal_monthly_reports_view'
  );
-- EXPECTED: 2 rows.
