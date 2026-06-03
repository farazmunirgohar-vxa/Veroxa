// veroxaPricing.ts — internal source of truth for Veroxa pricing.
//
// IMPORTANT (owner-locked current pricing — 2026-06-03):
//   * Pricing is owner-locked. Do NOT change any price without explicit
//     owner approval.
//   * Current public model: Starter ($295/mo), Growth ($495/mo),
//     Premium ($995/mo). Growth is the stronger online presence package.
//   * No contract. Cancel anytime.
//   * Posting depends on usable restaurant-provided media and may slow when
//     usable media is unavailable.
//   * Starter is capped at up to 3 posts/week; Growth and Premium are
//     capped at up to 1 post/day, depending on usable media.
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
  | "starter"
  | "growth"
  | "premium"
  | "essential"
  | "google_optimization" // RETIRED — internal Free Audit / lead-scoring alias for Starter
  | "complete_online_presence" // RETIRED — internal Free Audit / lead-scoring alias for Growth
  | "complete_plus_ads" // RETIRED — internal Free Audit / lead-scoring alias for Premium
  | "ads_management_only"; // RETIRED — internal-only alias for Premium-fit ad leads

export type VeroxaPlanLabel =
  | "Starter"
  | "Growth"
  | "Premium"
  | "Essential"
  | "Google Optimization"
  | "Complete Online Presence"
  | "Complete Online Presence + Ads"
  | "Ads Management Only";

export interface VeroxaPlan {
  id: VeroxaPlanId;
  label: VeroxaPlanLabel;
  /** Current monthly price in USD dollars (not cents). */
  priceMonthly: number;
  /** Display string for the current monthly price (e.g. "$295"). */
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
  "Posting depends on usable client-provided media and may slow when usable media is unavailable. Starter is capped at up to 3 posts/week; Growth and Premium are capped at up to 1 post/day.";

export const SERVICE_BOUNDARY_DISCLAIMER =
  "Veroxa does not handle comments, DMs, inboxes, complaints, order questions, refunds, or customer-service conversations at launch. The restaurant remains responsible for customer replies.";

export const PREMIUM_READINESS_RULE =
  "Premium requires a Veroxa readiness assessment by phone, Zoom, or in person, client approval, and an agreed ad budget.";

export const FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY =
  "First clients receive 20% off for 12 months, then keep it as a loyalty discount only while continuously active; if they leave and later return, the 20% discount is no longer eligible.";

const starterPostingVolumeSummary =
  "Up to 3 posts/week, depending on usable client-provided media.";
const growthPostingVolumeSummary =
  "Up to 1 post/day, depending on usable client-provided media.";
const mediaDependencySummary =
  "Posting depends on usable restaurant-provided photos and videos; Veroxa will ask for more when the supply is low.";

const restaurantResponsibilities = [
  "Provide usable photos and videos when content is needed",
  "Confirm business-truth changes such as hours, menu items, prices, offers, and important details",
  "Handle customer replies, comments, DMs, order questions, refunds, complaints, and service conversations",
  "Pay any approved ad spend directly to the ad platform",
];

const starterResponsibilities = [
  "Google Business Profile cleanup",
  "Google Maps/local visibility basics",
  "Hours, menu, order, and social link cleanup",
  "Best-seller visibility guidance and basic photo freshness support",
  "Facebook + Instagram basic posting with simple captions",
  "Review/reputation support through drafts/reminders",
  "Simple monthly progress summary, Client Portal access, and media reminders/upload guidance",
];

const growthResponsibilities = [
  ...starterResponsibilities,
  "Stronger Google/local consistency",
  "Facebook, Instagram, and TikTok consistency using client-provided media",
  "Stronger best-seller/content rhythm",
  "Weekly progress update and monthly report",
  "Limited content/design prep and stronger client portal workflow",
];

const premiumResponsibilities = [
  ...growthResponsibilities,
  "Ads management readiness/support after assessment, client approval, and agreed ad budget",
  "Ad reporting once approved ads are active later",
];

const starterIncludes = [
  "Google Business Profile cleanup",
  "Google Maps/local visibility basics",
  "Hours/menu/order/social link cleanup",
  "Best-seller visibility guidance",
  "Basic photo freshness support",
  "Facebook + Instagram basic posting",
  "Up to 3 posts/week depending on usable media",
  "Simple captions",
  "Review/reputation support through drafts/reminders",
  "Simple monthly progress summary",
  "Client Portal access",
  "Media reminders/upload guidance",
];

const growthIncludes = [
  "Everything in Starter",
  "Stronger Google/local consistency",
  "Facebook + Instagram + TikTok posting support",
  "TikTok posting support using client-provided media",
  "Up to 1 post/day depending on usable media",
  "Stronger best-seller/content rhythm",
  "Weekly progress update",
  "Monthly report",
  "Limited content/design prep",
  "Stronger client portal workflow",
];

const premiumIncludes = [
  "Everything in Growth",
  "Ads management support/readiness after assessment, approval, and agreed ad budget",
  "Stronger reporting",
  "Ad planning/support",
  "Readiness assessment required",
  "Client approval required",
  "Agreed ad budget required",
  "Ad spend separate",
  growthPostingVolumeSummary,
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
  postingVolumeSummary?: string;
  internalOnly?: boolean;
  legacyNote?: string;
}): VeroxaPlan {
  return {
    ...input,
    displayPrice: `$${input.priceMonthly}`,
    includesAdSpend: false,
    postingVolumeSummary:
      input.postingVolumeSummary ?? growthPostingVolumeSummary,
    mediaDependencySummary,
    clientResponsibilities: restaurantResponsibilities,
    premiumReadinessRequirement: input.adsSupport
      ? PREMIUM_READINESS_RULE
      : null,
  };
}

