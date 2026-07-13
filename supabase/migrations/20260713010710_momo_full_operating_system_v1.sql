-- Momo Full Operating System V1
-- Production schema for the single enabled Momo's House San Antonio tenant.
-- This migration stores workflow metadata only. Provider credentials, access
-- tokens, refresh tokens, API secrets, and raw provider responses do not
-- belong in the exposed public schema.

do $$ begin
  create type public.veroxa_truth_status_v1 as enum (
    'unverified', 'team_prefilled', 'needs_owner_confirmation',
    'owner_confirmed', 'rejected', 'superseded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.veroxa_readiness_status_v1 as enum (
    'not_started', 'foundation_ready', 'in_progress', 'blocked',
    'ready_for_review', 'verified'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.veroxa_review_status_v1 as enum (
    'pending', 'in_review', 'approved', 'changes_requested', 'rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.veroxa_job_status_v1 as enum (
    'queued', 'in_progress', 'waiting_approval', 'blocked', 'retrying',
    'completed', 'failed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.veroxa_connection_status_v1 as enum (
    'not_connected', 'awaiting_owner_access', 'connected', 'degraded', 'revoked'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.veroxa_publish_status_v1 as enum (
    'draft', 'awaiting_approval', 'approved', 'queued', 'publishing',
    'published', 'retrying', 'failed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------------------
-- Restaurant truth, onboarding, contacts, presence, and readiness
-- -------------------------------------------------------------------------

create table public.veroxa_restaurant_truth_fields (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  field_key text not null check (
    field_key in (
      'identity.display_name', 'identity.legal_name', 'identity.cuisine',
      'address.primary', 'phone.primary', 'hours.regular', 'hours.special',
      'menu.primary', 'services.active', 'services.delivery', 'services.catering',
      'claims.dietary', 'claims.halal', 'brand.voice', 'brand.positioning',
      'goals.primary', 'goals.audience', 'goals.customer_action'
    )
  ),
  section text not null check (
    section in ('identity','address','phone','hours','menu','services','claims','brand','goals')
  ),
  value_json jsonb not null default '{}'::jsonb,
  status public.veroxa_truth_status_v1 not null default 'unverified',
  source text not null default 'team' check (source in ('team','owner','public_evidence','import')),
  is_current boolean not null default true,
  owner_confirmed_by uuid references public.veroxa_user_profiles(user_id),
  owner_confirmed_at timestamptz,
  supersedes_id uuid references public.veroxa_restaurant_truth_fields(id),
  created_by uuid references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_truth_confirmation_pair check (
    (status = 'owner_confirmed' and owner_confirmed_by is not null and owner_confirmed_at is not null)
    or status <> 'owner_confirmed'
  )
);
create unique index veroxa_truth_fields_current_unique
  on public.veroxa_restaurant_truth_fields (restaurant_id, field_key)
  where is_current;
create index veroxa_truth_fields_status_idx
  on public.veroxa_restaurant_truth_fields (restaurant_id, status);

create table public.veroxa_restaurant_contacts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  contact_kind text not null check (contact_kind in ('owner','primary','manager','secondary')),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  email text check (email is null or email = lower(btrim(email))),
  phone text check (
    phone is null or char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15
  ),
  is_primary boolean not null default false,
  status public.veroxa_truth_status_v1 not null default 'needs_owner_confirmation',
  owner_confirmed_by uuid references public.veroxa_user_profiles(user_id),
  owner_confirmed_at timestamptz,
  notes text,
  created_by uuid references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_contact_channel_required check (email is not null or phone is not null),
  constraint veroxa_contact_confirmation_pair check (
    (status = 'owner_confirmed' and owner_confirmed_by is not null and owner_confirmed_at is not null)
    or status <> 'owner_confirmed'
  )
);
create unique index veroxa_restaurant_contacts_one_primary
  on public.veroxa_restaurant_contacts (restaurant_id) where is_primary;

create table public.veroxa_onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  step_key text not null check (
    step_key in (
      'welcome','restaurant_profile','contacts','business_identity','brand_voice',
      'media_intake','presence_stack','online_ordering','access_permissions',
      'client_training','final_confirmation'
    )
  ),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  position smallint not null check (position between 1 and 100),
  status public.veroxa_readiness_status_v1 not null default 'not_started',
  completion_evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(completion_evidence) = 'array'),
  blocker_reason text,
  completed_by uuid references public.veroxa_user_profiles(user_id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, step_key),
  unique (restaurant_id, position),
  constraint veroxa_onboarding_completed_pair check (
    (status = 'verified' and completed_by is not null and completed_at is not null)
    or status <> 'verified'
  )
);

create table public.veroxa_presence_profiles (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  provider text not null check (
    provider in ('website','google_business','facebook','instagram','doordash','uber_eats','grubhub')
  ),
  public_url text check (public_url is null or public_url ~ '^https://'),
  access_status public.veroxa_connection_status_v1 not null default 'not_connected',
  truth_status public.veroxa_truth_status_v1 not null default 'unverified',
  external_account_label text,
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, provider)
);

create table public.veroxa_confirmations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  subject_type text not null check (
    subject_type in ('truth_field','contact','onboarding_step','presence_profile','media_rights','content_item')
  ),
  subject_id uuid not null,
  confirmation_kind text not null check (
    confirmation_kind in ('business_truth','contact','onboarding','presence','usage_rights','content_direction')
  ),
  decision text not null check (decision in ('confirm','correct','reject','needs_help')),
  proposed_value jsonb,
  notes text,
  status public.veroxa_review_status_v1 not null default 'pending',
  submitted_by uuid not null references public.veroxa_user_profiles(user_id),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.veroxa_user_profiles(user_id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_confirmation_review_pair check (
    (status in ('approved','changes_requested','rejected') and reviewed_by is not null and reviewed_at is not null)
    or status in ('pending','in_review')
  )
);
create index veroxa_confirmations_queue_idx
  on public.veroxa_confirmations (restaurant_id, status, submitted_at);
create unique index veroxa_confirmations_one_active_unique
  on public.veroxa_confirmations (restaurant_id, subject_type, subject_id, submitted_by)
  where status in ('pending','in_review');

create table public.veroxa_readiness_dimensions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  dimension_key text not null check (
    dimension_key in (
      'production_foundation','team_identity_and_access','business_truth_and_onboarding',
      'media_and_rights','ai_and_automation','meta_social','google_seo_and_reviews',
      'website_menu_and_ordering','operations_reporting_and_monitoring',
      'activation_and_recovery'
    )
  ),
  label text not null,
  required boolean not null default true,
  status public.veroxa_readiness_status_v1 not null default 'not_started',
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  blockers jsonb not null default '[]'::jsonb check (jsonb_typeof(blockers) = 'array'),
  verified_by uuid references public.veroxa_user_profiles(user_id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, dimension_key),
  constraint veroxa_readiness_verified_pair check (
    (status = 'verified' and verified_by is not null and verified_at is not null
      and jsonb_array_length(evidence) > 0 and jsonb_array_length(blockers) = 0)
    or status <> 'verified'
  ),
  constraint veroxa_readiness_blocked_has_reason check (
    (status = 'blocked' and jsonb_array_length(blockers) > 0) or status <> 'blocked'
  )
);

create table public.veroxa_readiness_gate_runs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  status public.veroxa_readiness_status_v1 not null,
  required_count integer not null check (required_count >= 0),
  verified_count integer not null check (verified_count >= 0 and verified_count <= required_count),
  blocker_count integer not null check (blocker_count >= 0),
  evidence_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_snapshot) = 'array'),
  blocker_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(blocker_snapshot) = 'array'),
  evaluated_by uuid not null references public.veroxa_user_profiles(user_id),
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint veroxa_gate_verified_counts check (
    (status = 'verified' and required_count > 0 and verified_count = required_count and blocker_count = 0)
    or status <> 'verified'
  )
);
create index veroxa_readiness_gate_latest_idx
  on public.veroxa_readiness_gate_runs (restaurant_id, evaluated_at desc);

-- -------------------------------------------------------------------------
-- Media rights, review, tags, reuse, and provider-neutral AI jobs
-- -------------------------------------------------------------------------

alter table public.veroxa_media_assets
  add column if not exists original_file_name text,
  add column if not exists captured_at timestamptz,
  add column if not exists intake_notes text,
  add column if not exists content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$'),
  add column if not exists width integer check (width is null or width > 0),
  add column if not exists height integer check (height is null or height > 0),
  add column if not exists duration_seconds numeric(10,3) check (duration_seconds is null or duration_seconds >= 0),
  add column if not exists reuse_count integer not null default 0 check (reuse_count >= 0),
  add column if not exists last_used_at timestamptz;
alter table public.veroxa_media_assets
  add constraint veroxa_media_original_name_length
    check (original_file_name is null or char_length(original_file_name) <= 255),
  add constraint veroxa_media_intake_notes_length
    check (intake_notes is null or char_length(intake_notes) <= 2000);
create unique index if not exists veroxa_media_assets_hash_unique
  on public.veroxa_media_assets (restaurant_id, content_sha256)
  where content_sha256 is not null;

create table public.veroxa_media_rights (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  asset_id uuid not null unique references public.veroxa_media_assets(id) on delete cascade,
  rights_status text not null default 'pending' check (
    rights_status in ('pending','confirmed','restricted','expired','revoked')
  ),
  usage_scope jsonb not null default '[]'::jsonb check (
    jsonb_typeof(usage_scope) = 'array'
    and usage_scope <@ '["facebook","instagram","google_business","website","internal"]'::jsonb
  ),
  valid_from timestamptz,
  expires_at timestamptz,
  confirmed_by uuid references public.veroxa_user_profiles(user_id),
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_media_rights_confirmation_pair check (
    (rights_status = 'confirmed' and confirmed_by is not null and confirmed_at is not null)
    or rights_status <> 'confirmed'
  ),
  constraint veroxa_media_rights_dates check (
    expires_at is null or valid_from is null or expires_at > valid_from
  )
);

create table public.veroxa_media_reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  asset_id uuid not null references public.veroxa_media_assets(id) on delete cascade,
  status public.veroxa_review_status_v1 not null default 'pending',
  quality_score smallint check (quality_score is null or quality_score between 0 and 100),
  quality_notes text,
  public_use_approved boolean not null default false,
  is_current boolean not null default true,
  reviewed_by uuid references public.veroxa_user_profiles(user_id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_media_review_pair check (
    (status in ('approved','changes_requested','rejected') and reviewed_by is not null and reviewed_at is not null)
    or status in ('pending','in_review')
  )
);
create unique index veroxa_media_reviews_current_unique
  on public.veroxa_media_reviews (asset_id) where is_current;

