-- Momo-only executable integration checks.
--
-- Run after the preconnection migration inside an outer transaction and always
-- roll that transaction back. The test temporarily treats the development
-- proxy as a real owner solely to exercise the owner-only RPC boundary; no
-- evidence or authority change may survive the rollback.

begin;

select set_config(
  'veroxa.test.restaurant_id',
  (select restaurant.id::text
   from public.veroxa_restaurants restaurant
   where restaurant.name = 'Momo''s House San Antonio'
   order by restaurant.created_at
   limit 1),
  true
);

select set_config(
  'veroxa.test.team_id',
  (select profile.user_id::text
   from public.veroxa_user_profiles profile
   join public.veroxa_restaurant_members member on member.user_id = profile.user_id
   where lower(profile.email) = 'faraz.munir.gohar@gmail.com'
     and member.restaurant_id = current_setting('veroxa.test.restaurant_id')::uuid
     and profile.role = 'team' and profile.status = 'active'
     and member.role = 'team' and member.status = 'active'
   limit 1),
  true
);

select set_config(
  'veroxa.test.proxy_id',
  (select profile.user_id::text
   from public.veroxa_user_profiles profile
   join public.veroxa_restaurant_members member on member.user_id = profile.user_id
   where lower(profile.email) = 'faraz.munir.gohar@icloud.com'
     and member.restaurant_id = current_setting('veroxa.test.restaurant_id')::uuid
     and profile.role = 'client' and profile.status = 'active'
     and member.role = 'client' and member.status = 'active'
   limit 1),
  true
);

do $$
begin
  if current_setting('veroxa.test.restaurant_id', true) is null
    or current_setting('veroxa.test.team_id', true) is null
    or current_setting('veroxa.test.proxy_id', true) is null then
    raise exception 'momo_integration_fixture_missing';
  end if;
  if not veroxa_private.momo_growth_evidence_manifest_valid_v1(
    '2026-07-16-v1',
    19,
    '09ec19d9517ed3b9bb3162c9c5599bde3b0a485362cc24bbadc138e09891c4b1'
  ) then
    raise exception 'momo_growth_evidence_manifest_mismatch';
  end if;
end $$;

-- Team can create an exact, idempotent consent request. Nested technical
-- before/after payloads fail closed.
select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  exact_scope jsonb := jsonb_build_object(
    'target', 'Momo House Google Business Profile holiday hours',
    'operation', 'Replace one holiday-hours value',
    'before', 'Closed',
    'after', '11 AM-7 PM',
    'batchSize', 1
  );
  first_id uuid;
  repeated_id uuid;
begin
  first_id := public.veroxa_request_momo_action_consent_v1(
    restaurant_id,
    'business_profile_change',
    'rr_consent_exact_v1',
    'Replace only the displayed Momo holiday-hours value shown in this request.',
    exact_scope,
    now() + interval '7 days'
  );
  repeated_id := public.veroxa_request_momo_action_consent_v1(
    restaurant_id,
    'business_profile_change',
    'rr_consent_exact_v1',
    'Replace only the displayed Momo holiday-hours value shown in this request.',
    exact_scope,
    now() + interval '8 days'
  );
  if first_id is null or repeated_id <> first_id then
    raise exception 'momo_consent_request_not_idempotent';
  end if;
  if (select count(*) from public.veroxa_momo_action_consents consent
      where consent.id = first_id) <> 1 then
    raise exception 'momo_team_cannot_read_own_consent';
  end if;
  perform set_config('veroxa.test.consent_id', first_id::text, true);

  begin
    perform public.veroxa_request_momo_action_consent_v1(
      restaurant_id,
      'business_profile_change',
      'rr_consent_nested_secret_v1',
      'This deliberately malformed request must be rejected by the exact-scope boundary.',
      '{"target":"Google Business Profile","operation":"Replace field","before":{"token":"secret"},"after":"safe","batchSize":1}'::jsonb,
      now() + interval '7 days'
    );
    raise exception 'momo_nested_scope_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_request_momo_action_consent_v1(
      restaurant_id,
      'access_connection',
      'rr_consent_unbounded_v1',
      'A consent without an exact action count must be rejected.',
      '{"target":"Google Business Profile","operation":"Add separate manager"}'::jsonb,
      now() + interval '7 days'
    );
    raise exception 'momo_unbounded_consent_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_request_momo_action_consent_v1(
      restaurant_id,
      'social_post',
      'rr_consent_blank_preview_v1',
      'A blank content preview must never create an actionable owner-consent request.',
      '{"target":"Momo House Instagram","operation":"Publish one post","contentPreview":"   ","batchSize":1}'::jsonb,
      now() + interval '7 days'
    );
    raise exception 'momo_blank_content_preview_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_request_momo_action_consent_v1(
      restaurant_id,
      'business_profile_change',
      'rr_consent_null_after_v1',
      'A null replacement value must never be treated as an exact owner-approved edit.',
      '{"target":"Momo House Google Business Profile hours","operation":"Replace one value","before":"Closed","after":null,"batchSize":1}'::jsonb,
      now() + interval '7 days'
    );
    raise exception 'momo_null_after_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_request_momo_action_consent_v1(
      restaurant_id,
      'business_profile_change',
      'rr_consent_boolean_after_v1',
      'A boolean replacement value must never be treated as an exact owner-approved edit.',
      '{"target":"Momo House Google Business Profile hours","operation":"Replace one value","before":"Closed","after":true,"batchSize":1}'::jsonb,
      now() + interval '7 days'
    );
    raise exception 'momo_boolean_after_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_request_momo_action_consent_v1(
      restaurant_id,
      'business_profile_change',
      'rr_consent_number_after_v1',
      'A numeric replacement value must never be treated as an exact owner-approved edit.',
      '{"target":"Momo House Google Business Profile hours","operation":"Replace one value","before":"Closed","after":7,"batchSize":1}'::jsonb,
      now() + interval '7 days'
    );
    raise exception 'momo_number_after_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
end $$;

-- Owner authority is never inferred from an account or a loosely shaped note.
-- Exact recent evidence is mandatory, and the development proxy can never be
-- promoted even when a caller supplies an otherwise valid-looking payload.
do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  verified_at text := to_char(
    date_trunc('milliseconds', now()) at time zone 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
  );
begin
  begin
    perform public.veroxa_assign_momo_real_owner_authority_v1(
      restaurant_id,
      'owner-fixture-not-created@example.com',
      jsonb_build_object(
        'verifiedAt', verified_at,
        'details', 'Rollback-only evidence missing the required verification method.'
      )
    );
    raise exception 'momo_owner_authority_missing_method_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_assign_momo_real_owner_authority_v1(
      restaurant_id,
      'owner-fixture-not-created@example.com',
      jsonb_build_object(
        'method', 'owner_meeting',
        'details', 'Rollback-only evidence missing the required verified timestamp.'
      )
    );
    raise exception 'momo_owner_authority_missing_verified_at_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_assign_momo_real_owner_authority_v1(
      restaurant_id,
      'faraz.munir.gohar@icloud.com',
      jsonb_build_object(
        'method', 'owner_meeting',
        'verifiedAt', verified_at,
        'details', 'Valid-shaped rollback evidence must not promote the development proxy.'
      )
    );
    raise exception 'momo_development_proxy_owner_promotion_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
end $$;

reset role;

