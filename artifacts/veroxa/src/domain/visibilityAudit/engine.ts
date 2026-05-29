/**
 * Visibility Audit — rule-based engine.
 *
 * `runVisibilityAudit(input)` turns a restaurant's fixture audit input into a set
 * of plain-language findings plus a simple visibility score. It is pure and
 * deterministic: NO network, NO crawling, NO Google/Meta/website calls, NO AI.
 * Every finding is produced by an explicit rule below. See
 * docs/VISIBILITY_AUDIT_ENGINE.md.
 */

import { getRestaurantName } from "@/data/demo/demoClients";
import type {
  VisibilityAuditCategory,
  VisibilityAuditCategorySummary,
  VisibilityAuditFinding,
  VisibilityAuditInput,
  VisibilityAuditRecommendation,
  VisibilityAuditResult,
  VisibilityAuditSeverity,
  VisibilityAuditSource,
} from "./types";
import {
  MAX_PREPARED_ACTIONS_PER_AUDIT,
  VISIBILITY_AUDIT_CATEGORY_ORDER,
  VISIBILITY_AUDIT_SEVERITY_ORDER,
} from "./types";

interface FindingDraft {
  category: VisibilityAuditCategory;
  severity: VisibilityAuditSeverity;
  source: VisibilityAuditSource;
  title: string;
  detail: string;
  recommendation: VisibilityAuditRecommendation;
  actionable: boolean;
}

/** How much each severity subtracts from a perfect 100 visibility score. */
const SEVERITY_WEIGHT: Record<VisibilityAuditSeverity, number> = {
  urgent: 22,
  high: 14,
  medium: 8,
  low: 3,
};

function buildGoogleFindings(input: VisibilityAuditInput): FindingDraft[] {
  const g = input.google;
  const out: FindingDraft[] = [];

  if (!g.hasRecentPhotos) {
    out.push({
      category: "google_business_profile",
      severity: "medium",
      source: "google_profile",
      title: "Google photos need freshness",
      detail: "No recent photos on the Google profile — fresh images help the listing stand out to nearby diners.",
      recommendation: {
        label: "Prepare a fresh photo for the Google profile.",
        preparedChannel: "google_business_profile",
        preparedType: "google_photo_upload",
        preparedText: "Add a recent, well-lit photo of a best-selling dish to the Google profile.",
      },
      actionable: true,
    });
  }

  if (g.lastGooglePostDaysAgo > 7) {
    out.push({
      category: "google_business_profile",
      severity: g.lastGooglePostDaysAgo > 14 ? "high" : "medium",
      source: "google_profile",
      title: "Google update is due",
      detail: `Last Google update was ${g.lastGooglePostDaysAgo} days ago. Regular updates keep the listing active in local results.`,
      recommendation: {
        label: "Prepare a timely Google update.",
        preparedChannel: "google_business_profile",
        preparedType: "google_post",
        preparedText: "Share a short, appetising update featuring this week's highlight — dine in or order ahead.",
      },
      actionable: true,
    });
  }

  if (g.unansweredReviews > 0) {
    out.push({
      category: "reviews",
      severity: g.unansweredReviews >= 4 ? "high" : "medium",
      source: "reviews",
      title: "Reviews need replies",
      detail: `${g.unansweredReviews} review${g.unansweredReviews === 1 ? "" : "s"} waiting for a reply. Prompt replies build local trust.`,
      recommendation: {
        label: "Prepare warm replies to the waiting reviews.",
        preparedChannel: "reviews",
        preparedType: "review_reply",
        preparedText: "Thank you for taking the time to share your experience — we appreciate it and hope to welcome you back soon.",
      },
      actionable: true,
    });
  }

  if (g.holidayHoursMissing) {
    out.push({
      category: "google_business_profile",
      severity: "high",
      source: "google_profile",
      title: "Holiday hours need confirmation",
      detail: "Holiday hours are not set. Wrong or missing hours frustrate customers and can hurt the listing.",
      recommendation: {
        label: "Confirm holiday hours with the restaurant before updating.",
        preparedChannel: "google_business_profile",
        preparedType: "profile_audit_fix",
        preparedText: "Confirm holiday hours so the Google profile shows the correct opening times over the holiday.",
      },
      actionable: true,
    });
  }

  if (!g.menuLinkWorking || !g.orderingLinkWorking) {
    const which = !g.menuLinkWorking && !g.orderingLinkWorking
      ? "menu and ordering links"
      : !g.menuLinkWorking
        ? "menu link"
        : "ordering link";
    out.push({
      category: "google_business_profile",
      severity: "high",
      source: "google_profile",
      title: "Important link needs correction",
      detail: `The ${which} on the Google profile isn't working — customers may not reach the menu or place an order.`,
      recommendation: {
        label: "Prepare a fix for the broken profile link.",
        preparedChannel: "website",
        preparedType: "website_link_fix",
        preparedText: `Correct the ${which} so customers can reach the menu and order without a dead end.`,
      },
      actionable: true,
    });
  }

  if (g.profileCompleteness < 70) {
    out.push({
      category: "google_business_profile",
      severity: g.profileCompleteness < 50 ? "high" : "medium",
      source: "google_profile",
      title: "Google profile is incomplete",
      detail: `The Google profile is about ${g.profileCompleteness}% complete. Filling the gaps improves how often it shows up.`,
      recommendation: {
        label: "Prepare profile details to complete the listing.",
        preparedChannel: "google_business_profile",
        preparedType: "profile_audit_fix",
        preparedText: "Complete the remaining Google profile details (categories, attributes, description, photos).",
      },
      actionable: false,
    });
  }

  return out;
}

