/**
 * auditScoring.ts — M026A / M027B
 *
 * Rule-based scoring engine for the Free Customer-Flow Readiness Audit.
 * Pure functions. No network, no AI, no scraping. All signals come from
 * the input fields the user provided (or did not provide).
 *
 * Careful language:
 *   "Based on the information provided…"
 *   "Preliminary signal…"
 *   "Likely opportunity…"
 *   "A full Veroxa audit would manually review…"
 */

import { getCategoryCustomerFlowImpact } from "./customerFlowImpact";
import type {
  AuditCategoryId,
  AuditCategoryScore,
  AuditConfidence,
  AuditGrade,
  AuditOpportunity,
  AuditWeakSpot,
  GrowthReportSection,
  RestaurantAuditInput,
  RestaurantAuditReport,
} from "./auditTypes";
import { recommendVeroxaPackage } from "./auditPackageRecommendation";

const CATEGORY_MAX: Record<AuditCategoryId, number> = {
  search_visibility_readiness: 20,
  google_maps_conversion_readiness: 20,
  social_reminder_system: 15,
  content_persuasion_quality: 15,
  action_path_clarity: 15,
  review_trust_strength: 10,
  growth_leverage_opportunity: 5,
};

const STRONG_CUISINE_TERMS = [
  "halal",
  "uzbek",
  "nepali",
  "momo",
  "mediterranean",
  "turkish",
  "middle eastern",
  "bakery",
  "dessert",
  "grill",
  "kabob",
  "kebab",
  "shawarma",
  "family platter",
];

const GOAL_KEYWORDS = [
  "lunch",
  "dinner",
  "google",
  "reviews",
  "visibility",
  "social",
  "consistency",
  "campaign",
  "ads",
] as const;

