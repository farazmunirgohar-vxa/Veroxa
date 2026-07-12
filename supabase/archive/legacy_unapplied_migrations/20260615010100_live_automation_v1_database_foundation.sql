-- =============================================================
-- PR #101 — Live Automation V1 Database Foundation
-- =============================================================
-- Scope: schema, constraints, indexes, updated_at triggers, and conservative
-- RLS baseline only. This migration does not seed production data, enable live
-- portal reads/writes, create storage buckets, call AI, publish, run jobs, or
-- activate AUTH_MODE="real".
-- =============================================================

create extension if not exists "pgcrypto";

-- Enums: only active Veroxa roles are client and team.
do $$ begin
  create type public.veroxa_role as enum ('client', 'team');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.veroxa_account_status as enum ('active', 'pending', 'disabled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.profile_field_status as enum ('please_review', 'pre_filled', 'confirmed', 'optional', 'veroxa_review');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.media_asset_status as enum ('uploaded', 'under_veroxa_review', 'ready_to_use', 'saved_for_later', 'better_version_helpful', 'used');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.message_status as enum ('unread', 'read', 'resolved');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.profile_correction_status as enum ('requested', 'under_veroxa_review', 'approved', 'rejected', 'needs_owner_input');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.ai_draft_status as enum ('drafted', 'ready_for_faraz_review', 'approved', 'rejected', 'held', 'needs_owner_input');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.approval_status as enum ('pending', 'approved', 'rejected', 'held', 'needs_owner_confirmation');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.report_status as enum ('draft', 'ready_for_faraz_review', 'approved', 'published_to_client');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.activity_visibility as enum ('internal_only', 'client_visible');
exception when duplicate_object then null; end $$;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text not null,
  role public.veroxa_role not null,
  display_name text,
  status public.veroxa_account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  timezone text,
  status public.veroxa_account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null,
  role public.veroxa_role not null,
  status public.veroxa_account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_members_unique_role unique (restaurant_id, user_id, role)
);

create table if not exists public.restaurant_profile_fields (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  section text not null,
  label text not null,
  value text,
  status public.profile_field_status not null default 'please_review',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  storage_path text,
  file_url text,
  file_type text,
  mime_type text,
  file_size integer,
  uploaded_by uuid,
  status public.media_asset_status not null default 'uploaded',
  ai_summary text,
  veroxa_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_file_size_nonnegative check (file_size is null or file_size >= 0)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  sender_user_id uuid,
  sender_role public.veroxa_role,
  body text not null,
  status public.message_status not null default 'unread',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_corrections (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  field_id uuid references public.restaurant_profile_fields(id) on delete set null,
  field_label text,
  current_value text,
  requested_value text,
  status public.profile_correction_status not null default 'requested',
  requested_by uuid,
  reviewed_by uuid,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  actor_type text not null,
  actor_user_id uuid,
  event_type text not null,
  title text not null,
  description text,
  related_entity_type text,
  related_entity_id uuid,
  visibility public.activity_visibility not null default 'internal_only',
  report_eligible boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_drafts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  draft_type text not null,
  source_entity_type text,
  source_entity_id uuid,
  draft_text text not null,
  status public.ai_draft_status not null default 'drafted',
  safety_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_drafts_safety_flags_array check (jsonb_typeof(safety_flags) = 'array')
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  status public.approval_status not null default 'pending',
  reviewed_by uuid,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  report_type text not null,
  period_start date,
  period_end date,
  status public.report_status not null default 'draft',
  summary text,
  body_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_body_json_object check (jsonb_typeof(body_json) = 'object')
);

-- Indexes
create index if not exists user_profiles_user_id_idx on public.user_profiles (user_id);
create index if not exists user_profiles_email_idx on public.user_profiles (email);
create index if not exists user_profiles_role_idx on public.user_profiles (role);
create index if not exists user_profiles_status_idx on public.user_profiles (status);
create index if not exists restaurants_status_idx on public.restaurants (status);
create index if not exists restaurants_name_idx on public.restaurants (name);
create index if not exists restaurant_members_restaurant_id_idx on public.restaurant_members (restaurant_id);
create index if not exists restaurant_members_user_id_idx on public.restaurant_members (user_id);
create index if not exists restaurant_members_role_idx on public.restaurant_members (role);
create index if not exists restaurant_members_status_idx on public.restaurant_members (status);
create index if not exists restaurant_profile_fields_restaurant_id_idx on public.restaurant_profile_fields (restaurant_id);
create index if not exists restaurant_profile_fields_section_idx on public.restaurant_profile_fields (section);
create index if not exists restaurant_profile_fields_status_idx on public.restaurant_profile_fields (status);
create index if not exists media_assets_restaurant_id_idx on public.media_assets (restaurant_id);
create index if not exists media_assets_status_idx on public.media_assets (status);
create index if not exists media_assets_uploaded_by_idx on public.media_assets (uploaded_by);
create index if not exists media_assets_created_at_idx on public.media_assets (created_at desc);
create index if not exists messages_restaurant_id_idx on public.messages (restaurant_id);
create index if not exists messages_sender_user_id_idx on public.messages (sender_user_id);
create index if not exists messages_sender_role_idx on public.messages (sender_role);
create index if not exists messages_status_idx on public.messages (status);
create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists profile_corrections_restaurant_id_idx on public.profile_corrections (restaurant_id);
create index if not exists profile_corrections_field_id_idx on public.profile_corrections (field_id);
create index if not exists profile_corrections_status_idx on public.profile_corrections (status);
create index if not exists profile_corrections_requested_by_idx on public.profile_corrections (requested_by);
create index if not exists profile_corrections_reviewed_by_idx on public.profile_corrections (reviewed_by);
create index if not exists activity_log_restaurant_id_idx on public.activity_log (restaurant_id);
create index if not exists activity_log_event_type_idx on public.activity_log (event_type);
create index if not exists activity_log_visibility_idx on public.activity_log (visibility);
create index if not exists activity_log_report_eligible_idx on public.activity_log (report_eligible);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);
create index if not exists ai_drafts_restaurant_id_idx on public.ai_drafts (restaurant_id);
create index if not exists ai_drafts_draft_type_idx on public.ai_drafts (draft_type);
create index if not exists ai_drafts_status_idx on public.ai_drafts (status);
create index if not exists ai_drafts_created_at_idx on public.ai_drafts (created_at desc);
create index if not exists approvals_restaurant_id_idx on public.approvals (restaurant_id);
create index if not exists approvals_item_idx on public.approvals (item_type, item_id);
create index if not exists approvals_status_idx on public.approvals (status);
create index if not exists approvals_reviewed_by_idx on public.approvals (reviewed_by);
create index if not exists reports_restaurant_id_idx on public.reports (restaurant_id);
create index if not exists reports_report_type_idx on public.reports (report_type);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_period_start_idx on public.reports (period_start);
create index if not exists reports_period_end_idx on public.reports (period_end);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['user_profiles','restaurants','restaurant_members','restaurant_profile_fields','media_assets','messages','profile_corrections','ai_drafts','approvals','reports'] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_set_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_name || '_set_updated_at', table_name);
  end loop;
