# M025B — Team Direction Queue dev write connection (local/session fallback)

## Purpose

Connect the Team Direction Queue status action handler to
`veroxaWriteAdapter.updateDirectionStatus` as an optional, non-breaking layer
**on top of** the existing local/session-first status update behavior.

## What was connected

- `src/pages/team-direction-queue.tsx` — `updateStatus` converted to `async`:
  1. Updates local state or `localDirectionStore` first (unchanged behavior).
  2. If `WRITES_ENABLED` is false → stops; shows "saving is disabled" message.
  3. If direction item id is not a valid UUID → skips dev write; shows safe message.
  4. Calls `veroxaWriteAdapter.updateDirectionStatus({ directionId, nextStatus, internalNote })`.
  5. On success → shows "updated locally and to dev database."
  6. On failure → shows safe warning; local status update is kept.
  Per-card `DirectionWriteStatus` state displayed as a small `[10px]` message.

- `src/pages/client-direction-center.tsx` — banner wording updated (only change
  in this build for that file).

## Local/session-first rule

Local state is always updated first. The Supabase write is best-effort.
A Supabase failure never rolls back the local status update or breaks
the team workflow.

## Dev writes only if both dev write flags are set in non-production

Only the exact string `"true"` enables the dev write path. Default
behavior is unchanged.

## Direction status writes only

Only `updateDirectionStatus` is called. `createTeamReviewDecision` is not
called in this build. See below for why.

## Why non-UUID local/demo ids are skipped

Demo fixture items use non-UUID string ids (e.g. `"dir-001"`). Local
session items use ids from `addLocalDirectionRequest`, which also
generates non-UUID strings. Supabase `direction_requests.id` is a UUID FK.
Sending a non-UUID id would cause a DB error. `isValidUuid()` from
`devClientIdValidation.ts` guards every dev write attempt.

This is expected: M025A saves local direction items with local ids and
does not yet read back the Supabase-assigned UUID. A future build
(M025C or later) can implement id read-back to unlock dev write paths for
locally-originated items.

## Why local status still updates even if DB update fails/skips

The team's session flow must never be blocked by a DB issue. The local
update is committed unconditionally; the DB write is supplementary. This
mirrors the client-side rule from M025A.

## Why Team Review Decision writes are deferred

`createTeamReviewDecision` requires a `restaurantId` UUID. Most direction
items at this stage do not have a real dev UUID for either `restaurantId`
or the direction item itself. Attempting the write would almost always
skip or fail. It is cleaner to defer to a future build when both UUID
values are reliably available after M025C id read-back or after a dev
client UUID mapping is established.

## What remains local/demo only

- Restaurant Upload Flow — not connected to writes.
- Team Upload Inbox actions — not connected to writes.
- Storage upload — not added.
- AI / publishing / ads / payments — not connected.

## Direction status action mapping

| Button              | Local status set | DB nextStatus sent |
|---------------------|------------------|--------------------|
| Mark Interpreted    | interpreted      | interpreted        |
| Send to Content Plan| in_team_review   | in_team_review     |
| Send to Google Action | in_team_review | in_team_review     |
| Send to Ads Planning| in_team_review   | in_team_review     |
| Mark Completed      | completed        | completed          |

All values are valid `direction_requests.status` enum values from M024A.

## UI write status type

```ts
type DirectionWriteStatusKind =
  | "idle" | "local_updated" | "dev_write_attempting"
  | "dev_write_saved" | "dev_write_skipped" | "dev_write_failed";
```

Displayed per-card as a `[10px]` text line. Green for success, muted for all
other states. Raw DB errors never reach the UI.

## Next safe step

- M025C — implement direction id read-back so locally-submitted items receive
  their Supabase UUID, enabling dev status writes for session-originated items.
- M026 — connect Restaurant Upload metadata writes with local fallback.
