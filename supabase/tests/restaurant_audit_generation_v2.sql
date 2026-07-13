-- Run after all migrations against a disposable/local Supabase database.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select lives_ok($catalog$
do $$
begin
  if to_regprocedure('public.save_team_generated_audit_v2(text,text,text,text,text,jsonb,jsonb,text,text,text,text)') is null
     or to_regprocedure('public.complete_team_generated_audit_run_v2(uuid,jsonb,jsonb,text,text,text)') is null
     or to_regprocedure('public.save_team_generated_audit_rerun_v2(uuid,uuid,jsonb,jsonb,text,text,text,text)') is null
     or to_regprocedure('public.veroxa_convert_reviewed_audit_to_pending_profile_v1(uuid,text,text,text,text,timestamp with time zone,text)') is null then
    raise exception 'Restaurant Audit V2 RPC surface is incomplete';
  end if;
  if has_function_privilege('anon', 'public.save_team_generated_audit_v2(text,text,text,text,text,jsonb,jsonb,text,text,text,text)', 'execute')
     or has_function_privilege('anon', 'public.complete_team_generated_audit_run_v2(uuid,jsonb,jsonb,text,text,text)', 'execute')
     or has_function_privilege('anon', 'public.save_team_generated_audit_rerun_v2(uuid,uuid,jsonb,jsonb,text,text,text,text)', 'execute')
     or has_function_privilege('anon', 'public.veroxa_convert_reviewed_audit_to_pending_profile_v1(uuid,text,text,text,text,timestamp with time zone,text)', 'execute') then
    raise exception 'anonymous role can execute a Team-only Audit V2 function';
  end if;
  if not has_function_privilege('authenticated', 'public.save_team_generated_audit_v2(text,text,text,text,text,jsonb,jsonb,text,text,text,text)', 'execute')
     or not has_function_privilege('authenticated', 'public.complete_team_generated_audit_run_v2(uuid,jsonb,jsonb,text,text,text)', 'execute')
     or not has_function_privilege('authenticated', 'public.save_team_generated_audit_rerun_v2(uuid,uuid,jsonb,jsonb,text,text,text,text)', 'execute')
     or not has_function_privilege('authenticated', 'public.veroxa_convert_reviewed_audit_to_pending_profile_v1(uuid,text,text,text,text,timestamp with time zone,text)', 'execute') then
    raise exception 'authenticated Team role cannot reach Audit V2 functions';
  end if;
  if to_regclass('veroxa_private.audit_onboarding_conversions') is null then
    raise exception 'private audit onboarding conversion provenance is missing';
  end if;
  if has_table_privilege('authenticated', 'veroxa_private.audit_onboarding_conversions', 'select')
     or has_table_privilege('authenticated', 'veroxa_private.audit_onboarding_conversions', 'insert') then
    raise exception 'private audit onboarding conversion provenance is browser-readable or writable';
  end if;
end $$;
$catalog$, 'Restaurant Audit V2 catalog, grants, and private conversion boundary are valid');

