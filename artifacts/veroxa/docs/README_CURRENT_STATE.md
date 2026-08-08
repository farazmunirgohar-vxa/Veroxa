# Veroxa Current-State Doc Index

Status: Short index for Faraz, Codex, and future ChatGPT/Codex sessions.

## 2026-08-08 — reviewed local predeployment candidate (current)

- Sites v36 remains the immutable live baseline at 185 files / `caed6456debceb723c42869744cb4065439eb73d36df0726a1ffae6fe8a98fc7`. The exact remote 37-migration ledger reconstructed on 2026-08-08 is `d306d26cb633ef943afdb7efd01a3cde70249a096ef783d1b0d51eb5d4a1a429` through `20260802063829_momo_pipeline_query_indexes_v2.sql` (file SHA-256 `106d346be34583446d22de0f6866b5b8937feb766a3a229339dbf1c1768fdfcd`). `9f5d71e6487a00a9676d70dbc7022d383fd16e32f3f2a367c8d1ff7608031c90` is the historical v36 repository/Sites-mirror fingerprint, not the exact remote ledger.
- The candidate is local, unpublished, and unapplied: 200 Sites files / `39e7ae496f7e353c24069a4a179235fd2bed0feb24f83eaed1c684fb9b39a43e`; 42 mirrored migrations / `e19e1d7cc102ba1e6297de1860d005f19cbbb2dfd3873ed195af0c89d92b829c`. No PR, merge, workflows, database apply, Sites publish, production provider connection, or activation occurred.
- Start with `MOMO_PRIVATE_POLICY_EVAL_2026-08-08.json` for the private synthetic model-control result: final 10/10 live and 27/27 combined checks, two retained earlier failed attempts, and 30 total transmissions of the same ten logical cases. The reports record no retries, `store:false`, no tools or writes; only final v3 has source-hash proof of those controls. Completed aggregate cost upper bound is USD $0.0080502 under USD $2, without an atomic cross-process lifetime ledger. It is not production or Momo-rehearsal evidence.
- The staged rollout remains blocked: apply `01210` and `01430`; publish/verify Audit v2 plus Client v3; then apply `01842`, `01853`, and only after explicit review, `02609`. Exact live evidence shows `postgres` is not a member of `supabase_admin`, so `02609` skips that role's default ACLs and is not comprehensive default-ACL closure.

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
