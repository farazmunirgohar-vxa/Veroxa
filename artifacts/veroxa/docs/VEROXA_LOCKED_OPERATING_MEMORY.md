## 2026-07-14 — locked verified PR #148 release and cleanup direction

- `CVR` means **Complete Veroxa Review**: Veroxa code review, build-direction review, Codex review, GitHub review, Sites review, and recommended next steps.
- PR #148 is the verified deployed application release at `165ff82ab46b0a0985605ffcfb6efa687982eca5`; Sites version 14 is live from Sites source `57ccb8d1cce596baf782b03525c80161c11af8f3`; Supabase has 13 applied migrations.
- The verified Sites tree SHA-256 is `4f0a4f82d774a63c231a294704ae177ddbbe13c665567db33bdebab815331799`. The cleanup candidate is not merged and not published; after merge it requires an exact-source Sites checkpoint.
- Reconcile migrations 12 and 13 to applied filename versions `20260714022859_reconcile_audit_v3_and_function_search_paths.sql` and `20260714022911_ai_budget_and_momo_manual_pilot_contract.sql` without changing SQL bytes. Until that cleanup merges, content/count are verified but exact filename-ledger parity remains pending.
- Archive legacy Vite from active workspace, build, and CI development paths while retaining recoverable historical source. It is not canonical runtime source, a deployment path, or a rollback authority.
- Keep runtime AI, credentials, Momo/client contact, Client provisioning, owner confirmation, media rights, providers, publishing, billing, activation, and new spend disabled. Momo remains No-Go until real evidence and separate approval exist.
- Preserve the exact Vercel shutdown sentinel until external Git disconnection is independently verified. Do not infer disconnection from quiet deployment history.
- PR #148 remains the deployed application-release commit; do not predict the cleanup candidate's eventual merge commit.

## 2026-07-14 — locked production reconciliation and founding-pilot direction (historical pre-PR #148 checkpoint)

- `CVR` means **Complete Veroxa Review**: Veroxa code review, build-direction review, Codex review, GitHub review, Sites review, and recommended next steps.
- Momo's House San Antonio has already agreed to onboard as Veroxa's free founding pilot. Complete and prove the secure, persistent, human-controlled operating loop before contact. Manual execution is valid for the pilot; paid AI and live provider automation are later modular activations, not prerequisites for truthful onboarding.
- Canonical GitHub `main` is `674e1a7c0d140c9b281029277baeb2e68962dac2`. Observed production is ahead: live Sites version 13 uses checkout `dd67c2dfbdc1317fd8ecf1fd3cf07aeeafa29805`, and Supabase has 11 applied migrations.
- Exact migration 11 source: `20260713222721_upgrade_restaurant_audit_engine_v3_partial_scoring.sql`, SHA-256 `304eb98db628b09fa245fba156160b043c1ba9ba2f9aeb689086a6a18ad234b2`.
- The reconciliation candidate is unmerged and undeployed. Do not invent its merge SHA, future Sites version, review result, or live status.
- `VEROXA_DEPLOYMENT_MANIFEST.json` is the machine-readable freeze and parity record. CI must verify the committed deterministic trees and emit an exact-`GITHUB_SHA` attestation. Merge additionally requires all four workflows green and zero unresolved GitHub review threads.
- Freeze all product deployments except that exact reviewed reconciliation release. Keep runtime AI, credentials, owner/client contact, Momo activation, providers, publishing, billing, and new spend disabled.
- A visual/manual Momo review may prove UI behavior but cannot manufacture Client identity, owner confirmations, media rights, work, activity, reports, recovery, or a readiness Go.
- Keep the Vercel shutdown sentinel until the external integration is independently confirmed disconnected. Branch pruning and legacy Vite removal remain deferred post-release work with rollback, ownership, and explicit approval gates.
- This section supersedes older automation-first, Supabase-10, Sites-v11, Audit-V2, and “100% readiness requires live AI/providers” statements wherever they conflict.

## 2026-07-13 — PR #145, Supabase 10, and Sites v11 verified production state (historical)