function has(s?: string): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function lower(s?: string): string {
  return (s ?? "").toLowerCase();
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function strongCuisineMatch(input: RestaurantAuditInput): boolean {
  const blob = `${lower(input.cuisineType)} ${lower(input.restaurantName)} ${lower(input.notes)}`;
  return STRONG_CUISINE_TERMS.some((t) => blob.includes(t));
}

export function scoreAuditCategories(
  input: RestaurantAuditInput,
): AuditCategoryScore[] {
  const hasGoogle = has(input.googleListingUrl);
  const hasWebsite = has(input.websiteUrl);
  const hasMenu = has(input.menuOrderingUrl);
  const hasOther = has(input.otherUrl);
  const hasIG = has(input.instagramUrl);
  const hasFB = has(input.facebookUrl);
  const hasTT = has(input.tiktokUrl);
  const socialCount = [hasIG, hasFB, hasTT].filter(Boolean).length;
  const goalLower = lower(input.currentGoal);
  const strongCuisine = strongCuisineMatch(input);

  // Live scan signals — available when restaurant selected via Google Places.
  // All optional; fixture/manual mode works unchanged.
  const isLive = input.restaurantSource === "google_places";
  const googleConfirmedLive = isLive && has(input.selectedPlaceId);
  const googleConfirmed = hasGoogle || googleConfirmedLive;
  const liveWebsiteFound = input.websiteFound === true;
  const liveMenuFound = input.menuLinkFound === true;
  const liveOrderFound = input.orderLinkFound === true;
  const liveContactFound = input.contactPathFound === true;
  const discoveredSocialLinks = input.discoveredSocialLinks ?? [];
  const hasLiveSocialSignals = discoveredSocialLinks.length > 0;

  // Effective signals: user-provided OR confirmed from live scan.
  // Missing signals are not credited; confirmed signals always score.
  const effectiveWebsite = hasWebsite || liveWebsiteFound;
  const effectiveMenu = hasMenu || liveMenuFound || liveOrderFound;
  const liveSocialCount = hasLiveSocialSignals
    ? Math.min(discoveredSocialLinks.length, 3)
    : 0;
  const effectiveSocialCount = Math.max(socialCount, liveSocialCount);
  const hasVisualSocial = hasIG || hasTT || hasLiveSocialSignals;

  // 1. Search Visibility Readiness (20)
  // Google presence is important but not enough alone. Website adds meaningful credit.
  let searchScore = 9;
  if (googleConfirmed) searchScore += 7;
  if (effectiveWebsite) searchScore += 3;
  if (effectiveMenu) searchScore += 1;
  if (!googleConfirmed && !effectiveWebsite) searchScore -= 2;
  searchScore = clamp(searchScore, 2, 20);

  // 2. Google Maps Conversion Readiness (20)
  // Google required for Maps; website and menu/order path strengthen it.
  let mapsScore = 8;
  if (googleConfirmed) mapsScore += 7;
  if (effectiveWebsite) mapsScore += 3;
  if (effectiveMenu) mapsScore += 2;
  if (!googleConfirmed && !effectiveWebsite) mapsScore -= 3;
  mapsScore = clamp(mapsScore, 2, 20);

  // 3. Social Reminder System (15)
  // Each confirmed channel contributes; zero channels is a real gap.
  let socialScore = 2 + effectiveSocialCount * 4;
  if (goalLower.includes("social") || goalLower.includes("consistency")) {
    socialScore = Math.max(socialScore - 1, 2);
  }
  socialScore = clamp(socialScore, 2, 15);

  // 4. Content Persuasion Quality (15)
  // Visual social presence and distinctive cuisine both drive content persuasion.
  let contentScore = 4;
  if (strongCuisine) contentScore += 3;
  if (hasVisualSocial) contentScore += 3;
  else contentScore -= 2;
  if (hasFB) contentScore += 1;
  contentScore = clamp(contentScore, 2, 14);

  // 5. Action Path Clarity (15)
  // Website, menu/order, and Google all contribute; missing all is a significant gap.
  let actionScore = 3;
  if (effectiveWebsite) actionScore += 4;
  if (effectiveMenu) actionScore += 3;
  if (googleConfirmed) actionScore += 2;
  if (liveContactFound) actionScore += 1;
  if (!effectiveWebsite && !effectiveMenu && !googleConfirmed) actionScore -= 3;
  if (goalLower.match(/order|reserv|call|inquir/)) actionScore += 1;
  actionScore = clamp(actionScore, 2, 14);

  // 6. Review & Trust Strength (10)
  let reviewScore = 3;
  if (googleConfirmed) reviewScore += 3;
  if (goalLower.includes("review")) reviewScore += 1;
  if (strongCuisine) reviewScore += 1;
  if (hasOther) reviewScore += 1;
  reviewScore = clamp(reviewScore, 1, 9);

  // 7. Growth Leverage Opportunity (5)
  // Higher when there is more confirmed room to grow with focused work.
  const weakInputCount =
    (googleConfirmed ? 0 : 1) +
    (effectiveWebsite || effectiveMenu ? 0 : 1) +
    (effectiveSocialCount === 0 ? 1 : 0) +
    (strongCuisine ? 0 : 1);
  let leverageScore = 2 + weakInputCount;
  leverageScore = clamp(leverageScore, 1, 5);

  const make = (
    id: AuditCategoryId,
    label: string,
    score: number,
    whatItMeans: string,
    howVeroxaHelps: string,
    explanation: string,
  ): AuditCategoryScore => {
    const impact = getCategoryCustomerFlowImpact(id);
    return {
      id,
      label,
      score: Math.round(score),
      maxScore: CATEGORY_MAX[id],
      whatItMeans,
      customerFlowImpact: `${impact.stageLabel} — ${impact.stageDescription}`,
      howVeroxaHelps,
      explanation,
    };
  };

  return [
    make(
      "search_visibility_readiness",
      "Visibility Consistency",
      searchScore,
      "How prepared your restaurant is to be found by new customers searching online.",
      "Veroxa improves Google search visibility, local keywords, fresh content, and listing completeness.",
      googleConfirmed
        ? "Preliminary signal: a Google listing was confirmed. A full Veroxa audit would manually review keyword presence, category accuracy, photos, and post freshness."
        : "Preliminary signal: no Google listing was confirmed. Restaurants without an active Google Business Profile can be harder to discover in local search.",
    ),
    make(
      "google_maps_conversion_readiness",
      "Google Walk-In Readiness",
      mapsScore,
      "How well your Google presence turns searchers into visitors, calls, and direction clicks.",
      "Veroxa improves CTAs, photos, hours/menu clarity, and the Google posts that influence the decision moment.",
      googleConfirmed
        ? "Based on the information provided, your Maps presence is the most common decision point — sharper photos, hours, and CTAs would likely raise conversion."
        : "Without a confirmed Google listing, Maps-driven calls and direction clicks may be a significant missed customer-flow opportunity.",
    ),
    make(
      "social_reminder_system",
      "Customer Reminder Rhythm",
      socialScore,
      "How consistently your restaurant stays top-of-mind with hungry customers across social platforms.",
      "Veroxa improves posting consistency, weekly food updates, lunch/dinner reminders, and repeatable content themes.",
      effectiveSocialCount === 0
        ? "Preliminary signal: no social channels confirmed. Reminder-driven flow (lunch, dinner, weekend cravings) may be underused."
        : `Based on the information provided, ${effectiveSocialCount} social channel${effectiveSocialCount === 1 ? "" : "s"} confirmed. Consistency and weekly themes are typically the bigger lever than channel count.`,
    ),
    make(
      "content_persuasion_quality",
      "Craving Power",
      contentScore,
      "How appetizing, trustworthy, and differentiated your content makes your food look.",
      "Veroxa improves content variety, caption quality, photo/Reel guidance, and weekly themes.",
      strongCuisine
        ? "Likely opportunity: distinctive cuisine signals were detected. Stronger content framing would likely improve persuasion."
        : "A full Veroxa audit would manually review existing content quality, dish framing, and caption clarity to refine persuasion.",
    ),
    make(
      "action_path_clarity",
      "Customer Action Path",
      actionScore,
      "How easily customers can call, visit, order, reserve, or inquire after they decide.",
      "Veroxa improves CTA clarity, menu/hours/location visibility, Google buttons, and social link organization.",
      effectiveWebsite || effectiveMenu
        ? "Based on the information provided, an action path (website or menu/ordering link) is in place — clarifying menu, hours, and CTAs would likely tighten conversion."
        : "Preliminary signal: no website or menu/ordering link confirmed. Customers who want to order, reserve, or check the menu may not be able to act easily.",
    ),
    make(
      "review_trust_strength",
      "Trust Signals",
      reviewScore,
      "How much your review presence supports confidence in comparison decisions.",
      "Veroxa supports review response cadence, fresh photos, and trust signals tied to recent activity.",
      googleConfirmed
        ? "A full Veroxa audit would manually review volume, recency, response rate, and tone."
        : "Without a confirmed Google listing, trust signals through reviews are not clearly visible at the decision moment.",
    ),
    make(
      "growth_leverage_opportunity",
      "Weekly Visit Triggers",
      leverageScore,
      "How much room Veroxa sees to improve customer-flow conditions through focused work.",
      "Veroxa identifies the biggest daily opportunity and focuses early work where the most consistent improvement can happen.",
      `Based on the information provided, ${leverageScore >= 4 ? "a focused 30-day plan would likely improve multiple signals at the same time." : "most of the foundation is present — refinement, not rebuild, is the leverage."}`,
    ),
  ];
}

export function getAuditGrade(totalScore: number): {
  grade: AuditGrade;
  label: string;
  description: string;
} {
  // Internal grade IDs preserved for team-facing page compatibility.
  // Public labels and descriptions use consultative, opportunity-framed language.
  let grade: AuditGrade;
  let label: string;
  let description: string;
  if (totalScore >= 90) {
    grade = "strong_foundation";
    label = "Strong Online Consistency";
    description =
      "Strong public signals across Google, website, social, and action paths. Consistent visibility is in place — Veroxa would focus on refinement, content quality, and optimization.";
  } else if (totalScore >= 80) {
    grade = "strong_foundation";
    label = "Strong Foundation";
    description =
      "Strong online presence with most key signals confirmed. Some improvement opportunities remain — Veroxa would focus on content consistency, conversion, and maintaining signal freshness.";
  } else if (totalScore >= 70) {
    grade = "good_missed_consistency";
    label = "Good Foundation, Needs Consistency";
    description =
      "Decent online presence with key signals in place. Clear opportunities remain to tighten consistency, content rhythm, and customer action paths.";
  } else if (totalScore >= 60) {
    grade = "clear_gap";
    label = "Moderate Opportunity";
    description =
      "The restaurant has a usable online presence, but there are clear opportunities to tighten consistency, customer action paths, and reminder rhythm.";
  } else if (totalScore >= 50) {
    grade = "underbuilt";
    label = "Major Opportunity";
    description =
      "Several important public signals may need setup or manual verification. Focused early work on the foundation would likely improve visibility and customer decision moments.";
  } else {
    grade = "foundational_problem";
    label = "Limited Public Signals";
    description =
      "Many public signals were not confirmed from available sources. A Veroxa audit would identify the most important signals to establish first.";
  }
  return { grade, label, description };
}

/** M027B — Audit confidence based on link richness. */
export function getAuditConfidence(input: RestaurantAuditInput): {
  level: AuditConfidence;
  label: string;
  explanation: string;
} {
  const hasGoogle = has(input.googleListingUrl);
  const hasSiteOrMenu = has(input.websiteUrl) || has(input.menuOrderingUrl);
  const socialCount = [
    has(input.instagramUrl),
    has(input.facebookUrl),
    has(input.tiktokUrl),
  ].filter(Boolean).length;

  if (hasGoogle && hasSiteOrMenu && socialCount >= 2) {
    return {
      level: "strong",
      label: "Public signal review",
      explanation:
        "Multiple key links were provided, so the preliminary report has stronger signal. A full Veroxa audit would still manually verify the live profiles.",
    };
  }
  if (hasGoogle && (hasSiteOrMenu || socialCount >= 1)) {
    return {
      level: "good",
      label: "Public signal review",
      explanation:
        "Several useful links were provided, so the audit can give more specific direction. A full Veroxa audit would still manually verify the live profiles.",
    };
  }
  return {
    level: "basic",
    label: "Public signals only",
    explanation:
      "Few links were provided, so this report focuses on likely opportunities suggested by missing information. Adding links would sharpen the audit, but missing links are themselves a signal Veroxa can act on.",
  };
}

export function getTopWeakSpots(
  report: RestaurantAuditReport,
): AuditWeakSpot[] {
  const input = report.input;
  const hasGoogle = has(input.googleListingUrl);
  const hasWebsiteOrMenu = has(input.websiteUrl) || has(input.menuOrderingUrl);
  const socialCount = [
    has(input.instagramUrl),
    has(input.facebookUrl),
    has(input.tiktokUrl),
  ].filter(Boolean).length;

  const ranked = [...report.categories]
    .map((c) => ({ c, pct: c.score / c.maxScore }))
    .sort((a, b) => a.pct - b.pct);

  function describe(
    categoryId: AuditCategoryId,
    fallback: AuditWeakSpot,
  ): AuditWeakSpot {
    if (
      (categoryId === "search_visibility_readiness" ||
        categoryId === "google_maps_conversion_readiness" ||
        categoryId === "review_trust_strength") &&
      !hasGoogle
    ) {
      return {
        categoryId,
        title: "Google walk-in readiness is an open opportunity",
        whyItMatters:
          "Many nearby customers decide where to eat directly on Google Maps. Without a strong Google presence, calls, direction clicks, and trust signals are not reaching the decision moment.",
        howVeroxaHelps:
          "Google Business Profile support, fresh photos, weekly Google posts, menu/hours clarity, and review response support.",
      };
    }
    if (categoryId === "action_path_clarity" && !hasWebsiteOrMenu) {
      return {
        categoryId,
        title: "Customer action path can be strengthened",
        whyItMatters:
          "If people cannot quickly find menu, hours, ordering, or directions, they may choose another nearby restaurant in the same moment.",
        howVeroxaHelps:
          "Menu visibility, CTA clarity, Google/social link alignment, and customer action path cleanup.",
      };
    }
    if (categoryId === "social_reminder_system" && socialCount === 0) {
      return {
        categoryId,
        title: "Customer reminder rhythm is underused",
        whyItMatters:
          "Nearby customers may forget about the restaurant when they are hungry if they are not seeing consistent reminders around lunch, dinner, weekends, and specials.",
        howVeroxaHelps:
          "Weekly content rhythm, captions, scheduled posts around lunch/dinner/weekend moments, and an upload workflow restaurant staff can keep up with.",
      };
    }
    return fallback;
  }

  const seen = new Set<string>();
  const unique: AuditWeakSpot[] = [];

  for (const { c } of ranked) {
    const weakSpot = describe(c.id, {
      categoryId: c.id,
      title: c.label,
      whyItMatters: c.customerFlowImpact,
      howVeroxaHelps: c.howVeroxaHelps,
    });
    const canonicalCategory =
      c.id === "search_visibility_readiness" ||
      c.id === "google_maps_conversion_readiness" ||
      c.id === "review_trust_strength"
        ? "google_visibility"
        : c.id === "social_reminder_system" ||
            c.id === "content_persuasion_quality"
          ? "social_content_rhythm"
          : c.id;

    if (seen.has(canonicalCategory)) continue;
    seen.add(canonicalCategory);
    unique.push(weakSpot);
    if (unique.length === 3) break;
  }

  return unique;
}

export function getTopOpportunities(
  report: RestaurantAuditReport,
): AuditOpportunity[] {
  const input = report.input;
  const goal = lower(input.currentGoal);
  const hasGoogle = has(input.googleListingUrl);
  const hasWebsiteOrMenu = has(input.websiteUrl) || has(input.menuOrderingUrl);
  const socialCount = [
    has(input.instagramUrl),
    has(input.facebookUrl),
    has(input.tiktokUrl),
  ].filter(Boolean).length;
  const strongCuisine = strongCuisineMatch(input);

  const out: AuditOpportunity[] = [];

  // Goal-based opportunities (optional path)
  if (goal) {
    for (const kw of GOAL_KEYWORDS) {
      if (goal.includes(kw)) {
        out.push({
          id: `goal_${kw}`,
          title: `Direct match for your stated goal: ${kw}`,
          whyItMatters:
            "Your current goal directly maps to a customer-flow stage Veroxa can strengthen with weekly actions.",
          veroxaApproach: `Veroxa would build the 30-day plan around your ${kw} goal first, then expand once early signals appear.`,
        });
      }
      if (out.length >= 3) break;
    }
  }

  // Link-shape opportunities (always available)
  if (out.length < 3 && !hasGoogle) {
    out.push({
      id: "no_google",
      title: "Strengthen Google discovery and Maps conversion",
      whyItMatters:
        "Without a strong Google presence, the most common restaurant decision moment is invisible.",
      veroxaApproach:
        "Veroxa would prioritize Google Business Profile cleanup, photos, posts, hours, menu, and review response cadence.",
    });
  }
  if (out.length < 3 && socialCount === 0) {
    out.push({
      id: "no_social",
      title: "Build a customer reminder system",
      whyItMatters:
        "Without social reminders, regulars and nearby customers may forget about the restaurant when they are hungry.",
      veroxaApproach:
        "Veroxa would set up a weekly content plan with lunch, dinner, weekend, and craving-based themes.",
    });
  }
  if (out.length < 3 && strongCuisine) {
    out.push({
      id: "cuisine_story",
      title: "Turn cuisine story into customer education",
      whyItMatters:
        "Distinctive cuisine signals were detected — story-driven content typically improves persuasion and trust.",
      veroxaApproach:
        "Veroxa would frame weekly content around the strongest dishes and cultural story.",
    });
  }
  if (out.length < 3 && !hasWebsiteOrMenu) {
    out.push({
      id: "no_menu_order",
      title: "Clarify the action path",
      whyItMatters:
        "If menu, ordering, or hours are not easily reachable, conversion drops at the decision moment.",
      veroxaApproach:
        "Veroxa would clarify menu/hours/order CTAs across Google and social profiles.",
    });
  }
  if (out.length < 3 && socialCount > 0 && !hasGoogle) {
    out.push({
      id: "social_no_google",
      title: "Align social attention with Google/Maps discovery",
      whyItMatters:
        "Social attention is being earned, but the search/Maps decision moment is not yet capturing it.",
      veroxaApproach:
        "Veroxa would set up Google so social attention converts to calls, direction clicks, and visits.",
    });
  }
  if (out.length < 3 && hasGoogle && hasWebsiteOrMenu && socialCount === 0) {
    out.push({
      id: "google_site_no_social",
      title: "Add weekly reminders through social content",
      whyItMatters:
        "Foundation is in place, but no consistent reminder signal is reaching customers between visits.",
      veroxaApproach:
        "Veroxa would launch a disciplined weekly social cadence with lunch/dinner/weekend themes.",
    });
  }

  if (out.length === 0) {
    out.push({
      id: "default_visibility",
      title: "Strengthen the discovery + decision moment",
      whyItMatters:
        "Most restaurants leak customer flow at the search/Maps decision moment before content or ads ever get a chance.",
      veroxaApproach:
        "Veroxa would focus the first 30 days on Google + Maps clarity, then layer social reminders.",
    });
  }

  return out.slice(0, 3);
}

export function getCustomerFlowExplanation(
  report: RestaurantAuditReport,
): string {
  return `Customer flow is visibility → trust → reminder → action → retention. Based on the information provided for ${report.input.restaurantName}, the most visible daily opportunity is the ${report.weakSpots[0]?.title ?? "decision moment"}. Veroxa improves the daily online conditions and customer reminder moments that influence this flow. ${report.gradeDescription}`;
}

/**
 * Derive the 11 structured Growth Report sections from input signals.
 * Pure function — no network, no AI. Language is consultative, not harsh.
 * Source labels: "found" | "not found" | "manual review needed" (never "verified" without live data).
 */
export function generateGrowthReportSections(
  input: RestaurantAuditInput,
): GrowthReportSection[] {
  const hasGoogle = has(input.googleListingUrl);
  const hasWebsite = has(input.websiteUrl);
  const hasMenu = has(input.menuOrderingUrl);
  const hasOther = has(input.otherUrl);
  const hasIG = has(input.instagramUrl);
  const hasFB = has(input.facebookUrl);
  const hasTT = has(input.tiktokUrl);
  const socialCount = [hasIG, hasFB, hasTT].filter(Boolean).length;
  const hasSocial = socialCount > 0;
  const hasWebsiteOrMenu = hasWebsite || hasMenu;

  // Live scan signals — available when restaurant was selected via live lookup.
  // All optional; audit still works in fixture/manual mode without them.
  const isLive = input.restaurantSource === "google_places";
  const liveWebsiteFound = input.websiteFound === true;
  const liveMenuFound = input.menuLinkFound === true;
  const liveOrderFound = input.orderLinkFound === true;
  const liveReservationFound = input.reservationLinkFound === true;
  const liveContactFound = input.contactPathFound === true;
  const liveMenuOrOrder = liveMenuFound || liveOrderFound;
  const liveActionPath =
    liveWebsiteFound ||
    liveMenuOrOrder ||
    liveContactFound ||
    liveReservationFound;
  const discoveredSocialLinks = input.discoveredSocialLinks ?? [];
  const discoveredMenuLinks = input.discoveredMenuLinks ?? [];
  const hasLiveSocialSignals = discoveredSocialLinks.length > 0;

  const googleConfirmed = hasGoogle || (isLive && has(input.selectedPlaceId));
  const actionPathAvailable = hasWebsiteOrMenu || liveActionPath;
  const socialAvailable = hasSocial || hasLiveSocialSignals;

  const ratingStr =
    typeof input.googleRating === "number"
      ? `Rating: ${input.googleRating.toFixed(1)}.`
      : "";
  const reviewStr =
    typeof input.reviewCount === "number"
      ? `${input.reviewCount} reviews.`
      : "";
  const googleDetailStr = [ratingStr, reviewStr].filter(Boolean).join(" ");

  const socialSignals: string[] = [];
  if (hasIG) socialSignals.push("Instagram: found");
  if (hasFB) socialSignals.push("Facebook: found");
  if (hasTT) socialSignals.push("TikTok: found");
  if (hasLiveSocialSignals && !hasSocial) {
    socialSignals.push(
      `${discoveredSocialLinks.length} social link${discoveredSocialLinks.length > 1 ? "s" : ""} discovered from website`,
    );
  }

  const webSignals: string[] = [];
  if (liveWebsiteFound || hasWebsite) webSignals.push("Website: found");
  else webSignals.push("Website: not confirmed");
  if (liveMenuFound || hasMenu) webSignals.push("Menu link: found");
  else webSignals.push("Menu link: not confirmed");
  if (liveOrderFound) webSignals.push("Order link: found");
  if (liveReservationFound) webSignals.push("Reservation link: found");
  if (liveContactFound) webSignals.push("Contact path: found");
  if (hasOther && !liveReservationFound)
    webSignals.push("Additional link (reservation/delivery/other): provided");

  const hasAdsSignal = /(ads?|paid|campaign)/i.test(
    lower(input.currentGoal) + " " + lower(input.notes),
  );

  const auditModeLabel = isLive
    ? "live Google lookup"
    : input.restaurantSource === "fixture"
      ? "public signals"
      : "manual entry";

  return [
    {
      id: "identity",
      title: "Restaurant Identity",
      currentSignal: `${input.restaurantName} · ${input.cuisineType || "cuisine not verified"} · ${input.city}, ${input.state}. Assessment source: ${auditModeLabel} + manual verification needed.`,
      whatItMeans:
        "A clear and consistent restaurant identity — name, cuisine, and location — helps nearby customers recognize and remember the restaurant across every platform they check before deciding.",
      whyItMatters:
        "Customers often check a restaurant on Google, then social media, then maybe a menu link — all in the same minute. If the name, category, or location is unclear or inconsistent across platforms, it creates doubt before they ever visit.",
      veroxaRecommendation:
        "Veroxa would verify that the restaurant name, cuisine type, and location are aligned across Google, Instagram, Facebook, TikTok, and the website — making the first impression clear and consistent.",
      sourceLabel: "found",
    },
    {
      id: "google_search_seo",
      title: "Google Search SEO",
      currentSignal: googleConfirmed
        ? `Google Business Profile ${isLive ? "confirmed via live lookup" : "link provided"}. ${input.businessStatus ? "Business status: " + input.businessStatus + ". " : ""}${liveWebsiteFound ? "Website found from scan. " : ""}Keyword coverage, category accuracy, and content freshness need manual verification.`.trim()
        : "Google profile needs verification before setup decisions are made. Restaurants without an active, optimized listing can be harder for nearby customers to discover when they search by name, cuisine, or location.",
      whatItMeans:
        "Google search is usually the first place a nearby customer looks when deciding where to eat. If the restaurant does not appear clearly — or appears with incomplete information — those potential customer moments may be going to other nearby options.",
      whyItMatters:
        "A well-optimized Google listing with the right category, location signals, and fresh content supports the chance of appearing when customers search by name, cuisine type, or 'restaurants near me.'",
      veroxaRecommendation: googleConfirmed
        ? "Veroxa would manually review keyword presence, category accuracy, business description quality, and content freshness to strengthen local search visibility."
        : "Veroxa would prioritize setting up and optimizing a Google Business Profile with the correct name, category, location, description, and regular posts to build local search presence.",
      sourceLabel: googleConfirmed ? "found" : "not found",
    },
    {
      id: "google_maps_seo",
      title: "Google Maps / Local SEO",
      currentSignal: googleConfirmed
        ? `Google Maps presence ${isLive ? "confirmed via live lookup" : "found"}. ${googleDetailStr ? googleDetailStr + " " : ""}${input.businessStatus ? "Business status: " + input.businessStatus + ". " : ""}Profile freshness, photo recency, and direction/call readiness need manual verification.`.trim()
        : "No Google Maps presence was confirmed from the information provided. Direction clicks, call buttons, and local discovery may be missing from the customer decision moment.",
      whatItMeans:
        "Google Maps is where many nearby customers make their final restaurant decision — they compare photos, check reviews, tap for directions, or call directly. An incomplete or inactive Maps profile means those moments may be going to nearby competitors.",
      whyItMatters:
        "A strong Google Maps presence supports direction clicks, phone calls, menu views, and photo browsing — all of which happen at the exact moment a customer is deciding where to eat.",
      veroxaRecommendation: googleConfirmed
        ? "Veroxa would improve Maps conversion readiness: sharper food-first photos, accurate hours, menu link visibility, clear call/direction buttons, and Google posts timed around lunch, dinner, and weekend traffic."
        : "Veroxa would create and fully optimize a Google Maps presence so the restaurant appears in local discovery and nearby customers can act immediately.",
      sourceLabel: googleConfirmed ? "found" : "not found",
    },
    {
      id: "gbp_strength",
      title: "Google Business Profile Strength",
      currentSignal: googleConfirmed
        ? `Business Profile ${isLive ? "confirmed via live lookup" : "link provided"}. ${googleDetailStr ? googleDetailStr + " " : ""}Photos, posts, hours, menu link, and category accuracy need manual verification to assess current strength.`.trim()
        : "Google profile needs verification before setup decisions are made; photos, posts, hours, menu access, and categories should be checked before decisions are made.",
      whatItMeans:
        "A strong Google Business Profile is the single most visible online signal a local restaurant has. It is what customers see before they ever reach the website or social media.",
      whyItMatters:
        "Photos, operating hours, menu access, and regular Google posts influence customer decisions before they ever visit the website or call. An outdated or incomplete profile can reduce trust at the decision moment.",
      veroxaRecommendation:
        "Veroxa would improve Google photo freshness with food-first images, set up regular Google posts, confirm category and menu clarity, and maintain accurate hours — all of which support local trust signals and walk-in readiness.",
      sourceLabel: googleConfirmed ? "found" : "manual review needed",
    },
    {
      id: "website_menu_path",
      title: "Website + Menu / Order / Contact Path",
      currentSignal:
        webSignals.join(". ") +
        ". The full customer action path and any friction points need manual verification.",
      whatItMeans:
        "When a customer is ready to act — check the menu, order, call, or reserve — they need to find that path quickly. Every extra tap or missing link is a moment where they might choose somewhere else instead.",
      whyItMatters:
        "After deciding they want to visit, customers need to quickly find the menu, confirm hours, place an order, or make a reservation. Unclear or missing action paths increase friction at the most important moment.",
      veroxaRecommendation:
        "Veroxa would improve menu/order/contact visibility across Google and social profiles, clarify the customer action path, and reduce friction between customer interest and action.",
      sourceLabel: actionPathAvailable ? "found" : "not found",
    },
    {
      id: "social_standing",
      title: "Social Media Standing",
      currentSignal: socialAvailable
        ? `${socialSignals.join(". ")}. Posting rhythm, consistency, and content quality need manual verification.`
        : "No social media channels were confirmed. Whether the restaurant has an active social presence for customer reminders is not yet known.",
      whatItMeans:
        "Social media keeps the restaurant top-of-mind between visits. When a customer is deciding where to eat for lunch, dinner, or the weekend, they often scroll social first — a consistent presence keeps the restaurant in the running.",
      whyItMatters:
        "A consistent social presence with food-first content, timed around lunch, dinner, and weekend moments, creates customer reminder moments that can influence where nearby customers choose to eat.",
      veroxaRecommendation:
        "Veroxa would establish a weekly food-content rhythm — captions, photo/video guidance, and posting windows aligned to lunch, dinner, and weekend customer decision moments — designed to support more customer reminder moments.",
      sourceLabel: socialAvailable ? "found" : "not found",
    },
    {
      id: "content_consistency",
      title: "Content Consistency",
      currentSignal:
        hasSocial || googleConfirmed
          ? "Some online presence found. Content consistency, posting rhythm, and cross-platform alignment need manual verification to assess."
          : "Limited online presence confirmed. Whether the restaurant name, photos, hours, and messaging align across platforms is not yet known.",
      whatItMeans:
        "Customers often check a restaurant on Google, then Instagram, then maybe TikTok — all in the same minute. Different hours, different photos, or different information on each platform creates doubt and can affect the decision to visit.",
      whyItMatters:
        "Consistent photos, matched hours, and aligned messaging across every platform reduces confusion and strengthens the first impression a customer gets before deciding to visit.",
      veroxaRecommendation:
        "Veroxa would ensure the restaurant name, cuisine identity, photos, hours, and action links are consistent across every platform — reducing friction and improving the first impression across search, Maps, and social.",
      sourceLabel: "manual review needed",
    },
    {
      id: "reviews_trust",
      title: "Reviews + Trust Signals",
      currentSignal: googleConfirmed
        ? `Google profile found. ${googleDetailStr ? googleDetailStr + " " : ""}Review recency, owner response rate, and trust signal strength need manual verification.`.trim()
        : "Google profile needs verification before review and trust-signal decisions are made. This may be an area worth addressing.",
      whatItMeans:
        "When a nearby customer is comparing two restaurants, reviews often decide it. Star rating, number of reviews, recency, and how the restaurant responds all factor into that comparison.",
      whyItMatters:
        "Reviews are a primary trust signal. Nearby customers compare star ratings, read recent reviews, and look at how the restaurant responds. A strong review presence supports the final decision to visit.",
      veroxaRecommendation:
        "Veroxa supports review response cadence, fresh photo uploads, and trust-signal consistency across the Google profile to maintain a strong reputation at the customer decision moment.",
      sourceLabel: googleConfirmed ? "found" : "not found",
    },
    {
      id: "ads_readiness",
      title: "Ads Readiness",
      currentSignal:
        "Ads usage was not publicly verified — manual verification needed. Whether this restaurant is currently running Google or social ads cannot be confirmed from available signals.",
      whatItMeans:
        "Ads work best when the foundation is already in good shape. If a customer clicks an ad and then finds an incomplete Google profile, missing menu, or outdated content — the ad spend may not convert as well.",
      whyItMatters:
        "Paid ads can amplify an already solid online presence. But they send customers to whatever exists — Google profile, website, menu, content. If those can be strengthened first, ads spend more efficiently afterward.",
      veroxaRecommendation: hasAdsSignal
        ? "An ads-related goal was noted. Ads should amplify a healthier foundation, not replace it, so Veroxa would evaluate Google, content rhythm, action path readiness, and menu/order visibility first. No ad result is guaranteed; performance depends on budget, offer, competition, and execution."
        : "Ads should amplify a healthier foundation, not replace it. Google, content rhythm, and action paths should be cleaned up first. No ad result is guaranteed; performance depends on budget, offer, competition, and execution.",
      sourceLabel: "manual review needed",
    },
    {
      id: "walk_in_opportunity",
      title: "Daily Walk-In Opportunity",
      currentSignal:
        "Walk-in opportunity is driven by the full chain of online consistency — not any single platform. How consistently this restaurant appears across search, Maps, and social needs manual verification to assess.",
      whatItMeans:
        "Nearby customers choose restaurants based on memory, trust, convenience, and visibility. A restaurant that appears clearly on Google, posts consistent food-content reminders, and has an easy action path creates more customer decision moments each day.",
      whyItMatters:
        "For most independent restaurants, the biggest daily opportunity is improving the chain: consistent online presence → more customer reminder moments → stronger recall → easier decision to visit. Each link in that chain is something Veroxa can work on.",
      veroxaRecommendation:
        "Veroxa focuses on strengthening each step of the daily walk-in chain: keeping Google fresh, posting around the moments customers decide to eat, making the menu and action path easy to reach, and showing up consistently so the restaurant stays in the customer's mind. This is designed to support more customer decision moments — results vary by location, offer, food quality, competition, and execution.",
      sourceLabel: "manual review needed",
    },
    {
      id: "fix_first",
      title: "What Veroxa Would Fix First",
      currentSignal: `Based on the preliminary signals: ${googleConfirmed ? "Google presence found" : "Google presence not confirmed"} · ${actionPathAvailable ? "action path present" : "action path not confirmed"} · ${socialAvailable ? (discoveredSocialLinks.length > 0 ? `${discoveredSocialLinks.length} social link(s) discovered` : `${socialCount} social channel(s) found`) : "no social channels confirmed"}.`,
      whatItMeans:
        "Starting with the right priorities — rather than trying to fix everything at once — builds momentum and creates early signals to learn from. Veroxa focuses first on where the biggest customer decision moments are currently being missed.",
      whyItMatters:
        "Early, focused work creates early signals. Veroxa can then adjust the next 30 days based on what the data shows — rather than guessing from the start.",
      veroxaRecommendation:
        "First 7 days: verify Google profile basics, confirm menu/order/contact path, identify the best content angles, clarify what media the restaurant should upload. " +
        "First 30 days: build weekly content rhythm, update Google profile/photos/posts, establish lunch/dinner/weekend customer reminder rhythm, start weekly update and reporting baseline. " +
        "Ongoing: weekly content/reporting rhythm, monthly strategy report, review what is working, adjust content angles based on customer behavior and restaurant goals.",
      sourceLabel: "manual review needed",
    },
    {
      id: "veroxa_needs",
      title: "What Veroxa Needs From the Restaurant",
      currentSignal:
        "A few straightforward things make the difference between a general plan and one built around this specific restaurant. Veroxa works with what the restaurant can actually provide — no full production setup required.",
      whatItMeans:
        "Veroxa handles the strategy, consistency, and platform work. The restaurant provides the authentic story, real food photos, and the details that make the content feel real and specific.",
      whyItMatters:
        "Real photos and authentic stories outperform generic content. When the restaurant provides its own food photos, specials, and story details, Veroxa can create content that genuinely reflects the restaurant — which tends to perform better with nearby customers.",
      veroxaRecommendation: [
        "3–5 real photos or short videos per week (dishes, daily specials, behind-the-scenes moments).",
        "Menu or ordering link.",
        "Any current specials or upcoming events.",
        "Important story details — halal, family-owned, authentic cuisine, local history, or anything that makes this restaurant different.",
        "Access / permission for Google and social work later if the restaurant becomes a Veroxa client.",
      ].join(" · "),
      sourceLabel: "manual review needed",
    },
  ];
}

export function generateRestaurantAudit(
  input: RestaurantAuditInput,
): RestaurantAuditReport {
  const categories = scoreAuditCategories(input);
  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
  const { grade, label, description } = getAuditGrade(totalScore);
  const confidence = getAuditConfidence(input);

  const partial: RestaurantAuditReport = {
    input,
    totalScore,
    maxScore: 100,
    grade,
    gradeLabel: label,
    gradeDescription: description,
    categories,
    weakSpots: [],
    opportunities: [],
    recommendation: {
      // Placeholder — immediately overwritten by recommendVeroxaPackage()
      // below, which reads from the locked pricing source of truth.
      packageId: "growth",
      packageLabel: "",
      standardPriceDisplay: "",
      foundingPriceDisplay: "",
      reason: "",
      whyNotAdsYet: null,
      firstSteps: [],
      expectedDirection: "",
    },
    customerFlowExplanation: "",
    auditConfidence: confidence.level,
    confidenceLabel: confidence.label,
    confidenceExplanation: confidence.explanation,
    generatedAtLabel: "Just now",
    growthReportSections: generateGrowthReportSections(input),
  };
  partial.weakSpots = getTopWeakSpots(partial);
  partial.opportunities = getTopOpportunities(partial);
  partial.recommendation = recommendVeroxaPackage(partial, input);
  partial.customerFlowExplanation = getCustomerFlowExplanation(partial);
  return partial;
}

export function getRecommendedPackage(
  report: RestaurantAuditReport,
  input: RestaurantAuditInput,
) {
  return recommendVeroxaPackage(report, input);
}
