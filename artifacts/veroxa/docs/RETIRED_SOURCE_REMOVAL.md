# Retired source removal

Status: authorized permanent repository cleanup on 2026-08-05.

The retired Vite/Replit application and its runtime-specific verification scripts were permanently removed from the current Veroxa repository tree after GitHub `main`, ChatGPT Sites version 36, and the 37-file Supabase migration ledger were verified in parity.

Removed from the current tree:

- `artifacts/veroxa/src`
- `artifacts/veroxa/public`
- `artifacts/veroxa/e2e`
- the retired Vite/Replit package, HTML, TypeScript, component, environment-example, and artifact configuration files under `artifacts/veroxa`
- verification scripts whose only or primary subject was that retired application

Preserved as active source and evidence:

- `artifacts/veroxa-sites` as the sole deployable Veroxa application source
- `artifacts/veroxa/docs` as operating memory, release evidence, and historical decision lineage
- `supabase` as the canonical database migration, function, and policy source
- the current API, release, source-truth, Sites, Supabase, identity, and readiness guardrails

The deleted runtime is not a deployment path, rollback path, workspace package, branch-held fallback, or recoverable working-tree archive. Immutable Git commit history retains authorship and audit lineage; it must not be reintroduced as active source without a new explicit product decision and review.

This cleanup changes no Sites runtime, performs no Sites deployment, applies no database migration, enables no provider, and authorizes no external publishing or Momo activation.