-- The development proxy cannot read the consent table, receive consent rows in
-- its snapshot, or decide an action.
select set_config('request.jwt.claim.sub', current_setting('veroxa.test.proxy_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  snapshot jsonb;
begin
  if (select count(*) from public.veroxa_momo_action_consents) <> 0 then
    raise exception 'momo_proxy_direct_consent_rls_leak';
  end if;
  snapshot := public.veroxa_momo_client_snapshot_v1(
    current_setting('veroxa.test.restaurant_id')::uuid
  );
  if jsonb_array_length(snapshot -> 'actionConsents') <> 0 then
    raise exception 'momo_proxy_snapshot_consent_leak';
  end if;
  begin
    perform public.veroxa_decide_momo_action_consent_v1(
      current_setting('veroxa.test.consent_id')::uuid,
      'approved',
      'Development proxy must be denied.'
    );
    raise exception 'momo_proxy_consent_decision_was_accepted';
  exception when sqlstate '42501' then
    null;
  end;
end $$;

reset role;

-- Rollback-only authority substitution lets the same test prove the real-owner
-- projection, exact approval, Team execution check, and revocation contract.
update public.veroxa_momo_evidence_authorities authority
set evidence_class = 'real_owner', notes = 'Rollback-only integration test.'
where authority.restaurant_id = current_setting('veroxa.test.restaurant_id')::uuid
  and authority.user_id = current_setting('veroxa.test.proxy_id')::uuid;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.proxy_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  snapshot jsonb;
  consent_scope jsonb;
begin
  if (select count(*) from public.veroxa_momo_action_consents) <> 0 then
    raise exception 'momo_real_owner_direct_consent_rls_leak';
  end if;
  snapshot := public.veroxa_momo_client_snapshot_v1(
    current_setting('veroxa.test.restaurant_id')::uuid
  );
  if jsonb_array_length(snapshot -> 'actionConsents') <> 1 then
    raise exception 'momo_real_owner_snapshot_missing_consent';
  end if;
  consent_scope := snapshot #> '{actionConsents,0,scope}';
  if consent_scope ->> 'before' <> 'Closed'
    or consent_scope ->> 'after' <> '11 AM-7 PM' then
    raise exception 'momo_owner_scope_projection_invalid';
  end if;
  perform public.veroxa_decide_momo_action_consent_v1(
    current_setting('veroxa.test.consent_id')::uuid,
    'approved',
    'Approved only for the exact value shown.'
  );
end $$;

reset role;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  consent_id uuid := current_setting('veroxa.test.consent_id')::uuid;
  exact_scope jsonb := jsonb_build_object(
    'target', 'Momo House Google Business Profile holiday hours',
    'operation', 'Replace one holiday-hours value',
    'before', 'Closed',
    'after', '11 AM-7 PM',
    'batchSize', 1
  );
  repeated_id uuid;
begin
  if not public.veroxa_validate_momo_action_consent_v1(
    restaurant_id, consent_id, 'business_profile_change', 'rr_consent_exact_v1', exact_scope
  ) then
    raise exception 'momo_exact_approved_consent_not_valid';
  end if;
  if public.veroxa_validate_momo_action_consent_v1(
    restaurant_id, consent_id, 'business_profile_change', 'rr_consent_exact_v1',
    exact_scope || '{"after":"different"}'::jsonb
  ) then
    raise exception 'momo_tampered_scope_validated';
  end if;
  repeated_id := public.veroxa_request_momo_action_consent_v1(
    restaurant_id,
    'business_profile_change',
    'rr_consent_exact_v1',
    'Replace only the displayed Momo holiday-hours value shown in this request.',
    exact_scope,
    now() + interval '9 days'
  );
  if repeated_id <> consent_id then
    raise exception 'momo_active_approved_consent_was_duplicated';
  end if;
end $$;

reset role;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.proxy_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select public.veroxa_revoke_momo_action_consent_v1(
  current_setting('veroxa.test.consent_id')::uuid,
  'Momo owner withdrew this exact approval during the rollback-only test.'
);

reset role;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  exact_scope jsonb := jsonb_build_object(
    'target', 'Momo House Google Business Profile holiday hours',
    'operation', 'Replace one holiday-hours value',
    'before', 'Closed',
    'after', '11 AM-7 PM',
    'batchSize', 1
  );
begin
  if public.veroxa_validate_momo_action_consent_v1(
    current_setting('veroxa.test.restaurant_id')::uuid,
    current_setting('veroxa.test.consent_id')::uuid,
    'business_profile_change',
    'rr_consent_exact_v1',
    exact_scope
  ) then
    raise exception 'momo_revoked_consent_still_valid';
  end if;
end $$;

reset role;

update public.veroxa_momo_evidence_authorities authority
set evidence_class = 'development_proxy', notes = 'Temporary Momo development proxy.'
where authority.restaurant_id = current_setting('veroxa.test.restaurant_id')::uuid
  and authority.user_id = current_setting('veroxa.test.proxy_id')::uuid;

-- Expired pending requests transition to history and can be safely renewed.
select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  old_id uuid;
begin
  old_id := public.veroxa_request_momo_action_consent_v1(
    current_setting('veroxa.test.restaurant_id')::uuid,
    'access_connection',
    'rr_expiry_renewal_v1',
    'Allow one separate Veroxa manager connection without sharing an owner password.',
    '{"target":"Momo House Google Business Profile","operation":"Add separate manager","batchSize":1}'::jsonb,
    now() + interval '1 day'
  );
  perform set_config('veroxa.test.expired_consent_id', old_id::text, true);
end $$;

reset role;

update public.veroxa_momo_action_consents
set requested_at = now() - interval '2 days', expires_at = now() - interval '1 day'
where id = current_setting('veroxa.test.expired_consent_id')::uuid;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  renewed_id uuid;
begin
  renewed_id := public.veroxa_request_momo_action_consent_v1(
    current_setting('veroxa.test.restaurant_id')::uuid,
    'access_connection',
    'rr_expiry_renewal_v1',
    'Allow one separate Veroxa manager connection without sharing an owner password.',
    '{"target":"Momo House Google Business Profile","operation":"Add separate manager","batchSize":1}'::jsonb,
    now() + interval '7 days'
  );
  if renewed_id = current_setting('veroxa.test.expired_consent_id')::uuid
    or (select count(*) from public.veroxa_momo_action_consents consent
        where consent.subject_key = 'rr_expiry_renewal_v1') <> 2
    or (select count(*) from public.veroxa_momo_action_consents consent
        where consent.subject_key = 'rr_expiry_renewal_v1' and consent.status = 'expired') <> 1
    or (select count(*) from public.veroxa_momo_action_consents consent
        where consent.subject_key = 'rr_expiry_renewal_v1' and consent.status = 'pending') <> 1 then
    raise exception 'momo_expired_consent_renewal_failed';
  end if;
end $$;

-- Cache data is readable only through the TTL-aware RPC; direct Team SELECT is
-- intentionally empty. The hard purge removes an expired payload.
do $$
declare
  cache_id uuid;
  cached jsonb;
begin
  begin
    perform public.veroxa_cache_momo_external_content_v1(
      current_setting('veroxa.test.restaurant_id')::uuid,
      'google_business',
      'rr-expired-cache-fixture',
      '{"hours":"stale"}'::jsonb,
      now() - interval '2 hours',
      now() - interval '1 hour'
    );
    raise exception 'momo_already_expired_cache_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  cache_id := public.veroxa_cache_momo_external_content_v1(
    current_setting('veroxa.test.restaurant_id')::uuid,
    'google_business',
    'rr-cache-fixture',
    '{"hours":"fixture-only"}'::jsonb,
    now() - interval '1 minute',
    now() + interval '1 hour'
  );
  cached := public.veroxa_read_momo_external_content_cache_v1(
    current_setting('veroxa.test.restaurant_id')::uuid,
    'google_business',
    'rr-cache-fixture'
  );
  if cache_id is null or cached -> 'payload' <> '{"hours":"fixture-only"}'::jsonb
    or (select count(*) from public.veroxa_external_content_cache) <> 0 then
    raise exception 'momo_cache_boundary_failed';
  end if;
  perform set_config('veroxa.test.cache_id', cache_id::text, true);
end $$;

reset role;

do $$
begin
  if not exists (select 1 from cron.job
      where jobname = 'veroxa-momo-external-cache-purge' and active
        and schedule = '17 3 * * *'
        and command = 'select veroxa_private.purge_expired_momo_external_cache_v1();') then
    raise exception 'momo_cache_cron_contract_invalid';
  end if;
end $$;

update public.veroxa_external_content_cache
set fetched_at = now() - interval '2 days', expires_at = now() - interval '1 day'
where id = current_setting('veroxa.test.cache_id')::uuid;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
begin
  if public.veroxa_read_momo_external_content_cache_v1(
      current_setting('veroxa.test.restaurant_id')::uuid,
      'google_business',
      'rr-cache-fixture'
    ) is not null
    or public.veroxa_purge_momo_external_content_cache_v1(
      current_setting('veroxa.test.restaurant_id')::uuid
    ) < 1 then
    raise exception 'momo_expired_cache_not_purged';
  end if;
end $$;

-- Tracking accepts a normalized four-channel Momo URL matrix, deduplicates
-- exact mappings, and rejects PII in either the mapping or destination.
do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  platforms text[] := array['facebook','instagram','google_business','website'];
  destinations text[] := array[
    'https://momohousesa.com/menu',
    'https://momohousesa.com/menu',
    'https://momohousesa.com/',
    'https://momohousesa.com/catering'
  ];
  utm_sources text[] := array['facebook','instagram','google_business','website'];
  utm_mediums text[] := array['organic_social','organic_social','local_profile','owned_site'];
  platform_index integer;
  tracking_id uuid;
  repeated_id uuid;
begin
  for platform_index in 1..array_length(platforms, 1) loop
    tracking_id := public.veroxa_record_momo_tracking_contract_v1(
      restaurant_id,
      'rr_tracking_' || platforms[platform_index] || '_v1',
      platforms[platform_index],
      destinations[platform_index],
      utm_sources[platform_index],
      utm_mediums[platform_index],
      'momo_preconnection_test',
      'synthetic_fixture',
      'synthetic'
    );
    repeated_id := public.veroxa_record_momo_tracking_contract_v1(
      restaurant_id,
      'rr_tracking_' || platforms[platform_index] || '_v1',
      platforms[platform_index],
      destinations[platform_index],
      utm_sources[platform_index],
      utm_mediums[platform_index],
      'momo_preconnection_test',
      'synthetic_fixture',
      'synthetic'
    );
    if tracking_id is null or repeated_id <> tracking_id then
      raise exception 'momo_tracking_contract_missing_or_not_idempotent:%', platforms[platform_index];
    end if;
  end loop;
  if (select count(distinct contract.platform)
      from public.veroxa_campaign_tracking_contracts contract
      where contract.restaurant_id = current_setting('veroxa.test.restaurant_id')::uuid
        and contract.platform = any(platforms)
        and contract.execution_mode = 'rehearsal'
        and not contract.external_write_allowed
        and contract.pii_scan_passed) <> 4 then
    raise exception 'momo_tracking_matrix_incomplete';
  end if;
  begin
    perform public.veroxa_record_momo_tracking_contract_v1(
      restaurant_id,
      'rr_customer_2105551212',
      'instagram',
      'https://momohousesa.com/menu',
      'instagram',
      'organic_social',
      'momo_menu_test',
      'square_fixture',
      'synthetic'
    );
    raise exception 'momo_tracking_pii_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_tracking_contract_v1(
      restaurant_id,
      'rr_tracking_destination_pii_v1',
      'instagram',
      'https://momohousesa.com/customer/2105551212',
      'instagram',
      'organic_social',
      'momo_menu_test',
      'square_fixture',
      'synthetic'
    );
    raise exception 'momo_tracking_destination_pii_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
end $$;

-- Provider-neutral AI work remains blocked until a provider is connected, but
-- its deterministic structured-output contract can be rehearsed without a
-- provider call or external write. Both paths stay Team-only.
do $$
declare
  v_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  expected_caption text := 'Momo''s House San Antonio content workflow rehearsal. Final wording, facts, media, timing, and account actions require Team review and real-owner approval before public use.';
  unsupported_promotion text := 'Momo''s House San Antonio has the city''s number one dumpling deal today.';
  input_snapshot jsonb := jsonb_build_object(
    'restaurantId', v_restaurant_id,
    'restaurantName', 'Momo''s House San Antonio',
    'objective', 'Rehearse a factual three-channel content workflow without publishing.',
    'facts', jsonb_build_array(jsonb_build_object(
      'key', 'fixture_scope',
      'value', 'Synthetic offline Team-only rehearsal.',
      'evidenceClass', 'synthetic'
    )),
    'channels', '["facebook","instagram","google_business"]'::jsonb
  );
  output_snapshot jsonb := jsonb_build_object(
    'caption', expected_caption,
    'altText', 'Synthetic Momo workflow card used only for Team preconnection testing.',
    'channelVariants', jsonb_build_object(
      'facebook', expected_caption,
      'instagram', expected_caption,
      'google_business', expected_caption
    ),
    'claims', '[]'::jsonb
  );
  grounding_report jsonb := jsonb_build_object(
    'allClaimsSupported', true,
    'unsupportedClaims', '[]'::jsonb,
    'factKeysUsed', '["fixture_scope"]'::jsonb,
    'blockedLiveReasons', '["real_owner_evidence_required","human_review_required","provider_connection_required","exact_action_consent_required","external_writes_disabled"]'::jsonb
  );
  evidence_keys jsonb := '["google_people_first_content","ftc_truthful_advertising"]'::jsonb;
  blocked_id uuid;
  first_id uuid;
  repeated_id uuid;
