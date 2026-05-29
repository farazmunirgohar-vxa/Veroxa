/**
 * workflowRepository.ts — the public API for the real Veroxa OS workflow.
 *
 * Pages call these functions; they never touch storage or fixtures directly.
 * The repository is production-shaped so it can later be backed by Supabase
 * without changing any page (see docs/REAL_WORKFLOW_FOUNDATION.md).
 *
 * Current phase:
 *   - Persistence runs through `workflowStorage` (backend pending).
 *   - AI preparation is rule-based and deterministic; nothing is auto-sent,
 *     auto-published, or treated as final. Human/team approval is required for
 *     anything client-facing.
 *   - Existing demo submissions seed the workflow once so the team portal is
 *     not empty on first load. New client submissions are first-class items.
 */

import {
  demoClientTeamSubmissions,
  type ClientTeamSubmission,
} from "@/data/demo/demoClientTeamWork";
import { getRestaurantName } from "@/data/demo/demoClients";
import type {
  AiAgentStatus,
  AiApprovalGate,
  AiAutomationReadiness,
  AiCategorizedRiskFlag,
  AiConfidenceLevel,
} from "@/lib/ai/aiAgentTypes";
import {
  makeActivityEvent,
  makeLifecycleActivityEvent,
} from "./workflowActivity";
import {
  deriveClientVisibleStatus,
  deriveInternalTeamStatus,
  lifecycleIsComplete,
  lifecycleIsInPreparation,
  lifecycleNeedsClientAction,
} from "./workflowStatus";
import { workflowStorage } from "./workflowStorage";
import type {
  CreateWorkflowItemInput,
  TeamDecisionStatus,
  WorkflowItem,
  WorkflowItemType,
  WorkflowLifecycleStatus,
} from "./workflowTypes";

// ===========================================================================
// ID + clock helpers
// ===========================================================================

let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq.toString(36)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ===========================================================================
// Rule-based AI preparation — deterministic, no external calls.
// If a live model were configured it would replace this; today it is the
// graceful rule-based fallback.
// ===========================================================================

interface WorkflowAiPrep {
  aiStatus: AiAgentStatus;
  aiConfidenceLevel: AiConfidenceLevel;
  aiOutputSummary: string;
  aiRecommendedNextAction: string;
  aiRiskFlags: AiCategorizedRiskFlag[];
  automationReadiness: AiAutomationReadiness;
  approvalGate?: AiApprovalGate;
}

function approvalGateForType(type: WorkflowItemType): AiApprovalGate | undefined {
  switch (type) {
    case "media_upload":
      return "media_before_use";
    case "content_draft":
      return "content_before_scheduling";
    case "report_source":
    case "report_note":
      return "report_before_client_visible";
    case "client_request":
    case "clarification_response":
    case "schedule_prep":
      return undefined;
  }
}

