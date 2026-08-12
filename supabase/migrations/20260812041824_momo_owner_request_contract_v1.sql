-- -------------------------------------------------------------------------
-- Momo owner-change requests: one tenant-scoped communication contract
-- -------------------------------------------------------------------------

alter table public.veroxa_client_requests
  add column if not exists request_category text,
  add column if not exists subject_type text,
  add column if not exists subject_id uuid,
  add column if not exists context jsonb not null default '{}'::jsonb;

alter table public.veroxa_client_requests
  add constraint veroxa_client_request_category_check check (
    request_category is null or request_category in (
      'factual_error', 'seo_improvement', 'missing_evidence',
      'outdated_information', 'compliance', 'owner_clarification',
      'operational_change'
    )
  ),
  add constraint veroxa_client_request_subject_type_check check (
    subject_type is null or subject_type in (
      'truth_field', 'contact', 'onboarding_step', 'presence_profile',
      'media_asset', 'content_item', 'client_request'
    )
  ),
  add constraint veroxa_client_request_subject_pair_check check (
    (subject_type is null and subject_id is null)
    or (subject_type is not null and subject_id is not null)
  ),
  add constraint veroxa_client_request_context_object_check check (
    jsonb_typeof(context) = 'object'
  );

create index if not exists veroxa_client_requests_subject_idx
  on public.veroxa_client_requests (restaurant_id, subject_type, subject_id)
  where subject_id is not null;

create or replace function veroxa_private.protect_client_request_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '23514',
      message = 'client_request_history_is_immutable';
  end if;
  if tg_op = 'INSERT' then
    if current_setting('veroxa.trusted_client_request_write', true)
         is distinct from 'on'
       or new.created_by is distinct from (select auth.uid())
       or new.status <> 'open'
       or new.completed_at is not null then
      raise exception using errcode = '42501',
        message = 'client_request_requires_transactional_rpc';
    end if;
    new.created_at := clock_timestamp();
    new.updated_at := new.created_at;
    return new;
  end if;
  if current_setting('veroxa.trusted_client_request_transition', true)
       is distinct from 'on'
     or new.id is distinct from old.id
     or new.restaurant_id is distinct from old.restaurant_id
     or new.request_type is distinct from old.request_type
     or new.title is distinct from old.title
     or new.details is distinct from old.details
     or new.priority is distinct from old.priority
     or new.request_category is distinct from old.request_category
     or new.subject_type is distinct from old.subject_type
     or new.subject_id is distinct from old.subject_id
     or new.context is distinct from old.context
     or new.created_by is distinct from old.created_by
     or new.idempotency_key is distinct from old.idempotency_key
     or new.payload_sha256 is distinct from old.payload_sha256
     or new.created_at is distinct from old.created_at then
    raise exception using errcode = '23514',
      message = 'client_request_identity_is_immutable';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create or replace function public.veroxa_create_team_request_v1(
  p_restaurant_id uuid,
  p_request_type text,
  p_title text,
  p_details text,
  p_priority text,
  p_request_category text,
  p_subject_type text,
  p_subject_id uuid,
  p_context jsonb,
  p_idempotency_key text
)
returns table (request_id uuid, status text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_title text := btrim(coalesce(p_title, ''));
  v_details text := btrim(coalesce(p_details, ''));
  v_category text := btrim(coalesce(p_request_category, ''));
  v_subject_type text := nullif(btrim(coalesce(p_subject_type, '')), '');
  v_context jsonb := case
    when p_context is null then '{}'::jsonb
    else p_context
  end;
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_existing public.veroxa_client_requests%rowtype;
begin
  if v_caller is null
     or not public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id) then
    raise exception using errcode = '42501',
      message = 'momo_team_request_create_required';
  end if;
  if p_request_type is null or not (p_request_type = any(array[
       'onboarding','truth_update','media','content','website','reporting','support'
     ]::text[]))
     or char_length(v_title) not between 3 and 200
     or char_length(v_details) not between 3 and 5000
     or p_priority is null or not (p_priority = any(array['normal','urgent']::text[]))
     or v_category not in (
       'factual_error', 'seo_improvement', 'missing_evidence',
       'outdated_information', 'compliance', 'owner_clarification',
       'operational_change'
     )
     or (v_subject_type is not null and v_subject_type not in (
       'truth_field', 'contact', 'onboarding_step', 'presence_profile',
       'media_asset', 'content_item', 'client_request'
     ))
     or ((v_subject_type is null) <> (p_subject_id is null))
     or jsonb_typeof(v_context) <> 'object'
     or char_length(v_context::text) > 5000
     or char_length(v_key) not between 16 and 200
     or v_key !~ '^[A-Za-z0-9:_-]+$' then
    raise exception using errcode = '22023',
      message = 'invalid_team_request_payload';
  end if;
  v_hash := encode(extensions.digest(
    jsonb_build_array('team-request-v1', p_restaurant_id, v_caller,
      p_request_type, v_title, v_details, p_priority, v_category,
      v_subject_type, p_subject_id, v_context)::text,
    'sha256'
  ), 'hex');
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('team-request-quota:' || v_caller::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('team-request-key:' || v_caller::text || ':' || v_key, 0)
  );
  select * into v_existing
  from public.veroxa_client_requests request
  where request.created_by = v_caller and request.idempotency_key = v_key
  for update;
  if found then
    if v_existing.payload_sha256 is distinct from v_hash then
      raise exception using errcode = '23505',
        message = 'team_request_idempotency_conflict';
    end if;
    return query select v_existing.id, v_existing.status,
      v_existing.created_at;
    return;
  end if;
  if (select count(*) from public.veroxa_client_requests request
      where request.created_by = v_caller
        and request.created_at >= clock_timestamp() - interval '1 hour') >= 30
     or (select count(*) from public.veroxa_client_requests request
      where request.created_by = v_caller
        and request.status in ('open','acknowledged','in_progress')) >= 100 then
    raise exception using errcode = '54000',
      message = 'team_request_rate_or_open_limit_reached';
  end if;
  perform set_config('veroxa.trusted_client_request_write', 'on', true);
  insert into public.veroxa_client_requests (
    restaurant_id, request_type, title, details, priority, status,
    request_category, subject_type, subject_id, context,
    created_by, idempotency_key, payload_sha256
  ) values (
    p_restaurant_id, p_request_type, v_title, v_details, p_priority, 'open',
    v_category, v_subject_type, p_subject_id, v_context,
    v_caller, v_key, v_hash
  ) returning id, veroxa_client_requests.status,
    veroxa_client_requests.created_at
    into request_id, status, created_at;
  perform set_config('veroxa.trusted_activity_write', 'on', true);
  insert into public.veroxa_activity_events (
    restaurant_id, event_type, subject_type, subject_id, actor_id,
    visibility, report_eligible, payload
  ) values (
    p_restaurant_id, 'client_request_created', 'client_request', request_id,
    v_caller, 'both', false,
    jsonb_build_object(
      'request_category', v_category,
      'subject_type', v_subject_type,
      'subject_id', p_subject_id
    )
  );
  return next;
