# Current Milestone — R3 Pre-Intervention Readiness

This document is the controlling written R3 authority. Live verified evidence
comes first, the ordered R3 Linear program comes second, exact reviewed code
and evidence come third, and older release documents are historical context.

## Active outcome

Prove the first manual Momo acceptance test is safe only after every R3 gate
passes on the same current release:

`authority → live baseline → PR repair → CI/security proof → convergence → synthetic upload → authenticated portals → separate Team decision → final gate`

## Verified checkpoint

- GitHub `main` is `a05e7a79b2c527ff93a4c3810afc6ada193fce6c`.
  PR #193 is the current candidate only; it is not merged, deployed, or
  production authority. PR #187 remains deferred and unmerged.
- Sites v59 deployment `appgdep_6a8016eee874819184f031daa896048c`
  is the last conclusively proven production deployment. Saved v60 is not
  deployment proof.
- Production Supabase is healthy with 59 observed migrations. The acceptance
  migration in PR #193 is unapplied candidate source.
- IMG_4257 is terminal, immutable, read-only, non-Ready, and has zero retries.
  Never retry, reprocess, resubmit, move, replace, delete, re-upload, or use it
  as a fixture.

## Locked boundary

- `ready_for_team_review` is an internal evidence state, not approval,
  scheduling, publication, or an external action.
- Momo remains the free founding pilot.
- Publishing, provider writes, review replies, messaging, website/listing/menu
  writes, advertising, external scheduling, customer contact, account
  connection, and repository-visibility changes remain fail-closed.
- Only a new, clearly labeled synthetic asset in a separate internally owned
  test restaurant may be used for the later acceptance proof.

## Required sequence

1. VER-20 — freeze authority and correct stale active documentation.
2. VER-21 — reconcile exact live GitHub, Sites, Supabase, Linear, and
   non-secret integration evidence; classify discrepancies.
3. VER-22 through VER-27 — complete only the dependent repair, CI, security,
   convergence, synthetic-proof, and authenticated-portal gates.
4. VER-28 — issue founder GO only after all gates are simultaneously green on
   the exact current release.

The old private-media candidate guard must not be weakened or broadened.
PR #193 already contains the guard-permitted AGENTS.md, active-documents index,
current build/status, and current milestone entry-point corrections. Those
links become repository authority only when the exact reviewed PR #193 head is
green and merged under VER-22 through VER-25. Until then this file is the
recorded R3 checkpoint, not proof that the candidate or its release is live.

If evidence is missing or conflicting, preserve the checkpoint and identify
the smallest safe repair or approval. No real Momo media processing,
production migration, deployment, external-provider action, or customer-facing
write is authorized by this milestone alone.

## Historical record

CURRENT_STATE.json, deployment manifests, and older date-stamped sections are
evidence inputs only until R3-02 revalidates their exact claims.