function deriveAiPrep(
  type: WorkflowItemType,
  lifecycle: WorkflowLifecycleStatus,
  title: string,
  clientNote: string,
): WorkflowAiPrep {
  const riskFlags: AiCategorizedRiskFlag[] = [];
  const hasContext = clientNote.trim().length > 0;

  if (!hasContext && type === "media_upload") {
    riskFlags.push({
      category: "missing_client_context",
      level: "warning",
      message: "No caption context was provided with this upload.",
      nextHumanAction: "Ask the client what this dish/moment is, or proceed with a generic angle.",
      clientInputRequired: true,
    });
  }

  if (lifecycle === "needs_client_input") {
    riskFlags.push({
      category: "client_response_needed",
      level: "warning",
      message: "Waiting on a client response before work can continue.",
      nextHumanAction: "Confirm the clarification request is clear to the client.",
      clientInputRequired: true,
    });
  }

  if (lifecycle === "blocked") {
    riskFlags.push({
      category: "blocked_workflow",
      level: "critical",
      message: "This item is blocked and cannot move forward yet.",
      nextHumanAction: "Resolve the blocker or ask the client for what's missing.",
    });
  }

  let aiConfidenceLevel: AiConfidenceLevel = "medium";
  if (lifecycleIsComplete(lifecycle) || lifecycle === "content_draft_ready") {
    aiConfidenceLevel = "high";
  } else if (
    lifecycle === "needs_client_input" ||
    lifecycle === "blocked"
  ) {
    aiConfidenceLevel = "low";
  }

  let aiStatus: AiAgentStatus = "needs_human_review";
  if (lifecycle === "blocked") aiStatus = "blocked";
  else if (lifecycleIsComplete(lifecycle)) aiStatus = "approved";
  else if (lifecycle === "needs_client_input") aiStatus = "manual_review_needed";
  else if (lifecycleIsInPreparation(lifecycle)) aiStatus = "ready";

  let automationReadiness: AiAutomationReadiness = "needs_review";
  if (lifecycle === "blocked" || lifecycle === "needs_client_input") {
    automationReadiness = "blocked";
  } else if (
    lifecycle === "ready_for_content_prep" ||
    lifecycle === "content_draft_ready" ||
    lifecycle === "scheduling_prep_ready"
  ) {
    automationReadiness = "ready";
  } else if (lifecycleIsComplete(lifecycle)) {
    automationReadiness = "not_applicable";
  }

  const typeSummary: Record<WorkflowItemType, string> = {
    media_upload: "Media reviewed and sorted; an angle can be drafted once approved.",
    client_request: "Request triaged; a recommended response is prepared for the team.",
    clarification_response: "Client response captured; ready for the team to continue the work.",
    report_note: "Note prepared for the reporting draft.",
    content_draft: "Caption and angle draft prepared for team review.",
    schedule_prep: "Posting window prepared; publishing connection is pending.",
    report_source: "Completed work prepared as a report source item.",
  };

  const recommended =
    lifecycle === "needs_client_input"
      ? "Confirm the client request and follow up."
      : lifecycle === "blocked"
        ? "Clear the blocker before continuing."
        : type === "media_upload"
          ? "Approve for content prep or ask the client for context."
          : "Review the prepared draft and approve, revise, or ask the client.";

  return {
    aiStatus,
    aiConfidenceLevel,
    aiOutputSummary: `${typeSummary[type]}${hasContext ? "" : " (No client note provided.)"}`,
    aiRecommendedNextAction: recommended,
    aiRiskFlags: riskFlags,
    automationReadiness,
    approvalGate: approvalGateForType(type),
  };
}

// ===========================================================================
// Derived-field recompute — keeps client/internal status + AI prep consistent
// whenever the lifecycle changes.
// ===========================================================================

function recomputeDerived(item: WorkflowItem): WorkflowItem {
  const prep = deriveAiPrep(
    item.type,
    item.lifecycleStatus,
    item.title,
    item.clientNote,
  );
  return {
    ...item,
    clientVisibleStatus: deriveClientVisibleStatus(item.lifecycleStatus),
    internalTeamStatus: deriveInternalTeamStatus(item.lifecycleStatus),
    aiStatus: prep.aiStatus,
    aiConfidenceLevel: prep.aiConfidenceLevel,
    aiOutputSummary: prep.aiOutputSummary,
    aiRecommendedNextAction: prep.aiRecommendedNextAction,
    aiRiskFlags: prep.aiRiskFlags,
    automationReadiness: prep.automationReadiness,
    approvalGate: prep.approvalGate,
    nextClientAction: lifecycleNeedsClientAction(item.lifecycleStatus)
      ? (item.nextClientAction ?? "Veroxa needs a quick reply from you.")
      : undefined,
  };
}

// ===========================================================================
// Seed — map existing demo submissions into workflow items once.
// ===========================================================================

function mapSubmissionType(s: ClientTeamSubmission): WorkflowItemType {
  if (s.submissionType === "media") return "media_upload";
  return "client_request";
}

function mapSubmissionLifecycle(
  s: ClientTeamSubmission,
): WorkflowLifecycleStatus {
  switch (s.status) {
    case "new":
    case "needs_review":
      return "submitted";
    case "needs_client_clarification":
      return "needs_client_input";
    case "accepted":
      return "team_reviewing";
    case "in_progress":
      return "ready_for_content_prep";
    case "blocked":
      return "blocked";
    case "completed":
      return "completed";
    case "archived":
      return "included_in_report";
  }
}

