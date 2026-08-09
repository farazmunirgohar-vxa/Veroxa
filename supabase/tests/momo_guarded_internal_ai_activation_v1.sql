-- The activation migration installs a dormant postgres-only routine. This
-- suite never restores grants, flips a runtime flag, or calls a provider.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select has_function(
  'veroxa_private',
  'activate_momo_internal_ai_v1',
  array[
    'text', 'integer', 'text', 'text', 'text', 'text',
    'integer', 'uuid', 'text'
  ],
  'postgres-only activation routine is installed'
);

select ok(
  (
    select procedure.prosecdef
      and pg_catalog.pg_get_userbyid(procedure.proowner) = 'postgres'
      and procedure.proconfig is not distinct from
        array['search_path=""']::text[]
    from pg_catalog.pg_proc procedure
    where procedure.oid = pg_catalog.to_regprocedure(
      'veroxa_private.activate_momo_internal_ai_v1(text,integer,text,text,text,text,integer,uuid,text)'
    )
  ),
  'activation routine is postgres-owned, security-definer, and empty-path'
);

select ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'veroxa_private.activate_momo_internal_ai_v1(text,integer,text,text,text,text,integer,uuid,text)',
    'execute'
  )
  and not pg_catalog.has_function_privilege(
    'authenticated',
    'veroxa_private.activate_momo_internal_ai_v1(text,integer,text,text,text,text,integer,uuid,text)',
    'execute'
  )
  and not pg_catalog.has_function_privilege(
    'service_role',
    'veroxa_private.activate_momo_internal_ai_v1(text,integer,text,text,text,text,integer,uuid,text)',
    'execute'
  ),
  'no application role can invoke activation'
);

select throws_ok(
  $call$
  select veroxa_private.activate_momo_internal_ai_v1(
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    41,
    'appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'cccccccccccccccccccccccccccccccccccccccc',
    'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    7,
    '859c73c3-2102-41b4-9da1-20582acb7212'::uuid,
    'a6b00feeab795faa91d6d8d015c4ad399c526e1b35f702778a8c55aaba49503d'
  )
  $call$,
  '55000',
  'momo_internal_ai_runtime_hold_invalid',
  'routine fails closed without the exact locked Momo runtime row'
);

select ok(
  pg_catalog.strpos(
    pg_catalog.pg_get_functiondef(pg_catalog.to_regprocedure(
      'veroxa_private.activate_momo_internal_ai_v1(text,integer,text,text,text,text,integer,uuid,text)'
    )),
    'a1c6796b50a1072a96a40db283503d9e2c81bbae'
  ) > 0
  and pg_catalog.strpos(
    pg_catalog.pg_get_functiondef(pg_catalog.to_regprocedure(
      'veroxa_private.activate_momo_internal_ai_v1(text,integer,text,text,text,text,integer,uuid,text)'
    )),
    '4ee8895f68505e8ea79bf3e0f3ea3b2871ca2b2c'
  ) > 0
  and pg_catalog.strpos(
    pg_catalog.pg_get_functiondef(pg_catalog.to_regprocedure(
      'veroxa_private.activate_momo_internal_ai_v1(text,integer,text,text,text,text,integer,uuid,text)'
    )),
    'a6b00feeab795faa91d6d8d015c4ad399c526e1b35f702778a8c55aaba49503d'
  ) > 0,
  'routine is bound to the reviewed first GitHub, Sites, and Edge parity'
);

select * from finish();
rollback;