- Verified source: PR #145 passed review at exact head b007de99eb6c927f6d7ede56d7d4fffe8cbc0f0d and is merged to GitHub main at 9aa74631e393bc0303c820cc7671f818d617778c.
- Verified data: Supabase has all 10 production migrations applied and verified. Restaurant Audit V2 is remote migration version 20260713212046 with SQL SHA-256 f4bfff7ac94ade68a2c4f761c5627dbcfe82d5800a0a8a46ce42b13e5b930693.
- Verified hosting: Sites version 11 succeeded in production from checkout source 4bef697e230791403211cb9c60f769ebcb4f39c7. Both custom domains are active with healthy SSL.
- Live product state: Restaurant Audit Center V2 and the simplified Momo Team information architecture are live. Audit V2 provides the deterministic score out of 100, room-for-improvement findings, 30/60/90-day plan, and save-or-discard preview flow. Team remains organized under the Momo's House San Antonio folder with a Momo-only Work Board and focused content/approval views.
- Conversion boundary: a reviewed audit may create only a pending, non-operational restaurant profile after exact explicit consent. It never auto-creates a client identity, membership, active workspace, onboarding activation, publishing authority, paid service, or charge.
- Operating boundary: Momo's House San Antonio remains the only operational restaurant and remains blocked until its owner-confirmed truth, permissioned media, provider authority, and remaining readiness evidence are complete. No runtime or paid AI, Meta/Google connection, external SEO/social execution, publishing, outbound contact, owner/client contact, or activation was authorized by this release.
- Supersession: older current-looking PR #143, PR #144-pending, Sites version 9/10, nine-migration, unshipped-candidate, or Audit V1 wording below is historical and superseded by this verified section.

## 2026-07-13 — Seven-system readiness source/runtime lock

- `MOMO_100_READINESS_SEVEN_SYSTEM_CONTRACT.md` is the current contract for the seven requested Momo systems and the final fail-closed readiness gate.
- A schema, adapter, queue, or UI state is not a live integration. Runtime AI, Meta, Google Business Profile, external SEO/social execution, publishing, and visibility monitoring remain inactive pending authorized access and any separately approved incremental spend.
- Faraz's approved Gmail Team identity is confirmed, has signed in, has an active Team profile plus active Momo membership, and passed an authenticated Team/Momo protected-route Safari smoke. The mistaken secondary identity has disabled portal access. No privileged key was exposed.
- Sites version 9 passes only the validated Supabase project URL and publishable key from the existing dynamic login/protected routes; the marketing root remains cacheable, and service-role values remain server-only and forbidden from HTML, browser code, CI output, and public configuration. Secure email-link recovery, approved-user password sign-in, protected password replacement, and the no-new-spend Momo operating foundation are live. Faraz confirmed password sign-in; hosted reauthentication and old-session revocation remain unverified.
- No Momo owner business truth, contacts, sensitive dietary/halal claim, media rights, platform access, or result metric may be invented, inferred as confirmed, or seeded to satisfy readiness.
- Final Momo readiness passes only at 100% when every required dimension has evidence and no blocker. Missing identities, owner truth, rights, provider authorization, authenticated/browser evidence, monitoring, or recovery evidence must keep the gate blocked.
- PR #143 reviewed head `009276dbbf2639dc1eb5296bf62906f9f8ac45f1` merged at operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8`; all nine production migrations are applied and verified; and Sites version 9 deployed successfully from checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c` with both custom domains active and SSL healthy. The ninth migration filename is reconciled to remote version `20260713191147_momo_zero_cost_operating_rehearsal_v1.sql` with SQL/schema/content/count unchanged at SHA-256 `07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a`. No disconnected provider may be described as connected, and Momo remains blocked until every operational gate has real evidence.
- PR #144 is the behavior-neutral repository-and-Sites-evidence continuity release. Its database-source change is filename/ledger-only; database schema, migration content, and migration count do not change. Because Sites-bundled readiness evidence changes, Sites version 10 must be published and verified after merge and is not already deployed. This committed source never embeds or predicts PR #144's merge SHA; external GitHub PR metadata and Sites checkpoint metadata are the future authorities.

## 2026-07-12 — Sites-only deployment lock

