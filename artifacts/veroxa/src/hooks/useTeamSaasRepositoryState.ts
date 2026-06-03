import { useEffect, useMemo, useState } from "react";
import { useRealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import { mapRealPortalDataModeToSaasDataMode } from "@/domain/saas/dataMode";
import { createSaasRepositoryBundle } from "@/domain/saas/repositoryProvider";
import { buildTeamPortalRepositoryState, type TeamPortalRepositoryState } from "@/domain/saas/teamPortalState";
import type { AccountActivationSummary } from "@/domain/saas/repositoryContracts";
import type { ActivityLogRecord } from "@/domain/saas/saasTypes";

export interface TeamSaasRepositoryStateResult {
  loading: boolean;
  state: TeamPortalRepositoryState;
  activationSummaries: AccountActivationSummary[];
  activityPreview: ActivityLogRecord[];
}

export function useTeamSaasRepositoryState(): TeamSaasRepositoryStateResult {
  const mode = useRealPortalDataMode();
  const dataMode = mapRealPortalDataModeToSaasDataMode(mode);
  const bundle = useMemo(() => createSaasRepositoryBundle(dataMode), [dataMode]);
  const [result, setResult] = useState<TeamSaasRepositoryStateResult>({
    loading: true,
    state: buildTeamPortalRepositoryState(bundle),
    activationSummaries: [],
    activityPreview: [],
  });

  useEffect(() => {
    let active = true;
    async function load() {
      const [state, activationSummaries, activityPreview] = await Promise.all([
        bundle.teamPortal.getTeamPortalRepositoryState(),
        bundle.teamPortal.getAccountActivationSummaries(),
        bundle.teamPortal.getActivityLogPreviews(),
      ]);
      if (!active) return;
      setResult({ loading: false, state, activationSummaries, activityPreview });
    }
    void load();
    return () => { active = false; };
  }, [bundle]);

  return result;
}
