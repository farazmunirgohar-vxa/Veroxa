/**
 * auditPackageRecommendation.ts — M026B
 *
 * Rule-based audit → Veroxa one-offer fit recommendation.
 *
 * Locked rule:
 *   The audit does not recommend multiple public packages. Weak spots decide
 *   whether Complete Online Presence is a fit, needs manual review, or is
 *   not a fit yet. Foundation comes before future ads.
 *
 * Pricing is read from the locked source of truth
 * `@/data/pricing/veroxaPricing` — never hardcoded here.
 */

import { getCurrentPublicPlanForPackageId } from "@/data/pricing/veroxaPricing";
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
  _packageId: RecommendedPackageId,
  report: RestaurantAuditReport,
): string[] {
  const topOpportunity =
    report.weakSpots[0]?.title ?? "the largest online presence opportunity";
  return [
    "Review Google Business Profile and Google Maps/local visibility basics.",
    "Check Yelp, website, menu/order/contact links, Facebook, and Instagram consistency.",
    "Prepare current-launch image draft directions for Facebook, Instagram, and Google after team review.",
    `Begin a portal-first plan focused on ${topOpportunity}.`,
  ];
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
  const total = report.totalScore;
  const missingCore = report.weakSpots.length >= 4 || total < 35;
  if (missingCore) {
    return {
      packageId: "complete_online_presence",
      reason:
        "Not ready / needs manual review. Veroxa should confirm access, media supply, and basic business information before treating this restaurant as a launch-package fit.",
    };
  }

  return {
    packageId: "complete_online_presence",
    reason:
      "Complete Online Presence is the relevant launch offer. Veroxa would review Google, Maps, Yelp, website alignment, Facebook, Instagram, media supply, and link clarity before any public-facing work goes live.",
  };
}

function priceDisplayForPackage(packageId: RecommendedPackageId): {
  label: string;
  standardPriceDisplay: string;
  foundingPriceDisplay: string;
} {
  const p = getCurrentPublicPlanForPackageId(packageId);
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
    getWhyNotAdsYet(report, input);
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
  _packageId: RecommendedPackageId,
): string {
  return "Designed to improve online presence consistency across Google, Maps, Yelp, website alignment, Facebook, and Instagram. TikTok, Reels/video, and ads are coming soon and are not included at launch. Results vary and are not guaranteed.";
}
