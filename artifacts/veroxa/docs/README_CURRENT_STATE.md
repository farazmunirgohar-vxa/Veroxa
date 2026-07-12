# Veroxa Current-State Doc Index

Status: Short index for Faraz, Codex, and future ChatGPT/Codex sessions.

Use `ACTIVE_DOCS_INDEX.md` first as the highest-level current source-of-truth index, then these documents as the current operating model before relying on older historical notes:

- `ACTIVE_DOCS_INDEX.md`
- `VEROXA_CURRENT_MILESTONE.md`
- `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md`
- `CHATGPT_SITES_MIGRATION_AND_SOURCE_OF_TRUTH.md`
- `VEROXA_LOCKED_OPERATING_MEMORY.md`
- `VEROXA_OS_CURRENT_MASTER.md`
- `CURRENT_BUILD_STATUS.md`
- `PRE_PAID_ACTIVATION_GATE.md`
- `AI_READY_BUT_NOT_CONNECTED_STRATEGY.md`
- `INTEGRATION_READY_BUT_NOT_CONNECTED_STRATEGY.md`
- `RESTAURANT_ONBOARDING_OS_GAP_AND_BUILD_PLAN.md`
- `MANUAL_EXECUTION_CENTER.md`
- `FIRST_CLIENT_OPERATING_SUITE.md` if present
- `VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md`
- `PRE_BUILD_STABILITY_CHECKLIST.md`

Current strategy markers:

- Primary founder interface: **ChatGPT**. Faraz and ChatGPT decide the next outcome; ChatGPT invokes Codex, GitHub, CI, RR, and Sites tools internally.
- Active stack: **ChatGPT-managed GitHub + Codex + ChatGPT Sites**, with Vercel retained temporarily for migration compatibility and rollback.
- **GitHub `main` is canonical**; GitHub merge and Sites deployment are separate actions.
- `Build it` means build/test/PR/CI/RR and green merge; `Build it, but hold for review` stops at the green PR; `Build and deploy it` also syncs the exact merged source to Sites, checkpoints, deploys, and verifies the live domains.
- Sites is public; `veroxasystems.com` and `www.veroxasystems.com` report active provider and SSL status as last verified on 2026-07-12.
- Public marketing and audit intake are anonymous. The current release source makes Sites Client and Team routes use Supabase sessions plus active profile/membership authorization; client routes stay safe-empty until verified Momo records exist. The live domain remains on the prior shell until the exact green release is merged and checkpointed.
- **Replit is historical only**.
- Active roles: **Client and Team**.
- **Owner/Operator parked**.
- `AUTH_MODE` remains `placeholder` for Vite/Vercel rollback; it does not describe Sites production auth.
- Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.
- The Momo production data/auth foundation and standalone Audit Center V1 are the current release. Veroxa is still AI-ready but not connected.
- Veroxa is integration-ready but not connected.
- Restaurant Onboarding is a known gap and future priority.
- Active public offer: **Complete Online Presence — $495/month**. `ACTIVE_DOCS_INDEX.md` is the current doc index and pricing source pointer; Starter/Growth/Premium and $295/$995 language are historical/deprecated only.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.

Warning: older docs may contain historical/deprecated material. Do not override `ACTIVE_DOCS_INDEX.md` or `PRICING_SOURCE_OF_TRUTH.md` with older current-looking files. Current docs override older changelog sections. Do not revive Replit as active, Owner/Operator as active, old pricing, production auth/storage/live AI/connectors/payments as active, or paid activation before the Pre-Paid Activation Gate.
