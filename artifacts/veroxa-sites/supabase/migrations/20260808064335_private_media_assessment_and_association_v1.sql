-- Forward-only migration: private_media_assessment_and_association_v1.
-- Never edit these bytes after the migration is applied.
-- Apply after owner_truth_and_ready_disposition_v1: the sanitized v4
-- readback consumes its append-only Ready disposition evidence table.

-- Private assessment accepts unchanged JPEG, PNG, and WebP bytes. The existing
-- Momo content/Ready pipeline remains restricted to its narrower JPEG profile.

create table public.veroxa_private_media_assessment_intakes_v1 (
  id uuid primary key,
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  asset_id uuid not null
    references public.veroxa_media_assets(id) on delete restrict,
  storage_path text not null,
  storage_object_id uuid not null,
  storage_object_version text not null
    check (char_length(storage_object_version) between 1 and 200),
  declared_mime_type text not null,
  detected_mime_type text not null
    check (detected_mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size bigint not null check (file_size between 10240 and 10485760),
  width integer not null check (width between 128 and 12000),
  height integer not null check (height between 128 and 12000),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  verifier_version text not null check (
    verifier_version = 'veroxa-private-image-byte-verifier-2026-08-08-v1'
  ),
  verification_snapshot jsonb not null
    check (jsonb_typeof(verification_snapshot) = 'object'),
  verification_canonical text not null
    check (char_length(verification_canonical) between 2 and 20000),
  verification_sha256 text not null
    check (verification_sha256 ~ '^[0-9a-f]{64}$'),
  idempotency_hash text not null
    check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  platform_ready boolean not null,
  status text not null check (status = 'verified'),
  initiated_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  verified_at timestamptz not null default clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  unique (restaurant_id, asset_id),
  unique (restaurant_id, idempotency_hash),
  unique (storage_object_id, storage_object_version),
  check (width::numeric / height::numeric between 0.4 and 2.5),
  check (width::bigint * height::bigint <= 16777216),
  check (
    platform_ready = (
      detected_mime_type = 'image/jpeg'
      and file_size between 10240 and 5242880
      and width between 320 and 12000
      and height between 250 and 12000
      and width::numeric / height::numeric between 0.8 and 1.91
    )
  )
);

create table public.veroxa_private_media_assessments_v1 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  source_content_sha256 text not null
    check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  model text not null check (model = 'gpt-5.6-sol'),
  prompt_version text not null check (
    prompt_version = 'veroxa-private-media-assessment-2026-08-08-v1'
  ),
  schema_version text not null check (
    schema_version = 'veroxa-private-media-assessment-v1'
  ),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  idempotency_hash text not null check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  evidence_class text not null
    check (evidence_class in ('development_proxy', 'real_owner')),
  status text not null
    check (status in ('reserved', 'provider_running', 'completed', 'failed')),
  reserved_microusd bigint not null check (reserved_microusd = 1000000),
  requested_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  requested_at timestamptz not null default clock_timestamp(),
  provider_called boolean not null default false,
  provider_started_at timestamptz,
  provider_response_id text unique check (
    provider_response_id is null
    or provider_response_id ~ '^resp_[A-Za-z0-9_-]{8,195}$'
  ),
  provider_usage jsonb check (
    provider_usage is null or jsonb_typeof(provider_usage) = 'object'
  ),
  output_payload jsonb check (
    output_payload is null or jsonb_typeof(output_payload) = 'object'
  ),
  output_canonical text check (
    output_canonical is null
    or char_length(output_canonical) between 2 and 262144
  ),
  output_sha256 text check (
    output_sha256 is null or output_sha256 ~ '^[0-9a-f]{64}$'
  ),
  accounted_microusd bigint check (
    accounted_microusd is null
    or accounted_microusd between 0 and 20000000
  ),
  accounting_basis text check (
    accounting_basis is null
    or accounting_basis in (
      'provider_usage_estimate',
      'conservative_reservation',
      'zero_pre_provider'
    )
  ),
  provider_error_code text check (
    provider_error_code is null
    or provider_error_code ~ '^[a-z0-9_]{3,80}$'
  ),
  completed_at timestamptz,
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  updated_at timestamptz not null default clock_timestamp(),
  unique (
    restaurant_id,
    source_content_sha256,
    model,
    prompt_version,
    schema_version
  ),
  unique (restaurant_id, idempotency_hash),
  check (coalesce(
    (
      status = 'reserved'
      and not provider_called
      and provider_started_at is null
      and provider_response_id is null
      and provider_usage is null
      and output_payload is null
      and output_canonical is null
      and output_sha256 is null
      and accounted_microusd is null
      and accounting_basis is null
      and provider_error_code is null
      and completed_at is null
    ) or (
      status = 'provider_running'
      and provider_called
      and provider_started_at is not null
      and provider_response_id is null
      and provider_usage is null
      and output_payload is null
      and output_canonical is null
      and output_sha256 is null
      and accounted_microusd is null
      and accounting_basis is null
      and provider_error_code is null
      and completed_at is null
    ) or (
      status = 'completed'
      and provider_called
      and provider_started_at is not null
      and provider_response_id is not null
      and output_payload is not null
      and output_canonical is not null
      and output_sha256 is not null
      and accounted_microusd between 1 and reserved_microusd
      and accounting_basis in (
        'provider_usage_estimate', 'conservative_reservation'
      )
      and provider_error_code is null
      and completed_at is not null
    ) or (
      status = 'failed'
      and output_payload is null
      and output_canonical is null
      and output_sha256 is null
      and provider_error_code is not null
      and completed_at is not null
      and (
        (
          provider_called
          and provider_started_at is not null
          and (
            (
              accounting_basis = 'provider_usage_estimate'
              and provider_usage is not null
              and accounted_microusd between 1 and 20000000
            ) or (
              accounting_basis = 'conservative_reservation'
              and provider_usage is null
              and accounted_microusd = reserved_microusd
            )
          )
        ) or (
          not provider_called
          and provider_started_at is null
          and provider_response_id is null
          and provider_usage is null
          and accounted_microusd = 0
          and accounting_basis = 'zero_pre_provider'
        )
      )
    ), false
  ))
);

create table public.veroxa_private_media_assessment_asset_links_v1 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  asset_id uuid not null
    references public.veroxa_media_assets(id) on delete restrict,
  intake_id uuid not null
    references public.veroxa_private_media_assessment_intakes_v1(id)
    on delete restrict,
  assessment_id uuid not null
    references public.veroxa_private_media_assessments_v1(id)
    on delete restrict,
  source_content_sha256 text not null
    check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  reused_from_assessment_id uuid
    references public.veroxa_private_media_assessments_v1(id)
    on delete restrict,
  evidence_class text not null
    check (evidence_class in ('development_proxy', 'real_owner')),
  linked_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  linked_at timestamptz not null default clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  unique (restaurant_id, asset_id)
);

create table public.veroxa_private_media_assessment_events_v1 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  assessment_id uuid not null
    references public.veroxa_private_media_assessments_v1(id)
    on delete restrict,
  asset_id uuid not null
    references public.veroxa_media_assets(id) on delete restrict,
  event_kind text not null check (
    event_kind in ('reserved', 'reused', 'provider_started', 'completed', 'failed')
  ),
  event_payload jsonb not null
    check (jsonb_typeof(event_payload) = 'object'),
  actor_id uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  occurred_at timestamptz not null default clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed)
);

create table public.veroxa_private_media_assessment_tags_v1 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  assessment_id uuid not null
    references public.veroxa_private_media_assessments_v1(id)
    on delete restrict,
  position smallint not null check (position between 1 and 16),
  slug text not null check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(slug) between 3 and 80
  ),
  label text not null check (char_length(label) between 3 and 100),
  evidence_class text not null
    check (evidence_class in ('objective', 'visual_hypothesis')),
  category text not null check (category in (
    'scene', 'presentation', 'object',
    'dish_hypothesis', 'ingredient_hypothesis', 'other_hypothesis'
  )),
  confidence numeric not null check (confidence between 0 and 1),
  uncertainty text check (
    uncertainty is null
    or char_length(uncertainty) between 20 and 240
  ),
  created_at timestamptz not null default clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  unique (assessment_id, position),
  unique (assessment_id, slug)
);

create table public.veroxa_media_restaurant_associations_v1 (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.veroxa_restaurants(id) on delete restrict,
  asset_id uuid not null
    references public.veroxa_media_assets(id) on delete restrict,
  rights_id uuid not null
    references public.veroxa_media_rights(id) on delete restrict,
  source_content_sha256 text not null
    check (source_content_sha256 ~ '^[0-9a-f]{64}$'),
  association text not null check (association in (
    'represents_current_restaurant_offering',
    'licensed_generic_only',
    'not_for_restaurant'
  )),
  note text not null check (char_length(btrim(note)) between 3 and 2000),
  evidence_class text not null
    check (evidence_class in ('development_proxy', 'real_owner')),
  recorded_by uuid not null
    references public.veroxa_user_profiles(user_id) on delete restrict,
  recorded_at timestamptz not null default clock_timestamp(),
  external_write_allowed boolean not null default false
    check (not external_write_allowed),
  check (
    association <> 'represents_current_restaurant_offering'
    or evidence_class = 'real_owner'
  ),
  unique (
    restaurant_id, asset_id, rights_id, source_content_sha256
  )
);

create index veroxa_private_assessment_links_hash_v1
  on public.veroxa_private_media_assessment_asset_links_v1
    (restaurant_id, source_content_sha256, linked_at desc);
create index veroxa_private_assessment_events_time_v1
  on public.veroxa_private_media_assessment_events_v1
    (assessment_id, occurred_at, id);
create index veroxa_media_associations_latest_v1
  on public.veroxa_media_restaurant_associations_v1
    (restaurant_id, asset_id, recorded_at desc, id desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'veroxa_private_media_assessment_intakes_v1',
    'veroxa_private_media_assessments_v1',
    'veroxa_private_media_assessment_asset_links_v1',
    'veroxa_private_media_assessment_events_v1',
    'veroxa_private_media_assessment_tags_v1',
    'veroxa_media_restaurant_associations_v1'
  ] loop
    execute pg_catalog.format(
      'alter table public.%I enable row level security', table_name
    );
    execute pg_catalog.format(
      'alter table public.%I force row level security', table_name
    );
    execute pg_catalog.format(
      'revoke all on table public.%I from public, anon, authenticated, service_role',
      table_name
    );
  end loop;
end;
$$;

create or replace function
  veroxa_private.protect_private_media_append_only_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = '23514',
    message = 'private_media_evidence_is_append_only';
end;
$$;
revoke all on function
  veroxa_private.protect_private_media_append_only_v1()
  from public, anon, authenticated, service_role;

create trigger veroxa_private_media_intakes_immutable_v1
before update or delete
on public.veroxa_private_media_assessment_intakes_v1
for each row execute function
  veroxa_private.protect_private_media_append_only_v1();
create trigger veroxa_private_media_links_immutable_v1
before update or delete
on public.veroxa_private_media_assessment_asset_links_v1
for each row execute function
  veroxa_private.protect_private_media_append_only_v1();
create trigger veroxa_private_media_events_immutable_v1
before update or delete
on public.veroxa_private_media_assessment_events_v1
for each row execute function
  veroxa_private.protect_private_media_append_only_v1();
create trigger veroxa_private_media_tags_immutable_v1
before update or delete
on public.veroxa_private_media_assessment_tags_v1
for each row execute function
  veroxa_private.protect_private_media_append_only_v1();
create trigger veroxa_media_associations_immutable_v1
before update or delete
on public.veroxa_media_restaurant_associations_v1
for each row execute function
  veroxa_private.protect_private_media_append_only_v1();

create or replace function
  veroxa_private.guard_private_media_assessment_transition_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '23514',
      message = 'private_media_assessment_is_immutable';
  end if;
  if new.id is distinct from old.id
     or new.restaurant_id is distinct from old.restaurant_id
     or new.source_content_sha256 is distinct from old.source_content_sha256
     or new.model is distinct from old.model
     or new.prompt_version is distinct from old.prompt_version
     or new.schema_version is distinct from old.schema_version
     or new.request_hash is distinct from old.request_hash
     or new.idempotency_hash is distinct from old.idempotency_hash
     or new.evidence_class is distinct from old.evidence_class
     or new.reserved_microusd is distinct from old.reserved_microusd
     or new.requested_by is distinct from old.requested_by
     or new.requested_at is distinct from old.requested_at
     or new.external_write_allowed then
    raise exception using errcode = '23514',
      message = 'private_media_assessment_lineage_is_immutable';
  end if;
  if not (
    (old.status = 'reserved'
      and new.status in ('provider_running', 'failed'))
    or (old.status = 'provider_running'
      and new.status in ('completed', 'failed'))
  ) then
    raise exception using errcode = '23514',
      message = 'invalid_private_media_assessment_transition';
  end if;
  new.updated_at := clock_timestamp();
  new.external_write_allowed := false;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_private_media_assessment_transition_v1()
  from public, anon, authenticated, service_role;

create trigger veroxa_private_media_assessment_transition_v1
before update or delete
on public.veroxa_private_media_assessments_v1
for each row execute function
  veroxa_private.guard_private_media_assessment_transition_v1();

create or replace function
  veroxa_private.private_media_assessment_output_valid_v1(p_output jsonb)
returns boolean
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  tag jsonb;
  issue jsonb;
  uncertainty jsonb;
  objective_label text;
  objective_labels text;
  expected_visual_summary text;
  subject_summary text;
  hypothesis_descriptor text;
  confidence numeric;
