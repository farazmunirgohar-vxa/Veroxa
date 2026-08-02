-- Final pre-release hardening found by RR. Non-destructive: legacy rows are
-- retained, while the explicitly unsafe development policies are removed.

do $$
declare item text[];
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
end $$;

alter table public.audit_requests
  drop constraint if exists audit_requests_contact_phone_shape;
alter table public.audit_requests
  add constraint audit_requests_contact_phone_shape check (
    contact_phone is null or char_length(regexp_replace(contact_phone, '[^0-9]', '', 'g')) between 7 and 15
  ) not valid;
alter table public.audit_requests validate constraint audit_requests_contact_phone_shape;

create or replace function private.protect_public_audit_restaurant_identity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if coalesce(auth.role(), '') = 'anon' then
    new.website_url := case when tg_op = 'UPDATE' then old.website_url else null end;
    new.google_profile_url := case when tg_op = 'UPDATE' then old.google_profile_url else null end;
    new.phone := case when tg_op = 'UPDATE' then old.phone else null end;
  end if;
  return new;
end;
$$;
revoke all on function private.protect_public_audit_restaurant_identity() from public, anon, authenticated;
drop trigger if exists audit_restaurants_public_identity_guard on public.audit_restaurants;
create trigger audit_restaurants_public_identity_guard
before insert or update on public.audit_restaurants
for each row execute function private.protect_public_audit_restaurant_identity();

create or replace function private.enforce_audit_review_gates()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_request_id uuid;
  target_run_status public.audit_run_status;
begin
  if tg_table_name = 'audit_runs'
     and new.status::text = 'reviewed'
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
    target_request_id := new.id;
    if not exists (
      select 1 from public.audit_reports report
      join public.audit_runs run on run.id = report.audit_run_id
      where run.audit_request_id = target_request_id
        and report.status = 'reviewed'::public.audit_report_status
    ) then
      raise exception using errcode = '23514', message = 'reviewed_request_requires_reviewed_report';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_audit_review_gates() from public, anon, authenticated;

drop trigger if exists audit_runs_review_gate on public.audit_runs;
create trigger audit_runs_review_gate before update on public.audit_runs
for each row execute function private.enforce_audit_review_gates();
drop trigger if exists audit_reports_review_gate on public.audit_reports;
create trigger audit_reports_review_gate before insert or update on public.audit_reports
for each row execute function private.enforce_audit_review_gates();
drop trigger if exists audit_requests_review_gate on public.audit_requests;
create trigger audit_requests_review_gate before update on public.audit_requests
for each row execute function private.enforce_audit_review_gates();

comment on function private.protect_public_audit_restaurant_identity is
  'Prevents anonymous intake from setting or replacing Team-reviewed restaurant website, Google, or phone facts.';
comment on function private.enforce_audit_review_gates is
  'Requires evidence-backed findings, reviewed runs, complete report text, and reviewed reports before reviewed lifecycle states.';
