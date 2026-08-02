-- A private rendition is already linked through
-- veroxa_content_media_placements.rendition_id. external_reference is reserved
-- for provider/public receipts and must remain null while posting is disabled.

create or replace function public.veroxa_attach_momo_rendition_v1(
  p_restaurant_id uuid, p_content_item_id uuid, p_variant_id uuid,
  p_rendition_id uuid, p_platform text, p_media_role text,
  p_position smallint, p_alt_text text, p_placement_metadata jsonb
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare rendition_record public.veroxa_media_renditions%rowtype;
  existing_record public.veroxa_content_media_placements%rowtype; new_id uuid;
begin
  if not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501', message = 'momo_team_media_placement_required';
  end if;
  select * into rendition_record from public.veroxa_media_renditions rendition
  where rendition.id = p_rendition_id and rendition.restaurant_id = p_restaurant_id
    and rendition.source_kind = 'owner_asset' and rendition.status = 'ready';
  if not found or rendition_record.source_asset_id is null
    or not exists (select 1 from public.veroxa_content_items item
      where item.id = p_content_item_id and item.restaurant_id = p_restaurant_id)
    or p_platform not in ('facebook','instagram','google_business','website','internal')
    or rendition_record.intended_use <> p_platform
    or p_media_role not in ('primary','carousel','thumbnail','hero')
    or p_position not between 0 and 20
    or char_length(btrim(p_alt_text)) not between 1 and 280
    or p_alt_text <> rendition_record.alt_text
    or jsonb_typeof(p_placement_metadata) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_momo_media_placement';
  end if;
  if (p_variant_id is not null and not exists (select 1 from public.veroxa_content_variants variant
      where variant.id = p_variant_id and variant.restaurant_id = p_restaurant_id
        and variant.content_item_id = p_content_item_id and variant.platform = p_platform))
    or (p_variant_id is null and p_platform in ('facebook','instagram','google_business')) then
    raise exception using errcode = '23503', message = 'momo_media_placement_variant_scope_mismatch';
  end if;
  select * into existing_record from public.veroxa_content_media_placements placement
  where placement.restaurant_id = p_restaurant_id and placement.content_item_id = p_content_item_id
    and placement.variant_id is not distinct from p_variant_id and placement.platform = p_platform
    and placement.position = p_position;
  if found then
    if existing_record.rendition_id is distinct from p_rendition_id
      or existing_record.source_asset_id is distinct from rendition_record.source_asset_id
      or existing_record.media_role is distinct from p_media_role
      or existing_record.alt_text is distinct from btrim(p_alt_text)
      or existing_record.placement_metadata is distinct from p_placement_metadata
      or existing_record.execution_mode is distinct from 'rehearsal'
      or existing_record.evidence_class is distinct from rendition_record.evidence_class then
      raise exception using errcode = '23505', message = 'momo_media_placement_idempotency_conflict';
    end if;
    return existing_record.id;
  end if;
  insert into public.veroxa_content_media_placements (
    restaurant_id, content_item_id, variant_id, source_asset_id, rendition_id,
    platform, media_role, position, alt_text, placement_metadata,
    execution_mode, evidence_class, created_by
  ) values (
    p_restaurant_id, p_content_item_id, p_variant_id, rendition_record.source_asset_id,
    rendition_record.id, p_platform, p_media_role, p_position, btrim(p_alt_text),
    p_placement_metadata, 'rehearsal', rendition_record.evidence_class, (select auth.uid())
  ) returning id into new_id;
  insert into public.veroxa_media_usage (
    restaurant_id, asset_id, content_item_id, platform, usage_kind,
    external_reference, recorded_by
  ) values (
    p_restaurant_id, rendition_record.source_asset_id, p_content_item_id,
    p_platform, 'draft', null, (select auth.uid())
  );
  return new_id;
end;
$$;

revoke all on function public.veroxa_attach_momo_rendition_v1(
  uuid,uuid,uuid,uuid,text,text,smallint,text,jsonb
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_attach_momo_rendition_v1(
  uuid,uuid,uuid,uuid,text,text,smallint,text,jsonb
) to authenticated;
