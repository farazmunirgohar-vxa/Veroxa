# First-Client Readiness Checklist (M021)

Honest snapshot of what is built vs. what is still required before
the first real client uses Veroxa in production.

## A. Already built

- Pricing model (Google Optimization, Complete Online Presence,
  Ads Add-on, Ads Management Only).
- Client Portal demo.
- Team Portal demo.
- Restaurant Upload Key flow + `/upload` page.
- Team Upload Inbox.
- Client Direction Center.
- Team Direction Queue.
- Rule-based Adaptive Intelligence preview.
- Weekly Strategy Snapshot.
- Supabase read-only foundation (opt-in via
  `VITE_VEROXA_DATA_MODE=supabase_readonly`).
- Shared local stores: `localUploadStore`, `localDirectionStore`.
- First-client TypeScript contracts (`firstClientContracts.ts`).
- Visibility rules helper (`visibilityRules.ts`).
- Write readiness helper (`writeReadiness.ts`, `WRITES_ENABLED=false`).

## B. Still local/demo only

- Uploads (metadata in `sessionStorage`, no real file storage).
- Direction submissions (metadata in `sessionStorage`).
- Team review actions (in-memory + session updates only).
- Adaptive memory (fixture).
- Reports / updates flow (fixture).

## C. Needed before real pilot

- Real upload storage (private bucket + signed URLs).
- `upload_submissions` writes.
- `restaurant_upload_keys` table + revocation flow.
- `direction_requests` writes.
- `team_review_decisions` writes.
- Basic client onboarding record (`clients` / `restaurants`).
- Client/team shared real data (RLS scoped).
- Basic manual admin override path.

## D. Needed before first paid client

- Basic reliability: error states, retry guidance, status pages.
- Backup / manual export path.
- Privacy notes + data handling page.
- Status / error handling that never leaks raw DB errors.
- Onboarding SOP (who does what, day 0–7).
- Client expectations document (what Veroxa does + does not do).
- Support process (how clients reach us, response SLA).

## E. Wait until after 1–3 clients

- Owner / Operator portal expansion.
- Real AI APIs (OpenAI / Anthropic / Gemini).
- Real publishing (Meta / Google posts / TikTok).
- Ads platform APIs.
- Payments / billing automation.

## F. M023A–M023B status

- ✅ Write foundation planning complete (schema + RLS + write
  function spec, all under `docs/sql-plan/`).
- ✅ Disabled write adapter complete (`disabledWriteAdapter`,
  `veroxaWriteAdapter` index, extended `writeReadiness.ts`).
- Still needed:
  - Real schema / migrations (after owner approval).
  - `VITE_VEROXA_ENABLE_DEV_WRITES` flag + dev write adapter.
  - Upload submission metadata writes.
  - Direction request writes.
  - Team review status writes.
  - Storage upload (separate later build).

## M023C — Dev write adapter

- ✅ Dev Supabase write adapter created
  (`devSupabaseWriteAdapter.ts`, `writeMappers.ts`, `writeErrors.ts`).
- ✅ `VITE_VEROXA_ENABLE_DEV_WRITES` flag wired through
  `writeReadiness.ts` (exact `"true"` only).
- ✅ `writeAdapter.ts` selects dev adapter when flag is on, otherwise
  disabled adapter.
- ✅ Supabase writes confined to a single file
  (`devSupabaseWriteAdapter.ts`); no page-level `.insert/.update`.
- ✅ Notes sanitized (email / phone / `@handle` / length-capped).
- ✅ Errors safe-mapped — no raw DB error text reaches clients.
- Still needed:
  - Actual schema / migrations with owner approval.
  - RLS policies for the three metadata tables.
  - Connect selected pages to adapter after schema exists.
  - Storage upload (separate later build).

## M024A — Schema/migration foundation

- ✅ First-client metadata schema migration drafted
  (`supabase/migrations/20260601000000_m024a_first_client_metadata_schema.sql`).
- ✅ RLS enabled on every new table; conservative dev-stage policies
  in place; no `anon` writes.
- ✅ `set_updated_at()` trigger added.
- ✅ `schemaReadiness.ts` added; internal readiness page updated.
- Still needed:
  - Apply migration in a dev Supabase project.
  - Verify RLS round-trip with the dev write adapter
    (`VITE_VEROXA_ENABLE_DEV_WRITES="true"`).
  - Connect upload / direction / team-review writes to selected pages.
  - Storage upload (separate later milestone).
  - Real restaurant upload-key management (custom JWT / signed claims
    for per-restaurant scoping).
  - Production RLS tightening (role separation, internal_note
    visibility, per-restaurant binding).

## M024B — Verification and smoke test harness

- ✅ Schema verification utility — reads all 5 M024A tables; safe
  messages; no writes.
- ✅ Dev write smoke test harness — explicit button click, requires
  fictional dev client UUID, dry-run available.
