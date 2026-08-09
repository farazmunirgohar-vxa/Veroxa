<!-- GUARDED_INTERNAL_AI_ROLLOUT_AUTHORITY -->

## 2026-08-09 — media upload handoff live; canonical parity pending (current authority)

- **Momo stops after upload:** Momo's responsibility ends when the private upload succeeds. The enforced handoff is `clientActionAfterUpload=none` and `processingOwner=veroxa_team`; Client verification, retry, assessment, and association-processing controls are removed.
- **Incident and recovery:** the source object was saved even though three finalization requests returned 503. The pre-fix instruction was not durably recorded, so it cannot be recovered or invented. All 3 saved unverified uploads are now 3 open Team media-intake exceptions, externally locked; the existing upload needs no re-upload or retry from Momo. Team may ask later only for a specific restaurant fact or permission, never for technical processing.
- **Durable intake:** Supabase is live50 through generated `20260809222502_media_upload_instruction_handoff_v1.sql`, 9,323 canonical bytes at SHA-256 `72698b4f091c9ffdc0ec5ebeda77e1ae53c0c99178aa65191467d126b5326bbd`. New uploads atomically register rights plus the Client's association instruction; zero instruction rows exist because no upload has occurred after this migration.
- **Live Sites:** Sites v44 is live at `veroxasystems.com` with version ID `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_9f17a14c35d0819185fd1a35a72601d7`, source commit `33224b3ba401965ff8e98d4900a636f7b495ce6f`, 217-file live source SHA-256 `92c61724f2d5b26d6ba4f7d3c0679b7099ad4c37a5850824d99a7417b5de118c`, archive SHA-256 `47703995c733cc85bb0e5f1f2a4254b6da7e364cd719b5e8d42603033f229457`, and environment revision 13. The 217-file canonical candidate uses the generated migration filename at SHA-256 `e13c7dcd1a355a20f7b3570304d768bb61bdf808d4b8da8f6df523d8617e5742`.
- **Repaired bridge:** the rotated signed bridge is ACTIVE as content lifecycle v9, dispatch v3, webhook v4, and media lifecycle v3. The matching source is mirrored in root and Sites; no provider call, Ready package, public action, or external write is claimed.
- **Canonical status:** GitHub `main` is `23148b90e34f75cb7212b85fe2312cbed8c169ab` from PR #173. Branch `agent/momo-media-one-step-handoff` reconciles the live fix and generated live50 filename; GitHub/live-Sites source parity remains pending until the reviewed merge and exact post-merge Sites checkpoint.
- **Preserved activation identity:** merged PR #169 commit `2721545d5823dbd4cbc233e7473d25393f4ff0ec` remains the immutable activation identity. The activation was invoked once at `2026-08-09T05:35:42.103503Z`, bound to Sites v41 ID `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_36b5c80ee2a48191acf5bcf809fd8ad7`, source `766ba3bc2a7ebd68c1d72ae7f53d159d2edca593`, archive `74c287e655495edde605f0fc38ebc06f1ed0f19275d550c4369e491430f7cea7`, Edge bundle `a6b00feeab795faa91d6d8d015c4ad399c526e1b35f702778a8c55aaba49503d`, and audit event `d31dc513-f953-4aca-9746-3f69447a6ae8`.
- **Runtime and ACL result:** `ai_live_calls=true`; `provider_writes=false`, `review_replies=false`, `website_writes=false`, and `external_scheduling=false`. Activation postflight preserved exactly 13 authenticated and 32 service-role grants with 14 functions still held; its smoke proved one active Team profile, one active Momo membership, and 2 upload-status rows all external-locked.
- **Quality:** the exact application candidate passes 431/431 tests, production build, lint, and diff checks. Root/Sites Edge source and all 50 migration files are byte-mirrored.
- **Authorization boundary:** the prior rollout authorization is consumed and does not authorize repeat activation. External providers, provider writes, review replies, website writes, scheduling, posts, owner contact, and public writes remain locked; this remains a USD 0 incremental spend incident repair. The historical activation closeout correctly required no Sites v42; Sites v42-v44 are later incident observations, not repeat activation.
- **Proof boundary:** one real private upload is observed only as saved intake. No successful verification, recovered pre-fix instruction, fabricated association, provider call, Ready decision, owner confirmation, external action, owner contact, or public publication is claimed.

## 2026-08-09 — exact live47 held; bounded candidate48 pending in PR #165 (historical pre-apply checkpoint)

- **Canonical repository and database:** GitHub `main` is `39bf713705685636f0d20a2ca068c738d4f414b4` from merged PR #166. Production Supabase is the exact immutable live47 ledger through `20260808083842_post_20260808070840_private_media_authority_repair_v1.sql` (110,797 bytes, SHA-256 `3d2ba3a86024edef024a12ff9556c4e236baa57cbf2d4d478f9514321d69abee`) at tree `87c0ecd4272949d89e7512940f91f9d9e3c6e92154616377c78ef9e3d06bfc5e`. Preserve all applied bytes, including the stronger live47 Ready-authority bridge.
- **Live Sites and Edge remain separate observations:** Sites v39 is still independently observed at version ID `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8`, checkout `8749a7d442d3bb068ce626a9d297b8b227493446`, and archive SHA-256 `c5c471639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5`. Edge v6 remains ACTIVE with `verify_jwt=true`, prompt v1, and an unauthenticated 401 smoke; the prompt-v2 candidate is not deployed.
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

