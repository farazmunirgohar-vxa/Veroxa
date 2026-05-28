/**
 * auditScoring.ts — M026A
 *
 * Rule-based scoring engine for the Free Customer-Flow Readiness Audit.
 * Pure functions. No network, no AI, no scraping. All signals come from
 * the input fields the user provided.
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
  AuditGrade,
  AuditOpportunity,
  AuditWeakSpot,
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
  const hasIG = has(input.instagramUrl);
  const hasFB = has(input.facebookUrl);
  const hasTT = has(input.tiktokUrl);
  const socialCount = [hasIG, hasFB, hasTT].filter(Boolean).length;
  const goalLower = lower(input.currentGoal);
  const strongCuisine = strongCuisineMatch(input);

  // 1. Search Visibility Readiness (20)
  // Missing Google URL is a major signal. Missing website compounds it.
  let searchScore = 14;
  if (hasGoogle) searchScore += 4;
  else searchScore -= 6;
  if (hasWebsite) searchScore += 2;
  else searchScore -= 2;
  if (!hasGoogle && !hasWebsite) searchScore -= 2;
  searchScore = clamp(searchScore, 2, 20);

  // 2. Google Maps Conversion Readiness (20)
  let mapsScore = 12;
  if (hasGoogle) mapsScore += 6;
  else mapsScore -= 6;
  if (hasWebsite) mapsScore += 2;
  if (goalLower.includes("google") || goalLower.includes("visibility"))
    mapsScore += 0;
  mapsScore = clamp(mapsScore, 2, 20);

  // 3. Social Reminder System (15)
  let socialScore = 5 + socialCount * 3; // 5..14
  if (socialCount === 0) socialScore = 2;
  if (goalLower.includes("social") || goalLower.includes("consistency"))
    socialScore = Math.max(socialScore - 1, 2);
  socialScore = clamp(socialScore, 2, 15);

  // 4. Content Persuasion Quality (15)
  let contentScore = 7;
  if (strongCuisine) contentScore += 3;
  if (hasIG || hasTT) contentScore += 2;
  if (!hasIG && !hasTT) contentScore -= 2;
  contentScore = clamp(contentScore, 2, 14);

  // 5. Action Path Clarity (15)
  let actionScore = 7;
  if (hasWebsite) actionScore += 3;
  else actionScore -= 3;
  if (hasGoogle) actionScore += 2;
  if (goalLower.match(/order|reserv|call|inquir|catering/)) actionScore += 1;
  actionScore = clamp(actionScore, 2, 14);

  // 6. Review & Trust Strength (10)
  let reviewScore = 4;
  if (hasGoogle) reviewScore += 3;
  if (goalLower.includes("review")) reviewScore += 1;
  if (strongCuisine) reviewScore += 1;
  reviewScore = clamp(reviewScore, 1, 9);

  // 7. Growth Leverage Opportunity (5)
  // Higher when there's clearly room to grow (weak inputs).
  const weakInputCount =
    (hasGoogle ? 0 : 1) +
    (hasWebsite ? 0 : 1) +
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
      "Search Visibility Readiness",
      searchScore,
      "How prepared your restaurant is to be found by new customers searching online.",
      "Veroxa improves Google search visibility, local keywords, fresh content, and listing completeness.",
      hasGoogle
        ? "Preliminary signal: a Google listing was provided. A full Veroxa audit would manually review keyword presence, category accuracy, photos, and post freshness."
        : "Preliminary signal: no Google listing was provided. Restaurants without an active Google Business Profile are typically harder to discover in local search.",
    ),
    make(
      "google_maps_conversion_readiness",
      "Google Maps Conversion Readiness",
      mapsScore,
      "How well your Google presence turns searchers into visitors, calls, and direction clicks.",
      "Veroxa improves CTAs, photos, hours/menu clarity, and the Google posts that influence the decision moment.",
      hasGoogle
        ? "Based on the information provided, your Maps presence is the most common decision point — sharper photos, hours, and CTAs would likely raise conversion."
        : "Without a Google listing link, Maps-driven calls and direction clicks are likely a major missed customer-flow opportunity.",
    ),
    make(
      "social_reminder_system",
      "Social Reminder System",
      socialScore,
      "How consistently your restaurant stays top-of-mind with hungry customers across social platforms.",
      "Veroxa improves posting consistency, Reels/TikToks, weekly specials, lunch/dinner reminders, and catering reminders.",
      socialCount === 0
        ? "Preliminary signal: no social channels provided. Reminder-driven flow (lunch, dinner, weekend, catering) is likely underused."
        : `Based on the information provided, ${socialCount} social channel${socialCount === 1 ? "" : "s"} provided. Consistency and weekly themes are typically the bigger lever than channel count.`,
    ),
    make(
      "content_persuasion_quality",
      "Content Persuasion Quality",
      contentScore,
      "How appetizing, trustworthy, and differentiated your content makes your food look.",
      "Veroxa improves content variety, caption quality, photo/Reel guidance, and weekly themes.",
      strongCuisine
        ? "Likely opportunity: distinctive cuisine signals were detected. Stronger content framing would likely improve persuasion."
        : "A full Veroxa audit would manually review existing content quality, dish framing, and caption clarity to refine persuasion.",
    ),
    make(
      "action_path_clarity",
      "Action Path Clarity",
      actionScore,
      "How easily customers can call, visit, order, reserve, or inquire after they decide.",
      "Veroxa improves CTA clarity, menu/hours/location visibility, Google buttons, and social link organization.",
      hasWebsite
        ? "Based on the information provided, a website is in place — clarifying menu, hours, and CTAs would likely tighten the action path."
        : "Preliminary signal: no website provided. Customers who want to order, reserve, or check the menu may drop off at the decision moment.",
    ),
    make(
      "review_trust_strength",
      "Review & Trust Strength",
      reviewScore,
      "How much your review presence supports confidence in comparison decisions.",
      "Veroxa supports review response cadence, fresh photos, and trust signals tied to recent activity.",
      hasGoogle
        ? "A full Veroxa audit would manually review review volume, recency, response rate, and tone."
        : "Without a Google listing, trust signals through reviews are not visible at the decision moment.",
    ),
    make(
      "growth_leverage_opportunity",
      "Growth Leverage Opportunity",
      leverageScore,
      "How much room Veroxa sees to improve customer-flow conditions through focused work.",
      "Veroxa concentrates first on the weakest customer-flow stage so improvements compound.",
      `Based on the information provided, several foundational pieces could move at once. ${leverageScore >= 4 ? "Likely opportunity: a single focused 30-day plan would change multiple signals at the same time." : "Most of the foundation is present — refinement, not rebuild, is the leverage."}`,
    ),
  ];
}

export function getAuditGrade(totalScore: number): {
  grade: AuditGrade;
  label: string;
  description: string;
} {
  let grade: AuditGrade;
  let label: string;
  if (totalScore >= 85) {
    grade = "strong_foundation";
    label = "Strong Customer-Flow Foundation";
  } else if (totalScore >= 70) {
    grade = "good_missed_consistency";
    label = "Good Foundation, Missed Consistency";
  } else if (totalScore >= 50) {
    grade = "clear_gap";
    label = "Clear Customer-Flow Gap";
  } else if (totalScore >= 30) {
    grade = "underbuilt";
    label = "Underbuilt Online System";
  } else {
    grade = "foundational_problem";
    label = "Foundational Visibility Problem";
  }
  return { grade, label, description: getScoreMeaningByGrade(grade) };
}

export function getTopWeakSpots(report: RestaurantAuditReport): AuditWeakSpot[] {
  const ranked = [...report.categories]
    .map((c) => ({ c, pct: c.score / c.maxScore }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);
  return ranked.map(({ c }) => ({
    categoryId: c.id,
    title: c.label,
    whyItMatters: c.customerFlowImpact,
    howVeroxaHelps: c.howVeroxaHelps,
  }));
}

export function getTopOpportunities(
  report: RestaurantAuditReport,
): AuditOpportunity[] {
  const goal = lower(report.input.currentGoal);
  const out: AuditOpportunity[] = [];
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
  return `Customer flow is visibility → trust → reminder → action → retention. Based on the information provided for ${report.input.restaurantName}, the largest leakage point is the ${report.weakSpots[0]?.title ?? "decision moment"}. Veroxa improves the daily online conditions and opportunities that influence this flow. ${report.gradeDescription}`;
}

export function generateRestaurantAudit(
  input: RestaurantAuditInput,
): RestaurantAuditReport {
  const categories = scoreAuditCategories(input);
  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
  const { grade, label, description } = getAuditGrade(totalScore);

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
    },
    customerFlowExplanation: "",
    generatedAtLabel: "Just now",
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
