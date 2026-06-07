/**
 * auditReportFormatter.ts — M026A/B
 *
 * Owner-friendly formatting helpers for the audit report. Strings only.
 */

import type { RestaurantAuditReport } from "./auditTypes";

export function formatAuditSummary(report: RestaurantAuditReport): string {
  const { input, gradeLabel } = report;
  return `${input.restaurantName} (${input.cuisineType}, ${input.city}, ${input.state}) — Online Consistency Readiness: ${gradeLabel}.`;
}

export function formatOwnerFriendlyDiagnosis(
  report: RestaurantAuditReport,
): string {
  const top = report.weakSpots[0];
  if (!top) return report.gradeDescription;
  return `Based on the information provided, the biggest daily customer opportunity is ${top.title}. ${top.howVeroxaHelps}`;
}

export function formatCustomerFlowExplanation(
  report: RestaurantAuditReport,
): string {
  return report.customerFlowExplanation;
}

export function formatThirtyDayPlan(report: RestaurantAuditReport): {
  week: 1 | 2 | 3 | 4;
  title: string;
  bullets: string[];
}[] {
  const momo = isMomosHouse(report);
  return [
    {
      week: 1,
      title: "Foundation",
      bullets: [
        "Verify Google, website/menu/order/contact paths",
        "Check photos, hours, profile freshness",
        "Confirm content categories",
      ],
    },
    {
      week: 2,
      title: "Content Rhythm",
      bullets: [
        "Create content pillars",
        "Start consistent social posting",
        "Improve captions and calls to action",
        momo
          ? "Build content around the restaurant’s hero product: momos"
          : "Build content around the restaurant’s hero product",
      ],
    },
    {
      week: 3,
      title: "Google + Reminder System",
      bullets: [
        "Add Google posts/photos",
        "Improve local discovery signals",
        "Reinforce lunch/dinner/craving moments",
        "Improve consistency across platforms",
      ],
    },
    {
      week: 4,
      title: "Weekly System",
      bullets: [
        "Review what was posted",
        "Review content gaps",
        "Prepare next month’s content direction",
        "Create first simple performance summary",
      ],
    },
  ];
}

export function formatWhatVeroxaCanImprove(): string[] {
  return [
    "Google profile freshness",
    "Google photos and posts",
    "Search-friendly content",
    "Social media consistency",
    "Caption quality",
    "Content variety",
    "Posting schedule",
    "Customer reminders",
    "Review response support",
    "Menu / special visibility",
    "Campaign structure",
    "Reporting clarity",
  ];
}

export function formatWhatVeroxaCannotGuarantee(): string[] {
  return [
    "Exact number of customers",
    "Exact sales increase",
    "Food quality",
    "Service quality",
    "Restaurant location",
    "Parking",
    "Pricing",
    "Competition",
    "Customer preferences",
    "Staff cooperation",
    "Ad budget size",
    "Platform algorithm changes",
    "Instant results",
  ];
}

export const AUDIT_EXPECTED_IMPACT_TIMELINE = [
  {
    period: "First 2 weeks",
    summary:
      "Cleaner online foundation, better content organization, more consistent updates.",
  },
  {
    period: "First 30 days",
    summary:
      "Better visibility signals, more consistent customer reminders, more profile/social activity, first learning data.",
  },
  {
    period: "60–90 days",
    summary:
      "Clearer patterns around content, dishes, times, Google/profile engagement, review/trust signals.",
  },
  {
    period: "3–6 months",
    summary:
      "Stronger online presence, clearer customer-flow patterns, more refined campaigns, better repeat visibility.",
  },
] as const;

export const AUDIT_ADAPTIVE_LEARNING_EXPLANATION =
  "Veroxa does not treat this audit as a one-time report. The audit becomes the starting point. As Veroxa works, the system learns from uploads, direction, content decisions, Google activity, social performance, review signals, and results. Every week, those signals help Veroxa make better recommendations.";

export const AUDIT_DISCLAIMER =
  "Preliminary audit based on available public signals. Veroxa can improve visibility, consistency, and customer decision support. Veroxa cannot guarantee exact sales or customer counts.";

export const WHAT_VEROXA_NEEDS_FROM_RESTAURANT: string[] = [
  "3–5 real photos or short videos per week (dishes, daily specials, behind-the-scenes moments)",
  "Menu or ordering link",
  "Any current specials or upcoming events that already exist",
  "Important story details — family-owned, authentic cuisine, local history, or anything verified that makes the restaurant different",
  "Access / permission for Google and social work later if the restaurant becomes a Veroxa client",
];

