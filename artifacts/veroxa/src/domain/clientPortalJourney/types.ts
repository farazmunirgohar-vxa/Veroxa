/**
 * Client Portal Journey — client-safe domain model.
 *
 * Shared vocabulary for the restaurant partner journey: upload / request ->
 * Veroxa review -> prepared work -> client input when needed -> weekly update ->
 * monthly report. Types in this module are client-safe by design: no internal
 * machinery, no vendor names, no raw scoring, no execution internals.
 */

/** The only statuses a client is ever shown. */
export type ClientJourneyStatus =
  | "Submitted"
  | "In review"
  | "Prepared by Veroxa"
  | "Needs your input"
  | "In progress"
  | "Completed"
  | "Included in report"
  | "More content needed";

/** The kinds of things that move through the client journey. */
export type ClientJourneyItemType =
  | "media_submission"
  | "client_request"
  | "business_update"
  | "visibility_update"
  | "google_maps_visibility"
  | "review_response"
  | "content_preparation"
  | "weekly_update"
  | "monthly_report"
  | "client_input_needed";

/** Where a journey item came from in client-safe, product-level language. */
export type ClientJourneySource =
  | "client_submission"
  | "client_request"
  | "veroxa_work"
  | "visibility_review"
  | "weekly_update"
  | "monthly_report";

/** Calm priority for ordering/nudges; never shown as risk or severity. */
export type ClientJourneyPriority = "high" | "normal" | "low";

/** Visual tone for a status — components map this to colour/icon. */
export type ClientPortalStatusTone =
  | "submitted"
  | "in_progress"
  | "attention"
  | "complete";

/** A single item the client can see moving through Veroxa. */
export interface ClientJourneyItem {
  id: string;
  clientId: string;
  type: ClientJourneyItemType;
  source: ClientJourneySource;
  priority: ClientJourneyPriority;
  title: string;
  summary: string;
  status: ClientJourneyStatus;
  updatedAt: string;
  /** Friendly relative time, e.g. "Today", "2 days ago". */
  updatedLabel: string;
  /** True when the client owes Veroxa something to keep moving. */
  needsClientInput: boolean;
  /** Optional client-safe next-step hint. */
  nextStep?: string;
  /** Optional route for a page CTA. */
  href?: string;
}

/** Something Veroxa needs from the client to keep moving forward. */
export interface ClientNeedFromClient {
  id: string;
  clientId: string;
  type: ClientJourneyItemType;
  priority: ClientJourneyPriority;
  title: string;
  /** Why it helps, in friendly language — never blame. */
  description: string;
  /** CTA label, e.g. "Confirm details" / "Upload media". */
  actionLabel?: string;
  /** In-app route for the CTA, e.g. "/client/requests". */
  href?: string;
}

/** A single "do this next" nudge, e.g. for the dashboard. */
export interface ClientNextStep {
  id: string;
  label: string;
  description: string;
  href?: string;
}

/** Client-safe local visibility summary for dashboard/reports. */
export interface ClientLocalVisibilityProgress {
  clientId: string;
  googleProfileFreshness: string;
  reviewResponseProgress: string;
  photoFreshnessNeed: string;
  businessDetailsNeedConfirmation: string;
  menuOrOrderingLinkCheck: string;
  localSearchFocus: string;
  nextVisibilityAction: string;
}

/** Alias used by the prompt and older components. */
export type ClientVisibilityProgress = ClientLocalVisibilityProgress;

/** Latest report/update summary for dashboard use. */
export interface ClientReportSummary {
  clientId: string;
  latestWeeklyUpdateLabel: string;
  latestMonthlyReportLabel: string;
  reportStatus: ClientJourneyStatus;
  summary: string;
  href: string;
}

/** The assembled, client-safe overview the dashboard / updates pages render. */
export interface ClientProgressSummary {
  clientId: string;
  headline: string;
  workingOn: ClientJourneyItem[];
  needsFromYou: ClientNeedFromClient[];
  recentProgress: ClientJourneyItem[];
  visibilityProgress: ClientLocalVisibilityProgress;
  latestReport: ClientReportSummary;
  nextSteps: ClientNextStep[];
  nextFocus: string;
}

export interface ClientWeeklyUpdate {
  clientId: string;
  weekLabel: string;
  headline: string;
  completedWork: string[];
  inProgressWork: string[];
  needsClientInput: string[];
  visibilityProgress: string[];
  contentProgress: string[];
  reviewProgress: string[];
  nextWeekFocus: string[];
  clientSafeSummary: string;
}

export interface ClientMonthlyReport {
  clientId: string;
  monthLabel: string;
  executiveSummary: string;
  visibilityProgress: ClientLocalVisibilityProgress;
  mediaAndContentSummary: string[];
  reviewReputationSummary: string[];
  completedWork: string[];
  pendingClientInput: string[];
  nextMonthFocus: string[];
  clientSafeRecommendations: string[];
}

// Backward-compatible names used by existing client pages.
export type ClientPortalJourneyStatus = ClientJourneyStatus;
export type ClientPortalJourneyType = ClientJourneyItemType;
export type ClientPortalJourneySource = ClientJourneySource;
export type ClientPortalJourneyPriority = ClientJourneyPriority;
export type ClientPortalJourneyItem = ClientJourneyItem;
export type ClientPortalNeedFromClient = ClientNeedFromClient;
export type ClientPortalNextStep = ClientNextStep;
export type ClientPortalProgressSummary = ClientProgressSummary;
