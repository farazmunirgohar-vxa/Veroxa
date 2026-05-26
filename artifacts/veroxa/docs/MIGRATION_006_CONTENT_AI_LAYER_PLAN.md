# Migration 006 — Content AI Layer: Planning Document

**Status:** Planning only — no SQL draft yet. No Supabase project
touched. No AI APIs connected (no OpenAI, no Anthropic, no other
provider). No publishing APIs. No automation jobs. No payments. No
financial snapshots. `AUTH_MODE` remains `"placeholder"`. No portal
UI, navigation, or pricing change.

---

## 1. Purpose

M006 introduces the AI-assisted content workflow layer on top of the
identity, clients, media, posting, and reporting foundations shipped
in M001–M005. It adds four tables — `content_concepts`,
`draft_sets`, `draft_variants`, and `ai_agents` — that together
describe how a piece of content moves from "raw approved media" to
"caption variants ready for team review" and which AI agent is
responsible for each step.

This is the first migration whose primary consumer is the
**AI / agent layer**, not a human role. The shape of the tables is
therefore driven by the workflow already documented in
`src/data/demo/demoAgents.ts` (`demoAgentWorkflow`) and the pipeline
stages already documented in `src/data/demo/demoPosts.ts`
(`demoContentPipelineItems` early stages).

### Dependency

M006 depends on **M001** (identity + helpers), **M002** (clients +
team_client_assignments + `can_view_client` /
`can_manage_client_operations`), **M003** (`media_assets` — required
for `content_concepts.media_asset_id`), and **M004** (`posts` —
required so the deferred `posts.concept_id` and
`posts.draft_variant_id` FKs can be added against real columns).
Must not apply before all four are green. M005 (reports) is not a
hard dependency; M006 can land before or after M005.

### Scope

Included:
- `content_concepts`
- `draft_sets`
- `draft_variants`
- `ai_agents`
- Adds FKs against `posts` (which was created in M004 with bare uuid
  placeholders for these columns):
  - `posts.concept_id → content_concepts(id) on delete set null`
  - `posts.draft_variant_id → draft_variants(id) on delete set null`
- RLS + per-role policies on all four tables
- Indexes
- Seed mapping from `demoAgents.ts` and `demoPosts.ts`

**Explicitly NOT in scope** (deferred or out of all SQL migrations):
- Any real AI provider integration (OpenAI, Anthropic, etc.). No API
  keys, no calls, no SDKs wired.
- Real publishing APIs (Meta Graph, Google Business, TikTok) — M008+
- AI agent runtime — separate AI track. M006 ships only the
  configuration registry (`ai_agents`) and the data shape the agents
  will read/write; no worker, no scheduler, no execution code.
- Automation jobs, cron, background workers — orchestrated separately
- Payment systems, financial snapshots — separate track
- `AUTH_MODE` change, auth wiring, login flow — locked to
  `"placeholder"`
- Portal UI, navigation, pricing — untouched
- Real OpenAI / Anthropic / other LLM secrets — never seeded, never
  stored in `ai_agents` rows (the table has a `config_json` slot but
  the seed populates it with placeholder values only)

---

## 2. Tables

### 2.1 `content_concepts`

One row per creative direction produced from one or more approved
media assets, before any caption exists. Produced by the Content
Strategist Agent (see `demoAgents.ts` → `content-strategist`).
Reviewable by team; never client-visible.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `client_id` | `uuid not null references clients(id) on delete cascade` | |
| `media_asset_id` | `uuid null references media_assets(id) on delete set null` | the primary media asset for this concept |
| `additional_media_ids` | `uuid[] not null default '{}'::uuid[]` | optional extra assets (carousel / supporting clips); not FK-enforced because Postgres does not FK array elements — referential integrity enforced by application + audit log |
| `content_angle` | `text not null` | e.g. `"Family platter weekend"` |
| `content_goal` | `text null check (content_goal is null or content_goal in ('awareness','engagement','conversion','branding','recovery'))` | |
| `hook_style` | `text null check (hook_style is null or hook_style in ('question','bold_statement','story','stat','behind_scenes'))` | |
| `cta_direction` | `text null check (cta_direction is null or cta_direction in ('visit','order','book','follow','share','none'))` | |
| `status` | `text not null default 'proposed' check (status in ('proposed','approved','archived'))` | |
| `generated_at` | `timestamptz null` | when the agent produced this concept |
| `generated_by_agent` | `text null` | stable agent key, e.g. `"content_strategist"` — matches `ai_agents.agent_key` |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

