# ChatGPT Sites Migration and Source-of-Truth

Status: active migration and deployment authority as of 2026-08-08.

## Reviewed local predeployment candidate — current authority

Sites v36 remains the immutable live baseline: 185 files at `caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7`. The exact remote 37-migration ledger reconstructed on 2026-08-08 is `d306d26cb633ef943afdb7efd01a3cde70249a096ef783d1b0d51eb5d4a1a429` through `20260802063829_momo_pipeline_query_indexes_v2.sql` (file SHA-256 `106d346be34583446d22de0f6866b5b8937feb766a3a229339dbf1c1768fdfcd`). `9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90` is the historical v36 repository/Sites-mirror fingerprint, not the exact remote ledger.

The reviewed policy-eval-closed candidate is local, unpublished, and unapplied: 200 Sites files at `929e05cf68a6af5176811f49321ec108e617b93a08153b65b3f86b109d0c8c18`, with 42 mirrored migrations at `dc565dd1f5f4a5efe6a2b253e7437e93f6364b5581c56bb811969fa7241a7a84`. Its private synthetic policy evidence is hash-bound in `MOMO_PRIVATE_POLICY_EVAL_2026-08-08.json`; final v3 passed 10/10 live cases plus 27/27 combined checks, and the completed three-attempt aggregate stayed under USD $2. The evidence explicitly records that only final-v3 request controls are source-hash-proven and no atomic cross-process lifetime cost ledger exists. No PR, merge, hosted workflows, database apply, Sites publication, production provider connection, or activation has occurred.

The rollout is blocked: apply `01210` and `01430`; publish and verify Audit v2 plus Client v3; only then apply `01842`, `01853`, and explicitly review `02609`. Exact live membership evidence shows `postgres` is not a member of `supabase_admin`, so `02609` will skip `supabase_admin` default ACLs. That is a known residual; this migration must not be described as comprehensive default-ACL closure.

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
