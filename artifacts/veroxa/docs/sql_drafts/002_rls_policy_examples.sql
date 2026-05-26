-- =============================================================================
-- DO NOT RUN — RLS PLANNING EXAMPLES ONLY
-- =============================================================================
-- This file is documentation. It is NOT a migration.
-- It is NOT located in any supabase/migrations folder.
-- Do not execute against any database (dev, staging, or production).
--
-- See docs/SUPABASE_RLS_PLAN_V1.md for the full plan and rationale.
--
-- AUTH_MODE remains "placeholder" until the real schema is shipped and the
-- auth activation checklist (Part 7 of the plan) is fully passed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions (sketches — implement in schema `private` later)
-- -----------------------------------------------------------------------------
--
-- SECURITY DEFINER SAFETY RULES — every helper below MUST:
--   * live in an explicit non-public schema (e.g. `private`)
--   * be marked `security definer` and `stable` (or `immutable`) where possible
--   * `set search_path = pg_catalog, public` explicitly to defeat search_path
--     hijacking by a hostile session
--   * never raise an exception to the caller — return null/false on missing data
--   * never use `execute` / dynamic SQL
--   * read only from schema-controlled tables (`user_profiles`,
--     `team_members`, `team_client_assignments`, `clients`) — never from a
--     user-writable table whose contents could be poisoned
--   * have a unit-test pass against fixtures for: anon, service role, one user
--     per role, and a user whose row was deleted, BEFORE any policy references
--     them
-- -----------------------------------------------------------------------------

-- create or replace function private.current_user_role()
-- returns text
-- language sql stable security definer
-- set search_path = pg_catalog, public
-- as $$
--   select role from public.user_profiles where id = auth.uid();
-- $$;

-- create or replace function private.current_user_client_id()
-- returns uuid
-- language sql stable security definer
-- set search_path = pg_catalog, public
-- as $$
--   select case
--     when private.current_user_role() = 'client'
--     then client_id
--     else null
--   end
--   from public.user_profiles
--   where id = auth.uid();
-- $$;

-- create or replace function private.is_owner()
-- returns boolean language sql stable security definer
-- set search_path = pg_catalog, public
-- as $$ select private.current_user_role() = 'owner' $$;

-- create or replace function private.is_operator()
-- returns boolean language sql stable security definer
-- set search_path = pg_catalog, public
-- as $$ select private.current_user_role() in ('operator','owner') $$;

-- -- Reads team_client_assignments (NOT a uuid[] on team_members).
-- -- Operator/owner short-circuits true. Team users check the join table for
-- -- an ACTIVE row. Clients always return false here (they use a different
-- -- ownership helper).
-- create or replace function private.is_assigned_to_client(p_client uuid)
-- returns boolean
-- language sql stable security definer
-- set search_path = pg_catalog, public
-- as $$
--   select
--     private.is_operator()
--     or exists (
--       select 1 from public.clients c
--       where c.id = p_client and c.assigned_operator_id = auth.uid()
--     )
--     or exists (
--       select 1
--       from public.team_client_assignments tca
--       join public.team_members           tm  on tm.id = tca.team_member_id
--       join public.user_profiles          up  on up.id = tm.user_profile_id
--       where up.id        = auth.uid()
--         and tca.client_id = p_client
--         and tca.is_active = true
--     );
-- $$;

-- create or replace function private.can_view_client(p_client uuid)
-- returns boolean language sql stable security definer
-- as $$
--   select
--     (private.current_user_role() = 'client' and private.current_user_client_id() = p_client)
--     or private.is_assigned_to_client(p_client);
-- $$;

-- -----------------------------------------------------------------------------
-- Enable RLS — required on every table
-- -----------------------------------------------------------------------------

-- alter table public.user_profiles            enable row level security;
-- alter table public.team_members             enable row level security;
-- alter table public.team_client_assignments  enable row level security;
-- alter table public.clients                  enable row level security;
-- alter table public.client_platforms         enable row level security;
-- alter table public.onboarding_items         enable row level security;
-- alter table public.media_assets             enable row level security;
-- alter table public.content_concepts         enable row level security;
-- alter table public.draft_sets               enable row level security;
-- alter table public.draft_variants           enable row level security;
-- alter table public.posts                    enable row level security;
-- alter table public.post_slots               enable row level security;
-- alter table public.notifications            enable row level security;
-- alter table public.weekly_reports           enable row level security;
-- alter table public.monthly_reports          enable row level security;
-- alter table public.activity_logs            enable row level security;
-- alter table public.client_requests          enable row level security;
-- alter table public.client_health_snapshots  enable row level security;
-- alter table public.ai_agents                enable row level security;
-- alter table public.financial_snapshots      enable row level security;
-- alter table public.system_status            enable row level security;

-- -----------------------------------------------------------------------------
-- clients — example policies
-- -----------------------------------------------------------------------------

-- -- 1. Clients see their own row only.
-- create policy clients_select_own
--   on public.clients for select
--   using (private.current_user_role() = 'client'
--          and id = private.current_user_client_id());

-- -- 2. Team users see assigned clients only.
-- create policy clients_select_team_assigned
--   on public.clients for select
--   using (private.current_user_role() = 'team'
--          and private.is_assigned_to_client(id));

-- -- 3. Operator and Owner see all clients.
-- create policy clients_select_staff
--   on public.clients for select
--   using (private.is_operator());

-- -- 4. Clients may update only their own contact fields.
-- create policy clients_update_own_contact
--   on public.clients for update
--   using  (private.current_user_role() = 'client'
--           and id = private.current_user_client_id())
--   with check (private.current_user_role() = 'client'
--           and id = private.current_user_client_id());
-- -- (column-level: enforce in app or with a separate trigger that rejects
-- --  changes to plan_type / service_package / monthly_fee_cents / account_status)

