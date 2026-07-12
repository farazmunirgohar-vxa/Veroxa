begin;
create extension if not exists pgtap with schema extensions;
select plan(1);

select lives_ok($test$
do $$
declare
  table_name text;
  unsafe_count integer;
  safe_count integer;
  row_count integer;
begin
  foreach table_name in array array[
    'clients', 'restaurant_upload_keys', 'upload_submissions',
    'direction_requests', 'team_review_decisions'
  ] loop
    execute format('create table if not exists public.%I (id integer primary key, marker text)', table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('insert into public.%I (id, marker) values (1, %L) on conflict (id) do nothing', table_name, table_name);
    execute format('create policy %I on public.%I for select to authenticated using (false)', table_name || '_safe_policy', table_name);
  end loop;

  create policy clients_dev_authenticated_select on public.clients for select to authenticated using (true);
  create policy restaurant_upload_keys_dev_authenticated_select on public.restaurant_upload_keys for select to authenticated using (true);
  create policy upload_submissions_dev_authenticated_select on public.upload_submissions for select to authenticated using (true);
  create policy upload_submissions_dev_authenticated_insert on public.upload_submissions for insert to authenticated with check (true);
  create policy upload_submissions_dev_authenticated_update on public.upload_submissions for update to authenticated using (true) with check (true);
  create policy direction_requests_dev_authenticated_select on public.direction_requests for select to authenticated using (true);
  create policy direction_requests_dev_authenticated_insert on public.direction_requests for insert to authenticated with check (true);
  create policy direction_requests_dev_authenticated_update on public.direction_requests for update to authenticated using (true) with check (true);
  create policy team_review_decisions_dev_authenticated_select on public.team_review_decisions for select to authenticated using (true);
  create policy team_review_decisions_dev_authenticated_insert on public.team_review_decisions for insert to authenticated with check (true);

  perform private.remove_unsafe_legacy_dev_policies();

  select count(*) into unsafe_count from pg_policies
  where schemaname = 'public' and policyname in (
    'clients_dev_authenticated_select',
    'restaurant_upload_keys_dev_authenticated_select',
    'upload_submissions_dev_authenticated_select',
    'upload_submissions_dev_authenticated_insert',
    'upload_submissions_dev_authenticated_update',
    'direction_requests_dev_authenticated_select',
    'direction_requests_dev_authenticated_insert',
    'direction_requests_dev_authenticated_update',
    'team_review_decisions_dev_authenticated_select',
    'team_review_decisions_dev_authenticated_insert'
  );
  if unsafe_count <> 0 then raise exception 'unsafe legacy policies remain: %', unsafe_count; end if;

  select count(*) into safe_count from pg_policies
  where schemaname = 'public' and policyname like '%_safe_policy';
  if safe_count <> 5 then raise exception 'unrelated safe policies were removed'; end if;

  foreach table_name in array array[
    'clients', 'restaurant_upload_keys', 'upload_submissions',
    'direction_requests', 'team_review_decisions'
  ] loop
    execute format('select count(*) from public.%I where id = 1', table_name) into row_count;
    if row_count <> 1 then raise exception 'legacy row was removed from %', table_name; end if;
  end loop;
end $$;
$test$, 'legacy policy cleanup removes exactly the unsafe policies and preserves data/safe policies');

select * from finish();
rollback;
