# Current Milestone — Production Image Inspection to Internal Ready Proof

Active outcome: prove one private restaurant media cycle without an external
write:

`upload → byte verification → canonical identity → private assessment → grounded package → Ready → Team decision → non-publishing evidence → client status → report`

## Current checkpoint

PR #189 merged the fixture-integrity repair as
`1c5db2ca1e03d1f8e09e63f171550cf6cd35df45` and Sites version 58 is live from
private mirror source `12213194b7aae365c35c1524c715e3092454ce1e`. The next
private synthetic preflight created and read back its valid 3×2 JPEG fixture,
then failed at the signed Storage transform request with
`storage_transform_request_rejected`. The durable diagnostics have no response
status, so this is not proof that Storage transformations are unavailable and
does not consume the IMG_4257 retry.

The hourly trigger is disarmed. The only active change is a narrow
fail-closed follow-up on `agent/fix-storage-transform-redirect-20260815`: use
manual redirect handling so an unexpected redirect is recorded as a bounded
non-success response instead of an opaque network exception. It does not follow
redirects and it does not change media, rights, Ready, or external-action code.

## Strict next sequence

1. Open and review the scoped storage-transform follow-up PR; require exact-head CI,
   source review, and no unrelated diff.
2. Merge only when green; mirror the exact reviewed Sites application tree and
   deploy it.
3. Run exactly one manually controlled private synthetic preflight. It must prove signed
   delivery, create-only fixture storage, full byte readback, Storage transform
   inspection, durable completion evidence, and fail-closed behavior.
4. Only after that production preflight passes, perform the one permitted
   IMG_4257 retry using the existing bytes/object/version.
5. Preserve any truthful IMG_4257 exception. If technical proof of `Ready` is
   still needed, use a clearly marked synthetic fixture rather than changing
   IMG_4257.
6. Complete the private Momo internal cycle before R2, broad portal work, or a
   naming refactor.

## Non-negotiable controls

- IMG_4257 must not be deleted, re-uploaded, replaced, or retried early.
- `Ready` remains separate from Team approval, schedule-ready, scheduling, and
  publication.
- External publishing, scheduling, account connection, outreach, messaging,
  pricing changes, and repository-visibility changes remain locked.
- The restaurant has no normal action after a valid upload.
