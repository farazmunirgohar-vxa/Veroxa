/**
 * workflowTypes.ts — the production-shaped data model for the real Veroxa OS
 * Client ↔ Team workflow.
 *
 * This is the canonical shape every Client and Team page reads and writes
 * through `workflowRepository`. It is intentionally backend-shaped so it can
 * be swapped to Supabase tables later WITHOUT rewriting pages — see
 * `docs/FUTURE_BACKEND_CONTRACT.md` (`workflow_items`, `workflow_activity_events`).
 *
 * Current phase: persistence runs through `workflowStorage` (temporary browser
 * persistence) because the backend is pending. Nothing here publishes, sends a
 * client message, or performs an external action. AI fields are rule-based
 * preparation only and every client-facing step requires human approval.
 */

import type {
  AiAgentStatus,
  AiApprovalGate,
  AiAutomationReadiness,
  AiCategorizedRiskFlag,
  AiConfidenceLevel,
} from "@/lib/ai/aiAgentTypes";

// ---------------------------------------------------------------------------
// What kind of work a workflow item represents.
// ---------------------------------------------------------------------------

export type WorkflowItemType =
  | "media_upload"
  | "client_request"
  | "clarification_response"
  | "report_note"
  | "content_draft"
  | "schedule_prep"
  | "report_source";

export const WORKFLOW_ITEM_TYPE_LABELS: Record<WorkflowItemType, string> = {
  media_upload: "Media upload",
  client_request: "Client request",
  clarification_response: "Clarification response",
  report_note: "Report note",
  content_draft: "Content draft",
  schedule_prep: "Schedule prep",
  report_source: "Report source",
};

// ---------------------------------------------------------------------------
// Lifecycle — the single internal source of truth for where an item sits.
// Client-safe and internal-team labels are DERIVED from this (see
// workflowStatus.ts) so the two surfaces can never drift apart.
// ---------------------------------------------------------------------------

export type WorkflowLifecycleStatus =
  | "submitted"
  | "ai_prepared"
  | "team_reviewing"
  | "needs_client_input"
  | "ready_for_content_prep"
  | "content_draft_ready"
  | "scheduling_prep_ready"
  | "completed"
  | "report_ready"
  | "included_in_report"
  | "blocked";

export const WORKFLOW_LIFECYCLE_LABELS: Record<WorkflowLifecycleStatus, string> =
  {
    submitted: "Submitted",
    ai_prepared: "AI prepared",
    team_reviewing: "Team reviewing",
    needs_client_input: "Needs client input",
    ready_for_content_prep: "Ready for content prep",
    content_draft_ready: "Content draft ready",
    scheduling_prep_ready: "Scheduling prep ready",
    completed: "Completed",
    report_ready: "Report ready",
    included_in_report: "Included in report",
    blocked: "Blocked",
  };

// ---------------------------------------------------------------------------
// Client-safe status — the ONLY status vocabulary a client ever sees. Calm,
// non-technical, no scores, no internal stage names.
// ---------------------------------------------------------------------------

export type ClientVisibleStatus =
  | "Submitted"
  | "Being reviewed"
  | "Needs your input"
  | "Prepared by Veroxa"
  | "In progress"
  | "Completed"
  | "Included in report";

// ---------------------------------------------------------------------------
// Internal team status — richer vocabulary for the team portal.
// ---------------------------------------------------------------------------

export type InternalTeamStatus =
  | "New submission"
  | "AI prepared"
  | "Needs team review"
  | "Needs client input"
  | "Ready for content prep"
  | "Draft ready"
  | "Schedule prep ready"
  | "Report ready"
  | "Blocked"
  | "Completed";

// ---------------------------------------------------------------------------
// File storage — metadata-only today. No raw blobs are persisted. When real
// cloud storage connects, `stored` items carry a real `filePreviewUrl`.
// ---------------------------------------------------------------------------

export type FileStorageStatus = "pending_storage" | "stored" | "unavailable";

export const FILE_STORAGE_STATUS_LABELS: Record<FileStorageStatus, string> = {
  pending_storage: "Storage pending",
  stored: "Stored",
  unavailable: "Storage unavailable",
};

