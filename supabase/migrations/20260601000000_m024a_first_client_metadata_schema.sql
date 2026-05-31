-- =============================================================
-- M024A — First-client metadata schema migration
-- =============================================================
--
-- Purpose
--   Create the first real Supabase metadata tables for Veroxa:
--     - public.clients
--     - public.restaurant_upload_keys
--     - public.upload_submissions
--     - public.direction_requests
--     - public.team_review_decisions
--   plus the `set_updated_at()` trigger and conservative dev-stage
--   RLS policies.
--
-- Scope
--   Schema + RLS foundation ONLY.
--   This migration does NOT:
--     - create any storage bucket
--     - seed any real client / restaurant / upload-key data
--     - connect any frontend page to writes (writes still flow
--       through devSupabaseWriteAdapter, gated by
--       VITE_VEROXA_ENABLE_DEV_WRITES === "true")
--     - introduce any AI / publishing / ads / payments
--
-- Safety
--   - Plain-text upload keys MUST never be stored — only hashes.
--   - team_review_decisions.internal_note is internal only;
--     never surface raw to clients.
--   - Service-role key MUST never appear in frontend code.
--   - These RLS policies are dev-stage. Production RLS must be
--     tightened before launch (real auth, upload-key session
--     model, role separation).
-- =============================================================

-- TASK 2 — extension
create extension if not exists "pgcrypto";

-- =============================================================
-- TASK 3 — clients
-- =============================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  status text not null default 'active',
  service_plan text not null default 'essential',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_status_check
    check (status in ('active', 'paused', 'archived')),
  constraint clients_service_plan_check
    check (service_plan in (
      'essential',
      'growth',
      'premium'
    ))
);

create index if not exists clients_status_idx
  on public.clients (status);
create index if not exists clients_service_plan_idx
  on public.clients (service_plan);

comment on table public.clients is
  'Veroxa client (restaurant) registry. Display name only; no PII beyond display_name in this table.';
comment on column public.clients.service_plan is
  'Current public plan slug only: essential, growth, premium. Retired/internal compatibility aliases from older pricing models must be mapped before writing this column. Pricing is sourced from PRICING_SOURCE_OF_TRUTH.md, not this column.';

-- =============================================================
-- TASK 4 — restaurant_upload_keys
-- =============================================================
create table if not exists public.restaurant_upload_keys (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.clients(id) on delete cascade,
  key_hash text not null,
  key_label text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  rotated_at timestamptz,
  revoked_at timestamptz,
  constraint restaurant_upload_keys_status_check
    check (status in ('active', 'paused', 'revoked'))
);

create index if not exists restaurant_upload_keys_restaurant_id_idx
  on public.restaurant_upload_keys (restaurant_id);
create index if not exists restaurant_upload_keys_status_idx
  on public.restaurant_upload_keys (status);
create unique index if not exists restaurant_upload_keys_key_hash_idx
  on public.restaurant_upload_keys (key_hash);

comment on table public.restaurant_upload_keys is
  'Upload-key registry per restaurant. Plain-text keys MUST NEVER be stored — only hashes.';
comment on column public.restaurant_upload_keys.key_hash is
  'Hash of the upload key. Plain-text upload keys MUST NEVER be persisted. Hashing/verification lives in the upload-key service.';

-- =============================================================
-- TASK 5 — upload_submissions
-- =============================================================
create table if not exists public.upload_submissions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.clients(id) on delete cascade,
  upload_key_id uuid
    references public.restaurant_upload_keys(id) on delete set null,
  category text not null,
  priority text not null default 'use_anytime',
  note text,
  submitted_by_label text,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint upload_submissions_category_check
    check (category in (
      'food_photo',
      'kitchen_prep',
      'restaurant_atmosphere',
      'menu_special',
      'short_video',
      'other'
    )),
  constraint upload_submissions_priority_check
    check (priority in (
      'use_anytime',
      'use_next',
      'save_for_weekend',
      'google_post',
      'reel_tiktok_idea'
    )),
  constraint upload_submissions_status_check
    check (status in (
      'received',
      'in_review',
      'accepted',
      'needs_better_photo',
      'saved_for_later'
    ))
);