begin
  if not veroxa_private.momo_jsonb_exact_keys_v2(p_output, array[
    'schemaVersion', 'subject', 'visualSummary', 'qualityScore',
    'qualityIssues', 'tags', 'uncertainties'
  ])
     or p_output ->> 'schemaVersion' <>
       'veroxa-private-media-assessment-v1'
     or p_output ->> 'subject' not in (
       'food', 'drink', 'food_and_drink', 'dining_scene',
       'non_food', 'unclear'
     )
     or jsonb_typeof(p_output -> 'visualSummary') <> 'string'
     or btrim(p_output ->> 'visualSummary') <> p_output ->> 'visualSummary'
     or char_length(p_output ->> 'visualSummary') not between 20 and 400
     or jsonb_typeof(p_output -> 'qualityScore') <> 'number'
     or (p_output ->> 'qualityScore') !~ '^[1-5]$'
     or jsonb_typeof(p_output -> 'qualityIssues') <> 'array'
     or jsonb_array_length(p_output -> 'qualityIssues') not between 1 and 8
     or jsonb_typeof(p_output -> 'tags') <> 'array'
     or jsonb_array_length(p_output -> 'tags') not between 1 and 16
     or jsonb_typeof(p_output -> 'uncertainties') <> 'array'
     or jsonb_array_length(p_output -> 'uncertainties') not between 1 and 8 then
    return false;
  end if;

  if (select count(distinct value) from jsonb_array_elements(
      p_output -> 'qualityIssues'
    )) <> jsonb_array_length(p_output -> 'qualityIssues') then
    return false;
  end if;
  for issue in select value from jsonb_array_elements(
    p_output -> 'qualityIssues'
  ) loop
    if jsonb_typeof(issue) <> 'string'
       or issue #>> '{}' not in (
         'blur', 'dark', 'overexposed', 'glare', 'cropped_subject',
         'busy_background', 'readable_text',
         'possible_logo_or_watermark', 'none'
       ) then
      return false;
    end if;
  end loop;
  if (p_output -> 'qualityIssues') ? 'none'
     and jsonb_array_length(p_output -> 'qualityIssues') <> 1 then
    return false;
  end if;

  if p_output -> 'uncertainties' is distinct from pg_catalog.jsonb_build_array(
    'Pixels alone cannot confirm exact dish, ingredient, menu, business, ownership, or restaurant identity.'
  ) then
    return false;
  end if;
  for uncertainty in select value from jsonb_array_elements(
    p_output -> 'uncertainties'
  ) loop
    if jsonb_typeof(uncertainty) <> 'string'
       or btrim(uncertainty #>> '{}') <> uncertainty #>> '{}'
       or char_length(uncertainty #>> '{}') not between 20 and 240 then
      return false;
    end if;
  end loop;

  if (select count(distinct value ->> 'slug') from jsonb_array_elements(
      p_output -> 'tags'
    )) <> jsonb_array_length(p_output -> 'tags') then
    return false;
  end if;
  if (select count(distinct lower(value ->> 'label'))
      from jsonb_array_elements(p_output -> 'tags')) <>
      jsonb_array_length(p_output -> 'tags') then
    return false;
  end if;
  for tag in select value from jsonb_array_elements(p_output -> 'tags') loop
    if not veroxa_private.momo_jsonb_exact_keys_v2(tag, array[
      'slug', 'label', 'evidenceClass', 'category',
      'confidence', 'uncertainty'
    ])
       or jsonb_typeof(tag -> 'slug') <> 'string'
       or tag ->> 'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       or char_length(tag ->> 'slug') not between 3 and 80
       or jsonb_typeof(tag -> 'label') <> 'string'
       or btrim(tag ->> 'label') <> tag ->> 'label'
       or char_length(tag ->> 'label') not between 3 and 100
       or jsonb_typeof(tag -> 'confidence') <> 'number'
       or (tag ->> 'confidence') !~ '^(0(\.[0-9]+)?|1(\.0+)?)$' then
      return false;
    end if;
    confidence := (tag ->> 'confidence')::numeric;
    if tag ->> 'evidenceClass' = 'objective' then
      select vocabulary.label into objective_label
      from (values
        ('food-visible', 'Food visible'),
        ('drink-visible', 'Drink visible'),
        ('indoor-scene', 'Indoor scene'),
        ('outdoor-scene', 'Outdoor scene'),
        ('plate-visible', 'Plate visible'),
        ('bowl-visible', 'Bowl visible'),
        ('cup-visible', 'Cup visible'),
        ('tabletop', 'Tabletop'),
        ('close-up', 'Close-up'),
        ('overhead-view', 'Overhead view'),
        ('side-view', 'Side view'),
        ('single-serving', 'Single serving'),
        ('multiple-servings', 'Multiple servings'),
        ('packaging-visible', 'Packaging visible'),
        ('readable-text-visible', 'Readable text visible'),
        ('person-visible', 'Person visible')
      ) vocabulary(slug, label)
      where vocabulary.slug = tag ->> 'slug';
      if objective_label is null
         or objective_label <> tag ->> 'label'
         or tag ->> 'category' not in ('scene', 'presentation', 'object')
         or tag -> 'uncertainty' <> 'null'::jsonb then
        return false;
      end if;
    elsif tag ->> 'evidenceClass' = 'visual_hypothesis' then
      hypothesis_descriptor := substring(tag ->> 'label' from 10);
      if left(tag ->> 'slug', 9) <> 'possible-'
         or left(tag ->> 'label', 9) <> 'Possible '
         or hypothesis_descriptor <> lower(hypothesis_descriptor)
         or lower(hypothesis_descriptor) ~
           '(^|[^[:alnum:]_])(address|brand|business|cafe|café|company|licensed|location|logo|menu|momo|owner|ownership|permission|restaurant|rights|offering|san[[:space:]]+antonio|shop|trademark)([^[:alnum:]_]|$)'
         or tag ->> 'category' not in (
           'dish_hypothesis', 'ingredient_hypothesis', 'other_hypothesis'
         )
         or not (
           (
             tag ->> 'category' = 'dish_hypothesis'
             and tag ->> 'slug' = 'possible-dish-identity'
             and tag ->> 'label' = 'Possible dish identity'
           ) or (
             tag ->> 'category' = 'ingredient_hypothesis'
             and tag ->> 'slug' = 'possible-ingredient-identity'
             and tag ->> 'label' = 'Possible ingredient identity'
           ) or (
             tag ->> 'category' = 'other_hypothesis'
             and tag ->> 'slug' = 'possible-other-visual-identity'
             and tag ->> 'label' = 'Possible other visual identity'
           )
         )
         or confidence > 0.9
         or jsonb_typeof(tag -> 'uncertainty') <> 'string'
         or tag ->> 'uncertainty' <>
           'Pixels alone cannot confirm this possible visual identity.' then
        return false;
      end if;
    else
      return false;
    end if;
  end loop;

  subject_summary := case p_output ->> 'subject'
    when 'food' then 'Visible subject: food.'
    when 'drink' then 'Visible subject: drink.'
    when 'food_and_drink' then 'Visible subjects: food and drink.'
    when 'dining_scene' then
      'Visible scene: dining-related presentation.'
    when 'non_food' then
      'Visible subject: no food or drink is apparent.'
    when 'unclear' then 'Visible subject: unclear.'
  end;
  select pg_catalog.string_agg(
    element.value ->> 'label', ', ' order by element.ordinality
  ) into objective_labels
  from pg_catalog.jsonb_array_elements(p_output -> 'tags')
    with ordinality element(value, ordinality)
  where element.value ->> 'evidenceClass' = 'objective';
  expected_visual_summary := case when objective_labels is null
    then subject_summary || ' No objective visual tag was confirmed.'
    else subject_summary || ' Objective visual tags: ' ||
      objective_labels || '.'
  end;
  if p_output ->> 'visualSummary' <> expected_visual_summary then
    return false;
  end if;
  return true;
exception
  when others then
    return false;
end;
$$;
revoke all on function
  veroxa_private.private_media_assessment_output_valid_v1(jsonb)
  from public, anon, authenticated, service_role;

-- Keep registration aligned with the byte verifier. HEIC/HEIF remain rejected
-- because this release has no trusted server decoder for them.
create or replace function public.veroxa_register_momo_media_v2(
  p_restaurant_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_file_size bigint,
  p_original_file_name text default null,
  p_intake_notes text default null,
  p_usage_scope jsonb default
    '["facebook","instagram","google_business","website"]'::jsonb,
  p_expires_on date default null
)
returns table (asset_id uuid, rights_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  expiry timestamptz;
begin
  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp')
     or not coalesce(p_file_size between 10240 and 10485760, false)
     or not (
       (p_mime_type = 'image/jpeg'
         and lower(p_storage_path) ~ '\.(jpg|jpeg)$')
       or (p_mime_type = 'image/png'
         and lower(p_storage_path) ~ '\.png$')
       or (p_mime_type = 'image/webp'
         and lower(p_storage_path) ~ '\.webp$')
     ) then
    raise exception using errcode = '22023',
      message = 'private_media_requires_jpeg_png_or_webp';
  end if;
  if p_expires_on is not null then
    if p_expires_on <
       (pg_catalog.now() at time zone 'America/Chicago')::date then
      raise exception using errcode = '22023',
        message = 'media_rights_expiry_must_not_be_past';
    end if;
    expiry := (p_expires_on + time '23:59:59.999999')
      at time zone 'America/Chicago';
  end if;
  return query
  select registered.asset_id, registered.rights_id
  from public.veroxa_register_momo_media_v1(
    p_restaurant_id,
    p_storage_path,
    p_mime_type,
    p_file_size,
    p_original_file_name,
    p_intake_notes,
    p_usage_scope,
    expiry
  ) registered;
end;
$$;
revoke all on function public.veroxa_register_momo_media_v2(
  uuid, text, text, bigint, text, text, jsonb, date
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_register_momo_media_v2(
  uuid, text, text, bigint, text, text, jsonb, date
) to authenticated;

create or replace function
  public.veroxa_finalize_private_media_assessment_intake_v1(
    p_restaurant_id uuid,
    p_asset_id uuid,
    p_storage_object_id uuid,
    p_storage_object_version text,
    p_detected_mime text,
    p_file_size bigint,
    p_width integer,
    p_height integer,
    p_content_sha256 text,
    p_verification_snapshot jsonb,
    p_verification_canonical text,
    p_verification_sha256 text,
    p_idempotency_hash text,
    p_actor_id uuid
  )
returns table (
  intake_id uuid,
  asset_id uuid,
  platform_ready boolean,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset public.veroxa_media_assets%rowtype;
  object_record record;
  existing public.veroxa_private_media_assessment_intakes_v1%rowtype;
  strict_existing public.veroxa_momo_media_intake_verifications%rowtype;
  expected_snapshot jsonb;
  expected_canonical text;
  strict_snapshot jsonb;
  strict_canonical text;
  strict_sha256 text;
  strict_idempotency_hash text;
  selected_intake_id uuid;
  is_platform_ready boolean;
begin
  if not veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id, p_actor_id
  ) then
    raise exception using errcode = '42501',
      message = 'private_media_upload_member_required';
  end if;
  if p_detected_mime not in ('image/jpeg', 'image/png', 'image/webp')
     or p_content_sha256 is null
     or p_content_sha256 !~ '^[0-9a-f]{64}$'
     or p_verification_sha256 is null
     or p_verification_sha256 !~ '^[0-9a-f]{64}$'
     or p_idempotency_hash is null
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or char_length(coalesce(p_storage_object_version, ''))
       not between 1 and 200
     or not coalesce(p_file_size between 10240 and 10485760, false)
     or not coalesce(p_width between 128 and 12000, false)
     or not coalesce(p_height between 128 and 12000, false)
     or not coalesce(
       p_width::bigint * p_height::bigint <= 16777216,
       false
     )
     or not coalesce(
       case when p_height <> 0 then
         p_width::numeric / p_height::numeric between 0.4 and 2.5
       else false end,
       false
     ) then
    raise exception using errcode = '22023',
      message = 'invalid_private_media_upload_verification';
  end if;

  select * into asset
  from public.veroxa_media_assets candidate
  where candidate.id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
  for update;
  if not found
     or asset.mime_type is distinct from p_detected_mime
     or asset.file_size is distinct from p_file_size then
    raise exception using errcode = '23514',
      message = 'private_media_asset_metadata_mismatch';
  end if;

  select object.id, object.version, object.metadata
    into object_record
  from storage.objects object
  where object.bucket_id = 'restaurant-media'
    and object.name = asset.storage_path
    and object.id = p_storage_object_id;
  if not found
     or object_record.version is null
     or object_record.version is distinct from p_storage_object_version
     or coalesce(object_record.metadata ->> 'mimetype', '')
       is distinct from p_detected_mime
     or (case
       when coalesce(object_record.metadata ->> 'size', '')
         ~ '^[0-9]{1,30}$'
       then (object_record.metadata ->> 'size')::numeric
         is distinct from p_file_size::numeric
       else true
     end) then
    raise exception using errcode = '23514',
      message = 'private_media_storage_object_mismatch';
  end if;

  expected_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 3,
    'verifierVersion',
      'veroxa-private-image-byte-verifier-2026-08-08-v1',
    'restaurantId', p_restaurant_id,
    'assetId', p_asset_id,
    'storagePath', asset.storage_path,
    'storageObjectId', p_storage_object_id,
    'storageObjectVersion', p_storage_object_version,
    'detectedMime', p_detected_mime,
    'fileSize', p_file_size,
    'width', p_width,
    'height', p_height,
    'contentSha256', p_content_sha256
  );
  expected_canonical :=
    veroxa_private.momo_canonical_json_v1(expected_snapshot);
  if p_verification_snapshot is distinct from expected_snapshot
     or p_verification_canonical is distinct from expected_canonical
     or p_verification_sha256 is distinct from pg_catalog.encode(
       extensions.digest(
         pg_catalog.convert_to(expected_canonical, 'UTF8'), 'sha256'
       ), 'hex'
     ) then
    raise exception using errcode = '22023',
      message = 'invalid_private_media_upload_verification';
  end if;

  is_platform_ready := p_detected_mime = 'image/jpeg'
    and p_file_size between 10240 and 5242880
    and p_width between 320 and 12000
    and p_height between 250 and 12000
    and p_width::numeric / p_height::numeric between 0.8 and 1.91;

  select * into existing
  from public.veroxa_private_media_assessment_intakes_v1 intake
  where intake.restaurant_id = p_restaurant_id
    and intake.asset_id = p_asset_id
  for update;
  if found then
    if existing.storage_path = asset.storage_path
       and existing.storage_object_id = p_storage_object_id
       and existing.storage_object_version = p_storage_object_version
       and existing.detected_mime_type = p_detected_mime
       and existing.file_size = p_file_size
       and existing.width = p_width
       and existing.height = p_height
       and existing.content_sha256 = p_content_sha256
       and existing.verification_snapshot = expected_snapshot
       and existing.verification_canonical = expected_canonical
       and existing.verification_sha256 = p_verification_sha256
       and existing.idempotency_hash = p_idempotency_hash
       and existing.platform_ready = is_platform_ready then
      return query select existing.id, existing.asset_id,
        existing.platform_ready, false;
      return;
    end if;
    raise exception using errcode = '23505',
      message = 'private_media_intake_immutable_conflict';
  end if;

  if (asset.content_sha256 is not null
       and asset.content_sha256 <> p_content_sha256)
     or (asset.width is not null and asset.width <> p_width)
     or (asset.height is not null and asset.height <> p_height) then
    raise exception using errcode = '23505',
      message = 'private_media_asset_hash_immutable_conflict';
  end if;

  selected_intake_id := gen_random_uuid();
  if is_platform_ready then
    select * into strict_existing
    from public.veroxa_momo_media_intake_verifications verification
    where verification.restaurant_id = p_restaurant_id
      and verification.asset_id = p_asset_id
    for share;
    if found then
      if strict_existing.storage_path <> asset.storage_path
         or strict_existing.storage_object_id <> p_storage_object_id
         or strict_existing.storage_object_version <>
           p_storage_object_version
         or strict_existing.detected_mime_type <> p_detected_mime
         or strict_existing.file_size <> p_file_size
         or strict_existing.width <> p_width
         or strict_existing.height <> p_height
         or strict_existing.content_sha256 <> p_content_sha256 then
        raise exception using errcode = '23505',
          message = 'platform_media_intake_immutable_conflict';
      end if;
      selected_intake_id := strict_existing.id;
    end if;
  end if;

  insert into public.veroxa_private_media_assessment_intakes_v1 (
    id,
    restaurant_id,
    asset_id,
    storage_path,
    storage_object_id,
    storage_object_version,
    declared_mime_type,
    detected_mime_type,
    file_size,
    width,
    height,
    content_sha256,
    verifier_version,
    verification_snapshot,
    verification_canonical,
    verification_sha256,
    idempotency_hash,
    platform_ready,
    status,
    initiated_by
  ) values (
    selected_intake_id,
    p_restaurant_id,
    p_asset_id,
    asset.storage_path,
    p_storage_object_id,
    p_storage_object_version,
    asset.mime_type,
    p_detected_mime,
    p_file_size,
    p_width,
    p_height,
    p_content_sha256,
    'veroxa-private-image-byte-verifier-2026-08-08-v1',
    expected_snapshot,
    expected_canonical,
    p_verification_sha256,
    p_idempotency_hash,
    is_platform_ready,
    'verified',
    p_actor_id
  );

  if is_platform_ready and strict_existing.id is null then
    strict_snapshot := pg_catalog.jsonb_build_object(
      'schemaVersion', 1,
      'verifierVersion', 'momo-image-byte-verifier-2026-07-31-v1',
      'restaurantId', p_restaurant_id,
      'assetId', p_asset_id,
      'storagePath', asset.storage_path,
      'storageObjectId', p_storage_object_id,
      'storageObjectVersion', p_storage_object_version,
      'detectedMime', p_detected_mime,
      'fileSize', p_file_size,
      'width', p_width,
      'height', p_height,
      'contentSha256', p_content_sha256
    );
    strict_canonical :=
      veroxa_private.momo_canonical_json_v1(strict_snapshot);
    strict_sha256 := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(strict_canonical, 'UTF8'), 'sha256'
    ), 'hex');
    strict_idempotency_hash := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(
        'momo-platform-intake-derived-v1:' || p_idempotency_hash,
        'UTF8'
      ), 'sha256'
    ), 'hex');
    insert into public.veroxa_momo_media_intake_verifications (
      id,
      restaurant_id,
      asset_id,
      storage_path,
      storage_object_id,
      storage_object_version,
      declared_mime_type,
      detected_mime_type,
      file_size,
      width,
      height,
      content_sha256,
      verifier_version,
      verification_snapshot,
      verification_canonical,
      verification_sha256,
      idempotency_hash,
      status,
      initiated_by
    ) values (
      selected_intake_id,
      p_restaurant_id,
      p_asset_id,
      asset.storage_path,
      p_storage_object_id,
      p_storage_object_version,
      asset.mime_type,
      p_detected_mime,
      p_file_size,
      p_width,
      p_height,
      p_content_sha256,
      'momo-image-byte-verifier-2026-07-31-v1',
      strict_snapshot,
      strict_canonical,
      strict_sha256,
      strict_idempotency_hash,
      'verified',
      p_actor_id
    );
  end if;

  update public.veroxa_media_assets target
  set content_sha256 = coalesce(target.content_sha256, p_content_sha256),
      width = coalesce(target.width, p_width),
      height = coalesce(target.height, p_height),
      updated_at = clock_timestamp()
  where target.id = p_asset_id;

  return query
  select selected_intake_id, p_asset_id, is_platform_ready, false;
end;
$$;
revoke all on function
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid, uuid, uuid, text, text, bigint, integer, integer, text,
    jsonb, text, text, text, uuid
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_finalize_private_media_assessment_intake_v1(
    uuid, uuid, uuid, text, text, bigint, integer, integer, text,
    jsonb, text, text, text, uuid
  ) to service_role;

