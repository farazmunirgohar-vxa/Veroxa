/**
 * workflowRepository.ts — read-only adapter that maps the existing
 * client-team workflow fixtures into the `WorkflowItem` contract.
 *
 * Read-only. No writes. No network.
 */

import {
  demoClientTeamWorkflow,
  type WorkflowItem as RawWorkflowItem,
  type WorkflowStage as RawWorkflowStage,
  type WorkflowType as RawWorkflowType,
  type WorkflowPriority as RawWorkflowPriority,
} from "@/data/workflows/clientTeamWorkflow";
import { getRestaurantName } from "@/data/demo/demoClients";
import type {
  VeroxaRole,
  WorkflowItem,
  WorkflowItemType,
  WorkflowPriority,
  WorkflowStage,
} from "@/lib/data/veroxaDataContracts";

/**
 * Map raw fixture stages → canonical operating-system workflow stages.
 * The raw vocabulary is client-facing; the contract vocabulary is
 * operations-facing.
 */
function mapStage(s: RawWorkflowStage): WorkflowStage {
  switch (s) {
    case "client_media_received":
      return "media_intake";
    case "media_review_needed":
      return "ai_quality_review";
    case "media_accepted":
      return "team_review";
    case "needs_better_photo":
      return "media_intake";
    case "draft_needed":
      return "concept_queue";
    case "draft_ready":
      return "draft_queue";
    case "team_review":
      return "internal_approval";
    case "scheduled":
      return "scheduled";
    case "marked_complete":
      return "published";
    case "needs_client_action":
      return "media_intake";
    default:
      return "team_review";
  }
}

function mapType(t: RawWorkflowType): WorkflowItemType {
  return t;
}

function mapPriority(p: RawWorkflowPriority): WorkflowPriority {
  return p;
}

function mapAssignedRole(s: RawWorkflowStage): VeroxaRole {
  if (s === "needs_client_action" || s === "needs_better_photo") return "client";
  if (s === "marked_complete") return "system";
  if (s === "scheduled") return "team";
  return "team";
}

function isBlocked(s: RawWorkflowStage): string | undefined {
  if (s === "needs_better_photo") return "Awaiting better photo from client";
  if (s === "needs_client_action") return "Awaiting client action";
  return undefined;
}

function toWorkflowItem(item: RawWorkflowItem): WorkflowItem {
  const blockedReason = isBlocked(item.stage);
  // Some fixture fields are optional or vary — fall back safely.
  // We avoid touching raw fields not in the public type to keep this loose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = item as any;
  return {
    itemId: item.id,
    clientId: item.clientId,
    businessName: getRestaurantName(item.clientId),
    workflowStage: mapStage(item.stage),
    itemType: mapType(item.type),
    priority: mapPriority(item.priority),
    title: item.title,
    description: typeof raw.detail === "string" ? raw.detail : "",
    nextAction: typeof raw.teamNextAction === "string" ? raw.teamNextAction : "",
    assignedRole: mapAssignedRole(item.stage),
    dueLabel: typeof raw.dueLabel === "string" ? raw.dueLabel : "",
    blockedReason,
  };
}

export function getTeamWorkflowQueue(): WorkflowItem[] {
  return demoClientTeamWorkflow.map(toWorkflowItem);
}

export function getWorkflowItemsByStage(stage: WorkflowStage): WorkflowItem[] {
  return getTeamWorkflowQueue().filter((w) => w.workflowStage === stage);
}

export function getOperatorOversightQueue(): WorkflowItem[] {
  return getTeamWorkflowQueue().filter(
    (w) =>
      w.priority === "urgent" ||
      w.priority === "high" ||
      w.workflowStage === "internal_approval" ||
      !!w.blockedReason,
  );
}

export function getBlockedWorkflowItems(): WorkflowItem[] {
  return getTeamWorkflowQueue().filter((w) => !!w.blockedReason);
}

export function getUrgentWorkflowItems(): WorkflowItem[] {
  return getTeamWorkflowQueue().filter((w) => w.priority === "urgent" || w.priority === "high");
}

export interface WorkflowSummary {
  total: number;
  urgent: number;
  highPriority: number;
  blocked: number;
  awaitingClient: number;
  inInternalApproval: number;
  scheduled: number;
  published: number;
}

export function getWorkflowSummary(): WorkflowSummary {
  const all = getTeamWorkflowQueue();
  return {
    total: all.length,
    urgent: all.filter((w) => w.priority === "urgent").length,
    highPriority: all.filter((w) => w.priority === "high").length,
    blocked: all.filter((w) => !!w.blockedReason).length,
    awaitingClient: all.filter((w) => w.assignedRole === "client").length,
    inInternalApproval: all.filter((w) => w.workflowStage === "internal_approval").length,
    scheduled: all.filter((w) => w.workflowStage === "scheduled").length,
    published: all.filter((w) => w.workflowStage === "published").length,
  };
}
