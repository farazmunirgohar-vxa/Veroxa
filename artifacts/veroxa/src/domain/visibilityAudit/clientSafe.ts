/**
 * Visibility Audit — client-safe translation layer (foundation only).
 *
 * Clients never see audit internals, scores that look like grades, severities,
 * the queue, or any AI/automation wording. These helpers translate the internal
 * audit into calm, reassuring, plain-language progress. They are the foundation
 * for future client-facing progress and are intentionally NOT surfaced heavily
 * in client UI yet. Mirror of the prepared-actions clientSafe layer.
 */

import type {
  VisibilityAuditCategory,
  VisibilityAuditFinding,
  VisibilityAuditResult,
} from "./types";

/** Categories that are safe to describe to a client in friendly terms. */
const CLIENT_SAFE_CATEGORY_LABELS: Record<VisibilityAuditCategory, string> = {
  google_business_profile: "Your Google listing",
  local_seo: "Being found nearby",
  website: "Your website",
  reviews: "Your reviews",
  social_profile: "Your social pages",
  menu_visibility: "Your menu",
  catering_visibility: "Catering",
  content_freshness: "Fresh content",
};

/**
 * Whether a finding should ever be shown to a client. We never surface internal
 * profile completeness numbers, broken-link diagnostics, or other "under the
 * hood" items — only positive, action-oriented areas of focus.
 */
export function shouldShowVisibilityFindingToClient(finding: VisibilityAuditFinding): boolean {
  // Internal-only diagnostics stay with the team.
  if (finding.source === "manual_team_check") return false;
  if (finding.category === "local_seo") return false;
  // Only share areas the team is actively preparing work for.
  return finding.actionable;
}

/** A single calm, client-safe line for one finding (no severity, no jargon). */
export function getClientSafeVisibilityFinding(finding: VisibilityAuditFinding): string {
  const area = CLIENT_SAFE_CATEGORY_LABELS[finding.category];
  return `${area}: we're getting an improvement ready for you.`;
}

/** A reassuring one-line status for the whole audit (no scores or grades). */
export function getClientSafeVisibilityStatus(result: VisibilityAuditResult): string {
  const visibleCount = result.findings.filter(shouldShowVisibilityFindingToClient).length;
  if (visibleCount === 0) {
    return "Your online presence is in good shape — we're keeping it fresh.";
  }
  if (visibleCount <= 2) {
    return "We're preparing a couple of improvements to help more local customers find you.";
  }
  return "We're preparing several improvements to help more local customers find you.";
}

/** A short client-safe summary object for future client-facing surfaces. */
export interface ClientSafeVisibilitySummary {
  restaurantName: string;
  status: string;
  focusAreas: string[];
}

export function getClientSafeVisibilitySummary(
  result: VisibilityAuditResult,
): ClientSafeVisibilitySummary {
  const focusAreas = Array.from(
    new Set(
      result.findings
        .filter(shouldShowVisibilityFindingToClient)
        .map((f) => CLIENT_SAFE_CATEGORY_LABELS[f.category]),
    ),
  );
  return {
    restaurantName: result.restaurantName,
    status: getClientSafeVisibilityStatus(result),
    focusAreas,
  };
}
