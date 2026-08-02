-- Shared trigger functions run against tables with distinct enum types. Use
-- text comparisons after branching so PostgreSQL never compares unlike enums.

create or replace function private.enforce_reviewed_audit_immutability()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_table_name = 'audit_runs' then
    if old.status::text = 'reviewed' then
      raise exception using errcode = '55000', message = 'reviewed_audit_run_is_immutable';
    end if;
  elsif tg_table_name = 'audit_reports' then
    if old.status::text = 'reviewed' then
      raise exception using errcode = '55000', message = 'reviewed_audit_report_is_immutable';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function private.enforce_reviewed_audit_immutability() from public, anon, authenticated;

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
