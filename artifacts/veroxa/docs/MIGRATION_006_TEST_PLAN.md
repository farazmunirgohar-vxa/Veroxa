# Migration 006 — Content / AI Layer: Test Plan

**Status:** Planning. Tests not yet executed. `AUTH_MODE` remains
`"placeholder"`. No real AI provider is connected at any point in this
test plan. This file materializes
`docs/MIGRATION_006_TEST_PLAN_OUTLINE.md` with concrete fixtures and
per-test pass/fail cells.

## Prerequisites

- [ ] Migration 001 applied and green.
- [ ] Migration 002 applied and green.
- [ ] Migration 003 applied and green.
- [ ] Migration 004 applied and green.
- [ ] M001 + M002 + M003 + M004 fixture set present (5 users, 2 clients,
      team assignments, media_assets, at least one `posts.id` per
      seeded client so the FK additions resolve cleanly).
- [ ] Pre-cutover snapshot taken.

## Scope under test

Tables: `content_concepts`, `draft_sets`, `draft_variants`,
`ai_agents`. FK additions:
`posts.concept_id → content_concepts(id) on delete set null` and
`posts.draft_variant_id → draft_variants(id) on delete set null`. No
client-safe view is added (all four tables are internal).

No new helpers in M006 — reuses M002 helpers
(`can_manage_client_operations`, `is_owner`, `is_operator`).

## Additional fixtures

**content_concepts (Restaurant A):**
| Concept | content_angle | content_goal | hook_style | cta_direction | status | generated_by_agent |
|---|---|---|---|---|---|---|
| CA-1 | "Sunday brunch crowd-shot" | awareness | story | visit | generated | content_strategist |
| CA-2 | "Anniversary owner story" | branding | story | share | under_review | content_strategist |
| CA-3 | "Promo recovery" | recovery | bold_statement | order | rejected | NULL (staff) |

**content_concepts (Restaurant B):**
| Concept | status |
|---|---|
| CB-1 | generated |

**draft_sets:**
| Set | concept | generation_version | status |
|---|---|---|---|
| DS-1 | CA-1 | 1 | generated |
| DS-2 | CA-1 | 2 | needs_regeneration |
| DS-3 | CA-2 | 1 | under_review |
| DS-4 | CB-1 | 1 | generated |

**draft_variants:**
| Variant | draft_set | variant_type | status | used_in_post_id |
|---|---|---|---|---|
| DV-1 | DS-1 | safe | approved | (post on A, status=published) |
| DV-2 | DS-1 | engagement | archived | NULL |
| DV-3 | DS-1 | sales | generated | NULL |
| DV-4 | DS-3 | safe | under_review | NULL |
| DV-5 | DS-4 | safe | generated | NULL |

**ai_agents:**
| agent_key | category | mode | is_enabled |
|---|---|---|---|
| content_strategist | content | demo | false |
| caption | content | demo | false |
| ops_router | operations | demo | false |
| intel_analyst | intelligence | demo | false |
| exec_brief | executive | demo | false |

All agents seeded with `config_json = NULL` initially.

---

## Required tests

### 1. Client read-blocked on `content_concepts`
- [ ] As `client@veroxa.test` (client A): `select * from public.content_concepts` returns 0 rows.
- [ ] As client A: `insert into public.content_concepts (client_id, content_angle) values ('<A>', 'x')` → **denied**.
- [ ] As client A: `update public.content_concepts set status='archived' where client_id='<A>'` → **denied** (0 rows affected by RLS).
- [ ] As client A: `delete from public.content_concepts where client_id='<A>'` → **denied** (0 rows affected by RLS).

### 2. Client read-blocked on `draft_sets`
- [ ] As client A: `select * from public.draft_sets` returns 0 rows.
- [ ] As client A: `insert into public.draft_sets (concept_id) values ('<DS-1 concept>')` → **denied**.
- [ ] As client A: `update public.draft_sets set status='archived' where id='<DS-1>'` → **denied**.
- [ ] As client A: `delete from public.draft_sets where id='<DS-1>'` → **denied**.

