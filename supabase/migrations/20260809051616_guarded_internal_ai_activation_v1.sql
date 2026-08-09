-- Install only a dormant, postgres-only activation routine. Applying this
-- migration must not restore an RPC grant, enable AI, or perform work.

create or replace function veroxa_private.activate_momo_internal_ai_v1(
  p_final_merged_github_commit text,
  p_final_sites_version integer,
  p_final_sites_version_id text,
  p_final_sites_source_commit text,
  p_final_sites_source_sha256 text,
  p_final_sites_archive_sha256 text,
  p_final_edge_function_version integer,
  p_final_edge_function_id uuid,
  p_final_edge_bundle_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $activation$
declare
  target_restaurant_id constant uuid :=
    '6386d7e3-7966-4498-a13e-8736590bd505';
  first_github_commit constant text :=
    'a1c6796b50a1072a96a40db283503d9e2c81bbae';
  first_sites_version constant integer := 40;
  first_sites_version_id constant text :=
    'appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_3e8ce417e544819196aa757cc304b789';
  first_sites_source_commit constant text :=
    '4ee8895f68505e8ea79bf3e0f3ea3b2871ca2b2c';
  first_sites_source_sha256 constant text :=
    'cec2f313e3850141117c7f69dbc1d5ad707b72ee7a7ad5f1f2efa0d6c5a34297';
  first_sites_archive_sha256 constant text :=
    '4bc875ee7b6fd6735569df02d3c611dde095d8c85a7ff09e1ebf465a1128ab15';
  bound_edge_function_version constant integer := 7;
  bound_edge_function_id constant uuid :=
    '859c73c3-2102-41b4-9da1-20582acb7212';
  bound_edge_bundle_sha256 constant text :=
    'a6b00feeab795faa91d6d8d015c4ad399c526e1b35f702778a8c55aaba49503d';
  held_signatures constant text[] := array[
    'veroxa_abort_momo_content_ai_before_provider_v1(uuid,text,uuid,uuid)',
    'veroxa_approve_momo_media_ai_candidate_v1(uuid,text,text,text)',
    'veroxa_begin_momo_content_ai_dispatch_pre_source_lock_v1(uuid,text,uuid,uuid,text)',
    'veroxa_begin_momo_content_ai_dispatch_v1(uuid,text,uuid,uuid,text)',
    'veroxa_bind_momo_content_ai_dispatch_response_v1(uuid,text,uuid,uuid,text)',
    'veroxa_cancel_momo_content_ai_dispatch_before_post_v1(uuid,text,uuid,uuid,text,text)',
    'veroxa_claim_momo_content_ai_dispatch_v1(uuid,bigint,uuid)',
    'veroxa_claim_momo_content_ai_recovery_v1(uuid,bigint)',
    'veroxa_claim_momo_content_ai_webhook_v1(text,text,text,uuid,text,uuid)',
    'veroxa_close_momo_media_ai_attempt_v1(uuid)',
    'veroxa_complete_momo_content_ai_run_v1(uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid)',
    'veroxa_complete_momo_media_ai_candidate_v1(uuid,text,text,text,bigint,integer,integer,text,bigint,text,jsonb,uuid)',
    'veroxa_complete_private_media_assessment_v1(uuid,text,text,jsonb,text,text,bigint,text,jsonb,uuid)',
    'veroxa_complete_staged_momo_content_ai_run_v1(uuid,text,uuid)',
    'veroxa_complete_staged_momo_content_ai_webhook_v1(text,text,uuid,uuid,text,uuid)',
    'veroxa_decide_momo_ready_package_v2(uuid,text,text,text,text)',
    'veroxa_fail_momo_content_ai_run_v1(uuid,text,text,text,boolean,bigint,jsonb,uuid)',
    'veroxa_fail_momo_content_ai_webhook_v1(text,text,uuid,uuid,text,text,text,boolean,bigint,jsonb,uuid)',
    'veroxa_fail_momo_media_ai_candidate_v1(uuid,text,text,uuid)',
    'veroxa_fail_private_media_assessment_v1(uuid,text,text,text,boolean,bigint,jsonb,uuid)',
    'veroxa_fail_unbound_momo_content_ai_dispatch_v1(uuid,text,uuid,uuid)',
    'veroxa_finalize_momo_media_intake_v1(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text,uuid)',
    'veroxa_finalize_private_media_assessment_intake_v1(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text,uuid)',
    'veroxa_finish_momo_content_ai_webhook_v1(text,text,uuid,text,uuid,text,text,text)',
    'veroxa_momo_client_upload_status_v2(uuid)',
    'veroxa_momo_media_ai_lifecycle_preflight_v1(uuid,uuid)',
    'veroxa_momo_team_ready_active_v1(uuid)',
    'veroxa_momo_team_ready_evidence_v1(uuid)',
    'veroxa_momo_team_ready_freshness_v1(uuid,uuid,text,text)',
    'veroxa_momo_upload_pipeline_pre_private_assessment_v2(text,jsonb)',
    'veroxa_momo_upload_pipeline_v2(text,jsonb)',
    'veroxa_momo_upload_pipeline_v5_pre_private_authority_v2(text,jsonb)',
    'veroxa_prepare_momo_ai_job_legacy_v1(uuid,text,text,uuid)',
    'veroxa_queue_momo_publication_v1(uuid,uuid,uuid,uuid)',
    'veroxa_reconcile_momo_content_ai_dispatch_v1(uuid,text,uuid,uuid,text)',
    'veroxa_record_media_restaurant_association_v1(uuid,uuid,uuid,text,text,text)',
    'veroxa_record_momo_content_ai_provider_response_v1(uuid,text,text,uuid)',
    'veroxa_record_momo_original_metadata_v1(uuid,uuid,text,integer,integer)',
    'veroxa_record_momo_ready_disposition_pre_source_lock_v1(uuid,uuid,text,text,text,text,jsonb)',
    'veroxa_record_momo_ready_disposition_v1(uuid,uuid,text,text,text,text,jsonb)',
    'veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamptz)',
    'veroxa_register_momo_media_v2(uuid,text,text,bigint,text,text,jsonb,date)',
    'veroxa_register_team_private_media_v1(uuid,text,text,bigint,text,text,jsonb,date)',
    'veroxa_reject_momo_content_ai_dispatch_after_post_v1(uuid,text,uuid,uuid,text,integer,text,text)',
    'veroxa_reject_momo_content_ai_run_v1(uuid,text)',
    'veroxa_reject_momo_media_ai_candidate_v1(uuid,text,text,text)',
    'veroxa_release_momo_content_ai_dispatch_v1(uuid,text,uuid,text,boolean)',
    'veroxa_reserve_momo_content_ai_run_pre_source_lock_v1(uuid,uuid,text,text,text)',
    'veroxa_reserve_momo_content_ai_run_v1(uuid,uuid,text,text,text)',
    'veroxa_reserve_momo_content_ai_run_v5_pre_source_lock_v1(uuid,uuid,text,text,text)',
    'veroxa_reserve_momo_media_ai_candidate_v1(uuid,uuid,text,text,text,text,text,text,text)',
    'veroxa_reserve_private_media_assessment_v1(uuid,uuid,text,text,text,text,text,bigint,uuid)',
    'veroxa_stage_momo_content_ai_result_v1(uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid)',
    'veroxa_stage_momo_content_ai_webhook_result_v1(text,text,uuid,uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid)',
    'veroxa_start_momo_content_ai_run_pre_source_lock_v1(uuid,text,uuid,uuid)',
    'veroxa_start_momo_content_ai_run_v1(uuid,text,uuid,uuid)',
    'veroxa_start_momo_media_ai_provider_v1(uuid,text,uuid)',
    'veroxa_start_private_media_assessment_provider_v1(uuid,text,uuid)',
    'veroxa_submit_momo_confirmation_pre_owner_atomic_v1(uuid,text,uuid,text,text,jsonb,text)'
  ];
  authenticated_signatures constant text[] := array[
    'veroxa_approve_momo_media_ai_candidate_v1(uuid,text,text,text)',
    'veroxa_close_momo_media_ai_attempt_v1(uuid)',
    'veroxa_decide_momo_ready_package_v2(uuid,text,text,text,text)',
    'veroxa_record_media_restaurant_association_v1(uuid,uuid,uuid,text,text,text)',
    'veroxa_record_momo_original_metadata_v1(uuid,uuid,text,integer,integer)',
    'veroxa_record_momo_ready_disposition_v1(uuid,uuid,text,text,text,text,jsonb)',
    'veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamptz)',
    'veroxa_register_momo_media_v2(uuid,text,text,bigint,text,text,jsonb,date)',
    'veroxa_register_team_private_media_v1(uuid,text,text,bigint,text,text,jsonb,date)',
    'veroxa_reject_momo_content_ai_run_v1(uuid,text)',
    'veroxa_reject_momo_media_ai_candidate_v1(uuid,text,text,text)',
    'veroxa_reserve_momo_content_ai_run_v1(uuid,uuid,text,text,text)',
    'veroxa_reserve_momo_media_ai_candidate_v1(uuid,uuid,text,text,text,text,text,text,text)'
  ];
  service_signatures constant text[] := array[
    'veroxa_abort_momo_content_ai_before_provider_v1(uuid,text,uuid,uuid)',
    'veroxa_begin_momo_content_ai_dispatch_v1(uuid,text,uuid,uuid,text)',
    'veroxa_bind_momo_content_ai_dispatch_response_v1(uuid,text,uuid,uuid,text)',
    'veroxa_cancel_momo_content_ai_dispatch_before_post_v1(uuid,text,uuid,uuid,text,text)',
    'veroxa_claim_momo_content_ai_dispatch_v1(uuid,bigint,uuid)',
    'veroxa_claim_momo_content_ai_recovery_v1(uuid,bigint)',
    'veroxa_claim_momo_content_ai_webhook_v1(text,text,text,uuid,text,uuid)',
    'veroxa_complete_momo_content_ai_run_v1(uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid)',
    'veroxa_complete_momo_media_ai_candidate_v1(uuid,text,text,text,bigint,integer,integer,text,bigint,text,jsonb,uuid)',
    'veroxa_complete_private_media_assessment_v1(uuid,text,text,jsonb,text,text,bigint,text,jsonb,uuid)',
    'veroxa_complete_staged_momo_content_ai_run_v1(uuid,text,uuid)',
    'veroxa_complete_staged_momo_content_ai_webhook_v1(text,text,uuid,uuid,text,uuid)',
    'veroxa_fail_momo_content_ai_run_v1(uuid,text,text,text,boolean,bigint,jsonb,uuid)',
    'veroxa_fail_momo_content_ai_webhook_v1(text,text,uuid,uuid,text,text,text,boolean,bigint,jsonb,uuid)',
    'veroxa_fail_momo_media_ai_candidate_v1(uuid,text,text,uuid)',
    'veroxa_fail_private_media_assessment_v1(uuid,text,text,text,boolean,bigint,jsonb,uuid)',
    'veroxa_fail_unbound_momo_content_ai_dispatch_v1(uuid,text,uuid,uuid)',
    'veroxa_finalize_momo_media_intake_v1(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text,uuid)',
    'veroxa_finalize_private_media_assessment_intake_v1(uuid,uuid,uuid,text,text,bigint,integer,integer,text,jsonb,text,text,text,uuid)',
    'veroxa_finish_momo_content_ai_webhook_v1(text,text,uuid,text,uuid,text,text,text)',
    'veroxa_momo_media_ai_lifecycle_preflight_v1(uuid,uuid)',
    'veroxa_momo_upload_pipeline_v2(text,jsonb)',
    'veroxa_reconcile_momo_content_ai_dispatch_v1(uuid,text,uuid,uuid,text)',
    'veroxa_record_momo_content_ai_provider_response_v1(uuid,text,text,uuid)',
    'veroxa_reject_momo_content_ai_dispatch_after_post_v1(uuid,text,uuid,uuid,text,integer,text,text)',
    'veroxa_release_momo_content_ai_dispatch_v1(uuid,text,uuid,text,boolean)',
    'veroxa_reserve_private_media_assessment_v1(uuid,uuid,text,text,text,text,text,bigint,uuid)',
    'veroxa_stage_momo_content_ai_result_v1(uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid)',
    'veroxa_stage_momo_content_ai_webhook_result_v1(text,text,uuid,uuid,text,text,jsonb,text,text,jsonb,text,text,bigint,text,jsonb,uuid)',
    'veroxa_start_momo_content_ai_run_v1(uuid,text,uuid,uuid)',
    'veroxa_start_momo_media_ai_provider_v1(uuid,text,uuid)',
    'veroxa_start_private_media_assessment_provider_v1(uuid,text,uuid)'
  ];
  target_signature text;
  target_function regprocedure;
  runtime public.veroxa_momo_runtime_controls%rowtype;
  relevant_work bigint;
begin
  if current_user <> 'postgres'
     or session_user <> 'postgres' then
    raise exception using errcode = '42501',
      message = 'momo_internal_ai_activation_requires_postgres';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'veroxa:momo-internal-ai-activation:v1', 0
    )
  );

  if first_github_commit <>
       'a1c6796b50a1072a96a40db283503d9e2c81bbae'
     or first_sites_version <> 40
     or first_sites_version_id <>
       'appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_3e8ce417e544819196aa757cc304b789'
     or first_sites_source_commit <>
       '4ee8895f68505e8ea79bf3e0f3ea3b2871ca2b2c'
     or first_sites_source_sha256 <>
       'cec2f313e3850141117c7f69dbc1d5ad707b72ee7a7ad5f1f2efa0d6c5a34297'
     or first_sites_archive_sha256 <>
       '4bc875ee7b6fd6735569df02d3c611dde095d8c85a7ff09e1ebf465a1128ab15'
     or bound_edge_function_version <> 7
     or bound_edge_function_id <>
       '859c73c3-2102-41b4-9da1-20582acb7212'::uuid
     or bound_edge_bundle_sha256 <>
       'a6b00feeab795faa91d6d8d015c4ad399c526e1b35f702778a8c55aaba49503d' then
    raise exception using errcode = '55000',
      message = 'momo_internal_ai_first_parity_binding_invalid';
  end if;

  if p_final_merged_github_commit is null
     or p_final_sites_version is null
     or p_final_sites_version_id is null
     or p_final_sites_source_commit is null
     or p_final_sites_source_sha256 is null
     or p_final_sites_archive_sha256 is null
     or p_final_edge_function_version is null
     or p_final_edge_function_id is null
     or p_final_edge_bundle_sha256 is null
     or p_final_merged_github_commit !~ '^[0-9a-f]{40}$'
     or p_final_merged_github_commit = first_github_commit
     or p_final_sites_version <= first_sites_version
     or p_final_sites_version_id !~
       '^appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_[0-9a-f]{32}$'
     or p_final_sites_version_id = first_sites_version_id
     or p_final_sites_source_commit !~ '^[0-9a-f]{40}$'
     or p_final_sites_source_commit = first_sites_source_commit
     or p_final_sites_source_sha256 !~ '^[0-9a-f]{64}$'
     or p_final_sites_source_sha256 = first_sites_source_sha256
     or p_final_sites_archive_sha256 !~ '^[0-9a-f]{64}$'
     or p_final_sites_archive_sha256 = first_sites_archive_sha256
     or p_final_edge_function_version < bound_edge_function_version
     or p_final_edge_function_id <> bound_edge_function_id
     or p_final_edge_bundle_sha256 <> bound_edge_bundle_sha256 then
    raise exception using errcode = '22023',
      message = 'momo_internal_ai_final_parity_identity_invalid';
  end if;

  select * into runtime
  from public.veroxa_momo_runtime_controls candidate
  where candidate.restaurant_id = target_restaurant_id
  for update;
  if not found
     or runtime.ai_live_calls
     or runtime.provider_writes
     or runtime.review_replies
     or runtime.website_writes
     or runtime.external_scheduling then
    raise exception using errcode = '55000',
      message = 'momo_internal_ai_runtime_hold_invalid';
  end if;

  if (select count(*) from veroxa_private.operational_restaurant_scope scope
      where scope.scope_key = 'momo_house_san_antonio'
        and scope.restaurant_id = target_restaurant_id
        and scope.enabled) <> 1
     or not exists (
       select 1
       from veroxa_private.momo_ai_budget_controls budget
       join public.veroxa_restaurant_members member
         on member.restaurant_id = budget.restaurant_id
        and member.user_id = budget.authorized_by
       join public.veroxa_user_profiles profile
         on profile.user_id = budget.authorized_by
       where budget.restaurant_id = target_restaurant_id
         and budget.enabled
         and budget.authorization_cap_microusd = 100000000
         and not budget.external_publishing_authorized
         and member.role = 'team' and member.status = 'active'
         and profile.role = 'team' and profile.status = 'active'
     )
     or not exists (
       select 1
       from veroxa_private.momo_media_ai_wallets wallet
       where wallet.restaurant_id = target_restaurant_id
         and wallet.enabled
         and wallet.standing_automation_authorized
         and wallet.automatic_authorization_threshold_microusd = 20000000
     ) then
    raise exception using errcode = '55000',
      message = 'momo_internal_ai_authority_or_budget_invalid';
  end if;

  select
    (select count(*) from public.veroxa_private_media_assessment_intakes_v1 where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_private_media_assessments_v1 where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_private_media_assessment_events_v1 where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_momo_media_ai_candidates where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_momo_content_ai_runs where restaurant_id = target_restaurant_id) +
    (select count(*) from veroxa_private.momo_content_ai_dispatch_claims where restaurant_id = target_restaurant_id) +
    (select count(*) from veroxa_private.momo_content_ai_dispatch_outbox where restaurant_id = target_restaurant_id) +
    (select count(*) from veroxa_private.momo_content_ai_dispatch_prepost_aborts where restaurant_id = target_restaurant_id) +
    (select count(*) from veroxa_private.momo_content_ai_dispatch_wakes where restaurant_id = target_restaurant_id) +
    (select count(*) from veroxa_private.momo_content_ai_result_outbox where restaurant_id = target_restaurant_id) +
    (select count(*) from veroxa_private.momo_content_ai_webhook_events where restaurant_id = target_restaurant_id) +
    (select count(*) from veroxa_private.momo_content_ai_recovery_wakes where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_momo_ready_packages where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_momo_ready_packages_v2 where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_momo_ready_disposition_events_v1 where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_publish_queue where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_publish_attempts where restaurant_id = target_restaurant_id) +
    (select count(*) from public.veroxa_content_calendar where restaurant_id = target_restaurant_id)
  into relevant_work;
  if relevant_work <> 0
     or exists (select 1 from net.http_request_queue)
     or exists (select 1 from net._http_response) then
    raise exception using errcode = '55000',
      message = 'momo_internal_ai_zero_work_gate_failed';
  end if;

  foreach target_signature in array held_signatures loop
    target_function := pg_catalog.to_regprocedure(
      'public.' || target_signature
    );
    if target_function is null
       or pg_catalog.has_function_privilege(
         'anon', target_function, 'execute'
       )
       or pg_catalog.has_function_privilege(
         'authenticated', target_function, 'execute'
       )
       or pg_catalog.has_function_privilege(
         'service_role', target_function, 'execute'
       ) then
      raise exception using errcode = '55000',
        message = 'momo_internal_ai_registered_rpc_hold_invalid:' ||
          target_signature;
    end if;
  end loop;

  foreach target_signature in array authenticated_signatures loop
    target_function := pg_catalog.to_regprocedure(
      'public.' || target_signature
    );
    execute pg_catalog.format(
      'grant execute on function %s to authenticated', target_function
    );
  end loop;
  foreach target_signature in array service_signatures loop
    target_function := pg_catalog.to_regprocedure(
      'public.' || target_signature
    );
    execute pg_catalog.format(
      'grant execute on function %s to service_role', target_function
    );
  end loop;

  foreach target_signature in array held_signatures loop
    target_function := pg_catalog.to_regprocedure(
      'public.' || target_signature
    );
    if pg_catalog.has_function_privilege('anon', target_function, 'execute')
       or (
         target_signature = any(authenticated_signatures)
       ) is distinct from pg_catalog.has_function_privilege(
         'authenticated', target_function, 'execute'
       )
       or (
         target_signature = any(service_signatures)
       ) is distinct from pg_catalog.has_function_privilege(
         'service_role', target_function, 'execute'
       ) then
      raise exception using errcode = '55000',
        message = 'momo_internal_ai_source_grant_restore_invalid:' ||
          target_signature;
    end if;
  end loop;

  update public.veroxa_momo_runtime_controls target
  set ai_live_calls = true,
      provider_writes = false,
      review_replies = false,
      website_writes = false,
      external_scheduling = false,
      updated_at = pg_catalog.clock_timestamp()
  where target.restaurant_id = target_restaurant_id
    and not target.ai_live_calls
    and not target.provider_writes
    and not target.review_replies
    and not target.website_writes
    and not target.external_scheduling;
  if not found then
    raise exception using errcode = '55000',
      message = 'momo_internal_ai_activation_lost_runtime_lock';
  end if;

  perform pg_catalog.set_config(
    'veroxa.trusted_activity_write', 'on', true
  );
  insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id,
    actor_id, visibility, report_eligible, payload
  ) values (
    target_restaurant_id,
    'momo_internal_ai_activated_v1',
    'restaurant',
    target_restaurant_id,
    null,
    'system',
    false,
    pg_catalog.jsonb_build_object(
      'firstMergedGitHubCommit', first_github_commit,
      'firstSitesVersion', first_sites_version,
      'firstSitesVersionId', first_sites_version_id,
      'firstSitesSourceCommit', first_sites_source_commit,
      'firstSitesSourceSha256', first_sites_source_sha256,
      'firstSitesArchiveSha256', first_sites_archive_sha256,
      'finalMergedGitHubCommit', p_final_merged_github_commit,
      'finalSitesVersion', p_final_sites_version,
      'finalSitesVersionId', p_final_sites_version_id,
      'finalSitesSourceCommit', p_final_sites_source_commit,
      'finalSitesSourceSha256', p_final_sites_source_sha256,
      'finalSitesArchiveSha256', p_final_sites_archive_sha256,
      'edgeFunctionVersion', p_final_edge_function_version,
      'edgeFunctionId', p_final_edge_function_id,
      'edgeBundleSha256', p_final_edge_bundle_sha256,
      'authenticatedGrantCount',
        pg_catalog.cardinality(authenticated_signatures),
      'serviceRoleGrantCount',
        pg_catalog.cardinality(service_signatures),
      'providerCallObserved', false,
      'externalWriteAllowed', false
    )
  );

  return pg_catalog.jsonb_build_object(
    'restaurantId', target_restaurant_id,
    'aiLiveCalls', true,
    'providerWrites', false,
    'reviewReplies', false,
    'websiteWrites', false,
    'externalScheduling', false,
    'relevantWorkBeforeActivation', relevant_work,
    'authenticatedGrantCount',
      pg_catalog.cardinality(authenticated_signatures),
    'serviceRoleGrantCount',
      pg_catalog.cardinality(service_signatures),
    'providerCallObserved', false
  );
