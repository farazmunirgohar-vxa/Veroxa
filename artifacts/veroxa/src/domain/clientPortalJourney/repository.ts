import {
  buildClientPortalProgressSummary,
  getClientStatusDescription,
  getClientNextActionLabel,
  isClientActionNeeded,
  isClientWorkComplete,
  isClientWorkInProgress,
} from "./clientSafe";
import { getClientLocalVisibilityProgress } from "./localVisibility";
import type {
  ClientJourneyItem,
  ClientJourneyItemType,
  ClientJourneyPriority,
  ClientNeedFromClient,
  ClientNextStep,
  ClientProgressSummary,
  ClientReportInclusionState,
  ClientReportSummary,
  ClientVisibilityCategory,
} from "./types";
import { getClientWorkflowItems } from "@/lib/workflow/workflowRepository";
import type {
  ClientVisibleStatus,
  ReportInclusionStatus,
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
import { getClientById } from "@/lib/repositories/clientRepository";
import { getClientReports } from "@/lib/repositories/reportRepository";

const DEFAULT_CLIENT_ID = "unknown-client";
const ONE_DAY_MS = 86_400_000;

function getRestaurantName(clientId: string): string | undefined {
  return getClientById(clientId)?.businessName;
}

function relativeDayLabel(iso: string | undefined, now: Date = new Date()): string {
  if (!iso) return "Recently";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso || "Recently";
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(then)) / ONE_DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} weeks ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sortableTime(item: ClientJourneyItem): number {
  const candidates = [item.updatedAt, item.createdAt];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
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

function workflowReportState(status: ReportInclusionStatus): ClientReportInclusionState {
  switch (status) {
    case "eligible":
      return "eligible";
    case "included":
      return "included";
    case "not_applicable":
      return "not_applicable";
  }
}

function makeJourneyItem(input: Omit<ClientJourneyItem, "summary"> & { summary?: string }): ClientJourneyItem {
  const description = input.description.trim() || getClientStatusDescription(input.status);
  return {
    ...input,
    description,
    summary: input.summary ?? description,
    actionLabel: input.actionLabel,
  };
}

function workflowItemToJourney(item: WorkflowItem): ClientJourneyItem {
  const status = workflowStatus(item.clientVisibleStatus);
  const type = workflowType(item.type);
  const description = item.clientNote || getClientStatusDescription(status);
  return makeJourneyItem({
    id: `workflow-${item.workflowItemId}`,
    clientId: item.clientId,
    restaurantName: item.restaurantName,
    type,
    source: workflowSource(item.type),
    status,
    priority: isClientActionNeeded(status) ? "high" : "normal",
    reportInclusionState: workflowReportState(item.reportInclusionStatus),
    title: item.title,
    description,
    createdAt: item.submittedAt,
    updatedAt: item.updatedAt,
    createdLabel: relativeDayLabel(item.submittedAt),
    submittedLabel: relativeDayLabel(item.submittedAt),
    updatedLabel: relativeDayLabel(item.updatedAt),
    needsClientInput: isClientActionNeeded(status),
    nextStep: item.nextClientAction,
    actionLabel: type === "media_submission" ? "Upload media" : undefined,
    href: type === "media_submission" ? "/client/media" : "/client/requests",
  });
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

function actionVisibilityCategory(action: PreparedAction): ClientVisibilityCategory | undefined {
  switch (action.channel) {
    case "google_business_profile":
      return "google_profile_freshness";
    case "reviews":
      return "review_response";
    case "website":
      return "menu_order_link_check";
    case "seo":
      return "local_search_focus";
    default:
      return undefined;
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
  const type = actionType(action);
  const description = getClientSafeActionSummary(action);
  return makeJourneyItem({
    id: `prepared-${action.id}`,
    clientId: action.clientId,
    restaurantName: action.restaurantName,
    type,
    source: action.channel === "google_business_profile" ? "visibility_review" : "veroxa_work",
    status,
    priority: actionPriority(action),
    reportInclusionState: status === "Completed" ? "eligible" : "not_ready",
    visibilityCategory: actionVisibilityCategory(action),
    title: action.type === "review_reply" ? "Review response support" : action.title,
    description,
    createdLabel: action.preparedAtLabel,
    updatedLabel: action.preparedAtLabel,
    needsClientInput: isClientActionNeeded(status),
    nextStep: getClientSafeActionStatus(action),
    actionLabel: status === "Needs your input" ? "Open request" : "View update",
    href: status === "Needs your input" ? "/client/requests" : "/client/updates",
  });
}

function visibilityJourneyItem(clientId: string): ClientJourneyItem | null {
  const audit = getVisibilityAuditForClient(clientId);
  if (!audit) return null;
  const summary = getClientSafeVisibilitySummary(audit.result);
  const restaurantName = summary.restaurantName || getRestaurantName(clientId);
  return makeJourneyItem({
    id: `visibility-${clientId}`,
    clientId,
    restaurantName,
    type: "visibility_update",
    source: "visibility_review",
    status: "In progress",
    priority: "normal",
    reportInclusionState: "eligible",
    visibilityCategory: "local_visibility",
    title: "Local visibility progress",
    description: summary.status,
    createdLabel: "This week",
    updatedLabel: "This week",
    needsClientInput: false,
    nextStep: "A local visibility update is being prepared.",
    actionLabel: "View update",
    href: "/client/updates",
  });
}

function reportStatusToJourney(status: string): ClientJourneyItem["status"] {
  switch (status) {
    case "published":
    case "approved":
      return "Included in report";
    case "drafted":
    case "team_review":
    default:
      return "Prepared by Veroxa";
  }
}

function reportJourneyItems(clientId: string): ClientJourneyItem[] {
  const restaurantName = getRestaurantName(clientId);
  const reports = getClientReports(clientId);
  const weekly = reports.weekly.slice(0, 2).map((report) => {
    const status = reportStatusToJourney(report.status);
    return makeJourneyItem({
      id: `weekly-report-${report.reportId}`,
      clientId,
      restaurantName,
      type: "weekly_update",
      source: "weekly_update",
      status,
      priority: "low" as const,
      reportInclusionState: status === "Included in report" ? "included" : "eligible",
      title: "Weekly progress update",
      description: "Your weekly progress update summarizes recent Veroxa work and what is next.",
      createdLabel: report.weekStart,
      updatedLabel: report.weekEnd,
      needsClientInput: false,
      actionLabel: "View update",
      href: "/client/updates",
    });
  });
  const monthly = reports.monthly.slice(0, 2).map((report) => {
    const status = reportStatusToJourney(report.status);
    return makeJourneyItem({
      id: `monthly-report-${report.reportId}`,
      clientId,
      restaurantName,
      type: "monthly_report",
      source: "monthly_report",
      status,
      priority: "low" as const,
      reportInclusionState: status === "Included in report" ? "included" : "eligible",
      title: "Monthly progress report",
      description: "Your monthly report summarizes completed work, visibility progress, and next focus areas.",
      createdLabel: report.monthKey,
      updatedLabel: report.monthKey,
      needsClientInput: false,
      actionLabel: "View report",
      href: "/client/reports",
    });
  });
  return [...weekly, ...monthly];
}

function itemDedupKey(item: ClientJourneyItem): string {
  return [item.clientId, item.type, item.source, item.title.toLowerCase(), item.status].join("|");
}

function dedupeJourneyItems(items: ClientJourneyItem[]): ClientJourneyItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = itemDedupKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const PRIORITY_RANK: Record<ClientJourneyPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

const STATUS_RANK: Record<ClientJourneyItem["status"], number> = {
  "Needs your input": 0,
  "More content needed": 1,
  Submitted: 2,
  "In review": 3,
  "Prepared by Veroxa": 4,
  "In progress": 5,
  Completed: 6,
  "Included in report": 7,
};

function sortJourneyItems(items: ClientJourneyItem[]): ClientJourneyItem[] {
  return [...items].sort((a, b) => {
    const priority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priority !== 0) return priority;
    const status = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (status !== 0) return status;
    const time = sortableTime(b) - sortableTime(a);
    if (time !== 0) return time;
    return a.title.localeCompare(b.title);
  });
}

function buildLatestReportSummary(
  clientId: string,
  restaurantName: string | undefined,
  journey: ClientJourneyItem[],
): ClientReportSummary {
  const includedCount = journey.filter((item) => item.reportInclusionState === "included").length;
  const eligibleCount = journey.filter((item) => item.reportInclusionState === "eligible").length;
  return {
    clientId,
    restaurantName,
    latestWeeklyUpdateLabel: "Current week",
    latestMonthlyReportLabel: "This month",
    reportStatus: includedCount > 0 ? "Included in report" : "Prepared by Veroxa",
    summary:
      includedCount > 0
        ? `${includedCount} completed items are included in your progress updates.`
        : eligibleCount > 0
          ? `${eligibleCount} progress items are ready for your next report.`
          : "Your next progress report is being prepared.",
    href: "/client/reports",
  };
}

export function getClientPortalJourney(clientId: string): ClientJourneyItem[] {
  const normalizedClientId = clientId || DEFAULT_CLIENT_ID;
  const workflowItems = getClientWorkflowItems(normalizedClientId).map(workflowItemToJourney);
  const preparedItems = getPreparedActionsForClient(normalizedClientId)
    .filter(shouldShowActionToClient)
    .map(preparedActionToJourney);
  const visibilityItem = visibilityJourneyItem(normalizedClientId);
  const reports = reportJourneyItems(normalizedClientId);

  return sortJourneyItems(
    dedupeJourneyItems([
      ...workflowItems,
      ...preparedItems,
      ...(visibilityItem ? [visibilityItem] : []),
      ...reports,
    ]),
  );
}

export function getClientNeedsFromYou(clientId: string): ClientNeedFromClient[] {
  return getClientPortalJourney(clientId)
    .filter((item) => item.needsClientInput || isClientActionNeeded(item.status))
    .map((item) => ({
      id: item.id,
      clientId: item.clientId,
      restaurantName: item.restaurantName,
      type: item.type,
      priority: item.priority,
      title: item.title,
      description: item.nextStep ?? "Veroxa needs a quick detail from you to keep going.",
      actionLabel: getClientNextActionLabel(item),
      href: item.href ?? "/client/requests",
    }));
}

export function getClientRecentProgress(clientId: string): ClientJourneyItem[] {
  return getClientPortalJourney(clientId).filter((item) => isClientWorkComplete(item.status));
}

export function getClientVisibilityProgress(clientId: string) {
  return getClientLocalVisibilityProgress(clientId);
}

export function getClientNextSteps(clientId: string): ClientNextStep[] {
  const needs = getClientNeedsFromYou(clientId);
  if (needs.length > 0) {
    return needs.slice(0, 3).map((need) => ({
      id: `next-${need.id}`,
      label: need.actionLabel,
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
  const normalizedClientId = clientId || DEFAULT_CLIENT_ID;
  const journey = getClientPortalJourney(normalizedClientId);
  const restaurantName = getRestaurantName(normalizedClientId) ?? journey.find((item) => item.restaurantName)?.restaurantName;
  return buildClientPortalProgressSummary(journey, {
    clientId: normalizedClientId,
    restaurantName,
    visibilityProgress: getClientVisibilityProgress(normalizedClientId),
    latestReport: buildLatestReportSummary(normalizedClientId, restaurantName, journey),
    nextSteps: getClientNextSteps(normalizedClientId),
    nextFocus: "Keep sharing fresh media and important business updates; Veroxa will handle the progress updates.",
  });
}
