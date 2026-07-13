-- Run after production migrations. Raises when the versioned Team/Momo model
-- is not fail-closed or legacy demo data is still browser-accessible.
begin;
create extension if not exists pgtap with schema extensions;
select plan(1);
select lives_ok($test$
do $$
declare
  table_name text;
  missing_policy text;
begin
  foreach table_name in array array[
    'veroxa_restaurants','veroxa_user_profiles','veroxa_restaurant_members','veroxa_media_assets'
  ] loop
    if to_regclass('public.' || table_name) is null then
      raise exception 'required versioned production table is missing: %', table_name;
    end if;
    if not exists (
      select 1 from pg_class table_record
      join pg_namespace schema_record on schema_record.oid = table_record.relnamespace
      where schema_record.nspname='public' and table_record.relname=table_name
        and table_record.relrowsecurity and table_record.relforcerowsecurity
    ) then
      raise exception 'RLS is not enabled and forced on %', table_name;
    end if;
  end loop;

  if to_regclass('veroxa_private.operational_restaurant_scope') is null
     or to_regclass('veroxa_private.auth_identity_allowlist') is null then
    raise exception 'private operational scope or identity allowlist is missing';
  end if;

  select expected.policy_name into missing_policy
  from unnest(array[
    'veroxa_profiles_self_or_team_select',
    'veroxa_restaurants_member_select',
    'veroxa_members_self_or_team_select',
    'veroxa_media_team_select',
    'veroxa_media_client_insert',
    'veroxa_restaurant_media_client_insert',
    'veroxa_restaurant_media_member_select'
  ]) expected(policy_name)
  where not exists (
    select 1 from pg_policies where policyname = expected.policy_name
  ) limit 1;
  if missing_policy is not null then
    raise exception 'required Momo tenant policy is missing: %', missing_policy;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname in ('public','storage')
      and ('authenticated'::name = any(roles) or 'public'::name = any(roles))
      and (
        lower(regexp_replace(coalesce(qual,''),'[[:space:]()]','','g'))='true'
        or lower(regexp_replace(coalesce(with_check,''),'[[:space:]()]','','g'))='true'
      )
  ) then
    raise exception 'unsafe broad authenticated policy remains';
  end if;
end $$;
$test$, 'Momo production tenant/RLS catalog is fail-closed');
select * from finish();
rollback;
