# RR Release Checkpoint

Status: verified reusable operational baseline through PR #143, reviewed at `009276dbbf2639dc1eb5296bf62906f9f8ac45f1` and merged at `49a5250d6ce7bd8d78f19e415641563e2260ace8`, with nine production migrations applied and verified. Sites version 9 deployed successfully from checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c`; both custom domains are active with healthy SSL. Password sign-in is user-confirmed; hosted reauthentication and old-session revocation remain unverified. Overall Momo readiness remains separately blocked.

PR #144 is the behavior-neutral repository-and-Sites-evidence continuity release for this baseline. Its database-source delta is limited to reconciling the ninth migration filename/ledger to remote version `20260713191147_momo_zero_cost_operating_rehearsal_v1.sql`; SQL, schema, content, and migration count remain unchanged at SHA-256 `07cdb0a41b3d81e23e2c9432b139ae219c2b4671fed7cd18f761d4c4d6a79f2a`. It changes no operational behavior, connection, or activation authority. Because the readiness evidence is Sites-bundled, verified Sites version 10 is required after PR #144 merges and is not already deployed. Never embed or predict PR #144's merge SHA; external GitHub PR metadata and Sites checkpoint metadata are the future authorities for the exact merged and deployed identities.

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

- PR #143 reviewed head `009276dbbf2639dc1eb5296bf62906f9f8ac45f1` is merged at operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8`; Sites version 9 is deployed from verified checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c`, all nine migrations are applied and verified, and both custom live domains are active with healthy SSL.
- PR #144 requires a separate post-merge Sites version 10 continuity checkpoint. Its merge and deployment identities remain external metadata rather than self-referential fields in the committed release record.
- `momo-readiness-tracker.json` is the repository release baseline/checkpoint. The scoped Supabase readiness rows and summary RPC are authoritative for live Team operational readiness. A verified release boundary does not imply overall Momo readiness.
- Momo’s House San Antonio is the only operational restaurant.
- Other restaurants may use only the separate Audit Center and never auto-convert.
- Deployed Sites sign-in supports approved-user passwords and secure-email-link recovery for approved active identities. Faraz confirmed password sign-in; public account creation remains disabled. Hosted reauthentication and old-session revocation are not yet verified.
- Sites is the sole deployment surface; Vercel is retired and must not be restored as a release or rollback gate.
- Client routes remain safe-empty until verified Momo records exist.
- Runtime AI, Meta/Google connections, SEO/social execution, publishing, outbound contact, and owner walkthrough remain inactive.

## Current verified delta

- PR #138 exact head `068f2c7e6bb094bb16329106ca54fed06fe66aca` passed all four workflows, clean reset, pgTAP, and lint before its SHA-locked merge and Sites deployment.
- PR #143 exact reviewed head `009276dbbf2639dc1eb5296bf62906f9f8ac45f1`, merged operational commit `49a5250d6ce7bd8d78f19e415641563e2260ace8`, ninth migration verification, and Sites version 9 checkout source `69871c51f8e80d1802539a6bca52e3ce5b4ff71c` are the current reusable operational evidence.
- PR #137's `momo_readiness_tracking` lane is retained and updated as a focused evidence delta; its static tracker is durable RR evidence while the production Team readiness view reads the scoped Supabase operating model.
- Review scope: the new operating-system migration and pgTAP coverage, canonical `momoOperationsV1` contracts, Sites Team/client data surfaces, seven-system truth guard, and controlled Auth Admin tooling.
- Client operational reads must use the explicit-auth, role-sanitized Momo snapshot RPC; internal base tables remain Team-only and raw sensitive client reads must stay denied/empty.
- Faraz's approved Gmail Team identity is confirmed, has signed in, has an active Team profile plus active Momo membership, and opened the protected Team/Momo route in Safari. The mistaken secondary identity has disabled portal access. No privileged key was exposed.
- The login runtime-config/callback repair and password extension remain deployed in the PR #143 operational release at Sites version 9. The release preserves `shouldCreateUser: false`, approved-user-only password sign-in, protected password replacement, and secure-email-link recovery. Hosted reauthentication and old-session revocation must not be described as verified until a controlled smoke proves them.
- No Momo owner truth or media rights are invented. Runtime AI, Meta, Google, publishing, and visibility monitoring are **inactive pending authorized access**.
- The nine-migration no-new-spend foundation and approved Team access delta are verified and reusable. Momo Client identity, owner truth, permissioned media, provider access, hosted reauthentication, old-session revocation, operational-history evidence, and final readiness remain separate unverified gates and must not be inferred from the green release.

The machine check verifies migration inventory, immutable applied migration checksums, scope/auth markers, and the protected file-group fingerprints. A failed fingerprint is a review-routing signal: inspect the exact diff, run only the required delta or boundary checks, then deliberately refresh the checkpoint.