function buildWebsiteFindings(input: VisibilityAuditInput): FindingDraft[] {
  const w = input.website;
  const out: FindingDraft[] = [];

  if (!w.hasWebsite) {
    out.push({
      category: "website",
      severity: "medium",
      source: "website",
      title: "No website to build on yet",
      detail: "There is no website connected. A simple, findable page would strengthen local search over time.",
      recommendation: { label: "Note website opportunity for a future plan." },
      actionable: false,
    });
    return out; // No further website rules make sense without a site.
  }

  if (input.cateringOffered && !w.cateringPageExists) {
    out.push({
      category: "catering_visibility",
      severity: "medium",
      source: "website",
      title: "Catering visibility is weak",
      detail: "Catering is offered but there's no clear catering section — interested customers can't easily find or request it.",
      recommendation: {
        label: "Prepare catering section copy (needs the restaurant's details).",
        preparedChannel: "website",
        preparedType: "website_copy_update",
        preparedText: "Now offering catering for parties and events — made to order. Ask us about group options and lead times.",
      },
      actionable: true,
    });
  }

  if (!w.orderingLinkVisible) {
    out.push({
      category: "website",
      severity: "medium",
      source: "website",
      title: "Ordering path should be clearer",
      detail: "The ordering link isn't easy to spot. A clear ordering path turns more visitors into orders.",
      recommendation: {
        label: "Prepare a clearer ordering call-to-action.",
        preparedChannel: "website",
        preparedType: "website_link_fix",
        preparedText: "Make the 'Order now' button clear and prominent so visitors can order in one tap.",
      },
      actionable: true,
    });
  }

  if (!w.localKeywordsPresent) {
    out.push({
      category: "local_seo",
      severity: "low",
      source: "local_seo",
      title: "Website needs local search wording",
      detail: "The website is missing local search wording (neighborhood + cuisine). Adding it helps nearby customers find it.",
      recommendation: {
        label: "Prepare local search wording for the website.",
        preparedChannel: "seo",
        preparedType: "seo_keyword_update",
        keywordAngle: "neighborhood + cuisine + key dishes near you",
      },
      actionable: true,
    });
  }

  if (!w.bestSellersVisible) {
    out.push({
      category: "menu_visibility",
      severity: "medium",
      source: "menu",
      title: "Best sellers should be easier to find",
      detail: "Best sellers aren't featured clearly. Highlighting them guides new customers to the dishes that convert.",
      recommendation: {
        label: "Prepare a best-seller highlight (needs menu confirmation).",
        preparedChannel: "website",
        preparedType: "menu_visibility_update",
        preparedText: "Feature the best-selling dishes near the top of the menu so first-time visitors see them first.",
      },
      actionable: true,
    });
  }

  if (w.brokenLinksCount > 0) {
    out.push({
      category: "website",
      severity: w.brokenLinksCount >= 3 ? "high" : "low",
      source: "website",
      title: "Broken links need a quick fix",
      detail: `${w.brokenLinksCount} broken link${w.brokenLinksCount === 1 ? "" : "s"} found. Broken links lose visitors and weaken search trust.`,
      recommendation: {
        label: "Prepare a fix for the broken links.",
        preparedChannel: "website",
        preparedType: "website_link_fix",
        preparedText: "Repair the broken links so every page and menu item loads correctly.",
      },
      actionable: false,
    });
  }

  return out;
}