- Current production is Sites v37 from checkout `61e9ace7723ef56f42111f320327187596406944` (200 files, `929e05cf68a6af5176811f49321ec108e617b93a08153b65b3f86b109d0c8c18`) plus 43 applied Supabase migrations at exact live-ledger tree `8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c`, through `20260808041629_repair_momo_client_v3_displayed_asset_scope.sql`. PR #162 is already merged as canonical GitHub `main` `ca47aeff7ab44a69b6ce039608ae27fea6c3c326`; this advances repository lineage only and does not change the live Sites/database observations.
- Applied migration `20260808001430_momo_client_pipeline_readback_v3.sql` is immutable at SHA-256 `987186e74590c6e484ebfee47e1c7ed384e2b4dc8c4a97ad7243ae38feb765cc`. Never replace its applied bytes with PR #161's changed source. The displayed-asset correction is forward-only in applied migration `20260808041629_repair_momo_client_v3_displayed_asset_scope.sql`, 7,293 bytes at SHA-256 `6cbf3f80d028d3fe54093b14bae59314913b4f0bfacfbf31fce4aa2a24e429ba`.
- The corrective branch is `agent/momo-client-v3-forward-scope-repair`, based on merged PR #162 / `main` `ca47aeff7ab44a69b6ce039608ae27fea6c3c326`. Its exact candidate is 201 Sites files at `4edae9660343cda362968bd08e544ba5a154c90a902ac961365ceb32ea820292` and 43 mirrored migrations at `8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c`. The migration tree exactly matches live43. PR #163 is open; it is not merged, and exact-final-head workflows and review-thread evidence remain unrecorded. Local review passed.
- Rollout history is `01210` complete → immutable `01430` complete → Sites v37 complete → `01842` complete → `01853` complete → `02609` complete → verified `041629` complete. No database migration remains pending. The sole pending release action is corrected Sites v38 publish/verify; production permission exists, automatic deployments remain disabled, and every encoded local/hosted gate still applies.
- `02609` remains non-comprehensive: live `postgres` is not a `supabase_admin` member, so that role was skipped. The verified database repair and future Sites v38 release imply no provider connection, external publishing authority, owner authority, or Momo activation.

## 2026-08-05 — permanent retired-source and branch cleanup

- Faraz explicitly authorized permanent deletion of retired files and duplicate branches after the verified v36 GitHub/Sites/Supabase parity checkpoint.
- The retired Vite/Replit runtime, its package/configuration surface, its archived working-tree copy, its obsolete checks, and the unused script scaffold are removed from the current repository tree. `artifacts/veroxa-sites` is the sole deployable application source; `artifacts/veroxa/docs` and `supabase` remain active source/evidence.
- Do not recreate a branch-held, working-tree, deployment, or rollback copy of the deleted runtime. Immutable Git commit history is sufficient audit lineage. `scripts/src/check-retired-source-removed.ts` must remain green.
- Delete all reviewed pre-cleanup non-default remote branches; after the cleanup pull request merges, delete its head branch too so GitHub retains only protected `main`.
- This repository cleanup does not deploy Sites, apply a database migration, connect a provider, publish externally, spend funds, or activate Momo. The inert root `vercel.json` remains until external Vercel Git disconnection is independently verified; it is a safety control, not active platform source.

## 2026-08-02 — Sites v36 live; GitHub parity verified

- Sites v36 is live from checkout `b8122642b72e5d4e6e74c379469f2a157781ab3d`. Excluding generated `.vinext` cache, its 185-file canonical tree is `caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7` and exactly matches `artifacts/veroxa-sites` in canonical GitHub source/main.
- Production Supabase has 37 applied migrations through `20260802063829_momo_pipeline_query_indexes_v2.sql`; the exact observed remote ledger tree is `d306d26cb633ef943afdb7efd01a3cde70249a096ef783d1b0d51eb5d4a1a429`. The `9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90` tree is historical v36 repository/Sites-mirror evidence, not the exact remote ledger.
- PR #157 passed all four pre-merge workflows at reviewed head `d3a63d25644fc699d1f521f8f803e5bd95daae49`, had zero unresolved review threads, and merged to GitHub `main` at `aafebf93a6bc40f9578c29f4a25371f8203d0387`. All four push-to-`main` workflows then passed. This is historical v36 source/repository-mirror parity evidence; it does not prove the exact remote-ledger bytes or the current local candidate.
- PR #157 was source reconciliation only: it required and performed no Sites publish and no database migration apply. PR #155 / Sites v22 remains preserved as the historical GitHub/Sites parity predecessor.
- `artifacts/veroxa/docs/MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json` is the current live-status record. The bundled `momo-readiness-tracker.json` remains immutable historical v22 evidence and must not override the v36 closeout.
- The internal v2 path canonicalizes exact-byte duplicates while preserving each upload, rights record, and audit event; keeps near-duplicate merging advisory; creates an unscheduled internal Veroxa Ready package only after evidence is final; and presents Team Faraz with consolidated exceptions instead of routine approvals.
- Do not overstate image preparation: v36 accepts an unchanged JPG only when its technical and quality gates pass. Failing media is preserved with one consolidated exception; v36 does not auto-edit or auto-resize it.
- The release gates previously passed 371/371 tests, build, lint, typecheck, and rollback migration compilation. No post-v36 real upload, content-AI provider call, or Ready package has been created, so authenticated real-media proof remains pending.
- Publishing, scheduling, external providers, provider writes, review replies, website writes, and Momo activation remain locked. No test upload or provider canary was created during GitHub reconciliation.

## 2026-07-30 — verified v22 signed Media AI bridge release

- PR #155 passed all four exact-head workflows at reviewed head `96a6c00857b438b37c2e8d99329c0f556de850a2`, had zero review threads, and merged at `d1f6a9a78ac54cd5447689d5f8b3d42466daf479`.
- `artifacts/veroxa/docs/MOMO_MEDIA_V22_LIVE_CLOSEOUT.json` is the current machine-readable production closeout. The bundled `momo-readiness-tracker.json` remains the immutable v22 pre-deploy snapshot for No-Go/rights/spend facts; it is not the authority for whether the bridge was deployed.
- Sites version 22 is live from checkout `83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e`. Its 93-file source hash is `8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490`; both custom domains and SSL are active.
- The JWT-protected Supabase Edge lifecycle bridge is active, the matching Sites signing secret is masked, and the hosted no-JWT and unauthenticated-route probes fail closed. Migration 16 was already live and did not change.
- Do not call the authenticated workflow proven yet. A real Team preflight and Client/Team rehearsal remain pending, and Momo's current upload rights are expired. No real image or billable canary may run until rights and Team review are current.
- AI candidates remain private until exact Team inspection and approval. Candidate count, provider-call count, and accounted spend remain zero; USD $20 is the per-job automatic threshold and larger jobs require fresh authorization.
- Momo remains **No-Go**. Google/social, owner-controlled providers, external writes, publishing, and activation remain locked.

