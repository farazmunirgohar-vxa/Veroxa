// veroxaPricing.ts — internal source of truth for Veroxa launch pricing.
//
// IMPORTANT (owner-locked current pricing — 2026-06-04):
//   * Current public model: one launch offer only.
//   * Active public offer: Complete Online Presence ($495/month).
//   * No contract. Cancel anytime.
//   * Posting depends on usable restaurant-provided media and may slow when
//     usable media is unavailable.
//   * The current launch offer includes up to 3 total posts/updates per week,
//     media dependent.
//   * TikTok, Reels/video content, ads management, daily posting, automated
//     publishing, and live integrations are coming soon / not included at launch.
//   * Ad spend is ALWAYS separate and paid by the restaurant directly to the ad
//     platform if ads are approved in a future offer.
//   * Veroxa does not handle customer conversations, including comments, DMs,
//     refunds, complaints, or order questions, at launch.
//   * Veroxa does not invent discounts, BOGO offers, price cuts, lower prices,
//     or new promotions.
//   * No payment, billing, checkout, production auth, storage, live AI,
//     publishing connector, webhook, cron, or real client-data write exists.
//
// Legacy package IDs remain below only as internal/demo compatibility aliases.
// Starter/Growth/Premium/Local Presence/Full Presence/old Complete Presence are
// retired as public offers and map safely to the one current launch offer.

export type VeroxaPlanId =
  | "complete_online_presence"
  | "starter"
  | "growth"
  | "premium"
  | "essential"
  | "google_optimization"
  | "local_presence"
  | "full_presence"
  | "old_complete_presence"
  | "complete_plus_ads"
  | "ads_management_only";

export type VeroxaPlanLabel =
  | "Complete Online Presence"
  | "Starter"
  | "Growth"
  | "Premium"
  | "Essential"
  | "Google Optimization"
  | "Local Presence"
  | "Full Presence"
  | "Old Complete Presence"
  | "Complete Online Presence + Ads"
  | "Ads Management Only";

export interface VeroxaPlan {
  id: VeroxaPlanId;
  label: VeroxaPlanLabel;
  /** Current monthly price in USD dollars (not cents). */
  priceMonthly: number;
  /** Display string for the current monthly price. */
  displayPrice: string;
  tagline: string;
  includes: string[];
  comingSoon: string[];
  notIncluded: string[];
  includesAdSpend: false;
  adsSupport: boolean;
  postingVolumeSummary: string;
  mediaDependencySummary: string;
  veroxaResponsibilities: string[];
  clientResponsibilities: string[];
  premiumReadinessRequirement: string | null;
  publicVisible: boolean;
  internalOnly?: boolean;
  legacyNote?: string;
  status: "active" | "retired";
}

export const COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY = 495;
export const COMPLETE_ONLINE_PRESENCE_DISPLAY_PRICE = "$495";
export const COMPLETE_ONLINE_PRESENCE_PLAN_ID = "complete_online_presence" as const;
export const PRICING_NO_CONTRACT_DISCLAIMER = "No contract. Cancel anytime.";

export const AD_SPEND_DISCLAIMER =
  "Ad spend is separate and paid directly by the restaurant. Veroxa launch pricing does not include ad spend.";

export const MEDIA_DEPENDENCY_DISCLAIMER =
  "Posting depends on usable client-provided media and may slow when usable media is unavailable. The launch offer includes up to 3 total posts/updates per week, media dependent.";

export const SERVICE_BOUNDARY_DISCLAIMER =
  "Veroxa does not handle comments, DMs, inboxes, complaints, order questions, refunds, or customer-service conversations at launch. The restaurant remains responsible for guest replies.";

export const WEBSITE_SCOPE_DISCLAIMER =
  "Basic website alignment/refinement is included when access is provided. Full website development is not included.";

export const PREMIUM_READINESS_RULE =
  "Ads management is coming soon and is not included in the current launch package.";