// ---------------------------------------------------------------------------
// Team decision — what a human decided about the item.
// ---------------------------------------------------------------------------

export type TeamDecisionStatus =
  | "pending"
  | "approved_for_content_prep"
  | "revised"
  | "asked_client"
  | "on_hold"
  | "blocked"
  | "completed"
  | "report_ready";

export const TEAM_DECISION_LABELS: Record<TeamDecisionStatus, string> = {
  pending: "Pending team review",
  approved_for_content_prep: "Approved for content prep",
  revised: "Revised",
  asked_client: "Asked client",
  on_hold: "On hold",
  blocked: "Blocked",
  completed: "Completed",
  report_ready: "Report ready",
};

// ---------------------------------------------------------------------------
// Sub-pipeline statuses carried on the item.
// ---------------------------------------------------------------------------

export type WorkflowContentDraftStatus =
  | "not_started"
  | "draft_ready"
  | "approved"
  | "needs_context"
  | "not_recommended";

export type WorkflowSchedulePrepStatus =
  | "not_started"
  | "prep_ready"
  | "approved"
  | "blocked";

export type ReportInclusionStatus = "not_applicable" | "eligible" | "included";

// ---------------------------------------------------------------------------
// Activity events — append-only timeline. Client surfaces only render events
// with a `clientSafeLabel` set (and `internalOnly: false`).
// ---------------------------------------------------------------------------

export type WorkflowActor = "client" | "team" | "ai" | "system";

export type ClientActivityLabel =
  | "Submitted to Veroxa"
  | "Veroxa is reviewing"
  | "Veroxa needs your input"
  | "Veroxa is preparing your content"
  | "Veroxa is preparing your report"
  | "Completed"
  | "Included in report";

export interface WorkflowActivityEvent {
  id: string;
  workflowItemId: string;
  at: string;
  actor: WorkflowActor;
  type: string;
  /** Set only for events a client may see. */
  clientSafeLabel?: ClientActivityLabel;
  summary: string;
  internalOnly: boolean;
}

// ---------------------------------------------------------------------------
// The workflow item — the production-shaped record.
// ---------------------------------------------------------------------------

export interface WorkflowItem {
  workflowItemId: string;
  clientId: string;
  clientName: string;
  restaurantName: string;
  submittedBy: "client" | "team";
  submittedAt: string;
  updatedAt: string;
  type: WorkflowItemType;
  title: string;
  clientNote: string;

  // File metadata (no blobs persisted in this phase).
  fileName?: string;
  filePreviewUrl?: string;
  fileStorageStatus: FileStorageStatus;

  // Derived, always-consistent status surfaces.
  clientVisibleStatus: ClientVisibleStatus;
  internalTeamStatus: InternalTeamStatus;
  lifecycleStatus: WorkflowLifecycleStatus;

  // Structured AI preparation (rule-based, human approval required).
  aiStatus: AiAgentStatus;
  aiOutputSummary: string;
  aiRiskFlags: AiCategorizedRiskFlag[];
  aiRecommendedNextAction: string;
  aiConfidenceLevel: AiConfidenceLevel;
  automationReadiness: AiAutomationReadiness;
  approvalGate?: AiApprovalGate;

  // Human decision + next actions.
  teamDecisionStatus: TeamDecisionStatus;
  nextClientAction?: string;
  nextTeamAction: string;

  // Sub-pipelines.
  contentDraftStatus: WorkflowContentDraftStatus;
  schedulePrepStatus: WorkflowSchedulePrepStatus;
  reportInclusionStatus: ReportInclusionStatus;

  // Append-only timeline.
  activityEvents: WorkflowActivityEvent[];
}

/** Input accepted by `createWorkflowItem` — the rest is derived. */
export interface CreateWorkflowItemInput {
  clientId: string;
  clientName?: string;
  restaurantName?: string;
  submittedBy?: "client" | "team";
  type: WorkflowItemType;
  title: string;
  clientNote?: string;
  fileName?: string;
  fileCount?: number;
}
