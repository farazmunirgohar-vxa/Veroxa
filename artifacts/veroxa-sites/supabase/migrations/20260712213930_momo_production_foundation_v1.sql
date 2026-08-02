-- =============================================================
-- Momo Production Foundation V1 — non-destructive coexistence migration
-- =============================================================
-- Creates a versioned production identity/tenant/storage model without
-- deleting or reshaping the older seeded demo schema. Legacy demo tables are
-- preserved, and their broad M024 development policies are removed. Momo's House San Antonio is the
-- only operational scope. Other restaurants belong only in Audit Center.
-- =============================================================

create extension if not exists pgcrypto;
create schema if not exists veroxa_private;
revoke all on schema veroxa_private from public, anon, authenticated;

-- The legacy Vite demo schema remains available for rollback inspection, but
-- it must never be reachable through a broad browser policy. Remove the ten
-- development policies introduced by M024A without deleting or rewriting
-- their seeded rows; the remaining legacy policies keep their existing RLS.
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

do $$ begin
  create type public.veroxa_role_v1 as enum ('client', 'team');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.veroxa_account_status_v1 as enum ('active', 'pending', 'disabled');
exception when duplicate_object then null; end $$;

create table if not exists public.veroxa_restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  city text,
  state text,
  timezone text not null default 'America/Chicago',
  status public.veroxa_account_status_v1 not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.veroxa_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (email = lower(btrim(email))),
  role public.veroxa_role_v1 not null,
  display_name text,
  status public.veroxa_account_status_v1 not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.veroxa_restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  user_id uuid not null references public.veroxa_user_profiles(user_id) on delete cascade,
  role public.veroxa_role_v1 not null,
  status public.veroxa_account_status_v1 not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veroxa_restaurant_members_unique unique (restaurant_id, user_id)
);

create table if not exists veroxa_private.operational_restaurant_scope (
  scope_key text primary key check (scope_key = 'momo_house_san_antonio'),
  restaurant_id uuid not null unique references public.veroxa_restaurants(id) on delete restrict,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists veroxa_private.auth_identity_allowlist (
  email text primary key check (email = lower(btrim(email))),
  role public.veroxa_role_v1 not null,
  display_name text not null,
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete restrict,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.veroxa_media_assets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.veroxa_restaurants(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 104857600),
  uploaded_by uuid not null references public.veroxa_user_profiles(user_id),
  status text not null default 'uploaded' check (status in ('uploaded','under_veroxa_review','ready_to_use','saved_for_later','better_version_helpful','used')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table veroxa_private.operational_restaurant_scope from public, anon, authenticated;
revoke all on table veroxa_private.auth_identity_allowlist from public, anon, authenticated;

create or replace function veroxa_private.set_updated_at()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function veroxa_private.set_updated_at() from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'veroxa_restaurants','veroxa_user_profiles','veroxa_restaurant_members','veroxa_media_assets'
  ] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_set_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function veroxa_private.set_updated_at()', table_name || '_set_updated_at', table_name);
  end loop;
end $$;

create or replace function veroxa_private.enforce_member_role()
returns trigger language plpgsql security definer set search_path = '' as $$
declare profile_role public.veroxa_role_v1;
begin
  select role into profile_role from public.veroxa_user_profiles where user_id = new.user_id;
  if profile_role is null or profile_role <> new.role then
    raise exception 'restaurant membership role must match the user profile';
  end if;
  return new;
end;
$$;
revoke all on function veroxa_private.enforce_member_role() from public, anon, authenticated;
drop trigger if exists veroxa_restaurant_members_role_guard on public.veroxa_restaurant_members;
create trigger veroxa_restaurant_members_role_guard before insert or update of user_id, role
on public.veroxa_restaurant_members for each row execute function veroxa_private.enforce_member_role();

create or replace function veroxa_private.current_user_has_operational_membership(
  target_restaurant_id uuid,
  required_role public.veroxa_role_v1
)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from veroxa_private.operational_restaurant_scope scope
    join public.veroxa_restaurants restaurant on restaurant.id = scope.restaurant_id
    join public.veroxa_restaurant_members member
      on member.restaurant_id = scope.restaurant_id and member.user_id = (select auth.uid())
    join public.veroxa_user_profiles profile on profile.user_id = member.user_id
    where scope.scope_key = 'momo_house_san_antonio'
      and scope.enabled
      and scope.restaurant_id = target_restaurant_id
      and restaurant.status = 'active'::public.veroxa_account_status_v1
      and member.status = 'active'::public.veroxa_account_status_v1
      and profile.status = 'active'::public.veroxa_account_status_v1
      and member.role = profile.role
      and profile.role = required_role
  );
$$;
revoke all on function veroxa_private.current_user_has_operational_membership(uuid, public.veroxa_role_v1) from public, anon, authenticated;

create or replace function public.veroxa_current_user_is_active_team()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from veroxa_private.operational_restaurant_scope scope
    where scope.scope_key = 'momo_house_san_antonio'
      and scope.enabled
      and veroxa_private.current_user_has_operational_membership(scope.restaurant_id, 'team'::public.veroxa_role_v1)
  );
