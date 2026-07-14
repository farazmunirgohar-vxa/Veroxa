-- Production reconciliation: server-only AI budget controls plus a private,
-- evidence-backed Momo client-request and visual/manual pilot contract.
-- Nothing in this migration enables AI, contacts Momo, activates a Client,
-- publishes externally, or creates spend.

create extension if not exists pgcrypto;
create schema if not exists veroxa_private;
revoke all on schema veroxa_private from public, anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- Server-only AI configuration, reservation, usage, and provenance ledger
-- -------------------------------------------------------------------------

create table veroxa_private.ai_audit_budget_config (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  model text not null default 'gpt-5.6-luna'
    check (model = 'gpt-5.6-luna'),
  pricing_version text not null
    default 'openai-gpt-5.6-luna-web-2026-07-14-v2'
    check (pricing_version = 'openai-gpt-5.6-luna-web-2026-07-14-v2'),
  reservation_microusd bigint not null default 1920200
    check (reservation_microusd = 1920200),
  max_tool_calls integer not null default 4 check (max_tool_calls = 4),
  max_output_tokens integer not null default 2400
    check (max_output_tokens = 2400),
  daily_budget_microusd bigint not null default 0
    check (daily_budget_microusd between 0 and 1000000000),
  daily_request_limit integer not null default 0
    check (daily_request_limit between 0 and 100),
  pricing_snapshot jsonb not null default jsonb_build_object(
    'standardInputMicrousdPerMillionTokens', 1000000,
    'standardOutputMicrousdPerMillionTokens', 6000000,
    'longContextThresholdTokens', 272000,
    'longContextInputMicrousdPerMillionTokens', 2000000,
    'longContextOutputMicrousdPerMillionTokens', 9000000,
    'promptCacheMode', 'explicit_no_breakpoints',
    'webSearchMicrousdPerCall', 10000,
    'modelPasses', 5,
    'maxInputTokensPerPass', 147456,
    'maxAggregateInputTokens', 737280,
    'safetyMarginPercent', 25
  ) check (jsonb_typeof(pricing_snapshot) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by text not null default 'production-reconciliation-migration'
    check (char_length(btrim(updated_by)) between 3 and 200)
);

insert into veroxa_private.ai_audit_budget_config (singleton)
values (true)
on conflict (singleton) do nothing;

create table veroxa_private.ai_audit_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  billing_day date not null,
  idempotency_hash text not null unique
    check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  request_snapshot jsonb not null check (jsonb_typeof(request_snapshot) = 'object'),
  model text not null check (model = 'gpt-5.6-luna'),
  pricing_version text not null
    check (pricing_version = 'openai-gpt-5.6-luna-web-2026-07-14-v2'),
  pricing_snapshot jsonb not null check (jsonb_typeof(pricing_snapshot) = 'object'),
  reserved_microusd bigint not null check (reserved_microusd = 1920200),
  actual_microusd bigint,
  max_tool_calls integer not null check (max_tool_calls = 4),
  max_output_tokens integer not null check (max_output_tokens = 2400),
  status text not null default 'reserved'
    check (status in ('reserved','completed','failed_provider','failed_output')),
  provider_request_id text check (
    provider_request_id is null
    or char_length(btrim(provider_request_id)) between 1 and 200
  ),
  usage_snapshot jsonb,
  source_snapshot jsonb,
  response_snapshot jsonb,
  reserved_at timestamptz not null default clock_timestamp(),
  finalized_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint ai_audit_ledger_finalization_pair check (
    (status = 'reserved' and actual_microusd is null and finalized_at is null)
    or
    (status <> 'reserved' and actual_microusd is not null and finalized_at is not null)
  ),
  constraint ai_audit_ledger_actual_cost_bounds check (
    actual_microusd is null
    or (
      actual_microusd between 0 and 1000000000
      and (actual_microusd <= reserved_microusd or status = 'failed_output')
    )
  ),
  constraint ai_audit_ledger_completed_response check (
    status <> 'completed'
    or (
      jsonb_typeof(response_snapshot) = 'object'
      and jsonb_typeof(usage_snapshot) = 'object'
      and jsonb_typeof(source_snapshot) = 'array'
      and provider_request_id is not null
    )
  )
);
create index ai_audit_usage_ledger_billing_idx
  on veroxa_private.ai_audit_usage_ledger (billing_day, status, reserved_at);

revoke all on table veroxa_private.ai_audit_budget_config,
  veroxa_private.ai_audit_usage_ledger
  from public, anon, authenticated, service_role;

-- Migration 12 validates the optional researchRef shape without depending on
-- a table that did not exist yet. Now that the private ledger is present,
-- strengthen the same validator so a reference must resolve to the exact
-- completed reservation, request hash, model, and immutable pricing version.
do $migration$
declare
  v_ddl text;
  v_before text;
begin
  select pg_get_functiondef(
    to_regprocedure('private.validate_generated_audit_v2(jsonb,jsonb,text,text,text)')
  ) into v_ddl;
  if v_ddl is null or v_ddl not like '%v_research_id uuid;%' then
    raise exception 'audit_v3_research_shape_validator_not_found';
  end if;
  v_before := v_ddl;
  v_ddl := replace(
    v_ddl,
    $$    end;
  end if;

  if p_score_snapshot ->> 'generatedAt'$$,
    $$    end;
    if not exists (
      select 1 from veroxa_private.ai_audit_usage_ledger research
      where research.id = v_research_id
        and research.status = 'completed'
        and research.request_hash = p_score_snapshot #>> '{researchRef,requestHash}'
        and research.model = p_score_snapshot #>> '{researchRef,model}'
        and research.pricing_version = p_score_snapshot #>> '{researchRef,pricingVersion}'
    ) then
      raise exception using errcode = '22023', message = 'unmatched_audit_research_reference';
    end if;
  end if;

  if p_score_snapshot ->> 'generatedAt'$$
  );
  if v_ddl = v_before then
    raise exception 'audit_v3_research_ledger_patch_failed';
  end if;
  execute v_ddl;
end
$migration$;

