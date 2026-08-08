-- Signed and bounded public Audit intake v2.
--
-- This introduction migration intentionally leaves v1 executable so the
-- deployed Sites adapter can be cut over without downtime. V1 is revoked by
-- the separately staged 20260808001842 retirement migration only after the
-- v2 route is published and verified.

create or replace function public.submit_audit_request_v2(
  p_restaurant_name text,
  p_city text,
  p_state text,
  p_website_url text default null,
  p_google_profile_url text default null,
  p_contact_name text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_contact_note text default null,
  p_consent_to_contact boolean default false,
  p_consent_version text default null,
  p_form_started_at timestamptz default null,
  p_honeypot text default null,
  p_fingerprint text default null,
  p_intake_token text default null,
  p_idempotency_key text default null,
  p_envelope_version integer default null,
  p_envelope_issued_at timestamptz default null,
  p_envelope_expires_at timestamptz default null,
  p_envelope_nonce text default null,
  p_envelope_canonical text default null,
  p_ip_quota_fingerprint text default null
)
returns table(request_id uuid, reference_code text, request_status text)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_name text := btrim(coalesce(p_restaurant_name, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_state text := btrim(coalesce(p_state, ''));
  v_email text := nullif(lower(btrim(coalesce(p_contact_email, ''))), '');
  v_phone text := nullif(btrim(coalesce(p_contact_phone, '')), '');
  v_website text := nullif(btrim(coalesce(p_website_url, '')), '');
  v_google text := nullif(btrim(coalesce(p_google_profile_url, '')), '');
  v_contact_name text := nullif(btrim(coalesce(p_contact_name, '')), '');
  v_contact_note text := nullif(btrim(coalesce(p_contact_note, '')), '');
  v_honeypot text := nullif(btrim(coalesce(p_honeypot, '')), '');
  v_idempotency_key text := btrim(coalesce(p_idempotency_key, ''));
  v_nonce text := btrim(coalesce(p_envelope_nonce, ''));
  v_ip_quota_fingerprint text := btrim(coalesce(p_ip_quota_fingerprint, ''));
  v_intake_token text := btrim(coalesce(p_intake_token, ''));
  v_envelope jsonb;
  v_envelope_issued_at timestamptz;
  v_envelope_expires_at timestamptz;
  v_envelope_form_started_at timestamptz;
  v_fingerprint_hash text;
  v_idempotency_hash text;
  v_intake_secret text;
  v_existing_request public.audit_requests%rowtype;
  v_restaurant_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_reference text;
  v_recent_count integer;
begin
  select hmac_secret
  into v_intake_secret
  from private.audit_intake_config
  where singleton = true;

  if v_intake_secret is null
     or p_envelope_canonical is null
     or octet_length(p_envelope_canonical) not between 2 and 16384
     or v_intake_token !~ '^[0-9a-f]{64}$'
     or v_ip_quota_fingerprint !~ '^[0-9a-f]{64}$'
     or btrim(coalesce(p_fingerprint, '')) <> v_ip_quota_fingerprint
     or v_nonce !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;

  if pg_catalog.encode(
       extensions.hmac(p_envelope_canonical, v_intake_secret, 'sha256'),
       'hex'
     ) <> v_intake_token then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;

  begin
    v_envelope := p_envelope_canonical::jsonb;
    if pg_catalog.jsonb_typeof(v_envelope) <> 'object'
       or pg_catalog.jsonb_typeof(v_envelope -> 'issuedAt') <> 'string'
       or pg_catalog.jsonb_typeof(v_envelope -> 'expiresAt') <> 'string'
       or pg_catalog.jsonb_typeof(v_envelope -> 'formStartedAt') <> 'string' then
      raise exception using errcode = '22023', message = 'submission_rejected';
    end if;
    v_envelope_issued_at := (v_envelope ->> 'issuedAt')::timestamptz;
    v_envelope_expires_at := (v_envelope ->> 'expiresAt')::timestamptz;
    v_envelope_form_started_at := (v_envelope ->> 'formStartedAt')::timestamptz;
  exception
    when others then
      raise exception using errcode = '22023', message = 'submission_rejected';
  end;

  if p_envelope_version is distinct from 1
     or p_envelope_issued_at is null
     or p_envelope_expires_at is null
     or p_envelope_expires_at - p_envelope_issued_at is distinct from interval '2 minutes'
     -- Edge and database clocks are independent. Permit only a tightly bounded
     -- positive skew while preserving the exact two-minute signed lifetime.
     or p_envelope_issued_at > pg_catalog.transaction_timestamp() + interval '30 seconds'
     or p_envelope_expires_at <= pg_catalog.transaction_timestamp()
     or v_envelope_issued_at is distinct from p_envelope_issued_at
     or v_envelope_expires_at is distinct from p_envelope_expires_at
     or v_envelope_form_started_at is distinct from p_form_started_at then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;

  if v_envelope - 'issuedAt' - 'expiresAt' - 'formStartedAt'
       is distinct from pg_catalog.jsonb_build_object(
         'city', v_city,
         'consentToContact', true,
         'consentVersion', btrim(coalesce(p_consent_version, '')),
         'contactEmail', v_email,
         'contactName', v_contact_name,
         'contactNote', v_contact_note,
         'contactPhone', v_phone,
         'googleProfileUrl', v_google,
         'honeypot', v_honeypot,
         'idempotencyKey', v_idempotency_key,
         'ipQuotaFingerprint', v_ip_quota_fingerprint,
         'nonce', v_nonce,
         'restaurantName', v_name,
         'schema', 'veroxa.public-audit-intake-envelope',
         'state', v_state,
         'version', 1,
         'websiteUrl', v_website
       ) then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;

  if v_honeypot is not null then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if p_form_started_at is null
     or p_form_started_at > pg_catalog.transaction_timestamp()
     or p_form_started_at < pg_catalog.transaction_timestamp() - interval '2 hours'
     or pg_catalog.transaction_timestamp() - p_form_started_at < interval '3 seconds' then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if char_length(v_name) not between 2 and 160
     or char_length(v_city) not between 2 and 100
     or char_length(v_state) not between 2 and 40 then
    raise exception using errcode = '22023', message = 'invalid_restaurant_identity';
  end if;
  if v_email is null and v_phone is null then
    raise exception using errcode = '22023', message = 'contact_required';
  end if;
  if not coalesce(p_consent_to_contact, false)
     or btrim(coalesce(p_consent_version, '')) <> '2026-07-12' then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if char_length(v_idempotency_key) not between 16 and 128
     or char_length(coalesce(v_contact_name, '')) > 160
     or char_length(coalesce(v_email, '')) > 320
     or char_length(coalesce(v_phone, '')) > 50
     or char_length(coalesce(v_contact_note, '')) > 2000
     or char_length(coalesce(v_website, '')) > 2000
     or char_length(coalesce(v_google, '')) > 2000 then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if v_email is not null
     and v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception using errcode = '22023', message = 'invalid_contact';
  end if;
  if v_phone is not null
     and char_length(regexp_replace(v_phone, '[^0-9]', '', 'g')) not between 7 and 15 then
    raise exception using errcode = '22023', message = 'invalid_contact';
  end if;
  if (v_website is not null and v_website !~* '^https?://')
     or (v_google is not null and v_google !~* '^https?://') then
    raise exception using errcode = '22023', message = 'invalid_url';
  end if;

  v_idempotency_hash := pg_catalog.encode(
    extensions.digest(v_idempotency_key, 'sha256'), 'hex'
  );
  v_fingerprint_hash := pg_catalog.encode(
    extensions.digest(v_ip_quota_fingerprint, 'sha256'), 'hex'
  );

  -- One shared IP quota identity must serialize before any contact-specific
  -- lock or count, including simultaneous submissions for different contacts.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'audit_ip_quota:' || v_fingerprint_hash, 0
  ));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'audit_contact_quota:' || coalesce(v_email, v_phone), 0
  ));

  select *
  into v_existing_request
  from public.audit_requests
  where idempotency_hash = v_idempotency_hash
    and created_at >= pg_catalog.transaction_timestamp() - interval '7 days'
  limit 1;
  if v_existing_request.id is not null then
    return query
    select v_existing_request.id,
      v_existing_request.reference_code,
      v_existing_request.status::text;
    return;
  end if;

  if v_email is not null then
    select count(*)
    into v_recent_count
    from public.audit_requests
    where lower(contact_email) = v_email
      and created_at >= pg_catalog.transaction_timestamp() - interval '15 minutes';
  else
    select count(*)
    into v_recent_count
    from public.audit_requests
    where contact_email is null
      and contact_phone = v_phone
      and created_at >= pg_catalog.transaction_timestamp() - interval '15 minutes';
  end if;
  if v_recent_count >= 3 then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  select count(*)
  into v_recent_count
  from public.audit_requests
  where intake_fingerprint_hash = v_fingerprint_hash
    and created_at >= pg_catalog.transaction_timestamp() - interval '24 hours';
  if v_recent_count >= 6 then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  insert into public.audit_restaurants (
    restaurant_name, normalized_name, city, normalized_city, state,
    normalized_state, website_url, google_profile_url, phone, source
  ) values (
    v_name, lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_city, lower(regexp_replace(v_city, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_state, lower(v_state), null, null, null, 'public_intake'
  ) returning id into v_restaurant_id;

  v_reference := 'VA-' || upper(substr(replace(v_request_id::text, '-', ''), 1, 10));
  insert into public.audit_requests (
    id, reference_code, audit_restaurant_id, source, status, contact_name,
    contact_email, contact_phone, contact_note, consent_to_contact,
    consent_version, consent_at, idempotency_hash, intake_fingerprint_hash
  ) values (
    v_request_id, v_reference, v_restaurant_id, 'public_intake', 'new',
    v_contact_name, v_email, v_phone, v_contact_note, true,
    btrim(p_consent_version), pg_catalog.transaction_timestamp(),
    v_idempotency_hash, v_fingerprint_hash
  );
  insert into public.audit_runs (audit_request_id, run_number, status, source_snapshot)
  values (v_request_id, 1, 'queued', pg_catalog.jsonb_build_object(
    'website_url', v_website,
    'google_profile_url', v_google,
    'submitted_at', pg_catalog.transaction_timestamp(),
    'source', 'public_intake'
  ));

  return query select v_request_id, v_reference, 'new'::text;
end;
$$;

revoke all on function public.submit_audit_request_v2(
  text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,
  text,text,text,text,integer,timestamptz,timestamptz,text,text,text
) from public, anon, authenticated, service_role;
grant execute on function public.submit_audit_request_v2(
  text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,
  text,text,text,text,integer,timestamptz,timestamptz,text,text,text
) to anon;

comment on function public.submit_audit_request_v2(
  text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,
  text,text,text,text,integer,timestamptz,timestamptz,text,text,text
) is 'Signed, bounded, semantically bound public Audit intake. Returns only a reference and exposes no stored contact or Team data.';
