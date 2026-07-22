-- Momo-only, zero-new-spend preconnection foundation.
-- External calls, provider writes, website writes, review replies, and live AI remain disabled.

create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.veroxa_momo_evidence_authorities (
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  user_id uuid not null references public.veroxa_user_profiles(user_id),
  evidence_class text not null check (evidence_class in ('development_proxy','real_owner')),
  active boolean not null default true,
  assigned_by uuid not null references public.veroxa_user_profiles(user_id),
  assigned_at timestamptz not null default now(),
  retired_at timestamptz,
  notes text,
  primary key (restaurant_id, user_id),
  check ((active and retired_at is null) or (not active and retired_at is not null)),
  check (notes is null or char_length(notes) <= 2000)
);

create table if not exists public.veroxa_growth_evidence_sources (
  evidence_key text primary key check (evidence_key ~ '^[a-z0-9_]{3,100}$'),
  area text not null check (area in ('google_business','reviews','meta','media','seo','tracking','claims','experiments')),
  title text not null,
  publisher text not null,
  source_url text not null check (source_url ~ '^https://'),
  retrieved_on date not null,
  product_requirement text not null,
  guardrails jsonb not null check (jsonb_typeof(guardrails) = 'array' and jsonb_array_length(guardrails) > 0),
  evidence_version text not null default '2026-07-16-v1',
  content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.veroxa_growth_evidence_sources
  add column if not exists content_sha256 text
  check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$');

create table if not exists public.veroxa_momo_action_consents (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  action_kind text not null check (action_kind in (
    'business_profile_change','review_reply','google_post','social_post','website_change','access_connection'
  )),
  subject_key text not null check (subject_key ~ '^[a-z0-9][a-z0-9:_-]{2,159}$'),
  client_description text not null check (char_length(btrim(client_description)) between 10 and 1000),
  scope_snapshot jsonb not null check (jsonb_typeof(scope_snapshot) = 'object'),
  consent_version text not null default 'momo-action-consent-v1' check (consent_version = 'momo-action-consent-v1'),
  consent_sha256 text not null check (consent_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending','approved','rejected','revoked','expired')),
  requested_by uuid not null references public.veroxa_user_profiles(user_id),
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  decided_by uuid references public.veroxa_user_profiles(user_id),
  decided_at timestamptz,
  decision_notes text check (decision_notes is null or char_length(decision_notes) <= 2000),
  revoked_by uuid references public.veroxa_user_profiles(user_id),
  revoked_at timestamptz,
  revocation_notes text check (revocation_notes is null or char_length(btrim(revocation_notes)) between 10 and 2000),
  evidence_class text not null default 'unknown' check (evidence_class in ('unknown','real_owner')),
  created_at timestamptz not null default now(),
  check (expires_at > requested_at and expires_at <= requested_at + interval '30 days'),
  check ((status in ('approved','rejected') and decided_by is not null and decided_at is not null
      and revoked_by is null and revoked_at is null)
    or (status = 'revoked' and decided_by is not null and decided_at is not null
      and revoked_by is not null and revoked_at is not null)
    or (status in ('pending','expired') and decided_by is null and decided_at is null
      and revoked_by is null and revoked_at is null)),
  check (status <> 'approved' or evidence_class = 'real_owner')
);

create table if not exists public.veroxa_external_content_cache (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  source text not null check (source in ('google_business','search_console','google_analytics','meta')),
  cache_key text not null check (char_length(cache_key) between 3 and 200),
  payload jsonb not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  fetched_at timestamptz not null,
  expires_at timestamptz not null,
  deleted_at timestamptz,
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  unique (restaurant_id, source, cache_key, fetched_at),
  check (octet_length(payload::text) <= 1048576),
  check (expires_at > fetched_at and expires_at <= fetched_at + interval '30 days'),
  check (deleted_at is null or deleted_at >= fetched_at)
);

alter table public.veroxa_restaurant_truth_fields
  add column if not exists evidence_class text not null default 'unknown'
  check (evidence_class in ('unknown','development_proxy','synthetic','real_owner'));

alter table public.veroxa_confirmations
  add column if not exists evidence_class text not null default 'unknown'
  check (evidence_class in ('unknown','development_proxy','synthetic','real_owner'));

alter table public.veroxa_media_rights
  add column if not exists evidence_class text not null default 'unknown'
  check (evidence_class in ('unknown','development_proxy','synthetic','real_owner'));

alter table public.veroxa_ai_jobs
  add column if not exists rehearsal_contract_version text
    check (rehearsal_contract_version is null or rehearsal_contract_version = 'momo-ai-contract-rehearsal-v1'),
  add column if not exists rehearsal_subject_key text
    check (rehearsal_subject_key is null or rehearsal_subject_key ~ '^[a-z0-9][a-z0-9:_-]{2,159}$'),
  add column if not exists input_sha256 text
    check (input_sha256 is null or input_sha256 ~ '^[0-9a-f]{64}$'),
  add column if not exists output_sha256 text
    check (output_sha256 is null or output_sha256 ~ '^[0-9a-f]{64}$'),
  add column if not exists grounding_report jsonb not null default '{}'::jsonb
    check (jsonb_typeof(grounding_report) = 'object'),
  add column if not exists evidence_keys jsonb not null default '[]'::jsonb
    check (jsonb_typeof(evidence_keys) = 'array'),
  add column if not exists evidence_class text not null default 'unknown'
    check (evidence_class in ('unknown','development_proxy','synthetic','real_owner')),
  add column if not exists execution_mode text not null default 'blocked'
    check (execution_mode in ('blocked','rehearsal','live')),
  add column if not exists provider_called boolean not null default false,
  add column if not exists external_write_allowed boolean not null default false,
  add column if not exists human_review_required boolean not null default true,
  add column if not exists idempotency_sha256 text
    check (idempotency_sha256 is null or idempotency_sha256 ~ '^[0-9a-f]{64}$'),
  add column if not exists rehearsal_attested_at timestamptz;

alter table public.veroxa_visibility_snapshots
  add column if not exists schema_version text
    check (schema_version is null or schema_version = 'momo-metrics-rehearsal-v1'),
  add column if not exists snapshot_sha256 text
    check (snapshot_sha256 is null or snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  add column if not exists evidence_class text not null default 'unknown'
    check (evidence_class in ('unknown','synthetic','development_proxy','real_owner')),
  add column if not exists execution_mode text not null default 'unclassified'
    check (execution_mode in ('unclassified','rehearsal','live')),
  add column if not exists external_write_allowed boolean not null default false,
  add column if not exists recorded_by uuid references public.veroxa_user_profiles(user_id);

alter table public.veroxa_visibility_snapshots
  drop constraint if exists veroxa_visibility_snapshots_source_check;
alter table public.veroxa_visibility_snapshots
  add constraint veroxa_visibility_snapshots_source_check check (source in (
    'google_business','google_search','website','manual_baseline','facebook','instagram'
  ));

create or replace function veroxa_private.momo_ai_contract_valid_v1(
  p_restaurant_id uuid, p_input jsonb, p_output jsonb,
  p_grounding jsonb, p_evidence_keys jsonb
) returns boolean language plpgsql immutable set search_path = ''
as $$
declare fact jsonb; fact_key text; fact_keys text[] := array[]::text[];
  channel text; variant jsonb; expected_caption text;
  expected_alt_text constant text := 'Synthetic Momo workflow card used only for Team preconnection testing.';
begin
  if jsonb_typeof(p_input) is distinct from 'object'
    or not coalesce(p_input ?& array['restaurantId','restaurantName','objective','facts','channels'], false)
    or p_input - array['restaurantId','restaurantName','objective','facts','channels'] <> '{}'::jsonb
    or jsonb_typeof(p_input -> 'restaurantId') is distinct from 'string'
    or p_input ->> 'restaurantId' is distinct from p_restaurant_id::text
    or jsonb_typeof(p_input -> 'restaurantName') is distinct from 'string'
    or p_input ->> 'restaurantName' is distinct from 'Momo''s House San Antonio'
    or jsonb_typeof(p_input -> 'objective') is distinct from 'string'
    or char_length(btrim(p_input ->> 'objective')) not between 10 and 500
    or jsonb_typeof(p_input -> 'facts') is distinct from 'array'
    or jsonb_typeof(p_input -> 'channels') is distinct from 'array'
    or p_input -> 'channels' <> '["facebook","instagram","google_business"]'::jsonb then
    return false;
  end if;
  if jsonb_array_length(p_input -> 'facts') not between 1 and 30 then return false; end if;
  for fact in select value from jsonb_array_elements(p_input -> 'facts') loop
    if jsonb_typeof(fact) is distinct from 'object'
      or not coalesce(fact ?& array['key','value','evidenceClass'], false)
      or fact - array['key','value','evidenceClass'] <> '{}'::jsonb
      or jsonb_typeof(fact -> 'key') is distinct from 'string'
      or jsonb_typeof(fact -> 'value') is distinct from 'string'
      or jsonb_typeof(fact -> 'evidenceClass') is distinct from 'string'
      or fact ->> 'key' !~ '^[a-z0-9_:-]{3,100}$'
      or char_length(btrim(fact ->> 'value')) not between 1 and 500
      or fact ->> 'evidenceClass' not in ('synthetic','development_proxy') then
      return false;
    end if;
    fact_key := fact ->> 'key';
    if fact_key = any(fact_keys) then return false; end if;
    fact_keys := array_append(fact_keys, fact_key);
  end loop;
  if fact_keys <> (select array_agg(item.value order by item.value)
    from unnest(fact_keys) item(value)) then return false; end if;

  -- This provider-disconnected rehearsal is deliberately deterministic. The
  -- database derives the only accepted output, so a caller cannot smuggle an
  -- unsupported promotion into a self-attested claims=[] payload.
  expected_caption := (p_input ->> 'restaurantName')
    || ' content workflow rehearsal. Final wording, facts, media, timing, and account actions require Team review and real-owner approval before public use.';

  if jsonb_typeof(p_output) is distinct from 'object'
    or not coalesce(p_output ?& array['caption','altText','channelVariants','claims'], false)
    or p_output - array['caption','altText','channelVariants','claims'] <> '{}'::jsonb
    or jsonb_typeof(p_output -> 'caption') is distinct from 'string'
    or p_output ->> 'caption' is distinct from expected_caption
    or jsonb_typeof(p_output -> 'altText') is distinct from 'string'
    or p_output ->> 'altText' is distinct from expected_alt_text
    or jsonb_typeof(p_output -> 'channelVariants') is distinct from 'object'
    or not coalesce((p_output -> 'channelVariants') ?& array['facebook','instagram','google_business'], false)
    or (p_output -> 'channelVariants') - array['facebook','instagram','google_business'] <> '{}'::jsonb
    or p_output -> 'claims' is distinct from '[]'::jsonb
    or p_output::text ~* '(best|guaranteed|fresh daily|number[ ]*one|#[ ]*1|halal)'
    or p_output::text ~* '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}' then
    return false;
  end if;
  foreach channel in array array['facebook','instagram','google_business'] loop
    variant := (p_output -> 'channelVariants') -> channel;
    if jsonb_typeof(variant) is distinct from 'string'
      or variant #>> '{}' is distinct from expected_caption then return false; end if;
  end loop;

  if jsonb_typeof(p_grounding) is distinct from 'object'
    or not coalesce(p_grounding ?& array['allClaimsSupported','unsupportedClaims','factKeysUsed','blockedLiveReasons'], false)
    or p_grounding - array['allClaimsSupported','unsupportedClaims','factKeysUsed','blockedLiveReasons'] <> '{}'::jsonb
    or p_grounding -> 'allClaimsSupported' is distinct from 'true'::jsonb
    or p_grounding -> 'unsupportedClaims' is distinct from '[]'::jsonb
    or p_grounding -> 'factKeysUsed' is distinct from to_jsonb(fact_keys)
    or p_grounding -> 'blockedLiveReasons' is distinct from
      '["real_owner_evidence_required","human_review_required","provider_connection_required","exact_action_consent_required","external_writes_disabled"]'::jsonb
    or p_evidence_keys is distinct from
      '["google_people_first_content","ftc_truthful_advertising"]'::jsonb then
    return false;
  end if;
  return true;
exception when others then
  return false;
end;
$$;

revoke all on function veroxa_private.momo_ai_contract_valid_v1(uuid,jsonb,jsonb,jsonb,jsonb)
from public, anon, authenticated;

create or replace function veroxa_private.validate_deferred_ai_job_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare subject_exists boolean; expected_input_hash text; expected_output_hash text; expected_fingerprint text;
begin
  new.created_at := now();
  if not public.veroxa_current_user_is_team_for_restaurant(new.restaurant_id)
    or new.created_by is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'momo_team_ai_job_required';
  end if;
  if new.rehearsal_contract_version = 'momo-ai-contract-rehearsal-v1' then
    expected_input_hash := encode(extensions.digest(convert_to(new.input_payload::text, 'UTF8'), 'sha256'), 'hex');
    expected_output_hash := encode(extensions.digest(convert_to(new.output_payload::text, 'UTF8'), 'sha256'), 'hex');
    expected_fingerprint := encode(extensions.digest(convert_to(jsonb_build_object(
      'version','momo-ai-contract-rehearsal-v1','subjectKey',new.rehearsal_subject_key,
      'inputSha256',expected_input_hash,'outputSha256',expected_output_hash,
      'grounding',new.grounding_report,'evidenceKeys',new.evidence_keys
    )::text, 'UTF8'), 'sha256'), 'hex');
    if new.job_kind <> 'caption' or new.subject_type <> 'restaurant'
      or new.subject_id <> new.restaurant_id or new.status <> 'completed'
      or new.provider_key is distinct from 'offline_rehearsal'
      or new.model_key is distinct from 'provider-neutral-structured-output-v1'
      or new.prompt_version is distinct from 'momo-content-contract-v1'
      or new.output_payload is null or new.next_attempt_at is not null
      or new.started_at is null or new.completed_at is null
      or new.attempt_count <> 1 or new.max_attempts <> 1
      or new.rehearsal_subject_key is null
      or new.rehearsal_subject_key !~ '^[a-z0-9][a-z0-9:_-]{2,159}$'
      or new.input_sha256 is distinct from expected_input_hash
      or new.output_sha256 is distinct from expected_output_hash
      or new.idempotency_sha256 is distinct from expected_fingerprint
      or new.rehearsal_attested_at is null
      or new.execution_mode <> 'rehearsal' or new.provider_called
      or new.external_write_allowed or not new.human_review_required
      or new.evidence_class <> 'synthetic'
      or not veroxa_private.momo_ai_contract_valid_v1(
        new.restaurant_id, new.input_payload, new.output_payload,
        new.grounding_report, new.evidence_keys)
      or new.last_error is not null then
      raise exception using errcode = '23514', message = 'invalid_momo_ai_rehearsal_insert';
    end if;
  elsif new.status <> 'blocked'
    or new.provider_key is not null or new.model_key is not null
    or new.output_payload is not null or new.next_attempt_at is not null
    or new.started_at is not null or new.completed_at is not null
    or new.attempt_count <> 0 or new.max_attempts <> 3
    or new.prompt_version is distinct from 'v1-provider-neutral'
    or new.input_payload is distinct from jsonb_build_object('subject_id', new.subject_id)
    or new.safety_flags is distinct from
      '["live_provider_not_connected","human_review_required"]'::jsonb
    or new.last_error is distinct from 'Provider connection not authorized'
    or new.execution_mode <> 'blocked' or new.provider_called
    or new.external_write_allowed or not new.human_review_required
    or new.rehearsal_contract_version is not null or new.rehearsal_subject_key is not null
    or new.input_sha256 is not null or new.output_sha256 is not null
    or new.grounding_report <> '{}'::jsonb or new.evidence_keys <> '[]'::jsonb
    or new.evidence_class <> 'unknown' or new.idempotency_sha256 is not null
    or new.rehearsal_attested_at is not null then
    raise exception using errcode = '23514', message = 'ai_job_must_remain_exact_deferred_fixture';
  end if;
  subject_exists := case new.subject_type
    when 'media_asset' then exists (select 1 from public.veroxa_media_assets row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id)
    when 'content_strategy' then exists (select 1 from public.veroxa_content_strategies row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id)
    when 'content_item' then exists (select 1 from public.veroxa_content_items row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id)
    when 'report' then exists (select 1 from public.veroxa_reports row
      where row.id = new.subject_id and row.restaurant_id = new.restaurant_id)
    when 'restaurant' then new.subject_id = new.restaurant_id and exists (
      select 1 from public.veroxa_restaurants row where row.id = new.restaurant_id)
    else false end;
  if not subject_exists then
    raise exception using errcode = '23503', message = 'ai_job_subject_not_in_momo_scope';
  end if;
  return new;
end;
$$;

drop trigger if exists veroxa_ai_jobs_deferred_only_guard on public.veroxa_ai_jobs;
create trigger veroxa_ai_jobs_deferred_only_guard
before insert on public.veroxa_ai_jobs
for each row execute function veroxa_private.validate_deferred_ai_job_v1();

create table if not exists public.veroxa_momo_runtime_controls (
  restaurant_id uuid primary key references public.veroxa_restaurants(id) on delete cascade,
  ai_live_calls boolean not null default false,
  provider_writes boolean not null default false,
  review_replies boolean not null default false,
  website_writes boolean not null default false,
  external_scheduling boolean not null default false,
  updated_by uuid not null references public.veroxa_user_profiles(user_id),
  updated_at timestamptz not null default now(),
  constraint veroxa_momo_runtime_controls_all_locked check (
    not ai_live_calls and not provider_writes and not review_replies
    and not website_writes and not external_scheduling
  )
);

create table if not exists public.veroxa_media_renditions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  source_kind text not null check (source_kind in ('owner_asset','synthetic_fixture')),
  source_asset_id uuid references public.veroxa_media_assets(id),
  source_key text not null check (source_key ~ '^[a-z0-9-]{3,80}$'),
  source_content_sha256 text not null check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  parent_rendition_id uuid references public.veroxa_media_renditions(id),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  width integer not null check (width > 0 and width <= 8000),
  height integer not null check (height > 0 and height <= 8000),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  recipe_fingerprint text not null check (recipe_fingerprint ~ '^[0-9a-f]{64}$'),
  edit_recipe jsonb not null check (jsonb_typeof(edit_recipe) = 'object'),
  recipe_version text not null default 'momo-image-edit-v1',
  preset_key text not null check (preset_key in (
    'instagram_square','instagram_portrait','instagram_story','facebook_feed','google_business_square','website_hero'
  )),
  intended_use text not null check (intended_use in ('facebook','instagram','google_business','website','internal')),
  alt_text text not null check (char_length(btrim(alt_text)) between 1 and 280),
  evidence_class text not null check (evidence_class in ('development_proxy','synthetic','real_owner')),
  status text not null default 'ready' check (status in ('ready','retired')),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  storage_object_id uuid not null,
  storage_object_version text,
  output_hash_attested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  unique (restaurant_id, recipe_fingerprint),
  check (
    (source_kind = 'owner_asset' and source_asset_id is not null and evidence_class in ('development_proxy','real_owner'))
    or (source_kind = 'synthetic_fixture' and source_asset_id is null and evidence_class = 'synthetic')
  ),
  check ((status = 'ready' and retired_at is null) or (status = 'retired' and retired_at is not null))
);

create table if not exists public.veroxa_content_media_placements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  content_item_id uuid not null references public.veroxa_content_items(id) on delete cascade,
  variant_id uuid references public.veroxa_content_variants(id) on delete cascade,
  source_asset_id uuid not null references public.veroxa_media_assets(id),
  rendition_id uuid not null references public.veroxa_media_renditions(id),
  platform text not null check (platform in ('facebook','instagram','google_business','website','internal')),
  media_role text not null default 'primary' check (media_role in ('primary','carousel','thumbnail','hero')),
  position smallint not null default 0 check (position between 0 and 20),
  alt_text text not null check (char_length(btrim(alt_text)) between 1 and 280),
  placement_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(placement_metadata) = 'object'),
  execution_mode text not null default 'rehearsal' check (execution_mode in ('rehearsal','live')),
  evidence_class text not null check (evidence_class in ('development_proxy','synthetic','real_owner')),
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  check (execution_mode <> 'live' or evidence_class = 'real_owner')
);

create table if not exists public.veroxa_momo_authority_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  user_id uuid not null references public.veroxa_user_profiles(user_id),
  event_kind text not null check (event_kind in ('development_proxy_assigned','real_owner_verified','authority_retired')),
  evidence_snapshot jsonb not null check (jsonb_typeof(evidence_snapshot) = 'object'),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  recorded_by uuid not null references public.veroxa_user_profiles(user_id),
  recorded_at timestamptz not null default now(),
  unique (restaurant_id, user_id, event_kind, evidence_sha256)
);

create table if not exists public.veroxa_momo_release_attestations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  release_key text not null check (release_key ~ '^momo-[a-z0-9-]{3,100}$'),
  commit_sha256 text not null check (commit_sha256 ~ '^[0-9a-f]{64}$'),
  client_artifact_sha256 text not null check (client_artifact_sha256 ~ '^[0-9a-f]{64}$'),
  test_suite_sha256 text not null check (test_suite_sha256 ~ '^[0-9a-f]{64}$'),
  test_count integer not null check (test_count > 0),
  checks jsonb not null check (jsonb_typeof(checks) = 'object'),
  status text not null check (status = 'passed'),
  verifier text not null check (verifier in ('codex_release_runner','github_actions')),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, release_key, client_artifact_sha256, test_suite_sha256)
);

