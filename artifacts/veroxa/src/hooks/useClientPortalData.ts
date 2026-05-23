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
        const [client, platforms, media, posts, slots, weekly, monthly] = await Promise.all([
          getClientById(MAMADALI_DEMO_CLIENT_ID),
          getClientPlatforms(MAMADALI_DEMO_CLIENT_ID),
          getClientMediaAssets(MAMADALI_DEMO_CLIENT_ID),
          getClientPosts(MAMADALI_DEMO_CLIENT_ID),
          getClientPostSlots(MAMADALI_DEMO_CLIENT_ID),
          getClientWeeklyReports(MAMADALI_DEMO_CLIENT_ID),
          getClientMonthlyReports(MAMADALI_DEMO_CLIENT_ID),
        ]);

        if (cancelled) return;

        const row = client as Record<string, unknown>;
        const businessName =
          (row?.business_name as string | undefined) ??
          (row?.businessName as string | undefined) ??
          mamadaliClient.businessName;

        // Derive scheduled count from live DB rows; captions require a
        // draft_variants join that is not available yet — keep display list static.
        const scheduledCount = (posts as Record<string, unknown>[]).filter(
          (p) => p.status === "scheduled"
        ).length;

        const contentSupply: ContentSupplyItem[] = [
          { label: demoContentSupply[0].label, value: demoContentSupply[0].value, max: demoContentSupply[0].max },
          { label: demoContentSupply[1].label, value: scheduledCount, max: demoContentSupply[1].max },
          { label: demoContentSupply[2].label, value: demoContentSupply[2].value, max: demoContentSupply[2].max },
        ];

        setState({
          source: "supabase",
          loading: false,
          error: null,
          data: {
            businessName,
            scheduledPosts: demoScheduledPosts,
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
