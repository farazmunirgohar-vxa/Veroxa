# Future Backend Contract

> **Update (2026-05-29) — Execution Intelligence & Growth Flywheel.** Two new
> rule-based engines anticipate backend fields they do **not** yet persist:
> execution health/dimension scores, retention-risk records (level, reason,
> client-safe + team-only wording, `humanApprovalRequired`), client-success-fit
> classifications, and `ExecutionOutcomeRecord`s feeding retention-informed
> targeting. All local/production-shaped today; no real cloud writes. See
> `EXECUTION_INTELLIGENCE_ENGINE.md` and `VEROXA_GROWTH_FLYWHEEL.md`.

> **Update (2026-05-29).** The workflow data model now exists in code behind a
> repository + swappable storage layer (`REAL_WORKFLOW_FOUNDATION.md`). Cloud
> persistence is still pending — today the storage layer uses temporary browser
> persistence. Swapping to a real backend means re-implementing the storage
> layer only; pages call the repository and need no changes.

> **Purpose.** Captures the future backend fields that the current rule-based
> build anticipates but does **not** yet persist to the cloud. Nothing here is
> implemented as a real cloud write today — these are the planned columns for
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

## 5. Lead Intelligence + Outreach (future persistence)

The Lead Intelligence + Outreach Engine is currently deterministic and local
(`src/lib/leadIntelligence/`). When the backend is activated, these would
persist behind the **same** interfaces — no UI contract change:

| Table | Key fields | Notes |
|-------|-----------|-------|
| `lead_intelligence_profiles` | `leadId`, `segment`, `scoreDims`, `overallScore`, `computedAt` | Snapshot of a rule-based scoring run. |
| `lead_contact_paths` | `leadId`, `pathType`, `confidence`, `instruction` | Public-only contact methods. |
| `lead_outreach_drafts` | `leadId`, `channel`, `subject`, `body`, `mode`, `reviewedBy`, `sentBy` | Draft is never auto-sent; `sentBy` is set only after a human sends manually. |
| `lead_next_actions` | `leadId`, `label`, `detail`, `requiresHumanReview`, `completedAt` | lead → audit → onboarding playbook steps. |

Invariants carry over: no auto-send/call/text, public/audit data only, no
confirmed-spend claims, human review before any outreach. See
`OUTREACH_COMPLIANCE_GUARDRAILS.md`.

## 6. Self-improving lead engine (future persistence)

The learning layer is currently deterministic and local (logged outcomes →
cautious signals). It is production-shaped today so a backend can mirror it 1:1
with no UI contract change. See `SELF_IMPROVING_LEAD_ENGINE.md`.

| Table | Key fields | Notes |
|-------|-----------|-------|
| `lead_outcomes` | `leadId`, `segment`, `outreachAngleId`, `channel`, `responseStatus`, `stageReached`, `objection`, `predictedOpportunityAtOutreach`, `loggedBy`, `createdAt` | One row per human-logged outreach result. Mirrors `LeadOutcomeRecord`. |
| `lead_learning_signals` | `groupType` (segment/angle/channel), `groupKey`, `sample`, `conversionRate`, `confidence`, `computedAt` | Derived; cached snapshot of `computeLearningSignals`. |
| `lead_score_adjustments` | `segment`, `adjustment`, `confidence`, `applied`, `computedAt` | Bounded (±10) adjustment per segment; `applied=false` below the sample threshold. |
| `outreach_angle_results` | `outreachAngleId`, `sample`, `conversionRate`, `confidence` | Per-angle outcome rollup for outreach recommendations. |
| `lead_objection_patterns` | `segment`, `objection`, `count` | Observed objection frequency for cautious preparation guidance. |
| `lead_prioritization_snapshots` | `leadId`, `priorityScore`, `band`, `recommendedLeadAction`, `confidence`, `historicalAdjustment`, `computedAt` | Snapshot of a prioritisation run. |
| `suppression_list` | `leadId`, `reason`, `addedBy`, `addedAt` | Hard-no / do-not-contact leads; always excluded from outreach prep. |

Invariants carry over: outcome logging is a human action that contacts no one;
learned patterns are signals not rules; adjustments are bounded and
confidence-labelled; cautious language only.
