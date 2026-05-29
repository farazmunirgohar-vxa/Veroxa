/**
 * Client Portal Journey — client-safe helpers.
 *
 * Pure mapping + assembly functions over the journey model. No React, no network,
 * no @/lib imports. These produce the calm, plain-language strings and the
 * assembled progress summary that the /client/* pages render.
 */

import type {
  ClientPortalJourneyItem,
  ClientPortalJourneyStatus,
  ClientPortalJourneyType,
  ClientPortalNeedFromClient,
  ClientPortalProgressSummary,
  ClientPortalStatusTone,
} from "./types";

const STATUS_TONE: Record<ClientPortalJourneyStatus, ClientPortalStatusTone> = {
  Submitted: "submitted",
  "In review": "in_progress",
  "Prepared by Veroxa": "in_progress",
  "In progress": "in_progress",
  "Needs your input": "attention",
  "More content needed": "attention",
  Completed: "complete",
  "Included in report": "complete",
};

/** Visual tone for a status badge. Components map tone -> colour/icon. */
export function getClientPortalStatusTone(
  status: ClientPortalJourneyStatus,
): ClientPortalStatusTone {
  return STATUS_TONE[status];
}

const STATUS_DESCRIPTION: Record<ClientPortalJourneyStatus, string> = {
  Submitted: "We've received this and will review it shortly.",
  "In review": "Veroxa is reviewing this now.",
  "Prepared by Veroxa": "Veroxa has prepared this for you.",
  "Needs your input": "Veroxa needs a quick detail from you to keep going.",
  "In progress": "Veroxa is working on this.",
  Completed: "This is done.",
  "Included in report": "This is part of your latest update.",
  "More content needed": "A little more content would help Veroxa finish this.",
};

/** One reassuring sentence explaining a status (no jargon, no mechanics). */
export function describeClientPortalStatus(
  status: ClientPortalJourneyStatus,
): string {
  return STATUS_DESCRIPTION[status];
}

/** Statuses where the client owes Veroxa something to keep moving. */
export function statusNeedsClientInput(
  status: ClientPortalJourneyStatus,
): boolean {
  return status === "Needs your input" || status === "More content needed";
}

/** Statuses that represent finished, report-eligible work. */
export function statusIsComplete(status: ClientPortalJourneyStatus): boolean {
  return status === "Completed" || status === "Included in report";
}

/** Statuses where Veroxa is actively progressing the work. */
export function statusIsInProgress(status: ClientPortalJourneyStatus): boolean {
  return (
    status === "In review" ||
    status === "Prepared by Veroxa" ||
    status === "In progress"
  );
}

const TYPE_LABEL: Record<ClientPortalJourneyType, string> = {
  media_submission: "Media",
  client_request: "Request",
  business_update: "Business update",
  visibility_update: "Visibility update",
  review_response: "Review response",
  content_preparation: "Content",
  weekly_update: "Weekly update",
  monthly_report: "Monthly report",
  client_input_needed: "Needs your input",
};

/** A short, friendly label for a journey type. */
export function getClientPortalTypeLabel(type: ClientPortalJourneyType): string {
  return TYPE_LABEL[type];
}

/**
 * Assemble a client-safe progress summary from a list of journey items. Pure and
 * deterministic — the dashboard and updates pages share this so what a client
 * sees stays consistent everywhere.
 */
export function buildClientPortalProgressSummary(
  items: ClientPortalJourneyItem[],
  opts?: { headline?: string; nextFocus?: string },
): ClientPortalProgressSummary {
  const needsFromYou: ClientPortalNeedFromClient[] = items
    .filter((i) => i.needsClientInput || statusNeedsClientInput(i.status))
    .map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      description: i.nextStep ?? describeClientPortalStatus(i.status),
    }));

  const workingOn = items.filter((i) => statusIsInProgress(i.status));
  const recentProgress = items.filter((i) => statusIsComplete(i.status));

  return {
    headline: opts?.headline ?? "Veroxa is handling your online presence.",
    workingOn,
    needsFromYou,
    recentProgress,
    nextFocus:
      opts?.nextFocus ??
      "Upload fresh media when you have it — it powers next week's plan.",
  };
}
