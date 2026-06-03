import type { RealPortalDataMode } from "@/components/auth/RealPortalDataBoundary";
import type { SaasDataMode } from "./saasTypes";

export function canUseDemoFixtures(dataMode: SaasDataMode): boolean {
  return dataMode === "demo";
}

export function canUseAuthenticatedClientData(dataMode: SaasDataMode): boolean {
  return dataMode === "authenticated_client";
}

export function canUseAuthenticatedTeamData(dataMode: SaasDataMode): boolean {
  return dataMode === "authenticated_team";
}

export function assertNoDemoFixturesInAuthenticatedMode(
  dataMode: SaasDataMode,
  sourceLabel: string,
): void {
  if (
    dataMode === "authenticated_client" ||
    dataMode === "authenticated_team" ||
    dataMode === "future_live_integration"
  ) {
    throw new Error(
      `Demo fixtures are blocked for ${dataMode} in ${sourceLabel}. Use a placeholder repository until future production persistence is approved.`,
    );
  }
}

export function getDataModeLabel(dataMode: SaasDataMode): string {
  switch (dataMode) {
    case "demo":
      return "Demo fixtures";
    case "placeholder_review":
      return "Placeholder review";
    case "authenticated_client":
      return "Authenticated client placeholder";
    case "authenticated_team":
      return "Authenticated team placeholder";
    case "future_live_integration":
      return "Future live integration blocked";
  }
}

export function getDataModeRiskNote(dataMode: SaasDataMode): string {
  switch (dataMode) {
    case "demo":
      return "Demo fixtures are allowed only on explicitly labeled demo surfaces.";
    case "placeholder_review":
      return "Live data is not connected; repositories must return safe empty states.";
    case "authenticated_client":
      return "Authenticated client mode must not use demo fixtures until approved persistence exists.";
    case "authenticated_team":
      return "Authenticated team mode must not use demo fixtures until approved persistence exists.";
    case "future_live_integration":
      return "Future live integration mode requires explicit RR approval before use.";
  }
}

export function mapRealPortalDataModeToSaasDataMode(
  mode: RealPortalDataMode,
): SaasDataMode {
  if (mode.isPublicDemoRoute && mode.allowDemoFixtures) return "demo";
  if (mode.isLiveDataConnected) {
    return mode.portal === "client" ? "authenticated_client" : "authenticated_team";
  }
  return "placeholder_review";
}
