import {
  buildClientPortalProgressSummary,
  describeClientPortalStatus,
} from "./clientSafe";
import { getClientLocalVisibilityProgress } from "./localVisibility";
import type {
  ClientJourneyItem,
  ClientJourneyItemType,
  ClientJourneyPriority,
  ClientNeedFromClient,
  ClientNextStep,
  ClientProgressSummary,
  ClientReportSummary,
} from "./types";
import {
  getClientWorkflowItems,
} from "@/lib/workflow/workflowRepository";
import type {
  ClientVisibleStatus,
  WorkflowItem,
  WorkflowItemType,
} from "@/lib/workflow/workflowTypes";
import { getPreparedActionsForClient } from "@/lib/preparedActions/preparedActionRepository";
import {
  getClientSafeActionStatus,
  getClientSafeActionSummary,
  shouldShowActionToClient,
} from "@/domain/preparedActions/clientSafe";
import type { PreparedAction } from "@/domain/preparedActions";
import { getVisibilityAuditForClient } from "@/lib/visibilityAudit";
import { getClientSafeVisibilitySummary } from "@/domain/visibilityAudit/clientSafe";

function relativeDayLabel(labelOrIso: string, now: Date = new Date()): string {
  const then = new Date(labelOrIso);
  if (Number.isNaN(then.getTime())) return labelOrIso || "Recently";
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} weeks ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function workflowStatus(status: ClientVisibleStatus): ClientJourneyItem["status"] {
  switch (status) {
    case "Submitted":
      return "Submitted";
    case "Being reviewed":
      return "In review";
    case "Needs your input":
      return "Needs your input";
    case "Prepared by Veroxa":
      return "Prepared by Veroxa";
    case "In progress":
      return "In progress";
    case "Completed":
      return "Completed";
    case "Included in report":
      return "Included in report";
  }
}

function workflowType(type: WorkflowItemType): ClientJourneyItemType {
  switch (type) {
    case "media_upload":
      return "media_submission";
    case "client_request":
      return "client_request";
    case "clarification_response":
      return "client_input_needed";
    case "content_draft":
    case "schedule_prep":
      return "content_preparation";
    case "report_note":
    case "report_source":
      return "monthly_report";
  }
}

function workflowSource(type: WorkflowItemType): ClientJourneyItem["source"] {
  switch (type) {
    case "media_upload":
    case "clarification_response":
      return "client_submission";
    case "client_request":
      return "client_request";
    case "report_note":
    case "report_source":
      return "monthly_report";
    case "content_draft":
    case "schedule_prep":
      return "veroxa_work";
  }
}

function workflowItemToJourney(item: WorkflowItem): ClientJourneyItem {
  const status = workflowStatus(item.clientVisibleStatus);
  return {
    id: item.workflowItemId,
    clientId: item.clientId,
    type: workflowType(item.type),
    source: workflowSource(item.type),
    priority: status === "Needs your input" ? "high" : "normal",
    title: item.title,
    summary: item.clientNote || describeClientPortalStatus(status),
    status,
    updatedAt: item.updatedAt,
    updatedLabel: relativeDayLabel(item.updatedAt),
    needsClientInput: status === "Needs your input",
    nextStep: item.nextClientAction,
    href: item.type === "media_upload" ? "/client/media" : "/client/requests",
  };
}

function actionType(action: PreparedAction): ClientJourneyItemType {
  switch (action.channel) {
    case "google_business_profile":
      return "google_maps_visibility";
    case "reviews":
      return "review_response";
    case "reports":
      return action.type === "weekly_update" ? "weekly_update" : "monthly_report";
    case "client_communication":
      return "client_input_needed";
    case "social_media":
    case "website":
    case "seo":
    case "internal_task":
      return "content_preparation";
  }
}

function actionStatus(action: PreparedAction): ClientJourneyItem["status"] {
  switch (action.status) {
    case "needs_client_confirmation":
      return "Needs your input";
    case "approved":
    case "queued_for_execution":
      return "In progress";
    case "executed":
      return "Completed";
    case "prepared":
    case "needs_review":
    case "edited":
      return "Prepared by Veroxa";
    case "skipped":
    case "archived":
    case "failed":
      return "In review";
  }
}

function actionPriority(action: PreparedAction): ClientJourneyPriority {
  if (action.status === "needs_client_confirmation") return "high";
  if (action.priority === "high") return "normal";
  return "low";
}

