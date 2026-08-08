# Veroxa Current-State Doc Index

Status: Short index for Faraz, Codex, and future ChatGPT/Codex sessions.

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

- Start with `VEROXA_DEPLOYMENT_MANIFEST.json` and `RR_RELEASE_CHECKPOINT.json`. Sites v37 is live from `61e9ace7723ef56f42111f320327187596406944` (200 files / `929e05cf68a6af5176811f49321ec108e617b93a08153b65b3f86b109d0c8c18`); live Supabase is 43 migrations / `8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c` through `041629`. PR #162 is already merged as canonical `main` and candidate base `ca47aeff7ab44a69b6ce039608ae27fea6c3c326`; this repository advance does not change production.
- Applied `01430` is immutable at `987186e74590c6e484ebfee47e1c7ed384e2b4dc8c4a97ad7243ae38feb765cc`. The corrective branch `agent/momo-client-v3-forward-scope-repair` preserves it and mirrors applied repair `20260808041629_repair_momo_client_v3_displayed_asset_scope.sql` at `6cbf3f80d028d3fe54093b14bae59314913b4f0bfacfbf31fce4aa2a24e429ba`.
- The corrective candidate is 201 Sites files / `4edae9660343cda362968bd08e544ba5a154c90a902ac961365ceb32ea820292` and 43 mirrored migrations / `8a49f00ab3bd6d9623100fec238939b6cb81f17d67d0e2d3a4426559c137e41c`. Its migration tree matches live43. PR #163 is open but not merged; exact-final-head workflows and review-thread evidence remain unrecorded. Local review passed, and corrected Sites v38 is not live.
- Completed: `01210`, immutable `01430`, Sites v37, `01842`, `01853`, `02609`, and verified `041629`. Production authority is granted but automation remains disabled: pass exact gates, then publish/verify Sites v38. No database migration remains pending.
- Applied `02609` still skipped `supabase_admin`; it is not comprehensive ACL closure. Private policy-eval evidence remains local-only, and no provider, external publishing authority, or Momo activation is enabled.

## 2026-08-05 — retired source permanently removed

- Start with `RETIRED_SOURCE_REMOVAL.md` for the cleanup boundary.
- The old Vite/Replit application and its obsolete checks are no longer present in the current tree. `artifacts/veroxa-sites` is the sole deployable app; GitHub `main`, Sites checkpoints, Supabase source, and active operating docs remain authoritative.
- Reviewed duplicate branches are deletion-authorized, with protected `main` as the final branch set after the cleanup PR merges.
- No runtime deployment, data migration, external action, Momo activation, or spend is included. The Vercel sentinel remains inert until its external Git integration is verified disconnected.

## 2026-08-02 — Sites v36 live; GitHub parity verified

- Start with `MOMO_UPLOAD_V36_LIVE_CLOSEOUT.json`, `VEROXA_CURRENT_MILESTONE.md`, `VEROXA_DEPLOYMENT_MANIFEST.json`, and `RR_RELEASE_CHECKPOINT.json`.
- Sites v36 checkout `b8122642b72e5d4e6e74c379469f2a157781ab3d` is live; its canonical 185-file hash is `caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7`. Its historical repository/Sites-mirror migration tree is `9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90`; use the current section above for exact remote-ledger evidence.
- PR #157 reviewed head `d3a63d25644fc699d1f521f8f803e5bd95daae49` merged to GitHub `main` at `aafebf93a6bc40f9578c29f4a25371f8203d0387` after four green workflows and zero unresolved review threads; all four push workflows also passed. Main now matches live v36.
- PR #157 was evidence-backed source reconciliation, not a Sites deployment or database apply. PR #155 / Sites v22 remains historical parity evidence.
- V36 provides exact-byte deduplication, immutable lineage, automated internal content packaging, unscheduled Ready evidence, and exception-only Team work. Bad media is diagnosed and preserved, not auto-edited or resized; near duplicates remain advisory.
- No real v36 upload, provider call, or Ready package exists. External scheduling, posting, publishing, connections, replies, website writes, and activation remain locked.

## 2026-07-30 — v22 signed lifecycle bridge live

