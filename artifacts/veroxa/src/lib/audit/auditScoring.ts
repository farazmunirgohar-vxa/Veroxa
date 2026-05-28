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

import {
  getCategoryCustomerFlowImpact,
  getScoreMeaningByGrade,
} from "./customerFlowImpact";
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
  "catering",
  "grill",
  "kabob",
  "kebab",
  "shawarma",
  "family platter",
];

const GOAL_KEYWORDS = [
  "lunch",
  "catering",
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

  // 1. Search Visibility Readiness (20)
  let searchScore = 12;
  if (hasGoogle) searchScore += 6;
  else searchScore -= 6;
  if (hasWebsite) searchScore += 2;
  else searchScore -= 1;
  if (hasMenu) searchScore += 1;
  if (!hasGoogle && !hasWebsite) searchScore -= 2;
  searchScore = clamp(searchScore, 2, 20);

  // 2. Google Maps Conversion Readiness (20)
  let mapsScore = 11;
  if (hasGoogle) mapsScore += 6;
  else mapsScore -= 6;
  if (hasWebsite) mapsScore += 2;
  if (hasMenu) mapsScore += 2;
  mapsScore = clamp(mapsScore, 2, 20);

  // 3. Social Reminder System (15)
  let socialScore = 4 + socialCount * 3; // 4..13
  if (socialCount === 0) socialScore = 2;
  if (goalLower.includes("social") || goalLower.includes("consistency"))
    socialScore = Math.max(socialScore - 1, 2);
  socialScore = clamp(socialScore, 2, 15);

  // 4. Content Persuasion Quality (15)
  let contentScore = 6;
  if (strongCuisine) contentScore += 3;
  if (hasIG || hasTT) contentScore += 3;
  if (!hasIG && !hasTT) contentScore -= 2;
  if (hasFB) contentScore += 1;
  contentScore = clamp(contentScore, 2, 14);

  // 5. Action Path Clarity (15)
  let actionScore = 5;
  if (hasWebsite) actionScore += 3;
  if (hasMenu) actionScore += 3;
  if (hasGoogle) actionScore += 2;
  if (!hasWebsite && !hasMenu && !hasGoogle) actionScore -= 3;
  if (goalLower.match(/order|reserv|call|inquir|catering/)) actionScore += 1;
  actionScore = clamp(actionScore, 2, 14);

  // 6. Review & Trust Strength (10)
  let reviewScore = 4;
  if (hasGoogle) reviewScore += 3;
  if (goalLower.includes("review")) reviewScore += 1;
  if (strongCuisine) reviewScore += 1;
  if (hasOther) reviewScore += 1;
  reviewScore = clamp(reviewScore, 1, 9);

  // 7. Growth Leverage Opportunity (5)
  // Higher when there's clearly room to grow (weak inputs).
  const weakInputCount =
    (hasGoogle ? 0 : 1) +
    (hasWebsite || hasMenu ? 0 : 1) +
    (socialCount === 0 ? 1 : 0) +
    (strongCuisine ? 0 : 1);
  let leverageScore = 2 + weakInputCount; // 2..6
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
      hasGoogle
        ? "Preliminary signal: a Google listing was provided. A full Veroxa audit would manually review keyword presence, category accuracy, photos, and post freshness."
        : "Preliminary signal: no Google listing was provided. Restaurants without an active Google Business Profile are typically harder to discover in local search.",
    ),
    make(
      "google_maps_conversion_readiness",
      "Google Walk-In Readiness",
      mapsScore,
      "How well your Google presence turns searchers into visitors, calls, and direction clicks.",
      "Veroxa improves CTAs, photos, hours/menu clarity, and the Google posts that influence the decision moment.",
      hasGoogle
        ? "Based on the information provided, your Maps presence is the most common decision point — sharper photos, hours, and CTAs would likely raise conversion."
        : "Without a Google listing link, Maps-driven calls and direction clicks are likely a major missed customer-flow opportunity.",
    ),
    make(
      "social_reminder_system",
      "Customer Reminder Rhythm",
      socialScore,
      "How consistently your restaurant stays top-of-mind with hungry customers across social platforms.",
      "Veroxa improves posting consistency, Reels/TikToks, weekly specials, lunch/dinner reminders, and catering reminders.",
      socialCount === 0
        ? "Preliminary signal: no social channels provided. Reminder-driven flow (lunch, dinner, weekend, catering) is likely underused."
        : `Based on the information provided, ${socialCount} social channel${socialCount === 1 ? "" : "s"} provided. Consistency and weekly themes are typically the bigger lever than channel count.`,
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
      hasWebsite || hasMenu
        ? "Based on the information provided, an action path (website or menu/ordering link) is in place — clarifying menu, hours, and CTAs would likely tighten conversion."
        : "Preliminary signal: no website or menu/ordering link provided. Customers who want to order, reserve, or check the menu may drop off at the decision moment.",
    ),
    make(
      "review_trust_strength",
      "Trust Signals",
      reviewScore,
      "How much your review presence supports confidence in comparison decisions.",
      "Veroxa supports review response cadence, fresh photos, and trust signals tied to recent activity.",
      hasGoogle
        ? "A full Veroxa audit would manually review review volume, recency, response rate, and tone."
        : "Without a Google listing, trust signals through reviews are not visible at the decision moment.",
    ),
    make(
      "growth_leverage_opportunity",
      "Weekly Visit Triggers",
      leverageScore,
      "How much room Veroxa sees to improve customer-flow conditions through focused work.",
      "Veroxa identifies the biggest daily opportunity and focuses early work where the most consistent improvement can happen.",
      `Based on the information provided, ${leverageScore >= 4 ? "a single focused 30-day plan would likely change multiple signals at the same time." : "most of the foundation is present — refinement, not rebuild, is the leverage."}`,
    ),
  ];
}