create or replace function
  public.veroxa_reserve_private_media_assessment_v1(
    p_restaurant_id uuid,
    p_asset_id uuid,
    p_request_hash text,
    p_idempotency_hash text,
    p_model text,
    p_prompt_version text,
    p_schema_version text,
    p_reserved_microusd bigint,
    p_actor_id uuid
  )
returns table (
  assessment_id uuid,
  assessment_status text,
  request_hash text,
  source_storage_path text,
  source_storage_object_id uuid,
  source_storage_object_version text,
  source_mime_type text,
  source_file_size bigint,
  source_width integer,
  source_height integer,
  source_content_sha256 text,
  evidence_class text,
  reused_from_assessment_id uuid,
  provider_response_id text,
  output_payload jsonb,
  output_sha256 text,
  reserved_microusd bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  intake public.veroxa_private_media_assessment_intakes_v1%rowtype;
  assessment public.veroxa_private_media_assessments_v1%rowtype;
  link public.veroxa_private_media_assessment_asset_links_v1%rowtype;
  actor_evidence_class text;
  committed_microusd bigint;
  reused_id uuid;
  source_media_discarded boolean;
begin
  if not veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id, p_actor_id
  ) then
    raise exception using errcode = '42501',
      message = 'private_media_assessment_member_required';
  end if;
  actor_evidence_class :=
    veroxa_private.momo_evidence_class_for_user_v1(
      p_restaurant_id, p_actor_id
    );
  if actor_evidence_class not in ('development_proxy', 'real_owner') then
    raise exception using errcode = '42501',
      message = 'private_media_assessment_evidence_authority_required';
  end if;
  if p_request_hash is null or p_request_hash !~ '^[0-9a-f]{64}$'
     or p_idempotency_hash is null
     or p_idempotency_hash !~ '^[0-9a-f]{64}$'
     or p_model is distinct from 'gpt-5.6-sol'
     or p_prompt_version is distinct from
       'veroxa-private-media-assessment-2026-08-08-v1'
     or p_schema_version is distinct from
       'veroxa-private-media-assessment-v1'
     or p_reserved_microusd is distinct from 1000000 then
    raise exception using errcode = '22023',
      message = 'invalid_private_media_assessment_reservation';
  end if;

  select * into intake
  from public.veroxa_private_media_assessment_intakes_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.asset_id = p_asset_id
    and candidate.status = 'verified'
  for share;
  if not found then
    raise exception using errcode = '23503',
      message = 'verified_private_media_intake_required';
  end if;

  -- The signed request carries bounded per-call consent, but only the durable
  -- current rights record can authorize assessment of these exact bytes.
  -- Development-proxy rights may authorize private assessment; they still
  -- cannot authorize Momo Ready or a current-restaurant association.
  if not exists (
    select 1
    from public.veroxa_media_assets asset
    join public.veroxa_media_rights rights
      on rights.asset_id = asset.id
     and rights.restaurant_id = asset.restaurant_id
    where asset.id = p_asset_id
      and asset.restaurant_id = p_restaurant_id
      and asset.content_sha256 = intake.content_sha256
      and rights.rights_status = 'confirmed'
      and rights.evidence_class in ('development_proxy', 'real_owner')
      and rights.attestation_version = 'momo-media-rights-v1'
      and rights.attestation_sha256 ~ '^[0-9a-f]{64}$'
      and (rights.valid_from is null
        or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null
        or rights.expires_at > pg_catalog.now())
  ) then
    raise exception using errcode = '40001',
      message = 'current_media_rights_refresh_required_for_assessment';
  end if;

  perform veroxa_private.lock_momo_source_media_v1(
    p_restaurant_id, intake.content_sha256
  );
  source_media_discarded :=
    veroxa_private.momo_source_media_discarded_v1(
      p_restaurant_id, intake.content_sha256
    );

  select * into link
  from public.veroxa_private_media_assessment_asset_links_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.asset_id = p_asset_id
  for share;
  if found then
    select * into assessment
    from public.veroxa_private_media_assessments_v1 candidate
    where candidate.id = link.assessment_id
      and candidate.restaurant_id = p_restaurant_id
      and candidate.source_content_sha256 = intake.content_sha256
      and candidate.model = p_model
      and candidate.prompt_version = p_prompt_version
      and candidate.schema_version = p_schema_version
    for share;
    if not found
       or link.intake_id <> intake.id
       or link.source_content_sha256 <> intake.content_sha256 then
      raise exception using errcode = '23505',
        message = 'private_media_assessment_asset_link_conflict';
    end if;
    if source_media_discarded and assessment.status <> 'completed' then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
    return query
    select assessment.id,
      assessment.status,
      assessment.request_hash,
      intake.storage_path,
      intake.storage_object_id,
      intake.storage_object_version,
      intake.detected_mime_type,
      intake.file_size,
      intake.width,
      intake.height,
      intake.content_sha256,
      link.evidence_class,
      link.reused_from_assessment_id,
      assessment.provider_response_id,
      case when assessment.status = 'completed'
        then assessment.output_payload else null end,
      case when assessment.status = 'completed'
        then assessment.output_sha256 else null end,
      assessment.reserved_microusd;
    return;
  end if;

  -- The budget row provides a tenant-wide serialization point. Assessment
  -- reservations have an additional hard cumulative ceiling of USD 20.
  perform budget.restaurant_id
  from veroxa_private.momo_ai_budget_controls budget
  where budget.restaurant_id = p_restaurant_id
    and budget.enabled
    and not budget.external_publishing_authorized
  for update;
  if not found or not exists (
    select 1
    from public.veroxa_momo_runtime_controls runtime
    where runtime.restaurant_id = p_restaurant_id
      and runtime.ai_live_calls
      and not runtime.provider_writes
      and not runtime.review_replies
      and not runtime.website_writes
      and not runtime.external_scheduling
  ) then
    raise exception using errcode = '55000',
      message = 'private_media_assessment_runtime_or_budget_disabled';
  end if;

  select * into assessment
  from public.veroxa_private_media_assessments_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.source_content_sha256 = intake.content_sha256
    and candidate.model = p_model
    and candidate.prompt_version = p_prompt_version
    and candidate.schema_version = p_schema_version
  for update;

  if source_media_discarded
     and (not found or assessment.status <> 'completed') then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  if not found then
    select coalesce(sum(case
      when candidate.status in ('reserved', 'provider_running')
        then candidate.reserved_microusd
      else coalesce(candidate.accounted_microusd, 0)
    end), 0)::bigint
      into committed_microusd
    from public.veroxa_private_media_assessments_v1 candidate
    where candidate.restaurant_id = p_restaurant_id;
    if committed_microusd + p_reserved_microusd > 20000000 then
      raise exception using errcode = '54000',
        message = 'private_media_assessment_twenty_usd_cap_exceeded';
    end if;

    insert into public.veroxa_private_media_assessments_v1 (
      restaurant_id,
      source_content_sha256,
      model,
      prompt_version,
      schema_version,
      request_hash,
      idempotency_hash,
      evidence_class,
      status,
      reserved_microusd,
      requested_by
    ) values (
      p_restaurant_id,
      intake.content_sha256,
      p_model,
      p_prompt_version,
      p_schema_version,
      p_request_hash,
      p_idempotency_hash,
      actor_evidence_class,
      'reserved',
      p_reserved_microusd,
      p_actor_id
    ) returning * into assessment;
    reused_id := null;
  else
    reused_id := assessment.id;
  end if;

  insert into public.veroxa_private_media_assessment_asset_links_v1 (
    restaurant_id,
    asset_id,
    intake_id,
    assessment_id,
    source_content_sha256,
    reused_from_assessment_id,
    evidence_class,
    linked_by
  ) values (
    p_restaurant_id,
    p_asset_id,
    intake.id,
    assessment.id,
    intake.content_sha256,
    reused_id,
    actor_evidence_class,
    p_actor_id
  ) returning * into link;

  insert into public.veroxa_private_media_assessment_events_v1 (
    restaurant_id,
    assessment_id,
    asset_id,
    event_kind,
    event_payload,
    actor_id
  ) values (
    p_restaurant_id,
    assessment.id,
    p_asset_id,
    case when reused_id is null then 'reserved' else 'reused' end,
    pg_catalog.jsonb_build_object(
      'sourceContentSha256', intake.content_sha256,
      'reusedFromAssessmentId', reused_id,
      'externalWriteAllowed', false
    ),
    p_actor_id
  );

  return query
  select assessment.id,
    assessment.status,
    assessment.request_hash,
    intake.storage_path,
    intake.storage_object_id,
    intake.storage_object_version,
    intake.detected_mime_type,
    intake.file_size,
    intake.width,
    intake.height,
    intake.content_sha256,
    link.evidence_class,
    link.reused_from_assessment_id,
    assessment.provider_response_id,
    case when assessment.status = 'completed'
      then assessment.output_payload else null end,
    case when assessment.status = 'completed'
      then assessment.output_sha256 else null end,
    assessment.reserved_microusd;
