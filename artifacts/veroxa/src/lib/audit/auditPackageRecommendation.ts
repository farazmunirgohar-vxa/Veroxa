/**
 * auditPackageRecommendation.ts — M026B
 *
 * Rule-based audit → Veroxa package recommendation.
 *
 * Locked rule:
 *   The audit does not automatically sell the most expensive package.
 *   Weak spots decide the package. Foundation comes before ads.
 *
 * Pricing is read from the locked source of truth
 * `@/data/pricing/veroxaPricing` — never hardcoded here.
 */

import { getCurrentPublicPlanForLegacyPackage } from "@/data/pricing/veroxaPricing";
import type {
  AuditCategoryId,
  AuditCategoryScore,
  AuditPackageRecommendation,
  RecommendedPackageId,
  RestaurantAuditInput,
  RestaurantAuditReport,
} from "./auditTypes";

function scoreOf(
  categories: AuditCategoryScore[],
  id: AuditCategoryId,
): number {
  return categories.find((c) => c.id === id)?.score ?? 0;
}

const ADS_GOAL_RE =
  /(ads?|paid traffic|campaign|catering|lunch traffic|dinner traffic|event|faster growth)/i;

const ADS_ONLY_RE = /(ads?|paid traffic|campaign management)/i;

export function getRecommendedFirstStepsForPackage(
  packageId: RecommendedPackageId,
  report: RestaurantAuditReport,
): string[] {
  const topOpportunity =
    report.weakSpots[0]?.title ?? "the largest daily customer opportunity";
  switch (packageId) {
    case "google_optimization":
      return [
        "Google Business Profile support — categories, photos, hours, menu visibility.",
        "Rebuild local search keyword surface and Google post freshness.",
        `Focus the first weekly rhythm around ${topOpportunity}.`,
        "Set review response cadence and trust-signal cleanup.",
      ];
    case "complete_online_presence":
      return [
        "Run a full Google + social profile cleanup and weekly activity update.",
        "Build the weekly content rhythm (lunch / dinner / weekend / catering).",
        "Set up media review and upload guidance so the restaurant can stay involved without managing posting.",
        `Begin a 30-day plan focused on ${topOpportunity}.`,
      ];
    case "complete_plus_ads":
      return [
        "Stabilize the complete online presence system for the first 2–3 weeks.",
        "Define ad angles around the goal (catering / lunch / dinner / event).",
        "Launch a small disciplined test campaign — restaurant pays ad spend directly.",
        "Learn from early signals before scaling.",
      ];
    case "ads_management_only":
      return [
        "Confirm the existing online presence is healthy enough to support paid traffic.",
        "Define one primary campaign goal and one secondary.",
        "Set up disciplined ad structure and reporting cadence.",
        "Review every 2 weeks; adjust angles based on results.",
      ];
  }
}

export function getWhyNotAdsYet(
  report: RestaurantAuditReport,
  _input: RestaurantAuditInput,
): string | null {
  const c = report.categories;
  const search = scoreOf(c, "search_visibility_readiness");
  const maps = scoreOf(c, "google_maps_conversion_readiness");
  const content = scoreOf(c, "content_persuasion_quality");
  const action = scoreOf(c, "action_path_clarity");
  const foundationWeak =
    search < 14 || maps < 14 || content < 10 || action < 10;
  if (!foundationWeak) return null;
  return "Ads are not recommended first. Paid traffic amplifies whatever the customer experiences when they arrive — Google profile, content, menu, hours, calls, directions. If those can be strengthened first, ads spend more efficiently afterward. Veroxa recommends strengthening the foundation first so ads can later carry their full value.";
}