export const OFFER_INVENTION_GUARDRAIL =
  "Veroxa does not recommend or invent discounts, BOGO offers, price cuts, lower prices, or new promotions. If the restaurant already has an offer, Veroxa may ask the client to confirm exact details before preparing public copy.";

export const FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY =
  "Historical/internal loyalty policy only; not active public launch pricing copy.";

const launchIncluded = [
  "Google Business Profile support",
  "Google Maps/local visibility basics",
  "Local SEO/search visibility basics",
  "Yelp business profile alignment/refinement",
  "Basic website alignment/refinement if access is provided",
  "Business info consistency across Google/Yelp/website/socials",
  "Facebook support",
  "Instagram support",
  "Picture-based content support",
  "Up to 3 total posts/updates per week, media dependent",
  "Simple captions",
  "Basic content organization",
  "Media guidance/reminders",
  "Client Portal access",
  "Portal request response/review/answer within 24 hours",
  "Monthly online presence report",
  "Veroxa team review before anything goes live",
];

const launchComingSoon = [
  "TikTok support",
  "Reels/video content support",
  "Ads management",
  "Daily posting",
  "Automated publishing",
  "Live integrations",
];

const launchNotIncluded = [
  "Comments, DMs, inboxes, and guest conversations",
  "Customer-service replies, refunds, complaints, or order questions",
  "Full website redesign/development or custom website builds",
  "Hosting, domain, email, plugin, speed, or emergency website troubleshooting",
  "Advanced technical SEO",
  "Paid ad spend",
  "Specific outcomes such as orders, revenue, rankings, profit, ROI, customers, or growth",
];

const restaurantResponsibilities = [
  "Provide access/media/business details needed for Google, Yelp, website, Facebook, and Instagram alignment",
  "Confirm business-truth changes such as hours, menu items, prices, existing offers, and important details",
  "Handle comments, DMs, inboxes, customer-service replies, refunds, complaints, and order questions",
  "Provide usable restaurant media; Veroxa will explain what is working, what is not working, and what media is needed next",
];

const launchPostingVolumeSummary =
  "Up to 3 total posts/updates per week, depending on usable client-provided media.";
const mediaDependencySummary =
  "Posting depends on usable restaurant-provided photos; Veroxa will ask for more when the supply is low.";

function buildPlan(input: {
  id: VeroxaPlanId;
  label: VeroxaPlanLabel;
  priceMonthly?: number;
  tagline: string;
  publicVisible: boolean;
  status: "active" | "retired";
  internalOnly?: boolean;
  legacyNote?: string;
}): VeroxaPlan {
  const priceMonthly = input.priceMonthly ?? COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY;
  return {
    ...input,
    priceMonthly,
    displayPrice: `$${priceMonthly}`,
    includes: launchIncluded,
    comingSoon: launchComingSoon,
    notIncluded: launchNotIncluded,
    includesAdSpend: false,
    adsSupport: false,
    postingVolumeSummary: launchPostingVolumeSummary,
    mediaDependencySummary,
    veroxaResponsibilities: launchIncluded,
    clientResponsibilities: restaurantResponsibilities,
    premiumReadinessRequirement: null,
  };
}

const retiredNote =
  "Retired/internal compatibility alias only; not current public pricing. Public-safe display maps to Complete Online Presence ($495/month).";