## 2026-07-30 — verified v21 foundation and lifecycle-bridge candidate (historical pre-v22 checkpoint)

- PR #154 is merged at `72c7fd73d3d2dff40ddd91bca2ef01d1ca8cb695`; Sites version 21 is live from checkout `8c50dd6726629e77d22f07eb6aac9f6982001902`; production Supabase has 16 applied migrations through `momo_media_ai_pilot_v1`.
- The OpenAI key, migration-16 capability, and hosted Media AI flag are present, but version 21 remains safely fail-closed because Sites does not hold a broad Supabase service credential. Do not call the feature active from configuration alone.
- At that historical checkpoint, the candidate added a narrow signed Supabase Edge lifecycle bridge for only preflight/start/complete/fail. It was based on GitHub `main` `72c7fd73d3d2dff40ddd91bca2ef01d1ca8cb695`, changed no database migration, and remained unmerged and unpublished.
- The bridge must pass Deno format/lint/typecheck, all four hosted workflows, zero unresolved review threads, a deployed no-image authentication matrix, exact Sites source parity, and post-deploy logs before effective runtime can be claimed.
- Momo's current upload rights are expired. No real image or billable provider canary is allowed until rights are current and Team review is approved. Spend remains USD $0; USD $20 is the per-job automatic authorization threshold, and larger jobs require fresh authorization.
- Momo remains **No-Go**. Google/social, owner-controlled providers, external writes, publishing, and activation remain locked.

## 2026-07-30 — high-quality Momo Media AI candidate (historical pre-v21 checkpoint)

- At that historical checkpoint, PR #152 / Sites version 20 / 15 applied migrations was the exact verified production baseline. The Media AI work was a separate reviewed local candidate based on GitHub `main` commit `979ced364e9b94f42a5e9aece7e1aa9cfc8fa1c6`; it was not merged, migration 16 was not applied, and no later Sites version was published.
- The existing Momo **Review → Improve → Ready** flow now has a candidate high-quality, automated faithful-enhancement path using `gpt-image-2`. It selects a high-resolution output for the Team-selected destination, keeps the original unchanged, and creates exactly one private candidate per approved request. The deterministic Media Review and Compliance contracts govern it; Caption, Compliance, and Media Review are not separate model calls in this release.
- The OpenAI credential is provisioned only as a server secret. The live Media AI flag remains off, provider/real-edit proof remains pending, and actual spend is USD $0. The database treats USD $20 as a per-job automatic authorization threshold—not a lifetime or recurring budget: an individual job above that estimate must obtain fresh Faraz authorization before it reaches OpenAI.
- The current Momo upload's rights are expired. No real image may cross the provider boundary until rights are current and Team review is approved; every AI result stays private until the exact candidate is decoded, inspected, attested, and explicitly approved.
- Momo remains **No-Go**. Google/social, owner-controlled provider access, external writes, automatic publishing, and Momo activation remain locked.

## 2026-07-22 — verified PR #152 / Sites v20 production override (historical)

- `artifacts/veroxa/docs/MOMO_MEDIA_V20_LIVE_CLOSEOUT.json` is immutable historical live evidence. PR #152 reviewed head `b170c4339ae43755f17a19d74107cb75c6b198d3` merged at `29e90d40fa05d67d2a6246f9a0ba64fe1b9099b7` after all four workflows passed.
- Sites version 20 succeeded from checkout `aceb17bb446854d48a71e54ba814591cf2c19d33`; both custom domains, SSL, and provider status are active, and the first 15-minute Worker-error check returned zero events. It made no database change.
- Momo remains No-Go: the authenticated Client/Team media rehearsal is not yet performed, and Google, social, publishing, live AI, and external providers remain inactive.

## 2026-07-22 — verified PR #151 / Sites v19 production override (historical)

- PR #151 passed all four exact-head workflows with zero unresolved review threads at reviewed head `e5c40c02a79df91f424cd51a51e9f1c7e1b7147a` and merged to GitHub `main` at `bcd9b9da1796e72c0b9b546e9944a4e7e419c1b4`.
- Sites version 19 succeeded from checkout `5b7884983e2891cb8f55aef3d9553e981853be23`; the public site, both custom domains, and SSL were verified, and the initial post-deploy Worker error check returned zero errors.
- Production Supabase has 15 applied migrations. Migration 15's live RLS, direct-grant, Client-RPC, privileged-function, and storage-policy checks passed.
- At that historical checkpoint, the iCloud account was the active Momo Client development proxy and Gmail was the separate active Team identity. One real private upload and one then-current confirmed rights record existed; approved Team reviews and Ready renditions remained zero pending the real two-role browser rehearsal.
- Runtime AI, Google/social, providers, external writes, and publishing remain locked. Nothing was published; verified spend is USD $0 of the authorized one-time USD $20 ceiling. Momo remains evidence-based **No-Go**.
- `artifacts/veroxa/docs/MOMO_MEDIA_V19_LIVE_CLOSEOUT.json` is historical live evidence. All lower release-state wording—including PR #149 / Sites v15 and PR #143 / Sites v9 markers—is historical lineage only.

## 2026-07-14 — verified PR #149 cleanup and Sites v15 deployment override

- PR #149 passed all four required workflows with zero unresolved review threads at reviewed head `0d2c6e47fbfe1c44a2f0ff19fbb158001ed9365a` and merged to GitHub `main` at `9749b68ce2cfc383deeae6aa63c413019ef61385`.
- Sites version 15 succeeded from checkout `e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0`. Its 55-file canonical source tree has SHA-256 `ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f`; the public site and both custom domains were verified.
- Production Supabase remains at 13 applied migrations. Canonical filenames and SQL content match the applied ledger, and PR #149 required no database apply.
- Machine state is `verified_reconciliation_cleanup_deployed`; release state is `post_release_cleanup_deployed`. An evidence-only closeout PR does not touch `artifacts/veroxa-sites`, so it requires no Sites version 16 deployment.
- Legacy Vite is archived from active workspace, build, and CI paths while retained as recoverable historical evidence. Runtime AI, credentials, Momo/client contact, Client provisioning, owner confirmation, media rights, external providers, publishing, billing, activation, and incremental spend remain disabled. Momo remains a visual/manual No-Go until the evidence gate passes and Faraz separately authorizes contact.
- Branch deletion remains unavailable through the connected GitHub surface. Vercel remains retired; the external Git integration is not verified disconnected, so preserve the exact inert shutdown sentinel.

