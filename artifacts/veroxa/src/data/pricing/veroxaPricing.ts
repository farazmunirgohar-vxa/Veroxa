// veroxaPricing.ts — single source of truth for Veroxa pricing.
//
// All UI copy, demo fixtures, and engine logic that surface plan prices
// must read from this file.
//
// IMPORTANT (owner-locked final pricing — 2026-05-29):
//   * Pricing is owner-locked. Do NOT change any price without explicit
//     owner approval.
//
//   * PUBLICLY OFFERED MODEL (shown on the pricing page):
//
//       Complete Online Presence — the core package.
//         Standard:            $977/mo
//         Founding first year: $488/mo (50% off, founding clients only)
//
//       Ads Management — add-on to Complete Online Presence ONLY.
//         $477/mo — flat rate, no founding discount on ads.
//
//       Complete Online Presence + Ads (combined totals):
//         Standard combined:         $1,454/mo (before ad spend)
//         Founding first year combo: $965/mo   (before ad spend)
//
//   * There is NO separate "Bundle" plan — the combined totals above are
//     just the two line items added together for convenience.
//   * google_optimization and ads_standalone are RETIRED/HIDDEN from public
//     sale. They are retained here ONLY because the internal Free Audit
//     recommendation engine and lead-scoring still reference them. They
//     MUST NOT be surfaced on the public pricing page or any public copy.
//   * Ad spend is ALWAYS separate and paid by the restaurant directly
//     to the ad platform. No plan includes ad spend.
//   * No payment, billing, or checkout integration exists. Do not add
//     Stripe, PayPal, or any checkout logic.

// ── Plan IDs and labels ──────────────────────────────────────────────

export type VeroxaPlanId =
  | "google_optimization"   // RETIRED — internal Free Audit / lead-scoring only
  | "complete_online_presence"
  | "ads_addon"
  | "ads_standalone";       // HIDDEN — internal reference only (publicVisible: false)

export type VeroxaPlanLabel =
  | "Google Optimization"
  | "Complete Online Presence"
  | "Ads Add-on"
  | "Ads Management Only";

export interface VeroxaPlan {
  id: VeroxaPlanId;
  label: VeroxaPlanLabel;
  /**
   * Standard monthly price in USD dollars (not cents).
   * Used by internal Free Audit and lead-scoring code — do NOT remove.
   */
  priceMonthly: number;
  /**
   * Founding first-year monthly price in USD dollars.
   * Founding offer is active — 50% off Complete Online Presence for the
   * first year. No founding discount on Ads Management.
   */
  priceMonthlyFounding: number;
  /** Display string for the standard monthly price (e.g. "$977"). */
  displayPrice: string;
  /** Display string for the founding first-year price (e.g. "$488"). */
  displayPriceFounding: string;
  /** One-line positioning copy. */
  tagline: string;
  /** Always false — ad spend is separate, never included. */
  includesAdSpend: false;
  /** Whether this plan is shown on the public pricing page. */
  publicVisible: boolean;
  /** "active" = currently sold; "retired" = internal/legacy only. */
  status: "active" | "retired";
}

export const VEROXA_PLANS: Record<VeroxaPlanId, VeroxaPlan> = {
  // RETIRED — kept for internal Free Audit / lead-scoring compatibility only.
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
    publicVisible: false,
    status: "retired",
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
    publicVisible: true,
    status: "active",
  },

  ads_addon: {
    id: "ads_addon",
    label: "Ads Add-on",
    priceMonthly: 477,
    priceMonthlyFounding: 477, // No founding discount on ads.
    displayPrice: "+$477",
    displayPriceFounding: "+$477",
    tagline:
      "Add advertising management to Complete Online Presence. Ad spend is separate.",
    includesAdSpend: false,
    publicVisible: true,
    status: "active",
  },

  // HIDDEN (publicVisible: false) — internal reference only.
  ads_standalone: {
    id: "ads_standalone",
    label: "Ads Management Only",
    priceMonthly: 2000,
    priceMonthlyFounding: 2000,
    displayPrice: "$2,000",
    displayPriceFounding: "$2,000",
    tagline:
      "Standalone advertising management without the Complete Online Presence system. Ad spend is separate.",
    includesAdSpend: false,
    publicVisible: false,
    status: "active",
  },
};

// ── Combined totals ──────────────────────────────────────────────────

/** Standard combined monthly total: COP + Ads = $977 + $477 = $1,454. */
export const COMPLETE_PLUS_ADS_TOTAL_MONTHLY =
  VEROXA_PLANS.complete_online_presence.priceMonthly +
  VEROXA_PLANS.ads_addon.priceMonthly; // 1454

export const COMPLETE_PLUS_ADS_TOTAL_DISPLAY = "$1,454";

/** Founding first-year combined total: $488 + $477 = $965. */
export const COMPLETE_PLUS_ADS_FOUNDING_TOTAL_MONTHLY =
  VEROXA_PLANS.complete_online_presence.priceMonthlyFounding +
  VEROXA_PLANS.ads_addon.priceMonthlyFounding; // 965

export const COMPLETE_PLUS_ADS_FOUNDING_TOTAL_DISPLAY = "$965";

// ── Disclaimers ──────────────────────────────────────────────────────

export const AD_SPEND_DISCLAIMER =
  "Advertising budget is separate and paid by the restaurant directly to the ad platform.";

export const FOUNDING_CLIENT_OFFER_DISCLAIMER =
  "Founding Client Offer: 50% off Complete Online Presence for the first year. Available only to founding restaurant partners. After the first year, standard pricing applies. No founding discount on Ads Management. Ad spend is always separate.";

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
