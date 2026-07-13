# RR Release Checkpoint

Status: verified reusable baseline for the deployed Momo Production Foundation V1 + Restaurant Audit Center V1 release, with a candidate delta checkpoint open for the seven-system Momo 100%-readiness build.

Read `RR_RELEASE_CHECKPOINT.json` and run `pnpm --filter @workspace/scripts run check-rr-release-checkpoint` before starting another broad RR. The checkpoint exists to reuse evidence, not to weaken review.

## Reuse rule

- If a protected boundary fingerprint is unchanged, reuse that group’s recorded review and test evidence. Do not repeat its full review.
- If only `presentation_surfaces` changed and the exact diff does not touch auth, intake, database, scope, deployment, integrations, public claims, AI, or publishing, perform a focused delta review and affected tests only.
- If `momo_readiness_tracking` changed, validate the evidence, blockers, next actions, Momo-only scope, and overall readiness rule without reopening unchanged release boundaries.
- If a `full-on-change` group changed, review that group and its direct consumers. Do not reopen unrelated unchanged groups.
- After a successful build, update the checkpoint’s source/deployment state and fingerprints together with `CURRENT_BUILD_STATUS.md` and `VEROXA_CURRENT_MILESTONE.md`.

## Full-review triggers

A full boundary review is required for changes to auth/session/allowlist/roles, RLS/schema/migrations/storage/secrets, signed public intake, non-Momo operations or audit conversion, hosting/domains/runtime, external integrations, live AI/publishing/payments, or material pricing/public promises.

## Current baseline truth

- PR #135 is merged at `184821f1b94d3801d23742c5bb7d9571e9be27e6`; exact merged source is deployed as verified Sites version 4 and both custom domains are active with active SSL.
- `momo-readiness-tracker.json` separately tracks Momo operational readiness. A verified release boundary does not imply overall Momo readiness.
- Momo’s House San Antonio is the only operational restaurant.
- Other restaurants may use only the separate Audit Center and never auto-convert.
- Sites sign-in is magic-link-only and public account creation is disabled.
- Sites is the sole deployment surface; Vercel is retired and must not be restored as a release or rollback gate.
- Client routes remain safe-empty until verified Momo records exist.
- Runtime AI, Meta/Google connections, SEO/social execution, publishing, outbound contact, and owner walkthrough remain inactive.

## Current candidate delta

- Draft PR #138 / branch `agent/momo-100-readiness`; not yet merged or deployed.
- PR #137's `momo_readiness_tracking` lane is retained and updated as a focused evidence delta; its static tracker is durable RR evidence while the production Team readiness view reads the scoped Supabase operating model.
- Review scope: the new operating-system migration and pgTAP coverage, canonical `momoOperationsV1` contracts, Sites Team/client data surfaces, seven-system truth guard, and controlled Auth Admin tooling.
- Client operational reads must use the explicit-auth, role-sanitized Momo snapshot RPC; internal base tables remain Team-only and raw sensitive client reads must stay denied/empty.
- Real Team identity provisioning is **blocked external authority** because the connector cannot call Auth Admin and no privileged server key is available. The explicit-ack server command and mock contract exist but have not been run.
- No Momo owner truth or media rights are invented. Runtime AI, Meta, Google, publishing, and visibility monitoring are **inactive pending authorized access**.
- Refresh candidate fingerprints only after the final source, SQL tests, Sites tests, and exact delta review pass. Do not relabel the candidate verified or deployed before merge, forward migration, checkpoint, domain verification, and authenticated evidence.

The machine check verifies migration inventory, immutable applied migration checksums, scope/auth markers, and the protected file-group fingerprints. A failed fingerprint is a review-routing signal: inspect the exact diff, run only the required delta or boundary checks, then deliberately refresh the checkpoint.
