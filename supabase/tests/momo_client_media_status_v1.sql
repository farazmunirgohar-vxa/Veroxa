-- Migration 15: executable catalog and tenant-boundary verification.
-- Runs after the complete local migration chain and rolls back all fixtures.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select lives_ok($catalog$
do $$
declare
  target_table text;
  authenticated_select_expected boolean;
  legacy_function text;
  new_function text;
  function_record record;
begin
  foreach target_table in array array[
    'veroxa_campaign_tracking_contracts',
    'veroxa_content_media_placements',
    'veroxa_external_content_cache',
    'veroxa_growth_evidence_sources',
    'veroxa_media_renditions',
    'veroxa_momo_account_handoffs',
    'veroxa_momo_action_consents',
    'veroxa_momo_authority_events',
    'veroxa_momo_evidence_authorities',
    'veroxa_momo_release_attestations',
    'veroxa_momo_runtime_controls',
    'veroxa_preconnection_gate_runs',
    'veroxa_publication_rehearsals',
    'veroxa_seo_change_sets',
    'veroxa_seo_page_baselines'
  ] loop
    if not exists (
      select 1
      from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = target_table
        and relation.relrowsecurity
        and relation.relforcerowsecurity
    ) then
      raise exception 'Migration 15 table does not force RLS: %', target_table;
    end if;

    if has_table_privilege('anon', 'public.' || target_table, 'select')
       or has_table_privilege('service_role', 'public.' || target_table, 'select')
       or has_table_privilege('authenticated', 'public.' || target_table, 'insert')
       or has_table_privilege('authenticated', 'public.' || target_table, 'update')
       or has_table_privilege('authenticated', 'public.' || target_table, 'delete') then
      raise exception 'Migration 15 table privileges are broader than intended: %', target_table;
    end if;

    authenticated_select_expected := target_table <> 'veroxa_external_content_cache';
    if has_table_privilege('authenticated', 'public.' || target_table, 'select')
       is distinct from authenticated_select_expected then
      raise exception 'Authenticated select grant mismatch for %', target_table;
    end if;
  end loop;

  foreach legacy_function in array array[
    'public.veroxa_reconcile_momo_readiness_v1(uuid)',
    'public.veroxa_run_momo_readiness_gate_v1(uuid)',
    'public.veroxa_record_momo_no_go_v1(uuid,uuid,text,boolean)',
    'public.veroxa_momo_readiness_summary_v1(uuid)',
    'public.veroxa_run_momo_no_go_rehearsal_v1(uuid,text)',
    'public.veroxa_run_momo_preconnection_gate_v1(uuid)'
  ] loop
    if to_regprocedure(legacy_function) is null
       or has_function_privilege('anon', legacy_function, 'execute')
       or has_function_privilege('service_role', legacy_function, 'execute')
       or not has_function_privilege('authenticated', legacy_function, 'execute') then
      raise exception 'Legacy readiness function privilege mismatch: %', legacy_function;
    end if;
  end loop;

  foreach new_function in array array[
    'public.veroxa_momo_client_can_read_rendition_v1(text)',
    'public.veroxa_momo_client_media_status_v1(uuid)'
  ] loop
    select procedure.prosecdef, procedure.provolatile, procedure.proconfig
    into function_record
    from pg_proc procedure
    where procedure.oid = to_regprocedure(new_function);

    if not found
       or not function_record.prosecdef
       or function_record.provolatile <> 's'
       or not ('search_path=""' = any(coalesce(function_record.proconfig, '{}'::text[])))
       or has_function_privilege('anon', new_function, 'execute')
       or has_function_privilege('service_role', new_function, 'execute')
       or not has_function_privilege('authenticated', new_function, 'execute') then
      raise exception 'Client media function posture mismatch: %', new_function;
    end if;
  end loop;
end $$;
$catalog$, 'Migration 15 forces RLS, narrows table grants, and removes privileged readiness bypasses');