export interface AuditV2HeroSummary {
  restaurantName: string;
  scoreLabel: string;
  readinessStatus: string;
  confidenceLabel: string;
  reviewModeLabel: string;
  cuisineOrConcept: string;
  locationContext: string;
  shortSummary: string;
}

export interface AuditV2PriorityOpportunity {
  title: string;
  category: string;
  priority: string;
  whyItMatters: string;
  whatVeroxaCanDo: string;
}

export interface AuditV2GrowthInsight {
  title: string;
  label?: string;
  body: string;
  bullets?: string[];
}

export interface AuditV2PlanStage {
  label: string;
  title: string;
  bullets: string[];
}

export interface AuditV2SignalBreakdownGroup {
  title: string;
  bullets: string[];
}

function isMomosHouse(report: RestaurantAuditReport): boolean {
  const identity =
    `${report.input.restaurantName} ${report.input.cuisineType} ${report.input.notes ?? ""}`.toLowerCase();
  return identity.includes("momo");
}

export function buildAuditV2HeroSummary(
  report: RestaurantAuditReport,
): AuditV2HeroSummary {
  const momo = isMomosHouse(report);
  const cuisine =
    report.input.cuisineType || "Restaurant / Food — category not verified";
  return {
    restaurantName: report.input.restaurantName,
    scoreLabel: `${report.totalScore} / 100`,
    readinessStatus: report.gradeLabel,
    confidenceLabel: report.confidenceLabel,
    reviewModeLabel: "Review-mode preview",
    cuisineOrConcept: cuisine,
    locationContext: `${report.input.city}, ${report.input.state}`,
    shortSummary: momo
      ? `${report.input.restaurantName} has a focused hero product: momos. The biggest opportunity is to make the restaurant easier to discover, easier to understand, and more memorable during lunch, dinner, and craving moments.`
      : `${report.input.restaurantName} can strengthen its online foundation by making the restaurant easier to discover, easier to understand, and easier to choose when nearby customers are deciding what to eat.`,
  };
}

export function buildAuditV2PriorityOpportunities(
  report: RestaurantAuditReport,
): AuditV2PriorityOpportunity[] {
  const hasGoogle = Boolean(
    report.input.googleListingUrl || report.input.selectedPlaceId,
  );
  const hasActionPath = Boolean(
    report.input.websiteUrl ||
    report.input.menuOrderingUrl ||
    report.input.websiteFound ||
    report.input.menuLinkFound ||
    report.input.orderLinkFound ||
    report.input.contactPathFound,
  );
  const hasSocial = Boolean(
    report.input.instagramUrl ||
    report.input.facebookUrl ||
    report.input.tiktokUrl ||
    (report.input.discoveredSocialLinks?.length ?? 0) > 0,
  );
  const momo = isMomosHouse(report);

  const candidates: AuditV2PriorityOpportunity[] = [
    {
      title: "Google Visibility / Walk-In Readiness",
      category: "Google Visibility",
      priority: hasGoogle ? "High impact" : "First priority",
      whyItMatters:
        "Customers often decide where to eat from Google Search or Google Maps. If the profile is not fresh, clear, and action-ready, the restaurant can miss nearby decision moments.",
      whatVeroxaCanDo:
        "Improve Google profile freshness, add regular posts and photos, strengthen menu/order visibility, and keep key details active and clear.",
    },
    {
      title: "Customer Action Path",
      category: "Customer Action Path",
      priority: hasActionPath ? "High impact" : "First priority",
      whyItMatters:
        "People should be able to quickly find the menu, hours, ordering, calls, and directions without guessing or switching platforms.",
      whatVeroxaCanDo:
        "Clean up menu, order, contact, and direction paths across Google, website, and social profiles so first-time customers know what to do next.",
    },
    {
      title: momo ? "Content Sustainability" : "Social + Content Rhythm",
      category: "Social + Content Rhythm",
      priority: hasSocial ? "Important" : "High impact",
      whyItMatters: momo
        ? "A focused menu can become repetitive if the same food photo is posted every week. The content needs repeatable angles that keep the hero product fresh."
        : "Restaurants need consistent reminders around lunch, dinner, weekends, and craving moments. Random posting makes the restaurant easier to forget.",
      whatVeroxaCanDo: momo
        ? "Build content pillars around momo styles, sauces, preparation, customer reactions, cultural education, snack discovery, and craving-based posts."
        : "Create a weekly content rhythm, improve captions, organize usable media, and post around the moments customers are deciding what to eat.",
    },
  ];

  return candidates.slice(0, 3);
}