export const VEROXA_PLANS: Record<VeroxaPlanId, VeroxaPlan> = {
  complete_online_presence: buildPlan({
    id: "complete_online_presence",
    label: "Complete Online Presence",
    tagline:
      "Veroxa manages your restaurant's complete online presence across Google, Maps, Yelp, website alignment, Facebook, and Instagram — then reports what worked, what needs improvement, and what media Veroxa needs next.",
    publicVisible: true,
    status: "active",
  }),
  starter: buildPlan({
    id: "starter",
    label: "Starter",
    tagline: "Historical/internal alias now mapped to the one launch offer.",
    publicVisible: false,
    status: "retired",
    internalOnly: true,
    legacyNote: retiredNote,
  }),
  growth: buildPlan({
    id: "growth",
    label: "Growth",
    tagline: "Historical/internal alias now mapped to the one launch offer.",
    publicVisible: false,
    status: "retired",
    internalOnly: true,
    legacyNote: retiredNote,
  }),
  premium: buildPlan({
    id: "premium",
    label: "Premium",
    tagline: "Historical/internal alias; ads management is coming soon, not included at launch.",
    publicVisible: false,
    status: "retired",
    internalOnly: true,
    legacyNote: retiredNote,
  }),
  essential: buildPlan({ id: "essential", label: "Essential", tagline: "Retired internal alias.", publicVisible: false, status: "retired", internalOnly: true, legacyNote: retiredNote }),
  google_optimization: buildPlan({ id: "google_optimization", label: "Google Optimization", tagline: "Retired internal alias.", publicVisible: false, status: "retired", internalOnly: true, legacyNote: retiredNote }),
  local_presence: buildPlan({ id: "local_presence", label: "Local Presence", tagline: "Retired internal alias.", publicVisible: false, status: "retired", internalOnly: true, legacyNote: retiredNote }),
  full_presence: buildPlan({ id: "full_presence", label: "Full Presence", tagline: "Retired internal alias.", publicVisible: false, status: "retired", internalOnly: true, legacyNote: retiredNote }),
  old_complete_presence: buildPlan({ id: "old_complete_presence", label: "Old Complete Presence", tagline: "Retired internal alias.", publicVisible: false, status: "retired", internalOnly: true, legacyNote: retiredNote }),
  complete_plus_ads: buildPlan({ id: "complete_plus_ads", label: "Complete Online Presence + Ads", tagline: "Retired internal alias; ads are coming soon.", publicVisible: false, status: "retired", internalOnly: true, legacyNote: retiredNote }),
  ads_management_only: buildPlan({ id: "ads_management_only", label: "Ads Management Only", tagline: "Retired internal alias; ads are coming soon.", publicVisible: false, status: "retired", internalOnly: true, legacyNote: retiredNote }),
};

export const CURRENT_PUBLIC_PLAN_IDS = ["complete_online_presence"] as const;
export type CurrentPublicPlanId = (typeof CURRENT_PUBLIC_PLAN_IDS)[number];
export const CURRENT_PUBLIC_PLANS = CURRENT_PUBLIC_PLAN_IDS.map((id) => VEROXA_PLANS[id]);
export const COMPLETE_ONLINE_PRESENCE_PLAN = VEROXA_PLANS.complete_online_presence;

export const GLOBAL_PRICING_RULES = [
  "One active public launch offer: Complete Online Presence — $495/month",
  "No contract",
  "Cancel anytime",
  "Up to 3 total posts/updates per week, media dependent",
  "Portal request response/review/answer within 24 hours; this is not a completion promise",
  "TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations are coming soon / not included at launch",
  "Customer-service replies, comments, DMs, refunds, complaints, and order questions are not included",
  WEBSITE_SCOPE_DISCLAIMER,
  AD_SPEND_DISCLAIMER,
  OFFER_INVENTION_GUARDRAIL,
];

export function getCurrentPublicPlanForPackageId(packageId: VeroxaPlanId): VeroxaPlan {
  return VEROXA_PLANS.complete_online_presence;
}

export function getCurrentPublicPlanForLegacyPackage(legacyPackageId: Exclude<VeroxaPlanId, "complete_online_presence">): VeroxaPlan {
  return getCurrentPublicPlanForPackageId(legacyPackageId);
}

export function getPlanMonthlyPrice(label: VeroxaPlanLabel): number {
  return Object.values(VEROXA_PLANS).find((p) => p.label === label)?.priceMonthly ?? COMPLETE_ONLINE_PRESENCE_PRICE_MONTHLY;
}

export function getPlanDisplayPrice(label: VeroxaPlanLabel): string {
  return Object.values(VEROXA_PLANS).find((p) => p.label === label)?.displayPrice ?? COMPLETE_ONLINE_PRESENCE_DISPLAY_PRICE;
}
