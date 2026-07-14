-- Run after all migrations against a disposable/local Supabase database.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select lives_ok($catalog$
do $$
declare
  v_function text;
begin
  if to_regclass('veroxa_private.ai_audit_budget_config') is null
     or to_regclass('veroxa_private.ai_audit_usage_ledger') is null
     or to_regclass('public.veroxa_client_requests') is null
     or to_regclass('public.veroxa_request_messages') is null then
    raise exception 'production reconciliation tables are incomplete';
  end if;
  if has_table_privilege('service_role',
       'veroxa_private.ai_audit_budget_config', 'select')
     or has_table_privilege('service_role',
       'veroxa_private.ai_audit_usage_ledger', 'select')
     or has_table_privilege('authenticated',
       'public.veroxa_client_requests', 'select')
     or has_table_privilege('authenticated',
       'public.veroxa_request_messages', 'select') then
    raise exception 'private ledger or request tables have direct browser/server exposure';
  end if;
  if not has_function_privilege('service_role',
       'public.reserve_team_ai_audit_budget_v1(text,text,jsonb,text,text,bigint,integer,integer)',
       'execute')
     or not has_function_privilege('service_role',
       'public.finalize_team_ai_audit_budget_v1(uuid,text,text,text,bigint,text,jsonb,jsonb,jsonb)',
       'execute')
     or has_function_privilege('authenticated',
       'public.reserve_team_ai_audit_budget_v1(text,text,jsonb,text,text,bigint,integer,integer)',
       'execute')
     or has_function_privilege('anon',
       'public.finalize_team_ai_audit_budget_v1(uuid,text,text,text,bigint,text,jsonb,jsonb,jsonb)',
       'execute') then
    raise exception 'AI budget RPC grants are not service-role only';
  end if;
  if exists (
    select 1 from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in ('veroxa_client_requests','veroxa_request_messages')
      and (not relation.relrowsecurity or not relation.relforcerowsecurity)
  ) then
    raise exception 'request tables do not force RLS';
  end if;
  foreach v_function in array array[
    'public.reserve_team_ai_audit_budget_v1(text,text,jsonb,text,text,bigint,integer,integer)',
    'public.finalize_team_ai_audit_budget_v1(uuid,text,text,text,bigint,text,jsonb,jsonb,jsonb)',
    'public.veroxa_create_client_request_v1(uuid,text,text,text,text,text)',
    'public.veroxa_append_request_message_v1(uuid,text,text)',
    'public.veroxa_transition_client_request_v1(uuid,text,text,text)',
    'public.veroxa_create_client_request_work_v1(uuid,text,text,text,integer,text,text,uuid,timestamp with time zone)',
    'public.veroxa_list_client_requests_v1(uuid,timestamp with time zone,integer)',
    'public.veroxa_request_thread_v1(uuid,timestamp with time zone,integer)',
    'public.veroxa_momo_manual_pilot_gate_v1(uuid)'
  ] loop
    if not exists (
      select 1 from pg_proc procedure
      where procedure.oid = to_regprocedure(v_function)
        and procedure.prosecdef
        and 'search_path=""' = any(coalesce(procedure.proconfig, '{}'::text[]))
    ) then
      raise exception 'missing fail-closed SECURITY DEFINER function: %', v_function;
    end if;
  end loop;
  foreach v_function in array array[
    'public.save_team_generated_audit_v2(text,text,text,text,text,jsonb,jsonb,text,text,text,text)',
    'public.complete_team_generated_audit_run_v2(uuid,jsonb,jsonb,text,text,text)',
    'public.save_team_generated_audit_rerun_v2(uuid,uuid,jsonb,jsonb,text,text,text,text)'
  ] loop
    if position(
      'validate_ai_audit_research_binding_v1'
      in pg_get_functiondef(to_regprocedure(v_function))
    ) = 0 then
      raise exception 'audit save RPC bypasses research binding: %', v_function;
    end if;
  end loop;
  if not exists (
    select 1 from veroxa_private.ai_audit_budget_config config
    where config.singleton and not config.enabled
      and config.daily_budget_microusd = 0 and config.daily_request_limit = 0
  ) then
    raise exception 'AI budget is not disabled by default';
  end if;
  if exists (
    select 1 from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = any(array[
        'enforce_post_lock','enforce_weekly_report_snapshot',
        'enforce_monthly_report_snapshot','enforce_activity_logs_append_only',
        'user_profiles_set_updated_at','set_updated_at'
      ]::text[])
      and 'search_path=pg_catalog, public'
        <> all(coalesce(procedure.proconfig, '{}'::text[]))
  ) then
    raise exception 'one of the six linter functions still has a mutable search path';
  end if;
end $$;
$catalog$, 'catalog, grants, RLS, disabled AI defaults, and search paths are fail closed');

