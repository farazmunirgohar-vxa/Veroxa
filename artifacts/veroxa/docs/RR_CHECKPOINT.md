# RR Release Checkpoint

## 2026-08-08 — Ready decisions + generic-food v2 reviewed candidate

- Verified production is GitHub main `59b1604d887547e2804bdd6d63c97292385dcebb` from merged PR #163, Sites v39 checkout `8749a7d442d3bb068ce626a9d297b8b227493446` (201 files / `4edae9660343cda362968bd08e544ba5a154c90a902ac961365ceb32ea820292`), and exact live43 / `8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c` through `041629`. Historical repository/Sites-mirror fingerprint `9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90` remains separate.
- Draft PR #164 is open from `agent/momo-generic-food-ready-review-v5`, base main59b, at observed opening head `b659ec307da9455c389059b29f2d6f3ab51f095e` / tree `9931d63dcb16a2e2e1cb7c592d2da63b4054cb60`. This is not final-head gate evidence. The reviewed candidate remains 203 Sites files / `a8d5b75ab251f3502b87ec2c99c5f3d51aa7381e0ccefbc94b6183bb92a4c1d0` plus 44 mirrored migrations / `9cc0bba007b6a0c06edf33563fb1bc3f4650811f8f8ea1639cc58c7028ac7324`. PR #164 is unmerged; exact-final-head workflows/reviews, database apply, Sites publish, and activation are unclaimed.
- Pending source migration `20260808045812_momo_ready_team_decisions_and_food_tags_v2.sql` is mirrored at exact SHA-256 `9cf6f0080d38d58d3c1939d928444701b1954bf5cfe96bf7f3e80077bad45cc0`. Supabase MCP generates the live version. After exact-byte apply, the generated version must be verified and both mirrors renamed to it with unchanged bytes in a terminal follow-up PR before Sites publication.
- Release order is green feature PR → freeze reservation/auto-advance/dispatch ingress → drain v4 and staged work to zero → exact-byte MCP apply and DB verification → generated-version reconciliation PR → exact terminal Sites publish/verify → bounded ingress restore. Every step remains pending; neither DB-first nor Sites-first is safe without freeze/drain.
- Scoped production permission exists while automatic deployment stays off. `02609` remains non-comprehensive because live `postgres` is not a `supabase_admin` member. Providers, external/public writes, schedules, posts, review replies, website writes, and Momo activation remain false.

## 2026-08-08 — historical corrective Sites checkpoint

## 2026-08-02 — Sites v36 live / GitHub parity verified

- Live Sites v36 checkout `b8122642b72e5d4e6e74c379469f2a157781ab3d` and the clean mirror match at 185 canonical files, SHA-256 `caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7`; generated `.vinext` cache is excluded.
- The historical v36 repository/Sites mirror has 37 migrations at `9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90`; the exact remote-ledger reconstruction is recorded in the current checkpoint above.
- PR #157 reviewed head `d3a63d25644fc699d1f521f8f803e5bd95daae49` passed all four workflows with zero unresolved review threads and merged at `aafebf93a6bc40f9578c29f4a25371f8203d0387`; all four push-to-main workflows also passed. This remains historical v36 source/repository-mirror evidence and does not prove the local candidate.
- PR #157 caused no database apply and no Sites deployment. PR #155 / Sites v22 remains preserved as historical parity evidence.
- Release gates include 371/371 application tests, build, lint, typecheck, rollback migration compilation, the four exact-head workflows, the four push workflows, and frozen production verification.
- Exact duplicates reuse canonical byte identity without combining rights; each source upload and immutable event remains attributable. Team defaults to consolidated exceptions; Ready is internal and unscheduled.
- Bad media becomes one preserved, evidenced exception. V36 does not auto-edit or auto-resize, and near-duplicate merging is advisory.
- No real v36 upload, provider call, or Ready package exists. Queues, schedules, connections, publishing, posting, replies, website writes, and activation remain empty/off.
- Machine evidence is in `MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json`, `VEROXA_DEPLOYMENT_MANIFEST.json`, and `RR_RELEASE_CHECKPOINT.json`.

## 2026-07-30 — verified v22 signed lifecycle bridge publication

