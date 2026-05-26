-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- Review and audit before converting into a real migration.
-- AUTH_MODE remains "placeholder".
-- =============================================================================
--
-- Migration 005 — Reporting Foundation (DRAFT)
--
-- Depends on Migration 001 (identity + helpers), Migration 002 (clients +
-- can_view_client / can_manage_client_operations / current_user_client_id),
-- Migration 003 (media + activity + notifications), AND Migration 004
-- (posts — required for weekly_reports.top_post_id). Required pre-existing
-- objects:
--   * public.user_profiles                                  (M001)
--   * public.set_updated_at()                               (M001)
--   * private.is_owner(), private.is_operator()             (M001)
--   * public.clients                                        (M002)
--   * private.current_user_client_id()                      (M002)
--   * private.can_view_client(uuid)                         (M002)
--   * private.can_manage_client_operations(uuid)            (M002)
--   * public.posts                                          (M004)
--
-- Scope (this file):
--   * public.weekly_reports
--   * public.monthly_reports
--   * RLS + per-role policies
--   * Indexes + updated_at triggers
--   * client_portal_weekly_reports_view  (security_invoker, published-only)
--   * client_portal_monthly_reports_view (security_invoker, published-only)
--
-- Intentionally NOT in scope (deferred):
--   * AI report generation / narrative authoring          -> separate AI track
--   * PDF / image / slide exports                         -> separate export track
--   * Payment reporting, billing, invoices                -> separate payments track
--   * financial_snapshots, revenue rollups                -> separate analytics track
--   * ai_agents, content_concepts, draft_sets, draft_variants -> M006
--   * Automation jobs, schedulers, cron, background workers
--   * Real publishing integrations                        -> M008+
--   * Notifications about report state (uses existing M003 notifications;
--     no new column or trigger added here)
--   * Any change to AUTH_MODE, auth wiring, portal navigation, pricing
--
-- Source-of-truth references:
--   * docs/MIGRATION_005_REPORTING_FOUNDATION_PLAN.md  (this file's blueprint)
--   * docs/MIGRATION_005_TEST_PLAN.md
--
-- Deviation note vs. the prompt that originated M005:
--   * The plan locks unique(client_id, week_start) — NOT
--     (week_start, week_end) — because ISO weeks are uniquely identified
--     by their start date and the end-date is derived.
--   * Column names follow the plan: draft_owner_id /
--     validation_owner_id (NOT drafted_by_user_id / validated_by_user_id).
--   * monthly_reports does NOT include internal_operator_note. The plan
--     consolidates all staff-only commentary into summary_json (the
--     client view exposes only summary_json->'client_safe').
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. weekly_reports
-- -----------------------------------------------------------------------------
--
-- One row per client per ISO week. Drafted by team, validated by team or
-- operator, published by operator. Clients only ever see published rows
-- and only via client_portal_weekly_reports_view.

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
  'Sanitized narrative shown to clients. NOT a copy of internal_validation_note — must be written assuming the client reads it.';
comment on column public.weekly_reports.summary_json is
  'Full payload (metrics, charts, narrative). The client-safe view exposes only the summary_json->''client_safe'' subpath.';
comment on column public.weekly_reports.top_post_id is
  'on delete set null — deleting a post does not break historical reports; only the highlight reference is lost.';

create index weekly_reports_client_id_idx     on public.weekly_reports (client_id);
create index weekly_reports_week_start_idx    on public.weekly_reports (week_start);
create index weekly_reports_status_idx        on public.weekly_reports (status);
create index weekly_reports_top_post_id_idx   on public.weekly_reports (top_post_id);
-- The unique(client_id, week_start) constraint creates its own composite
-- index automatically.

create trigger weekly_reports_set_updated_at
  before update on public.weekly_reports
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 2. monthly_reports
-- -----------------------------------------------------------------------------
--
-- One row per client per calendar month. Drafted by team, reviewed by
-- operator, approved and published by operator. Approval is a hard gate:
-- transition to 'published' requires approved_by_user_id IS NOT NULL.
--
-- month_key is stored as text (YYYY-MM) rather than a date so the unique
-- constraint is trivial and timezone ambiguity at month boundaries is
-- side-stepped.

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
  'One row per (client, calendar month). Four-step pipeline: drafting -> operator_review -> approved -> published. Approval is a hard gate before publication. Clients see published rows only via client_portal_monthly_reports_view.';
comment on column public.monthly_reports.month_key is
  'Calendar month identifier in YYYY-MM form (e.g. "2026-05"). Stored as text to avoid timezone ambiguity at month boundaries.';
comment on column public.monthly_reports.approved_by_user_id is
  'Operator who approved the report. Required (NOT NULL) for the status=''published'' transition; enforced by the operator manage policy WITH CHECK clause.';
comment on column public.monthly_reports.summary_json is
  'Full payload. Client-safe view exposes only the summary_json->''client_safe'' subpath; no internal-operator note column exists on this table by design.';

create index monthly_reports_client_id_idx          on public.monthly_reports (client_id);
create index monthly_reports_month_key_idx          on public.monthly_reports (month_key);
create index monthly_reports_status_idx             on public.monthly_reports (status);
create index monthly_reports_approved_by_user_id_idx
  on public.monthly_reports (approved_by_user_id);
-- The unique(client_id, month_key) constraint creates its own composite
-- index automatically.

create trigger monthly_reports_set_updated_at
  before update on public.monthly_reports
  for each row execute function public.set_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
--
-- Mechanism note: in Supabase every logged-in user is the Postgres
-- `authenticated` role; role separation is by JWT-derived helpers
-- (private.is_owner / private.is_operator / private.current_user_client_id
-- / private.can_*). Revoking SELECT from `authenticated` on the base
-- tables would block everyone, so column-hiding is enforced by the
-- client_portal_* views (narrow projection) and row-hiding is enforced
-- by RLS on the base tables. This matches the M002/M003/M004 pattern.

alter table public.weekly_reports  enable row level security;
alter table public.monthly_reports enable row level security;

-- ----- weekly_reports policies ----------------------------------------------

-- Client SELECT — own client AND published only. The view further
-- narrows the columns; the row-level filter here is defense-in-depth so
-- a base-table read cannot leak draft/validated rows even if the view
-- is ever bypassed.
create policy weekly_reports_select_own_client
  on public.weekly_reports
  for select
  to authenticated
  using (
    client_id = private.current_user_client_id()
    and status = 'published'
  );

-- (NO client INSERT / UPDATE / DELETE policy. Clients never write reports.)

-- Staff SELECT — team can see assigned-client reports in all statuses;
-- operator/owner short-circuit via can_view_client.
create policy weekly_reports_select_staff
  on public.weekly_reports
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team manage assigned clients up to 'validated'. WITH CHECK blocks
-- team from inserting or updating a row into status='published';
-- USING blocks them from operating on rows that are already published.
-- Operator policy (below) handles published rows.
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

-- Operator manage — full lifecycle including the validated->published
-- transition. Operator may also retroactively edit published rows
-- (audit log captures this; see hybrid log strategy in
-- SUPABASE_RLS_PLAN_V1.md Part 9).
create policy weekly_reports_operator_manage
  on public.weekly_reports
  for all
  to authenticated
  using       (private.is_operator())
  with check  (private.is_operator());

-- Owner full access (explicit for audit clarity; superset of operator).
create policy weekly_reports_owner_all
  on public.weekly_reports
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- System (service_role) bypasses RLS — used by the future auto-draft
-- worker that inserts one empty 'drafted' row per active client at the
-- start of each week. No worker shipped in M005.

-- ----- monthly_reports policies ---------------------------------------------

-- Client SELECT — own client AND published only.
create policy monthly_reports_select_own_client
  on public.monthly_reports
  for select
  to authenticated
  using (
    client_id = private.current_user_client_id()
    and status = 'published'
  );

-- (NO client INSERT / UPDATE / DELETE policy.)

-- Staff SELECT — team sees assigned-client reports in all statuses;
-- operator/owner short-circuit via can_view_client.
create policy monthly_reports_select_staff
  on public.monthly_reports
  for select
  to authenticated
  using (private.can_view_client(client_id));

-- Team manage assigned clients in 'drafting' or 'operator_review' only.
-- Team owns drafting -> operator_review; cannot reach 'approved' or
-- 'published'.
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

-- Operator manage — full lifecycle. The WITH CHECK clause encodes the
-- hard-gate rule: a row may only land in status='published' if
-- approved_by_user_id is not null. This blocks operator_review ->
-- published (skipping 'approved') AND blocks publishing an 'approved'
-- row whose approval owner has been nulled out.
create policy monthly_reports_operator_manage
  on public.monthly_reports
  for all
  to authenticated
  using       (private.is_operator())
  with check  (
    private.is_operator()
    and (status <> 'published' or approved_by_user_id is not null)
  );

-- Owner full access. Same approval-gate WITH CHECK so owner cannot
-- accidentally bypass the rule either.
create policy monthly_reports_owner_all
  on public.monthly_reports
  for all
  to authenticated
  using       (private.is_owner())
  with check  (
    private.is_owner()
    and (status <> 'published' or approved_by_user_id is not null)
  );

-- System (service_role) bypasses RLS — used by the future auto-draft
-- worker that inserts one empty 'drafting' row per active client at the
-- start of each month. No worker shipped in M005.


-- =============================================================================
-- CLIENT-SAFE REPORT VIEWS
-- =============================================================================
--
-- Both views use security_invoker = true so the caller's RLS on the
-- base table applies. The view's job is column-hiding (narrow
-- projection) and the published-only filter. The base-table client
-- SELECT policy already restricts to status='published', so the WHERE
-- clauses below are defense-in-depth.
--
-- summary_json client-safe subset: the contract is summary_json->'client_safe'.
-- Anything outside that JSON path is considered internal. The writer
-- (team / operator / future auto-draft worker) is responsible for
-- placing client-safe content under that key. This decision closes E2
-- from MIGRATION_005_TEST_PLAN_OUTLINE.

-- ----- client_portal_weekly_reports_view ------------------------------------

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
  'Client-safe weekly report view. security_invoker = true so caller RLS applies. Filters to status=''published''. Exposes only the summary_json->''client_safe'' subpath. Hides: internal_validation_note, draft_owner_id, validation_owner_id, raw summary_json, status (published by definition), non-published rows.';

grant select on public.client_portal_weekly_reports_view to authenticated;

-- ----- client_portal_monthly_reports_view -----------------------------------

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
  'Client-safe monthly report view. security_invoker = true so caller RLS applies. Filters to status=''published''. Exposes only the summary_json->''client_safe'' subpath. Hides: approved_by_user_id, raw summary_json, status (published by definition), drafting/operator_review/approved rows.';

grant select on public.client_portal_monthly_reports_view to authenticated;


-- -----------------------------------------------------------------------------
-- End of Migration 005 draft.
-- -----------------------------------------------------------------------------
commit;

-- =============================================================================
-- REMINDER: this file is in docs/sql_drafts/migrations_review/, NOT in
-- supabase/migrations/. It has not been applied to any database.
-- Migration 005 must be applied AFTER Migration 004 succeeds.
-- =============================================================================