function buildSocialFindings(input: VisibilityAuditInput): FindingDraft[] {
  const s = input.social;
  const out: FindingDraft[] = [];

  if (s.recentSocialPostDaysAgo > 5) {
    out.push({
      category: "content_freshness",
      severity: s.recentSocialPostDaysAgo > 10 ? "high" : "medium",
      source: "social_profile",
      title: "Social profile needs fresh content",
      detail: `Last social post was ${s.recentSocialPostDaysAgo} days ago. A steady cadence keeps the restaurant top of mind.`,
      recommendation: {
        label: "Prepare a fresh social post.",
        preparedChannel: "social_media",
        preparedType: "social_post",
        preparedText: "A bright, appetising post featuring a popular dish, framed for the next meal window.",
      },
      actionable: true,
    });
  }

  if (!s.instagramBioClear || !s.facebookLinkCorrect) {
    out.push({
      category: "social_profile",
      severity: "low",
      source: "social_profile",
      title: "Social profile should be cleaned up",
      detail: "The social bio or link needs tidying so visitors can clearly see what's offered and how to order or book.",
      recommendation: {
        label: "Prepare a tidy-up of the social bio and links.",
        preparedChannel: "social_media",
        preparedType: "social_post",
        preparedText: "Refresh the bio with a clear one-line description plus an ordering/booking link.",
      },
      actionable: false,
    });
  }

  return out;
}

function buildReviewAndSeoFindings(input: VisibilityAuditInput): FindingDraft[] {
  const g = input.google;
  const seo = input.seo;
  const out: FindingDraft[] = [];

  if (g.reviewCount < 40) {
    out.push({
      category: "reviews",
      severity: g.reviewCount < 20 ? "high" : "medium",
      source: "reviews",
      title: "Review growth push needed",
      detail: `Only ${g.reviewCount} reviews so far. More recent reviews lift local ranking and trust.`,
      recommendation: {
        label: "Prepare a gentle review-growth push.",
        preparedChannel: "reviews",
        preparedType: "review_growth_push",
        preparedText: "Invite recent happy guests to leave a quick review — a simple, friendly ask after their visit.",
      },
      actionable: true,
    });
  }

  if (seo.reviewKeywordOpportunities.length > 0) {
    out.push({
      category: "local_seo",
      severity: "low",
      source: "reviews",
      title: "Review themes can support local search",
      detail: `Reviews rarely mention ${seo.reviewKeywordOpportunities.join(", ")}. Encouraging these themes helps local search.`,
      recommendation: {
        label: "Note review-theme angle for the content plan.",
        preparedChannel: "seo",
        preparedType: "seo_keyword_update",
        keywordAngle: seo.reviewKeywordOpportunities.join(" · "),
      },
      actionable: false,
    });
  }

  if (seo.bestSellerClarity === "unclear") {
    out.push({
      category: "menu_visibility",
      severity: "medium",
      source: "menu",
      title: "Best seller clarity needed",
      detail: "It's not clear which dishes are the best sellers across the listings. Clear signals help new customers choose.",
      recommendation: {
        label: "Prepare a clearer best-seller signal (needs menu confirmation).",
        preparedChannel: "website",
        preparedType: "menu_visibility_update",
        preparedText: "Mark the top dishes as best sellers so new customers know what to order first.",
      },
      actionable: false,
    });
  }

  if (input.cateringOffered && !seo.cateringVisible) {
    out.push({
      category: "catering_visibility",
      severity: "medium",
      source: "local_seo",
      title: "Catering push opportunity",
      detail: "Catering is available but barely visible in search and listings — a clear catering message can win group orders.",
      recommendation: {
        label: "Prepare a catering visibility push (needs the restaurant's details).",
        preparedChannel: "seo",
        preparedType: "catering_push",
        preparedText: "Make catering easy to find for group and event searches, with a clear way to enquire.",
      },
      actionable: true,
    });
  }

  return out;
}

