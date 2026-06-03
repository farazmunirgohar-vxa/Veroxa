import type { SaasDataMode } from "./saasTypes";
import type {
  ActivityLogRepository,
  ClientPortalRepository,
  TeamPortalRepository,
} from "./repositoryContracts";
import {
  createDemoActivityLogRepository,
  createDemoClientPortalRepository,
  createDemoTeamPortalRepository,
  createNoopActivityLogRepository,
  createPlaceholderClientPortalRepository,
  createPlaceholderTeamPortalRepository,
} from "./repositoryAdapters";

export interface SaasRepositoryBundle {
  clientPortal: ClientPortalRepository;
  teamPortal: TeamPortalRepository;
  activityLogs: ActivityLogRepository;
  dataMode: SaasDataMode;
  repositoryMode: "placeholder repository" | "demo repository";
}

export function createSaasRepositoryBundle(dataMode: SaasDataMode): SaasRepositoryBundle {
  if (dataMode === "demo") {
    return {
      clientPortal: createDemoClientPortalRepository(),
      teamPortal: createDemoTeamPortalRepository(),
      activityLogs: createDemoActivityLogRepository(),
      dataMode,
      repositoryMode: "demo repository",
    };
  }

  // authenticated_client/authenticated_team currently stay on placeholder
  // repositories. A future production adapter requires RR approval and must not
  // be connected here until auth, RLS, storage, and activity logging are ready.
  return {
    clientPortal: createPlaceholderClientPortalRepository(),
    teamPortal: createPlaceholderTeamPortalRepository(),
    activityLogs: createNoopActivityLogRepository(),
    dataMode,
    repositoryMode: "placeholder repository",
  };
}
