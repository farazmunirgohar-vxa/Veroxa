# M006 Execution Summary

**Status:** Ready to run on the Supabase dev project. Authored from
`docs/sql_drafts/migrations_review/006_content_ai_layer_draft.sql` and
`docs/MIGRATION_006_TEST_PLAN.md`. Not executed.

## What this package does

Applies M006 (content_concepts, draft_sets, draft_variants, ai_agents
+ two deferred FK additions on posts) to the dev project, seeds 18
rows across the four new tables, and runs 49 numbered checks across 15
tests. Validates default-deny for clients, team scope via joined
client_id, owner-only `ai_agents` writes, the M004→M006 post FK
contract, and — critically — the **zero-credentials invariant** on
`ai_agents.config_json`.

## Source-of-truth files

- SQL draft: `docs/sql_drafts/migrations_review/006_content_ai_layer_draft.sql`
- Plan: `docs/MIGRATION_006_CONTENT_AI_LAYER_PLAN.md`
- Test plan: `docs/MIGRATION_006_TEST_PLAN.md`
- Schema: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- RLS: `docs/SUPABASE_RLS_PLAN_V1.md`

## Hard invariants — not changed by this run

- `AUTH_MODE = "placeholder"` (literal in `src/lib/auth/authMode.ts`)
- Portal is NOT connected to the database
- No real AI provider credentials configured anywhere
- No publishing integrations, no payment processing
- No real client / restaurant data
- Locked pricing is unchanged
- **`ai_agents.config_json` MUST NEVER contain secrets, API keys,
  bearer tokens, or signed URLs** — at any stage of this run, ever

## Files in this package

| File | Role |
|---|---|
| `README.md` | How to run, preconditions, locked decisions, UUID table |
| `01_apply_m006.sql` | Applies M006 schema, RLS, the two post FKs |
| `02_seed_m006_dev_data.sql` | Seeds 4 concepts + 4 sets + 5 variants + 5 agents (replace `<<...>>` placeholders) |
| `03_test_m006_queries.sql` | 15 tests, 49 numbered checks |
| `04_m006_test_results.md` | Pass/fail tracker (one row per check) |
| `M006_EXECUTION_SUMMARY.md` | This file |

> No `01b` guard step in M006.

## Fixture overview (after seed)

**content_concepts (4):**
- CA_1 (A, generated), CA_2 (A, under_review), CA_3 (A, rejected, staff), CB_1 (B, generated)

**draft_sets (4):**
- DS_1 (CA_1, v1, generated), DS_2 (CA_1, v2, needs_regeneration),
  DS_3 (CA_2, v1, under_review), DS_4 (CB_1, v1, generated)

**draft_variants (5):**
- DV_1 (DS_1, safe, approved, used_in_post=POST_A2)
- DV_2 (DS_1, engagement, archived)
- DV_3 (DS_1, sales, generated)
- DV_4 (DS_3, safe, under_review)
- DV_5 (DS_4, safe, generated)

**ai_agents (5):** content_strategist, caption, ops_router,
intel_analyst, exec_brief — all `is_enabled=false`, `config_json=NULL`.

## Test coverage map

| Tests | Coverage |
|---|---|
| 1–4 | Client SELECT/INSERT/UPDATE/DELETE blocked on all four M006 tables |
| 5 | Team scope on `content_concepts` (assigned vs unassigned, reporter exclusion) |
| 6 | Team scope on `draft_sets` and `draft_variants` via joined `client_id` |
| 7 | Operator visibility + read-only on `ai_agents` |
| 8 | Owner-only `ai_agents` writes + **config_json secret-substring audit** |
| 9 | Service role writes `last_run_at`; non-service authenticated writes denied |
| 10 | Post FK additions: FK violation on bad uuid; on-delete-set-null cascade |
| 11 | **Zero real AI activity** — no HTTP extension calls; no secrets in `config_json` |
| 12 | `additional_media_ids` documented V1 limitations (no FK on array elements) |
| 13 | Rollback ordering — post FKs must drop before parent tables |
| 14 | Re-application / idempotency |
| 15 | RLS predicate cost (optional — needs ~1000-row seed) |

## Stop conditions (any one halts the run)

- `01_apply_m006.sql` errors (likely cause: M005 not applied first, or
  M004 placeholder columns missing on `posts`).
- `02_seed_m006_dev_data.sql` errors after placeholder replacement.
- **Test 8d or 11c finds any secret-shaped substring in `config_json`** —
  treat as a security incident.
- Any required test fails — no predicted-fail tests in M006.

## Out of scope

- Promoting any SQL to `supabase/migrations/`
- Connecting the portal
- Changing AUTH_MODE
- Any real AI provider integration (OpenAI / Anthropic / Gemini / etc.)
- Agent runtime — `is_enabled=true` is inert; `last_run_at` will only
  ever be written once a runtime ships in a future migration
- Activity-log writes for content-table transitions (hybrid log
  strategy, deferred)
- M007 or any subsequent migration

## What "green" unlocks

When all required checks pass (and Test 8d + Test 11c both confirm
zero suspicious `config_json` substrings), the M006 schema is
considered safe to promote at the next program checkpoint. Promotion
itself still requires the broader AUTH_MODE-flip work to be complete
on its own track.
