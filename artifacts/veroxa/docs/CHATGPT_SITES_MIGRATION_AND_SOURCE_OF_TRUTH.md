# ChatGPT Sites Migration and Source-of-Truth

Status: active migration and deployment authority as of 2026-08-08.

<!-- LIVE47_CANDIDATE48_AUTHORITY -->

## 2026-08-09 — exact live47 held; bounded candidate48 pending in PR #165 (current authority)

- **Canonical repository and database:** GitHub `main` is `39bf713705685636f0d20a2ca068c738d4f414b4` from merged PR #166. Production Supabase is the exact immutable live47 ledger through `20260808083842_post_20260808070840_private_media_authority_repair_v1.sql` (110,797 bytes, SHA-256 `3d2ba3a86024edef024a12ff9556c4e236baa57cbf2d4d478f9514321d69abee`) at tree `87c0ecd4272949d89e7512940f91f9d9e3c6e92154616377c78ef9e3d06bfc5e`. Preserve all applied bytes, including the stronger live47 Ready-authority bridge.
- **Live Sites and Edge remain separate observations:** Sites v39 is still independently observed at version ID `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8`, checkout `8749a7d442d3bb068ce626a9d297b8b227493446`, and archive SHA-256 `c5c471639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5`. Edge v6 remains ACTIVE with `verify_jwt=true`, prompt v1, and an unauthenticated 401 smoke; the prompt-v2 candidate is not deployed.
- **Production hold:** a fresh live47 catalog/runtime read confirms 49 scoped mutable public functions with zero effective anon, authenticated, or service-role mutation grants; one runtime row has `ai_live_calls=false`, `provider_writes=false`, `review_replies=false`, `website_writes=false`, and `external_scheduling=false`; relevant work, outbox, webhook, dispatch, wake, reserved-cost, and uncertain-cost counts are zero. Three bounded authenticated read-only RPCs remain. The existing tenant-scoped Client storage policy may create an unregistered orphan object, but the registered mutable-RPC hold prevents registration or downstream work. Team storage policy widening is not live.
- **Draft PR checkpoint:** PR #165 remains a draft on `agent/momo-private-assessment-ready-unified`. Its historical non-final opening head is `9176e50436db7328401a91d64b536948ed4ef915` with tree `01a79b952c6356b2cb1c54dc262541f1ad4fd198`; final-head workflows, review-thread closure, approval, and merge evidence remain pending. The current pre-apply candidate is 214 Sites files at `fd3b8a61c0eb5781ffd80d58f6e69925fc4996474d891d3fc2915e317e17d799` and 48 mirrored migrations at `1e6b179940063af767550e56f2df71a81bc445d8a6f4558585282a490790958c`.
- **Bounded forward candidate:** provisional `20260809024500_team_private_food_assessment_reconciliation_v1.sql` is root/Sites byte-identical, 59,052 bytes at SHA-256 `56c64c795ad12f1dfbe05894fd3e56a87f1d0e3376ff10edfd97760b8d2fbd5c`. It adds only the missing Team assessment-only intake marker/guards, JPEG/PNG boundary, v2 private-food evidence contract, and exact accounting gate while preserving live47 source tombstones and Ready authority.
- **Quality evidence:** current frozen SQL fixtures are preconnection `d6d870788c1211d8209048921232e9e8b1cffa16aae1ef9a4a9516b150434b5d`, owner controls `cffec226ff167d4bebaf0517661c35d85282be94729950a483f62b1a961fb027`, full OS `f20ac4e5927543277e520fbfd7104ded39fd11fa14995bf227fb64384dba5480`, and zero-cost `13e246455692d5005d688fcc68aea4805a7d64bc87c2604edf8db26599b06cbe`. Prior application evidence is 431/431, but the exact candidate48 clean-chain migration apply and full hosted pgTAP remain pending and must not be inferred from older runs.
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

## 2026-08-08 — phase 1 private assessment and owner-control boundary (historical)