## 2026-07-14 — production reconciliation, founding-pilot, and freeze override (historical pre-PR #148 checkpoint)

- GitHub `main` remains canonical at `674e1a7c0d140c9b281029277baeb2e68962dac2`, but production is currently ahead of it: live Sites version 13 is checkout `dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805`, and Supabase has 11 applied migrations. This is observed drift, not parity.
- The exact live Audit V3 migration is `20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql`, SHA-256 `304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2`.
- The reconciliation candidate is unmerged and undeployed. It is not published as a new Sites version and is not an authorization to change production. Never predict its merge SHA or future Sites version.
- Read and enforce `artifacts/veroxa/docs/VEROXA_DEPLOYMENT_MANIFEST.json`. Product deployment is frozen except for one explicitly reviewed, green, merged reconciliation release whose generated attestation binds the exact `GITHUB_SHA` to the reviewed Sites and migration trees.
- Momo has already agreed to be Veroxa's free founding pilot. The current milestone is the secure, persistent, human-controlled Momo operating loop and evidence-based onboarding gate. This manual-first founding-pilot direction supersedes the 2026-06-14 automation-first walkthrough note below.
- Runtime AI, credentials, owner/client contact, Momo activation, external providers, publishing, billing, and incremental spend remain disabled. A visual/manual review must not manufacture owner confirmation, client identity, media rights, work, activity, reports, or readiness evidence.
- Vercel remains retired, but its shutdown sentinel must remain until the external Git integration is independently confirmed disconnected. Branch deletion and legacy Vite removal are post-release cleanup actions only after canonical parity, rollback evidence, ownership review, and explicit approval.

## 2026-07-13 — PR #145, Supabase 10, and Sites v11 verified production state (historical)

- Verified source: PR #145 passed review at exact head b007de99eb6c927f6d7ede56d7d4fffe8cbc0f0d and is merged to GitHub main at 9aa74631e393bc0303c820cc7671f818d617778c.
- Verified data: Supabase has all 10 production migrations applied and verified. Restaurant Audit V2 is remote migration version 20260713212046 with SQL SHA-256 f4bfff7ac94ade68a2c4f761c5627dbcfe82d5800a0a8a46ce42b13e5b930693.
- Verified hosting: Sites version 11 succeeded in production from checkout source 4bef697e230791403211cb9c60f769ebcb4f39c7. Both custom domains are active with healthy SSL.
- Live product state: Restaurant Audit Center V2 and the simplified Momo Team information architecture are live. Audit V2 provides the deterministic score out of 100, room-for-improvement findings, 30/60/90-day plan, and save-or-discard preview flow. Team remains organized under the Momo's House San Antonio folder with a Momo-only Work Board and focused content/approval views.
- Conversion boundary: a reviewed audit may create only a pending, non-operational restaurant profile after exact explicit consent. It never auto-creates a client identity, membership, active workspace, onboarding activation, publishing authority, paid service, or charge.
- Operating boundary: Momo's House San Antonio remains the only operational restaurant and remains blocked until its owner-confirmed truth, permissioned media, provider authority, and remaining readiness evidence are complete. No runtime or paid AI, Meta/Google connection, external SEO/social execution, publishing, outbound contact, owner/client contact, or activation was authorized by this release.
- Supersession: older current-looking PR #143, PR #144-pending, Sites version 9/10, nine-migration, unshipped-candidate, or Audit V1 wording below is historical and superseded by this verified section.

## 2026-07-12 — Current milestone and mandatory continuity update

- Read `artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md` first for the current scope, priority, verified state, and next build.
- Momo's House San Antonio is the only operational client and restaurant workspace for the current milestone.
- Team Faraz is Momo-focused. The only capability for non-client restaurants is the standalone, fully functional Restaurant Audit Center.
- An audited restaurant remains a Team-owned audit record or prospect and does not become an operational client unless Faraz separately and explicitly approves conversion.
- The current milestone is Momo's House San Antonio 100% readiness with maximum safe AI, automation, social handling, SEO, approved publishing, reporting, monitoring, and human approval control.
- After every build, update `VEROXA_CURRENT_MILESTONE.md`, `CURRENT_BUILD_STATUS.md`, relevant runtime/deployment truth, and Faraz's plain-language handoff. Update locked memory when durable scope, authority, or product direction changes. A build is not complete until this continuity update is done.
- Older instructions that defer Team Portal capability, prioritize broad public/client work, or use the earlier post-cutover route-parity sequence are superseded for this milestone. Historical multi-client prospecting applies only inside the Restaurant Audit Center and does not authorize another operational client.
- Current verified operational foundation is PR #143: reviewed head `009276dbbf2639dc1eb5296bf62906f9f8ac45f1`, merged operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8`, all nine production migrations applied and verified, and Sites version 9 deployed successfully from checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c` with both custom domains active and SSL healthy. PR #144 is the behavior-neutral repository-and-Sites-evidence continuity release; because it changes Sites-bundled readiness evidence, verified Sites version 10 is a required post-merge target and is not already deployed. Its database-source delta is limited to reconciling the ninth migration filename/ledger to remote version `20260713191147`; schema, SQL content, and migration count do not change. Never embed or predict PR #144's merge SHA: external GitHub PR metadata and Sites checkpoint metadata are the post-merge source/deployment authorities. Approved-user password sign-in, secure-email-link recovery, active Momo membership authorization, RLS, durable audit intake, protected portal routes, and the no-new-spend seven-step operating foundation are live. Hosted reauthentication and old-session revocation remain unverified, while Momo client identity/data, AI, external integrations, publishing, and activation remain gated.

## 2026-07-12 — ChatGPT-managed build, GitHub, and deployment protocol

