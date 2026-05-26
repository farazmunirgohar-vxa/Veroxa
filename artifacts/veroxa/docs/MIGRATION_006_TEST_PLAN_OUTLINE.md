# Migration 006 — Content AI Layer: Test Plan Outline

**Status:** Outline only. The full plan with fixtures and pass/fail
cells is authored alongside the M006 SQL draft. `AUTH_MODE` remains
`"placeholder"`. No real AI provider is connected at any point in
this test plan.

## Prerequisites
- [ ] Migrations 001, 002, 003, and 004 all applied and green on the target project.
- [ ] M001+M002+M003+M004 fixture set present, including at least one `posts.id` per seeded client so `draft_variants.used_in_post_id` and `posts.concept_id` / `posts.draft_variant_id` FK additions can resolve.
- [ ] One demo user per role (`client@…`, `team@…`, `operator@…`, `owner@…`).
- [ ] Demo client A and demo client B exist so cross-tenant isolation can be probed; team user assigned to A only.

## Scope under test
Tables: `content_concepts`, `draft_sets`, `draft_variants`,
`ai_agents`. FK additions:
`posts.concept_id → content_concepts(id)` and
`posts.draft_variant_id → draft_variants(id)`. No client-safe view
is added (all four tables are internal).

---

## Headline test cases

### 1. Client read-blocked on `content_concepts`
- [ ] As client A: `select * from public.content_concepts` returns 0 rows (no SELECT grant / policy for the client role).
- [ ] As client A: `insert into public.content_concepts (...)` → **denied**.
- [ ] As client A: `update public.content_concepts set status='archived' where client_id=<A>` → **denied**.
- [ ] As client A: `delete from public.content_concepts where client_id=<A>` → **denied**.

### 2. Client read-blocked on `draft_sets`
- [ ] As client A: `select * from public.draft_sets` returns 0 rows.
- [ ] As client A: `insert`, `update`, `delete` on `draft_sets` → all **denied**.

### 3. Client read-blocked on `draft_variants`
- [ ] As client A: `select * from public.draft_variants` returns 0 rows.
- [ ] As client A: `insert`, `update`, `delete` on `draft_variants` → all **denied**.
- [ ] As client A: even a variant whose `used_in_post_id` points to a published post on client A is invisible — clients do not see the draft history of their own published posts.

### 4. Client read-blocked on `ai_agents`
- [ ] As client A: `select * from public.ai_agents` returns 0 rows.
- [ ] As client A: `insert`, `update`, `delete` on `ai_agents` → all **denied**.

### 5. Team assigned vs unassigned — concepts / draft sets / variants
- [ ] As team (assigned A, executor role): `select * from public.content_concepts where client_id=<A>` returns A's rows.
- [ ] As team (assigned A): `select * from public.content_concepts where client_id=<B>` returns 0 rows.
- [ ] As team (assigned A): `insert into public.content_concepts (client_id, content_angle) values (<A>, 'weekend brunch')` → succeeds.
- [ ] As team (assigned A): same insert with `client_id=<B>` → **denied**.
- [ ] As team (assigned A): `insert into public.draft_sets (concept_id) values (<concept on A>)` → succeeds; same with a concept whose `client_id=<B>` → **denied** (policy joins through `content_concepts.client_id`).
- [ ] As team (assigned A): `insert into public.draft_variants (draft_set_id, variant_type, caption_body) values (<set on A>, 'safe', '...')` → succeeds; same against a set whose underlying concept is on B → **denied**.
- [ ] As team2 (assigned B, **reporter** role): insert into `content_concepts` for B → **denied** (reporter excluded from `can_manage_client_operations`).