export function getAuditGrade(totalScore: number): {
  grade: AuditGrade;
  label: string;
  description: string;
} {
  // Public labels use opportunity/readiness language. Internal grade ids
  // are preserved for compatibility with team-facing pages.
  let grade: AuditGrade;
  let label: string;
  if (totalScore >= 85) {
    grade = "strong_foundation";
    label = "Strong Foundation";
  } else if (totalScore >= 70) {
    grade = "good_missed_consistency";
    label = "Needs Consistency";
  } else if (totalScore >= 50) {
    grade = "clear_gap";
    label = "High Opportunity";
  } else if (totalScore >= 30) {
    grade = "underbuilt";
    label = "Needs Structure";
  } else {
    grade = "foundational_problem";
    label = "Needs Immediate Structure";
  }
  return { grade, label, description: getScoreMeaningByGrade(grade) };
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
      label: "Strong",
      explanation:
        "Multiple key links were provided, so the preliminary report has stronger signal. A full Veroxa audit would still manually verify the live profiles.",
    };
  }
  if (hasGoogle && (hasSiteOrMenu || socialCount >= 1)) {
    return {
      level: "good",
      label: "Good",
      explanation:
        "Several useful links were provided, so the audit can give more specific direction. A full Veroxa audit would still manually verify the live profiles.",
    };
  }
  return {
    level: "basic",
    label: "Basic",
    explanation:
      "Few links were provided, so this report focuses on likely opportunities suggested by missing information. Adding links would sharpen the audit, but missing links are themselves a signal Veroxa can act on.",
  };
}