- Start with `MOMO_MEDIA_V22_LIVE_CLOSEOUT.json`, `VEROXA_CURRENT_MILESTONE.md`, `VEROXA_DEPLOYMENT_MANIFEST.json`, and `RR_RELEASE_CHECKPOINT.json`. The bundled readiness tracker is the immutable v22 pre-deploy snapshot for No-Go/rights/spend evidence, not current bridge-deployment authority.
- PR #155 merged at `d1f6a9a78ac54cd5447689d5f8b3d42466daf479`; Sites v22 is live from checkout `83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e`; the exact 93-file source hash is `8bc4ef94c0f670ff128774e26a9de3d9849269f74b6e5c5af05f07ee0c9e5490`.
- The JWT-protected signed lifecycle bridge, masked signing key, OpenAI key, and runtime flag are deployed. Migration 16 is unchanged; missing-JWT and unauthenticated status probes fail closed; custom domains and SSL are active.
- Authenticated Team preflight and the real Team/Client rehearsal remain pending. The current upload rights are expired; candidates, provider calls, and incurred spend remain zero.
- USD $20 remains the automatic threshold per job. AI output stays private; Google/social, public publishing, owner-controlled providers, and activation remain locked. Momo remains No-Go.

## 2026-07-30 — v21 live; lifecycle bridge remains a candidate (historical pre-v22 checkpoint)

- Start with `VEROXA_CURRENT_MILESTONE.md`, `VEROXA_DEPLOYMENT_MANIFEST.json`, `RR_RELEASE_CHECKPOINT.json`, and `artifacts/veroxa-sites/app/momo-readiness-tracker.json`.
- PR #154 is merged at `72c7fd73d3d2dff40ddd91bca2ef01d1ca8cb695`; Sites version 21 is live from `8c50dd6726629e77d22f07eb6aac9f6982001902`; migration 16 is applied and verified.
- The OpenAI key, database capability, and hosted flag exist, but effective Media AI is safely blocked until the no-database-change signed lifecycle bridge and matching Sites source pass review and production auth checks.
- No provider canary or real edit has passed. The current upload rights are expired; incurred spend is USD $0; USD $20 is the automatic threshold per job and larger jobs require fresh authorization.
- Momo remains No-Go. AI output stays private; Google/social, public publishing, owner-controlled providers, and activation remain locked.

## 2026-07-30 — high-quality Media AI candidate; v20 remains live (historical pre-v21 checkpoint)

- For candidate truth, start with `VEROXA_CURRENT_MILESTONE.md`, `VEROXA_DEPLOYMENT_MANIFEST.json`, `RR_RELEASE_CHECKPOINT.json`, and `artifacts/veroxa-sites/app/momo-readiness-tracker.json`.
- At that historical checkpoint, `MOMO_MEDIA_V20_LIVE_CLOSEOUT.json` was authoritative: PR #152, Sites version 20, and 15 applied migrations were live.
- The Media AI candidate is based on `979ced364e9b94f42a5e9aece7e1aa9cfc8fa1c6`, unmerged/unpublished/unapplied, and limited to high-fidelity standing Image Enhancement automation. The key is provisioned, the live flag is off, and spend is USD $0. USD $20 is the automatic authorization threshold for each job—not a lifetime budget—and a job expected above it requires fresh Faraz authorization before provider use.
- The current upload rights are expired. No real request is eligible until rights are current and Team review is approved. Momo remains No-Go; Google/social, external publishing, and owner-controlled provider access remain locked.

## 2026-07-22 — PR #152 / Sites v20 state (historical)

- `MOMO_MEDIA_V20_LIVE_CLOSEOUT.json` preserves the exact historical v20 state; use the v22 closeout and current governing docs for production truth.
- PR #152 passed all four exact-head workflows and merged at `29e90d40fa05d67d2a6246f9a0ba64fe1b9099b7`.
- Sites version 20 is live from checkout `aceb17bb446854d48a71e54ba814591cf2c19d33`; `veroxasystems.com` and `www.veroxasystems.com` plus SSL/provider are active, with zero Worker errors in the initial 15-minute check. No database change was required.
- Supabase has 15 applied migrations; migration 15's live RLS, grants, Client RPC, privileged-function, and storage-policy checks passed.
- At that historical checkpoint, iCloud Client and Gmail Team were ready. One upload and one then-current rights record existed; approved review and Ready rendition counts remained zero.
- Google/social, providers, live AI, and external writes remain locked. Nothing was published; spend is USD $0 of USD $20; Momo remains No-Go.

