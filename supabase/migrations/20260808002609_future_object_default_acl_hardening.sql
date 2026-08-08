-- Fail closed for future objects created by the migration owner. PostgreSQL's
-- role-wide built-in defaults require explicit grants for any future function
-- or type that should be callable outside its owner, in any schema. Existing
-- object ACLs are intentionally unchanged by this staged migration.

-- PostgreSQL's built-in defaults grant PUBLIC EXECUTE on functions and PUBLIC
-- USAGE on types globally. Per-schema default ACL entries are additive, so the
-- built-in grants must be revoked at the role-wide level first.
alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres
  revoke usage on types from public;

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on types from public, anon, authenticated, service_role;

-- Supabase also creates public objects as supabase_admin. PostgreSQL permits a
-- role to alter another role's defaults only when it is that role or a member.
-- Apply the same fail-closed defaults when this migration identity has that
-- authority; otherwise retain an explicit NOTICE instead of claiming coverage.
do $$
declare
  v_can_harden_supabase_admin boolean;
begin
  select pg_catalog.pg_has_role(current_user, role.rolname, 'MEMBER')
  into v_can_harden_supabase_admin
  from pg_catalog.pg_roles role
  where role.rolname = 'supabase_admin';

  if coalesce(v_can_harden_supabase_admin, false) then
    execute 'alter default privileges for role supabase_admin revoke execute on functions from public';
    execute 'alter default privileges for role supabase_admin revoke usage on types from public';
    execute 'alter default privileges for role supabase_admin in schema public revoke all on tables from public, anon, authenticated, service_role';
    execute 'alter default privileges for role supabase_admin in schema public revoke all on sequences from public, anon, authenticated, service_role';
    execute 'alter default privileges for role supabase_admin in schema public revoke all on functions from public, anon, authenticated, service_role';
    execute 'alter default privileges for role supabase_admin in schema public revoke all on types from public, anon, authenticated, service_role';
  else
    raise notice 'supabase_admin future-object default ACLs were not changed: migration role % is not a member', current_user;
  end if;
end;
$$;