select lives_ok($ai_budget$
do $$
declare
  v_reservation uuid;
  v_repeat uuid;
  v_overage uuid;
  v_status text;
  v_cached jsonb;
  v_idempotency text := repeat('a', 64);
  v_request_hash text := repeat('b', 64);
  v_second_idempotency text := repeat('c', 64);
  v_overage_idempotency text := repeat('f', 64);
  v_overage_request_hash text := repeat('9', 64);
  v_request_snapshot jsonb;
  v_source_snapshot jsonb;
  v_response_snapshot jsonb;
begin
  v_request_snapshot := jsonb_build_object(
    'schemaVersion', 1,
    'targetRequestId', null,
    'restaurantName', 'Constraint Test Restaurant',
    'city', 'Austin',
    'state', 'TX',
    'websiteUrl', '',
    'googleProfileUrl', ''
  );
  v_source_snapshot := jsonb_build_array(
    jsonb_build_object('url','https://audit.example/google','title','Google evidence'),
    jsonb_build_object('url','https://audit.example/website','title','Website evidence'),
    jsonb_build_object('url','https://audit.example/menu','title','Menu evidence'),
    jsonb_build_object('url','https://audit.example/social','title','Social evidence'),
    jsonb_build_object('url','https://audit.example/reviews','title','Review evidence'),
    jsonb_build_object('url','https://audit.example/local','title','Local evidence')
  );
  v_response_snapshot := jsonb_build_object(
    'schemaVersion', 1,
    'targetRequestId', null,
    'restaurantName', 'Constraint Test Restaurant',
    'city', 'Austin',
    'state', 'TX',
    'websiteUrl', null,
    'googleProfileUrl', null,
    'categories', jsonb_build_array(
      jsonb_build_object('key','google_business_profile','evidenceUrl','https://audit.example/google'),
      jsonb_build_object('key','website_experience','evidenceUrl','https://audit.example/website'),
      jsonb_build_object('key','menu_and_ordering','evidenceUrl','https://audit.example/menu'),
      jsonb_build_object('key','social_presence','evidenceUrl','https://audit.example/social'),
      jsonb_build_object('key','reviews_and_trust','evidenceUrl','https://audit.example/reviews'),
      jsonb_build_object('key','local_search_consistency','evidenceUrl','https://audit.example/local')
    )
  );
  execute 'set local role service_role';
  begin
    perform * from public.reserve_team_ai_audit_budget_v1(
      v_idempotency, v_request_hash, v_request_snapshot, 'gpt-5.6-luna',
      'openai-gpt-5.6-luna-web-2026-07-14-v2', 1920200, 4, 2400
    );
    raise exception 'disabled AI budget accepted a reservation';
  exception when object_not_in_prerequisite_state then null;
  end;
  execute 'reset role';

  update veroxa_private.ai_audit_budget_config
  set enabled = true, daily_budget_microusd = 1920200,
      daily_request_limit = 1, updated_at = clock_timestamp(),
      updated_by = 'pgTAP enabled transaction-only fixture'
  where singleton;

  execute 'set local role service_role';
  select reserved.reservation_id, reserved.status
  into v_reservation, v_status
  from public.reserve_team_ai_audit_budget_v1(
    v_idempotency, v_request_hash, v_request_snapshot, 'gpt-5.6-luna',
    'openai-gpt-5.6-luna-web-2026-07-14-v2', 1920200, 4, 2400
  ) reserved;
  if v_reservation is null or v_status <> 'reserved' then
    raise exception 'valid AI budget reservation was not created';
  end if;
  select reserved.reservation_id, reserved.status, reserved.cached_response
  into v_repeat, v_status, v_cached
  from public.reserve_team_ai_audit_budget_v1(
    v_idempotency, v_request_hash, v_request_snapshot, 'gpt-5.6-luna',
    'openai-gpt-5.6-luna-web-2026-07-14-v2', 1920200, 4, 2400
  ) reserved;
  if v_repeat is distinct from v_reservation
     or v_status <> 'in_progress' or v_cached is not null then
    raise exception 'pending AI reservation replay is not fail-closed';
  end if;
  begin
    perform * from public.reserve_team_ai_audit_budget_v1(
      v_second_idempotency, repeat('d', 64), v_request_snapshot, 'gpt-5.6-luna',
      'openai-gpt-5.6-luna-web-2026-07-14-v2', 1920200, 4, 2400
    );
    raise exception 'daily budget accepted a concurrent worst-case overrun';
  exception when program_limit_exceeded then null;
  end;
  begin
    perform * from public.reserve_team_ai_audit_budget_v1(
      v_idempotency, repeat('e', 64), v_request_snapshot, 'gpt-5.6-luna',
      'openai-gpt-5.6-luna-web-2026-07-14-v2', 1920200, 4, 2400
    );
    raise exception 'changed idempotent AI request was accepted';
  exception when unique_violation then null;
  end;
  begin
    perform * from public.reserve_team_ai_audit_budget_v1(
      v_idempotency, v_request_hash,
      jsonb_set(
        v_request_snapshot,
        '{restaurantName}',
        '"Different Restaurant"'::jsonb
      ),
      'gpt-5.6-luna',
      'openai-gpt-5.6-luna-web-2026-07-14-v2', 1920200, 4, 2400
    );
    raise exception 'changed AI target snapshot reused the same reservation';
  exception when unique_violation then null;
  end;

  perform * from public.finalize_team_ai_audit_budget_v1(
    v_reservation, v_idempotency, v_request_hash, 'completed', 1234,
    'resp_pgtap_1', '{"input_tokens":100,"output_tokens":20}'::jsonb,
    v_source_snapshot, v_response_snapshot
  );
  select reserved.status, reserved.cached_response
  into v_status, v_cached
  from public.reserve_team_ai_audit_budget_v1(
    v_idempotency, v_request_hash, v_request_snapshot, 'gpt-5.6-luna',
    'openai-gpt-5.6-luna-web-2026-07-14-v2', 1920200, 4, 2400
  ) reserved;
  if v_status <> 'completed' or v_cached <> v_response_snapshot then
    raise exception 'completed AI response was not returned on exact replay';
  end if;
  perform * from public.finalize_team_ai_audit_budget_v1(
    v_reservation, v_idempotency, v_request_hash, 'completed', 1234,
    'resp_pgtap_1', '{"input_tokens":100,"output_tokens":20}'::jsonb,
    v_source_snapshot, v_response_snapshot
  );
  begin
    perform * from public.finalize_team_ai_audit_budget_v1(
      v_reservation, v_idempotency, v_request_hash, 'completed', 1235,
      'resp_pgtap_1', '{"input_tokens":100,"output_tokens":20}'::jsonb,
      v_source_snapshot, v_response_snapshot
    );
    raise exception 'changed finalization replay was accepted';
  exception when unique_violation then null;
  end;
  execute 'reset role';

  update veroxa_private.ai_audit_budget_config
  set daily_budget_microusd = 3840400, daily_request_limit = 2,
      updated_at = clock_timestamp(),
      updated_by = 'pgTAP failure finalization fixture'
  where singleton;
  execute 'set local role service_role';
  select reserved.reservation_id into v_repeat
  from public.reserve_team_ai_audit_budget_v1(
    v_second_idempotency, repeat('d', 64), v_request_snapshot, 'gpt-5.6-luna',
    'openai-gpt-5.6-luna-web-2026-07-14-v2', 1920200, 4, 2400
  ) reserved;
  perform * from public.finalize_team_ai_audit_budget_v1(
    v_repeat, v_second_idempotency, repeat('d', 64),
    'failed_provider', 1920200, null, null, '[]'::jsonb, null
  );
  execute 'reset role';

  update veroxa_private.ai_audit_budget_config
  set daily_budget_microusd = 5760600, daily_request_limit = 3,
      updated_at = clock_timestamp(),
      updated_by = 'pgTAP bounded overage finalization fixture'
  where singleton;
  execute 'set local role service_role';
  select reserved.reservation_id into v_overage
  from public.reserve_team_ai_audit_budget_v1(
    v_overage_idempotency, v_overage_request_hash, v_request_snapshot, 'gpt-5.6-luna',
    'openai-gpt-5.6-luna-web-2026-07-14-v2', 1920200, 4, 2400
  ) reserved;
  begin
    perform * from public.finalize_team_ai_audit_budget_v1(
      v_overage, v_overage_idempotency, v_overage_request_hash,
      'failed_provider', 2061600, 'resp_pgtap_overage', null,
      '[]'::jsonb, null
    );
    raise exception 'over-budget provider failure was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform * from public.finalize_team_ai_audit_budget_v1(
      v_overage, v_overage_idempotency, v_overage_request_hash,
      'failed_output', 1000000001, 'resp_pgtap_overage',
      '{"inputTokens":1000000001,"outputTokens":0,"totalTokens":1000000001,"webSearchCalls":4}'::jsonb,
      '[{"url":"https://evidence.example/overage"}]'::jsonb, null
    );
    raise exception 'failed output above the absolute ledger ceiling was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform * from public.finalize_team_ai_audit_budget_v1(
      v_overage, v_overage_idempotency, v_overage_request_hash,
      'completed', 2061600, 'resp_pgtap_overage',
      '{"inputTokens":1000000,"outputTokens":2400,"totalTokens":1002400,"webSearchCalls":4}'::jsonb,
      '[{"url":"https://evidence.example/overage"}]'::jsonb,
      '{"audit":"must-not-release"}'::jsonb
    );
    raise exception 'over-budget completed output was accepted';
  exception when invalid_parameter_value then null;
  end;
  perform * from public.finalize_team_ai_audit_budget_v1(
    v_overage, v_overage_idempotency, v_overage_request_hash,
    'failed_output', 2061600, 'resp_pgtap_overage',
    '{"inputTokens":1000000,"outputTokens":2400,"totalTokens":1002400,"webSearchCalls":4}'::jsonb,
    '[{"url":"https://evidence.example/overage"}]'::jsonb, null
  );
  execute 'reset role';
  if not exists (
    select 1 from veroxa_private.ai_audit_usage_ledger ledger
    where ledger.id = v_overage and ledger.status = 'failed_output'
      and ledger.actual_microusd = 2061600 and ledger.finalized_at is not null
  ) then
    raise exception 'bounded provider overage stranded its reservation';
  end if;
