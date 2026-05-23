import { useState, useEffect } from "react";
import {
  MAMADALI_DEMO_CLIENT_ID,
  getClientById,
  getClientPlatforms,
  getClientMediaAssets,
  getClientPosts,
  getClientPostSlots,
  getClientWeeklyReports,
  getClientMonthlyReports,
  getClientDraftVariants,
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

const REPORT_STATUS_LABELS: Record<string, string> = {
  published: "Published",
  approved: "Approved",
  operator_review: "In Review",
  drafting: "Drafting",
};

function parseDateParts(dateStr: string): { day: number; monthIdx: number } | null {
  // Expects "YYYY-MM-DD"
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

function parseSummaryItems(
  postsPublished: unknown,
  postsPlanned: unknown,
  completionRate: unknown,
  summaryText: unknown
): string[] {
  const items: string[] = [];

  const pub = typeof postsPublished === "number" ? postsPublished : null;
  const plan = typeof postsPlanned === "number" ? postsPlanned : null;
  const rate = typeof completionRate === "number" ? completionRate : null;

  if (pub !== null && plan !== null && rate !== null) {
    items.push(
      `${pub} of ${plan} posts published this week (${rate}% completion rate).`
    );
  } else if (pub !== null && plan !== null) {
    items.push(`${pub} of ${plan} posts published this week.`);
  }

  if (typeof summaryText === "string" && summaryText.trim()) {
    const sentences = summaryText
      .split(/\.\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.endsWith(".") ? s : `${s}.`));
    items.push(...sentences);
  }

  return items.length > 0 ? items : DEMO_WEEKLY_UPDATE.summaryItems;
}

function formatMonthlyTitle(month: unknown, year: unknown): string {
  const m = typeof month === "number" ? month : null;
  const y = typeof year === "number" ? year : null;
  if (m === null || y === null) return DEMO_MONTHLY_PREVIEW.title;
  const monthName = MONTH_NAMES[(m - 1 + 12) % 12] ?? String(m);
  return `${monthName} ${y} Report`;
}

// ── Scheduled posts builder ───────────────────────────────────────────────────

const DISPLAY_STATUSES = new Set(["scheduled", "ready_for_review", "ready_to_schedule"]);

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  ready_for_review: "In Review",
  ready_to_schedule: "Ready",
};

