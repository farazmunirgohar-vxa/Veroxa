# Veroxa Current Milestone

Status: highest-priority governing build direction as of 2026-08-08.

Read this file first before planning, building, reviewing, merging, deploying, or recommending Momo outreach. If an older roadmap or status note conflicts with this file, follow this file and Faraz's newest explicit instruction.

<!-- LIVE46_HELD_REPAIR_AUTHORITY -->

## 2026-08-08 — live46 registered mutable-RPC hold active; draft PR #165 open (current authority)

- **Canonical repository and production:** GitHub `main` is `f57a6f5a04d482353f32ccebb43ff5f225e3b8a9` from merged PR #164. Production Supabase is the exact immutable 46-row ledger through `20260808070840_momo_ready_team_decisions_and_food_tags_v2.sql` (160,956 bytes, SHA-256 `9cf6f0080d38d58d3c1939d928444701b1954bf5cfe96bf7f3e80077bad45cc0`) at tree `a575a605c65252386d5d55c26b1a9cf4c88c85e854c74ca0486ecd1ec1f6d3d0`. Never edit applied `064300`, `064335`, or `070840` bytes.
- **Live Sites and Edge are separate observations:** Sites v39 remains independently observed at version ID `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8`, checkout `8749a7d442d3bb068ce626a9d297b8b227493446`, and 54-file archive SHA-256 `c5c471639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5`; no GitHub association is inferred. The current Sites runtime environment is revision 11 with `VEROXA_MEDIA_AI_ENABLED=false` and `VEROXA_MOMO_CONTENT_AI_ENABLED=false`; connector-redacted secret values do not establish provisioning. `momo-content-ai-lifecycle` Edge v6 is ACTIVE/`verify_jwt=true` with the older private-assessment prompt v1 and an unauthenticated 401 smoke. It is not the candidate prompt-v2 deployment.
- **Production hold:** a fresh catalog read exposed that the earlier ACL-hold claim was wrong. One guarded operational transaction then asserted the exact Momo tenant/runtime and zero work, reasserted all flags false at `2026-08-08T08:41:41.741433Z`, and revoked the exhaustive registered mutable public RPC set. Post-observation at `2026-08-08T08:42:25.760455Z` confirms 50 held functions, zero leaked effective mutation grants, one all-false runtime row, zero relevant work, and three bounded authenticated read-only RPCs: Ready-v2 review status, Client-v4 upload status, and the media-AI operational window. Effective ACL fingerprint is `6048c92d2fc60b3d408ea7f893673275a62dc2d39e395b1ffaa9bd16387eb0f9`. The pre-existing authenticated tenant-scoped Client `/uploads` INSERT/orphan-delete policy remains and may create an unregistered orphan object, but held RPCs prevent registration or provider/content/decision work. Team storage policy widening is not live.
- **Draft PR checkpoint:** PR #165 is open as a draft from branch `agent/momo-private-assessment-ready-unified` on base main `f57a6f5a04d482353f32ccebb43ff5f225e3b8a9`. Its observed non-final opening head is `9176e50436db7328401a91d64b536948ed4ef915` with tree `01a79b952c6356b2cb1c54dc262541f1ad4fd198`. This checkpoint proves only draft PR existence and opening identity; exact-final-head workflows, review-thread closure, review approval, and merge evidence remain null. The reviewed pre-apply candidate remains 213 Sites files at `b7a0881ef6be8fe5d739fff45acadd57db093abc87d41e7c1534d4692ecf5eb9` and 47 mirrored migrations at `895ddcfc268b9033f62aa3be40088f196a7bed2ed23ed1c5052938dc5509214b`.
- **Forward repair:** provisional `20260808072630_momo_ready_private_media_reconciliation_v1.sql` is root/Sites byte-identical, 180,162 bytes at SHA-256 `e1e6e0610c815e449b7ea7c169c258e03bfefc5451e4d04ada2b35d687656606`. It preserves the registered mutable-RPC hold; makes Ready v2 the sole decision authority; makes discard source-global and evidence-preserving; permanently marks Team-origin media as internal development-proxy assessment-only; enforces strict metadata, Team/client and cross-tenant boundaries; and never deletes source media or evidence.
- **Local quality evidence:** clean install, TypeScript, lint, verified build, diff-check, and 431/431 application tests are green. Frozen SQL fixtures are preconnection `1e08caa59c9782184eb7271ed91dd9f791f62fd7fcaf6b4bb50fa7e7cceaf6ed`, owner controls `1e16e1e4d03a1ff35fe25cda626c25f176f1b05b711fd3e7a26f581550484a24`, full OS `f20ac4e5927543277e520fbfd7104ded39fd11fa14995bf227fb64384dba5480`, and zero-cost `13e246455692d5005d688fcc68aea4805a7d64bc87c2604edf8db26599b06cbe`. The hosted Supabase workflow passed the exact clean-chain migration apply for the current repair bytes; the full hosted pgTAP suite still awaits a rerun after fixture fixes, so hosted database execution and all final PR/deployment gates remain unpassed.
- **Generated-version rule:** Supabase MCP assigns the applied ledger version. After each exact-byte database apply, capture the generated version and merge a reviewed closeout PR that renames both mirrors without changing bytes. The current `072630` filename and `b7a088…` Sites hash are pre-apply identities, not final production-parity claims.
- **Mandatory rollout:** finalize draft PR #165 and require exact-final-head review/merge evidence → exact repair apply and hosted verification under the registered mutable-RPC hold → generated-version repair closeout → first exact Sites publish and prompt-v2 Edge deploy/verify under that hold → separately author/review/apply a dormant identity-bound activation migration that grants execution to nobody → activation generated-version closeout → second exact Sites and Edge parity publish/verify under that hold → one audited postgres-only invocation. That invocation alone may restore exact source-defined grants and set only `ai_live_calls=true`; it must reassert every external flag false.
- **Authorization versus execution:** Faraz explicitly authorized this scoped database/Sites/Edge/internal-AI rollout and up to USD 20; automatic deployments remain disabled, every step remains manually gated, and the activation routine is not authored, installed, gate-ready, or invoked. Applied `02609` remains non-comprehensive because live `postgres` is not a `supabase_admin` member.
- **Proof boundary:** no current record proves a real upload, authenticated provider call, Ready approval or discard, owner confirmation, current-offering association, schedule, post, public write, owner contact, or activation execution. Generic food support never authorizes dish, brand, menu, restaurant, ownership, or ingredient inference from pixels.

