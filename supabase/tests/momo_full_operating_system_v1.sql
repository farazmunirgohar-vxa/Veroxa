-- Momo Full Operating System V1 catalog, RLS, workflow, and readiness gates.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select lives_ok($catalog$
do $$
declare
  table_name text;
  unsafe_record record;
begin
  foreach table_name in array array[
    'veroxa_restaurant_truth_fields','veroxa_restaurant_contacts','veroxa_onboarding_steps',
    'veroxa_presence_profiles','veroxa_confirmations','veroxa_readiness_dimensions',
    'veroxa_readiness_gate_runs','veroxa_media_assets','veroxa_media_rights','veroxa_media_reviews',
    'veroxa_media_tags','veroxa_media_asset_tags','veroxa_ai_jobs','veroxa_content_strategies',
    'veroxa_content_items','veroxa_content_variants','veroxa_approvals',
    'veroxa_content_calendar','veroxa_media_usage','veroxa_provider_connections',
    'veroxa_publish_queue','veroxa_publish_attempts','veroxa_local_presence_checks',
    'veroxa_review_records','veroxa_visibility_snapshots','veroxa_work_items',
    'veroxa_job_attempts','veroxa_activity_events','veroxa_reports','veroxa_monitor_checks',
    'veroxa_alerts','veroxa_recovery_runs'
  ] loop
    if to_regclass('public.' || table_name) is null then
      raise exception 'Momo operating table is missing: %', table_name;
    end if;
    if not exists (
      select 1
      from pg_class table_record
      join pg_namespace schema_record on schema_record.oid = table_record.relnamespace
      where schema_record.nspname = 'public'
        and table_record.relname = table_name
        and table_record.relrowsecurity
        and table_record.relforcerowsecurity
    ) then
      raise exception 'Momo operating table does not force RLS: %', table_name;
    end if;
    if has_table_privilege('anon', 'public.' || table_name, 'select')
       or has_table_privilege('anon', 'public.' || table_name, 'insert')
       or has_table_privilege('authenticated', 'public.' || table_name, 'delete') then
      raise exception 'Unsafe table grant exists for %', table_name;
    end if;
    if not exists (
      select 1 from pg_trigger
      where tgrelid = ('public.' || table_name)::regclass
        and tgname = table_name || '_momo_scope'
        and not tgisinternal
    ) then
      raise exception 'Momo singleton scope trigger is missing on %', table_name;
    end if;
  end loop;

  if exists (
    select 1
    from information_schema.columns column_record
    where column_record.table_schema = 'public'
      and column_record.table_name like 'veroxa_%'
      and column_record.table_name in (
        'veroxa_provider_connections','veroxa_publish_queue','veroxa_publish_attempts','veroxa_ai_jobs'
      )
      and column_record.column_name ~* '(access_token|refresh_token|api_key|client_secret|provider_secret|credential_secret)'
  ) then
    raise exception 'Provider secrets or tokens are modeled in an exposed public table';
  end if;

  select schemaname, tablename, policyname into unsafe_record
  from pg_policies
  where schemaname = 'public'
    and tablename like 'veroxa_%'
    and ('anon'::name = any(roles) or 'public'::name = any(roles))
  limit 1;
  if found then
    raise exception 'Anonymous Momo operations policy exists: %.%.%',
      unsafe_record.schemaname, unsafe_record.tablename, unsafe_record.policyname;
  end if;

  if to_regprocedure('public.veroxa_momo_readiness_summary_v1(uuid)') is null then
    raise exception 'Fail-closed readiness summary RPC is missing';
  end if;

  if to_regprocedure('public.veroxa_momo_client_snapshot_v1(uuid)') is null
     or to_regprocedure('public.veroxa_apply_confirmation_v1(uuid,public.veroxa_review_status_v1,jsonb,text)') is null
     or to_regprocedure('public.veroxa_register_primary_contact_v1(uuid,text,text,text)') is null
     or to_regprocedure('public.veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamp with time zone)') is null
     or to_regprocedure('public.veroxa_retry_work_item_v1(uuid)') is null then
    raise exception 'Required client/Team transactional RPC contract is incomplete';
  end if;
  if not exists (
    select 1 from pg_proc
    where oid = 'public.veroxa_momo_client_snapshot_v1(uuid)'::regprocedure
      and prosecdef
      and 'search_path=""' = any(coalesce(proconfig, '{}'::text[]))
  ) then
    raise exception 'Client snapshot must be SECURITY DEFINER with empty search_path';
  end if;
  if has_function_privilege('anon', 'public.veroxa_momo_client_snapshot_v1(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.veroxa_momo_client_snapshot_v1(uuid)', 'execute') then
    raise exception 'Client snapshot execute privileges are unsafe';
  end if;
  if exists (
    select 1 from pg_proc where oid in (
      'public.veroxa_apply_confirmation_v1(uuid,public.veroxa_review_status_v1,jsonb,text)'::regprocedure,
      'public.veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamp with time zone)'::regprocedure,
      'public.veroxa_retry_work_item_v1(uuid)'::regprocedure
    ) and prosecdef
  ) then
    raise exception 'Write RPCs must remain SECURITY INVOKER';
  end if;
  if has_function_privilege('anon', 'public.veroxa_momo_readiness_summary_v1(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.veroxa_momo_readiness_summary_v1(uuid)', 'execute') then
    raise exception 'Readiness RPC execute privileges are unsafe';
  end if;
  if exists (
    select 1 from pg_proc
    where oid = 'public.veroxa_momo_readiness_summary_v1(uuid)'::regprocedure
      and prosecdef
  ) then
    raise exception 'Readiness RPC must remain security invoker';
  end if;

  foreach table_name in array array[
    'veroxa_readiness_gate_validate','veroxa_publish_queue_approval_gate',
    'veroxa_review_records_approval_gate','veroxa_reports_evidence_gate',
    'veroxa_media_usage_record_reuse','veroxa_content_calendar_approval_gate',
    'veroxa_confirmations_subject_guard','veroxa_approvals_subject_guard',
    'veroxa_truth_fields_revision_guard','veroxa_content_items_owner_confirmation_guard'
  ] loop
    if not exists (select 1 from pg_trigger where tgname = table_name and not tgisinternal) then
      raise exception 'Required safety/lifecycle trigger is missing: %', table_name;
    end if;
  end loop;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'veroxa_restaurant_media_client_delete_orphan'
  ) then
    raise exception 'Caller-owned orphan media cleanup policy is missing';
  end if;
