import { useEffect, useMemo, useState } from "react";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { DEFAULT_DEMO_CLIENT_ID } from "@/lib/supabase";
import { useActiveClientPortalContext } from "@/lib/clientPortalContext";
import { mapRealPortalDataModeToSaasDataMode } from "@/domain/saas/dataMode";
import { buildClientPortalPageState, type ClientPortalPageState } from "@/domain/saas/clientPortalState";
import { createSaasRepositoryBundle } from "@/domain/saas/repositoryProvider";
import type { ClientDashboardSummary, ClientMediaSummary, ClientReportSummary, ClientRequestSummary, ClientUpdateSummary } from "@/domain/saas/repositoryContracts";

export interface ClientSaasPortalStateResult {
  loading: boolean;
  pageState: ClientPortalPageState;
  dashboardSummary: ClientDashboardSummary;
  mediaSummary: ClientMediaSummary;
  requestSummary: ClientRequestSummary;
  updateSummaries: ClientUpdateSummary[];
  reportSummaries: ClientReportSummary[];
}

const placeholderPageState = buildClientPortalPageState({
  dataMode: "placeholder_review",
  restaurant: null,
  profile: null,
  plan: null,
});

const placeholderDashboardSummary: ClientDashboardSummary = {
  accountStatus: "Account setup in review",
  planLabel: "Plan details will appear after setup",
  onlinePresenceProgress: "Veroxa is preparing the restaurant workspace.",
  mediaCount: 0,
  requestCount: 0,
  reportCount: 0,
  nextClientAction: "No action is needed until Veroxa asks for input.",
};

const placeholderMediaSummary: ClientMediaSummary = {
  total: 0,
  usable: 0,
  needsBetterMedia: 0,
  used: 0,
  uploadReadinessNotice: "Media sending instructions will appear after setup review.",
};

const placeholderRequestSummary: ClientRequestSummary = {
  total: 0,
  open: 0,
  needsClientConfirmation: 0,
  resolved: 0,
  nextAction: "Requests appear here after the account review workflow is active.",
};

export function useClientSaasPortalState(): ClientSaasPortalStateResult {
  const mode = useRealPortalDataMode();
  const { activeClientId } = useActiveClientPortalContext();
  const dataMode = mapRealPortalDataModeToSaasDataMode(mode);
  const restaurantId = activeClientId ?? DEFAULT_DEMO_CLIENT_ID;
  const bundle = useMemo(() => createSaasRepositoryBundle(dataMode), [dataMode]);
  const [result, setResult] = useState<ClientSaasPortalStateResult>({
    loading: true,
    pageState: placeholderPageState,
    dashboardSummary: placeholderDashboardSummary,
    mediaSummary: placeholderMediaSummary,
    requestSummary: placeholderRequestSummary,
    updateSummaries: [],
    reportSummaries: [],
  });

  useEffect(() => {
    let active = true;
    async function load() {
      const [pageState, dashboardSummary, mediaSummary, requestSummary, updateSummaries, reportSummaries] = await Promise.all([
        bundle.clientPortal.getClientPortalPageState(restaurantId),
        bundle.clientPortal.getClientDashboardSummary(restaurantId),
        bundle.clientPortal.getClientMediaSummary(restaurantId),
        bundle.clientPortal.getClientRequestSummary(restaurantId),
        bundle.clientPortal.getClientUpdateSummaries(restaurantId),
        bundle.clientPortal.getClientReportSummaries(restaurantId),
      ]);
      if (!active) return;
      setResult({ loading: false, pageState, dashboardSummary, mediaSummary, requestSummary, updateSummaries, reportSummaries });
    }
    void load();
    return () => { active = false; };
  }, [bundle, restaurantId]);

  return result;
}
