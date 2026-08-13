# Veroxa Current Milestone

Status: highest-priority governing build direction as of 2026-08-08.

Read this file first before planning, building, reviewing, merging, deploying, or recommending Momo outreach. If an older roadmap or status note conflicts with this file, follow this file and Faraz's newest explicit instruction.

<!-- GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY -->

## 2026-08-13 — durable media-ingestion recovery candidate; release pending (current authority)

Current reconciliation markers: durable media-ingestion recovery candidate; GitHub main 804f96f41fadf30e7ecca810c07fd176ab32f379; branch agent/momo-media-durable-recovery-20260813; Sites v53; live56; USD 0 incremental spend.

- **Authority and scope:** `GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY` remains in force. External providers, publishing, review replies, website writes, and external scheduling remain disabled.
- **Reviewed candidate:** `20260813163534_durable_media_ingestion_recovery.sql` adds a transactional private outbox, bounded SKIP LOCKED leases, independent failure receipts, signed recovery wakes, trusted byte decode/hash recovery, and stale orphan-job retirement. Root and Sites migration mirrors are byte-identical.
- **Incident:** asset `05ab2303-f7ea-4056-8f75-9cd7e523a4f4` and its exact Storage object are preserved. At this candidate checkpoint the existing asset remains unmodified; no production recovery is claimed.
- **Truth boundary:** recovery ends at private verification and does not make the asset Ready. The development-proxy, not-for-restaurant evidence still requires genuine owner rights and current-offering association.
- **Bridge repair:** the stale Edge aggregate-pixel ceiling is removed. Four dedicated private keys replace the structurally impossible shared setting. A source-controlled dual-public-key cutover accepts only each function's old/new pair until the new Sites secrets are verified; a separate cleanup removes the previous keys.
- **Quality evidence:** 476/476 application tests, production build, typecheck, lint, focused security review, and diff checks passed locally. Exact-head GitHub workflows, merge, database apply, Edge/Sites publication, recovery, and cleanup evidence remain pending.
- **Cost and actions:** provider calls, Ready disposition, public actions, and incremental spend are unclaimed and remain blocked; USD 0 incremental spend.

## 2026-08-12 — legacy media purge; high-resolution private uploads; Sites v53 deployed (historical)

Current reconciliation markers: content lifecycle v11; Sites v53; live56; USD 0 incremental spend.

- **Authority and scope:** `GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY` remains in force. External providers, external publishing, review replies, website writes, and external scheduling remain disabled; incremental spend is **USD 0 incremental spend**.
- **Owner-directed purge:** the exact three legacy private-media assets shown by the owner, their related rights/tags/incidents/attempts/events, and all three backing Storage objects were permanently deleted. Verified postcondition: **remaining media=0** and **remaining storage objects=0** for the scoped restaurant. This exceptional exact purge does not create a general automatic-deletion policy and is not recoverable.
- **Current database:** Supabase is live56 through `20260812221509_restore_high_resolution_media_finalize_service_role_v1.sql` (652 canonical bytes; SHA-256 `8a740ea365a462e9c9dea55f795f2025bfff7f9fe4db3bb25d2bfaab535988b3`). The applied high-resolution migration is `20260812214257_high_resolution_private_media_v1.sql`. Root and Sites migration mirrors contain 56 byte-identical SQL files at tree SHA-256 `8d6f2b940bee42462c50349101af36f5efedb4f7d4309a18167261fbd342c8fe`.
- **High-resolution acceptance:** the former **16,777,216** total-pixel ceiling and hidden 128 MiB PNG decoded-stream ceiling are removed. The 8064×6048 JPEG and PNG contracts pass. Every accepted original must complete trusted host decoding before finalization or provider use. JPEG/PNG, 10 KB–10 MB source size, 128–12,000 per-axis bounds, 0.4–2.5 aspect ratio, decodability, immutability, and hash verification remain enforced.
- **Current Site:** Sites v53 is served at `veroxasystems.com`; release `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_6e36025a6f248191a047d9bbdd04d90a`, source commit `f21cd4e9b99d601d8e3df9b221e14b513a8ac2d6`, 227-file source SHA-256 `f36746fd569ee0b26c961c71e98dfc31308be4b5938a5902b145ecfbbd0c4348`, archive SHA-256 `99fd27fa4fa00f9c5522a74b0504d14fac1ccd26e9a685b343be4f6a34554c21`, and environment revision 14.
- **Quality evidence:** application tests passed **443/443**; lint and production build passed. The deployable source remains `artifacts/veroxa-sites`; both canonical root migrations are mirrored into that source.
- **Canonical synchronization:** this release candidate is based on GitHub main `fb6d8b13bf548fd144cec4ce241bd44c1cecc99f`. GitHub records the exact pull-request head, workflows, merge identity, and final main lineage; this document does not preclaim an unknown merge SHA.
- **Runtime boundary:** content lifecycle v11 and the existing external-action locks are unchanged. The one-time exact purge helper was immediately replaced by an inert v2 function with JWT verification; the temporary purge endpoint is inert and is not a reusable delete surface.
- **Proof boundary:** there was **no real new-user upload**, provider call, Ready disposition, schedule, post, publication, or owner contact in this pass. Production verification proves the scoped purge, migration, Site deployment, and source/test results only.

