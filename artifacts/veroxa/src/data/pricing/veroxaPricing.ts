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
//         12-month:   $997/mo
//         6-month:    $1,097/mo
//         3-month:    $1,197/mo
//         No-contract:$1,497/mo
//
//       Ads Management — add-on to Complete Online Presence ONLY.
//         $1,500/mo (all terms, no term discount on ads).
//
//       Complete Online Presence + Ads (bundle totals):
//         12-month:   $1,797/mo
//         6-month:    $1,897/mo
//         3-month:    $1,997/mo
//         No-contract:$2,297/mo
//
//   * There is NO separate "Bundle" plan — the bundle totals above are just
//     the two line items added together for convenience in sales conversations.
//   * There is NO founding-client / 50% first-year offer in the current
//     public pricing. Remove it from all customer-facing surfaces.
//   * google_optimization and ads_standalone are RETIRED from public sale.
//     They are retained here ONLY because the internal Free Audit
//     recommendation engine and lead-scoring still reference them. They
//     MUST NOT be surfaced on the public pricing page or any public copy.
//   * ads_standalone (Ads Management Only) is kept at $2,000/mo as an
//     internal-only reference price (publicVisible: false) until a formal
//     dependency audit clears it for deletion or reactivation.
//   * Ad spend is ALWAYS separate and paid by the restaurant directly
//     to the ad platform. No plan includes ad spend.
//   * No payment, billing, or checkout integration exists. Do not add
//     Stripe, PayPal, or any checkout logic.

// ── Term-based pricing (Complete Online Presence, bundles) ──────────

export interface TermPricing {
  /** 12-month commitment — lowest monthly rate. */
  months12: number;
  /** 6-month commitment. */
  months6: number;
  /** 3-month commitment. */
  months3: number;
  /** Month-to-month, no commitment. */
  noContract: number;
}

export const COP_TERM_PRICING: TermPricing = {
  months12: 997,
  months6: 1097,
  months3: 1197,
  noContract: 1497,
};

export const COP_TERM_DISPLAY: Record<keyof TermPricing, string> = {
  months12: "$997",
  months6: "$1,097",
  months3: "$1,197",
  noContract: "$1,497",
};

export const COP_TERM_LABELS: Record<keyof TermPricing, string> = {
  months12: "12-month",
  months6: "6-month",
  months3: "3-month",
  noContract: "No-contract",
};

/** Bundle: Complete Online Presence + Ads Management (COP term price + $1,500 ads). */
export const BUNDLE_TERM_PRICING: TermPricing = {
  months12: 1797,
  months6: 1897,
  months3: 1997,
  noContract: 2297,
};

export const BUNDLE_TERM_DISPLAY: Record<keyof TermPricing, string> = {
  months12: "$1,797",
  months6: "$1,897",
  months3: "$1,997",
  noContract: "$2,297",
};

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
   * Default / primary monthly price in USD dollars (not cents).
   * For term-based plans this reflects the 12-month (lowest) tier.
   * Used by internal Free Audit and lead-scoring code — do NOT remove.
   */
  priceMonthly: number;
  /**
   * Legacy founding monthly price in USD dollars.
   * The founding 50% offer is no longer publicly active. This field is
   * retained because internal audit/lead-scoring code still reads it.
   * For active plans, this equals priceMonthly (no discount).
   * For retired plans, the original founding price is preserved.
   */
  priceMonthlyFounding: number;
  /** Display string for the default monthly price (e.g. "$997"). */
  displayPrice: string;
  /**
   * Display string for the legacy founding price.
   * Not shown on public pricing — kept for internal scoring compat.
   */
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
    // priceMonthly = 12-month tier; used as the default in internal scoring.
    priceMonthly: COP_TERM_PRICING.months12,
    priceMonthlyFounding: COP_TERM_PRICING.months12, // No founding offer in current model.
    displayPrice: COP_TERM_DISPLAY.months12,
    displayPriceFounding: COP_TERM_DISPLAY.months12,
    tagline:
      "Facebook, Instagram, TikTok, Google Optimization, content planning, posting support, weekly updates, monthly reports.",
    includesAdSpend: false,
    publicVisible: true,
    status: "active",
  },

  ads_addon: {
    id: "ads_addon",
    label: "Ads Add-on",
    priceMonthly: 1500,
    priceMonthlyFounding: 1500, // No founding discount on ads.
    displayPrice: "+$1,500",
    displayPriceFounding: "+$1,500",
    tagline:
      "Add advertising management to Complete Online Presence. Ad spend is separate.",
    includesAdSpend: false,
    publicVisible: true,
    status: "active",
  },

  // HIDDEN (publicVisible: false) — internal reference until dependency audit.
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

// ── Combined totals (backward-compat exports used by pricing.tsx) ────
//
// These represent the 12-month-tier combined total (COP + Ads).
// Pricing page uses BUNDLE_TERM_PRICING/BUNDLE_TERM_DISPLAY for the full
// tier table. These flat exports are retained for any code that references
// the previous single-number combined display.

export const COMPLETE_PLUS_ADS_TOTAL_MONTHLY =
  VEROXA_PLANS.complete_online_presence.priceMonthly +
  VEROXA_PLANS.ads_addon.priceMonthly; // 997 + 1500 = 2497

export const COMPLETE_PLUS_ADS_TOTAL_DISPLAY = BUNDLE_TERM_DISPLAY.months12; // "$1,797"

// Legacy founding total — no longer used on public pricing; retained for
// internal backward compat only.
export const COMPLETE_PLUS_ADS_FOUNDING_TOTAL_MONTHLY = COMPLETE_PLUS_ADS_TOTAL_MONTHLY;
export const COMPLETE_PLUS_ADS_FOUNDING_TOTAL_DISPLAY = BUNDLE_TERM_DISPLAY.months12;

// ── Disclaimers ──────────────────────────────────────────────────────

export const AD_SPEND_DISCLAIMER =
  "Advertising budget is separate and paid by the restaurant directly to the ad platform.";

/**
 * Legacy founding-client offer disclaimer. The 50% first-year offer is no
 * longer active in the current public pricing. Retained here because it may
 * still be referenced by internal audit output formatters. Do not surface on
 * public pages.
 * @deprecated — not shown on public pricing as of 2026-05-29.
 */
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