exception when others then
  execute 'reset role';
  raise;
end $$;
$ai_budget$, 'AI reservation replay, caps, completion, failure, and bounded overage finalization are enforced');

select lives_ok($audit_v3$
do $$
declare
  v_research_id uuid;
  v_snapshot jsonb;
  v_audit_restaurant_id uuid;
  v_audit_request_id uuid;
  v_other_restaurant_id uuid;
  v_other_request_id uuid;
begin
  select ledger.id into v_research_id
  from veroxa_private.ai_audit_usage_ledger ledger
  where ledger.idempotency_hash = repeat('a', 64)
    and ledger.status = 'completed';
  if v_research_id is null then
    raise exception 'completed research fixture is missing';
  end if;

  v_snapshot := jsonb_build_object(
    'engineVersion','restaurant-audit-v3', 'schemaVersion',3,
    'overallScore',20, 'maxScore',100, 'evidenceCoverage',100,
    'confidence','high',
    'categories',jsonb_build_array(
      jsonb_build_object('key','google_business_profile','label','Google Business Profile','weight',20,'status','confirmed_missing','score',5,'evidenceUrl','https://audit.example/google','note','Verified profile weakness.'),
      jsonb_build_object('key','website_experience','label','Website Experience','weight',15,'status','confirmed_missing','score',5,'evidenceUrl','https://audit.example/website','note','Verified website weakness.'),
      jsonb_build_object('key','menu_and_ordering','label','Menu and Ordering Paths','weight',20,'status','confirmed_missing','score',0,'evidenceUrl','https://audit.example/menu','note','Verified menu weakness.'),
      jsonb_build_object('key','social_presence','label','Social Presence','weight',15,'status','confirmed_missing','score',0,'evidenceUrl','https://audit.example/social','note','Verified social weakness.'),
      jsonb_build_object('key','reviews_and_trust','label','Reviews and Trust','weight',15,'status','confirmed_missing','score',10,'evidenceUrl','https://audit.example/reviews','note','Verified review weakness.'),
      jsonb_build_object('key','local_search_consistency','label','Local Search Consistency','weight',15,'status','confirmed_missing','score',0,'evidenceUrl','https://audit.example/local','note','Verified local weakness.')
    ),
    'improvementAreas',jsonb_build_array(
      jsonb_build_object('key','menu_and_ordering','label','Menu and Ordering Paths','kind','confirmed_gap','priority','high','potentialPoints',20,'summary','A material menu, ordering, hours, or service-path gap was confirmed.','recommendedAction','Verify the restaurant-owned menu and ordering details, then prepare a clear path correction for review.'),
      jsonb_build_object('key','google_business_profile','label','Google Business Profile','kind','confirmed_gap','priority','high','potentialPoints',15,'summary','A material Google Business Profile gap was confirmed in the reviewed signals.','recommendedAction','Prepare the confirmed profile details, hours, primary links, and current photo needs for Team review before any external change.'),
      jsonb_build_object('key','social_presence','label','Social Presence','kind','confirmed_gap','priority','medium','potentialPoints',15,'summary','A material social-profile clarity, consistency, or freshness gap was confirmed.','recommendedAction','Prepare a reviewed social-profile consistency and content-rhythm correction without publishing automatically.'),
      jsonb_build_object('key','local_search_consistency','label','Local Search Consistency','kind','confirmed_gap','priority','medium','potentialPoints',15,'summary','A material local identity, location wording, or directions-path gap was confirmed.','recommendedAction','Verify name, address, phone, location wording, and directions evidence before preparing consistency corrections.'),
      jsonb_build_object('key','website_experience','label','Website Experience','kind','confirmed_gap','priority','medium','potentialPoints',10,'summary','A material website availability, usability, or contact-path gap was confirmed.','recommendedAction','Document the confirmed website gap and prepare the smallest accurate correction for review.'),
      jsonb_build_object('key','reviews_and_trust','label','Reviews and Trust','kind','confirmed_gap','priority','medium','potentialPoints',5,'summary','A material review visibility, response, or trust-signal gap was confirmed.','recommendedAction','Document the verified review gap and prepare a human-reviewed response or trust-maintenance workflow.')
    ),
    'fixFirst',jsonb_build_array(
      jsonb_build_object('key','menu_and_ordering','title','Address Menu and Ordering Paths','reason','A material menu, ordering, hours, or service-path gap was confirmed.','action','Verify the restaurant-owned menu and ordering details, then prepare a clear path correction for review.'),
      jsonb_build_object('key','google_business_profile','title','Address Google Business Profile','reason','A material Google Business Profile gap was confirmed in the reviewed signals.','action','Prepare the confirmed profile details, hours, primary links, and current photo needs for Team review before any external change.'),
      jsonb_build_object('key','social_presence','title','Address Social Presence','reason','A material social-profile clarity, consistency, or freshness gap was confirmed.','action','Prepare a reviewed social-profile consistency and content-rhythm correction without publishing automatically.')
    ),
    'plan',jsonb_build_object(
      'days_0_30',jsonb_build_array(
        'Verify the restaurant-owned menu and ordering details, then prepare a clear path correction for review.',
        'Prepare the confirmed profile details, hours, primary links, and current photo needs for Team review before any external change.',
        'Prepare a reviewed social-profile consistency and content-rhythm correction without publishing automatically.',
        'Verify name, address, phone, location wording, and directions evidence before preparing consistency corrections.',
        'Document the confirmed website gap and prepare the smallest accurate correction for review.',
        'Document the verified review gap and prepare a human-reviewed response or trust-maintenance workflow.'
      ),
      'days_31_60',jsonb_build_array(
        'Test the approved menu and ordering paths again and record any remaining dead ends or unclear choices.',
        'Recheck the Google profile for approved detail consistency, working links, and current visual evidence.',
        'Recheck profile identity and the approved content rhythm using dated evidence rather than assumed performance.',
        'Recheck approved local information across the reviewed public sources and document any mismatch.',
        'Recheck mobile usability and the menu, order, contact, and direction paths after approved corrections.',
        'Recheck review freshness and response coverage while keeping sensitive language under human review.'
      ),
      'days_61_90',jsonb_build_array(
        'Compare menu and ordering access with the baseline and keep only current, verified actions in the plan.',
        'Compare the Google profile with the baseline audit and retain only evidence-backed follow-up priorities.',
        'Compare social consistency with the baseline and refine the plan only from observed, documented signals.',
        'Compare local-search consistency with the baseline and keep recommendations limited to verified evidence.',
        'Compare website clarity with the baseline and prioritize only verified remaining friction.',
        'Compare review and trust signals with the baseline without claiming causation or guaranteed results.'
      )
    ),
    'generatedAt','2026-07-14T12:00:00.000Z',
    'honestyNote','This is a provisional online-presence assessment based only on cited public evidence and Team-reviewed signals. Scores may be partial when a system exists but has verified weaknesses. It does not guarantee rankings, customers, orders, revenue, profit, ROI, or any other outcome. Unknown signals require verification before the audit is treated as complete.',
    'researchRef',jsonb_build_object(
      'researchId',v_research_id, 'requestHash',repeat('b',64),
      'model','gpt-5.6-luna',
      'pricingVersion','openai-gpt-5.6-luna-web-2026-07-14-v2'
    )
  );
  if jsonb_array_length(v_snapshot -> 'improvementAreas') <> 6
     or jsonb_array_length(v_snapshot -> 'fixFirst') <> 3
     or jsonb_array_length(v_snapshot #> '{plan,days_0_30}') <> 6 then
    raise exception 'six-improvement / three-priority fixture is malformed';
  end if;
  perform private.validate_generated_audit_v2(
    v_snapshot, '[]'::jsonb,
    'All six unresolved categories remain visible in this provisional V3 audit.',
    'Prioritize the top three first while preserving the complete evidence-backed plan.',
    'audit-v3-six-improvement-key-0001'
  );
  perform private.validate_ai_audit_research_binding_v1(
    v_snapshot, null, 'Constraint Test Restaurant', 'Austin', 'TX', '', ''
  );
  begin
    perform private.validate_ai_audit_research_binding_v1(
      jsonb_set(
        v_snapshot,
        '{categories,0,evidenceUrl}',
        '"https://unattested.example/injected"'::jsonb
      ),
      null, 'Constraint Test Restaurant', 'Austin', 'TX', '', ''
    );
    raise exception 'audit accepted an evidence URL absent from its research ledger';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_ai_audit_research_binding_v1(
      v_snapshot, null, 'Different Restaurant', 'Austin', 'TX', '', ''
    );
    raise exception 'audit research was reused for a different restaurant identity';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(v_snapshot, '{researchRef,requestHash}', to_jsonb(repeat('f',64))),
      '[]'::jsonb,
      'A mismatched research reference must never validate against the private ledger.',
      'The saved audit must retain exact server-attested provenance from its research reservation.',
      'audit-v3-invalid-research-key-001'
    );
    raise exception 'mismatched research reference was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(v_snapshot, '{researchRef,extra}', 'true'::jsonb),
      '[]'::jsonb,
      'An extended research reference must be rejected instead of accepting browser-owned keys.',
      'The optional research reference uses one exact server-owned four-key contract.',
      'audit-v3-invalid-research-key-002'
    );
    raise exception 'research reference with extra key was accepted';
  exception when invalid_parameter_value then null;
  end;

  insert into public.audit_restaurants (
    restaurant_name, normalized_name, city, normalized_city,
    state, normalized_state, website_url, source
  ) values (
    'Constraint Test Restaurant','constraint test restaurant',
    'Austin','austin','TX','tx','https://audit.example/?b=2&a=1','team'
  ) returning id into v_audit_restaurant_id;
  insert into public.audit_requests (
    reference_code, audit_restaurant_id, source, status
  ) values (
    'VXA-V3-CONSTRAINT-TEST', v_audit_restaurant_id, 'team', 'new'
  ) returning id into v_audit_request_id;
  insert into public.audit_runs (
    audit_request_id, run_number, generator_version
  ) values (v_audit_request_id, 1, 'restaurant-audit-v3');
  -- Rebind the transaction-only fixture as an existing-request research run.
  -- Its persisted URL intentionally differs only by canonical formatting;
  -- the immutable request UUID plus exact name/city/state remain authoritative.
  update veroxa_private.ai_audit_usage_ledger ledger
  set request_snapshot = jsonb_set(
        jsonb_set(ledger.request_snapshot, '{targetRequestId}',
          to_jsonb(v_audit_request_id::text)),
        '{websiteUrl}', '"https://audit.example/?a=1&b=2"'::jsonb
      ),
      response_snapshot = jsonb_set(
        jsonb_set(ledger.response_snapshot, '{targetRequestId}',
          to_jsonb(v_audit_request_id::text)),
        '{websiteUrl}', '"https://audit.example/?a=1&b=2"'::jsonb
      )
  where ledger.id = v_research_id;
  perform private.validate_ai_audit_research_binding_v1(
    v_snapshot, v_audit_request_id, null, null, null, null, null
  );
  insert into public.audit_restaurants (
    restaurant_name, normalized_name, city, normalized_city,
    state, normalized_state, source
  ) values (
    'Other Restaurant','other restaurant',
    'Dallas','dallas','TX','tx','team'
  ) returning id into v_other_restaurant_id;
  insert into public.audit_requests (
    reference_code, audit_restaurant_id, source, status
  ) values (
    'VXA-V3-CROSS-TARGET-TEST', v_other_restaurant_id, 'team', 'new'
  ) returning id into v_other_request_id;
  begin
    perform private.validate_ai_audit_research_binding_v1(
      v_snapshot, v_other_request_id, null, null, null, null, null
    );
    raise exception 'new-target research was reused for another restaurant request';
  exception when invalid_parameter_value then null;
  end;
  begin
    insert into public.audit_runs (
      audit_request_id, run_number, generator_version
    ) values (v_audit_request_id, 2, 'restaurant-audit-v4');
    raise exception 'unknown generator version was accepted';
  exception when check_violation then null;
  end;
