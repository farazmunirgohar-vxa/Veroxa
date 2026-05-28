# M025A — Client Direction Center dev write connection (local/session fallback)

## Purpose

Connect the Client Direction Center submit flow to the dev write adapter
(`veroxaWriteAdapter.createDirectionRequest`) as an optional, non-breaking
layer **on top of** the existing local/session-first behavior.

## What was connected

- `src/pages/client-direction-center.tsx` — submit handler now:
  1. Saves to `localDirectionStore` first (unchanged behavior).
  2. If `WRITES_ENABLED` is false → stops; shows session-mode message.
  3. If `WRITES_ENABLED` is true → reads `VITE_VEROXA_DEV_CLIENT_ID`.
  4. If env var missing or invalid UUID → skips dev write; shows safe message.
  5. Calls `veroxaWriteAdapter.createDirectionRequest(input)`.
  6. On success → shows "saved locally and to the dev database."
  7. On failure → shows safe warning; local/session success is kept.

- `src/lib/data/devClientId.ts` — reads and validates
  `VITE_VEROXA_DEV_CLIENT_ID` from `import.meta.env`. No network.

## Local/session-first rule

`localDirectionStore` is always written first. The dev Supabase write is
a best-effort supplementary layer. A Supabase failure never rolls back
the local/session submission or breaks the user flow.

## Dev writes only if VITE_VEROXA_ENABLE_DEV_WRITES === "true"

The `WRITES_ENABLED` flag is resolved at module load from
`writeReadiness.ts`. Only the exact string `"true"` enables the dev write
path. Default app behavior is unchanged.

## Dev writes require VITE_VEROXA_DEV_CLIENT_ID

`direction_requests.restaurant_id` is a UUID FK referencing `clients.id`.
The demo string `"demo-a"` is not a UUID and would cause a FK violation.

The env var `VITE_VEROXA_DEV_CLIENT_ID` must be set to the UUID of a
fictional `clients` row in the dev Supabase project. If missing or
invalid, the dev write is silently skipped with a safe message.

## Why "demo-a" is not sent to Supabase

`clients.id` uses `gen_random_uuid()`. The local demo uses `"demo-a"` as
a stable string key. These are incompatible types. The dev write layer
reads a separate env var for the UUID rather than converting or mapping
`"demo-a"`.

## What happens if dev write fails

The safe failure envelope from `writeErrors.ts` is used. A client-safe
message is shown in the UI. The local/session direction request is kept.
Raw DB errors never reach the user.

## What remains local/demo only

- Restaurant Upload Flow — not connected to writes.
- Team Upload Inbox actions — not connected to writes.
- Team Direction Queue actions — not connected to writes.
- Storage upload — separate later milestone.
- AI / publishing / ads / payments — not connected.

## UI save status messages

- Writes disabled: "Direction saved for this demo session. Live database saving is currently disabled."
- Writes enabled, UUID missing: "Direction saved locally. Dev database save skipped because VITE_VEROXA_DEV_CLIENT_ID is not configured."
- Dev write success: "Direction saved locally and to the dev database."
- Dev write failure: "Direction saved locally. Dev database save did not complete, so the team can continue in session/demo mode."

## Next safe step

- M025B — connect Team Direction Queue status updates (updateDirectionStatus) after direction write is verified.
- M026 — connect Restaurant Upload metadata writes after direction flow is stable.
- Storage upload is a separate later milestone.

## M025B progression

M025B connects Team Direction Queue status updates to `veroxaWriteAdapter.updateDirectionStatus`, still local/session-first. Non-UUID ids (local/demo) are skipped safely. `createTeamReviewDecision` is deferred to a future build when UUID values are reliably available.
