-- Production reconciliation: make Audit V3 durable and close the six
-- mutable-search-path findings observed by the production database linter.

-- Production already contains V2 audit history. Keep that history valid while
-- permitting every newly generated V3 run and rejecting unknown versions.
alter table public.audit_runs
  drop constraint if exists audit_runs_generator_version_known;
alter table public.audit_runs
  add constraint audit_runs_generator_version_known check (
    generator_version is null
    or generator_version in ('restaurant-audit-v2', 'restaurant-audit-v3')
  ) not valid;
alter table public.audit_runs
  validate constraint audit_runs_generator_version_known;

-- Migration 11 upgraded the validator to partial V3 scoring, but inherited
-- V2's top-three-only derivation. Improvement areas and the 30/60/90 plan must
-- retain every unresolved category (at most six); fixFirst remains the three
-- highest-potential priorities.
do $migration$
declare
  v_ddl text;
  v_before text;
begin
  select pg_get_functiondef(p.oid)
  into v_ddl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'validate_generated_audit_v2'
    and p.oid = to_regprocedure(
      'private.validate_generated_audit_v2(jsonb,jsonb,text,text,text)'
    );

  if v_ddl is null or v_ddl not like '%restaurant-audit-v3%' then
    raise exception 'audit_v3_validator_not_found';
  end if;

  v_before := v_ddl;
  v_ddl := replace(
    v_ddl,
    $$  v_expected_improvement_keys text[] := array[]::text[];$$,
    $$  v_expected_improvement_keys text[] := array[]::text[];
  v_expected_fix_first_keys text[] := array[]::text[];
  v_research_id uuid;$$
  );
  if v_ddl = v_before then
    raise exception 'audit_v3_fix_first_declaration_patch_failed';
  end if;

  v_before := v_ddl;
  v_ddl := replace(
    v_ddl,
    $$     or jsonb_array_length(p_score_snapshot -> 'improvementAreas') > 3$$,
    $$     or jsonb_array_length(p_score_snapshot -> 'improvementAreas') > 6$$
  );
  if v_ddl = v_before then
    raise exception 'audit_v3_improvement_limit_patch_failed';
  end if;

  v_before := v_ddl;
  v_ddl := replace(
    v_ddl,
    $$    ))[1:3],
    array[]::text[]$$,
    $$    )),
    array[]::text[]$$
  );
  if v_ddl = v_before then
    raise exception 'audit_v3_all_improvement_keys_patch_failed';
  end if;

  v_before := v_ddl;
  v_ddl := replace(
    v_ddl,
    $$  from jsonb_array_elements(v_candidates) candidate(candidate_value);

  foreach v_key in array v_expected_improvement_keys$$,
    $$  from jsonb_array_elements(v_candidates) candidate(candidate_value);

  v_expected_fix_first_keys := v_expected_improvement_keys[1:3];

  foreach v_key in array v_expected_improvement_keys$$
  );
  if v_ddl = v_before then
    raise exception 'audit_v3_fix_first_key_patch_failed';
  end if;

  v_before := v_ddl;
  v_ddl := replace(
    v_ddl,
    $$  if p_score_snapshot ->> 'generatedAt'
       !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$' then$$,
    $$  if p_score_snapshot ? 'researchRef' then
    if jsonb_typeof(p_score_snapshot -> 'researchRef') is distinct from 'object'
       or (select count(*) from jsonb_object_keys(
         p_score_snapshot -> 'researchRef')) <> 4
       or not ((p_score_snapshot -> 'researchRef') ?& array[
         'researchId','requestHash','model','pricingVersion'
       ]::text[])
       or jsonb_typeof(p_score_snapshot #> '{researchRef,researchId}') is distinct from 'string'
       or jsonb_typeof(p_score_snapshot #> '{researchRef,requestHash}') is distinct from 'string'
       or jsonb_typeof(p_score_snapshot #> '{researchRef,model}') is distinct from 'string'
       or jsonb_typeof(p_score_snapshot #> '{researchRef,pricingVersion}') is distinct from 'string'
       or p_score_snapshot #>> '{researchRef,requestHash}' !~ '^[0-9a-f]{64}$'
       or p_score_snapshot #>> '{researchRef,model}' is distinct from 'gpt-5.6-luna'
       or p_score_snapshot #>> '{researchRef,pricingVersion}' is distinct from
         'openai-gpt-5.6-luna-web-2026-07-14-v2' then
      raise exception using errcode = '22023', message = 'invalid_audit_research_reference';
    end if;
    begin
      v_research_id := (p_score_snapshot #>> '{researchRef,researchId}')::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = '22023', message = 'invalid_audit_research_reference';
    end;
  end if;

  if p_score_snapshot ->> 'generatedAt'
       !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$' then$$
  );
  if v_ddl = v_before then
    raise exception 'audit_v3_research_reference_patch_failed';
  end if;

  v_before := v_ddl;
  v_ddl := replace(
    v_ddl,
    $$    v_expected_fix_first := v_expected_fix_first || jsonb_build_array(jsonb_build_object(
      'key', v_key,
      'title', case when v_expected_kind = 'confirmed_gap' then 'Address ' else 'Verify ' end
        || (v_definition ->> 'label'),
      'reason', v_expected_summary,
      'action', v_expected_action
    ));$$,
    $$    if v_key = any(v_expected_fix_first_keys) then
      v_expected_fix_first := v_expected_fix_first || jsonb_build_array(jsonb_build_object(
        'key', v_key,
        'title', case when v_expected_kind = 'confirmed_gap' then 'Address ' else 'Verify ' end
          || (v_definition ->> 'label'),
        'reason', v_expected_summary,
        'action', v_expected_action
      ));
    end if;$$
  );
  if v_ddl = v_before then
    raise exception 'audit_v3_fix_first_derivation_patch_failed';
  end if;

  execute v_ddl;
end
$migration$;

-- These six older public trigger functions were the exact production linter
-- findings. Alter every overload if present; fresh databases safely no-op for
-- any legacy function that is absent. pg_catalog comes first and public is
-- explicit so existing unqualified references keep their intended meaning.
do $migration$
declare
  v_function regprocedure;
begin
  for v_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'enforce_post_lock',
        'enforce_weekly_report_snapshot',
        'enforce_monthly_report_snapshot',
        'enforce_activity_logs_append_only',
        'user_profiles_set_updated_at',
        'set_updated_at'
      ]::text[])
  loop
    execute format(
      'alter function %s set search_path = pg_catalog, public',
      v_function
    );
  end loop;
end
$migration$;
