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

export function getClientPortalStatusTone(
  status: ClientJourneyStatus,
): ClientPortalStatusTone {
  return STATUS_TONE[status];
}

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

export function describeClientPortalStatus(status: ClientJourneyStatus): string {
  return STATUS_DESCRIPTION[status];
}

export function statusNeedsClientInput(status: ClientJourneyStatus): boolean {
  return status === "Needs your input" || status === "More content needed";
}

export function statusIsComplete(status: ClientJourneyStatus): boolean {
  return status === "Completed" || status === "Included in report";
}

export function statusIsInProgress(status: ClientJourneyStatus): boolean {
  return (
    status === "In review" ||
    status === "Prepared by Veroxa" ||
    status === "In progress"
  );
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

export function createDefaultVisibilityProgress(
  clientId: string,
): ClientLocalVisibilityProgress {
  return {
    clientId,
    googleProfileFreshness: "Google profile freshness is being reviewed.",
    reviewResponseProgress: "Review response support is in progress.",
    photoFreshnessNeed: "Fresh food photos will help next week's content.",
    businessDetailsNeedConfirmation: "No business details need confirmation right now.",
    menuOrOrderingLinkCheck: "Menu and ordering links are being checked for freshness.",
    localSearchFocus: "Local visibility focus is active for nearby customer searches.",
    nextVisibilityAction: "A visibility update is being prepared for Veroxa team review.",
  };
}

export function createDefaultReportSummary(clientId: string): ClientReportSummary {
  return {
    clientId,
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
    type: item.type,
    priority: item.priority,
    title: item.title,
    description: item.nextStep ?? describeClientPortalStatus(item.status),
    actionLabel: item.type === "media_submission" ? "Upload media" : "Open request",
    href: item.href ?? (item.type === "media_submission" ? "/client/media" : "/client/requests"),
  };
}

export function buildClientPortalProgressSummary(
  items: ClientJourneyItem[],
  opts?: {
    clientId?: string;
    headline?: string;
    nextFocus?: string;
    visibilityProgress?: ClientLocalVisibilityProgress;
    latestReport?: ClientReportSummary;
    nextSteps?: ClientNextStep[];
  },
): ClientProgressSummary {
  const clientId = opts?.clientId ?? items[0]?.clientId ?? "demo-a";
  const needsFromYou: ClientNeedFromClient[] = items
    .filter((i) => i.needsClientInput || statusNeedsClientInput(i.status))
    .map(toNeedFromClient);

  const workingOn = items.filter((i) => statusIsInProgress(i.status));
  const recentProgress = items.filter((i) => statusIsComplete(i.status));
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
    headline: opts?.headline ?? "Veroxa is handling your online presence.",
    workingOn,
    needsFromYou,
    recentProgress,
    visibilityProgress: opts?.visibilityProgress ?? createDefaultVisibilityProgress(clientId),
    latestReport: opts?.latestReport ?? createDefaultReportSummary(clientId),
    nextSteps,
    nextFocus:
      opts?.nextFocus ??
      "Upload fresh media when you have it — it helps power next week's plan.",
  };
}
