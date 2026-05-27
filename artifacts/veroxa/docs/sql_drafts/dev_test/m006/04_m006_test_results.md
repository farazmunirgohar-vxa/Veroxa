# M006 Dev Test Results

**Run start:** _<fill in>_
**Run end:** _<fill in>_
**Operator:** _<fill in>_
**Dev project ref:** _<fill in>_

**Pre-flight confirmations**

- [ ] AUTH_MODE is `"placeholder"` and unchanged
- [ ] Portal NOT connected
- [ ] No real client / restaurant data present
- [ ] **No real AI provider credentials configured anywhere**
- [ ] M001 through M005 applied + green
- [ ] M003 + M004 corrections applied (`m003/01c`, `m004/01c`)
- [ ] M001–M004 fixtures present (clients A + B, POST_A2)
- [ ] M006 apply succeeded (`01_apply_m006.sql`)
- [ ] M006 seed succeeded (`concepts=4, sets=4, variants=5, agents=5`)
- [ ] Seed `config_json` audit returned 0 suspicious rows

**`ai_agents.config_json` safety checklist (must all pass before sign-off)**

- [ ] No API keys (`api_key`, `apiKey`, `api-key`, `x-api-key`) in any row
- [ ] No bearer tokens (`Authorization`, `Bearer `, `bearer`) in any row
- [ ] No provider secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
      `GOOGLE_API_KEY`, `openai_*`, `anthropic_*`, `gemini_*`)
- [ ] No live model credentials (`sk-...`, `xai-...`, JWT `eyJ...`,
      Stripe `sk_live_*` / `pk_live_*`)
- [ ] No signed URLs (`X-Amz-Signature`, `X-Goog-Signature`, `?token=`)
- [ ] `ai_agents.is_enabled=true` confirmed INERT — no runtime reads
      the flag in this codebase; toggling it has no external effect

## Test results

| #   | Test                                                          | Result | Notes |
|-----|---------------------------------------------------------------|--------|-------|
| 1a  | client@A SELECT concepts = 0                                  | ☐      |       |
| 1b  | client@A INSERT concept → denied                              | ☐      |       |
| 1c  | client@A UPDATE concepts → 0 rows affected                    | ☐      |       |
| 1d  | client@A DELETE concepts → 0 rows affected                    | ☐      |       |
| 2a  | client@A SELECT draft_sets = 0                                | ☐      |       |
| 2b  | client@A INSERT draft_set → denied                            | ☐      |       |
| 3a  | client@A SELECT draft_variants = 0                            | ☐      |       |
| 3b  | client@A SELECT DV_1 (used in own post) = 0                   | ☐      |       |
| 4a  | client@A SELECT ai_agents = 0                                 | ☐      |       |
| 4b  | client@A INSERT ai_agents → denied                            | ☐      |       |
| 5a  | team@A: A concepts = 3, B concepts = 0                        | ☐      |       |
| 5b  | team@A INSERT concept for A → succeeds                        | ☐      |       |
| 5c  | team@A INSERT concept for B → denied                          | ☐      |       |
| 5d  | team2@B (reporter) INSERT concept for B → denied              | ☐      |       |
| 6a  | team@A: draft_sets visible = 3                                | ☐      |       |
| 6b  | team@A INSERT set on CA_1 → succeeds                          | ☐      |       |
| 6c  | team@A INSERT set on CB_1 → denied                            | ☐      |       |
| 6d  | team@A INSERT variant on DS_1 → succeeds                      | ☐      |       |
| 6e  | team@A INSERT variant on DS_4 → denied                        | ☐      |       |
| 7a  | operator: concepts=4, sets=4, variants=5, agents=5            | ☐      |       |
| 7b  | operator UPDATE concept status → succeeds                     | ☐      |       |
| 7c  | operator UPDATE ai_agents.is_enabled → denied                 | ☐      |       |
| 7d  | operator UPDATE ai_agents.config_json → denied                | ☐      |       |
| 8a  | owner UPDATE ai_agents.is_enabled → succeeds                  | ☐      |       |
| 8b  | owner UPDATE ai_agents.config_json (locked shape) → succeeds  | ☐      |       |
| 8c  | owner INSERT new ai_agent → succeeds                          | ☐      |       |
| 8d  | Suspicious config_json query returns 0 rows                   | ☐      | **SECURITY** |
| 9a  | service role UPDATE last_run_at → succeeds                    | ☐      |       |
| 9b  | operator UPDATE last_run_at → denied                          | ☐      |       |
| 10a | posts.concept_id = bad uuid → FK violation                    | ☐      |       |
| 10b | posts.concept_id = CA_1 → succeeds                            | ☐      |       |
| 10c | posts.draft_variant_id = bad uuid → FK violation              | ☐      |       |
| 10d | posts.draft_variant_id = DV_1 → succeeds                      | ☐      |       |
| 10e | delete CA_1 → post.concept_id becomes NULL; post survives     | ☐      |       |
| 10f | delete DV_1 → post.draft_variant_id NULL; post survives       | ☐      |       |
| 11a | No HTTP / pg_net extension referenced in M006 SQL (grep clean)| ☐      |       |
| 11b | is_enabled toggle inert — no runtime exists (documentary)     | ☐      |       |
| 11c | config_json secret-substring scan returns 0 rows              | ☐      | **SECURITY** |
| 12a | additional_media_ids with valid uuids → succeeds              | ☐      |       |
| 12b | additional_media_ids with random uuid → succeeds (V1 limitation) | ☐   | documented E4 |
| 12c | additional_media_ids cross-tenant uuid → succeeds (V1 limitation) | ☐  | documented E4 |
| 13a | drop content_concepts without dropping FKs → fails            | ☐      |       |
| 13b | drop FKs then tables in correct order → succeeds              | ☐      |       |
| 14a | Re-apply through Supabase runner → "already applied"          | ☐      |       |
| 14b | Re-run `01_apply_m006.sql` raw → "relation already exists"    | ☐      |       |
| 15  | RLS predicate cost ~1000-row check (optional)                 | ☐      | skip unless load-test seed present |

## Stop conditions hit

_None expected. Two SECURITY checks (8d, 11c) MUST pass or this is an
incident — `config_json` is plaintext jsonb visible to any owner; any
secret-shaped value there is a leak._

## Post-run state

- [ ] AUTH_MODE still `"placeholder"`
- [ ] Portal still NOT connected
- [ ] No M007 applied
- [ ] No real AI provider connected
- [ ] All `ai_agents.is_enabled` toggles in tests were rolled back
- [ ] `ai_agents.config_json` has no secret-shaped values
- [ ] All seed rows remain (concepts=4, sets=4, variants=5, agents=5)

## Sign-off

- [ ] All required tests PASS → M006 schema is safe to promote when
      next opportunity arises. Promotion still requires AUTH_MODE work
      to be complete elsewhere in the program.
- [ ] If any test FAIL → file findings; do NOT promote M006 SQL to
      `supabase/migrations/`.
- [ ] If 8d or 11c FAIL → treat as a security incident: rotate any
      leaked values, scrub `config_json`, document the incident.