- PR #155 passed all four exact-head workflows at `96a6c00857b438b37c2e8d99329c0f556de850a2`, had zero review threads, and merged at `d1f6a9a78ac54cd5447689d5f8b3d42466daf479`.
- Sites v22 succeeded from checkout `83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e`; its exact 93-file tree is `8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490`. The 16-migration tree remains `09aab45cda17810b52a07429700a4557308405d40a3983635d6bb7848dd4c729`.
- The Edge bridge is active with JWT verification and the matching Sites signing secret is masked. Missing-JWT and unauthenticated status probes fail closed; both custom domains and SSL are active.
- Effective authenticated Media AI proof remains pending Team preflight and the real Team/Client rehearsal. Current rights are expired; candidates, provider calls, and spend are zero.
- USD $20 remains the per-job automatic authorization threshold. AI output stays private until Team inspection; Google/social, external writes, public publishing, and activation remain locked. Momo remains No-Go.
- Current machine evidence is in `MOMO_MEDIA_V22_LIVE_CLOSEOUT.json`, `VEROXA_DEPLOYMENT_MANIFEST.json`, and `RR_RELEASE_CHECKPOINT.json`. The bundled readiness tracker is the immutable v22 pre-deploy snapshot for No-Go/rights/spend, not current bridge-deployment authority.

## 2026-07-30 — v21 production and lifecycle-bridge candidate (historical pre-v22 checkpoint)

- At that historical checkpoint, PR #154 / Sites version 21 / 16 applied migrations was the verified production baseline. Exact identities were GitHub `72c7fd73d3d2dff40ddd91bca2ef01d1ca8cb695`, Sites checkout `8c50dd6726629e77d22f07eb6aac9f6982001902`, 88-file source `60c2e069d6a5f54480c8ee3151e28ccc7d920e52fd5e3b978f47f41dec4013bb`, and 16-migration tree `09aab45cda17810b52a07429700a4557308405d40a3983635d6bb7848dd4c729`.
- Effective Media AI is still fail-closed. The OpenAI key, migration-16 capability, and hosted flag are present, but version 21 lacks the narrow privileged lifecycle connection.
- The current no-database-change candidate adds the Ed25519-signed Supabase Edge lifecycle bridge and matching Sites helper. It is based on `72c7fd73d3d2dff40ddd91bca2ef01d1ca8cb695`, unmerged, and unpublished.
- Release requires green Deno format/lint/typecheck, application and repository gates, four hosted workflows, zero unresolved review threads, deployed no-image auth checks, bridge-first ordering, exact Sites parity, and post-deploy logs.
- Provider canary and real edit remain pending; current Momo rights are expired; incurred spend is USD $0. USD $20 remains the per-job automatic authorization threshold.
- Momo remains No-Go; no automatic retry, public publishing, Google/social connection, or activation is authorized.
- Machine evidence is in `VEROXA_DEPLOYMENT_MANIFEST.json`, `RR_RELEASE_CHECKPOINT.json`, and `artifacts/veroxa-sites/app/momo-readiness-tracker.json`.

## 2026-07-30 — Media AI v2 high-quality local candidate (historical pre-v21 checkpoint)

- At that historical checkpoint, PR #152 / Sites version 20 / 15 applied migrations was the verified production baseline. Candidate base was canonical `main` commit `979ced364e9b94f42a5e9aece7e1aa9cfc8fa1c6`; the candidate was unmerged, unpublished, and unapplied.
- Migration 16 adds the private Media AI candidate ledger, budget wallet, idempotent lifecycle RPCs, tenant/role/RLS boundaries, conservative accounting, and explicit inspection-before-Ready. It is source-only until the exact reviewed PR passes all four workflows and zero unresolved review threads.
- The server-side OpenAI credential is provisioned, the live flag is false, provider and real-edit proof are pending, and actual spend is USD $0. USD $20 is the per-job automatic authorization threshold—not a lifetime budget—and an individual job expected above it requires fresh Faraz authorization before provider use.
- High-fidelity standing Image Enhancement automation is the only model-backed candidate scope. The current Momo upload rights are expired, so first real use requires current rights and approved Team review. No automatic retry, Google/social connection, external write, automatic publish, or Momo activation is authorized.
- Machine evidence is in `VEROXA_DEPLOYMENT_MANIFEST.json`, `RR_RELEASE_CHECKPOINT.json`, and `artifacts/veroxa-sites/app/momo-readiness-tracker.json`.

## 2026-07-14 — verified PR #149 cleanup and Sites v15 checkpoint

- PR #149 reviewed head `0d2c6e47fbfe1c44a2f0ff19fbb158001ed9365a` passed all four required workflows with zero unresolved review threads and merged at `9749b68ce2cfc383deeae6aa63c413019ef61385`.
- Sites version 15 succeeded from checkout `e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0`. Its verified 55-file source tree SHA-256 is `ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f`; public access and both custom domains were verified.
- Supabase remains at 13 applied migrations with exact filename/content parity. PR #149 applied no database change.
- Both live save/rerun RPC definitions and the validated `audit_runs` constraint accept `restaurant-audit-v3`; no synthetic production record was created, so an authenticated end-to-end V3 save transaction remains unverified.
- Machine state is `verified_reconciliation_cleanup_deployed`, and release state is `post_release_cleanup_deployed`. The evidence-only closeout PR touches no Sites source, so no Sites version 16 checkpoint is required.
- Runtime AI, credentials, Momo/client contact or provisioning, owner truth, media rights, external providers, publishing, billing, activation, and new spend remain disabled. Momo remains No-Go.
- Legacy Vite source remains recoverable historical evidence, not an active product or rollback surface. Branch deletion remains unavailable. Preserve the Vercel shutdown sentinel because external Git disconnection is not independently verified.

