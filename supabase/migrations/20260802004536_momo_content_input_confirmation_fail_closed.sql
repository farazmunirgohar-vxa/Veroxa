-- Every owner-confirmed truth input must have one applicable confirmation, and
-- the latest applicable confirmation must remain an approved real-owner
-- confirm/correct decision. A LEFT LATERAL join keeps inputs with no matching
-- confirmation visible to the anti-check so the readiness boundary fails closed.

create or replace function veroxa_private.content_inputs_current_v1(
  p_content_item_id uuid, p_restaurant_id uuid, p_platform text default null
) returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    exists (
      select 1 from public.veroxa_content_input_ledger input
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and input.input_kind = 'owner_confirmed_truth'
    )
    and exists (
      select 1 from public.veroxa_content_items item
      where item.id = p_content_item_id and item.restaurant_id = p_restaurant_id
        and (
          (item.primary_media_asset_id is null and not exists (
            select 1 from public.veroxa_content_input_ledger media_input
            where media_input.content_item_id = item.id
              and media_input.restaurant_id = item.restaurant_id
              and media_input.input_kind = 'permissioned_media'
          )) or (item.primary_media_asset_id is not null and exists (
            select 1 from public.veroxa_content_input_ledger media_input
            where media_input.content_item_id = item.id
              and media_input.restaurant_id = item.restaurant_id
              and media_input.input_kind = 'permissioned_media'
              and media_input.media_asset_id = item.primary_media_asset_id
          ))
        )
    )
    and not exists (
      select 1
      from public.veroxa_content_input_ledger input
      join public.veroxa_content_items item
        on item.id = input.content_item_id and item.restaurant_id = input.restaurant_id
      left join public.veroxa_restaurant_truth_fields field
        on input.input_kind = 'owner_confirmed_truth'
       and field.id = input.truth_field_id and field.restaurant_id = input.restaurant_id
      left join public.veroxa_media_rights rights
        on input.input_kind = 'permissioned_media'
       and rights.asset_id = input.media_asset_id and rights.restaurant_id = input.restaurant_id
      left join public.veroxa_media_reviews review
        on input.input_kind = 'permissioned_media'
       and review.asset_id = input.media_asset_id and review.restaurant_id = input.restaurant_id
       and review.is_current
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and (
          (input.input_kind = 'owner_confirmed_truth' and (
            field.id is null or not field.is_current or field.status <> 'owner_confirmed'
            or field.evidence_class <> 'real_owner'
            or input.truth_value_sha256 is distinct from
              encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex')
            or input.input_sha256 is distinct from encode(extensions.digest(convert_to(
              concat_ws('|', item.id::text, input.input_kind, field.id::text,
                encode(extensions.digest(convert_to(field.value_json::text, 'UTF8'), 'sha256'), 'hex'),
                item.manual_pillar), 'UTF8'), 'sha256'), 'hex')
          )) or (input.input_kind = 'permissioned_media' and (
            rights.id is null or rights.rights_status <> 'confirmed'
            or rights.evidence_class <> 'real_owner'
            or (rights.valid_from is not null and rights.valid_from > now())
            or (rights.expires_at is not null and rights.expires_at <= now())
            or rights.attestation_version is distinct from input.rights_attestation_version
            or rights.attestation_sha256 is distinct from input.rights_attestation_sha256
            or review.id is null or not review.is_current or review.status <> 'approved'
            or not review.public_use_approved
            or (p_platform is not null and not (rights.usage_scope ? p_platform))
            or input.input_sha256 is distinct from encode(extensions.digest(convert_to(
              concat_ws('|', item.id::text, input.input_kind, rights.asset_id::text,
                rights.attestation_version, rights.attestation_sha256, item.manual_pillar),
              'UTF8'), 'sha256'), 'hex')
          ))
        )
    )
    and not exists (
      select 1
      from public.veroxa_content_input_ledger input
      join public.veroxa_restaurant_truth_fields field
        on field.id = input.truth_field_id and field.restaurant_id = input.restaurant_id
      left join lateral (
        select confirmation.* from public.veroxa_confirmations confirmation
        where confirmation.restaurant_id = input.restaurant_id
          and confirmation.subject_type = 'truth_field'
          and veroxa_private.truth_confirmation_applies_to_v1(
            confirmation.id, input.truth_field_id
          )
        order by confirmation.submitted_at desc, confirmation.created_at desc, confirmation.id desc
        limit 1
      ) latest on true
      where input.content_item_id = p_content_item_id
        and input.restaurant_id = p_restaurant_id
        and input.input_kind = 'owner_confirmed_truth'
        and (
          latest.id is null
          or latest.status is distinct from 'approved'
          or latest.decision is null
          or latest.decision not in ('confirm','correct')
          or latest.evidence_class is distinct from 'real_owner'
          or field.owner_confirmed_by is distinct from latest.submitted_by
          or field.owner_confirmed_at is distinct from latest.submitted_at
        )
    );
$$;

revoke all on function veroxa_private.content_inputs_current_v1(uuid, uuid, text)
  from public, anon, authenticated, service_role;

comment on function veroxa_private.content_inputs_current_v1(uuid, uuid, text) is
  'Fail-closed current-input validator: every truth input requires a latest applicable approved real-owner confirmation.';