create table if not exists public.veroxa_campaign_tracking_contracts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  subject_key text not null check (subject_key ~ '^[a-z0-9][a-z0-9:_-]{2,159}$'),
  platform text not null check (platform in ('facebook','instagram','google_business','website')),
  destination_url text not null check (destination_url ~ '^https://momohousesa[.]com(/|$)'),
  utm_source text not null check (utm_source ~ '^[a-z0-9_-]{2,100}$'),
  utm_medium text not null check (utm_medium ~ '^[a-z0-9_-]{2,100}$'),
  utm_campaign text not null check (utm_campaign ~ '^[a-z0-9_-]{2,120}$'),
  utm_content text not null check (utm_content ~ '^[a-z0-9_-]{2,120}$'),
  tagged_url text not null,
  mapping_sha256 text not null check (mapping_sha256 ~ '^[0-9a-f]{64}$'),
  evidence_keys jsonb not null check (jsonb_typeof(evidence_keys) = 'array' and jsonb_array_length(evidence_keys) > 0),
  pii_scan_passed boolean not null check (pii_scan_passed),
  evidence_class text not null default 'synthetic' check (evidence_class in ('synthetic','development_proxy','real_owner')),
  execution_mode text not null default 'rehearsal' check (execution_mode = 'rehearsal'),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  unique (restaurant_id, mapping_sha256)
);

create table if not exists public.veroxa_publication_rehearsals (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  subject_key text not null check (subject_key ~ '^[a-z0-9][a-z0-9:_-]{2,159}$'),
  variant_id uuid references public.veroxa_content_variants(id),
  channel text not null check (channel in ('facebook','instagram','google_business')),
  schema_version text not null default 'momo-publication-rehearsal-v1',
  payload_snapshot jsonb not null check (jsonb_typeof(payload_snapshot) = 'object'),
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  approval_snapshot_sha256 text not null check (approval_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  idempotency_key text not null,
  scenario text not null check (scenario in ('success','transient_then_success','permanent_failure')),
  status text not null check (status in ('completed','dead_letter')),
  attempts jsonb not null check (jsonb_typeof(attempts) = 'array' and jsonb_array_length(attempts) between 1 and 5),
  simulated_receipt jsonb not null check (jsonb_typeof(simulated_receipt) = 'object'),
  evidence_class text not null check (evidence_class in ('development_proxy','synthetic','real_owner')),
  execution_mode text not null default 'rehearsal' check (execution_mode = 'rehearsal'),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  unique (restaurant_id, idempotency_key),
  check (coalesce((simulated_receipt ->> 'published')::boolean, false) = false),
  check (simulated_receipt ->> 'externalId' is null),
  check (coalesce((simulated_receipt ->> 'readbackVerified')::boolean, false) = false)
);

create table if not exists public.veroxa_seo_page_baselines (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  page_url text not null check (page_url ~ '^https://'),
  page_type text not null check (page_type in ('home','menu','story','catering','other')),
  observed_at timestamptz not null,
  evidence_snapshot jsonb not null check (jsonb_typeof(evidence_snapshot) = 'object'),
  findings jsonb not null check (jsonb_typeof(findings) = 'array'),
  baseline_sha256 text not null check (baseline_sha256 ~ '^[0-9a-f]{64}$'),
  evidence_class text not null check (evidence_class in ('development_proxy','synthetic','public_evidence','real_owner')),
  execution_mode text not null default 'rehearsal' check (execution_mode = 'rehearsal'),
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  unique (restaurant_id, page_url, baseline_sha256)
);

create table if not exists public.veroxa_seo_change_sets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  baseline_id uuid not null references public.veroxa_seo_page_baselines(id),
  target_url text not null check (target_url ~ '^https://'),
  proposed_changes jsonb not null check (jsonb_typeof(proposed_changes) = 'object'),
  proposed_sha256 text not null check (proposed_sha256 ~ '^[0-9a-f]{64}$'),
  rollback_snapshot jsonb not null check (jsonb_typeof(rollback_snapshot) = 'object'),
  blocked_live_reasons jsonb not null check (jsonb_typeof(blocked_live_reasons) = 'array' and jsonb_array_length(blocked_live_reasons) > 0),
  status text not null default 'draft' check (status in ('draft','approved','applied','verified','rolled_back')),
  evidence_class text not null check (evidence_class in ('development_proxy','synthetic','public_evidence','real_owner')),
  execution_mode text not null default 'rehearsal' check (execution_mode = 'rehearsal'),
  external_write_allowed boolean not null default false check (not external_write_allowed),
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  unique (restaurant_id, baseline_id, proposed_sha256),
  check (status not in ('applied','verified') or false)
);

create table if not exists public.veroxa_preconnection_gate_runs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  status text not null check (status in ('pass','blocked')),
  checks jsonb not null check (jsonb_typeof(checks) = 'object'),
  blockers jsonb not null check (jsonb_typeof(blockers) = 'array'),
  can_request_owner_access boolean not null,
  can_activate boolean not null default false check (not can_activate),
  evaluated_by uuid not null references public.veroxa_user_profiles(user_id),
  evaluated_at timestamptz not null default now(),
  check ((status = 'pass' and can_request_owner_access and jsonb_array_length(blockers) = 0)
    or (status = 'blocked' and not can_request_owner_access and jsonb_array_length(blockers) > 0))
);

create table if not exists public.veroxa_momo_account_handoffs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  source_user_id uuid not null references public.veroxa_user_profiles(user_id),
  replacement_user_id uuid not null references public.veroxa_user_profiles(user_id),
  status text not null default 'prepared' check (status in ('prepared','executed','cancelled')),
  dependency_snapshot jsonb not null check (jsonb_typeof(dependency_snapshot) = 'object'),
  prepared_by uuid not null references public.veroxa_user_profiles(user_id),
  prepared_at timestamptz not null default now(),
  executed_by uuid references public.veroxa_user_profiles(user_id),
  executed_at timestamptz,
  check (source_user_id <> replacement_user_id),
  check ((status = 'executed' and executed_by is not null and executed_at is not null)
    or (status <> 'executed' and executed_by is null and executed_at is null))
);

create index if not exists veroxa_request_messages_restaurant_id_idx
  on public.veroxa_request_messages (restaurant_id, created_at desc);
create index if not exists veroxa_media_renditions_restaurant_source_idx
  on public.veroxa_media_renditions (restaurant_id, source_asset_id, created_at desc);
create index if not exists veroxa_content_media_placements_restaurant_idx
  on public.veroxa_content_media_placements (restaurant_id, content_item_id, platform, position);
create index if not exists veroxa_publication_rehearsals_restaurant_idx
  on public.veroxa_publication_rehearsals (restaurant_id, created_at desc);
create index if not exists veroxa_seo_page_baselines_restaurant_idx
  on public.veroxa_seo_page_baselines (restaurant_id, observed_at desc);
create index if not exists veroxa_seo_change_sets_restaurant_idx
  on public.veroxa_seo_change_sets (restaurant_id, created_at desc);
create index if not exists veroxa_preconnection_gate_runs_restaurant_idx
  on public.veroxa_preconnection_gate_runs (restaurant_id, evaluated_at desc);
create unique index if not exists veroxa_momo_action_consents_pending_idx
  on public.veroxa_momo_action_consents (restaurant_id, action_kind, subject_key)
  where status = 'pending';
create unique index if not exists veroxa_content_media_placements_variant_position_idx
  on public.veroxa_content_media_placements (restaurant_id, content_item_id, variant_id, position)
  where variant_id is not null;
create unique index if not exists veroxa_content_media_placements_content_position_idx
  on public.veroxa_content_media_placements (restaurant_id, content_item_id, platform, position)
  where variant_id is null;
create unique index if not exists veroxa_content_media_placements_primary_idx
  on public.veroxa_content_media_placements (restaurant_id, content_item_id, platform, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where media_role = 'primary';
create index if not exists veroxa_momo_authority_events_restaurant_idx
  on public.veroxa_momo_authority_events (restaurant_id, recorded_at desc);
create index if not exists veroxa_momo_release_attestations_restaurant_idx
  on public.veroxa_momo_release_attestations (restaurant_id, verified_at desc);
create index if not exists veroxa_campaign_tracking_contracts_restaurant_idx
  on public.veroxa_campaign_tracking_contracts (restaurant_id, created_at desc);
create unique index if not exists veroxa_ai_jobs_momo_rehearsal_idempotency_idx
  on public.veroxa_ai_jobs (restaurant_id, idempotency_sha256)
  where rehearsal_contract_version = 'momo-ai-contract-rehearsal-v1';
create unique index if not exists veroxa_visibility_snapshots_momo_rehearsal_dedupe_idx
  on public.veroxa_visibility_snapshots (
    restaurant_id, source, period_start, period_end, snapshot_sha256
  ) where schema_version = 'momo-metrics-rehearsal-v1';

alter table public.veroxa_momo_evidence_authorities enable row level security;
alter table public.veroxa_growth_evidence_sources enable row level security;
alter table public.veroxa_momo_action_consents enable row level security;
alter table public.veroxa_external_content_cache enable row level security;
alter table public.veroxa_momo_runtime_controls enable row level security;
alter table public.veroxa_media_renditions enable row level security;
alter table public.veroxa_content_media_placements enable row level security;
alter table public.veroxa_publication_rehearsals enable row level security;
alter table public.veroxa_seo_page_baselines enable row level security;
alter table public.veroxa_seo_change_sets enable row level security;
alter table public.veroxa_preconnection_gate_runs enable row level security;
alter table public.veroxa_momo_account_handoffs enable row level security;
alter table public.veroxa_momo_authority_events enable row level security;
alter table public.veroxa_momo_release_attestations enable row level security;
alter table public.veroxa_campaign_tracking_contracts enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'veroxa_momo_evidence_authorities','veroxa_momo_action_consents',
    'veroxa_momo_runtime_controls','veroxa_media_renditions',
    'veroxa_content_media_placements','veroxa_publication_rehearsals','veroxa_seo_page_baselines',
    'veroxa_seo_change_sets','veroxa_preconnection_gate_runs','veroxa_momo_account_handoffs',
    'veroxa_momo_authority_events','veroxa_momo_release_attestations','veroxa_campaign_tracking_contracts'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_team_select', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.veroxa_current_user_is_team_for_restaurant(restaurant_id))',
      table_name || '_team_select', table_name
    );
  end loop;
end $$;

drop policy if exists veroxa_growth_evidence_sources_team_select on public.veroxa_growth_evidence_sources;
create policy veroxa_growth_evidence_sources_team_select on public.veroxa_growth_evidence_sources
for select to authenticated using (exists (
  select 1 from public.veroxa_user_profiles profile
  where profile.user_id = (select auth.uid()) and profile.role = 'team' and profile.status = 'active'
));

-- Clients receive an allowlisted projection only through the snapshot RPC. Direct
-- table access would expose scope hashes, requester IDs, and technical scope data.
drop policy if exists veroxa_momo_action_consents_client_select on public.veroxa_momo_action_consents;
drop policy if exists veroxa_external_content_cache_team_select on public.veroxa_external_content_cache;
drop policy if exists veroxa_ai_jobs_team_insert on public.veroxa_ai_jobs;

create or replace function veroxa_private.momo_growth_evidence_row_canonical_v1(
  p_evidence_key text, p_area text, p_title text, p_publisher text,
  p_source_url text, p_retrieved_on date, p_product_requirement text,
  p_guardrails jsonb
) returns text language sql immutable set search_path = ''
as $$
  select 'MGE1R'
    || octet_length(convert_to(p_evidence_key, 'UTF8'))::text || ':' || p_evidence_key
    || octet_length(convert_to(p_area, 'UTF8'))::text || ':' || p_area
    || octet_length(convert_to(p_title, 'UTF8'))::text || ':' || p_title
    || octet_length(convert_to(p_publisher, 'UTF8'))::text || ':' || p_publisher
    || octet_length(convert_to(p_source_url, 'UTF8'))::text || ':' || p_source_url
    || octet_length(convert_to(p_retrieved_on::text, 'UTF8'))::text || ':' || p_retrieved_on::text
    || octet_length(convert_to(p_product_requirement, 'UTF8'))::text || ':' || p_product_requirement
    || octet_length(convert_to(jsonb_array_length(p_guardrails)::text, 'UTF8'))::text
      || ':' || jsonb_array_length(p_guardrails)::text
    || coalesce((select string_agg(
      octet_length(convert_to(item.value, 'UTF8'))::text || ':' || item.value,
      '' order by item.ordinality
    ) from jsonb_array_elements_text(p_guardrails) with ordinality item(value, ordinality)), '');
$$;

revoke all on function veroxa_private.momo_growth_evidence_row_canonical_v1(
  text,text,text,text,text,date,text,jsonb
) from public, anon, authenticated;

insert into public.veroxa_growth_evidence_sources (
  evidence_key, area, title, publisher, source_url, retrieved_on, product_requirement, guardrails
) values
  ('google_local_ranking_factors','google_business','Tips to improve your local ranking on Google','Google Business Profile Help','https://support.google.com/business/answer/7091?hl=en','2026-07-16','Track profile completeness, accuracy, current hours, photos, and review-response work as controllable inputs.','["Never promise rankings","Never imply payment improves local rank","Keep distance outside Veroxa scoring"]'::jsonb),
  ('google_business_representation','google_business','Guidelines for representing your business on Google','Google Business Profile Help','https://support.google.com/business/answer/3038177?hl=en','2026-07-16','Require canonical business name, address, category, regular and special hours, menu details, descriptions, and real prices.','["Use real-world business information","Separate regular and special hours","Block zero-price menu publication"]'::jsonb),
  ('google_api_specific_consent','google_business','Google Business Profile API policies','Google for Developers','https://developers.google.com/my-business/content/policies','2026-07-16','Persist prior specific express consent for each action or clearly bounded batch, notify clients of changes, and enforce cache expiry and disconnect controls.','["No silent listing edits","No silent review replies","No shared credentials","Cache API content no longer than 30 days"]'::jsonb),
  ('google_owner_manager_access','google_business','Manage owners and managers of your Business Profile','Google Business Profile Help','https://support.google.com/business/answer/3403100?hl=en','2026-07-16','Keep Momo as owner or co-owner and request manager access for a separate Veroxa account.','["Never request the owner''s password","Preserve owner control","Support prompt access removal"]'::jsonb),
  ('google_photo_quality','media','Add photos or videos to your Business Profile','Google Business Profile Help','https://support.google.com/business/answer/6123536?hl=en','2026-07-16','Add a Google Business 720×720 preset and quality checks for focus, lighting, truthful representation, JPG/PNG format, and limited alteration.','["Preserve originals","Reject synthetic restaurant or food representation","Label rehearsal fixtures as synthetic"]'::jsonb),
  ('google_review_policy','reviews','Prohibited and restricted content','Google Maps User Contributed Content Policy','https://support.google.com/business/answer/7400114?hl=en','2026-07-16','Make review requests neutral and keep response drafts subject to an exact Momo decision.','["No incentives","No review gating","No selective positive requests","No fake reviews"]'::jsonb),
  ('ftc_reviews_rule','reviews','Consumer Reviews and Testimonials Rule: Questions and Answers','U.S. Federal Trade Commission','https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers','2026-07-16','Block fabricated testimonials, undisclosed incentives, and sentiment-conditioned review solicitation.','["No generated customer testimonials","No purchased reviews","Retain evidence for any endorsement claim"]'::jsonb),
  ('meta_instagram_publishing','meta','Instagram API with Instagram Login: Content Publishing','Meta for Developers','https://developers.facebook.com/documentation/instagram-platform/content-publishing','2026-07-16','Prepare professional-account and Page preflight, immutable container payloads, status checks, publish receipts, idempotency, bounded retry, and quota monitoring.','["No credential assumptions","No published claim without a receipt and read-back","Keep live adapter disabled until access exists"]'::jsonb),
  ('meta_placement_formats','media','Best practices for aspect ratios across placements','Meta Business Help Center','https://www.facebook.com/business/help/103816146375741','2026-07-16','Render 1:1 and 4:5 feed assets plus 9:16 Story/Reel assets with safe-zone preview.','["Do not stretch crops","Preserve source lineage","Keep platform presets versioned"]'::jsonb),
  ('instagram_alt_text','media','Edit the alternative text for a post on Instagram','Instagram Help Center','https://www.facebook.com/help/instagram/503708446705527','2026-07-16','Require useful alt text for image derivatives and media placements.','["Describe meaningful visual content","Do not keyword-stuff alt text"]'::jsonb),
  ('w3c_media_captions','media','Captions/Subtitles','W3C Web Accessibility Initiative','https://www.w3.org/WAI/media/av/captions/','2026-07-16','Require reviewed captions or transcripts before video is considered publication-ready.','["Video remains intake-only until caption and editing QA exist","Keep human review for speech accuracy"]'::jsonb),
  ('google_people_first_content','seo','Creating helpful, reliable, people-first content','Google Search Central','https://developers.google.com/search/docs/fundamentals/creating-helpful-content','2026-07-16','Evaluate whether page and social copy helps real diners and is accurate, original, and locally relevant.','["No scaled low-value pages","No unsupported experience or expertise claims","Generated drafts require factual review"]'::jsonb),
  ('google_title_links','seo','Influencing your title links in search results','Google Search Central','https://developers.google.com/search/docs/appearance/title-link','2026-07-16','Draft unique, concise, descriptive titles and detect keyword stuffing and repeated boilerplate.','["No unsupported superlatives","Do not guarantee the displayed title","Keep before/after and rollback snapshots"]'::jsonb),
  ('google_local_business_schema','seo','Local business structured data','Google Search Central','https://developers.google.com/search/docs/appearance/structured-data/local-business','2026-07-16','Generate Restaurant JSON-LD only from confirmed visible facts and validate it before deployment.','["No self-serving review markup","Do not publish conflicting hours","Structured data must match page content"]'::jsonb),
  ('google_campaign_tagging','tracking','URL builders: Collect campaign data with custom URLs','Google Analytics Help','https://support.google.com/analytics/answer/10917952?hl=en','2026-07-16','Persist normalized UTM source, medium, campaign, and content mappings to each approved item and receipt.','["No PII in campaign parameters","Keep source-of-truth IDs immutable","Treat missing metrics as missing"]'::jsonb),
  ('google_analytics_pii','tracking','Avoid sending personally identifiable information','Google Analytics Help','https://support.google.com/analytics/answer/6366371?hl=en','2026-07-16','Lint tracking parameters and analytics payloads for email addresses, phone numbers, names, and other direct identifiers.','["Block PII before URL generation","Do not copy client contact data into metrics"]'::jsonb),
  ('ftc_truthful_advertising','claims','Advertising and Marketing Basics','U.S. Federal Trade Commission','https://www.ftc.gov/business-guidance/advertising-marketing','2026-07-16','Require support for ranking, freshness, ingredient-source, dietary, health, popularity, award, price, and offer claims.','["Claims must be truthful and non-deceptive","Retain substantiation","Owner confirmation alone does not prove an objective ranking claim"]'::jsonb),
  ('meta_ab_testing','experiments','About A/B tests','Meta Business Help Center','https://www.facebook.com/business/help/942567712892076','2026-07-16','Pre-register one hypothesis, primary variable, metric, audience, and duration; distinguish randomized tests from observational comparisons.','["Do not change multiple variables in a single-variable test","Do not claim causality from observational data","No outcome forecast"]'::jsonb),
  ('copyright_media_rights','media','Copyright and Photography','U.S. Copyright Office','https://www.copyright.gov/engage/photographers/','2026-07-16','Record ownership or permission, allowed channels, expiry, provenance, and revocation before editing, reuse, or publication.','["Preserve the original","Block expired or revoked rights","Keep historical usage records"]'::jsonb)
on conflict (evidence_key) do update set
  area = excluded.area, title = excluded.title, publisher = excluded.publisher,
  source_url = excluded.source_url, retrieved_on = excluded.retrieved_on,
  product_requirement = excluded.product_requirement, guardrails = excluded.guardrails,
  evidence_version = excluded.evidence_version, active = true;

update public.veroxa_growth_evidence_sources evidence set content_sha256 = encode(
  extensions.digest(convert_to(veroxa_private.momo_growth_evidence_row_canonical_v1(
    evidence.evidence_key, evidence.area, evidence.title, evidence.publisher,
    evidence.source_url, evidence.retrieved_on, evidence.product_requirement,
    evidence.guardrails
  ), 'UTF8'), 'sha256'), 'hex'
) where evidence.evidence_version = '2026-07-16-v1';

alter table public.veroxa_growth_evidence_sources alter column content_sha256 set not null;