begin
  blocked_id := public.veroxa_prepare_momo_ai_job_v1(
    v_restaurant_id, 'caption', 'restaurant', v_restaurant_id
  );
  if not exists (
    select 1 from public.veroxa_ai_jobs job
    where job.id = blocked_id and job.restaurant_id = v_restaurant_id
      and job.status::text = 'blocked' and job.provider_key is null
      and job.model_key is null and job.output_payload is null
      and job.execution_mode = 'blocked' and not job.provider_called
      and not job.external_write_allowed and job.human_review_required
      and job.created_by = current_setting('veroxa.test.team_id')::uuid
  ) then
    raise exception 'momo_ai_prepare_boundary_failed';
  end if;

  first_id := public.veroxa_record_momo_ai_contract_rehearsal_v1(
    v_restaurant_id, 'rr_ai_contract_fixture_v1', input_snapshot,
    output_snapshot, grounding_report, evidence_keys
  );
  repeated_id := public.veroxa_record_momo_ai_contract_rehearsal_v1(
    v_restaurant_id, 'rr_ai_contract_fixture_v1', input_snapshot,
    output_snapshot, grounding_report, evidence_keys
  );
  if first_id is null or repeated_id <> first_id or not exists (
    select 1 from public.veroxa_ai_jobs job
    where job.id = first_id and job.restaurant_id = v_restaurant_id
      and job.status::text = 'completed'
      and job.rehearsal_contract_version = 'momo-ai-contract-rehearsal-v1'
      and job.provider_key = 'offline_rehearsal'
      and job.model_key = 'provider-neutral-structured-output-v1'
      and job.execution_mode = 'rehearsal' and not job.provider_called
      and not job.external_write_allowed and job.human_review_required
      and job.evidence_class = 'synthetic'
  ) then
    raise exception 'momo_ai_rehearsal_or_idempotency_failed';
  end if;
  perform set_config('veroxa.test.ai_job_id', first_id::text, true);

  begin
    insert into public.veroxa_ai_jobs (
      restaurant_id, job_kind, subject_type, subject_id, status,
      prompt_version, input_payload, safety_flags, attempt_count,
      max_attempts, last_error, created_by
    ) values (
      v_restaurant_id, 'caption', 'restaurant', v_restaurant_id, 'blocked',
      'v1-provider-neutral', jsonb_build_object('subject_id', v_restaurant_id),
      '["live_provider_not_connected","human_review_required"]'::jsonb,
      0, 3, 'Provider connection not authorized',
      current_setting('veroxa.test.team_id')::uuid
    );
    raise exception 'momo_direct_ai_fixture_insert_was_accepted';
  exception when sqlstate '42501' then
    null;
  end;

  begin
    perform public.veroxa_prepare_momo_ai_job_v1(
      v_restaurant_id, 'caption', 'restaurant', gen_random_uuid()
    );
    raise exception 'momo_invalid_ai_subject_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_ai_contract_rehearsal_v1(
      v_restaurant_id, 'rr_ai_invalid_claim_v1', input_snapshot,
      jsonb_set(output_snapshot, '{claims}', '["unsupported claim"]'::jsonb),
      grounding_report, evidence_keys
    );
    raise exception 'momo_invalid_ai_output_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_ai_contract_rehearsal_v1(
      v_restaurant_id, 'rr_ai_unsupported_promotion_v1', input_snapshot,
      jsonb_set(
        jsonb_set(output_snapshot, '{caption}', to_jsonb(unsupported_promotion)),
        '{channelVariants}',
        jsonb_build_object(
          'facebook', unsupported_promotion,
          'instagram', unsupported_promotion,
          'google_business', unsupported_promotion
        )
      ),
      grounding_report, evidence_keys
    );
    raise exception 'momo_ai_unsupported_promotion_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
end $$;

-- Four disconnected source adapters accept only non-negative integer fixture
-- metrics, deduplicate exact snapshots, and reject unknown schema fields.
do $$
declare
  v_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  sources text[] := array['facebook','instagram','google_business','website'];
  metric_sets jsonb[] := array[
    '{"impressions":1200,"reach":800,"engagements":96,"clicks":24}'::jsonb,
    '{"impressions":1000,"reach":700,"engagements":90,"clicks":30}'::jsonb,
    '{"views":600,"calls":12,"directions":18,"website_clicks":36}'::jsonb,
    '{"sessions":400,"engaged_sessions":260,"conversions":20}'::jsonb
  ];
  first_id uuid;
  repeated_id uuid;
  source_index integer;
  required_key text;
  required_keys text[];
begin
  for source_index in 1..array_length(sources, 1) loop
    first_id := public.veroxa_record_momo_metrics_rehearsal_v1(
      v_restaurant_id, sources[source_index], date '2000-01-01',
      date '2000-01-07', metric_sets[source_index]
    );
    repeated_id := public.veroxa_record_momo_metrics_rehearsal_v1(
      v_restaurant_id, sources[source_index], date '2000-01-01',
      date '2000-01-07', metric_sets[source_index]
    );
    if first_id is null or repeated_id <> first_id then
      raise exception 'momo_metrics_rehearsal_not_idempotent:%', sources[source_index];
    end if;
    required_keys := case sources[source_index]
      when 'facebook' then array['impressions','reach','engagements','clicks']
      when 'instagram' then array['impressions','reach','engagements','clicks']
      when 'google_business' then array['views','calls','directions','website_clicks']
      when 'website' then array['sessions','engaged_sessions','conversions']
    end;
    foreach required_key in array required_keys loop
      begin
        perform public.veroxa_record_momo_metrics_rehearsal_v1(
          v_restaurant_id, sources[source_index], date '2000-04-01',
          date '2000-04-07', metric_sets[source_index] - required_key
        );
        raise exception 'momo_missing_required_metric_was_accepted:%:%',
          sources[source_index], required_key;
      exception when sqlstate '22023' then
        null;
      end;
    end loop;
  end loop;
  if (select count(*) from public.veroxa_visibility_snapshots snapshot
      where snapshot.restaurant_id = v_restaurant_id
        and snapshot.schema_version = 'momo-metrics-rehearsal-v1'
        and snapshot.period_start = date '2000-01-01'
        and snapshot.period_end = date '2000-01-07'
        and snapshot.source = any(sources)
        and snapshot.evidence_class = 'synthetic'
        and snapshot.execution_mode = 'rehearsal'
        and not snapshot.external_write_allowed
        and snapshot.recorded_by = current_setting('veroxa.test.team_id')::uuid) <> 4 then
    raise exception 'momo_four_source_metrics_matrix_missing';
  end if;

  begin
    perform public.veroxa_record_momo_metrics_rehearsal_v1(
      v_restaurant_id, 'facebook', date '2000-02-01', date '2000-02-07',
      '{"impressions":-1}'::jsonb
    );
    raise exception 'momo_negative_metric_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_metrics_rehearsal_v1(
      v_restaurant_id, 'facebook', date '2000-02-01', date '2000-02-07',
      '{"impressions":1,"customer_email":1}'::jsonb
    );
    raise exception 'momo_unknown_metric_key_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_metrics_rehearsal_v1(
      v_restaurant_id, 'unknown_source', date '2000-02-01', date '2000-02-07',
      '{"views":1}'::jsonb
    );
    raise exception 'momo_unknown_metric_source_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
end $$;

-- Public-only SEO evidence is persisted with exact page observations, durable
-- before/after plans, and a full rollback snapshot. Empty objects fail closed.
do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  page_url text := 'https://momohousesa.com/';
  observed_at timestamptz := date_trunc('milliseconds', now());
  observed_at_text text := to_char(
    observed_at at time zone 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
  );
  original_title text := 'Best Momos in Town | Momo House San Antonio (Nepali Style Dumplings) | Momos near me';
  pages jsonb;
  evidence_snapshot jsonb;
  findings jsonb;
  proposed_changes jsonb;
  rollback_snapshot jsonb;
  blocked_reasons jsonb := '["real_owner_evidence_required","website_access_not_authorized","change_set_approval_required","external_writes_disabled"]'::jsonb;
  baseline_id uuid;
  repeated_baseline_id uuid;
  change_set_id uuid;
  repeated_change_set_id uuid;
begin
  pages := jsonb_build_array(jsonb_build_object(
    'url', page_url,
    'observedAt', observed_at_text,
    'title', original_title,
    'text', 'THIS IS A NON LIVE LOCATION',
    'listedAddress', '4447 De Zavala Rd, San Antonio, TX',
    'listedHours', jsonb_build_array('Sun 11-8; Mon-Thu 11-7; Fri-Sat 11-9')
  ));
  evidence_snapshot := jsonb_build_object(
    'pages', pages,
    'observedBy', 'public_web_evidence_review'
  );
  findings := jsonb_build_array(jsonb_build_object(
    'code', 'non_live_location_copy',
    'severity', 'critical',
    'title', 'Public home page says the location is not live',
    'evidenceUrl', page_url,
    'evidence', 'The rendered home page includes THIS IS A NON LIVE LOCATION.',
    'recommendedAction', 'Confirm the real location state with the owner before drafting any public replacement.'
  ));
  proposed_changes := jsonb_build_object(
    'changes', jsonb_build_array(
      jsonb_build_object(
        'field', 'title',
        'before', original_title,
        'after', 'Momo House San Antonio | Nepali Dumplings',
        'rationale', 'Use a concise descriptive title without an unsupported best-in-town claim.'
      ),
      jsonb_build_object(
        'field', 'meta_description',
        'before', null,
        'after', 'Explore Momo House San Antonio menu and catering information after business details are owner-confirmed.',
        'rationale', 'Provide a people-first summary while keeping unconfirmed business details out of the draft.'
      )
    ),
    'structuredDataDraft', jsonb_build_object(
      '@context', 'https://schema.org',
      '@type', 'Restaurant',
      'name', 'Momo House San Antonio',
      'address', jsonb_build_object(
        '@type', 'PostalAddress',
        'streetAddress', '4447 De Zavala Rd',
        'addressLocality', 'San Antonio'
      ),
      'servesCuisine', 'Nepali',
      'url', page_url
    ),
    'schemaVersion', 'momo-seo-change-plan-v1'
  );
  rollback_snapshot := jsonb_build_object(
    'title', original_title,
    'pageEvidence', pages
  );

  baseline_id := public.veroxa_record_momo_seo_baseline_v1(
    restaurant_id, page_url, 'home', observed_at,
    evidence_snapshot, findings, 'public_evidence'
  );
  repeated_baseline_id := public.veroxa_record_momo_seo_baseline_v1(
    restaurant_id, page_url, 'home', observed_at,
    evidence_snapshot, findings, 'public_evidence'
  );
  if baseline_id is null or repeated_baseline_id <> baseline_id then
    raise exception 'momo_seo_baseline_not_idempotent';
  end if;

  change_set_id := public.veroxa_record_momo_seo_change_set_v1(
    restaurant_id, baseline_id, page_url, proposed_changes,
    rollback_snapshot, blocked_reasons, 'public_evidence'
  );
  repeated_change_set_id := public.veroxa_record_momo_seo_change_set_v1(
    restaurant_id, baseline_id, page_url, proposed_changes,
    rollback_snapshot, blocked_reasons, 'public_evidence'
  );
  if change_set_id is null or repeated_change_set_id <> change_set_id then
    raise exception 'momo_seo_change_set_not_idempotent';
  end if;
  perform set_config('veroxa.test.seo_baseline_id', baseline_id::text, true);
  perform set_config('veroxa.test.seo_change_set_id', change_set_id::text, true);

  begin
    perform public.veroxa_record_momo_seo_baseline_v1(
      restaurant_id, page_url, 'home', observed_at,
      '{}'::jsonb, findings, 'public_evidence'
    );
    raise exception 'momo_empty_seo_baseline_evidence_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_seo_change_set_v1(
      restaurant_id, baseline_id, page_url, '{}'::jsonb,
      rollback_snapshot, blocked_reasons, 'public_evidence'
    );
    raise exception 'momo_empty_seo_proposed_changes_were_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_seo_change_set_v1(
      restaurant_id, baseline_id, page_url, proposed_changes,
      '{}'::jsonb, blocked_reasons, 'public_evidence'
    );
    raise exception 'momo_empty_seo_rollback_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
end $$;

reset role;