end $$;

-- Security-definer helpers keep RLS policies scoped and avoid frontend service-role assumptions.
create or replace function public.current_user_is_active_team()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and role = 'team'::public.veroxa_role and status = 'active'::public.veroxa_account_status
  );
$$;

create or replace function public.current_user_has_active_restaurant(target_restaurant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.restaurant_members rm
    join public.user_profiles up on up.user_id = rm.user_id
    join public.restaurants r on r.id = rm.restaurant_id
    where rm.restaurant_id = target_restaurant_id
      and rm.user_id = auth.uid()
      and up.user_id = auth.uid()
      and up.role = 'client'::public.veroxa_role
      and rm.role = 'client'::public.veroxa_role
      and up.status = 'active'::public.veroxa_account_status
      and rm.status = 'active'::public.veroxa_account_status
      and r.status = 'active'::public.veroxa_account_status
  );
$$;

alter table public.user_profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.restaurant_profile_fields enable row level security;
alter table public.media_assets enable row level security;
alter table public.messages enable row level security;
alter table public.profile_corrections enable row level security;
alter table public.activity_log enable row level security;
alter table public.ai_drafts enable row level security;
alter table public.approvals enable row level security;
alter table public.reports enable row level security;

-- Read policies only. No anon policies and no write policies in PR #101; writes are deny-by-default.
create policy user_profiles_self_or_team_select on public.user_profiles for select to authenticated using (user_id = auth.uid() or public.current_user_is_active_team());
create policy restaurants_active_member_or_team_select on public.restaurants for select to authenticated using (public.current_user_is_active_team() or public.current_user_has_active_restaurant(id));
create policy restaurant_members_active_self_or_team_select on public.restaurant_members for select to authenticated using (public.current_user_is_active_team() or (user_id = auth.uid() and public.current_user_has_active_restaurant(restaurant_id)));
create policy restaurant_profile_fields_member_or_team_select on public.restaurant_profile_fields for select to authenticated using (public.current_user_is_active_team() or public.current_user_has_active_restaurant(restaurant_id));
create policy media_assets_member_or_team_select on public.media_assets for select to authenticated using (public.current_user_is_active_team() or public.current_user_has_active_restaurant(restaurant_id));
create policy messages_member_or_team_select on public.messages for select to authenticated using (public.current_user_is_active_team() or public.current_user_has_active_restaurant(restaurant_id));
create policy profile_corrections_member_or_team_select on public.profile_corrections for select to authenticated using (public.current_user_is_active_team() or public.current_user_has_active_restaurant(restaurant_id));
create policy activity_log_team_or_client_visible_select on public.activity_log for select to authenticated using (public.current_user_is_active_team() or (visibility = 'client_visible'::public.activity_visibility and public.current_user_has_active_restaurant(restaurant_id)));
create policy ai_drafts_team_only_select on public.ai_drafts for select to authenticated using (public.current_user_is_active_team());
create policy approvals_team_only_select on public.approvals for select to authenticated using (public.current_user_is_active_team());
create policy reports_team_or_published_client_select on public.reports for select to authenticated using (public.current_user_is_active_team() or (status = 'published_to_client'::public.report_status and public.current_user_has_active_restaurant(restaurant_id)));

comment on table public.ai_drafts is 'Future AI-prepared drafts only. Drafts never approve or publish themselves; no AI runtime is added by PR #101.';
comment on table public.approvals is 'Future Faraz/team approval decisions. Public/customer-visible execution remains future-gated.';
comment on table public.activity_log is 'Future activity/report backbone. Runtime event writing starts in a later PR, not PR #101.';