## 2026-08-08 — superseded live46 integration baseline; forward repair was pending (historical)

- **General product boundary:** Veroxa privately assesses arbitrary Client-supplied restaurant media, including any food, drink, dining scene, non-food, or unclear image. Momo's House is the founding pilot, not the product ontology and not an inference target.
- **Production database:** production has 46 observed migrations. The unique latest row is 20260808070840_momo_ready_team_decisions_and_food_tags_v2.sql, 160,956 bytes at SHA-256 9cf6f0080d38d58d3c1939d928444701b1954bf5cfe96bf7f3e80077bad45cc0; the exact live46 tree is a575a605c65252386d5d55c26b1a9cf4c88c85e854c74ca0486ecd1ec1f6d3d0. Byte observation does not prove the semantic contract: database review is repair_in_progress, a forward repair is required, functional verification has not passed, additional database changes are required, and database apply authorization is false.
- **PR #164 history:** PR #164 final head 0c82ea1a7e8b9d1873eb79509ccbbb722fdf595d merged to GitHub main at f57a6f5a04d482353f32ccebb43ff5f225e3b8a9. Its four head workflows succeeded, but one non-outdated P2 review thread remains recorded as unresolved: PRRT_kwDOSldANc6Xc7kI on operating-center queue filtering. That historical merge does not satisfy the current integrated-candidate release gate.
- **Live Edge evidence:** momo-content-ai-lifecycle remains version 6, ACTIVE, with verify_jwt=true and provider-returned ezbr_sha256 acf46f086b3ab07c914d71b5ae79dca011abab84016d4c9c58ff1c9b30eb58ce. One unauthenticated POST returned 401 with one matching log and no 5xx or exception. No authenticated bridge, provider call, real upload, Ready event, or discard event was performed.
- **Sites boundary:** live Sites remains independently observed v39 at exact version ID appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8, internal AppGen checkout 8749a7d442d3bb068ce626a9d297b8b227493446, and 54-file archive SHA-256 c5c471639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5. This is not a GitHub commit or a claimed association with PR #164.
- **Integrated candidate:** source fingerprint review and final application-quality evidence are pending until the database repair and exact candidate closure are final. The candidate pull request, exact-head workflows, zero-thread proof, merge identity, Sites version, and Sites deployment are all null or pending. Database apply, Sites publish, and overall deployment authorization are false.
- **Ready and disposition:** Ready remains an internal, unapproved, unscheduled, unposted, unpublished evidence package. Team may approve the exact package only after it reaches Ready. Team may also terminally discard Ready media; discard remains evidence-preserving and blocks reuse of the same restaurant/source bytes. external_write_allowed=false.
- **Proof boundary:** no current record proves a real upload, authenticated provider run, owner confirmation, offering association, Ready approval or discard, schedule, post, publication, owner contact, or Momo activation.

