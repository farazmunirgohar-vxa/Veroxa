-- Focused pgTAP coverage for the forward-only owner truth, Team Ready
-- disposition, and generic private-media assessment/association controls.
-- All fixtures roll back. No provider, publish, schedule, or external write is
-- attempted by this suite.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select lives_ok($catalog$
do $$
declare
  table_name text;
  function_name text;
  function_record record;
  function_source text;
begin
  foreach table_name in array array[
    'veroxa_momo_ready_disposition_events_v1',
    'veroxa_private_media_assessment_intakes_v1',
    'veroxa_private_media_assessments_v1',
    'veroxa_private_media_assessment_asset_links_v1',
    'veroxa_private_media_assessment_events_v1',
    'veroxa_private_media_assessment_tags_v1',
    'veroxa_media_restaurant_associations_v1'
  ] loop
    if to_regclass('public.' || table_name) is null
       or not exists (
         select 1
         from pg_catalog.pg_class relation
         join pg_catalog.pg_namespace namespace
           on namespace.oid = relation.relnamespace
         where namespace.nspname = 'public'
           and relation.relname = table_name
           and relation.relrowsecurity
           and relation.relforcerowsecurity
       ) then
      raise exception 'Protected control table does not force RLS: %',
        table_name;
    end if;
    if has_table_privilege('anon', 'public.' || table_name, 'select')
       or has_table_privilege(
         'authenticated', 'public.' || table_name, 'select'
       )
       or has_table_privilege(
         'authenticated', 'public.' || table_name, 'insert'
       )
       or has_table_privilege(
         'authenticated', 'public.' || table_name, 'update'
       )
       or has_table_privilege(
         'authenticated', 'public.' || table_name, 'delete'
       )
       or has_table_privilege(
         'service_role', 'public.' || table_name, 'select'
       )
       or has_table_privilege(
         'service_role', 'public.' || table_name, 'insert'
       ) then
      raise exception 'Protected control table grant is too broad: %',
        table_name;
    end if;
  end loop;

  foreach function_name in array array[
    'public.veroxa_submit_momo_confirmation_v1(uuid,text,uuid,text,text,jsonb,text)',
    'public.veroxa_owner_truth_subject_snapshots_v1(uuid)',
    'public.veroxa_owner_apply_truth_confirmation_v1(uuid,uuid,text,text,jsonb,text)',
    'public.veroxa_momo_ready_review_status_v2(uuid,uuid)',
    'public.veroxa_momo_client_upload_status_v4(uuid)'
  ] loop
    select procedure.prosecdef, procedure.proconfig
      into function_record
    from pg_catalog.pg_proc procedure
    where procedure.oid = to_regprocedure(function_name);
    if not found
       or not function_record.prosecdef
       or not ('search_path=""' = any(
         coalesce(function_record.proconfig, '{}'::text[])
       ))
       or has_function_privilege('anon', function_name, 'execute')
       or has_function_privilege('service_role', function_name, 'execute')
       or not has_function_privilege(
         'authenticated', function_name, 'execute'
       ) then
      raise exception 'Authenticated RPC posture mismatch: %', function_name;
    end if;
  end loop;

  foreach function_name in array array[
    'public.veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamptz)',
    'public.veroxa_register_momo_media_v2(uuid,text,text,bigint,text,text,jsonb,date)',
    'public.veroxa_register_team_private_media_v1(uuid,text,text,bigint,text,text,jsonb,date)',
    'public.veroxa_reserve_private_media_assessment_v1(uuid,uuid,text,text,text,text,text,bigint,uuid)',
    'public.veroxa_start_private_media_assessment_provider_v1(uuid,text,uuid)',
    'public.veroxa_complete_private_media_assessment_v1(uuid,text,text,jsonb,text,text,bigint,text,jsonb,uuid)',
    'public.veroxa_fail_private_media_assessment_v1(uuid,text,text,text,boolean,bigint,jsonb,uuid)',
    'public.veroxa_record_media_restaurant_association_v1(uuid,uuid,uuid,text,text,text)',
    'public.veroxa_reserve_momo_content_ai_run_v1(uuid,uuid,text,text,text)',
    'public.veroxa_begin_momo_content_ai_dispatch_v1(uuid,text,uuid,uuid,text)',
    'public.veroxa_momo_upload_pipeline_v2(text,jsonb)',
    'public.veroxa_decide_momo_ready_package_v2(uuid,text,text,text,text)',
    'public.veroxa_record_momo_ready_disposition_v1(uuid,uuid,text,text,text,text,jsonb)',
    'public.veroxa_momo_team_ready_active_v1(uuid)',
    'public.veroxa_momo_team_ready_evidence_v1(uuid)',
    'public.veroxa_momo_team_ready_freshness_v1(uuid,uuid,text,text)'
  ] loop
    select procedure.prosecdef, procedure.proconfig
      into function_record
    from pg_catalog.pg_proc procedure
    where procedure.oid = to_regprocedure(function_name);
    if not found
       or not function_record.prosecdef
       or not ('search_path=""' = any(
         coalesce(function_record.proconfig, '{}'::text[])
       ))
       or has_function_privilege('anon', function_name, 'execute')
       or has_function_privilege(
         'authenticated', function_name, 'execute'
       )
       or has_function_privilege(
         'service_role', function_name, 'execute'
       ) then
      raise exception 'Held lifecycle RPC posture mismatch: %',
        function_name;
    end if;
  end loop;

  function_name :=
    'public.veroxa_finalize_private_media_assessment_intake_v1(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text,uuid)';
  select procedure.prosecdef, procedure.proconfig
    into function_record
  from pg_catalog.pg_proc procedure
  where procedure.oid = to_regprocedure(function_name);
  if not found
     or not function_record.prosecdef
     or not ('search_path=""' = any(
       coalesce(function_record.proconfig, '{}'::text[])
     ))
     or has_function_privilege('anon', function_name, 'execute')
     or has_function_privilege('authenticated', function_name, 'execute')
     or not has_function_privilege('service_role', function_name, 'execute') then
    raise exception 'Lifecycle finalizer service-role posture mismatch: %',
      function_name;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conrelid =
      'public.veroxa_media_restaurant_associations_v1'::regclass
      and constraint_record.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_record.oid) like
        '%restaurant_id, asset_id, rights_id, source_content_sha256%'
  ) then
    raise exception 'Exact association tuple is not terminally unique';
  end if;
  if to_regclass(
       'public.veroxa_momo_source_media_discard_terminal_v1'
     ) is null
     or not exists (
       select 1
       from pg_catalog.pg_index index_record
       where index_record.indexrelid =
         'public.veroxa_momo_source_media_discard_terminal_v1'::regclass
         and index_record.indisunique
         and position('discarded' in pg_catalog.pg_get_expr(
           index_record.indpred, index_record.indrelid
         )) > 0
     ) then
    raise exception 'Source-media discard lacks a terminal partial unique key';
  end if;

  function_source := pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.veroxa_record_momo_ready_disposition_v1(uuid,uuid,text,text,text,text,jsonb)'
  ));
  if position('lock_momo_source_media_v1' in function_source) = 0
     or position('momo_ready_v2_approval_required' in function_source) = 0
     or position('veroxa_record_momo_ready_disposition_pre_source_lock_v1'
       in function_source) = 0 then
    raise exception 'Ready discard wrapper lost v2-only approval or lock';
  end if;
  function_source := pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.veroxa_record_momo_ready_disposition_pre_source_lock_v1(uuid,uuid,text,text,text,text,jsonb)'
  ));
  if position('for update' in lower(function_source)) = 0
     or position('source_media_discarded_terminal' in function_source) = 0
     or position('ready_package_current_evidence_refresh_required'
       in function_source) = 0 then
    raise exception 'Ready discard delegate lost terminal or freshness guard';
  end if;

  function_source := pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.veroxa_submit_momo_confirmation_v1(uuid,text,uuid,text,text,jsonb,text)'
  ));
  if position('for share' in lower(function_source)) = 0
     or position('truth_subject_changed_refresh_required'
       in function_source) = 0 then
    raise exception 'Legacy truth proposal is not serialized with owner apply';
  end if;

  function_source := pg_catalog.pg_get_functiondef(to_regprocedure(
    'veroxa_private.momo_advance_verified_asset_v2(jsonb)'
  ));
  if position('media_has_current_real_owner_association_v1'
       in function_source) = 0
     or position('link.asset_id' in function_source) = 0
     or position('for share' in lower(function_source)) = 0
     or position('lock_momo_source_media_v1' in lower(function_source)) = 0
     or position('lock_momo_source_media_v1' in lower(function_source)) >
       position('for share' in lower(function_source)) then
    raise exception 'Duplicate selector lost exact gate or source-first order';
  end if;

  function_source := pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.veroxa_momo_client_upload_status_v4(uuid)'
  ));
  if position('provider_response_id' in function_source) > 0
     or position('accounted_microusd' in function_source) > 0
     or position('provider_error_code' in function_source) > 0
     or position('momo_content_ai_current_evidence_v1'
       in function_source) = 0
     or position('source_media_discarded' in function_source) = 0 then
    raise exception 'Client v4 leaked internals or lost Ready evidence gate';
  end if;

  function_source := pg_catalog.pg_get_functiondef(to_regprocedure(
    'veroxa_private.momo_content_ai_current_evidence_v1(uuid,uuid)'
  ));
  if position('momo_source_media_discarded_v1' in function_source) = 0
     or not exists (
       select 1
       from pg_catalog.pg_trigger trigger_record
       where trigger_record.tgname =
         'aa_veroxa_momo_content_provider_start_discard_guard_v1'
         and trigger_record.tgrelid =
           'public.veroxa_momo_content_ai_runs'::regclass
         and not trigger_record.tgisinternal
     ) then
    raise exception 'Content dispatch lost source-media tombstone gate';
  end if;

  foreach function_name in array array[
    'public.veroxa_reserve_private_media_assessment_v1(uuid,uuid,text,text,text,text,text,bigint,uuid)',
    'public.veroxa_start_private_media_assessment_provider_v1(uuid,text,uuid)',
    'veroxa_private.momo_advance_verified_asset_v2(jsonb)',
    'veroxa_private.guard_momo_content_run_association_v1()',
    'veroxa_private.guard_momo_ready_association_v1()'
  ] loop
    function_source := pg_catalog.pg_get_functiondef(
      to_regprocedure(function_name)
    );
    if position('momo_source_media_discarded_v1' in function_source) = 0 then
      raise exception 'Source-media tombstone gate missing from %',
        function_name;
    end if;
  end loop;

  function_source := lower(pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.veroxa_fail_private_media_assessment_v1(uuid,text,text,text,boolean,bigint,jsonb,uuid)'
  )));
  if position('20000000' in function_source) = 0
     or position('conservative_reservation' in function_source) = 0
     or position('private_media_assessment_failure_replay_conflict'
       in function_source) = 0
     or position('private_media_assessment_already_completed'
       in function_source) = 0
     or position('private_media_assessment_budget_control_missing'
       in function_source) = 0
     or position('from veroxa_private.momo_ai_budget_controls'
       in function_source) = 0
     or position('from veroxa_private.momo_ai_budget_controls'
       in function_source) > position('for update' in function_source) then
    raise exception 'Failed assessment overrun settlement is incomplete';
  end if;

  function_source := lower(pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.veroxa_start_private_media_assessment_provider_v1(uuid,text,uuid)'
  )));
  if position('lock_momo_source_media_v1' in function_source) = 0
     or position('from veroxa_private.momo_ai_budget_controls'
       in function_source) = 0
     or position('for update' in function_source) = 0
     or position('lock_momo_source_media_v1' in function_source) >
       position('from veroxa_private.momo_ai_budget_controls'
         in function_source)
     or position('from veroxa_private.momo_ai_budget_controls'
       in function_source) > position('for update' in function_source)
     or position('twenty_usd_cap_exceeded_before_provider'
       in function_source) = 0 then
    raise exception 'Assessment start lost source-budget-row cap order';
  end if;

  function_source := lower(pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.veroxa_record_media_restaurant_association_v1(uuid,uuid,uuid,text,text,text)'
  )));
  if position('lock_momo_source_media_v1' in function_source) = 0
     or position('for share' in function_source) = 0
     or position('lock_momo_source_media_v1' in function_source) >
       position('for share' in function_source)
     or position('source_media_discarded_terminal' in function_source) = 0 then
    raise exception 'Association lost source-first terminal lock order';
  end if;

  function_source := lower(pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.veroxa_reserve_momo_content_ai_run_v1(uuid,uuid,text,text,text)'
  )));
  if position('lock_momo_source_media_v1' in function_source) = 0
     or position('momo_source_media_discarded_v1' in function_source) = 0
     or position('source_media_discarded_terminal' in function_source) = 0
     or position('veroxa_reserve_momo_content_ai_run_v5_pre_source_lock_v1'
       in function_source) = 0
     or position('lock_momo_source_media_v1' in function_source) >
       position('momo_source_media_discarded_v1' in function_source)
     or position('momo_source_media_discarded_v1' in function_source) >
       position('for share' in function_source)
     or position('lock_momo_source_media_v1' in function_source) >
       position('for share' in function_source)
     or position('for share' in function_source) > position(
       'veroxa_reserve_momo_content_ai_run_v5_pre_source_lock_v1'
       in function_source
     ) then
    raise exception
      'Content reservation wrapper lost source-first delegate order';
  end if;
  function_source := lower(pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.veroxa_reserve_momo_content_ai_run_v5_pre_source_lock_v1(uuid,uuid,text,text,text)'
  )));
  if position('pg_advisory_xact_lock' in function_source) = 0
     or position('for update' in function_source) = 0 then
    raise exception
      'Content reservation delegate lost idempotency or row locks';
  end if;

  function_source := lower(pg_catalog.pg_get_functiondef(to_regprocedure(
    'veroxa_private.momo_materialize_veroxa_ready_v2(jsonb)'
  )));
  if position('lock_momo_source_media_v1' in function_source) = 0
     or position('momo_source_media_discarded_v1' in function_source) = 0
     or position('source_media_discarded_terminal' in function_source) = 0
     or position('momo_materialize_veroxa_ready_v5_pre_source_lock_v2'
       in function_source) = 0
     or position('lock_momo_source_media_v1' in function_source) >
       position('momo_source_media_discarded_v1' in function_source)
     or position('momo_source_media_discarded_v1' in function_source) >
       position(
         'momo_materialize_veroxa_ready_v5_pre_source_lock_v2'
         in function_source
       ) then
    raise exception
      'Ready materialization wrapper lost source-first delegate order';
  end if;
  function_source := lower(pg_catalog.pg_get_functiondef(to_regprocedure(
    'veroxa_private.momo_materialize_veroxa_ready_v5_pre_source_lock_v2(jsonb)'
  )));
  if position('for update' in function_source) = 0 then
    raise exception 'Ready materialization delegate lost row lock';
  end if;

  foreach function_name in array array[
    'public.veroxa_start_momo_content_ai_run_v1(uuid,text,uuid,uuid)',
    'public.veroxa_begin_momo_content_ai_dispatch_v1(uuid,text,uuid,uuid,text)'
  ] loop
    function_source := lower(pg_catalog.pg_get_functiondef(
      to_regprocedure(function_name)
    ));
    if position('lock_momo_source_media_v1' in function_source) = 0
       or position('source_media_discarded_terminal' in function_source) = 0
       or position('pre_source_lock' in function_source) = 0
       or position('lock_momo_source_media_v1' in function_source) >
         position('pre_source_lock' in function_source) then
      raise exception 'Content lifecycle lost source-first delegate: %',
        function_name;
    end if;
  end loop;
