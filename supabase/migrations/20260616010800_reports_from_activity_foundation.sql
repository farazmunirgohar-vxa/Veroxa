-- Live Automation V1 PR #108 Reports From Activity Foundation.
-- Adds report constraints and conservative RLS for reports based on activity_log only.

update public.reports
set
  report_type = case when report_type in ('weekly_update', 'monthly_report') then report_type else 'weekly_update' end,
  summary = case when summary is not null and length(btrim(summary)) > 0 then summary else 'Historical report draft pending Veroxa review.' end,
  period_start = coalesce(period_start, created_at::date, current_date),
  period_end = coalesce(period_end, period_start, created_at::date, current_date),
  body_json = case when body_json is not null and jsonb_typeof(body_json) = 'object' then body_json else '{}'::jsonb end
where
  report_type not in ('weekly_update', 'monthly_report')
  or summary is null
  or length(btrim(summary)) = 0
  or period_start is null
  or period_end is null
  or body_json is null
  or jsonb_typeof(body_json) <> 'object';

update public.reports
set period_end = period_start
where period_start > period_end;

alter table public.reports
  alter column summary set not null,
  alter column period_start set not null,
  alter column period_end set not null;

alter table public.reports
  drop constraint if exists reports_report_type_allowed,
  add constraint reports_report_type_allowed check (report_type in ('weekly_update', 'monthly_report')),
  drop constraint if exists reports_summary_non_empty,
  add constraint reports_summary_non_empty check (length(btrim(summary)) > 0),
  drop constraint if exists reports_body_json_object,
  add constraint reports_body_json_object check (body_json is not null and jsonb_typeof(body_json) = 'object'),
  drop constraint if exists reports_period_valid,
  add constraint reports_period_valid check (period_start <= period_end);

alter table public.reports enable row level security;

drop policy if exists reports_team_or_published_client_select on public.reports;
drop policy if exists reports_active_team_select on public.reports;
drop policy if exists reports_active_team_insert on public.reports;
drop policy if exists reports_active_team_update_safe_fields on public.reports;
drop policy if exists reports_active_client_published_select on public.reports;

create policy reports_active_team_select
  on public.reports for select to authenticated
  using (public.current_user_is_active_team());

create policy reports_active_team_insert
  on public.reports for insert to authenticated
  with check (
    public.current_user_is_active_team()
    and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'active')
    and report_type in ('weekly_update', 'monthly_report')
    and status in ('draft'::public.report_status, 'ready_for_faraz_review'::public.report_status)
    and summary is not null and length(btrim(summary)) > 0
    and body_json is not null and jsonb_typeof(body_json) = 'object'
    and period_start is not null and period_end is not null and period_start <= period_end
  );

create policy reports_active_team_update_safe_fields
  on public.reports for update to authenticated
  using (
    public.current_user_is_active_team()
    and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'active')
  )
  with check (
    public.current_user_is_active_team()
    and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'active')
    and report_type in ('weekly_update', 'monthly_report')
    and status in ('draft'::public.report_status, 'ready_for_faraz_review'::public.report_status, 'approved'::public.report_status, 'published_to_client'::public.report_status)
    and summary is not null and length(btrim(summary)) > 0
    and body_json is not null and jsonb_typeof(body_json) = 'object'
    and period_start is not null and period_end is not null and period_start <= period_end
  );

create policy reports_active_client_published_select
  on public.reports for select to authenticated
  using (
    status = 'published_to_client'::public.report_status
    and public.current_user_has_active_restaurant(restaurant_id)
  );

comment on table public.reports is 'Live Automation V1 Reports From Activity Foundation: Team-reviewed portal reports from Veroxa activity/work history only. No external analytics, fake metrics, external publishing, or guarantees.';
