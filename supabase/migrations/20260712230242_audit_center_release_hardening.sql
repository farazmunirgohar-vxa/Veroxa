-- Audit Center release hardening found during the final delta RR.
-- Each request now owns a distinct non-client restaurant identity record so
-- same-name locations cannot be conflated. Lifecycle events are append-only,
-- failed runs require a reason, and only the latest reviewed run/report can
-- close a request.

create or replace function private.remove_unsafe_legacy_dev_policies()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  item text[];
begin
  foreach item slice 1 in array array[
    array['clients','clients_dev_authenticated_select'],
    array['restaurant_upload_keys','restaurant_upload_keys_dev_authenticated_select'],
    array['upload_submissions','upload_submissions_dev_authenticated_select'],
    array['upload_submissions','upload_submissions_dev_authenticated_insert'],
    array['upload_submissions','upload_submissions_dev_authenticated_update'],
    array['direction_requests','direction_requests_dev_authenticated_select'],
    array['direction_requests','direction_requests_dev_authenticated_insert'],
    array['direction_requests','direction_requests_dev_authenticated_update'],
    array['team_review_decisions','team_review_decisions_dev_authenticated_select'],
    array['team_review_decisions','team_review_decisions_dev_authenticated_insert']
  ] loop
    if to_regclass('public.' || item[1]) is not null then
      execute format('drop policy if exists %I on public.%I', item[2], item[1]);
    end if;
  end loop;
end;
$$;
revoke all on function private.remove_unsafe_legacy_dev_policies() from public, anon, authenticated;
select private.remove_unsafe_legacy_dev_policies();

alter table public.audit_restaurants
  drop constraint if exists audit_restaurants_identity_unique;
create index if not exists audit_restaurants_normalized_location_idx
  on public.audit_restaurants (normalized_name, normalized_city, normalized_state);

create or replace function private.enforce_audit_review_gates()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_run_status public.audit_run_status;
  latest_run_id uuid;
begin
  if tg_table_name = 'audit_runs' then
    if new.status::text = 'failed'
       and char_length(btrim(coalesce(new.failure_reason, ''))) < 5 then
      raise exception using errcode = '23514', message = 'failed_run_requires_reason';
    end if;
    if new.status::text <> 'failed' then
      new.failure_reason := null;
    end if;
    if new.status::text = 'queued' then
      new.started_at := null;
      new.completed_at := null;
      new.reviewed_by := null;
      new.reviewed_at := null;
    elsif new.status::text = 'in_progress' then
      new.started_at := coalesce(new.started_at, now());
      new.completed_at := null;
      new.reviewed_by := null;
      new.reviewed_at := null;
    elsif new.status::text in ('ready_for_review', 'failed') then
      new.started_at := coalesce(new.started_at, now());
      new.completed_at := coalesce(new.completed_at, now());
      new.reviewed_by := null;
      new.reviewed_at := null;
    end if;
    if new.status::text = 'reviewed'
       and old.status::text is distinct from new.status::text then
      if not exists (
        select 1 from public.audit_findings finding
        where finding.audit_run_id = new.id and finding.evidence_url is not null
      ) then
        raise exception using errcode = '23514', message = 'reviewed_run_requires_evidence_backed_finding';
      end if;
      if new.run_number > 1 and char_length(btrim(coalesce(new.comparison_summary, ''))) < 10 then
        raise exception using errcode = '23514', message = 'reviewed_rerun_requires_comparison';
      end if;
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
      new.completed_at := coalesce(new.completed_at, now());
    end if;
  elsif tg_table_name = 'audit_reports'
        and new.status::text = 'reviewed'
        and (tg_op = 'INSERT' or old.status::text is distinct from new.status::text) then
    select run.status into target_run_status
    from public.audit_runs run where run.id = new.audit_run_id;
    if target_run_status is distinct from 'reviewed'::public.audit_run_status then
      raise exception using errcode = '23514', message = 'reviewed_report_requires_reviewed_run';
    end if;
    if char_length(btrim(new.executive_summary)) < 20
       or char_length(btrim(new.priority_actions)) < 20 then
      raise exception using errcode = '23514', message = 'reviewed_report_requires_complete_summary';
    end if;
    if not exists (
      select 1 from public.audit_findings finding
      where finding.audit_run_id = new.audit_run_id and finding.evidence_url is not null
    ) then
      raise exception using errcode = '23514', message = 'reviewed_report_requires_evidence';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  elsif tg_table_name = 'audit_requests'
        and new.status::text = 'reviewed'
        and old.status::text is distinct from new.status::text then
    select run.id into latest_run_id
    from public.audit_runs run
    where run.audit_request_id = new.id
    order by run.run_number desc
    limit 1;
    if latest_run_id is null or not exists (
      select 1
      from public.audit_runs run
      join public.audit_reports report on report.audit_run_id = run.id
      where run.id = latest_run_id
        and run.status = 'reviewed'::public.audit_run_status
        and report.status = 'reviewed'::public.audit_report_status
    ) then
      raise exception using errcode = '23514', message = 'reviewed_request_requires_latest_reviewed_report';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_audit_review_gates() from public, anon, authenticated;

