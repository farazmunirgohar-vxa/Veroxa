# Veroxa Current Milestone

Status: highest-priority governing build direction as of 2026-08-02.

Read this file first before planning, building, reviewing, merging, deploying, or recommending Momo outreach. If an older roadmap or status note conflicts with this file, follow this file and Faraz's newest explicit instruction.

Also read:

- `MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md`
- `MOMO_100_READINESS_SEVEN_SYSTEM_CONTRACT.md` (full-automation gate; not the narrower onboarding authority)
- `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md`
- `ACTIVE_DOCS_INDEX.md`
- `VEROXA_LOCKED_OPERATING_MEMORY.md`
- `CURRENT_BUILD_STATUS.md`
- `MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json`
- `MOMO_MEDIA_V22_LIVE_CLOSEOUT.json`
- `VEROXA_DEPLOYMENT_MANIFEST.json`
- `../veroxa-sites/app/momo-readiness-tracker.json` (immutable v22 pre-deploy No-Go/rights/spend snapshot; not current bridge-deployment authority)

## 2026-08-02 — Momo upload-to-Veroxa-Ready v36 live; GitHub parity verified

- **Live runtime:** Sites v36 is live from `b8122642b72e5d4e6e74c379469f2a157781ab3d`; its canonical 185-file source tree is `caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7`. Supabase has 37 migrations through `20260802020000_momo_pipeline_query_indexes_v2.sql` with tree hash `9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90`.
- **GitHub parity:** PR #157 passed all four workflows at reviewed head `d3a63d25644fc699d1f521f8f803e5bd95daae49`, had zero unresolved review threads, merged at `aafebf93a6bc40f9578c29f4a25371f8203d0387`, and passed all four push workflows. GitHub main now matches the already-live v36 source and 37-migration ledger.
- **Reconciliation boundary:** PR #157 required and performed no Sites publish and no database apply. PR #155 / Sites v22 remains historical parity evidence.
- **Internal behavior:** a valid Momo JPG is finalized immediately; exact-byte duplicates reuse one canonical processing identity without combining permissions; each upload, rights record, transition, exception, and Ready event remains attributable and append-only. Ready is internal and unscheduled. Team Faraz handles consolidated exceptions rather than routine scheduling or approval work.
- **Media boundary:** near-duplicate merging remains advisory. A bad image is preserved and becomes one evidenced exception; v36 does not automatically resize or edit it. The separate legacy Team rendition flow is not part of the automatic v2 chain.
- **Proof boundary:** the pre-release gates passed 371/371 tests plus build, lint, typecheck, and rollback compilation, but no real v36 upload, provider call, or Ready package exists. Momo therefore remains No-Go for activation or external action.
- **Freeze:** no posting, scheduling, publishing, provider connection, review reply, website write, test upload, provider canary, Sites deployment, database apply, or Momo activation is authorized by verified GitHub parity.

## 2026-07-30 — verified v22 signed Media AI bridge release

- **Verified release:** PR #155 reviewed head `96a6c00857b438b37c2e8d99329c0f556de850a2` passed all four workflows with zero review threads and merged at `d1f6a9a78ac54cd5447689d5f8b3d42466daf479`.
- **Sites and database:** Sites v22 is live from checkout `83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e`; its 93-file source hash is `8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490`. Production remains at the same 16 migrations and migration tree `09aab45cda17810b52a07429700a4557308405d40a3983635d6bb7848dd4c729`.
- **Bridge truth:** the JWT-protected Edge function, matching Ed25519 Sites secret, OpenAI secret, and runtime flag are deployed. Missing-JWT and unauthenticated Team-route probes fail closed; both custom domains and SSL are active; no Worker exception or Edge 5xx was observed.
- **Proof still required:** effective authenticated Media AI remains unproven until a real Team preflight succeeds and the Team/Client rehearsal passes. The bundled readiness tracker therefore remains fail-closed rather than manufacturing an activation result.
- **First-use blocker and cost:** the current Momo upload rights are expired. No real image or billable provider canary is allowed. Candidates, provider calls, and incurred spend remain zero; USD $20 is the per-job automatic threshold, and a larger job requires fresh authorization.
- **Boundaries:** every AI result stays private until exact Team inspection and approval. Google/social, owner-controlled providers, public publishing, and Momo activation remain locked. Momo remains No-Go.

## 2026-07-30 — verified v21 foundation and lifecycle-bridge candidate (historical pre-v22 checkpoint)

