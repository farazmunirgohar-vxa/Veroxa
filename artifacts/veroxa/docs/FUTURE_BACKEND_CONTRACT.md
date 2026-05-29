# Future Backend Contract

> **Purpose.** Captures the future Supabase fields that the current
> simulated/rule-based build anticipates but does **not** yet persist. Nothing
> here is implemented as a real write today — these are the planned columns for
> when the backend is activated. See `CLIENT_TEAM_WORKFLOW_CONTRACT.md` for the
> client ↔ team work tables.

---

## 1. Lead → client onboarding handoff

Future fields linking a won Audit Lead to an active client. Today the handoff
is simulated locally (localStorage / session only) in Team Audit Leads — no
account is created and nothing is sent.

| Field | Type | Notes |
|-------|------|-------|
| `auditLeadId` | `uuid` | The originating audit lead. |
| `convertedClientId` | `uuid` | Set when the lead becomes an active client. |
| `onboardingStatus` | `text` | enum mirrors the local handoff stages. |
| `walkthroughScheduledAt` | `timestamptz` | Nullable. |
| `selectedPackage` | `text` | Recommended/selected package label. |
| `firstSevenDayFocus` | `text` | The first-7-days focus captured at handoff. |
| `humanReviewedAt` | `timestamptz` | Set when a human reviews the handoff. |

## 2. Reporting workflow

Future fields for AI-assisted reporting drafts. Today reporting drafts are
rule-based previews (or AI-assisted via `POST /api/ai/draft` when configured),
always human-verified before reaching a client.

| Field | Type | Notes |
|-------|------|-------|
| `reportType` | `text` | enum: `weekly`, `monthly`. |
| `sourceWorkItemIds` | `uuid[]` | The completed work items the draft is based on. |
| `aiDraftStatus` | `text` | Draft lifecycle status. |
| `aiDraftMode` | `text` | enum: `ai`, `rule_based_fallback`, `not_configured`, `error`. |
| `missingDataFlags` | `text[]` | Internal only — never shown to the client. |
| `humanVerificationStatus` | `text` | enum: `pending`, `verified`. |
| `approvedBy` | `uuid` | Team member who approved. |
| `approvedAt` | `timestamptz` | Nullable. |
| `clientVisibleAt` | `timestamptz` | When the report became client-visible. |

## 3. AI agent outputs, automation runs, and approvals

Future fields for persisting the structured agent outputs and automation
previews the current build produces in memory only. Nothing here is written
today — agent outputs and automation previews are recomputed from fixtures.

### `ai_agent_outputs`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` | Primary key. |
| `agentName` | `text` | Which agent produced the output. |
| `category` | `text` | enum mirrors `AiAgentOutputCategory`. |
| `confidenceLevel` | `text` | enum: `high`, `medium`, `low`. |
| `sourceInputs` | `text[]` | What the draft was based on. |
| `outputSummary` | `text` | Prepared result. |
| `recommendedNextAction` | `text` | Next human step. |
| `humanApprovalRequired` | `boolean` | Always `true`. |
| `approvalGate` | `text` | enum mirrors `AiApprovalGate`, nullable. |
| `automationReadiness` | `text` | enum mirrors `AiAutomationReadiness`. |

### `automation_runs`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` | Primary key. |
| `trigger` | `text` | enum mirrors `AutomationTrigger`. |
| `condition` | `text` | What conditions the run on. |
| `preparedAction` | `text` | What was prepared (never executed in this build). |
| `destination` | `text` | enum mirrors `AutomationDestination`. |
| `status` | `text` | enum mirrors `AutomationStatus`. |
| `blockedReason` | `text` | Nullable. |
| `futureIntegration` | `text` | The real integration execution would require. |
| `auditTrailNote` | `text` | Plain-language record of what happened. |

### `approval_gates`, `human_reviews`, `task_events`

| Table | Key fields | Notes |
|-------|-----------|-------|
| `approval_gates` | `gateType`, `subjectId`, `clearedBy`, `clearedAt` | One row per gate cleared. |
| `human_reviews` | `subjectType`, `subjectId`, `reviewerId`, `decision`, `reviewedAt` | approve / revise / reject / escalate. |
| `task_events` | `subjectId`, `eventType`, `actor`, `createdAt` | Append-only activity log. |

### `external_integration_logs`, `client_visible_statuses`

| Table | Key fields | Notes |
|-------|-----------|-------|
| `external_integration_logs` | `integration`, `direction`, `payloadSummary`, `result`, `createdAt` | Future real publishing/notification calls only. |
| `client_visible_statuses` | `subjectId`, `clientStatusLabel`, `visibleAt` | The calm, client-safe status derived from internal state. |

## 4. Invariants

- **No AI output is treated as final.** A human verifies every client-facing
  draft before it ships.
- `missingDataFlags` and other internal flags are never rendered on client
  surfaces.
- The current build adds no Supabase writes, storage, publishing,
  auto-messaging, payments, notifications, or new public routes. Audit V1 is
  preserved.
