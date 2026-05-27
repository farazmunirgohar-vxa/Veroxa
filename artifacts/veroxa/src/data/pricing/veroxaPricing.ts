// veroxaPricing.ts — single source of truth for Veroxa flat pricing.
// All UI, demo fixtures, and engine logic that surface plan price values must
// reference this file. Ad spend is always separate and paid by the restaurant
// directly to the ad platform.
//
// IMPORTANT: This file is for pricing display / source-of-truth only.
// No billing or checkout system is connected to this app.
// Do not add payment processing, Stripe, or any checkout logic here.

export type VeroxaPlanId =
  | "google_presence_starter"
  | "complete_online_presence"
  | "ads_management"
  | "bundle";

export type VeroxaPlanLabel =
  | "Google Presence Starter"
  | "Complete Online Presence"
  | "Ads Management"
  | "Bundle";

export interface VeroxaPlan {
  id:           VeroxaPlanId;
  label:        VeroxaPlanLabel;
  priceMonthly: number;     // USD dollars per month (NOT cents), flat rate
  displayPrice: string;     // "$977" style
  tagline:      string;
  includesAdSpend: false;   // ad spend is always separate
}

export const VEROXA_PLANS: Record<VeroxaPlanId, VeroxaPlan> = {
  google_presence_starter: {
    id: "google_presence_starter",
    label: "Google Presence Starter",
    priceMonthly: 477,
    displayPrice: "$477",
    tagline: "Google-only entry offer. Not the full Veroxa OS.",
    includesAdSpend: false,
  },
  complete_online_presence: {
    id: "complete_online_presence",
    label: "Complete Online Presence",
    priceMonthly: 977,
    displayPrice: "$977",
    tagline: "Full Veroxa growth system — content, Google, local SEO, reporting.",
    includesAdSpend: false,
  },
  ads_management: {
    id: "ads_management",
    label: "Ads Management",
    priceMonthly: 977,
    displayPrice: "$977",
    tagline: "Paid advertising management. Ad spend is separate.",
    includesAdSpend: false,
  },
  bundle: {
    id: "bundle",
    label: "Bundle",
    priceMonthly: 1497,
    displayPrice: "$1,497",
    tagline: "Complete Online Presence + Ads Management. Best value.",
    includesAdSpend: false,
  },
};

/** Bundle savings vs buying COP + Ads Management separately. */
export const BUNDLE_SAVINGS_MONTHLY =
  (VEROXA_PLANS.complete_online_presence.priceMonthly +
    VEROXA_PLANS.ads_management.priceMonthly) -
  VEROXA_PLANS.bundle.priceMonthly; // 977 + 977 - 1497 = 457

export const AD_SPEND_DISCLAIMER =
  "Advertising budget is separate and paid by the restaurant directly to the ad platform.";

export function getPlanPrice(label: VeroxaPlanLabel): number {
  return Object.values(VEROXA_PLANS).find((p) => p.label === label)?.priceMonthly ?? 0;
}