create or replace function public.reserve_team_ai_audit_budget_v1(
  p_idempotency_hash text,
  p_request_hash text,
  p_request_snapshot jsonb,
  p_model text,
  p_pricing_version text,
  p_reserved_microusd bigint,
  p_max_tool_calls integer,
  p_max_output_tokens integer
)
returns table (
  reservation_id uuid,
  status text,
  cached_response jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config veroxa_private.ai_audit_budget_config%rowtype;
  v_existing veroxa_private.ai_audit_usage_ledger%rowtype;
  v_billing_day date := (clock_timestamp() at time zone 'UTC')::date;
  v_request_count bigint;
  v_committed_microusd bigint;
begin
  if jsonb_typeof(p_request_snapshot) is distinct from 'object' then
    raise exception using errcode = '22023',
      message = 'ai_audit_reservation_contract_mismatch';
  end if;
  if p_idempotency_hash is null
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or p_request_hash is null
     or p_request_hash !~ '^[0-9a-f]{64}$'
     or (select count(*) from jsonb_object_keys(p_request_snapshot)) <> 7
     or not (p_request_snapshot ?& array[
       'schemaVersion','targetRequestId','restaurantName','city','state',
       'websiteUrl','googleProfileUrl'
     ]::text[])
     or jsonb_typeof(p_request_snapshot -> 'schemaVersion') is distinct from 'number'
     or (p_request_snapshot ->> 'schemaVersion')::numeric <> 1
     or jsonb_typeof(p_request_snapshot -> 'targetRequestId') not in ('null','string')
     or (jsonb_typeof(p_request_snapshot -> 'targetRequestId') = 'string'
       and p_request_snapshot ->> 'targetRequestId'
         !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
     or jsonb_typeof(p_request_snapshot -> 'restaurantName') is distinct from 'string'
     or char_length(p_request_snapshot ->> 'restaurantName') not between 2 and 160
     or jsonb_typeof(p_request_snapshot -> 'city') is distinct from 'string'
     or char_length(p_request_snapshot ->> 'city') not between 2 and 100
     or jsonb_typeof(p_request_snapshot -> 'state') is distinct from 'string'
     or char_length(p_request_snapshot ->> 'state') not between 2 and 40
     or jsonb_typeof(p_request_snapshot -> 'websiteUrl') is distinct from 'string'
     or char_length(p_request_snapshot ->> 'websiteUrl') > 2000
     or jsonb_typeof(p_request_snapshot -> 'googleProfileUrl') is distinct from 'string'
     or char_length(p_request_snapshot ->> 'googleProfileUrl') > 2000
     or p_model is distinct from 'gpt-5.6-luna'
     or p_pricing_version is distinct from
       'openai-gpt-5.6-luna-web-2026-07-14-v2'
     or p_reserved_microusd is distinct from 1920200
     or p_max_tool_calls is distinct from 4
     or p_max_output_tokens is distinct from 2400 then
    raise exception using errcode = '22023',
      message = 'ai_audit_reservation_contract_mismatch';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_hash, 0)
  );

  select * into v_existing
  from veroxa_private.ai_audit_usage_ledger ledger
  where ledger.idempotency_hash = p_idempotency_hash
  for update;
  if found then
    if v_existing.request_hash is distinct from p_request_hash
       or v_existing.request_snapshot is distinct from p_request_snapshot
       or v_existing.model is distinct from p_model
       or v_existing.pricing_version is distinct from p_pricing_version
       or v_existing.reserved_microusd is distinct from p_reserved_microusd
       or v_existing.max_tool_calls is distinct from p_max_tool_calls
       or v_existing.max_output_tokens is distinct from p_max_output_tokens then
      raise exception using errcode = '23505',
        message = 'ai_audit_idempotency_conflict';
    end if;
    if v_existing.status in ('failed_provider','failed_output') then
      raise exception using errcode = '55000',
        message = 'ai_audit_failed_reservation_cannot_replay';
    end if;
    return query select v_existing.id,
      case when v_existing.status = 'reserved'
        then 'in_progress'::text else v_existing.status end,
      case when v_existing.status = 'completed'
        then v_existing.response_snapshot else null end;
    return;
  end if;

  select * into v_config
  from veroxa_private.ai_audit_budget_config config
  where config.singleton
  for update;
  if not found
     or not v_config.enabled
     or v_config.daily_budget_microusd <= 0
     or v_config.daily_request_limit <= 0 then
    raise exception using errcode = '55000',
      message = 'ai_audit_budget_disabled';
  end if;
  if v_config.model is distinct from p_model
     or v_config.pricing_version is distinct from p_pricing_version
     or v_config.reservation_microusd is distinct from p_reserved_microusd
     or v_config.max_tool_calls is distinct from p_max_tool_calls
     or v_config.max_output_tokens is distinct from p_max_output_tokens then
    raise exception using errcode = '22023',
      message = 'ai_audit_active_config_mismatch';
  end if;

  select count(*), coalesce(sum(
    case when ledger.status = 'reserved'
      then ledger.reserved_microusd
      else ledger.actual_microusd
    end
  ), 0)
  into v_request_count, v_committed_microusd
  from veroxa_private.ai_audit_usage_ledger ledger
  where ledger.billing_day = v_billing_day;

  if v_request_count >= v_config.daily_request_limit
     or v_committed_microusd + p_reserved_microusd
       > v_config.daily_budget_microusd then
    raise exception using errcode = '54000',
      message = 'ai_audit_daily_budget_exhausted';
  end if;

  insert into veroxa_private.ai_audit_usage_ledger (
    billing_day, idempotency_hash, request_hash, model, pricing_version,
    request_snapshot, pricing_snapshot,
    reserved_microusd, max_tool_calls, max_output_tokens, status
  ) values (
    v_billing_day, p_idempotency_hash, p_request_hash, p_model,
    p_pricing_version, p_request_snapshot, v_config.pricing_snapshot,
    p_reserved_microusd, p_max_tool_calls,
    p_max_output_tokens, 'reserved'
  ) returning id into reservation_id;
  status := 'reserved';
  cached_response := null;
  return next;
end;
$$;

revoke all on function public.reserve_team_ai_audit_budget_v1(
  text, text, jsonb, text, text, bigint, integer, integer
) from public, anon, authenticated;
grant execute on function public.reserve_team_ai_audit_budget_v1(
  text, text, jsonb, text, text, bigint, integer, integer
) to service_role;