## 2026-08-08 — phase 1 private assessment and owner-control boundary (historical, superseded by live46 integration)

- **General product boundary:** Veroxa phase 1 privately assesses arbitrary Client-supplied media across food, drink, dining-scene, non-food, and unclear content. It is a general restaurant product capability; Momo's House is the founding pilot only, not the product ontology or an inference target.
- **Assessment truth:** analysis is pixel-only and private. It produces controlled, neutral visual tags with explicit uncertainty; it must not turn pixels, filenames, tenant context, or prior Momo history into claims about an exact dish, ingredients, a menu, a business, ownership, a restaurant, or Momo.
- **Owner and Team authority:** a current real-owner Client directly confirms or corrects current truth, with immutable evidence of that exact decision. Team can see the Client-requested assessment, status, and result, but cannot manufacture owner truth or an offering association. The development proxy may assess privately, but it cannot advance content or reach Ready without current real-owner rights and an exact current-offering association for the same restaurant and source bytes.
- **Ready and disposition:** Ready remains an internal, unapproved, unscheduled, unposted, unpublished evidence package. Team approval binds only the exact output recorded for review. A terminal discard binds `(restaurant_id, source_content_sha256)` across exact-byte duplicates, is enforced before new content/Ready progress, and preserves immutable evidence rather than deleting or rewriting history. `external_write_allowed=false`; publishing and all other external writes remain false.
- **Production database:** production is live45 through `20260808064300_owner_truth_and_ready_disposition_v1.sql` (SHA-256 `bd22855b54cfc9e1aa1713c66dae1f3fc674c43e0040dd128be40e4c354896d2`) and `20260808064335_private_media_assessment_and_association_v1.sql` (SHA-256 `27ae63ccb334c7dbdf25d247c7f27ebc13ff9ea3e5391f590e93f90dcc4225c7`). These are observed applied bytes, not permission to rewrite migration history.
- **Live Edge evidence:** `momo-content-ai-lifecycle` id `859c73c3-2102-41b4-9da1-20582acb7212` is version 6, `ACTIVE`, with `verify_jwt=true`; bundle/ezbr SHA-256 is `acf46f086b3ab07c914d71b5ae79dca011abab84016d4c9c58ff1c9b30eb58ce`. Uploaded `supabase/functions/momo-content-ai-lifecycle/index.ts` is exactly `867d85fe555a5f7d9d48d62698f4b1fb95d4e0769fc299020953cf5054d8720d`, and `supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts` is exactly `c26af8d5aa76adf42de79538a72e3c1a3794a68cf6442fdfb5f0e45bad289a10`. An unauthenticated POST failed closed with HTTP 401 JSON; the matching v6 log contains one 401 and no 5xx/exception. No authenticated bridge or provider call was performed.
- **App and Sites release separation:** the candidate app gate is clean at 422/422 tests plus build, typecheck, and audit. Its GitHub pull request and new Sites version/deployment are still pending. The live website remains Sites v39 baseline `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8`, internal Sites/AppGen source commit `8749a7d442d3bb068ce626a9d297b8b227493446` (not a GitHub commit), 54-file archive SHA-256 `c5c471639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5`, environment revision 10, active domains/SSL, and zero recent errors.
- **Proof boundary:** the planned 2026-08-09 real upload has not yet been observed. Database and Edge deployment evidence plus local app gates do not prove the pending Sites candidate, an authenticated assessment/provider run, owner confirmation, association, Ready package, approval, schedule, post, publication, or any external write.

