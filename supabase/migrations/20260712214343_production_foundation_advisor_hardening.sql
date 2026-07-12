-- Advisor-driven hardening for the Momo production foundation and Audit Center.
-- This migration is intentionally non-destructive and leaves the legacy demo schema untouched.

alter function public.create_team_audit_v1(text,text,text,text,text,text,text,text)
  security invoker;
alter function public.start_audit_rerun_v1(uuid)
  security invoker;

revoke all on function public.create_team_audit_v1(text,text,text,text,text,text,text,text)
  from public, anon;
grant execute on function public.create_team_audit_v1(text,text,text,text,text,text,text,text)
  to authenticated;

revoke all on function public.start_audit_rerun_v1(uuid)
  from public, anon;
grant execute on function public.start_audit_rerun_v1(uuid)
  to authenticated;

revoke all on function public.submit_audit_request_v1(text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,text,text,text,text)
  from authenticated;
grant execute on function public.submit_audit_request_v1(text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,text,text,text,text)
  to anon;

create index if not exists audit_runs_previous_run_idx
  on public.audit_runs (previous_run_id);
create index if not exists veroxa_media_assets_restaurant_idx
  on public.veroxa_media_assets (restaurant_id);
create index if not exists veroxa_media_assets_uploaded_by_idx
  on public.veroxa_media_assets (uploaded_by);
create index if not exists veroxa_restaurant_members_user_idx
  on public.veroxa_restaurant_members (user_id);
create index if not exists auth_identity_allowlist_restaurant_idx
  on veroxa_private.auth_identity_allowlist (restaurant_id);

comment on function public.create_team_audit_v1 is
  'Team-only, security-invoker Audit Center manual intake. Authorization is rechecked inside the function and by table RLS.';
comment on function public.start_audit_rerun_v1 is
  'Team-only, security-invoker Audit Center rerun creation. Authorization is rechecked inside the function and by table RLS.';
