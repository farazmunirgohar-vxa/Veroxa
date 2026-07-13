-- Restore the complete Team audit workflow without paid provider calls.
-- Generation happens locally in the Sites client. These contracts validate and
-- atomically persist only an explicitly saved, versioned audit preview.

alter table public.audit_runs
  add column if not exists generator_version text,
  add column if not exists save_idempotency_hash text;

alter table public.audit_reports
  add column if not exists improvement_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists plan_snapshot jsonb not null default '{}'::jsonb;

create table if not exists veroxa_private.audit_onboarding_conversions (
  id uuid primary key default gen_random_uuid(),
  audit_request_id uuid not null unique references public.audit_requests(id) on delete restrict,
  audit_run_id uuid not null unique references public.audit_runs(id) on delete restrict,
  audit_report_id uuid not null references public.audit_reports(id) on delete restrict,
  restaurant_id uuid not null unique references public.veroxa_restaurants(id) on delete restrict,
  conversion_state text not null default 'pending_profile' check (
    conversion_state in ('pending_profile', 'withdrawn')
  ),
  consent_version text not null check (consent_version = 'audit-onboarding-consent-v1'),
  consent_text text not null,
  consent_sha256 text not null check (consent_sha256 ~ '^[0-9a-f]{64}$'),
  consent_channel text not null check (
    consent_channel in ('written', 'email', 'signed_form', 'recorded_call')
  ),
  consent_evidence_reference text not null check (
    char_length(btrim(consent_evidence_reference)) between 10 and 1000
  ),
  consented_at timestamptz not null,
  consent_snapshot jsonb not null check (jsonb_typeof(consent_snapshot) = 'object'),
  prefill_snapshot jsonb not null check (jsonb_typeof(prefill_snapshot) = 'object'),
  prefill_sha256 text not null check (prefill_sha256 ~ '^[0-9a-f]{64}$'),
  idempotency_hash text not null unique check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  recorded_by uuid not null references public.veroxa_user_profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table veroxa_private.audit_onboarding_conversions
  from public, anon, authenticated;

alter table public.audit_runs
  drop constraint if exists audit_runs_generator_version_known,
  add constraint audit_runs_generator_version_known check (
    generator_version is null or generator_version = 'restaurant-audit-v2'
  );

alter table public.audit_reports
  drop constraint if exists audit_reports_improvement_array,
  add constraint audit_reports_improvement_array check (
    jsonb_typeof(improvement_snapshot) = 'array'
  ),
  drop constraint if exists audit_reports_plan_object,
  add constraint audit_reports_plan_object check (
    jsonb_typeof(plan_snapshot) = 'object'
  );

create unique index if not exists audit_runs_save_idempotency_hash_unique
  on public.audit_runs (save_idempotency_hash)
  where save_idempotency_hash is not null;

create or replace function private.validate_generated_audit_v2(
  p_score_snapshot jsonb,
  p_findings jsonb,
  p_executive_summary text,
  p_priority_actions text,
  p_save_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_honesty_note constant text := 'This is a provisional online-presence assessment based only on explicitly confirmed or unknown Team-reviewed signals. It does not guarantee rankings, customers, orders, revenue, profit, ROI, or any other outcome. Unknown signals require verification before the audit is treated as complete.';
  v_definitions jsonb := jsonb_build_array(
    jsonb_build_object(
      'key', 'google_business_profile', 'label', 'Google Business Profile', 'weight', 20, 'position', 1,
      'gap_summary', 'A material Google Business Profile gap was confirmed in the reviewed signals.',
      'first_action', 'Prepare the confirmed profile details, hours, primary links, and current photo needs for Team review before any external change.',
      'days_31_60_action', 'Recheck the Google profile for approved detail consistency, working links, and current visual evidence.',
      'days_61_90_action', 'Compare the Google profile with the baseline audit and retain only evidence-backed follow-up priorities.'
    ),
    jsonb_build_object(
      'key', 'website_experience', 'label', 'Website Experience', 'weight', 15, 'position', 2,
      'gap_summary', 'A material website availability, usability, or contact-path gap was confirmed.',
      'first_action', 'Document the confirmed website gap and prepare the smallest accurate correction for review.',
      'days_31_60_action', 'Recheck mobile usability and the menu, order, contact, and direction paths after approved corrections.',
      'days_61_90_action', 'Compare website clarity with the baseline and prioritize only verified remaining friction.'
    ),
    jsonb_build_object(
      'key', 'menu_and_ordering', 'label', 'Menu and Ordering Paths', 'weight', 20, 'position', 3,
      'gap_summary', 'A material menu, ordering, hours, or service-path gap was confirmed.',
      'first_action', 'Verify the restaurant-owned menu and ordering details, then prepare a clear path correction for review.',
      'days_31_60_action', 'Test the approved menu and ordering paths again and record any remaining dead ends or unclear choices.',
      'days_61_90_action', 'Compare menu and ordering access with the baseline and keep only current, verified actions in the plan.'
    ),
    jsonb_build_object(
      'key', 'social_presence', 'label', 'Social Presence', 'weight', 15, 'position', 4,
      'gap_summary', 'A material social-profile clarity, consistency, or freshness gap was confirmed.',
      'first_action', 'Prepare a reviewed social-profile consistency and content-rhythm correction without publishing automatically.',
      'days_31_60_action', 'Recheck profile identity and the approved content rhythm using dated evidence rather than assumed performance.',
      'days_61_90_action', 'Compare social consistency with the baseline and refine the plan only from observed, documented signals.'
    ),
    jsonb_build_object(
      'key', 'reviews_and_trust', 'label', 'Reviews and Trust', 'weight', 15, 'position', 5,
      'gap_summary', 'A material review visibility, response, or trust-signal gap was confirmed.',
      'first_action', 'Document the verified review gap and prepare a human-reviewed response or trust-maintenance workflow.',
      'days_31_60_action', 'Recheck review freshness and response coverage while keeping sensitive language under human review.',
      'days_61_90_action', 'Compare review and trust signals with the baseline without claiming causation or guaranteed results.'
    ),
    jsonb_build_object(
      'key', 'local_search_consistency', 'label', 'Local Search Consistency', 'weight', 15, 'position', 6,
      'gap_summary', 'A material local identity, location wording, or directions-path gap was confirmed.',
      'first_action', 'Verify name, address, phone, location wording, and directions evidence before preparing consistency corrections.',
      'days_31_60_action', 'Recheck approved local information across the reviewed public sources and document any mismatch.',
      'days_61_90_action', 'Compare local-search consistency with the baseline and keep recommendations limited to verified evidence.'
    )
  );
  v_category jsonb;
  v_definition jsonb;
  v_candidates jsonb := '[]'::jsonb;
  v_expected_improvements jsonb := '[]'::jsonb;
  v_expected_fix_first jsonb := '[]'::jsonb;
  v_expected_days_0_30 jsonb := '[]'::jsonb;
  v_expected_days_31_60 jsonb := '[]'::jsonb;
  v_expected_days_61_90 jsonb := '[]'::jsonb;
  v_expected_plan jsonb;
  v_key text;
  v_status text;
  v_expected_kind text;
  v_expected_priority text;
  v_expected_summary text;
  v_expected_action text;
  v_seen_keys text[] := array[]::text[];
  v_expected_improvement_keys text[] := array[]::text[];
  v_weight numeric;
  v_score numeric;
  v_score_total numeric := 0;
  v_coverage_total numeric := 0;
  v_expected_confidence text;
  v_generated_at timestamptz;
  v_ordinality bigint;
  v_category_key_count integer;
  v_invalid_finding boolean;
begin
  if jsonb_typeof(p_score_snapshot) is distinct from 'object'
     or p_score_snapshot ->> 'engineVersion' is distinct from 'restaurant-audit-v2'
     or jsonb_typeof(p_score_snapshot -> 'schemaVersion') is distinct from 'number'
     or jsonb_typeof(p_score_snapshot -> 'overallScore') is distinct from 'number'
     or jsonb_typeof(p_score_snapshot -> 'maxScore') is distinct from 'number'
     or jsonb_typeof(p_score_snapshot -> 'evidenceCoverage') is distinct from 'number'
     or jsonb_typeof(p_score_snapshot -> 'confidence') is distinct from 'string'
     or jsonb_typeof(p_score_snapshot -> 'categories') is distinct from 'array'
     or jsonb_typeof(p_score_snapshot -> 'improvementAreas') is distinct from 'array'
     or jsonb_typeof(p_score_snapshot -> 'fixFirst') is distinct from 'array'
     or jsonb_typeof(p_score_snapshot -> 'plan') is distinct from 'object'
     or jsonb_typeof(p_score_snapshot #> '{plan,days_0_30}') is distinct from 'array'
     or jsonb_typeof(p_score_snapshot #> '{plan,days_31_60}') is distinct from 'array'
     or jsonb_typeof(p_score_snapshot #> '{plan,days_61_90}') is distinct from 'array'
     or jsonb_typeof(p_score_snapshot -> 'generatedAt') is distinct from 'string'
     or jsonb_typeof(p_score_snapshot -> 'honestyNote') is distinct from 'string'
     or p_score_snapshot ->> 'honestyNote' is distinct from v_honesty_note then
    raise exception using errcode = '22023', message = 'invalid_generated_audit_snapshot';
  end if;

  if (p_score_snapshot ->> 'schemaVersion')::numeric <> 2
     or (p_score_snapshot ->> 'maxScore')::numeric <> 100
     or (p_score_snapshot ->> 'overallScore')::numeric not between 0 and 100
     or mod((p_score_snapshot ->> 'overallScore')::numeric, 1) <> 0
     or (p_score_snapshot ->> 'evidenceCoverage')::numeric not between 0 and 100
     or mod((p_score_snapshot ->> 'evidenceCoverage')::numeric, 1) <> 0
     or not ((p_score_snapshot ->> 'confidence') = any(array['low', 'medium', 'high']::text[]))
     or jsonb_array_length(p_score_snapshot -> 'categories') <> 6
     or jsonb_array_length(p_score_snapshot -> 'improvementAreas') > 3
     or jsonb_array_length(p_score_snapshot #> '{plan,days_0_30}') = 0
     or jsonb_array_length(p_score_snapshot #> '{plan,days_31_60}') = 0
     or jsonb_array_length(p_score_snapshot #> '{plan,days_61_90}') = 0 then
    raise exception using errcode = '22023', message = 'invalid_generated_audit_snapshot';
  end if;

  if p_score_snapshot ->> 'generatedAt'
       !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$' then
    raise exception using errcode = '22023', message = 'invalid_generated_audit_timestamp';
  end if;
  begin
    v_generated_at := (p_score_snapshot ->> 'generatedAt')::timestamptz;
  exception
    when invalid_datetime_format or datetime_field_overflow then
      raise exception using errcode = '22023', message = 'invalid_generated_audit_timestamp';
  end;

  for v_category, v_ordinality in
    select value, ordinality
    from jsonb_array_elements(p_score_snapshot -> 'categories') with ordinality
  loop
    if jsonb_typeof(v_category) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'invalid_generated_audit_categories';
    end if;
    select count(*)::integer into v_category_key_count
    from jsonb_object_keys(v_category);
    if v_category_key_count <> 7
       or jsonb_typeof(v_category -> 'key') is distinct from 'string'
       or jsonb_typeof(v_category -> 'label') is distinct from 'string'
       or jsonb_typeof(v_category -> 'weight') is distinct from 'number'
       or jsonb_typeof(v_category -> 'status') is distinct from 'string'
       or jsonb_typeof(v_category -> 'score') is distinct from 'number'
       or (
         jsonb_typeof(v_category -> 'evidenceUrl') is distinct from 'null'
         and jsonb_typeof(v_category -> 'evidenceUrl') is distinct from 'string'
       )
       or (
         jsonb_typeof(v_category -> 'note') is distinct from 'null'
         and jsonb_typeof(v_category -> 'note') is distinct from 'string'
       ) then
      raise exception using errcode = '22023', message = 'invalid_generated_audit_categories';
    end if;

    v_key := v_category ->> 'key';
    v_status := v_category ->> 'status';
    v_definition := null;
    select value into v_definition
    from jsonb_array_elements(v_definitions)
    where value ->> 'key' = v_key;
    if v_definition is null
       or v_key = any(v_seen_keys)
       or (v_definition ->> 'position')::bigint <> v_ordinality
       or v_category ->> 'label' is distinct from v_definition ->> 'label'
       or not (v_status = any(array['confirmed_present', 'confirmed_missing', 'unknown']::text[])) then
      raise exception using errcode = '22023', message = 'invalid_generated_audit_categories';
    end if;

    v_weight := (v_category ->> 'weight')::numeric;
    v_score := (v_category ->> 'score')::numeric;
    if mod(v_weight, 1) <> 0
       or v_weight <> (v_definition ->> 'weight')::numeric
       or mod(v_score, 1) <> 0
       or v_score <> (case when v_status = 'confirmed_present' then v_weight else 0 end) then
      raise exception using errcode = '22023', message = 'invalid_generated_audit_categories';
    end if;

    if jsonb_typeof(v_category -> 'evidenceUrl') = 'string'
       and (
         char_length(v_category ->> 'evidenceUrl') not between 8 and 2000
         or v_category ->> 'evidenceUrl' is distinct from btrim(v_category ->> 'evidenceUrl')
         or v_category ->> 'evidenceUrl' !~* '^https?://[^[:space:]]+$'
       ) then
      raise exception using errcode = '22023', message = 'invalid_generated_audit_categories';
    end if;
    if v_status <> 'unknown' and jsonb_typeof(v_category -> 'evidenceUrl') <> 'string' then
      raise exception using errcode = '22023', message = 'confirmed_audit_category_requires_evidence';
    end if;
    if jsonb_typeof(v_category -> 'note') = 'string'
       and (
         char_length(v_category ->> 'note') not between 1 and 2000
         or v_category ->> 'note' is distinct from btrim(v_category ->> 'note')
       ) then
      raise exception using errcode = '22023', message = 'invalid_generated_audit_categories';
    end if;

    v_seen_keys := array_append(v_seen_keys, v_key);
    v_score_total := v_score_total + v_score;
    if v_status <> 'unknown' then
      v_coverage_total := v_coverage_total + v_weight;
    else
      null;
    end if;
    if v_status <> 'confirmed_present' then
      v_candidates := v_candidates || jsonb_build_array(jsonb_build_object(
        'key', v_key,
        'kind_rank', case when v_status = 'confirmed_missing' then 0 else 1 end,
        'weight', v_weight,
        'position', (v_definition ->> 'position')::integer
      ));
    end if;
  end loop;

  v_expected_confidence := case
    when v_coverage_total >= 75 then 'high'
    when v_coverage_total >= 40 then 'medium'
    else 'low'
  end;
  if v_score_total <> (p_score_snapshot ->> 'overallScore')::numeric
     or v_coverage_total <> (p_score_snapshot ->> 'evidenceCoverage')::numeric
     or p_score_snapshot ->> 'confidence' is distinct from v_expected_confidence then
    raise exception using errcode = '22023', message = 'invalid_generated_audit_totals';
  end if;

  select coalesce(
    (array_agg(
      candidate_value ->> 'key'
      order by
        (candidate_value ->> 'kind_rank')::integer,
        (candidate_value ->> 'weight')::numeric desc,
        (candidate_value ->> 'position')::integer
    ))[1:3],
    array[]::text[]
  )
  into v_expected_improvement_keys
  from jsonb_array_elements(v_candidates) candidate(candidate_value);

  foreach v_key in array v_expected_improvement_keys
  loop
    select value into v_definition
    from jsonb_array_elements(v_definitions)
    where value ->> 'key' = v_key;
    select value into v_category
    from jsonb_array_elements(p_score_snapshot -> 'categories')
    where value ->> 'key' = v_key;
    v_status := v_category ->> 'status';
    v_expected_kind := case
      when v_status = 'confirmed_missing' then 'confirmed_gap'
      else 'verification_needed'
    end;
    v_expected_priority := case
      when (v_definition ->> 'weight')::integer >= 20 then 'high'
      else 'medium'
    end;
    v_expected_summary := case
      when v_status = 'confirmed_missing' then v_definition ->> 'gap_summary'
      else (v_definition ->> 'label')
        || ' is still unknown, so no points are credited and no external condition is assumed.'
    end;
    v_expected_action := case
      when v_status = 'confirmed_missing' then v_definition ->> 'first_action'
      else 'Verify ' || lower(v_definition ->> 'label')
        || ' and attach dated evidence before treating this part of the audit as complete.'
    end;

    v_expected_improvements := v_expected_improvements || jsonb_build_array(jsonb_build_object(
      'key', v_key,
      'label', v_definition ->> 'label',
      'kind', v_expected_kind,
      'priority', v_expected_priority,
      'potentialPoints', (v_definition ->> 'weight')::integer,
      'summary', v_expected_summary,
      'recommendedAction', v_expected_action
    ));
    v_expected_fix_first := v_expected_fix_first || jsonb_build_array(jsonb_build_object(
      'key', v_key,
      'title', case when v_expected_kind = 'confirmed_gap' then 'Address ' else 'Verify ' end
        || (v_definition ->> 'label'),
      'reason', v_expected_summary,
      'action', v_expected_action
    ));

    if v_status = 'confirmed_missing' then
      v_expected_days_0_30 := v_expected_days_0_30
        || jsonb_build_array(v_definition ->> 'first_action');
      v_expected_days_31_60 := v_expected_days_31_60
        || jsonb_build_array(v_definition ->> 'days_31_60_action');
      v_expected_days_61_90 := v_expected_days_61_90
        || jsonb_build_array(v_definition ->> 'days_61_90_action');
    else
      v_expected_days_0_30 := v_expected_days_0_30 || jsonb_build_array(
        'Verify ' || lower(v_definition ->> 'label')
          || ' and attach dated evidence before recommending a change.'
      );
      v_expected_days_31_60 := v_expected_days_31_60 || jsonb_build_array(
        'If ' || lower(v_definition ->> 'label')
          || ' remains unclear, repeat the manual check and document the final known state.'
      );
      v_expected_days_61_90 := v_expected_days_61_90 || jsonb_build_array(
        'Compare ' || lower(v_definition ->> 'label')
          || ' with the baseline and update the audit only from verified evidence.'
      );
    end if;
  end loop;

  if cardinality(v_expected_improvement_keys) = 0 then
    v_expected_days_0_30 := jsonb_build_array(
      'Record the current baseline and confirm that every cited source is still accurate.'
    );
    v_expected_days_31_60 := jsonb_build_array(
      'Recheck profile freshness, public links, and business-information consistency before preparing maintenance work.'
    );
    v_expected_days_61_90 := jsonb_build_array(
      'Run a comparison audit and keep only evidence-backed maintenance priorities.'
    );
  end if;
  v_expected_plan := jsonb_build_object(
    'days_0_30', v_expected_days_0_30,
    'days_31_60', v_expected_days_31_60,
    'days_61_90', v_expected_days_61_90
  );
  if p_score_snapshot -> 'improvementAreas' is distinct from v_expected_improvements
     or p_score_snapshot -> 'fixFirst' is distinct from v_expected_fix_first
     or p_score_snapshot -> 'plan' is distinct from v_expected_plan then
    raise exception using errcode = '22023', message = 'generated_audit_derivation_mismatch';
  end if;

  if jsonb_typeof(p_findings) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'invalid_generated_audit_findings';
  end if;
  if jsonb_array_length(p_findings) > 6 then
    raise exception using errcode = '22023', message = 'invalid_generated_audit_findings';
  end if;

  select coalesce(bool_or(
    jsonb_typeof(item) is distinct from 'object'
    or char_length(btrim(coalesce(item ->> 'category', ''))) not between 2 and 80
    or jsonb_typeof(item -> 'severity') is distinct from 'string'
    or not ((item ->> 'severity') = any(array['opportunity', 'low', 'medium', 'high', 'critical']::text[]))
    or char_length(btrim(coalesce(item ->> 'title', ''))) not between 2 and 180
    or char_length(btrim(coalesce(item ->> 'summary', ''))) not between 2 and 3000
    or char_length(btrim(coalesce(item ->> 'recommendedAction', ''))) not between 2 and 3000
    or jsonb_typeof(item -> 'evidenceUrl') is distinct from 'string'
    or item ->> 'evidenceUrl' !~* '^https?://[^[:space:]]+$'
    or item ->> 'evidenceUrl' is distinct from btrim(item ->> 'evidenceUrl')
    or (
      item ? 'evidenceLabel'
      and jsonb_typeof(item -> 'evidenceLabel') is distinct from 'null'
      and jsonb_typeof(item -> 'evidenceLabel') is distinct from 'string'
    )
    or (
      jsonb_typeof(item -> 'evidenceLabel') = 'string'
      and char_length(item ->> 'evidenceLabel') > 180
    )
  ), false)
  into v_invalid_finding
  from jsonb_array_elements(p_findings) item;

  if v_invalid_finding then
    raise exception using errcode = '22023', message = 'invalid_generated_audit_findings';
  end if;

  if char_length(btrim(coalesce(p_executive_summary, ''))) not between 20 and 5000
     or char_length(btrim(coalesce(p_priority_actions, ''))) not between 20 and 8000
     or char_length(btrim(coalesce(p_save_key, ''))) not between 16 and 200 then
    raise exception using errcode = '22023', message = 'invalid_generated_audit_report';
  end if;
end;
$$;

revoke all on function private.validate_generated_audit_v2(jsonb,jsonb,text,text,text)
  from public, anon, authenticated;

create or replace function private.persist_generated_audit_result_v2(
  p_audit_run_id uuid,
  p_score_snapshot jsonb,
  p_findings jsonb,
  p_executive_summary text,
  p_priority_actions text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_finding jsonb;
begin
  for v_finding in select value from jsonb_array_elements(p_findings)
  loop
    insert into public.audit_findings (
      audit_run_id, category, severity, title, summary, evidence_url,
      evidence_label, recommended_action, created_by
    ) values (
      p_audit_run_id,
      btrim(v_finding ->> 'category'),
      (v_finding ->> 'severity')::public.audit_finding_severity,
      btrim(v_finding ->> 'title'),
      btrim(v_finding ->> 'summary'),
      btrim(v_finding ->> 'evidenceUrl'),
      nullif(btrim(coalesce(v_finding ->> 'evidenceLabel', '')), ''),
      btrim(v_finding ->> 'recommendedAction'),
      auth.uid()
    );
  end loop;

  insert into public.audit_reports (
    audit_run_id, status, executive_summary, priority_actions, honesty_note,
    improvement_snapshot, plan_snapshot, prepared_by
  ) values (
    p_audit_run_id,
    'ready_for_review',
    btrim(p_executive_summary),
    btrim(p_priority_actions),
    p_score_snapshot ->> 'honestyNote',
    p_score_snapshot -> 'improvementAreas',
    p_score_snapshot -> 'plan',
    auth.uid()
  );
end;
$$;

revoke all on function private.persist_generated_audit_result_v2(uuid,jsonb,jsonb,text,text)
  from public, anon, authenticated;

create or replace function public.save_team_generated_audit_v2(
  p_restaurant_name text,
  p_city text,
  p_state text,
  p_website_url text,
  p_google_profile_url text,
  p_score_snapshot jsonb,
  p_findings jsonb,
  p_executive_summary text,
  p_priority_actions text,
  p_team_note text,
  p_save_key text
)
returns table(request_id uuid, run_id uuid, reference_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_restaurant_name, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_state text := btrim(coalesce(p_state, ''));
  v_save_hash text := encode(extensions.digest(
    'restaurant-audit-v2:new:' || btrim(coalesce(p_save_key, '')),
    'sha256'
  ), 'hex');
  v_restaurant_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_run_id uuid;
  v_reference text;
  v_existing record;
begin
  if not public.veroxa_current_user_is_active_team() then
    raise exception using errcode = '42501', message = 'team_access_required';
  end if;
  perform private.validate_generated_audit_v2(
    p_score_snapshot, p_findings, p_executive_summary, p_priority_actions, p_save_key
  );

  if char_length(v_name) not between 2 and 160
     or char_length(v_city) not between 2 and 100
     or char_length(v_state) not between 2 and 40
     or (nullif(btrim(coalesce(p_website_url, '')), '') is not null and p_website_url !~* '^https?://')
     or (nullif(btrim(coalesce(p_google_profile_url, '')), '') is not null and p_google_profile_url !~* '^https?://')
     or char_length(btrim(coalesce(p_team_note, ''))) > 4000 then
    raise exception using errcode = '22023', message = 'invalid_restaurant_identity';
  end if;

  -- Serialize before the first lookup so simultaneous retries converge on the
  -- same committed row instead of racing the partial unique index.
  perform pg_advisory_xact_lock(hashtextextended(v_save_hash, 0));
  select request.id as request_id, run.id as run_id, request.reference_code
  into v_existing
  from public.audit_runs run
  join public.audit_requests request on request.id = run.audit_request_id
  where run.save_idempotency_hash = v_save_hash
    and request.source = 'team_generated_v2';
  if found then
    return query select v_existing.request_id, v_existing.run_id, v_existing.reference_code;
    return;
  end if;

  insert into public.audit_restaurants (
    restaurant_name, normalized_name, city, normalized_city, state,
    normalized_state, website_url, google_profile_url, source
  ) values (
    v_name, lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_city, lower(regexp_replace(v_city, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_state, lower(v_state), nullif(btrim(coalesce(p_website_url, '')), ''),
    nullif(btrim(coalesce(p_google_profile_url, '')), ''), 'team_generated_v2'
  ) returning id into v_restaurant_id;

  v_reference := 'VA-' || upper(substr(replace(v_request_id::text, '-', ''), 1, 10));
  insert into public.audit_requests (
    id, reference_code, audit_restaurant_id, source, status
  ) values (
    v_request_id, v_reference, v_restaurant_id, 'team_generated_v2', 'ready_for_review'
  );

  insert into public.audit_runs (
    audit_request_id, run_number, status, source_snapshot, score_snapshot,
    generator_version, save_idempotency_hash, started_at, completed_at
  ) values (
    v_request_id,
    1,
    'ready_for_review',
    jsonb_build_object(
      'source', 'team_generated_v2',
      'website_url', nullif(btrim(coalesce(p_website_url, '')), ''),
      'google_profile_url', nullif(btrim(coalesce(p_google_profile_url, '')), ''),
      'categories', p_score_snapshot -> 'categories',
      'generated_at', p_score_snapshot ->> 'generatedAt'
    ),
    p_score_snapshot,
    'restaurant-audit-v2',
    v_save_hash,
    now(),
    now()
  ) returning id into v_run_id;

  perform private.persist_generated_audit_result_v2(
    v_run_id, p_score_snapshot, p_findings, p_executive_summary, p_priority_actions
  );

  if nullif(btrim(coalesce(p_team_note, '')), '') is not null then
    insert into public.audit_notes (audit_request_id, body, created_by)
    values (v_request_id, btrim(p_team_note), auth.uid());
  end if;

  return query select v_request_id, v_run_id, v_reference;
end;
$$;

create or replace function public.complete_team_generated_audit_run_v2(
  p_audit_run_id uuid,
  p_score_snapshot jsonb,
  p_findings jsonb,
  p_executive_summary text,
  p_priority_actions text,
  p_save_key text
)
returns table(request_id uuid, run_id uuid, reference_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.audit_runs%rowtype;
  v_request public.audit_requests%rowtype;
  v_request_id uuid;
  v_save_hash text := encode(extensions.digest(
    'restaurant-audit-v2:complete:'
      || coalesce(p_audit_run_id::text, '') || ':'
      || btrim(coalesce(p_save_key, '')),
    'sha256'
  ), 'hex');
  v_existing record;
begin
  if not public.veroxa_current_user_is_active_team() then
    raise exception using errcode = '42501', message = 'team_access_required';
  end if;
  perform private.validate_generated_audit_v2(
    p_score_snapshot, p_findings, p_executive_summary, p_priority_actions, p_save_key
  );
  if p_audit_run_id is null then
    raise exception using errcode = '22023', message = 'audit_run_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_save_hash, 0));
  select request.id as request_id, run.id as run_id, request.reference_code
  into v_existing
  from public.audit_runs run
  join public.audit_requests request on request.id = run.audit_request_id
  where run.save_idempotency_hash = v_save_hash
    and run.id = p_audit_run_id;
  if found then
    return query select v_existing.request_id, v_existing.run_id, v_existing.reference_code;
    return;
  end if;

  select audit_request_id into v_request_id
  from public.audit_runs where id = p_audit_run_id;
  if v_request_id is null then
    raise exception using errcode = '22023', message = 'audit_run_not_found';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_request_id::text, 0));
  select * into v_request from public.audit_requests where id = v_request_id for update;
  select * into v_run from public.audit_runs where id = p_audit_run_id for update;
  if v_run.status not in ('queued', 'in_progress')
     or v_run.score_snapshot <> '{}'::jsonb
     or v_run.generator_version is not null
     or exists (
       select 1 from public.audit_runs later_run
       where later_run.audit_request_id = v_run.audit_request_id
         and later_run.run_number > v_run.run_number
     )
     or exists (select 1 from public.audit_findings where audit_run_id = v_run.id)
     or exists (select 1 from public.audit_reports where audit_run_id = v_run.id) then
    raise exception using errcode = '55000', message = 'audit_run_is_not_an_empty_draft';
  end if;

  update public.audit_runs set
    status = 'ready_for_review',
    source_snapshot = source_snapshot || jsonb_build_object(
      'source', 'team_generated_v2',
      'categories', p_score_snapshot -> 'categories',
      'generated_at', p_score_snapshot ->> 'generatedAt'
    ),
    score_snapshot = p_score_snapshot,
    generator_version = 'restaurant-audit-v2',
    save_idempotency_hash = v_save_hash,
    started_at = coalesce(started_at, now()),
    completed_at = now(),
    reviewed_by = null,
    reviewed_at = null
  where id = v_run.id;

  perform private.persist_generated_audit_result_v2(
    v_run.id, p_score_snapshot, p_findings, p_executive_summary, p_priority_actions
  );
  update public.audit_requests set
    status = 'ready_for_review',
    reviewed_by = null,
    reviewed_at = null
  where id = v_request.id;

  return query select v_request.id, v_run.id, v_request.reference_code;
end;
$$;

create or replace function public.save_team_generated_audit_rerun_v2(
  p_audit_request_id uuid,
  p_expected_previous_run_id uuid,
  p_score_snapshot jsonb,
  p_findings jsonb,
  p_executive_summary text,
  p_priority_actions text,
  p_comparison_summary text,
  p_save_key text
)
returns table(request_id uuid, run_id uuid, reference_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.audit_requests%rowtype;
  v_previous public.audit_runs%rowtype;
  v_run_id uuid;
  v_save_hash text := encode(extensions.digest(
    'restaurant-audit-v2:rerun:'
      || coalesce(p_audit_request_id::text, '') || ':'
      || coalesce(p_expected_previous_run_id::text, '') || ':'
      || btrim(coalesce(p_save_key, '')),
    'sha256'
  ), 'hex');
  v_existing record;
begin
  if not public.veroxa_current_user_is_active_team() then
    raise exception using errcode = '42501', message = 'team_access_required';
  end if;
  perform private.validate_generated_audit_v2(
    p_score_snapshot, p_findings, p_executive_summary, p_priority_actions, p_save_key
  );
  if char_length(btrim(coalesce(p_comparison_summary, ''))) < 10 then
    raise exception using errcode = '22023', message = 'rerun_comparison_required';
  end if;
  if p_audit_request_id is null or p_expected_previous_run_id is null then
    raise exception using errcode = '22023', message = 'audit_request_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_save_hash, 0));
  select request.id as request_id, run.id as run_id, request.reference_code
  into v_existing
  from public.audit_runs run
  join public.audit_requests request on request.id = run.audit_request_id
  where run.save_idempotency_hash = v_save_hash
    and run.audit_request_id = p_audit_request_id
    and run.previous_run_id = p_expected_previous_run_id;
  if found then
    return query select v_existing.request_id, v_existing.run_id, v_existing.reference_code;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_audit_request_id::text, 0));
  select * into v_request from public.audit_requests where id = p_audit_request_id for update;
  select * into v_previous from public.audit_runs
  where audit_request_id = p_audit_request_id
  order by run_number desc limit 1 for update;
  if v_request.id is null or v_previous.id is null then
    raise exception using errcode = '22023', message = 'audit_request_not_found';
  end if;
  if v_previous.id is distinct from p_expected_previous_run_id
     or v_previous.status <> 'reviewed'::public.audit_run_status then
    raise exception using errcode = '55000', message = 'latest_reviewed_run_changed';
  end if;

  insert into public.audit_runs (
    audit_request_id, previous_run_id, run_number, status, source_snapshot,
    score_snapshot, generator_version, save_idempotency_hash,
    comparison_summary, started_at, completed_at
  ) values (
    v_request.id,
    v_previous.id,
    v_previous.run_number + 1,
    'ready_for_review',
    v_previous.source_snapshot || jsonb_build_object(
      'source', 'team_generated_rerun_v2',
      'categories', p_score_snapshot -> 'categories',
      'generated_at', p_score_snapshot ->> 'generatedAt',
      'previous_run_id', v_previous.id
    ),
    p_score_snapshot,
    'restaurant-audit-v2',
    v_save_hash,
    btrim(p_comparison_summary),
    now(),
    now()
  ) returning id into v_run_id;

  perform private.persist_generated_audit_result_v2(
    v_run_id, p_score_snapshot, p_findings, p_executive_summary, p_priority_actions
  );
  update public.audit_requests set
    status = 'ready_for_review',
    reviewed_by = null,
    reviewed_at = null
  where id = v_request.id;

  return query select v_request.id, v_run_id, v_request.reference_code;
end;
$$;

create or replace function private.enforce_reviewed_finding_immutability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    tg_op in ('UPDATE', 'DELETE') and exists (
      select 1 from public.audit_runs
      where id = old.audit_run_id and status = 'reviewed'::public.audit_run_status
    )
  ) or (
    tg_op in ('INSERT', 'UPDATE') and exists (
      select 1 from public.audit_runs
      where id = new.audit_run_id and status = 'reviewed'::public.audit_run_status
    )
  ) then
    raise exception using errcode = '55000', message = 'reviewed_audit_findings_are_immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.enforce_reviewed_finding_immutability()
  from public, anon, authenticated;

create or replace function public.veroxa_convert_reviewed_audit_to_pending_profile_v1(
  p_audit_request_id uuid,
  p_consent_version text,
  p_consent_text text,
  p_consent_channel text,
  p_consent_evidence_reference text,
  p_consented_at timestamptz,
  p_idempotency_key text
)
returns table(conversion_id uuid, pending_restaurant_id uuid, conversion_state text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected_consent constant text := 'I agree that Veroxa may create a pending restaurant onboarding profile using the reviewed audit information. This does not activate services, connect accounts, authorize publishing, or create charges.';
  v_request public.audit_requests%rowtype;
  v_restaurant public.audit_restaurants%rowtype;
  v_run public.audit_runs%rowtype;
  v_report public.audit_reports%rowtype;
  v_conversion_id uuid;
  v_pending_restaurant_id uuid;
  v_consent_snapshot jsonb;
  v_prefill_snapshot jsonb;
  v_consent_hash text;
  v_prefill_hash text;
  v_idempotency_hash text;
  v_existing record;
begin
  if not public.veroxa_current_user_is_active_team() then
    raise exception using errcode = '42501', message = 'team_access_required';
  end if;
  if p_consent_version is distinct from 'audit-onboarding-consent-v1'
     or p_consent_text is distinct from v_expected_consent
     or p_consent_channel is null
     or not (p_consent_channel = any(array['written', 'email', 'signed_form', 'recorded_call']::text[]))
     or char_length(btrim(coalesce(p_consent_evidence_reference, ''))) not between 10 and 1000
     or p_consented_at is null
     or p_consented_at > now() + interval '5 minutes'
     or p_consented_at < now() - interval '1 year'
     or char_length(btrim(coalesce(p_idempotency_key, ''))) not between 16 and 200 then
    raise exception using errcode = '22023', message = 'exact_onboarding_consent_required';
  end if;

  v_idempotency_hash := encode(extensions.digest(
    'audit-onboarding-consent-v1:convert:'
      || coalesce(p_audit_request_id::text, '') || ':'
      || btrim(p_idempotency_key),
    'sha256'
  ), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_idempotency_hash, 0));
  select conversion.id, conversion.restaurant_id, conversion.conversion_state
  into v_existing
  from veroxa_private.audit_onboarding_conversions conversion
  where conversion.idempotency_hash = v_idempotency_hash
    and conversion.audit_request_id = p_audit_request_id;
  if found then
    return query select v_existing.id, v_existing.restaurant_id, v_existing.conversion_state;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_audit_request_id::text, 0));
  select * into v_request from public.audit_requests
  where id = p_audit_request_id for update;
  if v_request.id is null then
    raise exception using errcode = '22023', message = 'audit_request_not_found';
  end if;
  select * into v_restaurant from public.audit_restaurants
  where id = v_request.audit_restaurant_id;
  select * into v_run from public.audit_runs
  where audit_request_id = v_request.id
  order by run_number desc limit 1;
  select * into v_report from public.audit_reports
  where audit_run_id = v_run.id;

  if v_run.status is distinct from 'reviewed'::public.audit_run_status
     or v_report.status is distinct from 'reviewed'::public.audit_report_status
     or v_request.status is distinct from 'reviewed'::public.audit_request_status then
    raise exception using errcode = '55000', message = 'reviewed_audit_required_for_onboarding_prefill';
  end if;

  select conversion.id, conversion.restaurant_id, conversion.conversion_state
  into v_existing
  from veroxa_private.audit_onboarding_conversions conversion
  where conversion.audit_request_id = v_request.id;
  if found then
    return query select v_existing.id, v_existing.restaurant_id, v_existing.conversion_state;
    return;
  end if;

  v_consent_snapshot := jsonb_build_object(
    'version', p_consent_version,
    'text', p_consent_text,
    'channel', p_consent_channel,
    'evidence_reference', btrim(p_consent_evidence_reference),
    'consented_at', p_consented_at
  );
  v_consent_hash := encode(extensions.digest(v_consent_snapshot::text, 'sha256'), 'hex');

  v_prefill_snapshot := jsonb_build_object(
    'source', 'reviewed_restaurant_audit',
    'audit_request_id', v_request.id,
    'audit_run_id', v_run.id,
    'audit_report_id', v_report.id,
    'audit_reference', v_request.reference_code,
    'restaurant_name', v_restaurant.restaurant_name,
    'city', v_restaurant.city,
    'state', v_restaurant.state,
    'website_url', v_restaurant.website_url,
    'google_profile_url', v_restaurant.google_profile_url,
    'contact_candidate', jsonb_build_object(
      'name', v_request.contact_name,
      'email', v_request.contact_email,
      'phone', v_request.contact_phone,
      'verification_status', 'unverified'
    ),
    'score', v_run.score_snapshot,
    'improvements', v_report.improvement_snapshot,
    'plan', v_report.plan_snapshot,
    'executive_summary', v_report.executive_summary,
    'priority_actions', v_report.priority_actions
  );
  v_prefill_hash := encode(extensions.digest(v_prefill_snapshot::text, 'sha256'), 'hex');

  insert into public.veroxa_restaurants (name, city, state, status)
  values (
    v_restaurant.restaurant_name,
    v_restaurant.city,
    v_restaurant.state,
    'pending'::public.veroxa_account_status_v1
  ) returning id into v_pending_restaurant_id;

  insert into veroxa_private.audit_onboarding_conversions (
    audit_request_id, audit_run_id, audit_report_id, restaurant_id,
    conversion_state, consent_version, consent_text, consent_sha256,
    consent_channel, consent_evidence_reference, consented_at,
    consent_snapshot, prefill_snapshot, prefill_sha256,
    idempotency_hash, recorded_by
  ) values (
    v_request.id,
    v_run.id,
    v_report.id,
    v_pending_restaurant_id,
    'pending_profile',
    p_consent_version,
    p_consent_text,
    v_consent_hash,
    p_consent_channel,
    btrim(p_consent_evidence_reference),
    p_consented_at,
    v_consent_snapshot,
    v_prefill_snapshot,
    v_prefill_hash,
    v_idempotency_hash,
    auth.uid()
  ) returning id into v_conversion_id;

  insert into public.audit_events (
    audit_request_id, event_type, event_data, actor_user_id
  ) values (
    v_request.id,
    'audit_onboarding_profile_created',
    jsonb_build_object(
      'conversion_id', v_conversion_id,
      'pending_restaurant_id', v_pending_restaurant_id,
      'state', 'pending_profile'
    ),
    auth.uid()
  );

  return query select v_conversion_id, v_pending_restaurant_id, 'pending_profile'::text;
end;
$$;

revoke all on function public.save_team_generated_audit_v2(text,text,text,text,text,jsonb,jsonb,text,text,text,text)
  from public, anon;
grant execute on function public.save_team_generated_audit_v2(text,text,text,text,text,jsonb,jsonb,text,text,text,text)
  to authenticated;

revoke all on function public.complete_team_generated_audit_run_v2(uuid,jsonb,jsonb,text,text,text)
  from public, anon;
grant execute on function public.complete_team_generated_audit_run_v2(uuid,jsonb,jsonb,text,text,text)
  to authenticated;

revoke all on function public.save_team_generated_audit_rerun_v2(uuid,uuid,jsonb,jsonb,text,text,text,text)
  from public, anon;
grant execute on function public.save_team_generated_audit_rerun_v2(uuid,uuid,jsonb,jsonb,text,text,text,text)
  to authenticated;

revoke all on function public.veroxa_convert_reviewed_audit_to_pending_profile_v1(uuid,text,text,text,text,timestamptz,text)
  from public, anon;
grant execute on function public.veroxa_convert_reviewed_audit_to_pending_profile_v1(uuid,text,text,text,text,timestamptz,text)
  to authenticated;

comment on function public.save_team_generated_audit_v2(text,text,text,text,text,jsonb,jsonb,text,text,text,text) is
  'Atomically saves a Team-generated, deterministic audit preview without creating an operational client.';
comment on function public.complete_team_generated_audit_run_v2(uuid,jsonb,jsonb,text,text,text) is
  'Atomically completes an existing empty Audit Center run only when Team explicitly saves a generated preview.';
comment on function public.save_team_generated_audit_rerun_v2(uuid,uuid,jsonb,jsonb,text,text,text,text) is
  'Atomically saves an idempotent generated re-audit after the latest reviewed run without creating a client workspace.';
comment on function public.veroxa_convert_reviewed_audit_to_pending_profile_v1(uuid,text,text,text,text,timestamptz,text) is
  'Creates one pending, non-operational restaurant profile from the latest reviewed audit after exact onboarding consent.';
comment on table veroxa_private.audit_onboarding_conversions is
  'Private provenance bridge from a reviewed audit and exact onboarding consent to a pending restaurant profile.';