create table public.veroxa_media_tags (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  label text not null check (char_length(btrim(label)) between 1 and 80),
  source text not null check (source in ('team','ai','owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create table public.veroxa_media_asset_tags (
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  asset_id uuid not null references public.veroxa_media_assets(id) on delete cascade,
  tag_id uuid not null references public.veroxa_media_tags(id) on delete cascade,
  source text not null check (source in ('team','ai','owner')),
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now(),
  primary key (asset_id, tag_id)
);

create table public.veroxa_ai_jobs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  job_kind text not null check (
    job_kind in ('media_classification','media_quality','duplicate_detection','content_strategy','caption','platform_variants','report_summary')
  ),
  subject_type text not null check (
    subject_type in ('media_asset','content_strategy','content_item','report','restaurant')
  ),
  subject_id uuid not null,
  status public.veroxa_job_status_v1 not null default 'queued',
  provider_key text,
  model_key text,
  prompt_version text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  safety_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(safety_flags) = 'array'),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  next_attempt_at timestamptz,
  last_error text,
  created_by uuid references public.veroxa_user_profiles(user_id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_ai_job_attempt_limit check (attempt_count <= max_attempts)
);
create index veroxa_ai_jobs_queue_idx
  on public.veroxa_ai_jobs (restaurant_id, status, next_attempt_at, created_at);

-- -------------------------------------------------------------------------
-- Content strategy, drafts, platform variants, approvals, and calendar
-- -------------------------------------------------------------------------

create table public.veroxa_content_strategies (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  status public.veroxa_review_status_v1 not null default 'pending',
  goals jsonb not null default '[]'::jsonb check (jsonb_typeof(goals) = 'array'),
  pillars jsonb not null default '[]'::jsonb check (jsonb_typeof(pillars) = 'array'),
  brand_voice_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  approved_by uuid references public.veroxa_user_profiles(user_id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_strategy_approval_pair check (
    (status = 'approved' and approved_by is not null and approved_at is not null)
    or status <> 'approved'
  )
);

create table public.veroxa_content_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  strategy_id uuid references public.veroxa_content_strategies(id) on delete set null,
  primary_media_asset_id uuid references public.veroxa_media_assets(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  concept text not null,
  master_caption text,
  status public.veroxa_review_status_v1 not null default 'pending',
  requires_owner_confirmation boolean not null default false,
  owner_confirmation_id uuid references public.veroxa_confirmations(id) on delete restrict,
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  approved_by uuid references public.veroxa_user_profiles(user_id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_content_item_approval_pair check (
    (status = 'approved' and approved_by is not null and approved_at is not null)
    or status <> 'approved'
  )
);

create table public.veroxa_content_variants (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  content_item_id uuid not null references public.veroxa_content_items(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','google_business')),
  caption text not null,
  metadata jsonb not null default '{}'::jsonb,
  status public.veroxa_review_status_v1 not null default 'pending',
  approved_by uuid references public.veroxa_user_profiles(user_id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_item_id, platform),
  constraint veroxa_variant_approval_pair check (
    (status = 'approved' and approved_by is not null and approved_at is not null)
    or status <> 'approved'
  )
);

create table public.veroxa_approvals (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  subject_type text not null check (
    subject_type in ('content_strategy','content_item','content_variant','publish','review_response','report','presence_action')
  ),
  subject_id uuid not null,
  approval_kind text not null check (
    approval_kind in ('team_review','owner_confirmation','publishing','reputation_sensitive','report_release')
  ),
  status public.veroxa_review_status_v1 not null default 'pending',
  requested_by uuid not null references public.veroxa_user_profiles(user_id),
  requested_at timestamptz not null default now(),
  decided_by uuid references public.veroxa_user_profiles(user_id),
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_approval_decision_pair check (
    (status in ('approved','changes_requested','rejected') and decided_by is not null and decided_at is not null)
    or status in ('pending','in_review')
  )
);
create index veroxa_approvals_queue_idx
  on public.veroxa_approvals (restaurant_id, status, requested_at);
create unique index veroxa_approvals_one_active_unique
  on public.veroxa_approvals (restaurant_id, subject_type, subject_id, approval_kind)
  where status in ('pending','in_review');

create table public.veroxa_content_calendar (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  variant_id uuid not null references public.veroxa_content_variants(id) on delete cascade,
  status public.veroxa_publish_status_v1 not null default 'draft',
  scheduled_for timestamptz,
  timezone text not null default 'America/Chicago',
  published_at timestamptz,
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id),
  constraint veroxa_calendar_published_pair check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

-- Added after content_items exists to keep media usage linked to reviewed work.
create table public.veroxa_media_usage (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  asset_id uuid not null references public.veroxa_media_assets(id) on delete restrict,
  content_item_id uuid references public.veroxa_content_items(id) on delete set null,
  platform text check (platform is null or platform in ('facebook','instagram','google_business','website','internal')),
  usage_kind text not null check (usage_kind in ('draft','scheduled','published','report','internal_reference')),
  used_at timestamptz not null default now(),
  external_reference text,
  recorded_by uuid references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now()
);
create index veroxa_media_usage_asset_idx
  on public.veroxa_media_usage (asset_id, used_at desc);

-- -------------------------------------------------------------------------
-- Provider connections and approval-controlled publishing
-- -------------------------------------------------------------------------

create table public.veroxa_provider_connections (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  provider text not null check (provider in ('meta','google_business')),
  external_account_id text,
  display_label text,
  status public.veroxa_connection_status_v1 not null default 'not_connected',
  capabilities jsonb not null default '[]'::jsonb check (jsonb_typeof(capabilities) = 'array'),
  scopes jsonb not null default '[]'::jsonb check (jsonb_typeof(scopes) = 'array'),
  owner_authorized_by uuid references public.veroxa_user_profiles(user_id),
  owner_authorized_at timestamptz,
  last_verified_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, provider),
  constraint veroxa_connection_owner_authorization_pair check (
    (status in ('connected','degraded') and owner_authorized_by is not null
      and owner_authorized_at is not null and last_verified_at is not null
      and jsonb_array_length(capabilities) > 0)
    or status in ('not_connected','awaiting_owner_access','revoked')
  )
);
comment on table public.veroxa_provider_connections is
  'Connection state only. Provider credentials and tokens must remain outside the exposed public schema.';

create table public.veroxa_publish_queue (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  connection_id uuid not null references public.veroxa_provider_connections(id) on delete restrict,
  variant_id uuid not null references public.veroxa_content_variants(id) on delete restrict,
  approval_id uuid not null references public.veroxa_approvals(id) on delete restrict,
  status public.veroxa_publish_status_v1 not null default 'draft',
  scheduled_for timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  next_attempt_at timestamptz,
  idempotency_key uuid not null default gen_random_uuid(),
  external_post_id text,
  last_error text,
  published_at timestamptz,
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, idempotency_key),
  constraint veroxa_publish_attempt_limit check (attempt_count <= max_attempts),
  constraint veroxa_publish_published_pair check (
    (status = 'published' and external_post_id is not null and published_at is not null)
    or status <> 'published'
  )
);
create index veroxa_publish_queue_work_idx
  on public.veroxa_publish_queue (restaurant_id, status, next_attempt_at, scheduled_for);

create table public.veroxa_publish_attempts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  publish_queue_id uuid not null references public.veroxa_publish_queue(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status public.veroxa_job_status_v1 not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_category text,
  error_message text,
  external_post_id text,
  response_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (publish_queue_id, attempt_number)
);

-- -------------------------------------------------------------------------
-- Google/SEO/reviews, website/menu/order checks, and visibility evidence
-- -------------------------------------------------------------------------

create table public.veroxa_local_presence_checks (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  presence_profile_id uuid references public.veroxa_presence_profiles(id) on delete set null,
  check_type text not null check (
    check_type in ('google_profile','local_seo','website','menu','ordering','contact_path','review_visibility')
  ),
  status public.veroxa_job_status_v1 not null default 'queued',
  observed_at timestamptz,
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  findings jsonb not null default '[]'::jsonb check (jsonb_typeof(findings) = 'array'),
  recommended_actions jsonb not null default '[]'::jsonb check (jsonb_typeof(recommended_actions) = 'array'),
  checked_by uuid references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index veroxa_local_presence_checks_latest_idx
  on public.veroxa_local_presence_checks (restaurant_id, check_type, observed_at desc);

create table public.veroxa_review_records (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  provider text not null check (provider = 'google_business'),
  external_review_id text not null,
  rating numeric(2,1) check (rating is null or rating between 1 and 5),
  review_observed_at timestamptz not null,
  review_excerpt text,
  response_status public.veroxa_review_status_v1 not null default 'pending',
  response_draft text,
  approval_id uuid references public.veroxa_approvals(id) on delete set null,
  response_published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, provider, external_review_id)
);

create table public.veroxa_visibility_snapshots (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  source text not null check (source in ('google_business','google_search','website','manual_baseline')),
  period_start date not null,
  period_end date not null,
  metrics jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint veroxa_visibility_period check (period_end >= period_start),
  unique (restaurant_id, source, period_start, period_end)
);

-- -------------------------------------------------------------------------
-- Work orchestration, attempts, activity, reports, monitors, and recovery
-- -------------------------------------------------------------------------

create table public.veroxa_work_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  work_type text not null check (
    work_type in ('onboarding','truth_review','media','content','publishing','google','seo','reviews','website','reporting','monitoring','recovery')
  ),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text,
  priority smallint not null default 3 check (priority between 1 and 5),
  status public.veroxa_job_status_v1 not null default 'queued',
  subject_type text,
  subject_id uuid,
  due_at timestamptz,
  assigned_to uuid references public.veroxa_user_profiles(user_id),
  blocked_reason text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  next_attempt_at timestamptz,
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_work_attempt_limit check (attempt_count <= max_attempts),
  constraint veroxa_work_blocked_reason check (
    (status = 'blocked' and blocked_reason is not null) or status <> 'blocked'
  )
);
create index veroxa_work_queue_idx
  on public.veroxa_work_items (restaurant_id, status, priority, due_at);

create table public.veroxa_job_attempts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  work_item_id uuid references public.veroxa_work_items(id) on delete cascade,
  ai_job_id uuid references public.veroxa_ai_jobs(id) on delete cascade,
  publish_queue_id uuid references public.veroxa_publish_queue(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status public.veroxa_job_status_v1 not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_category text,
  error_message text,
  created_at timestamptz not null default now(),
  constraint veroxa_job_attempt_one_parent check (
    num_nonnulls(work_item_id, ai_job_id, publish_queue_id) = 1
  )
);
create unique index veroxa_job_attempts_work_unique
  on public.veroxa_job_attempts (work_item_id, attempt_number) where work_item_id is not null;
create unique index veroxa_job_attempts_ai_unique
  on public.veroxa_job_attempts (ai_job_id, attempt_number) where ai_job_id is not null;
create unique index veroxa_job_attempts_publish_unique
  on public.veroxa_job_attempts (publish_queue_id, attempt_number) where publish_queue_id is not null;

create table public.veroxa_activity_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  event_type text not null,
  subject_type text,
  subject_id uuid,
  actor_id uuid references public.veroxa_user_profiles(user_id),
  visibility text not null default 'team' check (visibility in ('team','client','both','system')),
  report_eligible boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index veroxa_activity_report_idx
  on public.veroxa_activity_events (restaurant_id, report_eligible, occurred_at desc);

create table public.veroxa_reports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  report_type text not null check (report_type in ('weekly','monthly')),
  period_start date not null,
  period_end date not null,
  status public.veroxa_review_status_v1 not null default 'pending',
  summary jsonb not null default '{}'::jsonb,
  evidence_event_ids uuid[] not null default '{}'::uuid[],
  approved_by uuid references public.veroxa_user_profiles(user_id),
  approved_at timestamptz,
  published_at timestamptz,
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_report_period check (period_end >= period_start),
  constraint veroxa_report_approval_pair check (
    (status = 'approved' and approved_by is not null and approved_at is not null and cardinality(evidence_event_ids) > 0)
    or status <> 'approved'
  ),
  unique (restaurant_id, report_type, period_start, period_end)
);