- Faraz retired Vercel. ChatGPT Sites is the sole Veroxa deployment surface.
- Keep root Vercel serverless handlers removed. While the legacy Git integration remains connected, allow only the exact root `vercel.json` shutdown sentinel with `git.deploymentEnabled: false`; it is temporary, starts no build, and must be removed after dashboard disconnection. Do not treat Vercel status as a merge, release, rollback, or readiness gate.
- GitHub `main` remains canonical; verified Sites checkpoints are the hosted recovery path. Any older Vercel rollback language below is historical and superseded.
- PR #143 operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8` is the verified runtime lineage, and Sites version 9 deployed successfully from checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c`. Both custom domains are active with healthy SSL and no reported domain error. PR #144 requires a separate post-merge Sites version 10 checkpoint identified by external metadata.

## 2026-07-12 — Production foundation and Audit Center V1 lock

- Momo's House San Antonio remains the only operational client and restaurant workspace.
- The Sites delivery layer uses Supabase Auth, server session validation, active profile plus active Momo membership, RLS, and safe-empty client views. The undeployed Vite `AUTH_MODE = placeholder` code does not describe production Sites auth.
- Public Auth identity creation is disabled. Team and future Momo identities must be pre-provisioned through a supported Supabase Admin path and must also have an active profile/membership.
- Deployed sign-in for approved active identities uses password sign-in plus secure email links for recovery, and protected password replacement is live; public signup remains disabled. Faraz confirmed password sign-in. The 24-hour browser check is a UI guard, the Free-plan HIBP partial-hash check is bypassable defense in depth rather than native Auth-boundary enforcement, and hosted reauthentication plus old-session revocation remain unverified.
- Existing legacy demo rows are preserved. Ten broad M024 authenticated development policies are removed; production Sites reads only versioned `veroxa_*` tables and the separate `audit_*` domain.
- The Restaurant Audit Center is the only cross-restaurant capability. Its records never create clients, workspaces, onboarding, media/content operations, publishing access, or active-client conversion automatically.
- Reviewed audit states are evidence-gated and immutable. A reviewed request requires a reviewed report; a reviewed report requires a reviewed run and evidence-backed finding; reviewed reruns require a comparison.
- The final delta RR additionally requires the latest run/report before a request can close, distinct identity rows for same-name audit locations, append-only lifecycle events, failed-run reasons, reproducible run snapshots, raw-body/timeout intake controls, and explicit UI draft/navigation/accessibility safety.
- `RR_CHECKPOINT.md` plus `RR_RELEASE_CHECKPOINT.json` is the durable review memory. Future RRs reuse unchanged boundary evidence and review only changed groups unless a documented full-review trigger is crossed.
- The release checkpoint is verified after the green merge, production Supabase application, Sites deployment, and live custom-domain checks. Start the next RR from that checkpoint rather than repeating unchanged release review.
- Veroxa tracking has two mandatory lanes after every build: Veroxa delivery/readiness and Momo's House San Antonio operational readiness. `momo-readiness-tracker.json` is the machine-readable Momo lane and must record evidence, blockers, and next actions without inventing a percentage.
- Momo readiness is verified only when every required dimension is verified and no blocker remains. A green build, migration, deployment, or individual foundation does not by itself make Momo ready.
- The next operational step is explicit approval and supported Momo client identity provisioning, followed by real owner-confirmed onboarding and permissioned media intake. Runtime AI, Meta, Google, social, SEO execution, publishing, outbound contact, and owner walkthrough remain separately gated and inactive.
- After every build, update `VEROXA_CURRENT_MILESTONE.md`, `CURRENT_BUILD_STATUS.md`, this memory when durable truth changes, and Faraz's plain-language handoff.

## 2026-07-12 — Momo 100%-readiness milestone and Audit Center exception

Faraz's newest explicit product direction supersedes broader multi-client roadmap assumptions:

