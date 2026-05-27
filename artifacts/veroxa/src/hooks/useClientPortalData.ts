import { useState, useEffect } from "react";
import {
  MAMADALI_DEMO_CLIENT_ID,
  getClientById,
  getClientPlatforms,
  getClientMediaAssets,
  getClientCalendar,
  getClientWeeklyReports,
  getClientMonthlyReports,
} from "@/lib/supabase";
import {
  scheduledPosts as demoScheduledPosts,
  googleMetrics as demoGoogleMetrics,
  contentSupply as demoContentSupply,
  mamadaliClient,
} from "@/lib/demo-data";

export type ClientPortalSource = "supabase" | "demo";

export type ContentSupplyItem = {
  label: string;
  value: number;
  max: number;
};

export type ScheduledPostDisplay = {
  date: string;
  caption: string;
  platform: string;
  status: string;
};

export type WeeklyUpdateDisplay = {
  title: string;
  summaryItems: string[];
};

export type MonthlyReportPreview = {
  title: string;
  status: string;
  postsPublished: number;
  postsPlanned: number;
  completionRate: number;
  summaryText: string | null;
};

export type ClientPortalData = {
  businessName: string;
  scheduledPosts: readonly ScheduledPostDisplay[];
  googleMetrics: typeof demoGoogleMetrics;
  contentSupply: ContentSupplyItem[];
  weeklyUpdate: WeeklyUpdateDisplay;
  monthlyReportPreview: MonthlyReportPreview;
  platformsCount: number;
  mediaAssetsCount: number;
  postsCount: number;
  postSlotsCount: number;
  weeklyReportsCount: number;
  monthlyReportsCount: number;
};

// ── Static demo fallbacks ─────────────────────────────────────────────────────

const DEMO_WEEKLY_UPDATE: WeeklyUpdateDisplay = {
  title: "Weekly Update — 19–25 May",
  summaryItems: [
    "4 posts published this week across Instagram and Facebook.",
    "Google impressions up 18% — your kebab platter post drove the highest reach this month.",
    "2 new 5-star Google reviews received. Veroxa team prepared suggested responses.",
    "Next shoot booked for Thursday 29 May at 11am — please have the new menu items ready.",
  ],
};

const DEMO_MONTHLY_PREVIEW: MonthlyReportPreview = {
  title: "April 2026 Report",
  status: "Approved",
  postsPublished: 18,
  postsPlanned: 20,
  completionRate: 90,
  summaryText: null,
};

