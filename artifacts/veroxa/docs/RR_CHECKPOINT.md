# RR Release Checkpoint

Status: verified reusable baseline through PR #142 at `9a905c822f084fd2df5c9a2cb87c1a8286647e59` and deployed Sites version 8. Password sign-in is user-confirmed; hosted reauthentication and old-session revocation remain unverified. Overall Momo readiness remains separately blocked.

The current branch is reserved for planned PR #143 and is the current no-new-spend source candidate, but the pull request is not opened and not merged, its ninth source migration is not applied, and its Sites candidate is not published. Production remains the PR #142 / Sites version 8 / eight-migration baseline above. Candidate implementation and review evidence must not be treated as deployed operating evidence.

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

- PR #142 is merged at `9a905c822f084fd2df5c9a2cb87c1a8286647e59`; exact runtime source is deployed as verified Sites version 8, all eight migrations are applied, and both custom live domains are active.
- `momo-readiness-tracker.json` is the repository release baseline/checkpoint. The scoped Supabase readiness rows and summary RPC are authoritative for live Team operational readiness. A verified release boundary does not imply overall Momo readiness.
- Momo’s House San Antonio is the only operational restaurant.
- Other restaurants may use only the separate Audit Center and never auto-convert.
- Deployed Sites sign-in supports approved-user passwords and secure-email-link recovery for approved active identities. Faraz confirmed password sign-in; public account creation remains disabled. Hosted reauthentication and old-session revocation are not yet verified.
- Sites is the sole deployment surface; Vercel is retired and must not be restored as a release or rollback gate.
- Client routes remain safe-empty until verified Momo records exist.
- Runtime AI, Meta/Google connections, SEO/social execution, publishing, outbound contact, and owner walkthrough remain inactive.

## Current verified delta

- PR #138 exact head `068f2c7e6bb094bb16329106ca54fed06fe66aca` passed all four workflows, clean reset, pgTAP, and lint before its SHA-locked merge and Sites deployment.
- PR #137's `momo_readiness_tracking` lane is retained and updated as a focused evidence delta; its static tracker is durable RR evidence while the production Team readiness view reads the scoped Supabase operating model.
- Review scope: the new operating-system migration and pgTAP coverage, canonical `momoOperationsV1` contracts, Sites Team/client data surfaces, seven-system truth guard, and controlled Auth Admin tooling.
- Client operational reads must use the explicit-auth, role-sanitized Momo snapshot RPC; internal base tables remain Team-only and raw sensitive client reads must stay denied/empty.
- Faraz's approved Gmail Team identity is confirmed, has signed in, has an active Team profile plus active Momo membership, and opened the protected Team/Momo route in Safari. The mistaken secondary identity has disabled portal access. No privileged key was exposed.
- The login runtime-config/callback repair and password extension are merged through PR #142 and deployed as Sites version 8. The release preserves `shouldCreateUser: false`, approved-user-only password sign-in, protected password replacement, and secure-email-link recovery. Hosted reauthentication and old-session revocation must not be described as verified until a controlled smoke proves them.
- No Momo owner truth or media rights are invented. Runtime AI, Meta, Google, publishing, and visibility monitoring are **inactive pending authorized access**.
- The foundation and approved Team access delta are verified and reusable. Momo Client identity, owner truth, provider access, hosted reauthentication, old-session revocation, and final readiness remain separate unverified gates and must not be inferred from the green release.

The machine check verifies migration inventory, immutable applied migration checksums, scope/auth markers, and the protected file-group fingerprints. A failed fingerprint is a review-routing signal: inspect the exact diff, run only the required delta or boundary checks, then deliberately refresh the checkpoint.