- **Live baseline:** PR #154 reviewed head `4a7a2122bb71defc0f1db0c795b4c4c8fdb930a5` merged at `72c7fd73d3d2dff40ddd91bca2ef01d1ca8cb695`; Sites v21 is live from checkout `8c50dd6726629e77d22f07eb6aac9f6982001902`; production Supabase has 16 applied migrations through `20260728044916_momo_media_ai_pilot_v1.sql`.
- **Effective runtime truth:** the OpenAI key, migration-16 capability, and hosted Media AI flag are present, but version 21 remains safely fail-closed because its Sites worker has no broad Supabase service credential and the narrow signed lifecycle bridge is not yet deployed. Configuration is not end-to-end proof.
- **Current candidate:** a no-database-change release adds a signed Supabase Edge bridge limited to Media AI preflight/start/complete/fail, with Team JWT revalidation, strict payloads, exact terminal reconciliation, and no OpenAI retry. It is based on canonical `main` `72c7fd73d3d2dff40ddd91bca2ef01d1ca8cb695` and remains unmerged and unpublished.
- **Release rule:** require Deno format/lint/typecheck, the full application and repository gates, all four green hosted workflows, zero unresolved review threads, and a deployed no-image auth matrix before enabling the Team control. The bridge deploys before the matching Sites release.
- **First-use blocker and cost:** the current Momo upload rights are expired, so no real image or billable canary is allowed. Spend remains USD $0; USD $20 is the per-job automatic authorization threshold, not a lifetime cap, and a larger job requires fresh authorization.
- **Boundaries:** AI output stays private until exact Team inspection and approval. Google/social, owner-controlled providers, public publishing, and Momo activation remain locked. Momo remains No-Go.
- `artifacts/veroxa-sites/app/momo-readiness-tracker.json` preserves the fail-closed runtime, expired-rights, and No-Go evidence.

## 2026-07-30 — high-quality Momo Media AI release candidate (historical pre-v21 checkpoint)

- **Historical live baseline:** at that checkpoint, PR #152, Sites version 20, and 15 applied Supabase migrations were current. The Media AI candidate was based on canonical `main` commit `979ced364e9b94f42a5e9aece7e1aa9cfc8fa1c6` and remained unmerged, unpublished, and unapplied.
- **Authorized scope:** Image Enhancement AI is the only authorized model-backed candidate activation. When the Team workspace observes a rights-current, approved Momo image, standing automation may create one high-fidelity private `gpt-image-2` candidate at the selected destination’s high-resolution preset. Media Review and Compliance remain deterministic human-controlled contracts; Caption generation, AI web research, Meta, Google, publishing, and other model-backed roles remain inactive.
- **Cost truth:** the OpenAI key is server-only, the live flag remains off, provider/real-edit proof remains pending, and actual spend is USD $0. The database treats USD $20 as the per-job automatic authorization threshold, not a lifetime budget. Any individual job expected above that amount must obtain fresh Faraz authorization before it reaches OpenAI.
- **First-use blocker:** the current Momo upload rights are expired. A real Image Enhancement attempt requires current rights, an approved Team review, the standing-automation authorization, and later inspection of the exact private candidate before approval.
- **Release rule:** merge only the exact reviewed tree after all four GitHub workflows pass with zero unresolved review threads; only then apply migration 16 and publish the matching Sites source. Momo remains No-Go and no external publishing is authorized.
- `artifacts/veroxa-sites/app/momo-readiness-tracker.json` is the bundled fail-closed readiness record for this candidate.

## 2026-07-22 — PR #152 / Sites v20 live truth (historical)

- PR #152 reviewed head `b170c4339ae43755f17a19d74107cb75c6b198d3` passed all four workflows with zero unresolved review threads and merged at `29e90d40fa05d67d2a6246f9a0ba64fe1b9099b7`.
- Sites version 20 is live from checkout `aceb17bb446854d48a71e54ba814591cf2c19d33`; both Veroxa custom domains, SSL, and provider status are active, and the first 15-minute Worker error check was empty. This Sites-only follow-up required no database change.
- Supabase now has 15 applied migrations. Migration 15 is live and verified for forced RLS, narrow table grants, revoked legacy privileged readiness execution, restaurant-scoped Client rendition readback, and the current storage policy.
- At that checkpoint, the iCloud Client and Gmail Team identities were active. Momo had one real upload and one then-current confirmed rights record, but zero approved Team reviews and zero Ready private owner renditions.
- External providers, AI live calls, Google/social connections, scheduling, and publishing remain locked. Spend is USD $0 of the authorized one-time USD $20 ceiling.
- Momo remains evidence-based **No-Go** after the technical release. Deployment proves the foundation, not real-owner approval, browser usability, recovery, reporting, or complete operating readiness.
- Read `MOMO_MEDIA_V20_LIVE_CLOSEOUT.json` for exact historical v20 release evidence. Version 19 remains preserved as earlier historical live evidence; neither release established Momo operational readiness.