## 2026-07-14 — production-reconciliation checkpoint candidate (historical pre-PR #148 checkpoint)

- Canonical GitHub `main` is `674e1a7c0d140c9b281029277baeb2e68962dac2`; live Sites version 13 is checkout `dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805`; production Supabase has 11 applied migrations. Production is ahead of canonical source.
- Migration 11 is `20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql`, SHA-256 `304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2`.
- The reconciliation candidate is unmerged and undeployed. `VEROXA_DEPLOYMENT_MANIFEST.json` snapshots its reviewed source/migration trees without predicting a merge SHA or Sites version; CI emits the exact-`GITHUB_SHA` attestation.
- Release gate: all four required workflows green, zero unresolved GitHub review threads, deterministic tree parity, exact migration ledger parity, and post-merge republish/verification from the exact merged source.
- Freeze: no other product deployment; no AI/provider activation, credential, Momo/client contact, provisioning, publication, billing, external write, or new spend.
- Momo review scope is visual/manual only and must remain No-Go without real same-owner identity, truth, media-rights, workflow, report, recovery, and QA evidence.
- Cleanup is deferred: preserve the Vercel shutdown sentinel, and do not prune branches or remove legacy Vite until parity, rollback evidence, ownership review, and explicit approval exist.
- The 2026-07-13 checkpoint below is historical lineage, not the current production baseline.

## 2026-07-13 — PR #145, Supabase 10, and Sites v11 verified production state (historical)

- Verified source: PR #145 passed review at exact head b007de99eb6c927f6d7ede56d7d4fffe8cbc0f0d and is merged to GitHub main at 9aa74631e393bc0303c820cc7671f818d617778c.
- Verified data: Supabase has all 10 production migrations applied and verified. Restaurant Audit V2 is remote migration version 20260713212046 with SQL SHA-256 f4bfff7ac94ade68a2c4f761c5627dbcfe82d5800a0a8a46ce42b13e5b930693.
- Verified hosting: Sites version 11 succeeded in production from checkout source 4bef697e230791403211cb9c60f769ebcb4f39c7. Both custom domains are active with healthy SSL.
- Live product state: Restaurant Audit Center V2 and the simplified Momo Team information architecture are live. Audit V2 provides the deterministic score out of 100, room-for-improvement findings, 30/60/90-day plan, and save-or-discard preview flow. Team remains organized under the Momo's House San Antonio folder with a Momo-only Work Board and focused content/approval views.
- Conversion boundary: a reviewed audit may create only a pending, non-operational restaurant profile after exact explicit consent. It never auto-creates a client identity, membership, active workspace, onboarding activation, publishing authority, paid service, or charge.
- Operating boundary: Momo's House San Antonio remains the only operational restaurant and remains blocked until its owner-confirmed truth, permissioned media, provider authority, and remaining readiness evidence are complete. No runtime or paid AI, Meta/Google connection, external SEO/social execution, publishing, outbound contact, owner/client contact, or activation was authorized by this release.
- Supersession: older current-looking PR #143, PR #144-pending, Sites version 9/10, nine-migration, unshipped-candidate, or Audit V1 wording below is historical and superseded by this verified section.

Status: verified reusable operational baseline through PR #143, reviewed at `009276dbbf2639dc1eb5296bf62906f9f8ac45f1` and merged at `49a5250d6ce7bd8d78f19e415641563e2260ace8`, with nine production migrations applied and verified. Sites version 9 deployed successfully from checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c`; both custom domains are active with healthy SSL. Password sign-in is user-confirmed; hosted reauthentication and old-session revocation remain unverified. Overall Momo readiness remains separately blocked.

PR #144 is the behavior-neutral repository-and-Sites-evidence continuity release for this baseline. Its database-source delta is limited to reconciling the ninth migration filename/ledger to remote version `20260713191147_momo_zero_cost_operating_rehearsal_v1.sql`; SQL, schema, content, and migration count remain unchanged at SHA-256 `07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a`. It changes no operational behavior, connection, or activation authority. Because the readiness evidence is Sites-bundled, verified Sites version 10 is required after PR #144 merges and is not already deployed. Never embed or predict PR #144's merge SHA; external GitHub PR metadata and Sites checkpoint metadata are the future authorities for the exact merged and deployed identities.

