-- Momo Media AI pilot v1
--
-- Connects the existing Team-only Review -> Improve -> Ready workflow to a
-- private, approval-controlled image-edit provider path. This migration:
--   * enables only internal AI image processing for Momo;
--   * keeps every external account/write/scheduling control locked;
--   * enforces a non-recurring USD 2.00 internal reservation ceiling while
--     provider billing remains governed separately;
--   * stores provider output as a private candidate until a Team member opens,
--     inspects, and explicitly approves it;
--   * never changes the original asset or publishes a candidate.

create extension if not exists pgcrypto;
create schema if not exists veroxa_private;
revoke all on schema veroxa_private from public, anon, authenticated;

-- The former constraint intentionally locked every runtime capability. Media
-- AI is an internal provider call, not an external restaurant-account write.
-- Keep all consequential external controls immutably false while allowing the
-- separately budgeted ai_live_calls flag to be enabled for this pilot.
alter table public.veroxa_momo_runtime_controls
  drop constraint if exists veroxa_momo_runtime_controls_all_locked;
alter table public.veroxa_momo_runtime_controls
  add constraint veroxa_momo_runtime_controls_external_writes_locked check (
    not provider_writes
    and not review_replies
    and not website_writes
    and not external_scheduling
  );

create table veroxa_private.momo_media_ai_wallets (
  restaurant_id uuid primary key
    references public.veroxa_restaurants(id) on delete cascade,
  enabled boolean not null default false,
  model text not null default 'gpt-image-2'
    check (model = 'gpt-image-2'),
  pricing_version text not null
    default 'openai-gpt-image-2-2026-07-28-v1'
    check (pricing_version = 'openai-gpt-image-2-2026-07-28-v1'),
  low_reservation_microusd bigint not null default 100000
    check (low_reservation_microusd = 100000),
  medium_reservation_microusd bigint not null default 250000
    check (medium_reservation_microusd = 250000),
  lifetime_budget_microusd bigint not null default 2000000
    check (lifetime_budget_microusd between 0 and 2000000),
  lifetime_request_limit integer not null default 20
    check (lifetime_request_limit between 0 and 20),
  updated_at timestamptz not null default clock_timestamp(),
  updated_reason text not null default 'momo-media-ai-pilot-v1'
    check (char_length(btrim(updated_reason)) between 3 and 200)
);

revoke all on table veroxa_private.momo_media_ai_wallets
  from public, anon, authenticated, service_role;
alter table veroxa_private.momo_media_ai_wallets enable row level security;
alter table veroxa_private.momo_media_ai_wallets force row level security;