function formatScheduledAt(scheduledAt: unknown): string {
  if (typeof scheduledAt !== "string" || !scheduledAt) return "";
  try {
    const d = new Date(scheduledAt);
    const day = d.getDate();
    const month = MONTH_SHORT[d.getMonth()] ?? "";
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${day} ${month} · ${hour12}:${minutes} ${period}`;
  } catch {
    return String(scheduledAt);
  }
}

function buildScheduledPostsFromSupabase(
  posts: Record<string, unknown>[],
  variants: Record<string, unknown>[]
): ScheduledPostDisplay[] {
  const variantById = new Map<string, Record<string, unknown>>();
  for (const v of variants) {
    if (typeof v.id === "string") variantById.set(v.id, v);
  }

  return posts
    .filter((p) => typeof p.status === "string" && DISPLAY_STATUSES.has(p.status))
    .sort((a, b) => {
      const aTime = typeof a.scheduled_at === "string" ? new Date(a.scheduled_at).getTime() : 0;
      const bTime = typeof b.scheduled_at === "string" ? new Date(b.scheduled_at).getTime() : 0;
      return aTime - bTime;
    })
    .map((p) => {
      const dateStr = formatScheduledAt(p.scheduled_at);
      const platformRaw = typeof p.platform_name === "string" ? p.platform_name : "";
      const platform = platformRaw.charAt(0).toUpperCase() + platformRaw.slice(1).toLowerCase();
      const statusRaw = typeof p.status === "string" ? p.status : "";
      const status = STATUS_LABELS[statusRaw] ?? statusRaw;

      let caption = "Caption pending team review";
      if (typeof p.draft_variant_id === "string" && p.draft_variant_id) {
        const variant = variantById.get(p.draft_variant_id);
        if (variant && typeof variant.caption_text === "string" && variant.caption_text) {
          caption = variant.caption_text;
        }
      }

      return { date: dateStr, caption, platform, status };
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
        const [client, platforms, media, posts, slots, weekly, monthly, variants] =
          await Promise.all([
            getClientById(MAMADALI_DEMO_CLIENT_ID),
            getClientPlatforms(MAMADALI_DEMO_CLIENT_ID),
            getClientMediaAssets(MAMADALI_DEMO_CLIENT_ID),
            getClientPosts(MAMADALI_DEMO_CLIENT_ID),
            getClientPostSlots(MAMADALI_DEMO_CLIENT_ID),
            getClientWeeklyReports(MAMADALI_DEMO_CLIENT_ID),
            getClientMonthlyReports(MAMADALI_DEMO_CLIENT_ID),
            getClientDraftVariants(MAMADALI_DEMO_CLIENT_ID),
          ]);

        if (cancelled) return;

        const row = client as Record<string, unknown>;
        const businessName =
          (row?.business_name as string | undefined) ??
          (row?.businessName as string | undefined) ??
          mamadaliClient.businessName;

        const postsTyped = posts as Record<string, unknown>[];
        const variantsTyped = variants as Record<string, unknown>[];
        const weeklyTyped = weekly as Record<string, unknown>[];
        const monthlyTyped = monthly as Record<string, unknown>[];

        // Content supply — derive scheduled count from live posts
        const scheduledCount = postsTyped.filter((p) => p.status === "scheduled").length;
        const contentSupply: ContentSupplyItem[] = [
          { label: demoContentSupply[0].label, value: demoContentSupply[0].value, max: demoContentSupply[0].max },
          { label: demoContentSupply[1].label, value: scheduledCount, max: demoContentSupply[1].max },
          { label: demoContentSupply[2].label, value: demoContentSupply[2].value, max: demoContentSupply[2].max },
        ];

        // Scheduled posts display
        const scheduledPosts = buildScheduledPostsFromSupabase(postsTyped, variantsTyped);

        // Weekly update — most recent row (ordered week_start_date DESC from query)
        const latestWeekly = weeklyTyped[0] ?? null;
        const weeklyUpdate: WeeklyUpdateDisplay = latestWeekly
          ? {
              title: formatWeekTitle(latestWeekly.week_start_date, latestWeekly.week_end_date),
              summaryItems: parseSummaryItems(
                latestWeekly.posts_published,
                latestWeekly.posts_planned,
                latestWeekly.completion_rate,
                latestWeekly.summary_text
              ),
            }
          : DEMO_WEEKLY_UPDATE;

        // Monthly report preview — most recent row (ordered year DESC, month DESC)
        const latestMonthly = monthlyTyped[0] ?? null;
        const monthlyReportPreview: MonthlyReportPreview = latestMonthly
          ? {
              title: formatMonthlyTitle(latestMonthly.month, latestMonthly.year),
              status: REPORT_STATUS_LABELS[String(latestMonthly.status)] ?? String(latestMonthly.status ?? ""),
              postsPublished: typeof latestMonthly.posts_published === "number" ? latestMonthly.posts_published : DEMO_MONTHLY_PREVIEW.postsPublished,
              postsPlanned: typeof latestMonthly.posts_planned === "number" ? latestMonthly.posts_planned : DEMO_MONTHLY_PREVIEW.postsPlanned,
              completionRate: typeof latestMonthly.completion_rate === "number" ? latestMonthly.completion_rate : DEMO_MONTHLY_PREVIEW.completionRate,
              summaryText: typeof latestMonthly.summary_text === "string" ? latestMonthly.summary_text : null,
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
            postsCount: posts.length,
            postSlotsCount: slots.length,
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