function buildSeedItem(s: ClientTeamSubmission): WorkflowItem {
  const lifecycle = mapSubmissionLifecycle(s);
  const type = mapSubmissionType(s);
  const restaurantName = getRestaurantName(s.clientId);
  const base: WorkflowItem = {
    workflowItemId: `wf-seed-${s.id}`,
    clientId: s.clientId,
    clientName: restaurantName,
    restaurantName,
    submittedBy: s.submittedBy,
    submittedAt: s.createdAt,
    updatedAt: s.updatedAt,
    type,
    title: s.title,
    clientNote: s.clientVisibleNote,
    fileName: type === "media_upload" ? "Uploaded media" : undefined,
    fileStorageStatus: type === "media_upload" ? "pending_storage" : "unavailable",
    clientVisibleStatus: "Submitted",
    internalTeamStatus: "New submission",
    lifecycleStatus: lifecycle,
    aiStatus: "needs_human_review",
    aiOutputSummary: "",
    aiRiskFlags: [],
    aiRecommendedNextAction: "",
    aiConfidenceLevel: "medium",
    automationReadiness: "needs_review",
    teamDecisionStatus: "pending",
    nextTeamAction: s.nextTeamAction ?? "Review and decide next step.",
    contentDraftStatus:
      lifecycle === "content_draft_ready" ? "draft_ready" : "not_started",
    schedulePrepStatus: "not_started",
    reportInclusionStatus: lifecycleIsComplete(lifecycle)
      ? lifecycle === "included_in_report"
        ? "included"
        : "eligible"
      : "not_applicable",
    activityEvents: [],
  };
  const withDerived = recomputeDerived(base);
  withDerived.activityEvents = [
    makeActivityEvent({
      workflowItemId: base.workflowItemId,
      actor: s.submittedBy,
      type: "created",
      summary: `${s.title} entered the workflow.`,
      clientSafeLabel: "Submitted to Veroxa",
      at: s.createdAt,
    }),
    makeLifecycleActivityEvent(
      base.workflowItemId,
      lifecycle,
      `Status set to ${lifecycle}.`,
      "team",
    ),
  ];
  return withDerived;
}

function ensureSeeded(): void {
  if (workflowStorage.isInitialized()) return;
  const seeded = demoClientTeamSubmissions.map(buildSeedItem);
  workflowStorage.writeAll(seeded);
  workflowStorage.markInitialized();
}

function readAll(): WorkflowItem[] {
  ensureSeeded();
  return workflowStorage.readAll();
}

function persist(items: WorkflowItem[]): void {
  workflowStorage.writeAll(items);
}

function patchItem(
  workflowItemId: string,
  patch: (item: WorkflowItem) => WorkflowItem,
): WorkflowItem | undefined {
  const all = readAll();
  const idx = all.findIndex((i) => i.workflowItemId === workflowItemId);
  if (idx === -1) return undefined;
  const updated = recomputeDerived({ ...patch(all[idx]), updatedAt: now() });
  const next = [...all];
  next[idx] = updated;
  persist(next);
  return updated;
}

// ===========================================================================
// Reads
// ===========================================================================

