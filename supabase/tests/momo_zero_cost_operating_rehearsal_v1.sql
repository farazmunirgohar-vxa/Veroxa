-- Focused pgTAP contract for the Momo zero-cost operating rehearsal.
-- No provider, AI, email, or external publishing call is made by this test.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select lives_ok($catalog$
do $$
declare
  table_name text;
  function_name text;
begin
  foreach table_name in array array[
    'veroxa_content_input_ledger','veroxa_activation_decisions'
  ] loop
    if to_regclass('public.' || table_name) is null then
      raise exception 'Zero-cost rehearsal table is missing: %', table_name;
    end if;
    if not exists (
      select 1 from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public' and relation.relname = table_name
        and relation.relrowsecurity and relation.relforcerowsecurity
    ) then
      raise exception 'Zero-cost rehearsal table does not force RLS: %', table_name;
    end if;
  end loop;

  foreach function_name in array array[
    'public.veroxa_submit_momo_confirmation_v1(uuid,text,uuid,text,text,jsonb,text)',
    'public.veroxa_create_truth_revisions_v1(uuid,jsonb)',
    'public.veroxa_save_momo_contact_prefill_v1(uuid,uuid,text,text,text,text,boolean)',
    'public.veroxa_update_momo_onboarding_step_v1(uuid,uuid,public.veroxa_readiness_status_v1,jsonb,text,uuid)',
    'public.veroxa_update_momo_presence_v1(uuid,uuid,text,public.veroxa_connection_status_v1,public.veroxa_truth_status_v1,text,uuid)',
    'public.veroxa_register_momo_media_v2(uuid,text,text,bigint,text,text,jsonb,date)',
    'public.veroxa_add_momo_media_tag_v1(uuid,uuid,text)',
    'public.veroxa_revoke_momo_media_rights_v1(uuid,uuid,text)',
    'public.veroxa_create_manual_content_draft_v1(uuid,uuid,uuid,text,text,text,boolean,uuid[],text)',
    'public.veroxa_create_manual_variant_v1(uuid,uuid,text,text)',
    'public.veroxa_schedule_momo_variant_v1(uuid,uuid,timestamp without time zone,text)',
    'public.veroxa_create_momo_report_draft_v1(uuid,text,date,date,jsonb,uuid[])',
    'public.veroxa_revise_momo_report_draft_v1(uuid,jsonb,uuid[])',
    'public.veroxa_transition_work_item_v1(uuid,public.veroxa_job_status_v1,text,text,boolean,jsonb)',
    'public.veroxa_transition_momo_alert_v1(uuid,text,text)',
    'public.veroxa_provider_preflight_v1(uuid,text,text)',
    'public.veroxa_queue_momo_publication_v1(uuid,uuid,uuid,uuid)',
    'public.veroxa_run_momo_no_go_rehearsal_v1(uuid,text)'
  ] loop
    if to_regprocedure(function_name) is null then
      raise exception 'Required zero-cost rehearsal RPC is missing: %', function_name;
    end if;
    if not exists (
      select 1 from pg_proc
      where oid = to_regprocedure(function_name) and prosecdef
        and 'search_path=""' = any(coalesce(proconfig, '{}'::text[]))
    ) then
      raise exception 'RPC is not SECURITY DEFINER with empty search path: %', function_name;
    end if;
    if has_function_privilege('anon', function_name, 'execute')
       or not has_function_privilege('authenticated', function_name, 'execute') then
      raise exception 'RPC execute privilege is unsafe: %', function_name;
    end if;
  end loop;

  foreach table_name in array array[
    'veroxa_restaurant_truth_fields','veroxa_restaurant_contacts',
    'veroxa_confirmations','veroxa_media_assets','veroxa_media_rights',
    'veroxa_media_reviews','veroxa_media_tags','veroxa_media_asset_tags',
    'veroxa_content_variants','veroxa_content_calendar','veroxa_media_usage',
    'veroxa_provider_connections','veroxa_publish_queue','veroxa_publish_attempts',
    'veroxa_job_attempts','veroxa_activity_events','veroxa_reports',
    'veroxa_monitor_checks','veroxa_alerts','veroxa_recovery_runs',
    'veroxa_content_input_ledger','veroxa_activation_decisions'
  ] loop
    if has_table_privilege('authenticated', 'public.' || table_name, 'delete') then
      raise exception 'Authenticated delete survived on protected table: %', table_name;
    end if;
  end loop;

  if veroxa_private.truth_value_shape_valid_v1(
       'claims.halal', '["no","halal"]'::jsonb
     ) or veroxa_private.truth_value_shape_valid_v1(
       'identity.display_name', '{"text":"Momo","extra":true}'::jsonb
     ) then
    raise exception 'Canonical truth shape accepted mixed halal or extra object keys';
  end if;
  if not veroxa_private.truth_value_shape_valid_v1(
       'claims.halal', '["halal"]'::jsonb
     ) or not veroxa_private.truth_value_shape_valid_v1(
       'identity.display_name', '{"text":"Momo"}'::jsonb
     ) then
    raise exception 'Canonical truth shape rejected supported values';
  end if;
  if veroxa_private.report_summary_safe_v1(
       '{"narrative":"Momo is halal, open 24/7, with free delivery."}'::jsonb
     ) or veroxa_private.report_summary_safe_v1(
       '{"narrative":"Rehearsal update: Team recorded internal testing activity for this period. No external outcome is claimed.","extra":true}'::jsonb
     ) then
    raise exception 'Report allowlist accepted unsupported claims or extra keys';
  end if;
  if not veroxa_private.report_summary_safe_v1(
       '{"narrative":"Rehearsal update: Team recorded internal testing activity for this period. No external outcome is claimed."}'::jsonb
     ) then
    raise exception 'Report allowlist rejected its exact safe narrative';
  end if;

  if has_function_privilege(
       'authenticated',
       'public.veroxa_create_truth_revision_v1(uuid,text,text,jsonb,text)',
       'execute'
     ) or has_function_privilege(
       'authenticated',
       'public.veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamp with time zone)',
       'execute'
     ) then
    raise exception 'A superseded legacy writer remains executable';
  end if;
end $$;
$catalog$, 'Zero-cost rehearsal catalog, exact shapes, grants, and RPC posture are fail-closed');