- **General product boundary:** Veroxa phase 1 privately assesses arbitrary Client-supplied media across food, drink, dining-scene, non-food, and unclear content. It is a general restaurant product capability; Momo's House is the founding pilot only, not the product ontology or an inference target.
- **Assessment truth:** analysis is pixel-only and private. It produces controlled, neutral visual tags with explicit uncertainty; it must not turn pixels, filenames, tenant context, or prior Momo history into claims about an exact dish, ingredients, a menu, a business, ownership, a restaurant, or Momo.
- **Owner and Team authority:** a current real-owner Client directly confirms or corrects current truth, with immutable evidence of that exact decision. Team can see the Client-requested assessment, status, and result, but cannot manufacture owner truth or an offering association. The development proxy may assess privately, but it cannot advance content or reach Ready without current real-owner rights and an exact current-offering association for the same restaurant and source bytes.
- **Ready and disposition:** Ready remains an internal, unapproved, unscheduled, unposted, unpublished evidence package. Team approval binds only the exact output recorded for review. A terminal discard binds `(restaurant_id, source_content_sha256)` across exact-byte duplicates, is enforced before new content/Ready progress, and preserves immutable evidence rather than deleting or rewriting history. `external_write_allowed=false`; publishing and all other external writes remain false.
- **Production database:** production is live45 through `20260808064300_owner_truth_and_ready_disposition_v1.sql` (SHA-256 `bd22855b54cfc9e1aa1713c66dae1f3fc674c43e0040dd128be40e4c354896d2`) and `20260808064335_private_media_assessment_and_association_v1.sql` (SHA-256 `27ae63ccb334c7dbdf25d247c7f27ebc13ff9ea3e5391f590e93f90dcc4225c7`). These are observed applied bytes, not permission to rewrite migration history.
- **Live Edge evidence:** `momo-content-ai-lifecycle` id `859c73c3-2102-41b4-9da1-20582acb7212` is version 6, `ACTIVE`, with `verify_jwt=true`; bundle/ezbr SHA-256 is `acf46f086b3ab07c914d71b5ae79dca011abab84016d4c9c58ff1c9b30eb58ce`. Uploaded `supabase/functions/momo-content-ai-lifecycle/index.ts` is exactly `867d85fe555a5f7d9d48d62698f4b1fb95d4e0769fc299020953cf5054d8720d`, and `supabase/functions/_shared/momo-content-ai-lifecycle-contract.ts` is exactly `c26af8d5aa76adf42de79538a72e3c1a3794a68cf6442fdfb5f0e45bad289a10`. An unauthenticated POST failed closed with HTTP 401 JSON; the matching v6 log contains one 401 and no 5xx/exception. No authenticated bridge or provider call was performed.
- **App and Sites release separation:** the candidate app gate is clean at 422/422 tests plus build, typecheck, and audit. Its GitHub pull request and new Sites version/deployment are still pending. The live website remains Sites v39 baseline `appgprj_6a53d07c7c28819182801cf35dfd30de~appgver_388c5f82ec48819186bfd315a0d55ab8`, internal Sites/AppGen source commit `8749a7d442d3bb068ce626a9d297b8b227493446` (not a GitHub commit), 54-file archive SHA-256 `c5c471639303ac4488fbf1258a6e1736452eafbd43a9370473e02f6072eca7f5`, environment revision 10, active domains/SSL, and zero recent errors.
- **Proof boundary:** the planned 2026-08-09 real upload has not yet been observed. Database and Edge deployment evidence plus local app gates do not prove the pending Sites candidate, an authenticated assessment/provider run, owner confirmation, association, Ready package, approval, schedule, post, publication, or any external write.

## Database repair verified; corrected Sites v38 pending — historical checkpoint, superseded by phase 1

_Historical record only: this was the then-current v37/live43/v38 checkpoint. The historical phase-1 record above superseded it at that time; neither section is current release authority._

Sites v37 is live from checkout `61e9ace7723ef56f42111f320327187596406944`: 200 canonical files at `929e05cf68a6af5176811f49321ec108e617b93a08153b65b3f86b109d0c8c18`. Production Supabase has 43 applied migrations at exact remote-ledger tree `8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c`, through `20260808041629_repair_momo_client_v3_displayed_asset_scope.sql` (7,293 bytes; SHA-256 `6cbf3f80d028d3fe54093b14bae59314913b4f0bfacfbf31fce4aa2a24e429ba`). PR #162 is already merged as canonical GitHub `main` and corrective-candidate base `ca47aeff7ab44a69b6ce039608ae27fea6c3c326`; this is repository lineage, not evidence of a Sites publish or database apply.