- Faraz uses ChatGPT as the primary Veroxa command center. Faraz and ChatGPT decide the next outcome together; ChatGPT invokes Codex and connected GitHub/Sites tools internally. Do not require Faraz to copy prompts into a separate Codex, GitHub, Sites, terminal, or IDE window for routine work.
- Read `artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md` before planning, building, reviewing, merging, or deploying Veroxa.
- `Build it` authorizes the agreed branch, Codex implementation, tests, pull request, CI/RR fixes, and merge of the exact reviewed commit only after the green gate passes. It does not authorize a Sites deployment unless deployment was explicitly included.
- `Build it, but hold for review` stops at a verified green pull request and does not merge or deploy.
- `Build and deploy it` authorizes the green merge plus synchronization of the exact merged GitHub state to Sites, checkpoint deployment, and live/custom-domain verification.
- `RR` means deep review and reasonable safe fixes; `RR` alone does not authorize merge, deploy, activation, or scope expansion.
- GitHub `main` remains canonical. A GitHub merge and a Sites deployment are separate actions; do not leave live Sites behavior ahead of GitHub source of truth.
- Pause for specific Faraz direction when scope materially expands into production auth or credentials, real customer data/privacy, destructive data or production migrations, billing/payments, external integrations or publishing, owner/client contact, business-truth or public-promise changes, DNS/domain-record changes, Momo activation/walkthrough, or a material product-direction change.

## 2026-07-12 — ChatGPT Sites migration and RR source-of-truth lock

- Faraz explicitly approved building the real Veroxa application through ChatGPT Sites using the existing GitHub/Codex Veroxa OS as the core skeleton.
- This is not a new demo and must not replace Veroxa with a shallow visual prototype.
- GitHub `main` remains the canonical source of truth for product behavior, routes, operating memory, guardrails, and build direction.
- ChatGPT is Faraz's primary operating interface and invokes Codex as the engineering workflow.
- ChatGPT Sites is the primary application/deployment surface.
- Vercel is retired. ChatGPT Sites is Veroxa's sole deployment and hosting surface.
- Read `artifacts/veroxa/docs/CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md` before changing hosting, routes, access, authentication, or the custom domain.
- `veroxasystems.com` and `www.veroxasystems.com` are attached with active SSL. Preserve GitHub/Sites parity, mobile/build validation, honest public-shell labeling, domain verification, and rollback after each authorized deployment.
- When Faraz asks for `RR`, perform a deep GitHub review plus ChatGPT Sites integration review. Fix reasonable code, docs, guardrail, CI, security, and direction drift without silently activating real-world systems.
- The Sites migration did not by itself authorize identities, credentials, customer data, external integrations, AI provider calls, publishing, or the Momo owner walkthrough. The later scoped Supabase release now provides production Team authentication and Momo/Audit persistence; no Momo client identity, owner-confirmed data, provider connection, publishing, or owner walkthrough is active.

## 2026-06-21 — Historical post-PR120 source-of-truth operating lock

This section records the retired Vite/Vercel state at PR #120. It does not override the current PR #143 / Supabase-nine / Sites-version-9 operational foundation or the PR #144 / Sites-version-10 continuity rule above.

- Current operating baseline: merged PR #120 — Momo Internal Dry Run + Go/No-Go Gate.
- PR #119 AI Draft Approval Queue is merged/completed.
- PR #120 Momo Internal Dry Run + Go/No-Go Gate is merged/completed.
- PR #121 was closed unmerged and is not active source-of-truth.
- PR #122 was closed/not used and is not active source-of-truth.
- Older Momo owner walkthrough and launch QA docs are historical/blocked references only unless Faraz explicitly reactivates them later.
- No future agent should assume the Momo owner walkthrough is approved.
- No future agent should assume activation comes next.
- No future agent should enable real auth, external integrations, publishing, AI provider calls, platform tokens, or real client accounts/data exposure unless a later prompt explicitly approves that exact scope.
- Historical markers only: “AUTH_MODE remains placeholder” and “/api/pilot-access remains active” described the retired Vite/Vercel path and are not current Sites requirements.
- Roles remain client/team only.
- Momo owner walkthrough remains blocked.
- No next activation PR is approved by default.
- Future real-world activation, real-auth activation, external platform setup, owner walkthrough, or real client accounts/data exposure requires separate explicit Faraz approval.

# Veroxa Agent Instructions

Current docs authority: read `artifacts/veroxa/docs/VEROXA_CURRENT_MILESTONE.md` first, then `artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md`, then `artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md`. Do not override the current milestone, active docs index, locked operating memory, `PRICING_SOURCE_OF_TRUTH.md`, or `CURRENT_BUILD_STATUS.md` with older current-looking docs or archived strategy notes.

## 2026-06-14 — Automation-first Momo pivot

- Faraz’s latest direction is automation-first before any Momo owner walkthrough: Veroxa should be live and automatic enough to operate with minimum human interference before Momo is walked through the owner experience.
- Do not assume or revive the old manual-first Momo walkthrough path unless Faraz explicitly says to use a manual-first walkthrough again. Older manual/pre-live walkthrough docs are historical/stale for the current Momo path.
- Automation may prepare and process internal Veroxa work, drafts, classifications, activity records, and Team review items.
- Public/customer-visible actions still require Veroxa/Faraz approval before anything goes live.
- Business-truth changes still require client confirmation before approval or execution, including hours, menu, prices, offers, links, sensitive claims, and complaint/reputation-impacting language.

## 2026-06-04 — 90% pre-paid OS final alignment

- Final public launch offer is still **Complete Online Presence — $495/month** with weekly updates, monthly online presence report, website alignment/refinement if access is provided, and portal request response/review/answer within 24 hours.
- **Yelp is coming soon / not included at launch**; TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations are also coming soon / not included.
- Add-ons are **new basic website +$95** and **missing Facebook/Instagram social profile creation +$45/profile**. Yelp setup is not a launch add-on.
- First-client loyalty discount policy: **20% off for the first 12 months, then kept only while continuously active. If the client leaves and returns later, the discount no longer applies.** This is policy/copy only, not checkout/payment logic.
- Internal-only value proof: **$9,900/month** is the minimum online-influenced sales channel value baseline for a $495 client at 5% margin; healthy is $15k–$25k/month, strong is $25k+/month with clearer action signals. This is not extra new sales and must not appear on public/client pages.
- Team Portal complexity remains deferred. Current priority is public/client/onboarding/reporting/proof/request-facing 90% readiness before paid systems.
- No live auth, storage, AI, API writes, production database work, payments, publishing connectors, webhooks, cron jobs, or automated customer-visible execution were added; `AUTH_MODE` remains `placeholder`.

