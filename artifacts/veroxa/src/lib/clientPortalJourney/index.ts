/**
 * Client Portal Journey — lib bridge.
 *
 * Converts the existing client-safe workflow records (`WorkflowItem`) into the
 * shared `ClientPortalJourney` vocabulary used across the /client/* pages. This
 * is the ONLY place the workflow vocabulary maps into the journey vocabulary, so
 * the two can never drift apart. Read-only: no writes, no network, no storage.
 */

import {
  describeClientPortalStatus,
  type ClientPortalJourneyItem,
  isClientActionNeeded,
  type ClientPortalJourneyStatus,
  type ClientPortalJourneySource,
  type ClientPortalJourneyType,
} from "@/domain/clientPortalJourney";
import type {
  ClientVisibleStatus,
  WorkflowItem,
  ReportInclusionStatus,
  WorkflowItemType,
} from "@/lib/workflow/workflowTypes";

/** Map the workflow client-safe status onto the journey status vocabulary. */
function mapStatus(status: ClientVisibleStatus): ClientPortalJourneyStatus {
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

/** Map the workflow item type onto the journey type vocabulary. */
function mapType(type: WorkflowItemType): ClientPortalJourneyType {
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

function mapSource(type: WorkflowItemType): ClientPortalJourneySource {
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

function mapReportInclusion(status: ReportInclusionStatus): ClientPortalJourneyItem["reportInclusionState"] {
  switch (status) {
    case "eligible":
      return "eligible";
    case "included":
      return "included";
    case "not_applicable":
      return "not_applicable";
  }
}

/** Friendly relative time label, e.g. "Today", "Yesterday", "3 days ago". */
export function relativeDayLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "Recently";
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

/** Convert a single workflow item into a client-safe journey item. */
export function workflowItemToJourneyItem(
  item: WorkflowItem,
): ClientPortalJourneyItem {
  const status = mapStatus(item.clientVisibleStatus);
  return {
    id: item.workflowItemId,
    clientId: item.clientId,
    restaurantName: item.restaurantName,
    type: mapType(item.type),
    source: mapSource(item.type),
    priority: isClientActionNeeded(status) ? "high" : "normal",
    reportInclusionState: mapReportInclusion(item.reportInclusionStatus),
    title: item.title,
    description: item.clientNote || describeClientPortalStatus(status),
    summary: item.clientNote || describeClientPortalStatus(status),
    status,
    createdAt: item.submittedAt,
    updatedAt: item.updatedAt,
    createdLabel: relativeDayLabel(item.submittedAt),
    submittedLabel: relativeDayLabel(item.submittedAt),
    updatedLabel: relativeDayLabel(item.updatedAt),
    needsClientInput: isClientActionNeeded(status),
    nextStep: item.nextClientAction,
    actionLabel: item.type === "media_upload" ? "Upload media" : undefined,
    href: item.type === "media_upload" ? "/client/media" : "/client/requests",
  };
}

/** Convert a list of workflow items into client-safe journey items. */
export function workflowItemsToJourneyItems(
  items: WorkflowItem[],
): ClientPortalJourneyItem[] {
  return items.map(workflowItemToJourneyItem);
}