create table public.veroxa_momo_media_ai_candidates (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete cascade,
  source_asset_id uuid not null
    references public.veroxa_media_assets(id) on delete cascade,
  source_storage_path text not null,
  source_storage_object_id uuid not null,
  source_storage_object_version text not null,
  source_mime_type text not null
    check (source_mime_type in ('image/jpeg','image/png','image/webp')),
  source_file_size bigint not null
    check (source_file_size between 1 and 20971520),
  source_content_sha256 text not null
    check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  evidence_class text not null
    check (evidence_class in ('development_proxy','real_owner')),
  rights_id uuid not null references public.veroxa_media_rights(id),
  rights_attestation_version text not null,
  rights_attestation_sha256 text not null
    check (rights_attestation_sha256 ~ '^[0-9a-f]{64}$'),
  review_id uuid not null references public.veroxa_media_reviews(id),
  goal text not null
    check (goal in ('lighting_color','food_focus','background_cleanup')),
  preset_key text not null check (preset_key in (
    'instagram_square','instagram_portrait','instagram_story',
    'facebook_feed','google_business_square','website_hero'
  )),
  intended_use text not null
    check (intended_use in ('facebook','instagram','google_business','website')),
  quality text not null check (quality in ('low','medium')),
  output_width integer not null check (output_width between 16 and 3840),
  output_height integer not null check (output_height between 16 and 3840),
  output_mime_type text not null default 'image/png'
    check (output_mime_type = 'image/png'),
  alt_text text not null
    check (char_length(btrim(alt_text)) between 1 and 280),
  model text not null check (model = 'gpt-image-2'),
  prompt_version text not null
    check (prompt_version = 'momo-media-ai-v1'),
  pricing_version text not null
    check (pricing_version = 'openai-gpt-image-2-2026-07-28-v1'),
  idempotency_hash text not null check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  request_snapshot jsonb not null check (jsonb_typeof(request_snapshot) = 'object'),
  processing_attestation_version text not null
    check (processing_attestation_version = 'momo-media-ai-processing-v1'),
  processing_attestation_text text not null,
  processing_attestation_sha256 text not null
    check (processing_attestation_sha256 ~ '^[0-9a-f]{64}$'),
  requested_by uuid not null references public.veroxa_user_profiles(user_id),
  requested_at timestamptz not null default clock_timestamp(),
  reserved_microusd bigint not null
    check (reserved_microusd in (100000,250000)),
  accounted_microusd bigint
    check (accounted_microusd is null or accounted_microusd in (0,100000,250000)),
  status text not null default 'reserved' check (status in (
    'reserved','provider_running','pending_review','approved','rejected','failed'
  )),
  provider_called boolean not null default false,
  provider_started_at timestamptz,
  provider_request_id text check (
    provider_request_id is null
    or char_length(btrim(provider_request_id)) between 1 and 200
  ),
  provider_error_code text check (
    provider_error_code is null
    or provider_error_code ~ '^[a-z0-9_]{3,80}$'
  ),
  storage_path text unique,
  storage_object_id uuid,
  storage_object_version text,
  file_size bigint check (file_size is null or file_size between 1 and 26214400),
  content_sha256 text check (
    content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$'
  ),
  generated_at timestamptz,
  inspection_attestation_version text check (
    inspection_attestation_version is null
    or inspection_attestation_version = 'momo-media-ai-inspection-v1'
  ),
  inspection_attestation_text text,
  inspection_notes text check (
    inspection_notes is null
    or char_length(btrim(inspection_notes)) between 10 and 1000
  ),
  inspected_by uuid references public.veroxa_user_profiles(user_id),
  inspected_at timestamptz,
  rendition_id uuid unique references public.veroxa_media_renditions(id),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  updated_at timestamptz not null default clock_timestamp(),
  unique (restaurant_id, idempotency_hash),
  constraint veroxa_momo_media_ai_output_dimensions check (
    (preset_key = 'instagram_square'
      and output_width = 1024 and output_height = 1024
      and intended_use = 'instagram')
    or (preset_key = 'instagram_portrait'
      and output_width = 1024 and output_height = 1280
      and intended_use = 'instagram')
    or (preset_key = 'instagram_story'
      and output_width = 1024 and output_height = 1824
      and intended_use = 'instagram')
    or (preset_key = 'facebook_feed'
      and output_width = 1024 and output_height = 1280
      and intended_use = 'facebook')
    or (preset_key = 'google_business_square'
      and output_width = 1024 and output_height = 1024
      and intended_use = 'google_business')
    or (preset_key = 'website_hero'
      and output_width = 1536 and output_height = 864
      and intended_use = 'website')
  ),
  constraint veroxa_momo_media_ai_processing_attestation check (
    processing_attestation_text =
      'I confirm this Team-only AI request may send the selected private image to OpenAI solely to create one private improvement candidate. It will not alter the original or publish anything.'
    and processing_attestation_sha256 = encode(
      extensions.digest(
        convert_to(processing_attestation_text, 'UTF8'),
        'sha256'
      ),
      'hex'
    )
  ),
  constraint veroxa_momo_media_ai_state_contract check (
    (
      status = 'reserved'
      and not provider_called
      and provider_started_at is null
      and accounted_microusd is null
      and storage_path is null
      and content_sha256 is null
      and rendition_id is null
    )
    or (
      status = 'provider_running'
      and provider_called
      and provider_started_at is not null
      and accounted_microusd is null
      and storage_path is null
      and content_sha256 is null
      and rendition_id is null
    )
    or (
      status = 'pending_review'
      and provider_called
      and provider_started_at is not null
      and accounted_microusd = reserved_microusd
      and provider_request_id is not null
      and storage_path is not null
      and storage_object_id is not null
      and storage_object_version is not null
      and file_size is not null
      and content_sha256 is not null
      and generated_at is not null
      and rendition_id is null
      and inspected_by is null
      and inspected_at is null
    )
    or (
      status = 'approved'
      and provider_called
      and accounted_microusd = reserved_microusd
      and storage_path is not null
      and storage_object_id is not null
      and storage_object_version is not null
      and content_sha256 is not null
      and inspection_attestation_version = 'momo-media-ai-inspection-v1'
      and inspection_attestation_text is not null
      and inspection_notes is not null
      and inspected_by is not null
      and inspected_at is not null
      and rendition_id is not null
    )
    or (
      status = 'rejected'
      and provider_called
      and accounted_microusd = reserved_microusd
      and storage_path is not null
      and storage_object_id is not null
      and content_sha256 is not null
      and inspection_attestation_version = 'momo-media-ai-inspection-v1'
      and inspection_attestation_text is not null
      and inspection_notes is not null
      and inspected_by is not null
      and inspected_at is not null
      and rendition_id is null
    )
    or (
      status = 'failed'
      and accounted_microusd = case when provider_called then reserved_microusd else 0 end
      and provider_error_code is not null
      and storage_path is null
      and storage_object_id is null
      and content_sha256 is null
      and rendition_id is null
    )
  )
);

create index veroxa_momo_media_ai_candidate_asset_idx
  on public.veroxa_momo_media_ai_candidates
  (restaurant_id, source_asset_id, requested_at desc);
create unique index veroxa_momo_media_ai_one_active_asset_idx
  on public.veroxa_momo_media_ai_candidates
  (restaurant_id, source_asset_id)
  where status in ('reserved','provider_running','pending_review');
create index veroxa_momo_media_ai_candidate_budget_idx
  on public.veroxa_momo_media_ai_candidates
  (restaurant_id, status, requested_at);

alter table public.veroxa_momo_media_ai_candidates enable row level security;
alter table public.veroxa_momo_media_ai_candidates force row level security;

drop policy if exists veroxa_momo_media_ai_team_select
  on public.veroxa_momo_media_ai_candidates;
create policy veroxa_momo_media_ai_team_select
  on public.veroxa_momo_media_ai_candidates
  for select
  to authenticated
  using (
    public.veroxa_current_user_is_team_for_restaurant(restaurant_id)
  );

revoke all on table public.veroxa_momo_media_ai_candidates
  from public, anon, authenticated, service_role;
grant select on table public.veroxa_momo_media_ai_candidates
  to authenticated;