- Momo's House San Antonio is Veroxa's only operational client and restaurant workspace for the remainder of the current milestone.
- Team Faraz is focused on operating Momo end to end.
- The only capability that may be effective for non-client restaurants is the standalone, fully functional Restaurant Audit Center inside Team.
- Other restaurants may have saved and repeatable audit records, evidence, Team notes, comparisons, and reviewed audit reports, but no client account, operations workspace, onboarding, media/content workflow, operational work queue, reporting, publishing access, or automatic conversion. An audited restaurant does not become an operational client unless Faraz separately and explicitly approves conversion.
- The next milestone is Momo's House San Antonio 100% readiness: production-grade identity and data, full onboarding, media, AI, automation, social handling, Google/SEO, reviews, approved publishing, work orchestration, reporting, monitoring, and recovery—as automated and AI-integrated as safely possible.
- Automation should maximize internal analysis, classification, drafting, routing, scheduling, monitoring, and reporting while preserving owner-confirmed business truth, Veroxa approval gates, human review for reputation-sensitive work, and verified platform permissions.
- `VEROXA_CURRENT_MILESTONE.md` is the highest-priority current scope and progress document.
- After every build, ChatGPT must update the current milestone, build status, relevant runtime/deployment truth, and Faraz's plain-language progress handoff. Update this locked memory when durable scope, authority, or product direction changes. A build is not complete until this continuity update is done.
- The earlier post-cutover route-parity sequence and older Team-deferral/public-client-first priorities are superseded as the current build order. Multi-client opportunity work is historical except for non-client prospecting inside the Restaurant Audit Center.

Current technical truth is recorded in the newer production-foundation section above. Runtime AI, external integrations, publishing, and Momo activation remain inactive.

## 2026-07-12 — ChatGPT-managed Veroxa operating agreement

Faraz's newest explicit operating direction:

- Faraz uses ChatGPT as the primary Veroxa command center. Faraz and ChatGPT decide the next outcome together; ChatGPT invokes Codex, GitHub, CI, RR, and Sites tooling internally.
- Faraz should not need to copy a prompt into a separate Codex window or manually operate GitHub/Sites for routine build work.
- `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md` is the authority for command meanings, green-merge requirements, pause boundaries, and GitHub-to-Sites deployment discipline.
- `Build it` authorizes the agreed branch, implementation, tests, PR, CI/RR repair, and merge of the exact reviewed commit only when green. It does not authorize a Sites deployment unless deployment was explicitly included.
- `Build it, but hold for review` stops at a verified green PR without merge or deployment.
- `Build and deploy it` authorizes the green merge plus synchronization of the exact merged GitHub state to Sites, checkpoint deployment, and live/domain verification.
- `RR` authorizes deep review and reasonable safe fixes but does not independently authorize merge, deploy, real-world activation, or material scope expansion.
- GitHub `main` remains canonical. A GitHub merge and a Sites deployment are separate actions. Never allow live-only Sites behavior to become the lasting source of truth.
- ChatGPT should perform safe, reversible, in-scope engineering work autonomously and pause for production auth/credentials, real customer data/privacy, destructive data or production migrations, billing/payments, external integrations/publishing/contact, business-truth or public-promise changes, DNS/domain-record changes, Momo activation/walkthrough, or material direction changes.

Historical pre-foundation hosted-state memory as last verified earlier on 2026-07-12; superseded by the production-foundation lock above for source truth, while the deployed site remains on this state until checkpoint:

- Sites access is public.
- `veroxasystems.com` and `www.veroxasystems.com` are attached to Sites with active provider and SSL status and no reported domain error.
- Public Client and Team routes are non-sensitive pre-live shells, not secure production access; no real client or Team-sensitive data may be introduced before approved production identity and authorization.
- Vercel remains temporary rollback only.

## 2026-07-12 — ChatGPT Sites application migration

Faraz's newest explicit build direction:

- Build the real Veroxa application through ChatGPT Sites.
- Use the existing GitHub/Codex Veroxa system as the core skeleton and canonical product truth.
- Preserve the approved Sites visual direction as the presentation layer.
- Do not create or promote another demo.
- GitHub `main` remains canonical; Sites is the primary deployment/application surface.
- Vercel remains temporarily available as a compatibility and rollback surface during post-cutover stabilization.
- The approved Namecheap/Sites cutover is complete and both custom domains report active provider and SSL state; retain stabilization checks and the documented rollback path.
- RR must review both GitHub health and the Sites migration/deployment/domain/access state.
- The migration does not authorize real auth, credentials, external integrations, database/storage activation, AI provider calls, publishing, Momo contact, owner walkthrough, real client accounts/data, or Team-sensitive exposure.

Current post-cutover priority (historical; superseded by `VEROXA_CURRENT_MILESTONE.md`):

