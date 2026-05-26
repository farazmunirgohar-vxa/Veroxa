-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- Review and audit before converting into a real migration.
-- AUTH_MODE remains "placeholder".
-- =============================================================================
--
-- M003 Correction Draft — Notifications Column-Write Guard (DRAFT)
--
-- Purpose:
--   Close audit issue: the M003 RLS policy
--   `notifications_update_status_own_client` permits a client-role user
--   to UPDATE any column on their own notification row. Column-level
--   restriction (only `status`, only to 'seen' or 'dismissed') was
--   documented in the policy comment as relying on "the portal
--   mutation layer and/or a future BEFORE UPDATE trigger." This file
--   is that trigger.
--
-- Applies AFTER:
--   * 001_identity_foundation_draft.sql
--   * 002_client_foundation_draft.sql
--   * 003_media_foundation_draft.sql
--
-- This is a defense-in-depth correction: even if the portal mutation
-- layer is bypassed (e.g. a client uses the raw Supabase JS client
-- directly), the trigger raises before any sensitive column is
-- modified.
--
-- Owner / operator / service-role traffic is NOT affected. Staff have
-- legitimate reasons to edit title, message_body, priority, etc.
--
-- Allowed client-role transitions:
--   status: 'created' | 'sent'  ->  'seen' | 'dismissed'
--   status: 'seen'              ->  'dismissed'
--
-- All other client-role UPDATEs raise exception.
--
-- Forbidden columns for client-role UPDATE (always raise):
--   title, message_body, notification_type, priority, trigger_source,
--   target_role, target_user_id, client_id, created_at
--
-- This draft does NOT change pricing, AUTH_MODE, navigation, portal
-- UI, or any other migration's scope.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Trigger function
-- -----------------------------------------------------------------------------
--
-- Pattern matches the rest of the codebase: explicit schema, security
-- definer, set search_path, no dynamic SQL. Uses the M001 helper
-- private.current_user_role() to short-circuit for staff.

create or replace function private.notifications_client_update_guard()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_role text := private.current_user_role();
begin
  -- Staff and the service role get a free pass. Service-role traffic
  -- bypasses RLS entirely, so this branch only fires for owner /
  -- operator / team users editing notifications through the UI.
  if v_role in ('owner','operator','team') then
    return new;
  end if;

  -- From here on, v_role is 'client' (or NULL / unknown, treated as
  -- client). Any change to a sensitive column is rejected outright.
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
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- Status must move to one of two allowed terminal values.
  if new.status is distinct from old.status then
    if new.status not in ('seen','dismissed') then
      raise exception
        'notifications_client_update_guard: client-role users may only set status to seen or dismissed (got %)', new.status
        using errcode = '42501';
    end if;
    -- No backwards transitions: do not re-open a dismissed notification.
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
  'BEFORE UPDATE guard on public.notifications. Client-role users may only update status to seen/dismissed; all other column writes raise insufficient_privilege. Staff (owner/operator/team) bypass the guard. Service role bypasses RLS and therefore never triggers this function.';

revoke execute on function private.notifications_client_update_guard() from public;
-- Trigger functions do not need an explicit grant; PostgreSQL invokes
-- them as the trigger owner regardless of caller privileges. No grant
-- to authenticated / service_role is required for the trigger to fire.


-- -----------------------------------------------------------------------------
-- Trigger
-- -----------------------------------------------------------------------------

create trigger notifications_client_update_guard
  before update on public.notifications
  for each row execute function private.notifications_client_update_guard();

comment on trigger notifications_client_update_guard
  on public.notifications is
  'Defense-in-depth: even with notifications_update_status_own_client RLS in place, this trigger blocks client-role users from editing any column other than status (and only to seen/dismissed).';


commit;

-- =============================================================================
-- ROLLBACK (dev reference only — forward-only in production)
-- =============================================================================
--
-- begin;
--   drop trigger if exists notifications_client_update_guard
--     on public.notifications;
--   drop function if exists private.notifications_client_update_guard();
-- commit;

-- =============================================================================
-- NOTES
--
-- 1. This guard MUST be in place BEFORE any real client credentials are
--    issued, otherwise the M003 client UPDATE policy is too permissive.
--
-- 2. The corresponding test cases are appended to
--    docs/MIGRATION_003_TEST_PLAN.md under section
--    "Notifications client-update column guard".
--
-- 3. If a future migration adds a new column to public.notifications,
--    decide whether it should be client-writable. If not, add it to the
--    `is distinct from` block above.
--
-- DO NOT RUN — REVIEW BEFORE PROMOTION
-- AUTH_MODE remains "placeholder".
-- =============================================================================
