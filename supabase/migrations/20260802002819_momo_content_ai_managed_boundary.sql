-- Supabase owns pg_net as supabase_admin and its managed extension ACLs cannot
-- be narrowed by an ordinary project migration. Keep the supported boundary
-- fail-closed instead: JWT roles cannot log in or create an exposed bridge,
-- Veroxa's private wrappers remain unreachable, and no exposed callable object
-- may reference pg_net or dynamic SQL. A release probe separately verifies that
-- the net schema is not exposed by PostgREST.

create or replace function veroxa_private.momo_content_ai_database_boundary_v1()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_role name;
begin
  foreach target_role in array array[
    'anon'::name,
    'authenticated'::name,
    'service_role'::name,
    'authenticator'::name
  ] loop
    if not exists (
      select 1 from pg_catalog.pg_roles role
      where role.rolname = target_role
    ) then
      return false;
    end if;

    if target_role in ('anon','authenticated','service_role')
       and exists (
         select 1 from pg_catalog.pg_roles role
         where role.rolname = target_role and role.rolcanlogin
       ) then
      return false;
    end if;

    if pg_catalog.has_schema_privilege(target_role, 'public', 'CREATE')
       or pg_catalog.has_schema_privilege(
         target_role, 'graphql_public', 'CREATE'
       )
       or pg_catalog.has_schema_privilege(
         target_role, 'veroxa_private', 'USAGE'
       )
       or pg_catalog.has_schema_privilege(
         target_role, 'veroxa_private', 'CREATE'
       )
       or pg_catalog.has_function_privilege(
         target_role,
         'veroxa_private.momo_content_ai_runtime_secret_v1(text)',
         'EXECUTE'
       )
       or pg_catalog.has_function_privilege(
         target_role,
         'veroxa_private.deliver_momo_content_ai_dispatch_wake_v1()',
         'EXECUTE'
       )
       or pg_catalog.has_function_privilege(
         target_role,
         'veroxa_private.deliver_momo_content_ai_recovery_wake_v1()',
         'EXECUTE'
       ) then
      return false;
    end if;
  end loop;

  if exists (
    select 1
    from pg_catalog.pg_proc routine
    join pg_catalog.pg_namespace namespace
      on namespace.oid = routine.pronamespace
    where namespace.nspname in ('public','graphql_public')
      and routine.prokind in ('f','p')
      and exists (
        select 1
        from unnest(array[
          'anon'::name,
          'authenticated'::name,
          'service_role'::name,
          'authenticator'::name
        ]) target(role_name)
        where pg_catalog.has_schema_privilege(
            target.role_name, namespace.oid, 'USAGE'
          )
          and pg_catalog.has_function_privilege(
            target.role_name, routine.oid, 'EXECUTE'
          )
      )
      and (
        pg_catalog.pg_get_functiondef(routine.oid) ~* '\mnet\s*\.'
        or pg_catalog.pg_get_functiondef(routine.oid) ~* '\mexecute\M'
      )
  ) then
    return false;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname in ('public','graphql_public')
      and relation.relkind in ('v','m')
      and pg_catalog.pg_get_viewdef(relation.oid, true) ~* '\mnet\s*\.'
  ) then
    return false;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_trigger trigger_record
    join pg_catalog.pg_class relation
      on relation.oid = trigger_record.tgrelid
    join pg_catalog.pg_namespace namespace
      on namespace.oid = relation.relnamespace
    join pg_catalog.pg_proc trigger_routine
      on trigger_routine.oid = trigger_record.tgfoid
    where not trigger_record.tgisinternal
      and namespace.nspname in ('public','graphql_public')
      and (
        pg_catalog.pg_get_functiondef(trigger_routine.oid) ~* '\mnet\s*\.'
        or pg_catalog.pg_get_functiondef(trigger_routine.oid) ~* '\mexecute\M'
      )
  ) then
    return false;
  end if;

  return true;
exception when others then
  return false;
end;
$$;
revoke all on function
  veroxa_private.momo_content_ai_database_boundary_v1()
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_content_ai_runtime_secret_v1(
  p_name text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_count integer;
  secret_value text;
begin
  if not veroxa_private.momo_content_ai_database_boundary_v1() then
    return null;
  end if;
  if p_name not in (
    'momo_content_ai_dispatch_endpoint_v1',
    'momo_content_ai_recovery_endpoint_v1',
    'momo_content_ai_internal_hmac_v1'
  ) then
    return null;
  end if;
  select pg_catalog.count(*)::integer,
    pg_catalog.min(secret.decrypted_secret)
  into secret_count, secret_value
  from vault.decrypted_secrets secret
  where secret.name = p_name;
  if secret_count <> 1 or secret_value is null
     or secret_value is distinct from pg_catalog.btrim(secret_value) then
    return null;
  end if;
  return secret_value;
end;
$$;
revoke all on function
  veroxa_private.momo_content_ai_runtime_secret_v1(text)
  from public, anon, authenticated, service_role;

do $$
begin
  if not veroxa_private.momo_content_ai_database_boundary_v1() then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_database_boundary_not_satisfied';
  end if;
end;
$$;

comment on function
  veroxa_private.momo_content_ai_database_boundary_v1() is
  'Fail-closed database half of the managed pg_net boundary. Release verification must also prove that PostgREST rejects the net schema.';
comment on function
  veroxa_private.momo_content_ai_runtime_secret_v1(text) is
  'Returns an allowlisted Momo runtime secret only while the private database boundary remains satisfied.';
