# Veroxa Current-State Doc Index

Status: Short index for Faraz, Codex, and future ChatGPT/Codex sessions.

## 2026-07-13 — Verified baseline and unshipped release-ready source

- Verified reusable baseline: PR #144 is merged at 01d11b4195809f60bcaf8bb7f21e004418f7647c; Sites version 10 is verified from checkout source 064980c52ded14b8c80724859f68c4cb30ffc86c; and all nine production migrations are applied and verified.
- Current release-ready candidate source adds Restaurant Audit Center V2 and the simplified Momo Team information architecture. Audit V2 restores a deterministic score out of 100, room-for-improvement findings, a 30/60/90-day plan, and save-or-discard preview control. Team stays organized under the Momo's House San Antonio folder, with the Work Board and focused content/approval views scoped to Momo.
- The candidate also adds an explicit-consent conversion from a reviewed audit to a pending restaurant profile. Consent creates only a non-operational pending profile; it does not create a client identity, membership, workspace, onboarding activation, publishing authority, or paid service.
- Release boundary: this candidate source is not yet merged to GitHub main, its new migration is not applied to production, and it is not deployed to Sites. Do not describe Audit V2, the pending-profile conversion, or the new Team IA as live until each separate source, migration, and deployment gate is verified.
- Momo remains the only operational restaurant. This work adds no new spend; runtime or paid AI, Meta/Google access, external SEO/social execution, publishing, outbound contact, owner/client contact, and activation remain blocked pending specific authorization, verified access, and any separately approved cost. Older PR #143, PR #144-pending, Sites version 9, or pre-version-10 current-state wording below is historical and superseded by this section.

Use `ACTIVE_DOCS_INDEX.md` first as the highest-level current source-of-truth index, then these documents as the current operating model before relying on older historical notes:

- `ACTIVE_DOCS_INDEX.md`
- `VEROXA_CURRENT_MILESTONE.md`
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
