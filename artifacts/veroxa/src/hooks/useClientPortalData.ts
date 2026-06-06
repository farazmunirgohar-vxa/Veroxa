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
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { mapRealPortalDataModeToSaasDataMode } from "@/domain/saas/dataMode";
import { createSaasRepositoryBundle } from "@/domain/saas/repositoryProvider";
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
  formatMonthlyTitleFromKey,
  formatWeekTitle,
} from "./clientPortalData/formatters";
import {
  DEMO_DATA,
  DEMO_MONTHLY_PREVIEW,
  DEMO_WEEKLY_UPDATE,
  SOURCE_MESSAGES,
  buildReadinessContentSupply,
  buildScheduledPostsFromCalendar,
  parseWeeklySummaryItems,
} from "./clientPortalDataHelpers";

export type ClientPortalSource =
  | "supabase" // legacy alias — supabase real-auth read
  | "supabase_readonly" // M007 read-only mode succeeded
  | "fallback" // M007 read-only mode attempted but fell back safely
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

export type GoogleMetricDisplay = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
};

export const ZERO_GOOGLE_METRICS: readonly GoogleMetricDisplay[] = [
  { label: "Search Impressions", value: "0", change: "0%", positive: true },
  { label: "Profile Views", value: "0", change: "0%", positive: true },
  { label: "Direction Requests", value: "0", change: "0%", positive: true },
  { label: "Review Score", value: "Not available yet", change: "0", positive: true },
] as const;

const LIVE_WEEKLY_UPDATE_EMPTY: WeeklyUpdateDisplay = {
  title: "Weekly update in review",
  summaryItems: ["Live account data is being prepared."],
};

const LIVE_MONTHLY_PREVIEW_EMPTY: MonthlyReportPreview = {
  title: "Monthly report in review",
  status: "In review",
  postsPublished: 0,
  postsPlanned: 0,
  completionRate: 0,
  summaryText: "Live account data is being prepared.",
};