create or replace function public.finalize_team_ai_audit_budget_v1(
  p_reservation_id uuid,
  p_idempotency_hash text,
  p_request_hash text,
  p_status text,
  p_actual_microusd bigint,
  p_provider_request_id text,
  p_usage jsonb,
  p_sources jsonb,
  p_response jsonb
)
returns table (
  reservation_id uuid,
  status text,
  response jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger veroxa_private.ai_audit_usage_ledger%rowtype;
begin
  if p_reservation_id is null
     or p_idempotency_hash is null
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or p_request_hash is null
     or p_request_hash !~ '^[0-9a-f]{64}$'
     or p_status is null
     or not (p_status = any(array[
       'completed','failed_provider','failed_output'
     ]::text[]))
     or p_actual_microusd is null
     or p_actual_microusd < 0
     or p_actual_microusd > 1000000000
     or jsonb_typeof(coalesce(p_sources, 'null'::jsonb)) <> 'array'
     or (p_status = 'completed' and (
       jsonb_typeof(coalesce(p_response, 'null'::jsonb)) <> 'object'
       or jsonb_typeof(coalesce(p_usage, 'null'::jsonb)) <> 'object'
       or nullif(btrim(coalesce(p_provider_request_id, '')), '') is null
     ))
     or (p_status <> 'completed' and p_usage is not null
       and jsonb_typeof(p_usage) <> 'object')
     or (p_provider_request_id is not null and
       char_length(btrim(p_provider_request_id)) not between 1 and 200) then
    raise exception using errcode = '22023',
      message = 'invalid_ai_audit_finalization';
  end if;

  select * into v_ledger
  from veroxa_private.ai_audit_usage_ledger ledger
  where ledger.id = p_reservation_id
  for update;
  if not found
     or v_ledger.idempotency_hash is distinct from p_idempotency_hash
     or v_ledger.request_hash is distinct from p_request_hash then
    raise exception using errcode = '23503',
      message = 'ai_audit_reservation_not_found_or_mismatched';
  end if;
  if p_actual_microusd > v_ledger.reserved_microusd
     and p_status <> 'failed_output' then
    raise exception using errcode = '22023',
      message = 'ai_audit_actual_cost_exceeds_reservation';
  end if;

  if v_ledger.status <> 'reserved' then
    if v_ledger.status is distinct from p_status
       or v_ledger.actual_microusd is distinct from p_actual_microusd
       or v_ledger.provider_request_id is distinct from
         nullif(btrim(p_provider_request_id), '')
       or v_ledger.usage_snapshot is distinct from p_usage
       or v_ledger.source_snapshot is distinct from p_sources
       or v_ledger.response_snapshot is distinct from p_response then
      raise exception using errcode = '23505',
        message = 'ai_audit_finalization_conflict';
    end if;
    return query select v_ledger.id, v_ledger.status,
      v_ledger.response_snapshot;
    return;
  end if;

  update veroxa_private.ai_audit_usage_ledger ledger
  set status = p_status,
      actual_microusd = p_actual_microusd,
      provider_request_id = nullif(btrim(p_provider_request_id), ''),
      usage_snapshot = p_usage,
      source_snapshot = p_sources,
      response_snapshot = p_response,
      finalized_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where ledger.id = v_ledger.id;

  return query select v_ledger.id, p_status, p_response;
end;
$$;

revoke all on function public.finalize_team_ai_audit_budget_v1(
  uuid, text, text, text, bigint, text, jsonb, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.finalize_team_ai_audit_budget_v1(
  uuid, text, text, text, bigint, text, jsonb, jsonb, jsonb
) to service_role;

-- A browser may review AI classifications and scores, but it may not attach a
-- completed research ledger row to another restaurant or cite evidence that
-- the server did not retain. This validator is invoked by all three atomic
-- generated-audit save paths before their idempotent replay lookup.
create or replace function private.validate_ai_audit_research_binding_v1(
  p_score_snapshot jsonb,
  p_target_request_id uuid,
  p_restaurant_name text,
  p_city text,
  p_state text,
  p_website_url text,
  p_google_profile_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_research veroxa_private.ai_audit_usage_ledger%rowtype;
  v_name text;
  v_city text;
  v_state text;
  v_website text;
  v_google text;
begin
  if not (p_score_snapshot ? 'researchRef') then
    return;
  end if;

  select * into v_research
  from veroxa_private.ai_audit_usage_ledger research
  where research.id = (p_score_snapshot #>> '{researchRef,researchId}')::uuid
    and research.status = 'completed'
    and research.request_hash = p_score_snapshot #>> '{researchRef,requestHash}'
    and research.model = p_score_snapshot #>> '{researchRef,model}'
    and research.pricing_version = p_score_snapshot #>> '{researchRef,pricingVersion}';
  if not found
     or jsonb_typeof(v_research.request_snapshot) is distinct from 'object'
     or jsonb_typeof(v_research.response_snapshot) is distinct from 'object'
     or jsonb_typeof(v_research.source_snapshot) is distinct from 'array'
     or v_research.response_snapshot -> 'targetRequestId'
       is distinct from v_research.request_snapshot -> 'targetRequestId' then
    raise exception using errcode = '22023',
      message = 'unmatched_audit_research_binding';
  end if;

  if p_target_request_id is null then
    if jsonb_typeof(v_research.request_snapshot -> 'targetRequestId')
         is distinct from 'null' then
      raise exception using errcode = '22023',
        message = 'audit_research_target_mismatch';
    end if;
    v_name := btrim(coalesce(p_restaurant_name, ''));
    v_city := btrim(coalesce(p_city, ''));
    v_state := btrim(coalesce(p_state, ''));
    v_website := btrim(coalesce(p_website_url, ''));
    v_google := btrim(coalesce(p_google_profile_url, ''));
  else
    if jsonb_typeof(v_research.request_snapshot -> 'targetRequestId')
         is distinct from 'string'
       or lower(v_research.request_snapshot ->> 'targetRequestId')
         is distinct from lower(p_target_request_id::text) then
      raise exception using errcode = '22023',
        message = 'audit_research_target_mismatch';
    end if;
    select restaurant.restaurant_name, restaurant.city, restaurant.state,
      coalesce(restaurant.website_url, ''),
      coalesce(restaurant.google_profile_url, '')
    into v_name, v_city, v_state, v_website, v_google
    from public.audit_requests request
    join public.audit_restaurants restaurant
      on restaurant.id = request.audit_restaurant_id
    where request.id = p_target_request_id;
    if not found then
      raise exception using errcode = '22023',
        message = 'audit_research_target_mismatch';
    end if;
  end if;

  -- An existing request is already bound by its immutable request UUID and
  -- exact restaurant name/city/state. Its stored URLs may predate the route's
  -- canonical URL formatting, so only new-target URLs require exact equality.
  if v_name is distinct from v_research.request_snapshot ->> 'restaurantName'
     or v_city is distinct from v_research.request_snapshot ->> 'city'
     or v_state is distinct from v_research.request_snapshot ->> 'state'
     or (p_target_request_id is null and (
       v_website is distinct from coalesce(v_research.response_snapshot ->> 'websiteUrl', '')
       or v_google is distinct from coalesce(v_research.response_snapshot ->> 'googleProfileUrl', '')
     )) then
    raise exception using errcode = '22023',
      message = 'audit_research_identity_mismatch';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_score_snapshot -> 'categories') category(value)
    where category.value ->> 'status' <> 'unknown'
      and not exists (
        select 1
        from jsonb_array_elements(v_research.source_snapshot) source(value)
        where source.value ->> 'url' is not null
          and source.value ->> 'url' = category.value ->> 'evidenceUrl'
      )
  ) then
    raise exception using errcode = '22023',
      message = 'audit_research_evidence_not_in_ledger';
  end if;
end;
$$;

revoke all on function private.validate_ai_audit_research_binding_v1(
  jsonb, uuid, text, text, text, text, text
) from public, anon, authenticated, service_role;

-- Bind the new, draft-completion, and rerun save paths to the protected
-- research identity before any exact-save replay can return.
do $migration$
declare
  v_ddl text;
  v_before text;
begin
  select pg_get_functiondef(to_regprocedure(
    'public.save_team_generated_audit_v2(text,text,text,text,text,jsonb,jsonb,text,text,text,text)'
  )) into v_ddl;
  v_before := v_ddl;
  v_ddl := replace(v_ddl,
    $$  -- Serialize before the first lookup so simultaneous retries converge on the$$,
    $$  perform private.validate_ai_audit_research_binding_v1(
    p_score_snapshot, null, v_name, v_city, v_state,
    p_website_url, p_google_profile_url
  );

  -- Serialize before the first lookup so simultaneous retries converge on the$$
  );
  if v_ddl is null or v_ddl = v_before then
    raise exception 'new_audit_research_binding_patch_failed';
  end if;
  execute v_ddl;

  select pg_get_functiondef(to_regprocedure(
    'public.complete_team_generated_audit_run_v2(uuid,jsonb,jsonb,text,text,text)'
  )) into v_ddl;
  v_before := v_ddl;
  v_ddl := replace(v_ddl,
    $$  perform pg_advisory_xact_lock(hashtextextended(v_save_hash, 0));$$,
    $$  perform private.validate_ai_audit_research_binding_v1(
    p_score_snapshot,
    (select run.audit_request_id from public.audit_runs run
      where run.id = p_audit_run_id),
    null, null, null, null, null
  );

  perform pg_advisory_xact_lock(hashtextextended(v_save_hash, 0));$$
  );
  if v_ddl is null or v_ddl = v_before then
    raise exception 'existing_audit_research_binding_patch_failed';
  end if;
  execute v_ddl;

  select pg_get_functiondef(to_regprocedure(
    'public.save_team_generated_audit_rerun_v2(uuid,uuid,jsonb,jsonb,text,text,text,text)'
  )) into v_ddl;
  v_before := v_ddl;
  v_ddl := replace(v_ddl,
    $$  perform pg_advisory_xact_lock(hashtextextended(v_save_hash, 0));$$,
    $$  perform private.validate_ai_audit_research_binding_v1(
    p_score_snapshot, p_audit_request_id,
    null, null, null, null, null
  );

  perform pg_advisory_xact_lock(hashtextextended(v_save_hash, 0));$$
  );
  if v_ddl is null or v_ddl = v_before then
    raise exception 'rerun_audit_research_binding_patch_failed';
  end if;
  execute v_ddl;
end
$migration$;

-- -------------------------------------------------------------------------
-- Private Client request/message persistence exposed only through bounded RPCs
-- -------------------------------------------------------------------------

create table public.veroxa_client_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete cascade,
  request_type text not null check (request_type in (
    'onboarding','truth_update','media','content','website','reporting','support'
  )),
  title text not null check (char_length(btrim(title)) between 3 and 200),
  details text not null check (char_length(btrim(details)) between 3 and 5000),
  priority text not null default 'normal'
    check (priority in ('normal','urgent')),
  status text not null default 'open'
    check (status in ('open','acknowledged','in_progress','completed','cancelled')),
  created_by uuid not null references public.veroxa_user_profiles(user_id),
  idempotency_key text not null check (
    char_length(idempotency_key) between 16 and 200
    and idempotency_key ~ '^[A-Za-z0-9:_-]+$'
  ),
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  completed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (created_by, idempotency_key),
  constraint veroxa_client_request_completed_pair check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);
create index veroxa_client_requests_tenant_queue_idx
  on public.veroxa_client_requests (restaurant_id, status, created_at desc);
create index veroxa_client_requests_creator_rate_idx
  on public.veroxa_client_requests (created_by, created_at desc);

create table public.veroxa_request_messages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete cascade,
  request_id uuid not null
    references public.veroxa_client_requests(id) on delete cascade,
  sender_id uuid not null references public.veroxa_user_profiles(user_id),
  sender_role public.veroxa_role_v1 not null,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  idempotency_key text not null check (
    char_length(idempotency_key) between 16 and 200
    and idempotency_key ~ '^[A-Za-z0-9:_-]+$'
  ),
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  unique (sender_id, idempotency_key)
);
create index veroxa_request_messages_thread_idx
  on public.veroxa_request_messages (request_id, created_at, id);