Notes:
- `media_asset_id` is the *primary* asset; `additional_media_ids`
  carries extras. Concepts may exist transiently without an asset
  (`media_asset_id null`) while the strategist works from a brief,
  but the typical row has a primary asset.
- `generated_by_agent` is the agent's stable text key, not a FK,
  because agents may be renamed or re-versioned. The FK-like link
  goes through `ai_agents.agent_key`.

### 2.2 `draft_sets`

One row per **generation batch** of caption drafts for a single
concept. Re-generating captions for the same concept produces a new
`draft_sets` row with `generation_version` incremented; older sets
get `status='superseded'`. Produced by the Caption Agent (see
`demoAgents.ts` → `caption`).

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `concept_id` | `uuid not null references content_concepts(id) on delete cascade` | |
| `generation_version` | `integer not null default 1` | bumps on re-generation |
| `status` | `text not null default 'drafting' check (status in ('drafting','awaiting_review','approved','superseded'))` | |
| `team_note` | `text null` | internal team commentary; never client-facing |
| `generated_at` | `timestamptz null` | |
| `generated_by_agent` | `text null` | typically `"caption"`; matches `ai_agents.agent_key` |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

**Unique:** `(concept_id, generation_version)` — one batch per
version per concept.

Notes:
- A concept may have many draft sets over time (regenerations,
  reviewer-requested rewrites). Only one is expected to reach
  `status='approved'`; previous sets transition to `superseded`.
- `team_note` is the canonical staff-only field on this table.

### 2.3 `draft_variants`

Individual caption options inside a draft set — typically three per
set: Safe, Engagement, Sales. Brand voice score is set by the Brand
Voice Agent (see `demoAgents.ts` → `brand-voice`).

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `draft_set_id` | `uuid not null references draft_sets(id) on delete cascade` | |
| `variant_type` | `text not null check (variant_type in ('safe','engagement','sales'))` | |
| `caption_body` | `text not null` | the full caption text |
| `hook_text` | `text null` | optional separate hook line |
| `cta_text` | `text null` | optional separate CTA line |
| `hashtag_block` | `text null` | optional hashtag tail |
| `brand_voice_score` | `integer null check (brand_voice_score is null or (brand_voice_score between 0 and 100))` | set by Brand Voice Agent |
| `status` | `text not null default 'draft' check (status in ('draft','approved','rejected','used','superseded'))` | |
| `used_in_post_id` | `uuid null references posts(id) on delete set null` | back-reference once a variant is attached to a post |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

**Unique:** `(draft_set_id, variant_type)` — at most one variant of
each type per set.

Notes:
- `used_in_post_id` is `on delete set null` so deleting a post does
  not blow up the historical draft.
- `status='used'` is the steady-state once `used_in_post_id` is set.
  `status='superseded'` is for variants in an older draft set after
  regeneration.

### 2.4 `ai_agents`

Configuration registry for every AI agent the platform knows about.
One row per agent, keyed by a stable `agent_key`. Mirrors the demo
agent library in `demoAgents.ts` (`demoAiAgentsV2`).

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `agent_key` | `text not null unique` | stable machine key, e.g. `"media-review"`, `"caption"`, `"brand-voice"`, `"content-strategist"`, `"scheduling"`, `"reporting"`, `"risk"`, `"operator-assistant"`, `"owner-assistant"` |
| `display_name` | `text not null` | e.g. `"Media Review Agent"` |
| `category` | `text not null check (category in ('content','operations','intelligence','executive'))` | mirrors `demoAiAgentsV2.category` |
| `purpose` | `text not null` | one-line summary |
| `is_enabled` | `boolean not null default false` | **owner-only write**; defaults `false` so no agent is silently active on apply |
| `config_json` | `jsonb not null default '{}'::jsonb` | model name, temperature, prompt template ref, etc. — **never** a raw API key; secrets live in environment/Vault, not in this table |
| `last_run_at` | `timestamptz null` | updated by the agent runtime / service role when it executes |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