Read `RR_RELEASE_CHECKPOINT.json` and run `pnpm --filter @workspace/scripts run check-rr-release-checkpoint` before starting another broad RR. The checkpoint exists to reuse evidence, not to weaken review.

## Reuse rule

- If a protected boundary fingerprint is unchanged, reuse that group’s recorded review and test evidence. Do not repeat its full review.
- If only `presentation_surfaces` changed and the exact diff does not touch auth, intake, database, scope, deployment, integrations, public claims, AI, or publishing, perform a focused delta review and affected tests only.
- If `momo_readiness_tracking` changed, validate the evidence, blockers, next actions, Momo-only scope, and overall readiness rule without reopening unchanged release boundaries.
- If a `full-on-change` group changed, review that group and its direct consumers. Do not reopen unrelated unchanged groups.
- After a successful build, update the checkpoint’s source/deployment state and fingerprints together with `CURRENT_BUILD_STATUS.md` and `VEROXA_CURRENT_MILESTONE.md`.

## Full-review triggers

A full boundary review is required for changes to auth/session/allowlist/roles, RLS/schema/migrations/storage/secrets, signed public intake, non-Momo operations or audit conversion, hosting/domains/runtime, external integrations, live AI/publishing/payments, or material pricing/public promises.

## Current baseline truth

- PR #143 reviewed head `009276dbbf2639dc1eb5296bf62906f9f8ac45f1` is merged at operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8`; Sites version 9 is deployed from verified checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c`, all nine migrations are applied and verified, and both custom live domains are active with healthy SSL.
- PR #144 requires a separate post-merge Sites version 10 continuity checkpoint. Its merge and deployment identities remain external metadata rather than self-referential fields in the committed release record.
- `momo-readiness-tracker.json` is the repository release baseline/checkpoint. The scoped Supabase readiness rows and summary RPC are authoritative for live Team operational readiness. A verified release boundary does not imply overall Momo readiness.
- Momo’s House San Antonio is the only operational restaurant.
- Other restaurants may use only the separate Audit Center and never auto-convert.
- Deployed Sites sign-in supports approved-user passwords and secure-email-link recovery for approved active identities. Faraz confirmed password sign-in; public account creation remains disabled. Hosted reauthentication and old-session revocation are not yet verified.
- Sites is the sole deployment surface; Vercel is retired and must not be restored as a release or rollback gate.
- Client routes remain safe-empty until verified Momo records exist.
- Runtime AI, Meta/Google connections, SEO/social execution, publishing, outbound contact, and owner walkthrough remain inactive.

## Current verified delta

- PR #138 exact head `068f2c7e6bb094bb16329106ca54fed06fe66aca` passed all four workflows, clean reset, pgTAP, and lint before its SHA-locked merge and Sites deployment.
- PR #143 exact reviewed head `009276dbbf2639dc1eb5296bf62906f9f8ac45f1`, merged operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8`, ninth migration verification, and Sites version 9 checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c` are the current reusable operational evidence.
- PR #137's `momo_readiness_tracking` lane is retained and updated as a focused evidence delta; its static tracker is durable RR evidence while the production Team readiness view reads the scoped Supabase operating model.
- Review scope: the new operating-system migration and pgTAP coverage, canonical Sites operating/evidence gates plus Supabase contracts, Sites Team/client data surfaces, seven-system truth guard, and controlled Auth Admin tooling. The retired Vite-domain contract duplicate was permanently removed on 2026-08-05.
- Client operational reads must use the explicit-auth, role-sanitized Momo snapshot RPC; internal base tables remain Team-only and raw sensitive client reads must stay denied/empty.
- Faraz's approved Gmail Team identity is confirmed, has signed in, has an active Team profile plus active Momo membership, and opened the protected Team/Momo route in Safari. The mistaken secondary identity has disabled portal access. No privileged key was exposed.
- The login runtime-config/callback repair and password extension remain deployed in the PR #143 operational release at Sites version 9. The release preserves `shouldCreateUser: false`, approved-user-only password sign-in, protected password replacement, and secure-email-link recovery. Hosted reauthentication and old-session revocation must not be described as verified until a controlled smoke proves them.
- No Momo owner truth or media rights are invented. Runtime AI, Meta, Google, publishing, and visibility monitoring are **inactive pending authorized access**.
- The nine-migration no-new-spend foundation and approved Team access delta are verified and reusable. Momo Client identity, owner truth, permissioned media, provider access, hosted reauthentication, old-session revocation, operational-history evidence, and final readiness remain separate unverified gates and must not be inferred from the green release.

The machine check verifies migration inventory, immutable applied migration checksums, scope/auth markers, and the protected file-group fingerprints. A failed fingerprint is a review-routing signal: inspect the exact diff, run only the required delta or boundary checks, then deliberately refresh the checkpoint.