-- The Client development proxy cannot prepare or attest AI work and cannot
-- record disconnected metrics fixtures.
select set_config('request.jwt.claim.sub', current_setting('veroxa.test.proxy_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  v_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
begin
  begin
    perform public.veroxa_prepare_momo_ai_job_v1(
      v_restaurant_id, 'caption', 'restaurant', v_restaurant_id
    );
    raise exception 'momo_proxy_ai_prepare_was_accepted';
  exception when sqlstate '42501' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_ai_contract_rehearsal_v1(
      v_restaurant_id,
      'rr_proxy_ai_denial_v1',
      jsonb_build_object(
        'restaurantId', v_restaurant_id,
        'restaurantName', 'Momo''s House San Antonio',
        'objective', 'This valid-shaped Client request must be denied before persistence.',
        'facts', '[{"key":"fixture_scope","value":"Synthetic fixture.","evidenceClass":"synthetic"}]'::jsonb,
        'channels', '["facebook","instagram","google_business"]'::jsonb
      ),
      '{"caption":"Momo''s House San Antonio content workflow rehearsal. Final wording, facts, media, timing, and account actions require Team review and real-owner approval before public use.","altText":"Synthetic Momo workflow card used only for Team preconnection testing.","channelVariants":{"facebook":"Momo''s House San Antonio content workflow rehearsal. Final wording, facts, media, timing, and account actions require Team review and real-owner approval before public use.","instagram":"Momo''s House San Antonio content workflow rehearsal. Final wording, facts, media, timing, and account actions require Team review and real-owner approval before public use.","google_business":"Momo''s House San Antonio content workflow rehearsal. Final wording, facts, media, timing, and account actions require Team review and real-owner approval before public use."},"claims":[]}'::jsonb,
      '{"allClaimsSupported":true,"unsupportedClaims":[],"factKeysUsed":["fixture_scope"],"blockedLiveReasons":["real_owner_evidence_required","human_review_required","provider_connection_required","exact_action_consent_required","external_writes_disabled"]}'::jsonb,
      '["google_people_first_content","ftc_truthful_advertising"]'::jsonb
    );
    raise exception 'momo_proxy_ai_rehearsal_was_accepted';
  exception when sqlstate '42501' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_metrics_rehearsal_v1(
      v_restaurant_id, 'website', date '2000-03-01', date '2000-03-07',
      '{"sessions":1}'::jsonb
    );
    raise exception 'momo_proxy_metrics_rehearsal_was_accepted';
  exception when sqlstate '42501' then
    null;
  end;
end $$;

reset role;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

-- The existing work engine is exercised as the provider-neutral scheduler:
-- queue, start, complete, fail, bounded retry, backoff, recovery, and activity.
do $$
declare
  v_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  team_id uuid := current_setting('veroxa.test.team_id')::uuid;
  completed_work_id uuid;
  retry_work_id uuid;
begin
  insert into public.veroxa_work_items (
    restaurant_id, work_type, title, description, priority, status,
    attempt_count, max_attempts, created_by
  ) values (
    v_restaurant_id, 'content', 'RR offline scheduler completion',
    'Rollback-only provider-neutral work lifecycle fixture.', 3, 'queued',
    0, 3, team_id
  ) returning id into completed_work_id;
  perform public.veroxa_transition_work_item_v1(
    completed_work_id, 'in_progress', null, 'team', false,
    '{"fixture":"rr_scheduler_completion"}'::jsonb
  );
  perform public.veroxa_transition_work_item_v1(
    completed_work_id, 'completed', 'Offline contract completed.', 'team', false,
    '{"fixture":"rr_scheduler_completion"}'::jsonb
  );
  if not exists (select 1 from public.veroxa_work_items work
      where work.id = completed_work_id and work.status::text = 'completed'
        and work.attempt_count = 1 and work.completed_at is not null)
    or not exists (select 1 from public.veroxa_job_attempts attempt
      where attempt.work_item_id = completed_work_id and attempt.attempt_number = 1
        and attempt.status::text = 'completed' and attempt.completed_at is not null)
    or (select count(*) from public.veroxa_activity_events event
      where event.restaurant_id = v_restaurant_id and event.subject_type = 'work_item'
        and event.subject_id = completed_work_id
        and event.event_type in ('work_item_in_progress','work_item_completed')) <> 2 then
    raise exception 'momo_work_completion_lifecycle_failed';
  end if;

  insert into public.veroxa_work_items (
    restaurant_id, work_type, title, description, priority, status,
    attempt_count, max_attempts, created_by
  ) values (
    v_restaurant_id, 'content', 'RR offline scheduler retry',
    'Rollback-only bounded retry and recovery fixture.', 2, 'queued',
    0, 3, team_id
  ) returning id into retry_work_id;
  perform public.veroxa_transition_work_item_v1(
    retry_work_id, 'in_progress', null, 'team', false,
    '{"fixture":"rr_scheduler_retry"}'::jsonb
  );
  perform public.veroxa_transition_work_item_v1(
    retry_work_id, 'failed', 'Synthetic transient failure.', 'team', false,
    '{"fixture":"rr_scheduler_retry"}'::jsonb
  );
  perform public.veroxa_retry_work_item_v1(retry_work_id);
  if not exists (select 1 from public.veroxa_work_items work
      where work.id = retry_work_id and work.status::text = 'retrying'
        and work.attempt_count = 2 and work.next_attempt_at > now())
    or (select count(*) from public.veroxa_job_attempts attempt
      where attempt.work_item_id = retry_work_id
        and attempt.attempt_number in (1,2)) <> 2 then
    raise exception 'momo_work_bounded_retry_failed';
  end if;
  begin
    perform public.veroxa_transition_work_item_v1(
      retry_work_id, 'in_progress', null, 'team', false, '{}'::jsonb
    );
    raise exception 'momo_work_retry_backoff_was_bypassed';
  exception when sqlstate '55000' then
    null;
  end;
  perform set_config('veroxa.test.completed_work_id', completed_work_id::text, true);
  perform set_config('veroxa.test.retry_work_id', retry_work_id::text, true);
end $$;

reset role;

-- Rollback-only clock movement proves a due retry can resume. Production code
-- never receives a path to bypass the exponential backoff.
update public.veroxa_work_items
set next_attempt_at = now() - interval '1 second'
where id = current_setting('veroxa.test.retry_work_id')::uuid;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  retry_work_id uuid := current_setting('veroxa.test.retry_work_id')::uuid;
  recovery_id uuid;
begin
  perform public.veroxa_transition_work_item_v1(
    retry_work_id, 'in_progress', null, 'team', false,
    '{"fixture":"rr_scheduler_retry_due"}'::jsonb
  );
  perform public.veroxa_transition_work_item_v1(
    retry_work_id, 'failed', 'Synthetic terminal fixture failure.', 'team', false,
    '{"fixture":"rr_scheduler_retry_due"}'::jsonb
  );
  recovery_id := public.veroxa_start_recovery_run_v1(
    retry_work_id, 'rr_offline_recovery', 1
  );
  if not exists (select 1 from public.veroxa_recovery_runs recovery
      where recovery.id = recovery_id and recovery.subject_type = 'work_item'
        and recovery.subject_id = retry_work_id
        and recovery.status::text = 'in_progress'
        and recovery.attempt_count = 1 and recovery.max_attempts = 1) then
    raise exception 'momo_work_recovery_start_failed';
  end if;
  begin
    perform public.veroxa_retry_work_item_v1(retry_work_id);
    raise exception 'momo_active_recovery_did_not_lock_retry';
  exception when sqlstate '55000' then
    null;
  end;
  perform public.veroxa_complete_recovery_run_v1(
    recovery_id, true, 'Offline recovery contract completed.', 'team'
  );
  if not exists (select 1 from public.veroxa_recovery_runs recovery
      where recovery.id = recovery_id and recovery.status::text = 'completed'
        and recovery.completed_at is not null)
    or not exists (select 1 from public.veroxa_work_items work
      where work.id = retry_work_id and work.status::text = 'completed'
        and work.completed_at is not null and work.next_attempt_at is null)
    or not exists (select 1 from public.veroxa_activity_events event
      where event.subject_type = 'recovery_run' and event.subject_id = recovery_id
        and event.event_type = 'recovery_succeeded' and event.visibility = 'team'
        and not event.report_eligible) then
    raise exception 'momo_work_recovery_completion_or_activity_failed';
  end if;
  perform set_config('veroxa.test.recovery_id', recovery_id::text, true);
end $$;

reset role;

-- The Client proxy sees no internal work ledger and cannot insert, transition,
-- retry, or start a recovery run.
select set_config('request.jwt.claim.sub', current_setting('veroxa.test.proxy_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare denial_message text;
begin
  if (select count(*) from public.veroxa_work_items) <> 0
    or (select count(*) from public.veroxa_job_attempts) <> 0
    or (select count(*) from public.veroxa_recovery_runs) <> 0 then
    raise exception 'momo_proxy_internal_work_ledger_leak';
  end if;
  begin
    insert into public.veroxa_work_items (
      restaurant_id, work_type, title, priority, status,
      attempt_count, max_attempts, created_by
    ) values (
      current_setting('veroxa.test.restaurant_id')::uuid,
      'content', 'Proxy must not create Team work', 3, 'queued', 0, 3,
      current_setting('veroxa.test.proxy_id')::uuid
    );
    raise exception 'momo_proxy_work_insert_was_accepted';
  exception when sqlstate '23514' then
    get stacked diagnostics denial_message = message_text;
    if denial_message <> 'work_item_must_start_as_current_actor_queued_fixture' then
      raise exception 'momo_proxy_work_insert_failed_for_unexpected_reason:%', denial_message;
    end if;
  end;
  begin
    perform public.veroxa_transition_work_item_v1(
      current_setting('veroxa.test.completed_work_id')::uuid,
      'cancelled', 'Proxy must be denied.', 'team', false, '{}'::jsonb
    );
    raise exception 'momo_proxy_work_transition_was_accepted';
  exception when sqlstate '42501' then
    null;
  end;
  begin
    perform public.veroxa_retry_work_item_v1(
      current_setting('veroxa.test.retry_work_id')::uuid
    );
    raise exception 'momo_proxy_work_retry_was_accepted';
  exception when sqlstate '42501' then
    null;
  end;
  begin
    perform public.veroxa_start_recovery_run_v1(
      current_setting('veroxa.test.retry_work_id')::uuid,
      'proxy_must_be_denied', 1
    );
    raise exception 'momo_proxy_recovery_was_accepted';
  exception when sqlstate '42501' then
    null;
  end;
end $$;

reset role;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.proxy_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

-- A Client can upload and read a canonical private original. The following
-- Team assertion proves that the editor can later read the same source while
-- generated renditions remain hidden from the Client.
do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  proxy_id uuid := current_setting('veroxa.test.proxy_id')::uuid;
  object_id uuid := gen_random_uuid();
  object_path text := 'restaurants/' || restaurant_id::text
    || '/uploads/2000/01/' || gen_random_uuid()::text || '.png';
begin
  insert into storage.objects (
    id, bucket_id, name, owner, metadata, version, owner_id
  ) values (
    object_id, 'restaurant-media', object_path, proxy_id,
    '{"mimetype":"image/png","size":1024,"cacheControl":"3600"}'::jsonb,
    'rr-client-original-v1', proxy_id::text
  );
  if (select count(*) from storage.objects object
      where object.id = object_id and object.name = object_path
        and object.bucket_id = 'restaurant-media') <> 1 then
    raise exception 'momo_client_cannot_read_inserted_original_object';
  end if;
  perform set_config('veroxa.test.client_original_object_id', object_id::text, true);
  perform set_config('veroxa.test.client_original_path', object_path, true);
end $$;

reset role;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

-- Team can read the Client original, then prepare and insert only canonical
-- private rendition objects. The rendition is visible to Team while orphaned,
-- remains invisible to the Client proxy, and can be removed by Team only
-- through the narrow orphan-delete policy.
do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  team_id uuid := current_setting('veroxa.test.team_id')::uuid;
  alt_text text := 'Synthetic Momo storage boundary fixture used only for Team testing.';
  edit_recipe jsonb := jsonb_build_object(
    'preset', 'facebook_feed',
    'crop', jsonb_build_object('x', 0.2, 'y', 0, 'width', 0.6, 'height', 1),
    'rotation', 0,
    'brightness', 100,
    'contrast', 100,
    'saturation', 100,
    'outputFormat', 'image/png',
    'quality', 0.9,
    'altText', alt_text
  );
  prepared record;
  storage_object_id uuid := gen_random_uuid();
begin
  if (select count(*) from storage.objects object
      where object.id = current_setting('veroxa.test.client_original_object_id')::uuid
        and object.name = current_setting('veroxa.test.client_original_path')
        and object.bucket_id = 'restaurant-media') <> 1 then
    raise exception 'momo_team_cannot_read_client_original_object';
  end if;
  begin
    perform public.veroxa_prepare_momo_rendition_v1(
      restaurant_id,
      'synthetic_fixture', null, 'synthetic-fixture-v1', repeat('a', 64),
      'image/png', 720, 720,
      '{"preset":"google_business_square","crop":{"x":0.125,"y":0,"width":0.75,"height":1},"rotation":0,"brightness":200,"contrast":100,"saturation":100,"outputFormat":"image/png","quality":0.9,"altText":"Synthetic Momo workflow test card."}'::jsonb,
      'google_business', 'Synthetic Momo workflow test card.', 'synthetic'
    );
    raise exception 'momo_unsafe_rendition_recipe_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  select * into prepared from public.veroxa_prepare_momo_rendition_v1(
    restaurant_id,
    'synthetic_fixture', null, 'synthetic-fixture-v1', repeat('0', 64),
    'image/png', 1200, 1500, edit_recipe,
    'facebook', alt_text, 'synthetic'
  );
  if prepared.recipe_fingerprint !~ '^[0-9a-f]{64}$'
    or prepared.storage_path !~ ('^restaurants/' || restaurant_id::text
      || '/renditions/synthetic-fixture-v1/[0-9a-f]{64}[.]png$') then
    raise exception 'momo_canonical_rendition_preparation_failed';
  end if;
  if public.veroxa_restaurant_id_from_storage_path(prepared.storage_path)
      is distinct from restaurant_id
    or public.veroxa_restaurant_id_from_storage_path(
      'restaurants/' || restaurant_id::text || '/rendition/not-a-canonical-namespace.png'
    ) is not null then
    raise exception 'momo_storage_path_parser_failed_closed_contract';
  end if;
  insert into storage.objects (
    id, bucket_id, name, owner, metadata, version, owner_id
  ) values (
    storage_object_id, 'restaurant-media', prepared.storage_path, team_id,
    '{"mimetype":"image/png","size":2048,"cacheControl":"3600"}'::jsonb,
    'rr-orphan-boundary-v1', team_id::text
  );
  if (select count(*) from storage.objects object
      where object.id = storage_object_id
        and object.bucket_id = 'restaurant-media'
        and object.name = prepared.storage_path) <> 1 then
    raise exception 'momo_team_cannot_read_inserted_rendition_object';
  end if;
  perform set_config('veroxa.test.orphan_storage_object_id', storage_object_id::text, true);
  perform set_config('veroxa.test.orphan_storage_path', prepared.storage_path, true);
end $$;

reset role;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.proxy_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare deleted_count bigint;
begin
  if (select count(*) from storage.objects object
      where object.name = current_setting('veroxa.test.orphan_storage_path')
        and object.bucket_id = 'restaurant-media') <> 0 then
    raise exception 'momo_proxy_rendition_storage_read_leak';
  end if;
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects object
  where object.id = current_setting('veroxa.test.client_original_object_id')::uuid
    and object.name = current_setting('veroxa.test.client_original_path');
  get diagnostics deleted_count = row_count;
  if deleted_count <> 1 then
    raise exception 'momo_client_orphan_original_delete_failed';
  end if;
end $$;

reset role;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  deleted_count bigint;
  alt_text text := 'Synthetic Momo workflow card used only for Team preconnection testing.';
  facebook_recipe jsonb := jsonb_build_object(
    'preset', 'facebook_feed',
    'crop', jsonb_build_object('x', 0.2, 'y', 0, 'width', 0.6, 'height', 1),
    'rotation', 0, 'brightness', 100, 'contrast', 100, 'saturation', 100,
    'outputFormat', 'image/png', 'quality', 0.9, 'altText', alt_text
  );
  instagram_recipe jsonb := jsonb_build_object(
    'preset', 'instagram_square',
    'crop', jsonb_build_object('x', 0.125, 'y', 0, 'width', 0.75, 'height', 1),
    'rotation', 0, 'brightness', 100, 'contrast', 100, 'saturation', 100,
    'outputFormat', 'image/png', 'quality', 0.9, 'altText', alt_text
  );
  google_recipe jsonb := jsonb_build_object(
    'preset', 'google_business_square',
    'crop', jsonb_build_object('x', 0.125, 'y', 0, 'width', 0.75, 'height', 1),
    'rotation', 0, 'brightness', 100, 'contrast', 100, 'saturation', 100,
    'outputFormat', 'image/png', 'quality', 0.9, 'altText', alt_text
  );
  prepared record;
begin
  -- Supabase Storage sets this transaction-local guard before its delete SQL;
  -- RLS still decides whether the authenticated actor may remove the object.
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects object
  where object.id = current_setting('veroxa.test.orphan_storage_object_id')::uuid
    and object.name = current_setting('veroxa.test.orphan_storage_path');
  get diagnostics deleted_count = row_count;
  if deleted_count <> 1 or exists (
      select 1 from storage.objects object
      where object.id = current_setting('veroxa.test.orphan_storage_object_id')::uuid
    ) then
    raise exception 'momo_team_orphan_rendition_delete_failed';
  end if;

  select * into prepared from public.veroxa_prepare_momo_rendition_v1(
    restaurant_id, 'synthetic_fixture', null, 'synthetic-fixture-v1', repeat('1', 64),
    'image/png', 1200, 1500, facebook_recipe, 'facebook', alt_text, 'synthetic'
  );
  perform set_config('veroxa.test.rendition_facebook_path', prepared.storage_path, true);
  perform set_config('veroxa.test.rendition_facebook_recipe', prepared.recipe_fingerprint, true);

  select * into prepared from public.veroxa_prepare_momo_rendition_v1(
    restaurant_id, 'synthetic_fixture', null, 'synthetic-fixture-v1', repeat('2', 64),
    'image/png', 1080, 1080, instagram_recipe, 'instagram', alt_text, 'synthetic'
  );
  perform set_config('veroxa.test.rendition_instagram_path', prepared.storage_path, true);
  perform set_config('veroxa.test.rendition_instagram_recipe', prepared.recipe_fingerprint, true);

  select * into prepared from public.veroxa_prepare_momo_rendition_v1(
    restaurant_id, 'synthetic_fixture', null, 'synthetic-fixture-v1', repeat('3', 64),
    'image/png', 720, 720, google_recipe, 'google_business', alt_text, 'synthetic'
  );
  perform set_config('veroxa.test.rendition_google_business_path', prepared.storage_path, true);
  perform set_config('veroxa.test.rendition_google_business_recipe', prepared.recipe_fingerprint, true);
end $$;

reset role;

-- The three publication fixtures are inserted with privileged test setup only;
-- application registration still runs as the authenticated Team user and must
-- verify the canonical path, metadata, recipe fingerprint, and output hash.
do $$
declare
  team_id uuid := current_setting('veroxa.test.team_id')::uuid;
  paths text[] := array[
    current_setting('veroxa.test.rendition_facebook_path'),
    current_setting('veroxa.test.rendition_instagram_path'),
    current_setting('veroxa.test.rendition_google_business_path')
  ];
  sizes bigint[] := array[4096, 4100, 4200]::bigint[];
  path_index integer;
begin
  for path_index in 1..array_length(paths, 1) loop
    insert into storage.objects (
      id, bucket_id, name, owner, metadata, version, owner_id
    ) values (
      gen_random_uuid(), 'restaurant-media', paths[path_index], team_id,
      jsonb_build_object(
        'mimetype', 'image/png',
        'size', sizes[path_index],
        'cacheControl', '3600'
      ),
      'rr-registered-fixture-v1', team_id::text
    );
  end loop;
end $$;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  alt_text text := 'Synthetic Momo workflow card used only for Team preconnection testing.';
  facebook_recipe jsonb := jsonb_build_object(
    'preset', 'facebook_feed',
    'crop', jsonb_build_object('x', 0.2, 'y', 0, 'width', 0.6, 'height', 1),
    'rotation', 0, 'brightness', 100, 'contrast', 100, 'saturation', 100,
    'outputFormat', 'image/png', 'quality', 0.9, 'altText', alt_text
  );
  instagram_recipe jsonb := jsonb_build_object(
    'preset', 'instagram_square',
    'crop', jsonb_build_object('x', 0.125, 'y', 0, 'width', 0.75, 'height', 1),
    'rotation', 0, 'brightness', 100, 'contrast', 100, 'saturation', 100,
    'outputFormat', 'image/png', 'quality', 0.9, 'altText', alt_text
  );
  google_recipe jsonb := jsonb_build_object(
    'preset', 'google_business_square',
    'crop', jsonb_build_object('x', 0.125, 'y', 0, 'width', 0.75, 'height', 1),
    'rotation', 0, 'brightness', 100, 'contrast', 100, 'saturation', 100,
    'outputFormat', 'image/png', 'quality', 0.9, 'altText', alt_text
  );
  rendition_id uuid;
  repeated_id uuid;
begin
  rendition_id := public.veroxa_register_momo_rendition_v1(
    restaurant_id, 'synthetic_fixture', null, 'synthetic-fixture-v1', repeat('1', 64),
    current_setting('veroxa.test.rendition_facebook_path'), 'image/png', 4096,
    1200, 1500, repeat('4', 64), current_setting('veroxa.test.rendition_facebook_recipe'),
    facebook_recipe, 'facebook', alt_text, 'synthetic'
  );
  repeated_id := public.veroxa_register_momo_rendition_v1(
    restaurant_id, 'synthetic_fixture', null, 'synthetic-fixture-v1', repeat('1', 64),
    current_setting('veroxa.test.rendition_facebook_path'), 'image/png', 4096,
    1200, 1500, repeat('4', 64), current_setting('veroxa.test.rendition_facebook_recipe'),
    facebook_recipe, 'facebook', alt_text, 'synthetic'
  );
  if rendition_id is null or repeated_id <> rendition_id then
    raise exception 'momo_facebook_rendition_registration_not_idempotent';
  end if;
  perform set_config('veroxa.test.rendition_facebook_id', rendition_id::text, true);
  perform set_config('veroxa.test.rendition_facebook_hash', repeat('4', 64), true);

  rendition_id := public.veroxa_register_momo_rendition_v1(
    restaurant_id, 'synthetic_fixture', null, 'synthetic-fixture-v1', repeat('2', 64),
    current_setting('veroxa.test.rendition_instagram_path'), 'image/png', 4100,
    1080, 1080, repeat('5', 64), current_setting('veroxa.test.rendition_instagram_recipe'),
    instagram_recipe, 'instagram', alt_text, 'synthetic'
  );
  perform set_config('veroxa.test.rendition_instagram_id', rendition_id::text, true);
  perform set_config('veroxa.test.rendition_instagram_hash', repeat('5', 64), true);

  rendition_id := public.veroxa_register_momo_rendition_v1(
    restaurant_id, 'synthetic_fixture', null, 'synthetic-fixture-v1', repeat('3', 64),
    current_setting('veroxa.test.rendition_google_business_path'), 'image/png', 4200,
    720, 720, repeat('6', 64), current_setting('veroxa.test.rendition_google_business_recipe'),
    google_recipe, 'google_business', alt_text, 'synthetic'
  );
  perform set_config('veroxa.test.rendition_google_business_id', rendition_id::text, true);
  perform set_config('veroxa.test.rendition_google_business_hash', repeat('6', 64), true);

  if (select count(*) from public.veroxa_media_renditions rendition
      where rendition.restaurant_id = current_setting('veroxa.test.restaurant_id')::uuid
        and rendition.id = any(array[
          current_setting('veroxa.test.rendition_facebook_id')::uuid,
          current_setting('veroxa.test.rendition_instagram_id')::uuid,
          current_setting('veroxa.test.rendition_google_business_id')::uuid
        ])
        and rendition.source_kind = 'synthetic_fixture'
        and rendition.status = 'ready'
        and rendition.output_hash_attested_at is not null
        and not rendition.external_write_allowed) <> 3 then
    raise exception 'momo_registered_rendition_matrix_incomplete';
  end if;
end $$;

-- Every disconnected publication adapter must pass a success path, a bounded
-- transient retry, and a terminal dead-letter path without a provider write.
do $$
declare
  restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  approval_hash text := repeat('b', 64);
  alt_text text := 'Synthetic Momo workflow card used only for Team preconnection testing.';
  channels text[] := array['facebook','instagram','google_business'];
  scenarios text[] := array['success','transient_then_success','permanent_failure'];
  channel_name text;
  scenario_name text;
  rendition_id text;
  rendition_hash text;
  payload jsonb;
  attempts jsonb;
  receipt jsonb;
  status_value text;
  rehearsal_id uuid;
  repeated_id uuid;
  stored_hash text;
  sample_payload jsonb;
  sample_attempts jsonb;
  sample_receipt jsonb;
begin
  foreach channel_name in array channels loop
    rendition_id := current_setting('veroxa.test.rendition_' || channel_name || '_id');
    rendition_hash := current_setting('veroxa.test.rendition_' || channel_name || '_hash');
    payload := jsonb_build_object(
      'schemaVersion', 'momo-publication-rehearsal-v1',
      'restaurantId', restaurant_id,
      'variantId', 'synthetic-' || channel_name || '-fixture',
      'channel', channel_name,
      'caption', 'Synthetic Momo publication workflow fixture for Team review.',
      'scheduledFor', '2030-01-01T18:00:00.000Z',
      'media', jsonb_build_array(jsonb_build_object(
        'renditionId', rendition_id,
        'contentSha256', rendition_hash,
        'altText', alt_text
      )),
      'timezone', 'America/Chicago',
      'approvalSnapshotSha256', approval_hash
    );
    foreach scenario_name in array scenarios loop
      if scenario_name = 'success' then
        status_value := 'completed';
        attempts := '[{"number":1,"state":"succeeded","code":"simulated_acceptance","nextAttemptAfterSeconds":null}]'::jsonb;
        receipt := jsonb_build_object(
          'channel', channel_name, 'accepted', true, 'externalId', null,
          'published', false, 'readbackVerified', false
        );
      elsif scenario_name = 'transient_then_success' then
        status_value := 'completed';
        attempts := '[{"number":1,"state":"retryable_failure","code":"simulated_rate_limit","nextAttemptAfterSeconds":60},{"number":2,"state":"succeeded","code":"simulated_acceptance","nextAttemptAfterSeconds":null}]'::jsonb;
        receipt := jsonb_build_object(
          'channel', channel_name, 'accepted', true, 'externalId', null,
          'published', false, 'readbackVerified', false
        );
      else
        status_value := 'dead_letter';
        attempts := '[{"number":1,"state":"permanent_failure","code":"simulated_payload_rejection","nextAttemptAfterSeconds":null}]'::jsonb;
        receipt := jsonb_build_object(
          'channel', channel_name, 'accepted', false, 'externalId', null,
          'published', false, 'readbackVerified', false
        );
      end if;
      rehearsal_id := public.veroxa_record_momo_publication_rehearsal_v1(
        restaurant_id,
        'rr_publication_matrix_' || channel_name || '_' || scenario_name || '_v1',
        null, channel_name, payload, approval_hash, scenario_name, status_value,
        attempts, receipt, 'synthetic'
      );
      repeated_id := public.veroxa_record_momo_publication_rehearsal_v1(
        restaurant_id,
        'rr_publication_matrix_' || channel_name || '_' || scenario_name || '_v1',
        null, channel_name, payload, approval_hash, scenario_name, status_value,
        attempts, receipt, 'synthetic'
      );
      select rehearsal.payload_sha256 into stored_hash
      from public.veroxa_publication_rehearsals rehearsal
      where rehearsal.id = rehearsal_id;
      if rehearsal_id is null or repeated_id <> rehearsal_id
        or stored_hash <> encode(extensions.digest(convert_to(payload::text, 'UTF8'), 'sha256'), 'hex') then
        raise exception 'momo_publication_matrix_hash_or_idempotency_failed:%:%', channel_name, scenario_name;
      end if;
      if channel_name = 'instagram' and scenario_name = 'success' then
        sample_payload := payload;
        sample_attempts := attempts;
        sample_receipt := receipt;
      end if;
    end loop;
  end loop;

  if (select count(*) from public.veroxa_publication_rehearsals rehearsal
      where rehearsal.restaurant_id = current_setting('veroxa.test.restaurant_id')::uuid
        and rehearsal.subject_key ~ '^rr_publication_matrix_(facebook|instagram|google_business)_(success|transient_then_success|permanent_failure)_v1$'
        and not rehearsal.external_write_allowed) <> 9 then
    raise exception 'momo_publication_three_by_three_matrix_incomplete';
  end if;

  begin
    perform public.veroxa_record_momo_publication_rehearsal_v1(
      restaurant_id,
      'rr_publication_fake_media_v1',
      null,
      'instagram',
      jsonb_set(sample_payload, '{media,0,renditionId}', to_jsonb(gen_random_uuid()::text)),
      approval_hash,
      'success',
      'completed',
      sample_attempts,
      sample_receipt,
      'synthetic'
    );
    raise exception 'momo_publication_fake_rendition_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_publication_rehearsal_v1(
      restaurant_id,
      'rr_publication_invalid_v1',
      null,
      'instagram',
      sample_payload,
      approval_hash,
      'permanent_failure',
      'completed',
      sample_attempts,
      sample_receipt,
      'synthetic'
    );
    raise exception 'momo_invalid_publication_scenario_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.veroxa_record_momo_publication_rehearsal_v1(
      restaurant_id,
      'rr_publication_extra_payload_key_v1',
      null,
      'instagram',
      sample_payload || '{"unexpected":"forbidden"}'::jsonb,
      approval_hash,
      'success',
      'completed',
      sample_attempts,
      sample_receipt,
      'synthetic'
    );
    raise exception 'momo_publication_extra_payload_key_was_accepted';
  exception when sqlstate '22023' then
    null;
  end;
end $$;

reset role;

-- The synthetic adapter matrix above proves disconnected provider behavior.
-- This rollback-only fixture additionally proves the real application path:
-- owner-attested media -> immutable rendition -> approved variant placement ->
-- exact approval snapshot -> publication rehearsal with a non-null variant.
do $$
declare
  target_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  team_user_id uuid := current_setting('veroxa.test.team_id')::uuid;
  proxy_user_id uuid := current_setting('veroxa.test.proxy_id')::uuid;
  owner_asset_id uuid := gen_random_uuid();
  real_content_item_id uuid;
  real_variant_id uuid;
  real_calendar_id uuid;
  scheduled_record record;
  item_approval_id uuid;
  variant_approval_id uuid;
  real_truth_id uuid;
  truth_confirmation_id uuid;
  truth_value jsonb;
  truth_section text;
  truth_field_ids uuid[];
  original_object_id uuid := gen_random_uuid();
  original_path text := 'restaurants/' || target_restaurant_id::text
    || '/uploads/2000/01/' || owner_asset_id::text || '.png';
  caption text := 'Momo team content workflow rehearsal using an owner-authorized media fixture.';
begin
  insert into storage.objects (
    id, bucket_id, name, owner, metadata, version, owner_id
  ) values (
    original_object_id, 'restaurant-media', original_path, proxy_user_id,
    '{"mimetype":"image/png","size":6000,"cacheControl":"3600"}'::jsonb,
    'rr-owner-original-v1', proxy_user_id::text
  );

  -- Match the live registered-media trigger: the authenticated uploader must
  -- be the same identity recorded on the asset row.
  perform set_config('request.jwt.claim.sub', proxy_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  insert into public.veroxa_media_assets (
    id, restaurant_id, storage_path, original_file_name, mime_type, file_size,
    uploaded_by, status, content_sha256, width, height
  ) values (
    owner_asset_id, target_restaurant_id, original_path, 'rr-owner-momo-fixture.png',
    'image/png', 6000, proxy_user_id, 'ready_to_use', repeat('7', 64), 1600, 1200
  );

  -- The proxy is substituted as a real owner only long enough for the rights
  -- classifier trigger to attest this fixture. The authority row is restored
  -- immediately, and the entire fixture is rolled back by the suite.
  update public.veroxa_momo_evidence_authorities authority
  set evidence_class = 'real_owner', notes = 'Rollback-only media-rights fixture.'
  where authority.restaurant_id = target_restaurant_id
    and authority.user_id = proxy_user_id;

  insert into public.veroxa_media_rights (
    restaurant_id, asset_id, rights_status, usage_scope,
    attestation_version, attestation_text, attestation_sha256,
    valid_from, expires_at, confirmed_by, confirmed_at, evidence_class
  ) values (
    target_restaurant_id, owner_asset_id, 'confirmed', '["instagram"]'::jsonb,
    'momo-media-rights-v1',
    'I confirm I own or have permission to provide this media for the selected Veroxa usage scopes.',
    '8d6b83d28e393313e52ac32e54eda8286e4c305617ea8722aedc9729a887628f',
    now() - interval '1 day', null, proxy_user_id, now(), 'real_owner'
  );
  perform set_config('request.jwt.claim.sub', team_user_id::text, true);

  insert into public.veroxa_media_reviews (
    restaurant_id, asset_id, status, quality_score, quality_notes,
    public_use_approved, is_current, reviewed_by, reviewed_at
  ) values (
    target_restaurant_id, owner_asset_id, 'approved', 95,
    'Rollback-only owner-media publication contract fixture.',
    true, true, team_user_id, now()
  );

  select field.value_json, field.section into truth_value, truth_section
  from public.veroxa_restaurant_truth_fields field
  where field.restaurant_id = target_restaurant_id
    and field.field_key = 'brand.voice' and field.is_current
  limit 1;
  if truth_value is null or truth_section is null then
    raise exception 'momo_real_variant_truth_fixture_missing';
  end if;
  real_truth_id := public.veroxa_create_truth_revision_v1(
    target_restaurant_id, 'brand.voice', truth_section, truth_value, 'team'
  );
  perform set_config('request.jwt.claim.sub', proxy_user_id::text, true);
  truth_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    target_restaurant_id, 'truth_field', real_truth_id,
    'business_truth', 'confirm', null,
    'Rollback-only real-owner truth fixture.'
  );
  perform set_config('request.jwt.claim.sub', team_user_id::text, true);
  perform public.veroxa_apply_confirmation_v1(
    truth_confirmation_id, 'approved', null,
    'Rollback-only real-owner truth fixture.'
  );
  if not exists (
    select 1 from public.veroxa_restaurant_truth_fields field
    join public.veroxa_confirmations confirmation
      on confirmation.subject_type = 'truth_field' and confirmation.subject_id = field.id
    where field.id = real_truth_id and field.restaurant_id = target_restaurant_id
      and field.status = 'owner_confirmed' and field.is_current
      and field.evidence_class = 'real_owner'
      and confirmation.id = truth_confirmation_id
      and confirmation.status = 'approved' and confirmation.evidence_class = 'real_owner'
  ) then
    raise exception 'momo_real_variant_truth_not_classified_real_owner';
  end if;
  truth_field_ids := array[real_truth_id];
  real_content_item_id := public.veroxa_create_manual_content_draft_v1(
    target_restaurant_id, null, owner_asset_id,
    'Momo content workflow rehearsal',
    'Internal content workflow rehearsal for Momo House San Antonio.',
    caption, false, truth_field_ids, 'Momo Cravings'
  );
  update public.veroxa_momo_evidence_authorities authority
  set evidence_class = 'development_proxy', notes = 'Temporary Momo development proxy.'
  where authority.restaurant_id = target_restaurant_id
    and authority.user_id = proxy_user_id;

  insert into public.veroxa_approvals (
    restaurant_id, subject_type, subject_id, approval_kind, status,
    requested_by, requested_at, decided_by, decided_at, decision_notes
  ) values (
    target_restaurant_id, 'content_item', real_content_item_id, 'team_review',
    'approved', team_user_id, now(), team_user_id, now(),
    'Rollback-only item review prerequisite.'
  ) returning id into item_approval_id;
  perform public.veroxa_apply_approval_v1(
    item_approval_id, 'approved', 'Rollback-only item review prerequisite.'
  );

  real_variant_id := public.veroxa_create_manual_variant_v1(
    target_restaurant_id, real_content_item_id, 'instagram', caption
  );

  insert into public.veroxa_approvals (
    restaurant_id, subject_type, subject_id, approval_kind, status,
    requested_by, requested_at, decided_by, decided_at, decision_notes
  ) values (
    target_restaurant_id, 'content_variant', real_variant_id, 'team_review',
    'approved', team_user_id, now(), team_user_id, now(),
    'Rollback-only variant review prerequisite.'
  ) returning id into variant_approval_id;
  perform public.veroxa_apply_approval_v1(
    variant_approval_id, 'approved', 'Rollback-only variant review prerequisite.'
  );

  select * into scheduled_record from public.veroxa_schedule_momo_variant_v1(
    target_restaurant_id, real_variant_id,
    '2030-01-02 12:00:00'::timestamp, 'America/Chicago'
  );
  real_calendar_id := scheduled_record.calendar_entry_id;
  if real_calendar_id is null
    or scheduled_record.scheduled_for is distinct from '2030-01-02T18:00:00.000Z'::timestamptz then
    raise exception 'momo_real_variant_calendar_not_scheduled_exactly';
  end if;

  if (select rights.evidence_class from public.veroxa_media_rights rights
      where rights.restaurant_id = target_restaurant_id
        and rights.asset_id = owner_asset_id)
      is distinct from 'real_owner' then
    raise exception 'momo_owner_media_rights_not_classified_real_owner';
  end if;

  perform set_config('veroxa.test.owner_asset_id', owner_asset_id::text, true);
  perform set_config('veroxa.test.real_content_item_id', real_content_item_id::text, true);
  perform set_config('veroxa.test.real_variant_id', real_variant_id::text, true);
  perform set_config('veroxa.test.real_variant_caption', caption, true);
end $$;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

-- Both owner-asset renditions use an aspect-safe square crop from the
-- 1600-by-1200 original. Only the primary rendition is attached to the
-- variant; the alternate remains valid media for the placement-mismatch test.
do $$
declare
  target_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  team_user_id uuid := current_setting('veroxa.test.team_id')::uuid;
  owner_asset_id uuid := current_setting('veroxa.test.owner_asset_id')::uuid;
  alt_text text := 'Owner-authorized Momo media fixture used only in the rollback publication test.';
  primary_recipe jsonb := jsonb_build_object(
    'preset', 'instagram_square',
    'crop', jsonb_build_object('x', 0.125, 'y', 0, 'width', 0.75, 'height', 1),
    'rotation', 0, 'brightness', 100, 'contrast', 100, 'saturation', 100,
    'outputFormat', 'image/png', 'quality', 0.9, 'altText', alt_text
  );
  alternate_recipe jsonb := jsonb_build_object(
    'preset', 'instagram_square',
    'crop', jsonb_build_object('x', 0.125, 'y', 0, 'width', 0.75, 'height', 1),
    'rotation', 0, 'brightness', 101, 'contrast', 100, 'saturation', 100,
    'outputFormat', 'image/png', 'quality', 0.9, 'altText', alt_text
  );
  primary_prepared record;
  alternate_prepared record;
  primary_id uuid;
  alternate_id uuid;
  placement_id uuid;
  repeated_placement_id uuid;
begin
  select * into primary_prepared from public.veroxa_prepare_momo_rendition_v1(
    target_restaurant_id, 'owner_asset', owner_asset_id, owner_asset_id::text, repeat('7', 64),
    'image/png', 1080, 1080, primary_recipe, 'instagram', alt_text, 'real_owner'
  );
  select * into alternate_prepared from public.veroxa_prepare_momo_rendition_v1(
    target_restaurant_id, 'owner_asset', owner_asset_id, owner_asset_id::text, repeat('7', 64),
    'image/png', 1080, 1080, alternate_recipe, 'instagram', alt_text, 'real_owner'
  );

  insert into storage.objects (
    id, bucket_id, name, owner, metadata, version, owner_id
  ) values
    (gen_random_uuid(), 'restaurant-media', primary_prepared.storage_path, team_user_id,
      '{"mimetype":"image/png","size":5100,"cacheControl":"3600"}'::jsonb,
      'rr-owner-rendition-v1', team_user_id::text),
    (gen_random_uuid(), 'restaurant-media', alternate_prepared.storage_path, team_user_id,
      '{"mimetype":"image/png","size":5200,"cacheControl":"3600"}'::jsonb,
      'rr-owner-rendition-v2', team_user_id::text);

  primary_id := public.veroxa_register_momo_rendition_v1(
    target_restaurant_id, 'owner_asset', owner_asset_id, owner_asset_id::text, repeat('7', 64),
    primary_prepared.storage_path, 'image/png', 5100, 1080, 1080,
    repeat('8', 64), primary_prepared.recipe_fingerprint, primary_recipe,
    'instagram', alt_text, 'real_owner'
  );
  alternate_id := public.veroxa_register_momo_rendition_v1(
    target_restaurant_id, 'owner_asset', owner_asset_id, owner_asset_id::text, repeat('7', 64),
    alternate_prepared.storage_path, 'image/png', 5200, 1080, 1080,
    repeat('9', 64), alternate_prepared.recipe_fingerprint, alternate_recipe,
    'instagram', alt_text, 'real_owner'
  );

  placement_id := public.veroxa_attach_momo_rendition_v1(
    target_restaurant_id,
    current_setting('veroxa.test.real_content_item_id')::uuid,
    current_setting('veroxa.test.real_variant_id')::uuid,
    primary_id, 'instagram', 'primary', 0::smallint, alt_text,
    '{"source":"rollback_only","purpose":"publication_rehearsal"}'::jsonb
  );
  repeated_placement_id := public.veroxa_attach_momo_rendition_v1(
    target_restaurant_id,
    current_setting('veroxa.test.real_content_item_id')::uuid,
    current_setting('veroxa.test.real_variant_id')::uuid,
    primary_id, 'instagram', 'primary', 0::smallint, alt_text,
    '{"source":"rollback_only","purpose":"publication_rehearsal"}'::jsonb
  );
  if placement_id is null or repeated_placement_id <> placement_id
    or (select count(*) from public.veroxa_content_media_placements placement
        where placement.id = placement_id
          and placement.restaurant_id = target_restaurant_id
          and placement.content_item_id = current_setting('veroxa.test.real_content_item_id')::uuid
          and placement.variant_id = current_setting('veroxa.test.real_variant_id')::uuid
          and placement.rendition_id = primary_id
          and placement.source_asset_id = owner_asset_id
          and placement.platform = 'instagram'
          and placement.execution_mode = 'rehearsal'
          and placement.evidence_class = 'real_owner') <> 1
    or (select count(*) from public.veroxa_media_usage usage
        where usage.restaurant_id = target_restaurant_id
          and usage.asset_id = owner_asset_id
          and usage.content_item_id = current_setting('veroxa.test.real_content_item_id')::uuid
          and usage.platform = 'instagram'
          and usage.external_reference = 'rendition:' || primary_id::text) <> 1 then
    raise exception 'momo_real_variant_media_placement_not_persisted_idempotently';
  end if;

  begin
    perform public.veroxa_attach_momo_rendition_v1(
      target_restaurant_id,
      current_setting('veroxa.test.real_content_item_id')::uuid,
      current_setting('veroxa.test.real_variant_id')::uuid,
      alternate_id, 'instagram', 'primary', 0::smallint, alt_text,
      '{"source":"rollback_only","purpose":"publication_rehearsal"}'::jsonb
    );
    raise exception 'momo_conflicting_real_variant_placement_was_accepted';
  exception when sqlstate '23505' then
    null;
  end;

  perform set_config('veroxa.test.real_primary_rendition_id', primary_id::text, true);
  perform set_config('veroxa.test.real_primary_rendition_hash', repeat('8', 64), true);
  perform set_config('veroxa.test.real_alternate_rendition_id', alternate_id::text, true);
  perform set_config('veroxa.test.real_alternate_rendition_hash', repeat('9', 64), true);
  perform set_config('veroxa.test.real_rendition_alt_text', alt_text, true);
end $$;

reset role;

-- Capture the exact canonical approval subject only after the approved item,
-- variant, calendar entry, and media placement are all stable.
do $$
declare
  target_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  team_user_id uuid := current_setting('veroxa.test.team_id')::uuid;
  target_variant_id uuid := current_setting('veroxa.test.real_variant_id')::uuid;
  approval_snapshot jsonb;
  approval_hash text;
  publishing_approval_id uuid;
begin
  approval_snapshot := veroxa_private.approval_subject_snapshot_v1(
    target_restaurant_id, 'content_variant', target_variant_id
  );
  approval_hash := veroxa_private.confirmation_snapshot_sha256_v1(approval_snapshot);
  if jsonb_typeof(approval_snapshot) is distinct from 'object'
    or approval_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'momo_real_variant_approval_snapshot_not_canonical';
  end if;
  insert into public.veroxa_approvals (
    restaurant_id, subject_type, subject_id, approval_kind, status,
    requested_by, requested_at, decided_by, decided_at, decision_notes,
    subject_snapshot, subject_snapshot_sha256
  ) values (
    target_restaurant_id, 'content_variant', target_variant_id, 'publishing', 'approved',
    team_user_id, now(), team_user_id, now(),
    'Rollback-only exact publication approval fixture.',
    approval_snapshot, approval_hash
  ) returning id into publishing_approval_id;
  perform public.veroxa_apply_approval_v1(
    publishing_approval_id, 'approved',
    'Rollback-only exact publication approval fixture.'
  );
  select approval.subject_snapshot_sha256 into approval_hash
  from public.veroxa_approvals approval
  where approval.id = publishing_approval_id and approval.status = 'approved';
  if approval_hash is null then
    raise exception 'momo_real_variant_publishing_approval_not_applied';
  end if;
  perform set_config('veroxa.test.real_approval_hash', approval_hash, true);
end $$;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

-- A real variant succeeds only when copy, schedule, approval, media bytes, and
-- the persisted placement all match their current canonical records.
do $$
declare
  target_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  target_variant_id uuid := current_setting('veroxa.test.real_variant_id')::uuid;
  approval_hash text := current_setting('veroxa.test.real_approval_hash');
  wrong_approval_hash text := case
    when approval_hash = repeat('f', 64) then repeat('e', 64)
    else repeat('f', 64)
  end;
  alt_text text := current_setting('veroxa.test.real_rendition_alt_text');
  attempts jsonb := '[{"number":1,"state":"succeeded","code":"simulated_acceptance","nextAttemptAfterSeconds":null}]'::jsonb;
  receipt jsonb := '{"channel":"instagram","accepted":true,"externalId":null,"published":false,"readbackVerified":false}'::jsonb;
  payload jsonb;
  mismatch_payload jsonb;
  rehearsal_id uuid;
begin
  payload := jsonb_build_object(
    'schemaVersion', 'momo-publication-rehearsal-v1',
    'restaurantId', target_restaurant_id,
    'variantId', target_variant_id,
    'channel', 'instagram',
    'caption', current_setting('veroxa.test.real_variant_caption'),
    'scheduledFor', '2030-01-02T18:00:00.000Z',
    'timezone', 'America/Chicago',
    'media', jsonb_build_array(jsonb_build_object(
      'renditionId', current_setting('veroxa.test.real_primary_rendition_id'),
      'contentSha256', current_setting('veroxa.test.real_primary_rendition_hash'),
      'altText', alt_text
    )),
    'approvalSnapshotSha256', approval_hash
  );
  rehearsal_id := public.veroxa_record_momo_publication_rehearsal_v1(
    target_restaurant_id, 'rr_real_variant_publication_success_v1', target_variant_id,
    'instagram', payload, approval_hash, 'success', 'completed',
    attempts, receipt, 'real_owner'
  );
  if rehearsal_id is null
    or (select count(*) from public.veroxa_publication_rehearsals rehearsal
        where rehearsal.id = rehearsal_id and rehearsal.variant_id = target_variant_id
          and rehearsal.evidence_class = 'real_owner'
          and rehearsal.approval_snapshot_sha256 = approval_hash
          and not rehearsal.external_write_allowed) <> 1 then
    raise exception 'momo_real_variant_publication_rehearsal_not_persisted';
  end if;

  begin
    perform public.veroxa_record_momo_publication_rehearsal_v1(
      target_restaurant_id, 'rr_real_variant_mutated_caption_v1', target_variant_id,
      'instagram', jsonb_set(payload, '{caption}',
        to_jsonb('Changed copy that was not approved.'::text)),
      approval_hash, 'success', 'completed', attempts, receipt, 'real_owner'
    );
    raise exception 'momo_real_variant_mutated_caption_was_accepted';
  exception when sqlstate '23503' then
    null;
  end;

  begin
    perform public.veroxa_record_momo_publication_rehearsal_v1(
      target_restaurant_id, 'rr_real_variant_mutated_schedule_v1', target_variant_id,
      'instagram', jsonb_set(payload, '{scheduledFor}',
        to_jsonb('2030-01-03T18:00:00.000Z'::text)),
      approval_hash, 'success', 'completed', attempts, receipt, 'real_owner'
    );
    raise exception 'momo_real_variant_mutated_schedule_was_accepted';
  exception when sqlstate '23503' then
    null;
  end;

  begin
    perform public.veroxa_record_momo_publication_rehearsal_v1(
      target_restaurant_id, 'rr_real_variant_wrong_approval_hash_v1', target_variant_id,
      'instagram', jsonb_set(payload, '{approvalSnapshotSha256}',
        to_jsonb(wrong_approval_hash)), wrong_approval_hash,
      'success', 'completed', attempts, receipt, 'real_owner'
    );
    raise exception 'momo_real_variant_wrong_approval_hash_was_accepted';
  exception when sqlstate '23503' then
    null;
  end;

  mismatch_payload := jsonb_set(
    jsonb_set(payload, '{media,0,renditionId}',
      to_jsonb(current_setting('veroxa.test.real_alternate_rendition_id'))),
    '{media,0,contentSha256}',
    to_jsonb(current_setting('veroxa.test.real_alternate_rendition_hash'))
  );
  begin
    perform public.veroxa_record_momo_publication_rehearsal_v1(
      target_restaurant_id, 'rr_real_variant_media_placement_mismatch_v1', target_variant_id,
      'instagram', mismatch_payload, approval_hash,
      'success', 'completed', attempts, receipt, 'real_owner'
    );
    raise exception 'momo_real_variant_unplaced_media_was_accepted';
  exception when sqlstate '23503' then
    null;
  end;

  perform set_config('veroxa.test.real_publication_payload', payload::text, true);
end $$;

reset role;

-- Changing the canonical calendar makes the stored approval stale even when
-- the publication payload is updated to match the now-current schedule.
do $$
declare
  target_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  target_variant_id uuid := current_setting('veroxa.test.real_variant_id')::uuid;
  stale_schedule text := '2030-01-04T18:00:00.000Z';
  current_hash text;
begin
  update public.veroxa_content_calendar calendar
  set scheduled_for = stale_schedule::timestamptz
  where calendar.variant_id = target_variant_id
    and calendar.restaurant_id = target_restaurant_id;
  current_hash := veroxa_private.confirmation_snapshot_sha256_v1(
    veroxa_private.approval_subject_snapshot_v1(
      target_restaurant_id, 'content_variant', target_variant_id
    )
  );
  if current_hash = current_setting('veroxa.test.real_approval_hash') then
    raise exception 'momo_real_variant_snapshot_hash_did_not_change';
  end if;
  perform set_config('veroxa.test.real_stale_schedule', stale_schedule, true);
end $$;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  payload jsonb := current_setting('veroxa.test.real_publication_payload')::jsonb;
  attempts jsonb := '[{"number":1,"state":"succeeded","code":"simulated_acceptance","nextAttemptAfterSeconds":null}]'::jsonb;
  receipt jsonb := '{"channel":"instagram","accepted":true,"externalId":null,"published":false,"readbackVerified":false}'::jsonb;
begin
  payload := jsonb_set(
    payload, '{scheduledFor}', to_jsonb(current_setting('veroxa.test.real_stale_schedule'))
  );
  begin
    perform public.veroxa_record_momo_publication_rehearsal_v1(
      current_setting('veroxa.test.restaurant_id')::uuid,
      'rr_real_variant_stale_approval_v1',
      current_setting('veroxa.test.real_variant_id')::uuid,
      'instagram', payload, current_setting('veroxa.test.real_approval_hash'),
      'success', 'completed', attempts, receipt, 'real_owner'
    );
    raise exception 'momo_real_variant_stale_approval_was_accepted';
  exception when sqlstate '23503' then
    null;
  end;
end $$;

reset role;

-- Restore the exact approved schedule so the positive real-variant rehearsal
-- remains current when the full preconnection gate runs below.
do $$
declare
  target_restaurant_id uuid := current_setting('veroxa.test.restaurant_id')::uuid;
  target_variant_id uuid := current_setting('veroxa.test.real_variant_id')::uuid;
  restored_hash text;
begin
  update public.veroxa_content_calendar calendar
  set scheduled_for = '2030-01-02T18:00:00.000Z'::timestamptz
  where calendar.variant_id = target_variant_id
    and calendar.restaurant_id = target_restaurant_id;
  restored_hash := veroxa_private.confirmation_snapshot_sha256_v1(
    veroxa_private.approval_subject_snapshot_v1(
      target_restaurant_id, 'content_variant', target_variant_id
    )
  );
  if restored_hash is distinct from current_setting('veroxa.test.real_approval_hash') then
    raise exception 'momo_real_variant_approval_snapshot_not_restored';
  end if;
end $$;

-- A rollback-only release attestation ties the gate to the exact categories
-- exercised by this suite. It never survives and never enables activation.
do $$
declare release_id uuid;
begin
  insert into public.veroxa_momo_release_attestations (
    restaurant_id, release_key, commit_sha256, client_artifact_sha256,
    test_suite_sha256, test_count, checks, status, verifier, verified_at
  ) values (
    current_setting('veroxa.test.restaurant_id')::uuid,
    'momo-rr-rollback-suite-v1', repeat('a', 64), repeat('b', 64), repeat('c', 64),
    100,
    jsonb_build_object(
      'clientBundleIsolated', true,
      'clientSnapshotAllowlisted', true,
      'migrationRlsTests', true,
      'storageReadbackTests', true,
      'mediaPlacementTests', true,
      'aiContractTests', true,
      'publicationAdapterTests', true,
      'metricsContractTests', true,
      'workLifecycleTests', true,
      'scheduleDenialTests', true,
      'consentContractTests', true,
      'evidenceRegistryParity', true,
      'ownerHandoffTests', true
    ),
    'passed', 'codex_release_runner', now()
  ) returning id into release_id;
  perform set_config('veroxa.test.release_attestation_id', release_id::text, true);
end $$;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

-- With all provider-disconnected contracts present, the server may allow the
-- Team to request owner access, but activation must remain impossible.
do $$
declare gate_record record;
begin
  select * into gate_record
  from public.veroxa_run_momo_preconnection_gate_v1(
    current_setting('veroxa.test.restaurant_id')::uuid
  );
  if gate_record.status <> 'pass'
    or not gate_record.can_request_owner_access
    or gate_record.can_activate
    or jsonb_array_length(gate_record.blockers) <> 0 then
    raise exception 'momo_preconnection_gate_did_not_pass_disconnected_readiness:%', gate_record.blockers;
  end if;
end $$;

reset role;

-- Mutating one attested release check must immediately return the gate to a
-- blocked state. This proves the pass is derived, fail-closed, and reversible.
update public.veroxa_momo_release_attestations
set checks = jsonb_set(checks, '{clientBundleIsolated}', 'false'::jsonb)
where id = current_setting('veroxa.test.release_attestation_id')::uuid;

select set_config('request.jwt.claim.sub', current_setting('veroxa.test.team_id'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare gate_record record;
begin
  select * into gate_record
  from public.veroxa_run_momo_preconnection_gate_v1(
    current_setting('veroxa.test.restaurant_id')::uuid
  );
  if gate_record.status <> 'blocked'
    or gate_record.can_request_owner_access
    or gate_record.can_activate
    or not gate_record.blockers @> '["clientBundleIsolated"]'::jsonb then
    raise exception 'momo_preconnection_gate_negative_mutation_did_not_fail_closed';
  end if;
end $$;

reset role;

rollback;

select jsonb_build_object(
  'suite', 'momo_preconnection_integration',
  'status', 'passed',
  'externalWrites', false,
  'rolledBackBySuite', true
) as result;
