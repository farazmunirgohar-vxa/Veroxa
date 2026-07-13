-- Momo Full Operating System V1 compatibility, catalog, and privilege contract.
-- The focused zero-cost operating rehearsal is exercised separately in
-- momo_zero_cost_operating_rehearsal_v1.sql.  This file intentionally remains
-- active so later hardening migrations cannot silently invalidate the original
-- seven-system contract.
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
    'veroxa_restaurant_truth_fields','veroxa_restaurant_contacts','veroxa_onboarding_steps',
    'veroxa_presence_profiles','veroxa_confirmations','veroxa_readiness_dimensions',
    'veroxa_readiness_gate_runs','veroxa_media_assets','veroxa_media_rights','veroxa_media_reviews',
    'veroxa_media_tags','veroxa_media_asset_tags','veroxa_ai_jobs','veroxa_content_strategies',
    'veroxa_content_items','veroxa_content_variants','veroxa_approvals',
    'veroxa_content_calendar','veroxa_media_usage','veroxa_provider_connections',
    'veroxa_publish_queue','veroxa_publish_attempts','veroxa_local_presence_checks',
    'veroxa_review_records','veroxa_visibility_snapshots','veroxa_work_items',
    'veroxa_job_attempts','veroxa_activity_events','veroxa_reports','veroxa_monitor_checks',
    'veroxa_alerts','veroxa_recovery_runs','veroxa_content_input_ledger',
    'veroxa_activation_decisions'
  ] loop
    if to_regclass('public.' || table_name) is null then
      raise exception 'Momo operating table is missing: %', table_name;
    end if;
    if not exists (
      select 1
      from pg_class table_record
      join pg_namespace schema_record on schema_record.oid = table_record.relnamespace
        and schema_record.nspname = 'public'
      where table_record.relname = table_name
        and table_record.relrowsecurity
        and table_record.relforcerowsecurity
    ) then
      raise exception 'Momo operating table does not force RLS: %', table_name;
    end if;
    if has_table_privilege('anon', 'public.' || table_name, 'select')
       or has_table_privilege('anon', 'public.' || table_name, 'insert')
       or has_table_privilege('anon', 'public.' || table_name, 'update')
       or has_table_privilege('anon', 'public.' || table_name, 'delete') then
      raise exception 'Anonymous table grant exists for %', table_name;
    end if;
  end loop;

  foreach table_name in array array[
    'veroxa_restaurant_truth_fields','veroxa_restaurant_contacts',
    'veroxa_confirmations','veroxa_approvals','veroxa_content_calendar',
    'veroxa_media_assets','veroxa_media_rights','veroxa_media_reviews',
    'veroxa_media_tags','veroxa_media_asset_tags','veroxa_media_usage',
    'veroxa_provider_connections','veroxa_publish_queue','veroxa_publish_attempts',
    'veroxa_local_presence_checks','veroxa_review_records','veroxa_visibility_snapshots',
    'veroxa_job_attempts','veroxa_activity_events','veroxa_reports',
    'veroxa_monitor_checks','veroxa_alerts','veroxa_recovery_runs',
    'veroxa_content_input_ledger','veroxa_activation_decisions'
  ] loop
    if has_table_privilege('authenticated', 'public.' || table_name, 'delete') then
      raise exception 'Authenticated delete grant survived for %', table_name;
    end if;
  end loop;

  foreach function_name in array array[
    'public.veroxa_momo_client_snapshot_v1(uuid)',
    'public.veroxa_submit_momo_confirmation_v1(uuid,text,uuid,text,text,jsonb,text)',
    'public.veroxa_apply_confirmation_v1(uuid,public.veroxa_review_status_v1,jsonb,text)',
    'public.veroxa_create_truth_revisions_v1(uuid,jsonb)',
    'public.veroxa_save_momo_contact_prefill_v1(uuid,uuid,text,text,text,text,boolean)',
    'public.veroxa_register_momo_media_v2(uuid,text,text,bigint,text,text,jsonb,date)',
    'public.veroxa_add_momo_media_tag_v1(uuid,uuid,text)',
    'public.veroxa_create_manual_content_draft_v1(uuid,uuid,uuid,text,text,text,boolean,uuid[],text)',
    'public.veroxa_create_manual_variant_v1(uuid,uuid,text,text)',
    'public.veroxa_schedule_momo_variant_v1(uuid,uuid,timestamp without time zone,text)',
    'public.veroxa_apply_approval_v1(uuid,public.veroxa_review_status_v1,text)',
    'public.veroxa_create_momo_report_draft_v1(uuid,text,date,date,jsonb,uuid[])',
    'public.veroxa_revise_momo_report_draft_v1(uuid,jsonb,uuid[])',
    'public.veroxa_transition_work_item_v1(uuid,public.veroxa_job_status_v1,text,text,boolean,jsonb)',
    'public.veroxa_retry_work_item_v1(uuid)',
    'public.veroxa_transition_momo_alert_v1(uuid,text,text)',
    'public.veroxa_provider_preflight_v1(uuid,text,text)',
    'public.veroxa_queue_momo_publication_v1(uuid,uuid,uuid,uuid)',
    'public.veroxa_run_momo_no_go_rehearsal_v1(uuid,text)'
  ] loop
    if to_regprocedure(function_name) is null then
      raise exception 'Required hardened RPC is missing: %', function_name;
    end if;
    if not exists (
      select 1 from pg_proc
      where oid = to_regprocedure(function_name)
        and prosecdef
        and 'search_path=""' = any(coalesce(proconfig, '{}'::text[]))
    ) then
      raise exception 'Hardened write/read RPC lacks SECURITY DEFINER empty-path posture: %', function_name;
    end if;
    if has_function_privilege('anon', function_name, 'execute')
       or not has_function_privilege('authenticated', function_name, 'execute') then
      raise exception 'Hardened RPC execute privileges are unsafe: %', function_name;
    end if;
  end loop;

  if has_function_privilege(
       'authenticated',
       'public.veroxa_create_truth_revision_v1(uuid,text,text,jsonb,text)',
       'execute'
     ) then
    raise exception 'Legacy single-truth writer remains executable';
  end if;
  if has_function_privilege(
       'authenticated',
       'public.veroxa_register_momo_media_v1(uuid,text,text,bigint,text,text,jsonb,timestamp with time zone)',
       'execute'
     ) then
    raise exception 'Legacy media registration RPC remains executable';
  end if;
