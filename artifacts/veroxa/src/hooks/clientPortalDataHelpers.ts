import {
  scheduledPosts as demoScheduledPosts,
  googleMetrics as demoGoogleMetrics,
  contentSupply as demoContentSupply,
  demoAClient,
} from "@/lib/demo-data";
import type {
  ClientPortalData,
  ClientPortalSource,
  ContentSupplyItem,
  MonthlyReportPreview,
  ScheduledPostDisplay,
  WeeklyUpdateDisplay,
} from "./useClientPortalData";

export const DEMO_WEEKLY_UPDATE: WeeklyUpdateDisplay = {
  title: "Weekly Update — 19–25 May",
  summaryItems: [
    "4 posts published this week across Instagram and Facebook.",
    "Google impressions up 18% — your featured grilled platter post drove the highest reach this month.",
    "2 new 5-star Google reviews received. Veroxa team prepared suggested responses.",
    "Next shoot booked for Thursday 29 May at 11am — please have the new menu items ready.",
  ],
};

export const DEMO_MONTHLY_PREVIEW: MonthlyReportPreview = {
  title: "April 2026 Report",
  status: "Approved",
  postsPublished: 18,
  postsPlanned: 20,
  completionRate: 90,
  summaryText: null,
};

export const DEMO_DATA: ClientPortalData = {
  businessName: demoAClient.businessName,
  scheduledPosts: demoScheduledPosts,
  googleMetrics: demoGoogleMetrics,
  contentSupply: demoContentSupply.map((s) => ({ ...s })),
  weeklyUpdate: DEMO_WEEKLY_UPDATE,
  monthlyReportPreview: DEMO_MONTHLY_PREVIEW,
  platformsCount: 4,
  mediaAssetsCount: 10,
  postsCount: 7,
  postSlotsCount: 8,
  weeklyReportsCount: 2,
  monthlyReportsCount: 1,
};

export const SOURCE_MESSAGES: Record<ClientPortalSource, string> = {
  supabase: "Preview data source: live (signed in)",
  supabase_readonly: "Preview data source: live (read-only)",
  fallback: "Preview data source: sample (live read unavailable)",
  demo: "Preview data source: sample",
  fixture: "Preview data source: sample",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseDateParts(
  dateStr: string,
): { day: number; monthIdx: number } | null {
  const parts = dateStr.split("-");
  if (parts.length < 3) return null;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || isNaN(day)) return null;
  return { day, monthIdx };
}

export function formatWeekRangeTitle(startDate: unknown, endDate: unknown): string {
  if (typeof startDate !== "string" || typeof endDate !== "string") {
    return DEMO_WEEKLY_UPDATE.title;
  }
  const s = parseDateParts(startDate);
  const e = parseDateParts(endDate);
  if (!s || !e) return DEMO_WEEKLY_UPDATE.title;
  const sameMonth = s.monthIdx === e.monthIdx;
  if (sameMonth) {
    return `Weekly Update — ${s.day}–${e.day} ${MONTH_SHORT[s.monthIdx]}`;
  }
  return `Weekly Update — ${s.day} ${MONTH_SHORT[s.monthIdx]}–${e.day} ${MONTH_SHORT[e.monthIdx]}`;
}

export function parseWeeklySummaryItems(
  postsPublished: unknown,
  postsPlanned: unknown,
  clientSafeSummary: unknown,
): string[] {
  const items: string[] = [];
  const pub = typeof postsPublished === "number" ? postsPublished : null;
  const plan = typeof postsPlanned === "number" ? postsPlanned : null;
  if (pub !== null && plan !== null) {
    const rate = plan > 0 ? Math.round((pub / plan) * 100) : 0;
    items.push(
      `${pub} of ${plan} posts published this week (${rate}% completion rate).`,
    );
  }

  if (typeof clientSafeSummary === "string" && clientSafeSummary.trim()) {
    const sentences = clientSafeSummary
      .split(/\.\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.endsWith(".") ? s : `${s}.`));
    items.push(...sentences);
  }

  return items.length > 0 ? items : DEMO_WEEKLY_UPDATE.summaryItems;
}

function parseMonthKey(
  monthKey: unknown,
): { month: number; year: number } | null {
  if (typeof monthKey !== "string") return null;
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return { month, year };
}

export function formatMonthKeyAsReportTitle(monthKey: unknown): string {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return DEMO_MONTHLY_PREVIEW.title;
  const monthName = MONTH_NAMES[parsed.month - 1] ?? String(parsed.month);
  return `${monthName} ${parsed.year} Report`;
}

function normalizeStatusLabel(raw: unknown): string {
  if (typeof raw === "string" && raw.trim()) return raw;
  return "Scheduled";
}

function formatScheduledFor(scheduledFor: unknown): string {
  if (typeof scheduledFor !== "string" || !scheduledFor) return "";
  try {
    const d = new Date(scheduledFor);
    const day = d.getDate();
    const month = MONTH_SHORT[d.getMonth()] ?? "";
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${day} ${month} · ${hour12}:${minutes} ${period}`;
  } catch {
    return String(scheduledFor);
  }
}

export function buildScheduledPostsFromCalendar(
  calendar: Record<string, unknown>[],
): ScheduledPostDisplay[] {
  return calendar
    .slice()
    .sort((a, b) => {
      const aTime =
        typeof a.scheduled_for === "string"
          ? new Date(a.scheduled_for).getTime()
          : 0;
      const bTime =
        typeof b.scheduled_for === "string"
          ? new Date(b.scheduled_for).getTime()
          : 0;
      return aTime - bTime;
    })
    .map((p) => {
      const date = formatScheduledFor(p.scheduled_for);
      const platformRaw =
        typeof p.platform_name === "string" ? p.platform_name : "";
      const platform =
        platformRaw.charAt(0).toUpperCase() +
        platformRaw.slice(1).toLowerCase();
      const status = normalizeStatusLabel(p.status_label);
      const titleRaw =
        typeof p.client_safe_title === "string"
          ? p.client_safe_title.trim()
          : "";
      const caption =
        titleRaw.length > 0
          ? titleRaw
          : "Post details available in your scheduled posts list";
      return { date, caption, platform, status };
    });
}

export function buildReadinessContentSupply(
  calendar: Record<string, unknown>[],
): ContentSupplyItem[] {
  const scheduledCount = calendar.filter(
    (p) => p.status_label === "Scheduled",
  ).length;
  return [
    {
      label: demoContentSupply[0].label,
      value: demoContentSupply[0].value,
      max: demoContentSupply[0].max,
    },
    {
      label: demoContentSupply[1].label,
      value: scheduledCount,
      max: demoContentSupply[1].max,
    },
    {
      label: demoContentSupply[2].label,
      value: demoContentSupply[2].value,
      max: demoContentSupply[2].max,
    },
  ];
}
