/**
 * auditReportFormatter.ts — M026A/B
 *
 * Owner-friendly formatting helpers for the audit report. Strings only.
 */

import type { RestaurantAuditReport } from "./auditTypes";

export function formatAuditSummary(report: RestaurantAuditReport): string {
  const { input, totalScore, gradeLabel } = report;
  return `${input.restaurantName} (${input.cuisineType}, ${input.city}, ${input.state}) — Customer-Flow Readiness ${totalScore}/100 · ${gradeLabel}.`;
}

export function formatOwnerFriendlyDiagnosis(
  report: RestaurantAuditReport,
): string {
  const top = report.weakSpots[0];
  if (!top) return report.gradeDescription;
  return `Based on the information provided, the largest customer-flow leak is ${top.title}. ${top.howVeroxaHelps}`;
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
      title: "Foundation / Google / audit cleanup",
      bullets: [
        "Manually audit Google Business Profile + cleanup.",
        "Confirm hours, categories, photos, menu link, contact paths.",
        "Identify the single weakest customer-flow stage and frame the plan around it.",
      ],
    },
    {
      week: 2,
      title: "Content intake / upload system / strategy",
      bullets: [
        "Set up upload key for the restaurant to share photos/videos/notes easily.",
        "Draft weekly content themes (lunch / dinner / weekend / catering).",
        "Confirm action paths: call, directions, order, reserve, inquire.",
      ],
    },
    {
      week: 3,
      title: "Consistent posting / Google updates / customer reminders",
      bullets: [
        "Begin disciplined posting cadence across the active channels.",
        "Refresh Google posts and photos weekly.",
        "Send first reminder-style content (lunch / weekend / catering).",
      ],
    },
    {
      week: 4,
      title: "Performance learning / report / next recommendation",
      bullets: [
        "Review first signals: profile views, calls, direction clicks, social engagement.",
        "Generate a clear weekly report.",
        "Adjust the next 30 days based on what the data taught us.",
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
  "This preliminary audit is based on provided information and visible online signals. It is not a guarantee of increased customers. A full Veroxa audit includes manual review of Google Business Profile, social platforms, content quality, reviews, menu clarity, customer action paths, and local competition.";