## 2026-08-12 — Momo live54 rights-attestation repair; Sites v50 deployed (historical)

Current reconciliation markers: content lifecycle v11; USD 0 incremental spend.
- **PR #179 validation:** corrected v50 source/evidence candidate `8262ab6824dddbc9fb058b1500a2f8d0f2369851` (tree `1afd667a936b5cd12df930b2341d9e9feeb4e6d2`) passed CI #483 (run 31633030085), Sites Verify #173 (run 31633030045), Supabase Verify #143 (run 31633030057), and Veroxa Verify #428 (run 31633030054); review threads: 0. GitHub `main` remains unchanged pending final evidence-head validation and merge.
- **Authority:** `GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY` remains in force. External providers, external publishing, website writes, review replies, and external scheduling remain disabled; incremental spend is **USD 0**.
- **Current database:** Supabase is live54 through `20260812042031_momo_team_content_ai_read_grants_v1.sql` (393 canonical bytes; SHA-256 `78d43d24a8249523a8866331598491e478950c7a7a8a35451b29839ccc777b96`). The two live54 migrations are mirrored in the canonical root and Sites source tree.
- **Current Site:** Sites v50 is served at `veroxasystems.com`; the saved release is `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_435b68bbe9c08191bd9579825218fa5a`, source commit `5dc88c25a9eab02a33ce8b357cc09d5b43d0af9e`, 222-file source SHA-256 `053cecab6ac5164f9f80d57f2d4f470f12cf2d4c92c7cd113a9ed7fc936bd8ec`, archive SHA-256 `9aada7a54f6da92893b0ce551d3f03b2a970ad4e28de8beb8d17540e6edce1e2`, and environment revision 14.
- **Owner permission attestation:** the one-step Client upload requires an explicit owner permission attestation for Instagram, Facebook, and Google Business before confirmed scoped rights can be created. The upload adapter rejects `media_rights_attestation_required` before storage when unchecked. This does not authorize posting or connect an account.
- **Bridge:** the signed content lifecycle function is ACTIVE at v11 with JWT verification; dispatch v3, webhook v4, and media lifecycle v3 remain active. The bridge source is mirrored in root and Sites. No provider call, Ready disposition, or real upload result is claimed; there was **no real new-user upload** in this pass.
- **Handoff boundary:** `clientActionAfterUpload=none` and `processingOwner=veroxa_team`; authenticated v2 execute is revoked, and the 3 existing saved uploads remain 3 open Team media-intake exceptions, externally locked. The Team-only saved-instruction processor remains available, and no re-upload or retry is claimed.
- **Guarded runtime:** `ai_live_calls=true`, 13 authenticated grants, 32 service-role grants, 14 functions still held, one active Team profile, one active Momo membership, and 2 upload-status rows all external-locked. The rollout authorization is consumed; no Sites v42 claim exists.
- **Canonical status:** GitHub main is still `18d7030de8b0c2fe4fdab84e2679e643dfe8d3f1`; draft PR #179 carries the deployed v50 rights-attestation repair candidate.

## 2026-08-09 — exact live47 held; bounded candidate48 pending in PR #165 (historical pre-apply checkpoint)