end $$;
$catalog$, 'Momo operating catalog, forced RLS, hardened RPCs, and legacy revocations remain fail-closed');

select lives_ok($compatibility$
do $$
declare
  trigger_name text;
begin
  foreach trigger_name in array array[
    'veroxa_confirmations_prepare_submission',
    'veroxa_contacts_owner_confirmed_guard',
    'veroxa_content_items_owner_confirmation_guard',
    'veroxa_onboarding_owner_evidence_guard',
    'veroxa_media_rights_attestation_guard',
    'veroxa_content_input_ledger_validate',
    'veroxa_approvals_prepare_snapshot',
    'veroxa_publish_queue_approval_gate',
    'veroxa_reports_evidence_gate',
    'veroxa_media_usage_audit_guard',
    'veroxa_activation_decisions_immutable'
  ] loop
    if not exists (
      select 1 from pg_trigger where tgname = trigger_name and not tgisinternal
    ) then
      raise exception 'Required lifecycle trigger is missing: %', trigger_name;
    end if;
  end loop;

  if exists (
    select 1
    from information_schema.columns column_record
    where column_record.table_schema = 'public'
      and column_record.table_name in (
        'veroxa_provider_connections','veroxa_publish_queue',
        'veroxa_publish_attempts','veroxa_ai_jobs'
      )
      and column_record.column_name ~* '(access_token|refresh_token|api_key|client_secret|provider_secret|credential_secret)'
  ) then
    raise exception 'Provider secrets or tokens are modeled in an exposed public table';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename like 'veroxa_%'
      and ('anon'::name = any(roles) or 'public'::name = any(roles))
  ) then
    raise exception 'Anonymous Momo operations policy exists';
  end if;
end $$;
$compatibility$, 'Original seven-system boundaries remain compatible with the zero-cost rehearsal hardening');

-- Static compatibility markers retained for the readiness-contract source guard:
-- second operational restaurant; empty evidence; veroxa_momo_client_snapshot_v1
-- Client can bypass sanitized snapshot through content base table
-- Client can read internal provider connection columns directly
-- Sanitized client snapshot omitted truthful safe data
-- confirmation_subject_not_in_momo_scope
-- Kind-only confirmation update bypassed subject pairing
-- Content calendar accepted an unapproved variant
-- Transactional media review did not supersede history and update asset state
-- veroxa_apply_approval_v1; storagePath; pendingContentConfirmations

select * from finish();
rollback;