end $$;
$catalog$, 'Control tables, RPC ACLs, locks, exact association, duplicate selection, and sanitized readback are fail closed');

-- The repair keeps public/client mutable ingress held while the private-media
-- lifecycle finalizer remains service-role-only. The remaining grants exist
-- only inside this rollback-only test transaction.
grant execute on function public.veroxa_register_momo_media_v2(
  uuid,text,text,bigint,text,text,jsonb,date
) to authenticated;
grant execute on function
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid,uuid,uuid,text,text,bigint,integer,integer,text,
    jsonb,text,text,text,uuid
  ),
  public.veroxa_reserve_private_media_assessment_v1(
    uuid,uuid,text,text,text,text,text,bigint,uuid
  ),
  public.veroxa_start_private_media_assessment_provider_v1(uuid,text,uuid),
  public.veroxa_complete_private_media_assessment_v1(
    uuid,text,text,jsonb,text,text,bigint,text,jsonb,uuid
  ),
  public.veroxa_fail_private_media_assessment_v1(
    uuid,text,text,text,boolean,bigint,jsonb,uuid
  ) to service_role;
grant execute on function
  public.veroxa_record_media_restaurant_association_v1(
    uuid,uuid,uuid,text,text,text
  ) to authenticated;

select ok(
  veroxa_private.private_media_assessment_output_valid_v1(
    jsonb_build_object(
      'schemaVersion', 'veroxa-private-media-assessment-v1',
      'subject', 'food',
      'visualSummary',
        'Visible subject: food. Objective visual tags: Food visible, Plate visible.',
      'qualityScore', 4,
      'qualityIssues', jsonb_build_array('none'),
      'tags', jsonb_build_array(
        jsonb_build_object(
          'slug', 'food-visible',
          'label', 'Food visible',
          'evidenceClass', 'objective',
          'category', 'scene',
          'confidence', 0.99,
          'uncertainty', null
        ),
        jsonb_build_object(
          'slug', 'plate-visible',
          'label', 'Plate visible',
          'evidenceClass', 'objective',
          'category', 'presentation',
          'confidence', 0.95,
          'uncertainty', null
        ),
        jsonb_build_object(
          'slug', 'possible-dumplings',
          'label', 'Possible dumplings',
          'evidenceClass', 'visual_hypothesis',
          'category', 'dish_hypothesis',
          'confidence', 0.75,
          'uncertainty',
            'Pixels alone cannot confirm this possible visual identity.'
        )
      ),
      'uncertainties', jsonb_build_array(
        'Pixels alone cannot confirm exact dish, ingredient, menu, business, ownership, or restaurant identity.'
      )
    )
  ),
  'Only deterministic, controlled, uncertainty-bounded assessment output is accepted'
);

