// =============================================================================
// CLIENT PORTAL DATA HOOK — PLACEHOLDER-PHASE GUARDRAIL
//
// This hook is the single client-portal data load path. The following rules
// are non-negotiable and must NOT be bypassed without explicit, documented,
// future approval:
//
//   1. NO base-table reads. Every Supabase read MUST go through a
//      `client_portal_*` view via the helpers exported from
//      `@/lib/supabase`. Reading `public.clients`, `public.posts`,
//      `public.post_slots`, `public.weekly_reports`,
//      `public.monthly_reports`, `public.media_assets`,
//      `public.draft_variants`, etc. from here would leak sensitive
//      internal columns (pricing, staffing, internal notes, raw payloads).
//
//   2. NO `AUTH_MODE` flip. This hook must keep working when
//      `AUTH_MODE === "placeholder"`. Adding code paths that REQUIRE real
//      auth, or that no-op silently when placeholder is set, is forbidden.
//
//   3. NO production-database connection. The portal stays disconnected
//      from any real Supabase project in this phase. The supabase helpers
//      called here are inert when no env vars are configured; do not add
//      code that fails closed in a way that breaks the local demo.
//
//   4. NO real client / restaurant / customer data. Fixtures only, both in
//      the demo-data fallbacks below and in any new code paths added here.
//
// See `docs/PORTAL_QUERY_SAFETY_PLAN.md`,
// `docs/PORTAL_QUERY_SAFETY_CHECKLIST.md`, and the comment block at the
// top of `src/lib/supabase/clientPortalQueries.ts` for the full contract.
// =============================================================================

import { useState, useEffect } from "react";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import {
  DEFAULT_DEMO_CLIENT_ID,
  getClientById,
  getClientPlatforms,
  getClientMediaAssets,
  getClientCalendar,
  getClientWeeklyReports,
  getClientMonthlyReports,
} from "@/lib/supabase";
import { AUTH_MODE } from "@/lib/auth/authMode";
import { DATA_MODE } from "@/lib/data/dataMode";
import {
  scheduledPosts as demoScheduledPosts,
  googleMetrics as demoGoogleMetrics,
  contentSupply as demoContentSupply,
  demoAClient,
} from "@/lib/demo-data";

export type ClientPortalSource =
  | "supabase"          // legacy alias — supabase real-auth read
  | "supabase_readonly" // M007 read-only mode succeeded
  | "fallback"          // M007 read-only mode attempted but fell back to fixtures
  | "demo"
  | "fixture";

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
    "Google impressions up 18% — your featured grilled platter post drove the highest reach this month.",
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

export type UseClientPortalDataResult = {
  source: ClientPortalSource;
  loading: boolean;
  error: string | null;
  data: ClientPortalData;
  /** Human-friendly description of the active source. Stable for UI badges. */
  dataSourceMessage: string;
  /** True iff the data on screen came from a real Supabase read (M008). */
  isReadOnlyLive: boolean;
  /** Populated when the portal fell back to fixtures. Null when live. */
  fallbackReason: string | null;
};

