# Post-PR120 Full Code Review Fixes

Status: cleanup/fix-forward doc for the post-PR120 repository review.

## Why this exists

The post-PR120 review found source-of-truth drift:

- PR #118, PR #119, and PR #120 are already merged, but some docs still used older future/immediately-prior wording.
- `MOMO_OWNER_WALKTHROUGH.md` still looked like an active guide even though the current operating truth says the Momo owner walkthrough remains blocked.
- `MOMO_PILOT_LAUNCH_QA.md` still looked like an active manual launch checklist even though PR #120 is the current internal dry-run/go-no-go review surface.
- `AGENTS.md` needed a shorter post-PR120 operating lock.

## What this cleanup fixes

- Reclassifies `MOMO_OWNER_WALKTHROUGH.md` as historical/stale blocked reference only.
- Reclassifies `MOMO_PILOT_LAUNCH_QA.md` as historical/stale blocked reference only.
- Updates `scripts/src/check-momo-pilot-launch-qa.ts` so those stale docs cannot drift back into active launch/walkthrough wording.
- Refreshes `AGENTS.md` with the post-PR120 operating lock.
- Refreshes `ACTIVE_DOCS_INDEX.md` with the full PR #99 through PR #120 sequence and current blocked activation/walkthrough truth.
- Cleans PR #118, PR #119, and PR #120 doc wording so merged work is no longer described as merely future or immediately prior.

## Current operating truth preserved

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Roles remain `client` and `team` only.
- Momo owner walkthrough remains blocked.
- No next activation PR is approved by default.
- Future real-world activation, real-auth activation, external platform setup, owner walkthrough, or client exposure requires separate explicit Faraz approval.
- Public/customer-visible actions require Veroxa/Faraz approval before anything goes live.
- Business-truth changes require owner/client confirmation before public/customer-visible use.
- Media usage rights require owner/client confirmation before public/customer-visible use.
- Sensitive claims are blocked until owner-confirmed.

## No product activation

This cleanup is documentation/guardrail alignment only. It does not change app activation state, auth mode, external platform behavior, AI generation behavior, payment behavior, scheduled jobs, or client visibility.