Notes:
- `agent_key` is the canonical text used elsewhere
  (`content_concepts.generated_by_agent`,
  `draft_sets.generated_by_agent`,
  `notifications.agent_id` planning text). Renaming an agent means
  updating this table and any text references; the keys in
  `demoAgents.ts` are the source of truth for the seed values.
- `is_enabled` is Owner-only writable per the RLS plan
  (`SUPABASE_RLS_PLAN_V1.md` Part 5). The default of `false` is
  deliberate: applying M006 must not silently arm any agent. The
  Owner explicitly toggles agents on after review.
- `config_json` never stores secrets. API keys for the eventual
  AI provider integration live in the environment / secret manager,
  read by the future agent runtime (not shipped in M006). The seed
  populates `config_json` with placeholder values only (model name,
  temperature, prompt template id) — never real keys.
- `last_run_at` is the only column the service role updates from
  the future agent runtime; everything else is owner-managed.

---

## 3. Post linkage (M004 deferred FKs)

In M004, `posts.concept_id` and `posts.draft_variant_id` were created
as bare `uuid` placeholders **without FKs** because
`content_concepts` and `draft_variants` did not exist yet. M006 adds
the FKs:

```sql
alter table public.posts
  add constraint posts_concept_id_fkey
  foreign key (concept_id) references public.content_concepts(id)
  on delete set null;

alter table public.posts
  add constraint posts_draft_variant_id_fkey
  foreign key (draft_variant_id) references public.draft_variants(id)
  on delete set null;
```

Pre-flight: every existing `posts.concept_id` and
`posts.draft_variant_id` is NULL or points to a real row.
Greenfield ⇒ trivially safe; otherwise null out orphans first.

`on delete set null` is intentional: deleting an upstream concept or
variant must not blow up downstream posts (especially posts that
already published). The post keeps its content; it just loses the
trace back to the concept / draft.

---

## 4. Status pipelines

### 4.1 content_concepts

```text
proposed  ─▶  approved  ─▶  archived
   │            │             │
strategist   team picks    superseded /
emits        a concept     no longer used
```

### 4.2 draft_sets

```text
drafting  ─▶  awaiting_review  ─▶  approved
                                      │
                                      ▼
                                  superseded   (when a newer set is generated)
```

### 4.3 draft_variants

```text
draft  ─▶  approved  ─▶  used
   │          │
   │          ▼
   ▼       rejected / superseded
rejected
```

A variant reaches `used` once it is attached to a `posts` row via
`used_in_post_id`. Variants in older draft sets transition to
`superseded` after a regeneration; they remain readable for audit.

---

## 5. RLS plan

All four tables have `enable row level security` from apply-time.
No row is ever publicly readable. Helpers used:
`current_user_role`, `current_user_client_id`, `is_owner`,
`is_operator`, `can_view_client`, `can_manage_client_operations`
(all from M001/M002).

### 5.1 `content_concepts`

- **Client SELECT / INSERT / UPDATE / DELETE** — DENIED. Concepts are
  internal strategy artifacts; clients never see or touch them.
- **Team manage assigned** — `can_manage_client_operations(client_id)`
  for `select`, `insert`, `update`. Team picks concepts for assigned
  clients and flips `status` between `proposed`, `approved`, and
  `archived`. Team may NOT write rows for non-assigned clients.
- **Operator** — `is_operator()` for full read + write across all
  clients (inherits team scope and bypasses assignment).
- **Owner** — full access.
- **System (service role)** — bypasses RLS. Used by the future
  Content Strategist Agent runtime to INSERT new concepts
  (`generated_by_agent='content_strategist'`). No runtime is shipped
  in M006.
- **Append rule** — every `status` transition writes an
  `activity_logs` row per the hybrid policy in
  `SUPABASE_RLS_PLAN_V1.md` Part 9.

### 5.2 `draft_sets`

