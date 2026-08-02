-- =============================================================
-- Restaurant Audit Center V1
-- =============================================================
-- Non-client restaurant audits only. Nothing in this migration inserts into
-- restaurants, restaurant_members, clients, onboarding, media, content,
-- publishing, or reporting tables used by operational clients.
-- =============================================================

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.audit_intake_config (
  singleton boolean primary key default true check (singleton),
  hmac_secret text not null check (char_length(hmac_secret) >= 32),
  rotated_at timestamptz not null default now()
);
revoke all on table private.audit_intake_config from public, anon, authenticated;

do $$ begin
  create type public.audit_request_status as enum (
    'new', 'in_review', 'waiting_on_research', 'ready_for_review', 'reviewed', 'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.audit_run_status as enum (
    'queued', 'in_progress', 'ready_for_review', 'reviewed', 'failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.audit_finding_severity as enum (
    'opportunity', 'low', 'medium', 'high', 'critical'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.audit_report_status as enum (
    'draft', 'ready_for_review', 'reviewed'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.audit_restaurants (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null check (char_length(restaurant_name) between 2 and 160),
  normalized_name text not null,
  city text not null check (char_length(city) between 2 and 100),
  normalized_city text not null,
  state text not null check (char_length(state) between 2 and 40),
  normalized_state text not null,
  website_url text,
  google_profile_url text,
  phone text,
  source text not null default 'public_intake',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audit_restaurants_identity_unique unique (
    normalized_name, normalized_city, normalized_state
  ),
  constraint audit_restaurants_website_http check (
    website_url is null or website_url ~* '^https?://'
  ),
  constraint audit_restaurants_google_http check (
    google_profile_url is null or google_profile_url ~* '^https?://'
  )
);

create table if not exists public.audit_requests (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  audit_restaurant_id uuid not null references public.audit_restaurants(id) on delete restrict,
  source text not null default 'public_intake',
  status public.audit_request_status not null default 'new',
  contact_name text,
  contact_email text,
  contact_phone text,
  preferred_contact_method text,
  contact_note text,
  consent_to_contact boolean not null default false,
  consent_version text,
  consent_at timestamptz,
  idempotency_hash text,
  intake_fingerprint_hash text,
  assigned_to uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audit_requests_contact_email_shape check (
    contact_email is null or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint audit_requests_contact_required check (
    source <> 'public_intake' or contact_email is not null or contact_phone is not null
  ),
  constraint audit_requests_contact_phone_shape check (
    contact_phone is null or char_length(regexp_replace(contact_phone, '[^0-9]', '', 'g')) between 7 and 15
  ),
  constraint audit_requests_public_consent_required check (
    source <> 'public_intake'
    or (consent_to_contact and consent_version is not null and consent_at is not null)
  )
);

create table if not exists public.audit_runs (
  id uuid primary key default gen_random_uuid(),
  audit_request_id uuid not null references public.audit_requests(id) on delete cascade,
  previous_run_id uuid references public.audit_runs(id) on delete set null,
  run_number integer not null check (run_number > 0),
  status public.audit_run_status not null default 'queued',
  source_snapshot jsonb not null default '{}'::jsonb,
  score_snapshot jsonb not null default '{}'::jsonb,
  comparison_summary text,
  failure_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audit_runs_request_number_unique unique (audit_request_id, run_number),
  constraint audit_runs_snapshot_object check (jsonb_typeof(source_snapshot) = 'object'),
  constraint audit_runs_score_object check (jsonb_typeof(score_snapshot) = 'object')
);

create table if not exists public.audit_findings (
  id uuid primary key default gen_random_uuid(),
  audit_run_id uuid not null references public.audit_runs(id) on delete cascade,
  category text not null check (char_length(category) between 2 and 80),
  severity public.audit_finding_severity not null default 'opportunity',
  title text not null check (char_length(title) between 2 and 180),
  summary text not null check (char_length(summary) between 2 and 3000),
  evidence_url text,
  evidence_label text,
  recommended_action text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audit_findings_evidence_http check (
    evidence_url is null or evidence_url ~* '^https?://'
  )
);

create table if not exists public.audit_notes (
  id uuid primary key default gen_random_uuid(),
  audit_request_id uuid not null references public.audit_requests(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  audit_run_id uuid not null unique references public.audit_runs(id) on delete cascade,
  status public.audit_report_status not null default 'draft',
  executive_summary text not null default '',
  priority_actions text not null default '',
  honesty_note text not null default 'This audit is a reviewed online-presence assessment, not a guarantee of orders, rankings, revenue, profit, ROI, or growth.',
  prepared_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  audit_request_id uuid not null references public.audit_requests(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 2 and 80),
  event_data jsonb not null default '{}'::jsonb,
  actor_user_id uuid,
  created_at timestamptz not null default now(),
  constraint audit_events_data_object check (jsonb_typeof(event_data) = 'object')
);

create index if not exists audit_requests_status_created_idx
  on public.audit_requests (status, created_at desc);
create index if not exists audit_requests_restaurant_created_idx
  on public.audit_requests (audit_restaurant_id, created_at desc);
create index if not exists audit_requests_contact_email_created_idx
  on public.audit_requests (lower(contact_email), created_at desc)
  where contact_email is not null;
create index if not exists audit_requests_fingerprint_created_idx
  on public.audit_requests (intake_fingerprint_hash, created_at desc)
  where intake_fingerprint_hash is not null;
create unique index if not exists audit_requests_idempotency_hash_unique
  on public.audit_requests (idempotency_hash)
  where idempotency_hash is not null;
create index if not exists audit_runs_request_created_idx
  on public.audit_runs (audit_request_id, created_at desc);
create index if not exists audit_findings_run_category_idx
  on public.audit_findings (audit_run_id, category, created_at);
create index if not exists audit_notes_request_created_idx
  on public.audit_notes (audit_request_id, created_at desc);
create index if not exists audit_events_request_created_idx
  on public.audit_events (audit_request_id, created_at desc);

create or replace function private.protect_public_audit_restaurant_identity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if coalesce(auth.role(), '') = 'anon' then
    new.website_url := case when tg_op = 'UPDATE' then old.website_url else null end;
    new.google_profile_url := case when tg_op = 'UPDATE' then old.google_profile_url else null end;
    new.phone := case when tg_op = 'UPDATE' then old.phone else null end;
  end if;
  return new;
end;
$$;
revoke all on function private.protect_public_audit_restaurant_identity() from public, anon, authenticated;
drop trigger if exists audit_restaurants_public_identity_guard on public.audit_restaurants;
create trigger audit_restaurants_public_identity_guard
before insert or update on public.audit_restaurants
for each row execute function private.protect_public_audit_restaurant_identity();

drop trigger if exists audit_restaurants_set_updated_at on public.audit_restaurants;
create trigger audit_restaurants_set_updated_at before update on public.audit_restaurants
for each row execute function veroxa_private.set_updated_at();
drop trigger if exists audit_requests_set_updated_at on public.audit_requests;
create trigger audit_requests_set_updated_at before update on public.audit_requests
for each row execute function veroxa_private.set_updated_at();
drop trigger if exists audit_runs_set_updated_at on public.audit_runs;
create trigger audit_runs_set_updated_at before update on public.audit_runs
for each row execute function veroxa_private.set_updated_at();
drop trigger if exists audit_findings_set_updated_at on public.audit_findings;
create trigger audit_findings_set_updated_at before update on public.audit_findings
for each row execute function veroxa_private.set_updated_at();
drop trigger if exists audit_reports_set_updated_at on public.audit_reports;
create trigger audit_reports_set_updated_at before update on public.audit_reports
for each row execute function veroxa_private.set_updated_at();

alter table public.audit_restaurants enable row level security;
alter table public.audit_requests enable row level security;
alter table public.audit_runs enable row level security;
alter table public.audit_findings enable row level security;
alter table public.audit_notes enable row level security;
alter table public.audit_reports enable row level security;
alter table public.audit_events enable row level security;
alter table public.audit_restaurants force row level security;
alter table public.audit_requests force row level security;
alter table public.audit_runs force row level security;
alter table public.audit_findings force row level security;
alter table public.audit_notes force row level security;
alter table public.audit_reports force row level security;
alter table public.audit_events force row level security;

revoke all on table public.audit_restaurants from anon, authenticated;
revoke all on table public.audit_requests from anon, authenticated;
revoke all on table public.audit_runs from anon, authenticated;
revoke all on table public.audit_findings from anon, authenticated;
revoke all on table public.audit_notes from anon, authenticated;
revoke all on table public.audit_reports from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

grant select, insert, update on table public.audit_restaurants to authenticated;
grant select, insert, update on table public.audit_requests to authenticated;
grant select, insert, update on table public.audit_runs to authenticated;
grant select, insert, update, delete on table public.audit_findings to authenticated;
grant select, insert on table public.audit_notes to authenticated;
grant select, insert, update on table public.audit_reports to authenticated;
grant select, insert on table public.audit_events to authenticated;

do $$
declare
  table_name text;
  policy_suffix text;
begin
  foreach table_name in array array[
    'audit_restaurants', 'audit_requests', 'audit_runs', 'audit_findings',
    'audit_notes', 'audit_reports', 'audit_events'
  ] loop
    policy_suffix := table_name || '_active_team_all';
    execute format('drop policy if exists %I on public.%I', policy_suffix, table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.veroxa_current_user_is_active_team()) with check (public.veroxa_current_user_is_active_team())',
      policy_suffix,
      table_name
    );
  end loop;
end $$;

create or replace function private.enforce_reviewed_audit_immutability()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_table_name = 'audit_runs' then
    if old.status::text = 'reviewed' then
      raise exception using errcode = '55000', message = 'reviewed_audit_run_is_immutable';
    end if;
  elsif tg_table_name = 'audit_reports' then
    if old.status::text = 'reviewed' then
      raise exception using errcode = '55000', message = 'reviewed_audit_report_is_immutable';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function private.enforce_reviewed_audit_immutability() from public, anon, authenticated;

drop trigger if exists audit_runs_reviewed_immutable on public.audit_runs;
create trigger audit_runs_reviewed_immutable before update or delete on public.audit_runs
for each row execute function private.enforce_reviewed_audit_immutability();
drop trigger if exists audit_reports_reviewed_immutable on public.audit_reports;
create trigger audit_reports_reviewed_immutable before update or delete on public.audit_reports
for each row execute function private.enforce_reviewed_audit_immutability();

create or replace function private.enforce_reviewed_finding_immutability()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_run_id uuid := case when tg_op = 'DELETE' then old.audit_run_id else new.audit_run_id end;
begin
  if exists (
    select 1 from public.audit_runs
    where id = target_run_id and status = 'reviewed'::public.audit_run_status
  ) then
    raise exception using errcode = '55000', message = 'reviewed_audit_findings_are_immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function private.enforce_reviewed_finding_immutability() from public, anon, authenticated;
drop trigger if exists audit_findings_reviewed_immutable on public.audit_findings;
create trigger audit_findings_reviewed_immutable before insert or update or delete on public.audit_findings
for each row execute function private.enforce_reviewed_finding_immutability();

create or replace function private.enforce_audit_review_gates()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_request_id uuid;
  target_run_number integer;
  target_run_status public.audit_run_status;
begin
  if tg_table_name = 'audit_runs'
     and new.status::text = 'reviewed'
     and old.status::text is distinct from new.status::text then
    if not exists (
      select 1 from public.audit_findings finding
      where finding.audit_run_id = new.id
        and finding.evidence_url is not null
    ) then
      raise exception using errcode = '23514', message = 'reviewed_run_requires_evidence_backed_finding';
    end if;
    if new.run_number > 1 and char_length(btrim(coalesce(new.comparison_summary, ''))) < 10 then
      raise exception using errcode = '23514', message = 'reviewed_rerun_requires_comparison';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
    new.completed_at := coalesce(new.completed_at, now());
  elsif tg_table_name = 'audit_reports'
        and new.status::text = 'reviewed'
        and (tg_op = 'INSERT' or old.status::text is distinct from new.status::text) then
    select run.status, run.run_number
      into target_run_status, target_run_number
    from public.audit_runs run where run.id = new.audit_run_id;
    if target_run_status is distinct from 'reviewed'::public.audit_run_status then
      raise exception using errcode = '23514', message = 'reviewed_report_requires_reviewed_run';
    end if;
    if char_length(btrim(new.executive_summary)) < 20
       or char_length(btrim(new.priority_actions)) < 20 then
      raise exception using errcode = '23514', message = 'reviewed_report_requires_complete_summary';
    end if;
    if not exists (
      select 1 from public.audit_findings finding
      where finding.audit_run_id = new.audit_run_id
        and finding.evidence_url is not null
    ) then
      raise exception using errcode = '23514', message = 'reviewed_report_requires_evidence';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  elsif tg_table_name = 'audit_requests'
        and new.status::text = 'reviewed'
        and old.status::text is distinct from new.status::text then
    target_request_id := new.id;
    if not exists (
      select 1
      from public.audit_reports report
      join public.audit_runs run on run.id = report.audit_run_id
      where run.audit_request_id = target_request_id
        and report.status = 'reviewed'::public.audit_report_status
    ) then
      raise exception using errcode = '23514', message = 'reviewed_request_requires_reviewed_report';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_audit_review_gates() from public, anon, authenticated;

drop trigger if exists audit_runs_review_gate on public.audit_runs;
create trigger audit_runs_review_gate before update on public.audit_runs
for each row execute function private.enforce_audit_review_gates();
drop trigger if exists audit_reports_review_gate on public.audit_reports;
create trigger audit_reports_review_gate before insert or update on public.audit_reports
for each row execute function private.enforce_audit_review_gates();
drop trigger if exists audit_requests_review_gate on public.audit_requests;
create trigger audit_requests_review_gate before update on public.audit_requests
for each row execute function private.enforce_audit_review_gates();

create or replace function public.submit_audit_request_v1(
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
  p_idempotency_key text default null
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
  v_fingerprint_hash text;
  v_idempotency_hash text;
  v_intake_secret text;
  v_existing_request public.audit_requests%rowtype;
  v_restaurant_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_reference text;
  v_recent_count integer;
begin
  select hmac_secret into v_intake_secret
  from private.audit_intake_config where singleton = true;
  if v_intake_secret is null
     or nullif(btrim(coalesce(p_fingerprint, '')), '') is null
     or nullif(btrim(coalesce(p_intake_token, '')), '') is null
     or encode(hmac(btrim(p_fingerprint), v_intake_secret, 'sha256'), 'hex') <> btrim(p_intake_token) then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if nullif(btrim(coalesce(p_honeypot, '')), '') is not null then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if p_form_started_at is null
     or p_form_started_at > now()
     or p_form_started_at < now() - interval '2 hours'
     or now() - p_form_started_at < interval '3 seconds' then
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
  if char_length(btrim(coalesce(p_idempotency_key, ''))) not between 16 and 128 then
    raise exception using errcode = '22023', message = 'submission_rejected';
  end if;
  if v_email is not null and v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception using errcode = '22023', message = 'invalid_contact';
  end if;
  if (v_website is not null and v_website !~* '^https?://')
     or (v_google is not null and v_google !~* '^https?://') then
    raise exception using errcode = '22023', message = 'invalid_url';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(coalesce(v_email, v_phone), 0));
  v_idempotency_hash := encode(digest(btrim(p_idempotency_key), 'sha256'), 'hex');
  select * into v_existing_request from public.audit_requests
  where idempotency_hash = v_idempotency_hash
    and created_at >= now() - interval '7 days'
  limit 1;
  if v_existing_request.id is not null then
    return query select v_existing_request.id, v_existing_request.reference_code, v_existing_request.status::text;
    return;
  end if;
  if v_email is not null then
    select count(*) into v_recent_count
    from public.audit_requests
    where lower(contact_email) = v_email and created_at >= now() - interval '15 minutes';
    if v_recent_count >= 3 then
      raise exception using errcode = 'P0001', message = 'rate_limited';
    end if;
  end if;

  v_fingerprint_hash := encode(digest(btrim(p_fingerprint), 'sha256'), 'hex');
  select count(*) into v_recent_count
  from public.audit_requests
  where intake_fingerprint_hash = v_fingerprint_hash
    and created_at >= now() - interval '24 hours';
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
  )
  on conflict (normalized_name, normalized_city, normalized_state)
  do nothing
  returning id into v_restaurant_id;

  if v_restaurant_id is null then
    select id into v_restaurant_id
    from public.audit_restaurants
    where normalized_name = lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', ' ', 'g'))
      and normalized_city = lower(regexp_replace(v_city, '[^a-zA-Z0-9]+', ' ', 'g'))
      and normalized_state = lower(v_state);
  end if;

  v_reference := 'VA-' || upper(substr(replace(v_request_id::text, '-', ''), 1, 10));
  insert into public.audit_requests (
    id, reference_code, audit_restaurant_id, source, status, contact_name,
    contact_email, contact_phone, contact_note, consent_to_contact,
    consent_version, consent_at, idempotency_hash, intake_fingerprint_hash
  ) values (
    v_request_id, v_reference, v_restaurant_id, 'public_intake', 'new',
    nullif(btrim(coalesce(p_contact_name, '')), ''), v_email, v_phone,
    nullif(btrim(coalesce(p_contact_note, '')), ''), true,
    btrim(p_consent_version), now(), v_idempotency_hash, v_fingerprint_hash
  );

  insert into public.audit_runs (
    audit_request_id, run_number, status, source_snapshot
  ) values (
    v_request_id, 1, 'queued', jsonb_build_object(
      'website_url', v_website,
      'google_profile_url', v_google,
      'submitted_at', now(),
      'source', 'public_intake'
    )
  );

  insert into public.audit_events (audit_request_id, event_type, event_data)
  values (v_request_id, 'public_request_created', jsonb_build_object('reference_code', v_reference));

  return query select v_request_id, v_reference, 'new'::text;
end;
$$;

create or replace function public.create_team_audit_v1(
  p_restaurant_name text,
  p_city text,
  p_state text,
  p_website_url text default null,
  p_google_profile_url text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_team_note text default null
)
returns table(request_id uuid, reference_code text, request_status text)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_name text := btrim(coalesce(p_restaurant_name, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_state text := btrim(coalesce(p_state, ''));
  v_restaurant_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_reference text;
begin
  if not public.veroxa_current_user_is_active_team() then
    raise exception using errcode = '42501', message = 'team_access_required';
  end if;
  if char_length(v_name) not between 2 and 160
     or char_length(v_city) not between 2 and 100
     or char_length(v_state) not between 2 and 40 then
    raise exception using errcode = '22023', message = 'invalid_restaurant_identity';
  end if;

  insert into public.audit_restaurants (
    restaurant_name, normalized_name, city, normalized_city, state,
    normalized_state, website_url, google_profile_url, phone, source
  ) values (
    v_name, lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_city, lower(regexp_replace(v_city, '[^a-zA-Z0-9]+', ' ', 'g')),
    v_state, lower(v_state), nullif(btrim(coalesce(p_website_url, '')), ''),
    nullif(btrim(coalesce(p_google_profile_url, '')), ''),
    nullif(btrim(coalesce(p_contact_phone, '')), ''), 'team_manual'
  )
  on conflict (normalized_name, normalized_city, normalized_state)
  do update set
    website_url = coalesce(excluded.website_url, public.audit_restaurants.website_url),
    google_profile_url = coalesce(excluded.google_profile_url, public.audit_restaurants.google_profile_url),
    phone = coalesce(excluded.phone, public.audit_restaurants.phone)
  returning id into v_restaurant_id;

  v_reference := 'VA-' || upper(substr(replace(v_request_id::text, '-', ''), 1, 10));
  insert into public.audit_requests (
    id, reference_code, audit_restaurant_id, source, status, contact_email, contact_phone
  ) values (
    v_request_id, v_reference, v_restaurant_id, 'team_manual', 'new',
    nullif(lower(btrim(coalesce(p_contact_email, ''))), ''),
    nullif(btrim(coalesce(p_contact_phone, '')), '')
  );
  insert into public.audit_runs (audit_request_id, run_number, status, source_snapshot)
  values (v_request_id, 1, 'queued', jsonb_build_object('source', 'team_manual', 'created_at', now()));
  if nullif(btrim(coalesce(p_team_note, '')), '') is not null then
    insert into public.audit_notes (audit_request_id, body, created_by)
    values (v_request_id, btrim(p_team_note), auth.uid());
  end if;
  insert into public.audit_events (audit_request_id, event_type, event_data, actor_user_id)
  values (v_request_id, 'team_audit_created', jsonb_build_object('reference_code', v_reference), auth.uid());
  return query select v_request_id, v_reference, 'new'::text;
end;
$$;

create or replace function public.start_audit_rerun_v1(p_audit_request_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_previous public.audit_runs%rowtype;
  v_new_id uuid;
begin
  if not public.veroxa_current_user_is_active_team() then
    raise exception using errcode = '42501', message = 'team_access_required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_audit_request_id::text, 0));
  select * into v_previous from public.audit_runs
  where audit_request_id = p_audit_request_id
  order by run_number desc limit 1 for update;
  if v_previous.id is null then
    raise exception using errcode = '22023', message = 'audit_request_not_found';
  end if;
  insert into public.audit_runs (
    audit_request_id, previous_run_id, run_number, status, source_snapshot
  ) values (
    p_audit_request_id, v_previous.id, v_previous.run_number + 1, 'queued',
    jsonb_build_object('source', 'team_rerun', 'requested_at', now())
  ) returning id into v_new_id;
  update public.audit_requests set status = 'in_review' where id = p_audit_request_id;
  insert into public.audit_events (audit_request_id, event_type, event_data, actor_user_id)
  values (p_audit_request_id, 'audit_rerun_created', jsonb_build_object('run_id', v_new_id), auth.uid());
  return v_new_id;
end;
$$;

revoke all on function public.submit_audit_request_v1(text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,text,text,text,text) from public;
revoke all on function public.submit_audit_request_v1(text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,text,text,text,text) from authenticated;
grant execute on function public.submit_audit_request_v1(text,text,text,text,text,text,text,text,text,boolean,text,timestamptz,text,text,text,text) to anon;
revoke all on function public.create_team_audit_v1(text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_team_audit_v1(text,text,text,text,text,text,text,text) to authenticated;
revoke all on function public.start_audit_rerun_v1(uuid) from public, anon;
grant execute on function public.start_audit_rerun_v1(uuid) to authenticated;

comment on table public.audit_restaurants is
  'Non-client restaurants tracked only for Team audit work. Rows never create an operational client or restaurant workspace.';
comment on table public.audit_requests is
  'Durable Audit Center intake and Team queue. An audited restaurant does not become an operational client; no trigger or foreign key performs conversion.';
comment on function public.submit_audit_request_v1 is
  'Validated, rate-limited public audit intake. Returns a reference only and exposes no stored contact or Team data.';
