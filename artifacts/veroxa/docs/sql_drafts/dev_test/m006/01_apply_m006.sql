-- =============================================================================
-- M006 Dev Test — Step 1: Apply Migration 006 (Content / AI Layer)
--
-- Source:
--   docs/sql_drafts/migrations_review/006_content_ai_layer_draft.sql
--
-- Run AFTER M001–M005 + M003 + M004 corrections.
-- Expected result: "Success. No rows returned."
-- If errors, STOP. Likely cause: M005 not applied, or M004
-- posts.concept_id / posts.draft_variant_id columns missing.
-- AUTH_MODE stays "placeholder". No AI provider connected.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. content_concepts
-- -----------------------------------------------------------------------------

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
  'Concept-level brainstorm. Internal-only (no client RLS). additional_media_ids has no FK enforcement on array elements.';
comment on column public.content_concepts.additional_media_ids is
  'Array of media_assets.id values. PostgreSQL cannot FK-enforce array elements.';
comment on column public.content_concepts.generated_by_agent is
  'Free-text agent identifier (intentionally NOT a FK to ai_agents.agent_key).';

create index content_concepts_client_id_idx       on public.content_concepts (client_id);
create index content_concepts_media_asset_id_idx  on public.content_concepts (media_asset_id);
create index content_concepts_status_idx          on public.content_concepts (status);

create trigger content_concepts_set_updated_at
  before update on public.content_concepts
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 2. draft_sets
-- -----------------------------------------------------------------------------

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

comment on table public.draft_sets is
  'Groups draft_variants generated against a single content_concepts row. Internal-only.';

create index draft_sets_concept_id_idx on public.draft_sets (concept_id);
create index draft_sets_status_idx     on public.draft_sets (status);

create trigger draft_sets_set_updated_at
  before update on public.draft_sets
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 3. draft_variants
-- -----------------------------------------------------------------------------

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

comment on table public.draft_variants is
  'Individual caption attempts within a draft_sets row. used_in_post_id on delete set null preserves variant history.';

create index draft_variants_draft_set_id_idx    on public.draft_variants (draft_set_id);
create index draft_variants_status_idx          on public.draft_variants (status);
create index draft_variants_used_in_post_id_idx on public.draft_variants (used_in_post_id);

create trigger draft_variants_set_updated_at
  before update on public.draft_variants
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 4. ai_agents
-- -----------------------------------------------------------------------------

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

comment on table public.ai_agents is
  'Catalog of AI agents. is_enabled defaults false. Owner-only writes. M006 ships no runtime.';
comment on column public.ai_agents.config_json is
  'Plaintext jsonb. NEVER store secrets / API keys / signed URLs. Expected shape: {model, temperature, prompt_template_id, max_tokens}.';

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

-- content_concepts (team/operator/owner)
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

-- draft_sets (joined via concept)
create policy draft_sets_manage_via_concept
  on public.draft_sets
  for all
  to authenticated
  using (
    exists (
      select 1 from public.content_concepts c
      where c.id = draft_sets.concept_id
        and private.can_manage_client_operations(c.client_id)
    )
  )
  with check (
    exists (
      select 1 from public.content_concepts c
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

-- draft_variants (joined via set -> concept)
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

-- ai_agents (operator SELECT, owner all)
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
-- POSTS FK ADDITIONS (deferred from M004)
-- =============================================================================
--
-- Pre-flight: on greenfield, posts.concept_id and posts.draft_variant_id
-- are NULL on all rows. In any other case, null out non-resolvable
-- values before applying.

alter table public.posts
  add constraint posts_concept_id_fkey
  foreign key (concept_id) references public.content_concepts(id)
  on delete set null;

alter table public.posts
  add constraint posts_draft_variant_id_fkey
  foreign key (draft_variant_id) references public.draft_variants(id)
  on delete set null;

commit;

-- Verification:
select table_name, row_security
from information_schema.tables
where table_schema='public'
  and table_name in ('content_concepts','draft_sets','draft_variants','ai_agents');
-- EXPECTED: 4 rows, row_security=YES for each.

select conname from pg_constraint
where conname in ('posts_concept_id_fkey','posts_draft_variant_id_fkey');
-- EXPECTED: 2 rows.