- **Client** — DENIED on all operations.
- **Team manage assigned** —
  `can_manage_client_operations(concept.client_id)` evaluated through
  the FK join in policy predicates (`exists (select 1 from
  content_concepts c where c.id = draft_sets.concept_id and
  can_manage_client_operations(c.client_id))`). Team owns the
  `drafting → awaiting_review → approved` transitions and may write
  `team_note`.
- **Operator** — `is_operator()` for full read + write.
- **Owner** — full access.
- **System** — bypasses RLS. Used by the future Caption Agent runtime
  to INSERT new draft sets. No runtime is shipped in M006.

### 5.3 `draft_variants`

- **Client** — DENIED on all operations.
- **Team manage assigned** — same join shape as `draft_sets`, walking
  `draft_variants → draft_sets → content_concepts → client_id`. Team
  may update `status` and may set `used_in_post_id` when attaching a
  variant to a post they manage.
- **Operator** — `is_operator()` for full read + write.
- **Owner** — full access.
- **System** — bypasses RLS. Used by the future Caption Agent (insert)
  and Brand Voice Agent (update `brand_voice_score`). No runtime is
  shipped in M006.

### 5.4 `ai_agents`

- **Client** — DENIED on all operations.
- **Team** — DENIED on all operations. Team uses agents, but does
  not see their configuration.
- **Operator** — `is_operator()` for `select` only. Operators can
  see which agents exist and their `is_enabled` state, but cannot
  toggle them and cannot edit `config_json`.
- **Owner** — full read + write. Owner is the **only** principal that
  may flip `is_enabled` or edit `config_json`. Every owner write
  writes an `activity_logs` row.
- **System** — bypasses RLS, but the *only* column the service role
  updates is `last_run_at` (idempotent timestamp bump from the
  agent runtime when it executes). No runtime is shipped in M006.

### 5.5 Cross-cutting

- All four tables have `enable row level security` immediately upon
  creation.
- Base-table SELECT grants to the client role are revoked for all
  four tables; no client-safe view is added in M006 because nothing
  on these tables is intended for client consumption.
- The base-table SELECT grant to the team role on `ai_agents` is
  also revoked — operators and owners only.

---

## 6. Indexes

Targeted to the actual query shapes; do not over-index.

`content_concepts`:
- `content_concepts (client_id)` — every per-client query
- `content_concepts (status)` — team review queue
- `content_concepts (media_asset_id)` — "what concepts use this
  media?" lookups
- `content_concepts (generated_by_agent)` — agent activity audits

`draft_sets`:
- `draft_sets (concept_id)` — fetch all sets for a concept
- `draft_sets (status)` — team review queue
- the `unique (concept_id, generation_version)` constraint creates
  its own index — do not duplicate

`draft_variants`:
- `draft_variants (draft_set_id)` — fetch all variants in a set
- `draft_variants (status)` — review queue / "what's available to
  attach?"
- `draft_variants (used_in_post_id)` — back-reference lookups
- the `unique (draft_set_id, variant_type)` constraint creates its
  own index — do not duplicate

`ai_agents`:
- the `unique (agent_key)` constraint creates its own index — do not
  duplicate
- `ai_agents (category)` — group-by-category in the owner config UI
- `ai_agents (is_enabled)` — fast "which agents are armed?" check

---

## 7. Seed strategy

| Demo source | Target table |
|---|---|
| `src/data/demo/demoAgents.ts` → `demoAiAgentsV2` | `ai_agents` (one row per agent) |
| `src/data/demo/demoPosts.ts` → `demoContentPipelineItems` (stages "Media Received" / "AI Review") | `content_concepts` (one row per pipeline item with `status='proposed'` or `status='approved'`) |
| `src/data/demo/demoPosts.ts` → `demoContentPipelineItems` (stage "Caption Drafting") | `draft_sets` (one row per pipeline item in that stage, `generation_version=1`, `status='drafting'` or `awaiting_review`) |
| `src/data/demo/demoPosts.ts` → `demoContentPipelineItems` (stages "Team Review" / "Scheduled / Posted") | `draft_variants` (three rows per such pipeline item — safe/engagement/sales — with `status='approved'` or `used`, `used_in_post_id` set for posted items) |

