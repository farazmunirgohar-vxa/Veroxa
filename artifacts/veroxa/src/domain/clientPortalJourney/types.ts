/**
 * Client Portal Journey — client-safe domain model (foundation).
 *
 * One small, calm vocabulary for everything the restaurant partner sees as their
 * work moves through Veroxa: upload / request -> Veroxa reviews -> Veroxa prepares
 * -> simple status -> client gives input only if needed -> item appears in a
 * weekly update / report. This is the single client-safe vocabulary the /client/*
 * pages share so they can never drift apart.
 *
 * Hard rules (baked into the words below): clients never see AI, automation,
 * connectors, APIs, the approval queue, risk levels, audit scores, internal IDs,
 * severities, or team-only status. This module is PURE — no React, no network,
 * no storage, no imports from @/lib. Mirrors the visibilityAudit / preparedActions
 * client-safe layers.
 */

/** The only statuses a client is ever shown. */
export type ClientPortalJourneyStatus =
  | "Submitted"
  | "In review"
  | "Prepared by Veroxa"
  | "Needs your input"
  | "In progress"
  | "Completed"
  | "Included in report"
  | "More content needed";

/** The kinds of things that move through the client journey. */
export type ClientPortalJourneyType =
  | "media_submission"
  | "client_request"
  | "business_update"
  | "visibility_update"
  | "review_response"
  | "content_preparation"
  | "weekly_update"
  | "monthly_report"
  | "client_input_needed";

/**
 * Visual tone for a status — components map this to colour/icon. Kept as a small
 * string union so the domain layer carries no React/styling dependencies.
 */
export type ClientPortalStatusTone =
  | "submitted"
  | "in_progress"
  | "attention"
  | "complete";

/** A single item the client can see moving through Veroxa. */
export interface ClientPortalJourneyItem {
  id: string;
  type: ClientPortalJourneyType;
  /** Short, plain-language title (e.g. "New dinner photos"). */
  title: string;
  /** One calm sentence about what Veroxa is doing. No jargon. */
  summary: string;
  status: ClientPortalJourneyStatus;
  /** Friendly relative time, e.g. "Today", "2 days ago". */
  updatedLabel: string;
  /** True when the client owes Veroxa something to keep moving. */
  needsClientInput: boolean;
  /** Optional client-safe next-step hint. */
  nextStep?: string;
}

/** Something Veroxa needs from the client to keep moving forward. */
export interface ClientPortalNeedFromClient {
  id: string;
  type: ClientPortalJourneyType;
  title: string;
  /** Why it helps, in friendly language — never blame. */
  description: string;
  /** CTA label, e.g. "Confirm details" / "Upload media". */
  actionLabel?: string;
  /** In-app route for the CTA, e.g. "/client/requests". */
  href?: string;
}

/** A single "do this next" nudge, e.g. for the dashboard. */
export interface ClientPortalNextStep {
  label: string;
  description: string;
  href?: string;
}

/** The assembled, client-safe overview the dashboard / updates pages render. */
export interface ClientPortalProgressSummary {
  /** Calm one-liner, e.g. "Veroxa is handling your online presence." */
  headline: string;
  /** What Veroxa is actively working on right now. */
  workingOn: ClientPortalJourneyItem[];
  /** What Veroxa needs from the client right now (may be empty). */
  needsFromYou: ClientPortalNeedFromClient[];
  /** Recently completed / advanced items. */
  recentProgress: ClientPortalJourneyItem[];
  /** One friendly sentence about the next focus. */
  nextFocus: string;
}