$$;
create or replace function public.veroxa_current_user_has_active_restaurant(target_restaurant_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select veroxa_private.current_user_has_operational_membership(target_restaurant_id, 'client'::public.veroxa_role_v1);
$$;
create or replace function public.veroxa_current_user_is_team_for_restaurant(target_restaurant_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select veroxa_private.current_user_has_operational_membership(target_restaurant_id, 'team'::public.veroxa_role_v1);
$$;
revoke all on function public.veroxa_current_user_is_active_team() from public, anon;
revoke all on function public.veroxa_current_user_has_active_restaurant(uuid) from public, anon;
revoke all on function public.veroxa_current_user_is_team_for_restaurant(uuid) from public, anon;
grant execute on function public.veroxa_current_user_is_active_team() to authenticated;
grant execute on function public.veroxa_current_user_has_active_restaurant(uuid) to authenticated;
grant execute on function public.veroxa_current_user_is_team_for_restaurant(uuid) to authenticated;

create or replace function veroxa_private.provision_allowlisted_auth_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare approved veroxa_private.auth_identity_allowlist%rowtype;
begin
  if new.email is null then return new; end if;
  select * into approved from veroxa_private.auth_identity_allowlist
  where email = lower(btrim(new.email)) and enabled;
  if approved.email is null then return new; end if;
  insert into public.veroxa_user_profiles (user_id,email,role,display_name,status)
  values (new.id,lower(btrim(new.email)),approved.role,approved.display_name,'active')
  on conflict (user_id) do update set email=excluded.email, role=excluded.role,
    display_name=excluded.display_name, status='active';
  insert into public.veroxa_restaurant_members (restaurant_id,user_id,role,status)
  values (approved.restaurant_id,new.id,approved.role,'active')
  on conflict (restaurant_id,user_id) do update set role=excluded.role,status='active';
  return new;
end;
$$;
revoke all on function veroxa_private.provision_allowlisted_auth_identity() from public, anon, authenticated;
drop trigger if exists veroxa_provision_allowlisted_identity on auth.users;
create trigger veroxa_provision_allowlisted_identity after insert or update of email on auth.users
for each row execute function veroxa_private.provision_allowlisted_auth_identity();

alter table public.veroxa_restaurants enable row level security;
alter table public.veroxa_restaurants force row level security;
alter table public.veroxa_user_profiles enable row level security;
alter table public.veroxa_user_profiles force row level security;
alter table public.veroxa_restaurant_members enable row level security;
alter table public.veroxa_restaurant_members force row level security;
alter table public.veroxa_media_assets enable row level security;
alter table public.veroxa_media_assets force row level security;

revoke all on table public.veroxa_restaurants, public.veroxa_user_profiles,
  public.veroxa_restaurant_members, public.veroxa_media_assets from anon, authenticated;
grant select on table public.veroxa_restaurants, public.veroxa_user_profiles,
  public.veroxa_restaurant_members, public.veroxa_media_assets to authenticated;
grant insert on table public.veroxa_media_assets to authenticated;

drop policy if exists veroxa_profiles_self_or_team_select on public.veroxa_user_profiles;
create policy veroxa_profiles_self_or_team_select on public.veroxa_user_profiles
for select to authenticated using (
  user_id = (select auth.uid()) or public.veroxa_current_user_is_active_team()
);
drop policy if exists veroxa_restaurants_member_select on public.veroxa_restaurants;
create policy veroxa_restaurants_member_select on public.veroxa_restaurants
for select to authenticated using (
  public.veroxa_current_user_has_active_restaurant(id)
  or public.veroxa_current_user_is_team_for_restaurant(id)
);
drop policy if exists veroxa_members_self_or_team_select on public.veroxa_restaurant_members;
create policy veroxa_members_self_or_team_select on public.veroxa_restaurant_members
for select to authenticated using (
  (user_id = (select auth.uid()) and public.veroxa_current_user_has_active_restaurant(restaurant_id))
  or public.veroxa_current_user_is_team_for_restaurant(restaurant_id)
);
drop policy if exists veroxa_media_member_select on public.veroxa_media_assets;
create policy veroxa_media_member_select on public.veroxa_media_assets
for select to authenticated using (
  public.veroxa_current_user_has_active_restaurant(restaurant_id)
  or public.veroxa_current_user_is_team_for_restaurant(restaurant_id)
);
drop policy if exists veroxa_media_client_insert on public.veroxa_media_assets;
create policy veroxa_media_client_insert on public.veroxa_media_assets
for insert to authenticated with check (
  public.veroxa_current_user_has_active_restaurant(restaurant_id)
  and uploaded_by = (select auth.uid())
  and storage_path ~ ('^restaurants/' || restaurant_id::text || '/uploads/[0-9]{4}/(0[1-9]|1[0-2])/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|heif|mp4|mov|webm)$')
);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('restaurant-media','restaurant-media',false,104857600,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.veroxa_restaurant_id_from_storage_path(object_name text)
returns uuid language plpgsql immutable set search_path = pg_catalog as $$
begin
  if object_name !~ '^restaurants/[0-9a-f-]{36}/uploads/' then return null; end if;
  return split_part(object_name,'/',2)::uuid;
exception when invalid_text_representation then return null;
end;
$$;
revoke all on function public.veroxa_restaurant_id_from_storage_path(text) from public, anon;
grant execute on function public.veroxa_restaurant_id_from_storage_path(text) to authenticated;

drop policy if exists restaurant_media_client_insert_own_restaurant on storage.objects;
drop policy if exists restaurant_media_client_select_own_restaurant on storage.objects;
drop policy if exists restaurant_media_team_select on storage.objects;
drop policy if exists restaurant_media_momo_team_select on storage.objects;
drop policy if exists veroxa_restaurant_media_client_insert on storage.objects;
drop policy if exists veroxa_restaurant_media_member_select on storage.objects;
create policy veroxa_restaurant_media_client_insert on storage.objects
for insert to authenticated with check (
  bucket_id='restaurant-media'
  and public.veroxa_current_user_has_active_restaurant(public.veroxa_restaurant_id_from_storage_path(name))
);
create policy veroxa_restaurant_media_member_select on storage.objects
for select to authenticated using (
  bucket_id='restaurant-media' and (
    public.veroxa_current_user_has_active_restaurant(public.veroxa_restaurant_id_from_storage_path(name))
    or public.veroxa_current_user_is_team_for_restaurant(public.veroxa_restaurant_id_from_storage_path(name))
  )
);

comment on table veroxa_private.operational_restaurant_scope is
  'Fail-closed singleton for Momo House San Antonio, the only operational client. Audit Center restaurants never enter this scope automatically.';