- ✅ UUID validation helper (`devClientIdValidation.ts`).
- ✅ Internal readiness page has Schema Verification and Dev Write
  Smoke Test cards.
- Still needed:
  - Apply M024A migration in a dev Supabase project.
  - Manually create a fictional dev client row; copy its UUID.
  - Verify schema (all 5 tables pass).
  - Run dry run, then full metadata smoke test.
  - Connect selected pages to write adapter (M024C).
  - Storage upload — separate later milestone.

## M025A — Client Direction Center dev write connection

- ✅ Client Direction Center connected to `veroxaWriteAdapter.createDirectionRequest` with local/session-first fallback.
- ✅ `VITE_VEROXA_DEV_CLIENT_ID` env var validated before writes.
- ✅ `"demo-a"` never sent to Supabase.
- ✅ Dev write failure does not break local/session flow.
- ✅ `devClientId.ts` helper added.
- ✅ Internal readiness header wording fixed.
- Still needed:
  - Apply M024A migration in dev Supabase.
  - Create fictional dev client row; set `VITE_VEROXA_DEV_CLIENT_ID`.
  - Test Direction Center dev write end-to-end.
  - Connect Team Direction Queue status writes (M025B).
  - Connect Restaurant Upload metadata writes (M026).
  - Storage upload — separate later milestone.

## M025B — Team Direction Queue dev write connection

- ✅ Team Direction Queue status updates connected to `veroxaWriteAdapter.updateDirectionStatus` with local/session-first fallback.
- ✅ Non-UUID local/demo direction ids skipped safely via `isValidUuid()`.
- ✅ Per-card `DirectionWriteStatus` state; no raw DB errors in UI.
- ✅ `createTeamReviewDecision` deferred (no reliable UUID pair available yet).
- ✅ Client Direction Center banner wording updated.
- Still needed:
  - Apply M024A migration in dev Supabase.
  - Create fictional dev client row; set `VITE_VEROXA_DEV_CLIENT_ID`.
  - Test Direction Center dev write end-to-end.
  - Test Team Direction Queue status write with a UUID-id direction item.
  - M025C — implement direction id read-back for session-originated items.
  - M026 — connect Restaurant Upload metadata writes.
  - Storage upload — separate later milestone.

## M026A–M026C — Free Customer-Flow Readiness Audit

- ✅ Free audit tool added as outreach/sales support at `/free-audit`.
- ✅ Audit recommends package based on weak spots, not highest price.
- ✅ Uses locked pricing from `@/data/pricing/veroxaPricing`.
- ✅ Restaurant-facing language only — no first-client fit / close probability / ability to pay / internal sales notes.
- ✅ Preliminary disclaimer + adaptive learning explanation included.
- ✅ Team Direction Queue banner + status button mapping polished (M026C).
- Still needed later:
  - Save audits as leads (DB).
  - Generate PDF audit reports.
  - AI-assisted scoring.
  - Manual team audit review queue.
  - Audit score history per restaurant over time.
  - Live Google / social platform integrations.

## M027A–M027C — Simplified Audit Inputs

- ✅ Audit tool simplified for easier outreach (only 4 required fields).
- ✅ Optional menu/ordering and other link fields added.
- ✅ Audit Confidence level (Basic / Good / Strong) surfaced on the report.
- ✅ Package recommender works without a stated goal; ads-leaning plans still gated tightly.
- Still needed later:
  - Save audits as leads (DB).
  - Generate PDF audit reports.
  - AI-assisted audit scoring.
  - Live Google / social verification.

## M028–M032 — Self-Selling Lead Engine

- ✅ M028 — Public `/free-audit` now captures opt-in walkthrough
  requests with contact info. Stored locally (localStorage with
  sessionStorage fallback). No DB writes, no API calls.
- ✅ M029 — Internal Veroxa Lead Success Score (100 pts, 8 categories)
  + priority tiers (A / B / Nurture / Low / Not Target). Internal-only —
  never appears on the public audit page.
- ✅ M030 — Team Audit Leads queue at `/demo/team/audit-leads` behind
  `InternalDemoGuard role="team"`. Summary cards, priority filter,
  detail panel with outreach guidance, stage updates, internal notes.
- ✅ M031 — Manual Prospect Scanner at `/demo/team/prospect-scanner`.
  Generates both public audit summary and private internal lead audit
  side-by-side. Optional internal-only flags (warm relationship, owner
  reachability, strategic value). No live scraping.
- ✅ M032 — First-client readiness polish: Veroxa Financial Health
  card on the Audit Leads queue (projected MRR, walkthrough requests,
  won/lost). Self-improving system positioning on `/free-audit`.
- Still needed later:
  - Lead persistence via DB (M024A schema + RLS work first).
  - PDF audit + walkthrough confirmations.
  - Automated outreach cadence.
  - Live Google / social verification for lead audits.
