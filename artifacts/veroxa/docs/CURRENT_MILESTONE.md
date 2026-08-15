# Current Milestone — Production Image Inspection to Internal Ready Proof

Active outcome: prove one private restaurant media cycle without an external
write:

`upload → byte verification → canonical identity → private assessment → grounded package → Ready → Team decision → non-publishing evidence → client status → report`

## Current checkpoint

The original image-inspection repair merged in PR #188 as
`085263c39f76ad0710eb4a2a15042e3b31b40af4`, was mirrored to Sites version 57,
and its forward Supabase migration was applied. The first private synthetic
preflight run failed before fixture persistence because its embedded JPEG
fixture was invalid. That result does **not** prove the repaired dependency and
does not consume the IMG_4257 retry.

The only active change is a narrow fixture-integrity repair on
`agent/fix-preflight-fixture-integrity-20260815`. It replaces the invalid
fixture with a valid deterministic 3×2 JPEG, verifies bytes/hash/MIME/dimensions
in tests, and exposes only fixed non-secret fixture failure codes.

## Strict next sequence

1. Open and review the scoped fixture-integrity PR; require exact-head CI,
   source review, and no unrelated diff.
2. Merge only when green; mirror the exact reviewed Sites application tree and
   deploy it.
3. Run exactly one new private synthetic preflight. It must prove signed
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
