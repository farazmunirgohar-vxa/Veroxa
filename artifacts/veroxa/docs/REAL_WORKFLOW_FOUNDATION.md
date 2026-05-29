# Real Workflow Foundation

This document describes the production-shaped workflow foundation that powers the
Veroxa OS Client ↔ Team workflow. It replaces the earlier "AI/automation
preview" framing with a real, swappable data model and repository.

## Goal

Move Veroxa from an illustrative preview into a real workflow foundation that:

- Models client submissions and the team's execution lifecycle in a
  production-shaped way.
- Persists through a repository/storage abstraction that can be swapped to a
  real backend (e.g. Supabase) later **without changing any page**.
- Keeps a temporary browser persistence layer behind the repository for now
  (backend pending).
- Uses rule-based AI only — deterministic preparation, no external model calls,
  no auto-sending, no publishing. Human/team approval is required before
  anything becomes client-facing.

## Where it lives

```
src/lib/workflow/
  workflowTypes.ts       # WorkflowItem + lifecycle/status/type unions, input types
  workflowStatus.ts      # lifecycle → client-visible / internal status derivation
  workflowActivity.ts    # activity event helpers (client-safe vs internal-only)
  workflowStorage.ts     # temporary browser persistence + subscribe (backend pending)
  workflowRepository.ts   # PUBLIC API — pages call these functions only
```

Import the repository directly:

```ts
import {
  createWorkflowItem,
  getClientWorkflowItems,
  getTeamWorkflowItems,
  subscribeToWorkflow,
} from "@/lib/workflow/workflowRepository";
```

> **Note:** Import from `@/lib/workflow/workflowRepository` directly. Do **not**
> route this through `lib/repositories/index.ts` — that barrel already exports a
> separate, read-only `workflowRepository` and the names collide.

## Data model

A `WorkflowItem` carries:

- Identity + ownership: `workflowItemId`, `clientId`, `clientName`,
  `restaurantName`, `submittedBy`, timestamps.
- Type: `media_upload | client_request | clarification_response | report_note |
  content_draft | schedule_prep | report_source`.
- Three status views derived from one `lifecycleStatus`:
  - `clientVisibleStatus` — friendly, client-safe label.
  - `internalTeamStatus` — what the team sees.
  - `lifecycleStatus` — the source of truth.
- Rule-based AI prep fields (`aiStatus`, `aiConfidenceLevel`, `aiOutputSummary`,
  `aiRecommendedNextAction`, `aiRiskFlags`, `automationReadiness`,
  `approvalGate`).
- Flow tracking: `contentDraftStatus`, `schedulePrepStatus`,
  `reportInclusionStatus`, `teamDecisionStatus`, `nextTeamAction`,
  `nextClientAction`, `fileStorageStatus`.
- `activityEvents[]` — a per-item timeline; each event is marked client-safe or
  internal-only.

## Lifecycle

```
submitted
  → team_reviewing → ai_prepared
  → ready_for_content_prep → content_draft_ready → scheduling_prep_ready
  → completed → report_ready → included_in_report
(branches) needs_client_input, blocked
```

Status derivation lives in `workflowStatus.ts`:

- Client-safe statuses: Submitted, Being reviewed, Needs your input, Prepared by
  Veroxa, In progress, Completed, Included in report.
- Internal-only events (e.g. blockers, internal notes) are never surfaced to the
  client side.

## Repository API (summary)

Reads: `getClientWorkflowItems`, `getTeamWorkflowItems`, `getWorkflowItemById`,
`getTeamWorkflowItemsByLifecycle`, `getClientItemsNeedingInput`,
`getTeamWorkflowSnapshot`.

Writes (every one a human/team or client action — nothing auto-sent):
`createWorkflowItem`, `updateWorkflowItemStatus`, `addWorkflowActivityEvent`,
`requestClientClarification`, `addClientClarificationResponse`,
`markReadyForContentPrep`, `markContentDraftReady`, `markSchedulePrepReady`,
`markCompletedForReport`, `markBlocked`, `markReportReady`,
`markIncludedInReport`.

Reactivity: `subscribeToWorkflow(listener)` — pages re-render on change. The
common pattern is `useState(() => getter())` + `useEffect(() =>
subscribeToWorkflow(refresh))`.

## Seeding

On first read the repository seeds itself once from the existing demo
submissions (`demoClientTeamSubmissions`) so the team portal is not empty on
first load. New client submissions are first-class items, not seed data.

## Where it is wired

Client portal:

- `client-media` — submit into the workflow (storage pending) with a note.
- `client-dashboard` — active items grouped by client-visible status.
- `client-updates` — client-safe activity timeline.
- `client-requests` — respond to clarification requests.
- `client-reports` — completed / report-ready items (no invented metrics).

Team portal (via `components/TeamWorkflowPanel.tsx`):

- `team-dashboard` — workflow command center.
- `team-upload-inbox` — uploads in the workflow (accept / ask client).
- `team-work-queue` — lifecycle queue with content/schedule/complete actions.
- `team-direction-queue` — items needing client direction.
- `team-report-queue` — report-source items (complete → report ready → included).

## Constraints honored

- No cloud storage, no Supabase writes, no publishing, no social, no
  auto-messaging, no payments, no notifications, no new public routes, no fake
  images.
- AUTH_MODE stays placeholder/dev. Any `OPENAI_API_KEY` use stays server-side
  only; the workflow AI prep here is rule-based and local.
- Owner/Operator surfaces are parked and hidden; the Free Audit / Google Places
  / web presence scanner / auth flows are untouched.

## Swapping to a real backend

Because pages only call the repository functions, a future backend swap means
re-implementing `workflowStorage` (and, if needed, the persistence calls inside
`workflowRepository`) against the real backend. No page changes are required.
See `FUTURE_BACKEND_CONTRACT.md`.