## 2026-08-08 — database repair verified; corrected Sites v38 pending (historical, superseded by phase 1)

_Historical record only: this was the then-current v37/live43/v38 checkpoint. The historical phase-1 record above superseded it at that time; neither section is current release authority._

- **Observed production and GitHub lineage:** Sites v37 is live from checkout `61e9ace7723ef56f42111f320327187596406944`, with 200 files at `929e05cf68a6af5176811f49321ec108e617b93a08153b65b3f86b109d0c8c18`. Production has 43 applied migrations at `8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c`, through verified `041629`. PR #162 is already merged as canonical GitHub `main` and corrective-candidate base `ca47aeff7ab44a69b6ce039608ae27fea6c3c326`; that repository advance does not change the live Sites/database state.
- **Immutable source truth:** applied `20260808001430_momo_client_pipeline_readback_v3.sql` is permanently bound to SHA-256 `987186e74590c6e484ebfee47e1c7ed384e2b4dc8c4a97ad7243ae38feb765cc`. Do not rewrite it to match PR #161. The displayed-asset change exists only in applied forward migration `20260808041629_repair_momo_client_v3_displayed_asset_scope.sql`, SHA-256 `6cbf3f80d028d3fe54093b14bae59314913b4f0bfacfbf31fce4aa2a24e429ba`.
- **Corrective candidate:** 201 Sites files at `4edae9660343cda362968bd08e544ba5a154c90a902ac961365ceb32ea820292` and 43 mirrored migrations at `8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c`. Its migration tree exactly matches live43. PR #163 is open but not merged; exact-final-head workflows and review-thread evidence remain unrecorded, and no corrected Sites v38 publication has occurred.
- **Next build/release gate:** `01210`, immutable `01430`, Sites v37, `01842`, `01853`, `02609`, and verified `041629` are complete. No database change remains pending. Production authority is granted while automatic deployment remains disabled. Review the exact corrective candidate, require all four exact-head workflows and zero unresolved threads, then publish and verify corrected Sites v38.
- **Safety boundary:** `02609` is applied but remains non-comprehensive because live `postgres` is not a `supabase_admin` member and that role was skipped. Private policy-eval results remain local synthetic evidence. Providers, external publishing authority, owner authority, and Momo activation remain locked.

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
- `RETIRED_SOURCE_REMOVAL.md`
- `../veroxa-sites/app/momo-readiness-tracker.json` (immutable v22 pre-deploy No-Go/rights/spend snapshot; not current bridge-deployment authority)

## 2026-08-05 — permanent repository cleanup

- Verified v36 source and migration parity satisfied the cleanup gate, and Faraz explicitly authorized permanent deletion of retired files and duplicate branches.
- The legacy Vite/Replit runtime and its obsolete checks are removed from the current tree. Current engineering must use `artifacts/veroxa-sites`, `supabase`, the API packages, and the remaining release/source-truth guardrails.
- The branch end state is protected `main` only. Historical commits remain immutable audit lineage; they are not active source, a rollback app, or a reason to preserve duplicate remote branches.
- The cleanup is behavior-neutral for production: no Sites deployment, database migration, provider connection, public action, Momo activation, or spend is included.
- Keep the exact inert Vercel shutdown sentinel until external Vercel Git disconnection is independently verified. Its presence does not make Vercel an active platform.

## 2026-08-02 — Momo upload-to-Veroxa-Ready v36 live; GitHub parity verified

- **Historical live runtime:** Sites v36 is live from `b8122642b72e5d4e6e74c379469f2a157781ab3d`; its canonical 185-file source tree is `caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7`. Its historical repository/Sites mirror had 37 migrations at `9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90`; the exact remote-ledger reconstruction is recorded in the current section above.
- **Historical GitHub parity:** PR #157 passed all four workflows at reviewed head `d3a63d25644fc699d1f521f8f803e5bd95daae49`, had zero unresolved review threads, merged at `aafebf93a6bc40f9578c29f4a25371f8203d0387`, and passed all four push workflows. It established v36 source and repository/Sites-mirror parity; it does not prove the current local candidate or the later reconstructed remote-ledger identity.
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