## 2026-07-22 — reviewed local candidate (historical pre-release checkpoint)

- The latest observed production application is ChatGPT Sites version 18. Production Supabase has 14 applied migrations. This is live observation, not a claim that GitHub, Sites, and Supabase are currently reconciled.
- `faraz.munir.gohar@icloud.com` is provisioned as the active Momo Client identity, and Faraz's approved Gmail identity remains the separate active Team identity. Password login works for both roles.
- One real Momo media upload exists in private storage with its rights record. That upload is evidence of intake only; it is not evidence that image preparation, rendered Client readback, Ready status, publishing, or the complete operating loop has passed.
- The current local candidate repairs the shared post-login session race, replaces the presentation-first Momo media surfaces with a task-first `Upload -> Review -> Improve -> Ready` workflow, makes the newest real upload the default working object, and adds forward migration 15 for fail-closed Client rendition readback and database hardening.
- Migration 15 is the forward-only repair for verified live-v14 catalog findings: broad default table privileges, affected tables without forced RLS, and direct `service_role` execution of legacy readiness functions, including `veroxa_record_momo_no_go_v1`, while preserving authenticated Team access. The repair is source-only.
- The candidate is unmerged, unpublished, and unapplied. Production remains Sites version 18 with 14 migrations and retains those observed catalog findings; no candidate behavior or migration 15 may be described as live.
- Candidate verification passed Sites lint, TypeScript, a production build, and all 114 Sites tests. The Supabase workflow now includes an executable migration-15 pgTAP regression for catalog privileges, forced RLS, tenant-scoped Client readback, storage policy, and current-rights revocation. Independent code, database, and UX reviews found no remaining local code blocker; the exact-head GitHub clean reset remains required before merge.
- Google and social accounts remain disconnected, publishing remains off, and no external post or provider action occurred. Faraz authorized a scoped ceiling of USD $20 for this Momo setup and media rehearsal; actual spend remains USD $0.
- Momo remains evidence-based **No-Go**. Working identities, successful login, one upload, and a green local candidate do not satisfy the complete readiness gate.
- The verified PR #149 / Sites v15 release remains historical lineage. It is not the current live-version statement and must not overwrite the July 22 observation.

## 2026-07-14 verified delivery state (historical PR #149 / Sites v15 checkpoint)

PR #149 passed all four required workflows with zero unresolved review threads at reviewed head `0d2c6e47fbfe1c44a2f0ff19fbb158001ed9365a` and merged at `9749b68ce2cfc383deeae6aa63c413019ef61385`. Sites version 15 succeeded from checkout `e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0` with a verified 55-file source tree SHA-256 of `ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f`; public access and both custom domains were verified.

- Production Supabase remains at 13 applied migrations, with exact canonical filename and SQL-content parity. PR #149 required no database apply.
- Machine state is `verified_reconciliation_cleanup_deployed`; release state is `post_release_cleanup_deployed`. The evidence-only closeout PR changes no Sites source and therefore requires no Sites version 16.
- The legacy Vite application is archived from active workspace, build, and CI paths; its source remains recoverable history and is not a deployment or rollback path.
- Runtime AI, credentials, Momo/client contact, Client provisioning, owner confirmation, media rights, Meta/Google or other providers, publishing, billing, activation, and new spend remain disabled. Momo remains an evidence-based No-Go.
- Branch deletion remains unavailable through the connected GitHub surface. Keep the Vercel shutdown sentinel unchanged because the external Git integration is not independently verified disconnected.

## Pre-PR #148 reconciliation state (historical)