1. Keep the Sites source reconciled with GitHub `main`; PR #134 establishes the initial synchronized source and operating contract.
2. Preserve honest public pre-live shell language and guard against misleading secure/internal access claims.
3. Add a shared route/capability contract and guardrail.
4. Complete Client and grouped Momo behavior parity.
5. Keep GitHub-synced Sites source, CI, build, mobile, accessibility, and domain verification green.
6. Design identity/persistence architecture only under separate approval.
7. Retain Vercel rollback until post-cutover stabilization is explicitly complete.

## 2026-06-21 — Post-PR120 locked operating memory

Automation-first direction remains locked. The current operating baseline is post-PR120: merged PR #120 — Momo Internal Dry Run + Go/No-Go Gate.

- PR #118 Controlled AI Draft Generation Foundation is merged/completed.
- PR #119 AI Draft Approval Queue is merged/completed.
- PR #120 Momo Internal Dry Run + Go/No-Go Gate is merged/completed.
- PR #121 was closed unmerged and is not active source-of-truth.
- PR #122 was closed/not used and is not active source-of-truth.
- PR #120 dry-run/go-no-go gate is internal-only and not an owner walkthrough approval.
- Momo owner walkthrough remains blocked.
- Any future owner walkthrough must come only after separate explicit Faraz approval.
- Any future activation must come only after separate explicit Faraz approval.
- No public/customer-visible use of business truth, media, AI drafts, reports, or approvals is allowed without Team/Faraz review and required owner confirmation.
- AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. No next activation PR is approved by default.

## 2026-06-17 — PR #106 AI Draft Preparation Foundation status

GitHub PR #106 adds AI Draft Preparation Foundation only. AI drafts are Team-only internal draft records behind real auth and `VITE_VEROXA_AI_DRAFTS_ENABLED=true`; placeholder mode stays empty. No raw AI output is client-visible, no draft publishes, no draft auto-approves, no reports are generated, Team Automation Control Center remains PR #107, Reports From Activity remain PR #108, and Momo owner walkthrough remains blocked.

## 2026-06-17 — RR fix-forward operating rule

When Faraz asks ChatGPT to RR a Veroxa PR, the job is not only to identify issues. ChatGPT should fix every issue it can reasonably and safely fix directly during the RR before giving the final merge verdict. This includes guardrail/check failures, docs mismatches, PR sequence drift, TypeScript/schema mismatches, migration/RLS/security policy problems, route guard issues, unsafe client visibility, feature-gate mistakes, accidental scope creep, and CI/Veroxa Verify failures that can be patched from GitHub. ChatGPT owns the Codex implementation/fix loop and pauses for Faraz only at the material boundaries in `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md`. Do not call a PR merge-ready until fixable RR blockers are patched and the relevant checks are green.

# Veroxa Locked Operating Memory

## 2026-06-19 — Current GitHub PR sequence lock

`LIVE_AUTOMATION_V1_PR_SEQUENCE.md` is the current source of truth for actual GitHub PR numbering. If older docs still say Real Messages was PR #103, Profile Corrections was PR #104, PR #104/PR #107 is next, PR #110 is the activation gate, or PR #111 activates by default, treat those as stale planning labels, not actual GitHub status.

Current corrected sequence:

1. PR #99 — Live Automation V1 Architecture + Schema Design.
2. PR #100 — Supabase Auth Foundation.
3. PR #101 — Database Foundation.
4. PR #102 — Media Upload + Storage Foundation.
5. PR #103 — Profile Corrections Foundation.
6. PR #104 — Real Messages / Portal Threads Foundation.
7. PR #105 — Activity Log Foundation.
8. PR #106 — AI Draft Preparation Foundation.
9. PR #107 — Team Automation Control Center Foundation.
10. PR #108 — Reports From Activity Foundation.
11. PR #109 — Momo Live Pilot Readiness Gate.
12. PR #110 — Post-PR109 Momo readiness alignment.
13. PR #111 — Controlled Momo Pilot Activation Gate.
14. PR #112 — Post-PR111 Activation Gate Alignment + Business Truth Status Hardening.
15. PR #113 — Post-PR112 Source-of-Truth Finalization.