end;
$$;

create or replace function public.veroxa_list_client_requests_v1(
  p_restaurant_id uuid,
  p_before timestamptz default null,
  p_limit integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_limit is null or p_limit not between 1 and 50
     or not (
       public.veroxa_current_user_has_active_restaurant(p_restaurant_id)
       or public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
     ) then
    raise exception using errcode = '42501',
      message = 'request_list_access_or_limit_denied';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', request.id, 'requestType', request.request_type,
      'title', request.title, 'details', request.details,
      'priority', request.priority, 'status', request.status,
      'createdBy', request.created_by,
      'createdByRole', creator.role,
      'requestCategory', request.request_category,
      'subjectType', request.subject_type, 'subjectId', request.subject_id,
      'context', request.context,
      'lastMessageAt', (select max(message.created_at)
        from public.veroxa_request_messages message
        where message.request_id = request.id),
      'createdAt', request.created_at, 'updatedAt', request.updated_at,
      'completedAt', request.completed_at
    ) order by request.created_at desc, request.id desc)
    from (
      select row.* from public.veroxa_client_requests row
      where row.restaurant_id = p_restaurant_id
        and (public.veroxa_current_user_is_team_for_restaurant(p_restaurant_id)
          or public.veroxa_current_user_has_active_restaurant(p_restaurant_id))
        and (p_before is null or row.created_at < p_before)
      order by row.created_at desc, row.id desc
      limit p_limit
    ) request
    join public.veroxa_user_profiles creator on creator.user_id = request.created_by
  ), '[]'::jsonb);
end;
$$;