end;
$$;
revoke all on function
  public.veroxa_reserve_private_media_assessment_v1(
    uuid, uuid, text, text, text, text, text, bigint, uuid
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_reserve_private_media_assessment_v1(
    uuid, uuid, text, text, text, text, text, bigint, uuid
  ) to service_role;

create or replace function
  public.veroxa_start_private_media_assessment_provider_v1(
    p_assessment_id uuid,
    p_request_hash text,
    p_actor_id uuid
  )
returns table (
  assessment_id uuid,
  should_call boolean,
  assessment_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  preliminary public.veroxa_private_media_assessments_v1%rowtype;
  assessment public.veroxa_private_media_assessments_v1%rowtype;
  budget_control veroxa_private.momo_ai_budget_controls%rowtype;
  source_asset_id uuid;
  committed_microusd bigint;
begin
  -- Read immutable identity first, then take source, tenant budget, and the
  -- mutable assessment row in that order. Reserve and failure settlement use
  -- the same suffix, preventing advisory/budget/row lock inversions.
  select * into preliminary
  from public.veroxa_private_media_assessments_v1 candidate
  where candidate.id = p_assessment_id;
  if not found
     or not veroxa_private.momo_actor_has_operational_membership_v1(
       preliminary.restaurant_id, p_actor_id
     )
     or veroxa_private.momo_evidence_class_for_user_v1(
       preliminary.restaurant_id, p_actor_id
     ) not in ('development_proxy', 'real_owner') then
    raise exception using errcode = '42501',
      message = 'private_media_assessment_member_required';
  end if;
  if preliminary.request_hash is distinct from p_request_hash then
    raise exception using errcode = '40001',
      message = 'private_media_assessment_request_hash_mismatch';
  end if;
  if preliminary.status <> 'reserved' then
    return query select preliminary.id, false, preliminary.status;
    return;
  end if;
  perform veroxa_private.lock_momo_source_media_v1(
    preliminary.restaurant_id, preliminary.source_content_sha256
  );
  if veroxa_private.momo_source_media_discarded_v1(
    preliminary.restaurant_id, preliminary.source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  -- Budget is the tenant-wide settlement/start serialization point. Known
  -- provider overruns take this same lock in the failure RPC before changing
  -- commitment, so a later start cannot spend from a stale aggregate.
  select * into budget_control
  from veroxa_private.momo_ai_budget_controls budget
  where budget.restaurant_id = preliminary.restaurant_id
  for update;
  if not found
     or not budget_control.enabled
     or budget_control.external_publishing_authorized
     or not exists (
       select 1
       from public.veroxa_momo_runtime_controls runtime
       where runtime.restaurant_id = preliminary.restaurant_id
         and runtime.ai_live_calls
         and not runtime.provider_writes
         and not runtime.review_replies
         and not runtime.website_writes
         and not runtime.external_scheduling
     ) then
    raise exception using errcode = '55000',
      message = 'private_media_assessment_runtime_or_budget_disabled';
  end if;

  select * into assessment
  from public.veroxa_private_media_assessments_v1 candidate
  where candidate.id = p_assessment_id
  for update;
  if not found
     or assessment.restaurant_id is distinct from
       preliminary.restaurant_id
     or assessment.source_content_sha256 is distinct from
       preliminary.source_content_sha256
     or not veroxa_private.momo_actor_has_operational_membership_v1(
       assessment.restaurant_id, p_actor_id
     )
     or veroxa_private.momo_evidence_class_for_user_v1(
       assessment.restaurant_id, p_actor_id
     ) not in ('development_proxy', 'real_owner') then
    raise exception using errcode = '42501',
      message = 'private_media_assessment_member_required';
  end if;
  if assessment.request_hash is distinct from p_request_hash then
    raise exception using errcode = '40001',
      message = 'private_media_assessment_request_hash_mismatch';
  end if;
  if assessment.status <> 'reserved' then
    return query select assessment.id, false, assessment.status;
    return;
  end if;
  if not exists (
    select 1
    from public.veroxa_private_media_assessment_asset_links_v1 link
    join public.veroxa_private_media_assessment_intakes_v1 intake
      on intake.id = link.intake_id
     and intake.restaurant_id = link.restaurant_id
     and intake.asset_id = link.asset_id
     and intake.status = 'verified'
    join public.veroxa_media_assets asset
      on asset.id = link.asset_id
     and asset.restaurant_id = link.restaurant_id
     and asset.content_sha256 = link.source_content_sha256
    join public.veroxa_media_rights rights
      on rights.asset_id = asset.id
     and rights.restaurant_id = asset.restaurant_id
     and rights.rights_status = 'confirmed'
     and rights.evidence_class in ('development_proxy', 'real_owner')
     and rights.attestation_version = 'momo-media-rights-v1'
     and rights.attestation_sha256 ~ '^[0-9a-f]{64}$'
     and (rights.valid_from is null
       or rights.valid_from <= pg_catalog.now())
     and (rights.expires_at is null
       or rights.expires_at > pg_catalog.now())
    where link.assessment_id = assessment.id
      and link.restaurant_id = assessment.restaurant_id
      and link.source_content_sha256 =
        assessment.source_content_sha256
      and intake.content_sha256 = assessment.source_content_sha256
  ) then
    raise exception using errcode = '40001',
      message = 'current_media_rights_refresh_required_for_assessment';
  end if;

  select coalesce(sum(case
    when candidate.status in ('reserved', 'provider_running')
      then candidate.reserved_microusd
    else coalesce(candidate.accounted_microusd, 0)
  end), 0)::bigint
    into committed_microusd
  from public.veroxa_private_media_assessments_v1 candidate
  where candidate.restaurant_id = assessment.restaurant_id;
  if committed_microusd > 20000000 then
    update public.veroxa_private_media_assessments_v1 target
    set status = 'failed',
        provider_called = false,
        accounted_microusd = 0,
        accounting_basis = 'zero_pre_provider',
        provider_error_code =
          'twenty_usd_cap_exceeded_before_provider',
        completed_at = clock_timestamp(),
        updated_at = clock_timestamp()
    where target.id = assessment.id
      and target.status = 'reserved'
      and not target.provider_called
    returning * into assessment;

    select link.asset_id into source_asset_id
    from public.veroxa_private_media_assessment_asset_links_v1 link
    where link.assessment_id = assessment.id
      and link.restaurant_id = assessment.restaurant_id
    order by link.linked_at, link.id
    limit 1;
    insert into public.veroxa_private_media_assessment_events_v1 (
      restaurant_id, assessment_id, asset_id, event_kind,
      event_payload, actor_id
    ) values (
      assessment.restaurant_id,
      assessment.id,
      source_asset_id,
      'failed',
      pg_catalog.jsonb_build_object(
        'errorCode', assessment.provider_error_code,
        'providerCalled', false,
        'accountingBasis', assessment.accounting_basis,
        'accountedMicrousd', assessment.accounted_microusd,
        'externalWriteAllowed', false
      ),
      p_actor_id
    );
    return query select assessment.id, false, assessment.status;
    return;
  end if;

  update public.veroxa_private_media_assessments_v1 target
  set status = 'provider_running',
      provider_called = true,
      provider_started_at = clock_timestamp()
  where target.id = assessment.id
  returning * into assessment;

  select link.asset_id into source_asset_id
  from public.veroxa_private_media_assessment_asset_links_v1 link
  where link.assessment_id = assessment.id
    and link.restaurant_id = assessment.restaurant_id
  order by link.linked_at, link.id
  limit 1;
  insert into public.veroxa_private_media_assessment_events_v1 (
    restaurant_id, assessment_id, asset_id, event_kind,
    event_payload, actor_id
  ) values (
    assessment.restaurant_id,
    assessment.id,
    source_asset_id,
    'provider_started',
    pg_catalog.jsonb_build_object(
      'requestHash', assessment.request_hash,
      'externalWriteAllowed', false
    ),
    p_actor_id
  );

  return query select assessment.id, true, assessment.status;
end;
$$;
revoke all on function
  public.veroxa_start_private_media_assessment_provider_v1(uuid, text, uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_start_private_media_assessment_provider_v1(uuid, text, uuid)
  to service_role;

create or replace function
  public.veroxa_complete_private_media_assessment_v1(
    p_assessment_id uuid,
    p_request_hash text,
    p_provider_response_id text,
    p_output jsonb,
    p_output_canonical text,
    p_output_sha256 text,
    p_accounted_microusd bigint,
    p_accounting_basis text,
    p_provider_usage jsonb,
    p_actor_id uuid
  )
returns table (
  assessment_id uuid,
  assessment_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  assessment public.veroxa_private_media_assessments_v1%rowtype;
  tag jsonb;
  source_asset_id uuid;
  tag_position integer := 0;
begin
  select * into assessment
  from public.veroxa_private_media_assessments_v1 candidate
  where candidate.id = p_assessment_id
  for update;
  if not found
     or not veroxa_private.momo_actor_has_operational_membership_v1(
       assessment.restaurant_id, p_actor_id
     )
     or veroxa_private.momo_evidence_class_for_user_v1(
       assessment.restaurant_id, p_actor_id
     ) not in ('development_proxy', 'real_owner') then
    raise exception using errcode = '42501',
      message = 'private_media_assessment_member_required';
  end if;
  if assessment.request_hash is distinct from p_request_hash then
    raise exception using errcode = '40001',
      message = 'private_media_assessment_request_hash_mismatch';
  end if;
  if assessment.status = 'completed' then
    if assessment.provider_response_id is distinct from p_provider_response_id
       or assessment.output_payload is distinct from p_output
       or assessment.output_canonical is distinct from p_output_canonical
       or assessment.output_sha256 is distinct from p_output_sha256
       or assessment.accounted_microusd is distinct from
         p_accounted_microusd
       or assessment.accounting_basis is distinct from p_accounting_basis
       or assessment.provider_usage is distinct from p_provider_usage then
      raise exception using errcode = '23505',
        message = 'private_media_assessment_completion_conflict';
    end if;
    return query select assessment.id, assessment.status;
    return;
  end if;
  if assessment.status <> 'provider_running' then
    raise exception using errcode = '23514',
      message = 'private_media_assessment_not_provider_running';
  end if;
  if p_provider_response_id is null
     or p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$'
     or p_output_sha256 is null
     or p_output_sha256 !~ '^[0-9a-f]{64}$'
     or not coalesce(
       p_accounted_microusd between 1 and assessment.reserved_microusd,
       false
     )
     or p_accounting_basis not in (
       'provider_usage_estimate', 'conservative_reservation'
     )
     or not (
       (p_accounting_basis = 'provider_usage_estimate'
         and jsonb_typeof(p_provider_usage) = 'object')
       or (p_accounting_basis = 'conservative_reservation'
         and p_provider_usage is null
         and p_accounted_microusd = assessment.reserved_microusd)
     )
     or not veroxa_private.private_media_assessment_output_valid_v1(
       p_output
     )
     or p_output_canonical is distinct from
       veroxa_private.momo_canonical_json_v1(p_output)
     or p_output_sha256 is distinct from pg_catalog.encode(
       extensions.digest(
         pg_catalog.convert_to(p_output_canonical, 'UTF8'), 'sha256'
       ), 'hex'
     ) then
    raise exception using errcode = '22023',
      message = 'invalid_private_media_assessment_completion';
  end if;

  update public.veroxa_private_media_assessments_v1 target
  set status = 'completed',
      provider_response_id = p_provider_response_id,
      provider_usage = p_provider_usage,
      output_payload = p_output,
      output_canonical = p_output_canonical,
      output_sha256 = p_output_sha256,
      accounted_microusd = p_accounted_microusd,
      accounting_basis = p_accounting_basis,
      completed_at = clock_timestamp()
  where target.id = assessment.id
  returning * into assessment;

  for tag in select value
    from pg_catalog.jsonb_array_elements(p_output -> 'tags')
  loop
    tag_position := tag_position + 1;
    insert into public.veroxa_private_media_assessment_tags_v1 (
      restaurant_id,
      assessment_id,
      position,
      slug,
      label,
      evidence_class,
      category,
      confidence,
      uncertainty
    ) values (
      assessment.restaurant_id,
      assessment.id,
      tag_position,
      tag ->> 'slug',
      tag ->> 'label',
      tag ->> 'evidenceClass',
      tag ->> 'category',
      (tag ->> 'confidence')::numeric,
      case when tag -> 'uncertainty' = 'null'::jsonb
        then null else tag ->> 'uncertainty' end
    );
  end loop;

  select link.asset_id into source_asset_id
  from public.veroxa_private_media_assessment_asset_links_v1 link
  where link.assessment_id = assessment.id
    and link.restaurant_id = assessment.restaurant_id
  order by link.linked_at, link.id
  limit 1;
  insert into public.veroxa_private_media_assessment_events_v1 (
    restaurant_id,
    assessment_id,
    asset_id,
    event_kind,
    event_payload,
    actor_id
  ) values (
    assessment.restaurant_id,
    assessment.id,
    source_asset_id,
    'completed',
    pg_catalog.jsonb_build_object(
      'outputSha256', assessment.output_sha256,
      'accountingBasis', assessment.accounting_basis,
      'accountedMicrousd', assessment.accounted_microusd,
      'externalWriteAllowed', false
    ),
    p_actor_id
  );

  return query select assessment.id, assessment.status;
end;
$$;
revoke all on function
  public.veroxa_complete_private_media_assessment_v1(
    uuid, text, text, jsonb, text, text, bigint, text, jsonb, uuid
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_complete_private_media_assessment_v1(
    uuid, text, text, jsonb, text, text, bigint, text, jsonb, uuid
  ) to service_role;

create or replace function
  public.veroxa_fail_private_media_assessment_v1(
    p_assessment_id uuid,
    p_request_hash text,
    p_provider_response_id text,
    p_error_code text,
    p_provider_called boolean,
    p_accounted_microusd bigint,
    p_provider_usage jsonb,
    p_actor_id uuid
  )
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  preliminary public.veroxa_private_media_assessments_v1%rowtype;
  assessment public.veroxa_private_media_assessments_v1%rowtype;
  budget_control veroxa_private.momo_ai_budget_controls%rowtype;
  source_asset_id uuid;
  final_accounted_microusd bigint;
  final_accounting_basis text;
begin
  select * into preliminary
  from public.veroxa_private_media_assessments_v1 candidate
  where candidate.id = p_assessment_id;
  if not found
     or not veroxa_private.momo_actor_has_operational_membership_v1(
       preliminary.restaurant_id, p_actor_id
     )
     or veroxa_private.momo_evidence_class_for_user_v1(
       preliminary.restaurant_id, p_actor_id
     ) not in ('development_proxy', 'real_owner') then
    raise exception using errcode = '42501',
      message = 'private_media_assessment_member_required';
  end if;
  if preliminary.request_hash is distinct from p_request_hash then
    raise exception using errcode = '40001',
      message = 'private_media_assessment_request_hash_mismatch';
  end if;

  -- Failure settlement may increase committed spend above the reservation.
  -- Serialize it with reservation/start before taking the mutable assessment
  -- row so every multi-lock path uses budget -> assessment.
  select * into budget_control
  from veroxa_private.momo_ai_budget_controls budget
  where budget.restaurant_id = preliminary.restaurant_id
  for update;
  if not found then
    raise exception using errcode = '55000',
      message = 'private_media_assessment_budget_control_missing';
  end if;

  select * into assessment
  from public.veroxa_private_media_assessments_v1 candidate
  where candidate.id = p_assessment_id
  for update;
  if not found
     or assessment.restaurant_id is distinct from
       preliminary.restaurant_id
     or assessment.source_content_sha256 is distinct from
       preliminary.source_content_sha256
     or not veroxa_private.momo_actor_has_operational_membership_v1(
       assessment.restaurant_id, p_actor_id
     )
     or veroxa_private.momo_evidence_class_for_user_v1(
       assessment.restaurant_id, p_actor_id
     ) not in ('development_proxy', 'real_owner') then
    raise exception using errcode = '42501',
      message = 'private_media_assessment_member_required';
  end if;
  if assessment.request_hash is distinct from p_request_hash then
    raise exception using errcode = '40001',
      message = 'private_media_assessment_request_hash_mismatch';
  end if;
  if assessment.status = 'completed' then
    raise exception using errcode = '23514',
      message = 'private_media_assessment_already_completed';
  end if;
  if p_error_code is null
     or p_error_code !~ '^[a-z0-9_]{3,80}$'
     or p_provider_called is null
     or (p_provider_response_id is not null
       and p_provider_response_id !~ '^resp_[A-Za-z0-9_-]{8,195}$')
     or (p_provider_usage is not null
       and jsonb_typeof(p_provider_usage) <> 'object') then
    raise exception using errcode = '22023',
      message = 'invalid_private_media_assessment_failure';
  end if;

  if p_provider_called then
    if not (
        (
          p_provider_usage is not null
          and p_provider_response_id is not null
          and coalesce(
            p_accounted_microusd between 1 and 20000000,
             false
           )
         ) or (
           p_provider_usage is null
           and p_accounted_microusd = assessment.reserved_microusd
         )
       ) then
      raise exception using errcode = '23514',
        message = 'private_media_assessment_failure_state_mismatch';
    end if;
    final_accounted_microusd := p_accounted_microusd;
    final_accounting_basis := case
      when p_provider_usage is null then 'conservative_reservation'
      else 'provider_usage_estimate'
    end;
  else
    if p_provider_response_id is not null
       or p_provider_usage is not null
       or coalesce(p_accounted_microusd, 0) <> 0 then
      raise exception using errcode = '23514',
        message = 'private_media_assessment_failure_state_mismatch';
    end if;
    final_accounted_microusd := 0;
    final_accounting_basis := 'zero_pre_provider';
  end if;

  if assessment.status = 'failed' then
    if assessment.provider_response_id is distinct from
         p_provider_response_id
       or assessment.provider_error_code is distinct from p_error_code
       or assessment.provider_called is distinct from p_provider_called
       or assessment.accounted_microusd is distinct from
         final_accounted_microusd
       or assessment.accounting_basis is distinct from
         final_accounting_basis
       or assessment.provider_usage is distinct from p_provider_usage then
      raise exception using errcode = '23505',
        message = 'private_media_assessment_failure_replay_conflict';
    end if;
    return assessment.id;
  end if;
  if (p_provider_called and assessment.status <> 'provider_running')
     or (not p_provider_called and assessment.status <> 'reserved') then
    raise exception using errcode = '23514',
      message = 'private_media_assessment_failure_state_mismatch';
  end if;

  update public.veroxa_private_media_assessments_v1 target
  set status = 'failed',
      provider_called = p_provider_called,
      provider_response_id = p_provider_response_id,
      provider_usage = p_provider_usage,
      accounted_microusd = final_accounted_microusd,
      accounting_basis = final_accounting_basis,
      provider_error_code = p_error_code,
      completed_at = clock_timestamp()
  where target.id = assessment.id
  returning * into assessment;

  select link.asset_id into source_asset_id
  from public.veroxa_private_media_assessment_asset_links_v1 link
  where link.assessment_id = assessment.id
    and link.restaurant_id = assessment.restaurant_id
  order by link.linked_at, link.id
  limit 1;
  insert into public.veroxa_private_media_assessment_events_v1 (
    restaurant_id,
    assessment_id,
    asset_id,
    event_kind,
    event_payload,
    actor_id
  ) values (
    assessment.restaurant_id,
    assessment.id,
    source_asset_id,
    'failed',
    pg_catalog.jsonb_build_object(
      'errorCode', assessment.provider_error_code,
      'providerCalled', assessment.provider_called,
      'accountingBasis', assessment.accounting_basis,
      'accountedMicrousd', assessment.accounted_microusd,
      'externalWriteAllowed', false
    ),
    p_actor_id
  );
  return assessment.id;
end;
$$;
revoke all on function
  public.veroxa_fail_private_media_assessment_v1(
    uuid, text, text, text, boolean, bigint, jsonb, uuid
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_fail_private_media_assessment_v1(
    uuid, text, text, text, boolean, bigint, jsonb, uuid
  ) to service_role;

create or replace function
  veroxa_private.media_has_current_real_owner_association_v1(
    p_restaurant_id uuid,
    p_asset_id uuid,
    p_rights_id uuid,
    p_source_content_sha256 text
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_media_assets asset
    join public.veroxa_private_media_assessment_intakes_v1 intake
      on intake.asset_id = asset.id
     and intake.restaurant_id = asset.restaurant_id
     and intake.status = 'verified'
     and intake.content_sha256 = p_source_content_sha256
    join public.veroxa_private_media_assessment_asset_links_v1 link
      on link.asset_id = asset.id
     and link.restaurant_id = asset.restaurant_id
     and link.intake_id = intake.id
     and link.source_content_sha256 = intake.content_sha256
    join public.veroxa_private_media_assessments_v1 assessment
      on assessment.id = link.assessment_id
     and assessment.restaurant_id = asset.restaurant_id
     and assessment.source_content_sha256 = intake.content_sha256
     and assessment.status = 'completed'
    join public.veroxa_media_rights rights
      on rights.id = p_rights_id
     and rights.asset_id = asset.id
     and rights.restaurant_id = asset.restaurant_id
    join lateral (
      select association.*
      from public.veroxa_media_restaurant_associations_v1 association
      where association.restaurant_id = asset.restaurant_id
        and association.asset_id = asset.id
        and association.rights_id = p_rights_id
        and association.source_content_sha256 =
          p_source_content_sha256
      order by association.recorded_at desc, association.id desc
      limit 1
    ) latest on true
    where asset.id = p_asset_id
      and asset.restaurant_id = p_restaurant_id
      and asset.content_sha256 = p_source_content_sha256
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = 'real_owner'
      and (rights.valid_from is null
        or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null
        or rights.expires_at > pg_catalog.now())
      and latest.association =
        'represents_current_restaurant_offering'
      and latest.evidence_class = 'real_owner'
      and not latest.external_write_allowed
  );
$$;
revoke all on function
  veroxa_private.media_has_current_real_owner_association_v1(
    uuid, uuid, uuid, text
  ) from public, anon, authenticated, service_role;

create or replace function
  public.veroxa_record_media_restaurant_association_v1(
    p_restaurant_id uuid,
    p_asset_id uuid,
    p_rights_id uuid,
    p_expected_source_content_sha256 text,
    p_association text,
    p_note text
  )
returns table (
  association_id uuid,
  asset_id uuid,
  association text,
  association_evidence_class text,
  recorded_at timestamptz,
  external_write_allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_evidence_class text;
  asset public.veroxa_media_assets%rowtype;
  rights public.veroxa_media_rights%rowtype;
  intake public.veroxa_private_media_assessment_intakes_v1%rowtype;
  existing public.veroxa_media_restaurant_associations_v1%rowtype;
  inserted public.veroxa_media_restaurant_associations_v1%rowtype;
begin
  if actor_id is null
     or not public.veroxa_current_user_has_active_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'active_client_media_association_required';
  end if;
  actor_evidence_class :=
    veroxa_private.momo_evidence_class_for_user_v1(
      p_restaurant_id, actor_id
    );
  if actor_evidence_class not in ('development_proxy', 'real_owner') then
    raise exception using errcode = '42501',
      message = 'media_association_evidence_authority_required';
  end if;
  if p_expected_source_content_sha256 is null
     or p_expected_source_content_sha256 !~ '^[0-9a-f]{64}$'
     or p_association not in (
       'represents_current_restaurant_offering',
       'licensed_generic_only',
       'not_for_restaurant'
     )
     or p_note is null
     or char_length(btrim(p_note)) not between 3 and 2000 then
    raise exception using errcode = '22023',
      message = 'invalid_media_restaurant_association';
  end if;
  if p_association = 'represents_current_restaurant_offering'
     and actor_evidence_class <> 'real_owner' then
    raise exception using errcode = '42501',
      message = 'real_owner_restaurant_association_required';
  end if;

  -- Resolve only tenant-bound immutable identity before the source lock. No
  -- asset row lock may be held while waiting: Ready materialization takes
  -- source first and later updates the asset. Full locked evidence is re-read
  -- below after source ownership is established.
  select * into asset
  from public.veroxa_media_assets candidate
  where candidate.id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id;
  select * into intake
  from public.veroxa_private_media_assessment_intakes_v1 candidate
  where candidate.asset_id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
    and candidate.status = 'verified';
  if asset.id is null or intake.id is null
     or asset.content_sha256 is distinct from
       p_expected_source_content_sha256
     or intake.content_sha256 is distinct from
       p_expected_source_content_sha256 then
    raise exception using errcode = '40001',
      message = 'completed_current_private_assessment_refresh_required';
  end if;
  perform veroxa_private.lock_momo_source_media_v1(
    p_restaurant_id, p_expected_source_content_sha256
  );
  if veroxa_private.momo_source_media_discarded_v1(
    p_restaurant_id, p_expected_source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  -- Source is now dominant. Compatible SHARE locks and a full second
  -- validation close every mutation window before terminal evidence is read
  -- or inserted.
  select * into asset
  from public.veroxa_media_assets candidate
  where candidate.id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
  for share;
  select * into rights
  from public.veroxa_media_rights candidate
  where candidate.id = p_rights_id
    and candidate.asset_id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
  for share;
  select * into intake
  from public.veroxa_private_media_assessment_intakes_v1 candidate
  where candidate.asset_id = p_asset_id
    and candidate.restaurant_id = p_restaurant_id
    and candidate.status = 'verified'
  for share;
  if asset.id is null or rights.id is null or intake.id is null
     or asset.content_sha256 is distinct from
       p_expected_source_content_sha256
     or intake.content_sha256 is distinct from
       p_expected_source_content_sha256
     or not exists (
       select 1
       from public.veroxa_private_media_assessment_asset_links_v1 link
       join public.veroxa_private_media_assessments_v1 assessment
         on assessment.id = link.assessment_id
        and assessment.restaurant_id = link.restaurant_id
        and assessment.status = 'completed'
       where link.restaurant_id = p_restaurant_id
         and link.asset_id = p_asset_id
         and link.intake_id = intake.id
         and link.source_content_sha256 =
           p_expected_source_content_sha256
         and assessment.source_content_sha256 =
           p_expected_source_content_sha256
     ) then
    raise exception using errcode = '40001',
      message = 'completed_current_private_assessment_refresh_required';
  end if;
  if p_association = 'represents_current_restaurant_offering'
     and (
       rights.rights_status <> 'confirmed'
       or rights.evidence_class <> 'real_owner'
       or (rights.valid_from is not null
         and rights.valid_from > pg_catalog.now())
       or (rights.expires_at is not null
         and rights.expires_at <= pg_catalog.now())
     ) then
    raise exception using errcode = '40001',
      message = 'current_real_owner_media_rights_required';
  end if;

  select * into existing
  from public.veroxa_media_restaurant_associations_v1 candidate
  where candidate.restaurant_id = p_restaurant_id
    and candidate.asset_id = p_asset_id
    and candidate.rights_id = p_rights_id
    and candidate.source_content_sha256 =
      p_expected_source_content_sha256;
  if found then
    if existing.association = p_association
       and existing.note = btrim(p_note)
       and existing.recorded_by = actor_id
       and existing.evidence_class = actor_evidence_class then
      return query select existing.id,
        existing.asset_id,
        existing.association,
        existing.evidence_class,
        existing.recorded_at,
        false;
      return;
    end if;
    raise exception using errcode = '23505',
      message = 'media_restaurant_association_decision_is_terminal';
  end if;

  insert into public.veroxa_media_restaurant_associations_v1 (
    restaurant_id,
    asset_id,
    rights_id,
    source_content_sha256,
    association,
    note,
    evidence_class,
    recorded_by
  ) values (
    p_restaurant_id,
    p_asset_id,
    p_rights_id,
    p_expected_source_content_sha256,
    p_association,
    btrim(p_note),
    actor_evidence_class,
    actor_id
  ) returning * into inserted;

  -- A platform-profile JPEG was deliberately held at assessment-only during
  -- finalize. After the real owner associates it, make one safe internal
  -- advance attempt. Prerequisite failures leave the association durable and
  -- preserve the normal fail-closed retry path; no provider or external write
  -- is performed by this RPC itself.
  if p_association = 'represents_current_restaurant_offering'
     and intake.platform_ready
     and veroxa_private.media_has_current_real_owner_association_v1(
       p_restaurant_id,
       p_asset_id,
       p_rights_id,
       p_expected_source_content_sha256
     ) then
    begin
      perform veroxa_private.momo_advance_verified_asset_v2(
        pg_catalog.jsonb_build_object(
          'restaurantId', p_restaurant_id,
          'assetId', p_asset_id,
          'verificationId', intake.id,
          'actorId', actor_id
        )
      );
    exception
      when integrity_constraint_violation
        or serialization_failure
        or raise_exception
        or invalid_parameter_value
        or object_not_in_prerequisite_state then
        null;
    end;
  end if;

  return query select inserted.id,
    inserted.asset_id,
    inserted.association,
    inserted.evidence_class,
    inserted.recorded_at,
    false;
end;
$$;
revoke all on function
  public.veroxa_record_media_restaurant_association_v1(
    uuid, uuid, uuid, text, text, text
  ) from public, anon, authenticated, service_role;
grant execute on function
  public.veroxa_record_media_restaurant_association_v1(
    uuid, uuid, uuid, text, text, text
  ) to authenticated;

-- Redefine the complete private advance routine forward-only. Exact-byte
-- identity never transfers assessment, rights, or restaurant association:
-- each concrete processing candidate must independently satisfy the current
-- real-owner association predicate before canonical preference is applied.
create or replace function veroxa_private.momo_advance_verified_asset_v2(
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restaurant_id uuid;
  v_asset_id uuid;
  v_processing_asset_id uuid;
  v_verification_id uuid;
  v_preliminary_rights_id uuid;
  v_preliminary_source_hash text;
  v_actor_id uuid;
  v_asset public.veroxa_media_assets%rowtype;
  v_verification public.veroxa_momo_media_intake_verifications%rowtype;
  v_rights public.veroxa_media_rights%rowtype;
  v_canonical_rights public.veroxa_media_rights%rowtype;
  v_processing_asset public.veroxa_media_assets%rowtype;
  v_processing_verification public.veroxa_momo_media_intake_verifications%rowtype;
  v_processing_rights public.veroxa_media_rights%rowtype;
  v_identity public.veroxa_momo_media_canonical_identities_v2%rowtype;
  v_canonical_verification public.veroxa_momo_media_intake_verifications%rowtype;
  v_link public.veroxa_momo_media_asset_identity_links_v2%rowtype;
  v_existing_run public.veroxa_momo_content_ai_runs%rowtype;
  v_retry_parent public.veroxa_momo_content_ai_runs%rowtype;
  v_stale_run public.veroxa_momo_content_ai_runs%rowtype;
  v_blocking_run public.veroxa_momo_content_ai_runs%rowtype;
  v_budget veroxa_private.momo_ai_budget_controls%rowtype;
  v_truth jsonb;
  v_truth_hash text;
  v_platforms jsonb;
  v_client_request_hash text;
  v_idempotency_hash text;
  v_request_hash text;
  v_advance_hash text;
  v_retry_generation smallint := 0;
  v_attempt_hash text;
  v_attempt_snapshot jsonb;
  v_attempt_canonical text;
  v_attempt_evidence_hash text;
  v_run_id uuid;
  v_outcome text;
  v_reasons jsonb := '[]'::jsonb;
  v_duplicate boolean;
  v_exception_snapshot jsonb;
  v_exception_canonical text;
  v_exception_hash text;
begin
  if not veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
    'restaurantId','assetId','verificationId','actorId'
  ]) then
    raise exception using errcode = '22023', message = 'invalid_momo_advance_v2';
  end if;
  v_restaurant_id := (p_payload ->> 'restaurantId')::uuid;
  v_asset_id := (p_payload ->> 'assetId')::uuid;
  v_verification_id := (p_payload ->> 'verificationId')::uuid;
  v_actor_id := (p_payload ->> 'actorId')::uuid;
  if not veroxa_private.momo_actor_has_operational_membership_v1(
      v_restaurant_id, v_actor_id
    ) then
    raise exception using errcode = '42501', message = 'momo_advance_member_required_v2';
  end if;

  select * into v_asset
  from public.veroxa_media_assets asset
  where asset.id = v_asset_id and asset.restaurant_id = v_restaurant_id;
  select * into v_verification
  from public.veroxa_momo_media_intake_verifications verification
  where verification.id = v_verification_id
    and verification.asset_id = v_asset_id
    and verification.restaurant_id = v_restaurant_id
    and verification.status = 'verified';
  select * into v_rights
  from public.veroxa_media_rights rights
  where rights.asset_id = v_asset_id
    and rights.restaurant_id = v_restaurant_id;
  if v_asset.id is null or v_verification.id is null or v_rights.id is null
    or v_asset.content_sha256 is distinct from v_verification.content_sha256
    or v_asset.storage_path is distinct from v_verification.storage_path
    or v_asset.mime_type is distinct from v_verification.detected_mime_type
    or v_asset.file_size is distinct from v_verification.file_size
    or v_asset.width is distinct from v_verification.width
    or v_asset.height is distinct from v_verification.height
    or v_rights.rights_status <> 'confirmed'
    or v_rights.evidence_class <> 'real_owner'
    or v_rights.attestation_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '23514', message = 'momo_advance_evidence_invalid_v2';
  end if;
  v_preliminary_rights_id := v_rights.id;
  v_preliminary_source_hash := v_verification.content_sha256;

  perform veroxa_private.lock_momo_source_media_v1(
    v_restaurant_id, v_preliminary_source_hash
  );
  if veroxa_private.momo_source_media_discarded_v1(
    v_restaurant_id, v_preliminary_source_hash
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;

  -- Source is dominant over every row lock. Re-read and lock the exact
  -- immutable evidence only after S so Ready materialization (S -> run ->
  -- asset update) cannot deadlock with an advance that formerly held asset
  -- SHARE while waiting for S.
  select * into v_asset
  from public.veroxa_media_assets asset
  where asset.id = v_asset_id
    and asset.restaurant_id = v_restaurant_id
  for share;
  select * into v_verification
  from public.veroxa_momo_media_intake_verifications verification
  where verification.id = v_verification_id
    and verification.asset_id = v_asset_id
    and verification.restaurant_id = v_restaurant_id
    and verification.status = 'verified'
  for share;
  select * into v_rights
  from public.veroxa_media_rights rights
  where rights.id = v_preliminary_rights_id
    and rights.asset_id = v_asset_id
    and rights.restaurant_id = v_restaurant_id
  for share;
  if v_asset.id is null or v_verification.id is null or v_rights.id is null
    or v_verification.content_sha256 is distinct from
      v_preliminary_source_hash
    or v_asset.content_sha256 is distinct from v_verification.content_sha256
    or v_asset.storage_path is distinct from v_verification.storage_path
    or v_asset.mime_type is distinct from v_verification.detected_mime_type
    or v_asset.file_size is distinct from v_verification.file_size
    or v_asset.width is distinct from v_verification.width
    or v_asset.height is distinct from v_verification.height
    or v_rights.rights_status <> 'confirmed'
    or v_rights.evidence_class <> 'real_owner'
    or v_rights.attestation_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '23514',
      message = 'momo_advance_evidence_invalid_v2';
  end if;
  select * into v_identity
  from public.veroxa_momo_media_canonical_identities_v2 identity
  where identity.restaurant_id = v_restaurant_id
    and identity.content_sha256 = v_verification.content_sha256
  for update;
  if not found then
    select verification.* into v_canonical_verification
    from public.veroxa_momo_media_intake_verifications verification
    join public.veroxa_media_assets asset
      on asset.id = verification.asset_id
     and asset.restaurant_id = verification.restaurant_id
    where verification.restaurant_id = v_restaurant_id
      and verification.status = 'verified'
      and verification.content_sha256 = v_verification.content_sha256
      and asset.content_sha256 = verification.content_sha256
    order by verification.verified_at, verification.id
    limit 1
    for share of verification;
    if v_canonical_verification.id is null then
      raise exception using errcode = '23514', message = 'momo_canonical_verification_missing_v2';
    end if;
    insert into public.veroxa_momo_media_canonical_identities_v2 (
      restaurant_id, content_sha256, canonical_asset_id,
      canonical_verification_id
    ) values (
      v_restaurant_id, v_verification.content_sha256,
      v_canonical_verification.asset_id, v_canonical_verification.id
    ) returning * into v_identity;
  else
    select * into v_canonical_verification
    from public.veroxa_momo_media_intake_verifications verification
    where verification.id = v_identity.canonical_verification_id;
  end if;

  select * into v_canonical_rights
  from public.veroxa_media_rights rights
  where rights.asset_id = v_identity.canonical_asset_id
    and rights.restaurant_id = v_restaurant_id
  for share;
  if v_canonical_rights.id is null
    or v_canonical_verification.asset_id <> v_identity.canonical_asset_id
    or v_canonical_verification.content_sha256 <> v_identity.content_sha256 then
    raise exception using errcode = '23514', message = 'momo_canonical_identity_invalid_v2';
  end if;

  -- Ensure the canonical asset has an explicit self-link even when an older
  -- verified upload is first encountered through a later exact duplicate.
  insert into public.veroxa_momo_media_asset_identity_links_v2 (
    restaurant_id, identity_id, asset_id, verification_id,
    canonical_asset_id, link_kind, content_sha256, rights_id,
    rights_attestation_sha256
  ) values (
    v_restaurant_id, v_identity.id, v_identity.canonical_asset_id,
    v_identity.canonical_verification_id, v_identity.canonical_asset_id,
    'canonical', v_identity.content_sha256, v_canonical_rights.id,
    v_canonical_rights.attestation_sha256
  ) on conflict (asset_id) do nothing;

  v_duplicate := v_asset_id <> v_identity.canonical_asset_id;
  insert into public.veroxa_momo_media_asset_identity_links_v2 (
    restaurant_id, identity_id, asset_id, verification_id,
    canonical_asset_id, link_kind, content_sha256, rights_id,
    rights_attestation_sha256
  ) values (
    v_restaurant_id, v_identity.id, v_asset_id, v_verification_id,
    v_identity.canonical_asset_id,
    case when v_duplicate then 'exact_duplicate' else 'canonical' end,
    v_verification.content_sha256, v_rights.id,
    v_rights.attestation_sha256
  ) on conflict (asset_id) do nothing;
  select * into v_link
  from public.veroxa_momo_media_asset_identity_links_v2 link
  where link.asset_id = v_asset_id;
  if v_link.identity_id <> v_identity.id
    or v_link.verification_id <> v_verification_id
    or v_link.content_sha256 <> v_verification.content_sha256
    or v_link.canonical_asset_id <> v_identity.canonical_asset_id then
    raise exception using errcode = '23505', message = 'momo_identity_link_conflict_v2';
  end if;

  v_attempt_snapshot := pg_catalog.jsonb_build_object(
    'schemaVersion', 2,
    'restaurantId', v_restaurant_id,
    'assetId', v_asset_id,
    'verificationId', v_verification_id,
    'canonicalAssetId', v_identity.canonical_asset_id,
    'outcome', case when v_duplicate then 'duplicate' else 'verified' end,
    'contentSha256', v_verification.content_sha256,
    'identityMethod', 'sha256_exact_bytes'
  );
  v_attempt_canonical := veroxa_private.momo_canonical_json_v1(v_attempt_snapshot);
  v_attempt_evidence_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(v_attempt_canonical, 'UTF8'), 'sha256'
  ), 'hex');
  v_attempt_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    'momo-intake-success-v2:' || v_verification_id::text || ':' ||
      v_identity.id::text, 'UTF8'
  ), 'sha256'), 'hex');
  insert into public.veroxa_momo_media_intake_attempts_v2 (
    restaurant_id, source_asset_id, verification_id, canonical_asset_id,
    actor_id, outcome, reason_codes, evidence_snapshot, evidence_canonical,
    evidence_sha256, idempotency_sha256
  ) values (
    v_restaurant_id, v_asset_id, v_verification_id,
    v_identity.canonical_asset_id, v_actor_id,
    case when v_duplicate then 'duplicate' else 'verified' end,
    '[]'::jsonb, v_attempt_snapshot, v_attempt_canonical,
    v_attempt_evidence_hash, v_attempt_hash
  ) on conflict (restaurant_id, idempotency_sha256) do nothing;
  perform veroxa_private.momo_resolve_exceptions_v2(
    v_restaurant_id, v_asset_id, null, 'intake_verified'
  );

  if v_duplicate then
    if v_rights.usage_scope is distinct from v_canonical_rights.usage_scope
      or v_rights.valid_from is distinct from v_canonical_rights.valid_from
      or v_rights.expires_at is distinct from v_canonical_rights.expires_at
      or v_rights.rights_status is distinct from v_canonical_rights.rights_status
      or v_rights.evidence_class is distinct from v_canonical_rights.evidence_class then
      v_reasons := '["duplicate_rights_differ"]'::jsonb;
      v_exception_snapshot := pg_catalog.jsonb_build_object(
        'sourceAssetId', v_asset_id,
        'canonicalAssetId', v_identity.canonical_asset_id,
        'sourceRightsId', v_rights.id,
        'canonicalRightsId', v_canonical_rights.id,
        'contentSha256', v_identity.content_sha256,
        'authorizationPolicy', 'single_current_exact_link_rights',
        'duplicateRightsCombined', false,
        'externalWriteAllowed', false
      );
      v_exception_canonical := veroxa_private.momo_canonical_json_v1(
        pg_catalog.jsonb_build_object(
          'stage', 'rights_reconciliation',
          'policyVersion', 'momo-exact-byte-identity-2026-08-02-v2',
          'blockers', v_reasons,
          'warnings', '[]'::jsonb,
          'evidenceSnapshot', v_exception_snapshot
        )
      );
      v_exception_hash := pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(v_exception_canonical, 'UTF8'), 'sha256'
      ), 'hex');
      perform veroxa_private.momo_upsert_exception_v2(
        v_restaurant_id, v_identity.canonical_asset_id, v_asset_id, null,
        'rights_reconciliation', 'momo-exact-byte-identity-2026-08-02-v2',
        v_reasons, '[]'::jsonb, v_exception_snapshot,
        v_exception_canonical, v_exception_hash
      );
      -- A duplicate upload is independent provenance, not a permission
      -- amendment or withdrawal. Preserve both attestations, never combine or
      -- expand them. Deterministic processing-source selection below binds any
      -- run to exactly one current link and its own validated rights. The
      -- transient incident leaves immutable open/resolved events but never
      -- becomes routine Team clutter.
      perform veroxa_private.momo_resolve_exceptions_v2(
        v_restaurant_id, v_identity.canonical_asset_id, null,
        'duplicate_rights_isolated'
      );
      v_reasons := '[]'::jsonb;
    end if;
  end if;

  -- Canonical identity is permanent, but processing authorization belongs to
  -- one concrete upload. Prefer the canonical link only while its own rights
  -- remain current; otherwise choose the earliest verified exact-byte link
  -- with its own current real-owner rights. Never union permission scopes.
  select link.asset_id into v_processing_asset_id
  from public.veroxa_momo_media_asset_identity_links_v2 link
  join public.veroxa_media_assets asset
    on asset.id = link.asset_id
   and asset.restaurant_id = link.restaurant_id
  join public.veroxa_momo_media_intake_verifications verification
    on verification.id = link.verification_id
   and verification.asset_id = asset.id
   and verification.restaurant_id = asset.restaurant_id
  join public.veroxa_media_rights rights
    on rights.id = link.rights_id
   and rights.asset_id = asset.id
   and rights.restaurant_id = asset.restaurant_id
  join storage.objects object
    on object.bucket_id = 'restaurant-media'
   and object.name = verification.storage_path
   and object.id = verification.storage_object_id
  where link.identity_id = v_identity.id
    and link.restaurant_id = v_restaurant_id
    and link.canonical_asset_id = v_identity.canonical_asset_id
    and link.content_sha256 = v_identity.content_sha256
    and asset.content_sha256 = v_identity.content_sha256
    and asset.status in ('uploaded','ready_to_use')
    and verification.status = 'verified'
    and verification.content_sha256 = v_identity.content_sha256
    and object.version = verification.storage_object_version
    and coalesce(object.metadata ->> 'mimetype', '') =
      verification.detected_mime_type
    and case when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
      then (object.metadata ->> 'size')::numeric = verification.file_size::numeric
      else false end
    and rights.rights_status = 'confirmed'
    and rights.evidence_class = 'real_owner'
    and rights.attestation_version = 'momo-media-rights-v1'
    and rights.attestation_sha256 = link.rights_attestation_sha256
    and (rights.valid_from is null or rights.valid_from <= pg_catalog.now())
    and (rights.expires_at is null or rights.expires_at > pg_catalog.now())
    and veroxa_private.media_has_current_real_owner_association_v1(
      v_restaurant_id,
      link.asset_id,
      rights.id,
      v_identity.content_sha256
    )
    and exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(rights.usage_scope) use_name
      where use_name in ('facebook','instagram','google_business')
    )
  order by (link.asset_id = v_identity.canonical_asset_id) desc,
    verification.verified_at, verification.id
  limit 1;

  if v_processing_asset_id is not null then
    select * into v_processing_asset
    from public.veroxa_media_assets asset
    where asset.id = v_processing_asset_id
      and asset.restaurant_id = v_restaurant_id
    for share;
    select * into v_processing_verification
    from public.veroxa_momo_media_intake_verifications verification
    where verification.asset_id = v_processing_asset_id
      and verification.restaurant_id = v_restaurant_id
      and verification.status = 'verified'
      and verification.content_sha256 = v_identity.content_sha256
    for share;
    select * into v_processing_rights
    from public.veroxa_media_rights rights
    where rights.asset_id = v_processing_asset_id
      and rights.restaurant_id = v_restaurant_id
    for share;
  end if;

  v_truth := veroxa_private.current_momo_truth_snapshot_v1(v_restaurant_id);
  v_truth_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    v_truth::text, 'UTF8'
  ), 'sha256'), 'hex');
  select coalesce(pg_catalog.jsonb_agg(platform order by platform), '[]'::jsonb)
  into v_platforms
  from (
    select distinct value as platform
    from pg_catalog.jsonb_array_elements_text(v_processing_rights.usage_scope)
    where value in ('facebook','instagram','google_business')
  ) allowed;
  select * into v_budget
  from veroxa_private.momo_ai_budget_controls control
  where control.restaurant_id = v_restaurant_id
  for update;
  v_client_request_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to(veroxa_private.momo_canonical_json_v1(
      pg_catalog.jsonb_build_object(
        'canonicalAssetId', v_identity.canonical_asset_id,
        'processingAssetId', v_processing_asset_id,
        'model', 'gpt-5.6-sol',
        'promptVersion', 'momo-content-package-2026-08-01-v4',
        'validatorVersion', 'momo-content-validator-2026-08-01-v4',
        'budgetAuthorizerId', v_budget.authorized_by,
        'automationPolicyVersion',
          'momo-upload-veroxa-ready-2026-08-02-v2'
      )
    ), 'UTF8'), 'sha256'
  ), 'hex');
  v_request_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    pg_catalog.concat_ws('|', v_client_request_hash,
      v_identity.canonical_asset_id::text,
      v_identity.id::text, v_processing_asset_id::text,
      v_processing_verification.id::text,
      v_processing_verification.storage_object_id::text,
      v_processing_verification.storage_object_version,
      v_identity.content_sha256, v_processing_rights.id::text,
      v_processing_rights.attestation_sha256,
      v_budget.authorized_by::text, v_truth_hash, v_platforms::text,
      'automation_policy_v2'
    ), 'UTF8'
  ), 'sha256'), 'hex');
  v_idempotency_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to('momo-content-auto-v2:' || v_request_hash,
      'UTF8'), 'sha256'
  ), 'hex');

  if exists (
    select 1
    from public.veroxa_momo_ready_packages_v2 ready
    join public.veroxa_momo_content_ai_runs run
      on run.id = ready.content_ai_run_id
    where ready.restaurant_id = v_restaurant_id
      and ready.identity_id = v_identity.id
      and ready.canonical_asset_id = v_identity.canonical_asset_id
      and ready.source_asset_id = v_processing_asset_id
      and ready.status = 'veroxa_ready'
      and ready.truth_snapshot_sha256 = v_truth_hash
      and ready.rights_attestation_sha256 =
        v_processing_rights.attestation_sha256
      and run.target_platforms = v_platforms
      and v_processing_rights.rights_status = 'confirmed'
      and v_processing_rights.evidence_class = 'real_owner'
      and (v_processing_rights.valid_from is null
        or v_processing_rights.valid_from <= pg_catalog.now())
      and (v_processing_rights.expires_at is null
        or v_processing_rights.expires_at > pg_catalog.now())
  ) then
    select ready.content_ai_run_id into v_run_id
    from public.veroxa_momo_ready_packages_v2 ready
    join public.veroxa_momo_content_ai_runs run
      on run.id = ready.content_ai_run_id
    where ready.restaurant_id = v_restaurant_id
      and ready.identity_id = v_identity.id
      and ready.canonical_asset_id = v_identity.canonical_asset_id
      and ready.source_asset_id = v_processing_asset_id
      and ready.truth_snapshot_sha256 = v_truth_hash
      and ready.rights_attestation_sha256 =
        v_processing_rights.attestation_sha256
      and run.target_platforms = v_platforms
    order by ready.ready_at desc limit 1;
    v_outcome := case when v_duplicate
      then 'duplicate_reused' else 'already_ready' end;
  else
    select run.* into v_existing_run
    from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = v_restaurant_id
      and run.automation_identity_id = v_identity.id
      and run.source_asset_id = v_processing_asset_id
      and run.decision_mode = 'automation_policy_v2'
      and run.automation_policy_version =
        'momo-upload-veroxa-ready-2026-08-02-v2'
      and run.request_hash = v_request_hash
      and (
        (run.automation_retry_generation = 0
          and run.automation_retry_of_run_id is null
          and run.idempotency_hash = v_idempotency_hash)
        or (run.automation_retry_generation = 1
          and run.automation_retry_of_run_id is not null
          and run.idempotency_hash = pg_catalog.encode(extensions.digest(
            pg_catalog.convert_to(
              'momo-content-auto-v2-retry:1:' ||
                run.automation_retry_of_run_id::text || ':' || v_request_hash,
              'UTF8'
            ), 'sha256'
          ), 'hex'))
      )
      and run.status in ('reserved','provider_running','result_staged','pending_review')
      and veroxa_private.momo_content_ai_current_evidence_v1(
        run.id, v_budget.authorized_by
      )
    order by run.automation_retry_generation desc,
      run.requested_at desc, run.id desc
    limit 1;
    if v_existing_run.id is not null then
      v_run_id := v_existing_run.id;
      v_outcome := case when v_duplicate
        then 'duplicate_reused' else 'replayed' end;
    end if;
  end if;

  if v_run_id is null then
    -- Authorization, rights, or truth may change after a reservation but
    -- before a provider call. Release only pristine pre-provider attempts so
    -- the same immutable identity can recover with newly current evidence.
    for v_stale_run in
      select run.*
      from public.veroxa_momo_content_ai_runs run
      where run.restaurant_id = v_restaurant_id
        and run.automation_identity_id = v_identity.id
        and run.decision_mode = 'automation_policy_v2'
        and run.status = 'reserved'
        and not run.provider_called
        and run.provider_response_id is null
        and not veroxa_private.momo_content_ai_current_evidence_v1(
          run.id, run.requested_by
        )
      order by run.requested_at, run.id
      for update skip locked
    loop
      perform public.veroxa_fail_momo_content_ai_run_v1(
        v_stale_run.id, v_stale_run.request_hash, null,
        'automation_evidence_superseded', false, null, null,
        v_stale_run.requested_by
      );
    end loop;

    select run.* into v_blocking_run
    from public.veroxa_momo_content_ai_runs run
    where run.restaurant_id = v_restaurant_id
      and run.automation_identity_id = v_identity.id
      and run.decision_mode = 'automation_policy_v2'
      and (
        run.status in ('reserved','provider_running','result_staged')
        or (run.status = 'pending_review'
          and not exists (
            select 1
            from public.veroxa_momo_ready_packages_v2 ready
            where ready.content_ai_run_id = run.id
          ))
      )
    order by run.requested_at, run.id
    limit 1;
    if v_blocking_run.id is not null then
      v_run_id := v_blocking_run.id;
      v_outcome := 'exception';
      v_reasons := '["automation_identity_run_in_flight"]'::jsonb;
      v_exception_snapshot := pg_catalog.jsonb_build_object(
        'canonicalAssetId', v_identity.canonical_asset_id,
        'processingAssetId', v_processing_asset_id,
        'blockingRunId', v_blocking_run.id,
        'blockingRunStatus', v_blocking_run.status,
        'providerCalled', v_blocking_run.provider_called
      );
      v_exception_canonical := veroxa_private.momo_canonical_json_v1(
        pg_catalog.jsonb_build_object(
          'stage', 'automation_reservation',
          'policyVersion', 'momo-upload-veroxa-ready-2026-08-02-v2',
          'blockers', v_reasons,
          'warnings', '[]'::jsonb,
          'evidenceSnapshot', v_exception_snapshot
        )
      );
      v_exception_hash := pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(v_exception_canonical, 'UTF8'), 'sha256'
      ), 'hex');
      perform veroxa_private.momo_upsert_exception_v2(
        v_restaurant_id, v_identity.canonical_asset_id,
        v_blocking_run.source_asset_id, v_blocking_run.id,
        'automation_reservation',
        'momo-upload-veroxa-ready-2026-08-02-v2', v_reasons,
        '[]'::jsonb, v_exception_snapshot, v_exception_canonical,
        v_exception_hash
      );
    end if;
  end if;

  if v_run_id is null then
    if v_processing_asset_id is null
      or v_processing_verification.id is null
      or v_processing_rights.id is null
      or v_processing_rights.rights_status <> 'confirmed'
      or v_processing_rights.evidence_class <> 'real_owner'
      or v_processing_rights.attestation_version <>
        'momo-media-rights-v1'
      or v_processing_rights.attestation_sha256 !~ '^[0-9a-f]{64}$'
      or (v_processing_rights.valid_from is not null
        and v_processing_rights.valid_from > pg_catalog.now())
      or (v_processing_rights.expires_at is not null
        and v_processing_rights.expires_at <= pg_catalog.now())
      or pg_catalog.jsonb_array_length(v_platforms) = 0
      or pg_catalog.jsonb_array_length(v_truth) < 4
      or pg_catalog.octet_length(v_truth::text) > 32768
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'identity.display_name')
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'address.primary')
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'identity.cuisine')
      or not exists (select 1 from pg_catalog.jsonb_array_elements(v_truth) field where field ->> 'fieldKey' = 'menu.primary')
      or v_budget.restaurant_id is null or not v_budget.enabled
      or v_budget.external_publishing_authorized
      or not exists (
        select 1
        from public.veroxa_restaurant_members member
        join public.veroxa_user_profiles profile
          on profile.user_id = member.user_id
        where member.restaurant_id = v_restaurant_id
          and member.user_id = v_budget.authorized_by
          and member.role = 'team' and member.status = 'active'
          and profile.role = 'team' and profile.status = 'active'
      )
      or veroxa_private.momo_ai_committed_microusd_v1(v_restaurant_id)
        + 6000000 > v_budget.authorization_cap_microusd
      or not exists (
        select 1 from public.veroxa_momo_runtime_controls runtime
        where runtime.restaurant_id = v_restaurant_id
          and runtime.ai_live_calls
          and not runtime.provider_writes and not runtime.review_replies
          and not runtime.website_writes and not runtime.external_scheduling
      ) then
      v_reasons := '["automation_evidence_or_budget_unavailable"]'::jsonb;
      v_outcome := 'exception';
      v_exception_snapshot := pg_catalog.jsonb_build_object(
        'canonicalAssetId', v_identity.canonical_asset_id,
        'processingAssetId', v_processing_asset_id,
        'verificationId', v_processing_verification.id,
        'budgetAuthorizerId', v_budget.authorized_by,
        'truthSnapshotSha256', v_truth_hash,
        'platformCount', pg_catalog.jsonb_array_length(v_platforms),
        'runtimeExternalWritesRequired', false
      );
      v_exception_canonical := veroxa_private.momo_canonical_json_v1(
        pg_catalog.jsonb_build_object(
          'stage', 'automation_reservation',
          'policyVersion', 'momo-upload-veroxa-ready-2026-08-02-v2',
          'blockers', v_reasons,
          'warnings', '[]'::jsonb,
          'evidenceSnapshot', v_exception_snapshot
        )
      );
      v_exception_hash := pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(v_exception_canonical, 'UTF8'), 'sha256'
      ), 'hex');
      perform veroxa_private.momo_upsert_exception_v2(
        v_restaurant_id, v_identity.canonical_asset_id,
        coalesce(v_processing_asset_id, v_asset_id), null,
        'automation_reservation',
        'momo-upload-veroxa-ready-2026-08-02-v2', v_reasons, '[]'::jsonb,
        v_exception_snapshot, v_exception_canonical, v_exception_hash
      );
    else
      -- The reservation identity was bound above before every replay lookup.
      select run.* into v_existing_run
      from public.veroxa_momo_content_ai_runs run
      where run.restaurant_id = v_restaurant_id
        and run.idempotency_hash = v_idempotency_hash
      for update;
      if v_existing_run.id is not null then
        if v_existing_run.request_hash is distinct from v_request_hash
          or v_existing_run.automation_identity_id is distinct from v_identity.id
          or v_existing_run.source_asset_id is distinct from v_processing_asset_id
          or v_existing_run.rights_id is distinct from v_processing_rights.id
          or v_existing_run.rights_attestation_sha256 is distinct from
            v_processing_rights.attestation_sha256
          or v_existing_run.target_platforms is distinct from v_platforms
          or v_existing_run.truth_snapshot_sha256 is distinct from v_truth_hash
          or v_existing_run.decision_mode <> 'automation_policy_v2'
          or v_existing_run.requested_by is distinct from
            v_budget.authorized_by
          or v_existing_run.automation_retry_generation <> 0
          or v_existing_run.automation_retry_of_run_id is not null then
          raise exception using errcode = '23505',
            message = 'momo_automation_idempotency_conflict_v2';
        end if;

        if v_existing_run.status = 'failed'
          and veroxa_private.momo_content_ai_safe_retry_parent_v2(
            v_existing_run.id, v_restaurant_id, v_identity.id,
            v_request_hash, v_budget.authorized_by
          ) then
          -- One new generation is allowed only from the fully released,
          -- provably pre-provider parent above. Its key is deterministic so an
          -- exact concurrent/replayed recovery cannot create another child.
          v_retry_parent := v_existing_run;
          v_retry_generation := 1;
          v_idempotency_hash := pg_catalog.encode(extensions.digest(
            pg_catalog.convert_to(
              'momo-content-auto-v2-retry:1:' || v_retry_parent.id::text || ':' ||
                v_request_hash,
              'UTF8'
            ), 'sha256'
          ), 'hex');
          select run.* into v_existing_run
          from public.veroxa_momo_content_ai_runs run
          where run.restaurant_id = v_restaurant_id
            and run.idempotency_hash = v_idempotency_hash
          for update;
          if v_existing_run.id is not null then
            if v_existing_run.request_hash is distinct from v_request_hash
              or v_existing_run.automation_identity_id is distinct from
                v_identity.id
              or v_existing_run.source_asset_id is distinct from
                v_processing_asset_id
              or v_existing_run.rights_id is distinct from
                v_processing_rights.id
              or v_existing_run.rights_attestation_sha256 is distinct from
                v_processing_rights.attestation_sha256
              or v_existing_run.target_platforms is distinct from v_platforms
              or v_existing_run.truth_snapshot_sha256 is distinct from
                v_truth_hash
              or v_existing_run.decision_mode <> 'automation_policy_v2'
              or v_existing_run.requested_by is distinct from
                v_budget.authorized_by
              or v_existing_run.automation_retry_generation <>
                v_retry_generation
              or v_existing_run.automation_retry_of_run_id is distinct from
                v_retry_parent.id then
              raise exception using errcode = '23505',
                message = 'momo_automation_retry_idempotency_conflict_v2';
            end if;
            v_run_id := v_existing_run.id;
            v_outcome := case when v_existing_run.status = 'failed'
              then 'exception' else 'replayed' end;
            if v_existing_run.status = 'failed' then
              v_reasons := pg_catalog.jsonb_build_array(coalesce(
                v_existing_run.provider_error_code,
                'previous_automation_retry_failed'
              ));
            end if;
          end if;
        else
          -- A provider-called, response-bearing, send-intent, uncertain, or
          -- already retried failure is immutable and never regenerated.
          v_run_id := v_existing_run.id;
          v_outcome := case when v_existing_run.status = 'failed'
            then 'exception' else 'replayed' end;
          if v_existing_run.status = 'failed' then
            v_reasons := pg_catalog.jsonb_build_array(
              coalesce(v_existing_run.provider_error_code,
                'previous_automation_failed')
            );
          end if;
        end if;
      end if;

      if v_run_id is null then
        insert into public.veroxa_momo_content_ai_runs (
        restaurant_id, source_asset_id, intake_verification_id,
        source_storage_path, source_storage_object_id,
        source_storage_object_version, source_mime_type, source_file_size,
        source_width, source_height, source_content_sha256, rights_id,
        rights_attestation_sha256, review_id, truth_snapshot,
        truth_snapshot_sha256, target_platforms, model, reasoning_effort,
        prompt_version, schema_version, validator_version, pricing_version,
        idempotency_hash, client_request_hash, request_hash, requested_by,
        reserved_microusd, reservation_lease_expires_at, decision_mode,
        automation_policy_version, automation_identity_id,
        automation_initiated_by, automation_retry_of_run_id,
        automation_retry_generation
      ) values (
        v_restaurant_id, v_processing_asset_id,
        v_processing_verification.id,
        v_processing_verification.storage_path,
        v_processing_verification.storage_object_id,
        v_processing_verification.storage_object_version,
        v_processing_verification.detected_mime_type,
        v_processing_verification.file_size, v_processing_verification.width,
        v_processing_verification.height,
        v_processing_verification.content_sha256,
        v_processing_rights.id, v_processing_rights.attestation_sha256, null,
        v_truth, v_truth_hash, v_platforms, 'gpt-5.6-sol', 'high',
        'momo-content-package-2026-08-01-v4', 'momo-content-package-v1',
        'momo-content-validator-2026-08-01-v4',
        'openai-gpt-5.6-sol-2026-08-01-v2', v_idempotency_hash,
        v_client_request_hash, v_request_hash, v_budget.authorized_by, 6000000,
        pg_catalog.clock_timestamp() + interval '15 minutes',
        'automation_policy_v2', 'momo-upload-veroxa-ready-2026-08-02-v2',
        v_identity.id, v_actor_id, v_retry_parent.id, v_retry_generation
        ) returning id into v_run_id;
        insert into veroxa_private.momo_ai_cost_ledger (
          restaurant_id, operation_kind, source_id, idempotency_hash,
          state, provider_called, reserved_microusd
        ) values (
          v_restaurant_id, 'content_package', v_run_id, v_idempotency_hash,
          'reserved', false, 6000000
        );
        v_outcome := 'queued';
      end if;
    end if;
  end if;

  if v_outcome is null then
    raise exception using errcode = '23514',
      message = 'momo_advance_outcome_missing_v2';
  end if;
  -- Idempotency belongs to the immutable transition, not merely the request.
  -- Thus an exception that later recovers to a concrete queued run appends new
  -- evidence, while the exact same outcome/run/reason replay remains a no-op.
  v_advance_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    'momo-advance-transition-v2:' ||
      veroxa_private.momo_canonical_json_v1(pg_catalog.jsonb_build_object(
        'verificationId', v_verification_id,
        'identityId', v_identity.id,
        'actorId', v_actor_id,
        'requestHash', v_request_hash,
        'outcome', v_outcome,
        'runId', v_run_id,
        'reasonCodes', v_reasons
      )),
    'UTF8'
  ), 'sha256'), 'hex');

  insert into public.veroxa_momo_automation_advances_v2 (
    restaurant_id, identity_id, source_asset_id, actor_id,
    processing_asset_id,
    canonical_asset_id,
    intake_verification_id, content_ai_run_id, outcome, reason_codes,
    policy_version, idempotency_sha256
  ) values (
    v_restaurant_id, v_identity.id, v_asset_id, v_actor_id,
    v_processing_asset_id,
    v_identity.canonical_asset_id, v_verification_id, v_run_id,
    v_outcome, v_reasons, 'momo-upload-veroxa-ready-2026-08-02-v2',
    v_advance_hash
  ) on conflict (restaurant_id, idempotency_sha256) do nothing;

  return pg_catalog.jsonb_build_object(
    'verificationId', v_verification_id,
    'status', case when v_duplicate then 'duplicate' else 'verified' end,
    'canonicalAssetId', v_identity.canonical_asset_id,
    'duplicateAssetId', case when v_duplicate then v_asset_id else null end
  );
