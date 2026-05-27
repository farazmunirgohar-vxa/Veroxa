# Dev Test Readiness Report

**Generated:** Pass — Dev Test Package Integrity Audit
**Scope:** M001 through M006 migration drafts vs. their dev-test packages.
**Mode:** Read-only audit. No SQL was applied. No file under
`supabase/migrations/` exists or was created. `AUTH_MODE` remains
`"placeholder"`. Portal stays disconnected from any real database.

## Audit invariants (verified, all passing)

- `AUTH_MODE` is the literal string `"placeholder"` in
  `artifacts/veroxa/src/lib/auth/authMode.ts` (line 19) and was not
  modified.
- No `supabase/migrations/` directory exists in the repo.
- No portal UI, navigation, four-shell, pricing, fixture, or role
  definition was modified.
- No AI provider, publishing API, or payment system was wired.
- Veroxa typecheck passes (`pnpm --filter @workspace/veroxa run typecheck`).

## Readiness matrix

| Migration | Draft Complete | Test Package Complete | Corrections Included | Known Issues | Ready For Human Execution |
|---|---|---|---|---|---|
| M001 — Identity Foundation | Yes (`001_identity_foundation_draft.sql`) | Yes (`dev_test/01_apply_m001.sql`, `02_seed_dev_users.sql`, `03_test_queries.sql`, `04_test_results.md`, `README.md`) | N/A — no correction class for M001 | None | **Yes** |
| M002 — Client Foundation | Yes (`002_client_foundation_draft.sql`) | Yes (`dev_test/m002/` — apply, seed, tests, results, README, exec summary) | N/A — staff scoping legitimately uses `can_view_client` here (predates the m003/m004/m005 correction class); flagged for visibility only | None | **Yes** |
| M003 — Media Foundation | Yes (`003_media_foundation_draft.sql` + `003_notifications_status_guard_draft.sql` + `003_team_scope_correction_draft.sql`) | Yes (`dev_test/m003/` — apply, 01b notifications-status guard, 01c team-scope correction, seed, tests, results, README, exec summary) | Yes — included as standalone `01c` (deliberate test-to-fail diagnostic flow: apply defect → observe predicted failures in tests 7 + 13 → apply correction → re-test green). Documented in README. | None. The "predicted failure" comments in `03_test_m003_queries.sql` are NOT stale — they are intentional diagnostic markers for the pre-`01c` state. | **Yes** |
| M004 — Posting Foundation | Yes (`004_posting_foundation_draft.sql` + `004_post_slot_reset_guard_draft.sql` + `004_posts_select_staff_correction_draft.sql`) | Yes (`dev_test/m004/` — apply, 01b post-slot reset guard, 01c posts-select-staff correction, seed, tests, results, README, exec summary) | Yes — same diagnostic flow as M003: `01_apply_m004.sql` still uses `can_view_client` (lines 160, 192) by design; `01c_apply_posts_select_staff_correction.sql` swaps in `is_assigned_to_client`. Documented in README + EXEC_SUMMARY. | None. The "predicted failure" comments for tests 1a and 3a are intentional. | **Yes** |
| M005 — Reporting Foundation | Yes (`005_reporting_foundation_draft.sql` + `005_reports_select_staff_correction_draft.sql`) | Yes (`dev_test/m005/` — apply, 01b legacy/re-apply only, seed, tests with explicit acceptance tests 2c + 5d, results, README, exec summary) | Yes — **baked into `01_apply_m005.sql`** (lines 142, 195) and into the upstream draft (lines 215, 279). `01b` is retained only as a no-op re-apply for dev projects that ran the pre-correction apply step. | None | **Yes** |
| M006 — Content / AI Layer | Yes (`006_content_ai_layer_draft.sql`) | Yes (`dev_test/m006/` — apply, seed, tests, results, README, exec summary; 15 tests covering all 4 tables) | N/A — no correction class for M006 | None. `ai_agents.config_json` schema is locked to `{model, temperature, prompt_template_id, max_tokens}` consistently across draft, schema doc, and exec summary. No secrets in seeds/tests (all UUID placeholders + `*@veroxa.test` emails; no API keys, bearer tokens, signed URLs, or `pg_net` / `extensions.http` references). | **Yes** |

## Diagnostic flow note (M003 + M004)

M003 and M004 deliberately ship a **two-phase test pattern**:

1. `01_apply_m{N}.sql` applies the original draft, which contains the
   `can_view_client`-on-staff-SELECT defect.
2. The tester runs the test suite and observes the documented
   "predicted failures" — proof the defect class exists.
3. `01c_apply_..._correction.sql` swaps in `is_assigned_to_client`.
4. The tester re-runs the affected tests — they now pass.

This is documented in both `README.md` files and is intentional. The
"predicted FAIL" comments in those test files are NOT stale and must
not be removed.

M005 uses the **baked-in** pattern instead: the correction is part of
`01_apply_m005.sql` from the start, and `01b` is retained only as a
re-apply utility for dev projects that ran the pre-correction apply
step. This is the recommended pattern for future migrations.

## Recommended next human action

1. **Execute the M001–M006 dev-test packages in order** on the dev
   Supabase project, following the README in each `dev_test/m{N}/`
   directory:
   - M001 → M002 → M003 (incl. 01b + 01c) → M004 (incl. 01b + 01c) →
     M005 → M006.
   - For M003 / M004, follow the two-phase diagnostic flow described
     above. Confirm the predicted failures fire before applying `01c`,
     then re-run the affected tests post-correction.
   - For M005, the correction is already baked into `01_apply`; skip
     `01b` on fresh dev projects.
2. **Fill in `04_*_test_results.md` as you go.** Sign off only when
   every required test row is checked.
3. **Do NOT** promote any SQL to `supabase/migrations/` until the full
   M001–M006 dev-test gate is green and the operator/owner explicitly
   approves the cutover.
4. **Do NOT** flip `AUTH_MODE` to `"real"` or connect the portal
   during this audit cycle. The portal placeholder short-circuit in
   `src/hooks/useClientPortalData.ts` is the canonical enforcement
   point and must remain in place until the dev-test gate is cleared.

## Confirmations

- **AUTH_MODE unchanged:** `src/lib/auth/authMode.ts:19` →
  `export const AUTH_MODE: AuthMode = "placeholder";` (verified, not
  modified by this audit).
- **Portal remains disconnected:** `useClientPortalData.ts` short-
  circuits to demo fixtures when `AUTH_MODE === "placeholder"`
  (verified by greps in `PORTAL_QUERY_SAFETY_CHECKLIST.md` §4b).
- **No migrations applied / no migration files added:** no
  `supabase/migrations/` directory exists; all SQL stays under
  `docs/sql_drafts/`.
- **Build/typecheck result:** `pnpm --filter @workspace/veroxa run
  typecheck` → PASS.

## Files reviewed

- All M001–M006 drafts under
  `artifacts/veroxa/docs/sql_drafts/migrations_review/`.
- All M001–M006 dev-test packages under
  `artifacts/veroxa/docs/sql_drafts/dev_test/` (root M001 files plus
  `m002/`, `m003/`, `m004/`, `m005/`, `m006/` subdirectories — apply
  SQL, 01b/01c correction/guard SQL, seed SQL, test SQL, results
  markdown, README, execution summary).
- `src/lib/auth/authMode.ts` and `src/hooks/useClientPortalData.ts`
  (invariant confirmation only — no modifications).

## Files modified

None. This was a read-only audit. The only file created is this
report (`DEV_TEST_READINESS_REPORT.md`).
