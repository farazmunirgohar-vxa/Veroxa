# Current Milestone — Production Image Inspection to Internal Ready Proof

Active outcome: prove one private restaurant media cycle without an external
write:

`upload → byte verification → canonical identity → private assessment → grounded package → Ready → Team decision → non-publishing evidence → client status → report`

## Current checkpoint

GitHub `main` is PR #191 merge
`7cb6173ce76cff840017b2b4ecfa37c31cb07a09`, with executable tree
`86afd2ac1a08d8486ea9d1bb30e8fff31478739e`. Its exact-head CI, Sites Verify,
Supabase Verify, and Veroxa Verify runs passed, but a post-merge unresolved P1
governance thread prevents treating PR #191 as complete final-review evidence.

Sites v59 deployment `appgdep_6a8016eee874819184f031daa896048c` is the last
conclusively proven publish and predates PR #191. Saved Sites v60 has exact
PR #191 application-tree parity, but no deployment ID currently binds it to the
live worker. Production Supabase is healthy at 59 migrations through repository
`20260815090000_media_inspection_preflight_canary_v1.sql`; successful intake,
canonical identity, assessment, content-AI, and Ready counts are all zero.

IMG_4257 (`05ab2303-f7ea-4056-8f75-9cd7e523a4f4`) is immutable terminal
evidence at attempt 4 with `media_recovery_completion_unavailable`. Zero retry
authority remains. Read-only inspection is permitted; retry, reprocess,
resubmit, move, replace, delete, re-upload, and Ready transition are prohibited.

The active branch `agent/veroxa-pre-intervention-proof-20260815` is a scoped
forward candidate for an expiring internal acceptance tenant, separate test
identities, truthful current-offering upload attestation, content replay
idempotency, generic authenticated portal copy, mobile proof, and exact release
evidence. It introduces no external provider or publication authority. PR #187
remains draft, unmerged, undeployed, and deferred.

## Strict next sequence

1. Finish the narrow acceptance repair and focused regression coverage.
2. Require exact-head CI, independent code/security review, and zero unresolved
   review threads. Merge only the exact reviewed head.
3. Apply only the reviewed forward migration, publish only the exact merged
   application tree, and prove every live artifact identity.
4. Create a separate labeled test restaurant and identities; use one new
   synthetic success image through the authenticated production path.
5. Prove natural Ready, exact replay idempotency, one controlled invalid
   failure, both role-authenticated portals on desktop/mobile, RLS and role
   isolation, and zero external writes.
6. Ask Faraz for one fresh Momo image only after every acceptance gate is
   evidenced. Keep PR #187 outside this path.

## Non-negotiable controls

- IMG_4257 must not be deleted, re-uploaded, replaced, or retried again.
- `Ready` remains separate from Team approval, schedule-ready, scheduling, and
  publication.
- External publishing, scheduling, account connection, outreach, messaging,
  pricing changes, and repository-visibility changes remain locked.
- The restaurant has no normal action after a valid upload.