create or replace function private.capture_audit_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  request_id uuid;
  event_name text;
  details jsonb;
begin
  if tg_table_name = 'audit_requests' then
    request_id := new.id;
    if tg_op = 'INSERT' then
      event_name := 'audit_request_created';
      details := jsonb_build_object('source', new.source, 'status', new.status);
    elsif old.status is distinct from new.status then
      event_name := 'audit_request_status_changed';
      details := jsonb_build_object('from', old.status, 'to', new.status);
    else
      return new;
    end if;
  elsif tg_table_name = 'audit_runs' then
    request_id := new.audit_request_id;
    if tg_op = 'INSERT' then
      event_name := 'audit_run_created';
      details := jsonb_build_object('run_id', new.id, 'run_number', new.run_number, 'status', new.status);
    elsif old.status is distinct from new.status then
      event_name := 'audit_run_status_changed';
      details := jsonb_build_object('run_id', new.id, 'from', old.status, 'to', new.status);
    else
      return new;
    end if;
  elsif tg_table_name = 'audit_findings' then
    select run.audit_request_id into request_id from public.audit_runs run where run.id = new.audit_run_id;
    event_name := 'audit_finding_created';
    details := jsonb_build_object('run_id', new.audit_run_id, 'finding_id', new.id, 'severity', new.severity);
  elsif tg_table_name = 'audit_notes' then
    request_id := new.audit_request_id;
    event_name := 'audit_note_created';
    details := jsonb_build_object('note_id', new.id);
  elsif tg_table_name = 'audit_reports' then
    select run.audit_request_id into request_id from public.audit_runs run where run.id = new.audit_run_id;
    if tg_op = 'INSERT' then
      event_name := 'audit_report_created';
      details := jsonb_build_object('run_id', new.audit_run_id, 'report_id', new.id, 'status', new.status);
    elsif old.status is distinct from new.status then
      event_name := 'audit_report_status_changed';
      details := jsonb_build_object('run_id', new.audit_run_id, 'report_id', new.id, 'from', old.status, 'to', new.status);
    else
      return new;
    end if;
  end if;
  if request_id is not null then
    insert into public.audit_events (audit_request_id, event_type, event_data, actor_user_id)
    values (request_id, event_name, details, auth.uid());
  end if;
  return new;
end;
$$;
revoke all on function private.capture_audit_event() from public, anon, authenticated;

drop trigger if exists audit_requests_capture_event on public.audit_requests;
create trigger audit_requests_capture_event after insert or update on public.audit_requests
for each row execute function private.capture_audit_event();
drop trigger if exists audit_runs_capture_event on public.audit_runs;
create trigger audit_runs_capture_event after insert or update on public.audit_runs
for each row execute function private.capture_audit_event();
drop trigger if exists audit_findings_capture_event on public.audit_findings;
create trigger audit_findings_capture_event after insert on public.audit_findings
for each row execute function private.capture_audit_event();
drop trigger if exists audit_notes_capture_event on public.audit_notes;
create trigger audit_notes_capture_event after insert on public.audit_notes
for each row execute function private.capture_audit_event();
drop trigger if exists audit_reports_capture_event on public.audit_reports;
create trigger audit_reports_capture_event after insert or update on public.audit_reports
for each row execute function private.capture_audit_event();

revoke insert, update, delete on table public.audit_events from authenticated;