export function getPackageRecommendationReason(
  report: RestaurantAuditReport,
  _input: RestaurantAuditInput,
): { packageId: RecommendedPackageId; reason: string } {
  const c = report.categories;
  const total = report.totalScore;
  const input = report.input;
  const goal = (input.currentGoal ?? "").toLowerCase();
  const notes = (input.notes ?? "").toLowerCase();
  const otherUrl = (input.otherUrl ?? "").toLowerCase();
  const adsContext = `${goal} ${notes} ${otherUrl}`.trim();
  const hasGoal = goal.length > 0;
  const linkCount =
    (input.googleListingUrl ? 1 : 0) +
    (input.websiteUrl ? 1 : 0) +
    (input.menuOrderingUrl ? 1 : 0) +
    (input.instagramUrl ? 1 : 0) +
    (input.facebookUrl ? 1 : 0) +
    (input.tiktokUrl ? 1 : 0);
  const search = scoreOf(c, "search_visibility_readiness");
  const maps = scoreOf(c, "google_maps_conversion_readiness");
  const social = scoreOf(c, "social_reminder_system");
  const content = scoreOf(c, "content_persuasion_quality");
  const action = scoreOf(c, "action_path_clarity");
  const review = scoreOf(c, "review_trust_strength");

  // M027B — Ads Management Only — extremely strict.
  // currentGoal/notes must explicitly mention ads/paid traffic/campaign mgmt.
  if (
    hasGoal &&
    total >= 85 &&
    maps >= 15 &&
    content >= 12 &&
    action >= 12 &&
    ADS_ONLY_RE.test(goal)
  ) {
    return {
      packageId: "ads_management_only",
      reason:
        "Ads Management Only is best for restaurants that already have strong online foundations and only need campaign execution. If the foundation still has room to be strengthened, Veroxa usually recommends improving Google, content, and conversion first.",
    };
  }

  // M027B — Complete + Ads Add-on — recommended less often when no goal text.
  // Requires solid foundation, enough links to trust the foundation, and an
  // ads-leaning signal somewhere in goal/notes/otherUrl.
  if (
    total >= 70 &&
    content >= 11 &&
    action >= 10 &&
    linkCount >= 4 &&
    ADS_GOAL_RE.test(adsContext)
  ) {
    return {
      packageId: "complete_plus_ads",
      reason:
        "Ads can help amplify a restaurant that already has a decent online foundation. Veroxa would not recommend ads as a replacement for Google, content, or conversion basics that still need to be strengthened.",
    };
  }

  // Google Optimization — when discovery + trust is the dominant gap
  const googleFocusGap =
    search < 10 || maps < 10 || review < 5 || (action < 10 && social >= 10);
  const socialNotMain = social >= 10 && content >= 10;
  if (googleFocusGap && socialNotMain) {
    return {
      packageId: "google_optimization",
      reason:
        "Your biggest customer-flow gap is discovery and trust on Google. Before pushing more social content or ads, Veroxa should strengthen the foundation customers use when they search, compare, call, get directions, or decide where to eat.",
    };
  }

  // Default — Growth (legacy package ID retained for audit compatibility).
  return {
    packageId: "complete_online_presence",
    reason:
      "Your restaurant would likely benefit most from a complete online presence system, not just one-time posting or Google cleanup. Veroxa would help organize your Google presence, social media consistency, content quality, customer reminders, and weekly recommendations into one system.",
  };
}

function priceDisplayForPackage(packageId: RecommendedPackageId): {
  label: string;
  standardPriceDisplay: string;
  foundingPriceDisplay: string;
} {
  const p = getCurrentPublicPlanForLegacyPackage(packageId);
  return {
    label: p.label,
    standardPriceDisplay: `${p.displayPrice}/mo`,
    foundingPriceDisplay: "No contract. Cancel anytime.",
  };
}

export function recommendVeroxaPackage(
  report: RestaurantAuditReport,
  input: RestaurantAuditInput,
): AuditPackageRecommendation {
  const { packageId, reason } = getPackageRecommendationReason(report, input);
  const price = priceDisplayForPackage(packageId);
  const whyNotAdsYet =
    packageId === "complete_plus_ads" || packageId === "ads_management_only"
      ? null
      : getWhyNotAdsYet(report, input);
  return {
    packageId,
    packageLabel: price.label,
    standardPriceDisplay: price.standardPriceDisplay,
    foundingPriceDisplay: price.foundingPriceDisplay,
    reason,
    whyNotAdsYet,
    firstSteps: getRecommendedFirstStepsForPackage(packageId, report),
    expectedDirection: getExpectedDirectionForPackage(packageId),
  };
}

/**
 * Soft expected-direction wording. Never promises walk-ins, revenue,
 * rankings, reviews, viral posts, or sales. Results vary by location,
 * offer, food quality, competition, and execution.
 */
export function getExpectedDirectionForPackage(
  packageId: RecommendedPackageId,
): string {
  switch (packageId) {
    case "google_optimization":
      return "Designed to improve consistency on Google and support better visibility at the search/Maps decision moment. Results vary by location, offer, food quality, competition, and execution.";
    case "complete_online_presence":
      return "Designed to improve consistency online and create more customer reminder moments across Google and social, which may improve recall when nearby customers decide where to eat. Results vary by location, offer, food quality, competition, and execution.";
    case "complete_plus_ads":
      return "Designed to layer paid reach on top of a more consistent online foundation. Can support better visibility when foundation work is already in place. Results vary by location, offer, food quality, competition, and execution.";
    case "ads_management_only":
      return "Designed to focus campaign discipline on an existing strong foundation. Can support better visibility for specific goals. Results vary by location, offer, food quality, competition, and execution.";
  }
}