create index veroxa_request_messages_sender_rate_idx
  on public.veroxa_request_messages (sender_id, created_at desc);

alter table public.veroxa_client_requests enable row level security;
alter table public.veroxa_client_requests force row level security;
alter table public.veroxa_request_messages enable row level security;
alter table public.veroxa_request_messages force row level security;
revoke all on table public.veroxa_client_requests,
  public.veroxa_request_messages from public, anon, authenticated;

alter table public.veroxa_work_items
  add column if not exists client_request_id uuid
    references public.veroxa_client_requests(id) on delete restrict,
  add column if not exists client_request_idempotency_hash text,
  add column if not exists client_request_payload_sha256 text;
alter table public.veroxa_work_items
  add constraint veroxa_work_client_request_idempotency_hash check (
    client_request_idempotency_hash is null
    or client_request_idempotency_hash ~ '^[0-9a-f]{64}$'
  ),
  add constraint veroxa_work_client_request_payload_sha256 check (
    client_request_payload_sha256 is null
    or client_request_payload_sha256 ~ '^[0-9a-f]{64}$'
  ),
  add constraint veroxa_work_client_request_idempotency_pair check (
    num_nonnulls(client_request_idempotency_hash, client_request_payload_sha256)
      in (0, 2)
  );
create index if not exists veroxa_work_items_client_request_idx
  on public.veroxa_work_items (client_request_id)
  where client_request_id is not null;
create unique index if not exists veroxa_work_items_client_request_idempotency_idx
  on public.veroxa_work_items (client_request_idempotency_hash)
  where client_request_idempotency_hash is not null;

