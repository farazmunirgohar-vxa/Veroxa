# M006 Dev Test Execution Package

**Purpose:** Paste-and-run files for testing Migration 006 (Content /
AI Layer) in the Supabase dev project SQL editor. Authoritative source
files:

- `docs/sql_drafts/migrations_review/006_content_ai_layer_draft.sql`
- `docs/MIGRATION_006_TEST_PLAN.md`
- `docs/MIGRATION_006_CONTENT_AI_LAYER_PLAN.md`

## Hard preconditions (all must be true)

- [ ] **M001 through M005 applied and green** on this dev project, including:
      - M003 team-scope correction (`m003/01c`)
      - M004 staff-policy correction (`m004/01c`)
- [ ] M001–M004 fixture set present (5 users, 2 clients, team
      assignments, media_assets, posts).
- [ ] M005 fixture set present (12 weekly/monthly reports) — not
      strictly required for M006 tests but typical of a green dev project.
- [ ] DEV Supabase project only — never production.
- [ ] AUTH_MODE = `"placeholder"`, portal NOT connected.
- [ ] **No real AI provider credentials are configured.** M006 ships no
      runtime; toggling `ai_agents.is_enabled=true` is inert.
- [ ] **`config_json` must contain no API keys, secrets, or
      bearer-shaped strings**, ever, at any stage of this run.

If any precondition is false, STOP.

## Do not (during this run)

- Apply M007 or later migrations.
- Move M006 SQL into `supabase/migrations/`.
- Change `AUTH_MODE`.
- Connect the portal.
- Add any real OpenAI / Anthropic / Gemini / other provider key
  anywhere — env vars, `config_json`, app code, or test data.
- Change locked pricing.

## Execution order

| Step | File | Where to run |
|---|---|---|
| 1 | `01_apply_m006.sql` | Supabase SQL editor (postgres context) |
| 2 | `02_seed_m006_dev_data.sql` | Supabase SQL editor (replace UUID placeholders first) |
| 3 | `03_test_m006_queries.sql` | Supabase SQL editor — run each numbered block separately |
| 4 | `04_m006_test_results.md` | Pass/fail tracker |
| 5 | `M006_EXECUTION_SUMMARY.md` | Reference |

> No `01b` guard file in M006 — the source draft has no separate guard
> migration.

## What gets created

- 4 tables: `content_concepts`, `draft_sets`, `draft_variants`, `ai_agents`
- 2 FK additions on `posts`: `concept_id`, `draft_variant_id` (deferred from M004)
- RLS + policies on all four tables
- No client-safe views (all four tables are internal-only)

## `ai_agents.config_json` safety checklist (mandatory before sign-off)

`config_json` is plaintext jsonb readable by any Owner. Anything
secret-shaped that lands in this column is a leak. Before signing off
this package, confirm:

- [ ] No API keys (`api_key`, `apiKey`, `api-key`, `x-api-key`) at any depth.
- [ ] No bearer tokens (`Authorization`, `Bearer `, `bearer`) at any depth.
- [ ] No provider secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
      `GOOGLE_API_KEY`, `openai_*`, `anthropic_*`, `gemini_*`).
- [ ] No live model credentials (`sk-...`, `xai-...`, JWT-shaped
      `eyJ...`, Stripe `sk_live_*` / `pk_live_*`).
- [ ] No signed URLs (`X-Amz-Signature`, `X-Goog-Signature`, `?token=`).
- [ ] **`ai_agents.is_enabled=true` is INERT** — there is no runtime
      in this codebase that reads the flag. Tests 8a, 8b, 11b confirm
      this is documentary only; flipping the flag has no external
      effect in this phase.

Failure of any item above is a security incident — rotate any leaked
value, scrub `config_json`, and do NOT promote M006 SQL to
`supabase/migrations/`.

## Locked decisions vs. the originating prompt

1. `ai_agents.config_json` key shape is locked to
   `{model, temperature, prompt_template_id, max_tokens}`. Any other
   key is allowed but uncontracted. **Secrets / API keys / signed URLs
   MUST NEVER appear in this column.**