### 6. Operator visibility
- [ ] As operator: `select count(*) from public.content_concepts` returns the total across all clients.
- [ ] As operator: same for `draft_sets` and `draft_variants`.
- [ ] As operator: `update public.content_concepts set status='approved' where id=<any row>` → succeeds.
- [ ] As operator: `select * from public.ai_agents` returns all rows (operator has read on `ai_agents`).
- [ ] As operator: `update public.ai_agents set is_enabled=true where agent_key='caption'` → **denied** (owner-only).
- [ ] As operator: `update public.ai_agents set config_json='{...}'::jsonb where ...` → **denied** (owner-only).

### 7. Owner-only `ai_agents.is_enabled` toggle
- [ ] As owner: `update public.ai_agents set is_enabled=true where agent_key='caption'` → succeeds.
- [ ] As owner: `update public.ai_agents set config_json='{"model":"placeholder","temperature":0.7}'::jsonb where agent_key='caption'` → succeeds.
- [ ] As operator, team, client: same updates → all **denied**.
- [ ] Every owner write to `is_enabled` and `config_json` produces an `activity_logs` row (depends on hybrid log strategy from `SUPABASE_RLS_PLAN_V1.md` Part 9).

### 8. System updates `ai_agents.last_run_at`
- [ ] As service role: `update public.ai_agents set last_run_at=now() where agent_key='caption'` → succeeds (RLS bypassed).
- [ ] As service role: attempting to also flip `is_enabled` in the same statement → policy-wise allowed by service role bypass, but the agent runtime contract restricts service-role writes to `last_run_at` only. Verified by a `check`/code review during the SQL draft pass.
- [ ] As any non-service role: `update public.ai_agents set last_run_at=now()` → **denied**.

### 9. Post FK addition safety
- [ ] Setting `posts.concept_id` to a non-existent `content_concepts.id` → fails with FK violation.
- [ ] Setting `posts.concept_id` to a real `content_concepts.id` → succeeds.
- [ ] Setting `posts.draft_variant_id` to a non-existent `draft_variants.id` → fails with FK violation.
- [ ] Setting `posts.draft_variant_id` to a real `draft_variants.id` → succeeds.
- [ ] Deleting the referenced `content_concepts` row → `posts.concept_id` becomes NULL (on delete set null), the post itself is preserved.
- [ ] Deleting the referenced `draft_variants` row → `posts.draft_variant_id` becomes NULL, the post itself is preserved.
- [ ] The two FKs are added by M006; confirm M004 application alone did NOT add them (they were bare uuid placeholders).
- [ ] Pre-flight: any existing `posts.concept_id` / `posts.draft_variant_id` value that does not resolve to a real row blocks the FK creation — pre-flight must null those out first.

### 10. No real AI activity
- [ ] Inserting a `content_concepts` row with `generated_by_agent='content_strategist'` does NOT cause any external API call (no integration exists).
- [ ] Inserting `draft_sets` / `draft_variants` rows does NOT call any AI provider.
- [ ] `ai_agents.is_enabled=true` is inert in M006 — there is no runtime that reads it.
- [ ] No environment variable for an AI provider key is required to apply M006 or run the seed.

### 11. Rollback ordering — post FKs before draft / concept tables
- [ ] Rollback script drops `posts_draft_variant_id_fkey` and `posts_concept_id_fkey` **before** dropping `draft_variants`, `draft_sets`, and `content_concepts`.
- [ ] Reversing the order (drop `content_concepts` while the `posts.concept_id` FK still references it) fails with "cannot drop table because other objects depend on it" / "constraint depends on table".
- [ ] After rollback, `content_concepts`, `draft_sets`, `draft_variants`, `ai_agents`, and both `posts` FKs are absent from the schema; `posts.concept_id` and `posts.draft_variant_id` revert to bare uuid columns.
- [ ] Pre-M006 snapshot → apply M006 → restore snapshot → state matches.

---

## Rollback expectation

**Forward-only + pre-cutover snapshot**, same as M001–M005.

### Rollback drop order (dev reference)