-- -- 5. Pricing fields — Owner only. (Implemented as a BEFORE UPDATE trigger
-- --    that raises if non-owner changes the protected columns; RLS does not
-- --    natively support column-level write restrictions.)
-- -- create trigger clients_pricing_owner_only
-- --   before update of plan_type, service_package, monthly_fee_cents
-- --   on public.clients
-- --   for each row execute function private.assert_owner();

-- -- 6. Owner full update / insert / delete.
-- create policy clients_owner_all
--   on public.clients for all
--   using (private.is_owner())
--   with check (private.is_owner());

-- -----------------------------------------------------------------------------
-- media_assets — example policies
-- -----------------------------------------------------------------------------

-- -- 1. Client sees own media (safe columns only — wrap in a view for the
-- --    client portal that omits rejection_reason).
-- create policy media_assets_select_own
--   on public.media_assets for select
--   using (private.current_user_role() = 'client'
--          and client_id = private.current_user_client_id());

-- -- 2. Team/Operator/Owner see assigned (or all) clients' media.
-- create policy media_assets_select_staff
--   on public.media_assets for select
--   using (private.can_view_client(client_id));

-- -- 3. Client can INSERT only their own client_upload media in 'uploaded' state.
-- create policy media_assets_insert_client_upload
--   on public.media_assets for insert
--   with check (
--     private.current_user_role() = 'client'
--     and client_id     = private.current_user_client_id()
--     and source_type   = 'client_upload'
--     and review_status = 'uploaded'
--   );

-- -- 4. Team can update review fields on assigned clients' media.
-- create policy media_assets_update_team
--   on public.media_assets for update
--   using  (private.is_assigned_to_client(client_id))
--   with check (private.is_assigned_to_client(client_id));

-- -----------------------------------------------------------------------------
-- monthly_reports — example operator-approval policy
-- -----------------------------------------------------------------------------

-- -- 1. Client sees only published.
-- create policy monthly_reports_select_client_published
--   on public.monthly_reports for select
--   using (private.current_user_role() = 'client'
--          and client_id = private.current_user_client_id()
--          and status = 'published');

-- -- 2. Team sees assigned (any status, read-only).
-- create policy monthly_reports_select_team
--   on public.monthly_reports for select
--   using (private.current_user_role() = 'team'
--          and private.is_assigned_to_client(client_id));

-- -- 3. Operator + Owner can SELECT all and UPDATE status transitions.
-- create policy monthly_reports_staff_all
--   on public.monthly_reports for all
--   using (private.is_operator())
--   with check (private.is_operator());

-- -- 4. Status-transition gate (illustrative — better enforced in a trigger
-- --    that knows the previous value and allowed next values):
-- --      drafting        -> operator_review (team or operator)
-- --      operator_review -> approved        (operator/owner)
-- --      approved        -> published       (operator/owner)
-- --    Each transition must also INSERT an activity_logs row.

-- -----------------------------------------------------------------------------
-- activity_logs — append-only example
-- -----------------------------------------------------------------------------

-- -- 1. No UPDATE, no DELETE — ever.
-- create policy activity_logs_no_update on public.activity_logs for update using (false);
-- create policy activity_logs_no_delete on public.activity_logs for delete using (false);

-- -- 2. Client cannot SELECT. Team can read assigned-client rows.
-- create policy activity_logs_select_team
--   on public.activity_logs for select
--   using (private.current_user_role() = 'team'
--          and client_id is not null
--          and private.is_assigned_to_client(client_id));

-- -- 3. Operator/Owner read all.
-- create policy activity_logs_select_staff
--   on public.activity_logs for select
--   using (private.is_operator());

-- -- 4. INSERT allowed for operator/owner with role attribution, and the
-- --    service role bypasses RLS for triggered / cron writes.
-- create policy activity_logs_insert_staff
--   on public.activity_logs for insert
--   with check (private.is_operator()
--               and performed_by_user_id = auth.uid()
--               and performed_by_role    = private.current_user_role());

-- -----------------------------------------------------------------------------
-- financial_snapshots — owner write, operator read, others blocked
-- -----------------------------------------------------------------------------

-- create policy financial_snapshots_select_staff
--   on public.financial_snapshots for select
--   using (private.is_operator());

-- create policy financial_snapshots_owner_write
--   on public.financial_snapshots for all
--   using (private.is_owner())
--   with check (private.is_owner());

-- -----------------------------------------------------------------------------
-- user_profiles — self + owner manage; role changes must be audited
-- -----------------------------------------------------------------------------

-- create policy user_profiles_select_self
--   on public.user_profiles for select
--   using (id = auth.uid());

-- create policy user_profiles_select_staff
--   on public.user_profiles for select
--   using (private.is_operator());

-- create policy user_profiles_update_self_safe
--   on public.user_profiles for update
--   using  (id = auth.uid())
--   with check (id = auth.uid());
-- -- (column-level: enforce in trigger — only display_name, avatar_url
-- --  may be self-updated; role/is_active/client_id are owner-only)

-- create policy user_profiles_owner_all
--   on public.user_profiles for all
--   using (private.is_owner())
--   with check (private.is_owner());

-- =============================================================================
-- Reminder: these are EXAMPLES, not the finished policy set. The real
-- migration must include: every table, every CRUD operation, regression
-- tests for every role-vs-table cell of the matrix in Part 3, and the
-- activity_logs audit triggers from Part 9.
-- =============================================================================