function preparedActionToJourney(action: PreparedAction): ClientJourneyItem {
  const status = actionStatus(action);
  return {
    id: `prepared-${action.id}`,
    clientId: action.clientId,
    type: actionType(action),
    source: action.channel === "google_business_profile" ? "visibility_review" : "veroxa_work",
    priority: actionPriority(action),
    title: action.type === "review_reply" ? "Review response support" : action.title,
    summary: getClientSafeActionSummary(action),
    status,
    updatedAt: action.preparedAtLabel,
    updatedLabel: action.preparedAtLabel,
    needsClientInput: status === "Needs your input",
    nextStep: getClientSafeActionStatus(action),
    href: status === "Needs your input" ? "/client/requests" : "/client/updates",
  };
}

function visibilityJourneyItem(clientId: string): ClientJourneyItem | null {
  const audit = getVisibilityAuditForClient(clientId);
  if (!audit) return null;
  const summary = getClientSafeVisibilitySummary(audit.result);
  return {
    id: `visibility-${clientId}`,
    clientId,
    type: "visibility_update",
    source: "visibility_review",
    priority: "normal",
    title: "Local visibility progress",
    summary: summary.status,
    status: "In progress",
    updatedAt: "This week",
    updatedLabel: "This week",
    needsClientInput: false,
    nextStep: "A local visibility update is being prepared.",
    href: "/client/updates",
  };
}

function buildLatestReportSummary(clientId: string): ClientReportSummary {
  const journey = getClientPortalJourney(clientId);
  const completedCount = journey.filter(
    (item) => item.status === "Completed" || item.status === "Included in report",
  ).length;
  return {
    clientId,
    latestWeeklyUpdateLabel: "Current week",
    latestMonthlyReportLabel: "This month",
    reportStatus: completedCount > 0 ? "Included in report" : "Prepared by Veroxa",
    summary:
      completedCount > 0
        ? `${completedCount} completed items are ready for your progress report.`
        : "Your next progress report is being prepared.",
    href: "/client/reports",
  };
}

export function getClientPortalJourney(clientId: string): ClientJourneyItem[] {
  const workflowItems = getClientWorkflowItems(clientId).map(workflowItemToJourney);
  const preparedItems = getPreparedActionsForClient(clientId)
    .filter(shouldShowActionToClient)
    .map(preparedActionToJourney);
  const visibilityItem = visibilityJourneyItem(clientId);

  return [...workflowItems, ...preparedItems, ...(visibilityItem ? [visibilityItem] : [])]
    .sort((a, b) => {
      const priorityOrder: Record<ClientJourneyPriority, number> = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.id.localeCompare(b.id);
    });
}

export function getClientNeedsFromYou(clientId: string): ClientNeedFromClient[] {
  return getClientPortalJourney(clientId)
    .filter((item) => item.needsClientInput || item.status === "Needs your input" || item.status === "More content needed")
    .map((item) => ({
      id: item.id,
      clientId,
      type: item.type,
      priority: item.priority,
      title: item.title,
      description: item.nextStep ?? "Veroxa needs a quick detail from you to keep going.",
      actionLabel: item.type === "media_submission" ? "Upload media" : "Open request",
      href: item.href ?? "/client/requests",
    }));
}

export function getClientRecentProgress(clientId: string): ClientJourneyItem[] {
  return getClientPortalJourney(clientId).filter(
    (item) => item.status === "Completed" || item.status === "Included in report",
  );
}

export function getClientVisibilityProgress(clientId: string) {
  return getClientLocalVisibilityProgress(clientId);
}

export function getClientNextSteps(clientId: string): ClientNextStep[] {
  const needs = getClientNeedsFromYou(clientId);
  if (needs.length > 0) {
    return needs.slice(0, 3).map((need) => ({
      id: `next-${need.id}`,
      label: need.actionLabel ?? "Open request",
      description: need.description,
      href: need.href,
    }));
  }
  return [
    {
      id: "upload-media",
      label: "Upload fresh media",
      description: "Share new food or atmosphere photos when you have them.",
      href: "/client/media",
    },
    {
      id: "share-updates",
      label: "Share important updates",
      description: "Tell Veroxa about hours, menu, catering, or offer changes.",
      href: "/client/requests",
    },
  ];
}

export function getClientProgressSummary(clientId: string): ClientProgressSummary {
  const journey = getClientPortalJourney(clientId);
  return buildClientPortalProgressSummary(journey, {
    clientId,
    visibilityProgress: getClientVisibilityProgress(clientId),
    latestReport: buildLatestReportSummary(clientId),
    nextSteps: getClientNextSteps(clientId),
    nextFocus: "Keep sharing fresh media and important business updates; Veroxa will handle the progress updates.",
  });
}