create index if not exists upload_submissions_restaurant_id_idx
  on public.upload_submissions (restaurant_id);
create index if not exists upload_submissions_status_idx
  on public.upload_submissions (status);
create index if not exists upload_submissions_created_at_idx
  on public.upload_submissions (created_at desc);
create index if not exists upload_submissions_restaurant_status_idx
  on public.upload_submissions (restaurant_id, status);

comment on table public.upload_submissions is
  'Metadata for restaurant upload submissions. Never store file blobs or raw filenames here. Storage upload is a separate later milestone.';
comment on column public.upload_submissions.note is
  'Sanitized client note (email / phone / @handle redacted, length-capped). See src/lib/data/writeMappers.ts.';

-- =============================================================
-- TASK 6 — direction_requests
-- =============================================================
create table if not exists public.direction_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.clients(id) on delete cascade,
  focus text not null,
  channel text not null default 'organic_social',
  urgency text not null default 'normal',
  title text not null,
  client_note text,
  preferred_timing_label text not null default 'This week',
  related_media_id uuid,
  avoid_item text,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint direction_requests_focus_check
    check (focus in (
      'lunch_traffic',
      'dinner_traffic',
      'catering',
      'family_platters',
      'new_item',
      'dessert',
      'slow_day',
      'weekend_push',
      'google_visibility',
      'event_or_holiday',
      'ads_goal',
      'avoid_item',
      'use_media_next',
      'other'
    )),
  constraint direction_requests_channel_check
    check (channel in ('organic_social', 'google', 'ads', 'all')),
  constraint direction_requests_urgency_check
    check (urgency in ('low', 'normal', 'high', 'urgent')),
  constraint direction_requests_status_check
    check (status in (
      'received',
      'interpreted',
      'in_team_review',
      'planned',
      'completed'
    ))
);

create index if not exists direction_requests_restaurant_id_idx
  on public.direction_requests (restaurant_id);
create index if not exists direction_requests_status_idx
  on public.direction_requests (status);
create index if not exists direction_requests_urgency_idx
  on public.direction_requests (urgency);
create index if not exists direction_requests_created_at_idx
  on public.direction_requests (created_at desc);

comment on table public.direction_requests is
  'Metadata for direction requests submitted by restaurant clients. Client Direction Center never gives direct publish / ad control.';
comment on column public.direction_requests.client_note is
  'Sanitized client note (email / phone / @handle redacted, length-capped). See src/lib/data/writeMappers.ts.';

-- =============================================================
-- TASK 7 — team_review_decisions
-- =============================================================
create table if not exists public.team_review_decisions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.clients(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  decision text not null,
  safe_client_status text,
  internal_note text,
  reviewed_by_user_id uuid,
  created_at timestamptz not null default now(),
  constraint team_review_decisions_target_type_check
    check (target_type in (
      'upload_submission',
      'direction_request',
      'content_workflow_item'
    )),
  constraint team_review_decisions_decision_check
    check (decision in (
      'accepted',
      'needs_better_photo',
      'saved_for_later',
      'interpreted',
      'sent_to_content_plan',
      'sent_to_google_action',
      'sent_to_ads_planning',
      'completed',
      'rejected'
    ))
);

create index if not exists team_review_decisions_restaurant_id_idx
  on public.team_review_decisions (restaurant_id);
create index if not exists team_review_decisions_target_idx
  on public.team_review_decisions (target_type, target_id);
create index if not exists team_review_decisions_created_at_idx
  on public.team_review_decisions (created_at desc);

comment on table public.team_review_decisions is
  'Internal team review decisions for uploads, direction requests, and content workflow items.';
comment on column public.team_review_decisions.internal_note is
  'Internal-only note. Never surface raw to clients. Safe-client-facing status lives in safe_client_status.';