## 2026-07-14 — verified PR #149 / Sites v15 state (historical)

- Start with `VEROXA_CURRENT_MILESTONE.md`, `ACTIVE_DOCS_INDEX.md`, `VEROXA_LOCKED_OPERATING_MEMORY.md`, and the machine release records.
- PR #149 passed all four required workflows with zero unresolved review threads at reviewed head `0d2c6e47fbfe1c44a2f0ff19fbb158001ed9365a` and merged at `9749b68ce2cfc383deeae6aa63c413019ef61385`.
- Sites version 15 succeeded from checkout `e4f72a7c0a3a5744508cf4ef8cf0a191aec817c0`; its verified 55-file source tree SHA-256 is `ba06cd39ab7782987a6504678e4a3533a9943d078ba5dd9f93dbe8eeb0c5178f`. Public access and both custom domains were verified.
- Supabase remains at 13 applied migrations with exact filename/content parity; PR #149 required no database apply. Current state is `verified_reconciliation_cleanup_deployed` / `post_release_cleanup_deployed`.
- The evidence-only closeout PR changes no Sites source, so it requires no Sites version 16. Legacy Vite remains archived from active development paths.
- Runtime AI, Momo/client contact and provisioning, owner truth, media rights, providers, publishing, billing, activation, and new spend remain disabled. Momo remains No-Go.
- Branch deletion is unavailable. Retain the exact Vercel shutdown sentinel because external Git disconnection remains unverified.
- The next section is the historical pre-PR #148 checkpoint.

## 2026-07-14 — current production-reconciliation state (historical pre-PR #148 checkpoint)

- Start with `VEROXA_CURRENT_MILESTONE.md`, `MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md`, `ACTIVE_DOCS_INDEX.md`, and `VEROXA_LOCKED_OPERATING_MEMORY.md`.
- Read `VEROXA_DEPLOYMENT_MANIFEST.json` for the machine-readable release state. It records the freeze, disabled activation surfaces, observed baseline, deterministic source/migration trees, and deferred cleanup gates; the CI attestation supplies the exact reviewed `GITHUB_SHA`.
- GitHub `main` is canonical at `674e1a7c0d140c9b281029277baeb2e68962dac2`. Live Sites version 13 is checkout `dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805`, and production Supabase has 11 applied migrations, so production is currently ahead of GitHub.
- The reconciliation candidate is unmerged and undeployed. It predicts neither a merge SHA nor a Sites version.
- Deployment is frozen except for the exact reviewed reconciliation release after all four workflows pass and review threads are resolved. Runtime AI, Momo/client contact, activation, external providers, publishing, billing, and new spend remain disabled.
- Momo is the agreed free founding pilot. The secure persistent manual operating loop and evidence-based onboarding gate—not maximum automation—govern readiness.
- Preserve the Vercel shutdown sentinel and defer branch deletion/legacy Vite removal until the documented post-release safety gates pass.

## 2026-07-13 — PR #145, Supabase 10, and Sites v11 verified production state (historical)

- Verified source: PR #145 passed review at exact head b007de99eb6c927f6d7ede56d7d4fffe8cbc0f0d and is merged to GitHub main at 9aa74631e393bc0303c820cc7671f818d617778c.
- Verified data: Supabase has all 10 production migrations applied and verified. Restaurant Audit V2 is remote migration version 20260713212046 with SQL SHA-256 f4bfff7ac94ade68a2c4f761c5627dbcfe82d5800a0a8a46ce42b13e5b930693.
- Verified hosting: Sites version 11 succeeded in production from checkout source 4bef697e230791403211cb9c60f769ebcb4f39c7. Both custom domains are active with healthy SSL.
- Live product state: Restaurant Audit Center V2 and the simplified Momo Team information architecture are live. Audit V2 provides the deterministic score out of 100, room-for-improvement findings, 30/60/90-day plan, and save-or-discard preview flow. Team remains organized under the Momo's House San Antonio folder with a Momo-only Work Board and focused content/approval views.
- Conversion boundary: a reviewed audit may create only a pending, non-operational restaurant profile after exact explicit consent. It never auto-creates a client identity, membership, active workspace, onboarding activation, publishing authority, paid service, or charge.
- Operating boundary: Momo's House San Antonio remains the only operational restaurant and remains blocked until its owner-confirmed truth, permissioned media, provider authority, and remaining readiness evidence are complete. No runtime or paid AI, Meta/Google connection, external SEO/social execution, publishing, outbound contact, owner/client contact, or activation was authorized by this release.
- Supersession: older current-looking PR #143, PR #144-pending, Sites version 9/10, nine-migration, unshipped-candidate, or Audit V1 wording below is historical and superseded by this verified section.

