/**
 * Visibility Audit Engine — domain contracts.
 *
 * Fixture/rule-based only. These types describe internal team review signals;
 * client-facing code should use the client-safe helpers instead of exposing raw
 * findings, evidence, or rule identifiers.
 */

import type { PreparedActionPriority } from "@/domain/preparedActions";

export type VisibilityAuditInputId = string;
export type VisibilityAuditFindingId = string;

export type VisibilityAuditCategory =
  | "google_profile"
  | "menu"
  | "hours"
  | "website"
  | "reviews"
  | "photos"
  | "catering"
  | "business_claims";

export type VisibilityAuditSeverity = "high" | "medium" | "low";

export type VisibilityAuditConfirmationTopic =
  | "hours"
  | "holiday_hours"
  | "menu"
  | "pricing"
  | "catering"
  | "dietary_claim"
  | "health_claim"
  | "business_detail";

export interface VisibilityAuditSignals {
  hasGoogleProfileLink: boolean;
  hasWebsiteLink: boolean;
  hasMenuLink: boolean;
  hasVisibleHours: boolean;
  hasHolidayHoursNote: boolean;
  hasRecentPhotos: boolean;
  hasUnansweredReviews: boolean;
  mentionsCatering: boolean;
  cateringDetailsConfirmed: boolean;
  mentionsDietaryOrHealthClaim: boolean;
  dietaryOrHealthClaimConfirmed: boolean;
}

export interface VisibilityAuditInput {
  id: VisibilityAuditInputId;
  clientId: string;
  restaurantName: string;
  city: string;
  state: string;
  signals: VisibilityAuditSignals;
  observedAtLabel: string;
}

export interface VisibilityAuditFinding {
  id: VisibilityAuditFindingId;
  inputId: VisibilityAuditInputId;
  clientId: string;
  restaurantName: string;
  category: VisibilityAuditCategory;
  severity: VisibilityAuditSeverity;
  priority: PreparedActionPriority;
  title: string;
  issue: string;
  suggestedNextStep: string;
  needsClientConfirmation: boolean;
  confirmationTopic?: VisibilityAuditConfirmationTopic;
  evidenceLabel: string;
}

export interface VisibilityAuditResult {
  input: VisibilityAuditInput;
  findings: VisibilityAuditFinding[];
  preparedActionCount: number;
}
