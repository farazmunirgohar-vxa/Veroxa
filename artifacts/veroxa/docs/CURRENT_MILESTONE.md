# Current Milestone — Production Image Inspection to Internal Ready Proof

Active outcome: prove one private restaurant media cycle without an external
write:

`upload → byte verification → canonical identity → private assessment → grounded package → Ready → Team decision → non-publishing evidence → client status → report`

## Current checkpoint

PR #190 merged the Storage-transform redirect repair as
`921e197ee27d1d2cc673e7c75c79ae1770fa6d33` and Sites version 59 is live from
private mirror source `02f536710d5493b4670684294210e76bcb05eb9d`. The one
manually controlled synthetic preflight passed with `bindingAvailable=true`, a
private transformed JPEG response of 200, and durable completion evidence.

IMG_4257 then received its one permitted retry using the unchanged source
object/version. The recovery path read the source, completed trusted image
inspection, and invoked the private completion RPC. The RPC returned HTTP 400
because the handler emitted a success verifier version added for diagnostics in
PR #185, while the immutable intake validator still requires its original
success-contract version. The receipt is terminal at attempt 4 to prevent an
automatic fifth retry. No source bytes, provider state, Ready package, or
external action changed.

The only active change is a narrow contract separation on
`agent/fix-media-verifier-contract-20260815`: successful intake records retain
the persisted v1 verifier contract, while recovery diagnostic evidence retains
its v2 version. It does not alter media, rights, Ready, provider, or
external-action logic.

## Strict next sequence

1. Open and review the scoped verifier-contract PR; require exact-head CI,
   source review, and no unrelated diff.
2. Merge only when green; mirror the exact reviewed Sites application tree and
   deploy it.
3. Use a clearly labeled synthetic fixture to prove signed delivery, full byte
   readback, Storage transform inspection, durable intake completion, and
   fail-closed recovery behavior.
4. Preserve IMG_4257's truthful terminal exception. Do not retry, replace, or
   alter it. Use synthetic media for subsequent technical proof of `Ready`.
5. Complete the private Momo internal cycle before R2, broad portal work, or a
   naming refactor.

## Non-negotiable controls

- IMG_4257 must not be deleted, re-uploaded, replaced, or retried again.
- `Ready` remains separate from Team approval, schedule-ready, scheduling, and
  publication.
- External publishing, scheduling, account connection, outreach, messaging,
  pricing changes, and repository-visibility changes remain locked.
- The restaurant has no normal action after a valid upload.