end;
$activation$;

alter function veroxa_private.activate_momo_internal_ai_v1(
  text, integer, text, text, text, text, integer, uuid, text
) owner to postgres;
revoke all on function veroxa_private.activate_momo_internal_ai_v1(
  text, integer, text, text, text, text, integer, uuid, text
) from public, anon, authenticated, service_role;

comment on function veroxa_private.activate_momo_internal_ai_v1(
  text, integer, text, text, text, text, integer, uuid, text
) is
  'Dormant postgres-only internal-AI activation bound to GitHub a1c6796b, Sites v40/source 4ee8895f/cec2f313, and JWT Edge v7/a6b00fee. Applying the migration does not invoke it.';

do $install_verify$
declare
  activation_function regprocedure := pg_catalog.to_regprocedure(
    'veroxa_private.activate_momo_internal_ai_v1(text,integer,text,text,text,text,integer,uuid,text)'
  );
begin
  if activation_function is null
     or pg_catalog.pg_get_userbyid(
       (select procedure.proowner from pg_catalog.pg_proc procedure
        where procedure.oid = activation_function)
     ) <> 'postgres'
     or not (
       select procedure.prosecdef
       from pg_catalog.pg_proc procedure
       where procedure.oid = activation_function
     )
     or (select procedure.proconfig
         from pg_catalog.pg_proc procedure
         where procedure.oid = activation_function)
       is distinct from array['search_path=""']::text[]
     or pg_catalog.has_function_privilege(
       'anon', activation_function, 'execute'
     )
     or pg_catalog.has_function_privilege(
       'authenticated', activation_function, 'execute'
     )
     or pg_catalog.has_function_privilege(
       'service_role', activation_function, 'execute'
     ) then
    raise exception using errcode = '55000',
      message = 'momo_internal_ai_activation_install_acl_invalid';
  end if;
  if (select count(*) from public.veroxa_momo_runtime_controls runtime
      where runtime.restaurant_id =
        '6386d7e3-7966-4498-a13e-8736590bd505'::uuid
        and not runtime.ai_live_calls
        and not runtime.provider_writes
        and not runtime.review_replies
        and not runtime.website_writes
        and not runtime.external_scheduling) <> 1 then
    raise exception using errcode = '55000',
      message = 'momo_internal_ai_install_changed_runtime_hold';
  end if;
end;
$install_verify$;