The database applied `20260808001430_momo_client_pipeline_readback_v3.sql` before PR #161 merged different source bytes. Applied history is immutable: `01430` must remain exactly `987186e74590c6e484ebfee47e1c7ed384e2b4dc8c4a97ad7243ae38feb765cc`. The corrective branch is `agent/momo-client-v3-forward-scope-repair`; it preserves those bytes and carries the displayed-asset change only in applied forward migration `041629`. Production verification passed the corrected displayed-asset predicate, independent run-rights scope check, SECURITY DEFINER with empty search path, authenticated-only ACL, valid actor path, random cross-tenant denial, and `external_write_allowed=false`.

The exact corrective candidate contains 201 Sites files at `4edae9660343cda362968bd08e544ba5a154c90a902ac961365ceb32ea820292` and 43 mirrored migrations at `8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c`. Its migration tree exactly matches the live 43-row ledger: highest version `041629`, exactly one repair row, and zero `20260808034550` duplicate-audit rows. PR #163 is open but not merged; exact-final-head workflows and review-thread evidence remain unrecorded. Local review passed, and corrected Sites v38 is unpublished. Production authority is granted, but automatic deployment remains disabled: pass the hosted gates, then publish and verify Sites v38.

Completed steps are `01210`, immutable `01430`, Sites v37, `01842`, `01853`, `02609`, and verified `041629`. No database migration remains pending; corrected Sites v38 publish/verify is the sole pending release action. Applied `02609` remains non-comprehensive because live `postgres` is not a `supabase_admin` member and the role was skipped. The private policy evaluation remains local synthetic evidence; no provider connection, external publishing authority, owner authority, or Momo activation is established.

## Sites v36 verified GitHub-parity override

Sites v36 is live from checkout `b8122642b72e5d4e6e74c379469f2a157781ab3d`. After excluding the tracked-but-generated `.vinext` cache, the historical live checkout and repository mirror contain the same 185 canonical files at tree SHA-256 `caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7`. The historical 37-file repository/Sites-mirror migration tree is `9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90`; use the current authority above for the exact remote-ledger name and fingerprint.

PR #157 passed CI, Sites Verify, Supabase Verify, and Veroxa Verify at reviewed head `d3a63d25644fc699d1f521f8f803e5bd95daae49`, had zero unresolved review threads, and merged to GitHub `main` at `aafebf93a6bc40f9578c29f4a25371f8203d0387`. All four push-to-main workflows then passed. That is historical v36 GitHub/source/repository-mirror evidence; it does not prove this local candidate or the later exact remote-ledger reconstruction.

PR #157 performed no Sites publish and no database apply; it reconciled source already live before the PR. PR #155 / Sites v22 remains immutable historical parity evidence. This evidence-only closeout also requires no Sites deployment or database apply, and its CI attestation binds only the closeout checkout—not the earlier merge or a production action.

Machine evidence scopes commit `aafebf93a6bc40f9578c29f4a25371f8203d0387` as `v36_operational_parity_commit_not_closeout_pr_head`: it is the reviewed v36 reconciliation merge, not a prediction of this evidence-only closeout PR's eventual head or merge commit. The closeout must not record that future SHA or create a recursive third PR.

V36 contains only the internal Momo upload-to-unscheduled-Veroxa-Ready workflow. It preserves immutable lineage and current rights, consolidates exact duplicates, keeps near-duplicate merging advisory, and sends real blockers to one Team exception. Bad media is not automatically edited or resized. No external provider, posting, scheduling, publishing, reply, website write, test upload, or activation is authorized by reconciliation.

## 2026-08-05 — permanent retired-source cleanup override

Verified Sites v36/GitHub/Supabase parity and Faraz's explicit instruction satisfy the documented cleanup gate. The retired Vite/Replit runtime, archive copy, configuration, and runtime-only checks are permanently absent from the current tree; reviewed duplicate remote branches are deletion-authorized. `artifacts/veroxa-sites` remains the sole deployable application source, GitHub `main` remains canonical, and immutable commit history preserves audit lineage without keeping a duplicate runnable application.

This cleanup is not a Sites deployment or database change and grants no activation, publishing, provider, or spend authority. The root Vercel shutdown sentinel remains until external Vercel Git disconnection is independently verified.

## Verified PR #149 cleanup and Sites v15 deployment override

PR #149 passed all four required workflows with zero unresolved review threads at reviewed head `0d2c6e47fbfe1c44a2f0ff19fbb158001ed9365a` and merged to GitHub `main` at `9749b68ce2cfc383deeae6aa63c413019ef61385`.

