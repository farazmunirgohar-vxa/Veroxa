-- =============================================================================
-- DO NOT RUN — MIGRATION REVIEW DRAFT ONLY
--
-- This file is not active.
-- It is not in the Supabase migrations folder.
-- Review and audit before converting into a real migration.
-- AUTH_MODE remains "placeholder".
-- =============================================================================
--
-- Migration 006 — Content / AI Layer (DRAFT)
--
-- Depends on:
--   * Migration 001 (identity + helpers)
--   * Migration 002 (clients + can_view_client / can_manage_client_operations
--                    / current_user_client_id / is_owner / is_operator)
--   * Migration 003 (media_assets — referenced by content_concepts)
--   * Migration 004 (posts — required for posts.concept_id /
--                    posts.draft_variant_id FK additions and for
--                    draft_variants.used_in_post_id)
--
-- Scope (this file):
--   * public.content_concepts
--   * public.draft_sets
--   * public.draft_variants
--   * public.ai_agents
--   * FK additions:
--       - public.posts.concept_id       -> public.content_concepts(id)
--       - public.posts.draft_variant_id -> public.draft_variants(id)
--   * RLS + per-role policies on all four tables
--   * Indexes + updated_at triggers
--   * No client-safe views (all four tables are internal)
--
-- Intentionally NOT in scope:
--   * Real AI provider integrations (OpenAI / Anthropic / Gemini / etc.)
--   * API keys, model credentials, secrets of any kind
--   * Background workers / schedulers / cron
--   * Publishing integrations
--   * Payment / billing tables
--   * Financial snapshots
--   * Activity log writes for content-table transitions (deferred to the
--     hybrid log strategy from SUPABASE_RLS_PLAN_V1.md Part 9)
--   * Any change to AUTH_MODE, auth wiring, portal navigation, pricing
--
-- Source-of-truth references:
--   * docs/MIGRATION_006_CONTENT_AI_LAYER_PLAN.md (this file's blueprint)
--   * docs/MIGRATION_006_TEST_PLAN.md
--   * docs/SUPABASE_SCHEMA_DRAFT_V1.md
--   * docs/SUPABASE_RLS_PLAN_V1.md
--
-- Pricing reference (unchanged from the locked pricing table):
--   GPS                     -> service_package='google_presence_starter'  -> 49700
--   COP 12-month            -> service_package='complete_online_presence' -> 99700
--   COP 6-month             -> service_package='complete_online_presence' -> 109700
--   COP 3-month             -> service_package='complete_online_presence' -> 119700
--   COP no-contract         -> service_package='complete_online_presence' -> 149700
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. content_concepts
-- -----------------------------------------------------------------------------
--
-- One row per content concept idea. Concepts are the AI/staff
-- brainstorm layer above draft sets / draft variants / posts.
--
-- additional_media_ids uuid[] — PostgreSQL CANNOT FK-enforce array
-- elements. Integrity is application-enforced. A future trigger can
-- validate every element resolves to a real media_assets.id owned by
-- the same client_id; flagged as a follow-up in MIGRATION_006_TEST_PLAN.md
-- (issue E4).
--
-- generated_by_agent is text, not a FK to ai_agents.agent_key. This is
-- intentional for V1: agent keys may evolve, and concepts authored by a
-- since-removed/renamed agent must remain readable. If agent keys
-- stabilize, a future migration can promote this to a real FK.

create table public.content_concepts (
  id                    uuid        primary key default gen_random_uuid(),
  client_id             uuid        not null
    references public.clients(id) on delete cascade,
  media_asset_id        uuid        null
    references public.media_assets(id) on delete set null,
  additional_media_ids  uuid[]      null,
  content_angle         text        not null,
  content_goal          text        null
    check (content_goal in ('awareness','engagement','conversion','branding','recovery')),
  hook_style            text        null
    check (hook_style in ('question','bold_statement','story','stat','behind_scenes')),
  cta_direction         text        null
    check (cta_direction in ('visit','order','book','follow','share','none')),
  status                text        not null default 'generated'
    check (status in ('generated','under_review','rejected','approved')),
  generated_at          timestamptz null,
  generated_by_agent    text        null,
  reviewed_by_user_id   uuid        null
    references public.user_profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table  public.content_concepts is
  'Concept-level brainstorm. Internal-only (no client RLS). Concepts can be authored by staff or by an AI agent (generated_by_agent). additional_media_ids has no FK enforcement on array elements — integrity is application-side.';
comment on column public.content_concepts.additional_media_ids is
  'Array of media_assets.id values. PostgreSQL cannot FK-enforce array elements; the writer (team / operator / future agent runtime) is responsible for ensuring each id resolves to a media_assets row owned by the same client_id. See MIGRATION_006_TEST_PLAN.md issue E4 for the follow-up validation trigger.';
comment on column public.content_concepts.generated_by_agent is
  'Free-text agent identifier, intentionally NOT a FK to ai_agents.agent_key. Allows the audit trail to survive agent renames / removals.';

create index content_concepts_client_id_idx       on public.content_concepts (client_id);
create index content_concepts_media_asset_id_idx  on public.content_concepts (media_asset_id);
create index content_concepts_status_idx          on public.content_concepts (status);

create trigger content_concepts_set_updated_at
  before update on public.content_concepts
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 2. draft_sets
-- -----------------------------------------------------------------------------
--
-- A draft set groups multiple variant attempts against a single concept
-- (e.g. three different captions for the same concept). Internal-only.

create table public.draft_sets (
  id                  uuid        primary key default gen_random_uuid(),
  concept_id          uuid        not null
    references public.content_concepts(id) on delete cascade,
  generation_version  integer     not null default 1,
  status              text        not null default 'generated'
    check (status in ('generated','under_review','needs_regeneration','approved','archived')),
  team_note           text        null,
  generated_at        timestamptz null,
  generated_by_agent  text        null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table  public.draft_sets is
  'Groups draft_variants generated against a single content_concepts row. generation_version increments per regeneration cycle. Internal-only (no client RLS).';

create index draft_sets_concept_id_idx on public.draft_sets (concept_id);
create index draft_sets_status_idx     on public.draft_sets (status);

create trigger draft_sets_set_updated_at
  before update on public.draft_sets
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 3. draft_variants
-- -----------------------------------------------------------------------------
--
-- Individual caption attempts within a draft set. used_in_post_id is
-- optional and points to the post that ultimately consumed this variant.

create table public.draft_variants (
  id                  uuid        primary key default gen_random_uuid(),
  draft_set_id        uuid        not null
    references public.draft_sets(id) on delete cascade,
  variant_type        text        not null
    check (variant_type in ('safe','engagement','sales')),
  caption_body        text        not null,
  hook_text           text        null,
  cta_text            text        null,
  hashtag_block       text        null,
  brand_voice_score   integer     null,
  status              text        not null default 'generated'
    check (status in ('generated','under_review','approved','archived','used')),
  used_in_post_id     uuid        null
    references public.posts(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table  public.draft_variants is
  'Individual caption/copy attempts within a draft_sets row. variant_type tags the angle (safe / engagement / sales). used_in_post_id is set when a variant is consumed; cascade is set null so deleting a post preserves the variant history.';

create index draft_variants_draft_set_id_idx    on public.draft_variants (draft_set_id);
create index draft_variants_status_idx          on public.draft_variants (status);
create index draft_variants_used_in_post_id_idx on public.draft_variants (used_in_post_id);

create trigger draft_variants_set_updated_at
  before update on public.draft_variants
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 4. ai_agents
-- -----------------------------------------------------------------------------
--
-- Catalog of AI agents (configuration + enable/disable). Owner-only
-- writes. config_json MUST NEVER store secrets / API keys / model
-- credentials. Service role may write last_run_at; nothing else.
--
-- config_json key shape (closes E2 from MIGRATION_006_TEST_PLAN_OUTLINE.md):
--   {
--     "model":              "<placeholder string, e.g. 'demo' | 'rule_based'>",
--     "temperature":        <number, 0..2>,
--     "prompt_template_id": "<text id>",
--     "max_tokens":         <integer>
--   }
-- Any other key is allowed but is considered uncontracted. Real API
-- keys, secrets, or signed URLs MUST NEVER appear in this column —
-- the column is plaintext jsonb visible to any owner.

create table public.ai_agents (
  id            uuid        primary key default gen_random_uuid(),
  agent_key     text        not null unique,
  name          text        not null,
  category      text        not null
    check (category in ('content','operations','intelligence','executive')),
  purpose       text        not null,
  is_enabled    boolean     not null default false,
  mode          text        not null default 'demo'
    check (mode in ('demo','rule_based','api_connected')),
  config_json   jsonb       null,
  last_run_at   timestamptz null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table  public.ai_agents is
  'Catalog of AI agents. is_enabled defaults false so applying M006 cannot silently arm any agent. Owner-only writes on every column except last_run_at (system / service role only). mode=''api_connected'' is reserved for future migrations; M006 ships no runtime.';
comment on column public.ai_agents.config_json is
  'Plaintext jsonb. MUST NEVER store secrets, API keys, signed URLs, or model credentials. Expected key shape: {model, temperature, prompt_template_id, max_tokens}. Any secret-like value is a security incident.';
comment on column public.ai_agents.is_enabled is
  'Owner-only toggle. Defaults false. M006 ships no runtime — toggling true is inert until a future agent runtime migration ships.';
comment on column public.ai_agents.last_run_at is
  'Written by the agent runtime via service role only. No human or non-service-role write is intended; enforced via revoked UPDATE for non-owner and the agent-runtime contract.';

create index ai_agents_agent_key_idx  on public.ai_agents (agent_key);
create index ai_agents_category_idx   on public.ai_agents (category);
create index ai_agents_is_enabled_idx on public.ai_agents (is_enabled);

create trigger ai_agents_set_updated_at
  before update on public.ai_agents
  for each row execute function public.set_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.content_concepts enable row level security;
alter table public.draft_sets       enable row level security;
alter table public.draft_variants   enable row level security;
alter table public.ai_agents        enable row level security;

-- -----------------------------------------------------------------------------
-- content_concepts policies
-- -----------------------------------------------------------------------------
--
-- No client policy. Clients are denied by default RLS deny.
--
-- Team: may SELECT/INSERT/UPDATE/DELETE concepts for assigned clients
-- via can_manage_client_operations (which short-circuits true for
-- operator/owner, so the same policy covers staff).
--
-- Owner: explicit full-access policy for audit clarity.

create policy content_concepts_manage_assigned
  on public.content_concepts
  for all
  to authenticated
  using       (private.can_manage_client_operations(client_id))
  with check  (private.can_manage_client_operations(client_id));

create policy content_concepts_owner_all
  on public.content_concepts
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- -----------------------------------------------------------------------------
-- draft_sets policies
-- -----------------------------------------------------------------------------
--
-- Client is denied. Team/operator/owner access flows through the parent
-- concept's client_id via EXISTS subquery. This join is on the indexed
-- draft_sets.concept_id + content_concepts.id (PK) + content_concepts
-- .client_id (indexed) — measured for hot-path performance in
-- MIGRATION_006_TEST_PLAN.md issue E3.

create policy draft_sets_manage_via_concept
  on public.draft_sets
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.content_concepts c
      where c.id = draft_sets.concept_id
        and private.can_manage_client_operations(c.client_id)
    )
  )
  with check (
    exists (
      select 1
      from public.content_concepts c
      where c.id = draft_sets.concept_id
        and private.can_manage_client_operations(c.client_id)
    )
  );

create policy draft_sets_owner_all
  on public.draft_sets
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- -----------------------------------------------------------------------------
-- draft_variants policies
-- -----------------------------------------------------------------------------
--
-- Client is denied. Two-hop join: draft_variants -> draft_sets ->
-- content_concepts -> client_id. Indexed on every step.

create policy draft_variants_manage_via_set
  on public.draft_variants
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.draft_sets       ds
      join public.content_concepts c on c.id = ds.concept_id
      where ds.id = draft_variants.draft_set_id
        and private.can_manage_client_operations(c.client_id)
    )
  )
  with check (
    exists (
      select 1
      from public.draft_sets       ds
      join public.content_concepts c on c.id = ds.concept_id
      where ds.id = draft_variants.draft_set_id
        and private.can_manage_client_operations(c.client_id)
    )
  );

create policy draft_variants_owner_all
  on public.draft_variants
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());

-- -----------------------------------------------------------------------------
-- ai_agents policies
-- -----------------------------------------------------------------------------
--
-- Client: denied (no policy).
-- Team:   denied (no policy). Team has no business knowing what agents
--         exist in V1; if future product needs change this, add an
--         explicit read-only policy.
-- Operator: read-only (SELECT) over all agents.
-- Owner: full access (insert / update / delete).
-- Service role: bypasses RLS — used to update last_run_at.

create policy ai_agents_select_operator
  on public.ai_agents
  for select
  to authenticated
  using (private.is_operator());

create policy ai_agents_owner_all
  on public.ai_agents
  for all
  to authenticated
  using       (private.is_owner())
  with check  (private.is_owner());


-- =============================================================================
-- POSTS FK ADDITIONS
-- =============================================================================
--
-- Pre-flight: any existing posts.concept_id / posts.draft_variant_id
-- value that does not resolve to a real content_concepts.id /
-- draft_variants.id row blocks FK creation. On greenfield this is a
-- no-op — both columns are bare uuid placeholders added in M004 and
-- nothing writes to them yet.
--
-- on delete set null: deleting a concept or a variant preserves the
-- post and clears the linkage. The post's caption and media remain.

alter table public.posts
  add constraint posts_concept_id_fkey
  foreign key (concept_id) references public.content_concepts(id)
  on delete set null;

alter table public.posts
  add constraint posts_draft_variant_id_fkey
  foreign key (draft_variant_id) references public.draft_variants(id)
  on delete set null;


commit;

-- =============================================================================
-- ROLLBACK (dev reference only — forward-only in production)
-- =============================================================================
--
-- Drop the post FKs BEFORE the tables they reference, otherwise the
-- table drop fails ("other objects depend on it"). posts itself is
-- preserved; only the two M006 FK constraints are removed.
--
-- begin;
--   alter table public.posts drop constraint if exists posts_draft_variant_id_fkey;
--   alter table public.posts drop constraint if exists posts_concept_id_fkey;
--
--   drop table if exists public.draft_variants  cascade;
--   drop table if exists public.draft_sets      cascade;
--   drop table if exists public.content_concepts cascade;
--   drop table if exists public.ai_agents       cascade;
-- commit;

-- =============================================================================
-- END OF MIGRATION 006 DRAFT
--
-- DO NOT RUN — REVIEW BEFORE PROMOTION
-- AUTH_MODE remains "placeholder".
-- No real AI providers, no API keys, no background jobs.
-- =============================================================================