## 2026-06-04 — Final launch offer lock / Post-PR67 alignment

- One active public offer: **Complete Online Presence — $495/month**. Starter, Growth, Premium, Local Presence, Full Presence, old Complete Presence, $295, and $995 language are historical/internal only and must not be shown as active public pricing.
- Included at launch: Google Business Profile support, Google Maps/local visibility basics, Local SEO/search visibility basics, existing website alignment/refinement if access is provided, Facebook support, Instagram support, picture-based content support, up to 3 posts/updates per week (media dependent), weekly updates, monthly online presence report, Client Portal access, portal request response/review/answer within 24 hours, and Veroxa team review before anything goes live.
- **Yelp is coming soon / not included at launch**, along with TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations.
- Add-ons: **new basic website +$95** and **missing social profile creation +$45/profile** for Facebook or Instagram. Yelp setup is coming soon, not a launch add-on.
- First-client loyalty discount policy: **20% off for the first 12 months, then kept only while continuously active. If the client leaves and returns later, the discount no longer applies.** This is not checkout/payment logic and must not confuse the main $495/month public offer.
- Website alignment/refinement included scope: name/address/phone, hours, menu/order/contact links, Google/Facebook/Instagram links, simple description refinement, basic local SEO wording, and small content corrections if access is provided. New basic website add-on scope is a simple mobile-friendly restaurant website with NAP/hours, menu/order/contact links, Google/Facebook/Instagram links, basic local SEO wording, and best-seller/service highlights. Not included: custom-coded website, advanced design, hosting/domain/email troubleshooting, online ordering setup, speed optimization, plugin troubleshooting, advanced technical SEO, unlimited pages/edits.
- Onboarding expectation acknowledgement must say: “I understand Veroxa does not handle...” customer-service replies, comments, DMs, inboxes, refunds, complaints, order questions, full custom website development, hosting/domain/email troubleshooting, Yelp/TikTok/Reels/Ads yet, or guaranteed orders/revenue/rankings/profit/ROI/growth; and “I agree the restaurant is responsible for...” usable media, business info confirmation, hours/menu/prices confirmation, existing offer/promotion confirmation, access when needed, customer conversations, and understanding that 24-hour response means review/answer/next step, not guaranteed completion.
- Weekly update means what Veroxa worked on, what was posted/prepared, what is pending, what media is needed, what the client needs to confirm, and what is next. Monthly report remains the deeper proof/reporting layer.
- Advanced Team OS complexity is later. Current focus is public/client/onboarding/reporting/proof/request-facing 90% before paid systems. Team surfaces should remain stable and action-focused; do not add complex Team command-center features unless explicitly requested.
- No live auth/storage/AI/connectors/payments/API writes, publishing, webhooks, cron jobs, production database work, or automated customer-visible execution are added or allowed in this alignment. `AUTH_MODE` remains `placeholder`.

This file is the repo-level operating guide for Codex and any coding agent working on Veroxa. If a task prompt conflicts with this file, follow the user's newest explicit instruction. Otherwise, treat this file as the locked Veroxa working model.

## 1. Product identity

Veroxa is an AI-assisted, automation-powered restaurant online presence and customer-growth operating system.

It is not just a website, portal, content scheduler, or traditional marketing agency dashboard.

The restaurant partner should experience Veroxa as simple, premium, calm, and low-effort. Veroxa should do the maximum practical work behind the scenes.

## 1A. Founder OS strategy

Veroxa OS is for Faraz first: the Founder/Team OS is the brain, while the Client Portal and Team Portal are supporting modules that help Faraz review, approve, and communicate work calmly. The Restaurant Opportunity Engine is central; Veroxa exists to help Faraz identify right-fit restaurants and create customer opportunity lift, not chase posting volume.

Public positioning stays: “We help restaurants become easier to find, easier to trust, and easier to choose.” Internally, the target is helping good-fit restaurants realistically move toward 3–5 daily customer opportunities in 60–90 days, but this is never public/client-facing guarantee language. Good-fit restaurants include those already paying more for weak results, weak communication, unclear reporting, or inconsistent execution. Bad-fit restaurants should be rejected or delayed.

## 2. Current active roles

Active roles today:

1. Restaurant Partner / Client
2. Veroxa Team / Faraz

Team currently means Faraz. The system is being built so Faraz can handle most human review from mobile or computer.

Owner and Operator are parked unless explicitly requested by the user. Do not build Owner/Operator dashboards or workflows unless the user specifically asks.

## 3. Current active build stack

The current active Veroxa build stack is ChatGPT-managed GitHub + Codex + ChatGPT Sites:

- ChatGPT is Faraz's primary operating and orchestration interface.
- GitHub `main` is the canonical source of truth.
- Codex is the engineering/build capability ChatGPT invokes internally.
- ChatGPT Sites is the primary application/deployment surface.
- Vercel is retired and must not be restored as a deployment or rollback path.
- Until the legacy Vercel Git integration is disconnected in its dashboard, the exact root shutdown sentinel may set only `git.deploymentEnabled: false`. It is not a runtime or rollback path; do not add any other Vercel configuration, and remove the sentinel after disconnection.
- Browser/manual QA is used for visual checks.

## 4. ChatGPT-managed build and merge workflow

For completed historical pre-live sequencing and safety context, see `artifacts/veroxa/docs/VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md`. It does not govern the current Sites roadmap.

Before implementing PR 100+ live automation work, read `artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md`.

Before any large build, also run through `artifacts/veroxa/docs/PRE_BUILD_STABILITY_CHECKLIST.md` to protect the Sites hosting identity and source sync, auth boundaries, audit search, public pricing, metadata, and SaaS safety.

Command meanings and the complete green gate live in `artifacts/veroxa/docs/CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md`:

- `Build it`: refresh current `main`, create a task branch, implement with Codex, test, open/update the PR, run RR, repair CI, re-check the exact reviewed head and mergeability, and merge only when green. After every build, update the milestone, build status, relevant runtime truth, and Faraz's plain-language handoff; update locked memory when a durable decision changes. Do not deploy Sites unless requested.
- `Build it, but hold for review`: complete the same engineering and verification work, then stop at the green PR without merge or deployment.
- `Build and deploy it`: complete the green merge, synchronize the exact merged GitHub source to Sites, run Sites verification, checkpoint/deploy, and verify access plus custom-domain health.
- `RR`: review and safely fix; do not infer merge or deployment authority from RR alone.

Green requires correct scope, applicable local tests/typecheck/lint/build and guardrails, successful required GitHub checks, Sites verification when Sites changes, a mergeable PR whose exact head is unchanged since final review, and no unresolved actionable review thread or known critical/high-severity defect. Never push directly to `main`.

## 5. Locked pricing

Do not change pricing unless explicitly instructed by the user. The user’s newest explicit instruction overrides stale repo docs.

Current locked public launch offer:

- Complete Online Presence: $495/month
  - Google Business Profile support
  - Google Maps/local visibility basics
  - Local SEO/search visibility basics
    - Existing website alignment/refinement if access is provided
  - Business info consistency across Google/website/socials
  - Facebook support
  - Instagram support
  - Picture-based content support
  - Up to 3 total posts/updates per week, media dependent
  - Simple captions
  - Basic content organization
  - Media guidance/reminders
  - Client Portal access
  - Portal request response/review/answer within 24 hours
  - Weekly updates
  - Monthly online presence report
  - Veroxa team review before anything goes live

No public demo promotion. Public flow is Home -> Audit -> Login. Do not promote public demo routes, public Client Demo CTAs, or a public Services/Pricing split as the main sales flow. Starter, Growth, Premium, Local Presence, Full Presence, and old Complete Presence are historical/deprecated/internal aliases only and must not appear as active public offers.

Coming soon / not included at launch: Yelp, TikTok support, Reels/video content support, ads management, daily posting, automated publishing, and live integrations.

Not included: comments, DMs, inboxes, customer-service replies, refunds, complaints, order questions, full website redesign/development, custom website builds beyond the +$95 basic website add-on, hosting/domain/email troubleshooting, advanced technical SEO, paid ad spend, or guaranteed orders/revenue/rankings/profit.

Global launch rules:

- No contract.
- Cancel anytime.
- Ad spend is always separate and paid by the restaurant directly to the ad platform if future ads are approved.
- Posting depends on usable client-provided media and may slow when usable media is unavailable.
- Portal requests are the normal routine communication channel; Veroxa responds/reviews/answers within 24 hours, but this is not a completion promise.
- No routine text/call workflow for normal service requests.
- Veroxa does not invent discounts, BOGO offers, price cuts, lower prices, or new promotions. If a restaurant already has an offer/promotion, Veroxa may ask the client to confirm exact details before preparing public copy.
- No public/client-facing guarantee language for orders, profit, ROI, customers, revenue, rankings, walk-ins, or growth.
- Build Veroxa to about 90% complete in preview/manual/pre-live mode before paying for outside/live systems; future paid systems should plug into prepared interfaces.

## 5A. Profit Fit Layer

The Restaurant Opportunity Engine must include an internal-only Profit Fit Layer. Veroxa sells online presence publicly, but internally Veroxa must evaluate whether a restaurant can realistically create profitable online-influenced orders/actions through better online presence.

Internal break-even formula:

`requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30`

Default conservative assumptions: $15 average ticket, 5% net margin, 30 days/month. Online-influenced actions/orders include online orders, phone clicks that become orders, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions such as “I saw you online,” social content that drives ordering/visits, and repeat-customer attention driven by online presence.

Profit Fit language and exact break-even order math are team/internal only. Do not expose exact targets to public/client pages, and do not say Veroxa makes restaurants profitable.

## 5B. Profit validation and online-influenced action layer

Veroxa sells online presence publicly, but internally validates whether the work is becoming cost-justifiable through profitable online-influenced orders/actions. This is internal only and is not public/client-facing guarantee language.

- Starter internal 2-month proof standard: 20 online-influenced actions/day for right-fit restaurants.
- 2–3 months: service delivery plus cost justification through tracking setup, Google/Maps cleanup, best sellers, and order/contact paths.
- 6–9 months: profit progress should be visible through careful signal review, not service delivery volume alone.
- 12 months: online presence should be reviewed as a meaningful order channel when attribution confidence is strong enough.
- Tracking hierarchy: business outcome signals, conversion/action signals, attention signals, engagement signals, and execution signals.
- Attribution confidence must stay explicit: confirmed, strong signal, directional, owner reported, or unknown.
- Break-even progress and exact proof math are internal only and must not appear as public/client guarantees.

## 6. Routing rules

Do not merge demo and login flows.

- Demo Preview -> /demo/client/dashboard
- Portal Access -> /login
- Login -> /login
- Client login -> /client/dashboard
- Team login -> /team/dashboard
- /demo/client/dashboard remains the only public demo preview
- /demo/team/\* is deprecated/not active and must not be promoted
- /team/\* remains a real Team/Internal Admin review route guarded by InternalDemoGuard until production auth is explicitly requested
- /client/\* remains a real Client Portal review route until production auth is explicitly requested
- If a real portal section is incomplete, stay inside the real route and show “Still Building” rather than redirecting to demo

## 7. Core Veroxa OS flow

The target operating flow:

Veroxa audits -> Veroxa prepares exact action -> action enters Approval Queue -> Faraz approves / edits / skips / asks client -> Veroxa queues for later execution -> future connectors execute approved work -> client sees simple progress.

Do not build fake live execution. If connectors are not implemented, use calm language such as "Queue for later" or "Hold for later."

## 8. Google Maps / local search optimization is core

Google Maps optimization is not a side feature. It is a core restaurant customer-acquisition layer inside Veroxa.

Veroxa should help restaurants improve local search and Google Maps readiness through:

- Google Business Profile completeness
- accurate address, phone, category, hours, holiday hours, menu, ordering links, website links, and social links
- fresh food photos and videos
- Google updates/posts prepared for approval
- review reply drafts and review growth tasks
- local keyword and menu/catering visibility improvements
- profile freshness checks
- calls, directions, website clicks, and profile activity later when data is available