create or replace function
veroxa_private.momo_media_ai_actor_has_operational_team_v1(
  p_restaurant_id uuid,
  p_actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_actor_id is not null and exists (
    select 1
    from veroxa_private.operational_restaurant_scope scope
    join public.veroxa_restaurants restaurant
      on restaurant.id = scope.restaurant_id
    join public.veroxa_restaurant_members member
      on member.restaurant_id = scope.restaurant_id
      and member.user_id = p_actor_id
    join public.veroxa_user_profiles profile
      on profile.user_id = member.user_id
    where scope.scope_key = 'momo_house_san_antonio'
      and scope.enabled
      and scope.restaurant_id = p_restaurant_id
      and restaurant.status =
        'active'::public.veroxa_account_status_v1
      and member.status =
        'active'::public.veroxa_account_status_v1
      and profile.status =
        'active'::public.veroxa_account_status_v1
      and member.role = profile.role
      and profile.role = 'team'::public.veroxa_role_v1
  );
$$;

revoke all on function
  veroxa_private.momo_media_ai_actor_has_operational_team_v1(uuid,uuid)
from public, anon, authenticated, service_role;

create or replace function public.veroxa_reserve_momo_media_ai_candidate_v1(
  p_restaurant_id uuid,
  p_source_asset_id uuid,
  p_goal text,
  p_preset_key text,
  p_quality text,
  p_alt_text text,
  p_idempotency_hash text,
  p_request_hash text,
  p_processing_attestation_text text
)
returns table (
  candidate_id uuid,
  candidate_status text,
  source_storage_path text,
  source_mime_type text,
  source_file_size bigint,
  source_content_sha256 text,
  output_width integer,
  output_height integer,
  intended_use text,
  evidence_class text,
  reserved_microusd bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet veroxa_private.momo_media_ai_wallets%rowtype;
  v_asset public.veroxa_media_assets%rowtype;
  v_rights public.veroxa_media_rights%rowtype;
  v_review public.veroxa_media_reviews%rowtype;
  v_source_object record;
  v_existing public.veroxa_momo_media_ai_candidates%rowtype;
  v_use text;
  v_width integer;
  v_height integer;
  v_request_count bigint;
  v_committed_microusd bigint;
  v_attestation_hash text;
  v_snapshot jsonb;
  v_reservation_microusd bigint;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_team_required';
  end if;
  if p_source_asset_id is null
    or p_goal is null
    or p_goal not in ('lighting_color','food_focus','background_cleanup')
    or p_preset_key is null
    or p_preset_key not in (
      'instagram_square','instagram_portrait','instagram_story',
      'facebook_feed','google_business_square','website_hero'
    )
    or p_quality is null
    or p_quality not in ('low','medium')
    or p_alt_text is null
    or p_alt_text is distinct from btrim(p_alt_text)
    or char_length(p_alt_text) not between 1 and 280
    or p_idempotency_hash is null
    or p_idempotency_hash !~ '^[0-9a-f]{64}$'
    or p_request_hash is null
    or p_request_hash !~ '^[0-9a-f]{64}$'
    or p_processing_attestation_text is distinct from
      'I confirm this Team-only AI request may send the selected private image to OpenAI solely to create one private improvement candidate. It will not alter the original or publish anything.'
  then
    raise exception using errcode = '22023',
      message = 'invalid_momo_media_ai_request';
  end if;

  select
    case p_preset_key
      when 'instagram_square' then 'instagram'
      when 'instagram_portrait' then 'instagram'
      when 'instagram_story' then 'instagram'
      when 'facebook_feed' then 'facebook'
      when 'google_business_square' then 'google_business'
      when 'website_hero' then 'website'
    end,
    case p_preset_key
      when 'instagram_square' then 1024
      when 'instagram_portrait' then 1024
      when 'instagram_story' then 1024
      when 'facebook_feed' then 1024
      when 'google_business_square' then 1024
      when 'website_hero' then 1536
    end,
    case p_preset_key
      when 'instagram_square' then 1024
      when 'instagram_portrait' then 1280
      when 'instagram_story' then 1824
      when 'facebook_feed' then 1280
      when 'google_business_square' then 1024
      when 'website_hero' then 864
    end
  into v_use, v_width, v_height;

  select asset.* into v_asset
  from public.veroxa_media_assets asset
  where asset.id = p_source_asset_id
    and asset.restaurant_id = p_restaurant_id
    and asset.mime_type in ('image/jpeg','image/png','image/webp')
    and asset.file_size between 1 and 20971520
    and asset.content_sha256 ~ '^[0-9a-f]{64}$'
    and asset.width is not null
    and asset.height is not null
    and asset.status = 'ready_to_use';
  if not found then
    raise exception using errcode = '23514',
      message = 'momo_media_ai_source_not_eligible';
  end if;

  select object.id, object.version, object.metadata
  into v_source_object
  from storage.objects object
  where object.bucket_id = 'restaurant-media'
    and object.name = v_asset.storage_path;
  if not found
    or v_source_object.version is null
    or coalesce(v_source_object.metadata ->> 'mimetype', '') <> v_asset.mime_type
    or coalesce((v_source_object.metadata ->> 'size')::bigint, -1)
      <> v_asset.file_size
  then
    raise exception using errcode = '23503',
      message = 'verified_momo_media_ai_source_object_required';
  end if;

  select rights.* into v_rights
  from public.veroxa_media_rights rights
  where rights.restaurant_id = p_restaurant_id
    and rights.asset_id = p_source_asset_id
    and rights.rights_status = 'confirmed'
    and rights.evidence_class in ('development_proxy','real_owner')
    and rights.attestation_version = 'momo-media-rights-v1'
    and rights.attestation_sha256 ~ '^[0-9a-f]{64}$'
    and (rights.valid_from is null or rights.valid_from <= now())
    and (rights.expires_at is null or rights.expires_at > now())
    and rights.usage_scope ? v_use;
  if not found then
    raise exception using errcode = '23514',
      message = 'momo_media_ai_current_rights_review_required';
  end if;

  select review.* into v_review
  from public.veroxa_media_reviews review
  where review.restaurant_id = p_restaurant_id
    and review.asset_id = p_source_asset_id
    and review.is_current
    and review.status = 'approved'
    and review.public_use_approved;
  if not found then
    raise exception using errcode = '23514',
      message = 'momo_media_ai_current_rights_review_required';
  end if;

  if not exists (
    select 1
    from public.veroxa_momo_runtime_controls control
    where control.restaurant_id = p_restaurant_id
      and control.ai_live_calls
      and not control.provider_writes
      and not control.review_replies
      and not control.website_writes
      and not control.external_scheduling
  ) then
    raise exception using errcode = '55000',
      message = 'momo_media_ai_runtime_disabled';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_restaurant_id::text || ':' || p_source_asset_id::text,
      0
    )
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_restaurant_id::text || ':' || p_idempotency_hash,
      0
    )
  );

  select candidate.* into v_existing
  from public.veroxa_momo_media_ai_candidates candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.idempotency_hash = p_idempotency_hash
  for update;
  if found then
    if v_existing.request_hash is distinct from p_request_hash
      or v_existing.source_asset_id is distinct from p_source_asset_id
      or v_existing.source_content_sha256 is distinct from v_asset.content_sha256
      or v_existing.goal is distinct from p_goal
      or v_existing.preset_key is distinct from p_preset_key
      or v_existing.quality is distinct from p_quality
      or v_existing.alt_text is distinct from p_alt_text
    then
      raise exception using errcode = '23505',
        message = 'momo_media_ai_idempotency_conflict';
    end if;
    if v_existing.status = 'failed' then
      raise exception using errcode = '55000',
        message = 'momo_media_ai_failed_attempt_cannot_replay';
    end if;
    return query select
      v_existing.id,
      v_existing.status,
      v_existing.source_storage_path,
      v_existing.source_mime_type,
      v_existing.source_file_size,
      v_existing.source_content_sha256,
      v_existing.output_width,
      v_existing.output_height,
      v_existing.intended_use,
      v_existing.evidence_class,
      v_existing.reserved_microusd;
    return;
  end if;

  if exists (
    select 1
    from public.veroxa_momo_media_ai_candidates candidate
    where candidate.restaurant_id = p_restaurant_id
      and candidate.source_asset_id = p_source_asset_id
      and candidate.status in (
        'reserved',
        'provider_running',
        'pending_review'
      )
  ) then
    raise exception using errcode = '55000',
      message = 'momo_media_ai_asset_attempt_active';
  end if;

  select wallet.* into v_wallet
  from veroxa_private.momo_media_ai_wallets wallet
  where wallet.restaurant_id = p_restaurant_id
  for update;
  if not found
    or not v_wallet.enabled
    or v_wallet.lifetime_budget_microusd <= 0
    or v_wallet.lifetime_request_limit <= 0
  then
    raise exception using errcode = '55000',
      message = 'momo_media_ai_wallet_disabled';
  end if;
  v_reservation_microusd := case p_quality
    when 'medium' then v_wallet.medium_reservation_microusd
    else v_wallet.low_reservation_microusd
  end;

  select
    count(*),
    coalesce(sum(
      case
        when candidate.status in ('reserved','provider_running')
          then candidate.reserved_microusd
        else coalesce(candidate.accounted_microusd, 0)
      end
    ), 0)
  into v_request_count, v_committed_microusd
  from public.veroxa_momo_media_ai_candidates candidate
  where candidate.restaurant_id = p_restaurant_id;

  if v_request_count >= v_wallet.lifetime_request_limit
    or v_committed_microusd + v_reservation_microusd
      > v_wallet.lifetime_budget_microusd
  then
    raise exception using errcode = '54000',
      message = 'momo_media_ai_pilot_wallet_exhausted';
  end if;

  v_attestation_hash := encode(
    extensions.digest(
      convert_to(p_processing_attestation_text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );
  v_snapshot := jsonb_build_object(
    'schemaVersion', 1,
    'restaurantId', p_restaurant_id,
    'sourceAssetId', p_source_asset_id,
    'sourceContentSha256', v_asset.content_sha256,
    'sourceStorageObjectVersion', v_source_object.version,
    'rightsId', v_rights.id,
    'rightsAttestationVersion', v_rights.attestation_version,
    'rightsAttestationSha256', v_rights.attestation_sha256,
    'reviewId', v_review.id,
    'goal', p_goal,
    'presetKey', p_preset_key,
    'intendedUse', v_use,
    'quality', p_quality,
    'outputWidth', v_width,
    'outputHeight', v_height,
    'altText', p_alt_text,
    'model', v_wallet.model,
    'promptVersion', 'momo-media-ai-v1',
    'pricingVersion', v_wallet.pricing_version
  );

  insert into public.veroxa_momo_media_ai_candidates (
    restaurant_id,
    source_asset_id,
    source_storage_path,
    source_storage_object_id,
    source_storage_object_version,
    source_mime_type,
    source_file_size,
    source_content_sha256,
    evidence_class,
    rights_id,
    rights_attestation_version,
    rights_attestation_sha256,
    review_id,
    goal,
    preset_key,
    intended_use,
    quality,
    output_width,
    output_height,
    alt_text,
    model,
    prompt_version,
    pricing_version,
    idempotency_hash,
    request_hash,
    request_snapshot,
    processing_attestation_version,
    processing_attestation_text,
    processing_attestation_sha256,
    requested_by,
    reserved_microusd
  ) values (
    p_restaurant_id,
    p_source_asset_id,
    v_asset.storage_path,
    v_source_object.id,
    v_source_object.version,
    v_asset.mime_type,
    v_asset.file_size,
    v_asset.content_sha256,
    v_rights.evidence_class,
    v_rights.id,
    v_rights.attestation_version,
    v_rights.attestation_sha256,
    v_review.id,
    p_goal,
    p_preset_key,
    v_use,
    p_quality,
    v_width,
    v_height,
    p_alt_text,
    v_wallet.model,
    'momo-media-ai-v1',
    v_wallet.pricing_version,
    p_idempotency_hash,
    p_request_hash,
    v_snapshot,
    'momo-media-ai-processing-v1',
    p_processing_attestation_text,
    v_attestation_hash,
    (select auth.uid()),
    v_reservation_microusd
  )
  returning id into candidate_id;

  candidate_status := 'reserved';
  source_storage_path := v_asset.storage_path;
  source_mime_type := v_asset.mime_type;
  source_file_size := v_asset.file_size;
  source_content_sha256 := v_asset.content_sha256;
  output_width := v_width;
  output_height := v_height;
  intended_use := v_use;
  evidence_class := v_rights.evidence_class;
  reserved_microusd := v_reservation_microusd;
  return next;
end;
$$;

create or replace function public.veroxa_start_momo_media_ai_provider_v1(
  p_candidate_id uuid,
  p_request_hash text,
  p_actor_id uuid
)
returns table (
  candidate_id uuid,
  should_call boolean,
  candidate_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.veroxa_momo_media_ai_candidates%rowtype;
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_server_required';
  end if;
  select candidate.* into v_candidate
  from public.veroxa_momo_media_ai_candidates candidate
  where candidate.id = p_candidate_id
  for update;
  if not found
    or p_actor_id is null
    or v_candidate.requested_by is distinct from p_actor_id
    or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(
      v_candidate.restaurant_id,
      p_actor_id
    )
  then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_team_required';
  end if;
  if v_candidate.request_hash is distinct from p_request_hash then
    raise exception using errcode = '23503',
      message = 'momo_media_ai_candidate_mismatch';
  end if;
  if v_candidate.status <> 'reserved' then
    return query select
      v_candidate.id,
      false,
      v_candidate.status;
    return;
  end if;
  if not exists (
    select 1
    from veroxa_private.momo_media_ai_wallets wallet
    where wallet.restaurant_id = v_candidate.restaurant_id
      and wallet.enabled
      and wallet.lifetime_budget_microusd > 0
      and wallet.lifetime_request_limit > 0
      and wallet.model = v_candidate.model
      and wallet.pricing_version = v_candidate.pricing_version
      and v_candidate.reserved_microusd = case v_candidate.quality
        when 'medium' then wallet.medium_reservation_microusd
        else wallet.low_reservation_microusd
      end
      and (
        select count(*)
        from public.veroxa_momo_media_ai_candidates candidate
        where candidate.restaurant_id = v_candidate.restaurant_id
      ) <= wallet.lifetime_request_limit
      and (
        select coalesce(sum(
          case
            when candidate.status in ('reserved','provider_running')
              then candidate.reserved_microusd
            else coalesce(candidate.accounted_microusd, 0)
          end
        ), 0)
        from public.veroxa_momo_media_ai_candidates candidate
        where candidate.restaurant_id = v_candidate.restaurant_id
      ) <= wallet.lifetime_budget_microusd
  ) then
    update public.veroxa_momo_media_ai_candidates candidate
    set status = 'failed',
        accounted_microusd = 0,
        provider_error_code = 'wallet_invalidated_before_provider',
        updated_at = clock_timestamp()
    where candidate.id = v_candidate.id;
    return query select
      v_candidate.id,
      false,
      'failed'::text;
    return;
  end if;
  if not exists (
    select 1
    from public.veroxa_media_assets asset
    join public.veroxa_media_rights rights
      on rights.restaurant_id = asset.restaurant_id
      and rights.asset_id = asset.id
    join public.veroxa_media_reviews review
      on review.restaurant_id = asset.restaurant_id
      and review.asset_id = asset.id
      and review.is_current
    join public.veroxa_momo_runtime_controls control
      on control.restaurant_id = asset.restaurant_id
    join storage.objects source_object
      on source_object.bucket_id = 'restaurant-media'
      and source_object.name = asset.storage_path
    where asset.id = v_candidate.source_asset_id
      and asset.restaurant_id = v_candidate.restaurant_id
      and asset.storage_path = v_candidate.source_storage_path
      and asset.mime_type = v_candidate.source_mime_type
      and asset.file_size = v_candidate.source_file_size
      and asset.content_sha256 = v_candidate.source_content_sha256
      and asset.status = 'ready_to_use'
      and source_object.id = v_candidate.source_storage_object_id
      and source_object.version = v_candidate.source_storage_object_version
      and coalesce(source_object.metadata ->> 'mimetype', '') = asset.mime_type
      and coalesce((source_object.metadata ->> 'size')::bigint, -1)
        = asset.file_size
      and rights.id = v_candidate.rights_id
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = v_candidate.evidence_class
      and rights.attestation_version = v_candidate.rights_attestation_version
      and rights.attestation_sha256 = v_candidate.rights_attestation_sha256
      and (rights.valid_from is null or rights.valid_from <= now())
      and (rights.expires_at is null or rights.expires_at > now())
      and rights.usage_scope ? v_candidate.intended_use
      and review.id = v_candidate.review_id
      and review.status = 'approved'
      and review.public_use_approved
      and control.ai_live_calls
      and not control.provider_writes
      and not control.review_replies
      and not control.website_writes
      and not control.external_scheduling
  ) then
    update public.veroxa_momo_media_ai_candidates candidate
    set status = 'failed',
        accounted_microusd = 0,
        provider_error_code = 'source_invalidated_before_provider',
        updated_at = clock_timestamp()
    where candidate.id = v_candidate.id;
    return query select
      v_candidate.id,
      false,
      'failed'::text;
    return;
  end if;
  update public.veroxa_momo_media_ai_candidates candidate
  set status = 'provider_running',
      provider_called = true,
      provider_started_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where candidate.id = v_candidate.id;
  return query select
    v_candidate.id,
    true,
    'provider_running'::text;
end;
$$;

create or replace function public.veroxa_complete_momo_media_ai_candidate_v1(
  p_candidate_id uuid,
  p_request_hash text,
  p_provider_request_id text,
  p_storage_path text,
  p_file_size bigint,
  p_width integer,
  p_height integer,
  p_content_sha256 text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.veroxa_momo_media_ai_candidates%rowtype;
  v_object record;
  v_expected_path text;
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_server_required';
  end if;
  select candidate.* into v_candidate
  from public.veroxa_momo_media_ai_candidates candidate
  where candidate.id = p_candidate_id
  for update;
  if not found
    or p_actor_id is null
    or v_candidate.requested_by is distinct from p_actor_id
  then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_team_required';
  end if;
  if v_candidate.request_hash is distinct from p_request_hash
    or v_candidate.status <> 'provider_running'
    or not v_candidate.provider_called
    or nullif(btrim(coalesce(p_provider_request_id, '')), '') is null
    or char_length(btrim(p_provider_request_id)) > 200
    or p_file_size not between 1 and 26214400
    or p_width is distinct from v_candidate.output_width
    or p_height is distinct from v_candidate.output_height
    or p_content_sha256 is null
    or p_content_sha256 !~ '^[0-9a-f]{64}$'
  then
    raise exception using errcode = '22023',
      message = 'invalid_momo_media_ai_completion';
  end if;
  v_expected_path :=
    'restaurants/' || v_candidate.restaurant_id::text
    || '/renditions/' || v_candidate.id::text
    || '/' || p_content_sha256 || '.png';
  if p_storage_path is distinct from v_expected_path then
    raise exception using errcode = '22023',
      message = 'invalid_momo_media_ai_storage_path';
  end if;

  select object.id, object.version, object.metadata
  into v_object
  from storage.objects object
  where object.bucket_id = 'restaurant-media'
    and object.name = p_storage_path;
  if not found
    or v_object.version is null
    or coalesce(v_object.metadata ->> 'mimetype', '') <> 'image/png'
    or coalesce((v_object.metadata ->> 'size')::bigint, -1) <> p_file_size
  then
    raise exception using errcode = '23503',
      message = 'verified_momo_media_ai_storage_object_required';
  end if;

  update public.veroxa_momo_media_ai_candidates candidate
  set status = 'pending_review',
      accounted_microusd = candidate.reserved_microusd,
      provider_request_id = btrim(p_provider_request_id),
      storage_path = p_storage_path,
      storage_object_id = v_object.id,
      storage_object_version = v_object.version,
      file_size = p_file_size,
      content_sha256 = p_content_sha256,
      generated_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where candidate.id = v_candidate.id;
  return v_candidate.id;
end;
$$;

create or replace function public.veroxa_fail_momo_media_ai_candidate_v1(
  p_candidate_id uuid,
  p_request_hash text,
  p_error_code text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.veroxa_momo_media_ai_candidates%rowtype;
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_server_required';
  end if;
  select candidate.* into v_candidate
  from public.veroxa_momo_media_ai_candidates candidate
  where candidate.id = p_candidate_id
  for update;
  if not found
    or p_actor_id is null
    or v_candidate.requested_by is distinct from p_actor_id
  then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_team_required';
  end if;
  if v_candidate.request_hash is distinct from p_request_hash
    or v_candidate.status not in ('reserved','provider_running')
    or p_error_code is null
    or p_error_code !~ '^[a-z0-9_]{3,80}$'
  then
    raise exception using errcode = '22023',
      message = 'invalid_momo_media_ai_failure';
  end if;
  update public.veroxa_momo_media_ai_candidates candidate
  set status = 'failed',
      accounted_microusd = case
        when candidate.provider_called then candidate.reserved_microusd
        else 0
      end,
      provider_error_code = p_error_code,
      updated_at = clock_timestamp()
  where candidate.id = v_candidate.id;
  return v_candidate.id;
end;
$$;

create or replace function public.veroxa_close_momo_media_ai_attempt_v1(
  p_candidate_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.veroxa_momo_media_ai_candidates%rowtype;
begin
  select candidate.* into v_candidate
  from public.veroxa_momo_media_ai_candidates candidate
  where candidate.id = p_candidate_id
  for update;
  if not found
    or not public.veroxa_current_user_is_team_for_restaurant(
      v_candidate.restaurant_id
    )
  then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_team_required';
  end if;

  if v_candidate.status = 'reserved' then
    update public.veroxa_momo_media_ai_candidates candidate
    set status = 'failed',
        accounted_microusd = 0,
        provider_error_code = 'reservation_cancelled',
        updated_at = clock_timestamp()
    where candidate.id = v_candidate.id;
    return v_candidate.id;
  end if;

  if v_candidate.status = 'provider_running'
    and v_candidate.provider_started_at <= now() - interval '10 minutes'
  then
    update public.veroxa_momo_media_ai_candidates candidate
    set status = 'failed',
        accounted_microusd = candidate.reserved_microusd,
        provider_error_code = 'provider_result_unreconciled',
        updated_at = clock_timestamp()
    where candidate.id = v_candidate.id;
    return v_candidate.id;
  end if;

  raise exception using errcode = '55000',
    message = 'momo_media_ai_attempt_not_closeable';
end;
$$;

create or replace function public.veroxa_approve_momo_media_ai_candidate_v1(
  p_candidate_id uuid,
  p_expected_content_sha256 text,
  p_inspection_attestation_text text,
  p_inspection_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.veroxa_momo_media_ai_candidates%rowtype;
  v_object record;
  v_recipe jsonb;
  v_fingerprint text;
  v_rendition_id uuid;
begin
  select candidate.* into v_candidate
  from public.veroxa_momo_media_ai_candidates candidate
  where candidate.id = p_candidate_id
  for update;
  if not found
    or not public.veroxa_current_user_is_team_for_restaurant(
      v_candidate.restaurant_id
    )
  then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_team_required';
  end if;
  if v_candidate.status = 'approved' then
    if v_candidate.content_sha256 is distinct from p_expected_content_sha256
      or v_candidate.inspection_attestation_text
        is distinct from p_inspection_attestation_text
      or v_candidate.inspection_notes is distinct from btrim(p_inspection_notes)
    then
      raise exception using errcode = '23505',
        message = 'momo_media_ai_approval_conflict';
    end if;
    return v_candidate.rendition_id;
  end if;
  if v_candidate.status <> 'pending_review'
    or p_expected_content_sha256 is distinct from v_candidate.content_sha256
    or p_inspection_attestation_text is distinct from
      'I opened and inspected this private AI candidate, verified that it preserves the real dish without invented food or claims, and approve it only for the selected Ready use.'
    or p_inspection_notes is null
    or p_inspection_notes is distinct from btrim(p_inspection_notes)
    or char_length(p_inspection_notes) not between 10 and 1000
  then
    raise exception using errcode = '22023',
      message = 'invalid_momo_media_ai_approval';
  end if;

  if not exists (
    select 1
    from public.veroxa_media_assets asset
    join public.veroxa_media_rights rights
      on rights.restaurant_id = asset.restaurant_id
      and rights.asset_id = asset.id
    join public.veroxa_media_reviews review
      on review.restaurant_id = asset.restaurant_id
      and review.asset_id = asset.id
      and review.is_current
    join public.veroxa_momo_runtime_controls control
      on control.restaurant_id = asset.restaurant_id
    join storage.objects source_object
      on source_object.bucket_id = 'restaurant-media'
      and source_object.name = asset.storage_path
    where asset.id = v_candidate.source_asset_id
      and asset.restaurant_id = v_candidate.restaurant_id
      and asset.storage_path = v_candidate.source_storage_path
      and asset.mime_type = v_candidate.source_mime_type
      and asset.file_size = v_candidate.source_file_size
      and asset.content_sha256 = v_candidate.source_content_sha256
      and asset.status = 'ready_to_use'
      and source_object.id = v_candidate.source_storage_object_id
      and source_object.version = v_candidate.source_storage_object_version
      and coalesce(source_object.metadata ->> 'mimetype', '') = asset.mime_type
      and coalesce((source_object.metadata ->> 'size')::bigint, -1)
        = asset.file_size
      and rights.id = v_candidate.rights_id
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = v_candidate.evidence_class
      and rights.attestation_version = v_candidate.rights_attestation_version
      and rights.attestation_sha256 = v_candidate.rights_attestation_sha256
      and (rights.valid_from is null or rights.valid_from <= now())
      and (rights.expires_at is null or rights.expires_at > now())
      and rights.usage_scope ? v_candidate.intended_use
      and review.id = v_candidate.review_id
      and review.status = 'approved'
      and review.public_use_approved
      and control.ai_live_calls
      and not control.provider_writes
      and not control.review_replies
      and not control.website_writes
      and not control.external_scheduling
  ) then
    raise exception using errcode = '23514',
      message = 'momo_media_ai_current_evidence_required';
  end if;

  select object.id, object.version, object.metadata
  into v_object
  from storage.objects object
  where object.bucket_id = 'restaurant-media'
    and object.name = v_candidate.storage_path;
  if not found
    or v_object.id is distinct from v_candidate.storage_object_id
    or v_object.version is distinct from v_candidate.storage_object_version
    or coalesce(v_object.metadata ->> 'mimetype', '') <> 'image/png'
    or coalesce((v_object.metadata ->> 'size')::bigint, -1)
      <> v_candidate.file_size
  then
    raise exception using errcode = '23503',
      message = 'current_momo_media_ai_storage_object_required';
  end if;

  v_recipe := jsonb_build_object(
    'version', 'momo-media-ai-v1',
    'candidateId', v_candidate.id,
    'preset', v_candidate.preset_key,
    'goal', v_candidate.goal,
    'quality', v_candidate.quality,
    'model', v_candidate.model,
    'promptVersion', v_candidate.prompt_version,
    'outputFormat', 'image/png',
    'outputWidth', v_candidate.output_width,
    'outputHeight', v_candidate.output_height,
    'altText', v_candidate.alt_text,
    'humanInspectionRequired', true,
    'externalWriteAllowed', false
  );
  v_fingerprint := encode(
    extensions.digest(
      convert_to(jsonb_build_object(
        'version', 'momo-media-ai-v1',
        'restaurantId', v_candidate.restaurant_id,
        'sourceAssetId', v_candidate.source_asset_id,
        'sourceContentSha256', v_candidate.source_content_sha256,
        'outputContentSha256', v_candidate.content_sha256,
        'recipe', v_recipe
      )::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  insert into public.veroxa_media_renditions (
    restaurant_id,
    source_kind,
    source_asset_id,
    source_key,
    source_content_sha256,
    storage_path,
    mime_type,
    file_size,
    width,
    height,
    content_sha256,
    recipe_fingerprint,
    edit_recipe,
    recipe_version,
    preset_key,
    intended_use,
    alt_text,
    evidence_class,
    status,
    external_write_allowed,
    created_by,
    storage_object_id,
    storage_object_version,
    output_hash_attested_at
  ) values (
    v_candidate.restaurant_id,
    'owner_asset',
    v_candidate.source_asset_id,
    v_candidate.source_asset_id::text,
    v_candidate.source_content_sha256,
    v_candidate.storage_path,
    'image/png',
    v_candidate.file_size,
    v_candidate.output_width,
    v_candidate.output_height,
    v_candidate.content_sha256,
    v_fingerprint,
    v_recipe,
    'momo-media-ai-v1',
    v_candidate.preset_key,
    v_candidate.intended_use,
    v_candidate.alt_text,
    v_candidate.evidence_class,
    'ready',
    false,
    (select auth.uid()),
    v_candidate.storage_object_id,
    v_candidate.storage_object_version,
    clock_timestamp()
  )
  returning id into v_rendition_id;

  update public.veroxa_momo_media_ai_candidates candidate
  set status = 'approved',
      inspection_attestation_version = 'momo-media-ai-inspection-v1',
      inspection_attestation_text = p_inspection_attestation_text,
      inspection_notes = p_inspection_notes,
      inspected_by = (select auth.uid()),
      inspected_at = clock_timestamp(),
      rendition_id = v_rendition_id,
      updated_at = clock_timestamp()
  where candidate.id = v_candidate.id;

  return v_rendition_id;
end;
$$;

create or replace function public.veroxa_reject_momo_media_ai_candidate_v1(
  p_candidate_id uuid,
  p_expected_content_sha256 text,
  p_inspection_attestation_text text,
  p_inspection_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.veroxa_momo_media_ai_candidates%rowtype;
begin
  select candidate.* into v_candidate
  from public.veroxa_momo_media_ai_candidates candidate
  where candidate.id = p_candidate_id
  for update;
  if not found
    or not public.veroxa_current_user_is_team_for_restaurant(
      v_candidate.restaurant_id
    )
  then
    raise exception using errcode = '42501',
      message = 'momo_media_ai_team_required';
  end if;
  if v_candidate.status <> 'pending_review'
    or p_expected_content_sha256 is distinct from v_candidate.content_sha256
    or p_inspection_attestation_text is distinct from
      'I reject this private AI candidate. It must not become Ready or be used outside this Team-only review.'
    or p_inspection_notes is null
    or p_inspection_notes is distinct from btrim(p_inspection_notes)
    or char_length(p_inspection_notes) not between 10 and 1000
  then
    raise exception using errcode = '22023',
      message = 'invalid_momo_media_ai_rejection';
  end if;
  update public.veroxa_momo_media_ai_candidates candidate
  set status = 'rejected',
      inspection_attestation_version = 'momo-media-ai-inspection-v1',
      inspection_attestation_text = p_inspection_attestation_text,
      inspection_notes = p_inspection_notes,
      inspected_by = (select auth.uid()),
      inspected_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where candidate.id = v_candidate.id;
  return v_candidate.id;
end;
$$;

-- Pending candidates are registered private objects for integrity and cleanup
-- purposes, but they are not Ready renditions and remain invisible to Clients.
create or replace function public.veroxa_media_storage_path_registered(
  target_storage_path text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.veroxa_restaurant_id_from_storage_path(target_storage_path)
      is null then false
    when not (
      public.veroxa_current_user_has_active_restaurant(
        public.veroxa_restaurant_id_from_storage_path(target_storage_path)
      )
      or public.veroxa_current_user_is_team_for_restaurant(
        public.veroxa_restaurant_id_from_storage_path(target_storage_path)
      )
    ) then false
    else exists (
      select 1
      from public.veroxa_media_assets asset
      where asset.storage_path = target_storage_path
    )
      or exists (
        select 1
        from public.veroxa_media_renditions rendition
        where rendition.storage_path = target_storage_path
      )
      or exists (
        select 1
        from public.veroxa_momo_media_ai_candidates candidate
        where candidate.storage_path = target_storage_path
          and candidate.status in ('pending_review','approved')
      )
  end;
$$;

revoke all on function public.veroxa_reserve_momo_media_ai_candidate_v1(
  uuid,uuid,text,text,text,text,text,text,text
), public.veroxa_start_momo_media_ai_provider_v1(
  uuid,text,uuid
), public.veroxa_complete_momo_media_ai_candidate_v1(
  uuid,text,text,text,bigint,integer,integer,text,uuid
), public.veroxa_fail_momo_media_ai_candidate_v1(
  uuid,text,text,uuid
), public.veroxa_close_momo_media_ai_attempt_v1(
  uuid
), public.veroxa_approve_momo_media_ai_candidate_v1(
  uuid,text,text,text
), public.veroxa_reject_momo_media_ai_candidate_v1(
  uuid,text,text,text
)
from public, anon, authenticated, service_role;

grant execute on function public.veroxa_reserve_momo_media_ai_candidate_v1(
  uuid,uuid,text,text,text,text,text,text,text
), public.veroxa_close_momo_media_ai_attempt_v1(
  uuid
), public.veroxa_approve_momo_media_ai_candidate_v1(
  uuid,text,text,text
), public.veroxa_reject_momo_media_ai_candidate_v1(
  uuid,text,text,text
)
to authenticated;

grant execute on function public.veroxa_start_momo_media_ai_provider_v1(
  uuid,text,uuid
), public.veroxa_complete_momo_media_ai_candidate_v1(
  uuid,text,text,text,bigint,integer,integer,text,uuid
), public.veroxa_fail_momo_media_ai_candidate_v1(
  uuid,text,text,uuid
)
to service_role;

-- Enable only the exact Momo pilot row. The identity is resolved from
-- canonical restaurant data rather than a generated UUID. A clean schema has
-- no production tenant yet, so zero matches is a valid no-op; duplicate
-- production identities still fail closed.
do $migration$
declare
  v_restaurant_id uuid;
  v_match_count integer;
begin
  select count(*), min(restaurant.id::text)::uuid
  into v_match_count, v_restaurant_id
  from public.veroxa_restaurants restaurant
  where restaurant.name = 'Momo''s House San Antonio'
    and restaurant.city = 'San Antonio'
    and restaurant.state = 'TX'
    and restaurant.status = 'active';
  if v_match_count > 1 then
    raise exception 'momo_media_ai_pilot_restaurant_not_unique';
  end if;

  if v_match_count = 1 then
    insert into veroxa_private.momo_media_ai_wallets (
      restaurant_id,
      enabled,
      lifetime_budget_microusd,
      lifetime_request_limit,
      updated_reason
    ) values (
      v_restaurant_id,
      true,
      2000000,
      20,
      'User-approved Momo Media AI pilot; USD 2.00 internal reservation ceiling.'
    )
    on conflict (restaurant_id) do update
    set enabled = excluded.enabled,
        lifetime_budget_microusd = excluded.lifetime_budget_microusd,
        lifetime_request_limit = excluded.lifetime_request_limit,
        updated_at = clock_timestamp(),
        updated_reason = excluded.updated_reason;

    update public.veroxa_momo_runtime_controls control
    set ai_live_calls = true,
        provider_writes = false,
        review_replies = false,
        website_writes = false,
        external_scheduling = false,
        updated_at = clock_timestamp()
    where control.restaurant_id = v_restaurant_id;
    if not found then
      raise exception 'momo_media_ai_runtime_control_missing';
    end if;
  end if;
end
$migration$;
