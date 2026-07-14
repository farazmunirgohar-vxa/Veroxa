
do $migration$
declare
  v_ddl text;
begin
  select pg_get_functiondef(p.oid)
  into v_ddl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'validate_generated_audit_v2';

  if v_ddl is null then raise exception 'audit_validator_not_found'; end if;

  v_ddl := replace(v_ddl, 'restaurant-audit-v2', 'restaurant-audit-v3');
  v_ddl := replace(
    v_ddl,
    $$This is a provisional online-presence assessment based only on explicitly confirmed or unknown Team-reviewed signals. It does not guarantee rankings, customers, orders, revenue, profit, ROI, or any other outcome. Unknown signals require verification before the audit is treated as complete.$$,
    $$This is a provisional online-presence assessment based only on cited public evidence and Team-reviewed signals. Scores may be partial when a system exists but has verified weaknesses. It does not guarantee rankings, customers, orders, revenue, profit, ROI, or any other outcome. Unknown signals require verification before the audit is treated as complete.$$
  );
  v_ddl := replace(
    v_ddl,
    $old$(p_score_snapshot ->> 'schemaVersion')::numeric <> 2$old$,
    $new$(p_score_snapshot ->> 'schemaVersion')::numeric <> 3$new$
  );
  v_ddl := replace(
    v_ddl,
    $old$v_score <> (case when v_status = 'confirmed_present' then v_weight else 0 end)$old$,
    $new$(
         v_score < 0
         or (v_status = 'unknown' and v_score <> 0)
         or (v_status = 'confirmed_present' and v_score <> v_weight)
         or (v_status = 'confirmed_missing' and v_score >= v_weight)
       )$new$
  );
  v_ddl := replace(v_ddl, $old$'weight', v_weight,$old$, $new$'weight', v_weight - v_score,$new$);
  v_ddl := replace(
    v_ddl,
    $old$'potentialPoints', (v_definition ->> 'weight')::integer,$old$,
    $new$'potentialPoints', ((v_definition ->> 'weight')::integer - (v_category ->> 'score')::integer),$new$
  );
  execute v_ddl;
end
$migration$;

do $migration$
declare
  v_name text;
  v_ddl text;
begin
  foreach v_name in array array[
    'save_team_generated_audit_v2',
    'complete_team_generated_audit_run_v2',
    'save_team_generated_audit_rerun_v2'
  ]
  loop
    select pg_get_functiondef(p.oid)
    into v_ddl
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = v_name;
    if v_ddl is null then raise exception 'audit_save_function_not_found:%', v_name; end if;
    v_ddl := replace(v_ddl, 'restaurant-audit-v2', 'restaurant-audit-v3');
    execute v_ddl;
  end loop;
end
$migration$;
