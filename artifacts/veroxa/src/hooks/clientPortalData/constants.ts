import { type ClientPortalData } from "../useClientPortalData";
import { googleMetrics as demoGoogleMetrics } from "@/lib/demo-data";

export const DEMO_WEEKLY_UPDATE = {
  title: "This week",
  summaryItems: [
    "No data available yet.",
  ],
};

export const DEMO_MONTHLY_PREVIEW = {
  title: "This month",
  status: "In progress",
  postsPublished: 0,
  postsPlanned: 0,
  completionRate: 0,
  summaryText: null,
};

export const DEMO_DATA: ClientPortalData = {
  businessName: "Demo Client",
  scheduledPosts: [],
  googleMetrics: demoGoogleMetrics,
  contentSupply: [],
  weeklyUpdate: DEMO_WEEKLY_UPDATE,
  monthlyReportPreview: DEMO_MONTHLY_PREVIEW,
  platformsCount: 0,
  mediaAssetsCount: 0,
  postsCount: 0,
  postSlotsCount: 0,
  weeklyReportsCount: 0,
  monthlyReportsCount: 0,
};

export const SOURCE_MESSAGES: Record<string, string> = {
  supabase: "Live data from Supabase",
  supabase_readonly: "Read-only live data",
  fallback: "Fallback to fixtures",
  demo: "Demo data",
  fixture: "Fixture data",
};

export function formatMonthKeyAsReportTitle(
  monthKey: unknown,
  fallback: string,
): string {
  if (typeof monthKey !== "string") return fallback;
  
  // Parse month_key format (e.g., "2025-01" or "202501")
  const match = monthKey.match(/(\d{4})[_-]?(\d{2})/);
  if (!match) return fallback;
  
  const [, year, month] = match;
  const monthNum = parseInt(month, 10);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  
  const monthName = months[monthNum - 1] || fallback;
  return `${monthName} ${year}`;
}

export function formatWeekRangeTitle(
  weekStart: unknown,
  weekEnd: unknown,
  fallback: string,
): string {
  if (typeof weekStart !== "string" || typeof weekEnd !== "string") {
    return fallback;
  }

  try {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return fallback;
    }

    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const startDay = start.getDate();
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const endDay = end.getDate();

    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  } catch {
    return fallback;
  }
}

export function buildReadinessContentSupply(
  calendar: Record<string, unknown>[],
): Array<{ label: string; value: number; max: number }> {
  // Count scheduled items
  const scheduled = calendar.filter(
    (item) =>
      typeof item.status_label === "string" &&
      item.status_label === "Scheduled",
  ).length;

  // Build content supply items
  const items: Array<{ label: string; value: number; max: number }> = [];
  
  if (scheduled > 0 || calendar.length > 0) {
    items.push({
      label: "Scheduled",
      value: scheduled,
      max: Math.max(scheduled, calendar.length, 5),
    });
  }

  return items.length > 0
    ? items
    : [
        {
          label: "Scheduled",
          value: 0,
          max: 5,
        },
      ];
}