create table public.veroxa_monitor_checks (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  check_key text not null,
  status text not null check (status in ('unknown','healthy','warning','critical')),
  details jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  next_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index veroxa_monitor_checks_latest_idx
  on public.veroxa_monitor_checks (restaurant_id, check_key, checked_at desc);

create table public.veroxa_alerts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  monitor_check_id uuid references public.veroxa_monitor_checks(id) on delete set null,
  severity text not null check (severity in ('info','warning','critical')),
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  title text not null,
  message text not null,
  opened_at timestamptz not null default now(),
  acknowledged_by uuid references public.veroxa_user_profiles(user_id),
  acknowledged_at timestamptz,
  resolved_by uuid references public.veroxa_user_profiles(user_id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_alert_ack_pair check (
    (status = 'acknowledged' and acknowledged_by is not null and acknowledged_at is not null)
    or status <> 'acknowledged'
  ),
  constraint veroxa_alert_resolve_pair check (
    (status = 'resolved' and resolved_by is not null and resolved_at is not null)
    or status <> 'resolved'
  )
);

create table public.veroxa_recovery_runs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  subject_type text not null check (subject_type in ('provider_connection','publish','ai_job','work_item','monitor')),
  subject_id uuid not null,
  action_key text not null,
  status public.veroxa_job_status_v1 not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  next_attempt_at timestamptz,
  last_error text,
  initiated_by uuid references public.veroxa_user_profiles(user_id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_recovery_attempt_limit check (attempt_count <= max_attempts)
);
create index veroxa_recovery_queue_idx
  on public.veroxa_recovery_runs (restaurant_id, status, next_attempt_at);

-- Foreign-key indexes keep tenant deletes, queue joins, and actor lookups from
-- degrading as the Momo operating history grows. Existing composite/unique
-- indexes cover the remaining restaurant and parent keys.
create index veroxa_truth_owner_idx on public.veroxa_restaurant_truth_fields (owner_confirmed_by);
create index veroxa_truth_supersedes_idx on public.veroxa_restaurant_truth_fields (supersedes_id);
create index veroxa_truth_creator_idx on public.veroxa_restaurant_truth_fields (created_by);
create index veroxa_contacts_restaurant_idx on public.veroxa_restaurant_contacts (restaurant_id);
create index veroxa_contacts_owner_idx on public.veroxa_restaurant_contacts (owner_confirmed_by);
create index veroxa_contacts_creator_idx on public.veroxa_restaurant_contacts (created_by);
create index veroxa_onboarding_completed_idx on public.veroxa_onboarding_steps (completed_by);
create index veroxa_confirmations_submitter_idx on public.veroxa_confirmations (submitted_by);
create index veroxa_confirmations_reviewer_idx on public.veroxa_confirmations (reviewed_by);
create index veroxa_readiness_verifier_idx on public.veroxa_readiness_dimensions (verified_by);
create index veroxa_gate_evaluator_idx on public.veroxa_readiness_gate_runs (evaluated_by);
create index veroxa_media_assets_uploader_idx on public.veroxa_media_assets (uploaded_by);
create index veroxa_media_rights_restaurant_idx on public.veroxa_media_rights (restaurant_id);
create index veroxa_media_rights_confirmer_idx on public.veroxa_media_rights (confirmed_by);
create index veroxa_media_reviews_restaurant_idx on public.veroxa_media_reviews (restaurant_id);
create index veroxa_media_reviews_asset_idx on public.veroxa_media_reviews (asset_id);
create index veroxa_media_reviews_reviewer_idx on public.veroxa_media_reviews (reviewed_by);
create index veroxa_media_asset_tags_restaurant_idx on public.veroxa_media_asset_tags (restaurant_id);
create index veroxa_media_asset_tags_tag_idx on public.veroxa_media_asset_tags (tag_id);
create index veroxa_ai_jobs_creator_idx on public.veroxa_ai_jobs (created_by);
create index veroxa_strategy_restaurant_idx on public.veroxa_content_strategies (restaurant_id, status);
create index veroxa_strategy_creator_idx on public.veroxa_content_strategies (created_by);
create index veroxa_strategy_approver_idx on public.veroxa_content_strategies (approved_by);
create index veroxa_content_items_restaurant_idx on public.veroxa_content_items (restaurant_id, status);
create index veroxa_content_items_strategy_idx on public.veroxa_content_items (strategy_id);
create index veroxa_content_items_media_idx on public.veroxa_content_items (primary_media_asset_id);
create index veroxa_content_items_owner_confirmation_idx on public.veroxa_content_items (owner_confirmation_id);
create index veroxa_content_items_creator_idx on public.veroxa_content_items (created_by);
create index veroxa_content_items_approver_idx on public.veroxa_content_items (approved_by);
create index veroxa_variants_restaurant_idx on public.veroxa_content_variants (restaurant_id, status);
create index veroxa_variants_approver_idx on public.veroxa_content_variants (approved_by);
create index veroxa_approvals_requester_idx on public.veroxa_approvals (requested_by);
create index veroxa_approvals_decider_idx on public.veroxa_approvals (decided_by);
create index veroxa_calendar_restaurant_idx on public.veroxa_content_calendar (restaurant_id, status, scheduled_for);
create index veroxa_calendar_creator_idx on public.veroxa_content_calendar (created_by);
create index veroxa_media_usage_restaurant_idx on public.veroxa_media_usage (restaurant_id, used_at desc);
create index veroxa_media_usage_content_idx on public.veroxa_media_usage (content_item_id);
create index veroxa_media_usage_recorder_idx on public.veroxa_media_usage (recorded_by);
create index veroxa_connections_authorizer_idx on public.veroxa_provider_connections (owner_authorized_by);
create index veroxa_publish_connection_idx on public.veroxa_publish_queue (connection_id);
create index veroxa_publish_variant_idx on public.veroxa_publish_queue (variant_id);
create index veroxa_publish_approval_idx on public.veroxa_publish_queue (approval_id);
create index veroxa_publish_creator_idx on public.veroxa_publish_queue (created_by);
create index veroxa_publish_attempts_restaurant_idx on public.veroxa_publish_attempts (restaurant_id);
create index veroxa_presence_checks_profile_idx on public.veroxa_local_presence_checks (presence_profile_id);
create index veroxa_presence_checks_actor_idx on public.veroxa_local_presence_checks (checked_by);
create index veroxa_review_approval_idx on public.veroxa_review_records (approval_id);
create index veroxa_work_assignee_idx on public.veroxa_work_items (assigned_to);
create index veroxa_work_creator_idx on public.veroxa_work_items (created_by);
create index veroxa_job_attempts_restaurant_idx on public.veroxa_job_attempts (restaurant_id);
create index veroxa_activity_actor_idx on public.veroxa_activity_events (actor_id);
create index veroxa_reports_approver_idx on public.veroxa_reports (approved_by);
create index veroxa_reports_creator_idx on public.veroxa_reports (created_by);
create index veroxa_alerts_restaurant_idx on public.veroxa_alerts (restaurant_id, status, opened_at);
create index veroxa_alerts_monitor_idx on public.veroxa_alerts (monitor_check_id);
create index veroxa_alerts_ack_actor_idx on public.veroxa_alerts (acknowledged_by);
create index veroxa_alerts_resolve_actor_idx on public.veroxa_alerts (resolved_by);
create index veroxa_recovery_initiator_idx on public.veroxa_recovery_runs (initiated_by);

-- -------------------------------------------------------------------------
-- Invariants, lifecycle gates, RLS, client-safe reads, and readiness RPC
-- -------------------------------------------------------------------------

create or replace function veroxa_private.enforce_momo_operational_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from veroxa_private.operational_restaurant_scope scope
    where scope.scope_key = 'momo_house_san_antonio'
      and scope.enabled
      and scope.restaurant_id = new.restaurant_id
  ) then
    raise exception using errcode = '23514', message = 'momo_operational_scope_required';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.enforce_momo_operational_row() from public, anon, authenticated;

-- Every operational row, including children with foreign keys, is pinned to
-- the same singleton restaurant. This also prevents service-role code from
-- accidentally creating a second operational tenant.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'veroxa_restaurant_truth_fields','veroxa_restaurant_contacts','veroxa_onboarding_steps',
    'veroxa_presence_profiles','veroxa_confirmations','veroxa_readiness_dimensions',
    'veroxa_readiness_gate_runs','veroxa_media_assets','veroxa_media_rights',
    'veroxa_media_reviews','veroxa_media_tags','veroxa_media_asset_tags','veroxa_ai_jobs',
    'veroxa_content_strategies','veroxa_content_items','veroxa_content_variants',
    'veroxa_approvals','veroxa_content_calendar','veroxa_media_usage',
    'veroxa_provider_connections','veroxa_publish_queue','veroxa_publish_attempts',
    'veroxa_local_presence_checks','veroxa_review_records','veroxa_visibility_snapshots',
    'veroxa_work_items','veroxa_job_attempts','veroxa_activity_events','veroxa_reports',
    'veroxa_monitor_checks','veroxa_alerts','veroxa_recovery_runs'
  ] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_momo_scope', table_name);
    execute format(
      'create trigger %I before insert or update of restaurant_id on public.%I '
      || 'for each row execute function veroxa_private.enforce_momo_operational_row()',
      table_name || '_momo_scope', table_name
    );
  end loop;
end $$;