export type ClientPortalData = {
  businessName: string;
  scheduledPosts: readonly ScheduledPostDisplay[];
  googleMetrics: readonly GoogleMetricDisplay[];
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

export const LIVE_CLIENT_PORTAL_EMPTY_DATA: ClientPortalData = {
  businessName: "Client Portal in review",
  scheduledPosts: [],
  googleMetrics: ZERO_GOOGLE_METRICS,
  contentSupply: [],
  weeklyUpdate: LIVE_WEEKLY_UPDATE_EMPTY,
  monthlyReportPreview: LIVE_MONTHLY_PREVIEW_EMPTY,
  platformsCount: 0,
  mediaAssetsCount: 0,
  postsCount: 0,
  postSlotsCount: 0,
  weeklyReportsCount: 0,
  monthlyReportsCount: 0,
};

export type UseClientPortalDataResult = {
  source: ClientPortalSource;
  loading: boolean;
  error: string | null;
  data: ClientPortalData;
  /** Human-friendly description of the active source. Stable for UI badges. */
  dataSourceMessage: string;
  /** True iff the data on screen came from a real client-safe read. */
  isReadOnlyLive: boolean;
  /** Populated when the portal fell back safely. Null when live. */
  fallbackReason: string | null;
};

// ── Hook helper exports (re-exported from helpers module) ─────────────────────

export {
  DEMO_DATA,
  DEMO_MONTHLY_PREVIEW,
  DEMO_WEEKLY_UPDATE,
  SOURCE_MESSAGES,
  buildScheduledPostsFromCalendar,
  formatMonthKeyAsReportTitle,
  formatWeekRangeTitle,
  parseWeeklySummaryItems,
} from "./clientPortalDataHelpers";

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useClientPortalData(): UseClientPortalDataResult {
  const { activeClientId, isRealClientSession, isPublicDemoRoute } =
    useActiveClientPortalContext();
  const portalDataMode = useRealPortalDataMode();
  const saasDataMode = mapRealPortalDataModeToSaasDataMode(portalDataMode);
  const repositoryBundle = createSaasRepositoryBundle(saasDataMode);

  if (
    !portalDataMode.allowDemoFixtures &&
    !portalDataMode.isLiveDataConnected
  ) {
    return {
      source: "fixture",
      loading: false,
      error: null,
      data: {
        ...LIVE_CLIENT_PORTAL_EMPTY_DATA,
        businessName: "Client Portal in review",
        googleMetrics: ZERO_GOOGLE_METRICS,
      },
      dataSourceMessage: `${repositoryBundle.repositoryMode} — live account data is being prepared`,
      isReadOnlyLive: false,
      fallbackReason: null,
    };
  }
  const realClientId =
    AUTH_MODE === "real" && isRealClientSession ? activeClientId : null;

  // M007: data source resolution.
  //
  // The portal historically short-circuited in placeholder auth mode and used
  // fixtures. M007 introduces DATA_MODE — a separate switch that may
  // request supabase_readonly reads even while AUTH_MODE === "placeholder".
  //
  // Resolution rules:
  //  - DATA_MODE === "fixture"            → fixture data, no network.
  //  - DATA_MODE === "supabase_readonly"  → attempt client_portal_* view reads,
  //                                         fall back safely on any failure.
  //  - AUTH_MODE === "real" + fixture mode → keep current behaviour (existing
  //                                          Supabase load below).
  const shouldAttemptSupabase =
    DATA_MODE === "supabase_readonly" || Boolean(realClientId);

  const initialSource: ClientPortalSource =
    DATA_MODE === "supabase_readonly"
      ? "supabase_readonly"
      : realClientId
        ? "supabase"
        : "demo";

  const initialState: UseClientPortalDataResult = shouldAttemptSupabase
    ? {
        source: initialSource,
        loading: true,
        error: null,
        data: isPublicDemoRoute ? DEMO_DATA : LIVE_CLIENT_PORTAL_EMPTY_DATA,
        dataSourceMessage: SOURCE_MESSAGES[initialSource],
        isReadOnlyLive: false,
        fallbackReason: null,
      }
    : {
        source: "fixture",
        loading: false,
        error: null,
        data: isPublicDemoRoute ? DEMO_DATA : LIVE_CLIENT_PORTAL_EMPTY_DATA,
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
          "Restaurant Portal";

        const calendarTyped = calendar as Record<string, unknown>[];
        const weeklyTyped = weekly as Record<string, unknown>[];
        const monthlyTyped = monthly as Record<string, unknown>[];

        // Content supply — derive "scheduled" count from the client-safe
        // calendar view (status_label === "Scheduled" only; published posts
        // are excluded from the supply queue).
        const contentSupply: ContentSupplyItem[] =
          buildReadinessContentSupply(calendarTyped);

        const scheduledPosts = buildScheduledPostsFromCalendar(calendarTyped);

        // Weekly update — view fields: week_start, week_end, client_safe_summary,
        // client_safe_summary_json. posts_published / posts_planned not yet on
        // the view (see TODO in clientPortalQueries.ts).
        const latestWeekly = weeklyTyped[0] ?? null;
        const weeklyUpdate: WeeklyUpdateDisplay = latestWeekly
          ? {
              title: formatWeekTitle(
                latestWeekly.week_start,
                latestWeekly.week_end,
                LIVE_WEEKLY_UPDATE_EMPTY.title,
              ),
              summaryItems: parseWeeklySummaryItems(
                latestWeekly.posts_published,
                latestWeekly.posts_planned,
                latestWeekly.client_safe_summary,
              ),
            }
          : LIVE_WEEKLY_UPDATE_EMPTY;

        // Monthly report preview — view fields: month_key, client_safe_summary,
        // client_safe_summary_json, published_at. Status / posts_published /
        // posts_planned / completion_rate not exposed by design (status is
        // always 'published' for any row the client sees). Use zero/in-review
        // placeholders for visual fields until client-safe report metrics exist.
        const latestMonthly = monthlyTyped[0] ?? null;
        const monthlyReportPreview: MonthlyReportPreview = latestMonthly
          ? {
              title: formatMonthlyTitleFromKey(
                latestMonthly.month_key,
                LIVE_MONTHLY_PREVIEW_EMPTY.title,
              ),
              status: "Published",
              postsPublished: 0,
              postsPlanned: 0,
              completionRate: 0,
              summaryText:
                typeof latestMonthly.client_safe_summary === "string"
                  ? latestMonthly.client_safe_summary
                  : null,
            }
          : LIVE_MONTHLY_PREVIEW_EMPTY;

        // If the read came back empty (most likely RLS-blocked under
        // placeholder auth), keep public demo routes on demo data but keep
        // authenticated/live paths on safe empty data.
        const looksEmpty =
          !client &&
          platforms.length === 0 &&
          media.length === 0 &&
          calendarTyped.length === 0 &&
          weeklyTyped.length === 0 &&
          monthlyTyped.length === 0;

        if (looksEmpty) {
          const reason =
            isPublicDemoRoute
              ? "Supabase read blocked by RLS or missing authenticated session. Demo preview data remains active."
              : "Live account data is unavailable or still being prepared. Safe empty data remains active.";
          setState({
            source: "fallback",
            loading: false,
            error: reason,
            data: isPublicDemoRoute ? DEMO_DATA : LIVE_CLIENT_PORTAL_EMPTY_DATA,
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
            googleMetrics: ZERO_GOOGLE_METRICS,
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
        // In M007 supabase_readonly mode any failure becomes a safe fallback,
        // not a fatal error — public demo routes keep demo data, while
        // authenticated/live paths keep safe empty data.
        const fallbackSource: ClientPortalSource =
          DATA_MODE === "supabase_readonly" ? "fallback" : "demo";
        // Best-effort: log a single warning, never expose error details to clients.
        console.warn(
          "[useClientPortalData] Supabase read failed, using safe fallback:",
          message,
        );
        setState({
          source: fallbackSource,
          loading: false,
          error: message,
          data: isPublicDemoRoute ? DEMO_DATA : LIVE_CLIENT_PORTAL_EMPTY_DATA,
          dataSourceMessage: SOURCE_MESSAGES[fallbackSource],
          isReadOnlyLive: false,
          fallbackReason: message,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeClientId, isPublicDemoRoute, realClientId, shouldAttemptSupabase]);

  return state;
}