export function getClientWorkflowItems(clientId: string): WorkflowItem[] {
  return readAll()
    .filter((i) => i.clientId === clientId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getTeamWorkflowItems(): WorkflowItem[] {
  return readAll()
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getWorkflowItemById(
  workflowItemId: string,
): WorkflowItem | undefined {
  return readAll().find((i) => i.workflowItemId === workflowItemId);
}

export function getTeamWorkflowItemsByLifecycle(
  lifecycle: WorkflowLifecycleStatus,
): WorkflowItem[] {
  return getTeamWorkflowItems().filter((i) => i.lifecycleStatus === lifecycle);
}

export function getClientItemsNeedingInput(clientId: string): WorkflowItem[] {
  return getClientWorkflowItems(clientId).filter((i) =>
    lifecycleNeedsClientAction(i.lifecycleStatus),
  );
}

export interface WorkflowSnapshot {
  total: number;
  newSubmissions: number;
  needsTeamReview: number;
  needsClientInput: number;
  readyForContentPrep: number;
  schedulePrepReady: number;
  reportReady: number;
  blocked: number;
  completed: number;
}

export function getTeamWorkflowSnapshot(): WorkflowSnapshot {
  const all = getTeamWorkflowItems();
  return {
    total: all.length,
    newSubmissions: all.filter((i) => i.lifecycleStatus === "submitted").length,
    needsTeamReview: all.filter(
      (i) =>
        i.lifecycleStatus === "team_reviewing" ||
        i.lifecycleStatus === "ai_prepared",
    ).length,
    needsClientInput: all.filter(
      (i) => i.lifecycleStatus === "needs_client_input",
    ).length,
    readyForContentPrep: all.filter(
      (i) => i.lifecycleStatus === "ready_for_content_prep",
    ).length,
    schedulePrepReady: all.filter(
      (i) => i.lifecycleStatus === "scheduling_prep_ready",
    ).length,
    reportReady: all.filter((i) => i.lifecycleStatus === "report_ready").length,
    blocked: all.filter((i) => i.lifecycleStatus === "blocked").length,
    completed: all.filter((i) => lifecycleIsComplete(i.lifecycleStatus)).length,
  };
}

// ===========================================================================
// Writes
// ===========================================================================

export function createWorkflowItem(
  input: CreateWorkflowItemInput,
): WorkflowItem {
  const all = readAll();
  const restaurantName =
    input.restaurantName ?? getRestaurantName(input.clientId);
  const id = nextId("wf");
  const submittedBy = input.submittedBy ?? "client";
  const isMedia = input.type === "media_upload";
  const fileName = input.fileName
    ? input.fileName
    : isMedia
      ? input.fileCount && input.fileCount > 1
        ? `${input.fileCount} photos`
        : "1 photo"
      : undefined;

  const base: WorkflowItem = {
    workflowItemId: id,
    clientId: input.clientId,
    clientName: input.clientName ?? restaurantName,
    restaurantName,
    submittedBy,
    submittedAt: now(),
    updatedAt: now(),
    type: input.type,
    title: input.title,
    clientNote: input.clientNote ?? "",
    fileName,
    fileStorageStatus: isMedia ? "pending_storage" : "unavailable",
    clientVisibleStatus: "Submitted",
    internalTeamStatus: "New submission",
    lifecycleStatus: "submitted",
    aiStatus: "needs_human_review",
    aiOutputSummary: "",
    aiRiskFlags: [],
    aiRecommendedNextAction: "",
    aiConfidenceLevel: "medium",
    automationReadiness: "needs_review",
    teamDecisionStatus: "pending",
    nextTeamAction: "Review the new submission and decide the next step.",
    contentDraftStatus: "not_started",
    schedulePrepStatus: "not_started",
    reportInclusionStatus: "not_applicable",
    activityEvents: [],
  };

  const created = recomputeDerived(base);
  created.activityEvents = [
    makeActivityEvent({
      workflowItemId: id,
      actor: submittedBy,
      type: "created",
      summary: `${input.title} submitted into the workflow.`,
      clientSafeLabel: "Submitted to Veroxa",
    }),
  ];
  persist([created, ...all]);
  return created;
}

export function updateWorkflowItemStatus(
  workflowItemId: string,
  lifecycleStatus: WorkflowLifecycleStatus,
  summary?: string,
  actor: "client" | "team" | "ai" | "system" = "team",
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus,
    activityEvents: [
      ...item.activityEvents,
      makeLifecycleActivityEvent(
        workflowItemId,
        lifecycleStatus,
        summary ?? `Status changed to ${lifecycleStatus}.`,
        actor,
      ),
    ],
  }));
}

export function addWorkflowActivityEvent(
  workflowItemId: string,
  summary: string,
  actor: "client" | "team" | "ai" | "system" = "team",
  internalOnly = true,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    activityEvents: [
      ...item.activityEvents,
      makeActivityEvent({
        workflowItemId,
        actor,
        type: "note",
        summary,
        internalOnly,
      }),
    ],
  }));
}

