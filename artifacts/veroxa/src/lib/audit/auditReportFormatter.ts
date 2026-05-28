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

export function formatThirtyDayPlan(_report: RestaurantAuditReport): {
  week: 1 | 2 | 3 | 4;
  title: string;
  bullets: string[];
}[] {
  return [
    {
      week: 1,
      title: "First 7 days — Foundation",
      bullets: [
        "Verify Google profile basics: name, category, hours, photos, menu link.",
        "Confirm the customer action path: menu, order, call, directions, reservation.",
        "Identify the best content angles for this specific restaurant.",
        "Clarify what media the restaurant can provide each week (photos, specials, moments).",
      ],
    },
    {
      week: 2,
      title: "First 30 days — Content Rhythm",
      bullets: [
        "Build a weekly food-content rhythm across active social channels.",
        "Establish posting windows aligned to lunch, dinner, and weekend decision moments.",
        "Draft first content round using real photos and restaurant story details.",
        "Update Google profile photos and posts with fresh content.",
      ],
    },
    {
      week: 3,
      title: "First 30 days — Google + Reminder System",
      bullets: [
        "Keep Google profile active: weekly posts, updated photos, accurate hours.",
        "Send reminder-style content around lunch, weekend, and any specials.",
        "Review initial signals: profile views, call clicks, direction requests, social engagement.",
        "Adjust content angles based on early data.",
      ],
    },
    {
      week: 4,
      title: "Ongoing — Weekly System",
      bullets: [
        "Maintain weekly content/reporting rhythm.",
        "Generate monthly strategy report: what is working, what to adjust.",
        "Review customer behavior signals and refine content based on results.",
        "Keep Google, social, and action paths consistent and up to date.",
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
    "Weekly recommendations",
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
  "Preliminary audit based on available public signals. Final recommendations require manual review, access where needed, and performance tracking. No results are guaranteed.";

export const WHAT_VEROXA_NEEDS_FROM_RESTAURANT: string[] = [
  "3–5 real photos or short videos per week (dishes, daily specials, behind-the-scenes moments)",
  "Menu or ordering link",
  "Any current specials or upcoming events",
  "Important story details — halal, family-owned, authentic cuisine, local history, or anything that makes the restaurant different",
  "Access / permission for Google and social work later if the restaurant becomes a Veroxa client",
];
