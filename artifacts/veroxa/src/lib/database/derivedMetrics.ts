import type { MediaAsset } from "./models";
import type { ContentHealthStatus } from "./enums";

// ─────────────────────────────────────────────
// Veroxa Derived Metrics
// Pure functions — no external dependencies.
// ─────────────────────────────────────────────

/**
 * Count media assets that are usable but have not yet been used in a post.
 * "Usable" statuses: usable, shortlisted, approved.
 */
export function calculateUnusedUsableMediaCount(mediaAssets: MediaAsset[]): number {
  const usableStatuses = new Set(["usable", "shortlisted", "approved"]);
  return mediaAssets.filter(
    (asset) => usableStatuses.has(asset.reviewStatus) && asset.usedInPostId === null
  ).length;
}

/**
 * Estimate how many weeks of content remain given the current media supply.
 *
 * Formula:
 *   weeksLeft = unusedUsableMediaCount / postingFrequencyWeekly
 *
 * Returns 0 if postingFrequencyWeekly is zero to avoid division by zero.
 */
export function calculateWeeksOfContentLeft(
  unusedUsableMediaCount: number,
  postingFrequencyWeekly: number
): number {
  if (postingFrequencyWeekly <= 0) return 0;
  return unusedUsableMediaCount / postingFrequencyWeekly;
}

/**
 * Derive the ContentHealthStatus from weeks of content remaining.
 *
 * Thresholds:
 *   >= 2 weeks           → healthy
 *   >= 1 and < 2 weeks   → caution
 *   > 0 and < 1 week     → urgent
 *   === 0 (or negative)  → broken
 */
export function calculateContentHealthStatus(weeksOfContentLeft: number): ContentHealthStatus {
  if (weeksOfContentLeft >= 2) return "healthy";
  if (weeksOfContentLeft >= 1) return "caution";
  if (weeksOfContentLeft > 0) return "urgent";
  return "broken";
}

/**
 * Calculate the percentage of planned posts that were successfully published.
 *
 * Formula:
 *   completionRate = (postsPublished / postsPlanned) * 100
 *
 * Returns 0 if postsPlanned is zero.
 * Result is capped at 100 to handle over-delivery edge cases.
 */
export function calculatePostCompletionRate(
  postsPublished: number,
  postsPlanned: number
): number {
  if (postsPlanned <= 0) return 0;
  return Math.min(100, (postsPublished / postsPlanned) * 100);
}