create or replace function veroxa_private.protect_client_request_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '23514',
      message = 'client_request_history_is_immutable';
  end if;
  if tg_op = 'INSERT' then
    if current_setting('veroxa.trusted_client_request_write', true)
         is distinct from 'on'
       or new.created_by is distinct from (select auth.uid())
       or new.status <> 'open'
       or new.completed_at is not null then
      raise exception using errcode = '42501',
        message = 'client_request_requires_transactional_rpc';
    end if;
    new.created_at := clock_timestamp();
    new.updated_at := new.created_at;
    return new;
  end if;
  if current_setting('veroxa.trusted_client_request_transition', true)
       is distinct from 'on'
     or new.id is distinct from old.id
     or new.restaurant_id is distinct from old.restaurant_id
     or new.request_type is distinct from old.request_type
     or new.title is distinct from old.title
     or new.details is distinct from old.details
     or new.priority is distinct from old.priority
     or new.created_by is distinct from old.created_by
     or new.idempotency_key is distinct from old.idempotency_key
     or new.payload_sha256 is distinct from old.payload_sha256
     or new.created_at is distinct from old.created_at then
    raise exception using errcode = '23514',
      message = 'client_request_identity_is_immutable';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create or replace function veroxa_private.protect_request_message_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception using errcode = '23514',
      message = 'request_message_is_append_only';
  end if;
  if current_setting('veroxa.trusted_request_message_write', true)
       is distinct from 'on'
     or new.sender_id is distinct from (select auth.uid())
     or not exists (
       select 1 from public.veroxa_client_requests request
       where request.id = new.request_id
         and request.restaurant_id = new.restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'request_message_requires_transactional_rpc';
  end if;
  new.created_at := clock_timestamp();
  return new;
end;
$$;

create or replace function veroxa_private.validate_work_request_link_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and (new.client_request_id is distinct from old.client_request_id
       or new.client_request_idempotency_hash is distinct from
         old.client_request_idempotency_hash
       or new.client_request_payload_sha256 is distinct from
         old.client_request_payload_sha256) then
    raise exception using errcode = '23514',
      message = 'work_client_request_link_is_immutable';
  end if;

  if new.client_request_id is null then
    if new.client_request_idempotency_hash is not null
       or new.client_request_payload_sha256 is not null then
      raise exception using errcode = '23514',
        message = 'work_idempotency_requires_client_request_link';
    end if;
    return new;
  end if;

  -- Team retains its legacy ability to insert unlinked work, but a request
  -- link and its server-derived idempotency fields can only be created by the
  -- transactional RPC below. This prevents a browser from bypassing the
  -- request row lock, active-state check, and exact-replay contract.
  if tg_op = 'INSERT'
     and (current_setting('veroxa.trusted_client_request_work', true)
            is distinct from 'on'
       or new.created_by is distinct from (select auth.uid())
       or new.client_request_idempotency_hash is null
       or new.client_request_payload_sha256 is null) then
    raise exception using errcode = '42501',
      message = 'client_request_work_requires_transactional_rpc';
  end if;

  if not exists (
    select 1 from public.veroxa_client_requests request
    where request.id = new.client_request_id
      and request.restaurant_id = new.restaurant_id
      and request.status not in ('completed','cancelled')
  ) then
    raise exception using errcode = '23514',
      message = 'work_client_request_link_is_not_active_or_same_tenant';
  end if;
  return new;
end;
$$;

revoke all on function veroxa_private.protect_client_request_v1(),
  veroxa_private.protect_request_message_v1(),
  veroxa_private.validate_work_request_link_v1()
  from public, anon, authenticated;

create trigger veroxa_client_requests_guard
before insert or update or delete on public.veroxa_client_requests
for each row execute function veroxa_private.protect_client_request_v1();
create trigger veroxa_request_messages_guard
before insert or update or delete on public.veroxa_request_messages
for each row execute function veroxa_private.protect_request_message_v1();
create trigger veroxa_work_items_client_request_guard
before insert or update of client_request_id, restaurant_id,
  client_request_idempotency_hash, client_request_payload_sha256
on public.veroxa_work_items
for each row execute function veroxa_private.validate_work_request_link_v1();

create or replace function public.veroxa_create_client_request_v1(
  p_restaurant_id uuid,
  p_request_type text,
  p_title text,
  p_details text,
  p_priority text,
  p_idempotency_key text
)
returns table (request_id uuid, status text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_title text := btrim(coalesce(p_title, ''));
  v_details text := btrim(coalesce(p_details, ''));
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_existing public.veroxa_client_requests%rowtype;
begin
  if v_caller is null
     or not public.veroxa_current_user_has_active_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501',
      message = 'active_client_request_author_required';
  end if;
  if p_request_type is null or not (p_request_type = any(array[
       'onboarding','truth_update','media','content','website','reporting','support'
     ]::text[]))
     or char_length(v_title) not between 3 and 200
     or char_length(v_details) not between 3 and 5000
     or p_priority is null or not (p_priority = any(array['normal','urgent']::text[]))
     or char_length(v_key) not between 16 and 200
     or v_key !~ '^[A-Za-z0-9:_-]+$' then
    raise exception using errcode = '22023',
      message = 'invalid_client_request_payload';
  end if;
  v_hash := encode(extensions.digest(
    jsonb_build_array('client-request-v1', p_restaurant_id, v_caller,
      p_request_type, v_title, v_details, p_priority)::text,
    'sha256'
  ), 'hex');
  -- Serialize both the caller-wide quota and this exact idempotency key.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('client-request-quota:' || v_caller::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('client-request-key:' || v_caller::text || ':' || v_key, 0)
  );
  select * into v_existing
  from public.veroxa_client_requests request
  where request.created_by = v_caller and request.idempotency_key = v_key
  for update;
  if found then
    if v_existing.payload_sha256 is distinct from v_hash then
      raise exception using errcode = '23505',
        message = 'client_request_idempotency_conflict';
    end if;
    return query select v_existing.id, v_existing.status,
      v_existing.created_at;
    return;
  end if;
  if (select count(*) from public.veroxa_client_requests request
      where request.created_by = v_caller
        and request.created_at >= clock_timestamp() - interval '1 hour') >= 10
     or (select count(*) from public.veroxa_client_requests request
      where request.created_by = v_caller
        and request.status in ('open','acknowledged','in_progress')) >= 100 then
    raise exception using errcode = '54000',
      message = 'client_request_rate_or_open_limit_reached';
  end if;
  perform set_config('veroxa.trusted_client_request_write', 'on', true);
  insert into public.veroxa_client_requests (
    restaurant_id, request_type, title, details, priority, status,
    created_by, idempotency_key, payload_sha256
  ) values (
    p_restaurant_id, p_request_type, v_title, v_details, p_priority, 'open',
    v_caller, v_key, v_hash
  ) returning id, veroxa_client_requests.status,
    veroxa_client_requests.created_at
    into request_id, status, created_at;
  return next;
end;
$$;

create or replace function public.veroxa_append_request_message_v1(
  p_request_id uuid,
  p_body text,
  p_idempotency_key text
)
returns table (message_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_request public.veroxa_client_requests%rowtype;
  v_profile public.veroxa_user_profiles%rowtype;
  v_body text := btrim(coalesce(p_body, ''));
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_existing public.veroxa_request_messages%rowtype;
begin
  select * into v_request from public.veroxa_client_requests request
  where request.id = p_request_id for share;
  if not found or v_caller is null or not (
    (v_request.created_by = v_caller
      and public.veroxa_current_user_has_active_restaurant(v_request.restaurant_id))
    or public.veroxa_current_user_is_team_for_restaurant(v_request.restaurant_id)
  ) then
    raise exception using errcode = '42501',
      message = 'request_thread_access_denied';
  end if;
  select * into v_profile from public.veroxa_user_profiles profile
  where profile.user_id = v_caller and profile.status = 'active';
  if not found
     or char_length(v_body) not between 1 and 5000
     or char_length(v_key) not between 16 and 200
     or v_key !~ '^[A-Za-z0-9:_-]+$' then
    raise exception using errcode = '22023',
      message = 'invalid_request_message_payload';
  end if;
  v_hash := encode(extensions.digest(
    concat_ws(E'\n', 'request-message-v1', p_request_id::text,
      v_caller::text, v_profile.role::text, v_body),
    'sha256'
  ), 'hex');
  -- Fixed lock order closes distinct-key races across the sender/hour and
  -- request/thread quotas before resolving this exact replay key.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('request-message-caller:' || v_caller::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('request-message-thread:' || p_request_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('request-message-key:' || v_caller::text || ':' || v_key, 0)
  );
  select * into v_existing from public.veroxa_request_messages message
  where message.sender_id = v_caller and message.idempotency_key = v_key
  for update;
  if found then
    if v_existing.request_id is distinct from p_request_id
       or v_existing.payload_sha256 is distinct from v_hash then
      raise exception using errcode = '23505',
        message = 'request_message_idempotency_conflict';
    end if;
    return query select v_existing.id, v_existing.created_at;
    return;
  end if;
  if v_request.status in ('completed','cancelled') then
    raise exception using errcode = '55000',
      message = 'request_thread_is_closed';
  end if;
  if (select count(*) from public.veroxa_request_messages message
      where message.sender_id = v_caller
        and message.created_at >= clock_timestamp() - interval '1 hour') >= 60
     or (select count(*) from public.veroxa_request_messages message
      where message.request_id = p_request_id) >= 5000 then
    raise exception using errcode = '54000',
      message = 'request_message_rate_or_thread_limit_reached';
  end if;
  perform set_config('veroxa.trusted_request_message_write', 'on', true);
  insert into public.veroxa_request_messages (
    restaurant_id, request_id, sender_id, sender_role, body,
    idempotency_key, payload_sha256
  ) values (
    v_request.restaurant_id, v_request.id, v_caller, v_profile.role,
    v_body, v_key, v_hash
  ) returning id, veroxa_request_messages.created_at
    into message_id, created_at;
  return next;
end;
$$;

create or replace function public.veroxa_transition_client_request_v1(
  p_request_id uuid,
  p_target_status text,
  p_notes text,
  p_idempotency_key text
)
returns table (request_id uuid, status text, transitioned_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_request public.veroxa_client_requests%rowtype;
  v_notes text := btrim(coalesce(p_notes, ''));
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_existing public.veroxa_request_messages%rowtype;
begin
  select * into v_request from public.veroxa_client_requests request
  where request.id = p_request_id for update;
  if not found or v_caller is null
     or not public.veroxa_current_user_is_team_for_restaurant(v_request.restaurant_id) then
    raise exception using errcode = '42501',
      message = 'momo_team_request_transition_required';
  end if;
  if p_target_status is null
     or not (p_target_status = any(array[
       'acknowledged','in_progress','completed','cancelled'
     ]::text[]))
     or char_length(v_notes) not between 5 and 2000
     or char_length(v_key) not between 16 and 200
     or v_key !~ '^[A-Za-z0-9:_-]+$' then
    raise exception using errcode = '22023',
      message = 'invalid_client_request_transition';
  end if;
  v_hash := encode(extensions.digest(
    concat_ws(E'\n', 'request-transition-v1', p_request_id::text,
      v_caller::text, p_target_status, v_notes), 'sha256'
  ), 'hex');
  select * into v_existing from public.veroxa_request_messages message
  where message.sender_id = v_caller and message.idempotency_key = v_key
  for update;
  if found then
    if v_existing.request_id is distinct from p_request_id
       or v_existing.payload_sha256 is distinct from v_hash then
      raise exception using errcode = '23505',
        message = 'client_request_transition_idempotency_conflict';
    end if;
    -- The append-only transition message proves the exact transition already
    -- committed. Return that recorded target even if the request has since
    -- advanced again; the caller reloads the current request state separately.
    return query select v_request.id, p_target_status,
      v_existing.created_at;
    return;
  end if;
  if not (
    (v_request.status = 'open' and p_target_status in ('acknowledged','cancelled'))
    or (v_request.status = 'acknowledged' and p_target_status in ('in_progress','cancelled'))
    or (v_request.status = 'in_progress' and p_target_status in ('completed','cancelled'))
  ) then
    raise exception using errcode = '23514',
      message = 'invalid_client_request_state_transition';
  end if;
  perform set_config('veroxa.trusted_client_request_transition', 'on', true);
  update public.veroxa_client_requests request
  set status = p_target_status,
      completed_at = case when p_target_status = 'completed'
        then clock_timestamp() else null end
  where request.id = v_request.id;
  perform set_config('veroxa.trusted_request_message_write', 'on', true);
  insert into public.veroxa_request_messages (
    restaurant_id, request_id, sender_id, sender_role, body,
    idempotency_key, payload_sha256
  ) values (
    v_request.restaurant_id, v_request.id, v_caller, 'team', v_notes,
    v_key, v_hash
  ) returning veroxa_request_messages.created_at into transitioned_at;
  perform set_config('veroxa.trusted_activity_write', 'on', true);
  insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id, actor_id,
    visibility, report_eligible, payload
  ) values (
    v_request.restaurant_id, 'client_request_' || p_target_status,
    'client_request', v_request.id, v_caller, 'both',
    p_target_status = 'completed',
    jsonb_build_object('status', p_target_status, 'notes', v_notes)
  );
  request_id := v_request.id;
  status := p_target_status;
  return next;
end;
$$;

create or replace function public.veroxa_create_client_request_work_v1(
  p_request_id uuid,
  p_work_type text,
  p_title text,
  p_description text,
  p_priority integer,
  p_idempotency_key text,
  p_subject_type text default null,
  p_subject_id uuid default null,
  p_due_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_request public.veroxa_client_requests%rowtype;
  v_existing public.veroxa_work_items%rowtype;
  v_work_id uuid;
  v_title text := btrim(coalesce(p_title, ''));
  v_description text := nullif(btrim(coalesce(p_description, '')), '');
  v_subject_type text := nullif(btrim(coalesce(p_subject_type, '')), '');
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_key_hash text;
  v_payload_hash text;
begin
  if v_caller is null then
    raise exception using errcode = '42501',
      message = 'momo_team_client_request_work_required';
  end if;
  if char_length(v_key) not between 16 and 200
     or v_key !~ '^[A-Za-z0-9:_-]+$' then
    raise exception using errcode = '22023',
      message = 'invalid_client_request_work_payload';
  end if;

  v_key_hash := encode(extensions.digest(
    concat_ws(E'\n', 'client-request-work-v1:key', v_caller::text, v_key),
    'sha256'
  ), 'hex');
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('client-request-work-key:' || v_key_hash, 0)
  );

  select * into v_request from public.veroxa_client_requests request
  where request.id = p_request_id for update;
  if not found
     or not public.veroxa_current_user_is_team_for_restaurant(v_request.restaurant_id) then
    raise exception using errcode = '42501',
      message = 'momo_team_client_request_work_required';
  end if;
  if p_work_type is null or not (p_work_type = any(array[
       'onboarding','truth_review','media','content','publishing','google',
       'seo','reviews','website','reporting','monitoring','recovery'
     ]::text[]))
     or char_length(v_title) not between 3 and 200
     or char_length(coalesce(v_description, '')) > 5000
     or p_priority not between 1 and 5
     or num_nonnulls(v_subject_type, p_subject_id) not in (0, 2)
     or (v_subject_type is not null and
       char_length(v_subject_type) not between 3 and 80) then
    raise exception using errcode = '22023',
      message = 'invalid_client_request_work_payload';
  end if;

  v_payload_hash := encode(extensions.digest(
    jsonb_build_array('client-request-work-v1:payload',
      p_request_id, v_caller, p_work_type, v_title,
      coalesce(v_description, ''), p_priority::text,
      coalesce(v_subject_type, ''), p_subject_id,
      extract(epoch from p_due_at))::text,
    'sha256'
  ), 'hex');
  select * into v_existing
  from public.veroxa_work_items work
  where work.client_request_idempotency_hash = v_key_hash
  for update;
  if found then
    if v_existing.created_by is distinct from v_caller
       or v_existing.client_request_id is distinct from p_request_id
       or v_existing.client_request_payload_sha256 is distinct from
         v_payload_hash then
      raise exception using errcode = '23505',
        message = 'client_request_work_idempotency_conflict';
    end if;
    return v_existing.id;
  end if;

  -- Mutable eligibility belongs only to first creation. An exact replay must
  -- continue to return the committed work after the request closes or its due
  -- time passes; changed payloads were already rejected above.
  if v_request.status not in ('acknowledged','in_progress')
     or (p_due_at is not null and p_due_at <= clock_timestamp()) then
    raise exception using errcode = '22023',
      message = 'invalid_client_request_work_payload';
  end if;

  perform set_config('veroxa.trusted_client_request_work', 'on', true);
  insert into public.veroxa_work_items (
    restaurant_id, work_type, title, description, priority, status,
    subject_type, subject_id, due_at, created_by, client_request_id,
    client_request_idempotency_hash, client_request_payload_sha256
  ) values (
    v_request.restaurant_id, p_work_type, v_title,
    v_description, p_priority, 'queued',
    v_subject_type, p_subject_id,
    p_due_at, v_caller, v_request.id, v_key_hash, v_payload_hash
  ) returning id into v_work_id;
  return v_work_id;
end;
$$;

create or replace function public.veroxa_list_client_requests_v1(
  p_restaurant_id uuid,
  p_before timestamptz default null,
  p_limit integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_limit is null or p_limit not between 1 and 50
     or not (
       public.veroxa_current_user_has_active_restaurant(p_restaurant_id)
       or public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
     ) then
    raise exception using errcode = '42501',
      message = 'request_list_access_or_limit_denied';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', request.id, 'requestType', request.request_type,
      'title', request.title, 'details', request.details,
      'priority', request.priority, 'status', request.status,
      'createdBy', request.created_by, 'createdAt', request.created_at,
      'updatedAt', request.updated_at, 'completedAt', request.completed_at
    ) order by request.created_at desc, request.id desc)
    from (
      select row.* from public.veroxa_client_requests row
      where row.restaurant_id = p_restaurant_id
        and (public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
          or row.created_by = (select auth.uid()))
        and (p_before is null or row.created_at < p_before)
      order by row.created_at desc, row.id desc
      limit p_limit
    ) request
  ), '[]'::jsonb);
end;
$$;

create or replace function public.veroxa_request_thread_v1(
  p_request_id uuid,
  p_before timestamptz default null,
  p_limit integer default 50
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_request public.veroxa_client_requests%rowtype;
begin
  select * into v_request from public.veroxa_client_requests request
  where request.id = p_request_id;
  if not found or p_limit is null or p_limit not between 1 and 100 or not (
    (v_request.created_by = (select auth.uid())
      and public.veroxa_current_user_has_active_restaurant(v_request.restaurant_id))
    or public.veroxa_current_user_is_team_for_restaurant(v_request.restaurant_id)
  ) then
    raise exception using errcode = '42501',
      message = 'request_thread_access_or_limit_denied';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', message.id, 'senderId', message.sender_id,
      'senderRole', message.sender_role, 'body', message.body,
      'createdAt', message.created_at
    ) order by message.created_at desc, message.id desc)
    from (
      select row.* from public.veroxa_request_messages row
      where row.request_id = p_request_id
        and (p_before is null or row.created_at < p_before)
      order by row.created_at desc, row.id desc
      limit p_limit
    ) message
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.veroxa_create_client_request_v1(
  uuid, text, text, text, text, text
), public.veroxa_append_request_message_v1(uuid, text, text),
  public.veroxa_transition_client_request_v1(uuid, text, text, text),
  public.veroxa_create_client_request_work_v1(
    uuid, text, text, text, integer, text, text, uuid, timestamptz
  ), public.veroxa_list_client_requests_v1(uuid, timestamptz, integer),
  public.veroxa_request_thread_v1(uuid, timestamptz, integer)
  from public, anon;