function summariseCategories(
  findings: VisibilityAuditFinding[],
): VisibilityAuditCategorySummary[] {
  const summaries: VisibilityAuditCategorySummary[] = [];
  for (const category of VISIBILITY_AUDIT_CATEGORY_ORDER) {
    const inCategory = findings.filter((f) => f.category === category);
    if (inCategory.length === 0) continue;
    const topSeverity = inCategory.reduce<VisibilityAuditSeverity>((top, f) =>
      VISIBILITY_AUDIT_SEVERITY_ORDER[f.severity] < VISIBILITY_AUDIT_SEVERITY_ORDER[top]
        ? f.severity
        : top,
      "low",
    );
    summaries.push({ category, findingCount: inCategory.length, topSeverity });
  }
  return summaries;
}

function scoreFromFindings(findings: VisibilityAuditFinding[]): number {
  const penalty = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  return Math.max(20, Math.min(100, 100 - penalty));
}

function headlineForScore(score: number, findingCount: number): string {
  if (findingCount === 0) return "Visibility looks strong — nothing needs attention right now.";
  if (score >= 80) return "Visibility is solid, with a few quick opportunities to prepare.";
  if (score >= 60) return "A handful of visibility gaps are ready to turn into prepared actions.";
  return "Several visibility gaps need attention — prepared actions are ready for review.";
}

/**
 * Run the visibility audit for one restaurant. Deterministic and offline:
 * findings come only from the rules above, never from a live source.
 */
export function runVisibilityAudit(input: VisibilityAuditInput): VisibilityAuditResult {
  const drafts: FindingDraft[] = [
    ...buildGoogleFindings(input),
    ...buildWebsiteFindings(input),
    ...buildSocialFindings(input),
    ...buildReviewAndSeoFindings(input),
  ];

  const findings: VisibilityAuditFinding[] = drafts
    .map((draft, idx) => ({
      ...draft,
      id: `VA-${input.clientId}-${idx + 1}`,
    }))
    .sort(
      (a, b) =>
        VISIBILITY_AUDIT_SEVERITY_ORDER[a.severity] - VISIBILITY_AUDIT_SEVERITY_ORDER[b.severity],
    );

  const overallScore = scoreFromFindings(findings);

  return {
    clientId: input.clientId,
    restaurantName: getRestaurantName(input.clientId),
    overallScore,
    headline: headlineForScore(overallScore, findings.length),
    findings,
    categorySummaries: summariseCategories(findings),
    preparedActionCount: Math.min(
      findings.filter((f) => f.actionable).length,
      MAX_PREPARED_ACTIONS_PER_AUDIT,
    ),
    generatedAtLabel: "Today",
    demoOnly: true,
  };
}