end $$;
$catalog$, 'Momo operating schema, forced RLS, grants, and lifecycle gates are fail-closed');

select lives_ok($workflow$
do $$
declare
  v_restaurant_id uuid := '30000000-0000-0000-0000-000000000001';
  v_other_restaurant_id uuid := '30000000-0000-0000-0000-000000000002';
  v_team_user_id uuid := '31000000-0000-0000-0000-000000000001';
  v_client_user_id uuid := '31000000-0000-0000-0000-000000000002';
  v_truth_id uuid;
  v_confirmation_id uuid;
  v_contact_id uuid;
  v_work_item_id uuid;
  v_media_asset_id uuid;
  v_media_rights_id uuid;
  v_strategy_id uuid;
  v_item_id uuid;
  v_variant_id uuid;
  v_pending_variant_id uuid;
  v_owner_item_id uuid;
  v_owner_variant_id uuid;
  v_owner_confirmation_id uuid;
  v_pending_owner_item_id uuid;
  v_team_review_id uuid;
  v_approval_id uuid;
  v_connection_id uuid;
  v_required integer;
  v_verified integer;
  v_blockers integer;
  v_can_activate boolean;
  v_visible integer;
  v_snapshot jsonb;
begin
  insert into public.veroxa_restaurants (id, name, city, state, status)
  values
    (v_restaurant_id, 'Momo Test Scope', 'San Antonio', 'TX', 'active'),
    (v_other_restaurant_id, 'Non-operational Test Restaurant', 'Austin', 'TX', 'active');
  insert into veroxa_private.operational_restaurant_scope (scope_key, restaurant_id, enabled)
  values ('momo_house_san_antonio', v_restaurant_id, true);
  insert into veroxa_private.auth_identity_allowlist (email, role, display_name, restaurant_id, enabled)
  values
    ('momo-os-team@veroxa.invalid', 'team', 'Momo OS Team', v_restaurant_id, true),
    ('momo-os-client@veroxa.invalid', 'client', 'Momo OS Client', v_restaurant_id, true);
  insert into auth.users (
    id, instance_id, aud, role, email, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_team_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'momo-os-team@veroxa.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_client_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'momo-os-client@veroxa.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into storage.objects (bucket_id, name, owner_id, metadata)
  values (
    'restaurant-media',
    'restaurants/' || v_restaurant_id::text || '/uploads/2026/07/32000000-0000-0000-0000-000000000001.jpg',
    v_client_user_id::text,
    '{"mimetype":"image/jpeg","size":1234}'::jsonb
  );

  -- Even a privileged writer cannot create operations outside the singleton.
  begin
    insert into public.veroxa_onboarding_steps
      (restaurant_id, step_key, title, position)
    values (v_other_restaurant_id, 'welcome', 'Denied', 1);
    raise exception 'A second operational restaurant bypassed the Momo scope trigger';
  exception when check_violation then null;
  end;

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated'
  )::text, true);
  execute 'set local role authenticated';

  insert into public.veroxa_restaurant_truth_fields
    (restaurant_id, field_key, section, value_json, status, source, created_by)
  values
    (v_restaurant_id, 'identity.display_name', 'identity', '"Owner confirmation pending"'::jsonb,
      'needs_owner_confirmation', 'team', v_team_user_id)
  returning id into v_truth_id;

  insert into public.veroxa_readiness_dimensions
    (restaurant_id, dimension_key, label)
  values
    (v_restaurant_id, 'business_truth_and_onboarding', 'Business truth'),
    (v_restaurant_id, 'media_and_rights', 'Media and rights');

  begin
    update public.veroxa_readiness_dimensions
    set status = 'verified', verified_by = v_team_user_id, verified_at = now()
    where restaurant_id = v_restaurant_id;
    raise exception 'Verified readiness accepted empty evidence';
  exception when check_violation then null;
  end;

  insert into public.veroxa_readiness_gate_runs
    (restaurant_id, status, required_count, verified_count, blocker_count, evaluated_by)
  values (v_restaurant_id, 'blocked', 2, 0, 2, v_team_user_id);

  begin
    insert into public.veroxa_readiness_gate_runs
      (restaurant_id, status, required_count, verified_count, blocker_count, evaluated_by)
    values (v_restaurant_id, 'verified', 2, 2, 0, v_team_user_id);
    raise exception 'Final readiness gate accepted an unverified snapshot';
  exception when check_violation then null;
  end;

  -- Approval-controlled Meta queue: one approved variant is visible to client;
  -- the pending variant remains internal.
  insert into public.veroxa_content_strategies
    (restaurant_id, title, status, created_by)
  values (v_restaurant_id, 'Verified test strategy', 'pending', v_team_user_id)
  returning id into v_strategy_id;
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'content_strategy', v_strategy_id, 'team_review', v_team_user_id)
  returning id into v_team_review_id;
  perform * from public.veroxa_apply_approval_v1(v_team_review_id, 'approved', 'Strategy review');

  insert into public.veroxa_content_items
    (restaurant_id, strategy_id, title, concept, status, created_by)
  values (v_restaurant_id, v_strategy_id, 'Approved content', 'Evidence-backed concept',
    'pending', v_team_user_id)
  returning id into v_item_id;
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'content_item', v_item_id, 'team_review', v_team_user_id)
  returning id into v_team_review_id;
  perform * from public.veroxa_apply_approval_v1(v_team_review_id, 'approved', 'Item review');

  insert into public.veroxa_content_variants
    (restaurant_id, content_item_id, platform, caption, status)
  values (v_restaurant_id, v_item_id, 'instagram', 'Approved test caption', 'pending')
  returning id into v_variant_id;
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'content_variant', v_variant_id, 'team_review', v_team_user_id)
  returning id into v_team_review_id;
  perform * from public.veroxa_apply_approval_v1(v_team_review_id, 'approved', 'Variant review');

  with pending_item as (
    insert into public.veroxa_content_items
      (restaurant_id, title, concept, status, created_by)
    values (v_restaurant_id, 'Internal pending content', 'Not client-visible', 'pending', v_team_user_id)
    returning id
  )
  insert into public.veroxa_content_variants
    (restaurant_id, content_item_id, platform, caption, status)
  select v_restaurant_id, id, 'facebook', 'Pending internal caption', 'pending'
  from pending_item
  returning id into v_pending_variant_id;

  begin
    insert into public.veroxa_content_calendar
      (restaurant_id, variant_id, status, created_by)
    values (v_restaurant_id, v_pending_variant_id, 'approved', v_team_user_id);
    raise exception 'Content calendar accepted an unapproved variant';
  exception when check_violation then null;
  end;

  insert into public.veroxa_content_items
    (restaurant_id, title, concept, status, requires_owner_confirmation, created_by)
  values
    (v_restaurant_id, 'Owner-confirmed direction', 'Requires owner evidence',
     'in_review', true, v_team_user_id)
  returning id into v_owner_item_id;

  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'content_item', v_owner_item_id, 'team_review', v_team_user_id)
  returning id into v_team_review_id;
  begin
    perform * from public.veroxa_apply_approval_v1(v_team_review_id, 'approved', 'Must wait');
    raise exception 'Owner-required item became approved before client confirmation';
  exception when check_violation then null;
  end;

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_client_user_id::text, 'role', 'authenticated'
  )::text, true);
  execute 'set local role authenticated';
  insert into public.veroxa_confirmations (
    restaurant_id, subject_type, subject_id, confirmation_kind,
    decision, submitted_by
  ) values (
    v_restaurant_id, 'content_item', v_owner_item_id, 'content_direction',
    'confirm', v_client_user_id
  );
  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated'
  )::text, true);
  execute 'set local role authenticated';
  select id into v_owner_confirmation_id
  from public.veroxa_confirmations
  where restaurant_id = v_restaurant_id
    and subject_type = 'content_item'
    and subject_id = v_owner_item_id
    and submitted_by = v_client_user_id;
  perform * from public.veroxa_apply_confirmation_v1(
    v_owner_confirmation_id, 'approved', null, 'pgTAP owner confirmation'
  );
  begin
    update public.veroxa_confirmations
    set confirmation_kind = 'business_truth'
    where id = v_owner_confirmation_id;
    raise exception 'Kind-only confirmation update bypassed subject pairing';
  exception when check_violation then null;
  end;
  perform * from public.veroxa_apply_approval_v1(v_team_review_id, 'approved', 'Owner confirmed');
  insert into public.veroxa_content_variants
    (restaurant_id, content_item_id, platform, caption, status)
  values
    (v_restaurant_id, v_owner_item_id, 'google_business',
     'Owner-confirmed direction test', 'pending')
  returning id into v_owner_variant_id;
  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, requested_by)
  values (v_restaurant_id, 'content_variant', v_owner_variant_id, 'team_review', v_team_user_id)
  returning id into v_team_review_id;
  perform * from public.veroxa_apply_approval_v1(v_team_review_id, 'approved', 'Owner variant review');
  insert into public.veroxa_content_calendar
    (restaurant_id, variant_id, status, created_by)
  values (v_restaurant_id, v_owner_variant_id, 'approved', v_team_user_id);

  begin
    insert into public.veroxa_approvals (
      restaurant_id, subject_type, subject_id, approval_kind, requested_by
    ) values (
      v_restaurant_id, 'content_variant', gen_random_uuid(), 'publishing', v_team_user_id
    );
    raise exception 'Approval accepted a missing/cross-subject identifier';
  exception when foreign_key_violation then null;
  end;

  insert into public.veroxa_approvals
    (restaurant_id, subject_type, subject_id, approval_kind, status,
     requested_by)
  values
    (v_restaurant_id, 'content_variant', v_variant_id, 'publishing', 'pending',
     v_team_user_id)
  returning id into v_approval_id;
  begin
    insert into public.veroxa_approvals (
      restaurant_id, subject_type, subject_id, approval_kind, requested_by
    ) values (
      v_restaurant_id, 'content_variant', v_variant_id, 'publishing', v_team_user_id
    );
    raise exception 'Duplicate active approval was accepted';
  exception when unique_violation then null;
  end;
  perform * from public.veroxa_apply_approval_v1(
    v_approval_id, 'approved', 'pgTAP publishing approval'
  );
  begin
    insert into public.veroxa_provider_connections (
      restaurant_id, provider, status, capabilities,
      owner_authorized_by, owner_authorized_at, last_verified_at
    ) values (
      v_restaurant_id, 'meta', 'connected', '["instagram_publish"]'::jsonb,
      v_team_user_id, now(), now()
    );
    raise exception 'Provider connection accepted Team as owner authorizer';
  exception when check_violation then null;
  end;
  insert into public.veroxa_provider_connections
    (restaurant_id, provider, external_account_id, display_label, status, capabilities,
     owner_authorized_by, owner_authorized_at, last_verified_at)
  values
    (v_restaurant_id, 'meta', 'test-account-id', 'Test Meta account', 'connected',
     '["instagram_publish"]'::jsonb,
     v_client_user_id, now(), now())
  returning id into v_connection_id;
  insert into public.veroxa_publish_queue
    (restaurant_id, connection_id, variant_id, approval_id, status, created_by)
  values
    (v_restaurant_id, v_connection_id, v_variant_id, v_approval_id, 'approved', v_team_user_id);

  begin
    update public.veroxa_publish_queue set status = 'queued'
    where restaurant_id = v_restaurant_id and variant_id = v_variant_id;
    raise exception 'Publish execution bypassed final readiness';
  exception when check_violation then null;
  end;

  update public.veroxa_readiness_dimensions
  set status = 'verified', verified_by = v_team_user_id, verified_at = now(),
      evidence = jsonb_build_array(jsonb_build_object('kind','pgTAP','verified',true)),
      blockers = '[]'::jsonb
  where restaurant_id = v_restaurant_id;
  select required_count, verified_count, blocker_count, can_activate
  into v_required, v_verified, v_blockers, v_can_activate
  from public.veroxa_momo_readiness_summary_v1(v_restaurant_id);
  if v_required <> 2 or v_verified <> 2 or v_blockers <> 0 or not v_can_activate then
    raise exception 'Readiness RPC did not become verified after every required dimension passed';
  end if;
  insert into public.veroxa_readiness_gate_runs
    (restaurant_id, status, required_count, verified_count, blocker_count,
     evidence_snapshot, blocker_snapshot, evaluated_by)
  values (
    v_restaurant_id, 'verified', 2, 2, 0,
    '[{"fabricated":true}]'::jsonb, '[{"fabricated":true}]'::jsonb, v_team_user_id
  );
  if exists (
    select 1 from public.veroxa_readiness_gate_runs
    where restaurant_id = v_restaurant_id and status = 'verified'
      and (jsonb_array_length(evidence_snapshot) <> 2
        or jsonb_array_length(blocker_snapshot) <> 0
        or evidence_snapshot @> '[{"fabricated":true}]'::jsonb)
  ) then
    raise exception 'Final readiness snapshots were not derived from current dimensions';
  end if;
  update public.veroxa_publish_queue set status = 'queued'
  where restaurant_id = v_restaurant_id and variant_id = v_variant_id;

  insert into public.veroxa_content_items (
    restaurant_id, title, concept, master_caption, status,
    requires_owner_confirmation, created_by
  ) values (
    v_restaurant_id, 'Pending owner direction', 'Client-safe concept preview',
    'Client-safe caption preview', 'in_review', true, v_team_user_id
  ) returning id into v_pending_owner_item_id;

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_client_user_id::text, 'role', 'authenticated'
  )::text, true);
  execute 'set local role authenticated';

  select count(*) into v_visible from public.veroxa_content_variants;
  if v_visible <> 0 then
    raise exception 'Client can bypass sanitized snapshot through content base table';
  end if;
  select count(*) into v_visible from public.veroxa_provider_connections;
  if v_visible <> 0 then
    raise exception 'Client can read internal provider connection columns directly';
  end if;

  v_contact_id := public.veroxa_register_primary_contact_v1(
    v_restaurant_id, 'Owner Test', 'owner-test@veroxa.invalid', null
  );

  select registered.asset_id, registered.rights_id
  into v_media_asset_id, v_media_rights_id
  from public.veroxa_register_momo_media_v1(
    v_restaurant_id,
    'restaurants/' || v_restaurant_id::text || '/uploads/2026/07/32000000-0000-0000-0000-000000000001.jpg',
    'image/jpeg', 1234, 'momo-test.jpg', 'Owner-confirmed test upload',
    '["facebook","instagram"]'::jsonb, now() + interval '30 days'
  ) registered;
  if v_media_asset_id is null or v_media_rights_id is null then
    raise exception 'Atomic media and rights registration returned no identifiers';
  end if;

  begin
    insert into public.veroxa_confirmations (
      restaurant_id, subject_type, subject_id, confirmation_kind, decision, submitted_by
    ) values (
      v_restaurant_id, 'truth_field', gen_random_uuid(), 'business_truth', 'confirm', v_client_user_id
    );
    raise exception 'confirmation_subject_not_in_momo_scope: missing/cross-scope subject was accepted';
  exception when foreign_key_violation then null;
  end;

  insert into public.veroxa_confirmations
    (restaurant_id, subject_type, subject_id, confirmation_kind, decision,
     proposed_value, submitted_by)
  values
    (v_restaurant_id, 'truth_field', v_truth_id, 'business_truth', 'correct',
     '"Momo Owner Confirmed"'::jsonb, v_client_user_id);

  begin
    insert into public.veroxa_confirmations (
      restaurant_id, subject_type, subject_id, confirmation_kind, decision, submitted_by
    ) values (
      v_restaurant_id, 'truth_field', v_truth_id, 'business_truth', 'confirm', v_client_user_id
    );
    raise exception 'Duplicate active confirmation was accepted';
  exception when unique_violation then null;
  end;

  insert into public.veroxa_confirmations (
    restaurant_id, subject_type, subject_id, confirmation_kind, decision, submitted_by
  ) values (
    v_restaurant_id, 'content_item', v_pending_owner_item_id,
    'content_direction', 'confirm', v_client_user_id
  );

  v_snapshot := public.veroxa_momo_client_snapshot_v1(v_restaurant_id);
  if v_snapshot ->> 'restaurantId' <> v_restaurant_id::text
     or jsonb_array_length(v_snapshot -> 'onboarding' -> 'truthFields') = 0
     or jsonb_array_length(v_snapshot -> 'media') <> 1
     or (v_snapshot -> 'media' -> 0 ->> 'storagePath') is null
     or (v_snapshot -> 'media' -> 0 ->> 'reviewStatus') is not null
     or jsonb_array_length(v_snapshot -> 'contentCalendar') <> 1
     or jsonb_array_length(v_snapshot -> 'pendingContentConfirmations') <> 1
     or v_snapshot -> 'pendingContentConfirmations' -> 0 ->> 'confirmationStatus' <> 'pending' then
    raise exception 'Sanitized client snapshot omitted truthful safe data';
  end if;
  if v_snapshot::text ~ '"(qualityNotes|externalAccountId|scopes|lastError|evidenceEventIds|blockerSnapshot|evidenceSnapshot)"' then
    raise exception 'Sanitized client snapshot exposed an internal-only field';
  end if;

  begin
    insert into public.veroxa_restaurant_truth_fields
      (restaurant_id, field_key, section, value_json, status, source, created_by)
    values
      (v_restaurant_id, 'phone.primary', 'phone', '"2105550100"'::jsonb,
       'needs_owner_confirmation', 'owner', v_client_user_id);
    raise exception 'Client bypassed append-only confirmation workflow';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.veroxa_provider_connections (restaurant_id, provider)
    values (v_restaurant_id, 'google_business');
    raise exception 'Client created a Team-only provider connection';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', v_team_user_id::text, 'role', 'authenticated'
  )::text, true);
  execute 'set local role authenticated';

  select id into v_confirmation_id
  from public.veroxa_confirmations
  where restaurant_id = v_restaurant_id
    and subject_type = 'truth_field'
    and subject_id = v_truth_id
    and submitted_by = v_client_user_id;

  begin
    perform * from public.veroxa_apply_confirmation_v1(
      v_confirmation_id, 'approved', '"Team Override"'::jsonb, 'Must fail'
    );
    raise exception 'Team overrode a client-proposed owner correction';
  exception when check_violation then null;
  end;
  perform * from public.veroxa_apply_confirmation_v1(
    v_confirmation_id, 'approved', null,
    'Applied transactionally by pgTAP'
  );
  if not exists (
    select 1 from public.veroxa_restaurant_truth_fields
    where id = v_truth_id and status = 'owner_confirmed'
      and owner_confirmed_by = v_client_user_id
      and value_json = '"Momo Owner Confirmed"'::jsonb
  ) or not exists (
    select 1 from public.veroxa_confirmations
    where id = v_confirmation_id and status = 'approved'
      and reviewed_by = v_team_user_id
  ) then
    raise exception 'Transactional confirmation did not apply destination and decision together';
  end if;

  begin
    insert into public.veroxa_media_usage (
      restaurant_id, asset_id, content_item_id, platform, usage_kind, recorded_by
    ) values (
      v_restaurant_id, v_media_asset_id, v_item_id, 'instagram', 'scheduled', v_team_user_id
    );
    raise exception 'Public media usage bypassed rights plus approved-review gate';
  exception when check_violation then null;
  end;
  perform * from public.veroxa_review_momo_media_v1(
    v_media_asset_id, 'approved', 92::smallint, 'Clear owner-confirmed media', true
  );
  insert into public.veroxa_media_usage (
    restaurant_id, asset_id, content_item_id, platform, usage_kind, recorded_by
  ) values (
    v_restaurant_id, v_media_asset_id, v_item_id, 'instagram', 'scheduled', v_team_user_id
  );
  perform * from public.veroxa_review_momo_media_v1(
    v_media_asset_id, 'changes_requested', 60::smallint, 'A brighter version is helpful', false
  );
  if (select count(*) from public.veroxa_media_reviews where asset_id = v_media_asset_id) <> 2
     or (select count(*) from public.veroxa_media_reviews where asset_id = v_media_asset_id and is_current) <> 1
     or not exists (
       select 1 from public.veroxa_media_assets
       where id = v_media_asset_id and status = 'better_version_helpful'
     ) then
    raise exception 'Transactional media review did not supersede history and update asset state';
  end if;

  perform public.veroxa_create_truth_revision_v1(
    v_restaurant_id, 'identity.display_name', 'identity',
    '"New Team Proposal"'::jsonb, 'team'
  );
  if not exists (
    select 1 from public.veroxa_restaurant_truth_fields
    where id = v_truth_id and status = 'superseded' and not is_current
      and owner_confirmed_by = v_client_user_id
  ) then
    raise exception 'Owner-confirmed truth was not preserved as superseded history';
  end if;

  insert into public.veroxa_work_items (
    restaurant_id, work_type, title, status, max_attempts, created_by, blocked_reason
  ) values (
    v_restaurant_id, 'monitoring', 'Retry test', 'blocked', 2,
    v_team_user_id, 'Transient test blocker'
  ) returning id into v_work_item_id;
  perform * from public.veroxa_retry_work_item_v1(v_work_item_id);
  if not exists (
    select 1 from public.veroxa_job_attempts
    where work_item_id = v_work_item_id and attempt_number = 1 and status = 'retrying'
  ) or not exists (
    select 1 from public.veroxa_work_items
    where id = v_work_item_id and attempt_count = 1 and status = 'retrying'
      and next_attempt_at > now()
  ) then
    raise exception 'Retry RPC did not create a bounded attempt ledger and backoff';
  end if;
  execute 'reset role';
end $$;
$workflow$, 'Momo-only tenancy, Team/client RLS, approvals, and final readiness work end to end');

select * from finish();
rollback;