export function requestClientClarification(
  workflowItemId: string,
  question: string,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus: "needs_client_input",
    teamDecisionStatus: "asked_client",
    nextClientAction: question,
    nextTeamAction: "Wait for the client to respond, then continue.",
    activityEvents: [
      ...item.activityEvents,
      makeLifecycleActivityEvent(
        workflowItemId,
        "needs_client_input",
        `Clarification requested: ${question}`,
        "team",
      ),
    ],
  }));
}

export function addClientClarificationResponse(
  workflowItemId: string,
  response: string,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus: "team_reviewing",
    teamDecisionStatus: "pending",
    nextClientAction: undefined,
    nextTeamAction: "Review the client's response and continue the work.",
    activityEvents: [
      ...item.activityEvents,
      makeActivityEvent({
        workflowItemId,
        actor: "client",
        type: "clarification_response",
        summary: `Client responded: ${response}`,
        clientSafeLabel: "Veroxa is reviewing",
        internalOnly: false,
      }),
    ],
  }));
}

export function markReadyForContentPrep(
  workflowItemId: string,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus: "ready_for_content_prep",
    teamDecisionStatus: "approved_for_content_prep",
    nextTeamAction: "Prepare the content draft.",
    activityEvents: [
      ...item.activityEvents,
      makeLifecycleActivityEvent(
        workflowItemId,
        "ready_for_content_prep",
        "Approved for content prep.",
        "team",
      ),
    ],
  }));
}

export function markContentDraftReady(
  workflowItemId: string,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus: "content_draft_ready",
    contentDraftStatus: "draft_ready",
    nextTeamAction: "Review the content draft, then move to scheduling prep.",
    activityEvents: [
      ...item.activityEvents,
      makeLifecycleActivityEvent(
        workflowItemId,
        "content_draft_ready",
        "Content draft prepared for review.",
        "team",
      ),
    ],
  }));
}

export function markSchedulePrepReady(
  workflowItemId: string,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus: "scheduling_prep_ready",
    schedulePrepStatus: "prep_ready",
    nextTeamAction: "Confirm the posting window (publishing connection pending).",
    activityEvents: [
      ...item.activityEvents,
      makeLifecycleActivityEvent(
        workflowItemId,
        "scheduling_prep_ready",
        "Scheduling prep ready.",
        "team",
      ),
    ],
  }));
}

export function markCompletedForReport(
  workflowItemId: string,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus: "completed",
    teamDecisionStatus: "completed",
    reportInclusionStatus: "eligible",
    nextTeamAction: "Eligible to include in the next report.",
    activityEvents: [
      ...item.activityEvents,
      makeLifecycleActivityEvent(
        workflowItemId,
        "completed",
        "Work completed.",
        "team",
      ),
    ],
  }));
}

export function markBlocked(
  workflowItemId: string,
  reason: string,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus: "blocked",
    teamDecisionStatus: "blocked",
    nextTeamAction: reason,
    activityEvents: [
      ...item.activityEvents,
      makeActivityEvent({
        workflowItemId,
        actor: "team",
        type: "blocked",
        summary: `Blocked: ${reason}`,
        internalOnly: true,
      }),
    ],
  }));
}

export function markReportReady(
  workflowItemId: string,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus: "report_ready",
    teamDecisionStatus: "report_ready",
    reportInclusionStatus: "eligible",
    nextTeamAction: "Verify the report draft before it becomes client-visible.",
    activityEvents: [
      ...item.activityEvents,
      makeLifecycleActivityEvent(
        workflowItemId,
        "report_ready",
        "Report draft prepared for verification.",
        "team",
      ),
    ],
  }));
}

export function markIncludedInReport(
  workflowItemId: string,
): WorkflowItem | undefined {
  return patchItem(workflowItemId, (item) => ({
    ...item,
    lifecycleStatus: "included_in_report",
    reportInclusionStatus: "included",
    nextTeamAction: "Included in the client's report.",
    activityEvents: [
      ...item.activityEvents,
      makeLifecycleActivityEvent(
        workflowItemId,
        "included_in_report",
        "Included in the client report.",
        "team",
      ),
    ],
  }));
}

// ===========================================================================
// Reactivity — pages subscribe to re-render on workflow changes.
// ===========================================================================

export function subscribeToWorkflow(
  listener: (items: WorkflowItem[]) => void,
): () => void {
  return workflowStorage.subscribe(listener);
}