select lives_ok($workflow$
do $$
declare
  v_restaurant_id uuid := '70000000-0000-0000-0000-000000000001';
  v_team_user_id uuid := '71000000-0000-0000-0000-000000000001';
  v_client_user_id uuid := '71000000-0000-0000-0000-000000000002';
  v_authorizer_user_id uuid := '71000000-0000-0000-0000-000000000003';
  v_truth_ids uuid[];
  v_confirmation_ids uuid[] := '{}'::uuid[];
  v_truth_id uuid;
  v_identity_id uuid;
  v_confirmation_id uuid;
  v_old_confirmation_id uuid;
  v_help_confirmation_id uuid;
  v_contact_id uuid;
  v_step_id uuid;
  v_help_step_id uuid;
  v_presence_id uuid;
  v_connection_id uuid;
  v_asset_id uuid;
  v_rights_id uuid;
  v_item_id uuid;
  v_second_item_id uuid;
  v_variant_id uuid;
  v_second_variant_id uuid;
  v_approval_id uuid;
  v_publish_approval_id uuid;
  v_queue_id uuid;
  v_second_queue_id uuid;
  v_work_id uuid;
  v_retry_work_id uuid;
  v_recovery_work_id uuid;
  v_recovery_id uuid;
  v_event_id uuid;
  v_report_id uuid;
  v_alert_id uuid;
  v_snapshot jsonb;
  v_preflight record;
  v_no_go record;
  v_claim text;
  v_local_positive timestamp without time zone :=
    ((now() at time zone 'America/Chicago')::date + 2) + time '12:00';
  v_local_expired timestamp without time zone :=
    ((now() at time zone 'America/Chicago')::date + 4) + time '12:00';
  v_storage_path text :=
    'restaurants/70000000-0000-0000-0000-000000000001/uploads/2026/07/72000000-0000-0000-0000-000000000001.jpg';
begin
  insert into public.veroxa_restaurants (id, name, city, state, status)
  values (v_restaurant_id, 'Momo Rehearsal Scope', 'San Antonio', 'TX', 'active');
  insert into veroxa_private.operational_restaurant_scope
    (scope_key, restaurant_id, enabled)
  values ('momo_house_san_antonio', v_restaurant_id, true);
  insert into veroxa_private.auth_identity_allowlist
    (email, role, display_name, restaurant_id, enabled)
  values
    ('momo-rehearsal-team@veroxa.invalid', 'team', 'Rehearsal Team', v_restaurant_id, true),
    ('momo-rehearsal-client@veroxa.invalid', 'client', 'Rehearsal Owner', v_restaurant_id, true),
    ('momo-rehearsal-authorizer@veroxa.invalid', 'client', 'Provider Authorizer', v_restaurant_id, true);
  insert into auth.users (
    id, instance_id, aud, role, email, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_team_user_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'momo-rehearsal-team@veroxa.invalid', now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_client_user_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'momo-rehearsal-client@veroxa.invalid', now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_authorizer_user_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'momo-rehearsal-authorizer@veroxa.invalid', now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  -- This rollback-only rehearsal exercises owner-authorized workflows through
  -- the same audited authority path used in production. The .invalid accounts
  -- and explicit fixture evidence keep synthetic verification isolated.
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform public.veroxa_assign_momo_real_owner_authority_v1(
    v_restaurant_id,
    'momo-rehearsal-client@veroxa.invalid',
    jsonb_build_object(
      'method', 'owner_meeting',
      'verifiedAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'details', 'Rollback-only transactional real-owner workflow fixture.'
    )
  );
  perform public.veroxa_assign_momo_real_owner_authority_v1(
    v_restaurant_id,
    'momo-rehearsal-authorizer@veroxa.invalid',
    jsonb_build_object(
      'method', 'verified_manager_invite',
      'verifiedAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'details', 'Rollback-only transactional provider-authority fixture.'
    )
  );
  execute 'reset role';

  insert into public.veroxa_onboarding_steps
    (restaurant_id, step_key, title, position)
  values
    (v_restaurant_id, 'welcome', 'Welcome evidence', 1),
    (v_restaurant_id, 'contacts', 'Early help path', 2);
  select id into v_step_id from public.veroxa_onboarding_steps
  where restaurant_id = v_restaurant_id and step_key = 'welcome';
  select id into v_help_step_id from public.veroxa_onboarding_steps
  where restaurant_id = v_restaurant_id and step_key = 'contacts';
  insert into public.veroxa_presence_profiles (restaurant_id, provider)
  values (v_restaurant_id, 'facebook') returning id into v_presence_id;
  insert into public.veroxa_provider_connections (
    restaurant_id, provider, external_account_id, display_label, status,
    capabilities, owner_authorized_by, owner_authorized_at, last_verified_at
  ) values (
    v_restaurant_id, 'meta', 'prepared-test-account', 'Prepared Meta fixture',
    'connected', '["facebook_publish","untrusted_capability"]'::jsonb,
    v_authorizer_user_id, now(), now()
  ) returning id into v_connection_id;
  insert into storage.objects (bucket_id, name, owner_id, metadata)
  values ('restaurant-media', v_storage_path, v_client_user_id::text,
    '{"mimetype":"image/jpeg","size":1234}'::jsonb);

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  insert into public.veroxa_readiness_dimensions
    (restaurant_id, dimension_key, label)
  values
    (v_restaurant_id, 'production_foundation', 'Production foundation'),
    (v_restaurant_id, 'ai_and_automation', 'AI and safe automation');
  execute 'set local role authenticated';

  begin
    perform public.veroxa_create_truth_revisions_v1(v_restaurant_id,
      jsonb_build_array(jsonb_build_object(
        'field_key','claims.halal','section','claims',
        'value_json','["no","halal"]'::jsonb)));
    raise exception 'Mixed halal enum bypassed canonical truth writer';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.veroxa_create_truth_revisions_v1(v_restaurant_id,
      jsonb_build_array(jsonb_build_object(
        'field_key','identity.display_name','section','identity',
        'value_json','{"text":"Momo","extra":true}'::jsonb)));
    raise exception 'Extra truth object keys bypassed canonical writer';
  exception when invalid_parameter_value then null;
  end;

  v_truth_ids := public.veroxa_create_truth_revisions_v1(v_restaurant_id,
    jsonb_build_array(
      jsonb_build_object('field_key','identity.display_name','section','identity',
        'value_json','{"text":"Momo Rehearsal Scope"}'::jsonb),
      jsonb_build_object('field_key','claims.halal','section','claims',
        'value_json','["false"]'::jsonb),
      jsonb_build_object('field_key','claims.dietary','section','claims',
        'value_json','["gluten-free noodles"]'::jsonb),
      jsonb_build_object('field_key','services.delivery','section','services',
        'value_json','["delivery"]'::jsonb),
      jsonb_build_object('field_key','menu.primary','section','menu',
        'value_json','{"text":"Gluten-free noodles, steamed chicken momo, chicken $12"}'::jsonb),
      jsonb_build_object('field_key','hours.regular','section','hours',
        'value_json','{"text":"Open until 11 PM; Friday 9 AM to 5 PM"}'::jsonb),
      jsonb_build_object('field_key','phone.primary','section','phone',
        'value_json','{"text":"210-555-0100"}'::jsonb),
      jsonb_build_object('field_key','address.primary','section','address',
        'value_json','{"text":"123 Main Street San Antonio TX"}'::jsonb)
    ));
  select id into v_identity_id from public.veroxa_restaurant_truth_fields
  where restaurant_id = v_restaurant_id and field_key = 'identity.display_name' and is_current;

  begin
    insert into public.veroxa_restaurant_truth_fields
      (restaurant_id, field_key, section, value_json, status, source)
    values (v_restaurant_id, 'brand.voice', 'brand', '{"text":"Bypass"}',
      'team_prefilled', 'team');
    raise exception 'Direct truth insert bypassed atomic RPC';
  exception when insufficient_privilege then null;
  end;

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_client_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  begin
    insert into public.veroxa_confirmations (
      restaurant_id, subject_type, subject_id, confirmation_kind,
      decision, submitted_by
    ) values (
      v_restaurant_id, 'truth_field', v_identity_id, 'business_truth',
      'confirm', v_client_user_id
    );
    raise exception 'Direct confirmation insert bypassed snapshot RPC';
  exception when insufficient_privilege then null;
  end;
  foreach v_truth_id in array v_truth_ids loop
    v_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
      v_restaurant_id, 'truth_field', v_truth_id, 'business_truth',
      'confirm', null, 'Owner confirms canonical rehearsal truth.');
    v_confirmation_ids := array_append(v_confirmation_ids, v_confirmation_id);
  end loop;

  -- Owner reject/needs-help is valid before a step becomes ready for review.
  v_help_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    v_restaurant_id, 'onboarding_step', v_help_step_id, 'onboarding',
    'needs_help', null, 'Owner needs help before evidence is prepared.');

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  foreach v_confirmation_id in array v_confirmation_ids loop
    perform * from public.veroxa_apply_confirmation_v1(
      v_confirmation_id, 'approved', null, 'Reviewed canonical owner truth.');
  end loop;
  perform * from public.veroxa_apply_confirmation_v1(
    v_help_confirmation_id, 'changes_requested', null, 'Help request stays blocked.');

  -- Semantic positive cases allow framing while retaining value containment.
  perform public.veroxa_create_manual_content_draft_v1(
    v_restaurant_id, null, null, 'Service story', 'We offer delivery.', null,
    false, v_truth_ids, 'Local Discovery');
  perform public.veroxa_create_manual_content_draft_v1(
    v_restaurant_id, null, null, 'Dish story', 'We serve steamed chicken momo.', null,
    false, v_truth_ids, 'First-Time Education');
  perform public.veroxa_create_manual_content_draft_v1(
    v_restaurant_id, null, null, 'Hours story', 'We are open until 11 PM.', null,
    false, v_truth_ids, 'Local Discovery');
  perform public.veroxa_create_manual_content_draft_v1(
    v_restaurant_id, null, null, 'Schedule story',
    'Business hours Friday 9 AM to 5 PM.', null,
    false, v_truth_ids, 'Local Discovery');
  perform public.veroxa_create_manual_content_draft_v1(
    v_restaurant_id, null, null, 'Dietary story', 'Gluten-free noodles.', null,
    false, v_truth_ids, 'First-Time Education');
  perform public.veroxa_create_manual_content_draft_v1(
    v_restaurant_id, null, null, 'Visit details',
    'Visit us at 123 Main Street San Antonio TX.', null,
    false, v_truth_ids, 'Local Discovery');
  perform public.veroxa_create_manual_content_draft_v1(
    v_restaurant_id, null, null, 'Identity story',
    'Official name is Momo Rehearsal Scope.', null,
    false, v_truth_ids, 'Local Discovery');

  foreach v_claim in array array[
    'We offer delivery and catering.','We serve beef momo.',
    'We are open until 10 PM.','Call 210-555-9999.',
    'Find us at 999 Fake St.','Open 24/7.','Takeout is available.',
    'BOGO today.','Complimentary delivery today.','Free delivery today.',
    'Free noodles.',
    'Lobster $12.','Noodles $12.','Open Friday 5 AM to 9 PM.',
    'Call 911 or 210-555-0100.','50 vegan options.','50 halal dishes.',
    'Delivery in 30 minutes.','Nationwide delivery.',
    'Our address is Suite 999 123 Main Street San Antonio TX.',
    'Official name is Fake Momo Rehearsal Scope.',
    'Ranked first.','We are halal.','100% certified halal.','100% vegan.'
  ] loop
    begin
      perform public.veroxa_create_manual_content_draft_v1(
        v_restaurant_id, null, null, 'Blocked claim', v_claim, null,
        false, v_truth_ids, 'Local Discovery');
      raise exception 'Unsupported sensitive claim was accepted: %', v_claim;
    exception when check_violation then null;
    end;
  end loop;

  v_contact_id := public.veroxa_save_momo_contact_prefill_v1(
    v_restaurant_id, null, 'owner', 'Owner Rehearsal',
    'owner-rehearsal@veroxa.invalid', null, true);
  perform public.veroxa_update_momo_onboarding_step_v1(
    v_restaurant_id, v_step_id, 'ready_for_review',
    '[{"kind":"manual_rehearsal","reviewed":true}]'::jsonb, null, null);

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_client_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  v_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    v_restaurant_id, 'contact', v_contact_id, 'contact', 'confirm', null,
    'Owner confirms the contact prefill.');
  v_old_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    v_restaurant_id, 'onboarding_step', v_step_id, 'onboarding', 'confirm', null,
    'Owner confirms the prepared onboarding evidence.');

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform * from public.veroxa_apply_confirmation_v1(
    v_confirmation_id, 'approved', null, 'Contact reviewed.');
  perform * from public.veroxa_apply_confirmation_v1(
    v_old_confirmation_id, 'approved', null, 'Onboarding evidence reviewed.');
  begin
    perform public.veroxa_save_momo_contact_prefill_v1(
      v_restaurant_id, v_contact_id, 'owner', 'Changed by Team',
      'changed@veroxa.invalid', null, true);
    raise exception 'Team overwrote owner-confirmed contact';
  exception when check_violation then null;
  end;

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_client_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  v_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    v_restaurant_id, 'onboarding_step', v_step_id, 'onboarding', 'needs_help', null,
    'Owner raised a newer onboarding blocker.');

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.veroxa_update_momo_onboarding_step_v1(
      v_restaurant_id, v_step_id, 'verified',
      '[{"kind":"manual_rehearsal","reviewed":true}]'::jsonb,
      null, v_old_confirmation_id);
    raise exception 'Stale onboarding confirmation verified newer contrary intent';
  exception when check_violation then null;
  end;
  perform * from public.veroxa_apply_confirmation_v1(
    v_confirmation_id, 'changes_requested', null, 'Resolve the newer blocker first.');

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_client_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  v_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    v_restaurant_id, 'onboarding_step', v_step_id, 'onboarding', 'confirm', null,
    'Owner reconfirms the exact onboarding evidence.');
  v_old_confirmation_id := v_confirmation_id;
  v_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    v_restaurant_id, 'presence_profile', v_presence_id, 'presence', 'correct',
    '{"publicUrl":"https://Example.COM:443/#fragment","accessAuthorized":true}'::jsonb,
    'Owner confirms canonical Facebook presence and access.');

  select registered.asset_id, registered.rights_id
    into v_asset_id, v_rights_id
  from public.veroxa_register_momo_media_v2(
    v_restaurant_id, v_storage_path, 'image/jpeg', 1234,
    'momo-rehearsal.jpg', 'Owner-provided rehearsal media.',
    '["facebook"]'::jsonb,
    (now() at time zone 'America/Chicago')::date + 3
  ) registered;

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform * from public.veroxa_apply_confirmation_v1(
    v_old_confirmation_id, 'approved', null, 'Fresh onboarding confirmation reviewed.');
  perform public.veroxa_update_momo_onboarding_step_v1(
    v_restaurant_id, v_step_id, 'verified',
    '[{"kind":"manual_rehearsal","reviewed":true}]'::jsonb,
    null, v_old_confirmation_id);
  perform * from public.veroxa_apply_confirmation_v1(
    v_confirmation_id, 'approved', null, 'Presence correction reviewed.');
  perform public.veroxa_update_momo_presence_v1(
    v_restaurant_id, v_presence_id, 'https://example.com/', 'degraded',
    'owner_confirmed', 'Manual evidence records degraded access.', v_confirmation_id);
  if not exists (
    select 1 from public.veroxa_presence_profiles
    where id = v_presence_id and owner_confirmation_id = v_confirmation_id
      and access_status = 'degraded' and public_url = 'https://example.com/'
  ) then raise exception 'Degraded presence did not retain exact owner evidence'; end if;

  perform * from public.veroxa_review_momo_media_v1(
    v_asset_id, 'approved', 90::smallint, 'Clear permissioned rehearsal media.', true);
  perform * from public.veroxa_add_momo_media_tag_v1(
    v_restaurant_id, v_asset_id, 'Momo rehearsal');
  begin
    insert into public.veroxa_media_tags (restaurant_id, slug, label, source)
    values (v_restaurant_id, 'direct-bypass', 'Direct bypass', 'team');
    raise exception 'Direct media tag insert bypassed provenance RPC';
  exception when insufficient_privilege then null;
  end;

  -- First prepared item: owner content rejection must cancel queue and calendar.
  v_item_id := public.veroxa_create_manual_content_draft_v1(
    v_restaurant_id, null, v_asset_id, 'Manual Momo story',
    'A warm behind-the-scenes story.', 'A warm Momo story.', false,
    v_truth_ids, 'Behind the Scenes');
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'content_item', v_item_id, 'team_review', v_team_user_id)
  returning id into v_approval_id;
  perform * from public.veroxa_apply_approval_v1(
    v_approval_id, 'approved', 'Manual item reviewed.');
  v_variant_id := public.veroxa_create_manual_variant_v1(
    v_restaurant_id, v_item_id, 'facebook', 'A warm Momo story.');
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'content_variant', v_variant_id, 'team_review', v_team_user_id)
  returning id into v_approval_id;
  perform * from public.veroxa_apply_approval_v1(
    v_approval_id, 'approved', 'Manual variant reviewed.');
  begin
    perform * from public.veroxa_schedule_momo_variant_v1(
      v_restaurant_id, v_variant_id, v_local_expired, 'America/Chicago');
    raise exception 'Schedule survived media expiry at execution time';
  exception when check_violation then null;
  end;
  perform * from public.veroxa_schedule_momo_variant_v1(
    v_restaurant_id, v_variant_id, v_local_positive, 'America/Chicago');
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'publish', v_variant_id, 'publishing', v_team_user_id)
  returning id into v_publish_approval_id;
  perform * from public.veroxa_apply_approval_v1(
    v_publish_approval_id, 'approved', 'Prepared publication reviewed.');
  v_queue_id := public.veroxa_queue_momo_publication_v1(
    v_restaurant_id, v_connection_id, v_variant_id, v_publish_approval_id);
  begin
    update public.veroxa_publish_queue set status = 'queued' where id = v_queue_id;
    raise exception 'Provider runtime executed during zero-cost rehearsal';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
  begin
    update public.veroxa_publish_queue set status = 'queued' where id = v_queue_id;
    raise exception 'Privileged fixture bypassed inactive provider runtime';
  exception when object_not_in_prerequisite_state then null;
  end;
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_client_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  v_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    v_restaurant_id, 'content_item', v_item_id, 'content_direction', 'reject', null,
    'Owner rejects this prepared content direction.');

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    perform public.veroxa_queue_momo_publication_v1(
      v_restaurant_id, v_connection_id, v_variant_id, v_publish_approval_id);
    raise exception 'New queue ignored pending owner content rejection';
  exception when check_violation then null;
  end;
  perform * from public.veroxa_apply_confirmation_v1(
    v_confirmation_id, 'approved', null, 'Owner content rejection applied.');
  if not exists (select 1 from public.veroxa_publish_queue
      where id = v_queue_id and status = 'cancelled')
     or not exists (select 1 from public.veroxa_content_calendar
      where variant_id = v_variant_id and status = 'cancelled') then
    raise exception 'Owner content rejection did not cancel queue and calendar';
  end if;

  -- Second prepared item: pending presence withdrawal freezes, approval revokes.
  v_second_item_id := public.veroxa_create_manual_content_draft_v1(
    v_restaurant_id, null, v_asset_id, 'Second manual story',
    'A second internal story.', 'A second Momo story.', false,
    v_truth_ids, 'Momo Cravings');
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'content_item', v_second_item_id, 'team_review', v_team_user_id)
  returning id into v_approval_id;
  perform * from public.veroxa_apply_approval_v1(v_approval_id, 'approved', 'Second item reviewed.');
  v_second_variant_id := public.veroxa_create_manual_variant_v1(
    v_restaurant_id, v_second_item_id, 'facebook', 'A second Momo story.');
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'content_variant', v_second_variant_id, 'team_review', v_team_user_id)
  returning id into v_approval_id;
  perform * from public.veroxa_apply_approval_v1(v_approval_id, 'approved', 'Second variant reviewed.');
  perform * from public.veroxa_schedule_momo_variant_v1(
    v_restaurant_id, v_second_variant_id, v_local_positive + interval '1 hour', 'America/Chicago');
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'publish', v_second_variant_id, 'publishing', v_team_user_id)
  returning id into v_publish_approval_id;
  perform * from public.veroxa_apply_approval_v1(v_publish_approval_id, 'approved', 'Second publish reviewed.');
  v_second_queue_id := public.veroxa_queue_momo_publication_v1(
    v_restaurant_id, v_connection_id, v_second_variant_id, v_publish_approval_id);

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_client_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  v_snapshot := public.veroxa_momo_client_snapshot_v1(v_restaurant_id);
  if not (v_snapshot -> 'connections' -> 0 -> 'eligibleCapabilities'
      @> '["facebook_publish"]'::jsonb)
     or v_snapshot -> 'connections' -> 0 -> 'eligibleCapabilities'
      @> '["untrusted_capability"]'::jsonb then
    raise exception 'Client snapshot eligible capability allowlist is incorrect';
  end if;
  execute 'reset role';
  update public.veroxa_provider_connections
  set status = 'degraded' where id = v_connection_id;
  execute 'set local role authenticated';
  v_snapshot := public.veroxa_momo_client_snapshot_v1(v_restaurant_id);
  if v_snapshot -> 'connections' -> 0 -> 'eligibleCapabilities' <> '[]'::jsonb then
    raise exception 'Degraded connection exposed eligible capabilities';
  end if;
  execute 'reset role';
  update public.veroxa_provider_connections
  set status = 'connected', last_verified_at = owner_authorized_at - interval '1 second'
  where id = v_connection_id;
  execute 'set local role authenticated';
  v_snapshot := public.veroxa_momo_client_snapshot_v1(v_restaurant_id);
  if v_snapshot -> 'connections' -> 0 -> 'eligibleCapabilities' <> '[]'::jsonb then
    raise exception 'Stale provider verification exposed eligible capabilities';
  end if;
  execute 'reset role';
  update public.veroxa_provider_connections
  set last_verified_at = clock_timestamp() where id = v_connection_id;
  update public.veroxa_user_profiles
  set status = 'disabled' where user_id = v_authorizer_user_id;
  execute 'set local role authenticated';
  v_snapshot := public.veroxa_momo_client_snapshot_v1(v_restaurant_id);
  if v_snapshot -> 'connections' -> 0 -> 'eligibleCapabilities' <> '[]'::jsonb then
    raise exception 'Inactive authorizer profile exposed eligible capabilities';
  end if;
  execute 'reset role';
  update public.veroxa_user_profiles
  set status = 'active' where user_id = v_authorizer_user_id;
  update public.veroxa_restaurant_members
  set status = 'disabled'
  where restaurant_id = v_restaurant_id and user_id = v_authorizer_user_id;
  execute 'set local role authenticated';
  v_snapshot := public.veroxa_momo_client_snapshot_v1(v_restaurant_id);
  if v_snapshot -> 'connections' -> 0 -> 'eligibleCapabilities' <> '[]'::jsonb then
    raise exception 'Inactive authorizer membership exposed eligible capabilities';
  end if;
  execute 'reset role';
  update public.veroxa_restaurant_members
  set status = 'active'
  where restaurant_id = v_restaurant_id and user_id = v_authorizer_user_id;
  execute 'set local role authenticated';
  v_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    v_restaurant_id, 'presence_profile', v_presence_id, 'presence', 'reject', null,
    'Owner withdraws Facebook presence authority.');

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select * into v_preflight from public.veroxa_provider_preflight_v1(
    v_restaurant_id, 'meta', 'facebook_publish');
  if v_preflight.allowed or not (v_preflight.blockers @>
      '[{"code":"owner_presence_authority_withdrawn"}]'::jsonb) then
    raise exception 'Pending owner presence withdrawal did not freeze preflight';
  end if;
  begin
    perform public.veroxa_queue_momo_publication_v1(
      v_restaurant_id, v_connection_id, v_second_variant_id, v_publish_approval_id);
    raise exception 'Pending presence withdrawal allowed a new queue';
  exception when check_violation then null;
  end;
  perform * from public.veroxa_apply_confirmation_v1(
    v_confirmation_id, 'approved', null, 'Presence withdrawal applied.');
  if not exists (select 1 from public.veroxa_provider_connections
      where id = v_connection_id and status = 'revoked')
     or not exists (select 1 from public.veroxa_publish_queue
      where id = v_second_queue_id and status = 'cancelled')
     or not exists (select 1 from public.veroxa_activity_events
      where subject_id = v_presence_id and event_type = 'presence_authorization_withdrawn') then
    raise exception 'Approved presence withdrawal did not revoke and cancel atomically';
  end if;

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_client_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  v_snapshot := public.veroxa_momo_client_snapshot_v1(v_restaurant_id);
  if v_snapshot -> 'connections' -> 0 -> 'eligibleCapabilities' <> '[]'::jsonb then
    raise exception 'Revoked connection exposed eligible capabilities';
  end if;
  perform public.veroxa_revoke_momo_media_rights_v1(
    v_restaurant_id, v_rights_id, 'Owner withdraws all public media usage rights.');
  begin
    perform public.veroxa_submit_momo_confirmation_v1(
      v_restaurant_id, 'media_rights', v_rights_id, 'usage_rights', 'confirm', null,
      'Attempt to revive terminal rights.');
    raise exception 'Revoked media rights were revived';
  exception when check_violation then null;
  end;

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- Attempt ledger: initial execution is attempt 1; bounded retry is attempt 2.
  insert into public.veroxa_work_items
    (restaurant_id, work_type, title, status, max_attempts, created_by)
  values (v_restaurant_id, 'content', 'Bounded retry rehearsal', 'queued', 2, v_team_user_id)
  returning id into v_retry_work_id;
  perform * from public.veroxa_transition_work_item_v1(
    v_retry_work_id, 'in_progress', null, 'team', false, '{}'::jsonb);
  perform * from public.veroxa_transition_work_item_v1(
    v_retry_work_id, 'failed', 'First attempt failed safely.', 'team', false, '{}'::jsonb);
  perform * from public.veroxa_retry_work_item_v1(v_retry_work_id);
  begin
    perform * from public.veroxa_transition_work_item_v1(
      v_retry_work_id, 'in_progress', null, 'team', false, '{}'::jsonb);
    raise exception 'Retry backoff was bypassed';
  exception when object_not_in_prerequisite_state then null;
  end;
  execute 'reset role';
  update public.veroxa_work_items
  set next_attempt_at = now() - interval '1 second' where id = v_retry_work_id;
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform * from public.veroxa_transition_work_item_v1(
    v_retry_work_id, 'in_progress', null, 'team', false, '{}'::jsonb);
  perform * from public.veroxa_transition_work_item_v1(
    v_retry_work_id, 'failed', 'Second attempt failed safely.', 'team', false, '{}'::jsonb);
  begin
    perform * from public.veroxa_retry_work_item_v1(v_retry_work_id);
    raise exception 'Retry exceeded max-attempt boundary';
  exception when check_violation then null;
  end;
  if (select count(*) from public.veroxa_job_attempts
      where work_item_id = v_retry_work_id) <> 2 then
    raise exception 'Attempt ledger did not preserve initial plus retry history';
  end if;

  insert into public.veroxa_work_items
    (restaurant_id, work_type, title, status, max_attempts, created_by)
  values (v_restaurant_id, 'content', 'Recovery lock rehearsal', 'queued', 3, v_team_user_id)
  returning id into v_recovery_work_id;
  perform * from public.veroxa_transition_work_item_v1(
    v_recovery_work_id, 'blocked', 'Manual blocker recorded.', 'team', false, '{}'::jsonb);
  v_recovery_id := public.veroxa_start_recovery_run_v1(
    v_recovery_work_id, 'manual-recovery', 1);
  begin
    perform * from public.veroxa_retry_work_item_v1(v_recovery_work_id);
    raise exception 'Active recovery did not lock retry';
  exception when object_not_in_prerequisite_state then null;
  end;
  perform * from public.veroxa_complete_recovery_run_v1(
    v_recovery_id, true, 'Manual evidence confirms recovery completion.', 'both');

  -- External work cannot create client-visible or report-eligible success.
  insert into public.veroxa_work_items
    (restaurant_id, work_type, title, status, created_by)
  values (v_restaurant_id, 'publishing', 'External work stays internal', 'queued', v_team_user_id)
  returning id into v_work_id;
  perform * from public.veroxa_transition_work_item_v1(
    v_work_id, 'in_progress', null, 'team', false, '{}'::jsonb);
  begin
    perform * from public.veroxa_transition_work_item_v1(
      v_work_id, 'completed', 'Unsupported external success.', 'both', true, '{}'::jsonb);
    raise exception 'External work fabricated client-visible evidence';
  exception when check_violation then null;
  end;
  perform * from public.veroxa_transition_work_item_v1(
    v_work_id, 'completed', null, 'team', false, '{}'::jsonb);

  insert into public.veroxa_work_items
    (restaurant_id, work_type, title, status, created_by)
  values (v_restaurant_id, 'content', 'Reportable internal workflow', 'queued', v_team_user_id)
  returning id into v_work_id;
  perform * from public.veroxa_transition_work_item_v1(
    v_work_id, 'in_progress', null, 'team', false, '{}'::jsonb);
  select activity_event_id into v_event_id
  from public.veroxa_transition_work_item_v1(
    v_work_id, 'completed', 'Reviewed manual workflow evidence.', 'both', true,
    '{"reviewed":true}'::jsonb);

  begin
    perform public.veroxa_create_momo_report_draft_v1(
      v_restaurant_id, 'weekly',
      (now() at time zone 'America/Chicago')::date,
      (now() at time zone 'America/Chicago')::date,
      '{"narrative":"Momo is halal, open 24/7, with free delivery."}'::jsonb,
      array[v_event_id]);
    raise exception 'Unsafe report narrative was accepted';
  exception when check_violation then null;
  end;
  v_report_id := public.veroxa_create_momo_report_draft_v1(
    v_restaurant_id, 'weekly',
    (now() at time zone 'America/Chicago')::date,
    (now() at time zone 'America/Chicago')::date,
    '{"narrative":"Manual operating update: Team completed reviewed internal workflow steps for this period. No external outcome is claimed."}'::jsonb,
    array[v_event_id]);
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'report', v_report_id, 'report_release', v_team_user_id)
  returning id into v_approval_id;
  perform * from public.veroxa_apply_approval_v1(
    v_approval_id, 'changes_requested', 'Use the rehearsal narrative.');
  perform public.veroxa_revise_momo_report_draft_v1(
    v_report_id,
    '{"narrative":"Rehearsal update: Team recorded internal testing activity for this period. No external outcome is claimed."}'::jsonb,
    array[v_event_id]);
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'report', v_report_id, 'report_release', v_team_user_id)
  returning id into v_approval_id;
  perform * from public.veroxa_apply_approval_v1(
    v_approval_id, 'approved', 'Safe report release reviewed.');
  begin
    perform public.veroxa_revise_momo_report_draft_v1(
      v_report_id,
      '{"narrative":"Blocker update: Team documented unresolved operating blockers for this period. No external outcome is claimed."}'::jsonb,
      array[v_event_id]);
    raise exception 'Approved report was revised in place';
  exception when check_violation then null;
  end;

  select alert_id into v_alert_id from public.veroxa_record_monitor_check_v1(
    v_restaurant_id, 'manual-fixture-health', 'critical',
    '{"note":"Manual fixture requires review."}'::jsonb, now() + interval '1 day');
  begin
    perform * from public.veroxa_transition_momo_alert_v1(
      v_alert_id, 'resolved', 'Cannot skip acknowledgement.');
    raise exception 'Alert skipped acknowledgement';
  exception when check_violation then null;
  end;
  perform * from public.veroxa_transition_momo_alert_v1(
    v_alert_id, 'acknowledged', 'Team acknowledged the manual alert.');
  perform * from public.veroxa_transition_momo_alert_v1(
    v_alert_id, 'resolved', 'Team resolved the manual alert safely.');

  select * into v_no_go from public.veroxa_run_momo_no_go_rehearsal_v1(
    v_restaurant_id, 'Required dimensions remain blocked in the zero-cost rehearsal.');
  if v_no_go.status <> 'blocked' or v_no_go.can_activate
     or not exists (select 1 from public.veroxa_activation_decisions
       where id = v_no_go.decision_id and decision = 'no_go' and mode = 'rehearsal') then
    raise exception 'No-Go rehearsal did not remain fail-closed';
  end if;
  execute 'reset role';
end $$;
$workflow$, 'Owner evidence, semantic claims, media, provider withdrawal, recovery, reporting, and No-Go work end to end');

select * from finish();
rollback;