// Client-safe wording: these are low-key internal dev/QA indicators that only
// render in non-fixture modes. They intentionally avoid backend/vendor terms
// (e.g. "Supabase") so a restaurant client never sees technical language.
const SOURCE_MESSAGES: Record<ClientPortalSource, string> = {
  supabase: "Preview data source: live (signed in)",
  supabase_readonly: "Preview data source: live (read-only)",
  fallback: "Preview data source: sample (live read unavailable)",
  demo: "Preview data source: sample",
  fixture: "Preview data source: sample",
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
  const { activeClientId, isRealClientSession } = useActiveClientPortalContext();
  const realClientId = AUTH_MODE === "real" && isRealClientSession ? activeClientId : null;

  // M007: data source resolution.
  //
  // The portal historically short-circuited in placeholder auth mode and used
  // fixtures only. M007 introduces DATA_MODE — a separate switch that may
  // request supabase_readonly reads even while AUTH_MODE === "placeholder".
  //
  // Resolution rules:
  //  - DATA_MODE === "fixture"            → fixture data, no network.
  //  - DATA_MODE === "supabase_readonly"  → attempt client_portal_* view reads,
  //                                         fall back to fixtures on any failure.
  //  - AUTH_MODE === "real" + fixture mode → keep current behaviour (existing
  //                                          Supabase load below).
  const shouldAttemptSupabase =
    DATA_MODE === "supabase_readonly" || Boolean(realClientId);

  const initialSource: ClientPortalSource =
    DATA_MODE === "supabase_readonly" ? "supabase_readonly" : "demo";

  const initialState: UseClientPortalDataResult = shouldAttemptSupabase
    ? {
        source: initialSource,
        loading: true,
        error: null,
        data: DEMO_DATA,
        dataSourceMessage: SOURCE_MESSAGES[initialSource],
        isReadOnlyLive: false,
        fallbackReason: null,
      }
    : {
        source: "fixture",
        loading: false,
        error: null,
        data: DEMO_DATA,
        dataSourceMessage: SOURCE_MESSAGES.fixture,
        isReadOnlyLive: false,
        fallbackReason: null,
      };

  const [state, setState] = useState<UseClientPortalDataResult>(initialState);

  useEffect(() => {
    // Skip network entirely in pure fixture mode.
    if (!shouldAttemptSupabase) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [client, platforms, media, calendar, weekly, monthly] =
          await Promise.all([
            getClientById(realClientId ?? DEFAULT_DEMO_CLIENT_ID),
            getClientPlatforms(realClientId ?? DEFAULT_DEMO_CLIENT_ID),
            getClientMediaAssets(realClientId ?? DEFAULT_DEMO_CLIENT_ID),
            getClientCalendar(realClientId ?? DEFAULT_DEMO_CLIENT_ID),
            getClientWeeklyReports(realClientId ?? DEFAULT_DEMO_CLIENT_ID),
            getClientMonthlyReports(realClientId ?? DEFAULT_DEMO_CLIENT_ID),
          ]);

        if (cancelled) return;

        const row = client as Record<string, unknown>;
        const businessName =
          (row?.business_name as string | undefined) ??
          (row?.businessName as string | undefined) ??
          demoAClient.businessName;

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

        // If the read came back empty (most likely RLS-blocked under
        // placeholder auth), fall back to fixtures so the UI stays usable.
        const looksEmpty =
          !client &&
          platforms.length === 0 &&
          media.length === 0 &&
          calendarTyped.length === 0 &&
          weeklyTyped.length === 0 &&
          monthlyTyped.length === 0;

        if (looksEmpty) {
          const reason =
            "Supabase read blocked by RLS or missing authenticated session. Fixture fallback remains active.";
          setState({
            source: "fallback",
            loading: false,
            error: reason,
            data: DEMO_DATA,
            dataSourceMessage: SOURCE_MESSAGES.fallback,
            isReadOnlyLive: false,
            fallbackReason: reason,
          });
          return;
        }

        const successSource: ClientPortalSource =
          DATA_MODE === "supabase_readonly" ? "supabase_readonly" : "supabase";

        setState({
          source: successSource,
          loading: false,
          error: null,
          dataSourceMessage: SOURCE_MESSAGES[successSource],
          isReadOnlyLive: true,
          fallbackReason: null,
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
        const message = err instanceof Error ? err.message : String(err);
        // In M007 supabase_readonly mode any failure becomes a fixture fallback,
        // not a fatal error — the portal must keep working.
        const fallbackSource: ClientPortalSource =
          DATA_MODE === "supabase_readonly" ? "fallback" : "demo";
        // Best-effort: log a single warning, never expose error details to clients.
        console.warn("[useClientPortalData] Supabase read failed, using fixtures:", message);
        setState({
          source: fallbackSource,
          loading: false,
          error: message,
          data: DEMO_DATA,
          dataSourceMessage: SOURCE_MESSAGES[fallbackSource],
          isReadOnlyLive: false,
          fallbackReason: message,
        });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [activeClientId, realClientId, shouldAttemptSupabase]);

  return state;
}