select ok(
  not veroxa_private.private_media_assessment_output_valid_v1(
    jsonb_build_object(
      'schemaVersion', 'veroxa-private-media-assessment-v1',
      'subject', 'food',
      'visualSummary',
        'Visible subject: food. Objective visual tags: Food visible.',
      'qualityScore', 4,
      'qualityIssues', jsonb_build_array('none'),
      'tags', jsonb_build_array(
        jsonb_build_object(
          'slug', 'food-visible',
          'label', 'Food visible',
          'evidenceClass', 'objective',
          'category', 'scene',
          'confidence', 0.99,
          'uncertainty', null
        ),
        jsonb_build_object(
          'slug', 'possible-san-antonio-tacos',
          'label', 'Possible san-antonio tacos',
          'evidenceClass', 'visual_hypothesis',
          'category', 'dish_hypothesis',
          'confidence', 0.9,
          'uncertainty',
            'Pixels alone cannot confirm this possible visual identity.'
        )
      ),
      'uncertainties', jsonb_build_array(
        'Pixels alone cannot confirm exact dish, ingredient, menu, business, ownership, or restaurant identity.'
      )
    )
  ),
  'Provider prose, restaurant authority claims, and noncanonical hypotheses are rejected'
);

select lives_ok($owner_behavior$
do $$
#variable_conflict use_variable
declare
  restaurant_id uuid := '8a000000-0000-4000-8000-000000000001';
  team_id uuid := '8a000000-0000-4000-8000-000000000002';
  owner_id uuid := '8a000000-0000-4000-8000-000000000003';
  submitted_truth_id uuid;
  applied_truth_id uuid;
  stale_confirmation_id uuid;
  owner_confirmation_id uuid;
  snapshot_sha256 text;
begin
  insert into public.veroxa_restaurants (id, name, city, state, status)
  values (
    restaurant_id, 'Owner Ready Private Controls',
    'San Antonio', 'TX', 'active'
  );
  insert into veroxa_private.operational_restaurant_scope (
    scope_key, restaurant_id, enabled
  ) values ('momo_house_san_antonio', restaurant_id, true)
  on conflict (scope_key) do update
  set restaurant_id = excluded.restaurant_id,
      enabled = excluded.enabled;
  insert into veroxa_private.auth_identity_allowlist (
    email, role, display_name, restaurant_id, enabled
  ) values
    ('owner-ready-team@veroxa.invalid', 'team', 'Control Team',
      restaurant_id, true),
    ('owner-ready-client@veroxa.invalid', 'client', 'Control Owner',
      restaurant_id, true);
  insert into auth.users (
    id, instance_id, aud, role, email, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (team_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'owner-ready-team@veroxa.invalid', now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb, now(), now()),
    (owner_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'owner-ready-client@veroxa.invalid', now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb, now(), now());

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', team_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', team_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  perform public.veroxa_assign_momo_real_owner_authority_v1(
    restaurant_id,
    'owner-ready-client@veroxa.invalid',
    jsonb_build_object(
      'method', 'owner_meeting',
      'verifiedAt', to_char(
        now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'
      ),
      'details', 'Rollback-only owner truth control fixture.'
    )
  );
  submitted_truth_id := (public.veroxa_create_truth_revisions_v1(
    restaurant_id,
    jsonb_build_array(jsonb_build_object(
      'field_key', 'brand.voice',
      'section', 'brand',
      'value_json', '{"text":"Warm and specific"}'::jsonb,
      'source', 'team'
    ))
  ))[1];

  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', owner_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  execute 'set local role authenticated';
  stale_confirmation_id := public.veroxa_submit_momo_confirmation_v1(
    restaurant_id, 'truth_field', submitted_truth_id,
    'business_truth', 'needs_help', null,
    'Legacy exception that the current owner supersedes.'
  );
  select snapshot.subject_snapshot_sha256 into snapshot_sha256
  from public.veroxa_owner_truth_subject_snapshots_v1(restaurant_id) snapshot
  where snapshot.truth_field_id = submitted_truth_id;
  select applied.confirmation_id, applied.applied_truth_id
    into owner_confirmation_id, applied_truth_id
  from public.veroxa_owner_apply_truth_confirmation_v1(
    restaurant_id, submitted_truth_id, snapshot_sha256,
    'confirm', null, 'Owner atomically confirms the current fact.'
  ) applied;
  execute 'reset role';

  if snapshot_sha256 !~ '^[0-9a-f]{64}$'
     or applied_truth_id is null
     or applied_truth_id = submitted_truth_id
     or not exists (
       select 1
       from public.veroxa_confirmations stale
       where stale.id = stale_confirmation_id
         and stale.status = 'rejected'
         and stale.reviewed_by = owner_id
     )
     or not exists (
       select 1
       from public.veroxa_confirmations confirmation
       join veroxa_private.momo_truth_confirmation_applications application
         on application.confirmation_id = confirmation.id
       join public.veroxa_restaurant_truth_fields applied
         on applied.id = application.applied_truth_id
       join public.veroxa_restaurant_truth_fields submitted
         on submitted.id = application.submitted_truth_id
       where confirmation.id = owner_confirmation_id
         and confirmation.status = 'approved'
         and confirmation.evidence_class = 'real_owner'
         and confirmation.subject_snapshot_sha256 = snapshot_sha256
         and application.submitted_truth_id = submitted_truth_id
         and application.applied_truth_id = applied_truth_id
         and application.applied_by = owner_id
         and applied.supersedes_id = submitted.id
         and applied.is_current
         and applied.status = 'owner_confirmed'
         and applied.evidence_class = 'real_owner'
         and not submitted.is_current
         and submitted.status = 'superseded'
     ) then
    raise exception 'Owner atomic truth application lineage is incomplete';
  end if;

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', team_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', team_id::text, true);
  execute 'set local role authenticated';
  begin
    perform public.veroxa_apply_confirmation_v1(
      owner_confirmation_id, 'approved', null,
      'Team must not apply owner confirm/correct truth.'
    );
    raise exception 'Team applied owner-authoritative truth';
  exception when sqlstate '42501' then
    if sqlerrm <>
      'truth_confirm_or_correct_must_be_applied_by_real_owner_client' then
      raise;
    end if;
  end;
  begin
    perform public.veroxa_apply_confirmation_v1(
      '8affffff-ffff-4fff-8fff-ffffffffffff',
      'approved', null, 'Missing confirmation is tenant opaque.'
    );
    raise exception 'Missing confirmation identifier was distinguishable';
  exception when sqlstate '42501' then
    if sqlerrm <> 'momo_team_confirmation_required' then raise; end if;
  end;
  execute 'reset role';
end $$;
$owner_behavior$, 'Active real owner supersedes stale proposals and atomically applies immutable truth lineage; Team cannot apply it');

