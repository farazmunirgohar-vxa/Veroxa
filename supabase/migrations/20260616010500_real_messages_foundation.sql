-- PR #104 Real Messages / Portal Threads Foundation.
-- Adds safe write policies for restaurant-scoped portal messages only.
-- Does not activate AUTH_MODE="real", activity_log writes, AI, external messaging, publishing, payments, webhooks, cron jobs, or background jobs.

alter table public.messages
  add constraint messages_body_trimmed_nonempty check (length(btrim(body)) > 0) not valid;

alter table public.messages validate constraint messages_body_trimmed_nonempty;

create policy messages_active_client_insert on public.messages
for insert to authenticated
with check (
  public.current_user_has_active_restaurant(restaurant_id)
  and sender_user_id = auth.uid()
  and sender_role = 'client'::public.veroxa_role
  and status = 'unread'::public.message_status
  and length(btrim(body)) > 0
);

create policy messages_active_team_insert on public.messages
for insert to authenticated
with check (
  public.current_user_is_active_team()
  and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = 'active'::public.veroxa_account_status)
  and sender_user_id = auth.uid()
  and sender_role = 'team'::public.veroxa_role
  and status = 'unread'::public.message_status
  and length(btrim(body)) > 0
);

create policy messages_active_team_status_update on public.messages
for update to authenticated
using (public.current_user_is_active_team())
with check (
  public.current_user_is_active_team()
  and status in ('read'::public.message_status, 'resolved'::public.message_status)
  and length(btrim(body)) > 0
);

comment on table public.messages is 'PR #104 portal-only client/team messages. Not SMS, email, DMs, comments, customer-service inbox handling, activity log runtime, AI, publishing, or external integrations.';

create or replace function public.enforce_message_status_only_update()
returns trigger language plpgsql as $$
begin
  if new.id <> old.id
    or new.restaurant_id <> old.restaurant_id
    or new.sender_user_id is distinct from old.sender_user_id
    or new.sender_role is distinct from old.sender_role
    or new.body <> old.body
    or new.created_at <> old.created_at then
    raise exception 'Only message status updates are allowed after insert.';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists messages_status_only_update on public.messages;
create trigger messages_status_only_update
before update on public.messages
for each row execute function public.enforce_message_status_only_update();