Do not skip to real-auth activation, external integrations, publishing, payments, or Momo owner walkthrough from PR #111, PR #112, or PR #113. Future real-world activation steps require separate explicit Faraz approval after the internal gates and source-of-truth finalization.

## 2026-06-15 — PR 100 Supabase Auth Foundation

PR 100 is the first Live Automation V1 implementation step. It adds real-auth foundation code and setup documentation while keeping `AUTH_MODE` as `placeholder`; `/api/pilot-access` remains the active safe Momo/Team Faraz pilot login path. Real auth is not activated, and the Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved.

Status: highest-priority current operating memory as of 2026-06-14. This file exists to prevent future Veroxa work from drifting back to stale manual-first Momo walkthrough planning.

## 2026-06-14 — Automation-first Momo pivot

Faraz's newest locked direction is: **before any Momo owner walkthrough, Veroxa must be live and automatic enough to operate with minimum human interference.**

The older manual-first Momo walkthrough path is now stale for the current Momo plan. Historical manual/pre-live docs can still explain existing code state, safety boundaries, and prior decision context, but they must not be treated as the active path for taking Momo through an owner walkthrough unless Faraz explicitly re-approves a manual-first walkthrough.

## Current operating rule

Detailed Live Automation V1 architecture and module sequencing live in `LIVE_AUTOMATION_V1_ARCHITECTURE.md`; actual GitHub PR numbering now lives in `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`. Read both before implementing any PR 100+ live automation work.

- Do **not** schedule, design around, or assume a Momo owner walkthrough until **Live Automation V1** exists and Faraz explicitly approves the walkthrough.
- Do **not** treat older first-client/manual launch walkthrough docs as the current Momo execution plan.
- Do **not** build product features from this memory doc alone; it is a source-of-truth alignment document.
- Keep the existing manual/pre-live code state honest until live systems are intentionally connected.
- Preserve all public/client safety gates even when automation is added.

## Live Automation V1 target before Momo walkthrough

Live Automation V1 means Veroxa can operate with minimum human interference while still keeping Faraz in control of public/customer-visible output. The target sequence is:

1. Real auth for the approved pilot roles and accounts.
2. Database-backed account and restaurant records.
3. Real client media upload and storage flow.
4. Real client/team messages or portal request thread flow.
5. Owner profile corrections that become pending Veroxa review.
6. Activity log capturing meaningful internal/client-facing work events.
7. AI drafting/preparation for internal Veroxa work where allowed.
8. Team Automation Control Center for Faraz review, approval, edits, holds, and skips.
9. Reports generated from approved activity and tracked work rather than static/manual-only content.
10. Momo readiness gate and controlled activation gate as internal Team-only decision surfaces.

This target does not mean uncontrolled automation. It means Veroxa should prepare, organize, draft, track, and route work automatically enough that Faraz is reviewing and approving a managed operating system instead of manually walking the owner through a mostly static preview.

## Automation boundaries

Automation may prepare and process internal work, including:

- analyzing available restaurant information;
- organizing uploaded media;
- drafting captions, updates, message replies, report summaries, profile correction suggestions, and next-step recommendations;
- classifying issues, blockers, and business-truth confirmation needs;
- creating internal activity records and review items;
- preparing Team-facing actions for approval, edit, skip, hold, or client confirmation.

Automation must not bypass safety gates.

## Approval and business-truth gates

Public or customer-visible actions still require Veroxa/Faraz approval before anything goes live.

Business-truth changes require client confirmation before approval or execution, including:

- hours and holiday hours;
- menu items, menu availability, and prices;
- discounts, offers, promotions, bundles, or specials;
- address, phone, ordering, reservation, website, and social links;
- catering availability;
- halal, organic, health, allergen, ownership, award, certification, or similar claims;
- sensitive complaint responses or public reputation-impacting language.

Veroxa must not invent discounts, BOGO offers, price cuts, lower prices, or new promotions. If a restaurant already has an offer or promotion, Veroxa may ask the client to confirm exact details before preparing public copy.

## Current technical truth to preserve

As of this operating memory:

