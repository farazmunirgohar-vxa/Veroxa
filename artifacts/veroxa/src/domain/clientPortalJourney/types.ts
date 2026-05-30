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

/** Report readiness in client-safe terms. */
export type ClientReportInclusionState =
  | "not_ready"
  | "eligible"
  | "included"
  | "not_applicable";

/** Optional visibility category for local-search progress. */
export type ClientVisibilityCategory =
  | "google_profile_freshness"
  | "local_visibility"
  | "visibility_update"
  | "review_response"
  | "photo_freshness"
  | "business_details_confirmation"
  | "menu_order_link_check"
  | "local_search_focus";

/** Visual tone for a status — components map this to colour/icon. */
export type ClientPortalStatusTone =
  | "submitted"
  | "in_progress"
  | "attention"
  | "complete";

/** A single item the client can see moving through Veroxa. */
export interface ClientJourneyItem {
  /** Stable UI key. Do not render this value to clients. */
  id: string;
  clientId: string;
  restaurantName?: string;
  type: ClientJourneyItemType;
  source: ClientJourneySource;
  status: ClientJourneyStatus;
  priority: ClientJourneyPriority;
  reportInclusionState: ClientReportInclusionState;
  visibilityCategory?: ClientVisibilityCategory;
  title: string;
  /** Canonical client-safe description. */
  description: string;
  /** Backward-compatible alias for older cards. Keep equal to description. */
  summary: string;
  /** ISO if known; client-safe labels should be used in UI. */
  createdAt?: string;
  updatedAt?: string;
  createdLabel: string;
  submittedLabel?: string;
  updatedLabel: string;
  needsClientInput: boolean;
  nextStep?: string;
  actionLabel?: string;
  href?: string;
}

/** Something Veroxa needs from the client to keep moving forward. */
export interface ClientNeedFromClient {
  id: string;
  clientId: string;
  restaurantName?: string;
  type: ClientJourneyItemType;
  priority: ClientJourneyPriority;
  title: string;
  /** Why it helps, in friendly language — never blame. */
  description: string;
  actionLabel: string;
  href: string;
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
  restaurantName?: string;
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
  restaurantName?: string;
  latestWeeklyUpdateLabel: string;
  latestMonthlyReportLabel: string;
  reportStatus: ClientJourneyStatus;
  summary: string;
  href: string;
}

/** The assembled, client-safe overview the dashboard / updates pages render. */
export interface ClientProgressSummary {
  clientId: string;
  restaurantName?: string;
  headline: string;
  workingOn: ClientJourneyItem[];
  needsFromYou: ClientNeedFromClient[];
  recentProgress: ClientJourneyItem[];
  visibilityProgress: ClientLocalVisibilityProgress;
  latestReport: ClientReportSummary;
  nextSteps: ClientNextStep[];
  nextFocus: string;
  emptyState: {
    needsFromYou: string;
    recentProgress: string;
    nextStep: string;
  };
}

export interface ClientWeeklyUpdate {
  clientId: string;
  restaurantName?: string;
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
  restaurantName?: string;
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
