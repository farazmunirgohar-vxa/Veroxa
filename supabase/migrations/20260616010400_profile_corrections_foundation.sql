-- PR #104 — Live Automation V1 Profile Corrections Foundation
-- Adds conservative write policies for internal Veroxa profile correction review.
-- Does not activate AUTH_MODE="real" and does not publish to any public platform.

alter table public.profile_corrections enable row level security;
alter table public.restaurant_profile_fields enable row level security;

create or replace function public.profile_correction_insert_is_safe(
  correction_restaurant_id uuid,
  correction_status public.profile_correction_status,
  correction_requested_by uuid,
  correction_reviewed_by uuid,
  correction_review_note text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurant_members rm
    join public.restaurants r on r.id = rm.restaurant_id
    join public.user_profiles up on up.user_id = auth.uid()
    where rm.restaurant_id = correction_restaurant_id
      and rm.user_id = auth.uid()
      and rm.role = 'client'::public.veroxa_role
      and rm.status = 'active'::public.veroxa_account_status
      and r.status = 'active'::public.veroxa_account_status
      and up.role = 'client'::public.veroxa_role
      and up.status = 'active'::public.veroxa_account_status
  )
  and correction_status = 'requested'::public.profile_correction_status
  and correction_requested_by = auth.uid()
  and correction_reviewed_by is null
  and correction_review_note is null;
$$;

create or replace function public.profile_correction_team_update_is_safe(
  correction_status public.profile_correction_status,
  correction_reviewed_by uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_active_team()
    and correction_status in ('under_veroxa_review','approved','rejected','needs_owner_input')
    and correction_reviewed_by = auth.uid();
$$;

drop policy if exists profile_corrections_client_insert_requested on public.profile_corrections;
create policy profile_corrections_client_insert_requested
  on public.profile_corrections
  for insert
  to authenticated
  with check (public.profile_correction_insert_is_safe(restaurant_id, status, requested_by, reviewed_by, review_note));

drop policy if exists profile_corrections_team_update_review on public.profile_corrections;
create policy profile_corrections_team_update_review
  on public.profile_corrections
  for update
  to authenticated
  using (public.current_user_is_active_team())
  with check (public.profile_correction_team_update_is_safe(status, reviewed_by));

drop policy if exists restaurant_profile_fields_team_update_internal_value on public.restaurant_profile_fields;
create policy restaurant_profile_fields_team_update_internal_value
  on public.restaurant_profile_fields
  for update
  to authenticated
  using (public.current_user_is_active_team())
  with check (public.current_user_is_active_team());

comment on policy profile_corrections_client_insert_requested on public.profile_corrections is
  'PR #104: active clients may request corrections only for their active restaurant; status must remain requested and review fields must be empty.';
comment on policy profile_corrections_team_update_review on public.profile_corrections is
  'PR #104: active team may review correction status/review fields. This is not public/platform publishing.';
comment on policy restaurant_profile_fields_team_update_internal_value on public.restaurant_profile_fields is
  'PR #104: active team may approve corrections into internal Veroxa profile records only; no external platforms are updated.';
