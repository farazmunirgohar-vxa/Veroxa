-- Live Automation V1 PR #105 Activity Log Foundation.
-- Does not activate AUTH_MODE="real", AI, report generation, external integrations,
-- publishing, payments, webhooks, cron jobs, or background jobs.

alter table public.activity_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'activity_log_actor_type_safe') then
    alter table public.activity_log add constraint activity_log_actor_type_safe check (actor_type in ('team', 'client', 'system'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'activity_log_event_type_safe') then
    alter table public.activity_log add constraint activity_log_event_type_safe check (event_type in (
      'media_uploaded', 'media_reviewed', 'media_saved_for_later', 'media_better_version_requested', 'media_marked_ready_to_use',
      'client_message_sent', 'team_reply_sent', 'message_resolved',
      'profile_correction_requested', 'profile_correction_approved', 'profile_correction_rejected', 'profile_field_updated',
      'connection_status_changed', 'team_note_added', 'setup_step_completed', 'blocker_identified'
    ));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'activity_log_title_nonempty') then
    alter table public.activity_log add constraint activity_log_title_nonempty check (length(btrim(title)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'activity_log_visibility_safe') then
    alter table public.activity_log add constraint activity_log_visibility_safe check (visibility in ('internal_only'::public.activity_visibility, 'client_visible'::public.activity_visibility));
  end if;
end $$;

drop policy if exists activity_log_team_or_client_visible_select on public.activity_log;
drop policy if exists activity_log_active_team_select on public.activity_log;
drop policy if exists activity_log_active_client_visible_select on public.activity_log;
drop policy if exists activity_log_active_team_insert on public.activity_log;

create policy activity_log_active_team_select on public.activity_log
  for select to authenticated
  using (public.current_user_is_active_team());

create policy activity_log_active_client_visible_select on public.activity_log
  for select to authenticated
  using (
    visibility = 'client_visible'::public.activity_visibility
    and public.current_user_has_active_restaurant(restaurant_id)
  );

create policy activity_log_active_team_insert on public.activity_log
  for insert to authenticated
  with check (
    public.current_user_is_active_team()
    and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'active')
    and actor_type in ('team', 'client', 'system')
    and event_type in (
      'media_uploaded', 'media_reviewed', 'media_saved_for_later', 'media_better_version_requested', 'media_marked_ready_to_use',
      'client_message_sent', 'team_reply_sent', 'message_resolved',
      'profile_correction_requested', 'profile_correction_approved', 'profile_correction_rejected', 'profile_field_updated',
      'connection_status_changed', 'team_note_added', 'setup_step_completed', 'blocker_identified'
    )
    and length(btrim(title)) > 0
    and visibility in ('internal_only'::public.activity_visibility, 'client_visible'::public.activity_visibility)
    and report_eligible in (true, false)
  );

comment on table public.activity_log is 'Live Automation V1 Activity Log Foundation: restaurant-scoped event memory. Client visibility and report eligibility are explicit; reports are generated in a later PR.';