Sites version 15 succeeded from checkout `e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0`. The deployed source contains 55 canonical files at tree SHA-256 `ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f`; public access and `veroxasystems.com` plus `www.veroxasystems.com` were verified with active provider and SSL status. Production Supabase remains at 13 applied migrations, with exact canonical filename and SQL-content parity. Applied migration 12 is `20260714022859_reconcile_audit_v3_and_function_search_paths.sql`, SHA-256 `192505ca4631e55f35b28f0c849a7d380bc1a709e5ae89adca742d7d349da45e`; migration 13 is `20260714022911_ai_budget_and_momo_manual_pilot_contract.sql`, SHA-256 `ebc2ea499a24b79da1baaffa02423488b1a28a95cb75d4c0d5c002c7c585948d`. PR #149 required no database apply.

Machine state is `verified_reconciliation_cleanup_deployed`, release state is `post_release_cleanup_deployed`, and delivery remains reviewed/manual. The evidence-only closeout PR changes no file under `artifacts/veroxa-sites`, so it does not require a Sites version 16 checkpoint. Runtime AI, credentials, Momo/client contact, Client provisioning, owner confirmation, media rights, external providers, publishing, billing, activation, and incremental spend remain disabled. Branch deletion remains unavailable. Preserve the exact inert Vercel shutdown sentinel because the external Vercel Git integration is not verified disconnected.

## Production-reconciliation override (historical pre-PR #148 checkpoint)

GitHub `main` remains canonical at `674e1a7c0d140c9b281029277baeb2e68962dac2`, while production is ahead: live Sites version 13 is checkout `dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805`, and Supabase has 11 applied migrations. The latest exact source is `20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql`, SHA-256 `304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2`. This is drift, not verified parity.

The production-reconciliation worktree is an unmerged, undeployed candidate. `VEROXA_DEPLOYMENT_MANIFEST.json` records the observed baseline, deterministic candidate source and migration trees, fail-closed activation state, and deferred cleanup gates. CI must verify the manifest and generate an attestation from the exact `GITHUB_SHA`; committed source must not predict a merge SHA or future Sites version.

Freeze product deployment except the exact reviewed reconciliation release after the four required workflows are green and GitHub reports no unresolved review threads. Keep runtime AI, credentials, Momo/client contact, activation, providers, publishing, billing, and new spend disabled. After merge, synchronize Sites from that exact merge and independently verify Audit V3 persistence, authentication, both domains, SSL, migration/source hashes, and rollback evidence before declaring parity.

The Vercel shutdown sentinel remains mandatory until the external Git integration is independently confirmed disconnected. Removal is a separate post-release cleanup action, as are branch pruning and legacy Vite removal; all require parity, rollback evidence, ownership review, and explicit approval.

## Historical production-foundation checkpoint

The original migration scope below remains useful history, but its statements that production identity, persistence, and protected portal routes are future work are superseded for source truth by `VEROXA_CURRENT_MILESTONE.md`. PR #143 was reviewed at head `009276dbbf2639dc1eb5296bf62906f9f8ac45f1` and merged at operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8`. Its nine-migration data layer is applied and verified, and Sites version 9 deployed successfully from checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c`; both custom domains are active with healthy SSL. That deployed foundation implements Supabase-backed secure-email-link recovery and approved-user password sessions, active Momo membership checks, forced RLS, durable audit intake, protected Client/Team routes, and the seven no-new-spend Momo operating steps.

The seven-system Momo foundation is deployed, but Momo is not 100% ready. Faraz's approved Gmail Team identity is confirmed, has signed in, has active Team/Momo access, passed the authenticated Safari protected-route smoke, and confirmed password sign-in works. The protected password-replacement surface is deployed, while hosted reauthentication and old-session revocation remain unverified. No Momo owner identity or owner-confirmed data is provisioned. Runtime AI, Meta, Google Business Profile, external SEO/social execution, publishing, visibility monitoring, Momo contact, and client activation are **inactive pending authorized access**. See `MOMO_100_READINESS_SEVEN_SYSTEM_CONTRACT.md` for the source/runtime/activation split.