- **Canonical repository and database:** GitHub `main` is `39bf713705685636f0d20a2ca068c738d4f414b4` from merged PR #166. Production Supabase is the exact immutable live47 ledger through `20260808083842_post_20260808070840_private_media_authority_repair_v1.sql` (110,797 bytes, SHA-256 `3d2ba3a86024edef024a12ff9556c4e236baa57cbf2d4d478f9514321d69abee`) at tree `87c0ecd4272949d89e7512940f91f9d9e3c6e92154616377c78ef9e3d06bfc5e`. Preserve all applied bytes, including the stronger live47 Ready-authority bridge.
- **Live Sites and Edge remain separate observations:** Sites v39 is still independently observed at version ID `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8`, checkout `8749a7d442d3bb068ce626a9d297b8b227493446`, and archive SHA-256 `c5c476639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5`. Edge v6 remains ACTIVE with `verify_jwt=true`, prompt v1, and an unauthenticated 401 smoke; the prompt-v2 candidate is not deployed.
- **Production hold:** a fresh live47 catalog/runtime read confirms 49 scoped mutable public functions with zero effective anon, authenticated, or service-role mutation grants; one runtime row has `ai_live_calls=false`, `provider_writes=false`, `review_replies=false`, `website_writes=false`, and `external_scheduling=false`; relevant work, outbox, webhook, dispatch, wake, reserved-cost, and uncertain-cost counts are zero. Three bounded authenticated read-only RPCs remain. The existing tenant-scoped Client storage policy may create an unregistered orphan object, but the registered mutable-RPC hold prevents registration or downstream work. Team storage policy widening is not live.
- **Draft PR checkpoint:** PR #165 remains a draft on `agent/momo-private-assessment-ready-unified`. Its historical non-final opening head is `9176e50436db7328401a91d64b536948ed4ef915` with tree `01a79b952c6356b2cb1c54dc262541f1ad4fd198`; final-head workflows, review-thread closure, approval, and merge evidence remain pending. The current pre-apply candidate is 214 Sites files at `fd3b8a61c0eb5781ffd80d58f6e69925fc4996474d891d3fc2915e317e17d799` and 48 mirrored migrations at `1e6b179940063af767550e56f2df71a81bc445d8a6f4558585282a490790958c`.
- **Bounded forward candidate:** provisional `20260809024500_team_private_food_assessment_reconciliation_v1.sql` is root/Sites byte-identical, 59,052 bytes at SHA-256 `56c64c795ad12f1dfbe05894fd3e56a87f1d0e3376ff10edfd97760b8d2fbd5c`. It adds only the missing Team assessment-only intake marker/guards, JPEG/PNG boundary, v2 private-food evidence contract, and exact accounting gate while preserving live47 source tombstones and Ready authority.
- **Quality evidence:** current frozen SQL fixtures are preconnection `d6d870788c1211d8209048921232e9e8b1cffa16aae1ef9a4a9516b150434b5d`, owner controls `60db739eeeaba5be8d70e62b6ec60cf9b6db758d1509940068ef164c7fe650b5`, full OS `f20ac4e5927543277e520fbfd7104ded39fd11fa14995bf227fb64384dba5480`, and zero-cost `13e246455692d5005d688fcc68aea4805a7d64bc87c2604edf8db26599b06cbe`. Prior application evidence is 431/431, but the exact candidate48 clean-chain migration apply and full hosted pgTAP remain pending and must not be inferred from older runs.
- **Generated-version and rollout rule:** finalize PR #165 on current main and require exact-head gates → apply only the reviewed candidate48 bytes under the hold → verify and reconcile the Supabase-generated filename without changing bytes → publish exact Sites and deploy prompt-v2 Edge under the hold → author/apply a separate dormant identity-bound activation routine with no callable grants → reconcile and republish exact parity → invoke once as postgres only after all identities and zero-work gates match.
- **Authorization versus execution:** Faraz authorized the scoped database/Sites/Edge/internal-AI rollout and up to USD 20, while the target remains USD 0 incremental spend. Automatic deployments remain disabled. External providers, review replies, website writes, external scheduling, posts, owner contact, and public writes remain locked.
- **Proof boundary:** no current record proves a real upload, provider call, Ready approval or discard, owner confirmation, current-offering association, schedule, post, public write, owner contact, or activation execution. Generic food support never authorizes dish, brand, menu, restaurant, ownership, or ingredient inference from pixels.

## 2026-08-08 — superseded live46 integration baseline; forward repair was pending (historical)

- **General product boundary:** Veroxa privately assesses arbitrary Client-supplied restaurant media, including any food, drink, dining scene, non-food, or unclear image. Momo's House is the founding pilot, not the product ontology and not an inference target.
- **Production database:** production has 46 observed migrations. The unique latest row is 20260808070840_momo_ready_team_decisions_and_food_tags_v2.sql, 160,956 bytes at SHA-256 9cf6f0080d38d58d3c1939d928444701b1954bf5cfe96bf7f3e80077bad45cc0; the exact live46 tree is a575a605c65252386d5d55c26b1a9cf4c88c85e854c74ca0486ecd1ec1f6d3d0. Byte observation does not prove the semantic contract: database review is repair_in_progress, a forward repair is required, functional verification has not passed, additional database changes are required, and database apply authorization is false.
- **PR #164 history:** PR #164 final head 0c82ea1a7e8b9d1873eb79509ccbbb722fdf595d merged to GitHub main at f57a6f5a04d482353f32ccebb43ff5f225e3b8a9. Its four head workflows succeeded, but one non-outdated P2 review thread remains recorded as unresolved: PRRT_kwDOSldANc6Xc7kI on operating-center queue filtering. That historical merge does not satisfy the current integrated-candidate release gate.
- **Live Edge evidence:** momo-content-ai-lifecycle remains version 6, ACTIVE, with verify_jwt=true and provider-returned ezbr_sha256 acf46f086b3ab07c914d71b5ae79dca011abab84016d4c9c58ff1c9b30eb58ce. One unauthenticated POST returned 401 with one matching log and no 5xx or exception. No authenticated bridge, provider call, real upload, Ready event, or discard event was performed.
- **Sites boundary:** live Sites remains independently observed v39 at exact version ID appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8, internal AppGen checkout 8749a7d442d3bb068ce626a9d297b8b227493446, and 54-file archive SHA-256 c5c476639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5. This is not a GitHub commit or a claimed association with PR #164.
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
- **App and Sites release separation:** the candidate app gate is clean at 422/422 tests plus build, typecheck, and audit. Its GitHub pull request and new Sites version/deployment are still pending. The live website remains Sites v39 baseline `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8`, internal Sites/AppGen source commit `8749a7d442d3bb068ce626a9d297b8b227493446` (not a GitHub commit), 54-file archive SHA-256 `c5c476639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5`, environment revision 10, active domains/SSL, and zero recent errors.
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
