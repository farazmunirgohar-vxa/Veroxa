// veroxaPricing.ts — internal source of truth for Veroxa launch pricing.
//
// IMPORTANT (owner-locked current pricing — 2026-06-04):
//   * Current public model: one launch offer only.
//   * Active public offer: Complete Online Presence ($495/month).
//   * Yelp, TikTok, Reels/video content, ads management, daily posting,
//     automated publishing, and live integrations are coming soon / not included
//     at launch.
//   * Weekly updates and a monthly online presence report are included.
//   * New basic website is an add-on (+$95). Missing social profile creation is
//     an add-on (+$45/profile). No checkout/payment logic exists.
//   * First-client loyalty discount is a policy note only: 20% off for the first
//     12 months, then kept only while continuously active. If the client leaves
//     and returns later, the discount no longer applies.
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

export interface LaunchAddon {
  id: "new_basic_website" | "missing_social_profile_creation";
  label: string;
  price: number;
  displayPrice: string;
  scope: string[];
  notIncluded?: string[];
}

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
  addons: LaunchAddon[];
  firstClientLoyaltyPolicy: string;
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
export const NEW_BASIC_WEBSITE_ADDON_PRICE = 95;
export const MISSING_SOCIAL_PROFILE_ADDON_PRICE = 45;
export const FIRST_CLIENT_LOYALTY_DISCOUNT_PERCENT = 20;
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
  "Website alignment/refinement is included when access is provided. A new basic website is available as a $95 add-on; custom development and technical hosting/domain/email troubleshooting are not included.";

export const PREMIUM_READINESS_RULE =
  "Ads management is coming soon and is not included in the current launch package.";

export const OFFER_INVENTION_GUARDRAIL =
  "Veroxa does not recommend or invent discounts, BOGO offers, price cuts, lower prices, or new promotions. If the restaurant already has an offer, Veroxa may ask the client to confirm exact details before preparing public copy.";

export const FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY =
  "First-client loyalty discount: 20% off for the first 12 months, then kept only while continuously active. If the client leaves and returns later, the discount no longer applies.";

export const CURRENT_LAUNCH_INCLUDED = [
  "Google Business Profile support",
  "Google Maps/local visibility basics",
  "Local SEO/search visibility basics",
  "Existing website alignment/refinement if access is provided",
  "Facebook support",
  "Instagram support",
  "Picture-based content support",
  "Up to 3 total posts/updates per week, media dependent",
  "Weekly updates",
  "Monthly online presence report",
  "Client Portal access",
  "Portal request response/review/answer within 24 hours",
  "Veroxa team review before anything goes live",
];

export const CURRENT_LAUNCH_COMING_SOON = [
  "Yelp",
  "TikTok",
  "Reels/video content",
  "Ads management",
  "Daily posting",
  "Automated publishing",
  "Live integrations",
];

export const CURRENT_LAUNCH_NOT_INCLUDED = [
  "Comments, DMs, inboxes, and guest conversations",
  "Customer-service replies, refunds, complaints, or order questions",
  "Full website redesign, custom-coded website development, or advanced design",
  "Hosting, domain, email, plugin, speed, or emergency website troubleshooting",
  "Online ordering setup",
  "Advanced technical SEO",
  "Paid ad spend",
  "Specific outcomes such as orders, revenue, rankings, profit, ROI, customers, walk-ins, or growth",
];

export const CURRENT_LAUNCH_ADDONS: LaunchAddon[] = [
  {
    id: "new_basic_website",
    label: "New basic website",
    price: NEW_BASIC_WEBSITE_ADDON_PRICE,
    displayPrice: "+$95",
    scope: [
      "Simple basic restaurant website",
      "Name/address/phone/hours",
      "Menu/order/contact links",
      "Google/Facebook/Instagram links",
      "Basic local SEO wording",
      "Best-seller/service highlights",
      "Simple mobile-friendly layout",
    ],
    notIncluded: [
      "Custom-coded website",
      "Advanced design",
      "Hosting/domain/email troubleshooting",
      "Online ordering setup",
      "Speed optimization",
      "Plugin troubleshooting",
      "Advanced technical SEO",
      "Unlimited pages/edits",
    ],
  },
  {
    id: "missing_social_profile_creation",
    label: "Missing social profile creation",
    price: MISSING_SOCIAL_PROFILE_ADDON_PRICE,
    displayPrice: "+$45/profile",
    scope: ["Facebook page setup if missing", "Instagram profile setup if missing"],
    notIncluded: ["Yelp setup is coming soon, not a launch add-on", "No live platform account creation exists yet"],
  },
];

const restaurantResponsibilities = [
  "Provide access/media/business details needed for Google, website, Facebook, and Instagram alignment",
  "Confirm business-truth changes such as hours, menu items, prices, existing offers, and important details",
  "Confirm existing offer/promotion details if they want Veroxa to present them",
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
    includes: CURRENT_LAUNCH_INCLUDED,
    comingSoon: CURRENT_LAUNCH_COMING_SOON,
    notIncluded: CURRENT_LAUNCH_NOT_INCLUDED,
    addons: CURRENT_LAUNCH_ADDONS,
    firstClientLoyaltyPolicy: FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY,
    includesAdSpend: false,
    adsSupport: false,
    postingVolumeSummary: launchPostingVolumeSummary,
    mediaDependencySummary,
    veroxaResponsibilities: CURRENT_LAUNCH_INCLUDED,
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
      "Veroxa manages your restaurant's complete online presence across Google, Maps/local visibility, website alignment, Facebook, and Instagram — then sends weekly updates and a monthly online presence report about what worked, what needs improvement, and what media Veroxa needs next.",
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
  "Yelp is coming soon / not included at launch",
  "Up to 3 total posts/updates per week, media dependent",
  "Weekly updates are included",
  "Monthly online presence report is included",
  "New basic website add-on: +$95",
  "Missing social profile creation add-on: +$45/profile",
  FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY,
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