end;
$$;
revoke all on function veroxa_private.momo_advance_verified_asset_v2(jsonb)
  from public, anon, authenticated, service_role;

-- Dispatch, recovery, validation, and Ready materialization all share this
-- current-evidence predicate. The association is an additional independent
-- requirement; it does not replace current rights, bytes, truth, or Team
-- budget authority.
create or replace function
  veroxa_private.momo_content_ai_current_evidence_v1(
    p_run_id uuid,
    p_actor_id uuid
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.veroxa_momo_content_ai_runs run
    join public.veroxa_media_assets asset
      on asset.id = run.source_asset_id
     and asset.restaurant_id = run.restaurant_id
    join public.veroxa_momo_media_intake_verifications intake
      on intake.id = run.intake_verification_id
     and intake.asset_id = asset.id
    join public.veroxa_media_rights rights
      on rights.id = run.rights_id
     and rights.asset_id = asset.id
    left join public.veroxa_media_reviews review
      on review.id = run.review_id
     and review.asset_id = asset.id
    join storage.objects object
      on object.bucket_id = 'restaurant-media'
     and object.name = run.source_storage_path
     and object.id = run.source_storage_object_id
    where run.id = p_run_id
      and (
        (
          run.decision_mode = 'team_review_v1'
          and veroxa_private.momo_media_ai_actor_has_operational_team_v1(
            run.restaurant_id, p_actor_id
          )
          and asset.status = 'ready_to_use'
          and review.is_current
          and review.status = 'approved'
          and review.public_use_approved
          and review.quality_score between 80 and 100
          and review.reviewed_by is not null
          and review.reviewed_at is not null
          and pg_catalog.char_length(pg_catalog.btrim(
            coalesce(review.quality_notes, '')
          )) >= 10
        ) or (
          run.decision_mode = 'automation_policy_v2'
          and run.automation_policy_version =
            'momo-upload-veroxa-ready-2026-08-02-v2'
          and run.review_id is null
          and run.automation_identity_id is not null
          and run.automation_initiated_by is not null
          and asset.status in ('uploaded', 'ready_to_use')
          and p_actor_id = run.requested_by
          and veroxa_private.momo_media_ai_actor_has_operational_team_v1(
            run.restaurant_id, p_actor_id
          )
          and exists (
            select 1
            from veroxa_private.momo_ai_budget_controls budget
            where budget.restaurant_id = run.restaurant_id
              and budget.enabled
              and not budget.external_publishing_authorized
              and budget.authorized_by = run.requested_by
          )
          and exists (
            select 1
            from public.veroxa_momo_media_canonical_identities_v2 identity
            join public.veroxa_momo_media_asset_identity_links_v2 link
              on link.identity_id = identity.id
             and link.asset_id = run.source_asset_id
             and link.verification_id = run.intake_verification_id
             and link.rights_id = run.rights_id
             and link.rights_attestation_sha256 =
               run.rights_attestation_sha256
            where identity.id = run.automation_identity_id
              and identity.restaurant_id = run.restaurant_id
              and identity.content_sha256 = run.source_content_sha256
          )
        )
      )
      and asset.content_sha256 = run.source_content_sha256
      and asset.storage_path = run.source_storage_path
      and asset.mime_type = run.source_mime_type
      and asset.file_size = run.source_file_size
      and asset.width = run.source_width
      and asset.height = run.source_height
      and run.source_mime_type = 'image/jpeg'
      and run.source_file_size between 10240 and 5242880
      and run.source_width between 320 and 12000
      and run.source_height between 250 and 12000
      and run.source_width::numeric / run.source_height::numeric
        between 0.8 and 1.91
      and intake.status = 'verified'
      and intake.storage_path = run.source_storage_path
      and intake.storage_object_id = run.source_storage_object_id
      and intake.storage_object_version = run.source_storage_object_version
      and intake.detected_mime_type = run.source_mime_type
      and intake.file_size = run.source_file_size
      and intake.width = run.source_width
      and intake.height = run.source_height
      and intake.content_sha256 = run.source_content_sha256
      and object.version = run.source_storage_object_version
      and coalesce(object.metadata ->> 'mimetype', '') = run.source_mime_type
      and case
        when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]{1,30}$'
        then (object.metadata ->> 'size')::numeric =
          run.source_file_size::numeric
        else false
      end
      and rights.rights_status = 'confirmed'
      and rights.evidence_class = 'real_owner'
      and rights.attestation_sha256 = run.rights_attestation_sha256
      and (rights.valid_from is null
        or rights.valid_from <= pg_catalog.now())
      and (rights.expires_at is null
        or rights.expires_at > pg_catalog.now())
      and run.target_platforms <@ rights.usage_scope
      and run.truth_snapshot_sha256 = pg_catalog.encode(extensions.digest(
        pg_catalog.convert_to(
          veroxa_private.current_momo_truth_snapshot_v1(
            run.restaurant_id
          )::text,
          'UTF8'
        ), 'sha256'
      ), 'hex')
      and not veroxa_private.momo_source_media_discarded_v1(
        run.restaurant_id, run.source_content_sha256
      )
      and veroxa_private.media_has_current_real_owner_association_v1(
        run.restaurant_id,
        run.source_asset_id,
        run.rights_id,
        run.source_content_sha256
      )
  );