select lives_ok($workflow$
do $$
declare
  v_momo_id uuid := '20000000-0000-0000-0000-000000000021';
  v_team_user_id uuid := '10000000-0000-0000-0000-000000000021';
  v_client_user_id uuid := '10000000-0000-0000-0000-000000000022';
  v_request_id uuid;
  v_run_id uuid;
  v_reference text;
  v_repeat_request_id uuid;
  v_complete_request_id uuid;
  v_complete_run_id uuid;
  v_completed_request_id uuid;
  v_completed_run_id uuid;
  v_repeat_completed_run_id uuid;
  v_rerun_run_id uuid;
  v_repeat_rerun_run_id uuid;
  v_blank_request_id uuid;
  v_blank_run_id uuid;
  v_stale_latest_run_id uuid;
  v_conversion_id uuid;
  v_repeat_conversion_id uuid;
  v_pending_restaurant_id uuid;
  v_before_count bigint;
  v_after_count bigint;
  v_snapshot jsonb := jsonb_build_object(
    'engineVersion', 'restaurant-audit-v2',
    'schemaVersion', 2,
    'overallScore', 50,
    'maxScore', 100,
    'evidenceCoverage', 100,
    'confidence', 'high',
    'categories', jsonb_build_array(
      jsonb_build_object('key','google_business_profile','label','Google Business Profile','weight',20,'status','confirmed_present','score',20,'evidenceUrl','https://audit.example/google','note','Profile reviewed.'),
      jsonb_build_object('key','website_experience','label','Website Experience','weight',15,'status','confirmed_present','score',15,'evidenceUrl','https://audit.example/website','note','Website reviewed.'),
      jsonb_build_object('key','menu_and_ordering','label','Menu and Ordering Paths','weight',20,'status','confirmed_missing','score',0,'evidenceUrl','https://audit.example/menu','note','Menu path needs work.'),
      jsonb_build_object('key','social_presence','label','Social Presence','weight',15,'status','confirmed_present','score',15,'evidenceUrl','https://audit.example/social','note','Social profile reviewed.'),
      jsonb_build_object('key','reviews_and_trust','label','Reviews and Trust','weight',15,'status','confirmed_missing','score',0,'evidenceUrl','https://audit.example/reviews','note','Review response gap confirmed.'),
      jsonb_build_object('key','local_search_consistency','label','Local Search Consistency','weight',15,'status','confirmed_missing','score',0,'evidenceUrl','https://audit.example/local','note','Local details mismatch confirmed.')
    ),
    'improvementAreas', jsonb_build_array(
      jsonb_build_object('key','menu_and_ordering','label','Menu and Ordering Paths','kind','confirmed_gap','priority','high','potentialPoints',20,'summary','A material menu, ordering, hours, or service-path gap was confirmed.','recommendedAction','Verify the restaurant-owned menu and ordering details, then prepare a clear path correction for review.'),
      jsonb_build_object('key','reviews_and_trust','label','Reviews and Trust','kind','confirmed_gap','priority','medium','potentialPoints',15,'summary','A material review visibility, response, or trust-signal gap was confirmed.','recommendedAction','Document the verified review gap and prepare a human-reviewed response or trust-maintenance workflow.'),
      jsonb_build_object('key','local_search_consistency','label','Local Search Consistency','kind','confirmed_gap','priority','medium','potentialPoints',15,'summary','A material local identity, location wording, or directions-path gap was confirmed.','recommendedAction','Verify name, address, phone, location wording, and directions evidence before preparing consistency corrections.')
    ),
    'fixFirst', jsonb_build_array(
      jsonb_build_object('key','menu_and_ordering','title','Address Menu and Ordering Paths','reason','A material menu, ordering, hours, or service-path gap was confirmed.','action','Verify the restaurant-owned menu and ordering details, then prepare a clear path correction for review.'),
      jsonb_build_object('key','reviews_and_trust','title','Address Reviews and Trust','reason','A material review visibility, response, or trust-signal gap was confirmed.','action','Document the verified review gap and prepare a human-reviewed response or trust-maintenance workflow.'),
      jsonb_build_object('key','local_search_consistency','title','Address Local Search Consistency','reason','A material local identity, location wording, or directions-path gap was confirmed.','action','Verify name, address, phone, location wording, and directions evidence before preparing consistency corrections.')
    ),
    'plan', jsonb_build_object(
      'days_0_30', jsonb_build_array(
        'Verify the restaurant-owned menu and ordering details, then prepare a clear path correction for review.',
        'Document the verified review gap and prepare a human-reviewed response or trust-maintenance workflow.',
        'Verify name, address, phone, location wording, and directions evidence before preparing consistency corrections.'
      ),
      'days_31_60', jsonb_build_array(
        'Test the approved menu and ordering paths again and record any remaining dead ends or unclear choices.',
        'Recheck review freshness and response coverage while keeping sensitive language under human review.',
        'Recheck approved local information across the reviewed public sources and document any mismatch.'
      ),
      'days_61_90', jsonb_build_array(
        'Compare menu and ordering access with the baseline and keep only current, verified actions in the plan.',
        'Compare review and trust signals with the baseline without claiming causation or guaranteed results.',
        'Compare local-search consistency with the baseline and keep recommendations limited to verified evidence.'
      )
    ),
    'generatedAt', '2026-07-13T20:00:00.000Z',
    'honestyNote', 'This is a provisional online-presence assessment based only on explicitly confirmed or unknown Team-reviewed signals. It does not guarantee rankings, customers, orders, revenue, profit, ROI, or any other outcome. Unknown signals require verification before the audit is treated as complete.'
  );
  v_findings jsonb := jsonb_build_array(
    jsonb_build_object('category','Menu and Ordering Paths','severity','high','title','Menu path gap confirmed','summary','The reviewed menu path needs work.','evidenceUrl','https://audit.example/menu','evidenceLabel','Menu evidence','recommendedAction','Correct the reviewed menu path.'),
    jsonb_build_object('category','Reviews and Trust','severity','medium','title','Review response gap confirmed','summary','A response coverage gap was confirmed.','evidenceUrl','https://audit.example/reviews','evidenceLabel','Review evidence','recommendedAction','Prepare a reviewed response workflow.'),
    jsonb_build_object('category','Local Search Consistency','severity','medium','title','Local mismatch confirmed','summary','A local information mismatch was confirmed.','evidenceUrl','https://audit.example/local','evidenceLabel','Local evidence','recommendedAction','Correct the verified local mismatch.')
  );
  v_consent text := 'I agree that Veroxa may create a pending restaurant onboarding profile using the reviewed audit information. This does not activate services, connect accounts, authorize publishing, or create charges.';
begin
  insert into public.veroxa_restaurants (id, name, city, state, status)
  values (v_momo_id, 'Momo Audit V2 Test', 'San Antonio', 'TX', 'active');
  insert into veroxa_private.operational_restaurant_scope (scope_key, restaurant_id, enabled)
  values ('momo_house_san_antonio', v_momo_id, true);
  insert into veroxa_private.auth_identity_allowlist (email, role, display_name, restaurant_id, enabled)
  values
    ('audit-v2-team@veroxa.invalid', 'team', 'Audit V2 Team', v_momo_id, true),
    ('audit-v2-client@veroxa.invalid', 'client', 'Audit V2 Client', v_momo_id, true);
  insert into auth.users (
    id, instance_id, aud, role, email, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_team_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'audit-v2-team@veroxa.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_client_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'audit-v2-client@veroxa.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  select count(*) into v_before_count from public.veroxa_restaurants;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select saved.request_id, saved.run_id, saved.reference_code
  into v_request_id, v_run_id, v_reference
  from public.save_team_generated_audit_v2(
    'Audit V2 Restaurant', 'Austin', 'TX', 'https://audit.example',
    'https://audit.example/google', v_snapshot, v_findings,
    'The reviewed sources produce a provisional 50 out of 100 online-presence score.',
    'Correct the verified menu, review-response, and local-consistency gaps across the 30, 60, and 90 day plan.',
    'Generated Audit V2 pgTAP record.', 'audit-v2-save-key-00000001'
  ) saved;

  select saved.request_id into v_repeat_request_id
  from public.save_team_generated_audit_v2(
    'Audit V2 Restaurant', 'Austin', 'TX', 'https://audit.example',
    'https://audit.example/google', v_snapshot, v_findings,
    'The reviewed sources produce a provisional 50 out of 100 online-presence score.',
    'Correct the verified menu, review-response, and local-consistency gaps across the 30, 60, and 90 day plan.',
    'Generated Audit V2 pgTAP record.', 'audit-v2-save-key-00000001'
  ) saved;
  if v_repeat_request_id is distinct from v_request_id then
    raise exception 'generated audit save is not idempotent';
  end if;
  if not exists (
    select 1 from public.audit_runs
    where id = v_run_id and status = 'ready_for_review'
      and generator_version = 'restaurant-audit-v2'
      and score_snapshot ->> 'overallScore' = '50'
  ) or not exists (
    select 1 from public.audit_reports
    where audit_run_id = v_run_id and status = 'ready_for_review'
      and jsonb_array_length(plan_snapshot -> 'days_61_90') = 3
  ) then
    raise exception 'generated score and 30/60/90 report were not persisted atomically';
  end if;

  -- The same caller key is deliberately reused across new, complete, and
  -- rerun operations. Operation/target scoping must prevent a cross-return.
  select created.request_id into v_complete_request_id
  from public.create_team_audit_v1(
    'Generated Completion Target', 'Austin', 'TX', null, null, null, null, null
  ) created;
  select id into v_complete_run_id from public.audit_runs
  where audit_request_id = v_complete_request_id and run_number = 1;
  select completed.request_id, completed.run_id
  into v_completed_request_id, v_completed_run_id
  from public.complete_team_generated_audit_run_v2(
    v_complete_run_id, v_snapshot, v_findings,
    'The completed draft now has a provisional 50 out of 100 online-presence score.',
    'Correct the verified menu, review-response, and local-consistency gaps across the 30, 60, and 90 day plan.',
    'audit-v2-save-key-00000001'
  ) completed;
  if v_completed_request_id is distinct from v_complete_request_id
     or v_completed_run_id is distinct from v_complete_run_id then
    raise exception 'complete RPC reused an idempotency result from another operation';
  end if;
  select completed.run_id into v_repeat_completed_run_id
  from public.complete_team_generated_audit_run_v2(
    v_complete_run_id, v_snapshot, v_findings,
    'The completed draft now has a provisional 50 out of 100 online-presence score.',
    'Correct the verified menu, review-response, and local-consistency gaps across the 30, 60, and 90 day plan.',
    'audit-v2-save-key-00000001'
  ) completed;
  if v_repeat_completed_run_id is distinct from v_complete_run_id then
    raise exception 'complete generated audit RPC is not idempotent';
  end if;

  update public.audit_runs set status = 'reviewed' where id = v_complete_run_id;
  update public.audit_reports set status = 'reviewed' where audit_run_id = v_complete_run_id;
  update public.audit_requests set status = 'reviewed' where id = v_complete_request_id;
  select rerun.run_id into v_rerun_run_id
  from public.save_team_generated_audit_rerun_v2(
    v_complete_request_id, v_complete_run_id, v_snapshot, v_findings,
    'The re-audit retains a provisional 50 out of 100 online-presence score.',
    'Continue the verified 30, 60, and 90 day plan without assuming an outcome.',
    'Compared with the reviewed baseline; the confirmed score is unchanged.',
    'audit-v2-save-key-00000001'
  ) rerun;
  select rerun.run_id into v_repeat_rerun_run_id
  from public.save_team_generated_audit_rerun_v2(
    v_complete_request_id, v_complete_run_id, v_snapshot, v_findings,
    'The re-audit retains a provisional 50 out of 100 online-presence score.',
    'Continue the verified 30, 60, and 90 day plan without assuming an outcome.',
    'Compared with the reviewed baseline; the confirmed score is unchanged.',
    'audit-v2-save-key-00000001'
  ) rerun;
  if v_rerun_run_id is null
     or v_repeat_rerun_run_id is distinct from v_rerun_run_id
     or not exists (
       select 1 from public.audit_runs
       where id = v_rerun_run_id
         and audit_request_id = v_complete_request_id
         and previous_run_id = v_complete_run_id
         and run_number = 2
     )
     or not exists (
       select 1 from public.audit_requests
       where id = v_complete_request_id
         and status = 'ready_for_review'
         and reviewed_by is null
         and reviewed_at is null
     ) then
    raise exception 'rerun RPC idempotency, lineage, or review reset failed';
  end if;
  execute 'reset role';
  select count(*) into v_after_count from public.veroxa_restaurants;
  if v_after_count <> v_before_count then
    raise exception 'saving an audit automatically created a restaurant profile';
  end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform * from public.veroxa_convert_reviewed_audit_to_pending_profile_v1(
      v_request_id, 'audit-onboarding-consent-v1', v_consent, 'written',
      'Owner written agreement reference A-1', now(), 'audit-v2-save-key-00000001'
    );
    raise exception 'unreviewed generated audit was converted';
  exception when object_not_in_prerequisite_state then null;
  end;

  update public.audit_runs set status = 'reviewed' where id = v_run_id;
  update public.audit_reports set status = 'reviewed' where audit_run_id = v_run_id;
  update public.audit_requests set status = 'reviewed' where id = v_request_id;

  select converted.conversion_id, converted.pending_restaurant_id
  into v_conversion_id, v_pending_restaurant_id
  from public.veroxa_convert_reviewed_audit_to_pending_profile_v1(
    v_request_id, 'audit-onboarding-consent-v1', v_consent, 'written',
    'Owner written agreement reference A-1', now(), 'audit-v2-save-key-00000001'
  ) converted;
  select converted.conversion_id into v_repeat_conversion_id
  from public.veroxa_convert_reviewed_audit_to_pending_profile_v1(
    v_request_id, 'audit-onboarding-consent-v1', v_consent, 'written',
    'Owner written agreement reference A-1', now(), 'audit-v2-save-key-00000001'
  ) converted;
  if v_repeat_conversion_id is distinct from v_conversion_id then
    raise exception 'pending-profile conversion is not idempotent';
  end if;
  execute 'reset role';
  if not exists (
    select 1 from public.veroxa_restaurants
    where id = v_pending_restaurant_id and status = 'pending'
  ) or exists (
    select 1 from veroxa_private.operational_restaurant_scope
    where restaurant_id = v_pending_restaurant_id
  ) or exists (
    select 1 from public.veroxa_restaurant_members
    where restaurant_id = v_pending_restaurant_id
  ) or exists (
    select 1 from public.veroxa_work_items
    where restaurant_id = v_pending_restaurant_id
  ) then
    raise exception 'converted profile crossed the pending, non-operational boundary';
  end if;

  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select created.request_id into v_blank_request_id
  from public.create_team_audit_v1(
    'Blank Immutability Target', 'Austin', 'TX', null, null, null, null, null
  ) created;
  select id into v_blank_run_id from public.audit_runs
  where audit_request_id = v_blank_request_id and run_number = 1;
  select public.start_audit_rerun_v1(v_blank_request_id)
  into v_stale_latest_run_id;
  begin
    perform * from public.complete_team_generated_audit_run_v2(
      v_blank_run_id, v_snapshot, v_findings,
      'A stale draft must never replace the latest run in an audit request.',
      'The backend must preserve latest-run ordering before saving any generated audit output.',
      'audit-v2-stale-complete-key-0001'
    );
    raise exception 'stale empty audit run was completed';
  exception when object_not_in_prerequisite_state then null;
  end;
  begin
    update public.audit_findings set audit_run_id = v_blank_run_id
    where id = (
      select id from public.audit_findings where audit_run_id = v_run_id limit 1
    );
    raise exception 'reviewed finding escaped immutability by reassignment';
  exception when object_not_in_prerequisite_state then null;
  end;

  select count(*) into v_before_count from public.audit_requests;
  begin
    perform * from public.save_team_generated_audit_v2(
      'Invalid Snapshot Restaurant', 'Austin', 'TX', null, null,
      v_snapshot || '{"overallScore":101}'::jsonb, v_findings,
      'This invalid score must roll back the whole generated audit save.',
      'The invalid score must not leave any partial audit records behind.',
      null, 'audit-v2-invalid-key-0001'
    );
    raise exception 'invalid generated audit snapshot was accepted';
  exception when invalid_parameter_value then null;
  end;
  select count(*) into v_after_count from public.audit_requests;
  if v_after_count <> v_before_count then
    raise exception 'invalid generated audit left partial records';
  end if;

  execute 'reset role';

  begin
    perform private.validate_generated_audit_v2(
      v_snapshot - 'confidence', v_findings,
      'A missing confidence value must be rejected by the database validator.',
      'The database must reject incomplete score contracts before any generated audit is saved.',
      'audit-v2-validator-key-000001'
    );
    raise exception 'snapshot without confidence was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(
        v_snapshot, '{categories,0}',
        (v_snapshot #> '{categories,0}') - 'status'
      ),
      v_findings,
      'A missing category status must be rejected by the database validator.',
      'The database must reject incomplete category contracts before any generated audit is saved.',
      'audit-v2-validator-key-000002'
    );
    raise exception 'category without status was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(v_snapshot, '{categories,1,key}', '"google_business_profile"'::jsonb),
      v_findings,
      'Duplicate audit category keys must be rejected by the database validator.',
      'The database must require the exact six canonical categories once each.',
      'audit-v2-validator-key-000003'
    );
    raise exception 'duplicate category key was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(v_snapshot, '{categories,0,status}', '"unknown"'::jsonb),
      v_findings,
      'An unknown category must never retain points in the generated audit score.',
      'The database must derive category points from the reviewed status rather than trust the browser.',
      'audit-v2-validator-key-000004'
    );
    raise exception 'unknown category retained credited points';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(
        jsonb_set(v_snapshot, '{evidenceCoverage}', '40'::jsonb),
        '{confidence}', '"medium"'::jsonb
      ),
      v_findings,
      'Fabricated evidence coverage must be rejected by the database validator.',
      'The database must derive evidence coverage and confidence from canonical category status values.',
      'audit-v2-validator-key-000005'
    );
    raise exception 'fabricated coverage and confidence were accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(v_snapshot, '{honestyNote}', to_jsonb('Altered guarantee language.'::text)),
      v_findings,
      'The locked audit honesty statement must not be replaceable by browser input.',
      'The database must persist the exact non-guarantee statement emitted by the audited engine.',
      'audit-v2-validator-key-000006'
    );
    raise exception 'altered honesty note was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(v_snapshot, '{plan,days_0_30,0}', '7'::jsonb),
      v_findings,
      'Every generated 30, 60, and 90 day plan entry must be usable text.',
      'The database must reject malformed plan entries before persisting the report snapshot.',
      'audit-v2-validator-key-000007'
    );
    raise exception 'non-text 30 day plan item was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(v_snapshot, '{generatedAt}', to_jsonb('not-a-timestamp'::text)),
      v_findings,
      'Every generated audit must contain the normalized engine timestamp.',
      'The database must reject malformed generation timestamps before persistence.',
      'audit-v2-validator-key-000008'
    );
    raise exception 'invalid generated timestamp was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      v_snapshot,
      jsonb_set(v_findings, '{0}', (v_findings #> '{0}') - 'severity'),
      'Every generated finding must include an explicit allowed severity.',
      'The database must reject findings with missing enum values before persistence.',
      'audit-v2-validator-key-000009'
    );
    raise exception 'finding without severity was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(
        v_snapshot, '{improvementAreas,0,summary}',
        to_jsonb('A browser-supplied replacement summary.'::text)
      ),
      v_findings,
      'Improvement summaries must be derived from the canonical engine definition.',
      'The database must reject browser-authored narrative that differs from the deterministic snapshot.',
      'audit-v2-validator-key-000010'
    );
    raise exception 'arbitrary improvement summary was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(
        v_snapshot, '{plan,days_0_30,0}',
        to_jsonb('A plausible but noncanonical replacement plan item.'::text)
      ),
      v_findings,
      'Plan entries must be derived from the canonical engine definition.',
      'The database must reject plausible browser text that differs from the deterministic 30, 60, and 90 day plan.',
      'audit-v2-validator-key-000011'
    );
    raise exception 'arbitrary canonical-looking plan item was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(
        jsonb_set(v_snapshot, '{categories,0}', v_snapshot #> '{categories,1}'),
        '{categories,1}', v_snapshot #> '{categories,0}'
      ),
      v_findings,
      'Canonical categories must remain in deterministic engine order.',
      'The database must reject reordered category arrays even when all six keys are present.',
      'audit-v2-validator-key-000012'
    );
    raise exception 'reordered canonical categories were accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform private.validate_generated_audit_v2(
      jsonb_set(v_snapshot, '{categories,0,browserOnlyField}', 'true'::jsonb),
      v_findings,
      'Canonical category objects must contain only the seven engine-owned fields.',
      'The database must reject additional browser-owned category properties before persistence.',
      'audit-v2-validator-key-000013'
    );
    raise exception 'extra category field was accepted';
  exception when invalid_parameter_value then null;
  end;

  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_client_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform * from public.save_team_generated_audit_v2(
      'Denied Client Restaurant', 'Austin', 'TX', null, null,
      v_snapshot, v_findings,
      'A client must not create generated Team audit records through this function.',
      'A client must remain outside the Team Audit Center mutation boundary.',
      null, 'audit-v2-client-key-000001'
    );
    raise exception 'client unexpectedly saved a generated Team audit';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.complete_team_generated_audit_run_v2(
      v_stale_latest_run_id, v_snapshot, v_findings,
      'A client must not complete generated Team audit records through this function.',
      'A client must remain outside every Team Audit Center mutation boundary.',
      'audit-v2-client-complete-key-0001'
    );
    raise exception 'client unexpectedly completed a generated Team audit';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.save_team_generated_audit_rerun_v2(
      v_complete_request_id, v_complete_run_id, v_snapshot, v_findings,
      'A client must not save generated Team re-audit records through this function.',
      'A client must remain outside every Team Audit Center mutation boundary.',
      'A denied client comparison must never be persisted.',
      'audit-v2-client-rerun-key-000001'
    );
    raise exception 'client unexpectedly saved a generated Team re-audit';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.veroxa_convert_reviewed_audit_to_pending_profile_v1(
      v_request_id, 'audit-onboarding-consent-v1', v_consent, 'written',
      'Denied client evidence reference', now(), 'audit-v2-client-convert-key-0001'
    );
    raise exception 'client unexpectedly converted a reviewed audit';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
exception when others then
  execute 'reset role';
  raise;
end;
end $$;
$workflow$, 'generated audit save, review, consent-backed pending profile, isolation, idempotency, and immutability pass');

select * from finish();
rollback;
