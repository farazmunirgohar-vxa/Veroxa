// veroxaPricing.ts — internal source of truth for Veroxa pricing.
//
// IMPORTANT (owner-locked current pricing — 2026-05-31):
//   * Pricing is owner-locked. Do NOT change any price without explicit
//     owner approval.
//   * Current public model: Essential ($497/mo), Growth ($697/mo),
//     Premium ($997/mo).
//   * No contract. Cancel anytime.
//   * Posting depends on usable restaurant-provided media and may slow when
//     usable media is unavailable.
//   * All active plans are capped at max 1 post/day unless Faraz explicitly
//     changes this later.
//   * Premium adds ads management readiness/support after assessment, client
//     approval, and agreed ad budget. Ad spend is ALWAYS separate and paid by
//     the restaurant directly to the ad platform.
//   * Veroxa does not handle customer conversations, including comments, DMs,
//     refunds, complaints, or order questions, at launch.
//   * No payment, billing, or checkout integration exists. Do not add Stripe,
//     PayPal, or any checkout logic.
//
// Legacy package IDs remain below only as internal Free Audit / lead-scoring
// compatibility aliases. They are retired, internal-only, and not current
// public pricing.

export type VeroxaPlanId =
  | "essential"
  | "growth"
  | "premium"
  | "google_optimization" // RETIRED — internal Free Audit / lead-scoring alias for Essential
  | "complete_online_presence" // RETIRED — internal Free Audit / lead-scoring alias for Growth
  | "complete_plus_ads" // RETIRED — internal Free Audit / lead-scoring alias for Premium
  | "ads_management_only"; // RETIRED — internal-only alias for Premium-fit ad leads

export type VeroxaPlanLabel =
  | "Essential"
  | "Growth"
  | "Premium"
  | "Google Optimization"
  | "Complete Online Presence"
  | "Complete Online Presence + Ads"
  | "Ads Management Only";

export interface VeroxaPlan {
  id: VeroxaPlanId;
  label: VeroxaPlanLabel;
  /** Current monthly price in USD dollars (not cents). */
  priceMonthly: number;
  /** Display string for the current monthly price (e.g. "$497"). */
  displayPrice: string;
  /** One-line positioning copy. */
  tagline: string;
  /** Feature list / inclusion notes for internal and public-safe surfaces. */
  includes: string[];
  /** Always false — ad spend is separate, never included. */
  includesAdSpend: false;
  /** Whether the plan includes ads management readiness/support. */
  adsSupport: boolean;
  /** Current posting cap language. */
  postingVolumeSummary: string;
  /** Required media dependency language. */
  mediaDependencySummary: string;
  /** What Veroxa handles under this package. */
  veroxaResponsibilities: string[];
  /** What the restaurant remains responsible for. */
  clientResponsibilities: string[];
  /** Premium readiness requirement; null for non-Premium plans. */
  premiumReadinessRequirement: string | null;
  /** Whether this plan is shown on public pricing surfaces. */
  publicVisible: boolean;
  /** True for compatibility aliases that are not current public pricing. */
  internalOnly?: boolean;
  /** Compatibility note for retired/internal IDs. */
  legacyNote?: string;
  /** "active" = currently sold; "retired" = internal/legacy only. */
  status: "active" | "retired";
}

export const PRICING_NO_CONTRACT_DISCLAIMER = "No contract. Cancel anytime.";

export const AD_SPEND_DISCLAIMER =
  "Ad spend is separate and paid directly by the restaurant. Veroxa plan pricing does not include ad spend.";

export const MEDIA_DEPENDENCY_DISCLAIMER =
  "Posting depends on usable client-provided media and may slow when usable media is unavailable. All active plans are capped at max 1 post/day unless Faraz explicitly changes this later.";

export const SERVICE_BOUNDARY_DISCLAIMER =
  "Veroxa does not handle comments, DMs, inboxes, complaints, order questions, refunds, or customer-service conversations at launch. The restaurant remains responsible for customer replies.";

export const PREMIUM_READINESS_RULE =
  "Premium requires 1+ month on Essential or Growth, a Veroxa readiness assessment by phone, Zoom, or in person, client approval, and an agreed ad budget.";