```text
-- Drop the post FKs BEFORE the tables they reference, otherwise the
-- table drop fails ("other objects depend on it"). posts itself is
-- preserved; only the two M006 FK constraints are removed.
alter table public.posts drop constraint if exists posts_draft_variant_id_fkey;
alter table public.posts drop constraint if exists posts_concept_id_fkey;

-- Then drop the four M006 tables in dependency order:
-- draft_variants → draft_sets → content_concepts (FK chain), then ai_agents (independent).
drop table if exists public.draft_variants  cascade;
drop table if exists public.draft_sets      cascade;
drop table if exists public.content_concepts cascade;
drop table if exists public.ai_agents       cascade;
```

### Rollback tests
- [ ] Apply M006 to a clean dev project that has M001 + M002 + M003 + M004 → succeeds.
- [ ] Re-apply through the Supabase runner → "already applied".
- [ ] Re-run raw `.sql` → fails cleanly with "relation already exists".
- [ ] Snapshot restore: pre-M006 snapshot → apply → restore → state matches.
- [ ] FK drop ordering test: dropping `content_concepts` before dropping `posts_concept_id_fkey` fails; dropping the FK first then the table succeeds.

---

## Blocking Issues Before Real Migration

| # | Issue | Severity | Resolution |
|---|---|---|---|
| E1 | M006 SQL draft does not yet exist | Blocker for M006 promotion | Author `docs/sql_drafts/migrations_review/006_content_ai_layer_draft.sql` once M004 + M005 have progressed through testing. |
| E2 | `ai_agents.config_json` key shape not pinned | Blocker for stable agent runtime contract | Lock expected keys (`model`, `temperature`, `prompt_template_id`, `max_tokens`) when the SQL draft is authored; document that secrets are never stored here. |
| E3 | `draft_sets` / `draft_variants` policies join through `content_concepts` for `client_id` | NOT a blocker for M006 schema | Measure during SQL draft pass; consider denormalizing `client_id` onto both child tables (kept in sync by trigger) if the join is hot under load. |
| E4 | `content_concepts.additional_media_ids` is `uuid[]` — no FK on array elements | NOT a blocker for M006 schema | Add a trigger / application validation that all elements resolve to real `media_assets` rows owned by the same `client_id`; flag for the SQL draft pass. |
| E5 | Test plan above is outline-only, no fixtures | Blocker for promotion | Materialize fixtures + per-test pass/fail cells when the SQL draft is authored. |
| E6 | No AI agent runtime exists | NOT a blocker for M006 schema | Out of scope; agent runtime is a separate track. `is_enabled` is inert until the runtime ships; `last_run_at` will never be written. |
| E7 | Activity-log writes for content-table status transitions not yet wired | NOT a blocker for M006 schema | Tracked alongside the implementation pass; relies on hybrid log strategy from `SUPABASE_RLS_PLAN_V1.md` Part 9. |
| E8 | No real OpenAI / Anthropic / other provider integration | NOT a blocker for M006 | Explicitly out of scope. No keys, no SDKs, no calls. `config_json` placeholder values only. |

**Promotion gate:** M004 promoted + green. E1, E2, and E5 closed
(SQL drafted, `config_json` shape locked, tests fleshed out and run).
E3 and E4 resolved (denormalization decision made, array-validation
trigger in place) before any real agent runtime ships against the
schema.

---

## Cross-references

- M006 plan: `docs/MIGRATION_006_CONTENT_AI_LAYER_PLAN.md`
- M005 plan: `docs/MIGRATION_005_REPORTING_FOUNDATION_PLAN.md`
- M005 test outline: `docs/MIGRATION_005_TEST_PLAN_OUTLINE.md`
- M004 draft: `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql`
- M004 test outline: `docs/MIGRATION_004_TEST_PLAN_OUTLINE.md`
- Schema reference: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- RLS reference: `docs/SUPABASE_RLS_PLAN_V1.md`
- Demo data reference: `docs/DEMO_DATA_MAP.md`
- Demo source files: `src/data/demo/demoAgents.ts`, `src/data/demo/demoPosts.ts`
