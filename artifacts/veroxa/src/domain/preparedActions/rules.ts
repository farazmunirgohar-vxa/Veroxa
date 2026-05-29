/**
 * Prepared Actions — permission / risk rules.
 *
 * Pure, deterministic helpers that decide what sign-off a prepared action needs
 * and how risky it is. No side effects, no network. These rules are the safety
 * gate the whole Approval-to-Execution model depends on: nothing public or
 * business-sensitive should ever run without the right approval.
 */

import type {
  ApprovalRequirement,
  ApprovalRiskLevel,
  PreparedAction,
  PreparedActionType,
} from "./types";

/**
 * Action types that change a customer-visible / public surface (Google, social,
 * website, public review replies). These always need at least team approval.
 */
const PUBLIC_FACING_TYPES: ReadonlySet<PreparedActionType> = new Set([
  "google_post",
  "google_photo_upload",
  "review_reply",
  "social_post",
  "website_copy_update",
  "website_link_fix",
  "menu_visibility_update",
  "daily_customer_push",
  "catering_push",
  "review_growth_push",
]);

/**
 * Action types that touch a "business truth" the restaurant alone owns — hours,
 * prices, menu, dietary/health claims, offers. These need client confirmation
 * before anything is changed.
 */
const SENSITIVE_BUSINESS_TRUTH_TYPES: ReadonlySet<PreparedActionType> = new Set([
  "website_copy_update",
  "menu_visibility_update",
  "catering_push",
]);

/**
 * Action types that are purely internal — audits, drafts, classification,
 * internal follow-ups. No approval required to prepare/keep them internal.
 */
const INTERNAL_ONLY_TYPES: ReadonlySet<PreparedActionType> = new Set([
  "profile_audit_fix",
  "internal_follow_up",
  "seo_keyword_update",
]);

/** True if executing the action would change a public, customer-visible surface. */
export function isPublicFacingAction(action: PreparedAction): boolean {
  return PUBLIC_FACING_TYPES.has(action.type);
}

/**
 * True if the action depends on a fact only the restaurant can confirm (hours,
 * prices, offers, menu, dietary/health claims, catering availability).
 */
export function isSensitiveBusinessTruth(action: PreparedAction): boolean {
  if (SENSITIVE_BUSINESS_TRUTH_TYPES.has(action.type)) return true;
  // Belt-and-braces: if the prepared text mentions a business-truth concept,
  // treat it as sensitive even when the type alone wouldn't.
  const haystack = `${action.title} ${action.reason} ${action.payload.preparedText ?? ""}`.toLowerCase();
  return /\b(price|pricing|discount|offer|deal|hours|holiday|menu|catering|halal|organic|gluten|vegan|allergy|allergen|health|dietary|ingredient|claim|profile|website link|business link|address|phone)\b/.test(
    haystack,
  );
}

/**
 * The approval a prepared action requires. Order of precedence:
 *   never_automatic > client_confirmation_required > team_approval_required > none.
 */
export function getApprovalRequirement(action: PreparedAction): ApprovalRequirement {
  // Some action types must never run automatically regardless of content.
  // (Ad budget changes, deletions, legal/health guarantees are not modelled as
  // first-class types here; they would arrive flagged and are handled as
  // never_automatic if/when added.)
  if (isSensitiveBusinessTruth(action)) return "client_confirmation_required";
  if (isPublicFacingAction(action)) return "team_approval_required";
  if (INTERNAL_ONLY_TYPES.has(action.type)) return "none_internal_only";
  // Client-facing messages (reminders, content requests, reports) are not public
  // but still go out under Veroxa's name, so they need team approval.
  return "team_approval_required";
}

/** Coarse risk level used for sorting and badges. */
export function getRiskLevel(action: PreparedAction): ApprovalRiskLevel {
  if (isSensitiveBusinessTruth(action)) return "sensitive";
  if (isPublicFacingAction(action)) {
    // Website + menu edits carry more blast radius than a single post.
    return action.type === "website_copy_update" || action.type === "menu_visibility_update"
      ? "high"
      : "medium";
  }
  if (INTERNAL_ONLY_TYPES.has(action.type)) return "low";
  return "low";
}

/** True only for internal-only actions that need no sign-off. */
export function canExecuteWithoutApproval(action: PreparedAction): boolean {
  return getApprovalRequirement(action) === "none_internal_only";
}

/** True if the restaurant must confirm before this action can proceed. */
export function requiresClientConfirmation(action: PreparedAction): boolean {
  return getApprovalRequirement(action) === "client_confirmation_required";
}