-- Reuse the already-reviewed timestamp helper from the production foundation.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'veroxa_restaurant_truth_fields','veroxa_restaurant_contacts','veroxa_onboarding_steps',
    'veroxa_presence_profiles','veroxa_confirmations','veroxa_readiness_dimensions',
    'veroxa_media_assets','veroxa_media_rights','veroxa_media_reviews','veroxa_media_tags',
    'veroxa_ai_jobs','veroxa_content_strategies','veroxa_content_items',
    'veroxa_content_variants','veroxa_approvals','veroxa_content_calendar',
    'veroxa_provider_connections','veroxa_publish_queue','veroxa_local_presence_checks',
    'veroxa_review_records','veroxa_work_items','veroxa_reports','veroxa_monitor_checks',
    'veroxa_alerts','veroxa_recovery_runs'
  ] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_set_updated_at', table_name);
    execute format(
      'create trigger %I before update on public.%I '
      || 'for each row execute function veroxa_private.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end $$;

create or replace function veroxa_private.prepare_confirmation_submission()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.submitted_by is distinct from (select auth.uid())
     or not public.veroxa_current_user_has_active_restaurant(new.restaurant_id) then
    raise exception using errcode = '42501', message = 'confirmation_requires_active_client_author';
  end if;
  new.status := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.review_notes := null;
  return new;
end;
$$;
revoke all on function veroxa_private.prepare_confirmation_submission() from public, anon, authenticated;
create trigger veroxa_confirmations_prepare_submission
before insert on public.veroxa_confirmations
for each row execute function veroxa_private.prepare_confirmation_submission();

create or replace function public.veroxa_client_owns_media_asset(
  target_asset_id uuid,
  target_restaurant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and public.veroxa_current_user_has_active_restaurant(target_restaurant_id)
    and exists (
      select 1 from public.veroxa_media_assets asset
      where asset.id = target_asset_id
        and asset.restaurant_id = target_restaurant_id
        and asset.uploaded_by = (select auth.uid())
    );
$$;
revoke all on function public.veroxa_client_owns_media_asset(uuid, uuid) from public, anon;
grant execute on function public.veroxa_client_owns_media_asset(uuid, uuid) to authenticated;

create or replace function public.veroxa_media_storage_path_registered(target_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.veroxa_media_assets asset
    where asset.storage_path = target_storage_path
  );
$$;
revoke all on function public.veroxa_media_storage_path_registered(text) from public, anon;
grant execute on function public.veroxa_media_storage_path_registered(text) to authenticated;

drop policy if exists veroxa_restaurant_media_client_delete_orphan on storage.objects;
create policy veroxa_restaurant_media_client_delete_orphan on storage.objects
for delete to authenticated using (
  bucket_id = 'restaurant-media'
  and owner_id = (select auth.uid())::text
  and public.veroxa_current_user_has_active_restaurant(
    public.veroxa_restaurant_id_from_storage_path(name)
  )
  and not public.veroxa_media_storage_path_registered(name)
);

create or replace function veroxa_private.validate_confirmation_subject()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare subject_exists boolean;
begin
  if not (
    (new.subject_type = 'truth_field' and new.confirmation_kind = 'business_truth')
    or (new.subject_type = 'contact' and new.confirmation_kind = 'contact')
    or (new.subject_type = 'onboarding_step' and new.confirmation_kind = 'onboarding')
    or (new.subject_type = 'presence_profile' and new.confirmation_kind = 'presence')
    or (new.subject_type = 'media_rights' and new.confirmation_kind = 'usage_rights')
    or (new.subject_type = 'content_item' and new.confirmation_kind = 'content_direction')
  ) then
    raise exception using errcode = '23514', message = 'confirmation_subject_kind_mismatch';
  end if;
  subject_exists := case new.subject_type
    when 'truth_field' then exists (
      select 1 from public.veroxa_restaurant_truth_fields row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'contact' then exists (
      select 1 from public.veroxa_restaurant_contacts row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'onboarding_step' then exists (
      select 1 from public.veroxa_onboarding_steps row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'presence_profile' then exists (
      select 1 from public.veroxa_presence_profiles row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'media_rights' then exists (
      select 1 from public.veroxa_media_rights row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'content_item' then exists (
      select 1 from public.veroxa_content_items row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    else false
  end;
  if not subject_exists then
    raise exception using errcode = '23503', message = 'confirmation_subject_not_in_momo_scope';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_confirmation_subject() from public, anon, authenticated;
create trigger veroxa_confirmations_subject_guard
before insert or update of restaurant_id, subject_type, subject_id, confirmation_kind
on public.veroxa_confirmations
for each row execute function veroxa_private.validate_confirmation_subject();

create or replace function veroxa_private.validate_approval_subject()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare subject_exists boolean;
begin
  if not (
    (new.subject_type in ('content_strategy','content_item') and new.approval_kind = 'team_review')
    or (new.subject_type = 'content_variant' and new.approval_kind in ('team_review','publishing'))
    or (new.subject_type = 'publish' and new.approval_kind = 'publishing')
    or (new.subject_type = 'review_response' and new.approval_kind = 'reputation_sensitive')
    or (new.subject_type = 'report' and new.approval_kind = 'report_release')
    or (new.subject_type = 'presence_action' and new.approval_kind = 'team_review')
  ) then
    raise exception using errcode = '23514', message = 'approval_subject_kind_mismatch';
  end if;
  subject_exists := case new.subject_type
    when 'content_strategy' then exists (
      select 1 from public.veroxa_content_strategies row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'content_item' then exists (
      select 1 from public.veroxa_content_items row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'content_variant' then exists (
      select 1 from public.veroxa_content_variants row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'publish' then exists (
      select 1 from public.veroxa_content_variants row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'review_response' then exists (
      select 1 from public.veroxa_review_records row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'report' then exists (
      select 1 from public.veroxa_reports row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    when 'presence_action' then exists (
      select 1 from public.veroxa_local_presence_checks row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id
    )
    else false
  end;
  if not subject_exists then
    raise exception using errcode = '23503', message = 'approval_subject_not_in_momo_scope';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_approval_subject() from public, anon, authenticated;
create trigger veroxa_approvals_subject_guard
before insert or update of restaurant_id, subject_type, subject_id, approval_kind
on public.veroxa_approvals
for each row execute function veroxa_private.validate_approval_subject();

create or replace function veroxa_private.validate_review_approval_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_subject_type text;
  expected_approval_kind text;
begin
  if new.status <> 'approved' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.status = 'approved' then return new; end if;
  end if;
  expected_subject_type := case tg_table_name
    when 'veroxa_content_strategies' then 'content_strategy'
    when 'veroxa_content_items' then 'content_item'
    when 'veroxa_content_variants' then 'content_variant'
    when 'veroxa_reports' then 'report'
    else null
  end;
  expected_approval_kind := case when tg_table_name = 'veroxa_reports'
    then 'report_release' else 'team_review' end;

  if tg_table_name = 'veroxa_content_items' then
    if tg_op = 'UPDATE' then
      if old.owner_confirmation_id is not null and (
        new.strategy_id is distinct from old.strategy_id
        or new.primary_media_asset_id is distinct from old.primary_media_asset_id
        or new.title is distinct from old.title or new.concept is distinct from old.concept
        or new.master_caption is distinct from old.master_caption
      ) then
        raise exception using errcode = '23514', message = 'content_edit_requires_new_owner_confirmation';
      end if;
    end if;
    if new.requires_owner_confirmation then
      raise exception using errcode = '23514', message = 'content_item_requires_owner_confirmation';
    end if;
    if new.strategy_id is not null and not exists (
      select 1 from public.veroxa_content_strategies strategy
      where strategy.id = new.strategy_id
        and strategy.restaurant_id = new.restaurant_id
        and strategy.status = 'approved'
    ) then
      raise exception using errcode = '23514', message = 'content_item_requires_approved_strategy';
    end if;
  elsif tg_table_name = 'veroxa_content_variants' then
    if not exists (
      select 1 from public.veroxa_content_items item
      where item.id = new.content_item_id
        and item.restaurant_id = new.restaurant_id
        and item.status = 'approved'
    ) then
      raise exception using errcode = '23514', message = 'content_variant_requires_approved_item';
    end if;
  end if;

  if not exists (
    select 1 from public.veroxa_approvals approval
    where approval.restaurant_id = new.restaurant_id
      and approval.subject_type = expected_subject_type
      and approval.subject_id = new.id
      and approval.approval_kind = expected_approval_kind
      and approval.status = 'approved'
  ) then
    raise exception using errcode = '23514', message = 'approved_record_requires_matching_approval';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_review_approval_transition() from public, anon, authenticated;
create trigger veroxa_strategies_approval_transition
before insert or update of status on public.veroxa_content_strategies
for each row execute function veroxa_private.validate_review_approval_transition();
create trigger veroxa_content_items_approval_transition
before insert or update of status on public.veroxa_content_items
for each row execute function veroxa_private.validate_review_approval_transition();
create trigger veroxa_variants_approval_transition
before insert or update of status on public.veroxa_content_variants
for each row execute function veroxa_private.validate_review_approval_transition();
create trigger veroxa_reports_approval_transition
before insert or update of status on public.veroxa_reports
for each row execute function veroxa_private.validate_review_approval_transition();

create or replace function veroxa_private.variant_owner_confirmation_satisfied(
  target_variant_id uuid,
  target_restaurant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_content_variants variant
    join public.veroxa_content_items item on item.id = variant.content_item_id
    where variant.id = target_variant_id
      and variant.restaurant_id = target_restaurant_id
      and item.restaurant_id = target_restaurant_id
      and item.status = 'approved'
      and (
        not item.requires_owner_confirmation
        and (
          item.owner_confirmation_id is null
          or exists (
            select 1 from public.veroxa_confirmations confirmation
            where confirmation.id = item.owner_confirmation_id
              and confirmation.restaurant_id = target_restaurant_id
              and confirmation.subject_type = 'content_item'
              and confirmation.subject_id = item.id
              and confirmation.confirmation_kind = 'content_direction'
              and confirmation.decision = 'confirm'
              and confirmation.status = 'approved'
          )
        )
      )
  );
$$;
revoke all on function veroxa_private.variant_owner_confirmation_satisfied(uuid, uuid)
  from public, anon, authenticated;

create or replace function veroxa_private.protect_confirmed_truth_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'owner_confirmed' and (
    new.value_json is distinct from old.value_json
    or new.field_key is distinct from old.field_key
    or new.restaurant_id is distinct from old.restaurant_id
    or new.owner_confirmed_by is distinct from old.owner_confirmed_by
    or new.owner_confirmed_at is distinct from old.owner_confirmed_at
    or not (new.status = 'superseded' and not new.is_current)
  ) then
    raise exception using errcode = '23514', message = 'owner_confirmed_truth_requires_superseding_revision';
  end if;
  if new.status <> 'owner_confirmed' and new.status <> 'superseded' then
    new.owner_confirmed_by := null;
    new.owner_confirmed_at := null;
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_confirmed_truth_revision() from public, anon, authenticated;
create trigger veroxa_truth_fields_revision_guard
before update on public.veroxa_restaurant_truth_fields
for each row execute function veroxa_private.protect_confirmed_truth_revision();

create or replace function veroxa_private.protect_content_owner_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.requires_owner_confirmation and not new.requires_owner_confirmation
     and not exists (
       select 1 from public.veroxa_confirmations confirmation
       where confirmation.id = new.owner_confirmation_id
         and confirmation.restaurant_id = new.restaurant_id
         and confirmation.subject_type = 'content_item'
         and confirmation.subject_id = new.id
         and confirmation.confirmation_kind = 'content_direction'
         and confirmation.decision = 'confirm'
         and confirmation.status = 'approved'
     ) then
    raise exception using errcode = '23514', message = 'content_owner_confirmation_evidence_required';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_content_owner_confirmation() from public, anon, authenticated;
create trigger veroxa_content_items_owner_confirmation_guard
before update of requires_owner_confirmation, owner_confirmation_id on public.veroxa_content_items
for each row execute function veroxa_private.protect_content_owner_confirmation();

create or replace function veroxa_private.validate_provider_owner_authorization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('connected','degraded') and not exists (
    select 1
    from public.veroxa_user_profiles profile
    join public.veroxa_restaurant_members member on member.user_id = profile.user_id
    where profile.user_id = new.owner_authorized_by
      and profile.role = 'client' and profile.status = 'active'
      and member.restaurant_id = new.restaurant_id
      and member.role = 'client' and member.status = 'active'
  ) then
    raise exception using errcode = '23514', message = 'provider_connection_requires_active_owner_authorization';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_provider_owner_authorization() from public, anon, authenticated;
create trigger veroxa_provider_connections_owner_guard
before insert or update of restaurant_id, status, owner_authorized_by,
  owner_authorized_at, last_verified_at, capabilities
on public.veroxa_provider_connections
for each row execute function veroxa_private.validate_provider_owner_authorization();

create or replace function veroxa_private.protect_terminal_review_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('approved','changes_requested','rejected') then
    raise exception using errcode = '23514', message = 'terminal_review_record_is_immutable';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_terminal_review_record() from public, anon, authenticated;
create trigger veroxa_confirmations_terminal_immutable
before update on public.veroxa_confirmations
for each row execute function veroxa_private.protect_terminal_review_record();
create trigger veroxa_approvals_terminal_immutable
before update on public.veroxa_approvals
for each row execute function veroxa_private.protect_terminal_review_record();

create or replace function veroxa_private.protect_approved_material()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'approved' then
    if tg_table_name = 'veroxa_content_items' then
      if old.owner_confirmation_id is not null and (
        new.strategy_id is distinct from old.strategy_id
        or new.primary_media_asset_id is distinct from old.primary_media_asset_id
        or new.title is distinct from old.title or new.concept is distinct from old.concept
        or new.master_caption is distinct from old.master_caption
      ) then
        new.requires_owner_confirmation := true;
        new.owner_confirmation_id := null;
      end if;
    end if;
    return new;
  end if;
  if new.status <> 'approved'
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at then
    raise exception using errcode = '23514', message = 'approved_record_is_immutable_create_new_revision';
  end if;
  if tg_table_name = 'veroxa_content_strategies' then
    if new.title is distinct from old.title or new.goals is distinct from old.goals
       or new.pillars is distinct from old.pillars
       or new.brand_voice_snapshot is distinct from old.brand_voice_snapshot then
      raise exception using errcode = '23514', message = 'approved_material_requires_downgrade_and_rereview';
    end if;
  elsif tg_table_name = 'veroxa_content_items' then
    if new.strategy_id is distinct from old.strategy_id
       or new.primary_media_asset_id is distinct from old.primary_media_asset_id
       or new.title is distinct from old.title or new.concept is distinct from old.concept
       or new.master_caption is distinct from old.master_caption
       or new.requires_owner_confirmation is distinct from old.requires_owner_confirmation
       or new.owner_confirmation_id is distinct from old.owner_confirmation_id then
      raise exception using errcode = '23514', message = 'approved_material_requires_downgrade_and_rereview';
    end if;
  elsif tg_table_name = 'veroxa_content_variants' then
    if new.content_item_id is distinct from old.content_item_id
       or new.platform is distinct from old.platform or new.caption is distinct from old.caption
       or new.metadata is distinct from old.metadata then
      raise exception using errcode = '23514', message = 'approved_material_requires_downgrade_and_rereview';
    end if;
  elsif tg_table_name = 'veroxa_reports' then
    if new.report_type is distinct from old.report_type
       or new.period_start is distinct from old.period_start
       or new.period_end is distinct from old.period_end
       or new.summary is distinct from old.summary
       or new.evidence_event_ids is distinct from old.evidence_event_ids then
      raise exception using errcode = '23514', message = 'approved_material_requires_downgrade_and_rereview';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_approved_material() from public, anon, authenticated;
create trigger veroxa_strategies_approved_material_guard
before update on public.veroxa_content_strategies
for each row execute function veroxa_private.protect_approved_material();
create trigger veroxa_content_items_approved_material_guard
before update on public.veroxa_content_items
for each row execute function veroxa_private.protect_approved_material();
create trigger veroxa_variants_approved_material_guard
before update on public.veroxa_content_variants
for each row execute function veroxa_private.protect_approved_material();
create trigger veroxa_reports_approved_material_guard
before update on public.veroxa_reports
for each row execute function veroxa_private.protect_approved_material();

create or replace function veroxa_private.protect_approved_review_response()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.response_status = 'approved' and (
    new.response_status <> 'approved'
    or new.response_draft is distinct from old.response_draft
    or new.approval_id is distinct from old.approval_id
  ) then
    raise exception using errcode = '23514', message = 'approved_review_response_is_immutable';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.protect_approved_review_response() from public, anon, authenticated;
create trigger veroxa_review_records_approved_response_guard
before update on public.veroxa_review_records
for each row execute function veroxa_private.protect_approved_review_response();

create or replace function veroxa_private.validate_final_readiness_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_required integer;
  expected_verified integer;
  expected_blockers integer;
  expected_status public.veroxa_readiness_status_v1;
  expected_evidence jsonb;
  expected_blocker_snapshot jsonb;
begin
  select
    count(*) filter (where required),
    count(*) filter (where required and status = 'verified'),
    count(*) filter (
      where required and (status <> 'verified' or jsonb_array_length(blockers) > 0)
    ),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'dimensionKey', dimension_key,
          'status', status,
          'evidence', evidence,
          'verifiedAt', verified_at
        ) order by dimension_key
      ) filter (where required),
      '[]'::jsonb
    ),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'dimensionKey', dimension_key,
          'status', status,
          'blockers', blockers
        ) order by dimension_key
      ) filter (
        where required and (status <> 'verified' or jsonb_array_length(blockers) > 0)
      ),
      '[]'::jsonb
    )
  into expected_required, expected_verified, expected_blockers,
       expected_evidence, expected_blocker_snapshot
  from public.veroxa_readiness_dimensions
  where restaurant_id = new.restaurant_id;

  expected_status := case
    when expected_required = 0 then 'not_started'::public.veroxa_readiness_status_v1
    when expected_verified = expected_required and expected_blockers = 0
      then 'verified'::public.veroxa_readiness_status_v1
    else 'blocked'::public.veroxa_readiness_status_v1
  end;

  if new.required_count <> expected_required
     or new.verified_count <> expected_verified
     or new.blocker_count <> expected_blockers
     or new.status <> expected_status then
    raise exception using errcode = '23514', message = 'readiness_gate_snapshot_mismatch';
  end if;
  new.evidence_snapshot := expected_evidence;
  new.blocker_snapshot := expected_blocker_snapshot;
  if new.status = 'verified' and jsonb_array_length(new.evidence_snapshot) = 0 then
    raise exception using errcode = '23514', message = 'verified_readiness_requires_evidence_snapshot';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_final_readiness_gate() from public, anon, authenticated;
create trigger veroxa_readiness_gate_validate
before insert or update on public.veroxa_readiness_gate_runs
for each row execute function veroxa_private.validate_final_readiness_gate();

create or replace function veroxa_private.validate_publish_queue_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  variant_platform text;
  variant_status public.veroxa_review_status_v1;
  approval_status public.veroxa_review_status_v1;
  approval_subject_type text;
  approval_subject_id uuid;
  selected_approval_kind text;
  connection_provider text;
  connection_status public.veroxa_connection_status_v1;
  connection_capabilities jsonb;
begin
  if new.status not in ('approved','queued','publishing','published') then
    return new;
  end if;

  select platform, status into variant_platform, variant_status
  from public.veroxa_content_variants
  where id = new.variant_id and restaurant_id = new.restaurant_id;
  select approval.status, approval.subject_type, approval.subject_id, approval.approval_kind
    into approval_status, approval_subject_type, approval_subject_id, selected_approval_kind
  from public.veroxa_approvals approval
  where approval.id = new.approval_id and approval.restaurant_id = new.restaurant_id;
  select provider, status, capabilities
    into connection_provider, connection_status, connection_capabilities
  from public.veroxa_provider_connections
  where id = new.connection_id and restaurant_id = new.restaurant_id;

  if variant_status is distinct from 'approved'
     or approval_status is distinct from 'approved'
     or approval_subject_type not in ('content_variant','publish')
     or approval_subject_id is distinct from new.variant_id
     or selected_approval_kind <> 'publishing'
     or connection_status is distinct from 'connected'
     or not veroxa_private.variant_owner_confirmation_satisfied(new.variant_id, new.restaurant_id)
     or (variant_platform in ('facebook','instagram') and connection_provider <> 'meta')
     or (variant_platform = 'google_business' and connection_provider <> 'google_business')
     or (variant_platform = 'facebook' and not connection_capabilities ? 'facebook_publish')
     or (variant_platform = 'instagram' and not connection_capabilities ? 'instagram_publish')
     or (variant_platform = 'google_business' and not connection_capabilities ? 'google_business_publish') then
    raise exception using errcode = '23514', message = 'publish_requires_approved_variant_connection_and_gate';
  end if;
  if new.status in ('queued','publishing','published') and exists (
    select 1 from public.veroxa_readiness_dimensions dimension
    where dimension.restaurant_id = new.restaurant_id
      and dimension.required
      and (dimension.status <> 'verified' or jsonb_array_length(dimension.blockers) > 0)
  ) then
    raise exception using errcode = '23514', message = 'publish_execution_requires_final_readiness';
  end if;
  if new.status in ('queued','publishing','published') and not exists (
    select 1 from public.veroxa_readiness_dimensions dimension
    where dimension.restaurant_id = new.restaurant_id and dimension.required
  ) then
    raise exception using errcode = '23514', message = 'publish_execution_requires_final_readiness';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_publish_queue_gate() from public, anon, authenticated;
create trigger veroxa_publish_queue_approval_gate
before insert or update on public.veroxa_publish_queue
for each row execute function veroxa_private.validate_publish_queue_gate();

create or replace function veroxa_private.validate_content_calendar_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('approved','queued','publishing','published') and not exists (
    select 1 from public.veroxa_content_variants variant
    join public.veroxa_content_items item on item.id = variant.content_item_id
    where variant.id = new.variant_id
      and variant.restaurant_id = new.restaurant_id
      and variant.status = 'approved'
      and item.restaurant_id = new.restaurant_id
      and item.status = 'approved'
  ) then
    raise exception using errcode = '23514', message = 'calendar_requires_approved_variant';
  end if;
  if new.status in ('approved','queued','publishing','published')
     and not veroxa_private.variant_owner_confirmation_satisfied(new.variant_id, new.restaurant_id) then
    raise exception using errcode = '23514', message = 'calendar_requires_owner_content_confirmation';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_content_calendar_gate() from public, anon, authenticated;
create trigger veroxa_content_calendar_approval_gate
before insert or update on public.veroxa_content_calendar
for each row execute function veroxa_private.validate_content_calendar_gate();

create or replace function veroxa_private.validate_review_response_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.response_published_at is not null and new.response_status <> 'approved' then
    raise exception using errcode = '23514', message = 'published_review_response_requires_approval';
  end if;
  if new.response_status = 'approved' and not exists (
    select 1 from public.veroxa_approvals approval
    where approval.id = new.approval_id
      and approval.restaurant_id = new.restaurant_id
      and approval.subject_type = 'review_response'
      and approval.subject_id = new.id
      and approval.approval_kind = 'reputation_sensitive'
      and approval.status = 'approved'
  ) then
    raise exception using errcode = '23514', message = 'review_response_requires_reputation_approval';
  end if;
  if new.response_published_at is not null and (
    not exists (
      select 1 from public.veroxa_provider_connections connection
      where connection.restaurant_id = new.restaurant_id
        and connection.provider = 'google_business'
        and connection.status = 'connected'
        and connection.capabilities ? 'review_reply'
    )
    or
    not exists (
      select 1 from public.veroxa_readiness_dimensions dimension
      where dimension.restaurant_id = new.restaurant_id and dimension.required
    )
    or exists (
      select 1 from public.veroxa_readiness_dimensions dimension
      where dimension.restaurant_id = new.restaurant_id and dimension.required
        and (dimension.status <> 'verified' or jsonb_array_length(dimension.blockers) > 0)
    )
  ) then
    raise exception using errcode = '23514', message = 'review_response_publish_requires_final_readiness';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_review_response_gate() from public, anon, authenticated;
create trigger veroxa_review_records_approval_gate
before insert or update on public.veroxa_review_records
for each row execute function veroxa_private.validate_review_response_gate();

create or replace function veroxa_private.validate_report_evidence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare matching_events integer;
begin
  if new.status <> 'approved' then return new; end if;
  select count(*) into matching_events
  from public.veroxa_activity_events event
  where event.id = any(new.evidence_event_ids)
    and event.restaurant_id = new.restaurant_id
    and event.report_eligible
    and event.visibility in ('client','both');
  if matching_events <> cardinality(new.evidence_event_ids) then
    raise exception using errcode = '23514', message = 'report_requires_client_safe_reviewed_evidence';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_report_evidence() from public, anon, authenticated;
create trigger veroxa_reports_evidence_gate
before insert or update on public.veroxa_reports
for each row execute function veroxa_private.validate_report_evidence();

create or replace function veroxa_private.record_media_reuse()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.veroxa_media_assets
  set reuse_count = reuse_count + 1,
      last_used_at = greatest(coalesce(last_used_at, new.used_at), new.used_at)
  where id = new.asset_id and restaurant_id = new.restaurant_id;
  return new;
end;
$$;
revoke all on function veroxa_private.record_media_reuse() from public, anon, authenticated;
create trigger veroxa_media_usage_record_reuse
after insert on public.veroxa_media_usage
for each row execute function veroxa_private.record_media_reuse();

create or replace function veroxa_private.validate_media_usage_rights()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.usage_kind in ('scheduled','published')
     and new.platform in ('facebook','instagram','google_business','website')
     and (
       not exists (
         select 1 from public.veroxa_media_rights rights
         where rights.asset_id = new.asset_id
           and rights.restaurant_id = new.restaurant_id
           and rights.rights_status = 'confirmed'
           and (rights.expires_at is null or rights.expires_at > new.used_at)
           and rights.usage_scope ? new.platform
       )
       or not exists (
         select 1 from public.veroxa_media_reviews review
         where review.asset_id = new.asset_id
           and review.restaurant_id = new.restaurant_id
           and review.is_current and review.status = 'approved'
           and review.public_use_approved
       )
     ) then
    raise exception using errcode = '23514', message = 'public_media_usage_requires_rights_and_review';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.validate_media_usage_rights() from public, anon, authenticated;
create trigger veroxa_media_usage_rights_gate
before insert on public.veroxa_media_usage
for each row execute function veroxa_private.validate_media_usage_rights();

-- No table below is anonymously reachable. Authenticated table privileges are
-- explicit and every row remains subject to forced RLS. Deletes are omitted;
-- lifecycle records use cancelled/rejected/superseded states for auditability.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'veroxa_restaurant_truth_fields','veroxa_restaurant_contacts','veroxa_onboarding_steps',
    'veroxa_presence_profiles','veroxa_confirmations','veroxa_readiness_dimensions',
    'veroxa_readiness_gate_runs','veroxa_media_rights','veroxa_media_reviews',
    'veroxa_media_tags','veroxa_media_asset_tags','veroxa_ai_jobs','veroxa_content_strategies',
    'veroxa_content_items','veroxa_content_variants','veroxa_approvals',
    'veroxa_content_calendar','veroxa_media_usage','veroxa_provider_connections',
    'veroxa_publish_queue','veroxa_publish_attempts','veroxa_local_presence_checks',
    'veroxa_review_records','veroxa_visibility_snapshots','veroxa_work_items',
    'veroxa_job_attempts','veroxa_activity_events','veroxa_reports','veroxa_monitor_checks',
    'veroxa_alerts','veroxa_recovery_runs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update on table public.%I to authenticated', table_name);

    execute format('drop policy if exists %I on public.%I', table_name || '_team_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_team_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_team_update', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated '
      || 'using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id))',
      table_name || '_team_select', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated '
      || 'with check (public.veroxa_current_user_is_team_for_restaurant(restaurant_id))',
      table_name || '_team_insert', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated '
      || 'using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id)) '
      || 'with check (public.veroxa_current_user_is_team_for_restaurant(restaurant_id))',
      table_name || '_team_update', table_name
    );
  end loop;
end $$;

-- Base tables remain Team-only for reads because RLS cannot hide internal
-- columns. Client data is exposed only through the sanitized views below.
-- The older media-member read policy is replaced for the same reason.
drop policy if exists veroxa_media_member_select on public.veroxa_media_assets;
drop policy if exists veroxa_media_team_select on public.veroxa_media_assets;
drop policy if exists veroxa_media_team_insert on public.veroxa_media_assets;
drop policy if exists veroxa_media_team_update on public.veroxa_media_assets;
grant update on table public.veroxa_media_assets to authenticated;
create policy veroxa_media_team_select on public.veroxa_media_assets
for select to authenticated using (
  public.veroxa_current_user_is_team_for_restaurant(restaurant_id)
);
create policy veroxa_media_team_insert on public.veroxa_media_assets
for insert to authenticated with check (
  public.veroxa_current_user_is_team_for_restaurant(restaurant_id)
  and uploaded_by = (select auth.uid())
  and storage_path ~ ('^restaurants/' || restaurant_id::text || '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|heif|mp4|mov|webm)$')
);
create policy veroxa_media_team_update on public.veroxa_media_assets
for update to authenticated using (
  public.veroxa_current_user_is_team_for_restaurant(restaurant_id)
) with check (
  public.veroxa_current_user_is_team_for_restaurant(restaurant_id)
);

-- Client confirmations are append-only submissions. Team applies accepted
-- changes to the authoritative truth/right/onboarding records.
create policy veroxa_confirmations_client_insert on public.veroxa_confirmations
for insert to authenticated with check (
  public.veroxa_current_user_has_active_restaurant(restaurant_id)
  and submitted_by = (select auth.uid())
  and status = 'pending'
  and reviewed_by is null and reviewed_at is null
);

-- Owner-confirmed media rights may be registered only for a file uploaded by
-- that same client identity. Other rights states remain Team-only.
create policy veroxa_media_rights_client_insert on public.veroxa_media_rights
for insert to authenticated with check (
  public.veroxa_current_user_has_active_restaurant(restaurant_id)
  and rights_status = 'confirmed'
  and confirmed_by = (select auth.uid())
  and confirmed_at is not null
  and usage_scope <@ '["facebook","instagram","google_business","website","internal"]'::jsonb
  and public.veroxa_client_owns_media_asset(asset_id, restaurant_id)
);

create or replace function public.veroxa_create_truth_revision_v1(
  p_restaurant_id uuid,
  p_field_key text,
  p_section text,
  p_value_json jsonb,
  p_source text default 'team'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_record public.veroxa_restaurant_truth_fields%rowtype;
  new_truth_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_truth_revision_required';
  end if;
  if p_source not in ('team','public_evidence','import') then
    raise exception using errcode = '22023', message = 'owner_truth_requires_client_confirmation';
  end if;
  select * into current_record
  from public.veroxa_restaurant_truth_fields
  where restaurant_id = p_restaurant_id and field_key = p_field_key and is_current
  for update;
  if found then
    update public.veroxa_restaurant_truth_fields
    set is_current = false, status = 'superseded'
    where id = current_record.id;
  end if;
  insert into public.veroxa_restaurant_truth_fields (
    restaurant_id, field_key, section, value_json, status, source,
    is_current, supersedes_id, created_by
  ) values (
    p_restaurant_id, p_field_key, p_section, p_value_json, 'team_prefilled', p_source,
    true, current_record.id, (select auth.uid())
  ) returning id into new_truth_id;
  return new_truth_id;
end;
$$;
revoke all on function public.veroxa_create_truth_revision_v1(uuid, text, text, jsonb, text)
  from public, anon;
grant execute on function public.veroxa_create_truth_revision_v1(uuid, text, text, jsonb, text)
  to authenticated;

create or replace function public.veroxa_register_primary_contact_v1(
  p_restaurant_id uuid,
  p_name text,
  p_email text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_contact_id uuid;
begin
  if (select auth.uid()) is null
     or not public.veroxa_current_user_has_active_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'active_momo_client_required';
  end if;
  if exists (
    select 1 from public.veroxa_restaurant_contacts
    where restaurant_id = p_restaurant_id and is_primary
  ) then
    raise exception using errcode = '23505', message = 'primary_contact_already_exists';
  end if;
  insert into public.veroxa_restaurant_contacts (
    restaurant_id, contact_kind, name, email, phone, is_primary, status,
    owner_confirmed_by, owner_confirmed_at, created_by
  ) values (
    p_restaurant_id, 'owner', btrim(p_name), nullif(lower(btrim(p_email)), ''),
    nullif(btrim(p_phone), ''), true, 'owner_confirmed',
    (select auth.uid()), now(), (select auth.uid())
  ) returning id into new_contact_id;
  return new_contact_id;
end;
$$;
revoke all on function public.veroxa_register_primary_contact_v1(uuid, text, text, text)
  from public, anon;
grant execute on function public.veroxa_register_primary_contact_v1(uuid, text, text, text)
  to authenticated;

create or replace function public.veroxa_register_momo_media_v1(
  p_restaurant_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_file_size bigint,
  p_original_file_name text default null,
  p_intake_notes text default null,
  p_usage_scope jsonb default '["facebook","instagram","google_business","website"]'::jsonb,
  p_expires_at timestamptz default null
)
returns table (asset_id uuid, rights_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_asset_id uuid := gen_random_uuid();
  new_rights_id uuid := gen_random_uuid();
  object_metadata jsonb;
begin
  if (select auth.uid()) is null
     or not public.veroxa_current_user_has_active_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'active_momo_client_required';
  end if;
  if jsonb_typeof(p_usage_scope) <> 'array'
     or not p_usage_scope <@ '["facebook","instagram","google_business","website","internal"]'::jsonb then
    raise exception using errcode = '22023', message = 'invalid_media_usage_scope';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception using errcode = '22023', message = 'media_rights_expiry_must_be_future';
  end if;
  if char_length(coalesce(p_original_file_name, '')) > 255
     or char_length(coalesce(p_intake_notes, '')) > 2000 then
    raise exception using errcode = '22001', message = 'media_intake_text_too_long';
  end if;
  select object.metadata into object_metadata
  from storage.objects object
  where object.bucket_id = 'restaurant-media'
    and object.name = p_storage_path
    and object.owner_id = (select auth.uid())::text;
  if object_metadata is null then
    raise exception using errcode = '23503', message = 'uploaded_storage_object_not_found';
  end if;
  if coalesce(object_metadata ->> 'mimetype', p_mime_type) <> p_mime_type
     or coalesce((object_metadata ->> 'size')::bigint, p_file_size) <> p_file_size then
    raise exception using errcode = '23514', message = 'storage_object_metadata_mismatch';
  end if;

  insert into public.veroxa_media_assets (
    id, restaurant_id, storage_path, mime_type, file_size, uploaded_by, status,
    original_file_name, intake_notes
  ) values (
    new_asset_id, p_restaurant_id, p_storage_path, p_mime_type, p_file_size,
    (select auth.uid()), 'uploaded', nullif(btrim(p_original_file_name), ''),
    nullif(btrim(p_intake_notes), '')
  );

  insert into public.veroxa_media_rights (
    id, restaurant_id, asset_id, rights_status, usage_scope,
    valid_from, expires_at, confirmed_by, confirmed_at
  ) values (
    new_rights_id, p_restaurant_id, new_asset_id, 'confirmed', p_usage_scope,
    now(), p_expires_at, (select auth.uid()), now()
  );

  return query select new_asset_id, new_rights_id;
end;
$$;
revoke all on function public.veroxa_register_momo_media_v1(uuid, text, text, bigint, text, text, jsonb, timestamptz)
  from public, anon;
grant execute on function public.veroxa_register_momo_media_v1(uuid, text, text, bigint, text, text, jsonb, timestamptz)
  to authenticated;

create or replace function public.veroxa_apply_confirmation_v1(
  p_confirmation_id uuid,
  p_decision public.veroxa_review_status_v1,
  p_applied_value jsonb default null,
  p_review_notes text default null
)
returns table (
  confirmation_id uuid,
  status public.veroxa_review_status_v1,
  subject_type text,
  subject_id uuid,
  reviewed_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  confirmation_record public.veroxa_confirmations%rowtype;
  applied_value jsonb;
  reviewer_id uuid := (select auth.uid());
begin
  if reviewer_id is null then
    raise exception using errcode = '42501', message = 'authenticated_team_required';
  end if;
  if p_decision not in ('approved','changes_requested','rejected') then
    raise exception using errcode = '22023', message = 'terminal_confirmation_decision_required';
  end if;
  select * into confirmation_record
  from public.veroxa_confirmations
  where id = p_confirmation_id
  for update;
  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(confirmation_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_confirmation_required';
  end if;
  if confirmation_record.status not in ('pending','in_review') then
    raise exception using errcode = '23514', message = 'confirmation_already_decided';
  end if;
  applied_value := null;
  if confirmation_record.decision = 'correct' then
    if confirmation_record.proposed_value is null then
      raise exception using errcode = '23514', message = 'correction_requires_client_proposed_value';
    end if;
    if p_applied_value is not null
       and p_applied_value is distinct from confirmation_record.proposed_value then
      raise exception using errcode = '23514', message = 'team_cannot_override_client_correction';
    end if;
    applied_value := confirmation_record.proposed_value;
  elsif confirmation_record.decision = 'confirm' then
    if p_applied_value is not null then
      raise exception using errcode = '23514', message = 'confirmed_value_must_match_existing_subject';
    end if;
  elsif p_applied_value is not null then
    raise exception using errcode = '23514', message = 'nonaffirmative_confirmation_cannot_apply_value';
  end if;

  if p_decision = 'approved' then
    if not exists (
         select 1
         from public.veroxa_user_profiles profile
         join public.veroxa_restaurant_members member on member.user_id = profile.user_id
         where profile.user_id = confirmation_record.submitted_by
           and profile.role = 'client' and profile.status = 'active'
           and member.restaurant_id = confirmation_record.restaurant_id
           and member.role = 'client' and member.status = 'active'
       ) then
      raise exception using errcode = '23514', message = 'owner_confirmation_requires_active_client_submitter';
    end if;

    -- Record the reviewed confirmation first inside this same transaction so
    -- destination guards can require its evidence. Any destination failure
    -- rolls this update back with the entire RPC.
    update public.veroxa_confirmations
    set status = 'approved', reviewed_by = reviewer_id, reviewed_at = now(),
        review_notes = nullif(btrim(p_review_notes), '')
    where id = confirmation_record.id;

    if confirmation_record.decision in ('confirm','correct') then
      case confirmation_record.subject_type
      when 'truth_field' then
        update public.veroxa_restaurant_truth_fields
        set value_json = coalesce(applied_value, value_json),
            status = 'owner_confirmed',
            owner_confirmed_by = confirmation_record.submitted_by,
            owner_confirmed_at = confirmation_record.submitted_at
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'contact' then
        update public.veroxa_restaurant_contacts
        set name = case when applied_value ? 'name' then btrim(applied_value ->> 'name') else name end,
            email = case when applied_value ? 'email'
              then nullif(lower(btrim(applied_value ->> 'email')), '') else email end,
            phone = case when applied_value ? 'phone'
              then nullif(btrim(applied_value ->> 'phone'), '') else phone end,
            is_primary = case when applied_value ? 'isPrimary'
              then (applied_value ->> 'isPrimary')::boolean else is_primary end,
            status = 'owner_confirmed',
            owner_confirmed_by = confirmation_record.submitted_by,
            owner_confirmed_at = confirmation_record.submitted_at
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'onboarding_step' then
        update public.veroxa_onboarding_steps
        set status = 'verified', completed_by = reviewer_id, completed_at = now(),
            completion_evidence = completion_evidence || jsonb_build_array(
              jsonb_build_object('confirmationId', confirmation_record.id, 'reviewedAt', now())
            )
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'presence_profile' then
        update public.veroxa_presence_profiles
        set public_url = case when applied_value ? 'publicUrl'
              then nullif(btrim(applied_value ->> 'publicUrl'), '') else public_url end,
            truth_status = 'owner_confirmed'
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'media_rights' then
        update public.veroxa_media_rights
        set rights_status = 'confirmed',
            usage_scope = coalesce(applied_value -> 'usageScope', usage_scope),
            confirmed_by = confirmation_record.submitted_by,
            confirmed_at = confirmation_record.submitted_at,
            valid_from = coalesce(valid_from, confirmation_record.submitted_at)
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      when 'content_item' then
        update public.veroxa_content_items
        set requires_owner_confirmation = false,
            owner_confirmation_id = confirmation_record.id
        where id = confirmation_record.subject_id
          and restaurant_id = confirmation_record.restaurant_id;
      else
        raise exception using errcode = '23514', message = 'unsupported_confirmation_subject';
      end case;
      if not found then
        raise exception using errcode = '23503', message = 'confirmation_subject_missing';
      end if;
    end if;
  end if;

  if p_decision <> 'approved' then
    update public.veroxa_confirmations
    set status = p_decision, reviewed_by = reviewer_id, reviewed_at = now(),
        review_notes = nullif(btrim(p_review_notes), '')
    where id = confirmation_record.id;
  end if;

  return query
  select confirmation_record.id, p_decision, confirmation_record.subject_type,
    confirmation_record.subject_id, now();
end;
$$;
revoke all on function public.veroxa_apply_confirmation_v1(uuid, public.veroxa_review_status_v1, jsonb, text)
  from public, anon;
grant execute on function public.veroxa_apply_confirmation_v1(uuid, public.veroxa_review_status_v1, jsonb, text)
  to authenticated;

create or replace function public.veroxa_apply_approval_v1(
  p_approval_id uuid,
  p_decision public.veroxa_review_status_v1,
  p_decision_notes text default null
)
returns table (
  approval_id uuid,
  status public.veroxa_review_status_v1,
  subject_type text,
  subject_id uuid,
  decided_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  approval_record public.veroxa_approvals%rowtype;
  reviewer_id uuid := (select auth.uid());
begin
  if p_decision not in ('approved','changes_requested','rejected') then
    raise exception using errcode = '22023', message = 'terminal_approval_decision_required';
  end if;
  select * into approval_record
  from public.veroxa_approvals
  where id = p_approval_id
  for update;
  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(approval_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_approval_required';
  end if;
  if approval_record.status not in ('pending','in_review') then
    raise exception using errcode = '23514', message = 'approval_already_decided';
  end if;
  if approval_record.approval_kind = 'owner_confirmation' then
    raise exception using errcode = '23514', message = 'owner_confirmation_requires_client_confirmation_workflow';
  end if;
  if not (
    (approval_record.subject_type in ('content_strategy','content_item','content_variant')
      and approval_record.approval_kind in ('team_review','publishing'))
    or (approval_record.subject_type = 'publish' and approval_record.approval_kind = 'publishing')
    or (approval_record.subject_type = 'review_response'
      and approval_record.approval_kind = 'reputation_sensitive')
    or (approval_record.subject_type = 'report'
      and approval_record.approval_kind = 'report_release')
    or (approval_record.subject_type = 'presence_action'
      and approval_record.approval_kind = 'team_review')
  ) then
    raise exception using errcode = '23514', message = 'approval_subject_kind_mismatch';
  end if;

  update public.veroxa_approvals
  set status = p_decision, decided_by = reviewer_id, decided_at = now(),
      decision_notes = nullif(btrim(p_decision_notes), '')
  where id = approval_record.id;

  case approval_record.subject_type
    when 'content_strategy' then
      update public.veroxa_content_strategies
      set status = p_decision,
          approved_by = case when p_decision = 'approved' then reviewer_id else null end,
          approved_at = case when p_decision = 'approved' then now() else null end
      where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
    when 'content_item' then
      update public.veroxa_content_items
      set status = p_decision,
          approved_by = case when p_decision = 'approved' then reviewer_id else null end,
          approved_at = case when p_decision = 'approved' then now() else null end
      where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
    when 'content_variant' then
      if approval_record.approval_kind = 'team_review' then
        update public.veroxa_content_variants
        set status = p_decision,
            approved_by = case when p_decision = 'approved' then reviewer_id else null end,
            approved_at = case when p_decision = 'approved' then now() else null end
        where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
      end if;
    when 'review_response' then
      update public.veroxa_review_records
      set response_status = p_decision
      where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
    when 'report' then
      update public.veroxa_reports
      set status = p_decision,
          approved_by = case when p_decision = 'approved' then reviewer_id else null end,
          approved_at = case when p_decision = 'approved' then now() else null end
      where id = approval_record.subject_id and restaurant_id = approval_record.restaurant_id;
    when 'publish' then null;
    when 'presence_action' then null;
    else raise exception using errcode = '23514', message = 'unsupported_approval_subject';
  end case;
  if approval_record.subject_type not in ('publish','presence_action')
     and not (approval_record.subject_type = 'content_variant'
       and approval_record.approval_kind = 'publishing')
     and not found then
    raise exception using errcode = '23503', message = 'approval_subject_missing';
  end if;

  return query select approval_record.id, p_decision, approval_record.subject_type,
    approval_record.subject_id, now();
end;
$$;
revoke all on function public.veroxa_apply_approval_v1(uuid, public.veroxa_review_status_v1, text)
  from public, anon;
grant execute on function public.veroxa_apply_approval_v1(uuid, public.veroxa_review_status_v1, text)
  to authenticated;

create or replace function public.veroxa_review_momo_media_v1(
  p_asset_id uuid,
  p_status public.veroxa_review_status_v1,
  p_quality_score smallint default null,
  p_quality_notes text default null,
  p_public_use_approved boolean default false
)
returns table (
  review_id uuid,
  asset_id uuid,
  status public.veroxa_review_status_v1,
  public_use_approved boolean,
  reviewed_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  asset_record public.veroxa_media_assets%rowtype;
  new_review_id uuid;
  reviewer_id uuid := (select auth.uid());
begin
  if p_status not in ('in_review','approved','changes_requested','rejected') then
    raise exception using errcode = '22023', message = 'invalid_media_review_status';
  end if;
  if char_length(coalesce(p_quality_notes, '')) > 2000 then
    raise exception using errcode = '22001', message = 'media_review_notes_too_long';
  end if;
  select * into asset_record from public.veroxa_media_assets
  where id = p_asset_id for update;
  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(asset_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_media_review_required';
  end if;
  if p_public_use_approved and (
    p_status <> 'approved'
    or not exists (
      select 1 from public.veroxa_media_rights rights
      where rights.asset_id = asset_record.id
        and rights.restaurant_id = asset_record.restaurant_id
        and rights.rights_status = 'confirmed'
        and (rights.expires_at is null or rights.expires_at > now())
    )
  ) then
    raise exception using errcode = '23514', message = 'public_media_use_requires_current_confirmed_rights';
  end if;

  update public.veroxa_media_reviews review
  set is_current = false
  where review.asset_id = asset_record.id and review.is_current;
  insert into public.veroxa_media_reviews (
    restaurant_id, asset_id, status, quality_score, quality_notes,
    public_use_approved, is_current, reviewed_by, reviewed_at
  ) values (
    asset_record.restaurant_id, asset_record.id, p_status, p_quality_score,
    nullif(btrim(p_quality_notes), ''), p_public_use_approved, true,
    reviewer_id, now()
  ) returning id into new_review_id;
  update public.veroxa_media_assets
  set status = case
    when p_status = 'in_review' then 'under_veroxa_review'
    when p_status = 'approved' and p_public_use_approved then 'ready_to_use'
    when p_status = 'changes_requested' then 'better_version_helpful'
    else 'saved_for_later'
  end
  where id = asset_record.id;

  return query select new_review_id, asset_record.id, p_status,
    p_public_use_approved, now();
end;
$$;
revoke all on function public.veroxa_review_momo_media_v1(uuid, public.veroxa_review_status_v1, smallint, text, boolean)
  from public, anon;
grant execute on function public.veroxa_review_momo_media_v1(uuid, public.veroxa_review_status_v1, smallint, text, boolean)
  to authenticated;

create or replace function public.veroxa_retry_work_item_v1(p_work_item_id uuid)
returns table (
  work_item_id uuid,
  attempt_number integer,
  next_attempt_at timestamptz,
  status public.veroxa_job_status_v1
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  work_record public.veroxa_work_items%rowtype;
  next_number integer;
  retry_at timestamptz;
begin
  select * into work_record from public.veroxa_work_items
  where id = p_work_item_id for update;
  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(work_record.restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_work_item_required';
  end if;
  if work_record.status not in ('failed','blocked','retrying') then
    raise exception using errcode = '23514', message = 'work_item_not_retryable';
  end if;
  if work_record.attempt_count >= work_record.max_attempts then
    raise exception using errcode = '23514', message = 'work_item_retry_limit_reached';
  end if;
  next_number := work_record.attempt_count + 1;
  retry_at := now() + make_interval(
    secs => least(3600, (30 * power(2::numeric, next_number - 1))::integer)
  );
  insert into public.veroxa_job_attempts (
    restaurant_id, work_item_id, attempt_number, status, started_at
  ) values (
    work_record.restaurant_id, work_record.id, next_number, 'retrying', now()
  );
  update public.veroxa_work_items
  set status = 'retrying', attempt_count = next_number, next_attempt_at = retry_at,
      blocked_reason = null
  where id = work_record.id;
  return query select work_record.id, next_number, retry_at,
    'retrying'::public.veroxa_job_status_v1;
end;
$$;
revoke all on function public.veroxa_retry_work_item_v1(uuid) from public, anon;
grant execute on function public.veroxa_retry_work_item_v1(uuid) to authenticated;

create or replace function public.veroxa_momo_client_snapshot_v1(target_restaurant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if (select auth.uid()) is null
     or not public.veroxa_current_user_has_active_restaurant(target_restaurant_id) then
    raise exception using errcode = '42501', message = 'active_momo_client_required';
  end if;

  select jsonb_build_object(
    'restaurantId', target_restaurant_id,
    'onboarding', jsonb_build_object(
      'truthFields', coalesce((select jsonb_agg(jsonb_build_object(
        'id', field.id, 'fieldKey', field.field_key, 'section', field.section,
        'value', field.value_json, 'status', field.status, 'source', field.source,
        'ownerConfirmedAt', field.owner_confirmed_at,
        'updatedAt', field.updated_at
      ) order by field.field_key) from public.veroxa_restaurant_truth_fields field
        where field.restaurant_id = target_restaurant_id and field.is_current and field.status <> 'superseded'), '[]'::jsonb),
      'contacts', coalesce((select jsonb_agg(jsonb_build_object(
        'id', contact.id, 'kind', contact.contact_kind, 'name', contact.name,
        'email', contact.email, 'phone', contact.phone, 'isPrimary', contact.is_primary,
        'status', contact.status, 'ownerConfirmedAt', contact.owner_confirmed_at
      ) order by contact.is_primary desc, contact.created_at) from public.veroxa_restaurant_contacts contact
        where contact.restaurant_id = target_restaurant_id and contact.status not in ('rejected','superseded')), '[]'::jsonb),
      'steps', coalesce((select jsonb_agg(jsonb_build_object(
        'id', step.id, 'stepKey', step.step_key, 'title', step.title,
        'position', step.position, 'status', step.status, 'completedAt', step.completed_at
      ) order by step.position) from public.veroxa_onboarding_steps step
        where step.restaurant_id = target_restaurant_id), '[]'::jsonb),
      'presence', coalesce((select jsonb_agg(jsonb_build_object(
        'id', presence.id, 'provider', presence.provider, 'publicUrl', presence.public_url,
        'accessStatus', presence.access_status, 'truthStatus', presence.truth_status,
        'lastCheckedAt', presence.last_checked_at
      ) order by presence.provider) from public.veroxa_presence_profiles presence
        where presence.restaurant_id = target_restaurant_id), '[]'::jsonb)
    ),
    'connections', coalesce((select jsonb_agg(jsonb_build_object(
      'provider', connection.provider, 'status', connection.status,
      'ownerAuthorizedAt', connection.owner_authorized_at,
      'lastVerifiedAt', connection.last_verified_at
    ) order by connection.provider) from public.veroxa_provider_connections connection
      where connection.restaurant_id = target_restaurant_id), '[]'::jsonb),
    'readiness', jsonb_build_object(
      'dimensions', coalesce((select jsonb_agg(jsonb_build_object(
        'dimensionKey', dimension.dimension_key, 'label', dimension.label,
        'required', dimension.required, 'status', dimension.status,
        'verifiedAt', dimension.verified_at
      ) order by dimension.dimension_key) from public.veroxa_readiness_dimensions dimension
        where dimension.restaurant_id = target_restaurant_id), '[]'::jsonb),
      'latestGate', coalesce((select jsonb_build_object(
        'status', gate.status, 'requiredCount', gate.required_count,
        'verifiedCount', gate.verified_count, 'blockerCount', gate.blocker_count,
        'evaluatedAt', gate.evaluated_at
      ) from public.veroxa_readiness_gate_runs gate
        where gate.restaurant_id = target_restaurant_id
        order by gate.evaluated_at desc limit 1), '{}'::jsonb)
    ),
    'confirmations', coalesce((select jsonb_agg(jsonb_build_object(
      'id', confirmation.id, 'subjectType', confirmation.subject_type,
      'subjectId', confirmation.subject_id, 'kind', confirmation.confirmation_kind,
      'decision', confirmation.decision, 'proposedValue', confirmation.proposed_value,
      'notes', confirmation.notes, 'status', confirmation.status,
      'submittedAt', confirmation.submitted_at, 'reviewedAt', confirmation.reviewed_at
    ) order by confirmation.submitted_at desc) from public.veroxa_confirmations confirmation
      where confirmation.restaurant_id = target_restaurant_id
        and confirmation.submitted_by = (select auth.uid())), '[]'::jsonb),
    'media', coalesce((select jsonb_agg(jsonb_build_object(
      'id', asset.id, 'storagePath', asset.storage_path,
      'displayFileName', asset.original_file_name, 'mimeType', asset.mime_type,
      'fileSize', asset.file_size, 'status', asset.status,
      'originalFileName', asset.original_file_name, 'createdAt', asset.created_at,
      'rightsStatus', rights.rights_status,
      'reviewStatus', review.status,
      'publicUseApproved', coalesce(review.public_use_approved, false)
    ) order by asset.created_at desc)
      from public.veroxa_media_assets asset
      left join public.veroxa_media_rights rights on rights.asset_id = asset.id
      left join public.veroxa_media_reviews review on review.asset_id = asset.id and review.is_current
      where asset.restaurant_id = target_restaurant_id), '[]'::jsonb),
    'pendingContentConfirmations', coalesce((select jsonb_agg(jsonb_build_object(
      'contentItemId', item.id, 'title', item.title, 'concept', item.concept,
      'masterCaption', item.master_caption,
      'mediaDisplayFileName', asset.original_file_name,
      'confirmationStatus', (
        select confirmation.status
        from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = target_restaurant_id
          and confirmation.subject_type = 'content_item'
          and confirmation.subject_id = item.id
          and confirmation.confirmation_kind = 'content_direction'
          and confirmation.submitted_by = (select auth.uid())
        order by confirmation.submitted_at desc limit 1
      )
    ) order by item.created_at)
      from public.veroxa_content_items item
      left join public.veroxa_media_assets asset on asset.id = item.primary_media_asset_id
      where item.restaurant_id = target_restaurant_id
        and item.requires_owner_confirmation
        and item.status in ('pending','in_review','approved')
        and not exists (
          select 1 from public.veroxa_confirmations confirmation
          where confirmation.restaurant_id = target_restaurant_id
            and confirmation.subject_type = 'content_item'
            and confirmation.subject_id = item.id
            and confirmation.confirmation_kind = 'content_direction'
            and confirmation.status = 'approved'
            and confirmation.decision in ('confirm','correct')
        )), '[]'::jsonb),
    'contentCalendar', coalesce((select jsonb_agg(jsonb_build_object(
      'contentItemId', item.id, 'title', item.title, 'variantId', variant.id,
      'platform', variant.platform, 'caption', variant.caption,
      'calendarStatus', calendar.status, 'scheduledFor', calendar.scheduled_for,
      'publishedAt', calendar.published_at
    ) order by calendar.scheduled_for nulls last)
      from public.veroxa_content_calendar calendar
      join public.veroxa_content_variants variant on variant.id = calendar.variant_id
      join public.veroxa_content_items item on item.id = variant.content_item_id
      where calendar.restaurant_id = target_restaurant_id
        and variant.status = 'approved'
        and calendar.status in ('approved','queued','publishing','published')), '[]'::jsonb),
    'reports', coalesce((select jsonb_agg(jsonb_build_object(
      'id', report.id, 'reportType', report.report_type,
      'periodStart', report.period_start, 'periodEnd', report.period_end,
      'summary', report.summary, 'status', report.status,
      'approvedAt', report.approved_at, 'publishedAt', report.published_at,
      'updatedAt', report.updated_at
    ) order by report.period_end desc) from public.veroxa_reports report
      where report.restaurant_id = target_restaurant_id and report.status = 'approved'), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.veroxa_momo_client_snapshot_v1(uuid) from public, anon;
grant execute on function public.veroxa_momo_client_snapshot_v1(uuid) to authenticated;

create or replace function public.veroxa_momo_readiness_summary_v1(target_restaurant_id uuid)
returns table (
  required_count integer,
  verified_count integer,
  blocker_count integer,
  overall_status public.veroxa_readiness_status_v1,
  can_activate boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with summary as (
    select
      count(*) filter (where required)::integer as required_count,
      count(*) filter (where required and status = 'verified')::integer as verified_count,
      count(*) filter (
        where required and (status <> 'verified' or jsonb_array_length(blockers) > 0)
    )::integer as blocker_count
    from public.veroxa_readiness_dimensions
    where restaurant_id = target_restaurant_id
      and public.veroxa_current_user_is_team_for_restaurant(target_restaurant_id)
  )
  select
    required_count,
    verified_count,
    blocker_count,
    case
      when required_count = 0 then 'not_started'::public.veroxa_readiness_status_v1
      when verified_count = required_count and blocker_count = 0
        then 'verified'::public.veroxa_readiness_status_v1
      else 'blocked'::public.veroxa_readiness_status_v1
    end,
    required_count > 0 and verified_count = required_count and blocker_count = 0
  from summary;
$$;
revoke all on function public.veroxa_momo_readiness_summary_v1(uuid) from public, anon;
grant execute on function public.veroxa_momo_readiness_summary_v1(uuid) to authenticated;

-- Empty structural rows only: no owner facts, claims, links, metrics, media,
-- content, or platform connection is invented by this migration.
insert into public.veroxa_onboarding_steps (restaurant_id, step_key, title, position)
select scope.restaurant_id, seed.step_key, seed.title, seed.position
from veroxa_private.operational_restaurant_scope scope
cross join (values
  ('welcome','Welcome',1),
  ('restaurant_profile','Restaurant profile',2),
  ('contacts','Contacts',3),
  ('business_identity','Business identity',4),
  ('brand_voice','Brand voice',5),
  ('media_intake','Media intake',6),
  ('presence_stack','Required presence stack',7),
  ('online_ordering','Online ordering',8),
  ('access_permissions','Access and permissions',9),
  ('client_training','Client training',10),
  ('final_confirmation','Final confirmation',11)
) seed(step_key, title, position)
where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
on conflict (restaurant_id, step_key) do nothing;

insert into public.veroxa_restaurant_truth_fields (
  restaurant_id, field_key, section, value_json, status, source, is_current
)
select scope.restaurant_id, seed.field_key, seed.section, '{}'::jsonb,
  'unverified'::public.veroxa_truth_status_v1, 'import', true
from veroxa_private.operational_restaurant_scope scope
cross join (values
  ('identity.display_name','identity'),('identity.legal_name','identity'),
  ('identity.cuisine','identity'),('address.primary','address'),
  ('phone.primary','phone'),('hours.regular','hours'),('hours.special','hours'),
  ('menu.primary','menu'),('services.active','services'),
  ('services.delivery','services'),('services.catering','services'),
  ('claims.dietary','claims'),('claims.halal','claims'),
  ('brand.voice','brand'),('brand.positioning','brand'),
  ('goals.primary','goals'),('goals.audience','goals'),
  ('goals.customer_action','goals')
) seed(field_key, section)
where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
on conflict do nothing;

insert into public.veroxa_presence_profiles (restaurant_id, provider)
select scope.restaurant_id, seed.provider
from veroxa_private.operational_restaurant_scope scope
cross join (values
  ('website'),('google_business'),('facebook'),('instagram'),
  ('doordash'),('uber_eats'),('grubhub')
) seed(provider)
where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
on conflict (restaurant_id, provider) do nothing;

insert into public.veroxa_provider_connections (restaurant_id, provider, status)
select scope.restaurant_id, seed.provider,
  'not_connected'::public.veroxa_connection_status_v1
from veroxa_private.operational_restaurant_scope scope
cross join (values ('meta'),('google_business')) seed(provider)
where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
on conflict (restaurant_id, provider) do nothing;

insert into public.veroxa_readiness_dimensions (restaurant_id, dimension_key, label)
select scope.restaurant_id, seed.dimension_key, seed.label
from veroxa_private.operational_restaurant_scope scope
cross join (values
  ('production_foundation','Production foundation'),
  ('team_identity_and_access','Team identity and authenticated access'),
  ('business_truth_and_onboarding','Business truth and onboarding'),
  ('media_and_rights','Media, rights, and intelligence'),
  ('ai_and_automation','AI and safe automation'),
  ('meta_social','Meta social handling'),
  ('google_seo_and_reviews','Google, local SEO, and reviews'),
  ('website_menu_and_ordering','Website, menu, and ordering paths'),
  ('operations_reporting_and_monitoring','Operations, reporting, and monitoring'),
  ('activation_and_recovery','Activation and recovery')
) seed(dimension_key, label)
where scope.scope_key = 'momo_house_san_antonio' and scope.enabled
on conflict (restaurant_id, dimension_key) do nothing;

comment on function public.veroxa_momo_readiness_summary_v1(uuid) is
  'Team-only fail-closed readiness summary. Clients receive readiness through the sanitized snapshot. Activation is true only when every required Momo dimension is verified with no blocker.';
