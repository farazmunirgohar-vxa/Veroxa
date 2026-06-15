-- =============================================================
-- PR #102 — Media Upload + Storage Foundation
-- =============================================================
-- Scope: private bucket, conservative storage policies, and narrow
-- media_assets insert policy for authenticated client uploads. This does not
-- activate AUTH_MODE="real", public buckets, publishing, AI, reports, jobs, or
-- customer-visible automation.
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

create policy restaurant_media_client_insert_own_restaurant
on storage.objects for insert to authenticated
with check (
  bucket_id = 'restaurant-media'
  and (storage.foldername(name))[1] = 'restaurants'
  and public.current_user_has_active_restaurant(((storage.foldername(name))[2])::uuid)
  and (storage.foldername(name))[3] = 'uploads'
);

create policy restaurant_media_client_select_own_restaurant
on storage.objects for select to authenticated
using (
  bucket_id = 'restaurant-media'
  and (storage.foldername(name))[1] = 'restaurants'
  and public.current_user_has_active_restaurant(((storage.foldername(name))[2])::uuid)
);

create policy restaurant_media_team_select
on storage.objects for select to authenticated
using (bucket_id = 'restaurant-media' and public.current_user_is_active_team());

create policy media_assets_client_insert_uploaded_only
on public.media_assets for insert to authenticated
with check (
  public.current_user_has_active_restaurant(restaurant_id)
  and uploaded_by = auth.uid()
  and status = 'uploaded'
  and file_url is null
  and ai_summary is null
  and veroxa_notes is null
  and storage_path like ('restaurants/' || restaurant_id::text || '/uploads/%')
);