select lives_ok($storage_policy$
do $$
declare
  policy_record record;
begin
  select policy.cmd, policy.roles, policy.qual
  into policy_record
  from pg_policies policy
  where policy.schemaname = 'storage'
    and policy.tablename = 'objects'
    and policy.policyname = 'veroxa_restaurant_media_member_select';

  if not found
     or policy_record.cmd <> 'SELECT'
     or policy_record.roles <> array['authenticated']::name[]
     or coalesce(policy_record.qual, '') not like '%veroxa_momo_client_can_read_rendition_v1%'
     or coalesce(policy_record.qual, '') not like '%veroxa_current_user_is_team_for_restaurant%'
     or coalesce(policy_record.qual, '') not like '%restaurant-media%' then
    raise exception 'Client/Team private rendition storage policy is missing or incomplete';
  end if;

  if exists (
    select 1
    from pg_policies policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and ('anon'::name = any(policy.roles) or 'public'::name = any(policy.roles))
      and lower(regexp_replace(coalesce(policy.qual, ''), '[[:space:]()]', '', 'g')) = 'true'
  ) then
    raise exception 'Broad anonymous storage select policy survived';
  end if;
end $$;
$storage_policy$, 'Private storage requires current Team scope or the exact eligible Client rendition');

select lives_ok($client_readback$
do $$
declare
  restaurant_id uuid := '20000000-0000-4000-8000-000000000151';
  other_restaurant_id uuid := '20000000-0000-4000-8000-000000000152';
  team_id uuid := '10000000-0000-4000-8000-000000000151';
  client_id uuid := '10000000-0000-4000-8000-000000000152';
  asset_id uuid := '30000000-0000-4000-8000-000000000151';
  storage_object_id uuid;
  storage_object_version text := 'momo-client-media-status-test-version-v1';
  source_hash text := repeat('a', 64);
  output_hash text := repeat('b', 64);
  recipe_hash text := repeat('c', 64);
  rendition_path text;
  result jsonb;
begin
  rendition_path := 'restaurants/' || restaurant_id::text || '/renditions/'
    || asset_id::text || '/' || recipe_hash || '.jpg';

  insert into public.veroxa_restaurants (id, name, city, state, status)
  values
    (restaurant_id, 'Momo Client Media Status Test', 'San Antonio', 'TX', 'active'),
    (other_restaurant_id, 'Foreign Tenant Test', 'Austin', 'TX', 'active');
  insert into veroxa_private.operational_restaurant_scope (
    scope_key, restaurant_id, enabled
  ) values ('momo_house_san_antonio', restaurant_id, true);
  insert into veroxa_private.auth_identity_allowlist (
    email, role, display_name, restaurant_id, enabled
  ) values
    ('media-status-team@veroxa.invalid', 'team', 'Media Status Team', restaurant_id, true),
    ('media-status-client@veroxa.invalid', 'client', 'Media Status Client', restaurant_id, true);
  insert into auth.users (
    id, instance_id, aud, role, email, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (team_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'media-status-team@veroxa.invalid', now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (client_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'media-status-client@veroxa.invalid', now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.veroxa_momo_evidence_authorities (
    restaurant_id, user_id, evidence_class, active, assigned_by, notes
  ) values (
    restaurant_id, client_id, 'development_proxy', true, team_id,
    'Migration 15 transactional test fixture.'
  );

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', client_id::text, 'role', 'authenticated')::text, true);
  insert into public.veroxa_media_assets (
    id, restaurant_id, storage_path, mime_type, file_size, uploaded_by,
    status, content_sha256, width, height
  ) values (
    asset_id, restaurant_id,
    'restaurants/' || restaurant_id::text || '/uploads/2026/07/' || asset_id::text || '.jpg',
    'image/jpeg', 1234, client_id, 'ready_to_use', source_hash, 1600, 1200
  );
  insert into public.veroxa_media_rights (
    restaurant_id, asset_id, rights_status, usage_scope,
    valid_from, expires_at, confirmed_by, confirmed_at, notes
  ) values (
    restaurant_id, asset_id, 'confirmed', '["instagram"]'::jsonb,
    now() - interval '1 day', now() + interval '1 day', client_id, now(),
    'Current development-proxy test rights.'
  );

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', team_id::text, 'role', 'authenticated')::text, true);
  insert into public.veroxa_media_reviews (
    restaurant_id, asset_id, status, quality_score, quality_notes,
    public_use_approved, is_current, reviewed_by, reviewed_at
  ) values (
    restaurant_id, asset_id, 'approved', 90, 'Verified migration test image.',
    true, true, team_id, now()
  );
  insert into storage.objects (bucket_id, name, owner_id, version, metadata)
  values (
    'restaurant-media', rendition_path, team_id::text, storage_object_version,
    '{"mimetype":"image/jpeg","size":4321}'::jsonb
  ) returning id, version into storage_object_id, storage_object_version;
  if storage_object_version is null then
    raise exception 'Storage test object did not receive a version';
  end if;
  insert into public.veroxa_media_renditions (
    restaurant_id, source_kind, source_asset_id, source_key,
    source_content_sha256, storage_path, mime_type, file_size,
    width, height, content_sha256, recipe_fingerprint, edit_recipe,
    preset_key, intended_use, alt_text, evidence_class, created_by,
    storage_object_id, storage_object_version, output_hash_attested_at
  ) values (
    restaurant_id, 'owner_asset', asset_id, asset_id::text,
    source_hash, rendition_path, 'image/jpeg', 4321,
    1080, 1080, output_hash, recipe_hash, '{}'::jsonb,
    'instagram_square', 'instagram', 'Prepared Momo test image.',
    'development_proxy', team_id, storage_object_id, storage_object_version, now()
  );

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', client_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  result := public.veroxa_momo_client_media_status_v1(restaurant_id);
  if jsonb_array_length(result) <> 1
     or result -> 0 ->> 'assetId' <> asset_id::text
     or result -> 0 ->> 'renditionStatus' <> 'ready'
     or result -> 0 ->> 'renditionStoragePath' <> rendition_path
     or (select count(*) from storage.objects object
         where object.id = storage_object_id) <> 1 then
    raise exception 'Eligible private rendition was not projected to its Client';
  end if;
  if public.veroxa_momo_client_can_read_rendition_v1(
       'restaurants/' || other_restaurant_id::text || '/renditions/'
       || asset_id::text || '/' || recipe_hash || '.jpg'
     ) then
    raise exception 'Cross-tenant rendition helper returned true';
  end if;
  begin
    perform public.veroxa_momo_client_media_status_v1(other_restaurant_id);
    raise exception 'Cross-tenant Client status call was accepted';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
exception when others then
  execute 'reset role';
  raise;
end $$;
$client_readback$, 'Eligible rendition readback is minimal, private, and tenant-bound');

select lives_ok($current_evidence$
do $$
declare
  target_restaurant_id uuid := '20000000-0000-4000-8000-000000000151';
  client_id uuid := '10000000-0000-4000-8000-000000000152';
  target_asset_id uuid := '30000000-0000-4000-8000-000000000151';
  recipe_hash text := repeat('c', 64);
  rendition_path text;
  result jsonb;
begin
  rendition_path := 'restaurants/' || target_restaurant_id::text || '/renditions/'
    || target_asset_id::text || '/' || recipe_hash || '.jpg';
  update public.veroxa_media_rights rights
  set rights_status = 'expired', expires_at = now() - interval '1 second'
  where rights.restaurant_id = target_restaurant_id
    and rights.asset_id = target_asset_id;

  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', client_id::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  result := public.veroxa_momo_client_media_status_v1(target_restaurant_id);
  if result -> 0 ->> 'renditionStatus' is not null
     or result -> 0 ->> 'renditionStoragePath' is not null
     or public.veroxa_momo_client_can_read_rendition_v1(rendition_path)
     or (select count(*) from storage.objects object
         where object.name = rendition_path) <> 0 then
    raise exception 'Expired rights did not immediately revoke Client rendition access';
  end if;
  execute 'reset role';
exception when others then
  execute 'reset role';
  raise;
end $$;
$current_evidence$, 'Ready is recalculated and revoked when current rights evidence expires');

select * from finish();
rollback;