create or replace function veroxa_private.momo_growth_evidence_manifest_valid_v1(
  p_evidence_version text, p_expected_count integer, p_expected_sha256 text
) returns boolean language sql stable security definer set search_path = ''
as $$
  with evidence_rows as (
    select evidence.evidence_key,
      veroxa_private.momo_growth_evidence_row_canonical_v1(
        evidence.evidence_key, evidence.area, evidence.title, evidence.publisher,
        evidence.source_url, evidence.retrieved_on, evidence.product_requirement,
        evidence.guardrails
      ) as canonical_row,
      evidence.content_sha256
    from public.veroxa_growth_evidence_sources evidence
    where evidence.active and evidence.evidence_version = p_evidence_version
  ), manifest as (
    select count(*)::integer as row_count,
      coalesce(bool_and(content_sha256 = encode(extensions.digest(
        convert_to(canonical_row, 'UTF8'), 'sha256'
      ), 'hex')), false) as row_hashes_valid,
      encode(extensions.digest(convert_to(
        'MGE1M'
        || octet_length(convert_to(p_evidence_version, 'UTF8'))::text || ':' || p_evidence_version
        || octet_length(convert_to(p_expected_count::text, 'UTF8'))::text || ':' || p_expected_count::text
        || coalesce(string_agg(canonical_row, '' order by evidence_key), ''),
        'UTF8'
      ), 'sha256'), 'hex') as manifest_sha256
    from evidence_rows
  )
  select row_count = p_expected_count and row_hashes_valid
    and manifest_sha256 = p_expected_sha256
  from manifest;
$$;

revoke all on function veroxa_private.momo_growth_evidence_manifest_valid_v1(
  text,integer,text
) from public, anon, authenticated;

create or replace function veroxa_private.momo_evidence_class_for_user_v1(
  p_restaurant_id uuid, p_user_id uuid
) returns text
language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select authority.evidence_class
    from public.veroxa_momo_evidence_authorities authority
    where authority.restaurant_id = p_restaurant_id
      and authority.user_id = p_user_id and authority.active
  ), 'unknown');
$$;

revoke all on function veroxa_private.momo_evidence_class_for_user_v1(uuid,uuid) from public, anon, authenticated;

create or replace function veroxa_private.classify_momo_confirmation_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.evidence_class := old.evidence_class;
    return new;
  end if;
  new.evidence_class := veroxa_private.momo_evidence_class_for_user_v1(new.restaurant_id, new.submitted_by);
  return new;
end;
$$;

drop trigger if exists veroxa_classify_momo_confirmation_v1 on public.veroxa_confirmations;
create trigger veroxa_classify_momo_confirmation_v1
before insert or update on public.veroxa_confirmations
for each row execute function veroxa_private.classify_momo_confirmation_v1();

create or replace function veroxa_private.classify_momo_truth_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.owner_confirmed_by is not distinct from old.owner_confirmed_by then
    new.evidence_class := old.evidence_class;
    return new;
  end if;
  new.evidence_class := case when new.owner_confirmed_by is null then 'unknown'
    else veroxa_private.momo_evidence_class_for_user_v1(new.restaurant_id, new.owner_confirmed_by) end;
  return new;
end;
$$;

drop trigger if exists veroxa_classify_momo_truth_v1 on public.veroxa_restaurant_truth_fields;
create trigger veroxa_classify_momo_truth_v1
before insert or update on public.veroxa_restaurant_truth_fields
for each row execute function veroxa_private.classify_momo_truth_v1();

create or replace function veroxa_private.classify_momo_media_rights_v1()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.confirmed_by is not distinct from old.confirmed_by then
    new.evidence_class := old.evidence_class;
    return new;
  end if;
  new.evidence_class := case when new.confirmed_by is null then 'unknown'
    else veroxa_private.momo_evidence_class_for_user_v1(new.restaurant_id, new.confirmed_by) end;
  return new;
end;
$$;

drop trigger if exists veroxa_classify_momo_media_rights_v1 on public.veroxa_media_rights;
create trigger veroxa_classify_momo_media_rights_v1
before insert or update on public.veroxa_media_rights
for each row execute function veroxa_private.classify_momo_media_rights_v1();

-- The temporary iCloud account is explicitly a development proxy, never a real-owner authority.
insert into public.veroxa_momo_evidence_authorities (
  restaurant_id, user_id, evidence_class, active, assigned_by, notes
)
select member.restaurant_id, profile.user_id, 'development_proxy', true, team_member.user_id,
  'Temporary Momo development proxy. Replace with a real-owner account before any live action.'
from public.veroxa_user_profiles profile
join public.veroxa_restaurant_members member
  on member.user_id = profile.user_id and member.role = 'client' and member.status = 'active'
join lateral (
  select candidate.user_id
  from public.veroxa_restaurant_members candidate
  where candidate.restaurant_id = member.restaurant_id
    and candidate.role = 'team' and candidate.status = 'active'
  order by candidate.created_at limit 1
) team_member on true
where lower(profile.email) = 'faraz.munir.gohar@icloud.com'
on conflict (restaurant_id, user_id) do update
set evidence_class = 'development_proxy', active = true, retired_at = null,
    notes = excluded.notes;

insert into public.veroxa_momo_authority_events (
  restaurant_id, user_id, event_kind, evidence_snapshot, evidence_sha256, recorded_by
)
select authority.restaurant_id, authority.user_id, 'development_proxy_assigned',
  jsonb_build_object('source','migration','email','faraz.munir.gohar@icloud.com','purpose','momo_development_proxy'),
  encode(extensions.digest(convert_to(jsonb_build_object(
    'source','migration','email','faraz.munir.gohar@icloud.com','purpose','momo_development_proxy'
  )::text, 'UTF8'), 'sha256'), 'hex'), authority.assigned_by
from public.veroxa_momo_evidence_authorities authority
join public.veroxa_user_profiles profile on profile.user_id = authority.user_id
where lower(profile.email) = 'faraz.munir.gohar@icloud.com'
on conflict (restaurant_id, user_id, event_kind, evidence_sha256) do nothing;

-- Existing terminal confirmations remain immutable. Their submitter authority is
-- resolved through veroxa_momo_evidence_authorities; new submissions carry the
-- classification directly through the insert trigger above.

-- Existing confirmed truth and rights are also immutable. Their actor is
-- classified by the authority table; new revisions receive a row classification.

insert into public.veroxa_momo_runtime_controls (restaurant_id, updated_by)
select restaurant.id, team_member.user_id
from public.veroxa_restaurants restaurant
join lateral (
  select member.user_id from public.veroxa_restaurant_members member
  where member.restaurant_id = restaurant.id and member.role = 'team' and member.status = 'active'
  order by member.created_at limit 1
) team_member on true
where lower(restaurant.name) like '%momo%'
on conflict (restaurant_id) do nothing;

-- Existing live content gates now require explicit real-owner evidence.
create or replace function veroxa_private.content_inputs_current_v1(
  p_content_item_id uuid, p_restaurant_id uuid, p_platform text default null
) returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    exists (
      select 1 from public.veroxa_content_input_ledger input
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and input.input_kind = 'owner_confirmed_truth'
    )
    and exists (
      select 1 from public.veroxa_content_items item
      where item.id = p_content_item_id and item.restaurant_id = p_restaurant_id
        and (
          (item.primary_media_asset_id is null and not exists (
            select 1 from public.veroxa_content_input_ledger media_input
            where media_input.content_item_id = item.id
              and media_input.restaurant_id = item.restaurant_id
              and media_input.input_kind = 'permissioned_media'
          )) or (item.primary_media_asset_id is not null and exists (
            select 1 from public.veroxa_content_input_ledger media_input
            where media_input.content_item_id = item.id
              and media_input.restaurant_id = item.restaurant_id
              and media_input.input_kind = 'permissioned_media'
              and media_input.media_asset_id = item.primary_media_asset_id
          ))
        )
    )
    and not exists (
      select 1
      from public.veroxa_content_input_ledger input
      join public.veroxa_content_items item
        on item.id = input.content_item_id and item.restaurant_id = input.restaurant_id
      left join public.veroxa_restaurant_truth_fields field
        on input.input_kind = 'owner_confirmed_truth'
       and field.id = input.truth_field_id and field.restaurant_id = input.restaurant_id
      left join public.veroxa_media_rights rights
        on input.input_kind = 'permissioned_media'
       and rights.asset_id = input.media_asset_id and rights.restaurant_id = input.restaurant_id
      left join public.veroxa_media_reviews review
        on input.input_kind = 'permissioned_media'
       and review.asset_id = input.media_asset_id and review.restaurant_id = input.restaurant_id
       and review.is_current
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and (
          (input.input_kind = 'owner_confirmed_truth' and (
            field.id is null or not field.is_current or field.status <> 'owner_confirmed'
            or field.evidence_class <> 'real_owner'
            or input.truth_value_sha256 is distinct from
              encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex')
            or input.input_sha256 is distinct from encode(extensions.digest(convert_to(
              concat_ws('|', item.id::text, input.input_kind, field.id::text,
                encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex'),
                item.manual_pillar), 'UTF8'), 'sha256'), 'hex')
          )) or (input.input_kind = 'permissioned_media' and (
            rights.id is null or rights.rights_status <> 'confirmed'
            or rights.evidence_class <> 'real_owner'
            or (rights.valid_from is not null and rights.valid_from > now())
            or (rights.expires_at is not null and rights.expires_at <= now())
            or rights.attestation_version is distinct from input.rights_attestation_version
            or rights.attestation_sha256 is distinct from input.rights_attestation_sha256
            or review.id is null or not review.is_current or review.status <> 'approved'
            or not review.public_use_approved
            or (p_platform is not null and not (rights.usage_scope ? p_platform))
            or input.input_sha256 is distinct from encode(extensions.digest(convert_to(
              concat_ws('|', item.id::text, input.input_kind, rights.asset_id::text,
                rights.attestation_version, rights.attestation_sha256, item.manual_pillar),
              'UTF8'), 'sha256'), 'hex')
          ))
        )
    )
    and not exists (
      select 1
      from public.veroxa_content_input_ledger input
      join public.veroxa_restaurant_truth_fields field
        on field.id = input.truth_field_id and field.restaurant_id = input.restaurant_id
      join lateral (
        select confirmation.* from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = input.restaurant_id
          and confirmation.subject_type = 'truth_field'
          and confirmation.subject_id = input.truth_field_id
        order by confirmation.submitted_at desc, confirmation.created_at desc, confirmation.id desc
        limit 1
      ) latest on true
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and input.input_kind = 'owner_confirmed_truth'
        and not (
          latest.status = 'approved' and latest.decision in ('confirm','correct')
          and latest.evidence_class = 'real_owner'
          and field.owner_confirmed_by = latest.submitted_by
          and field.owner_confirmed_at = latest.submitted_at
        )
    );
$$;

create or replace function veroxa_private.provider_owner_authorization_current_v1(
  p_connection_id uuid, p_restaurant_id uuid
) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_provider_connections connection
    join public.veroxa_user_profiles profile on profile.user_id = connection.owner_authorized_by
    join public.veroxa_restaurant_members member
      on member.user_id = connection.owner_authorized_by
     and member.restaurant_id = connection.restaurant_id
    join public.veroxa_momo_evidence_authorities authority
      on authority.user_id = connection.owner_authorized_by
     and authority.restaurant_id = connection.restaurant_id
     and authority.active and authority.evidence_class = 'real_owner'
    where connection.id = p_connection_id and connection.restaurant_id = p_restaurant_id
      and connection.owner_authorized_by is not null and connection.owner_authorized_at is not null
      and connection.last_verified_at is not null and connection.last_verified_at >= connection.owner_authorized_at
      and profile.role = 'client' and profile.status = 'active'
      and member.role = 'client' and member.status = 'active'
  );
$$;

create or replace function veroxa_private.provider_presence_authority_current_v1(
  p_restaurant_id uuid, p_provider text, p_required_capability text
) returns boolean
language sql stable security definer set search_path = ''
as $$
  with mapped_presence as (
    select case
      when p_provider = 'meta' and p_required_capability = 'facebook_publish' then 'facebook'
      when p_provider = 'meta' and p_required_capability = 'instagram_publish' then 'instagram'
      when p_provider = 'google_business' and p_required_capability in ('google_business_publish','review_reply','business_profile_read') then 'google_business'
      else null end as presence_provider
  )
  select exists (
    select 1
    from mapped_presence mapped
    join public.veroxa_presence_profiles profile
      on profile.restaurant_id = p_restaurant_id and profile.provider = mapped.presence_provider
    join lateral (
      select confirmation.* from public.veroxa_confirmations confirmation
      where confirmation.restaurant_id = profile.restaurant_id
        and confirmation.subject_type = 'presence_profile'
        and confirmation.subject_id = profile.id and confirmation.confirmation_kind = 'presence'
      order by confirmation.submitted_at desc, confirmation.created_at desc, confirmation.id desc
      limit 1
    ) latest on true
    where mapped.presence_provider is not null
      and profile.access_status = 'connected' and profile.truth_status = 'owner_confirmed'
      and latest.status = 'approved' and latest.decision in ('confirm','correct')
      and latest.evidence_class = 'real_owner'
      and coalesce((latest.proposed_value ->> 'accessAuthorized')::boolean, false)
  );
$$;