create or replace function public.submit_audit_request_v1(
  p_restaurant_name text,
  p_city text,
  p_state text,
  p_website_url text default null,
  p_google_profile_url text default null,
  p_contact_name text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_contact_note text default null,
  p_consent_to_contact boolean default false,
  p_consent_version text default null,
  p_form_started_at timestamptz default null,
  p_honeypot text default null,
  p_fingerprint text default null,
  p_intake_token text default null,
  p_idempotency_key text default null
)
returns table(request_id uuid, reference_code text, request_status text)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_name text := btrim(coalesce(p_restaurant_name, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_state text := btrim(coalesce(p_state, ''));
  v_email text := nullif(lower(btrim(coalesce(p_contact_email, ''))), '');
  v_phone text := nullif(btrim(coalesce(p_contact_phone, '')), '');
  v_website text := nullif(btrim(coalesce(p_website_url, '')), '');
  v_google text := nullif(btrim(coalesce(p_google_profile_url, '')), '');
  v_fingerprint_hash text;
  v_idempotency_hash text;
  v_intake_secret text;
  v_existing_request public.audit_requests%rowtype;
  v_restaurant_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_reference text;
  v_recent_count integer;
begin
  select hmac_secret into v_intake_secret from private.audit_intake_config where singleton = true;
  if v_intake_secret is null
     or nullif(btrim(coalesce(p_fingerprint, '')), '') is null
     or nullif(btrim(coalesce(p_intake_token, '')), '') is null
     or encode(hmac(btrim(p_fingerprint), v_intake_secret, 'sha256'), 'hex') <> btrim(p_intake_token) then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if nullif(btrim(coalesce(p_honeypot, '')), '') is not null then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if p_form_started_at is null or p_form_started_at > now()
     or p_form_started_at < now() - interval '2 hours'
     or now() - p_form_started_at < interval '3 seconds' then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if char_length(v_name) not between 2 and 160
     or char_length(v_city) not between 2 and 100
     or char_length(v_state) not between 2 and 40 then
    raise exception using errcode = '22023', message = 'invalid_restaurant_identity';
  end if;
  if v_email is null and v_phone is null then
    raise exception using errcode = '22023', message = 'contact_required';
  end if;
  if not coalesce(p_consent_to_contact, false) or btrim(coalesce(p_consent_version, '')) <> '2026-07-12' then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if char_length(btrim(coalesce(p_idempotency_key, ''))) not between 16 and 128 then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if v_email is not null and v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception using errcode = '22023', message = 'invalid_contact';
  end if;
  if (v_website is not null and v_website !~* '^https?://')
     or (v_google is not null and v_google !~* '^https?://') then
    raise exception using errcode = '22023', message = 'invalid_url';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(coalesce(v_email, v_phone), 0));
  v_idempotency_hash := encode(digest(btrim(p_idempotency_key), 'sha256'), 'hex');
  select * into v_existing_request from public.audit_requests
  where idempotency_hash = v_idempotency_hash and created_at >= now() - interval '7 days'
  limit 1;
  if v_existing_request.id is not null then
    return query select v_existing_request.id, v_existing_request.reference_code, v_existing_request.status::text;
    return;
  end if;
  if v_email is not null then
    select count(*) into v_recent_count from public.audit_requests
    where lower(contact_email) = v_email and created_at >= now() - interval '15 minutes';
    if v_recent_count >= 3 then raise exception using errcode = 'P0001', message = 'rate_limited'; end if;
  end if;
  v_fingerprint_hash := encode(digest(btrim(p_fingerprint), 'sha256'), 'hex');
  select count(*) into v_recent_count from public.audit_requests
  where intake_fingerprint_hash = v_fingerprint_hash and created_at >= now() - interval '24 hours';
  if v_recent_count >= 6 then raise exception using errcode = 'P0001', message = 'rate_limited'; end if;

  insert into public.audit_restaurants (
    restaurant_name, normalized_name, city, normalized_city, state,
    normalized_state, website_url, google_profile_url, phone, source
  ) values (
    v_name, lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_city, lower(regexp_replace(v_city, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_state, lower(v_state), null, null, null, 'public_intake'
  ) returning id into v_restaurant_id;

  v_reference := 'VA-' || upper(substr(replace(v_request_id::text, '-', ''), 1, 10));
  insert into public.audit_requests (
    id, reference_code, audit_restaurant_id, source, status, contact_name,
    contact_email, contact_phone, contact_note, consent_to_contact,
    consent_version, consent_at, idempotency_hash, intake_fingerprint_hash
  ) values (
    v_request_id, v_reference, v_restaurant_id, 'public_intake', 'new',
    nullif(btrim(coalesce(p_contact_name, '')), ''), v_email, v_phone,
    nullif(btrim(coalesce(p_contact_note, '')), ''), true,
    btrim(p_consent_version), now(), v_idempotency_hash, v_fingerprint_hash
  );
  insert into public.audit_runs (audit_request_id, run_number, status, source_snapshot)
  values (v_request_id, 1, 'queued', jsonb_build_object(
    'website_url', v_website, 'google_profile_url', v_google,
    'submitted_at', now(), 'source', 'public_intake'
  ));
  return query select v_request_id, v_reference, 'new'::text;
end;
$$;

create or replace function public.create_team_audit_v1(
  p_restaurant_name text,
  p_city text,
  p_state text,
  p_website_url text default null,
  p_google_profile_url text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_team_note text default null
)
returns table(request_id uuid, reference_code text, request_status text)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_name text := btrim(coalesce(p_restaurant_name, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_state text := btrim(coalesce(p_state, ''));
  v_restaurant_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_reference text;
begin
  if not public.veroxa_current_user_is_active_team() then
    raise exception using errcode = '42501', message = 'team_access_required';
  end if;
  if char_length(v_name) not between 2 and 160
     or char_length(v_city) not between 2 and 100
     or char_length(v_state) not between 2 and 40 then
    raise exception using errcode = '22023', message = 'invalid_restaurant_identity';
  end if;
  insert into public.audit_restaurants (
    restaurant_name, normalized_name, city, normalized_city, state,
    normalized_state, website_url, google_profile_url, phone, source
  ) values (
    v_name, lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_city, lower(regexp_replace(v_city, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_state, lower(v_state), nullif(btrim(coalesce(p_website_url, '')), ''),
    nullif(btrim(coalesce(p_google_profile_url, '')), ''),
    nullif(btrim(coalesce(p_contact_phone, '')), ''), 'team_manual'
  ) returning id into v_restaurant_id;
  v_reference := 'VA-' || upper(substr(replace(v_request_id::text, '-', ''), 1, 10));
  insert into public.audit_requests (
    id, reference_code, audit_restaurant_id, source, status, contact_email, contact_phone
  ) values (
    v_request_id, v_reference, v_restaurant_id, 'team_manual', 'new',
    nullif(lower(btrim(coalesce(p_contact_email, ''))), ''),
    nullif(btrim(coalesce(p_contact_phone, '')), '')
  );
  insert into public.audit_runs (audit_request_id, run_number, status, source_snapshot)
  values (v_request_id, 1, 'queued', jsonb_build_object(
    'website_url', nullif(btrim(coalesce(p_website_url, '')), ''),
    'google_profile_url', nullif(btrim(coalesce(p_google_profile_url, '')), ''),
    'source', 'team_manual',
    'created_at', now()
  ));
  if nullif(btrim(coalesce(p_team_note, '')), '') is not null then
    insert into public.audit_notes (audit_request_id, body, created_by)
    values (v_request_id, btrim(p_team_note), auth.uid());
  end if;
  return query select v_request_id, v_reference, 'new'::text;
end;
$$;

create or replace function public.start_audit_rerun_v1(p_audit_request_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_previous public.audit_runs%rowtype;
  v_new_id uuid;
begin
  if not public.veroxa_current_user_is_active_team() then
    raise exception using errcode = '42501', message = 'team_access_required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_audit_request_id::text, 0));
  select * into v_previous from public.audit_runs
  where audit_request_id = p_audit_request_id
  order by run_number desc limit 1 for update;
  if v_previous.id is null then
    raise exception using errcode = '22023', message = 'audit_request_not_found';
  end if;
  insert into public.audit_runs (audit_request_id, previous_run_id, run_number, status, source_snapshot)
  values (
    p_audit_request_id, v_previous.id, v_previous.run_number + 1, 'queued',
    v_previous.source_snapshot || jsonb_build_object(
      'source', 'team_rerun',
      'requested_at', now(),
      'previous_run_id', v_previous.id
    )
  ) returning id into v_new_id;
  update public.audit_requests set status = 'in_review' where id = p_audit_request_id;
  return v_new_id;
end;
$$;

revoke all on function public.submit_audit_request_v1(text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,text,text,text,text) from public, authenticated;
grant execute on function public.submit_audit_request_v1(text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,text,text,text,text) to anon;
revoke all on function public.create_team_audit_v1(text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_team_audit_v1(text,text,text,text,text,text,text,text) to authenticated;
revoke all on function public.start_audit_rerun_v1(uuid) from public, anon;
grant execute on function public.start_audit_rerun_v1(uuid) to authenticated;

comment on function private.capture_audit_event() is
  'Append-only Audit Center lifecycle evidence. Direct authenticated event insertion is prohibited.';
