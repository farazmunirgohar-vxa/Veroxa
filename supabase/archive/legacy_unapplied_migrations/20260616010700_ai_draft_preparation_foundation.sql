-- Live Automation V1 PR #106 AI Draft Preparation Foundation.
-- Internal drafts only: no raw client-visible AI output, public publishing, report generation,
-- external integrations, payments, webhooks, cron jobs, or background jobs.

alter table public.ai_drafts enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ai_drafts_draft_text_nonempty') then
    alter table public.ai_drafts add constraint ai_drafts_draft_text_nonempty check (length(btrim(draft_text)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ai_drafts_draft_type_safe') then
    alter table public.ai_drafts add constraint ai_drafts_draft_type_safe check (draft_type in (
      'media_summary', 'caption_draft', 'google_update_draft', 'social_caption_draft',
      'message_reply_draft', 'profile_correction_summary', 'report_draft_placeholder', 'next_step_recommendation'
    ));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ai_drafts_status_safe') then
    alter table public.ai_drafts add constraint ai_drafts_status_safe check (status in (
      'drafted'::public.ai_draft_status,
      'ready_for_faraz_review'::public.ai_draft_status,
      'approved'::public.ai_draft_status,
      'rejected'::public.ai_draft_status,
      'held'::public.ai_draft_status,
      'needs_owner_input'::public.ai_draft_status
    ));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ai_drafts_source_entity_type_safe') then
    alter table public.ai_drafts add constraint ai_drafts_source_entity_type_safe check (
      source_entity_type is null or source_entity_type in ('media_asset', 'message', 'profile_correction', 'activity_log', 'restaurant_profile_field')
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ai_drafts_safety_flags_required') then
    alter table public.ai_drafts add constraint ai_drafts_safety_flags_required check (
      safety_flags is not null
      and jsonb_typeof(safety_flags) = 'array'
      and jsonb_array_length(safety_flags) >= 1
      and safety_flags <@ '["ready_for_faraz_review", "needs_owner_input", "business_truth_confirmation_required", "low_confidence"]'::jsonb
    );
  end if;
end $$;

drop policy if exists ai_drafts_active_team_select on public.ai_drafts;
drop policy if exists ai_drafts_active_team_insert on public.ai_drafts;
drop policy if exists ai_drafts_active_team_safe_update on public.ai_drafts;
drop policy if exists ai_drafts_active_client_select on public.ai_drafts;

create policy ai_drafts_active_team_select on public.ai_drafts
  for select to authenticated
  using (public.current_user_is_active_team());

create policy ai_drafts_active_team_insert on public.ai_drafts
  for insert to authenticated
  with check (
    public.current_user_is_active_team()
    and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'active')
    and length(btrim(draft_text)) > 0
    and draft_type in ('media_summary', 'caption_draft', 'google_update_draft', 'social_caption_draft', 'message_reply_draft', 'profile_correction_summary', 'report_draft_placeholder', 'next_step_recommendation')
    and status in ('drafted'::public.ai_draft_status, 'ready_for_faraz_review'::public.ai_draft_status, 'approved'::public.ai_draft_status, 'rejected'::public.ai_draft_status, 'held'::public.ai_draft_status, 'needs_owner_input'::public.ai_draft_status)
    and safety_flags is not null
    and jsonb_typeof(safety_flags) = 'array'
    and jsonb_array_length(safety_flags) >= 1
    and safety_flags <@ '["ready_for_faraz_review", "needs_owner_input", "business_truth_confirmation_required", "low_confidence"]'::jsonb
  );

create policy ai_drafts_active_team_safe_update on public.ai_drafts
  for update to authenticated
  using (public.current_user_is_active_team())
  with check (
    public.current_user_is_active_team()
    and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'active')
    and length(btrim(draft_text)) > 0
    and status in ('drafted'::public.ai_draft_status, 'ready_for_faraz_review'::public.ai_draft_status, 'approved'::public.ai_draft_status, 'rejected'::public.ai_draft_status, 'held'::public.ai_draft_status, 'needs_owner_input'::public.ai_draft_status)
    and safety_flags is not null
    and jsonb_typeof(safety_flags) = 'array'
    and jsonb_array_length(safety_flags) >= 1
  );

comment on table public.ai_drafts is 'Live Automation V1 PR #106 AI Draft Preparation Foundation: internal Team-only draft records. Existing approved status means internal review only and drafts never publish themselves.';

-- Limit authenticated browser updates to review-safe status fields. Draft text and source context
-- are created as new internal draft records instead of being silently rewritten by status actions.
revoke update on public.ai_drafts from authenticated;
grant select, insert on public.ai_drafts to authenticated;
grant update (status, updated_at) on public.ai_drafts to authenticated;
