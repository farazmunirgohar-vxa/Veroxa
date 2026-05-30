/**
 * Client Portal Journey — client-safe helpers.
 *
 * Pure mapping + assembly functions over the journey model. No React, no
 * network, no storage. These produce calm, plain-language strings shared by
 * client pages and report foundations.
 */

import type {
  ClientJourneyItem,
  ClientJourneyItemType,
  ClientJourneyStatus,
  ClientNeedFromClient,
  ClientProgressSummary,
  ClientPortalStatusTone,
  ClientLocalVisibilityProgress,
  ClientReportSummary,
  ClientNextStep,
} from "./types";

const STATUS_TONE: Record<ClientJourneyStatus, ClientPortalStatusTone> = {
  Submitted: "submitted",
  "In review": "in_progress",
  "Prepared by Veroxa": "in_progress",
  "In progress": "in_progress",
  "Needs your input": "attention",
  "More content needed": "attention",
  Completed: "complete",
  "Included in report": "complete",
};

export function getClientStatusTone(
  status: ClientJourneyStatus,
): ClientPortalStatusTone {
  return STATUS_TONE[status];
}

export const getClientPortalStatusTone = getClientStatusTone;

const STATUS_DESCRIPTION: Record<ClientJourneyStatus, string> = {
  Submitted: "We've received this and will review it shortly.",
  "In review": "Veroxa is reviewing this now.",
  "Prepared by Veroxa": "Veroxa has prepared this for you.",
  "Needs your input": "Veroxa needs a quick detail from you to keep going.",
  "In progress": "Veroxa is working on this.",
  Completed: "This is done.",
  "Included in report": "This is part of your latest update.",
  "More content needed": "A little more content would help Veroxa finish this.",
};

export function getClientStatusDescription(status: ClientJourneyStatus): string {
  return STATUS_DESCRIPTION[status];
}

export const describeClientPortalStatus = getClientStatusDescription;

export function isClientActionNeeded(status: ClientJourneyStatus): boolean {
  return status === "Needs your input" || status === "More content needed";
}

export const statusNeedsClientInput = isClientActionNeeded;

export function isClientWorkComplete(status: ClientJourneyStatus): boolean {
  return status === "Completed" || status === "Included in report";
}

export const statusIsComplete = isClientWorkComplete;

export function isClientWorkInProgress(status: ClientJourneyStatus): boolean {
  return (
    status === "In review" ||
    status === "Prepared by Veroxa" ||
    status === "In progress"
  );
}

export const statusIsInProgress = isClientWorkInProgress;

export function isReportEligible(status: ClientJourneyStatus): boolean {
  return status === "Completed" || status === "Included in report";
}

const TYPE_LABEL: Record<ClientJourneyItemType, string> = {
  media_submission: "Media",
  client_request: "Request",
  business_update: "Business update",
  visibility_update: "Visibility update",
  google_maps_visibility: "Google Maps visibility",
  review_response: "Review response",
  content_preparation: "Content",
  weekly_update: "Weekly update",
  monthly_report: "Monthly report",
  client_input_needed: "Needs your input",
};

export function getClientPortalTypeLabel(type: ClientJourneyItemType): string {
  return TYPE_LABEL[type];
}

export function getClientNextActionLabel(item: ClientJourneyItem): string {
  if (item.actionLabel) return item.actionLabel;
  if (item.type === "media_submission" || item.status === "More content needed") {
    return "Upload media";
  }
  if (item.status === "Needs your input") return "Open request";
  if (item.type === "weekly_update") return "View update";
  if (item.type === "monthly_report") return "View report";
  return "View details";
}

export function createDefaultVisibilityProgress(
  clientId: string,
  restaurantName?: string,
): ClientLocalVisibilityProgress {
  return {
    clientId,
    restaurantName,
    googleProfileFreshness: "Google profile freshness is being reviewed.",
    reviewResponseProgress: "Review response support is in progress.",
    photoFreshnessNeed: "Fresh food photos will help next week's content.",
    businessDetailsNeedConfirmation: "No business details need confirmation right now.",
    menuOrOrderingLinkCheck: "Menu and ordering links are being checked for freshness.",
    localSearchFocus: "Local visibility focus is active for nearby customer searches.",
    nextVisibilityAction: "A visibility update is being prepared for Veroxa team review.",
  };
}

export function createDefaultReportSummary(
  clientId: string,
  restaurantName?: string,
): ClientReportSummary {
  return {
    clientId,
    restaurantName,
    latestWeeklyUpdateLabel: "Current week",
    latestMonthlyReportLabel: "This month",
    reportStatus: "Prepared by Veroxa",
    summary: "Your next progress update is being prepared.",
    href: "/client/reports",
  };
}

function toNeedFromClient(item: ClientJourneyItem): ClientNeedFromClient {
  return {
    id: item.id,
    clientId: item.clientId,
    restaurantName: item.restaurantName,
    type: item.type,
    priority: item.priority,
    title: item.title,
    description: item.nextStep ?? getClientStatusDescription(item.status),
    actionLabel: getClientNextActionLabel(item),
    href: item.href ?? (item.type === "media_submission" ? "/client/media" : "/client/requests"),
  };
}

export function buildClientPortalProgressSummary(
  items: ClientJourneyItem[],
  opts?: {
    clientId?: string;
    restaurantName?: string;
    headline?: string;
    nextFocus?: string;
    visibilityProgress?: ClientLocalVisibilityProgress;
    latestReport?: ClientReportSummary;
    nextSteps?: ClientNextStep[];
  },
): ClientProgressSummary {
  const clientId = opts?.clientId ?? items[0]?.clientId ?? "unknown-client";
  const restaurantName = opts?.restaurantName ?? items.find((item) => item.restaurantName)?.restaurantName;
  const needsFromYou: ClientNeedFromClient[] = items
    .filter((i) => i.needsClientInput || isClientActionNeeded(i.status))
    .map(toNeedFromClient);

  const workingOn = items.filter((i) => isClientWorkInProgress(i.status));
  const recentProgress = items.filter((i) => isClientWorkComplete(i.status));
  const nextSteps = opts?.nextSteps ?? [
    {
      id: "upload-fresh-media",
      label: "Upload fresh media",
      description: "Fresh food and atmosphere photos help Veroxa prepare better content.",
      href: "/client/media",
    },
    {
      id: "share-business-updates",
      label: "Share important updates",
      description: "Tell Veroxa about hours, menu, catering, or offer changes before they are used.",
      href: "/client/requests",
    },
  ];

  return {
    clientId,
    restaurantName,
    headline: opts?.headline ?? "Veroxa is handling your online presence.",
    workingOn,
    needsFromYou,
    recentProgress,
    visibilityProgress: opts?.visibilityProgress ?? createDefaultVisibilityProgress(clientId, restaurantName),
    latestReport: opts?.latestReport ?? createDefaultReportSummary(clientId, restaurantName),
    nextSteps,
    nextFocus:
      opts?.nextFocus ??
      "Upload fresh media when you have it — it helps power next week's plan.",
    emptyState: {
      needsFromYou: "Nothing needed from you right now.",
      recentProgress: "Veroxa will show completed work here as it moves forward.",
      nextStep: "Upload fresh media when available.",
    },
  };
}
