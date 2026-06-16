-- =============================================================
-- PR #102 — Media Upload + Storage Foundation
-- =============================================================
-- Scope: private bucket, conservative storage policies, full safe path
-- enforcement, and narrow media_assets insert policy for authenticated client
-- uploads. This does not activate AUTH_MODE="real", public buckets,
-- publishing, AI, reports, jobs, or customer-visible automation.
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-media',
  'restaurant-media',
  false,
  104857600,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_safe_restaurant_media_storage_path(object_name text)
returns boolean language sql immutable as $$
  select object_name ~ '^restaurants/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/uploads/[0-9]{4}/(0[1-9]|1[0-2])/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|heic|heif|mp4|mov|webm)$';
$$;

create or replace function public.restaurant_id_from_media_storage_path(object_name text)
returns uuid language sql immutable as $$
  select case
    when public.is_safe_restaurant_media_storage_path(object_name)
      then split_part(object_name, '/', 2)::uuid
    else null
  end;
$$;

alter table public.media_assets
  add constraint media_assets_storage_path_safe_shape
  check (storage_path is not null and public.is_safe_restaurant_media_storage_path(storage_path));

alter table public.media_assets
  add constraint media_assets_restaurant_matches_storage_path
  check (restaurant_id = public.restaurant_id_from_media_storage_path(storage_path));

alter table public.media_assets
  add constraint media_assets_file_metadata_valid
  check (
    file_type is not null
    and mime_type is not null
    and file_size is not null
    and (
      (
        file_type = 'image'
        and mime_type in ('image/jpeg','image/png','image/webp','image/heic','image/heif')
        and file_size > 0
        and file_size <= 26214400
      )
      or
      (
        file_type = 'video'
        and mime_type in ('video/mp4','video/quicktime','video/webm')
        and file_size > 0
        and file_size <= 104857600
      )
    )
  );

drop policy if exists restaurant_media_client_insert_own_restaurant on storage.objects;
drop policy if exists restaurant_media_client_select_own_restaurant on storage.objects;
drop policy if exists restaurant_media_team_select on storage.objects;
drop policy if exists media_assets_client_insert_uploaded_only on public.media_assets;

create policy restaurant_media_client_insert_own_restaurant
on storage.objects for insert to authenticated
with check (
  bucket_id = 'restaurant-media'
  and public.is_safe_restaurant_media_storage_path(name)
  and public.current_user_has_active_restaurant(public.restaurant_id_from_media_storage_path(name))
);

create policy restaurant_media_client_select_own_restaurant
on storage.objects for select to authenticated
using (
  bucket_id = 'restaurant-media'
  and public.is_safe_restaurant_media_storage_path(name)
  and public.current_user_has_active_restaurant(public.restaurant_id_from_media_storage_path(name))
);

create policy restaurant_media_team_select
on storage.objects for select to authenticated
using (
  bucket_id = 'restaurant-media'
  and public.is_safe_restaurant_media_storage_path(name)
  and public.current_user_is_active_team()
);

create policy media_assets_client_insert_uploaded_only
on public.media_assets for insert to authenticated
with check (
  public.current_user_has_active_restaurant(restaurant_id)
  and storage_path is not null
  and public.is_safe_restaurant_media_storage_path(storage_path)
  and restaurant_id = public.restaurant_id_from_media_storage_path(storage_path)
  and uploaded_by = auth.uid()
  and status = 'uploaded'
  and file_url is null
  and ai_summary is null
  and veroxa_notes is null
  and file_type is not null
  and mime_type is not null
  and file_size is not null
  and (
    (
      file_type = 'image'
      and mime_type in ('image/jpeg','image/png','image/webp','image/heic','image/heif')
      and file_size > 0
      and file_size <= 26214400
    )
    or
    (
      file_type = 'video'
      and mime_type in ('video/mp4','video/quicktime','video/webm')
      and file_size > 0
      and file_size <= 104857600
    )
  )
);