export const VEROXA_PLANS: Record<VeroxaPlanId, VeroxaPlan> = {
  starter: buildPlan({
    id: "starter",
    label: "Starter",
    priceMonthly: 295,
    tagline:
      "Low-friction entry plan for basic online presence consistency and local visibility cleanup.",
    includes: starterIncludes,
    adsSupport: false,
    veroxaResponsibilities: starterResponsibilities,
    publicVisible: true,
    status: "active",
    postingVolumeSummary: starterPostingVolumeSummary,
  }),

  growth: buildPlan({
    id: "growth",
    label: "Growth",
    priceMonthly: 495,
    tagline:
      "For restaurants that want a stronger online presence rhythm across Google, social content, TikTok, weekly updates, and monthly reporting.",
    includes: growthIncludes,
    adsSupport: false,
    veroxaResponsibilities: growthResponsibilities,
    publicVisible: true,
    status: "active",
  }),

  premium: buildPlan({
    id: "premium",
    label: "Premium",
    priceMonthly: 995,
    tagline:
      "Selective advanced package for restaurants ready for ads support and stronger reporting after readiness review.",
    includes: premiumIncludes,
    adsSupport: true,
    veroxaResponsibilities: premiumResponsibilities,
    publicVisible: true,
    status: "active",
  }),

  essential: buildPlan({
    id: "essential",
    label: "Essential",
    priceMonthly: 295,
    tagline:
      "Retired internal compatibility alias. Current public recommendation maps this fit to Starter.",
    includes: starterIncludes,
    adsSupport: false,
    veroxaResponsibilities: starterResponsibilities,
    publicVisible: false,
    internalOnly: true,
    legacyNote:
      "Retired compatibility alias only; not current public pricing. Use Starter for public display.",
    status: "retired",
    postingVolumeSummary: starterPostingVolumeSummary,
  }),

  google_optimization: buildPlan({
    id: "google_optimization",
    label: "Google Optimization",
    priceMonthly: 295,
    tagline:
      "Retired internal alias. Current public recommendation maps this fit to Starter.",
    includes: starterIncludes,
    adsSupport: false,
    veroxaResponsibilities: starterResponsibilities,
    publicVisible: false,
    internalOnly: true,
    legacyNote:
      "Retired compatibility alias only; not current public pricing. Use Starter for public display.",
    status: "retired",
  }),

  complete_online_presence: buildPlan({
    id: "complete_online_presence",
    label: "Complete Online Presence",
    priceMonthly: 495,
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
    priceMonthly: 995,
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
    priceMonthly: 995,
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
  "starter",
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
  "Starter is capped at up to 3 posts/week; Growth/Premium are capped at up to 1 post/day",
  "Growth is the main recommended package for strong-fit restaurants",
  "Premium adds ads management readiness/support; ad spend is separate",
  "Posting depends on usable client-provided media and may slow when usable media is unavailable",
  "Premium requires readiness assessment, client approval, and agreed ad budget",
  FIRST_CLIENT_LOYALTY_DISCOUNT_POLICY,
];

export function getCurrentPublicPlanForPackageId(
  packageId:
    | CurrentPublicPlanId
    | "essential"
    | "google_optimization"
    | "complete_online_presence"
    | "complete_plus_ads"
    | "ads_management_only",
): VeroxaPlan {
  switch (packageId) {
    case "starter":
      return VEROXA_PLANS.starter;
    case "growth":
      return VEROXA_PLANS.growth;
    case "premium":
      return VEROXA_PLANS.premium;
    case "essential":
      return VEROXA_PLANS.starter;
    case "google_optimization":
      return VEROXA_PLANS.starter;
    case "complete_online_presence":
      return VEROXA_PLANS.growth;
    case "complete_plus_ads":
    case "ads_management_only":
      return VEROXA_PLANS.premium;
  }
}

export function getCurrentPublicPlanForLegacyPackage(
  legacyPackageId:
    | "google_optimization"
    | "complete_online_presence"
    | "complete_plus_ads"
    | "ads_management_only",
): VeroxaPlan {
  return getCurrentPublicPlanForPackageId(legacyPackageId);
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