select lives_ok($private_media_behavior$
do $$
#variable_conflict use_variable
declare
  restaurant_id uuid := '8a000000-0000-4000-8000-000000000001';
  team_id uuid := '8a000000-0000-4000-8000-000000000002';
  owner_id uuid := '8a000000-0000-4000-8000-000000000003';
  asset_a uuid;
  asset_b uuid;
  asset_c uuid;
  asset_d uuid;
  rights_a uuid;
  rights_b uuid;
  rights_c uuid;
  rights_d uuid;
  object_a uuid;
  object_b uuid;
  object_c uuid;
  object_d uuid;
  object_version_a text;
  object_version_b text;
  object_version_c text;
  object_version_d text;
  intake_a uuid;
  intake_b uuid;
  intake_c uuid;
  intake_d uuid;
  assessment_id uuid;
  overrun_assessment_id uuid;
  cap_blocked_assessment_id uuid;
  reused_assessment_id uuid;
  reused_from_id uuid;
  association_a uuid;
  association_b uuid;
  association_replay uuid;
  path_a text := 'restaurants/8a000000-0000-4000-8000-000000000001/uploads/2026/08/8b000000-0000-4000-8000-000000000001.jpg';
  path_b text := 'restaurants/8a000000-0000-4000-8000-000000000001/uploads/2026/08/8b000000-0000-4000-8000-000000000002.jpg';
  path_c text := 'restaurants/8a000000-0000-4000-8000-000000000001/uploads/2026/08/8b000000-0000-4000-8000-000000000003.png';
  path_d text := 'restaurants/8a000000-0000-4000-8000-000000000001/uploads/2026/08/8b000000-0000-4000-8000-000000000004.png';
  source_hash text := repeat('a', 64);
  request_hash text := repeat('b', 64);
  verification_snapshot jsonb;
  verification_canonical text;
  verification_sha256 text;
  output_payload jsonb;
  output_canonical text;
  output_sha256 text;
  platform_ready boolean;
  should_call boolean;
  cap_blocked_status text;
  v4_row jsonb;
begin
  insert into storage.objects (
    bucket_id, name, owner, version, metadata, owner_id
  ) values (
    'restaurant-media', path_a, owner_id,
    'owner-ready-private-a-v1',
    '{"mimetype":"image/jpeg","size":10240}'::jsonb,
    owner_id::text
  ) returning id, version into object_a, object_version_a;
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', owner_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  select registered.asset_id, registered.rights_id
    into asset_a, rights_a
  from public.veroxa_register_momo_media_v2(
    restaurant_id,
    path_a,
    'image/jpeg', 10240, 'canonical.jpg',
    'Rollback-only canonical private assessment fixture.',
    '["instagram"]'::jsonb, null
  ) registered;
  execute 'reset role';

  update public.veroxa_media_rights rights
  set rights_status = 'confirmed',
      confirmed_by = owner_id,
      confirmed_at = clock_timestamp(),
      valid_from = clock_timestamp() - interval '1 day',
      expires_at = clock_timestamp() + interval '2 days'
  where rights.id = rights_a;

  verification_snapshot := jsonb_build_object(
    'schemaVersion', 3,
    'verifierVersion',
      'veroxa-private-image-byte-verifier-2026-08-08-v1',
    'restaurantId', restaurant_id,
    'assetId', asset_a,
    'storagePath', (
      select asset.storage_path
      from public.veroxa_media_assets asset where asset.id = asset_a
    ),
    'storageObjectId', object_a,
    'storageObjectVersion', object_version_a,
    'detectedMime', 'image/jpeg',
    'fileSize', 10240,
    'width', 8064,
    'height', 6048,
    'contentSha256', source_hash
  );
  verification_canonical :=
    veroxa_private.momo_canonical_json_v1(verification_snapshot);
  verification_sha256 := encode(extensions.digest(
    convert_to(verification_canonical, 'UTF8'), 'sha256'
  ), 'hex');

  execute 'set local role service_role';
  select finalized.intake_id, finalized.platform_ready
    into intake_a, platform_ready
  from public.veroxa_finalize_private_media_assessment_intake_v1(
    restaurant_id, asset_a, object_a, object_version_a,
    'image/jpeg', 10240, 8064, 6048, source_hash,
    verification_snapshot, verification_canonical,
    verification_sha256, repeat('c', 64), owner_id
  ) finalized;
  execute 'reset role';
  if intake_a is null or not platform_ready then
    raise exception 'Valid unchanged JPEG did not finalize as platform-ready';
  end if;

  insert into public.veroxa_momo_runtime_controls (
    restaurant_id, ai_live_calls, provider_writes, review_replies,
    website_writes, external_scheduling, updated_by
  ) values (
    restaurant_id, true, false, false, false, false, team_id
  );
  insert into veroxa_private.momo_ai_budget_controls (
    restaurant_id, enabled, authorization_cap_microusd, scope_key,
    external_publishing_authorized, authorized_by, authorized_at
  ) values (
    restaurant_id, true, 100000000, 'momo-upload-to-ready-v1',
    false, team_id, clock_timestamp()
  );

  update public.veroxa_media_rights rights
  set valid_from = clock_timestamp() - interval '2 days',
      expires_at = clock_timestamp() - interval '1 day'
  where rights.id = rights_a;
  execute 'set local role service_role';
  begin
    perform *
    from public.veroxa_reserve_private_media_assessment_v1(
      restaurant_id, asset_a, request_hash, repeat('d', 64),
      'gpt-5.6-sol',
      'veroxa-private-media-assessment-2026-08-08-v2',
      'veroxa-private-media-assessment-v1', 1000000, owner_id
    );
    raise exception 'Expired durable media rights authorized assessment';
  exception when sqlstate '40001' then
    if sqlerrm <> 'current_media_rights_refresh_required_for_assessment' then
      raise;
    end if;
  end;
  execute 'reset role';
  update public.veroxa_media_rights rights
  set valid_from = clock_timestamp() - interval '1 day',
      expires_at = clock_timestamp() + interval '2 days'
  where rights.id = rights_a;

  execute 'set local role service_role';
  select reserved.assessment_id into assessment_id
  from public.veroxa_reserve_private_media_assessment_v1(
    restaurant_id, asset_a, request_hash, repeat('d', 64),
    'gpt-5.6-sol',
    'veroxa-private-media-assessment-2026-08-08-v2',
    'veroxa-private-media-assessment-v1', 1000000, owner_id
  ) reserved;
  select started.should_call into should_call
  from public.veroxa_start_private_media_assessment_provider_v1(
    assessment_id, request_hash, owner_id
  ) started;
  if not should_call then
    raise exception 'Fresh private assessment was not reserved for one call';
  end if;
  execute 'reset role';
  output_payload := jsonb_build_object(
    'schemaVersion', 'veroxa-private-media-assessment-v1',
    'subject', 'food',
    'visualSummary',
      'Visible subject: food. Objective visual tags: Food visible, Plate visible.',
    'qualityScore', 4,
    'qualityIssues', jsonb_build_array('none'),
    'tags', jsonb_build_array(
      jsonb_build_object(
        'slug', 'food-visible', 'label', 'Food visible',
        'evidenceClass', 'objective', 'category', 'scene',
        'confidence', 0.99, 'uncertainty', null
      ),
      jsonb_build_object(
        'slug', 'plate-visible', 'label', 'Plate visible',
        'evidenceClass', 'objective', 'category', 'presentation',
        'confidence', 0.95, 'uncertainty', null
      ),
      jsonb_build_object(
        'slug', 'possible-dumplings',
        'label', 'Possible dumplings',
        'evidenceClass', 'visual_hypothesis',
        'category', 'dish_hypothesis', 'confidence', 0.6,
        'uncertainty',
          'Pixels alone cannot confirm this possible visual identity.'
      )
    ),
    'uncertainties', jsonb_build_array(
      'Pixels alone cannot confirm exact dish, ingredient, menu, business, ownership, or restaurant identity.'
    )
  );
  output_canonical := veroxa_private.momo_canonical_json_v1(output_payload);
  output_sha256 := encode(extensions.digest(
    convert_to(output_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  execute 'set local role service_role';
  perform * from public.veroxa_complete_private_media_assessment_v1(
    assessment_id, request_hash, 'resp_control12345678',
    output_payload, output_canonical, output_sha256,
    3500, 'provider_usage_estimate',
    '{"input_tokens":100,"output_tokens":100,"total_tokens":200}'::jsonb,
    owner_id
  );
  execute 'reset role';

  -- Generic private assessment accepts PNG without treating it as platform
  -- Ready. A measured provider-cost overrun is recorded exactly and the
  -- failed assessment remains terminal and replay-safe.
  insert into storage.objects (
    bucket_id, name, owner, version, metadata, owner_id
  ) values (
    'restaurant-media', path_c, owner_id,
    'owner-ready-private-c-v1',
    '{"mimetype":"image/png","size":10240}'::jsonb,
    owner_id::text
  ) returning id, version into object_c, object_version_c;
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', owner_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  execute 'set local role authenticated';
  select registered.asset_id, registered.rights_id
    into asset_c, rights_c
  from public.veroxa_register_momo_media_v2(
    restaurant_id,
    path_c,
    'image/png', 10240, 'generic.png',
    'Rollback-only generic PNG assessment and cost-settlement fixture.',
    '["instagram"]'::jsonb, null
  ) registered;
  execute 'reset role';
  update public.veroxa_media_rights rights
  set rights_status = 'confirmed', confirmed_by = owner_id,
      confirmed_at = clock_timestamp(),
      valid_from = clock_timestamp() - interval '1 day',
      expires_at = clock_timestamp() + interval '2 days'
  where rights.id = rights_c;
  verification_snapshot := jsonb_build_object(
    'schemaVersion', 3,
    'verifierVersion',
      'veroxa-private-image-byte-verifier-2026-08-08-v1',
    'restaurantId', restaurant_id,
    'assetId', asset_c,
    'storagePath', path_c,
    'storageObjectId', object_c,
    'storageObjectVersion', object_version_c,
    'detectedMime', 'image/png', 'fileSize', 10240,
    'width', 800, 'height', 800,
    'contentSha256', repeat('7', 64)
  );
  verification_canonical :=
    veroxa_private.momo_canonical_json_v1(verification_snapshot);
  verification_sha256 := encode(extensions.digest(
    convert_to(verification_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  execute 'set local role service_role';
  select finalized.intake_id, finalized.platform_ready
    into intake_c, platform_ready
  from public.veroxa_finalize_private_media_assessment_intake_v1(
    restaurant_id, asset_c, object_c, object_version_c,
    'image/png', 10240, 800, 800, repeat('7', 64),
    verification_snapshot, verification_canonical,
    verification_sha256, repeat('0', 64), owner_id
  ) finalized;
  if intake_c is null or platform_ready then
    raise exception 'Generic PNG intake was not assessment-only';
  end if;
  select reserved.assessment_id into overrun_assessment_id
  from public.veroxa_reserve_private_media_assessment_v1(
    restaurant_id, asset_c, repeat('5', 64), repeat('6', 64),
    'gpt-5.6-sol',
    'veroxa-private-media-assessment-2026-08-08-v2',
    'veroxa-private-media-assessment-v1', 1000000, owner_id
  ) reserved;
  select started.should_call into should_call
  from public.veroxa_start_private_media_assessment_provider_v1(
    overrun_assessment_id, repeat('5', 64), owner_id
  ) started;
  if not should_call then
    raise exception 'Overrun assessment fixture did not start exactly once';
  end if;

  -- Reserve a second source before the first provider settles. The measured
  -- v2 settlement remains below the USD 20 tenant ceiling, so the independent
  -- reservation must still be allowed to make its one provider call.
  execute 'reset role';
  insert into storage.objects (
    bucket_id, name, owner, version, metadata, owner_id
  ) values (
    'restaurant-media', path_d, owner_id,
    'owner-ready-private-d-v1',
    '{"mimetype":"image/png","size":10240}'::jsonb,
    owner_id::text
  ) returning id, version into object_d, object_version_d;
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', owner_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  execute 'set local role authenticated';
  select registered.asset_id, registered.rights_id
    into asset_d, rights_d
  from public.veroxa_register_momo_media_v2(
    restaurant_id,
    path_d,
    'image/png', 10240, 'cap-blocked.png',
    'Rollback-only post-overrun start-cap fixture.',
    '["instagram"]'::jsonb, null
  ) registered;
  execute 'reset role';
  update public.veroxa_media_rights rights
  set rights_status = 'confirmed', confirmed_by = owner_id,
      confirmed_at = clock_timestamp(),
      valid_from = clock_timestamp() - interval '1 day',
      expires_at = clock_timestamp() + interval '2 days'
  where rights.id = rights_d;
  verification_snapshot := jsonb_build_object(
    'schemaVersion', 3,
    'verifierVersion',
      'veroxa-private-image-byte-verifier-2026-08-08-v1',
    'restaurantId', restaurant_id,
    'assetId', asset_d,
    'storagePath', path_d,
    'storageObjectId', object_d,
    'storageObjectVersion', object_version_d,
    'detectedMime', 'image/png', 'fileSize', 10240,
    'width', 800, 'height', 800,
    'contentSha256', repeat('6', 64)
  );
  verification_canonical :=
    veroxa_private.momo_canonical_json_v1(verification_snapshot);
  verification_sha256 := encode(extensions.digest(
    convert_to(verification_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  execute 'set local role service_role';
  select finalized.intake_id into intake_d
  from public.veroxa_finalize_private_media_assessment_intake_v1(
    restaurant_id, asset_d, object_d, object_version_d,
    'image/png', 10240, 800, 800, repeat('6', 64),
    verification_snapshot, verification_canonical,
    verification_sha256, repeat('9', 64), owner_id
  ) finalized;
  select reserved.assessment_id into cap_blocked_assessment_id
  from public.veroxa_reserve_private_media_assessment_v1(
    restaurant_id, asset_d, repeat('2', 64), repeat('8', 64),
    'gpt-5.6-sol',
    'veroxa-private-media-assessment-2026-08-08-v2',
    'veroxa-private-media-assessment-v1', 1000000, owner_id
  ) reserved;
  if intake_d is null or cap_blocked_assessment_id is null then
    raise exception 'Pre-overrun reservation fixture was not created';
  end if;

  perform public.veroxa_fail_private_media_assessment_v1(
    overrun_assessment_id, repeat('5', 64),
    'resp_overrun12345678', 'invalid_provider_output', true,
    10635000,
    '{"input_tokens":1050000,"output_tokens":3000,"total_tokens":1053000}'::jsonb,
    owner_id
  );
  select started.should_call, started.assessment_status
    into should_call, cap_blocked_status
  from public.veroxa_start_private_media_assessment_provider_v1(
    cap_blocked_assessment_id, repeat('2', 64), owner_id
  ) started;
  if not should_call or cap_blocked_status <> 'provider_running' then
    raise exception 'Measured overrun corrupted an independent reservation';
  end if;
  if public.veroxa_fail_private_media_assessment_v1(
    overrun_assessment_id, repeat('5', 64),
    'resp_overrun12345678', 'invalid_provider_output', true,
    10635000,
    '{"input_tokens":1050000,"output_tokens":3000,"total_tokens":1053000}'::jsonb,
    owner_id
  ) <> overrun_assessment_id then
    raise exception 'Exact failed-assessment replay changed identity';
  end if;
  begin
    perform public.veroxa_fail_private_media_assessment_v1(
      overrun_assessment_id, repeat('5', 64),
      'resp_overrun12345678', 'invalid_provider_output', true,
      10635001,
      '{"input_tokens":1050000,"output_tokens":3000,"total_tokens":1053000}'::jsonb,
      owner_id
    );
    raise exception 'Conflicting failed-assessment replay was accepted';
  exception when sqlstate '23505' then
    if sqlerrm <>
       'private_media_assessment_failure_replay_conflict' then
      raise;
    end if;
  end;
  begin
    perform public.veroxa_fail_private_media_assessment_v1(
      assessment_id, request_hash,
      'resp_control12345678', 'invalid_provider_output', true,
      3500,
      '{"input_tokens":100,"output_tokens":100,"total_tokens":200}'::jsonb,
      owner_id
    );
    raise exception 'Completed assessment accepted a failure settlement';
  exception when sqlstate '23514' then
    if sqlerrm <> 'private_media_assessment_already_completed' then
      raise;
    end if;
  end;
  execute 'reset role';
  if not exists (
    select 1
    from public.veroxa_private_media_assessments_v1 assessment
    where assessment.id = overrun_assessment_id
      and assessment.status = 'failed'
      and assessment.provider_called
      and assessment.provider_response_id = 'resp_overrun12345678'
      and assessment.accounted_microusd = 10635000
      and assessment.accounting_basis = 'provider_usage_estimate'
      and assessment.provider_usage =
        '{"input_tokens":1050000,"output_tokens":3000,"total_tokens":1053000}'::jsonb
      and assessment.output_payload is null
      and assessment.completed_at is not null
      and (
        select count(*)
        from public.veroxa_private_media_assessment_events_v1 event
        where event.assessment_id = assessment.id
          and event.event_kind = 'failed'
      ) = 1
  ) then
    raise exception 'Known provider overrun was not settled exactly as failed';
  end if;
  if not exists (
    select 1
    from public.veroxa_private_media_assessments_v1 assessment
    where assessment.id = cap_blocked_assessment_id
      and assessment.status = 'provider_running'
      and assessment.provider_called
      and assessment.provider_started_at is not null
      and assessment.provider_response_id is null
      and assessment.provider_usage is null
      and assessment.accounted_microusd is null
      and assessment.accounting_basis is null
      and assessment.provider_error_code is null
      and assessment.completed_at is null
      and (
        select count(*)
        from public.veroxa_private_media_assessment_events_v1 event
        where event.assessment_id = assessment.id
          and event.event_kind = 'provider_started'
      ) = 1
  ) then
    raise exception 'Below-cap overrun corrupted the independent reservation';
  end if;

  insert into storage.objects (
    bucket_id, name, owner, version, metadata, owner_id
  ) values (
    'restaurant-media', path_b, owner_id,
    'owner-ready-private-b-v1',
    '{"mimetype":"image/jpeg","size":10240}'::jsonb,
    owner_id::text
  ) returning id, version into object_b, object_version_b;
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', owner_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  execute 'set local role authenticated';
  select association.association_id into association_a
  from public.veroxa_record_media_restaurant_association_v1(
    restaurant_id, asset_a, rights_a, source_hash,
    'licensed_generic_only', 'Canonical bytes are generic-only.'
  ) association;
  execute 'reset role';

  -- Establish A as the permanent canonical identity without transferring its
  -- generic-only decision into an eligible processing association.
  perform veroxa_private.momo_advance_verified_asset_v2(jsonb_build_object(
    'restaurantId', restaurant_id,
    'assetId', asset_a,
    'verificationId', intake_a,
    'actorId', owner_id
  ));

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', owner_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  execute 'set local role authenticated';
  select registered.asset_id, registered.rights_id
    into asset_b, rights_b
  from public.veroxa_register_momo_media_v2(
    restaurant_id,
    path_b,
    'image/jpeg', 10240, 'duplicate.jpg',
    'Rollback-only exact duplicate private assessment fixture.',
    '["instagram"]'::jsonb, null
  ) registered;
  execute 'reset role';
  update public.veroxa_media_rights rights
  set rights_status = 'confirmed', confirmed_by = owner_id,
      confirmed_at = clock_timestamp(),
      valid_from = clock_timestamp() - interval '1 day',
      expires_at = clock_timestamp() + interval '2 days'
  where rights.id = rights_b;
  verification_snapshot := jsonb_build_object(
    'schemaVersion', 3,
    'verifierVersion',
      'veroxa-private-image-byte-verifier-2026-08-08-v1',
    'restaurantId', restaurant_id,
    'assetId', asset_b,
    'storagePath', (
      select asset.storage_path
      from public.veroxa_media_assets asset where asset.id = asset_b
    ),
    'storageObjectId', object_b,
    'storageObjectVersion', object_version_b,
    'detectedMime', 'image/jpeg', 'fileSize', 10240,
    'width', 800, 'height', 800, 'contentSha256', source_hash
  );
  verification_canonical :=
    veroxa_private.momo_canonical_json_v1(verification_snapshot);
  verification_sha256 := encode(extensions.digest(
    convert_to(verification_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  execute 'set local role service_role';
  select finalized.intake_id into intake_b
  from public.veroxa_finalize_private_media_assessment_intake_v1(
    restaurant_id, asset_b, object_b, object_version_b,
    'image/jpeg', 10240, 800, 800, source_hash,
    verification_snapshot, verification_canonical,
    verification_sha256, repeat('e', 64), owner_id
  ) finalized;
  select reserved.assessment_id, reserved.reused_from_assessment_id
    into reused_assessment_id, reused_from_id
  from public.veroxa_reserve_private_media_assessment_v1(
    restaurant_id, asset_b, repeat('f', 64), repeat('1', 64),
    'gpt-5.6-sol',
    'veroxa-private-media-assessment-2026-08-08-v2',
    'veroxa-private-media-assessment-v1', 1000000, owner_id
  ) reserved;
  execute 'reset role';
  if reused_assessment_id <> assessment_id
     or reused_from_id <> assessment_id then
    raise exception 'Exact duplicate did not reuse assessment-only evidence';
  end if;

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', owner_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  execute 'set local role authenticated';
  select association.association_id into association_b
  from public.veroxa_record_media_restaurant_association_v1(
    restaurant_id, asset_b, rights_b, source_hash,
    'represents_current_restaurant_offering',
    'Owner attests these duplicate bytes depict a current offering.'
  ) association;
  select association.association_id into association_replay
  from public.veroxa_record_media_restaurant_association_v1(
    restaurant_id, asset_b, rights_b, source_hash,
    'represents_current_restaurant_offering',
    'Owner attests these duplicate bytes depict a current offering.'
  ) association;
  if association_replay <> association_b then
    raise exception 'Exact association replay was not idempotent';
  end if;
  begin
    perform *
    from public.veroxa_record_media_restaurant_association_v1(
      restaurant_id, asset_b, rights_b, source_hash,
      'not_for_restaurant',
      'A conflicting decision must not replace terminal owner evidence.'
    );
    raise exception 'Terminal association decision was replaced';
  exception when sqlstate '23505' then
    if sqlerrm <> 'media_restaurant_association_decision_is_terminal' then
      raise;
    end if;
  end;

  select to_jsonb(status_row) into v4_row
  from public.veroxa_momo_client_upload_status_v4(restaurant_id) status_row
  where status_row.asset_id = asset_b;
  execute 'reset role';
  if v4_row ->> 'restaurant_association' <>
       'represents_current_restaurant_offering'
     or v4_row ->> 'association_evidence_class' <> 'real_owner'
     or v4_row -> 'private_assessment' is distinct from output_payload
     or v4_row ? 'provider_response_id'
     or v4_row ? 'accounted_microusd'
     or v4_row ? 'provider_error_code'
     or not exists (
       select 1
       from public.veroxa_momo_automation_advances_v2 advance
       where advance.restaurant_id = restaurant_id
         and advance.source_asset_id = asset_b
         and advance.processing_asset_id = asset_b
     )
     or exists (
       select 1
       from public.veroxa_momo_automation_advances_v2 advance
       where advance.restaurant_id = restaurant_id
         and advance.source_asset_id = asset_b
         and advance.processing_asset_id = asset_a
     ) then
    raise exception 'Sanitized v4 or exact-associated duplicate selection failed';
  end if;

  begin
    update public.veroxa_media_restaurant_associations_v1 association
    set note = 'Mutation attempt'
    where association.id = association_b;
    raise exception 'Association evidence was mutable';
  exception when sqlstate '23514' then
    if sqlerrm <> 'private_media_evidence_is_append_only' then raise; end if;
  end;
end $$;
$private_media_behavior$, 'Private assessment requires current rights, supports bounded generic intake, settles measured overruns, reuses only assessment, and binds terminal association to the exact asset');

select lives_ok($ready_behavior$
do $$
#variable_conflict use_variable
declare
  restaurant_id uuid := '8a000000-0000-4000-8000-000000000001';
  team_id uuid := '8a000000-0000-4000-8000-000000000002';
  owner_id uuid := '8a000000-0000-4000-8000-000000000003';
  asset_id uuid;
  rights_id uuid;
  verification_id uuid;
  identity_id uuid;
  run_id uuid := '8c000000-0000-4000-8000-000000000001';
  ready_id uuid := '8c000000-0000-4000-8000-000000000002';
  run_id_2 uuid := '8c000000-0000-4000-8000-000000000003';
  ready_id_2 uuid := '8c000000-0000-4000-8000-000000000004';
  unassociated_asset_id uuid := '8b000000-0000-4000-8000-000000000003';
  unassociated_rights_id uuid := '8d000000-0000-4000-8000-000000000003';
  unassociated_intake_id uuid := '8e000000-0000-4000-8000-000000000003';
  approval_event_id uuid;
  discard_event_id uuid;
  replay_event_id uuid;
  source_hash text := repeat('a', 64);
  output_hash text := repeat('8', 64);
  output_hash_2 text;
  truth_snapshot jsonb;
  truth_hash text;
  source_record record;
  duplicate_source_record record;
  approval_attestation jsonb := '{
    "teamReviewed": true,
    "noExternalWriteAuthorized": true,
    "decisionIsFinalForThisOutput": true
  }'::jsonb;
  discard_attestation jsonb := '{
    "teamReviewed": true,
    "noExternalWriteAuthorized": true,
    "decisionIsFinalForThisMedia": true
  }'::jsonb;
  freshness record;
  discarded_v4_count integer;
  association_count_before integer;
  association_rejected boolean := false;
begin
  -- The v1 writer/readbacks are permanently retired by the reconciliation
  -- migration. Keep only catalog/history evidence here; all executable v2
  -- decision semantics live in momo_preconnection_integration.sql.
  if true then
    if has_function_privilege(
         'authenticated',
         'public.veroxa_record_momo_ready_disposition_v1(uuid,uuid,text,text,text,text,jsonb)',
         'execute'
       )
       or has_function_privilege(
         'service_role',
         'public.veroxa_record_momo_ready_disposition_v1(uuid,uuid,text,text,text,text,jsonb)',
         'execute'
       )
       or has_function_privilege(
         'authenticated',
         'public.veroxa_momo_team_ready_active_v1(uuid)', 'execute'
       )
       or has_function_privilege(
         'authenticated',
         'public.veroxa_momo_team_ready_evidence_v1(uuid)', 'execute'
       )
       or has_function_privilege(
         'authenticated',
         'public.veroxa_momo_team_ready_freshness_v1(uuid,uuid,text,text)',
         'execute'
       ) then
      raise exception 'Retired Ready-v1 authority remained callable';
    end if;
    if to_regclass(
         'veroxa_private.momo_ready_v2_authority_evidence_v1'
       ) is null
       or not exists (
         select 1
         from pg_catalog.pg_class relation
         where relation.oid =
           'veroxa_private.momo_ready_v2_authority_evidence_v1'::regclass
           and relation.relrowsecurity
           and relation.relforcerowsecurity
       )
       or has_table_privilege(
         'authenticated',
         'veroxa_private.momo_ready_v2_authority_evidence_v1', 'select'
       )
       or not exists (
         select 1
         from pg_catalog.pg_trigger trigger_record
         where trigger_record.tgrelid =
           'public.veroxa_momo_ready_disposition_events_v1'::regclass
           and trigger_record.tgname =
             'veroxa_momo_ready_disposition_event_immutable_v1'
           and not trigger_record.tgisinternal
       ) then
      raise exception 'Ready disposition history or v2 authority lost guard';
    end if;
    return;
  end if;

  select asset.id as asset_id,
    rights.id as rights_id,
    verification.id as verification_id,
    link.identity_id as identity_id,
    asset.storage_path as storage_path,
    verification.storage_object_id as storage_object_id,
    verification.storage_object_version as storage_object_version,
    asset.mime_type as mime_type,
    asset.file_size as file_size,
    asset.width as width,
    asset.height as height,
    rights.attestation_sha256 as attestation_sha256
  into source_record
  from public.veroxa_media_assets asset
  join public.veroxa_media_rights rights on rights.asset_id = asset.id
  join public.veroxa_momo_media_intake_verifications verification
    on verification.asset_id = asset.id
  join public.veroxa_momo_media_asset_identity_links_v2 link
    on link.asset_id = asset.id
  where asset.restaurant_id = restaurant_id
    and asset.storage_path like '%8b000000-0000-4000-8000-000000000002.jpg';
  select asset.id as asset_id,
    rights.id as rights_id,
    verification.id as verification_id,
    link.identity_id as identity_id,
    asset.storage_path as storage_path,
    verification.storage_object_id as storage_object_id,
    verification.storage_object_version as storage_object_version,
    asset.mime_type as mime_type,
    asset.file_size as file_size,
    asset.width as width,
    asset.height as height,
    rights.attestation_sha256 as attestation_sha256
  into duplicate_source_record
  from public.veroxa_media_assets asset
  join public.veroxa_media_rights rights on rights.asset_id = asset.id
  join public.veroxa_momo_media_intake_verifications verification
    on verification.asset_id = asset.id
  join public.veroxa_momo_media_asset_identity_links_v2 link
    on link.asset_id = asset.id
  where asset.restaurant_id = restaurant_id
    and asset.storage_path like '%8b000000-0000-4000-8000-000000000001.jpg';
  asset_id := source_record.asset_id;
  rights_id := source_record.rights_id;
  verification_id := source_record.verification_id;
  identity_id := source_record.identity_id;
  if asset_id is null or identity_id is null
     or duplicate_source_record.asset_id is null
     or duplicate_source_record.identity_id is distinct from identity_id then
    raise exception 'Ready fixture source lineage is missing';
  end if;

  -- A third exact-byte asset deliberately has complete private assessment and
  -- current real-owner rights but no association. It proves the source-media
  -- tombstone rejects a genuinely new association row, not only an exact
  -- replay, after discard.
  insert into public.veroxa_media_assets (
    id, restaurant_id, storage_path, mime_type, file_size, uploaded_by,
    status, original_file_name, intake_notes, content_sha256, width, height
  )
  select unassociated_asset_id, source.restaurant_id,
    'restaurants/' || restaurant_id::text ||
      '/uploads/2026/08/8b000000-0000-4000-8000-000000000003.jpg',
    source.mime_type, source.file_size, source.uploaded_by, source.status,
    'unassociated-duplicate.jpg',
    'Rollback-only unassociated exact-byte discard fixture.',
    source.content_sha256, source.width, source.height
  from public.veroxa_media_assets source
  where source.id = asset_id;
  insert into public.veroxa_media_rights (
    id, restaurant_id, asset_id, rights_status, usage_scope,
    valid_from, expires_at, confirmed_by, confirmed_at, notes,
    evidence_class, attestation_version, attestation_text,
    attestation_sha256
  )
  select unassociated_rights_id, source.restaurant_id,
    unassociated_asset_id, source.rights_status, source.usage_scope,
    source.valid_from, source.expires_at, source.confirmed_by,
    source.confirmed_at, source.notes, source.evidence_class,
    source.attestation_version, source.attestation_text,
    source.attestation_sha256
  from public.veroxa_media_rights source
  where source.id = rights_id;
  insert into public.veroxa_private_media_assessment_intakes_v1 (
    id, restaurant_id, asset_id, storage_path, storage_object_id,
    storage_object_version, declared_mime_type, detected_mime_type,
    file_size, width, height, content_sha256, verifier_version,
    verification_snapshot, verification_canonical, verification_sha256,
    idempotency_hash, platform_ready, status, initiated_by
  )
  select unassociated_intake_id, source.restaurant_id,
    unassociated_asset_id,
    'restaurants/' || restaurant_id::text ||
      '/uploads/2026/08/8b000000-0000-4000-8000-000000000003.jpg',
    '8f000000-0000-4000-8000-000000000003'::uuid,
    'owner-ready-unassociated-v1', source.declared_mime_type,
    source.detected_mime_type, source.file_size, source.width,
    source.height, source.content_sha256, source.verifier_version,
    source.verification_snapshot, source.verification_canonical,
    source.verification_sha256, repeat('b', 64), source.platform_ready,
    source.status, source.initiated_by
  from public.veroxa_private_media_assessment_intakes_v1 source
  where source.asset_id = asset_id;
  insert into public.veroxa_private_media_assessment_asset_links_v1 (
    restaurant_id, asset_id, intake_id, assessment_id,
    source_content_sha256, reused_from_assessment_id,
    evidence_class, linked_by
  )
  select source.restaurant_id, unassociated_asset_id,
    unassociated_intake_id, source.assessment_id,
    source.source_content_sha256, source.assessment_id,
    source.evidence_class, source.linked_by
  from public.veroxa_private_media_assessment_asset_links_v1 source
  where source.asset_id = asset_id;

  truth_snapshot :=
    veroxa_private.current_momo_truth_snapshot_v1(restaurant_id);
  truth_hash := encode(extensions.digest(
    convert_to(truth_snapshot::text, 'UTF8'), 'sha256'
  ), 'hex');
  output_hash_2 := encode(extensions.digest(
    convert_to('{}', 'UTF8'), 'sha256'
  ), 'hex');

  execute 'alter table public.veroxa_momo_content_ai_runs disable trigger user';
  insert into public.veroxa_momo_content_ai_runs (
    id, restaurant_id, source_asset_id, intake_verification_id,
    source_storage_path, source_storage_object_id,
    source_storage_object_version, source_mime_type, source_file_size,
    source_width, source_height, source_content_sha256, rights_id,
    rights_attestation_sha256, review_id, truth_snapshot,
    truth_snapshot_sha256, target_platforms, model, reasoning_effort,
    prompt_version, schema_version, validator_version, pricing_version,
    idempotency_hash, client_request_hash, request_hash, requested_by,
    reserved_microusd, reservation_lease_expires_at, decision_mode,
    automation_policy_version, automation_identity_id,
    automation_initiated_by, automation_retry_generation
  ) values (
    run_id, restaurant_id, asset_id, verification_id,
    source_record.storage_path, source_record.storage_object_id,
    source_record.storage_object_version, source_record.mime_type,
    source_record.file_size, source_record.width, source_record.height,
    source_hash, rights_id, source_record.attestation_sha256, null,
    truth_snapshot, truth_hash, '["instagram"]'::jsonb,
    'gpt-5.6-sol', 'high',
    'momo-content-package-2026-08-01-v4',
    'momo-content-package-v1',
    'momo-content-validator-2026-08-01-v4',
    'openai-gpt-5.6-sol-2026-08-01-v2',
    repeat('2', 64), repeat('3', 64), repeat('4', 64), team_id,
    6000000, clock_timestamp() + interval '15 minutes',
    'automation_policy_v2',
    'momo-upload-veroxa-ready-2026-08-02-v2',
    identity_id, team_id, 0
  );
  execute 'alter table public.veroxa_momo_content_ai_runs enable trigger user';

  execute 'alter table public.veroxa_momo_ready_packages_v2 disable trigger user';
  insert into public.veroxa_momo_ready_packages_v2 (
    id, restaurant_id, content_ai_run_id, identity_id,
    canonical_asset_id, source_asset_id, intake_verification_id,
    rights_id, rights_attestation_sha256, truth_snapshot_sha256,
    source_storage_path, source_storage_object_id,
    source_storage_object_version, source_mime_type, source_file_size,
    source_width, source_height, source_content_sha256,
    output_payload, output_canonical, output_sha256,
    validation_report, validation_canonical, validation_sha256,
    decision_mode, policy_version, status
  )
  select ready_id, restaurant_id, run_id, identity_id,
    identity.canonical_asset_id, asset_id, verification_id,
    rights_id, source_record.attestation_sha256, truth_hash,
    source_record.storage_path, source_record.storage_object_id,
    source_record.storage_object_version, source_record.mime_type,
    source_record.file_size, source_record.width, source_record.height,
    source_hash, '{}'::jsonb, '{}', output_hash,
    '{}'::jsonb, '{}', repeat('9', 64),
    'automation_policy_v2',
    'momo-upload-veroxa-ready-2026-08-02-v2', 'veroxa_ready'
  from public.veroxa_momo_media_canonical_identities_v2 identity
  where identity.id = identity_id;
  execute 'alter table public.veroxa_momo_ready_packages_v2 enable trigger user';

  if not veroxa_private.momo_content_ai_current_evidence_v1(
    run_id, team_id
  ) then
    raise exception 'Ready fixture did not satisfy exact current evidence';
  end if;

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', team_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', team_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  select decision.event_id into approval_event_id
  from public.veroxa_record_momo_ready_disposition_v1(
    restaurant_id, ready_id, output_hash, source_hash,
    'approved_for_posting', 'Team reviewed this immutable output.',
    approval_attestation
  ) decision
  where decision.active_for_manual_use;
  if approval_event_id is null then
    raise exception 'Current Ready package approval was not active';
  end if;

  -- Materialize a later package from the older exact-byte duplicate asset.
  -- This proves the source tombstone spans package and asset identifiers while
  -- keeping the original immutable package available for the discard action.
  execute 'reset role';
  execute 'alter table public.veroxa_momo_content_ai_runs disable trigger user';
  insert into public.veroxa_momo_content_ai_runs (
    id, restaurant_id, source_asset_id, intake_verification_id,
    source_storage_path, source_storage_object_id,
    source_storage_object_version, source_mime_type, source_file_size,
    source_width, source_height, source_content_sha256, rights_id,
    rights_attestation_sha256, review_id, truth_snapshot,
    truth_snapshot_sha256, target_platforms, model, reasoning_effort,
    prompt_version, schema_version, validator_version, pricing_version,
    idempotency_hash, client_request_hash, request_hash, requested_by,
    reserved_microusd, reservation_lease_expires_at, decision_mode,
    automation_policy_version, automation_identity_id,
    automation_initiated_by, automation_retry_generation,
    status, provider_called, provider_started_at, provider_response_id,
    provider_usage, accounted_microusd, accounting_basis,
    output_payload, output_canonical, output_sha256,
    validation_report, validation_canonical, validation_sha256,
    completed_at
  )
  select run_id_2, source.restaurant_id,
    duplicate_source_record.asset_id,
    duplicate_source_record.verification_id,
    duplicate_source_record.storage_path,
    duplicate_source_record.storage_object_id,
    duplicate_source_record.storage_object_version,
    duplicate_source_record.mime_type, duplicate_source_record.file_size,
    duplicate_source_record.width, duplicate_source_record.height,
    source_hash, duplicate_source_record.rights_id,
    duplicate_source_record.attestation_sha256, source.review_id,
    source.truth_snapshot, source.truth_snapshot_sha256,
    source.target_platforms, source.model, source.reasoning_effort,
    source.prompt_version, source.schema_version, source.validator_version,
    source.pricing_version, repeat('5', 64), repeat('6', 64),
    repeat('7', 64), source.requested_by,
    source.reserved_microusd,
    clock_timestamp() + interval '15 minutes', source.decision_mode,
    source.automation_policy_version, source.automation_identity_id,
    source.automation_initiated_by, 0,
    'pending_review', true, clock_timestamp() - interval '1 second',
    'resp_ready_fixture_2', '{}'::jsonb, 1,
    'provider_usage_estimate', '{}'::jsonb, '{}', output_hash_2,
    '{}'::jsonb, '{}', output_hash_2, clock_timestamp()
  from public.veroxa_momo_content_ai_runs source
  where source.id = run_id;
  execute 'alter table public.veroxa_momo_content_ai_runs enable trigger user';

  execute 'alter table public.veroxa_momo_ready_packages_v2 disable trigger user';
  insert into public.veroxa_momo_ready_packages_v2 (
    id, restaurant_id, content_ai_run_id, identity_id,
    canonical_asset_id, source_asset_id, intake_verification_id,
    rights_id, rights_attestation_sha256, truth_snapshot_sha256,
    source_storage_path, source_storage_object_id,
    source_storage_object_version, source_mime_type, source_file_size,
    source_width, source_height, source_content_sha256,
    output_payload, output_canonical, output_sha256,
    validation_report, validation_canonical, validation_sha256,
    decision_mode, policy_version, status
  )
  select ready_id_2, source.restaurant_id, run_id_2, source.identity_id,
    source.canonical_asset_id, duplicate_source_record.asset_id,
    duplicate_source_record.verification_id,
    duplicate_source_record.rights_id,
    duplicate_source_record.attestation_sha256,
    source.truth_snapshot_sha256,
    duplicate_source_record.storage_path,
    duplicate_source_record.storage_object_id,
    duplicate_source_record.storage_object_version,
    duplicate_source_record.mime_type, duplicate_source_record.file_size,
    duplicate_source_record.width, duplicate_source_record.height,
    source_hash, '{}'::jsonb, '{}', output_hash_2,
    '{}'::jsonb, '{}', output_hash_2, source.decision_mode,
    source.policy_version, source.status
  from public.veroxa_momo_ready_packages_v2 source
  where source.id = ready_id;
  execute 'alter table public.veroxa_momo_ready_packages_v2 enable trigger user';

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', team_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', team_id::text, true);
  execute 'set local role authenticated';
  select decision.event_id into discard_event_id
  from public.veroxa_record_momo_ready_disposition_v1(
    restaurant_id, ready_id, output_hash, source_hash,
    'discarded', 'Team permanently discards these source media bytes.',
    discard_attestation
  ) decision;
  select decision.event_id into replay_event_id
  from public.veroxa_record_momo_ready_disposition_v1(
    restaurant_id, ready_id_2, output_hash_2, source_hash,
    'discarded', 'Team permanently discards these source media bytes.',
    discard_attestation
  ) decision;
  if discard_event_id is null or replay_event_id <> discard_event_id then
    raise exception 'Discard replay was not exact and idempotent';
  end if;
  begin
    perform * from public.veroxa_record_momo_ready_disposition_v1(
      restaurant_id, ready_id_2, output_hash_2, source_hash,
      'discarded', 'A conflicting media tombstone note must not replace it.',
      discard_attestation
    );
    raise exception 'Terminal source-media discard evidence was replaced';
  exception when sqlstate '23505' then
    if sqlerrm <> 'source_media_discard_idempotency_conflict' then raise; end if;
  end;
  begin
    perform * from public.veroxa_record_momo_ready_disposition_v1(
      restaurant_id, ready_id_2, output_hash_2, source_hash,
      'approved_for_posting', 'Discarded media cannot reactivate.',
      approval_attestation
    );
    raise exception 'Discarded Ready package reactivated';
  exception when sqlstate '23514' then
    if sqlerrm <> 'source_media_discarded_terminal' then raise; end if;
  end;

  execute 'reset role';
  select count(*)::integer into association_count_before
  from public.veroxa_media_restaurant_associations_v1 association
  where association.restaurant_id = restaurant_id
    and association.asset_id = unassociated_asset_id
    and association.rights_id = unassociated_rights_id
    and association.source_content_sha256 = source_hash;
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', owner_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  execute 'set local role authenticated';
  begin
    perform *
    from public.veroxa_record_media_restaurant_association_v1(
      restaurant_id, unassociated_asset_id, unassociated_rights_id,
      source_hash,
      'represents_current_restaurant_offering',
      'Owner attempts a new association after terminal media discard.'
    );
  exception when sqlstate '23514' then
    if sqlerrm <> 'source_media_discarded_terminal' then raise; end if;
    association_rejected := true;
  end;
  execute 'reset role';
  if not association_rejected then
    raise exception 'Discarded media accepted a new association';
  end if;
  if (
    select count(*)::integer
    from public.veroxa_media_restaurant_associations_v1 association
    where association.restaurant_id = restaurant_id
      and association.asset_id = unassociated_asset_id
      and association.rights_id = unassociated_rights_id
      and association.source_content_sha256 = source_hash
  ) <> association_count_before then
    raise exception 'Discarded media mutated terminal association history';
  end if;

  begin
    perform veroxa_private.momo_advance_verified_asset_v2(
      jsonb_build_object(
        'restaurantId', restaurant_id,
        'assetId', asset_id,
        'verificationId', verification_id,
        'actorId', team_id
      )
    );
    raise exception 'Discarded source bytes re-entered content reservation';
  exception when sqlstate '23514' then
    if sqlerrm <> 'source_media_discarded_terminal' then raise; end if;
  end;

  -- Change dynamic evidence after discard. The source tombstone remains the
  -- primary terminal blocker regardless of later rights/truth/output state.
  update public.veroxa_media_rights rights
  set expires_at = clock_timestamp() - interval '1 second'
  where rights.id = rights_id;
  if veroxa_private.momo_content_ai_current_evidence_v1(
    run_id, team_id
  ) then
    raise exception 'Discarded media remained provider-dispatch eligible';
  end if;

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', team_id::text, 'role', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', team_id::text, true);
  execute 'set local role authenticated';
  select count(*)::integer into discarded_v4_count
  from public.veroxa_momo_client_upload_status_v4(restaurant_id) status_row
  where status_row.source_content_sha256 = source_hash
    and status_row.source_media_discarded
    and status_row.source_media_discarded_at is not null
    and status_row.pipeline_status = 'verified'
    and status_row.attention_reasons = '[]'::jsonb;
  if discarded_v4_count < 2 then
    raise exception 'Client v4 did not tombstone every exact-byte asset';
  end if;

  if exists (
    select 1
    from public.veroxa_momo_team_ready_active_v1(restaurant_id) active
    where active.source_content_sha256 = source_hash
  ) or not exists (
    select 1
    from public.veroxa_momo_team_ready_evidence_v1(restaurant_id) evidence
    where evidence.ready_package_id = ready_id
      and evidence.current_disposition = 'discarded'
      and not evidence.active_for_manual_use
      and not evidence.eligible_for_approval
      and evidence.manual_use_blockers @>
        array['source_media_discarded_terminal']
      and jsonb_array_length(evidence.disposition_history) = 2
      and not evidence.external_write_allowed
  ) or not exists (
    select 1
    from public.veroxa_momo_team_ready_evidence_v1(restaurant_id) evidence
    where evidence.ready_package_id = ready_id_2
      and evidence.current_disposition = 'discarded'
      and not evidence.active_for_manual_use
      and not evidence.eligible_for_approval
      and evidence.manual_use_blockers @>
        array['source_media_discarded_terminal']
      and jsonb_array_length(evidence.disposition_history) = 1
      and evidence.disposition_history @>
        jsonb_build_array(jsonb_build_object(
          'eventId', discard_event_id,
          'readyPackageId', ready_id
        ))
      and not evidence.external_write_allowed
  ) then
    raise exception 'Source discard did not span packages with retained audit';
  end if;
  select * into freshness
  from public.veroxa_momo_team_ready_freshness_v1(
    restaurant_id, ready_id, output_hash, source_hash
  );
  if freshness.disposition <> 'discarded'
     or freshness.active_for_manual_use
     or freshness.eligible_for_approval
     or not (freshness.manual_use_blockers @>
       array['source_media_discarded_terminal'])
     or freshness.external_write_allowed then
    raise exception 'Narrow Ready freshness readback did not fail closed';
  end if;
  select * into freshness
  from public.veroxa_momo_team_ready_freshness_v1(
    restaurant_id, ready_id_2, output_hash_2, source_hash
  );
  if freshness.disposition <> 'discarded'
     or freshness.active_for_manual_use
     or freshness.eligible_for_approval
     or freshness.manual_use_blockers is distinct from
       array['source_media_discarded_terminal']::text[]
     or freshness.external_write_allowed then
    raise exception 'Sibling package freshness missed source tombstone';
  end if;

  execute 'reset role';
  begin
    update public.veroxa_momo_ready_disposition_events_v1 event
    set note = 'Mutation attempt'
    where event.id = discard_event_id;
    raise exception 'Ready disposition evidence was mutable';
  exception when sqlstate '23514' then
    if sqlerrm <> 'momo_ready_disposition_event_is_immutable' then raise; end if;
  end;
end $$;
$ready_behavior$, 'Ready-v1 mutation/readbacks are retired while immutable history and the private v2 source-tombstone overlay remain guarded');

select * from finish();
rollback;