const DEMO_DATA: ClientPortalData = {
  businessName: mamadaliClient.businessName,
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

export type UseClientPortalDataResult = {
  source: ClientPortalSource;
  loading: boolean;
  error: string | null;
  data: ClientPortalData;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseDateParts(dateStr: string): { day: number; monthIdx: number } | null {
  const parts = dateStr.split("-");
  if (parts.length < 3) return null;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || isNaN(day)) return null;
  return { day, monthIdx };
}

function formatWeekTitle(startDate: unknown, endDate: unknown): string {
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

function parseWeeklySummaryItems(
  postsPublished: unknown,
  postsPlanned: unknown,
  clientSafeSummary: unknown
): string[] {
  const items: string[] = [];

  // The weekly view does not currently expose posts_published / posts_planned;
  // when the view is extended (see TODO in clientPortalQueries.ts), these
  // numeric inputs will start being populated and the headline line below
  // will render.
  const pub = typeof postsPublished === "number" ? postsPublished : null;
  const plan = typeof postsPlanned === "number" ? postsPlanned : null;
  if (pub !== null && plan !== null) {
    const rate = plan > 0 ? Math.round((pub / plan) * 100) : 0;
    items.push(`${pub} of ${plan} posts published this week (${rate}% completion rate).`);
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

function parseMonthKey(monthKey: unknown): { month: number; year: number } | null {
  if (typeof monthKey !== "string") return null;
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return { month, year };
}

function formatMonthlyTitleFromKey(monthKey: unknown): string {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return DEMO_MONTHLY_PREVIEW.title;
  const monthName = MONTH_NAMES[parsed.month - 1] ?? String(parsed.month);
  return `${monthName} ${parsed.year} Report`;
}

// ── Scheduled posts builder ───────────────────────────────────────────────────

// status_label is already a client-safe label produced by
// client_portal_calendar_view ("Scheduled" | "Published"). Pass-through.
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

// Calendar items only — no draft_variants join. The calendar view exposes
// `client_safe_title` (post title written for client-safe display) but no
// caption_text by design. If client_safe_title is missing/blank we fall
// back to a demo-safe placeholder.
function buildScheduledPostsFromCalendar(
  calendar: Record<string, unknown>[]
): ScheduledPostDisplay[] {
  return calendar
    .slice()
    .sort((a, b) => {
      const aTime = typeof a.scheduled_for === "string" ? new Date(a.scheduled_for).getTime() : 0;
      const bTime = typeof b.scheduled_for === "string" ? new Date(b.scheduled_for).getTime() : 0;
      return aTime - bTime;
    })
    .map((p) => {
      const date = formatScheduledFor(p.scheduled_for);
      const platformRaw = typeof p.platform_name === "string" ? p.platform_name : "";
      const platform = platformRaw.charAt(0).toUpperCase() + platformRaw.slice(1).toLowerCase();
      const status = normalizeStatusLabel(p.status_label);
      const titleRaw = typeof p.client_safe_title === "string" ? p.client_safe_title.trim() : "";
      const caption = titleRaw.length > 0 ? titleRaw : "Post details available in your scheduled posts list";
      return { date, caption, platform, status };
    });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useClientPortalData(): UseClientPortalDataResult {
  const [state, setState] = useState<UseClientPortalDataResult>({
    source: "demo",
    loading: true,
    error: null,
    data: DEMO_DATA,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [client, platforms, media, calendar, weekly, monthly] =
          await Promise.all([
            getClientById(MAMADALI_DEMO_CLIENT_ID),
            getClientPlatforms(MAMADALI_DEMO_CLIENT_ID),
            getClientMediaAssets(MAMADALI_DEMO_CLIENT_ID),
            getClientCalendar(MAMADALI_DEMO_CLIENT_ID),
            getClientWeeklyReports(MAMADALI_DEMO_CLIENT_ID),
            getClientMonthlyReports(MAMADALI_DEMO_CLIENT_ID),
          ]);

        if (cancelled) return;

        const row = client as Record<string, unknown>;
        const businessName =
          (row?.business_name as string | undefined) ??
          (row?.businessName as string | undefined) ??
          mamadaliClient.businessName;

        const calendarTyped = calendar as Record<string, unknown>[];
        const weeklyTyped = weekly as Record<string, unknown>[];
        const monthlyTyped = monthly as Record<string, unknown>[];

        // Content supply — derive "scheduled" count from the client-safe
        // calendar view (status_label === "Scheduled" only; published posts
        // are excluded from the supply queue).
        const scheduledCount = calendarTyped.filter(
          (p) => p.status_label === "Scheduled"
        ).length;
        const contentSupply: ContentSupplyItem[] = [
          { label: demoContentSupply[0].label, value: demoContentSupply[0].value, max: demoContentSupply[0].max },
          { label: demoContentSupply[1].label, value: scheduledCount, max: demoContentSupply[1].max },
          { label: demoContentSupply[2].label, value: demoContentSupply[2].value, max: demoContentSupply[2].max },
        ];

        const scheduledPosts = buildScheduledPostsFromCalendar(calendarTyped);

        // Weekly update — view fields: week_start, week_end, client_safe_summary,
        // client_safe_summary_json. posts_published / posts_planned not yet on
        // the view (see TODO in clientPortalQueries.ts).
        const latestWeekly = weeklyTyped[0] ?? null;
        const weeklyUpdate: WeeklyUpdateDisplay = latestWeekly
          ? {
              title: formatWeekTitle(latestWeekly.week_start, latestWeekly.week_end),
              summaryItems: parseWeeklySummaryItems(
                latestWeekly.posts_published,
                latestWeekly.posts_planned,
                latestWeekly.client_safe_summary
              ),
            }
          : DEMO_WEEKLY_UPDATE;

        // Monthly report preview — view fields: month_key, client_safe_summary,
        // client_safe_summary_json, published_at. Status / posts_published /
        // posts_planned / completion_rate not exposed by design (status is
        // always 'published' for any row the client sees). Fall back to demo
        // numbers for those visual fields.
        const latestMonthly = monthlyTyped[0] ?? null;
        const monthlyReportPreview: MonthlyReportPreview = latestMonthly
          ? {
              title: formatMonthlyTitleFromKey(latestMonthly.month_key),
              status: "Published",
              postsPublished: DEMO_MONTHLY_PREVIEW.postsPublished,
              postsPlanned: DEMO_MONTHLY_PREVIEW.postsPlanned,
              completionRate: DEMO_MONTHLY_PREVIEW.completionRate,
              summaryText:
                typeof latestMonthly.client_safe_summary === "string"
                  ? latestMonthly.client_safe_summary
                  : null,
            }
          : DEMO_MONTHLY_PREVIEW;

        setState({
          source: "supabase",
          loading: false,
          error: null,
          data: {
            businessName,
            scheduledPosts,
            googleMetrics: demoGoogleMetrics,
            contentSupply,
            weeklyUpdate,
            monthlyReportPreview,
            platformsCount: platforms.length,
            mediaAssetsCount: media.length,
            postsCount: calendarTyped.length,
            // post_slots has no client-safe view by design; report 0 rather
            // than reading public.post_slots directly.
            postSlotsCount: 0,
            weeklyReportsCount: weekly.length,
            monthlyReportsCount: monthly.length,
          },
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          source: "demo",
          loading: false,
          error: err instanceof Error ? err.message : String(err),
          data: DEMO_DATA,
        });
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