create or replace function public.veroxa_append_request_message_v1(
  p_request_id uuid,
  p_body text,
  p_idempotency_key text
)
returns table (message_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_request public.veroxa_client_requests%rowtype;
  v_profile public.veroxa_user_profiles%rowtype;
  v_body text := btrim(coalesce(p_body, ''));
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_existing public.veroxa_request_messages%rowtype;
begin
  select * into v_request from public.veroxa_client_requests request
  where request.id = p_request_id for share;
  if not found or v_caller is null or not (
    public.veroxa_current_user_has_active_restaurant(v_request.restaurant_id)
    or public.veroxa_current_user_is_team_for_restaurant(v_request.restaurant_id)
  ) then
    raise exception using errcode = '42501',
      message = 'request_thread_access_denied';
  end if;
  select * into v_profile from public.veroxa_user_profiles profile
  where profile.user_id = v_caller and profile.status = 'active';
  if not found
     or char_length(v_body) not between 1 and 5000
     or char_length(v_key) not between 16 and 200
     or v_key !~ '^[A-Za-z0-9:_-]+$' then
    raise exception using errcode = '22023',
      message = 'invalid_request_message_payload';
  end if;
  v_hash := encode(extensions.digest(
    concat_ws(E'\n', 'request-message-v1', p_request_id::text,
      v_caller::text, v_profile.role::text, v_body),
    'sha256'
  ), 'hex');
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('request-message-caller:' || v_caller::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('request-message-thread:' || p_request_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('request-message-key:' || v_caller::text || ':' || v_key, 0)
  );
  select * into v_existing from public.veroxa_request_messages message
  where message.sender_id = v_caller and message.idempotency_key = v_key
  for update;
  if found then
    if v_existing.request_id is distinct from p_request_id
       or v_existing.payload_sha256 is distinct from v_hash then
      raise exception using errcode = '23505',
        message = 'request_message_idempotency_conflict';
    end if;
    return query select v_existing.id, v_existing.created_at;
    return;
  end if;
  if v_request.status in ('completed','cancelled') then
    raise exception using errcode = '55000',
      message = 'request_thread_is_closed';
  end if;
  if (select count(*) from public.veroxa_request_messages message
      where message.sender_id = v_caller
        and message.created_at >= clock_timestamp() - interval '1 hour') >= 60
     or (select count(*) from public.veroxa_request_messages message
      where message.request_id = p_request_id) >= 5000 then
    raise exception using errcode = '54000',
      message = 'request_message_rate_or_thread_limit_reached';
  end if;
  perform set_config('veroxa.trusted_request_message_write', 'on', true);
  insert into public.veroxa_request_messages (
    restaurant_id, request_id, sender_id, sender_role, body,
    idempotency_key, payload_sha256
  ) values (
    v_request.restaurant_id, v_request.id, v_caller, v_profile.role,
    v_body, v_key, v_hash
  ) returning id, veroxa_request_messages.created_at
    into message_id, created_at;
  return next;
end;
$$;

create or replace function public.veroxa_request_thread_v1(
  p_request_id uuid,
  p_before timestamptz default null,
  p_limit integer default 50
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_request public.veroxa_client_requests%rowtype;
begin
  select * into v_request from public.veroxa_client_requests request
  where request.id = p_request_id;
  if not found or p_limit is null or p_limit not between 1 and 100 or not (
    public.veroxa_current_user_has_active_restaurant(v_request.restaurant_id)
    or public.veroxa_current_user_is_team_for_restaurant(v_request.restaurant_id)
  ) then
    raise exception using errcode = '42501',
      message = 'request_thread_access_or_limit_denied';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', message.id, 'senderId', message.sender_id,
      'senderRole', message.sender_role, 'body', message.body,
      'createdAt', message.created_at
    ) order by message.created_at desc, message.id desc)
    from (
      select row.* from public.veroxa_request_messages row
      where row.request_id = p_request_id
        and (p_before is null or row.created_at < p_before)
      order by row.created_at desc, row.id desc
      limit p_limit
    ) message
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.veroxa_create_team_request_v1(
  uuid, text, text, text, text, text, text, uuid, jsonb, text
), public.veroxa_list_client_requests_v1(uuid, timestamptz, integer),
  public.veroxa_append_request_message_v1(uuid, text, text),
  public.veroxa_request_thread_v1(uuid, timestamptz, integer)
  from public, anon;
grant execute on function public.veroxa_create_team_request_v1(
  uuid, text, text, text, text, text, text, uuid, jsonb, text
), public.veroxa_list_client_requests_v1(uuid, timestamptz, integer),
  public.veroxa_append_request_message_v1(uuid, text, text),
  public.veroxa_request_thread_v1(uuid, timestamptz, integer)
  to authenticated;
