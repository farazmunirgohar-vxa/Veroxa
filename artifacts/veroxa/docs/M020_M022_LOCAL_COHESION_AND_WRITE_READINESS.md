# M020–M022 — Local Cohesion and Write Readiness

## Purpose

Make the demo/local system internally coherent and prepare the safest
next step toward real Supabase writes — without adding writes yet.

## Shared local direction store (M020)

- `src/lib/direction/localDirectionStore.ts`
- `sessionStorage`-backed, key `veroxa.demo.localDirection.v1`.
- Demo-only metadata. Notes sanitized (email / phone / @handle
  redaction, 180-char cap).
- API: `getLocalDirectionRequests`, `addLocalDirectionRequest`,
  `updateLocalDirectionRequestStatus`, `clearLocalDirectionRequests`,
  `isLocalDirectionRequest`, `subscribeToLocalDirectionRequests`.

## Direction Center → Direction Queue

- Client Direction Center now writes through the shared store and
  subscribes to it.
- Team Direction Queue merges fixture + session-local items, routes
  status updates to the correct source, and exposes a
  "Clear session direction" control.
- Session note shown so the team knows what is session-only.

## Adaptive Intelligence now reads local/session signals

Recommendations on these surfaces combine fixture + session uploads
+ session direction:

- Client Direction Center sidebar
- Team Direction Queue
- Team Adaptive Intelligence
- Client Dashboard (Weekly Strategy Snapshot)
- Team Dashboard (top-3 Adaptive Team Priorities)

Each surface subscribes to both local stores so a fresh client
submission is reflected immediately.

## First-client data path (M021)

- `docs/FIRST_CLIENT_DATA_PATH.md` — narrative + visibility rules.
- `src/lib/firstClient/firstClientContracts.ts` — TypeScript types
  for restaurants, upload keys, upload submissions, media assets,
  direction requests, team review decisions, workflow status, weekly
  updates. Types only; no runtime writes.
- `src/lib/firstClient/visibilityRules.ts` — pure helpers for who can
  see what (restaurant key vs. client vs. team) and client-safe
  status labels.

## Write readiness (M022)

- `src/lib/data/writeReadiness.ts` — `WRITES_ENABLED=false`,
  `getWriteReadinessStatus`, `explainWhyWritesDisabled`.
- `docs/M023_SUPABASE_WRITES_PLAN_UPLOADS_DIRECTION_REVIEW.md` —
  scoped plan for the next build.
- Internal readiness page now shows a "Write Readiness" card.

## What remains local/demo only

- Uploads, direction submissions, team review actions, adaptive
  memory, reports / weekly updates.

## What next build (M023) should do

- M023A SQL planning only.
- M023B write adapter behind `VITE_VEROXA_ENABLE_DEV_WRITES=false`
  default.
- M023C connect upload form (metadata first).
- M023D connect team review.
- M023E storage upload (separate).

## Safety boundaries enforced this pass

- No Supabase writes; no migrations; no service role key in frontend.
- No real AI / publishing / ads / payments integrations.
- No `FormData` / fetch upload added.
- No raw file blobs / base64 in local or session storage.
- AUTH_MODE unchanged (`placeholder`).
- DATA_MODE default unchanged (`fixture`).
- Pricing unchanged.
- InternalDemoGuard intact; team routes still guarded.
- Owner / Operator portals not expanded.
- Restaurant Upload Key does not unlock Team/Owner/Operator access.
- Client Direction Center does not provide direct posting / ad
  controls.
- No `attached_assets/Pasted-*.txt` committed.