-- =============================================================
-- TASK 8 — updated_at trigger
-- =============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists upload_submissions_set_updated_at on public.upload_submissions;
create trigger upload_submissions_set_updated_at
  before update on public.upload_submissions
  for each row execute function public.set_updated_at();

drop trigger if exists direction_requests_set_updated_at on public.direction_requests;
create trigger direction_requests_set_updated_at
  before update on public.direction_requests
  for each row execute function public.set_updated_at();

-- =============================================================
-- TASK 9 — Enable RLS
-- =============================================================
alter table public.clients                  enable row level security;
alter table public.restaurant_upload_keys   enable row level security;
alter table public.upload_submissions       enable row level security;
alter table public.direction_requests       enable row level security;
alter table public.team_review_decisions    enable row level security;

-- =============================================================
-- TASK 10 — Conservative dev-stage RLS policies
-- =============================================================
-- NOTE:
--   AUTH_MODE is still "placeholder". These policies grant the
--   `authenticated` role read/write access to metadata so that the
--   dev write adapter (gated by VITE_VEROXA_ENABLE_DEV_WRITES)
--   can be exercised against a dev Supabase project.
--
--   Restaurant-upload-key scoped RLS requires a future upload-key
--   session model (custom JWT / signed claims) and is NOT
--   production-ready in this migration.
--
--   Production RLS MUST be tightened before launch:
--     - per-restaurant row scoping
--     - team / owner / operator role separation
--     - internal_note visibility restricted to team+
--     - upload_key_id session binding
--
--   No `anon` write policy is created. No public wide-open access.

-- clients: authenticated read-only at this stage.
drop policy if exists clients_dev_authenticated_select on public.clients;
create policy clients_dev_authenticated_select
  on public.clients
  for select
  to authenticated
  using (true);

-- restaurant_upload_keys: authenticated metadata read only.
-- key_hash is still in the row; do not expand to other roles.
drop policy if exists restaurant_upload_keys_dev_authenticated_select on public.restaurant_upload_keys;
create policy restaurant_upload_keys_dev_authenticated_select
  on public.restaurant_upload_keys
  for select
  to authenticated
  using (true);

-- upload_submissions: authenticated select / insert / update.
drop policy if exists upload_submissions_dev_authenticated_select on public.upload_submissions;
create policy upload_submissions_dev_authenticated_select
  on public.upload_submissions
  for select to authenticated using (true);

drop policy if exists upload_submissions_dev_authenticated_insert on public.upload_submissions;
create policy upload_submissions_dev_authenticated_insert
  on public.upload_submissions
  for insert to authenticated with check (true);

drop policy if exists upload_submissions_dev_authenticated_update on public.upload_submissions;
create policy upload_submissions_dev_authenticated_update
  on public.upload_submissions
  for update to authenticated using (true) with check (true);

-- direction_requests: authenticated select / insert / update.
drop policy if exists direction_requests_dev_authenticated_select on public.direction_requests;
create policy direction_requests_dev_authenticated_select
  on public.direction_requests
  for select to authenticated using (true);

drop policy if exists direction_requests_dev_authenticated_insert on public.direction_requests;
create policy direction_requests_dev_authenticated_insert
  on public.direction_requests
  for insert to authenticated with check (true);

drop policy if exists direction_requests_dev_authenticated_update on public.direction_requests;
create policy direction_requests_dev_authenticated_update
  on public.direction_requests
  for update to authenticated using (true) with check (true);

-- team_review_decisions: authenticated select / insert (immutable append-only at this stage).
drop policy if exists team_review_decisions_dev_authenticated_select on public.team_review_decisions;
create policy team_review_decisions_dev_authenticated_select
  on public.team_review_decisions
  for select to authenticated using (true);

drop policy if exists team_review_decisions_dev_authenticated_insert on public.team_review_decisions;
create policy team_review_decisions_dev_authenticated_insert
  on public.team_review_decisions
  for insert to authenticated with check (true);

-- =============================================================
-- End of M024A migration
-- =============================================================
