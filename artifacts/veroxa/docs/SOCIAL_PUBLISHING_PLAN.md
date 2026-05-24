# Social Publishing Plan

> **Docs only.** Veroxa has **no publishing integration** today. The
> calendar (`/demo/client/calendar`) is display / demo / read-only.
> There are no Instagram, Facebook, TikTok, or Google Business Profile
> API calls in the frontend.

## Current state

- No publishing integration.
- Calendar is display / demo / read-only.
- No Instagram / Facebook / TikTok / Threads / X API calls.
- No platform tokens stored anywhere in the frontend.

## Future phases

### Phase 1 — Manual posting workflow

- Veroxa prepares content (concept → draft → approval → ready).
- A human posts to each platform manually.
- Veroxa tracks the resulting status (`published`, `failed`)
  internally — added in a later phase.
- **No platform API calls yet.**

### Phase 2 — Semi-automated scheduling

- Internal scheduled posts (`scheduled` state, slot assignments).
- Team / operator approval gates remain in place.
- Optional integration with a third-party publishing tool — still
  not direct platform APIs.

### Phase 3 — Direct platform API publishing

- Meta Graph API (Instagram + Facebook).
- TikTok API.
- Google Business Profile API.
- Requires:
  - per-client platform connections,
  - server-side token storage,
  - retries with idempotency keys,
  - failed-post handling,
  - audit logs for every publish attempt.

## Requirements before real publishing

- [ ] Real auth and `user_profiles` in place.
- [ ] Per-client platform connection model (`client_platforms`)
      reviewed and locked.
- [ ] Platform OAuth tokens stored **server-side only** (never in
      the frontend bundle, never in `localStorage`).
- [ ] Idempotency keys on every publish request.
- [ ] Failed post handling surfaced to the operator
      (`/operator/failed-posts`).
- [ ] Audit log row for every publish attempt (success or failure).
- [ ] Human approval gates wired in:
  - team approves draft,
  - operator approves post,
  - then publish runs.

## Hard rules

- **Never auto-publish without explicit human approval.**
- **Never expose platform tokens to the frontend.**
- **Failed posts must be visible to the operator** and recoverable
  via retry, not silently dropped.
- **All publishes must be auditable** — who triggered, when, which
  platform, success / failure, payload reference.

## Cross-references

- `docs/WORKFLOW_STATE_MACHINES.md` (Post state machine)
- `docs/AI_AGENT_ARCHITECTURE_PLAN.md`
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md`
- `docs/FIRST_WRITE_SURFACE_PLAN.md`