PR #144 is the behavior-neutral repository-and-Sites-evidence continuity release for the verified PR #143 foundation. Its database-source delta is limited to reconciling the ninth migration filename/ledger to remote version `20260713191147_momo_zero_cost_operating_rehearsal_v1.sql`; SQL, schema, content, and migration count remain unchanged at SHA-256 `07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a`. It changes no operational behavior, connection, or activation authority. Because it changes Sites-bundled readiness evidence, the exact merged PR #144 state must receive a verified Sites version 10 checkpoint after merge. Sites version 10 is not already deployed, and committed source must never embed or predict PR #144's merge SHA; external GitHub PR metadata and Sites checkpoint metadata are the future source/deployment authorities.

## Locked direction

Veroxa now uses the ChatGPT Sites application/deployment surface. This is not a separate demo project and must not become a second product definition.

- GitHub `main` remains the canonical source of truth for Veroxa product behavior, route contracts, operating memory, guardrails, and build direction.
- ChatGPT is Faraz's primary planning, orchestration, GitHub, review, and deployment interface.
- Codex is the engineering capability ChatGPT invokes internally.
- ChatGPT Sites is the primary application and deployment surface.
- Vercel is retired. Sites is the sole deployment surface; GitHub `main` plus verified Sites checkpoints are the recovery path.
- The root `vercel.json` is a temporary, inert shutdown sentinel whose only allowed behavior is `git.deploymentEnabled: false`; it prevents the still-connected legacy Git integration from starting builds and must never contain runtime, route, build, or hosting configuration. Remove it only after the Vercel dashboard integration is independently confirmed disconnected and the post-release cleanup gate is explicitly approved.
- `veroxasystems.com` and `www.veroxasystems.com` are attached to Sites and were verified with the successful Sites version 15 deployment on 2026-07-14.
- The approved Sites visual direction is the presentation layer. It must preserve the existing Veroxa OS rather than replace it.
- `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md` controls the build, green-merge, hold, RR, and deployment command meanings.
- GitHub's merged PR metadata and the independent Sites checkpoint identify the reviewed source and deployment lineage. Evidence-only closeout changes that do not touch `artifacts/veroxa-sites` require no additional Sites deployment.

## ChatGPT-managed build, merge, and deployment workflow

Faraz and ChatGPT decide the next product outcome together. After Faraz authorizes the work, ChatGPT handles the normal Codex, GitHub, CI, RR, and Sites operations inside the connected workflow without requiring Faraz to copy a prompt into another product.

- `Build it` means implement the agreed scope, test it, create/update the pull request, repair CI and RR findings, and merge the exact reviewed head only after the green gate passes. It does not deploy Sites unless deployment was explicitly requested.
- `Build it, but hold for review` performs the same work through a verified green pull request, then stops without merge or deployment.
- `Build and deploy it` performs the green merge, synchronizes the exact merged GitHub state to Sites, runs Sites verification, creates a checkpoint deployment, and verifies live access plus custom-domain health.
- `RR` performs deep review and reasonable safe fixes but does not independently authorize merge, deployment, activation, or material scope expansion.

Green requires correct scope, applicable local checks, required GitHub checks, Sites checks when that layer changes, mergeability, an unchanged reviewed head commit, no unresolved actionable review thread or known critical/high-severity defect, and intact Veroxa safety and product guardrails. Re-check immediately before merge.

Pause for specific Faraz direction when scope materially expands into production auth/credentials, real customer data or privacy, destructive data or production migrations, billing/payments, external integrations or publishing, owner/client contact, business-truth or public-promise changes, DNS/domain-record changes, Momo activation/walkthrough, or a material product-direction change.

## Product surfaces that must survive the migration

1. Public flow: Home -> Audit -> Login.
2. Restaurant Partner / Client Portal.
3. Team Faraz / Internal Portal.
4. Momo Workspace grouped routes:
   - `/team/momo`
   - `/team/momo/work`
   - `/team/momo/intelligence`
   - `/team/momo/content-ai`
   - `/team/momo/reports`
   - `/team/momo/readiness`
5. Client onboarding, media, requests/messages, updates, reports, connections, and profile/business-truth review.
6. Approval gates, reporting honesty, restaurant matching safety, client-safe language, and the post-PR120 operating lock.

## Non-negotiable safety boundaries

The hosting migration did not by itself authorize any of the following. Later scoped releases explicitly activated Team Auth plus Momo/Audit persistence only:

- public account creation or an unapproved identity;
- Momo Client credential creation;
- contacting Momo's House;
- external platform connections;
- Google, Meta, ordering, or publishing actions;
- runtime AI provider calls;
- database or storage writes outside the approved Momo/Audit scope;
- fake metrics, fake activity, fake reports, fake readiness, or fake integrations;
- public/client exposure of Team-only data;
- changing verified business truth without confirmation.