$$;
revoke all on function
  veroxa_private.momo_content_ai_current_evidence_v1(uuid, uuid)
  from public, anon, authenticated, service_role;

create or replace function
  veroxa_private.guard_momo_content_run_association_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform veroxa_private.lock_momo_source_media_v1(
    new.restaurant_id, new.source_content_sha256
  );
  if veroxa_private.momo_source_media_discarded_v1(
    new.restaurant_id, new.source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;
  if not veroxa_private.media_has_current_real_owner_association_v1(
    new.restaurant_id,
    new.source_asset_id,
    new.rights_id,
    new.source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'momo_content_requires_current_real_owner_restaurant_association';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_run_association_v1()
  from public, anon, authenticated, service_role;
create trigger aa_veroxa_momo_content_run_association_guard_v1
before insert on public.veroxa_momo_content_ai_runs
for each row execute function
  veroxa_private.guard_momo_content_run_association_v1();

-- Serialize the actual content-provider start with source discard. This
-- guards every dispatch path, including the private outbox wrapper, without
-- weakening its existing lease and claim-token controls.
create or replace function
  veroxa_private.guard_momo_content_provider_start_discard_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'reserved'
     and not old.provider_called
     and new.status = 'provider_running'
     and new.provider_called then
    perform veroxa_private.lock_momo_source_media_v1(
      new.restaurant_id, new.source_content_sha256
    );
    if veroxa_private.momo_source_media_discarded_v1(
      new.restaurant_id, new.source_content_sha256
    ) then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_content_provider_start_discard_v1()
  from public, anon, authenticated, service_role;
create trigger aa_veroxa_momo_content_provider_start_discard_guard_v1
before update of status, provider_called
on public.veroxa_momo_content_ai_runs
for each row execute function
  veroxa_private.guard_momo_content_provider_start_discard_v1();

create or replace function
  veroxa_private.guard_momo_ready_association_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform veroxa_private.lock_momo_source_media_v1(
    new.restaurant_id, new.source_content_sha256
  );
  if veroxa_private.momo_source_media_discarded_v1(
    new.restaurant_id, new.source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;
  if not veroxa_private.media_has_current_real_owner_association_v1(
    new.restaurant_id,
    new.source_asset_id,
    new.rights_id,
    new.source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'momo_ready_requires_current_real_owner_restaurant_association';
  end if;
  return new;
end;
$$;
revoke all on function
  veroxa_private.guard_momo_ready_association_v1()
  from public, anon, authenticated, service_role;
create trigger aa_veroxa_momo_ready_association_guard_v1
before insert on public.veroxa_momo_ready_packages_v2
for each row execute function
  veroxa_private.guard_momo_ready_association_v1();

-- ---------------------------------------------------------------------------
-- Global source-first lock order for content reservation and materialization
-- ---------------------------------------------------------------------------

-- Manual Team reservation formerly acquired the tenant budget row before its
-- INSERT reached the source-discard trigger. The wrapper resolves immutable
-- source identity without a row lock, takes source first, and only then enters
-- the preserved implementation (run rows -> budget -> INSERT).
alter function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid, uuid, text, text, text
) rename to veroxa_reserve_momo_content_ai_run_pre_source_lock_v1;
revoke all on function
  public.veroxa_reserve_momo_content_ai_run_pre_source_lock_v1(
    uuid, uuid, text, text, text
  ) from public, anon, authenticated, service_role;

create or replace function public.veroxa_reserve_momo_content_ai_run_v1(
  p_restaurant_id uuid,
  p_source_asset_id uuid,
  p_idempotency_hash text,
  p_client_request_hash text,
  p_recovery_response_id text
)
returns table (
  run_id uuid,
  run_status text,
  request_hash text,
  source_storage_path text,
  source_mime_type text,
  source_file_size bigint,
  source_content_sha256 text,
  source_width integer,
  source_height integer,
  target_platforms jsonb,
  truth_snapshot jsonb,
  truth_snapshot_sha256 text,
  reserved_microusd bigint,
  provider_response_id text,
  output_payload jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  source_hash text;
begin
  if actor_id is null
     or not public.veroxa_current_user_is_team_for_restaurant(
       p_restaurant_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_team_required';
  end if;

  select run.source_content_sha256 into source_hash
  from public.veroxa_momo_content_ai_runs run
  where run.restaurant_id = p_restaurant_id
    and run.idempotency_hash = p_idempotency_hash
    and run.source_asset_id = p_source_asset_id
    and run.client_request_hash = p_client_request_hash;
  if not found then
    select intake.content_sha256 into source_hash
    from public.veroxa_media_assets asset
    join public.veroxa_momo_media_intake_verifications intake
      on intake.asset_id = asset.id
     and intake.restaurant_id = asset.restaurant_id
     and intake.status = 'verified'
     and intake.content_sha256 = asset.content_sha256
    where asset.id = p_source_asset_id
      and asset.restaurant_id = p_restaurant_id;
  end if;
  if coalesce(source_hash ~ '^[0-9a-f]{64}$', false) then
    perform veroxa_private.lock_momo_source_media_v1(
      p_restaurant_id, source_hash
    );
    if veroxa_private.momo_source_media_discarded_v1(
      p_restaurant_id, source_hash
    ) then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
  end if;

  return query
  select reserved.run_id,
    reserved.run_status,
    reserved.request_hash,
    reserved.source_storage_path,
    reserved.source_mime_type,
    reserved.source_file_size,
    reserved.source_content_sha256,
    reserved.source_width,
    reserved.source_height,
    reserved.target_platforms,
    reserved.truth_snapshot,
    reserved.truth_snapshot_sha256,
    reserved.reserved_microusd,
    reserved.provider_response_id,
    reserved.output_payload
  from public.veroxa_reserve_momo_content_ai_run_pre_source_lock_v1(
    p_restaurant_id,
    p_source_asset_id,
    p_idempotency_hash,
    p_client_request_hash,
    p_recovery_response_id
  ) reserved;
end;
$$;
revoke all on function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid, uuid, text, text, text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_reserve_momo_content_ai_run_v1(
  uuid, uuid, text, text, text
) to authenticated;

-- Both the direct start routine and the dispatch-begin routine previously
-- owned a run row before the start UPDATE reached the source guard. The two
-- wrappers acquire source from a nonlocking immutable read before either run
-- or outbox ownership is taken.
alter function public.veroxa_start_momo_content_ai_run_v1(
  uuid, text, uuid, uuid
) rename to veroxa_start_momo_content_ai_run_pre_source_lock_v1;
revoke all on function
  public.veroxa_start_momo_content_ai_run_pre_source_lock_v1(
    uuid, text, uuid, uuid
  ) from public, anon, authenticated, service_role;

create or replace function public.veroxa_start_momo_content_ai_run_v1(
  p_run_id uuid,
  p_request_hash text,
  p_actor_id uuid,
  p_dispatch_claim_token uuid
)
returns table (run_id uuid, should_call boolean, run_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  preliminary public.veroxa_momo_content_ai_runs%rowtype;
begin
  if p_dispatch_claim_token is null
     or p_dispatch_claim_token =
       '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception using errcode = '22023',
      message = 'momo_content_ai_dispatch_claim_invalid';
  end if;
  select * into preliminary
  from public.veroxa_momo_content_ai_runs run
  where run.id = p_run_id;
  if not found
     or preliminary.request_hash is distinct from p_request_hash
     or not veroxa_private.momo_media_ai_actor_has_operational_team_v1(
       preliminary.restaurant_id, p_actor_id
     ) then
    raise exception using errcode = '42501',
      message = 'momo_content_ai_lifecycle_rejected';
  end if;
  perform veroxa_private.lock_momo_source_media_v1(
    preliminary.restaurant_id, preliminary.source_content_sha256
  );
  if veroxa_private.momo_source_media_discarded_v1(
    preliminary.restaurant_id, preliminary.source_content_sha256
  ) then
    raise exception using errcode = '23514',
      message = 'source_media_discarded_terminal';
  end if;
  return query
  select started.run_id, started.should_call, started.run_status
  from public.veroxa_start_momo_content_ai_run_pre_source_lock_v1(
    p_run_id, p_request_hash, p_actor_id, p_dispatch_claim_token
  ) started;
end;
$$;
revoke all on function public.veroxa_start_momo_content_ai_run_v1(
  uuid, text, uuid, uuid
) from public, anon, authenticated, service_role;

alter function public.veroxa_begin_momo_content_ai_dispatch_v1(
  uuid, text, uuid, uuid, text
) rename to veroxa_begin_momo_content_ai_dispatch_pre_source_lock_v1;
revoke all on function
  public.veroxa_begin_momo_content_ai_dispatch_pre_source_lock_v1(
    uuid, text, uuid, uuid, text
  ) from public, anon, authenticated, service_role;

create or replace function public.veroxa_begin_momo_content_ai_dispatch_v1(
  p_run_id uuid,
  p_request_hash text,
  p_lease_token uuid,
  p_dispatch_claim_token uuid,
  p_provider_request_sha256 text
)
returns table (run_id uuid, should_call boolean, run_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  preliminary public.veroxa_momo_content_ai_runs%rowtype;
begin
  if p_lease_token is null
     or p_lease_token =
       '00000000-0000-0000-0000-000000000000'::uuid
     or p_dispatch_claim_token is null
     or p_dispatch_claim_token =
       '00000000-0000-0000-0000-000000000000'::uuid
     or p_provider_request_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023',
      message = 'momo_content_ai_dispatch_begin_invalid';
  end if;
  select * into preliminary
  from public.veroxa_momo_content_ai_runs run
  where run.id = p_run_id
    and run.request_hash = p_request_hash;
  if found then
    perform veroxa_private.lock_momo_source_media_v1(
      preliminary.restaurant_id, preliminary.source_content_sha256
    );
    if veroxa_private.momo_source_media_discarded_v1(
      preliminary.restaurant_id, preliminary.source_content_sha256
    ) then
      raise exception using errcode = '23514',
        message = 'source_media_discarded_terminal';
    end if;
  end if;
  return query
  select started.run_id, started.should_call, started.run_status
  from public.veroxa_begin_momo_content_ai_dispatch_pre_source_lock_v1(
    p_run_id,
    p_request_hash,
    p_lease_token,
    p_dispatch_claim_token,
    p_provider_request_sha256
  ) started;
end;
$$;
revoke all on function public.veroxa_begin_momo_content_ai_dispatch_v1(
  uuid, text, uuid, uuid, text
) from public, anon, authenticated, service_role;
grant execute on function public.veroxa_begin_momo_content_ai_dispatch_v1(
  uuid, text, uuid, uuid, text
) to service_role;

-- Ready materialization now resolves run identity without locking, acquires
-- source, and only then delegates to the preserved run-FOR-UPDATE routine.
alter function veroxa_private.momo_materialize_veroxa_ready_v2(jsonb)
  rename to momo_materialize_veroxa_ready_pre_source_lock_v2;
revoke all on function
  veroxa_private.momo_materialize_veroxa_ready_pre_source_lock_v2(jsonb)
  from public, anon, authenticated, service_role;

create or replace function veroxa_private.momo_materialize_veroxa_ready_v2(
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run_id uuid;
  v_request_hash text;
  preliminary public.veroxa_momo_content_ai_runs%rowtype;
begin
  if veroxa_private.momo_jsonb_exact_keys_v2(
    p_payload, array['runId', 'requestHash']
  ) then
    v_run_id := (p_payload ->> 'runId')::uuid;
    v_request_hash := p_payload ->> 'requestHash';
    select * into preliminary
    from public.veroxa_momo_content_ai_runs run
    where run.id = v_run_id
      and run.request_hash = v_request_hash;
    if found then
      perform veroxa_private.lock_momo_source_media_v1(
        preliminary.restaurant_id, preliminary.source_content_sha256
      );
      if veroxa_private.momo_source_media_discarded_v1(
        preliminary.restaurant_id, preliminary.source_content_sha256
      ) then
        raise exception using errcode = '23514',
          message = 'source_media_discarded_terminal';
      end if;
    end if;
  end if;
  return veroxa_private.momo_materialize_veroxa_ready_pre_source_lock_v2(
    p_payload
  );
end;
$$;
revoke all on function
  veroxa_private.momo_materialize_veroxa_ready_v2(jsonb)
  from public, anon, authenticated, service_role;

-- Intercept only the immediate finalize-time advance. Until private assessment
-- and exact real-owner association are complete, return the existing verified
-- response shape so upload UX succeeds without starting Momo content work.
alter function public.veroxa_momo_upload_pipeline_v2(text, jsonb)
  rename to veroxa_momo_upload_pipeline_pre_private_assessment_v2;
revoke all on function
  public.veroxa_momo_upload_pipeline_pre_private_assessment_v2(text, jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.veroxa_momo_upload_pipeline_v2(
  p_operation text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  restaurant_id uuid;
  asset_id uuid;
  verification_id uuid;
  intake public.veroxa_private_media_assessment_intakes_v1%rowtype;
begin
  if p_operation = 'advance_verified_asset'
     and veroxa_private.momo_jsonb_exact_keys_v2(p_payload, array[
       'restaurantId', 'assetId', 'verificationId', 'actorId'
     ]) then
    restaurant_id := (p_payload ->> 'restaurantId')::uuid;
    asset_id := (p_payload ->> 'assetId')::uuid;
    verification_id := (p_payload ->> 'verificationId')::uuid;
    select * into intake
    from public.veroxa_private_media_assessment_intakes_v1 candidate
    where candidate.id = verification_id
      and candidate.restaurant_id = restaurant_id
      and candidate.asset_id = asset_id
      and candidate.status = 'verified';
    if intake.id is null
       or not intake.platform_ready
       or veroxa_private.momo_source_media_discarded_v1(
         restaurant_id, intake.content_sha256
       )
       or not exists (
         select 1
         from public.veroxa_private_media_assessment_asset_links_v1 link
         join public.veroxa_private_media_assessments_v1 assessment
           on assessment.id = link.assessment_id
          and assessment.restaurant_id = link.restaurant_id
          and assessment.status = 'completed'
         where link.restaurant_id = restaurant_id
           and link.asset_id = asset_id
           and link.intake_id = verification_id
           and link.source_content_sha256 = intake.content_sha256
           and assessment.source_content_sha256 = intake.content_sha256
       )
       or not exists (
         select 1
         from public.veroxa_media_rights rights
         where rights.restaurant_id = restaurant_id
           and rights.asset_id = asset_id
           and veroxa_private.media_has_current_real_owner_association_v1(
             restaurant_id,
             asset_id,
             rights.id,
             intake.content_sha256
           )
       ) then
      return pg_catalog.jsonb_build_object(
        'verificationId', verification_id,
        'status', 'verified',
        'canonicalAssetId', asset_id,
        'duplicateAssetId', null::uuid
      );
    end if;
  end if;
  return public.veroxa_momo_upload_pipeline_pre_private_assessment_v2(
    p_operation, p_payload
  );
exception
  when invalid_text_representation or numeric_value_out_of_range then
    raise exception using errcode = '22023',
      message = 'invalid_momo_upload_pipeline_payload_v2';
end;
$$;
revoke all on function public.veroxa_momo_upload_pipeline_v2(text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_upload_pipeline_v2(text, jsonb)
  to service_role;

create or replace function public.veroxa_momo_client_upload_status_v4(
  p_restaurant_id uuid
)
returns table (
  asset_id uuid,
  verification_status text,
  pipeline_status text,
  is_exact_duplicate boolean,
  attention_reasons jsonb,
  external_write_allowed boolean,
  source_content_sha256 text,
  platform_ready boolean,
  private_assessment_status text,
  private_assessment jsonb,
  assessment_reused_from_id uuid,
  restaurant_association text,
  association_evidence_class text,
  association_id uuid,
  association_recorded_at timestamptz,
  source_media_discarded boolean,
  source_media_discarded_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not veroxa_private.momo_actor_has_operational_membership_v1(
    p_restaurant_id, (select auth.uid())
  ) then
    raise exception using errcode = '42501',
      message = 'momo_client_upload_status_access_required_v4';
  end if;

  return query
  select base.asset_id,
    base.verification_status,
    case
      when source_discard.id is not null then 'verified'
      when base.pipeline_status = 'veroxa_ready'
       and not coalesce(displayed_ready.current_evidence, false)
        then 'verified'
      when displayed_ready.disposition = 'discarded'
        then 'verified'
      else base.pipeline_status
    end,
    base.is_exact_duplicate,
    case when source_discard.id is not null
      then '[]'::jsonb else base.attention_reasons end,
    false,
    coalesce(intake.content_sha256, asset.content_sha256),
    coalesce(intake.platform_ready, strict_intake.id is not null, false),
    assessment.status,
    case when assessment.status = 'completed'
      then assessment.output_payload else null end,
    case when assessment.status = 'completed'
      then assessment_link.reused_from_assessment_id else null end,
    association.association,
    association.evidence_class,
    association.id,
    association.recorded_at,
    source_discard.id is not null,
    source_discard.recorded_at
  from public.veroxa_momo_client_upload_status_v3(p_restaurant_id) base
  join public.veroxa_media_assets asset
    on asset.id = base.asset_id
   and asset.restaurant_id = p_restaurant_id
  left join lateral (
    select candidate.*
    from public.veroxa_private_media_assessment_intakes_v1 candidate
    where candidate.restaurant_id = p_restaurant_id
      and candidate.asset_id = asset.id
      and candidate.status = 'verified'
    limit 1
  ) intake on true
  left join lateral (
    select candidate.id
    from public.veroxa_momo_media_intake_verifications candidate
    where candidate.restaurant_id = p_restaurant_id
      and candidate.asset_id = asset.id
      and candidate.status = 'verified'
    order by candidate.verified_at desc, candidate.id desc
    limit 1
  ) strict_intake on true
  left join lateral (
    select candidate.*
    from public.veroxa_private_media_assessment_asset_links_v1 candidate
    where candidate.restaurant_id = p_restaurant_id
      and candidate.asset_id = asset.id
      and candidate.source_content_sha256 =
        coalesce(intake.content_sha256, asset.content_sha256)
    limit 1
  ) assessment_link on true
  left join public.veroxa_private_media_assessments_v1 assessment
    on assessment.id = assessment_link.assessment_id
   and assessment.restaurant_id = assessment_link.restaurant_id
   and assessment.source_content_sha256 =
     assessment_link.source_content_sha256
  left join lateral (
    select candidate.id,
      candidate.association,
      candidate.evidence_class,
      candidate.recorded_at
    from public.veroxa_media_restaurant_associations_v1 candidate
    join public.veroxa_media_rights rights
      on rights.id = candidate.rights_id
     and rights.restaurant_id = candidate.restaurant_id
     and rights.asset_id = candidate.asset_id
    where candidate.restaurant_id = p_restaurant_id
      and candidate.asset_id = asset.id
      and candidate.source_content_sha256 =
        coalesce(intake.content_sha256, asset.content_sha256)
    order by candidate.recorded_at desc, candidate.id desc
    limit 1
  ) association on true
  left join lateral (
    select event.id, event.recorded_at
    from public.veroxa_momo_ready_disposition_events_v1 event
    where event.restaurant_id = p_restaurant_id
      and event.source_content_sha256 =
        coalesce(intake.content_sha256, asset.content_sha256)
      and event.disposition = 'discarded'
      and not event.external_write_allowed
    order by event.recorded_at desc, event.id desc
    limit 1
  ) source_discard on true
  left join lateral (
    select latest_event.disposition,
      veroxa_private.momo_content_ai_current_evidence_v1(
        ready.content_ai_run_id, run.requested_by
      )
      and veroxa_private.media_has_current_real_owner_association_v1(
        p_restaurant_id,
        identity_link.asset_id,
        identity_link.rights_id,
        identity_link.content_sha256
      )
      and latest_event.disposition is distinct from 'discarded'
        as current_evidence
    from public.veroxa_momo_media_asset_identity_links_v2 identity_link
    join public.veroxa_momo_ready_packages_v2 ready
      on ready.identity_id = identity_link.identity_id
     and ready.restaurant_id = identity_link.restaurant_id
     and ready.status = 'veroxa_ready'
    join public.veroxa_momo_content_ai_runs run
      on run.id = ready.content_ai_run_id
     and run.restaurant_id = ready.restaurant_id
    left join lateral (
      select event.disposition
      from public.veroxa_momo_ready_disposition_events_v1 event
      where event.ready_package_id = ready.id
      order by (event.disposition = 'discarded') desc,
        event.recorded_at desc, event.id desc
      limit 1
    ) latest_event on true
    where identity_link.restaurant_id = p_restaurant_id
      and identity_link.asset_id = asset.id
    order by ready.ready_at desc, ready.id desc
    limit 1
  ) displayed_ready on true
  order by asset.created_at desc, asset.id desc;
end;
$$;
revoke all on function public.veroxa_momo_client_upload_status_v4(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.veroxa_momo_client_upload_status_v4(uuid)
  to authenticated;
