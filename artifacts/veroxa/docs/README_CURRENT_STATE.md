# Veroxa Current-State Doc Index

Status: Short index for Faraz, Codex, and future ChatGPT/Codex sessions.

## 2026-07-14 — current production-reconciliation state

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
- Sites is public; `veroxasystems.com` and `www.veroxasystems.com` report active provider and SSL status as last verified on 2026-07-13.
- Current verified operational foundation: PR #143 reviewed head `009276dbbf2639dc1eb5296bf62906f9f8ac45f1`, merged operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8`, all nine production migrations applied and verified, and Sites version 9 deployed successfully from checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c`; both custom domains are active with healthy SSL. PR #144 is a behavior-neutral repository-and-Sites-evidence continuity release whose database-source delta is limited to the filename/ledger reconciliation of migration 9 to remote version `20260713191147`, with schema, SQL content, and migration count unchanged. Its exact merged state must receive a verified Sites version 10 checkpoint after merge; Sites version 10 is not already deployed, and no PR #144 merge SHA is embedded or predicted. External GitHub PR metadata and Sites checkpoint metadata are the future authorities. Public marketing and audit intake are anonymous. Client and Team routes use Supabase sessions plus active profile/membership authorization; Faraz's Team password sign-in is verified, while Momo Client access, owner-confirmed data, permissioned media, runtime AI, providers, publishing, and activation remain blocked.
- **Replit is historical only**.
- Active roles: **Client and Team**.
- **Owner/Operator parked**.
- The legacy Vite `AUTH_MODE = placeholder` implementation is historical/internal and is not deployed or a rollback authority. Sites production authentication is Supabase-backed.
- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- The Momo production data/auth foundation and standalone Audit Center V1 are the current release. Veroxa is still AI-ready but not connected.
- Veroxa is integration-ready but not connected.
- Restaurant Onboarding has a deployed persistence and workflow foundation but still lacks complete owner-confirmed Momo evidence.
- Active public offer: **Complete Online Presence — $495/month**. `ACTIVE_DOCS_INDEX.md` is the current doc index and pricing source pointer; Starter/Growth/Premium and $295/$995 language are historical/deprecated only.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.

Warning: older docs may contain historical/deprecated material. Do not override `ACTIVE_DOCS_INDEX.md` or `PRICING_SOURCE_OF_TRUTH.md` with older current-looking files. Current docs override older changelog sections. Do not revive Vercel or Replit as active, Owner/Operator as active, old pricing, live AI/connectors/payments as active, or paid activation without explicit approval.