Rules (same shape as M001–M005 seed rules):
- **Dev-only.** Seed runs against the local / dev Supabase project,
  never against production. No production seed file exists.
- **Stable UUIDs.** Each seeded row uses a deterministic `v5` UUID:
  - `ai_agents`: `v5(agent_key)`
  - `content_concepts`: `v5(pipeline_item_id || ':concept')`
  - `draft_sets`: `v5(pipeline_item_id || ':set:1')`
  - `draft_variants`: `v5(pipeline_item_id || ':variant:' || variant_type)`
- **Idempotent.** `insert ... on conflict do update ...` keyed on the
  natural unique constraint (`ai_agents.agent_key`,
  `(concept_id, generation_version)`,
  `(draft_set_id, variant_type)`). Re-running the seed must leave
  the same row set, not grow it.
- **No real API keys, ever.** `ai_agents.config_json` is seeded with
  placeholder values only: model name (`"gpt-placeholder"`),
  temperature, prompt template id. The seed never reads or writes a
  real provider key. The eventual provider key lives in the
  environment, not in this table.
- **`ai_agents.is_enabled` seeded to `false`** for every agent.
  Applying M006 + running the seed must not silently arm any agent.
- **Demo files are not modified.** The seed reads
  `demoAgents.ts` and `demoPosts.ts` as-is and maps their existing
  shape onto the table columns.
- **Runs as service role inside a single transaction.** Same as
  M001–M005.

---

## 8. Migration 006 draft SQL — decision

**Decision (this pass): planning-only; SQL draft NOT created.**

Rationale: matches the explicit task instruction
("Planning-only deliverable — no SQL is written or executed"). The
plan above is concrete enough that the eventual draft will be a
near-mechanical translation, mirroring the structure of
`005_reporting_foundation_draft.sql` (once that is authored) and
`004_posting_foundation_draft.sql`. Authoring the SQL is the next
forward step once M004 + M005 have progressed through testing.

---

## 9. Cross-references

