# Current Milestone — R3 Authenticated Acceptance Proof

This is the controlling written R3 authority. Read `CURRENT_STATE.json`, then
`VEROXA_LIVE_STATUS_CLOSEOUT_20260822.json`. Exact current connected-platform
evidence outranks this written snapshot; the ordered Linear program comes next;
exact reviewed source and historical records follow.

## Current verdict

**NOT READY — R3 authenticated acceptance gates remain open. No Momo or
founder GO is claimed.**

The reviewed release is merged and the production runtime is converged. The
next blocked outcome is one explicitly authorized, least-privileged synthetic
Client authentication proof against the preserved expired session. It must
prove authentication succeeds while immutable expiry/state enforcement rejects
the request, creates no new acceptance/output rows, preserves the current
aggregate upload-session snapshot at four total sessions (one initiated and
three expired), and keeps registered-session, asset, package,
provider-connection, publish-queue, and publish-attempt counts at zero. The
named preserved expired blocker session remains separately identity-bound and
immutable by `CURRENT_STATE.json` and the machine closeout.

The remaining ordered program is:

`VER-43 authentication proof → VER-39 bridge proof → VER-26 synthetic acceptance → VER-27 authenticated portals and Team decision → VER-28 founder gate`

VER-41 remains Todo and re-scoped behind VER-43 and VER-39.

## Verified live checkpoint

- **GitHub:** PR #205 merged as
  `c47920dce981478d757a3cc89ef9f337c39908ef`, tree
  `1303518c22c5ff40daabc5b8f68803a02d30b8c8`. All four exact-head workflows
  passed. Copilot was the sole assigned code reviewer and its final re-review
  recommended approval with zero new findings; this is not represented as a
  formal human approval.
- **Edge:** `momo-content-ai-lifecycle` v15 is ACTIVE with intentional
  in-handler authentication (`verify_jwt=false`). Its three deployed source
  files exactly match the merged repository source. No v15 proof invocation
  has occurred. The other four active function versions and their source bytes
  were unchanged from the prior exact-parity checkpoint.
- **Sites:** v68 deployment `appgdep_6a894fe379108191a767de502d56d5bd`
  succeeded from internal source commit
  `8ed3dc93be34a5f889aba4e911170f29c6999148`. Its 248-file runtime subtree
  (`926e3a10e081e9b5f8924783add85cb022afc75549272352e9e416b53e3b1504`)
  matches `artifacts/veroxa-sites` at the merged GitHub main. Environment
  revision 30, both custom domains, provider status, and SSL are active;
  post-deploy error logs were empty.
- **Supabase:** project `mwqkhsvdezeykdpqhqec` is `ACTIVE_HEALTHY` on plan
  `pro` with 60 applied migrations. External provider, review, website,
  scheduling, publishing, and acceptance external-write controls remain
  disabled. Acceptance still contains four sessions, zero registered sessions,
  and zero assets or packages.
- **Security evidence:** the private application schema has 26 tables, six
  without table-level RLS, and zero schema/table grants to PUBLIC, `anon`, or
  `authenticated`. The no-RLS count is a defense-in-depth advisory, not evidence
  of public exposure.

## Active blocker and authority boundary

The preserved synthetic session
`45ad07a3-0192-452b-8a01-5d5bf8528ced` remains expired and unregistered. The
single proof remains unconsumed. Connected reads expose no reusable Client
bearer/refresh authority and no normally configured proof-runner wake
credential. The prior v14 request returned 403; no request has reached v15.

Do not rewrite, register, delete, or otherwise mutate the preserved session. A
fresh, explicit one-shot authorization is required before creating one
short-lived, least-privileged synthetic Client session or sending the one
no-new-media proof. Broad project authority does not substitute for that exact
authorization. Revoke the temporary session after the proof.

## Incomplete gates

- VER-43 and VER-39 remain In Progress until exact authenticated rejection and
  bridge evidence exists.
- VER-26 synthetic success, integrity, isolation, replay/deduplication,
  concurrency, retry/dead-letter, controlled failure, lineage, cost, and
  zero-external-action evidence remain incomplete.
- VER-27 authenticated Client/Team portal proof and the separate Team decision
  remain incomplete.
- VER-28 is founder-only and incomplete. `momoGo=false`; automation and agents
  must not impersonate this decision.

## Locked boundary

- `ready_for_team_review` is internal evidence, not approval, scheduling,
  publication, provider authority, or founder GO.
- Publishing, provider writes, review replies, messaging, website/listing/menu
  writes, advertising, external scheduling, customer contact, account
  connection, pricing changes, and repository-visibility changes remain
  fail-closed.