grant execute on function public.veroxa_create_client_request_v1(
  uuid, text, text, text, text, text
), public.veroxa_append_request_message_v1(uuid, text, text),
  public.veroxa_transition_client_request_v1(uuid, text, text, text),
  public.veroxa_create_client_request_work_v1(
    uuid, text, text, text, integer, text, text, uuid, timestamptz
  ), public.veroxa_list_client_requests_v1(uuid, timestamptz, integer),
  public.veroxa_request_thread_v1(uuid, timestamptz, integer)
  to authenticated;

-- -------------------------------------------------------------------------
-- Evidence-only Momo visual/manual pilot gate (never an activation gate)
-- -------------------------------------------------------------------------

create or replace function public.veroxa_momo_manual_pilot_gate_v1(
  p_restaurant_id uuid
)
returns table (
  status text,
  can_review boolean,
  owner_user_id uuid,
  required_check_count integer,
  passed_check_count integer,
  blocker_count integer,
  evidence jsonb,
  blockers jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner_count integer := 0;
  v_owner_id uuid;
  v_contact_count integer := 0;
  v_truth_count integer := 0;
  v_onboarding_count integer := 0;
  v_media_count integer := 0;
  v_readiness_count integer := 0;
  v_readiness_snapshot jsonb := '[]'::jsonb;
  v_request_id uuid;
  v_work_id uuid;
  v_approval_id uuid;
  v_activity_id uuid;
  v_report_id uuid;
  v_report_approval_id uuid;
  v_recovery_id uuid;
  v_passed integer := 0;
  v_blockers jsonb := '[]'::jsonb;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
     or not exists (
       select 1 from veroxa_private.operational_restaurant_scope scope
       where scope.scope_key = 'momo_house_san_antonio'
         and scope.restaurant_id = p_restaurant_id and scope.enabled
     ) then
    raise exception using errcode = '42501',
      message = 'momo_team_manual_pilot_gate_required';
  end if;

  select count(*)::integer,
    (array_agg(profile.user_id order by profile.user_id))[1]
  into v_owner_count, v_owner_id
  from public.veroxa_user_profiles profile
  join public.veroxa_restaurant_members member
    on member.user_id = profile.user_id
   and member.role = profile.role
  where member.restaurant_id = p_restaurant_id
    and profile.role = 'client'
    and profile.status = 'active'
    and member.status = 'active';
  if v_owner_count = 1 then
    v_passed := v_passed + 1;
  else
    v_owner_id := null;
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','single_active_client_owner_required',
      'message','Exactly one active Client identity must own all pilot evidence.',
      'observedCount',v_owner_count));
  end if;

  if v_owner_id is not null then
    select count(*)::integer into v_contact_count
    from public.veroxa_restaurant_contacts contact
    where contact.restaurant_id = p_restaurant_id
      and contact.contact_kind = 'owner'
      and contact.is_primary
      and contact.status = 'owner_confirmed'
      and contact.owner_confirmed_by = v_owner_id
      and exists (
        select 1 from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = p_restaurant_id
          and confirmation.subject_type = 'contact'
          and confirmation.subject_id = contact.id
          and confirmation.confirmation_kind = 'contact'
          and confirmation.decision in ('confirm','correct')
          and confirmation.status = 'approved'
          and confirmation.submitted_by = v_owner_id
          and confirmation.submitted_at = contact.owner_confirmed_at
          and confirmation.id = (
            select latest.id from public.veroxa_confirmations latest
            where latest.restaurant_id = p_restaurant_id
              and latest.subject_type = 'contact'
              and latest.subject_id = contact.id
              and latest.confirmation_kind = 'contact'
            order by latest.submitted_at desc, latest.created_at desc,
              latest.id desc limit 1
          )
      );
  end if;
  if v_contact_count = 1 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','owner_primary_contact_unverified',
      'message','One latest-approved primary owner contact from the same Client is required.'));
  end if;

  if v_owner_id is not null then
    select count(*)::integer into v_truth_count
    from public.veroxa_restaurant_truth_fields field
    where field.restaurant_id = p_restaurant_id
      and field.is_current
      and field.status = 'owner_confirmed'
      and field.owner_confirmed_by = v_owner_id
      and exists (
        select 1 from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = p_restaurant_id
          and confirmation.subject_type = 'truth_field'
          and confirmation.subject_id = field.id
          and confirmation.confirmation_kind = 'business_truth'
          and confirmation.decision in ('confirm','correct')
          and confirmation.status = 'approved'
          and confirmation.submitted_by = v_owner_id
          and confirmation.submitted_at = field.owner_confirmed_at
          and confirmation.id = (
            select latest.id from public.veroxa_confirmations latest
            where latest.restaurant_id = p_restaurant_id
              and latest.subject_type = 'truth_field'
              and latest.subject_id = field.id
              and latest.confirmation_kind = 'business_truth'
            order by latest.submitted_at desc, latest.created_at desc,
              latest.id desc limit 1
          )
      );
  end if;
  if v_truth_count = 18 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','all_owner_truth_confirmations_required',
      'message','All 18 current truth fields require latest approved confirmation from the same Client.',
      'observedCount',v_truth_count,'requiredCount',18));
  end if;

  if v_owner_id is not null then
    select count(*)::integer into v_onboarding_count
    from public.veroxa_onboarding_steps step
    join public.veroxa_confirmations confirmation
      on confirmation.id = step.owner_confirmation_id
    where step.restaurant_id = p_restaurant_id
      and step.status = 'verified'
      and step.completed_at is not null
      and jsonb_array_length(step.completion_evidence) > 0
      and confirmation.restaurant_id = p_restaurant_id
      and confirmation.subject_type = 'onboarding_step'
      and confirmation.subject_id = step.id
      and confirmation.confirmation_kind = 'onboarding'
      and confirmation.decision in ('confirm','correct')
      and confirmation.status = 'approved'
      and confirmation.submitted_by = v_owner_id
      and confirmation.submitted_at <= step.completed_at
      and confirmation.id = (
        select latest.id from public.veroxa_confirmations latest
        where latest.restaurant_id = p_restaurant_id
          and latest.subject_type = 'onboarding_step'
          and latest.subject_id = step.id
          and latest.confirmation_kind = 'onboarding'
        order by latest.submitted_at desc, latest.created_at desc,
          latest.id desc limit 1
      );
  end if;
  if v_onboarding_count = 11 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','all_owner_onboarding_confirmations_required',
      'message','All 11 onboarding steps require evidence and latest confirmation from the same Client.',
      'observedCount',v_onboarding_count,'requiredCount',11));
  end if;

  if v_owner_id is not null then
    select count(*)::integer into v_media_count
    from public.veroxa_media_assets asset
    join public.veroxa_media_rights rights
      on rights.asset_id = asset.id and rights.restaurant_id = asset.restaurant_id
    join public.veroxa_media_reviews review
      on review.asset_id = asset.id and review.restaurant_id = asset.restaurant_id
     and review.is_current
    where asset.restaurant_id = p_restaurant_id
      and asset.uploaded_by = v_owner_id
      and asset.status in ('ready_to_use','used')
      and rights.rights_status = 'confirmed'
      and rights.confirmed_by = v_owner_id
      and coalesce(rights.valid_from, rights.confirmed_at) <= clock_timestamp()
      and (rights.expires_at is null or rights.expires_at > clock_timestamp())
      and rights.usage_scope @>
        '["facebook","instagram","google_business","website"]'::jsonb
      and rights.attestation_version = 'momo-media-rights-v1'
      and rights.attestation_sha256 =
        '8d6b83d28e393313e52ac32e54eda8286e4c305617ea8722aedc9729a887628f'
      and review.status = 'approved'
      and review.public_use_approved
      and exists (
        select 1 from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = p_restaurant_id
          and confirmation.subject_type = 'media_rights'
          and confirmation.subject_id = rights.id
          and confirmation.confirmation_kind = 'usage_rights'
          and confirmation.decision in ('confirm','correct')
          and confirmation.status = 'approved'
          and confirmation.submitted_by = v_owner_id
          and confirmation.submitted_at = rights.confirmed_at
          and confirmation.id = (
            select latest.id from public.veroxa_confirmations latest
            where latest.restaurant_id = p_restaurant_id
              and latest.subject_type = 'media_rights'
              and latest.subject_id = rights.id
              and latest.confirmation_kind = 'usage_rights'
            order by latest.submitted_at desc, latest.created_at desc,
              latest.id desc limit 1
          )
      );
  end if;
  if v_media_count > 0 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','externally_usable_owner_media_required',
      'message','Same-owner media needs current attested rights, all four external scopes, and approved public-use review.'));
  end if;

  select count(*)::integer,
    coalesce(jsonb_agg(jsonb_build_object(
      'dimensionKey', dimension.dimension_key,
      'status', dimension.status,
      'required', dimension.required
    ) order by dimension.dimension_key), '[]'::jsonb)
  into v_readiness_count, v_readiness_snapshot
  from public.veroxa_readiness_dimensions dimension
  where dimension.restaurant_id = p_restaurant_id
    and dimension.required;
  if v_readiness_count = 10 then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','all_readiness_rows_required',
      'message','All 10 required readiness rows must exist; their honest blocked states remain visible.',
      'observedCount',v_readiness_count,'requiredCount',10));
  end if;

  if v_owner_id is not null then
    select request.id, work.id, work_approval.id, activity.id, report.id,
      report_approval.id, recovery.id
    into v_request_id, v_work_id, v_approval_id, v_activity_id,
      v_report_id, v_report_approval_id, v_recovery_id
    from public.veroxa_client_requests request
    join public.veroxa_work_items work
      on work.client_request_id = request.id
     and work.restaurant_id = request.restaurant_id
    join public.veroxa_approvals work_approval
      on work_approval.restaurant_id = work.restaurant_id
     and work_approval.subject_type = work.subject_type
     and work_approval.subject_id = work.subject_id
     and work_approval.status = 'approved'
     and work_approval.decided_at >= work.created_at
    join public.veroxa_activity_events activity
      on activity.restaurant_id = work.restaurant_id
     and activity.subject_type = 'work_item'
     and activity.subject_id = work.id
     and activity.visibility in ('client','both')
     and activity.report_eligible
     and activity.occurred_at >= work_approval.decided_at
    join public.veroxa_reports report
      on report.restaurant_id = activity.restaurant_id
     and activity.id = any(report.evidence_event_ids)
     and report.status = 'approved'
     and report.approved_at is not null
     and report.created_at >= activity.occurred_at
    join public.veroxa_approvals report_approval
      on report_approval.restaurant_id = report.restaurant_id
     and report_approval.subject_type = 'report'
     and report_approval.subject_id = report.id
     and report_approval.approval_kind = 'report_release'
     and report_approval.status = 'approved'
     and report_approval.decided_at = report.approved_at
    join public.veroxa_recovery_runs recovery
      on recovery.restaurant_id = work.restaurant_id
     and recovery.subject_type = 'work_item'
     and recovery.subject_id = work.id
     and recovery.status = 'completed'
     and recovery.completed_at >= report_approval.decided_at
    where request.restaurant_id = p_restaurant_id
      and request.created_by = v_owner_id
      and request.status = 'completed'
      and request.completed_at >= recovery.completed_at
      and work.status = 'completed'
      and work.subject_type is not null
      and work.subject_id is not null
      and work.created_at >= request.created_at
    order by request.completed_at desc, request.id desc
    limit 1;
  end if;
  if v_recovery_id is not null then
    v_passed := v_passed + 1;
  else
    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
      'code','single_request_to_recovery_chain_required',
      'message','One same-owner request must link to approved work, client-visible report evidence, released report, and completed recovery.'));
  end if;

  status := case when v_passed = 7
    then 'ready_for_visual_review' else 'blocked' end;
  can_review := v_passed = 7;
  owner_user_id := v_owner_id;
  required_check_count := 7;
  passed_check_count := v_passed;
  blocker_count := jsonb_array_length(v_blockers);
  evidence := jsonb_build_object(
    'ownerCount', v_owner_count,
    'primaryOwnerContactCount', v_contact_count,
    'ownerConfirmedTruthCount', v_truth_count,
    'ownerConfirmedOnboardingCount', v_onboarding_count,
    'externallyUsableMediaCount', v_media_count,
    'readinessRowCount', v_readiness_count,
    'readinessRows', v_readiness_snapshot,
    'chain', jsonb_build_object(
      'requestId', v_request_id, 'workItemId', v_work_id,
      'workApprovalId', v_approval_id, 'activityEventId', v_activity_id,
      'reportId', v_report_id, 'reportApprovalId', v_report_approval_id,
      'recoveryRunId', v_recovery_id
    ),
    'activationAuthorized', false,
    'externalPublishingAuthorized', false,
    'aiEnabled', false
  );
  blockers := v_blockers;
  return next;
end;
$$;

revoke all on function public.veroxa_momo_manual_pilot_gate_v1(uuid)
  from public, anon;
grant execute on function public.veroxa_momo_manual_pilot_gate_v1(uuid)
  to authenticated;