- CP-V1 client portal is polished for the intended owner-facing shape.
- Profile Corrections foundation is merged as GitHub PR #103, but real-auth activation is still off and profile corrections are not public/platform updates.
- Real Messages / Portal Threads are merged as GitHub PR #104.
- Activity Log is merged as GitHub PR #105.
- AI Draft Preparation is merged as GitHub PR #106.
- Team Automation Control Center is merged as GitHub PR #107.
- Reports From Activity is merged as GitHub PR #108.
- Momo Live Pilot Readiness Gate is merged as GitHub PR #109.
- Post-PR109 Momo readiness alignment is merged as GitHub PR #110.
- Controlled Momo Pilot Activation Gate is merged as GitHub PR #111.
- Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged as GitHub PR #112.
- Post-PR112 Source-of-Truth Finalization is merged as GitHub PR #113.
- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Momo owner walkthrough remains blocked until Faraz explicitly approves activation/walkthrough after reviewing the gate and current blockers.
- No next activation PR is approved by default.

## Relationship to older docs

Older manual-first, first-client, preview-login, pre-live, and Momo readiness docs remain historical context unless refreshed by a newer source-of-truth doc. They may still be useful for route inventories, copy constraints, safety rules, and understanding current code limitations, but they must not override this automation-first Momo pivot or the actual PR numbering in `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`.

When future Codex or ChatGPT work sees conflicts:

1. Follow Faraz's newest explicit instruction.
2. Then follow `ACTIVE_DOCS_INDEX.md`, `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`, and this locked operating memory.
3. Treat older manual-first Momo walkthrough language as stale for the current Momo path.
4. Preserve safety gates for approval, client confirmation, and no fake live execution.

## 2026-06-19 — PR #111 Controlled Momo Pilot Activation Gate

GitHub PR #111 adds Controlled Momo Pilot Activation Gate only after PR #109 Momo Live Pilot Readiness Gate and PR #110 Post-PR109 Momo readiness alignment were merged. This decision gate is Team-only and read-only. It does not activate the pilot by default, does not activate real auth, does not create client credentials, does not contact Momo’s House, does not publish externally, does not create platform integrations, and does not add payments, webhooks, cron jobs, or background jobs. `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, and Momo owner walkthrough remains blocked until Faraz explicitly approves activation/walkthrough after the gate. Future real-world activation steps require a separate explicit Faraz approval.


## 2026-06-19 — PR #112 Post-PR111 Activation Gate Alignment

GitHub PR #112 is **Post-PR111 Activation Gate Alignment + Business Truth Status Hardening**. PR #109 Momo Live Pilot Readiness Gate is already merged, PR #110 Post-PR109 Momo readiness alignment is already merged, and PR #111 Controlled Momo Pilot Activation Gate is already merged. PR #112 corrects activation/readiness gate interpretation of current business-truth profile-field statuses (`please_review`, `pre_filled`, `confirmed`, `optional`, `veroxa_review`) and removes stale PR #110 activation-gate wording. PR #112 is corrective alignment only: it does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not create platform integrations, and does not add payments, webhooks, cron jobs, or background jobs. `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, Momo owner walkthrough remains blocked, no next activation PR is approved by default, and Future real-world activation requires separate explicit Faraz approval.

## 2026-06-19 — PR #113 Post-PR112 source-of-truth finalization

Latest completed Live Automation V1 alignment is through PR #112. PR #113 is source-of-truth finalization only and is not an activation PR.

Merged sequence truth:

- PR #109 Momo Live Pilot Readiness Gate is merged.
- PR #110 Post-PR109 Momo readiness alignment is merged.
- PR #111 Controlled Momo Pilot Activation Gate is merged.
- PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged.

PR #112 hardened current business-truth profile-field status interpretation for `please_review`, `pre_filled`, `confirmed`, `optional`, and `veroxa_review`, and removed stale PR #110 activation-gate wording. No next activation PR is approved by default. Momo owner walkthrough remains blocked. `AUTH_MODE` remains `placeholder`. `/api/pilot-access` remains active. Real auth remains off. No external integrations are connected. No credentials, auth users, owner/client invitations, Momo contact, external publishing, platform connections, payments, webhooks, cron jobs, background jobs, scheduled jobs, or fake readiness/data are approved or added. Future real-world activation, real-auth activation, external platform setup, or owner walkthrough requires separate explicit Faraz approval.

## PR #114 — Momo Internal Pilot Prep Pack