export const FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY =
  "First clients receive 20% off for 12 months, then keep it as a loyalty discount only while continuously active; if they leave and later return, the 20% discount is no longer eligible.";

const postingVolumeSummary =
  "Max 1 post per day, depending on usable client-provided media.";
const mediaDependencySummary =
  "Posting depends on usable restaurant-provided photos and videos; Veroxa will ask for more when the supply is low.";

const restaurantResponsibilities = [
  "Provide usable photos and videos when content is needed",
  "Confirm business-truth changes such as hours, menu items, prices, offers, and important details",
  "Handle customer replies, comments, DMs, order questions, refunds, complaints, and service conversations",
  "Pay any approved ad spend directly to the ad platform",
];

const essentialResponsibilities = [
  "Google Business Profile and Google Maps visibility support",
  "Google Search SEO basics and page consistency",
  "Facebook + Instagram picture posting",
  "Basic captions, weekly updates, and monthly performance snapshot",
  "Client Portal access and media guidance",
];

const growthResponsibilities = [
  ...essentialResponsibilities,
  "TikTok + Reels posting support using restaurant-provided photos and videos",
  "Reels optimization and enhanced monthly report",
];

const premiumResponsibilities = [
  ...growthResponsibilities,
  "Ads management readiness/support after assessment, client approval, and agreed ad budget",
  "Ad reporting once approved ads are active later",
];

const essentialIncludes = [
  "Google Business Profile optimization",
  "Google Search SEO basics",
  "Google Maps SEO basics",
  "Facebook + Instagram picture posting",
  "Basic captions",
  "Weekly updates",
  "Monthly performance snapshot",
  "Client Portal access",
  postingVolumeSummary,
];

const growthIncludes = [
  "Everything in Essential",
  "TikTok + Reels posting support using the photos and videos you provide",
  "Reels optimization",
  "Enhanced monthly report",
  postingVolumeSummary,
];

const premiumIncludes = [
  "Everything in Growth",
  "Ads management support/readiness after assessment, approval, and agreed ad budget",
  "Platform-specific drafting and adaptation",
  "Ad reporting once approved ads are active later",
  postingVolumeSummary,
  PREMIUM_READINESS_RULE,
  AD_SPEND_DISCLAIMER,
];

function buildPlan(input: {
  id: VeroxaPlanId;
  label: VeroxaPlanLabel;
  priceMonthly: number;
  tagline: string;
  includes: string[];
  adsSupport: boolean;
  veroxaResponsibilities: string[];
  publicVisible: boolean;
  status: "active" | "retired";
  internalOnly?: boolean;
  legacyNote?: string;
}): VeroxaPlan {
  return {
    ...input,
    displayPrice: `$${input.priceMonthly}`,
    includesAdSpend: false,
    postingVolumeSummary,
    mediaDependencySummary,
    clientResponsibilities: restaurantResponsibilities,
    premiumReadinessRequirement: input.adsSupport
      ? PREMIUM_READINESS_RULE
      : null,
  };
}

