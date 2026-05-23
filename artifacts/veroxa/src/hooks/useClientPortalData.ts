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

export type ClientPortalData = {
  businessName: string;
  scheduledPosts: readonly ScheduledPostDisplay[];
  googleMetrics: typeof demoGoogleMetrics;
  contentSupply: ContentSupplyItem[];
  platformsCount: number;
  mediaAssetsCount: number;
  postsCount: number;
  postSlotsCount: number;
  weeklyReportsCount: number;
  monthlyReportsCount: number;
};

const DEMO_DATA: ClientPortalData = {
  businessName: mamadaliClient.businessName,
  scheduledPosts: demoScheduledPosts,
  googleMetrics: demoGoogleMetrics,
  contentSupply: demoContentSupply.map((s) => ({ ...s })),
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

// Statuses shown in the "Upcoming Scheduled Posts" list
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
    const month = d.toLocaleString("en-GB", { month: "short" });
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
  // Index variants by id for O(1) lookup
  const variantById = new Map<string, Record<string, unknown>>();
  for (const v of variants) {
    if (typeof v.id === "string") variantById.set(v.id, v);
  }

  const displayable = posts
    .filter((p) => typeof p.status === "string" && DISPLAY_STATUSES.has(p.status))
    .sort((a, b) => {
      const aTime = typeof a.scheduled_at === "string" ? new Date(a.scheduled_at).getTime() : 0;
      const bTime = typeof b.scheduled_at === "string" ? new Date(b.scheduled_at).getTime() : 0;
      return aTime - bTime;
    });

  return displayable.map((p) => {
    const dateStr = formatScheduledAt(p.scheduled_at);

    const platformRaw = typeof p.platform_name === "string" ? p.platform_name : "";
    const platform =
      platformRaw.charAt(0).toUpperCase() + platformRaw.slice(1).toLowerCase();

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

        const scheduledCount = postsTyped.filter(
          (p) => p.status === "scheduled"
        ).length;

        const contentSupply: ContentSupplyItem[] = [
          { label: demoContentSupply[0].label, value: demoContentSupply[0].value, max: demoContentSupply[0].max },
          { label: demoContentSupply[1].label, value: scheduledCount, max: demoContentSupply[1].max },
          { label: demoContentSupply[2].label, value: demoContentSupply[2].value, max: demoContentSupply[2].max },
        ];

        const scheduledPosts = buildScheduledPostsFromSupabase(postsTyped, variantsTyped);

        setState({
          source: "supabase",
          loading: false,
          error: null,
          data: {
            businessName,
            scheduledPosts,
            googleMetrics: demoGoogleMetrics,
            contentSupply,
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
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
