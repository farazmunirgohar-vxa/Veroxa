# M023B — Write Function Specification

Contracts for the future Supabase write functions that the Veroxa
write adapter will expose. These specs are the source of truth that
both the `disabledWriteAdapter` (current build) and the future
`supabaseDevWriteAdapter` (M023C+) must satisfy.

All functions return `WriteResult<T>` as defined in
`src/lib/data/writeAdapterTypes.ts`:

```ts
type WriteResult<T> =
  | { ok: false; status: "disabled"; safeMessage: string; reason: string }
  | { ok: false; status: "failure"; safeMessage: string; retryable: boolean }
  | { ok: true;  status: "success"; data: T };
```

Common requirements:

- **Client-safe error messages only.** Never surface raw DB errors.
- **No service role key in the frontend.** Adapters use anon/auth
  contexts only.
- **No storage upload here.** Storage uploads are a separate later
  build (M023E).
- **In the current build, every function returns the disabled
  result.** No network, no Supabase, no fetch.

---

## 1. createUploadSubmission(input)

**Purpose.** Persist a single upload submission row created by a
restaurant employee using a Restaurant Upload Key.

**Input fields.**
- `restaurantId: string` (uuid)
- `uploadKeyId: string | null`
- `category: FirstClientUploadCategory`
- `priority: FirstClientUploadPriority`
- `note: string | null` (sanitized client-side)
- `submittedByLabel: string | null`

**Output (success).** `FirstClientUploadSubmission` with `id`,
`status: "received"`, `created_at`, `updated_at`.

**Safety checks.**
- Requires an active Restaurant Upload Key session (server-validated).
- Requires `restaurantId` matches the upload key's restaurant.
- Note must already be sanitized client-side; server rejects raw
  emails/phones/handles as a defense-in-depth check.

**Failure behavior.**
- Key revoked → `failure`, `retryable: false`,
  `"This upload link is no longer active."`
- Validation → `failure`, `retryable: false`,
  `"Some fields aren't valid. Please review and try again."`
- Transient → `failure`, `retryable: true`,
  `"Could not save right now. Please try again."`

**Gating.** Restaurant key session + dev write flag.

---

## 2. createDirectionRequest(input)

**Purpose.** Persist a Client Direction Center submission.

**Input fields.**
- `restaurantId: string`
- `focus: FirstClientDirectionFocus`
- `channel: FirstClientDirectionChannel`
- `urgency: FirstClientDirectionUrgency`
- `title: string`
- `clientNote: string` (sanitized client-side)
- `preferredTimingLabel: string`
- `relatedMediaId: string | null`
- `avoidItem: string | null`

**Output (success).** `FirstClientDirectionRequest` with `id`,
`status: "received"`, `created_at`, `updated_at`.

**Safety checks.**
- Requires authenticated client session bound to `restaurantId`.
- Note sanitized client-side; server re-applies redaction as
  defense-in-depth.

**Failure behavior.**
- Not authenticated → `failure`, `retryable: false`,
  `"Please sign in to send direction."`
- Validation → `failure`, `retryable: false`.
- Transient → `failure`, `retryable: true`.

**Gating.** Client auth + dev write flag.

---

## 3. updateUploadReviewStatus(input)

**Purpose.** Team updates the review status on an
`upload_submissions` row and writes a paired `team_review_decisions`
entry.

**Input fields.**
- `submissionId: string`
- `nextStatus: FirstClientUploadStatus`
- `internalNote: string | null`

**Output (success).** `{ submissionId, status, updatedAt }`.

**Safety checks.**
- Requires team role.
- `internalNote` is internal-only and never surfaced to client reads.
- Status transitions follow the workflow state machine; invalid
  transitions return `failure`, `retryable: false`.

**Failure behavior.**
- Not authorized → `failure`, `retryable: false`,
  `"You don't have permission to update this."`
- Invalid transition → `failure`, `retryable: false`.
- Transient → `failure`, `retryable: true`.

**Gating.** Team role + dev write flag.

---

## 4. updateDirectionStatus(input)

**Purpose.** Team updates the status on a `direction_requests` row
and writes a paired `team_review_decisions` entry.

**Input fields.**
- `directionId: string`
- `nextStatus: FirstClientDirectionStatus`
- `internalNote: string | null`

**Output (success).** `{ directionId, status, updatedAt }`.

**Safety checks.** Same shape as `updateUploadReviewStatus`.

**Gating.** Team role + dev write flag.

---

## 5. createTeamReviewDecision(input)

**Purpose.** Append a stand-alone team review decision (for cases
where the status update is implicit elsewhere, e.g. workflow stage
movement that should be journaled).

**Input fields.**
- `restaurantId: string`
- `targetType: "upload_submission" | "direction_request" | "content_workflow_item"`
- `targetId: string`
- `decision: string`
- `safeClientStatus: string`
- `internalNote: string | null`

**Output (success).** `FirstClientTeamReviewDecision`.

**Safety checks.**
- Requires team role.
- `reviewedByUserId` set from the auth session, never client-supplied.

**Failure behavior.** Same envelope as above.

**Gating.** Team role + dev write flag.

---

## Adapter behavior in the current build

All five functions are implemented in
`src/lib/data/disabledWriteAdapter.ts`. Each returns:

```ts
{
  ok: false,
  status: "disabled",
  safeMessage: "Live saving is not enabled in this build.",
  reason: explainWhyWritesDisabled(),
}
```

No network calls, no Supabase client usage, no fetch. The local
session stores (`localUploadStore`, `localDirectionStore`) remain
the only persistence path until M023C.
