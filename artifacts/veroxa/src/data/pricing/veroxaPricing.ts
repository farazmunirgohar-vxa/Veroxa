// veroxaPricing.ts — single source of truth for Veroxa pricing.
//
// All UI copy, demo fixtures, and engine logic that surface plan prices
// must read from this file.
//
// IMPORTANT (owner-locked final pricing):
//   * Pricing is owner-locked. Do NOT change any price without explicit
//     owner approval.
//   * PUBLICLY OFFERED MODEL (shown on the pricing page):
//       - Complete Online Presence — the core package.
//           $977/mo standard, $488/mo first year (50% founding offer).
//       - Ads Management — add-on to Complete Online Presence ONLY.
//           +$477/mo. NO founding discount applies to Ads Management.
//       - Combined (Complete Online Presence + Ads Management):
//           $1,454/mo standard, $965/mo first year.
//   * 50% first-year founding offer applies ONLY to Complete Online
//     Presence, never to Ads Management.
//   * There is NO separate "Bundle" plan. Complete Online Presence +
//     Ads Add-on is expressed as two line items added together.
//   * google_optimization and ads_standalone are NO LONGER publicly
//     offered packages. They are retained here only because the internal
//     Free Audit recommendation engine and lead-scoring still reference
//     them. They MUST NOT be surfaced on the public pricing page.
//   * Ad spend is ALWAYS separate and paid by the restaurant directly
//     to the ad platform. No plan includes ad spend.
//   * No payment, billing, or checkout integration exists. Do not add
//     Stripe, PayPal, or any checkout logic.

export type VeroxaPlanId =
  | "google_optimization"
  | "complete_online_presence"
  | "ads_addon"
  | "ads_standalone";

export type VeroxaPlanLabel =
  | "Google Optimization"
  | "Complete Online Presence"
  | "Ads Add-on"
  | "Ads Management Only";

export interface VeroxaPlan {
  id: VeroxaPlanId;
  label: VeroxaPlanLabel;
  /** Standard monthly price in USD dollars (not cents). */
  priceMonthly: number;
  /** Founding client first-year monthly price in USD dollars. 50% off standard. */
  priceMonthlyFounding: number;
  /** Display string for standard price, e.g. "$977" or "+$497" for add-ons. */
  displayPrice: string;
  /** Display string for founding first-year price, e.g. "$489" or "+$249". */
  displayPriceFounding: string;
  /** One-line positioning. */
  tagline: string;
  /** Always false — ad spend is separate, never included. */
  includesAdSpend: false;
}

export const VEROXA_PLANS: Record<VeroxaPlanId, VeroxaPlan> = {
  // RETIRED from public sale — kept for internal Free Audit / lead-scoring
  // compatibility only. Not shown on the pricing page.
  google_optimization: {
    id: "google_optimization",
    label: "Google Optimization",
    priceMonthly: 477,
    priceMonthlyFounding: 239,
    displayPrice: "$477",
    displayPriceFounding: "$239",
    tagline:
      "Google Search SEO, Google Maps SEO, Google Business Profile, and reviews support.",
    includesAdSpend: false,
  },
  complete_online_presence: {
    id: "complete_online_presence",
    label: "Complete Online Presence",
    priceMonthly: 977,
    priceMonthlyFounding: 488,
    displayPrice: "$977",
    displayPriceFounding: "$488",
    tagline:
      "Facebook, Instagram, TikTok, Google Optimization, content planning, posting support, weekly updates, monthly reports.",
    includesAdSpend: false,
  },
  ads_addon: {
    id: "ads_addon",
    label: "Ads Add-on",
    priceMonthly: 477,
    // No founding discount applies to Ads Management — founding price
    // equals the standard price by design.
    priceMonthlyFounding: 477,
    displayPrice: "+$477",
    displayPriceFounding: "+$477",
    tagline:
      "Add advertising management to Complete Online Presence. Ad spend is separate.",
    includesAdSpend: false,
  },
  // RETIRED from public sale — kept for internal Free Audit / lead-scoring
  // compatibility only. Not shown on the pricing page.
  ads_standalone: {
    id: "ads_standalone",
    label: "Ads Management Only",
    priceMonthly: 997,
    priceMonthlyFounding: 499,
    displayPrice: "$997",
    displayPriceFounding: "$499",
    tagline:
      "Standalone advertising management without the Complete Online Presence system. Ad spend is separate.",
    includesAdSpend: false,
  },
};

// ── Combined service totals (Complete Online Presence + Ads Add-on) ──
//
// This is NOT a separate "bundle" plan. It is just the two line items
// added together so sales conversations and pricing tables can show a
// single number. Always display it as two line items + a total, never
// as a standalone plan.

export const COMPLETE_PLUS_ADS_TOTAL_MONTHLY =
  VEROXA_PLANS.complete_online_presence.priceMonthly +
  VEROXA_PLANS.ads_addon.priceMonthly; // 977 + 477 = 1454

export const COMPLETE_PLUS_ADS_FOUNDING_TOTAL_MONTHLY =
  VEROXA_PLANS.complete_online_presence.priceMonthlyFounding +
  VEROXA_PLANS.ads_addon.priceMonthlyFounding; // 488 + 477 = 965

export const COMPLETE_PLUS_ADS_TOTAL_DISPLAY = "$1,454";
export const COMPLETE_PLUS_ADS_FOUNDING_TOTAL_DISPLAY = "$965";

// ── Disclaimers and offer copy ───────────────────────────────────────

export const AD_SPEND_DISCLAIMER =
  "Advertising budget is separate and paid by the restaurant directly to the ad platform.";

export const FOUNDING_CLIENT_OFFER_DISCLAIMER =
  "Founding Client Offer: 50% off for the first year. Only available to early/founding restaurant partners. After the first year, standard pricing applies. Ad spend is always separate.";

/**
 * Setup support disclaimer for Complete Online Presence.
 *
 * If a restaurant does not already have a needed website, Facebook page,
 * Instagram account, TikTok account, or Google Business Profile, Veroxa
 * will help create/setup the required basic account/page/presence as
 * part of onboarding. This is NOT a custom website development package.
 */
export const COMPLETE_PRESENCE_SETUP_DISCLAIMER =
  "If the restaurant does not already have a needed website, Facebook page, Instagram account, TikTok account, or Google Business Profile, Veroxa will help create/setup the required basic account/page/presence during onboarding. This is not a custom website development package.";

export function getPlanPrice(label: VeroxaPlanLabel): number {
  return (
    Object.values(VEROXA_PLANS).find((p) => p.label === label)?.priceMonthly ??
    0
  );
}

export function getPlanFoundingPrice(label: VeroxaPlanLabel): number {
  return (
    Object.values(VEROXA_PLANS).find((p) => p.label === label)
      ?.priceMonthlyFounding ?? 0
  );
}