Deployed Sites version 15 retains approved-user password authentication plus secure-email-link Supabase authentication for recovery, with active profile/membership enforcement, protected password replacement, and the no-new-spend Momo operating foundation. Public signup remains disabled. Faraz confirmed password sign-in; hosted reauthentication and old-session revocation remain unverified. The undeployed Vite `AUTH_MODE = placeholder` path is historical/internal and its root `/api/pilot-access` deployment adapter is retired. Roles remain `client` and `team` only. Momo owner walkthrough and pilot activation remain blocked without explicit Faraz approval.

## Delivery architecture

Veroxa has two layers with one source of truth:

- **Canonical product layer:** the existing GitHub Veroxa application, domain models, route contracts, docs, tests, and guardrails.
- **Sites delivery layer:** a Sites-compatible application shell that adopts the approved visual system and progressively reaches canonical route and behavior parity.

New product rules must be added to the canonical GitHub layer first or in the same PR as the Sites implementation. The Sites layer must not invent independent pricing, roles, restaurant facts, integrations, or operating logic.

## Custom-domain state and stabilization gate

Faraz approved public Sites access and completed the Namecheap DNS changes. As last verified with Sites version 15 on 2026-07-14:

- the Sites project access mode is public;
- `veroxasystems.com` is active with active SSL and no reported domain error;
- `www.veroxasystems.com` is active with active SSL and no reported domain error;
- routine future Sites deployments use these existing domains and do not require new Namecheap records;
- Vercel is not a rollback path. No Vercel serverless handler, runtime, build, route, or hosting configuration belongs in the active repository; the exact no-deployment shutdown sentinel described above is the sole temporary exception.

Continue to protect the domain after cutover:

- keep public Home, Audit, and Login routes verified;
- keep Client and Team route boundaries honest;
- keep Team and Client pages protected by server-verified Supabase sessions, active profile/membership checks, and RLS; Team access is active for Faraz, while no Momo Client identity is provisioned;
- keep desktop/mobile navigation, production build, rendered-route tests, lint, and Sites artifact validation green;
- keep every deployed product change synchronized with GitHub `main`;
- never expose production credentials, real client data, Team-sensitive data, or a custom-domain preview credential fallback;
- verify the live deployment, public access, both custom domains, SSL, and rollback state after each authorized production checkpoint.

## RR meaning after this migration

When Faraz asks for `RR`, perform a deep GitHub review beginning with:

1. `AGENTS.md`.
2. `ACTIVE_DOCS_INDEX.md`.
3. `VEROXA_LOCKED_OPERATING_MEMORY.md`.
4. This migration document.
5. `CURRENT_BUILD_STATUS.md`.
6. Current GitHub PR, CI, route, security, and guardrail state.
7. Current ChatGPT Sites parity, deployment, domain, and access state.

RR must identify and fix reasonable direction drift, doc drift, route drift, guardrail gaps, security issues, TypeScript/schema issues, CI failures, and Sites integration gaps. RR must not silently activate external systems or broaden real-world authority.

## Recommended migration sequence

1. Establish the real public, Client, and Team route skeleton in Sites using the approved visual system.
2. Add a route-parity contract and automated guardrail shared by GitHub memory/docs.
3. Port client onboarding, media, requests/messages, reports, connections, and profile behavior without fixture leakage.
4. Port the grouped Momo Workspace and safe internal action links.
5. Decide the Sites identity and persistence architecture in a separate approved PR.
6. Add real data adapters behind existing interfaces; do not rewrite product logic inside pages.
7. Complete security, mobile, accessibility, and browser verification.
8. Keep public access, both attached custom domains, DNS/SSL, GitHub/Sites parity, and the temporary rollback path verified through stabilization.

## Innovation priorities

- Create a shared route-and-capability manifest so navigation, guards, docs, and RR checks derive from the same contract.
- Separate restaurant business truth from presentation components so confirmed facts can move safely across Client, Team, reports, and future integrations.
- Build an evidence ledger for every client-visible report statement: source, review state, attribution confidence, and release approval.
- Treat the Approval Queue as the operating spine connecting audit findings, business truth, media, content, reports, and future execution.
- Build adapters for Sites identity, D1/R2 or an approved external persistence provider only after the product contracts and migration gates are stable.