create or replace function public.veroxa_prepare_momo_ai_job_v1(
  p_restaurant_id uuid, p_job_kind text, p_subject_type text, p_subject_id uuid
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_ai_job_required';
  end if;
  if p_job_kind not in ('media_classification','media_quality','duplicate_detection','content_strategy','caption','platform_variants','report_summary')
    or p_subject_type not in ('restaurant','content_strategy','content_item','media_asset','report')
    or p_subject_id is null
    or (p_subject_type = 'restaurant' and p_subject_id <> p_restaurant_id)
    or (p_subject_type = 'content_item' and not exists (
      select 1 from public.veroxa_content_items item
      where item.id = p_subject_id and item.restaurant_id = p_restaurant_id
    ))
    or (p_subject_type = 'content_strategy' and not exists (
      select 1 from public.veroxa_content_strategies strategy
      where strategy.id = p_subject_id and strategy.restaurant_id = p_restaurant_id
    ))
    or (p_subject_type = 'media_asset' and not exists (
      select 1 from public.veroxa_media_assets asset
      where asset.id = p_subject_id and asset.restaurant_id = p_restaurant_id
    ))
    or (p_subject_type = 'report' and not exists (
      select 1 from public.veroxa_reports report
      where report.id = p_subject_id and report.restaurant_id = p_restaurant_id
    )) then
    raise exception using errcode = '22023', message = 'invalid_momo_ai_job_subject';
  end if;
  insert into public.veroxa_ai_jobs (
    restaurant_id, job_kind, subject_type, subject_id, status,
    provider_key, model_key, prompt_version, input_payload, output_payload,
    safety_flags, attempt_count, max_attempts, last_error, created_by,
    execution_mode, provider_called, external_write_allowed, human_review_required
  ) values (
    p_restaurant_id, p_job_kind, p_subject_type, p_subject_id, 'blocked',
    null, null, 'v1-provider-neutral', jsonb_build_object('subject_id', p_subject_id), null,
    '["live_provider_not_connected","human_review_required"]'::jsonb,
    0, 3, 'Provider connection not authorized', (select auth.uid()),
    'blocked', false, false, true
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.veroxa_record_momo_ai_contract_rehearsal_v1(
  p_restaurant_id uuid, p_subject_key text, p_input_snapshot jsonb,
  p_output_snapshot jsonb, p_grounding_report jsonb, p_evidence_keys jsonb
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare input_hash text; output_hash text; fingerprint text; existing_id uuid; new_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_ai_rehearsal_required';
  end if;
  if p_subject_key is null or p_subject_key !~ '^[a-z0-9][a-z0-9:_-]{2,159}$'
    or not veroxa_private.momo_ai_contract_valid_v1(
      p_restaurant_id, p_input_snapshot, p_output_snapshot,
      p_grounding_report, p_evidence_keys) then
    raise exception using errcode = '22023', message = 'invalid_momo_ai_contract_rehearsal';
  end if;
  input_hash := encode(extensions.digest(convert_to(p_input_snapshot::text, 'UTF8'), 'sha256'), 'hex');
  output_hash := encode(extensions.digest(convert_to(p_output_snapshot::text, 'UTF8'), 'sha256'), 'hex');
  fingerprint := encode(extensions.digest(convert_to(jsonb_build_object(
    'version','momo-ai-contract-rehearsal-v1','subjectKey',p_subject_key,
    'inputSha256',input_hash,'outputSha256',output_hash,'grounding',p_grounding_report,
    'evidenceKeys',p_evidence_keys
  )::text, 'UTF8'), 'sha256'), 'hex');
  select job.id into existing_id from public.veroxa_ai_jobs job
  where job.restaurant_id = p_restaurant_id and job.idempotency_sha256 = fingerprint
    and job.rehearsal_contract_version = 'momo-ai-contract-rehearsal-v1';
  if existing_id is not null then return existing_id; end if;
  insert into public.veroxa_ai_jobs (
    restaurant_id, job_kind, subject_type, subject_id, status,
    provider_key, model_key, prompt_version, input_payload, output_payload,
    safety_flags, attempt_count, max_attempts, created_by, started_at, completed_at,
    rehearsal_contract_version, input_sha256, output_sha256, grounding_report,
    evidence_keys, evidence_class, execution_mode, provider_called,
    external_write_allowed, human_review_required, idempotency_sha256,
    rehearsal_attested_at, rehearsal_subject_key
  ) values (
    p_restaurant_id, 'caption', 'restaurant', p_restaurant_id, 'completed',
    'offline_rehearsal', 'provider-neutral-structured-output-v1', 'momo-content-contract-v1',
    p_input_snapshot, p_output_snapshot,
    '["synthetic_output","human_review_required","provider_disconnected","external_writes_disabled"]'::jsonb,
    1, 1, (select auth.uid()), now(), now(),
    'momo-ai-contract-rehearsal-v1', input_hash, output_hash, p_grounding_report,
    p_evidence_keys, 'synthetic', 'rehearsal', false, false, true, fingerprint, now(),
    p_subject_key
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function veroxa_private.momo_metrics_payload_valid_v1(
  p_source text, p_metrics jsonb
) returns boolean language plpgsql immutable set search_path = ''
as $$
declare required_keys text[];
begin
  required_keys := case p_source
    when 'facebook' then array['impressions','reach','engagements','clicks']
    when 'instagram' then array['impressions','reach','engagements','clicks']
    when 'google_business' then array['views','calls','directions','website_clicks']
    when 'website' then array['sessions','engaged_sessions','conversions']
    else null end;
  if required_keys is null
    or jsonb_typeof(p_metrics) is distinct from 'object'
    or not coalesce(p_metrics ?& required_keys, false)
    or p_metrics - required_keys <> '{}'::jsonb
    or exists (select 1 from jsonb_each(p_metrics) metric
      where jsonb_typeof(metric.value) is distinct from 'number'
        or case when jsonb_typeof(metric.value) = 'number'
          then (metric.value::text)::numeric < 0
            or (metric.value::text)::numeric > 1000000000
            or trunc((metric.value::text)::numeric) <> (metric.value::text)::numeric
          else true end) then
    return false;
  end if;
  return true;
exception when others then
  return false;
end;
$$;

revoke all on function veroxa_private.momo_metrics_payload_valid_v1(text,jsonb)
from public, anon, authenticated;

create or replace function public.veroxa_record_momo_metrics_rehearsal_v1(
  p_restaurant_id uuid, p_source text, p_period_start date,
  p_period_end date, p_metrics jsonb
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare fingerprint text; existing_id uuid; new_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_metrics_rehearsal_required';
  end if;
  if p_period_start is null or p_period_end is null
    or p_period_end < p_period_start or p_period_end - p_period_start > 31
    or p_period_end > current_date
    or not veroxa_private.momo_metrics_payload_valid_v1(p_source, p_metrics) then
    raise exception using errcode = '22023', message = 'invalid_momo_metrics_rehearsal';
  end if;
  fingerprint := encode(extensions.digest(convert_to(jsonb_build_object(
    'version','momo-metrics-rehearsal-v1','restaurantId',p_restaurant_id,
    'source',p_source,'periodStart',p_period_start,'periodEnd',p_period_end,
    'metrics',p_metrics
  )::text, 'UTF8'), 'sha256'), 'hex');
  select snapshot.id into existing_id from public.veroxa_visibility_snapshots snapshot
  where snapshot.restaurant_id = p_restaurant_id and snapshot.source = p_source
    and snapshot.period_start = p_period_start and snapshot.period_end = p_period_end
    and snapshot.snapshot_sha256 = fingerprint
    and snapshot.schema_version = 'momo-metrics-rehearsal-v1';
  if existing_id is not null then return existing_id; end if;
  insert into public.veroxa_visibility_snapshots (
    restaurant_id, source, period_start, period_end, metrics, evidence,
    captured_at, schema_version, snapshot_sha256, evidence_class,
    execution_mode, external_write_allowed, recorded_by
  ) values (
    p_restaurant_id, p_source, p_period_start, p_period_end, p_metrics,
    jsonb_build_array(jsonb_build_object(
      'classification','synthetic','source','offline_metrics_contract',
      'missingMeansZero',false,'crossChannelReachSummed',false,
      'causalityClaimed',false,'roiClaimed',false
    )), now(), 'momo-metrics-rehearsal-v1', fingerprint, 'synthetic',
    'rehearsal', false, (select auth.uid())
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.veroxa_request_momo_action_consent_v1(
  p_restaurant_id uuid, p_action_kind text, p_subject_key text,
  p_client_description text, p_scope_snapshot jsonb, p_expires_at timestamptz
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare fingerprint text; existing_id uuid; new_id uuid; active_fingerprint text;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_action_consent_required';
  end if;
  if p_action_kind is null
    or p_action_kind not in ('business_profile_change','review_reply','google_post','social_post','website_change','access_connection')
    or p_subject_key is null or p_subject_key !~ '^[a-z0-9][a-z0-9:_-]{2,159}$'
    or p_client_description is null
    or char_length(btrim(p_client_description)) not between 10 and 1000
    or jsonb_typeof(p_scope_snapshot) is distinct from 'object'
    or not coalesce(p_scope_snapshot ?& array['target','operation','batchSize'], false)
    or p_scope_snapshot - array['target','operation','before','after','contentPreview','scheduledFor','batchSize'] <> '{}'::jsonb
    or jsonb_typeof(p_scope_snapshot -> 'target') is distinct from 'string'
    or char_length(btrim(p_scope_snapshot ->> 'target')) not between 2 and 200
    or jsonb_typeof(p_scope_snapshot -> 'operation') is distinct from 'string'
    or char_length(btrim(p_scope_snapshot ->> 'operation')) not between 2 and 200
    or (p_scope_snapshot ? 'contentPreview' and (
      jsonb_typeof(p_scope_snapshot -> 'contentPreview') is distinct from 'string'
      or char_length(btrim(p_scope_snapshot ->> 'contentPreview')) not between 1 and 2000))
    or (p_scope_snapshot ? 'scheduledFor' and (
      jsonb_typeof(p_scope_snapshot -> 'scheduledFor') <> 'string'
      or not veroxa_private.momo_iso_utc_timestamp_valid_v1(
        p_scope_snapshot ->> 'scheduledFor')))
    or jsonb_typeof(p_scope_snapshot -> 'batchSize') is distinct from 'number'
    or (p_scope_snapshot ->> 'batchSize')::numeric not between 1 and 50
    or trunc((p_scope_snapshot ->> 'batchSize')::numeric) <> (p_scope_snapshot ->> 'batchSize')::numeric
    or (p_scope_snapshot ? 'before' and (
      jsonb_typeof(p_scope_snapshot -> 'before') not in ('string','number','boolean','null')
      or char_length((p_scope_snapshot -> 'before')::text) > 2000))
    or (p_scope_snapshot ? 'after' and (
      jsonb_typeof(p_scope_snapshot -> 'after') not in ('string','number','boolean','null')
      or char_length((p_scope_snapshot -> 'after')::text) > 2000))
    or (p_action_kind = 'business_profile_change' and (
      not (p_scope_snapshot ? 'before' and p_scope_snapshot ? 'after')
      or jsonb_typeof(p_scope_snapshot -> 'before') is distinct from 'string'
      or jsonb_typeof(p_scope_snapshot -> 'after') is distinct from 'string'
      or p_scope_snapshot -> 'before' = p_scope_snapshot -> 'after'
      or char_length(btrim(p_scope_snapshot ->> 'before')) = 0
      or char_length(btrim(p_scope_snapshot ->> 'after')) = 0
    ))
    or (p_action_kind in ('review_reply','google_post','social_post','website_change')
      and not (
        (jsonb_typeof(p_scope_snapshot -> 'contentPreview') is not distinct from 'string'
          and char_length(btrim(p_scope_snapshot ->> 'contentPreview')) between 1 and 2000)
        or (jsonb_typeof(p_scope_snapshot -> 'after') is not distinct from 'string'
          and char_length(btrim(p_scope_snapshot ->> 'after')) between 1 and 2000)
      ))
    or p_expires_at is null or p_expires_at <= now()
    or p_expires_at > now() + interval '30 days' then
    raise exception using errcode = '22023', message = 'invalid_momo_action_consent_request';
  end if;
  fingerprint := encode(extensions.digest(convert_to(jsonb_build_object(
    'version','momo-action-consent-v1','actionKind',p_action_kind,
    'subjectKey',p_subject_key,'description',btrim(p_client_description),'scope',p_scope_snapshot
  )::text, 'UTF8'), 'sha256'), 'hex');
  update public.veroxa_momo_action_consents consent set status = 'expired'
  where consent.restaurant_id = p_restaurant_id and consent.action_kind = p_action_kind
    and consent.subject_key = p_subject_key
    and consent.status = 'pending' and consent.expires_at <= now();
  select consent.id, consent.consent_sha256 into existing_id, active_fingerprint
  from public.veroxa_momo_action_consents consent
  where consent.restaurant_id = p_restaurant_id and consent.action_kind = p_action_kind
    and consent.subject_key = p_subject_key
    and consent.status in ('pending','approved') and consent.expires_at > now()
  order by case consent.status when 'approved' then 0 else 1 end, consent.requested_at desc
  limit 1;
  if existing_id is not null and active_fingerprint = fingerprint then return existing_id; end if;
  if existing_id is not null then
    raise exception using errcode = '23505', message = 'different_active_momo_action_consent_exists';
  end if;
  insert into public.veroxa_momo_action_consents (
    restaurant_id, action_kind, subject_key, client_description, scope_snapshot,
    consent_sha256, requested_by, expires_at
  ) values (
    p_restaurant_id, p_action_kind, p_subject_key, btrim(p_client_description),
    p_scope_snapshot, fingerprint, (select auth.uid()), p_expires_at
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.veroxa_decide_momo_action_consent_v1(
  p_consent_id uuid, p_decision text, p_notes text default null
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare consent_record public.veroxa_momo_action_consents%rowtype; actor_id uuid := (select auth.uid());
begin
  select * into consent_record from public.veroxa_momo_action_consents consent
  where consent.id = p_consent_id for update;
  if not found or actor_id is null
    or not public.veroxa_current_user_has_active_restaurant(consent_record.restaurant_id)
    or veroxa_private.momo_evidence_class_for_user_v1(consent_record.restaurant_id, actor_id) <> 'real_owner' then
    raise exception using errcode = '42501', message = 'momo_real_owner_action_consent_required';
  end if;
  if consent_record.status <> 'pending' or consent_record.expires_at <= now()
    or p_decision not in ('approved','rejected') or char_length(coalesce(p_notes,'')) > 2000 then
    raise exception using errcode = '23514', message = 'invalid_momo_action_consent_decision';
  end if;
  update public.veroxa_momo_action_consents
  set status = p_decision, decided_by = actor_id, decided_at = now(),
      decision_notes = nullif(btrim(p_notes), ''), evidence_class = 'real_owner'
  where id = consent_record.id;
  return consent_record.id;
end;
$$;

create or replace function public.veroxa_revoke_momo_action_consent_v1(
  p_consent_id uuid, p_reason text
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare consent_record public.veroxa_momo_action_consents%rowtype; actor_id uuid := (select auth.uid());
begin
  select * into consent_record from public.veroxa_momo_action_consents consent
  where consent.id = p_consent_id for update;
  if not found or actor_id is null
    or not public.veroxa_current_user_has_active_restaurant(consent_record.restaurant_id)
    or veroxa_private.momo_evidence_class_for_user_v1(consent_record.restaurant_id, actor_id) <> 'real_owner' then
    raise exception using errcode = '42501', message = 'momo_real_owner_action_consent_required';
  end if;
  if consent_record.status <> 'approved' or char_length(btrim(coalesce(p_reason,''))) not between 10 and 2000 then
    raise exception using errcode = '23514', message = 'invalid_momo_action_consent_revocation';
  end if;
  update public.veroxa_momo_action_consents set status = 'revoked', revoked_by = actor_id,
    revoked_at = now(), revocation_notes = btrim(p_reason) where id = consent_record.id;
  return consent_record.id;
end;
$$;

create or replace function public.veroxa_validate_momo_action_consent_v1(
  p_restaurant_id uuid, p_consent_id uuid, p_action_kind text,
  p_subject_key text, p_scope_snapshot jsonb
) returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare consent_record public.veroxa_momo_action_consents%rowtype; fingerprint text;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_action_consent_validation_required';
  end if;
  select * into consent_record from public.veroxa_momo_action_consents consent
  where consent.id = p_consent_id and consent.restaurant_id = p_restaurant_id;
  if not found then return false; end if;
  fingerprint := encode(extensions.digest(convert_to(jsonb_build_object(
    'version',consent_record.consent_version,'actionKind',p_action_kind,
    'subjectKey',p_subject_key,'description',consent_record.client_description,'scope',p_scope_snapshot
  )::text, 'UTF8'), 'sha256'), 'hex');
  return consent_record.action_kind = p_action_kind
    and consent_record.subject_key = p_subject_key
    and consent_record.scope_snapshot = p_scope_snapshot
    and consent_record.consent_sha256 = fingerprint
    and consent_record.status = 'approved' and consent_record.expires_at > now()
    and consent_record.evidence_class = 'real_owner'
    and exists (
      select 1 from public.veroxa_user_profiles profile
      join public.veroxa_restaurant_members member
        on member.user_id = profile.user_id
        and member.restaurant_id = consent_record.restaurant_id
      join public.veroxa_momo_evidence_authorities authority
        on authority.user_id = profile.user_id
        and authority.restaurant_id = member.restaurant_id
      where profile.user_id = consent_record.decided_by
        and profile.role = 'client' and profile.status = 'active'
        and member.role = 'client' and member.status = 'active'
        and authority.active and authority.evidence_class = 'real_owner'
    );
end;
$$;

create or replace function public.veroxa_assign_momo_real_owner_authority_v1(
  p_restaurant_id uuid, p_owner_email text, p_verification_evidence jsonb
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare owner_id uuid; evidence_hash text; actor_id uuid := (select auth.uid());
  evidence_verified_at timestamptz;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_owner_authority_required';
  end if;
  if p_owner_email is null
    or lower(btrim(p_owner_email)) = 'faraz.munir.gohar@icloud.com'
    or jsonb_typeof(p_verification_evidence) is distinct from 'object'
    or not coalesce(p_verification_evidence ?& array['method','verifiedAt','details'], false)
    or p_verification_evidence - array['method','verifiedAt','details'] <> '{}'::jsonb
    or jsonb_typeof(p_verification_evidence -> 'method') is distinct from 'string'
    or jsonb_typeof(p_verification_evidence -> 'verifiedAt') is distinct from 'string'
    or jsonb_typeof(p_verification_evidence -> 'details') is distinct from 'string'
    or p_verification_evidence ->> 'method' is null
    or p_verification_evidence ->> 'method' not in ('owner_meeting','signed_authorization','verified_manager_invite')
    or p_verification_evidence ->> 'verifiedAt' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{3})?Z$'
    or char_length(btrim(coalesce(p_verification_evidence ->> 'details',''))) not between 10 and 1000 then
    raise exception using errcode = '22023', message = 'verified_momo_owner_evidence_required';
  end if;
  begin
    evidence_verified_at := (p_verification_evidence ->> 'verifiedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'verified_momo_owner_evidence_required';
  end;
  if evidence_verified_at < now() - interval '30 days'
    or evidence_verified_at > now() + interval '5 minutes' then
    raise exception using errcode = '22023', message = 'verified_momo_owner_evidence_required';
  end if;
  select profile.user_id into owner_id from public.veroxa_user_profiles profile
  join public.veroxa_restaurant_members member on member.user_id = profile.user_id
    and member.restaurant_id = p_restaurant_id and member.role = 'client' and member.status = 'active'
  where lower(profile.email) = lower(btrim(p_owner_email)) and profile.role = 'client' and profile.status = 'active';
  if owner_id is null then
    raise exception using errcode = '23503', message = 'active_momo_owner_account_required';
  end if;
  evidence_hash := encode(extensions.digest(convert_to(p_verification_evidence::text, 'UTF8'), 'sha256'), 'hex');
  insert into public.veroxa_momo_evidence_authorities (
    restaurant_id, user_id, evidence_class, active, assigned_by, notes
  ) values (p_restaurant_id, owner_id, 'real_owner', true, actor_id,
    'Verified real-owner authority; see immutable authority event.')
  on conflict (restaurant_id, user_id) do update set evidence_class = 'real_owner', active = true,
    retired_at = null, assigned_by = actor_id, assigned_at = now(), notes = excluded.notes;
  insert into public.veroxa_momo_authority_events (
    restaurant_id, user_id, event_kind, evidence_snapshot, evidence_sha256, recorded_by
  ) values (p_restaurant_id, owner_id, 'real_owner_verified', p_verification_evidence, evidence_hash, actor_id)
  on conflict (restaurant_id, user_id, event_kind, evidence_sha256) do nothing;
  return owner_id;
end;
$$;

create or replace function veroxa_private.purge_expired_momo_external_cache_v1()
returns bigint language plpgsql security definer set search_path = ''
as $$
declare removed bigint;
begin
  delete from public.veroxa_external_content_cache cache
  where cache.expires_at <= now() or cache.deleted_at is not null;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function veroxa_private.purge_expired_momo_external_cache_v1() from public, anon, authenticated;

create or replace function public.veroxa_cache_momo_external_content_v1(
  p_restaurant_id uuid, p_source text, p_cache_key text, p_payload jsonb,
  p_fetched_at timestamptz, p_expires_at timestamptz
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare payload_hash text; new_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_external_cache_required';
  end if;
  if p_source not in ('google_business','search_console','google_analytics','meta')
    or char_length(p_cache_key) not between 3 and 200
    or p_payload is null or octet_length(p_payload::text) > 1048576
    or p_fetched_at is null or p_expires_at is null
    or p_fetched_at > now() + interval '5 minutes'
    or p_expires_at <= now()
    or p_expires_at <= p_fetched_at
    -- Daily purge plus a 29-day admission cap guarantees physical retention
    -- stays below the evidence policy's 30-day ceiling.
    or p_expires_at > least(p_fetched_at + interval '29 days', now() + interval '29 days') then
    raise exception using errcode = '22023', message = 'invalid_momo_external_cache_record';
  end if;
  payload_hash := encode(extensions.digest(convert_to(p_payload::text, 'UTF8'), 'sha256'), 'hex');
  insert into public.veroxa_external_content_cache (
    restaurant_id, source, cache_key, payload, payload_sha256,
    fetched_at, expires_at, created_by
  ) values (
    p_restaurant_id, p_source, p_cache_key, p_payload, payload_hash,
    p_fetched_at, p_expires_at, (select auth.uid())
  ) returning id into new_id;
  perform veroxa_private.purge_expired_momo_external_cache_v1();
  return new_id;
end;
$$;

create or replace function public.veroxa_read_momo_external_content_cache_v1(
  p_restaurant_id uuid, p_source text, p_cache_key text
) returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_external_cache_required';
  end if;
  return (select jsonb_build_object(
    'source', cache.source, 'cacheKey', cache.cache_key, 'payload', cache.payload,
    'payloadSha256', cache.payload_sha256, 'fetchedAt', cache.fetched_at, 'expiresAt', cache.expires_at
  ) from public.veroxa_external_content_cache cache
  where cache.restaurant_id = p_restaurant_id and cache.source = p_source
    and cache.cache_key = p_cache_key and cache.deleted_at is null and cache.expires_at > now()
  order by cache.fetched_at desc limit 1);
end;
$$;

create or replace function public.veroxa_purge_momo_external_content_cache_v1(
  p_restaurant_id uuid
) returns bigint language plpgsql security definer set search_path = ''
as $$
declare removed bigint;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_external_cache_required';
  end if;
  delete from public.veroxa_external_content_cache cache
  where cache.restaurant_id = p_restaurant_id
    and (cache.expires_at <= now() or cache.deleted_at is not null);
  get diagnostics removed = row_count;
  return removed;
end;
$$;

do $$
declare existing_job record; has_valid_job boolean := false;
begin
  select jobid, schedule, command, active into existing_job from cron.job
  where jobname = 'veroxa-momo-external-cache-purge';
  if found then
    if existing_job.schedule = '17 3 * * *'
      and existing_job.command = 'select veroxa_private.purge_expired_momo_external_cache_v1();'
      and existing_job.active then
      has_valid_job := true;
    else
      perform cron.unschedule(existing_job.jobid);
    end if;
  end if;
  if not has_valid_job then
    perform cron.schedule(
      'veroxa-momo-external-cache-purge', '17 3 * * *',
      'select veroxa_private.purge_expired_momo_external_cache_v1();'
    );
  end if;
end $$;

-- Client data contract: plain business records only. No AI, provider, queue, retry, or readiness internals.
create or replace function public.veroxa_momo_client_snapshot_v1(target_restaurant_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
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
        'value', field.value_json, 'status', field.status,
        'ownerConfirmedAt', field.owner_confirmed_at, 'updatedAt', field.updated_at
      ) order by field.field_key)
        from public.veroxa_restaurant_truth_fields field
        where field.restaurant_id = target_restaurant_id and field.is_current
          and field.status <> 'superseded'), '[]'::jsonb),
      'contacts', coalesce((select jsonb_agg(jsonb_build_object(
        'id', contact.id, 'kind', contact.contact_kind, 'name', contact.name,
        'email', contact.email, 'phone', contact.phone,
        'isPrimary', contact.is_primary, 'status', contact.status
      ) order by contact.is_primary desc, contact.created_at)
        from public.veroxa_restaurant_contacts contact
        where contact.restaurant_id = target_restaurant_id
          and contact.status not in ('rejected','superseded')), '[]'::jsonb),
      'steps', coalesce((select jsonb_agg(jsonb_build_object(
        'id', step.id, 'stepKey', step.step_key, 'title', step.title,
        'position', step.position, 'status', step.status, 'completedAt', step.completed_at
      ) order by step.position)
        from public.veroxa_onboarding_steps step
        where step.restaurant_id = target_restaurant_id), '[]'::jsonb),
      'presence', coalesce((select jsonb_agg(jsonb_build_object(
        'id', presence.id, 'channel', presence.provider,
        'publicUrl', presence.public_url
      ) order by presence.provider)
        from public.veroxa_presence_profiles presence
        where presence.restaurant_id = target_restaurant_id), '[]'::jsonb)
    ),
    'confirmations', coalesce((select jsonb_agg(jsonb_build_object(
      'id', confirmation.id, 'subjectType', confirmation.subject_type,
      'subjectId', confirmation.subject_id, 'kind', confirmation.confirmation_kind,
      'decision', confirmation.decision, 'proposedValue', confirmation.proposed_value,
      'notes', confirmation.notes, 'status', confirmation.status,
      'submittedAt', confirmation.submitted_at, 'reviewedAt', confirmation.reviewed_at
    ) order by confirmation.submitted_at desc)
      from public.veroxa_confirmations confirmation
      where confirmation.restaurant_id = target_restaurant_id
        and confirmation.submitted_by = (select auth.uid())), '[]'::jsonb),
    'actionConsents', coalesce((select jsonb_agg(jsonb_build_object(
      'id', consent.id, 'actionKind', consent.action_kind,
      'description', consent.client_description, 'scope', consent.scope_snapshot,
      'status', case when consent.status = 'pending' and consent.expires_at <= now()
        then 'expired' else consent.status end,
      'requestedAt', consent.requested_at, 'expiresAt', consent.expires_at,
      'decidedAt', consent.decided_at, 'decisionNotes', consent.decision_notes,
      'revokedAt', consent.revoked_at, 'revocationNotes', consent.revocation_notes
    ) order by consent.requested_at desc)
      from public.veroxa_momo_action_consents consent
      where consent.restaurant_id = target_restaurant_id
        and consent.status in ('pending','approved','rejected','revoked','expired')
        and veroxa_private.momo_evidence_class_for_user_v1(
          target_restaurant_id, (select auth.uid())
        ) = 'real_owner'), '[]'::jsonb),
    'media', coalesce((select jsonb_agg(jsonb_build_object(
      'id', asset.id, 'storagePath', asset.storage_path,
      'displayFileName', asset.original_file_name, 'mimeType', asset.mime_type,
      'fileSize', asset.file_size, 'status', asset.status, 'createdAt', asset.created_at,
      'rightsId', rights.id, 'rightsStatus', rights.rights_status,
      'usageScope', rights.usage_scope, 'validFrom', rights.valid_from,
      'expiresAt', rights.expires_at, 'reviewStatus', review.status,
      'publicUseApproved', coalesce(review.public_use_approved, false)
    ) order by asset.created_at desc)
      from public.veroxa_media_assets asset
      left join public.veroxa_media_rights rights on rights.asset_id = asset.id
      left join public.veroxa_media_reviews review on review.asset_id = asset.id and review.is_current
      where asset.restaurant_id = target_restaurant_id), '[]'::jsonb),
    'pendingContentConfirmations', coalesce((select jsonb_agg(jsonb_build_object(
      'contentItemId', item.id, 'title', item.title, 'concept', item.concept,
      'masterCaption', item.master_caption, 'manualPillar', item.manual_pillar,
      'mediaDisplayFileName', asset.original_file_name,
      'confirmationStatus', (select confirmation.status
        from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = target_restaurant_id
          and confirmation.subject_type = 'content_item' and confirmation.subject_id = item.id
          and confirmation.submitted_by = (select auth.uid())
        order by confirmation.submitted_at desc limit 1)
    ) order by item.created_at)
      from public.veroxa_content_items item
      left join public.veroxa_media_assets asset on asset.id = item.primary_media_asset_id
      where item.restaurant_id = target_restaurant_id and item.requires_owner_confirmation
        and item.status in ('pending','in_review')
        and not exists (select 1 from public.veroxa_confirmations decided
          where decided.restaurant_id = target_restaurant_id
            and decided.subject_type = 'content_item' and decided.subject_id = item.id
            and decided.submitted_by = (select auth.uid())
            and decided.status in ('pending','in_review','approved'))), '[]'::jsonb),
    'contentCalendar', coalesce((select jsonb_agg(jsonb_build_object(
      'contentItemId', item.id, 'title', item.title, 'itemId', calendar.id,
      'channel', variant.platform, 'caption', variant.caption,
      'calendarStatus', case when calendar.status = 'published' then 'published' else 'scheduled' end,
      'scheduledFor', calendar.scheduled_for, 'timezone', calendar.timezone,
      'publishedAt', calendar.published_at
    ) order by calendar.scheduled_for nulls last)
      from public.veroxa_content_calendar calendar
      join public.veroxa_content_variants variant on variant.id = calendar.variant_id
      join public.veroxa_content_items item on item.id = variant.content_item_id
      where calendar.restaurant_id = target_restaurant_id
        and variant.status = 'approved' and item.status = 'approved'
        and ((calendar.status = 'published' and calendar.published_at is not null)
          or (calendar.status in ('approved','queued','publishing')
            and calendar.scheduled_for is not null and calendar.scheduled_for > now()
            and calendar.timezone = 'America/Chicago'
            and veroxa_private.variant_owner_confirmation_satisfied(variant.id, target_restaurant_id)
            and veroxa_private.content_inputs_current_v1(item.id, target_restaurant_id, variant.platform)
            and veroxa_private.content_claims_supported_v1(item.id, target_restaurant_id, variant.caption)
            and veroxa_private.content_media_valid_at_v1(item.id, target_restaurant_id, variant.platform, calendar.scheduled_for)
            and exists (select 1 from public.veroxa_approvals approval
              where approval.restaurant_id = target_restaurant_id
                and approval.subject_type in ('content_variant','publish')
                and approval.subject_id = variant.id and approval.approval_kind = 'publishing'
                and approval.status = 'approved'
                and approval.subject_snapshot_sha256 = veroxa_private.confirmation_snapshot_sha256_v1(
                  veroxa_private.approval_subject_snapshot_v1(target_restaurant_id, approval.subject_type, variant.id))
            )))
    ), '[]'::jsonb),
    'reports', coalesce((select jsonb_agg(jsonb_build_object(
      'id', report.id, 'reportType', report.report_type,
      'periodStart', report.period_start, 'periodEnd', report.period_end,
      'summary', report.summary, 'status', report.status,
      'approvedAt', report.approved_at, 'publishedAt', report.published_at,
      'updatedAt', report.updated_at
    ) order by report.period_end desc)
      from public.veroxa_reports report
      where report.restaurant_id = target_restaurant_id and report.status = 'approved'), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.veroxa_provider_preflight_v1(
  p_restaurant_id uuid, p_provider text, p_required_capability text
) returns table(provider text, connection_status public.veroxa_connection_status_v1, allowed boolean, blockers jsonb)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_provider_preflight_required';
  end if;
  if not ((p_provider = 'meta' and p_required_capability in ('facebook_publish','instagram_publish'))
    or (p_provider = 'google_business' and p_required_capability in ('google_business_publish','review_reply','business_profile_read'))) then
    raise exception using errcode = '22023', message = 'unsupported_provider_capability';
  end if;
  return query select p_provider,
    coalesce((select connection.status from public.veroxa_provider_connections connection
      where connection.restaurant_id = p_restaurant_id and connection.provider = p_provider),
      'not_connected'::public.veroxa_connection_status_v1),
    false,
    jsonb_build_array(
      jsonb_build_object('code','external_credentials_absent','message','External credentials are intentionally absent.'),
      jsonb_build_object('code','external_runtime_locked','message','External execution remains disabled.'),
      jsonb_build_object('code','real_owner_authority_required','message','A real-owner authority record is required.')
    );
end;
$$;

create or replace function public.veroxa_momo_readiness_summary_v1(target_restaurant_id uuid)
returns table(required_count integer, verified_count integer, blocker_count integer, overall_status public.veroxa_readiness_status_v1, can_activate boolean)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.veroxa_current_user_is_team_for_restaurant(target_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_readiness_required';
  end if;
  return query
  select count(*) filter (where dimension.required)::integer,
    count(*) filter (where dimension.required and dimension.status = 'verified')::integer,
    greatest(count(*) filter (where dimension.required and
      (dimension.status <> 'verified' or jsonb_array_length(dimension.blockers) > 0))::integer, 1),
    'blocked'::public.veroxa_readiness_status_v1, false
  from public.veroxa_readiness_dimensions dimension
  where dimension.restaurant_id = target_restaurant_id;
end;
$$;

create or replace function public.veroxa_run_momo_no_go_rehearsal_v1(p_restaurant_id uuid, p_reason text)
returns table(gate_run_id uuid, status public.veroxa_readiness_status_v1, required_count integer, verified_count integer, blocker_count integer, can_activate boolean, decision_id uuid)
language plpgsql security definer set search_path = ''
as $$
declare gate_result record; new_decision_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_no_go_rehearsal_required';
  end if;
  select * into gate_result from public.veroxa_run_momo_readiness_gate_v1(p_restaurant_id);
  if gate_result.status <> 'blocked' or gate_result.can_activate then
    raise exception using errcode = '55000', message = 'rehearsal_must_never_record_go';
  end if;
  new_decision_id := public.veroxa_record_momo_no_go_v1(p_restaurant_id, gate_result.gate_run_id, p_reason, true);
  return query select gate_result.gate_run_id, gate_result.status, gate_result.required_count,
    gate_result.verified_count, gate_result.blocker_count, false, new_decision_id;
end;
$$;

create or replace function public.veroxa_media_storage_path_registered(target_storage_path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select case
    when public.veroxa_restaurant_id_from_storage_path(target_storage_path) is null then false
    when not (
      public.veroxa_current_user_has_active_restaurant(public.veroxa_restaurant_id_from_storage_path(target_storage_path))
      or public.veroxa_current_user_is_team_for_restaurant(public.veroxa_restaurant_id_from_storage_path(target_storage_path))
    ) then false
    else exists (select 1 from public.veroxa_media_assets asset where asset.storage_path = target_storage_path)
      or exists (select 1 from public.veroxa_media_renditions rendition where rendition.storage_path = target_storage_path)
  end;
$$;

create or replace function public.veroxa_record_momo_original_metadata_v1(
  p_restaurant_id uuid, p_asset_id uuid, p_content_sha256 text,
  p_width integer, p_height integer
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare asset_record public.veroxa_media_assets%rowtype; object_record record;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_original_metadata_required';
  end if;
  select * into asset_record from public.veroxa_media_assets asset
  where asset.id = p_asset_id and asset.restaurant_id = p_restaurant_id for update;
  select object.id, object.metadata into object_record from storage.objects object
  where object.bucket_id = 'restaurant-media' and object.name = asset_record.storage_path;
  if not found or p_content_sha256 !~ '^[0-9a-f]{64}$'
    or p_width <= 0 or p_height <= 0 or p_width > 12000 or p_height > 12000
    or coalesce(object_record.metadata ->> 'mimetype', asset_record.mime_type) <> asset_record.mime_type
    or coalesce((object_record.metadata ->> 'size')::bigint, asset_record.file_size) <> asset_record.file_size then
    raise exception using errcode = '22023', message = 'invalid_momo_original_metadata';
  end if;
  if (asset_record.content_sha256 is not null and asset_record.content_sha256 <> p_content_sha256)
    or (asset_record.width is not null and asset_record.width <> p_width)
    or (asset_record.height is not null and asset_record.height <> p_height) then
    raise exception using errcode = '23505', message = 'momo_original_metadata_immutable_conflict';
  end if;
  update public.veroxa_media_assets set content_sha256 = coalesce(content_sha256, p_content_sha256),
    width = coalesce(width, p_width), height = coalesce(height, p_height)
  where id = p_asset_id;
  return p_asset_id;
end;
$$;

create or replace function veroxa_private.momo_image_recipe_valid_v1(
  p_recipe jsonb, p_mime_type text, p_alt_text text,
  p_source_width integer, p_source_height integer, p_output_width integer, p_output_height integer
) returns boolean language plpgsql immutable set search_path = ''
as $$
  declare crop jsonb; x numeric; y numeric; width_value numeric; height_value numeric;
  brightness_value numeric; contrast_value numeric; saturation_value numeric;
  quality_value numeric; rotation_value numeric; oriented_width numeric; oriented_height numeric;
begin
  if jsonb_typeof(p_recipe) is distinct from 'object'
    or not coalesce(p_recipe ?& array[
      'preset','crop','rotation','brightness','contrast','saturation','outputFormat','quality','altText'
    ], false)
    or p_recipe - array[
      'preset','crop','rotation','brightness','contrast','saturation','outputFormat','quality','altText'
    ] <> '{}'::jsonb
    or jsonb_typeof(p_recipe -> 'preset') is distinct from 'string'
    or jsonb_typeof(p_recipe -> 'crop') is distinct from 'object'
    or jsonb_typeof(p_recipe -> 'rotation') is distinct from 'number'
    or jsonb_typeof(p_recipe -> 'brightness') is distinct from 'number'
    or jsonb_typeof(p_recipe -> 'contrast') is distinct from 'number'
    or jsonb_typeof(p_recipe -> 'saturation') is distinct from 'number'
    or jsonb_typeof(p_recipe -> 'outputFormat') is distinct from 'string'
    or jsonb_typeof(p_recipe -> 'quality') is distinct from 'number'
    or jsonb_typeof(p_recipe -> 'altText') is distinct from 'string'
    or p_recipe ->> 'outputFormat' is distinct from p_mime_type
    or p_recipe ->> 'altText' is distinct from p_alt_text
    or p_recipe ->> 'altText' is distinct from btrim(p_recipe ->> 'altText')
    or char_length(p_recipe ->> 'altText') not between 1 and 280
    or p_source_width is null or p_source_width not between 1 and 12000
    or p_source_height is null or p_source_height not between 1 and 12000
    or p_output_width is null or p_output_width <= 0
    or p_output_height is null or p_output_height <= 0 then
    return false;
  end if;
  crop := p_recipe -> 'crop';
  if not coalesce(crop ?& array['x','y','width','height'], false)
    or crop - array['x','y','width','height'] <> '{}'::jsonb
    or jsonb_typeof(crop -> 'x') is distinct from 'number'
    or jsonb_typeof(crop -> 'y') is distinct from 'number'
    or jsonb_typeof(crop -> 'width') is distinct from 'number'
    or jsonb_typeof(crop -> 'height') is distinct from 'number' then return false; end if;
  x := (crop ->> 'x')::numeric; y := (crop ->> 'y')::numeric;
  width_value := (crop ->> 'width')::numeric; height_value := (crop ->> 'height')::numeric;
  rotation_value := (p_recipe ->> 'rotation')::numeric;
  brightness_value := (p_recipe ->> 'brightness')::numeric;
  contrast_value := (p_recipe ->> 'contrast')::numeric;
  saturation_value := (p_recipe ->> 'saturation')::numeric;
  quality_value := (p_recipe ->> 'quality')::numeric;
  oriented_width := case when rotation_value in (90,270) then p_source_height else p_source_width end;
  oriented_height := case when rotation_value in (90,270) then p_source_width else p_source_height end;
  if x < 0 or y < 0 or width_value <= 0 or height_value <= 0
    or x > 1 or y > 1 or x + width_value > 1 or y + height_value > 1
    or rotation_value not in (0,90,180,270)
    or brightness_value < 80 or brightness_value > 120 or trunc(brightness_value) <> brightness_value
    or contrast_value < 80 or contrast_value > 120 or trunc(contrast_value) <> contrast_value
    or saturation_value < 75 or saturation_value > 125 or trunc(saturation_value) <> saturation_value
    or quality_value < 0.5 or quality_value > 1
    or abs(
      width_value * oriented_width * p_output_height
      - height_value * oriented_height * p_output_width
    ) > greatest(
      abs(width_value * oriented_width * p_output_height),
      abs(height_value * oriented_height * p_output_width),
      1
    ) * 0.000001 then return false; end if;
  return true;
exception when others then
  return false;
end;
$$;

revoke all on function veroxa_private.momo_image_recipe_valid_v1(jsonb,text,text,integer,integer,integer,integer)
from public, anon, authenticated;

create or replace function public.veroxa_prepare_momo_rendition_v1(
  p_restaurant_id uuid, p_source_kind text, p_source_asset_id uuid, p_source_key text,
  p_source_content_sha256 text, p_mime_type text, p_width integer, p_height integer,
  p_edit_recipe jsonb, p_intended_use text, p_alt_text text, p_evidence_class text
) returns table(recipe_fingerprint text, storage_path text)
language plpgsql stable security definer set search_path = ''
as $$
declare evidence text; preset text; fingerprint text; extension text;
  source_width integer; source_height integer;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_rendition_required';
  end if;
  preset := p_edit_recipe ->> 'preset';
  if p_source_kind is null or p_source_kind not in ('owner_asset','synthetic_fixture')
    or p_source_key is null or p_source_key !~ '^[a-z0-9-]{3,80}$'
    or p_source_content_sha256 is null or p_source_content_sha256 !~ '^[0-9a-f]{64}$'
    or p_mime_type is null or p_mime_type not in ('image/jpeg','image/png','image/webp')
    or p_intended_use is null or p_intended_use not in ('facebook','instagram','google_business','website')
    or p_alt_text is null
    or char_length(btrim(p_alt_text)) not between 1 and 280
    or p_alt_text is distinct from btrim(p_alt_text) then
    raise exception using errcode = '22023', message = 'invalid_momo_rendition_recipe';
  end if;
  if preset is null or not coalesce(((preset = 'instagram_square' and p_width = 1080 and p_height = 1080 and p_intended_use = 'instagram')
    or (preset = 'instagram_portrait' and p_width = 1080 and p_height = 1350 and p_intended_use = 'instagram')
    or (preset = 'instagram_story' and p_width = 1080 and p_height = 1920 and p_intended_use = 'instagram')
    or (preset = 'facebook_feed' and p_width = 1200 and p_height = 1500 and p_intended_use = 'facebook')
    or (preset = 'google_business_square' and p_width = 720 and p_height = 720
      and p_intended_use = 'google_business' and p_mime_type in ('image/jpeg','image/png'))
    or (preset = 'website_hero' and p_width = 1600 and p_height = 900 and p_intended_use = 'website')), false) then
    raise exception using errcode = '22023', message = 'unsupported_momo_rendition_preset';
  end if;
  if p_source_kind = 'owner_asset' then
    select rights.evidence_class, asset.width, asset.height into evidence, source_width, source_height
    from public.veroxa_media_assets asset
    join public.veroxa_media_rights rights on rights.asset_id = asset.id and rights.restaurant_id = asset.restaurant_id
    join public.veroxa_media_reviews review on review.asset_id = asset.id
      and review.restaurant_id = asset.restaurant_id and review.is_current
    where asset.id = p_source_asset_id and asset.restaurant_id = p_restaurant_id
      and asset.content_sha256 = p_source_content_sha256
      and asset.mime_type in ('image/jpeg','image/png','image/webp')
      and rights.rights_status = 'confirmed' and rights.evidence_class in ('development_proxy','real_owner')
      and (rights.valid_from is null or rights.valid_from <= now())
      and (rights.expires_at is null or rights.expires_at > now())
      and rights.usage_scope ? p_intended_use
      and review.status = 'approved' and review.public_use_approved;
    if evidence is null or evidence is distinct from p_evidence_class or p_source_key <> p_source_asset_id::text then
      raise exception using errcode = '23514', message = 'momo_rendition_owner_source_not_eligible';
    end if;
  elsif p_source_asset_id is not null or p_evidence_class is distinct from 'synthetic'
    or p_source_key <> 'synthetic-fixture-v1' then
    raise exception using errcode = '23514', message = 'momo_synthetic_rendition_boundary_required';
  else
    source_width := 1600;
    source_height := 1200;
  end if;
  if not veroxa_private.momo_image_recipe_valid_v1(
    p_edit_recipe, p_mime_type, p_alt_text,
    source_width, source_height, p_width, p_height
  ) then
    raise exception using errcode = '22023', message = 'invalid_momo_rendition_recipe';
  end if;
  fingerprint := encode(extensions.digest(convert_to(jsonb_build_object(
    'version','momo-image-edit-v1','restaurantId',p_restaurant_id,'sourceKind',p_source_kind,
    'sourceKey',p_source_key,'sourceSha256',p_source_content_sha256,'mimeType',p_mime_type,
    'width',p_width,'height',p_height,'recipe',p_edit_recipe,
    'intendedUse',p_intended_use,'altText',btrim(p_alt_text),'evidenceClass',p_evidence_class
  )::text, 'UTF8'), 'sha256'), 'hex');
  extension := case p_mime_type when 'image/png' then 'png' when 'image/webp' then 'webp' else 'jpg' end;
  return query select fingerprint,
    'restaurants/' || p_restaurant_id::text || '/renditions/' || p_source_key || '/' || fingerprint || '.' || extension;
end;
$$;

create or replace function public.veroxa_register_momo_rendition_v1(
  p_restaurant_id uuid, p_source_kind text, p_source_asset_id uuid, p_source_key text,
  p_source_content_sha256 text, p_storage_path text, p_mime_type text, p_file_size bigint, p_width integer, p_height integer,
  p_content_sha256 text, p_recipe_fingerprint text, p_edit_recipe jsonb,
  p_intended_use text, p_alt_text text, p_evidence_class text
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare existing_record public.veroxa_media_renditions%rowtype; prepared record; object_record record; new_id uuid;
begin
  select * into prepared from public.veroxa_prepare_momo_rendition_v1(
    p_restaurant_id, p_source_kind, p_source_asset_id, p_source_key, p_source_content_sha256,
    p_mime_type, p_width, p_height, p_edit_recipe, p_intended_use, p_alt_text, p_evidence_class
  );
  if p_content_sha256 !~ '^[0-9a-f]{64}$' or p_file_size <= 0 or p_file_size > 26214400
    or p_recipe_fingerprint <> prepared.recipe_fingerprint or p_storage_path <> prepared.storage_path then
    raise exception using errcode = '22023', message = 'invalid_momo_rendition_finalize';
  end if;
  select object.id, object.version, object.metadata into object_record from storage.objects object
  where object.bucket_id = 'restaurant-media' and object.name = p_storage_path;
  if not found
    or object_record.version is null
    or coalesce(object_record.metadata ->> 'mimetype','') <> p_mime_type
    or coalesce((object_record.metadata ->> 'size')::bigint, -1) <> p_file_size then
    raise exception using errcode = '23503', message = 'verified_momo_rendition_storage_object_required';
  end if;
  select * into existing_record from public.veroxa_media_renditions rendition
  where rendition.restaurant_id = p_restaurant_id and rendition.recipe_fingerprint = p_recipe_fingerprint;
  if found then
    if existing_record.storage_path <> p_storage_path or existing_record.content_sha256 <> p_content_sha256
      or existing_record.file_size <> p_file_size or existing_record.mime_type <> p_mime_type
      or existing_record.width <> p_width or existing_record.height <> p_height
      or existing_record.source_content_sha256 <> p_source_content_sha256
      or existing_record.edit_recipe <> p_edit_recipe or existing_record.alt_text <> btrim(p_alt_text)
      or existing_record.storage_object_id <> object_record.id then
      raise exception using errcode = '23505', message = 'momo_rendition_immutable_conflict';
    end if;
    return existing_record.id;
  end if;
  insert into public.veroxa_media_renditions (
    restaurant_id, source_kind, source_asset_id, source_key, source_content_sha256, storage_path, mime_type,
    file_size, width, height, content_sha256, recipe_fingerprint, edit_recipe, preset_key,
    intended_use, alt_text, evidence_class, created_by, storage_object_id, storage_object_version
  ) values (
    p_restaurant_id, p_source_kind, p_source_asset_id, p_source_key, p_source_content_sha256, p_storage_path, p_mime_type,
    p_file_size, p_width, p_height, p_content_sha256, p_recipe_fingerprint, p_edit_recipe, p_edit_recipe ->> 'preset',
    p_intended_use, btrim(p_alt_text), p_evidence_class, (select auth.uid()), object_record.id, object_record.version
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.veroxa_attach_momo_rendition_v1(
  p_restaurant_id uuid, p_content_item_id uuid, p_variant_id uuid,
  p_rendition_id uuid, p_platform text, p_media_role text,
  p_position smallint, p_alt_text text, p_placement_metadata jsonb
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare rendition_record public.veroxa_media_renditions%rowtype;
  existing_record public.veroxa_content_media_placements%rowtype; new_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_media_placement_required';
  end if;
  select * into rendition_record from public.veroxa_media_renditions rendition
  where rendition.id = p_rendition_id and rendition.restaurant_id = p_restaurant_id
    and rendition.source_kind = 'owner_asset' and rendition.status = 'ready';
  if not found or rendition_record.source_asset_id is null
    or not exists (select 1 from public.veroxa_content_items item
      where item.id = p_content_item_id and item.restaurant_id = p_restaurant_id)
    or p_platform not in ('facebook','instagram','google_business','website','internal')
    or rendition_record.intended_use <> p_platform
    or p_media_role not in ('primary','carousel','thumbnail','hero')
    or p_position not between 0 and 20
    or char_length(btrim(p_alt_text)) not between 1 and 280
    or p_alt_text <> rendition_record.alt_text
    or jsonb_typeof(p_placement_metadata) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_momo_media_placement';
  end if;
  if (p_variant_id is not null and not exists (select 1 from public.veroxa_content_variants variant
      where variant.id = p_variant_id and variant.restaurant_id = p_restaurant_id
        and variant.content_item_id = p_content_item_id and variant.platform = p_platform))
    or (p_variant_id is null and p_platform in ('facebook','instagram','google_business')) then
    raise exception using errcode = '23503', message = 'momo_media_placement_variant_scope_mismatch';
  end if;
  select * into existing_record from public.veroxa_content_media_placements placement
  where placement.restaurant_id = p_restaurant_id and placement.content_item_id = p_content_item_id
    and placement.variant_id is not distinct from p_variant_id and placement.platform = p_platform
    and placement.position = p_position;
  if found then
    if existing_record.rendition_id is distinct from p_rendition_id
      or existing_record.source_asset_id is distinct from rendition_record.source_asset_id
      or existing_record.media_role is distinct from p_media_role
      or existing_record.alt_text is distinct from btrim(p_alt_text)
      or existing_record.placement_metadata is distinct from p_placement_metadata
      or existing_record.execution_mode is distinct from 'rehearsal'
      or existing_record.evidence_class is distinct from rendition_record.evidence_class then
      raise exception using errcode = '23505', message = 'momo_media_placement_idempotency_conflict';
    end if;
    return existing_record.id;
  end if;
  insert into public.veroxa_content_media_placements (
    restaurant_id, content_item_id, variant_id, source_asset_id, rendition_id,
    platform, media_role, position, alt_text, placement_metadata,
    execution_mode, evidence_class, created_by
  ) values (
    p_restaurant_id, p_content_item_id, p_variant_id, rendition_record.source_asset_id,
    rendition_record.id, p_platform, p_media_role, p_position, btrim(p_alt_text),
    p_placement_metadata, 'rehearsal', rendition_record.evidence_class, (select auth.uid())
  ) returning id into new_id;
  insert into public.veroxa_media_usage (
    restaurant_id, asset_id, content_item_id, platform, usage_kind,
    external_reference, recorded_by
  ) values (
    p_restaurant_id, rendition_record.source_asset_id, p_content_item_id,
    p_platform, 'draft', 'rendition:' || rendition_record.id::text, (select auth.uid())
  );
  return new_id;
end;
$$;

create or replace function veroxa_private.momo_iso_utc_timestamp_valid_v1(p_value text)
returns boolean language plpgsql immutable set search_path = ''
as $$
declare parsed timestamptz;
begin
  if p_value is null or p_value !~
    '^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{3})?Z$' then
    return false;
  end if;
  parsed := p_value::timestamptz;
  return parsed is not null;
exception when others then
  return false;
end;
$$;

create or replace function veroxa_private.momo_publication_media_current_v1(
  p_restaurant_id uuid, p_channel text, p_evidence_class text, p_payload jsonb
) returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare media jsonb;
begin
  if p_channel not in ('facebook','instagram','google_business')
    or jsonb_typeof(p_payload -> 'media') is distinct from 'array'
    or jsonb_array_length(p_payload -> 'media') not between 1 and 10
    or (select count(distinct item ->> 'renditionId')
      from jsonb_array_elements(p_payload -> 'media') item)
      <> jsonb_array_length(p_payload -> 'media') then
    return false;
  end if;
  for media in select value from jsonb_array_elements(p_payload -> 'media') loop
    if jsonb_typeof(media) is distinct from 'object'
      or not coalesce(media ?& array['renditionId','contentSha256','altText'], false)
      or media - array['renditionId','contentSha256','altText'] <> '{}'::jsonb
      or jsonb_typeof(media -> 'renditionId') is distinct from 'string'
      or media ->> 'renditionId' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or jsonb_typeof(media -> 'contentSha256') is distinct from 'string'
      or media ->> 'contentSha256' !~ '^[0-9a-f]{64}$'
      or jsonb_typeof(media -> 'altText') is distinct from 'string'
      or char_length(btrim(media ->> 'altText')) not between 1 and 280
      or not exists (
        select 1 from public.veroxa_media_renditions rendition
        join storage.objects object on object.id = rendition.storage_object_id
        where rendition.id = (media ->> 'renditionId')::uuid
          and rendition.restaurant_id = p_restaurant_id
          and rendition.status = 'ready'
          and rendition.intended_use = p_channel
          and rendition.content_sha256 = media ->> 'contentSha256'
          and rendition.alt_text = media ->> 'altText'
          and rendition.evidence_class = p_evidence_class
          and not rendition.external_write_allowed
          and rendition.output_hash_attested_at is not null
          and object.bucket_id = 'restaurant-media'
          and object.name = rendition.storage_path
          and object.version is not null
          and object.version is not distinct from rendition.storage_object_version
          and coalesce(object.metadata ->> 'mimetype','') = rendition.mime_type
          and coalesce((object.metadata ->> 'size')::bigint, -1) = rendition.file_size
      ) then
      return false;
    end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create or replace function veroxa_private.momo_publication_variant_snapshot_current_v1(
  p_restaurant_id uuid, p_variant_id uuid, p_channel text,
  p_payload jsonb, p_approval_snapshot_sha256 text
) returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare scheduled_at timestamptz;
begin
  if not veroxa_private.momo_iso_utc_timestamp_valid_v1(p_payload ->> 'scheduledFor') then
    return false;
  end if;
  if p_variant_id is null then
    return p_payload ->> 'variantId' ~ '^synthetic-[a-z0-9_-]+$';
  end if;
  scheduled_at := (p_payload ->> 'scheduledFor')::timestamptz;
  return exists (
    select 1
    from public.veroxa_content_variants variant
    join public.veroxa_content_items item
      on item.id = variant.content_item_id and item.restaurant_id = variant.restaurant_id
    join public.veroxa_content_calendar calendar
      on calendar.variant_id = variant.id and calendar.restaurant_id = variant.restaurant_id
    where variant.id = p_variant_id and variant.restaurant_id = p_restaurant_id
      and variant.platform = p_channel and variant.status = 'approved' and item.status = 'approved'
      and variant.caption = p_payload ->> 'caption'
      and calendar.scheduled_for = scheduled_at
      and calendar.timezone = p_payload ->> 'timezone'
      and calendar.status in ('approved','queued','publishing')
      and exists (
        select 1 from public.veroxa_approvals approval
        where approval.restaurant_id = p_restaurant_id
          and approval.subject_id = variant.id
          and approval.subject_type in ('content_variant','publish')
          and approval.approval_kind = 'publishing'
          and approval.status = 'approved'
          and approval.subject_snapshot_sha256 = p_approval_snapshot_sha256
          and approval.subject_snapshot_sha256 = veroxa_private.confirmation_snapshot_sha256_v1(
            veroxa_private.approval_subject_snapshot_v1(
              p_restaurant_id, approval.subject_type, variant.id))
      )
      and (select count(*) from public.veroxa_content_media_placements placement
        where placement.restaurant_id = p_restaurant_id
          and placement.variant_id = variant.id and placement.platform = p_channel
          and placement.execution_mode = 'rehearsal') = jsonb_array_length(p_payload -> 'media')
      and not exists (
        select 1 from jsonb_array_elements(p_payload -> 'media') media
        where not exists (
          select 1 from public.veroxa_content_media_placements placement
          where placement.restaurant_id = p_restaurant_id
            and placement.variant_id = variant.id and placement.platform = p_channel
            and placement.rendition_id = (media ->> 'renditionId')::uuid
            and placement.alt_text = media ->> 'altText'
            and placement.execution_mode = 'rehearsal'
        )
      )
  );
exception when others then
  return false;
end;
$$;

revoke all on function
  veroxa_private.momo_iso_utc_timestamp_valid_v1(text),
  veroxa_private.momo_publication_media_current_v1(uuid,text,text,jsonb),
  veroxa_private.momo_publication_variant_snapshot_current_v1(uuid,uuid,text,jsonb,text)
from public, anon, authenticated;

create or replace function public.veroxa_record_momo_publication_rehearsal_v1(
  p_restaurant_id uuid, p_subject_key text, p_variant_id uuid, p_channel text,
  p_payload_snapshot jsonb, p_approval_snapshot_sha256 text,
  p_scenario text, p_status text, p_attempts jsonb,
  p_simulated_receipt jsonb, p_evidence_class text
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare existing_record public.veroxa_publication_rehearsals%rowtype; new_id uuid; payload_hash text; idempotency text;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_publication_rehearsal_required';
  end if;
  if p_channel is null or p_channel not in ('facebook','instagram','google_business')
    or p_scenario is null or p_scenario not in ('success','transient_then_success','permanent_failure')
    or p_status is null or p_status not in ('completed','dead_letter')
    or p_evidence_class is null or p_evidence_class not in ('development_proxy','synthetic','real_owner')
    or p_approval_snapshot_sha256 is null or p_approval_snapshot_sha256 !~ '^[0-9a-f]{64}$'
    or jsonb_typeof(p_payload_snapshot) is distinct from 'object'
    or jsonb_typeof(p_attempts) is distinct from 'array'
    or jsonb_array_length(p_attempts) not between 1 and 5
    or jsonb_typeof(p_simulated_receipt) is distinct from 'object'
    or p_subject_key is null or p_subject_key !~ '^[a-z0-9][a-z0-9:_-]{2,159}$'
    or not coalesce(p_payload_snapshot ?& array[
      'schemaVersion','restaurantId','variantId','channel','caption','scheduledFor',
      'timezone','media','approvalSnapshotSha256'
    ], false)
    or p_payload_snapshot - array[
      'schemaVersion','restaurantId','variantId','channel','caption','scheduledFor',
      'timezone','media','approvalSnapshotSha256'
    ] <> '{}'::jsonb
    or p_payload_snapshot ->> 'schemaVersion' is distinct from 'momo-publication-rehearsal-v1'
    or p_payload_snapshot ->> 'restaurantId' is distinct from p_restaurant_id::text
    or p_payload_snapshot ->> 'channel' is distinct from p_channel
    or p_payload_snapshot ->> 'approvalSnapshotSha256' is distinct from p_approval_snapshot_sha256
    or jsonb_typeof(p_payload_snapshot -> 'variantId') is distinct from 'string'
    or jsonb_typeof(p_payload_snapshot -> 'caption') is distinct from 'string'
    or char_length(btrim(p_payload_snapshot ->> 'caption')) not between 1 and 2200
    or p_payload_snapshot ->> 'caption' ~* '(best|guaranteed|fresh daily|number[ ]*one|#[ ]*1|halal)'
    or p_payload_snapshot ->> 'caption' ~* '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}'
    or jsonb_typeof(p_payload_snapshot -> 'scheduledFor') is distinct from 'string'
    or not veroxa_private.momo_iso_utc_timestamp_valid_v1(p_payload_snapshot ->> 'scheduledFor')
    or jsonb_typeof(p_payload_snapshot -> 'media') is distinct from 'array'
    or jsonb_array_length(p_payload_snapshot -> 'media') = 0
    or jsonb_array_length(p_payload_snapshot -> 'media') > 10
    or (select count(distinct media ->> 'renditionId') from jsonb_array_elements(p_payload_snapshot -> 'media') media)
      <> jsonb_array_length(p_payload_snapshot -> 'media')
    or exists (
      select 1 from jsonb_array_elements(p_payload_snapshot -> 'media') media
      where jsonb_typeof(media) <> 'object'
        or not coalesce(media ?& array['renditionId','contentSha256','altText'], false)
        or media - array['renditionId','contentSha256','altText'] <> '{}'::jsonb
        or jsonb_typeof(media -> 'renditionId') is distinct from 'string'
        or jsonb_typeof(media -> 'contentSha256') is distinct from 'string'
        or jsonb_typeof(media -> 'altText') is distinct from 'string'
        or media ->> 'renditionId' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        or media ->> 'contentSha256' !~ '^[0-9a-f]{64}$'
        or char_length(btrim(coalesce(media ->> 'altText',''))) not between 1 and 280
        or not exists (
          select 1 from public.veroxa_media_renditions rendition
          where rendition.id = case
              when media ->> 'renditionId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                then (media ->> 'renditionId')::uuid else null end
            and rendition.restaurant_id = p_restaurant_id and rendition.status = 'ready'
            and rendition.intended_use = p_channel
            and rendition.content_sha256 = media ->> 'contentSha256'
            and rendition.alt_text = media ->> 'altText'
            and rendition.evidence_class = p_evidence_class
            and not rendition.external_write_allowed
            and exists (select 1 from storage.objects object
              where object.id = rendition.storage_object_id
                and object.bucket_id = 'restaurant-media'
                and object.name = rendition.storage_path
                and object.version is not null
                and object.version is not distinct from rendition.storage_object_version
                and coalesce(object.metadata ->> 'mimetype','') = rendition.mime_type
                and coalesce((object.metadata ->> 'size')::bigint, -1) = rendition.file_size)
        )
    )
    or not veroxa_private.momo_publication_media_current_v1(
      p_restaurant_id, p_channel, p_evidence_class, p_payload_snapshot)
    or p_payload_snapshot ->> 'timezone' is distinct from 'America/Chicago'
    or not coalesce(p_simulated_receipt ?& array[
      'accepted','channel','externalId','published','readbackVerified'
    ], false)
    or p_simulated_receipt - array[
      'accepted','channel','externalId','published','readbackVerified'
    ] <> '{}'::jsonb
    or jsonb_typeof(p_simulated_receipt -> 'accepted') is distinct from 'boolean'
    or p_simulated_receipt -> 'published' is distinct from 'false'::jsonb
    or p_simulated_receipt -> 'externalId' is distinct from 'null'::jsonb
    or p_simulated_receipt -> 'readbackVerified' is distinct from 'false'::jsonb
    or p_simulated_receipt ->> 'channel' is distinct from p_channel
    or not ((p_scenario = 'success' and p_status = 'completed' and p_attempts =
        '[{"number":1,"state":"succeeded","code":"simulated_acceptance","nextAttemptAfterSeconds":null}]'::jsonb
        and coalesce((p_simulated_receipt ->> 'accepted')::boolean, false))
      or (p_scenario = 'transient_then_success' and p_status = 'completed' and p_attempts =
        '[{"number":1,"state":"retryable_failure","code":"simulated_rate_limit","nextAttemptAfterSeconds":60},{"number":2,"state":"succeeded","code":"simulated_acceptance","nextAttemptAfterSeconds":null}]'::jsonb
        and coalesce((p_simulated_receipt ->> 'accepted')::boolean, false))
      or (p_scenario = 'permanent_failure' and p_status = 'dead_letter' and p_attempts =
        '[{"number":1,"state":"permanent_failure","code":"simulated_payload_rejection","nextAttemptAfterSeconds":null}]'::jsonb
        and not coalesce((p_simulated_receipt ->> 'accepted')::boolean, false))) then
    raise exception using errcode = '22023', message = 'invalid_momo_publication_rehearsal';
  end if;
  if not veroxa_private.momo_publication_variant_snapshot_current_v1(
      p_restaurant_id, p_variant_id, p_channel,
      p_payload_snapshot, p_approval_snapshot_sha256)
    or (p_variant_id is not null
      and p_payload_snapshot ->> 'variantId' is distinct from p_variant_id::text) then
    raise exception using errcode = '23503', message = 'momo_rehearsal_variant_scope_mismatch';
  end if;
  if p_variant_id is null and (p_evidence_class <> 'synthetic'
    or p_payload_snapshot ->> 'variantId' !~ '^synthetic-[a-z0-9_-]+$') then
    raise exception using errcode = '23514', message = 'momo_synthetic_rehearsal_boundary_required';
  end if;
  payload_hash := encode(extensions.digest(convert_to(p_payload_snapshot::text, 'UTF8'), 'sha256'), 'hex');
  idempotency := 'momo-publication-rehearsal-v1:' || p_scenario || ':' || payload_hash;
  select * into existing_record from public.veroxa_publication_rehearsals rehearsal
  where rehearsal.restaurant_id = p_restaurant_id and rehearsal.idempotency_key = idempotency;
  if found then
    if existing_record.payload_snapshot <> p_payload_snapshot or existing_record.payload_sha256 <> payload_hash
      or existing_record.scenario <> p_scenario or existing_record.attempts <> p_attempts
      or existing_record.simulated_receipt <> p_simulated_receipt then
      raise exception using errcode = '23505', message = 'momo_rehearsal_idempotency_conflict';
    end if;
    return existing_record.id;
  end if;
  insert into public.veroxa_publication_rehearsals (
    restaurant_id, subject_key, variant_id, channel, payload_snapshot, payload_sha256,
    approval_snapshot_sha256, idempotency_key, scenario, status, attempts,
    simulated_receipt, evidence_class, created_by
  ) values (
    p_restaurant_id, p_subject_key, p_variant_id, p_channel, p_payload_snapshot, payload_hash,
    p_approval_snapshot_sha256, idempotency, p_scenario, p_status, p_attempts,
    p_simulated_receipt, p_evidence_class, (select auth.uid())
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function veroxa_private.momo_seo_baseline_valid_v1(
  p_page_url text, p_observed_at timestamptz,
  p_evidence_snapshot jsonb, p_findings jsonb
) returns boolean language plpgsql immutable set search_path = ''
as $$
declare page jsonb; finding jsonb; page_observed_at timestamptz;
begin
  if jsonb_typeof(p_evidence_snapshot) is distinct from 'object'
    or not coalesce(p_evidence_snapshot ?& array['pages','observedBy'], false)
    or p_evidence_snapshot - array['pages','observedBy'] <> '{}'::jsonb
    or p_evidence_snapshot -> 'observedBy' is distinct from '"public_web_evidence_review"'::jsonb
    or jsonb_typeof(p_evidence_snapshot -> 'pages') is distinct from 'array'
    or jsonb_array_length(p_evidence_snapshot -> 'pages') not between 1 and 10
    or p_evidence_snapshot #>> '{pages,0,url}' is distinct from p_page_url
    or jsonb_typeof(p_findings) is distinct from 'array'
    or jsonb_array_length(p_findings) not between 1 and 30 then return false; end if;
  for page in select value from jsonb_array_elements(p_evidence_snapshot -> 'pages') loop
    if jsonb_typeof(page) is distinct from 'object'
      or not coalesce(page ?& array['url','observedAt','title','text'], false)
      or page - array['url','observedAt','title','text','listedAddress','listedHours','menuPrices','orderingClosed'] <> '{}'::jsonb
      or jsonb_typeof(page -> 'url') is distinct from 'string'
      or page ->> 'url' !~ '^https://momohousesa[.]com(/|$)'
      or jsonb_typeof(page -> 'observedAt') is distinct from 'string'
      or page ->> 'observedAt' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{3})?Z$'
      or jsonb_typeof(page -> 'title') is distinct from 'string'
      or char_length(btrim(page ->> 'title')) not between 1 and 500
      or jsonb_typeof(page -> 'text') is distinct from 'string'
      or char_length(page ->> 'text') > 100000
      or (page ? 'listedAddress' and (jsonb_typeof(page -> 'listedAddress') is distinct from 'string'
        or char_length(btrim(page ->> 'listedAddress')) not between 3 and 500))
      or (page ? 'listedHours' and jsonb_typeof(page -> 'listedHours') is distinct from 'array')
      or (page ? 'menuPrices' and jsonb_typeof(page -> 'menuPrices') is distinct from 'array')
      or (page ? 'orderingClosed' and jsonb_typeof(page -> 'orderingClosed') is distinct from 'boolean') then
      return false;
    end if;
    page_observed_at := (page ->> 'observedAt')::timestamptz;
    if page_observed_at is distinct from p_observed_at then return false; end if;
    if page ? 'listedHours' and exists (select 1 from jsonb_array_elements(page -> 'listedHours') item
      where jsonb_typeof(item) is distinct from 'string' or char_length(item #>> '{}') not between 1 and 500) then return false; end if;
    if page ? 'menuPrices' and exists (select 1 from jsonb_array_elements(page -> 'menuPrices') item
      where jsonb_typeof(item) is distinct from 'string' or char_length(item #>> '{}') not between 1 and 100) then return false; end if;
  end loop;
  for finding in select value from jsonb_array_elements(p_findings) loop
    if jsonb_typeof(finding) is distinct from 'object'
      or not coalesce(finding ?& array['code','severity','title','evidenceUrl','evidence','recommendedAction'], false)
      or finding - array['code','severity','title','evidenceUrl','evidence','recommendedAction'] <> '{}'::jsonb
      or jsonb_typeof(finding -> 'code') is distinct from 'string'
      or finding ->> 'code' !~ '^[a-z][a-z0-9_]{2,99}$'
      or jsonb_typeof(finding -> 'severity') is distinct from 'string'
      or finding ->> 'severity' not in ('critical','high','medium','opportunity')
      or jsonb_typeof(finding -> 'title') is distinct from 'string'
      or char_length(btrim(finding ->> 'title')) not between 3 and 500
      or jsonb_typeof(finding -> 'evidenceUrl') is distinct from 'string'
      or finding ->> 'evidenceUrl' !~ '^https://momohousesa[.]com(/|$)'
      or jsonb_typeof(finding -> 'evidence') is distinct from 'string'
      or char_length(btrim(finding ->> 'evidence')) not between 3 and 2000
      or jsonb_typeof(finding -> 'recommendedAction') is distinct from 'string'
      or char_length(btrim(finding ->> 'recommendedAction')) not between 3 and 2000 then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;

create or replace function veroxa_private.momo_seo_change_valid_v1(
  p_target_url text, p_baseline_pages jsonb, p_proposed_changes jsonb,
  p_rollback_snapshot jsonb, p_blocked_live_reasons jsonb
) returns boolean language plpgsql immutable set search_path = ''
as $$
declare change_item jsonb; change_fields text[] := array[]::text[]; field_name text;
  structured jsonb; address jsonb;
begin
  if jsonb_typeof(p_baseline_pages) is distinct from 'array'
    or jsonb_array_length(p_baseline_pages) = 0
    or jsonb_typeof(p_proposed_changes) is distinct from 'object'
    or not coalesce(p_proposed_changes ?& array['changes','structuredDataDraft','schemaVersion'], false)
    or p_proposed_changes - array['changes','structuredDataDraft','schemaVersion'] <> '{}'::jsonb
    or p_proposed_changes -> 'schemaVersion' is distinct from '"momo-seo-change-plan-v1"'::jsonb
    or jsonb_typeof(p_proposed_changes -> 'changes') is distinct from 'array'
    or jsonb_array_length(p_proposed_changes -> 'changes') <> 2
    or jsonb_typeof(p_proposed_changes -> 'structuredDataDraft') is distinct from 'object'
    or jsonb_typeof(p_rollback_snapshot) is distinct from 'object'
    or not coalesce(p_rollback_snapshot ?& array['title','pageEvidence'], false)
    or p_rollback_snapshot - array['title','pageEvidence'] <> '{}'::jsonb
    or p_rollback_snapshot -> 'pageEvidence' is distinct from p_baseline_pages
    or p_rollback_snapshot -> 'title' is distinct from p_baseline_pages #> '{0,title}'
    or p_blocked_live_reasons is distinct from
      '["real_owner_evidence_required","website_access_not_authorized","change_set_approval_required","external_writes_disabled"]'::jsonb then return false; end if;
  for change_item in select value from jsonb_array_elements(p_proposed_changes -> 'changes') loop
    if jsonb_typeof(change_item) is distinct from 'object'
      or not coalesce(change_item ?& array['field','before','after','rationale'], false)
      or change_item - array['field','before','after','rationale'] <> '{}'::jsonb
      or jsonb_typeof(change_item -> 'field') is distinct from 'string'
      or change_item ->> 'field' not in ('title','meta_description')
      or jsonb_typeof(change_item -> 'before') not in ('string','null')
      or jsonb_typeof(change_item -> 'after') is distinct from 'string'
      or char_length(btrim(change_item ->> 'after')) not between 10 and 320
      or jsonb_typeof(change_item -> 'rationale') is distinct from 'string'
      or char_length(btrim(change_item ->> 'rationale')) not between 10 and 1000 then return false; end if;
    field_name := change_item ->> 'field';
    if field_name = any(change_fields) then return false; end if;
    change_fields := array_append(change_fields, field_name);
    if field_name = 'title' and change_item -> 'before' is distinct from p_baseline_pages #> '{0,title}' then return false; end if;
    if field_name = 'meta_description' and change_item -> 'before' is distinct from 'null'::jsonb then return false; end if;
  end loop;
  if change_fields @> array['title','meta_description'] is not true then return false; end if;
  structured := p_proposed_changes -> 'structuredDataDraft';
  if not coalesce(structured ?& array['@context','@type','name','address','servesCuisine','url'], false)
    or structured - array['@context','@type','name','address','servesCuisine','url'] <> '{}'::jsonb
    or structured -> '@context' is distinct from '"https://schema.org"'::jsonb
    or structured -> '@type' is distinct from '"Restaurant"'::jsonb
    or jsonb_typeof(structured -> 'name') is distinct from 'string'
    or char_length(btrim(structured ->> 'name')) not between 2 and 200
    or jsonb_typeof(structured -> 'servesCuisine') is distinct from 'string'
    or char_length(btrim(structured ->> 'servesCuisine')) not between 2 and 200
    or structured ->> 'url' is distinct from p_target_url
    or jsonb_typeof(structured -> 'address') is distinct from 'object' then return false; end if;
  address := structured -> 'address';
  if not coalesce(address ?& array['@type','streetAddress','addressLocality'], false)
    or address - array['@type','streetAddress','addressLocality'] <> '{}'::jsonb
    or address -> '@type' is distinct from '"PostalAddress"'::jsonb
    or jsonb_typeof(address -> 'streetAddress') is distinct from 'string'
    or char_length(btrim(address ->> 'streetAddress')) not between 3 and 500
    or jsonb_typeof(address -> 'addressLocality') is distinct from 'string'
    or char_length(btrim(address ->> 'addressLocality')) not between 2 and 200 then return false; end if;
  return true;
exception when others then return false;
end;
$$;

revoke all on function veroxa_private.momo_seo_baseline_valid_v1(text,timestamptz,jsonb,jsonb),
  veroxa_private.momo_seo_change_valid_v1(text,jsonb,jsonb,jsonb,jsonb)
from public, anon, authenticated;

create or replace function public.veroxa_record_momo_seo_baseline_v1(
  p_restaurant_id uuid, p_page_url text, p_page_type text, p_observed_at timestamptz,
  p_evidence_snapshot jsonb, p_findings jsonb, p_evidence_class text
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare fingerprint text; existing_id uuid; new_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_seo_baseline_required';
  end if;
  if p_page_url is null or p_page_url !~ '^https://momohousesa[.]com(/|$)'
    or p_page_type is null or p_page_type not in ('home','menu','story','catering','other')
    or p_observed_at is null or p_observed_at > now() + interval '5 minutes'
    or p_observed_at < now() - interval '30 days'
    or p_evidence_class is distinct from 'public_evidence'
    or not veroxa_private.momo_seo_baseline_valid_v1(
      p_page_url, p_observed_at, p_evidence_snapshot, p_findings) then
    raise exception using errcode = '22023', message = 'invalid_momo_seo_baseline';
  end if;
  fingerprint := encode(extensions.digest(convert_to(p_evidence_snapshot::text, 'UTF8'), 'sha256'), 'hex');
  select baseline.id into existing_id from public.veroxa_seo_page_baselines baseline
  where baseline.restaurant_id = p_restaurant_id and baseline.page_url = p_page_url
    and baseline.baseline_sha256 = fingerprint;
  if existing_id is not null then
    if not exists (select 1 from public.veroxa_seo_page_baselines baseline
      where baseline.id = existing_id and baseline.observed_at = p_observed_at
        and baseline.findings = p_findings and baseline.page_type = p_page_type) then
      raise exception using errcode = '23505', message = 'momo_seo_baseline_immutable_conflict';
    end if;
    return existing_id;
  end if;
  insert into public.veroxa_seo_page_baselines (
    restaurant_id, page_url, page_type, observed_at, evidence_snapshot, findings,
    baseline_sha256, evidence_class, created_by
  ) values (
    p_restaurant_id, p_page_url, p_page_type, p_observed_at, p_evidence_snapshot, p_findings,
    fingerprint, p_evidence_class, (select auth.uid())
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.veroxa_record_momo_seo_change_set_v1(
  p_restaurant_id uuid, p_baseline_id uuid, p_target_url text,
  p_proposed_changes jsonb, p_rollback_snapshot jsonb,
  p_blocked_live_reasons jsonb, p_evidence_class text
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare fingerprint text; existing_id uuid; new_id uuid; baseline_record public.veroxa_seo_page_baselines%rowtype;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_seo_change_set_required';
  end if;
  select * into baseline_record from public.veroxa_seo_page_baselines baseline
  where baseline.id = p_baseline_id and baseline.restaurant_id = p_restaurant_id;
  if not found or p_target_url is distinct from baseline_record.page_url
    or p_evidence_class is distinct from 'public_evidence'
    or not veroxa_private.momo_seo_change_valid_v1(
      p_target_url, baseline_record.evidence_snapshot -> 'pages', p_proposed_changes,
      p_rollback_snapshot, p_blocked_live_reasons) then
    raise exception using errcode = '22023', message = 'invalid_momo_seo_change_set';
  end if;
  fingerprint := encode(extensions.digest(convert_to(p_proposed_changes::text, 'UTF8'), 'sha256'), 'hex');
  select change_set.id into existing_id from public.veroxa_seo_change_sets change_set
  where change_set.restaurant_id = p_restaurant_id and change_set.baseline_id = p_baseline_id
    and change_set.proposed_sha256 = fingerprint;
  if existing_id is not null then
    if not exists (select 1 from public.veroxa_seo_change_sets change_set
      where change_set.id = existing_id and change_set.target_url = p_target_url
        and change_set.rollback_snapshot = p_rollback_snapshot
        and change_set.blocked_live_reasons = p_blocked_live_reasons) then
      raise exception using errcode = '23505', message = 'momo_seo_change_set_immutable_conflict';
    end if;
    return existing_id;
  end if;
  insert into public.veroxa_seo_change_sets (
    restaurant_id, baseline_id, target_url, proposed_changes, proposed_sha256,
    rollback_snapshot, blocked_live_reasons, evidence_class, created_by
  ) values (
    p_restaurant_id, p_baseline_id, p_target_url, p_proposed_changes, fingerprint,
    p_rollback_snapshot, p_blocked_live_reasons, p_evidence_class, (select auth.uid())
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.veroxa_record_momo_tracking_contract_v1(
  p_restaurant_id uuid, p_subject_key text, p_platform text, p_destination_url text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text, p_utm_content text,
  p_evidence_class text
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare tagged text; fingerprint text; existing_record public.veroxa_campaign_tracking_contracts%rowtype;
  new_id uuid; combined text;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_tracking_contract_required';
  end if;
  combined := concat_ws('|', p_subject_key, p_destination_url, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content);
  if p_subject_key is null or p_platform is null or p_destination_url is null
    or p_utm_source is null or p_utm_medium is null or p_utm_campaign is null
    or p_utm_content is null or p_evidence_class is null
    or p_subject_key !~ '^[a-z0-9][a-z0-9:_-]{2,159}$'
    or p_platform not in ('facebook','instagram','google_business','website')
    or p_destination_url !~ '^https://momohousesa[.]com(/[^?#]*)?$'
    or p_utm_source !~ '^[a-z0-9_-]{2,100}$' or p_utm_medium !~ '^[a-z0-9_-]{2,100}$'
    or p_utm_campaign !~ '^[a-z0-9_-]{2,120}$' or p_utm_content !~ '^[a-z0-9_-]{2,120}$'
    or combined ~* '[a-z0-9._%+-]+@[a-z0-9.-]+[.][a-z]{2,}'
    or p_destination_url ~* '%[0-9a-f]{2}'
    or combined ~* '(^|[_/:.-])(email|e-mail|phone|mobile|first_name|last_name|firstname|lastname|full_name|customer_name)([_/:.-]|$)'
    or regexp_replace(p_subject_key, '[^0-9]', '', 'g') ~ '[0-9]{7,}'
    or regexp_replace(p_destination_url, '[^0-9]', '', 'g') ~ '[0-9]{7,}'
    or regexp_replace(p_utm_source, '[^0-9]', '', 'g') ~ '[0-9]{7,}'
    or regexp_replace(p_utm_medium, '[^0-9]', '', 'g') ~ '[0-9]{7,}'
    or regexp_replace(p_utm_campaign, '[^0-9]', '', 'g') ~ '[0-9]{7,}'
    or regexp_replace(p_utm_content, '[^0-9]', '', 'g') ~ '[0-9]{7,}'
    or p_evidence_class not in ('synthetic','development_proxy','real_owner') then
    raise exception using errcode = '22023', message = 'invalid_or_personal_momo_tracking_contract';
  end if;
  tagged := p_destination_url || '?utm_source=' || p_utm_source || '&utm_medium=' || p_utm_medium
    || '&utm_campaign=' || p_utm_campaign || '&utm_content=' || p_utm_content;
  fingerprint := encode(extensions.digest(convert_to(jsonb_build_object(
    'version','momo-tracking-contract-v1','restaurantId',p_restaurant_id,'subjectKey',p_subject_key,
    'platform',p_platform,'destinationUrl',p_destination_url,'taggedUrl',tagged
  )::text, 'UTF8'), 'sha256'), 'hex');
  select * into existing_record from public.veroxa_campaign_tracking_contracts contract
  where contract.restaurant_id = p_restaurant_id and contract.mapping_sha256 = fingerprint;
  if found then
    if existing_record.subject_key is distinct from p_subject_key
      or existing_record.platform is distinct from p_platform
      or existing_record.destination_url is distinct from p_destination_url
      or existing_record.utm_source is distinct from p_utm_source
      or existing_record.utm_medium is distinct from p_utm_medium
      or existing_record.utm_campaign is distinct from p_utm_campaign
      or existing_record.utm_content is distinct from p_utm_content
      or existing_record.tagged_url is distinct from tagged
      or existing_record.evidence_class is distinct from p_evidence_class then
      raise exception using errcode = '23505', message = 'momo_tracking_contract_idempotency_conflict';
    end if;
    return existing_record.id;
  end if;
  insert into public.veroxa_campaign_tracking_contracts (
    restaurant_id, subject_key, platform, destination_url, utm_source, utm_medium,
    utm_campaign, utm_content, tagged_url, mapping_sha256, evidence_keys,
    pii_scan_passed, evidence_class, created_by
  ) values (
    p_restaurant_id, p_subject_key, p_platform, p_destination_url, p_utm_source, p_utm_medium,
    p_utm_campaign, p_utm_content, tagged, fingerprint,
    '["google_campaign_tagging","google_analytics_pii"]'::jsonb, true,
    p_evidence_class, (select auth.uid())
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.veroxa_run_momo_preconnection_gate_v1(
  p_restaurant_id uuid
) returns table(gate_run_id uuid, status text, can_request_owner_access boolean, can_activate boolean, blockers jsonb)
language plpgsql security definer set search_path = ''
as $$
declare checks jsonb; blocker_list jsonb; all_pass boolean; new_id uuid;
  release_record public.veroxa_momo_release_attestations%rowtype;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_preconnection_gate_required';
  end if;
  select * into release_record from public.veroxa_momo_release_attestations attestation
  where attestation.restaurant_id = p_restaurant_id and attestation.status = 'passed'
    and attestation.verified_at <= now() and attestation.verified_at >= now() - interval '7 days'
  order by attestation.verified_at desc limit 1;
  checks := jsonb_build_object(
    'clientBundleIsolated', coalesce(release_record.checks -> 'clientBundleIsolated' = 'true'::jsonb, false),
    'clientSnapshotAllowlisted', coalesce(release_record.checks -> 'clientSnapshotAllowlisted' = 'true'::jsonb, false),
    'releaseTestsAttested', release_record.id is not null
      and release_record.commit_sha256 ~ '^[0-9a-f]{64}$'
      and release_record.client_artifact_sha256 ~ '^[0-9a-f]{64}$'
      and release_record.test_suite_sha256 ~ '^[0-9a-f]{64}$'
      and release_record.test_count >= 1
      and coalesce(release_record.checks ?& array[
        'clientBundleIsolated','clientSnapshotAllowlisted','migrationRlsTests',
        'mediaPlacementTests','storageReadbackTests','aiContractTests','publicationAdapterTests',
        'metricsContractTests','workLifecycleTests','scheduleDenialTests',
        'consentContractTests','evidenceRegistryParity','ownerHandoffTests'
      ], false)
      and not exists (select 1 from jsonb_each(release_record.checks) check_item
        where check_item.key = any(array[
          'clientBundleIsolated','clientSnapshotAllowlisted','migrationRlsTests',
          'mediaPlacementTests','storageReadbackTests','aiContractTests','publicationAdapterTests',
          'metricsContractTests','workLifecycleTests','scheduleDenialTests',
          'consentContractTests','evidenceRegistryParity','ownerHandoffTests'
        ]) and check_item.value is distinct from 'true'::jsonb),
    'imageEditRendered', coalesce(
      release_record.checks -> 'storageReadbackTests' = 'true'::jsonb, false)
      and exists (select 1 from public.veroxa_media_renditions rendition
      join storage.objects object on object.id = rendition.storage_object_id
      where rendition.restaurant_id = p_restaurant_id and rendition.status = 'ready'
        and rendition.source_kind = 'synthetic_fixture' and not rendition.external_write_allowed
        and rendition.output_hash_attested_at is not null
        and object.bucket_id = 'restaurant-media' and object.name = rendition.storage_path
        and object.version is not null
        and object.version is not distinct from rendition.storage_object_version
        and coalesce(object.metadata ->> 'mimetype','') = rendition.mime_type
        and coalesce((object.metadata ->> 'size')::bigint, -1) = rendition.file_size),
    'renditionLineagePersisted', exists (select 1 from public.veroxa_media_renditions rendition
      join storage.objects object on object.id = rendition.storage_object_id
      where rendition.restaurant_id = p_restaurant_id and rendition.status = 'ready'
        and rendition.recipe_fingerprint ~ '^[0-9a-f]{64}$'
        and rendition.source_content_sha256 ~ '^[0-9a-f]{64}$'
        and rendition.content_sha256 ~ '^[0-9a-f]{64}$'
        and rendition.output_hash_attested_at is not null
        and object.bucket_id = 'restaurant-media' and object.name = rendition.storage_path
        and object.version is not null
        and object.version is not distinct from rendition.storage_object_version),
    'mediaPlacementContractReady', to_regprocedure('public.veroxa_attach_momo_rendition_v1(uuid,uuid,uuid,uuid,text,text,smallint,text,jsonb)') is not null
      and coalesce(release_record.checks -> 'mediaPlacementTests' = 'true'::jsonb, false),
    'aiContractRehearsed', exists (select 1 from public.veroxa_ai_jobs job
      where job.restaurant_id = p_restaurant_id and job.status = 'completed'
        and job.rehearsal_contract_version = 'momo-ai-contract-rehearsal-v1'
        and job.prompt_version = 'momo-content-contract-v1'
        and job.model_key = 'provider-neutral-structured-output-v1'
        and job.execution_mode = 'rehearsal' and not job.provider_called
        and not job.external_write_allowed and job.human_review_required
        and coalesce((job.grounding_report ->> 'allClaimsSupported')::boolean, false)
        and job.output_payload -> 'claims' = '[]'::jsonb
        and job.output_payload -> 'channelVariants' ?& array['facebook','instagram','google_business']
        and job.evidence_keys @> '["google_people_first_content","ftc_truthful_advertising"]'::jsonb
        and job.input_sha256 = encode(extensions.digest(
          convert_to(job.input_payload::text, 'UTF8'), 'sha256'), 'hex')
        and job.output_sha256 = encode(extensions.digest(
          convert_to(job.output_payload::text, 'UTF8'), 'sha256'), 'hex')
        and veroxa_private.momo_ai_contract_valid_v1(
          job.restaurant_id, job.input_payload, job.output_payload,
          job.grounding_report, job.evidence_keys)
        and job.rehearsal_attested_at >= now() - interval '7 days')
      and coalesce(release_record.checks -> 'aiContractTests' = 'true'::jsonb, false),
    'multiChannelPublicationRehearsed', (select count(distinct rehearsal.channel) = 3
      from public.veroxa_publication_rehearsals rehearsal
      where rehearsal.restaurant_id = p_restaurant_id and rehearsal.scenario = 'success'
        and rehearsal.channel in ('facebook','instagram','google_business')
        and rehearsal.status = 'completed' and not rehearsal.external_write_allowed
        and rehearsal.payload_sha256 = encode(extensions.digest(
          convert_to(rehearsal.payload_snapshot::text, 'UTF8'), 'sha256'), 'hex')
        and rehearsal.payload_snapshot ->> 'restaurantId' = p_restaurant_id::text
        and rehearsal.payload_snapshot ->> 'channel' = rehearsal.channel
        and rehearsal.payload_snapshot ->> 'approvalSnapshotSha256' = rehearsal.approval_snapshot_sha256
        and veroxa_private.momo_publication_media_current_v1(
          rehearsal.restaurant_id, rehearsal.channel, rehearsal.evidence_class,
          rehearsal.payload_snapshot)
        and veroxa_private.momo_publication_variant_snapshot_current_v1(
          rehearsal.restaurant_id, rehearsal.variant_id, rehearsal.channel,
          rehearsal.payload_snapshot, rehearsal.approval_snapshot_sha256)
        and rehearsal.created_at >= now() - interval '7 days')
      and coalesce(release_record.checks -> 'publicationAdapterTests' = 'true'::jsonb, false),
    'publicationFailureMatrixRehearsed', (select count(*) = 3 from (
      select rehearsal.channel from public.veroxa_publication_rehearsals rehearsal
      where rehearsal.restaurant_id = p_restaurant_id
        and rehearsal.channel in ('facebook','instagram','google_business')
        and rehearsal.created_at >= now() - interval '7 days'
        and not rehearsal.external_write_allowed
        and rehearsal.payload_sha256 = encode(extensions.digest(
          convert_to(rehearsal.payload_snapshot::text, 'UTF8'), 'sha256'), 'hex')
        and veroxa_private.momo_publication_media_current_v1(
          rehearsal.restaurant_id, rehearsal.channel, rehearsal.evidence_class,
          rehearsal.payload_snapshot)
        and veroxa_private.momo_publication_variant_snapshot_current_v1(
          rehearsal.restaurant_id, rehearsal.variant_id, rehearsal.channel,
          rehearsal.payload_snapshot, rehearsal.approval_snapshot_sha256)
      group by rehearsal.channel
      having count(distinct rehearsal.scenario) = 3
        and count(*) filter (where rehearsal.scenario = 'transient_then_success'
          and rehearsal.status = 'completed' and jsonb_array_length(rehearsal.attempts) = 2) >= 1
        and count(*) filter (where rehearsal.scenario = 'permanent_failure'
          and rehearsal.status = 'dead_letter' and jsonb_array_length(rehearsal.attempts) = 1) >= 1
    ) channel_matrix),
    'seoBaselinePersisted', exists (select 1 from public.veroxa_seo_page_baselines baseline
      where baseline.restaurant_id = p_restaurant_id and baseline.page_url ~ '^https://momohousesa[.]com(/|$)'
        and baseline.observed_at >= now() - interval '30 days'
        and baseline.evidence_class = 'public_evidence' and baseline.execution_mode = 'rehearsal'
        and baseline.baseline_sha256 = encode(extensions.digest(
          convert_to(baseline.evidence_snapshot::text, 'UTF8'), 'sha256'), 'hex')
        and veroxa_private.momo_seo_baseline_valid_v1(
          baseline.page_url, baseline.observed_at, baseline.evidence_snapshot, baseline.findings)),
    'seoChangePlanPersisted', exists (select 1 from public.veroxa_seo_change_sets change_set
      join public.veroxa_seo_page_baselines baseline on baseline.id = change_set.baseline_id
        and baseline.restaurant_id = change_set.restaurant_id
      where change_set.restaurant_id = p_restaurant_id and change_set.status = 'draft'
        and change_set.evidence_class = 'public_evidence' and change_set.execution_mode = 'rehearsal'
        and not change_set.external_write_allowed
        and change_set.proposed_sha256 = encode(extensions.digest(
          convert_to(change_set.proposed_changes::text, 'UTF8'), 'sha256'), 'hex')
        and veroxa_private.momo_seo_change_valid_v1(
          change_set.target_url, baseline.evidence_snapshot -> 'pages', change_set.proposed_changes,
          change_set.rollback_snapshot, change_set.blocked_live_reasons)),
    'trackingMatrixRehearsed', (select count(distinct contract.platform) = 4
      from public.veroxa_campaign_tracking_contracts contract
      where contract.restaurant_id = p_restaurant_id
        and contract.platform in ('facebook','instagram','google_business','website')
        and contract.pii_scan_passed and not contract.external_write_allowed
        and contract.execution_mode = 'rehearsal'
        and contract.evidence_keys = '["google_campaign_tagging","google_analytics_pii"]'::jsonb
        and contract.created_at >= now() - interval '7 days'),
    'metricsContractRehearsed', (select count(distinct snapshot.source) = 4
      from public.veroxa_visibility_snapshots snapshot
      where snapshot.restaurant_id = p_restaurant_id
        and snapshot.source in ('facebook','instagram','google_business','website')
        and snapshot.schema_version = 'momo-metrics-rehearsal-v1'
        and snapshot.execution_mode = 'rehearsal' and not snapshot.external_write_allowed
        and snapshot.evidence_class = 'synthetic'
        and veroxa_private.momo_metrics_payload_valid_v1(snapshot.source, snapshot.metrics)
        and snapshot.snapshot_sha256 = encode(extensions.digest(convert_to(jsonb_build_object(
          'version','momo-metrics-rehearsal-v1','restaurantId',snapshot.restaurant_id,
          'source',snapshot.source,'periodStart',snapshot.period_start,'periodEnd',snapshot.period_end,
          'metrics',snapshot.metrics
        )::text, 'UTF8'), 'sha256'), 'hex')
        and snapshot.captured_at >= now() - interval '7 days')
      and coalesce(release_record.checks -> 'metricsContractTests' = 'true'::jsonb, false),
    'automationLifecycleTested', coalesce(release_record.checks -> 'workLifecycleTests' = 'true'::jsonb, false)
      and coalesce(release_record.checks -> 'scheduleDenialTests' = 'true'::jsonb, false),
    'developmentEvidenceIsolated', exists (select 1 from public.veroxa_momo_evidence_authorities authority
      where authority.restaurant_id = p_restaurant_id and authority.active
        and authority.evidence_class = 'development_proxy'),
    'specificConsentBoundaryReady', coalesce(release_record.checks -> 'consentContractTests' = 'true'::jsonb, false)
      and to_regprocedure('public.veroxa_request_momo_action_consent_v1(uuid,text,text,text,jsonb,timestamptz)') is not null
      and to_regprocedure('public.veroxa_decide_momo_action_consent_v1(uuid,text,text)') is not null
      and to_regprocedure('public.veroxa_revoke_momo_action_consent_v1(uuid,text)') is not null
      and to_regprocedure('public.veroxa_validate_momo_action_consent_v1(uuid,uuid,text,text,jsonb)') is not null
      and not exists (select 1 from public.veroxa_momo_action_consents consent
        join public.veroxa_user_profiles profile on profile.user_id = consent.decided_by
        where consent.restaurant_id = p_restaurant_id and consent.status = 'approved'
          and lower(profile.email) = 'faraz.munir.gohar@icloud.com'),
    'growthEvidenceManifestExact', veroxa_private.momo_growth_evidence_manifest_valid_v1(
      '2026-07-16-v1', 19, '09ec19d9517ed3b9bb3162c9c5599bde3b0a485362cc24bbadc138e09891c4b1'
    ) and coalesce(release_record.checks -> 'evidenceRegistryParity' = 'true'::jsonb, false),
    'cacheTtlAutomationReady', exists (select 1 from cron.job
      where jobname = 'veroxa-momo-external-cache-purge' and active
        and schedule = '17 3 * * *'
        and command = 'select veroxa_private.purge_expired_momo_external_cache_v1();')
      and not exists (select 1 from public.veroxa_external_content_cache cache
        where cache.restaurant_id = p_restaurant_id and cache.expires_at <= now()),
    'ownerHandoffContractReady', to_regprocedure('public.veroxa_assign_momo_real_owner_authority_v1(uuid,text,jsonb)') is not null
      and to_regprocedure('public.veroxa_prepare_momo_account_handoff_v1(uuid,text,text)') is not null
      and coalesce(release_record.checks -> 'ownerHandoffTests' = 'true'::jsonb, false),
    'runtimeControlsLocked', exists (select 1 from public.veroxa_momo_runtime_controls control
      where control.restaurant_id = p_restaurant_id and not control.ai_live_calls
        and not control.provider_writes and not control.review_replies
        and not control.website_writes and not control.external_scheduling),
    'externalConnectionsInactive', not exists (select 1 from public.veroxa_provider_connections connection
      where connection.restaurant_id = p_restaurant_id and connection.status not in ('not_connected','revoked')),
    'activationRemainsBlocked', not exists (select 1 from public.veroxa_readiness_gate_runs gate
      where gate.restaurant_id = p_restaurant_id and gate.status = 'verified')
  );
  select coalesce(bool_and(value::boolean), false) into all_pass from jsonb_each_text(checks);
  select coalesce(jsonb_agg(key order by key), '[]'::jsonb) into blocker_list
  from jsonb_each_text(checks) where value::boolean = false;
  insert into public.veroxa_preconnection_gate_runs (
    restaurant_id, status, checks, blockers, can_request_owner_access, evaluated_by
  ) values (
    p_restaurant_id, case when all_pass then 'pass' else 'blocked' end,
    checks, blocker_list, all_pass, (select auth.uid())
  ) returning id into new_id;
  return query select new_id, case when all_pass then 'pass' else 'blocked' end,
    all_pass, false, blocker_list;
end;
$$;

create or replace function public.veroxa_prepare_momo_account_handoff_v1(
  p_restaurant_id uuid, p_source_email text, p_replacement_email text
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare source_id uuid; replacement_id uuid; new_id uuid; snapshot jsonb;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_account_handoff_required';
  end if;
  select profile.user_id into source_id from public.veroxa_user_profiles profile
  join public.veroxa_restaurant_members member on member.user_id = profile.user_id
  where lower(profile.email) = lower(btrim(p_source_email)) and member.restaurant_id = p_restaurant_id
    and profile.role = 'client' and member.role = 'client' and profile.status = 'active' and member.status = 'active';
  select profile.user_id into replacement_id from public.veroxa_user_profiles profile
  join public.veroxa_restaurant_members member on member.user_id = profile.user_id
  join public.veroxa_momo_evidence_authorities authority
    on authority.user_id = profile.user_id and authority.restaurant_id = member.restaurant_id
  where lower(profile.email) = lower(btrim(p_replacement_email)) and member.restaurant_id = p_restaurant_id
    and profile.role = 'client' and member.role = 'client' and profile.status = 'active' and member.status = 'active'
    and authority.active and authority.evidence_class = 'real_owner';
  if source_id is null or replacement_id is null or source_id = replacement_id then
    raise exception using errcode = '23514', message = 'momo_handoff_requires_active_proxy_and_real_owner';
  end if;
  snapshot := jsonb_build_object(
    'truthFields', (select count(*) from public.veroxa_restaurant_truth_fields field
      where field.restaurant_id = p_restaurant_id and field.owner_confirmed_by = source_id),
    'confirmations', (select count(*) from public.veroxa_confirmations confirmation
      where confirmation.restaurant_id = p_restaurant_id and confirmation.submitted_by = source_id),
    'mediaRights', (select count(*) from public.veroxa_media_rights rights
      where rights.restaurant_id = p_restaurant_id and rights.confirmed_by = source_id),
    'rule', 'Preserve historical authorship; deactivate the proxy only after replacement authority is active.'
  );
  insert into public.veroxa_momo_account_handoffs (
    restaurant_id, source_user_id, replacement_user_id, dependency_snapshot, prepared_by
  ) values (p_restaurant_id, source_id, replacement_id, snapshot, (select auth.uid()))
  returning id into new_id;
  return new_id;
end;
$$;

-- Storage path parsing is shared by RLS. Recognize only the two canonical
-- restaurant namespaces; malformed UUIDs and adjacent folders fail closed.
create or replace function public.veroxa_restaurant_id_from_storage_path(object_name text)
returns uuid language plpgsql immutable set search_path = 'pg_catalog'
as $$
declare restaurant_text text;
begin
  if object_name is null or object_name !~
    '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/(uploads|renditions)/' then
    return null;
  end if;
  restaurant_text := split_part(object_name, '/', 2);
  return restaurant_text::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

-- Storage is immutable: active clients can access their restaurant originals,
-- authorized Team can review those originals, and only Team can access
-- generated files under /renditions.
drop policy if exists veroxa_restaurant_media_member_select on storage.objects;
create policy veroxa_restaurant_media_member_select on storage.objects
for select to authenticated using (
  bucket_id = 'restaurant-media'
  and (
    (name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/uploads/'
      and (
        public.veroxa_current_user_has_active_restaurant(
          public.veroxa_restaurant_id_from_storage_path(name))
        or public.veroxa_current_user_is_team_for_restaurant(
          public.veroxa_restaurant_id_from_storage_path(name))
      ))
    or
    (name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/renditions/'
      and public.veroxa_current_user_is_team_for_restaurant(
        public.veroxa_restaurant_id_from_storage_path(name)))
  )
);

drop policy if exists veroxa_restaurant_media_client_insert on storage.objects;
drop policy if exists veroxa_restaurant_media_client_upload_insert on storage.objects;
create policy veroxa_restaurant_media_client_upload_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'restaurant-media'
  and name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/uploads/[0-9]{4}/[0-9]{2}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|heic|heif|mp4|mov|webm)$'
  and public.veroxa_current_user_has_active_restaurant(public.veroxa_restaurant_id_from_storage_path(name))
);

drop policy if exists veroxa_restaurant_media_client_delete_orphan on storage.objects;
create policy veroxa_restaurant_media_client_delete_orphan on storage.objects
for delete to authenticated using (
  bucket_id = 'restaurant-media'
  and name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/uploads/'
  and owner_id = (select auth.uid())::text
  and public.veroxa_current_user_has_active_restaurant(public.veroxa_restaurant_id_from_storage_path(name))
  and not public.veroxa_media_storage_path_registered(name)
);

drop policy if exists veroxa_restaurant_media_team_rendition_insert on storage.objects;
create policy veroxa_restaurant_media_team_rendition_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'restaurant-media'
  and name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/renditions/[a-z0-9-]{3,80}/[0-9a-f]{64}\.(jpg|png|webp)$'
  and public.veroxa_current_user_is_team_for_restaurant(public.veroxa_restaurant_id_from_storage_path(name))
);

drop policy if exists veroxa_restaurant_media_team_orphan_rendition_delete on storage.objects;
create policy veroxa_restaurant_media_team_orphan_rendition_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'restaurant-media'
  and name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/renditions/[a-z0-9-]{3,80}/[0-9a-f]{64}\.(jpg|png|webp)$'
  and public.veroxa_current_user_is_team_for_restaurant(public.veroxa_restaurant_id_from_storage_path(name))
  and not public.veroxa_media_storage_path_registered(name)
);

grant select on public.veroxa_momo_evidence_authorities, public.veroxa_growth_evidence_sources,
  public.veroxa_momo_action_consents,
  public.veroxa_momo_runtime_controls,
  public.veroxa_media_renditions, public.veroxa_content_media_placements,
  public.veroxa_publication_rehearsals, public.veroxa_seo_page_baselines,
  public.veroxa_seo_change_sets, public.veroxa_preconnection_gate_runs,
  public.veroxa_momo_account_handoffs, public.veroxa_momo_authority_events,
  public.veroxa_momo_release_attestations, public.veroxa_campaign_tracking_contracts
to authenticated;

grant select, insert, update, delete on public.veroxa_momo_evidence_authorities,
  public.veroxa_growth_evidence_sources, public.veroxa_momo_action_consents,
  public.veroxa_external_content_cache, public.veroxa_momo_runtime_controls,
  public.veroxa_media_renditions, public.veroxa_content_media_placements,
  public.veroxa_publication_rehearsals, public.veroxa_seo_page_baselines,
  public.veroxa_seo_change_sets, public.veroxa_preconnection_gate_runs,
  public.veroxa_momo_account_handoffs, public.veroxa_momo_authority_events,
  public.veroxa_momo_release_attestations, public.veroxa_campaign_tracking_contracts
to service_role;

revoke insert on public.veroxa_ai_jobs from authenticated;

revoke all on function veroxa_private.classify_momo_confirmation_v1(),
  veroxa_private.classify_momo_truth_v1(),
  veroxa_private.classify_momo_media_rights_v1(),
  veroxa_private.validate_deferred_ai_job_v1(),
  veroxa_private.momo_growth_evidence_row_canonical_v1(text,text,text,text,text,date,text,jsonb),
  veroxa_private.momo_growth_evidence_manifest_valid_v1(text,integer,text)
from public, anon, authenticated;

revoke all on function public.veroxa_momo_client_snapshot_v1(uuid),
  public.veroxa_provider_preflight_v1(uuid,text,text),
  public.veroxa_momo_readiness_summary_v1(uuid),
  public.veroxa_run_momo_no_go_rehearsal_v1(uuid,text),
  public.veroxa_media_storage_path_registered(text),
  public.veroxa_request_momo_action_consent_v1(uuid,text,text,text,jsonb,timestamptz),
  public.veroxa_decide_momo_action_consent_v1(uuid,text,text),
  public.veroxa_revoke_momo_action_consent_v1(uuid,text),
  public.veroxa_validate_momo_action_consent_v1(uuid,uuid,text,text,jsonb),
  public.veroxa_assign_momo_real_owner_authority_v1(uuid,text,jsonb),
  public.veroxa_cache_momo_external_content_v1(uuid,text,text,jsonb,timestamptz,timestamptz),
  public.veroxa_read_momo_external_content_cache_v1(uuid,text,text),
  public.veroxa_purge_momo_external_content_cache_v1(uuid),
  public.veroxa_prepare_momo_ai_job_v1(uuid,text,text,uuid),
  public.veroxa_record_momo_ai_contract_rehearsal_v1(uuid,text,jsonb,jsonb,jsonb,jsonb),
  public.veroxa_record_momo_metrics_rehearsal_v1(uuid,text,date,date,jsonb),
  public.veroxa_record_momo_original_metadata_v1(uuid,uuid,text,integer,integer),
  public.veroxa_prepare_momo_rendition_v1(uuid,text,uuid,text,text,text,integer,integer,jsonb,text,text,text),
  public.veroxa_register_momo_rendition_v1(uuid,text,uuid,text,text,text,text,bigint,integer,integer,text,text,jsonb,text,text,text),
  public.veroxa_attach_momo_rendition_v1(uuid,uuid,uuid,uuid,text,text,smallint,text,jsonb),
  public.veroxa_record_momo_publication_rehearsal_v1(uuid,text,uuid,text,jsonb,text,text,text,jsonb,jsonb,text),
  public.veroxa_record_momo_seo_baseline_v1(uuid,text,text,timestamptz,jsonb,jsonb,text),
  public.veroxa_record_momo_seo_change_set_v1(uuid,uuid,text,jsonb,jsonb,jsonb,text),
  public.veroxa_record_momo_tracking_contract_v1(uuid,text,text,text,text,text,text,text,text),
  public.veroxa_run_momo_preconnection_gate_v1(uuid),
  public.veroxa_prepare_momo_account_handoff_v1(uuid,text,text)
from public, anon;

grant execute on function public.veroxa_momo_client_snapshot_v1(uuid),
  public.veroxa_provider_preflight_v1(uuid,text,text),
  public.veroxa_momo_readiness_summary_v1(uuid),
  public.veroxa_run_momo_no_go_rehearsal_v1(uuid,text),
  public.veroxa_media_storage_path_registered(text),
  public.veroxa_request_momo_action_consent_v1(uuid,text,text,text,jsonb,timestamptz),
  public.veroxa_decide_momo_action_consent_v1(uuid,text,text),
  public.veroxa_revoke_momo_action_consent_v1(uuid,text),
  public.veroxa_validate_momo_action_consent_v1(uuid,uuid,text,text,jsonb),
  public.veroxa_assign_momo_real_owner_authority_v1(uuid,text,jsonb),
  public.veroxa_cache_momo_external_content_v1(uuid,text,text,jsonb,timestamptz,timestamptz),
  public.veroxa_read_momo_external_content_cache_v1(uuid,text,text),
  public.veroxa_purge_momo_external_content_cache_v1(uuid),
  public.veroxa_prepare_momo_ai_job_v1(uuid,text,text,uuid),
  public.veroxa_record_momo_ai_contract_rehearsal_v1(uuid,text,jsonb,jsonb,jsonb,jsonb),
  public.veroxa_record_momo_metrics_rehearsal_v1(uuid,text,date,date,jsonb),
  public.veroxa_record_momo_original_metadata_v1(uuid,uuid,text,integer,integer),
  public.veroxa_prepare_momo_rendition_v1(uuid,text,uuid,text,text,text,integer,integer,jsonb,text,text,text),
  public.veroxa_register_momo_rendition_v1(uuid,text,uuid,text,text,text,text,bigint,integer,integer,text,text,jsonb,text,text,text),
  public.veroxa_attach_momo_rendition_v1(uuid,uuid,uuid,uuid,text,text,smallint,text,jsonb),
  public.veroxa_record_momo_publication_rehearsal_v1(uuid,text,uuid,text,jsonb,text,text,text,jsonb,jsonb,text),
  public.veroxa_record_momo_seo_baseline_v1(uuid,text,text,timestamptz,jsonb,jsonb,text),
  public.veroxa_record_momo_seo_change_set_v1(uuid,uuid,text,jsonb,jsonb,jsonb,text),
  public.veroxa_record_momo_tracking_contract_v1(uuid,text,text,text,text,text,text,text,text),
  public.veroxa_run_momo_preconnection_gate_v1(uuid),
  public.veroxa_prepare_momo_account_handoff_v1(uuid,text,text)
to authenticated;