### 3. Client read-blocked on `draft_variants`
- [ ] As client A: `select * from public.draft_variants` returns 0 rows.
- [ ] As client A: `insert into public.draft_variants (draft_set_id, variant_type, caption_body) values ('<DS-1>', 'safe', '...')` → **denied**.
- [ ] As client A: even DV-1 (used in client A's own published post) is invisible — clients do not see the draft history of their own posts.

### 4. Client read-blocked on `ai_agents`
- [ ] As client A: `select * from public.ai_agents` returns 0 rows.
- [ ] As client A: any insert / update / delete on `ai_agents` → **denied**.

### 5. Team assigned vs unassigned — concepts
- [ ] As `team@veroxa.test` (assigned A, role=executor): `select count(*) from public.content_concepts where client_id='<A>'` = 3 (CA-1, CA-2, CA-3).
- [ ] As team@: `select count(*) from public.content_concepts where client_id='<B>'` = 0.
- [ ] As team@: `insert into public.content_concepts (client_id, content_angle) values ('<A>', 'weekend brunch')` → succeeds.
- [ ] As team@: same insert with `client_id='<B>'` → **denied**.
- [ ] As `team2@veroxa.test` (assigned B, role=reporter): insert into `content_concepts` for B → **denied** (reporter excluded from `can_manage_client_operations`).

### 6. Team assigned vs unassigned — draft_sets / draft_variants
- [ ] As team@ (assigned A): `select count(*) from public.draft_sets` = 3 (DS-1, DS-2, DS-3 — all on A's concepts).
- [ ] As team@: `insert into public.draft_sets (concept_id) values ('<CA-1>')` → succeeds.
- [ ] As team@: `insert into public.draft_sets (concept_id) values ('<CB-1>')` → **denied** (policy joins through `content_concepts.client_id`).
- [ ] As team@: `insert into public.draft_variants (draft_set_id, variant_type, caption_body) values ('<DS-1>', 'safe', 'hello')` → succeeds.
- [ ] As team@: `insert into public.draft_variants (draft_set_id, variant_type, caption_body) values ('<DS-4>', 'safe', 'hello')` → **denied** (DS-4 → CB-1 → client B).

### 7. Operator visibility
- [ ] As `operator@veroxa.test`: `select count(*) from public.content_concepts` = 4 (all rows across A + B).
- [ ] As operator@: `select count(*) from public.draft_sets` = 4.
- [ ] As operator@: `select count(*) from public.draft_variants` = 5.
- [ ] As operator@: `update public.content_concepts set status='approved' where id='<CA-2>'` → succeeds.
- [ ] As operator@: `select count(*) from public.ai_agents` = 5.
- [ ] As operator@: `update public.ai_agents set is_enabled=true where agent_key='caption'` → **denied** (owner-only).
- [ ] As operator@: `update public.ai_agents set config_json='{"model":"demo"}'::jsonb where agent_key='caption'` → **denied** (owner-only).

### 8. Owner-only `ai_agents.is_enabled` toggle
- [ ] As `owner@veroxa.test`: `update public.ai_agents set is_enabled=true where agent_key='caption'` → succeeds.
- [ ] As owner@: `update public.ai_agents set config_json='{"model":"demo","temperature":0.7,"prompt_template_id":"v1","max_tokens":400}'::jsonb where agent_key='caption'` → succeeds.
- [ ] As owner@: `insert into public.ai_agents (agent_key, name, category, purpose) values ('voice_match','Voice Match','content','Style alignment')` → succeeds.
- [ ] As operator@, team@, client@: same updates → all **denied**.
- [ ] `config_json` round-trip verified to contain no secret-shaped values (`api_key`, `apiKey`, `bearer`, `Bearer `, `sk-…` substrings) — a manual review during the SQL draft pass plus a documented engineering rule.

### 9. System updates `ai_agents.last_run_at`
- [ ] As service role: `update public.ai_agents set last_run_at=now() where agent_key='caption'` → succeeds (RLS bypassed for service role).
- [ ] As service role: simultaneous `is_enabled=true` change in the same statement is technically allowed by RLS bypass, but the agent runtime contract restricts service-role writes to `last_run_at` only. Verified by code review (no runtime exists yet to enforce this at the DB layer).
- [ ] As any non-service authenticated role: `update public.ai_agents set last_run_at=now()` → **denied** (owner-only column write via the owner_all policy; operator has SELECT only).

### 10. Post FK addition safety
- [ ] Setting `posts.concept_id` to a non-existent UUID → fails with FK violation.
- [ ] Setting `posts.concept_id` to `<CA-1>` (real concept on client A) → succeeds.
- [ ] Setting `posts.draft_variant_id` to a non-existent UUID → fails with FK violation.
- [ ] Setting `posts.draft_variant_id` to `<DV-1>` (real variant) → succeeds.
- [ ] `delete from public.content_concepts where id='<CA-1>'` → succeeds; any post that referenced `<CA-1>` has `concept_id` reset to NULL (`on delete set null`); the post itself is preserved.
- [ ] `delete from public.draft_variants where id='<DV-1>'` → succeeds; any post that referenced `<DV-1>` has `draft_variant_id` reset to NULL; the post is preserved.
- [ ] Confirm M004 application alone did NOT add either FK — both columns were bare uuid placeholders before M006.
- [ ] Pre-flight: any existing `posts.concept_id` / `posts.draft_variant_id` value that does not resolve to a real row blocks the FK creation. On greenfield this is a no-op; in any non-greenfield environment, null those out first.

### 11. No real AI activity
- [ ] Inserting a `content_concepts` row with `generated_by_agent='content_strategist'` does NOT cause any external API call (no integration exists).
- [ ] Inserting `draft_sets` / `draft_variants` rows does NOT call any AI provider.
- [ ] `ai_agents.is_enabled=true` is inert in M006 — there is no runtime that reads it.
- [ ] No environment variable for an AI provider key is required to apply M006 or run the seed.
- [ ] `config_json` for every seeded agent contains no `api_key`, `apiKey`, `Authorization`, bearer-shaped string, or `sk-`-prefixed string.

### 12. additional_media_ids hygiene (issue E4 follow-up)
- [ ] Inserting a concept with `additional_media_ids = ARRAY['<media on A>', '<media on A>']::uuid[]` succeeds.
- [ ] Inserting a concept with `additional_media_ids = ARRAY['<random uuid not in media_assets>']::uuid[]` succeeds (no FK enforcement). Confirms the documented limitation.
- [ ] Inserting a concept on client A with `additional_media_ids = ARRAY['<media on B>']::uuid[]` succeeds at the DB layer. Confirms the documented limitation; future validation trigger must reject this.

### 13. Rollback ordering — post FKs before draft / concept tables
- [ ] Rollback script drops `posts_draft_variant_id_fkey` and `posts_concept_id_fkey` **before** dropping `draft_variants`, `draft_sets`, and `content_concepts`.
- [ ] Reversing the order (drop `content_concepts` while the `posts.concept_id` FK still references it) fails with "cannot drop table because other objects depend on it" / "constraint depends on table".
- [ ] After rollback, `content_concepts`, `draft_sets`, `draft_variants`, `ai_agents`, and both `posts` FKs are absent from the schema; `posts.concept_id` and `posts.draft_variant_id` revert to bare uuid columns.
- [ ] Pre-M006 snapshot → apply M006 → restore snapshot → state matches.

### 14. Re-application / idempotency
- [ ] Apply M006 to a clean dev project that has M001 + M002 + M003 + M004 → succeeds.
- [ ] Re-apply M006 through the Supabase runner → "already applied".
- [ ] Re-run raw `.sql` → fails cleanly with "relation already exists".

### 15. RLS predicate cost — issue E3 sanity check
- [ ] With ~1,000 seeded concepts split across two clients, `select count(*) from public.draft_sets` as team@ runs in `< 50 ms` on the dev project. If not, file as a follow-up to denormalize `client_id` onto `draft_sets` and `draft_variants` (kept in sync by trigger).

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

---

## Blocking Issues Before Real Migration

| # | Issue | Severity | Resolution |
|---|---|---|---|
| E1 | M006 SQL draft does not yet exist | **Closed** — `006_content_ai_layer_draft.sql` authored | n/a |
| E2 | `ai_agents.config_json` key shape not pinned | **Closed** — locked to `{model, temperature, prompt_template_id, max_tokens}` and documented in the SQL draft column comment + Test 8 | n/a |
| E3 | `draft_sets` / `draft_variants` policies join through `content_concepts` for `client_id` | NOT a blocker for M006 schema | Measured via Test 15 on dev. If hot, denormalize `client_id` onto both child tables (kept in sync by trigger). |
| E4 | `content_concepts.additional_media_ids` is `uuid[]` — no FK on array elements | NOT a blocker for M006 schema | Validation trigger added in a follow-up migration. Test 12 documents the V1 limitation. |
| E5 | Test plan above is outline-only, no fixtures | **Closed** — this file materializes fixtures + per-test pass/fail cells | n/a |
| E6 | No AI agent runtime exists | NOT a blocker for M006 schema | Out of scope; agent runtime is a separate track. `is_enabled` is inert until the runtime ships; `last_run_at` will never be written. |
| E7 | Activity-log writes for content-table status transitions not yet wired | NOT a blocker for M006 schema | Tracked alongside the hybrid log strategy from `SUPABASE_RLS_PLAN_V1.md` Part 9. |
| E8 | No real OpenAI / Anthropic / other provider integration | NOT a blocker for M006 | Explicitly out of scope. No keys, no SDKs, no calls. `config_json` placeholder values only. |
| E9 | `generated_by_agent` is free text, not a FK to `ai_agents.agent_key` | NOT a blocker | Documented in column comment. Promote to a real FK in a future migration if agent keys stabilize. |

**Promotion gate:** M004 promoted + green. E1, E2, E5 closed (this file). Tests 1–15 green on dev. E3 and E4 resolved (denormalization decision recorded, array-validation trigger drafted) before any real agent runtime ships against the schema.

---

## Cross-references

- M006 SQL draft (this plan's SQL): `docs/sql_drafts/migrations_review/006_content_ai_layer_draft.sql`
- M006 plan: `docs/MIGRATION_006_CONTENT_AI_LAYER_PLAN.md`
- M006 earlier outline (this file supersedes): `docs/MIGRATION_006_TEST_PLAN_OUTLINE.md`
- M005 plan: `docs/MIGRATION_005_REPORTING_FOUNDATION_PLAN.md`
- M004 draft: `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql`
- Schema reference: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- RLS reference: `docs/SUPABASE_RLS_PLAN_V1.md`
- Portal query safety contract: `docs/PORTAL_QUERY_SAFETY_PLAN.md`
- Demo source files: `src/data/demo/demoAgents.ts`, `src/data/demo/demoPosts.ts`