Current and future Google Maps work should feed the Approval Queue as prepared actions. Do not make live Google changes until explicit connector work is requested and approval gates are stable.

## 9. Client experience rules

Clients should not see:

- AI agent internals
- OpenAI
- Supabase
- RLS
- fixture
- backend
- connector
- API
- raw scoring
- internal risk/approval logic
- internal IDs
- execution internals

Use client-safe language:

- Prepared by Veroxa
- In review
- Veroxa team review
- Needs your input
- Visibility update
- Prepared action
- Included in report
- More content needed
- Nothing goes live without Veroxa team review

## 10. Team experience rules

Team can see operational detail, but the Team portal must stay calm and action-focused.

Use terms like:

- Suggested next step
- Prepared action
- Visibility issue
- Google Maps visibility
- Ready for review
- Needs confirmation
- Queue for later
- Hold for later

Avoid making the Team portal feel like an AI lab, backend console, or strategy overload screen.

## 11. Approval and safety rules

Internal analysis/audits can be automatic.

Public or customer-visible actions require Faraz approval.

Business-truth changes require client confirmation before approval/execution, including:

- hours
- holiday hours
- menu changes
- prices
- discounts
- offers
- catering availability
- halal/organic/health claims
- serious complaint responses

Never automatic:

- ad budget changes
- public sensitive claims
- deleting reviews/comments/content
- legal/health guarantees
- unverified religious/dietary claims
- aggressive complaint responses

## 12. Current built foundations

The repo currently includes foundations for:

- public website
- client/team portal foundations
- media submission/write adapter foundation
- read-only upload inbox with fixture fallback
- mobile-friendly Team review cards
- Daily Customer Opportunity Engine
- Approval-to-Execution Queue
- Visibility Audit Engine
- Google Maps / local visibility optimization foundation through visibility audit findings
- prepared actions feeding the Approval Queue
- client-safe helper foundations

## 13. High-risk changes requiring explicit permission

Do not add unless explicitly requested:

- production auth
- Supabase RLS changes/migrations
- storage uploads
- OpenAI runtime calls
- image generation/editing
- Google Business Profile APIs
- Meta/social publishing APIs
- website/CMS write integrations
- payments/checkout
- ads budget changes
- Owner/Operator dashboards

## 14. First-client goal

Build toward a semi-real first-client system before full automation.

Manual publishing is acceptable at first.
AI/automation should prepare work.
Faraz should be able to review from mobile or computer.
Restaurant partners should do the least possible work.

The priority is a working Restaurant Partner <-> Veroxa Team flow that helps restaurants become easier to find, easier to trust, easier to choose, and easier to return to.

## 15. First-5-client readiness benchmark

First 5 clients are the pre-launch readiness benchmark: healthy Starter, Starter with low media, Growth with strong media/cooperation, Growth with inconsistent uploads, and a client eligible for Premium assessment. Build client-side readiness first; heavy Team/Internal Admin AI automation comes later.

## 16. Full SaaS Foundation design control

For the next Full SaaS Foundation design and guardrail plan, see `artifacts/veroxa/docs/CLIENT_PORTAL_FULL_SAAS_FOUNDATION_DESIGN.md`. This reference does not mark production SaaS as built; production auth, migrations, storage uploads, live AI, connectors, and payments still require explicit RR-approved implementation work.

## 17. Client Portal Full SaaS Foundation Phase 1 scaffold

Phase 1 SaaS foundation scaffolding is present as TypeScript-only contracts and safety boundaries. `artifacts/veroxa/src/domain/saas/` contains `SaasDataMode`, account/user/restaurant models, repository contracts, placeholder repository and demo repository adapters, a `RepositoryBundle` selector, activity log scaffolding, and `ProfitValidationSnapshotRecord` hooks. This is not production SaaS runtime: production DB/auth/storage is still not connected, demo fixture leakage is guarded, and any future production adapter requires RR approval before implementation or wiring.

## 2026-06-03 — Client Portal Full SaaS Foundation Phase 2 account/data-flow buildout

- Built the deterministic account activation model for demo-only, prospect review, onboarding, client portal ready, team review ready, active manual service, paused, canceled, and archived states.
- Built normalized client portal page state and team portal repository state models so UI surfaces can read through repository/data-mode boundaries instead of mixing demo and real-route behavior.
- Expanded repository contracts and placeholder/demo adapters with client dashboard, media, request, update, report, team repository, activity preview, account activation summary, and profit validation snapshot methods.
- Updated client portal pages to show richer repository-driven demo states while keeping real guarded routes in premium, client-safe setup states.
- Updated team portal surfaces to show account/data-mode visibility, demo-vs-placeholder labels, activity log preview status, and internal profit validation snapshot previews.
- Integrated non-persisted activity log previews and internal-only profit validation snapshot previews without production writes.
- Production runtime is still not connected: no production auth enablement, database tables, migrations, RLS policies, storage uploads, payments, live AI, or publishing integrations were added.
- Next recommended phase: RR-approved production adapter design and test harness planning before any real auth/database/storage wiring.

## 2026-06-04 — Current Veroxa OS sync markers (superseded where noted by the 2026-07-12 protocol)

- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.
- Active stack is ChatGPT-managed GitHub + Codex + ChatGPT Sites; Vercel and Replit deployment paths are retired/historical.
- Active roles remain Client and Team. Owner/Operator are inactive and parked, including Super Admin, generic Admin, and Execution roles.
- Veroxa is AI-ready but not connected: deterministic drafts and approval gates can be built now; live AI stays blocked until a future approved activation.
- Veroxa is integration-ready but not connected: adapter contracts and UI states can be planned now; production auth, storage, Google/Meta/TikTok APIs, payments, webhooks, cron jobs, and automated publishing stay blocked.
- Restaurant Onboarding is a known OS gap and should first be built in preview/manual mode.
- Current PR philosophy: PR #59 style is the ideal normal major build size around 3,000 meaningful changes across 20-30 files; justified big builds may approach 5,000 meaningful additions/deletions; hotfixes stay surgical; no fake churn.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.
- `AUTH_MODE` remains `placeholder` until production auth is explicitly approved after the pre-paid activation gate.