end $$;
$audit_v3$, 'V3 accepts six unresolved improvements, keeps three fixFirst, links research, and rejects unknown generators');

select lives_ok($requests$
do $$
declare
  v_restaurant_id uuid := '20000000-0000-0000-0000-000000000131';
  v_team_id uuid := '10000000-0000-0000-0000-000000000131';
  v_client_id uuid := '10000000-0000-0000-0000-000000000132';
  v_request_id uuid;
  v_repeat_id uuid;
  v_work_id uuid;
  v_work_repeat_id uuid;
  v_team_message_id uuid;
  v_team_message_repeat_id uuid;
  v_work_due timestamptz := now() + interval '1 day';
  v_replay_status text;
  v_transition_status text;
  v_requests jsonb;
  v_thread jsonb;
begin
  insert into public.veroxa_restaurants (id, name, city, state, status)
  values (v_restaurant_id, 'Momo Manual Pilot Contract Test',
    'San Antonio', 'TX', 'active');
  insert into veroxa_private.operational_restaurant_scope (
    scope_key, restaurant_id, enabled
  ) values ('momo_house_san_antonio', v_restaurant_id, true);
  insert into veroxa_private.auth_identity_allowlist (
    email, role, display_name, restaurant_id, enabled
  ) values
    ('reconcile-team@veroxa.invalid','team','Reconcile Team',v_restaurant_id,true),
    ('reconcile-client@veroxa.invalid','client','Reconcile Client',v_restaurant_id,true);
  insert into auth.users (
    id, instance_id, aud, role, email, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_team_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
      'reconcile-team@veroxa.invalid',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
    (v_client_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
      'reconcile-client@veroxa.invalid',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now());

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub',v_client_id::text,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  select created.request_id into v_request_id
  from public.veroxa_create_client_request_v1(
    v_restaurant_id, 'content', 'Review the visual pilot',
    'Please prepare the private visual workflow without publishing anything.',
    'normal', 'client-request-pgtap-0001'
  ) created;
  select created.request_id into v_repeat_id
  from public.veroxa_create_client_request_v1(
    v_restaurant_id, 'content', 'Review the visual pilot',
    'Please prepare the private visual workflow without publishing anything.',
    'normal', 'client-request-pgtap-0001'
  ) created;
  if v_repeat_id is distinct from v_request_id then
    raise exception 'client request replay is not idempotent';
  end if;
  begin
    perform * from public.veroxa_create_client_request_v1(
      v_restaurant_id, 'content', 'Changed replay title',
      'Please prepare the private visual workflow without publishing anything.',
      'normal', 'client-request-pgtap-0001'
    );
    raise exception 'changed client request replay was accepted';
  exception when unique_violation then null;
  end;
  perform * from public.veroxa_append_request_message_v1(
    v_request_id, 'Client-owned request message.',
    'client-message-pgtap-0001'
  );
  v_requests := public.veroxa_list_client_requests_v1(
    v_restaurant_id, null, 25);
  if jsonb_array_length(v_requests) <> 1 then
    raise exception 'bounded Client request list did not return its own request';
  end if;
  begin
    perform public.veroxa_list_client_requests_v1(
      v_restaurant_id, null, null
    );
    raise exception 'NULL request-list limit bypassed the bounded contract';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.veroxa_request_thread_v1(v_request_id, null, null);
    raise exception 'NULL request-thread limit bypassed the bounded contract';
  exception when insufficient_privilege then null;
  end;
  perform * from public.veroxa_create_client_request_v1(
    v_restaurant_id, 'content', E'AAA\nBBB', 'CCC',
    'normal', 'client-request-delimiter-pgtap-0001'
  );
  begin
    perform * from public.veroxa_create_client_request_v1(
      v_restaurant_id, 'content', 'AAA', E'BBB\nCCC',
      'normal', 'client-request-delimiter-pgtap-0001'
    );
    raise exception 'delimiter-shifted client request reused the same payload hash';
  exception when unique_violation then null;
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub',v_team_id::text,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  select appended.message_id into v_team_message_id
  from public.veroxa_append_request_message_v1(
    v_request_id, 'Team acknowledgement without external action.',
    'team-message-pgtap-000001'
  ) appended;
  perform * from public.veroxa_transition_client_request_v1(
    v_request_id, 'acknowledged', 'Team acknowledged this private request.',
    'team-transition-pgtap-0001'
  );
  perform * from public.veroxa_transition_client_request_v1(
    v_request_id, 'in_progress', 'Team began the no-publish visual review.',
    'team-transition-pgtap-0002'
  );
  begin
    insert into public.veroxa_work_items (
      restaurant_id, work_type, title, description, priority, status,
      created_by, client_request_id
    ) values (
      v_restaurant_id, 'content', 'Bypass linked-work RPC',
      'This browser-shaped direct insert must be rejected.', 3, 'queued',
      v_team_id, v_request_id
    );
    raise exception 'direct request-linked work insert bypassed the RPC';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.veroxa_create_client_request_work_v1(
      v_request_id, 'content', 'Normalized subject pairing fixture',
      'Whitespace-only subject types cannot pair with a subject ID.', 3,
      'team-work-subject-pgtap-0001', '   ', gen_random_uuid(), v_work_due
    );
    raise exception 'whitespace subject type bypassed normalized subject pairing';
  exception when invalid_parameter_value then null;
  end;
  perform public.veroxa_create_client_request_work_v1(
    v_request_id, 'content', E'AAA\nBBB', 'CCC', 3,
    'team-work-delimiter-pgtap-0001', null, null, null
  );
  begin
    perform public.veroxa_create_client_request_work_v1(
      v_request_id, 'content', 'AAA', E'BBB\nCCC', 3,
      'team-work-delimiter-pgtap-0001', null, null, null
    );
    raise exception 'delimiter-shifted linked work reused the same payload hash';
  exception when unique_violation then null;
  end;
  v_work_id := public.veroxa_create_client_request_work_v1(
    v_request_id, 'content', 'Prepare visual review fixture',
    'Private review work only; no Momo contact or publication.', 3,
    'team-work-pgtap-0000001', null, null, v_work_due
  );
  if v_work_id is null or not exists (
    select 1 from public.veroxa_work_items work
    where work.id = v_work_id and work.client_request_id = v_request_id
      and work.status = 'queued'
  ) then
    raise exception 'request-linked work item was not persisted';
  end if;
  v_work_repeat_id := public.veroxa_create_client_request_work_v1(
    v_request_id, 'content', 'Prepare visual review fixture',
    'Private review work only; no Momo contact or publication.', 3,
    'team-work-pgtap-0000001', null, null, v_work_due
  );
  if v_work_repeat_id is distinct from v_work_id then
    raise exception 'request-linked work exact replay was not idempotent';
  end if;
  begin
    perform public.veroxa_create_client_request_work_v1(
      v_request_id, 'content', 'Changed visual review fixture',
      'Private review work only; no Momo contact or publication.', 3,
      'team-work-pgtap-0000001', null, null, v_work_due
    );
    raise exception 'changed request-linked work replay was accepted';
  exception when unique_violation then null;
  end;
  v_thread := public.veroxa_request_thread_v1(v_request_id, null, 50);
  if jsonb_array_length(v_thread) <> 4 then
    raise exception 'bounded request thread omitted an append-only event';
  end if;
  perform * from public.veroxa_transition_client_request_v1(
    v_request_id, 'completed',
    'Team completed only the private visual review fixture.',
    'team-transition-pgtap-0003'
  );
  execute 'reset role';
  update public.veroxa_work_items work
  set due_at = clock_timestamp() - interval '1 day'
  where work.id = v_work_id;
  execute 'set local role authenticated';
  select transitioned.status into v_transition_status
  from public.veroxa_transition_client_request_v1(
    v_request_id, 'acknowledged', 'Team acknowledged this private request.',
    'team-transition-pgtap-0001'
  ) transitioned;
  if v_transition_status <> 'acknowledged' then
    raise exception 'transition replay did not return its recorded target';
  end if;
  v_work_repeat_id := public.veroxa_create_client_request_work_v1(
    v_request_id, 'content', 'Prepare visual review fixture',
    'Private review work only; no Momo contact or publication.', 3,
    'team-work-pgtap-0000001', null, null, v_work_due
  );
  if v_work_repeat_id is distinct from v_work_id then
    raise exception 'closed request or elapsed due time invalidated an exact linked-work replay';
  end if;
  select appended.message_id into v_team_message_repeat_id
  from public.veroxa_append_request_message_v1(
    v_request_id, 'Team acknowledgement without external action.',
    'team-message-pgtap-000001'
  ) appended;
  if v_team_message_repeat_id is distinct from v_team_message_id then
    raise exception 'closed request invalidated an exact message replay';
  end if;
  begin
    perform * from public.veroxa_append_request_message_v1(
      v_request_id, 'A new message must not reopen the closed request.',
      'team-message-pgtap-closed-0001'
    );
    raise exception 'closed request accepted a new private message';
  exception when object_not_in_prerequisite_state then null;
  end;
  v_thread := public.veroxa_request_thread_v1(v_request_id, null, 50);
  if jsonb_array_length(v_thread) <> 5 then
    raise exception 'closed request replay changed its append-only thread';
  end if;
  execute 'reset role';

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub',v_client_id::text,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  select created.request_id, created.status
  into v_repeat_id, v_replay_status
  from public.veroxa_create_client_request_v1(
    v_restaurant_id, 'content', 'Review the visual pilot',
    'Please prepare the private visual workflow without publishing anything.',
    'normal', 'client-request-pgtap-0001'
  ) created;
  if v_repeat_id is distinct from v_request_id
     or v_replay_status <> 'completed' then
    raise exception 'request replay did not return its current persisted status';
  end if;
  execute 'reset role';
exception when others then
  execute 'reset role';
  raise;
end $$;
$requests$, 'Client request/message persistence is bounded, idempotent, tenant-checked, and linked to Team work');

select lives_ok($momo_gate$
do $$
declare
  v_restaurant_id uuid := '20000000-0000-0000-0000-000000000131';
  v_team_id uuid := '10000000-0000-0000-0000-000000000131';
  v_status text;
  v_can_review boolean;
  v_required integer;
  v_passed integer;
  v_blockers integer;
begin
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub',v_team_id::text,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  select gate.status, gate.can_review, gate.required_check_count,
    gate.passed_check_count, gate.blocker_count
  into v_status, v_can_review, v_required, v_passed, v_blockers
  from public.veroxa_momo_manual_pilot_gate_v1(v_restaurant_id) gate;
  if v_status <> 'blocked' or v_can_review or v_required <> 7
     or v_passed >= v_required or v_blockers < 1 then
    raise exception 'incomplete Momo fixture did not remain honestly blocked';
  end if;
  if exists (
    select 1 from public.veroxa_readiness_gate_runs run
    where run.restaurant_id = v_restaurant_id
  ) then
    raise exception 'read-only visual gate manufactured an activation/readiness run';
  end if;
  execute 'reset role';
exception when others then
  execute 'reset role';
  raise;
end $$;
$momo_gate$, 'single-owner visual/manual gate stays blocked and creates no synthetic production evidence');

select * from finish();
rollback;