export function buildAuditV2GrowthInsights(
  report: RestaurantAuditReport,
): AuditV2GrowthInsight[] {
  const momo = isMomosHouse(report);
  if (momo) {
    return [
      {
        title: "Brand Position",
        body: `${report.input.restaurantName} appears to be a specialty momo/dumpling restaurant. The strongest opportunity is to become the clear local momo spot instead of appearing like a general food business.`,
      },
      {
        title: "Content Sustainability",
        label: "Medium risk, manageable with the right content pillars",
        body: "The menu is focused, so content variety needs a system. Repeating the same momo photos every week would become stale, but Veroxa can create variety through momo styles, sauces, preparation, customer reactions, cultural education, snack discovery, and craving-based posts.",
      },
      {
        title: "Customer Decision Moments",
        body: "Content should be timed and written around eating decisions, not posted randomly.",
        bullets: [
          "Lunch",
          "Dinner",
          "Weekend cravings",
          "Nearby search moments",
          "Snack discovery moments",
        ],
      },
      {
        title: "Reminder Strength",
        body: `The goal is to make ${report.input.restaurantName} show up consistently before customers decide what to eat — especially when they want dumplings, spicy food, comfort food, or something different.`,
      },
    ];
  }

  return [
    {
      title: "Brand Position",
      body: `${report.input.restaurantName} should be easy to understand at a glance: what type of food it serves, where it is, and why a nearby customer should remember it.`,
    },
    {
      title: "Content Sustainability",
      label: "Caution until media rhythm is confirmed",
      body: "Veroxa would turn available dishes, preparation moments, team details, customer favorites, and seasonal updates into repeatable content pillars so posting does not feel random or stale.",
    },
    {
      title: "Customer Decision Moments",
      body: "The strongest content windows are usually the times customers are deciding what to eat.",
      bullets: [
        "Lunch",
        "Dinner",
        "Weekend plans",
        "Nearby searches",
        "Last-minute ordering moments",
      ],
    },
    {
      title: "Reminder Strength",
      body: "The goal is a steady reminder rhythm so customers see the restaurant before they choose another option. This supports visibility and decision clarity without promising exact outcomes.",
    },
  ];
}

export function buildAuditV2FixPlan(): AuditV2PlanStage[] {
  return [
    {
      label: "Stage 1",
      title: "First 7 Days — Foundation Verification",
      bullets: [
        "Confirm Google Business Profile details",
        "Confirm address, phone, hours, menu/order paths",
        "Check key social profiles",
        "Identify missing or weak trust signals",
        "Confirm content intake needs",
      ],
    },
    {
      label: "Stage 2",
      title: "First 30 Days — Content Rhythm + Google Freshness",
      bullets: [
        "Start regular Google posts/photos",
        "Build repeatable content pillars",
        "Improve caption quality",
        "Improve posting consistency",
        "Make the restaurant easier to understand for first-time customers",
      ],
    },
    {
      label: "Stage 3",
      title: "Ongoing — Weekly Reminder System + Monthly Reporting",
      bullets: [
        "Maintain weekly visibility",
        "Track content activity",
        "Track profile freshness",
        "Track reviews and customer action signals where available",
        "Generate monthly owner-friendly reports",
      ],
    },
  ];
}

export function buildAuditV2SignalBreakdown(
  _report: RestaurantAuditReport,
): AuditV2SignalBreakdownGroup[] {
  return [
    {
      title: "Google Visibility",
      bullets: [
        "Google Search SEO",
        "Google Maps / Local SEO",
        "Google Business Profile strength",
        "Google posts/photos freshness",
        "Local discovery signals",
      ],
    },
    {
      title: "Customer Action Path",
      bullets: [
        "Website",
        "Menu clarity",
        "Order path",
        "Contact path",
        "Direction/call/action readiness",
      ],
    },
    {
      title: "Social + Content Rhythm",
      bullets: [
        "Instagram",
        "Facebook",
        "Posting rhythm",
        "Content consistency",
        "Caption quality",
        "Visual freshness",
      ],
    },
    {
      title: "Trust Signals",
      bullets: [
        "Reviews",
        "Review response support",
        "Recent photos",
        "Profile completeness",
        "Customer confidence signals",
      ],
    },
    {
      title: "Ads Readiness",
      bullets: [
        "Ads should amplify a healthier foundation, not replace it",
        "Google, content rhythm, and action paths should be cleaned up first",
        "No ad result is guaranteed; performance depends on budget, offer, competition, and execution",
      ],
    },
  ];
}