Use `ACTIVE_DOCS_INDEX.md` first as the highest-level current source-of-truth index, then these documents as the current operating model before relying on older historical notes:

- `ACTIVE_DOCS_INDEX.md`
- `VEROXA_CURRENT_MILESTONE.md`
- `MOMO_FOUNDING_PILOT_COMMITMENT_AND_ONBOARDING_GATE.md`
- `VEROXA_DEPLOYMENT_MANIFEST.json`
- `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md`
- `CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md`
- `VEROXA_LOCKED_OPERATING_MEMORY.md`
- `CURRENT_BUILD_STATUS.md`
- `RR_CHECKPOINT.md`
- `RR_RELEASE_CHECKPOINT.json`
- `PRICING_SOURCE_OF_TRUTH.md`
- `PRE_BUILD_STABILITY_CHECKLIST.md`

Older strategy maps, pre-paid activation notes, manual execution plans, Vite-auth notes, and pre-live build maps are historical planning references only. They are not current deployment, authentication, rollback, or build-order authorities.

Current strategy markers:

- Primary founder interface: **ChatGPT**. Faraz and ChatGPT decide the next outcome; ChatGPT invokes Codex, GitHub, CI, RR, and Sites tools internally.
- Active stack: **ChatGPT-managed GitHub + Codex + ChatGPT Sites**. **Vercel is retired** and is not a deployment or rollback path.
- **GitHub `main` is canonical**; GitHub merge and Sites deployment are separate actions.
- `Build it` means build/test/PR/CI/RR and green merge; `Build it, but hold for review` stops at the green PR; `Build and deploy it` also syncs the exact merged source to Sites, checkpoints, deploys, and verifies the live domains.
- Sites is public; `veroxasystems.com` and `www.veroxasystems.com` were most recently verified with Sites version 22 on 2026-07-30.
- Current verified technical/deployed foundation: PR #155 reviewed head `96a6c00857b438b37c2e8d99329c0f556de850a2`, merged commit `d1f6a9a78ac54cd5447689d5f8b3d42466daf479`, Sites version 22 checkout `83bf6496a02559bf7bbc3fe9bc02ff7f9f8b3f6e`, and 16 applied migrations. PR #154 / Sites version 21 and the v20/v19 closeouts remain immutable historical evidence. Public marketing and audit intake are anonymous. Client and Team routes use Supabase sessions plus active profile/membership authorization; the iCloud Client and Gmail Team identities remain provisioned, with one private upload whose rights are now expired. AI candidates, provider calls, approved Team reviews, Ready renditions, and accounted spend remain zero; authenticated Team preflight and the two-account rehearsal are pending. Public publishing and activation remain blocked. Momo remains **No-Go**.
- **Replit is historical only**.
- Active roles: **Client and Team**.
- **Owner/Operator parked**.
- The legacy Vite `AUTH_MODE = placeholder` implementation is historical/internal and is not deployed or a rollback authority. Sites production authentication is Supabase-backed.
- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- The Momo production data/auth foundation, task-first private media foundation, standalone Restaurant Audit Center V3, and signed Media AI lifecycle bridge are the current release. The bridge is deployed, while authenticated provider-use proof remains pending.
- Veroxa is integration-ready but not connected.
- Restaurant Onboarding has a deployed persistence and workflow foundation but still lacks complete owner-confirmed Momo evidence.
- Active public offer: **Complete Online Presence — $495/month**. `ACTIVE_DOCS_INDEX.md` is the current doc index and pricing source pointer; Starter/Growth/Premium and $295/$995 language are historical/deprecated only.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.

Warning: older docs may contain historical/deprecated material. Do not override `ACTIVE_DOCS_INDEX.md` or `PRICING_SOURCE_OF_TRUTH.md` with older current-looking files. Current docs override older changelog sections. Do not revive Vercel or Replit as active, Owner/Operator as active, old pricing, live AI/connectors/payments as active, or paid activation without explicit approval.