export const VEROXA_PLANS: Record<VeroxaPlanId, VeroxaPlan> = {
  essential: buildPlan({
    id: "essential",
    label: "Essential",
    priceMonthly: 497,
    tagline:
      "Core Google Business Profile, Google Maps, and Facebook/Instagram picture-posting support for steady restaurant visibility.",
    includes: essentialIncludes,
    adsSupport: false,
    veroxaResponsibilities: essentialResponsibilities,
    publicVisible: true,
    status: "active",
  }),

  growth: buildPlan({
    id: "growth",
    label: "Growth",
    priceMonthly: 697,
    tagline:
      "Essential visibility plus TikTok + Reels posting support using the photos and videos you provide, with an enhanced monthly report.",
    includes: growthIncludes,
    adsSupport: false,
    veroxaResponsibilities: growthResponsibilities,
    publicVisible: true,
    status: "active",
  }),

  premium: buildPlan({
    id: "premium",
    label: "Premium",
    priceMonthly: 997,
    tagline:
      "Growth-level posting support plus ads management readiness/support. Ad spend is separate and posting remains media-dependent.",
    includes: premiumIncludes,
    adsSupport: true,
    veroxaResponsibilities: premiumResponsibilities,
    publicVisible: true,
    status: "active",
  }),

  google_optimization: buildPlan({
    id: "google_optimization",
    label: "Google Optimization",
    priceMonthly: 497,
    tagline:
      "Retired internal alias. Current public recommendation maps this fit to Essential.",
    includes: essentialIncludes,
    adsSupport: false,
    veroxaResponsibilities: essentialResponsibilities,
    publicVisible: false,
    internalOnly: true,
    legacyNote:
      "Retired compatibility alias only; not current public pricing. Use Essential for public display.",
    status: "retired",
  }),

  complete_online_presence: buildPlan({
    id: "complete_online_presence",
    label: "Complete Online Presence",
    priceMonthly: 697,
    tagline:
      "Retired internal alias. Current public recommendation maps this fit to Growth.",
    includes: growthIncludes,
    adsSupport: false,
    veroxaResponsibilities: growthResponsibilities,
    publicVisible: false,
    internalOnly: true,
    legacyNote:
      "Retired compatibility alias only; not current public pricing. Use Growth for public display.",
    status: "retired",
  }),

  complete_plus_ads: buildPlan({
    id: "complete_plus_ads",
    label: "Complete Online Presence + Ads",
    priceMonthly: 997,
    tagline:
      "Retired internal alias. Current public recommendation maps this fit to Premium.",
    includes: premiumIncludes,
    adsSupport: true,
    veroxaResponsibilities: premiumResponsibilities,
    publicVisible: false,
    internalOnly: true,
    legacyNote:
      "Retired compatibility alias only; not current public pricing. Use Premium for public display.",
    status: "retired",
  }),

  ads_management_only: buildPlan({
    id: "ads_management_only",
    label: "Ads Management Only",
    priceMonthly: 997,
    tagline:
      "Retired internal-only alias. Current public recommendation maps this fit to Premium.",
    includes: premiumIncludes,
    adsSupport: true,
    veroxaResponsibilities: premiumResponsibilities,
    publicVisible: false,
    internalOnly: true,
    legacyNote:
      "Retired compatibility alias only; not current public pricing. Use Premium for public display.",
    status: "retired",
  }),
};

export const CURRENT_PUBLIC_PLAN_IDS = [
  "essential",
  "growth",
  "premium",
] as const;

export type CurrentPublicPlanId = (typeof CURRENT_PUBLIC_PLAN_IDS)[number];

export const CURRENT_PUBLIC_PLANS = CURRENT_PUBLIC_PLAN_IDS.map(
  (id) => VEROXA_PLANS[id],
);

export const GLOBAL_PRICING_RULES = [
  "No contract",
  "Cancel anytime",
  "Google Business Profile and Google Maps support included in all plans",
  "Facebook + Instagram included in all plans",
  "All active plans are capped at max 1 post/day",
  "Growth adds TikTok + Reels posting support using the photos and videos you provide",
  "Premium adds ads management readiness/support; ad spend is separate",
  "Posting depends on usable client-provided media and may slow when usable media is unavailable",
  "Premium requires 1+ month on Essential/Growth, Veroxa readiness assessment, client approval, and agreed ad budget",
  FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY,
];

export function getCurrentPublicPlanForLegacyPackage(
  legacyPackageId:
    | "google_optimization"
    | "complete_online_presence"
    | "complete_plus_ads"
    | "ads_management_only",
): VeroxaPlan {
  switch (legacyPackageId) {
    case "google_optimization":
      return VEROXA_PLANS.essential;
    case "complete_online_presence":
      return VEROXA_PLANS.growth;
    case "complete_plus_ads":
    case "ads_management_only":
      return VEROXA_PLANS.premium;
  }
}

export function getPlanMonthlyPrice(label: VeroxaPlanLabel): number {
  return (
    Object.values(VEROXA_PLANS).find((p) => p.label === label)?.priceMonthly ??
    0
  );
}

export function getPlanDisplayPrice(label: VeroxaPlanLabel): string {
  return (
    Object.values(VEROXA_PLANS).find((p) => p.label === label)?.displayPrice ??
    "$0"
  );
}