export function getTopWeakSpots(
  report: RestaurantAuditReport,
): AuditWeakSpot[] {
  const input = report.input;
  const hasGoogle = has(input.googleListingUrl);
  const hasWebsiteOrMenu =
    has(input.websiteUrl) || has(input.menuOrderingUrl);
  const socialCount = [
    has(input.instagramUrl),
    has(input.facebookUrl),
    has(input.tiktokUrl),
  ].filter(Boolean).length;

  const ranked = [...report.categories]
    .map((c) => ({ c, pct: c.score / c.maxScore }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  function describe(categoryId: AuditCategoryId, fallback: AuditWeakSpot): AuditWeakSpot {
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

  return ranked.map(({ c }) =>
    describe(c.id, {
      categoryId: c.id,
      title: c.label,
      whyItMatters: c.customerFlowImpact,
      howVeroxaHelps: c.howVeroxaHelps,
    }),
  );
}

export function getTopOpportunities(
  report: RestaurantAuditReport,
): AuditOpportunity[] {
  const input = report.input;
  const goal = lower(input.currentGoal);
  const hasGoogle = has(input.googleListingUrl);
  const hasWebsiteOrMenu =
    has(input.websiteUrl) || has(input.menuOrderingUrl);
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
        "Veroxa would set up a weekly content plan with lunch / dinner / weekend / catering themes.",
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

  const webSignals: string[] = [];
  if (hasWebsite) webSignals.push("Website: found");
  else webSignals.push("Website: not provided");
  if (hasMenu) webSignals.push("Menu/order link: found");
  else webSignals.push("Menu/order link: not provided");
  if (hasOther) webSignals.push("Additional link (reservation/catering/other): found");

  const hasAdsSignal = /(ads?|paid|campaign)/i.test(
    lower(input.currentGoal) + " " + lower(input.notes),
  );

  return [
    {
      id: "identity",
      title: "Restaurant Identity",
      currentSignal: `${input.restaurantName} · ${input.cuisineType} · ${input.city}, ${input.state}.`,
      whyItMatters:
        "A clear, consistent identity across Google, social media, and your website helps customers recognize and remember you at the decision moment.",
      veroxaRecommendation:
        "Veroxa would verify that the restaurant name, cuisine type, and location are consistent across every platform — Google, Instagram, Facebook, TikTok, and your website.",
      sourceLabel: "found",
    },
    {
      id: "google_search_seo",
      title: "Google Search SEO",
      currentSignal: hasGoogle
        ? "A Google Business Profile link was provided. Keyword coverage, category accuracy, and content freshness need manual review to assess search ranking opportunity."
        : "No Google Business Profile link was provided. Restaurants without an active, optimized listing are typically harder to discover in local search results.",
      whyItMatters:
        "When someone nearby searches for a restaurant — by name, cuisine, or 'restaurants near me' — Google is usually the first stop. A well-optimized listing with the right category, location signals, and fresh content improves the chance of appearing at the right moment.",
      veroxaRecommendation: hasGoogle
        ? "Veroxa would manually review keyword presence, category accuracy, business description, and content freshness to strengthen local search visibility."
        : "Veroxa would prioritize setting up and optimizing a Google Business Profile with the correct name, category, location, description, and regular posts to build local search presence.",
      sourceLabel: hasGoogle ? "found" : "not found",
    },
    {
      id: "google_maps_seo",
      title: "Google Maps / Local SEO",
      currentSignal: hasGoogle
        ? `Google Maps presence found. ${googleDetailStr ? googleDetailStr + " " : ""}Profile freshness, photo recency, and conversion readiness need manual review.`.trim()
        : "No Google Maps presence confirmed from the information provided. Local discovery, direction clicks, and call buttons are likely missing from the customer decision moment.",
      whyItMatters:
        "Google Maps is where many nearby customers make their final decision — they compare photos, check reviews, tap for directions, or call directly from the result. A weak or missing Maps profile means missing those moments.",
      veroxaRecommendation: hasGoogle
        ? "Veroxa would improve Maps conversion readiness: sharper food-first photos, clear hours, menu visibility, and Google posts timed around lunch, dinner, and weekend traffic."
        : "Veroxa would create and fully optimize a Google Maps presence so the restaurant appears in local discovery and customers can act immediately.",
      sourceLabel: hasGoogle ? "found" : "not found",
    },
    {
      id: "gbp_strength",
      title: "Google Business Profile Strength",
      currentSignal: hasGoogle
        ? "A Business Profile link was provided. Photos, posts, hours, menu link, and category accuracy require manual review to assess current strength."
        : "No Google Business Profile link was provided — photos, posts, hours, menu, and categories cannot be assessed without a profile.",
      whyItMatters:
        "A strong Google Business Profile is the single most visible signal a local restaurant has online. Photos, operating hours, menu access, and regular posts influence customer decisions before they ever visit the website.",
      veroxaRecommendation:
        "Veroxa would improve Google photo freshness with food-first images, set up regular Google posts, confirm category and menu clarity, and maintain accurate hours — all of which support local trust signals.",
      sourceLabel: hasGoogle ? "found" : "manual review needed",
    },
    {
      id: "website_menu_path",
      title: "Website + Menu / Order / Contact Path",
      currentSignal:
        webSignals.join(". ") +
        ". Customer friction points and the full action path need manual review.",
      whyItMatters:
        "After a customer decides they want to visit, they need to quickly find the menu, confirm hours, place an order, or make a reservation. Every extra step increases the chance they choose somewhere else.",
      veroxaRecommendation:
        "Veroxa would improve menu/order/contact visibility across Google and social profiles, clarify the customer action path, and reduce friction between interest and action.",
      sourceLabel: hasWebsiteOrMenu ? "found" : "not found",
    },
    {
      id: "social_standing",
      title: "Social Media Standing",
      currentSignal: hasSocial
        ? `${socialSignals.join(". ")}. Posting rhythm, consistency, and content quality need manual review.`
        : "No social media channels were provided. Customer reminder rhythm through Instagram, Facebook, or TikTok appears inactive or unknown.",
      whyItMatters:
        "Social media is how restaurants stay top-of-mind between visits. A consistent presence with food-first content, timed around lunch, dinner, and weekend moments, keeps the restaurant in customers' feeds when they are deciding where to eat.",
      veroxaRecommendation:
        "Veroxa would establish a weekly content rhythm, food-first captions, media selection guidance, and posting windows aligned to lunch, dinner, and weekend decision moments.",
      sourceLabel: hasSocial ? "found" : "not found",
    },
    {
      id: "content_consistency",
      title: "Content Consistency",
      currentSignal:
        hasSocial || hasGoogle
          ? "Some online presence was found. Content consistency, posting rhythm, and cross-platform alignment need manual review to assess."
          : "No links provided to assess content consistency. Whether the restaurant name, photos, and messaging align across platforms is unknown.",
      whyItMatters:
        "Customers compare restaurants across Google, Instagram, Facebook, and TikTok in the same decision moment. Inconsistent photos, mismatched hours, or outdated menus create doubt and friction.",
      veroxaRecommendation:
        "Veroxa would ensure the restaurant's name, cuisine identity, photos, hours, and call-to-action links are consistent across every platform — reducing confusion and strengthening the first impression.",
      sourceLabel: "manual review needed",
    },
    {
      id: "reviews_trust",
      title: "Reviews + Trust Signals",
      currentSignal: hasGoogle
        ? `Google profile found. ${googleDetailStr ? googleDetailStr + " " : ""}Review recency, owner response rate, and trust signal strength need manual review.`.trim()
        : "No Google profile was provided — reviews and trust signals cannot be assessed at this time.",
      whyItMatters:
        "Reviews are a primary trust signal. Nearby customers compare star ratings, read recent reviews, and look at how the restaurant responds. A strong review presence supports the final decision to visit.",
      veroxaRecommendation:
        "Veroxa supports review response cadence, fresh photo uploads timed with new reviews, and trust-signal consistency across the Google profile to maintain a strong reputation at the decision moment.",
      sourceLabel: hasGoogle ? "found" : "not found",
    },
    {
      id: "ads_readiness",
      title: "Ads Readiness",
      currentSignal:
        "Ads usage not publicly verified — manual review needed. Whether the restaurant is currently running Google or social ads cannot be confirmed from the information provided.",
      whyItMatters:
        "Paid ads can amplify an already solid online presence, but they send customers to whatever they find — Google profile, website, menu, and content. If those are weak, ads spend more to deliver a poor experience.",
      veroxaRecommendation: hasAdsSignal
        ? "An ads-related goal was noted. Veroxa would evaluate offer clarity, landing path, menu/order readiness, and Google/social foundation before recommending an ad strategy. Ads are most effective after the foundation is cleaned up. Veroxa can support ads strategy and service if you choose to move forward — results vary by budget, offer, competition, and execution."
        : "Veroxa recommends cleaning up the Google presence, content, and action path first. Once the foundation is strong, ads become more efficient and easier to measure. Veroxa can support ads strategy and service at that stage — results vary by budget, offer, competition, and execution.",
      sourceLabel: "manual review needed",
    },
    {
      id: "walk_in_opportunity",
      title: "Daily Walk-In Opportunity",
      currentSignal:
        "Walk-in opportunity is driven by the full chain of online consistency — not a single platform. How consistently this restaurant appears across search, Maps, and social needs manual assessment.",
      whyItMatters:
        "For most independent restaurants, the biggest daily opportunity is improving the chain: consistent online presence → more customer reminders → stronger recall → easier decision to visit. Each link in that chain is something Veroxa can improve.",
      veroxaRecommendation:
        "Veroxa focuses on strengthening each step of the daily walk-in chain: keeping Google fresh, posting around the moments customers decide to eat, making the menu and action path easy to reach, and showing up consistently so the restaurant stays in the customer's mind.",
      sourceLabel: "manual review needed",
    },
    {
      id: "fix_first",
      title: "What Veroxa Would Fix First",
      currentSignal: `Based on the preliminary signals: ${hasGoogle ? "Google presence found" : "Google presence not confirmed"} · ${hasWebsiteOrMenu ? "action path present" : "action path not confirmed"} · ${hasSocial ? `${socialCount} social channel${socialCount > 1 ? "s" : ""} found` : "no social channels provided"}.`,
      whyItMatters:
        "Starting with the right priorities — rather than trying to fix everything at once — builds momentum and creates early signals to learn from.",
      veroxaRecommendation:
        "First 7 days: Google profile and menu/action-path cleanup, content direction setup. " +
        "First 30 days: weekly posting rhythm, Google updates, food-content system, reporting baseline. " +
        "Ongoing: weekly updates, monthly strategy report, consistency maintained across Google, social, and content.",
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
      packageId: "complete_online_presence",
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
