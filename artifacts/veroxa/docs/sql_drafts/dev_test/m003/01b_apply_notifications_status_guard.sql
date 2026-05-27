-- =============================================================================
-- M003 CORRECTION APPLY — Notifications Column-Write Guard
-- DEV SUPABASE ONLY — NOT PRODUCTION
--
-- Source: docs/sql_drafts/migrations_review/003_notifications_status_guard_draft.sql
-- Target: dev Supabase project where M001 + M002 + M003 are applied.
--
-- WHY: M003's notifications_update_status_own_client RLS lets a client
-- UPDATE any column on their own notification row. This trigger
-- restricts client-role UPDATEs to status -> seen/dismissed only.
-- Staff (owner/operator/team) bypass the guard. Service role bypasses
-- RLS and therefore never triggers this function.
--
-- Apply AFTER 01_apply_m003.sql. Must be in place before any real client
-- credentials are issued.
-- =============================================================================

begin;

create or replace function private.notifications_client_update_guard()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_role text := private.current_user_role();
begin
  if v_role in ('owner','operator','team') then
    return new;
  end if;

  if new.title             is distinct from old.title
     or new.message_body      is distinct from old.message_body
     or new.notification_type is distinct from old.notification_type
     or new.priority          is distinct from old.priority
     or new.trigger_source    is distinct from old.trigger_source
     or new.target_role       is distinct from old.target_role
     or new.target_user_id    is distinct from old.target_user_id
     or new.client_id         is distinct from old.client_id
     or new.created_at        is distinct from old.created_at
  then
    raise exception
      'notifications_client_update_guard: client-role users may only update status to seen/dismissed (attempted change to a protected column)'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if new.status not in ('seen','dismissed') then
      raise exception
        'notifications_client_update_guard: client-role users may only set status to seen or dismissed (got %)', new.status
        using errcode = '42501';
    end if;
    if old.status = 'dismissed' and new.status = 'seen' then
      raise exception
        'notifications_client_update_guard: cannot move status from dismissed back to seen'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.notifications_client_update_guard() is
  'BEFORE UPDATE guard on public.notifications. Client-role users may only update status to seen/dismissed; all other column writes raise insufficient_privilege. Staff bypass.';

revoke execute on function private.notifications_client_update_guard() from public;

create trigger notifications_client_update_guard
  before update on public.notifications
  for each row execute function private.notifications_client_update_guard();

comment on trigger notifications_client_update_guard
  on public.notifications is
  'Defense-in-depth: blocks client-role users from editing any column other than status (and only to seen/dismissed).';

commit;