- GitHub PR #114 adds Momo Internal Pilot Prep Pack only.
- PR #109 Momo Live Pilot Readiness Gate is merged.
- PR #110 Post-PR109 Momo readiness alignment is merged.
- PR #111 Controlled Momo Pilot Activation Gate is merged.
- PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged.
- PR #113 Post-PR112 Source-of-Truth Finalization is merged.
- PR #114 is internal preparation only.
- PR #114 does not activate the pilot.
- PR #114 does not activate real auth.
- PR #114 does not create credentials.
- PR #114 does not contact Momo’s House.
- PR #114 does not publish externally.
- PR #114 does not connect external platforms.
- PR #114 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.
- AUTH_MODE remains placeholder.
- /api/pilot-access remains active.
- Roles remain client/team only.
- Momo owner walkthrough remains blocked.
- No next activation PR is approved by default.
- Future real-world activation requires separate explicit Faraz approval.
- Team route added for inventory/surface map: `/team/momo-pilot-prep` is guarded by InternalDemoGuard role="team" and RealPortalDataBoundary portal="team".

## PR #115 — Momo Business Truth Review Pack

GitHub PR #115 adds Momo Business Truth Review Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged or immediately prior. PR #115 is internal business-truth review only. PR #115 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed.

## 2026-06-19 — PR #116 Momo Media + Content Inventory Pack

GitHub PR #116 adds Momo Media + Content Inventory Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 is internal media/content inventory only. PR #116 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not upload, create, seed, generate, or fake media, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts.

## PR #117 — Momo Brand Voice + AI Prompt Rules Pack

GitHub PR #117 adds Momo Brand Voice + AI Prompt Rules Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged.

PR #117 is internal brand voice and AI prompt-rule preparation only. PR #117 does not generate AI output. PR #117 does not call any AI provider. PR #117 does not activate the pilot. PR #117 does not activate real auth. PR #117 does not create credentials. PR #117 does not contact Momo’s House. PR #117 does not upload, create, seed, generate, or fake media. PR #117 does not publish externally. PR #117 does not connect external platforms. PR #117 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts. All future AI output requires Team/Faraz review before customer-visible use.

## GitHub PR #118 — Controlled AI Draft Generation Foundation

GitHub PR #118 adds Controlled AI Draft Generation Foundation only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged.

PR #118 is controlled AI draft generation foundation only. AI generation is disabled by default. PR #118 does not generate customer-visible AI output. PR #118 does not auto-approve AI output. PR #118 does not publish AI output. PR #118 does not activate the pilot. PR #118 does not activate real auth. PR #118 does not create credentials. PR #118 does not contact Momo’s House. PR #118 does not upload, create, seed, generate, or fake media. PR #118 does not publish externally. PR #118 does not connect external platforms. PR #118 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts. All future AI output requires Team/Faraz review before customer-visible use.
## GitHub PR #119 — AI Draft Approval Queue

GitHub PR #119 adds AI Draft Approval Queue only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged. PR #118 Controlled AI Draft Generation Foundation is merged or immediately prior.

PR #119 is internal AI draft approval queue only. PR #119 does not generate AI output. PR #119 does not call any AI provider. PR #119 does not auto-approve AI output. PR #119 does not publish AI output. PR #119 does not expose AI output to the client. PR #119 does not activate the pilot. PR #119 does not activate real auth. PR #119 does not create credentials. PR #119 does not contact Momo’s House. PR #119 does not upload, create, seed, generate, or fake media. PR #119 does not publish externally. PR #119 does not connect external platforms. PR #119 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI drafts may move forward only after Team/Faraz review. No AI output becomes customer-visible from this PR.

## PR #120 — Momo Internal Dry Run + Go/No-Go Gate

GitHub PR #120 adds Momo Internal Dry Run + Go/No-Go Gate only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged. PR #118 Controlled AI Draft Generation Foundation is merged. PR #119 AI Draft Approval Queue is merged or immediately prior. PR #120 is internal dry-run/go-no-go review only. PR #120 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not expose anything to the client, does not generate AI output, does not create fake AI drafts, does not create fake approvals, does not create fake reports, does not upload/create/seed/generate/fake media, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. Any future go-live, real-auth cutover, owner walkthrough, external platform setup, or client exposure requires a separate explicit Faraz approval.