- M001 draft: `docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql`
- M002 draft: `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- M003 draft: `docs/sql_drafts/migrations_review/003_media_foundation_draft.sql`
- M004 draft: `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql`
- M004 plan: `docs/MIGRATION_004_POSTING_FOUNDATION_PLAN.md`
- M005 plan: `docs/MIGRATION_005_REPORTING_FOUNDATION_PLAN.md`
- M006 test outline (this plan's tests): `docs/MIGRATION_006_TEST_PLAN_OUTLINE.md`
- Schema reference: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
  (`content_concepts`, `draft_sets`, `draft_variants`, `ai_agents`)
- RLS reference: `docs/SUPABASE_RLS_PLAN_V1.md` (Parts 2, 3 — agent
  config + draft access rules)
- Demo data reference: `docs/DEMO_DATA_MAP.md`
- Demo source files: `src/data/demo/demoAgents.ts`,
  `src/data/demo/demoPosts.ts`

---

## 10. Final report

**Files created in this pass**
1. `artifacts/veroxa/docs/MIGRATION_006_CONTENT_AI_LAYER_PLAN.md` (this document)
2. `artifacts/veroxa/docs/MIGRATION_006_TEST_PLAN_OUTLINE.md`

**Files modified:** none.

**Tables planned:** 4 — `content_concepts`, `draft_sets`,
`draft_variants`, `ai_agents`.

**Post linkage plan:** M006 adds two FKs against `posts` (which was
created in M004 with bare uuid placeholders):
`posts.concept_id → content_concepts(id) on delete set null` and
`posts.draft_variant_id → draft_variants(id) on delete set null`.
Pre-flight requires all existing values to be NULL or to resolve to
real rows; greenfield is trivially safe.

**RLS summary:** Client is fully DENIED on all four tables — concepts,
draft sets, variants, and the agent registry are internal. Team
manages concepts, draft sets, and variants for assigned clients via
`can_manage_client_operations`, with `draft_sets` and
`draft_variants` policies joining through `content_concepts` to
reach the `client_id`. Operator has full read + write on the three
content tables and read-only on `ai_agents`. Owner has full access
everywhere and is the **only** principal that may toggle
`ai_agents.is_enabled` or edit `config_json`. System (service role)
bypasses RLS for future agent-runtime inserts/updates; on
`ai_agents` the service role only ever updates `last_run_at`. Every
`status` transition and every owner write to `ai_agents` writes an
`activity_logs` row.

**Seed strategy summary:** Maps `demoAgents.ts → ai_agents` (one row
per agent, `is_enabled=false` by default, `config_json` populated
with placeholder values only) and `demoPosts.ts` pipeline items by
stage onto `content_concepts`, `draft_sets`, and `draft_variants`.
Dev-only, stable v5 UUIDs derived from `agent_key` and pipeline-item
id, idempotent `on conflict do update`, no production seed, no real
provider keys anywhere.

**Test outline created:** Yes — see
`docs/MIGRATION_006_TEST_PLAN_OUTLINE.md`. Eleven headline cases:
client read-blocked on each of the four tables, team assigned vs
unassigned access on concepts / draft sets / variants, operator
visibility, owner-only `ai_agents.is_enabled` toggle, system
`ai_agents.last_run_at` update, post FK addition safety, and
rollback ordering that drops post FKs before draft / concept tables.

**No migrations were run.** No SQL was authored. `docs/sql_drafts/`
is unchanged. No Supabase project was touched.

**No AI APIs connected.** No OpenAI, Anthropic, or other provider
SDK is installed or wired. No API keys are stored anywhere. The
`ai_agents.config_json` slot is described and seeded with
placeholder values only.

**`AUTH_MODE` unchanged.** Still `"placeholder"`. No auth wiring,
portal navigation, or login flow was modified.

**Pricing unchanged.** No pricing column, plan, or page was touched.
The locked pricing reference in `SUPABASE_SCHEMA_DRAFT_V1.md` is
untouched. No portal UI was changed.

**Remaining risks**
- `content_concepts.additional_media_ids` is a `uuid[]` and Postgres
  cannot FK array elements. Referential integrity for extra assets
  depends on application code + audit log. The SQL draft pass
  should add a `check` constraint that the array contains no
  duplicates and that all elements resolve to real `media_assets`
  rows owned by the same `client_id` (enforced by a trigger or
  application validation, since a plain `check` can't query other
  tables cheaply).
- The `draft_sets` and `draft_variants` RLS policies require an
  `exists` join all the way back to `content_concepts.client_id`.
  This is correct but slightly more expensive than a denormalized
  `client_id` column on each child. The SQL draft pass should
  measure and consider denormalizing `client_id` onto `draft_sets`
  and `draft_variants` (kept in sync by a trigger) if the join
  proves hot under load.
- `ai_agents.config_json` shape is not pinned. The SQL draft pass
  should lock the expected keys (e.g. `model`, `temperature`,
  `prompt_template_id`, `max_tokens`) so the eventual agent runtime
  has a stable contract and so secret-bearing keys can be excluded
  by validation.
- The future agent runtime is out of scope. Until it exists,
  `ai_agents.last_run_at` will never be written and no concepts /
  draft sets / variants will be agent-generated. Team can manually
  insert rows for testing; the seed covers the demo set.
- Activity-log writes for status transitions on the three content
  tables depend on the hybrid log strategy from
  `SUPABASE_RLS_PLAN_V1.md` Part 9; until the write code paths
  exist, those audit rows will be missing. Flag for the
  implementation pass.

**Recommended next prompt**
Author `docs/sql_drafts/migrations_review/006_content_ai_layer_draft.sql`
following the structure of the prior migration drafts: table DDL +
check constraints + unique constraints + indexes + `updated_at`
triggers + RLS enable + per-role policies + the two `alter table
public.posts add constraint ... foreign key ...` statements for the
deferred `posts.concept_id` and `posts.draft_variant_id` FKs +
base-table grant revocations for the client and team roles where
specified. Lock the `ai_agents.config_json` key shape and decide
whether to denormalize `client_id` onto `draft_sets` /
`draft_variants` before writing the policies.