2. `content_concepts.additional_media_ids` is `uuid[]` — PostgreSQL
   cannot FK-enforce array elements. Integrity is app-side
   responsibility. Test 12 documents the V1 limitation.
3. `content_concepts.generated_by_agent` is free text (NOT a FK to
   `ai_agents.agent_key`). Preserves audit history across agent
   renames / removals.
4. No client policy on any of the four M006 tables — all four are
   internal.

## Test coverage map (15 tests)

| Test | What it confirms |
|---|---|
| 1–4 | Client read/write blocked on all four M006 tables |
| 5 | Team scope on concepts (assigned vs. unassigned; reporter excluded) |
| 6 | Team scope on draft_sets and draft_variants via joined client_id |
| 7 | Operator visibility across tenants + read-only on `ai_agents` |
| 8 | Owner-only `ai_agents` writes (insert + update + is_enabled toggle) |
| 9 | Service role writes `last_run_at`; non-service authenticated writes denied |
| 10 | Post FK additions: FK violation on bad uuid; on-delete-set-null cascade |
| 11 | **No real AI activity, no provider call, no secret in `config_json`** |
| 12 | `additional_media_ids` hygiene (limitations documented) |
| 13 | Rollback ordering — post FKs before draft / concept tables |
| 14 | Re-application / idempotency |
| 15 | RLS predicate cost sanity (optional — only with ~1000-row test set) |

## Stop conditions (any one halts the run)

- `01_apply_m006.sql` errors (likely cause: M005 not applied first, or
  M004 `posts.concept_id` / `posts.draft_variant_id` columns missing).
- `02_seed_m006_dev_data.sql` errors after placeholder replacement.
- Test 11 finds any secret-shaped substring in `config_json`.
- Any required test fails — there are no predicted-fail tests in M006.

## What to do when all required tests pass

1. Complete `04_m006_test_results.md`.
2. Confirm AUTH_MODE still `"placeholder"`, portal still disconnected,
   no M007 applied, no real AI provider connected, no key written to
   `config_json` anywhere.
3. Report back so the next workstream can proceed (typically M007 plan
   review, portal-connect plan, or agent-runtime track).

## UUID reference (fixed — do not randomise)

| Alias | UUID | Description |
|---|---|---|
| CLIENT_A_ID | `a0000000-0000-4000-a000-00000000000a` | Restaurant A |
| CLIENT_B_ID | `b0000000-0000-4000-b000-00000000000b` | Restaurant B |
| POST_A2 | `a4000001-0000-4000-a000-000000000002` | Anniversary reel (published) |
| CA_1 | `a6000001-0000-4000-a000-000000000001` | Concept on A — generated |
| CA_2 | `a6000001-0000-4000-a000-000000000002` | Concept on A — under_review |
| CA_3 | `a6000001-0000-4000-a000-000000000003` | Concept on A — rejected, staff-authored |
| CB_1 | `b6000001-0000-4000-b000-000000000001` | Concept on B — generated |
| DS_1 | `a6000002-0000-4000-a000-000000000001` | Draft set on CA_1, v1, generated |
| DS_2 | `a6000002-0000-4000-a000-000000000002` | Draft set on CA_1, v2, needs_regeneration |
| DS_3 | `a6000002-0000-4000-a000-000000000003` | Draft set on CA_2, v1, under_review |
| DS_4 | `b6000002-0000-4000-b000-000000000001` | Draft set on CB_1, v1, generated |
| DV_1 | `a6000003-0000-4000-a000-000000000001` | Variant safe, approved, used_in_post=POST_A2 |
| DV_2 | `a6000003-0000-4000-a000-000000000002` | Variant engagement, archived |
| DV_3 | `a6000003-0000-4000-a000-000000000003` | Variant sales, generated |
| DV_4 | `a6000003-0000-4000-a000-000000000004` | Variant safe (on CA_2), under_review |
| DV_5 | `b6000003-0000-4000-b000-000000000001` | Variant safe (on CB_1), generated |

`ai_agents` rows use `agent_key` as their stable identifier; UUIDs are
auto-generated.