- GitHub `main` is canonical at `674e1a7c0d140c9b281029277baeb2e68962dac2`, but it does not currently contain the exact live product and database source.
- Live ChatGPT Sites version 13 is checkout `dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805`; `veroxasystems.com` and `www.veroxasystems.com` remain active with healthy SSL.
- Supabase has 11 applied production migrations. The latest is `20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql`, SHA-256 `304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2`.
- Live Sites Audit V3 and migration 11 are ahead of canonical GitHub. This is a production/source drift condition, not verified parity.
- The production-reconciliation worktree imports that observed source and adds controls. The reconciliation candidate is unmerged and undeployed. No merge commit or future Sites version is predicted.
- `VEROXA_DEPLOYMENT_MANIFEST.json` is the machine-readable release record. CI must verify its deterministic source and migration trees and generate an attestation from the exact `GITHUB_SHA` before merge can be considered.
- Product deployments are frozen except for the exact reviewed reconciliation release after all four required workflows are green and GitHub reports zero unresolved review threads. AI, credentials, Momo/client contact, activation, providers, publishing, billing, and new spend remain disabled.
- Vercel is retired and must not be restored.
- Supabase is the sole Auth, Postgres, and private-storage backend.
- Faraz's approved Team identity and protected Team/Momo access are operational.
- Restaurant Audit Center V3 is live for non-client restaurants.
- Momo's House San Antonio is the only operational restaurant scope.
- The Momo seven-system production foundation, manual operating rehearsal, Team work structure, approval controls, readiness evidence, monitoring, and fail-closed provider preflight exist.
- Momo remains blocked from active onboarding until the evidence-based onboarding gate passes and Faraz explicitly approves contact.

Older PR #145, Supabase-10, Sites-v11, and Audit-V2 statements in lower history describe prior checkpoints and do not override this observed production state.

## Relationship and commercial direction

Momo's House has already agreed to onboard as Veroxa's founding pilot restaurant. Momo understands that Veroxa is still being built as a product and platform, and Faraz has told them he will contact them when it is ready.

Do not treat Momo as an uncommitted prospect and do not design another sales-conversion flow for them.

Momo is free during the remaining build and founding-pilot operating period. Do not create a subscription, invoice, checkout, trial expiration, payment method, retroactive balance, or charge for Momo.

Charging Momo may begin only when:

- Veroxa has operated Momo dependably through multiple real cycles;
- the service can be repeated for additional restaurants without rebuilding the platform;
- security, support, reporting, monitoring, and recovery are dependable;
- Faraz is ready to expand and market Veroxa to additional restaurants; and
- Faraz separately approves and communicates the commercial transition.

This founding-pilot arrangement overrides generic public pricing for Momo until Faraz explicitly changes it.

## Current milestone

The active milestone is:

**Complete and prove the secure, persistent, human-controlled Momo operating loop, then begin the already-agreed onboarding.**

Stop adding disconnected planning, checklist, or dashboard pages unless they directly enable, operate, verify, or clarify a real workflow.

The immediate build priority is not another conceptual surface. It is to close the remaining operational evidence gaps across:

1. Momo Client identity provisioning and separate Team/Client account verification.
2. Restaurant membership and RLS isolation.
3. Persistent, resumable Momo onboarding.
4. Owner-confirmed restaurant truth and sensitive-claim controls.
5. Private media upload, rights, consent, Team review, and safe reuse.
6. Persistent messages, structured requests, corrections, and Team work items.
7. Truthful content drafting, approval, scheduling, and manual publication records.
8. Activity evidence, weekly updates, monthly reports, and honest attribution language.
9. Monitoring, retries, recovery, backups, and rollback.
10. Mobile and browser end-to-end QA using distinct Team and Client sessions.

## Required first-pilot operating loop

Prove this complete loop before Momo onboarding is declared ready:

`onboarding -> owner-confirmed truth -> permissioned media -> truthful draft -> Team/Faraz review -> schedule -> manual publication record -> client status -> activity evidence -> weekly/monthly report`

The first pilot should use reviewed manual execution where external connectors are unavailable.

Runtime AI, Meta, Google, and automated publishing are modular later activations. They do not all need to be live before Momo onboarding when the secure persistent manual loop works end to end and unavailable capabilities are represented honestly.

## AI, integrations, and cost direction

- Continue the free-first rule.
- Build production-quality components with existing resources.
- Do not add a paid service, usage commitment, or subscription without Faraz's explicit approval.
- Deterministic/manual content operation comes before runtime AI.
- Runtime AI requires a proven manual loop, server-side secrets, cost approval, structured outputs, safety checks, and Team/Faraz review before customer-visible use.
- Meta, Google, delivery, website, and publishing connections require Momo owner authority, supported platform capability, secure credential handling, and separate Faraz approval.
- No external action may bypass the approval and evidence system.
- Never invent restaurant facts, media rights, provider access, activity, metrics, readiness, results, reviews, ranking, revenue, ROI, customers, orders, reach, or growth.

## Exact Momo onboarding gate

Do not decide readiness from a date estimate or from a green PR alone. Tell Momo that Veroxa is ready to begin onboarding only when all conditions below pass:

- A separate approved Momo Client identity can be provisioned securely without public signup.
- Team and Client accounts are distinct and tested.
- RLS and restaurant membership isolation are proven, including negative cross-tenant tests.
- The deployed Sites source exactly matches reviewed and merged GitHub source.
- Client routes contain no unsupported completed, reviewed, sent, published, or performance claims.
- The complete onboarding flow persists to Supabase and resumes without data loss.
- Business-truth fields distinguish confirmed, pending confirmation, optional, and internal-review states.
- Private media upload, rights attestation, consent, review, and retrieval work on supported mobile and desktop browsers.
- Messages and structured requests work across separate devices.
- Team work, approvals, blockers, and activity evidence persist correctly.
- One complete internal rehearsal succeeds through onboarding, media, draft, approval, manual publication record, activity evidence, and weekly report.
- Reports are based only on real recorded activity.
- Monitoring, retry, recovery, backup, and rollback are tested for the pilot-critical path.
- Mobile/browser QA passes for the exact Momo Team and Client journeys.
- No open critical or high-severity security or data-integrity defect remains.
- The readiness system records an evidence-backed Go for onboarding; no synthetic percentage substitutes for the gate.
- Faraz explicitly approves contacting Momo and scheduling the onboarding.

## Scope boundaries

### Momo's House San Antonio

Momo remains the only operational restaurant until the founding pilot succeeds. Build and verify Momo-specific identity, truth, onboarding, media, content, approvals, work, reporting, monitoring, and recovery.

### Other restaurants

Other restaurants remain Restaurant Audit Center records or explicitly consented pending, non-operational profiles. An audit or pending profile must not automatically create a Client identity, membership, operational workspace, onboarding, publishing authority, paid service, or charge.

An audited restaurant does not become an operational client unless Faraz separately and explicitly approves conversion.

Any future conversion to an operational client requires Faraz's separate explicit approval.

## ChatGPT, Codex, GitHub, Supabase, and Sites alignment

- ChatGPT is Faraz's primary Veroxa command center.
- ChatGPT and Faraz determine the next outcome together.
- Codex is the engineering implementation workflow invoked through ChatGPT.
- GitHub `main` is canonical.
- Supabase is the sole production data/auth/storage backend.
- ChatGPT Sites is the sole deployment surface.
- Every Sites deployment must use the exact reviewed and merged GitHub source.
- A GitHub merge and Sites deployment are separate actions unless Faraz authorizes both.
- Every build must update the durable direction, current status, affected readiness evidence, and Faraz's plain-language handoff.

## Mandatory post-build continuity update

After every build, record the actual GitHub, workflow, Supabase, Sites, domain, parity, freeze, activation, and readiness state. Candidate work must remain labeled unmerged and undeployed, and the handoff must say what remains inactive.

## Mandatory two-lane reporting

Every build and review must report two separate states:

- **Veroxa delivery state:** source, PR, checks, migrations, security, deployment, domain, parity, and rollback.
- **Momo onboarding readiness:** Client identity, data isolation, truth, onboarding, media, workflow, rehearsal, QA, recovery, and Faraz approval.

A successful build or deployment does not itself authorize contacting Momo. Momo onboarding also does not require every future paid integration to be active when the secure manual operating loop is complete and truthful.

## Exact next build category

Finish the ordered reconciliation release before broader product work:

1. Keep the deployment and activation freeze in force.
2. Complete the single reconciliation candidate and exact production-source inventory.
3. Pass deterministic source/migration parity checks, AI and database contract tests, and all four required GitHub workflows; resolve every review thread.
4. Merge only the exact reviewed head, then republish and verify Sites from that exact merge without predicting its commit or Sites version beforehand.
5. Run the Momo visual/manual gate honestly without contacting Momo or manufacturing evidence; keep the decision No-Go while real evidence is absent.
6. Keep AI/provider activation deferred until the manual loop, cost controls, explicit budget approval, and separate runtime authorization exist.
7. Perform cleanup only after the reconciliation release is verified.

Post-release cleanup is a separate controlled change. Before it begins:

- record exact GitHub/Sites/database parity and a tested rollback checkpoint;
- classify each old branch through PR history and ownership rather than relying only on Git ancestry;
- preserve any unique work and obtain explicit approval before deleting branches;
- remove legacy Vite from active workspace/build/verification paths before archiving or deleting its source, with a recoverable tag or commit;
- independently verify the external Vercel Git integration is disconnected; and
- remove the inert Vercel shutdown sentinel only after that disconnection and the cleanup change are reviewed.
