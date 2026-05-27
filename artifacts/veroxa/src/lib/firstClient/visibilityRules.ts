/**
 * visibilityRules.ts — M021
 *
 * Helper functions that encode WHO can see WHAT in the first-client
 * data model. Pure functions, no I/O.
 *
 * These rules apply equally to the demo today and to the real
 * implementation later — they are the contract.
 */

import type {
  FirstClientDirectionStatus,
  FirstClientUploadStatus,
} from "./firstClientContracts";

/** Resource categories surfaced anywhere in the app. */
export type ResourceType =
  | "upload_form"
  | "upload_confirmation"
  | "own_recent_session_uploads"
  | "team_portal"
  | "owner_portal"
  | "operator_portal"
  | "other_restaurants"
  | "internal_notes"
  | "pricing_admin"
  | "team_review_notes"
  | "campaign_controls";

/**
 * Restaurant Upload Key is upload-only — never confuse it with the
 * Client Portal. The set below is intentionally narrow.
 */
const UPLOAD_KEY_ALLOWED: ReadonlySet<ResourceType> = new Set([
  "upload_form",
  "upload_confirmation",
  "own_recent_session_uploads",
]);

export function canRestaurantKeyAccess(resource: ResourceType): boolean {
  return UPLOAD_KEY_ALLOWED.has(resource);
}

/**
 * Upload statuses the client is allowed to see. We deliberately do
 * NOT expose internal triage reasons or quality scores.
 */
const CLIENT_VISIBLE_UPLOAD_STATUSES: ReadonlySet<FirstClientUploadStatus> =
  new Set<FirstClientUploadStatus>([
    "received",
    "in_review",
    "accepted",
    "needs_better_photo",
    "saved_for_later",
  ]);

export function canClientSeeUploadStatus(
  status: FirstClientUploadStatus,
): boolean {
  return CLIENT_VISIBLE_UPLOAD_STATUSES.has(status);
}

const CLIENT_VISIBLE_DIRECTION_STATUSES: ReadonlySet<FirstClientDirectionStatus> =
  new Set<FirstClientDirectionStatus>([
    "received",
    "interpreted",
    "in_team_review",
    "planned",
    "completed",
  ]);

export function canClientSeeDirectionStatus(
  status: FirstClientDirectionStatus,
): boolean {
  return CLIENT_VISIBLE_DIRECTION_STATUSES.has(status);
}

/**
 * Internal-only field names that must never be returned to a client
 * surface, even by accident.
 */
const INTERNAL_ONLY_FIELDS: ReadonlySet<string> = new Set([
  "internalNote",
  "reviewerId",
  "rawRejectionNote",
  "internalQualityScore",
  "staffNote",
  "teamMemberId",
  "auditLog",
  "rlsError",
  "supabaseError",
]);

export function isInternalOnlyField(fieldName: string): boolean {
  return INTERNAL_ONLY_FIELDS.has(fieldName);
}

/** Client-facing label for an upload status. Plain, friendly copy. */
export function getClientSafeUploadStatus(
  status: FirstClientUploadStatus,
): string {
  switch (status) {
    case "received":
      return "Received";
    case "in_review":
      return "In review";
    case "accepted":
      return "Accepted for content";
    case "needs_better_photo":
      return "We need a better photo";
    case "saved_for_later":
      return "Saved for later";
  }
}

/** Team-facing label for an upload status. Operational language. */
export function getTeamUploadStatus(status: FirstClientUploadStatus): string {
  switch (status) {
    case "received":
      return "New — needs triage";
    case "in_review":
      return "In review";
    case "accepted":
      return "Accepted for content";
    case "needs_better_photo":
      return "Bounce back — needs better photo";
    case "saved_for_later":
      return "Saved for later";
  }
}
